/**
 * Module Management Controller V2
 * Tenant-hardened API for ERP module management
 * 
 * Features:
 * - Enable/disable modules
 * - Module configuration
 * - Module dependencies
 * - Usage tracking
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

// Available ERP modules
const AVAILABLE_MODULES = [
  { code: 'FINANCIAL', name: 'Financial Accounting', description: 'General ledger, accounts payable/receivable, financial reporting', category: 'core' },
  { code: 'INVENTORY', name: 'Inventory Management', description: 'Stock control, warehousing, inventory valuation', category: 'core' },
  { code: 'SALES', name: 'Sales & CRM', description: 'Sales orders, quotations, customer relationship management', category: 'core' },
  { code: 'PURCHASE', name: 'Purchase Management', description: 'Purchase orders, supplier management, procurement', category: 'core' },
  { code: 'HR', name: 'HR & Payroll', description: 'Employee management, payroll processing, leave management', category: 'core' },
  { code: 'MANUFACTURING', name: 'Manufacturing', description: 'BOM, production orders, work centers', category: 'extended' },
  { code: 'LOGISTICS', name: 'Logistics', description: 'Fleet management, route optimization, delivery tracking', category: 'extended' },
  { code: 'HEALTHCARE', name: 'Healthcare', description: 'Patient management, facility operations, GoodX integration', category: 'industry' },
  { code: 'AGRICULTURE', name: 'Agriculture', description: 'Farm management, crop tracking, harvest planning', category: 'industry' },
  { code: 'PROPERTY', name: 'Property Management', description: 'Property portfolio, lease management, tenant billing', category: 'industry' },
  { code: 'CONSTRUCTION', name: 'Construction', description: 'Project management, cost tracking, contractor management', category: 'industry' },
  { code: 'MINING', name: 'Mining', description: 'Resource extraction tracking, compliance, equipment management', category: 'industry' },
  { code: 'COMPLIANCE', name: 'Compliance', description: 'Regulatory compliance, SARS integration, audit trails', category: 'addon' },
  { code: 'AI_ASSISTANT', name: 'AI Assistant', description: 'AI-powered insights, recommendations, automation', category: 'addon' },
  { code: 'TREASURY', name: 'Treasury', description: 'Cash management, bank reconciliation, cash forecasting', category: 'addon' }
];

// Module dependencies
const MODULE_DEPENDENCIES: Record<string, string[]> = {
  'MANUFACTURING': ['INVENTORY'],
  'LOGISTICS': ['INVENTORY', 'SALES'],
  'TREASURY': ['FINANCIAL'],
  'COMPLIANCE': ['FINANCIAL']
};

/**
 * Get all available modules with tenant status
 */
export const getModules = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Try to get tenant's enabled modules, fallback to default if table doesn't exist
    let enabledModules = new Map();
    try {
      const result = await pool.query(
        `SELECT module_code, is_enabled, enabled_at, disabled_at, config
         FROM tenant_modules
         WHERE tenant_id = $1`,
        [tenantId]
      );
      enabledModules = new Map(
        result.rows.map(row => [row.module_code, row])
      );
    } catch (dbError) {
      // Table might not exist, use defaults
      console.log('[ModuleManagement] tenant_modules table not found, using defaults');
    }

    const modules = AVAILABLE_MODULES.map(module => ({
      ...module,
      isEnabled: enabledModules.has(module.code) ? enabledModules.get(module.code).is_enabled : module.category === 'core',
      enabledAt: enabledModules.get(module.code)?.enabled_at || null,
      config: enabledModules.get(module.code)?.config || {},
      dependencies: MODULE_DEPENDENCIES[module.code] || []
    }));

    res.json({
      success: true,
      data: {
        modules,
        summary: {
          total: modules.length,
          enabled: modules.filter(m => m.isEnabled).length,
          byCategory: {
            core: modules.filter(m => m.category === 'core').length,
            extended: modules.filter(m => m.category === 'extended').length,
            industry: modules.filter(m => m.category === 'industry').length,
            addon: modules.filter(m => m.category === 'addon').length
          }
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get modules error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch modules' });
  }
};

/**
 * Get module by code
 */
export const getModuleByCode = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code } = req.params;

    const moduleInfo = AVAILABLE_MODULES.find(m => m.code === code.toUpperCase());
    if (!moduleInfo) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const result = await pool.query(
      `SELECT * FROM tenant_modules WHERE tenant_id = $1 AND module_code = $2`,
      [tenantId, code.toUpperCase()]
    );

    const tenantModule = result.rows[0];

    res.json({
      success: true,
      data: {
        ...moduleInfo,
        isEnabled: tenantModule?.is_enabled || false,
        enabledAt: tenantModule?.enabled_at || null,
        config: tenantModule?.config || {},
        dependencies: MODULE_DEPENDENCIES[moduleInfo.code] || [],
        usage: tenantModule?.usage_stats || null
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get module error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch module' });
  }
};

/**
 * Enable a module
 */
export const enableModule = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { code } = req.params;
    const { config } = req.body;

    const moduleCode = code.toUpperCase();
    const moduleInfo = AVAILABLE_MODULES.find(m => m.code === moduleCode);
    
    if (!moduleInfo) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Check dependencies
    const dependencies = MODULE_DEPENDENCIES[moduleCode] || [];
    if (dependencies.length > 0) {
      const enabledModules = await pool.query(
        `SELECT module_code FROM tenant_modules 
         WHERE tenant_id = $1 AND module_code = ANY($2) AND is_enabled = true`,
        [tenantId, dependencies]
      );

      const enabledCodes = enabledModules.rows.map(r => r.module_code);
      const missingDeps = dependencies.filter(d => !enabledCodes.includes(d));

      if (missingDeps.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required dependencies',
          missingDependencies: missingDeps
        });
      }
    }

    // Enable or update module
    const result = await pool.query(
      `INSERT INTO tenant_modules (tenant_id, module_code, is_enabled, enabled_at, enabled_by, config)
       VALUES ($1, $2, true, NOW(), $3, $4)
       ON CONFLICT (tenant_id, module_code)
       DO UPDATE SET is_enabled = true, enabled_at = NOW(), enabled_by = $3, config = COALESCE($4, tenant_modules.config)
       RETURNING *`,
      [tenantId, moduleCode, userId, config ? JSON.stringify(config) : null]
    );

    res.json({
      success: true,
      message: `Module ${moduleInfo.name} enabled successfully`,
      data: result.rows[0]
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Enable module error:', error);
    res.status(500).json({ success: false, error: 'Failed to enable module' });
  }
};

