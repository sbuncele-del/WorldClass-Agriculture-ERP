import { Pool } from 'pg';

export interface ChartAccount {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parent_account_id?: number;
  description?: string;
  is_active: boolean;
  is_system_account: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ChartOfAccountsService {
  private pool: Pool;

  constructor() {
    // Determine SSL config - only use SSL for AWS RDS, not for local/Docker PostgreSQL
    const sslConfig = process.env.DB_HOST?.includes('rds.amazonaws.com') 
      ? { rejectUnauthorized: false }
      : (process.env.DB_SSL === 'false' ? false : undefined);

    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: sslConfig,
    });
  }

  async getAllAccounts(filters?: {
    accountType?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ChartAccount[]> {
    let query = `
      SELECT 
        account_id, account_code, account_name, account_type,
        parent_account_id, description, is_active, is_system_account,
        created_at, updated_at
      FROM chart_of_accounts
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.accountType) {
      query += ` AND account_type = $${paramIndex}`;
      params.push(filters.accountType);
      paramIndex++;
    }

    if (filters?.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (account_code ILIKE $${paramIndex} OR account_name ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY account_code`;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getAccountById(accountId: number): Promise<ChartAccount | null> {
    const result = await this.pool.query(
      `SELECT 
        account_id, account_code, account_name, account_type,
        parent_account_id, description, is_active, is_system_account,
        created_at, updated_at
      FROM chart_of_accounts
      WHERE account_id = $1`,
      [accountId]
    );
    return result.rows[0] || null;
  }

  async createAccount(data: {
    account_code: string;
    account_name: string;
    account_type: string;
    parent_account_id?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<ChartAccount> {
    const result = await this.pool.query(
      `INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, parent_account_id,
        description, is_active, is_system_account, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
      RETURNING *`,
      [
        data.account_code,
        data.account_name,
        data.account_type,
        data.parent_account_id || null,
        data.description || null,
        data.is_active !== undefined ? data.is_active : true,
      ]
    );
    return result.rows[0];
  }

  async updateAccount(
    accountId: number,
    data: {
      account_name?: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<ChartAccount | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.account_name !== undefined) {
      updates.push(`account_name = $${paramIndex}`);
      params.push(data.account_name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.getAccountById(accountId);
    }

    updates.push(`updated_at = NOW()`);
    params.push(accountId);

    const result = await this.pool.query(
      `UPDATE chart_of_accounts
      SET ${updates.join(', ')}
      WHERE account_id = $${paramIndex}
      RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  async deleteAccount(accountId: number): Promise<boolean> {
    // Check if account is used in journal entries
    const usageCheck = await this.pool.query(
      `SELECT COUNT(*) as count FROM journal_entry_lines WHERE account_id = $1`,
      [accountId]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete account that has transactions');
    }

    const result = await this.pool.query(
      `DELETE FROM chart_of_accounts WHERE account_id = $1 AND is_system_account = false`,
      [accountId]
    );

    return result.rowCount > 0;
  }

  async getChildAccounts(parentId: number): Promise<ChartAccount[]> {
    const result = await this.pool.query(
      `SELECT * FROM chart_of_accounts WHERE parent_account_id = $1 ORDER BY account_code`,
      [parentId]
    );
    return result.rows;
  }

  async getAccountTree(): Promise<any[]> {
    // Get all accounts
    const result = await this.pool.query(
      `SELECT * FROM chart_of_accounts WHERE is_active = true ORDER BY account_code`
    );

    const accounts = result.rows;
    const accountMap = new Map<number, any>();
    const rootAccounts: any[] = [];

    // Build map
    accounts.forEach((acc) => {
      accountMap.set(acc.account_id, { ...acc, children: [] });
    });

    // Build tree
    accounts.forEach((acc) => {
      const node = accountMap.get(acc.account_id);
      if (acc.parent_account_id) {
        const parent = accountMap.get(acc.parent_account_id);
        if (parent) {
          parent.children.push(node);
        } else {
          rootAccounts.push(node);
        }
      } else {
        rootAccounts.push(node);
      }
    });

    return rootAccounts;
  }

  async seedDefaultAccounts(): Promise<{ created: number; accounts: ChartAccount[] }> {
    const defaultAccounts = [
      // Assets (1xxx)
      { code: '1000', name: 'Assets', type: 'ASSET', parent: null },
      { code: '1100', name: 'Bank Accounts', type: 'ASSET', parent: null },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', parent: null },
      { code: '1300', name: 'Inventory', type: 'ASSET', parent: null },
      { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', parent: null },
      { code: '1500', name: 'Fixed Assets', type: 'ASSET', parent: null },
      { code: '1510', name: 'Property & Equipment', type: 'ASSET', parent: null },
      { code: '1520', name: 'Accumulated Depreciation', type: 'ASSET', parent: null },

      // Liabilities (2xxx)
      { code: '2000', name: 'Liabilities', type: 'LIABILITY', parent: null },
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', parent: null },
      { code: '2200', name: 'Accrued Expenses', type: 'LIABILITY', parent: null },
      { code: '2300', name: 'Short-term Loans', type: 'LIABILITY', parent: null },
      { code: '2400', name: 'Long-term Loans', type: 'LIABILITY', parent: null },
      { code: '2500', name: 'Tax Payable', type: 'LIABILITY', parent: null },

      // Equity (3xxx)
      { code: '3000', name: 'Equity', type: 'EQUITY', parent: null },
      { code: '3100', name: 'Share Capital', type: 'EQUITY', parent: null },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', parent: null },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', parent: null },

      // Revenue (4xxx)
      { code: '4000', name: 'Revenue', type: 'REVENUE', parent: null },
      { code: '4100', name: 'Sales Revenue', type: 'REVENUE', parent: null },
      { code: '4200', name: 'Service Revenue', type: 'REVENUE', parent: null },
      { code: '4300', name: 'Other Income', type: 'REVENUE', parent: null },
      { code: '4400', name: 'Interest Income', type: 'REVENUE', parent: null },

      // Cost of Sales (5xxx)
      { code: '5000', name: 'Cost of Sales', type: 'EXPENSE', parent: null },
      { code: '5100', name: 'Bank Charges & Fees', type: 'EXPENSE', parent: null },
      { code: '5200', name: 'Purchase Costs', type: 'EXPENSE', parent: null },
      { code: '5300', name: 'Direct Labor', type: 'EXPENSE', parent: null },

      // Operating Expenses (6xxx)
      { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', parent: null },
      { code: '6100', name: 'Salaries & Wages', type: 'EXPENSE', parent: null },
      { code: '6200', name: 'Rent Expense', type: 'EXPENSE', parent: null },
      { code: '6300', name: 'Utilities', type: 'EXPENSE', parent: null },
      { code: '6400', name: 'Office Supplies', type: 'EXPENSE', parent: null },
      { code: '6500', name: 'Insurance', type: 'EXPENSE', parent: null },
      { code: '6600', name: 'Marketing & Advertising', type: 'EXPENSE', parent: null },
      { code: '6700', name: 'Travel & Entertainment', type: 'EXPENSE', parent: null },
      { code: '6800', name: 'Professional Fees', type: 'EXPENSE', parent: null },
      { code: '6900', name: 'Depreciation Expense', type: 'EXPENSE', parent: null },
      { code: '6950', name: 'Miscellaneous Expenses', type: 'EXPENSE', parent: null },
    ];

    const createdAccounts: ChartAccount[] = [];

    for (const acc of defaultAccounts) {
      // Check if account already exists
      const existing = await this.pool.query(
        `SELECT account_id FROM chart_of_accounts WHERE account_code = $1`,
        [acc.code]
      );

      if (existing.rows.length === 0) {
        const result = await this.pool.query(
          `INSERT INTO chart_of_accounts (
            account_code, account_name, account_type, is_active, is_system_account, created_at, updated_at
          ) VALUES ($1, $2, $3, true, true, NOW(), NOW())
          RETURNING *`,
          [acc.code, acc.name, acc.type]
        );
        createdAccounts.push(result.rows[0]);
      }
    }

    return { created: createdAccounts.length, accounts: createdAccounts };
  }
}
