import { pool } from '../config/database';
import crypto from 'crypto';

/**
 * Email Preferences Service
 * Manages user email notification preferences and unsubscribe functionality
 */

export interface EmailPreferences {
  userId: number;
  tenantId: number;
  marketingEmails: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  paymentNotifications: boolean;
  subscriptionNotifications: boolean;
  inventoryAlerts: boolean;
  teamNotifications: boolean;
  systemNotifications: boolean;
  unsubscribedAll: boolean;
  digestFrequency: 'instant' | 'daily' | 'weekly' | 'never';
}

export interface EmailCategory {
  id: string;
  name: string;
  description: string;
  canDisable: boolean;
  enabled: boolean;
}

/**
 * Get user's email preferences
 */
export async function getUserEmailPreferences(
  userId: number,
  tenantId: number
): Promise<EmailPreferences> {
  try {
    // Get existing preferences or create default
    let result = await pool.query(
      `SELECT * FROM email_preferences WHERE user_id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      result = await pool.query(
        `INSERT INTO email_preferences (user_id, tenant_id)
         VALUES ($1, $2)
         RETURNING *`,
        [userId, tenantId]
      );
    }

    const prefs = result.rows[0];

    return {
      userId: prefs.user_id,
      tenantId: prefs.tenant_id,
      marketingEmails: prefs.marketing_emails,
      productUpdates: prefs.product_updates,
      securityAlerts: prefs.security_alerts,
      paymentNotifications: prefs.payment_notifications,
      subscriptionNotifications: prefs.subscription_notifications,
      inventoryAlerts: prefs.inventory_alerts,
      teamNotifications: prefs.team_notifications,
      systemNotifications: prefs.system_notifications,
      unsubscribedAll: prefs.unsubscribed_all,
      digestFrequency: prefs.digest_frequency,
    };
  } catch (error) {
    console.error('Error getting email preferences:', error);
    throw error;
  }
}

/**
 * Update user's email preferences
 */
export async function updateEmailPreferences(
  userId: number,
  tenantId: number,
  preferences: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  try {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      marketingEmails: 'marketing_emails',
      productUpdates: 'product_updates',
      securityAlerts: 'security_alerts',
      paymentNotifications: 'payment_notifications',
      subscriptionNotifications: 'subscription_notifications',
      inventoryAlerts: 'inventory_alerts',
      teamNotifications: 'team_notifications',
      systemNotifications: 'system_notifications',
      unsubscribedAll: 'unsubscribed_all',
      digestFrequency: 'digest_frequency',
    };

    Object.entries(preferences).forEach(([key, value]) => {
      if (fieldMap[key] && value !== undefined) {
        updates.push(`${fieldMap[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      return getUserEmailPreferences(userId, tenantId);
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add unsubscribed_at if unsubscribing
    if (preferences.unsubscribedAll === true) {
      updates.push(`unsubscribed_at = NOW()`);
    }

    values.push(userId, tenantId);

    const result = await pool.query(
      `UPDATE email_preferences
       SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      await pool.query(
        `INSERT INTO email_preferences (user_id, tenant_id)
         VALUES ($1, $2)`,
        [userId, tenantId]
      );
      return updateEmailPreferences(userId, tenantId, preferences);
    }

    // Log the preference change
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, 'email_preferences_updated', 'user', $3, $4)`,
      [
        tenantId,
        userId,
        userId,
        JSON.stringify({ changes: preferences }),
      ]
    );

    return getUserEmailPreferences(userId, tenantId);
  } catch (error) {
    console.error('Error updating email preferences:', error);
    throw error;
  }
}

/**
 * Generate unsubscribe token
 */
export async function generateUnsubscribeToken(
  userId: number,
  tenantId: number,
  category?: string
): Promise<string> {
  try {
    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO unsubscribe_tokens (user_id, tenant_id, token, category)
       VALUES ($1, $2, $3, $4)`,
      [userId, tenantId, token, category]
    );

    return token;
  } catch (error) {
    console.error('Error generating unsubscribe token:', error);
    throw error;
  }
}

/**
 * Process unsubscribe via token
 */
export async function processUnsubscribe(
  token: string
): Promise<{ success: boolean; category?: string; email?: string }> {
  try {
    // Verify token
    const tokenResult = await pool.query(
      `SELECT ut.*, u.email
       FROM unsubscribe_tokens ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.token = $1
       AND ut.expires_at > NOW()
       AND ut.used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return { success: false };
    }

    const tokenData = tokenResult.rows[0];
    const { user_id, tenant_id, category, email } = tokenData;

    // Mark token as used
    await pool.query(
      `UPDATE unsubscribe_tokens
       SET used_at = NOW()
       WHERE token = $1`,
      [token]
    );

    // Update preferences
    if (category) {
      // Unsubscribe from specific category
      const fieldMap: Record<string, string> = {
        marketing: 'marketing_emails',
        product_updates: 'product_updates',
        payment: 'payment_notifications',
        subscription: 'subscription_notifications',
        inventory: 'inventory_alerts',
        team: 'team_notifications',
        system: 'system_notifications',
      };

      const field = fieldMap[category];
      if (field) {
        await pool.query(
          `INSERT INTO email_preferences (user_id, tenant_id, ${field})
           VALUES ($1, $2, FALSE)
           ON CONFLICT (user_id, tenant_id)
           DO UPDATE SET ${field} = FALSE, updated_at = NOW()`,
          [user_id, tenant_id]
        );
      }
    } else {
      // Unsubscribe from all
      await pool.query(
        `INSERT INTO email_preferences (user_id, tenant_id, unsubscribed_all, unsubscribed_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (user_id, tenant_id)
         DO UPDATE SET unsubscribed_all = TRUE, unsubscribed_at = NOW(), updated_at = NOW()`,
        [user_id, tenant_id]
      );
    }

    // Log unsubscribe action
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, 'email_unsubscribed', 'user', $3, $4)`,
      [
        tenant_id,
        user_id,
        user_id,
        JSON.stringify({ category: category || 'all', via: 'unsubscribe_link' }),
      ]
    );

    return { success: true, category, email };
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    throw error;
  }
}

/**
 * Check if user can receive email of specific type
 */
export async function canSendEmail(
  userId: number,
  tenantId: number,
  category: string
): Promise<boolean> {
  try {
    const prefs = await getUserEmailPreferences(userId, tenantId);

    // If unsubscribed from all, only allow critical security emails
    if (prefs.unsubscribedAll) {
      return category === 'security' || category === 'security_alerts';
    }

    // Check specific category
    const categoryMap: Record<string, keyof EmailPreferences> = {
      marketing: 'marketingEmails',
      product_updates: 'productUpdates',
      security: 'securityAlerts',
      security_alerts: 'securityAlerts',
      payment: 'paymentNotifications',
      subscription: 'subscriptionNotifications',
      inventory: 'inventoryAlerts',
      team: 'teamNotifications',
      system: 'systemNotifications',
    };

    const prefKey = categoryMap[category];
    if (prefKey) {
      return prefs[prefKey] as boolean;
    }

    // Default to true for unknown categories (transactional emails)
    return true;
  } catch (error) {
    console.error('Error checking email permission:', error);
    // Fail open - allow email if error checking preferences
    return true;
  }
}

/**
 * Log email send for compliance
 */
export async function logEmailSend(data: {
  userId?: number;
  tenantId?: number;
  emailAddress: string;
  emailType: string;
  emailCategory: string;
  subject: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO email_send_log 
       (user_id, tenant_id, email_address, email_type, email_category, subject)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.userId,
        data.tenantId,
        data.emailAddress,
        data.emailType,
        data.emailCategory,
        data.subject,
      ]
    );
  } catch (error) {
    console.error('Error logging email send:', error);
    // Don't throw - logging failure shouldn't block email
  }
}

/**
 * Get email categories with descriptions
 */
export function getEmailCategories(preferences: EmailPreferences): EmailCategory[] {
  return [
    {
      id: 'security_alerts',
      name: 'Security Alerts',
      description: 'Critical security notifications and login alerts',
      canDisable: false,
      enabled: preferences.securityAlerts,
    },
    {
      id: 'payment_notifications',
      name: 'Payment & Billing',
      description: 'Payment confirmations, invoices, and billing updates',
      canDisable: true,
      enabled: preferences.paymentNotifications,
    },
    {
      id: 'subscription_notifications',
      name: 'Subscription Updates',
      description: 'Plan changes, renewals, and subscription status',
      canDisable: true,
      enabled: preferences.subscriptionNotifications,
    },
    {
      id: 'inventory_alerts',
      name: 'Inventory Alerts',
      description: 'Low stock warnings and reorder notifications',
      canDisable: true,
      enabled: preferences.inventoryAlerts,
    },
    {
      id: 'team_notifications',
      name: 'Team Activity',
      description: 'Team member invitations and collaboration updates',
      canDisable: true,
      enabled: preferences.teamNotifications,
    },
    {
      id: 'system_notifications',
      name: 'System Updates',
      description: 'Maintenance notices and system announcements',
      canDisable: true,
      enabled: preferences.systemNotifications,
    },
    {
      id: 'product_updates',
      name: 'Product Updates',
      description: 'New features, improvements, and product news',
      canDisable: true,
      enabled: preferences.productUpdates,
    },
    {
      id: 'marketing_emails',
      name: 'Marketing & Tips',
      description: 'Educational content, tips, and promotional offers',
      canDisable: true,
      enabled: preferences.marketingEmails,
    },
  ];
}

export const EmailPreferencesService = {
  getUserEmailPreferences,
  updateEmailPreferences,
  generateUnsubscribeToken,
  processUnsubscribe,
  canSendEmail,
  logEmailSend,
  getEmailCategories,
};

export default EmailPreferencesService;