/**
 * Disable a module
 */
export const disableModule = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { code } = req.params;

    const moduleCode = code.toUpperCase();
    const moduleInfo = AVAILABLE_MODULES.find(m => m.code === moduleCode);
    
    if (!moduleInfo) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    // Check if other modules depend on this one
    const dependentModules = Object.entries(MODULE_DEPENDENCIES)
      .filter(([_, deps]) => deps.includes(moduleCode))
      .map(([code]) => code);

    if (dependentModules.length > 0) {
      const enabledDependents = await pool.query(
        `SELECT module_code FROM tenant_modules 
         WHERE tenant_id = $1 AND module_code = ANY($2) AND is_enabled = true`,
        [tenantId, dependentModules]
      );

      if (enabledDependents.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot disable module - other modules depend on it',
          dependentModules: enabledDependents.rows.map(r => r.module_code)
        });
      }
    }

    const result = await pool.query(
      `UPDATE tenant_modules
       SET is_enabled = false, disabled_at = NOW(), disabled_by = $1
       WHERE tenant_id = $2 AND module_code = $3
       RETURNING *`,
      [userId, tenantId, moduleCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Module not enabled for this tenant' });
    }

    res.json({
      success: true,
      message: `Module ${moduleInfo.name} disabled successfully`,
      data: result.rows[0]
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Disable module error:', error);
    res.status(500).json({ success: false, error: 'Failed to disable module' });
  }
};

/**
 * Update module configuration
 */
export const updateModuleConfig = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { code } = req.params;
    const { config } = req.body;

    const moduleCode = code.toUpperCase();

    const result = await pool.query(
      `UPDATE tenant_modules
       SET config = $1, updated_at = NOW(), updated_by = $2
       WHERE tenant_id = $3 AND module_code = $4
       RETURNING *`,
      [JSON.stringify(config), userId, tenantId, moduleCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Module not found or not enabled' });
    }

    res.json({
      success: true,
      message: 'Module configuration updated',
      data: result.rows[0]
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
 * Get module usage statistics
 */
export const getModuleUsage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code } = req.params;
    const { startDate, endDate } = req.query;

    const moduleCode = code.toUpperCase();

    const result = await pool.query(
      `SELECT 
         DATE(accessed_at) as date,
         COUNT(*) as access_count,
         COUNT(DISTINCT user_id) as unique_users
       FROM module_access_logs
       WHERE tenant_id = $1 AND module_code = $2
         AND ($3::date IS NULL OR accessed_at >= $3)
         AND ($4::date IS NULL OR accessed_at <= $4)
       GROUP BY DATE(accessed_at)
       ORDER BY date DESC
       LIMIT 30`,
      [tenantId, moduleCode, startDate || null, endDate || null]
    );

    res.json({
      success: true,
      data: {
        moduleCode,
        usage: result.rows,
        summary: {
          totalAccesses: result.rows.reduce((sum, r) => sum + parseInt(r.access_count), 0),
          averageDailyAccesses: result.rows.length > 0
            ? Math.round(result.rows.reduce((sum, r) => sum + parseInt(r.access_count), 0) / result.rows.length)
            : 0
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get module usage error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch module usage' });
  }
};

/**
 * Get module dependencies
 */
export const getModuleDependencies = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant
    const { code } = req.params;

    const moduleCode = code.toUpperCase();
    const moduleInfo = AVAILABLE_MODULES.find(m => m.code === moduleCode);
    
    if (!moduleInfo) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const dependencies = MODULE_DEPENDENCIES[moduleCode] || [];
    const dependents = Object.entries(MODULE_DEPENDENCIES)
      .filter(([_, deps]) => deps.includes(moduleCode))
      .map(([code]) => code);

    res.json({
      success: true,
      data: {
        moduleCode,
        requires: dependencies,
        requiredBy: dependents
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get module dependencies error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch module dependencies' });
  }
};

export default {
  getModules,
  getModuleByCode,
  enableModule,
  disableModule,
  updateModuleConfig,
  getModuleUsage,
  getModuleDependencies
};
