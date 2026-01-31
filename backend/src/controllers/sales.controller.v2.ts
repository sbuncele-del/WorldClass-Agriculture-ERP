/**
 * SALES MANAGEMENT CONTROLLER (Repository Pattern)
 * 
 * This controller uses the Repository Pattern for automatic multi-tenant isolation.
 * All data operations go through repositories which handle tenant filtering.
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { TenantContext } from '../repositories/BaseRepository';
import {
  customerRepository,
  salesOrderRepository,
  invoiceRepository,
  quotationRepository
} from '../repositories/sales';

/**
 * Helper to extract tenant context from request
 */
function getTenantContext(req: TenantRequest): TenantContext {
  if (!req.tenant) {
    throw new Error('Tenant context not available');
  }
  return {
    tenantId: req.tenant.id,
    userId: req.user?.id
  };
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export const getCustomers = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { search, is_active, customer_type, page, limit } = req.query;

    if (search) {
      const result = await customerRepository.search(ctx, search as string, {
        page: Number(page) || 1,
        limit: Number(limit) || 50
      });
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }

    const filters: Record<string, any> = {};
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (customer_type) filters.customer_type = customer_type;

    const result = await customerRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'company_name',
      sortOrder: 'ASC'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const customer = await customerRepository.getCustomerWithBalance(ctx, id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const customerData = req.body;

    // Check if company name is unique (if provided)
    if (customerData.company_name) {
      const isUnique = await customerRepository.isNameUnique(ctx, customerData.company_name);
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this company name already exists'
        });
      }
    }

    const customer = await customerRepository.create(ctx, customerData);

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const customerData = req.body;

    // Check if company name is unique (excluding this customer)
    if (customerData.company_name) {
      const isUnique = await customerRepository.isNameUnique(ctx, customerData.company_name, parseInt(id));
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this company name already exists'
        });
      }
    }

    const customer = await customerRepository.update(ctx, id, customerData);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Check if customer has orders or invoices
    const orders = await salesOrderRepository.getCustomerOrders(ctx, id, { limit: 1 });
    if (orders.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders'
      });
    }

    const deleted = await customerRepository.delete(ctx, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCustomerOrders = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await salesOrderRepository.getCustomerOrders(ctx, id, {
      page: Number(page) || 1,
      limit: Number(limit) || 50
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCustomerInvoices = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { page, limit } = req.query;

    const result = await invoiceRepository.getCustomerInvoices(ctx, id, {
      page: Number(page) || 1,
      limit: Number(limit) || 50
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// SALES ORDERS
// ============================================================================

export const getSalesOrders = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, customer_id, start_date, end_date, page, limit } = req.query;

    if (start_date && end_date) {
      const result = await salesOrderRepository.getOrdersByDateRange(
        ctx,
        new Date(start_date as string),
        new Date(end_date as string),
        {
          page: Number(page) || 1,
          limit: Number(limit) || 50
        }
      );
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;

    const result = await salesOrderRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'order_date',
      sortOrder: 'DESC'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSalesOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const order = await salesOrderRepository.getOrderWithLines(ctx, id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createSalesOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const orderData = req.body;

    const order = await salesOrderRepository.createOrderWithLines(
      ctx,
      {
        ...orderData,
        status: orderData.status || 'draft'
      },
      orderData.lines || []
    );

    res.status(201).json({
      success: true,
      data: order,
      message: 'Sales order created successfully'
    });
  } catch (error) {
    console.error('Error creating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSalesOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const orderData = req.body;

    // Check if order can be modified
    const existingOrder = await salesOrderRepository.findById(ctx, id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (!['draft', 'confirmed'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify order in current status'
      });
    }

    const order = await salesOrderRepository.update(ctx, id, orderData);

    res.json({
      success: true,
      data: order,
      message: 'Sales order updated successfully'
    });
  } catch (error) {
    console.error('Error updating sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sales order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const confirmSalesOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const existingOrder = await salesOrderRepository.findById(ctx, id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (existingOrder.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft orders can be confirmed'
      });
    }

    const order = await salesOrderRepository.update(ctx, id, { status: 'confirmed' });

    res.json({
      success: true,
      data: order,
      message: 'Sales order confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm sales order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const cancelSalesOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { reason } = req.body;

    const existingOrder = await salesOrderRepository.findById(ctx, id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (['delivered', 'cancelled'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status'
      });
    }

    const order = await salesOrderRepository.update(ctx, id, {
      status: 'cancelled',
      notes: reason ? `${existingOrder.notes || ''}\nCancelled: ${reason}` : existingOrder.notes
    });

    res.json({
      success: true,
      data: order,
      message: 'Sales order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling sales order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sales order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// INVOICES
// ============================================================================

export const getInvoices = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, customer_id, start_date, end_date, overdue, page, limit } = req.query;

    if (overdue === 'true') {
      const invoices = await invoiceRepository.getOverdueInvoices(ctx);
      return res.json({
        success: true,
        data: invoices,
        pagination: { page: 1, limit: invoices.length, total: invoices.length, totalPages: 1 }
      });
    }

    if (start_date && end_date) {
      const result = await invoiceRepository.getInvoicesByDateRange(
        ctx,
        new Date(start_date as string),
        new Date(end_date as string),
        {
          page: Number(page) || 1,
          limit: Number(limit) || 50,
          sortBy: 'invoice_date',
          sortOrder: 'DESC'
        }
      );
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    }

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;

    const result = await invoiceRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'invoice_date',
      sortOrder: 'DESC'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const invoice = await invoiceRepository.getInvoiceWithLines(ctx, id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const invoiceData = req.body;
    const lines = invoiceData.lines || [];

    // Calculate totals from lines
    const subtotal = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.line_total) || 0), 0);
    const taxAmount = lines.reduce((sum: number, line: any) => sum + (parseFloat(line.vat_amount) || 0), 0);
    const totalAmount = subtotal + taxAmount;

    const invoice = await invoiceRepository.createInvoiceWithLines(
      ctx,
      {
        ...invoiceData,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: invoiceData.status || 'draft',
        amount_paid: invoiceData.amount_paid || 0
      },
      lines
    );

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createInvoiceFromOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { orderId } = req.params;

    // Get order with lines
    const order = await salesOrderRepository.getOrderWithLines(ctx, orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Can only invoice confirmed orders'
      });
    }

    const invoice = await invoiceRepository.createFromOrder(ctx, orderId);

    // Update order status
    await salesOrderRepository.updateStatus(ctx, orderId, 'processing');

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created from order successfully'
    });
  } catch (error) {
    console.error('Error creating invoice from order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice from order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const sendInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const invoice = await invoiceRepository.findById(ctx, id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status.toLowerCase() !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be sent'
      });
    }

    // TODO: Send invoice via email

    const updatedInvoice = await invoiceRepository.update(ctx, id, { status: 'sent' as any });

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const voidInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await invoiceRepository.findById(ctx, id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.amount_paid > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot void invoice with payments'
      });
    }

    const updatedInvoice = await invoiceRepository.update(ctx, id, {
      status: 'void' as any,  // Database uses uppercase, cast to bypass type check
      notes: reason ? `${invoice.notes || ''}\nVoided: ${reason}` : invoice.notes
    });

    res.json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice voided successfully'
    });
  } catch (error) {
    console.error('Error voiding invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// QUOTATIONS
// ============================================================================

export const getQuotations = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, customer_id, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (customer_id) filters.customer_id = customer_id;

    const result = await quotationRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'quotation_date',
      sortOrder: 'DESC'
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const quotation = await quotationRepository.getQuotationWithLines(ctx, id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const quotationData = req.body;

    const quotation = await quotationRepository.createQuotationWithLines(
      ctx,
      {
        ...quotationData,
        status: quotationData.status || 'draft'
      },
      quotationData.lines || []
    );

    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Quotation created successfully'
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const convertQuotationToOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const orderId = await quotationRepository.convertToOrder(ctx, id);
    const order = await salesOrderRepository.getOrderWithLines(ctx, orderId);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Quotation converted to order successfully'
    });
  } catch (error) {
    console.error('Error converting quotation to order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert quotation to order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// DASHBOARD & REPORTS
// ============================================================================

export const getSalesDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);

    // Simplified queries using correct schema tables
    const customerCount = await pool.query(
      'SELECT COUNT(*) as count FROM sales.customers WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    const orderCount = await pool.query(
      'SELECT COUNT(*) as count FROM sales.orders WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    const invoiceCount = await pool.query(
      'SELECT COUNT(*) as count FROM public.sales_invoices WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    const invoiceTotal = await pool.query(
      'SELECT COALESCE(SUM(total), 0) as total FROM public.sales_invoices WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          total_customers: parseInt(customerCount.rows[0]?.count || '0'),
          pending_orders: parseInt(orderCount.rows[0]?.count || '0'),
          unpaid_invoices: parseInt(invoiceCount.rows[0]?.count || '0'),
          unpaid_amount: parseFloat(invoiceTotal.rows[0]?.total || '0'),
          overdue_invoices: 0,
          overdue_amount: 0
        },
        recent_orders: [],
        top_customers: []
      }
    });
  } catch (error) {
    console.error('Error fetching sales dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSalesReport = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { start_date, end_date, group_by } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await invoiceRepository.getSalesReport(
      ctx,
      new Date(start_date as string),
      new Date(end_date as string),
      (group_by as 'day' | 'week' | 'month' | 'customer') || 'day'
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// LEADS MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

import pool from '../config/database';

export const getLeads = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { search, status, source, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM sales.leads
      WHERE tenant_id = $1
    `;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (search) {
      query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }
    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    query += ` ORDER BY probability DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
};

export const getLeadById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead' });
  }
};

