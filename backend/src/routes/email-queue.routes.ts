import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as emailQueueController from '../controllers/email-queue.controller';

/**
 * Email Queue Admin Routes
 * 
 * All routes require super admin authentication.
 */

const router = Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantMiddleware);

// Queue statistics
router.get('/stats', emailQueueController.getStats);

// Queue health check
router.get('/health', emailQueueController.healthCheck);

// Failed jobs management
router.get('/failed', emailQueueController.getFailedJobsList);
router.delete('/failed', emailQueueController.clearFailed);

// Completed jobs cleanup
router.delete('/completed', emailQueueController.clearCompleted);

// Queue control
router.post('/pause', emailQueueController.pause);
router.post('/resume', emailQueueController.resume);

// Job management
router.get('/jobs/:jobId', emailQueueController.getJobDetails);
router.post('/retry/:jobId', emailQueueController.retryJob);

export default router;
