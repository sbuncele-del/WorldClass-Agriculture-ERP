// ============================================================================
// ACCOUNTING AUTOMATION - API ROUTES
// ============================================================================

import { Router } from 'express';
import accountingAutomationController from './accounting.automation.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// CHART OF ACCOUNTS
// ---------------------------------------------------------------------------
router.get('/chart-of-accounts', accountingAutomationController.getChartOfAccounts);

// ---------------------------------------------------------------------------
// JOURNAL ENTRIES - AUTO DOUBLE-ENTRY
// ---------------------------------------------------------------------------
router.post('/journal-entries', accountingAutomationController.createJournalEntry);
router.post('/journal-entries/:entryId/post', accountingAutomationController.postJournalEntry);
router.post('/journal-entries/:entryId/reverse', accountingAutomationController.reverseJournalEntry);

// ---------------------------------------------------------------------------
// ACCOUNTS RECEIVABLE AUTOMATION
// ---------------------------------------------------------------------------
router.post('/ar/auto-invoice', accountingAutomationController.generateInvoiceFromDelivery);
router.post('/ar/smart-match', accountingAutomationController.smartMatchPayment);
router.post('/ar/apply-payment', accountingAutomationController.applyPayment);

// ---------------------------------------------------------------------------
// ACCOUNTS PAYABLE AUTOMATION
// ---------------------------------------------------------------------------
router.post('/ap/ocr-process', accountingAutomationController.processInvoiceOCR);
router.get('/ap/payment-schedule', accountingAutomationController.getPaymentSchedule);

// ---------------------------------------------------------------------------
// CASH MANAGEMENT
// ---------------------------------------------------------------------------
router.get('/cash/position', accountingAutomationController.getCashPosition);
router.get('/cash/forecast', accountingAutomationController.getCashForecast);

// ---------------------------------------------------------------------------
// FINANCIAL STATEMENTS (Real-time)
// ---------------------------------------------------------------------------
router.get('/statements/balance-sheet', accountingAutomationController.getBalanceSheet);
router.get('/statements/income-statement', accountingAutomationController.getIncomeStatement);

// ---------------------------------------------------------------------------
// LOGISTICS INTEGRATION WEBHOOK
// ---------------------------------------------------------------------------
router.post('/webhooks/logistics', accountingAutomationController.handleLogisticsEvent);

export default router;
