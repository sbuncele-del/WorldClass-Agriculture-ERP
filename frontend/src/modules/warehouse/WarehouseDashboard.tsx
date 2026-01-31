import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WarehouseDashboardEnhanced from './WarehouseDashboardEnhanced';

const WarehouseDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/warehouse/dashboard" replace />} />
      <Route path="/dashboard" element={<WarehouseDashboardEnhanced />} />
    </Routes>
  );
};

export default WarehouseDashboard;
