import React, { useState, useEffect } from 'react';
import { 
  Card, Tabs, Button, Progress, Tag, Avatar, Timeline, Table, Space,
  Descriptions, Row, Col, Statistic, Dropdown, Modal, Form, Input, Select,
  DatePicker, message, Drawer, List, Upload, Spin
} from 'antd';
import { 
  ArrowLeftOutlined, EditOutlined, MoreOutlined, TeamOutlined,
  CalendarOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  FileTextOutlined, MessageOutlined, PaperClipOutlined, PlusOutlined,
  SettingOutlined, ExportOutlined, DeleteOutlined, UserAddOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../services/api';
import './ProjectDetails.css';

const { TabPane } = Tabs;
const { TextArea } = Input;

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

const statusColors = {
  'todo': 'default',
  'in-progress': 'processing',
  'done': 'success'
};

const priorityColors = {
  'low': 'default',
  'medium': 'blue',
  'high': 'orange'
};

const ProjectDetails: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const [teamDrawerVisible, setTeamDrawerVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch project details from API
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const [projectRes, tasksRes, teamRes] = await Promise.all([
          apiClient.get(`/api/projects/${projectId}`),
          apiClient.get(`/api/projects/${projectId}/tasks`),
          apiClient.get(`/api/projects/${projectId}/team`)
        ]);
        
        const projectData = projectRes.data?.project || projectRes.data || {};
        const tasks = tasksRes.data?.tasks || tasksRes.data || [];
        const team = teamRes.data?.members || teamRes.data || [];
        
        setProject({
          ...projectData,
          tasks,
          team,
          milestones: projectData.milestones || [],
          activities: projectData.activities || [],
          files: projectData.files || []
        });
      } catch (error) {
        console.error('Failed to fetch project:', error);
        message.error('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <h2>Project not found</h2>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    );
  }

  const taskColumns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => <span style={{ fontWeight: 500 }}>{title}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors]}>
          {status.replace('-', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: string) => (
        <Space>
          <Avatar size="small">{assignee[0]}</Avatar>
          {assignee}
        </Space>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority as keyof typeof priorityColors]}>
          {priority.toUpperCase()}
        </Tag>
      )
    }
  ];

  const handleAddTask = (values: any) => {
    message.success('Task added successfully');
    setAddTaskVisible(false);
    form.resetFields();
  };

  return (
    <div className="project-details">
      {/* Header */}
      <div className="details-header">
        <div className="header-left">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} />
          <div className="project-title-section">
            <div className="project-title-row">
              <h1>{project.name}</h1>
              <Tag color={project.status === 'active' ? 'green' : 'blue'}>{project.status.toUpperCase()}</Tag>
              <Tag color="orange">{project.priority.toUpperCase()} PRIORITY</Tag>
            </div>
            <div className="project-meta">
              <span><CalendarOutlined /> {project.startDate} - {project.endDate}</span>
              <span><TeamOutlined /> {project.team.length + 1} members</span>
              <span><FileTextOutlined /> {project.tasks.length} tasks</span>
            </div>
          </div>
        </div>
        <Space>
          <Button icon={<TeamOutlined />} onClick={() => setTeamDrawerVisible(true)}>Team</Button>
          <Button icon={<EditOutlined />}>Edit</Button>
          <Dropdown
            menu={{
              items: [
                { key: 'export', icon: <ExportOutlined />, label: 'Export Report' },
                { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true }
              ]
            }}
          >
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Progress" 
              value={project.progress} 
              suffix="%" 
              prefix={<CheckCircleOutlined />}
            />
            <Progress percent={project.progress} showInfo={false} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Tasks Completed" 
              value={project.tasks.filter(t => t.status === 'done').length} 
              suffix={`/ ${project.tasks.length}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Budget Used" 
              value={project.spent} 
              prefix={<DollarOutlined />}
              suffix={`/ $${project.budget.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Days Remaining" 
              value={Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card className="content-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Overview" key="overview">
            <Row gutter={24}>
              <Col span={16}>
                <div className="section">
                  <h3>Description</h3>
                  <p>{project.description}</p>
                </div>

                <div className="section">
                  <div className="section-header">
                    <h3>Recent Tasks</h3>
                    <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAddTaskVisible(true)}>
                      Add Task
                    </Button>
                  </div>
                  <Table 
                    columns={taskColumns} 
                    dataSource={project.tasks.slice(0, 5)} 
                    rowKey="id" 
                    pagination={false}
                    size="small"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div className="section">
                  <h3>Project Info</h3>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Client">{project.client}</Descriptions.Item>
                    <Descriptions.Item label="Category">{project.category}</Descriptions.Item>
                    <Descriptions.Item label="Manager">{project.manager.name}</Descriptions.Item>
                    <Descriptions.Item label="Start Date">{project.startDate}</Descriptions.Item>
                    <Descriptions.Item label="End Date">{project.endDate}</Descriptions.Item>
                  </Descriptions>
                </div>

                <div className="section">
                  <h3>Milestones</h3>
                  <Timeline>
                    {project.milestones.map(milestone => (
                      <Timeline.Item 
                        key={milestone.id}
                        color={milestone.status === 'completed' ? 'green' : milestone.status === 'in-progress' ? 'blue' : 'gray'}
                      >
                        <div className="milestone-item">
                          <span className="milestone-name">{milestone.name}</span>
                          <span className="milestone-date">{milestone.date}</span>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Tasks" key="tasks">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <Space>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Select.Option value="all">All Tasks</Select.Option>
                  <Select.Option value="todo">To Do</Select.Option>
                  <Select.Option value="in-progress">In Progress</Select.Option>
                  <Select.Option value="done">Done</Select.Option>
                </Select>
              </Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddTaskVisible(true)}>
                Add Task
              </Button>
            </div>
            <Table 
              columns={taskColumns} 
              dataSource={project.tasks} 
              rowKey="id"
            />
          </TabPane>

          <TabPane tab="Activity" key="activity">
            <List
              itemLayout="horizontal"
              dataSource={project.activities}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.user[0]}</Avatar>}
                    title={<><strong>{item.user}</strong> {item.action}</>}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane tab="Files" key="files">
            <div className="section-header" style={{ marginBottom: 16 }}>
              <span>{project.files.length} files</span>
              <Upload>
                <Button icon={<PaperClipOutlined />}>Upload File</Button>
              </Upload>
            </div>
            <List
              itemLayout="horizontal"
              dataSource={project.files}
              renderItem={item => (
                <List.Item
                  actions={[<Button type="link">Download</Button>]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={item.name}
                    description={`${item.size} • Uploaded by ${item.uploadedBy} on ${item.date}`}
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Add Task Modal */}
      <Modal
        title="Add New Task"
        open={addTaskVisible}
        onCancel={() => setAddTaskVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddTask}>
          <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
            <Input placeholder="Enter task title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee" label="Assignee">
                <Select placeholder="Select assignee">
                  {[project.manager, ...project.team].map(member => (
                    <Select.Option key={member.id} value={member.id}>{member.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <Select placeholder="Select priority">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddTaskVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Add Task</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Team Drawer */}
      <Drawer
        title="Project Team"
        placement="right"
        width={400}
        open={teamDrawerVisible}
        onClose={() => setTeamDrawerVisible(false)}
        extra={<Button type="primary" icon={<UserAddOutlined />}>Add Member</Button>}
      >
        <List
          itemLayout="horizontal"
          dataSource={[project.manager, ...project.team]}
          renderItem={item => (
            <List.Item
              actions={[<Button type="link" size="small">Remove</Button>]}
            >
              <List.Item.Meta
                avatar={<Avatar size="large">{item.name[0]}</Avatar>}
                title={item.name}
                description={
                  <>
                    <div>{item.role}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>{item.email}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default ProjectDetails;
