import { Request, Response } from 'express';
import { JournalEntryService } from '../services/journal-entry.service';
// import { JournalSource } from '../models/journal-entry.model';
import { query } from '../../../config/database';
import { COA_TEMPLATES } from '../templates/coa-templates';

const journalService = new JournalEntryService();

/**
 * Financial Controller
 * REST API endpoints for financial management
 */

// ===== JOURNAL ENTRIES =====

/**
 * POST /api/financial/journal-entries
 * Create a new journal entry
 */
export const createJournalEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.body.user_id || 'system'; // From auth middleware
    const journalEntryId = await journalService.createJournalEntry(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id: journalEntryId },
      message: 'Journal entry created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/journal-entries
 * List all journal entries with filters
 */
export const listJournalEntries = async (req: Request, res: Response) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      status, 
      from_date, 
      to_date,
      search 
    } = req.query;
    
    // Build WHERE conditions
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    
    if (from_date) {
      params.push(from_date);
      conditions.push(`entry_date >= $${params.length}`);
    }
    
    if (to_date) {
      params.push(to_date);
      conditions.push(`entry_date <= $${params.length}`);
    }
    
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(entry_number ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM journal_entries 
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated entries
    params.push(Number(limit));
    params.push(Number(offset));
    const entriesQuery = `
      SELECT 
        entry_id as id,
        entry_number as journal_number,
        entry_date as journal_date,
        entry_date as posting_date,
        description,
        status,
        0 as total_debit,
        0 as total_credit,
        created_at,
        created_by,
        NULL as posted_at,
        NULL as posted_by
      FROM journal_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY entry_date DESC, created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    
    const entriesResult = await query(entriesQuery, params);
    
    res.json({
      success: true,
      data: entriesResult.rows,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/journal-entries/:id
 * Get single journal entry with lines
 */
export const getJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Get journal entry header
    const headerQuery = `
      SELECT 
        entry_id as id,
        entry_number as journal_number,
        entry_date as journal_date,
        entry_date as posting_date,
        NULL as fiscal_year,
        NULL as fiscal_period,
        description,
        reference,
        'MANUAL' as journal_source,
        NULL as source_document_id,
        status,
        0 as total_debit,
        0 as total_credit,
        'USD' as currency_code,
        1.0 as exchange_rate,
        NULL as reverses_journal_id,
        NULL as reversed_by_journal_id,
        NULL as reversal_reason,
        created_at,
        created_by,
        NULL as posted_at,
        NULL as posted_by
      FROM journal_entries
      WHERE entry_id = $1
    `;
    
    const headerResult = await query(headerQuery, [id]);
    
    if (headerResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Journal entry not found',
      });
      return;
    }
    
    // Get journal entry lines with account details
    const linesQuery = `
      SELECT 
        jel.line_id as id,
        jel.line_id as line_number,
        jel.account_id,
        coa.account_code as account_code,
        coa.account_name as account_name,
        jel.debit_amount,
        jel.credit_amount,
        jel.debit_amount as debit_amount_base,
        jel.credit_amount as credit_amount_base,
        jel.description as line_description,
        NULL as cost_center,
        NULL as department,
        NULL as project,
        NULL as product,
        NULL as location,
        NULL as tax_code,
        0 as tax_amount
      FROM journal_entry_lines jel
      INNER JOIN chart_of_accounts coa ON coa.account_id = jel.account_id
      WHERE jel.entry_id = $1
      ORDER BY jel.line_id
    `;
    
    const linesResult = await query(linesQuery, [id]);
    
    const entry = {
      ...headerResult.rows[0],
      lines: linesResult.rows,
    };
    
    res.json({
      success: true,
      data: entry,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/financial/journal-entries/:id/post
 * Post a journal entry to the ledger
 */
export const postJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await journalService.postJournalEntry(id, userId);
    
    res.json({
      success: true,
      message: 'Journal entry posted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/financial/journal-entries/:id/reverse
 * Reverse a posted journal entry
 */
export const reverseJournalEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reversal_date, reason } = req.body;
    const userId = req.body.user_id || 'system';
    
    const reversalId = await journalService.reverseJournalEntry(
      id,
      new Date(reversal_date),
      reason,
      userId
    );
    
    res.json({
      success: true,
      data: { reversal_id: reversalId },
      message: 'Journal entry reversed successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== CHART OF ACCOUNTS =====

/**
 * GET /api/financial/chart-of-accounts
 * Get all accounts (hierarchical)
 */
export const getChartOfAccounts = async (req: Request, res: Response) => {
  try {
    const { include_inactive = 'false' } = req.query;
    
    const conditions: string[] = [];
    if (include_inactive !== 'true') {
      conditions.push('is_active = true');
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const accountsQuery = `
      SELECT 
        account_id,
        account_code as code,
        account_name as name,
        account_type,
        description,
        parent_account_id,
        is_active,
        is_system_account,
        tenant_id,
        created_at,
        updated_at
      FROM chart_of_accounts
      ${whereClause}
      ORDER BY account_code
    `;
    
    console.log('🔍 EXECUTING QUERY:', accountsQuery);
    const result = await query(accountsQuery);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/chart-of-accounts/:code
 * Get single account details
 */
export const getAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    const accountQuery = `
      SELECT 
        account_id,
        code,
        name,
        account_type,
        category,
        normal_balance,
        parent_code,
        account_level,
        is_header,
        is_active,
        allows_manual_entries,
        is_reconcilable,
        current_balance,
        ytd_debit,
        ytd_credit,
        currency,
        tax_type,
        description,
        created_at,
        updated_at
      FROM chart_of_accounts
      WHERE code = $1 AND is_active = true
    `;
    
    const result = await query(accountQuery, [code]);
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== TRIAL BALANCE =====

/**
 * GET /api/financial/reports/trial-balance
 * Get trial balance for a period
 */
export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const { fiscal_year = new Date().getFullYear(), fiscal_period = new Date().getMonth() + 1 } = req.query;
    
    const trialBalance = await journalService.getTrialBalance(
      Number(fiscal_year),
      Number(fiscal_period)
    );
    
    // Calculate totals
    const totalDebits = trialBalance.reduce((sum, acc: any) => sum + (acc.total_debits || 0), 0);
    const totalCredits = trialBalance.reduce((sum, acc: any) => sum + (acc.total_credits || 0), 0);
    
    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        summary: {
          total_debits: totalDebits,
          total_credits: totalCredits,
          is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
        },
        period: {
          fiscal_year: Number(fiscal_year),
          fiscal_period: Number(fiscal_period),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/reports/account-ledger/:code
 * Get general ledger for a specific account
 */
export const getAccountLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { from_date, to_date, fiscal_year, fiscal_period } = req.query;
    
    // First, get account details
    const accountQuery = `
      SELECT account_id, account_code as code, account_name as name, account_type
      FROM chart_of_accounts
      WHERE account_code = $1 AND is_active = true
    `;
    
    const accountResult = await query(accountQuery, [code]);
    
    if (accountResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Account not found',
      });
      return;
    }
    
    const account = accountResult.rows[0];
    
    // Build WHERE conditions for ledger entries
    const conditions: string[] = ['jel.account_id = $1', "je.status = 'POSTED'"];
    const params: any[] = [account.account_id];
    
    if (from_date) {
      params.push(from_date);
      conditions.push(`je.posting_date >= $${params.length}`);
    }
    
    if (to_date) {
      params.push(to_date);
      conditions.push(`je.posting_date <= $${params.length}`);
    }
    
    if (fiscal_year) {
      params.push(Number(fiscal_year));
      conditions.push(`je.fiscal_year = $${params.length}`);
    }
    
    if (fiscal_period) {
      params.push(Number(fiscal_period));
      conditions.push(`je.fiscal_period = $${params.length}`);
    }
    
    // Get ledger entries
    const ledgerQuery = `
      SELECT 
        je.journal_date,
        je.posting_date,
        je.journal_number,
        je.description as journal_description,
        jel.description as line_description,
        jel.debit_amount_base as debit,
        jel.credit_amount_base as credit,
        jel.cost_center,
        jel.department,
        jel.project
      FROM journal_entry_lines jel
      INNER JOIN journal_entries je ON je.entry_id = jel.journal_entry_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY je.posting_date, je.journal_number, jel.line_number
    `;
    
    const ledgerResult = await query(ledgerQuery, params);
    
    // Calculate running balance
    let runningBalance = 0;
    const entries = ledgerResult.rows.map((entry: any) => {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;
      
      // Update running balance based on normal balance type
      if (account.normal_balance === 'DEBIT') {
        runningBalance += (debit - credit);
      } else {
        runningBalance += (credit - debit);
      }
      
      return {
        ...entry,
        balance: runningBalance,
      };
    });
    
    // Calculate opening/closing balances
    const totalDebits = entries.reduce((sum: number, e: any) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredits = entries.reduce((sum: number, e: any) => sum + (parseFloat(e.credit) || 0), 0);
    
    const currentBalance = account.normal_balance === 'DEBIT'
      ? (parseFloat(account.current_debit_balance) - parseFloat(account.current_credit_balance))
      : (parseFloat(account.current_credit_balance) - parseFloat(account.current_debit_balance));
    
    res.json({
      success: true,
      data: {
        account_code: account.code,
        account_name: account.name,
        account_type: account.account_type,
        normal_balance: account.normal_balance,
        entries,
        summary: {
          total_debits: totalDebits,
          total_credits: totalCredits,
          current_balance: currentBalance,
          entry_count: entries.length,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== DASHBOARD STATS =====

/**
 * GET /api/financial/dashboard
 * Get financial dashboard statistics
 */
export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const stats = {
      current_cash_balance: 125430.50,
      accounts_receivable: 85200.00,
      accounts_payable: 42800.00,
      monthly_revenue: 320500.00,
      monthly_expenses: 198300.00,
      net_income: 122200.00,
      unposted_journals: 3,
      pending_approvals: 2,
      recent_transactions: [
        {
          id: '1',
          date: '2025-01-15',
          description: 'Office rent payment',
          amount: 10000.00,
          type: 'EXPENSE',
        },
      ],
    };
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== COA TEMPLATES =====

/**
 * GET /api/financial/coa-templates
 * Get all available Chart of Accounts templates
 */
export const getCOATemplates = async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: COA_TEMPLATES,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/financial/coa-templates/:templateId/apply
 * Apply a Chart of Accounts template
 * ⚠️ WARNING: This will DELETE all existing accounts and replace with template
 */
export const applyCOATemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    
    // Find template
    const template = COA_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Template not found',
      });
      return;
    }

    // Start transaction
    await query('BEGIN');

    try {
      // 1. Delete all existing accounts (cascade will handle journal_entry_lines)
      // In production, you might want to check if there are posted transactions first
      const existingCheck = await query('SELECT COUNT(*) as count FROM journal_entries WHERE status = $1', ['POSTED']);
      const postedCount = existingCheck.rows[0].count;
      
      if (postedCount > 0) {
        await query('ROLLBACK');
        res.status(400).json({
          success: false,
          error: `Cannot apply template: ${postedCount} posted journal entries exist. This would break referential integrity.`,
          posted_entries: postedCount,
        });
        return;
      }

      // Delete all accounts
      await query('DELETE FROM chart_of_accounts');

      // 2. Insert template accounts
      let insertedCount = 0;
      for (const account of template.accounts) {
        // Get parent ID if parent_code exists
        let parentId = null;
        if (account.parent_code) {
          const parentResult = await query(
            'SELECT account_id FROM chart_of_accounts WHERE code = $1',
            [account.parent_code]
          );
          if (parentResult.rows.length > 0) {
            parentId = parentResult.rows[0].id;
          }
        }

        await query(
          `INSERT INTO chart_of_accounts (
            code, name, account_type, level, parent_account_id, 
            is_header, normal_balance, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            account.code,
            account.name,
            account.account_type,
            account.level,
            parentId,
            account.is_header || false,
            account.normal_balance,
            account.is_active !== false, // Default to true
          ]
        );
        insertedCount++;
      }

      // Commit transaction
      await query('COMMIT');

      res.json({
        success: true,
        message: `Template "${template.name}" applied successfully`,
        data: {
          template_id: templateId,
          template_name: template.name,
          accounts_created: insertedCount,
        },
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== GENERAL LEDGER =====

/**
 * GET /api/financial/ledger/general
 * Get general ledger with all posted transactions
 */
export const getGeneralLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      from_date, 
      to_date, 
      account_code,
      limit = 100,
      offset = 0 
    } = req.query;

    let whereClauses = ["je.status = 'posted'"];
    const params: any[] = [];
    let paramCount = 1;

    if (from_date) {
      whereClauses.push(`je.entry_date >= $${paramCount}`);
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      whereClauses.push(`je.entry_date <= $${paramCount}`);
      params.push(to_date);
      paramCount++;
    }

    if (account_code) {
      whereClauses.push(`coa.account_code = $${paramCount}`);
      params.push(account_code);
      paramCount++;
    }

    const ledgerQuery = `
      SELECT 
        je.entry_date as transaction_date,
        je.entry_number as document_number,
        je.description as entry_description,
        coa.account_code,
        coa.account_name,
        jel.debit_amount,
        jel.credit_amount,
        jel.description as line_description
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
      INNER JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY je.entry_date DESC, je.entry_number, jel.line_id
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await query(ledgerQuery, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/ledger/accounts/:accountCode
 * Get account ledger for specific account
 */
export const getAccountLedgerByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accountCode } = req.params;
    const { from_date, to_date, limit = 100, offset = 0 } = req.query;

    const whereClauses = ["je.status = 'posted'", "coa.account_code = $1"];
    const params: any[] = [accountCode];
    let paramCount = 2;

    if (from_date) {
      whereClauses.push(`je.entry_date >= $${paramCount}`);
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      whereClauses.push(`je.entry_date <= $${paramCount}`);
      params.push(to_date);
      paramCount++;
    }

    const ledgerQuery = `
      SELECT 
        je.entry_date as transaction_date,
        je.entry_number as document_number,
        je.description as entry_description,
        jel.description as line_description,
        jel.debit_amount,
        jel.credit_amount,
        SUM(jel.debit_amount - jel.credit_amount) OVER (
          ORDER BY je.entry_date, je.entry_number, jel.line_id
        ) as running_balance
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
      INNER JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY je.entry_date, je.entry_number, jel.line_id
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);
    const result = await query(ledgerQuery, params);

    res.json({
      success: true,
      account_code: accountCode,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== FISCAL PERIODS =====

/**
 * GET /api/financial/fiscal-years
 * Get list of fiscal years
 */
export const getFiscalYears = async (req: Request, res: Response): Promise<void> => {
  try {
    // Since fiscal_years table might not exist, generate from journal entries
    const fiscalQuery = `
      SELECT DISTINCT 
        EXTRACT(YEAR FROM entry_date)::INTEGER as fiscal_year,
        MIN(entry_date) as start_date,
        MAX(entry_date) as end_date,
        COUNT(*) as entry_count,
        CASE 
          WHEN EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE) 
          THEN true 
          ELSE false 
        END as is_current
      FROM journal_entries
      WHERE status = 'posted'
      GROUP BY EXTRACT(YEAR FROM entry_date)
      ORDER BY fiscal_year DESC
    `;

    const result = await query(fiscalQuery, []);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/financial/fiscal-periods
 * Get list of fiscal periods (months)
 */
export const getFiscalPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year } = req.query;

    let periodQuery = `
      SELECT 
        EXTRACT(YEAR FROM entry_date)::INTEGER as fiscal_year,
        EXTRACT(MONTH FROM entry_date)::INTEGER as period_number,
        TO_CHAR(entry_date, 'Month YYYY') as period_name,
        MIN(entry_date) as start_date,
        MAX(entry_date) as end_date,
        COUNT(*) as entry_count,
        'OPEN' as status
      FROM journal_entries
      WHERE status = 'posted'
    `;

    const params: any[] = [];
    if (year) {
      periodQuery += ` AND EXTRACT(YEAR FROM entry_date) = $1`;
      params.push(year);
    }

    periodQuery += `
      GROUP BY 
        EXTRACT(YEAR FROM entry_date),
        EXTRACT(MONTH FROM entry_date),
        TO_CHAR(entry_date, 'Month YYYY')
      ORDER BY fiscal_year DESC, period_number DESC
    `;

    const result = await query(periodQuery, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== CASH FLOW STATEMENT =====

/**
 * GET /api/financial/cash-flow
 * Get cash flow statement
 */
export const getCashFlowStatement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      res.status(400).json({
        success: false,
        error: 'fromDate and toDate parameters are required'
      });
      return;
    }

    // Operating Activities - Revenue and Expense accounts
    const operatingQuery = `
      SELECT 
        coa.account_name,
        SUM(jel.debit_amount) as debit_amount,
        SUM(jel.credit_amount) as credit_amount,
        SUM(jel.credit_amount - jel.debit_amount) as net_amount
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
      INNER JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE je.status = 'posted'
        AND je.entry_date BETWEEN $1 AND $2
        AND coa.account_type IN ('REVENUE', 'EXPENSE')
      GROUP BY coa.account_name
      ORDER BY coa.account_name
    `;

    // Investing Activities - Asset accounts (excluding cash)
    const investingQuery = `
      SELECT 
        coa.account_name,
        SUM(jel.debit_amount) as debit_amount,
        SUM(jel.credit_amount) as credit_amount,
        SUM(jel.debit_amount - jel.credit_amount) as net_amount
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
      INNER JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE je.status = 'posted'
        AND je.entry_date BETWEEN $1 AND $2
        AND coa.account_type = 'ASSET'
        AND coa.account_code NOT LIKE '1000%'
      GROUP BY coa.account_name
      ORDER BY coa.account_name
    `;

    // Financing Activities - Liability and Equity accounts
    const financingQuery = `
      SELECT 
        coa.account_name,
        SUM(jel.debit_amount) as debit_amount,
        SUM(jel.credit_amount) as credit_amount,
        SUM(jel.credit_amount - jel.debit_amount) as net_amount
      FROM journal_entries je
      INNER JOIN journal_entry_lines jel ON je.entry_id = jel.entry_id
      INNER JOIN chart_of_accounts coa ON jel.account_id = coa.account_id
      WHERE je.status = 'posted'
        AND je.entry_date BETWEEN $1 AND $2
        AND coa.account_type IN ('LIABILITY', 'EQUITY')
      GROUP BY coa.account_name
      ORDER BY coa.account_name
    `;

    const [operatingResult, investingResult, financingResult] = await Promise.all([
      query(operatingQuery, [fromDate, toDate]),
      query(investingQuery, [fromDate, toDate]),
      query(financingQuery, [fromDate, toDate])
    ]);

    const operatingTotal = operatingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount || 0), 0);
    const investingTotal = investingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount || 0), 0);
    const financingTotal = financingResult.rows.reduce((sum, row) => sum + parseFloat(row.net_amount || 0), 0);

    res.json({
      success: true,
      data: {
        operating_activities: operatingResult.rows,
        investing_activities: investingResult.rows,
        financing_activities: financingResult.rows,
        totals: {
          operating: operatingTotal,
          investing: investingTotal,
          financing: financingTotal,
          net_cash_flow: operatingTotal + investingTotal + financingTotal
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== INCOME STATEMENT =====

/**
 * GET /api/financial/income-statement
 * Get income statement (returns placeholder data - table setup needed)
 */
export const getIncomeStatement = async (req: Request, res: Response) => {
  try {
    // Placeholder response - actual implementation requires proper ledger schema
    res.json({
      success: true,
      data: {
        revenue: 0,
        cost_of_sales: 0,
        gross_profit: 0,
        expenses: 0,
        net_income: 0,
        details: [],
        message: 'Income statement endpoint ready - requires ledger data setup'
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== TAX SETTINGS =====

/**
 * GET /api/financial/tax-settings
 * Get all tax settings/codes
 */
export const getTaxSettings = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        tax_code,
        tax_name,
        tax_rate,
        tax_type,
        is_default,
        is_active,
        created_at
      FROM financial.tax_settings
      WHERE is_active = true
      ORDER BY tax_code
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/financial/tax-settings
 * Create a new tax setting
 */
export const createTaxSetting = async (req: Request, res: Response) => {
  try {
    const { tax_code, tax_name, tax_rate, tax_type, is_default } = req.body;

    const result = await query(`
      INSERT INTO financial.tax_settings (
        tax_code, tax_name, tax_rate, tax_type, is_default, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, tax_code, tax_name, tax_rate
    `, [tax_code, tax_name, tax_rate, tax_type, is_default || false]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Tax setting created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/financial/tax-settings/:id
 * Update a tax setting
 */
export const updateTaxSetting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tax_code, tax_name, tax_rate, tax_type, is_default, is_active } = req.body;

    const result = await query(`
      UPDATE financial.tax_settings
      SET 
        tax_code = COALESCE($1, tax_code),
        tax_name = COALESCE($2, tax_name),
        tax_rate = COALESCE($3, tax_rate),
        tax_type = COALESCE($4, tax_type),
        is_default = COALESCE($5, is_default),
        is_active = COALESCE($6, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, tax_code, tax_name, tax_rate
    `, [tax_code, tax_name, tax_rate, tax_type, is_default, is_active, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tax setting not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tax setting updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== DIMENSIONS =====

/**
 * GET /api/financial/dimensions
 * Get all financial dimensions
 */
export const getDimensions = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        dimension_code,
        dimension_name,
        dimension_type,
        parent_dimension_id,
        is_active,
        created_at
      FROM financial.dimensions
      WHERE is_active = true
      ORDER BY dimension_type, dimension_code
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/financial/dimensions
 * Create a new dimension
 */
export const createDimension = async (req: Request, res: Response) => {
  try {
    const { dimension_code, dimension_name, dimension_type, parent_dimension_id } = req.body;

    const result = await query(`
      INSERT INTO financial.dimensions (
        dimension_code, dimension_name, dimension_type, parent_dimension_id, is_active
      ) VALUES ($1, $2, $3, $4, true)
      RETURNING id, dimension_code, dimension_name, dimension_type
    `, [dimension_code, dimension_name, dimension_type, parent_dimension_id || null]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Dimension created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/financial/dimensions/:id
 * Update a dimension
 */
export const updateDimension = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dimension_code, dimension_name, dimension_type, parent_dimension_id, is_active } = req.body;

    const result = await query(`
      UPDATE financial.dimensions
      SET 
        dimension_code = COALESCE($1, dimension_code),
        dimension_name = COALESCE($2, dimension_name),
        dimension_type = COALESCE($3, dimension_type),
        parent_dimension_id = COALESCE($4, parent_dimension_id),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, dimension_code, dimension_name, dimension_type
    `, [dimension_code, dimension_name, dimension_type, parent_dimension_id, is_active, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dimension not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dimension updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
