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
 * Sales Workspace Controller
 * Provides aggregated data for the Sales & CRM dashboard
 */

/**
 * GET /api/sales/workspace
 * Returns all data needed for the Sales & CRM workspace dashboard
 */
export const getSalesWorkspace = async (req: TenantRequest, res: Response) => {
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
      salesPipeline,
      recentOrders,
      topCustomers,
      salesCharts,
      pendingQuotations,
      salesSummary,
    ] = await Promise.all([
      getSalesPipeline(tenantId),
      getRecentOrders(tenantId),
      getTopCustomers(tenantId),
      getSalesCharts(tenantId),
      getPendingQuotations(tenantId),
      getSalesSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: salesSummary,
        pipeline: salesPipeline,
        recent_orders: recentOrders,
        top_customers: topCustomers,
        sales_charts: salesCharts,
        pending_quotations: pendingQuotations,
      },
    });
  } catch (error: any) {
    console.error('Sales workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sales workspace data',
    });
  }
};

/**
 * Get sales pipeline by stage
 */
async function getSalesPipeline(tenantId: string) {
  const result = await query(
    `
    SELECT 
      stage,
      COUNT(*) as opportunity_count,
      COALESCE(SUM(value), 0) as total_value
    FROM sales.opportunities
    WHERE tenant_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')
    GROUP BY stage
    ORDER BY 
      CASE stage
        WHEN 'qualification' THEN 1
        WHEN 'proposal' THEN 2
        WHEN 'negotiation' THEN 3
        ELSE 4
      END
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent sales orders (last 10)
 */
async function getRecentOrders(tenantId: string) {
  const result = await query(
    `
    SELECT 
      so.order_id as id,
      so.order_number,
      so.order_date,
      so.customer_id,
      c.company_name as customer_name,
      so.total as total_amount,
      so.status
    FROM sales.orders so
    LEFT JOIN sales.customers c ON so.customer_id = c.customer_id
    WHERE so.tenant_id = $1
    ORDER BY so.order_date DESC, so.created_at DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get top customers by revenue
 */
async function getTopCustomers(tenantId: string) {
  const result = await query(
    `
    SELECT 
      c.customer_id as id,
      c.company_name as name,
      c.email,
      COUNT(so.order_id) as order_count,
      COALESCE(SUM(so.total), 0) as total_revenue
    FROM sales.customers c
    LEFT JOIN sales.orders so ON c.customer_id = so.customer_id AND so.status != 'cancelled'
    WHERE c.tenant_id = $1
    GROUP BY c.customer_id, c.company_name, c.email
    HAVING COUNT(so.order_id) > 0
    ORDER BY total_revenue DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get sales charts data (last 6 months)
 */
async function getSalesCharts(tenantId: string) {
  const result = await query(
    `
    SELECT 
      DATE_TRUNC('month', order_date) as month,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as revenue
    FROM sales.orders
    WHERE tenant_id = $1 
      AND status != 'cancelled'
      AND order_date >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', order_date)
    ORDER BY month DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get pending quotations
 */
async function getPendingQuotations(tenantId: string) {
  const result = await query(
    `
    SELECT 
      quotation_id as id,
      quotation_number as quote_number,
      quotation_date as quote_date,
      customer_id,
      total as total_amount,
      status,
      valid_until
    FROM sales.quotations
    WHERE tenant_id = $1 AND status = 'sent'
    ORDER BY quotation_date DESC
    LIMIT 5
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get sales summary metrics
 */
async function getSalesSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      (SELECT COUNT(*) FROM sales.orders WHERE tenant_id = $1 AND status != 'cancelled') as total_orders,
      (SELECT COALESCE(SUM(total), 0) FROM sales.orders WHERE tenant_id = $1 AND status != 'cancelled') as total_revenue,
      (SELECT COUNT(*) FROM sales.customers WHERE tenant_id = $1) as total_customers,
      (SELECT COUNT(*) FROM sales.opportunities WHERE tenant_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')) as open_opportunities,
      (SELECT COALESCE(SUM(value), 0) FROM sales.opportunities WHERE tenant_id = $1 AND stage NOT IN ('closed_won', 'closed_lost')) as pipeline_value,
      (SELECT COUNT(*) FROM sales.quotations WHERE tenant_id = $1 AND status = 'sent') as pending_quotes
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_orders: 0,
    total_revenue: 0,
    total_customers: 0,
    open_opportunities: 0,
    pipeline_value: 0,
    pending_quotes: 0,
  };
}
