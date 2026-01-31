/**
 * Email Preferences Controller V2
 * Tenant-hardened API for email preference management
 * 
 * Features:
 * - User email preferences
 * - Category management
 * - Unsubscribe/resubscribe
 * - Token-based unsubscribe
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import EmailPreferencesService from '../services/email-preferences.service';

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
 * Get current user's email preferences
 */
export const getPreferences = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const preferences = await EmailPreferencesService.getUserEmailPreferences(
      parseInt(userId) || 0,
      parseInt(tenantId) || 0
    );

    const categories = EmailPreferencesService.getEmailCategories(preferences);

    res.json({
      success: true,
      data: {
        preferences,
        categories
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get email preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get email preferences' });
  }
};

/**
 * Update current user's email preferences
 */
export const updatePreferences = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const updates = req.body;

    // Validate updates
    const allowedFields = [
      'marketingEmails',
      'productUpdates',
      'paymentNotifications',
      'subscriptionNotifications',
      'inventoryAlerts',
      'teamNotifications',
      'systemNotifications',
      'digestFrequency'
    ];

    const invalidFields = Object.keys(updates).filter(key => !allowedFields.includes(key));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fields',
        invalidFields,
        allowedFields
      });
    }

    // Security alerts cannot be disabled
    if (updates.securityAlerts === false) {
      return res.status(400).json({
        success: false,
        error: 'Security alerts cannot be disabled for your safety'
      });
    }

    const preferences = await EmailPreferencesService.updateEmailPreferences(
      parseInt(userId) || 0,
      parseInt(tenantId) || 0,
      updates
    );

    res.json({
      success: true,
      message: 'Email preferences updated successfully',
      data: preferences
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update email preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update email preferences' });
  }
};

/**
 * Unsubscribe from all non-essential emails
 */
export const unsubscribeAll = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    await EmailPreferencesService.updateEmailPreferences(
      parseInt(userId) || 0,
      parseInt(tenantId) || 0,
      { unsubscribedAll: true }
    );

    res.json({
      success: true,
      message: 'Successfully unsubscribed from all non-essential emails'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Unsubscribe all error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
};

/**
 * Resubscribe to emails
 */
export const resubscribe = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    await EmailPreferencesService.updateEmailPreferences(
      parseInt(userId) || 0,
      parseInt(tenantId) || 0,
      { unsubscribedAll: false }
    );

    res.json({
      success: true,
      message: 'Successfully resubscribed to emails'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Resubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to resubscribe' });
  }
};

/**
 * One-click unsubscribe via token (public, no auth required)
 * Note: This endpoint doesn't require tenant context as it uses token
 */
export const unsubscribeViaToken = async (req: TenantRequest, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const result = await EmailPreferencesService.processUnsubscribe(token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired unsubscribe link'
      });
    }

    res.json({
      success: true,
      message: result.category
        ? `Successfully unsubscribed from ${result.category} emails`
        : 'Successfully unsubscribed from all non-essential emails',
      data: {
        category: result.category,
        email: result.email
      }
    });
  } catch (error: any) {
    console.error('Unsubscribe via token error:', error);
    res.status(500).json({ success: false, error: 'Failed to process unsubscribe' });
  }
};

/**
 * Get all available email categories with descriptions
 */
export const getCategories = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const preferences = await EmailPreferencesService.getUserEmailPreferences(
      parseInt(userId) || 0,
      parseInt(tenantId) || 0
    );

    const categories = EmailPreferencesService.getEmailCategories(preferences);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get email categories' });
  }
};

export default {
  getPreferences,
  updatePreferences,
  unsubscribeAll,
  resubscribe,
  unsubscribeViaToken,
  getCategories
};
