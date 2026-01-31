import { Request, Response } from 'express';
import OzowPaymentService from '../services/ozow-payment.service';
import StripePaymentService from '../services/stripe-payment.service';

export class WebhookController {
  /**
   * POST /api/webhooks/ozow
   * Handle Ozow payment notifications
   */
  static async handleOzowWebhook(req: Request, res: Response): Promise<void> {
    try {
      const notification = req.body;

      // Log webhook for debugging
      console.log('[Ozow Webhook] Received notification:', {
        TransactionReference: notification.TransactionReference,
        Status: notification.Status,
        Amount: notification.Amount
      });

      // Process notification
      await OzowPaymentService.handleNotification(notification);

      // Ozow expects a 200 OK response
      res.status(200).send('OK');
    } catch (error: any) {
      console.error('[Ozow Webhook] Error:', error);
      
      // Still return 200 to prevent Ozow from retrying
      // But log the error for investigation
      res.status(200).send('ERROR');
    }
  }

  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      // Get raw body (important for signature verification)
      const rawBody = req.body;

      // Log webhook for debugging
      console.log('[Stripe Webhook] Received event');

      // Process webhook
      await StripePaymentService.handleWebhook(rawBody, signature);

      // Stripe expects a 200 response
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[Stripe Webhook] Error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default WebhookController;
