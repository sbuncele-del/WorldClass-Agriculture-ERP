import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Tax Settings Controller
 * Manages SARS-compliant tax configuration
 * Supports VAT (15%), PAYE, Income Tax (27%), and eFiling
 */

export class TaxSettingsController {
  /**
   * Get current tax configuration
   */
  async getTaxSettings(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.query;

      // Get tax configuration
      const configResult = await pool.query(
        `SELECT * FROM tax_configuration 
         WHERE tenant_id = $1 OR tenant_id IS NULL
         ORDER BY tenant_id NULLS LAST
         LIMIT 1`,
        [tenant_id || null]
      );

      // Get tax account mappings
      const accountsResult = await pool.query(
        `SELECT ta.*, coa.name as account_name
         FROM tax_accounts ta
         LEFT JOIN chart_of_accounts coa ON ta.account_code = coa.code
         WHERE ta.tenant_id = $1 OR ta.tenant_id IS NULL
         ORDER BY ta.tax_type`,
        [tenant_id || null]
      );

      // Get SARS eFiling config (without sensitive data)
      const efilingResult = await pool.query(
        `SELECT 
           id, tenant_id, environment, api_endpoint, api_version,
           auto_submit_enabled, auto_sync_enabled, sync_frequency,
           last_sync_at, last_sync_status, last_sync_message,
           connection_status, connection_tested_at, is_active,
           notification_email, notification_enabled
         FROM sars_efiling_config
         WHERE tenant_id = $1`,
        [tenant_id || null]
      );

      const config = configResult.rows[0] || {};
      const accounts = accountsResult.rows;
      const efiling = efilingResult.rows[0] || null;

      // Group accounts by category
      const accountsByType = {
        vat: accounts.filter(a => a.tax_type.startsWith('VAT_')),
        paye: accounts.filter(a => ['PAYE_PAYABLE', 'SDL_PAYABLE', 'UIF_PAYABLE'].includes(a.tax_type)),
        income_tax: accounts.filter(a => ['INCOME_TAX_PAYABLE', 'PROVISIONAL_TAX', 'DEFERRED_TAX'].includes(a.tax_type)),
        withholding: accounts.filter(a => a.tax_type === 'WITHHOLDING_TAX')
      };

      res.json({
        success: true,
        data: {
          configuration: config,
          accounts: accountsByType,
          efiling: efiling,
          setup_complete: this.calculateSetupCompletion(config, accounts)
        }
      });
    } catch (error) {
      console.error('Error getting tax settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tax settings'
      });
    }
  }

  /**
   * Update tax configuration
   */
  async updateTaxSettings(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.query;
      const updates = req.body;

      // Validate rates
      if (updates.vat_rate && (updates.vat_rate < 0 || updates.vat_rate > 100)) {
        res.status(400).json({
          success: false,
          error: 'VAT rate must be between 0 and 100'
        });
        return;
      }

      if (updates.corporate_tax_rate && (updates.corporate_tax_rate < 0 || updates.corporate_tax_rate > 100)) {
        res.status(400).json({
          success: false,
          error: 'Corporate tax rate must be between 0 and 100'
        });
        return;
      }

      // Build update query dynamically
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const allowedFields = [
        'vat_enabled', 'vat_rate', 'vat_registration_number', 'vat_period',
        'vat_start_date', 'vat_zero_rated_enabled', 'vat_exempt_enabled',
        'paye_enabled', 'paye_registration_number', 'paye_company_registration',
        'sdl_rate', 'uif_rate', 'paye_tax_year_start_month',
        'income_tax_enabled', 'corporate_tax_rate', 'income_tax_number',
        'tax_year_end_month', 'provisional_tax_enabled', 'provisional_tax_periods',
        'withholding_tax_enabled', 'withholding_tax_rate',
        'currency', 'locale'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          fields.push(`${field} = $${paramIndex}`);
          values.push(updates[field]);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
        return;
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      fields.push(`updated_by = $${paramIndex}`);
      values.push(req.body.user_id || null);
      paramIndex++;

      values.push(tenant_id || null);

      const query = `
        UPDATE tax_configuration 
        SET ${fields.join(', ')}
        WHERE tenant_id = $${paramIndex} OR (tenant_id IS NULL AND $${paramIndex} IS NULL)
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        // Insert if doesn't exist
        const insertResult = await pool.query(
          `INSERT INTO tax_configuration (tenant_id) 
           VALUES ($1) 
           RETURNING *`,
          [tenant_id || null]
        );

        res.json({
          success: true,
          data: insertResult.rows[0],
          message: 'Tax configuration created successfully'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Tax settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating tax settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tax settings'
      });
    }
  }

  /**
   * Get all tax accounts with their mappings
   */
  async getTaxAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.query;

      const result = await pool.query(
        `SELECT 
           ta.*,
           coa.name as account_name,
           coa.account_type,
           coa.current_balance as balance
         FROM tax_accounts ta
         LEFT JOIN chart_of_accounts coa ON ta.account_code = coa.code
         WHERE ta.tenant_id = $1 OR ta.tenant_id IS NULL
         ORDER BY ta.tax_type`,
        [tenant_id || null]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error getting tax accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tax accounts'
      });
    }
  }

  /**
   * Update tax account mapping
   */
  async updateTaxAccount(req: Request, res: Response): Promise<void> {
    try {
      const { tax_type } = req.params;
      const { tenant_id, account_code, is_active } = req.body;

      // Validate account exists
      if (account_code) {
        const accountCheck = await pool.query(
          'SELECT code, name FROM chart_of_accounts WHERE code = $1',
          [account_code]
        );

        if (accountCheck.rows.length === 0) {
          res.status(404).json({
            success: false,
            error: 'Account not found in Chart of Accounts'
          });
          return;
        }
      }

      // Upsert tax account mapping
      const result = await pool.query(
        `INSERT INTO tax_accounts (
           tenant_id, tax_type, account_code, is_active, updated_at, updated_by
         )
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         ON CONFLICT (tenant_id, tax_type) 
         DO UPDATE SET
           account_code = EXCLUDED.account_code,
           is_active = EXCLUDED.is_active,
           updated_at = CURRENT_TIMESTAMP,
           updated_by = EXCLUDED.updated_by
         RETURNING *`,
        [tenant_id || null, tax_type, account_code, is_active !== false, req.body.user_id || null]
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Tax account mapping updated successfully'
      });
    } catch (error) {
      console.error('Error updating tax account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update tax account mapping'
      });
    }
  }

  /**
   * Validate tax setup completeness
   */
  async validateTaxSetup(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.query;

      // Get configuration
      const configResult = await pool.query(
        `SELECT * FROM tax_configuration 
         WHERE tenant_id = $1 OR tenant_id IS NULL
         ORDER BY tenant_id NULLS LAST
         LIMIT 1`,
        [tenant_id || null]
      );

      const config = configResult.rows[0];

      if (!config) {
        res.json({
          success: true,
          data: {
            is_complete: false,
            completion_percentage: 0,
            missing_items: ['Tax configuration not initialized'],
            warnings: []
          }
        });
        return;
      }

      const missing: string[] = [];
      const warnings: string[] = [];

      // VAT Validation
      if (config.vat_enabled) {
        if (!config.vat_registration_number) {
          missing.push('VAT Registration Number');
        }

        // Check VAT accounts
        const vatAccounts = await pool.query(
          `SELECT tax_type FROM tax_accounts 
           WHERE (tenant_id = $1 OR tenant_id IS NULL) 
           AND tax_type IN ('VAT_INPUT', 'VAT_OUTPUT', 'VAT_CONTROL')
           AND account_code IS NOT NULL
           AND is_active = true`,
          [tenant_id || null]
        );

        const vatTypes = vatAccounts.rows.map(r => r.tax_type);
        if (!vatTypes.includes('VAT_INPUT')) missing.push('VAT Input Account');
        if (!vatTypes.includes('VAT_OUTPUT')) missing.push('VAT Output Account');
        if (!vatTypes.includes('VAT_CONTROL')) warnings.push('VAT Control Account not mapped (optional)');
      }

      // PAYE Validation
      if (config.paye_enabled) {
        if (!config.paye_registration_number) {
          missing.push('PAYE Registration Number');
        }
        if (!config.paye_company_registration) {
          missing.push('Company Registration Number');
        }

        // Check PAYE accounts
        const payeAccounts = await pool.query(
          `SELECT tax_type FROM tax_accounts 
           WHERE (tenant_id = $1 OR tenant_id IS NULL) 
           AND tax_type IN ('PAYE_PAYABLE', 'SDL_PAYABLE', 'UIF_PAYABLE')
           AND account_code IS NOT NULL
           AND is_active = true`,
          [tenant_id || null]
        );

        const payeTypes = payeAccounts.rows.map(r => r.tax_type);
        if (!payeTypes.includes('PAYE_PAYABLE')) missing.push('PAYE Payable Account');
        if (!payeTypes.includes('SDL_PAYABLE')) missing.push('SDL Payable Account');
        if (!payeTypes.includes('UIF_PAYABLE')) missing.push('UIF Payable Account');
      }

      // Income Tax Validation
      if (config.income_tax_enabled) {
        if (!config.income_tax_number) {
          missing.push('Income Tax Number');
        }

        // Check income tax accounts
        const incomeTaxAccounts = await pool.query(
          `SELECT tax_type FROM tax_accounts 
           WHERE (tenant_id = $1 OR tenant_id IS NULL) 
           AND tax_type IN ('INCOME_TAX_PAYABLE', 'PROVISIONAL_TAX')
           AND account_code IS NOT NULL
           AND is_active = true`,
          [tenant_id || null]
        );

        const taxTypes = incomeTaxAccounts.rows.map(r => r.tax_type);
        if (!taxTypes.includes('INCOME_TAX_PAYABLE')) missing.push('Income Tax Payable Account');
        if (!taxTypes.includes('PROVISIONAL_TAX')) warnings.push('Provisional Tax Account not mapped (optional)');
      }

      // Calculate completion
      const totalRequired = 12; // Approximate number of critical fields
      const completionPercentage = Math.round(((totalRequired - missing.length) / totalRequired) * 100);

      res.json({
        success: true,
        data: {
          is_complete: missing.length === 0,
          completion_percentage: Math.max(0, completionPercentage),
          missing_items: missing,
          warnings: warnings,
          enabled_modules: {
            vat: config.vat_enabled,
            paye: config.paye_enabled,
            income_tax: config.income_tax_enabled,
            withholding_tax: config.withholding_tax_enabled
          }
        }
      });
    } catch (error) {
      console.error('Error validating tax setup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate tax setup'
      });
    }
  }

  /**
   * Test SARS eFiling connection (Phase 2)
   */
  async testSarsConnection(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.body;

      // Get eFiling configuration
      const result = await pool.query(
        'SELECT * FROM sars_efiling_config WHERE tenant_id = $1',
        [tenant_id || null]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'SARS eFiling not configured'
        });
        return;
      }

      const config = result.rows[0];

      // TODO: Implement actual SARS API connection test
      // This is a placeholder for Phase 2 implementation
      const isTestMode = config.environment === 'TEST';

      // Simulate connection test
      const connectionSuccess = isTestMode; // In test mode, always succeed

      // Update connection status
      await pool.query(
        `UPDATE sars_efiling_config
         SET connection_status = $1,
             connection_tested_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2`,
        [connectionSuccess ? 'CONNECTED' : 'ERROR', tenant_id || null]
      );

      res.json({
        success: connectionSuccess,
        data: {
          status: connectionSuccess ? 'CONNECTED' : 'ERROR',
          environment: config.environment,
          tested_at: new Date(),
          message: connectionSuccess
            ? 'Successfully connected to SARS eFiling (Test Mode)'
            : 'Failed to connect to SARS eFiling'
        }
      });
    } catch (error) {
      console.error('Error testing SARS connection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test SARS connection'
      });
    }
  }

  /**
   * Update SARS eFiling configuration
   */
  async updateEfilingConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tenant_id } = req.query;
      const {
        environment,
        auto_submit_enabled,
        auto_sync_enabled,
        sync_frequency,
        notification_email,
        notification_enabled
      } = req.body;

      // Note: Password encryption should be handled by a separate encryption service
      // For now, we'll store a placeholder

      const result = await pool.query(
        `INSERT INTO sars_efiling_config (
           tenant_id, environment, auto_submit_enabled, auto_sync_enabled,
           sync_frequency, notification_email, notification_enabled,
           is_active, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP)
         ON CONFLICT (tenant_id)
         DO UPDATE SET
           environment = EXCLUDED.environment,
           auto_submit_enabled = EXCLUDED.auto_submit_enabled,
           auto_sync_enabled = EXCLUDED.auto_sync_enabled,
           sync_frequency = EXCLUDED.sync_frequency,
           notification_email = EXCLUDED.notification_email,
           notification_enabled = EXCLUDED.notification_enabled,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id, tenant_id, environment, auto_submit_enabled, 
                   auto_sync_enabled, sync_frequency, connection_status`,
        [
          tenant_id || null,
          environment || 'TEST',
          auto_submit_enabled || false,
          auto_sync_enabled || false,
          sync_frequency || 'MANUAL',
          notification_email,
          notification_enabled !== false
        ]
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'SARS eFiling configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating eFiling config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update eFiling configuration'
      });
    }
  }

  /**
   * Helper: Calculate setup completion percentage
   */
  private calculateSetupCompletion(config: any, accounts: any[]): number {
    let completed = 0;
    let total = 0;

    // VAT
    if (config.vat_enabled) {
      total += 3;
      if (config.vat_registration_number) completed++;
      if (accounts.some(a => a.tax_type === 'VAT_INPUT' && a.account_code)) completed++;
      if (accounts.some(a => a.tax_type === 'VAT_OUTPUT' && a.account_code)) completed++;
    }

    // PAYE
    if (config.paye_enabled) {
      total += 5;
      if (config.paye_registration_number) completed++;
      if (config.paye_company_registration) completed++;
      if (accounts.some(a => a.tax_type === 'PAYE_PAYABLE' && a.account_code)) completed++;
      if (accounts.some(a => a.tax_type === 'SDL_PAYABLE' && a.account_code)) completed++;
      if (accounts.some(a => a.tax_type === 'UIF_PAYABLE' && a.account_code)) completed++;
    }

    // Income Tax
    if (config.income_tax_enabled) {
      total += 2;
      if (config.income_tax_number) completed++;
      if (accounts.some(a => a.tax_type === 'INCOME_TAX_PAYABLE' && a.account_code)) completed++;
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}

export default new TaxSettingsController();
