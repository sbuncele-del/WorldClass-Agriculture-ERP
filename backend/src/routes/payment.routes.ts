/**
 * Payment Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import PaymentControllerV2 from '../controllers/payment.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

router.post('/create-session', PaymentControllerV2.createPaymentSession);
router.get('/status/:reference', PaymentControllerV2.getPaymentStatus);
router.get('/history', PaymentControllerV2.getPaymentHistory);
router.post('/cancel/:reference', PaymentControllerV2.cancelPayment);
router.get('/pricing', PaymentControllerV2.getPricing);

export default router;