export const createLead = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { company_name, contact_person, email, phone, mobile, source, industry, lead_value, probability, status, assigned_to, notes, next_follow_up } = req.body;

    // Generate lead number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sales.leads WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const leadNumber = `LEAD-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO sales.leads (tenant_id, lead_number, company_name, contact_person, email, phone, mobile, source, industry, lead_value, probability, status, assigned_to, notes, next_follow_up)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [ctx.tenantId, leadNumber, company_name, contact_person, email, phone, mobile, source || 'WEBSITE', industry, lead_value || 0, probability || 50, status || 'NEW', assigned_to, notes, next_follow_up]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Lead created successfully' });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
};

export const updateLead = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'lead_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.leads SET ${setClauses.join(', ')}, updated_at = NOW() WHERE lead_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead' });
  }
};

export const deleteLead = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead' });
  }
};

export const convertLeadToOpportunity = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { opportunity_name, expected_close_date } = req.body;

    // Get lead
    const leadResult = await pool.query(
      'SELECT * FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Generate opportunity number
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sales.opportunities WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const oppNumber = `OPP-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    // Create opportunity
    const oppResult = await pool.query(
      `INSERT INTO sales.opportunities (tenant_id, opportunity_number, lead_id, opportunity_name, contact_person, email, phone, value, stage, probability, expected_close_date, source, assigned_to, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [ctx.tenantId, oppNumber, lead.lead_id, opportunity_name || lead.company_name, lead.contact_person, lead.email, lead.phone, lead.lead_value || 0, 'QUALIFICATION', lead.probability, expected_close_date || new Date(Date.now() + 30*24*60*60*1000), lead.source, lead.assigned_to, 'OPEN', lead.notes]
    );

    // Update lead status
    await pool.query(
      'UPDATE sales.leads SET status = $1, converted_to_opportunity_id = $2, converted_at = NOW() WHERE lead_id = $3 AND tenant_id = $4',
      ['CONVERTED', oppResult.rows[0].opportunity_id, id, ctx.tenantId]
    );

    res.status(201).json({ success: true, data: oppResult.rows[0], message: 'Lead converted to opportunity' });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ success: false, message: 'Failed to convert lead' });
  }
};

