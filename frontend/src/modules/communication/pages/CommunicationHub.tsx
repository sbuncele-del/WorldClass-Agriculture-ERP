import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api';
import { 
  Card, Row, Col, Avatar, Badge, List, Input, Button, Space, 
  Typography, Tabs, Tag, Tooltip, Dropdown, Statistic, Spin
} from 'antd';
import { 
  MessageOutlined, VideoCameraOutlined, PhoneOutlined, TeamOutlined,
  BellOutlined, SearchOutlined, PlusOutlined, SettingOutlined,
  UserOutlined, PushpinOutlined, MoreOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './CommunicationHub.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'project';
  members: number;
  unread: number;
  lastMessage: string;
  lastActivity: string;
  pinned: boolean;
}

interface DirectMessage {
  id: string;
  user: { name: string; avatar?: string; status: 'online' | 'away' | 'offline' };
  unread: number;
  lastMessage: string;
  lastActivity: string;
}

interface RecentCall {
  id: string;
  type: 'video' | 'audio';
  participants: string[];
  duration: string;
  time: string;
}

const statusColors = {
  online: '#52c41a',
  away: '#faad14',
  offline: '#d9d9d9'
};

const CommunicationHub: React.FC = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [calls, setCalls] = useState<RecentCall[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunicationData = async () => {
      setLoading(true);
      try {
        const [channelsRes, dmsRes, callsRes] = await Promise.all([
          apiClient.get('/api/v2/communications/channels').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/dm/conversations').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/communications/meetings').catch(() => ({ data: { data: [] } })),
        ]);
        // V2 API returns { success: true, data: [...] }
        const channelsData = Array.isArray(channelsRes.data?.data) ? channelsRes.data.data : channelsRes.data || [];
        const dmsData = Array.isArray(dmsRes.data?.data) ? dmsRes.data.data : dmsRes.data || [];
        const callsData = Array.isArray(callsRes.data?.data) ? callsRes.data.data : callsRes.data || [];
        if (channelsData.length) setChannels(channelsData);
        if (dmsData.length) setDms(dmsData);
        if (callsData.length) setCalls(callsData);
      } catch (err) {
        console.error('Error fetching communication data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunicationData();
  }, []);

  if (loading) {
    return (
      <div className="communication-hub" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading communication data..." />
      </div>
    );
  }

  // Stats - with defensive guards for null/undefined arrays
  const totalUnread = (channels || []).reduce((sum, c) => sum + (c?.unread || 0), 0) + (dms || []).reduce((sum, d) => sum + (d?.unread || 0), 0);
  const onlineUsers = (dms || []).filter(d => d?.user?.status === 'online').length;

  return (
    <div className="communication-hub">
      {/* Header */}
      <div className="hub-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>Communication Hub</Title>
          <Text type="secondary">Stay connected with your team</Text>
        </div>
        <Space>
          <Input
            placeholder="Search messages, channels, people..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Tooltip title="Start Video Call">
            <Button type="primary" icon={<VideoCameraOutlined />} onClick={() => navigate('/communication/video/new')}>
              New Meeting
            </Button>
          </Tooltip>
          <Tooltip title="Settings">
            <Button icon={<SettingOutlined />} />
          </Tooltip>
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Unread Messages"
              value={totalUnread}
              prefix={<MessageOutlined />}
              valueStyle={{ color: totalUnread > 0 ? '#1890ff' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Online Now"
              value={onlineUsers}
              suffix={`/ ${dms.length}`}
              prefix={<Badge status="success" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Active Channels"
              value={channels.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="Calls Today"
              value={(calls || []).length}
              prefix={<PhoneOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Channels & DMs */}
        <Col xs={24} lg={16}>
          <Card className="main-card">
            <Tabs defaultActiveKey="channels">
              <TabPane tab={<><TeamOutlined /> Channels ({(channels || []).length})</>} key="channels">
                {/* Pinned */}
                {(channels || []).filter(c => c.pinned).length > 0 && (
                  <div className="pinned-section">
                    <Text type="secondary" className="section-label">
                      <PushpinOutlined /> Pinned
                    </Text>
                    <List
                      dataSource={(channels || []).filter(c => c.pinned)}
                      renderItem={channel => (
                        <List.Item
                          className="channel-item"
                          onClick={() => navigate(`/communication/channels/${channel.id}`)}
                          actions={[
                            channel.unread > 0 && <Badge count={channel.unread} />
                          ].filter(Boolean)}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar style={{ background: channel.type === 'project' ? '#722ed1' : '#1890ff' }}>
                                {channel.type === 'private' ? '🔒' : '#'}
                              </Avatar>
                            }
                            title={
                              <Space>
                                <span className="channel-name">{channel.name}</span>
                                <Tag>{channel.type}</Tag>
                              </Space>
                            }
                            description={
                              <span className="last-message">{channel.lastMessage}</span>
                            }
                          />
                          <span className="activity-time">{channel.lastActivity}</span>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {/* All Channels */}
                <div className="channels-section">
                  <div className="section-header">
                    <Text type="secondary" className="section-label">All Channels</Text>
                    <Button type="link" size="small" icon={<PlusOutlined />}>
                      Create Channel
                    </Button>
                  </div>
                  <List
                    dataSource={(channels || []).filter(c => !c.pinned)}
                    renderItem={channel => (
                      <List.Item
                        className="channel-item"
                        onClick={() => navigate(`/communication/channels/${channel.id}`)}
                        actions={[
                          channel.unread > 0 && <Badge count={channel.unread} />
                        ].filter(Boolean)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ background: channel.type === 'project' ? '#722ed1' : channel.type === 'private' ? '#fa541c' : '#1890ff' }}>
                              {channel.type === 'private' ? '🔒' : '#'}
                            </Avatar>
                          }
                          title={channel.name}
                          description={
                            <Space>
                              <span className="members-count">{channel.members} members</span>
                              <span className="last-message">{channel.lastMessage}</span>
                            </Space>
                          }
                        />
                        <span className="activity-time">{channel.lastActivity}</span>
                      </List.Item>
                    )}
                  />
                </div>
              </TabPane>

              <TabPane tab={<><UserOutlined /> Direct Messages ({(dms || []).length})</>} key="messages">
                <List
                  dataSource={dms || []}
                  renderItem={dm => (
                    <List.Item
                      className="dm-item"
                      onClick={() => navigate(`/communication/messages/${dm.id}`)}
                      actions={[
                        dm.unread > 0 && <Badge count={dm.unread} />
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Badge dot color={statusColors[dm.user?.status || 'offline']} offset={[-4, 28]}>
                            <Avatar size="large">{dm.user?.name?.[0] || 'U'}</Avatar>
                          </Badge>
                        }
                        title={dm.user?.name || 'Unknown'}
                        description={dm.lastMessage}
                      />
                      <span className="activity-time">{dm.lastActivity}</span>
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col xs={24} lg={8}>
          {/* Quick Actions */}
          <Card title="Quick Actions" className="quick-actions-card" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<VideoCameraOutlined />} onClick={() => navigate('/communication/video/new')}>
                Start Video Meeting
              </Button>
              <Button block icon={<PhoneOutlined />}>
                Start Audio Call
              </Button>
              <Button block icon={<MessageOutlined />}>
                New Message
              </Button>
              <Button block icon={<TeamOutlined />}>
                Create Channel
              </Button>
            </Space>
          </Card>

          {/* Recent Calls */}
          <Card title="Recent Calls" extra={<Button type="link" size="small">View All</Button>}>
            <List
              dataSource={calls || []}
              renderItem={call => (
                <List.Item className="call-item">
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={call.type === 'video' ? <VideoCameraOutlined /> : <PhoneOutlined />}
                        style={{ background: call.type === 'video' ? '#722ed1' : '#1890ff' }}
                      />
                    }
                    title={call.participants.length > 1 ? `${call.participants.length} participants` : call.participants[0]}
                    description={`${call.duration} • ${call.time}`}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Team Status */}
          <Card title="Team Status" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={(dms || []).filter(d => d?.user?.status === 'online').slice(0, 5)}
              renderItem={dm => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge dot color={statusColors[dm.user?.status || 'offline']}>
                        <Avatar size="small">{dm.user?.name?.[0] || 'U'}</Avatar>
                      </Badge>
                    }
                    title={<span style={{ fontSize: 13 }}>{dm.user?.name || 'Unknown'}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CommunicationHub;
