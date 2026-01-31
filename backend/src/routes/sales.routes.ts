import { Router } from 'express';
// V2 controller with Repository Pattern + direct tenant-safe queries for ALL endpoints
import * as salesController from '../controllers/sales.controller.v2';
import * as salesWorkspaceController from '../modules/sales/controllers/sales.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all sales routes
router.use(tenantMiddleware);

// ============================================================================
// DASHBOARD (v2 - Repository Pattern)
// ============================================================================
router.get('/dashboard', salesController.getSalesDashboard);

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', salesWorkspaceController.getSalesWorkspace);

// ============================================================================
// CUSTOMER ROUTES (v2 - Repository Pattern)
// ============================================================================
router.get('/customers', salesController.getCustomers);
router.get('/customers/:id', salesController.getCustomer);
router.get('/customers/:id/orders', salesController.getCustomerOrders);
router.get('/customers/:id/invoices', salesController.getCustomerInvoices);
router.post('/customers', salesController.createCustomer);
router.put('/customers/:id', salesController.updateCustomer);
router.delete('/customers/:id', salesController.deleteCustomer);

// ============================================================================
// LEAD ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/leads', salesController.getLeads);
router.get('/leads/:id', salesController.getLeadById);
router.post('/leads', salesController.createLead);
router.put('/leads/:id', salesController.updateLead);
router.delete('/leads/:id', salesController.deleteLead);
router.post('/leads/:id/convert', salesController.convertLeadToOpportunity);

// ============================================================================
// OPPORTUNITY ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/opportunities', salesController.getOpportunities);
router.get('/opportunities/:id', salesController.getOpportunityById);
router.post('/opportunities', salesController.createOpportunity);
router.put('/opportunities/:id', salesController.updateOpportunity);
router.delete('/opportunities/:id', salesController.deleteOpportunity);

// ============================================================================
// QUOTATION ROUTES (v2 - Repository Pattern + Extended)
// ============================================================================
router.get('/quotations', salesController.getQuotations);
router.get('/quotations/:id', salesController.getQuotation);
router.post('/quotations', salesController.createQuotation);
router.put('/quotations/:id', salesController.updateQuotation);
router.delete('/quotations/:id', salesController.deleteQuotation);
router.post('/quotations/:id/convert', salesController.convertQuotationToOrder);
router.post('/quotations/:id/send', salesController.sendQuotation);
router.post('/quotations/:id/accept', salesController.acceptQuotation);

// ============================================================================
// SALES ORDER ROUTES (v2 - Repository Pattern + Extended)
// ============================================================================
router.get('/orders', salesController.getSalesOrders);
router.get('/orders/:id', salesController.getSalesOrder);
router.post('/orders', salesController.createSalesOrder);
router.put('/orders/:id', salesController.updateSalesOrder);
router.post('/orders/:id/confirm', salesController.confirmSalesOrder);
router.post('/orders/:id/cancel', salesController.cancelSalesOrder);
router.post('/orders/:id/ship', salesController.shipOrder);
router.post('/orders/:id/deliver', salesController.deliverOrder);

// ============================================================================
// INVOICE ROUTES (v2 - Repository Pattern)
// ============================================================================
router.get('/invoices', salesController.getInvoices);
router.get('/invoices/:id', salesController.getInvoice);
router.post('/invoices', salesController.createInvoice);
router.post('/invoices/from-order/:orderId', salesController.createInvoiceFromOrder);
router.post('/invoices/:id/send', salesController.sendInvoice);
router.post('/invoices/:id/void', salesController.voidInvoice);

// ============================================================================
// REPORTS (v2 - Repository Pattern)
// ============================================================================
router.get('/reports/sales', salesController.getSalesReport);

// ============================================================================
// CREDIT NOTE ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/credit-notes', salesController.getCreditNotes);
router.get('/credit-notes/:id', salesController.getCreditNoteById);
router.post('/credit-notes', salesController.createCreditNote);
router.put('/credit-notes/:id', salesController.updateCreditNote);
router.delete('/credit-notes/:id', salesController.deleteCreditNote);

// ============================================================================
// RECEIPT ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/receipts', salesController.getReceipts);
router.get('/receipts/:id', salesController.getReceiptById);
router.post('/receipts', salesController.createReceipt);
router.put('/receipts/:id', salesController.updateReceipt);
router.delete('/receipts/:id', salesController.deleteReceipt);

// ============================================================================
// COMMISSION ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/commissions', salesController.getCommissions);
router.get('/commissions/:id', salesController.getCommissionById);
router.post('/commissions', salesController.createCommission);
router.put('/commissions/:id', salesController.updateCommission);
router.delete('/commissions/:id', salesController.deleteCommission);

// ============================================================================
// PRICING RULES ROUTES (v2 - Tenant Isolated)
// ============================================================================
router.get('/pricing', salesController.getPricingRules);
router.get('/pricing/:id', salesController.getPricingRuleById);
router.post('/pricing', salesController.createPricingRule);
router.put('/pricing/:id', salesController.updatePricingRule);
router.delete('/pricing/:id', salesController.deletePricingRule);

export default router;