// ============================================================================
// OPPORTUNITIES MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

export const getOpportunities = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { search, status, stage, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM sales.opportunities WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (search) {
      query += ` AND (opportunity_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (stage) {
      query += ` AND stage = $${paramCount}`;
      params.push(stage);
      paramCount++;
    }
    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    query += ` ORDER BY probability DESC, expected_close_date ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch opportunities' });
  }
};

export const getOpportunityById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.opportunities WHERE opportunity_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch opportunity' });
  }
};

export const createOpportunity = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { opportunity_name, contact_person, email, phone, value, stage, probability, expected_close_date, source, assigned_to, notes } = req.body;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sales.opportunities WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const oppNumber = `OPP-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO sales.opportunities (tenant_id, opportunity_number, opportunity_name, contact_person, email, phone, value, stage, probability, expected_close_date, source, assigned_to, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [ctx.tenantId, oppNumber, opportunity_name, contact_person, email, phone, value || 0, stage || 'QUALIFICATION', probability || 25, expected_close_date, source, assigned_to, 'OPEN', notes]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Opportunity created successfully' });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to create opportunity' });
  }
};

export const updateOpportunity = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'opportunity_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.opportunities SET ${setClauses.join(', ')}, updated_at = NOW() WHERE opportunity_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Opportunity updated successfully' });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to update opportunity' });
  }
};

export const deleteOpportunity = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.opportunities WHERE opportunity_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }

    res.json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ success: false, message: 'Failed to delete opportunity' });
  }
};

// ============================================================================
// QUOTATION EXTENDED OPERATIONS (V2 - Tenant Isolated)
// ============================================================================

export const updateQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const quotation = await quotationRepository.update(ctx, id, updates);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: quotation, message: 'Quotation updated successfully' });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation' });
  }
};

export const deleteQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const deleted = await quotationRepository.delete(ctx, id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quotation' });
  }
};

export const sendQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Use direct SQL to update status and sent_at timestamp
    const result = await pool.query(
      `UPDATE sales.quotations 
       SET status = 'sent', sent_at = NOW(), updated_at = NOW() 
       WHERE quotation_id = $1 AND tenant_id = $2 
       RETURNING *`,
      [id, ctx.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // TODO: Add email sending logic here

    res.json({ success: true, data: result.rows[0], message: 'Quotation sent successfully' });
  } catch (error) {
    console.error('Error sending quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to send quotation' });
  }
};

export const acceptQuotation = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Use direct SQL to update status and accepted_at timestamp
    const result = await pool.query(
      `UPDATE sales.quotations 
       SET status = 'accepted', accepted_at = NOW(), updated_at = NOW() 
       WHERE quotation_id = $1 AND tenant_id = $2 
       RETURNING *`,
      [id, ctx.tenantId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Quotation accepted successfully' });
  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to accept quotation' });
  }
};

// ============================================================================
// SALES ORDER EXTENDED OPERATIONS (V2 - Tenant Isolated)
// ============================================================================

export const shipOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { tracking_number, carrier } = req.body;

    // Use direct SQL to update with shipping details
    const result = await pool.query(
      `UPDATE sales.sales_orders 
       SET status = 'shipped', shipped_at = NOW(), tracking_number = $3, carrier = $4, updated_at = NOW() 
       WHERE order_id = $1 AND tenant_id = $2 
       RETURNING *`,
      [id, ctx.tenantId, tracking_number, carrier]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Order shipped successfully' });
  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(500).json({ success: false, message: 'Failed to ship order' });
  }
};

export const deliverOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Use direct SQL to update delivery status
    const result = await pool.query(
      `UPDATE sales.sales_orders 
       SET status = 'delivered', delivered_at = NOW(), updated_at = NOW() 
       WHERE order_id = $1 AND tenant_id = $2 
       RETURNING *`,
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Order marked as delivered' });
  } catch (error) {
    console.error('Error delivering order:', error);
    res.status(500).json({ success: false, message: 'Failed to mark order as delivered' });
  }
};

// ============================================================================
// CREDIT NOTES (V2 - Tenant Isolated)
// ============================================================================

export const getCreditNotes = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { customer_id, status, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM sales.credit_notes WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (customer_id) {
      query += ` AND customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit notes' });
  }
};

