/**
 * Warehouse Repository
 * 
 * Handles all database operations for warehouses
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class WarehouseRepository extends BaseRepository<Warehouse> {
  protected tableName = 'warehouses';
  protected schema = 'inventory';

  /**
   * Get the default warehouse for a tenant
   */
  async getDefaultWarehouse(ctx: TenantContext): Promise<Warehouse | null> {
    return this.findOne(ctx, { is_default: true, is_active: true });
  }

  /**
   * Set a warehouse as the default
   */
  async setDefaultWarehouse(ctx: TenantContext, warehouseId: string): Promise<void> {
    const client = await this.beginTransaction();

    try {
      // Remove default from all warehouses
      await client.query(`
        UPDATE ${this.fullTableName}
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = $1
      `, [ctx.tenantId]);

      // Set the new default
      await client.query(`
        UPDATE ${this.fullTableName}
        SET is_default = true, updated_at = NOW()
        WHERE tenant_id = $1 AND id = $2
      `, [ctx.tenantId, warehouseId]);

      await this.commitTransaction(client);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get all active warehouses
   */
  async getActiveWarehouses(ctx: TenantContext): Promise<Warehouse[]> {
    const result = await this.findAll(ctx, { is_active: true });
    return result.data;
  }

  /**
   * Get warehouse with stock summary
   */
  async getWarehouseWithStock(ctx: TenantContext, warehouseId: string): Promise<Warehouse & {
    total_items: number;
    total_stock_value: number;
  } | null> {
    const sql = `
      SELECT 
        w.*,
        COUNT(DISTINCT sl.item_id) as total_items,
        COALESCE(SUM(sl.quantity_on_hand * i.cost_price), 0) as total_stock_value
      FROM ${this.fullTableName} w
      LEFT JOIN inventory.stock_levels sl ON sl.warehouse_id = w.id
      LEFT JOIN inventory.items i ON i.id = sl.item_id
      WHERE w.tenant_id = $1 AND w.id = $2 AND w.deleted_at IS NULL
      GROUP BY w.id
    `;

    const result = await this.rawQuery(ctx, sql, [warehouseId]);
    return result[0] || null;
  }

  /**
   * Check if warehouse code is unique
   */
  async isCodeUnique(ctx: TenantContext, code: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { code });
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }
}

// Singleton instance
export const warehouseRepository = new WarehouseRepository();
export default warehouseRepository;
