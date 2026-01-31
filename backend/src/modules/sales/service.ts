/**
 * Sales Invoice Service
 * Handles CRUD operations for sales invoices
 */

import pool from '../../config/database';

export interface SalesInvoiceLine {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  vat_rate?: number;
  vat_amount?: number;
  revenue_account_id?: string;
}

export interface CreateInvoiceDto {
  customer_id: number;
  invoice_date: string;
  due_date: string;
  reference?: string;
  notes?: string;
  lines: SalesInvoiceLine[];
  tenant_id?: string;
}

export interface UpdateInvoiceDto {
  invoice_date?: string;
  due_date?: string;
  reference?: string;
  notes?: string;
  lines?: SalesInvoiceLine[];
}

export interface InvoiceFilters {
  status?: string;
  customer_id?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export class SalesService {
  
  /**
   * Create a new sales invoice (DRAFT status)
   */
  async createInvoice(dto: CreateInvoiceDto, userId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tenantId = dto.tenant_id || '00000000-0000-0000-0000-000000000001';
      
      // Calculate totals
      const subtotal = dto.lines.reduce((sum, line) => sum + line.line_total, 0);
      const vat_total = dto.lines.reduce((sum, line) => sum + (line.vat_amount || 0), 0);
      const total_amount = subtotal + vat_total;
      
      // Generate invoice number
      const invoiceNumberResult = await client.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-([0-9]+)') AS INTEGER)), 0) + 1 as next_number
         FROM sales_invoices 
         WHERE tenant_id = $1`,
        [tenantId]
      );
      const nextNumber = invoiceNumberResult.rows[0].next_number;
      const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`;
      
      // Create invoice (balance_due is a generated column, don't insert it)
      const invoiceResult = await client.query(
        `INSERT INTO sales_invoices (
          tenant_id, customer_id, invoice_number, invoice_date, due_date,
          subtotal, vat_total, tax_amount, total_amount, amount_paid,
          status, reference, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          tenantId, dto.customer_id, invoiceNumber, dto.invoice_date, dto.due_date,
          subtotal, vat_total, vat_total, total_amount, 0,
          'DRAFT', dto.reference, dto.notes, userId
        ]
      );
      
      const invoice = invoiceResult.rows[0];
      
      // Create invoice lines
      for (const line of dto.lines) {
        await client.query(
          `INSERT INTO sales_invoice_lines (
            invoice_id, line_number, description, quantity, unit_price,
            line_total, vat_rate, vat_amount, revenue_account_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            invoice.id, line.line_number, line.description,
            line.quantity, line.unit_price, line.line_total,
            line.vat_rate || 0, line.vat_amount || 0,
            line.revenue_account_id
          ]
        );
      }
      
      await client.query('COMMIT');
      
      // Return invoice with lines
      return await this.getInvoiceById(invoice.id, tenantId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string, tenantId: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      // Get invoice
      const invoiceResult = await client.query(
        `SELECT 
          si.*,
          c.customer_code,
          c.company_name as customer_name,
          c.email,
          c.phone,
          c.billing_address,
          u.first_name || ' ' || u.last_name as created_by_name
        FROM sales_invoices si
        LEFT JOIN sales.customers c ON si.customer_id = c.customer_id
        LEFT JOIN users u ON si.created_by = u.id
        WHERE si.id = $1 AND si.tenant_id = $2`,
        [invoiceId, tenantId]
      );
      
      if (invoiceResult.rows.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Get lines
      const linesResult = await client.query(
        `SELECT 
          sil.*,
          coa.account_code,
          coa.account_name
        FROM sales_invoice_lines sil
        LEFT JOIN chart_of_accounts coa ON sil.revenue_account_id = coa.account_id
        WHERE sil.invoice_id = $1
        ORDER BY sil.line_number`,
        [invoiceId]
      );
      
      invoice.lines = linesResult.rows;
      
      // Get payments
      const paymentsResult = await client.query(
        `SELECT * FROM invoice_payments
        WHERE id = $1
        ORDER BY payment_date DESC`,
        [invoiceId]
      );
      
      invoice.payments = paymentsResult.rows;
      
      return invoice;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * List invoices with filters
   */
  async listInvoices(filters: InvoiceFilters, tenantId: string, page = 1, limit = 50): Promise<any> {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE si.tenant_id = $1';
      const params: any[] = [tenantId];
      let paramIndex = 2;
      
      if (filters.status) {
        whereClause += ` AND si.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      
      if (filters.customer_id) {
        whereClause += ` AND si.customer_id = $${paramIndex}`;
        params.push(filters.customer_id);
        paramIndex++;
      }
      
      if (filters.from_date) {
        whereClause += ` AND si.invoice_date >= $${paramIndex}`;
        params.push(filters.from_date);
        paramIndex++;
      }
      
      if (filters.to_date) {
        whereClause += ` AND si.invoice_date <= $${paramIndex}`;
        params.push(filters.to_date);
        paramIndex++;
      }
      
      if (filters.search) {
        whereClause += ` AND (
          si.invoice_number ILIKE $${paramIndex} OR 
          c.customer_name ILIKE $${paramIndex} OR
          si.reference ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) as total
        FROM sales_invoices si
        LEFT JOIN customers c ON si.customer_id = c.customer_id
        ${whereClause}`,
        params
      );
      
      const total = parseInt(countResult.rows[0].total);
      
      // Get invoices
      const offset = (page - 1) * limit;
      const invoicesResult = await client.query(
        `SELECT 
          si.id as invoice_id,
          si.invoice_number,
          si.invoice_date,
          si.due_date,
          si.customer_id,
          c.customer_code,
          c.company_name as customer_name,
          si.subtotal,
          si.tax_amount as vat_total,
          si.total_amount,
          si.amount_paid,
          si.balance_due,
          si.status,
          si.reference,
          si.created_at
        FROM sales_invoices si
        LEFT JOIN sales.customers c ON si.customer_id = c.customer_id
        ${whereClause}
        ORDER BY si.invoice_date DESC, si.id DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );
      
      return {
        data: invoicesResult.rows,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        }
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Update invoice (only DRAFT status can be updated)
   */
  async updateInvoice(invoiceId: string, dto: UpdateInvoiceDto, tenantId: string, userId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM sales_invoices WHERE id = $1 AND tenant_id = $2',
        [invoiceId, tenantId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      if (checkResult.rows[0].status !== 'DRAFT') {
        throw new Error('Only DRAFT invoices can be updated');
      }
      
      // Update invoice header if provided
      if (dto.invoice_date || dto.due_date || dto.reference || dto.notes) {
        const updateFields: string[] = [];
        const updateParams: any[] = [];
        let paramIndex = 1;
        
        if (dto.invoice_date) {
          updateFields.push(`invoice_date = $${paramIndex}`);
          updateParams.push(dto.invoice_date);
          paramIndex++;
        }
        
        if (dto.due_date) {
          updateFields.push(`due_date = $${paramIndex}`);
          updateParams.push(dto.due_date);
          paramIndex++;
        }
        
        if (dto.reference !== undefined) {
          updateFields.push(`reference = $${paramIndex}`);
          updateParams.push(dto.reference);
          paramIndex++;
        }
        
        if (dto.notes !== undefined) {
          updateFields.push(`notes = $${paramIndex}`);
          updateParams.push(dto.notes);
          paramIndex++;
        }
        
        updateFields.push(`updated_by = $${paramIndex}`);
        updateParams.push(userId);
        paramIndex++;
        
        updateFields.push(`updated_at = NOW()`);
        
        updateParams.push(invoiceId, tenantId);
        
        await client.query(
          `UPDATE sales_invoices SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}`,
          updateParams
        );
      }
      
      // Update lines if provided
      if (dto.lines) {
        // Delete existing lines
        await client.query(
          'DELETE FROM sales_invoice_lines WHERE invoice_id = $1',
          [invoiceId]
        );
        
        // Insert new lines
        const subtotal = dto.lines.reduce((sum, line) => sum + line.line_total, 0);
        const vat_total = dto.lines.reduce((sum, line) => sum + (line.vat_amount || 0), 0);
        const total_amount = subtotal + vat_total;
        
        for (const line of dto.lines) {
          await client.query(
            `INSERT INTO sales_invoice_lines (
              invoice_id, line_number, description, quantity, unit_price,
              line_total, vat_rate, vat_amount, revenue_account_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              invoiceId, line.line_number, line.description,
              line.quantity, line.unit_price, line.line_total,
              line.vat_rate || 0, line.vat_amount || 0,
              line.revenue_account_id
            ]
          );
        }
        
        // Update totals
        await client.query(
          `UPDATE sales_invoices SET
            subtotal = $1,
            vat_total = $2,
            total_amount = $3,
            balance_due = $3 - amount_paid,
            updated_at = NOW(),
            updated_by = $4
          WHERE id = $5 AND tenant_id = $6`,
          [subtotal, vat_total, total_amount, userId, invoiceId, tenantId]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.getInvoiceById(invoiceId, tenantId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Post invoice to GL (change status from DRAFT to POSTED)
   */
  async postInvoice(invoiceId: string, tenantId: string, userId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM sales_invoices WHERE id = $1 AND tenant_id = $2',
        [invoiceId, tenantId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      if (checkResult.rows[0].status !== 'DRAFT') {
        throw new Error('Only DRAFT invoices can be posted');
      }
      
      // Update status to POSTED (trigger will fire and create GL entries)
      await client.query(
        `UPDATE sales_invoices SET
          status = 'POSTED',
          posted_at = NOW(),
          posted_by = $1,
          updated_at = NOW(),
          updated_by = $1
        WHERE id = $2 AND tenant_id = $3`,
        [userId, invoiceId, tenantId]
      );
      
      await client.query('COMMIT');
      
      return await this.getInvoiceById(invoiceId, tenantId);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete invoice (only DRAFT status can be deleted - soft delete)
   */
  async deleteInvoice(invoiceId: string, tenantId: string, userId?: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM sales_invoices WHERE id = $1 AND tenant_id = $2',
        [invoiceId, tenantId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      if (checkResult.rows[0].status !== 'DRAFT') {
        throw new Error('Only DRAFT invoices can be deleted');
      }
      
      // Soft delete
      await client.query(
        `UPDATE sales_invoices SET
          status = 'CANCELLED',
          updated_at = NOW(),
          updated_by = $1
        WHERE id = $2 AND tenant_id = $3`,
        [userId, invoiceId, tenantId]
      );
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new SalesService();