export const getCreditNoteById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.credit_notes WHERE credit_note_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credit note' });
  }
};

export const createCreditNote = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { customer_id, invoice_id, amount, reason, notes } = req.body;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sales.credit_notes WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const creditNoteNumber = `CN-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO sales.credit_notes (tenant_id, credit_note_number, customer_id, invoice_id, amount, reason, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [ctx.tenantId, creditNoteNumber, customer_id, invoice_id, amount, reason, notes, 'draft']
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Credit note created successfully' });
  } catch (error) {
    console.error('Error creating credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to create credit note' });
  }
};

export const updateCreditNote = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'credit_note_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.credit_notes SET ${setClauses.join(', ')}, updated_at = NOW() WHERE credit_note_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Credit note updated successfully' });
  } catch (error) {
    console.error('Error updating credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to update credit note' });
  }
};

export const deleteCreditNote = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.credit_notes WHERE credit_note_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Credit note not found' });
    }

    res.json({ success: true, message: 'Credit note deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete credit note' });
  }
};

// ============================================================================
// RECEIPTS (V2 - Tenant Isolated)
// ============================================================================

export const getReceipts = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { customer_id, invoice_id, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM sales.receipts WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (customer_id) {
      query += ` AND customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    if (invoice_id) {
      query += ` AND invoice_id = $${paramCount}`;
      params.push(invoice_id);
      paramCount++;
    }

    query += ` ORDER BY receipt_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receipts' });
  }
};

export const getReceiptById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.receipts WHERE receipt_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch receipt' });
  }
};

export const createReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { customer_id, invoice_id, amount, payment_method, reference, notes, receipt_date } = req.body;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sales.receipts WHERE tenant_id = $1',
      [ctx.tenantId]
    );
    const receiptNumber = `RCP-${String(parseInt(countResult.rows[0].count) + 1).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO sales.receipts (tenant_id, receipt_number, customer_id, invoice_id, amount, payment_method, reference, notes, receipt_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [ctx.tenantId, receiptNumber, customer_id, invoice_id, amount, payment_method || 'CASH', reference, notes, receipt_date || new Date()]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Receipt created successfully' });
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to create receipt' });
  }
};

