/**
 * RoleBasedWorkspace - Personalized Dashboard by User Role
 * 
 * Different views for:
 * - Director: Strategic KPIs, Board Reports, Risk Overview
 * - Executive: Financial Performance, Team Metrics, Approvals
 * - Manager: Operations, Team Tasks, Project Progress
 * - Accountant: GL, Reconciliations, Compliance
 * - Staff: My Tasks, Time Tracking, Personal Metrics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Avatar, Space,
  Typography, Button, Tabs, List, Timeline, Alert, Badge, Tooltip,
  Select, DatePicker, Dropdown, Segmented, Spin
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DollarOutlined, RiseOutlined, FallOutlined,
  BankOutlined, TeamOutlined, ProjectOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  CalendarOutlined, BellOutlined, RightOutlined, SettingOutlined,
  PieChartOutlined, BarChartOutlined, LineChartOutlined,
  SafetyCertificateOutlined, AuditOutlined, SyncOutlined,
  ThunderboltOutlined, StarOutlined, EyeOutlined, PlusOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EditOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useUser } from '../contexts/UserContext';
import apiClient from '../services/api';
import './RoleBasedWorkspace.css';

// Import Premium Executive Dashboard for Director/Executive roles
import ExecutiveDashboard from './ExecutiveDashboard';

const { Title, Text, Paragraph } = Typography;

type UserRole = 'director' | 'executive' | 'manager' | 'accountant' | 'staff';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  path: string;
  color: string;
}

interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashPosition: number;
  totalAssets: number;
  totalLiabilities: number;
  draftEntries: number;
  pendingEntries: number;
  isLoading: boolean;
  hasData: boolean;
}

const RoleBasedWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  // Default to director for demo - in production, get from currentUser.role
  const [userRole, setUserRole] = useState<UserRole>('director');
  const [greeting, setGreeting] = useState('Good morning');
  const [isNewTenant, setIsNewTenant] = useState(false);
  const [tenantName, setTenantName] = useState('');
  
  // Real dashboard data from API
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashPosition: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    draftEntries: 0,
    pendingEntries: 0,
    isLoading: true,
    hasData: false,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    // Check if this is a new tenant (created in last 24 hours)
    try {
      const tenantStr = localStorage.getItem('tenant');
      if (tenantStr) {
        const tenant = JSON.parse(tenantStr);
        setTenantName(tenant.name || '');
        // Check if trial just started (within last day)
        if (tenant.trialEndsAt) {
          const trialEnd = new Date(tenant.trialEndsAt);
          const trialStart = new Date(trialEnd.getTime() - (14 * 24 * 60 * 60 * 1000)); // 14 days before
          const now = new Date();
          const hoursSinceCreation = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCreation < 24) {
            setIsNewTenant(true);
          }
        }
      }
    } catch (e) {
      console.error('Failed to check tenant status', e);
    }
    
    // Fetch real dashboard data
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, isLoading: true }));
      
      // Fetch dashboard stats
      const statsResponse = await apiClient.get('/api/v1/financial/dashboard/stats').catch(() => null);
      const cashResponse = await apiClient.get('/api/v1/financial/dashboard/cash-position').catch(() => null);
      
      if (statsResponse?.data?.success) {
        const stats = statsResponse.data.data;
        setDashboardData(prev => ({
          ...prev,
          totalRevenue: stats.financial_summary?.total_revenue || 0,
          totalExpenses: stats.financial_summary?.total_expenses || 0,
          netProfit: stats.financial_summary?.net_profit || 0,
          profitMargin: stats.financial_summary?.profit_margin || 0,
          totalAssets: stats.balances?.total_assets || 0,
          totalLiabilities: stats.balances?.total_liabilities || 0,
          draftEntries: stats.activity?.draft_entries || 0,
          pendingEntries: stats.activity?.pending_entries || 0,
          hasData: stats.financial_summary?.total_revenue > 0 || stats.activity?.recent_entries > 0,
          isLoading: false,
        }));
      } else {
        setDashboardData(prev => ({ ...prev, isLoading: false, hasData: false }));
      }
      
      if (cashResponse?.data?.success) {
        setDashboardData(prev => ({
          ...prev,
          cashPosition: cashResponse.data.data?.total_cash || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({ ...prev, isLoading: false, hasData: false }));
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `R ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `R ${(amount / 1000).toFixed(0)}K`;
    }
    return `R ${amount.toFixed(0)}`;
  };

  // Quick actions based on role
  const getQuickActions = (): QuickAction[] => {
    const commonActions: QuickAction[] = [
      { icon: <CalendarOutlined />, label: 'Calendar', path: '/app/calendar', color: '#8b5cf6' },
    ];

    const roleActions: Record<UserRole, QuickAction[]> = {
      director: [
        { icon: <PieChartOutlined />, label: 'Board Reports', path: '/app/financial-hub', color: '#667eea' },
        { icon: <SafetyCertificateOutlined />, label: 'Risk Dashboard', path: '/app/audit-ready', color: '#ef4444' },
        { icon: <TeamOutlined />, label: 'Executive Team', path: '/app/hr-hub', color: '#10b981' },
        { icon: <BankOutlined />, label: 'Treasury', path: '/app/treasury', color: '#f59e0b' },
        ...commonActions
      ],
      executive: [
        { icon: <BarChartOutlined />, label: 'Performance', path: '/app/financial-hub', color: '#667eea' },
        { icon: <CheckCircleOutlined />, label: 'Approvals', path: '/app/purchase-hub', color: '#10b981' },
        { icon: <ProjectOutlined />, label: 'Projects', path: '/app/projects-hub', color: '#3b82f6' },
        { icon: <FileTextOutlined />, label: 'Reports', path: '/app/financial-hub', color: '#8b5cf6' },
        ...commonActions
      ],
      manager: [
        { icon: <ProjectOutlined />, label: 'Projects', path: '/app/projects-hub', color: '#3b82f6' },
        { icon: <TeamOutlined />, label: 'My Team', path: '/app/hr-hub', color: '#10b981' },
        { icon: <FileTextOutlined />, label: 'Timesheets', path: '/app/hr-hub', color: '#f59e0b' },
        { icon: <CheckCircleOutlined />, label: 'Tasks', path: '/app/workspace', color: '#667eea' },
        ...commonActions
      ],
      accountant: [
        { icon: <BankOutlined />, label: 'Reconciliation', path: '/app/banking-hub', color: '#3b82f6' },
        { icon: <FileTextOutlined />, label: 'GL Entries', path: '/app/financial-hub', color: '#667eea' },
        { icon: <AuditOutlined />, label: 'Audit Trail', path: '/app/audit-logs', color: '#10b981' },
        { icon: <SafetyCertificateOutlined />, label: 'Tax Filing', path: '/app/sars', color: '#ef4444' },
        ...commonActions
      ],
      staff: [
        { icon: <CheckCircleOutlined />, label: 'My Tasks', path: '/app/workspace', color: '#3b82f6' },
        { icon: <ClockCircleOutlined />, label: 'Time Entry', path: '/app/hr-hub', color: '#10b981' },
        { icon: <FileTextOutlined />, label: 'My Requests', path: '/app/hr-hub', color: '#f59e0b' },
        { icon: <TeamOutlined />, label: 'Directory', path: '/app/hr-hub', color: '#8b5cf6' },
        ...commonActions
      ]
    };

    return roleActions[userRole];
  };

  // Render Director Dashboard
  const renderDirectorDashboard = () => (
    <>
      {/* Strategic KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-blue">
            <div className="kpi-content">
              <div className="kpi-icon"><DollarOutlined /></div>
              <div className="kpi-data">
                <Text className="kpi-label">Annual Revenue</Text>
                <div className="kpi-value">
                  {dashboardData.isLoading ? <Spin indicator={<LoadingOutlined />} /> : 
                   dashboardData.hasData ? formatCurrency(dashboardData.totalRevenue) : 'No data yet'}
                </div>
                {dashboardData.hasData && (
                  <div className="kpi-change neutral">
                    <SyncOutlined /> Current period
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-green">
            <div className="kpi-content">
              <div className="kpi-icon"><RiseOutlined /></div>
              <div className="kpi-data">
                <Text className="kpi-label">Net Profit Margin</Text>
                <div className="kpi-value">
                  {dashboardData.isLoading ? <Spin indicator={<LoadingOutlined />} /> : 
                   dashboardData.hasData ? `${dashboardData.profitMargin.toFixed(1)}%` : 'No data yet'}
                </div>
                {dashboardData.hasData && dashboardData.netProfit > 0 && (
                  <div className="kpi-change positive">
                    <ArrowUpOutlined /> Profitable
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-purple">
            <div className="kpi-content">
              <div className="kpi-icon"><BankOutlined /></div>
              <div className="kpi-data">
                <Text className="kpi-label">Cash Position</Text>
                <div className="kpi-value">
                  {dashboardData.isLoading ? <Spin indicator={<LoadingOutlined />} /> : 
                   dashboardData.hasData ? formatCurrency(dashboardData.cashPosition) : 'No data yet'}
                </div>
                {dashboardData.hasData && (
                  <div className="kpi-change neutral">
                    <SyncOutlined /> Available cash
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-amber">
            <div className="kpi-content">
              <div className="kpi-icon"><FileTextOutlined /></div>
              <div className="kpi-data">
                <Text className="kpi-label">Pending Entries</Text>
                <div className="kpi-value">
                  {dashboardData.isLoading ? <Spin indicator={<LoadingOutlined />} /> : 
                   `${dashboardData.pendingEntries + dashboardData.draftEntries}`}
                </div>
                <div className="kpi-change neutral">
                  <ClockCircleOutlined /> {dashboardData.draftEntries} draft, {dashboardData.pendingEntries} pending
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Board-Level Information */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<><PieChartOutlined /> Financial Summary</>}
            extra={<Button type="link" onClick={() => navigate('/app/financial-hub')}>Full Report →</Button>}
            className="workspace-card"
          >
            {dashboardData.isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : dashboardData.hasData ? (
              <Row gutter={16}>
                <Col span={8}>
                  <div className="metric-block">
                    <Text type="secondary">Total Revenue</Text>
                    <Progress percent={100} strokeColor="#667eea" />
                    <Text>{formatCurrency(dashboardData.totalRevenue)}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="metric-block">
                    <Text type="secondary">Total Expenses</Text>
                    <Progress percent={dashboardData.totalRevenue > 0 ? Math.min(100, (dashboardData.totalExpenses / dashboardData.totalRevenue) * 100) : 0} strokeColor="#ef4444" />
                    <Text>{formatCurrency(dashboardData.totalExpenses)}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="metric-block">
                    <Text type="secondary">Net Profit</Text>
                    <Progress percent={dashboardData.netProfit > 0 ? 100 : 0} strokeColor="#10b981" />
                    <Text>{formatCurrency(dashboardData.netProfit)}</Text>
                  </div>
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">No financial data yet. Start by creating journal entries in the Financial Hub.</Text>
                <br /><br />
                <Button type="primary" onClick={() => navigate('/app/financial-hub')}>
                  Go to Financial Hub
                </Button>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<><WarningOutlined style={{ color: '#ef4444' }} /> Action Items</>}
            className="workspace-card"
          >
            <List
              size="small"
              dataSource={[
                ...(dashboardData.draftEntries > 0 ? [{ level: 'medium', text: `${dashboardData.draftEntries} draft journal entries`, module: 'GL' }] : []),
                ...(dashboardData.pendingEntries > 0 ? [{ level: 'high', text: `${dashboardData.pendingEntries} entries pending approval`, module: 'Approval' }] : []),
                { level: 'low', text: 'Set up your chart of accounts', module: 'Setup' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Badge 
                    status={item.level === 'high' ? 'error' : item.level === 'medium' ? 'warning' : 'processing'} 
                  />
                  <Text>{item.text}</Text>
                  <Tag>{item.module}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  // Render Executive Dashboard - Uses Premium Component
  const renderExecutiveDashboard = () => (
    <ExecutiveDashboard />
  );

  // Render Accountant Dashboard
  const renderAccountantDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-blue">
            <Statistic 
              title="Bank Balance" 
              value={2450000} 
              prefix="R" 
              valueStyle={{ color: '#667eea' }}
            />
            <div className="kpi-change">All accounts</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-green">
            <Statistic 
              title="Reconciliation Rate" 
              value={98.5} 
              suffix="%" 
              valueStyle={{ color: '#10b981' }}
            />
            <div className="kpi-change positive">15 items pending</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-purple">
            <Statistic 
              title="Unposted Journals" 
              value={8} 
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div className="kpi-change warning">Review required</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-amber">
            <Statistic 
              title="Next Tax Deadline" 
              value="5" 
              suffix="days" 
              valueStyle={{ color: '#f59e0b' }}
            />
            <div className="kpi-change">VAT201 December</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={<><SyncOutlined /> Today's Reconciliations</>}
            extra={<Button type="link" onClick={() => navigate('/app/banking-hub')}>Open Bank Hub →</Button>}
            className="workspace-card"
          >
            <Table
              size="small"
              dataSource={[
                { account: 'FNB Current', balance: 1250000, bookBalance: 1248500, variance: 1500, status: 'pending' },
                { account: 'FNB Savings', balance: 850000, bookBalance: 850000, variance: 0, status: 'matched' },
                { account: 'Nedbank', balance: 350000, bookBalance: 350000, variance: 0, status: 'matched' },
              ]}
              columns={[
                { title: 'Account', dataIndex: 'account', key: 'account' },
                { title: 'Statement', dataIndex: 'balance', key: 'balance', render: (v) => `R ${v.toLocaleString()}` },
                { title: 'Book', dataIndex: 'bookBalance', key: 'book', render: (v) => `R ${v.toLocaleString()}` },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (s) => (
                    <Tag color={s === 'matched' ? 'green' : 'orange'}>
                      {s === 'matched' ? 'Reconciled' : 'Pending'}
                    </Tag>
                  )
                }
              ]}
              pagination={false}
              rowKey="account"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={<><AuditOutlined /> Compliance Calendar</>}
            className="workspace-card"
          >
            <Timeline
              items={[
                { color: 'red', children: <><Text strong>VAT201</Text> - Due 25 Dec 2025</> },
                { color: 'orange', children: <><Text strong>EMP201</Text> - Due 7 Jan 2026</> },
                { color: 'blue', children: <><Text strong>Annual Returns</Text> - Due 31 Jan 2026</> },
                { color: 'green', children: <><Text strong>Provisional Tax</Text> - Due 28 Feb 2026</> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  // Render Staff Dashboard
  const renderStaffDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-blue">
            <Statistic 
              title="My Tasks" 
              value={7} 
              valueStyle={{ color: '#667eea' }}
            />
            <div className="kpi-change">3 due today</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-green">
            <Statistic 
              title="Completed This Week" 
              value={12} 
              valueStyle={{ color: '#10b981' }}
            />
            <div className="kpi-change positive"><ArrowUpOutlined /> Great progress!</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-purple">
            <Statistic 
              title="Hours Logged" 
              value={38.5} 
              suffix="hrs" 
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div className="kpi-change">This week</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card gradient-amber">
            <Statistic 
              title="Leave Balance" 
              value={15} 
              suffix="days" 
              valueStyle={{ color: '#f59e0b' }}
            />
            <div className="kpi-change">Annual leave</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<><CheckCircleOutlined /> My Tasks</>}
            extra={<Button type="primary" size="small" icon={<PlusOutlined />}>Add Task</Button>}
            className="workspace-card"
          >
            <List
              dataSource={[
                { id: 1, task: 'Complete monthly report', due: 'Today', priority: 'high', project: 'Finance' },
                { id: 2, task: 'Review supplier invoices', due: 'Today', priority: 'medium', project: 'Purchase' },
                { id: 3, task: 'Update client records', due: 'Tomorrow', priority: 'low', project: 'Sales' },
                { id: 4, task: 'Prepare presentation', due: 'Dec 15', priority: 'medium', project: 'Marketing' },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button size="small" type="link">Complete</Button>,
                    <Button size="small" type="link">Edit</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Tag color={
                        item.priority === 'high' ? 'red' : 
                        item.priority === 'medium' ? 'orange' : 'blue'
                      }>
                        {item.priority}
                      </Tag>
                    }
                    title={item.task}
                    description={`Due: ${item.due} • ${item.project}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={<><CalendarOutlined /> Today's Schedule</>}
            className="workspace-card"
          >
            <Timeline
              items={[
                { color: 'blue', children: <><Text strong>9:00 AM</Text> - Team standup</> },
                { color: 'green', children: <><Text strong>11:00 AM</Text> - Client call</> },
                { color: 'purple', children: <><Text strong>2:00 PM</Text> - Training session</> },
                { color: 'gray', children: <><Text strong>4:30 PM</Text> - End of day review</> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );

  // Role-specific dashboard renderer
  const renderDashboard = () => {
    switch (userRole) {
      case 'director':
        return renderDirectorDashboard();
      case 'executive':
        return renderExecutiveDashboard();
      case 'accountant':
        return renderAccountantDashboard();
      case 'staff':
        return renderStaffDashboard();
      case 'manager':
      default:
        return renderExecutiveDashboard(); // Managers see similar to executives
    }
  };

  const roleLabels: Record<UserRole, string> = {
    director: 'Director',
    executive: 'Executive',
    manager: 'Manager',
    accountant: 'Accountant',
    staff: 'Team Member'
  };

  return (
    <div className="role-workspace">
      {/* Welcome Header */}
      <div className="workspace-header">
        <div className="welcome-section">
          <Title level={3} style={{ margin: 0 }}>
            {greeting}, {currentUser?.firstName || 'there'}! 👋
          </Title>
          <Text type="secondary">
            Here's your personalized workspace for today, {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </div>
        <div className="workspace-controls">
          <Segmented
            options={[
              { value: 'director', label: 'Director' },
              { value: 'executive', label: 'Executive' },
              { value: 'manager', label: 'Manager' },
              { value: 'accountant', label: 'Accountant' },
              { value: 'staff', label: 'Staff' }
            ]}
            value={userRole}
            onChange={(value) => setUserRole(value as UserRole)}
          />
          <Button icon={<SettingOutlined />} onClick={() => navigate('/app/profile')}>
            Customize
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-bar">
        {getQuickActions().map((action, idx) => (
          <div 
            key={idx}
            className="quick-action-item"
            onClick={() => navigate(action.path)}
            style={{ '--action-color': action.color } as React.CSSProperties}
          >
            <div className="action-icon">{action.icon}</div>
            <span className="action-label">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Role-specific Dashboard or New Tenant Welcome */}
      <div className="workspace-content">
        {isNewTenant ? renderNewTenantWelcome() : renderDashboard()}
      </div>
    </div>
  );

  // New Tenant Welcome Screen
  function renderNewTenantWelcome() {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Alert
          message={`Welcome to SiyaBusa ERP, ${tenantName}!`}
          description="Your account is ready. Let's get you set up with the essentials to start managing your business."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card gradient-blue" hoverable onClick={() => navigate('/app/tenant-settings')}>
              <div className="kpi-content">
                <div className="kpi-icon"><SettingOutlined /></div>
                <div className="kpi-data">
                  <Text className="kpi-label">Company Setup</Text>
                  <div className="kpi-value" style={{ fontSize: '1rem' }}>Configure your company details</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card gradient-green" hoverable onClick={() => navigate('/app/user-management')}>
              <div className="kpi-content">
                <div className="kpi-icon"><TeamOutlined /></div>
                <div className="kpi-data">
                  <Text className="kpi-label">Invite Team</Text>
                  <div className="kpi-value" style={{ fontSize: '1rem' }}>Add users to your workspace</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card gradient-purple" hoverable onClick={() => navigate('/app/financial-hub')}>
              <div className="kpi-content">
                <div className="kpi-icon"><BankOutlined /></div>
                <div className="kpi-data">
                  <Text className="kpi-label">Chart of Accounts</Text>
                  <div className="kpi-value" style={{ fontSize: '1rem' }}>Set up your financials</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card gradient-amber" hoverable onClick={() => navigate('/app/inventory-hub')}>
              <div className="kpi-content">
                <div className="kpi-icon"><FileTextOutlined /></div>
                <div className="kpi-data">
                  <Text className="kpi-label">Products & Services</Text>
                  <div className="kpi-value" style={{ fontSize: '1rem' }}>Add your inventory</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card title="Getting Started Checklist" style={{ marginTop: 24 }}>
          <List
            dataSource={[
              { title: 'Complete company profile', path: '/app/tenant-settings', done: false },
              { title: 'Set up chart of accounts', path: '/app/financial-hub', done: false },
              { title: 'Add your first customer', path: '/app/sales-hub', done: false },
              { title: 'Add your first supplier', path: '/app/purchase-hub', done: false },
              { title: 'Create your first invoice', path: '/app/sales-hub', done: false },
              { title: 'Invite team members', path: '/app/user-management', done: false },
            ]}
            renderItem={(item) => (
              <List.Item 
                actions={[<Button type="link" onClick={() => navigate(item.path)}>Start →</Button>]}
              >
                <List.Item.Meta
                  avatar={item.done ? <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} /> : <ClockCircleOutlined style={{ color: '#94a3b8', fontSize: 20 }} />}
                  title={item.title}
                />
              </List.Item>
            )}
          />
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={() => setIsNewTenant(false)}>
            Skip Setup - Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }
};

export default RoleBasedWorkspace;
