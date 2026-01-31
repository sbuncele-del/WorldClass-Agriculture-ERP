import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Progress,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Timeline,
  Alert,
  Switch,
  DatePicker,
  Typography,
  Descriptions,
  message,
  Popconfirm,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  AlertOutlined,
  ToolOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  SettingOutlined,
  BankOutlined,
  EyeOutlined,
  GoldOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';
import dayjs from 'dayjs';

const { Option } = Select;

interface MiningSite {
  id: string;
  code: string;
  name: string;
  location: { lat: number; lng: number; province: string };
  areaHectares: number;
  mineralType: string;
  miningMethod: string;
  status: string;
  license: { number: string; expiry: string };
}

interface SafetyIncident {
  id: string;
  site_id: string;
  site_name: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  injuries_count: number;
  fatalities_count: number;
  status: string;
  root_cause: string;
  corrective_actions: string;
}

interface ProductionRecord {
  id: string;
  site_id: string;
  site_name: string;
  extraction_date: string;
  shift_type: string;
  mineral_type: string;
  quantity_extracted: number;
  quantity_unit: string;
  grade_percent: number;
  processing_status: string;
  notes: string;
}

interface Equipment {
  id: string;
  site_id: string;
  site_name: string;
  code: string;
  name: string;
  equipment_type: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: string;
  purchase_date: string;
  purchase_price: number;
  last_maintenance_date: string;
  next_maintenance_date: string;
  operating_hours: number;
}

const MiningHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [incidentForm] = Form.useForm();
  const [productionForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const [equipmentForm] = Form.useForm();

  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [productionModalVisible, setProductionModalVisible] = useState(false);
  const [siteModalVisible, setSiteModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const [editingIncident, setEditingIncident] = useState<SafetyIncident | null>(null);
  const [editingProduction, setEditingProduction] = useState<ProductionRecord | null>(null);
  const [editingSite, setEditingSite] = useState<MiningSite | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [viewType, setViewType] = useState<string>('');

  const [sites, setSites] = useState<MiningSite[]>([]);
  const [safetyIncidents, setSafetyIncidents] = useState<SafetyIncident[]>([]);
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [miningStats, setMiningStats] = useState({
    totalProduction: 0,
    goldRecovery: 0,
    safetyIncidents: 0,
    fatalityFreeShifts: 1250,
    environmentalScore: 85,
    complianceScore: 95,
    totalSites: 0
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, sitesRes, safetyRes, productionRes, equipmentRes] = await Promise.all([
        apiClient.get('/api/v2/mining/dashboard'),
        apiClient.get('/api/v2/mining/sites'),
        apiClient.get('/api/v2/mining/safety-incidents'),
        apiClient.get('/api/v2/mining/production'),
        apiClient.get('/api/v2/mining/equipment')
      ]);

      if (dashboardRes.data?.data) {
        const dash = dashboardRes.data.data;
        setMiningStats({
          totalProduction: dash.monthlyProduction || 0,
          goldRecovery: dash.summary?.averageGrade || 0,
          safetyIncidents: dash.yearlyIncidents || 0,
          fatalityFreeShifts: dash.summary?.fatalityFreeShifts || 1250,
          environmentalScore: dash.summary?.environmentalScore || 85,
          complianceScore: dash.summary?.complianceScore || dash.summary?.safetyScore || 95,
          totalSites: dash.totalSites || 0
        });
      }

      if (sitesRes.data?.data) setSites(sitesRes.data.data);
      if (safetyRes.data?.data) setSafetyIncidents(safetyRes.data.data);
      if (productionRes.data?.data) setProductionData(productionRes.data.data);
      if (equipmentRes.data?.data) setEquipment(equipmentRes.data.data);

      message.success('Data refreshed');
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // INCIDENT HANDLERS
  const handleOpenIncidentModal = (incident?: SafetyIncident) => {
    if (incident) {
      setEditingIncident(incident);
      incidentForm.setFieldsValue({
        siteId: incident.site_id,
        type: incident.incident_type,
        severity: incident.severity,
        location: incident.location,
        description: incident.description,
        datetime: incident.incident_date ? dayjs(incident.incident_date) : null,
        actions: incident.corrective_actions,
        status: incident.status,
        rootCause: incident.root_cause
      });
    } else {
      setEditingIncident(null);
      incidentForm.resetFields();
    }
    setIncidentModalVisible(true);
  };

  const handleSubmitIncident = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        siteId: values.siteId || sites[0]?.id,
        incidentDate: values.datetime?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        incidentType: values.type,
        severity: values.severity || 'minor',
        location: values.location,
        description: values.description,
        injuriesCount: values.injuries || 0,
        fatalitiesCount: values.fatalities || 0,
        correctiveActions: values.actions,
        rootCause: values.rootCause,
        status: values.status || 'reported'
      };

      if (editingIncident) {
        await apiClient.put(`/api/v2/mining/safety-incidents/${editingIncident.id}`, payload);
        message.success('Incident updated');
      } else {
        await apiClient.post('/api/v2/mining/safety-incidents', payload);
        message.success('Incident reported');
      }

      setIncidentModalVisible(false);
      incidentForm.resetFields();
      setEditingIncident(null);
      const res = await apiClient.get('/api/v2/mining/safety-incidents');
      if (res.data?.data) setSafetyIncidents(res.data.data);
    } catch (error) {
      message.error('Failed to save incident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    try {
      await apiClient.delete(`/api/v2/mining/safety-incidents/${id}`);
      message.success('Incident deleted');
      setSafetyIncidents(prev => prev.filter(i => i.id !== id));
    } catch { message.error('Failed to delete'); }
  };

  // PRODUCTION HANDLERS
  const handleOpenProductionModal = (record?: ProductionRecord) => {
    if (record) {
      setEditingProduction(record);
      productionForm.setFieldsValue({
        siteId: record.site_id,
        extractionDate: record.extraction_date ? dayjs(record.extraction_date) : null,
        shiftType: record.shift_type,
        mineralType: record.mineral_type,
        tons: record.quantity_extracted,
        grade: record.grade_percent,
        processingStatus: record.processing_status,
        notes: record.notes
      });
    } else {
      setEditingProduction(null);
      productionForm.resetFields();
    }
    setProductionModalVisible(true);
  };

  const handleSubmitProduction = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        siteId: values.siteId || sites[0]?.id,
        extractionDate: values.extractionDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        shiftType: values.shiftType || 'day',
        mineralType: values.mineralType || 'gold',
        quantityExtracted: values.tons || 0,
        quantityUnit: 'tonnes',
        gradePercent: values.grade || 0,
        processingStatus: values.processingStatus || 'unprocessed',
        notes: values.notes
      };

      if (editingProduction) {
        await apiClient.put(`/api/v2/mining/production/${editingProduction.id}`, payload);
        message.success('Production updated');
      } else {
        await apiClient.post('/api/v2/mining/production', payload);
        message.success('Production logged');
      }

      setProductionModalVisible(false);
      productionForm.resetFields();
      setEditingProduction(null);
      const res = await apiClient.get('/api/v2/mining/production');
      if (res.data?.data) setProductionData(res.data.data);
    } catch { message.error('Failed to save production'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteProduction = async (id: string) => {
    try {
      await apiClient.delete(`/api/v2/mining/production/${id}`);
      message.success('Record deleted');
      setProductionData(prev => prev.filter(p => p.id !== id));
    } catch { message.error('Failed to delete'); }
  };

  // SITE HANDLERS
  const handleOpenSiteModal = (site?: MiningSite) => {
    if (site) {
      setEditingSite(site);
      siteForm.setFieldsValue({
        code: site.code,
        name: site.name,
        province: site.location?.province,
        mineralType: site.mineralType,
        miningMethod: site.miningMethod,
        status: site.status,
        licenseNumber: site.license?.number,
        licenseExpiry: site.license?.expiry ? dayjs(site.license.expiry) : null,
        areaHectares: site.areaHectares
      });
    } else {
      setEditingSite(null);
      siteForm.resetFields();
    }
    setSiteModalVisible(true);
  };

  const handleSubmitSite = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        code: values.code,
        name: values.name,
        locationLat: -26.2041,
        locationLng: 28.0473,
        province: values.province,
        mineralType: values.mineralType,
        miningMethod: values.miningMethod,
        status: values.status || 'exploration',
        licenseNumber: values.licenseNumber,
        licenseExpiry: values.licenseExpiry?.format('YYYY-MM-DD'),
        areaHectares: values.areaHectares
      };

      if (editingSite) {
        await apiClient.put(`/api/v2/mining/sites/${editingSite.id}`, payload);
        message.success('Site updated');
      } else {
        await apiClient.post('/api/v2/mining/sites', payload);
        message.success('Site created');
      }

      setSiteModalVisible(false);
      siteForm.resetFields();
      setEditingSite(null);
      const res = await apiClient.get('/api/v2/mining/sites');
      if (res.data?.data) setSites(res.data.data);
    } catch { message.error('Failed to save site'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      await apiClient.delete(`/api/v2/mining/sites/${id}`);
      message.success('Site deleted');
      setSites(prev => prev.filter(s => s.id !== id));
    } catch { message.error('Failed to delete'); }
  };

  // EQUIPMENT HANDLERS
  const handleOpenEquipmentModal = (equip?: Equipment) => {
    if (equip) {
      setEditingEquipment(equip);
      equipmentForm.setFieldsValue({
        siteId: equip.site_id,
        code: equip.code,
        name: equip.name,
        equipmentType: equip.equipment_type,
        manufacturer: equip.manufacturer,
        model: equip.model,
        serialNumber: equip.serial_number,
        status: equip.status,
        purchaseDate: equip.purchase_date ? dayjs(equip.purchase_date) : null,
        purchasePrice: equip.purchase_price,
        lastMaintenanceDate: equip.last_maintenance_date ? dayjs(equip.last_maintenance_date) : null,
        nextMaintenanceDate: equip.next_maintenance_date ? dayjs(equip.next_maintenance_date) : null,
        operatingHours: equip.operating_hours
      });
    } else {
      setEditingEquipment(null);
      equipmentForm.resetFields();
    }
    setEquipmentModalVisible(true);
  };

  const handleSubmitEquipment = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        siteId: values.siteId || sites[0]?.id,
        code: values.code,
        name: values.name,
        equipmentType: values.equipmentType,
        manufacturer: values.manufacturer,
        model: values.model,
        serialNumber: values.serialNumber,
        status: values.status || 'operational',
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        purchasePrice: values.purchasePrice,
        lastMaintenanceDate: values.lastMaintenanceDate?.format('YYYY-MM-DD'),
        nextMaintenanceDate: values.nextMaintenanceDate?.format('YYYY-MM-DD'),
        operatingHours: values.operatingHours
      };

      if (editingEquipment) {
        await apiClient.put(`/api/v2/mining/equipment/${editingEquipment.id}`, payload);
        message.success('Equipment updated');
      } else {
        await apiClient.post('/api/v2/mining/equipment', payload);
        message.success('Equipment registered');
      }

      setEquipmentModalVisible(false);
      equipmentForm.resetFields();
      setEditingEquipment(null);
      const res = await apiClient.get('/api/v2/mining/equipment');
      if (res.data?.data) setEquipment(res.data.data);
    } catch { message.error('Failed to save equipment'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await apiClient.delete(`/api/v2/mining/equipment/${id}`);
      message.success('Equipment deleted');
      setEquipment(prev => prev.filter(e => e.id !== id));
    } catch { message.error('Failed to delete'); }
  };

  const handleView = (record: any, type: string) => {
    setViewRecord(record);
    setViewType(type);
    setViewModalVisible(true);
  };

  // TABLE COLUMNS
  const siteColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <strong>{t}</strong> },
    { title: 'Province', key: 'province', render: (_: any, r: MiningSite) => r.location?.province || 'N/A' },
    { title: 'Mineral', dataIndex: 'mineralType', key: 'mineralType' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'operational' ? 'green' : s === 'exploration' ? 'blue' : 'orange'}>{s?.toUpperCase()}</Tag>
    )},
    { title: 'Actions', key: 'actions', render: (_: any, record: MiningSite) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record, 'site')}>View</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenSiteModal(record)}>Edit</Button>
        <Popconfirm title="Delete?" onConfirm={() => handleDeleteSite(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  const safetyColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (t: string) => <a>{t?.substring(0, 8)}...</a>, width: 100 },
    { title: 'Date', dataIndex: 'incident_date', key: 'date', render: (d: string) => d ? new Date(d).toLocaleDateString() : 'N/A' },
    { title: 'Site', dataIndex: 'site_name', key: 'site' },
    { title: 'Type', dataIndex: 'incident_type', key: 'type', render: (t: string) => (
      <Tag color={t === 'fatality' ? 'red' : t === 'lti' ? 'orange' : 'blue'}>{t?.replace('_', ' ')?.toUpperCase()}</Tag>
    )},
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (s: string) => (
      <Tag color={s === 'critical' ? 'red' : s === 'high' ? 'orange' : 'green'}>{s?.toUpperCase()}</Tag>
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'closed' ? 'green' : s === 'investigating' ? 'blue' : 'orange'}>{s?.toUpperCase()}</Tag>
    )},
    { title: 'Actions', key: 'actions', render: (_: any, record: SafetyIncident) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record, 'incident')}>View</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenIncidentModal(record)}>Edit</Button>
        <Popconfirm title="Delete?" onConfirm={() => handleDeleteIncident(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  const productionColumns = [
    { title: 'Date', dataIndex: 'extraction_date', key: 'date', render: (d: string) => d ? new Date(d).toLocaleDateString() : 'N/A' },
    { title: 'Site', dataIndex: 'site_name', key: 'site', render: (s: string) => <Tag color="blue">{s || 'Main'}</Tag> },
    { title: 'Shift', dataIndex: 'shift_type', key: 'shift', render: (s: string) => s?.toUpperCase() || 'DAY' },
    { title: 'Quantity', dataIndex: 'quantity_extracted', key: 'quantity', render: (q: number) => `${(q || 0).toLocaleString()} t` },
    { title: 'Grade', dataIndex: 'grade_percent', key: 'grade', render: (g: number) => `${g || 0} g/t` },
    { title: 'Status', dataIndex: 'processing_status', key: 'status', render: (s: string) => (
      <Tag color={s === 'processed' ? 'green' : 'orange'}>{s?.toUpperCase() || 'PENDING'}</Tag>
    )},
    { title: 'Actions', key: 'actions', render: (_: any, record: ProductionRecord) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record, 'production')}>View</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenProductionModal(record)}>Edit</Button>
        <Popconfirm title="Delete?" onConfirm={() => handleDeleteProduction(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  const equipmentColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <strong>{t}</strong> },
    { title: 'Type', dataIndex: 'equipment_type', key: 'type' },
    { title: 'Site', dataIndex: 'site_name', key: 'site' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => (
      <Tag color={s === 'operational' ? 'green' : s === 'maintenance' ? 'orange' : 'red'}>{s?.toUpperCase()}</Tag>
    )},
    { title: 'Next Maintenance', dataIndex: 'next_maintenance_date', key: 'maintenance', render: (d: string) => {
      if (!d) return 'N/A';
      const isOverdue = new Date(d) < new Date();
      return <Tag color={isOverdue ? 'red' : 'green'}>{new Date(d).toLocaleDateString()}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: any, record: Equipment) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record, 'equipment')}>View</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEquipmentModal(record)}>Edit</Button>
        <Popconfirm title="Delete?" onConfirm={() => handleDeleteEquipment(record.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  // RENDER TABS
  const renderDashboard = () => (
    <Spin spinning={loading}>
      <div style={{ padding: '24px' }}>
        <Alert
          message={<><SafetyCertificateOutlined /> Safety First - {miningStats.fatalityFreeShifts.toLocaleString()} Fatality-Free Shifts</>}
          description="MHSA Compliance: All personnel certified."
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Total Sites" value={sites.length} prefix={<EnvironmentOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card><Statistic title="Production (MTD)" value={miningStats.totalProduction} suffix="t" prefix={<GoldOutlined />} valueStyle={{ color: '#d4af37' }} /></Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Compliance" value={miningStats.complianceScore} suffix="%" prefix={<FileProtectOutlined />} valueStyle={{ color: '#52c41a' }} />
              <Progress percent={miningStats.complianceScore} showInfo={false} strokeColor="#52c41a" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Environmental" value={miningStats.environmentalScore} suffix="%" prefix={<EnvironmentOutlined />} valueStyle={{ color: '#13c2c2' }} />
              <Progress percent={miningStats.environmentalScore} showInfo={false} strokeColor="#13c2c2" />
            </Card>
          </Col>
        </Row>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title={<><FileProtectOutlined /> Mining Sites</>} extra={<Button type="link" onClick={() => setActiveTab('sites')}>View All</Button>}>
              <Table dataSource={sites.slice(0, 5)} columns={siteColumns.slice(0, 5)} rowKey="id" pagination={false} size="small" />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Quick Actions" style={{ marginBottom: 24 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<AlertOutlined />} block onClick={() => handleOpenIncidentModal()}>Report Incident</Button>
                <Button icon={<GoldOutlined />} block onClick={() => handleOpenProductionModal()}>Log Production</Button>
                <Button icon={<ToolOutlined />} block onClick={() => handleOpenEquipmentModal()}>Register Equipment</Button>
                <Button icon={<PlusOutlined />} block onClick={() => handleOpenSiteModal()}>Add Site</Button>
              </Space>
            </Card>
            <Card title="Recent Incidents">
              <Timeline
                items={safetyIncidents.length > 0 ? safetyIncidents.slice(0, 3).map(inc => ({
                  color: inc.severity === 'critical' ? 'red' : 'green',
                  children: <div><strong>{inc.incident_type}</strong> - {inc.status}<br/><small>{inc.location}</small></div>
                })) : [{ color: 'green', children: <div>No incidents</div> }]}
              />
            </Card>
          </Col>
        </Row>
        <Card title={<><BankOutlined /> Financial Integration</>} style={{ marginTop: 24 }}>
          <Row gutter={24}>
            <Col span={6}><Statistic title="Revenue (MTD)" value={miningStats.totalProduction * 1000} prefix="R" valueStyle={{ color: '#52c41a' }} /></Col>
            <Col span={6}><Statistic title="Production Records" value={productionData.length} /></Col>
            <Col span={6}><Statistic title="Equipment" value={equipment.length} /></Col>
            <Col span={6}><Statistic title="Open Incidents" value={safetyIncidents.filter(i => i.status !== 'closed').length} /></Col>
          </Row>
        </Card>
      </div>
    </Spin>
  );

  const renderSites = () => (
    <div style={{ padding: '24px' }}>
      <Card title="Mining Sites" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenSiteModal()}>Add Site</Button>}>
        <Table dataSource={sites} columns={siteColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );

  const renderSafety = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}><Card style={{ background: '#f6ffed' }}><Statistic title="Fatality-Free Shifts" value={miningStats.fatalityFreeShifts} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Incidents" value={safetyIncidents.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Open" value={safetyIncidents.filter(i => i.status !== 'closed').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Critical" value={safetyIncidents.filter(i => i.severity === 'critical').length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Card title="Safety Incidents" extra={<Button type="primary" danger icon={<AlertOutlined />} onClick={() => handleOpenIncidentModal()}>Report Incident</Button>}>
        <Table dataSource={safetyIncidents} columns={safetyColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );

  const renderProduction = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="Total (MTD)" value={productionData.reduce((s, p) => s + (p.quantity_extracted || 0), 0)} suffix="t" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Records" value={productionData.length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Avg Grade" value={productionData.length > 0 ? (productionData.reduce((s, p) => s + (p.grade_percent || 0), 0) / productionData.length).toFixed(2) : 0} suffix="g/t" /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Processed" value={productionData.filter(p => p.processing_status === 'processed').length} /></Card></Col>
      </Row>
      <Card title="Production Log" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenProductionModal()}>Log Production</Button>}>
        <Table dataSource={productionData} columns={productionColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );

  const renderEquipment = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="Total" value={equipment.length} prefix={<ToolOutlined />} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Operational" value={equipment.filter(e => e.status === 'operational').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Maintenance" value={equipment.filter(e => e.status === 'maintenance').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="Out of Service" value={equipment.filter(e => e.status === 'out_of_service').length} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
      </Row>
      <Card title="Equipment Register" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenEquipmentModal()}>Register Equipment</Button>}>
        <Table dataSource={equipment} columns={equipmentColumns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Compliance Settings">
            <Form layout="vertical">
              <Form.Item label="DMR Submission"><Select defaultValue="electronic"><Option value="electronic">Electronic</Option><Option value="manual">Manual</Option></Select></Form.Item>
              <Form.Item label="Auto Alerts"><Switch defaultChecked /></Form.Item>
              <Button type="primary" onClick={() => message.success('Settings saved')}>Save</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Financial Integration">
            <Form layout="vertical">
              <Form.Item label="Revenue Account"><Select defaultValue="4000"><Option value="4000">4000 - Gold Sales</Option></Select></Form.Item>
              <Form.Item label="Auto-post GL"><Switch defaultChecked /></Form.Item>
              <Button type="primary" onClick={() => message.success('Settings saved')}>Save</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Mining Hub"
        subtitle="MPRDA & MHSA Compliant Mining Operations"
        icon={<GoldOutlined />}
        gradient="red"
        actions={
          <>
            <Button icon={<SyncOutlined spin={loading} />} onClick={fetchAllData}>Refresh</Button>
            <Button icon={<DownloadOutlined />}>DMR Reports</Button>
            <Button type="primary" danger icon={<AlertOutlined />} onClick={() => handleOpenIncidentModal()}>Report Incident</Button>
          </>
        }
      />
      <StatusBanner
        gradient="red"
        icon={<SafetyCertificateOutlined />}
        title="Operations Overview"
        subtitle={`${miningStats.fatalityFreeShifts.toLocaleString()} Fatality-Free Shifts`}
        stats={[
          { title: 'Sites', value: sites.length.toString(), span: 4 },
          { title: 'Production', value: `${miningStats.totalProduction}t`, span: 4 },
          { title: 'Compliance', value: `${miningStats.complianceScore}%`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Equipment', value: equipment.length.toString(), span: 4 },
          { title: 'Incidents', value: safetyIncidents.length.toString(), span: 4 },
        ]}
      />
      <HubTabs
        theme="red"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'sites', label: 'Sites', icon: <EnvironmentOutlined />, children: renderSites() },
          { key: 'safety', label: 'Safety', icon: <SafetyCertificateOutlined />, children: renderSafety() },
          { key: 'production', label: 'Production', icon: <GoldOutlined />, children: renderProduction() },
          { key: 'equipment', label: 'Equipment', icon: <ToolOutlined />, children: renderEquipment() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* INCIDENT MODAL */}
      <Modal
        title={editingIncident ? 'Edit Incident' : 'Report Incident'}
        open={incidentModalVisible}
        onCancel={() => { setIncidentModalVisible(false); setEditingIncident(null); incidentForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => setIncidentModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" danger loading={submitting} onClick={() => incidentForm.validateFields().then(handleSubmitIncident)}>
            {editingIncident ? 'Update' : 'Submit'}
          </Button>
        ]}
        width={700}
      >
        <Alert message="MHSA Section 23 - Report within 24 hours" type="warning" showIcon style={{ marginBottom: 16 }} />
        <Form form={incidentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Site" name="siteId" rules={[{ required: true }]}>
                <Select placeholder="Select site">{sites.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date & Time" name="datetime" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                <Select><Option value="fatality">Fatality</Option><Option value="lti">LTI</Option><Option value="firstaid">First Aid</Option><Option value="nearmiss">Near Miss</Option></Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Severity" name="severity" rules={[{ required: true }]}>
                <Select><Option value="critical">Critical</Option><Option value="high">High</Option><Option value="medium">Medium</Option><Option value="minor">Minor</Option></Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Location" name="location" rules={[{ required: true }]}><Input placeholder="Shaft 2 - Level 45" /></Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="Corrective Actions" name="actions"><Input.TextArea rows={2} /></Form.Item>
          {editingIncident && (
            <Row gutter={16}>
              <Col span={12}><Form.Item label="Status" name="status"><Select><Option value="reported">Reported</Option><Option value="investigating">Investigating</Option><Option value="closed">Closed</Option></Select></Form.Item></Col>
              <Col span={12}><Form.Item label="Root Cause" name="rootCause"><Input /></Form.Item></Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* PRODUCTION MODAL */}
      <Modal
        title={editingProduction ? 'Edit Production' : 'Log Production'}
        open={productionModalVisible}
        onCancel={() => { setProductionModalVisible(false); setEditingProduction(null); productionForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => setProductionModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => productionForm.validateFields().then(handleSubmitProduction)}>
            {editingProduction ? 'Update' : 'Log'}
          </Button>
        ]}
        width={600}
      >
        <Form form={productionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Site" name="siteId" rules={[{ required: true }]}><Select>{sites.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item label="Date" name="extractionDate" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Shift" name="shiftType" rules={[{ required: true }]}><Select><Option value="day">Day</Option><Option value="night">Night</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item label="Mineral" name="mineralType" rules={[{ required: true }]}><Select><Option value="gold">Gold</Option><Option value="platinum">Platinum</Option><Option value="coal">Coal</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Quantity (t)" name="tons" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Grade (g/t)" name="grade" rules={[{ required: true }]}><InputNumber min={0} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Status" name="processingStatus"><Select><Option value="unprocessed">Unprocessed</Option><Option value="processing">Processing</Option><Option value="processed">Processed</Option></Select></Form.Item></Col>
          </Row>
          <Form.Item label="Notes" name="notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* SITE MODAL */}
      <Modal
        title={editingSite ? 'Edit Site' : 'Add Site'}
        open={siteModalVisible}
        onCancel={() => { setSiteModalVisible(false); setEditingSite(null); siteForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => setSiteModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => siteForm.validateFields().then(handleSubmitSite)}>
            {editingSite ? 'Update' : 'Create'}
          </Button>
        ]}
        width={700}
      >
        <Form form={siteForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input placeholder="SITE-001" /></Form.Item></Col>
            <Col span={16}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Province" name="province" rules={[{ required: true }]}><Select><Option value="Gauteng">Gauteng</Option><Option value="Limpopo">Limpopo</Option><Option value="Mpumalanga">Mpumalanga</Option><Option value="North West">North West</Option><Option value="Free State">Free State</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item label="Mineral" name="mineralType" rules={[{ required: true }]}><Select><Option value="gold">Gold</Option><Option value="platinum">Platinum</Option><Option value="coal">Coal</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item label="Method" name="miningMethod"><Select><Option value="underground">Underground</Option><Option value="opencast">Open Cast</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Status" name="status"><Select><Option value="exploration">Exploration</Option><Option value="operational">Operational</Option><Option value="closed">Closed</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item label="Area (ha)" name="areaHectares"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="License #" name="licenseNumber"><Input /></Form.Item></Col>
          </Row>
          <Form.Item label="License Expiry" name="licenseExpiry"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* EQUIPMENT MODAL */}
      <Modal
        title={editingEquipment ? 'Edit Equipment' : 'Register Equipment'}
        open={equipmentModalVisible}
        onCancel={() => { setEquipmentModalVisible(false); setEditingEquipment(null); equipmentForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => setEquipmentModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => equipmentForm.validateFields().then(handleSubmitEquipment)}>
            {editingEquipment ? 'Update' : 'Register'}
          </Button>
        ]}
        width={800}
      >
        <Form form={equipmentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Code" name="code" rules={[{ required: true }]}><Input placeholder="EQ-001" /></Form.Item></Col>
            <Col span={16}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Site" name="siteId" rules={[{ required: true }]}><Select>{sites.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item></Col>
            <Col span={8}><Form.Item label="Type" name="equipmentType" rules={[{ required: true }]}><Select><Option value="drill">Drill</Option><Option value="loader">Loader</Option><Option value="haul_truck">Haul Truck</Option><Option value="excavator">Excavator</Option><Option value="crusher">Crusher</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item label="Status" name="status"><Select><Option value="operational">Operational</Option><Option value="maintenance">Maintenance</Option><Option value="out_of_service">Out of Service</Option></Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Manufacturer" name="manufacturer"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Model" name="model"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Serial #" name="serialNumber"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Purchase Date" name="purchaseDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Price (R)" name="purchasePrice"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Hours" name="operatingHours"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Last Maintenance" name="lastMaintenanceDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Next Maintenance" name="nextMaintenanceDate"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        title={`View ${viewType} Details`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[<Button key="close" onClick={() => setViewModalVisible(false)}>Close</Button>]}
        width={700}
      >
        {viewRecord && (
          <Descriptions bordered column={2}>
            {Object.entries(viewRecord).map(([key, value]) => (
              <Descriptions.Item key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}>
                {typeof value === 'object' ? JSON.stringify(value) : String(value || 'N/A')}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Modal>
    </HubLayout>
  );
};

export default MiningHub;