export const updateReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'receipt_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.receipts SET ${setClauses.join(', ')}, updated_at = NOW() WHERE receipt_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Receipt updated successfully' });
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to update receipt' });
  }
};

export const deleteReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.receipts WHERE receipt_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to delete receipt' });
  }
};

// ============================================================================
// COMMISSIONS (V2 - Tenant Isolated)
// ============================================================================

export const getCommissions = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { salesperson_id, status, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM sales.commissions WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (salesperson_id) {
      query += ` AND salesperson_id = $${paramCount}`;
      params.push(salesperson_id);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch commissions' });
  }
};

export const getCommissionById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.commissions WHERE commission_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commission not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching commission:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch commission' });
  }
};

export const createCommission = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { salesperson_id, order_id, invoice_id, amount, rate, status, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO sales.commissions (tenant_id, salesperson_id, order_id, invoice_id, amount, rate, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [ctx.tenantId, salesperson_id, order_id, invoice_id, amount, rate || 0, status || 'pending', notes]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Commission created successfully' });
  } catch (error) {
    console.error('Error creating commission:', error);
    res.status(500).json({ success: false, message: 'Failed to create commission' });
  }
};

export const updateCommission = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'commission_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.commissions SET ${setClauses.join(', ')}, updated_at = NOW() WHERE commission_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commission not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Commission updated successfully' });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({ success: false, message: 'Failed to update commission' });
  }
};

export const deleteCommission = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.commissions WHERE commission_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Commission not found' });
    }

    res.json({ success: true, message: 'Commission deleted successfully' });
  } catch (error) {
    console.error('Error deleting commission:', error);
    res.status(500).json({ success: false, message: 'Failed to delete commission' });
  }
};

// ============================================================================
// PRICING RULES (V2 - Tenant Isolated)
// ============================================================================

export const getPricingRules = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { product_id, customer_id, is_active, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM sales.pricing_rules WHERE tenant_id = $1`;
    const params: any[] = [ctx.tenantId];
    let paramCount = 2;

    if (product_id) {
      query += ` AND product_id = $${paramCount}`;
      params.push(product_id);
      paramCount++;
    }
    if (customer_id) {
      query += ` AND customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    query += ` ORDER BY priority DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing rules' });
  }
};

export const getPricingRuleById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.pricing_rules WHERE pricing_rule_id = $1 AND tenant_id = $2',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pricing rule' });
  }
};

export const createPricingRule = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { name, description, product_id, customer_id, discount_type, discount_value, min_quantity, max_quantity, start_date, end_date, priority, is_active } = req.body;

    const result = await pool.query(
      `INSERT INTO sales.pricing_rules (tenant_id, name, description, product_id, customer_id, discount_type, discount_value, min_quantity, max_quantity, start_date, end_date, priority, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [ctx.tenantId, name, description, product_id, customer_id, discount_type || 'PERCENTAGE', discount_value || 0, min_quantity, max_quantity, start_date, end_date, priority || 0, is_active !== false]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Pricing rule created successfully' });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({ success: false, message: 'Failed to create pricing rule' });
  }
};

