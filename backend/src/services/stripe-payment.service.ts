import pool from '../config/database';
import Stripe from 'stripe';
import InvoiceService from './invoice.service';
import { NotificationEmailService } from './notification-email.service';

// Stripe Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize Stripe (lazy initialization to avoid crashes)
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe && STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover'
    });
  }
  return stripe;
};

interface StripePaymentRequest {
  tenantId: string;
  userId: string;
  amount: number;
  plan: string;
  billingCycle: 'monthly' | 'annual';
  customerEmail: string;
  customerName: string;
  currency?: string;
}

interface StripePaymentResponse {
  sessionId: string;
  url: string;
  transactionReference: string;
}

export class StripePaymentService {
  /**
   * Create Stripe Checkout Session
   */
  static async createCheckoutSession(data: StripePaymentRequest): Promise<StripePaymentResponse> {
    const {
      tenantId,
      userId,
      amount,
      plan,
      billingCycle,
      customerEmail,
      customerName,
      currency = 'USD'
    } = data;

    // Generate unique transaction reference
    const transactionReference = this.generateTransactionReference(tenantId);

    // Store payment intent in database
    await pool.query(
      `INSERT INTO payment_transactions (
        tenant_id, user_id, transaction_reference, amount, currency,
        payment_gateway, plan, billing_cycle, status, customer_email, customer_name,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tenantId,
        userId,
        transactionReference,
        amount,
        currency,
        'stripe',
        plan,
        billingCycle,
        'pending',
        customerEmail,
        customerName,
        JSON.stringify({
          stripe_mode: STRIPE_SECRET_KEY.includes('test') ? 'test' : 'live'
        })
      ]
    );

    // Create or get Stripe customer
    const stripeCustomer = await this.getOrCreateStripeCustomer(
      tenantId,
      customerEmail,
      customerName
    );

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Aetheros ERP - ${this.getPlanDisplayName(plan)}`,
              description: `${billingCycle === 'monthly' ? 'Monthly' : 'Annual'} subscription`,
              images: ['https://aetheros.co.za/logo.png']
            },
            unit_amount: amountInCents,
            recurring: billingCycle === 'monthly' 
              ? { interval: 'month' } 
              : { interval: 'year' }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&ref=${transactionReference}`,
      cancel_url: `${process.env.APP_URL}/payment/cancel?ref=${transactionReference}`,
      metadata: {
        tenant_id: tenantId,
        user_id: userId,
        transaction_reference: transactionReference,
        plan,
        billing_cycle: billingCycle
      },
      subscription_data: {
        metadata: {
          tenant_id: tenantId,
          plan,
          billing_cycle: billingCycle
        }
      }
    });

    // Update transaction with session ID
    await pool.query(
      `UPDATE payment_transactions 
       SET gateway_session_id = $1, metadata = metadata || $2::jsonb
       WHERE transaction_reference = $3`,
      [
        session.id,
        JSON.stringify({ stripe_session_id: session.id }),
        transactionReference
      ]
    );

    return {
      sessionId: session.id,
      url: session.url || '',
      transactionReference
    };
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(body: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  /**
   * Handle successful checkout session
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { metadata } = session;
    if (!metadata) return;

    const { tenant_id, transaction_reference, plan, billing_cycle } = metadata;
    if (!tenant_id || !transaction_reference) return;

    const subscriptionId = session.subscription as string;
    const amountTotal = (session.amount_total || 0) / 100;

    // Update payment transaction
    await pool.query(
      `UPDATE payment_transactions 
       SET status = 'completed',
           gateway_transaction_id = $1,
           gateway_subscription_id = $2,
           paid_at = NOW(),
           gateway_response = $3,
           updated_at = NOW()
       WHERE transaction_reference = $4`,
      [
        session.payment_intent as string,
        subscriptionId,
        JSON.stringify(session),
        transaction_reference
      ]
    );

    // Activate subscription
    await this.activateSubscription(
      tenant_id,
      plan,
      billing_cycle,
      amountTotal,
      subscriptionId
    );

    // Log successful payment
    const transaction = await pool.query(
      'SELECT pt.user_id, pt.id, u.email FROM payment_transactions pt JOIN users u ON pt.user_id = u.id WHERE pt.transaction_reference = $1',
      [transaction_reference]
    );

    if (transaction.rows.length > 0) {
      const { user_id, id: transactionId, email } = transaction.rows[0];
      
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, 'payment_success', 'subscription', $3, $4)`,
        [
          tenant_id,
          user_id,
          transactionId,
          JSON.stringify({
            amount: amountTotal,
            plan,
            gateway: 'stripe',
            subscription_id: subscriptionId
          })
        ]
      );

