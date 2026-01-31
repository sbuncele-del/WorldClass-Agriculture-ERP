/**
 * Super Admin Panel - System-Wide Administration
 * 
 * Features:
 * - Tenant Management & Monitoring
 * - System Health Dashboard
 * - Support Ticket Management
 * - Feature Flags Management
 * - Active Alerts & Monitoring
 * - Admin Audit Logs
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Badge,
  Input, Select, Modal, Form, Typography, Avatar, Tooltip,
  Alert, List, Tabs, message, Progress, Spin, Descriptions, Timeline
} from 'antd';
import {
  TeamOutlined, DashboardOutlined, SettingOutlined, SyncOutlined,
  UserOutlined, BellOutlined, SafetyCertificateOutlined, BankOutlined,
  CheckCircleOutlined, WarningOutlined, CloseCircleOutlined,
  SearchOutlined, FilterOutlined, ExportOutlined, EyeOutlined,
  EditOutlined, ThunderboltOutlined, DatabaseOutlined, CloudOutlined,
  AlertOutlined, FileTextOutlined, HistoryOutlined, KeyOutlined,
  GlobalOutlined, ApiOutlined, RocketOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';
import './SuperAdminPanel.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Interfaces
interface Tenant {
  tenant_id: string;
  tenant_name: string;
  subscription_plan: string;
  status: string;
  created_at: string;
  user_count: number;
  active_user_count: number;
  last_activity: string;
  active_users_today: number;
  api_calls_today: number;
  error_rate: number;
  health_status: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL';
  health_score: number;
  database_size_mb: number;
  open_tickets: number;
  active_alerts: number;
}

interface SystemHealth {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  active_users_today: number;
  total_api_calls: number;
  total_errors: number;
  avg_response_time: number;
  critical_alerts: number;
  open_tickets: number;
  uptime_percentage: number;
}

interface SupportTicket {
  ticket_id: string;
  tenant_id: string;
  tenant_name: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to: string;
  comments_count: number;
}

interface ActiveAlert {
  alert_id: string;
  tenant_id: string;
  tenant_name: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  created_at: string;
  status: string;
}

interface AuditLog {
  log_id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  tenant_id: string;
  tenant_name: string;
  details: any;
  ip_address: string;
  created_at: string;
}

const SuperAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data state
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Filter state
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('');
  
  // Modal state
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [tenantDetailModalVisible, setTenantDetailModalVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [form] = Form.useForm();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('platform_admin_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('platform_admin_user') || localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/platform-admin/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      // Check for platform admin roles - admin is allowed for platform owners
      if (!['platform_admin', 'support_agent', 'monitoring_user', 'super_admin', 'admin'].includes(user.role)) {
        message.error('You do not have platform administrator access');
        navigate('/platform-admin/login');
        return;
      }
      setIsAuthenticated(true);
    } catch (e) {
      navigate('/platform-admin/login');
    }
  }, [navigate]);

  // Fetch all data
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [healthRes, tenantsRes, ticketsRes, alertsRes, logsRes] = await Promise.all([
        apiClient.get('/api/super-admin/system/health').catch(() => ({ data: null })),
        apiClient.get('/api/super-admin/tenants').catch(() => ({ data: { tenants: [] } })),
        apiClient.get('/api/super-admin/tickets').catch(() => ({ data: { tickets: [] } })),
        apiClient.get('/api/super-admin/alerts').catch(() => ({ data: { alerts: [] } })),
        apiClient.get('/api/super-admin/audit-logs').catch(() => ({ data: { logs: [] } })),
      ]);

      setSystemHealth(healthRes.data?.data || healthRes.data || null);
      setTenants(tenantsRes.data?.tenants || tenantsRes.data?.data || []);
      setTickets(ticketsRes.data?.tickets || ticketsRes.data?.data || []);
      setAlerts(alertsRes.data?.alerts || alertsRes.data?.data || []);
      setAuditLogs(logsRes.data?.logs || logsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch super admin data:', error);
      message.error('Failed to load admin data. Check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
      HEALTHY: { color: '#10b981', icon: <CheckCircleOutlined /> },
      WARNING: { color: '#f59e0b', icon: <WarningOutlined /> },
      DEGRADED: { color: '#f97316', icon: <WarningOutlined /> },
      CRITICAL: { color: '#ef4444', icon: <CloseCircleOutlined /> },
    };
    const config = configs[status] || { color: '#64748b', icon: null };
    return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'default',
      MEDIUM: 'blue',
      HIGH: 'orange',
      CRITICAL: 'red',
    };
    return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'blue',
      IN_PROGRESS: 'processing',
      WAITING: 'warning',
      RESOLVED: 'success',
      CLOSED: 'default',
      active: 'green',
      suspended: 'red',
      trial: 'orange',
    };
    return <Tag color={colors[status] || 'default'}>{status}</Tag>;
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantDetailModalVisible(true);
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const reason = window.prompt('Please provide a reason for impersonation (required for audit):');
      if (!reason) return;

      const res = await apiClient.post(`/api/super-admin/tenants/${tenantId}/impersonate`, { reason });
      if (res.data?.token) {
        message.success(`Impersonation started: ${res.data.tenant_name}`);
        
        // Store impersonation token and original user data for switching back
        const originalToken = localStorage.getItem('token');
        const originalUser = localStorage.getItem('user');
        sessionStorage.setItem('original_token', originalToken || '');
        sessionStorage.setItem('original_user', originalUser || '');
        sessionStorage.setItem('impersonation_active', 'true');
        sessionStorage.setItem('impersonated_tenant_name', res.data.tenant_name);
        
        // Set the impersonation token as the active token
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('impersonation_mode', 'true');
        
        // Update user data with impersonated tenant info
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        currentUser.impersonating = true;
        currentUser.impersonatedTenant = res.data.tenant_name;
        currentUser.tenantId = res.data.tenant_id;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Open the actual dashboard (not landing page) in new tab
        window.open(`/dashboard?impersonating=${encodeURIComponent(res.data.tenant_name)}`, '_blank');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to impersonate tenant');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const notes = window.prompt('Resolution notes (optional):');
      await apiClient.put(`/api/super-admin/alerts/${alertId}/resolve`, {
        status: 'RESOLVED',
        resolution_notes: notes || '',
      });
      message.success('Alert resolved');
      fetchAllData();
    } catch (error) {
      message.error('Failed to resolve alert');
    }
  };

  // Tenant columns
  const tenantColumns = [
    {
      title: 'Tenant',
      key: 'tenant',
      render: (_: any, record: Tenant) => (
        <div>
          <Text strong>{record.tenant_name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.tenant_id.slice(0, 8)}...</Text>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      render: (plan: string) => <Tag color="purple">{plan || 'Free'}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Health',
      dataIndex: 'health_status',
      key: 'health',
      render: (status: string) => getHealthBadge(status || 'HEALTHY'),
    },
    {
      title: 'Users',
      key: 'users',
      render: (_: any, record: Tenant) => (
        <Tooltip title={`${record.active_user_count || 0} active / ${record.user_count || 0} total`}>
          <Space>
            <TeamOutlined />
            <span>{record.active_user_count || 0}/{record.user_count || 0}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'API Calls',
      dataIndex: 'api_calls_today',
      key: 'api_calls',
      render: (calls: number) => (calls || 0).toLocaleString(),
    },
    {
      title: 'Error Rate',
      dataIndex: 'error_rate',
      key: 'error_rate',
      render: (rate: number) => (
        <span style={{ color: (rate || 0) > 5 ? '#ef4444' : '#10b981' }}>
          {(rate || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: 'Tickets',
      dataIndex: 'open_tickets',
      key: 'tickets',
      render: (count: number) => (
        <Badge count={count || 0} showZero style={{ backgroundColor: count > 0 ? '#f59e0b' : '#d9d9d9' }} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Tenant) => (
        <Space>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewTenant(record)} />
          </Tooltip>
          <Tooltip title="Impersonate">
            <Button size="small" icon={<KeyOutlined />} onClick={() => handleImpersonate(record.tenant_id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Ticket columns
  const ticketColumns = [
    {
      title: 'Ticket',
      key: 'ticket',
      render: (_: any, record: SupportTicket) => (
        <div>
          <Text strong>{record.subject}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.tenant_name}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Assigned To',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (name: string) => name || <Text type="secondary">Unassigned</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SupportTicket) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>View</Button>
          <Button size="small" icon={<EditOutlined />}>Update</Button>
        </Space>
      ),
    },
  ];

  // Alert columns
  const alertColumns = [
    {
      title: 'Alert',
      key: 'alert',
      render: (_: any, record: ActiveAlert) => (
        <div>
          <Text strong>{record.alert_type}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.message}</Text>
        </div>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenant_name',
      key: 'tenant',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors: Record<string, string> = {
          INFO: 'blue',
          WARNING: 'orange',
          ERROR: 'red',
          CRITICAL: 'magenta',
        };
        return <Tag color={colors[severity] || 'default'}>{severity}</Tag>;
      },
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ActiveAlert) => (
        <Button size="small" type="primary" onClick={() => handleResolveAlert(record.alert_id)}>
          Resolve
        </Button>
      ),
    },
  ];

  // Dashboard Tab Content
  const renderDashboard = () => (
    <div style={{ padding: 24 }}>
      {/* System Health KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tenants"
              value={systemHealth?.total_tenants || tenants.length}
              prefix={<GlobalOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: 12 }}>/ {systemHealth?.active_tenants || tenants.filter(t => t.status === 'active').length} active</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Users Today"
              value={systemHealth?.active_users_today || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="API Calls Today"
              value={systemHealth?.total_api_calls || 0}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={systemHealth?.uptime_percentage || 99.9}
              suffix="%"
              prefix={<CloudOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: '4px solid #ef4444' }}>
            <Statistic
              title="Critical Alerts"
              value={systemHealth?.critical_alerts || alerts.filter(a => a.severity === 'CRITICAL').length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: '4px solid #f59e0b' }}>
            <Statistic
              title="Open Support Tickets"
              value={systemHealth?.open_tickets || tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderLeft: '4px solid #3b82f6' }}>
            <Statistic
              title="Avg Response Time"
              value={systemHealth?.avg_response_time || 0}
              suffix="ms"
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Views */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="⚠️ Tenants Needing Attention" extra={<Button type="link">View All</Button>}>
            <List
              size="small"
              dataSource={tenants.filter(t => t.health_status === 'CRITICAL' || t.health_status === 'DEGRADED' || t.open_tickets > 0).slice(0, 5)}
              renderItem={tenant => (
                <List.Item
                  actions={[
                    <Button size="small" onClick={() => handleViewTenant(tenant)}>View</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: tenant.health_status === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>{tenant.tenant_name[0]}</Avatar>}
                    title={tenant.tenant_name}
                    description={
                      <Space>
                        {getHealthBadge(tenant.health_status)}
                        {tenant.open_tickets > 0 && <Tag color="orange">{tenant.open_tickets} tickets</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'All tenants healthy! 🎉' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🔔 Recent Alerts" extra={<Button type="link" onClick={() => setActiveTab('alerts')}>View All</Button>}>
            <List
              size="small"
              dataSource={alerts.slice(0, 5)}
              renderItem={alert => (
                <List.Item
                  actions={[
                    <Button size="small" onClick={() => handleResolveAlert(alert.alert_id)}>Resolve</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ 
                        backgroundColor: alert.severity === 'CRITICAL' ? '#ef4444' : 
                                         alert.severity === 'ERROR' ? '#f97316' : '#f59e0b' 
                      }}>
                        <AlertOutlined />
                      </Avatar>
                    }
                    title={alert.alert_type}
                    description={<Text type="secondary">{alert.tenant_name} - {new Date(alert.created_at).toLocaleTimeString()}</Text>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No active alerts' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Tenants Tab Content
  const renderTenants = () => (
    <div style={{ padding: 24 }}>
      <Card
        title="All Tenants"
        extra={
          <Space>
            <Input
              placeholder="Search tenants..."
              prefix={<SearchOutlined />}
              value={tenantFilter}
              onChange={e => setTenantFilter(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 120 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              <Option value="active">Active</Option>
              <Option value="suspended">Suspended</Option>
              <Option value="trial">Trial</Option>
            </Select>
            <Select
              placeholder="Health"
              allowClear
              style={{ width: 120 }}
              value={healthFilter || undefined}
              onChange={setHealthFilter}
            >
              <Option value="HEALTHY">Healthy</Option>
              <Option value="WARNING">Warning</Option>
              <Option value="DEGRADED">Degraded</Option>
              <Option value="CRITICAL">Critical</Option>
            </Select>
            <Button icon={<SyncOutlined />} onClick={fetchAllData}>Refresh</Button>
          </Space>
        }
      >
        <Table
          dataSource={tenants.filter(t => 
            (!tenantFilter || t.tenant_name.toLowerCase().includes(tenantFilter.toLowerCase())) &&
            (!statusFilter || t.status === statusFilter) &&
            (!healthFilter || t.health_status === healthFilter)
          )}
          columns={tenantColumns}
          rowKey="tenant_id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );

  // Tickets Tab Content
  const renderTickets = () => (
    <div style={{ padding: 24 }}>
      <Card
        title="Support Tickets"
        extra={
          <Space>
            <Button type="primary" icon={<FileTextOutlined />} onClick={() => setTicketModalVisible(true)}>
              Create Ticket
            </Button>
            <Button icon={<SyncOutlined />} onClick={fetchAllData}>Refresh</Button>
          </Space>
        }
      >
        <Table
          dataSource={tickets}
          columns={ticketColumns}
          rowKey="ticket_id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );

  // Alerts Tab Content
  const renderAlerts = () => (
    <div style={{ padding: 24 }}>
      <Card title="Active Alerts" extra={<Button icon={<SyncOutlined />} onClick={fetchAllData}>Refresh</Button>}>
        <Table
          dataSource={alerts}
          columns={alertColumns}
          rowKey="alert_id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );

  // Audit Logs Tab Content
  const renderAuditLogs = () => (
    <div style={{ padding: 24 }}>
      <Card title="Admin Audit Logs">
        <Timeline>
          {auditLogs.slice(0, 50).map(log => (
            <Timeline.Item key={log.log_id} color={log.action.includes('DELETE') ? 'red' : log.action.includes('UPDATE') ? 'orange' : 'blue'}>
              <div>
                <Text strong>{log.action}</Text>
                <br />
                <Text type="secondary">
                  {log.admin_email} • {log.tenant_name || 'System'} • {new Date(log.created_at).toLocaleString()}
                </Text>
                {log.details && (
                  <>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{JSON.stringify(log.details).slice(0, 100)}...</Text>
                  </>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );

  const tabItems = [
    { key: 'dashboard', label: <span><DashboardOutlined /> Dashboard</span>, children: renderDashboard() },
    { key: 'tenants', label: <span><GlobalOutlined /> Tenants ({tenants.length})</span>, children: renderTenants() },
    { key: 'tickets', label: <span><FileTextOutlined /> Tickets ({tickets.filter(t => t.status !== 'CLOSED').length})</span>, children: renderTickets() },
    { key: 'alerts', label: <span><BellOutlined /> Alerts ({alerts.length})</span>, children: renderAlerts() },
    { key: 'audit', label: <span><HistoryOutlined /> Audit Logs</span>, children: renderAuditLogs() },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading Super Admin Panel..." />
      </div>
    );
  }

  return (
    <div className="super-admin-panel">
      {/* Header */}
      <div className="admin-header" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', padding: '24px 32px', marginBottom: 0 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <SafetyCertificateOutlined /> Super Admin Panel
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              System-wide administration and monitoring
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<SyncOutlined />} onClick={fetchAllData}>
                Refresh All
              </Button>
              <Button type="primary" icon={<ExportOutlined />}>
                Export Report
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ background: 'white' }}
        tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
      />

      {/* Tenant Detail Modal */}
      <Modal
        title={`Tenant Details: ${selectedTenant?.tenant_name}`}
        open={tenantDetailModalVisible}
        onCancel={() => setTenantDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="impersonate" icon={<KeyOutlined />} onClick={() => selectedTenant && handleImpersonate(selectedTenant.tenant_id)}>
            Impersonate
          </Button>,
          <Button key="close" onClick={() => setTenantDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedTenant && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tenant ID">{selectedTenant.tenant_id}</Descriptions.Item>
            <Descriptions.Item label="Name">{selectedTenant.tenant_name}</Descriptions.Item>
            <Descriptions.Item label="Plan">{selectedTenant.subscription_plan || 'Free'}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(selectedTenant.status)}</Descriptions.Item>
            <Descriptions.Item label="Health">{getHealthBadge(selectedTenant.health_status)}</Descriptions.Item>
            <Descriptions.Item label="Health Score">{selectedTenant.health_score || 100}%</Descriptions.Item>
            <Descriptions.Item label="Total Users">{selectedTenant.user_count || 0}</Descriptions.Item>
            <Descriptions.Item label="Active Users">{selectedTenant.active_user_count || 0}</Descriptions.Item>
            <Descriptions.Item label="API Calls Today">{selectedTenant.api_calls_today || 0}</Descriptions.Item>
            <Descriptions.Item label="Error Rate">{selectedTenant.error_rate?.toFixed(2) || 0}%</Descriptions.Item>
            <Descriptions.Item label="Database Size">{selectedTenant.database_size_mb?.toFixed(1) || 0} MB</Descriptions.Item>
            <Descriptions.Item label="Open Tickets">{selectedTenant.open_tickets || 0}</Descriptions.Item>
            <Descriptions.Item label="Active Alerts">{selectedTenant.active_alerts || 0}</Descriptions.Item>
            <Descriptions.Item label="Last Activity">{selectedTenant.last_activity ? new Date(selectedTenant.last_activity).toLocaleString() : 'Never'}</Descriptions.Item>
            <Descriptions.Item label="Created">{new Date(selectedTenant.created_at).toLocaleDateString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        title="Create Support Ticket"
        open={ticketModalVisible}
        onCancel={() => setTicketModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tenant" name="tenant_id" rules={[{ required: true }]}>
            <Select placeholder="Select tenant">
              {tenants.map(t => (
                <Option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Subject" name="subject" rules={[{ required: true }]}>
            <Input placeholder="Ticket subject" />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Describe the issue..." />
          </Form.Item>
          <Form.Item label="Priority" name="priority" initialValue="MEDIUM">
            <Select>
              <Option value="LOW">Low</Option>
              <Option value="MEDIUM">Medium</Option>
              <Option value="HIGH">High</Option>
              <Option value="CRITICAL">Critical</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Category" name="category">
            <Select placeholder="Select category">
              <Option value="TECHNICAL">Technical</Option>
              <Option value="BILLING">Billing</Option>
              <Option value="FEATURE_REQUEST">Feature Request</Option>
              <Option value="BUG">Bug Report</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminPanel;
