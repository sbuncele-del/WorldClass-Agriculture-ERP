/**
 * Custom Reports Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import CustomReportsControllerV2 from '../controllers/custom-reports.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Report template routes
router.get('/templates', CustomReportsControllerV2.getReportTemplates);
router.get('/templates/:id', CustomReportsControllerV2.getReportTemplateById);
router.post('/templates', CustomReportsControllerV2.createReportTemplate);
router.put('/templates/:id', CustomReportsControllerV2.updateReportTemplate);
router.delete('/templates/:id', CustomReportsControllerV2.deleteReportTemplate);

// Report execution routes
router.post('/templates/:id/execute', CustomReportsControllerV2.runReport);

// Utility routes
router.get('/categories', CustomReportsControllerV2.getCategories);

export default router;
