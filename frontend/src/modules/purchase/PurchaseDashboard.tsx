import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PurchaseDashboardEnhanced from './PurchaseDashboardEnhanced';
import SuppliersPage from './SuppliersPage';
import PurchaseRequisitionsPage from './PurchaseRequisitionsPage';
import PurchaseOrdersPage from './PurchaseOrdersPage';
import GoodsReceiptPage from './GoodsReceiptPage';
import VendorInvoicesPage from './VendorInvoicesPage';

const PurchaseDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/purchase/dashboard" replace />} />
      <Route path="/dashboard" element={<PurchaseDashboardEnhanced />} />
      <Route path="/suppliers" element={<SuppliersPage />} />
      <Route path="/requisitions" element={<PurchaseRequisitionsPage />} />
      <Route path="/orders" element={<PurchaseOrdersPage />} />
      <Route path="/receipts" element={<GoodsReceiptPage />} />
      <Route path="/invoices" element={<VendorInvoicesPage />} />
    </Routes>
  );
};

export default PurchaseDashboard;
