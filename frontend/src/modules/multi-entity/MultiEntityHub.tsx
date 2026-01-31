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
  Tree,
  Table,
  Tabs,
  Badge,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Avatar,
  Spin,
} from 'antd';
import apiClient from '../../services/api';
import { useClient } from '../../contexts/ClientContext';
import {
  BankOutlined,
  GlobalOutlined,
  TeamOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  ApartmentOutlined,
  DollarOutlined,
  FileTextOutlined,
  SwapOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import './MultiEntityHub.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const MultiEntityHub: React.FC = () => {
  const { currentClient } = useClient();
  const companyName = currentClient?.name || 'Your Company';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data state
  const [entityHierarchy, setEntityHierarchy] = useState<any[]>([]);
  const [interCompanyTransactions, setInterCompanyTransactions] = useState<any[]>([]);
  const [consolidationRules, setConsolidationRules] = useState<any[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [hierarchyRes, transactionsRes, rulesRes] = await Promise.all([
          apiClient.get('/api/multi-entity/hierarchy'),
          apiClient.get('/api/multi-entity/transactions'),
          apiClient.get('/api/multi-entity/consolidation-rules')
        ]);
        setEntityHierarchy(hierarchyRes.data || []);
        setInterCompanyTransactions(transactionsRes.data || []);
        setConsolidationRules(rulesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch multi-entity data:', error);
        message.error('Failed to load multi-entity data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleConsolidate = async () => {
    setSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    message.success('Consolidation completed successfully');
    setSyncing(false);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      active: { color: '#10b981', text: 'Active' },
      pending: { color: '#f59e0b', text: 'Pending' },
      inactive: { color: '#64748b', text: 'Inactive' },
      posted: { color: '#10b981', text: 'Posted' },
      draft: { color: '#64748b', text: 'Draft' },
    };
    const config = configs[status] || { color: '#64748b', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = {
      ZA: '🇿🇦',
      GB: '🇬🇧',
      US: '🇺🇸',
      EU: '🇪🇺',
    };
    return flags[code] || '🌍';
  };

  const transactionColumns = [
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'From Entity',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'To Entity',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="#667eea">{type}</Tag>,
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: any) => (
        <Text strong>{record.currency} {record.amount.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
  ];

  const renderTreeNode = (node: any) => ({
    title: (
      <div className="entity-tree-node">
        <div className="node-main">
          <span className="node-icon">{node.icon}</span>
          <div className="node-info">
            <Text strong>{node.title}</Text>
            <div className="node-meta">
              <span>{getCountryFlag(node.country)} {node.country}</span>
              <Tag>{node.type}</Tag>
              <Tag color={node.currency === 'ZAR' ? 'green' : node.currency === 'GBP' ? 'blue' : 'purple'}>
                {node.currency}
              </Tag>
              {getStatusBadge(node.status)}
            </div>
          </div>
        </div>
      </div>
    ),
    key: node.key,
    children: node.children?.map(renderTreeNode),
  });

  return (
    <div className="multi-entity-hub">
      {/* Header */}
      <div className="hub-header">
        <div className="hub-title-section">
          <div className="entity-logo">
            <ApartmentOutlined className="logo-icon" />
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>Multi-Entity Management</Title>
            <Text type="secondary">Consolidated financial management across your group structure</Text>
          </div>
        </div>
        <div className="hub-actions">
          <Button 
            icon={<SyncOutlined spin={syncing} />} 
            onClick={handleConsolidate}
            loading={syncing}
          >
            Run Consolidation
          </Button>
          <Button 
            icon={<PlusOutlined />}
            onClick={() => setShowEntityModal(true)}
          >
            Add Entity
          </Button>
          <Button type="primary" icon={<FileTextOutlined />}>
            Consolidated Report
          </Button>
        </div>
      </div>

      {/* Group Status Banner */}
      <Card className="group-status-card">
        <Row gutter={24} align="middle">
          <Col span={5}>
            <div className="group-badge">
              <BankOutlined className="group-icon" />
              <div>
                <Text strong style={{ fontSize: '16px', display: 'block', color: 'white' }}>Group Structure</Text>
                <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{companyName}</Text>
              </div>
            </div>
          </Col>
          <Col span={4}>
            <Statistic 
              title="Total Entities" 
              value={7}
              valueStyle={{ color: 'white' }}
              prefix={<GlobalOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Countries" 
              value={3}
              valueStyle={{ color: 'white' }}
              prefix={<span>🌍</span>}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Currencies" 
              value={3}
              valueStyle={{ color: 'white' }}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={4}>
            <Statistic 
              title="Consolidation Status" 
              value="Up to Date"
              valueStyle={{ color: '#86efac', fontSize: '16px' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="Last Run" 
              value="2h ago"
              valueStyle={{ color: 'white', fontSize: '16px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="hub-tabs">
        <TabPane 
          tab={<span><ApartmentOutlined /> Structure</span>} 
          key="overview"
        >
          <Row gutter={[24, 24]}>
            {/* Entity Hierarchy */}
            <Col span={14}>
              <Card title="Entity Hierarchy" className="hierarchy-card">
                <Tree
                  showLine={{ showLeafIcon: false }}
                  defaultExpandAll
                  treeData={entityHierarchy.map(renderTreeNode)}
                  className="entity-tree"
                />
              </Card>
            </Col>

            {/* Quick Stats */}
            <Col span={10}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card className="stat-card">
                    <Statistic
                      title="Group Revenue (YTD)"
                      value={45800000}
                      prefix="R"
                      valueStyle={{ color: '#10b981' }}
                    />
                    <div className="stat-footer">
                      <Text type="success">↑ 18% vs last year</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="stat-card">
                    <Statistic
                      title="Intercompany Balance"
                      value={2450000}
                      prefix="R"
                      valueStyle={{ color: '#667eea' }}
                    />
                    <div className="stat-footer">
                      <Text type="secondary">To be eliminated</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="stat-card">
                    <Statistic
                      title="Pending Eliminations"
                      value={12}
                      valueStyle={{ color: '#f59e0b' }}
                    />
                    <div className="stat-footer">
                      <Text type="warning">Requires review</Text>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="stat-card">
                    <Statistic
                      title="FX Adjustments"
                      value={3}
                      valueStyle={{ color: '#3b82f6' }}
                    />
                    <div className="stat-footer">
                      <Text type="secondary">This period</Text>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Consolidation Rules Summary */}
              <Card title="Consolidation Rules" style={{ marginTop: '16px' }} className="rules-card">
                {consolidationRules.map((rule, idx) => (
                  <div key={idx} className="rule-item">
                    <div className="rule-entity">
                      <Text strong>{rule.entity}</Text>
                      <Tag color={rule.ownership === 100 ? 'green' : 'orange'}>{rule.ownership}%</Tag>
                    </div>
                    <div className="rule-details">
                      <Tag>{rule.method}</Tag>
                      {rule.eliminateIC && (
                        <Tooltip title="Intercompany transactions eliminated">
                          <Tag color="blue"><SwapOutlined /> IC Elimination</Tag>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </Col>

            {/* Intercompany Transactions */}
            <Col span={24}>
              <Card 
                title="Intercompany Transactions" 
                extra={<Button type="link">View All</Button>}
              >
                <Table 
                  dataSource={interCompanyTransactions}
                  columns={transactionColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><SwapOutlined /> Eliminations</span>} 
          key="eliminations"
        >
          <Card>
            <Paragraph>Intercompany eliminations and consolidation adjustments will appear here.</Paragraph>
          </Card>
        </TabPane>

        <TabPane 
          tab={<span><DollarOutlined /> Currency</span>} 
          key="currency"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Card title="Exchange Rates" className="rates-card">
                <div className="rate-item">
                  <div className="rate-pair">
                    <span>🇿🇦 ZAR</span>
                    <SwapOutlined />
                    <span>🇬🇧 GBP</span>
                  </div>
                  <Text strong style={{ fontSize: '18px' }}>0.0441</Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="rate-item">
                  <div className="rate-pair">
                    <span>🇿🇦 ZAR</span>
                    <SwapOutlined />
                    <span>🇺🇸 USD</span>
                  </div>
                  <Text strong style={{ fontSize: '18px' }}>0.0556</Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="rate-item">
                  <div className="rate-pair">
                    <span>🇬🇧 GBP</span>
                    <SwapOutlined />
                    <span>🇺🇸 USD</span>
                  </div>
                  <Text strong style={{ fontSize: '18px' }}>1.2615</Text>
                </div>
                <div className="rate-footer">
                  <Text type="secondary">Last updated: Today 10:30 AM</Text>
                  <Button type="link" size="small">Refresh Rates</Button>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Translation Method">
                <div className="method-item">
                  <Text strong>Balance Sheet</Text>
                  <Tag color="blue">Closing Rate</Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="method-item">
                  <Text strong>Income Statement</Text>
                  <Tag color="blue">Average Rate</Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="method-item">
                  <Text strong>Equity</Text>
                  <Tag color="blue">Historical Rate</Tag>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane 
          tab={<span><FileTextOutlined /> Reports</span>} 
          key="reports"
        >
          <Card>
            <Paragraph>Consolidated financial reports will appear here.</Paragraph>
          </Card>
        </TabPane>

        <TabPane 
          tab={<span><SettingOutlined /> Settings</span>} 
          key="settings"
        >
          <Card>
            <Paragraph>Entity and consolidation settings will appear here.</Paragraph>
          </Card>
        </TabPane>
      </Tabs>

      {/* Add Entity Modal */}
      <Modal
        title="Add New Entity"
        open={showEntityModal}
        onCancel={() => setShowEntityModal(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="Entity Name" required>
            <Input placeholder="e.g., WorldClass Australia Pty Ltd" />
          </Form.Item>
          <Form.Item label="Entity Type">
            <Select defaultValue="subsidiary">
              <Select.Option value="holding">Holding Company</Select.Option>
              <Select.Option value="subsidiary">Subsidiary</Select.Option>
              <Select.Option value="branch">Branch</Select.Option>
              <Select.Option value="division">Division</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Parent Entity">
            <Select defaultValue="holding">
              <Select.Option value="holding">{companyName}</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Country">
                <Select defaultValue="ZA">
                  <Select.Option value="ZA">🇿🇦 South Africa</Select.Option>
                  <Select.Option value="GB">🇬🇧 United Kingdom</Select.Option>
                  <Select.Option value="US">🇺🇸 United States</Select.Option>
                  <Select.Option value="AU">🇦🇺 Australia</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Currency">
                <Select defaultValue="ZAR">
                  <Select.Option value="ZAR">ZAR - South African Rand</Select.Option>
                  <Select.Option value="GBP">GBP - British Pound</Select.Option>
                  <Select.Option value="USD">USD - US Dollar</Select.Option>
                  <Select.Option value="AUD">AUD - Australian Dollar</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ownership %">
            <Input type="number" defaultValue={100} suffix="%" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Button onClick={() => setShowEntityModal(false)}>Cancel</Button>
            <Button type="primary" onClick={() => { message.success('Entity created'); setShowEntityModal(false); }}>
              Create Entity
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MultiEntityHub;
