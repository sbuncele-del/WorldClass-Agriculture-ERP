import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Button, 
  Progress, 
  Alert,
  Space,
  Timeline
} from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  BellOutlined,
  SyncOutlined,
  SettingOutlined
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';
import '../../styles/erp-ui.css';

interface SARSStats {
  correspondence: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    overdue: number;
    due_this_week: number;
    total_active: number;
  };
  tax_submissions: {
    emp201_pending: number;
    emp501_due: number;
    vat201_pending: number;
    it14_pending: number;
  };
  client_compliance: {
    total_clients: number;
    fully_compliant: number;
    at_risk: number;
    non_compliant: number;
  };
  upcoming_deadlines: Array<{
    type: string;
    due_date: string;
    days_remaining: number;
    client_count: number;
  }>;
}

const SARSDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<SARSStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch real data from SARS dashboard API
      const response = await fetch('/api/v2/sars/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        
        // Map API response to stats format
        setStats({
          correspondence: {
            critical: data.correspondence?.critical || data.criticalItems || 0,
            high: data.correspondence?.high || data.highPriorityItems || 0,
            medium: data.correspondence?.medium || 0,
            low: data.correspondence?.low || 0,
            overdue: data.correspondence?.overdue || data.overdueItems || 0,
            due_this_week: data.correspondence?.due_this_week || data.dueThisWeek || 0,
            total_active: data.correspondence?.total_active || data.activeCorrespondence || 0
          },
          tax_submissions: {
            emp201_pending: data.tax_submissions?.emp201_pending || data.emp201Pending || 0,
            emp501_due: data.tax_submissions?.emp501_due || data.emp501Due || 0,
            vat201_pending: data.tax_submissions?.vat201_pending || data.vat201Pending || 0,
            it14_pending: data.tax_submissions?.it14_pending || data.it14Pending || 0
          },
          client_compliance: {
            total_clients: data.client_compliance?.total_clients || data.totalClients || 1,
            fully_compliant: data.client_compliance?.fully_compliant || data.compliantClients || 1,
            at_risk: data.client_compliance?.at_risk || data.atRiskClients || 0,
            non_compliant: data.client_compliance?.non_compliant || data.nonCompliantClients || 0
          },
          upcoming_deadlines: data.upcoming_deadlines || data.upcomingDeadlines || []
        });
      } else {
        // API failed - set empty/default stats (no mock data)
        setStats({
          correspondence: { critical: 0, high: 0, medium: 0, low: 0, overdue: 0, due_this_week: 0, total_active: 0 },
          tax_submissions: { emp201_pending: 0, emp501_due: 0, vat201_pending: 0, it14_pending: 0 },
          client_compliance: { total_clients: 0, fully_compliant: 0, at_risk: 0, non_compliant: 0 },
          upcoming_deadlines: []
        });
      }
    } catch (error) {
      console.error('Error fetching SARS dashboard data:', error);
      // On error - show empty state, not mock data
      setStats({
        correspondence: { critical: 0, high: 0, medium: 0, low: 0, overdue: 0, due_this_week: 0, total_active: 0 },
        tax_submissions: { emp201_pending: 0, emp501_due: 0, vat201_pending: 0, it14_pending: 0 },
        client_compliance: { total_clients: 0, fully_compliant: 0, at_risk: 0, non_compliant: 0 },
        upcoming_deadlines: []
      });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard');

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return '#ef4444';
    if (daysRemaining <= 3) return '#f59e0b';
    if (daysRemaining <= 7) return '#eab308';
    return '#10b981';
  };

  const getCompliancePercentage = () => {
    if (!stats) return 0;
    const { total_clients, fully_compliant } = stats.client_compliance;
    return total_clients > 0 ? Math.round((fully_compliant / total_clients) * 100) : 0;
  };

  // Dashboard Tab Content
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Critical Items"
              value={stats?.correspondence.critical || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              {stats?.correspondence.overdue || 0} overdue
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Due This Week"
              value={stats?.correspondence.due_this_week || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              Across {stats?.client_compliance.total_clients || 0} clients
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Correspondence"
              value={stats?.correspondence.total_active || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              {stats?.correspondence.high || 0} high priority
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Compliance Rate"
              value={getCompliancePercentage()}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
            <Progress percent={getCompliancePercentage()} showInfo={false} strokeColor="#10b981" />
          </Card>
        </Col>
      </Row>

      {/* Tax Submissions Overview */}
      <Card title="📊 Pending Tax Submissions" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>EMP201 Monthly</span>}
                value={stats?.tax_submissions.emp201_pending || 0} 
                valueStyle={{ color: 'white' }}
                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>pending</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>VAT201 Returns</span>}
                value={stats?.tax_submissions.vat201_pending || 0} 
                valueStyle={{ color: 'white' }}
                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>pending</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>EMP501 Annual</span>}
                value={stats?.tax_submissions.emp501_due || 0} 
                valueStyle={{ color: 'white' }}
                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>due soon</span>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
              <Statistic 
                title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>IT14 Returns</span>}
                value={stats?.tax_submissions.it14_pending || 0} 
                valueStyle={{ color: 'white' }}
                suffix={<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>pending</span>}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Upcoming Deadlines */}
        <Col xs={24} lg={16}>
          <Card title="📅 Critical Upcoming Deadlines">
            <Table 
              dataSource={stats?.upcoming_deadlines || []}
              columns={[
                { 
                  title: 'Submission Type', 
                  dataIndex: 'type', 
                  key: 'type',
                  render: (text: string) => <strong>{text}</strong>
                },
                { 
                  title: 'Due Date', 
                  dataIndex: 'due_date', 
                  key: 'due_date',
                  render: (date: string) => new Date(date).toLocaleDateString('en-ZA')
                },
                { 
                  title: 'Days Remaining', 
                  dataIndex: 'days_remaining', 
                  key: 'days_remaining',
                  render: (days: number) => (
                    <span style={{ color: getUrgencyColor(days), fontWeight: 600 }}>
                      {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days`}
                    </span>
                  )
                },
                { 
                  title: 'Affected Clients', 
                  dataIndex: 'client_count', 
                  key: 'client_count',
                  render: (count: number) => `${count} clients`
                },
                { 
                  title: 'Status', 
                  key: 'status',
                  render: (_: unknown, record: { days_remaining: number }) => {
                    const color = getUrgencyColor(record.days_remaining);
                    const status = record.days_remaining < 0 ? 'OVERDUE' 
                      : record.days_remaining <= 3 ? 'CRITICAL'
                      : record.days_remaining <= 7 ? 'URGENT' : 'ON TRACK';
                    return <Tag color={record.days_remaining < 0 ? 'error' : record.days_remaining <= 7 ? 'warning' : 'success'}>{status}</Tag>;
                  }
                }
              ]}
              rowKey="type"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Quick Actions & Alerts */}
        <Col xs={24} lg={8}>
          <Card title="⚡ Quick Actions" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Link to="/sars/correspondence">
                <Button icon={<FileTextOutlined />} block>Manage Correspondence</Button>
              </Link>
              <Link to="/sars/submissions">
                <Button type="primary" icon={<UploadOutlined />} block>Submit Tax Returns</Button>
              </Link>
              <Link to="/sars/clients">
                <Button icon={<TeamOutlined />} block>Client Compliance</Button>
              </Link>
              <Link to="/sars/deadlines">
                <Button icon={<CalendarOutlined />} block>Deadline Calendar</Button>
              </Link>
            </Space>
          </Card>

          <Card title="🔔 Alerts">
            <Timeline
              items={[
                {
                  color: 'red',
                  children: (
                    <>
                      <div><strong>EMP201</strong> overdue</div>
                      <div style={{ fontSize: 12, color: '#999' }}>42 clients affected</div>
                    </>
                  )
                },
                {
                  color: 'red',
                  children: (
                    <>
                      <div><strong>PAYE Monthly</strong> overdue</div>
                      <div style={{ fontSize: 12, color: '#999' }}>42 clients affected</div>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <div><strong>VAT201</strong> due soon</div>
                      <div style={{ fontSize: 12, color: '#999' }}>17 days remaining</div>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Client Compliance Overview */}
      <Card title="🛡️ Client Compliance Overview" style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic title="Fully Compliant" value={stats?.client_compliance.fully_compliant || 0} valueStyle={{ color: '#10b981' }} />
          </Col>
          <Col span={6}>
            <Statistic title="At Risk" value={stats?.client_compliance.at_risk || 0} valueStyle={{ color: '#f59e0b' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Non-Compliant" value={stats?.client_compliance.non_compliant || 0} valueStyle={{ color: '#ef4444' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Total Clients" value={stats?.client_compliance.total_clients || 0} valueStyle={{ color: '#667eea' }} />
          </Col>
        </Row>
        <Alert
          message="Compliance Monitoring Active"
          description="Client tax compliance is automatically monitored. Notifications sent for upcoming deadlines and overdue submissions."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );

  // Correspondence Tab Content
  const renderCorrespondence = () => (
    <div style={{ padding: '24px' }}>
      <Card title="SARS Correspondence">
        <Alert
          message="Correspondence Management"
          description="View, respond to, and track all SARS correspondence in one place."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Link to="/sars/correspondence">
          <Button type="primary">Go to Correspondence</Button>
        </Link>
      </Card>
    </div>
  );

  // Submissions Tab Content
  const renderSubmissions = () => (
    <div style={{ padding: '24px' }}>
      <Card title="Tax Submissions">
        <Alert
          message="Tax Return Submissions"
          description="File EMP201, VAT201, IT14, and other tax returns electronically."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Space>
          <Button type="primary" icon={<UploadOutlined />}>Submit EMP201</Button>
          <Button icon={<UploadOutlined />}>Submit VAT201</Button>
          <Button icon={<UploadOutlined />}>Submit IT14</Button>
        </Space>
      </Card>
    </div>
  );

  // Settings Tab Content
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Card title="SARS Sentinel Settings">
        <Alert
          message="Configuration"
          description="Configure SARS eFiling integration, notification preferences, and deadline alerts."
          type="info"
          showIcon
        />
      </Card>
    </div>
  );

  if (loading) {
    return (
      <HubLayout>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading SARS Sentinel dashboard...</p>
        </div>
      </HubLayout>
    );
  }

  return (
    <HubLayout>
      <HubHeader
        title="SARS Sentinel"
        subtitle="Compliance Command Center - Never miss a SARS deadline again"
        icon={<SafetyCertificateOutlined />}
        gradient="green"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<BellOutlined />}>Alerts</Button>
            <Link to="/sars/correspondence">
              <Button type="primary" icon={<FileTextOutlined />}>
                New Correspondence
              </Button>
            </Link>
          </>
        }
      />

      <StatusBanner
        gradient="green"
        icon={<SafetyCertificateOutlined />}
        title="Compliance Overview"
        subtitle="🇿🇦 South African Revenue Service"
        stats={[
          { title: 'Critical', value: stats?.correspondence.critical || 0, span: 4 },
          { title: 'Due This Week', value: stats?.correspondence.due_this_week || 0, span: 4 },
          { title: 'Compliance Rate', value: `${getCompliancePercentage()}%`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Total Clients', value: stats?.client_compliance.total_clients || 0, span: 4 },
          { title: 'Active Items', value: stats?.correspondence.total_active || 0, span: 4 },
        ]}
      />

      <HubTabs 
        theme="green"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <SafetyCertificateOutlined />, children: renderDashboard() },
          { key: 'correspondence', label: 'Correspondence', icon: <FileTextOutlined />, children: renderCorrespondence() },
          { key: 'submissions', label: 'Tax Submissions', icon: <UploadOutlined />, children: renderSubmissions() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </HubLayout>
  );
};

export default SARSDashboardEnhanced;
