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
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Divider,
  List,
  Alert,
  Badge,
  Avatar,
  Spin,
  Empty,
} from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SyncOutlined,
  SettingOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  LineChartOutlined,
  StarOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
  StatCard,
  QuickActionsCard,
  StatusIndicator,
  ProgressCard,
} from '../../components/hub';
import { salesService } from '../../services/sales.service';
import { workspaceApi } from '../../services/api.service';
import type { SalesStats, SalesOrder, Customer } from '../../services/sales.service';

const { Title, Text, Paragraph } = Typography;

// Types for API data
interface SalesStatsState {
  totalSales: number;
  pipelineValue: number;
  quotesOpen: number;
  ordersThisMonth: number;
  avgDealSize: number;
  winRate: number;
  targetProgress: number;
  targetAmount: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  color: string;
}

interface TopCustomer {
  id?: string;
  name: string;
  revenue: number;
  orders: number;
  segment: string;
  avatar: string;
  email?: string;
  phone?: string;
}

interface Quote {
  id: string;
  customer: string;
  amount: number;
  validUntil: string;
  status: string;
  daysLeft: number;
}

interface Order {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
  items: number;
}

interface SalesTeamMember {
  name: string;
  target: number;
  achieved: number;
  deals: number;
  winRate: number;
}

// Default/fallback data when API returns empty
const defaultPipelineStages: PipelineStage[] = [
  { stage: 'Lead', count: 0, value: 0, color: '#667eea' },
  { stage: 'Qualified', count: 0, value: 0, color: '#06b6d4' },
  { stage: 'Proposal', count: 0, value: 0, color: '#f59e0b' },
  { stage: 'Negotiation', count: 0, value: 0, color: '#ec4899' },
  { stage: 'Won', count: 0, value: 0, color: '#10b981' },
];

const SalesHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [quoteForm] = Form.useForm();
  const [orderForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  
  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStatsState>({
    totalSales: 0,
    pipelineValue: 0,
    quotesOpen: 0,
    ordersThisMonth: 0,
    avgDealSize: 0,
    winRate: 0,
    targetProgress: 0,
    targetAmount: 0,
  });
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultPipelineStages);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesTeamMember[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Primary workspace data (multi-tenant aware)
        const workspace = await salesService.getStats();

        setSalesStats({
          totalSales: parseFloat(workspace.total_revenue) || 0,
          pipelineValue: parseFloat(workspace.pipeline_value) || 0,
          quotesOpen: parseInt(workspace.pending_quotes) || 0,
          ordersThisMonth: parseInt(workspace.total_orders) || 0,
          avgDealSize: parseFloat(workspace.average_order_value) || 0,
          winRate: 0,
          targetProgress: 0,
          targetAmount: 0,
        });

        // Use workspace pipeline and recent orders as fallbacks so the UI renders even if other calls fail
        const stageColors: Record<string, string> = {
          qualification: '#667eea',
          proposal: '#f59e0b',
          negotiation: '#ec4899',
          lead: '#667eea',
          qualified: '#06b6d4',
          won: '#10b981',
        };

        if (Array.isArray((workspace as any)?.pipeline)) {
          setPipelineStages(
            (workspace as any).pipeline.map((stage: any) => ({
              stage: stage.stage || stage.name || 'Stage',
              count: Number(stage.opportunity_count || stage.count || 0),
              value: Number(stage.total_value || 0),
              color: stageColors[(stage.stage || '').toLowerCase()] || '#667eea',
            }))
          );
        }

        if (Array.isArray((workspace as any)?.recent_orders)) {
          setRecentOrders(
            (workspace as any).recent_orders.map((order: any) => ({
              id: order.order_number || order.id,
              customer: order.customer_name,
              amount: order.total_amount || order.total || 0,
              date: order.order_date,
              status: (order.status || order.order_status || 'pending').toLowerCase(),
              items: 1,
            }))
          );
        }

        if (Array.isArray((workspace as any)?.top_customers)) {
          setTopCustomers(
            (workspace as any).top_customers.map((customer: any) => ({
              name: customer.name || customer.customer_name,
              revenue: customer.total_revenue || customer.total_spent || 0,
              orders: customer.order_count || customer.total_orders || 0,
              segment: customer.customer_type || 'General',
              avatar: (customer.name || customer.customer_name || 'C').charAt(0),
            }))
          );
        }

        // Fetch granular lists; if they fail, keep workspace fallbacks instead of failing the page
        const [ordersResult, customersResult] = await Promise.allSettled([
          salesService.getOrders({ limit: 10 }),
          salesService.getCustomers({ limit: 5 }),
        ]);

        if (ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value.data)) {
          setRecentOrders(
            ordersResult.value.data.map((order: SalesOrder) => ({
              id: order.order_number || order.order_id,
              customer: order.customer_name,
              amount: order.total_amount,
              date: order.order_date,
              status: order.order_status?.toLowerCase() || 'pending',
              items: 1,
            }))
          );
        } else if (ordersResult.status === 'rejected') {
          console.warn('Orders endpoint failed, using workspace data if available', ordersResult.reason);
          message.warning('Orders not available yet. Showing workspace data.');
        }

        if (customersResult.status === 'fulfilled' && Array.isArray(customersResult.value.data)) {
          setTopCustomers(
            customersResult.value.data.map((customer: Customer) => ({
              name: customer.customer_name,
              revenue: customer.total_spent || 0,
              orders: customer.total_orders || 0,
              segment: customer.customer_type || 'General',
              avatar: customer.customer_name?.charAt(0) || 'C',
            }))
          );
        } else if (customersResult.status === 'rejected') {
          console.warn('Customers endpoint failed, using workspace data if available', customersResult.reason);
        }

        // Hydrate latest entities
        loadQuotes();
        loadOrders();
        loadCustomers();

      } catch (err: unknown) {
        console.error('Failed to fetch sales data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sales data';
        setError(errorMessage);
        message.error('Failed to load sales data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // Refresh data function
  const handleRefresh = () => {
    setLoading(true);
    salesService.getStats()
      .then(stats => {
        setSalesStats(prev => ({
          ...prev,
          totalSales: parseFloat(stats.total_revenue) || 0,
          ordersThisMonth: parseInt(stats.total_orders) || 0,
          avgDealSize: parseFloat(stats.average_order_value) || 0,
        }));
        message.success('Data refreshed');
      })
      .catch(() => message.error('Failed to refresh'))
      .finally(() => setLoading(false));
  };

  // Export sales data to CSV
  const handleExport = () => {
    try {
      // Determine what to export based on active tab
      let csvContent = '';
      let filename = '';
      const now = new Date().toISOString().split('T')[0];

      if (activeTab === 'dashboard' || activeTab === 'orders') {
        // Export Orders
        csvContent = 'Order ID,Customer,Amount,Date,Status,Items\n';
        recentOrders.forEach(order => {
          csvContent += `"${order.id}","${order.customer}",${order.amount},"${order.date}","${order.status}",${order.items}\n`;
        });
        filename = `sales-orders-${now}.csv`;
      } else if (activeTab === 'customers') {
        // Export Customers
        csvContent = 'Name,Revenue,Orders,Segment,Email,Phone\n';
        topCustomers.forEach(customer => {
          csvContent += `"${customer.name}",${customer.revenue},${customer.orders},"${customer.segment}","${customer.email || ''}","${customer.phone || ''}"\n`;
        });
        filename = `customers-${now}.csv`;
      } else if (activeTab === 'quotes') {
        // Export Quotes
        csvContent = 'Quote ID,Customer,Amount,Valid Until,Status\n';
        recentQuotes.forEach(quote => {
          csvContent += `"${quote.id}","${quote.customer}",${quote.amount},"${quote.validUntil}","${quote.status}"\n`;
        });
        filename = `quotes-${now}.csv`;
      } else if (activeTab === 'pipeline') {
        // Export Pipeline
        csvContent = 'Stage,Count,Value\n';
        pipelineStages.forEach(stage => {
          csvContent += `"${stage.stage}",${stage.count},${stage.value}\n`;
        });
        filename = `sales-pipeline-${now}.csv`;
      } else {
        // Default: Export summary
        csvContent = 'Metric,Value\n';
        csvContent += `Total Sales,${salesStats.totalSales}\n`;
        csvContent += `Pipeline Value,${salesStats.pipelineValue}\n`;
        csvContent += `Open Quotes,${salesStats.quotesOpen}\n`;
        csvContent += `Orders This Month,${salesStats.ordersThisMonth}\n`;
        csvContent += `Average Deal Size,${salesStats.avgDealSize}\n`;
        csvContent += `Win Rate,${salesStats.winRate}%\n`;
        filename = `sales-summary-${now}.csv`;
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`Exported ${filename} successfully!`);
    } catch (err) {
      console.error('Export failed:', err);
      message.error('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA')}`;

  const getStatusTag = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      'sent': { color: 'blue', text: 'Sent', icon: <MailOutlined /> },
      'viewed': { color: 'purple', text: 'Viewed' },
      'accepted': { color: 'green', text: 'Accepted', icon: <CheckCircleOutlined /> },
      'expired': { color: 'red', text: 'Expired' },
      'processing': { color: 'blue', text: 'Processing', icon: <SyncOutlined spin /> },
      'shipped': { color: 'cyan', text: 'Shipped' },
      'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> },
      'invoiced': { color: 'purple', text: 'Invoiced' },
    };
    const config = configs[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const loadQuotes = async () => {
    try {
      const response: any = await workspaceApi.sales.getQuotations({ limit: 10 });
      const list = response?.data || response?.quotations || response?.quotes || [];
      const mapped = Array.isArray(list)
        ? list.map((item: any) => ({
            id: item.quotation_number || item.quote_number || item.id || item.reference || 'QUOTE',
            customer: item.customer_name || item.customer || item.client_name || 'Customer',
            amount: Number(item.total_amount ?? item.amount ?? 0),
            validUntil: item.valid_until || item.expiry_date || item.valid_till || '—',
            status: (item.status || 'draft').toLowerCase(),
            daysLeft: item.valid_until ? 0 : 0,
          }))
        : [];
      setRecentQuotes(mapped);
    } catch (err) {
      console.warn('Failed to load quotes', err);
      message.warning('Unable to load quotes');
    }
  };

  const loadOrders = async () => {
    try {
      const response: any = await workspaceApi.sales.getOrders({ limit: 10 });
      const list = response?.data || response?.orders || [];
      const mapped = Array.isArray(list)
        ? list.map((order: any) => ({
            id: order.order_number || order.order_id || order.id || 'ORDER',
            customer: order.customer_name || order.customer || 'Customer',
            amount: Number(order.total_amount ?? order.total ?? 0),
            date: order.order_date || order.created_at || '',
            status: (order.order_status || order.status || 'pending').toLowerCase(),
            items: order.items_count || (Array.isArray(order.items) ? order.items.length : 1),
          }))
        : [];
      setRecentOrders(mapped);
    } catch (err) {
      console.warn('Failed to load orders', err);
      message.warning('Unable to load orders');
    }
  };

  const loadCustomers = async () => {
    try {
      const response: any = await workspaceApi.sales.getCustomers({ limit: 20 });
      const list = response?.data || response?.customers || [];
      const mapped = Array.isArray(list)
        ? list.map((customer: any) => ({
            id: customer.customer_id || customer.id,
            name: customer.customer_name || customer.name,
            revenue: Number(customer.total_spent ?? 0),
            orders: customer.total_orders ?? customer.order_count ?? 0,
            segment: customer.customer_type || 'General',
            avatar: (customer.customer_name || customer.name || 'C').charAt(0),
            email: customer.email,
            phone: customer.phone,
          }))
        : [];
      if (mapped.length > 0) {
        setTopCustomers(mapped);
      }
    } catch (err) {
      console.warn('Failed to load customers', err);
      message.warning('Unable to load customers');
    }
  };

  const handleCreateQuote = async () => {
    try {
      const values = await quoteForm.validateFields();
      setCreatingQuote(true);
      await workspaceApi.sales.createQuotation({
        customer_id: values.customer_id,
        valid_until: values.valid_until
          ? (values.valid_until.toDate ? values.valid_until.toDate().toISOString() : values.valid_until.toISOString?.())
          : undefined,
        total_amount: values.amount,
        notes: values.notes,
        status: 'sent',
      });
      message.success('Quote created');
      setShowQuoteModal(false);
      quoteForm.resetFields();
      loadQuotes();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error(err?.message || 'Failed to create quote');
    } finally {
      setCreatingQuote(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const values = await orderForm.validateFields();
      setCreatingOrder(true);
      await workspaceApi.sales.createOrder({
        customer_id: values.customer_id,
        order_date: values.order_date
          ? (values.order_date.toDate ? values.order_date.toDate().toISOString() : values.order_date.toISOString?.())
          : undefined,
        total_amount: values.total_amount,
        order_status: values.order_status || 'pending',
      });
      message.success('Order created');
      setShowOrderModal(false);
      orderForm.resetFields();
      loadOrders();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      const values = await customerForm.validateFields();
      setCreatingCustomer(true);
      await workspaceApi.sales.createCustomer({
        customer_name: values.customer_name,
        email: values.email,
        phone: values.phone,
        customer_type: values.customer_type,
      });
      message.success('Customer added');
      setShowCustomerModal(false);
      customerForm.resetFields();
      loadCustomers();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || 'Failed to add customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const quoteColumns = [
    {
      title: 'Quote #',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong style={{ color: '#667eea' }}>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Valid Until',
      dataIndex: 'validUntil',
      key: 'validUntil',
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
      render: (_: unknown, record: typeof recentQuotes[0]) => (
        <Space>
          <Button type="link" size="small">View</Button>
          {record.status !== 'accepted' && record.status !== 'expired' && (
            <Button type="link" size="small">Convert to Order</Button>
          )}
        </Space>
      ),
    },
  ];

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong style={{ color: '#10b981' }}>{text}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  const tabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChartOutlined />,
      children: (
        <Row gutter={24}>
          {/* Main Content */}
          <Col span={16}>
            {/* Sales Target Progress */}
            <Card style={{ marginBottom: 24 }}>
              <Row gutter={24} align="middle">
                <Col span={16}>
                  <Text type="secondary">Monthly Sales Target</Text>
                  <Title level={3} style={{ margin: '8px 0' }}>
                    {formatCurrency(salesStats.totalSales)} / {formatCurrency(salesStats.targetAmount)}
                  </Title>
                  <Progress 
                    percent={salesStats.targetProgress} 
                    strokeColor={{ from: '#667eea', to: '#764ba2' }}
                    strokeWidth={12}
                  />
                </Col>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Statistic
                    title="Days Remaining"
                    value={20}
                    valueStyle={{ color: '#667eea', fontSize: 32 }}
                    suffix="days"
                  />
                </Col>
              </Row>
            </Card>

            {/* Pipeline Stages */}
            <Card title="Sales Pipeline" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {pipelineStages.map(stage => (
                  <div key={stage.stage} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '100%',
                      height: 8,
                      background: stage.color,
                      borderRadius: 4,
                      marginBottom: 12,
                    }} />
                    <Text strong>{stage.stage}</Text>
                    <div>
                      <Badge count={stage.count} style={{ backgroundColor: stage.color }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatCurrency(stage.value)}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Quotes */}
            <Card 
              title="Recent Quotes"
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} onClick={() => setShowQuoteModal(true)}>New Quote</Button>
                  <Button type="link">View All</Button>
                </Space>
              }
            >
              <Table
                dataSource={recentQuotes}
                columns={quoteColumns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>

          {/* Right Sidebar */}
          <Col span={8}>
            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Win Rate"
                    value={salesStats.winRate}
                    suffix="%"
                    prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
                    valueStyle={{ color: '#10b981' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Avg Deal Size"
                    value={salesStats.avgDealSize}
                    prefix="R"
                    valueStyle={{ color: '#667eea' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Top Customers */}
            <Card title="Top Customers" style={{ marginBottom: 24 }}>
              <List
                dataSource={topCustomers.slice(0, 4)}
                renderItem={(customer, idx) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: ['#667eea', '#10b981', '#f59e0b', '#ec4899'][idx] }}>
                          {customer.avatar}
                        </Avatar>
                      }
                      title={customer.name}
                      description={customer.segment}
                    />
                    <Text strong>{formatCurrency(customer.revenue)}</Text>
                  </List.Item>
                )}
              />
            </Card>

            {/* Quick Actions */}
            <QuickActionsCard
              title="Quick Actions"
              actions={[
                { icon: <FileTextOutlined />, label: 'New Quote', onClick: () => setShowQuoteModal(true) },
                { icon: <ShoppingCartOutlined />, label: 'New Order', onClick: () => setShowOrderModal(true) },
                { icon: <UserOutlined />, label: 'Add Customer', onClick: () => setShowCustomerModal(true) },
                { icon: <LineChartOutlined />, label: 'Sales Report' },
              ]}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: 'quotes',
      label: 'Quotes',
      icon: <FileTextOutlined />,
      children: (
        <Card 
          title="All Quotations"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowQuoteModal(true)}>New Quote</Button>}
        >
          <Table
            dataSource={recentQuotes}
            columns={quoteColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: <ShoppingCartOutlined />,
      children: (
        <Card 
          title="Sales Orders"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setShowOrderModal(true)}>New Order</Button>}
        >
          <Table
            dataSource={recentOrders}
            columns={orderColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'customers',
      label: 'Customers',
      icon: <TeamOutlined />,
      children: (
        <Card title="Customer Management">
          <List
            dataSource={topCustomers}
            renderItem={customer => (
              <List.Item
                actions={[
                  <Button type="link" key="view">View Profile</Button>,
                  <Button type="link" key="quote">Create Quote</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar size={48} style={{ backgroundColor: '#667eea' }}>{customer.avatar}</Avatar>}
                  title={<Text strong>{customer.name}</Text>}
                  description={
                    <Space>
                      <Tag>{customer.segment}</Tag>
                      <Text type="secondary">{customer.orders} orders</Text>
                    </Space>
                  }
                />
                <Statistic value={customer.revenue} prefix="R" valueStyle={{ fontSize: 16 }} />
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'team',
      label: 'Sales Team',
      icon: <TrophyOutlined />,
      children: (
        <Card title="Team Performance">
          <Table
            dataSource={salesTeam}
            columns={[
              { 
                title: 'Name', 
                dataIndex: 'name', 
                key: 'name',
                render: (text: string) => (
                  <Space>
                    <Avatar style={{ backgroundColor: '#667eea' }}>{text.charAt(0)}</Avatar>
                    <Text strong>{text}</Text>
                  </Space>
                ),
              },
              { 
                title: 'Target', 
                dataIndex: 'target', 
                key: 'target',
                render: (v: number) => formatCurrency(v),
              },
              { 
                title: 'Achieved', 
                dataIndex: 'achieved', 
                key: 'achieved',
                render: (v: number) => <Text strong style={{ color: '#10b981' }}>{formatCurrency(v)}</Text>,
              },
              { 
                title: 'Progress', 
                key: 'progress',
                render: (_: unknown, record: typeof salesTeam[0]) => (
                  <Progress 
                    percent={Math.round((record.achieved / record.target) * 100)} 
                    strokeColor="#667eea"
                    size="small"
                  />
                ),
              },
              { 
                title: 'Deals', 
                dataIndex: 'deals', 
                key: 'deals',
              },
              { 
                title: 'Win Rate', 
                dataIndex: 'winRate', 
                key: 'winRate',
                render: (v: number) => <Tag color={v >= 70 ? 'green' : v >= 60 ? 'orange' : 'red'}>{v}%</Tag>,
              },
            ]}
            rowKey="name"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Sales Configuration">
              <Form layout="vertical">
                <Form.Item label="Default Payment Terms">
                  <Select defaultValue="30">
                    <Select.Option value="7">7 Days</Select.Option>
                    <Select.Option value="14">14 Days</Select.Option>
                    <Select.Option value="30">30 Days</Select.Option>
                    <Select.Option value="60">60 Days</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Quote Validity (Days)">
                  <InputNumber defaultValue={30} style={{ width: '100%' }} />
                </Form.Item>
                <Button type="primary">Save Settings</Button>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Commission Structure">
              <Paragraph>Configure sales commission rates and tiers.</Paragraph>
              <Button type="primary" icon={<SettingOutlined />}>Configure Commissions</Button>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <HubLayout>
        <HubHeader
          title="Sales & CRM"
          subtitle="Quotes, Orders & Customer Relationship Management"
          icon={<ShoppingCartOutlined />}
          gradient="cyan"
        />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading sales data..." />
        </div>
      </HubLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <HubLayout>
        <HubHeader
          title="Sales & CRM"
          subtitle="Quotes, Orders & Customer Relationship Management"
          icon={<ShoppingCartOutlined />}
          gradient="cyan"
        />
        <Alert
          message="Failed to Load Data"
          description={error}
          type="error"
          showIcon
          style={{ margin: 24 }}
          action={
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </HubLayout>
    );
  }

  return (
    <HubLayout>
      <HubHeader
        title="Sales & CRM"
        subtitle="Quotes, Orders & Customer Relationship Management"
        icon={<ShoppingCartOutlined />}
        gradient="cyan"
        actions={
          <>
            <Button icon={<SyncOutlined />} onClick={handleRefresh} loading={loading}>Refresh</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowQuoteModal(true)}>
              New Quote
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="cyan"
        icon={<LineChartOutlined />}
        title="Sales Performance"
        subtitle="December 2025"
        stats={[
          { title: 'Total Sales', value: salesStats.totalSales, prefix: 'R', span: 4 },
          { title: 'Pipeline Value', value: salesStats.pipelineValue, prefix: 'R', span: 4 },
          { title: 'Open Quotes', value: salesStats.quotesOpen, span: 3 },
          { title: 'Orders This Month', value: salesStats.ordersThisMonth, span: 4 },
          { title: 'Win Rate', value: `${salesStats.winRate}%`, valueStyle: { color: '#86efac' }, span: 3 },
        ]}
      />

      <HubTabs 
        theme="cyan"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* New Quote Modal */}
      <Modal
        title="Create New Quote"
        open={showQuoteModal}
        onCancel={() => setShowQuoteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowQuoteModal(false)}>Cancel</Button>,
          <Button key="draft" onClick={handleCreateQuote} loading={creatingQuote}>Save as Draft</Button>,
          <Button key="send" type="primary" onClick={handleCreateQuote} loading={creatingQuote}>
            Send Quote
          </Button>
        ]}
        width={700}
      >
        <Form layout="vertical" form={quoteForm} initialValues={{ amount: 0 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Customer"
                name="customer_id"
                rules={[{ required: true, message: 'Select a customer' }]}
              >
                <Select placeholder="Select customer" showSearch optionFilterProp="children">
                  {topCustomers.map(c => (
                    <Select.Option key={c.id || c.name} value={c.id || c.name}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Valid Until"
                name="valid_until"
                rules={[{ required: true, message: 'Select validity date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Total Amount"
                name="amount"
                rules={[{ required: true, message: 'Enter amount' }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="R" min={0} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Notes" name="notes">
                <Input.TextArea rows={3} placeholder="Terms or notes" />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Line Items</Divider>
          <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%' }}>
            Add Product
          </Button>
        </Form>
      </Modal>

      {/* New Order Modal */}
      <Modal
        title="Create New Order"
        open={showOrderModal}
        onCancel={() => setShowOrderModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowOrderModal(false)}>Cancel</Button>,
          <Button key="create" type="primary" onClick={handleCreateOrder} loading={creatingOrder}>
            Create Order
          </Button>
        ]}
        width={700}
      >
        <Form layout="vertical" form={orderForm} initialValues={{ total_amount: 0, order_status: 'pending' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Customer"
                name="customer_id"
                rules={[{ required: true, message: 'Select a customer' }]}
              >
                <Select placeholder="Select customer" showSearch optionFilterProp="children">
                  {topCustomers.map(c => (
                    <Select.Option key={c.id || c.name} value={c.id || c.name}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Order Date"
                name="order_date"
                rules={[{ required: true, message: 'Select order date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Total Amount"
                name="total_amount"
                rules={[{ required: true, message: 'Enter total amount' }]}
              >
                <InputNumber style={{ width: '100%' }} prefix="R" min={0} step={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Status" name="order_status">
                <Select>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="processing">Processing</Select.Option>
                  <Select.Option value="shipped">Shipped</Select.Option>
                  <Select.Option value="delivered">Delivered</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        title="Add Customer"
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCustomerModal(false)}>Cancel</Button>,
          <Button key="create" type="primary" onClick={handleCreateCustomer} loading={creatingCustomer}>
            Save Customer
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical" form={customerForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Customer Name"
                name="customer_name"
                rules={[{ required: true, message: 'Enter customer name' }]}
              >
                <Input placeholder="ABC Trading" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Type" name="customer_type" initialValue="Business">
                <Select>
                  <Select.Option value="Business">Business</Select.Option>
                  <Select.Option value="Individual">Individual</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Enter valid email' }]}> 
                <Input placeholder="customer@email.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="(+27)" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default SalesHub;
