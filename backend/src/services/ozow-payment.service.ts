import pool from '../config/database';
import { createHash } from 'crypto';
import InvoiceService from './invoice.service';

// Ozow Configuration
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE || '';
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY || '';
const OZOW_API_KEY = process.env.OZOW_API_KEY || '';
const OZOW_BASE_URL = process.env.OZOW_BASE_URL || 'https://pay.ozow.com';
const OZOW_IS_TEST = process.env.OZOW_IS_TEST === 'true';

interface OzowPaymentRequest {
  tenantId: string;
  userId: string;
  amount: number;
  plan: string;
  billingCycle: 'monthly' | 'annual';
  customerEmail: string;
  customerName: string;
}

interface OzowPaymentResponse {
  url: string;
  transactionReference: string;
}

interface OzowNotification {
  SiteCode: string;
  TransactionId: string;
  TransactionReference: string;
  Amount: string;
  Status: string;
  StatusMessage: string;
  CurrencyCode: string;
  IsTest: string;
  Hash: string;
}

export class OzowPaymentService {
  /**
   * Generate Ozow payment request URL
   */
  static async createPaymentRequest(data: OzowPaymentRequest): Promise<OzowPaymentResponse> {
    const {
      tenantId,
      userId,
      amount,
      plan,
      billingCycle,
      customerEmail,
      customerName
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
        'ZAR',
        'ozow',
        plan,
        billingCycle,
        'pending',
        customerEmail,
        customerName,
        JSON.stringify({
          site_code: OZOW_SITE_CODE,
          is_test: OZOW_IS_TEST
        })
      ]
    );

    // Calculate amount in cents (Ozow uses cents)
    const amountInCents = Math.round(amount * 100);

    // Build Ozow payment URL
    const successUrl = `${process.env.APP_URL}/payment/success?ref=${transactionReference}`;
    const cancelUrl = `${process.env.APP_URL}/payment/cancel?ref=${transactionReference}`;
    const errorUrl = `${process.env.APP_URL}/payment/error?ref=${transactionReference}`;
    const notifyUrl = `${process.env.API_URL}/api/webhooks/ozow`;

    // Ozow requires specific parameter order for hash
    const hashString = [
      OZOW_SITE_CODE,
      transactionReference,
      amountInCents.toString(),
      'ZAR',
      OZOW_IS_TEST ? 'true' : 'false',
      OZOW_PRIVATE_KEY
    ].join('');

    const hashCheck = createHash('sha512')
      .update(hashString.toLowerCase())
      .digest('hex')
      .toLowerCase();

    // Build payment URL with query parameters
    const params = new URLSearchParams({
      SiteCode: OZOW_SITE_CODE,
      TransactionReference: transactionReference,
      Amount: amountInCents.toString(),
      CurrencyCode: 'ZAR',
      IsTest: OZOW_IS_TEST ? 'true' : 'false',
      Customer: customerEmail,
      BankReference: `${plan.toUpperCase()}-${billingCycle.toUpperCase()}`,
      SuccessUrl: successUrl,
      CancelUrl: cancelUrl,
      ErrorUrl: errorUrl,
      NotifyUrl: notifyUrl,
      HashCheck: hashCheck
    });

    const paymentUrl = `${OZOW_BASE_URL}?${params.toString()}`;

