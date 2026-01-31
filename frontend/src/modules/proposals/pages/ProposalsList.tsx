import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  DatePicker,
  Avatar,
  Typography,
  Dropdown,
  Modal,
  message,
  Tooltip,
  Spin,
} from 'antd';
import apiClient from '../../../services/api';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SendOutlined,
  DownloadOutlined,
  MoreOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExclamationOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import './ProposalsList.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Proposal {
  id: string;
  title: string;
  client: string;
  clientEmail: string;
  value: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  template: string;
  owner: string;
  tags: string[];
}

const ProposalsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/api/proposals');
        setProposals(response.data || []);
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'processing';
      case 'viewed': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileTextOutlined />;
      case 'sent': return <SendOutlined />;
      case 'viewed': return <EyeOutlined />;
      case 'accepted': return <CheckCircleOutlined />;
      case 'declined': return <FileExclamationOutlined />;
      case 'expired': return <ClockCircleOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const handleDuplicate = (id: string) => {
    message.success('Proposal duplicated');
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Proposal',
      content: 'Are you sure you want to delete this proposal?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => message.success('Proposal deleted'),
    });
  };

  const handleSend = (id: string) => {
    Modal.confirm({
      title: 'Send Proposal',
      content: 'Send this proposal to the client?',
      okText: 'Send',
      onOk: () => message.success('Proposal sent'),
    });
  };

  const columns: ColumnsType<Proposal> = [
    {
      title: 'Proposal',
      key: 'proposal',
      render: (_, record) => (
        <div className="proposal-info">
          <div className="proposal-title">{record.title}</div>
          <div className="proposal-tags">
            {record.tags.slice(0, 2).map((tag) => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </div>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => (
        <div className="client-info">
          <Avatar size="small">{record.client[0]}</Avatar>
          <div>
            <div className="client-name">{record.client}</div>
            <Text type="secondary" className="client-email">{record.clientEmail}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => <Text strong>${value.toLocaleString()}</Text>,
      sorter: (a, b) => a.value - b.value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Sent', value: 'sent' },
        { text: 'Viewed', value: 'viewed' },
        { text: 'Accepted', value: 'accepted' },
        { text: 'Declined', value: 'declined' },
        { text: 'Expired', value: 'expired' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
      render: (template) => <Tag>{template}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          { 
            key: 'preview', 
            label: 'Preview', 
            icon: <EyeOutlined />,
            onClick: () => navigate(`/proposals/preview/${record.id}`),
          },
          { 
            key: 'edit', 
            label: 'Edit', 
            icon: <EditOutlined />,
            onClick: () => navigate(`/proposals/edit/${record.id}`),
          },
          { 
            key: 'duplicate', 
            label: 'Duplicate', 
            icon: <CopyOutlined />,
            onClick: () => handleDuplicate(record.id),
          },
          { type: 'divider' },
          { 
            key: 'download', 
            label: 'Download PDF', 
            icon: <DownloadOutlined />,
          },
          ...(record.status === 'draft' ? [
            { 
              key: 'send', 
              label: 'Send to Client', 
              icon: <SendOutlined />,
              onClick: () => handleSend(record.id),
            },
          ] : []),
          { type: 'divider' },
          { 
            key: 'delete', 
            label: 'Delete', 
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Space>
            <Tooltip title="Preview">
              <Button 
                type="text" 
                icon={<EyeOutlined />}
                onClick={() => navigate(`/proposals/preview/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button 
                type="text" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/proposals/edit/${record.id}`)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.client.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="proposals-list">
      <div className="page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>All Proposals</Title>
          <Text type="secondary">{proposals.length} total proposals</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/proposals/new')}
        >
          Create Proposal
        </Button>
      </div>

      <Card>
        <div className="filters-row">
          <Space wrap>
            <Input
              placeholder="Search proposals..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'sent', label: 'Sent' },
                { value: 'viewed', label: 'Viewed' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'declined', label: 'Declined' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <RangePicker placeholder={['Start Date', 'End Date']} />
          </Space>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Text>{selectedRowKeys.length} selected</Text>
              <Button size="small">Export</Button>
              <Button size="small" danger>Delete</Button>
            </Space>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={filteredProposals}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} proposals`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default ProposalsList;
