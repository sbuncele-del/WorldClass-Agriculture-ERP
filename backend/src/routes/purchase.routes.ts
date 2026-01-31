import express from 'express';
// All purchase routes now use v2 controllers exclusively
import * as purchaseControllerV2 from '../controllers/purchase.controller.v2';
import * as purchaseWorkspaceController from '../modules/purchase/controllers/purchase.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all purchase routes
router.use(tenantMiddleware);

// ==================== WORKSPACE ====================
router.get('/workspace', purchaseWorkspaceController.getPurchaseWorkspace);

// ==================== SUPPLIER ROUTES ====================
router.get('/suppliers', purchaseControllerV2.getSuppliers);
router.get('/suppliers/:id', purchaseControllerV2.getSupplier);
router.post('/suppliers', purchaseControllerV2.createSupplier);
router.put('/suppliers/:id', purchaseControllerV2.updateSupplier);
router.delete('/suppliers/:id', purchaseControllerV2.deleteSupplier);

// ==================== VENDOR ROUTES (Aliases for Suppliers) ====================
router.get('/vendors', purchaseControllerV2.getSuppliers);
router.get('/vendors/:id', purchaseControllerV2.getSupplier);
router.post('/vendors', purchaseControllerV2.createSupplier);
router.put('/vendors/:id', purchaseControllerV2.updateSupplier);
router.delete('/vendors/:id', purchaseControllerV2.deleteSupplier);

// ==================== REQUISITION ROUTES ====================
router.get('/requisitions', purchaseControllerV2.getRequisitions);
router.get('/requisitions/:id', purchaseControllerV2.getRequisition);
router.post('/requisitions', purchaseControllerV2.createRequisition);
router.put('/requisitions/:id', purchaseControllerV2.updateRequisition);
router.delete('/requisitions/:id', purchaseControllerV2.deleteRequisition);
router.post('/requisitions/:id/approve', purchaseControllerV2.approveRequisition);
router.post('/requisitions/:id/reject', purchaseControllerV2.rejectRequisition);

// ==================== PURCHASE ORDER ROUTES ====================
router.get('/purchase-orders', purchaseControllerV2.getPurchaseOrders);
router.get('/purchase-orders/:id', purchaseControllerV2.getPurchaseOrder);
router.post('/purchase-orders', purchaseControllerV2.createPurchaseOrder);
router.put('/purchase-orders/:id', purchaseControllerV2.updatePurchaseOrder);
router.post('/purchase-orders/:id/send', purchaseControllerV2.sendPurchaseOrder);
router.post('/purchase-orders/:id/acknowledge', purchaseControllerV2.acknowledgePurchaseOrder);
router.post('/purchase-orders/:id/cancel', purchaseControllerV2.cancelPurchaseOrder);

// ==================== GOODS RECEIPT ROUTES ====================
router.get('/goods-receipts', purchaseControllerV2.getGoodsReceipts);
router.get('/goods-receipts/:id', purchaseControllerV2.getGoodsReceipt);
router.post('/goods-receipts', purchaseControllerV2.createGoodsReceipt);
router.put('/goods-receipts/:id', purchaseControllerV2.updateGoodsReceipt);
router.delete('/goods-receipts/:id', purchaseControllerV2.deleteGoodsReceipt);
router.post('/goods-receipts/:id/confirm', purchaseControllerV2.confirmGoodsReceipt);

// ==================== VENDOR INVOICE ROUTES ====================
router.get('/vendor-invoices', purchaseControllerV2.getVendorInvoices);
router.get('/vendor-invoices/:id', purchaseControllerV2.getVendorInvoice);
router.post('/vendor-invoices', purchaseControllerV2.createVendorInvoice);
router.put('/vendor-invoices/:id', purchaseControllerV2.updateVendorInvoice);
router.delete('/vendor-invoices/:id', purchaseControllerV2.deleteVendorInvoice);
router.post('/vendor-invoices/:id/approve', purchaseControllerV2.approveVendorInvoice);
router.post('/vendor-invoices/:id/reject', purchaseControllerV2.rejectVendorInvoice);
router.post('/vendor-invoices/:id/pay', purchaseControllerV2.payVendorInvoice);

// ==================== INVOICE ROUTES (Aliases for Vendor Invoices) ====================
router.get('/invoices', purchaseControllerV2.getVendorInvoices);
router.get('/invoices/:id', purchaseControllerV2.getVendorInvoice);
router.post('/invoices', purchaseControllerV2.createVendorInvoice);
router.put('/invoices/:id', purchaseControllerV2.updateVendorInvoice);
router.post('/invoices/:id/approve', purchaseControllerV2.approveVendorInvoice);
router.post('/invoices/:id/reject', purchaseControllerV2.rejectVendorInvoice);
router.post('/invoices/:id/pay', purchaseControllerV2.payVendorInvoice);

export default router;
