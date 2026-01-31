/**
 * Inventory Item Repository
 * 
 * Handles all database operations for inventory items
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export interface InventoryItem {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  unit_of_measure: string;
  sku?: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  is_active: boolean;
  is_service: boolean;
  is_serialized: boolean;
  is_batch_tracked: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tax_code?: string;
  gl_account_id?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export interface StockLevel {
  item_id: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
}

export class InventoryItemRepository extends BaseRepository<InventoryItem> {
  protected tableName = 'items';
  protected schema = 'inventory';

  /**
   * Get items with stock levels
   */
  async getItemsWithStock(
    ctx: TenantContext,
    warehouseId?: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<InventoryItem & { stock: number }>> {
    const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'ASC' } = pagination || {};
    const offset = (page - 1) * limit;

    let sql = `
      SELECT i.*, COALESCE(SUM(sl.quantity_on_hand), 0) as stock
      FROM ${this.fullTableName} i
      LEFT JOIN inventory.stock_levels sl ON sl.item_id = i.item_id
      WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (warehouseId) {
      sql += ` AND sl.warehouse_id = $2`;
      params.push(warehouseId);
    }

    sql += `
      GROUP BY i.item_id
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${params.length + 2} OFFSET $${params.length + 3}
    `;
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(DISTINCT i.item_id) FROM ${this.fullTableName} i
      WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery(ctx, sql, params),
      this.rawQuery<{ count: string }>(ctx, countSql)
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get stock levels for an item across all warehouses
   */
  async getStockLevels(ctx: TenantContext, itemId: string): Promise<StockLevel[]> {
    const sql = `
      SELECT 
        sl.item_id,
        sl.warehouse_id,
        w.warehouse_name as warehouse_name,
        sl.quantity_on_hand,
        sl.quantity_reserved,
        (sl.quantity_on_hand - sl.quantity_reserved) as quantity_available
      FROM inventory.stock_levels sl
      JOIN inventory.warehouses w ON w.warehouse_id = sl.warehouse_id
      WHERE sl.tenant_id = $1 AND sl.item_id = $2
    `;

    return this.rawQuery(ctx, sql, [itemId]);
  }

  /**
   * Get low stock items (below reorder point)
   */
  async getLowStockItems(ctx: TenantContext): Promise<(InventoryItem & { current_stock: number })[]> {
    const sql = `
      SELECT i.*, COALESCE(SUM(sl.quantity_on_hand), 0) as current_stock
      FROM ${this.fullTableName} i
      LEFT JOIN inventory.stock_levels sl ON sl.item_id = i.item_id
      WHERE i.tenant_id = $1 
        AND i.deleted_at IS NULL
        AND i.reorder_point IS NOT NULL
      GROUP BY i.item_id
      HAVING COALESCE(SUM(sl.quantity_on_hand), 0) <= i.reorder_point
      ORDER BY (COALESCE(SUM(sl.quantity_on_hand), 0) / NULLIF(i.reorder_point, 0))
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Search items by name, code, SKU, or barcode
   */
  async search(
    ctx: TenantContext,
    searchTerm: string,
    filters?: {
      categoryId?: string;
      isActive?: boolean;
      isService?: boolean;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<InventoryItem>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;
    const params: any[] = [searchPattern];

    let conditions = `
      (name ILIKE $2 OR code ILIKE $2 OR sku ILIKE $2 OR barcode ILIKE $2)
    `;

    let paramIndex = 3;
    if (filters?.categoryId) {
      conditions += ` AND category_id = $${paramIndex}`;
      params.push(filters.categoryId);
      paramIndex++;
    }
    if (filters?.isActive !== undefined) {
      conditions += ` AND is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }
    if (filters?.isService !== undefined) {
      conditions += ` AND is_service = $${paramIndex}`;
      params.push(filters.isService);
      paramIndex++;
    }

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND ${conditions}
      ORDER BY name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND ${conditions}
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<InventoryItem>(ctx, sql, params),
      this.rawQuery<{ count: string }>(ctx, countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Check if item code is unique for tenant
   */
  async isCodeUnique(ctx: TenantContext, code: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { code });
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  /**
   * Get items by category
   */
  async getByCategory(ctx: TenantContext, categoryId: string): Promise<InventoryItem[]> {
    return this.findBy(ctx, 'category_id', categoryId);
  }

  /**
   * Update stock level for an item in a warehouse
   */
  async updateStockLevel(
    ctx: TenantContext,
    itemId: string,
    warehouseId: string,
    quantityChange: number,
    reason: string
  ): Promise<void> {
    const client = await this.beginTransaction();

    try {
      // Update or insert stock level
      await client.query(`
        INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, item_id, warehouse_id)
        DO UPDATE SET 
          quantity_on_hand = inventory.stock_levels.quantity_on_hand + $4,
          updated_at = NOW()
      `, [ctx.tenantId, itemId, warehouseId, quantityChange]);

      // Record the movement
      await client.query(`
        INSERT INTO inventory.stock_movements 
        (tenant_id, item_id, warehouse_id, quantity, movement_type, reason, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [ctx.tenantId, itemId, warehouseId, quantityChange, 
          quantityChange > 0 ? 'IN' : 'OUT', reason, ctx.userId]);

      await this.commitTransaction(client);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Singleton instance
export const inventoryItemRepository = new InventoryItemRepository();
export default inventoryItemRepository;
