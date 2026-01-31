import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './Purchase.css';
import PurchaseDashboardEnhanced from '../modules/purchase/PurchaseDashboardEnhanced';
import SuppliersPage from '../modules/purchase/SuppliersPage';
import PurchaseRequisitionsPage from '../modules/purchase/PurchaseRequisitionsPage';
import PurchaseOrdersPage from '../modules/purchase/PurchaseOrdersPage';
import GoodsReceiptPage from '../modules/purchase/GoodsReceiptPage';
import VendorInvoicesPage from '../modules/purchase/VendorInvoicesPage';

export default function Purchase() {
  return (
    <div className="purchase-module">
      <Routes>
          <Route index element={<PurchaseDashboardEnhanced />} />
          <Route path="dashboard" element={<PurchaseDashboardEnhanced />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="requisitions" element={<PurchaseRequisitionsPage />} />
          <Route path="orders" element={<PurchaseOrdersPage />} />
          <Route path="receipts" element={<GoodsReceiptPage />} />
          <Route path="invoices" element={<VendorInvoicesPage />} />
        </Routes>
    </div>
  );
}
