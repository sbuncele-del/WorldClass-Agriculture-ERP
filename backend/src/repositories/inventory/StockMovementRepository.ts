/**
 * Stock Movement Repository
 * 
 * Handles all database operations for stock movements (receipts, issues, transfers)
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';

export interface StockMovement {
  id: string;
  tenant_id: string;
  item_id: string;
  warehouse_id: string;
  to_warehouse_id?: string;  // For transfers
  quantity: number;
  movement_type: MovementType;
  reference_type?: string;  // 'PURCHASE_ORDER', 'SALES_ORDER', 'MANUAL', etc.
  reference_id?: string;
  reason?: string;
  notes?: string;
  unit_cost?: number;
  batch_number?: string;
  serial_numbers?: string[];
  created_at: Date;
  created_by?: string;
}

export class StockMovementRepository extends BaseRepository<StockMovement> {
  protected tableName = 'stock_movements';
  protected schema = 'inventory';
  protected softDelete = false;  // Don't soft delete movements - they're audit records

  /**
   * Get movements for an item
   */
  async getItemMovements(
    ctx: TenantContext,
    itemId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<StockMovement>> {
    return this.findAll(ctx, { item_id: itemId }, pagination);
  }

  /**
   * Get movements for a warehouse
   */
  async getWarehouseMovements(
    ctx: TenantContext,
    warehouseId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<StockMovement>> {
    return this.findAll(ctx, { warehouse_id: warehouseId }, pagination);
  }

  /**
   * Get movements by date range
   */
  async getMovementsByDateRange(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
    filters?: {
      itemId?: string;
      warehouseId?: string;
      movementType?: MovementType;
    },
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<StockMovement>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const params: any[] = [startDate, endDate];

    let conditions = 'created_at BETWEEN $2 AND $3';
    let paramIndex = 4;

    if (filters?.itemId) {
      conditions += ` AND item_id = $${paramIndex}`;
      params.push(filters.itemId);
      paramIndex++;
    }
    if (filters?.warehouseId) {
      conditions += ` AND warehouse_id = $${paramIndex}`;
      params.push(filters.warehouseId);
      paramIndex++;
    }
    if (filters?.movementType) {
      conditions += ` AND movement_type = $${paramIndex}`;
      params.push(filters.movementType);
      paramIndex++;
    }

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND ${conditions}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND ${conditions}
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<StockMovement>(ctx, sql, params),
      this.rawQuery<{ count: string }>(ctx, countSql, params.slice(0, -2))
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Create a stock receipt (goods in)
   */
  async createReceipt(
    ctx: TenantContext,
    data: {
      itemId: string;
      warehouseId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      unitCost?: number;
      batchNumber?: string;
      serialNumbers?: string[];
      notes?: string;
    }
  ): Promise<StockMovement> {
    return this.create(ctx, {
      item_id: data.itemId,
      warehouse_id: data.warehouseId,
      quantity: Math.abs(data.quantity),
      movement_type: 'IN',
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      unit_cost: data.unitCost,
      batch_number: data.batchNumber,
      serial_numbers: data.serialNumbers,
      notes: data.notes
    });
  }

  /**
   * Create a stock issue (goods out)
   */
  async createIssue(
    ctx: TenantContext,
    data: {
      itemId: string;
      warehouseId: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      reason?: string;
      notes?: string;
    }
  ): Promise<StockMovement> {
    return this.create(ctx, {
      item_id: data.itemId,
      warehouse_id: data.warehouseId,
      quantity: -Math.abs(data.quantity),
      movement_type: 'OUT',
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      reason: data.reason,
      notes: data.notes
    });
  }

  /**
   * Create a stock transfer between warehouses
   */
  async createTransfer(
    ctx: TenantContext,
    data: {
      itemId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      notes?: string;
    }
  ): Promise<{ outMovement: StockMovement; inMovement: StockMovement }> {
    const client = await this.beginTransaction();

    try {
      // Create OUT movement from source warehouse
      const outResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, item_id, warehouse_id, to_warehouse_id, quantity, movement_type, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, 'TRANSFER', $6, $7)
        RETURNING *
      `, [ctx.tenantId, data.itemId, data.fromWarehouseId, data.toWarehouseId, 
          -Math.abs(data.quantity), data.notes, ctx.userId]);

      // Create IN movement to destination warehouse
      const inResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, item_id, warehouse_id, quantity, movement_type, notes, created_by)
        VALUES ($1, $2, $3, $4, 'TRANSFER', $5, $6)
        RETURNING *
      `, [ctx.tenantId, data.itemId, data.toWarehouseId, 
          Math.abs(data.quantity), data.notes, ctx.userId]);

      // Update stock levels
      await client.query(`
        UPDATE inventory.stock_levels
        SET quantity_on_hand = quantity_on_hand - $1, updated_at = NOW()
        WHERE tenant_id = $2 AND item_id = $3 AND warehouse_id = $4
      `, [Math.abs(data.quantity), ctx.tenantId, data.itemId, data.fromWarehouseId]);

      await client.query(`
        INSERT INTO inventory.stock_levels (tenant_id, item_id, warehouse_id, quantity_on_hand)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (tenant_id, item_id, warehouse_id)
        DO UPDATE SET quantity_on_hand = inventory.stock_levels.quantity_on_hand + $4, updated_at = NOW()
      `, [ctx.tenantId, data.itemId, data.toWarehouseId, Math.abs(data.quantity)]);

      await this.commitTransaction(client);

      return {
        outMovement: outResult.rows[0],
        inMovement: inResult.rows[0]
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get movement summary for reporting
   */
  async getMovementSummary(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_in: number;
    total_out: number;
    total_transfers: number;
    net_movement: number;
  }> {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN ABS(quantity) ELSE 0 END), 0) as total_out,
        COALESCE(SUM(CASE WHEN movement_type = 'TRANSFER' AND quantity > 0 THEN quantity ELSE 0 END), 0) as total_transfers,
        COALESCE(SUM(quantity), 0) as net_movement
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
    `;

    const result = await this.rawQuery(ctx, sql, [startDate, endDate]);
    return result[0];
  }
}

// Singleton instance
export const stockMovementRepository = new StockMovementRepository();
export default stockMovementRepository;
