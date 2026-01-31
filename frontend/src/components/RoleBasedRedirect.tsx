import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

// Role-based dashboard routing
// Drivers, warehouse staff, and field workers get simple mobile-first interfaces
// Admins and managers see the full ERP

const ROLE_DASHBOARDS: Record<string, string> = {
  'driver': '/driver',
  'warehouse_staff': '/warehouse-mobile',
  'field_worker': '/field-mobile',
  'delivery_agent': '/driver',
  'sales_rep': '/sales-mobile',
  // All other roles go to full ERP dashboard
};

const SIMPLE_INTERFACE_ROLES = [
  'driver',
  'warehouse_staff',
  'field_worker',
  'delivery_agent',
];

export const RoleBasedRedirect: React.FC = () => {
  const { currentUser } = useUser();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Get the role code (lowercase)
  const roleCode = currentUser.role?.code?.toLowerCase() || '';
  
  // Check if user should see simple interface
  const targetDashboard = ROLE_DASHBOARDS[roleCode] || '/dashboard';
  
  return <Navigate to={targetDashboard} replace />;
};

export const useIsSimpleInterfaceUser = () => {
  const { currentUser } = useUser();
  const roleCode = currentUser?.role?.code?.toLowerCase() || '';
  return SIMPLE_INTERFACE_ROLES.includes(roleCode);
};

export default RoleBasedRedirect;
