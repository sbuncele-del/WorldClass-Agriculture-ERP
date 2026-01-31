/**
 * CommunicationsHub - Unified Communications Management
 * 
 * Features:
 * - Internal Messaging & Chat
 * - Email Integration & Campaigns
 * - SMS & WhatsApp Notifications
 * - Company Announcements
 * - Document Sharing
 * - Notification Center
 * - Message Templates
 * - Contact Management
 * - Communication Analytics
 * - PoPI Act Compliance
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, TimePicker, Modal, Form, Typography, Avatar,
  Timeline, Descriptions, Tooltip, Dropdown, InputNumber, Switch, Alert,
  List, Tabs, Divider, Steps, Upload, message, Checkbox, Empty, Spin
} from 'antd';
import {
  HomeOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, BarChartOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, FlagOutlined, SendOutlined,
  UserOutlined, BellOutlined, ThunderboltOutlined, MailOutlined,
  SafetyCertificateOutlined, AuditOutlined, BankOutlined, RocketOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, MessageOutlined,
  FileDoneOutlined, TrophyOutlined, PieChartOutlined, LineChartOutlined,
  FileTextOutlined, SolutionOutlined, ProfileOutlined, ScheduleOutlined,
  MobileOutlined, WhatsAppOutlined, NotificationOutlined, SoundOutlined,
  InboxOutlined, StarOutlined, StarFilled, PaperClipOutlined, SmileOutlined,
  PhoneOutlined, GlobalOutlined, LockOutlined, ContactsOutlined,
  CopyOutlined, VideoCameraOutlined, LinkOutlined, AudioOutlined,
  DesktopOutlined, UsergroupAddOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../../components/hub';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Interfaces
interface Message {
  id: string;
  type: 'email' | 'sms' | 'whatsapp' | 'internal' | 'announcement';
  subject?: string;
  content: string;
  from: string;
  to: string[];
  cc?: string[];
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: string;
  attachments?: string[];
  isStarred?: boolean;
  isRead?: boolean;
  thread?: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'customer' | 'supplier' | 'employee' | 'lead' | 'other';
  groups: string[];
  optInEmail: boolean;
  optInSMS: boolean;
  optInWhatsApp: boolean;
  lastContact?: string;
}

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  category: string;
  subject?: string;
  content: string;
  variables: string[];
  usageCount: number;
  lastUsed?: string;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  scheduledDate?: string;
  completedDate?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  department: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'draft' | 'published' | 'archived';
  publishDate: string;
  expiryDate?: string;
  viewCount: number;
  targetAudience: string[];
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  host: string;
  participants: string[];
  externalGuests: string[];
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  type: 'video' | 'audio' | 'webinar';
  meetingLink: string;
  passcode?: string;
  recording?: boolean;
  recordingUrl?: string;
}

interface Notification {
  id: string;
  type: 'system' | 'message' | 'meeting' | 'task' | 'approval' | 'alert';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  sender?: string;
}

const CommunicationsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [form] = Form.useForm();

  // Fetch all communication data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [messagesRes, contactsRes, templatesRes, campaignsRes, announcementsRes, meetingsRes, notificationsRes] = await Promise.all([
          apiClient.get('/api/v2/communications/messages').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/contacts').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/templates').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/campaigns').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/announcements').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/meetings').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/notifications').catch(() => ({ data: { data: [] } }))
        ]);
        // V2 API returns { success: true, data: [...] }
        setMessages(Array.isArray(messagesRes.data?.data) ? messagesRes.data.data : messagesRes.data?.messages || []);
        setContacts(Array.isArray(contactsRes.data?.data) ? contactsRes.data.data : contactsRes.data?.contacts || []);
        setTemplates(Array.isArray(templatesRes.data?.data) ? templatesRes.data.data : templatesRes.data?.templates || []);
        setCampaigns(Array.isArray(campaignsRes.data?.data) ? campaignsRes.data.data : campaignsRes.data?.campaigns || []);
        setAnnouncements(Array.isArray(announcementsRes.data?.data) ? announcementsRes.data.data : announcementsRes.data?.announcements || []);
        setMeetings(Array.isArray(meetingsRes.data?.data) ? meetingsRes.data.data : meetingsRes.data?.meetings || []);
        setNotifications(Array.isArray(notificationsRes.data?.data) ? notificationsRes.data.data : notificationsRes.data?.notifications || []);
      } catch (error) {
        console.error('Failed to fetch communications data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Daily.co Meeting API Integration
  const createInstantMeeting = useCallback(async () => {
    setMeetingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/meetings/instant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }
      
      const data = await response.json();
      
      if (data.success && data.meeting) {
        // Add the new meeting to the list
        const newMeeting: Meeting = {
          id: data.meeting.id,
          title: 'Instant Meeting',
          description: 'Quick video meeting',
          host: 'You',
          participants: [],
          externalGuests: [],
          scheduledStart: new Date().toISOString(),
          scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'live',
          type: 'video',
          meetingLink: data.meeting.hostUrl
        };
        
        setMeetings(prev => [newMeeting, ...prev]);
        message.success('Meeting created! Opening video call...');
        
        // Open the meeting in a new tab
        window.open(data.meeting.hostUrl, '_blank');
        
        // Show meeting link for sharing
        Modal.info({
          title: 'Meeting Created',
          content: (
            <div>
              <p>Your meeting is ready! Share this link with participants:</p>
              <Input.TextArea 
                value={data.meeting.guestUrl} 
                readOnly 
                autoSize 
                style={{ marginBottom: 16 }}
              />
              <Button 
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(data.meeting.guestUrl);
                  message.success('Link copied!');
                }}
              >
                Copy Link
              </Button>
            </div>
          ),
          okText: 'Close'
        });
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      message.error('Failed to create meeting. Please try again.');
    } finally {
      setMeetingLoading(false);
    }
  }, []);

  // Schedule a meeting via API
  const scheduleMeeting = useCallback(async (values: any) => {
    setMeetingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: values.title,
          startTime: values.startTime.toISOString(),
          durationMinutes: values.duration || 60,
          maxParticipants: values.maxParticipants || 10,
          enableWaitingRoom: values.enableWaitingRoom || false
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule meeting');
      }
      
      const data = await response.json();
      
      if (data.success && data.meeting) {
        const newMeeting: Meeting = {
          id: data.meeting.id,
          title: data.meeting.title,
          description: values.description,
          host: 'You',
          participants: values.participants || [],
          externalGuests: values.externalGuests || [],
          scheduledStart: data.meeting.startTime,
          scheduledEnd: data.meeting.endTime,
          status: 'scheduled',
          type: 'video',
          meetingLink: data.meeting.hostUrl
        };
        
        setMeetings(prev => [newMeeting, ...prev]);
        message.success('Meeting scheduled successfully!');
        setMeetingModalVisible(false);
        form.resetFields();
        
        // Offer to copy the invite link
        Modal.confirm({
          title: 'Meeting Scheduled',
          content: `Copy the meeting link to share with participants?`,
          okText: 'Copy Link',
          cancelText: 'Later',
          onOk: () => {
            navigator.clipboard.writeText(data.meeting.guestUrl);
            message.success('Meeting link copied to clipboard!');
          }
        });
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      message.error('Failed to schedule meeting. Please try again.');
    } finally {
      setMeetingLoading(false);
    }
  }, [form]);

  const handleTemplateAction = (actionKey: string, template: Template) => {
    switch (actionKey) {
      case 'use':
        message.success(`Template '${template.name}' selected for compose.`);
        setComposeModalVisible(true);
        break;
      case 'edit':
        message.info(`Edit template '${template.name}' (hook to backend).`);
        break;
      case 'duplicate':
        message.success(`Duplicated '${template.name}' (simulate backend).`);
        break;
      case 'delete':
        message.warning(`Delete '${template.name}' (connect API when ready).`);
        break;
      default:
        break;
    }
  };

  // Calculate stats - with defensive null checks
  const commsStats = {
    totalMessages: (messages || []).length,
    unreadMessages: (messages || []).filter(m => m && !m.isRead).length,
    sentToday: (messages || []).filter(m => m?.timestamp?.includes('2024-06-15')).length,
    totalContacts: (contacts || []).length,
    emailsSent: (messages || []).filter(m => m?.type === 'email').length,
    smsSent: (messages || []).filter(m => m?.type === 'sms').length,
    whatsappSent: (messages || []).filter(m => m?.type === 'whatsapp').length,
    activeCampaigns: (campaigns || []).filter(c => c?.status === 'running').length,
    templateCount: (templates || []).length
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <MailOutlined style={{ color: '#1890ff' }} />;
      case 'sms': return <MobileOutlined style={{ color: '#52c41a' }} />;
      case 'whatsapp': return <WhatsAppOutlined style={{ color: '#25D366' }} />;
      case 'internal': return <MessageOutlined style={{ color: '#722ed1' }} />;
      case 'announcement': return <SoundOutlined style={{ color: '#fa8c16' }} />;
      default: return <MailOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'default', sent: 'blue', delivered: 'cyan', read: 'green',
      failed: 'red', scheduled: 'orange', running: 'processing',
      completed: 'success', paused: 'warning', published: 'green', archived: 'default'
    };
    return colors[status] || 'default';
  };

  // Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Unread Messages"
              value={commsStats.unreadMessages}
              prefix={<Badge count={commsStats.unreadMessages} style={{ marginRight: 8 }}><InboxOutlined /></Badge>}
              valueStyle={{ color: commsStats.unreadMessages > 0 ? '#ff4d4f' : '#52c41a' }}
            />
            <Text type="secondary">{commsStats.totalMessages} total messages</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sent Today"
              value={commsStats.sentToday}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Space>
              <Tag color="blue">{commsStats.emailsSent} emails</Tag>
              <Tag color="green">{commsStats.smsSent} SMS</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={commsStats.activeCampaigns}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary">{campaigns.length} total campaigns</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Contacts"
              value={commsStats.totalContacts}
              prefix={<ContactsOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">{(contacts || []).filter(c => c?.optInEmail).length} email opted-in</Text>
          </Card>
        </Col>
      </Row>

      {/* PoPI Compliance Alert */}
      <Alert
        message="PoPI Act Compliance"
        description={
          <Space wrap>
            <Tag color="green">Consent Management: Active</Tag>
            <Tag color="green">Opt-out Links: Enabled</Tag>
            <Tag color="blue">Data Retention: 5 Years</Tag>
            <Tag color="cyan">Audit Trail: Enabled</Tag>
          </Space>
        }
        type="success"
        showIcon
        icon={<LockOutlined />}
        style={{ marginTop: 16, marginBottom: 16 }}
      />

      {/* Recent Activity & Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title={<><InboxOutlined /> Recent Messages</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setComposeModalVisible(true)}>Compose</Button>}
          >
            <List
              dataSource={(messages || []).slice(0, 5)}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button size="small" icon={item.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} />,
                    <Button size="small" icon={<EyeOutlined />} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={getTypeIcon(item.type)} />}
                    title={
                      <Space>
                        <Text strong={!item.isRead}>{item.subject || item.content.substring(0, 50)}</Text>
                        {!item.isRead && <Badge status="processing" />}
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{item.from}</Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">{item.timestamp}</Text>
                        <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<><SoundOutlined /> Announcements</>}>
            <List
              size="small"
              dataSource={(announcements || []).filter(a => a?.status === 'published').slice(0, 4)}
              renderItem={item => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{item.title}</Text>
                      <Tag color={item.priority === 'high' ? 'red' : item.priority === 'critical' ? 'magenta' : 'blue'}>
                        {item.priority}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.department} • {item.publishDate}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}><EyeOutlined /> {item.viewCount} views</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Campaign Performance */}
      <Card title={<><BarChartOutlined /> Campaign Performance</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {campaigns.slice(0, 4).map(campaign => (
            <Col span={6} key={campaign.id}>
              <Card size="small">
                <div style={{ marginBottom: 8 }}>
                  <Space>
                    {campaign.type === 'email' ? <MailOutlined /> : campaign.type === 'sms' ? <MobileOutlined /> : <WhatsAppOutlined />}
                    <Text strong>{campaign.name}</Text>
                  </Space>
                </div>
                <Tag color={getStatusColor(campaign.status)}>{campaign.status}</Tag>
                <Divider style={{ margin: '8px 0' }} />
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic title="Sent" value={campaign.sent} valueStyle={{ fontSize: 14 }} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="Delivered" value={campaign.delivered} valueStyle={{ fontSize: 14, color: '#52c41a' }} />
                  </Col>
                </Row>
                {campaign.type === 'email' && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Open Rate: {campaign.sent > 0 ? ((campaign.opened / campaign.delivered) * 100).toFixed(1) : 0}%
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );

  // Inbox/Messages
  const renderInbox = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col span={4}>
          <Card size="small">
            <Button type="primary" block icon={<PlusOutlined />} onClick={() => setComposeModalVisible(true)} style={{ marginBottom: 16 }}>
              Compose
            </Button>
            <List
              size="small"
              dataSource={[
                { key: 'inbox', icon: <InboxOutlined />, label: 'Inbox', count: commsStats.unreadMessages },
                { key: 'starred', icon: <StarOutlined />, label: 'Starred', count: (messages || []).filter(m => m?.isStarred).length },
                { key: 'sent', icon: <SendOutlined />, label: 'Sent', count: 0 },
                { key: 'drafts', icon: <FileTextOutlined />, label: 'Drafts', count: (messages || []).filter(m => m?.status === 'draft').length },
                { key: 'scheduled', icon: <ClockCircleOutlined />, label: 'Scheduled', count: (messages || []).filter(m => m?.status === 'scheduled').length }
              ]}
              renderItem={item => (
                <List.Item 
                  style={{ 
                    cursor: 'pointer', 
                    backgroundColor: selectedFolder === item.key ? '#e6f7ff' : undefined,
                    padding: '8px',
                    borderRadius: 4
                  }}
                  onClick={() => setSelectedFolder(item.key)}
                >
                  <Space>
                    {item.icon}
                    <Text>{item.label}</Text>
                  </Space>
                  {item.count > 0 && <Badge count={item.count} style={{ backgroundColor: item.key === 'inbox' ? '#ff4d4f' : '#1890ff' }} />}
                </List.Item>
              )}
            />
            <Divider />
            <Text type="secondary" style={{ fontSize: 12 }}>Channels</Text>
            <List
              size="small"
              dataSource={[
                { key: 'email', icon: <MailOutlined style={{ color: '#1890ff' }} />, label: 'Email' },
                { key: 'sms', icon: <MobileOutlined style={{ color: '#52c41a' }} />, label: 'SMS' },
                { key: 'whatsapp', icon: <WhatsAppOutlined style={{ color: '#25D366' }} />, label: 'WhatsApp' },
                { key: 'internal', icon: <MessageOutlined style={{ color: '#722ed1' }} />, label: 'Internal' }
              ]}
              renderItem={item => (
                <List.Item style={{ cursor: 'pointer', padding: '8px' }}>
                  <Space>
                    {item.icon}
                    <Text>{item.label}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={20}>
          <Card
            title={`${selectedFolder.charAt(0).toUpperCase() + selectedFolder.slice(1)} (${messages.length})`}
            extra={
              <Space>
                <Input placeholder="Search messages..." prefix={<SearchOutlined />} style={{ width: 250 }} />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Types</Option>
                  <Option value="email">Email</Option>
                  <Option value="sms">SMS</Option>
                  <Option value="whatsapp">WhatsApp</Option>
                </Select>
              </Space>
            }
          >
            <Table
              dataSource={messages || []}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: '',
                  key: 'star',
                  width: 40,
                  render: (_, record) => (
                    <Button 
                      type="text" 
                      size="small" 
                      icon={record.isStarred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
                    />
                  )
                },
                {
                  title: 'Type',
                  key: 'type',
                  width: 60,
                  render: (_, record) => getTypeIcon(record.type)
                },
                {
                  title: 'From',
                  dataIndex: 'from',
                  key: 'from',
                  width: 200,
                  render: (from: string, record) => (
                    <Text strong={!record.isRead}>{from}</Text>
                  )
                },
                {
                  title: 'Subject / Content',
                  key: 'subject',
                  render: (_, record) => (
                    <div>
                      <Text strong={!record.isRead}>{record.subject || record.content.substring(0, 60)}...</Text>
                      {record.attachments && record.attachments.length > 0 && (
                        <PaperClipOutlined style={{ marginLeft: 8, color: '#8c8c8c' }} />
                      )}
                    </div>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
                },
                {
                  title: 'Time',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  width: 140
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  width: 100,
                  render: () => (
                    <Space>
                      <Button size="small" icon={<EyeOutlined />} />
                      <Button size="small" icon={<DeleteOutlined />} danger />
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Contacts
  const renderContacts = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><ContactsOutlined /> Contact Management</>}
        extra={
          <Space>
            <Input placeholder="Search contacts..." prefix={<SearchOutlined />} style={{ width: 250 }} />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Types</Option>
              <Option value="customer">Customers</Option>
              <Option value="supplier">Suppliers</Option>
              <Option value="employee">Employees</Option>
              <Option value="lead">Leads</Option>
            </Select>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Contact</Button>
          </Space>
        }
      >
        <Table
          dataSource={contacts || []}
          rowKey="id"
          columns={[
            {
              title: 'Contact',
              key: 'contact',
              render: (_, record) => (
                <Space>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.type === 'customer' ? '#1890ff' : record.type === 'supplier' ? '#52c41a' : record.type === 'employee' ? '#722ed1' : '#fa8c16' }} />
                  <div>
                    <Text strong>{record.name}</Text>
                    {record.company && <><br /><Text type="secondary" style={{ fontSize: 11 }}>{record.company}</Text></>}
                  </div>
                </Space>
              )
            },
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
              render: (email: string) => <a href={`mailto:${email}`}>{email}</a>
            },
            {
              title: 'Phone',
              dataIndex: 'phone',
              key: 'phone',
              render: (phone: string) => <a href={`tel:${phone}`}>{phone}</a>
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => {
                const colors: Record<string, string> = { customer: 'blue', supplier: 'green', employee: 'purple', lead: 'orange', other: 'default' };
                return <Tag color={colors[type]}>{type}</Tag>;
              }
            },
            {
              title: 'Groups',
              dataIndex: 'groups',
              key: 'groups',
              render: (groups: string[]) => groups.map(g => <Tag key={g}>{g}</Tag>)
            },
            {
              title: 'Opt-In',
              key: 'optIn',
              render: (_, record) => (
                <Space>
                  <Tooltip title="Email"><Tag color={record.optInEmail ? 'green' : 'default'}><MailOutlined /></Tag></Tooltip>
                  <Tooltip title="SMS"><Tag color={record.optInSMS ? 'green' : 'default'}><MobileOutlined /></Tag></Tooltip>
                  <Tooltip title="WhatsApp"><Tag color={record.optInWhatsApp ? 'green' : 'default'}><WhatsAppOutlined /></Tag></Tooltip>
                </Space>
              )
            },
            {
              title: 'Last Contact',
              dataIndex: 'lastContact',
              key: 'lastContact'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Dropdown
                  menu={{
                    items: [
                      { key: 'email', label: 'Send Email', icon: <MailOutlined /> },
                      { key: 'sms', label: 'Send SMS', icon: <MobileOutlined /> },
                      { key: 'whatsapp', label: 'Send WhatsApp', icon: <WhatsAppOutlined /> },
                      { type: 'divider' },
                      { key: 'edit', label: 'Edit Contact', icon: <EditOutlined /> },
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
      </Card>
    </div>
  );

  // Templates
  const renderTemplates = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><FileTextOutlined /> Message Templates</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Types</Option>
              <Option value="email">Email</Option>
              <Option value="sms">SMS</Option>
              <Option value="whatsapp">WhatsApp</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTemplateModalVisible(true)}>
              Create Template
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {templates.map(template => (
            <Col xs={24} sm={12} lg={8} key={template.id}>
              <Card
                size="small"
                title={
                  <Space>
                    {template.type === 'email' ? <MailOutlined style={{ color: '#1890ff' }} /> : 
                     template.type === 'sms' ? <MobileOutlined style={{ color: '#52c41a' }} /> : 
                     <WhatsAppOutlined style={{ color: '#25D366' }} />}
                    <Text strong>{template.name}</Text>
                  </Space>
                }
                extra={
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'use', label: 'Use Template', icon: <SendOutlined /> },
                        { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
                        { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
                        { type: 'divider' },
                        { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true }
                      ],
                      onClick: ({ key }) => handleTemplateAction(key, template)
                    }}
                  >
                    <Button size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                }
              >
                <Tag color="blue">{template.category}</Tag>
                <Tag>{template.type}</Tag>
                {template.subject && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Subject:</Text>
                    <br />
                    <Text ellipsis style={{ fontSize: 12 }}>{template.subject}</Text>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>Content Preview:</Text>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginBottom: 8 }}>
                    {template.content}
                  </Paragraph>
                </div>
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <ThunderboltOutlined /> Used {template.usageCount} times
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Variables: {template.variables.length}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );

  // Campaigns
  const renderCampaigns = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><RocketOutlined /> Campaign Management</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Status</Option>
              <Option value="draft">Draft</Option>
              <Option value="scheduled">Scheduled</Option>
              <Option value="running">Running</Option>
              <Option value="completed">Completed</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCampaignModalVisible(true)}>
              Create Campaign
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={campaigns || []}
          rowKey="id"
          columns={[
            {
              title: 'Campaign',
              key: 'campaign',
              render: (_, record) => (
                <Space>
                  {record.type === 'email' ? <MailOutlined style={{ color: '#1890ff' }} /> : 
                   record.type === 'sms' ? <MobileOutlined style={{ color: '#52c41a' }} /> : 
                   <WhatsAppOutlined style={{ color: '#25D366' }} />}
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Tag>{record.type}</Tag>
                  </div>
                </Space>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
            },
            {
              title: 'Recipients',
              dataIndex: 'recipients',
              key: 'recipients',
              render: (count: number) => count.toLocaleString()
            },
            {
              title: 'Sent',
              dataIndex: 'sent',
              key: 'sent',
              render: (sent: number, record) => (
                <div>
                  <Text>{sent.toLocaleString()}</Text>
                  {record.recipients > 0 && (
                    <Progress 
                      percent={Math.round((sent / record.recipients) * 100)} 
                      size="small" 
                      showInfo={false}
                      style={{ width: 60 }}
                    />
                  )}
                </div>
              )
            },
            {
              title: 'Delivered',
              dataIndex: 'delivered',
              key: 'delivered',
              render: (delivered: number) => <Text type="success">{delivered.toLocaleString()}</Text>
            },
            {
              title: 'Opened',
              key: 'opened',
              render: (_, record) => record.type === 'email' ? (
                <div>
                  <Text>{record.opened.toLocaleString()}</Text>
                  {record.delivered > 0 && (
                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                      ({((record.opened / record.delivered) * 100).toFixed(1)}%)
                    </Text>
                  )}
                </div>
              ) : <Text type="secondary">N/A</Text>
            },
            {
              title: 'Clicked',
              key: 'clicked',
              render: (_, record) => record.type === 'email' ? (
                <Text>{record.clicked.toLocaleString()}</Text>
              ) : <Text type="secondary">N/A</Text>
            },
            {
              title: 'Schedule',
              key: 'schedule',
              render: (_, record) => record.scheduledDate ? (
                <Tag icon={<ClockCircleOutlined />} color="orange">{record.scheduledDate}</Tag>
              ) : record.completedDate ? (
                <Tag icon={<CheckCircleOutlined />} color="green">{record.completedDate}</Tag>
              ) : '-'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />} />
                  {record.status === 'draft' && <Button size="small" type="primary">Launch</Button>}
                  {record.status === 'running' && <Button size="small">Pause</Button>}
                  {record.status === 'scheduled' && <Button size="small">Edit</Button>}
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Announcements
  const renderAnnouncements = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><SoundOutlined /> Company Announcements</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Status</Option>
              <Option value="published">Published</Option>
              <Option value="draft">Draft</Option>
              <Option value="archived">Archived</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAnnouncementModalVisible(true)}>
              New Announcement
            </Button>
          </Space>
        }
      >
        <List
          dataSource={announcements || []}
          renderItem={item => (
            <List.Item
              actions={[
                <Button size="small" icon={<EyeOutlined />}>View</Button>,
                <Button size="small" icon={<EditOutlined />}>Edit</Button>,
                <Dropdown
                  menu={{
                    items: [
                      { key: 'archive', label: 'Archive', icon: <FlagOutlined /> },
                      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true }
                    ]
                  }}
                >
                  <Button size="small" icon={<MoreOutlined />} />
                </Dropdown>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<SoundOutlined />} 
                    style={{ 
                      backgroundColor: item.priority === 'critical' ? '#ff4d4f' : 
                                      item.priority === 'high' ? '#fa8c16' : '#1890ff' 
                    }} 
                  />
                }
                title={
                  <Space>
                    <Text strong>{item.title}</Text>
                    <Tag color={item.priority === 'critical' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}>
                      {item.priority}
                    </Tag>
                    <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>
                      {item.content}
                    </Paragraph>
                    <Space size="large">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <UserOutlined /> {item.author} ({item.department})
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <CalendarOutlined /> {item.publishDate}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <EyeOutlined /> {item.viewCount} views
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <TeamOutlined /> {item.targetAudience.join(', ')}
                      </Text>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  // Video Meetings
  const renderMeetings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Scheduled Meetings" value={(meetings || []).filter(m => m?.status === 'scheduled').length} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Live Now" value={(meetings || []).filter(m => m?.status === 'live').length} valueStyle={{ color: '#52c41a' }} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Total Participants Today" value={24} prefix={<UsergroupAddOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Recordings" value={(meetings || []).filter(m => m?.recordingUrl).length} prefix={<VideoCameraOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><VideoCameraOutlined /> Video Meetings & Conferences</>}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button
              icon={<LinkOutlined />}
              loading={meetingLoading}
              onClick={createInstantMeeting}
            >
              Quick Meeting
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setMeetingModalVisible(true)}>
              Schedule Meeting
            </Button>
          </Space>
        }
      >
        <Alert
          message="Video Conferencing Powered by Daily.co"
          description="Host HD video meetings with internal teams and external clients. Send meeting links via email, SMS, or WhatsApp. Clients join via browser - no software download needed."
          type="info"
          showIcon
          icon={<VideoCameraOutlined />}
          style={{ marginBottom: 16 }}
        />

        <Table
          dataSource={meetings || []}
          rowKey="id"
          columns={[
            {
              title: 'Meeting',
              key: 'meeting',
              render: (_, record) => (
                <div>
                  <Text strong>{record.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
                </div>
              )
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color={type === 'video' ? 'blue' : type === 'webinar' ? 'purple' : 'cyan'}>
                  {type === 'video' ? <VideoCameraOutlined /> : type === 'webinar' ? <DesktopOutlined /> : <AudioOutlined />} {type.toUpperCase()}
                </Tag>
              )
            },
            {
              title: 'Host',
              dataIndex: 'host',
              key: 'host',
              render: (host: string) => (
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {host}
                </Space>
              )
            },
            {
              title: 'Participants',
              key: 'participants',
              render: (_, record) => (
                <div>
                  <Text>{record.participants.length} internal</Text>
                  {record.externalGuests.length > 0 && (
                    <><br /><Text type="secondary" style={{ fontSize: 12 }}>{record.externalGuests.length} external guests</Text></>
                  )}
                </div>
              )
            },
            {
              title: 'Schedule',
              key: 'schedule',
              render: (_, record) => (
                <div>
                  <Tag icon={<CalendarOutlined />}>{record.scheduledStart.split(' ')[0]}</Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{record.scheduledStart.split(' ')[1]} - {record.scheduledEnd.split(' ')[1]}</Text>
                </div>
              )
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={status === 'live' ? 'green' : status === 'scheduled' ? 'blue' : status === 'ended' ? 'default' : 'red'}>
                  {status === 'live' && <Badge status="processing" />} {status.toUpperCase()}
                </Tag>
              )
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  {record.status === 'scheduled' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<VideoCameraOutlined />}
                      onClick={() => {
                        setMeetings(prev => prev.map(m => m.id === record.id ? { ...m, status: 'live' } : m));
                        message.success('Meeting started');
                        window.open(record.meetingLink, '_blank');
                      }}
                    >
                      Start
                    </Button>
                  )}
                  {record.status === 'live' && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      style={{ background: '#52c41a' }}
                      onClick={() => window.open(record.meetingLink, '_blank')}
                    >
                      Join
                    </Button>
                  )}
                  <Tooltip title="Copy Meeting Link">
                    <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(record.meetingLink); message.success('Meeting link copied!'); }} />
                  </Tooltip>
                  <Tooltip title="Send Invite">
                    <Button size="small" icon={<SendOutlined />} onClick={() => message.info('Send invite via Email/SMS/WhatsApp')} />
                  </Tooltip>
                  {record.recordingUrl && (
                    <Tooltip title="View Recording">
                      <Button size="small" icon={<PlayCircleOutlined />} />
                    </Tooltip>
                  )}
                </Space>
              )
            }
          ]}
        />

        {/* Quick Actions */}
        <Divider />
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" hoverable onClick={createInstantMeeting} style={{ cursor: meetingLoading ? 'wait' : 'pointer' }}>
              <Space>
                <Avatar style={{ background: '#1890ff' }} icon={meetingLoading ? <Spin size="small" /> : <VideoCameraOutlined />} />
                <div>
                  <Text strong>Start Instant Call</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Start a video meeting now</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" hoverable onClick={() => setMeetingModalVisible(true)}>
              <Space>
                <Avatar style={{ background: '#722ed1' }} icon={<CalendarOutlined />} />
                <div>
                  <Text strong>Schedule Meeting</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Plan a meeting for later</Text>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" hoverable onClick={() => message.info('Webinar feature coming soon')}>
              <Space>
                <Avatar style={{ background: '#52c41a' }} icon={<DesktopOutlined />} />
                <div>
                  <Text strong>Host Webinar</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>Present to large audiences</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Notifications
  const renderNotifications = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Unread" value={(notifications || []).filter(n => n && !n.isRead).length} valueStyle={{ color: '#ff4d4f' }} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="High Priority" value={(notifications || []).filter(n => n?.priority === 'high' || n?.priority === 'urgent').length} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Today" value={(notifications || []).filter(n => n?.timestamp?.includes('2024-06-15')).length} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Pending Actions" value={(notifications || []).filter(n => n?.actionUrl && !n?.isRead).length} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><BellOutlined /> Notification Center</>}
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}>
              Mark All Read
            </Button>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Types</Option>
              <Option value="message">Messages</Option>
              <Option value="meeting">Meetings</Option>
              <Option value="task">Tasks</Option>
              <Option value="approval">Approvals</Option>
              <Option value="system">System</Option>
              <Option value="alert">Alerts</Option>
            </Select>
          </Space>
        }
      >
        <List
          dataSource={notifications || []}
          renderItem={notification => (
            <List.Item
              style={{ 
                background: notification.isRead ? 'transparent' : '#f0f5ff',
                padding: '12px 16px',
                borderRadius: 8,
                marginBottom: 8
              }}
              actions={[
                <Button size="small" type="link" onClick={() => setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))}>
                  {notification.isRead ? 'Read' : 'Mark Read'}
                </Button>,
                notification.actionUrl && <Button size="small" type="primary">View</Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      background: notification.type === 'meeting' ? '#1890ff' :
                        notification.type === 'message' ? '#52c41a' :
                        notification.type === 'approval' ? '#faad14' :
                        notification.type === 'task' ? '#722ed1' :
                        notification.type === 'alert' ? '#ff4d4f' : '#666'
                    }}
                    icon={
                      notification.type === 'meeting' ? <VideoCameraOutlined /> :
                      notification.type === 'message' ? <MailOutlined /> :
                      notification.type === 'approval' ? <CheckCircleOutlined /> :
                      notification.type === 'task' ? <FileTextOutlined /> :
                      notification.type === 'alert' ? <WarningOutlined /> : <BellOutlined />
                    }
                  />
                }
                title={
                  <Space>
                    <Text strong={!notification.isRead}>{notification.title}</Text>
                    <Tag color={notification.priority === 'urgent' ? 'red' : notification.priority === 'high' ? 'orange' : notification.priority === 'normal' ? 'blue' : 'default'}>
                      {notification.priority}
                    </Tag>
                    {!notification.isRead && <Badge status="processing" />}
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">{notification.content}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}><ClockCircleOutlined /> {notification.timestamp}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Notification Settings Quick Access */}
      <Card title="Quick Settings" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Email Notifications">
              <Switch defaultChecked />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Push Notifications">
              <Switch defaultChecked />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="SMS Alerts">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Desktop Alerts">
              <Switch defaultChecked />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={<><MailOutlined /> Email Settings</>}>
            <Form layout="vertical">
              <Form.Item label="SMTP Server">
                <Input defaultValue="smtp.sendgrid.net" />
              </Form.Item>
              <Form.Item label="SMTP Port">
                <InputNumber defaultValue={587} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="From Email">
                <Input defaultValue="noreply@company.co.za" />
              </Form.Item>
              <Form.Item label="From Name">
                <Input defaultValue="WorldClass ERP" />
              </Form.Item>
              <Form.Item label="Email Signature">
                <TextArea rows={4} defaultValue="Kind Regards,\nThe WorldClass ERP Team\n\nThis email was sent from WorldClass ERP. Please do not reply directly." />
              </Form.Item>
              <Button type="primary">Save Email Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<><MobileOutlined /> SMS & WhatsApp Settings</>}>
            <Form layout="vertical">
              <Form.Item label="SMS Provider">
                <Select defaultValue="bulksms">
                  <Option value="bulksms">BulkSMS</Option>
                  <Option value="clickatell">Clickatell</Option>
                  <Option value="twilio">Twilio</Option>
                </Select>
              </Form.Item>
              <Form.Item label="SMS API Key">
                <Input.Password defaultValue="xxxxxxxxxx" />
              </Form.Item>
              <Form.Item label="WhatsApp Provider">
                <Select defaultValue="twilio">
                  <Option value="twilio">Twilio</Option>
                  <Option value="messagebird">MessageBird</Option>
                  <Option value="360dialog">360dialog</Option>
                </Select>
              </Form.Item>
              <Form.Item label="WhatsApp Business Number">
                <Input defaultValue="+27110001234" />
              </Form.Item>
              <Form.Item label="Daily SMS Limit">
                <InputNumber defaultValue={1000} style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary">Save SMS Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title={<><LockOutlined /> PoPI Act Compliance</>}>
            <Alert
              message="Protection of Personal Information Act (PoPI)"
              description="Ensure all communications comply with PoPI Act requirements. All marketing communications must include opt-out options and respect user preferences."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Require Double Opt-In">
                    <Switch defaultChecked />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Include Unsubscribe Link">
                    <Switch defaultChecked />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Log All Communications">
                    <Switch defaultChecked />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Data Retention Period">
                    <Select defaultValue="5">
                      <Option value="1">1 Year</Option>
                      <Option value="3">3 Years</Option>
                      <Option value="5">5 Years</Option>
                      <Option value="7">7 Years</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Consent Expiry">
                    <Select defaultValue="24">
                      <Option value="12">12 Months</Option>
                      <Option value="24">24 Months</Option>
                      <Option value="36">36 Months</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Privacy Policy URL">
                    <Input defaultValue="https://company.co.za/privacy" />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary">Save Compliance Settings</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Show loading spinner while data loads
  if (loading) {
    return (
      <HubLayout>
        <HubHeader
          title="Communications Hub"
          subtitle="Email, SMS, WhatsApp & Internal Messaging"
          icon={<MessageOutlined />}
          gradient="blue"
        />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" tip="Loading communications..." />
        </div>
      </HubLayout>
    );
  }

  return (
    <HubLayout>
      <HubHeader
        title="Communications Hub"
        subtitle="Email, SMS, WhatsApp & Internal Messaging"
        icon={<MessageOutlined />}
        gradient="blue"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setComposeModalVisible(true)}>
              Compose
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="blue"
        icon={<MessageOutlined />}
        title="Communications Overview"
        subtitle="Messages & Campaigns"
        stats={[
          { title: 'Unread', value: commsStats.unreadMessages, valueStyle: commsStats.unreadMessages > 0 ? { color: '#fca5a5' } : undefined, span: 4 },
          { title: 'Sent Today', value: commsStats.sentToday, span: 4 },
          { title: 'Contacts', value: commsStats.totalContacts, span: 4 },
          { title: 'Templates', value: commsStats.templateCount, span: 4 },
          { title: 'Active Campaigns', value: commsStats.activeCampaigns, valueStyle: { color: '#86efac' }, span: 4 },
        ]}
      />

      <HubTabs
        theme="blue"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'inbox', label: 'Inbox', icon: <InboxOutlined />, children: renderInbox() },
          { key: 'meetings', label: 'Meetings', icon: <VideoCameraOutlined />, children: renderMeetings() },
          { key: 'contacts', label: 'Contacts', icon: <ContactsOutlined />, children: renderContacts() },
          { key: 'templates', label: 'Templates', icon: <FileTextOutlined />, children: renderTemplates() },
          { key: 'campaigns', label: 'Campaigns', icon: <RocketOutlined />, children: renderCampaigns() },
          { key: 'announcements', label: 'Announcements', icon: <SoundOutlined />, children: renderAnnouncements() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Compose Modal */}
      <Modal
        title="Compose Message"
        open={composeModalVisible}
        onCancel={() => setComposeModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setComposeModalVisible(false)}>Cancel</Button>,
          <Button key="draft" icon={<FileTextOutlined />}>Save Draft</Button>,
          <Button key="schedule" icon={<ClockCircleOutlined />}>Schedule</Button>,
          <Button key="send" type="primary" icon={<SendOutlined />}>Send</Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Channel" name="channel">
            <Select defaultValue="email">
              <Option value="email"><MailOutlined /> Email</Option>
              <Option value="sms"><MobileOutlined /> SMS</Option>
              <Option value="whatsapp"><WhatsAppOutlined /> WhatsApp</Option>
              <Option value="internal"><MessageOutlined /> Internal</Option>
            </Select>
          </Form.Item>
          <Form.Item label="To" name="to">
            <Select mode="tags" placeholder="Enter recipients or select contacts">
              {contacts.map(c => <Option key={c.email} value={c.email}>{c.name} ({c.email})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Subject" name="subject">
            <Input placeholder="Enter subject" />
          </Form.Item>
          <Form.Item label="Template" name="template">
            <Select placeholder="Select a template (optional)">
              {templates.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Message" name="content">
            <TextArea rows={8} placeholder="Type your message here..." />
          </Form.Item>
          <Form.Item label="Attachments">
            <Upload>
              <Button icon={<PaperClipOutlined />}>Add Attachments</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Schedule Meeting Modal */}
      <Modal
        title={<><VideoCameraOutlined /> Schedule Video Meeting</>}
        open={meetingModalVisible}
        onCancel={() => setMeetingModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setMeetingModalVisible(false)}>Cancel</Button>,
          <Button key="instant" type="default" icon={<PlayCircleOutlined />} onClick={() => {
            message.success('Instant meeting started! Link: meet.worldclass-erp.com/instant-' + Date.now().toString(36));
            setMeetingModalVisible(false);
          }}>
            Start Now
          </Button>,
          <Button key="schedule" type="primary" icon={<CalendarOutlined />} onClick={() => {
            const newMeeting: Meeting = {
              id: 'MTG-' + Date.now().toString(36).toUpperCase(),
              title: form.getFieldValue('meetingTitle') || 'New Meeting',
              description: form.getFieldValue('meetingDescription') || '',
              host: 'Current User',
              participants: ['Invited Team Members'],
              externalGuests: form.getFieldValue('externalGuests') || [],
              scheduledStart: '2024-06-16 10:00',
              scheduledEnd: '2024-06-16 11:00',
              status: 'scheduled',
              type: form.getFieldValue('meetingType') || 'video',
              meetingLink: 'https://meet.worldclass-erp.com/' + Date.now().toString(36),
              passcode: Math.random().toString(36).substring(2, 8).toUpperCase(),
              recording: form.getFieldValue('recordMeeting') || false
            };
            setMeetings(prev => [newMeeting, ...prev]);
            message.success('Meeting scheduled! Link copied to clipboard.');
            navigator.clipboard.writeText(newMeeting.meetingLink);
            setMeetingModalVisible(false);
          }}>
            Schedule Meeting
          </Button>
        ]}
      >
        <Alert
          message="Video Meeting Features"
          description="Host HD video meetings with screen sharing, chat, and recording. External guests join via browser - no software required. Send invites via email, SMS, or WhatsApp."
          type="info"
          showIcon
          icon={<VideoCameraOutlined />}
          style={{ marginBottom: 16 }}
        />
        
        <Form form={form} layout="vertical">
          <Form.Item label="Meeting Title" name="meetingTitle" rules={[{ required: true }]}>
            <Input placeholder="e.g., Weekly Team Standup" prefix={<VideoCameraOutlined />} />
          </Form.Item>
          
          <Form.Item label="Description" name="meetingDescription">
            <TextArea rows={2} placeholder="What's this meeting about?" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Meeting Type" name="meetingType" initialValue="video">
                <Select>
                  <Option value="video"><VideoCameraOutlined /> Video Call</Option>
                  <Option value="audio"><AudioOutlined /> Audio Only</Option>
                  <Option value="webinar"><DesktopOutlined /> Webinar</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Duration" name="duration" initialValue="60">
                <Select>
                  <Option value="15">15 minutes</Option>
                  <Option value="30">30 minutes</Option>
                  <Option value="60">1 hour</Option>
                  <Option value="90">1.5 hours</Option>
                  <Option value="120">2 hours</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Date" name="meetingDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Time" name="meetingTime">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="Internal Participants" name="participants">
            <Select mode="multiple" placeholder="Select team members">
              {(contacts || []).filter(c => c?.type === 'employee').map(c => (
                <Option key={c.id} value={c.name}>{c.name} ({c.company})</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item label="External Guests (Clients)" name="externalGuests">
            <Select mode="tags" placeholder="Enter client email addresses">
              {(contacts || []).filter(c => c?.type === 'customer').map(c => (
                <Option key={c.email} value={c.email}>{c.name} - {c.email}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="recordMeeting" valuePropName="checked">
                <Checkbox><VideoCameraOutlined /> Record Meeting</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="requirePasscode" valuePropName="checked">
                <Checkbox><LockOutlined /> Require Passcode</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="waitingRoom" valuePropName="checked">
                <Checkbox><UsergroupAddOutlined /> Enable Waiting Room</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="Send Invite Via">
            <Space>
              <Button icon={<MailOutlined />}>Email</Button>
              <Button icon={<MobileOutlined />}>SMS</Button>
              <Button icon={<WhatsAppOutlined />} style={{ color: '#25D366' }}>WhatsApp</Button>
              <Button icon={<CopyOutlined />}>Copy Link</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default CommunicationsHub;
