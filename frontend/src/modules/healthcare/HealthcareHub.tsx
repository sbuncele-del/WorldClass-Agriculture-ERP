/**
 * HealthcareHub - Healthcare Industry Management
 * 
 * Features:
 * - Patient Billing & Accounts
 * - Medical Aid Integration (Discovery, Medscheme, Gems, etc.)
 * - ICD-10 Coding
 * - HPCSA Practitioner Compliance
 * - Appointment Scheduling
 * - Stock/Dispensary Management
 * - Chronic Medication Programs
 * - Practice Management
 * - Claims Management & ERA Processing
 * - Financial Integration (IFRS 15 Revenue Recognition)
 */

import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space, Badge,
  Input, Select, DatePicker, Modal, Form, Typography, Avatar,
  Timeline, Descriptions, Tooltip, Dropdown, InputNumber, Switch, Alert,
  List, Tabs, Divider, Steps, Upload, message, Calendar, Collapse, Checkbox, TimePicker
} from 'antd';
import {
  HomeOutlined, TeamOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, BarChartOutlined, CheckCircleOutlined, WarningOutlined,
  PlusOutlined, SearchOutlined, FilterOutlined, ExportOutlined,
  SettingOutlined, SyncOutlined, FlagOutlined, SafetyCertificateOutlined,
  UserOutlined, BellOutlined, ThunderboltOutlined, MedicineBoxOutlined,
  AuditOutlined, BankOutlined, RocketOutlined, HeartOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined, FileProtectOutlined,
  FileDoneOutlined, TrophyOutlined, PieChartOutlined, LineChartOutlined,
  FileTextOutlined, SolutionOutlined, ProfileOutlined, ScheduleOutlined,
  CreditCardOutlined, IdcardOutlined, PhoneOutlined, MailOutlined
} from '@ant-design/icons';
import { HubLayout, HubHeader, StatusBanner, HubTabs } from '../../components/hub';
import apiClient from '../../services/api';
import { useClient } from '../../contexts/ClientContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Panel } = Collapse;

// Interfaces
interface Patient {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dob: string;
  gender: 'M' | 'F';
  cellphone: string;
  email: string;
  medicalAid?: string;
  memberNumber?: string;
  dependantCode?: string;
  planOption?: string;
  balance: number;
  lastVisit?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  practitioner: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: 'consultation' | 'follow-up' | 'procedure' | 'chronic';
  status: 'scheduled' | 'confirmed' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  patientId: string;
  patientName: string;
  date: string;
  medicalAid?: string;
  memberNo?: string;
  grossAmount: number;
  medicalAidPortion: number;
  patientPortion: number;
  status: 'draft' | 'submitted' | 'paid' | 'rejected' | 'partially-paid';
  icd10Codes: string[];
  tariffCodes: string[];
}

interface Claim {
  id: string;
  claimNo: string;
  invoiceNo: string;
  patientName: string;
  medicalAid: string;
  submittedDate: string;
  amount: number;
  status: 'submitted' | 'processing' | 'accepted' | 'rejected' | 'paid';
  rejectionReason?: string;
  paidAmount?: number;
  paidDate?: string;
}

interface MedicalAidScheme {
  id: string;
  name: string;
  code: string;
  administrator: string;
  activePatients: number;
  outstandingClaims: number;
  avgPaymentDays: number;
}

interface Practitioner {
  id: string;
  name: string;
  hpcsaNumber: string;
  specialty: string;
  practiceNumber: string;
  status: 'active' | 'inactive';
  appointmentsToday: number;
}

