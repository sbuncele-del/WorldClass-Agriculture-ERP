import React, { useState, useEffect } from 'react';
import {
  Table, Card, Statistic, Tag, Button, Input, Space, Row, Col,
  Tooltip, Dropdown, Alert, Empty, Spin, Form, Select, InputNumber,
  message, Modal, DatePicker, Switch
} from 'antd';
import type { MenuProps } from 'antd';
import {
  WarningOutlined, SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, MoreOutlined, ExportOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, CloseCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { incidentsAPI } from '../../services/logistics.api';
import type { Incident } from '../../services/logistics.api';
import { exportToCSV, formatDate } from '../../utils/export';
import './logistics-enterprise.css';

interface IncidentStats {
  total: number;
  open: number;
  critical: number;
  resolved: number;
  thisMonth: number;
  totalDamage: number;
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [form] = Form.useForm();

  const [stats, setStats] = useState<IncidentStats>({
    total: 0, open: 0, critical: 0, resolved: 0, thisMonth: 0, totalDamage: 0
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
    { label: 'Incident Management' }
  ];

  const incidentTypes = [
    { value: 'accident', label: 'Accident' },
    { value: 'breakdown', label: 'Breakdown' },
    { value: 'delay', label: 'Delay' },
    { value: 'theft', label: 'Theft' },
    { value: 'damage', label: 'Damage' },
    { value: 'violation', label: 'Violation' },
    { value: 'weather', label: 'Weather' },
    { value: 'other', label: 'Other' },
  ];

  const severityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const statusOptions = [
    { value: 'reported', label: 'Reported' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => { fetchIncidents(); }, []);
  useEffect(() => { filterIncidents(); }, [incidents, searchTerm, statusFilter, severityFilter, typeFilter]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await incidentsAPI.getIncidents();
      setIncidents(response.incidents || []);
      calculateStats(response.incidents || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Unable to load incident data. Please try again.');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (incidentList: Incident[]) => {
    const total = incidentList.length;
    const open = incidentList.filter(i => i.status === 'reported' || i.status === 'investigating').length;
    const critical = incidentList.filter(i => i.severity === 'critical').length;
    const resolved = incidentList.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const now = new Date();
    const thisMonth = incidentList.filter(i => {
      const d = new Date(i.incident_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalDamage = incidentList.reduce((sum, i) => sum + (i.damage_estimate || 0), 0);
    setStats({ total, open, critical, resolved, thisMonth, totalDamage });
  };

  const filterIncidents = () => {
    let filtered = [...incidents];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.incident_number?.toLowerCase().includes(term) ||
        i.description?.toLowerCase().includes(term) ||
        i.location_address?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'ALL') filtered = filtered.filter(i => i.status === statusFilter);
    if (severityFilter !== 'ALL') filtered = filtered.filter(i => i.severity === severityFilter);
    if (typeFilter !== 'ALL') filtered = filtered.filter(i => i.incident_type === typeFilter);
    setFilteredIncidents(filtered);
  };

  const handleExport = () => {
    exportToCSV(filteredIncidents, [
      { key: 'incident_number', header: 'Incident #' },
      { key: 'incident_type', header: 'Type' },
      { key: 'severity', header: 'Severity' },
      { key: 'status', header: 'Status' },
      { key: 'incident_date', header: 'Date', formatter: formatDate },
      { key: 'location_address', header: 'Location' },
      { key: 'description', header: 'Description' },
      { key: 'damage_estimate', header: 'Damage Est.' },
      { key: 'injuries_count', header: 'Injuries' },
    ], 'incidents');
    message.success('Incident data exported to CSV');
  };

  const handleDelete = async (incidentId: number) => {
    Modal.confirm({
      title: 'Delete Incident',
      content: 'Are you sure you want to delete this incident record?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await incidentsAPI.deleteIncident(incidentId);
          message.success('Incident deleted successfully');
          fetchIncidents();
        } catch (err) {
          message.error('Failed to delete incident');
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
        incident_date: values.incident_date?.toISOString(),
      };
      if (editingIncident) {
        await incidentsAPI.updateIncident(editingIncident.incident_id, payload);
        message.success('Incident updated successfully');
      } else {
        await incidentsAPI.createIncident(payload);
        message.success('Incident reported successfully');
      }
      setIsModalOpen(false);
      setEditingIncident(null);
      form.resetFields();
      fetchIncidents();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to save incident');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (incident: Incident) => {
    setEditingIncident(incident);
    form.setFieldsValue({
      ...incident,
      incident_date: incident.incident_date ? dayjs(incident.incident_date) : undefined,
    });
    setIsModalOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' };
    return colors[severity] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { reported: 'blue', investigating: 'orange', resolved: 'green', closed: 'default' };
    return colors[status] || 'default';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      accident: <ExclamationCircleOutlined />,
      breakdown: <CloseCircleOutlined />,
      theft: <WarningOutlined />,
      damage: <WarningOutlined />,
    };
    return icons[type] || <FileTextOutlined />;
  };

  const actionMenuItems = (incident: Incident): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => openEditModal(incident) },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => handleDelete(incident.incident_id) },
  ];

  const columns: ColumnsType<Incident> = [
    {
      title: 'Incident #',
      dataIndex: 'incident_number',
      key: 'number',
      width: 140,
      fixed: 'left',
      render: (num) => <Tag color="blue">{num || 'N/A'}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'incident_type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Space>
          {getTypeIcon(type)}
          <span style={{ textTransform: 'capitalize' }}>{type}</span>
        </Space>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => (
        <Tag color={getSeverityColor(severity)} style={{ textTransform: 'uppercase' }}>
          {severity}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={status === 'resolved' ? <CheckCircleOutlined /> : null}>
          {status?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'incident_date',
      key: 'date',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('en-ZA') : '-',
      sorter: (a, b) => new Date(a.incident_date).getTime() - new Date(b.incident_date).getTime()
    },
    {
      title: 'Location',
      dataIndex: 'location_address',
      key: 'location',
      width: 200,
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text || '-'}</Tooltip>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>
    },
    {
      title: 'Damage Est.',
      dataIndex: 'damage_estimate',
      key: 'damage',
      width: 120,
      render: (amt) => amt ? `R ${amt.toLocaleString()}` : '-'
    },
    {
      title: 'Injuries',
      dataIndex: 'injuries_count',
      key: 'injuries',
      width: 80,
      render: (count) => count > 0 ? <Tag color="red">{count}</Tag> : <Tag color="green">0</Tag>
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
    <EnterpriseLayout moduleTitle="Incident Management" tabs={tabs} breadcrumbs={breadcrumbs}>
      <div className="logistics-page-content">
        {/* Critical Alert */}
        {stats.critical > 0 && (
          <Alert
            message={`${stats.critical} Critical Incident${stats.critical > 1 ? 's' : ''} Require Immediate Attention`}
            type="error"
            showIcon
            icon={<WarningOutlined />}
            className="logistics-section"
          />
        )}

        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="logistics-section">
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Total Incidents" value={stats.total} prefix={<WarningOutlined style={{ color: '#667eea' }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Open" value={stats.open} valueStyle={{ color: '#f59e0b' }} prefix={<ExclamationCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Critical" value={stats.critical} valueStyle={{ color: '#ef4444' }} prefix={<CloseCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Resolved" value={stats.resolved} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="This Month" value={stats.thisMonth} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card className="kpi-card">
              <Statistic title="Total Damage" value={stats.totalDamage} prefix="R" precision={0} />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="logistics-card logistics-section">
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <Input placeholder="Search by incident #, description, or location..." prefix={<SearchOutlined />}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} size="large" allowClear />
            </Col>
            <Col>
              <Space wrap>
                <Select value={statusFilter} onChange={setStatusFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Status' }, ...statusOptions]} />
                <Select value={severityFilter} onChange={setSeverityFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Severity' }, ...severityOptions]} />
                <Select value={typeFilter} onChange={setTypeFilter} size="large" style={{ width: 140 }}
                  options={[{ value: 'ALL', label: 'All Types' }, ...incidentTypes]} />
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { form.resetFields(); setEditingIncident(null); setIsModalOpen(true); }}>Report Incident</Button>
                <Button icon={<ExportOutlined />} size="large" onClick={handleExport}>Export</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table */}
        <Card className="logistics-card">
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" /><div style={{ marginTop: '16px', color: '#64748b' }}>Loading incidents...</div></div>
          ) : filteredIncidents.length === 0 ? (
            <Empty description={searchTerm || statusFilter !== 'ALL' || severityFilter !== 'ALL' || typeFilter !== 'ALL' ? 'No incidents match your filters' : 'No incidents reported'}>
              {!searchTerm && statusFilter === 'ALL' && <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Report First Incident</Button>}
            </Empty>
          ) : (
            <Table columns={columns} dataSource={filteredIncidents} rowKey="incident_id"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} incidents` }}
              scroll={{ x: 1500 }} />
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal title={editingIncident ? 'Edit Incident' : 'Report Incident'} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditingIncident(null); }}
        confirmLoading={submitting} onOk={handleSubmit} width={800}>
        <Form layout="vertical" form={form} initialValues={{ severity: 'medium', status: 'reported', injuries_count: 0, fatalities_count: 0, property_damage: false, police_report_filed: false }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="incident_type" label="Incident Type" rules={[{ required: true }]}><Select options={incidentTypes} /></Form.Item></Col>
            <Col span={12}><Form.Item name="incident_date" label="Incident Date" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="severity" label="Severity" rules={[{ required: true }]}><Select options={severityOptions} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status"><Select options={statusOptions} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea rows={3} placeholder="Describe the incident in detail..." /></Form.Item>
          <Form.Item name="location_address" label="Location"><Input placeholder="Address or location description" /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="injuries_count" label="Injuries"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="fatalities_count" label="Fatalities"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="damage_estimate" label="Damage Estimate (R)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="property_damage" label="Property Damage" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="police_report_filed" label="Police Report Filed" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="police_report_number" label="Police Report #"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="cause" label="Cause"><Input.TextArea rows={2} placeholder="Root cause analysis..." /></Form.Item>
          <Form.Item name="corrective_actions" label="Corrective Actions"><Input.TextArea rows={2} placeholder="Actions taken or planned..." /></Form.Item>
        </Form>
      </Modal>
    </EnterpriseLayout>
  );
};

export default IncidentManagement;
