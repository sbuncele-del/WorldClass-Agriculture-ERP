/**
 * Cash Management GL Integration Service
 * 
 * Handles the integration between Cash Management and General Ledger
 * - Creates journal entries for bank transactions
 * - Maps transaction categories to GL accounts
 * - Posts to GL and updates account balances
 * 
 * Based on South African standard Chart of Accounts
 * 
 * Created: January 2026
 */

import pool from '../../../config/database';
import { PoolClient } from 'pg';

/**
 * South African Standard Chart of Accounts for Cash Management
 * 
 * Asset Accounts (1xxx):
 * 1100 - Bank Accounts (Main control account)
 * 1110 - FNB Main Account
 * 1120 - FNB Savings Account
 * 
 * Liability Accounts (2xxx):
 * 2100 - Accounts Payable (Trade Creditors)
 * 
 * Income Accounts (4xxx):
 * 4100 - Sales Revenue
 * 4200 - Interest Income
 * 4300 - Other Income
 * 4400 - Salary/Wages Received (for employee)
 * 
 * Expense Accounts (5xxx-6xxx):
 * 5100 - Cost of Sales
 * 5200 - Purchases
 * 6100 - Salaries & Wages Expense
 * 6200 - Rent Expense
 * 6210 - Utilities - Electricity
 * 6220 - Utilities - Water
 * 6230 - Utilities - Gas
 * 6300 - Telephone & Internet
 * 6400 - Insurance
 * 6500 - Bank Charges
 * 6600 - Professional Fees
 * 6700 - Office Expenses
 * 6800 - Travel & Entertainment
 * 6900 - Advertising & Marketing
 * 7000 - Repairs & Maintenance
 * 7100 - General Expenses
 */

// Category to GL Account mapping
export interface CategoryGLMapping {
  category: string;
  debitAccount: string;  // Account to debit
  creditAccount: string; // Account to credit
  description: string;
  accountType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'PAYMENT' | 'RECEIPT';
}

