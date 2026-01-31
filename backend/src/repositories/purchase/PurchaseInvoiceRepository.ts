/**
 * Purchase Invoice Repository
 * 
 * Handles all database operations for supplier/purchase invoices
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type PurchaseInvoiceStatus = 'draft' | 'received' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export interface PurchaseInvoice {
  invoice_id: number;
  tenant_id: string;
  invoice_number: string;
  supplier_id?: number;
  po_id?: number;
  gr_id?: number;
  invoice_date: Date;
  due_date?: Date;
  status: PurchaseInvoiceStatus;
  subtotal: number;
  discount_amount?: number;
  vat_rate?: number;
  vat_amount?: number;
  total_amount: number;
  amount_paid: number;
  amount_outstanding?: number;
  currency_code?: string;
  notes?: string;
  created_at: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
  deleted_at?: Date;
}

export class PurchaseInvoiceRepository extends BaseRepository<PurchaseInvoice> {
  protected tableName = 'vendor_invoices';
  protected schema = 'purchase';
  protected primaryKey = 'invoice_id';
  protected softDelete = false;

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(
    ctx: TenantContext,
    status: PurchaseInvoiceStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PurchaseInvoice>> {
    return this.findAll(ctx, { status }, pagination);
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaidInvoices(ctx: TenantContext, supplierId?: string): Promise<PurchaseInvoice[]> {
    let sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND status NOT IN ('paid', 'cancelled')
    `;
    const params: any[] = [];

    if (supplierId) {
      sql += ` AND supplier_id = $2`;
      params.push(supplierId);
    }

    sql += ` ORDER BY due_date ASC`;

    return this.rawQuery(ctx, sql, params);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(ctx: TenantContext): Promise<PurchaseInvoice[]> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND due_date < CURRENT_DATE
        AND status NOT IN ('paid', 'cancelled')
      ORDER BY due_date ASC
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Record a payment
   */
  async recordPayment(
    ctx: TenantContext,
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    reference?: string
  ): Promise<PurchaseInvoice | null> {
    const client = await this.beginTransaction();

    try {
      const invoiceResult = await client.query(`
        SELECT * FROM ${this.fullTableName}
        WHERE ${this.primaryKey} = $1 AND tenant_id = $2
      `, [invoiceId, ctx.tenantId]);

      const invoice = invoiceResult.rows[0];
      if (!invoice) {
        await this.rollbackTransaction(client);
        return null;
      }

      const newAmountPaid = parseFloat(invoice.amount_paid) + amount;
      const currentOutstanding = invoice.amount_outstanding ?? (parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0));
      const newBalanceDue = currentOutstanding - amount;
      
      let newStatus: PurchaseInvoiceStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      await client.query(`
        UPDATE ${this.fullTableName}
        SET amount_paid = $1, amount_outstanding = $2, status = $3, updated_at = NOW(), updated_by = $4
        WHERE ${this.primaryKey} = $5 AND tenant_id = $6
      `, [newAmountPaid, Math.max(0, newBalanceDue), newStatus, ctx.userId, invoiceId, ctx.tenantId]);

      // Record payment
      await client.query(`
        INSERT INTO purchase.vendor_payments
        (tenant_id, invoice_id, supplier_id, amount, payment_date, payment_method, reference, created_by)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7)
      `, [ctx.tenantId, invoiceId, invoice.supplier_id, amount, paymentMethod, reference, ctx.userId]);

      await this.commitTransaction(client);
      return this.findById(ctx, invoiceId);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get accounts payable aging
   */
  async getAgingReport(ctx: TenantContext): Promise<{
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
    total: number;
  }> {
    const sql = `
      SELECT
        COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE THEN amount_outstanding ELSE 0 END), 0) as current,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - 30 THEN amount_outstanding ELSE 0 END), 0) as days_1_30,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 30 AND due_date >= CURRENT_DATE - 60 THEN amount_outstanding ELSE 0 END), 0) as days_31_60,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 60 AND due_date >= CURRENT_DATE - 90 THEN amount_outstanding ELSE 0 END), 0) as days_61_90,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 90 THEN amount_outstanding ELSE 0 END), 0) as over_90,
        COALESCE(SUM(amount_outstanding), 0) as total
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND status NOT IN ('paid', 'cancelled')
    `;

    const result = await this.rawQuery(ctx, sql);
    return {
      current: parseFloat(result[0]?.current || '0'),
      days_1_30: parseFloat(result[0]?.days_1_30 || '0'),
      days_31_60: parseFloat(result[0]?.days_31_60 || '0'),
      days_61_90: parseFloat(result[0]?.days_61_90 || '0'),
      over_90: parseFloat(result[0]?.over_90 || '0'),
      total: parseFloat(result[0]?.total || '0')
    };
  }

  /**
   * Create from purchase order
   */
  async createFromOrder(
    ctx: TenantContext,
    orderId: string,
    supplierInvoiceNumber: string
  ): Promise<PurchaseInvoice> {
    const client = await this.beginTransaction();

    try {
      const orderResult = await client.query(`
        SELECT * FROM purchase.purchase_orders
        WHERE po_id = $1 AND tenant_id = $2
      `, [orderId, ctx.tenantId]);

      const order = orderResult.rows[0];
      if (!order) throw new Error('Order not found');

      // Generate invoice number
      const numResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
        FROM ${this.fullTableName}
        WHERE tenant_id = $1
      `, [ctx.tenantId]);
      const invoiceNumber = `PI-${String(numResult.rows[0].next_num).padStart(6, '0')}`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (order.payment_terms || 30));

      const invoiceResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, invoice_number, supplier_id, po_id,
         invoice_date, due_date, status, subtotal, discount_amount, vat_rate, vat_amount,
         total_amount, amount_paid, amount_outstanding, currency_code, created_by)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'received', $6, $7, $8, $9, $10, 0, $10, $11, $12)
        RETURNING *
      `, [
        ctx.tenantId,
        invoiceNumber,
        order.supplier_id,
        orderId,
        dueDate,
        order.subtotal || 0,
        order.discount_amount || 0,
        order.vat_rate || 15,
        order.vat_amount || 0,
        order.total || 0,
        order.currency_code || 'ZAR',
        ctx.userId
      ]);

      await this.commitTransaction(client);
      return invoiceResult.rows[0];
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Singleton instance
export const purchaseInvoiceRepository = new PurchaseInvoiceRepository();
export default purchaseInvoiceRepository;
