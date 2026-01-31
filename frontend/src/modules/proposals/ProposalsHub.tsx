/**
 * ProposalsHub - Unified Proposals & Quotations Interface
 * 
 * Features:
 * - Proposal Dashboard with Pipeline
 * - Template Library
 * - Pricing Library
 * - E-Signature Integration
 * - Client Portal
 * - Analytics & Win Rate
 * - Financial Integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, Modal, Form, Typography, Avatar,
  Timeline, Descriptions, Tooltip, Dropdown, InputNumber, Switch, Alert,
  List, Tabs, Divider, Steps, Upload, message, Checkbox, Spin
} from 'antd';
import apiClient from '../../services/api';
import {
  FileTextOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, BarChartOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, FlagOutlined, SendOutlined,
  UserOutlined, BellOutlined, ThunderboltOutlined, CopyOutlined,
  SafetyCertificateOutlined, AuditOutlined, BankOutlined, RocketOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, HomeOutlined,
  FileDoneOutlined, TrophyOutlined, PieChartOutlined, LineChartOutlined,
  MailOutlined, LinkOutlined, CheckOutlined, CloseOutlined,
  UploadOutlined, DownloadOutlined, StarOutlined, FormOutlined
} from '@ant-design/icons';
import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../../components/hub';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Step } = Steps;

// Interfaces
interface Proposal {
  id: string;
  title: string;
  client: string;
  clientContact: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  value: number;
  validUntil: string;
  createdDate: string;
  sentDate?: string;
  template: string;
  owner: string;
  probability: number;
  viewCount: number;
  lastViewed?: string;
  signed: boolean;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  usageCount: number;
  winRate: number;
  lastUsed: string;
  sections: string[];
  previewImage?: string;
  preview?: string;
  deckSlides?: string[];
}

interface PricingItem {
  id: string;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  unit: string;
  margin: number;
  taxable: boolean;
}

// Sample Data removed - now fetched from API

const ProposalsHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [proposalModalVisible, setProposalModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [form] = Form.useForm();

  // Load proposals, templates, and pricing from API on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [proposalsRes, templatesRes, pricingRes] = await Promise.all([
          apiClient.get('/api/proposals'),
          apiClient.get('/api/proposals/templates'),
          apiClient.get('/api/proposals/pricing/items'),
        ]);
        setProposals(proposalsRes.data || []);
        setTemplates(templatesRes.data || []);
        setPricing(pricingRes.data || []);
      } catch (error) {
        console.error('Failed to fetch proposals hub data:', error);
        // Fallback to localStorage for proposals
        const saved = localStorage.getItem('siyabusa_proposals');
        if (saved) {
          try {
            setProposals(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to load proposals from localStorage', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate stats from actual proposals
  const proposalStats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    viewed: proposals.filter(p => p.status === 'viewed').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    declined: proposals.filter(p => p.status === 'declined').length,
    totalValue: proposals.reduce((sum, p) => sum + (p.value || p.total || 0), 0),
    wonValue: proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.value || p.total || 0), 0),
    pipelineValue: proposals.filter(p => ['sent', 'viewed', 'draft'].includes(p.status)).reduce((sum, p) => sum + (p.value || p.total || 0), 0),
    winRate: proposals.filter(p => ['accepted', 'declined'].includes(p.status)).length > 0 
      ? Math.round((proposals.filter(p => p.status === 'accepted').length / proposals.filter(p => ['accepted', 'declined'].includes(p.status)).length) * 100) 
      : 0
  };

  // Navigate to create new proposal
  const handleNewProposal = () => {
    navigate('/app/proposals/new');
  };

  // Navigate to edit proposal
  const handleEditProposal = (id: string) => {
    navigate(`/app/proposals/edit/${id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default', sent: 'processing', viewed: 'warning',
      accepted: 'success', declined: 'error', expired: 'default'
    };
    return colors[status] || 'default';
  };

  const openTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
    setPreviewVisible(true);
  };

  // Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pipeline Value"
              value={proposalStats.pipelineValue}
              prefix="R"
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `${(Number(value) / 1000000).toFixed(2)}M`}
            />
            <Text type="secondary">{proposalStats.sent + proposalStats.viewed} active proposals</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Won This Month"
              value={proposalStats.wonValue}
              prefix="R"
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`}
            />
            <Text type="secondary">{proposalStats.accepted} accepted</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Win Rate"
              value={proposalStats.winRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: proposalStats.winRate >= 50 ? '#52c41a' : '#faad14' }}
            />
            <Progress percent={proposalStats.winRate} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg. Response Time"
              value={2.5}
              suffix="days"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">From view to decision</Text>
          </Card>
        </Col>
      </Row>

      {/* Pipeline Funnel */}
      <Card title={<><PieChartOutlined /> Proposal Pipeline</>} style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#f0f0f0' }}>
              <Statistic title="Draft" value={proposalStats.draft} />
            </Card>
          </Col>
          <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
              <Statistic title="Sent" value={proposalStats.sent} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
              <Statistic title="Viewed" value={proposalStats.viewed} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
              <Statistic title="Accepted" value={proposalStats.accepted} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>|</Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
              <Statistic title="Declined" value={proposalStats.declined} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Recent Proposals & Activity */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<><FileTextOutlined /> Recent Proposals</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleNewProposal}>New Proposal</Button>}
          >
            {proposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FileTextOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                <Title level={4} type="secondary">No proposals yet</Title>
                <Text type="secondary">Create your first proposal to get started</Text>
                <br /><br />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProposal}>
                  Create Your First Proposal
                </Button>
              </div>
            ) : (
            <Table
              dataSource={proposals.slice(0, 5)}
              rowKey="id"
              size="small"
              pagination={false}
              onRow={(record) => ({ onClick: () => handleEditProposal(record.id), style: { cursor: 'pointer' } })}
              columns={[
                {
                  title: 'Proposal',
                  key: 'proposal',
                  render: (_, record) => (
                    <div>
                      <Text strong>{record.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{record.id} • {record.client}</Text>
                    </div>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
                },
                {
                  title: 'Value',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value: number) => `R${(value / 1000).toFixed(0)}K`
                },
                {
                  title: 'Views',
                  dataIndex: 'viewCount',
                  key: 'viewCount',
                  render: (views: number) => <Tag icon={<EyeOutlined />}>{views}</Tag>
                },
                {
                  title: 'Valid Until',
                  dataIndex: 'validUntil',
                  key: 'validUntil'
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Space>
                      <Button size="small" icon={<EyeOutlined />} onClick={() => handleEditProposal(record.id)} />
                      <Button size="small" icon={<SendOutlined />} disabled={record.status !== 'draft'} />
                    </Space>
                  )
                }
              ]}
            />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<><BellOutlined /> Activity Feed</>}>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <>
                      <Text strong>Proposal Viewed</Text>
                      <br />
                      <Text type="secondary">Standard Bank viewed Cloud Migration</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>10 minutes ago</Text>
                    </>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <>
                      <Text strong>Proposal Accepted</Text>
                      <br />
                      <Text type="secondary">Discovery - Annual Audit Services</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>2 hours ago</Text>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <Text strong>Proposal Sent</Text>
                      <br />
                      <Text type="secondary">Shoprite - ERP Implementation</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Yesterday</Text>
                    </>
                  )
                },
                {
                  color: 'red',
                  children: (
                    <>
                      <Text strong>Expiring Soon</Text>
                      <br />
                      <Text type="secondary">Pick n Pay proposal expires in 3 days</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Alert</Text>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Proposals List
  const renderProposals = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title="All Proposals"
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} style={{ width: 200 }} />
            <Select defaultValue="all" style={{ width: 120 }}>
              <Option value="all">All Status</Option>
              <Option value="draft">Draft</Option>
              <Option value="sent">Sent</Option>
              <Option value="viewed">Viewed</Option>
              <Option value="accepted">Accepted</Option>
              <Option value="declined">Declined</Option>
            </Select>
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProposal}>
              New Proposal
            </Button>
          </Space>
        }
      >
        {proposals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#ccc', marginBottom: 16 }} />
            <Title level={3} type="secondary">No proposals yet</Title>
            <Text type="secondary">Create your first proposal to start winning business</Text>
            <br /><br />
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleNewProposal}>
              Create Your First Proposal
            </Button>
          </div>
        ) : (
        <Table
          dataSource={proposals}
          rowKey="id"
          onRow={(record) => ({ onClick: () => handleEditProposal(record.id), style: { cursor: 'pointer' } })}
          columns={[
            {
              title: 'Proposal',
              key: 'proposal',
              render: (_, record) => (
                <div>
                  <Text strong>{record.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.id}</Text>
                </div>
              )
            },
            {
              title: 'Client',
              key: 'client',
              render: (_, record) => (
                <div>
                  <Text>{record.client}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.clientContact}</Text>
                </div>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string, record) => (
                <Space direction="vertical" size="small">
                  <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
                  {record.signed && <Tag color="green" icon={<CheckCircleOutlined />}>Signed</Tag>}
                </Space>
              )
            },
            {
              title: 'Value',
              dataIndex: 'value',
              key: 'value',
              render: (value: number) => <Text strong>R{value.toLocaleString()}</Text>
            },
            {
              title: 'Probability',
              dataIndex: 'probability',
              key: 'probability',
              render: (prob: number) => (
                <Progress 
                  percent={prob} 
                  size="small" 
                  style={{ width: 80 }}
                  strokeColor={prob >= 70 ? '#52c41a' : prob >= 40 ? '#faad14' : '#ff4d4f'}
                />
              )
            },
            {
              title: 'Views',
              dataIndex: 'viewCount',
              key: 'viewCount',
              render: (views: number, record) => (
                <Tooltip title={record.lastViewed ? `Last: ${record.lastViewed}` : 'Not viewed'}>
                  <Tag icon={<EyeOutlined />}>{views}</Tag>
                </Tooltip>
              )
            },
            {
              title: 'Valid Until',
              dataIndex: 'validUntil',
              key: 'validUntil',
              render: (date: string) => {
                const isExpiring = new Date(date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return <Tag color={isExpiring ? 'orange' : 'default'}>{date}</Tag>;
              }
            },
            {
              title: 'Owner',
              dataIndex: 'owner',
              key: 'owner',
              render: (owner: string) => (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {owner}
                </Space>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Dropdown
                  menu={{
                    items: [
                      { key: 'view', label: 'View/Edit', icon: <EyeOutlined />, onClick: () => handleEditProposal(record.id) },
                      { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
                      { key: 'send', label: 'Send', icon: <SendOutlined />, disabled: record.status !== 'draft' },
                      { key: 'download', label: 'Download PDF', icon: <DownloadOutlined /> },
                      { type: 'divider' },
                      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true }
                    ]
                  }}
                >
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              )
            }
          ]}
        />
        )}
      </Card>
    </div>
  );

  // Templates
  const renderTemplates = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><FormOutlined /> Proposal Templates</>}
        extra={
          <Space>
            <Input placeholder="Search templates..." prefix={<SearchOutlined />} style={{ width: 200 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTemplateModalVisible(true)}>
              New Template
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {templates.map(template => (
            <Col key={template.id} xs={24} sm={12} md={8}>
              <Card
                hoverable
                cover={template.previewImage ? (
                  <img src={template.previewImage} alt={template.name} style={{ height: 140, objectFit: 'cover' }} />
                ) : undefined}
                actions={[
                  <Tooltip key="preview" title="Preview"><Button type="link" icon={<EyeOutlined />} onClick={() => openTemplatePreview(template)}>Preview</Button></Tooltip>,
                  <Tooltip key="use" title="Use Template"><Button type="link" icon={<PlusOutlined />} onClick={() => message.success(`Using ${template.name}`)}>Use</Button></Tooltip>,
                  <Tooltip key="duplicate" title="Duplicate"><Button type="link" icon={<CopyOutlined />} onClick={() => message.success(`Duplicated ${template.name}`)} /></Tooltip>
                ]}
              >
                <Card.Meta
                  title={template.name}
                  description={
                    <>
                      <Tag color="blue">{template.category}</Tag>
                      <br /><br />
                      <Text type="secondary">{template.description}</Text>
                      {template.preview && (
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginTop: 8, marginBottom: 8 }}>
                          {template.preview}
                        </Paragraph>
                      )}
                      <Divider style={{ margin: '12px 0' }} />
                      <Row gutter={8}>
                        <Col span={12}>
                          <Statistic title="Uses" value={template.usageCount} valueStyle={{ fontSize: 16 }} />
                        </Col>
                        <Col span={12}>
                          <Statistic 
                            title="Win Rate" 
                            value={template.winRate} 
                            suffix="%" 
                            valueStyle={{ fontSize: 16, color: template.winRate >= 60 ? '#52c41a' : '#faad14' }} 
                          />
                        </Col>
                      </Row>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Sections: {template.sections.join(', ')}</Text>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={previewTemplate ? previewTemplate.name : 'Template Preview'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>Close</Button>,
          previewTemplate && <Button key="use" type="primary" icon={<PlusOutlined />} onClick={() => { message.success(`Using ${previewTemplate.name}`); setPreviewVisible(false); }}>Use Template</Button>
        ]}
        width={720}
      >
        {previewTemplate && (
          <div>
            {previewTemplate.previewImage && (
              <img src={previewTemplate.previewImage} alt={previewTemplate.name} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
            )}
            <Text type="secondary">{previewTemplate.description}</Text>
            {previewTemplate.preview && <Paragraph style={{ marginTop: 8 }}>{previewTemplate.preview}</Paragraph>}
            <Divider />
            <Text strong>Sections</Text>
            <List
              size="small"
              dataSource={previewTemplate.sections}
              renderItem={(item) => <List.Item><CheckOutlined /> {item}</List.Item>}
            />
            {previewTemplate.deckSlides && previewTemplate.deckSlides.length > 0 && (
              <>
                <Divider />
                <Text strong>Pitch Deck Slides</Text>
                <List
                  size="small"
                  dataSource={previewTemplate.deckSlides}
                  renderItem={(slide, idx) => <List.Item>{idx + 1}. {slide}</List.Item>}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );

  // Pricing Library
  const renderPricing = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><DollarOutlined /> Pricing Library</>}
        extra={
          <Space>
            <Input placeholder="Search items..." prefix={<SearchOutlined />} style={{ width: 200 }} />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Categories</Option>
              <Option value="services">Professional Services</Option>
              <Option value="software">Software</Option>
              <Option value="infrastructure">Infrastructure</Option>
              <Option value="training">Training</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPricingModalVisible(true)}>
              Add Item
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={pricing}
          rowKey="id"
          columns={[
            { title: 'Item', dataIndex: 'name', key: 'name', render: (name: string) => <Text strong>{name}</Text> },
            { title: 'Category', dataIndex: 'category', key: 'category', render: (cat: string) => <Tag>{cat}</Tag> },
            { title: 'Description', dataIndex: 'description', key: 'description' },
            { 
              title: 'Unit Price', 
              dataIndex: 'unitPrice', 
              key: 'unitPrice',
              render: (price: number) => <Text strong>R{price.toLocaleString()}</Text>
            },
            { title: 'Unit', dataIndex: 'unit', key: 'unit' },
            { 
              title: 'Margin', 
              dataIndex: 'margin', 
              key: 'margin',
              render: (margin: number) => <Tag color={margin >= 40 ? 'green' : 'orange'}>{margin}%</Tag>
            },
            {
              title: 'VAT',
              dataIndex: 'taxable',
              key: 'taxable',
              render: (taxable: boolean) => taxable ? <Tag color="blue">15%</Tag> : <Tag>Exempt</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} />
                  <Button size="small" icon={<DeleteOutlined />} danger />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Analytics
  const renderAnalytics = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Win/Loss Analysis">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Total Won" value={proposalStats.accepted} suffix="deals" valueStyle={{ color: '#52c41a' }} />
                <Text type="secondary">R{(proposalStats.wonValue / 1000000).toFixed(2)}M value</Text>
              </Col>
              <Col span={12}>
                <Statistic title="Total Lost" value={proposalStats.declined} suffix="deals" valueStyle={{ color: '#ff4d4f' }} />
              </Col>
            </Row>
            <Divider />
            <Text strong>Win Rate by Template</Text>
            {templates.slice(0, 3).map(t => (
              <div key={t.id} style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{t.name}</Text>
                  <Text>{t.winRate}%</Text>
                </div>
                <Progress percent={t.winRate} showInfo={false} strokeColor={t.winRate >= 60 ? '#52c41a' : '#faad14'} />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Conversion Metrics">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Sent → Viewed" value={75} suffix="%" />
              </Col>
              <Col span={8}>
                <Statistic title="Viewed → Accepted" value={45} suffix="%" />
              </Col>
              <Col span={8}>
                <Statistic title="Avg. Deal Size" value={1.2} prefix="R" suffix="M" />
              </Col>
            </Row>
            <Divider />
            <Text strong>Response Time Distribution</Text>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Same Day</Text>
                <Text>25%</Text>
              </div>
              <Progress percent={25} showInfo={false} strokeColor="#52c41a" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>1-3 Days</Text>
                <Text>45%</Text>
              </div>
              <Progress percent={45} showInfo={false} strokeColor="#1890ff" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>4-7 Days</Text>
                <Text>20%</Text>
              </div>
              <Progress percent={20} showInfo={false} strokeColor="#faad14" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>7+ Days</Text>
                <Text>10%</Text>
              </div>
              <Progress percent={10} showInfo={false} strokeColor="#ff4d4f" />
            </div>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Monthly Performance">
            <Row gutter={16}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
                <Col key={month} span={4}>
                  <Card size="small">
                    <Statistic 
                      title={month} 
                      value={[8, 12, 10, 15, 18, 14][i]} 
                      suffix="sent"
                    />
                    <Text type="secondary">{[3, 5, 4, 7, 9, 6][i]} won</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Proposal Settings">
            <Form layout="vertical">
              <Form.Item label="Auto-generate Proposal Numbers">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Proposal Number Prefix">
                <Input defaultValue="PROP" />
              </Form.Item>
              <Form.Item label="Default Validity Period">
                <Select defaultValue="30">
                  <Option value="14">14 Days</Option>
                  <Option value="30">30 Days</Option>
                  <Option value="60">60 Days</Option>
                  <Option value="90">90 Days</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Require E-Signature">
                <Switch defaultChecked />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Financial Integration">
            <Form layout="vertical">
              <Form.Item label="Revenue Account (Accepted)">
                <Select defaultValue="4000">
                  <Option value="4000">4000 - Service Revenue</Option>
                  <Option value="4100">4100 - Consulting Revenue</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Accounts Receivable">
                <Select defaultValue="1100">
                  <Option value="1100">1100 - Trade Debtors</Option>
                  <Option value="1110">1110 - Contract Debtors</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Default VAT Rate">
                <Select defaultValue="15">
                  <Option value="15">15% (Standard)</Option>
                  <Option value="0">0% (Zero-rated)</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Auto-create Invoice on Acceptance">
                <Switch />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title={<><MailOutlined /> Email & Notifications</>}>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Send Notifications When">
                    <Checkbox.Group style={{ width: '100%' }}>
                      <Row>
                        <Col span={12}><Checkbox value="viewed">Proposal Viewed</Checkbox></Col>
                        <Col span={12}><Checkbox value="accepted" defaultChecked>Proposal Accepted</Checkbox></Col>
                        <Col span={12}><Checkbox value="declined" defaultChecked>Proposal Declined</Checkbox></Col>
                        <Col span={12}><Checkbox value="expiring" defaultChecked>Expiring Soon (3 days)</Checkbox></Col>
                      </Row>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email Template">
                    <Select defaultValue="default">
                      <Option value="default">Default Template</Option>
                      <Option value="formal">Formal Template</Option>
                      <Option value="casual">Casual Template</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Proposals Hub"
        subtitle="Proposals, Quotations & Client Engagement"
        icon={<FileTextOutlined />}
        gradient="cyan"
        actions={
          <>
            <Button icon={<SyncOutlined />} onClick={() => window.location.reload()}>Refresh</Button>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProposal}>
              New Proposal
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="cyan"
        icon={<TrophyOutlined />}
        title="Sales Pipeline"
        subtitle="Proposals & Win Rate"
        stats={[
          { title: 'Pipeline Value', value: `R${(proposalStats.pipelineValue / 1000000).toFixed(1)}M`, span: 4 },
          { title: 'Won This Month', value: `R${(proposalStats.wonValue / 1000).toFixed(0)}K`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Win Rate', value: `${proposalStats.winRate}%`, span: 4 },
          { title: 'Active Proposals', value: proposalStats.sent + proposalStats.viewed, span: 4 },
          { title: 'Pending Review', value: proposalStats.draft, span: 4 },
        ]}
      />

      <HubTabs
        theme="cyan"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'proposals', label: 'Proposals', icon: <FileTextOutlined />, children: renderProposals() },
          { key: 'templates', label: 'Templates', icon: <FormOutlined />, children: renderTemplates() },
          { key: 'pricing', label: 'Pricing Library', icon: <DollarOutlined />, children: renderPricing() },
          { key: 'analytics', label: 'Analytics', icon: <LineChartOutlined />, children: renderAnalytics() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* New Proposal Modal */}
      <Modal
        title="Create New Proposal"
        open={proposalModalVisible}
        onCancel={() => setProposalModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setProposalModalVisible(false)}>Cancel</Button>,
          <Button key="draft">Save Draft</Button>,
          <Button key="create" type="primary">Create & Edit</Button>
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Proposal Title" name="title" rules={[{ required: true }]}>
            <Input placeholder="Enter proposal title" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Client" name="client" rules={[{ required: true }]}>
                <Select placeholder="Select client">
                  <Option value="shoprite">Shoprite Holdings</Option>
                  <Option value="discovery">Discovery Limited</Option>
                  <Option value="standardbank">Standard Bank</Option>
                  <Option value="pnp">Pick n Pay</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contact">
                <Input placeholder="Contact name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Template" name="template">
                <Select placeholder="Select template">
                  {templates.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Valid Until" name="validUntil" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Estimated Value" name="value">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/R\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Probability" name="probability">
                <Select defaultValue={50}>
                  <Option value={25}>25% - Early Stage</Option>
                  <Option value={50}>50% - Qualified</Option>
                  <Option value={75}>75% - Likely</Option>
                  <Option value={90}>90% - Almost Certain</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default ProposalsHub;
