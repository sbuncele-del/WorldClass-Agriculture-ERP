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
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  message,
  Divider,
  List,
  Alert,
  Badge,
  Avatar,
  Descriptions,
  Timeline,
  Popconfirm,
  Spin,
  Empty,
} from 'antd';
import {
  BankOutlined,
  ToolOutlined,
  CarOutlined,
  DesktopOutlined,
  HomeOutlined,
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
  SafetyCertificateOutlined,
  AuditOutlined,
  FileProtectOutlined,
  SwapOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
  QuickActionsCard,
  StatusIndicator,
  InfoListCard,
} from '../../components/hub';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;

// ===========================================
// IAS 16 COMPLIANT ASSET POLICIES - TYPE DEFINITIONS
// ===========================================

interface AssetPolicy {
  id: string;
  category: string;
  categoryCode: string;
  usefulLifeYears: number;
  residualValuePercent: number;
  depreciationMethod: 'straight_line' | 'reducing_balance' | 'units_of_production';
  componentDepreciation: boolean;
  revaluationModel: boolean;
  reviewFrequency: 'annual' | 'biannual' | 'quarterly';
  lastReviewDate: string;
  nextReviewDate: string;
  approvedBy: string;
  status: 'active' | 'pending_approval' | 'superseded';
  sarsWearAndTear?: number;
  ias16Reference: string;
}

interface Asset {
  id: string;
  assetNumber: string;
  description: string;
  category: string;
  categoryCode: string;
  location: string;
  department: string;
  custodian: string;
  acquisitionDate: string;
  acquisitionCost: number;
  directlyAttributableCosts: number;
  estimatedDismantlingCost: number;
  totalCost: number;
  usefulLifeYears: number;
  residualValue: number;
  depreciationMethod: string;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  carryingValue: number;
  status: 'active' | 'disposed' | 'impaired' | 'fully_depreciated' | 'under_construction';
  lastDepreciationDate: string;
  impairmentLoss: number;
  recoverableAmount: number | null;
  policyApplied: string;
  policyVersion: string;
}

interface AssetStats {
  totalAssets: number;
  totalCost: number;
  totalNBV: number;
  accumulatedDepreciation: number;
  assetsFullyDepreciated: number;
  assetsDueForReview: number;
  pendingDisposals: number;
  impairedAssets: number;
  monthlyDepreciation: number;
  categories: number;
}

// Default IAS 16 compliant policies (used as fallback only)
const assetPolicies: AssetPolicy[] = [
  {
    id: 'POL-001',
    category: 'Land',
    categoryCode: 'LAND',
    usefulLifeYears: 0, // Not depreciated
    residualValuePercent: 100,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: true,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    ias16Reference: 'IAS 16.58 - Land not depreciated',
  },
  {
    id: 'POL-002',
    category: 'Buildings',
    categoryCode: 'BLDG',
    usefulLifeYears: 40,
    residualValuePercent: 10,
    depreciationMethod: 'straight_line',
    componentDepreciation: true,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 5, // 5% per annum
    ias16Reference: 'IAS 16.43 - Systematic depreciation',
  },
  {
    id: 'POL-003',
    category: 'Plant & Machinery',
    categoryCode: 'MACH',
    usefulLifeYears: 10,
    residualValuePercent: 5,
    depreciationMethod: 'straight_line',
    componentDepreciation: true,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 20, // 20% per annum (5 years)
    ias16Reference: 'IAS 16.50 - Useful life factors',
  },
  {
    id: 'POL-004',
    category: 'Motor Vehicles',
    categoryCode: 'VEHI',
    usefulLifeYears: 5,
    residualValuePercent: 15,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 25, // 25% per annum (4 years)
    ias16Reference: 'IAS 16.6 - Definition of PPE',
  },
  {
    id: 'POL-005',
    category: 'Office Equipment',
    categoryCode: 'OFEQ',
    usefulLifeYears: 5,
    residualValuePercent: 0,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 33.33, // 33.33% per annum (3 years)
    ias16Reference: 'IAS 16.43 - Depreciation method',
  },
  {
    id: 'POL-006',
    category: 'IT Equipment',
    categoryCode: 'ITEQ',
    usefulLifeYears: 3,
    residualValuePercent: 0,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 33.33,
    ias16Reference: 'IAS 16.51 - Technology obsolescence',
  },
  {
    id: 'POL-007',
    category: 'Furniture & Fittings',
    categoryCode: 'FURN',
    usefulLifeYears: 10,
    residualValuePercent: 5,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 16.67, // 16.67% per annum (6 years)
    ias16Reference: 'IAS 16.6 - Definition of PPE',
  },
  {
    id: 'POL-008',
    category: 'Leasehold Improvements',
    categoryCode: 'LHLD',
    usefulLifeYears: 5, // Or lease term, whichever is shorter
    residualValuePercent: 0,
    depreciationMethod: 'straight_line',
    componentDepreciation: false,
    revaluationModel: false,
    reviewFrequency: 'annual',
    lastReviewDate: '2025-03-01',
    nextReviewDate: '2026-03-01',
    approvedBy: 'CFO',
    status: 'active',
    sarsWearAndTear: 20,
    ias16Reference: 'IAS 16.56 - Lease term consideration',
  },
];

