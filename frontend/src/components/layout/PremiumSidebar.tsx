/**
 * PremiumSidebar - World-Class Navigation
 * 
 * Premium sidebar with:
 * - Entity/Company selector at top
 * - Role-based menu visibility
 * - All Hubs properly organized
 * - Collapsible sections
 * - Modern premium design
 */

import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Tooltip, Badge, Dropdown, Space, Avatar
} from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined, DashboardOutlined, AppstoreOutlined,
  DollarOutlined, BankOutlined, WalletOutlined,
  TeamOutlined, UserOutlined, SafetyCertificateOutlined,
  ShoppingCartOutlined, ShoppingOutlined, InboxOutlined,
  TruckOutlined, ToolOutlined, BuildOutlined,
  MedicineBoxOutlined, HomeOutlined as PropertyIcon,
  CloudOutlined, GoldOutlined, ExperimentOutlined,
  ProjectOutlined, FileTextOutlined, MessageOutlined,
  CalendarOutlined, AuditOutlined, FileProtectOutlined,
  SettingOutlined, SwapOutlined, BarChartOutlined,
  RightOutlined, DownOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, PlusOutlined, SearchOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useUser } from '../../contexts/UserContext';
import './PremiumSidebar.css';

interface Entity {
  id: string;
  name: string;
  logo?: string;
  type: 'company' | 'branch' | 'division';
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const PremiumSidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  // Get user role from context - map admin to director for permissions
  const userRole = useMemo(() => {
    if (!currentUser?.role) return 'director';
    const roleName = typeof currentUser.role === 'object' 
      ? (currentUser.role as any)?.name 
      : String(currentUser.role);
    // Map backend roles to sidebar roles
    const roleMap: Record<string, string> = {
      'admin': 'director',
      'super_admin': 'director',
      'manager': 'manager',
      'user': 'staff',
      'viewer': 'staff',
      'accountant': 'accountant'
    };
    return roleMap[roleName?.toLowerCase()] || 'director';
  }, [currentUser]);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workspace: true,
    financial: true,
    operations: true,
    industry: false,
    compliance: true,
    admin: false
  });

  // Get tenant info from localStorage (set during login)
  const getTenantInfo = () => {
    try {
      const tenantStr = localStorage.getItem('tenant');
      if (tenantStr) {
        return JSON.parse(tenantStr);
      }
    } catch (e) {
      console.error('Failed to parse tenant info', e);
    }
    return null;
  };

  const tenant = getTenantInfo();
  
  // Use actual tenant data instead of mock
  const entities: Entity[] = [
    { 
      id: tenant?.id || '1', 
      name: tenant?.name || 'Your Company', 
      type: 'company' 
    }
  ];
  
  const [currentEntity, setCurrentEntity] = useState(entities[0]);

  const isActive = (path: string) => {
    if (path === '/app' || path === '/app/dashboard') {
      return location.pathname === '/app' || location.pathname === '/app/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Role-based menu filtering
  const canAccess = (requiredRoles: string[]) => {
    if (requiredRoles.includes('all')) return true;
    return requiredRoles.includes(userRole);
  };

  // Entity dropdown menu
  const entityMenu: MenuProps = {
    items: [
      ...entities.map(entity => ({
        key: entity.id,
        label: (
          <Space>
            <Avatar size="small" style={{ background: '#667eea' }}>
              {entity.name.charAt(0)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 500 }}>{entity.name}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'capitalize' }}>{entity.type}</div>
            </div>
          </Space>
        ),
        onClick: () => setCurrentEntity(entity)
      })),
      { type: 'divider' as const },
      {
        key: 'add-entity',
        label: (
          <Space>
            <PlusOutlined />
            <span>Add New Entity</span>
          </Space>
        ),
        onClick: () => navigate('/app/multi-entity')
      }
    ]
  };

  const renderSectionTitle = (title: string, section: string, icon: React.ReactNode) => (
    <div 
      className="sidebar-section-header"
      onClick={() => toggleSection(section)}
    >
      <span className="section-icon">{icon}</span>
      {!isCollapsed && (
        <>
          <span className="section-title">{title}</span>
          <span className="section-arrow">
            {expandedSections[section] ? <DownOutlined /> : <RightOutlined />}
          </span>
        </>
      )}
    </div>
  );

  const renderNavItem = (
    path: string, 
    icon: React.ReactNode, 
    label: string, 
    badge?: number | string,
    requiredRoles: string[] = ['all']
  ) => {
    if (!canAccess(requiredRoles)) return null;
    
    const item = (
      <Link 
        to={path} 
        className={`sidebar-nav-item ${isActive(path) ? 'active' : ''}`}
      >
        <span className="nav-icon">{icon}</span>
        {!isCollapsed && (
          <>
            <span className="nav-label">{label}</span>
            {badge && <Badge count={badge} size="small" className="nav-badge" />}
          </>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip title={label} placement="right" key={path}>
          {item}
        </Tooltip>
      );
    }
    return item;
  };

  return (
    <aside className={`premium-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Entity Selector */}
      <div className="sidebar-entity-selector">
        <Dropdown menu={entityMenu} trigger={['click']} placement="bottomLeft">
          <div className="entity-selector-btn">
            <Avatar 
              size={isCollapsed ? 32 : 36} 
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                flexShrink: 0
              }}
            >
              {currentEntity.name.charAt(0)}
            </Avatar>
            {!isCollapsed && (
              <div className="entity-info">
                <div className="entity-name">{currentEntity.name}</div>
                <div className="entity-type">{currentEntity.type}</div>
              </div>
            )}
            {!isCollapsed && <DownOutlined className="entity-dropdown-icon" />}
          </div>
        </Dropdown>
      </div>

      {/* Collapse Toggle */}
      <button className="sidebar-collapse-btn" onClick={onToggleCollapse}>
        {isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Workspace Section */}
        <div className="sidebar-section">
          {renderSectionTitle('WORKSPACE', 'workspace', <AppstoreOutlined />)}
          {expandedSections.workspace && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/dashboard', <DashboardOutlined />, 'Dashboard')}
              {renderNavItem('/app/workspace', <HomeOutlined />, 'My Workspace')}
              {renderNavItem('/app/calendar', <CalendarOutlined />, 'Calendar')}
              {renderNavItem('/app/communication', <MessageOutlined />, 'Communications')}
            </div>
          )}
        </div>

        {/* Financial Section */}
        <div className="sidebar-section">
          {renderSectionTitle('FINANCIAL', 'financial', <DollarOutlined />)}
          {expandedSections.financial && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/financial-hub', <BarChartOutlined />, 'Financial Hub', undefined, ['director', 'executive', 'accountant'])}
              {renderNavItem('/app/banking-hub', <BankOutlined />, 'Banking Hub')}
              {renderNavItem('/app/cash', <WalletOutlined />, 'Cash Management')}
              {renderNavItem('/app/treasury', <SafetyCertificateOutlined />, 'Treasury', undefined, ['director', 'executive'])}
              {renderNavItem('/app/sars', <FileProtectOutlined />, 'SARS Sentinel')}
            </div>
          )}
        </div>

        {/* Operations Section */}
        <div className="sidebar-section">
          {renderSectionTitle('OPERATIONS', 'operations', <ToolOutlined />)}
          {expandedSections.operations && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/sales-hub', <ShoppingCartOutlined />, 'Sales Hub')}
              {renderNavItem('/app/purchase-hub', <ShoppingOutlined />, 'Purchase Hub')}
              {renderNavItem('/app/inventory-hub', <InboxOutlined />, 'Inventory Hub')}
              {renderNavItem('/app/assets-hub', <BuildOutlined />, 'Assets Hub')}
              {renderNavItem('/app/warehouse-hub', <InboxOutlined />, 'Warehouse Hub')}
              {renderNavItem('/app/hr-hub', <TeamOutlined />, 'HR Hub')}
              {renderNavItem('/app/projects-hub', <ProjectOutlined />, 'Projects Hub')}
              {renderNavItem('/app/proposals', <FileTextOutlined />, 'Proposals')}
            </div>
          )}
        </div>

        {/* Industry Solutions */}
        <div className="sidebar-section">
          {renderSectionTitle('INDUSTRY', 'industry', <CloudOutlined />)}
          {expandedSections.industry && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/logistics-hub', <TruckOutlined />, 'Logistics Hub')}
              {renderNavItem('/app/manufacturing-hub', <ToolOutlined />, 'Manufacturing Hub')}
              {renderNavItem('/app/construction-hub', <BuildOutlined />, 'Construction Hub')}
              {renderNavItem('/app/healthcare-hub', <MedicineBoxOutlined />, 'Healthcare Hub')}
              {renderNavItem('/app/property-hub', <PropertyIcon />, 'Property Hub')}
              {renderNavItem('/app/mining-hub', <GoldOutlined />, 'Mining Hub')}
              {renderNavItem('/app/agriculture-hub', <ExperimentOutlined />, 'Agriculture Hub')}
              {renderNavItem('/app/practice-hub', <SafetyCertificateOutlined />, 'Practice Hub')}
            </div>
          )}
        </div>

        {/* Compliance & Governance */}
        <div className="sidebar-section">
          {renderSectionTitle('COMPLIANCE', 'compliance', <AuditOutlined />)}
          {expandedSections.compliance && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/audit-ready', <AuditOutlined />, 'Audit-Ready Hub')}
              {renderNavItem('/app/regulatory', <FileProtectOutlined />, 'Regulatory Hub')}
              {renderNavItem('/app/communications-hub', <MessageOutlined />, 'Comms Hub')}
            </div>
          )}
        </div>

        {/* Administration */}
        <div className="sidebar-section">
          {renderSectionTitle('ADMIN', 'admin', <SettingOutlined />)}
          {expandedSections.admin && (
            <div className="sidebar-section-content">
              {renderNavItem('/app/admin-hub', <SettingOutlined />, 'Admin Hub', undefined, ['director', 'executive'])}
              {renderNavItem('/app/multi-entity', <SwapOutlined />, 'Multi-Entity', undefined, ['director'])}
              {renderNavItem('/app/tenant-settings', <SettingOutlined />, 'Company Setup', undefined, ['director', 'executive'])}
              {renderNavItem('/app/users', <UserOutlined />, 'Users', undefined, ['director', 'executive'])}
              {renderNavItem('/app/audit-logs', <FileTextOutlined />, 'Audit Logs', undefined, ['director', 'executive', 'accountant'])}
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-version">
            <span>SiyaBusa ERP</span>
            <span className="version-tag">v2.0</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default PremiumSidebar;
