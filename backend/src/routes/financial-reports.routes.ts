import { Router } from 'express';
// V2 controllers with tenant isolation - CRITICAL for data security
import * as FinancialReportsV2 from '../controllers/v2/financial-reports.controller.v2';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all financial report routes
router.use(tenantMiddleware);

// ============================================================================
// INCOME STATEMENT (V2 - Tenant Isolated)
// ============================================================================
router.get('/income-statement', FinancialReportsV2.generateIncomeStatement);
router.post('/income-statement/export', FinancialReportsV2.exportIncomeStatementToPDF);
router.get('/income-statement/account/:accountCode', FinancialReportsV2.getIncomeStatementAccountDetails);

// ============================================================================
// BALANCE SHEET (V2 - Tenant Isolated)
// ============================================================================
router.get('/balance-sheet', FinancialReportsV2.generateBalanceSheet);
router.post('/balance-sheet/export', FinancialReportsV2.exportBalanceSheetToPDF);
router.get('/balance-sheet/account/:accountCode', FinancialReportsV2.getBalanceSheetAccountDetails);
router.get('/balance-sheet/ratios', FinancialReportsV2.getFinancialRatios);

// ============================================================================
// CASH FLOW STATEMENT (V2 - Tenant Isolated)
// ============================================================================
router.get('/cash-flow', FinancialReportsV2.generateCashFlowStatement);
router.post('/cash-flow/export', FinancialReportsV2.exportCashFlowToPDF);

// ============================================================================
// AGED RECEIVABLES (V2 - Tenant Isolated)
// ============================================================================
router.get('/aged-receivables', FinancialReportsV2.generateAgedReceivables);

// ============================================================================
// AGED PAYABLES (V2 - Tenant Isolated)
// ============================================================================
router.get('/aged-payables', FinancialReportsV2.generateAgedPayables);

// ============================================================================
// VAT REPORT (V2 - Tenant Isolated)
// ============================================================================
router.get('/vat-report', FinancialReportsV2.generateVATReport);

// ============================================================================
// GENERAL LEDGER (V2 - Tenant Isolated)
// ============================================================================
router.get('/general-ledger', FinancialReportsV2.generateGeneralLedger);

export default router;
