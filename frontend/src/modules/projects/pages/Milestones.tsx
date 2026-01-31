import React, { useState, useEffect } from 'react';
import { 
  Card, Timeline, Button, Space, Select, Tag, Progress, Modal, 
  Form, Input, DatePicker, message, Row, Col, Statistic, Avatar
} from 'antd';
import { 
  PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  FlagOutlined, CalendarOutlined, EditOutlined, DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import './Milestones.css';

interface Milestone {
  id: string;
  name: string;
  description: string;
  project: string;
  projectColor: string;
  date: string;
  status: 'completed' | 'in-progress' | 'upcoming' | 'overdue';
  progress: number;
  assignee: string;
  tasks: { total: number; completed: number };
}

const statusConfig = {
  'completed': { color: 'success', icon: <CheckCircleOutlined />, label: 'Completed' },
  'in-progress': { color: 'processing', icon: <ClockCircleOutlined />, label: 'In Progress' },
  'upcoming': { color: 'default', icon: <FlagOutlined />, label: 'Upcoming' },
  'overdue': { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Overdue' }
};

const Milestones: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch milestones from API
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await fetch('/api/projects/milestones', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMilestones(data.milestones || data.data || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch milestones:', error);
      }
    };
    fetchMilestones();
  }, []);

  const projects = [...new Set(milestones.map(m => m.project))];

  const filteredMilestones = milestones.filter(m => {
    const matchesProject = !projectFilter || m.project === projectFilter;
    const matchesStatus = !statusFilter || m.status === statusFilter;
    return matchesProject && matchesStatus;
  });

  // Stats
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.status === 'completed').length,
    inProgress: milestones.filter(m => m.status === 'in-progress').length,
    overdue: milestones.filter(m => m.status === 'overdue').length
  };

  const handleCreate = (values: any) => {
    const newMilestone: Milestone = {
      id: String(Date.now()),
      name: values.name,
      description: values.description,
      project: values.project,
      projectColor: projects.find(p => p === values.project) ? '#1890ff' : '#52c41a',
      date: values.date.format('YYYY-MM-DD'),
      status: 'upcoming',
      progress: 0,
      assignee: values.assignee || 'Unassigned',
      tasks: { total: 0, completed: 0 }
    };
    setMilestones([...milestones, newMilestone]);
    setCreateModalVisible(false);
    form.resetFields();
    message.success('Milestone created');
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Milestone',
      content: 'Are you sure you want to delete this milestone?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setMilestones(milestones.filter(m => m.id !== id));
        message.success('Milestone deleted');
      }
    });
  };

  // Group by timeline
  const upcomingMilestones = filteredMilestones.filter(m => m.status === 'upcoming' || m.status === 'in-progress' || m.status === 'overdue');
  const completedMilestones = filteredMilestones.filter(m => m.status === 'completed');

  return (
    <div className="milestones-page">
      {/* Header */}
      <div className="page-header">
        <h1>Milestones</h1>
        <Space>
          <Select
            placeholder="All Projects"
            allowClear
            style={{ width: 180 }}
            value={projectFilter}
            onChange={setProjectFilter}
          >
            {projects.map(p => <Select.Option key={p} value={p}>{p}</Select.Option>)}
          </Select>
          <Select
            placeholder="All Status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(statusConfig).map(([key, config]) => (
              <Select.Option key={key} value={key}>{config.label}</Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            Add Milestone
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Milestones" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Completed" value={stats.completed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="In Progress" value={stats.inProgress} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Overdue" value={stats.overdue} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Upcoming / In Progress */}
        <Col xs={24} lg={12}>
          <Card title="Upcoming & Active" className="milestones-card">
            <Timeline>
              {upcomingMilestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(milestone => (
                <Timeline.Item
                  key={milestone.id}
                  color={statusConfig[milestone.status].color === 'error' ? 'red' : 
                         statusConfig[milestone.status].color === 'processing' ? 'blue' : 'gray'}
                >
                  <div className="milestone-card">
                    <div className="milestone-header">
                      <div className="milestone-title-row">
                        <span className="milestone-indicator" style={{ backgroundColor: milestone.projectColor }} />
                        <span className="milestone-name">{milestone.name}</span>
                        <Tag color={statusConfig[milestone.status].color}>
                          {statusConfig[milestone.status].label}
                        </Tag>
                      </div>
                      <Space>
                        <Button type="text" size="small" icon={<EditOutlined />} />
                        <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(milestone.id)} />
                      </Space>
                    </div>
                    <p className="milestone-description">{milestone.description}</p>
                    <div className="milestone-meta">
                      <span><CalendarOutlined /> {milestone.date}</span>
                      <span><Avatar size="small">{milestone.assignee[0]}</Avatar> {milestone.assignee}</span>
                    </div>
                    <div className="milestone-project">{milestone.project}</div>
                    {milestone.status === 'in-progress' && (
                      <div className="milestone-progress">
                        <Progress percent={milestone.progress} size="small" />
                        <span className="progress-tasks">
                          {milestone.tasks.completed}/{milestone.tasks.total} tasks
                        </span>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
            {upcomingMilestones.length === 0 && (
              <div className="empty-state">No upcoming milestones</div>
            )}
          </Card>
        </Col>

        {/* Completed */}
        <Col xs={24} lg={12}>
          <Card title="Completed" className="milestones-card">
            <Timeline>
              {completedMilestones.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(milestone => (
                <Timeline.Item key={milestone.id} color="green">
                  <div className="milestone-card completed">
                    <div className="milestone-header">
                      <div className="milestone-title-row">
                        <span className="milestone-indicator" style={{ backgroundColor: milestone.projectColor }} />
                        <span className="milestone-name">{milestone.name}</span>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      </div>
                    </div>
                    <div className="milestone-meta">
                      <span><CalendarOutlined /> {milestone.date}</span>
                      <span>{milestone.project}</span>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
            {completedMilestones.length === 0 && (
              <div className="empty-state">No completed milestones</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Create Modal */}
      <Modal
        title="Create Milestone"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Milestone Name" rules={[{ required: true }]}>
            <Input placeholder="Enter milestone name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe this milestone" />
          </Form.Item>
          <Form.Item name="project" label="Project" rules={[{ required: true }]}>
            <Select placeholder="Select project">
              {projects.map(p => <Select.Option key={p} value={p}>{p}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Target Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assignee" label="Responsible Person">
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Milestones;
