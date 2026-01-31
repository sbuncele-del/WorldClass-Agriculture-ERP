import { Response } from 'express';
import { TenantRequest } from '../types';
import OzowPaymentService from '../services/ozow-payment.service';
import StripePaymentService from '../services/stripe-payment.service';

export class PaymentController {
  /**
   * POST /api/payment/create-session
   * Create payment session (Ozow or Stripe based on country)
   */
  static async createPaymentSession(req: TenantRequest, res: Response): Promise<void> {
    try {
      const {
        plan,
        billingCycle = 'monthly',
        paymentMethod = 'auto' // 'ozow', 'stripe', or 'auto'
      } = req.body;

      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate plan
      const validPlans = ['starter', 'professional', 'enterprise'];
      if (!validPlans.includes(plan)) {
        res.status(400).json({ error: 'Invalid plan', validPlans });
        return;
      }

      // Validate billing cycle
      if (!['monthly', 'annual'].includes(billingCycle)) {
        res.status(400).json({ error: 'Invalid billing cycle', valid: ['monthly', 'annual'] });
        return;
      }

      // Determine payment gateway
      let gateway = paymentMethod;
      if (gateway === 'auto') {
        // Use Ozow for South African customers, Stripe for others
        const tenantCountry = req.tenant.settings?.country || 'ZA';
        gateway = tenantCountry === 'ZA' && OzowPaymentService.isConfigured() ? 'ozow' : 'stripe';
      }

      // Get pricing
      let amount: number;
      let currency: string;
      let paymentUrl: string;
      let transactionReference: string;

      const paymentData = {
        tenantId: req.tenant.id,
        userId: req.user.id,
        amount: 0,
        plan,
        billingCycle,
        customerEmail: req.user.email,
        customerName: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim()
      };

      if (gateway === 'ozow') {
        // Ozow payment (ZAR)
        if (!OzowPaymentService.isConfigured()) {
          res.status(503).json({ error: 'Ozow payment gateway not configured' });
          return;
        }

        amount = OzowPaymentService.getPlanPricing(plan, billingCycle);
        currency = 'ZAR';

        const ozowResponse = await OzowPaymentService.createPaymentRequest({
          ...paymentData,
          amount
        });

        paymentUrl = ozowResponse.url;
        transactionReference = ozowResponse.transactionReference;

      } else {
        // Stripe payment (USD or other)
        if (!StripePaymentService.isConfigured()) {
          res.status(503).json({ error: 'Stripe payment gateway not configured' });
          return;
        }

        amount = StripePaymentService.getPlanPricing(plan, billingCycle);
        currency = 'USD';

        const stripeResponse = await StripePaymentService.createCheckoutSession({
          ...paymentData,
          amount,
          currency
        });

        paymentUrl = stripeResponse.url;
        transactionReference = stripeResponse.transactionReference;
      }

      res.status(200).json({
        success: true,
        data: {
          gateway,
          paymentUrl,
          transactionReference,
          amount,
          currency,
          plan,
          billingCycle
        }
      });
    } catch (error: any) {
      console.error('Create payment session error:', error);
      res.status(500).json({ error: 'Failed to create payment session' });
    }
  }

  /**
   * GET /api/payment/status/:reference
   * Get payment transaction status
   */
  static async getPaymentStatus(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { reference } = req.params;

      if (!req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const payment = await OzowPaymentService.getPaymentStatus(reference);

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      // Check tenant access
      if (payment.tenant_id !== req.tenant.id) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          reference: payment.transaction_reference,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          gateway: payment.payment_gateway,
          plan: payment.plan,
          billingCycle: payment.billing_cycle,
          paidAt: payment.paid_at,
          createdAt: payment.created_at
        }
      });
    } catch (error: any) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: 'Failed to get payment status' });
    }
  }

  /**
   * GET /api/payment/history
   * Get tenant payment history
   */
  static async getPaymentHistory(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const payments = await OzowPaymentService.getPaymentHistory(req.tenant.id);

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error: any) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Failed to get payment history' });
    }
  }

  /**
   * POST /api/payment/cancel/:reference
   * Cancel pending payment
   */
  static async cancelPayment(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { reference } = req.params;

      if (!req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await OzowPaymentService.cancelPayment(reference, req.tenant.id);

      res.status(200).json({
        success: true,
        message: 'Payment cancelled'
      });
    } catch (error: any) {
      console.error('Cancel payment error:', error);
      res.status(500).json({ error: 'Failed to cancel payment' });
    }
  }

  /**
   * GET /api/payment/pricing
   * Get pricing information for all plans
   */
  static async getPricing(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { gateway = 'auto' } = req.query;

      // Determine which gateway to use
      let selectedGateway = gateway as string;
      if (selectedGateway === 'auto') {
        const tenantCountry = req.tenant?.settings?.country || 'ZA';
        selectedGateway = tenantCountry === 'ZA' ? 'ozow' : 'stripe';
      }

      const plans = ['starter', 'professional', 'enterprise'];
      const pricing: any = {};

      for (const plan of plans) {
        if (selectedGateway === 'ozow') {
          pricing[plan] = {
            monthly: {
              amount: OzowPaymentService.getPlanPricing(plan, 'monthly'),
              currency: 'ZAR'
            },
            annual: {
              amount: OzowPaymentService.getPlanPricing(plan, 'annual'),
              currency: 'ZAR',
              discount: '2 months free'
            }
          };
        } else {
          pricing[plan] = {
            monthly: {
              amount: StripePaymentService.getPlanPricing(plan, 'monthly'),
              currency: 'USD'
            },
            annual: {
              amount: StripePaymentService.getPlanPricing(plan, 'annual'),
              currency: 'USD',
              discount: '2 months free'
            }
          };
        }
      }

      res.status(200).json({
        success: true,
        data: {
          gateway: selectedGateway,
          pricing
        }
      });
    } catch (error: any) {
      console.error('Get pricing error:', error);
      res.status(500).json({ error: 'Failed to get pricing' });
    }
  }
}

export default PaymentController;
