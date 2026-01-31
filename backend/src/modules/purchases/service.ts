/**
 * Purchase Invoice Service
 * Handles CRUD operations for purchase invoices
 */

import pool from '../../config/database';

export interface PurchaseInvoiceLine {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  vat_rate?: number;
  vat_amount?: number;
  expense_account_id: number;
}

export interface CreatePurchaseInvoiceDto {
  supplier_id: number;
  supplier_invoice_number?: string;
  invoice_date: string;
  due_date: string;
  reference?: string;
  notes?: string;
  lines: PurchaseInvoiceLine[];
  tenant_id?: string;
}

export interface UpdatePurchaseInvoiceDto {
  invoice_date?: string;
  due_date?: string;
  supplier_invoice_number?: string;
  reference?: string;
  notes?: string;
  lines?: PurchaseInvoiceLine[];
}

export interface PurchaseInvoiceFilters {
  status?: string;
  supplier_id?: number;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export class PurchasesService {
  
  /**
   * Create a new purchase invoice (DRAFT status)
   */
  async createInvoice(dto: CreatePurchaseInvoiceDto, userId?: number): Promise<any> {
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
        `SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'PINV-([0-9]+)') AS INTEGER)), 0) + 1 as next_number
         FROM purchase_invoices 
         WHERE tenant_id = $1`,
        [tenantId]
      );
      const nextNumber = invoiceNumberResult.rows[0].next_number;
      const invoiceNumber = `PINV-${String(nextNumber).padStart(6, '0')}`;
      
      // Get AP and VAT Input accounts
      const accountsResult = await client.query(
        `SELECT 
          (SELECT account_id FROM chart_of_accounts WHERE account_code = '2100' AND tenant_id = $1) as ap_account_id,
          (SELECT account_id FROM chart_of_accounts WHERE account_code = '1450' AND tenant_id = $1) as vat_input_account_id`,
        [tenantId]
      );
      
      const { ap_account_id, vat_input_account_id } = accountsResult.rows[0];
      
      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO purchase_invoices (
          tenant_id, supplier_id, invoice_number, supplier_invoice_number, 
          invoice_date, due_date, subtotal, vat_total, total_amount, 
          amount_paid, balance_due, status, ap_account_id, vat_input_account_id,
          reference, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          tenantId, dto.supplier_id, invoiceNumber, dto.supplier_invoice_number,
          dto.invoice_date, dto.due_date, subtotal, vat_total, total_amount,
          0, total_amount, 'DRAFT', ap_account_id, vat_input_account_id,
          dto.reference, dto.notes, userId
        ]
      );
      
      const invoice = invoiceResult.rows[0];
      
