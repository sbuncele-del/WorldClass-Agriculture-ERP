/**
 * Projects Dashboard
 * Overview of all projects with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, 
  Space, Avatar, Tooltip, Dropdown, Badge, Tabs, Empty
} from 'antd';
import {
  FolderKanban, 
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  KanbanSquare,
  GanttChartSquare,
  ListTodo,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';
import type { MenuProps } from 'antd';
import { apiFetch } from '../../../utils/api';
import './ProjectsDashboard.css';

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
  teamSize: number;
  tasksTotal: number;
  tasksCompleted: number;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  team: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  tags: string[];
  lastActivity: string;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalHoursLogged: number;
  averageProgress: number;
}

const statusColors: Record<string, string> = {
  planning: 'blue',
  active: 'green',
  'on-hold': 'orange',
  completed: 'cyan',
  cancelled: 'red'
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red'
};

const ProjectsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats from API
      const statsResponse = await apiFetch('/api/projects/stats');
      if (statsResponse) {
        setStats({
          totalProjects: statsResponse.totalProjects || 0,
          activeProjects: statsResponse.activeProjects || 0,
          completedProjects: statsResponse.completedProjects || 0,
          overdueProjects: statsResponse.overdueProjects || 0,
          totalTasks: statsResponse.totalTasks || 0,
          completedTasks: statsResponse.completedTasks || 0,
          totalHoursLogged: statsResponse.totalHoursLogged || 0,
          averageProgress: statsResponse.averageProgress || 0
        });
      }

      // Fetch projects from API
      const projectsResponse = await apiFetch('/api/projects/list');
      const projectsData = projectsResponse?.projects || projectsResponse || [];
      setProjects(projectsData.map((p: any) => ({
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
        teamSize: p.teamSize || p.team_size || 0,
        tasksTotal: p.tasksTotal || p.tasks_total || 0,
        tasksCompleted: p.tasksCompleted || p.tasks_completed || 0,
        owner: p.owner || { id: '', name: 'Unassigned' },
        team: p.team || [],
        tags: p.tags || [],
        lastActivity: p.lastActivity || p.last_activity || ''
      })));
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const projectActions = (project: Project): MenuProps['items'] => [
    { key: 'view', label: 'View Details', onClick: () => navigate(`/projects/${project.id}`) },
    { key: 'edit', label: 'Edit Project' },
    { key: 'tasks', label: 'View Tasks', onClick: () => navigate(`/projects/${project.id}/tasks`) },
    { key: 'gantt', label: 'Gantt Chart', onClick: () => navigate(`/projects/gantt?project=${project.id}`) },
    { type: 'divider' as const },
    { key: 'archive', label: 'Archive Project', danger: true }
  ];

  const columns = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Project) => (
        <div className="project-name-cell">
          <Link to={`/projects/${record.id}`} className="project-link">
            <strong>{name}</strong>
          </Link>
          <div className="project-tags">
            {record.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: '10px' }}>{tag}</Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>{priority.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={progress === 100 ? 'success' : 'active'}
          strokeColor={progress < 30 ? '#ff4d4f' : progress < 70 ? '#faad14' : '#52c41a'}
        />
      )
    },
    {
      title: 'Tasks',
      key: 'tasks',
      render: (_: any, record: Project) => (
        <span>{record.tasksCompleted}/{record.tasksTotal}</span>
      )
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: (team: Project['team']) => (
        <Avatar.Group maxCount={3} size="small">
          {team.map(member => (
            <Tooltip key={member.id} title={member.name}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>
                {member.name.charAt(0)}
              </Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Dropdown menu={{ items: projectActions(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreVertical size={16} />} />
        </Dropdown>
      )
    }
  ];

  return (
    <div className="projects-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1><FolderKanban size={28} /> Project Management</h1>
          <p>Track projects, manage tasks, and collaborate with your team</p>
        </div>
        <div className="header-actions">
          <Button icon={<Search size={16} />}>Search</Button>
          <Button icon={<Filter size={16} />}>Filter</Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate('/projects/new')}>
            New Project
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Projects"
              value={stats?.totalProjects || 0}
              prefix={<FolderKanban size={20} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card active">
            <Statistic
              title="Active Projects"
              value={stats?.activeProjects || 0}
              prefix={<TrendingUp size={20} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Tasks Completed"
              value={stats?.completedTasks || 0}
              suffix={`/ ${stats?.totalTasks || 0}`}
              prefix={<CheckCircle2 size={20} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card warning">
            <Statistic
              title="Overdue"
              value={stats?.overdueProjects || 0}
              prefix={<AlertTriangle size={20} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[16, 16]} className="quick-actions">
        <Col xs={24} sm={12} md={6}>
          <Card 
            className="action-card" 
            hoverable 
            onClick={() => navigate('/projects/board')}
          >
            <KanbanSquare size={32} />
            <span>Kanban Board</span>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            className="action-card" 
            hoverable 
            onClick={() => navigate('/projects/gantt')}
          >
            <GanttChartSquare size={32} />
            <span>Gantt Chart</span>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            className="action-card" 
            hoverable 
            onClick={() => navigate('/projects/milestones')}
          >
            <ListTodo size={32} />
            <span>Milestones</span>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            className="action-card" 
            hoverable 
            onClick={() => navigate('/projects/time-tracking')}
          >
            <Clock size={32} />
            <span>Time Tracking</span>
          </Card>
        </Col>
      </Row>

      {/* Projects Table */}
      <Card className="projects-table-card" title="All Projects">
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No projects yet"
              >
                <Button type="primary" icon={<Plus size={16} />}>
                  Create First Project
                </Button>
              </Empty>
            )
          }}
        />
      </Card>
    </div>
  );
};

export default ProjectsDashboard;
