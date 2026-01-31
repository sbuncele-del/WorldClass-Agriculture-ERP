/**
 * Tenant Settings Controller V2
 * Tenant-hardened API for tenant configuration
 * 
 * Features:
 * - Tenant settings CRUD
 * - Module configuration
 * - Branding settings
 * - Business information
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
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
// TENANT SETTINGS
// ============================================================================

/**
 * Get tenant settings
 */
export const getTenantSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.domain as subdomain,
        t.status,
        t.created_at,
        t.updated_at,
        ts.business_name,
        ts.registration_number,
        ts.vat_number,
        ts.tax_number,
        ts.industry,
        ts.address,
        ts.city,
        ts.province,
        ts.postal_code,
        ts.country,
        ts.phone,
        ts.email,
        ts.website,
        ts.currency,
        ts.timezone,
        ts.date_format,
        ts.financial_year_end,
        ts.logo_url,
        ts.primary_color,
        ts.secondary_color
       FROM tenants t
       LEFT JOIN tenant_settings ts ON t.id = ts.tenant_id
       WHERE t.id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get tenant settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tenant settings' });
  }
};

/**
 * Update tenant settings
 */
export const updateTenantSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      businessName,
      registrationNumber,
      vatNumber,
      taxNumber,
      industry,
      address,
      city,
      province,
      postalCode,
      country,
      phone,
      email,
      website,
      currency,
      timezone,
      dateFormat,
      financialYearEnd
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tenant_settings 
        (tenant_id, business_name, registration_number, vat_number, tax_number,
         industry, address, city, province, postal_code, country,
         phone, email, website, currency, timezone, date_format, financial_year_end,
         updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         business_name = COALESCE($2, tenant_settings.business_name),
         registration_number = COALESCE($3, tenant_settings.registration_number),
         vat_number = COALESCE($4, tenant_settings.vat_number),
         tax_number = COALESCE($5, tenant_settings.tax_number),
         industry = COALESCE($6, tenant_settings.industry),
         address = COALESCE($7, tenant_settings.address),
         city = COALESCE($8, tenant_settings.city),
         province = COALESCE($9, tenant_settings.province),
         postal_code = COALESCE($10, tenant_settings.postal_code),
         country = COALESCE($11, tenant_settings.country),
         phone = COALESCE($12, tenant_settings.phone),
         email = COALESCE($13, tenant_settings.email),
         website = COALESCE($14, tenant_settings.website),
         currency = COALESCE($15, tenant_settings.currency),
         timezone = COALESCE($16, tenant_settings.timezone),
         date_format = COALESCE($17, tenant_settings.date_format),
         financial_year_end = COALESCE($18, tenant_settings.financial_year_end),
         updated_by = $19,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, businessName, registrationNumber, vatNumber, taxNumber,
       industry, address, city, province, postalCode, country,
       phone, email, website, currency, timezone, dateFormat, financialYearEnd, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tenant settings updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update tenant settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tenant settings' });
  }
};

// ============================================================================
// BRANDING
// ============================================================================

/**
 * Get branding settings
 */
export const getBrandingSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT 
        logo_url,
        favicon_url,
        primary_color,
        secondary_color,
        accent_color,
        font_family,
        custom_css
       FROM tenant_settings WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows[0] || {
        logoUrl: null,
        primaryColor: '#1976d2',
        secondaryColor: '#424242'
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get branding settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get branding settings' });
  }
};

/**
 * Update branding settings
 */
export const updateBrandingSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, fontFamily, customCss } = req.body;

    const result = await pool.query(
      `UPDATE tenant_settings SET
        logo_url = COALESCE($2, logo_url),
        favicon_url = COALESCE($3, favicon_url),
        primary_color = COALESCE($4, primary_color),
        secondary_color = COALESCE($5, secondary_color),
        accent_color = COALESCE($6, accent_color),
        font_family = COALESCE($7, font_family),
        custom_css = COALESCE($8, custom_css),
        updated_by = $9,
        updated_at = NOW()
       WHERE tenant_id = $1
       RETURNING logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, custom_css`,
      [tenantId, logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, fontFamily, customCss, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Branding settings updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update branding settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update branding settings' });
  }
};

