import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Input,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Tabs,
  Avatar,
  Progress,
  Statistic,
  Badge,
  Dropdown,
  Tooltip,
  Space,
  message,
  Drawer,
  Timeline,
  Divider,
  List,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BankOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  AuditOutlined,
  CalculatorOutlined,
  SolutionOutlined,
  FolderOutlined,
  UserOutlined,
  RiseOutlined,
  StarOutlined,
  StarFilled,
  ProjectOutlined,
  HistoryOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import './ClientManagement.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Demo data
const clientsData = [
  {
    id: '1',
    name: 'Nexus Industries Ltd',
    type: 'Corporation',
    industry: 'Manufacturing',
    status: 'Active',
    tier: 'Enterprise',
    contactName: 'James Morrison',
    contactEmail: 'j.morrison@nexusind.com',
    contactPhone: '+1 (555) 123-4567',
    annualRevenue: 45000000,
    yearEnd: 'December',
    services: ['Annual Audit', 'Tax Planning', 'Advisory'],
    engagementStart: '2019-03-15',
    lastContact: '2024-01-15',
    nextDeadline: '2024-04-15',
    deadlineType: 'Tax Filing',
    billedYTD: 125000,
    outstanding: 15000,
    healthScore: 92,
    starred: true,
    entities: 4,
    employees: 450,
  },
  {
    id: '2',
    name: 'Sterling Financial Group',
    type: 'Partnership',
    industry: 'Financial Services',
    status: 'Active',
    tier: 'Premium',
    contactName: 'Sarah Chen',
    contactEmail: 's.chen@sterlingfin.com',
    contactPhone: '+1 (555) 234-5678',
    annualRevenue: 28000000,
    yearEnd: 'March',
    services: ['Quarterly Review', 'Tax Compliance', 'Payroll'],
    engagementStart: '2020-06-01',
    lastContact: '2024-01-10',
    nextDeadline: '2024-03-31',
    deadlineType: 'Year End',
    billedYTD: 85000,
    outstanding: 0,
    healthScore: 88,
    starred: true,
    entities: 2,
    employees: 120,
  },
  {
    id: '3',
    name: 'TechVenture Startup Inc',
    type: 'Corporation',
    industry: 'Technology',
    status: 'Active',
    tier: 'Growth',
    contactName: 'Michael Park',
    contactEmail: 'm.park@techventure.io',
    contactPhone: '+1 (555) 345-6789',
    annualRevenue: 5000000,
    yearEnd: 'December',
    services: ['Bookkeeping', 'Tax Filing', 'R&D Credits'],
    engagementStart: '2022-01-15',
    lastContact: '2024-01-08',
    nextDeadline: '2024-01-31',
    deadlineType: 'Monthly Close',
    billedYTD: 24000,
    outstanding: 4000,
    healthScore: 75,
    starred: false,
    entities: 1,
    employees: 35,
  },
  {
    id: '4',
    name: 'Global Retail Holdings',
    type: 'Corporation',
    industry: 'Retail',
    status: 'Prospect',
    tier: 'Enterprise',
    contactName: 'Lisa Wong',
    contactEmail: 'l.wong@globalretail.com',
    contactPhone: '+1 (555) 456-7890',
    annualRevenue: 120000000,
    yearEnd: 'January',
    services: ['Audit', 'Tax', 'Transfer Pricing'],
    engagementStart: null,
    lastContact: '2024-01-12',
    nextDeadline: '2024-02-15',
    deadlineType: 'Proposal Due',
    billedYTD: 0,
    outstanding: 0,
    healthScore: 0,
    starred: false,
    entities: 12,
    employees: 2500,
  },
];

const upcomingDeadlines = [
  { client: 'TechVenture Startup Inc', deadline: '2024-01-31', type: 'Monthly Close', daysLeft: 3, priority: 'high' },
  { client: 'Global Retail Holdings', deadline: '2024-02-15', type: 'Proposal Due', daysLeft: 18, priority: 'medium' },
  { client: 'Sterling Financial Group', deadline: '2024-03-31', type: 'Year End', daysLeft: 62, priority: 'low' },
  { client: 'Nexus Industries Ltd', deadline: '2024-04-15', type: 'Tax Filing', daysLeft: 77, priority: 'low' },
];

const ClientManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [engagementForm] = Form.useForm();

  // Demo data for engagements linked to clients
  const clientEngagements: Record<string, any[]> = {
    '1': [
      { id: 'PRJ-001', name: '2024 Annual Audit', type: 'Audit', status: 'Active', manager: 'John Smith', hours: 120, budget: 45000, progress: 65 },
      { id: 'PRJ-002', name: 'Tax Planning 2024', type: 'Tax', status: 'Planning', manager: 'Sarah Lee', hours: 0, budget: 15000, progress: 10 },
      { id: 'PRJ-003', name: 'Advisory - M&A Support', type: 'Advisory', status: 'Active', manager: 'Michael Brown', hours: 45, budget: 25000, progress: 40 },
    ],
    '2': [
      { id: 'PRJ-004', name: 'Q4 Review', type: 'Review', status: 'Completed', manager: 'Emily Chen', hours: 32, budget: 12000, progress: 100 },
      { id: 'PRJ-005', name: 'Payroll Services 2024', type: 'Recurring', status: 'Active', manager: 'David Kim', hours: 24, budget: 8000, progress: 50 },
    ],
    '3': [
      { id: 'PRJ-006', name: 'Monthly Bookkeeping', type: 'Recurring', status: 'Active', manager: 'Lisa Wang', hours: 16, budget: 4000, progress: 75 },
      { id: 'PRJ-007', name: 'R&D Tax Credit Study', type: 'Tax', status: 'Planning', manager: 'John Smith', hours: 0, budget: 8000, progress: 5 },
    ],
    '4': [],
  };

  const clientInteractions: Record<string, any[]> = {
    '1': [
      { date: '2024-01-15', type: 'Call', summary: 'Discussed Q4 results and audit timeline', employee: 'John Smith' },
      { date: '2024-01-10', type: 'Email', summary: 'Sent engagement letter for 2024 audit', employee: 'Sarah Lee' },
      { date: '2024-01-05', type: 'Meeting', summary: 'Kickoff meeting for tax planning project', employee: 'Michael Brown' },
    ],
    '2': [
      { date: '2024-01-10', type: 'Call', summary: 'Year-end close preparation call', employee: 'Emily Chen' },
      { date: '2024-01-08', type: 'Email', summary: 'Payroll schedule confirmation', employee: 'David Kim' },
    ],
    '3': [
      { date: '2024-01-08', type: 'Email', summary: 'Monthly financials delivered', employee: 'Lisa Wang' },
    ],
    '4': [
      { date: '2024-01-12', type: 'Meeting', summary: 'Initial discovery meeting - potential new client', employee: 'John Smith' },
    ],
  };

  const openClientProfile = (client: any) => {
    setSelectedClient(client);
    setIsProfileDrawerOpen(true);
  };

  const openNewEngagement = (client: any) => {
    setSelectedClient(client);
    engagementForm.setFieldsValue({ clientName: client.name });
    setIsEngagementModalOpen(true);
  };

  const filteredClients = clientsData.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchText.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchText.toLowerCase());
    const matchesTier = !selectedTier || client.tier === selectedTier;
    const matchesStatus = !selectedStatus || client.status === selectedStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Enterprise': return 'gold';
      case 'Premium': return 'purple';
      case 'Growth': return 'blue';
      case 'Starter': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Prospect': return 'processing';
      case 'Inactive': return 'default';
      case 'At Risk': return 'error';
      default: return 'default';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const columns = [
    {
      title: '',
      key: 'starred',
      width: 40,
      render: (record: any) => (
        <Button
          type="text"
          icon={record.starred ? <StarFilled style={{ color: '#fbbf24' }} /> : <StarOutlined />}
          size="small"
        />
      ),
    },
    {
      title: 'Client',
      key: 'client',
      render: (record: any) => (
        <div className="client-cell">
          <Avatar
            size={40}
            style={{ background: record.status === 'Active' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#94a3b8' }}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div className="client-info">
            <Text strong>{record.name}</Text>
            <div className="client-meta">
              <Tag color={getTierColor(record.tier)} style={{ marginRight: 4 }}>{record.tier}</Tag>
              <Badge status={getStatusColor(record.status) as any} text={record.status} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Industry',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: any) => (
        <div className="contact-cell">
          <Text>{record.contactName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.contactEmail}</Text>
        </div>
      ),
    },
    {
      title: 'Services',
      key: 'services',
      render: (record: any) => (
        <Space wrap size={[4, 4]}>
          {record.services.slice(0, 2).map((service: string, i: number) => (
            <Tag key={i}>{service}</Tag>
          ))}
          {record.services.length > 2 && <Tag>+{record.services.length - 2}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Next Deadline',
      key: 'deadline',
      render: (record: any) => (
        <div className="deadline-cell">
          <Text>{record.nextDeadline}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.deadlineType}</Text>
        </div>
      ),
    },
    {
      title: 'Health',
      key: 'health',
      width: 100,
      render: (record: any) => (
        record.healthScore > 0 ? (
          <Progress
            percent={record.healthScore}
            size="small"
            strokeColor={getHealthColor(record.healthScore)}
            format={(percent) => `${percent}`}
          />
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
    {
      title: 'YTD Billed',
      key: 'billed',
      render: (record: any) => (
        <Text strong style={{ color: record.billedYTD > 0 ? '#10b981' : undefined }}>
          ${record.billedYTD.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (record: any) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'View Profile', onClick: () => openClientProfile(record) },
              { key: 'edit', icon: <EditOutlined />, label: 'Edit Client' },
              { key: 'email', icon: <MailOutlined />, label: 'Send Email' },
              { type: 'divider' },
              { key: 'engagement', icon: <FileTextOutlined />, label: 'New Engagement', onClick: () => openNewEngagement(record) },
              { key: 'task', icon: <CheckCircleOutlined />, label: 'Add Task' },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="client-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={2}>Client Management</Title>
          <Text type="secondary">Manage your client portfolio and engagements</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setIsModalOpen(true)}
        >
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Clients"
              value={47}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
            <div className="stat-trend">
              <RiseOutlined style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>+3 this month</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Active Engagements"
              value={62}
              prefix={<FileProtectOutlined />}
              valueStyle={{ color: '#764ba2' }}
            />
            <div className="stat-trend">
              <span style={{ color: '#64748b' }}>12 pending completion</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Revenue YTD"
              value={892500}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#10b981' }}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            <div className="stat-trend">
              <RiseOutlined style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>+18% vs last year</span>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="Outstanding"
              value={34500}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
            <div className="stat-trend">
              <span style={{ color: '#64748b' }}>8 invoices pending</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={24}>
        {/* Client List */}
        <Col span={17}>
          <Card className="clients-card">
            <div className="card-header">
              <Search
                placeholder="Search clients..."
                allowClear
                style={{ width: 300 }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Space>
                <Select
                  placeholder="Tier"
                  allowClear
                  style={{ width: 120 }}
                  onChange={setSelectedTier}
                >
                  <Option value="Enterprise">Enterprise</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="Growth">Growth</Option>
                  <Option value="Starter">Starter</Option>
                </Select>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 120 }}
                  onChange={setSelectedStatus}
                >
                  <Option value="Active">Active</Option>
                  <Option value="Prospect">Prospect</Option>
                  <Option value="At Risk">At Risk</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Space>
            </div>
            <Table
              columns={columns}
              dataSource={filteredClients}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="clients-table"
            />
          </Card>
        </Col>

        {/* Sidebar */}
        <Col span={7}>
          {/* Upcoming Deadlines */}
          <Card className="deadlines-card" title={<><CalendarOutlined /> Upcoming Deadlines</>}>
            <div className="deadlines-list">
              {upcomingDeadlines.map((item, i) => (
                <div key={i} className={`deadline-item priority-${item.priority}`}>
                  <div className="deadline-left">
                    <Text strong>{item.client}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.type}</Text>
                  </div>
                  <div className="deadline-right">
                    <Tag color={
                      item.daysLeft <= 7 ? 'red' : 
                      item.daysLeft <= 30 ? 'orange' : 
                      'blue'
                    }>
                      {item.daysLeft} days
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="quick-actions-card" title="Quick Actions">
            <div className="actions-grid">
              <Button icon={<AuditOutlined />} block>New Audit</Button>
              <Button icon={<CalculatorOutlined />} block>Tax Return</Button>
              <Button icon={<SolutionOutlined />} block>Advisory</Button>
              <Button icon={<FolderOutlined />} block>Documents</Button>
            </div>
          </Card>

          {/* Services Breakdown */}
          <Card className="services-card" title="Services Overview">
            <div className="service-item">
              <div className="service-info">
                <AuditOutlined />
                <span>Audit & Assurance</span>
              </div>
              <Text strong>$425,000</Text>
            </div>
            <div className="service-item">
              <div className="service-info">
                <CalculatorOutlined />
                <span>Tax Services</span>
              </div>
              <Text strong>$312,000</Text>
            </div>
            <div className="service-item">
              <div className="service-info">
                <SolutionOutlined />
                <span>Advisory</span>
              </div>
              <Text strong>$155,500</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Add Client Modal */}
      <Modal
        title="Add New Client"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Client Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="e.g., Acme Corporation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Entity Type" name="type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="Corporation">Corporation</Option>
                  <Option value="Partnership">Partnership</Option>
                  <Option value="LLC">LLC</Option>
                  <Option value="Sole Proprietor">Sole Proprietor</Option>
                  <Option value="Non-Profit">Non-Profit</Option>
                  <Option value="Trust">Trust</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Industry" name="industry" rules={[{ required: true }]}>
                <Select placeholder="Select industry">
                  <Option value="Manufacturing">Manufacturing</Option>
                  <Option value="Financial Services">Financial Services</Option>
                  <Option value="Technology">Technology</Option>
                  <Option value="Healthcare">Healthcare</Option>
                  <Option value="Retail">Retail</Option>
                  <Option value="Real Estate">Real Estate</Option>
                  <Option value="Professional Services">Professional Services</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Client Tier" name="tier" rules={[{ required: true }]}>
                <Select placeholder="Select tier">
                  <Option value="Enterprise">Enterprise</Option>
                  <Option value="Premium">Premium</Option>
                  <Option value="Growth">Growth</Option>
                  <Option value="Starter">Starter</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Primary Contact Name" name="contactName">
                <Input placeholder="Full name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Email" name="contactEmail">
                <Input placeholder="email@company.com" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="+1 (555) 000-0000" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Year End" name="yearEnd">
                <Select placeholder="Select month">
                  {['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <Option key={m} value={m}>{m}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Annual Revenue" name="annualRevenue">
                <Input placeholder="$0" prefix={<DollarOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Number of Employees" name="employees">
                <Input placeholder="0" prefix={<TeamOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Services Required" name="services">
            <Select mode="multiple" placeholder="Select services">
              <Option value="Annual Audit">Annual Audit</Option>
              <Option value="Quarterly Review">Quarterly Review</Option>
              <Option value="Tax Planning">Tax Planning</Option>
              <Option value="Tax Filing">Tax Filing</Option>
              <Option value="Bookkeeping">Bookkeeping</Option>
              <Option value="Payroll">Payroll</Option>
              <Option value="Advisory">Advisory Services</Option>
              <Option value="R&D Credits">R&D Tax Credits</Option>
              <Option value="Transfer Pricing">Transfer Pricing</Option>
            </Select>
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => {
              message.success('Client added successfully');
              setIsModalOpen(false);
            }}>
              Add Client
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Client Profile Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={680}
        onClose={() => setIsProfileDrawerOpen(false)}
        open={isProfileDrawerOpen}
        className="client-profile-drawer"
      >
        {selectedClient && (
          <div className="client-profile">
            {/* Header */}
            <div className="profile-header">
              <Avatar
                size={64}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                {selectedClient.name.charAt(0)}
              </Avatar>
              <div className="profile-header-info">
                <Title level={4} style={{ margin: 0 }}>{selectedClient.name}</Title>
                <Space>
                  <Tag color={getTierColor(selectedClient.tier)}>{selectedClient.tier}</Tag>
                  <Badge status={getStatusColor(selectedClient.status) as any} text={selectedClient.status} />
                </Space>
              </div>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => openNewEngagement(selectedClient)}
              >
                New Engagement
              </Button>
            </div>

            {/* Quick Stats */}
            <Row gutter={16} className="profile-stats">
              <Col span={6}>
                <Statistic title="YTD Billed" value={selectedClient.billedYTD} prefix="$" valueStyle={{ fontSize: 18 }} />
              </Col>
              <Col span={6}>
                <Statistic title="Outstanding" value={selectedClient.outstanding} prefix="$" valueStyle={{ fontSize: 18, color: selectedClient.outstanding > 0 ? '#f59e0b' : undefined }} />
              </Col>
              <Col span={6}>
                <Statistic title="Health Score" value={selectedClient.healthScore || '—'} suffix={selectedClient.healthScore ? '/100' : ''} valueStyle={{ fontSize: 18, color: getHealthColor(selectedClient.healthScore) }} />
              </Col>
              <Col span={6}>
                <Statistic title="Entities" value={selectedClient.entities} valueStyle={{ fontSize: 18 }} />
              </Col>
            </Row>

            <Divider />

            {/* Tabs */}
            <Tabs
              defaultActiveKey="engagements"
              items={[
                {
                  key: 'engagements',
                  label: <><ProjectOutlined /> Engagements ({(clientEngagements[selectedClient.id] || []).length})</>,
                  children: (
                    <div className="engagements-list">
                      {(clientEngagements[selectedClient.id] || []).length === 0 ? (
                        <div className="empty-engagements">
                          <FileTextOutlined style={{ fontSize: 48, color: '#d1d5db' }} />
                          <Text type="secondary">No engagements yet</Text>
                          <Button type="primary" icon={<PlusOutlined />} onClick={() => openNewEngagement(selectedClient)}>
                            Create First Engagement
                          </Button>
                        </div>
                      ) : (
                        <List
                          dataSource={clientEngagements[selectedClient.id]}
                          renderItem={(item: any) => (
                            <List.Item className="engagement-item">
                              <div className="engagement-info">
                                <div className="engagement-header">
                                  <Text strong>{item.name}</Text>
                                  <Tag color={
                                    item.status === 'Active' ? 'blue' :
                                    item.status === 'Completed' ? 'green' :
                                    item.status === 'Planning' ? 'orange' : 'default'
                                  }>{item.status}</Tag>
                                </div>
                                <div className="engagement-meta">
                                  <Text type="secondary">{item.id} • {item.type} • {item.manager}</Text>
                                </div>
                                <Progress 
                                  percent={item.progress} 
                                  size="small" 
                                  strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }}
                                />
                                <div className="engagement-stats">
                                  <span><ClockCircleOutlined /> {item.hours}h logged</span>
                                  <span><DollarOutlined /> ${item.budget.toLocaleString()} budget</span>
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'interactions',
                  label: <><HistoryOutlined /> Recent Activity</>,
                  children: (
                    <Timeline
                      items={(clientInteractions[selectedClient.id] || []).map((item: any) => ({
                        color: item.type === 'Call' ? 'blue' : item.type === 'Meeting' ? 'green' : 'gray',
                        children: (
                          <div className="interaction-item">
                            <div className="interaction-header">
                              <Tag>{item.type}</Tag>
                              <Text type="secondary">{item.date}</Text>
                            </div>
                            <Text>{item.summary}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>by {item.employee}</Text>
                          </div>
                        ),
                      }))}
                    />
                  ),
                },
                {
                  key: 'contacts',
                  label: <><UserOutlined /> Contacts</>,
                  children: (
                    <div className="contact-details">
                      <Card size="small">
                        <div className="contact-row">
                          <UserOutlined />
                          <div>
                            <Text strong>{selectedClient.contactName}</Text>
                            <Text type="secondary" style={{ display: 'block' }}>Primary Contact</Text>
                          </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div className="contact-row">
                          <MailOutlined />
                          <Text>{selectedClient.contactEmail}</Text>
                        </div>
                        <div className="contact-row">
                          <PhoneOutlined />
                          <Text>{selectedClient.contactPhone}</Text>
                        </div>
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* New Engagement Modal */}
      <Modal
        title={<><ProjectOutlined /> New Engagement for {selectedClient?.name}</>}
        open={isEngagementModalOpen}
        onCancel={() => setIsEngagementModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={engagementForm} layout="vertical">
          <Form.Item label="Engagement Name" name="engagementName" rules={[{ required: true }]}>
            <Input placeholder="e.g., 2024 Annual Audit" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Engagement Type" name="engagementType" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="Audit">Audit</Option>
                  <Option value="Review">Review</Option>
                  <Option value="Tax">Tax Services</Option>
                  <Option value="Advisory">Advisory</Option>
                  <Option value="Compliance">Compliance</Option>
                  <Option value="Consulting">Consulting</Option>
                  <Option value="Recurring">Recurring Service</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Project Manager" name="manager" rules={[{ required: true }]}>
                <Select placeholder="Select manager">
                  <Option value="john">John Smith</Option>
                  <Option value="sarah">Sarah Lee</Option>
                  <Option value="michael">Michael Brown</Option>
                  <Option value="emily">Emily Chen</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Start Date" name="startDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Target End Date" name="endDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Budget Hours" name="budgetHours">
                <Input type="number" placeholder="0" suffix="hours" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Budget Amount" name="budgetAmount">
                <Input prefix="$" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Engagement scope and deliverables..." />
          </Form.Item>
          <div className="modal-actions">
            <Button onClick={() => setIsEngagementModalOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => {
              message.success('Engagement created and linked to client');
              setIsEngagementModalOpen(false);
              engagementForm.resetFields();
            }}>
              Create Engagement
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ClientManagement;