// Standard category mappings for South African businesses
export const CATEGORY_GL_MAPPINGS: CategoryGLMapping[] = [
  // INCOME CATEGORIES (Deposits - Credit the income account, debit the bank)
  { category: 'SALARY', debitAccount: '1100', creditAccount: '4400', description: 'Salary/Wages Received', accountType: 'INCOME' },
  { category: 'SALES', debitAccount: '1100', creditAccount: '4100', description: 'Sales Revenue', accountType: 'INCOME' },
  { category: 'INTEREST', debitAccount: '1100', creditAccount: '4200', description: 'Interest Income', accountType: 'INCOME' },
  { category: 'REFUND', debitAccount: '1100', creditAccount: '4300', description: 'Refund Received', accountType: 'INCOME' },
  { category: 'OTHER_INCOME', debitAccount: '1100', creditAccount: '4300', description: 'Other Income', accountType: 'INCOME' },
  { category: 'CUSTOMER_PAYMENT', debitAccount: '1100', creditAccount: '1200', description: 'Customer Payment (clears AR)', accountType: 'RECEIPT' },
  
  // EXPENSE CATEGORIES (Withdrawals - Debit the expense account, credit the bank)
  { category: 'RENT', debitAccount: '6200', creditAccount: '1100', description: 'Rent Payment', accountType: 'EXPENSE' },
  { category: 'UTILITIES', debitAccount: '6210', creditAccount: '1100', description: 'Utilities (Electricity, Water, etc.)', accountType: 'EXPENSE' },
  { category: 'ELECTRICITY', debitAccount: '6210', creditAccount: '1100', description: 'Electricity Payment', accountType: 'EXPENSE' },
  { category: 'WATER', debitAccount: '6220', creditAccount: '1100', description: 'Water Payment', accountType: 'EXPENSE' },
  { category: 'GAS', debitAccount: '6230', creditAccount: '1100', description: 'Gas Payment', accountType: 'EXPENSE' },
  { category: 'TELEPHONE', debitAccount: '6300', creditAccount: '1100', description: 'Telephone/Internet', accountType: 'EXPENSE' },
  { category: 'INTERNET', debitAccount: '6300', creditAccount: '1100', description: 'Internet Service', accountType: 'EXPENSE' },
  { category: 'INSURANCE', debitAccount: '6400', creditAccount: '1100', description: 'Insurance Premium', accountType: 'EXPENSE' },
  { category: 'BANK_CHARGES', debitAccount: '6500', creditAccount: '1100', description: 'Bank Fees', accountType: 'EXPENSE' },
  { category: 'BANK_FEES', debitAccount: '6500', creditAccount: '1100', description: 'Bank Charges', accountType: 'EXPENSE' },
  { category: 'PROFESSIONAL_FEES', debitAccount: '6600', creditAccount: '1100', description: 'Professional Services', accountType: 'EXPENSE' },
  { category: 'ACCOUNTING', debitAccount: '6600', creditAccount: '1100', description: 'Accounting Fees', accountType: 'EXPENSE' },
  { category: 'LEGAL', debitAccount: '6600', creditAccount: '1100', description: 'Legal Fees', accountType: 'EXPENSE' },
  { category: 'OFFICE', debitAccount: '6700', creditAccount: '1100', description: 'Office Supplies', accountType: 'EXPENSE' },
  { category: 'TRAVEL', debitAccount: '6800', creditAccount: '1100', description: 'Travel Expenses', accountType: 'EXPENSE' },
  { category: 'ENTERTAINMENT', debitAccount: '6800', creditAccount: '1100', description: 'Entertainment', accountType: 'EXPENSE' },
  { category: 'ADVERTISING', debitAccount: '6900', creditAccount: '1100', description: 'Advertising & Marketing', accountType: 'EXPENSE' },
  { category: 'MARKETING', debitAccount: '6900', creditAccount: '1100', description: 'Marketing Expense', accountType: 'EXPENSE' },
  { category: 'REPAIRS', debitAccount: '7000', creditAccount: '1100', description: 'Repairs & Maintenance', accountType: 'EXPENSE' },
  { category: 'MAINTENANCE', debitAccount: '7000', creditAccount: '1100', description: 'Maintenance', accountType: 'EXPENSE' },
  { category: 'SUPPLIES', debitAccount: '5200', creditAccount: '1100', description: 'Supplies/Purchases', accountType: 'EXPENSE' },
  { category: 'PURCHASE', debitAccount: '5200', creditAccount: '1100', description: 'Purchase', accountType: 'EXPENSE' },
  { category: 'PAYROLL', debitAccount: '6100', creditAccount: '1100', description: 'Payroll Payment', accountType: 'EXPENSE' },
  { category: 'SUPPLIER_PAYMENT', debitAccount: '2100', creditAccount: '1100', description: 'Supplier Payment (clears AP)', accountType: 'PAYMENT' },
  
  // TRANSFER (Bank to Bank)
  { category: 'TRANSFER', debitAccount: '1100', creditAccount: '1100', description: 'Inter-account Transfer', accountType: 'TRANSFER' },
  { category: 'TRANSFER_IN', debitAccount: '1100', creditAccount: '1100', description: 'Transfer In', accountType: 'TRANSFER' },
  { category: 'TRANSFER_OUT', debitAccount: '1100', creditAccount: '1100', description: 'Transfer Out', accountType: 'TRANSFER' },
  
  // DEFAULT/GENERAL
  { category: 'GENERAL', debitAccount: '7100', creditAccount: '1100', description: 'General Expense', accountType: 'EXPENSE' },
  { category: 'OTHER', debitAccount: '7100', creditAccount: '1100', description: 'Other', accountType: 'EXPENSE' },
  { category: 'UNCATEGORIZED', debitAccount: '9999', creditAccount: '1100', description: 'Uncategorized - Review Required', accountType: 'EXPENSE' },
];

export class GLIntegrationService {
  
  /**
   * Get GL mapping for a category
   */
  getCategoryMapping(category: string, transactionType: 'DEPOSIT' | 'WITHDRAWAL'): CategoryGLMapping | null {
    // Normalize category
    const normalizedCategory = (category || 'GENERAL').toUpperCase().replace(/[^A-Z_]/g, '_');
    
    // Find exact match
    let mapping = CATEGORY_GL_MAPPINGS.find(m => m.category === normalizedCategory);
    
    // If not found, try partial match
    if (!mapping) {
      mapping = CATEGORY_GL_MAPPINGS.find(m => 
        normalizedCategory.includes(m.category) || m.category.includes(normalizedCategory)
      );
    }
    
    // Default fallback
    if (!mapping) {
      // For deposits, default to other income; for withdrawals, default to general expense
      if (transactionType === 'DEPOSIT') {
        mapping = CATEGORY_GL_MAPPINGS.find(m => m.category === 'OTHER_INCOME');
      } else {
        mapping = CATEGORY_GL_MAPPINGS.find(m => m.category === 'GENERAL');
      }
    }
    
    return mapping || null;
  }
  
