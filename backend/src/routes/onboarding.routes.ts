/**
 * Onboarding Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import OnboardingControllerV2 from '../controllers/onboarding.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

router.get('/status', OnboardingControllerV2.getStatus);
router.patch('/', OnboardingControllerV2.update);
router.post('/complete', OnboardingControllerV2.complete);
router.post('/skip', OnboardingControllerV2.skip);
router.post('/reset', OnboardingControllerV2.reset);
router.get('/checklist', OnboardingControllerV2.getChecklist);

export default router;
