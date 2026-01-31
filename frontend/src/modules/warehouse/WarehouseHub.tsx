import React, { useState, useEffect } from 'react';
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
  Badge,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Divider,
  Timeline,
  Alert,
  Tooltip,
  Switch,
  DatePicker,
  Spin,
  Empty,
  message
} from 'antd';
import {
  HomeOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  ExportOutlined,
  ImportOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  PrinterOutlined,
  ScanOutlined,
  CarOutlined,
  TeamOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  AimOutlined,
  BlockOutlined,
  AppstoreOutlined,
  HeatMapOutlined,
  RocketOutlined,
  SyncOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';
import apiClient from '../../services/api';

const { Option } = Select;

interface WarehouseStats {
  totalLocations: number;
  utilizationRate: number;
  pendingReceipts: number;
  pendingPicks: number;
  activeTransfers: number;
  todayShipments: number;
}

interface WarehouseZone {
  id: string;
  name: string;
  type: string;
  locations: number;
  utilized: number;
  status: string;
}

interface PendingReceipt {
  id: string;
  po: string;
  supplier: string;
  items: number;
  expectedDate: string;
  status: string;
  dock: string;
}

interface PickOrder {
  id: string;
  order: string;
  customer: string;
  items: number;
  lines: number;
  priority: string;
  status: string;
  picker: string;
  progress: number;
}

interface StockTransfer {
  id: string;
  from: string;
  to: string;
  sku: string;
  qty: number;
  status: string;
  reason: string;
}

interface LocationInventory {
  location: string;
  sku: string;
  product: string;
  qty: number;
  capacity: number;
  lastCounted: string;
  status: string;
}

const WarehouseHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [pickModalVisible, setPickModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // API State
  const [warehouseStats, setWarehouseStats] = useState<WarehouseStats>({
    totalLocations: 0,
    utilizationRate: 0,
    pendingReceipts: 0,
    pendingPicks: 0,
    activeTransfers: 0,
    todayShipments: 0
  });
  const [warehouseZones, setWarehouseZones] = useState<WarehouseZone[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [pickOrders, setPickOrders] = useState<PickOrder[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [locationInventory, setLocationInventory] = useState<LocationInventory[]>([]);

  // Fetch warehouse data from API
  useEffect(() => {
    const fetchWarehouseData = async () => {
      setLoading(true);
      try {
        const [statsRes, zonesRes, receiptsRes, picksRes, transfersRes, inventoryRes] = await Promise.all([
          apiClient.get('/api/warehouse/stats').catch(() => ({ data: null })),
          apiClient.get('/api/warehouse/zones').catch(() => ({ data: [] })),
          apiClient.get('/api/warehouse/receipts/pending').catch(() => ({ data: [] })),
          apiClient.get('/api/warehouse/picks/pending').catch(() => ({ data: [] })),
          apiClient.get('/api/warehouse/transfers/active').catch(() => ({ data: [] })),
          apiClient.get('/api/warehouse/inventory/locations').catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) {
          setWarehouseStats(statsRes.data.data || statsRes.data);
        }
        setWarehouseZones(zonesRes.data?.data || zonesRes.data || []);
        setPendingReceipts(receiptsRes.data?.data || receiptsRes.data || []);
        setPickOrders(picksRes.data?.data || picksRes.data || []);
        setStockTransfers(transfersRes.data?.data || transfersRes.data || []);
        setLocationInventory(inventoryRes.data?.data || inventoryRes.data || []);
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
        message.error('Failed to load warehouse data');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseData();
  }, []);

  // Export function
  const handleExport = () => {
    try {
      let csvContent = '';
      let filename = '';
      const now = new Date().toISOString().split('T')[0];

      if (activeTab === 'locations') {
        csvContent = 'Zone,Name,Type,Locations,Utilized,Status\n';
        warehouseZones.forEach(z => {
          csvContent += `"${z.id}","${z.name}","${z.type}",${z.locations},${z.utilized},"${z.status}"\n`;
        });
        filename = `warehouse-zones-${now}.csv`;
      } else if (activeTab === 'receiving') {
        csvContent = 'GRN,PO,Supplier,Items,Expected Date,Status,Dock\n';
        pendingReceipts.forEach(r => {
          csvContent += `"${r.id}","${r.po}","${r.supplier}",${r.items},"${r.expectedDate}","${r.status}","${r.dock}"\n`;
        });
        filename = `pending-receipts-${now}.csv`;
      } else if (activeTab === 'picking') {
        csvContent = 'Pick ID,Order,Customer,Items,Lines,Priority,Status,Picker,Progress\n';
        pickOrders.forEach(p => {
          csvContent += `"${p.id}","${p.order}","${p.customer}",${p.items},${p.lines},"${p.priority}","${p.status}","${p.picker}",${p.progress}%\n`;
        });
        filename = `pick-orders-${now}.csv`;
      } else if (activeTab === 'transfers') {
        csvContent = 'Transfer ID,From,To,SKU,Qty,Status,Reason\n';
        stockTransfers.forEach(t => {
          csvContent += `"${t.id}","${t.from}","${t.to}","${t.sku}",${t.qty},"${t.status}","${t.reason}"\n`;
        });
        filename = `stock-transfers-${now}.csv`;
      } else {
        csvContent = 'Location,SKU,Product,Qty,Capacity,Last Counted,Status\n';
        locationInventory.forEach(l => {
          csvContent += `"${l.location}","${l.sku}","${l.product}",${l.qty},${l.capacity},"${l.lastCounted}","${l.status}"\n`;
        });
        filename = `location-inventory-${now}.csv`;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      message.success(`Exported ${filename}`);
    } catch (err) {
      message.error('Export failed');
    }
  };

  // Zone columns
  const zoneColumns = [
    { title: 'Zone ID', dataIndex: 'id', key: 'id', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Zone Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => {
      const colors: Record<string, string> = {
        'Receiving': 'cyan',
        'Storage': 'blue',
        'Picking': 'green',
        'Shipping': 'orange',
        'Cold Chain': 'purple',
        'Hazardous': 'red',
        'Returns': 'gold'
      };
      return <Tag color={colors[type]}>{type}</Tag>;
    }},
    { title: 'Locations', dataIndex: 'locations', key: 'locations' },
    { title: 'Utilization', key: 'utilization', render: (_: unknown, record: typeof warehouseZones[0]) => {
      const percent = Math.round((record.utilized / record.locations) * 100);
      const status = percent > 90 ? 'exception' : percent > 70 ? 'normal' : 'success';
      return <Progress percent={percent} size="small" status={status} />;
    }},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Badge status={status === 'active' ? 'success' : 'warning'} text={status === 'active' ? 'Active' : 'Near Capacity'} />
    )},
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button type="link" size="small">View Map</Button>
        <Button type="link" size="small">Manage</Button>
      </Space>
    )}
  ];

  // Receipt columns
  const receiptColumns = [
    { title: 'GRN #', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'PO Reference', dataIndex: 'po', key: 'po' },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Expected', dataIndex: 'expectedDate', key: 'expectedDate' },
    { title: 'Dock', dataIndex: 'dock', key: 'dock', render: (dock: string) => <Tag>{dock}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
        'arriving_today': { color: 'green', icon: <CarOutlined />, label: 'Arriving Today' },
        'in_transit': { color: 'blue', icon: <CarOutlined />, label: 'In Transit' },
        'scheduled': { color: 'default', icon: <ClockCircleOutlined />, label: 'Scheduled' }
      };
      const { color, icon, label } = config[status] || { color: 'default', icon: null, label: status };
      return <Tag color={color} icon={icon}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof pendingReceipts[0]) => (
      <Space>
        <Button type="primary" size="small" icon={<ScanOutlined />} onClick={() => setReceiveModalVisible(true)}>
          Receive
        </Button>
        <Button size="small">View</Button>
      </Space>
    )}
  ];

  // Pick order columns
  const pickColumns = [
    { title: 'Pick #', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'Sales Order', dataIndex: 'order', key: 'order' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Lines', dataIndex: 'lines', key: 'lines' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (priority: string) => {
      const colors: Record<string, string> = { 'urgent': 'red', 'high': 'orange', 'normal': 'blue' };
      return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
    }},
    { title: 'Picker', dataIndex: 'picker', key: 'picker' },
    { title: 'Progress', key: 'progress', render: (_: unknown, record: typeof pickOrders[0]) => (
      <Progress percent={record.progress} size="small" status={record.progress === 100 ? 'success' : 'active'} />
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'picking': { color: 'processing', label: 'Picking' },
        'assigned': { color: 'blue', label: 'Assigned' },
        'pending': { color: 'default', label: 'Pending' },
        'packing': { color: 'green', label: 'Packing' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof pickOrders[0]) => (
      <Space>
        {record.status === 'pending' && (
          <Button type="primary" size="small" icon={<TeamOutlined />}>Assign</Button>
        )}
        {record.status === 'picking' && (
          <Button size="small" icon={<ScanOutlined />}>Continue</Button>
        )}
        {record.status === 'packing' && (
          <Button type="primary" size="small" icon={<PrinterOutlined />}>Ship</Button>
        )}
        <Button size="small">View</Button>
      </Space>
    )}
  ];

  // Transfer columns
  const transferColumns = [
    { title: 'Transfer #', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'From', dataIndex: 'from', key: 'from' },
    { title: 'To', dataIndex: 'to', key: 'to' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (sku: string) => <Tag>{sku}</Tag> },
    { title: 'Qty', dataIndex: 'qty', key: 'qty' },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'in_progress': { color: 'processing', label: 'In Progress' },
        'pending': { color: 'default', label: 'Pending' },
        'completed': { color: 'success', label: 'Completed' },
        'in_transit': { color: 'blue', label: 'In Transit' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof stockTransfers[0]) => (
      <Space>
        {record.status !== 'completed' && (
          <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Complete</Button>
        )}
        <Button size="small">View</Button>
      </Space>
    )}
  ];

  // Location columns
  const locationColumns = [
    { title: 'Location', dataIndex: 'location', key: 'location', render: (text: string) => (
      <Space>
        <EnvironmentOutlined />
        <strong>{text}</strong>
      </Space>
    )},
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (sku: string) => <Tag color="blue">{sku}</Tag> },
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'Quantity', dataIndex: 'qty', key: 'qty' },
    { title: 'Capacity', key: 'capacity', render: (_: unknown, record: typeof locationInventory[0]) => {
      const percent = Math.round((record.qty / record.capacity) * 100);
      return (
        <Tooltip title={`${record.qty} / ${record.capacity}`}>
          <Progress percent={percent} size="small" status={percent === 0 ? 'exception' : percent > 95 ? 'exception' : 'normal'} />
        </Tooltip>
      );
    }},
    { title: 'Last Counted', dataIndex: 'lastCounted', key: 'lastCounted' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'ok': { color: 'success', label: 'OK' },
        'low': { color: 'warning', label: 'Low Stock' },
        'full': { color: 'orange', label: 'Full' },
        'empty': { color: 'default', label: 'Empty' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button size="small" icon={<SwapOutlined />}>Transfer</Button>
        <Button size="small" icon={<AimOutlined />}>Count</Button>
      </Space>
    )}
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Zone Overview */}
      <Card title="Warehouse Zones Overview" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          {warehouseZones.map(zone => (
            <Col xs={24} sm={12} md={8} lg={6} key={zone.id}>
              <Card 
                size="small" 
                hoverable
                style={{ 
                  borderLeft: `4px solid ${zone.status === 'warning' ? '#faad14' : '#52c41a'}`,
                  height: '100%'
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Tag color="blue">{zone.id}</Tag>
                  <span style={{ fontWeight: 500, marginLeft: 8 }}>{zone.type}</span>
                </div>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>{zone.name}</div>
                <Progress 
                  percent={Math.round((zone.utilized / zone.locations) * 100)} 
                  size="small"
                  status={zone.status === 'warning' ? 'exception' : 'normal'}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {zone.utilized} / {zone.locations} locations
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Activity Timeline */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" extra={<Button type="link">View All</Button>}>
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <div><strong>GRN-2024-0088</strong> received at Dock 2</div>
                      <div style={{ fontSize: 12, color: '#999' }}>15 items from Global Electronics • 10 mins ago</div>
                    </>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <div><strong>PICK-2024-0233</strong> completed by Sarah K.</div>
                      <div style={{ fontSize: 12, color: '#999' }}>8 lines picked • 25 mins ago</div>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <div><strong>Zone E</strong> approaching capacity (95%)</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Cold Storage alert • 1 hour ago</div>
                    </>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <>
                      <div><strong>Cycle Count</strong> completed for Zone B</div>
                      <div style={{ fontSize: 12, color: '#999' }}>99.2% accuracy • 2 hours ago</div>
                    </>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <div><strong>TRF-2024-0044</strong> inter-warehouse transfer completed</div>
                      <div style={{ fontSize: 12, color: '#999' }}>150 units to Warehouse B • 3 hours ago</div>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>

        {/* Quick Actions & Metrics */}
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<ImportOutlined />} 
                  block 
                  size="large"
                  onClick={() => setReceiveModalVisible(true)}
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Receive</div>
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<ExportOutlined />} 
                  block 
                  size="large"
                  onClick={() => setPickModalVisible(true)}
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Pick</div>
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<SwapOutlined />} 
                  block 
                  size="large"
                  onClick={() => setTransferModalVisible(true)}
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Transfer</div>
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<AimOutlined />} 
                  block 
                  size="large"
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Cycle Count</div>
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<PrinterOutlined />} 
                  block 
                  size="large"
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Print Labels</div>
                </Button>
              </Col>
              <Col span={8}>
                <Button 
                  type="default" 
                  icon={<BarcodeOutlined />} 
                  block 
                  size="large"
                  style={{ height: 80, flexDirection: 'column', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ marginTop: 8 }}>Scan</div>
                </Button>
              </Col>
            </Row>
          </Card>

          <Card title="Today's Performance">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Pick Accuracy" 
                  value={99.5} 
                  suffix="%" 
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Avg Pick Time" 
                  value={4.2} 
                  suffix="mins" 
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Orders Shipped" 
                  value={23} 
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<CarOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Items Received" 
                  value={156} 
                  valueStyle={{ color: '#13c2c2' }}
                  prefix={<InboxOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Render Receiving
  const renderReceiving = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Pending Receipts" 
        extra={
          <Space>
            <Button icon={<ScanOutlined />}>Scan Delivery</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setReceiveModalVisible(true)}>
              New Receipt
            </Button>
          </Space>
        }
      >
        <Alert
          message="2 deliveries expected today"
          description="Dock 1 and Dock 2 have scheduled arrivals. Ensure receiving staff are ready."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table 
          dataSource={pendingReceipts} 
          columns={receiptColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Picking
  const renderPicking = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Pending" value={12} valueStyle={{ color: '#666' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="In Progress" value={8} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Packing" value={5} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Shipped Today" value={23} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Pick Orders" 
        extra={
          <Space>
            <Button icon={<ThunderboltOutlined />}>Auto-Assign</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setPickModalVisible(true)}>
              Create Wave
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={pickOrders} 
          columns={pickColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Transfers
  const renderTransfers = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Stock Transfers" 
        extra={
          <Space>
            <Button icon={<BlockOutlined />}>Bulk Transfer</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTransferModalVisible(true)}>
              New Transfer
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={stockTransfers} 
          columns={transferColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Locations
  const renderLocations = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Location Inventory" 
        extra={
          <Space>
            <Input.Search placeholder="Search location or SKU..." style={{ width: 250 }} />
            <Button icon={<AppstoreOutlined />}>Batch Update</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Location</Button>
          </Space>
        }
      >
        <Table 
          dataSource={locationInventory} 
          columns={locationColumns} 
          rowKey="location"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Zone Map
  const renderZoneMap = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Warehouse Zone Configuration" 
        extra={
          <Space>
            <Button icon={<HeatMapOutlined />}>View Heat Map</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setZoneModalVisible(true)}>
              Add Zone
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={warehouseZones} 
          columns={zoneColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="Warehouse Layout" style={{ marginTop: 24 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 16, 
          padding: 24,
          background: '#f5f5f5',
          borderRadius: 8
        }}>
          {warehouseZones.map(zone => {
            const utilization = Math.round((zone.utilized / zone.locations) * 100);
            const bgColor = utilization > 90 ? '#fff2e8' : utilization > 70 ? '#e6f7ff' : '#f6ffed';
            const borderColor = utilization > 90 ? '#fa8c16' : utilization > 70 ? '#1890ff' : '#52c41a';
            return (
              <div 
                key={zone.id}
                style={{
                  padding: 16,
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: 8,
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{zone.id}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{zone.type}</div>
                <Progress 
                  type="circle" 
                  percent={utilization} 
                  size={60}
                  status={utilization > 90 ? 'exception' : 'normal'}
                />
                <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
                  {zone.utilized}/{zone.locations}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  // Render Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Warehouse Configuration">
            <Form layout="vertical">
              <Form.Item label="Warehouse Name">
                <Input defaultValue="Main Distribution Center" />
              </Form.Item>
              <Form.Item label="Location Code Format">
                <Input defaultValue="ZONE-AISLE-RACK-BIN" />
              </Form.Item>
              <Form.Item label="Default Put-away Strategy">
                <Select defaultValue="closest">
                  <Option value="closest">Closest Available</Option>
                  <Option value="zone">Zone-Based</Option>
                  <Option value="fifo">FIFO Optimized</Option>
                  <Option value="velocity">Velocity-Based</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Default Picking Strategy">
                <Select defaultValue="wave">
                  <Option value="wave">Wave Picking</Option>
                  <Option value="batch">Batch Picking</Option>
                  <Option value="zone">Zone Picking</Option>
                  <Option value="cluster">Cluster Picking</Option>
                </Select>
              </Form.Item>
              <Button type="primary">Save Configuration</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Automation Settings">
            <Form layout="vertical">
              <Form.Item label="Auto-assign Pick Orders">
                <Switch defaultChecked />
                <span style={{ marginLeft: 8, color: '#666' }}>Automatically assign picks to available pickers</span>
              </Form.Item>
              <Form.Item label="Auto-replenishment">
                <Switch defaultChecked />
                <span style={{ marginLeft: 8, color: '#666' }}>Trigger replenishment when pick face is low</span>
              </Form.Item>
              <Form.Item label="Cycle Count Schedule">
                <Select defaultValue="weekly">
                  <Option value="daily">Daily (High-velocity items)</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="quarterly">Quarterly</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Low Stock Alert Threshold">
                <InputNumber defaultValue={10} suffix="%" style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Barcode & Scanner Configuration">
            <Row gutter={[24, 16]}>
              <Col xs={24} md={8}>
                <Form.Item label="Barcode Format">
                  <Select defaultValue="code128">
                    <Option value="code128">Code 128</Option>
                    <Option value="ean13">EAN-13</Option>
                    <Option value="qr">QR Code</Option>
                    <Option value="datamatrix">Data Matrix</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Scanner Mode">
                  <Select defaultValue="continuous">
                    <Option value="continuous">Continuous Scan</Option>
                    <Option value="single">Single Scan</Option>
                    <Option value="batch">Batch Mode</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Label Printer">
                  <Select defaultValue="zebra">
                    <Option value="zebra">Zebra ZD420</Option>
                    <Option value="brother">Brother QL-820NWB</Option>
                    <Option value="dymo">DYMO LabelWriter</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Warehouse Hub"
        subtitle="Manage warehouse operations, picking, receiving, and inventory locations"
        icon={<InboxOutlined />}
        gradient="blue"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Sync</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<ScanOutlined />}>Scan Mode</Button>
          </>
        }
      />

      <StatusBanner
        gradient="blue"
        icon={<HeatMapOutlined />}
        title="Warehouse Overview"
        subtitle="Real-time Operations"
        stats={[
          { title: 'Total Locations', value: warehouseStats.totalLocations, span: 4 },
          { title: 'Utilization', value: `${warehouseStats.utilizationRate}%`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Pending Receipts', value: warehouseStats.pendingReceipts, span: 4 },
          { title: 'Pending Picks', value: warehouseStats.pendingPicks, span: 4 },
          { title: 'Today\'s Shipments', value: warehouseStats.todayShipments, span: 4 },
        ]}
      />

      <HubTabs 
        theme="blue"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'receiving', label: 'Receiving', icon: <ImportOutlined />, children: renderReceiving() },
          { key: 'picking', label: 'Picking', icon: <ExportOutlined />, children: renderPicking() },
          { key: 'transfers', label: 'Transfers', icon: <SwapOutlined />, children: renderTransfers() },
          { key: 'locations', label: 'Locations', icon: <EnvironmentOutlined />, children: renderLocations() },
          { key: 'zones', label: 'Zone Map', icon: <HeatMapOutlined />, children: renderZoneMap() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Receive Modal */}
      <Modal
        title="Receive Goods"
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReceiveModalVisible(false)}>Cancel</Button>,
          <Button key="receive" type="primary" icon={<CheckCircleOutlined />}>Confirm Receipt</Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Purchase Order" name="po" rules={[{ required: true }]}>
            <Select placeholder="Select PO">
              <Option value="PO-2024-0156">PO-2024-0156 - Global Electronics</Option>
              <Option value="PO-2024-0157">PO-2024-0157 - Premium Parts</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Receiving Dock" name="dock" rules={[{ required: true }]}>
            <Select placeholder="Select dock">
              <Option value="dock1">Dock 1</Option>
              <Option value="dock2">Dock 2</Option>
              <Option value="dock3">Dock 3</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Delivery Note Number" name="deliveryNote">
            <Input placeholder="Enter supplier's delivery note" />
          </Form.Item>
          <Divider />
          <Alert
            message="Scan items or enter quantities manually below"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item label="Scan / Enter SKU" name="sku">
            <Input.Search 
              placeholder="Scan barcode or enter SKU" 
              enterButton={<ScanOutlined />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Pick Wave Modal */}
      <Modal
        title="Create Pick Wave"
        open={pickModalVisible}
        onCancel={() => setPickModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPickModalVisible(false)}>Cancel</Button>,
          <Button key="create" type="primary" icon={<ThunderboltOutlined />}>Create Wave</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Wave Name" name="waveName">
            <Input placeholder="e.g., Morning Wave 1" />
          </Form.Item>
          <Form.Item label="Select Orders" name="orders">
            <Select mode="multiple" placeholder="Select sales orders to include">
              <Option value="SO-2024-0789">SO-2024-0789 - Acme Corp (5 items)</Option>
              <Option value="SO-2024-0790">SO-2024-0790 - Tech Solutions (3 items)</Option>
              <Option value="SO-2024-0791">SO-2024-0791 - Global Traders (8 items)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Assign To" name="picker">
            <Select placeholder="Select picker (optional)">
              <Option value="john">John M.</Option>
              <Option value="sarah">Sarah K.</Option>
              <Option value="mike">Mike R.</Option>
              <Option value="auto">Auto-Assign</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Priority" name="priority">
            <Select defaultValue="normal">
              <Option value="urgent">Urgent</Option>
              <Option value="high">High</Option>
              <Option value="normal">Normal</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        title="Create Stock Transfer"
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTransferModalVisible(false)}>Cancel</Button>,
          <Button key="create" type="primary" icon={<SwapOutlined />}>Create Transfer</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="From Location" name="fromLocation" rules={[{ required: true }]}>
                <Select placeholder="Select source">
                  <Option value="B-12-3-A">B-12-3-A</Option>
                  <Option value="B-15-2-B">B-15-2-B</Option>
                  <Option value="C-05-1-A">C-05-1-A</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="To Location" name="toLocation" rules={[{ required: true }]}>
                <Select placeholder="Select destination">
                  <Option value="C-05-1-A">C-05-1-A (Pick Face)</Option>
                  <Option value="G-01-1-A">G-01-1-A (Returns)</Option>
                  <Option value="B-20-1-A">B-20-1-A (Bulk)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
            <Input.Search placeholder="Scan or enter SKU" enterButton={<ScanOutlined />} />
          </Form.Item>
          <Form.Item label="Quantity" name="qty" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
          </Form.Item>
          <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
            <Select placeholder="Select reason">
              <Option value="replenishment">Replenishment</Option>
              <Option value="putaway">Put-away</Option>
              <Option value="damaged">Damaged Goods</Option>
              <Option value="reorg">Reorganization</Option>
              <Option value="interwarehouse">Inter-warehouse</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Zone Modal */}
      <Modal
        title="Add Warehouse Zone"
        open={zoneModalVisible}
        onCancel={() => setZoneModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setZoneModalVisible(false)}>Cancel</Button>,
          <Button key="create" type="primary">Create Zone</Button>
        ]}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Zone Code" name="zoneCode" rules={[{ required: true }]}>
            <Input placeholder="e.g., Z-H" />
          </Form.Item>
          <Form.Item label="Zone Name" name="zoneName" rules={[{ required: true }]}>
            <Input placeholder="e.g., Zone H - Overflow" />
          </Form.Item>
          <Form.Item label="Zone Type" name="zoneType" rules={[{ required: true }]}>
            <Select placeholder="Select zone type">
              <Option value="Receiving">Receiving</Option>
              <Option value="Storage">Storage</Option>
              <Option value="Picking">Picking</Option>
              <Option value="Shipping">Shipping</Option>
              <Option value="Cold Chain">Cold Chain</Option>
              <Option value="Hazardous">Hazardous</Option>
              <Option value="Returns">Returns</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Number of Locations" name="locations">
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter number of locations" />
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default WarehouseHub;
