import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManufacturingDashboardEnhanced from './ManufacturingDashboardEnhanced';

const ManufacturingDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/manufacturing/dashboard" replace />} />
      <Route path="/dashboard" element={<ManufacturingDashboardEnhanced />} />
    </Routes>
  );
};

export default ManufacturingDashboard;
