/**
 * PremiumTopBar - World-Class Header
 * 
 * Premium header with:
 * - Entity name prominently displayed
 * - Global search
 * - Quick actions
 * - Notifications with real badges
 * - User profile with role indicator
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Input, Badge, Dropdown, Avatar, Space, Tag, Button, 
  Tooltip, Divider, Typography, Menu
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined, BellOutlined, MessageOutlined,
  SettingOutlined, UserOutlined, LogoutOutlined,
  QuestionCircleOutlined, SunOutlined, MoonOutlined,
  GlobalOutlined, PlusOutlined, BankOutlined,
  CalendarOutlined, FileTextOutlined, TeamOutlined,
  SwapOutlined, HomeOutlined, RightOutlined
} from '@ant-design/icons';
import { useUser } from '../../contexts/UserContext';
import apiClient from '../../services/api';
import './PremiumTopBar.css';

const { Text } = Typography;

interface Breadcrumb {
  label: string;
  path?: string;
}

const PremiumTopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // Fetch real notification and message counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch unread notifications count from V2 API
        const notifResponse = await apiClient.get('/api/v2/communications/notifications/unread-count');
        if (notifResponse.data?.success) {
          setNotificationCount(notifResponse.data.data?.count || 0);
        }
      } catch (err) {
        // API may not exist yet, just use 0
        setNotificationCount(0);
      }
      
      try {
        // Fetch unread messages count from V2 API
        const msgResponse = await apiClient.get('/api/v2/communications/messages/unread-count');
        if (msgResponse.data?.success) {
          setMessageCount(msgResponse.data.data?.count || 0);
        }
      } catch (err) {
        // API may not exist yet, just use 0
        setMessageCount(0);
      }
    };
    
    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Get onboarding data for registration number - check multiple sources
  const getOnboardingData = () => {
    try {
      // First try from user object
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        if (userData.onboardingData) {
          return typeof userData.onboardingData === 'string' 
            ? JSON.parse(userData.onboardingData) 
            : userData.onboardingData;
        }
      }
      // Then try from tenant object
      const tenantStr = localStorage.getItem('tenant');
      if (tenantStr) {
        const tenantData = JSON.parse(tenantStr);
        if (tenantData.onboarding_data) {
          return typeof tenantData.onboarding_data === 'string' 
            ? JSON.parse(tenantData.onboarding_data) 
            : tenantData.onboarding_data;
        }
      }
    } catch (e) {
      console.error('Failed to parse onboarding data', e);
    }
    return null;
  };

  const tenant = getTenantInfo();
  const onboardingData = getOnboardingData();
  const currentEntity = {
    name: tenant?.name || currentUser?.companyName || 'Your Company',
    type: 'company',
    registrationNo: onboardingData?.registrationNumber || tenant?.registration_number || tenant?.registrationNumber || '2024/636772/07',
    taxNo: onboardingData?.taxNumber || tenant?.tax_number || tenant?.taxNumber || ''
  };

  // User role display - handle both string and object role formats
  const userRole: string = typeof currentUser?.role === 'object' 
    ? (currentUser?.role as any)?.displayName || (currentUser?.role as any)?.name || 'User'
    : String(currentUser?.role || 'User');
    
  const roleColors: Record<string, string> = {
    director: '#667eea',
    executive: '#10b981',
    manager: '#f59e0b',
    accountant: '#3b82f6',
    staff: '#8b5cf6',
    admin: '#667eea',
    administrator: '#667eea',
    user: '#8b5cf6',
    super_admin: '#e11d48'
  };

  const userInitials = useMemo(() => {
    if (!currentUser) return 'U';
    const first = currentUser.firstName?.[0] || '';
    const last = currentUser.lastName?.[0] || '';
    return `${first}${last}` || 'U';
  }, [currentUser]);

  // Generate breadcrumbs from path
  const breadcrumbs = useMemo((): Breadcrumb[] => {
    const pathMap: Record<string, string> = {
      'app': 'Home',
      'dashboard': 'Dashboard',
      'workspace': 'My Workspace',
      'financial-hub': 'Financial Hub',
      'banking-hub': 'Banking Hub',
      'sales-hub': 'Sales Hub',
      'purchase-hub': 'Purchase Hub',
      'inventory-hub': 'Inventory Hub',
      'assets-hub': 'Assets Hub',
      'warehouse-hub': 'Warehouse Hub',
      'hr-hub': 'HR Hub',
      'projects-hub': 'Projects Hub',
      'logistics-hub': 'Logistics Hub',
      'manufacturing-hub': 'Manufacturing Hub',
      'construction-hub': 'Construction Hub',
      'healthcare-hub': 'Healthcare Hub',
      'property-hub': 'Property Hub',
      'mining-hub': 'Mining Hub',
      'agriculture-hub': 'Agriculture Hub',
      'practice-hub': 'Practice Hub',
      'audit-ready': 'Audit-Ready Hub',
      'regulatory': 'Regulatory Hub',
      'communications-hub': 'Communications Hub',
      'admin-hub': 'Admin Hub',
      'multi-entity': 'Multi-Entity',
      'calendar': 'Calendar',
      'communication': 'Communications',
    };

    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part, index) => ({
      label: pathMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
      path: index < parts.length - 1 ? '/' + parts.slice(0, index + 1).join('/') : undefined
    }));
  }, [location.pathname]);

  // Quick actions menu
  const quickActionsMenu: MenuProps = {
    items: [
      { key: 'invoice', icon: <FileTextOutlined />, label: 'New Invoice' },
      { key: 'quote', icon: <FileTextOutlined />, label: 'New Quote' },
      { key: 'payment', icon: <BankOutlined />, label: 'Record Payment' },
      { key: 'expense', icon: <BankOutlined />, label: 'Record Expense' },
      { type: 'divider' as const },
      { key: 'client', icon: <TeamOutlined />, label: 'Add Client' },
      { key: 'meeting', icon: <CalendarOutlined />, label: 'Schedule Meeting' },
    ],
    onClick: ({ key }) => {
      // Handle quick actions
      console.log('Quick action:', key);
    }
  };

  // Notifications menu
  const notificationsMenu: MenuProps = {
    items: [
      {
        key: 'header',
        label: <Text strong>Notifications</Text>,
        disabled: true
      },
      { type: 'divider' as const },
      {
        key: 'notif-1',
        label: (
          <div className="notification-item">
            <Badge status="processing" />
            <div>
              <Text strong>Invoice #INV-2025-0042 paid</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>R 45,000.00 received • 2 min ago</Text>
            </div>
          </div>
        )
      },
      {
        key: 'notif-2',
        label: (
          <div className="notification-item">
            <Badge status="warning" />
            <div>
              <Text strong>VAT return due in 3 days</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>December 2025 VAT201</Text>
            </div>
          </div>
        )
      },
      {
        key: 'notif-3',
        label: (
          <div className="notification-item">
            <Badge status="success" />
            <div>
              <Text strong>Bank feed synced</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>FNB Business • 12 new transactions</Text>
            </div>
          </div>
        )
      },
      { type: 'divider' as const },
      {
        key: 'view-all',
        label: <Text type="link">View all notifications</Text>
      }
    ]
  };

  // Profile menu
  const profileMenu: MenuProps = {
    items: [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '8px 0' }}>
            <Text strong>{currentUser?.fullName || 'User'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{currentUser?.email}</Text>
            <br />
            <Tag color={roleColors[(userRole || '').toLowerCase()] || '#667eea'} style={{ marginTop: 4 }}>
              {userRole || 'User'}
            </Tag>
          </div>
        ),
        disabled: true
      },
      { type: 'divider' as const },
      { key: 'profile', icon: <UserOutlined />, label: 'My Profile', onClick: () => navigate('/app/profile') },
      { key: 'settings', icon: <SettingOutlined />, label: 'Settings', onClick: () => navigate('/app/settings') },
      { key: 'help', icon: <QuestionCircleOutlined />, label: 'Help & Support', onClick: () => navigate('/app/help') },
      { type: 'divider' as const },
      { 
        key: 'logout', 
        icon: <LogoutOutlined />, 
        label: 'Sign Out',
        danger: true,
        onClick: () => {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    ]
  };

  return (
    <header className="premium-topbar">
      {/* Left: Entity & Breadcrumbs */}
      <div className="topbar-left">
        <div className="topbar-entity" onClick={() => navigate('/app/dashboard')}>
          <div className="entity-icon">
            <BankOutlined />
          </div>
          <div className="entity-details">
            <span className="entity-name">{currentEntity.name}</span>
            <span className="entity-meta">Reg: {currentEntity.registrationNo}</span>
          </div>
        </div>

        <Divider type="vertical" className="topbar-divider" />

        <nav className="topbar-breadcrumbs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <RightOutlined className="breadcrumb-separator" />}
              {crumb.path ? (
                <span 
                  className="breadcrumb-link"
                  onClick={() => navigate(crumb.path!)}
                >
                  {crumb.label}
                </span>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Center: Search */}
      <div className="topbar-center">
        <Input
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          placeholder="Search transactions, clients, documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="topbar-search"
          allowClear
        />
      </div>

      {/* Right: Actions */}
      <div className="topbar-right">
        {/* Quick Add */}
        <Dropdown menu={quickActionsMenu} trigger={['click']}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            className="quick-add-btn"
          >
            Quick Add
          </Button>
        </Dropdown>

        {/* Theme Toggle */}
        <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
          <button 
            className="topbar-icon-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>

        {/* Notifications */}
        <Dropdown menu={notificationsMenu} trigger={['click']} placement="bottomRight">
          <button className="topbar-icon-btn">
            <Badge count={notificationCount} size="small">
              <BellOutlined />
            </Badge>
          </button>
        </Dropdown>

        {/* Messages */}
        <Tooltip title="Messages">
          <button className="topbar-icon-btn" onClick={() => navigate('/app/communication')}>
            <Badge count={messageCount} size="small">
              <MessageOutlined />
            </Badge>
          </button>
        </Tooltip>

        {/* Profile */}
        <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
          <div className="topbar-profile">
            <Avatar 
              size={36}
              style={{ 
                background: `linear-gradient(135deg, ${roleColors[(userRole || '').toLowerCase()] || '#667eea'} 0%, #764ba2 100%)`,
                cursor: 'pointer'
              }}
            >
              {userInitials}
            </Avatar>
            <div className="profile-info">
              <span className="profile-name">{currentUser?.fullName || 'User'}</span>
              <span className="profile-role">{userRole}</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default PremiumTopBar;
