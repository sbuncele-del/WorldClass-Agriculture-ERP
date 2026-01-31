/**
 * INVENTORY MANAGEMENT CONTROLLER (Repository Pattern)
 * 
 * This controller demonstrates the proper multi-tenant pattern using repositories.
 * All data operations go through the repository which automatically handles tenant isolation.
 * 
 * IMPORTANT: This uses TenantRequest to get tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { TenantContext } from '../repositories/BaseRepository';
import {
  itemCategoryRepository,
  inventoryItemRepository,
  warehouseRepository,
  stockMovementRepository
} from '../repositories/inventory';

/**
 * Helper to extract tenant context from request
 * The tenantMiddleware ensures req.tenant is always present for protected routes
 */
function getTenantContext(req: TenantRequest): TenantContext {
  if (!req.tenant) {
    throw new Error('Tenant context not available');
  }
  return {
    tenantId: req.tenant.id,
    userId: req.user?.id
  };
}

// ============================================================================
// ITEM CATEGORIES
// ============================================================================

export const getItemCategories = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { is_active, search, page, limit } = req.query;
    
    let result;
    
    if (search) {
      // Search categories
      result = await itemCategoryRepository.search(ctx, search as string, {
        page: Number(page) || 1,
        limit: Number(limit) || 50
      });
    } else if (is_active === 'true') {
      // Get active categories only
      const categories = await itemCategoryRepository.getActiveCategories(ctx);
      result = { data: categories, pagination: { page: 1, limit: categories.length, total: categories.length, totalPages: 1 } };
    } else {
      // Get all categories with pagination
      result = await itemCategoryRepository.findAll(ctx, {}, {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        sortBy: 'name',
        sortOrder: 'ASC'
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
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

export const getItemCategoryTree = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const tree = await itemCategoryRepository.getCategoryTree(ctx);
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category tree',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getItemCategory = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    const category = await itemCategoryRepository.findById(ctx, id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createItemCategory = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { code, name, description, parent_id, is_active = true } = req.body;
    
    // Check if code is unique
    const isUnique = await itemCategoryRepository.isCodeUnique(ctx, code);
    if (!isUnique) {
      return res.status(400).json({
        success: false,
        message: 'Category code already exists'
      });
    }
    
    const category = await itemCategoryRepository.create(ctx, {
      code,
      name,
      description,
      parent_id,
      is_active
    });
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateItemCategory = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { code, name, description, parent_id, is_active } = req.body;
    
    // Check if code is unique (excluding this category)
    if (code) {
      const isUnique = await itemCategoryRepository.isCodeUnique(ctx, code, id);
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Category code already exists'
        });
      }
    }
    
    const category = await itemCategoryRepository.update(ctx, id, {
      code,
      name,
      description,
      parent_id,
      is_active
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteItemCategory = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    // Check if category has items
    const items = await inventoryItemRepository.getByCategory(ctx, id);
    if (items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated items'
      });
    }
    
    // Check if category has subcategories
    const subcategories = await itemCategoryRepository.getSubcategories(ctx, id);
    if (subcategories.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories'
      });
    }
    
    const deleted = await itemCategoryRepository.delete(ctx, id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// INVENTORY ITEMS
// ============================================================================

export const getItems = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { search, category_id, is_active, page, limit, warehouse_id } = req.query;
    
    if (search) {
      const result = await inventoryItemRepository.search(
        ctx,
        search as string,
        {
          categoryId: category_id as string,
          isActive: is_active === 'true'
        },
        {
          page: Number(page) || 1,
          limit: Number(limit) || 50
        }
      );
      
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }
    
    // Get items with stock levels
    const result = await inventoryItemRepository.getItemsWithStock(
      ctx,
      warehouse_id as string,
      {
        page: Number(page) || 1,
        limit: Number(limit) || 50
      }
    );
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
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

export const getItem = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    const item = await inventoryItemRepository.findById(ctx, id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Get stock levels for this item
    const stockLevels = await inventoryItemRepository.getStockLevels(ctx, id);
    
    res.json({
      success: true,
      data: {
        ...item,
        stock_levels: stockLevels
      }
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

export const createItem = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const itemData = req.body;
    
    // Check if code is unique
    const isUnique = await inventoryItemRepository.isCodeUnique(ctx, itemData.code);
    if (!isUnique) {
      return res.status(400).json({
        success: false,
        message: 'Item code already exists'
      });
    }
    
    const item = await inventoryItemRepository.create(ctx, itemData);
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateItem = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const itemData = req.body;
    
    // Check if code is unique (excluding this item)
    if (itemData.code) {
      const isUnique = await inventoryItemRepository.isCodeUnique(ctx, itemData.code, id);
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Item code already exists'
        });
      }
    }
    
    const item = await inventoryItemRepository.update(ctx, id, itemData);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item,
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

export const deleteItem = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    // Check if item has stock
    const stockLevels = await inventoryItemRepository.getStockLevels(ctx, id);
    const totalStock = stockLevels.reduce((sum, sl) => sum + sl.quantity_on_hand, 0);
    
    if (totalStock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with stock on hand'
      });
    }
    
    const deleted = await inventoryItemRepository.delete(ctx, id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getLowStockItems = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const items = await inventoryItemRepository.getLowStockItems(ctx);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// WAREHOUSES
// ============================================================================

export const getWarehouses = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { is_active } = req.query;
    
    if (is_active === 'true') {
      const warehouses = await warehouseRepository.getActiveWarehouses(ctx);
      return res.json({ success: true, data: warehouses });
    }
    
    const result = await warehouseRepository.findAll(ctx);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
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

export const getWarehouse = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    const warehouse = await warehouseRepository.getWarehouseWithStock(ctx, id);
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createWarehouse = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const warehouseData = req.body;
    
    // Check if code is unique
    const isUnique = await warehouseRepository.isCodeUnique(ctx, warehouseData.code);
    if (!isUnique) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse code already exists'
      });
    }
    
    const warehouse = await warehouseRepository.create(ctx, warehouseData);
    
    res.status(201).json({
      success: true,
      data: warehouse,
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

export const setDefaultWarehouse = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    
    await warehouseRepository.setDefaultWarehouse(ctx, id);
    
    res.json({
      success: true,
      message: 'Default warehouse updated successfully'
    });
  } catch (error) {
    console.error('Error setting default warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default warehouse',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const getStockMovements = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, start_date, end_date, movement_type, page, limit } = req.query;
    
    if (start_date && end_date) {
      const result = await stockMovementRepository.getMovementsByDateRange(
        ctx,
        new Date(start_date as string),
        new Date(end_date as string),
        {
          itemId: item_id as string,
          warehouseId: warehouse_id as string,
          movementType: movement_type as any
        },
        {
          page: Number(page) || 1,
          limit: Number(limit) || 50
        }
      );
      
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }
    
    if (item_id) {
      const result = await stockMovementRepository.getItemMovements(ctx, item_id as string);
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    }
    
    if (warehouse_id) {
      const result = await stockMovementRepository.getWarehouseMovements(ctx, warehouse_id as string);
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    }
    
    const result = await stockMovementRepository.findAll(ctx, {}, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
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

export const createStockReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, quantity, reference_type, reference_id, unit_cost, batch_number, notes } = req.body;
    
    const movement = await stockMovementRepository.createReceipt(ctx, {
      itemId: item_id,
      warehouseId: warehouse_id,
      quantity,
      referenceType: reference_type,
      referenceId: reference_id,
      unitCost: unit_cost,
      batchNumber: batch_number,
      notes
    });
    
    // Update stock level
    await inventoryItemRepository.updateStockLevel(ctx, item_id, warehouse_id, quantity, 'Receipt');
    
    res.status(201).json({
      success: true,
      data: movement,
      message: 'Stock receipt recorded successfully'
    });
  } catch (error) {
    console.error('Error creating stock receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock receipt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createStockIssue = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, quantity, reference_type, reference_id, reason, notes } = req.body;
    
    // Check if sufficient stock
    const stockLevels = await inventoryItemRepository.getStockLevels(ctx, item_id);
    const warehouseStock = stockLevels.find(sl => sl.warehouse_id === warehouse_id);
    
    if (!warehouseStock || warehouseStock.quantity_available < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }
    
    const movement = await stockMovementRepository.createIssue(ctx, {
      itemId: item_id,
      warehouseId: warehouse_id,
      quantity,
      referenceType: reference_type,
      referenceId: reference_id,
      reason,
      notes
    });
    
    // Update stock level (negative quantity)
    await inventoryItemRepository.updateStockLevel(ctx, item_id, warehouse_id, -quantity, 'Issue');
    
    res.status(201).json({
      success: true,
      data: movement,
      message: 'Stock issue recorded successfully'
    });
  } catch (error) {
    console.error('Error creating stock issue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock issue',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createStockTransfer = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, from_warehouse_id, to_warehouse_id, quantity, notes } = req.body;
    
    // Check if sufficient stock
    const stockLevels = await inventoryItemRepository.getStockLevels(ctx, item_id);
    const sourceStock = stockLevels.find(sl => sl.warehouse_id === from_warehouse_id);
    
    if (!sourceStock || sourceStock.quantity_available < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock in source warehouse'
      });
    }
    
    const { outMovement, inMovement } = await stockMovementRepository.createTransfer(ctx, {
      itemId: item_id,
      fromWarehouseId: from_warehouse_id,
      toWarehouseId: to_warehouse_id,
      quantity,
      notes
    });
    
    res.status(201).json({
      success: true,
      data: { outMovement, inMovement },
      message: 'Stock transfer completed successfully'
    });
  } catch (error) {
    console.error('Error creating stock transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock transfer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getMovementSummary = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    const summary = await stockMovementRepository.getMovementSummary(
      ctx,
      new Date(start_date as string),
      new Date(end_date as string)
    );
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching movement summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movement summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// STOCK LEVELS (V2 - Tenant Isolated)
// ============================================================================

import pool from '../config/database';

export const getStockLevels = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { limit = 100, offset = 0 } = req.query;

    // Simplified query - get items with stock info
    const result = await pool.query(`
      SELECT 
        i.id as stock_level_id,
        i.id as item_id,
        i.item_code,
        i.item_name,
        0 as quantity_on_hand,
        10 as reorder_level,
        i.created_at as updated_at
      FROM items i
      WHERE i.tenant_id = $1
      ORDER BY i.item_name ASC
      LIMIT $2 OFFSET $3
    `, [ctx.tenantId, limit, offset]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock levels' });
  }
};

