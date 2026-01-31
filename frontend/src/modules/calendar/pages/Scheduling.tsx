import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Tag,
  Avatar,
  List,
  Divider,
  Tooltip,
  Radio,
  message,
  Spin,
} from 'antd';
import apiClient from '../../../services/api';
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LinkOutlined,
  CopyOutlined,
  ShareAltOutlined,
  SettingOutlined,
  CheckOutlined,
  GlobalOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './Scheduling.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface SchedulingLink {
  id: string;
  name: string;
  duration: number;
  type: 'one-on-one' | 'group' | 'round-robin';
  location: 'video' | 'phone' | 'in-person';
  description: string;
  url: string;
  color: string;
  isActive: boolean;
  bookings: number;
}

interface TimeSlot {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface UpcomingBooking {
  id: string;
  title: string;
  guest: string;
  guestEmail: string;
  date: string;
  time: string;
  duration: number;
  type: string;
}

const Scheduling: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedLink, setSelectedLink] = useState<SchedulingLink | null>(null);
  const [form] = Form.useForm();
  const [schedulingLinks, setSchedulingLinks] = useState<SchedulingLink[]>([]);
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedulingData();
  }, []);

  const fetchSchedulingData = async () => {
    try {
      setLoading(true);
      const [linksRes, availabilityRes, bookingsRes] = await Promise.all([
        apiClient.get('/api/calendar/scheduling-links'),
        apiClient.get('/api/calendar/availability'),
        apiClient.get('/api/calendar/bookings')
      ]);
      setSchedulingLinks(linksRes.data?.data || linksRes.data || []);
      setAvailability(availabilityRes.data?.data || availabilityRes.data || []);
      setUpcomingBookings(bookingsRes.data?.data || bookingsRes.data || []);
    } catch (error) {
      console.error('Error fetching scheduling data:', error);
      setSchedulingLinks([]);
      setAvailability([]);
      setUpcomingBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('Link copied to clipboard!');
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'video': return <VideoCameraOutlined />;
      case 'phone': return <PhoneOutlined />;
      case 'in-person': return <EnvironmentOutlined />;
      default: return <GlobalOutlined />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'one-on-one': return '1:1';
      case 'group': return 'Group';
      case 'round-robin': return 'Round Robin';
      default: return type;
    }
  };

  return (
    <div className="scheduling-page">
      <div className="page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>Scheduling</Title>
          <Text type="secondary">Create booking links and manage your availability</Text>
        </div>
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)}>
            Availability
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCreateModalVisible(true);
            }}
          >
            New Event Type
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Scheduling Links */}
        <Col xs={24} lg={16}>
          <Card title="Event Types" className="links-card">
            <div className="links-grid">
              {schedulingLinks.map((link) => (
                <Card 
                  key={link.id} 
                  className={`link-card ${!link.isActive ? 'inactive' : ''}`}
                  style={{ borderLeft: `4px solid ${link.color}` }}
                >
                  <div className="link-header">
                    <div className="link-info">
                      <div className="link-title">{link.name}</div>
                      <div className="link-meta">
                        <Tag>{link.duration} min</Tag>
                        <Tag>{getTypeLabel(link.type)}</Tag>
                        <span className="link-location">
                          {getLocationIcon(link.location)} {link.location}
                        </span>
                      </div>
                    </div>
                    <Switch 
                      checked={link.isActive} 
                      onChange={() => console.log('Toggle:', link.id)} 
                    />
                  </div>
                  <Paragraph type="secondary" className="link-description">
                    {link.description}
                  </Paragraph>
                  <div className="link-footer">
                    <div className="link-stats">
                      <CalendarOutlined /> {link.bookings} bookings
                    </div>
                    <Space>
                      <Tooltip title="Copy Link">
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<CopyOutlined />}
                          onClick={() => copyLink(link.url)}
                        />
                      </Tooltip>
                      <Tooltip title="Share">
                        <Button type="text" size="small" icon={<ShareAltOutlined />} />
                      </Tooltip>
                      <Button 
                        type="text" 
                        size="small"
                        onClick={() => {
                          setSelectedLink(link);
                          setCreateModalVisible(true);
                        }}
                      >
                        Edit
                      </Button>
                    </Space>
                  </div>
                  <div className="link-url">
                    <LinkOutlined />
                    <Text type="secondary" copyable={{ text: link.url }}>
                      {link.url.replace('https://', '')}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Upcoming Bookings */}
          <Card title="Upcoming Bookings" className="bookings-card">
            <List
              dataSource={upcomingBookings}
              renderItem={(booking) => (
                <List.Item className="booking-item">
                  <div className="booking-content">
                    <div className="booking-header">
                      <Text strong>{booking.title}</Text>
                      <Tag color="blue">{booking.duration} min</Tag>
                    </div>
                    <div className="booking-guest">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <div>{booking.guest}</div>
                        <Text type="secondary" className="booking-email">
                          {booking.guestEmail}
                        </Text>
                      </div>
                    </div>
                    <div className="booking-time">
                      <CalendarOutlined /> {dayjs(booking.date).format('MMM D, YYYY')}
                      <ClockCircleOutlined style={{ marginLeft: 12 }} /> {booking.time}
                    </div>
                  </div>
                </List.Item>
              )}
            />
            <Button type="link" block style={{ marginTop: 8 }}>
              View All Bookings
            </Button>
          </Card>

          {/* Quick Availability */}
          <Card title="Your Availability" className="availability-card">
            {availability.map((slot) => (
              <div key={slot.day} className={`day-slot ${!slot.enabled ? 'disabled' : ''}`}>
                <div className="day-name">{slot.day}</div>
                <div className="day-time">
                  {slot.enabled ? `${slot.startTime} - ${slot.endTime}` : 'Unavailable'}
                </div>
              </div>
            ))}
            <Button 
              type="link" 
              block 
              style={{ marginTop: 8 }}
              onClick={() => setSettingsModalVisible(true)}
            >
              Edit Availability
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Event Type Modal */}
      <Modal
        title={selectedLink ? 'Edit Event Type' : 'New Event Type'}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedLink(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={selectedLink || {
            duration: 30,
            type: 'one-on-one',
            location: 'video',
            color: '#1890ff',
            isActive: true,
          }}
          onFinish={(values) => {
            console.log('Save event type:', values);
            setCreateModalVisible(false);
            setSelectedLink(null);
          }}
        >
          <Form.Item
            name="name"
            label="Event Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., 30 Minute Meeting" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe what this meeting is about" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="duration" label="Duration (minutes)">
              <Select>
                <Select.Option value={15}>15 minutes</Select.Option>
                <Select.Option value={30}>30 minutes</Select.Option>
                <Select.Option value={45}>45 minutes</Select.Option>
                <Select.Option value={60}>60 minutes</Select.Option>
                <Select.Option value={90}>90 minutes</Select.Option>
                <Select.Option value={120}>2 hours</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="type" label="Meeting Type">
              <Select>
                <Select.Option value="one-on-one">One-on-One</Select.Option>
                <Select.Option value="group">Group</Select.Option>
                <Select.Option value="round-robin">Round Robin</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="location" label="Location">
            <Radio.Group>
              <Radio.Button value="video">
                <VideoCameraOutlined /> Video
              </Radio.Button>
              <Radio.Button value="phone">
                <PhoneOutlined /> Phone
              </Radio.Button>
              <Radio.Button value="in-person">
                <EnvironmentOutlined /> In Person
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="color" label="Color">
            <div className="color-picker">
              {['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2'].map((color) => (
                <div
                  key={color}
                  className="color-option"
                  style={{ background: color }}
                  onClick={() => form.setFieldValue('color', color)}
                >
                  {form.getFieldValue('color') === color && <CheckOutlined />}
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setCreateModalVisible(false);
                setSelectedLink(null);
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedLink ? 'Save Changes' : 'Create Event Type'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Availability Settings Modal */}
      <Modal
        title="Edit Availability"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSettingsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => setSettingsModalVisible(false)}>
            Save Changes
          </Button>,
        ]}
        width={500}
      >
        <div className="availability-settings">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Set your weekly availability for bookings
          </Text>
          {availability.map((slot, index) => (
            <div key={slot.day} className="availability-row">
              <Switch checked={slot.enabled} />
              <div className="day-label">{slot.day}</div>
              <TimePicker 
                format="HH:mm" 
                value={dayjs(slot.startTime, 'HH:mm')}
                disabled={!slot.enabled}
                style={{ width: 100 }}
              />
              <span>to</span>
              <TimePicker 
                format="HH:mm" 
                value={dayjs(slot.endTime, 'HH:mm')}
                disabled={!slot.enabled}
                style={{ width: 100 }}
              />
            </div>
          ))}
          <Divider />
          <Form.Item label="Buffer Time">
            <Select defaultValue={10} style={{ width: 200 }}>
              <Select.Option value={0}>No buffer</Select.Option>
              <Select.Option value={5}>5 minutes</Select.Option>
              <Select.Option value={10}>10 minutes</Select.Option>
              <Select.Option value={15}>15 minutes</Select.Option>
              <Select.Option value={30}>30 minutes</Select.Option>
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              Time between meetings
            </Text>
          </Form.Item>
          <Form.Item label="Minimum Notice">
            <Select defaultValue={60} style={{ width: 200 }}>
              <Select.Option value={0}>No minimum</Select.Option>
              <Select.Option value={60}>1 hour</Select.Option>
              <Select.Option value={120}>2 hours</Select.Option>
              <Select.Option value={240}>4 hours</Select.Option>
              <Select.Option value={1440}>24 hours</Select.Option>
            </Select>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              How much notice you need before a meeting
            </Text>
          </Form.Item>
        </div>
      </Modal>
    </div>
  );
};

export default Scheduling;
