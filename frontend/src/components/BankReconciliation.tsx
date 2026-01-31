/**
 * BankReconciliation - Premium Bank Reconciliation Interface
 * 
 * Full-featured reconciliation with:
 * - Auto-matching engine
 * - Manual matching support
 * - Difference analysis
 * - Reconciliation history
 * - Import bank statements
 */

import React, { useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Space, Statistic,
  Typography, Tabs, Progress, Badge, Input, Select,
  DatePicker, Modal, Upload, message, Tooltip, Drawer,
  Timeline, Alert, Checkbox, Popconfirm, Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BankOutlined, SwapOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, SearchOutlined,
  UploadOutlined, DownloadOutlined, FilterOutlined,
  SyncOutlined, LinkOutlined, DisconnectOutlined, FileTextOutlined,
  HistoryOutlined, WarningOutlined, PlusOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeOutlined,
  ThunderboltOutlined, SettingOutlined, ReloadOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'unmatched' | 'matched' | 'partial' | 'excluded';
  matchedWith?: string;
  confidence?: number;
}

interface BookEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'unmatched' | 'matched' | 'partial';
  account: string;
  matchedWith?: string;
}

const BankReconciliation: React.FC = () => {
  const [selectedBankAccount, setSelectedBankAccount] = useState('fnb-current');
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedBankTxn, setSelectedBankTxn] = useState<BankTransaction | null>(null);
  const [selectedBookEntries, setSelectedBookEntries] = useState<string[]>([]);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('reconcile');

  // Mock bank accounts
  const bankAccounts = [
    { id: 'fnb-current', name: 'FNB Business Current', balance: 2450000, number: '62XXXXXXX89' },
    { id: 'fnb-savings', name: 'FNB Business Savings', balance: 850000, number: '62XXXXXXX45' },
    { id: 'nedbank', name: 'Nedbank Current', balance: 350000, number: '10XXXXXXX23' },
  ];

  // Mock bank transactions
  const bankTransactions: BankTransaction[] = [
    { id: 'BT-001', date: '2025-12-11', description: 'PAYMENT - ABC SUPPLIERS', reference: 'PAY123456', amount: 45000, type: 'debit', status: 'unmatched' },
    { id: 'BT-002', date: '2025-12-11', description: 'EFT - CLIENT XYZ', reference: 'EFT789012', amount: 125000, type: 'credit', status: 'matched', matchedWith: 'JNL-045', confidence: 100 },
    { id: 'BT-003', date: '2025-12-10', description: 'DEBIT ORDER - INSURANCE', reference: 'DO345678', amount: 8500, type: 'debit', status: 'unmatched' },
    { id: 'BT-004', date: '2025-12-10', description: 'EFT - CLIENT LMN', reference: 'EFT901234', amount: 78500, type: 'credit', status: 'partial', matchedWith: 'JNL-042', confidence: 85 },
    { id: 'BT-005', date: '2025-12-09', description: 'CARD PURCHASE - OFFICE DEPOT', reference: 'CARD567890', amount: 2350, type: 'debit', status: 'unmatched' },
    { id: 'BT-006', date: '2025-12-09', description: 'BANK CHARGES', reference: 'CHRG123', amount: 450, type: 'debit', status: 'excluded' },
  ];

  // Mock book entries
  const bookEntries: BookEntry[] = [
    { id: 'JNL-041', date: '2025-12-11', description: 'Payment to ABC Suppliers', reference: 'PV-2025-089', amount: 45000, type: 'debit', status: 'unmatched', account: 'Accounts Payable' },
    { id: 'JNL-042', date: '2025-12-10', description: 'Receipt from Client LMN', reference: 'RC-2025-156', amount: 78000, type: 'credit', status: 'partial', account: 'Accounts Receivable', matchedWith: 'BT-004' },
    { id: 'JNL-043', date: '2025-12-10', description: 'Insurance Premium', reference: 'EXP-2025-034', amount: 8500, type: 'debit', status: 'unmatched', account: 'Insurance Expense' },
    { id: 'JNL-044', date: '2025-12-09', description: 'Office Supplies Purchase', reference: 'EXP-2025-035', amount: 2350, type: 'debit', status: 'unmatched', account: 'Office Expenses' },
    { id: 'JNL-045', date: '2025-12-09', description: 'Receipt from Client XYZ', reference: 'RC-2025-155', amount: 125000, type: 'credit', status: 'matched', account: 'Accounts Receivable', matchedWith: 'BT-002' },
  ];

  // Stats calculation
  const stats = {
    bankBalance: 2450000,
    bookBalance: 2448500,
    difference: 1500,
    matchedCount: 2,
    unmatchedCount: 3,
    partialCount: 1,
    matchRate: 67
  };

  const handleAutoMatch = () => {
    setIsAutoMatching(true);
    setTimeout(() => {
      setIsAutoMatching(false);
      message.success('Auto-matching complete! 2 new matches found.');
    }, 2000);
  };

  const handleManualMatch = (bankTxn: BankTransaction) => {
    setSelectedBankTxn(bankTxn);
    setShowMatchModal(true);
  };

  const confirmMatch = () => {
    message.success('Transaction matched successfully!');
    setShowMatchModal(false);
    setSelectedBankTxn(null);
    setSelectedBookEntries([]);
  };

  const getStatusTag = (status: string, confidence?: number) => {
    switch (status) {
      case 'matched':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Matched {confidence && `(${confidence}%)`}</Tag>;
      case 'partial':
        return <Tag color="orange" icon={<WarningOutlined />}>Partial Match</Tag>;
      case 'excluded':
        return <Tag color="default" icon={<CloseCircleOutlined />}>Excluded</Tag>;
      default:
        return <Tag color="blue" icon={<ClockCircleOutlined />}>Unmatched</Tag>;
    }
  };

  const bankTxnColumns: ColumnsType<BankTransaction> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => a.date.localeCompare(b.date)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>Ref: {record.reference}</Text>
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      align: 'right',
      render: (amount, record) => (
        <Text 
          strong 
          style={{ color: record.type === 'credit' ? '#10b981' : '#ef4444' }}
        >
          {record.type === 'credit' ? '+' : '-'} R {amount.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => getStatusTag(status, record.confidence)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'unmatched' && (
            <>
              <Tooltip title="Auto-suggest match">
                <Button size="small" icon={<ThunderboltOutlined />} onClick={() => message.info('Searching for matches...')} />
              </Tooltip>
              <Button size="small" type="primary" icon={<LinkOutlined />} onClick={() => handleManualMatch(record)}>
                Match
              </Button>
            </>
          )}
          {record.status === 'matched' && (
            <Tooltip title="Unmatch">
              <Button size="small" icon={<DisconnectOutlined />} danger />
            </Tooltip>
          )}
          {record.status === 'partial' && (
            <Button size="small" icon={<EyeOutlined />}>Review</Button>
          )}
        </Space>
      )
    }
  ];

  const selectedAccount = bankAccounts.find(a => a.id === selectedBankAccount);

  return (
    <div className="bank-reconciliation">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="1">
            <Space size="large">
              <Select
                value={selectedBankAccount}
                onChange={setSelectedBankAccount}
                style={{ width: 280 }}
                size="large"
              >
                {bankAccounts.map(acc => (
                  <Select.Option key={acc.id} value={acc.id}>
                    <Space>
                      <BankOutlined />
                      <div>
                        <div>{acc.name}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{acc.number}</Text>
                      </div>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
              <RangePicker />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<UploadOutlined />} onClick={() => setShowImportDrawer(true)}>
                Import Statement
              </Button>
              <Button 
                type="primary" 
                icon={<SyncOutlined spin={isAutoMatching} />} 
                onClick={handleAutoMatch}
                loading={isAutoMatching}
              >
                Auto-Match
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Reconciliation Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bank Statement Balance"
              value={stats.bankBalance}
              prefix="R"
              valueStyle={{ color: '#3b82f6', fontWeight: 700 }}
            />
            <Text type="secondary">As at {selectedAccount?.number}</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Book Balance"
              value={stats.bookBalance}
              prefix="R"
              valueStyle={{ color: '#667eea', fontWeight: 700 }}
            />
            <Text type="secondary">GL Cash Account</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Difference"
              value={stats.difference}
              prefix="R"
              valueStyle={{ 
                color: stats.difference === 0 ? '#10b981' : '#f59e0b',
                fontWeight: 700 
              }}
            />
            <Text type={stats.difference === 0 ? 'success' : 'warning'}>
              {stats.difference === 0 ? 'Fully reconciled' : `${stats.unmatchedCount} items outstanding`}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Reconciliation Progress</Text>
            </div>
            <Progress 
              percent={stats.matchRate} 
              strokeColor={{
                '0%': '#667eea',
                '100%': '#10b981',
              }}
              format={(percent) => (
                <span style={{ fontWeight: 600 }}>{percent}%</span>
              )}
            />
            <Space style={{ marginTop: 8 }}>
              <Tag color="green">{stats.matchedCount} matched</Tag>
              <Tag color="orange">{stats.partialCount} partial</Tag>
              <Tag color="blue">{stats.unmatchedCount} pending</Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Main Reconciliation Area */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><SwapOutlined /> Reconcile</span>} key="reconcile">
            <Row gutter={24}>
              {/* Bank Transactions */}
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <BankOutlined style={{ color: '#3b82f6' }} />
                      <span>Bank Transactions</span>
                      <Badge count={stats.unmatchedCount} style={{ backgroundColor: '#3b82f6' }} />
                    </Space>
                  }
                  size="small"
                  extra={
                    <Input 
                      placeholder="Search..." 
                      prefix={<SearchOutlined />} 
                      style={{ width: 180 }}
                    />
                  }
                >
                  <Table
                    dataSource={bankTransactions}
                    columns={bankTxnColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    scroll={{ y: 400 }}
                    rowClassName={(record) => 
                      record.status === 'matched' ? 'matched-row' : 
                      record.status === 'excluded' ? 'excluded-row' : ''
                    }
                  />
                </Card>
              </Col>

              {/* Book Entries */}
              <Col span={12}>
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#667eea' }} />
                      <span>Book Entries (GL)</span>
                      <Badge count={stats.unmatchedCount} style={{ backgroundColor: '#667eea' }} />
                    </Space>
                  }
                  size="small"
                  extra={
                    <Button size="small" icon={<PlusOutlined />}>Add Entry</Button>
                  }
                >
                  <Table
                    dataSource={bookEntries}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    scroll={{ y: 400 }}
                    columns={[
                      { title: 'Date', dataIndex: 'date', key: 'date', width: 90 },
                      { 
                        title: 'Description', 
                        dataIndex: 'description', 
                        key: 'description',
                        ellipsis: true,
                        render: (text, record) => (
                          <div>
                            <Text>{text}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 10 }}>{record.account}</Text>
                          </div>
                        )
                      },
                      { 
                        title: 'Amount', 
                        dataIndex: 'amount', 
                        key: 'amount',
                        width: 120,
                        align: 'right',
                        render: (amount, record) => (
                          <Text style={{ color: record.type === 'credit' ? '#10b981' : '#ef4444' }}>
                            {record.type === 'credit' ? '+' : '-'} R {amount.toLocaleString()}
                          </Text>
                        )
                      },
                      { 
                        title: 'Status', 
                        dataIndex: 'status', 
                        key: 'status',
                        width: 100,
                        render: (status) => getStatusTag(status)
                      }
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            {/* Difference Explanation */}
            {stats.difference !== 0 && (
              <Alert
                style={{ marginTop: 16 }}
                message="Reconciliation Difference Analysis"
                description={
                  <div>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Outstanding Deposits (not in bank):</Text>
                        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                          <li>Receipt RC-2025-156 - R 78,000 (partial: R 500 variance)</li>
                        </ul>
                      </Col>
                      <Col span={12}>
                        <Text strong>Outstanding Payments (not in book):</Text>
                        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                          <li>Bank Charge - R 450 (excluded, needs journal)</li>
                          <li>Card Purchase - R 2,350 (pending match)</li>
                        </ul>
                      </Col>
                    </Row>
                  </div>
                }
                type="warning"
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab={<span><HistoryOutlined /> History</span>} key="history">
            <Table
              dataSource={[
                { id: 1, date: '2025-12-01', account: 'FNB Current', bankBal: 2100000, bookBal: 2100000, diff: 0, status: 'completed', user: 'Sarah M.' },
                { id: 2, date: '2025-11-30', account: 'FNB Current', bankBal: 1950000, bookBal: 1948500, diff: 1500, status: 'completed', user: 'John D.' },
                { id: 3, date: '2025-11-29', account: 'FNB Current', bankBal: 2050000, bookBal: 2050000, diff: 0, status: 'completed', user: 'Sarah M.' },
              ]}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date' },
                { title: 'Account', dataIndex: 'account', key: 'account' },
                { title: 'Bank Balance', dataIndex: 'bankBal', key: 'bankBal', render: (v) => `R ${v.toLocaleString()}` },
                { title: 'Book Balance', dataIndex: 'bookBal', key: 'bookBal', render: (v) => `R ${v.toLocaleString()}` },
                { title: 'Difference', dataIndex: 'diff', key: 'diff', render: (v) => <Tag color={v === 0 ? 'green' : 'orange'}>R {v.toLocaleString()}</Tag> },
                { title: 'Status', dataIndex: 'status', key: 'status', render: () => <Tag color="green">Completed</Tag> },
                { title: 'Reconciled By', dataIndex: 'user', key: 'user' },
                { title: 'Action', key: 'action', render: () => <Button size="small" icon={<EyeOutlined />}>View</Button> }
              ]}
              rowKey="id"
            />
          </TabPane>

          <TabPane tab={<span><SettingOutlined /> Rules</span>} key="rules">
            <Alert
              message="Auto-Matching Rules"
              description="Configure rules to automatically match bank transactions with book entries based on reference numbers, amounts, and descriptions."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={[
                { id: 1, name: 'Exact Reference Match', field: 'Reference', condition: 'Equals', enabled: true },
                { id: 2, name: 'Amount + Date Match', field: 'Amount & Date', condition: '±R100 & ±2 days', enabled: true },
                { id: 3, name: 'Description Contains', field: 'Description', condition: 'Contains client name', enabled: false },
              ]}
              columns={[
                { title: 'Rule Name', dataIndex: 'name', key: 'name' },
                { title: 'Match Field', dataIndex: 'field', key: 'field' },
                { title: 'Condition', dataIndex: 'condition', key: 'condition' },
                { 
                  title: 'Enabled', 
                  dataIndex: 'enabled', 
                  key: 'enabled',
                  render: (enabled) => <Checkbox checked={enabled} />
                },
                { 
                  title: 'Actions', 
                  key: 'actions',
                  render: () => (
                    <Space>
                      <Button size="small">Edit</Button>
                      <Button size="small" danger>Delete</Button>
                    </Space>
                  )
                }
              ]}
              rowKey="id"
            />
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 16 }}>
              Add Matching Rule
            </Button>
          </TabPane>
        </Tabs>
      </Card>

      {/* Manual Match Modal */}
      <Modal
        title="Match Transaction"
        open={showMatchModal}
        onCancel={() => setShowMatchModal(false)}
        onOk={confirmMatch}
        width={700}
        okText="Confirm Match"
      >
        {selectedBankTxn && (
          <>
            <Alert
              message={
                <Space>
                  <BankOutlined />
                  <Text strong>{selectedBankTxn.description}</Text>
                  <Text type={selectedBankTxn.type === 'credit' ? 'success' : 'danger'}>
                    R {selectedBankTxn.amount.toLocaleString()}
                  </Text>
                </Space>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Text strong>Select book entries to match:</Text>
            <Table
              style={{ marginTop: 12 }}
              dataSource={bookEntries.filter(e => e.status === 'unmatched')}
              rowSelection={{
                selectedRowKeys: selectedBookEntries,
                onChange: (keys) => setSelectedBookEntries(keys as string[])
              }}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date', width: 100 },
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Reference', dataIndex: 'reference', key: 'reference', width: 120 },
                { 
                  title: 'Amount', 
                  dataIndex: 'amount', 
                  key: 'amount',
                  width: 120,
                  render: (v, record) => (
                    <Text style={{ color: record.type === 'credit' ? '#10b981' : '#ef4444' }}>
                      R {v.toLocaleString()}
                    </Text>
                  )
                }
              ]}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        )}
      </Modal>

      {/* Import Statement Drawer */}
      <Drawer
        title="Import Bank Statement"
        placement="right"
        width={500}
        open={showImportDrawer}
        onClose={() => setShowImportDrawer(false)}
      >
        <Alert
          message="Supported Formats"
          description="CSV, OFX, QIF, MT940 (SWIFT)"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Upload.Dragger
          accept=".csv,.ofx,.qif,.txt"
          multiple={false}
          beforeUpload={() => false}
          style={{ marginBottom: 24 }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#667eea' }} />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">
            Upload your bank statement file
          </p>
        </Upload.Dragger>

        <Divider>Or connect directly</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block icon={<BankOutlined />}>Connect to FNB</Button>
          <Button block icon={<BankOutlined />}>Connect to Nedbank</Button>
          <Button block icon={<BankOutlined />}>Connect to Standard Bank</Button>
          <Button block icon={<BankOutlined />}>Connect to Absa</Button>
        </Space>

        <div style={{ marginTop: 24 }}>
          <Button type="primary" block>
            Import Statement
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default BankReconciliation;