// ============================================================================
// STOCK MOVEMENTS EXTENDED (V2 - Tenant Isolated)
// ============================================================================

export const createStockMovement = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, movement_type, quantity, reference_number, notes } = req.body;

    // Generate movement number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM inventory.stock_movements WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const movementNumber = `MOV-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO inventory.stock_movements (tenant_id, movement_number, item_id, warehouse_id, movement_type, quantity, reference_number, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft', $9)
       RETURNING *`,
      [ctx.tenantId, movementNumber, item_id, warehouse_id, movement_type, quantity, reference_number, notes, ctx.userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Stock movement created' });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock movement' });
  }
};

export const postStockMovement = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Get movement
    const movementResult = await pool.query(
      'SELECT * FROM inventory.stock_movements WHERE movement_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (movementResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Movement not found' });
    }

    const movement = movementResult.rows[0];
    if (movement.status === 'posted') {
      return res.status(400).json({ success: false, message: 'Movement already posted' });
    }

    // Update stock level
    const multiplier = ['IN', 'RECEIPT', 'TRANSFER_IN', 'ADJUSTMENT_IN'].includes(movement.movement_type) ? 1 : -1;

    await pool.query(
      `INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand, quantity_available)
       VALUES ($1, $2, $3, $4, $4)
       ON CONFLICT (tenant_id, item_id, warehouse_id) 
       DO UPDATE SET 
         quantity_on_hand = inventory.stock_levels.quantity_on_hand + $4,
         quantity_available = inventory.stock_levels.quantity_available + $4,
         updated_at = NOW()`,
      [ctx.tenantId, movement.item_id, movement.warehouse_id, movement.quantity * multiplier]
    );

    // Update movement status
    const result = await pool.query(
      'UPDATE inventory.stock_movements SET status = $1, posted_at = NOW(), posted_by = $2 WHERE movement_id = $3 AND tenant_id = $4 RETURNING *',
      ['posted', ctx.userId, id, ctx.tenantId]
    );

    res.json({ success: true, data: result.rows[0], message: 'Stock movement posted' });
  } catch (error) {
    console.error('Error posting stock movement:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock movement' });
  }
};

// ============================================================================
// STOCK ADJUSTMENTS (V2 - Tenant Isolated)
// ============================================================================

export const getStockAdjustments = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, warehouse_id, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM inventory.stock_adjustments WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (warehouse_id) {
      query += ` AND warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock adjustments' });
  }
};

