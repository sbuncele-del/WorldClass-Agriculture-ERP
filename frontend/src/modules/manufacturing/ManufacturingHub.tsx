import React, { useState, useEffect } from 'react';
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
  Tabs,
  List,
  Avatar,
  Typography,
  Steps,
} from 'antd';
import {
  HomeOutlined,
  ToolOutlined,
  ExperimentOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SyncOutlined,
  DownloadOutlined,
  SettingOutlined,
  PartitionOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BugOutlined,
  AlertOutlined,
  ProfileOutlined,
  BuildOutlined,
  HourglassOutlined,
  TrophyOutlined,
  LineChartOutlined,
  BarChartOutlined,
  TeamOutlined,
  FundOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';

const { Title, Text } = Typography;
const { Option } = Select;

const ManufacturingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState(false);
  const [bomModalVisible, setBomModalVisible] = useState(false);
  const [qualityModalVisible, setQualityModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // Manufacturing KPIs
  const [manufacturingStats, setManufacturingStats] = useState({
    activeWorkOrders: 0,
    completedToday: 0,
    pendingQC: 0,
    machineUtilization: 0,
    oee: 0,
    defectRate: 0,
    onTimeDelivery: 0,
    totalBOMs: 0
  });

  // Work Orders
  const [workOrders, setWorkOrders] = useState<Array<{
    id: string;
    product: string;
    sku: string;
    quantity: number;
    completed: number;
    startDate: string;
    dueDate: string;
    status: string;
    priority: string;
    workCenter: string;
    operator: string;
  }>>([]);

  // Bill of Materials
  const [billOfMaterials, setBillOfMaterials] = useState<Array<{
    id: string;
    product: string;
    sku: string;
    version: string;
    components: number;
    cost: number;
    status: string;
    lastUpdated: string;
  }>>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, workOrdersRes, bomRes] = await Promise.all([
          apiClient.get('/api/manufacturing/stats'),
          apiClient.get('/api/manufacturing/work-orders'),
          apiClient.get('/api/manufacturing/bom')
        ]);

        if (statsRes.data) {
          setManufacturingStats(statsRes.data);
        }
        if (workOrdersRes.data) {
          setWorkOrders(Array.isArray(workOrdersRes.data) ? workOrdersRes.data : workOrdersRes.data.data || []);
        }
        if (bomRes.data) {
          setBillOfMaterials(Array.isArray(bomRes.data) ? bomRes.data : bomRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching manufacturing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Work Centers / Machines - load from API, start empty
  const workCenters: Array<{ id: string; name: string; type: string; status: string; utilization: number; currentWO: string; operator: string }> = [];

  // Quality Control records - load from API, start empty
  const qualityRecords: Array<{ id: string; workOrder: string; product: string; batchSize: number; passed: number; failed: number; defectRate: number; status: string; inspector: string }> = [];

  // Production Schedule - load from API, start empty
  const productionSchedule: Array<{ time: string; shift: string; workCenter: string; workOrder: string; product: string; target: number }> = [];

  // Work Order columns
  const workOrderColumns = [
    { title: 'Work Order', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Quantity', key: 'quantity', render: (_: unknown, record: typeof workOrders[0]) => (
      <span>{record.completed} / {record.quantity}</span>
    )},
    { title: 'Progress', key: 'progress', render: (_: unknown, record: typeof workOrders[0]) => {
      const percent = Math.round((record.completed / record.quantity) * 100);
      return <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />;
    }},
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate' },
    { title: 'Work Center', dataIndex: 'workCenter', key: 'workCenter' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (priority: string) => {
      const colors: Record<string, string> = { 'urgent': 'red', 'high': 'orange', 'normal': 'blue' };
      return <Tag color={colors[priority]}>{priority.toUpperCase()}</Tag>;
    }},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'in_progress': { color: 'processing', label: 'In Progress' },
        'scheduled': { color: 'default', label: 'Scheduled' },
        'pending_qc': { color: 'warning', label: 'Pending QC' },
        'completed': { color: 'success', label: 'Completed' },
        'on_hold': { color: 'error', label: 'On Hold' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof workOrders[0]) => (
      <Space>
        {record.status === 'in_progress' && (
          <>
            <Tooltip title="Pause"><Button size="small" icon={<PauseCircleOutlined />} /></Tooltip>
            <Tooltip title="Complete"><Button size="small" type="primary" icon={<CheckCircleOutlined />} /></Tooltip>
          </>
        )}
        {record.status === 'scheduled' && (
          <Tooltip title="Start"><Button size="small" type="primary" icon={<PlayCircleOutlined />} /></Tooltip>
        )}
        {record.status === 'pending_qc' && (
          <Button size="small" type="primary">Start QC</Button>
        )}
        <Button size="small">View</Button>
      </Space>
    )}
  ];

  // BOM columns
  const bomColumns = [
    { title: 'BOM ID', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (sku: string) => <Tag>{sku}</Tag> },
    { title: 'Version', dataIndex: 'version', key: 'version', render: (v: string) => <Tag color="blue">v{v}</Tag> },
    { title: 'Components', dataIndex: 'components', key: 'components' },
    { title: 'Unit Cost', dataIndex: 'cost', key: 'cost', render: (cost: number) => `R ${cost.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={status === 'active' ? 'success' : 'default'}>{status.toUpperCase()}</Tag>
    )},
    { title: 'Last Updated', dataIndex: 'lastUpdated', key: 'lastUpdated' },
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button size="small">View</Button>
        <Button size="small">Edit</Button>
        <Button size="small">Clone</Button>
      </Space>
    )}
  ];

  // Work Center columns
  const workCenterColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Work Center', dataIndex: 'name', key: 'name', render: (name: string) => <strong>{name}</strong> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag>{type}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; icon: React.ReactNode }> = {
        'running': { color: 'success', icon: <PlayCircleOutlined /> },
        'idle': { color: 'default', icon: <PauseCircleOutlined /> },
        'maintenance': { color: 'warning', icon: <ToolOutlined /> },
        'breakdown': { color: 'error', icon: <StopOutlined /> }
      };
      const { color, icon } = config[status] || { color: 'default', icon: null };
      return <Tag color={color} icon={icon}>{status.toUpperCase()}</Tag>;
    }},
    { title: 'Utilization', key: 'utilization', render: (_: unknown, record: typeof workCenters[0]) => (
      <Progress 
        percent={record.utilization} 
        size="small" 
        status={record.utilization === 0 ? 'exception' : record.utilization > 80 ? 'success' : 'normal'}
      />
    )},
    { title: 'Current WO', dataIndex: 'currentWO', key: 'currentWO' },
    { title: 'Operator', dataIndex: 'operator', key: 'operator' },
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof workCenters[0]) => (
      <Space>
        {record.status === 'running' && <Button size="small" danger icon={<StopOutlined />}>Stop</Button>}
        {record.status === 'idle' && <Button size="small" type="primary" icon={<PlayCircleOutlined />}>Start</Button>}
        {record.status === 'maintenance' && <Button size="small" icon={<CheckCircleOutlined />}>Complete</Button>}
        <Button size="small">Details</Button>
      </Space>
    )}
  ];

  // Quality columns
  const qualityColumns = [
    { title: 'QC ID', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'Work Order', dataIndex: 'workOrder', key: 'workOrder' },
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'Batch Size', dataIndex: 'batchSize', key: 'batchSize' },
    { title: 'Passed', dataIndex: 'passed', key: 'passed', render: (v: number) => <Text type="success">{v}</Text> },
    { title: 'Failed', dataIndex: 'failed', key: 'failed', render: (v: number) => v > 0 ? <Text type="danger">{v}</Text> : v },
    { title: 'Defect Rate', dataIndex: 'defectRate', key: 'defectRate', render: (rate: number) => (
      <Tag color={rate > 2 ? 'red' : rate > 1 ? 'orange' : 'green'}>{rate.toFixed(2)}%</Tag>
    )},
    { title: 'Inspector', dataIndex: 'inspector', key: 'inspector' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'pending': { color: 'default', label: 'Pending' },
        'in_progress': { color: 'processing', label: 'In Progress' },
        'completed': { color: 'success', label: 'Completed' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof qualityRecords[0]) => (
      <Space>
        {record.status === 'pending' && <Button size="small" type="primary">Start QC</Button>}
        {record.status === 'in_progress' && <Button size="small" type="primary">Complete</Button>}
        <Button size="small">Report</Button>
      </Space>
    )}
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* OEE and Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overall Equipment Effectiveness"
              value={manufacturingStats.oee}
              suffix="%"
              valueStyle={{ color: manufacturingStats.oee >= 80 ? '#52c41a' : '#faad14' }}
              prefix={<DashboardOutlined />}
            />
            <Progress percent={manufacturingStats.oee} showInfo={false} strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Machine Utilization"
              value={manufacturingStats.machineUtilization}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ToolOutlined />}
            />
            <Progress percent={manufacturingStats.machineUtilization} showInfo={false} strokeColor="#1890ff" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="On-Time Delivery"
              value={manufacturingStats.onTimeDelivery}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<RocketOutlined />}
            />
            <Progress percent={manufacturingStats.onTimeDelivery} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Defect Rate"
              value={manufacturingStats.defectRate}
              suffix="%"
              valueStyle={{ color: manufacturingStats.defectRate <= 2 ? '#52c41a' : '#ff4d4f' }}
              prefix={<BugOutlined />}
            />
            <Progress percent={manufacturingStats.defectRate * 10} showInfo={false} strokeColor={manufacturingStats.defectRate <= 2 ? '#52c41a' : '#ff4d4f'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Work Center Status */}
        <Col xs={24} lg={16}>
          <Card title="Work Center Status" extra={<Button type="link">View All</Button>}>
            <Row gutter={[12, 12]}>
              {workCenters.map(wc => (
                <Col xs={24} sm={12} md={8} key={wc.id}>
                  <Card 
                    size="small"
                    style={{ 
                      borderLeft: `4px solid ${wc.status === 'running' ? '#52c41a' : wc.status === 'maintenance' ? '#faad14' : wc.status === 'breakdown' ? '#ff4d4f' : '#d9d9d9'}`
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Badge 
                        status={wc.status === 'running' ? 'success' : wc.status === 'maintenance' ? 'warning' : wc.status === 'breakdown' ? 'error' : 'default'} 
                        text={<strong>{wc.name}</strong>}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{wc.type}</div>
                    {wc.status === 'running' && (
                      <>
                        <Progress percent={wc.utilization} size="small" />
                        <div style={{ fontSize: 11, color: '#999' }}>{wc.currentWO}</div>
                      </>
                    )}
                    {wc.status === 'maintenance' && (
                      <Tag color="warning" icon={<ToolOutlined />}>Under Maintenance</Tag>
                    )}
                    {wc.status === 'idle' && (
                      <Tag color="default">Idle</Tag>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Quick Actions & Activity */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<PlusOutlined />} block onClick={() => setWorkOrderModalVisible(true)}>
                Create Work Order
              </Button>
              <Button icon={<PartitionOutlined />} block onClick={() => setBomModalVisible(true)}>
                New Bill of Materials
              </Button>
              <Button icon={<SafetyCertificateOutlined />} block onClick={() => setQualityModalVisible(true)}>
                Start QC Inspection
              </Button>
              <Button icon={<ScheduleOutlined />} block>
                View Schedule
              </Button>
            </Space>
          </Card>

          <Card title="Recent Activity">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <>
                      <div><strong>WO-2024-0238</strong> completed</div>
                      <div style={{ fontSize: 12, color: '#999' }}>300 LED Panels • 15 mins ago</div>
                    </>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <div><strong>QC-2024-0457</strong> passed inspection</div>
                      <div style={{ fontSize: 12, color: '#999' }}>99.3% yield • 45 mins ago</div>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <div><strong>SMT Line 1</strong> maintenance started</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Scheduled PM • 1 hour ago</div>
                    </>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <>
                      <div><strong>WO-2024-0234</strong> reached 75%</div>
                      <div style={{ fontSize: 12, color: '#999' }}>380/500 units • 2 hours ago</div>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Work Orders */}
      <Card title="Active Work Orders" style={{ marginTop: 24 }} extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setWorkOrderModalVisible(true)}>New Work Order</Button>}>
        <Table 
          dataSource={workOrders.filter(wo => wo.status !== 'completed')} 
          columns={workOrderColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Work Orders
  const renderWorkOrders = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Active" value={workOrders.filter(w => w.status === 'in_progress').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Scheduled" value={workOrders.filter(w => w.status === 'scheduled').length} valueStyle={{ color: '#666' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Pending QC" value={workOrders.filter(w => w.status === 'pending_qc').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Completed Today" value={manufacturingStats.completedToday} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="All Work Orders"
        extra={
          <Space>
            <Input.Search placeholder="Search work orders..." style={{ width: 250 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setWorkOrderModalVisible(true)}>
              Create Work Order
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={workOrders} 
          columns={workOrderColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render BOM
  const renderBOM = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Bill of Materials"
        extra={
          <Space>
            <Input.Search placeholder="Search BOM..." style={{ width: 250 }} />
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setBomModalVisible(true)}>
              Create BOM
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={billOfMaterials} 
          columns={bomColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" style={{ margin: 0 }}>
                <Title level={5}>Components for {record.product}</Title>
                <Table
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Component', dataIndex: 'name', key: 'name' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                    { title: 'Qty per Unit', dataIndex: 'qty', key: 'qty' },
                    { title: 'Unit Cost', dataIndex: 'cost', key: 'cost', render: (c: number) => `R ${c.toFixed(2)}` },
                    { title: 'Total', dataIndex: 'total', key: 'total', render: (t: number) => `R ${t.toFixed(2)}` }
                  ]}
                  dataSource={[
                    { key: 1, name: 'PCB Board', sku: 'PCB-001', qty: 1, cost: 25.00, total: 25.00 },
                    { key: 2, name: 'Capacitor 100μF', sku: 'CAP-100', qty: 8, cost: 0.50, total: 4.00 },
                    { key: 3, name: 'Resistor 10kΩ', sku: 'RES-10K', qty: 12, cost: 0.10, total: 1.20 },
                    { key: 4, name: 'IC Controller', sku: 'IC-CTRL', qty: 2, cost: 15.00, total: 30.00 },
                    { key: 5, name: 'Connector 8-pin', sku: 'CON-8P', qty: 3, cost: 2.50, total: 7.50 }
                  ]}
                />
              </Card>
            )
          }}
        />
      </Card>
    </div>
  );

  // Render Production Schedule
  const renderSchedule = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Production Schedule - Today"
        extra={
          <Space>
            <DatePicker defaultValue={undefined} />
            <Button icon={<ScheduleOutlined />}>Plan Week</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add to Schedule</Button>
          </Space>
        }
      >
        <Table
          dataSource={productionSchedule}
          rowKey={(record, index) => `${record.workOrder}-${index}`}
          pagination={false}
          columns={[
            { title: 'Time', dataIndex: 'time', key: 'time' },
            { title: 'Shift', dataIndex: 'shift', key: 'shift', render: (shift: string) => {
              const colors: Record<string, string> = { 'Morning': 'gold', 'Afternoon': 'blue', 'Night': 'purple' };
              return <Tag color={colors[shift]}>{shift}</Tag>;
            }},
            { title: 'Work Center', dataIndex: 'workCenter', key: 'workCenter' },
            { title: 'Work Order', dataIndex: 'workOrder', key: 'workOrder', render: (wo: string) => <a>{wo}</a> },
            { title: 'Product', dataIndex: 'product', key: 'product' },
            { title: 'Target', dataIndex: 'target', key: 'target', render: (t: number) => <strong>{t} units</strong> },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button size="small">Reschedule</Button>
                <Button size="small" danger>Cancel</Button>
              </Space>
            )}
          ]}
        />
      </Card>

      {/* Shift Overview */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card title={<><Tag color="gold">Morning Shift</Tag> 06:00 - 14:00</>}>
            <List
              size="small"
              dataSource={productionSchedule.filter(s => s.shift === 'Morning')}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#faad14' }} />}
                    title={item.workOrder}
                    description={`${item.workCenter} • ${item.target} units`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><Tag color="blue">Afternoon Shift</Tag> 14:00 - 22:00</>}>
            <List
              size="small"
              dataSource={productionSchedule.filter(s => s.shift === 'Afternoon')}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={item.workOrder}
                    description={`${item.workCenter} • ${item.target} units`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<><Tag color="purple">Night Shift</Tag> 22:00 - 06:00</>}>
            <List
              size="small"
              dataSource={productionSchedule.filter(s => s.shift === 'Night')}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                    title={item.workOrder}
                    description={`${item.workCenter} • ${item.target} units`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Render Work Centers
  const renderWorkCenters = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Running" 
              value={workCenters.filter(w => w.status === 'running').length} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Idle" 
              value={workCenters.filter(w => w.status === 'idle').length} 
              valueStyle={{ color: '#666' }}
              prefix={<PauseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Maintenance" 
              value={workCenters.filter(w => w.status === 'maintenance').length} 
              valueStyle={{ color: '#faad14' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Avg Utilization" 
              value={Math.round(workCenters.reduce((acc, w) => acc + w.utilization, 0) / workCenters.length)}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Work Centers & Machines"
        extra={
          <Space>
            <Button icon={<SyncOutlined />}>Refresh Status</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Work Center</Button>
          </Space>
        }
      >
        <Table 
          dataSource={workCenters} 
          columns={workCenterColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Quality Control
  const renderQuality = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Pending Inspections" 
              value={qualityRecords.filter(q => q.status === 'pending').length} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="In Progress" 
              value={qualityRecords.filter(q => q.status === 'in_progress').length} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Avg Defect Rate" 
              value={1.2}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="First Pass Yield" 
              value={98.8}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Quality Control Inspections"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>Export Report</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setQualityModalVisible(true)}>
              New Inspection
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={qualityRecords} 
          columns={qualityColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Quality Alerts */}
      <Card title="Quality Alerts" style={{ marginTop: 24 }}>
        <Alert
          message="High Defect Rate Warning"
          description="Controller Unit V3 (WO-2024-0237) showing 2.2% defect rate - above 2% threshold. Review recommended."
          type="warning"
          showIcon
          icon={<AlertOutlined />}
          action={<Button size="small">View Details</Button>}
          style={{ marginBottom: 16 }}
        />
        <Alert
          message="Calibration Due"
          description="Testing Station 1 calibration due in 3 days. Schedule maintenance to avoid production delays."
          type="info"
          showIcon
          action={<Button size="small">Schedule</Button>}
        />
      </Card>
    </div>
  );

  // Render Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Production Settings">
            <Form layout="vertical">
              <Form.Item label="Default Work Order Prefix">
                <Input defaultValue="WO" />
              </Form.Item>
              <Form.Item label="Auto-generate Work Order Numbers">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Default Priority">
                <Select defaultValue="normal">
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Require QC Before Completion">
                <Switch defaultChecked />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Quality Control Settings">
            <Form layout="vertical">
              <Form.Item label="Defect Rate Threshold (%)">
                <InputNumber defaultValue={2} min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Auto-hold on High Defects">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Sampling Method">
                <Select defaultValue="random">
                  <Option value="random">Random Sampling</Option>
                  <Option value="systematic">Systematic Sampling</Option>
                  <Option value="100">100% Inspection</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Default Sample Size (%)">
                <InputNumber defaultValue={10} min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="OEE Targets">
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Availability Target (%)">
                  <InputNumber defaultValue={90} min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Performance Target (%)">
                  <InputNumber defaultValue={95} min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Quality Target (%)">
                  <InputNumber defaultValue={99} min={0} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Alert
              message={`Target OEE: ${(0.90 * 0.95 * 0.99 * 100).toFixed(1)}%`}
              description="OEE = Availability × Performance × Quality"
              type="info"
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <HubLayout>
      <HubHeader
        title="Manufacturing Hub"
        subtitle="Production Planning, Work Orders & Quality Control"
        icon={<BuildOutlined />}
        gradient="purple"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setWorkOrderModalVisible(true)}>
              New Work Order
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="purple"
        icon={<TrophyOutlined />}
        title="Production Overview"
        subtitle="Real-time Metrics"
        stats={[
          { title: 'Active Orders', value: manufacturingStats.activeWorkOrders, span: 4 },
          { title: 'OEE', value: `${manufacturingStats.oee}%`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Machine Util.', value: `${manufacturingStats.machineUtilization}%`, span: 4 },
          { title: 'Defect Rate', value: `${manufacturingStats.defectRate}%`, span: 4 },
          { title: 'On-Time', value: `${manufacturingStats.onTimeDelivery}%`, span: 4 },
        ]}
      />

      <HubTabs 
        theme="purple"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'work-orders', label: 'Work Orders', icon: <ProfileOutlined />, children: renderWorkOrders() },
          { key: 'bom', label: 'Bill of Materials', icon: <PartitionOutlined />, children: renderBOM() },
          { key: 'schedule', label: 'Schedule', icon: <ScheduleOutlined />, children: renderSchedule() },
          { key: 'work-centers', label: 'Work Centers', icon: <ApartmentOutlined />, children: renderWorkCenters() },
          { key: 'quality', label: 'Quality Control', icon: <SafetyCertificateOutlined />, children: renderQuality() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Create Work Order Modal */}
      <Modal
        title="Create Work Order"
        open={workOrderModalVisible}
        onCancel={() => setWorkOrderModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWorkOrderModalVisible(false)}>Cancel</Button>,
          <Button key="draft">Save as Draft</Button>,
          <Button key="create" type="primary" icon={<PlayCircleOutlined />}>Create & Start</Button>
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Product" name="product" rules={[{ required: true }]}>
                <Select placeholder="Select product">
                  {billOfMaterials.map(bom => (
                    <Option key={bom.id} value={bom.product}>{bom.product}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Work Center" name="workCenter" rules={[{ required: true }]}>
                <Select placeholder="Select work center">
                  {workCenters.map(wc => (
                    <Option key={wc.id} value={wc.name}>{wc.name} ({wc.type})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
                <Select placeholder="Select priority">
                  <Option value="urgent">Urgent</Option>
                  <Option value="high">High</Option>
                  <Option value="normal">Normal</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Start Date" name="startDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Due Date" name="dueDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create BOM Modal */}
      <Modal
        title="Create Bill of Materials"
        open={bomModalVisible}
        onCancel={() => setBomModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBomModalVisible(false)}>Cancel</Button>,
          <Button key="draft">Save as Draft</Button>,
          <Button key="create" type="primary">Create BOM</Button>
        ]}
        width={800}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Product Name" name="product" rules={[{ required: true }]}>
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                <Input placeholder="SKU-XXX" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Version" name="version">
                <Input placeholder="1.0" defaultValue="1.0" />
              </Form.Item>
            </Col>
          </Row>
          <Divider>Components</Divider>
          <Alert
            message="Add components to this BOM"
            description="Click 'Add Component' to include raw materials and sub-assemblies"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button type="dashed" icon={<PlusOutlined />} style={{ width: '100%' }}>
            Add Component
          </Button>
        </Form>
      </Modal>

      {/* Quality Inspection Modal */}
      <Modal
        title="Start Quality Inspection"
        open={qualityModalVisible}
        onCancel={() => setQualityModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setQualityModalVisible(false)}>Cancel</Button>,
          <Button key="create" type="primary" icon={<SafetyCertificateOutlined />}>Start Inspection</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Work Order" name="workOrder" rules={[{ required: true }]}>
            <Select placeholder="Select work order">
              {workOrders.filter(wo => wo.status === 'pending_qc' || wo.status === 'in_progress').map(wo => (
                <Option key={wo.id} value={wo.id}>{wo.id} - {wo.product}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Batch Size" name="batchSize" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Units to inspect" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Inspector" name="inspector" rules={[{ required: true }]}>
                <Select placeholder="Select inspector">
                  <Option value="john">John Q.</Option>
                  <Option value="sarah">Sarah M.</Option>
                  <Option value="mike">Mike R.</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Inspection Type" name="type">
            <Select defaultValue="standard">
              <Option value="standard">Standard Inspection</Option>
              <Option value="detailed">Detailed Inspection</Option>
              <Option value="final">Final QC</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default ManufacturingHub;
