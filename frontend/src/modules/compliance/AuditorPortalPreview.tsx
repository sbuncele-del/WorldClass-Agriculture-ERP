/**
 * AuditorPortalPreview - What External Auditors See
 * 
 * This is a preview of the secure portal that external auditors
 * access to view documents, communicate with the client, and
 * request additional information.
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Space, Badge,
  Input, Typography, Avatar, List, Divider, message,
  Alert, Progress, Tabs, Empty, Timeline, Modal, DatePicker,
  TimePicker, Select, Calendar, Form, Tooltip, Spin
} from 'antd';
import apiClient from '../../services/api';
import {
  FileTextOutlined, DownloadOutlined, FolderOpenOutlined,
  MessageOutlined, SendOutlined, UserOutlined, LockOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SearchOutlined,
  SafetyCertificateOutlined, BellOutlined, HomeOutlined,
  FileSearchOutlined, HistoryOutlined, LogoutOutlined,
  VideoCameraOutlined, PhoneOutlined, CalendarOutlined,
  PlusOutlined, TeamOutlined, PlayCircleOutlined,
  ScheduleOutlined, LinkOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AuditorPortalPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleMeetingModal, setScheduleMeetingModal] = useState(false);
  const [instantCallModal, setInstantCallModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [meetingDetailsModal, setMeetingDetailsModal] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // Auditor info state
  const [auditorInfo, setAuditorInfo] = useState({
    name: '',
    firm: '',
    email: '',
    clientName: '',
    clientContacts: [] as { name: string; role: string; email: string }[],
    accessExpiry: '',
    allowedCategories: [] as string[]
  });

  // Scheduled meetings state
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([]);

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);

  // Messages state
  const [messages, setMessages] = useState<any[]>([]);

  // Document requests state
  const [myRequests, setMyRequests] = useState<any[]>([]);

  // Activity log state
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [auditorRes, meetingsRes, docsRes, msgsRes, requestsRes, activityRes] = await Promise.all([
          apiClient.get('/api/compliance/auditor-portal/info'),
          apiClient.get('/api/compliance/auditor-portal/meetings'),
          apiClient.get('/api/compliance/auditor-portal/documents'),
          apiClient.get('/api/compliance/auditor-portal/messages'),
          apiClient.get('/api/compliance/auditor-portal/requests'),
          apiClient.get('/api/compliance/auditor-portal/activity')
        ]);
        setAuditorInfo(auditorRes.data || auditorInfo);
        setScheduledMeetings(meetingsRes.data || []);
        setDocuments(docsRes.data || []);
        setMessages(msgsRes.data || []);
        setMyRequests(requestsRes.data || []);
        setActivityLog(activityRes.data || []);
      } catch (error) {
        console.error('Failed to fetch auditor portal data:', error);
        message.error('Failed to load auditor portal data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', 
        padding: '16px 24px',
        color: 'white'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <SafetyCertificateOutlined style={{ fontSize: 28 }} />
              <div>
                <Title level={4} style={{ color: 'white', margin: 0 }}>Secure Auditor Portal</Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>{auditorInfo.clientName}</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="large">
              <Badge count={1}>
                <Button type="text" icon={<BellOutlined style={{ color: 'white', fontSize: 18 }} />} />
              </Badge>
              <Space>
                <Avatar icon={<UserOutlined />} style={{ background: '#fff', color: '#1890ff' }} />
                <div>
                  <Text style={{ color: 'white' }}>{auditorInfo.name}</Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{auditorInfo.firm}</Text>
                </div>
              </Space>
              <Button type="text" icon={<LogoutOutlined style={{ color: 'white' }} />}>
                <span style={{ color: 'white' }}>Logout</span>
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Alert Banner */}
      <Alert
        message="🔒 PREVIEW MODE - This is what your external auditors see when they log into their portal"
        type="warning"
        showIcon
        banner
        closable
      />

      {/* Main Content */}
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Welcome Card */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={16}>
              <Title level={4}><HomeOutlined /> Welcome, {auditorInfo.name}</Title>
              <Paragraph>
                You have secure access to audit documents for <strong>{auditorInfo.clientName}</strong>.
                Your access is valid until <strong>{auditorInfo.accessExpiry}</strong>.
              </Paragraph>
              <Space wrap>
                <Text type="secondary">Allowed Categories:</Text>
                {auditorInfo.allowedCategories.map(cat => (
                  <Tag key={cat} color="blue">{cat}</Tag>
                ))}
              </Space>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Statistic 
                  title="Documents Available" 
                  value={documents.length} 
                  prefix={<FileTextOutlined />}
                />
                <Progress percent={100} status="success" showInfo={false} />
                <Text type="secondary">All requested documents ready</Text>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'documents',
                label: <span><FolderOpenOutlined /> Documents</span>,
                children: (
                  <div>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Input
                          placeholder="Search documents..."
                          prefix={<SearchOutlined />}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Col>
                      <Col span={12} style={{ textAlign: 'right' }}>
                        <Space>
                          <Button icon={<DownloadOutlined />}>Download All</Button>
                        </Space>
                      </Col>
                    </Row>

                    <Table
                      dataSource={filteredDocuments}
                      rowKey="id"
                      columns={[
                        {
                          title: 'Document',
                          key: 'name',
                          render: (_, record) => (
                            <Space>
                              <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                              <div>
                                <Text strong>{record.name}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>{record.size}</Text>
                              </div>
                            </Space>
                          )
                        },
                        {
                          title: 'Category',
                          dataIndex: 'category',
                          key: 'category',
                          render: (cat: string) => <Tag color="blue">{cat}</Tag>
                        },
                        {
                          title: 'Last Updated',
                          dataIndex: 'lastUpdated',
                          key: 'lastUpdated'
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status: string) => (
                            <Tag color="green" icon={<CheckCircleOutlined />}>
                              Ready
                            </Tag>
                          )
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_, record) => (
                            <Space>
                              <Button 
                                type="primary" 
                                size="small" 
                                icon={<DownloadOutlined />}
                                onClick={() => message.success(`Downloading ${record.name}...`)}
                              >
                                Download
                              </Button>
                            </Space>
                          )
                        }
                      ]}
                    />
                  </div>
                )
              },
              {
                key: 'messages',
                label: <span><MessageOutlined /> Messages <Badge count={1} size="small" /></span>,
                children: (
                  <div>
                    <Row gutter={24}>
                      <Col span={16}>
                        <Card title="Inbox" size="small">
                          <List
                            dataSource={messages}
                            renderItem={msg => (
                              <List.Item
                                actions={[
                                  <Button size="small" icon={<SendOutlined />}>Reply</Button>
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<Avatar icon={<UserOutlined />} />}
                                  title={<Text strong>{msg.subject}</Text>}
                                  description={
                                    <>
                                      <Text type="secondary">From: {msg.from} • {msg.timestamp}</Text>
                                      <br />
                                      <Text>{msg.content}</Text>
                                      {msg.attachments && (
                                        <div style={{ marginTop: 8 }}>
                                          {msg.attachments.map(att => (
                                            <Tag key={att} icon={<FileTextOutlined />}>{att}</Tag>
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
                      </Col>
                      <Col span={8}>
                        <Card title="Send Message to Client" size="small">
                          <Input placeholder="Subject" style={{ marginBottom: 8 }} />
                          <TextArea rows={4} placeholder="Type your message..." style={{ marginBottom: 8 }} />
                          <Button type="primary" icon={<SendOutlined />} block>
                            Send Message
                          </Button>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'requests',
                label: <span><FileSearchOutlined /> Document Requests</span>,
                children: (
                  <div>
                    <Alert
                      message="Request Additional Documents"
                      description="If you need documents that are not currently available, you can request them here. The client will be notified and can approve or provide the requested documents."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />

                    <Row gutter={24}>
                      <Col span={16}>
                        <Card title="My Requests" size="small">
                          <Table
                            dataSource={myRequests}
                            rowKey="id"
                            columns={[
                              { title: 'Document', dataIndex: 'document', key: 'document' },
                              { 
                                title: 'Status', 
                                dataIndex: 'status', 
                                key: 'status',
                                render: (status: string) => (
                                  <Tag color={status === 'fulfilled' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
                                    {status === 'pending' && <ClockCircleOutlined />} {status.toUpperCase()}
                                  </Tag>
                                )
                              },
                              { title: 'Requested', dataIndex: 'requestedDate', key: 'requestedDate' },
                              { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true }
                            ]}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card title="New Request" size="small">
                          <Input placeholder="Document name" style={{ marginBottom: 8 }} />
                          <TextArea rows={3} placeholder="Why do you need this document?" style={{ marginBottom: 8 }} />
                          <Button type="primary" block icon={<SendOutlined />}>
                            Submit Request
                          </Button>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )
              },
              {
                key: 'activity',
                label: <span><HistoryOutlined /> My Activity</span>,
                children: (
                  <Card title="Activity Log" size="small">
                    <Timeline
                      items={activityLog.map(log => ({
                        color: log.action === 'Downloaded' ? 'green' : 'blue',
                        children: (
                          <>
                            <Text strong>{log.action}</Text> - {log.document}
                            <br />
                            <Text type="secondary">{log.timestamp}</Text>
                          </>
                        )
                      }))}
                    />
                  </Card>
                )
              },
              {
                key: 'meetings',
                label: <span><VideoCameraOutlined /> Meetings & Calls <Badge count={scheduledMeetings.filter(m => m.status === 'pending').length} size="small" /></span>,
                children: (
                  <div>
                    {/* Quick Actions */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                      <Col span={8}>
                        <Card 
                          hoverable
                          style={{ textAlign: 'center', background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none' }}
                          onClick={() => {
                            message.loading('Starting instant video call...');
                            setTimeout(() => {
                              setInstantCallModal(true);
                              message.destroy();
                            }, 1000);
                          }}
                        >
                          <VideoCameraOutlined style={{ fontSize: 40, color: 'white' }} />
                          <Title level={4} style={{ color: 'white', margin: '12px 0 4px' }}>Start Instant Call</Title>
                          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Call client team now</Text>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card 
                          hoverable
                          style={{ textAlign: 'center', background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}
                          onClick={() => setScheduleMeetingModal(true)}
                        >
                          <CalendarOutlined style={{ fontSize: 40, color: 'white' }} />
                          <Title level={4} style={{ color: 'white', margin: '12px 0 4px' }}>Schedule Meeting</Title>
                          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Book a time slot</Text>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card 
                          hoverable
                          style={{ textAlign: 'center', background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)', border: 'none' }}
                          onClick={() => message.info('Opening meeting history...')}
                        >
                          <HistoryOutlined style={{ fontSize: 40, color: 'white' }} />
                          <Title level={4} style={{ color: 'white', margin: '12px 0 4px' }}>Meeting History</Title>
                          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>View past meetings</Text>
                        </Card>
                      </Col>
                    </Row>

                    {/* Upcoming Meetings */}
                    <Card 
                      title={<><ScheduleOutlined /> Upcoming Meetings</>}
                      extra={
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setScheduleMeetingModal(true)}>
                          Schedule New
                        </Button>
                      }
                    >
                      <Table
                        dataSource={scheduledMeetings}
                        rowKey="id"
                        columns={[
                          {
                            title: 'Meeting',
                            key: 'meeting',
                            render: (_, record) => (
                              <Space>
                                <Avatar 
                                  icon={<VideoCameraOutlined />} 
                                  style={{ background: record.createdBy === 'auditor' ? '#1890ff' : '#52c41a' }}
                                />
                                <div>
                                  <Text strong>{record.title}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {record.createdBy === 'auditor' ? '📤 You scheduled this' : '📥 Client scheduled this'}
                                  </Text>
                                </div>
                              </Space>
                            )
                          },
                          {
                            title: 'Date & Time',
                            key: 'datetime',
                            render: (_, record) => (
                              <Space direction="vertical" size={0}>
                                <Text strong>{record.date}</Text>
                                <Text type="secondary">{record.time} ({record.duration} min)</Text>
                              </Space>
                            )
                          },
                          {
                            title: 'Attendees',
                            key: 'attendees',
                            render: (_, record) => (
                              <Space wrap>
                                {record.attendees.map((a: string, i: number) => (
                                  <Tag key={i} icon={<UserOutlined />}>{a}</Tag>
                                ))}
                              </Space>
                            )
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => (
                              <Tag color={status === 'confirmed' ? 'green' : 'orange'}>
                                {status === 'confirmed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} {status.toUpperCase()}
                              </Tag>
                            )
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                              <Space>
                                {record.status === 'confirmed' && (
                                  <Button 
                                    type="primary" 
                                    icon={<PlayCircleOutlined />}
                                    onClick={() => {
                                      message.success('Joining meeting room...');
                                      window.open(record.meetingLink, '_blank');
                                    }}
                                  >
                                    Join
                                  </Button>
                                )}
                                {record.status === 'pending' && record.createdBy === 'client' && (
                                  <Button 
                                    type="primary"
                                    onClick={() => {
                                      const updated = scheduledMeetings.map(m => 
                                        m.id === record.id ? { ...m, status: 'confirmed' } : m
                                      );
                                      setScheduledMeetings(updated);
                                      message.success('Meeting confirmed!');
                                    }}
                                  >
                                    Accept
                                  </Button>
                                )}
                                <Tooltip title="View Details">
                                  <Button 
                                    icon={<FileTextOutlined />}
                                    onClick={() => {
                                      setSelectedMeeting(record);
                                      setMeetingDetailsModal(true);
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="Copy Link">
                                  <Button 
                                    icon={<LinkOutlined />}
                                    onClick={() => {
                                      navigator.clipboard.writeText(record.meetingLink);
                                      message.success('Meeting link copied!');
                                    }}
                                  />
                                </Tooltip>
                              </Space>
                            )
                          }
                        ]}
                      />
                    </Card>

                    {/* Client Contacts */}
                    <Card title={<><TeamOutlined /> Client Team - Available for Calls</>} style={{ marginTop: 16 }}>
                      <Row gutter={16}>
                        {auditorInfo.clientContacts.map((contact, idx) => (
                          <Col span={8} key={idx}>
                            <Card size="small" hoverable>
                              <Space>
                                <Avatar size="large" style={{ background: '#1890ff' }}>
                                  {contact.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                                <div>
                                  <Text strong>{contact.name}</Text>
                                  <br />
                                  <Text type="secondary">{contact.role}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 11 }}>{contact.email}</Text>
                                </div>
                              </Space>
                              <Divider style={{ margin: '12px 0' }} />
                              <Space>
                                <Button 
                                  size="small" 
                                  type="primary" 
                                  icon={<VideoCameraOutlined />}
                                  onClick={() => {
                                    message.loading(`Calling ${contact.name}...`);
                                    setTimeout(() => setInstantCallModal(true), 1000);
                                  }}
                                >
                                  Video Call
                                </Button>
                                <Button 
                                  size="small" 
                                  icon={<CalendarOutlined />}
                                  onClick={() => {
                                    form.setFieldsValue({ attendees: [contact.email] });
                                    setScheduleMeetingModal(true);
                                  }}
                                >
                                  Schedule
                                </Button>
                              </Space>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </div>
                )
              }
            ]}
          />
        </Card>

        {/* Schedule Meeting Modal */}
        <Modal
          title={<><CalendarOutlined /> Schedule a Meeting</>}
          open={scheduleMeetingModal}
          onCancel={() => setScheduleMeetingModal(false)}
          footer={null}
          width={600}
        >
          <Alert
            message="Meeting Sync"
            description="This meeting will appear on both your calendar and the client's calendar. They will receive an email notification."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              const newMeeting = {
                id: `MTG-${Date.now()}`,
                title: values.title,
                date: values.date?.format('YYYY-MM-DD') || '2025-12-20',
                time: values.time?.format('HH:mm') || '10:00',
                duration: values.duration || 60,
                attendees: values.attendees || [],
                status: 'pending',
                meetingLink: `https://siyabusa.daily.co/audit-${Date.now()}`,
                agenda: values.agenda || '',
                createdBy: 'auditor'
              };
              setScheduledMeetings([...scheduledMeetings, newMeeting]);
              message.success('Meeting scheduled! Client will receive notification.');
              setScheduleMeetingModal(false);
              form.resetFields();
            }}
          >
            <Form.Item name="title" label="Meeting Title" rules={[{ required: true }]}>
              <Input placeholder="e.g., Year-End Audit Discussion" />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="time" label="Time" rules={[{ required: true }]}>
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="duration" label="Duration">
              <Select defaultValue={60}>
                <Option value={30}>30 minutes</Option>
                <Option value={45}>45 minutes</Option>
                <Option value={60}>1 hour</Option>
                <Option value={90}>1.5 hours</Option>
                <Option value={120}>2 hours</Option>
              </Select>
            </Form.Item>

            <Form.Item name="attendees" label="Invite Client Team Members" rules={[{ required: true }]}>
              <Select mode="multiple" placeholder="Select attendees">
                {auditorInfo.clientContacts.map(c => (
                  <Option key={c.email} value={c.name + ` (${c.role})`}>{c.name} - {c.role}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="agenda" label="Meeting Agenda">
              <TextArea rows={3} placeholder="What would you like to discuss?" />
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setScheduleMeetingModal(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<CalendarOutlined />}>
                  Schedule Meeting
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Instant Call Modal */}
        <Modal
          title={<><VideoCameraOutlined /> Video Call Ready</>}
          open={instantCallModal}
          onCancel={() => setInstantCallModal(false)}
          footer={null}
          width={500}
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <VideoCameraOutlined style={{ fontSize: 48, color: 'white' }} />
            </div>
            <Title level={4}>Your meeting room is ready!</Title>
            <Paragraph type="secondary">
              Click below to join. You can share this link with the client team.
            </Paragraph>
            <Input 
              value="https://siyabusa.daily.co/instant-audit-call"
              readOnly
              addonAfter={
                <Button 
                  type="text" 
                  icon={<LinkOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText('https://siyabusa.daily.co/instant-audit-call');
                    message.success('Link copied!');
                  }}
                />
              }
              style={{ marginBottom: 16 }}
            />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlayCircleOutlined />}
                block
                onClick={() => {
                  message.success('Joining call...');
                  window.open('https://siyabusa.daily.co/instant-audit-call', '_blank');
                  setInstantCallModal(false);
                }}
              >
                Join Video Call
              </Button>
              <Button 
                size="large"
                icon={<SendOutlined />}
                block
                onClick={() => {
                  message.success('Invitation sent to client team!');
                }}
              >
                Invite Client Team
              </Button>
            </Space>
          </div>
        </Modal>

        {/* Meeting Details Modal */}
        <Modal
          title={<><CalendarOutlined /> Meeting Details</>}
          open={meetingDetailsModal}
          onCancel={() => setMeetingDetailsModal(false)}
          footer={[
            <Button key="close" onClick={() => setMeetingDetailsModal(false)}>Close</Button>,
            <Button 
              key="join" 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={() => {
                window.open(selectedMeeting?.meetingLink, '_blank');
                setMeetingDetailsModal(false);
              }}
            >
              Join Meeting
            </Button>
          ]}
          width={500}
        >
          {selectedMeeting && (
            <div>
              <Divider orientation="left">Meeting Info</Divider>
              <Row gutter={[16, 16]}>
                <Col span={8}><Text type="secondary">Title:</Text></Col>
                <Col span={16}><Text strong>{selectedMeeting.title}</Text></Col>
                
                <Col span={8}><Text type="secondary">Date:</Text></Col>
                <Col span={16}><Text>{selectedMeeting.date}</Text></Col>
                
                <Col span={8}><Text type="secondary">Time:</Text></Col>
                <Col span={16}><Text>{selectedMeeting.time} ({selectedMeeting.duration} min)</Text></Col>
                
                <Col span={8}><Text type="secondary">Status:</Text></Col>
                <Col span={16}>
                  <Tag color={selectedMeeting.status === 'confirmed' ? 'green' : 'orange'}>
                    {selectedMeeting.status.toUpperCase()}
                  </Tag>
                </Col>
              </Row>

              <Divider orientation="left">Attendees</Divider>
              <Space wrap>
                {selectedMeeting.attendees.map((a: string, i: number) => (
                  <Tag key={i} icon={<UserOutlined />}>{a}</Tag>
                ))}
              </Space>

              <Divider orientation="left">Agenda</Divider>
              <Paragraph>{selectedMeeting.agenda || 'No agenda provided'}</Paragraph>

              <Divider orientation="left">Meeting Link</Divider>
              <Input 
                value={selectedMeeting.meetingLink}
                readOnly
                addonAfter={
                  <Button 
                    type="text" 
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMeeting.meetingLink);
                      message.success('Link copied!');
                    }}
                  />
                }
              />
            </div>
          )}
        </Modal>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: 16 }}>
          <LockOutlined style={{ marginRight: 8 }} />
          <Text type="secondary">
            Secure Portal powered by WorldClass ERP • All activity is logged for compliance purposes
          </Text>
        </div>
      </div>
    </div>
  );
};

// Helper component for stats
const Statistic: React.FC<{ title: string; value: number; prefix: React.ReactNode }> = ({ title, value, prefix }) => (
  <div>
    <Text type="secondary">{title}</Text>
    <div style={{ fontSize: 24, fontWeight: 'bold' }}>
      {prefix} {value}
    </div>
  </div>
);

export default AuditorPortalPreview;
