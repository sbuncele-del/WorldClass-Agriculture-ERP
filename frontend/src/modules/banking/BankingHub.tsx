import React, { useState, useEffect, lazy, Suspense } from 'react';
import { workspaceApi } from '../../services/api.service';
import apiClient from '../../services/api';
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
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  List,
  Avatar,
  Spin,
  Alert,
} from 'antd';
import {
  BankOutlined,
  CreditCardOutlined,
  SwapOutlined,
  SyncOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  LinkOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  UploadOutlined,
  WalletOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import './BankingHub.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Default empty arrays for API data
const defaultBankConnections: any[] = [];

const defaultTransactions: any[] = [];
const defaultCashFlowForecast: any[] = [];

// Lazy load the enhanced AI-powered reconciliation component
const BankReconciliation = lazy(() => import('../../components/BankReconciliationHub'));

const BankingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Fetch live API data for banking/cash management
  const [apiData, setApiData] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [bankConnections, setBankConnections] = useState<any[]>(defaultBankConnections);
  const [recentTransactions, setRecentTransactions] = useState<any[]>(defaultTransactions);
  const [cashFlowForecast, setCashFlowForecast] = useState<any[]>(defaultCashFlowForecast);
  
  useEffect(() => {
    const fetchBankingData = async () => {
      try {
        // Fetch from V2 treasury endpoints
        const [workspaceResult, dashboardRes, positionsRes, forecastRes] = await Promise.all([
          workspaceApi.cashManagement.getWorkspace().catch(() => null),
          apiClient.get('/api/v2/treasury/dashboard').catch(() => ({ data: { data: {} } })),
          apiClient.get('/api/v2/treasury/cash-positions').catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v2/treasury/forecasts').catch(() => ({ data: { data: [] } })),
        ]);
        
        // Handle workspace data
        if (workspaceResult) {
          if ((workspaceResult as any)?.data) {
            setApiData((workspaceResult as any).data);
          } else {
            setApiData(workspaceResult);
          }
        }
        
        // Handle treasury dashboard - extract bank accounts as connections
        const dashboardData = dashboardRes.data?.data || dashboardRes.data || {};
        const positionsData = Array.isArray(positionsRes.data?.data) ? positionsRes.data.data : 
                             Array.isArray(positionsRes.data) ? positionsRes.data : [];
        const forecastData = Array.isArray(forecastRes.data?.data) ? forecastRes.data.data : 
                            Array.isArray(forecastRes.data) ? forecastRes.data : [];
        
        // Map cash positions to bank connection format for display
        if (positionsData.length > 0) {
          const bankConnectionsFromAPI = positionsData.map((pos: any) => ({
            id: pos.id || pos.account_id,
            bank: pos.bank_name || 'Bank Account',
            accountName: pos.account_name || 'Account',
            accountNumber: pos.account_number ? `****${pos.account_number.slice(-4)}` : '****0000',
            balance: pos.balance || pos.current_balance || 0,
            available: pos.available_balance || pos.balance || 0,
            currency: pos.currency || 'ZAR',
            status: 'connected',
            type: pos.account_type || 'Current',
            logo: '🏦',
            feedType: 'Manual',
            lastSync: pos.last_updated || new Date().toISOString(),
          }));
          setBankConnections(bankConnectionsFromAPI);
        }
        
        // Map forecasts for cash flow
        if (forecastData.length > 0) {
          setCashFlowForecast(forecastData);
        }
        
        // Extract recent transactions if available in dashboard
        if (dashboardData.recentTransactions) {
          setRecentTransactions(dashboardData.recentTransactions);
        }
      } catch (err) {
        console.log('Using local mock data for banking');
      } finally {
        setApiLoading(false);
      }
    };
    fetchBankingData();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    message.success('All bank feeds synchronized');
    setSyncing(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      connected: { color: '#10b981', text: 'Connected', icon: <CheckCircleOutlined /> },
      pending: { color: '#f59e0b', text: 'Pending', icon: <ClockCircleOutlined /> },
      disconnected: { color: '#ef4444', text: 'Disconnected', icon: <CloseCircleOutlined /> },
      cleared: { color: '#10b981', text: 'Cleared', icon: <CheckCircleOutlined /> },
    };
    const config = configs[status] || { color: '#64748b', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { ZAR: 'R', USD: '$', GBP: '£', EUR: '€' };
    const symbol = symbols[currency] || currency;
    const formatted = Math.abs(amount).toLocaleString('en-ZA');
    return `${amount < 0 ? '-' : ''}${symbol} ${formatted}`;
  };

  const getTotalBalance = () => {
    // Convert all to ZAR for simplicity (mock rates)
    const rates: Record<string, number> = { ZAR: 1, USD: 18.5, GBP: 23.5, EUR: 20 };
    return bankConnections
      .filter(b => b.status === 'connected')
      .reduce((sum, b) => sum + b.balance * (rates[b.currency] || 1), 0);
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account',
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: any) => (
        <Text strong style={{ color: record.amount >= 0 ? '#10b981' : '#ef4444' }}>
          {formatCurrency(record.amount, record.currency)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Reconciled',
      dataIndex: 'reconciled',
      key: 'reconciled',
      render: (reconciled: boolean) => (
        reconciled 
          ? <Tag color="green" icon={<CheckCircleOutlined />}>Yes</Tag>
          : <Tag color="default">No</Tag>
      ),
    },
  ];

  return (
    <div className="banking-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="hub-title-section">
          <div className="banking-logo">
            <WalletOutlined className="logo-icon" />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>Banking & Treasury</Title>
            <Text type="secondary">Connected accounts, cash management, and reconciliation</Text>
          </div>
        </div>
        <div className="hub-actions">
          <Button 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleSyncAll}
            loading={syncing}
          >
            Sync All Feeds
          </Button>
          <Button 
            icon={<PlusOutlined />}
            onClick={() => setShowConnectModal(true)}
          >
            Connect Account
          </Button>
          <Button type="primary" icon={<SwapOutlined />}>
            New Transfer
          </Button>
        </div>
      </div>

      {/* Treasury Summary Banner */}
      <Card className="treasury-status-card">
        <Row gutter={24} align="middle">
          <Col span={5}>
            <div className="treasury-badge">
              <BankOutlined className="treasury-icon" />
              <div>
                <Text strong style={{ fontSize: '16px', display: 'block', color: 'white' }}>Treasury Overview</Text>
                <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Real-time balances</Text>
              </div>
            </div>
          </Col>
          <Col span={5}>
            <Statistic 
              title="Total Cash Position" 
              value={getTotalBalance()}
              prefix="R"
              valueStyle={{ color: 'white', fontSize: '20px' }}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Accounts" 
              value={bankConnections.filter(b => b.status === 'connected').length}
              suffix={`/ ${bankConnections.length}`}
              valueStyle={{ color: 'white' }}
              prefix={<BankOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Unreconciled" 
              value={2}
              valueStyle={{ color: '#fbbf24' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="Feed Status" 
              value="Healthy"
              valueStyle={{ color: '#86efac', fontSize: '16px' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="Last Sync" 
              value="10 min"
              valueStyle={{ color: 'white', fontSize: '16px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="hub-tabs">
        <TabPane 
          tab={<span><BankOutlined /> Accounts</span>} 
          key="overview"
        >
          <Row gutter={[24, 24]}>
            {/* Bank Accounts Grid */}
            <Col span={24}>
              <div className="accounts-grid">
                {bankConnections.map(account => (
                  <Card 
                    key={account.id} 
                    className={`account-card ${account.status}`}
                    hoverable
                  >
                    <div className="account-header">
                      <div className="account-bank">
                        <span className="bank-logo">{account.logo}</span>
                        <div>
                          <Text strong>{account.bank}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>{account.feedType}</Text>
                        </div>
                      </div>
                      {getStatusBadge(account.status)}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div className="account-details">
                      <Text type="secondary">{account.accountName}</Text>
                      <Text style={{ fontSize: '12px' }}>{account.accountNumber}</Text>
                    </div>
                    <div className="account-balance">
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>BALANCE</Text>
                        <div className="balance-amount" style={{ color: account.balance >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatCurrency(account.balance, account.currency)}
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>AVAILABLE</Text>
                        <div className="available-amount">
                          {formatCurrency(account.available, account.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="account-footer">
                      <Tag>{account.type}</Tag>
                      <Tag color="blue">{account.currency}</Tag>
                      {account.lastSync && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Synced: {new Date(account.lastSync).toLocaleTimeString()}
                        </Text>
                      )}
                    </div>
                    <div className="account-actions">
                      <Button type="link" size="small" icon={<EyeOutlined />}>View</Button>
                      <Button type="link" size="small" icon={<SyncOutlined />}>Sync</Button>
                      <Button type="link" size="small" icon={<SettingOutlined />}>Settings</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Col>

            {/* Recent Transactions */}
            <Col span={24}>
              <Card 
                title="Recent Transactions" 
                extra={
                  <Space>
                    <Button icon={<DownloadOutlined />}>Export</Button>
                    <Button type="link">View All</Button>
                  </Space>
                }
              >
                <Table 
                  dataSource={recentTransactions}
                  columns={transactionColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SwapOutlined /> Reconciliation</span>} 
          key="reconciliation"
        >
          <Suspense fallback={<div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" tip="Loading Reconciliation..." /></div>}>
            <BankReconciliation />
          </Suspense>
        </TabPane>

        <TabPane 
          tab={<span><DollarOutlined /> Cash Flow</span>} 
          key="cashflow"
        >
          <Row gutter={[16, 16]}>
            {/* Cash Position Overview */}
            <Col span={24}>
              <Card className="cash-flow-header">
                <Row gutter={24} align="middle">
                  <Col span={6}>
                    <Statistic
                      title="Current Cash Position"
                      value={9717500}
                      prefix="R"
                      valueStyle={{ color: '#10b981', fontSize: 28 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="30-Day Projected"
                      value={10597500}
                      prefix="R"
                      valueStyle={{ color: '#3b82f6', fontSize: 24 }}
                      suffix={<Tag color="green">+9%</Tag>}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Expected Inflows"
                      value={4500000}
                      prefix="R"
                      valueStyle={{ color: '#10b981', fontSize: 20 }}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>12 pending invoices</Text>
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Expected Outflows"
                      value={3620000}
                      prefix="R"
                      valueStyle={{ color: '#ef4444', fontSize: 20 }}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>8 payments scheduled</Text>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* Cash Flow Chart Placeholder */}
            <Col span={16}>
              <Card title="Cash Flow Projection" extra={
                <Space>
                  <Select defaultValue="30" style={{ width: 120 }}>
                    <Select.Option value="7">7 Days</Select.Option>
                    <Select.Option value="14">14 Days</Select.Option>
                    <Select.Option value="30">30 Days</Select.Option>
                    <Select.Option value="90">90 Days</Select.Option>
                  </Select>
                  <Button icon={<DownloadOutlined />}>Export</Button>
                </Space>
              }>
                {/* Visual Chart Area */}
                <div style={{ 
                  background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  borderRadius: 8,
                  padding: 24,
                  minHeight: 250,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* Chart representation */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, gap: 8 }}>
                    {[
                      { day: 'Mon', inflow: 320000, outflow: 180000 },
                      { day: 'Tue', inflow: 450000, outflow: 280000 },
                      { day: 'Wed', inflow: 180000, outflow: 420000 },
                      { day: 'Thu', inflow: 520000, outflow: 150000 },
                      { day: 'Fri', inflow: 380000, outflow: 290000 },
                      { day: 'Sat', inflow: 50000, outflow: 20000 },
                      { day: 'Sun', inflow: 0, outflow: 0 },
                    ].map((d, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                          <div style={{ width: 16, height: Math.max(d.inflow / 5000, 4), background: '#10b981', borderRadius: 2 }} />
                          <div style={{ width: 16, height: Math.max(d.outflow / 5000, 4), background: '#ef4444', borderRadius: 2 }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{d.day}</Text>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
                    <Space><div style={{ width: 12, height: 12, background: '#10b981', borderRadius: 2 }} /><Text type="secondary">Inflows</Text></Space>
                    <Space><div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 2 }} /><Text type="secondary">Outflows</Text></Space>
                  </div>
                </div>

                {/* Detailed Forecast Table */}
                <Table
                  style={{ marginTop: 16 }}
                  dataSource={[
                    { period: 'Week 1 (Dec 11-17)', inflow: 1200000, outflow: 850000, net: 350000, closing: 10067500 },
                    { period: 'Week 2 (Dec 18-24)', inflow: 980000, outflow: 1100000, net: -120000, closing: 9947500 },
                    { period: 'Week 3 (Dec 25-31)', inflow: 1450000, outflow: 920000, net: 530000, closing: 10477500 },
                    { period: 'Week 4 (Jan 1-7)', inflow: 870000, outflow: 750000, net: 120000, closing: 10597500 },
                  ]}
                  columns={[
                    { title: 'Period', dataIndex: 'period', key: 'period' },
                    { title: 'Inflow', dataIndex: 'inflow', key: 'inflow', render: (v: number) => <Text style={{ color: '#10b981' }}>R {v.toLocaleString()}</Text> },
                    { title: 'Outflow', dataIndex: 'outflow', key: 'outflow', render: (v: number) => <Text style={{ color: '#ef4444' }}>R {v.toLocaleString()}</Text> },
                    { title: 'Net', dataIndex: 'net', key: 'net', render: (v: number) => <Text strong style={{ color: v >= 0 ? '#10b981' : '#ef4444' }}>R {v.toLocaleString()}</Text> },
                    { title: 'Projected Closing', dataIndex: 'closing', key: 'closing', render: (v: number) => <Text strong>R {v.toLocaleString()}</Text> },
                  ]}
                  pagination={false}
                  rowKey="period"
                  size="small"
                />
              </Card>
            </Col>

            {/* Upcoming Cash Events */}
            <Col span={8}>
              <Card title="Upcoming Cash Events" className="cash-events-card">
                <List
                  dataSource={[
                    { type: 'inflow', desc: 'Customer payment - XYZ Corp', amount: 450000, date: 'Dec 12', confidence: 95 },
                    { type: 'outflow', desc: 'Supplier - ABC Trading', amount: 125000, date: 'Dec 13', confidence: 100 },
                    { type: 'outflow', desc: 'Payroll - December', amount: 890000, date: 'Dec 15', confidence: 100 },
                    { type: 'inflow', desc: 'Customer payment - LMN Ltd', amount: 78000, date: 'Dec 16', confidence: 80 },
                    { type: 'outflow', desc: 'VAT Payment', amount: 245000, date: 'Dec 25', confidence: 100 },
                    { type: 'inflow', desc: 'Invoice #INV-0089', amount: 320000, date: 'Dec 28', confidence: 70 },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: item.type === 'inflow' ? '#10b981' : '#ef4444' }}>
                            {item.type === 'inflow' ? '+' : '-'}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text>{item.desc}</Text>
                            {item.confidence < 90 && <Tag color="orange">{item.confidence}% likely</Tag>}
                          </Space>
                        }
                        description={
                          <Space>
                            <Text type="secondary">{item.date}</Text>
                            <Text strong style={{ color: item.type === 'inflow' ? '#10b981' : '#ef4444' }}>
                              R {item.amount.toLocaleString()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>

              {/* Cash Alerts */}
              <Card title="Cash Alerts" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message="Low Balance Forecast"
                    description="Week 2 shows negative net cash flow. Consider deferring non-critical payments."
                    type="warning"
                    showIcon
                  />
                  <Alert
                    message="Large Payment Due"
                    description="Payroll R890,000 scheduled for Dec 15. Ensure sufficient funds."
                    type="info"
                    showIcon
                  />
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><CreditCardOutlined /> Payments</span>} 
          key="payments"
        >
          <Row gutter={[16, 16]}>
            {/* Payment Stats */}
            <Col span={6}>
              <Card>
                <Statistic title="Pending Payments" value={8} valueStyle={{ color: '#f59e0b' }} prefix={<ClockCircleOutlined />} />
                <Text type="secondary">R 1,245,000 total</Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Scheduled Today" value={3} valueStyle={{ color: '#3b82f6' }} prefix={<CreditCardOutlined />} />
                <Text type="secondary">R 325,000 total</Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Awaiting Approval" value={5} valueStyle={{ color: '#ef4444' }} prefix={<SafetyCertificateOutlined />} />
                <Text type="secondary">2 urgent</Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Completed This Month" value={47} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} />
                <Text type="secondary">R 4.2M paid</Text>
              </Card>
            </Col>

            {/* Quick Actions */}
            <Col span={24}>
              <Card>
                <Space>
                  <Button type="primary" icon={<PlusOutlined />}>New Payment</Button>
                  <Button icon={<UploadOutlined />}>Create Batch Payment</Button>
                  <Button icon={<FileTextOutlined />}>Generate EFT File</Button>
                  <Button icon={<DownloadOutlined />}>Download Payment Template</Button>
                </Space>
              </Card>
            </Col>

            {/* Payment Batches */}
            <Col span={24}>
              <Card title="Payment Batches" extra={<Button type="link">View All</Button>}>
                <Table
                  dataSource={[
                    { id: 'BATCH-001', name: 'Supplier Payments - Week 50', count: 12, amount: 485000, status: 'pending-approval', createdBy: 'Sarah Chen', date: '2025-12-11' },
                    { id: 'BATCH-002', name: 'December Creditors', count: 8, amount: 325000, status: 'approved', createdBy: 'John Davis', date: '2025-12-10' },
                    { id: 'BATCH-003', name: 'Refunds - Customer Returns', count: 3, amount: 45000, status: 'processing', createdBy: 'Sarah Chen', date: '2025-12-10' },
                    { id: 'BATCH-004', name: 'Utility Payments', count: 5, amount: 78500, status: 'completed', createdBy: 'System', date: '2025-12-09' },
                  ]}
                  columns={[
                    { title: 'Batch ID', dataIndex: 'id', key: 'id', render: (id: string) => <Text code>{id}</Text> },
                    { title: 'Description', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
                    { title: 'Payments', dataIndex: 'count', key: 'count', render: (c: number) => <Badge count={c} style={{ backgroundColor: '#3b82f6' }} /> },
                    { title: 'Total Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => <Text strong>R {a.toLocaleString()}</Text> },
                    { 
                      title: 'Status', 
                      dataIndex: 'status', 
                      key: 'status',
                      render: (s: string) => {
                        const statusMap: Record<string, { color: string; text: string }> = {
                          'pending-approval': { color: 'orange', text: 'Pending Approval' },
                          'approved': { color: 'blue', text: 'Approved' },
                          'processing': { color: 'purple', text: 'Processing' },
                          'completed': { color: 'green', text: 'Completed' },
                        };
                        return <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>;
                      }
                    },
                    { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy' },
                    { title: 'Date', dataIndex: 'date', key: 'date' },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Space>
                          <Button size="small" icon={<EyeOutlined />}>View</Button>
                          {record.status === 'pending-approval' && (
                            <Button size="small" type="primary">Approve</Button>
                          )}
                          {record.status === 'approved' && (
                            <Button size="small" icon={<DownloadOutlined />}>EFT File</Button>
                          )}
                        </Space>
                      )
                    }
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </Col>

            {/* Pending Individual Payments */}
            <Col span={24}>
              <Card title="Pending Payments" extra={
                <Space>
                  <Button icon={<CheckCircleOutlined />}>Approve Selected</Button>
                  <Button type="primary" icon={<PlusOutlined />}>Add to Batch</Button>
                </Space>
              }>
                <Table
                  rowSelection={{ type: 'checkbox' }}
                  dataSource={[
                    { id: 'PAY-001', vendor: 'ABC Suppliers (Pty) Ltd', reference: 'INV-2025-089', amount: 45000, dueDate: '2025-12-13', status: 'pending', priority: 'normal' },
                    { id: 'PAY-002', vendor: 'XYZ Logistics', reference: 'INV-8876', amount: 125000, dueDate: '2025-12-12', status: 'pending', priority: 'urgent' },
                    { id: 'PAY-003', vendor: 'Office Supplies Co', reference: 'INV-334455', amount: 8500, dueDate: '2025-12-15', status: 'pending', priority: 'normal' },
                    { id: 'PAY-004', vendor: 'Tech Solutions Ltd', reference: 'INV-2025-445', amount: 67000, dueDate: '2025-12-14', status: 'scheduled', priority: 'normal' },
                    { id: 'PAY-005', vendor: 'SARS', reference: 'VAT-DEC-2025', amount: 245000, dueDate: '2025-12-25', status: 'pending', priority: 'urgent' },
                  ]}
                  columns={[
                    { title: 'Payment ID', dataIndex: 'id', key: 'id', render: (id: string) => <Text code>{id}</Text> },
                    { title: 'Vendor/Payee', dataIndex: 'vendor', key: 'vendor', render: (v: string) => <Text strong>{v}</Text> },
                    { title: 'Reference', dataIndex: 'reference', key: 'reference' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (a: number) => <Text strong style={{ color: '#ef4444' }}>R {a.toLocaleString()}</Text> },
                    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => {
                      const isOverdue = new Date(d) < new Date();
                      const isSoon = new Date(d) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                      return <Tag color={isOverdue ? 'red' : isSoon ? 'orange' : 'default'}>{d}</Tag>;
                    }},
                    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => p === 'urgent' ? <Tag color="red">Urgent</Tag> : <Tag>Normal</Tag> },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'scheduled' ? 'blue' : 'orange'}>{s}</Tag> },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: () => (
                        <Space>
                          <Button size="small" type="primary">Pay Now</Button>
                          <Button size="small">Schedule</Button>
                        </Space>
                      )
                    }
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SettingOutlined /> Settings</span>} 
          key="settings"
        >
          <Card title="Bank Feed Settings">
            <Form layout="vertical" style={{ maxWidth: 500 }}>
              <Form.Item label="Auto-Sync Frequency">
                <Select defaultValue="15">
                  <Select.Option value="5">Every 5 minutes</Select.Option>
                  <Select.Option value="15">Every 15 minutes</Select.Option>
                  <Select.Option value="30">Every 30 minutes</Select.Option>
                  <Select.Option value="60">Every hour</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Default Reconciliation Method">
                <Select defaultValue="auto">
                  <Select.Option value="auto">Auto-match</Select.Option>
                  <Select.Option value="manual">Manual</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Low Balance Alert Threshold">
                <Input prefix="R" defaultValue="100000" />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </TabPane>
      </Tabs>

      {/* Connect Bank Modal */}
      <Modal
        title="Connect Bank Account"
        open={showConnectModal}
        onCancel={() => setShowConnectModal(false)}
        footer={null}
        width={500}
      >
        <div className="bank-connect-options">
          <Card className="connect-option" hoverable onClick={() => message.info('Open Banking coming soon')}>
            <ThunderboltOutlined style={{ fontSize: '32px', color: '#10b981' }} />
            <Title level={5}>Open Banking</Title>
            <Text type="secondary">Instant secure connection via API</Text>
            <Tag color="green">Recommended</Tag>
          </Card>
          <Card className="connect-option" hoverable onClick={() => message.info('Statement import available')}>
            <UploadOutlined style={{ fontSize: '32px', color: '#3b82f6' }} />
            <Title level={5}>Statement Import</Title>
            <Text type="secondary">Upload bank statements (CSV, OFX)</Text>
          </Card>
          <Card className="connect-option" hoverable onClick={() => message.info('Manual entry available')}>
            <FileTextOutlined style={{ fontSize: '32px', color: '#64748b' }} />
            <Title level={5}>Manual Entry</Title>
            <Text type="secondary">Manually add transactions</Text>
          </Card>
        </div>
        <Divider>Supported Banks (Open Banking)</Divider>
        <div className="supported-banks">
          <Tag>🏦 FNB</Tag>
          <Tag>🏛️ Standard Bank</Tag>
          <Tag>🏧 Nedbank</Tag>
          <Tag>🔴 ABSA</Tag>
          <Tag>💚 Capitec</Tag>
          <Tag>🌍 Investec</Tag>
        </div>
      </Modal>
    </div>
  );
};

export default BankingHub;
