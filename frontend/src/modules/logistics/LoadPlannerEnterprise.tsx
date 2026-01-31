import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Transfer,
  Card,
  Statistic,
  Tag,
  Button,
  Input,
  Space,
  Row,
  Col,
  Tooltip,
  Empty,
  Spin,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  WarningOutlined,
  SearchOutlined,
  PlusOutlined,
  SaveOutlined,
  ExportOutlined,
  SwapOutlined
} from '@ant-design/icons';
import type { TransferDirection } from 'antd/es/transfer';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { loadsAPI, vehiclesAPI, driversAPI } from '../../services/logistics.api';
import './logistics-enterprise.css';

interface Load {
  load_id: string;
  customer: string;
  origin: string;
  destination: string;
  weight_kg: number;
  volume_m3: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  delivery_date: string;
  special_instructions?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED';
  trip_id?: string;
  created_at?: string;
}

interface Vehicle {
  vehicle_id: number;
  vehicle_number: string;
  registration_number: string;
  status: string;
  capacity_kg?: number;
  capacity_m3?: number;
  make?: string;
  model?: string;
  vehicle_type?: string;
}

interface Driver {
  driver_id: number;
  name: string;
  status: string;
}

interface LoadStats {
  totalPending: number;
  totalAssigned: number;
  totalWeight: number;
  totalVolume: number;
  highPriority: number;
}

