/**
 * Tax Settings Controller V2
 * Tenant-hardened API for tax configuration
 * 
 * Features:
 * - Tax settings CRUD
 * - VAT/GST configuration
 * - PAYE settings
 * - Income tax brackets
 * - eFiling integration
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
// TAX SETTINGS
// ============================================================================

/**
 * Get tax settings for tenant
 */
export const getTaxSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM tax_settings WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          vatEnabled: false,
          vatRate: 15,
          vatNumber: null,
          payeEnabled: false,
          incomeTaxEnabled: false,
          taxYear: new Date().getFullYear(),
          country: 'ZA',
          currency: 'ZAR'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get tax settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tax settings' });
  }
};

/**
 * Update tax settings
 */
export const updateTaxSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      vatEnabled,
      vatRate,
      vatNumber,
      payeEnabled,
      incomeTaxEnabled,
      taxYear,
      country,
      currency
    } = req.body;

    // Upsert tax settings
    const result = await pool.query(
      `INSERT INTO tax_settings 
        (tenant_id, vat_enabled, vat_rate, vat_number, paye_enabled, 
         income_tax_enabled, tax_year, country, currency, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         vat_enabled = COALESCE($2, tax_settings.vat_enabled),
         vat_rate = COALESCE($3, tax_settings.vat_rate),
         vat_number = COALESCE($4, tax_settings.vat_number),
         paye_enabled = COALESCE($5, tax_settings.paye_enabled),
         income_tax_enabled = COALESCE($6, tax_settings.income_tax_enabled),
         tax_year = COALESCE($7, tax_settings.tax_year),
         country = COALESCE($8, tax_settings.country),
         currency = COALESCE($9, tax_settings.currency),
         updated_by = $10,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, vatEnabled, vatRate, vatNumber, payeEnabled, incomeTaxEnabled, taxYear, country, currency, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tax settings updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update tax settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tax settings' });
  }
};

// ============================================================================
// TAX ACCOUNTS
// ============================================================================

/**
 * Get tax accounts (GL accounts for tax)
 */
export const getTaxAccounts = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT ta.*, a.account_name, a.account_number 
       FROM tax_accounts ta
       LEFT JOIN accounts a ON ta.account_id = a.id AND a.tenant_id = $1
       WHERE ta.tenant_id = $1
       ORDER BY ta.tax_type`,
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
    console.error('Get tax accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tax accounts' });
  }
};

/**
 * Update tax account mapping
 */
export const updateTaxAccount = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { taxType, accountId, description } = req.body;

    // Validate tax type
    const validTaxTypes = ['vat_output', 'vat_input', 'paye', 'income_tax', 'uif', 'sdl'];
    if (!validTaxTypes.includes(taxType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tax type', 
        validTypes: validTaxTypes 
      });
    }

    // Verify account belongs to tenant
    if (accountId) {
      const accountCheck = await pool.query(
        `SELECT id FROM accounts WHERE id = $1 AND tenant_id = $2`,
        [accountId, tenantId]
      );
      if (accountCheck.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tax_accounts (tenant_id, tax_type, account_id, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (tenant_id, tax_type) DO UPDATE SET
         account_id = $3,
         description = COALESCE($4, tax_accounts.description),
         updated_by = $5,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, taxType, accountId, description, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Tax account mapping updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update tax account error:', error);
    res.status(500).json({ success: false, error: 'Failed to update tax account' });
  }
};

// ============================================================================
// VAT SETTINGS
// ============================================================================

/**
 * Get VAT configuration
 */
export const getVatConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM vat_config WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows[0] || {
        standardRate: 15,
        reducedRates: [],
        exemptions: [],
        registrationThreshold: 1000000
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get VAT config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get VAT config' });
  }
};

/**
 * Update VAT configuration
 */
