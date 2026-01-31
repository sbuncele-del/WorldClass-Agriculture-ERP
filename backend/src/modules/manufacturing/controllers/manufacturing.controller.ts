/**
 * Manufacturing Controller
 * Handles BOMs, Work Centers, Production Orders, and Shop Floor Operations
 */

import { Request, Response } from 'express';
import { pool } from '../../../config/database';
import { PoolClient } from 'pg';

// ============================================================================
// WORK CENTERS
// ============================================================================

export const getWorkCenters = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const params: any[] = [];
    let query = `SELECT * FROM manufacturing.work_centers WHERE 1=1`;
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    query += ` ORDER BY work_center_code`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching work centers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work centers', error: error.message });
  }
};

export const createWorkCenter = async (req: Request, res: Response) => {
  try {
    const {
      work_center_code, work_center_name, description, warehouse_id,
      capacity_per_day_hours, efficiency_factor, hourly_cost_rate
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO manufacturing.work_centers (
        work_center_code, work_center_name, description, warehouse_id,
        capacity_per_day_hours, efficiency_factor, hourly_cost_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [work_center_code, work_center_name, description, warehouse_id,
       capacity_per_day_hours, efficiency_factor, hourly_cost_rate]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating work center:', error);
    res.status(500).json({ success: false, message: 'Failed to create work center', error: error.message });
  }
};

// ============================================================================
// BILL OF MATERIALS (BOM)
// ============================================================================

export const getBOMs = async (req: Request, res: Response) => {
  try {
    const { item_id } = req.query;
    const params: any[] = [];
    let query = `
      SELECT b.*, i.item_code, i.item_name 
      FROM manufacturing.bill_of_materials b
      JOIN items i ON b.item_id = i.item_id
      WHERE 1=1
    `;
    
    if (item_id) {
      params.push(item_id);
      query += ` AND b.item_id = $${params.length}`;
    }
    
    query += ` ORDER BY b.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching BOMs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch BOMs', error: error.message });
  }
};

export const getBOMById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const bomResult = await pool.query(
      `SELECT b.*, i.item_code, i.item_name 
       FROM manufacturing.bill_of_materials b
       JOIN items i ON b.item_id = i.item_id
       WHERE b.bom_id = $1`,
      [id]
    );
    
    if (bomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }
    
    const componentsResult = await pool.query(
      `SELECT bc.*, i.item_code, i.item_name, u.uom_code
       FROM manufacturing.bom_components bc
       JOIN items i ON bc.item_id = i.item_id
       LEFT JOIN units_of_measure u ON bc.uom_id = u.uom_id
       WHERE bc.bom_id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        ...bomResult.rows[0],
        components: componentsResult.rows
      }
    });
  } catch (error: any) {
    console.error('Error fetching BOM details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch BOM details', error: error.message });
  }
};

export const createBOM = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { item_id, bom_code, version, description, components } = req.body;
    
    const bomResult = await client.query(
      `INSERT INTO manufacturing.bill_of_materials (
        item_id, bom_code, version, description, created_by
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [item_id, bom_code, version, description, req.user?.id || 1]
    );
    
    const bomId = bomResult.rows[0].bom_id;
    
    for (const comp of components) {
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
    console.error('Error creating BOM:', error);
    res.status(500).json({ success: false, message: 'Failed to create BOM', error: error.message });
  } finally {
    client.release();
  }
};

// ============================================================================
// PRODUCTION ORDERS
// ============================================================================

export const getProductionOrders = async (req: Request, res: Response) => {
  try {
    const { status, item_id } = req.query;
    const params: any[] = [];
    let query = `
      SELECT po.*, i.item_code, i.item_name, w.warehouse_name
      FROM manufacturing.production_orders po
      JOIN items i ON po.item_id = i.item_id
      LEFT JOIN warehouses w ON po.warehouse_id = w.warehouse_id
      WHERE 1=1
    `;
    
    if (status) {
      params.push(status);
      query += ` AND po.status = $${params.length}`;
    }
    
    if (item_id) {
      params.push(item_id);
      query += ` AND po.item_id = $${params.length}`;
    }
    
    query += ` ORDER BY po.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching production orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch production orders', error: error.message });
  }
};

