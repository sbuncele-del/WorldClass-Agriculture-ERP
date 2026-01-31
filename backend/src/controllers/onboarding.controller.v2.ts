/**
 * Onboarding Controller V2
 * Tenant-hardened API for tenant onboarding workflow
 * 
 * Features:
 * - Onboarding status tracking
 * - Step-by-step progress
 * - Complete/skip onboarding
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';
import WelcomeEmailService from '../services/welcome-email.service';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string; userEmail: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '', userEmail: userEmail || '' };
}

/**
 * Get onboarding status for current tenant
 */
export const getStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT onboarding_completed, onboarding_data, onboarding_step
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    const tenant = result.rows[0];

    res.json({
      success: true,
      data: {
        completed: tenant.onboarding_completed || false,
        currentStep: tenant.onboarding_step || 1,
        completedSteps: getCompletedSteps(tenant.onboarding_data),
        data: tenant.onboarding_data || {}
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get onboarding status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get onboarding status' });
  }
};

/**
 * Update onboarding progress
 */
export const update = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { step, data } = req.body;

    if (typeof step !== 'number' || step < 1) {
      return res.status(400).json({ success: false, error: 'Valid step number is required' });
    }

    // Get current onboarding data
    const currentResult = await pool.query(
      `SELECT onboarding_data FROM tenants WHERE id = $1`,
      [tenantId]
    );

    const currentData = currentResult.rows[0]?.onboarding_data || {};
    const updatedData = { ...currentData, ...data, [`step${step}Completed`]: true };

    // Update tenant with new data
    const result = await pool.query(
      `UPDATE tenants
       SET onboarding_data = $1,
           onboarding_step = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING onboarding_completed, onboarding_data, onboarding_step`,
      [JSON.stringify(updatedData), step, tenantId]
    );

    res.json({
      success: true,
      data: {
        completed: result.rows[0].onboarding_completed || false,
        currentStep: step,
        completedSteps: getCompletedSteps(updatedData),
        data: updatedData
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to update onboarding' });
  }
};

/**
 * Mark onboarding as complete
 */
export const complete = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userEmail, userId } = getTenantContext(req);

    // Mark onboarding as complete
    await pool.query(
      `UPDATE tenants
       SET onboarding_completed = true,
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );

    // Send onboarding complete email (non-blocking)
    if (userEmail) {
      WelcomeEmailService.sendOnboardingCompleteEmail(userEmail, userId)
        .catch(err => console.error('Failed to send onboarding complete email:', err));
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Complete onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
};

/**
 * Skip onboarding (use defaults)
 */
export const skip = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Mark onboarding as complete with default settings
    await pool.query(
      `UPDATE tenants
       SET onboarding_completed = true,
           onboarding_data = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify({ skipped: true, skippedAt: new Date().toISOString() }), tenantId]
    );

    res.json({
      success: true,
      message: 'Onboarding skipped'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Skip onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to skip onboarding' });
  }
};

/**
 * Reset onboarding (admin function)
 */
export const reset = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    await pool.query(
      `UPDATE tenants
       SET onboarding_completed = false,
           onboarding_step = 1,
           onboarding_data = '{}',
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      message: 'Onboarding reset successfully'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Reset onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset onboarding' });
  }
};

/**
 * Get onboarding checklist items
 */
export const getChecklist = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT onboarding_data FROM tenants WHERE id = $1`,
      [tenantId]
    );

    const data = result.rows[0]?.onboarding_data || {};

    const checklist = [
      { step: 1, title: 'Company Profile', description: 'Set up your company information', completed: !!data.step1Completed },
      { step: 2, title: 'Modules', description: 'Select active ERP modules', completed: !!data.step2Completed },
      { step: 3, title: 'Users', description: 'Invite team members', completed: !!data.step3Completed },
      { step: 4, title: 'Integrations', description: 'Connect external services', completed: !!data.step4Completed },
      { step: 5, title: 'Preferences', description: 'Configure system preferences', completed: !!data.step5Completed }
    ];

    res.json({
      success: true,
      data: {
        checklist,
        progress: Math.round((checklist.filter(c => c.completed).length / checklist.length) * 100)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get checklist error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checklist' });
  }
};

/**
 * Helper: Extract completed steps from onboarding data
 */
function getCompletedSteps(data: any): number[] {
  if (!data) return [];
  const completed: number[] = [];
  for (let i = 1; i <= 10; i++) {
    if (data[`step${i}Completed`]) {
      completed.push(i);
    }
  }
  return completed;
}

export default {
  getStatus,
  update,
  complete,
  skip,
  reset,
  getChecklist
};
