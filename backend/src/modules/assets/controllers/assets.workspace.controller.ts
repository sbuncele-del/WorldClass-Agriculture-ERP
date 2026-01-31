import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { query } from '../../../config/database';

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * Assets Workspace Controller
 * Provides aggregated data for the Asset Management dashboard
 */

/**
 * GET /api/assets/workspace
 * Returns all data needed for the Asset Management workspace dashboard
 */
export const getAssetsWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found',
      });
    }

    // Parallel queries for performance
    const [
      assetSummary,
      depreciationSchedule,
      maintenanceDue,
      assetValuations,
      recentAcquisitions,
      assetsByCategory,
    ] = await Promise.all([
      getAssetSummary(tenantId),
      getDepreciationSchedule(tenantId),
      getMaintenanceDue(tenantId),
      getAssetValuations(tenantId),
      getRecentAcquisitions(tenantId),
      getAssetsByCategory(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: assetSummary,
        depreciation_schedule: depreciationSchedule,
        maintenance_due: maintenanceDue,
        valuations: assetValuations,
        recent_acquisitions: recentAcquisitions,
        by_category: assetsByCategory,
      },
    });
  } catch (error: any) {
    console.error('Assets workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch assets workspace data',
    });
  }
};

/**
 * Get asset summary metrics
 */
async function getAssetSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(*) as total_assets,
      COUNT(CASE WHEN asset_status = 'ACTIVE' THEN 1 END) as active_assets,
      COUNT(CASE WHEN asset_status = 'DISPOSED' THEN 1 END) as disposed_assets,
      SUM(purchase_price) as total_acquisition_cost,
      SUM(net_book_value) as total_current_value,
      SUM(accumulated_depreciation) as total_depreciation
    FROM fixed_assets
    WHERE tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_assets: 0,
    active_assets: 0,
    disposed_assets: 0,
    total_acquisition_cost: 0,
    total_current_value: 0,
    total_depreciation: 0,
  };
}

/**
 * Get upcoming depreciation schedule (next 3 months)
 */
async function getDepreciationSchedule(tenantId: string) {
  const result = await query(
    `
    SELECT 
      DATE_TRUNC('month', s.depreciation_date) as month,
      SUM(s.depreciation_amount) as total_depreciation
    FROM asset_depreciation_schedule s
    JOIN fixed_assets a ON s.asset_id = a.asset_id
    WHERE a.tenant_id = $1 
      AND s.depreciation_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 months'
    GROUP BY DATE_TRUNC('month', s.depreciation_date)
    ORDER BY month ASC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get assets with maintenance due
 */
async function getMaintenanceDue(tenantId: string) {
  const result = await query(
    `
    SELECT 
      a.asset_id as id,
      a.asset_number as asset_tag,
      a.asset_name,
      c.category_name as category,
      l.location_name as location,
      am.maintenance_date,
      am.maintenance_type,
      am.status
    FROM fixed_assets a
    LEFT JOIN asset_categories c ON a.category_id = c.category_id
    LEFT JOIN asset_locations l ON a.location_id = l.location_id
    LEFT JOIN asset_maintenance am ON a.asset_id = am.asset_id
    WHERE a.tenant_id = $1 
      AND am.status = 'SCHEDULED'
      AND am.maintenance_date <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY am.maintenance_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get asset valuations by depreciation method
 */
async function getAssetValuations(tenantId: string) {
  const result = await query(
    `
    SELECT 
      depreciation_method,
      COUNT(*) as asset_count,
      SUM(purchase_price) as total_cost,
      SUM(net_book_value) as total_value,
      SUM(accumulated_depreciation) as total_depreciation
    FROM fixed_assets
    WHERE tenant_id = $1 AND asset_status = 'ACTIVE'
    GROUP BY depreciation_method
    ORDER BY total_value DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent asset acquisitions (last 60 days)
 */
async function getRecentAcquisitions(tenantId: string) {
  const result = await query(
    `
    SELECT 
      a.asset_id as id,
      a.asset_number as asset_tag,
      a.asset_name,
      c.category_name as category,
      a.acquisition_date,
      a.purchase_price as acquisition_cost,
      s.name as supplier,
      l.location_name as location
    FROM fixed_assets a
    LEFT JOIN asset_categories c ON a.category_id = c.category_id
    LEFT JOIN suppliers s ON a.supplier_id = s.id
    LEFT JOIN asset_locations l ON a.location_id = l.location_id
    WHERE a.tenant_id = $1 
      AND a.acquisition_date >= CURRENT_DATE - INTERVAL '60 days'
    ORDER BY a.acquisition_date DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get assets grouped by category
 */
async function getAssetsByCategory(tenantId: string) {
  const result = await query(
    `
    SELECT 
      c.category_name as category,
      COUNT(*) as asset_count,
      SUM(a.purchase_price) as total_cost,
      SUM(a.net_book_value) as total_value,
      AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.acquisition_date))) as avg_age_years
    FROM fixed_assets a
    LEFT JOIN asset_categories c ON a.category_id = c.category_id
    WHERE a.tenant_id = $1 AND a.asset_status = 'ACTIVE'
    GROUP BY c.category_name
    ORDER BY total_value DESC
    `,
    [tenantId]
  );

  return result.rows;
}
