import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';
import WelcomeEmailService from '../services/welcome-email.service';

export class OnboardingController {
  /**
   * GET /api/onboarding/status
   * Get onboarding status for current tenant
   */
  static async getStatus(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const result = await pool.query(
        `SELECT onboarding_completed, onboarding_data, onboarding_step
         FROM tenants
         WHERE id = $1`,
        [req.tenant.id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }

      const tenant = result.rows[0];

      res.status(200).json({
        success: true,
        data: {
          completed: tenant.onboarding_completed || false,
          currentStep: tenant.onboarding_step || 1,
          completedSteps: [],
          data: tenant.onboarding_data || {},
        },
      });
    } catch (error: any) {
      console.error('Error getting onboarding status:', error);
      res.status(500).json({ error: 'Failed to get onboarding status' });
    }
  }

  /**
   * PATCH /api/onboarding
   * Update onboarding data
   */
  static async update(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { step, data } = req.body;

      // Get current onboarding data
      const currentResult = await pool.query(
        `SELECT onboarding_data FROM tenants WHERE id = $1`,
        [req.tenant.id]
      );

      const currentData = currentResult.rows[0]?.onboarding_data || {};
      const updatedData = { ...currentData, ...data };

      // Update tenant with new data
      await pool.query(
        `UPDATE tenants
         SET onboarding_data = $1,
             onboarding_step = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(updatedData), step, req.tenant.id]
      );

      res.status(200).json({
        success: true,
        data: {
          completed: false,
          currentStep: step,
          completedSteps: [],
          data: updatedData,
        },
      });
    } catch (error: any) {
      console.error('Error updating onboarding:', error);
      res.status(500).json({ error: 'Failed to update onboarding' });
    }
  }

  /**
   * POST /api/onboarding/complete
   * Mark onboarding as complete
   */
  static async complete(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Mark onboarding as complete
      await pool.query(
        `UPDATE tenants
         SET onboarding_completed = true,
             updated_at = NOW()
         WHERE id = $1`,
        [req.tenant.id]
      );

      // Send onboarding complete email (non-blocking)
      WelcomeEmailService.sendOnboardingCompleteEmail(req.user.email, req.user.id)
        .catch(err => console.error('Failed to send onboarding complete email:', err));

      res.status(200).json({
        success: true,
        message: 'Onboarding completed successfully',
      });
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }

  /**
   * POST /api/onboarding/skip
   * Skip onboarding (use defaults)
   */
  static async skip(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.tenant || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Mark onboarding as complete with default settings
      await pool.query(
        `UPDATE tenants
         SET onboarding_completed = true,
             onboarding_data = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify({ skipped: true }), req.tenant.id]
      );

      res.status(200).json({
        success: true,
        message: 'Onboarding skipped',
      });
    } catch (error: any) {
      console.error('Error skipping onboarding:', error);
      res.status(500).json({ error: 'Failed to skip onboarding' });
    }
  }
}

export default OnboardingController;