  /**
   * Create journal entry for a cash transaction
   * This is called when a bank statement line is allocated to a transaction
   */
  async createJournalEntry(
    transaction: {
      transaction_id: number;
      transaction_date: Date;
      transaction_type: 'DEPOSIT' | 'WITHDRAWAL';
      category: string;
      amount: number;
      description: string;
      reference?: string;
      account_id: number;
    },
    userId: string,
    tenantId: string,
    client?: PoolClient
  ): Promise<{ journalEntryId: string; journalNumber: string }> {
    const shouldRelease = !client;
    const dbClient = client || await pool.connect();
    
    try {
      if (!client) await dbClient.query('BEGIN');
      
      // Get the GL mapping for this category
      const mapping = this.getCategoryMapping(transaction.category, transaction.transaction_type);
      if (!mapping) {
        throw new Error(`No GL mapping found for category: ${transaction.category}`);
      }
      
      // Get the bank account's GL account code (if set), otherwise use default 1100
      const accountResult = await dbClient.query(
        'SELECT gl_account_code FROM cash_bank_accounts WHERE account_id = $1',
        [transaction.account_id]
      );
      const bankGLCode = accountResult.rows[0]?.gl_account_code || '1100';
      
      // Determine debit and credit accounts based on transaction type
      let debitAccountCode: string;
      let creditAccountCode: string;
      let debitAmount: number = transaction.amount;
      let creditAmount: number = transaction.amount;
      
      if (transaction.transaction_type === 'DEPOSIT') {
        // Money coming IN: Debit Bank, Credit Income/Source
        debitAccountCode = bankGLCode;
        creditAccountCode = mapping.creditAccount === '1100' ? mapping.debitAccount : mapping.creditAccount;
      } else {
        // Money going OUT: Debit Expense, Credit Bank
        debitAccountCode = mapping.debitAccount === '1100' ? mapping.creditAccount : mapping.debitAccount;
        creditAccountCode = bankGLCode;
      }
      
      // Generate journal number
      const journalNumber = await this.generateJournalNumber(transaction.transaction_date, dbClient);
      
      // Create journal entry header
      const headerResult = await dbClient.query(`
        INSERT INTO journal_entries (
          tenant_id,
          journal_number,
          journal_date,
          description,
          reference,
          status,
          source,
          source_document_type,
          source_document_id,
          total_debit,
          total_credit,
          created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, 'POSTED', 'BANK_RECON', 'BANK_TRANSACTION', $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING journal_entry_id
      `, [
        tenantId,
        journalNumber,
        transaction.transaction_date,
        `${mapping.description}: ${transaction.description}`,
        transaction.reference || `TXN-${transaction.transaction_id}`,
        transaction.transaction_id,
        debitAmount,
        creditAmount,
        userId
      ]);
      
      const journalEntryId = headerResult.rows[0].journal_entry_id;
      
      // Get account IDs from chart of accounts
      const debitAccountResult = await dbClient.query(
        'SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
        [tenantId, debitAccountCode]
      );
      const creditAccountResult = await dbClient.query(
        'SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
        [tenantId, creditAccountCode]
      );
      
      const debitAccountId = debitAccountResult.rows[0]?.account_id;
      const creditAccountId = creditAccountResult.rows[0]?.account_id;
      
      if (!debitAccountId || !creditAccountId) {
        // Auto-create missing accounts
        if (!debitAccountId) {
          await this.ensureAccountExists(debitAccountCode, tenantId, dbClient);
        }
        if (!creditAccountId) {
          await this.ensureAccountExists(creditAccountCode, tenantId, dbClient);
        }
        // Re-fetch
        const dResult = await dbClient.query(
          'SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
          [tenantId, debitAccountCode]
        );
        const cResult = await dbClient.query(
          'SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
          [tenantId, creditAccountCode]
        );
        if (!dResult.rows[0]?.account_id || !cResult.rows[0]?.account_id) {
          throw new Error(`Failed to create accounts: ${debitAccountCode}, ${creditAccountCode}`);
        }
      }
      
      // Create journal entry lines
      // Line 1: Debit
      await dbClient.query(`
        INSERT INTO journal_entry_lines (
          journal_entry_id,
          line_number,
          account_code,
          debit_amount,
          credit_amount,
          description,
          created_at
        ) VALUES ($1, 1, $2, $3, 0, $4, CURRENT_TIMESTAMP)
      `, [
        journalEntryId,
        debitAccountCode,
        debitAmount,
        `Debit: ${mapping.description}`
      ]);
      
      // Line 2: Credit
      await dbClient.query(`
        INSERT INTO journal_entry_lines (
          journal_entry_id,
          line_number,
          account_code,
          debit_amount,
          credit_amount,
          description,
          created_at
        ) VALUES ($1, 2, $2, 0, $3, $4, CURRENT_TIMESTAMP)
      `, [
        journalEntryId,
        creditAccountCode,
        creditAmount,
        `Credit: ${mapping.description}`
      ]);
      
      // Update account balances
      await this.updateAccountBalances(debitAccountCode, creditAccountCode, transaction.amount, tenantId, dbClient);
      
      // Update cash transaction with journal entry reference
      await dbClient.query(`
        UPDATE cash_transactions SET
          journal_entry_id = $1,
          posted_to_gl = true,
          posted_date = CURRENT_TIMESTAMP,
          posted_by = $2
        WHERE transaction_id = $3
      `, [journalEntryId, userId, transaction.transaction_id]);
      
      if (!client) await dbClient.query('COMMIT');
      
      return { journalEntryId, journalNumber };
      
    } catch (error) {
      if (!client) await dbClient.query('ROLLBACK');
      throw error;
    } finally {
      if (shouldRelease) dbClient.release();
    }
  }
  
