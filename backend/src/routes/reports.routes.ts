/**
 * Reports Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import ReportsControllerV2 from '../controllers/reports.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Report Definitions
router.get('/definitions', ReportsControllerV2.getReportDefinitions);
router.get('/definitions/:id', ReportsControllerV2.getReportDefinitionById);
router.post('/definitions', ReportsControllerV2.createReportDefinition);

// Report Execution
router.post('/execute', ReportsControllerV2.executeReport);
router.get('/executions', ReportsControllerV2.getExecutionHistory);

// Report Scheduling
router.get('/schedules', ReportsControllerV2.getScheduledReports);
router.post('/schedules', ReportsControllerV2.scheduleReport);
router.delete('/schedules/:id', ReportsControllerV2.deleteSchedule);

export default router;
