import React, { useState, useEffect } from 'react';
import { 
  Card, List, Button, Space, Input, Tag, Avatar, Modal, Form, 
  Select, Switch, message, Typography, Row, Col, Badge
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, TeamOutlined, LockOutlined,
  GlobalOutlined, SettingOutlined, DeleteOutlined, EditOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/api';

const { Title, Text } = Typography;

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'project';
  members: number;
  unread: number;
  createdBy: string;
  createdAt: string;
}

const typeConfig = {
  public: { icon: <GlobalOutlined />, color: 'blue', label: 'Public' },
  private: { icon: <LockOutlined />, color: 'orange', label: 'Private' },
  project: { icon: <FolderOutlined />, color: 'purple', label: 'Project' }
};

const Channels: React.FC = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await apiClient.get('/api/communications/channels');
        setChannels(response.data?.data || response.data || []);
      } catch (err) {
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleCreate = (values: any) => {
    const newChannel: Channel = {
      id: String(Date.now()),
      name: values.name.toLowerCase().replace(/\s+/g, '-'),
      description: values.description,
      type: values.type,
      members: 1,
      unread: 0,
      createdBy: 'You',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setChannels([newChannel, ...channels]);
    setCreateModalVisible(false);
    form.resetFields();
    message.success('Channel created successfully');
  };

  return (
    <div className="channels-page" style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Channels</Title>
          <Text type="secondary">Organize conversations by topic or project</Text>
        </div>
        <Space>
          <Input
            placeholder="Search channels..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Create Channel
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Object.entries(typeConfig).map(([type, config]) => (
          <Col xs={8} key={type}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar style={{ background: type === 'public' ? '#1890ff' : type === 'private' ? '#fa541c' : '#722ed1' }}>
                  {config.icon}
                </Avatar>
                <div>
                  <Text type="secondary">{config.label}</Text>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>
                    {channels.filter(c => c.type === type).length}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Channels List */}
      <Card>
        <List
          dataSource={filteredChannels}
          renderItem={channel => (
            <List.Item
              style={{ cursor: 'pointer', padding: '16px 0' }}
              onClick={() => navigate(`/communication/channels/${channel.id}`)}
              actions={[
                channel.unread > 0 && <Badge count={channel.unread} />,
                <Button type="text" size="small" icon={<SettingOutlined />} onClick={(e) => e.stopPropagation()} />
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ background: typeConfig[channel.type].color === 'blue' ? '#1890ff' : typeConfig[channel.type].color === 'orange' ? '#fa541c' : '#722ed1' }}>
                    {channel.type === 'private' ? '🔒' : '#'}
                  </Avatar>
                }
                title={
                  <Space>
                    <span style={{ fontWeight: 600 }}>{channel.name}</span>
                    <Tag color={typeConfig[channel.type].color}>{typeConfig[channel.type].label}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>{channel.description}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <TeamOutlined /> {channel.members} members • Created by {channel.createdBy}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create New Channel"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Channel Name" rules={[{ required: true }]}>
            <Input prefix="#" placeholder="e.g., marketing-team" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What is this channel about?" />
          </Form.Item>
          <Form.Item name="type" label="Channel Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Select.Option value="public">
                <Space><GlobalOutlined /> Public - Anyone can join</Space>
              </Select.Option>
              <Select.Option value="private">
                <Space><LockOutlined /> Private - Invite only</Space>
              </Select.Option>
              <Select.Option value="project">
                <Space><FolderOutlined /> Project - Linked to a project</Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Channel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Channels;
