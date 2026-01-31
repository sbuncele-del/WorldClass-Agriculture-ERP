import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Input, Select, Tag, Progress, Avatar, 
  Dropdown, Modal, Form, DatePicker, message, Card, Row, Col 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, FilterOutlined, MoreOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, TeamOutlined,
  CalendarOutlined, FolderOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../../../services/api';
import './ProjectsList.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  manager: { name: string; avatar?: string };
  team: { name: string; avatar?: string }[];
  tasksCompleted: number;
  totalTasks: number;
  client?: string;
  category: string;
}

const statusColors = {
  'planning': { color: 'blue', label: 'Planning' },
  'active': { color: 'green', label: 'Active' },
  'on-hold': { color: 'orange', label: 'On Hold' },
  'completed': { color: 'default', label: 'Completed' },
  'cancelled': { color: 'red', label: 'Cancelled' }
};

const priorityColors = {
  'low': { color: 'default', label: 'Low' },
  'medium': { color: 'blue', label: 'Medium' },
  'high': { color: 'orange', label: 'High' },
  'critical': { color: 'red', label: 'Critical' }
};

const ProjectsList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiClient.get('/api/projects/list');
        const data = response.data?.projects || response.data || [];
        setProjects(data.map((p: any) => ({
          id: p.id || p.project_id,
          name: p.name || p.project_name,
          description: p.description || '',
          status: p.status || 'planning',
          priority: p.priority || 'medium',
          progress: p.progress || 0,
          startDate: p.startDate || p.start_date || '',
          endDate: p.endDate || p.end_date || '',
          budget: p.budget || 0,
          spent: p.spent || 0,
          manager: p.manager || { name: 'Unassigned' },
          team: p.team || [],
          tasksCompleted: p.tasksCompleted || p.tasks_completed || 0,
          totalTasks: p.totalTasks || p.total_tasks || 0,
          client: p.client || '',
          category: p.category || 'General'
        })));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);
  const [form] = Form.useForm();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (values: any) => {
    const newProject: Project = {
      id: String(Date.now()),
      name: values.name,
      description: values.description,
      status: 'planning',
      priority: values.priority,
      progress: 0,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      budget: values.budget,
      spent: 0,
      manager: { name: 'Current User' },
      team: [],
      tasksCompleted: 0,
      totalTasks: 0,
      category: values.category
    };
    setProjects([newProject, ...projects]);
    setCreateModalVisible(false);
    form.resetFields();
    message.success('Project created successfully');
  };

  const handleDeleteProject = (id: string) => {
    Modal.confirm({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        setProjects(projects.filter(p => p.id !== id));
        message.success('Project deleted');
      }
    });
  };

  const columns: ColumnsType<Project> = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="project-info">
          <div className="project-icon" style={{ background: record.status === 'active' ? '#52c41a' : '#1890ff' }}>
            <FolderOutlined />
          </div>
          <div>
            <div className="project-name">{name}</div>
            <div className="project-category">{record.category}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status as keyof typeof statusColors].color}>
          {statusColors[status as keyof typeof statusColors].label}
        </Tag>
      ),
      filters: Object.entries(statusColors).map(([key, value]) => ({ text: value.label, value: key })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priorityColors[priority as keyof typeof priorityColors].color}>
          {priorityColors[priority as keyof typeof priorityColors].label}
        </Tag>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress, record) => (
        <div className="progress-cell">
          <Progress percent={progress} size="small" strokeColor={progress === 100 ? '#52c41a' : '#1890ff'} />
          <span className="progress-tasks">{record.tasksCompleted}/{record.totalTasks} tasks</span>
        </div>
      ),
      sorter: (a, b) => a.progress - b.progress
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: (team, record) => (
        <Avatar.Group maxCount={3} size="small">
          <Avatar style={{ backgroundColor: '#1890ff' }}>{record.manager.name[0]}</Avatar>
          {team.map((member: any, idx: number) => (
            <Avatar key={idx} style={{ backgroundColor: '#52c41a' }}>{member.name[0]}</Avatar>
          ))}
        </Avatar.Group>
      )
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => (
        <div className="timeline-cell">
          <CalendarOutlined style={{ marginRight: 8, color: '#999' }} />
          <span>{record.startDate} - {record.endDate}</span>
        </div>
      )
    },
    {
      title: 'Budget',
      key: 'budget',
      render: (_, record) => (
        <div className="budget-cell">
          <div className="budget-spent">${record.spent.toLocaleString()} / ${record.budget.toLocaleString()}</div>
          <Progress 
            percent={Math.round((record.spent / record.budget) * 100)} 
            size="small" 
            showInfo={false}
            strokeColor={(record.spent / record.budget) > 0.9 ? '#ff4d4f' : '#1890ff'}
          />
        </div>
      ),
      sorter: (a, b) => a.budget - b.budget
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'View Details', onClick: () => navigate(`/projects/${record.id}`) },
              { key: 'edit', icon: <EditOutlined />, label: 'Edit Project' },
              { key: 'team', icon: <TeamOutlined />, label: 'Manage Team' },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDeleteProject(record.id) }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ];

  // Summary stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: projects.reduce((sum, p) => sum + p.spent, 0)
  };

  return (
    <div className="projects-list">
      {/* Summary Cards */}
      <Row gutter={[16, 16]} className="summary-row">
        <Col xs={12} sm={6}>
          <Card className="summary-card">
            <div className="summary-value">{stats.total}</div>
            <div className="summary-label">Total Projects</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="summary-card">
            <div className="summary-value" style={{ color: '#52c41a' }}>{stats.active}</div>
            <div className="summary-label">Active</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="summary-card">
            <div className="summary-value">{stats.completed}</div>
            <div className="summary-label">Completed</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="summary-card">
            <div className="summary-value">${(stats.totalBudget / 1000).toFixed(0)}K</div>
            <div className="summary-label">Total Budget</div>
          </Card>
        </Col>
      </Row>

      {/* Header */}
      <div className="list-header">
        <h1>All Projects</h1>
        <Space>
          <Input
            placeholder="Search projects..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(statusColors).map(([key, value]) => (
              <Option key={key} value={key}>{value.label}</Option>
            ))}
          </Select>
          <Button icon={<FilterOutlined />}>More Filters</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            New Project
          </Button>
        </Space>
      </div>

      {/* Projects Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/projects/${record.id}`),
            style: { cursor: 'pointer' }
          })}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} projects`
          }}
        />
      </Card>

      {/* Create Project Modal */}
      <Modal
        title="Create New Project"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true }]}>
            <Input placeholder="Enter project name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Project description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  <Option value="Development">Development</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Operations">Operations</Option>
                  <Option value="Infrastructure">Infrastructure</Option>
                  <Option value="Research">Research</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select placeholder="Select priority">
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                  <Option value="critical">Critical</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="Timeline" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="budget" label="Budget">
            <Input type="number" prefix="$" placeholder="0" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Project</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsList;