      // Create invoice lines
      for (const line of dto.lines) {
        await client.query(
          `INSERT INTO purchase_invoice_lines (
            invoice_id, line_number, description, quantity, unit_price,
            line_total, vat_rate, vat_amount, expense_account_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            invoice.invoice_id, line.line_number, line.description,
            line.quantity, line.unit_price, line.line_total,
            line.vat_rate || 0, line.vat_amount || 0,
            line.expense_account_id
          ]
        );
      }
      
      await client.query('COMMIT');
      
      // Return invoice with lines
      return await this.getInvoiceById(invoice.invoice_id, tenantId);
      
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
  async getInvoiceById(invoiceId: number, tenantId: string): Promise<any> {
    const client = await pool.connect();
    
    try {
      // Get invoice
      const invoiceResult = await client.query(
        `SELECT 
          pi.*,
          s.supplier_code,
          s.supplier_name,
          s.email,
          s.phone,
          s.billing_address,
          u.username as created_by_name
        FROM purchase_invoices pi
        LEFT JOIN suppliers s ON pi.supplier_id = s.supplier_id
        LEFT JOIN users u ON pi.created_by = u.id
        WHERE pi.invoice_id = $1 AND pi.tenant_id = $2`,
        [invoiceId, tenantId]
      );
      
      if (invoiceResult.rows.length === 0) {
        return null;
      }
      
      const invoice = invoiceResult.rows[0];
      
      // Get lines
      const linesResult = await client.query(
        `SELECT 
          pil.*,
          coa.account_code,
          coa.account_name
        FROM purchase_invoice_lines pil
        LEFT JOIN chart_of_accounts coa ON pil.expense_account_id = coa.account_id
        WHERE pil.invoice_id = $1
        ORDER BY pil.line_number`,
        [invoiceId]
      );
      
      invoice.lines = linesResult.rows;
      
      // Get payments
      const paymentsResult = await client.query(
        `SELECT * FROM supplier_payments
        WHERE invoice_id = $1
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
  async listInvoices(filters: PurchaseInvoiceFilters, tenantId: string, page = 1, limit = 50): Promise<any> {
    const client = await pool.connect();
    
    try {
      let whereClause = 'WHERE pi.tenant_id = $1';
      const params: any[] = [tenantId];
      let paramIndex = 2;
      
      if (filters.status) {
        whereClause += ` AND pi.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      
      if (filters.supplier_id) {
        whereClause += ` AND pi.supplier_id = $${paramIndex}`;
        params.push(filters.supplier_id);
        paramIndex++;
      }
      
      if (filters.from_date) {
        whereClause += ` AND pi.invoice_date >= $${paramIndex}`;
        params.push(filters.from_date);
        paramIndex++;
      }
      
      if (filters.to_date) {
        whereClause += ` AND pi.invoice_date <= $${paramIndex}`;
        params.push(filters.to_date);
        paramIndex++;
      }
      
      if (filters.search) {
        whereClause += ` AND (
          pi.invoice_number ILIKE $${paramIndex} OR 
          pi.supplier_invoice_number ILIKE $${paramIndex} OR
          s.supplier_name ILIKE $${paramIndex} OR
          pi.reference ILIKE $${paramIndex}
        )`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }
      
      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) as total
        FROM purchase_invoices pi
        LEFT JOIN suppliers s ON pi.supplier_id = s.supplier_id
        ${whereClause}`,
        params
      );
      
      const total = parseInt(countResult.rows[0].total);
      
      // Get invoices
      const offset = (page - 1) * limit;
      const invoicesResult = await client.query(
        `SELECT 
          pi.invoice_id,
          pi.invoice_number,
          pi.supplier_invoice_number,
          pi.invoice_date,
          pi.due_date,
          pi.supplier_id,
          s.supplier_code,
          s.supplier_name,
          pi.subtotal,
          pi.vat_total,
          pi.total_amount,
          pi.amount_paid,
          pi.balance_due,
          pi.status,
          pi.payment_status,
          pi.reference,
          pi.created_at
        FROM purchase_invoices pi
        LEFT JOIN suppliers s ON pi.supplier_id = s.supplier_id
        ${whereClause}
        ORDER BY pi.invoice_date DESC, pi.invoice_id DESC
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
  async updateInvoice(invoiceId: number, dto: UpdatePurchaseInvoiceDto, tenantId: string, userId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM purchase_invoices WHERE invoice_id = $1 AND tenant_id = $2',
        [invoiceId, tenantId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }
      
      if (checkResult.rows[0].status !== 'DRAFT') {
        throw new Error('Only DRAFT invoices can be updated');
      }
      
      // Update invoice header if provided
      if (dto.invoice_date || dto.due_date || dto.supplier_invoice_number || dto.reference || dto.notes) {
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
        
        if (dto.supplier_invoice_number !== undefined) {
          updateFields.push(`supplier_invoice_number = $${paramIndex}`);
          updateParams.push(dto.supplier_invoice_number);
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
          `UPDATE purchase_invoices SET ${updateFields.join(', ')}
          WHERE invoice_id = $${paramIndex} AND tenant_id = $${paramIndex + 1}`,
          updateParams
        );
      }
      
      // Update lines if provided
      if (dto.lines) {
        // Delete existing lines
        await client.query(
          'DELETE FROM purchase_invoice_lines WHERE invoice_id = $1',
          [invoiceId]
        );
        
        // Insert new lines
        const subtotal = dto.lines.reduce((sum, line) => sum + line.line_total, 0);
        const vat_total = dto.lines.reduce((sum, line) => sum + (line.vat_amount || 0), 0);
        const total_amount = subtotal + vat_total;
        
        for (const line of dto.lines) {
          await client.query(
            `INSERT INTO purchase_invoice_lines (
              invoice_id, line_number, description, quantity, unit_price,
              line_total, vat_rate, vat_amount, expense_account_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              invoiceId, line.line_number, line.description,
              line.quantity, line.unit_price, line.line_total,
              line.vat_rate || 0, line.vat_amount || 0,
              line.expense_account_id
            ]
          );
        }
        
        // Update totals
        await client.query(
          `UPDATE purchase_invoices SET
            subtotal = $1,
            vat_total = $2,
            total_amount = $3,
            balance_due = $3 - amount_paid,
            updated_at = NOW(),
            updated_by = $4
          WHERE invoice_id = $5 AND tenant_id = $6`,
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
  async postInvoice(invoiceId: number, tenantId: string, userId?: number): Promise<any> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM purchase_invoices WHERE invoice_id = $1 AND tenant_id = $2',
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
        `UPDATE purchase_invoices SET
          status = 'POSTED',
          posted_at = NOW(),
          posted_by = $1,
          updated_at = NOW(),
          updated_by = $1
        WHERE invoice_id = $2 AND tenant_id = $3`,
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
  async deleteInvoice(invoiceId: number, tenantId: string, userId?: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if invoice is DRAFT
      const checkResult = await client.query(
        'SELECT status FROM purchase_invoices WHERE invoice_id = $1 AND tenant_id = $2',
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
        `UPDATE purchase_invoices SET
          status = 'CANCELLED',
          updated_at = NOW(),
          updated_by = $1
        WHERE invoice_id = $2 AND tenant_id = $3`,
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

export default new PurchasesService();
