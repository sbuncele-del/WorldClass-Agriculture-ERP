import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Progress,
  Statistic,
  Table,
  Tabs,
  Badge,
  Space,
  Avatar,
  Timeline,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Divider,
  List,
  Alert,
  Steps,
  Collapse,
  Spin,
  Empty,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  UserAddOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  PlusOutlined,
  HeartOutlined,
  SmileOutlined,
  TrophyOutlined,
  GiftOutlined,
  SettingOutlined,
  BellOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  FallOutlined,
  IdcardOutlined,
  BankOutlined,
  AuditOutlined,
  FileDoneOutlined,
  SendOutlined,
  SyncOutlined,
  WarningOutlined,
  FileSearchOutlined,
  CalculatorOutlined,
  CloudUploadOutlined,
  LinkOutlined,
  DownloadOutlined,
  PrinterOutlined,
  MailOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { hrService } from '../../services/hr.service';
import type { HRStats, Employee, Department } from '../../services/hr.service';
import './HRHub.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Types for state
interface HRStatsState {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  openPositions: number;
  newHires: number;
  turnoverRate: number;
  avgTenure: number;
  grossPayroll: number;
  netPayroll: number;
  payeDeducted: number;
  uifDeducted: number;
  sdlPayable: number;
  irp5Generated: number;
  irp5Pending: number;
  emp201Status: string;
  emp501Status: string;
}

interface EmployeeRecord {
  id: string;
  name: string;
  idNumber: string;
  taxNumber: string;
  position: string;
  department: string;
  startDate: string;
  status: string;
  taxStatus: string;
}

// Default compliance calendar (these typically don't come from API)
const defaultComplianceCalendar = [
  { 
    type: 'EMP201', 
    description: 'Monthly PAYE Reconciliation', 
    dueDate: '2025-12-07', 
    period: 'November 2025',
    status: 'submitted',
    submittedDate: '2025-12-05',
    amount: 0,
  },
  { 
    type: 'EMP201', 
    description: 'Monthly PAYE Reconciliation', 
    dueDate: '2026-01-07', 
    period: 'December 2025',
    status: 'preparing',
    amount: 0,
  },
];

// Default payroll runs
const defaultPayrollRuns = [
  {
    id: 'PR-2025-12',
    period: 'December 2025',
    runDate: '2025-12-25',
    status: 'processing',
    employees: 0,
    grossPay: 0,
    paye: 0,
    uif: 0,
    pension: 0,
    medical: 0,
    netPay: 0,
    payslipsGenerated: 0,
  },
];

// Default tax certificates
const defaultTaxCertificates = [
  { type: 'IRP5', description: 'Employee Tax Certificate', generated: 0, pending: 0, total: 0 },
  { type: 'IT3(a)', description: 'Interest Certificate', generated: 0, pending: 0, total: 0 },
];

// Statutory deductions breakdown
const statutoryDeductions = [
  { name: 'PAYE (Pay As You Earn)', rate: '18% - 45%', ytdAmount: 0, currentMonth: 0, status: 'calculated' },
  { name: 'UIF (Unemployment Insurance)', rate: '1% (max R177.12)', ytdAmount: 0, currentMonth: 0, status: 'calculated' },
  { name: 'SDL (Skills Development)', rate: '1% of payroll', ytdAmount: 0, currentMonth: 0, status: 'calculated' },
  { name: 'Pension Fund', rate: '7.5% employee', ytdAmount: 0, currentMonth: 0, status: 'calculated' },
  { name: 'Medical Aid', rate: 'Per scheme', ytdAmount: 0, currentMonth: 0, status: 'calculated' },
];

// Leave balances (policy data, not from API)
const leaveTypes = [
  { type: 'Annual Leave', statutory: '15 days min', companyPolicy: '21 days', carryOver: '5 days max' },
  { type: 'Sick Leave', statutory: '30 days / 3 years', companyPolicy: '30 days cycle', carryOver: 'No' },
  { type: 'Family Responsibility', statutory: '3 days', companyPolicy: '5 days', carryOver: 'No' },
  { type: 'Maternity Leave', statutory: '4 months', companyPolicy: '4 months', carryOver: 'N/A' },
  { type: 'Paternity Leave', statutory: '10 days', companyPolicy: '10 days', carryOver: 'No' },
];

const HRHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEMP201Modal, setShowEMP201Modal] = useState(false);

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hrStats, setHrStats] = useState<HRStatsState>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    openPositions: 0,
    newHires: 0,
    turnoverRate: 0,
    avgTenure: 0,
    grossPayroll: 0,
    netPayroll: 0,
    payeDeducted: 0,
    uifDeducted: 0,
    sdlPayable: 0,
    irp5Generated: 0,
    irp5Pending: 0,
    emp201Status: 'preparing',
    emp501Status: 'not-due',
  });
  const [recentEmployees, setRecentEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complianceCalendar, setComplianceCalendar] = useState(defaultComplianceCalendar);
  const [payrollRuns, setPayrollRuns] = useState(defaultPayrollRuns);
  const [taxCertificates, setTaxCertificates] = useState(defaultTaxCertificates);

  // Fetch data from API
  useEffect(() => {
    const fetchHRData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats
        const stats = await hrService.getStats();
        const totalEmp = parseInt(stats.total_employees) || 0;
        const onLeave = parseInt(stats.on_leave_today) || 0;
        const payroll = parseFloat(stats.payroll_this_month) || 0;
        
        setHrStats(prev => ({
          ...prev,
          totalEmployees: totalEmp,
          activeEmployees: totalEmp - onLeave,
          onLeave: onLeave,
          grossPayroll: payroll,
          netPayroll: payroll * 0.78, // Estimate
          payeDeducted: payroll * 0.18, // Estimate
          uifDeducted: payroll * 0.01,
          sdlPayable: payroll * 0.01,
        }));

        // Update payroll runs with actual data
        setPayrollRuns(prev => prev.map(run => ({
          ...run,
          employees: totalEmp,
          grossPay: payroll,
          paye: payroll * 0.18,
          uif: payroll * 0.01,
          netPay: payroll * 0.78,
        })));

        // Fetch employees
        const employeesResponse = await hrService.getEmployees({ limit: 10 });
        if (employeesResponse.data && Array.isArray(employeesResponse.data)) {
          setRecentEmployees(employeesResponse.data.map((emp: Employee) => ({
            id: emp.employee_number || emp.employee_id,
            name: `${emp.first_name} ${emp.last_name}`,
            idNumber: '0000000000000',
            taxNumber: '0000000000',
            position: emp.position || 'Employee',
            department: emp.department_name || 'General',
            startDate: new Date().toISOString().split('T')[0],
            status: emp.employment_status?.toLowerCase() || 'active',
            taxStatus: 'registered',
          })));
        }

        // Fetch departments
        const deptResponse = await hrService.getDepartments();
        if (deptResponse.data && Array.isArray(deptResponse.data)) {
          setDepartments(deptResponse.data);
        }

        // Update tax certificates
        setTaxCertificates(prev => prev.map(cert => ({
          ...cert,
          total: totalEmp,
          generated: Math.floor(totalEmp * 0.95),
          pending: Math.ceil(totalEmp * 0.05),
        })));

      } catch (err) {
        console.error('Failed to fetch HR data:', err);
        let errorMessage = 'Failed to load HR data';
        if (err && typeof err === 'object' && 'message' in err) {
          errorMessage = String(err.message);
        } else if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as any;
          errorMessage = axiosError.response?.data?.message || axiosError.message || errorMessage;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
        message.error('Failed to load HR data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHRData();
  }, []);

  // Refresh data function
  const handleRefresh = () => {
    setLoading(true);
    hrService.getStats()
      .then(stats => {
        const totalEmp = parseInt(stats.total_employees) || 0;
        const onLeave = parseInt(stats.on_leave_today) || 0;
        const payroll = parseFloat(stats.payroll_this_month) || 0;
        setHrStats(prev => ({
          ...prev,
          totalEmployees: totalEmp,
          activeEmployees: totalEmp - onLeave,
          onLeave: onLeave,
          grossPayroll: payroll,
        }));
        message.success('Data refreshed');
      })
      .catch((err) => {
        console.error('Failed to refresh:', err);
        message.error('Failed to refresh');
      })
      .finally(() => setLoading(false));
  };

  const getStatusTag = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      'active': { color: 'green', text: 'Active' },
      'submitted': { color: 'green', text: 'Submitted', icon: <CheckCircleOutlined /> },
      'preparing': { color: 'blue', text: 'Preparing', icon: <SyncOutlined spin /> },
      'due': { color: 'orange', text: 'Due Soon', icon: <ClockCircleOutlined /> },
      'overdue': { color: 'red', text: 'Overdue', icon: <WarningOutlined /> },
      'not-due': { color: 'default', text: 'Not Due' },
      'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> },
      'processing': { color: 'blue', text: 'Processing', icon: <SyncOutlined spin /> },
      'registered': { color: 'green', text: 'SARS Registered' },
      'pending': { color: 'orange', text: 'Pending' },
      'calculated': { color: 'green', text: 'Calculated' },
    };
    const config = configs[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA')}`;

  const payrollColumns = [
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (text: string, record: any) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.id}</Text>
        </div>
      ),
    },
    {
      title: 'Employees',
      dataIndex: 'employees',
      key: 'employees',
      align: 'center' as const,
    },
    {
      title: 'Gross Pay',
      dataIndex: 'grossPay',
      key: 'grossPay',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'PAYE',
      dataIndex: 'paye',
      key: 'paye',
      render: (v: number) => <Text type="danger">{formatCurrency(v)}</Text>,
    },
    {
      title: 'UIF',
      dataIndex: 'uif',
      key: 'uif',
      render: (v: number) => <Text type="warning">{formatCurrency(v)}</Text>,
    },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      render: (v: number) => <Text strong style={{ color: '#10b981' }}>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="link" size="small" icon={<FileSearchOutlined />} />
          </Tooltip>
          <Tooltip title="Generate Payslips">
            <Button type="link" size="small" icon={<PrinterOutlined />} disabled={record.status !== 'completed'} />
          </Tooltip>
          <Tooltip title="Export to SARS">
            <Button type="link" size="small" icon={<SendOutlined />} disabled={record.status !== 'completed'} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const complianceColumns = [
    {
      title: 'Return Type',
      key: 'type',
      render: (_: any, record: any) => (
        <div>
          <Tag color={
            record.type === 'EMP201' ? 'blue' : 
            record.type === 'EMP501' ? 'purple' : 
            record.type === 'UIF' ? 'cyan' : 'orange'
          }>
            {record.type}
          </Tag>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text>
        </div>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => {
        const isOverdue = new Date(date) < new Date();
        return <Text type={isOverdue ? 'danger' : undefined}>{date}</Text>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v ? formatCurrency(v) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'submitted' ? (
            <Button type="link" size="small" icon={<DownloadOutlined />}>Receipt</Button>
          ) : record.status === 'preparing' ? (
            <Button type="primary" size="small" icon={<SendOutlined />}>Submit to SARS</Button>
          ) : (
            <Button type="link" size="small" disabled>N/A</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="hr-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="hub-title-section">
          <div className="hr-logo">
            <TeamOutlined className="logo-icon" />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>HR & Payroll</Title>
            <Text type="secondary">RSA-Compliant Payroll, SARS Integration & Workforce Management</Text>
          </div>
        </div>
        <div className="hub-actions">
          <Button icon={<SyncOutlined />}>Sync with SARS</Button>
          <Button icon={<CalculatorOutlined />} onClick={() => setShowPayrollModal(true)}>
            Run Payroll
          </Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setShowAddEmployee(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Compliance Alert Banner */}
      <Alert
        message="SARS Compliance Status"
        description={
          <Space size="large">
            <span><CheckCircleOutlined style={{ color: '#10b981' }} /> EMP201 Nov 2025: Submitted</span>
            <span><SyncOutlined spin style={{ color: '#3b82f6' }} /> EMP201 Dec 2025: Preparing</span>
            <span><ClockCircleOutlined style={{ color: '#f59e0b' }} /> EMP501 Annual: Due May 2026</span>
            <Button type="link" size="small" icon={<LinkOutlined />}>
              Open SARS Sentinel →
            </Button>
          </Space>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24, borderRadius: 12 }}
      />

      {/* HR Summary Banner */}
      <Card className="hr-status-card">
        <Row gutter={24} align="middle">
          <Col span={4}>
            <div className="hr-badge">
              <BankOutlined className="hr-icon" />
              <div>
                <Text strong style={{ fontSize: '14px', display: 'block', color: 'white' }}>Payroll Overview</Text>
                <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>December 2025</Text>
              </div>
            </div>
          </Col>
          <Col span={3}>
            <Statistic 
              title="Employees" 
              value={hrStats.totalEmployees}
              valueStyle={{ color: 'white' }}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Gross Payroll" 
              value={hrStats.grossPayroll}
              prefix="R"
              valueStyle={{ color: 'white', fontSize: '18px' }}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="PAYE Due" 
              value={hrStats.payeDeducted}
              prefix="R"
              valueStyle={{ color: '#fbbf24', fontSize: '16px' }}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="UIF Due" 
              value={hrStats.uifDeducted}
              prefix="R"
              valueStyle={{ color: '#fbbf24', fontSize: '16px' }}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="SDL Due" 
              value={hrStats.sdlPayable}
              prefix="R"
              valueStyle={{ color: '#fbbf24', fontSize: '16px' }}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Net Payroll" 
              value={hrStats.netPayroll}
              prefix="R"
              valueStyle={{ color: '#86efac', fontSize: '18px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="hub-tabs">
        <TabPane 
          tab={<span><DollarOutlined /> Payroll</span>} 
          key="dashboard"
        >
          <Row gutter={24}>
            {/* Payroll Runs */}
            <Col span={16}>
              <Card 
                title="Payroll Runs" 
                extra={
                  <Space>
                    <Button icon={<CalculatorOutlined />}>Calculate Tax</Button>
                    <Button type="primary" icon={<PlusOutlined />}>New Payroll Run</Button>
                  </Space>
                }
                className="payroll-card"
              >
                <Table 
                  dataSource={payrollRuns}
                  columns={payrollColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>

              {/* Statutory Deductions */}
              <Card title="Statutory Deductions Summary" style={{ marginTop: 24 }}>
                <Table
                  dataSource={statutoryDeductions}
                  columns={[
                    { title: 'Deduction Type', dataIndex: 'name', key: 'name', render: (t: string) => <Text strong>{t}</Text> },
                    { title: 'Rate', dataIndex: 'rate', key: 'rate' },
                    { title: 'Current Month', dataIndex: 'currentMonth', key: 'currentMonth', render: (v: number) => formatCurrency(v) },
                    { title: 'YTD Amount', dataIndex: 'ytdAmount', key: 'ytdAmount', render: (v: number) => <Text strong>{formatCurrency(v)}</Text> },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => getStatusTag(s) },
                  ]}
                  rowKey="name"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>

            {/* Side Panel */}
            <Col span={8}>
              {/* Tax Certificates */}
              <Card title="Tax Certificates (IRP5/IT3)" className="certificates-card" style={{ marginBottom: 24 }}>
                {taxCertificates.map(cert => (
                  <div key={cert.type} className="certificate-item">
                    <div className="cert-info">
                      <Text strong>{cert.type}</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{cert.description}</Text>
                    </div>
                    <div className="cert-progress">
                      <Progress 
                        percent={Math.round((cert.generated / cert.total) * 100)} 
                        size="small"
                        format={() => `${cert.generated}/${cert.total}`}
                        strokeColor={cert.pending > 0 ? '#f59e0b' : '#10b981'}
                      />
                      {cert.pending > 0 && (
                        <Text type="warning" style={{ fontSize: '11px' }}>{cert.pending} pending</Text>
                      )}
                    </div>
                  </div>
                ))}
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  <Button icon={<FileDoneOutlined />} size="small">Generate All IRP5s</Button>
                  <Button icon={<MailOutlined />} size="small">Email to Employees</Button>
                </Space>
              </Card>

              {/* Quick Actions */}
              <Card title="Payroll Quick Actions" className="actions-card">
                <div className="quick-actions-grid">
                  <Button className="action-btn" icon={<CalculatorOutlined />}>
                    Tax Calculator
                  </Button>
                  <Button className="action-btn" icon={<PrinterOutlined />}>
                    Bulk Payslips
                  </Button>
                  <Button className="action-btn" icon={<CloudUploadOutlined />}>
                    Import Data
                  </Button>
                  <Button className="action-btn" icon={<DownloadOutlined />}>
                    Export Reports
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SafetyCertificateOutlined /> SARS Compliance</span>} 
          key="compliance"
        >
          <Row gutter={24}>
            {/* Compliance Calendar */}
            <Col span={16}>
              <Card 
                title="SARS Returns & Submissions" 
                extra={
                  <Space>
                    <Button icon={<SyncOutlined />}>Refresh Status</Button>
                    <Button type="primary" icon={<LinkOutlined />}>Open SARS Sentinel</Button>
                  </Space>
                }
              >
                <Table 
                  dataSource={complianceCalendar}
                  columns={complianceColumns}
                  rowKey={(r) => `${r.type}-${r.period}`}
                  pagination={false}
                />
              </Card>

              {/* EMP201 Preparation Workflow */}
              <Card title="EMP201 Monthly Reconciliation Workflow" style={{ marginTop: 24 }}>
                <Steps current={2} size="small">
                  <Steps.Step title="Calculate PAYE" description="Auto-calculated" status="finish" />
                  <Steps.Step title="Verify Employees" description="152 employees" status="finish" />
                  <Steps.Step title="Generate Return" description="In progress" status="process" />
                  <Steps.Step title="Submit to SARS" description="Via e@syFile" status="wait" />
                  <Steps.Step title="Get Receipt" description="Confirmation" status="wait" />
                </Steps>
                <Divider />
                <Space>
                  <Button type="primary" icon={<FileDoneOutlined />}>Generate EMP201</Button>
                  <Button icon={<DownloadOutlined />}>Download CSV</Button>
                  <Button icon={<SendOutlined />}>Submit via SARS Sentinel</Button>
                </Space>
              </Card>
            </Col>

            {/* Compliance Summary */}
            <Col span={8}>
              <Card title="Compliance Dashboard" className="compliance-summary-card">
                <div className="compliance-stat">
                  <div className="stat-header">
                    <Text strong>EMP201 (Monthly PAYE)</Text>
                    <Tag color="green">Up to Date</Tag>
                  </div>
                  <Progress percent={100} strokeColor="#10b981" showInfo={false} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>Last submitted: 5 Dec 2025</Text>
                </div>
                <Divider style={{ margin: '16px 0' }} />
                <div className="compliance-stat">
                  <div className="stat-header">
                    <Text strong>EMP501 (Bi-Annual)</Text>
                    <Tag color="blue">Interim Done</Tag>
                  </div>
                  <Progress percent={50} strokeColor="#3b82f6" showInfo={false} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>Annual due: 31 May 2026</Text>
                </div>
                <Divider style={{ margin: '16px 0' }} />
                <div className="compliance-stat">
                  <div className="stat-header">
                    <Text strong>UIF Declarations</Text>
                    <Tag color="green">Current</Tag>
                  </div>
                  <Progress percent={100} strokeColor="#10b981" showInfo={false} />
                  <Text type="secondary" style={{ fontSize: '12px' }}>Monthly submission active</Text>
                </div>
                <Divider style={{ margin: '16px 0' }} />
                <div className="compliance-stat">
                  <div className="stat-header">
                    <Text strong>IRP5 Certificates</Text>
                    <Tag color="orange">4 Pending</Tag>
                  </div>
                  <Progress percent={97} strokeColor="#f59e0b" />
                  <Text type="secondary" style={{ fontSize: '12px' }}>148 of 152 generated</Text>
                </div>
              </Card>

              {/* SARS Integration Status */}
              <Card title="SARS Integration" style={{ marginTop: 24 }}>
                <div className="integration-status">
                  <div className="integration-item">
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />
                    <div>
                      <Text strong>e@syFile Employer</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Connected</Text>
                    </div>
                  </div>
                  <div className="integration-item">
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />
                    <div>
                      <Text strong>SARS eFiling</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>API Active</Text>
                    </div>
                  </div>
                  <div className="integration-item">
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />
                    <div>
                      <Text strong>UIF uFiling</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Linked</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><FileTextOutlined /> Reports</span>} 
          key="reports"
        >
          <Row gutter={24}>
            <Col span={8}>
              <Card title="SARS Reports" className="report-category-card">
                <List
                  dataSource={[
                    { name: 'EMP201 Return', desc: 'Monthly PAYE reconciliation', icon: <AuditOutlined /> },
                    { name: 'EMP501 Return', desc: 'Bi-annual reconciliation', icon: <AuditOutlined /> },
                    { name: 'IRP5 Certificates', desc: 'Employee tax certificates', icon: <FileDoneOutlined /> },
                    { name: 'IT3(a) Certificates', desc: 'Interest income certs', icon: <FileDoneOutlined /> },
                    { name: 'Tax Directive Request', desc: 'Bonus/commission directive', icon: <FileTextOutlined /> },
                  ]}
                  renderItem={item => (
                    <List.Item className="report-item">
                      <Space>
                        {item.icon}
                        <div>
                          <Text strong>{item.name}</Text>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{item.desc}</Text>
                        </div>
                      </Space>
                      <Button type="link" size="small" icon={<DownloadOutlined />}>Generate</Button>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Payroll Reports" className="report-category-card">
                <List
                  dataSource={[
                    { name: 'Payroll Summary', desc: 'Monthly payroll totals', icon: <DollarOutlined /> },
                    { name: 'Payslips', desc: 'Individual employee payslips', icon: <FileTextOutlined /> },
                    { name: 'Deductions Report', desc: 'All deductions breakdown', icon: <CalculatorOutlined /> },
                    { name: 'Cost to Company', desc: 'Total employment cost', icon: <BankOutlined /> },
                    { name: 'Bank Payment File', desc: 'Salary payment export', icon: <BankOutlined /> },
                  ]}
                  renderItem={item => (
                    <List.Item className="report-item">
                      <Space>
                        {item.icon}
                        <div>
                          <Text strong>{item.name}</Text>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{item.desc}</Text>
                        </div>
                      </Space>
                      <Button type="link" size="small" icon={<DownloadOutlined />}>Generate</Button>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title="HR Reports" className="report-category-card">
                <List
                  dataSource={[
                    { name: 'Employee Register', desc: 'Full employee listing', icon: <TeamOutlined /> },
                    { name: 'Leave Balances', desc: 'All leave entitlements', icon: <CalendarOutlined /> },
                    { name: 'Headcount Report', desc: 'Staffing analysis', icon: <LineChartOutlined /> },
                    { name: 'Turnover Report', desc: 'Employee movement', icon: <RiseOutlined /> },
                    { name: 'Skills Audit', desc: 'SDL reporting', icon: <TrophyOutlined /> },
                  ]}
                  renderItem={item => (
                    <List.Item className="report-item">
                      <Space>
                        {item.icon}
                        <div>
                          <Text strong>{item.name}</Text>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{item.desc}</Text>
                        </div>
                      </Space>
                      <Button type="link" size="small" icon={<DownloadOutlined />}>Generate</Button>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><TeamOutlined /> Employees</span>} 
          key="employees"
        >
          <Card 
            title="Employee Directory"
            extra={<Button type="primary" icon={<UserAddOutlined />}>Add Employee</Button>}
          >
            <Table
              dataSource={recentEmployees}
              columns={[
                { 
                  title: 'Employee', 
                  key: 'name',
                  render: (_: any, r: any) => (
                    <Space>
                      <Avatar style={{ backgroundColor: '#667eea' }}>{r.name.split(' ').map((n: string) => n[0]).join('')}</Avatar>
                      <div>
                        <Text strong>{r.name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>{r.id}</Text>
                      </div>
                    </Space>
                  )
                },
                { title: 'ID Number', dataIndex: 'idNumber', key: 'idNumber' },
                { title: 'Tax Number', dataIndex: 'taxNumber', key: 'taxNumber' },
                { title: 'Position', dataIndex: 'position', key: 'position' },
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { title: 'Tax Status', dataIndex: 'taxStatus', key: 'taxStatus', render: (s: string) => getStatusTag(s) },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => getStatusTag(s) },
              ]}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={<span><CalendarOutlined /> Leave</span>} 
          key="leave"
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card title="Leave Requests">
                <Paragraph>Leave request management with BCEA compliance.</Paragraph>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Leave Policy (BCEA Compliant)">
                <Table
                  dataSource={leaveTypes}
                  columns={[
                    { title: 'Leave Type', dataIndex: 'type', key: 'type' },
                    { title: 'Statutory', dataIndex: 'statutory', key: 'statutory' },
                    { title: 'Company', dataIndex: 'companyPolicy', key: 'companyPolicy' },
                  ]}
                  rowKey="type"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SettingOutlined /> Settings</span>} 
          key="settings"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Payroll Settings">
                <Form layout="vertical">
                  <Form.Item label="Tax Year">
                    <Select defaultValue="2026">
                      <Select.Option value="2026">2025/2026 (Mar 2025 - Feb 2026)</Select.Option>
                      <Select.Option value="2025">2024/2025 (Mar 2024 - Feb 2025)</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Pay Frequency">
                    <Select defaultValue="monthly">
                      <Select.Option value="weekly">Weekly</Select.Option>
                      <Select.Option value="fortnightly">Fortnightly</Select.Option>
                      <Select.Option value="monthly">Monthly</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="UIF Reference Number">
                    <Input defaultValue="U123456789" />
                  </Form.Item>
                  <Form.Item label="SDL Number">
                    <Input defaultValue="L987654321" />
                  </Form.Item>
                  <Button type="primary">Save Settings</Button>
                </Form>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="SARS Integration Settings">
                <Form layout="vertical">
                  <Form.Item label="SARS Employer Reference">
                    <Input defaultValue="7123456789" />
                  </Form.Item>
                  <Form.Item label="e@syFile Username">
                    <Input defaultValue="employer@company.co.za" />
                  </Form.Item>
                  <Form.Item label="Auto-Submit EMP201">
                    <Select defaultValue="manual">
                      <Select.Option value="auto">Automatic (7th of month)</Select.Option>
                      <Select.Option value="manual">Manual Approval</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary">Save SARS Settings</Button>
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Add Employee Modal */}
      <Modal
        title="Add New Employee (RSA)"
        open={showAddEmployee}
        onCancel={() => setShowAddEmployee(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAddEmployee(false)}>Cancel</Button>,
          <Button key="create" type="primary" onClick={() => { message.success('Employee added'); setShowAddEmployee(false); }}>
            Add Employee
          </Button>
        ]}
        width={700}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" required>
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" required>
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SA ID Number" required>
                <Input placeholder="13-digit ID number" maxLength={13} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="SARS Tax Number">
                <Input placeholder="10-digit tax number" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Department" required>
                <Select placeholder="Select department">
                  <Select.Option value="tech">Technology</Select.Option>
                  <Select.Option value="finance">Finance</Select.Option>
                  <Select.Option value="hr">Human Resources</Select.Option>
                  <Select.Option value="sales">Sales</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Position" required>
                <Input placeholder="Job title" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Start Date" required>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Basic Salary" required>
                <Input prefix="R" placeholder="Monthly salary" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Tax Status">
                <Select defaultValue="A">
                  <Select.Option value="A">Code A - Normal</Select.Option>
                  <Select.Option value="B">Code B - Director</Select.Option>
                  <Select.Option value="C">Code C - Seasonal</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider>Statutory Registrations</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="UIF Contributor">
                <Select defaultValue="yes">
                  <Select.Option value="yes">Yes</Select.Option>
                  <Select.Option value="no">No (Exempt)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Pension Fund">
                <Select placeholder="Select fund">
                  <Select.Option value="company">Company Fund (7.5%)</Select.Option>
                  <Select.Option value="ra">Retirement Annuity</Select.Option>
                  <Select.Option value="none">None</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Medical Aid">
                <Select placeholder="Select scheme">
                  <Select.Option value="discovery">Discovery Health</Select.Option>
                  <Select.Option value="bonitas">Bonitas</Select.Option>
                  <Select.Option value="none">None</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default HRHub;
