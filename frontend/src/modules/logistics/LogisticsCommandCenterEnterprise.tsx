/**
 * Enterprise Logistics Command Center
 * Real-time dashboard with Ant Design components and live API integration
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tag,
  Progress,
  Tabs,
  Badge,
  Spin,
  Empty,
  Button,
  Space,
  Typography,
  Tooltip,
} from 'antd';
import {
  TruckOutlined,
  TeamOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { dashboardAPI, tripsAPI } from '../../services/logistics.api';
import { customColors } from '../../theme/antd.theme';
import VehicleTrackingMap from './VehicleTrackingMap';
import './logistics-enterprise.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface DashboardStats {
  fleet: {
    total: number;
    inTransit: number;
    idle: number;
    loading: number;
    maintenance: number;
  };
  trips: {
    active: number;
    planned: number;
    completed: number;
    onTimePerformance: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  drivers: {
    active: number;
    onLeave: number;
    expiringSoon: number;
  };
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  title: string;
  message: string;
  timestamp: string;
  vehicleId?: string;
  actionable: boolean;
}

interface LiveVehicle {
  id: string;
  registration: string;
  driver: string;
  status: 'on-time' | 'delayed' | 'idle' | 'at-risk';
  location: string;
  destination: string;
  tripNumber: string;
  eta: string;
  fuelLevel: number;
  speed: number;
  delayMinutes?: number;
}

const LogisticsCommandCenterEnterprise: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<LiveVehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      // Fetch dashboard statistics
      const dashboardData = await dashboardAPI.getDashboardStats();
      
      // Transform API response to match our interface
      setStats({
        fleet: {
          total: dashboardData.fleet?.total || 0,
          inTransit: dashboardData.fleet?.inTransit || 0,
          idle: dashboardData.fleet?.idle || 0,
          loading: dashboardData.fleet?.loading || 0,
          maintenance: dashboardData.fleet?.maintenance || 0,
        },
        trips: {
          active: dashboardData.trips?.active || 0,
          planned: dashboardData.trips?.planned || 0,
          completed: dashboardData.trips?.completed || 0,
          onTimePerformance: dashboardData.trips?.onTimePercentage || 0,
        },
        alerts: {
          critical: dashboardData.alerts?.critical || 0,
          warning: dashboardData.alerts?.warning || 0,
          info: dashboardData.alerts?.info || 0,
        },
        drivers: {
          active: dashboardData.drivers?.active || 0,
          onLeave: dashboardData.drivers?.onLeave || 0,
          expiringSoon: dashboardData.drivers?.expiringSoon || 0,
        },
      });

      // Fetch active trips for live vehicles view
      const tripsData = await tripsAPI.getTrips({
        status: 'In Transit',
      });
      
      // Transform trips to live vehicles
      const vehicles = tripsData.trips?.slice(0, 10).map((trip: any) => ({
        id: trip.trip_id,
        registration: trip.vehicle_reg,
        driver: trip.driver,
        status: determineStatus(trip),
        location: trip.current_location || 'In Transit',
        destination: trip.destination,
        tripNumber: trip.trip_id,
        eta: trip.eta || 'Calculating...',
        fuelLevel: Math.floor(Math.random() * 100), // TODO: Get from GPS provider
        speed: Math.floor(Math.random() * 120), // TODO: Get from GPS provider
        delayMinutes: trip.delay_minutes,
      })) || [];
      
      setLiveVehicles(vehicles);

      // Extract alerts from dashboard data
      if (dashboardData.recentAlerts) {
        setAlerts(dashboardData.recentAlerts);
      }

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const determineStatus = (trip: any): 'on-time' | 'delayed' | 'idle' | 'at-risk' => {
    if (trip.status === 'Delivered') return 'on-time';
    if (trip.delay_minutes && trip.delay_minutes > 30) return 'delayed';
    if (trip.status === 'Loading') return 'idle';
    if (trip.delay_minutes && trip.delay_minutes > 15) return 'at-risk';
    return 'on-time';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'on-time': 'success',
      'delayed': 'error',
      'idle': 'default',
      'at-risk': 'warning',
    };
    return colors[status] || 'default';
  };

  // Layout configuration
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Logistics', path: '/logistics' },
    { label: 'Command Center' },
  ];

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

  const liveVehicleColumns = [
    {
      title: 'Vehicle',
      dataIndex: 'registration',
      key: 'registration',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Driver',
      dataIndex: 'driver',
      key: 'driver',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: LiveVehicle) => (
        <Space direction="vertical" size={0}>
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
          {record.delayMinutes && record.delayMinutes > 0 && (
            <Text type="danger" style={{ fontSize: 12 }}>
              +{record.delayMinutes}min
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      ellipsis: true,
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      width: 100,
    },
    {
      title: 'Fuel',
      dataIndex: 'fuelLevel',
      key: 'fuelLevel',
      width: 100,
      render: (level: number) => (
        <Progress
          percent={level}
          size="small"
          strokeColor={level < 25 ? '#EF4444' : level < 50 ? '#F59E0B' : '#10B981'}
          showInfo={false}
        />
      ),
    },
    {
      title: 'Speed',
      dataIndex: 'speed',
      key: 'speed',
      width: 80,
      render: (speed: number) => `${speed} km/h`,
    },
  ];

  if (loading) {
    return (
      <EnterpriseLayout
        moduleTitle="Logistics Command Center"
        moduleSubtitle="Real-time fleet monitoring and operations dashboard"
        tabs={tabs}
        breadcrumbs={breadcrumbs}
      >
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      </EnterpriseLayout>
    );
  }

  if (error) {
    return (
      <EnterpriseLayout
        moduleTitle="Logistics Command Center"
        moduleSubtitle="Real-time fleet monitoring and operations dashboard"
        tabs={tabs}
        breadcrumbs={breadcrumbs}
      >
        <Alert
          message="Failed to Load Dashboard"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => fetchDashboardData()}>
              Retry
            </Button>
          }
        />
      </EnterpriseLayout>
    );
  }

  if (!stats) {
    return (
      <EnterpriseLayout
        moduleTitle="Logistics Command Center"
        moduleSubtitle="Real-time fleet monitoring and operations dashboard"
        tabs={tabs}
        breadcrumbs={breadcrumbs}
      >
        <Empty description="No dashboard data available" />
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Logistics Command Center"
      moduleSubtitle="Real-time fleet monitoring and operations dashboard"
      tabs={tabs}
      breadcrumbs={breadcrumbs}
      actionButtons={[{
        label: 'Refresh',
        icon: <ThunderboltOutlined />,
        variant: 'primary',
        onClick: () => fetchDashboardData(true)
      }]}
    >
      <div className="logistics-page-content">
        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="logistics-section">
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Fleet Status"
                value={stats.fleet.inTransit}
                suffix={`/ ${stats.fleet.total}`}
                prefix={<TruckOutlined />}
                valueStyle={{ color: customColors.status.active }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.fleet.idle} idle · {stats.fleet.maintenance} maintenance
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Active Trips"
                value={stats.trips.active}
                prefix={<DashboardOutlined />}
                valueStyle={{ color: '#667eea' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.trips.planned} planned · {stats.trips.completed} completed today
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="On-Time Performance"
                value={stats.trips.onTimePerformance}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{
                  color:
                    stats.trips.onTimePerformance >= 90
                      ? customColors.status.active
                      : stats.trips.onTimePerformance >= 75
                      ? customColors.status.warning
                      : customColors.status.danger,
                }}
              />
              <Progress
                percent={stats.trips.onTimePerformance}
                showInfo={false}
                strokeColor={customColors.gradient.primary}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Active Alerts"
                value={stats.alerts.critical + stats.alerts.warning}
                prefix={<WarningOutlined />}
                valueStyle={{
                  color: stats.alerts.critical > 0 ? customColors.status.danger : customColors.status.warning,
                }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {stats.alerts.critical} critical · {stats.alerts.warning} warnings
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card
            className="logistics-card logistics-section"
            title={
              <Space className="logistics-card-header">
                <WarningOutlined style={{ color: '#F59E0B' }} />
                Active Alerts
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {alerts.slice(0, 5).map((alert) => (
                <Alert
                  key={alert.id}
                  message={alert.title}
                  description={`${alert.message} · ${alert.timestamp}`}
                  type={alert.type}
                  showIcon
                  action={
                    alert.actionable && (
                      <Button size="small" type="link">
                        View Details
                      </Button>
                    )
                  }
                />
              ))}
            </Space>
          </Card>
        )}

        {/* Vehicle Tracking Map */}
        <Card
          className="logistics-card logistics-section"
          title={
            <Space className="logistics-card-header">
              <EnvironmentOutlined />
              Live Fleet Map
              <Badge count={liveVehicles.length} style={{ backgroundColor: '#10B981' }} />
            </Space>
          }
        >
          <VehicleTrackingMap height="500px" showStats={false} />
        </Card>

        {/* Live Vehicles Table */}
        <Card
          className="logistics-card logistics-table-card"
          title={
            <Space className="logistics-card-header">
              <EnvironmentOutlined />
              Live Vehicle Tracking
              <Badge count={liveVehicles.length} style={{ backgroundColor: '#10B981' }} />
            </Space>
          }
        >
          <Table
            columns={liveVehicleColumns}
            dataSource={liveVehicles}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 1000 }}
          />
        </Card>
      </div>
    </EnterpriseLayout>
  );
};

export default LogisticsCommandCenterEnterprise;
