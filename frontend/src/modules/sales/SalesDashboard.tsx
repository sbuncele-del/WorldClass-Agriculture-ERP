import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SalesDashboardEnhanced from './SalesDashboardEnhanced';
import LeadsPage from './LeadsPage';
import OpportunitiesPage from './OpportunitiesPage';
import CustomersPage from './CustomersPage';
import QuotationsPage from './QuotationsPage';
import SalesOrdersPage from './SalesOrdersPage';
import InvoicesPage from './InvoicesPage';

const SalesDashboard: React.FC = () => {
  return (
    <div className="sales-dashboard-wrapper">
      <Routes>
        <Route path="/" element={<Navigate to="/sales/dashboard" replace />} />
        <Route path="/dashboard" element={<SalesDashboardEnhanced />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/orders" element={<SalesOrdersPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
      </Routes>
    </div>
  );
};

export default SalesDashboard;
