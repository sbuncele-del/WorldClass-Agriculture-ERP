/**
 * Profile Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure user profile management.
 * Personal settings, preferences, and account management.
 */

import { Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class ProfileControllerV2 {
  /**
   * Get current user profile
   * GET /api/v2/profile
   */
  static async getProfile(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT 
          u.user_id, u.email, u.username, u.first_name, u.last_name,
          u.display_name, u.phone, u.avatar_url, u.email_verified,
          u.mfa_enabled, u.last_login_at, u.created_at, u.timezone,
          u.locale, u.date_format, u.currency_preference,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object('role_id', r.role_id, 'role_name', r.role_name, 'role_code', r.role_code)
            ) FILTER (WHERE r.role_id IS NOT NULL),
            '[]'
          ) as roles,
          t.tenant_name, t.tenant_code
        FROM users u
        LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
        LEFT JOIN roles r ON ur.role_id = r.role_id
        LEFT JOIN tenants t ON u.tenant_id = t.tenant_id
        WHERE u.user_id = $1 AND u.tenant_id = $2
        GROUP BY u.user_id, t.tenant_name, t.tenant_code
      `;

      const result = await pool.query(query, [userId, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Profile not found' });
        return;
      }

      res.json({
        success: true,
        profile: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Get profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }

  /**
   * Update profile
   * PUT /api/v2/profile
   */
  static async updateProfile(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const {
        first_name,
        last_name,
        display_name,
        phone,
        timezone,
        locale,
        date_format,
        currency_preference
      } = req.body;

      const query = `
        UPDATE users
        SET 
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          display_name = COALESCE($3, display_name),
          phone = COALESCE($4, phone),
          timezone = COALESCE($5, timezone),
          locale = COALESCE($6, locale),
          date_format = COALESCE($7, date_format),
          currency_preference = COALESCE($8, currency_preference),
          updated_at = NOW()
        WHERE user_id = $9 AND tenant_id = $10
        RETURNING user_id, email, first_name, last_name, display_name, phone, 
                  timezone, locale, date_format, currency_preference
      `;

      const result = await pool.query(query, [
        first_name, last_name, display_name, phone,
        timezone, locale, date_format, currency_preference,
        userId, tenantId
      ]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Profile not found' });
        return;
      }

      res.json({
        success: true,
        profile: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Update profile error:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  /**
   * Change password
   * PUT /api/v2/profile/password
   */
  static async changePassword(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        res.status(400).json({ success: false, message: 'Current and new password required' });
        return;
      }

      // Get current password hash
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Verify current password
      const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(new_password, 12);

      // Update password
      await pool.query(`
        UPDATE users
        SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
        WHERE user_id = $2 AND tenant_id = $3
      `, [newPasswordHash, userId, tenantId]);

      // Log password change
      await pool.query(`
        INSERT INTO audit_trail (tenant_id, user_id, entity_type, entity_id, action, description)
        VALUES ($1, $2, 'USER', $2, 'PASSWORD_CHANGE', 'User changed their password')
      `, [tenantId, userId]);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Change password error:', error);
      res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  }

  /**
   * Update avatar
   * PUT /api/v2/profile/avatar
   */
  static async updateAvatar(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { avatar_url } = req.body;

      const result = await pool.query(`
        UPDATE users
        SET avatar_url = $1, updated_at = NOW()
        WHERE user_id = $2 AND tenant_id = $3
        RETURNING user_id, avatar_url
      `, [avatar_url, userId, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        avatar_url: result.rows[0].avatar_url
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Update avatar error:', error);
      res.status(500).json({ success: false, message: 'Failed to update avatar' });
    }
  }

  /**
   * Get user preferences
   * GET /api/v2/profile/preferences
   */
  static async getPreferences(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT preference_key, preference_value
        FROM user_preferences
        WHERE user_id = $1 AND tenant_id = $2
        ORDER BY preference_key
      `;

      const result = await pool.query(query, [userId, tenantId]);

      // Convert to object
      const preferences: Record<string, any> = {};
      for (const row of result.rows) {
        try {
          preferences[row.preference_key] = JSON.parse(row.preference_value);
        } catch {
          preferences[row.preference_key] = row.preference_value;
        }
      }

      res.json({
        success: true,
        preferences
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Get preferences error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
    }
  }

  /**
   * Update user preferences
   * PUT /api/v2/profile/preferences
   */
  static async updatePreferences(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const { preferences } = req.body;

      if (!preferences || typeof preferences !== 'object') {
        res.status(400).json({ success: false, message: 'Preferences object required' });
        return;
      }

      for (const [key, value] of Object.entries(preferences)) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        
        await pool.query(`
          INSERT INTO user_preferences (user_id, tenant_id, preference_key, preference_value)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, preference_key)
          DO UPDATE SET preference_value = $4, updated_at = NOW()
        `, [userId, tenantId, key, stringValue]);
      }

      res.json({
        success: true,
        message: 'Preferences updated'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Update preferences error:', error);
      res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
  }

  /**
   * Get notification settings
   * GET /api/v2/profile/notifications
   */
  static async getNotificationSettings(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT *
        FROM user_notification_settings
        WHERE user_id = $1 AND tenant_id = $2
      `;

      const result = await pool.query(query, [userId, tenantId]);

      res.json({
        success: true,
        settings: result.rows.length > 0 ? result.rows[0] : getDefaultNotificationSettings()
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Get notification settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch notification settings' });
    }
  }

  /**
   * Update notification settings
   * PUT /api/v2/profile/notifications
   */
  static async updateNotificationSettings(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const {
        email_notifications,
        push_notifications,
        sms_notifications,
        notification_types
      } = req.body;

      const query = `
        INSERT INTO user_notification_settings (
          user_id, tenant_id, email_notifications, push_notifications,
          sms_notifications, notification_types
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, tenant_id)
        DO UPDATE SET 
          email_notifications = COALESCE($3, user_notification_settings.email_notifications),
          push_notifications = COALESCE($4, user_notification_settings.push_notifications),
          sms_notifications = COALESCE($5, user_notification_settings.sms_notifications),
          notification_types = COALESCE($6, user_notification_settings.notification_types),
          updated_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId, tenantId,
        email_notifications,
        push_notifications,
        sms_notifications,
        notification_types ? JSON.stringify(notification_types) : null
      ]);

      res.json({
        success: true,
        settings: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Update notification settings error:', error);
      res.status(500).json({ success: false, message: 'Failed to update notification settings' });
    }
  }

  /**
   * Get active sessions
   * GET /api/v2/profile/sessions
   */
  static async getSessions(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT session_id, ip_address, user_agent, last_activity, created_at
        FROM user_sessions
        WHERE user_id = $1 AND tenant_id = $2 AND is_active = true
        ORDER BY last_activity DESC
      `;

      const result = await pool.query(query, [userId, tenantId]);

      res.json({
        success: true,
        sessions: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Get sessions error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    }
  }

  /**
   * Terminate a session
   * DELETE /api/v2/profile/sessions/:sessionId
   */
  static async terminateSession(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated' });
        return;
      }

      const result = await pool.query(`
        UPDATE user_sessions
        SET is_active = false, terminated_at = NOW()
        WHERE session_id = $1 AND user_id = $2 AND tenant_id = $3
        RETURNING session_id
      `, [sessionId, userId, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Session not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Session terminated'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Profile] Terminate session error:', error);
      res.status(500).json({ success: false, message: 'Failed to terminate session' });
    }
  }
}

function getDefaultNotificationSettings() {
  return {
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_types: {
      approvals: true,
      alerts: true,
      reports: true,
      system: true
    }
  };
}

export default ProfileControllerV2;