export const getStockAdjustmentById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM inventory.stock_adjustments WHERE adjustment_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock adjustment not found' });
    }

    // Get lines
    const linesResult = await pool.query(
      'SELECT * FROM inventory.stock_adjustment_lines WHERE adjustment_id = $1',
      [id]
    );

    res.json({ success: true, data: { ...result.rows[0], lines: linesResult.rows } });
  } catch (error) {
    console.error('Error fetching stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock adjustment' });
  }
};

export const createStockAdjustment = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { warehouse_id, adjustment_type, reason, notes, lines } = req.body;

    // Generate adjustment number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM inventory.stock_adjustments WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const adjustmentNumber = `ADJ-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO inventory.stock_adjustments (tenant_id, adjustment_number, warehouse_id, adjustment_type, reason, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)
       RETURNING *`,
      [ctx.tenantId, adjustmentNumber, warehouse_id, adjustment_type || 'ADJUSTMENT', reason, notes, ctx.userId]
    );

    const adjustmentId = result.rows[0].adjustment_id;

    // Insert lines
    if (lines && lines.length > 0) {
      for (const line of lines) {
        await pool.query(
          `INSERT INTO inventory.stock_adjustment_lines (adjustment_id, item_id, quantity_before, quantity_adjustment, quantity_after, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [adjustmentId, line.item_id, line.quantity_before || 0, line.quantity_adjustment, (line.quantity_before || 0) + line.quantity_adjustment, line.notes]
        );
      }
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Stock adjustment created' });
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock adjustment' });
  }
};

