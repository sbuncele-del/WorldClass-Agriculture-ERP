/**
 * Cash Management Controllers
 * 
 * REST API controllers for bank reconciliation
 */

import { Response } from 'express';
import { TenantRequest } from '../../../types';
import bankReconciliationService from '../services/bank-reconciliation.service';
import matchingService from '../services/matching.service';

function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * Bank Controllers
 */
export const getBanks = async (req: TenantRequest, res: Response) => {
  try {
    const activeOnly = req.query.active_only !== 'false';
    const banks = await bankReconciliationService.getBanks(activeOnly);
    
    res.json({
      success: true,
      data: banks,
      count: banks.length
    });
  } catch (error: any) {
    console.error('Error fetching banks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCSVPreset = async (req: TenantRequest, res: Response) => {
  try {
    const { bankCode } = req.params;
    const preset = bankReconciliationService.getCSVPresetForBank(bankCode.toUpperCase());
    
    if (!preset) {
      return res.status(404).json({
        success: false,
        error: `No CSV preset found for bank code: ${bankCode}`
      });
    }
    
    res.json({
      success: true,
      data: preset
    });
  } catch (error: any) {
    console.error('Error fetching CSV preset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Bank Account Controllers
 */
export const getBankAccounts = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const includeInactive = req.query.include_inactive === 'true';
    const accounts = await bankReconciliationService.getBankAccounts(includeInactive, tenantId);
    
    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getBankAccountById = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const id = parseInt(req.params.id);
    const account = await bankReconciliationService.getBankAccountById(id, tenantId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Bank account not found'
      });
    }
    
    res.json({
      success: true,
      data: account
    });
  } catch (error: any) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createBankAccount = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const account = await bankReconciliationService.createBankAccount(req.body, userId, tenantId);
    
    res.status(201).json({
      success: true,
      data: account,
      message: 'Bank account created successfully'
    });
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateBankAccount = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const id = parseInt(req.params.id);
    
    const account = await bankReconciliationService.updateBankAccount(
      { ...req.body, id },
      userId,
      tenantId
    );
    
    res.json({
      success: true,
      data: account,
      message: 'Bank account updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Statement Controllers
 */
export const getStatements = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const filter: any = {};
    
    if (req.query.bank_account_id) {
      filter.bank_account_id = parseInt(req.query.bank_account_id as string);
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.from_date) {
      filter.from_date = new Date(req.query.from_date as string);
    }
    if (req.query.to_date) {
      filter.to_date = new Date(req.query.to_date as string);
    }
    
    const statements = await bankReconciliationService.getStatements(filter, tenantId);
    
    res.json({
      success: true,
      data: statements,
      count: statements.length
    });
  } catch (error: any) {
    console.error('Error fetching statements:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const importStatement = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const { statement, csvData, columnMapping } = req.body;
    
    // Parse CSV
    const parsedLines = bankReconciliationService.parseCSV(csvData, columnMapping);
    
    // Import statement
    const importedStatement = await bankReconciliationService.importStatement(
      statement,
      parsedLines,
      userId,
      tenantId
    );
    
    res.status(201).json({
      success: true,
      data: importedStatement,
      message: `Statement imported successfully with ${parsedLines.length} lines`
    });
  } catch (error: any) {
    console.error('Error importing statement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const parseCSVPreview = async (req: TenantRequest, res: Response) => {
  try {
    const { csvData, columnMapping } = req.body;
    
    const parsedLines = bankReconciliationService.parseCSV(csvData, columnMapping);
    
    // Return only first 10 lines for preview
    const preview = parsedLines.slice(0, 10);
    
    res.json({
      success: true,
      data: {
        total_lines: parsedLines.length,
        preview_lines: preview,
        errors: parsedLines.filter(l => l.parsing_errors && l.parsing_errors.length > 0).length
      }
    });
  } catch (error: any) {
    console.error('Error parsing CSV:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Statement Line Controllers
 */
export const getStatementLines = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const filter: any = {};
    
    if (req.query.bank_statement_id) {
      filter.bank_statement_id = parseInt(req.query.bank_statement_id as string);
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.is_reconciled !== undefined) {
      filter.is_reconciled = req.query.is_reconciled === 'true';
    }
    
    const lines = await bankReconciliationService.getStatementLines(filter, tenantId);
    
    res.json({
      success: true,
      data: lines,
      count: lines.length
    });
  } catch (error: any) {
    console.error('Error fetching statement lines:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reconciliation Rule Controllers
 */
export const getReconciliationRules = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const activeOnly = req.query.active_only !== 'false';
    const rules = await bankReconciliationService.getReconciliationRules(activeOnly, tenantId);
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error: any) {
    console.error('Error fetching reconciliation rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createReconciliationRule = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const rule = await bankReconciliationService.createReconciliationRule(req.body, userId, tenantId);
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Reconciliation rule created successfully'
    });
  } catch (error: any) {
    console.error('Error creating reconciliation rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Matching Controllers
 */
export const runAutoMatching = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const statementId = parseInt(req.params.statementId);
    
    const result = await matchingService.runAutoMatching(statementId, userId, tenantId);
    
    res.json({
      success: true,
      data: result,
      message: `Auto-matching complete: ${result.matched} matched, ${result.autoCreated} auto-created, ${result.suggestions.length} suggestions`
    });
  } catch (error: any) {
    console.error('Error running auto-matching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createMatch = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    const match = await matchingService.createMatch(req.body, userId, tenantId);
    
    res.status(201).json({
      success: true,
      data: match,
      message: 'Match created successfully'
    });
  } catch (error: any) {
    console.error('Error creating match:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const unmatch = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const userId = req.user?.id;
    await matchingService.unmatch(req.body, userId, tenantId);
    
    res.json({
      success: true,
      message: 'Transaction unmatched successfully'
    });
  } catch (error: any) {
    console.error('Error unmatching transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reconciliation Workspace Controller
 */
export const getReconciliationWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const statementId = parseInt(req.params.statementId);
    const workspace = await matchingService.getReconciliationWorkspace(statementId, tenantId);
    
    res.json({
      success: true,
      data: workspace
    });
  } catch (error: any) {
    console.error('Error fetching reconciliation workspace:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Dashboard/Summary Controllers
 */
export const getCashManagementSummary = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const accounts = await bankReconciliationService.getBankAccounts(false, tenantId);
    const statements = await bankReconciliationService.getStatements({}, tenantId);
    const rules = await bankReconciliationService.getReconciliationRules(true, tenantId);
    
    // Calculate totals
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(String(acc.current_balance)), 0);
    const unreconciledStatements = statements.filter(s => s.status !== 'RECONCILED').length;
    
    res.json({
      success: true,
      data: {
        total_bank_accounts: accounts.length,
        active_bank_accounts: accounts.filter(a => a.is_active).length,
        total_balance: totalBalance,
        total_statements: statements.length,
        unreconciled_statements: unreconciledStatements,
        active_rules: rules.length,
        accounts: accounts.map(a => ({
          id: a.id,
          name: a.account_name,
          bank: a.account_name || (a.bank as any)?.bank_name,
          balance: a.current_balance,
          last_reconciled: a.last_reconciled_date
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching cash management summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Duplicate Detection Controllers
 */
export const checkDuplicates = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const { bankStatementLineId, journalEntryLineId } = req.body;

    if (!bankStatementLineId || !journalEntryLineId) {
      return res.status(400).json({
        success: false,
        error: 'bankStatementLineId and journalEntryLineId are required'
      });
    }

    const result = await matchingService.checkDuplicates(
      bankStatementLineId,
      journalEntryLineId,
      tenantId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const findPotentialDuplicates = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const options = {
      dateRange: req.query.dateRange ? parseInt(req.query.dateRange as string) : undefined,
      amountTolerance: req.query.amountTolerance ? parseFloat(req.query.amountTolerance as string) : undefined,
      includeMatched: req.query.includeMatched === 'true'
    };

    const duplicates = await matchingService.findPotentialDuplicates(tenantId, options);

    res.json({
      success: true,
      data: duplicates,
      count: duplicates.length
    });
  } catch (error: any) {
    console.error('Error finding potential duplicates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Allocate (Quick Match to New Transaction)
 * Creates a new cash transaction from a bank statement line
 */
export const allocateLine = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const lineId = parseInt(req.params.lineId);
    const { category, description, payee_payer, reference } = req.body;
    const userId = req.user?.id;

    const result = await matchingService.matchToNewTransaction(
      lineId,
      { category, description, payee_payer, reference },
      userId,
      tenantId
    );

    res.json({
      success: true,
      data: result,
      message: `Line ${lineId} allocated to new transaction ${result.transaction.transaction_number}`
    });
  } catch (error: any) {
    console.error('Error allocating line:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Available Categories
 * Returns list of categories with their GL account mappings
 */
export const getCategories = async (_req: TenantRequest, res: Response) => {
  try {
    const categories = matchingService.getAvailableCategories();
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Trial Balance
 * Returns trial balance from GL
 */
export const getTrialBalance = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const glService = (await import('../services/gl-integration.service')).default;
    const trialBalance = await glService.getTrialBalance(tenantId);
    
    // Calculate totals
    const totalDebit = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.debit_balance || 0), 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + parseFloat(acc.credit_balance || 0), 0);
    
    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        totalDebit,
        totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    });
  } catch (error: any) {
    console.error('Error getting trial balance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get Journal Entries from Cash Management
 * Returns journal entries from GL related to bank transactions
 */
export const getCashJournalEntries = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const { startDate, endDate, limit, offset } = req.query;
    
    const glService = (await import('../services/gl-integration.service')).default;
    const result = await glService.getJournalEntries(tenantId, {
      startDate: startDate as string,
      endDate: endDate as string,
      sourceType: 'BANK_RECON', // Filter to bank transactions only
      status: 'POSTED',
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });
    
    res.json({
      success: true,
      data: result.entries,
      total: result.total
    });
  } catch (error: any) {
    console.error('Error getting journal entries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Post unposted transactions to GL
 * Backfills GL entries for transactions created before GL integration
 */
export const postUnpostedToGL = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    
    const glService = (await import('../services/gl-integration.service')).default;
    const result = await glService.postUnpostedTransactionsToGL(tenantId, userId);
    
    res.json({
      success: true,
      data: result,
      message: `Posted ${result.posted} transactions to GL. ${result.skipped} skipped.`
    });
  } catch (error: any) {
    console.error('Error posting to GL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Repost a single transaction to GL
 */
export const repostTransactionToGL = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000000';
    const { transactionId } = req.params;
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }
    
    const glService = (await import('../services/gl-integration.service')).default;
    const result = await glService.repostTransactionToGL(
      parseInt(transactionId),
      category,
      tenantId,
      userId
    );
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: {
        journalEntryId: result.journalEntryId,
        journalNumber: result.journalNumber
      },
      message: `Transaction posted to GL: ${result.journalNumber}`
    });
  } catch (error: any) {
    console.error('Error reposting to GL:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get chart of accounts
 */
export const getChartOfAccounts = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    
    const { type, active_only } = req.query;
    
    let query = `
      SELECT 
        account_id,
        code,
        name,
        description,
        account_type,
        account_subtype,
        normal_balance,
        current_balance,
        ytd_debit,
        ytd_credit,
        is_active,
        is_header,
        account_level
      FROM chart_of_accounts
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND account_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (active_only !== 'false') {
      query += ` AND is_active = true`;
    }
    
    query += ` ORDER BY code`;
    
    const pool = (await import('../../../config/database')).default;
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error getting chart of accounts:', error);
  }
};

/**
 * AI Categorization Controller
 */
export const runAICategorization = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID not found' });
    }
    const statementId = parseInt(req.params.statementId);
    
    const aiCategorization = (await import('../services/ai-categorization.service')).default;
    
    const suggestions = await aiCategorization.categorizeStatementLines(statementId, tenantId);
    
    res.json({
      success: true,
      data: suggestions,
      count: suggestions.length,
      ai_available: aiCategorization.isAvailable(),
      message: aiCategorization.isAvailable() 
        ? `AI categorized ${suggestions.length} transactions`
        : `Rule-based categorization applied to ${suggestions.length} transactions (AI not configured)`
    });
  } catch (error: any) {
    console.error('Error running AI categorization:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
