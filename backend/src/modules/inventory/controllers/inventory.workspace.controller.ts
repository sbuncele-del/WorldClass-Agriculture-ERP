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
 * Inventory Workspace Controller
 * Provides aggregated data for the Inventory Management dashboard
 */

/**
 * GET /api/inventory/workspace
 * Returns all data needed for the Inventory Management workspace dashboard
 */
export const getInventoryWorkspace = async (req: TenantRequest, res: Response) => {
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
      stockLevels,
      reorderAlerts,
      recentMovements,
      valuationSummary,
      topMovingItems,
      inventorySummary,
    ] = await Promise.all([
      getStockLevels(tenantId),
      getReorderAlerts(tenantId),
      getRecentMovements(tenantId),
      getValuationSummary(tenantId),
      getTopMovingItems(tenantId),
      getInventorySummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: inventorySummary,
        stock_levels: stockLevels,
        reorder_alerts: reorderAlerts,
        recent_movements: recentMovements,
        valuation: valuationSummary,
        top_moving_items: topMovingItems,
      },
    });
  } catch (error: any) {
    console.error('Inventory workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inventory workspace data',
    });
  }
};

/**
 * Get current stock levels by category
 */
async function getStockLevels(tenantId: string) {
  const result = await query(
    `
    SELECT 
      category,
      COUNT(*) as item_count,
      SUM(quantity_on_hand) as total_quantity,
      SUM(quantity_on_hand * unit_cost) as total_value
    FROM inventory_items
    WHERE tenant_id = $1 AND is_active = true
    GROUP BY category
    ORDER BY total_value DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get items needing reorder
 */
async function getReorderAlerts(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      item_code,
      item_name,
      category,
      quantity_on_hand,
      reorder_level,
      reorder_quantity,
      unit_cost,
      (reorder_quantity * unit_cost) as estimated_cost
    FROM inventory_items
    WHERE tenant_id = $1 
      AND is_active = true
      AND quantity_on_hand <= reorder_level
    ORDER BY (reorder_level - quantity_on_hand) DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent inventory movements (last 20)
 */
async function getRecentMovements(tenantId: string) {
  const result = await query(
    `
    SELECT 
      im.id,
      im.movement_date,
      im.movement_type,
      im.item_id,
      ii.item_code,
      ii.item_name,
      im.quantity,
      im.reference_number,
      im.notes
    FROM inventory_movements im
    JOIN inventory_items ii ON im.item_id = ii.id
    WHERE im.tenant_id = $1
    ORDER BY im.movement_date DESC, im.created_at DESC
    LIMIT 20
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get inventory valuation summary
 */
async function getValuationSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      SUM(quantity_on_hand * unit_cost) as total_inventory_value,
      AVG(unit_cost) as average_unit_cost,
      SUM(quantity_on_hand) as total_units
    FROM inventory_items
    WHERE tenant_id = $1 AND is_active = true
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_inventory_value: 0,
    average_unit_cost: 0,
    total_units: 0,
  };
}

/**
 * Get top moving items (last 30 days)
 */
async function getTopMovingItems(tenantId: string) {
  const result = await query(
    `
    SELECT 
      ii.id,
      ii.item_code,
      ii.item_name,
      ii.category,
      SUM(ABS(im.quantity)) as movement_count,
      SUM(CASE WHEN im.movement_type IN ('sale', 'adjustment_out') THEN im.quantity ELSE 0 END) as total_out
    FROM inventory_items ii
    JOIN inventory_movements im ON ii.id = im.item_id
    WHERE ii.tenant_id = $1 
      AND im.movement_date >= NOW() - INTERVAL '30 days'
    GROUP BY ii.id, ii.item_code, ii.item_name, ii.category
    ORDER BY movement_count DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get inventory summary metrics
 */
async function getInventorySummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_items,
      COUNT(CASE WHEN quantity_on_hand <= reorder_level THEN 1 END) as items_to_reorder,
      COUNT(CASE WHEN quantity_on_hand = 0 THEN 1 END) as out_of_stock_items,
      SUM(quantity_on_hand * unit_cost) as total_value
    FROM inventory_items
    WHERE tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_items: 0,
    active_items: 0,
    items_to_reorder: 0,
    out_of_stock_items: 0,
    total_value: 0,
  };
}