export const updatePricingRule = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates).filter(k => k !== 'tenant_id' && k !== 'pricing_rule_id');
    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => updates[f]);

    const result = await pool.query(
      `UPDATE sales.pricing_rules SET ${setClauses.join(', ')}, updated_at = NOW() WHERE pricing_rule_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, ctx.tenantId, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Pricing rule updated successfully' });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({ success: false, message: 'Failed to update pricing rule' });
  }
};

export const deletePricingRule = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.pricing_rules WHERE pricing_rule_id = $1 AND tenant_id = $2 RETURNING *',
      [id, ctx.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    res.json({ success: true, message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({ success: false, message: 'Failed to delete pricing rule' });
  }
};

// ============================================================================
// GL POSTING - Integration with Financial Module
// ============================================================================

import { integrationService } from '../services/integration.service';

/**
 * Post a sales invoice to the General Ledger
 * Creates: DR Accounts Receivable, CR Revenue, CR VAT Output
 */
export const postInvoiceToGL = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Get full invoice with lines
    const invoice = await invoiceRepository.getInvoiceWithLines(ctx, id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if already posted (field may exist from migration)
    const invoiceData = invoice as any;
    if (invoiceData.gl_posted) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already posted to GL',
        journalEntryId: invoiceData.gl_journal_id
      });
    }

    if (invoice.status === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot post draft invoice. Please finalize the invoice first.'
      });
    }

    // Prepare invoice data for posting
    const invoiceForPosting = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name || 'Unknown Customer',
      invoice_date: invoice.invoice_date instanceof Date 
        ? invoice.invoice_date.toISOString().split('T')[0] 
        : String(invoice.invoice_date),
      subtotal: invoice.subtotal || invoice.total_amount,
      vat_amount: invoice.tax_amount || 0,
      total_amount: invoice.total_amount,
      lines: (invoice.lines || []).map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        line_total: line.line_total || (line.quantity * line.unit_price),
        vat_rate: line.tax_rate || 0,
        gl_account_code: line.gl_account_code
      }))
    };

    // Post to GL
    const result = await integrationService.postSalesInvoiceToGL(
      ctx.tenantId,
      invoiceForPosting,
      ctx.userId || 'system'
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        journalEntryId: result.journalEntryId
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error posting invoice to GL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post invoice to GL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get GL posting status for an invoice
 */
export const getInvoiceGLStatus = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const status = await integrationService.getPostingStatus(
      ctx.tenantId,
      'SALES_INVOICE',
      id
    );

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting invoice GL status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get GL status'
    });
  }
};

/**
 * Record a payment received and post to GL
 */
export const recordPaymentReceived = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { amount, payment_date, payment_reference, bank_account_code } = req.body;

    // Get invoice
    const invoice = await invoiceRepository.findById(ctx, id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (amount > invoice.balance_due) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds balance due (${invoice.balance_due})`
      });
    }

    // Post payment to GL
    const glResult = await integrationService.postPaymentReceivedToGL(
      ctx.tenantId,
      {
        id: `PAY-${Date.now()}`,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        amount,
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name || 'Customer',
        bank_account_code,
        payment_reference: payment_reference || `Payment for ${invoice.invoice_number}`
      },
      ctx.userId || 'system'
    );

    // Update invoice payment status
    const newAmountPaid = (invoice.amount_paid || 0) + amount;
    const newBalance = invoice.total_amount - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    await invoiceRepository.update(ctx, id, {
      amount_paid: newAmountPaid,
      balance_due: newBalance,
      status: newStatus
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice_id: id,
        amount_paid: amount,
        new_balance: newBalance,
        status: newStatus,
        gl_journal_id: glResult.journalEntryId
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
