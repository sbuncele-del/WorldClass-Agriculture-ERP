/**
 * Purchase Order Repository
 * 
 * Handles all database operations for purchase orders
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partial' | 'received' | 'cancelled';

// Matches existing purchase.po_line_items schema with friendly aliases
export interface PurchaseOrderLine {
  line_id: number;
  po_id: number;
  item_code?: string;
  description?: string;
  quantity: number;
  unit_of_measure?: string;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  line_total: number;
  quantity_received?: number;
  notes?: string;
}

// Matches existing purchase.purchase_orders schema with friendly aliases
export interface PurchaseOrder {
  po_id: number;
  tenant_id: string;
  po_number: string;
  po_date: Date;
  order_date?: Date;
  expected_date?: Date;
  supplier_id?: number;
  requisition_id?: number;
  delivery_date?: Date;
  payment_terms?: string;
  status: string;
  subtotal: number;
  discount_amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  total: number;
  currency_code?: string;
  sent_to_supplier?: boolean;
  acknowledged_by_supplier?: boolean;
  warehouse_id?: number;
  notes?: string;
  created_at: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
  deleted_at?: Date;
  lines?: PurchaseOrderLine[];
}

export class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
  protected tableName = 'purchase_orders';
  protected schema = 'purchase';
  protected primaryKey = 'po_id';
  protected softDelete = false;

  /**
   * Get orders by status
   */
  async getOrdersByStatus(
    ctx: TenantContext,
    status: PurchaseOrderStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PurchaseOrder>> {
    return this.findAll(ctx, { status }, pagination);
  }

  /**
   * Get orders pending approval
   */
  async getPendingApproval(ctx: TenantContext): Promise<PurchaseOrder[]> {
    const result = await this.findAll(ctx, { status: 'pending_approval' });
    return result.data;
  }

  /**
   * Get order with lines
   */
  async getOrderWithLines(ctx: TenantContext, orderId: string): Promise<PurchaseOrder | null> {
    const order = await this.findById(ctx, orderId);
    if (!order) return null;

    const linesSql = `
      SELECT 
        line_id, 
        po_id, 
        item_code, 
        description, 
        quantity, 
        unit_of_measure,
        unit_price,
        discount_percentage,
        discount_amount,
        vat_rate,
        vat_amount,
        line_total,
        quantity_received,
        notes
      FROM purchase.po_line_items pol
      WHERE pol.tenant_id = $1 AND pol.po_id = $2
      ORDER BY pol.line_number
    `;

    const lines = await this.rawQuery<PurchaseOrderLine>(ctx, linesSql, [orderId]);
    return { ...order, lines };
  }

  /**
   * Create order with lines
   */
  async createOrderWithLines(
    ctx: TenantContext,
    orderData: Partial<PurchaseOrder>,
    lines: Partial<PurchaseOrderLine>[]
  ): Promise<PurchaseOrder> {
    const client = await this.beginTransaction();

    try {
      // Generate order number against legacy po_number column
      const numResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
         FROM ${this.fullTableName}
         WHERE tenant_id = $1`,
        [ctx.tenantId]
      );
      const orderNumber = `PO-${String(numResult.rows[0].next_num).padStart(6, '0')}`;

      // Basic totals derived from lines when not provided
      const computedSubtotal = lines.reduce((sum, l) => {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.unit_price) || 0;
        return sum + qty * price;
      }, 0);
      const subtotal = orderData.subtotal ?? computedSubtotal;
      const discountAmount = orderData.discount_amount ?? 0;
      const vatRate = orderData.vat_rate ?? 15;
      const vatAmount = orderData.vat_amount ?? ((subtotal - discountAmount) * (vatRate / 100));
      const total = orderData.total ?? (subtotal - discountAmount + vatAmount);

      // Create order (Note: created_by is INTEGER in DB schema, skip it for UUID users)
      const orderResult = await client.query(
        `INSERT INTO ${this.fullTableName}
         (tenant_id, po_number, po_date, order_date, expected_date, supplier_id, requisition_id, delivery_date,
          payment_terms, status, warehouse_id, subtotal, discount_amount, vat_rate, vat_amount, total,
          currency_code, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING *`,
        [
          ctx.tenantId,
          orderNumber,
          orderData.po_date || new Date(),
          orderData.order_date || new Date(),
          orderData.expected_date,
          orderData.supplier_id,
          orderData.requisition_id,
          orderData.delivery_date,
          orderData.payment_terms,
          orderData.status || 'draft',
          orderData.warehouse_id,
          subtotal,
          discountAmount,
          vatRate,
          vatAmount,
          total,
          orderData.currency_code || 'ZAR',
          orderData.notes
        ]
      );

      const order = orderResult.rows[0];

      // Create lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const qty = Number(line.quantity) || 0;
        const price = Number(line.unit_price) || 0;
        const discountPct = Number(line.discount_percentage) || 0;
        const discountValue = line.discount_amount ?? ((qty * price) * (discountPct / 100));
        const rate = Number(line.vat_rate ?? 15);
        const lineTotalBeforeTax = qty * price - discountValue;
        const taxValue = line.vat_amount ?? (lineTotalBeforeTax * (rate / 100));
        const lineTotal = line.line_total ?? (lineTotalBeforeTax + taxValue);

        await client.query(
          `INSERT INTO purchase.po_line_items
           (tenant_id, po_id, line_number, item_code, description, quantity, unit_of_measure, unit_price,
            discount_percentage, discount_amount, vat_rate, vat_amount, line_total, quantity_received, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)` ,
          [
            ctx.tenantId,
            order.po_id,
            i + 1,
            line.item_code,
            line.description,
            qty,
            line.unit_of_measure || 'Unit',
            price,
            discountPct,
            discountValue,
            rate,
            taxValue,
            lineTotal,
            line.quantity_received || 0,
            line.notes
          ]
        );
      }

      await this.commitTransaction(client);
      return order;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Approve a purchase order
   */
  async approveOrder(ctx: TenantContext, orderId: string): Promise<PurchaseOrder | null> {
    const client = await this.beginTransaction();

    try {
      await client.query(`
        UPDATE ${this.fullTableName}
        SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3 AND status = 'pending_approval'
      `, [ctx.userId, orderId, ctx.tenantId]);

      await this.commitTransaction(client);
      return this.findById(ctx, orderId);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Receive goods against a purchase order
   */
  async receiveGoods(
    ctx: TenantContext,
    orderId: string,
    receivedItems: { lineId: string; quantityReceived: number }[]
  ): Promise<PurchaseOrder | null> {
    const client = await this.beginTransaction();

    try {
      const order = await this.getOrderWithLines(ctx, orderId);
      if (!order) throw new Error('Order not found');

      let allReceived = true;

      for (const item of receivedItems) {
        // Update line quantity received
        await client.query(`
          UPDATE purchase.order_lines
          SET quantity_received = COALESCE(quantity_received, 0) + $1
          WHERE id = $2 AND tenant_id = $3
        `, [item.quantityReceived, item.lineId, ctx.tenantId]);

        // Check if fully received
        const lineResult = await client.query(`
          SELECT quantity, quantity_received FROM purchase.order_lines
          WHERE id = $1 AND tenant_id = $2
        `, [item.lineId, ctx.tenantId]);

        const line = lineResult.rows[0];
        if (line && line.quantity_received < line.quantity) {
          allReceived = false;
        }
      }

      // Update order status
      const newStatus = allReceived ? 'received' : 'partial';
      await client.query(`
        UPDATE ${this.fullTableName}
        SET status = $1, updated_at = NOW(), updated_by = $2
        WHERE id = $3 AND tenant_id = $4
      `, [newStatus, ctx.userId, orderId, ctx.tenantId]);

      await this.commitTransaction(client);
      return this.findById(ctx, orderId);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get purchase summary
   */
  async getPurchaseSummary(ctx: TenantContext, startDate: Date, endDate: Date): Promise<{
    total_orders: number;
    total_amount: number;
    average_order_value: number;
    orders_by_status: Record<string, number>;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_amount,
        COALESCE(AVG(total), 0) as average_order_value
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
export const purchaseOrderRepository = new PurchaseOrderRepository();
export default purchaseOrderRepository;
