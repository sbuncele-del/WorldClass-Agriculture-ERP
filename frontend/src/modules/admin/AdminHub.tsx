/**
 * AdminHub - Unified Administration & Settings Hub
 * 
 * Features:
 * - Company Setup & Configuration
 * - User Management
 * - Billing & Subscription
 * - System Settings
 * - Design System / Theming
 * - Audit Logs
 * - Security Settings
 * - Integration Management
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, Modal, Form, Typography, Avatar,
  Descriptions, Tooltip, Switch, Alert,
  List, Divider, Tabs, Upload, message, Checkbox, Empty, ColorPicker, Spin
} from 'antd';
import apiClient from '../../services/api';
import {
  HomeOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, SendOutlined,
  UserOutlined, BellOutlined, FileTextOutlined, MailOutlined,
  SafetyCertificateOutlined, BankOutlined, RocketOutlined,
  LockOutlined, EyeOutlined, DownloadOutlined, UploadOutlined,
  EditOutlined, DeleteOutlined, KeyOutlined, GlobalOutlined,
  CreditCardOutlined, DollarOutlined, ApiOutlined, DatabaseOutlined,
  CloudOutlined, MobileOutlined, DesktopOutlined, ShopOutlined,
  BgColorsOutlined, FormatPainterOutlined, HistoryOutlined,
  SecurityScanOutlined, AuditOutlined, IdcardOutlined
} from '@ant-design/icons';
import HubLayout from '../../components/hub/HubLayout';
import HubHeader from '../../components/hub/HubHeader';
import StatusBanner from '../../components/hub/StatusBanner';
import HubTabs from '../../components/hub/HubTabs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  mfaEnabled: boolean;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  description: string;
}

const AdminHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [companyForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState<any>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, auditLogsRes, integrationsRes, tenantRes] = await Promise.all([
          apiClient.get('/api/admin/users'),
          apiClient.get('/api/admin/audit-logs'),
          apiClient.get('/api/admin/integrations'),
          apiClient.get('/api/v2/settings/tenant')
        ]);
        setUsers(usersRes.data || []);
        setAuditLogs(auditLogsRes.data || []);
        setIntegrations(integrationsRes.data || []);
        
        // Load company settings
        if (tenantRes.data?.success && tenantRes.data?.data) {
          const tenant = tenantRes.data.data;
          setCompanySettings(tenant);
          // Set form values
          companyForm.setFieldsValue({
            companyName: tenant.business_name || tenant.name || '',
            tradingAs: tenant.name || '',
            registrationNumber: tenant.registration_number || '',
            vatNumber: tenant.vat_number || '',
            taxNumber: tenant.tax_number || '',
            bbbeeLevel: tenant.bbbee_level || '4',
            address: tenant.address || '',
            postalAddress: tenant.postal_address || '',
            phone: tenant.phone || '',
            email: tenant.email || '',
            website: tenant.website || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        message.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyForm]);
  
  // Save company settings
  const handleSaveCompany = async () => {
    try {
      setSavingCompany(true);
      const values = companyForm.getFieldsValue();
      
      await apiClient.put('/api/v2/settings/tenant', {
        businessName: values.companyName,
        registrationNumber: values.registrationNumber,
        vatNumber: values.vatNumber,
        taxNumber: values.taxNumber,
        address: values.address,
        phone: values.phone,
        email: values.email,
        website: values.website
      });
      
      // Update localStorage tenant info so header updates
      const existingTenant = localStorage.getItem('tenant');
      if (existingTenant) {
        const tenant = JSON.parse(existingTenant);
        tenant.name = values.companyName || values.tradingAs;
        tenant.registration_number = values.registrationNumber;
        localStorage.setItem('tenant', JSON.stringify(tenant));
      }
      
      message.success('Company settings saved successfully');
    } catch (error) {
      console.error('Failed to save company settings:', error);
      message.error('Failed to save company settings');
    } finally {
      setSavingCompany(false);
    }
  };

  // Calculations
  const activeUsers = users.filter(u => u.status === 'active').length;
  const mfaEnabledUsers = users.filter(u => u.mfaEnabled).length;
  const connectedIntegrations = integrations.filter(i => i.status === 'connected').length;

  // Overview Tab
  const renderOverview = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Total Users" 
              value={users.length}
              prefix={<TeamOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Active Users" 
              value={activeUsers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="MFA Enabled" 
              value={mfaEnabledUsers}
              suffix={`/ ${users.length}`}
              prefix={<LockOutlined />} 
            />
            <Progress percent={Math.round((mfaEnabledUsers / users.length) * 100)} size="small" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Active Integrations" 
              value={connectedIntegrations}
              suffix={`/ ${integrations.length}`}
              prefix={<ApiOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title={<><RocketOutlined /> Quick Actions</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" hoverable onClick={() => setUserModalVisible(true)}>
              <Space>
                <Avatar style={{ background: '#1890ff' }} icon={<UserOutlined />} />
                <div>
                  <Text strong>Add User</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Create new user account</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable>
              <Space>
                <Avatar style={{ background: '#52c41a' }} icon={<DownloadOutlined />} />
                <div>
                  <Text strong>Export Data</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Download system backup</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable>
              <Space>
                <Avatar style={{ background: '#722ed1' }} icon={<SecurityScanOutlined />} />
                <div>
                  <Text strong>Security Scan</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Run security audit</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable>
              <Space>
                <Avatar style={{ background: '#fa8c16' }} icon={<ApiOutlined />} />
                <div>
                  <Text strong>API Keys</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Manage API access</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* System Health */}
      <Card title={<><DesktopOutlined /> System Health</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="Database" />
                <Text type="secondary">PostgreSQL - Healthy</Text>
                <Progress percent={45} size="small" status="active" />
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="API Server" />
                <Text type="secondary">Response: 42ms</Text>
                <Progress percent={100} size="small" status="success" />
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="Storage" />
                <Text type="secondary">120 GB / 500 GB</Text>
                <Progress percent={24} size="small" />
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="processing" text="Last Backup" />
                <Text type="secondary">2025-12-11 06:00</Text>
                <Progress percent={100} size="small" status="success" />
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Company Setup Tab
  const renderCompanySetup = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><ShopOutlined /> Company Information</>}>
        <Form form={companyForm} layout="vertical" onFinish={handleSaveCompany}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Company Name" name="companyName">
                <Input placeholder="Enter company name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trading As" name="tradingAs">
                <Input placeholder="Trading name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Registration Number (CIPC)" name="registrationNumber">
                <Input placeholder="2024/123456/07" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="VAT Number" name="vatNumber">
                <Input placeholder="4123456789" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Tax Number" name="taxNumber">
                <Input placeholder="9123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="B-BBEE Level" name="bbbeeLevel">
                <Select placeholder="Select B-BBEE Level">
                  <Option value="1">Level 1</Option>
                  <Option value="2">Level 2</Option>
                  <Option value="3">Level 3</Option>
                  <Option value="4">Level 4</Option>
                  <Option value="5">Level 5</Option>
                  <Option value="6">Level 6</Option>
                  <Option value="7">Level 7</Option>
                  <Option value="8">Level 8</Option>
                  <Option value="nc">Non-Compliant</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Title level={5}>Contact Details</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Physical Address" name="address">
                <TextArea rows={3} placeholder="123 Main Street\nSandton\nJohannesburg\n2196" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Postal Address" name="postalAddress">
                <TextArea rows={3} placeholder="PO Box 12345\nSandton\n2146" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+27 11 123 4567" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" name="email">
                <Input placeholder="info@company.co.za" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Website" name="website">
                <Input placeholder="www.company.co.za" />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Form.Item label="Company Logo">
            <Upload listType="picture-card">
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={savingCompany}>
            Save Changes
          </Button>
        </Form>
      </Card>
    </div>
  );

  // User Management Tab
  const renderUserManagement = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><TeamOutlined /> User Management</>}
        extra={
          <Space>
            <Input.Search placeholder="Search users..." style={{ width: 250 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)}>
              Add User
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={users}
          rowKey="id"
          columns={[
            {
              title: 'User',
              key: 'user',
              render: (_, record) => (
                <Space>
                  <Avatar style={{ background: record.status === 'active' ? '#1890ff' : '#999' }}>
                    {record.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Role',
              dataIndex: 'role',
              key: 'role',
              render: (role: string) => <Tag color="blue">{role}</Tag>
            },
            {
              title: 'Department',
              dataIndex: 'department',
              key: 'department'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Badge status={status === 'active' ? 'success' : status === 'pending' ? 'processing' : 'default'} text={status} />
              )
            },
            {
              title: 'MFA',
              dataIndex: 'mfaEnabled',
              key: 'mfa',
              render: (enabled: boolean) => (
                enabled ? <Tag color="green"><LockOutlined /> Enabled</Tag> : <Tag>Disabled</Tag>
              )
            },
            {
              title: 'Last Login',
              dataIndex: 'lastLogin',
              key: 'lastLogin',
              render: (login?: string) => login || '-'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} />
                  <Button size="small" icon={<KeyOutlined />} />
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Billing Tab
  const renderBilling = () => (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
        <Row align="middle" gutter={24}>
          <Col span={16}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>Enterprise Plan</Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 0 }}>
              Unlimited users • All modules • Priority support • Custom integrations
            </Paragraph>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>R 4,999</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>per month</Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Current Period" value="Dec 1 - Dec 31, 2025" prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Next Payment" value="R 4,999" prefix={<DollarOutlined />} />
            <Text type="secondary">Due: Jan 1, 2026</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Payment Method" value="•••• 4242" prefix={<CreditCardOutlined />} />
            <Text type="secondary">Visa</Text>
          </Card>
        </Col>
      </Row>

      <Card title={<><HistoryOutlined /> Billing History</>} style={{ marginTop: 16 }}>
        <Table
          dataSource={[
            { id: 'INV-001', date: '2025-12-01', amount: 4999, status: 'paid' },
            { id: 'INV-002', date: '2025-11-01', amount: 4999, status: 'paid' },
            { id: 'INV-003', date: '2025-10-01', amount: 4999, status: 'paid' }
          ]}
          rowKey="id"
          columns={[
            { title: 'Invoice', dataIndex: 'id', key: 'id' },
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amt: number) => `R ${amt.toLocaleString()}` },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="green">{s}</Tag> },
            { title: 'Actions', key: 'actions', render: () => <Button size="small" icon={<DownloadOutlined />}>Download</Button> }
          ]}
        />
      </Card>
    </div>
  );

  // Design System Tab
  const renderDesignSystem = () => (
    <div style={{ padding: '24px' }}>
      <Alert
        message="Design System"
        description="Customize the look and feel of your ERP system. Changes apply to all users in your organization."
        type="info"
        showIcon
        icon={<BgColorsOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Card title={<><FormatPainterOutlined /> Theme Settings</>}>
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Primary Color">
                <ColorPicker defaultValue="#1890ff" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Accent Color">
                <ColorPicker defaultValue="#52c41a" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Theme Mode">
                <Select defaultValue="light">
                  <Option value="light">Light Mode</Option>
                  <Option value="dark">Dark Mode</Option>
                  <Option value="auto">System Default</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Sidebar Style">
                <Select defaultValue="default">
                  <Option value="default">Default</Option>
                  <Option value="compact">Compact</Option>
                  <Option value="collapsed">Collapsed by Default</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Font Size">
            <Select defaultValue="medium">
              <Option value="small">Small</Option>
              <Option value="medium">Medium</Option>
              <Option value="large">Large</Option>
            </Select>
          </Form.Item>
          <Divider />
          <Button type="primary">Apply Theme</Button>
        </Form>
      </Card>
    </div>
  );

  // Integrations Tab
  const renderIntegrations = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><ApiOutlined /> Integrations</>}
        extra={<Button type="primary" icon={<PlusOutlined />}>Add Integration</Button>}
      >
        <List
          dataSource={integrations}
          renderItem={integration => (
            <List.Item
              actions={[
                integration.status === 'connected' ? (
                  <Button size="small" icon={<SyncOutlined />}>Sync Now</Button>
                ) : (
                  <Button size="small" type="primary">Connect</Button>
                ),
                <Button size="small" icon={<SettingOutlined />}>Configure</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ 
                    background: integration.status === 'connected' ? '#52c41a' : 
                      integration.status === 'error' ? '#ff4d4f' : '#999' 
                  }} icon={<ApiOutlined />} />
                }
                title={
                  <Space>
                    <Text strong>{integration.name}</Text>
                    <Tag>{integration.type}</Tag>
                    <Badge 
                      status={integration.status === 'connected' ? 'success' : integration.status === 'error' ? 'error' : 'default'} 
                      text={integration.status} 
                    />
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{integration.description}</Text>
                    {integration.lastSync && <><br /><Text type="secondary" style={{ fontSize: 12 }}>Last sync: {integration.lastSync}</Text></>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  // Audit Logs Tab
  const renderAuditLogs = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><AuditOutlined /> Audit Logs</>}
        extra={
          <Space>
            <DatePicker.RangePicker />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Actions</Option>
              <Option value="auth">Authentication</Option>
              <Option value="data">Data Changes</Option>
              <Option value="admin">Administration</Option>
            </Select>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Space>
        }
      >
        <Table
          dataSource={auditLogs}
          rowKey="id"
          columns={[
            {
              title: 'Timestamp',
              dataIndex: 'timestamp',
              key: 'timestamp',
              render: (ts: string) => <Text code>{ts}</Text>
            },
            {
              title: 'User',
              dataIndex: 'user',
              key: 'user',
              render: (user: string) => (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {user}
                </Space>
              )
            },
            {
              title: 'Action',
              dataIndex: 'action',
              key: 'action'
            },
            {
              title: 'Module',
              dataIndex: 'module',
              key: 'module',
              render: (module: string) => <Tag>{module}</Tag>
            },
            {
              title: 'Details',
              dataIndex: 'details',
              key: 'details'
            },
            {
              title: 'IP Address',
              dataIndex: 'ipAddress',
              key: 'ipAddress',
              render: (ip: string) => <Text code>{ip}</Text>
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === 'success' ? 'green' : status === 'failed' ? 'red' : 'orange'}>
                  {status}
                </Tag>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // System Settings Tab
  const renderSystemSettings = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><SettingOutlined /> System Settings</>}>
        <Form layout="vertical">
          <Title level={5}>General</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Time Zone">
                <Select defaultValue="africa/johannesburg">
                  <Option value="africa/johannesburg">Africa/Johannesburg (SAST)</Option>
                  <Option value="utc">UTC</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date Format">
                <Select defaultValue="dd/mm/yyyy">
                  <Option value="dd/mm/yyyy">DD/MM/YYYY</Option>
                  <Option value="mm/dd/yyyy">MM/DD/YYYY</Option>
                  <Option value="yyyy-mm-dd">YYYY-MM-DD</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Currency">
                <Select defaultValue="zar">
                  <Option value="zar">ZAR - South African Rand</Option>
                  <Option value="usd">USD - US Dollar</Option>
                  <Option value="eur">EUR - Euro</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Language">
                <Select defaultValue="en">
                  <Option value="en">English</Option>
                  <Option value="af">Afrikaans</Option>
                  <Option value="zu">isiZulu</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Title level={5}>Security</Title>
          <Form.Item label="Require MFA for all users">
            <Switch /> <Text type="secondary">Enforce multi-factor authentication</Text>
          </Form.Item>
          <Form.Item label="Session Timeout">
            <Select defaultValue="30" style={{ width: 200 }}>
              <Option value="15">15 minutes</Option>
              <Option value="30">30 minutes</Option>
              <Option value="60">1 hour</Option>
              <Option value="120">2 hours</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Password Policy">
            <Checkbox defaultChecked>Minimum 8 characters</Checkbox>
            <br />
            <Checkbox defaultChecked>Require uppercase letter</Checkbox>
            <br />
            <Checkbox defaultChecked>Require number</Checkbox>
            <br />
            <Checkbox>Require special character</Checkbox>
          </Form.Item>

          <Divider />
          <Title level={5}>Email Settings</Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="SMTP Server">
                <Input defaultValue="smtp.company.co.za" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="SMTP Port">
                <Input defaultValue="587" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="From Email">
            <Input defaultValue="noreply@worldclass-erp.co.za" />
          </Form.Item>

          <Divider />
          <Button type="primary">Save Settings</Button>
        </Form>
      </Card>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Administration"
        subtitle="System configuration, user management, and settings"
        icon={<SettingOutlined />}
        gradient="purple"
        actions={
          <Space>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)}>
              Add User
            </Button>
          </Space>
        }
      />

      <StatusBanner
        gradient="purple"
        icon={<SettingOutlined />}
        title="Administration Overview"
        subtitle="Users, billing, security"
        stats={[
          { title: 'Total Users', value: users.length },
          { title: 'Active Users', value: activeUsers },
          { title: 'MFA Enabled', value: `${Math.round((mfaEnabledUsers / users.length) * 100)}%` },
          { title: 'Integrations', value: `${connectedIntegrations}/${integrations.length}` },
          { title: 'System Status', value: 'Healthy' }
        ]}
      />

      <HubTabs
        theme="purple"
        activeKey={activeTab}
        tabs={[
          { key: 'overview', label: 'Overview', icon: <HomeOutlined />, children: renderOverview() },
          { key: 'company', label: 'Company Setup', icon: <ShopOutlined />, children: renderCompanySetup() },
          { key: 'users', label: 'User Management', icon: <TeamOutlined />, children: renderUserManagement() },
          { key: 'billing', label: 'Billing', icon: <CreditCardOutlined />, children: renderBilling() },
          { key: 'design', label: 'Design System', icon: <BgColorsOutlined />, children: renderDesignSystem() },
          { key: 'integrations', label: 'Integrations', icon: <ApiOutlined />, children: renderIntegrations() },
          { key: 'audit', label: 'Audit Logs', icon: <AuditOutlined />, children: renderAuditLogs() },
          { key: 'settings', label: 'System Settings', icon: <SettingOutlined />, children: renderSystemSettings() }
        ]}
        onChange={setActiveTab}
      />

      {/* Add User Modal */}
      <Modal
        title={<><UserOutlined /> Add New User</>}
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUserModalVisible(false)}>Cancel</Button>,
          <Button key="invite" type="primary" icon={<SendOutlined />} onClick={() => { message.success('Invitation sent!'); setUserModalVisible(false); }}>
            Send Invitation
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" name="firstName" rules={[{ required: true }]}>
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" name="lastName" rules={[{ required: true }]}>
                <Input placeholder="Smith" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Email Address" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="john.smith@company.co.za" />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              <Option value="admin">Administrator</Option>
              <Option value="manager">Manager</Option>
              <Option value="user">Standard User</Option>
              <Option value="readonly">Read Only</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Department" name="department">
            <Select placeholder="Select department">
              <Option value="finance">Finance</Option>
              <Option value="sales">Sales</Option>
              <Option value="hr">Human Resources</Option>
              <Option value="operations">Operations</Option>
              <Option value="it">IT</Option>
            </Select>
          </Form.Item>
          <Form.Item name="requireMfa" valuePropName="checked">
            <Checkbox>Require MFA setup on first login</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default AdminHub;
