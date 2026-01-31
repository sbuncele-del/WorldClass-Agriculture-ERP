import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CashManagementDashboard from '../modules/cash-management/CashManagementDashboard';
import BankAccountsPage from '../modules/cash/BankAccountsPage';
import ReconciliationWorkspace from '../modules/cash/ReconciliationWorkspace';

const CashFlowPage: React.FC = () => <div className="placeholder">💵 Cash Flow - Coming Soon</div>;
const Forecasting: React.FC = () => <div className="placeholder">🔮 Forecasting - Coming Soon</div>;
const CashReports: React.FC = () => <div className="placeholder">📊 Reports - Coming Soon</div>;

const CashManagement: React.FC = () => {
  return (
    <div className="cash-management-wrapper">
      <Routes>
        <Route path="/" element={<Navigate to="/cash/dashboard" replace />} />
        <Route path="/dashboard" element={<CashManagementDashboard />} />
        <Route path="/accounts" element={<BankAccountsPage />} />
        <Route path="/reconciliation" element={<ReconciliationWorkspace />} />
        <Route path="/cash-flow" element={<CashFlowPage />} />
        <Route path="/forecasting" element={<Forecasting />} />
        <Route path="/reports" element={<CashReports />} />
      </Routes>
    </div>
  );
};

export default CashManagement;
