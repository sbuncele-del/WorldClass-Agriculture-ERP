import { Response } from 'express';
import { TenantRequest } from '../types';
import EmailPreferencesService from '../services/email-preferences.service';

export class EmailPreferencesController {
  /**
   * GET /api/email-preferences
   * Get current user's email preferences
   */
  static async getPreferences(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const preferences = await EmailPreferencesService.getUserEmailPreferences(
        parseInt(req.user.id) || 0,
        parseInt(req.tenant.id) || 0
      );

      const categories = EmailPreferencesService.getEmailCategories(preferences);

      res.status(200).json({
        success: true,
        data: {
          preferences,
          categories,
        },
      });
    } catch (error: any) {
      console.error('Error getting email preferences:', error);
      res.status(500).json({ error: 'Failed to get email preferences' });
    }
  }

  /**
   * PATCH /api/email-preferences
   * Update current user's email preferences
   */
  static async updatePreferences(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

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
        'digestFrequency',
      ];

      const invalidFields = Object.keys(updates).filter(
        (key) => !allowedFields.includes(key)
      );

      if (invalidFields.length > 0) {
        res.status(400).json({
          error: 'Invalid fields',
          invalidFields,
          allowedFields,
        });
        return;
      }

      // Security alerts cannot be disabled
      if (updates.securityAlerts === false) {
        res.status(400).json({
          error: 'Security alerts cannot be disabled for your safety',
        });
        return;
      }

      const preferences = await EmailPreferencesService.updateEmailPreferences(
        parseInt(req.user.id) || 0,
        parseInt(req.tenant.id) || 0,
        updates
      );

      res.status(200).json({
        success: true,
        message: 'Email preferences updated successfully',
        data: preferences,
      });
    } catch (error: any) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ error: 'Failed to update email preferences' });
    }
  }

  /**
   * POST /api/email-preferences/unsubscribe-all
   * Unsubscribe from all non-essential emails
   */
  static async unsubscribeAll(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await EmailPreferencesService.updateEmailPreferences(
        parseInt(req.user.id) || 0,
        parseInt(req.tenant.id) || 0,
        { unsubscribedAll: true }
      );

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from all non-essential emails',
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  }

  /**
   * POST /api/email-preferences/resubscribe
   * Resubscribe to emails
   */
  static async resubscribe(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      await EmailPreferencesService.updateEmailPreferences(
        parseInt(req.user.id) || 0,
        parseInt(req.tenant.id) || 0,
        { unsubscribedAll: false }
      );

      res.status(200).json({
        success: true,
        message: 'Successfully resubscribed to emails',
      });
    } catch (error: any) {
      console.error('Error resubscribing:', error);
      res.status(500).json({ error: 'Failed to resubscribe' });
    }
  }

  /**
   * GET /api/email-preferences/unsubscribe/:token
   * One-click unsubscribe via token (public, no auth required)
   */
  static async unsubscribeViaToken(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const result = await EmailPreferencesService.processUnsubscribe(token);

      if (!result.success) {
        res.status(400).json({
          error: 'Invalid or expired unsubscribe link',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.category
          ? `Successfully unsubscribed from ${result.category} emails`
          : 'Successfully unsubscribed from all non-essential emails',
        data: {
          category: result.category,
          email: result.email,
        },
      });
    } catch (error: any) {
      console.error('Error processing unsubscribe:', error);
      res.status(500).json({ error: 'Failed to process unsubscribe' });
    }
  }

  /**
   * GET /api/email-preferences/categories
   * Get all available email categories with descriptions
   */
  static async getCategories(req: TenantRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.tenant) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const preferences = await EmailPreferencesService.getUserEmailPreferences(
        parseInt(req.user.id) || 0,
        parseInt(req.tenant.id) || 0
      );

      const categories = EmailPreferencesService.getEmailCategories(preferences);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error('Error getting email categories:', error);
      res.status(500).json({ error: 'Failed to get email categories' });
    }
  }
}

export default EmailPreferencesController;
