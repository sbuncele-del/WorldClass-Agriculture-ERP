import { Response } from 'express';
import { TenantRequest } from '../types';
import SubscriptionService from '../services/subscription.service';

export class SubscriptionController {
  /**
   * GET /api/subscription
   * Get current subscription details
   */
  static async getCurrentSubscription(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;

      const subscription = await SubscriptionService.getCurrentSubscription(tenantId);
      
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      // Get usage statistics
      const usage = await SubscriptionService.getUsageStatistics(tenantId);

      // Check subscription status
      const status = await SubscriptionService.checkSubscriptionStatus(tenantId);

      res.json({
        subscription,
        usage,
        status
      });
    } catch (error: any) {
      console.error('[SubscriptionController] Get subscription error:', error);
      res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  }

  /**
   * POST /api/subscription/upgrade
   * Upgrade to a higher plan
   */
  static async upgradePlan(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const { plan, billingCycle = 'monthly' } = req.body;

      // Validate plan
      const validPlans = ['starter', 'professional', 'enterprise'];
      if (!validPlans.includes(plan)) {
        res.status(400).json({ 
          error: 'Invalid plan',
          validPlans 
        });
        return;
      }

      // Validate billing cycle
      if (!['monthly', 'annual'].includes(billingCycle)) {
        res.status(400).json({ 
          error: 'Invalid billing cycle',
          validCycles: ['monthly', 'annual'] 
        });
        return;
      }

      const result = await SubscriptionService.upgradePlan(tenantId, plan, billingCycle);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        message: result.message,
        prorationAmount: result.prorationAmount,
        newPlan: plan,
        billingCycle
      });
    } catch (error: any) {
      console.error('[SubscriptionController] Upgrade error:', error);
      res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
  }

  /**
   * POST /api/subscription/downgrade
   * Schedule downgrade to a lower plan
   */
  static async downgradePlan(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const { plan } = req.body;

      // Validate plan
      const validPlans = ['starter', 'professional'];
      if (!validPlans.includes(plan)) {
        res.status(400).json({ 
          error: 'Invalid plan for downgrade',
          validPlans 
        });
        return;
      }

      const result = await SubscriptionService.downgradePlan(tenantId, plan);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        message: result.message,
        effectiveDate: result.effectiveDate,
        newPlan: plan
      });
    } catch (error: any) {
      console.error('[SubscriptionController] Downgrade error:', error);
      res.status(500).json({ error: 'Failed to downgrade subscription' });
    }
  }

  /**
   * POST /api/subscription/cancel
   * Cancel subscription (effective at period end)
   */
  static async cancelSubscription(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const { reason } = req.body;

      const result = await SubscriptionService.cancelSubscription(tenantId, reason);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({
        message: result.message,
        effectiveDate: result.effectiveDate
      });
    } catch (error: any) {
      console.error('[SubscriptionController] Cancel error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  /**
   * POST /api/subscription/reactivate
   * Reactivate a cancelled subscription
   */
  static async reactivateSubscription(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;

      const result = await SubscriptionService.reactivateSubscription(tenantId);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({ message: result.message });
    } catch (error: any) {
      console.error('[SubscriptionController] Reactivate error:', error);
      res.status(500).json({ error: 'Failed to reactivate subscription' });
    }
  }

  /**
   * PUT /api/subscription/payment-method
   * Update payment gateway
   */
  static async updatePaymentMethod(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;
      const { gateway } = req.body;

      // Validate gateway
      if (!['ozow', 'stripe'].includes(gateway)) {
        res.status(400).json({ 
          error: 'Invalid payment gateway',
          validGateways: ['ozow', 'stripe']
        });
        return;
      }

      const result = await SubscriptionService.updatePaymentMethod(tenantId, gateway);

      if (!result.success) {
        res.status(400).json({ error: result.message });
        return;
      }

      res.json({ message: result.message });
    } catch (error: any) {
      console.error('[SubscriptionController] Update payment method error:', error);
      res.status(500).json({ error: 'Failed to update payment method' });
    }
  }

  /**
   * GET /api/subscription/usage
   * Get usage statistics
   */
  static async getUsageStatistics(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;

      const usage = await SubscriptionService.getUsageStatistics(tenantId);

      res.json(usage);
    } catch (error: any) {
      console.error('[SubscriptionController] Get usage error:', error);
      res.status(500).json({ error: 'Failed to retrieve usage statistics' });
    }
  }

  /**
   * GET /api/subscription/status
   * Check subscription status
   */
  static async checkSubscriptionStatus(req: TenantRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant!.id;

      const status = await SubscriptionService.checkSubscriptionStatus(tenantId);

      res.json(status);
    } catch (error: any) {
      console.error('[SubscriptionController] Check status error:', error);
      res.status(500).json({ error: 'Failed to check subscription status' });
    }
  }
}

export default SubscriptionController;
