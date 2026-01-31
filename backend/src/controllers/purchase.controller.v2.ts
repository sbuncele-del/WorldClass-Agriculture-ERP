/**
 * PURCHASE MANAGEMENT CONTROLLER (Repository Pattern)
 *
 * Uses repository layer to enforce tenant isolation automatically.
 * Legacy endpoints remain in the old controller; routes are split accordingly.
 */

import { Response } from 'express';
import pool from '../config/database';
import { TenantRequest } from '../types';
import { TenantContext } from '../repositories/BaseRepository';
import {
  supplierRepository,
  purchaseOrderRepository,
  purchaseInvoiceRepository,
  requisitionRepository,
  goodsReceiptRepository
} from '../repositories/purchase';

function getTenantContext(req: TenantRequest): TenantContext {
  if (!req.tenant) throw new Error('Tenant context not available');
  return { tenantId: req.tenant.id, userId: req.user?.id };
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export const getSuppliers = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { search, is_active, supplier_type, page, limit } = req.query;

    if (search) {
      const result = await supplierRepository.search(ctx, search as string, {
        page: Number(page) || 1,
        limit: Number(limit) || 50
      });
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    }

    const filters: Record<string, any> = {};
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (supplier_type) filters.supplier_type = supplier_type;

    const result = await supplierRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'name',
      sortOrder: 'ASC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch suppliers', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getSupplier = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const supplier = await supplierRepository.getSupplierWithBalance(ctx, id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch supplier', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createSupplier = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const data = req.body;

    const isUnique = await supplierRepository.isCodeUnique(ctx, data.code);
    if (!isUnique) return res.status(400).json({ success: false, message: 'Supplier code already exists' });

    const supplier = await supplierRepository.create(ctx, data);
    res.status(201).json({ success: true, data: supplier, message: 'Supplier created successfully' });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ success: false, message: 'Failed to create supplier', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateSupplier = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const data = req.body;

    if (data.code) {
      const isUnique = await supplierRepository.isCodeUnique(ctx, data.code, id);
      if (!isUnique) return res.status(400).json({ success: false, message: 'Supplier code already exists' });
    }

    const supplier = await supplierRepository.update(ctx, id, data);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier, message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ success: false, message: 'Failed to update supplier', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteSupplier = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const deleted = await supplierRepository.delete(ctx, id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ success: false, message: 'Failed to delete supplier', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export const getPurchaseOrders = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, supplier_id, start_date, end_date, page, limit } = req.query;

    if (start_date && end_date) {
      const result = await purchaseOrderRepository.findAll(ctx, {
        order_date: { op: '>=', value: new Date(start_date as string) },
        // end date handled via raw where? simplest use findAll? Instead use rawQuery? we will filter below
      });
      // Fallback: use findAll then filter in memory for date range
      const filtered = result.data.filter(o => {
        const d = new Date(o.order_date);
        return d >= new Date(start_date as string) && d <= new Date(end_date as string);
      });
      return res.json({ success: true, data: filtered, pagination: result.pagination });
    }

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (supplier_id) filters.supplier_id = supplier_id;

    const result = await purchaseOrderRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'order_date',
      sortOrder: 'DESC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getPurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const order = await purchaseOrderRepository.getOrderWithLines(ctx, id);
    if (!order) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createPurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const orderData = req.body;
    const order = await purchaseOrderRepository.createOrderWithLines(ctx, orderData, orderData.lines || []);
    res.status(201).json({ success: true, data: order, message: 'Purchase order created successfully' });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updatePurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const orderData = req.body;

    const existing = await purchaseOrderRepository.findById(ctx, id);
    if (!existing) return res.status(404).json({ success: false, message: 'Purchase order not found' });

    const updated = await purchaseOrderRepository.update(ctx, id, orderData);
    res.json({ success: true, data: updated, message: 'Purchase order updated successfully' });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to update purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const sendPurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await purchaseOrderRepository.update(ctx, id, { status: 'sent' });
    if (!updated) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: updated, message: 'Purchase order marked as sent' });
  } catch (error) {
    console.error('Error sending purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to send purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const acknowledgePurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await purchaseOrderRepository.update(ctx, id, { status: 'pending_approval' });
    if (!updated) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: updated, message: 'Purchase order acknowledged' });
  } catch (error) {
    console.error('Error acknowledging purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to acknowledge purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const cancelPurchaseOrder = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await purchaseOrderRepository.update(ctx, id, { status: 'cancelled' });
    if (!updated) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: updated, message: 'Purchase order cancelled' });
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel purchase order', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// PURCHASE INVOICES
// ============================================================================

