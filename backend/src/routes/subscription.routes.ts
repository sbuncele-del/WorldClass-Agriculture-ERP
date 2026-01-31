/**
 * Subscription Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import SubscriptionControllerV2 from '../controllers/subscription.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

router.get('/', SubscriptionControllerV2.getCurrentSubscription);
router.get('/status', SubscriptionControllerV2.getSubscriptionStatus);
router.get('/plans', SubscriptionControllerV2.getAvailablePlans);
router.get('/billing-history', SubscriptionControllerV2.getBillingHistory);
router.post('/upgrade', SubscriptionControllerV2.upgradePlan);
router.post('/downgrade', SubscriptionControllerV2.downgradePlan);
router.post('/cancel', SubscriptionControllerV2.cancelSubscription);
router.post('/reactivate', SubscriptionControllerV2.reactivateSubscription);
router.put('/payment-method', SubscriptionControllerV2.updatePaymentMethod);

export default router;
