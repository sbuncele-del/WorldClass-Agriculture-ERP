import React, { useState, useEffect } from 'react';
import {
  Table, Card, Statistic, Tag, Button, Input, Space, Row, Col,
  Tooltip, Dropdown, Alert, Empty, Spin, Form, Select, InputNumber,
  message, Modal, Switch, ColorPicker
} from 'antd';
import type { MenuProps } from 'antd';
import {
  EnvironmentOutlined, SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, MoreOutlined, ExportOutlined, CheckCircleOutlined,
  BellOutlined, RadarChartOutlined, AimOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { geofencesAPI } from '../../services/logistics.api';
import type { Geofence } from '../../services/logistics.api';
import { exportToCSV } from '../../utils/export';
import './logistics-enterprise.css';

interface GeofenceStats {
  total: number;
  active: number;
  customerSites: number;
  warehouses: number;
  restrictedZones: number;
  alertsEnabled: number;
}

const GeofenceManagement: React.FC = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [filteredGeofences, setFilteredGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [form] = Form.useForm();

  const [stats, setStats] = useState<GeofenceStats>({
    total: 0, active: 0, customerSites: 0, warehouses: 0, restrictedZones: 0, alertsEnabled: 0
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
    { label: 'Geofence Management' }
  ];

  const geofenceTypes = [
    { value: 'customer_site', label: 'Customer Site' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'restricted_zone', label: 'Restricted Zone' },
    { value: 'speed_zone', label: 'Speed Zone' },
    { value: 'delivery_zone', label: 'Delivery Zone' },
    { value: 'no_go_zone', label: 'No-Go Zone' },
  ];

  const geometryTypes = [
    { value: 'circle', label: 'Circle' },
    { value: 'polygon', label: 'Polygon' },
  ];

  useEffect(() => { fetchGeofences(); }, []);
  useEffect(() => { filterGeofences(); }, [geofences, searchTerm, statusFilter, typeFilter]);

  const fetchGeofences = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await geofencesAPI.getGeofences();
      setGeofences(response.geofences || []);
      calculateStats(response.geofences || []);
    } catch (error) {
      console.error('Error fetching geofences:', error);
      setError('Unable to load geofence data. Please try again.');
      setGeofences([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (geofenceList: Geofence[]) => {
    const total = geofenceList.length;
    const active = geofenceList.filter(g => g.is_active).length;
    const customerSites = geofenceList.filter(g => g.geofence_type === 'customer_site').length;
    const warehouses = geofenceList.filter(g => g.geofence_type === 'warehouse').length;
    const restrictedZones = geofenceList.filter(g => g.geofence_type === 'restricted_zone' || g.geofence_type === 'no_go_zone').length;
    const alertsEnabled = geofenceList.filter(g => g.alert_on_enter || g.alert_on_exit || g.alert_on_dwell).length;
    setStats({ total, active, customerSites, warehouses, restrictedZones, alertsEnabled });
  };

  const filterGeofences = () => {
    let filtered = [...geofences];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.geofence_name?.toLowerCase().includes(term) ||
        g.geofence_code?.toLowerCase().includes(term) ||
        g.address?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(g => statusFilter === 'ACTIVE' ? g.is_active : !g.is_active);
    }
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(g => g.geofence_type === typeFilter);
    }
    setFilteredGeofences(filtered);
  };

  const handleExport = () => {
    exportToCSV(filteredGeofences, [
      { key: 'geofence_name', header: 'Name' },
      { key: 'geofence_code', header: 'Code' },
      { key: 'geofence_type', header: 'Type' },
      { key: 'geometry_type', header: 'Geometry' },
      { key: 'center_lat', header: 'Latitude' },
      { key: 'center_lng', header: 'Longitude' },
      { key: 'radius_meters', header: 'Radius (m)' },
      { key: 'is_active', header: 'Active' },
      { key: 'alert_on_enter', header: 'Alert Enter' },
      { key: 'alert_on_exit', header: 'Alert Exit' },
    ], 'geofences');
    message.success('Geofence data exported to CSV');
  };

  const handleDelete = async (geofenceId: number) => {
    Modal.confirm({
      title: 'Delete Geofence',
      content: 'Are you sure you want to delete this geofence? This will also delete all associated events.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await geofencesAPI.deleteGeofence(geofenceId);
          message.success('Geofence deleted successfully');
          fetchGeofences();
        } catch (err) {
          message.error('Failed to delete geofence');
        }
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#3B82F6',
      };
      if (editingGeofence) {
        await geofencesAPI.updateGeofence(editingGeofence.geofence_id, payload);
        message.success('Geofence updated successfully');
      } else {
        await geofencesAPI.createGeofence(payload);
        message.success('Geofence created successfully');
      }
      setIsModalOpen(false);
      setEditingGeofence(null);
      form.resetFields();
      fetchGeofences();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to save geofence');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    form.setFieldsValue(geofence);
    setIsModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer_site: 'blue',
      warehouse: 'purple',
      restricted_zone: 'red',
      speed_zone: 'orange',
      delivery_zone: 'green',
      no_go_zone: 'volcano',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer_site: 'Customer Site',
      warehouse: 'Warehouse',
      restricted_zone: 'Restricted',
      speed_zone: 'Speed Zone',
      delivery_zone: 'Delivery Zone',
      no_go_zone: 'No-Go Zone',
    };
    return labels[type] || type;
  };

  const actionMenuItems = (geofence: Geofence): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => openEditModal(geofence) },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(geofence.geofence_id) },
  ];

  const columns: ColumnsType<Geofence> = [
    {
      title: 'Geofence',
      key: 'geofence',
      fixed: 'left',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: record.color || '#3B82F6', marginRight: 8 }} />
            {record.geofence_name}
          </div>
          {record.geofence_code && <Tag>{record.geofence_code}</Tag>}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'geofence_type',
      key: 'type',
      width: 130,
      render: (type) => <Tag color={getTypeColor(type)}>{getTypeLabel(type)}</Tag>
    },
    {
      title: 'Geometry',
      key: 'geometry',
      width: 140,
      render: (_, record) => (
        <Space>
          <Tag icon={record.geometry_type === 'circle' ? <RadarChartOutlined /> : <AimOutlined />}>
            {record.geometry_type?.toUpperCase()}
          </Tag>
          {record.geometry_type === 'circle' && record.radius_meters && (
            <span style={{ fontSize: 12, color: '#64748b' }}>{record.radius_meters}m</span>
          )}
        </Space>
      )
    },
    {
      title: 'Location',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <div>
          {record.address ? (
            <Tooltip title={record.address}>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                <EnvironmentOutlined /> {record.address}
              </div>
            </Tooltip>
          ) : record.center_lat && record.center_lng ? (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {record.center_lat.toFixed(6)}, {record.center_lng.toFixed(6)}
            </div>
          ) : '-'}
        </div>
      )
    },
    {
      title: 'Alerts',
      key: 'alerts',
      width: 150,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.alert_on_enter && <Tag color="green" style={{ fontSize: 10 }}>Enter</Tag>}
          {record.alert_on_exit && <Tag color="orange" style={{ fontSize: 10 }}>Exit</Tag>}
          {record.alert_on_dwell && <Tag color="blue" style={{ fontSize: 10 }}>Dwell</Tag>}
          {record.speed_limit_kmh && <Tag color="red" style={{ fontSize: 10 }}>{record.speed_limit_kmh}km/h</Tag>}
          {!record.alert_on_enter && !record.alert_on_exit && !record.alert_on_dwell && '-'}
        </Space>
      )
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
    <EnterpriseLayout moduleTitle="Geofence Management" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div className="logistics-page-content">
        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="logistics-section">
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Total Geofences" value={stats.total} prefix={<EnvironmentOutlined style={{ color: '#667eea' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Active" value={stats.active} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Customer Sites" value={stats.customerSites} prefix={<AimOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Warehouses" value={stats.warehouses} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Restricted Zones" value={stats.restrictedZones} valueStyle={{ color: '#ef4444' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Alerts Enabled" value={stats.alertsEnabled} prefix={<BellOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="logistics-card logistics-section">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input placeholder="Search by name, code, or address..." prefix={<SearchOutlined />}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} size="large" allowClear />
            </Col>
            <Col>
              <Space wrap>
                <Select value={statusFilter} onChange={setStatusFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Status' }, { value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
                <Select value={typeFilter} onChange={setTypeFilter} size="large" style={{ width: 160 }}
                  options={[{ value: 'ALL', label: 'All Types' }, ...geofenceTypes]} />
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { form.resetFields(); setEditingGeofence(null); setIsModalOpen(true); }}>Add Geofence</Button>
                <Button icon={<ExportOutlined />} size="large" onClick={handleExport}>Export</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card className="logistics-card">
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /><div style={{ marginTop: '16px', color: '#64748b' }}>Loading geofences...</div></div>
          ) : filteredGeofences.length === 0 ? (
            <Empty description={searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' ? 'No geofences match your filters' : 'No geofences created'}>
              {!searchTerm && statusFilter === 'ALL' && typeFilter === 'ALL' && <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add First Geofence</Button>}
            </Empty>
          ) : (
            <Table columns={columns} dataSource={filteredGeofences} rowKey="geofence_id"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} geofences` }}
              scroll={{ x: 1200 }} />
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal title={editingGeofence ? 'Edit Geofence' : 'Add Geofence'} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditingGeofence(null); }}
        confirmLoading={submitting} onOk={handleSubmit} width={800}>
        <Form layout="vertical" form={form} initialValues={{ geofence_type: 'customer_site', geometry_type: 'circle', is_active: true, alert_on_enter: true, alert_on_exit: true, alert_on_dwell: false, color: '#3B82F6' }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="geofence_name" label="Geofence Name" rules={[{ required: true }]}><Input placeholder="e.g., Customer ABC Warehouse" /></Form.Item></Col>
            <Col span={12}><Form.Item name="geofence_code" label="Code"><Input placeholder="e.g., GEO-001" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="geofence_type" label="Type" rules={[{ required: true }]}><Select options={geofenceTypes} /></Form.Item></Col>
            <Col span={12}><Form.Item name="geometry_type" label="Geometry" rules={[{ required: true }]}><Select options={geometryTypes} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="center_lat" label="Latitude"><InputNumber style={{ width: '100%' }} step={0.000001} precision={6} /></Form.Item></Col>
            <Col span={8}><Form.Item name="center_lng" label="Longitude"><InputNumber style={{ width: '100%' }} step={0.000001} precision={6} /></Form.Item></Col>
            <Col span={8}><Form.Item name="radius_meters" label="Radius (meters)"><InputNumber style={{ width: '100%' }} min={10} max={50000} /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="Address"><Input placeholder="Full address description" /></Form.Item>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="alert_on_enter" label="Alert on Enter" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="alert_on_exit" label="Alert on Exit" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="alert_on_dwell" label="Alert on Dwell" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={6}><Form.Item name="dwell_time_minutes" label="Dwell Time (min)"><InputNumber style={{ width: '100%' }} min={1} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="speed_limit_kmh" label="Speed Limit (km/h)"><InputNumber style={{ width: '100%' }} min={0} max={200} /></Form.Item></Col>
            <Col span={8}><Form.Item name="color" label="Map Color"><ColorPicker /></Form.Item></Col>
            <Col span={8}><Form.Item name="is_active" label="Active" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} placeholder="Additional notes..." /></Form.Item>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default GeofenceManagement;