export const updateVatConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { standardRate, reducedRates, exemptions, registrationThreshold, vatPeriod } = req.body;

    const result = await pool.query(
      `INSERT INTO vat_config 
        (tenant_id, standard_rate, reduced_rates, exemptions, registration_threshold, vat_period, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         standard_rate = COALESCE($2, vat_config.standard_rate),
         reduced_rates = COALESCE($3, vat_config.reduced_rates),
         exemptions = COALESCE($4, vat_config.exemptions),
         registration_threshold = COALESCE($5, vat_config.registration_threshold),
         vat_period = COALESCE($6, vat_config.vat_period),
         updated_by = $7,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, standardRate, JSON.stringify(reducedRates), JSON.stringify(exemptions), registrationThreshold, vatPeriod, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'VAT configuration updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update VAT config error:', error);
    res.status(500).json({ success: false, error: 'Failed to update VAT config' });
  }
};

// ============================================================================
// PAYE SETTINGS
// ============================================================================

/**
 * Get PAYE settings
 */
export const getPayeSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM paye_settings WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows[0] || {
        enabled: false,
        uifRate: 1,
        sdlRate: 1,
        payeReference: null,
        uifReference: null
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get PAYE settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get PAYE settings' });
  }
};

/**
 * Update PAYE settings
 */
export const updatePayeSettings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { enabled, uifRate, sdlRate, payeReference, uifReference, sdlReference } = req.body;

    const result = await pool.query(
      `INSERT INTO paye_settings 
        (tenant_id, enabled, uif_rate, sdl_rate, paye_reference, uif_reference, sdl_reference, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         enabled = COALESCE($2, paye_settings.enabled),
         uif_rate = COALESCE($3, paye_settings.uif_rate),
         sdl_rate = COALESCE($4, paye_settings.sdl_rate),
         paye_reference = COALESCE($5, paye_settings.paye_reference),
         uif_reference = COALESCE($6, paye_settings.uif_reference),
         sdl_reference = COALESCE($7, paye_settings.sdl_reference),
         updated_by = $8,
         updated_at = NOW()
       RETURNING *`,
      [tenantId, enabled, uifRate, sdlRate, payeReference, uifReference, sdlReference, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'PAYE settings updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update PAYE settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to update PAYE settings' });
  }
};

// ============================================================================
// INCOME TAX
// ============================================================================

/**
 * Get income tax brackets
 */
export const getIncomeTaxBrackets = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { taxYear } = req.query;

    const year = taxYear || new Date().getFullYear();

    const result = await pool.query(
      `SELECT * FROM income_tax_brackets 
       WHERE tenant_id = $1 AND tax_year = $2
       ORDER BY min_income`,
      [tenantId, year]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get income tax brackets error:', error);
    res.status(500).json({ success: false, error: 'Failed to get income tax brackets' });
  }
};

/**
 * Update income tax brackets
 */
export const updateIncomeTaxBrackets = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { taxYear, brackets } = req.body;

    if (!Array.isArray(brackets) || brackets.length === 0) {
      return res.status(400).json({ success: false, error: 'Brackets must be a non-empty array' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing brackets for the tax year
      await client.query(
        `DELETE FROM income_tax_brackets WHERE tenant_id = $1 AND tax_year = $2`,
        [tenantId, taxYear]
      );

      // Insert new brackets
      for (const bracket of brackets) {
        await client.query(
          `INSERT INTO income_tax_brackets 
            (tenant_id, tax_year, min_income, max_income, rate, base_tax, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, taxYear, bracket.minIncome, bracket.maxIncome, bracket.rate, bracket.baseTax || 0, userId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Income tax brackets updated for ${taxYear}`
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update income tax brackets error:', error);
    res.status(500).json({ success: false, error: 'Failed to update income tax brackets' });
  }
};

// ============================================================================
// eFILING
// ============================================================================

/**
 * Get eFiling configuration
 */
export const getEfilingConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM efiling_config WHERE tenant_id = $1`,
      [tenantId]
    );

    // Mask sensitive fields
    const config = result.rows[0];
    if (config?.password) {
      config.password = '********';
    }

    res.json({
      success: true,
      data: config || {
        enabled: false,
        username: null,
        lastSync: null
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get eFiling config error:', error);
    res.status(500).json({ success: false, error: 'Failed to get eFiling config' });
  }
};

/**
 * Update eFiling configuration
 */
export const updateEfilingConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { enabled, username, password, taxPractitionerNumber } = req.body;

    const result = await pool.query(
      `INSERT INTO efiling_config 
        (tenant_id, enabled, username, password, tax_practitioner_number, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (tenant_id) DO UPDATE SET
         enabled = COALESCE($2, efiling_config.enabled),
         username = COALESCE($3, efiling_config.username),
         password = COALESCE($4, efiling_config.password),
         tax_practitioner_number = COALESCE($5, efiling_config.tax_practitioner_number),
         updated_by = $6,
         updated_at = NOW()
       RETURNING id, tenant_id, enabled, username, tax_practitioner_number, updated_at`,
      [tenantId, enabled, username, password, taxPractitionerNumber, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'eFiling configuration updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update eFiling config error:', error);
    res.status(500).json({ success: false, error: 'Failed to update eFiling config' });
  }
};

export default {
  getTaxSettings,
  updateTaxSettings,
  getTaxAccounts,
  updateTaxAccount,
  getVatConfig,
  updateVatConfig,
  getPayeSettings,
  updatePayeSettings,
  getIncomeTaxBrackets,
  updateIncomeTaxBrackets,
  getEfilingConfig,
  updateEfilingConfig
};
