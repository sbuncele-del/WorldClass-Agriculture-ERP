/**
 * Sales Invoice Routes
 */

import express from 'express';
import salesController from './controller';

const router = express.Router();

// Create invoice
router.post('/invoices', salesController.createInvoice.bind(salesController));

// List invoices
router.get('/invoices', salesController.listInvoices.bind(salesController));

// Get invoice by ID
router.get('/invoices/:id', salesController.getInvoice.bind(salesController));

// Update invoice (DRAFT only)
router.put('/invoices/:id', salesController.updateInvoice.bind(salesController));

// Post invoice to GL
router.put('/invoices/:id/post', salesController.postInvoice.bind(salesController));

// Delete invoice (DRAFT only, soft delete)
router.delete('/invoices/:id', salesController.deleteInvoice.bind(salesController));

export default router;
