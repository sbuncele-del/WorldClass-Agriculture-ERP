import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SARSDashboardEnhanced from './SARSDashboardEnhanced';
import CorrespondencePage from './CorrespondencePage';
import SARSIntegrationHub from './pages/SARSIntegrationHub';

const SARSSentinel: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SARSDashboardEnhanced />} />
      <Route path="/dashboard" element={<SARSDashboardEnhanced />} />
      <Route path="/correspondence" element={<CorrespondencePage />} />
      <Route path="/integration" element={<SARSIntegrationHub />} />
      <Route path="/api" element={<SARSIntegrationHub />} />
    </Routes>
  );
};

export default SARSSentinel;
