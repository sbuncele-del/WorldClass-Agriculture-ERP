/**
 * Invoice Repository
 * 
 * Handles all database operations for sales invoices
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void';

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  order_id?: string;
  invoice_date: Date;
  due_date: Date;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  currency_code: string;
  exchange_rate?: number;
  payment_terms?: number;
  notes?: string;
  terms_and_conditions?: string;
  lines?: InvoiceLine[];
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class InvoiceRepository extends BaseRepository<Invoice> {
  protected tableName = 'sales_invoices';
  protected schema = 'public';
  protected softDelete = false;  // Table doesn't have deleted_at column

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(
    ctx: TenantContext,
    status: InvoiceStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    return this.findAll(ctx, { status }, pagination);
  }

  /**
   * Get invoice with lines
   */
  async getInvoiceWithLines(ctx: TenantContext, invoiceId: string): Promise<Invoice | null> {
    const invoice = await this.findById(ctx, invoiceId);
    if (!invoice) return null;

    const linesSql = `
      SELECT il.*
      FROM sales_invoice_lines il
      WHERE il.invoice_id = $2 AND il.tenant_id = $1
      ORDER BY il.line_number
    `;

    const lines = await this.rawQuery<InvoiceLine>(ctx, linesSql, [invoiceId]);
    return { ...invoice, lines };
  }

  /**
   * Get unpaid invoices for a customer
   */
  async getUnpaidInvoices(ctx: TenantContext, customerId?: string): Promise<Invoice[]> {
    let sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND status NOT IN ('paid', 'cancelled', 'void')
    `;
    const params: any[] = [];

    if (customerId) {
      sql += ` AND customer_id = $2`;
      params.push(customerId);
    }

    sql += ` ORDER BY due_date ASC`;

    return this.rawQuery(ctx, sql, params);
  }

  /**
   * Get invoices for a specific customer with pagination
   */
  async getCustomerInvoices(
    ctx: TenantContext,
    customerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    return this.findAll(ctx, { customer_id: customerId }, pagination);
  }

  /**
   * Get invoices within a date range
   */
  async getInvoicesByDateRange(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>> {
    const { page = 1, limit = 50, sortBy = 'invoice_date', sortOrder = 'DESC' } = pagination || {};
    const offset = (page - 1) * limit;

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND invoice_date BETWEEN $2 AND $3
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $4 OFFSET $5
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND invoice_date BETWEEN $2 AND $3
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<Invoice>(ctx, sql, [startDate, endDate, limit, offset]),
      this.rawQuery<{ count: string }>(ctx, countSql, [startDate, endDate])
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Create invoice with lines
   */
  async createInvoiceWithLines(
    ctx: TenantContext,
    invoiceData: Partial<Invoice>,
    lines: Partial<InvoiceLine>[]
  ): Promise<Invoice> {
    const client = await this.beginTransaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber(ctx);

      const invoiceResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, invoice_number, customer_id, invoice_date, due_date, status,
         subtotal, tax_amount, total_amount, amount_paid, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        ctx.tenantId,
        invoiceNumber,
        invoiceData.customer_id,
        invoiceData.invoice_date || new Date(),
        invoiceData.due_date || new Date(),
        invoiceData.status?.toUpperCase() || 'DRAFT',
        invoiceData.subtotal || 0,
        invoiceData.tax_amount || 0,
        invoiceData.total_amount || 0,
        invoiceData.amount_paid || 0,
        invoiceData.notes,
        ctx.userId
      ]);

      const invoice = invoiceResult.rows[0];

      // Insert lines - matches actual sales_invoice_lines schema
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO sales_invoice_lines
          (tenant_id, invoice_id, line_number, description, quantity, unit_price, line_total, vat_rate, vat_amount)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          ctx.tenantId,
          invoice.id,  // Table uses 'id' as primary key
          i + 1,
          line.description || 'Service',
          line.quantity || 1,
          line.unit_price || 0,
          line.line_total || (line.quantity || 1) * (line.unit_price || 0),
          line.tax_rate || 15,  // Maps to vat_rate
          line.tax_amount || 0   // Maps to vat_amount
        ]);
      }

      await this.commitTransaction(client);
      return invoice;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Sales report grouped by period or customer
   */
  async getSalesReport(
    ctx: TenantContext,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' | 'customer' = 'day'
  ): Promise<any[]> {
    const groupExpression = groupBy === 'customer'
      ? 'customer_id'
      : `DATE_TRUNC('${groupBy}', invoice_date)`;

    const sql = `
      SELECT ${groupExpression} as period,
             SUM(total_amount) as total_amount,
             SUM(tax_amount) as tax_amount,
             SUM(discount_amount) as discount_amount,
             SUM(balance_due) as balance_due,
             COUNT(*) as invoice_count
      FROM ${this.fullTableName}
      WHERE tenant_id = $1
        AND deleted_at IS NULL
        AND invoice_date BETWEEN $2 AND $3
      GROUP BY period
      ORDER BY period ASC
    `;

    return this.rawQuery(ctx, sql, [startDate, endDate]);
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(ctx: TenantContext): Promise<Invoice[]> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND due_date < CURRENT_DATE
        AND status NOT IN ('paid', 'cancelled', 'void')
      ORDER BY due_date ASC
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(
    ctx: TenantContext,
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    reference?: string
  ): Promise<Invoice | null> {
    const client = await this.beginTransaction();

    try {
      // Get current invoice
      const invoiceResult = await client.query(`
        SELECT * FROM ${this.fullTableName}
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `, [invoiceId, ctx.tenantId]);

      const invoice = invoiceResult.rows[0];
      if (!invoice) {
        await this.rollbackTransaction(client);
        return null;
      }

      const newAmountPaid = parseFloat(invoice.amount_paid) + amount;
      const newBalanceDue = parseFloat(invoice.total_amount) - newAmountPaid;
      
      let newStatus: InvoiceStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      // Update invoice (balance_due is generated, only update amount_paid)
      await client.query(`
        UPDATE ${this.fullTableName}
        SET amount_paid = $1, status = $2, updated_at = NOW(), updated_by = $3
        WHERE id = $4 AND tenant_id = $5
      `, [newAmountPaid, newStatus, ctx.userId, invoiceId, ctx.tenantId]);

      // Record payment
      await client.query(`
        INSERT INTO payments
        (tenant_id, invoice_id, customer_id, amount, payment_date, payment_method, reference, created_by)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7)
      `, [ctx.tenantId, invoiceId, invoice.customer_id, amount, paymentMethod, reference, ctx.userId]);

      await this.commitTransaction(client);

      return this.findById(ctx, invoiceId);
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get invoice aging report
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
        COALESCE(SUM(CASE WHEN due_date >= CURRENT_DATE THEN balance_due ELSE 0 END), 0) as current,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - 30 THEN balance_due ELSE 0 END), 0) as days_1_30,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 30 AND due_date >= CURRENT_DATE - 60 THEN balance_due ELSE 0 END), 0) as days_31_60,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 60 AND due_date >= CURRENT_DATE - 90 THEN balance_due ELSE 0 END), 0) as days_61_90,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE - 90 THEN balance_due ELSE 0 END), 0) as over_90,
        COALESCE(SUM(balance_due), 0) as total
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND status NOT IN ('paid', 'cancelled', 'void')
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
   * Generate next invoice number
   */
  async generateInvoiceNumber(ctx: TenantContext): Promise<string> {
    const result = await this.pool.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
      FROM ${this.fullTableName}
      WHERE tenant_id = $1
    `, [ctx.tenantId]);

    const nextNum = result.rows[0].next_num;
    return `INV-${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Create invoice from sales order
   */
  async createFromOrder(ctx: TenantContext, orderId: string): Promise<Invoice> {
    const client = await this.beginTransaction();

    try {
      // Get order with lines
      const orderResult = await client.query(`
        SELECT * FROM sales_orders
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
      `, [orderId, ctx.tenantId]);

      const order = orderResult.rows[0];
      if (!order) {
        throw new Error('Order not found');
      }

      const invoiceNumber = await this.generateInvoiceNumber(ctx);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (order.payment_terms || 30));

      // Create invoice
      const invoiceResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, invoice_number, customer_id, order_id, invoice_date, due_date, status,
         subtotal, discount_amount, tax_amount, total_amount, amount_paid, balance_due,
         currency_code, payment_terms, notes, created_by)
        VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'draft', $6, $7, $8, $9, 0, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        ctx.tenantId, invoiceNumber, order.customer_id, orderId, dueDate,
        order.subtotal, order.discount_amount, order.tax_amount, order.total_amount,
        order.currency_code, order.payment_terms, order.notes, ctx.userId
      ]);

      const invoice = invoiceResult.rows[0];

      // Copy order lines to invoice lines
      await client.query(`
        INSERT INTO sales_invoice_lines
        (tenant_id, invoice_id, line_number, item_id, description, quantity, unit_price,
         discount_percent, discount_amount, tax_rate, tax_amount, line_total)
        SELECT tenant_id, $1, line_number, item_id, notes, quantity, unit_price,
               discount_percent, discount_amount, tax_rate, tax_amount, line_total
        FROM sales_order_lines
        WHERE order_id = $2 AND tenant_id = $3
      `, [invoice.id, orderId, ctx.tenantId]);

      await this.commitTransaction(client);
      return invoice;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Singleton instance
export const invoiceRepository = new InvoiceRepository();
export default invoiceRepository;
