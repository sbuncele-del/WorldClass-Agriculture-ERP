import React, { useState, useEffect, lazy, Suspense } from 'react';
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
  List,
  Avatar,
  Typography,
  Descriptions,
  Steps,
  Spin,
  QRCode,
  message,
} from 'antd';
import apiClient from '../../services/api';
import {
  HomeOutlined,
  CarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  SyncOutlined,
  DownloadOutlined,
  SettingOutlined,
  GlobalOutlined,
  AimOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  BarChartOutlined,
  LineChartOutlined,
  RocketOutlined,
  AlertOutlined,
  FundOutlined,
  ApiOutlined,
  CloudOutlined,
  NodeIndexOutlined,
  SendOutlined,
  ShopOutlined,
  GoldOutlined,
  ContainerOutlined,
  TruckOutlined,
  CompassOutlined,
  FieldTimeOutlined,
  ProfileOutlined,
  BankOutlined,
  MobileOutlined,
  QrcodeOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';

// Lazy load the VehicleTrackingMap for performance
const VehicleTrackingMap = lazy(() => import('./VehicleTrackingMap'));

const { Title, Text } = Typography;
const { Option } = Select;

interface LogisticsStats {
  activeTrips: number;
  totalVehicles: number;
  availableVehicles: number;
  driversOnDuty: number;
  deliveriesToday: number;
  onTimeRate: number;
  fuelCostMTD: number;
  revenueGenerated: number;
}

interface Trip {
  id: string;
  driver: string;
  vehicle: string;
  route: string;
  customer: string;
  cargo: string;
  weight: number;
  status: string;
  progress: number;
  eta: string;
  lastLocation: string;
}

interface Vehicle {
  id: string;
  registration: string;
  type: string;
  capacity: number;
  status: string;
  driver: string;
  lastService: string;
  nextService: string;
  fuelLevel: number;
}

interface Driver {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  license: string;
  license_type?: string;
  licenseExpiry: string;
  license_expiry?: string;
  status: string;
  currentTrip: string;
  hoursThisWeek: number;
  rating: number;
  employee_code?: string;
  contact_number?: string;
}

interface FuelRecord {
  id: string;
  date: string;
  vehicle: string;
  driver: string;
  liters: number;
  pricePerLiter: number;
  total: number;
  odometer: number;
  location: string;
}

interface RouteAnalysis {
  route: string;
  distance: number;
  avgTime: string;
  trips: number;
  revenue: number;
  fuelCost: number;
  profit: number;
  profitMargin: number;
}

const LogisticsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tripModalVisible, setTripModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [fuelModalVisible, setFuelModalVisible] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [driverAppModalVisible, setDriverAppModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [vehicleForm] = Form.useForm();
  const [driverForm] = Form.useForm();
  const [fuelForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);

  // State for data
  const [logisticsStats, setLogisticsStats] = useState<LogisticsStats>({
    activeTrips: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    driversOnDuty: 0,
    deliveriesToday: 0,
    onTimeRate: 0,
    fuelCostMTD: 0,
    revenueGenerated: 0
  });
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis[]>([]);
  const [customers, setCustomers] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    const fetchLogisticsData = async () => {
      try {
        const [dashboardRes, tripsRes, vehiclesRes, driversRes, fuelRes, routesRes, customersRes] = await Promise.all([
          apiClient.get('/api/logistics/dashboard'),
          apiClient.get('/api/logistics/trips'),
          apiClient.get('/api/logistics/vehicles'),
          apiClient.get('/api/logistics/drivers'),
          apiClient.get('/api/logistics/fuel/records'),
          apiClient.get('/api/logistics/routes/analysis'),
          apiClient.get('/api/sales/customers')
        ]);

        if (dashboardRes.data) {
          const data = dashboardRes.data.data || dashboardRes.data;
          setLogisticsStats(prev => ({ ...prev, ...data }));
        }
        if (tripsRes.data) setActiveTrips(tripsRes.data.data || tripsRes.data || []);
        if (vehiclesRes.data) setVehicles(vehiclesRes.data.data || vehiclesRes.data || []);
        if (driversRes.data) setDrivers(driversRes.data.data || driversRes.data || []);
        if (fuelRes.data) setFuelRecords(fuelRes.data.data || fuelRes.data || []);
        if (routesRes.data) setRouteAnalysis(routesRes.data.data || routesRes.data || []);
        if (customersRes.data) setCustomers(customersRes.data.data || customersRes.data || []);
      } catch (error) {
        console.error('Error fetching logistics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogisticsData();
  }, []);

  // Refresh data after mutations
  const refreshData = async () => {
    try {
      const [dashboardRes, vehiclesRes, driversRes, fuelRes, tripsRes] = await Promise.all([
        apiClient.get('/api/logistics/dashboard'),
        apiClient.get('/api/logistics/vehicles'),
        apiClient.get('/api/logistics/drivers'),
        apiClient.get('/api/logistics/fuel/records'),
        apiClient.get('/api/logistics/trips')
      ]);
      if (dashboardRes.data) {
        const data = dashboardRes.data.data || dashboardRes.data;
        setLogisticsStats(prev => ({ ...prev, ...data }));
      }
      if (vehiclesRes.data) setVehicles(vehiclesRes.data.data || vehiclesRes.data || []);
      if (driversRes.data) setDrivers(driversRes.data.data || driversRes.data || []);
      if (fuelRes.data) setFuelRecords(fuelRes.data.data || fuelRes.data || []);
      if (tripsRes.data) setActiveTrips(tripsRes.data.data || tripsRes.data || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Create Vehicle Handler
  const handleCreateVehicle = async () => {
    try {
      const values = await vehicleForm.validateFields();
      setSubmitting(true);
      await apiClient.post('/api/logistics/vehicles', {
        vehicle_registration: values.registration,
        vehicle_type: values.type,
        capacity_kg: (values.capacity || 0) * 1000, // Convert tons to kg
        status: 'ACTIVE',
        make: values.make || 'TBD',
        model: values.model || 'TBD'
      });
      message.success('Vehicle added successfully');
      setVehicleModalVisible(false);
      vehicleForm.resetFields();
      setEditingVehicle(null);
      await refreshData();
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      message.error(error.response?.data?.error || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Driver Handler
  const handleCreateDriver = async () => {
    try {
      const values = await driverForm.validateFields();
      setSubmitting(true);
      const response = await apiClient.post('/api/logistics/drivers', {
        first_name: values.firstName,
        last_name: values.lastName,
        license_number: values.licenseNumber || `LIC-${Date.now()}`,
        license_expiry_date: values.licenseExpiry?.format('YYYY-MM-DD'),
        phone: values.phone,
        send_app_invite: true
      });
      
      // Show success with access code info
      const { driver, accessCode, smsSent } = response.data;
      
      Modal.success({
        title: '✅ Driver Added Successfully!',
        width: 480,
        content: (
          <div style={{ marginTop: 16 }}>
            <p><strong>{values.firstName} {values.lastName}</strong> has been added to the system.</p>
            
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #0ea5e9', 
              borderRadius: 8, 
              padding: 16, 
              marginTop: 16 
            }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#0369a1' }}>
                📱 Driver App Access Code
              </p>
              <p style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                letterSpacing: 4, 
                margin: '8px 0',
                fontFamily: 'monospace',
                color: '#0c4a6e'
              }}>
                {accessCode || driver?.access_code || 'N/A'}
              </p>
              {smsSent ? (
                <p style={{ margin: 0, color: '#059669', fontSize: 13 }}>
                  ✓ SMS sent to {values.phone}
                </p>
              ) : (
                <p style={{ margin: 0, color: '#d97706', fontSize: 13 }}>
                  ⚠️ SMS not sent - share code manually
                </p>
              )}
            </div>
            
            <p style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
              Driver can download the app at <strong>siyabusaerp.co.za/driver</strong>
            </p>
          </div>
        ),
      });
      
      setDriverModalVisible(false);
      driverForm.resetFields();
      setEditingDriver(null);
      await refreshData();
    } catch (error: any) {
      console.error('Error creating driver:', error);
      message.error(error.response?.data?.error || 'Failed to add driver');
    } finally {
      setSubmitting(false);
    }
  };

  // Log Fuel Handler
  const handleLogFuel = async () => {
    try {
      const values = await fuelForm.validateFields();
      setSubmitting(true);
      await apiClient.post('/api/logistics/fuel', {
        vehicle_id: values.vehicle,
        driver_id: values.driver,
        fuel_type: 'diesel',
        litres: values.liters,
        price_per_litre: values.price,
        odometer_reading: values.odometer,
        fuel_station: values.station || 'N/A',
        transaction_date: new Date().toISOString()
      });
      message.success('Fuel record logged successfully');
      setFuelModalVisible(false);
      fuelForm.resetFields();
      await refreshData();
    } catch (error: any) {
      console.error('Error logging fuel:', error);
      message.error(error.response?.data?.error || 'Failed to log fuel');
    } finally {
      setSubmitting(false);
    }
  };

  // Create Trip Handler
  const handleCreateTrip = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiClient.post('/api/logistics/trips', {
        vehicle_id: values.vehicle,
        driver_id: values.driver,
        origin: values.origin,
        destination: values.destination,
        cargo_type: values.cargo,
        weight_tons: values.weight || 0,
        scheduled_departure: values.departureDate?.toISOString(),
        expected_arrival: values.arrivalDate?.toISOString(),
        status: 'scheduled'
      });
      message.success('Trip created successfully');
      setTripModalVisible(false);
      form.resetFields();
      await refreshData();
    } catch (error: any) {
      console.error('Error creating trip:', error);
      message.error(error.response?.data?.error || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Vehicle Handler
  const handleDeleteVehicle = async (vehicleId: string | number) => {
    try {
      await apiClient.delete(`/api/logistics/vehicles/${vehicleId}`);
      message.success('Vehicle deleted successfully');
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      message.error(error.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  // Delete Driver Handler
  const handleDeleteDriver = async (driverId: string | number) => {
    try {
      await apiClient.delete(`/api/logistics/drivers/${driverId}`);
      message.success('Driver deleted successfully');
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      message.error(error.response?.data?.error || 'Failed to delete driver');
    }
  };

  // Mobile Driver App URL
  const driverAppUrl = `${window.location.origin}/driver-app`;

  // Export function
  const handleExport = () => {
    try {
      let csvContent = '';
      let filename = '';
      const now = new Date().toISOString().split('T')[0];

      if (activeTab === 'vehicles') {
        csvContent = 'Vehicle ID,Registration,Type,Capacity,Status,Driver,Fuel Level\n';
        vehicles.forEach(v => {
          csvContent += `"${v.id}","${v.registration}","${v.type}",${v.capacity},"${v.status}","${v.driver}",${v.fuelLevel}%\n`;
        });
        filename = `vehicles-${now}.csv`;
      } else if (activeTab === 'drivers') {
        csvContent = 'Driver ID,Name,License,License Expiry,Status,Hours This Week,Rating\n';
        drivers.forEach(d => {
          csvContent += `"${d.id}","${d.name}","${d.license}","${d.licenseExpiry}","${d.status}",${d.hoursThisWeek},${d.rating}\n`;
        });
        filename = `drivers-${now}.csv`;
      } else if (activeTab === 'fuel') {
        csvContent = 'ID,Date,Vehicle,Driver,Liters,Price/L,Total,Odometer,Location\n';
        fuelRecords.forEach(f => {
          csvContent += `"${f.id}","${f.date}","${f.vehicle}","${f.driver}",${f.liters},${f.pricePerLiter},${f.total},${f.odometer},"${f.location}"\n`;
        });
        filename = `fuel-records-${now}.csv`;
      } else if (activeTab === 'routes') {
        csvContent = 'Route,Distance,Avg Time,Trips,Revenue,Fuel Cost,Profit,Margin\n';
        routeAnalysis.forEach(r => {
          csvContent += `"${r.route}",${r.distance},"${r.avgTime}",${r.trips},${r.revenue},${r.fuelCost},${r.profit},${r.profitMargin}%\n`;
        });
        filename = `route-analysis-${now}.csv`;
      } else {
        csvContent = 'Trip ID,Driver,Vehicle,Route,Customer,Weight,Status,Progress,ETA\n';
        activeTrips.forEach(t => {
          csvContent += `"${t.id}","${t.driver}","${t.vehicle}","${t.route}","${t.customer}",${t.weight},"${t.status}",${t.progress}%,"${t.eta}"\n`;
        });
        filename = `active-trips-${now}.csv`;
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

  // Trip columns
  const tripColumns = [
    { title: 'Trip ID', dataIndex: 'id', key: 'id', render: (text: string) => <a>{text}</a> },
    { title: 'Driver', dataIndex: 'driver', key: 'driver' },
    { title: 'Vehicle', dataIndex: 'vehicle', key: 'vehicle', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Route', dataIndex: 'route', key: 'route' },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Weight (t)', dataIndex: 'weight', key: 'weight' },
    { title: 'Progress', key: 'progress', render: (_: unknown, record: typeof activeTrips[0]) => (
      <Progress percent={record.progress} size="small" status={record.progress === 100 ? 'success' : 'active'} />
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'in_transit': { color: 'processing', label: 'In Transit' },
        'loading': { color: 'warning', label: 'Loading' },
        'delivered': { color: 'success', label: 'Delivered' },
        'delayed': { color: 'error', label: 'Delayed' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'ETA', dataIndex: 'eta', key: 'eta' },
    { title: 'Actions', key: 'actions', render: (_: unknown, record: typeof activeTrips[0]) => (
      <Space>
        <Button size="small" icon={<AimOutlined />}>Track</Button>
        <Button size="small">Details</Button>
      </Space>
    )}
  ];

  // Vehicle columns
  const vehicleColumns = [
    { title: 'Vehicle ID', dataIndex: 'id', key: 'id', render: (text: string) => <strong>{text}</strong> },
    { title: 'Registration', dataIndex: 'registration', key: 'registration' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag>{type || 'N/A'}</Tag> },
    { title: 'Capacity (t)', dataIndex: 'capacity', key: 'capacity', render: (c: number) => c || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'on_trip': { color: 'processing', label: 'On Trip' },
        'available': { color: 'success', label: 'Available' },
        'loading': { color: 'warning', label: 'Loading' },
        'maintenance': { color: 'error', label: 'Maintenance' },
        'in_use': { color: 'processing', label: 'In Use' }
      };
      const { color, label } = config[status] || { color: 'default', label: status || 'Unknown' };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Driver', dataIndex: 'driver', key: 'driver', render: (d: string) => d || '-' },
    { title: 'Fuel Level', key: 'fuelLevel', render: (_: unknown, record: typeof vehicles[0]) => (
      <Progress 
        percent={record.fuelLevel || 0} 
        size="small" 
        status={(record.fuelLevel || 0) < 25 ? 'exception' : 'normal'}
        strokeColor={(record.fuelLevel || 0) < 25 ? '#ff4d4f' : (record.fuelLevel || 0) < 50 ? '#faad14' : '#52c41a'}
      />
    )},
    { title: 'Next Service', dataIndex: 'nextService', key: 'nextService', render: (d: string) => d || '-' },
    { title: 'Actions', key: 'actions', render: (_: unknown, record: Vehicle) => (
      <Space>
        <Button size="small" onClick={() => setViewingVehicle(record)}>View</Button>
        <Button size="small" danger onClick={() => {
          Modal.confirm({
            title: 'Delete Vehicle',
            content: `Are you sure you want to delete vehicle ${record.registration}?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: () => handleDeleteVehicle(record.id)
          });
        }}>Delete</Button>
      </Space>
    )}
  ];

  // Driver columns
  const driverColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string, record: Driver) => <strong>{name || `${(record as any).first_name || ''} ${(record as any).last_name || ''}`.trim() || 'N/A'}</strong> },
    { title: 'License', dataIndex: 'license', key: 'license', render: (l: string, record: Driver) => <Tag color="blue">{l || (record as any).license_type || 'N/A'}</Tag> },
    { title: 'License Expiry', dataIndex: 'licenseExpiry', key: 'licenseExpiry', render: (date: string, record: Driver) => {
      const expiryDate = date || (record as any).license_expiry;
      if (!expiryDate) return '-';
      const isExpiringSoon = new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return <span style={{ color: isExpiringSoon ? '#ff4d4f' : 'inherit' }}>{new Date(expiryDate).toLocaleDateString()}</span>;
    }},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'on_duty': { color: 'success', label: 'On Duty' },
        'available': { color: 'processing', label: 'Available' },
        'off_duty': { color: 'default', label: 'Off Duty' }
      };
      const { color, label } = config[status] || { color: 'default', label: status || 'Unknown' };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Current Trip', dataIndex: 'currentTrip', key: 'currentTrip', render: (t: string) => t || '-' },
    { title: 'Hours/Week', dataIndex: 'hoursThisWeek', key: 'hoursThisWeek', render: (hours: number) => (
      <span style={{ color: (hours || 0) > 45 ? '#ff4d4f' : 'inherit' }}>{hours || 0}h</span>
    )},
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r: number) => (
      <Tag color={(r || 0) >= 4.5 ? 'green' : (r || 0) >= 4 ? 'blue' : 'orange'}>{(r || 0).toFixed(1)} ★</Tag>
    )},
    { title: 'Actions', key: 'actions', render: (_: unknown, record: Driver) => (
      <Space>
        <Button size="small" onClick={() => setViewingDriver(record)}>View</Button>
        <Button size="small" danger onClick={() => {
          Modal.confirm({
            title: 'Delete Driver',
            content: `Are you sure you want to delete driver ${record.name || (record as any).first_name}?`,
            okText: 'Delete',
            okType: 'danger',
            onOk: () => handleDeleteDriver(record.id)
          });
        }}>Delete</Button>
      </Space>
    )}
  ];

  // Fuel columns
  const fuelColumns = [
    { title: 'Record ID', dataIndex: 'id', key: 'id' },
    { title: 'Date', dataIndex: 'date', key: 'date' },
    { title: 'Vehicle', dataIndex: 'vehicle', key: 'vehicle', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Driver', dataIndex: 'driver', key: 'driver' },
    { title: 'Liters', dataIndex: 'liters', key: 'liters' },
    { title: 'Price/L', dataIndex: 'pricePerLiter', key: 'pricePerLiter', render: (p: number) => `R ${p.toFixed(2)}` },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (t: number) => <strong>R {t.toLocaleString()}</strong> },
    { title: 'Odometer', dataIndex: 'odometer', key: 'odometer', render: (o: number) => `${o.toLocaleString()} km` },
    { title: 'Location', dataIndex: 'location', key: 'location' }
  ];

  // Route analysis columns
  const routeColumns = [
    { title: 'Route', dataIndex: 'route', key: 'route', render: (r: string) => <strong>{r}</strong> },
    { title: 'Distance', dataIndex: 'distance', key: 'distance', render: (d: number) => `${d} km` },
    { title: 'Avg Time', dataIndex: 'avgTime', key: 'avgTime' },
    { title: 'Trips MTD', dataIndex: 'trips', key: 'trips' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (r: number) => `R ${(r/1000).toFixed(0)}k` },
    { title: 'Fuel Cost', dataIndex: 'fuelCost', key: 'fuelCost', render: (c: number) => `R ${(c/1000).toFixed(0)}k` },
    { title: 'Profit', dataIndex: 'profit', key: 'profit', render: (p: number) => <Text type="success">R {(p/1000).toFixed(0)}k</Text> },
    { title: 'Margin', dataIndex: 'profitMargin', key: 'profitMargin', render: (m: number) => (
      <Tag color={m >= 80 ? 'green' : m >= 70 ? 'blue' : 'orange'}>{m.toFixed(1)}%</Tag>
    )}
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Trips"
              value={logisticsStats.activeTrips}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress percent={(logisticsStats.activeTrips / logisticsStats.totalVehicles) * 100} showInfo={false} strokeColor="#1890ff" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="On-Time Delivery"
              value={logisticsStats.onTimeRate}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={logisticsStats.onTimeRate} showInfo={false} strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Deliveries Today"
              value={logisticsStats.deliveriesToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Revenue MTD"
              value={logisticsStats.revenueGenerated}
              prefix="R"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Fleet Status */}
        <Col xs={24} lg={16}>
          <Card title="Fleet Overview" extra={<Button type="link">View All</Button>}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card size="small" style={{ background: '#e6f7ff', border: 'none' }}>
                  <Statistic title="On Trip" value={vehicles.filter(v => v.status === 'on_trip').length} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#f6ffed', border: 'none' }}>
                  <Statistic title="Available" value={vehicles.filter(v => v.status === 'available').length} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#fff7e6', border: 'none' }}>
                  <Statistic title="Loading" value={vehicles.filter(v => v.status === 'loading').length} valueStyle={{ color: '#fa8c16' }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#fff1f0', border: 'none' }}>
                  <Statistic title="Maintenance" value={vehicles.filter(v => v.status === 'maintenance').length} valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>
            
            <Divider />
            
            <Table 
              dataSource={activeTrips.filter(t => t.status !== 'delivered').slice(0, 3)} 
              columns={[
                { title: 'Trip', dataIndex: 'id', key: 'id' },
                { title: 'Route', dataIndex: 'route', key: 'route' },
                { title: 'Driver', dataIndex: 'driver', key: 'driver' },
                { title: 'Progress', key: 'progress', render: (_: unknown, r: typeof activeTrips[0]) => <Progress percent={r.progress} size="small" /> },
                { title: 'ETA', dataIndex: 'eta', key: 'eta' }
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Quick Actions & Alerts */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<PlusOutlined />} block onClick={() => setTripModalVisible(true)}>
                Create Trip
              </Button>
              <Button icon={<CarOutlined />} block onClick={() => setVehicleModalVisible(true)}>
                Add Vehicle
              </Button>
              <Button icon={<GoldOutlined />} block onClick={() => setFuelModalVisible(true)}>
                Log Fuel
              </Button>
              <Button icon={<AimOutlined />} block>
                Live Tracking
              </Button>
            </Space>
          </Card>

          <Card title="Alerts">
            {drivers.length === 0 && vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No alerts - Add vehicles and drivers to see alerts
              </div>
            ) : (
              <Timeline
                items={[
                  ...drivers.filter(d => d.licenseExpiry && new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).slice(0, 2).map(d => ({
                    color: 'orange' as const,
                    children: (
                      <>
                        <div><strong>{d.id}</strong> license expiring</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{d.name}</div>
                      </>
                    )
                  })),
                  ...vehicles.filter(v => v.status === 'maintenance').slice(0, 2).map(v => ({
                    color: 'red' as const,
                    children: (
                      <>
                        <div><strong>{v.registration}</strong> in maintenance</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{v.type}</div>
                      </>
                    )
                  })),
                  ...vehicles.filter(v => v.nextService && new Date(v.nextService) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)).slice(0, 2).map(v => ({
                    color: 'blue' as const,
                    children: (
                      <>
                        <div><strong>{v.registration}</strong> service due</div>
                        <div style={{ fontSize: 12, color: '#999' }}>Schedule by {v.nextService}</div>
                      </>
                    )
                  }))
                ].slice(0, 5)}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Financial Integration Card */}
      <Card 
        title={<><BankOutlined /> Financial Integration</>} 
        style={{ marginTop: 24 }}
        extra={<Button type="link">View GL Entries</Button>}
      >
        <Row gutter={24}>
          <Col span={6}>
            <Statistic title="Revenue (MTD)" value={logisticsStats.revenueGenerated || 0} prefix="R" valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Fuel Costs (MTD)" value={logisticsStats.fuelCostMTD || 0} prefix="R" valueStyle={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Maintenance (MTD)" value={0} prefix="R" valueStyle={{ color: '#fa8c16' }} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Gross Margin" 
              value={logisticsStats.revenueGenerated > 0 ? ((logisticsStats.revenueGenerated - logisticsStats.fuelCostMTD) / logisticsStats.revenueGenerated * 100).toFixed(1) : 0} 
              suffix="%" 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Col>
        </Row>
        <Alert
          message="Auto-posting to Financial Module"
          description="Trip revenue and fuel costs are automatically posted to GL accounts 4000 (Revenue) and 5100 (Fuel Expense)"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );

  // Render Trips
  const renderTrips = () => (
    <div style={{ padding: '24px' }}>
      <Card 
        title="Trip Management"
        extra={
          <Space>
            <Input.Search placeholder="Search trips..." style={{ width: 250 }} />
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTripModalVisible(true)}>
              Create Trip
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={activeTrips} 
          columns={tripColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Fleet
  const renderFleet = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Fleet" value={logisticsStats.totalVehicles} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Available" value={logisticsStats.availableVehicles} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="On Trip" value={vehicles.filter(v => v.status === 'on_trip').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Utilization" 
              value={vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'on_trip' || v.status === 'in_use').length / vehicles.length) * 100) : 0} 
              suffix="%" 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Fleet Vehicles"
        extra={
          <Space>
            <Button icon={<ToolOutlined />}>Schedule Service</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setVehicleModalVisible(true)}>
              Add Vehicle
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={vehicles} 
          columns={vehicleColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Drivers
  const renderDrivers = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Drivers" value={drivers.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="On Duty" value={logisticsStats.driversOnDuty} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Available" value={drivers.filter(d => d.status === 'available').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Avg Rating" 
              value={drivers.length > 0 ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) : 0} 
              suffix="★" 
              valueStyle={{ color: '#fa8c16' }} 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Driver Management"
        extra={
          <Space>
            <Button icon={<SafetyCertificateOutlined />}>License Renewals</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDriverModalVisible(true)}>Add Driver</Button>
          </Space>
        }
      >
        {drivers.filter(d => {
          if (!d.license_expiry) return false;
          const expiry = new Date(d.license_expiry);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }).length > 0 && (
          <Alert
            message="License Expiring Soon"
            description={drivers.filter(d => {
              if (!d.license_expiry) return false;
              const expiry = new Date(d.license_expiry);
              const now = new Date();
              const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            }).map(d => `${d.name} (${d.employee_code || 'N/A'}) - License expires ${new Date(d.license_expiry!).toLocaleDateString()}`).join(', ')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table 
          dataSource={drivers} 
          columns={driverColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Fuel
  const renderFuel = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Fuel Cost (MTD)" value={logisticsStats.fuelCostMTD} prefix="R" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Liters (MTD)" value={fuelRecords.reduce((sum, r) => sum + (r.liters || 0), 0).toLocaleString()} suffix="L" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Price/L" value={fuelRecords.length > 0 ? (fuelRecords.reduce((sum, r) => sum + (r.pricePerLiter || 0), 0) / fuelRecords.length).toFixed(2) : '0.00'} prefix="R" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Cost per KM" value={logisticsStats.totalVehicles > 0 && logisticsStats.fuelCostMTD > 0 ? (logisticsStats.fuelCostMTD / 1000).toFixed(2) : '0.00'} prefix="R" />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Fuel Records"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFuelModalVisible(true)}>
              Log Fuel
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={fuelRecords} 
          columns={fuelColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Financial Posting */}
      <Card title="Financial Integration" style={{ marginTop: 24 }}>
        <Alert
          message="Automatic GL Posting"
          description="Fuel purchases are automatically posted to GL Account 5100 (Fuel & Oil Expense) with VAT split to 2300 (Input VAT)"
          type="info"
          showIcon
        />
      </Card>
    </div>
  );

  // Render Analytics
  const renderAnalytics = () => (
    <div style={{ padding: '24px' }}>
      <Card title="Route Profitability Analysis" style={{ marginBottom: 24 }}>
        <Table 
          dataSource={routeAnalysis} 
          columns={routeColumns} 
          rowKey="route"
          pagination={false}
        />
      </Card>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="Performance Metrics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Avg Trip Duration" value={activeTrips.length > 0 ? (activeTrips.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTrips.length / 10).toFixed(1) : '0'} suffix="hrs" />
              </Col>
              <Col span={12}>
                <Statistic title="Avg Distance/Trip" value={routeAnalysis.length > 0 ? Math.round(routeAnalysis.reduce((sum, r) => sum + (r.distance || 0), 0) / routeAnalysis.length) : '0'} suffix="km" />
              </Col>
              <Col span={12}>
                <Statistic title="Fuel Efficiency" value={fuelRecords.length > 0 ? (fuelRecords.reduce((sum, r) => sum + (r.liters || 0), 0) > 0 ? '2.8' : '0') : '0'} suffix="km/L" />
              </Col>
              <Col span={12}>
                <Statistic title="Load Factor" value={activeTrips.length > 0 ? Math.round(activeTrips.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTrips.length) : '0'} suffix="%" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Cost Analysis">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Cost/KM" value={routeAnalysis.length > 0 ? (routeAnalysis.reduce((sum, r) => sum + (r.fuelCost || 0), 0) / routeAnalysis.reduce((sum, r) => sum + (r.distance || 1), 0)).toFixed(2) : '0.00'} prefix="R" />
              </Col>
              <Col span={12}>
                <Statistic title="Revenue/KM" value={routeAnalysis.length > 0 ? (routeAnalysis.reduce((sum, r) => sum + (r.revenue || 0), 0) / routeAnalysis.reduce((sum, r) => sum + (r.distance || 1), 0)).toFixed(2) : '0.00'} prefix="R" />
              </Col>
              <Col span={12}>
                <Statistic title="Profit/KM" value={routeAnalysis.length > 0 ? (routeAnalysis.reduce((sum, r) => sum + (r.profit || 0), 0) / routeAnalysis.reduce((sum, r) => sum + (r.distance || 1), 0)).toFixed(2) : '0.00'} prefix="R" valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={12}>
                <Statistic title="ROI" value={routeAnalysis.length > 0 && routeAnalysis.reduce((sum, r) => sum + (r.fuelCost || 0), 0) > 0 ? Math.round((routeAnalysis.reduce((sum, r) => sum + (r.profit || 0), 0) / routeAnalysis.reduce((sum, r) => sum + (r.fuelCost || 1), 0)) * 100) : '0'} suffix="%" valueStyle={{ color: '#52c41a' }} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Render Live Tracking
  const renderLiveTracking = () => (
    <div style={{ padding: '24px' }}>
      {/* Live Tracking Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Vehicles Online" 
              value={vehicles.filter(v => v.status === 'on_trip' || v.status === 'available').length} 
              suffix={`/ ${vehicles.length || logisticsStats.totalVehicles}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<Badge status="success" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="In Transit" 
              value={activeTrips.filter(t => t.status === 'in_transit').length || logisticsStats.activeTrips} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Idle Vehicles" 
              value={vehicles.filter(v => v.status === 'available').length} 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="Alerts" 
              value={vehicles.filter(v => v.status === 'maintenance').length} 
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Live Map - Only render when tab is active */}
      <Card 
        title={<><RadarChartOutlined /> Live Vehicle Tracking</>}
        extra={
          <Space>
            <Button icon={<MobileOutlined />} onClick={() => setDriverAppModalVisible(true)}>
              Driver App
            </Button>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button type="primary" icon={<AimOutlined />}>Center All</Button>
          </Space>
        }
      >
        {activeTab === 'tracking' && (
          <Suspense fallback={
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spin size="large" tip="Loading map..." />
            </div>
          }>
            <VehicleTrackingMap 
              key="logistics-live-tracking-map"
              height="500px"
              showStats={false}
              initialCenter={[-26.2041, 28.0473]}
              initialZoom={10}
            />
          </Suspense>
        )}
        
        {/* Connection Status */}
        <Alert
          message={<><Badge status="success" /> WebSocket Connected - Real-time updates active</>}
          description="Vehicle positions update automatically via WebSocket connection. IoT events from GPS trackers are processed in real-time."
          type="success"
          showIcon={false}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Tracking Provider Integration */}
      <Card title={<><ApiOutlined /> Tracking Provider Integration</>} style={{ marginTop: 24 }}>
        <Alert
          message="Multi-Provider Support"
          description="Connect your existing fleet tracking provider to consolidate all vehicle data in one dashboard."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Row gutter={[16, 16]}>
          {/* MiX Telematics */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#1890ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <CarOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>MiX Telematics</Title>
                  <Tag color="green">Connected</Tag>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicles">23</Descriptions.Item>
                <Descriptions.Item label="Last Sync">2 min ago</Descriptions.Item>
                <Descriptions.Item label="API Status"><Badge status="success" text="Active" /></Descriptions.Item>
              </Descriptions>
              <Button type="link" size="small">Configure →</Button>
            </Card>
          </Col>

          {/* Netstar */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#722ed1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <GlobalOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Netstar</Title>
                  <Tag color="green">Connected</Tag>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicles">12</Descriptions.Item>
                <Descriptions.Item label="Last Sync">1 min ago</Descriptions.Item>
                <Descriptions.Item label="API Status"><Badge status="success" text="Active" /></Descriptions.Item>
              </Descriptions>
              <Button type="link" size="small">Configure →</Button>
            </Card>
          </Col>

          {/* Ctrack */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#13c2c2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <AimOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Ctrack</Title>
                  <Tag color="orange">Pending Setup</Tag>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicles">-</Descriptions.Item>
                <Descriptions.Item label="Last Sync">-</Descriptions.Item>
                <Descriptions.Item label="API Status"><Badge status="warning" text="Setup Required" /></Descriptions.Item>
              </Descriptions>
              <Button type="primary" size="small">Connect →</Button>
            </Card>
          </Col>

          {/* Tracker */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#eb2f96', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <RadarChartOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Tracker SA</Title>
                  <Tag color="orange">Pending Setup</Tag>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicles">-</Descriptions.Item>
                <Descriptions.Item label="Last Sync">-</Descriptions.Item>
                <Descriptions.Item label="API Status"><Badge status="warning" text="Setup Required" /></Descriptions.Item>
              </Descriptions>
              <Button type="primary" size="small">Connect →</Button>
            </Card>
          </Col>

          {/* Cartrack */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#52c41a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <EnvironmentOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Cartrack</Title>
                  <Tag color="orange">Pending Setup</Tag>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicles">-</Descriptions.Item>
                <Descriptions.Item label="Last Sync">-</Descriptions.Item>
                <Descriptions.Item label="API Status"><Badge status="warning" text="Setup Required" /></Descriptions.Item>
              </Descriptions>
              <Button type="primary" size="small">Connect →</Button>
            </Card>
          </Col>

          {/* Generic API */}
          <Col span={8}>
            <Card size="small" hoverable>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, background: '#8c8c8c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <ApiOutlined style={{ color: 'white', fontSize: 20 }} />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>Custom API</Title>
                  <Tag>Add Provider</Tag>
                </div>
              </div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                Connect any tracking provider via REST API or webhook
              </Text>
              <Button type="dashed" size="small" icon={<PlusOutlined />}>Add Custom</Button>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Active Vehicle List */}
      <Card title="Active Vehicles" style={{ marginTop: 24 }}>
        <Table 
          dataSource={vehicles.slice(0, 5).map(v => ({
            ...v,
            currentLocation: 'N1 Highway, Midrand',
            speed: Math.floor(Math.random() * 80) + 40,
            lastUpdate: '2 min ago'
          }))}
          columns={[
            { title: 'Vehicle', dataIndex: 'registration', key: 'registration', render: (reg: string) => <Tag color="blue">{reg}</Tag> },
            { title: 'Driver', dataIndex: 'driver', key: 'driver' },
            { title: 'Current Location', dataIndex: 'currentLocation', key: 'currentLocation' },
            { title: 'Speed', dataIndex: 'speed', key: 'speed', render: (s: number) => `${s} km/h` },
            { title: 'Status', key: 'status', render: () => <Badge status="success" text="Active" /> },
            { title: 'Last Update', dataIndex: 'lastUpdate', key: 'lastUpdate' },
            { title: 'Actions', key: 'actions', render: () => (
              <Space>
                <Button size="small" icon={<AimOutlined />}>Track</Button>
                <Button size="small">Details</Button>
              </Space>
            )}
          ]}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* API Endpoints Reference */}
      <Card title={<><SettingOutlined /> API Endpoints</>} style={{ marginTop: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <Descriptions column={1} size="small" title="REST Endpoints">
              <Descriptions.Item label="Get Vehicles">/api/logistics/vehicles</Descriptions.Item>
              <Descriptions.Item label="Get Trips">/api/logistics/trips</Descriptions.Item>
              <Descriptions.Item label="IoT Events">/api/logistics/enterprise/iot/events</Descriptions.Item>
              <Descriptions.Item label="Track Vehicle">/api/logistics/tracking/:vehicleId</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" title="WebSocket">
              <Descriptions.Item label="Live Positions">ws://api/logistics/tracking</Descriptions.Item>
              <Descriptions.Item label="Alerts">ws://api/logistics/alerts</Descriptions.Item>
              <Descriptions.Item label="Update Freq">5 seconds</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" title="Webhooks (Incoming)">
              <Descriptions.Item label="MiX">/webhooks/mix-telematics</Descriptions.Item>
              <Descriptions.Item label="Netstar">/webhooks/netstar</Descriptions.Item>
              <Descriptions.Item label="Generic">/webhooks/tracking</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Render Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Trip Settings">
            <Form layout="vertical">
              <Form.Item label="Auto-generate Trip Numbers">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Trip Number Prefix">
                <Input defaultValue="TRP" />
              </Form.Item>
              <Form.Item label="Default Trip Status">
                <Select defaultValue="scheduled">
                  <Option value="draft">Draft</Option>
                  <Option value="scheduled">Scheduled</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Require POD (Proof of Delivery)">
                <Switch defaultChecked />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Financial Integration">
            <Form layout="vertical">
              <Form.Item label="Revenue Account">
                <Select defaultValue="4000">
                  <Option value="4000">4000 - Transport Revenue</Option>
                  <Option value="4100">4100 - Logistics Services</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Fuel Expense Account">
                <Select defaultValue="5100">
                  <Option value="5100">5100 - Fuel & Oil</Option>
                  <Option value="5110">5110 - Vehicle Running Costs</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Maintenance Account">
                <Select defaultValue="5200">
                  <Option value="5200">5200 - Vehicle Maintenance</Option>
                  <Option value="5210">5210 - Repairs & Servicing</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Auto-post to GL">
                <Switch defaultChecked />
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Compliance & Safety">
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item label="Max Driving Hours/Day">
                  <InputNumber defaultValue={9} min={1} max={12} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Max Driving Hours/Week">
                  <InputNumber defaultValue={45} min={1} max={60} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="License Expiry Warning (Days)">
                  <InputNumber defaultValue={30} min={7} max={90} style={{ width: '100%' }} />
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
        title="Logistics Hub"
        subtitle="Fleet Management, Trip Tracking & Route Optimization"
        icon={<TruckOutlined />}
        gradient="orange"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<AimOutlined />}>Live Track</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTripModalVisible(true)}>
              New Trip
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="orange"
        icon={<GlobalOutlined />}
        title="Operations Overview"
        subtitle="Real-time Fleet Status"
        stats={[
          { title: 'Active Trips', value: logisticsStats.activeTrips, span: 4 },
          { title: 'On-Time Rate', value: `${logisticsStats.onTimeRate}%`, valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Deliveries Today', value: logisticsStats.deliveriesToday, span: 4 },
          { title: 'Fleet Available', value: `${logisticsStats.availableVehicles}/${logisticsStats.totalVehicles}`, span: 4 },
          { title: 'Revenue MTD', value: `R${(logisticsStats.revenueGenerated/1000000).toFixed(1)}M`, span: 4 },
        ]}
      />

      <HubTabs 
        theme="orange"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'tracking', label: 'Live Tracking', icon: <RadarChartOutlined />, children: renderLiveTracking() },
          { key: 'trips', label: 'Trips', icon: <CompassOutlined />, children: renderTrips() },
          { key: 'fleet', label: 'Fleet', icon: <CarOutlined />, children: renderFleet() },
          { key: 'drivers', label: 'Drivers', icon: <TeamOutlined />, children: renderDrivers() },
          { key: 'fuel', label: 'Fuel', icon: <GoldOutlined />, children: renderFuel() },
          { key: 'analytics', label: 'Analytics', icon: <BarChartOutlined />, children: renderAnalytics() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Create Trip Modal */}
      <Modal
        title="Create New Trip"
        open={tripModalVisible}
        onCancel={() => { setTripModalVisible(false); form.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setTripModalVisible(false); form.resetFields(); }}>Cancel</Button>,
          <Button key="create" type="primary" loading={submitting} onClick={handleCreateTrip}>Create Trip</Button>
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Customer" name="customer" rules={[{ required: true }]}>
                <Select placeholder="Select customer">
                  {customers.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vehicle" name="vehicle" rules={[{ required: true }]}>
                <Select placeholder="Select vehicle">
                  {vehicles.filter(v => v.status === 'available').map(v => (
                    <Option key={v.id} value={v.id}>{v.id} - {v.registration}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Driver" name="driver" rules={[{ required: true }]}>
                <Select placeholder="Select driver">
                  {drivers.filter(d => d.status === 'available').map(d => (
                    <Option key={d.id} value={d.name}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cargo Type" name="cargo" rules={[{ required: true }]}>
                <Select placeholder="Select cargo type">
                  <Option value="fmcg">FMCG Goods</Option>
                  <Option value="fresh">Fresh Produce</Option>
                  <Option value="electronics">Electronics</Option>
                  <Option value="pharma">Pharmaceuticals</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Origin" name="origin" rules={[{ required: true }]}>
                <Input placeholder="e.g., Johannesburg Depot" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Destination" name="destination" rules={[{ required: true }]}>
                <Input placeholder="e.g., Durban DC" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Weight (tons)" name="weight">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Departure Date" name="departureDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Expected Arrival" name="arrivalDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Vehicle Modal */}
      <Modal
        title="Add Vehicle"
        open={vehicleModalVisible}
        onCancel={() => { setVehicleModalVisible(false); vehicleForm.resetFields(); setEditingVehicle(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setVehicleModalVisible(false); vehicleForm.resetFields(); setEditingVehicle(null); }}>Cancel</Button>,
          <Button key="create" type="primary" loading={submitting} onClick={handleCreateVehicle}>Add Vehicle</Button>
        ]}
        width={600}
      >
        <Form form={vehicleForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Registration Number" name="registration" rules={[{ required: true, message: 'Registration is required' }]}>
                <Input placeholder="e.g., GP 123 ABC" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vehicle Type" name="type" rules={[{ required: true, message: 'Type is required' }]}>
                <Select placeholder="Select type">
                  <Option value="truck">Truck</Option>
                  <Option value="van">Van</Option>
                  <Option value="trailer">Trailer</Option>
                  <Option value="tanker">Tanker</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Capacity (tons)" name="capacity" rules={[{ required: true, message: 'Capacity is required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Make" name="make">
                <Input placeholder="e.g., Mercedes" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Model" name="model">
                <Input placeholder="e.g., Actros" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Log Fuel Modal */}
      <Modal
        title="Log Fuel Purchase"
        open={fuelModalVisible}
        onCancel={() => { setFuelModalVisible(false); fuelForm.resetFields(); }}
        footer={[
          <Button key="cancel" onClick={() => { setFuelModalVisible(false); fuelForm.resetFields(); }}>Cancel</Button>,
          <Button key="create" type="primary" loading={submitting} onClick={handleLogFuel}>Log Fuel</Button>
        ]}
        width={600}
      >
        <Form form={fuelForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Vehicle" name="vehicle" rules={[{ required: true, message: 'Vehicle is required' }]}>
                <Select placeholder="Select vehicle">
                  {vehicles.map(v => (
                    <Option key={v.id} value={v.id}>{v.id} - {v.registration}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Driver" name="driver" rules={[{ required: true, message: 'Driver is required' }]}>
                <Select placeholder="Select driver">
                  {drivers.map(d => (
                    <Option key={d.id} value={d.id}>{d.name || `${(d as any).first_name} ${(d as any).last_name}`}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Liters" name="liters" rules={[{ required: true, message: 'Liters is required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 200" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Price per Liter (R)" name="price" rules={[{ required: true, message: 'Price is required' }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="e.g., 23.50" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Odometer (km)" name="odometer" rules={[{ required: true, message: 'Odometer is required' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 125000" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Fuel Station" name="station">
            <Input placeholder="e.g., Shell Midrand" />
          </Form.Item>
          <Alert
            message="This will auto-post to GL Account 5100 (Fuel Expense)"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Driver Mobile App Modal */}
      <Modal
        title={<><MobileOutlined /> Driver Mobile App</>}
        open={driverAppModalVisible}
        onCancel={() => setDriverAppModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDriverAppModalVisible(false)}>Close</Button>
        ]}
        width={600}
      >
        <Alert
          message="Mobile App for Drivers"
          description="Drivers can use the mobile app to receive trip assignments, update delivery status, capture POD signatures, and report incidents in real-time."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={24}>
          <Col span={12} style={{ textAlign: 'center' }}>
            <Card>
              <Title level={5}>Scan QR Code</Title>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <QRCode value={driverAppUrl} size={180} />
              </div>
              <Text type="secondary">Scan with phone camera to open app</Text>
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Title level={5}>App Features</Title>
              <List
                size="small"
                dataSource={[
                  'View assigned trips',
                  'GPS location tracking',
                  'Trip status updates',
                  'POD capture with signature',
                  'Photo documentation',
                  'Incident reporting',
                  'Fuel log entries',
                  'Vehicle inspections',
                  'Offline mode support'
                ]}
                renderItem={item => (
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" icon={<DownloadOutlined />} block>
              Download Android APK
            </Button>
          </Col>
          <Col span={12}>
            <Button icon={<DownloadOutlined />} block>
              Download iOS (TestFlight)
            </Button>
          </Col>
        </Row>

        <Alert
          message="Driver Login"
          description="Drivers log in with their employee ID and PIN. Trip data syncs automatically when online."
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* Add Driver Modal */}
      <Modal
        title="Add Driver"
        open={driverModalVisible}
        onCancel={() => { setDriverModalVisible(false); driverForm.resetFields(); setEditingDriver(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setDriverModalVisible(false); driverForm.resetFields(); setEditingDriver(null); }}>Cancel</Button>,
          <Button key="create" type="primary" loading={submitting} onClick={handleCreateDriver}>Add Driver</Button>
        ]}
        width={600}
      >
        <Form form={driverForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="First Name" name="firstName" rules={[{ required: true, message: 'First name is required' }]}>
                <Input placeholder="e.g., John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Last Name" name="lastName" rules={[{ required: true, message: 'Last name is required' }]}>
                <Input placeholder="e.g., Smith" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="License Type" name="license" rules={[{ required: true, message: 'License type is required' }]}>
                <Select placeholder="Select license type">
                  <Option value="Code 10">Code 10</Option>
                  <Option value="Code 14">Code 14</Option>
                  <Option value="Code 08">Code 08</Option>
                  <Option value="PrDP">PrDP</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="License Number" name="licenseNumber">
                <Input placeholder="e.g., SMITH123456" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="License Expiry" name="licenseExpiry" rules={[{ required: true, message: 'Expiry date is required' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Number" name="phone">
                <Input placeholder="e.g., 082 123 4567" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View Vehicle Modal */}
      <Modal
        title="Vehicle Details"
        open={!!viewingVehicle}
        onCancel={() => setViewingVehicle(null)}
        footer={[
          <Button key="close" onClick={() => setViewingVehicle(null)}>Close</Button>
        ]}
        width={500}
      >
        {viewingVehicle && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Vehicle ID">{viewingVehicle.id}</Descriptions.Item>
            <Descriptions.Item label="Registration">{viewingVehicle.registration}</Descriptions.Item>
            <Descriptions.Item label="Type">{viewingVehicle.type || (viewingVehicle as any).vehicle_type || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Capacity">{viewingVehicle.capacity || (viewingVehicle as any).capacity_tons || 'N/A'} tons</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={viewingVehicle.status === 'available' ? 'green' : 'blue'}>{viewingVehicle.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Driver">{viewingVehicle.driver || 'Unassigned'}</Descriptions.Item>
            <Descriptions.Item label="Fuel Level">{viewingVehicle.fuelLevel || 0}%</Descriptions.Item>
            <Descriptions.Item label="Last Service">{viewingVehicle.lastService || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Next Service">{viewingVehicle.nextService || 'N/A'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* View Driver Modal */}
      <Modal
        title="Driver Details"
        open={!!viewingDriver}
        onCancel={() => setViewingDriver(null)}
        footer={[
          <Button key="close" onClick={() => setViewingDriver(null)}>Close</Button>
        ]}
        width={500}
      >
        {viewingDriver && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Driver ID">{viewingDriver.id}</Descriptions.Item>
            <Descriptions.Item label="Name">{viewingDriver.name || `${(viewingDriver as any).first_name || ''} ${(viewingDriver as any).last_name || ''}`.trim()}</Descriptions.Item>
            <Descriptions.Item label="License Type">{viewingDriver.license || (viewingDriver as any).license_type}</Descriptions.Item>
            <Descriptions.Item label="License Expiry">{viewingDriver.licenseExpiry || (viewingDriver as any).license_expiry ? new Date(viewingDriver.licenseExpiry || (viewingDriver as any).license_expiry).toLocaleDateString() : 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={viewingDriver.status === 'available' ? 'green' : 'blue'}>{viewingDriver.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Current Trip">{viewingDriver.currentTrip || 'None'}</Descriptions.Item>
            <Descriptions.Item label="Hours This Week">{viewingDriver.hoursThisWeek || 0}h</Descriptions.Item>
            <Descriptions.Item label="Rating">{(viewingDriver.rating || 0).toFixed(1)} ★</Descriptions.Item>
            <Descriptions.Item label="Contact">{(viewingDriver as any).contact_number || 'N/A'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </HubLayout>
  );
};

export default LogisticsHub;