// ===========================================
// ASSET REGISTER
// ===========================================

interface Asset {
  id: string;
  assetNumber: string;
  description: string;
  category: string;
  categoryCode: string;
  location: string;
  department: string;
  custodian: string;
  // IAS 16 Recognition
  acquisitionDate: string;
  acquisitionCost: number;
  directlyAttributableCosts: number;
  estimatedDismantlingCost: number;
  totalCost: number; // Initial measurement
  // Depreciation (inherited from policy)
  usefulLifeYears: number;
  residualValue: number;
  depreciationMethod: string;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  carryingValue: number; // NBV
  // Status
  status: 'active' | 'disposed' | 'impaired' | 'fully_depreciated' | 'under_construction';
  lastDepreciationDate: string;
  // IAS 36 Impairment
  impairmentLoss: number;
  recoverableAmount: number | null;
  // Audit
  policyApplied: string;
  policyVersion: string;
}

const assetRegister: Asset[] = [
  {
    id: 'AST-001',
    assetNumber: 'VEHI-2024-001',
    description: 'Toyota Hilux 2.8 GD-6 4x4',
    category: 'Motor Vehicles',
    categoryCode: 'VEHI',
    location: 'Head Office - Parking',
    department: 'Operations',
    custodian: 'John Smith',
    acquisitionDate: '2024-03-15',
    acquisitionCost: 850000,
    directlyAttributableCosts: 15000,
    estimatedDismantlingCost: 0,
    totalCost: 865000,
    usefulLifeYears: 5,
    residualValue: 129750, // 15%
    depreciationMethod: 'Straight Line',
    monthlyDepreciation: 12254,
    accumulatedDepreciation: 220572,
    carryingValue: 644428,
    status: 'active',
    lastDepreciationDate: '2025-11-30',
    impairmentLoss: 0,
    recoverableAmount: null,
    policyApplied: 'POL-004',
    policyVersion: '1.0',
  },
  {
    id: 'AST-002',
    assetNumber: 'ITEQ-2023-015',
    description: 'Dell PowerEdge R750 Server',
    category: 'IT Equipment',
    categoryCode: 'ITEQ',
    location: 'Data Center - Rack A3',
    department: 'IT',
    custodian: 'Sarah Chen',
    acquisitionDate: '2023-06-01',
    acquisitionCost: 450000,
    directlyAttributableCosts: 25000,
    estimatedDismantlingCost: 5000,
    totalCost: 480000,
    usefulLifeYears: 3,
    residualValue: 0,
    depreciationMethod: 'Straight Line',
    monthlyDepreciation: 13333,
    accumulatedDepreciation: 240000,
    carryingValue: 240000,
    status: 'active',
    lastDepreciationDate: '2025-11-30',
    impairmentLoss: 0,
    recoverableAmount: null,
    policyApplied: 'POL-006',
    policyVersion: '1.0',
  },
  {
    id: 'AST-003',
    assetNumber: 'MACH-2022-008',
    description: 'CNC Milling Machine - Haas VF-2',
    category: 'Plant & Machinery',
    categoryCode: 'MACH',
    location: 'Factory Floor - Bay 4',
    department: 'Manufacturing',
    custodian: 'Mike Johnson',
    acquisitionDate: '2022-01-15',
    acquisitionCost: 2500000,
    directlyAttributableCosts: 150000,
    estimatedDismantlingCost: 50000,
    totalCost: 2700000,
    usefulLifeYears: 10,
    residualValue: 135000, // 5%
    depreciationMethod: 'Straight Line',
    monthlyDepreciation: 21375,
    accumulatedDepreciation: 769500,
    carryingValue: 1930500,
    status: 'active',
    lastDepreciationDate: '2025-11-30',
    impairmentLoss: 0,
    recoverableAmount: null,
    policyApplied: 'POL-003',
    policyVersion: '1.0',
  },
  {
    id: 'AST-004',
    assetNumber: 'BLDG-2020-001',
    description: 'Warehouse Building - Midrand',
    category: 'Buildings',
    categoryCode: 'BLDG',
    location: 'Midrand Industrial Park',
    department: 'Operations',
    custodian: 'Facilities Manager',
    acquisitionDate: '2020-07-01',
    acquisitionCost: 15000000,
    directlyAttributableCosts: 500000,
    estimatedDismantlingCost: 200000,
    totalCost: 15700000,
    usefulLifeYears: 40,
    residualValue: 1570000, // 10%
    depreciationMethod: 'Straight Line',
    monthlyDepreciation: 29438,
    accumulatedDepreciation: 1942908,
    carryingValue: 13757092,
    status: 'active',
    lastDepreciationDate: '2025-11-30',
    impairmentLoss: 0,
    recoverableAmount: null,
    policyApplied: 'POL-002',
    policyVersion: '1.0',
  },
  {
    id: 'AST-005',
    assetNumber: 'OFEQ-2024-042',
    description: 'Herman Miller Aeron Chairs (Set of 10)',
    category: 'Office Equipment',
    categoryCode: 'OFEQ',
    location: 'Head Office - Floor 3',
    department: 'Administration',
    custodian: 'Office Manager',
    acquisitionDate: '2024-08-01',
    acquisitionCost: 180000,
    directlyAttributableCosts: 5000,
    estimatedDismantlingCost: 0,
    totalCost: 185000,
    usefulLifeYears: 5,
    residualValue: 0,
    depreciationMethod: 'Straight Line',
    monthlyDepreciation: 3083,
    accumulatedDepreciation: 12332,
    carryingValue: 172668,
    status: 'active',
    lastDepreciationDate: '2025-11-30',
    impairmentLoss: 0,
    recoverableAmount: null,
    policyApplied: 'POL-005',
    policyVersion: '1.0',
  },
];