export const getVendorInvoices = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, supplier_id, overdue, page, limit } = req.query;

    if (overdue === 'true') {
      const invoices = await purchaseInvoiceRepository.getOverdueInvoices(ctx);
      return res.json({ success: true, data: invoices, pagination: { page: 1, limit: invoices.length, total: invoices.length, totalPages: 1 } });
    }

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (supplier_id) filters.supplier_id = supplier_id;

    const result = await purchaseInvoiceRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'invoice_date',
      sortOrder: 'DESC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor invoices', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const invoice = await purchaseInvoiceRepository.findById(ctx, id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const invoiceData = req.body;

    // If linked to order, use helper to copy amounts
    if (invoiceData.order_id) {
      const invoice = await purchaseInvoiceRepository.createFromOrder(ctx, invoiceData.order_id, invoiceData.supplier_invoice_number);
      return res.status(201).json({ success: true, data: invoice, message: 'Vendor invoice created from order' });
    }

    const invoice = await purchaseInvoiceRepository.create(ctx, {
      ...invoiceData,
      amount_paid: invoiceData.amount_paid || 0,
      balance_due: invoiceData.balance_due ?? invoiceData.total_amount
    });

    res.status(201).json({ success: true, data: invoice, message: 'Vendor invoice created successfully' });
  } catch (error) {
    console.error('Error creating vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to create vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const data = req.body;

    const updated = await purchaseInvoiceRepository.update(ctx, id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });

    res.json({ success: true, data: updated, message: 'Vendor invoice updated successfully' });
  } catch (error) {
    console.error('Error updating vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to update vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const deleted = await purchaseInvoiceRepository.delete(ctx, id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });

    res.json({ success: true, message: 'Vendor invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const approveVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await purchaseInvoiceRepository.update(ctx, id, { status: 'received' });
    if (!updated) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });
    res.json({ success: true, data: updated, message: 'Vendor invoice approved' });
  } catch (error) {
    console.error('Error approving vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to approve vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const rejectVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await purchaseInvoiceRepository.update(ctx, id, { status: 'cancelled' });
    if (!updated) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });
    res.json({ success: true, data: updated, message: 'Vendor invoice rejected' });
  } catch (error) {
    console.error('Error rejecting vendor invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to reject vendor invoice', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const payVendorInvoice = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { amount, payment_method, reference } = req.body;

    const invoice = await purchaseInvoiceRepository.recordPayment(ctx, id, amount, payment_method, reference);
    if (!invoice) return res.status(404).json({ success: false, message: 'Vendor invoice not found' });

    res.json({ success: true, data: invoice, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// REQUISITIONS
// ============================================================================

export const getRequisitions = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, department, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (department) filters.department = department;

    const result = await requisitionRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'requisition_date',
      sortOrder: 'DESC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requisitions', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const requisition = await requisitionRepository.getWithLines(ctx, id);
    if (!requisition) return res.status(404).json({ success: false, message: 'Requisition not found' });
    res.json({ success: true, data: requisition });
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { line_items = [], ...header } = req.body || {};

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ success: false, message: 'Line items are required' });
    }

    const requisition = await requisitionRepository.createWithLines(ctx, header, line_items);
    res.status(201).json({ success: true, data: requisition, message: 'Requisition created successfully' });
  } catch (error) {
    console.error('Error creating requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to create requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const data = req.body;

    const updated = await requisitionRepository.update(ctx, id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Requisition not found' });
    res.json({ success: true, data: updated, message: 'Requisition updated successfully' });
  } catch (error) {
    console.error('Error updating requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to update requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const approveRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await requisitionRepository.updateStatus(ctx, id, 'approved', { approved_by: ctx.userId, approved_date: new Date() } as any);
    if (!updated) return res.status(404).json({ success: false, message: 'Requisition not found' });
    res.json({ success: true, data: updated, message: 'Requisition approved' });
  } catch (error) {
    console.error('Error approving requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to approve requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const rejectRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { rejection_reason } = req.body || {};
    if (!rejection_reason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    const updated = await requisitionRepository.updateStatus(ctx, id, 'rejected', { rejection_reason });
    if (!updated) return res.status(404).json({ success: false, message: 'Requisition not found' });
    res.json({ success: true, data: updated, message: 'Requisition rejected' });
  } catch (error) {
    console.error('Error rejecting requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to reject requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteRequisition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const deleted = await requisitionRepository.deleteIfNoPurchaseOrder(ctx, id);
    if (!deleted) return res.status(400).json({ success: false, message: 'Requisition cannot be deleted (linked to purchase order or not found)' });
    res.json({ success: true, message: 'Requisition deleted successfully' });
  } catch (error) {
    console.error('Error deleting requisition:', error);
    res.status(500).json({ success: false, message: 'Failed to delete requisition', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// GOODS RECEIPTS
// ============================================================================

export const getGoodsReceipts = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, order_id, page, limit } = req.query;

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (order_id) filters.order_id = order_id;

    const result = await goodsReceiptRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'gr_date',
      sortOrder: 'DESC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching goods receipts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch goods receipts', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getGoodsReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const receipt = await goodsReceiptRepository.getWithLines(ctx, id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Goods receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (error) {
    console.error('Error fetching goods receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch goods receipt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createGoodsReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { line_items = [], ...header } = req.body || {};
    if (!Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ success: false, message: 'Line items are required' });
    }

    const receipt = await goodsReceiptRepository.createWithLines(ctx, header, line_items);
    res.status(201).json({ success: true, data: receipt, message: 'Goods receipt created successfully' });
  } catch (error) {
    console.error('Error creating goods receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to create goods receipt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateGoodsReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const data = req.body;

    const updated = await goodsReceiptRepository.update(ctx, id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Goods receipt not found' });
    res.json({ success: true, data: updated, message: 'Goods receipt updated successfully' });
  } catch (error) {
    console.error('Error updating goods receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to update goods receipt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const confirmGoodsReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const updated = await goodsReceiptRepository.update(ctx, id, {
      status: 'confirmed',
      confirmed: true,
      confirmed_by: ctx.userId,
      confirmed_date: new Date()
    } as any);
    if (!updated) return res.status(404).json({ success: false, message: 'Goods receipt not found' });
    res.json({ success: true, data: updated, message: 'Goods receipt confirmed' });
  } catch (error) {
    console.error('Error confirming goods receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm goods receipt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteGoodsReceipt = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const deleted = await goodsReceiptRepository.delete(ctx, id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Goods receipt not found' });
    res.json({ success: true, message: 'Goods receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting goods receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to delete goods receipt', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getPurchaseDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);

    // Simplified queries using correct schema tables
    const supplierCount = await pool.query(
      'SELECT COUNT(*) as count FROM purchase.suppliers WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    const poCount = await pool.query(
      'SELECT COUNT(*) as count FROM purchase.purchase_orders WHERE tenant_id = $1',
      [ctx.tenantId]
    );

    res.json({
      success: true,
      data: {
        summary: {
          suppliers: parseInt(supplierCount.rows[0]?.count || '0'),
          pending_orders: parseInt(poCount.rows[0]?.count || '0'),
          unpaid_invoices: 0,
          unpaid_amount: 0,
          overdue_invoices: 0,
          overdue_amount: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase dashboard', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// GL POSTING - Integration with Financial Module
// ============================================================================

import { integrationService } from '../services/integration.service';

/**
 * Post a purchase bill/invoice to the General Ledger
 * Creates: DR Expense/Inventory, DR VAT Input, CR Accounts Payable
 */
export const postBillToGL = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    // Get invoice - use findById from BaseRepository
    const invoice = await purchaseInvoiceRepository.findById(ctx, id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Bill/Invoice not found'
      });
    }

    // Check GL posting status from database (field may exist from migration)
    const invoiceData = invoice as any;
    if (invoiceData.gl_posted) {
      return res.status(400).json({
        success: false,
        message: 'Bill already posted to GL',
        journalEntryId: invoiceData.gl_journal_id
      });
    }

    if (invoice.status === 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot post draft bill. Please approve the bill first.'
      });
    }

    // Prepare bill data for posting
    const billForPosting = {
      id: String(invoice.invoice_id),
      bill_number: invoice.invoice_number,
      supplier_id: String(invoice.supplier_id || ''),
      supplier_name: (invoice as any).supplier_name || 'Unknown Supplier',
      bill_date: invoice.invoice_date instanceof Date 
        ? invoice.invoice_date.toISOString().split('T')[0] 
        : String(invoice.invoice_date),
      subtotal: invoice.subtotal || invoice.total_amount,
      vat_amount: invoice.vat_amount || 0,
      total_amount: invoice.total_amount,
      lines: [] // Lines not available in this query - posting uses header amounts
    };

    // Post to GL
    const result = await integrationService.postPurchaseBillToGL(
      ctx.tenantId,
      billForPosting,
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
    console.error('Error posting bill to GL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post bill to GL',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get GL posting status for a bill
 */
export const getBillGLStatus = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const status = await integrationService.getPostingStatus(
      ctx.tenantId,
      'PURCHASE_BILL',
      id
    );

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting bill GL status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get GL status'
    });
  }
};

/**
 * Record a payment made to supplier and post to GL
 */
export const recordPaymentMade = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const { amount, payment_date, payment_reference, bank_account_code } = req.body;

    // Get invoice
    const invoice = await purchaseInvoiceRepository.findById(ctx, id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const balanceDue = invoice.amount_outstanding || (invoice.total_amount - (invoice.amount_paid || 0));
    if (amount > balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) exceeds balance due (${balanceDue})`
      });
    }

    // Post payment to GL
    const glResult = await integrationService.postPaymentMadeToGL(
      ctx.tenantId,
      {
        id: `PAY-${Date.now()}`,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        amount,
        bill_number: invoice.invoice_number,
        supplier_name: (invoice as any).supplier_name || 'Supplier',
        bank_account_code,
        payment_reference: payment_reference || `Payment for ${invoice.invoice_number}`
      },
      ctx.userId || 'system'
    );

    // Update invoice payment status
    const newAmountPaid = (invoice.amount_paid || 0) + amount;
    const newBalance = invoice.total_amount - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    await purchaseInvoiceRepository.update(ctx, id, {
      amount_paid: newAmountPaid,
      amount_outstanding: newBalance,
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

