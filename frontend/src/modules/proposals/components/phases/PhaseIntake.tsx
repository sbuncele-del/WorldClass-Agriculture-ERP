/**
 * Phase 1: Intake & Setup
 * 
 * Features:
 * - Proposal type selection (Investment Pitch, Project Proposal, etc.)
 * - AI-suggested templates based on industry/client type
 * - Client information entry/import
 * - CRM/ERP data integration
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Input, Select, Form,
  Tabs, Tag, Avatar, Modal, Table, Tooltip, Badge, Spin, Upload,
  Divider, Alert, AutoComplete, Radio, message, Progress, Switch,
  Checkbox, List
} from 'antd';
import {
  UserOutlined, BankOutlined, MailOutlined, PhoneOutlined,
  GlobalOutlined, LinkedinOutlined, ImportOutlined, SearchOutlined,
  CheckCircleOutlined, StarOutlined, RocketOutlined, FileTextOutlined,
  TeamOutlined, DollarOutlined, ThunderboltOutlined, SyncOutlined,
  PlusOutlined, CloudUploadOutlined, DatabaseOutlined, BulbOutlined,
  HistoryOutlined, RightOutlined, CrownOutlined
} from '@ant-design/icons';
import type { ProposalType, ClientInfo, ProposalSection, ProposalData } from '../../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface PhaseIntakeProps {
  proposal: ProposalData;
  proposalTypes: ProposalType[];
  onTypeSelect: (type: ProposalType) => void;
  onClientUpdate: (client: ClientInfo) => void;
  onSectionsInit: (sections: ProposalSection[]) => void;
  onPhaseComplete: (progress: number) => void;
}

// Industry options
const industries = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Manufacturing', 
  'Retail', 'Construction', 'Agriculture', 'Mining', 'Education',
  'Government', 'Non-profit', 'Professional Services', 'Real Estate',
  'Telecommunications', 'Transportation', 'Energy', 'Media & Entertainment'
];

// CRM client interface for API data
interface CRMClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  size: 'small' | 'medium' | 'enterprise';
  existingClient: boolean;
  brandColors?: string[];
  lastProposal?: string | null;
  proposalCount?: number;
  winRate?: number;
}

// ERP data interfaces
interface ERPProject {
  id: string;
  name: string;
  client: string;
  value: number;
  status: string;
}

interface ERPMetrics {
  winRate: number;
  avgDealSize: number;
  avgCycleTime: number;
}

// AI Template suggestions based on context
const getAITemplateSuggestion = (type: ProposalType, industry: string) => {
  const suggestions: Record<string, string[]> = {
    'investment-pitch': [
      'Focus on market opportunity and growth potential',
      'Include financial projections and use of funds',
      'Highlight team expertise and track record',
      'Show competitive advantage clearly'
    ],
    'project-proposal': [
      'Detail methodology and approach',
      'Include clear deliverables and timeline',
      'Add risk mitigation strategies',
      'Reference similar successful projects'
    ],
    'sales-proposal': [
      'Lead with value proposition',
      'Include case studies from same industry',
      'Show ROI calculations',
      'Add testimonials from similar clients'
    ]
  };
  
  return suggestions[type.id] || ['Customize based on client needs'];
};

const PhaseIntake: React.FC<PhaseIntakeProps> = ({
  proposal,
  proposalTypes,
  onTypeSelect,
  onClientUpdate,
  onSectionsInit,
  onPhaseComplete
}) => {
  const [activeTab, setActiveTab] = useState('type');
  const [selectedType, setSelectedType] = useState<ProposalType | null>(proposal.type);
  const [clientForm] = Form.useForm();
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showERPModal, setShowERPModal] = useState(false);
  const [isLoadingCRM, setIsLoadingCRM] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [crmClients, setCrmClients] = useState<CRMClient[]>([]);
  const [erpProjects, setErpProjects] = useState<ERPProject[]>([]);
  const [erpMetrics, setErpMetrics] = useState<ERPMetrics>({ winRate: 0, avgDealSize: 0, avgCycleTime: 0 });
  
  // Fetch CRM clients from API
  useEffect(() => {
    const fetchCRMClients = async () => {
      try {
        const response = await fetch('/api/crm/clients', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCrmClients(data.clients || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch CRM clients:', error);
      }
    };
    fetchCRMClients();
  }, []);

  // Fetch ERP data from API
  useEffect(() => {
    const fetchERPData = async () => {
      try {
        const [projectsRes, metricsRes] = await Promise.all([
          fetch('/api/projects?limit=10', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/api/proposals/metrics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setErpProjects(data.projects || data || []);
        }
        
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setErpMetrics({
            winRate: data.winRate || 0,
            avgDealSize: data.avgDealSize || 0,
            avgCycleTime: data.avgCycleTime || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch ERP data:', error);
      }
    };
    fetchERPData();
  }, []);
  
  // Track completion
  useEffect(() => {
    let progress = 0;
    if (selectedType) progress += 40;
    if (proposal.client?.name) progress += 30;
    if (proposal.client?.company) progress += 15;
    if (proposal.client?.industry) progress += 15;
    onPhaseComplete(Math.min(progress, 100));
  }, [selectedType, proposal.client]);
  
  // Handle type selection
  const handleTypeSelect = (type: ProposalType) => {
    setSelectedType(type);
    onTypeSelect(type);
    setSelectedSections(type.suggestedSections);
    setAiSuggestions(getAITemplateSuggestion(type, proposal.client?.industry || ''));
    
    // Initialize sections based on type
    const sections: ProposalSection[] = type.suggestedSections.map((sectionType, index) => ({
      id: `section-${Date.now()}-${index}`,
      type: sectionType as ProposalSection['type'],
      title: formatSectionTitle(sectionType),
      content: '',
      aiGenerated: false,
      order: index,
      visible: true
    }));
    onSectionsInit(sections);
    
    message.success(`${type.name} template selected with ${sections.length} sections`);
    setActiveTab('client');
  };
  
  const formatSectionTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'cover': 'Cover Page',
      'executive-summary': 'Executive Summary',
      'problem': 'Problem Statement',
      'solution': 'Our Solution',
      'methodology': 'Methodology & Approach',
      'timeline': 'Project Timeline',
      'team': 'Our Team',
      'pricing': 'Investment',
      'case-studies': 'Case Studies',
      'testimonials': 'Client Testimonials',
      'about-us': 'About Us',
      'terms': 'Terms & Conditions',
      'appendix': 'Appendix'
    };
    return titles[type] || type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  
  // Handle CRM import
  const handleCRMImport = (client: CRMClient) => {
    setIsLoadingCRM(true);
    setTimeout(() => {
      const clientInfo: ClientInfo = {
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        industry: client.industry,
        size: client.size,
        brandColors: client.brandColors,
        existingClient: client.existingClient
      };
      
      onClientUpdate(clientInfo);
      clientForm.setFieldsValue(clientInfo);
      setIsLoadingCRM(false);
      setShowCRMModal(false);
      message.success(`Client "${client.company}" imported from CRM`);
      
      // Update AI suggestions based on client
      if (selectedType) {
        setAiSuggestions(getAITemplateSuggestion(selectedType, client.industry));
      }
    }, 800);
  };
  
  // Handle client form changes
  const handleClientFormChange = (changedValues: any, allValues: any) => {
    onClientUpdate({
      ...proposal.client,
      ...allValues,
      existingClient: proposal.client?.existingClient || false
    } as ClientInfo);
  };
  
  // Filter CRM clients
  const filteredClients = crmClients.filter(
    c => c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        size="large"
        items={[
          {
            key: 'type',
            label: (
              <Space>
                <FileTextOutlined />
                <span>1. Proposal Type</span>
                {selectedType && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </Space>
            ),
            children: (
              <Card>
                <Title level={4}>
                  <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  What type of proposal are you creating?
                </Title>
                <Paragraph type="secondary">
                  Select a type to get AI-optimized templates and content suggestions
                </Paragraph>
                
                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                  {proposalTypes.map(type => (
                    <Col xs={24} sm={12} md={8} key={type.id}>
                      <Card
                        hoverable
                        onClick={() => handleTypeSelect(type)}
                        style={{
                          border: selectedType?.id === type.id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                          background: selectedType?.id === type.id ? '#f0f5ff' : 'white'
                        }}
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div style={{ fontSize: 32 }}>{type.icon}</div>
                          <Title level={5} style={{ margin: 0 }}>{type.name}</Title>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {type.description}
                          </Text>
                          <div>
                            <Tag color="blue">{type.category}</Tag>
                            <Tag>{type.suggestedSections.length} sections</Tag>
                          </div>
                          {selectedType?.id === type.id && (
                            <CheckCircleOutlined style={{ 
                              position: 'absolute', 
                              top: 12, 
                              right: 12, 
                              fontSize: 24, 
                              color: '#52c41a' 
                            }} />
                          )}
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
                
                {selectedType && (
                  <Card style={{ marginTop: 24, background: '#fafafa' }}>
                    <Row gutter={24}>
                      <Col span={12}>
                        <Title level={5}>
                          <BulbOutlined style={{ marginRight: 8, color: '#faad14' }} />
                          AI Suggestions for {selectedType.name}
                        </Title>
                        <List
                          size="small"
                          dataSource={aiSuggestions}
                          renderItem={item => (
                            <List.Item>
                              <ThunderboltOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                              {item}
                            </List.Item>
                          )}
                        />
                      </Col>
                      <Col span={12}>
                        <Title level={5}>
                          <FileTextOutlined style={{ marginRight: 8 }} />
                          Included Sections
                        </Title>
                        <Checkbox.Group 
                          value={selectedSections}
                          onChange={(values) => setSelectedSections(values as string[])}
                        >
                          <Row gutter={[8, 8]}>
                            {selectedType.suggestedSections.map(section => (
                              <Col span={12} key={section}>
                                <Checkbox value={section}>
                                  {formatSectionTitle(section)}
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </Col>
                    </Row>
                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<RightOutlined />}
                        onClick={() => setActiveTab('client')}
                      >
                        Continue to Client Info
                      </Button>
                    </div>
                  </Card>
                )}
              </Card>
            )
          },
          {
            key: 'client',
            label: (
              <Space>
                <UserOutlined />
                <span>2. Client Info</span>
                {proposal.client?.name && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title={
                    <Space>
                      <BankOutlined />
                      <span>Client Information</span>
                    </Space>
                  }>
                    <Form
                      form={clientForm}
                      layout="vertical"
                      initialValues={proposal.client || {}}
                      onValuesChange={handleClientFormChange}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            name="company" 
                            label="Company Name" 
                            rules={[{ required: true }]}
                          >
                            <Input 
                              prefix={<BankOutlined />} 
                              placeholder="Enter company name"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item 
                            name="name" 
                            label="Contact Person"
                            rules={[{ required: true }]}
                          >
                            <Input 
                              prefix={<UserOutlined />} 
                              placeholder="Primary contact name"
                              size="large"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            name="email" 
                            label="Email Address"
                            rules={[{ type: 'email' }]}
                          >
                            <Input 
                              prefix={<MailOutlined />} 
                              placeholder="contact@company.com"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="phone" label="Phone Number">
                            <Input 
                              prefix={<PhoneOutlined />} 
                              placeholder="+27 XX XXX XXXX"
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item 
                            name="industry" 
                            label="Industry"
                            rules={[{ required: true }]}
                          >
                            <Select 
                              placeholder="Select industry"
                              showSearch
                              size="large"
                            >
                              {industries.map(ind => (
                                <Option key={ind} value={ind}>{ind}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="size" label="Company Size">
                            <Select placeholder="Select size">
                              <Option value="startup">Startup (1-10)</Option>
                              <Option value="small">Small (11-50)</Option>
                              <Option value="medium">Medium (51-200)</Option>
                              <Option value="enterprise">Enterprise (200+)</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="website" label="Website">
                            <Input 
                              prefix={<GlobalOutlined />} 
                              placeholder="https://company.com"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="linkedIn" label="LinkedIn">
                            <Input 
                              prefix={<LinkedinOutlined />} 
                              placeholder="linkedin.com/company/..."
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item name="notes" label="Additional Notes">
                        <Input.TextArea 
                          rows={3} 
                          placeholder="Any special requirements or context..."
                        />
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>
                
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {/* Import Options */}
                    <Card size="small" title="Quick Import">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button 
                          block 
                          icon={<DatabaseOutlined />}
                          onClick={() => setShowCRMModal(true)}
                        >
                          Import from CRM
                        </Button>
                        <Button 
                          block 
                          icon={<SyncOutlined />}
                          onClick={() => setShowERPModal(true)}
                        >
                          Sync from ERP
                        </Button>
                        <Upload showUploadList={false}>
                          <Button block icon={<CloudUploadOutlined />}>
                            Import vCard/CSV
                          </Button>
                        </Upload>
                      </Space>
                    </Card>
                    
                    {/* AI Analysis */}
                    {proposal.client?.industry && (
                      <Card 
                        size="small" 
                        title={
                          <Space>
                            <ThunderboltOutlined style={{ color: '#722ed1' }} />
                            <span>AI Analysis</span>
                          </Space>
                        }
                        style={{ background: '#f9f0ff' }}
                      >
                        <Space direction="vertical" size="small">
                          <Text>
                            Based on <strong>{proposal.client.industry}</strong> industry:
                          </Text>
                          <Tag color="purple">High-value sector</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Recommended focus areas:
                          </Text>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                            <li>Digital transformation</li>
                            <li>Compliance & governance</li>
                            <li>Operational efficiency</li>
                          </ul>
                        </Space>
                      </Card>
                    )}
                    
                    {/* Recent Proposals */}
                    {proposal.client?.existingClient && (
                      <Card size="small" title={
                        <Space>
                          <HistoryOutlined />
                          <span>Previous Proposals</span>
                        </Space>
                      }>
                        <List
                          size="small"
                          dataSource={erpProjects.slice(0, 2)}
                          renderItem={item => (
                            <List.Item>
                              <List.Item.Meta
                                title={item.name}
                                description={`R${(item.value / 1000000).toFixed(1)}M`}
                              />
                              <Tag color={item.status === 'completed' ? 'green' : 'blue'}>
                                {item.status}
                              </Tag>
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </Space>
                </Col>
              </Row>
            )
          },
          {
            key: 'review',
            label: (
              <Space>
                <CheckCircleOutlined />
                <span>3. Review & Continue</span>
              </Space>
            ),
            children: (
              <Card>
                <Title level={4}>Setup Summary</Title>
                <Paragraph type="secondary">
                  Review your selections before proceeding to content creation
                </Paragraph>
                
                <Row gutter={24} style={{ marginTop: 24 }}>
                  <Col span={12}>
                    <Card 
                      size="small" 
                      title="Proposal Type"
                      extra={selectedType && <Tag color="blue">{selectedType.category}</Tag>}
                    >
                      {selectedType ? (
                        <Space>
                          <span style={{ fontSize: 32 }}>{selectedType.icon}</span>
                          <div>
                            <Text strong>{selectedType.name}</Text>
                            <br />
                            <Text type="secondary">{selectedType.suggestedSections.length} sections</Text>
                          </div>
                        </Space>
                      ) : (
                        <Alert message="Please select a proposal type" type="warning" showIcon />
                      )}
                    </Card>
                  </Col>
                  
                  <Col span={12}>
                    <Card 
                      size="small" 
                      title="Client"
                      extra={proposal.client?.existingClient && <Tag color="green">Existing</Tag>}
                    >
                      {proposal.client?.name ? (
                        <Space>
                          <Avatar size={48} style={{ background: '#1890ff' }}>
                            {proposal.client.company?.charAt(0) || 'C'}
                          </Avatar>
                          <div>
                            <Text strong>{proposal.client.company}</Text>
                            <br />
                            <Text type="secondary">{proposal.client.name}</Text>
                            <br />
                            <Tag>{proposal.client.industry || 'No industry'}</Tag>
                          </div>
                        </Space>
                      ) : (
                        <Alert message="Please enter client information" type="warning" showIcon />
                      )}
                    </Card>
                  </Col>
                </Row>
                
                <Divider />
                
                <Title level={5}>Sections to Generate</Title>
                <Row gutter={[8, 8]}>
                  {selectedSections.map((section, index) => (
                    <Col key={section}>
                      <Tag 
                        icon={<FileTextOutlined />}
                        style={{ padding: '4px 12px' }}
                      >
                        {index + 1}. {formatSectionTitle(section)}
                      </Tag>
                    </Col>
                  ))}
                </Row>
                
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    disabled={!selectedType || !proposal.client?.name}
                    style={{ 
                      height: 50, 
                      padding: '0 48px',
                      background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
                      border: 'none'
                    }}
                  >
                    Continue to AI Content Creation
                  </Button>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Our AI will analyze your inputs and generate draft content
                    </Text>
                  </div>
                </div>
              </Card>
            )
          }
        ]}
      />
      
      {/* CRM Import Modal */}
      <Modal
        title={
          <Space>
            <DatabaseOutlined />
            <span>Import from CRM</span>
          </Space>
        }
        open={showCRMModal}
        onCancel={() => setShowCRMModal(false)}
        footer={null}
        width={700}
      >
        <Input
          placeholder="Search clients..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        
        <Table
          dataSource={filteredClients}
          rowKey="id"
          loading={isLoadingCRM}
          size="small"
          pagination={false}
          onRow={(record) => ({
            onClick: () => handleCRMImport(record),
            style: { cursor: 'pointer' }
          })}
          columns={[
            {
              title: 'Company',
              dataIndex: 'company',
              render: (text, record) => (
                <Space>
                  <Avatar 
                    style={{ 
                      background: record.brandColors?.[0] || '#1890ff' 
                    }}
                  >
                    {text.charAt(0)}
                  </Avatar>
                  <div>
                    <Text strong>{text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {record.name}
                    </Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Industry',
              dataIndex: 'industry',
              render: text => <Tag>{text}</Tag>
            },
            {
              title: 'Proposals',
              dataIndex: 'proposalCount',
              render: (count, record) => (
                <Space direction="vertical" size={0}>
                  <Text>{count} sent</Text>
                  {record.winRate > 0 && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {record.winRate}% win rate
                    </Text>
                  )}
                </Space>
              )
            },
            {
              title: '',
              render: () => (
                <Button type="link" icon={<ImportOutlined />}>
                  Import
                </Button>
              )
            }
          ]}
        />
      </Modal>
      
      {/* ERP Import Modal */}
      <Modal
        title={
          <Space>
            <SyncOutlined />
            <span>ERP Data Integration</span>
          </Space>
        }
        open={showERPModal}
        onCancel={() => setShowERPModal(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="Sync Business Data"
          description="Pull relevant data from your ERP system to enhance your proposal"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Card size="small" title="Available Data">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox>Recent Projects & Case Studies</Checkbox>
            <Checkbox>Pricing History & Templates</Checkbox>
            <Checkbox>Resource Availability</Checkbox>
            <Checkbox>Financial Metrics & KPIs</Checkbox>
            <Checkbox>Team Member Profiles</Checkbox>
          </Space>
        </Card>
        
        <Card size="small" title="Success Metrics" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="Win Rate" 
                value={erpMetrics.winRate} 
                suffix="%" 
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Avg Deal Size" 
                value={erpMetrics.avgDealSize} 
                prefix="R"
                formatter={(value) => `${(Number(value) / 1000000).toFixed(1)}M`}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Avg Cycle" 
                value={erpMetrics.avgCycleTime} 
                suffix=" days"
              />
            </Col>
          </Row>
        </Card>
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Button type="primary" onClick={() => {
            message.success('ERP data synced successfully');
            setShowERPModal(false);
          }}>
            Sync Selected Data
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// Helper component for statistics
const Statistic: React.FC<{
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  formatter?: (value: number) => string;
}> = ({ title, value, prefix, suffix, valueStyle, formatter }) => (
  <div style={{ textAlign: 'center' }}>
    <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
    <div style={{ fontSize: 20, fontWeight: 600, ...valueStyle }}>
      {prefix}{formatter ? formatter(value) : value}{suffix}
    </div>
  </div>
);

export default PhaseIntake;
