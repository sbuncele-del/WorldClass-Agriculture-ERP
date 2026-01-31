import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AssetDashboardEnhanced from './AssetDashboardEnhanced';
import AssetRegisterPage from './AssetRegisterPage';

const AssetDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/assets/dashboard" replace />} />
      <Route path="/dashboard" element={<AssetDashboardEnhanced />} />
      <Route path="/register" element={<AssetRegisterPage />} />
    </Routes>
  );
};

export default AssetDashboard;
