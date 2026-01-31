/**
 * Cash Management Routes
 * 
 * API routes for bank reconciliation
 */

import express from 'express';
import pool from '../config/database';
import * as cashManagementController from '../modules/cash-management/controllers/cash-management.controller';
import * as cashManagementWorkspaceController from '../modules/cash-management/controllers/cash-management.workspace.controller';
import * as multiLineMatchingController from '../modules/cash-management/controllers/multi-line-matching.controller';
import * as partialReconciliationController from '../modules/cash-management/controllers/partial-reconciliation.controller';
import * as bulkOperationsController from '../modules/cash-management/controllers/bulk-operations.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all cash management routes
router.use(tenantMiddleware);

// ============================================================
// CASH POSITION (Quick access endpoint)
// ============================================================
router.get('/cash-position', async (req: any, res: any) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Tenant context required' });
    }
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_accounts,
        COALESCE(SUM(current_balance), 0) as total_balance,
        COALESCE(SUM(CASE WHEN is_active = true THEN current_balance ELSE 0 END), 0) as active_balance,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_accounts
      FROM cash_bank_accounts WHERE tenant_id = $1`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows[0] || { total_accounts: 0, total_balance: 0 } });
  } catch (error: any) {
    console.error('Cash position error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cash position' });
  }
});

// ============================================================
// WORKSPACE
// ============================================================
router.get('/workspace', cashManagementWorkspaceController.getCashManagementWorkspace);

// ============================================================
// BANKS
// ============================================================
router.get('/banks', cashManagementController.getBanks);
router.get('/banks/:bankCode/csv-preset', cashManagementController.getCSVPreset);

// ============================================================
// BANK ACCOUNTS
// ============================================================
router.get('/bank-accounts', cashManagementController.getBankAccounts);
router.get('/bank-accounts/:id', cashManagementController.getBankAccountById);
router.post('/bank-accounts', cashManagementController.createBankAccount);
router.put('/bank-accounts/:id', cashManagementController.updateBankAccount);

// ============================================================
// STATEMENTS
// ============================================================
router.get('/statements', cashManagementController.getStatements);
router.post('/statements/import', cashManagementController.importStatement);
router.post('/statements/parse-csv', cashManagementController.parseCSVPreview);

// ============================================================
// STATEMENT LINES
// ============================================================
router.get('/statement-lines', cashManagementController.getStatementLines);
router.post('/statement-lines/:lineId/allocate', cashManagementController.allocateLine);

// ============================================================
// GL INTEGRATION
// ============================================================
router.get('/categories', cashManagementController.getCategories);
router.get('/trial-balance', cashManagementController.getTrialBalance);
router.get('/journal-entries', cashManagementController.getCashJournalEntries);
router.get('/chart-of-accounts', cashManagementController.getChartOfAccounts);
router.post('/gl/post-unposted', cashManagementController.postUnpostedToGL);
router.post('/transactions/:transactionId/post-to-gl', cashManagementController.repostTransactionToGL);

// ============================================================
// RECONCILIATION RULES
// ============================================================
router.get('/rules', cashManagementController.getReconciliationRules);
router.post('/rules', cashManagementController.createReconciliationRule);

// ============================================================
// MATCHING
// ============================================================
router.post('/statements/:statementId/auto-match', cashManagementController.runAutoMatching);
router.post('/statements/:statementId/ai-categorize', cashManagementController.runAICategorization);
router.post('/matches', cashManagementController.createMatch);
router.post('/matches/unmatch', cashManagementController.unmatch);

// ============================================================
// MULTI-LINE MATCHING
// ============================================================
router.post('/multi-line-matching/find', multiLineMatchingController.findMultiLineMatches);
router.post('/multi-line-matching/create', multiLineMatchingController.createMultiLineMatch);
router.delete('/multi-line-matching/:groupId', multiLineMatchingController.unmatchMultiLineGroup);
router.get('/multi-line-matching/groups', multiLineMatchingController.getMultiLineMatchGroups);

// ============================================================
// PARTIAL RECONCILIATION
// ============================================================
router.post('/partial-matching/accept', partialReconciliationController.acceptPartialMatch);
router.get('/partial-matching/:bankLineId/suggestions', partialReconciliationController.findPartialMatchSuggestions);
router.post('/partial-matching/check-tolerance', partialReconciliationController.checkTolerance);
router.get('/partial-matching/tolerance-settings', partialReconciliationController.getToleranceSettings);

// ============================================================
// DUPLICATE DETECTION
// ============================================================
router.post('/duplicates/check', cashManagementController.checkDuplicates);
router.get('/duplicates/find', cashManagementController.findPotentialDuplicates);

// ============================================================
// BULK OPERATIONS
// ============================================================
router.post('/bulk/auto-match', bulkOperationsController.bulkAutoMatch);
router.post('/bulk/accept-suggestions', bulkOperationsController.bulkAcceptSuggestions);
router.post('/bulk/unmatch', bulkOperationsController.bulkUnmatch);
router.get('/bulk/stats/:statementId', bulkOperationsController.getBulkStats);

// ============================================================
// RECONCILIATION WORKSPACE
// ============================================================
router.get('/statements/:statementId/workspace', cashManagementController.getReconciliationWorkspace);

// ============================================================
// DASHBOARD/SUMMARY
// ============================================================
router.get('/summary', cashManagementController.getCashManagementSummary);

export default router;
