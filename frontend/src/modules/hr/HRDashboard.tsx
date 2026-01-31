import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HRDashboardEnhanced from './HRDashboardEnhanced';
import EmployeesPage from './EmployeesPage';
import PayrollPage from './PayrollPage';
import LeavePage from './LeavePage';
import CompliancePage from './CompliancePage';

const HRDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/hr/dashboard" replace />} />
      <Route path="/dashboard" element={<HRDashboardEnhanced />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/payroll" element={<PayrollPage />} />
      <Route path="/leave" element={<LeavePage />} />
      <Route path="/compliance" element={<CompliancePage />} />
    </Routes>
  );
};

export default HRDashboard;
