/**
 * Import Entries Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import ImportEntriesControllerV2 from '../controllers/import-entries.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Validate import file
router.post('/validate', ImportEntriesControllerV2.validateImport);

// Import journal entries
router.post('/import', ImportEntriesControllerV2.executeImport);

// Get import templates
router.get('/templates', ImportEntriesControllerV2.getImportTemplates);

// Save import template
router.post('/templates', ImportEntriesControllerV2.saveImportTemplate);

// Get import history
router.get('/history', ImportEntriesControllerV2.getImportHistory);

// Download sample CSV
router.get('/sample', ImportEntriesControllerV2.downloadSample);

export default router;