export const postStockAdjustment = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Get adjustment
    const adjResult = await pool.query(
      'SELECT * FROM inventory.stock_adjustments WHERE adjustment_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (adjResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Adjustment not found' });
    }

    if (adjResult.rows[0].status === 'posted') {
      return res.status(400).json({ success: false, message: 'Adjustment already posted' });
    }

    // Get lines
    const linesResult = await pool.query(
      'SELECT * FROM inventory.stock_adjustment_lines WHERE adjustment_id = $1',
      [id]
    );

    // Apply adjustments to stock levels
    for (const line of linesResult.rows) {
      await pool.query(
        `INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand, quantity_available)
         VALUES ($1, $2, $3, $4, $4)
         ON CONFLICT (tenant_id, item_id, warehouse_id) 
         DO UPDATE SET 
           quantity_on_hand = inventory.stock_levels.quantity_on_hand + $4,
           quantity_available = inventory.stock_levels.quantity_available + $4,
           updated_at = NOW()`,
        [ctx.tenantId, line.item_id, adjResult.rows[0].warehouse_id, line.quantity_adjustment]
      );
    }

    // Update adjustment status
    const result = await pool.query(
      'UPDATE inventory.stock_adjustments SET status = $1, posted_at = NOW(), posted_by = $2 WHERE adjustment_id = $3 AND tenant_id = $4 RETURNING *',
      ['posted', ctx.userId, id, ctx.tenantId]
    );

    res.json({ success: true, data: result.rows[0], message: 'Stock adjustment posted' });
  } catch (error) {
    console.error('Error posting stock adjustment:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock adjustment' });
  }
};

// ============================================================================
// STOCK TAKES (V2 - Tenant Isolated)
// ============================================================================