    return {
      url: paymentUrl,
      transactionReference
    };
  }

  /**
   * Handle Ozow payment notification (webhook)
   */
  static async handleNotification(notification: OzowNotification): Promise<void> {
    // Verify hash
    const isValid = this.verifyNotificationHash(notification);
    
    if (!isValid) {
      throw new Error('Invalid notification hash - possible tampering');
    }

    const {
      TransactionReference,
      Status,
      StatusMessage,
      Amount,
      TransactionId
    } = notification;

    // Get payment transaction
    const result = await pool.query(
      `SELECT * FROM payment_transactions 
       WHERE transaction_reference = $1`,
      [TransactionReference]
    );

    if (result.rows.length === 0) {
      throw new Error(`Transaction not found: ${TransactionReference}`);
    }

    const transaction = result.rows[0];
    const amountInRands = parseFloat(Amount) / 100;

    // Update transaction status
    await pool.query(
      `UPDATE payment_transactions 
       SET status = $1, 
           gateway_transaction_id = $2,
           paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END,
           gateway_response = $3,
           updated_at = NOW()
       WHERE transaction_reference = $4`,
      [
        Status.toLowerCase() === 'complete' ? 'completed' : 'failed',
        TransactionId,
        JSON.stringify(notification),
        TransactionReference
      ]
    );

    // If payment successful, activate subscription
    if (Status.toLowerCase() === 'complete') {
      await this.activateSubscription(
        transaction.tenant_id,
        transaction.plan,
        transaction.billing_cycle,
        amountInRands,
        TransactionReference
      );

      // Log successful payment
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, 'payment_success', 'subscription', $3, $4)`,
        [
          transaction.tenant_id,
          transaction.user_id,
          transaction.id,
          JSON.stringify({
            amount: amountInRands,
            plan: transaction.plan,
            gateway: 'ozow',
            transaction_id: TransactionId
          })
        ]
      );
    } else {
      // Log failed payment
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, 'payment_failed', 'subscription', $3, $4)`,
        [
          transaction.tenant_id,
          transaction.user_id,
          transaction.id,
          JSON.stringify({
            amount: amountInRands,
            plan: transaction.plan,
            gateway: 'ozow',
            status_message: StatusMessage
          })
        ]
      );
    }
  }

  /**
   * Verify Ozow notification hash
   */
  private static verifyNotificationHash(notification: OzowNotification): boolean {
    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      CurrencyCode,
      IsTest,
      Hash
    } = notification;

    // Reconstruct hash string (must match Ozow's order)
    const hashString = [
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      '',  // Optional1
      '',  // Optional2
      '',  // Optional3
      '',  // Optional4
      '',  // Optional5
      CurrencyCode,
      IsTest,
      '',  // StatusMessage
      OZOW_PRIVATE_KEY
    ].join('').toLowerCase();

    const calculatedHash = createHash('sha512')
      .update(hashString)
      .digest('hex')
      .toLowerCase();

    return calculatedHash === Hash.toLowerCase();
  }

  /**
   * Activate subscription after successful payment
   */
  private static async activateSubscription(
    tenantId: string,
    plan: string,
    billingCycle: string,
    amount: number,
    transactionReference: string
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const nextBillingDate = new Date(endDate);

      // Update tenant subscription
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
             updated_at = NOW()
         WHERE id = $6`,
        [plan, startDate, endDate, nextBillingDate, billingCycle, tenantId]
      );

      // Create subscription record
      await client.query(
        `INSERT INTO subscriptions (
          tenant_id, plan, status, starts_at, ends_at, 
          billing_cycle, amount, currency
        ) VALUES ($1, $2, 'active', $3, $4, $5, $6, 'ZAR')`,
        [tenantId, plan, startDate, endDate, billingCycle, amount]
      );

      await client.query('COMMIT');

      // Generate invoice (non-blocking)
      const transactionResult = await pool.query(
        'SELECT id FROM payment_transactions WHERE transaction_reference = $1',
        [transactionReference]
      );
      
      if (transactionResult.rows.length > 0) {
        InvoiceService.generateInvoice({
          tenantId,
          amount,
          currency: 'ZAR',
          plan,
          billingCycle,
          transactionId: transactionResult.rows[0].id
        }).catch(err => {
          console.error('[OzowPayment] Invoice generation failed:', err);
        });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique transaction reference
   */
  private static generateTransactionReference(tenantId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tenantPrefix = tenantId.substring(0, 8).toUpperCase();
    return `AE-${tenantPrefix}-${timestamp}-${random}`;
  }

  /**
   * Get payment status
   */
  static async getPaymentStatus(transactionReference: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
        pt.*,
        t.name as tenant_name,
        t.slug as tenant_slug
       FROM payment_transactions pt
       JOIN tenants t ON pt.tenant_id = t.id
       WHERE pt.transaction_reference = $1`,
      [transactionReference]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get tenant payment history
   */
  static async getPaymentHistory(tenantId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        id, transaction_reference, amount, currency,
        payment_gateway, plan, billing_cycle, status,
        paid_at, created_at, gateway_transaction_id
       FROM payment_transactions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [tenantId]
    );

    return result.rows;
  }

  /**
   * Cancel pending payment
   */
  static async cancelPayment(transactionReference: string, tenantId: string): Promise<void> {
    await pool.query(
      `UPDATE payment_transactions 
       SET status = 'cancelled', updated_at = NOW()
       WHERE transaction_reference = $1 
         AND tenant_id = $2 
         AND status = 'pending'`,
      [transactionReference, tenantId]
    );
  }

  /**
   * Check if Ozow is configured
   */
  static isConfigured(): boolean {
    return !!(OZOW_SITE_CODE && OZOW_PRIVATE_KEY && OZOW_API_KEY);
  }

  /**
   * Get pricing for plan
   */
  static getPlanPricing(plan: string, billingCycle: string): number {
    const pricing: Record<string, Record<string, number>> = {
      starter: {
        monthly: 499,
        annual: 4990  // ~R416/month (2 months free)
      },
      professional: {
        monthly: 1999,
        annual: 19990  // ~R1666/month (2 months free)
      },
      enterprise: {
        monthly: 4999,
        annual: 49990  // ~R4166/month (2 months free)
      }
    };

    return pricing[plan]?.[billingCycle] || 0;
  }
}

export default OzowPaymentService;
