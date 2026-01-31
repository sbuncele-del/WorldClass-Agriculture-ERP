import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Badge,
  Tabs,
  List,
  Typography,
  Popconfirm,
  Tooltip,
  Progress,
  Spin,
} from 'antd';
import apiClient from '../../../services/api';
import {
  PlusOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  MailOutlined,
  MobileOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import './Reminders.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'completed' | 'snoozed' | 'overdue';
  recurring: boolean;
  recurringPattern?: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  linkedTo?: {
    type: string;
    name: string;
    id: string;
  };
  createdBy: string;
  createdAt: string;
}

const Reminders: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [form] = Form.useForm();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/calendar/reminders');
      setReminders(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'processing';
      case 'snoozed': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const columns: ColumnsType<Reminder> = [
    {
      title: 'Reminder',
      key: 'reminder',
      render: (_, record) => (
        <div className="reminder-info">
          <div className="reminder-title">
            {record.title}
            {record.recurring && (
              <Tooltip title={`Repeats: ${record.recurringPattern}`}>
                <SyncOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
              </Tooltip>
            )}
          </div>
          <Text type="secondary" className="reminder-description">
            {record.description}
          </Text>
          {record.linkedTo && (
            <div className="linked-item">
              <Tag>{record.linkedTo.type}</Tag>
              <Text type="secondary">{record.linkedTo.name}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Due',
      key: 'due',
      width: 160,
      render: (_, record) => (
        <div className="due-info">
          <div>{dayjs(record.dueDate).format('MMM D, YYYY')}</div>
          <Text type="secondary">{record.dueTime}</Text>
        </div>
      ),
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'High', value: 'high' },
        { text: 'Medium', value: 'medium' },
        { text: 'Low', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      width: 100,
      render: (category) => <Tag>{category}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (status) => (
        <Badge status={getStatusColor(status)} text={status.charAt(0).toUpperCase() + status.slice(1)} />
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Completed', value: 'completed' },
        { text: 'Snoozed', value: 'snoozed' },
        { text: 'Overdue', value: 'overdue' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Notifications',
      key: 'notifications',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.notifications.email && (
            <Tooltip title="Email"><MailOutlined /></Tooltip>
          )}
          {record.notifications.push && (
            <Tooltip title="Push"><MobileOutlined /></Tooltip>
          )}
          {record.notifications.desktop && (
            <Tooltip title="Desktop"><DesktopOutlined /></Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status !== 'completed' && (
            <Tooltip title="Mark Complete">
              <Button type="text" icon={<CheckCircleOutlined />} />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => {
                setEditingReminder(record);
                setCreateModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this reminder?"
            onConfirm={() => console.log('Delete:', record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const overdueReminders = reminders.filter(r => r.status === 'overdue');
  const completedReminders = reminders.filter(r => r.status === 'completed');
  const todayReminders = reminders.filter(r => 
    dayjs(r.dueDate).isSame(dayjs(), 'day') && r.status !== 'completed'
  );

  return (
    <div className="reminders-page">
      <div className="page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>Reminders</Title>
          <Text type="secondary">Manage your reminders and notifications</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingReminder(null);
            form.resetFields();
            setCreateModalVisible(true);
          }}
        >
          Create Reminder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon pending">
              <ClockCircleOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{pendingReminders.length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon overdue">
              <ExclamationCircleOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{overdueReminders.length}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon today">
              <BellOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{todayReminders.length}</div>
              <div className="stat-label">Due Today</div>
            </div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon completed">
              <CheckCircleOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{completedReminders.length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueReminders.length > 0 && (
        <Card className="overdue-alert">
          <div className="alert-content">
            <ExclamationCircleOutlined className="alert-icon" />
            <div className="alert-text">
              <Text strong>You have {overdueReminders.length} overdue reminder(s)</Text>
              <Text type="secondary">These items require immediate attention</Text>
            </div>
            <Button type="primary" danger size="small">View All</Button>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="all">
          <Tabs.TabPane 
            tab={<span><BellOutlined /> All Reminders ({reminders.length})</span>} 
            key="all"
          >
            <Table
              columns={columns}
              dataSource={reminders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span><ClockCircleOutlined /> Pending ({pendingReminders.length})</span>} 
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={pendingReminders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span><ExclamationCircleOutlined /> Overdue ({overdueReminders.length})</span>} 
            key="overdue"
          >
            <Table
              columns={columns}
              dataSource={overdueReminders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span><CheckCircleOutlined /> Completed ({completedReminders.length})</span>} 
            key="completed"
          >
            <Table
              columns={columns}
              dataSource={completedReminders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span><SyncOutlined /> Recurring</span>} 
            key="recurring"
          >
            <Table
              columns={columns}
              dataSource={reminders.filter(r => r.recurring)}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingReminder ? 'Edit Reminder' : 'Create Reminder'}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingReminder || {
            priority: 'medium',
            notifications: { email: true, push: true, desktop: true },
            recurring: false,
          }}
          onFinish={(values) => {
            console.log('Save reminder:', values);
            setCreateModalVisible(false);
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="What do you need to remember?" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Add more details..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="dueDate"
              label="Due Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="dueTime"
              label="Due Time"
              rules={[{ required: true, message: 'Please select a time' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="priority" label="Priority">
              <Select>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="category" label="Category">
              <Select>
                <Select.Option value="Finance">Finance</Select.Option>
                <Select.Option value="Sales">Sales</Select.Option>
                <Select.Option value="HR">HR</Select.Option>
                <Select.Option value="IT">IT</Select.Option>
                <Select.Option value="Meeting">Meeting</Select.Option>
                <Select.Option value="Personal">Personal</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="Recurring">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Form.Item name="recurring" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <Form.Item name="recurringPattern" noStyle>
                <Select placeholder="Select pattern" style={{ width: 150 }}>
                  <Select.Option value="Daily">Daily</Select.Option>
                  <Select.Option value="Weekly">Weekly</Select.Option>
                  <Select.Option value="Monthly">Monthly</Select.Option>
                  <Select.Option value="Yearly">Yearly</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item label="Notifications">
            <Space size="large">
              <Form.Item name={['notifications', 'email']} valuePropName="checked" noStyle>
                <Switch checkedChildren={<MailOutlined />} unCheckedChildren={<MailOutlined />} />
              </Form.Item>
              <Text type="secondary">Email</Text>
              
              <Form.Item name={['notifications', 'push']} valuePropName="checked" noStyle>
                <Switch checkedChildren={<MobileOutlined />} unCheckedChildren={<MobileOutlined />} />
              </Form.Item>
              <Text type="secondary">Push</Text>
              
              <Form.Item name={['notifications', 'desktop']} valuePropName="checked" noStyle>
                <Switch checkedChildren={<DesktopOutlined />} unCheckedChildren={<DesktopOutlined />} />
              </Form.Item>
              <Text type="secondary">Desktop</Text>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingReminder ? 'Update' : 'Create'} Reminder
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reminders;
