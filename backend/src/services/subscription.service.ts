import pool from '../config/database';
import StripePaymentService from './stripe-payment.service';
import OzowPaymentService from './ozow-payment.service';

interface SubscriptionDetails {
  tenantId: string;
  plan: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  paymentGateway: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  features: {
    maxUsers: number;
    maxStorageGb: number;
    [key: string]: any;
  };
}

interface PlanLimits {
  maxUsers: number;
  maxStorageGb: number;
  features: {
    advancedReporting: boolean;
    multiCurrency: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    auditLog: boolean;
    [key: string]: boolean;
  };
}

export class SubscriptionService {
  /**
   * Get plan limits based on subscription tier
   */
  private static getPlanLimits(plan: string): PlanLimits {
    const limits: { [key: string]: PlanLimits } = {
      trial: {
        maxUsers: 2,
        maxStorageGb: 1,
        features: {
          advancedReporting: false,
          multiCurrency: false,
          apiAccess: false,
          customBranding: false,
          prioritySupport: false,
          auditLog: false
        }
      },
      starter: {
        maxUsers: 5,
        maxStorageGb: 10,
        features: {
          advancedReporting: false,
          multiCurrency: false,
          apiAccess: false,
          customBranding: false,
          prioritySupport: false,
          auditLog: true
        }
      },
      professional: {
        maxUsers: 25,
        maxStorageGb: 50,
        features: {
          advancedReporting: true,
          multiCurrency: true,
          apiAccess: true,
          customBranding: false,
          prioritySupport: true,
          auditLog: true
        }
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxStorageGb: 500,
        features: {
          advancedReporting: true,
          multiCurrency: true,
          apiAccess: true,
          customBranding: true,
          prioritySupport: true,
          auditLog: true
        }
      }
    };

    return limits[plan] || limits.trial;
  }

