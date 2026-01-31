/**
 * Manufacturing Controller V2
 * Tenant-aware handlers for BOMs, Work Centers, Production Orders, and Shop Floor Operations
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { pool } from '../../../config/database';

/**
 * Tenant context helper
 */
interface TenantContext {
  tenantId: string;
  userId?: string;
}

function getTenantContext(req: TenantRequest): TenantContext {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant ID not found');
  }
  return {
    tenantId,
    userId: req.user?.id
  };
}

// ============================================================================
// WORK CENTERS
// ============================================================================

export const getWorkCenters = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status } = req.query;
    const params: any[] = [tenantId];
    let query = `SELECT * FROM manufacturing.work_centers WHERE tenant_id = $1`;
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ` ORDER BY work_center_code`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching work centers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work centers', error: error.message });
  }
};

export const createWorkCenter = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      work_center_code, work_center_name, description, warehouse_id,
      capacity_per_day_hours, efficiency_factor, hourly_cost_rate
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO manufacturing.work_centers (
        tenant_id, work_center_code, work_center_name, description, warehouse_id,
        capacity_per_day_hours, efficiency_factor, hourly_cost_rate, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, work_center_code, work_center_name, description, warehouse_id,
       capacity_per_day_hours, efficiency_factor, hourly_cost_rate, userId || 1]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating work center:', error);
    res.status(500).json({ success: false, message: 'Failed to create work center', error: error.message });
  }
};

// ============================================================================
// BILL OF MATERIALS (BOM)
// ============================================================================

export const getBOMs = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    
    // Simplified query using public.boms or manufacturing.boms
    const result = await pool.query(`
      SELECT * FROM boms WHERE tenant_id = $1 ORDER BY created_at DESC
    `, [tenantId]);
    
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching BOMs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch BOMs', error: error.message });
  }
};

export const getBOMById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    
    const bomResult = await pool.query(
      `SELECT b.*, i.item_code, i.item_name 
       FROM manufacturing.bill_of_materials b
       JOIN items i ON b.item_id = i.item_id AND i.tenant_id = $1
       WHERE b.bom_id = $2 AND b.tenant_id = $1`,
      [tenantId, id]
    );
    
    if (bomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }
    
    const componentsResult = await pool.query(
      `SELECT bc.*, i.item_code, i.item_name, u.uom_code
       FROM manufacturing.bom_components bc
       JOIN items i ON bc.item_id = i.item_id AND i.tenant_id = $1
       LEFT JOIN units_of_measure u ON bc.uom_id = u.uom_id
       WHERE bc.bom_id = $2`,
      [tenantId, id]
    );
    
    res.json({
      success: true,
      data: {
        ...bomResult.rows[0],
        components: componentsResult.rows
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching BOM details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch BOM details', error: error.message });
  }
};

export const createBOM = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    await client.query('BEGIN');
    
    const { item_id, bom_code, version, description, components } = req.body;
    
    const bomResult = await client.query(
      `INSERT INTO manufacturing.bill_of_materials (
        tenant_id, item_id, bom_code, version, description, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, item_id, bom_code, version, description, userId || 1]
    );
    
    const bomId = bomResult.rows[0].bom_id;
    
    for (const comp of components || []) {
      await client.query(
        `INSERT INTO manufacturing.bom_components (
          bom_id, item_id, quantity, uom_id, scrap_percentage, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [bomId, comp.item_id, comp.quantity, comp.uom_id, comp.scrap_percentage || 0, comp.notes]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: bomResult.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating BOM:', error);
    res.status(500).json({ success: false, message: 'Failed to create BOM', error: error.message });
  } finally {
    client.release();
  }
};

// ============================================================================
// PRODUCTION ORDERS
// ============================================================================

export const getProductionOrders = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status } = req.query;
    const params: any[] = [tenantId];
    
    // Simplified query - use work_orders table
    let query = `
      SELECT * FROM work_orders WHERE tenant_id = $1
    `;
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching production orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch production orders', error: error.message });
  }
};

