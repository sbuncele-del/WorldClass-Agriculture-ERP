import React, { useState, useEffect } from 'react';
import {
  Table, Card, Statistic, Tag, Button, Input, Space, Row, Col,
  Tooltip, Dropdown, Alert, Empty, Spin, Form, Select, InputNumber,
  message, Modal, Switch
} from 'antd';
import type { MenuProps } from 'antd';
import {
  EnvironmentOutlined, SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, MoreOutlined, ExportOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CarOutlined, DollarOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { routesAPI } from '../../services/logistics.api';
import type { Route } from '../../services/logistics.api';
import { exportToCSV } from '../../utils/export';
import './logistics-enterprise.css';

interface RouteStats {
  total: number;
  active: number;
  standard: number;
  express: number;
  avgDistance: number;
  avgDuration: number;
}

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [form] = Form.useForm();

  const [stats, setStats] = useState<RouteStats>({
    total: 0, active: 0, standard: 0, express: 0, avgDistance: 0, avgDuration: 0
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
    { label: 'Route Management' }
  ];

  useEffect(() => { fetchRoutes(); }, []);
  useEffect(() => { filterRoutes(); }, [routes, searchTerm, statusFilter, typeFilter]);

  const fetchRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await routesAPI.getRoutes();
      setRoutes(response.routes || []);
      calculateStats(response.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setError('Unable to load route data. Please try again.');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (routeList: Route[]) => {
    const total = routeList.length;
    const active = routeList.filter(r => r.is_active).length;
    const standard = routeList.filter(r => r.route_type === 'standard').length;
    const express = routeList.filter(r => r.route_type === 'express').length;
    const avgDistance = routeList.length > 0
      ? routeList.reduce((sum, r) => sum + (r.distance_km || 0), 0) / routeList.length
      : 0;
    const avgDuration = routeList.length > 0
      ? routeList.reduce((sum, r) => sum + (r.estimated_duration_minutes || 0), 0) / routeList.length
      : 0;
    setStats({ total, active, standard, express, avgDistance, avgDuration });
  };

  const filterRoutes = () => {
    let filtered = [...routes];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.route_name?.toLowerCase().includes(term) ||
        r.route_code?.toLowerCase().includes(term) ||
        r.origin_address?.toLowerCase().includes(term) ||
        r.destination_address?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => statusFilter === 'ACTIVE' ? r.is_active : !r.is_active);
    }
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(r => r.route_type === typeFilter);
    }
    setFilteredRoutes(filtered);
  };

  const handleExport = () => {
    exportToCSV(filteredRoutes, [
      { key: 'route_name', header: 'Route Name' },
      { key: 'route_code', header: 'Code' },
      { key: 'origin_address', header: 'Origin' },
      { key: 'destination_address', header: 'Destination' },
      { key: 'distance_km', header: 'Distance (km)' },
      { key: 'estimated_duration_minutes', header: 'Duration (min)' },
      { key: 'toll_cost', header: 'Toll Cost' },
      { key: 'route_type', header: 'Type' },
      { key: 'is_active', header: 'Active' },
    ], 'routes');
    message.success('Route data exported to CSV');
  };

  const handleDelete = async (routeId: number) => {
    Modal.confirm({
      title: 'Delete Route',
      content: 'Are you sure you want to delete this route? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await routesAPI.deleteRoute(routeId);
          message.success('Route deleted successfully');
          fetchRoutes();
        } catch (err) {
          message.error('Failed to delete route');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingRoute) {
        await routesAPI.updateRoute(editingRoute.route_id, values);
        message.success('Route updated successfully');
      } else {
        await routesAPI.createRoute(values);
        message.success('Route created successfully');
      }
      setIsModalOpen(false);
      setEditingRoute(null);
      form.resetFields();
      fetchRoutes();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to save route');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (route: Route) => {
    setEditingRoute(route);
    form.setFieldsValue(route);
    setIsModalOpen(true);
  };

  const actionMenuItems = (route: Route): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => openEditModal(route) },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(route.route_id) },
  ];

  const columns: ColumnsType<Route> = [
    {
      title: 'Route',
      key: 'route',
      fixed: 'left',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{record.route_name}</div>
          {record.route_code && <Tag color="blue">{record.route_code}</Tag>}
        </div>
      )
    },
    {
      title: 'Origin',
      dataIndex: 'origin_address',
      key: 'origin',
      width: 200,
      ellipsis: true,
      render: (text) => <Tooltip title={text}><EnvironmentOutlined style={{ color: '#10b981' }} /> {text}</Tooltip>
    },
    {
      title: 'Destination',
      dataIndex: 'destination_address',
      key: 'destination',
      width: 200,
      ellipsis: true,
      render: (text) => <Tooltip title={text}><EnvironmentOutlined style={{ color: '#ef4444' }} /> {text}</Tooltip>
    },
    {
      title: 'Distance',
      dataIndex: 'distance_km',
      key: 'distance',
      width: 100,
      render: (km) => km ? `${km.toFixed(1)} km` : '-',
      sorter: (a, b) => (a.distance_km || 0) - (b.distance_km || 0)
    },
    {
      title: 'Duration',
      dataIndex: 'estimated_duration_minutes',
      key: 'duration',
      width: 100,
      render: (mins) => mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '-',
      sorter: (a, b) => (a.estimated_duration_minutes || 0) - (b.estimated_duration_minutes || 0)
    },
    {
      title: 'Toll Cost',
      dataIndex: 'toll_cost',
      key: 'toll',
      width: 100,
      render: (cost) => cost ? `R ${cost.toFixed(2)}` : '-'
    },
    {
      title: 'Type',
      dataIndex: 'route_type',
      key: 'type',
      width: 100,
      render: (type) => {
        const colors: Record<string, string> = { standard: 'default', express: 'gold', economy: 'green', hazmat: 'red' };
        return <Tag color={colors[type] || 'default'}>{type?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'success' : 'default'} icon={active ? <CheckCircleOutlined /> : null}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>Edit</Button>
          <Dropdown menu={{ items: actionMenuItems(record) }} trigger={['click']}>
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <EnterpriseLayout moduleTitle="Route Management" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div className="logistics-page-content">
        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="logistics-section">
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Total Routes" value={stats.total} prefix={<EnvironmentOutlined style={{ color: '#667eea' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Active Routes" value={stats.active} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Standard" value={stats.standard} prefix={<CarOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Express" value={stats.express} valueStyle={{ color: '#f59e0b' }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Avg Distance" value={stats.avgDistance.toFixed(1)} suffix="km" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Avg Duration" value={Math.round(stats.avgDuration)} suffix="min" />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="logistics-card logistics-section">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input placeholder="Search by name, code, origin, or destination..." prefix={<SearchOutlined />}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} size="large" allowClear />
            </Col>
            <Col>
              <Space wrap>
                <Select value={statusFilter} onChange={setStatusFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
                <Select value={typeFilter} onChange={setTypeFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Types' }, { value: 'standard', label: 'Standard' }, { value: 'express', label: 'Express' }, { value: 'economy', label: 'Economy' }, { value: 'hazmat', label: 'Hazmat' }]} />
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { form.resetFields(); setEditingRoute(null); setIsModalOpen(true); }}>Add Route</Button>
                <Button icon={<ExportOutlined />} size="large" onClick={handleExport}>Export</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card className="logistics-card">
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /><div style={{ marginTop: '16px', color: '#64748b' }}>Loading routes...</div></div>
          ) : filteredRoutes.length === 0 ? (
            <Empty description={searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? 'No routes match your filters' : 'No routes created'}>
              {!searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL' && <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add First Route</Button>}
            </Empty>
          ) : (
            <Table columns={columns} dataSource={filteredRoutes} rowKey="route_id"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} routes` }}
              scroll={{ x: 1400 }} />
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal title={editingRoute ? 'Edit Route' : 'Add Route'} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditingRoute(null); }}
        confirmLoading={submitting} onOk={handleSubmit} width={800}>
        <Form layout="vertical" form={form} initialValues={{ route_type: 'standard', is_active: true }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="route_name" label="Route Name" rules={[{ required: true }]}><Input placeholder="e.g., JHB to CPT Express" /></Form.Item></Col>
            <Col span={12}><Form.Item name="route_code" label="Route Code"><Input placeholder="e.g., RT-001" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="origin_address" label="Origin Address" rules={[{ required: true }]}><Input placeholder="Full address" /></Form.Item></Col>
            <Col span={12}><Form.Item name="destination_address" label="Destination Address" rules={[{ required: true }]}><Input placeholder="Full address" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="distance_km" label="Distance (km)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={6}><Form.Item name="estimated_duration_minutes" label="Duration (min)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={6}><Form.Item name="toll_cost" label="Toll Cost (R)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={6}><Form.Item name="fuel_estimate_liters" label="Fuel Est. (L)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="route_type" label="Route Type">
              <Select options={[{ value: 'standard', label: 'Standard' }, { value: 'express', label: 'Express' }, { value: 'economy', label: 'Economy' }, { value: 'hazmat', label: 'Hazmat' }]} />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="is_active" label="Active" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} placeholder="Additional notes..." /></Form.Item>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default RouteManagement;
