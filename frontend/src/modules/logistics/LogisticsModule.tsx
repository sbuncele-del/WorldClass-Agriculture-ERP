import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Enterprise Components
import LogisticsCommandCenterEnterprise from './LogisticsCommandCenterEnterprise';
import LogisticsEnterpriseInnovation from './LogisticsEnterpriseInnovation';
import LoadPlannerEnterprise from './LoadPlannerEnterprise';
import FleetManagementEnterprise from './FleetManagementEnterprise';
import DriverManagementEnterprise from './DriverManagementEnterprise';
import TripRosterEnterprise from './TripRosterEnterprise';
import RouteManagement from './RouteManagement';
import IncidentManagement from './IncidentManagement';
import GeofenceManagement from './GeofenceManagement';
// Legacy Components (keep for now)
import CreateTrip from './CreateTrip';
import TripDetails from './TripDetails';
import FuelManagement from './FuelManagement';
import LogisticsReports from './LogisticsReports';
import DocumentProcessing from './DocumentProcessing';

const LogisticsModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/logistics/dashboard" replace />} />
      <Route path="/dashboard" element={<LogisticsCommandCenterEnterprise />} />
      <Route path="/enterprise" element={<LogisticsEnterpriseInnovation />} />
      <Route path="/planner" element={<LoadPlannerEnterprise />} />
      <Route path="/fleet" element={<FleetManagementEnterprise />} />
      <Route path="/drivers" element={<DriverManagementEnterprise />} />
      <Route path="/trips" element={<TripRosterEnterprise />} />
      <Route path="/trips/new" element={<CreateTrip />} />
      <Route path="/fuel" element={<FuelManagement />} />
      <Route path="/reports" element={<LogisticsReports />} />
      <Route path="/documents" element={<DocumentProcessing />} />
      <Route path="/routes" element={<RouteManagement />} />
      <Route path="/incidents" element={<IncidentManagement />} />
      <Route path="/geofences" element={<GeofenceManagement />} />
    </Routes>
  );
};

export default LogisticsModule;
