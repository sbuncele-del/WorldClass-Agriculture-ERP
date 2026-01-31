import React, { useState, useEffect } from 'react';
import { 
  Card, List, Button, Space, Input, Avatar, Badge, Typography, 
  Modal, Select, message, Row, Col
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, UserOutlined, MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api';

const { Title, Text } = Typography;

interface DirectMessage {
  id: string;
  user: { name: string; email: string; status: 'online' | 'away' | 'offline' };
  unread: number;
  lastMessage: string;
  lastActivity: string;
}

const statusColors = {
  online: '#52c41a',
  away: '#faad14',
  offline: '#d9d9d9'
};

const statusLabels = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline'
};

const DirectMessages: React.FC = () => {
  const navigate = useNavigate();
  const [dms, setDms] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);

  useEffect(() => {
    const fetchDMs = async () => {
      try {
        const response = await apiClient.get('/api/communications/direct-messages');
        setDms(response.data?.data || response.data || []);
      } catch (err) {
        console.error('Error fetching direct messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDMs();
  }, []);

  const filteredDMs = dms.filter(dm => 
    dm.user.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const totalUnread = dms.reduce((sum, dm) => sum + dm.unread, 0);
  const onlineCount = dms.filter(dm => dm.user.status === 'online').length;

  const handleStartConversation = (values: any) => {
    message.success(`Starting conversation with ${values.user}`);
    setNewMessageModalVisible(false);
  };

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Direct Messages</Title>
          <Text type="secondary">Private conversations with your team</Text>
        </div>
        <Space>
          <Input
            placeholder="Search conversations..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewMessageModalVisible(true)}>
            New Message
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar style={{ background: '#1890ff' }}><MessageOutlined /></Avatar>
              <div>
                <Text type="secondary">Conversations</Text>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{dms.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge dot color="#52c41a" offset={[-4, 28]}>
                <Avatar style={{ background: '#52c41a' }}><UserOutlined /></Avatar>
              </Badge>
              <div>
                <Text type="secondary">Online Now</Text>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{onlineCount}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge count={totalUnread} offset={[-4, 28]}>
                <Avatar style={{ background: totalUnread > 0 ? '#ff4d4f' : '#d9d9d9' }}><MessageOutlined /></Avatar>
              </Badge>
              <div>
                <Text type="secondary">Unread</Text>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{totalUnread}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Conversations List */}
      <Card>
        <List
          dataSource={filteredDMs}
          renderItem={dm => (
            <List.Item
              style={{ cursor: 'pointer', padding: '16px 0' }}
              onClick={() => navigate(`/communication/messages/${dm.id}`)}
              actions={[
                dm.unread > 0 && <Badge count={dm.unread} />
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot color={statusColors[dm.user.status]} offset={[-4, 32]}>
                    <Avatar size="large">{dm.user.name[0]}</Avatar>
                  </Badge>
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>{dm.user.name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>{statusLabels[dm.user.status]}</Text>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: 400 
                    }}>
                      {dm.lastMessage}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{dm.lastActivity}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* New Message Modal */}
      <Modal
        title="New Message"
        open={newMessageModalVisible}
        onCancel={() => setNewMessageModalVisible(false)}
        footer={null}
      >
        <Select
          showSearch
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Search for a person..."
          optionFilterProp="children"
        >
          {dms.map(dm => (
            <Select.Option key={dm.id} value={dm.user.name}>
              <Space>
                <Badge dot color={statusColors[dm.user.status]}>
                  <Avatar size="small">{dm.user.name[0]}</Avatar>
                </Badge>
                {dm.user.name}
              </Space>
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" block onClick={() => handleStartConversation({})}>
          Start Conversation
        </Button>
      </Modal>
    </div>
  );
};

export default DirectMessages;
