import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Tag, List, Space, Spin } from 'antd';
import {
  DownloadOutlined,
  SyncOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CalendarOutlined,
  RiseOutlined,
  ToolOutlined,
  CarOutlined
} from '@ant-design/icons';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import './logistics-enterprise.css';

interface Report {
  title: string;
  description: string;
  icon: React.ReactNode;
  frequency: string;
  lastGenerated: string;
  color: string;
}

interface Insight {
  text: string;
  type: 'success' | 'warning' | 'error';
  icon: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  car: <CarOutlined style={{ fontSize: 24 }} />,
  'bar-chart': <BarChartOutlined style={{ fontSize: 24 }} />,
  rise: <RiseOutlined style={{ fontSize: 24 }} />,
  'file-text': <FileTextOutlined style={{ fontSize: 24 }} />,
  tool: <ToolOutlined style={{ fontSize: 24 }} />,
  calendar: <CalendarOutlined style={{ fontSize: 24 }} />
};

const LogisticsReports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await apiClient.get('/api/logistics/reports');
        const data = response.data?.data || response.data || {};
        if (data.reports) {
          setReports(data.reports.map((r: any) => ({
            ...r,
            icon: iconMap[r.iconKey] || <FileTextOutlined style={{ fontSize: 24 }} />
          })));
        }
        if (data.insights) {
          setInsights(data.insights.map((i: any) => ({
            ...i,
            icon: iconMap[i.iconKey] || <RiseOutlined />
          })));
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);
  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'routes', label: '🗺️ Routes', path: '/logistics/routes' },
    { id: 'incidents', label: '⚠️ Incidents', path: '/logistics/incidents' },
    { id: 'geofences', label: '📍 Geofences', path: '/logistics/geofences' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Reports', path: '/logistics/reports' },
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Reports & Analytics' }
  ];

  // Reports and insights loaded from API

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Daily': return 'blue';
      case 'Weekly': return 'green';
      case 'Monthly': return 'purple';
      default: return 'default';
    }
  };

  return (
    <EnterpriseLayout
      moduleTitle="Reports & Analytics"
      moduleSubtitle="Performance dashboards and business intelligence"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
    >
      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Reports"
              value={reports.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Daily Reports"
              value={1}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Weekly Reports"
              value={2}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Monthly Reports"
              value={3}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Report Catalog */}
      <Card title="Report Catalog" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {reports.map((report, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button icon={<DownloadOutlined />} key="download">Download</Button>,
                  <Button type="primary" icon={<SyncOutlined />} key="generate">Generate</Button>
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: `${report.color}20`,
                    color: report.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {report.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{report.title}</h4>
                    <Tag color={getFrequencyColor(report.frequency)} style={{ marginTop: 4 }}>
                      {report.frequency}
                    </Tag>
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12, minHeight: 40 }}>
                  {report.description}
                </p>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  Last generated: {new Date(report.lastGenerated).toLocaleDateString('en-ZA')}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Quick Insights */}
      <Card title="Quick Insights">
        <List
          dataSource={insights}
          renderItem={(item) => (
            <List.Item>
              <Space>
                <Tag color={item.type === 'success' ? 'green' : 'orange'} icon={item.icon}>
                  {item.type === 'success' ? 'Positive' : 'Attention'}
                </Tag>
                <span style={{ fontSize: 14 }}>{item.text}</span>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </EnterpriseLayout>
  );
};

export default LogisticsReports;
