import { Router } from 'express';
import DemoResetController from '../controllers/demo-reset.controller';
import DemoAccessController from '../controllers/demo-access.controller';

const router = Router();

/**
 * Demo Routes
 * 
 * Public demo access routes (no auth required)
 */

// Generate demo access token (instant access)
router.post('/access', DemoAccessController.generateDemoToken);

// Get demo information for landing page
router.get('/info', DemoAccessController.getDemoInfo);

// Get demo usage statistics (for admin)
router.get('/statistics', DemoAccessController.getDemoStatistics);

/**
 * Demo Reset Routes
 * 
 * Note: In production, these should be protected by super admin authentication
 * For now, they're open for testing purposes
 */

// Manually trigger demo reset (for testing/emergency)
router.post('/reset', DemoResetController.triggerReset);

// Get reset statistics and status
router.get('/reset/status', DemoResetController.getResetStatus);

// Health check
router.get('/reset/health', DemoResetController.healthCheck);

export default router;
