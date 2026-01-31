/**
 * Phase 5: Delivery & Tracking
 * 
 * Features:
 * - Export to multiple formats (PDF, PPT, Word, Web)
 * - Client sharing with password protection
 * - Tracking views and engagement
 * - e-Signature integration
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Space, Button, Input, Switch, Select,
  DatePicker, Tag, Table, Progress, Statistic, Alert, Modal, Steps,
  Divider, List, Avatar, Badge, Tooltip, message, Tabs, Timeline,
  Form, Checkbox, Result
} from 'antd';
import {
  SendOutlined, DownloadOutlined, LinkOutlined, MailOutlined,
  FilePdfOutlined, FileWordOutlined, FilePptOutlined, GlobalOutlined,
  LockOutlined, EyeOutlined, ClockCircleOutlined, CheckCircleOutlined,
  EditOutlined, SafetyCertificateOutlined, CopyOutlined, QrcodeOutlined,
  BarChartOutlined, UserOutlined, CalendarOutlined, ThunderboltOutlined,
  ShareAltOutlined, BellOutlined, HistoryOutlined, CloudDownloadOutlined,
  MobileOutlined, DesktopOutlined, TabletOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ProposalData, DeliverySettings } from '../../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface PhaseDeliveryProps {
  proposal: ProposalData;
  onDeliveryUpdate: (delivery: DeliverySettings) => void;
  onStatusChange: (status: ProposalData['status']) => void;
  onPhaseComplete: (progress: number) => void;
}

// Tracking data interface
interface TrackingData {
  views: number;
  uniqueViewers: number;
  totalTime: string;
  lastViewed: string;
  sections: Array<{ name: string; views: number; avgTime: string }>;
  viewers: Array<{ name: string; email: string; views: number; lastViewed: string; device: string }>;
  timeline: Array<{ event: string; user: string; time: string }>;
}

interface Signer {
  name: string;
  email: string;
  status: string;
  order: number;
}

const PhaseDelivery: React.FC<PhaseDeliveryProps> = ({
  proposal,
  onDeliveryUpdate,
  onStatusChange,
  onPhaseComplete
}) => {
  const [delivery, setDelivery] = useState<DeliverySettings>(proposal.delivery);
  const [activeTab, setActiveTab] = useState('export');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Proposal: ${proposal.title}`);
  const [emailMessage, setEmailMessage] = useState('');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [proposalSent, setProposalSent] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    views: 0,
    uniqueViewers: 0,
    totalTime: '0 minutes',
    lastViewed: '',
    sections: [],
    viewers: [],
    timeline: []
  });
  const [signers, setSigners] = useState<Signer[]>([]);

  // Fetch tracking data from API
  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const [trackingRes, signersRes] = await Promise.all([
          fetch(`/api/proposals/${proposal.id}/tracking`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch(`/api/proposals/${proposal.id}/signers`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        if (trackingRes.ok) {
          const data = await trackingRes.json();
          setTrackingData(data);
        }
        if (signersRes.ok) {
          const data = await signersRes.json();
          setSigners(data.signers || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
      }
    };
    if (proposal.id) fetchTrackingData();
  }, [proposal.id]);
  
  // Calculate completion progress
  useEffect(() => {
    let progress = 0;
    if (delivery.format.length > 0) progress += 30;
    if (shareLink) progress += 30;
    if (proposalSent) progress += 40;
    onPhaseComplete(Math.min(progress, 100));
  }, [delivery, shareLink, proposalSent]);
  
  // Update parent when delivery changes
  useEffect(() => {
    onDeliveryUpdate(delivery);
  }, [delivery]);
  
  const handleExport = async (format: string) => {
    setIsExporting(format);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(null);
    message.success(`Proposal exported as ${format.toUpperCase()}`);
  };
  
  const generateShareLink = () => {
    const link = `https://proposals.yourcompany.com/view/${proposal.id}?token=${Date.now().toString(36)}`;
    setShareLink(link);
    setDelivery(prev => ({ ...prev, customLink: link }));
    message.success('Share link generated');
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    message.success('Link copied to clipboard');
  };
  
  const handleSendProposal = () => {
    setProposalSent(true);
    onStatusChange('sent');
    setShowSendModal(false);
    message.success('Proposal sent successfully!');
  };
  
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return <MobileOutlined />;
      case 'tablet': return <TabletOutlined />;
      default: return <DesktopOutlined />;
    }
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'export',
            label: (
              <Space>
                <DownloadOutlined />
                <span>Export</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title="Export Formats">
                    <Row gutter={[16, 16]}>
                      {/* PDF Export */}
                      <Col span={12}>
                        <Card
                          hoverable
                          style={{ 
                            border: delivery.format.includes('pdf') ? '2px solid #1890ff' : '1px solid #e8e8e8'
                          }}
                          onClick={() => {
                            const formats = delivery.format.includes('pdf')
                              ? delivery.format.filter(f => f !== 'pdf')
                              : [...delivery.format, 'pdf' as const];
                            setDelivery({ ...delivery, format: formats });
                          }}
                        >
                          <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <FilePdfOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
                            <Title level={5} style={{ margin: 0 }}>PDF Document</Title>
                            <Text type="secondary">Professional, print-ready format</Text>
                            <Button 
                              type="primary"
                              loading={isExporting === 'pdf'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport('pdf');
                              }}
                              icon={<DownloadOutlined />}
                            >
                              Export PDF
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                      
                      {/* PowerPoint Export */}
                      <Col span={12}>
                        <Card
                          hoverable
                          style={{ 
                            border: delivery.format.includes('pptx') ? '2px solid #1890ff' : '1px solid #e8e8e8'
                          }}
                          onClick={() => {
                            const formats = delivery.format.includes('pptx')
                              ? delivery.format.filter(f => f !== 'pptx')
                              : [...delivery.format, 'pptx' as const];
                            setDelivery({ ...delivery, format: formats });
                          }}
                        >
                          <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <FilePptOutlined style={{ fontSize: 48, color: '#fa8c16' }} />
                            <Title level={5} style={{ margin: 0 }}>PowerPoint</Title>
                            <Text type="secondary">Editable presentation format</Text>
                            <Button 
                              type="primary"
                              loading={isExporting === 'pptx'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport('pptx');
                              }}
                              icon={<DownloadOutlined />}
                              style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                            >
                              Export PPTX
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                      
                      {/* Word Export */}
                      <Col span={12}>
                        <Card
                          hoverable
                          style={{ 
                            border: delivery.format.includes('docx') ? '2px solid #1890ff' : '1px solid #e8e8e8'
                          }}
                          onClick={() => {
                            const formats = delivery.format.includes('docx')
                              ? delivery.format.filter(f => f !== 'docx')
                              : [...delivery.format, 'docx' as const];
                            setDelivery({ ...delivery, format: formats });
                          }}
                        >
                          <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <FileWordOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            <Title level={5} style={{ margin: 0 }}>Word Document</Title>
                            <Text type="secondary">Editable document format</Text>
                            <Button 
                              type="primary"
                              loading={isExporting === 'docx'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport('docx');
                              }}
                              icon={<DownloadOutlined />}
                            >
                              Export DOCX
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                      
                      {/* Web Link */}
                      <Col span={12}>
                        <Card
                          hoverable
                          style={{ 
                            border: delivery.format.includes('web') ? '2px solid #1890ff' : '1px solid #e8e8e8'
                          }}
                          onClick={() => {
                            const formats = delivery.format.includes('web')
                              ? delivery.format.filter(f => f !== 'web')
                              : [...delivery.format, 'web' as const];
                            setDelivery({ ...delivery, format: formats });
                          }}
                        >
                          <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <GlobalOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                            <Title level={5} style={{ margin: 0 }}>Web Link</Title>
                            <Text type="secondary">Interactive online viewing</Text>
                            <Button 
                              type="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateShareLink();
                              }}
                              icon={<LinkOutlined />}
                              style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            >
                              Generate Link
                            </Button>
                          </Space>
                        </Card>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                
                <Col span={8}>
                  {/* Export Settings */}
                  <Card title="Export Settings" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Checkbox 
                          checked={delivery.passwordProtected}
                          onChange={e => setDelivery({ 
                            ...delivery, 
                            passwordProtected: e.target.checked 
                          })}
                        >
                          Password Protection
                        </Checkbox>
                        {delivery.passwordProtected && (
                          <Input.Password
                            placeholder="Enter password"
                            value={delivery.password}
                            onChange={e => setDelivery({ ...delivery, password: e.target.value })}
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </div>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <div>
                        <Checkbox 
                          checked={delivery.trackViews}
                          onChange={e => setDelivery({ ...delivery, trackViews: e.target.checked })}
                        >
                          Track Views & Engagement
                        </Checkbox>
                      </div>
                      
                      <div>
                        <Checkbox 
                          checked={delivery.allowDownload}
                          onChange={e => setDelivery({ ...delivery, allowDownload: e.target.checked })}
                        >
                          Allow PDF Download
                        </Checkbox>
                      </div>
                      
                      <Divider style={{ margin: '12px 0' }} />
                      
                      <div>
                        <Text strong>Link Expiry</Text>
                        <DatePicker
                          style={{ width: '100%', marginTop: 8 }}
                          placeholder="No expiry"
                          onChange={(date) => setDelivery({ 
                            ...delivery, 
                            expiryDate: date?.toISOString() 
                          })}
                        />
                      </div>
                    </Space>
                  </Card>
                  
                  {/* Share Link Card */}
                  {shareLink && (
                    <Card 
                      title="Share Link" 
                      size="small" 
                      style={{ marginTop: 16, background: '#f6ffed' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                          value={shareLink}
                          readOnly
                          addonAfter={
                            <Button 
                              type="text" 
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={copyShareLink}
                            />
                          }
                        />
                        <Space>
                          <Button size="small" icon={<QrcodeOutlined />}>
                            QR Code
                          </Button>
                          <Button size="small" icon={<ShareAltOutlined />}>
                            Share
                          </Button>
                        </Space>
                      </Space>
                    </Card>
                  )}
                </Col>
              </Row>
            )
          },
          {
            key: 'send',
            label: (
              <Space>
                <SendOutlined />
                <span>Send to Client</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title="Send Proposal">
                    {proposalSent ? (
                      <Result
                        status="success"
                        title="Proposal Sent Successfully!"
                        subTitle={`Your proposal has been sent to ${proposal.client?.name} at ${proposal.client?.email}`}
                        extra={[
                          <Button type="primary" key="track" onClick={() => setActiveTab('tracking')}>
                            View Tracking
                          </Button>,
                          <Button key="resend" onClick={() => setShowSendModal(true)}>
                            Send to Others
                          </Button>
                        ]}
                      />
                    ) : (
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Alert
                          message="Ready to Send"
                          description={`This proposal will be sent to ${proposal.client?.company || 'your client'}`}
                          type="info"
                          showIcon
                        />
                        
                        <Form layout="vertical">
                          <Form.Item label="Recipient">
                            <Input
                              value={`${proposal.client?.name} <${proposal.client?.email}>`}
                              readOnly
                              prefix={<UserOutlined />}
                            />
                          </Form.Item>
                          
                          <Form.Item label="Subject">
                            <Input
                              value={emailSubject}
                              onChange={e => setEmailSubject(e.target.value)}
                              prefix={<MailOutlined />}
                            />
                          </Form.Item>
                          
                          <Form.Item label="Personal Message (Optional)">
                            <Input.TextArea
                              value={emailMessage}
                              onChange={e => setEmailMessage(e.target.value)}
                              placeholder="Add a personal note to accompany the proposal..."
                              rows={4}
                            />
                          </Form.Item>
                          
                          <Form.Item label="Attachments">
                            <Space>
                              <Checkbox defaultChecked>PDF Version</Checkbox>
                              <Checkbox>Web Link</Checkbox>
                            </Space>
                          </Form.Item>
                        </Form>
                        
                        <div style={{ textAlign: 'center' }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<SendOutlined />}
                            onClick={handleSendProposal}
                            style={{ 
                              height: 50, 
                              padding: '0 48px',
                              background: 'linear-gradient(135deg, #52c41a 0%, #1890ff 100%)',
                              border: 'none'
                            }}
                          >
                            Send Proposal
                          </Button>
                        </div>
                      </Space>
                    )}
                  </Card>
                </Col>
                
                <Col span={8}>
                  <Card title="Delivery Checklist" size="small">
                    <List
                      size="small"
                      dataSource={[
                        { item: 'All sections completed', done: true },
                        { item: 'Design approved', done: true },
                        { item: 'Pricing verified', done: proposal.status === 'approved' },
                        { item: 'Team approval obtained', done: proposal.status === 'approved' },
                        { item: 'Export format selected', done: delivery.format.length > 0 }
                      ]}
                      renderItem={item => (
                        <List.Item>
                          <Space>
                            {item.done ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : (
                              <ClockCircleOutlined style={{ color: '#faad14' }} />
                            )}
                            <Text type={item.done ? undefined : 'secondary'}>
                              {item.item}
                            </Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                  
                  <Card title="Quick Actions" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button block icon={<EyeOutlined />}>
                        Preview as Client
                      </Button>
                      <Button block icon={<MailOutlined />}>
                        Send Test Email
                      </Button>
                      <Button block icon={<CalendarOutlined />}>
                        Schedule Send
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'tracking',
            label: (
              <Space>
                <BarChartOutlined />
                <span>Tracking</span>
                {proposalSent && <Badge dot />}
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  {/* Engagement Stats */}
                  <Card style={{ marginBottom: 16 }}>
                    <Row gutter={24}>
                      <Col span={6}>
                        <Statistic
                          title="Total Views"
                          value={trackingData.views}
                          prefix={<EyeOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="Unique Viewers"
                          value={trackingData.uniqueViewers}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="Time Spent"
                          value={trackingData.totalTime}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="Last Viewed"
                          value={trackingData.lastViewed ? new Date(trackingData.lastViewed).toLocaleDateString() : 'N/A'}
                          prefix={<CalendarOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                  
                  {/* Section Engagement */}
                  <Card title="Section Engagement">
                    <Table
                      dataSource={trackingData.sections}
                      rowKey="name"
                      pagination={false}
                      columns={[
                        {
                          title: 'Section',
                          dataIndex: 'name',
                          key: 'name'
                        },
                        {
                          title: 'Views',
                          dataIndex: 'views',
                          key: 'views',
                          render: (views) => (
                            <Space>
                              <Progress 
                                percent={trackingData.views > 0 ? Math.round((views / trackingData.views) * 100) : 0}
                                size="small"
                                style={{ width: 100 }}
                              />
                              <Text>{views}</Text>
                            </Space>
                          )
                        },
                        {
                          title: 'Avg. Time',
                          dataIndex: 'avgTime',
                          key: 'avgTime',
                          render: (time) => <Tag>{time}</Tag>
                        }
                      ]}
                    />
                  </Card>
                  
                  {/* Viewers */}
                  <Card title="Viewers" style={{ marginTop: 16 }}>
                    <Table
                      dataSource={trackingData.viewers}
                      rowKey="email"
                      pagination={false}
                      columns={[
                        {
                          title: 'Viewer',
                          key: 'viewer',
                          render: (_, record) => (
                            <Space>
                              <Avatar size="small">{record.name.charAt(0)}</Avatar>
                              <div>
                                <Text strong>{record.name}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {record.email}
                                </Text>
                              </div>
                            </Space>
                          )
                        },
                        {
                          title: 'Views',
                          dataIndex: 'views',
                          key: 'views'
                        },
                        {
                          title: 'Device',
                          dataIndex: 'device',
                          key: 'device',
                          render: (device) => (
                            <Tooltip title={device}>
                              {getDeviceIcon(device)}
                            </Tooltip>
                          )
                        },
                        {
                          title: 'Last Viewed',
                          dataIndex: 'lastViewed',
                          key: 'lastViewed',
                          render: (date) => new Date(date).toLocaleString()
                        }
                      ]}
                    />
                  </Card>
                </Col>
                
                <Col span={8}>
                  {/* Activity Timeline */}
                  <Card title="Activity Timeline" size="small">
                    <Timeline
                      items={trackingData.timeline.map(item => ({
                        color: item.event === 'Downloaded PDF' ? 'green' : 
                               item.event === 'Forwarded' ? 'purple' : 'blue',
                        children: (
                          <div>
                            <Text strong>{item.event}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.user}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {new Date(item.time).toLocaleString()}
                            </Text>
                          </div>
                        )
                      }))}
                    />
                  </Card>
                  
                  {/* Notifications */}
                  <Card title="Get Notified" size="small" style={{ marginTop: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>When proposal is opened</Text>
                        <Switch defaultChecked size="small" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>When sections are viewed</Text>
                        <Switch size="small" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>When PDF is downloaded</Text>
                        <Switch defaultChecked size="small" />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>When proposal is signed</Text>
                        <Switch defaultChecked size="small" />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'signatures',
            label: (
              <Space>
                <SafetyCertificateOutlined />
                <span>e-Signatures</span>
              </Space>
            ),
            children: (
              <Row gutter={24}>
                <Col span={16}>
                  <Card title="e-Signature Request">
                    <Alert
                      message="Legally Binding Signatures"
                      description="Request electronic signatures that are legally binding and compliant with eSignature laws."
                      type="info"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <div>
                        <Title level={5}>Signers</Title>
                        <List
                          dataSource={signers}
                          renderItem={(signer, index) => (
                            <List.Item
                              actions={[
                                <Button type="link" size="small" icon={<MailOutlined />} key="remind">
                                  Send Reminder
                                </Button>,
                                <Button type="link" size="small" danger icon={<DeleteOutlined />} key="remove">
                                  Remove
                                </Button>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <Badge 
                                    count={index + 1}
                                    style={{ 
                                      background: signer.status === 'pending' ? '#1890ff' : '#d9d9d9'
                                    }}
                                  >
                                    <Avatar>{signer.name.charAt(0)}</Avatar>
                                  </Badge>
                                }
                                title={signer.name}
                                description={
                                  <Space>
                                    <Text type="secondary">{signer.email}</Text>
                                    <Tag color={
                                      signer.status === 'signed' ? 'success' :
                                      signer.status === 'pending' ? 'processing' : 'default'
                                    }>
                                      {signer.status}
                                    </Tag>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                        
                        <Button 
                          type="dashed" 
                          block 
                          icon={<UserOutlined />}
                          style={{ marginTop: 16 }}
                        >
                          Add Another Signer
                        </Button>
                      </div>
                      
                      <Divider />
                      
                      <div>
                        <Checkbox defaultChecked>
                          Send automatic reminders every 3 days
                        </Checkbox>
                      </div>
                      <div>
                        <Checkbox defaultChecked>
                          Send copy of signed document to all parties
                        </Checkbox>
                      </div>
                      
                      <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => {
                            setDelivery({ ...delivery, requireSignature: true });
                            message.success('Signature request sent!');
                          }}
                          style={{ 
                            height: 50, 
                            padding: '0 48px',
                            background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
                            border: 'none'
                          }}
                        >
                          Request Signatures
                        </Button>
                      </div>
                    </Space>
                  </Card>
                </Col>
                
                <Col span={8}>
                  <Card title="Signature Status" size="small">
                    <Steps
                      direction="vertical"
                      current={0}
                      items={[
                        { 
                          title: 'Sent for Signature', 
                          description: 'Awaiting signatures',
                          status: 'process'
                        },
                        { 
                          title: 'First Signer', 
                          description: 'John van der Berg',
                          status: 'wait'
                        },
                        { 
                          title: 'Second Signer', 
                          description: 'CEO Approval',
                          status: 'wait'
                        },
                        { 
                          title: 'Completed', 
                          description: 'All signatures received',
                          status: 'wait'
                        }
                      ]}
                    />
                  </Card>
                  
                  <Card title="Benefits" size="small" style={{ marginTop: 16 }}>
                    <List
                      size="small"
                      dataSource={[
                        'Legally binding in 180+ countries',
                        'Audit trail and timestamps',
                        'Automatic reminders',
                        'Secure and encrypted',
                        'Instant notifications'
                      ]}
                      renderItem={item => (
                        <List.Item>
                          <Space>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <Text style={{ fontSize: 12 }}>{item}</Text>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />
    </div>
  );
};

export default PhaseDelivery;