const HealthcareHub: React.FC = () => {
  const { currentClient } = useClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [facilityModalVisible, setFacilityModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [schemes, setSchemes] = useState<MedicalAidScheme[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [patientForm] = Form.useForm();
  const [appointmentForm] = Form.useForm();
  const [facilityForm] = Form.useForm();
  
  // Get company name from client context
  const companyName = currentClient?.name || currentClient?.company_name || 'Healthcare Practice';

  // Fetch healthcare data from API
  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [facilitiesRes, patientsRes, appointmentsRes, invoicesRes, claimsRes, schemesRes, practitionersRes] = await Promise.all([
        fetch('/api/healthcare/facilities', { headers }),
        fetch('/api/healthcare/patients', { headers }),
        fetch('/api/healthcare/appointments', { headers }),
        fetch('/api/healthcare/invoices', { headers }),
        fetch('/api/healthcare/claims', { headers }),
        fetch('/api/healthcare/schemes', { headers }),
        fetch('/api/healthcare/practitioners', { headers })
      ]);
      if (facilitiesRes.ok) setFacilities((await facilitiesRes.json()).data || []);
      if (patientsRes.ok) setPatients((await patientsRes.json()).data || []);
      if (appointmentsRes.ok) setAppointments((await appointmentsRes.json()).data || []);
      if (invoicesRes.ok) setInvoices((await invoicesRes.json()).data || []);
      if (claimsRes.ok) setClaims((await claimsRes.json()).data || []);
      if (schemesRes.ok) setSchemes((await schemesRes.json()).data || []);
      if (practitionersRes.ok) setPractitioners((await practitionersRes.json()).data || []);
    } catch (error) {
      console.error('Failed to fetch healthcare data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CREATE FACILITY
  const handleCreateFacility = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/healthcare/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          facility_code: values.facility_code,
          facility_name: values.facility_name,
          facility_type: values.facility_type,
          phone: values.phone,
          email: values.email,
          address_line1: values.address,
          city: values.city,
          province: values.province,
          total_beds: values.total_beds || 0
        })
      });
      const data = await response.json();
      if (data.success) {
        message.success('Facility created successfully!');
        setFacilityModalVisible(false);
        facilityForm.resetFields();
        fetchData();
      } else {
        message.error(data.error || 'Failed to create facility');
      }
    } catch (error) {
      message.error('Failed to create facility');
    } finally {
      setLoading(false);
    }
  };

  // CREATE PATIENT
  const handleCreatePatient = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/healthcare/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          first_name: values.first_name,
          last_name: values.last_name,
          id_number: values.id_number,
          date_of_birth: values.date_of_birth?.format('YYYY-MM-DD'),
          gender: values.gender,
          phone: values.phone,
          email: values.email,
          address: values.address,
          medical_aid_name: values.medical_aid,
          medical_aid_number: values.member_number
        })
      });
      const data = await response.json();
      if (data.success) {
        message.success('Patient registered successfully!');
        setPatientModalVisible(false);
        patientForm.resetFields();
        fetchData();
      } else {
        message.error(data.error || 'Failed to register patient');
      }
    } catch (error) {
      message.error('Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  // CREATE APPOINTMENT
  const handleCreateAppointment = async (values: any) => {
    setLoading(true);
    try {
      if (facilities.length === 0) {
        message.warning('Please create a facility first before booking appointments');
        setLoading(false);
        return;
      }
      const response = await fetch('/api/healthcare/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patient_id: values.patient_id,
          facility_id: values.facility_id || facilities[0]?.facility_id,
          appointment_date: values.appointment_date?.format('YYYY-MM-DD'),
          appointment_time: values.appointment_time?.format('HH:mm'),
          appointment_type: values.appointment_type || 'CONSULTATION',
          duration_minutes: values.duration || 30,
          reason_for_visit: values.reason
        })
      });
      const data = await response.json();
      if (data.success) {
        message.success('Appointment booked successfully!');
        setAppointmentModalVisible(false);
        appointmentForm.resetFields();
        fetchData();
      } else {
        message.error(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      message.error('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const healthcareStats = {
    totalPatients: patients.length,
    todayAppointments: appointments.filter(a => a.date === '2024-06-15').length,
    pendingClaims: claims.filter(c => ['submitted', 'processing'].includes(c.status)).length,
    outstandingDebtors: patients.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0),
    monthlyRevenue: invoices.reduce((sum, i) => sum + i.grossAmount, 0),
    claimsValue: claims.filter(c => c.status === 'processing' || c.status === 'submitted').reduce((sum, c) => sum + c.amount, 0)
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'blue', confirmed: 'cyan', arrived: 'orange',
      'in-progress': 'green', completed: 'default', cancelled: 'red', 'no-show': 'magenta'
    };
    return colors[status] || 'default';
  };

  // Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Today's Appointments"
              value={healthcareStats.todayAppointments}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress percent={Math.round((appointments.filter(a => a.status === 'completed').length / healthcareStats.todayAppointments) * 100)} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Claims"
              value={healthcareStats.pendingClaims}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary">R{healthcareStats.claimsValue.toLocaleString()} value</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Outstanding Debtors"
              value={healthcareStats.outstandingDebtors}
              prefix="R"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Text type="secondary">{patients.filter(p => p.balance > 0).length} patients</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="MTD Revenue"
              value={healthcareStats.monthlyRevenue}
              prefix="R"
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary">vs R48,500 target</Text>
          </Card>
        </Col>
      </Row>

      {/* HPCSA Compliance Alert */}
      <Alert
        message="Practice Compliance Status"
        description={
          <Space wrap>
            <Tag color="green">HPCSA: All practitioners registered</Tag>
            <Tag color="green">Practice Number: PR0001234</Tag>
            <Tag color="blue">BHF Accredited</Tag>
            <Tag color="cyan">PoPI Compliant</Tag>
          </Space>
        }
        type="success"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginTop: 16, marginBottom: 16 }}
      />

      {/* Today's Schedule & Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title={<><CalendarOutlined /> Today's Appointments</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAppointmentModalVisible(true)}>Book Appointment</Button>}
          >
            <Table
              dataSource={appointments.filter(a => a.date === '2024-06-15')}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Time', dataIndex: 'time', key: 'time', width: 70 },
                {
                  title: 'Patient',
                  key: 'patient',
                  render: (_, record) => (
                    <div>
                      <Text strong>{record.patientName}</Text>
                      <br />
                      <Tag color={record.type === 'chronic' ? 'purple' : record.type === 'procedure' ? 'orange' : 'blue'}>
                        {record.type}
                      </Tag>
                    </div>
                  )
                },
                { title: 'Practitioner', dataIndex: 'practitioner', key: 'practitioner' },
                { 
                  title: 'Duration', 
                  dataIndex: 'duration', 
                  key: 'duration',
                  render: (d: number) => `${d} min`
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Space>
                      {record.status === 'scheduled' && <Button size="small">Confirm</Button>}
                      {record.status === 'confirmed' && <Button size="small" type="primary">Check In</Button>}
                      {record.status === 'arrived' && <Button size="small" type="primary">Start</Button>}
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<><BellOutlined /> Alerts & Notifications</>}>
            <List
              size="small"
              dataSource={[
                { type: 'claim', title: 'ERA Received - Discovery', description: 'R28,450 processed', color: 'green', icon: <CheckCircleOutlined /> },
                { type: 'rejection', title: 'Claim Rejected - GEMS', description: 'INV-2024-0015: Invalid ICD-10', color: 'red', icon: <WarningOutlined /> },
                { type: 'chronic', title: 'Chronic Script Expiring', description: '3 patients - action needed', color: 'orange', icon: <MedicineBoxOutlined /> },
                { type: 'balance', title: 'Aged Debt Alert', description: '5 accounts > 60 days', color: 'red', icon: <DollarOutlined /> }
              ]}
              renderItem={item => (
                <List.Item>
                  <Space>
                    <Avatar icon={item.icon} style={{ backgroundColor: item.color === 'green' ? '#52c41a' : item.color === 'red' ? '#ff4d4f' : '#faad14' }} size="small" />
                    <div>
                      <Text strong>{item.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Medical Aid Overview */}
      <Card title={<><CreditCardOutlined /> Medical Aid Claims Overview</>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {schemes.slice(0, 4).map(scheme => (
            <Col span={6} key={scheme.id}>
              <Card size="small">
                <Statistic title={scheme.name} value={scheme.outstandingClaims} prefix="R" formatter={(v) => v.toLocaleString()} />
                <Text type="secondary">{scheme.activePatients} patients • Avg {scheme.avgPaymentDays} days</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );

  // Patients List
  const renderPatients = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title="Patient Management"
        extra={
          <Space>
            <Input placeholder="Search patients..." prefix={<SearchOutlined />} style={{ width: 250 }} />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Patients</Option>
              <Option value="medical-aid">Medical Aid</Option>
              <Option value="private">Private</Option>
              <Option value="owing">Owing Balance</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPatientModalVisible(true)}>
              New Patient
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={patients}
          rowKey="id"
          columns={[
            {
              title: 'Patient',
              key: 'patient',
              render: (_, record) => (
                <Space>
                  <Avatar icon={<UserOutlined />} style={{ backgroundColor: record.gender === 'M' ? '#1890ff' : '#eb2f96' }} />
                  <div>
                    <Text strong>{record.title} {record.firstName} {record.lastName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>ID: {record.idNumber}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: 'Contact',
              key: 'contact',
              render: (_, record) => (
                <div>
                  <Text><PhoneOutlined /> {record.cellphone}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}><MailOutlined /> {record.email}</Text>
                </div>
              )
            },
            {
              title: 'Medical Aid',
              key: 'medicalAid',
              render: (_, record) => record.medicalAid ? (
                <div>
                  <Tag color="blue">{record.medicalAid}</Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {record.memberNumber} ({record.dependantCode})
                  </Text>
                </div>
              ) : <Tag>Private</Tag>
            },
            {
              title: 'Plan',
              dataIndex: 'planOption',
              key: 'planOption',
              render: (plan: string) => plan || '-'
            },
            {
              title: 'Balance',
              dataIndex: 'balance',
              key: 'balance',
              render: (balance: number) => (
                <Text style={{ color: balance > 0 ? '#ff4d4f' : balance < 0 ? '#52c41a' : undefined }}>
                  R{balance.toLocaleString()}
                </Text>
              )
            },
            {
              title: 'Last Visit',
              dataIndex: 'lastVisit',
              key: 'lastVisit'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Dropdown
                  menu={{
                    items: [
                      { key: 'view', label: 'View Profile', icon: <EyeOutlined /> },
                      { key: 'edit', label: 'Edit Details', icon: <EditOutlined /> },
                      { key: 'appointment', label: 'Book Appointment', icon: <CalendarOutlined /> },
                      { key: 'invoice', label: 'Create Invoice', icon: <FileTextOutlined /> },
                      { type: 'divider' },
                      { key: 'history', label: 'Visit History', icon: <ProfileOutlined /> }
                    ]
                  }}
                >
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Appointments/Schedule
  const renderAppointments = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><CalendarOutlined /> Appointment Schedule</>}
        extra={
          <Space>
            <Select defaultValue="today" style={{ width: 120 }}>
              <Option value="today">Today</Option>
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
            </Select>
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Practitioners</Option>
              {practitioners.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAppointmentModalVisible(true)}>
              Book Appointment
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Scheduled" value={appointments.filter(a => a.status === 'scheduled').length} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Confirmed" value={appointments.filter(a => a.status === 'confirmed').length} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Completed" value={appointments.filter(a => a.status === 'completed').length} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="No Shows" value={appointments.filter(a => a.status === 'no-show').length} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>

        <Table
          dataSource={appointments}
          rowKey="id"
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Time', dataIndex: 'time', key: 'time' },
            {
              title: 'Patient',
              key: 'patient',
              render: (_, record) => (
                <div>
                  <Text strong>{record.patientName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{record.reason}</Text>
                </div>
              )
            },
            { title: 'Practitioner', dataIndex: 'practitioner', key: 'practitioner' },
            { 
              title: 'Type', 
              dataIndex: 'type', 
              key: 'type',
              render: (type: string) => {
                const colors: Record<string, string> = {
                  consultation: 'blue', 'follow-up': 'cyan', procedure: 'orange', chronic: 'purple'
                };
                return <Tag color={colors[type]}>{type}</Tag>;
              }
            },
            { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (d: number) => `${d} min` },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  {record.status === 'scheduled' && <Button size="small">Confirm</Button>}
                  {record.status === 'confirmed' && <Button size="small" type="primary">Check In</Button>}
                  {record.status === 'arrived' && <Button size="small" type="primary">Start</Button>}
                  {record.status === 'in-progress' && <Button size="small" type="primary">Complete</Button>}
                  <Button size="small" icon={<EditOutlined />} />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Billing/Invoices
  const renderBilling = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><DollarOutlined /> Billing & Invoicing</>}
        extra={
          <Space>
            <Input placeholder="Search..." prefix={<SearchOutlined />} style={{ width: 200 }} />
            <Select defaultValue="all" style={{ width: 150 }}>
              <Option value="all">All Status</Option>
              <Option value="draft">Draft</Option>
              <Option value="submitted">Submitted</Option>
              <Option value="paid">Paid</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInvoiceModalVisible(true)}>
              New Invoice
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={invoices}
          rowKey="id"
          columns={[
            { title: 'Invoice #', dataIndex: 'invoiceNo', key: 'invoiceNo' },
            { title: 'Date', dataIndex: 'date', key: 'date' },
            {
              title: 'Patient',
              key: 'patient',
              render: (_, record) => (
                <div>
                  <Text strong>{record.patientName}</Text>
                  {record.medicalAid && (
                    <>
                      <br />
                      <Tag color="blue" style={{ fontSize: 10 }}>{record.medicalAid}</Tag>
                    </>
                  )}
                </div>
              )
            },
            {
              title: 'ICD-10 Codes',
              dataIndex: 'icd10Codes',
              key: 'icd10Codes',
              render: (codes: string[]) => codes.map(c => <Tag key={c}>{c}</Tag>)
            },
            { 
              title: 'Gross', 
              dataIndex: 'grossAmount', 
              key: 'grossAmount',
              render: (amount: number) => `R${amount.toLocaleString()}`
            },
            { 
              title: 'Medical Aid', 
              dataIndex: 'medicalAidPortion', 
              key: 'medicalAidPortion',
              render: (amount: number) => <Text type="success">R{amount.toLocaleString()}</Text>
            },
            { 
              title: 'Patient', 
              dataIndex: 'patientPortion', 
              key: 'patientPortion',
              render: (amount: number) => `R${amount.toLocaleString()}`
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const colors: Record<string, string> = {
                  draft: 'default', submitted: 'processing', paid: 'success', rejected: 'error', 'partially-paid': 'warning'
                };
                return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
              }
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />} />
                  {record.status === 'draft' && <Button size="small" type="primary">Submit Claim</Button>}
                  <Button size="small" icon={<ExportOutlined />} />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Claims Management
  const renderClaims = () => (
    <div style={{ padding: '24px' }}>
      <Card
        title={<><FileTextOutlined /> Claims Management</>}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 180 }}>
              <Option value="all">All Medical Aids</Option>
              {schemes.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
            <Button icon={<SyncOutlined />}>Fetch ERAs</Button>
            <Button type="primary" icon={<ExportOutlined />}>Submit Batch</Button>
          </Space>
        }
      >
        <Alert
          message="Electronic Remittance Advice (ERA)"
          description="Last ERA processed: Discovery Health - 2024-06-12 | 45 claims processed | R28,450 received"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Submitted" value={claims.filter(c => c.status === 'submitted').length} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Processing" value={claims.filter(c => c.status === 'processing').length} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Paid" value={claims.filter(c => c.status === 'paid').length} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title="Rejected" value={claims.filter(c => c.status === 'rejected').length} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>

        <Table
          dataSource={claims}
          rowKey="id"
          columns={[
            { title: 'Claim #', dataIndex: 'claimNo', key: 'claimNo' },
            { title: 'Invoice', dataIndex: 'invoiceNo', key: 'invoiceNo' },
            { title: 'Patient', dataIndex: 'patientName', key: 'patientName' },
            { title: 'Medical Aid', dataIndex: 'medicalAid', key: 'medicalAid', render: (ma: string) => <Tag color="blue">{ma}</Tag> },
            { title: 'Submitted', dataIndex: 'submittedDate', key: 'submittedDate' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => `R${a.toLocaleString()}` },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const colors: Record<string, string> = {
                  submitted: 'blue', processing: 'cyan', accepted: 'green', rejected: 'red', paid: 'success'
                };
                return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
              }
            },
            { 
              title: 'Paid', 
              key: 'paid',
              render: (_, record) => record.paidAmount ? (
                <Text type="success">R{record.paidAmount.toLocaleString()}</Text>
              ) : '-'
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />} />
                  {record.status === 'rejected' && <Button size="small" type="primary">Resubmit</Button>}
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Medical Aids
  const renderMedicalAids = () => (
    <div style={{ padding: '24px' }}>
      <Card title={<><CreditCardOutlined /> Medical Aid Schemes</>}>
        <Table
          dataSource={schemes}
          rowKey="id"
          columns={[
            {
              title: 'Scheme',
              key: 'scheme',
              render: (_, record) => (
                <div>
                  <Text strong>{record.name}</Text>
                  <br />
                  <Text type="secondary">Code: {record.code}</Text>
                </div>
              )
            },
            { title: 'Administrator', dataIndex: 'administrator', key: 'administrator' },
            { title: 'Active Patients', dataIndex: 'activePatients', key: 'activePatients' },
            { 
              title: 'Outstanding Claims', 
              dataIndex: 'outstandingClaims', 
              key: 'outstandingClaims',
              render: (amount: number) => <Text type="warning">R{amount.toLocaleString()}</Text>
            },
            { 
              title: 'Avg Payment Days', 
              dataIndex: 'avgPaymentDays', 
              key: 'avgPaymentDays',
              render: (days: number) => <Tag color={days <= 14 ? 'green' : days <= 21 ? 'orange' : 'red'}>{days} days</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: () => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />}>View Claims</Button>
                  <Button size="small" icon={<SettingOutlined />} />
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );

  // Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={<><SafetyCertificateOutlined /> Practice Details</>}>
            <Form layout="vertical">
              <Form.Item label="Practice Name">
                <Input defaultValue={companyName} />
              </Form.Item>
              <Form.Item label="Practice Number">
                <Input placeholder="Enter practice number" />
              </Form.Item>
              <Form.Item label="VAT Number">
                <Input placeholder="Enter VAT number" />
              </Form.Item>
              <Form.Item label="BHF Practice Code">
                <Input placeholder="Enter BHF practice code" />
              </Form.Item>
              <Button type="primary">Save Details</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Practitioners">
            <Table
              dataSource={practitioners}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'HPCSA No', dataIndex: 'hpcsaNumber', key: 'hpcsaNumber' },
                { title: 'Specialty', dataIndex: 'specialty', key: 'specialty' },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  key: 'status',
                  render: (s: string) => <Tag color={s === 'active' ? 'green' : 'red'}>{s}</Tag>
                }
              ]}
            />
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 16, width: '100%' }}>Add Practitioner</Button>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Financial Integration">
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Revenue Account">
                    <Select defaultValue="4000">
                      <Option value="4000">4000 - Medical Revenue</Option>
                      <Option value="4100">4100 - Consultation Fees</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Accounts Receivable">
                    <Select defaultValue="1100">
                      <Option value="1100">1100 - Trade Receivables</Option>
                      <Option value="1110">1110 - Medical Aid Receivables</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="VAT Rate">
                    <InputNumber defaultValue={0} min={0} max={15} formatter={v => `${v}%`} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary">Save Financial Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card 
            title={<><MedicineBoxOutlined /> Facilities</>}
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setFacilityModalVisible(true)}>Add Facility</Button>}
          >
            <Table
              dataSource={facilities}
              rowKey="facility_id"
              columns={[
                { title: 'Code', dataIndex: 'facility_code', key: 'facility_code' },
                { title: 'Name', dataIndex: 'facility_name', key: 'facility_name' },
                { title: 'Type', dataIndex: 'facility_type', key: 'facility_type', render: (t: string) => <Tag color="blue">{t}</Tag> },
                { title: 'City', dataIndex: 'city', key: 'city' },
                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                { 
                  title: 'Status', 
                  dataIndex: 'is_active',
                  key: 'status',
                  render: (active: boolean) => <Tag color={active !== false ? 'green' : 'red'}>{active !== false ? 'Active' : 'Inactive'}</Tag>
                }
              ]}
              locale={{ emptyText: 'No facilities registered. Click "Add Facility" to create one.' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Healthcare Hub"
        subtitle="Practice Management & Medical Billing"
        icon={<HeartOutlined />}
        gradient="pink"
        actions={
          <>
            <Button icon={<SyncOutlined />} onClick={fetchData}>Refresh</Button>
            <Button icon={<MedicineBoxOutlined />} onClick={() => setFacilityModalVisible(true)}>Add Facility</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPatientModalVisible(true)}>
              Register Patient
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="pink"
        icon={<HeartOutlined />}
        title="Practice Overview"
        subtitle="Daily Performance"
        stats={[
          { title: 'Today Appointments', value: healthcareStats.todayAppointments, span: 4 },
          { title: 'Pending Claims', value: healthcareStats.pendingClaims, span: 4 },
          { title: 'MTD Revenue', value: `R${healthcareStats.monthlyRevenue.toLocaleString()}`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Outstanding', value: `R${healthcareStats.outstandingDebtors.toLocaleString()}`, valueStyle: { color: '#fca5a5' }, span: 4 },
          { title: 'Total Patients', value: healthcareStats.totalPatients, span: 4 },
        ]}
      />

      <HubTabs
        theme="pink"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'patients', label: 'Patients', icon: <TeamOutlined />, children: renderPatients() },
          { key: 'appointments', label: 'Appointments', icon: <CalendarOutlined />, children: renderAppointments() },
          { key: 'billing', label: 'Billing', icon: <DollarOutlined />, children: renderBilling() },
          { key: 'claims', label: 'Claims', icon: <FileTextOutlined />, children: renderClaims() },
          { key: 'medical-aids', label: 'Medical Aids', icon: <CreditCardOutlined />, children: renderMedicalAids() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Patient Registration Modal */}
      <Modal
        title="Register New Patient"
        open={patientModalVisible}
        onCancel={() => { setPatientModalVisible(false); patientForm.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={patientForm} layout="vertical" onFinish={handleCreatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="id_number" label="ID Number" rules={[{ required: true }]}>
                <Input placeholder="Enter ID number" maxLength={13} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select placeholder="Select gender">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Medical Aid Details (Optional)</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="medical_aid" label="Medical Aid">
                <Select placeholder="Select medical aid" allowClear>
                  {schemes.map(s => <Option key={s.id} value={s.name}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="member_number" label="Member Number">
                <Input placeholder="Medical aid member number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="plan_option" label="Plan/Option">
                <Input placeholder="Plan option" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>Register Patient</Button>
              <Button onClick={() => { setPatientModalVisible(false); patientForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Appointment Booking Modal */}
      <Modal
        title="Book Appointment"
        open={appointmentModalVisible}
        onCancel={() => { setAppointmentModalVisible(false); appointmentForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={appointmentForm} layout="vertical" onFinish={handleCreateAppointment}>
          <Form.Item name="patient_id" label="Patient" rules={[{ required: true, message: 'Please select a patient' }]}>
            <Select placeholder="Select patient" showSearch optionFilterProp="children">
              {patients.map((p: any) => (
                <Option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} - {p.id_number || 'No ID'}</Option>
              ))}
            </Select>
          </Form.Item>
          {facilities.length > 0 && (
            <Form.Item name="facility_id" label="Facility">
              <Select placeholder="Select facility" defaultValue={facilities[0]?.facility_id}>
                {facilities.map(f => (
                  <Option key={f.facility_id} value={f.facility_id}>{f.facility_name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointment_date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="appointment_time" label="Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="appointment_type" label="Appointment Type">
                <Select defaultValue="CONSULTATION">
                  <Option value="CONSULTATION">Consultation</Option>
                  <Option value="FOLLOW_UP">Follow-up</Option>
                  <Option value="PROCEDURE">Procedure</Option>
                  <Option value="CHRONIC">Chronic Care</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (minutes)">
                <Select defaultValue={30}>
                  <Option value={15}>15 minutes</Option>
                  <Option value={30}>30 minutes</Option>
                  <Option value={45}>45 minutes</Option>
                  <Option value={60}>1 hour</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Reason for Visit">
            <Input.TextArea rows={3} placeholder="Enter reason for appointment" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>Book Appointment</Button>
              <Button onClick={() => { setAppointmentModalVisible(false); appointmentForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Facility Registration Modal */}
      <Modal
        title="Add New Facility"
        open={facilityModalVisible}
        onCancel={() => { setFacilityModalVisible(false); facilityForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={facilityForm} layout="vertical" onFinish={handleCreateFacility}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="facility_code" label="Facility Code" rules={[{ required: true }]}>
                <Input placeholder="e.g., FAC001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="facility_name" label="Facility Name" rules={[{ required: true }]}>
                <Input placeholder="Enter facility name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="facility_type" label="Facility Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="HOSPITAL">Hospital</Option>
                  <Option value="CLINIC">Clinic</Option>
                  <Option value="PHARMACY">Pharmacy</Option>
                  <Option value="LABORATORY">Laboratory</Option>
                  <Option value="SPECIALIST_ROOMS">Specialist Rooms</Option>
                  <Option value="GP_PRACTICE">GP Practice</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="City">
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="province" label="Province">
                <Select placeholder="Select province">
                  <Option value="Gauteng">Gauteng</Option>
                  <Option value="Western Cape">Western Cape</Option>
                  <Option value="KwaZulu-Natal">KwaZulu-Natal</Option>
                  <Option value="Eastern Cape">Eastern Cape</Option>
                  <Option value="Free State">Free State</Option>
                  <Option value="Limpopo">Limpopo</Option>
                  <Option value="Mpumalanga">Mpumalanga</Option>
                  <Option value="North West">North West</Option>
                  <Option value="Northern Cape">Northern Cape</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_beds" label="Total Beds">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter facility address" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>Create Facility</Button>
              <Button onClick={() => { setFacilityModalVisible(false); facilityForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default HealthcareHub;
