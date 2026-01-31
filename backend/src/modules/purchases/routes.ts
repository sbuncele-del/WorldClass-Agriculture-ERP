/**
 * Purchase Invoice Routes
 */

import express from 'express';
import purchasesController from './controller';

const router = express.Router();

// Create invoice
router.post('/invoices', purchasesController.createInvoice.bind(purchasesController));

// List invoices
router.get('/invoices', purchasesController.listInvoices.bind(purchasesController));

// Get invoice by ID
router.get('/invoices/:id', purchasesController.getInvoice.bind(purchasesController));

// Update invoice (DRAFT only)
router.put('/invoices/:id', purchasesController.updateInvoice.bind(purchasesController));

// Post invoice to GL
router.put('/invoices/:id/post', purchasesController.postInvoice.bind(purchasesController));

// Delete invoice (DRAFT only, soft delete)
router.delete('/invoices/:id', purchasesController.deleteInvoice.bind(purchasesController));

export default router;