      // Send payment success email (non-blocking)
      NotificationEmailService.sendPaymentSuccessEmail(
        email,
        user_id,
        {
          amount: amountTotal,
          currency: 'USD',
          planName: plan,
          invoiceNumber: `INV-${transactionId}`,
          paymentDate: new Date().toLocaleDateString()
        }
      ).catch(err => console.error('[StripePayment] Payment success email failed:', err));

      // Generate invoice (non-blocking)
      InvoiceService.generateInvoice({
        tenantId: tenant_id,
        amount: amountTotal,
        currency: 'USD',
        plan,
        billingCycle: billing_cycle,
        transactionId
      }).catch(err => {
        console.error('[StripePayment] Invoice generation failed:', err);
      });
    }
  }

  /**
   * Handle successful invoice payment (renewal)
   */
  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Extract subscription ID (can be string or Subscription object)
    // @ts-ignore - Stripe types don't expose subscription property correctly
    const subscriptionId = typeof invoice.subscription === 'string' 
      // @ts-ignore
      ? invoice.subscription 
      // @ts-ignore
      : invoice.subscription?.id;
    
    if (!subscriptionId) return;

    // Get subscription metadata
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { tenant_id } = stripeSubscription.metadata;
    if (!tenant_id) return;

    const amountPaid = (invoice.amount_paid || 0) / 100;

    // Update subscription end date
    // @ts-ignore - current_period_end exists but not in types
    const currentPeriodEnd = stripeSubscription.current_period_end || 0;
    const nextBillingDate = new Date(currentPeriodEnd * 1000);

    await pool.query(
      `UPDATE tenants 
       SET subscription_ends_at = $1,
           next_billing_date = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [nextBillingDate, tenant_id]
    );

    // Create payment transaction record for renewal
    await pool.query(
      `INSERT INTO payment_transactions (
        tenant_id, transaction_reference, amount, currency,
        payment_gateway, status, gateway_transaction_id, 
        gateway_subscription_id, paid_at
      ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, NOW())`,
      [
        tenant_id,
        `stripe-renewal-${invoice.id}`,
        amountPaid,
        invoice.currency.toUpperCase(),
        'stripe',
        // @ts-ignore - payment_intent can be string or object
        typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
        subscriptionId
      ]
    );
  }

  /**
   * Handle failed invoice payment
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Extract subscription ID
    // @ts-ignore - Stripe types don't expose subscription property correctly
    const subscriptionId = typeof invoice.subscription === 'string' 
      // @ts-ignore
      ? invoice.subscription 
      // @ts-ignore
      : invoice.subscription?.id;
    
    if (!subscriptionId) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { tenant_id } = stripeSubscription.metadata;
    if (!tenant_id) return;

    // Update tenant status
    await pool.query(
      `UPDATE tenants 
       SET subscription_status = 'past_due',
           updated_at = NOW()
       WHERE id = $1`,
      [tenant_id]
    );

    // TODO: Send payment failed email
  }

  /**
   * Handle subscription updated
   */
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const { tenant_id, plan } = subscription.metadata;
    if (!tenant_id) return;

    const status = subscription.status;
    // @ts-ignore - current_period_end exists but not in types
    const currentPeriodEnd = subscription.current_period_end || 0;
    const endDate = new Date(currentPeriodEnd * 1000);

    await pool.query(
      `UPDATE tenants 
       SET subscription_status = $1,
           subscription_ends_at = $2,
           subscription_plan = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [status, endDate, plan || 'professional', tenant_id]
    );
  }

  /**
   * Handle subscription deleted (cancelled)
   */
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const { tenant_id } = subscription.metadata;
    if (!tenant_id) return;

    await pool.query(
      `UPDATE tenants 
       SET subscription_status = 'cancelled',
           status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1`,
      [tenant_id]
    );
  }

  /**
   * Get or create Stripe customer
   */
  private static async getOrCreateStripeCustomer(
    tenantId: string,
    email: string,
    name: string
  ): Promise<Stripe.Customer> {
    // Check if customer exists in our database
    const result = await pool.query(
      `SELECT stripe_customer_id FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length > 0 && result.rows[0].stripe_customer_id) {
      try {
        return await stripe.customers.retrieve(result.rows[0].stripe_customer_id) as Stripe.Customer;
      } catch (err) {
        // Customer doesn't exist in Stripe, create new
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        tenant_id: tenantId
      }
    });

    // Store customer ID
    await pool.query(
      `UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2`,
      [customer.id, tenantId]
    );

    return customer;
  }

  /**
   * Activate subscription after successful payment
   */
  private static async activateSubscription(
    tenantId: string,
    plan: string,
    billingCycle: string,
    amount: number,
    stripeSubscriptionId: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const startDate = new Date();
      const endDate = new Date();
      
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const nextBillingDate = new Date(endDate);

      await client.query(
        `UPDATE tenants 
         SET subscription_plan = $1,
             subscription_status = 'active',
             status = 'active',
             subscription_starts_at = $2,
             subscription_ends_at = $3,
             next_billing_date = $4,
             billing_cycle = $5,
             trial_ends_at = NULL,
             stripe_subscription_id = $6,
             updated_at = NOW()
         WHERE id = $7`,
        [plan, startDate, endDate, nextBillingDate, billingCycle, stripeSubscriptionId, tenantId]
      );

      await client.query(
        `INSERT INTO subscriptions (
          tenant_id, plan, status, starts_at, ends_at, 
          billing_cycle, amount, currency, stripe_subscription_id
        ) VALUES ($1, $2, 'active', $3, $4, $5, $6, 'USD', $7)`,
        [tenantId, plan, startDate, endDate, billingCycle, amount, stripeSubscriptionId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Stripe subscription
   */
  static async cancelSubscription(tenantId: string): Promise<void> {
    const result = await pool.query(
      `SELECT stripe_subscription_id FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
      throw new Error('No active Stripe subscription found');
    }

    const subscriptionId = result.rows[0].stripe_subscription_id;

    // Cancel at period end (don't cancel immediately)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    await pool.query(
      `UPDATE tenants 
       SET subscription_status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );
  }

  /**
   * Generate transaction reference
   */
  private static generateTransactionReference(tenantId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tenantPrefix = tenantId.substring(0, 8).toUpperCase();
    return `AE-STRIPE-${tenantPrefix}-${timestamp}-${random}`;
  }

  /**
   * Get plan display name
   */
  private static getPlanDisplayName(plan: string): string {
    const names: Record<string, string> = {
      starter: 'Starter Plan',
      professional: 'Professional Plan',
      enterprise: 'Enterprise Plan'
    };
    return names[plan] || 'Subscription';
  }

  /**
   * Check if Stripe is configured
   */
  static isConfigured(): boolean {
    return !!STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== '';
  }

  /**
   * Get pricing for plan (USD)
   */
  static getPlanPricing(plan: string, billingCycle: string): number {
    const pricing: Record<string, Record<string, number>> = {
      starter: {
        monthly: 29,
        annual: 290  // ~$24/month (2 months free)
      },
      professional: {
        monthly: 99,
        annual: 990  // ~$82.50/month (2 months free)
      },
      enterprise: {
        monthly: 249,
        annual: 2490  // ~$207.50/month (2 months free)
      }
    };

    return pricing[plan]?.[billingCycle] || 0;
  }
}

export default StripePaymentService;
