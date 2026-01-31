/**
 * Sales Order Repository
 * 
 * Handles all database operations for sales orders
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface SalesOrderLine {
  id: string;
  order_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  order_date: Date;
  delivery_date?: Date;
  status: OrderStatus;
  warehouse_id?: string;
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  shipping_amount?: number;
  total_amount: number;
  currency_code: string;
  exchange_rate?: number;
  payment_terms?: number;
  notes?: string;
  internal_notes?: string;
  sales_rep_id?: string;
  quotation_id?: string;
  lines?: SalesOrderLine[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class SalesOrderRepository extends BaseRepository<SalesOrder> {
  protected tableName = 'orders';
  protected schema = 'sales';
  protected softDelete = false;  // Table doesn't have deleted_at column

  /**
   * Get orders by status
   */
  async getOrdersByStatus(
    ctx: TenantContext,
    status: OrderStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<SalesOrder>> {
    return this.findAll(ctx, { status }, pagination);
  }

  /**
   * Get orders for a customer
   */
  async getCustomerOrders(
    ctx: TenantContext,
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<SalesOrder>> {
    return this.findAll(ctx, { customer_id: customerId }, pagination);
  }

  /**
   * Get order with lines
   */
  async getOrderWithLines(ctx: TenantContext, orderId: string): Promise<SalesOrder | null> {
    const order = await this.findById(ctx, orderId);
    if (!order) return null;

    const linesSql = `
      SELECT ol.*, i.code as item_code, i.name as item_name
      FROM sales.order_lines ol
      LEFT JOIN inventory.items i ON i.id = ol.item_id
      WHERE ol.order_id = $2 AND ol.tenant_id = $1
      ORDER BY ol.line_number
    `;

    const lines = await this.rawQuery<SalesOrderLine>(ctx, linesSql, [orderId]);
    return { ...order, lines };
  }

  /**
   * Create order with lines
   */
  async createOrderWithLines(
    ctx: TenantContext,
    orderData: Partial<SalesOrder>,
    lines: Partial<SalesOrderLine>[]
  ): Promise<SalesOrder> {
    const client = await this.beginTransaction();

    try {
      // Generate order number
      const orderNumber = await this.generateOrderNumber(ctx, client);

      // Create order
      const orderResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, order_number, customer_id, order_date, status, warehouse_id,
         subtotal, discount_amount, tax_amount, shipping_amount, total_amount,
         currency_code, payment_terms, notes, sales_rep_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        ctx.tenantId,
        orderNumber,
        orderData.customer_id,
        orderData.order_date || new Date(),
        orderData.status || 'draft',
        orderData.warehouse_id,
        orderData.subtotal || 0,
        orderData.discount_amount || 0,
        orderData.tax_amount || 0,
        orderData.shipping_amount || 0,
        orderData.total_amount || 0,
        orderData.currency_code || 'ZAR',
        orderData.payment_terms,
        orderData.notes,
        orderData.sales_rep_id,
        ctx.userId
      ]);

      const order = orderResult.rows[0];

      // Create lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO sales.order_lines
          (tenant_id, order_id, line_number, item_id, quantity, unit_price,
           discount_percent, discount_amount, tax_rate, tax_amount, line_total, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          ctx.tenantId,
          order.id,
          i + 1,
          line.item_id,
          line.quantity,
          line.unit_price,
          line.discount_percent || 0,
          line.discount_amount || 0,
          line.tax_rate || 0,
          line.tax_amount || 0,
          line.line_total,
          line.notes
        ]);
      }

      await this.commitTransaction(client);
      return order;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Generate next order number
   */
  private async generateOrderNumber(ctx: TenantContext, client?: any): Promise<string> {
    const queryClient = client || this.pool;
    const result = await queryClient.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
      FROM ${this.fullTableName}
      WHERE tenant_id = $1
    `, [ctx.tenantId]);

    const nextNum = result.rows[0].next_num;
    return `SO-${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Update order status
   */
  async updateStatus(ctx: TenantContext, orderId: string, status: OrderStatus): Promise<SalesOrder | null> {
    return this.update(ctx, orderId, { status });
  }

  /**
   * Get orders by date range
   */
  async getOrdersByDateRange(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<SalesOrder>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND order_date BETWEEN $2 AND $3
      ORDER BY order_date DESC
      LIMIT $4 OFFSET $5
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND order_date BETWEEN $2 AND $3
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<SalesOrder>(ctx, sql, [startDate, endDate, limit, offset]),
      this.rawQuery<{ count: string }>(ctx, countSql, [startDate, endDate])
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get sales summary for dashboard
   */
  async getSalesSummary(ctx: TenantContext, startDate: Date, endDate: Date): Promise<{
    total_orders: number;
    total_amount: number;
    average_order_value: number;
    orders_by_status: Record<string, number>;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND order_date BETWEEN $2 AND $3
    `;

    const statusSql = `
      SELECT status, COUNT(*) as count
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND order_date BETWEEN $2 AND $3
      GROUP BY status
    `;

    const [summary, statusCounts] = await Promise.all([
      this.rawQuery(ctx, sql, [startDate, endDate]),
      this.rawQuery<{ status: string; count: string }>(ctx, statusSql, [startDate, endDate])
    ]);

    const orders_by_status: Record<string, number> = {};
    statusCounts.forEach(row => {
      orders_by_status[row.status] = parseInt(row.count, 10);
    });

    return {
      total_orders: parseInt(summary[0]?.total_orders || '0', 10),
      total_amount: parseFloat(summary[0]?.total_amount || '0'),
      average_order_value: parseFloat(summary[0]?.average_order_value || '0'),
      orders_by_status
    };
  }
}

// Singleton instance
export const salesOrderRepository = new SalesOrderRepository();
export default salesOrderRepository;
