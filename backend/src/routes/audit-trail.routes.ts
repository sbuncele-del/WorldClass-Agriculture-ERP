/**
 * Audit Trail Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import AuditTrailControllerV2 from '../controllers/audit-trail.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Get audit logs with filters
router.get('/', AuditTrailControllerV2.getAuditTrail);

// Get entity history
router.get('/entity/:entity_type/:entity_id', AuditTrailControllerV2.getEntityHistory);

// Get user activity
router.get('/user/:user_id/activity', AuditTrailControllerV2.getUserActivity);

// Get audit summary statistics
router.get('/summary', AuditTrailControllerV2.getAuditSummary);

// Export audit trail to CSV
router.get('/export', AuditTrailControllerV2.exportAuditTrail);

// Log manual audit entry
router.post('/', AuditTrailControllerV2.logAuditEntry);

// Get change comparison
router.get('/:id/comparison', AuditTrailControllerV2.getChangeComparison);

export default router;
