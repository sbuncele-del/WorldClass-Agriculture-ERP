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
  List,
  Avatar,
  Typography,
  Descriptions,
  Spin,
  message,
  Tabs,
} from 'antd';
import {
  HomeOutlined,
  CloudOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
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
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  BankOutlined,
  FileTextOutlined,
  CarOutlined,
  ShopOutlined,
  CalendarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  FieldTimeOutlined,
  RiseOutlined,
  FallOutlined,
  StockOutlined,
  HeatMapOutlined,
  AlertOutlined,
  ContainerOutlined,
  GoldOutlined,
  ApiOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../../components/hub';

const { Title, Text } = Typography;
const { Option } = Select;

// Fix Leaflet default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Weather API Service - OpenWeatherMap or SA Weather Service
interface WeatherAPIData {
  current: {
    temp: number;
    humidity: number;
    rainfall: number;
    wind: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    day: string;
    date: string;
    high: number;
    low: number;
    rain: number;
    icon: string;
    description: string;
  }>;
  alerts: Array<{
    type: string;
    severity: 'warning' | 'watch' | 'advisory';
    message: string;
    expires: string;
  }>;
  lastUpdated: string;
}

// SARS Farming Income Classification
interface SARSFarmingIncome {
  category: 'primary_producer' | 'secondary_producer' | 'mixed';
  taxYear: string;
  grossFarmingIncome: number;
  allowableDeductions: number;
  developmentExpenditure: number;
  droughtReliefClaimed: boolean;
  firstYearAllowance: number;
  livestockScheme: 'standard' | 'national_average';
  section12B_deductions: number; // Capital allowances for farming equipment
}

// Custom Tree/Plant icon
const PlantIcon = () => (
  <span role="img" aria-label="plant" style={{ fontSize: 16 }}>🌱</span>
);

const AgricultureHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [harvestModalVisible, setHarvestModalVisible] = useState(false);
  const [livestockModalVisible, setLivestockModalVisible] = useState(false);
  const [fieldMapModalVisible, setFieldMapModalVisible] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [liveWeather, setLiveWeather] = useState<WeatherAPIData | null>(null);
  const [form] = Form.useForm();

  // Export function for Agriculture data
  const handleExport = () => {
    try {
      let csvContent = '';
      let filename = '';
      const now = new Date().toISOString().split('T')[0];

      if (activeTab === 'fields') {
        csvContent = 'Field ID,Name,Hectares,Crop,Variety,Plant Date,Harvest Date,Status,Health %,Irrigated\n';
        farmFields.forEach(f => {
          csvContent += `"${f.id}","${f.name}",${f.hectares},"${f.crop}","${f.variety}","${f.plantDate}","${f.harvestDate}","${f.status}",${f.health},${f.irrigated}\n`;
        });
        filename = `farm-fields-${now}.csv`;
      } else if (activeTab === 'livestock') {
        csvContent = 'ID,Type,Breed,Count,Location,Status,Last Vet Visit,Value\n';
        livestock.forEach(l => {
          csvContent += `"${l.id}","${l.type}","${l.breed}",${l.count},"${l.location}","${l.status}","${l.lastVet}",${l.value}\n`;
        });
        filename = `livestock-${now}.csv`;
      } else if (activeTab === 'inputs') {
        csvContent = 'ID,Type,Product,Quantity,Unit,Cost,Supplier,Applied Date\n';
        cropInputs.forEach(i => {
          csvContent += `"${i.id}","${i.type}","${i.product}",${i.quantity},"${i.unit}",${i.cost},"${i.supplier}","${i.applied}"\n`;
        });
        filename = `crop-inputs-${now}.csv`;
      } else if (activeTab === 'harvest') {
        csvContent = 'ID,Field,Crop,Hectares,Yield (tons),Yield/Ha,Grade,Moisture %,Price/ton,Revenue,Date\n';
        harvestRecords.forEach(h => {
          csvContent += `"${h.id}","${h.field}","${h.crop}",${h.hectares},${h.yield},${h.yieldPerHa},"${h.grade}",${h.moisture},${h.price},${h.revenue},"${h.date}"\n`;
        });
        filename = `harvest-records-${now}.csv`;
      } else if (activeTab === 'equipment') {
        csvContent = 'ID,Name,Type,Status,Hours,Last Service,Next Service\n';
        equipment.forEach(e => {
          csvContent += `"${e.id}","${e.name}","${e.type}","${e.status}",${e.hours},"${e.lastService}","${e.nextService}"\n`;
        });
        filename = `farm-equipment-${now}.csv`;
      } else {
        // Dashboard summary
        csvContent = 'Metric,Value\n';
        csvContent += `Total Hectares,${agricultureStats.totalHectares}\n`;
        csvContent += `Active Crops,${agricultureStats.activeCrops}\n`;
        csvContent += `Estimated Yield (tons),${agricultureStats.estimatedYield}\n`;
        csvContent += `Livestock Head,${agricultureStats.livestockHead}\n`;
        csvContent += `Water Usage %,${agricultureStats.waterUsage}\n`;
        csvContent += `Revenue,R ${agricultureStats.revenue.toLocaleString()}\n`;
        csvContent += `Expenses,R ${agricultureStats.expenses.toLocaleString()}\n`;
        filename = `agriculture-summary-${now}.csv`;
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

  // Weather API Configuration
  const weatherConfig = {
    apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo_key',
    // Farm location (Free State, SA for demo)
    lat: -29.0852,
    lon: 26.1596,
    units: 'metric'
  };

  // Fetch live weather data
  const fetchWeatherData = async () => {
    setWeatherLoading(true);
    try {
      // OpenWeatherMap API call (free tier available)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${weatherConfig.lat}&lon=${weatherConfig.lon}&units=${weatherConfig.units}&appid=${weatherConfig.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Weather API unavailable');
      }

      const data = await response.json();
      
      // Transform API response
      const transformed: WeatherAPIData = {
        current: {
          temp: Math.round(data.list[0].main.temp),
          humidity: data.list[0].main.humidity,
          rainfall: data.list[0].rain?.['3h'] || 0,
          wind: Math.round(data.list[0].wind.speed * 3.6), // m/s to km/h
          description: data.list[0].weather[0].description,
          icon: getWeatherEmoji(data.list[0].weather[0].icon)
        },
        forecast: data.list.filter((_: unknown, i: number) => i % 8 === 0).slice(0, 5).map((item: { dt: number; main: { temp_max: number; temp_min: number }; pop: number; weather: Array<{ icon: string; description: string }> }) => ({
          day: new Date(item.dt * 1000).toLocaleDateString('en-ZA', { weekday: 'short' }),
          date: new Date(item.dt * 1000).toLocaleDateString('en-ZA'),
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          rain: Math.round(item.pop * 100),
          icon: getWeatherEmoji(item.weather[0].icon),
          description: item.weather[0].description
        })),
        alerts: [], // Would come from alerts API
        lastUpdated: new Date().toLocaleTimeString('en-ZA')
      };

      setLiveWeather(transformed);
      message.success('Weather data updated');
    } catch {
      // Fall back to mock data if API fails
      message.warning('Using cached weather data (API unavailable)');
    } finally {
      setWeatherLoading(false);
    }
  };

  const getWeatherEmoji = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '☀️';
  };

  // Load weather on mount
  useEffect(() => {
    fetchWeatherData();
    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agriculture data from API
  useEffect(() => {
    const fetchAgricultureData = async () => {
      setLoading(true);
      try {
        const [statsRes, cropsRes, livestockRes, equipmentRes] = await Promise.all([
          apiClient.get('/api/agriculture/stats'),
          apiClient.get('/api/agriculture/crops'),
          apiClient.get('/api/agriculture/livestock'),
          apiClient.get('/api/agriculture/equipment')
        ]);

        if (statsRes.data) {
          setAgricultureStats(statsRes.data);
        }
        if (cropsRes.data) {
          setFarmFields(Array.isArray(cropsRes.data) ? cropsRes.data : cropsRes.data.fields || []);
        }
        if (livestockRes.data) {
          setLivestock(Array.isArray(livestockRes.data) ? livestockRes.data : livestockRes.data.livestock || []);
        }
        if (equipmentRes.data) {
          setEquipment(Array.isArray(equipmentRes.data) ? equipmentRes.data : equipmentRes.data.equipment || []);
        }
      } catch (error) {
        console.error('Error fetching agriculture data:', error);
        message.error('Failed to load agriculture data');
      } finally {
        setLoading(false);
      }
    };

    fetchAgricultureData();
  }, []);

  // Loading state for API data
  const [loading, setLoading] = useState(true);

  // SARS Compliance Data
  const sarsCompliance: SARSFarmingIncome = {
    category: 'primary_producer',
    taxYear: '2024/25',
    grossFarmingIncome: 45000000,
    allowableDeductions: 28000000,
    developmentExpenditure: 1250000,
    droughtReliefClaimed: false,
    firstYearAllowance: 850000,
    livestockScheme: 'standard',
    section12B_deductions: 2100000
  };

  // Agriculture KPIs
  const [agricultureStats, setAgricultureStats] = useState({
    totalHectares: 0,
    activeCrops: 0,
    estimatedYield: 0,
    livestockHead: 0,
    waterUsage: 0,
    revenue: 0,
    expenses: 0,
    weatherRisk: 'low'
  });

  // Farm Fields/Plots with GPS coordinates for mapping
  const [farmFields, setFarmFields] = useState<Array<{
    id: string;
    name: string;
    hectares: number;
    crop: string;
    variety: string;
    plantDate: string;
    harvestDate: string;
    status: string;
    health: number;
    irrigated: boolean;
    coordinates: [number, number][];
    color: string;
  }>>([]);

  // Livestock
  const [livestock, setLivestock] = useState<Array<{
    id: string;
    type: string;
    breed: string;
    count: number;
    location: string;
    status: string;
    lastVet: string;
    value: number;
  }>>([]);

  // Crop Inputs (Seeds, Fertilizer, Chemicals)
  const cropInputs = [
    { id: 'INP-001', type: 'Seed', product: 'PAN 6479 Maize Seed', quantity: 4500, unit: 'kg', cost: 285000, supplier: 'Pannar Seeds', applied: '2024-10-15' },
    { id: 'INP-002', type: 'Fertilizer', product: 'LAN 28%', quantity: 45000, unit: 'kg', cost: 540000, supplier: 'Omnia', applied: '2024-10-20' },
    { id: 'INP-003', type: 'Herbicide', product: 'Roundup PowerMax', quantity: 800, unit: 'L', cost: 96000, supplier: 'Bayer', applied: '2024-11-01' },
    { id: 'INP-004', type: 'Fertilizer', product: 'MAP', quantity: 25000, unit: 'kg', cost: 425000, supplier: 'Sasol', applied: '2024-10-15' },
    { id: 'INP-005', type: 'Pesticide', product: 'Karate Zeon', quantity: 200, unit: 'L', cost: 48000, supplier: 'Syngenta', applied: '2024-11-15' }
  ];

  // Harvest Records
  const harvestRecords = [
    { id: 'H-2024-001', field: 'South Block A', crop: 'Wheat', hectares: 520, yield: 2600, yieldPerHa: 5.0, grade: 'B1', moisture: 12.5, price: 5200, revenue: 13520000, date: '2024-11-28' },
    { id: 'H-2024-002', field: 'East Section', crop: 'Sunflower', hectares: 280, yield: 560, yieldPerHa: 2.0, grade: 'Grade 1', moisture: 9.8, price: 9500, revenue: 5320000, date: '2024-06-15' },
    { id: 'H-2024-003', field: 'North Pivot', crop: 'Maize', hectares: 350, yield: 3500, yieldPerHa: 10.0, grade: 'WM1', moisture: 13.2, price: 4200, revenue: 14700000, date: '2024-07-20' }
  ];

  // Weather Data
  const weatherData = {
    current: { temp: 28, humidity: 45, rainfall: 0, wind: 12 },
    forecast: [
      { day: 'Today', high: 32, low: 18, rain: 0, icon: '☀️' },
      { day: 'Tomorrow', high: 30, low: 17, rain: 20, icon: '⛅' },
      { day: 'Friday', high: 28, low: 16, rain: 60, icon: '🌧️' },
      { day: 'Saturday', high: 25, low: 15, rain: 40, icon: '🌧️' },
      { day: 'Sunday', high: 27, low: 16, rain: 10, icon: '⛅' }
    ],
    seasonRainfall: 245, // mm YTD
    normalRainfall: 380 // mm expected
  };

  // Equipment
  const [equipment, setEquipment] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    hours: number;
    lastService: string;
    nextService: string;
  }>>([]);

  // Field columns
  const fieldColumns = [
    { title: 'Field ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string) => <strong>{name}</strong> },
    { title: 'Hectares', dataIndex: 'hectares', key: 'hectares' },
    { title: 'Crop', dataIndex: 'crop', key: 'crop', render: (crop: string) => <Tag color="green">{crop}</Tag> },
    { title: 'Variety', dataIndex: 'variety', key: 'variety' },
    { title: 'Planted', dataIndex: 'plantDate', key: 'plantDate' },
    { title: 'Expected Harvest', dataIndex: 'harvestDate', key: 'harvestDate' },
    { title: 'Health', key: 'health', render: (_: unknown, record: typeof farmFields[0]) => (
      record.status !== 'harvested' ? (
        <Progress 
          percent={record.health} 
          size="small" 
          status={record.health >= 90 ? 'success' : record.health >= 70 ? 'normal' : 'exception'}
        />
      ) : <Tag>Harvested</Tag>
    )},
    { title: 'Irrigated', dataIndex: 'irrigated', key: 'irrigated', render: (irr: boolean) => (
      irr ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <span>-</span>
    )},
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        'growing': { color: 'success', label: 'Growing' },
        'harvested': { color: 'default', label: 'Harvested' },
        'fallow': { color: 'warning', label: 'Fallow' },
        'grazing': { color: 'processing', label: 'Grazing' }
      };
      const { color, label } = config[status] || { color: 'default', label: status };
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button size="small">Details</Button>
        <Button size="small" icon={<ExperimentOutlined />}>Scout</Button>
      </Space>
    )}
  ];

  // Livestock columns
  const livestockColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Breed', dataIndex: 'breed', key: 'breed', render: (breed: string) => <Tag>{breed}</Tag> },
    { title: 'Count', dataIndex: 'count', key: 'count', render: (count: number) => <strong>{count}</strong> },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={status === 'healthy' ? 'success' : 'warning'}>{status}</Tag>
    )},
    { title: 'Last Vet Visit', dataIndex: 'lastVet', key: 'lastVet' },
    { title: 'Value', dataIndex: 'value', key: 'value', render: (v: number) => `R ${(v/1000000).toFixed(1)}M` },
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button size="small">Details</Button>
        <Button size="small" icon={<SafetyCertificateOutlined />}>Health</Button>
      </Space>
    )}
  ];

  // Input columns
  const inputColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => {
      const colors: Record<string, string> = { 'Seed': 'green', 'Fertilizer': 'blue', 'Herbicide': 'orange', 'Pesticide': 'red' };
      return <Tag color={colors[type]}>{type}</Tag>;
    }},
    { title: 'Product', dataIndex: 'product', key: 'product' },
    { title: 'Quantity', key: 'quantity', render: (_: unknown, r: typeof cropInputs[0]) => `${r.quantity.toLocaleString()} ${r.unit}` },
    { title: 'Cost', dataIndex: 'cost', key: 'cost', render: (c: number) => `R ${c.toLocaleString()}` },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Applied', dataIndex: 'applied', key: 'applied' }
  ];

  // Harvest columns
  const harvestColumns = [
    { title: 'Harvest ID', dataIndex: 'id', key: 'id' },
    { title: 'Field', dataIndex: 'field', key: 'field' },
    { title: 'Crop', dataIndex: 'crop', key: 'crop', render: (crop: string) => <Tag color="green">{crop}</Tag> },
    { title: 'Hectares', dataIndex: 'hectares', key: 'hectares' },
    { title: 'Yield (t)', dataIndex: 'yield', key: 'yield', render: (y: number) => <strong>{y.toLocaleString()}</strong> },
    { title: 't/ha', dataIndex: 'yieldPerHa', key: 'yieldPerHa' },
    { title: 'Grade', dataIndex: 'grade', key: 'grade', render: (g: string) => <Tag color="blue">{g}</Tag> },
    { title: 'Moisture', dataIndex: 'moisture', key: 'moisture', render: (m: number) => `${m}%` },
    { title: 'Price/t', dataIndex: 'price', key: 'price', render: (p: number) => `R ${p.toLocaleString()}` },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (r: number) => <Text type="success">R {(r/1000000).toFixed(1)}M</Text> },
    { title: 'Date', dataIndex: 'date', key: 'date' }
  ];

  // Equipment columns
  const equipmentColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name', render: (name: string) => <strong>{name}</strong> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag>{type}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={status === 'operational' ? 'success' : 'warning'}>{status}</Tag>
    )},
    { title: 'Hours', dataIndex: 'hours', key: 'hours', render: (h: number) => `${h.toLocaleString()} hrs` },
    { title: 'Last Service', dataIndex: 'lastService', key: 'lastService' },
    { title: 'Next Service', dataIndex: 'nextService', key: 'nextService' },
    { title: 'Actions', key: 'actions', render: () => (
      <Space>
        <Button size="small" icon={<ToolOutlined />}>Service</Button>
        <Button size="small">Log Hours</Button>
      </Space>
    )}
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div style={{ padding: '24px' }}>
      {/* Weather Alert */}
      {weatherData.forecast.some(f => f.rain >= 60) && (
        <Alert
          message={<><CloudOutlined /> Weather Alert: Rain Expected</>}
          description="Significant rainfall (60%+ chance) forecast for Friday. Consider postponing spray operations and checking drainage."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Hectares"
              value={agricultureStats.totalHectares}
              suffix="ha"
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Estimated Yield"
              value={agricultureStats.estimatedYield}
              suffix="tons"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Livestock"
              value={agricultureStats.livestockHead}
              suffix="head"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Water Usage"
              value={agricultureStats.waterUsage}
              suffix="% of allocation"
              valueStyle={{ color: agricultureStats.waterUsage > 90 ? '#ff4d4f' : '#13c2c2' }}
            />
            <Progress percent={agricultureStats.waterUsage} showInfo={false} strokeColor={agricultureStats.waterUsage > 90 ? '#ff4d4f' : '#13c2c2'} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Weather & Fields */}
        <Col xs={24} lg={16}>
          {/* Weather Card */}
          <Card title={<><CloudOutlined /> Weather</>} style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48 }}>☀️</div>
                  <Title level={2} style={{ margin: 0 }}>{weatherData.current.temp}°C</Title>
                  <Text type="secondary">Current</Text>
                </div>
              </Col>
              <Col span={16}>
                <Row gutter={8}>
                  {weatherData.forecast.map(day => (
                    <Col span={4} key={day.day} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#666' }}>{day.day}</div>
                      <div style={{ fontSize: 20 }}>{day.icon}</div>
                      <div style={{ fontSize: 12 }}>{day.high}°/{day.low}°</div>
                      {day.rain > 0 && <Tag color="blue" style={{ fontSize: 10 }}>{day.rain}%</Tag>}
                    </Col>
                  ))}
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row>
                  <Col span={12}>
                    <Text type="secondary">Season Rainfall: </Text>
                    <strong>{weatherData.seasonRainfall}mm</strong>
                    <Text type="secondary"> / {weatherData.normalRainfall}mm normal</Text>
                  </Col>
                  <Col span={12}>
                    <Progress percent={Math.round((weatherData.seasonRainfall / weatherData.normalRainfall) * 100)} size="small" />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Active Crops */}
          <Card title="Active Crops" extra={<Button type="link">View All Fields</Button>}>
            <Table 
              dataSource={farmFields.filter(f => f.status === 'growing').slice(0, 4)} 
              columns={[
                { title: 'Field', dataIndex: 'name', key: 'name' },
                { title: 'Crop', dataIndex: 'crop', key: 'crop', render: (c: string) => <Tag color="green">{c}</Tag> },
                { title: 'Ha', dataIndex: 'hectares', key: 'hectares' },
                { title: 'Health', key: 'health', render: (_: unknown, r: typeof farmFields[0]) => <Progress percent={r.health} size="small" /> },
                { title: 'Harvest', dataIndex: 'harvestDate', key: 'harvestDate' }
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
              <Button type="primary" icon={<PlusOutlined />} block onClick={() => setCropModalVisible(true)}>
                Plan New Crop
              </Button>
              <Button icon={<ContainerOutlined />} block onClick={() => setHarvestModalVisible(true)}>
                Record Harvest
              </Button>
              <Button icon={<SafetyCertificateOutlined />} block onClick={() => setLivestockModalVisible(true)}>
                Livestock Entry
              </Button>
              <Button icon={<ExperimentOutlined />} block>
                Field Scouting
              </Button>
            </Space>
          </Card>

          <Card title="Tasks & Reminders">
            <Timeline
              items={[
                {
                  color: 'red',
                  children: (
                    <>
                      <div><strong>Spray Window</strong></div>
                      <div style={{ fontSize: 12, color: '#999' }}>North Block A - Before rain Friday</div>
                    </>
                  )
                },
                {
                  color: 'orange',
                  children: (
                    <>
                      <div><strong>Equipment Service</strong></div>
                      <div style={{ fontSize: 12, color: '#999' }}>Sprayer maintenance due • Dec 10</div>
                    </>
                  )
                },
                {
                  color: 'blue',
                  children: (
                    <>
                      <div><strong>Fertilizer Application</strong></div>
                      <div style={{ fontSize: 12, color: '#999' }}>Top-dress maize • Next week</div>
                    </>
                  )
                },
                {
                  color: 'green',
                  children: (
                    <>
                      <div><strong>Vet Visit</strong></div>
                      <div style={{ fontSize: 12, color: '#999' }}>Cattle vaccination • Dec 20</div>
                    </>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Financial Integration */}
      <Card 
        title={<><BankOutlined /> Financial Integration</>} 
        style={{ marginTop: 24 }}
        extra={<Button type="link">View GL Entries</Button>}
      >
        <Row gutter={24}>
          <Col span={6}>
            <Statistic title="Revenue (YTD)" value={agricultureStats.revenue} prefix="R" valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Input Costs (YTD)" value={agricultureStats.expenses} prefix="R" valueStyle={{ color: '#ff4d4f' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Gross Margin" value={((agricultureStats.revenue - agricultureStats.expenses) / agricultureStats.revenue * 100).toFixed(1)} suffix="%" valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Biological Assets" value={11230000} prefix="R" />
          </Col>
        </Row>
        <Alert
          message="IAS 41 Agriculture Compliance"
          description="Biological assets (crops & livestock) valued at fair value less costs to sell. Gains/losses recognized in profit/loss as per IAS 41."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );

  // Render Fields
  const renderFields = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Hectares" value={agricultureStats.totalHectares} suffix="ha" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Under Crop" value={farmFields.filter(f => f.status === 'growing').reduce((a, f) => a + f.hectares, 0)} suffix="ha" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Irrigated" value={farmFields.filter(f => f.irrigated).reduce((a, f) => a + f.hectares, 0)} suffix="ha" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Health Score" value={Math.round(farmFields.filter(f => f.status === 'growing').reduce((a, f) => a + f.health, 0) / farmFields.filter(f => f.status === 'growing').length)} suffix="%" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Farm Fields & Blocks"
        extra={
          <Space>
            <Button type="primary" icon={<HeatMapOutlined />} onClick={() => setFieldMapModalVisible(true)}>Field Map</Button>
            <Button icon={<PlusOutlined />} onClick={() => setCropModalVisible(true)}>
              Add Field
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={farmFields} 
          columns={fieldColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Livestock
  const renderLivestock = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Head" value={agricultureStats.livestockHead} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Cattle" value={livestock.filter(l => l.type === 'Cattle').reduce((a, l) => a + l.count, 0)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Sheep" value={livestock.filter(l => l.type === 'Sheep').reduce((a, l) => a + l.count, 0)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Value" value={livestock.reduce((a, l) => a + l.value, 0)} prefix="R" />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Livestock Management"
        extra={
          <Space>
            <Button icon={<SafetyCertificateOutlined />}>Health Records</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setLivestockModalVisible(true)}>
              Add Livestock
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={livestock} 
          columns={livestockColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* IAS 41 Valuation */}
      <Card title="Biological Asset Valuation (IAS 41)" style={{ marginTop: 24 }}>
        <Alert
          message="Fair Value Measurement"
          description="Livestock valued at fair value less costs to sell. Changes in fair value recognized in profit/loss for the period."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Row gutter={24}>
          <Col span={8}>
            <Statistic title="Opening Value (1 Jan)" value={9500000} prefix="R" />
          </Col>
          <Col span={8}>
            <Statistic title="Fair Value Gain" value={1730000} prefix="R" valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col span={8}>
            <Statistic title="Current Value" value={11230000} prefix="R" />
          </Col>
        </Row>
      </Card>
    </div>
  );

  // Render Inputs
  const renderInputs = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Seeds" value={cropInputs.filter(i => i.type === 'Seed').reduce((a, i) => a + i.cost, 0)} prefix="R" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Fertilizers" value={cropInputs.filter(i => i.type === 'Fertilizer').reduce((a, i) => a + i.cost, 0)} prefix="R" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Chemicals" value={cropInputs.filter(i => i.type === 'Herbicide' || i.type === 'Pesticide').reduce((a, i) => a + i.cost, 0)} prefix="R" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Input Costs" value={cropInputs.reduce((a, i) => a + i.cost, 0)} prefix="R" valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Crop Inputs"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Input</Button>
          </Space>
        }
      >
        <Table 
          dataSource={cropInputs} 
          columns={inputColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Harvest
  const renderHarvest = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Harvested" value={harvestRecords.reduce((a, h) => a + h.yield, 0)} suffix="tons" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Avg Yield" value={(harvestRecords.reduce((a, h) => a + h.yieldPerHa, 0) / harvestRecords.length).toFixed(1)} suffix="t/ha" />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Revenue" value={harvestRecords.reduce((a, h) => a + h.revenue, 0)} prefix="R" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Pending Harvest" value={farmFields.filter(f => f.status === 'growing').length} suffix="fields" />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Harvest Records"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setHarvestModalVisible(true)}>
              Record Harvest
            </Button>
          </Space>
        }
      >
        <Table 
          dataSource={harvestRecords} 
          columns={harvestColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  // Render Equipment
  const renderEquipment = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Equipment" value={equipment.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Operational" value={equipment.filter(e => e.status === 'operational').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="In Maintenance" value={equipment.filter(e => e.status === 'maintenance').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Hours (All)" value={equipment.reduce((a, e) => a + e.hours, 0)} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Equipment & Machinery"
        extra={
          <Space>
            <Button icon={<ToolOutlined />}>Schedule Service</Button>
            <Button type="primary" icon={<PlusOutlined />}>Add Equipment</Button>
          </Space>
        }
      >
        <Table 
          dataSource={equipment} 
          columns={equipmentColumns} 
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  // Render Settings
  const renderSettings = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Farm Settings">
            <Form layout="vertical">
              <Form.Item label="Farm Name">
                <Input defaultValue="Riverdale Farms" />
              </Form.Item>
              <Form.Item label="Default Unit of Measure">
                <Select defaultValue="metric">
                  <Option value="metric">Metric (hectares, kg, L)</Option>
                  <Option value="imperial">Imperial (acres, lb, gal)</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Primary Enterprise">
                <Select defaultValue="mixed">
                  <Option value="crops">Crop Farming</Option>
                  <Option value="livestock">Livestock</Option>
                  <Option value="mixed">Mixed Farming</Option>
                </Select>
              </Form.Item>
              <Button type="primary">Save Settings</Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Financial Integration">
            <Form layout="vertical">
              <Form.Item label="Crop Revenue Account">
                <Select defaultValue="4000">
                  <Option value="4000">4000 - Crop Sales</Option>
                  <Option value="4100">4100 - Agricultural Revenue</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Livestock Revenue Account">
                <Select defaultValue="4200">
                  <Option value="4200">4200 - Livestock Sales</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Input Costs Account">
                <Select defaultValue="5000">
                  <Option value="5000">5000 - Farm Inputs</Option>
                  <Option value="5100">5100 - Agricultural Expenses</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Biological Assets Account (IAS 41)">
                <Select defaultValue="1400">
                  <Option value="1400">1400 - Biological Assets</Option>
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
          <Card title="IAS 41 - Agriculture Standard Compliance">
            <Alert
              message="Biological Asset Recognition"
              description="All growing crops and livestock are recognized as biological assets at fair value less costs to sell. Changes in fair value are recognized in profit/loss."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Valuation Method - Crops">
                  <Select defaultValue="market">
                    <Option value="market">Active Market Price</Option>
                    <Option value="estimated">Estimated Selling Price</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Valuation Method - Livestock">
                  <Select defaultValue="market">
                    <Option value="market">Market Price per kg</Option>
                    <Option value="auction">Auction Prices</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Revaluation Frequency">
                  <Select defaultValue="monthly">
                    <Option value="monthly">Monthly</Option>
                    <Option value="quarterly">Quarterly</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* SARS Farming Income Compliance */}
        <Col xs={24}>
          <Card 
            title={<><BankOutlined /> SARS Farming Income Compliance</>}
            extra={<Tag color="green">Tax Year {sarsCompliance.taxYear}</Tag>}
          >
            <Alert
              message="First Schedule - Farming Operations"
              description="Income and deductions calculated per SARS First Schedule requirements for farming operations. Section 12B capital allowances applicable to farming equipment."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Row gutter={[24, 16]}>
              <Col span={6}>
                <Statistic 
                  title="Gross Farming Income" 
                  value={sarsCompliance.grossFarmingIncome} 
                  prefix="R" 
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Allowable Deductions" 
                  value={sarsCompliance.allowableDeductions} 
                  prefix="R" 
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Section 12B Allowance" 
                  value={sarsCompliance.section12B_deductions} 
                  prefix="R" 
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>50/30/20 for equipment</Text>
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Taxable Farming Income" 
                  value={sarsCompliance.grossFarmingIncome - sarsCompliance.allowableDeductions - sarsCompliance.section12B_deductions} 
                  prefix="R" 
                />
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Producer Category">
                  <Select defaultValue={sarsCompliance.category}>
                    <Option value="primary_producer">Primary Producer (Bona Fide Farmer)</Option>
                    <Option value="secondary_producer">Secondary Producer</Option>
                    <Option value="mixed">Mixed Operations</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Livestock Valuation Scheme">
                  <Select defaultValue={sarsCompliance.livestockScheme}>
                    <Option value="standard">Standard Values</Option>
                    <Option value="national_average">National Average Prices</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Development Expenditure (s12B)">
                  <InputNumber 
                    defaultValue={sarsCompliance.developmentExpenditure} 
                    prefix="R" 
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Drought Relief Claimed">
                  <Switch defaultChecked={sarsCompliance.droughtReliefClaimed} />
                  <Text type="secondary" style={{ marginLeft: 8 }}>Para 13A - Forced sales of livestock</Text>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="First Year Farming Allowance">
                  <InputNumber 
                    defaultValue={sarsCompliance.firstYearAllowance} 
                    prefix="R" 
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Alert
              message="SARS Reporting Requirements"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>IRP5/IT3(a) for farm workers</li>
                  <li>VAT201 - Output VAT on produce sales (zero-rated exports)</li>
                  <li>ITR14 - Annual farming income declaration</li>
                  <li>Livestock register maintained per SARS requirements</li>
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button icon={<DownloadOutlined />}>Export Tax Pack</Button>
                <Button type="primary" icon={<FileTextOutlined />}>Generate ITR14 Schedules</Button>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Weather API Configuration */}
        <Col xs={24}>
          <Card title={<><CloudOutlined /> Weather API Configuration</>}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Weather Provider">
                  <Select defaultValue="openweather">
                    <Option value="openweather">OpenWeatherMap</Option>
                    <Option value="weatherapi">WeatherAPI</Option>
                    <Option value="saws">SA Weather Service</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="API Key">
                  <Input.Password placeholder="Enter API key" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Auto-Refresh Interval">
                  <Select defaultValue="30">
                    <Option value="15">Every 15 minutes</Option>
                    <Option value="30">Every 30 minutes</Option>
                    <Option value="60">Every hour</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Farm Coordinates (Latitude)">
                  <InputNumber defaultValue={-29.0852} style={{ width: '100%' }} step={0.0001} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Farm Coordinates (Longitude)">
                  <InputNumber defaultValue={26.1596} style={{ width: '100%' }} step={0.0001} />
                </Form.Item>
              </Col>
            </Row>
            <Alert
              message="Weather Integration Active"
              description={`Last updated: ${liveWeather?.lastUpdated || 'Not yet loaded'}. Weather data is used for spray window alerts, irrigation scheduling, and harvest planning.`}
              type="success"
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
        title="Agriculture Hub"
        subtitle="Crop Management, Livestock & Farm Operations"
        icon={<EnvironmentOutlined />}
        gradient="green"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<CloudOutlined />}>Weather</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCropModalVisible(true)}>
              New Crop
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="green"
        icon={<EnvironmentOutlined />}
        title="Farm Overview"
        subtitle="Growing Season 2024/25"
        stats={[
          { title: 'Total Hectares', value: agricultureStats.totalHectares.toLocaleString(), span: 4 },
          { title: 'Active Crops', value: agricultureStats.activeCrops.toString(), span: 4 },
          { title: 'Est. Yield (t)', value: agricultureStats.estimatedYield.toLocaleString(), span: 4 },
          { title: 'Livestock', value: `${agricultureStats.livestockHead} head`, span: 4 },
          { title: 'Water Usage', value: `${agricultureStats.waterUsage}%`, span: 4 },
        ]}
      />

      <HubTabs 
        theme="green"
        tabs={[
          { key: 'dashboard', label: 'Dashboard', icon: <HomeOutlined />, children: renderDashboard() },
          { key: 'fields', label: 'Fields', icon: <EnvironmentOutlined />, children: renderFields() },
          { key: 'livestock', label: 'Livestock', icon: <SafetyCertificateOutlined />, children: renderLivestock() },
          { key: 'inputs', label: 'Inputs', icon: <ExperimentOutlined />, children: renderInputs() },
          { key: 'harvest', label: 'Harvest', icon: <ContainerOutlined />, children: renderHarvest() },
          { key: 'equipment', label: 'Equipment', icon: <ToolOutlined />, children: renderEquipment() },
          { key: 'settings', label: 'Settings', icon: <SettingOutlined />, children: renderSettings() }
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Plan Crop Modal */}
      <Modal
        title="Plan New Crop"
        open={cropModalVisible}
        onCancel={() => setCropModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCropModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary">Save Crop Plan</Button>
        ]}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Field" name="field" rules={[{ required: true }]}>
                <Select placeholder="Select field">
                  {farmFields.map(f => (
                    <Option key={f.id} value={f.id}>{f.name} ({f.hectares} ha)</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Crop" name="crop" rules={[{ required: true }]}>
                <Select placeholder="Select crop">
                  <Option value="maize">Maize</Option>
                  <Option value="wheat">Wheat</Option>
                  <Option value="soybeans">Soybeans</Option>
                  <Option value="sunflower">Sunflower</Option>
                  <Option value="potatoes">Potatoes</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Variety" name="variety">
                <Input placeholder="e.g., PAN 6479" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hectares" name="hectares" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Planting Date" name="plantDate" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Expected Harvest" name="harvestDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Irrigated">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Harvest Modal */}
      <Modal
        title="Record Harvest"
        open={harvestModalVisible}
        onCancel={() => setHarvestModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setHarvestModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary">Record Harvest</Button>
        ]}
        width={700}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Field" name="field" rules={[{ required: true }]}>
                <Select placeholder="Select field">
                  {farmFields.filter(f => f.status === 'growing').map(f => (
                    <Option key={f.id} value={f.id}>{f.name} - {f.crop}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Harvest Date" name="date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Yield (tons)" name="yield" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Grade" name="grade">
                <Select placeholder="Select grade">
                  <Option value="A">Grade A / Premium</Option>
                  <Option value="B1">Grade B1</Option>
                  <Option value="B2">Grade B2</Option>
                  <Option value="C">Grade C</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Moisture (%)" name="moisture">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Price per Ton" name="price">
                <InputNumber min={0} prefix="R" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Buyer/Silo" name="buyer">
                <Select placeholder="Select buyer">
                  <Option value="senwes">Senwes</Option>
                  <Option value="afgri">AFGRI</Option>
                  <Option value="nwk">NWK</Option>
                  <Option value="vkb">VKB</Option>
                  <Option value="direct">Direct Sale</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="Revenue will be posted to GL Account 4000 (Crop Sales)"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Livestock Entry Modal */}
      <Modal
        title="Add Livestock Entry"
        open={livestockModalVisible}
        onCancel={() => setLivestockModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLivestockModalVisible(false)}>Cancel</Button>,
          <Button key="submit" type="primary">Add Entry</Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="cattle">Cattle</Option>
                  <Option value="sheep">Sheep</Option>
                  <Option value="goats">Goats</Option>
                  <Option value="pigs">Pigs</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Breed" name="breed" rules={[{ required: true }]}>
                <Input placeholder="e.g., Bonsmara" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Count" name="count" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Location" name="location" rules={[{ required: true }]}>
                <Select placeholder="Select location">
                  <Option value="west">West Grazing</Option>
                  <Option value="north">North Paddock</Option>
                  <Option value="south">South Paddock</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Value (R)" name="value">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Alert
            message="IAS 41 Biological Assets"
            description="Livestock will be recognized as biological assets at fair value less costs to sell"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Field Map Modal */}
      <Modal
        title={<><HeatMapOutlined /> Farm Field Map</>}
        open={fieldMapModalVisible}
        onCancel={() => setFieldMapModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFieldMapModalVisible(false)}>Close</Button>,
          <Button key="export" icon={<DownloadOutlined />}>Export KML</Button>,
          <Button key="print" type="primary">Print Map</Button>
        ]}
        width={1000}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ height: 500 }}>
          <MapContainer
            center={[-29.095, 26.165]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {farmFields.map(field => (
              <Polygon
                key={field.id}
                positions={field.coordinates}
                pathOptions={{ 
                  color: field.color, 
                  fillColor: field.color,
                  fillOpacity: 0.4,
                  weight: 2
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <Title level={5} style={{ margin: 0 }}>{field.name}</Title>
                    <Divider style={{ margin: '8px 0' }} />
                    <p><strong>Crop:</strong> {field.crop}</p>
                    <p><strong>Variety:</strong> {field.variety}</p>
                    <p><strong>Hectares:</strong> {field.hectares} ha</p>
                    <p><strong>Status:</strong> <Tag color={field.status === 'growing' ? 'success' : field.status === 'harvested' ? 'default' : 'processing'}>{field.status}</Tag></p>
                    {field.status === 'growing' && (
                      <>
                        <p><strong>Health:</strong> <Progress percent={field.health} size="small" /></p>
                        <p><strong>Expected Harvest:</strong> {field.harvestDate}</p>
                      </>
                    )}
                    <p><strong>Irrigated:</strong> {field.irrigated ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 'No'}</p>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>
        </div>
        <div style={{ padding: 16, background: '#fafafa' }}>
          <Row gutter={16}>
            {farmFields.map(field => (
              <Col key={field.id} span={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: field.color }} />
                  <Text style={{ fontSize: 12 }}>{field.name}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </HubLayout>
  );
};

export default AgricultureHub;