  /**
   * Get current subscription details for a tenant
   */
  static async getCurrentSubscription(tenantId: string): Promise<SubscriptionDetails | null> {
    const result = await pool.query(
      `SELECT 
        id as tenant_id,
        subscription_plan as plan,
        subscription_status as status,
        billing_cycle,
        subscription_amount as amount,
        subscription_currency as currency,
        subscription_starts_at as start_date,
        subscription_ends_at as end_date,
        next_billing_date,
        payment_gateway,
        auto_renew,
        cancel_at_period_end,
        max_users,
        max_storage_gb
      FROM tenants
      WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const tenant = result.rows[0];
    const limits = this.getPlanLimits(tenant.plan);

    return {
      tenantId: tenant.tenant_id,
      plan: tenant.plan,
      status: tenant.status,
      billingCycle: tenant.billing_cycle || 'monthly',
      amount: parseFloat(tenant.amount) || 0,
      currency: tenant.currency || 'ZAR',
      startDate: tenant.start_date,
      endDate: tenant.end_date,
      nextBillingDate: tenant.next_billing_date,
      paymentGateway: tenant.payment_gateway || 'stripe',
      autoRenew: tenant.auto_renew !== false,
      cancelAtPeriodEnd: tenant.cancel_at_period_end === true,
      features: {
        maxUsers: tenant.max_users || limits.maxUsers,
        maxStorageGb: tenant.max_storage_gb || limits.maxStorageGb,
        ...limits.features
      }
    };
  }

  /**
   * Upgrade subscription to a higher tier (immediate)
   */
  static async upgradePlan(
    tenantId: string,
    newPlan: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<{ success: boolean; message: string; prorationAmount?: number }> {
    try {
      // Get current subscription
      const currentSub = await this.getCurrentSubscription(tenantId);
      if (!currentSub) {
        return { success: false, message: 'Subscription not found' };
      }

      // Validate upgrade path
      const planHierarchy = ['trial', 'starter', 'professional', 'enterprise'];
      const currentPlanIndex = planHierarchy.indexOf(currentSub.plan);
      const newPlanIndex = planHierarchy.indexOf(newPlan);

      if (newPlanIndex <= currentPlanIndex) {
        return { success: false, message: 'New plan must be higher than current plan' };
      }

      // Get new plan pricing
      const country = await this.getTenantCountry(tenantId);
      const gateway = country === 'ZA' && OzowPaymentService.isConfigured() ? 'ozow' : 'stripe';
      
      let newAmount: number;
      let currency: string;
      
      if (gateway === 'ozow') {
        newAmount = OzowPaymentService.getPlanPricing(newPlan, billingCycle);
        currency = 'ZAR';
      } else {
        newAmount = StripePaymentService.getPlanPricing(newPlan, billingCycle);
        currency = 'USD';
      }

      // Calculate proration (simplified: charge difference immediately)
      const daysRemaining = Math.ceil(
        (currentSub.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = billingCycle === 'monthly' ? 30 : 365;
      const prorationFactor = daysRemaining / totalDays;
      const currentAmount = currentSub.amount;
      const prorationAmount = Math.max(0, (newAmount - currentAmount) * prorationFactor);

      // Update tenant subscription
      const limits = this.getPlanLimits(newPlan);
      
      await pool.query(
        `UPDATE tenants
         SET subscription_plan = $1,
             billing_cycle = $2,
             subscription_amount = $3,
             subscription_currency = $4,
             max_users = $5,
             max_storage_gb = $6,
             updated_at = NOW()
         WHERE id = $7`,
        [
          newPlan,
          billingCycle,
          newAmount,
          currency,
          limits.maxUsers,
          limits.maxStorageGb,
          tenantId
        ]
      );

      // Log upgrade event
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES ($1, 'system', 'upgrade_subscription', 'tenant', $1, $2, '0.0.0.0')`,
        [
          tenantId,
          JSON.stringify({
            from: currentSub.plan,
            to: newPlan,
            billingCycle,
            prorationAmount
          })
        ]
      );

      return {
        success: true,
        message: `Successfully upgraded to ${newPlan} plan`,
        prorationAmount
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Upgrade error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Downgrade subscription (takes effect at end of billing period)
   */
  static async downgradePlan(
    tenantId: string,
    newPlan: 'starter' | 'professional'
  ): Promise<{ success: boolean; message: string; effectiveDate?: Date }> {
    try {
      const currentSub = await this.getCurrentSubscription(tenantId);
      if (!currentSub) {
        return { success: false, message: 'Subscription not found' };
      }

      // Validate downgrade path
      const planHierarchy = ['trial', 'starter', 'professional', 'enterprise'];
      const currentPlanIndex = planHierarchy.indexOf(currentSub.plan);
      const newPlanIndex = planHierarchy.indexOf(newPlan);

      if (newPlanIndex >= currentPlanIndex) {
        return { success: false, message: 'New plan must be lower than current plan' };
      }

      // Schedule downgrade for end of current period
      await pool.query(
        `UPDATE tenants
         SET pending_plan_change = $1,
             pending_plan_change_date = subscription_ends_at,
             updated_at = NOW()
         WHERE id = $2`,
        [newPlan, tenantId]
      );

      // Log downgrade event
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES ($1, 'system', 'schedule_downgrade', 'tenant', $1, $2, '0.0.0.0')`,
        [
          tenantId,
          JSON.stringify({
            from: currentSub.plan,
            to: newPlan,
            effectiveDate: currentSub.endDate
          })
        ]
      );

      return {
        success: true,
        message: `Downgrade to ${newPlan} scheduled for end of billing period`,
        effectiveDate: currentSub.endDate
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Downgrade error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel subscription (takes effect at end of billing period)
   */
  static async cancelSubscription(
    tenantId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; effectiveDate?: Date }> {
    try {
      const currentSub = await this.getCurrentSubscription(tenantId);
      if (!currentSub) {
        return { success: false, message: 'Subscription not found' };
      }

      if (currentSub.status === 'cancelled') {
        return { success: false, message: 'Subscription already cancelled' };
      }

      // Mark for cancellation at period end
      await pool.query(
        `UPDATE tenants
         SET cancel_at_period_end = true,
             auto_renew = false,
             cancellation_reason = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [reason || 'User requested cancellation', tenantId]
      );

      // Cancel with payment gateway
      if (currentSub.paymentGateway === 'stripe') {
        const customerResult = await pool.query(
          'SELECT stripe_customer_id FROM tenants WHERE id = $1',
          [tenantId]
        );
        
        if (customerResult.rows[0]?.stripe_customer_id) {
          await StripePaymentService.cancelSubscription(customerResult.rows[0].stripe_customer_id);
        }
      }

      // Log cancellation
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES ($1, 'system', 'cancel_subscription', 'tenant', $1, $2, '0.0.0.0')`,
        [
          tenantId,
          JSON.stringify({
            plan: currentSub.plan,
            reason: reason || 'User requested',
            effectiveDate: currentSub.endDate
          })
        ]
      );

      return {
        success: true,
        message: 'Subscription will be cancelled at the end of billing period',
        effectiveDate: currentSub.endDate
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Cancel error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  static async reactivateSubscription(tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentSub = await this.getCurrentSubscription(tenantId);
      if (!currentSub) {
        return { success: false, message: 'Subscription not found' };
      }

      if (!currentSub.cancelAtPeriodEnd && currentSub.status === 'active') {
        return { success: false, message: 'Subscription is already active' };
      }

      // Reactivate subscription
      await pool.query(
        `UPDATE tenants
         SET cancel_at_period_end = false,
             auto_renew = true,
             subscription_status = 'active',
             cancellation_reason = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [tenantId]
      );

      // Log reactivation
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES ($1, 'system', 'reactivate_subscription', 'tenant', $1, $2, '0.0.0.0')`,
        [tenantId, JSON.stringify({ status: 'reactivated' })]
      );

      return {
        success: true,
        message: 'Subscription reactivated successfully'
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Reactivate error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update payment method (switch between Ozow and Stripe)
   */
  static async updatePaymentMethod(
    tenantId: string,
    newGateway: 'ozow' | 'stripe'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate gateway configuration
      if (newGateway === 'ozow' && !OzowPaymentService.isConfigured()) {
        return { success: false, message: 'Ozow payment gateway not configured' };
      }

      if (newGateway === 'stripe' && !StripePaymentService.isConfigured()) {
        return { success: false, message: 'Stripe payment gateway not configured' };
      }

      await pool.query(
        `UPDATE tenants
         SET payment_gateway = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [newGateway, tenantId]
      );

      return {
        success: true,
        message: `Payment method updated to ${newGateway}`
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Update payment method error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Check subscription status and handle expirations
   */
  static async checkSubscriptionStatus(tenantId: string): Promise<{
    isActive: boolean;
    status: string;
    daysRemaining: number;
    needsRenewal: boolean;
  }> {
    const currentSub = await this.getCurrentSubscription(tenantId);
    
    if (!currentSub) {
      return {
        isActive: false,
        status: 'not_found',
        daysRemaining: 0,
        needsRenewal: true
      };
    }

    const now = new Date();
    const endDate = new Date(currentSub.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if subscription has expired
    if (daysRemaining <= 0 && currentSub.status === 'active') {
      await pool.query(
        `UPDATE tenants
         SET subscription_status = 'expired',
             updated_at = NOW()
         WHERE id = $1`,
        [tenantId]
      );

      return {
        isActive: false,
        status: 'expired',
        daysRemaining: 0,
        needsRenewal: true
      };
    }

    return {
      isActive: currentSub.status === 'active',
      status: currentSub.status,
      daysRemaining: Math.max(0, daysRemaining),
      needsRenewal: daysRemaining <= 7 && !currentSub.autoRenew
    };
  }

  /**
   * Update tenant feature limits based on plan
   */
  static async updateTenantLimits(
    tenantId: string,
    plan: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const limits = this.getPlanLimits(plan);

      await pool.query(
        `UPDATE tenants
         SET max_users = $1,
             max_storage_gb = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [limits.maxUsers, limits.maxStorageGb, tenantId]
      );

      return {
        success: true,
        message: 'Tenant limits updated successfully'
      };
    } catch (error: any) {
      console.error('[SubscriptionService] Update limits error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get tenant country for gateway selection
   */
  private static async getTenantCountry(tenantId: string): Promise<string> {
    const result = await pool.query(
      `SELECT settings FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return 'ZA'; // Default to South Africa
    }

    const settings = result.rows[0].settings || {};
    return settings.country || 'ZA';
  }

  /**
   * Get usage statistics for a tenant
   */
  static async getUsageStatistics(tenantId: string): Promise<{
    currentUsers: number;
    maxUsers: number;
    storageUsedGb: number;
    maxStorageGb: number;
    usersPercentage: number;
    storagePercentage: number;
  }> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) {
      return {
        currentUsers: 0,
        maxUsers: 0,
        storageUsedGb: 0,
        maxStorageGb: 0,
        usersPercentage: 0,
        storagePercentage: 0
      };
    }

    // Get current user count
    const userResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenantId]
    );
    const currentUsers = parseInt(userResult.rows[0].count);

    // Get storage usage (simplified - you may want to implement actual file tracking)
    const storageResult = await pool.query(
      `SELECT COALESCE(SUM(file_size), 0) as total_bytes 
       FROM document_attachments 
       WHERE tenant_id = $1`,
      [tenantId]
    );
    const storageUsedGb = parseFloat(storageResult.rows[0].total_bytes || '0') / (1024 * 1024 * 1024);

    const maxUsers = subscription.features.maxUsers === -1 ? 999999 : subscription.features.maxUsers;
    const maxStorageGb = subscription.features.maxStorageGb;

    return {
      currentUsers,
      maxUsers,
      storageUsedGb: Math.round(storageUsedGb * 100) / 100,
      maxStorageGb,
      usersPercentage: Math.min(100, (currentUsers / maxUsers) * 100),
      storagePercentage: Math.min(100, (storageUsedGb / maxStorageGb) * 100)
    };
  }
}

export default SubscriptionService;