  /**
   * Generate unique journal number
   */
  private async generateJournalNumber(date: Date, client: PoolClient): Promise<string> {
    const year = new Date(date).getFullYear();
    const month = String(new Date(date).getMonth() + 1).padStart(2, '0');
    
    const result = await client.query(`
      SELECT journal_number FROM journal_entries 
      WHERE journal_number LIKE $1 
      ORDER BY journal_number DESC 
      LIMIT 1
    `, [`JV-${year}${month}-%`]);
    
    let nextNumber = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].journal_number;
      const match = lastNumber.match(/JV-\d{6}-(\d{5})/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `JV-${year}${month}-${String(nextNumber).padStart(5, '0')}`;
  }
  
  /**
   * Get account ID from code
   */
  private async getAccountId(accountCode: string, tenantId: string, client: PoolClient): Promise<number> {
    const result = await client.query(
      'SELECT account_id FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
      [tenantId, accountCode]
    );
    if (result.rows.length === 0) {
      throw new Error(`Account not found: ${accountCode}`);
    }
    return result.rows[0].account_id;
  }
  
  /**
   * Ensure account exists in chart of accounts
   */
  private async ensureAccountExists(accountCode: string, tenantId: string, client: PoolClient): Promise<void> {
    // Check if account exists
    const exists = await client.query(
      'SELECT 1 FROM chart_of_accounts WHERE tenant_id = $1 AND code = $2',
      [tenantId, accountCode]
    );
    
    if (exists.rows.length > 0) return;
    
    // Determine account type and name from code
    const firstDigit = accountCode.charAt(0);
    let accountType = 'EXPENSE';
    let accountName = `Account ${accountCode}`;
    let normalBalance = 'DEBIT';
    
    // Standard SA chart of accounts numbering
    switch (firstDigit) {
      case '1':
        accountType = 'ASSET';
        accountName = accountCode === '1100' ? 'Bank Account' : 
                      accountCode === '1200' ? 'Accounts Receivable' : `Asset ${accountCode}`;
        normalBalance = 'DEBIT';
        break;
      case '2':
        accountType = 'LIABILITY';
        accountName = accountCode === '2100' ? 'Accounts Payable' : `Liability ${accountCode}`;
        normalBalance = 'CREDIT';
        break;
      case '3':
        accountType = 'EQUITY';
        accountName = `Equity ${accountCode}`;
        normalBalance = 'CREDIT';
        break;
      case '4':
        accountType = 'REVENUE';
        accountName = accountCode === '4100' ? 'Sales Revenue' :
                      accountCode === '4200' ? 'Interest Income' :
                      accountCode === '4300' ? 'Other Income' :
                      accountCode === '4400' ? 'Salary/Wages Received' : `Income ${accountCode}`;
        normalBalance = 'CREDIT';
        break;
      case '5':
      case '6':
      case '7':
        accountType = 'EXPENSE';
        // Get from mapping
        const mapping = CATEGORY_GL_MAPPINGS.find(m => m.debitAccount === accountCode || m.creditAccount === accountCode);
        accountName = mapping?.description || `Expense ${accountCode}`;
        normalBalance = 'DEBIT';
        break;
      case '9':
        accountType = 'EXPENSE';
        accountName = 'Suspense/Uncategorized';
        normalBalance = 'DEBIT';
        break;
    }
    
    // Insert new account - using correct column names from schema
    await client.query(`
      INSERT INTO chart_of_accounts (
        tenant_id, code, name, account_type, 
        normal_balance, is_active, is_header, account_level, 
        allows_manual_entries, is_system_account, currency,
        current_balance
      ) VALUES ($1, $2, $3, $4, $5, true, false, 1, true, false, 'ZAR', 0)
    `, [tenantId, accountCode, accountName, accountType, normalBalance]);
  }
  
