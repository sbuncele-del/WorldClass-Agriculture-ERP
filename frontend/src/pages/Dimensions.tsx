import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Typography, Table, Tag, Space, Modal, Form, Input, Select, message, Statistic } from 'antd';
import {
  AppstoreOutlined,
  BankOutlined,
  ProjectOutlined,
  ShoppingOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
} from '../components/hub';

const { Text, Paragraph } = Typography;

interface DimensionSummary {
  cost_centers: number;
  departments: number;
  projects: number;
  products: number;
  locations: number;
}

interface DimensionItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

const Dimensions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cost-centers');
  const [summary, setSummary] = useState<DimensionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [costCenters, setCostCenters] = useState<DimensionItem[]>([]);
  const [departments, setDepartments] = useState<DimensionItem[]>([]);
  const [projects, setProjects] = useState<DimensionItem[]>([]);
  const [products, setProducts] = useState<DimensionItem[]>([]);
  const [locations, setLocations] = useState<DimensionItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSummary();
    fetchAllDimensions();
  }, []);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch('/api/financial/dimensions/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchAllDimensions = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const [ccRes, deptRes, projRes, prodRes, locRes] = await Promise.all([
        fetch('/api/financial/dimensions/cost-centers', { headers }),
        fetch('/api/financial/dimensions/departments', { headers }),
        fetch('/api/financial/dimensions/projects', { headers }),
        fetch('/api/financial/dimensions/products', { headers }),
        fetch('/api/financial/dimensions/locations', { headers }),
      ]);
      
      const ccData = await ccRes.json();
      const deptData = await deptRes.json();
      const projData = await projRes.json();
      const prodData = await prodRes.json();
      const locData = await locRes.json();
      
      if (ccData.success) setCostCenters(ccData.data || []);
      if (deptData.success) setDepartments(deptData.data || []);
      if (projData.success) setProjects(projData.data || []);
      if (prodData.success) setProducts(prodData.data || []);
      if (locData.success) setLocations(locData.data || []);
    } catch (error) {
      console.error('Error fetching dimensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = (type: string) => {
    setModalType(type);
    form.resetFields();
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      const response = await fetch(`/api/financial/dimensions/${modalType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      if (result.success) {
        message.success(`${modalType.replace('-', ' ')} created successfully`);
        setShowModal(false);
        fetchAllDimensions();
        fetchSummary();
      } else {
        message.error(result.error || 'Failed to create');
      }
    } catch (error) {
      message.error('Please fill all required fields');
    }
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Text strong style={{ color: '#667eea' }}>{text}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text type="secondary">{text || '-'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  const renderTable = (data: DimensionItem[], type: string, title: string, icon: React.ReactNode) => (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <div>
            <Text strong style={{ fontSize: 18 }}>{title}</Text>
            <br />
            <Text type="secondary">{data.length} items</Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddNew(type)}>
          Add {title.slice(0, -1)}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />
    </Card>
  );

  const tabs = [
    {
      key: 'cost-centers',
      label: 'Cost Centers',
      icon: <BankOutlined />,
      children: renderTable(costCenters, 'cost-centers', 'Cost Centers', <BankOutlined style={{ color: '#667eea' }} />),
    },
    {
      key: 'departments',
      label: 'Departments',
      icon: <AppstoreOutlined />,
      children: renderTable(departments, 'departments', 'Departments', <AppstoreOutlined style={{ color: '#10b981' }} />),
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: <ProjectOutlined />,
      children: renderTable(projects, 'projects', 'Projects', <ProjectOutlined style={{ color: '#f59e0b' }} />),
    },
    {
      key: 'products',
      label: 'Products',
      icon: <ShoppingOutlined />,
      children: renderTable(products, 'products', 'Products', <ShoppingOutlined style={{ color: '#ef4444' }} />),
    },
    {
      key: 'locations',
      label: 'Locations',
      icon: <EnvironmentOutlined />,
      children: renderTable(locations, 'locations', 'Locations', <EnvironmentOutlined style={{ color: '#8b5cf6' }} />),
    },
  ];

  return (
    <HubLayout>
      <HubHeader
        title="Financial Dimensions"
        subtitle="Manage cost centers, departments, projects, products, and locations"
        icon={<AppstoreOutlined />}
        gradient="purple"
        actions={
          <>
            <Button icon={<SyncOutlined />} onClick={() => { fetchSummary(); fetchAllDimensions(); }}>
              Refresh
            </Button>
            <Button icon={<SettingOutlined />}>Settings</Button>
          </>
        }
      />

      <StatusBanner
        gradient="purple"
        icon={<AppstoreOutlined />}
        title="Dimensions Overview"
        subtitle="Multi-dimensional tracking"
        stats={[
          { title: 'Cost Centers', value: summary?.cost_centers || 0, span: 4 },
          { title: 'Departments', value: summary?.departments || 0, span: 4 },
          { title: 'Projects', value: summary?.projects || 0, span: 4 },
          { title: 'Products', value: summary?.products || 0, span: 4 },
          { title: 'Locations', value: summary?.locations || 0, span: 4 },
        ]}
      />

      <HubTabs
        theme="purple"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      <Modal
        title={`Add New ${modalType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText="Save"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Please enter a code' }]}>
            <Input placeholder="e.g. CC001, DEPT001" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input placeholder="Enter name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default Dimensions;
