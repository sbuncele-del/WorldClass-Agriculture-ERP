/**
 * Purchase Invoice Controller
 */

import { Request, Response } from 'express';
import purchasesService from './service';

export class PurchasesController {
  
  /**
   * Create a new purchase invoice
   * POST /api/purchases/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      
      const invoice = await purchasesService.createInvoice({
        ...req.body,
        tenant_id: tenantId
      }, userId);
      
      res.status(201).json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error creating purchase invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create purchase invoice'
      });
    }
  }
  
  /**
   * Get invoice by ID
   * GET /api/purchases/invoices/:id
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const invoiceId = parseInt(req.params.id);
      
      const invoice = await purchasesService.getInvoiceById(invoiceId, tenantId);
      
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: 'Purchase invoice not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error getting purchase invoice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get purchase invoice'
      });
    }
  }
  
  /**
   * List invoices with filters
   * GET /api/purchases/invoices
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      
      const filters = {
        status: req.query.status as string,
        supplier_id: req.query.supplier_id ? parseInt(req.query.supplier_id as string) : undefined,
        from_date: req.query.from_date as string,
        to_date: req.query.to_date as string,
        search: req.query.search as string
      };
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await purchasesService.listInvoices(filters, tenantId, page, limit);
      
      res.json({
        success: true,
        ...result
      });
      
    } catch (error: any) {
      console.error('Error listing purchase invoices:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list purchase invoices'
      });
    }
  }
  
  /**
   * Update invoice
   * PUT /api/purchases/invoices/:id
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = parseInt(req.params.id);
      
      const invoice = await purchasesService.updateInvoice(invoiceId, req.body, tenantId, userId);
      
      res.json({
        success: true,
        data: invoice
      });
      
    } catch (error: any) {
      console.error('Error updating purchase invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update purchase invoice'
      });
    }
  }
  
  /**
   * Post invoice to GL
   * PUT /api/purchases/invoices/:id/post
   */
  async postInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = parseInt(req.params.id);
      
      const invoice = await purchasesService.postInvoice(invoiceId, tenantId, userId);
      
      res.json({
        success: true,
        data: invoice,
        message: 'Purchase invoice posted to GL successfully'
      });
      
    } catch (error: any) {
      console.error('Error posting purchase invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to post purchase invoice'
      });
    }
  }
  
  /**
   * Delete invoice (soft delete)
   * DELETE /api/purchases/invoices/:id
   */
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || '00000000-0000-0000-0000-000000000001';
      const userId = (req as any).user?.id;
      const invoiceId = parseInt(req.params.id);
      
      await purchasesService.deleteInvoice(invoiceId, tenantId, userId);
      
      res.json({
        success: true,
        message: 'Purchase invoice deleted successfully'
      });
      
    } catch (error: any) {
      console.error('Error deleting purchase invoice:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete purchase invoice'
      });
    }
  }
}

export default new PurchasesController();
