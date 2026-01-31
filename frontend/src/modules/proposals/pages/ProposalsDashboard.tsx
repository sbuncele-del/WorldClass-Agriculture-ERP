import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  Avatar,
  Dropdown,
  Alert,
  Spin,
} from 'antd';
import apiClient from '../../../services/api';
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  CopyOutlined,
  SendOutlined,
  RiseOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FileExclamationOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import './ProposalsDashboard.css';

const { Title, Text } = Typography;

interface Proposal {
  id: string;
  title: string;
  client: string;
  clientAvatar?: string;
  value: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  expiresAt?: string;
  template: string;
  owner: string;
}

const ProposalsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProposals: 0,
    openProposals: 0,
    acceptedValue: 0,
    winRate: 0,
    avgTimeToClose: 0,
    viewedToday: 0,
  });
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, proposalsRes] = await Promise.all([
          apiClient.get('/api/proposals/stats'),
          apiClient.get('/api/proposals/recent'),
        ]);
        setStats(statsRes.data || {
          totalProposals: 0,
          openProposals: 0,
          acceptedValue: 0,
          winRate: 0,
          avgTimeToClose: 0,
          viewedToday: 0,
        });
        setRecentProposals(proposalsRes.data || []);
      } catch (error) {
        console.error('Failed to fetch proposals dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'processing';
      case 'viewed': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileTextOutlined />;
      case 'sent': return <SendOutlined />;
      case 'viewed': return <EyeOutlined />;
      case 'accepted': return <CheckCircleOutlined />;
      case 'declined': return <FileExclamationOutlined />;
      case 'expired': return <ClockCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const columns: ColumnsType<Proposal> = [
    {
      title: 'Proposal',
      key: 'proposal',
      render: (_, record) => (
        <div className="proposal-cell">
          <div className="proposal-title">{record.title}</div>
          <div className="proposal-client">
            <Avatar size="small">{record.client[0]}</Avatar>
            <span>{record.client}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => (
        <Text strong>${value.toLocaleString()}</Text>
      ),
      sorter: (a, b) => a.value - b.value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          { key: 'view', label: 'View', icon: <EyeOutlined /> },
          { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
          { key: 'duplicate', label: 'Duplicate', icon: <CopyOutlined /> },
          { type: 'divider' },
          { key: 'send', label: 'Send to Client', icon: <SendOutlined /> },
        ];

        return (
          <Space>
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/proposals/preview/${record.id}`)}
            />
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/proposals/edit/${record.id}`)}
            />
            <Dropdown menu={{ items: menuItems }}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // Pipeline breakdown
  const pipeline = [
    { stage: 'Draft', count: 8, value: 156000, color: '#8c8c8c' },
    { stage: 'Sent', count: 12, value: 324000, color: '#1890ff' },
    { stage: 'Viewed', count: 6, value: 198000, color: '#faad14' },
    { stage: 'Negotiating', count: 4, value: 145000, color: '#722ed1' },
  ];

  const totalPipelineValue = pipeline.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="proposals-dashboard">
      {/* World-Class Builder Promo Banner */}
      <Card 
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, #1e3a5f 0%, #722ed1 100%)',
          border: 'none'
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <RocketOutlined style={{ fontSize: 32, color: 'white' }} />
              </div>
              <div>
                <Space align="center" style={{ marginBottom: 4 }}>
                  <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
                    World-Class Proposal Builder
                  </Typography.Title>
                  <Tag color="gold" icon={<StarFilled />}>NEW</Tag>
                </Space>
                <Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  5-Phase intelligent workflow: Intake → AI Content → Design → Collaboration → Delivery
                </Typography.Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                size="large"
                ghost
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
                onClick={() => navigate('/proposals/builder')}
              >
                Learn More
              </Button>
              <Button 
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={() => navigate('/proposals/builder')}
                style={{ 
                  background: '#52c41a', 
                  borderColor: '#52c41a',
                  fontWeight: 600
                }}
              >
                Start Building
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Featured Pitch Decks */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card hoverable onClick={() => navigate('/proposals/pitch/coffee')} style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <Space align="start">
              <div style={{ width: 48, height: 48, background: '#d4a855', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>☕</div>
              <div>
                <Title level={5} style={{ margin: 0 }}>Coffee Value Chain Pitch</Title>
                <Text type="secondary">Eswatini Coffee Investment Deck</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card hoverable onClick={() => navigate('/proposals/pitch/siyabusa')} style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
            <Space align="start">
              <div style={{ width: 48, height: 48, background: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff' }}>🚀</div>
              <div>
                <Title level={5} style={{ margin: 0 }}>SiyaBusa ERP Pitch</Title>
                <Text type="secondary">Investment & Growth Deck</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <div className="page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>Proposal Builder</Title>
          <Text type="secondary">Create winning proposals with professional templates</Text>
        </div>
        <Space>
          <Button onClick={() => navigate('/proposals/templates')}>
            Browse Templates
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/proposals/new')}
          >
            Create Proposal
          </Button>
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Total Proposals"
              value={stats.totalProposals}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Open Proposals"
              value={stats.openProposals}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Accepted Value"
              value={stats.acceptedValue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `$${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Win Rate"
              value={stats.winRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Avg. Days to Close"
              value={stats.avgTimeToClose}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="Viewed Today"
              value={stats.viewedToday}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Pipeline */}
        <Col xs={24} lg={8}>
          <Card title="Proposal Pipeline" className="pipeline-card">
            <div className="pipeline-total">
              <Text type="secondary">Total Pipeline Value</Text>
              <Title level={3} style={{ margin: 0 }}>
                ${totalPipelineValue.toLocaleString()}
              </Title>
            </div>
            <div className="pipeline-stages">
              {pipeline.map((stage) => (
                <div key={stage.stage} className="pipeline-stage">
                  <div className="stage-header">
                    <div className="stage-info">
                      <div 
                        className="stage-dot" 
                        style={{ background: stage.color }}
                      />
                      <Text>{stage.stage}</Text>
                      <Tag>{stage.count}</Tag>
                    </div>
                    <Text strong>${stage.value.toLocaleString()}</Text>
                  </div>
                  <Progress 
                    percent={(stage.value / totalPipelineValue) * 100} 
                    showInfo={false}
                    strokeColor={stage.color}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" className="quick-actions-card">
            <div className="quick-actions">
              <Button 
                icon={<PlusOutlined />} 
                block
                onClick={() => navigate('/proposals/new')}
              >
                New Proposal
              </Button>
              <Button 
                icon={<FileDoneOutlined />} 
                block
                onClick={() => navigate('/proposals/templates')}
              >
                Use Template
              </Button>
              <Button 
                icon={<DollarOutlined />} 
                block
                onClick={() => navigate('/proposals/pricing')}
              >
                Pricing Library
              </Button>
            </div>
          </Card>
        </Col>

        {/* Recent Proposals */}
        <Col xs={24} lg={16}>
          <Card 
            title="Recent Proposals" 
            extra={
              <Button type="link" onClick={() => navigate('/proposals/list')}>
                View All
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={recentProposals}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProposalsDashboard;
