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
  InputNumber,
  Switch,
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
  InboxOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SyncOutlined,
  SettingOutlined,
  QrcodeOutlined,
  SwapOutlined,
  SearchOutlined,
  FilterOutlined,
  BarcodeOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
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
  InfoListCard,
} from '../../components/hub';
import { inventoryService } from '../../services/inventory.service';
import type { InventoryStats, Product, StockMovement } from '../../services/inventory.service';

const { Title, Text, Paragraph } = Typography;

// Types for state
interface InventoryStatsState {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  reorderPending: number;
  turnoverRate: number;
  avgDaysStock: number;
  categories: number;
  warehouses: number;
}

interface StockByCategory {
  category: string;
  items: number;
  value: number;
  status: string;
  percentage: number;
}

interface LowStockItem {
  sku: string;
  name: string;
  current: number;
  min: number;
  unit: string;
  location: string;
  daysLeft: number;
}

interface StockMovementItem {
  id: string;
  date: string;
  type: string;
  item: string;
  qty: number;
  from: string;
  to: string;
}

interface Warehouse {
  code: string;
  name: string;
  location: string;
  capacity: number;
  items: number;
  value: number;
}

const InventoryHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [testScanValue, setTestScanValue] = useState('INV-001245-2025');
  const [barcodeForm] = Form.useForm();

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStatsState>({
    totalItems: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    reorderPending: 0,
    turnoverRate: 0,
    avgDaysStock: 0,
    categories: 0,
    warehouses: 0,
  });
  const [stockByCategory, setStockByCategory] = useState<StockByCategory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchInventoryData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats
        const stats = await inventoryService.getStats();
        setInventoryStats({
          totalItems: parseInt(stats.total_products) || 0,
          totalValue: parseFloat(stats.total_value) || 0,
          lowStock: parseInt(stats.low_stock_items) || 0,
          outOfStock: parseInt(stats.out_of_stock_items) || 0,
          reorderPending: 0,
          turnoverRate: 0,
          avgDaysStock: 0,
          categories: 0,
          warehouses: 0,
        });

        // Fetch products (including low stock)
        const productsResponse = await inventoryService.getProducts({ limit: 20 });
        if (productsResponse.data && Array.isArray(productsResponse.data)) {
          // Filter for low stock items
          const lowStock = productsResponse.data
            .filter((p: Product) => p.quantity_on_hand <= p.reorder_level)
            .map((p: Product) => ({
              sku: p.product_code,
              name: p.product_name,
              current: p.quantity_on_hand,
              min: p.reorder_level,
              unit: 'units',
              location: 'WH-A',
              daysLeft: Math.max(1, Math.floor(p.quantity_on_hand / 10)),
            }));
          setLowStockItems(lowStock);

          // Group by category for stock by category
          const categoryMap = new Map<string, { items: number; value: number }>();
          productsResponse.data.forEach((p: Product) => {
            const cat = p.category || 'Uncategorized';
            const existing = categoryMap.get(cat) || { items: 0, value: 0 };
            categoryMap.set(cat, {
              items: existing.items + 1,
              value: existing.value + (p.total_value || 0),
            });
          });
          
          const totalValue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.value, 0);
          const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            items: data.items,
            value: data.value,
            status: 'healthy',
            percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
          }));
          setStockByCategory(categories);
        }

        // Fetch stock movements
        const movementsResponse = await inventoryService.getStockMovements({ limit: 10 });
        if (movementsResponse.data && Array.isArray(movementsResponse.data)) {
          setStockMovements(movementsResponse.data.map((m: StockMovement, index: number) => ({
            id: m.movement_id || `SM-${index}`,
            date: m.movement_date,
            type: m.movement_type?.toLowerCase() || 'transfer',
            item: m.product_name,
            qty: m.quantity,
            from: 'Source',
            to: 'Destination',
          })));
        }

      } catch (err: unknown) {
        console.error('Failed to fetch inventory data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory data';
        setError(errorMessage);
        message.error('Failed to load inventory data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  // Refresh data function
  const handleRefresh = () => {
    setLoading(true);
    inventoryService.getStats()
      .then(stats => {
        setInventoryStats(prev => ({
          ...prev,
          totalItems: parseInt(stats.total_products) || 0,
          totalValue: parseFloat(stats.total_value) || 0,
          lowStock: parseInt(stats.low_stock_items) || 0,
          outOfStock: parseInt(stats.out_of_stock_items) || 0,
        }));
        message.success('Data refreshed');
      })
      .catch(() => message.error('Failed to refresh'))
      .finally(() => setLoading(false));
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA')}`;

  const getMovementType = (type: string) => {
    const configs: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      'receipt': { color: 'green', text: 'Receipt', icon: <PlusOutlined /> },
      'issue': { color: 'red', text: 'Issue', icon: <FallOutlined /> },
      'transfer': { color: 'blue', text: 'Transfer', icon: <SwapOutlined /> },
      'adjustment': { color: 'orange', text: 'Adjustment', icon: <ExclamationCircleOutlined /> },
      'return': { color: 'purple', text: 'Return', icon: <RiseOutlined /> },
    };
    const config = configs[type] || { color: 'default', text: type };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const getStockStatus = (current: number, min: number) => {
    const percentage = (current / min) * 100;
    if (percentage <= 25) return { color: '#ef4444', text: 'Critical' };
    if (percentage <= 50) return { color: '#f59e0b', text: 'Low' };
    return { color: '#10b981', text: 'OK' };
  };

  const lowStockColumns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current',
      render: (v: number, record: typeof lowStockItems[0]) => {
        const status = getStockStatus(v, record.min);
        return <Text style={{ color: status.color }}>{v} {record.unit}</Text>;
      },
    },
    {
      title: 'Minimum',
      dataIndex: 'min',
      key: 'min',
      render: (v: number, record: typeof lowStockItems[0]) => `${v} ${record.unit}`,
    },
    {
      title: 'Stock Level',
      key: 'level',
      render: (_: unknown, record: typeof lowStockItems[0]) => (
        <Progress 
          percent={Math.round((record.current / record.min) * 100)} 
          strokeColor={getStockStatus(record.current, record.min).color}
          size="small"
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Days Left',
      dataIndex: 'daysLeft',
      key: 'daysLeft',
      render: (days: number) => (
        <Tag color={days <= 3 ? 'red' : days <= 7 ? 'orange' : 'blue'}>
          {days} days
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
          Reorder
        </Button>
      ),
    },
  ];

  const movementColumns = [
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong style={{ color: '#667eea' }}>{text}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getMovementType(type),
    },
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
    },
    {
      title: 'Quantity',
      dataIndex: 'qty',
      key: 'qty',
      render: (v: number, record: typeof stockMovements[0]) => (
        <Text style={{ color: record.type === 'issue' || v < 0 ? '#ef4444' : '#10b981' }}>
          {v > 0 && record.type !== 'issue' ? '+' : ''}{v}
        </Text>
      ),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
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
            {/* Stock Health Overview */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Items"
                    value={inventoryStats.totalItems}
                    prefix={<AppstoreOutlined style={{ color: '#667eea' }} />}
                    valueStyle={{ color: '#667eea' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Low Stock"
                    value={inventoryStats.lowStock}
                    prefix={<WarningOutlined style={{ color: '#f59e0b' }} />}
                    valueStyle={{ color: '#f59e0b' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Out of Stock"
                    value={inventoryStats.outOfStock}
                    prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                    valueStyle={{ color: '#ef4444' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Turnover Rate"
                    value={inventoryStats.turnoverRate}
                    suffix="x"
                    prefix={<RiseOutlined style={{ color: '#10b981' }} />}
                    valueStyle={{ color: '#10b981' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Low Stock Alert */}
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: '#f59e0b' }} />
                  Low Stock Items
                </Space>
              }
              extra={<Button type="link">View All</Button>}
              style={{ marginBottom: 24 }}
            >
              <Table
                dataSource={lowStockItems}
                columns={lowStockColumns.slice(0, -1)}
                rowKey="sku"
                pagination={false}
                size="middle"
              />
            </Card>

            {/* Recent Movements */}
            <Card 
              title="Recent Stock Movements"
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} onClick={() => setShowMovementModal(true)}>
                    New Movement
                  </Button>
                  <Button type="link">View All</Button>
                </Space>
              }
            >
              <Table
                dataSource={stockMovements}
                columns={movementColumns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>

          {/* Right Sidebar */}
          <Col span={8}>
            {/* Stock by Category */}
            <Card title="Stock by Category" style={{ marginBottom: 24 }}>
              {stockByCategory.map(cat => (
                <div key={cat.category} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{cat.category}</Text>
                    <Text type="secondary">{cat.items} items</Text>
                  </div>
                  <Progress 
                    percent={cat.percentage} 
                    strokeColor={cat.status === 'healthy' ? '#10b981' : cat.status === 'warning' ? '#f59e0b' : '#ef4444'}
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(cat.value)}</Text>
                </div>
              ))}
            </Card>

            {/* Quick Actions */}
            <QuickActionsCard
              title="Quick Actions"
              actions={[
                { icon: <PlusOutlined />, label: 'Add Item', onClick: () => setShowItemModal(true) },
                { icon: <SwapOutlined />, label: 'Transfer', onClick: () => setShowMovementModal(true) },
                { icon: <BarcodeOutlined />, label: 'Scan Item' },
                { icon: <DownloadOutlined />, label: 'Export' },
              ]}
            />

            {/* Warehouse Overview */}
            <Card title="Warehouse Capacity" style={{ marginTop: 24 }}>
              {warehouses.map(wh => (
                <div key={wh.code} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong>{wh.code}</Text>
                    <Text type="secondary">{wh.location}</Text>
                  </div>
                  <Progress 
                    percent={wh.capacity} 
                    strokeColor={wh.capacity >= 90 ? '#ef4444' : wh.capacity >= 75 ? '#f59e0b' : '#10b981'}
                    size="small"
                  />
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      icon: <AppstoreOutlined />,
      children: (
        <Card 
          title="Item Master"
          extra={
            <Space>
              <Input.Search placeholder="Search items..." style={{ width: 250 }} />
              <Button icon={<FilterOutlined />}>Filter</Button>
              <Button type="primary" icon={<PlusOutlined />}>Add Item</Button>
            </Space>
          }
        >
          <Alert
            message="Full Item Management"
            description="Browse, search, and manage all inventory items including SKUs, descriptions, costs, and specifications."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary">Item management table will be displayed here...</Text>
        </Card>
      ),
    },
    {
      key: 'movements',
      label: 'Movements',
      icon: <SwapOutlined />,
      children: (
        <Card 
          title="Stock Movements"
          extra={<Button type="primary" icon={<PlusOutlined />}>New Movement</Button>}
        >
          <Table
            dataSource={stockMovements}
            columns={movementColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'warehouses',
      label: 'Warehouses',
      icon: <EnvironmentOutlined />,
      children: (
        <Row gutter={24}>
          {warehouses.map(wh => (
            <Col span={12} key={wh.code}>
              <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Title level={4}>{wh.name}</Title>
                    <Tag>{wh.code}</Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>{wh.location}</Text>
                  </div>
                  <Button type="link">Manage</Button>
                </div>
                <Divider />
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="Items" value={wh.items} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Value" value={wh.value} prefix="R" />
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Capacity</Text>
                    <Progress 
                      percent={wh.capacity} 
                      strokeColor={wh.capacity >= 90 ? '#ef4444' : wh.capacity >= 75 ? '#f59e0b' : '#10b981'}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <PieChartOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Inventory Reports">
              <List
                dataSource={[
                  'Stock Valuation Report',
                  'Stock Movement History',
                  'Reorder Analysis',
                  'Aging Report',
                  'Turnover Analysis',
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="link" key="run">Generate</Button>]}
                  >
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Analytics Dashboard">
              <Paragraph>Interactive charts and insights about inventory performance.</Paragraph>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Inventory Settings">
              <Form layout="vertical">
                <Form.Item label="Valuation Method">
                  <Select defaultValue="weighted_avg">
                    <Select.Option value="fifo">FIFO</Select.Option>
                    <Select.Option value="lifo">LIFO</Select.Option>
                    <Select.Option value="weighted_avg">Weighted Average</Select.Option>
                    <Select.Option value="specific">Specific Identification</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Low Stock Alert Threshold (%)">
                  <InputNumber defaultValue={25} style={{ width: '100%' }} min={0} max={100} />
                </Form.Item>
                <Button type="primary">Save Settings</Button>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Barcode Settings">
              <Paragraph>Configure barcode scanning and label printing.</Paragraph>
              <Button type="primary" icon={<QrcodeOutlined />} onClick={() => setShowBarcodeModal(true)}>
                Configure Barcodes
              </Button>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <HubLayout>
      <HubHeader
        title="Inventory Management"
        subtitle="Stock Control, Movements & Warehouse Management"
        icon={<InboxOutlined />}
        gradient="orange"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Sync</Button>
            <Button icon={<BarcodeOutlined />}>Scan</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowItemModal(true)}>
              Add Item
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="orange"
        icon={<AppstoreOutlined />}
        title="Inventory Status"
        subtitle={`${inventoryStats.warehouses} Warehouses • ${inventoryStats.categories} Categories`}
        stats={[
          { title: 'Total Items', value: inventoryStats.totalItems, span: 3 },
          { title: 'Stock Value', value: inventoryStats.totalValue, prefix: 'R', span: 4 },
          { title: 'Low Stock', value: inventoryStats.lowStock, valueStyle: { color: '#fbbf24' }, span: 3 },
          { title: 'Out of Stock', value: inventoryStats.outOfStock, valueStyle: { color: '#fca5a5' }, span: 3 },
          { title: 'Avg Days Stock', value: inventoryStats.avgDaysStock, suffix: ' days', span: 4 },
        ]}
      />

      <HubTabs 
        theme="orange"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Barcode Configuration Modal */}
      <Modal
        title="Barcode Configuration"
        open={showBarcodeModal}
        onCancel={() => setShowBarcodeModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowBarcodeModal(false)}>Cancel</Button>,
          <Button key="save" type="primary" onClick={() => {
            message.success('Barcode settings saved and applied');
            setShowBarcodeModal(false);
          }}>
            Save Settings
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical" form={barcodeForm} initialValues={{
          mode: 'keyboard',
          format: 'code128',
          prefix: 'INV-',
          copies: 1,
          autoPrint: true,
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Scanner Mode" name="mode" required>
                <Select>
                  <Select.Option value="keyboard">Keyboard Wedge (USB)</Select.Option>
                  <Select.Option value="serial">Serial (COM)</Select.Option>
                  <Select.Option value="camera">Camera / Mobile</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Label Format" name="format" required>
                <Select>
                  <Select.Option value="code128">Code 128</Select.Option>
                  <Select.Option value="ean13">EAN-13</Select.Option>
                  <Select.Option value="qr">QR Code</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="SKU Prefix" name="prefix">
                <Input placeholder="e.g., INV-" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Label Copies" name="copies">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Auto-print after scan" name="autoPrint" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Label Template">
            <Input.TextArea rows={3} placeholder="Define label text or select printer template" />
          </Form.Item>

          <Divider orientation="left">Scanner Health</Divider>
          <StatusIndicator
            items={[
              { label: 'Scanner Connected', status: 'connected', sublabel: 'USB / Keyboard Wedge' },
              { label: 'Printer Ready', status: 'connected', sublabel: 'Thermal Label Printer' },
            ]}
          />

          <Divider orientation="left">Test Scan</Divider>
          <Row gutter={16}>
            <Col span={16}>
              <Input
                value={testScanValue}
                onChange={e => setTestScanValue(e.target.value)}
                placeholder="Focus input and scan to test"
                prefix={<BarcodeOutlined />}
              />
            </Col>
            <Col span={8}>
              <Button
                block
                type="primary"
                onClick={() => message.success(`Scan received: ${testScanValue}`)}
              >
                Simulate Scan
              </Button>
            </Col>
          </Row>
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="Tip: Keep focus on this input to capture hardware scans."
          />

          <Divider orientation="left">Preview</Divider>
          <Card size="small" bordered>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Label Preview</Text>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ padding: '8px 12px', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                  <BarcodeOutlined style={{ fontSize: 24 }} />
                </div>
                <div>
                  <Text type="secondary">Sample SKU</Text>
                  <div><Text strong>{testScanValue || 'INV-XXXX-0001'}</Text></div>
                </div>
              </div>
            </Space>
          </Card>
        </Form>
      </Modal>

      {/* New Item Modal */}
      <Modal
        title="Add New Item"
        open={showItemModal}
        onCancel={() => setShowItemModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowItemModal(false)}>Cancel</Button>,
          <Button key="create" type="primary" onClick={() => { message.success('Item created'); setShowItemModal(false); }}>
            Create Item
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="SKU" required>
                <Input placeholder="Auto-generated" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Item Name" required>
                <Input placeholder="Enter item name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category">
                <Select placeholder="Select category">
                  {stockByCategory.map(c => (
                    <Select.Option key={c.category} value={c.category}>{c.category}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Unit of Measure">
                <Select placeholder="Select UoM">
                  <Select.Option value="pcs">Pieces</Select.Option>
                  <Select.Option value="kg">Kilograms</Select.Option>
                  <Select.Option value="m">Meters</Select.Option>
                  <Select.Option value="l">Liters</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Minimum Stock">
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Reorder Point">
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Default Location">
                <Select placeholder="Select warehouse">
                  {warehouses.map(w => (
                    <Select.Option key={w.code} value={w.code}>{w.code}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal
        title="Record Stock Movement"
        open={showMovementModal}
        onCancel={() => setShowMovementModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowMovementModal(false)}>Cancel</Button>,
          <Button key="save" type="primary" onClick={() => { message.success('Movement recorded'); setShowMovementModal(false); }}>
            Record Movement
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Movement Type" required>
            <Select placeholder="Select type">
              <Select.Option value="receipt">Receipt</Select.Option>
              <Select.Option value="issue">Issue</Select.Option>
              <Select.Option value="transfer">Transfer</Select.Option>
              <Select.Option value="adjustment">Adjustment</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="From Location">
                <Select placeholder="Select source">
                  {warehouses.map(w => (
                    <Select.Option key={w.code} value={w.code}>{w.code} - {w.name}</Select.Option>
                  ))}
                  <Select.Option value="supplier">Supplier</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="To Location">
                <Select placeholder="Select destination">
                  {warehouses.map(w => (
                    <Select.Option key={w.code} value={w.code}>{w.code} - {w.name}</Select.Option>
                  ))}
                  <Select.Option value="production">Production</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item label="Item" required>
                <Select placeholder="Select item">
                  {lowStockItems.map(i => (
                    <Select.Option key={i.sku} value={i.sku}>{i.sku} - {i.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Quantity" required>
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default InventoryHub;
