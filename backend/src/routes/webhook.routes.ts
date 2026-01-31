import { Router } from 'express';
import WebhookController from '../controllers/webhook.controller';

const router = Router();

/**
 * Webhook Routes (public, no authentication)
 * These endpoints receive notifications from payment gateways
 */

// Ozow payment notifications
router.post('/ozow', WebhookController.handleOzowWebhook);

// Stripe webhook events
router.post('/stripe', WebhookController.handleStripeWebhook);

export default router;
