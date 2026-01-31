import { Router } from 'express';
import * as financialControllerV2 from '../modules/financial/controllers/financial.controller.v2';
import * as financialWorkspaceController from '../modules/financial/controllers/financial.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';
import {
	financialAccountLedgerByAccountCodeValidation,
	financialAccountLedgerByCodeValidation,
	financialApplyTemplateValidation,
	financialCashFlowValidation,
	financialCreateJournalEntryValidation,
	financialDimensionCreateValidation,
	financialDimensionUpdateValidation,
	financialFiscalPeriodsValidation,
	financialJournalEntryIdValidation,
	financialLedgerQueryValidation,
	financialListJournalEntriesValidation,
	financialReverseJournalEntryValidation,
	financialTaxSettingCreateValidation,
	financialTaxSettingUpdateValidation,
	financialTrialBalanceValidation,
} from '../middleware/validation';
import { handleValidationErrors } from '../middleware/validationHandler';

const router = Router();

// Apply tenant middleware to all financial routes
router.use(tenantMiddleware);

// ===== WORKSPACE =====
router.get('/workspace', financialWorkspaceController.getFinancialWorkspace);

// ===== JOURNAL ENTRIES =====
router.post(
	'/journal-entries',
	financialCreateJournalEntryValidation,
	handleValidationErrors,
	financialControllerV2.createJournalEntry
);
router.get(
	'/journal-entries',
	financialListJournalEntriesValidation,
	handleValidationErrors,
	financialControllerV2.listJournalEntries
);
router.get(
	'/journal-entries/:id',
	financialJournalEntryIdValidation,
	handleValidationErrors,
	financialControllerV2.getJournalEntry
);
router.post(
	'/journal-entries/:id/post',
	financialJournalEntryIdValidation,
	handleValidationErrors,
	financialControllerV2.postJournalEntry
);
router.post(
	'/journal-entries/:id/reverse',
	financialReverseJournalEntryValidation,
	handleValidationErrors,
	financialControllerV2.reverseJournalEntry
);

// ===== CHART OF ACCOUNTS =====
router.get('/chart-of-accounts', financialControllerV2.getChartOfAccounts);
router.get('/chart-of-accounts/:code', financialControllerV2.getAccount);

// ===== COA TEMPLATES =====
router.get('/coa-templates', financialControllerV2.getCOATemplates);
router.post(
	'/coa-templates/:templateId/apply',
	financialApplyTemplateValidation,
	handleValidationErrors,
	financialControllerV2.applyCOATemplate
);

// ===== REPORTS =====
router.get(
	'/reports/trial-balance',
	financialTrialBalanceValidation,
	handleValidationErrors,
	financialControllerV2.getTrialBalance
);
router.get(
	'/reports/account-ledger/:code',
	financialAccountLedgerByCodeValidation,
	handleValidationErrors,
	financialControllerV2.getAccountLedger
);
// TODO: implement balance sheet endpoint (v2) when ledger data is available
router.get('/reports/income-statement', financialControllerV2.getIncomeStatement);

// ===== GENERAL LEDGER =====
router.get(
	'/ledger/general',
	financialLedgerQueryValidation,
	handleValidationErrors,
	financialControllerV2.getGeneralLedger
);
router.get(
	'/ledger/accounts/:accountCode',
	financialAccountLedgerByAccountCodeValidation,
	handleValidationErrors,
	financialControllerV2.getAccountLedgerByCode
);

// ===== FISCAL PERIODS =====
router.get('/fiscal-years', financialControllerV2.getFiscalYears);
router.get(
	'/fiscal-periods',
	financialFiscalPeriodsValidation,
	handleValidationErrors,
	financialControllerV2.getFiscalPeriods
);

// ===== CASH FLOW =====
router.get(
	'/cash-flow',
	financialCashFlowValidation,
	handleValidationErrors,
	financialControllerV2.getCashFlowStatement
);

// ===== INCOME STATEMENT =====
// Moved to /reports/income-statement above

// ===== TAX SETTINGS =====
router.get('/tax-settings', financialControllerV2.getTaxSettings);
router.post(
	'/tax-settings',
	financialTaxSettingCreateValidation,
	handleValidationErrors,
	financialControllerV2.createTaxSetting
);
router.put(
	'/tax-settings/:id',
	financialTaxSettingUpdateValidation,
	handleValidationErrors,
	financialControllerV2.updateTaxSetting
);

// ===== DIMENSIONS =====
router.get('/dimensions', financialControllerV2.getDimensions);
router.post(
	'/dimensions',
	financialDimensionCreateValidation,
	handleValidationErrors,
	financialControllerV2.createDimension
);
router.put(
	'/dimensions/:id',
	financialDimensionUpdateValidation,
	handleValidationErrors,
	financialControllerV2.updateDimension
);

// ===== DASHBOARD =====
router.get('/dashboard', financialControllerV2.getDashboard);

export default router;
