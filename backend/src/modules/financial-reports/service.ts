import { Pool } from 'pg';

export class FinancialReportsService {
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
      ssl: sslConfig
    });
  }

  /**
   * Get Trial Balance
   * Shows all accounts with their debit/credit totals and balances
   */
  async getTrialBalance(filters: {
    asOfDate?: string;
    tenantId: string;
    includeZeroBalances?: boolean;
  }) {
    const asOfCondition = filters.asOfDate
      ? 'AND je.entry_date <= $1'
      : '';
    const params = filters.asOfDate ? [filters.asOfDate] : [];

    const query = `
      SELECT 
        coa.account_code as account_code,
        coa.account_name as account_name,
        coa.account_type,
        coa.parent_account_id,
        COALESCE(SUM(jel.debit_amount), 0) as total_debits,
        COALESCE(SUM(jel.credit_amount), 0) as total_credits,
        COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.account_id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE coa.is_active = true
        AND (UPPER(je.status) = 'POSTED' OR jel.journal_entry_id IS NULL)
        ${asOfCondition}
      GROUP BY coa.account_id, coa.account_code, coa.account_name, coa.account_type, coa.parent_account_id
      ${filters.includeZeroBalances ? '' : 'HAVING COALESCE(SUM(jel.debit_amount), 0) <> 0 OR COALESCE(SUM(jel.credit_amount), 0) <> 0'}
      ORDER BY coa.account_code
    `;

    const result = await this.pool.query(query, params);

    // Calculate totals
    const totals = result.rows.reduce(
      (acc, row) => ({
        totalDebits: acc.totalDebits + parseFloat(row.total_debits),
        totalCredits: acc.totalCredits + parseFloat(row.total_credits),
      }),
      { totalDebits: 0, totalCredits: 0 }
    );

    return {
      accounts: result.rows,
      totals,
      asOfDate: filters.asOfDate || new Date().toISOString().split('T')[0],
      inBalance: Math.abs(totals.totalDebits - totals.totalCredits) < 0.01,
    };
  }

  /**
   * Get Balance Sheet
   * Assets, Liabilities, and Equity
   */
  async getBalanceSheet(filters: {
    asOfDate?: string;
    tenantId: string;
  }) {
    const trialBalance = await this.getTrialBalance({
      ...filters,
      includeZeroBalances: false,
    });

    const assets = trialBalance.accounts.filter(
      (a) => a.account_type === 'ASSET'
    );
    const liabilities = trialBalance.accounts.filter(
      (a) => a.account_type === 'LIABILITY'
    );
    const equity = trialBalance.accounts.filter(
      (a) => a.account_type === 'EQUITY'
    );

    const totalAssets = assets.reduce(
      (sum, a) => sum + parseFloat(a.balance),
      0
    );
    const totalLiabilities = liabilities.reduce(
      (sum, a) => sum + parseFloat(a.balance),
      0
    );
    const totalEquity = equity.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    return {
      assets,
      liabilities,
      equity,
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        netWorth: totalAssets - totalLiabilities,
      },
      asOfDate: filters.asOfDate || new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Get Profit & Loss Statement (Income Statement)
   * Revenue and Expenses for a period
   */
  async getProfitAndLoss(filters: {
    fromDate: string;
    toDate: string;
    tenantId: string;
  }) {
    const query = `
      SELECT 
        coa.account_code as account_code,
        coa.account_name as account_name,
        coa.account_type,
        COALESCE(SUM(jel.debit_amount), 0) as debits,
        COALESCE(SUM(jel.credit_amount), 0) as credits
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE UPPER(je.status) = 'POSTED'
        AND je.posting_date BETWEEN $1 AND $2
        AND UPPER(coa.account_type) IN ('REVENUE', 'EXPENSE')
      GROUP BY coa.account_code, coa.account_name, coa.account_type
      ORDER BY coa.account_type DESC, coa.account_code
    `;

    const result = await this.pool.query(query, [
      filters.fromDate,
      filters.toDate,
    ]);

    const revenue = result.rows
      .filter((r) => r.account_type.toUpperCase() === 'REVENUE')
      .map((r) => ({
        ...r,
        amount: parseFloat(r.credits) - parseFloat(r.debits),
      }));

    const expenses = result.rows
      .filter((r) => r.account_type.toUpperCase() === 'EXPENSE')
      .map((r) => ({
        ...r,
        amount: parseFloat(r.debits) - parseFloat(r.credits),
      }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);

    return {
      revenue,
      expenses,
      totals: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        grossMargin:
          totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      },
      period: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      },
    };
  }

  /**
   * Get Account Transactions
   * All GL transactions for a specific account
   */
  async getAccountTransactions(filters: {
    accountId: number;
    fromDate?: string;
    toDate?: string;
    tenantId: string;
    limit?: number;
    offset?: number;
  }) {
    const dateCondition =
      filters.fromDate && filters.toDate
        ? 'AND je.entry_date BETWEEN $2 AND $3'
        : '';
    
    const params: any[] = [filters.accountId];
    if (filters.fromDate && filters.toDate) {
      params.push(filters.fromDate, filters.toDate);
    }

    const query = `
      SELECT 
        jel.id as id,
        je.posting_date as transaction_date,
        je.posting_date,
        jel.description as description,
        je.reference,
        jel.debit_amount,
        jel.credit_amount,
        0 as running_balance,
        je.source_type,
        je.source_id,
        je.entry_number as journal_entry_number,
        je.posted_at
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE jel.account_id = $1 
        AND UPPER(je.status) = 'POSTED'
        ${dateCondition}
      ORDER BY je.entry_date DESC, jel.line_id DESC
      ${filters.limit ? `LIMIT ${filters.limit}` : ''}
      ${filters.offset ? `OFFSET ${filters.offset}` : ''}
    `;

    const result = await this.pool.query(query, params);

    // Get account info - calculate current balance from all transactions
    const accountQuery = `
      SELECT 
        coa.account_code,
        coa.account_name,
        coa.account_type,
        COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as current_balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON coa.account_id = jel.account_id
      LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE coa.account_id = $1
        AND (UPPER(je.status) = 'POSTED' OR jel.journal_entry_id IS NULL)
      GROUP BY coa.account_id, coa.account_code, coa.account_name, coa.account_type
    `;
    const accountResult = await this.pool.query(accountQuery, [
      filters.accountId,
    ]);

    return {
      account: accountResult.rows[0] || null,
      transactions: result.rows,
      count: result.rows.length,
    };
  }

  /**
   * Get Cash Flow Statement
   * Operating, Investing, and Financing activities
   */
  async getCashFlow(filters: {
    fromDate: string;
    toDate: string;
    tenantId: string;
  }) {
    // Get all cash/bank account transactions
    const query = `
      SELECT 
        je.posting_date as transaction_date,
        coa.account_code,
        coa.account_name,
        jel.description as description,
        jel.debit_amount,
        jel.credit_amount,
        je.source_type
      FROM journal_entry_lines jel
      JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE UPPER(je.status) = 'POSTED'
        AND je.posting_date BETWEEN $1 AND $2
        AND coa.account_type = 'ASSET'
        AND (coa.account_code LIKE '11%' OR coa.account_name ILIKE '%cash%' OR coa.account_name ILIKE '%bank%')
      ORDER BY je.entry_date, jel.line_id
    `;

    const result = await this.pool.query(query, [
      filters.fromDate,
      filters.toDate,
    ]);

    // Simple cash flow: total cash in - total cash out
    const cashIn = result.rows.reduce(
      (sum, t) => sum + parseFloat(t.debit_amount || '0'),
      0
    );
    const cashOut = result.rows.reduce(
      (sum, t) => sum + parseFloat(t.credit_amount || '0'),
      0
    );

    return {
      transactions: result.rows,
      summary: {
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
      },
      period: {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      },
    };
  }
}
