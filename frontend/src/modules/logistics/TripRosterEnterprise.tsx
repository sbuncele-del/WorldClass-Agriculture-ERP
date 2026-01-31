import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  Card,
  Statistic,
  Tag,
  Button,
  Input,
  Space,
  Row,
  Col,
  Tooltip,
  Progress,
  Dropdown,
  Alert,
  Empty,
  Spin,
  Timeline,
  Modal,
  Badge
} from 'antd';
import type { MenuProps } from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  MoreOutlined,
  ExportOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { tripsAPI, podAPI } from '../../services/logistics.api';
import { exportToCSV, formatDate } from '../../utils/export';
import './logistics-enterprise.css';

interface Trip {
  trip_id: string;
  customer: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle_reg: string;
  status: 'Planned' | 'Assigned' | 'Loading' | 'In Transit' | 'Delivered' | 'Cancelled';
  pod_status: 'Pending' | 'Received' | 'Verified';
  eta: string;
  actual_arrival?: string;
  departure_time?: string;
  distance_km?: number;
  load_weight?: number;
  created_at?: string;
  updated_at?: string;
}

interface TripStats {
  total: number;
  planned: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  onTimeRate: number;
  avgDeliveryTime: number;
}

const TripRosterEnterprise: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [podFilter, setPodFilter] = useState<string>('ALL');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const handleExport = () => {
    exportToCSV(filteredTrips, [
      { key: 'trip_number', header: 'Trip #' },
      { key: 'customer', header: 'Customer' },
      { key: 'origin', header: 'Origin' },
      { key: 'destination', header: 'Destination' },
      { key: 'driver', header: 'Driver' },
      { key: 'vehicle_reg', header: 'Vehicle' },
      { key: 'status', header: 'Status' },
      { key: 'pod_status', header: 'POD Status' },
      { key: 'eta', header: 'ETA', formatter: formatDate },
    ], 'trips');
  };
  const [stats, setStats] = useState<TripStats>({
    total: 0,
    planned: 0,
    inTransit: 0,
    delivered: 0,
    delayed: 0,
    onTimeRate: 0,
    avgDeliveryTime: 0
  });

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
    { label: 'Trip Management' }
  ];

  useEffect(() => {
    fetchTrips();
    const interval = setInterval(fetchTrips, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, searchTerm, statusFilter, podFilter]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await tripsAPI.getTrips();
      setTrips(response.trips);
      calculateStats(response.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tripList: Trip[]) => {
    const total = tripList.length;
    const planned = tripList.filter(t => t.status === 'Planned' || t.status === 'Assigned').length;
    const inTransit = tripList.filter(t => t.status === 'In Transit' || t.status === 'Loading').length;
    const delivered = tripList.filter(t => t.status === 'Delivered').length;

    // Calculate delayed trips (ETA passed but not delivered)
    const delayed = tripList.filter(t => {
      if (t.status === 'Delivered' || t.status === 'Cancelled') return false;
      const eta = new Date(t.eta);
      return eta < new Date();
    }).length;

    // Calculate on-time rate (delivered trips that arrived on time)
    const deliveredTrips = tripList.filter(t => t.status === 'Delivered' && t.actual_arrival);
    const onTimeTrips = deliveredTrips.filter(t => {
      const eta = new Date(t.eta);
      const arrival = new Date(t.actual_arrival!);
      return arrival <= eta;
    }).length;
    const onTimeRate = deliveredTrips.length > 0 ? (onTimeTrips / deliveredTrips.length) * 100 : 0;

    // Calculate average delivery time (in hours)
    const avgDeliveryTime = deliveredTrips.length > 0
      ? deliveredTrips.reduce((sum, t) => {
          if (t.departure_time && t.actual_arrival) {
            const departure = new Date(t.departure_time);
            const arrival = new Date(t.actual_arrival);
            const hours = (arrival.getTime() - departure.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0) / deliveredTrips.length
      : 0;

    setStats({
      total,
      planned,
      inTransit,
      delivered,
      delayed,
      onTimeRate,
      avgDeliveryTime
    });
  };

  const filterTrips = () => {
    let filtered = [...trips];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        t =>
          t.trip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.vehicle_reg.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // POD filter
    if (podFilter !== 'ALL') {
      filtered = filtered.filter(t => t.pod_status === podFilter);
    }

    setFilteredTrips(filtered);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Planned': 'default',
      'Assigned': 'blue',
      'Loading': 'cyan',
      'In Transit': 'processing',
      'Delivered': 'success',
      'Cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getPODStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Pending': 'warning',
      'Received': 'processing',
      'Verified': 'success'
    };
    return colors[status] || 'default';
  };

  const isDelayed = (trip: Trip): boolean => {
    if (trip.status === 'Delivered' || trip.status === 'Cancelled') return false;
    const eta = new Date(trip.eta);
    return eta < new Date();
  };

  const getETAStatus = (trip: Trip): 'success' | 'warning' | 'error' => {
    if (trip.status === 'Delivered') return 'success';
    if (isDelayed(trip)) return 'error';
    
    const eta = new Date(trip.eta);
    const now = new Date();
    const hoursUntilETA = (eta.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilETA <= 2) return 'warning';
    return 'success';
  };

  const actionMenuItems = (trip: Trip): MenuProps['items'] => [
    {
      key: 'view',
      icon: <FileTextOutlined />,
      label: 'View Details',
      onClick: () => window.location.href = `/logistics/trips/${trip.trip_id}`
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Trip',
      onClick: () => window.location.href = `/logistics/trips/${trip.trip_id}?edit=true`
    },
    {
      key: 'timeline',
      icon: <ClockCircleOutlined />,
      label: 'View Timeline',
      onClick: () => {
        setSelectedTrip(trip);
        setTimelineVisible(true);
      }
    },
    {
      key: 'pod',
      icon: <FileImageOutlined />,
      label: 'Capture POD',
      disabled: trip.status === 'Delivered' || trip.status === 'Cancelled',
      onClick: () => window.location.href = `/logistics/trips/${trip.trip_id}?pod=true`
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Export Report',
      onClick: () => exportToCSV([trip], [
        { key: 'trip_id', header: 'Trip #' },
        { key: 'customer', header: 'Customer' },
        { key: 'origin', header: 'Origin' },
        { key: 'destination', header: 'Destination' },
        { key: 'driver', header: 'Driver' },
        { key: 'vehicle_reg', header: 'Vehicle' },
        { key: 'status', header: 'Status' },
        { key: 'pod_status', header: 'POD Status' },
        { key: 'eta', header: 'ETA', formatter: formatDate },
      ], `trip-${trip.trip_id}`)
    }
  ];

  const columns: ColumnsType<Trip> = [
    {
      title: 'Trip ID',
      dataIndex: 'trip_id',
      key: 'trip_id',
      fixed: 'left',
      width: 140,
      render: (id: string, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
            {id}
          </div>
          {isDelayed(record) && (
            <Tag color="error" icon={<WarningOutlined />} style={{ marginTop: '4px', fontSize: '10px' }}>
              DELAYED
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 180,
      render: (customer: string) => (
        <div style={{ fontWeight: 500 }}>{customer}</div>
      )
    },
    {
      title: 'Route',
      key: 'route',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <EnvironmentOutlined style={{ color: '#10b981' }} /> {record.origin}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            <EnvironmentOutlined style={{ color: '#ef4444' }} /> {record.destination}
          </div>
          {record.distance_km && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {record.distance_km} km
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Driver & Vehicle',
      key: 'assignment',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '13px', marginBottom: '2px' }}>
            <UserOutlined /> {record.driver}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            <CarOutlined /> {record.vehicle_reg}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        let icon = null;
        
        switch (status) {
          case 'In Transit':
            icon = <CarOutlined />;
            break;
          case 'Delivered':
            icon = <CheckCircleOutlined />;
            break;
          case 'Loading':
            icon = <ClockCircleOutlined />;
            break;
          default:
            break;
        }
        
        return <Tag color={getStatusColor(status)} icon={icon}>{status}</Tag>;
      },
      filters: [
        { text: 'Planned', value: 'Planned' },
        { text: 'Assigned', value: 'Assigned' },
        { text: 'Loading', value: 'Loading' },
        { text: 'In Transit', value: 'In Transit' },
        { text: 'Delivered', value: 'Delivered' },
        { text: 'Cancelled', value: 'Cancelled' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'POD Status',
      dataIndex: 'pod_status',
      key: 'pod_status',
      width: 130,
      render: (status: string) => (
        <Tag color={getPODStatusColor(status)}>{status}</Tag>
      ),
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Received', value: 'Received' },
        { text: 'Verified', value: 'Verified' }
      ],
      onFilter: (value, record) => record.pod_status === value
    },
    {
      title: 'ETA',
      dataIndex: 'eta',
      key: 'eta',
      width: 180,
      render: (eta: string, record) => {
        const etaDate = new Date(eta);
        const now = new Date();
        const hoursUntil = Math.round((etaDate.getTime() - now.getTime()) / (1000 * 60 * 60));
        const status = getETAStatus(record);
        
        return (
          <div>
            <div style={{ 
              fontSize: '13px',
              color: status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981',
              fontWeight: 600
            }}>
              {etaDate.toLocaleString('en-ZA', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {record.status !== 'Delivered' && record.status !== 'Cancelled' && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {hoursUntil > 0 ? `in ${hoursUntil}h` : `${Math.abs(hoursUntil)}h overdue`}
              </div>
            )}
          </div>
        );
      },
      sorter: (a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime()
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        let percent = 0;
        let status: 'success' | 'normal' | 'exception' = 'normal';
        
        switch (record.status) {
          case 'Planned':
            percent = 10;
            break;
          case 'Assigned':
            percent = 25;
            break;
          case 'Loading':
            percent = 40;
            break;
          case 'In Transit':
            percent = 70;
            status = 'normal';
            break;
          case 'Delivered':
            percent = 100;
            status = 'success';
            break;
          case 'Cancelled':
            percent = 0;
            status = 'exception';
            break;
        }
        
        if (isDelayed(record) && record.status !== 'Delivered') {
          status = 'exception';
        }
        
        return (
          <Progress
            percent={percent}
            size="small"
            status={status}
            showInfo={false}
          />
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => window.location.href = `/logistics/trips/${record.trip_id}`}
          >
            View
          </Button>
          <Dropdown menu={{ items: actionMenuItems(record) }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <EnterpriseLayout moduleTitle="Trip Management" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div style={{ padding: '24px' }}>
        {/* Alert for delayed trips */}
        {stats.delayed > 0 && (
          <Alert
            message="Delayed Trips Alert"
            description={`${stats.delayed} trip(s) have passed their ETA and are delayed. Please investigate and update customers.`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Total Trips"
                value={stats.total}
                prefix={<CarOutlined style={{ color: '#667eea' }} />}
                suffix="trips"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="In Transit"
                value={stats.inTransit}
                valueStyle={{ color: '#3b82f6' }}
                prefix={<CarOutlined />}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                {stats.planned} planned
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="On-Time Rate"
                value={stats.onTimeRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: stats.onTimeRate >= 95 ? '#10b981' : '#f59e0b' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Delayed Trips"
                value={stats.delayed}
                valueStyle={{ color: stats.delayed > 0 ? '#ef4444' : '#10b981' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Actions */}
        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by trip ID, customer, route, driver, or vehicle..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                size="large"
                allowClear
              />
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => window.location.href = '/logistics/trips/new'}
                >
                  Create Trip
                </Button>
                <Button
                  icon={<FilterOutlined />}
                  size="large"
                  onClick={() => setFilterModalOpen(true)}
                >
                  Advanced Filters
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  size="large"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Trips Table */}
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#64748b' }}>
                Loading trip data...
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            <Empty
              description={
                searchTerm || statusFilter !== 'ALL' || podFilter !== 'ALL'
                  ? 'No trips match your filters'
                  : 'No trips scheduled'
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {!searchTerm && statusFilter === 'ALL' && podFilter === 'ALL' && (
                <Button type="primary" icon={<PlusOutlined />}>
                  Create First Trip
                </Button>
              )}
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredTrips}
              rowKey="trip_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} trips`,
                position: ['bottomCenter']
              }}
              scroll={{ x: 1600 }}
              className="live-vehicle-table"
            />
          )}
        </Card>

        {/* Trip Timeline Modal */}
        <Modal
          title={`Trip Timeline - ${selectedTrip?.trip_id}`}
          open={timelineVisible}
          onCancel={() => setTimelineVisible(false)}
          footer={null}
          width={700}
        >
          {selectedTrip && (
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>Trip Created</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {selectedTrip.created_at ? new Date(selectedTrip.created_at).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  )
                },
                {
                  color: selectedTrip.status === 'Planned' ? 'gray' : 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>Driver & Vehicle Assigned</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {selectedTrip.driver} - {selectedTrip.vehicle_reg}
                      </div>
                    </div>
                  )
                },
                {
                  color: selectedTrip.status === 'Loading' || selectedTrip.status === 'In Transit' || selectedTrip.status === 'Delivered' ? 'blue' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>Loading Started</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {selectedTrip.origin}
                      </div>
                    </div>
                  )
                },
                {
                  color: selectedTrip.status === 'In Transit' || selectedTrip.status === 'Delivered' ? 'blue' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>Departed</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {selectedTrip.departure_time ? new Date(selectedTrip.departure_time).toLocaleString() : 'Pending'}
                      </div>
                    </div>
                  )
                },
                {
                  color: selectedTrip.status === 'Delivered' ? 'green' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>Delivered</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {selectedTrip.actual_arrival ? new Date(selectedTrip.actual_arrival).toLocaleString() : 'Pending'}
                      </div>
                    </div>
                  )
                },
                {
                  color: selectedTrip.pod_status === 'Verified' ? 'green' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>POD Verified</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Status: {selectedTrip.pod_status}
                      </div>
                    </div>
                  )
                }
              ]}
            />
          )}
        </Modal>
      </div>
    </EnterpriseLayout>
  );
};

export default TripRosterEnterprise;
