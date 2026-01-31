/**
 * INVENTORY MANAGEMENT CONTROLLER
 * 
 * Handles all inventory operations:
 * - Item master data management
 * - Stock level tracking
 * - Stock movements (receipts, issues, transfers, adjustments)
 * - Inventory valuation (FIFO/LIFO/Weighted Average)
 * - Reorder suggestions
 * - Integration with Purchase and Sales modules
 */

import { Request, Response } from 'express';
import { pool } from '../config/database';
import { PoolClient } from 'pg';

// ============================================================================
// ITEM CATEGORIES
// ============================================================================

export const getItemCategories = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;
    
    let query = `
      SELECT 
        ic.*,
        pc.category_name as parent_category_name,
        (SELECT COUNT(*) FROM inventory.items WHERE category_id = ic.category_id AND is_active = true) as item_count
      FROM inventory.item_categories ic
      LEFT JOIN inventory.item_categories pc ON ic.parent_category_id = pc.category_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND ic.is_active = $${params.length}`;
    }
    
    query += ` ORDER BY ic.category_code`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching item categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createItemCategory = async (req: Request, res: Response) => {
  try {
    const {
      category_code,
      category_name,
      parent_category_id,
      description,
      is_active = true
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO item_categories (
        category_code, category_name, parent_category_id, description, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [category_code, category_name, parent_category_id, description, is_active, req.user?.id || 1]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Item category created successfully'
    });
  } catch (error) {
    console.error('Error creating item category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateItemCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      category_code,
      category_name,
      parent_category_id,
      description,
      is_active
    } = req.body;
    
    const result = await pool.query(
      `UPDATE item_categories 
      SET category_code = $1, category_name = $2, parent_category_id = $3,
          description = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP,
          updated_by = $6
      WHERE category_id = $7
      RETURNING *`,
      [category_code, category_name, parent_category_id, description, is_active, req.user?.id || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item category not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Item category updated successfully'
    });
  } catch (error) {
    console.error('Error updating item category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// WAREHOUSES
// ============================================================================

export const getWarehouses = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.query;
    
    let query = `
      SELECT 
        w.*,
        (SELECT COUNT(DISTINCT sl.item_id) FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.warehouse_id) as item_count,
        (SELECT SUM(sl.total_value) FROM inventory.stock_levels sl WHERE sl.warehouse_id = w.warehouse_id) as total_inventory_value
      FROM inventory.warehouses w
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND w.is_active = $${params.length}`;
    }
    
    query += ` ORDER BY w.warehouse_code`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const {
      warehouse_code,
      warehouse_name,
      warehouse_type,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      phone,
      email,
      manager_name,
      is_active = true
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO warehouses (
        warehouse_code, warehouse_name, warehouse_type, address_line1, address_line2,
        city, state_province, postal_code, country, phone, email, manager_name,
        is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [warehouse_code, warehouse_name, warehouse_type, address_line1, address_line2,
       city, state_province, postal_code, country, phone, email, manager_name,
       is_active, req.user?.id || 1]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Warehouse created successfully'
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    const result = await pool.query(
      `UPDATE warehouses 
      SET warehouse_code = $1, warehouse_name = $2, warehouse_type = $3,
          address_line1 = $4, address_line2 = $5, city = $6,
          state_province = $7, postal_code = $8, country = $9,
          phone = $10, email = $11, manager_name = $12, is_active = $13,
          updated_at = CURRENT_TIMESTAMP, updated_by = $14
      WHERE warehouse_id = $15
      RETURNING *`,
      [updateFields.warehouse_code, updateFields.warehouse_name, updateFields.warehouse_type,
       updateFields.address_line1, updateFields.address_line2, updateFields.city,
       updateFields.state_province, updateFields.postal_code, updateFields.country,
       updateFields.phone, updateFields.email, updateFields.manager_name, updateFields.is_active,
       req.user?.id || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Warehouse updated successfully'
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// ITEMS (Master Data)
// ============================================================================

export const getItems = async (req: Request, res: Response) => {
  try {
    const { is_active, search } = req.query;
    
    let query = `
      SELECT 
        item_id,
        item_code,
        item_name,
        description,
        unit_of_measure,
        reorder_level,
        reorder_quantity,
        is_active,
        created_at,
        updated_at
      FROM inventory_items
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (item_code ILIKE $${params.length} OR item_name ILIKE $${params.length})`;
    }
    
    query += ` ORDER BY item_code`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        i.*,
        ic.category_name,
        u.uom_code,
        u.uom_name
      FROM inventory.items i
      LEFT JOIN inventory.item_categories ic ON i.category_id = ic.category_id
      LEFT JOIN units_of_measure u ON i.base_uom_id = u.uom_id
      WHERE i.item_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createItem = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      item_code,
      item_name,
      description,
      category_id,
      item_type,
      base_uom_id,
      valuation_method = 'Weighted Average',
      standard_cost = 0,
      reorder_level = 0,
      reorder_quantity = 0,
      minimum_stock_level = 0,
      maximum_stock_level = 0,
      lead_time_days = 0,
      inventory_account_id,
      cogs_account_id,
      sales_account_id,
      barcode,
      sku,
      is_active = true,
      is_purchasable = true,
      is_saleable = true
    } = req.body;
    
    // Create item
    const itemResult = await client.query(
      `INSERT INTO items (
        item_code, item_name, description, category_id, item_type, base_uom_id,
        valuation_method, standard_cost, reorder_level, reorder_quantity,
        minimum_stock_level, maximum_stock_level, lead_time_days,
        inventory_account_id, cogs_account_id, sales_account_id,
        barcode, sku, is_active, is_purchasable, is_saleable, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [item_code, item_name, description, category_id, item_type, base_uom_id,
       valuation_method, standard_cost, reorder_level, reorder_quantity,
       minimum_stock_level, maximum_stock_level, lead_time_days,
       inventory_account_id, cogs_account_id, sales_account_id,
       barcode, sku, is_active, is_purchasable, is_saleable, req.user?.id || 1]
    );
    
    const item = itemResult.rows[0];
    
    // Create stock levels for all active warehouses
    const warehousesResult = await client.query(
      `SELECT warehouse_id FROM inventory.warehouses WHERE is_active = true`
    );
    
    for (const warehouse of warehousesResult.rows) {
      await client.query(
        `INSERT INTO stock_levels (item_id, warehouse_id, on_hand_quantity, available_quantity)
        VALUES ($1, $2, 0, 0)`,
        [item.item_id, warehouse.warehouse_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    const result = await pool.query(
      `UPDATE items 
      SET item_code = $1, item_name = $2, description = $3, category_id = $4,
          item_type = $5, base_uom_id = $6, valuation_method = $7,
          standard_cost = $8, reorder_level = $9, reorder_quantity = $10,
          minimum_stock_level = $11, maximum_stock_level = $12, lead_time_days = $13,
          inventory_account_id = $14, cogs_account_id = $15, sales_account_id = $16,
          barcode = $17, sku = $18, is_active = $19, is_purchasable = $20,
          is_saleable = $21, updated_at = CURRENT_TIMESTAMP, updated_by = $22
      WHERE item_id = $23
      RETURNING *`,
      [updateFields.item_code, updateFields.item_name, updateFields.description, updateFields.category_id,
       updateFields.item_type, updateFields.base_uom_id, updateFields.valuation_method,
       updateFields.standard_cost, updateFields.reorder_level, updateFields.reorder_quantity,
       updateFields.minimum_stock_level, updateFields.maximum_stock_level, updateFields.lead_time_days,
       updateFields.inventory_account_id, updateFields.cogs_account_id, updateFields.sales_account_id,
       updateFields.barcode, updateFields.sku, updateFields.is_active, updateFields.is_purchasable,
       updateFields.is_saleable, req.user?.id || 1, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// STOCK LEVELS
// ============================================================================

export const getStockLevels = async (req: Request, res: Response) => {
  try {
    const { item_id, warehouse_id } = req.query;

    const params: any[] = [];
    let query = `
      SELECT 
        sl.stock_level_id,
        sl.item_id,
        i.item_code,
        i.item_name,
        i.valuation_method,
        sl.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        sl.on_hand_quantity,
        sl.allocated_quantity,
        sl.available_quantity,
        sl.on_order_quantity,
        sl.average_cost,
        sl.total_value,
        i.reorder_level,
        i.reorder_quantity,
        CASE 
          WHEN sl.available_quantity <= 0 THEN 'OUT_OF_STOCK'
          WHEN sl.available_quantity <= i.reorder_level THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END AS stock_status
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      WHERE 1=1
    `;

    if (item_id) {
      params.push(item_id);
      query += ` AND sl.item_id = $${params.length}`;
    }

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND sl.warehouse_id = $${params.length}`;
    }

    query += ' ORDER BY i.item_code, w.warehouse_code';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock levels',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getStockByItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        sl.stock_level_id,
        sl.item_id,
        i.item_code,
        i.item_name,
        i.valuation_method,
        sl.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        sl.on_hand_quantity,
        sl.available_quantity,
        sl.allocated_quantity,
        sl.average_cost,
        sl.total_value,
        i.reorder_level,
        i.reorder_quantity
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      WHERE sl.item_id = $1
      ORDER BY w.warehouse_code`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock by item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock by item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const { item_id, warehouse_id, movement_type, start_date, end_date } = req.query;

    const params: any[] = [];
    let query = `
      SELECT 
        sm.*, 
        i.item_code,
        i.item_name,
        fw.warehouse_code AS from_warehouse_code,
        fw.warehouse_name AS from_warehouse_name,
        tw.warehouse_code AS to_warehouse_code,
        tw.warehouse_name AS to_warehouse_name
      FROM stock_movements sm
      LEFT JOIN items i ON sm.item_id = i.item_id
      LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.warehouse_id
      LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.warehouse_id
      WHERE 1=1
    `;

    if (item_id) {
      params.push(item_id);
      query += ` AND sm.item_id = $${params.length}`;
    }

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND (sm.from_warehouse_id = $${params.length} OR sm.to_warehouse_id = $${params.length})`;
    }

    if (movement_type) {
      params.push(movement_type);
      query += ` AND sm.movement_type = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND sm.movement_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND sm.movement_date <= $${params.length}`;
    }

    query += ' ORDER BY sm.movement_date DESC, sm.movement_id DESC LIMIT 1000';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock movements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createStockMovement = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      movement_type,
      item_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity,
      uom_id,
      unit_cost = 0,
      reference_type,
      reference_id,
      reference_number,
      batch_number,
      serial_number,
      expiry_date,
      reason,
      notes
    } = req.body;

    const normalizedType = movement_type as string;

    if (normalizedType === 'Transfer' && (!from_warehouse_id || !to_warehouse_id)) {
      throw new Error('Transfer requires both from_warehouse_id and to_warehouse_id');
    }

    if (normalizedType === 'Receipt' && !to_warehouse_id) {
      throw new Error('Receipt requires to_warehouse_id');
    }

    if (normalizedType === 'Issue' && !from_warehouse_id) {
      throw new Error('Issue requires from_warehouse_id');
    }

    const movement_number = await generateNumber(client, 'stock_movements', 'movement_number', 'SM-');
    const movementDate = new Date();

    const fromWarehouse = normalizedType === 'Issue' || normalizedType === 'Transfer' ? from_warehouse_id : null;
    const toWarehouse = normalizedType === 'Receipt' || normalizedType === 'Transfer' ? to_warehouse_id : null;

    const movementResult = await client.query(
      `INSERT INTO stock_movements (
        movement_number, movement_date, movement_type, item_id,
        from_warehouse_id, to_warehouse_id, quantity, uom_id,
        unit_cost, total_value, reference_type, reference_id, reference_number,
        batch_number, serial_number, expiry_date, reason, notes, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, 'Draft', $19
      ) RETURNING *`,
      [movement_number, movementDate, normalizedType, item_id,
       fromWarehouse, toWarehouse,
       quantity, uom_id, unit_cost, quantity * unit_cost,
       reference_type, reference_id, reference_number,
       batch_number, serial_number, expiry_date, reason, notes, req.user?.id || 1]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: movementResult.rows[0],
      message: 'Stock movement created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stock movement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock movement',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

export const postStockMovement = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const movementResult = await client.query(
      `SELECT sm.*, i.valuation_method, i.standard_cost, i.average_cost
       FROM stock_movements sm
       JOIN items i ON sm.item_id = i.item_id
       WHERE sm.movement_id = $1 AND sm.status = 'Draft'`,
      [id]
    );

    if (movementResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Stock movement not found or already posted' });
    }

    const movement = movementResult.rows[0];
    const quantity = parseFloat(movement.quantity);

    let appliedUnitCost = movement.unit_cost || 0;
    let appliedTotal = movement.total_value || 0;

    if (movement.movement_type === 'Issue' || movement.movement_type === 'Transfer') {
      const cost = await calculateIssueCost(client, movement.item_id, movement.from_warehouse_id, Math.abs(quantity), movement.valuation_method, movement.standard_cost, movement.average_cost);
      appliedUnitCost = cost.unitCost;
      appliedTotal = cost.totalCost;
    }

    if (movement.movement_type === 'Receipt') {
      await applyReceipt(client, movement, quantity, appliedUnitCost);
    } else if (movement.movement_type === 'Issue') {
      await applyIssue(client, movement, -Math.abs(quantity), appliedUnitCost);
    } else if (movement.movement_type === 'Transfer') {
      await applyIssue(client, movement, -Math.abs(quantity), appliedUnitCost);
      await applyReceipt(client, { ...movement, to_warehouse_id: movement.to_warehouse_id, from_warehouse_id: movement.from_warehouse_id }, Math.abs(quantity), appliedUnitCost);
    } else if (movement.movement_type === 'Adjustment') {
      if (quantity >= 0) {
        await applyReceipt(client, movement, quantity, appliedUnitCost);
      } else {
        const cost = appliedUnitCost || movement.average_cost || movement.standard_cost || 0;
        await applyIssue(client, movement, quantity, cost);
      }
    }

    if (!appliedTotal) {
      appliedTotal = Math.abs(quantity) * appliedUnitCost;
    }

    await client.query(
      `UPDATE stock_movements
       SET status = 'Posted', posting_date = CURRENT_DATE, unit_cost = $1, total_value = $2, updated_at = CURRENT_TIMESTAMP
       WHERE movement_id = $3`,
      [appliedUnitCost, appliedTotal || quantity * appliedUnitCost, id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Stock movement posted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error posting stock movement:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock movement', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// STOCK ADJUSTMENTS
// ============================================================================

export const getStockAdjustments = async (req: Request, res: Response) => {
  try {
    const { warehouse_id, status } = req.query;

    const params: any[] = [];
    let query = `
      SELECT sa.*, w.warehouse_code, w.warehouse_name,
        (SELECT COUNT(*) FROM stock_adjustment_lines WHERE adjustment_id = sa.adjustment_id) AS line_count
      FROM stock_adjustments sa
      JOIN warehouses w ON sa.warehouse_id = w.warehouse_id
      WHERE 1=1
    `;

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND sa.warehouse_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND sa.status = $${params.length}`;
    }

    query += ' ORDER BY sa.adjustment_date DESC, sa.adjustment_number DESC';

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock adjustments', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getStockAdjustmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const headerResult = await pool.query(
      `SELECT sa.*, w.warehouse_code, w.warehouse_name
       FROM stock_adjustments sa
       JOIN warehouses w ON sa.warehouse_id = w.warehouse_id
       WHERE sa.adjustment_id = $1`,
      [id]
    );

    if (headerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock adjustment not found' });
    }

    const linesResult = await pool.query(
      `SELECT sal.*, i.item_code, i.item_name, u.uom_code
       FROM stock_adjustment_lines sal
       JOIN items i ON sal.item_id = i.item_id
       LEFT JOIN units_of_measure u ON sal.uom_id = u.uom_id
       WHERE sal.adjustment_id = $1
       ORDER BY sal.line_number`,
      [id]
    );

    res.json({ success: true, data: { header: headerResult.rows[0], lines: linesResult.rows } });
  } catch (error) {
    console.error('Error fetching stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock adjustment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createStockAdjustment = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { adjustment_date, adjustment_type, warehouse_id, reason, notes, lines } = req.body;

    const adjustment_number = await generateNumber(client, 'stock_adjustments', 'adjustment_number', 'ADJ-');

    const headerResult = await client.query(
      `INSERT INTO stock_adjustments (
        adjustment_number, adjustment_date, adjustment_type, warehouse_id,
        reason, notes, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Draft', $7)
      RETURNING *`,
      [adjustment_number, adjustment_date, adjustment_type, warehouse_id, reason, notes, req.user?.id || 1]
    );

    const adjustment = headerResult.rows[0];
    let total_adjustment_value = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const adjustment_value = line.adjustment_quantity * line.unit_cost;
      total_adjustment_value += adjustment_value;

      await client.query(
        `INSERT INTO stock_adjustment_lines (
          adjustment_id, line_number, item_id, system_quantity, counted_quantity,
          adjustment_quantity, uom_id, unit_cost, adjustment_value, reason, notes, batch_number, serial_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [adjustment.adjustment_id, i + 1, line.item_id, line.system_quantity,
         line.counted_quantity, line.adjustment_quantity, line.uom_id,
         line.unit_cost, adjustment_value, line.reason, line.notes, line.batch_number, line.serial_number]
      );
    }

    await client.query(
      `UPDATE stock_adjustments SET total_adjustment_value = $1 WHERE adjustment_id = $2`,
      [total_adjustment_value, adjustment.adjustment_id]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: adjustment, message: 'Stock adjustment created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock adjustment', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const postStockAdjustment = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const headerResult = await client.query(
      `SELECT * FROM stock_adjustments WHERE adjustment_id = $1 AND status = 'Draft'`,
      [id]
    );

    if (headerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Stock adjustment not found or already posted' });
    }

    const adjustment = headerResult.rows[0];
    const linesResult = await client.query(
      `SELECT * FROM stock_adjustment_lines WHERE adjustment_id = $1 ORDER BY line_number`,
      [id]
    );

    for (const line of linesResult.rows) {
      const movement_number = await generateNumber(client, 'stock_movements', 'movement_number', 'SM-');
      const quantity = parseFloat(line.adjustment_quantity);

      await client.query(
        `INSERT INTO stock_movements (
          movement_number, movement_date, movement_type, item_id, from_warehouse_id, to_warehouse_id,
          quantity, uom_id, unit_cost, total_value, reference_type, reference_id, reference_number,
          batch_number, serial_number, status, posting_date, created_by
        ) VALUES (
          $1, $2, 'Adjustment', $3, $4, $4,
          $5, $6, $7, $8, 'Adjustment', $9, $10,
          $11, $12, 'Posted', CURRENT_DATE, $13
        )`,
        [movement_number, adjustment.adjustment_date, line.item_id, adjustment.warehouse_id,
         quantity, line.uom_id, line.unit_cost, quantity * line.unit_cost,
         adjustment.adjustment_id, adjustment.adjustment_number, line.batch_number, line.serial_number, req.user?.id || 1]
      );

      if (quantity >= 0) {
        await applyReceipt(client, { ...adjustment, to_warehouse_id: adjustment.warehouse_id, item_id: line.item_id, batch_number: line.batch_number, serial_number: line.serial_number }, quantity, line.unit_cost);
      } else {
        await applyIssue(client, { ...adjustment, from_warehouse_id: adjustment.warehouse_id, item_id: line.item_id, batch_number: line.batch_number, serial_number: line.serial_number }, quantity, line.unit_cost);
      }
    }

    await client.query(
      `UPDATE stock_adjustments 
       SET status = 'Posted', posting_date = CURRENT_DATE, approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE adjustment_id = $2`,
      [req.user?.id || 1, id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Stock adjustment posted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error posting stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock adjustment', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// REORDER SUGGESTIONS
// ============================================================================

export const getReorderSuggestions = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const params: any[] = [];
    let query = `
      SELECT rs.*, i.item_code, i.item_name, w.warehouse_code, w.warehouse_name
      FROM reorder_suggestions rs
      JOIN items i ON rs.item_id = i.item_id
      JOIN warehouses w ON rs.warehouse_id = w.warehouse_id
      WHERE 1=1
    `;

    if (status) {
      params.push(status);
      query += ` AND rs.status = $${params.length}`;
    }

    query += ' ORDER BY rs.generated_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reorder suggestions', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const generateReorderSuggestions = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { autoCreateRequisition = false } = req.body || {};

    await client.query(`DELETE FROM reorder_suggestions WHERE status = 'Pending'`);

    const suggestions = await client.query(
      `INSERT INTO reorder_suggestions (
        item_id, warehouse_id, current_available, reorder_level, suggested_quantity, priority
      )
      SELECT 
        sl.item_id,
        sl.warehouse_id,
        sl.available_quantity,
        i.reorder_level,
        CASE WHEN sl.available_quantity <= 0 THEN COALESCE(NULLIF(i.reorder_quantity, 0), 1) * 2 ELSE COALESCE(NULLIF(i.reorder_quantity, 0), 1) END AS suggested_quantity,
        CASE 
          WHEN sl.available_quantity <= 0 THEN 'High'
          WHEN sl.available_quantity <= i.reorder_level THEN 'Medium'
          ELSE 'Low'
        END AS priority
      FROM stock_levels sl
      JOIN items i ON sl.item_id = i.item_id
      JOIN warehouses w ON sl.warehouse_id = w.warehouse_id
      WHERE sl.available_quantity <= i.reorder_level
      RETURNING *`
    );

    let requisitionNumber: string | null = null;
    let requisitionId: number | null = null;

    if (autoCreateRequisition && suggestions.rows.length > 0) {
      requisitionNumber = await generateNumber(client, 'purchase_requisitions', 'requisition_number', 'REQ-');
      const requisition = await client.query(
        `INSERT INTO purchase_requisitions (
          requisition_number, requested_by, department, request_date, required_date, priority, status, notes
        ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'High', 'SUBMITTED', $4) RETURNING *`,
        [requisitionNumber, req.user?.email || 'system', 'Inventory', 'Auto-generated from reorder suggestions']
      );

      requisitionId = requisition.rows[0].id;

      for (let i = 0; i < suggestions.rows.length; i++) {
        const s = suggestions.rows[i];
        const item = await client.query('SELECT item_name, item_code, standard_cost, average_cost FROM items WHERE item_id = $1', [s.item_id]);
        const unitPrice = item.rows[0]?.standard_cost ?? item.rows[0]?.average_cost ?? 0;
        await client.query(
          `INSERT INTO purchase_requisition_lines (
            requisition_id, line_number, item_description, quantity, unit_of_measure, estimated_unit_price, estimated_total, justification
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [requisitionId, i + 1, `${item.rows[0]?.item_code || ''} - ${item.rows[0]?.item_name || 'Item'}`.trim(), s.suggested_quantity, 'EA', unitPrice, unitPrice * s.suggested_quantity, 'Auto reorder']
        );
      }

      await client.query(
        `UPDATE reorder_suggestions SET purchase_requisition_id = $1, status = 'Converted' WHERE status = 'Pending'`,
        [requisitionId]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: suggestions.rows,
      requisitionNumber,
      requisitionId,
      message: `Generated ${suggestions.rows.length} reorder suggestions${requisitionNumber ? ' and requisition ' + requisitionNumber : ''}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating reorder suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reorder suggestions', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// STOCK TAKES & RECONCILIATION
// ============================================================================

export const getStockTakes = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT st.*, w.warehouse_code, w.warehouse_name, COUNT(stl.stock_take_line_id) AS line_count
       FROM stock_takes st
       JOIN warehouses w ON st.warehouse_id = w.warehouse_id
       LEFT JOIN stock_take_lines stl ON st.stock_take_id = stl.stock_take_id
       GROUP BY st.stock_take_id, w.warehouse_code, w.warehouse_name
       ORDER BY st.created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock takes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock takes', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createStockTake = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { warehouse_id, scheduled_date, notes, lines = [] } = req.body;

    const take_number = await generateNumber(client, 'stock_takes', 'take_number', 'STK-');

    const header = await client.query(
      `INSERT INTO stock_takes (take_number, warehouse_id, scheduled_date, status, notes, created_by)
       VALUES ($1, $2, $3, 'Draft', $4, $5) RETURNING *`,
      [take_number, warehouse_id, scheduled_date, notes, req.user?.id || 1]
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const systemQuantityResult = await client.query(
        `SELECT on_hand_quantity, average_cost FROM stock_levels WHERE item_id = $1 AND warehouse_id = $2`,
        [line.item_id, warehouse_id]
      );
      const systemQty = systemQuantityResult.rows[0]?.on_hand_quantity || 0;
      const avgCost = systemQuantityResult.rows[0]?.average_cost || 0;
      const variance = parseFloat(line.counted_quantity) - parseFloat(systemQty);
      await client.query(
        `INSERT INTO stock_take_lines (
          stock_take_id, line_number, item_id, batch_number, serial_number,
          system_quantity, counted_quantity, variance_quantity, unit_cost, variance_value, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Draft')`,
        [header.rows[0].stock_take_id, i + 1, line.item_id, line.batch_number, line.serial_number,
         systemQty, line.counted_quantity, variance, avgCost, variance * avgCost]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: header.rows[0], message: 'Stock take created' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stock take:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock take', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const postStockTake = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const header = await client.query('SELECT * FROM stock_takes WHERE stock_take_id = $1', [id]);
    if (header.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Stock take not found' });
    }

    const lines = await client.query('SELECT * FROM stock_take_lines WHERE stock_take_id = $1 ORDER BY line_number', [id]);

    for (const line of lines.rows) {
      if (parseFloat(line.variance_quantity) === 0) continue;
      const movement_number = await generateNumber(client, 'stock_movements', 'movement_number', 'SM-');
      const qty = parseFloat(line.variance_quantity);
      const unitCost = line.unit_cost || 0;

      await client.query(
        `INSERT INTO stock_movements (
          movement_number, movement_date, movement_type, item_id, from_warehouse_id, to_warehouse_id,
          quantity, uom_id, unit_cost, total_value, reference_type, reference_id, reference_number,
          batch_number, serial_number, status, posting_date, created_by
        ) VALUES (
          $1, CURRENT_TIMESTAMP, 'Adjustment', $2, $3, $3,
          $4, NULL, $5, $6, 'Stock Take', $7, $8,
          $9, $10, 'Posted', CURRENT_DATE, $11
        )`,
        [movement_number, line.item_id, header.rows[0].warehouse_id, qty, unitCost, qty * unitCost, header.rows[0].stock_take_id, header.rows[0].take_number, line.batch_number, line.serial_number, req.user?.id || 1]
      );

      if (qty >= 0) {
        await applyReceipt(client, { ...header.rows[0], to_warehouse_id: header.rows[0].warehouse_id, item_id: line.item_id, batch_number: line.batch_number, serial_number: line.serial_number }, qty, unitCost);
      } else {
        await applyIssue(client, { ...header.rows[0], from_warehouse_id: header.rows[0].warehouse_id, item_id: line.item_id, batch_number: line.batch_number, serial_number: line.serial_number }, qty, unitCost);
      }
    }

    await client.query("UPDATE stock_takes SET status = 'Posted', posted_at = CURRENT_TIMESTAMP WHERE stock_take_id = $1", [id]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Stock take variances posted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error posting stock take:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock take', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// BATCHES & SERIALS
// ============================================================================

export const getStockBatches = async (req: Request, res: Response) => {
  try {
    const { item_id, warehouse_id, expiring_within_days } = req.query;
    const params: any[] = [];
    let query = `SELECT sb.*, i.item_code, i.item_name, w.warehouse_code, w.warehouse_name
                 FROM stock_batches sb
                 JOIN items i ON sb.item_id = i.item_id
                 JOIN warehouses w ON sb.warehouse_id = w.warehouse_id
                 WHERE 1=1`;

    if (item_id) {
      params.push(item_id);
      query += ` AND sb.item_id = $${params.length}`;
    }

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND sb.warehouse_id = $${params.length}`;
    }

    if (expiring_within_days) {
      params.push(expiring_within_days);
      query += ` AND sb.expiry_date IS NOT NULL AND sb.expiry_date <= CURRENT_DATE + ($${params.length}::INT * INTERVAL '1 day')`;
    }

    query += ' ORDER BY sb.expiry_date NULLS LAST, sb.batch_number';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock batches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock batches', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getSerialNumbers = async (req: Request, res: Response) => {
  try {
    const { item_id, warehouse_id, status } = req.query;
    const params: any[] = [];
    let query = `SELECT ssn.*, i.item_code, i.item_name, w.warehouse_code, w.warehouse_name
                 FROM stock_serial_numbers ssn
                 JOIN items i ON ssn.item_id = i.item_id
                 JOIN warehouses w ON ssn.warehouse_id = w.warehouse_id
                 WHERE 1=1`;

    if (item_id) {
      params.push(item_id);
      query += ` AND ssn.item_id = $${params.length}`;
    }

    if (warehouse_id) {
      params.push(warehouse_id);
      query += ` AND ssn.warehouse_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND ssn.status = $${params.length}`;
    }

    query += ' ORDER BY ssn.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch serial numbers', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// DASHBOARD & REPORTS
// ============================================================================

export const getInventoryDashboard = async (_req: Request, res: Response) => {
  try {
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT i.item_id) as total_items,
        COUNT(DISTINCT CASE WHEN i.is_active = true THEN i.item_id END) as active_items,
        SUM(sl.on_hand_quantity) as total_on_hand,
        SUM(sl.total_value) as total_inventory_value,
        COUNT(DISTINCT CASE WHEN sl.available_quantity <= 0 THEN i.item_id END) as out_of_stock_items
      FROM items i
      LEFT JOIN stock_levels sl ON i.item_id = sl.item_id
    `);

    const reorderResult = await pool.query(`SELECT COUNT(*) as reorder_count FROM reorder_suggestions WHERE status = 'Pending'`);

    const categoryResult = await pool.query(`
      SELECT 
        ic.category_name,
        COUNT(DISTINCT i.item_id) as item_count,
        SUM(sl.total_value) as category_value
      FROM items i
      LEFT JOIN item_categories ic ON i.category_id = ic.category_id
      LEFT JOIN stock_levels sl ON i.item_id = sl.item_id
      WHERE i.is_active = true
      GROUP BY ic.category_id, ic.category_name
      ORDER BY category_value DESC
    `);

    const warehouseResult = await pool.query(`
      SELECT 
        w.warehouse_code,
        w.warehouse_name,
        COUNT(DISTINCT sl.item_id) as item_count,
        SUM(sl.total_value) as warehouse_value
      FROM warehouses w
      LEFT JOIN stock_levels sl ON w.warehouse_id = sl.warehouse_id
      WHERE w.is_active = true
      GROUP BY w.warehouse_id, w.warehouse_code, w.warehouse_name
      ORDER BY warehouse_value DESC
    `);

    const movementsResult = await pool.query(`
      SELECT sm.*, i.item_code, i.item_name
      FROM stock_movements sm
      LEFT JOIN items i ON sm.item_id = i.item_id
      ORDER BY sm.movement_date DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        reorderRequired: reorderResult.rows[0].reorder_count,
        byCategory: categoryResult.rows,
        byWarehouse: warehouseResult.rows,
        recentMovements: movementsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory dashboard', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function generateNumber(client: PoolClient, table: string, column: string, prefix: string): Promise<string> {
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(${column} FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_number
     FROM ${table} WHERE ${column} LIKE $1`,
    [`${prefix}%`]
  );

  return `${prefix}${String(result.rows[0].next_number).padStart(6, '0')}`;
}

async function updateStockLevel(
  client: PoolClient,
  itemId: number,
  warehouseId: number,
  quantityDelta: number,
  unitCost: number
) {
  await ensureStockLevel(client, itemId, warehouseId);

  const current = await client.query(
    'SELECT * FROM stock_levels WHERE item_id = $1 AND warehouse_id = $2',
    [itemId, warehouseId]
  );

  const row = current.rows[0];
  const onHand = parseFloat(row.on_hand_quantity) + quantityDelta;
  const totalValue = parseFloat(row.total_value) + quantityDelta * unitCost;
  const averageCost = onHand !== 0 ? totalValue / onHand : unitCost;
  const available = onHand - parseFloat(row.allocated_quantity || 0);

  await client.query(
    `UPDATE stock_levels 
     SET on_hand_quantity = $1,
         available_quantity = $2,
         total_value = $3,
         average_cost = $4,
         last_receipt_date = CASE WHEN $5 > 0 THEN CURRENT_TIMESTAMP ELSE last_receipt_date END,
         last_issue_date = CASE WHEN $5 < 0 THEN CURRENT_TIMESTAMP ELSE last_issue_date END,
         updated_at = CURRENT_TIMESTAMP
     WHERE stock_level_id = $6`,
    [onHand, available, totalValue, averageCost, quantityDelta, row.stock_level_id]
  );
}

async function ensureStockLevel(client: PoolClient, itemId: number, warehouseId: number) {
  await client.query(
    `INSERT INTO stock_levels (item_id, warehouse_id, on_hand_quantity, allocated_quantity, available_quantity, on_order_quantity, total_value, average_cost)
     VALUES ($1, $2, 0, 0, 0, 0, 0, 0)
     ON CONFLICT (item_id, warehouse_id) DO NOTHING`,
    [itemId, warehouseId]
  );
}

async function addCostLayer(client: PoolClient, movementId: number, itemId: number, warehouseId: number, quantity: number, unitCost: number) {
  if (quantity <= 0) return;
  await client.query(
    `INSERT INTO inventory_valuation_layers (
      item_id, warehouse_id, receipt_date, receipt_reference, quantity_received, quantity_remaining, unit_cost, movement_id
    ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7)`,
    [itemId, warehouseId, `MV-${movementId}`, quantity, quantity, unitCost, movementId]
  );
}

async function consumeCostLayers(
  client: PoolClient,
  itemId: number,
  warehouseId: number,
  quantity: number,
  method: 'FIFO' | 'LIFO'
): Promise<{ totalCost: number; unitCost: number; consumedQty: number }> {
  const order = method === 'LIFO' ? 'DESC' : 'ASC';
  let remaining = quantity;
  let totalCost = 0;

  const layers = await client.query(
    `SELECT * FROM inventory_valuation_layers
     WHERE item_id = $1 AND warehouse_id = $2 AND quantity_remaining > 0
     ORDER BY receipt_date ${order}, layer_id ${order}`,
    [itemId, warehouseId]
  );

  for (const layer of layers.rows) {
    if (remaining <= 0) break;
    const takeQty = Math.min(remaining, parseFloat(layer.quantity_remaining));
    totalCost += takeQty * parseFloat(layer.unit_cost);
    remaining -= takeQty;

    await client.query(
      `UPDATE inventory_valuation_layers SET quantity_remaining = quantity_remaining - $1, updated_at = CURRENT_TIMESTAMP WHERE layer_id = $2`,
      [takeQty, layer.layer_id]
    );
  }

  const effectiveQty = quantity - remaining;
  const unitCost = effectiveQty > 0 ? totalCost / effectiveQty : 0;
  return { totalCost, unitCost, consumedQty: effectiveQty };
}

async function calculateIssueCost(
  client: PoolClient,
  itemId: number,
  warehouseId: number,
  quantity: number,
  valuationMethod: string,
  standardCost?: number,
  averageCost?: number
): Promise<{ totalCost: number; unitCost: number }> {
  const method = (valuationMethod as 'FIFO' | 'LIFO' | 'Weighted Average' | 'Standard Cost') || 'Weighted Average';

  if (method === 'FIFO' || method === 'LIFO') {
    const layerCost = await consumeCostLayers(client, itemId, warehouseId, quantity, method);
    if (layerCost.consumedQty >= quantity) {
      return { totalCost: layerCost.totalCost, unitCost: layerCost.unitCost };
    }
    const remainingQty = quantity - layerCost.consumedQty;
    const fallbackLevel = await client.query(
      'SELECT average_cost FROM stock_levels WHERE item_id = $1 AND warehouse_id = $2',
      [itemId, warehouseId]
    );
    const fallbackCost = fallbackLevel.rows[0]?.average_cost || averageCost || standardCost || 0;
    const totalCost = layerCost.totalCost + remainingQty * fallbackCost;
    const unitCost = quantity > 0 ? totalCost / quantity : fallbackCost;
    return { totalCost, unitCost };
  }

  if (method === 'Standard Cost') {
    const cost = standardCost || 0;
    return { totalCost: quantity * cost, unitCost: cost };
  }

  const level = await client.query(
    'SELECT average_cost FROM stock_levels WHERE item_id = $1 AND warehouse_id = $2',
    [itemId, warehouseId]
  );
  const cost = level.rows[0]?.average_cost || averageCost || standardCost || 0;
  return { totalCost: quantity * cost, unitCost: cost };
}

async function applyReceipt(client: PoolClient, movement: any, quantity: number, unitCost: number) {
  await updateStockLevel(client, movement.item_id, movement.to_warehouse_id, quantity, unitCost);
  await addCostLayer(client, movement.movement_id || movement.stock_take_id || movement.adjustment_id || 0, movement.item_id, movement.to_warehouse_id, quantity, unitCost);

  if (movement.batch_number) {
    await client.query(
      `INSERT INTO stock_batches (item_id, warehouse_id, batch_number, quantity_on_hand, quantity_available, unit_cost, expiry_date, status)
       VALUES ($1, $2, $3, $4, $4, $5, $6, 'active')
       ON CONFLICT (item_id, warehouse_id, batch_number)
       DO UPDATE SET quantity_on_hand = stock_batches.quantity_on_hand + EXCLUDED.quantity_on_hand,
                     quantity_available = stock_batches.quantity_available + EXCLUDED.quantity_available,
                     unit_cost = EXCLUDED.unit_cost,
                     expiry_date = COALESCE(EXCLUDED.expiry_date, stock_batches.expiry_date),
                     updated_at = CURRENT_TIMESTAMP`,
      [movement.item_id, movement.to_warehouse_id, movement.batch_number, quantity, unitCost, movement.expiry_date]
    );
  }

  if (movement.serial_number) {
    await client.query(
      `INSERT INTO stock_serial_numbers (serial_number, item_id, warehouse_id, batch_id, status, expiry_date)
       VALUES ($1, $2, $3, (SELECT batch_id FROM stock_batches WHERE item_id = $2 AND warehouse_id = $3 AND batch_number = $4 LIMIT 1), 'in_stock', $5)
       ON CONFLICT (serial_number) DO UPDATE SET warehouse_id = EXCLUDED.warehouse_id, status = 'in_stock', updated_at = CURRENT_TIMESTAMP`,
      [movement.serial_number, movement.item_id, movement.to_warehouse_id, movement.batch_number || null, movement.expiry_date]
    );
  }
}

async function applyIssue(client: PoolClient, movement: any, quantity: number, unitCost: number) {
  await updateStockLevel(client, movement.item_id, movement.from_warehouse_id, quantity, unitCost);

  if (movement.batch_number) {
    await client.query(
      `UPDATE stock_batches
       SET quantity_on_hand = quantity_on_hand + $1,
           quantity_available = quantity_available + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE item_id = $2 AND warehouse_id = $3 AND batch_number = $4`,
      [quantity, movement.item_id, movement.from_warehouse_id, movement.batch_number]
    );
  }

  if (movement.serial_number) {
    await client.query(
      `UPDATE stock_serial_numbers SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE serial_number = $1`,
      [movement.serial_number]
    );
  }
}
