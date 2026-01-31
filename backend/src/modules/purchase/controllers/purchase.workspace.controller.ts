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
 * Purchase Workspace Controller
 * Provides aggregated data for the Purchase Management dashboard
 */

/**
 * GET /api/purchase/workspace
 * Returns all data needed for the Purchase Management workspace dashboard
 */
export const getPurchaseWorkspace = async (req: TenantRequest, res: Response) => {
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
      pendingPOs,
      supplierPerformance,
      inventoryAlerts,
      approvalQueue,
      recentPurchases,
      purchaseSummary,
    ] = await Promise.all([
      getPendingPurchaseOrders(tenantId),
      getSupplierPerformance(tenantId),
      getInventoryAlerts(tenantId),
      getApprovalQueue(tenantId),
      getRecentPurchases(tenantId),
      getPurchaseSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: purchaseSummary,
        pending_pos: pendingPOs,
        supplier_performance: supplierPerformance,
        inventory_alerts: inventoryAlerts,
        approval_queue: approvalQueue,
        recent_purchases: recentPurchases,
      },
    });
  } catch (error: any) {
    console.error('Purchase workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch purchase workspace data',
    });
  }
};

/**
 * Get pending purchase orders
 */
async function getPendingPurchaseOrders(tenantId: string) {
  const result = await query(
    `
    SELECT 
      po.id,
      po.po_number,
      po.order_date,
      po.supplier_id,
      s.name as supplier_name,
      po.total_amount,
      po.status,
      po.expected_delivery_date
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.tenant_id = $1 
      AND po.status IN ('draft', 'sent', 'confirmed')
    ORDER BY po.expected_delivery_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get supplier performance metrics
 */
async function getSupplierPerformance(tenantId: string) {
  const result = await query(
    `
    SELECT 
      s.id,
      s.name,
      COUNT(po.id) as order_count,
      SUM(po.total_amount) as total_spent,
      AVG(CASE 
        WHEN po.actual_delivery_date IS NOT NULL AND po.expected_delivery_date IS NOT NULL
        THEN EXTRACT(DAY FROM (po.actual_delivery_date - po.expected_delivery_date))
        ELSE 0 
      END) as avg_delivery_delay_days
    FROM suppliers s
    JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.tenant_id = $1 AND po.status = 'completed'
    GROUP BY s.id, s.name
    ORDER BY total_spent DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get inventory alerts (low stock items)
 */
async function getInventoryAlerts(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      item_code,
      item_name,
      quantity_on_hand,
      reorder_level,
      reorder_quantity
    FROM inventory_items
    WHERE tenant_id = $1 
      AND quantity_on_hand <= reorder_level
      AND is_active = true
    ORDER BY (reorder_level - quantity_on_hand) DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get approval queue
 */
async function getApprovalQueue(tenantId: string) {
  const result = await query(
    `
    SELECT 
      pr.id,
      pr.request_number,
      pr.request_date,
      pr.total_amount,
      pr.status,
      pr.requested_by,
      u.email as requester_email
    FROM purchase_requisitions pr
    LEFT JOIN users u ON pr.requested_by = u.id
    WHERE pr.tenant_id = $1 AND pr.status = 'pending_approval'
    ORDER BY pr.request_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent purchases (last 10)
 */
async function getRecentPurchases(tenantId: string) {
  const result = await query(
    `
    SELECT 
      po.id,
      po.po_number,
      po.order_date,
      s.name as supplier_name,
      po.total_amount,
      po.status
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    WHERE po.tenant_id = $1
    ORDER BY po.order_date DESC, po.created_at DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get purchase summary metrics
 */
async function getPurchaseSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT po.id) as total_orders,
      SUM(po.total_amount) as total_spent,
      COUNT(DISTINCT s.id) as total_suppliers,
      COUNT(CASE WHEN po.status IN ('draft', 'sent', 'confirmed') THEN 1 END) as pending_orders,
      COUNT(CASE WHEN pr.status = 'pending_approval' THEN 1 END) as pending_approvals,
      COUNT(CASE WHEN ii.quantity_on_hand <= ii.reorder_level THEN 1 END) as low_stock_items
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id AND s.tenant_id = $1
    LEFT JOIN purchase_requisitions pr ON pr.tenant_id = $1
    LEFT JOIN inventory_items ii ON ii.tenant_id = $1 AND ii.is_active = true
    WHERE po.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_orders: 0,
    total_spent: 0,
    total_suppliers: 0,
    pending_orders: 0,
    pending_approvals: 0,
    low_stock_items: 0,
  };
}