const LoadPlannerEnterprise: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<LoadStats>({
    totalPending: 0,
    totalAssigned: 0,
    totalWeight: 0,
    totalVolume: 0,
    highPriority: 0
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
    { label: 'Load Planner' }
  ];

  useEffect(() => {
    fetchLoads();
    fetchVehicles();
    fetchDrivers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [loads, targetKeys]);

  const fetchLoads = async () => {
    setLoading(true);
    try {
      const response = await loadsAPI.getLoads();
      const loadsData = Array.isArray(response) ? response : (response as any).loads || [];
      setLoads(loadsData);
      // Pre-select assigned loads
      const assigned = loadsData
        .filter((l: Load) => l.status === 'ASSIGNED' || l.status === 'IN_TRANSIT')
        .map((l: Load) => l.load_id);
      setTargetKeys(assigned);
    } catch (error) {
      console.error('Error fetching loads:', error);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesAPI.getVehicles({ status: 'ACTIVE' });
      setVehicles(response.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getDrivers({ status: 'ACTIVE' });
      setDrivers(response.drivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const calculateStats = () => {
    const pending = loads.filter(l => !targetKeys.includes(l.load_id));
    const assigned = loads.filter(l => targetKeys.includes(l.load_id));

    const totalWeight = pending.reduce((sum, l) => sum + l.weight_kg, 0);
    const totalVolume = pending.reduce((sum, l) => sum + l.volume_m3, 0);
    const highPriority = pending.filter(l => l.priority === 'HIGH').length;

    setStats({
      totalPending: pending.length,
      totalAssigned: assigned.length,
      totalWeight,
      totalVolume,
      highPriority
    });
  };

  const handleChange = (
    newTargetKeys: string[],
    direction: TransferDirection,
    moveKeys: string[]
  ) => {
    setTargetKeys(newTargetKeys);
    
    if (direction === 'right') {
      message.success(`${moveKeys.length} load(s) selected for assignment`);
    } else {
      message.info(`${moveKeys.length} load(s) moved back to pending`);
    }
  };

  const handleSelectChange = (
    sourceSelectedKeys: string[],
    targetSelectedKeys: string[]
  ) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const handleSearch = (dir: TransferDirection, value: string) => {
    setSearchTerm(value);
  };

  const handleAssignTrip = () => {
    if (targetKeys.length === 0) {
      message.warning('Please select loads to assign');
      return;
    }
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Create trip with assigned loads
      const tripData = {
        ...values,
        loads: targetKeys,
        status: 'PLANNED'
      };

      // In real implementation, call tripsAPI.createTrip(tripData)
      console.log('Creating trip:', tripData);
      
      message.success('Trip created successfully!');
      setAssignModalVisible(false);
      form.resetFields();
      setTargetKeys([]);
      fetchLoads();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981'
    };
    return colors[priority] || '#94a3b8';
  };

  // Filter loads based on search and priority
  const filteredLoads = loads.filter(load => {
    const matchesSearch = !searchTerm || 
      load.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.load_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'ALL' || load.priority === priorityFilter;
    
    return matchesSearch && matchesPriority;
  });

  return (
    <EnterpriseLayout moduleTitle="Load Planner" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div style={{ padding: '24px' }}>
        {/* Alert for high priority loads */}
        {stats.highPriority > 0 && (
          <Card style={{ marginBottom: '16px', borderLeftColor: '#ef4444', borderLeftWidth: '4px' }}>
            <Space>
              <WarningOutlined style={{ color: '#ef4444', fontSize: '20px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                  {stats.highPriority} High Priority Load{stats.highPriority > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  These loads require immediate attention and assignment
                </div>
              </div>
            </Space>
          </Card>
        )}

        {/* KPI Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Pending Loads"
                value={stats.totalPending}
                prefix={<InboxOutlined style={{ color: '#667eea' }} />}
                suffix="loads"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Assigned Loads"
                value={stats.totalAssigned}
                valueStyle={{ color: '#10b981' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Total Weight"
                value={stats.totalWeight}
                precision={0}
                suffix="kg"
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Total Volume"
                value={stats.totalVolume}
                precision={1}
                suffix="m³"
                valueStyle={{ color: '#8b5cf6' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Actions */}
        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Space size="large" style={{ width: '100%' }}>
                <Input
                  placeholder="Search loads..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: 300 }}
                  allowClear
                />
                <Select
                  placeholder="Filter by priority"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: 180 }}
                >
                  <Select.Option value="ALL">All Priorities</Select.Option>
                  <Select.Option value="HIGH">High Priority</Select.Option>
                  <Select.Option value="MEDIUM">Medium Priority</Select.Option>
                  <Select.Option value="LOW">Low Priority</Select.Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<TruckOutlined />}
                  size="large"
                  onClick={handleAssignTrip}
                  disabled={targetKeys.length === 0}
                >
                  Create Trip ({targetKeys.length})
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => console.log('Add load')}
                >
                  Add Load
                </Button>
                <Button
                  icon={<ExportOutlined />}
                  size="large"
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Load Transfer Component */}
        <Card>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#64748b' }}>
                Loading loads...
              </div>
            </div>
          ) : filteredLoads.length === 0 ? (
            <Empty
              description="No loads available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                Create First Load
              </Button>
            </Empty>
          ) : (
            <Transfer
              dataSource={filteredLoads.map(load => ({
                key: load.load_id,
                title: load.customer,
                description: `${load.origin} → ${load.destination}`,
                disabled: load.status === 'IN_TRANSIT' || load.status === 'DELIVERED',
                load: load
              }))}
              titles={['Available Loads', 'Selected for Trip']}
              targetKeys={targetKeys}
              selectedKeys={selectedKeys}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
              onSearch={handleSearch}
              render={item => {
                const load = item.load as Load;
                return (
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                          {load.customer}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          ID: {load.load_id}
                        </div>
                      </div>
                      <Tag color={getPriorityColor(load.priority)} style={{ margin: 0 }}>
                        {load.priority}
                      </Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                      📍 {load.origin} → {load.destination}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>⚖️ {load.weight_kg} kg</span>
                      <span>📦 {load.volume_m3} m³</span>
                      <span>📅 {new Date(load.delivery_date).toLocaleDateString('en-ZA')}</span>
                    </div>
                    {load.special_instructions && (
                      <Tooltip title={load.special_instructions}>
                        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                          ⚠️ Special instructions
                        </div>
                      </Tooltip>
                    )}
                  </div>
                );
              }}
              listStyle={{
                width: '45%',
                height: 600,
                padding: '16px'
              }}
              showSearch
              showSelectAll={true}
              locale={{
                itemUnit: 'load',
                itemsUnit: 'loads',
                searchPlaceholder: 'Search loads...',
                notFoundContent: 'No loads found'
              }}
              operations={['Assign →', '← Remove']}
              operationStyle={{ margin: '0 16px' }}
            />
          )}
        </Card>

        {/* Trip Assignment Modal */}
        <Modal
          title="Create Trip from Selected Loads"
          open={assignModalVisible}
          onOk={handleAssignSubmit}
          onCancel={() => {
            setAssignModalVisible(false);
            form.resetFields();
          }}
          width={700}
          okText="Create Trip"
          cancelText="Cancel"
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              priority: 'MEDIUM'
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="vehicle_id"
                  label="Vehicle"
                  rules={[{ required: true, message: 'Please select a vehicle' }]}
                >
                  <Select
                    placeholder="Select vehicle"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={vehicles.map(v => ({
                      label: `${v.vehicle_number} (${v.registration_number}) - ${v.capacity_kg}kg`,
                      value: v.vehicle_id
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="driver_id"
                  label="Driver"
                  rules={[{ required: true, message: 'Please select a driver' }]}
                >
                  <Select
                    placeholder="Select driver"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={drivers.map(d => ({
                      label: d.name,
                      value: d.driver_id
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="departure_date"
                  label="Planned Departure"
                  rules={[{ required: true, message: 'Please select departure date' }]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estimated_duration"
                  label="Estimated Duration (hours)"
                  rules={[{ required: true, message: 'Please enter duration' }]}
                >
                  <InputNumber
                    min={1}
                    max={48}
                    style={{ width: '100%' }}
                    placeholder="Hours"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="Trip Notes"
            >
              <Input.TextArea
                rows={3}
                placeholder="Add any special instructions or notes for this trip..."
              />
            </Form.Item>

            <Card
              size="small"
              title="Selected Loads Summary"
              style={{ marginTop: '16px', background: '#f8fafc' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Total Loads:</span>
                <span style={{ fontWeight: 600 }}>{targetKeys.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Total Weight:</span>
                <span style={{ fontWeight: 600 }}>{
                  loads.filter(l => targetKeys.includes(l.load_id))
                    .reduce((sum, l) => sum + l.weight_kg, 0).toLocaleString()
                } kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Volume:</span>
                <span style={{ fontWeight: 600 }}>{
                  loads.filter(l => targetKeys.includes(l.load_id))
                    .reduce((sum, l) => sum + l.volume_m3, 0).toFixed(1)
                } m³</span>
              </div>
            </Card>
          </Form>
        </Modal>
      </div>
    </EnterpriseLayout>
  );
};

export default LoadPlannerEnterprise;
