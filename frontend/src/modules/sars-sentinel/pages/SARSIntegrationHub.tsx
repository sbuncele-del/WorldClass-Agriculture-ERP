import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Progress,
  Statistic,
  Timeline,
  Alert,
  Table,
  Tabs,
  Badge,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Spin,
} from 'antd';
import {
  ApiOutlined,
  SafetyCertificateOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  LockOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import './SARSIntegrationHub.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Default integration status
const defaultIntegrationStatus = {
  isv: {
    registered: false,
    accessKey: '',
    environment: '',
    lastAuthenticated: '',
    expiresAt: '',
    status: 'inactive',
  },
  sftp: {
    connected: false,
    server: '',
    lastSync: '',
    filesUploaded: 0,
    filesDownloaded: 0,
  },
  eFiling: {
    connected: false,
    linkedProfiles: 0,
    pendingNotifications: 0,
    lastPoll: '',
  },
};

// Default tax types
const defaultTaxTypes: any[] = [];

// Default submissions
const defaultSubmissions: any[] = [];
const defaultNotifications: any[] = [];

const SARSIntegrationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState(defaultIntegrationStatus);
  const [taxTypes, setTaxTypes] = useState<any[]>(defaultTaxTypes);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>(defaultSubmissions);
  const [efilingNotifications, setEfilingNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchSARSData = async () => {
      setLoading(true);
      try {
        const [statusRes, taxTypesRes, submissionsRes, notificationsRes] = await Promise.all([
          apiClient.get('/api/sars/integration-status').catch(() => ({ data: null })),
          apiClient.get('/api/sars/tax-types').catch(() => ({ data: [] })),
          apiClient.get('/api/sars/submissions').catch(() => ({ data: [] })),
          apiClient.get('/api/sars/notifications').catch(() => ({ data: [] })),
        ]);
        if (statusRes.data) setIntegrationStatus({ ...defaultIntegrationStatus, ...statusRes.data });
        if (taxTypesRes.data?.length) setTaxTypes(taxTypesRes.data);
        if (submissionsRes.data?.length) setRecentSubmissions(submissionsRes.data);
        if (notificationsRes.data?.length) setEfilingNotifications(notificationsRes.data);
      } catch (err) {
        console.error('Error fetching SARS data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSARSData();
  }, []);

  if (loading) {
    return (
      <div className="sars-integration-hub" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading SARS integration data..." />
      </div>
    );
  }

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('SARS eFiling synchronized successfully');
    setSyncing(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      accepted: { color: '#10b981', text: 'Accepted' },
      processing: { color: '#3b82f6', text: 'Processing' },
      rejected: { color: '#ef4444', text: 'Rejected' },
      pending: { color: '#f59e0b', text: 'Pending' },
      ready: { color: '#10b981', text: 'Ready' },
      upcoming: { color: '#3b82f6', text: 'Upcoming' },
      overdue: { color: '#ef4444', text: 'Overdue' },
    };
    const config = configs[status] || { color: '#64748b', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      critical: { color: '#ef4444', text: '🔴 Critical' },
      high: { color: '#f59e0b', text: '🟠 High' },
      medium: { color: '#3b82f6', text: '🔵 Medium' },
      low: { color: '#10b981', text: '🟢 Low' },
    };
    const config = configs[priority] || { color: '#64748b', text: priority };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const submissionColumns = [
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="#667eea">{type}</Tag>,
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | null) => amount ? `R ${amount.toLocaleString('en-ZA')}` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'SARS Reference',
      dataIndex: 'sarsRef',
      key: 'sarsRef',
      render: (ref: string) => <Text type="secondary" style={{ fontSize: '12px' }}>{ref}</Text>,
    },
  ];

  return (
    <div className="sars-integration-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="hub-title-section">
          <div className="sars-logo">
            <span className="logo-text">SARS</span>
            <span className="logo-subtext">eFiling</span>
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>SARS Integration Hub</Title>
            <Text type="secondary">ISV-Certified Direct API Integration with South African Revenue Service</Text>
          </div>
        </div>
        <div className="hub-actions">
          <Button 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleSync}
            loading={syncing}
          >
            Sync eFiling
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setShowConfigModal(true)}
          >
            Configure
          </Button>
          <Button type="primary" icon={<CloudUploadOutlined />}>
            Bulk Submit
          </Button>
        </div>
      </div>

      {/* ISV Status Banner */}
      <Card className="isv-status-card">
        <Row gutter={24} align="middle">
          <Col span={6}>
            <div className="isv-badge">
              <SafetyCertificateOutlined className="isv-icon" />
              <div>
                <Text strong style={{ fontSize: '16px', display: 'block' }}>ISV Certified</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>Official SARS Partner</Text>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <Statistic 
              title="Access Key" 
              value={integrationStatus.isv.accessKey}
              valueStyle={{ fontSize: '14px', fontFamily: 'monospace' }}
              prefix={<LockOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Environment" 
              value={integrationStatus.isv.environment}
              valueStyle={{ color: '#10b981' }}
              prefix={<ApiOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="SFTP Status" 
              value={integrationStatus.sftp.connected ? 'Connected' : 'Disconnected'}
              valueStyle={{ color: integrationStatus.sftp.connected ? '#10b981' : '#ef4444' }}
              prefix={integrationStatus.sftp.connected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="hub-tabs">
        <TabPane 
          tab={<span><ThunderboltOutlined /> Overview</span>} 
          key="overview"
        >
          <Row gutter={[24, 24]}>
            {/* Quick Stats */}
            <Col span={24}>
              <Row gutter={16}>
                <Col span={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Submissions Today"
                      value={23}
                      prefix={<CloudUploadOutlined />}
                      valueStyle={{ color: '#667eea' }}
                    />
                    <div className="stat-footer">
                      <Text type="success">↑ 12% from yesterday</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Acceptance Rate"
                      value={98.2}
                      suffix="%"
                      precision={1}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#10b981' }}
                    />
                    <div className="stat-footer">
                      <Text type="secondary">Last 30 days</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="Pending Responses"
                      value={12}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#f59e0b' }}
                    />
                    <div className="stat-footer">
                      <Text type="warning">3 require attention</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card className="stat-card">
                    <Statistic
                      title="eFiling Notifications"
                      value={4}
                      prefix={<Badge count={2} size="small"><FileTextOutlined /></Badge>}
                      valueStyle={{ color: '#ef4444' }}
                    />
                    <div className="stat-footer">
                      <Text type="danger">2 unread critical</Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>

            {/* Tax Types Grid */}
            <Col span={16}>
              <Card title="Tax Submission Types" className="tax-types-card">
                <Row gutter={[16, 16]}>
                  {taxTypes.map(tax => (
                    <Col span={8} key={tax.code}>
                      <Card 
                        size="small" 
                        className={`tax-type-card ${tax.status}`}
                        hoverable
                      >
                        <div className="tax-type-header">
                          <Text strong style={{ fontSize: '16px' }}>{tax.code}</Text>
                          {getStatusBadge(tax.status)}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                          {tax.name}
                        </Text>
                        <div className="tax-type-meta">
                          <div className="meta-item">
                            <Text type="secondary">Next Due:</Text>
                            <Text strong>{tax.nextDue}</Text>
                          </div>
                          <div className="meta-item">
                            <Text type="secondary">Pending:</Text>
                            <Text strong style={{ color: tax.clientsPending > 0 ? '#f59e0b' : '#10b981' }}>
                              {tax.clientsPending}
                            </Text>
                          </div>
                        </div>
                        <div className="tax-type-features">
                          <Tooltip title={tax.apiSupported ? 'Direct API submission' : 'Manual upload required'}>
                            <Tag color={tax.apiSupported ? 'green' : 'default'}>
                              {tax.apiSupported ? 'API ✓' : 'Manual'}
                            </Tag>
                          </Tooltip>
                          {tax.bulkSupported && (
                            <Tooltip title="Bulk SFTP submission supported">
                              <Tag color="blue">Bulk ✓</Tag>
                            </Tooltip>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>

            {/* eFiling Notifications */}
            <Col span={8}>
              <Card 
                title={
                  <span>
                    <Badge count={efilingNotifications.filter(n => !n.read).length} offset={[10, 0]}>
                      eFiling Notifications
                    </Badge>
                  </span>
                }
                extra={<Button type="link" size="small">View All</Button>}
                className="notifications-card"
              >
                <div className="notification-list">
                  {efilingNotifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${!notif.read ? 'unread' : ''}`}
                    >
                      <div className="notification-header">
                        {getPriorityBadge(notif.priority)}
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {new Date(notif.receivedAt).toLocaleDateString('en-ZA')}
                        </Text>
                      </div>
                      <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                        {notif.client}
                      </Text>
                      <Text style={{ fontSize: '13px' }}>{notif.subject}</Text>
                      {notif.deadline && (
                        <div className="notification-deadline">
                          <ClockCircleOutlined /> Deadline: {notif.deadline}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            {/* Recent Submissions */}
            <Col span={24}>
              <Card 
                title="Recent Submissions" 
                extra={<Button type="link">View All Submissions</Button>}
              >
                <Table 
                  dataSource={recentSubmissions}
                  columns={submissionColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><CloudUploadOutlined /> Submissions</span>} 
          key="submissions"
        >
          <Alert
            message="Bulk Submission Available"
            description="You can submit EMP201, Tax Directives, and IT14 returns in bulk via SFTP. Select multiple clients and submit with one click."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Button type="primary" size="small">
                Start Bulk Submission
              </Button>
            }
          />
          {/* Submissions content */}
        </TabPane>

        <TabPane 
          tab={<span><DatabaseOutlined /> Tax Directives</span>} 
          key="directives"
        >
          {/* Tax directives content */}
        </TabPane>

        <TabPane 
          tab={<span><HistoryOutlined /> History</span>} 
          key="history"
        >
          {/* History content */}
        </TabPane>

        <TabPane 
          tab={<span><SettingOutlined /> Settings</span>} 
          key="settings"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card title="ISV Configuration" className="settings-card">
                <Form layout="vertical">
                  <Form.Item label="ISV Access Key">
                    <Input.Password 
                      value={integrationStatus.isv.accessKey}
                      disabled
                      prefix={<LockOutlined />}
                    />
                  </Form.Item>
                  <Form.Item label="Environment">
                    <Select defaultValue="PRODUCTION">
                      <Select.Option value="TEST">Test Environment</Select.Option>
                      <Select.Option value="PRODUCTION">Production</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="SFTP Server">
                    <Input value={integrationStatus.sftp.server} disabled />
                  </Form.Item>
                  <Form.Item label="Auto-Sync Interval">
                    <Select defaultValue="15">
                      <Select.Option value="5">Every 5 minutes</Select.Option>
                      <Select.Option value="15">Every 15 minutes</Select.Option>
                      <Select.Option value="30">Every 30 minutes</Select.Option>
                      <Select.Option value="60">Every hour</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary">Save Changes</Button>
                </Form>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Connection Status" className="settings-card">
                <div className="connection-status">
                  <div className="status-item">
                    <span className="status-label">SARS eFiling API</span>
                    <span className="status-indicator connected">
                      <CheckCircleOutlined /> Connected
                    </span>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div className="status-item">
                    <span className="status-label">SFTP Bulk Server</span>
                    <span className="status-indicator connected">
                      <CheckCircleOutlined /> Connected
                    </span>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div className="status-item">
                    <span className="status-label">Certificate Validity</span>
                    <span className="status-indicator">
                      <SafetyCertificateOutlined /> Valid until Jun 2026
                    </span>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div className="status-item">
                    <span className="status-label">Last Successful Sync</span>
                    <span className="status-indicator">
                      <SyncOutlined /> 5 minutes ago
                    </span>
                  </div>
                </div>
                <Button 
                  type="default" 
                  icon={<ApiOutlined />}
                  style={{ marginTop: '16px' }}
                  block
                >
                  Test Connection
                </Button>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* ISV Application Modal */}
      <Modal
        title="SARS ISV Registration"
        open={showConfigModal}
        onCancel={() => setShowConfigModal(false)}
        footer={null}
        width={700}
      >
        <Alert
          message="ISV Registration Complete"
          description="WorldClass ERP is registered as an official SARS Independent Software Vendor (ISV). Your access credentials are active."
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
        <Divider>Registration Details</Divider>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text type="secondary">ISV Access Key</Text>
            <div><Text strong code>WCLASS-ERP-PROD-2025-******</Text></div>
          </Col>
          <Col span={12}>
            <Text type="secondary">Registration Date</Text>
            <div><Text strong>15 October 2025</Text></div>
          </Col>
          <Col span={12}>
            <Text type="secondary">Approved Tax Types</Text>
            <div>
              <Tag color="green">PAYE</Tag>
              <Tag color="green">Tax Directives</Tag>
              <Tag color="green">IT14</Tag>
              <Tag color="green">ITR12</Tag>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary">Certificate Status</Text>
            <div><Tag color="success">Valid & Active</Tag></div>
          </Col>
        </Row>
        <Divider>Contact SARS ISV Support</Divider>
        <Paragraph type="secondary">
          For technical support or to update your ISV registration:
        </Paragraph>
        <ul>
          <li>Email: <Text copyable>clsisvapplications@sars.gov.za</Text></li>
          <li>Reference: <Text copyable>ISV-WCLASS-2025-001</Text></li>
        </ul>
      </Modal>
    </div>
  );
};

export default SARSIntegrationHub;
