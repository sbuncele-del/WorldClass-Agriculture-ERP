/**
 * Breadcrumb Navigation Component
 * Provides context and navigation for the current page
 */

import React from 'react';
import { Breadcrumb, Typography } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  DollarOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  TruckOutlined,
  BankOutlined,
  SettingOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ToolOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// Route to breadcrumb mapping
const routeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  '': { icon: <HomeOutlined />, label: 'Home' },
  'dashboard': { icon: <DashboardOutlined />, label: 'Dashboard' },
  'sales': { icon: <ShoppingOutlined />, label: 'Sales & CRM' },
  'purchase': { icon: <ShoppingOutlined />, label: 'Purchases' },
  'financial': { icon: <DollarOutlined />, label: 'Financial' },
  'inventory': { icon: <BoxPlotOutlined />, label: 'Inventory' },
  'hr': { icon: <TeamOutlined />, label: 'HR & Payroll' },
  'assets': { icon: <ToolOutlined />, label: 'Assets' },
  'warehouse': { icon: <BoxPlotOutlined />, label: 'Warehouse' },
  'manufacturing': { icon: <ToolOutlined />, label: 'Manufacturing' },
  'logistics': { icon: <TruckOutlined />, label: 'Logistics' },
  'cash': { icon: <BankOutlined />, label: 'Cash Management' },
  'banking': { icon: <BankOutlined />, label: 'Banking' },
  'treasury': { icon: <BankOutlined />, label: 'Treasury' },
  'sars': { icon: <SafetyOutlined />, label: 'SARS Sentinel' },
  'audit': { icon: <SafetyOutlined />, label: 'Audit Ready' },
  'compliance': { icon: <SafetyOutlined />, label: 'Compliance' },
  'settings': { icon: <SettingOutlined />, label: 'Settings' },
  'users': { icon: <TeamOutlined />, label: 'User Management' },
  'profile': { icon: <TeamOutlined />, label: 'Profile' },
  'tenant-settings': { icon: <SettingOutlined />, label: 'Tenant Settings' },
  'audit-logs': { icon: <FileTextOutlined />, label: 'Audit Logs' },
  'help': { icon: <AppstoreOutlined />, label: 'Help Center' },
  'onboarding': { icon: <AppstoreOutlined />, label: 'Onboarding' },
  'billing': { icon: <DollarOutlined />, label: 'Billing' },
  'workspace': { icon: <AppstoreOutlined />, label: 'My Workspace' },
  'practice': { icon: <AppstoreOutlined />, label: 'Practice' },
  'healthcare': { icon: <AppstoreOutlined />, label: 'Healthcare' },
  'construction': { icon: <ToolOutlined />, label: 'Construction' },
  'agriculture': { icon: <AppstoreOutlined />, label: 'Agriculture' },
  'mining': { icon: <ToolOutlined />, label: 'Mining' },
  'wholesale': { icon: <ShoppingOutlined />, label: 'Wholesale' },
  'professional-services': { icon: <TeamOutlined />, label: 'Professional Services' },
  // Sub-routes
  'invoices': { icon: <FileTextOutlined />, label: 'Invoices' },
  'customers': { icon: <TeamOutlined />, label: 'Customers' },
  'products': { icon: <BoxPlotOutlined />, label: 'Products' },
  'orders': { icon: <ShoppingOutlined />, label: 'Orders' },
  'suppliers': { icon: <TeamOutlined />, label: 'Suppliers' },
  'employees': { icon: <TeamOutlined />, label: 'Employees' },
  'payroll': { icon: <DollarOutlined />, label: 'Payroll' },
  'reports': { icon: <FileTextOutlined />, label: 'Reports' },
  'journal': { icon: <FileTextOutlined />, label: 'Journal Entries' },
  'chart-of-accounts': { icon: <FileTextOutlined />, label: 'Chart of Accounts' },
  'trial-balance': { icon: <FileTextOutlined />, label: 'Trial Balance' },
  'balance-sheet': { icon: <FileTextOutlined />, label: 'Balance Sheet' },
  'income-statement': { icon: <FileTextOutlined />, label: 'Income Statement' },
};

interface BreadcrumbNavProps {
  items?: { path?: string; label: string }[];
  showHome?: boolean;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ 
  items: customItems,
  showHome = true 
}) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from URL if not provided
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    const breadcrumbs: { path: string; label: string; icon?: React.ReactNode }[] = [];
    
    if (showHome) {
      breadcrumbs.push({
        path: '/',
        label: 'Home',
        icon: <HomeOutlined />,
      });
    }
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const config = routeConfig[segment] || { label: formatSegment(segment) };
      breadcrumbs.push({
        path: currentPath,
        label: config.label,
        icon: config.icon,
      });
    });
    
    return breadcrumbs;
  };
  
  const formatSegment = (segment: string): string => {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const breadcrumbs = customItems || generateBreadcrumbs();
  
  return (
    <div style={{ 
      marginBottom: 16, 
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <Breadcrumb
        items={breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const config = routeConfig[item.path?.split('/').pop() || ''];
          
          return {
            title: isLast ? (
              <Text strong>
                {config?.icon && <span style={{ marginRight: 8 }}>{config.icon}</span>}
                {item.label}
              </Text>
            ) : (
              <Link to={item.path || '/'}>
                {config?.icon && <span style={{ marginRight: 8 }}>{config.icon}</span>}
                {item.label}
              </Link>
            ),
          };
        })}
      />
    </div>
  );
};

export default BreadcrumbNav;
