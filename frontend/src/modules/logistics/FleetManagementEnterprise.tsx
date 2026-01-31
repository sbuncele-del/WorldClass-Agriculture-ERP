import React, { useState, useEffect } from 'react';
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
  Form,
  Select,
  DatePicker,
  message,
  Modal
} from 'antd';
import type { MenuProps } from 'antd';
import {
  TruckOutlined,
  ToolOutlined,
  WarningOutlined,
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  FileTextOutlined,
  MoreOutlined,
  ExportOutlined,
  FilterOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { vehiclesAPI } from '../../services/logistics.api';
import { exportToCSV, formatDate } from '../../utils/export';
import './logistics-enterprise.css';

interface Vehicle {
  vehicle_id: number;
  vehicle_number: string;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type: string;
  year_of_manufacture: number;
  status: string;
  current_driver: string;
  last_service_date: string;
  next_service_date: string;
  next_service_km: number;
  current_odometer: number;
  license_expiry: string;
  roadworthy_expiry: string;
  insurance_expiry: string;
}

interface FleetStats {
  total: number;
  active: number;
  maintenance: number;
  alerts: number;
  utilization: number;
  avgAge: number;
}

const FleetManagementEnhanced: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleExport = () => {
    exportToCSV(filteredVehicles, [
      { key: 'vehicle_registration', header: 'Registration' },
      { key: 'make', header: 'Make' },
      { key: 'model', header: 'Model' },
      { key: 'vehicle_type', header: 'Type' },
      { key: 'year_of_manufacture', header: 'Year' },
      { key: 'status', header: 'Status' },
      { key: 'current_odometer', header: 'Odometer (km)' },
      { key: 'next_service_date', header: 'Next Service', formatter: formatDate },
      { key: 'license_expiry', header: 'License Expiry', formatter: formatDate },
    ], 'fleet_vehicles');
    message.success('Fleet data exported to CSV');
  };
  const [stats, setStats] = useState<FleetStats>({
    total: 0,
    active: 0,
    maintenance: 0,
    alerts: 0,
    utilization: 0,
    avgAge: 0
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
    { label: 'Fleet Management' }
  ];

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter, typeFilter]);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vehiclesAPI.getVehicles();
      setVehicles(response.vehicles);
      calculateStats(response.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Unable to load fleet data. Please try again.');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vehicleList: Vehicle[]) => {
    const total = vehicleList.length;
    const active = vehicleList.filter(v => v.status === 'ACTIVE').length;
    const maintenance = vehicleList.filter(v => v.status === 'MAINTENANCE').length;
    
    // Calculate alerts (expiring documents within 30 days)
    const alerts = vehicleList.filter(v => {
      const licenseDays = getExpiryDays(v.license_expiry);
      const roadworthyDays = getExpiryDays(v.roadworthy_expiry);
      const insuranceDays = getExpiryDays(v.insurance_expiry);
      return licenseDays <= 30 || roadworthyDays <= 30 || insuranceDays <= 30;
    }).length;

    const utilization = total > 0 ? (active / total) * 100 : 0;
    const avgAge = total > 0 
      ? vehicleList.reduce((sum, v) => sum + (new Date().getFullYear() - v.year_of_manufacture), 0) / total
      : 0;

    setStats({
      total,
      active,
      maintenance,
      alerts,
      utilization,
      avgAge
    });
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        v =>
          (v.vehicle_number || '').toLowerCase().includes(term) ||
          (v.registration_number || '').toLowerCase().includes(term) ||
          (v.make || '').toLowerCase().includes(term) ||
          (v.model || '').toLowerCase().includes(term) ||
          (v.current_driver || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(v => v.vehicle_type === typeFilter);
    }

    setFilteredVehicles(filtered);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      ACTIVE: '#10b981',
      MAINTENANCE: '#f59e0b',
      INACTIVE: '#64748b',
      BREAKDOWN: '#ef4444'
    };
    return colors[status] || '#94a3b8';
  };

  const getExpiryDays = (expiryDate?: string): number => {
    if (!expiryDate) return 999;
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number): 'success' | 'warning' | 'error' => {
    if (days < 0) return 'error';
    if (days <= 30) return 'warning';
    return 'success';
  };

  const actionMenuItems = (vehicle: Vehicle): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Details'
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: 'View Documents'
    },
    {
      key: 'service',
      icon: <ToolOutlined />,
      label: 'Service History'
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Export Report'
    }
  ];

  const columns: ColumnsType<Vehicle> = [
    {
      title: 'Vehicle',
      key: 'vehicle',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
            {record.vehicle_number}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {record.registration_number}
          </div>
        </div>
      )
    },
    {
      title: 'Make & Model',
      key: 'model',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.make}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {record.model} ({record.year_of_manufacture})
          </div>
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
      filters: [
        { text: 'Truck', value: 'TRUCK' },
        { text: 'Van', value: 'VAN' },
        { text: 'Flatbed', value: 'FLATBED' },
        { text: 'Refrigerated', value: 'REFRIGERATED' }
      ],
      onFilter: (value, record) => record.vehicle_type === value
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'ACTIVE':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'MAINTENANCE':
            color = 'warning';
            icon = <ToolOutlined />;
            break;
          case 'BREAKDOWN':
            color = 'error';
            icon = <WarningOutlined />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status.replace('_', ' ')}
          </Tag>
        );
      },
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Maintenance', value: 'MAINTENANCE' },
        { text: 'Inactive', value: 'INACTIVE' },
        { text: 'Breakdown', value: 'BREAKDOWN' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Current Driver',
      dataIndex: 'current_driver',
      key: 'current_driver',
      width: 160
    },
    {
      title: 'Odometer',
      dataIndex: 'current_odometer',
      key: 'current_odometer',
      width: 120,
      render: (km: number) => (
        <div style={{ fontWeight: 600 }}>
          {(km || 0).toLocaleString()} km
        </div>
      ),
      sorter: (a, b) => (a.current_odometer || 0) - (b.current_odometer || 0)
    },
    {
      title: 'Next Service',
      key: 'next_service',
      width: 180,
      render: (_, record) => {
        const nextKm = record.next_service_km || 0;
        const currentKm = record.current_odometer || 0;
        const kmToService = nextKm - currentKm;
        const nextServiceDate = record.next_service_date ? new Date(record.next_service_date) : new Date();
        
        return (
          <div>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              {nextServiceDate.toLocaleDateString('en-ZA')}
            </div>
            <Progress
              percent={Math.min(100, Math.max(0, (kmToService / 10000) * 100))}
              size="small"
              status={kmToService < 1000 ? 'exception' : 'normal'}
              format={() => `${(kmToService || 0).toLocaleString()} km`}
            />
          </div>
        );
      }
    },
    {
      title: 'License Expiry',
      dataIndex: 'license_expiry',
      key: 'license_expiry',
      width: 150,
      render: (date: string) => {
        const days = getExpiryDays(date);
        const status = getExpiryStatus(days);
        
        return (
          <Tooltip title={days < 0 ? 'EXPIRED!' : `${days} days remaining`}>
            <div>
              <div style={{ 
                fontSize: '13px',
                color: status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981',
                fontWeight: days <= 30 ? 600 : 400
              }}>
                {new Date(date).toLocaleDateString('en-ZA')}
              </div>
              <Tag color={status} style={{ fontSize: '11px', marginTop: '2px' }}>
                {days < 0 ? 'EXPIRED' : `${days}d`}
              </Tag>
            </div>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(a.license_expiry).getTime() - new Date(b.license_expiry).getTime()
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
            icon={<EditOutlined />}
            onClick={() => console.log('Edit', record.vehicle_id)}
          >
            Edit
          </Button>
          <Dropdown menu={{ items: actionMenuItems(record) }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <EnterpriseLayout moduleTitle="Fleet Management" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div className="logistics-page-content">
        {/* Alert for expiring documents */}
        {stats.alerts > 0 && (
          <div className="logistics-section">
            <Alert
              message="Document Expiry Warnings"
              description={`${stats.alerts} vehicle(s) have documents expiring within 30 days. Please review and renew.`}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              closable
            />
          </div>
        )}

        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="logistics-section">
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Total Fleet"
                value={stats.total}
                prefix={<TruckOutlined style={{ color: '#667eea' }} />}
                suffix="vehicles"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Active Vehicles"
                value={stats.active}
                valueStyle={{ color: '#10b981' }}
                prefix={<CheckCircleOutlined />}
              />
              <Progress
                percent={stats.utilization}
                size="small"
                status="success"
                format={percent => `${percent?.toFixed(1)}%`}
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="In Maintenance"
                value={stats.maintenance}
                valueStyle={{ color: '#f59e0b' }}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Expiry Alerts"
                value={stats.alerts}
                valueStyle={{ color: '#ef4444' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Actions */}
        <Card className="logistics-card logistics-section logistics-filters-card">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by vehicle number, registration, make, model, or driver..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                size="large"
                allowClear
              />
            </Col>
            <Col>
                <Space wrap>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    size="large"
                    style={{ width: 160 }}
                    options={[
                      { value: 'ALL', label: 'All Statuses' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'MAINTENANCE', label: 'Maintenance' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'BREAKDOWN', label: 'Breakdown' }
                    ]}
                  />
                  <Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    size="large"
                    style={{ width: 160 }}
                    options={[
                      { value: 'ALL', label: 'All Types' },
                      { value: 'TRUCK', label: 'Truck' },
                      { value: 'VAN', label: 'Van' },
                      { value: 'FLATBED', label: 'Flatbed' },
                      { value: 'REFRIGERATED', label: 'Refrigerated' }
                    ]}
                  />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                    onClick={() => {
                      form.resetFields();
                      setIsModalOpen(true);
                    }}
                >
                  Add Vehicle
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

        {/* Fleet Table */}
        <Card className="logistics-card logistics-table-card">
          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              style={{ marginBottom: 16 }}
            />
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#64748b' }}>
                Loading fleet data...
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <Empty
              description={
                searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'No vehicles match your filters'
                  : 'No vehicles in fleet'
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {!searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL' && (
                <Button type="primary" icon={<PlusOutlined />}>
                  Add First Vehicle
                </Button>
              )}
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredVehicles}
              rowKey="vehicle_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vehicles`,
                position: ['bottomCenter']
              }}
              scroll={{ x: 1400 }}
              className="live-vehicle-table"
            />
          )}
        </Card>
      </div>

      <Modal
        title="Add Vehicle"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            setSubmitting(true);
            await vehiclesAPI.createVehicle({
              ...values,
              year_of_manufacture: Number(values.year_of_manufacture),
              next_service_km: Number(values.next_service_km),
              current_odometer: Number(values.current_odometer),
              last_service_date: values.last_service_date?.format('YYYY-MM-DD'),
              next_service_date: values.next_service_date?.format('YYYY-MM-DD'),
              license_expiry: values.license_expiry?.format('YYYY-MM-DD'),
              roadworthy_expiry: values.roadworthy_expiry?.format('YYYY-MM-DD'),
              insurance_expiry: values.insurance_expiry?.format('YYYY-MM-DD')
            });
            message.success('Vehicle added successfully');
            setIsModalOpen(false);
            fetchVehicles();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || 'Failed to add vehicle');
          } finally {
            setSubmitting(false);
          }
        }}
        width={720}
      >
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="vehicle_number"
                label="Vehicle Number"
                rules={[{ required: true, message: 'Vehicle number is required' }]}
              >
                <Input placeholder="Fleet identifier" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registration_number"
                label="Registration"
                rules={[{ required: true, message: 'Registration is required' }]}
              >
                <Input placeholder="e.g. ABC123GP" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="make" label="Make" rules={[{ required: true }]}> 
                <Input placeholder="e.g. Volvo" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Model" rules={[{ required: true }]}> 
                <Input placeholder="e.g. FH16" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vehicle_type" label="Vehicle Type" rules={[{ required: true }]}> 
                <Select
                  options={[
                    { value: 'TRUCK', label: 'Truck' },
                    { value: 'VAN', label: 'Van' },
                    { value: 'FLATBED', label: 'Flatbed' },
                    { value: 'REFRIGERATED', label: 'Refrigerated' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="year_of_manufacture"
                label="Year"
                rules={[{ required: true }]}
              >
                <Input type="number" min={1990} max={new Date().getFullYear()} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="ACTIVE">
                <Select
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'MAINTENANCE', label: 'Maintenance' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'BREAKDOWN', label: 'Breakdown' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="current_driver" label="Current Driver">
                <Input placeholder="Driver name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="current_odometer" label="Odometer" rules={[{ required: true }]}> 
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="next_service_km" label="Next Service (km)" rules={[{ required: true }]}> 
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="last_service_date" label="Last Service Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="next_service_date" label="Next Service Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="license_expiry" label="License Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="roadworthy_expiry" label="Roadworthy Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="insurance_expiry" label="Insurance Expiry">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default FleetManagementEnhanced;
