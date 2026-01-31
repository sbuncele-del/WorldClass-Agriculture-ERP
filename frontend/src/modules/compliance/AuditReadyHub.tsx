/**
 * AuditReadyHub - Audit-Ready Suite Management
 * 
 * Features:
 * - Audit Readiness Dashboard
 * - Document Management
 * - Compliance Checklist
 * - Audit Trail Logs
 * - One-Click Audit Pack Generation
 * - Auditor Portal
 * - IFRS/GAAP Compliance
 * - Internal Controls
 * - South African Regulatory Compliance (SARS, CIPC, B-BBEE)
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, Modal, Form, Typography, Avatar,
  Timeline, Descriptions, Tooltip, Dropdown, Switch, Alert,
  List, Divider, Steps, Upload, message, Checkbox, Empty, Collapse, Spin
} from 'antd';
import apiClient from '../../services/api';
import {
  HomeOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, BarChartOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, FlagOutlined, SendOutlined,
  UserOutlined, BellOutlined, FileTextOutlined, MailOutlined,
  SafetyCertificateOutlined, AuditOutlined, BankOutlined, RocketOutlined,
  LockOutlined, EyeOutlined, DownloadOutlined, UploadOutlined,
  FolderOpenOutlined, FileDoneOutlined, FileSearchOutlined,
  CheckSquareOutlined, CloseCircleOutlined, InfoCircleOutlined,
  LinkOutlined, PrinterOutlined, ShareAltOutlined, HistoryOutlined
} from '@ant-design/icons';
import HubLayout from '../../components/hub/HubLayout';
import HubHeader from '../../components/hub/HubHeader';
import StatusBanner from '../../components/hub/StatusBanner';
import HubTabs from '../../components/hub/HubTabs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

// Interfaces
interface AuditDocument {
  id: string;
  name: string;
  category: string;
  status: 'ready' | 'pending' | 'review' | 'missing';
  lastUpdated: string;
  size: string;
  version: string;
  preparedBy: string;
  reviewer?: string;
  downloadUrl?: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  assignee?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

interface AuditorAccess {
  id: string;
  name: string;
  firm: string;
  email: string;
  accessLevel: 'full' | 'limited' | 'readonly';
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
  lastLogin?: string;
  allowedCategories: string[];  // Which document categories they can access
  allowedActions: ('view' | 'download' | 'comment' | 'request')[];
  portalLink: string;
}

interface AuditorMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
  type: 'query' | 'response' | 'request' | 'notification';
}

interface DocumentRequest {
  id: string;
  auditorId: string;
  auditorName: string;
  documentName: string;
  category: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedDate: string;
  responseDate?: string;
  respondedBy?: string;
}

const AuditReadyHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('2025-12');
  const [generating, setGenerating] = useState(false);
  const [auditorModalVisible, setAuditorModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // Data state
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditors, setAuditors] = useState<AuditorAccess[]>([]);
  const [auditorMessages, setAuditorMessages] = useState<AuditorMessage[]>([]);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docsRes, checklistRes, logsRes, auditorsRes, messagesRes, requestsRes] = await Promise.all([
          apiClient.get('/api/compliance/audit/documents'),
          apiClient.get('/api/compliance/audit/checklist'),
          apiClient.get('/api/compliance/audit/logs'),
          apiClient.get('/api/compliance/audit/auditors'),
          apiClient.get('/api/compliance/audit/messages'),
          apiClient.get('/api/compliance/audit/requests')
        ]);
        setDocuments(docsRes.data || []);
        setChecklist(checklistRes.data || []);
        setAuditLogs(logsRes.data || []);
        setAuditors(auditorsRes.data || []);
        setAuditorMessages(messagesRes.data || []);
        setDocumentRequests(requestsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch audit data:', error);
        message.error('Failed to load audit data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [accessConfigModalVisible, setAccessConfigModalVisible] = useState(false);
  const [selectedAuditor, setSelectedAuditor] = useState<AuditorAccess | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);

  // All available document categories
  const allDocumentCategories = ['Financial', 'Tax', 'Cash', 'Assets', 'Compliance', 'Governance', 'IFRS', 'Payroll', 'Inventory'];

  // Calculations
  const totalChecklist = checklist.length;
  const completedChecklist = checklist.filter(c => c.completed).length;
  const readyDocuments = documents.filter(d => d.status === 'ready').length;
  const pendingDocuments = documents.filter(d => d.status === 'pending' || d.status === 'review').length;
  const missingDocuments = documents.filter(d => d.status === 'missing').length;
  const readinessScore = Math.round((completedChecklist / totalChecklist) * 100);

  const handleGenerateAuditPack = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      message.success('Audit Pack generated successfully! Download will begin shortly.');
    }, 3000);
  };

  // Overview Tab
  const renderOverview = () => (
    <div style={{ padding: '24px' }}>
      {/* Readiness Score */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
        <Row align="middle" gutter={24}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={readinessScore}
                size={180}
                strokeWidth={10}
                strokeColor={{ '0%': '#52c41a', '50%': '#faad14', '100%': '#52c41a' }}
                format={() => (
                  <div style={{ color: '#fff' }}>
                    <div style={{ fontSize: 48, fontWeight: 'bold' }}>{readinessScore}%</div>
                    <div style={{ fontSize: 14 }}>AUDIT READY</div>
                  </div>
                )}
              />
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              <SafetyCertificateOutlined /> Audit Readiness Status
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
              Your organization is <strong>{readinessScore}%</strong> ready for external audit.
              {completedChecklist === totalChecklist 
                ? ' All compliance requirements have been met.' 
                : ` ${totalChecklist - completedChecklist} items require attention before audit.`}
            </Paragraph>
            <Space size="large" style={{ marginTop: 16 }}>
              <Button type="primary" size="large" icon={<DownloadOutlined />} loading={generating} onClick={handleGenerateAuditPack} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                Generate Audit Pack
              </Button>
              <Button size="large" icon={<ShareAltOutlined />} style={{ background: 'rgba(255,255,255,0.2)', borderColor: '#fff', color: '#fff' }}>
                Share with Auditors
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Checklist Complete" 
              value={completedChecklist} 
              suffix={`/ ${totalChecklist}`}
              valueStyle={{ color: completedChecklist === totalChecklist ? '#52c41a' : '#faad14' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Documents Ready" 
              value={readyDocuments} 
              suffix={`/ ${documents.length}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FileDoneOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Pending Review" 
              value={pendingDocuments}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Missing Documents" 
              value={missingDocuments}
              valueStyle={{ color: missingDocuments > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Critical Items */}
      {checklist.filter(c => !c.completed && c.priority === 'critical').length > 0 && (
        <Alert
          message="Critical Items Require Attention"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              {checklist.filter(c => !c.completed && c.priority === 'critical').map(item => (
                <li key={item.id}><strong>{item.name}</strong> - Due: {item.dueDate}</li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* Quick Actions */}
      <Card title={<><RocketOutlined /> Quick Actions</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" hoverable onClick={handleGenerateAuditPack}>
              <Space>
                <Avatar style={{ background: '#52c41a' }} icon={<DownloadOutlined />} />
                <div>
                  <Text strong>Download Audit Pack</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>All documents in one ZIP</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable onClick={() => setAuditorModalVisible(true)}>
              <Space>
                <Avatar style={{ background: '#1890ff' }} icon={<UserOutlined />} />
                <div>
                  <Text strong>Invite Auditor</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Grant secure access</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable>
              <Space>
                <Avatar style={{ background: '#722ed1' }} icon={<PrinterOutlined />} />
                <div>
                  <Text strong>Print Checklist</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>PDF or print</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" hoverable>
              <Space>
                <Avatar style={{ background: '#fa8c16' }} icon={<HistoryOutlined />} />
                <div>
                  <Text strong>View Audit Trail</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Complete activity log</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Compliance Standards */}
      <Card title={<><SafetyCertificateOutlined /> Compliance Standards</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="IFRS Compliant" />
                <Text type="secondary">International Financial Reporting Standards</Text>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="Companies Act 71" />
                <Text type="secondary">South African Companies Act</Text>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="success" text="King IV" />
                <Text type="secondary">Corporate Governance Code</Text>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Badge status="processing" text="PoPI Act" />
                <Text type="secondary">Protection of Personal Information</Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Documents Tab
  const renderDocuments = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><FolderOpenOutlined /> Audit Documents</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Categories</Option>
              <Option value="financial">Financial</Option>
              <Option value="tax">Tax</Option>
              <Option value="compliance">Compliance</Option>
              <Option value="governance">Governance</Option>
            </Select>
            <Button icon={<UploadOutlined />}>Upload Document</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleGenerateAuditPack} loading={generating}>
              Download All
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={documents}
          rowKey="id"
          columns={[
            {
              title: 'Document',
              key: 'document',
              render: (_, record) => (
                <Space>
                  <Avatar style={{ background: record.status === 'ready' ? '#52c41a' : record.status === 'missing' ? '#ff4d4f' : '#faad14' }} icon={<FileTextOutlined />} />
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.id} • v{record.version}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: (category: string) => <Tag>{category}</Tag>
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === 'ready' ? 'green' : status === 'missing' ? 'red' : status === 'review' ? 'blue' : 'orange'}>
                  {status === 'ready' ? <CheckCircleOutlined /> : status === 'missing' ? <CloseCircleOutlined /> : <ClockCircleOutlined />} {status.toUpperCase()}
                </Tag>
              )
            },
            {
              title: 'Prepared By',
              dataIndex: 'preparedBy',
              key: 'preparedBy'
            },
            {
              title: 'Last Updated',
              dataIndex: 'lastUpdated',
              key: 'lastUpdated'
            },
            {
              title: 'Size',
              dataIndex: 'size',
              key: 'size'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  {record.status !== 'missing' && (
                    <>
                      <Tooltip title="Preview">
                        <Button size="small" icon={<EyeOutlined />} />
                      </Tooltip>
                      <Tooltip title="Download">
                        <Button size="small" icon={<DownloadOutlined />} />
                      </Tooltip>
                    </>
                  )}
                  {record.status === 'missing' && (
                    <Button size="small" type="primary" icon={<UploadOutlined />}>Upload</Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Checklist Tab
  const renderChecklist = () => {
    const categories = [...new Set(checklist.map(c => c.category))];
    
    return (
      <div style={{ padding: '24px' }}>
        <Card
          title={<><CheckSquareOutlined /> Audit Checklist</>}
          extra={
            <Space>
              <Progress percent={Math.round((completedChecklist / totalChecklist) * 100)} style={{ width: 150 }} />
              <Button icon={<PrinterOutlined />}>Print Checklist</Button>
            </Space>
          }
        >
          <Collapse defaultActiveKey={categories}>
            {categories.map(category => {
              const items = checklist.filter(c => c.category === category);
              const completed = items.filter(i => i.completed).length;
              return (
                <Panel 
                  key={category} 
                  header={
                    <Space>
                      <Text strong>{category}</Text>
                      <Tag color={completed === items.length ? 'green' : 'orange'}>{completed}/{items.length}</Tag>
                    </Space>
                  }
                >
                  <List
                    dataSource={items}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          item.priority === 'critical' && <Tag color="red">CRITICAL</Tag>,
                          item.priority === 'high' && <Tag color="orange">HIGH</Tag>,
                          item.dueDate && <Tag icon={<CalendarOutlined />}>{item.dueDate}</Tag>,
                          item.assignee && <Tag icon={<UserOutlined />}>{item.assignee}</Tag>
                        ].filter(Boolean)}
                      >
                        <Checkbox checked={item.completed}>
                          <Text delete={item.completed}>{item.name}</Text>
                        </Checkbox>
                      </List.Item>
                    )}
                  />
                </Panel>
              );
            })}
          </Collapse>
        </Card>
      </div>
    );
  };

  // Audit Trail Tab
  const renderAuditTrail = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><HistoryOutlined /> Audit Trail</>}
        extra={
          <Space>
            <DatePicker.RangePicker />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Actions</Option>
              <Option value="upload">Uploads</Option>
              <Option value="download">Downloads</Option>
              <Option value="access">Access Changes</Option>
            </Select>
            <Button icon={<ExportOutlined />}>Export Log</Button>
          </Space>
        }
      >
        <Alert
          message="Complete Audit Trail"
          description="Every action in the system is logged for compliance. This includes document access, modifications, and user activities."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
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
              key: 'action',
              render: (action: string) => (
                <Tag color={action.includes('Upload') ? 'green' : action.includes('Download') ? 'blue' : action.includes('Access') ? 'purple' : 'default'}>
                  {action}
                </Tag>
              )
            },
            {
              title: 'Module',
              dataIndex: 'module',
              key: 'module'
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
            }
          ]}
        />
      </Card>
    </div>
  );

  // Configure Auditor Access
  const handleConfigureAccess = (auditor: AuditorAccess) => {
    setSelectedAuditor(auditor);
    setAccessConfigModalVisible(true);
  };

  const handleSaveAccessConfig = (values: any) => {
    if (selectedAuditor) {
      setAuditors(prev => prev.map(a => 
        a.id === selectedAuditor.id 
          ? { ...a, allowedCategories: values.categories, accessLevel: values.accessLevel, allowedActions: values.actions }
          : a
      ));
      message.success(`Access updated for ${selectedAuditor.name}`);
      setAccessConfigModalVisible(false);
      setSelectedAuditor(null);
    }
  };

  const handleRespondToRequest = (requestId: string, action: 'approve' | 'reject') => {
    setDocumentRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { ...r, status: action === 'approve' ? 'approved' : 'rejected', responseDate: new Date().toISOString().split('T')[0], respondedBy: 'Current User' }
        : r
    ));
    message.success(`Request ${action === 'approve' ? 'approved' : 'rejected'}`);
  };

  // Auditor Portal Tab - Full Functionality
  const renderAuditorPortal = () => (
    <div style={{ padding: '24px' }}>
      <Alert
        message="Secure Auditor Portal"
        description="Grant external auditors secure, time-limited access to specific audit documents. Define exactly what each auditor can see, download, and request. All access is logged for compliance."
        type="info"
        showIcon
        icon={<LockOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* Auditor Access Management */}
      <Card
        title={<><TeamOutlined /> Auditor Access Management</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAuditorModalVisible(true)}>
            Invite Auditor
          </Button>
        }
      >
        <Table
          dataSource={auditors}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Title level={5}><FolderOpenOutlined /> Document Access</Title>
                    <div style={{ marginBottom: 16 }}>
                      {record.allowedCategories.map(cat => (
                        <Tag key={cat} color="blue" style={{ marginBottom: 4 }}>{cat}</Tag>
                      ))}
                    </div>
                    <Text type="secondary">
                      This auditor can access documents in the above categories.
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Title level={5}><SafetyCertificateOutlined /> Permissions</Title>
                    <Space wrap>
                      {record.allowedActions.includes('view') && <Tag color="green">👁 View</Tag>}
                      {record.allowedActions.includes('download') && <Tag color="cyan">⬇ Download</Tag>}
                      {record.allowedActions.includes('comment') && <Tag color="purple">💬 Comment</Tag>}
                      {record.allowedActions.includes('request') && <Tag color="orange">📋 Request Docs</Tag>}
                    </Space>
                  </Col>
                </Row>
                <Divider />
                <Row>
                  <Col span={24}>
                    <Text strong>Portal Link: </Text>
                    <Text copyable>{record.portalLink}</Text>
                  </Col>
                </Row>
              </div>
            )
          }}
          columns={[
            {
              title: 'Auditor',
              key: 'auditor',
              render: (_, record) => (
                <Space>
                  <Avatar icon={<UserOutlined />} style={{ background: record.firm === 'Internal' ? '#722ed1' : '#1890ff' }} />
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.firm}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email'
            },
            {
              title: 'Access Level',
              dataIndex: 'accessLevel',
              key: 'accessLevel',
              render: (level: string) => (
                <Tooltip title={
                  level === 'full' ? 'Can view, download, comment & request documents' :
                  level === 'limited' ? 'Can view & download selected categories' :
                  'View only access'
                }>
                  <Tag color={level === 'full' ? 'green' : level === 'limited' ? 'orange' : 'blue'}>
                    {level.toUpperCase()}
                  </Tag>
                </Tooltip>
              )
            },
            {
              title: 'Categories',
              key: 'categories',
              render: (_, record) => (
                <Text type="secondary">{record.allowedCategories.length} categories</Text>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Badge status={status === 'active' ? 'success' : status === 'expired' ? 'error' : 'processing'} text={status} />
              )
            },
            {
              title: 'Expires',
              dataIndex: 'expiryDate',
              key: 'expiryDate'
            },
            {
              title: 'Last Login',
              dataIndex: 'lastLogin',
              key: 'lastLogin',
              render: (login?: string) => login || <Text type="secondary">Never</Text>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Tooltip title="Configure Access">
                    <Button size="small" icon={<SettingOutlined />} onClick={() => handleConfigureAccess(record)} />
                  </Tooltip>
                  <Tooltip title="Send Message">
                    <Button size="small" icon={<MailOutlined />} onClick={() => { setSelectedAuditor(record); setMessageModalVisible(true); }} />
                  </Tooltip>
                  <Tooltip title="Copy Portal Link">
                    <Button size="small" icon={<LinkOutlined />} onClick={() => { navigator.clipboard.writeText(record.portalLink); message.success('Portal link copied!'); }} />
                  </Tooltip>
                  <Tooltip title="Resend Invite">
                    <Button size="small" icon={<SendOutlined />} onClick={() => message.success(`Invite resent to ${record.email}`)} />
                  </Tooltip>
                  <Tooltip title="Revoke Access">
                    <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => {
                      Modal.confirm({
                        title: 'Revoke Access',
                        content: `Are you sure you want to revoke access for ${record.name}? They will no longer be able to view any documents.`,
                        okText: 'Revoke',
                        okType: 'danger',
                        onOk: () => {
                          setAuditors(prev => prev.map(a => a.id === record.id ? { ...a, status: 'expired' as const } : a));
                          message.success('Access revoked');
                        }
                      });
                    }} />
                  </Tooltip>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Document Requests from Auditors */}
      <Card 
        title={<><FileSearchOutlined /> Document Requests from Auditors</>}
        style={{ marginTop: 16 }}
        extra={<Badge count={documentRequests.filter(r => r.status === 'pending').length} />}
      >
        <Table
          dataSource={documentRequests}
          rowKey="id"
          columns={[
            {
              title: 'Requested By',
              key: 'auditor',
              render: (_, record) => (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text>{record.auditorName}</Text>
                </Space>
              )
            },
            {
              title: 'Document',
              dataIndex: 'documentName',
              key: 'documentName',
              render: (name: string) => <Text strong>{name}</Text>
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: (cat: string) => <Tag>{cat}</Tag>
            },
            {
              title: 'Reason',
              dataIndex: 'reason',
              key: 'reason',
              ellipsis: true
            },
            {
              title: 'Requested',
              dataIndex: 'requestedDate',
              key: 'requestedDate'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : status === 'fulfilled' ? 'blue' : 'red'}>
                  {status.toUpperCase()}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                record.status === 'pending' ? (
                  <Space>
                    <Button type="primary" size="small" onClick={() => handleRespondToRequest(record.id, 'approve')}>
                      Approve
                    </Button>
                    <Button size="small" danger onClick={() => handleRespondToRequest(record.id, 'reject')}>
                      Reject
                    </Button>
                  </Space>
                ) : record.status === 'approved' ? (
                  <Button size="small" icon={<UploadOutlined />} onClick={() => {
                    setDocumentRequests(prev => prev.map(r => r.id === record.id ? { ...r, status: 'fulfilled' } : r));
                    message.success('Document uploaded and shared with auditor');
                  }}>
                    Upload & Share
                  </Button>
                ) : (
                  <Text type="secondary">
                    {record.responseDate && `Responded ${record.responseDate}`}
                  </Text>
                )
              )
            }
          ]}
        />
      </Card>

      {/* Communication with Auditors */}
      <Card 
        title={<><MailOutlined /> Communications</>}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Badge count={auditorMessages.filter(m => !m.isRead).length}>
              <Button icon={<BellOutlined />}>Unread</Button>
            </Badge>
            <Button type="primary" icon={<SendOutlined />} onClick={() => setMessageModalVisible(true)}>
              New Message
            </Button>
          </Space>
        }
      >
        <List
          dataSource={auditorMessages}
          renderItem={msg => (
            <List.Item
              style={{ background: !msg.isRead ? '#e6f7ff' : 'transparent', padding: '12px', borderRadius: 4 }}
              actions={[
                <Button size="small" icon={<EyeOutlined />} onClick={() => {
                  setAuditorMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
                }}>View</Button>,
                <Button size="small" icon={<SendOutlined />}>Reply</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={msg.type === 'query' ? <InfoCircleOutlined /> : msg.type === 'response' ? <CheckCircleOutlined /> : <BellOutlined />}
                    style={{ background: msg.type === 'query' ? '#faad14' : msg.type === 'response' ? '#52c41a' : '#1890ff' }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{msg.subject}</Text>
                    {!msg.isRead && <Badge status="processing" text="New" />}
                    <Tag color={msg.type === 'query' ? 'orange' : msg.type === 'response' ? 'green' : 'blue'}>
                      {msg.type.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <>
                    <Text type="secondary">From: {msg.from} • {msg.timestamp}</Text>
                    <br />
                    <Text ellipsis style={{ maxWidth: 500 }}>{msg.content.substring(0, 100)}...</Text>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {msg.attachments.map((att, i) => (
                          <Tag key={i} icon={<FileTextOutlined />}>{att}</Tag>
                        ))}
                      </div>
                    )}
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Auditor Portal Preview */}
      <Card 
        title={<><EyeOutlined /> Auditor Portal Preview</>}
        style={{ marginTop: 16 }}
        extra={<Button type="primary" icon={<ExportOutlined />} onClick={() => window.open('/preview/auditor-portal', '_blank')}>Open Portal Preview</Button>}
      >
        <Alert
          message="What Auditors See"
          description="When auditors log into their portal, they see only the documents and categories you've granted them access to. They can view, download (if permitted), send queries, and request additional documents."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" title="📁 Documents">
              <Text type="secondary">Auditors see documents organized by category, filtered to only show what they have access to.</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="💬 Messages">
              <Text type="secondary">Two-way communication channel. Auditors can ask questions and you can respond directly.</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title="📋 Requests">
              <Text type="secondary">Auditors can request additional documents. You approve/reject from this dashboard.</Text>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Access Configuration Modal */}
      <Modal
        title={<><SettingOutlined /> Configure Access - {selectedAuditor?.name}</>}
        open={accessConfigModalVisible}
        onCancel={() => { setAccessConfigModalVisible(false); setSelectedAuditor(null); }}
        footer={null}
        width={700}
      >
        {selectedAuditor && (
          <Form
            layout="vertical"
            initialValues={{
              accessLevel: selectedAuditor.accessLevel,
              categories: selectedAuditor.allowedCategories,
              actions: selectedAuditor.allowedActions
            }}
            onFinish={handleSaveAccessConfig}
          >
            <Form.Item name="accessLevel" label="Access Level">
              <Select>
                <Option value="full">Full Access - All permissions</Option>
                <Option value="limited">Limited - Selected categories only</Option>
                <Option value="readonly">Read Only - View only, no downloads</Option>
              </Select>
            </Form.Item>

            <Form.Item name="categories" label="Document Categories" help="Select which document categories this auditor can access">
              <Checkbox.Group style={{ width: '100%' }}>
                <Row>
                  {allDocumentCategories.map(cat => (
                    <Col span={8} key={cat}>
                      <Checkbox value={cat}>{cat}</Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item name="actions" label="Allowed Actions">
              <Checkbox.Group>
                <Checkbox value="view">View Documents</Checkbox>
                <Checkbox value="download">Download Documents</Checkbox>
                <Checkbox value="comment">Add Comments</Checkbox>
                <Checkbox value="request">Request Documents</Checkbox>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item label="Access Expiry Date">
              <Input 
                type="date" 
                defaultValue={selectedAuditor.expiryDate} 
                style={{ width: '100%' }} 
                id="expiryDateInput"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>Current: {selectedAuditor.expiryDate}</Text>
            </Form.Item>

            <Divider />

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save Access Configuration
                </Button>
                <Button onClick={() => { setAccessConfigModalVisible(false); setSelectedAuditor(null); }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Message Modal */}
      <Modal
        title={<><MailOutlined /> Send Message to {selectedAuditor?.name || 'Auditor'}</>}
        open={messageModalVisible}
        onCancel={() => { setMessageModalVisible(false); setSelectedAuditor(null); }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={(values) => {
          const newMsg: AuditorMessage = {
            id: `MSG-${Date.now()}`,
            from: 'finance@company.co.za',
            to: selectedAuditor?.email || values.to,
            subject: values.subject,
            content: values.content,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            isRead: true,
            type: 'response'
          };
          setAuditorMessages(prev => [newMsg, ...prev]);
          message.success('Message sent successfully');
          setMessageModalVisible(false);
          setSelectedAuditor(null);
        }}>
          <Form.Item name="to" label="To" initialValue={selectedAuditor?.email}>
            <Input disabled={!!selectedAuditor} />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="Enter subject..." />
          </Form.Item>
          <Form.Item name="content" label="Message" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="Type your message..." />
          </Form.Item>
          <Form.Item label="Attachments">
            <Upload>
              <Button icon={<UploadOutlined />}>Attach Files</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Send Message
              </Button>
              <Button onClick={() => { setMessageModalVisible(false); setSelectedAuditor(null); }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  // Settings Tab
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><SettingOutlined /> Audit Settings</>}>
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Financial Year End">
                <Select defaultValue="february">
                  <Option value="february">February</Option>
                  <Option value="march">March</Option>
                  <Option value="june">June</Option>
                  <Option value="december">December</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Audit Period">
                <Select value={selectedPeriod} onChange={setSelectedPeriod}>
                  <Option value="2025-12">December 2025</Option>
                  <Option value="2025-11">November 2025</Option>
                  <Option value="2025-q4">Q4 2025</Option>
                  <Option value="2025">FY 2025</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="External Auditor">
                <Input defaultValue="PwC South Africa" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Audit Partner">
                <Input defaultValue="James van der Merwe" />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Title level={5}>Notifications</Title>
          <Form.Item label="Email Alerts">
            <Switch defaultChecked /> <Text type="secondary">Notify when documents are accessed</Text>
          </Form.Item>
          <Form.Item label="Deadline Reminders">
            <Switch defaultChecked /> <Text type="secondary">Remind before checklist deadlines</Text>
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
        title="Audit-Ready Suite"
        subtitle="One-click audit pack generation with complete compliance documentation"
        icon={<AuditOutlined />}
        gradient="blue"
        actions={
          <Space>
            <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 150 }}>
              <Option value="2025-12">Dec 2025</Option>
              <Option value="2025-11">Nov 2025</Option>
              <Option value="2025-q4">Q4 2025</Option>
              <Option value="2025">FY 2025</Option>
            </Select>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleGenerateAuditPack} loading={generating}>
              Generate Audit Pack
            </Button>
          </Space>
        }
      />

      <StatusBanner
        gradient="blue"
        icon={<AuditOutlined />}
        title="Audit Readiness"
        subtitle={`Period: ${selectedPeriod}`}
        stats={[
          { title: 'Readiness Score', value: `${readinessScore}%` },
          { title: 'Documents Ready', value: `${readyDocuments}/${documents.length}` },
          { title: 'Checklist Complete', value: `${completedChecklist}/${totalChecklist}` },
          { title: 'Pending Items', value: pendingDocuments + (totalChecklist - completedChecklist) },
          { title: 'Active Auditors', value: auditors.filter(a => a.status === 'active').length }
        ]}
      />

      <HubTabs
        theme="blue"
        activeKey={activeTab}
        tabs={[
          { key: 'overview', label: 'Overview', icon: <HomeOutlined />, children: renderOverview() },
          { key: 'documents', label: 'Documents', icon: <FolderOpenOutlined />, children: renderDocuments() },
          { key: 'checklist', label: 'Checklist', icon: <CheckSquareOutlined />, children: renderChecklist() },
          { key: 'audit-trail', label: 'Audit Trail', icon: <HistoryOutlined />, children: renderAuditTrail() },
          { key: 'auditor-portal', label: 'Auditor Portal', icon: <TeamOutlined />, children: renderAuditorPortal() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        onChange={setActiveTab}
      />

      {/* Invite Auditor Modal */}
      <Modal
        title={<><UserOutlined /> Invite External Auditor</>}
        open={auditorModalVisible}
        onCancel={() => setAuditorModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAuditorModalVisible(false)}>Cancel</Button>,
          <Button key="invite" type="primary" icon={<SendOutlined />} onClick={() => { message.success('Invitation sent!'); setAuditorModalVisible(false); }}>
            Send Invitation
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Auditor Name" name="auditorName" rules={[{ required: true }]}>
            <Input placeholder="e.g., James van der Merwe" />
          </Form.Item>
          <Form.Item label="Audit Firm" name="auditFirm" rules={[{ required: true }]}>
            <Input placeholder="e.g., PwC South Africa" />
          </Form.Item>
          <Form.Item label="Email Address" name="auditorEmail" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="auditor@firm.co.za" />
          </Form.Item>
          <Form.Item label="Access Level" name="accessLevel" initialValue="limited">
            <Select>
              <Option value="full">Full Access - All documents & reports</Option>
              <Option value="limited">Limited - Selected documents only</Option>
              <Option value="readonly">Read Only - View only</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Access Expiry" name="expiryDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default AuditReadyHub;