export const createProductionOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      item_id, quantity_planned, start_date, due_date,
      warehouse_id, priority, notes, bom_id, routing_id
    } = req.body;
    
    // Generate Order Number
    const numResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 as next_num
       FROM manufacturing.production_orders WHERE order_number LIKE 'WO-%'`
    );
    const orderNumber = `WO-${String(numResult.rows[0].next_num).padStart(6, '0')}`;
    
    // Use default BOM/Routing if not provided
    let finalBomId = bom_id;
    if (!finalBomId) {
      const bomRes = await client.query(
        `SELECT bom_id FROM manufacturing.bill_of_materials WHERE item_id = $1 AND is_default = true LIMIT 1`,
        [item_id]
      );
      finalBomId = bomRes.rows[0]?.bom_id;
    }
    
    let finalRoutingId = routing_id;
    if (!finalRoutingId) {
      const routRes = await client.query(
        `SELECT routing_id FROM manufacturing.routings WHERE item_id = $1 AND is_default = true LIMIT 1`,
        [item_id]
      );
      finalRoutingId = routRes.rows[0]?.routing_id;
    }
    
    const result = await client.query(
      `INSERT INTO manufacturing.production_orders (
        order_number, item_id, bom_id, routing_id, warehouse_id,
        quantity_planned, start_date, due_date, priority, notes,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'planned', $11)
      RETURNING *`,
      [orderNumber, item_id, finalBomId, finalRoutingId, warehouse_id,
       quantity_planned, start_date, due_date, priority || 'medium', notes, req.user?.id || 1]
    );
    
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating production order:', error);
    res.status(500).json({ success: false, message: 'Failed to create production order', error: error.message });
  } finally {
    client.release();
  }
};

export const updateProductionOrderStatus = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status } = req.body; // released, in_progress, completed, cancelled
    
    const orderRes = await client.query(
      `SELECT * FROM manufacturing.production_orders WHERE production_order_id = $1`,
      [id]
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
      updateQuery += `, actual_end_date = NOW(), quantity_produced = quantity_planned`; // Simplified completion
      
      // TODO: Trigger inventory receipt for finished good
      // TODO: Trigger inventory issue for raw materials (backflush)
    }
    
    updateQuery += ` WHERE production_order_id = $${params.length + 1} RETURNING *`;
    params.push(id);
    
    const result = await client.query(updateQuery, params);
    
    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  } finally {
    client.release();
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Active Orders Count
    const activeOrders = await pool.query(
      `SELECT COUNT(*) as count FROM manufacturing.production_orders WHERE status IN ('released', 'in_progress')`
    );
    
    // 2. Work Center Utilization (Avg efficiency)
    const utilization = await pool.query(
      `SELECT AVG(efficiency_factor) * 100 as avg_efficiency FROM manufacturing.work_centers WHERE status = 'active'`
    );
    
    // 3. Orders by Status
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*) as count FROM manufacturing.production_orders GROUP BY status`
    );
    
    // 4. Upcoming Due Dates
    const upcoming = await pool.query(
      `SELECT order_number, due_date, status FROM manufacturing.production_orders 
       WHERE status NOT IN ('completed', 'cancelled') 
       ORDER BY due_date ASC LIMIT 5`
    );
    
    res.json({
      success: true,
      data: {
        active_orders: parseInt(activeOrders.rows[0].count),
        avg_efficiency: parseFloat(utilization.rows[0].avg_efficiency || 0).toFixed(1),
        status_breakdown: statusCounts.rows,
        upcoming_orders: upcoming.rows
      }
    });
  } catch (error: any) {
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
