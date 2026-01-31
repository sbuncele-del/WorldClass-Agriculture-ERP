import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Col, Row, Statistic, Tag, Table, Typography, Space, Alert, Button, Progress, Skeleton, List } from 'antd';
import { ThunderboltOutlined, RocketOutlined, ExperimentOutlined, FundOutlined } from '@ant-design/icons';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import logisticsEnterpriseAPI from '../../services/logisticsEnterprise.api';
import { customColors } from '../../theme/antd.theme';
import './logistics-enterprise.css';

const { Title, Text } = Typography;

interface TransportationPlanSummary {
  plan_id: string;
  plan_number: string;
  plan_type: string;
  status: string;
  service_level_target: number;
  updated_at: string;
}

interface YardOverviewResponse {
  zones: Array<{ zone_id: string; zone_name: string; zone_type: string; capacity: number; slots: any[] }>;
  recentMovements: any[];
}

interface BenchmarkSnapshot {
  throughputPerDispatcher: { ours: number; industry: number };
  planningLatencyMinutes: { ours: number; industry: number };
  revenueRecognitionLagMinutes: { ours: number; industry: number };
  aiRouteAccuracy: { ours: number; industry: number };
  carbonOptimizationPercent: { ours: number; industry: number };
  lastValidatedAt: string;
}