  /**
   * Update account balances after posting
   */
  private async updateAccountBalances(
    debitCode: string, 
    creditCode: string, 
    amount: number, 
    tenantId: string, 
    client: PoolClient
  ): Promise<void> {
    // Update debit account - increase ytd_debit
    // For DEBIT-normal accounts (Asset/Expense): balance increases
    await client.query(`
      UPDATE chart_of_accounts 
      SET ytd_debit = COALESCE(ytd_debit, 0) + $1,
          current_balance = CASE 
            WHEN normal_balance = 'DEBIT' THEN COALESCE(ytd_debit, 0) + $1 - COALESCE(ytd_credit, 0)
            ELSE COALESCE(ytd_credit, 0) - (COALESCE(ytd_debit, 0) + $1)
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2 AND code = $3
    `, [amount, tenantId, debitCode]);
    
    // Update credit account - increase ytd_credit
    // For CREDIT-normal accounts (Liability/Equity/Revenue): balance increases
    await client.query(`
      UPDATE chart_of_accounts 
      SET ytd_credit = COALESCE(ytd_credit, 0) + $1,
          current_balance = CASE 
            WHEN normal_balance = 'CREDIT' THEN COALESCE(ytd_credit, 0) + $1 - COALESCE(ytd_debit, 0)
            ELSE COALESCE(ytd_debit, 0) - (COALESCE(ytd_credit, 0) + $1)
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $2 AND code = $3
    `, [amount, tenantId, creditCode]);
  }
  
  /**
   * Get list of all available categories
   */
  getAvailableCategories(): { category: string; description: string; type: string }[] {
    return CATEGORY_GL_MAPPINGS.map(m => ({
      category: m.category,
      description: m.description,
      type: m.accountType
    }));
  }
  