export const createProductionOrder = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    await client.query('BEGIN');
    
    const {
      item_id, quantity_planned, start_date, due_date,
      warehouse_id, priority, notes, bom_id, routing_id
    } = req.body;
    
    // Generate Order Number (tenant-scoped)
    const numResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 as next_num
       FROM manufacturing.production_orders 
       WHERE tenant_id = $1 AND order_number LIKE 'WO-%'`,
      [tenantId]
    );
    const orderNumber = `WO-${String(numResult.rows[0].next_num).padStart(6, '0')}`;
    
    // Use default BOM/Routing if not provided
    let finalBomId = bom_id;
    if (!finalBomId) {
      const bomRes = await client.query(
        `SELECT bom_id FROM manufacturing.bill_of_materials 
         WHERE tenant_id = $1 AND item_id = $2 AND is_default = true LIMIT 1`,
        [tenantId, item_id]
      );
      finalBomId = bomRes.rows[0]?.bom_id;
    }
    
    let finalRoutingId = routing_id;
    if (!finalRoutingId) {
      const routRes = await client.query(
        `SELECT routing_id FROM manufacturing.routings 
         WHERE tenant_id = $1 AND item_id = $2 AND is_default = true LIMIT 1`,
        [tenantId, item_id]
      );
      finalRoutingId = routRes.rows[0]?.routing_id;
    }
    
    const result = await client.query(
      `INSERT INTO manufacturing.production_orders (
        tenant_id, order_number, item_id, bom_id, routing_id, warehouse_id,
        quantity_planned, start_date, due_date, priority, notes,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planned', $12)
      RETURNING *`,
      [tenantId, orderNumber, item_id, finalBomId, finalRoutingId, warehouse_id,
       quantity_planned, start_date, due_date, priority || 'medium', notes, userId || 1]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating production order:', error);
    res.status(500).json({ success: false, message: 'Failed to create production order', error: error.message });
  } finally {
    client.release();
  }
};

export const updateProductionOrderStatus = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId } = getTenantContext(req);
    await client.query('BEGIN');
    const { id } = req.params;
    const { status } = req.body; // released, in_progress, completed, cancelled
    
    const orderRes = await client.query(
      `SELECT * FROM manufacturing.production_orders 
       WHERE production_order_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const order = orderRes.rows[0];
    
    // Status transition logic
    let updateQuery = `UPDATE manufacturing.production_orders SET status = $1, updated_at = NOW()`;
    const params: any[] = [status];
    
    if (status === 'in_progress' && order.status !== 'in_progress') {
      updateQuery += `, actual_start_date = NOW()`;
    } else if (status === 'completed' && order.status !== 'completed') {
      updateQuery += `, actual_end_date = NOW(), quantity_produced = quantity_planned`;
    }
    
    updateQuery += ` WHERE production_order_id = $${params.length + 1} AND tenant_id = $${params.length + 2} RETURNING *`;
    params.push(id, tenantId);
    
    const result = await client.query(updateQuery, params);
    
    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  } finally {
    client.release();
  }
};

export const getDashboardStats = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    
    // Simplified dashboard - count from work_orders
    const workOrders = await pool.query(
      `SELECT COUNT(*) as count FROM work_orders WHERE tenant_id = $1`,
      [tenantId]
    );
    
    const boms = await pool.query(
      `SELECT COUNT(*) as count FROM boms WHERE tenant_id = $1`,
      [tenantId]
    );
    
    res.json({
      success: true,
      data: {
        active_orders: parseInt(workOrders.rows[0]?.count || '0'),
        total_boms: parseInt(boms.rows[0]?.count || '0'),
        avg_efficiency: 0,
        status_breakdown: [],
        upcoming_orders: []
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

export default {
  getWorkCenters,
  createWorkCenter,
  getBOMs,
  getBOMById,
  createBOM,
  getProductionOrders,
  createProductionOrder,
  updateProductionOrderStatus,
  getDashboardStats
};
