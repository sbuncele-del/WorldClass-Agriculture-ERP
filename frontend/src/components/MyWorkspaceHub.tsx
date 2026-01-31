/**
 * MyWorkspaceHub - Personalized Dashboard using Hub Design System
 * 
 * Role-based views with consistent premium design:
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
  Select, Dropdown, Segmented
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DollarOutlined, RiseOutlined, FallOutlined,
  BankOutlined, TeamOutlined, ProjectOutlined, FileTextOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  CalendarOutlined, BellOutlined, RightOutlined, SettingOutlined,
  PieChartOutlined, BarChartOutlined, LineChartOutlined,
  SafetyCertificateOutlined, AuditOutlined, SyncOutlined, SwapOutlined,
  ThunderboltOutlined, StarOutlined, EyeOutlined, PlusOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EditOutlined,
  UserOutlined, CrownOutlined, TrophyOutlined, FireOutlined,
  HomeOutlined, AppstoreOutlined, WalletOutlined
} from '@ant-design/icons';
import {
  HubLayout, HubHeader, StatusBanner, HubTabs, StatCard, QuickActionsCard
} from './hub';
import { useUser } from '../contexts/UserContext';
import './MyWorkspaceHub.css';

const { Title, Text, Paragraph } = Typography;

type UserRole = 'director' | 'executive' | 'manager' | 'accountant' | 'staff';

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

interface Approval {
  id: string;
  type: string;
  description: string;
  amount?: number;
  requestedBy: string;
  date: string;
  urgent: boolean;
}

const MyWorkspaceHub: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  
  const [userRole, setUserRole] = useState<UserRole>('director');
  const [greeting, setGreeting] = useState('Good morning');
  const [activeTab, setActiveTab] = useState('overview');

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Role-specific data
  const roleConfig = {
    director: {
      gradient: 'purple' as const,
      icon: <CrownOutlined />,
      title: 'Director Dashboard',
      subtitle: 'Strategic overview and board-level insights',
    },
    executive: {
      gradient: 'blue' as const,
      icon: <TrophyOutlined />,
      title: 'Executive Dashboard',
      subtitle: 'Performance metrics and approvals',
    },
    manager: {
      gradient: 'cyan' as const,
      icon: <TeamOutlined />,
      title: 'Manager Dashboard',
      subtitle: 'Team operations and project progress',
    },
    accountant: {
      gradient: 'green' as const,
      icon: <BarChartOutlined />,
      title: 'Accountant Dashboard',
      subtitle: 'Financial accuracy and compliance',
    },
    staff: {
      gradient: 'orange' as const,
      icon: <UserOutlined />,
      title: 'My Workspace',
      subtitle: 'Tasks, time tracking, and personal metrics',
    },
  };

  const config = roleConfig[userRole];

  // KPI Data based on role
  const getKPIStats = () => {
    switch (userRole) {
      case 'director':
        return [
          { title: 'Revenue YTD', value: 'R 24.5M', prefix: <DollarOutlined /> },
          { title: 'Net Profit', value: 'R 6.3M', prefix: <RiseOutlined /> },
          { title: 'Cash Position', value: 'R 12.5M', prefix: <BankOutlined /> },
          { title: 'Risk Score', value: 'Low', prefix: <SafetyCertificateOutlined /> },
        ];
      case 'executive':
        return [
          { title: 'Monthly Revenue', value: 'R 2.8M', prefix: <DollarOutlined /> },
          { title: 'Pending Approvals', value: '7', prefix: <ClockCircleOutlined /> },
          { title: 'Team Performance', value: '94%', prefix: <TeamOutlined /> },
          { title: 'Budget Utilized', value: '78%', prefix: <PieChartOutlined /> },
        ];
      case 'manager':
        return [
          { title: 'Active Projects', value: '12', prefix: <ProjectOutlined /> },
          { title: 'Tasks Due Today', value: '5', prefix: <CalendarOutlined /> },
          { title: 'Team Members', value: '8', prefix: <TeamOutlined /> },
          { title: 'On-Time Delivery', value: '92%', prefix: <CheckCircleOutlined /> },
        ];
      case 'accountant':
        return [
          { title: 'Unreconciled', value: '23', prefix: <SwapOutlined /> },
          { title: 'Pending Journals', value: '8', prefix: <FileTextOutlined /> },
          { title: 'Month-End', value: '5 days', prefix: <CalendarOutlined /> },
          { title: 'Compliance', value: '100%', prefix: <SafetyCertificateOutlined /> },
        ];
      case 'staff':
        return [
          { title: 'My Tasks', value: '8', prefix: <CheckCircleOutlined /> },
          { title: 'Due Today', value: '3', prefix: <ClockCircleOutlined /> },
          { title: 'Hours Logged', value: '38.5h', prefix: <ClockCircleOutlined /> },
          { title: 'Completion Rate', value: '87%', prefix: <TrophyOutlined /> },
        ];
      default:
        return [];
    }
  };

  // Tasks data
  const tasks: Task[] = [
    { id: '1', title: 'Review Q4 financial statements', project: 'Year-End Close', dueDate: 'Today', priority: 'high', status: 'in-progress' },
    { id: '2', title: 'Approve supplier payments', project: 'AP Processing', dueDate: 'Today', priority: 'high', status: 'pending' },
    { id: '3', title: 'Complete bank reconciliation', project: 'Monthly Close', dueDate: 'Tomorrow', priority: 'medium', status: 'pending' },
    { id: '4', title: 'Update project milestones', project: 'Website Redesign', dueDate: 'Dec 15', priority: 'medium', status: 'in-progress' },
    { id: '5', title: 'Team performance reviews', project: 'HR', dueDate: 'Dec 20', priority: 'low', status: 'pending' },
  ];

  // Approvals data
  const approvals: Approval[] = [
    { id: '1', type: 'Payment', description: 'Supplier payment - ABC Trading', amount: 125000, requestedBy: 'Sarah Chen', date: 'Today', urgent: true },
    { id: '2', type: 'Leave', description: 'Annual leave request - 5 days', requestedBy: 'Mike Wilson', date: 'Today', urgent: false },
    { id: '3', type: 'Expense', description: 'Travel reimbursement', amount: 8500, requestedBy: 'John Davis', date: 'Yesterday', urgent: false },
    { id: '4', type: 'Purchase', description: 'Office equipment procurement', amount: 45000, requestedBy: 'Lisa Brown', date: 'Yesterday', urgent: true },
  ];

  // Recent Activity
  const recentActivity = [
    { icon: <CheckCircleOutlined style={{ color: '#10b981' }} />, text: 'Invoice #INV-2025-089 approved', time: '5 min ago' },
    { icon: <BankOutlined style={{ color: '#3b82f6' }} />, text: 'Bank reconciliation completed', time: '1 hour ago' },
    { icon: <FileTextOutlined style={{ color: '#667eea' }} />, text: 'New quote sent to XYZ Corp', time: '2 hours ago' },
    { icon: <TeamOutlined style={{ color: '#f59e0b' }} />, text: 'Team meeting scheduled', time: '3 hours ago' },
    { icon: <DollarOutlined style={{ color: '#10b981' }} />, text: 'Payment received R 250,000', time: '4 hours ago' },
  ];

  // Quick Actions based on role
  const getQuickActions = () => {
    const baseActions = [
      { icon: <PlusOutlined />, label: 'New Invoice', onClick: () => navigate('/app/sales-hub'), color: '#10b981' },
      { icon: <FileTextOutlined />, label: 'Create Quote', onClick: () => navigate('/app/sales-hub'), color: '#3b82f6' },
      { icon: <BankOutlined />, label: 'Bank Recon', onClick: () => navigate('/app/banking-hub'), color: '#667eea' },
      { icon: <ProjectOutlined />, label: 'Projects', onClick: () => navigate('/app/projects-hub'), color: '#f59e0b' },
    ];

    if (userRole === 'director' || userRole === 'executive') {
      return [
        { icon: <BarChartOutlined />, label: 'Reports', onClick: () => navigate('/app/financial-hub'), color: '#10b981' },
        { icon: <AuditOutlined />, label: 'Audit Trail', onClick: () => navigate('/app/audit-ready'), color: '#3b82f6' },
        ...baseActions.slice(2),
      ];
    }

    return baseActions;
  };

  // Priority colors
  const priorityColors = { high: 'red', medium: 'orange', low: 'blue' };
  const statusColors = { pending: 'default', 'in-progress': 'processing', completed: 'success' };

  // Tabs content
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]}>
          {/* Quick Actions */}
          <Col xs={24} lg={8}>
            <Card title={<><ThunderboltOutlined /> Quick Actions</>} size="small">
              <Row gutter={[8, 8]}>
                {getQuickActions().map((action, i) => (
                  <Col span={12} key={i}>
                    <Button 
                      block 
                      icon={action.icon} 
                      onClick={action.onClick}
                      style={{ height: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span style={{ fontSize: 12, marginTop: 4 }}>{action.label}</span>
                    </Button>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* Recent Activity */}
            <Card title={<><ClockCircleOutlined /> Recent Activity</>} size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={recentActivity.map((item, i) => ({
                  dot: item.icon,
                  children: (
                    <div key={i}>
                      <Text>{item.text}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>

          {/* Tasks */}
          <Col xs={24} lg={16}>
            <Card 
              title={<><CheckCircleOutlined /> My Tasks</>} 
              size="small"
              extra={<Button type="link" onClick={() => setActiveTab('tasks')}>View All</Button>}
            >
              <Table
                dataSource={tasks.slice(0, 5)}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { 
                    title: 'Task', 
                    dataIndex: 'title', 
                    key: 'title',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.project}</Text>
                      </div>
                    )
                  },
                  { 
                    title: 'Due', 
                    dataIndex: 'dueDate', 
                    key: 'dueDate', 
                    width: 100,
                    render: (date) => (
                      <Tag color={date === 'Today' ? 'red' : date === 'Tomorrow' ? 'orange' : 'default'}>
                        {date}
                      </Tag>
                    )
                  },
                  { 
                    title: 'Priority', 
                    dataIndex: 'priority', 
                    key: 'priority', 
                    width: 80,
                    render: (p) => <Tag color={priorityColors[p]}>{p}</Tag>
                  },
                  { 
                    title: 'Status', 
                    dataIndex: 'status', 
                    key: 'status', 
                    width: 100,
                    render: (s) => <Badge status={statusColors[s] as any} text={s.replace('-', ' ')} />
                  },
                ]}
              />
            </Card>

            {/* Pending Approvals - for executives/directors */}
            {(userRole === 'director' || userRole === 'executive' || userRole === 'manager') && (
              <Card 
                title={<><BellOutlined /> Pending Approvals</>} 
                size="small" 
                style={{ marginTop: 16 }}
                extra={<Badge count={approvals.length} />}
              >
                <List
                  dataSource={approvals}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="primary" size="small" key="approve">Approve</Button>,
                        <Button size="small" key="reject">Reject</Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: item.urgent ? '#ef4444' : '#3b82f6' }}>
                            {item.type[0]}
                          </Avatar>
                        }
                        title={
                          <Space>
                            {item.description}
                            {item.urgent && <Tag color="red">Urgent</Tag>}
                          </Space>
                        }
                        description={
                          <Space>
                            <Text type="secondary">{item.requestedBy}</Text>
                            {item.amount && <Text strong>R {item.amount.toLocaleString()}</Text>}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>
        </Row>
      ),
    },
    {
      key: 'tasks',
      label: 'All Tasks',
      children: (
        <Card>
          <Table
            dataSource={tasks}
            rowKey="id"
            columns={[
              { title: 'Task', dataIndex: 'title', key: 'title' },
              { title: 'Project', dataIndex: 'project', key: 'project' },
              { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
              { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p) => <Tag color={priorityColors[p]}>{p}</Tag> },
              { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Badge status={statusColors[s] as any} text={s} /> },
              { title: 'Actions', key: 'actions', render: () => <Button size="small">View</Button> },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      children: (
        <Card>
          <Alert message="Calendar view coming soon" description="View your schedule, meetings, and deadlines in a calendar format." type="info" showIcon />
        </Card>
      ),
    },
  ];

  return (
    <HubLayout>
      {/* Hub Header with Role Selector */}
      <HubHeader
        title={`${greeting}, ${currentUser?.firstName || 'User'}`}
        subtitle={config.subtitle}
        icon={config.icon}
        gradient={config.gradient}
        actions={
          <Space>
            <Select
              value={userRole}
              onChange={(v) => setUserRole(v as UserRole)}
              style={{ width: 140 }}
              options={[
                { value: 'director', label: '👑 Director' },
                { value: 'executive', label: '🏆 Executive' },
                { value: 'manager', label: '👥 Manager' },
                { value: 'accountant', label: '📊 Accountant' },
                { value: 'staff', label: '👤 Staff' },
              ]}
            />
            <Button icon={<SettingOutlined />}>Customize</Button>
          </Space>
        }
      />

      {/* Status Banner with Role KPIs */}
      <StatusBanner
        gradient={config.gradient}
        icon={config.icon}
        title={config.title}
        subtitle={new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        stats={getKPIStats()}
      />

      {/* Tabs Content */}
      <Card style={{ marginTop: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </HubLayout>
  );
};

export default MyWorkspaceHub;