  /**
   * Get trial balance
   */
  async getTrialBalance(tenantId: string): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        code as account_code,
        name as account_name,
        account_type,
        normal_balance,
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(ytd_debit, 0) as total_debits,
        COALESCE(ytd_credit, 0) as total_credits,
        -- For trial balance: show net balance in appropriate column
        CASE 
          WHEN COALESCE(ytd_debit, 0) > COALESCE(ytd_credit, 0) 
          THEN COALESCE(ytd_debit, 0) - COALESCE(ytd_credit, 0)
          ELSE 0
        END as debit_balance,
        CASE 
          WHEN COALESCE(ytd_credit, 0) > COALESCE(ytd_debit, 0) 
          THEN COALESCE(ytd_credit, 0) - COALESCE(ytd_debit, 0)
          ELSE 0
        END as credit_balance
      FROM chart_of_accounts
      WHERE tenant_id = $1
        AND is_active = true
        AND is_header = false
        AND (COALESCE(ytd_debit, 0) != 0 OR COALESCE(ytd_credit, 0) != 0)
      ORDER BY code
    `, [tenantId]);
    
    return result.rows;
  }
  
  /**
   * Get journal entries for a period
   */
  async getJournalEntries(
    tenantId: string, 
    filters: { 
      startDate?: string; 
      endDate?: string; 
      sourceType?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ entries: any[]; total: number }> {
    let query = `
      SELECT 
        je.journal_entry_id,
        je.journal_number,
        je.journal_date,
        je.description,
        je.reference,
        je.status,
        je.source,
        je.source_document_type,
        je.source_document_id,
        je.total_debit,
        je.total_credit,
        je.created_by,
        je.created_at,
        json_agg(
          json_build_object(
            'line_number', jel.line_number,
            'account_code', jel.account_code,
            'debit_amount', jel.debit_amount,
            'credit_amount', jel.credit_amount,
            'description', jel.description
          ) ORDER BY jel.line_number
        ) as lines
      FROM journal_entries je
      LEFT JOIN journal_entry_lines jel ON je.journal_entry_id = jel.journal_entry_id
      WHERE je.tenant_id = $1
    `;
    
    const params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (filters.startDate) {
      query += ` AND je.journal_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }
    if (filters.endDate) {
      query += ` AND je.journal_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }
    if (filters.sourceType) {
      query += ` AND je.source = $${paramIndex}`;
      params.push(filters.sourceType);
      paramIndex++;
    }
    if (filters.status) {
      query += ` AND je.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }
    
    query += ` GROUP BY je.journal_entry_id ORDER BY je.journal_date DESC, je.journal_number DESC`;
    
    // Get total count
    const countResult = await pool.query(
      query.replace(/SELECT[\s\S]*FROM/, 'SELECT COUNT(DISTINCT je.journal_entry_id) as total FROM').replace(/GROUP BY[\s\S]*$/, ''),
      params
    );
    const total = parseInt(countResult.rows[0]?.total || '0');
    
    // Add pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }
    
    const result = await pool.query(query, params);
    
    return { entries: result.rows, total };
  }

  /**
   * Post existing unposted transactions to GL
   * Used to backfill GL entries for transactions that were created before GL integration
   */
  async postUnpostedTransactionsToGL(tenantId: string, userId: string): Promise<{
    posted: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      posted: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Get all cash transactions that have a category but are not posted to GL
    const unpostedResult = await pool.query(`
      SELECT 
        ct.transaction_id,
        ct.description,
        ct.reference,
        ct.transaction_date,
        ct.amount,
        ct.transaction_type,
        ct.account_id,
        bsl.confirmed_category as category
      FROM cash_transactions ct
      JOIN cash_bank_statement_lines bsl ON ct.statement_line_id = bsl.line_id
      WHERE ct.tenant_id = $1
        AND (ct.posted_to_gl IS NULL OR ct.posted_to_gl = false)
        AND bsl.confirmed_category IS NOT NULL
      ORDER BY ct.transaction_date
    `, [tenantId]);

    console.log(`Found ${unpostedResult.rows.length} unposted transactions to process`);

    for (const txn of unpostedResult.rows) {
      try {
        const transaction = {
          transaction_id: txn.transaction_id,
          description: txn.description || '',
          reference: txn.reference,
          transaction_date: txn.transaction_date,
          amount: parseFloat(txn.amount),
          transaction_type: txn.transaction_type as 'DEPOSIT' | 'WITHDRAWAL',
          category: txn.category,
          account_id: txn.account_id || 1
        };

        await this.createJournalEntry(transaction, userId, tenantId);
        results.posted++;
      } catch (error: any) {
        results.errors.push(`Transaction ${txn.transaction_id}: ${error.message}`);
        results.skipped++;
      }
    }

    return results;
  }

  /**
   * Repost a single transaction to GL
   * Used when category changes or to fix GL entries
   */
  async repostTransactionToGL(transactionId: number, category: string, tenantId: string, userId: string): Promise<{
    success: boolean;
    journalEntryId?: number;
    journalNumber?: string;
    error?: string;
  }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get transaction details
      const txnResult = await client.query(`
        SELECT 
          ct.transaction_id,
          ct.description,
          ct.reference,
          ct.transaction_date,
          ct.amount,
          ct.transaction_type,
          ct.account_id,
          ct.journal_entry_id
        FROM cash_transactions ct
        WHERE ct.transaction_id = $1 AND ct.tenant_id = $2
      `, [transactionId, tenantId]);

      if (txnResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const txn = txnResult.rows[0];

      // If already posted, reverse the old entry first
      if (txn.journal_entry_id) {
        await client.query(`
          UPDATE journal_entries SET status = 'REVERSED', updated_at = CURRENT_TIMESTAMP
          WHERE journal_entry_id = $1
        `, [txn.journal_entry_id]);
      }

      // Create new journal entry
      const transaction = {
        transaction_id: txn.transaction_id,
        description: txn.description || '',
        reference: txn.reference,
        transaction_date: txn.transaction_date,
        amount: parseFloat(txn.amount),
        transaction_type: txn.transaction_type as 'DEPOSIT' | 'WITHDRAWAL',
        category: category,
        account_id: txn.account_id || 1
      };

      const result = await this.createJournalEntry(transaction, userId, tenantId, client);

      await client.query('COMMIT');

      return {
        success: true,
        journalEntryId: parseInt(result.journalEntryId),
        journalNumber: result.journalNumber
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error.message
      };
    } finally {
      client.release();
    }
  }
}

export default new GLIntegrationService();
