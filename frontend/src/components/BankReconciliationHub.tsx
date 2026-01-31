/**
 * BankReconciliation - Enterprise Bank Reconciliation with AI
 * 
 * Features:
 * - AI-powered auto-matching with confidence scores
 * - AP/AR invoice integration
 * - Real-time reconciliation
 * - Statement import (CSV, OFX, QIF, MT940)
 * - Multi-currency support
 * - Audit trail
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Space, Statistic,
  Typography, Tabs, Progress, Badge, Input, Select,
  DatePicker, Modal, Upload, message, Tooltip, Drawer,
  Timeline, Alert, Checkbox, Divider, Spin, Result,
  List, Avatar, Form, InputNumber, Switch, Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  BankOutlined, SwapOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, SearchOutlined,
  UploadOutlined, DownloadOutlined, FilterOutlined,
  SyncOutlined, LinkOutlined, DisconnectOutlined, FileTextOutlined,
  HistoryOutlined, WarningOutlined, PlusOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeOutlined,
  ThunderboltOutlined, SettingOutlined, ReloadOutlined,
  RobotOutlined, FileExcelOutlined, FilePdfOutlined,
  DollarOutlined, TeamOutlined, ShopOutlined,
  CheckOutlined, LoadingOutlined, BulbOutlined,
  SafetyCertificateOutlined, AuditOutlined, InboxOutlined
} from '@ant-design/icons';
import {
  HubLayout, HubHeader, StatusBanner, HubTabs
} from './hub';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Dragger } = Upload;

// Types
interface BankTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'unmatched' | 'matched' | 'partial' | 'excluded' | 'ai-suggested';
  matchedWith?: string[];
  confidence?: number;
  aiSuggestion?: string;
  category?: string;
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
  source: 'ap' | 'ar' | 'gl' | 'manual';
  documentType?: 'invoice' | 'payment' | 'receipt' | 'journal';
  vendorClient?: string;
}

interface AIMatch {
  bankTxnId: string;
  bookEntryId: string;
  confidence: number;
  matchReason: string;
  ruleApplied: string;
}

interface ImportedStatement {
  filename: string;
  transactions: number;
  startDate: string;
  endDate: string;
  status: 'processing' | 'completed' | 'error';
}

const BankReconciliation: React.FC = () => {
  // State
  const [selectedBankAccount, setSelectedBankAccount] = useState('fnb-current');
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedBankTxn, setSelectedBankTxn] = useState<BankTransaction | null>(null);
  const [selectedBookEntries, setSelectedBookEntries] = useState<string[]>([]);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [activeTab, setActiveTab] = useState('reconcile');
  const [aiMatches, setAiMatches] = useState<AIMatch[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([]);
  
  // Bank accounts
  const bankAccounts = [
    { id: 'fnb-current', name: 'FNB Business Current', balance: 2450000, number: '62XXXXXXX89', currency: 'ZAR' },
    { id: 'fnb-savings', name: 'FNB Business Savings', balance: 850000, number: '62XXXXXXX45', currency: 'ZAR' },
    { id: 'std-usd', name: 'Standard Bank USD', balance: 125000, number: '10XXXXXXX23', currency: 'USD' },
  ];

  // Initialize with sample data
  useEffect(() => {
    // Simulated bank transactions
    const initialBankTxns: BankTransaction[] = [
      { id: 'BT-001', date: '2025-12-11', description: 'PAYMENT - ABC SUPPLIERS INV-2025-089', reference: 'PAY123456', amount: 45000, type: 'debit', status: 'ai-suggested', confidence: 95, aiSuggestion: 'Matches AP Invoice INV-2025-089', category: 'Supplier Payment' },
      { id: 'BT-002', date: '2025-12-11', description: 'EFT - CLIENT XYZ REF: INV-0042', reference: 'EFT789012', amount: 125000, type: 'credit', status: 'matched', matchedWith: ['AR-045'], confidence: 100, category: 'Customer Receipt' },
      { id: 'BT-003', date: '2025-12-10', description: 'DEBIT ORDER - OLD MUTUAL INSURANCE', reference: 'DO345678', amount: 8500, type: 'debit', status: 'ai-suggested', confidence: 88, aiSuggestion: 'Recurring expense - Insurance Premium', category: 'Insurance' },
      { id: 'BT-004', date: '2025-12-10', description: 'EFT - CLIENT LMN HOLDINGS', reference: 'EFT901234', amount: 78500, type: 'credit', status: 'ai-suggested', confidence: 72, aiSuggestion: 'Possible match: AR Invoice #AR-042 (R78,000)', category: 'Customer Receipt' },
      { id: 'BT-005', date: '2025-12-09', description: 'CARD PURCHASE - OFFICE DEPOT', reference: 'CARD567890', amount: 2350, type: 'debit', status: 'unmatched', category: 'Office Supplies' },
      { id: 'BT-006', date: '2025-12-09', description: 'BANK CHARGES - ACCOUNT FEE', reference: 'CHRG123', amount: 450, type: 'debit', status: 'excluded', category: 'Bank Charges' },
      { id: 'BT-007', date: '2025-12-08', description: 'EFT - DEF CORPORATION', reference: 'EFT555123', amount: 250000, type: 'credit', status: 'unmatched', category: 'Customer Receipt' },
      { id: 'BT-008', date: '2025-12-08', description: 'PAYMENT - GHI LOGISTICS', reference: 'PAY888999', amount: 35750, type: 'debit', status: 'ai-suggested', confidence: 91, aiSuggestion: 'Matches AP Invoice INV-2025-076', category: 'Supplier Payment' },
    ];
    
    // Simulated book entries (AP/AR integrated)
    const initialBookEntries: BookEntry[] = [
      { id: 'AP-089', date: '2025-12-10', description: 'ABC Suppliers - Office Equipment', reference: 'INV-2025-089', amount: 45000, type: 'debit', status: 'unmatched', account: 'Accounts Payable', source: 'ap', documentType: 'invoice', vendorClient: 'ABC Suppliers (Pty) Ltd' },
      { id: 'AR-045', date: '2025-12-09', description: 'Client XYZ - Consulting Services', reference: 'INV-0042', amount: 125000, type: 'credit', status: 'matched', account: 'Accounts Receivable', matchedWith: 'BT-002', source: 'ar', documentType: 'invoice', vendorClient: 'XYZ Corporation' },
      { id: 'AR-042', date: '2025-12-08', description: 'LMN Holdings - Project Phase 1', reference: 'INV-0038', amount: 78000, type: 'credit', status: 'unmatched', account: 'Accounts Receivable', source: 'ar', documentType: 'invoice', vendorClient: 'LMN Holdings' },
      { id: 'GL-101', date: '2025-12-09', description: 'Insurance Premium - Old Mutual', reference: 'EXP-2025-034', amount: 8500, type: 'debit', status: 'unmatched', account: 'Insurance Expense', source: 'gl', documentType: 'journal' },
      { id: 'GL-102', date: '2025-12-09', description: 'Office Supplies - Various', reference: 'EXP-2025-035', amount: 2350, type: 'debit', status: 'unmatched', account: 'Office Expenses', source: 'gl', documentType: 'journal' },
      { id: 'AP-076', date: '2025-12-06', description: 'GHI Logistics - Freight Charges', reference: 'INV-2025-076', amount: 35750, type: 'debit', status: 'unmatched', account: 'Accounts Payable', source: 'ap', documentType: 'invoice', vendorClient: 'GHI Logistics' },
      { id: 'AR-050', date: '2025-12-07', description: 'DEF Corporation - Quarterly Service', reference: 'INV-0045', amount: 250000, type: 'credit', status: 'unmatched', account: 'Accounts Receivable', source: 'ar', documentType: 'invoice', vendorClient: 'DEF Corporation' },
    ];

    setBankTransactions(initialBankTxns);
    setBookEntries(initialBookEntries);

    // AI matches suggestions
    setAiMatches([
      { bankTxnId: 'BT-001', bookEntryId: 'AP-089', confidence: 95, matchReason: 'Reference number contains invoice ID', ruleApplied: 'Invoice Reference Match' },
      { bankTxnId: 'BT-003', bookEntryId: 'GL-101', confidence: 88, matchReason: 'Amount matches, recurring pattern detected', ruleApplied: 'Amount + Pattern Match' },
      { bankTxnId: 'BT-004', bookEntryId: 'AR-042', confidence: 72, matchReason: 'Amount close (R500 variance), client name similar', ruleApplied: 'Fuzzy Amount + Name Match' },
      { bankTxnId: 'BT-008', bookEntryId: 'AP-076', confidence: 91, matchReason: 'Invoice reference detected in description', ruleApplied: 'Invoice Reference Match' },
      { bankTxnId: 'BT-007', bookEntryId: 'AR-050', confidence: 85, matchReason: 'Exact amount match, company name in description', ruleApplied: 'Amount + Company Match' },
    ]);
  }, []);

  // Calculate stats
  const stats = {
    bankBalance: bankAccounts.find(a => a.id === selectedBankAccount)?.balance || 0,
    bookBalance: 2448500,
    difference: 1500,
    matchedCount: bankTransactions.filter(t => t.status === 'matched').length,
    unmatchedCount: bankTransactions.filter(t => t.status === 'unmatched').length,
    aiSuggestedCount: bankTransactions.filter(t => t.status === 'ai-suggested').length,
    partialCount: bankTransactions.filter(t => t.status === 'partial').length,
    matchRate: Math.round((bankTransactions.filter(t => t.status === 'matched').length / Math.max(bankTransactions.length, 1)) * 100)
  };

  // AI Auto-Match Function
  const runAIAutoMatch = useCallback(async () => {
    setIsAutoMatching(true);
    message.loading({ content: 'AI is analyzing transactions...', key: 'automatch' });

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Apply AI suggestions
    setBankTransactions(prev => prev.map(txn => {
      const aiMatch = aiMatches.find(m => m.bankTxnId === txn.id);
      if (aiMatch && aiMatch.confidence >= 90 && txn.status !== 'matched') {
        return { ...txn, status: 'matched' as const, matchedWith: [aiMatch.bookEntryId], confidence: aiMatch.confidence };
      }
      return txn;
    }));

    setBookEntries(prev => prev.map(entry => {
      const aiMatch = aiMatches.find(m => m.bookEntryId === entry.id);
      if (aiMatch && aiMatch.confidence >= 90 && entry.status !== 'matched') {
        return { ...entry, status: 'matched' as const, matchedWith: aiMatch.bankTxnId };
      }
      return entry;
    }));

    setIsAutoMatching(false);
    message.success({ content: '✨ AI matched 3 transactions automatically!', key: 'automatch', duration: 3 });
  }, [aiMatches]);

  // Accept AI suggestion
  const acceptAISuggestion = (bankTxnId: string) => {
    const aiMatch = aiMatches.find(m => m.bankTxnId === bankTxnId);
    if (!aiMatch) return;

    setBankTransactions(prev => prev.map(txn => 
      txn.id === bankTxnId 
        ? { ...txn, status: 'matched' as const, matchedWith: [aiMatch.bookEntryId], confidence: 100 }
        : txn
    ));

    setBookEntries(prev => prev.map(entry =>
      entry.id === aiMatch.bookEntryId
        ? { ...entry, status: 'matched' as const, matchedWith: bankTxnId }
        : entry
    ));

    message.success('Match confirmed!');
  };

  // Reject AI suggestion
  const rejectAISuggestion = (bankTxnId: string) => {
    setBankTransactions(prev => prev.map(txn =>
      txn.id === bankTxnId
        ? { ...txn, status: 'unmatched' as const, confidence: undefined, aiSuggestion: undefined }
        : txn
    ));
    message.info('Suggestion dismissed');
  };

  // Manual match
  const handleManualMatch = (bankTxn: BankTransaction) => {
    setSelectedBankTxn(bankTxn);
    setSelectedBookEntries([]);
    setShowMatchModal(true);
  };

  const confirmManualMatch = () => {
    if (!selectedBankTxn || selectedBookEntries.length === 0) {
      message.warning('Please select at least one book entry to match');
      return;
    }

    setBankTransactions(prev => prev.map(txn =>
      txn.id === selectedBankTxn.id
        ? { ...txn, status: 'matched' as const, matchedWith: selectedBookEntries, confidence: 100 }
        : txn
    ));

    setBookEntries(prev => prev.map(entry =>
      selectedBookEntries.includes(entry.id)
        ? { ...entry, status: 'matched' as const, matchedWith: selectedBankTxn.id }
        : entry
    ));

    setShowMatchModal(false);
    setSelectedBankTxn(null);
    setSelectedBookEntries([]);
    message.success('Transactions matched successfully!');
  };

  // Unmatch
  const handleUnmatch = (bankTxnId: string) => {
    const txn = bankTransactions.find(t => t.id === bankTxnId);
    if (!txn?.matchedWith) return;

    setBankTransactions(prev => prev.map(t =>
      t.id === bankTxnId
        ? { ...t, status: 'unmatched' as const, matchedWith: undefined, confidence: undefined }
        : t
    ));

    setBookEntries(prev => prev.map(entry =>
      txn.matchedWith?.includes(entry.id)
        ? { ...entry, status: 'unmatched' as const, matchedWith: undefined }
        : entry
    ));

    message.info('Match removed');
  };

  // Import statement handling
  const handleImportStatement = async (file: File) => {
    setIsProcessingImport(true);
    message.loading({ content: 'Processing statement...', key: 'import' });

    // Simulate file parsing
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Add sample imported transactions
    const importedTxns: BankTransaction[] = [
      { id: 'IMP-001', date: '2025-12-11', description: 'TRANSFER - INTER-ACCOUNT', reference: 'TRF999888', amount: 50000, type: 'credit', status: 'unmatched', category: 'Transfer' },
      { id: 'IMP-002', date: '2025-12-11', description: 'PAYMENT - JKL VENDORS', reference: 'PAY777666', amount: 15200, type: 'debit', status: 'unmatched', category: 'Supplier Payment' },
    ];

    setBankTransactions(prev => [...prev, ...importedTxns]);
    setIsProcessingImport(false);
    setShowImportDrawer(false);
    message.success({ content: `✅ Imported ${importedTxns.length} transactions from ${file.name}`, key: 'import', duration: 3 });
  };

  // Status tag renderer
  const getStatusTag = (status: string, confidence?: number) => {
    switch (status) {
      case 'matched':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Matched</Tag>;
      case 'ai-suggested':
        return (
          <Tooltip title={`AI Confidence: ${confidence}%`}>
            <Tag color="purple" icon={<RobotOutlined />}>AI Match ({confidence}%)</Tag>
          </Tooltip>
        );
      case 'partial':
        return <Tag color="orange" icon={<WarningOutlined />}>Partial</Tag>;
      case 'excluded':
        return <Tag color="default" icon={<CloseCircleOutlined />}>Excluded</Tag>;
      default:
        return <Tag color="blue" icon={<ClockCircleOutlined />}>Unmatched</Tag>;
    }
  };

  // Source badge
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ap': return <Tag color="red">AP</Tag>;
      case 'ar': return <Tag color="green">AR</Tag>;
      case 'gl': return <Tag color="blue">GL</Tag>;
      default: return <Tag>Manual</Tag>;
    }
  };

  // Bank transactions columns
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
          <Text strong style={{ fontSize: 13 }}>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>Ref: {record.reference}</Text>
          {record.aiSuggestion && record.status === 'ai-suggested' && (
            <>
              <br />
              <Text style={{ fontSize: 11, color: '#722ed1' }}>
                <RobotOutlined /> {record.aiSuggestion}
              </Text>
            </>
          )}
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.type === 'credit' ? '#10b981' : '#ef4444', fontSize: 13 }}>
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
      width: 200,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === 'ai-suggested' && (
            <>
              <Tooltip title="Accept AI Match">
                <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => acceptAISuggestion(record.id)} />
              </Tooltip>
              <Tooltip title="Reject Suggestion">
                <Button size="small" icon={<CloseCircleOutlined />} onClick={() => rejectAISuggestion(record.id)} />
              </Tooltip>
            </>
          )}
          {record.status === 'unmatched' && (
            <Button size="small" type="primary" icon={<LinkOutlined />} onClick={() => handleManualMatch(record)}>
              Match
            </Button>
          )}
          {record.status === 'matched' && (
            <Popconfirm title="Unmatch this transaction?" onConfirm={() => handleUnmatch(record.id)}>
              <Button size="small" icon={<DisconnectOutlined />} danger>Unmatch</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Book entries columns
  const bookEntriesColumns: ColumnsType<BookEntry> = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 60,
      render: (source) => getSourceBadge(source)
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 90
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text style={{ fontSize: 13 }}>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.vendorClient || record.account}</Text>
        </div>
      )
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 110,
      render: (ref) => <Text code style={{ fontSize: 11 }}>{ref}</Text>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.type === 'credit' ? '#10b981' : '#ef4444', fontSize: 13 }}>
          R {amount.toLocaleString()}
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
  ];

  const selectedAccount = bankAccounts.find(a => a.id === selectedBankAccount);

  return (
    <HubLayout>
      {/* Hub Header */}
      <HubHeader
        title="Bank Reconciliation"
        subtitle="AI-powered matching with AP/AR integration"
        icon={<BankOutlined />}
        gradient="blue"
        actions={
          <Space>
            <Button icon={<UploadOutlined />} onClick={() => setShowImportDrawer(true)}>
              Import Statement
            </Button>
            <Button 
              type="primary" 
              icon={isAutoMatching ? <LoadingOutlined /> : <RobotOutlined />}
              onClick={runAIAutoMatch}
              loading={isAutoMatching}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              AI Auto-Match
            </Button>
          </Space>
        }
      />

      {/* Status Banner */}
      <StatusBanner
        gradient="blue"
        icon={<SafetyCertificateOutlined />}
        title="Reconciliation Status"
        subtitle={selectedAccount?.name || 'Select Account'}
        stats={[
          { title: 'Bank Balance', value: `R ${stats.bankBalance.toLocaleString()}`, prefix: <BankOutlined /> },
          { title: 'Book Balance', value: `R ${stats.bookBalance.toLocaleString()}`, prefix: <FileTextOutlined /> },
          { title: 'Difference', value: `R ${stats.difference.toLocaleString()}`, prefix: <SwapOutlined /> },
          { title: 'Match Rate', value: `${stats.matchRate}%`, prefix: <CheckCircleOutlined /> },
        ]}
      />

      {/* Account Selector and Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="large" wrap>
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
                        <div style={{ fontWeight: 500 }}>{acc.name}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{acc.number} • {acc.currency}</Text>
                      </div>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
              <RangePicker size="large" />
              <Select placeholder="Filter Status" style={{ width: 150 }} allowClear>
                <Select.Option value="unmatched">Unmatched</Select.Option>
                <Select.Option value="ai-suggested">AI Suggested</Select.Option>
                <Select.Option value="matched">Matched</Select.Option>
                <Select.Option value="excluded">Excluded</Select.Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<SyncOutlined />}>Refresh</Button>
              <Button icon={<DownloadOutlined />}>Export</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* AI Insights Alert */}
      {stats.aiSuggestedCount > 0 && (
        <Alert
          message={
            <Space>
              <RobotOutlined />
              <Text strong>AI found {stats.aiSuggestedCount} potential matches</Text>
            </Space>
          }
          description={`${stats.aiSuggestedCount} transactions have been analyzed and suggestions are ready for review. Click 'AI Auto-Match' to accept all high-confidence matches (90%+) or review individually.`}
          type="info"
          showIcon={false}
          style={{ marginBottom: 16, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', border: '1px solid rgba(102, 126, 234, 0.3)' }}
          action={
            <Button type="primary" size="small" onClick={runAIAutoMatch} icon={<ThunderboltOutlined />}>
              Accept All (90%+)
            </Button>
          }
        />
      )}

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Matched"
              value={stats.matchedCount}
              valueStyle={{ color: '#10b981' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="AI Suggested"
              value={stats.aiSuggestedCount}
              valueStyle={{ color: '#722ed1' }}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Unmatched"
              value={stats.unmatchedCount}
              valueStyle={{ color: '#3b82f6' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">Progress</Text>
            </div>
            <Progress
              percent={stats.matchRate}
              strokeColor={{ '0%': '#667eea', '100%': '#10b981' }}
              format={(p) => <Text strong>{p}%</Text>}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Reconciliation Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab={<span><SwapOutlined /> Reconcile</span>} key="reconcile">
            <Row gutter={16}>
              {/* Bank Transactions */}
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <BankOutlined style={{ color: '#3b82f6' }} />
                      <span>Bank Transactions</span>
                      <Badge count={stats.unmatchedCount + stats.aiSuggestedCount} style={{ backgroundColor: '#3b82f6' }} />
                    </Space>
                  }
                  size="small"
                  extra={
                    <Input placeholder="Search..." prefix={<SearchOutlined />} style={{ width: 160 }} allowClear />
                  }
                >
                  <Table
                    dataSource={bankTransactions}
                    columns={bankTxnColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: true }}
                    rowClassName={(record) =>
                      record.status === 'matched' ? 'matched-row' :
                      record.status === 'ai-suggested' ? 'ai-suggested-row' :
                      record.status === 'excluded' ? 'excluded-row' : ''
                    }
                  />
                </Card>
              </Col>

              {/* Book Entries (AP/AR/GL) */}
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <FileTextOutlined style={{ color: '#667eea' }} />
                      <span>AP/AR & GL Entries</span>
                      <Tag color="red">AP</Tag>
                      <Tag color="green">AR</Tag>
                      <Tag color="blue">GL</Tag>
                    </Space>
                  }
                  size="small"
                  extra={
                    <Button size="small" icon={<PlusOutlined />}>Add Entry</Button>
                  }
                >
                  <Table
                    dataSource={bookEntries}
                    columns={bookEntriesColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: true }}
                    rowClassName={(record) => record.status === 'matched' ? 'matched-row' : ''}
                  />
                </Card>
              </Col>
            </Row>

            {/* Difference Analysis */}
            {stats.difference !== 0 && (
              <Alert
                style={{ marginTop: 16 }}
                message="Reconciliation Difference Analysis"
                description={
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Outstanding Items (Bank → Book):</Text>
                      <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 13 }}>
                        <li>Client LMN payment variance: R 500</li>
                        <li>Bank charges pending journal: R 450</li>
                      </ul>
                    </Col>
                    <Col span={12}>
                      <Text strong>Outstanding Items (Book → Bank):</Text>
                      <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 13 }}>
                        <li>Office supplies payment: R 2,350</li>
                        <li>DEF Corporation receipt: R 250,000 (unmatched)</li>
                      </ul>
                    </Col>
                  </Row>
                }
                type="warning"
                showIcon
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab={<span><TeamOutlined /> AP/AR Integration</span>} key="apar">
            <Alert
              message="Accounts Payable & Receivable Integration"
              description="This view shows all outstanding invoices from AP and AR that can be matched against bank transactions."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Card title={<><ShopOutlined style={{ color: '#ef4444' }} /> Accounts Payable (Outstanding)</>} size="small">
                  <List
                    dataSource={bookEntries.filter(e => e.source === 'ap' && e.status !== 'matched')}
                    renderItem={(item) => (
                      <List.Item actions={[<Button size="small" key="match">Find Match</Button>]}>
                        <List.Item.Meta
                          avatar={<Avatar style={{ background: '#ef4444' }}>AP</Avatar>}
                          title={item.vendorClient}
                          description={`${item.reference} • R ${item.amount.toLocaleString()}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<><DollarOutlined style={{ color: '#10b981' }} /> Accounts Receivable (Outstanding)</>} size="small">
                  <List
                    dataSource={bookEntries.filter(e => e.source === 'ar' && e.status !== 'matched')}
                    renderItem={(item) => (
                      <List.Item actions={[<Button size="small" key="match">Find Match</Button>]}>
                        <List.Item.Meta
                          avatar={<Avatar style={{ background: '#10b981' }}>AR</Avatar>}
                          title={item.vendorClient}
                          description={`${item.reference} • R ${item.amount.toLocaleString()}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>

          <Tabs.TabPane tab={<span><HistoryOutlined /> History</span>} key="history">
            <Table
              dataSource={[
                { id: 1, date: '2025-12-10', account: 'FNB Current', bankBal: 2400000, bookBal: 2400000, diff: 0, status: 'completed', user: 'AI Auto-Match', aiAssisted: true },
                { id: 2, date: '2025-12-09', account: 'FNB Current', bankBal: 2100000, bookBal: 2100000, diff: 0, status: 'completed', user: 'Sarah M.', aiAssisted: false },
                { id: 3, date: '2025-12-08', account: 'FNB Current', bankBal: 1950000, bookBal: 1948500, diff: 1500, status: 'completed', user: 'John D.', aiAssisted: true },
              ]}
              columns={[
                { title: 'Date', dataIndex: 'date', key: 'date' },
                { title: 'Account', dataIndex: 'account', key: 'account' },
                { title: 'Bank Balance', dataIndex: 'bankBal', key: 'bankBal', render: (v) => `R ${v.toLocaleString()}` },
                { title: 'Book Balance', dataIndex: 'bookBal', key: 'bookBal', render: (v) => `R ${v.toLocaleString()}` },
                { title: 'Difference', dataIndex: 'diff', key: 'diff', render: (v) => <Tag color={v === 0 ? 'green' : 'orange'}>R {v.toLocaleString()}</Tag> },
                { title: 'AI Assisted', dataIndex: 'aiAssisted', key: 'aiAssisted', render: (v) => v ? <Tag color="purple"><RobotOutlined /> Yes</Tag> : <Tag>No</Tag> },
                { title: 'Reconciled By', dataIndex: 'user', key: 'user' },
                { title: 'Action', key: 'action', render: () => <Button size="small" icon={<EyeOutlined />}>View</Button> }
              ]}
              rowKey="id"
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab={<span><RobotOutlined /> AI Rules</span>} key="rules">
            <Alert
              message="AI Matching Rules"
              description="Configure how AI analyzes and matches transactions. Higher priority rules are applied first."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              dataSource={[
                { id: 1, name: 'Invoice Reference Match', field: 'Reference', condition: 'Contains invoice number', priority: 1, confidence: 95, enabled: true },
                { id: 2, name: 'Exact Amount + Date', field: 'Amount & Date', condition: 'Amount exact, ±2 days', priority: 2, confidence: 90, enabled: true },
                { id: 3, name: 'Company Name Match', field: 'Description', condition: 'Contains vendor/client name', priority: 3, confidence: 85, enabled: true },
                { id: 4, name: 'Fuzzy Amount Match', field: 'Amount', condition: '±R500 tolerance', priority: 4, confidence: 70, enabled: true },
                { id: 5, name: 'Recurring Pattern', field: 'Pattern', condition: 'Detects recurring transactions', priority: 5, confidence: 80, enabled: true },
              ]}
              columns={[
                { title: 'Rule Name', dataIndex: 'name', key: 'name', render: (text) => <Text strong>{text}</Text> },
                { title: 'Match Field', dataIndex: 'field', key: 'field' },
                { title: 'Condition', dataIndex: 'condition', key: 'condition' },
                { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p) => <Tag color="blue">#{p}</Tag> },
                { title: 'Min Confidence', dataIndex: 'confidence', key: 'confidence', render: (c) => `${c}%` },
                { title: 'Enabled', dataIndex: 'enabled', key: 'enabled', render: (enabled) => <Switch checked={enabled} size="small" /> },
                { title: 'Actions', key: 'actions', render: () => (
                  <Space>
                    <Button size="small">Edit</Button>
                  </Space>
                )}
              ]}
              rowKey="id"
              pagination={false}
            />
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 16 }}>
              Add Custom Rule
            </Button>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Manual Match Modal */}
      <Modal
        title={<><LinkOutlined /> Match Transaction</>}
        open={showMatchModal}
        onCancel={() => setShowMatchModal(false)}
        onOk={confirmManualMatch}
        width={800}
        okText="Confirm Match"
      >
        {selectedBankTxn && (
          <>
            <Alert
              message={
                <Space>
                  <BankOutlined />
                  <Text strong>{selectedBankTxn.description}</Text>
                  <Text type={selectedBankTxn.type === 'credit' ? 'success' : 'danger'} strong>
                    {selectedBankTxn.type === 'credit' ? '+' : '-'} R {selectedBankTxn.amount.toLocaleString()}
                  </Text>
                </Space>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Text strong style={{ marginBottom: 12, display: 'block' }}>Select AP/AR/GL entries to match:</Text>
            <Table
              dataSource={bookEntries.filter(e => e.status === 'unmatched')}
              rowSelection={{
                selectedRowKeys: selectedBookEntries,
                onChange: (keys) => setSelectedBookEntries(keys as string[])
              }}
              columns={[
                { title: 'Source', dataIndex: 'source', key: 'source', width: 60, render: (s) => getSourceBadge(s) },
                { title: 'Date', dataIndex: 'date', key: 'date', width: 100 },
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Vendor/Client', dataIndex: 'vendorClient', key: 'vendorClient', width: 150 },
                { title: 'Reference', dataIndex: 'reference', key: 'reference', width: 120 },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 110, render: (v, r) => (
                  <Text style={{ color: r.type === 'credit' ? '#10b981' : '#ef4444' }}>R {v.toLocaleString()}</Text>
                )}
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
        title={<><UploadOutlined /> Import Bank Statement</>}
        placement="right"
        width={500}
        open={showImportDrawer}
        onClose={() => setShowImportDrawer(false)}
      >
        <Alert
          message="Supported Formats"
          description="CSV, OFX, QIF, MT940 (SWIFT), PDF (with OCR)"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Dragger
          accept=".csv,.ofx,.qif,.txt,.pdf"
          multiple={false}
          beforeUpload={(file) => {
            handleImportStatement(file);
            return false;
          }}
          disabled={isProcessingImport}
          style={{ marginBottom: 24 }}
        >
          {isProcessingImport ? (
            <div style={{ padding: 40 }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>Processing statement...</p>
            </div>
          ) : (
            <>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#667eea' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to upload</p>
              <p className="ant-upload-hint">
                Supports CSV, OFX, QIF, MT940, and PDF formats
              </p>
            </>
          )}
        </Dragger>

        <Divider>Or connect bank (Coming Soon)</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button block icon={<BankOutlined />} disabled>
            <Space>Connect via Yodlee <Tag>Coming Soon</Tag></Space>
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Direct bank feeds will be available after Yodlee integration in Phase 2.
          </Text>
        </Space>
      </Drawer>

      <style>{`
        .matched-row { background-color: rgba(16, 185, 129, 0.05) !important; }
        .ai-suggested-row { background-color: rgba(114, 46, 209, 0.05) !important; }
        .excluded-row { background-color: rgba(0, 0, 0, 0.02) !important; opacity: 0.7; }
      `}</style>
    </HubLayout>
  );
};

export default BankReconciliation;
