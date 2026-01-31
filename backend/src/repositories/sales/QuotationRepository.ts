/**
 * Quotation Repository
 * 
 * Handles all database operations for sales quotations/quotes
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuotationLine {
  id: string;
  quotation_id: string;
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

export interface Quotation {
  id: string;
  tenant_id: string;
  quote_number: string;
  customer_id: string;
  customer_name?: string;
  quote_date: Date;
  expiry_date: Date;
  status: QuotationStatus;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  currency_code: string;
  notes?: string;
  terms_and_conditions?: string;
  sales_rep_id?: string;
  lines?: QuotationLine[];
  converted_order_id?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class QuotationRepository extends BaseRepository<Quotation> {
  protected tableName = 'quotations';
  protected schema = 'sales';
  protected softDelete = false;  // Table doesn't have deleted_at column

  /**
   * Get quotations by status
   */
  async getQuotationsByStatus(
    ctx: TenantContext,
    status: QuotationStatus,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Quotation>> {
    return this.findAll(ctx, { status }, pagination);
  }

  /**
   * Get quotation with lines
   */
  async getQuotationWithLines(ctx: TenantContext, quotationId: string): Promise<Quotation | null> {
    const quotation = await this.findById(ctx, quotationId);
    if (!quotation) return null;

    const linesSql = `
      SELECT ql.*, i.code as item_code, i.name as item_name
      FROM sales.quotation_lines ql
      LEFT JOIN inventory.items i ON i.id = ql.item_id
      WHERE ql.quotation_id = $2 AND ql.tenant_id = $1
      ORDER BY ql.line_number
    `;

    const lines = await this.rawQuery<QuotationLine>(ctx, linesSql, [quotationId]);
    return { ...quotation, lines };
  }

  /**
   * Get expiring quotations (within X days)
   */
  async getExpiringQuotations(ctx: TenantContext, withinDays: number = 7): Promise<Quotation[]> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND status IN ('draft', 'sent')
        AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
      ORDER BY expiry_date ASC
    `;

    return this.rawQuery(ctx, sql, [withinDays]);
  }

  /**
   * Convert quotation to sales order
   */
  async convertToOrder(ctx: TenantContext, quotationId: string): Promise<string> {
    const client = await this.beginTransaction();

    try {
      // Get quotation with lines
      const quotation = await this.getQuotationWithLines(ctx, quotationId);
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      if (quotation.status === 'converted') {
        throw new Error('Quotation already converted');
      }

      // Generate order number
      const orderNumResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
        FROM sales.orders
        WHERE tenant_id = $1
      `, [ctx.tenantId]);
      const orderNumber = `SO-${String(orderNumResult.rows[0].next_num).padStart(6, '0')}`;

      // Create order
      const orderResult = await client.query(`
        INSERT INTO sales.orders
        (tenant_id, order_number, customer_id, order_date, status,
         subtotal, discount_amount, tax_amount, total_amount,
         currency_code, notes, sales_rep_id, quotation_id, created_by)
        VALUES ($1, $2, $3, CURRENT_DATE, 'draft', $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        ctx.tenantId, orderNumber, quotation.customer_id,
        quotation.subtotal, quotation.discount_amount, quotation.tax_amount, quotation.total_amount,
        quotation.currency_code, quotation.notes, quotation.sales_rep_id, quotationId, ctx.userId
      ]);

      const orderId = orderResult.rows[0].id;

      // Copy lines
      if (quotation.lines && quotation.lines.length > 0) {
        for (let i = 0; i < quotation.lines.length; i++) {
          const line = quotation.lines[i];
          await client.query(`
            INSERT INTO sales.order_lines
            (tenant_id, order_id, line_number, item_id, quantity, unit_price,
             discount_percent, discount_amount, tax_rate, tax_amount, line_total, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            ctx.tenantId, orderId, i + 1, line.item_id, line.quantity, line.unit_price,
            line.discount_percent, line.discount_amount, line.tax_rate, line.tax_amount,
            line.line_total, line.description
          ]);
        }
      }

      // Update quotation status
      await client.query(`
        UPDATE ${this.fullTableName}
        SET status = 'converted', converted_order_id = $1, updated_at = NOW(), updated_by = $2
        WHERE id = $3 AND tenant_id = $4
      `, [orderId, ctx.userId, quotationId, ctx.tenantId]);

      await this.commitTransaction(client);
      return orderId;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Get quotation conversion rate
   */
  async getConversionRate(ctx: TenantContext, startDate: Date, endDate: Date): Promise<{
    total_quotations: number;
    converted_quotations: number;
    conversion_rate: number;
    total_value: number;
    converted_value: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_quotations,
        COALESCE(SUM(total_amount), 0) as total_value,
        COALESCE(SUM(CASE WHEN status = 'converted' THEN total_amount ELSE 0 END), 0) as converted_value
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND quote_date BETWEEN $2 AND $3
    `;

    const result = await this.rawQuery(ctx, sql, [startDate, endDate]);
    const data = result[0];

    const total = parseInt(data.total_quotations || '0', 10);
    const converted = parseInt(data.converted_quotations || '0', 10);

    return {
      total_quotations: total,
      converted_quotations: converted,
      conversion_rate: total > 0 ? (converted / total) * 100 : 0,
      total_value: parseFloat(data.total_value || '0'),
      converted_value: parseFloat(data.converted_value || '0')
    };
  }

  /**
   * Generate next quote number
   */
  async generateQuoteNumber(ctx: TenantContext): Promise<string> {
    const result = await this.pool.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
      FROM ${this.fullTableName}
      WHERE tenant_id = $1
    `, [ctx.tenantId]);

    const nextNum = result.rows[0].next_num;
    return `QT-${String(nextNum).padStart(6, '0')}`;
  }

  /**
   * Create quotation with lines
   */
  async createQuotationWithLines(
    ctx: TenantContext,
    quotationData: Partial<Quotation>,
    lines: Partial<QuotationLine>[]
  ): Promise<Quotation> {
    const client = await this.beginTransaction();

    try {
      const quoteNumber = await this.generateQuoteNumber(ctx);

      const quotationResult = await client.query(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, quote_number, customer_id, quote_date, expiry_date, status,
         subtotal, discount_amount, tax_amount, total_amount, currency_code,
         notes, terms_and_conditions, sales_rep_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        ctx.tenantId,
        quoteNumber,
        quotationData.customer_id,
        quotationData.quote_date || new Date(),
        quotationData.expiry_date || new Date(),
        quotationData.status || 'draft',
        quotationData.subtotal || 0,
        quotationData.discount_amount || 0,
        quotationData.tax_amount || 0,
        quotationData.total_amount || 0,
        quotationData.currency_code || 'ZAR',
        quotationData.notes,
        quotationData.terms_and_conditions,
        quotationData.sales_rep_id,
        ctx.userId
      ]);

      const quotation = quotationResult.rows[0];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO sales.quotation_lines
          (tenant_id, quotation_id, line_number, item_id, description, quantity, unit_price,
           discount_percent, discount_amount, tax_rate, tax_amount, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          ctx.tenantId,
          quotation.id,
          i + 1,
          line.item_id,
          line.description,
          line.quantity,
          line.unit_price,
          line.discount_percent || 0,
          line.discount_amount || 0,
          line.tax_rate || 0,
          line.tax_amount || 0,
          line.line_total || 0
        ]);
      }

      await this.commitTransaction(client);
      return quotation;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

// Singleton instance
export const quotationRepository = new QuotationRepository();
export default quotationRepository;
