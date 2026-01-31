import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Space,
  message,
  Tooltip,
  Typography,
  Row,
  Col,
  Statistic,
  Switch,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id: number | null;
  level: number;
  is_header: boolean;
  normal_balance: string;
  description: string;
  is_active: boolean;
  current_balance?: number;
}

const accountTypes = [
  { value: 'ASSET', label: 'Asset', color: 'blue' },
  { value: 'LIABILITY', label: 'Liability', color: 'red' },
  { value: 'EQUITY', label: 'Equity', color: 'purple' },
  { value: 'REVENUE', label: 'Revenue', color: 'green' },
  { value: 'EXPENSE', label: 'Expense', color: 'orange' },
];

const ChartOfAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/financial/chart-of-accounts', {
        headers: getAuthHeaders(),
      });
      const result = await response.json();
      if (result.success) {
        // Map API response to expected format
        const mappedAccounts = (result.data || []).map((acc: any) => ({
          id: acc.id,
          account_code: acc.account_number || acc.account_code || acc.code,
          account_name: acc.name || acc.account_name,
          account_type: (acc.account_type || 'ASSET').toUpperCase(),
          parent_id: acc.parent_id,
          level: acc.level || 1,
          is_header: acc.is_header || false,
          normal_balance: (acc.normal_balance || 'DEBIT').toUpperCase(),
          description: acc.description || '',
          is_active: acc.is_active !== false,
          current_balance: parseFloat(acc.balance || acc.current_balance || 0),
        }));
        setAccounts(mappedAccounts);
      } else {
        message.error(result.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      message.error('Failed to fetch accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (values: any) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/v2/financial/chart-of-accounts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          account_code: values.account_code,
          account_name: values.account_name,
          account_type: values.account_type,
          parent_id: values.parent_id || null,
          is_header: values.is_header || false,
          normal_balance: values.normal_balance || (
            ['ASSET', 'EXPENSE'].includes(values.account_type) ? 'DEBIT' : 'CREDIT'
          ),
          description: values.description || '',
          opening_balance: values.opening_balance || 0,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        message.success('Account created successfully!');
        setShowAddModal(false);
        form.resetFields();
        fetchAccounts();
      } else {
        message.error(result.message || 'Failed to create account');
      }
    } catch (err) {
      message.error('Failed to create account');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAccount = async (values: any) => {
    if (!editingAccount) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/v2/financial/chart-of-accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          account_name: values.account_name,
          description: values.description,
          is_active: values.is_active,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        message.success('Account updated successfully!');
        setShowEditModal(false);
        editForm.resetFields();
        setEditingAccount(null);
        fetchAccounts();
      } else {
        message.error(result.message || 'Failed to update account');
      }
    } catch (err) {
      message.error('Failed to update account');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    editForm.setFieldsValue({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      description: account.description,
      is_active: account.is_active,
    });
    setShowEditModal(true);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || account.account_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: accounts.length,
    assets: accounts.filter(a => a.account_type === 'ASSET').length,
    liabilities: accounts.filter(a => a.account_type === 'LIABILITY').length,
    equity: accounts.filter(a => a.account_type === 'EQUITY').length,
    revenue: accounts.filter(a => a.account_type === 'REVENUE').length,
    expenses: accounts.filter(a => a.account_type === 'EXPENSE').length,
  };

  const columns = [
    {
      title: 'Code',
      dataIndex: 'account_code',
      key: 'account_code',
      width: 120,
      render: (code: string, record: Account) => (
        <Space>
          {record.is_header ? <FolderOutlined style={{ color: '#1890ff' }} /> : <FileOutlined style={{ color: '#52c41a' }} />}
          <Text strong style={{ fontFamily: 'monospace' }}>{code}</Text>
        </Space>
      ),
    },
    {
      title: 'Account Name',
      dataIndex: 'account_name',
      key: 'account_name',
      render: (name: string, record: Account) => (
        <span style={{ paddingLeft: `${(record.level - 1) * 20}px` }}>
          {record.is_header ? <Text strong>{name}</Text> : name}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'account_type',
      key: 'account_type',
      width: 120,
      render: (type: string) => {
        const typeInfo = accountTypes.find(t => t.value === type);
        return <Tag color={typeInfo?.color}>{typeInfo?.label || type}</Tag>;
      },
    },
    {
      title: 'Normal Balance',
      dataIndex: 'normal_balance',
      key: 'normal_balance',
      width: 120,
      render: (balance: string) => (
        <Tag color={balance === 'DEBIT' ? 'blue' : 'green'}>{balance}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Account) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const headerAccounts = accounts.filter(a => a.is_header);

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/app/financial')}>
              Back to Financial Hub
            </Button>
            <Title level={3} style={{ margin: 0 }}>📖 Chart of Accounts</Title>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchAccounts}>Refresh</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
              Add Account
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Accounts" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Assets" value={stats.assets} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Liabilities" value={stats.liabilities} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Equity" value={stats.equity} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Revenue" value={stats.revenue} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Expenses" value={stats.expenses} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search by code or name..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              value={filterType}
              onChange={setFilterType}
            >
              <Option value="ALL">All Types</Option>
              {accountTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Accounts Table */}
      <Card>
        <Table
          dataSource={filteredAccounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} accounts` }}
          size="small"
        />
      </Card>

      {/* Add Account Modal */}
      <Modal
        title="➕ Add New Account"
        open={showAddModal}
        onCancel={() => { setShowAddModal(false); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddAccount}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="account_code"
                label="Account Code"
                rules={[{ required: true, message: 'Account code is required' }]}
              >
                <Input placeholder="e.g., 1000, 2100, 4000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="account_type"
                label="Account Type"
                rules={[{ required: true, message: 'Account type is required' }]}
              >
                <Select placeholder="Select type">
                  {accountTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="account_name"
            label="Account Name"
            rules={[{ required: true, message: 'Account name is required' }]}
          >
            <Input placeholder="e.g., Cash in Bank, Accounts Receivable" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="parent_id" label="Parent Account (Optional)">
                <Select placeholder="Select parent (for sub-accounts)" allowClear>
                  {headerAccounts.map(acc => (
                    <Option key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="normal_balance" label="Normal Balance">
                <Select placeholder="Auto-determined by type">
                  <Option value="DEBIT">Debit</Option>
                  <Option value="CREDIT">Credit</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="opening_balance" label="Opening Balance">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  precision={2}
                  formatter={(value) => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/R\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_header" label="Header Account?" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional description" />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col><Button onClick={() => setShowAddModal(false)}>Cancel</Button></Col>
            <Col><Button type="primary" htmlType="submit" loading={submitting}>Create Account</Button></Col>
          </Row>
        </Form>
      </Modal>

      {/* Edit Account Modal */}
      <Modal
        title="✏️ Edit Account"
        open={showEditModal}
        onCancel={() => { setShowEditModal(false); editForm.resetFields(); setEditingAccount(null); }}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditAccount}>
          <Form.Item name="account_code" label="Account Code">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="account_name"
            label="Account Name"
            rules={[{ required: true, message: 'Account name is required' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="account_type" label="Account Type">
            <Select disabled>
              {accountTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Row justify="end" gutter={8}>
            <Col><Button onClick={() => setShowEditModal(false)}>Cancel</Button></Col>
            <Col><Button type="primary" htmlType="submit" loading={submitting}>Save Changes</Button></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ChartOfAccountsPage;