// Pending policy change requests
const pendingPolicyChanges = [
  {
    id: 'PCR-001',
    policyId: 'POL-006',
    category: 'IT Equipment',
    changeType: 'Useful Life',
    currentValue: '3 years',
    proposedValue: '4 years',
    reason: 'Extended hardware support contracts now available',
    requestedBy: 'IT Manager',
    requestDate: '2025-12-05',
    status: 'pending',
    approvers: ['Finance Manager', 'CFO'],
    approvalStatus: [{ name: 'Finance Manager', status: 'approved', date: '2025-12-08' }],
  },
];

const AssetsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPolicyChangeModal, setShowPolicyChangeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPolicy, setSelectedPolicy] = useState<AssetPolicy | null>(null);
  const [addAssetForm] = Form.useForm();
  const [loading, setLoading] = useState(true);

  // State for API data
  const [assetStats, setAssetStats] = useState<AssetStats>({
    totalAssets: 0,
    totalCost: 0,
    totalNBV: 0,
    accumulatedDepreciation: 0,
    assetsFullyDepreciated: 0,
    assetsDueForReview: 0,
    pendingDisposals: 0,
    impairedAssets: 0,
    monthlyDepreciation: 0,
    categories: 0,
  });
  const [assetRegister, setAssetRegister] = useState<Asset[]>([]);
  const [assetPolicies, setAssetPolicies] = useState<AssetPolicy[]>([]);

  // Fetch assets data from API
  useEffect(() => {
    const fetchAssetsData = async () => {
      setLoading(true);
      try {
        const [statsRes, assetsRes, policiesRes] = await Promise.all([
          apiClient.get('/api/assets/stats').catch(() => ({ data: null })),
          apiClient.get('/api/assets/register').catch(() => ({ data: [] })),
          apiClient.get('/api/assets/policies').catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) {
          setAssetStats(statsRes.data.data || statsRes.data);
        }
        setAssetRegister(assetsRes.data?.data || assetsRes.data || []);
        setAssetPolicies(policiesRes.data?.data || policiesRes.data || []);
      } catch (error) {
        console.error('Error fetching assets data:', error);
        message.error('Failed to load assets data');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetsData();
  }, []);

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA')}`;

  const getCategoryIcon = (code: string) => {
    const icons: Record<string, React.ReactNode> = {
      'LAND': <HomeOutlined />,
      'BLDG': <BankOutlined />,
      'MACH': <ToolOutlined />,
      'VEHI': <CarOutlined />,
      'OFEQ': <AppstoreOutlined />,
      'ITEQ': <DesktopOutlined />,
      'FURN': <AppstoreOutlined />,
      'LHLD': <HomeOutlined />,
    };
    return icons[code] || <AppstoreOutlined />;
  };

  const getStatusTag = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      'active': { color: 'green', text: 'Active', icon: <CheckCircleOutlined /> },
      'disposed': { color: 'default', text: 'Disposed' },
      'impaired': { color: 'orange', text: 'Impaired', icon: <WarningOutlined /> },
      'fully_depreciated': { color: 'purple', text: 'Fully Depreciated' },
      'under_construction': { color: 'blue', text: 'Under Construction', icon: <ClockCircleOutlined /> },
      'pending_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'superseded': { color: 'default', text: 'Superseded' },
    };
    const config = configs[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // When category changes, auto-populate policy fields
  const handleCategoryChange = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
    const policy = assetPolicies.find(p => p.categoryCode === categoryCode);
    if (policy) {
      setSelectedPolicy(policy);
      addAssetForm.setFieldsValue({
        usefulLifeYears: policy.usefulLifeYears,
        residualValuePercent: policy.residualValuePercent,
        depreciationMethod: policy.depreciationMethod,
      });
      message.info(`Policy applied: ${policy.category} - ${policy.usefulLifeYears} years ${policy.depreciationMethod.replace('_', ' ')}`);
    }
  };

  const assetColumns = [
    {
      title: 'Asset Number',
      dataIndex: 'assetNumber',
      key: 'assetNumber',
      render: (text: string, record: Asset) => (
        <Space>
          {getCategoryIcon(record.categoryCode)}
          <Text strong style={{ color: '#667eea' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (v: number) => formatCurrency(v),
      align: 'right' as const,
    },
    {
      title: 'Acc. Depr.',
      dataIndex: 'accumulatedDepreciation',
      key: 'accumulatedDepreciation',
      render: (v: number) => <Text type="secondary">{formatCurrency(v)}</Text>,
      align: 'right' as const,
    },
    {
      title: 'NBV',
      dataIndex: 'carryingValue',
      key: 'carryingValue',
      render: (v: number) => <Text strong style={{ color: '#10b981' }}>{formatCurrency(v)}</Text>,
      align: 'right' as const,
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
      render: (_: unknown, record: Asset) => (
        <Space>
          <Tooltip title="View Details"><Button type="link" size="small" icon={<FileTextOutlined />} /></Tooltip>
          <Tooltip title="Depreciation Schedule"><Button type="link" size="small" icon={<CalculatorOutlined />} /></Tooltip>
        </Space>
      ),
    },
  ];

  const policyColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string, record: AssetPolicy) => (
        <Space>
          {getCategoryIcon(record.categoryCode)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Useful Life',
      dataIndex: 'usefulLifeYears',
      key: 'usefulLifeYears',
      render: (years: number) => years === 0 ? <Tag color="blue">Not Depreciated</Tag> : `${years} years`,
    },
    {
      title: 'Residual %',
      dataIndex: 'residualValuePercent',
      key: 'residualValuePercent',
      render: (v: number) => `${v}%`,
    },
    {
      title: 'Method',
      dataIndex: 'depreciationMethod',
      key: 'depreciationMethod',
      render: (method: string) => {
        const labels: Record<string, string> = {
          'straight_line': 'Straight Line',
          'reducing_balance': 'Reducing Balance',
          'units_of_production': 'Units of Production',
        };
        return labels[method] || method;
      },
    },
    {
      title: 'SARS Rate',
      dataIndex: 'sarsWearAndTear',
      key: 'sarsWearAndTear',
      render: (rate: number | undefined) => rate ? `${rate}%` : '-',
    },
    {
      title: 'IAS 16 Ref',
      dataIndex: 'ias16Reference',
      key: 'ias16Reference',
      render: (ref: string) => <Tooltip title={ref}><Tag color="blue">IAS 16</Tag></Tooltip>,
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
      render: (_: unknown, record: AssetPolicy) => (
        <Space>
          <Tooltip title="Request Change">
            <Button 
              type="link" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedPolicy(record);
                setShowPolicyChangeModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="View History">
            <Button type="link" size="small" icon={<HistoryOutlined />} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChartOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            {/* Asset Value Summary */}
            <Card style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={6}>
                  <Statistic
                    title="Total Cost"
                    value={assetStats.totalCost}
                    prefix="R"
                    valueStyle={{ color: '#667eea' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Accumulated Depreciation"
                    value={assetStats.accumulatedDepreciation}
                    prefix="R"
                    valueStyle={{ color: '#ef4444' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Net Book Value"
                    value={assetStats.totalNBV}
                    prefix="R"
                    valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Monthly Depreciation"
                    value={assetStats.monthlyDepreciation}
                    prefix="R"
                    suffix="/mo"
                    valueStyle={{ color: '#f59e0b' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* IAS 16 Compliance Alert */}
            <Alert
              message="IAS 16 Compliance Status"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Text><CheckCircleOutlined style={{ color: '#10b981' }} /> Recognition criteria applied</Text>
                    </Col>
                    <Col span={8}>
                      <Text><CheckCircleOutlined style={{ color: '#10b981' }} /> Cost model measurement</Text>
                    </Col>
                    <Col span={8}>
                      <Text><CheckCircleOutlined style={{ color: '#10b981' }} /> Systematic depreciation</Text>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Text><CheckCircleOutlined style={{ color: '#10b981' }} /> Component depreciation active</Text>
                    </Col>
                    <Col span={8}>
                      <Text><WarningOutlined style={{ color: '#f59e0b' }} /> {assetStats.assetsDueForReview} assets due for review</Text>
                    </Col>
                    <Col span={8}>
                      <Text><ExclamationCircleOutlined style={{ color: '#ef4444' }} /> {assetStats.impairedAssets} assets impaired</Text>
                    </Col>
                  </Row>
                </Space>
              }
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 24 }}
            />

            {/* Recent Assets */}
            <Card 
              title="Asset Register"
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} onClick={() => setShowAddAssetModal(true)}>Add Asset</Button>
                  <Button type="link">View All</Button>
                </Space>
              }
            >
              <Table
                dataSource={assetRegister}
                columns={assetColumns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>

          <Col span={8}>
            {/* Key Metrics */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Total Assets"
                    value={assetStats.totalAssets}
                    prefix={<AppstoreOutlined style={{ color: '#667eea' }} />}
                    valueStyle={{ color: '#667eea' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Fully Depreciated"
                    value={assetStats.assetsFullyDepreciated}
                    prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                    valueStyle={{ color: '#64748b' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Quick Actions */}
            <QuickActionsCard
              title="Quick Actions"
              actions={[
                { icon: <PlusOutlined />, label: 'Add Asset', onClick: () => setShowAddAssetModal(true) },
                { icon: <CalculatorOutlined />, label: 'Run Depreciation' },
                { icon: <SwapOutlined />, label: 'Transfer Asset' },
                { icon: <AuditOutlined />, label: 'Impairment Test' },
              ]}
            />

            {/* Pending Approvals */}
            {pendingPolicyChanges.length > 0 && (
              <Card 
                title={
                  <Space>
                    <LockOutlined style={{ color: '#f59e0b' }} />
                    Pending Policy Changes
                    <Badge count={pendingPolicyChanges.length} />
                  </Space>
                }
                style={{ marginTop: 24 }}
              >
                {pendingPolicyChanges.map(change => (
                  <div key={change.id} style={{ marginBottom: 16 }}>
                    <Text strong>{change.category}</Text>
                    <br />
                    <Text type="secondary">{change.changeType}: {change.currentValue} → {change.proposedValue}</Text>
                    <br />
                    <Space style={{ marginTop: 8 }}>
                      <Button type="primary" size="small">Approve</Button>
                      <Button size="small">Reject</Button>
                    </Space>
                  </div>
                ))}
              </Card>
            )}

            {/* Categories Summary */}
            <Card title="Categories" style={{ marginTop: 24 }}>
              {assetPolicies.slice(0, 5).map(policy => (
                <div key={policy.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <Space>
                    {getCategoryIcon(policy.categoryCode)}
                    <Text>{policy.category}</Text>
                  </Space>
                  <Text type="secondary">{policy.usefulLifeYears > 0 ? `${policy.usefulLifeYears}yr` : 'N/A'}</Text>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'register',
      label: 'Asset Register',
      icon: <FileTextOutlined />,
      children: (
        <Card 
          title="Full Asset Register"
          extra={
            <Space>
              <Button icon={<DownloadOutlined />}>Export</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddAssetModal(true)}>
                Add Asset
              </Button>
            </Space>
          }
        >
          <Table
            dataSource={assetRegister}
            columns={assetColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'depreciation',
      label: 'Depreciation',
      icon: <CalculatorOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Depreciation Schedule">
              <Alert
                message="Monthly Depreciation Run"
                description="Depreciation is calculated automatically at month-end based on category policies. Manual runs can be triggered for adjustments."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                dataSource={assetRegister.filter(a => a.status === 'active')}
                columns={[
                  { title: 'Asset', dataIndex: 'description', key: 'description' },
                  { title: 'Method', dataIndex: 'depreciationMethod', key: 'depreciationMethod' },
                  { title: 'Monthly', dataIndex: 'monthlyDepreciation', key: 'monthlyDepreciation', render: (v: number) => formatCurrency(v), align: 'right' as const },
                  { title: 'Accumulated', dataIndex: 'accumulatedDepreciation', key: 'accumulatedDepreciation', render: (v: number) => formatCurrency(v), align: 'right' as const },
                  { title: 'NBV', dataIndex: 'carryingValue', key: 'carryingValue', render: (v: number) => <Text strong>{formatCurrency(v)}</Text>, align: 'right' as const },
                  { 
                    title: 'Progress', 
                    key: 'progress',
                    render: (_: unknown, record: Asset) => {
                      const percent = Math.round((record.accumulatedDepreciation / (record.totalCost - record.residualValue)) * 100);
                      return <Progress percent={percent} size="small" strokeColor="#667eea" />;
                    },
                  },
                ]}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Run Depreciation">
              <Form layout="vertical">
                <Form.Item label="Period">
                  <DatePicker.MonthPicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item label="Scope">
                  <Select defaultValue="all">
                    <Select.Option value="all">All Assets</Select.Option>
                    <Select.Option value="category">By Category</Select.Option>
                    <Select.Option value="selected">Selected Assets</Select.Option>
                  </Select>
                </Form.Item>
                <Button type="primary" block icon={<CalculatorOutlined />}>
                  Calculate Depreciation
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'policies',
      label: 'Policies',
      icon: <FileProtectOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={24}>
            <Alert
              message="IAS 16 Depreciation Policies"
              description={
                <Space direction="vertical">
                  <Text>These policies are automatically applied to new assets based on their category. <strong>Policy changes require management approval</strong> to ensure compliance.</Text>
                  <Text type="secondary">IAS 16.50: The useful life of an asset shall be reviewed at least at each financial year-end.</Text>
                </Space>
              }
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 24 }}
            />

            <Card 
              title={
                <Space>
                  <LockOutlined />
                  Asset Category Policies
                </Space>
              }
              extra={
                <Space>
                  <Tag color="blue">IAS 16 Compliant</Tag>
                  <Tag color="green">SARS Aligned</Tag>
                </Space>
              }
            >
              <Table
                dataSource={assetPolicies}
                columns={policyColumns}
                rowKey="id"
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'impairment',
      label: 'Impairment',
      icon: <WarningOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="IAS 36 Impairment Testing">
              <Alert
                message="Impairment Indicators"
                description="Assets should be tested for impairment when there are indicators that the carrying amount may not be recoverable (IAS 36)."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <List
                header={<Text strong>Assets Requiring Review</Text>}
                bordered
                dataSource={[
                  { asset: 'CNC Milling Machine - Haas VF-2', indicator: 'Market value decline', action: 'Calculate recoverable amount' },
                  { asset: 'Dell PowerEdge R750 Server', indicator: 'Technology obsolescence', action: 'Review useful life' },
                ]}
                renderItem={item => (
                  <List.Item
                    actions={[<Button type="primary" size="small" key="test">Test Impairment</Button>]}
                  >
                    <List.Item.Meta
                      title={item.asset}
                      description={
                        <Space>
                          <Tag color="orange">{item.indicator}</Tag>
                          <Text type="secondary">{item.action}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Impairment Calculation">
              <Form layout="vertical">
                <Form.Item label="Select Asset">
                  <Select placeholder="Choose asset">
                    {assetRegister.map(a => (
                      <Select.Option key={a.id} value={a.id}>{a.description}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Fair Value Less Costs to Sell">
                  <InputNumber style={{ width: '100%' }} prefix="R" />
                </Form.Item>
                <Form.Item label="Value in Use">
                  <InputNumber style={{ width: '100%' }} prefix="R" />
                </Form.Item>
                <Button type="primary" block>Calculate Recoverable Amount</Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'disposals',
      label: 'Disposals',
      icon: <DeleteOutlined />,
      children: (
        <Card title="Asset Disposals & Derecognition">
          <Alert
            message="IAS 16.67 - Derecognition"
            description="An asset shall be derecognized on disposal or when no future economic benefits are expected from its use or disposal."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button type="primary" icon={<PlusOutlined />}>Record Disposal</Button>
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
            <Card title="General Settings">
              <Form layout="vertical">
                <Form.Item label="Asset Number Prefix">
                  <Input defaultValue="AST-" />
                </Form.Item>
                <Form.Item label="Depreciation Run Schedule">
                  <Select defaultValue="month_end">
                    <Select.Option value="month_end">Month End</Select.Option>
                    <Select.Option value="daily">Daily</Select.Option>
                    <Select.Option value="manual">Manual Only</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Default Measurement Model">
                  <Select defaultValue="cost">
                    <Select.Option value="cost">Cost Model (IAS 16.30)</Select.Option>
                    <Select.Option value="revaluation">Revaluation Model (IAS 16.31)</Select.Option>
                  </Select>
                </Form.Item>
                <Button type="primary">Save Settings</Button>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Policy Change Workflow">
              <Alert
                message="Approval Required"
                description="Changes to depreciation policies require approval from designated approvers to maintain IAS 16 compliance and audit trail."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form layout="vertical">
                <Form.Item label="Required Approvers">
                  <Select mode="multiple" defaultValue={['finance_manager', 'cfo']}>
                    <Select.Option value="finance_manager">Finance Manager</Select.Option>
                    <Select.Option value="cfo">CFO</Select.Option>
                    <Select.Option value="ceo">CEO</Select.Option>
                    <Select.Option value="audit_committee">Audit Committee</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Approval Threshold">
                  <Select defaultValue="all">
                    <Select.Option value="all">All Approvers Required</Select.Option>
                    <Select.Option value="any">Any One Approver</Select.Option>
                    <Select.Option value="majority">Majority</Select.Option>
                  </Select>
                </Form.Item>
                <Button type="primary">Save Workflow</Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <HubLayout>
      <HubHeader
        title="Asset Management"
        subtitle="IAS 16 Compliant Fixed Asset Register & Depreciation"
        icon={<BankOutlined />}
        gradient="green"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Sync</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddAssetModal(true)}>
              Add Asset
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="green"
        icon={<SafetyCertificateOutlined />}
        title="Asset Portfolio"
        subtitle="IAS 16 & SARS Compliant"
        stats={[
          { title: 'Total Assets', value: assetStats.totalAssets, span: 3 },
          { title: 'Total Cost', value: assetStats.totalCost, prefix: 'R', span: 4 },
          { title: 'Net Book Value', value: assetStats.totalNBV, prefix: 'R', valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Monthly Depr.', value: assetStats.monthlyDepreciation, prefix: 'R', span: 4 },
          { title: 'Categories', value: assetStats.categories, span: 3 },
        ]}
      />

      <HubTabs 
        theme="green"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* Add Asset Modal - With Policy Auto-Application */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            Add New Asset
            <Tag color="blue">IAS 16 Compliant</Tag>
          </Space>
        }
        open={showAddAssetModal}
        onCancel={() => {
          setShowAddAssetModal(false);
          addAssetForm.resetFields();
          setSelectedPolicy(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowAddAssetModal(false)}>Cancel</Button>,
          <Button key="create" type="primary" onClick={() => {
            message.success('Asset created with policy automatically applied');
            setShowAddAssetModal(false);
            addAssetForm.resetFields();
          }}>
            Create Asset
          </Button>
        ]}
        width={800}
      >
        <Alert
          message="Policy Auto-Application"
          description="Select a category to automatically apply the approved depreciation policy. Policies ensure IAS 16 compliance across all assets."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={addAssetForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Asset Category" name="category" required>
                <Select 
                  placeholder="Select category" 
                  onChange={handleCategoryChange}
                >
                  {assetPolicies.map(p => (
                    <Select.Option key={p.categoryCode} value={p.categoryCode}>
                      <Space>{getCategoryIcon(p.categoryCode)} {p.category}</Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Asset Number" name="assetNumber">
                <Input placeholder="Auto-generated" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description" required>
            <Input placeholder="Enter asset description" />
          </Form.Item>

          <Divider orientation="left">IAS 16 Initial Measurement</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Purchase Price" name="purchasePrice" required>
                <InputNumber 
                  style={{ width: '100%' }} 
                  prefix="R"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label={
                  <Tooltip title="IAS 16.16(b) - Costs directly attributable to bringing the asset to working condition">
                    Directly Attributable Costs <SafetyCertificateOutlined />
                  </Tooltip>
                } 
                name="attributableCosts"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  prefix="R"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                label={
                  <Tooltip title="IAS 16.16(c) - Estimated costs of dismantling and removing the asset">
                    Dismantling Costs <SafetyCertificateOutlined />
                  </Tooltip>
                } 
                name="dismantlingCosts"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  prefix="R"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Acquisition Date" name="acquisitionDate" required>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Location" name="location">
                <Input placeholder="Asset location" />
              </Form.Item>
            </Col>
          </Row>

          {selectedPolicy && (
            <>
              <Divider orientation="left">
                <Space>
                  <LockOutlined />
                  Applied Policy (Auto-Inherited)
                </Space>
              </Divider>
              
              <Card size="small" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <Descriptions size="small" column={3}>
                  <Descriptions.Item label="Category">{selectedPolicy.category}</Descriptions.Item>
                  <Descriptions.Item label="Useful Life">{selectedPolicy.usefulLifeYears} years</Descriptions.Item>
                  <Descriptions.Item label="Residual Value">{selectedPolicy.residualValuePercent}%</Descriptions.Item>
                  <Descriptions.Item label="Method">{selectedPolicy.depreciationMethod.replace('_', ' ')}</Descriptions.Item>
                  <Descriptions.Item label="SARS Rate">{selectedPolicy.sarsWearAndTear}%</Descriptions.Item>
                  <Descriptions.Item label="IAS 16 Ref">{selectedPolicy.ias16Reference}</Descriptions.Item>
                </Descriptions>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  <LockOutlined /> Policy locked. Changes require management approval.
                </Text>
              </Card>
            </>
          )}
        </Form>
      </Modal>

      {/* Policy Change Request Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Request Policy Change
            <Tag color="orange">Requires Approval</Tag>
          </Space>
        }
        open={showPolicyChangeModal}
        onCancel={() => setShowPolicyChangeModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPolicyChangeModal(false)}>Cancel</Button>,
          <Button key="submit" type="primary" onClick={() => {
            message.success('Policy change request submitted for approval');
            setShowPolicyChangeModal(false);
          }}>
            Submit for Approval
          </Button>
        ]}
        width={600}
      >
        <Alert
          message="Management Approval Required"
          description="Changes to depreciation policies affect financial statements and require approval from Finance Manager and CFO per IAS 16.51."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {selectedPolicy && (
          <Form layout="vertical">
            <Form.Item label="Category">
              <Input value={selectedPolicy.category} disabled />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Current Useful Life">
                  <Input value={`${selectedPolicy.usefulLifeYears} years`} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Proposed Useful Life" required>
                  <InputNumber style={{ width: '100%' }} suffix="years" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Current Residual Value">
                  <Input value={`${selectedPolicy.residualValuePercent}%`} disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Proposed Residual Value">
                  <InputNumber style={{ width: '100%' }} suffix="%" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Reason for Change" required>
              <Input.TextArea 
                rows={3} 
                placeholder="Provide justification per IAS 16.51 - change in expected pattern of consumption, technical obsolescence, etc."
              />
            </Form.Item>

            <Form.Item label="Supporting Documentation">
              <Button icon={<DownloadOutlined />}>Attach Evidence</Button>
            </Form.Item>

            <Divider />
            
            <Text strong>Approval Workflow:</Text>
            <Timeline style={{ marginTop: 12 }}>
              <Timeline.Item color="blue">Finance Manager Review</Timeline.Item>
              <Timeline.Item color="gray">CFO Approval</Timeline.Item>
              <Timeline.Item color="gray">Policy Updated & Applied</Timeline.Item>
            </Timeline>
          </Form>
        )}
      </Modal>
    </HubLayout>
  );
};

export default AssetsHub;
