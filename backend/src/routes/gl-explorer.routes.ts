import { Router } from 'express';
import GLExplorerControllerV2 from '../controllers/gl-explorer.controller.v2';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all GL explorer routes
router.use(tenantMiddleware);

// Advanced search
router.get('/search', GLExplorerControllerV2.search);

// Account tree/hierarchy
router.get('/account-tree', GLExplorerControllerV2.getFilterOptions);

// Account drill-down
router.get('/account/:account_code/transactions', GLExplorerControllerV2.getAccountLedger);

// Filter options for dropdowns
router.get('/filter-options', GLExplorerControllerV2.getFilterOptions);

export default router;
