/**
 * Subscription Controller V2
 * Tenant-hardened API for subscription management
 * 
 * Features:
 * - Current subscription info
 * - Plan upgrades/downgrades
 * - Subscription cancellation & reactivation
 * - Usage statistics
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { SubscriptionService } from '../services/subscription.service';
import { pool } from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Get current subscription for tenant
 */
export const getCurrentSubscription = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const subscription = await SubscriptionService.getCurrentSubscription(tenantId);

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          plan: 'trial',
          status: 'active',
          features: {
            maxUsers: 2,
            maxStorageGb: 1
          }
        }
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get current subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subscription' });
  }
};

/**
 * Upgrade subscription plan
 */
export const upgradePlan = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { newPlan, billingCycle = 'monthly' } = req.body;

    // Validate plan
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan', validPlans });
    }

    const result = await SubscriptionService.upgradePlan(tenantId, newPlan, billingCycle);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Upgrade plan error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to upgrade plan' });
  }
};

/**
 * Downgrade subscription plan
 */
export const downgradePlan = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { newPlan } = req.body;

    // Validate plan
    const validPlans = ['starter', 'professional'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan for downgrade', validPlans });
    }

    const result = await SubscriptionService.downgradePlan(tenantId, newPlan);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Downgrade plan error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to downgrade plan' });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { reason } = req.body;

    const result = await SubscriptionService.cancelSubscription(tenantId, reason);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to cancel subscription' });
  }
};

/**
 * Reactivate cancelled subscription
 */
export const reactivateSubscription = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await SubscriptionService.reactivateSubscription(tenantId);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to reactivate subscription' });
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const status = await SubscriptionService.checkSubscriptionStatus(tenantId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get subscription status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get subscription status' });
  }
};

/**
 * Get available plans and features
 */
export const getAvailablePlans = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant context

    const plans = [
      {
        name: 'trial',
        displayName: 'Free Trial',
        maxUsers: 2,
        maxStorageGb: 1,
        features: {
          advancedReporting: false,
          multiCurrency: false,
          apiAccess: false,
          customBranding: false,
          prioritySupport: false,
          auditLog: false
        },
        pricing: { monthly: 0, annual: 0, currency: 'USD' }
      },
      {
        name: 'starter',
        displayName: 'Starter',
        maxUsers: 5,
        maxStorageGb: 10,
        features: {
          advancedReporting: false,
          multiCurrency: false,
          apiAccess: false,
          customBranding: false,
          prioritySupport: false,
          auditLog: true
        },
        pricing: { monthly: 29, annual: 290, currency: 'USD' }
      },
      {
        name: 'professional',
        displayName: 'Professional',
        maxUsers: 25,
        maxStorageGb: 50,
        features: {
          advancedReporting: true,
          multiCurrency: true,
          apiAccess: true,
          customBranding: false,
          prioritySupport: true,
          auditLog: true
        },
        pricing: { monthly: 99, annual: 990, currency: 'USD' }
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise',
        maxUsers: -1, // Unlimited
        maxStorageGb: 500,
        features: {
          advancedReporting: true,
          multiCurrency: true,
          apiAccess: true,
          customBranding: true,
          prioritySupport: true,
          auditLog: true
        },
        pricing: { monthly: 299, annual: 2990, currency: 'USD' }
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get available plans error:', error);
    res.status(500).json({ success: false, error: 'Failed to get available plans' });
  }
};

/**
 * Get billing history
 */
export const getBillingHistory = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { limit = 10, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        id,
        amount,
        currency,
        status,
        payment_gateway,
        transaction_reference,
        description,
        created_at as date
       FROM payment_transactions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, Number(limit), Number(offset)]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payment_transactions WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get billing history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get billing history' });
  }
};

/**
 * Update payment method
 */
export const updatePaymentMethod = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { gateway } = req.body;

    if (!['ozow', 'stripe'].includes(gateway)) {
      return res.status(400).json({ success: false, error: 'Invalid gateway', valid: ['ozow', 'stripe'] });
    }

    const result = await SubscriptionService.updatePaymentMethod(tenantId, gateway);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update payment method error:', error);
    res.status(500).json({ success: false, error: 'Failed to update payment method' });
  }
};

export default {
  getCurrentSubscription,
  upgradePlan,
  downgradePlan,
  cancelSubscription,
  reactivateSubscription,
  getSubscriptionStatus,
  getAvailablePlans,
  getBillingHistory,
  updatePaymentMethod
};