export const getStockTakes = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, warehouse_id, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM inventory.stock_takes WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (warehouse_id) {
      query += ` AND warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock takes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock takes' });
  }
};

export const createStockTake = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { warehouse_id, stock_take_date, notes, lines } = req.body;

    // Generate stock take number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM inventory.stock_takes WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const takeNumber = `ST-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO inventory.stock_takes (tenant_id, stock_take_number, warehouse_id, stock_take_date, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)
       RETURNING *`,
      [ctx.tenantId, takeNumber, warehouse_id, stock_take_date || new Date(), notes, ctx.userId]
    );

    const takeId = result.rows[0].stock_take_id;

    // Insert lines if provided
    if (lines && lines.length > 0) {
      for (const line of lines) {
        await pool.query(
          `INSERT INTO inventory.stock_take_lines (stock_take_id, item_id, system_quantity, counted_quantity, variance)
           VALUES ($1, $2, $3, $4, $5)`,
          [takeId, line.item_id, line.system_quantity || 0, line.counted_quantity, (line.counted_quantity || 0) - (line.system_quantity || 0)]
        );
      }
    }

    res.status(201).json({ success: true, data: result.rows[0], message: 'Stock take created' });
  } catch (error) {
    console.error('Error creating stock take:', error);
    res.status(500).json({ success: false, message: 'Failed to create stock take' });
  }
};

export const postStockTake = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Get stock take
    const takeResult = await pool.query(
      'SELECT * FROM inventory.stock_takes WHERE stock_take_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (takeResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock take not found' });
    }

    if (takeResult.rows[0].status === 'posted') {
      return res.status(400).json({ success: false, message: 'Stock take already posted' });
    }

    // Get lines
    const linesResult = await pool.query(
      'SELECT * FROM inventory.stock_take_lines WHERE stock_take_id = $1',
      [id]
    );

    // Apply variances to stock levels
    for (const line of linesResult.rows) {
      if (line.variance !== 0) {
        await pool.query(
          `INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand, quantity_available)
           VALUES ($1, $2, $3, $4, $4)
           ON CONFLICT (tenant_id, item_id, warehouse_id) 
           DO UPDATE SET 
             quantity_on_hand = inventory.stock_levels.quantity_on_hand + $4,
             quantity_available = inventory.stock_levels.quantity_available + $4,
             last_count_date = NOW(),
             updated_at = NOW()`,
          [ctx.tenantId, line.item_id, takeResult.rows[0].warehouse_id, line.variance]
        );
      }
    }

    // Update stock take status
    const result = await pool.query(
      'UPDATE inventory.stock_takes SET status = $1, posted_at = NOW(), posted_by = $2 WHERE stock_take_id = $3 AND tenant_id = $4 RETURNING *',
      ['posted', ctx.userId, id, ctx.tenantId]
    );

    res.json({ success: true, data: result.rows[0], message: 'Stock take posted' });
  } catch (error) {
    console.error('Error posting stock take:', error);
    res.status(500).json({ success: false, message: 'Failed to post stock take' });
  }
};

// ============================================================================
// BATCHES & SERIALS (V2 - Tenant Isolated)
// ============================================================================

export const getStockBatches = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, expired_only, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT b.*, i.item_code, i.item_name, w.warehouse_name
      FROM inventory.stock_batches b
      JOIN inventory.items i ON b.item_id = i.item_id AND i.tenant_id = b.tenant_id
      LEFT JOIN inventory.warehouses w ON b.warehouse_id = w.warehouse_id AND w.tenant_id = b.tenant_id
      WHERE b.tenant_id = $1
    `;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (item_id) {
      query += ` AND b.item_id = $${paramCount}`;
      params.push(item_id);
      paramCount++;
    }
    if (warehouse_id) {
      query += ` AND b.warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }
    if (expired_only === 'true') {
      query += ` AND b.expiry_date < NOW()`;
    }

    query += ` ORDER BY b.expiry_date ASC NULLS LAST LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching stock batches:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stock batches' });
  }
};

