/**
 * RegulatoryHub - Regulatory Reporting & Compliance Management
 * 
 * Features:
 * - SARS Submissions (VAT, PAYE, IT14, etc.)
 * - CIPC Filings
 * - B-BBEE Compliance
 * - Sector-Specific Regulations
 * - Compliance Calendar
 * - Filing History
 * - Document Templates
 * - Automated Reminders
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, Modal, Form, Typography, Avatar,
  Timeline, Descriptions, Tooltip, Switch, Alert,
  List, Divider, Steps, Upload, message, Calendar, Empty, Spin
} from 'antd';
import apiClient from '../../services/api';
import {
  HomeOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, FlagOutlined, SendOutlined,
  UserOutlined, BellOutlined, FileTextOutlined,
  SafetyCertificateOutlined, AuditOutlined, BankOutlined, RocketOutlined,
  FileDoneOutlined, FileSearchOutlined, GlobalOutlined,
  ScheduleOutlined, AlertOutlined, CheckSquareOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import HubLayout from '../../components/hub/HubLayout';
import HubHeader from '../../components/hub/HubHeader';
import StatusBanner from '../../components/hub/StatusBanner';
import HubTabs from '../../components/hub/HubTabs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Interfaces
interface RegulatoryFiling {
  id: string;
  name: string;
  authority: string;
  type: string;
  dueDate: string;
  status: 'submitted' | 'pending' | 'overdue' | 'upcoming' | 'draft';
  period: string;
  submittedDate?: string;
  reference?: string;
  amount?: number;
}

interface ComplianceRequirement {
  id: string;
  name: string;
  authority: string;
  frequency: string;
  nextDue: string;
  status: 'compliant' | 'attention' | 'non-compliant';
  lastFiled?: string;
  description: string;
}

interface DeadlineEvent {
  date: string;
  filings: { name: string; authority: string; type: string }[];
}

const RegulatoryHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [filingModalVisible, setFilingModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // Data state
  const [filings, setFilings] = useState<RegulatoryFiling[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineEvent[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [filingsRes, requirementsRes, deadlinesRes] = await Promise.all([
          apiClient.get('/api/compliance/regulatory/filings'),
          apiClient.get('/api/compliance/regulatory/requirements'),
          apiClient.get('/api/compliance/regulatory/deadlines')
        ]);
        setFilings(filingsRes.data || []);
        setRequirements(requirementsRes.data || []);
        setUpcomingDeadlines(deadlinesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch regulatory data:', error);
        message.error('Failed to load regulatory data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculations
  const submittedFilings = filings.filter(f => f.status === 'submitted').length;
  const pendingFilings = filings.filter(f => f.status === 'pending' || f.status === 'draft').length;
  const overdueFilings = filings.filter(f => f.status === 'overdue').length;
  const compliantRequirements = requirements.filter(r => r.status === 'compliant').length;
  const complianceRate = Math.round((compliantRequirements / requirements.length) * 100);

  // Overview Tab
  const renderOverview = () => (
    <div style={{ padding: '24px' }}>
      {/* Compliance Score */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
        <Row align="middle" gutter={24}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={complianceRate}
                size={180}
                strokeWidth={10}
                strokeColor="#fff"
                trailColor="rgba(255,255,255,0.3)"
                format={() => (
                  <div style={{ color: '#fff' }}>
                    <div style={{ fontSize: 48, fontWeight: 'bold' }}>{complianceRate}%</div>
                    <div style={{ fontSize: 14 }}>COMPLIANT</div>
                  </div>
                )}
              />
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
              <SafetyCertificateOutlined /> Regulatory Compliance Status
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>
              Your organization is <strong>{complianceRate}%</strong> compliant with all regulatory requirements.
              {pendingFilings > 0 && ` ${pendingFilings} filings pending submission.`}
            </Paragraph>
            <Space size="large" style={{ marginTop: 16 }}>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setFilingModalVisible(true)} style={{ background: '#fff', color: '#11998e', borderColor: '#fff' }}>
                New Filing
              </Button>
              <Button size="large" icon={<CalendarOutlined />} style={{ background: 'rgba(255,255,255,0.2)', borderColor: '#fff', color: '#fff' }}>
                View Calendar
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
              title="Submitted This Month" 
              value={submittedFilings}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Pending Submission" 
              value={pendingFilings}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Overdue Filings" 
              value={overdueFilings}
              valueStyle={{ color: overdueFilings > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic 
              title="Compliance Score" 
              value={complianceRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<SafetyCertificateOutlined />} 
            />
          </Card>
        </Col>
      </Row>

      {/* Upcoming Deadlines Alert */}
      {upcomingDeadlines.length > 0 && (
        <Alert
          message="Upcoming Deadlines"
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
              {upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
                <li key={idx}>
                  <strong>{deadline.date}</strong>: {deadline.filings.map(f => f.name).join(', ')}
                </li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          icon={<CalendarOutlined />}
          style={{ marginTop: 16 }}
          action={
            <Button size="small" onClick={() => setActiveTab('calendar')}>View All</Button>
          }
        />
      )}

      {/* Authority Cards */}
      <Card title={<><GlobalOutlined /> Regulatory Authorities</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small" style={{ borderLeft: '4px solid #1890ff' }}>
              <Space>
                <Avatar style={{ background: '#1890ff' }}>🇿🇦</Avatar>
                <div>
                  <Text strong>SARS</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{filings.filter(f => f.authority === 'SARS').length} filings</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
              <Space>
                <Avatar style={{ background: '#52c41a' }}>🏛️</Avatar>
                <div>
                  <Text strong>CIPC</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{filings.filter(f => f.authority === 'CIPC').length} filings</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderLeft: '4px solid #722ed1' }}>
              <Space>
                <Avatar style={{ background: '#722ed1' }}>⚖️</Avatar>
                <div>
                  <Text strong>Labour</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{filings.filter(f => f.authority === 'Department of Labour').length} filings</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderLeft: '4px solid #fa8c16' }}>
              <Space>
                <Avatar style={{ background: '#fa8c16' }}>🏆</Avatar>
                <div>
                  <Text strong>B-BBEE</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Level 3 Certified</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Filings Tab
  const renderFilings = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><FileTextOutlined /> Regulatory Filings</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Authorities</Option>
              <Option value="sars">SARS</Option>
              <Option value="cipc">CIPC</Option>
              <Option value="labour">Labour</Option>
              <Option value="bbbee">B-BBEE</Option>
            </Select>
            <Button icon={<FilterOutlined />}>Filter</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFilingModalVisible(true)}>
              New Filing
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filings}
          rowKey="id"
          columns={[
            {
              title: 'Filing',
              key: 'filing',
              render: (_, record) => (
                <Space>
                  <Avatar style={{ 
                    background: record.authority === 'SARS' ? '#1890ff' : 
                      record.authority === 'CIPC' ? '#52c41a' : 
                      record.authority === 'B-BBEE Commission' ? '#fa8c16' : '#722ed1' 
                  }} icon={<FileTextOutlined />} />
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.id} • {record.period}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Authority',
              dataIndex: 'authority',
              key: 'authority',
              render: (authority: string) => <Tag>{authority}</Tag>
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type'
            },
            {
              title: 'Due Date',
              dataIndex: 'dueDate',
              key: 'dueDate',
              render: (date: string) => <Tag icon={<CalendarOutlined />}>{date}</Tag>
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={
                  status === 'submitted' ? 'green' : 
                  status === 'overdue' ? 'red' : 
                  status === 'pending' ? 'orange' : 
                  status === 'draft' ? 'blue' : 'default'
                }>
                  {status === 'submitted' ? <CheckCircleOutlined /> : 
                   status === 'overdue' ? <WarningOutlined /> : 
                   <ClockCircleOutlined />} {status.toUpperCase()}
                </Tag>
              )
            },
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount?: number) => amount ? `R ${amount.toLocaleString()}` : '-'
            },
            {
              title: 'Reference',
              dataIndex: 'reference',
              key: 'reference',
              render: (ref?: string) => ref ? <Text code>{ref}</Text> : '-'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  {record.status === 'submitted' ? (
                    <Button size="small" icon={<FileSearchOutlined />}>View</Button>
                  ) : (
                    <Button size="small" type="primary" icon={<SendOutlined />}>Submit</Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Requirements Tab
  const renderRequirements = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><CheckSquareOutlined /> Compliance Requirements</>}
        extra={
          <Space>
            <Badge status="success" text="Compliant" />
            <Badge status="warning" text="Attention" />
            <Badge status="error" text="Non-Compliant" />
          </Space>
        }
      >
        <List
          dataSource={requirements}
          renderItem={req => (
            <List.Item
              actions={[
                req.lastFiled && <Text type="secondary">Last filed: {req.lastFiled}</Text>,
                <Button size="small">View Details</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ 
                    background: req.status === 'compliant' ? '#52c41a' : 
                      req.status === 'attention' ? '#faad14' : '#ff4d4f' 
                  }}>
                    {req.status === 'compliant' ? <CheckCircleOutlined /> : <WarningOutlined />}
                  </Avatar>
                }
                title={
                  <Space>
                    <Text strong>{req.name}</Text>
                    <Tag>{req.authority}</Tag>
                    <Tag color={req.status === 'compliant' ? 'green' : req.status === 'attention' ? 'orange' : 'red'}>
                      {req.status.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{req.description}</Text>
                    <br />
                    <Text type="secondary">Frequency: {req.frequency} {req.nextDue !== '-' && `• Next due: ${req.nextDue}`}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  // Calendar Tab
  const renderCalendar = () => {
    const dateCellRender = (value: Dayjs) => {
      const dateStr = value.format('YYYY-MM-DD');
      const deadline = upcomingDeadlines.find(d => d.date === dateStr);
      if (deadline) {
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {deadline.filings.map((filing, idx) => (
              <li key={idx}>
                <Badge status="warning" text={<Text style={{ fontSize: 10 }}>{filing.name}</Text>} />
              </li>
            ))}
          </ul>
        );
      }
      return null;
    };

    return (
      <div style={{ padding: '24px' }}>
        <Card title={<><CalendarOutlined /> Compliance Calendar</>}>
          <Calendar cellRender={dateCellRender} />
        </Card>
      </div>
    );
  };

  // History Tab
  const renderHistory = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><ScheduleOutlined /> Filing History</>}>
        <Timeline
          items={filings.filter(f => f.status === 'submitted').map(filing => ({
            color: 'green',
            children: (
              <div>
                <Text strong>{filing.name}</Text>
                <br />
                <Text type="secondary">{filing.authority} • {filing.period}</Text>
                <br />
                <Text type="secondary">Submitted: {filing.submittedDate} {filing.reference && `• Ref: ${filing.reference}`}</Text>
              </div>
            )
          }))}
        />
      </Card>
    </div>
  );

  // Settings Tab
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><SettingOutlined /> Regulatory Settings</>}>
        <Form layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Company Registration Number">
                <Input defaultValue="2020/123456/07" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="VAT Number">
                <Input defaultValue="4123456789" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Income Tax Number">
                <Input defaultValue="9123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="PAYE Reference">
                <Input defaultValue="7123456789" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="UIF Reference">
                <Input defaultValue="U123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="SDL Reference">
                <Input defaultValue="L123456789" />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Title level={5}>Notifications</Title>
          <Form.Item label="Deadline Reminders">
            <Switch defaultChecked /> <Text type="secondary">Email reminders before deadlines</Text>
          </Form.Item>
          <Form.Item label="Reminder Days">
            <Select defaultValue="7" style={{ width: 200 }}>
              <Option value="3">3 days before</Option>
              <Option value="7">7 days before</Option>
              <Option value="14">14 days before</Option>
              <Option value="30">30 days before</Option>
            </Select>
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
        title="Regulatory Reporting"
        subtitle="South African regulatory compliance and filing management"
        icon={<SafetyCertificateOutlined />}
        gradient="green"
        actions={
          <Space>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFilingModalVisible(true)}>
              New Filing
            </Button>
          </Space>
        }
      />

      <StatusBanner
        gradient="green"
        icon={<SafetyCertificateOutlined />}
        title="Regulatory Compliance"
        subtitle="SARS, CIPC, Labour, B-BBEE"
        stats={[
          { title: 'Compliance Rate', value: `${complianceRate}%` },
          { title: 'Submitted', value: submittedFilings },
          { title: 'Pending', value: pendingFilings },
          { title: 'Overdue', value: overdueFilings },
          { title: 'Next Deadline', value: upcomingDeadlines[0]?.date || '-' }
        ]}
      />

      <HubTabs
        theme="green"
        activeKey={activeTab}
        tabs={[
          { key: 'overview', label: 'Overview', icon: <HomeOutlined />, children: renderOverview() },
          { key: 'filings', label: 'Filings', icon: <FileTextOutlined />, children: renderFilings() },
          { key: 'requirements', label: 'Requirements', icon: <CheckSquareOutlined />, children: renderRequirements() },
          { key: 'calendar', label: 'Calendar', icon: <CalendarOutlined />, children: renderCalendar() },
          { key: 'history', label: 'History', icon: <ScheduleOutlined />, children: renderHistory() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        onChange={setActiveTab}
      />

      {/* New Filing Modal */}
      <Modal
        title={<><FileTextOutlined /> New Regulatory Filing</>}
        open={filingModalVisible}
        onCancel={() => setFilingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFilingModalVisible(false)}>Cancel</Button>,
          <Button key="draft" icon={<FileDoneOutlined />}>Save Draft</Button>,
          <Button key="submit" type="primary" icon={<SendOutlined />} onClick={() => { message.success('Filing submitted!'); setFilingModalVisible(false); }}>
            Submit
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Filing Type" name="filingType" rules={[{ required: true }]}>
            <Select placeholder="Select filing type">
              <Option value="vat201">VAT201 Return</Option>
              <Option value="emp201">EMP201 Monthly</Option>
              <Option value="emp501">EMP501 Reconciliation</Option>
              <Option value="it14">IT14 Company Tax</Option>
              <Option value="cipc">CIPC Annual Return</Option>
              <Option value="uif">UIF Declaration</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Period" name="period" rules={[{ required: true }]}>
            <DatePicker.MonthPicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Amount (if applicable)" name="amount">
            <Input prefix="R" type="number" />
          </Form.Item>
          <Form.Item label="Attachments">
            <Upload>
              <Button>Upload Supporting Documents</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default RegulatoryHub;
