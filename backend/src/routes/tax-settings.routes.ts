/**
 * Tax Settings Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as TaxSettingsControllerV2 from '../controllers/tax-settings.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Tax Configuration
router.get('/configuration', TaxSettingsControllerV2.getTaxSettings);
router.put('/configuration', TaxSettingsControllerV2.updateTaxSettings);

// Tax Account Mappings
router.get('/accounts', TaxSettingsControllerV2.getTaxAccounts);
router.put('/accounts/:tax_type', TaxSettingsControllerV2.updateTaxAccount);

// VAT Settings
router.get('/vat', TaxSettingsControllerV2.getVatConfig);
router.put('/vat', TaxSettingsControllerV2.updateVatConfig);

// PAYE Settings
router.get('/paye', TaxSettingsControllerV2.getPayeSettings);
router.put('/paye', TaxSettingsControllerV2.updatePayeSettings);

// Income Tax Brackets
router.get('/income-tax-brackets', TaxSettingsControllerV2.getIncomeTaxBrackets);
router.put('/income-tax-brackets', TaxSettingsControllerV2.updateIncomeTaxBrackets);

// SARS eFiling Configuration
router.get('/efiling/configuration', TaxSettingsControllerV2.getEfilingConfig);
router.put('/efiling/configuration', TaxSettingsControllerV2.updateEfilingConfig);

export default router;