// ============================================================================
// MODULE CONFIGURATION
// ============================================================================

/**
 * Get enabled modules for tenant
 */
export const getModuleConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT 
        m.id,
        m.name,
        m.code,
        m.description,
        tm.enabled,
        tm.settings,
        tm.enabled_at
       FROM modules m
       LEFT JOIN tenant_modules tm ON m.id = tm.module_id AND tm.tenant_id = $1
       ORDER BY m.sort_order`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get module config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get module configuration' });
  }
};

/**
 * Update module configuration
 */
export const updateModuleConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { moduleCode, enabled, settings } = req.body;

    // Get module ID
    const moduleResult = await pool.query(
      `SELECT id FROM modules WHERE code = $1`,
      [moduleCode]
    );

    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const moduleId = moduleResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO tenant_modules 
        (tenant_id, module_id, enabled, settings, enabled_at, updated_by)
       VALUES ($1, $2, $3, $4, CASE WHEN $3 THEN NOW() ELSE NULL END, $5)
       ON CONFLICT (tenant_id, module_id) DO UPDATE SET
         enabled = $3,
         settings = COALESCE($4, tenant_modules.settings),
         enabled_at = CASE WHEN $3 AND tenant_modules.enabled_at IS NULL THEN NOW() ELSE tenant_modules.enabled_at END,
         updated_by = $5,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, moduleId, enabled, settings ? JSON.stringify(settings) : null, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: `Module ${moduleCode} ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update module config error:', error);
    res.status(500).json({ success: false, error: 'Failed to update module configuration' });
  }
};

/**
 * Get module settings
 */
export const getModuleSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { moduleCode } = req.params;

    const result = await pool.query(
      `SELECT tm.settings, m.default_settings
       FROM tenant_modules tm
       JOIN modules m ON tm.module_id = m.id
       WHERE tm.tenant_id = $1 AND m.code = $2`,
      [tenantId, moduleCode]
    );

    if (result.rows.length === 0) {
      // Return default settings
      const defaultResult = await pool.query(
        `SELECT default_settings FROM modules WHERE code = $1`,
        [moduleCode]
      );
      return res.json({
        success: true,
        data: defaultResult.rows[0]?.default_settings || {}
      });
    }

    res.json({
      success: true,
      data: result.rows[0].settings || result.rows[0].default_settings || {}
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get module settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get module settings' });
  }
};

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM tenant_notification_preferences WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows[0] || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        lowStockAlerts: true,
        invoiceDueAlerts: true,
        paymentReceivedAlerts: true
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get notification preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notification preferences' });
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const preferences = req.body;

    const result = await pool.query(
      `INSERT INTO tenant_notification_preferences 
        (tenant_id, email_notifications, sms_notifications, push_notifications,
         low_stock_alerts, invoice_due_alerts, payment_received_alerts, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         email_notifications = COALESCE($2, tenant_notification_preferences.email_notifications),
         sms_notifications = COALESCE($3, tenant_notification_preferences.sms_notifications),
         push_notifications = COALESCE($4, tenant_notification_preferences.push_notifications),
         low_stock_alerts = COALESCE($5, tenant_notification_preferences.low_stock_alerts),
         invoice_due_alerts = COALESCE($6, tenant_notification_preferences.invoice_due_alerts),
         payment_received_alerts = COALESCE($7, tenant_notification_preferences.payment_received_alerts),
         updated_by = $8,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, preferences.emailNotifications, preferences.smsNotifications,
       preferences.pushNotifications, preferences.lowStockAlerts,
       preferences.invoiceDueAlerts, preferences.paymentReceivedAlerts, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification preferences updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update notification preferences error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification preferences' });
  }
};

export default {
  getTenantSettings,
  updateTenantSettings,
  getBrandingSettings,
  updateBrandingSettings,
  getModuleConfig,
  updateModuleConfig,
  getModuleSettings,
  getNotificationPreferences,
  updateNotificationPreferences
};
