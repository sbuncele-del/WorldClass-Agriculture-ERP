/**
 * Sales Invoice Controller
 */

import { Request, Response } from 'express';
import salesService from './service';

export class SalesController {
  
  /**
   * Create a new sales invoice
   * POST /api/sales/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = (req as any).user?.id;
      
      const invoice = await salesService.createInvoice({
        ...req.body,
        tenant_id: tenantId
      }, userId);
      
      res.status(201).json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create invoice'
      });
    }
  }
  
  /**
   * Get invoice by ID
   * GET /api/sales/invoices/:id
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const invoiceId = req.params.id;
      
      const invoice = await salesService.getInvoiceById(invoiceId, tenantId);
      
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Invoice not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error getting invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get invoice'
      });
    }
  }
  
  /**
   * List invoices with filters
   * GET /api/sales/invoices
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      
      const filters = {
        status: req.query.status as string,
        customer_id: req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string
      };
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await salesService.listInvoices(filters, tenantId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
      
    } catch (error: any) {
      console.error('Error listing invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list invoices'
      });
    }
  }
  
  /**
   * Update invoice
   * PUT /api/sales/invoices/:id
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = req.params.id;
      
      const invoice = await salesService.updateInvoice(invoiceId, req.body, tenantId, userId);
      
      res.json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update invoice'
      });
    }
  }
  
  /**
   * Post invoice to GL
   * PUT /api/sales/invoices/:id/post
   */
  async postInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = req.params.id;
      
      const invoice = await salesService.postInvoice(invoiceId, tenantId, userId);
      
      res.json({
        success: true,
        data: invoice,
        message: 'Invoice posted to GL successfully'
      });
      
    } catch (error: any) {
      console.error('Error posting invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to post invoice'
      });
    }
  }
  
  /**
   * Delete invoice (soft delete)
   * DELETE /api/sales/invoices/:id
   */
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = req.params.id;
      
      await salesService.deleteInvoice(invoiceId, tenantId, userId);
      
      res.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
      
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete invoice'
      });
    }
  }
}

export default new SalesController();