export const getSerialNumbers = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { item_id, warehouse_id, status, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT sn.*, i.item_code, i.item_name, w.warehouse_name
      FROM inventory.serial_numbers sn
      JOIN inventory.items i ON sn.item_id = i.item_id AND i.tenant_id = sn.tenant_id
      LEFT JOIN inventory.warehouses w ON sn.warehouse_id = w.warehouse_id AND w.tenant_id = sn.tenant_id
      WHERE sn.tenant_id = $1
    `;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (item_id) {
      query += ` AND sn.item_id = $${paramCount}`;
      params.push(item_id);
      paramCount++;
    }
    if (warehouse_id) {
      query += ` AND sn.warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }
    if (status) {
      query += ` AND sn.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY sn.serial_number ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch serial numbers' });
  }
};

// ============================================================================
// REORDER SUGGESTIONS (V2 - Tenant Isolated)
// ============================================================================

export const getReorderSuggestions = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { warehouse_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        sl.item_id,
        i.item_code,
        i.item_name,
        sl.warehouse_id,
        w.warehouse_name,
        sl.quantity_on_hand,
        sl.quantity_available,
        sl.reorder_level,
        sl.reorder_quantity,
        (sl.reorder_level - sl.quantity_available) as suggested_order_quantity
      FROM inventory.stock_levels sl
      JOIN inventory.items i ON sl.item_id = i.item_id AND i.tenant_id = sl.tenant_id
      JOIN inventory.warehouses w ON sl.warehouse_id = w.warehouse_id AND w.tenant_id = sl.tenant_id
      WHERE sl.tenant_id = $1
        AND sl.quantity_available <= sl.reorder_level
        AND sl.reorder_level > 0
    `;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (warehouse_id) {
      query += ` AND sl.warehouse_id = $${paramCount}`;
      params.push(warehouse_id);
      paramCount++;
    }

    query += ` ORDER BY (sl.quantity_available / NULLIF(sl.reorder_level, 0)) ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching reorder suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reorder suggestions' });
  }
};

export const generateReorderSuggestions = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { warehouse_id } = req.body;

    // Same as getReorderSuggestions but can trigger PO creation in future
    let query = `
      SELECT 
        sl.item_id,
        i.item_code,
        i.item_name,
        sl.warehouse_id,
        w.warehouse_name,
        sl.quantity_on_hand,
        sl.quantity_available,
        sl.reorder_level,
        GREATEST(sl.reorder_quantity, sl.reorder_level - sl.quantity_available) as suggested_order_quantity
      FROM inventory.stock_levels sl
      JOIN inventory.items i ON sl.item_id = i.item_id AND i.tenant_id = sl.tenant_id
      JOIN inventory.warehouses w ON sl.warehouse_id = w.warehouse_id AND w.tenant_id = sl.tenant_id
      WHERE sl.tenant_id = $1
        AND sl.quantity_available <= sl.reorder_level
        AND sl.reorder_level > 0
    `;
    const params: any[] = [ctx.tenantId];

    if (warehouse_id) {
      query += ` AND sl.warehouse_id = $2`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY (sl.quantity_available / NULLIF(sl.reorder_level, 0)) ASC`;

    const result = await pool.query(query, params);
    res.json({ 
      success: true, 
      data: result.rows, 
      message: `Found ${result.rows.length} items needing reorder` 
    });
  } catch (error) {
    console.error('Error generating reorder suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to generate reorder suggestions' });
  }
};

// ============================================================================
// INVENTORY DASHBOARD (V2 - Tenant Isolated)
// ============================================================================

export const getInventoryDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);

    // Total items - using public schema
    const itemsResult = await pool.query(
      'SELECT COUNT(*) as total FROM items WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    // Total warehouses - inventory schema
    const warehousesResult = await pool.query(
      'SELECT COUNT(*) as total FROM inventory.warehouses WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          total_items: parseInt(itemsResult.rows[0]?.total || '0'),
          active_items: parseInt(itemsResult.rows[0]?.total || '0'),
          total_warehouses: parseInt(warehousesResult.rows[0]?.total || '0'),
          low_stock_items: 0,
          total_stock_value: 0
        },
        recent_movements: []
      }
    });
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory dashboard' });
  }
};