const LogisticsEnterpriseInnovation: React.FC = () => {
  const featureFlags = useFeatureFlags();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TransportationPlanSummary[]>([]);
  const [yard, setYard] = useState<YardOverviewResponse | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkSnapshot | null>(null);
  const [error, setError] = useState<string>();

  const tabs = [
    { id: 'dashboard', label: '🎯 Dashboard', path: '/logistics/dashboard' },
    { id: 'enterprise', label: '🚀 Enterprise AI', path: '/logistics/enterprise' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'trips', label: '🚚 Trips', path: '/logistics/trips' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'routes', label: '🗺️ Routes', path: '/logistics/routes' },
    { id: 'incidents', label: '⚠️ Incidents', path: '/logistics/incidents' },
    { id: 'geofences', label: '📍 Geofences', path: '/logistics/geofences' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Reports', path: '/logistics/reports' },
  ];

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Logistics', path: '/logistics' },
    { label: 'Enterprise AI' },
  ];

  const featureMatrix = useMemo(
    () => [
      {
        name: 'Advanced Transportation Management',
        key: 'logistics_atms',
        benefit: 'AI-powered load optimization reduces empty miles by 15%',
        businessValue: '$50K-200K annual savings',
      },
      {
        name: 'Yard + Dock Digital Twin',
        key: 'logistics_yard_management',
        benefit: 'Real-time slot visibility eliminates yard congestion',
        businessValue: '20% faster turnaround',
      },
      {
        name: 'Freight Audit & Carrier Scorecards',
        key: 'logistics_freight_audit',
        benefit: 'Auto-audit catches billing errors before payment',
        businessValue: '3-5% freight cost recovery',
      },
      {
        name: 'Revenue Recognition on Delivery',
        key: 'logistics_delivery_revenue',
        benefit: 'Automatic invoicing on POD confirmation',
        businessValue: 'DSO reduced by 5-10 days',
      },
      {
        name: 'AI Route Optimization',
        key: 'logistics_ai_route_optimization',
        benefit: 'Machine learning finds optimal routes in seconds',
        businessValue: '10-25% fuel savings',
      },
    ],
    []
  );

  const loadEnterpriseData = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const requests: Promise<void>[] = [];

      if (featureFlags.isEnabled('logistics_atms')) {
        requests.push(
          logisticsEnterpriseAPI.listTransportationPlans().then((data) => {
            setPlans(data.plans || []);
          })
        );
      }

      if (featureFlags.isEnabled('logistics_yard_management')) {
        requests.push(
          logisticsEnterpriseAPI
            .getYardOverview({ includeMovements: true })
            .then((data) => setYard(data))
        );
      }

      requests.push(
        logisticsEnterpriseAPI.getBenchmarks().then((data) => setBenchmarks(data))
      );

      await Promise.all(requests);
    } catch (err: any) {
      console.error('Failed to load enterprise data', err);
      setError(err?.message || 'Failed to load enterprise data');
    } finally {
      setLoading(false);
    }
  }, [featureFlags.flags]);

  useEffect(() => {
    loadEnterpriseData();
  }, [loadEnterpriseData]);

  const renderFeatureStatus = (key: string) => (
    <Tag color={featureFlags.isEnabled(key) ? 'green' : 'default'}>
      {featureFlags.isEnabled(key) ? 'Enabled' : 'Upgrade Available'}
    </Tag>
  );

  const parityColumns = [
    {
      title: 'Enterprise Feature',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: { key: string }) => (
        <Space>
          <Text strong>{text}</Text>
          {renderFeatureStatus(record.key)}
        </Space>
      ),
    },
    { title: 'Business Benefit', dataIndex: 'benefit', key: 'benefit' },
    { title: 'Expected Value', dataIndex: 'businessValue', key: 'businessValue', 
      render: (text: string) => <Tag color="green">{text}</Tag>
    },
    {
      title: 'Status',
      key: 'ours',
      render: (_: unknown, record: { key: string }) => (
        <Text type={featureFlags.isEnabled(record.key) ? 'success' : 'secondary'}>
          {featureFlags.isEnabled(record.key) ? '✅ Active' : '🔒 Available'}
        </Text>
      ),
    },
  ];

  const upgradeItems = Object.entries(featureFlags.upgradePaths).map(([key, note]) => ({
    key,
    note,
    enabled: featureFlags.isEnabled(key),
  }));

  return (
    <EnterpriseLayout
      moduleTitle="Enterprise Logistics"
      moduleSubtitle="AI-powered fleet management with real business value"
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      actionButtons={[
        {
          label: 'Refresh Data',
          icon: <ThunderboltOutlined />,
          variant: 'secondary',
          onClick: () => {
            loadEnterpriseData();
            featureFlags.refresh();
          },
        },
      ]}
    >
      <div className="logistics-page-content">
        {error && <Alert type="error" message={error} showIcon closable style={{ marginBottom: 16 }} />}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card>
              <Space align="center">
                <RocketOutlined style={{ fontSize: 32, color: customColors.gradient.primary }} />
                <div>
                  <Title level={4}>AI-Native Coverage</Title>
                  <Text>{featureFlags.featureCount} / {Object.keys(featureFlags.upgradePaths).length} enterprise levers active</Text>
                </div>
              </Space>
              <Progress
                percent={Math.round(
                  (featureFlags.featureCount / Math.max(1, Object.keys(featureFlags.upgradePaths).length)) * 100
                )}
                strokeColor={customColors.gradient.primary}
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Space align="center">
                <ExperimentOutlined style={{ fontSize: 32, color: customColors.gradient.secondary }} />
                <div>
                  <Title level={4}>Innovation Readiness</Title>
                  <Text>Tenant Plan: {featureFlags.tenantPlan || 'Unknown'}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card className="logistics-section" title="Enterprise Features">
          {loading ? (
            <Skeleton active />
          ) : (
            <Table
              columns={parityColumns}
              dataSource={featureMatrix}
              pagination={false}
              rowKey="name"
            />
          )}
        </Card>

        {featureFlags.isEnabled('logistics_atms') && (
          <Card className="logistics-section" title="Advanced Transportation Plans">
            {loading ? (
              <Skeleton active />
            ) : (
              <Table
                columns={[
                  { title: 'Plan #', dataIndex: 'plan_number', key: 'plan_number' },
                  { title: 'Type', dataIndex: 'plan_type', key: 'plan_type' },
                  { title: 'Status', dataIndex: 'status', key: 'status' },
                  {
                    title: 'SLA Target',
                    dataIndex: 'service_level_target',
                    key: 'service_level_target',
                    render: (value: number) => `${value}%`,
                  },
                  { title: 'Updated', dataIndex: 'updated_at', key: 'updated_at' },
                ]}
                dataSource={plans}
                rowKey="plan_id"
                pagination={{ pageSize: 5 }}
              />
            )}
          </Card>
        )}

        {featureFlags.isEnabled('logistics_yard_management') && yard && (
          <Card className="logistics-section" title="Yard Digital Twin">
            <Row gutter={[16, 16]}>
              {yard.zones.map((zone) => (
                <Col xs={24} md={12} lg={8} key={zone.zone_id}>
                  <Card size="small">
                    <Title level={5}>{zone.zone_name}</Title>
                    <Text type="secondary">{zone.zone_type} · Capacity {zone.capacity}</Text>
                    <Progress
                      percent={Math.round(
                        ((zone.slots || []).filter((slot) => slot.slot_status === 'OCCUPIED').length /
                          Math.max((zone.slots || []).length, 1)) *
                          100
                      )}
                      strokeColor={customColors.gradient.primary}
                      style={{ marginTop: 8 }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {benchmarks && (
          <Card className="logistics-section" title="Your Performance Metrics">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} lg={6}>
                <Statistic
                  title="Trips / Dispatcher"
                  value={benchmarks.throughputPerDispatcher.ours}
                  suffix={`(${((benchmarks.throughputPerDispatcher.ours / benchmarks.throughputPerDispatcher.industry - 1) * 100).toFixed(0)}% above industry avg)`}
                  prefix={<FundOutlined />}
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Statistic
                  title="Planning Time"
                  value={benchmarks.planningLatencyMinutes.ours}
                  suffix={`min (Industry: ${benchmarks.planningLatencyMinutes.industry})`}
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Statistic
                  title="Invoice Speed"
                  value={benchmarks.revenueRecognitionLagMinutes.ours}
                  suffix="min after delivery"
                />
              </Col>
              <Col xs={24} md={12} lg={6}>
                <Statistic
                  title="AI Route Accuracy"
                  value={benchmarks.aiRouteAccuracy.ours}
                  suffix="%"
                />
              </Col>
            </Row>
            <Text type="secondary">Last updated: {new Date(benchmarks.lastValidatedAt).toLocaleString()}</Text>
          </Card>
        )}

        <Card className="logistics-section" title="Upgrade Paths">
          <List
            dataSource={upgradeItems}
            renderItem={(item) => (
              <List.Item actions={[renderFeatureStatus(item.key)]}>
                <List.Item.Meta
                  title={item.key.replace('logistics_', '').replace(/_/g, ' ').toUpperCase()}
                  description={item.note}
                />
              </List.Item>
            )}
          />
        </Card>

        {!featureFlags.isEnabled('logistics_process_genome') && (
          <Alert
            type="info"
            showIcon
            message="Process Automation Available"
            description="Enable the Process Genome feature to activate AI-native orchestration that automates complex multi-step logistics workflows."
            action={<Button type="primary">Contact Us</Button>}
          />
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default LogisticsEnterpriseInnovation;
