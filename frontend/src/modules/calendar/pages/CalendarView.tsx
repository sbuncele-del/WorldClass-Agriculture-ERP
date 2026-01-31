import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Typography, Modal, Form, Input, Select, 
  DatePicker, TimePicker, Tag, Badge, Row, Col, List, Avatar, Checkbox, Spin
} from 'antd';
import apiClient from '../../../services/api';
import { 
  PlusOutlined, LeftOutlined, RightOutlined, CalendarOutlined,
  ClockCircleOutlined, TeamOutlined, VideoCameraOutlined, EnvironmentOutlined,
  BellOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import './CalendarView.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'task' | 'reminder' | 'holiday' | 'project';
  color: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  recurring?: boolean;
}

const typeColors = {
  meeting: '#1890ff',
  task: '#fa541c',
  reminder: '#faad14',
  holiday: '#52c41a',
  project: '#722ed1'
};

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/calendar/events');
      const eventsData = response.data?.data || response.data || [];
      // Convert date strings to Date objects
      const parsedEvents = eventsData.map((event: any) => ({
        ...event,
        start: new Date(event.start || event.start_date),
        end: new Date(event.end || event.end_date)
      }));
      setEvents(parsedEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (values: any) => {
    try {
      setSaving(true);
      const [startDate, endDate] = values.dateRange;
      
      const eventData = {
        title: values.title,
        description: values.description || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: values.location || '',
        eventType: values.type,
        attendees: values.attendees || [],
        reminders: values.reminder ? [{ minutesBefore: parseInt(values.reminder) }] : [],
        isAllDay: false
      };

      await apiClient.post('/api/calendar/events', eventData);
      
      // Refresh events list
      await fetchEvents();
      
      // Close modal and reset form
      setCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get days for current view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    
    for (let i = 0; i < 7; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), diff + i));
    }
    
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  // Upcoming events
  const upcomingEvents = events
    .filter(e => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  return (
    <div className="calendar-view">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-left">
          <Title level={2} style={{ margin: 0 }}>Calendar</Title>
          <Space>
            <Button.Group>
              <Button icon={<LeftOutlined />} onClick={() => navigateDate('prev')} />
              <Button onClick={goToToday}>Today</Button>
              <Button icon={<RightOutlined />} onClick={() => navigateDate('next')} />
            </Button.Group>
            <Text strong style={{ fontSize: 18, marginLeft: 16 }}>
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric',
                ...(viewMode === 'day' && { day: 'numeric' })
              })}
            </Text>
          </Space>
        </div>
        <Space>
          <Button.Group>
            <Button 
              type={viewMode === 'day' ? 'primary' : 'default'}
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button 
              type={viewMode === 'week' ? 'primary' : 'default'}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button 
              type={viewMode === 'month' ? 'primary' : 'default'}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </Button.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            New Event
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        {/* Calendar Grid */}
        <Col xs={24} lg={18}>
          <Card className="calendar-card">
            {/* Week View / Day View */}
            {(viewMode === 'week' || viewMode === 'day') && (
              <div className="week-view">
                {/* Header */}
                <div className="week-header">
                  <div className="time-gutter"></div>
                  {(viewMode === 'day' ? [currentDate] : days).map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`day-header ${day.toDateString() === new Date().toDateString() ? 'today' : ''}`}
                    >
                      <div className="day-name">{dayNames[day.getDay()]}</div>
                      <div className="day-number">{day.getDate()}</div>
                    </div>
                  ))}
                </div>
                
                {/* Time Grid */}
                <div className="time-grid">
                  {hours.map(hour => (
                    <div key={hour} className="time-row">
                      <div className="time-label">
                        {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                      </div>
                      {(viewMode === 'day' ? [currentDate] : days).map((day, dayIdx) => {
                        const dayEvents = getEventsForDay(day).filter(e => {
                          const eventHour = new Date(e.start).getHours();
                          return eventHour === hour;
                        });
                        
                        return (
                          <div key={dayIdx} className="time-cell">
                            {dayEvents.map(event => (
                              <div 
                                key={event.id}
                                className="event-block"
                                style={{ backgroundColor: event.color }}
                                onClick={() => setSelectedEvent(event)}
                              >
                                <div className="event-time">{formatTime(event.start)}</div>
                                <div className="event-title">{event.title}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Month View */}
            {viewMode === 'month' && (
              <div className="month-view">
                {/* Day Names */}
                <div className="month-header">
                  {dayNames.map(name => (
                    <div key={name} className="day-name-header">{name}</div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="month-grid">
                  {days.map((day, idx) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div 
                        key={idx} 
                        className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                      >
                        <div className="cell-date">{day.getDate()}</div>
                        <div className="cell-events">
                          {dayEvents.slice(0, 3).map(event => (
                            <div 
                              key={event.id}
                              className="event-dot"
                              style={{ backgroundColor: event.color }}
                              onClick={() => setSelectedEvent(event)}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="more-events">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={6}>
          {/* Mini Calendar */}
          <Card title="Quick Date" size="small" style={{ marginBottom: 16 }}>
            <DatePicker 
              style={{ width: '100%' }}
              value={null}
              onChange={(date) => date && setCurrentDate(date.toDate())}
            />
          </Card>

          {/* Upcoming Events */}
          <Card title="Upcoming Events" size="small" style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={upcomingEvents}
              renderItem={event => (
                <List.Item 
                  className="upcoming-event"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="event-indicator" style={{ backgroundColor: event.color }} />
                  <div className="event-info">
                    <Text strong className="event-name">{event.title}</Text>
                    <Text type="secondary" className="event-time-text">
                      {new Date(event.start).toLocaleDateString()} • {formatTime(event.start)}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* Legend */}
          <Card title="Categories" size="small">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Badge color={color} />
                <Text style={{ textTransform: 'capitalize' }}>{type}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Event Detail Modal */}
      <Modal
        title={selectedEvent?.title}
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={[
          <Button key="edit" icon={<EditOutlined />}>Edit</Button>,
          <Button key="delete" danger icon={<DeleteOutlined />}>Delete</Button>,
          <Button key="close" type="primary" onClick={() => setSelectedEvent(null)}>Close</Button>
        ]}
      >
        {selectedEvent && (
          <div className="event-details">
            <div className="detail-row">
              <ClockCircleOutlined />
              <span>
                {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                {selectedEvent.recurring && <Tag style={{ marginLeft: 8 }}>Recurring</Tag>}
              </span>
            </div>
            {selectedEvent.location && (
              <div className="detail-row">
                <EnvironmentOutlined />
                <span>{selectedEvent.location}</span>
              </div>
            )}
            {selectedEvent.attendees && (
              <div className="detail-row">
                <TeamOutlined />
                <Avatar.Group maxCount={5} size="small">
                  {selectedEvent.attendees.map((a, i) => (
                    <Avatar key={i}>{a[0]}</Avatar>
                  ))}
                </Avatar.Group>
              </div>
            )}
            {selectedEvent.description && (
              <div className="detail-row">
                <Text>{selectedEvent.description}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Event Modal */}
      <Modal
        title="Create New Event"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateEvent}>
          <Form.Item name="title" label="Event Title" rules={[{ required: true }]}>
            <Input placeholder="Add title" />
          </Form.Item>
          <Form.Item name="type" label="Event Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="task">Task</Select.Option>
              <Select.Option value="reminder">Reminder</Select.Option>
              <Select.Option value="project">Project Milestone</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="Date & Time" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input prefix={<EnvironmentOutlined />} placeholder="Add location or video link" />
          </Form.Item>
          <Form.Item name="attendees" label="Attendees">
            <Select mode="tags" placeholder="Add attendees" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Add description" />
          </Form.Item>
          <Form.Item name="reminder" label="Reminder">
            <Select placeholder="Set reminder">
              <Select.Option value="5">5 minutes before</Select.Option>
              <Select.Option value="15">15 minutes before</Select.Option>
              <Select.Option value="30">30 minutes before</Select.Option>
              <Select.Option value="60">1 hour before</Select.Option>
              <Select.Option value="1440">1 day before</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={saving}>Create Event</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CalendarView;
