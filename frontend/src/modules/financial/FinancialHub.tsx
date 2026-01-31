import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Divider,
  List,
  Alert,
  Spin,
  Empty,
  InputNumber,
} from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SyncOutlined,
  SettingOutlined,
  CalendarOutlined,
  AuditOutlined,
  CalculatorOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  BookOutlined,
  LoadingOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import {
  HubLayout,
  HubHeader,
  StatusBanner,
  HubTabs,
  StatCard,
  QuickActionsCard,
  StatusIndicator,
  InfoListCard,
} from '../../components/hub';
import { financialService } from '../../services/financial.service';
import type { FinancialStats, JournalEntry, TrialBalanceEntry, Account, CostCenter, Department, Project, Product, Location } from '../../services/financial.service';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Types for state
interface FinancialStatsState {
  revenue: number;
  expenses: number;
  netIncome: number;
  grossMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  cashBalance: number;
  receivables: number;
  payables: number;
  currentPeriod: string;
  periodStatus: string;
  closingDate: string;
}

interface TrialBalanceItem {
  code: string;
  name: string;
  debit: number;
  credit: number;
  type: string;
}

interface JournalItem {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  status: string;
  createdBy: string;
}

interface FinancialReport {
  name: string;
  code: string;
  period: string;
  status: string;
  icon: React.ReactNode;
}

interface PeriodStatus {
  period: string;
  status: string;
  closedDate: string | null;
}

// Default financial reports (these are UI configs, not from API)
const defaultFinancialReports: FinancialReport[] = [
  { name: 'Income Statement', code: 'income-statement', period: 'January 2026', status: 'ready', icon: <BarChartOutlined /> },
  { name: 'Balance Sheet', code: 'balance-sheet', period: 'January 2026', status: 'ready', icon: <PieChartOutlined /> },
  { name: 'Cash Flow Statement', code: 'cash-flow', period: 'January 2026', status: 'ready', icon: <DollarOutlined /> },
  { name: 'Trial Balance', code: 'trial-balance', period: 'January 2026', status: 'ready', icon: <FileTextOutlined /> },
  { name: 'General Ledger', code: 'general-ledger', period: 'January 2026', status: 'ready', icon: <BookOutlined /> },
  { name: 'Aged Receivables', code: 'aged-receivables', period: 'January 2026', status: 'ready', icon: <CalendarOutlined /> },
  { name: 'Aged Payables', code: 'aged-payables', period: 'January 2026', status: 'ready', icon: <CalendarOutlined /> },
  { name: 'VAT Report', code: 'vat-report', period: 'January 2026', status: 'ready', icon: <SafetyCertificateOutlined /> },
];

const FinancialHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalForm] = Form.useForm();
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [journalLines, setJournalLines] = useState<Array<{ 
    key: number; 
    account: string; 
    debit: number; 
    credit: number;
    costCenterId?: string;
    departmentId?: string;
    projectId?: string;
    productId?: string;
    locationId?: string;
    description?: string;
  }>>([
    { key: 1, account: '', debit: 0, credit: 0 },
    { key: 2, account: '', debit: 0, credit: 0 },
  ]);

  // API State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStatsState>({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    grossMargin: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    equity: 0,
    cashBalance: 0,
    receivables: 0,
    payables: 0,
    currentPeriod: 'December 2025',
    periodStatus: 'open',
    closingDate: '2026-01-15',
  });
  const [trialBalance, setTrialBalance] = useState<TrialBalanceItem[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalItem[]>([]);
  const [financialReports] = useState<FinancialReport[]>(defaultFinancialReports);
  const [periodStatuses, setPeriodStatuses] = useState<PeriodStatus[]>([
    { period: 'October 2025', status: 'closed', closedDate: '2025-11-10' },
    { period: 'November 2025', status: 'closed', closedDate: '2025-12-08' },
    { period: 'December 2025', status: 'open', closedDate: null },
    { period: 'January 2026', status: 'future', closedDate: null },
  ]);

  // Fetch data from API
  useEffect(() => {
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats
        const stats = await financialService.getStats();
        const revenue = parseFloat(stats.total_revenue) || 0;
        const expenses = parseFloat(stats.total_expenses) || 0;
        const assets = parseFloat(stats.total_assets) || 0;
        const liabilities = parseFloat(stats.total_liabilities) || 0;
        
        setFinancialStats({
          revenue,
          expenses,
          netIncome: parseFloat(stats.net_income) || (revenue - expenses),
          grossMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
          totalAssets: assets,
          totalLiabilities: liabilities,
          equity: parseFloat(stats.equity) || (assets - liabilities),
          cashBalance: parseFloat(stats.cash_balance) || 0,
          receivables: parseFloat(stats.receivables) || 0,
          payables: parseFloat(stats.payables) || 0,
          currentPeriod: 'December 2025',
          periodStatus: 'open',
          closingDate: '2026-01-15',
        });

        // Fetch trial balance
        try {
          const tbResponse = await financialService.getTrialBalance();
          if (tbResponse.data && Array.isArray(tbResponse.data)) {
            setTrialBalance(tbResponse.data.map((entry: TrialBalanceEntry) => ({
              code: entry.account_code,
              name: entry.account_name,
              debit: entry.debit || 0,
              credit: entry.credit || 0,
              type: entry.account_type?.toLowerCase() || 'asset',
            })));
          }
        } catch {
          // Use derived trial balance from stats if endpoint fails
          setTrialBalance([
            { code: '1000', name: 'Assets', debit: assets, credit: 0, type: 'asset' },
            { code: '2000', name: 'Liabilities', debit: 0, credit: liabilities, type: 'liability' },
            { code: '3000', name: 'Equity', debit: 0, credit: assets - liabilities, type: 'equity' },
            { code: '4000', name: 'Revenue', debit: 0, credit: revenue, type: 'revenue' },
            { code: '5000', name: 'Expenses', debit: expenses, credit: 0, type: 'expense' },
          ]);
        }

        // Fetch journal entries
        try {
          const journalsResponse = await financialService.getJournalEntries({ limit: 10 });
          if (journalsResponse.data && Array.isArray(journalsResponse.data)) {
            setRecentJournals(journalsResponse.data.map((j: JournalEntry) => ({
              id: j.journal_number || j.journal_id,
              date: j.entry_date,
              description: j.description,
              debit: j.total_debit,
              credit: j.total_credit,
              status: j.status?.toLowerCase() || 'posted',
              createdBy: j.created_by || 'System',
            })));
          }
        } catch {
          // Leave empty if no journals
          setRecentJournals([]);
        }

        // Fetch periods
        try {
          const periodsResponse = await financialService.getPeriods();
          if (periodsResponse.data && Array.isArray(periodsResponse.data)) {
            setPeriodStatuses(periodsResponse.data.map(p => ({
              period: p.period,
              status: p.status,
              closedDate: p.closed_date || null,
            })));
          }
        } catch {
          // Keep defaults
        }

        // Fetch accounts for journal entry dropdown
        try {
          const accountsResponse = await financialService.getChartOfAccounts({ limit: 200 });
          if (accountsResponse.data && Array.isArray(accountsResponse.data)) {
            // Filter out inactive accounts and those without valid IDs
            setAccounts(accountsResponse.data.filter((a: Account) => 
              a.is_active !== false && (a.id || a.account_id)
            ));
          }
        } catch {
          // Will use empty accounts list
        }

        // Fetch dimensions for journal entry dropdowns
        try {
          const dimensions = await financialService.getAllDimensions();
          setCostCenters(dimensions.costCenters.filter(d => d.is_active !== false));
          setDepartments(dimensions.departments.filter(d => d.is_active !== false));
          setProjects(dimensions.projects.filter(d => d.is_active !== false));
          setProducts(dimensions.products.filter(d => d.is_active !== false));
          setLocations(dimensions.locations.filter(d => d.is_active !== false));
        } catch {
          // Will use empty dimension lists
        }

      } catch (err: unknown) {
        console.error('Failed to fetch financial data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load financial data';
        setError(errorMessage);
        message.error('Failed to load financial data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Handle journal entry submission
  const handleJournalSubmit = async () => {
    try {
      const values = await journalForm.validateFields();
      
      // Validate lines
      const validLines = journalLines.filter(line => line.account && (line.debit > 0 || line.credit > 0));
      if (validLines.length < 2) {
        message.error('Please add at least 2 journal lines with accounts and amounts');
        return;
      }

      // Check debits = credits
      const totalDebit = validLines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = validLines.reduce((sum, line) => sum + (line.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        message.error(`Debits (R${totalDebit.toFixed(2)}) must equal Credits (R${totalCredit.toFixed(2)})`);
        return;
      }

      setJournalSubmitting(true);

      const payload = {
        entry_date: values.entry_date.format('YYYY-MM-DD'),
        description: values.description,
        lines: validLines.map(line => ({
          account_id: line.account,
          debit_amount: line.debit || 0,
          credit_amount: line.credit || 0,
          cost_center_id: line.costCenterId || null,
          department_id: line.departmentId || null,
          project_id: line.projectId || null,
          product_id: line.productId || null,
          location_id: line.locationId || null,
          description: line.description || null,
        })),
      };

      const result = await financialService.createJournalEntry(payload);
      
      if (result.success) {
        message.success(`Journal Entry ${result.data?.entry_number || ''} created successfully!`);
        setShowJournalModal(false);
        journalForm.resetFields();
        setJournalLines([
          { key: 1, account: '', debit: 0, credit: 0 },
          { key: 2, account: '', debit: 0, credit: 0 },
        ]);
        // Refresh journal entries list
        const journalsResponse = await financialService.getJournalEntries({ limit: 10 });
        if (journalsResponse.data && Array.isArray(journalsResponse.data)) {
          setRecentJournals(journalsResponse.data.map((j: JournalEntry) => ({
            id: j.journal_number || j.journal_id,
            date: j.entry_date,
            description: j.description,
            debit: j.total_debit,
            credit: j.total_credit,
            status: j.status?.toLowerCase() || 'posted',
            createdBy: j.created_by || 'System',
          })));
        }
      } else {
        message.error(result.message || 'Failed to create journal entry');
      }
    } catch (err: unknown) {
      console.error('Journal entry error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create journal entry';
      message.error(errorMessage);
    } finally {
      setJournalSubmitting(false);
    }
  };

  // Journal line handlers
  const addJournalLine = () => {
    const newKey = Math.max(...journalLines.map(l => l.key)) + 1;
    setJournalLines([...journalLines, { key: newKey, account: '', debit: 0, credit: 0 }]);
  };

  const removeJournalLine = (key: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter(l => l.key !== key));
    }
  };

  const updateJournalLine = (key: number, field: string, value: string | number) => {
    setJournalLines(journalLines.map(l => 
      l.key === key ? { ...l, [field]: value } : l
    ));
  };

  // Refresh data function
  const handleRefresh = () => {
    setLoading(true);
    financialService.getStats()
      .then(stats => {
        const revenue = parseFloat(stats.total_revenue) || 0;
        const expenses = parseFloat(stats.total_expenses) || 0;
        setFinancialStats(prev => ({
          ...prev,
          revenue,
          expenses,
          netIncome: revenue - expenses,
          cashBalance: parseFloat(stats.cash_balance) || 0,
        }));
        message.success('Data refreshed');
      })
      .catch(() => message.error('Failed to refresh'))
      .finally(() => setLoading(false));
  };

  // Download report as CSV
  const handleDownloadReport = async (reportCode: string, reportName: string) => {
    try {
      message.loading({ content: `Generating ${reportName}...`, key: 'download' });
      
      const response = await financialService.downloadReport(reportCode);
      
      if (!response.success || !response.data) {
        message.error({ content: `No data available for ${reportName}`, key: 'download' });
        return;
      }

      // Generate CSV based on report type
      let csvContent = '';
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (reportCode === 'balance-sheet') {
        csvContent = generateBalanceSheetCSV(response.data);
      } else if (reportCode === 'income-statement') {
        csvContent = generateIncomeStatementCSV(response.data);
      } else if (reportCode === 'trial-balance') {
        csvContent = generateTrialBalanceCSV(response.data);
      } else if (reportCode === 'cash-flow') {
        csvContent = generateCashFlowCSV(response.data);
      } else if (reportCode === 'general-ledger') {
        csvContent = generateGeneralLedgerCSV(response.data);
      } else if (reportCode === 'aged-receivables') {
        csvContent = generateAgedReceivablesCSV(response.data);
      } else if (reportCode === 'aged-payables') {
        csvContent = generateAgedPayablesCSV(response.data);
      } else if (reportCode === 'vat-report') {
        csvContent = generateVATReportCSV(response.data);
      } else {
        csvContent = `Report: ${reportName}\nGenerated: ${dateStr}\n\nReport data not available in CSV format yet.\nPlease check back as this report is being developed.`;
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportCode}_${dateStr}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      message.success({ content: `${reportName} downloaded!`, key: 'download' });
    } catch (err) {
      console.error('Download error:', err);
      message.error({ content: `Failed to download ${reportName}`, key: 'download' });
    }
  };

  // Generate CSV for Balance Sheet
  const generateBalanceSheetCSV = (data: any) => {
    let csv = `Balance Sheet\nAs of: ${data.as_of_date || new Date().toISOString().split('T')[0]}\n\n`;
    
    csv += 'ASSETS\n';
    csv += 'Account,Balance\n';
    if (data.current_assets?.accounts?.length > 0) {
      csv += 'Current Assets\n';
      data.current_assets.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || 0}\n`;
      });
      csv += `Current Assets Subtotal,${data.current_assets.subtotal || 0}\n`;
    }
    if (data.non_current_assets?.accounts?.length > 0) {
      csv += 'Non-Current Assets\n';
      data.non_current_assets.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || 0}\n`;
      });
      csv += `Non-Current Assets Subtotal,${data.non_current_assets.subtotal || 0}\n`;
    }
    csv += `TOTAL ASSETS,${data.total_assets || 0}\n\n`;
    
    csv += 'LIABILITIES\n';
    if (data.current_liabilities?.accounts?.length > 0) {
      csv += 'Current Liabilities\n';
      data.current_liabilities.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || 0}\n`;
      });
      csv += `Current Liabilities Subtotal,${data.current_liabilities.subtotal || 0}\n`;
    }
    if (data.non_current_liabilities?.accounts?.length > 0) {
      csv += 'Non-Current Liabilities\n';
      data.non_current_liabilities.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || 0}\n`;
      });
      csv += `Non-Current Liabilities Subtotal,${data.non_current_liabilities.subtotal || 0}\n`;
    }
    csv += `TOTAL LIABILITIES,${data.total_liabilities || 0}\n\n`;
    
    csv += 'EQUITY\n';
    if (data.equity?.accounts?.length > 0) {
      data.equity.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || 0}\n`;
      });
    }
    csv += `TOTAL EQUITY,${data.total_equity || 0}\n\n`;
    csv += `TOTAL LIABILITIES & EQUITY,${data.total_liabilities_equity || 0}\n`;
    
    return csv;
  };

  // Generate CSV for Income Statement
  const generateIncomeStatementCSV = (data: any) => {
    let csv = `Income Statement\nPeriod: ${data.period || 'Current'}\n\n`;
    
    csv += 'REVENUE\n';
    csv += 'Account,Amount\n';
    if (data.revenue?.accounts?.length > 0) {
      data.revenue.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || acc.amount || 0}\n`;
      });
    }
    csv += `Total Revenue,${data.total_revenue || data.revenue?.total || 0}\n\n`;
    
    csv += 'EXPENSES\n';
    if (data.expenses?.accounts?.length > 0) {
      data.expenses.accounts.forEach((acc: any) => {
        csv += `"${acc.account_name || acc.name}",${acc.balance || acc.amount || 0}\n`;
      });
    }
    csv += `Total Expenses,${data.total_expenses || data.expenses?.total || 0}\n\n`;
    
    csv += `NET INCOME,${data.net_income || 0}\n`;
    
    return csv;
  };

  // Generate CSV for Trial Balance
  const generateTrialBalanceCSV = (data: any) => {
    let csv = `Trial Balance\nAs of: ${new Date().toISOString().split('T')[0]}\n\n`;
    csv += 'Account Code,Account Name,Debit,Credit\n';
    
    const accounts = data.accounts || data.data || data;
    if (Array.isArray(accounts)) {
      accounts.forEach((acc: any) => {
        const debit = acc.debit || acc.debit_balance || 0;
        const credit = acc.credit || acc.credit_balance || 0;
        csv += `"${acc.account_code || acc.code}","${acc.account_name || acc.name}",${debit},${credit}\n`;
      });
    }
    
    csv += `\nTOTALS,${data.totals?.debit || ''},${data.totals?.credit || ''}\n`;
    
    return csv;
  };

  // Generate CSV for Cash Flow Statement
  const generateCashFlowCSV = (data: any) => {
    let csv = `Cash Flow Statement\nPeriod: ${data.period?.label || 'Current'}\n\n`;
    
    csv += 'OPERATING ACTIVITIES\n';
    csv += 'Description,Amount\n';
    if (data.operating?.items?.length > 0) {
      data.operating.items.forEach((item: any) => {
        csv += `"${item.description}",${item.amount || 0}\n`;
      });
    }
    csv += `Net Cash from Operating,${data.operating?.total || 0}\n\n`;
    
    csv += 'INVESTING ACTIVITIES\n';
    if (data.investing?.items?.length > 0) {
      data.investing.items.forEach((item: any) => {
        csv += `"${item.description}",${item.amount || 0}\n`;
      });
    }
    csv += `Net Cash from Investing,${data.investing?.total || 0}\n\n`;
    
    csv += 'FINANCING ACTIVITIES\n';
    if (data.financing?.items?.length > 0) {
      data.financing.items.forEach((item: any) => {
        csv += `"${item.description}",${item.amount || 0}\n`;
      });
    }
    csv += `Net Cash from Financing,${data.financing?.total || 0}\n\n`;
    
    csv += `NET CHANGE IN CASH,${data.net_change || 0}\n`;
    csv += `Beginning Cash,${data.beginning_cash || 0}\n`;
    csv += `Ending Cash,${data.ending_cash || 0}\n`;
    
    return csv;
  };

  // Generate CSV for General Ledger
  const generateGeneralLedgerCSV = (data: any) => {
    let csv = `General Ledger\nGenerated: ${new Date().toISOString().split('T')[0]}\n\n`;
    csv += 'Account Code,Account Name,Date,Reference,Description,Debit,Credit,Balance\n';
    
    const accounts = data.accounts || data.data || [];
    accounts.forEach((account: any) => {
      csv += `\n${account.account_code || ''} - ${account.account_name || ''}\n`;
      const transactions = account.transactions || [];
      let runningBalance = account.opening_balance || 0;
      transactions.forEach((txn: any) => {
        runningBalance += (txn.debit || 0) - (txn.credit || 0);
        csv += `"${account.account_code || ''}","${account.account_name || ''}","${txn.date || ''}","${txn.reference || ''}","${txn.description || ''}",${txn.debit || 0},${txn.credit || 0},${runningBalance}\n`;
      });
      csv += `Account Totals,,,,"",${account.total_debits || 0},${account.total_credits || 0},${account.closing_balance || runningBalance}\n`;
    });
    
    csv += `\nGRAND TOTALS,,,,"",${data.total_debits || 0},${data.total_credits || 0}\n`;
    
    return csv;
  };

  // Generate CSV for Aged Receivables
  const generateAgedReceivablesCSV = (data: any) => {
    let csv = `Aged Receivables Report\nAs of: ${data.as_of_date || new Date().toISOString().split('T')[0]}\n\n`;
    csv += 'Customer,Current (0-30),31-60 Days,61-90 Days,Over 90 Days,Total Outstanding\n';
    
    const customers = data.customers || data.data || [];
    customers.forEach((customer: any) => {
      csv += `"${customer.customer_name || customer.name || ''}",${customer.current || customer.bucket_0_30 || 0},${customer.days_31_60 || customer.bucket_31_60 || 0},${customer.days_61_90 || customer.bucket_61_90 || 0},${customer.over_90 || customer.bucket_90_plus || 0},${customer.total || 0}\n`;
    });
    
    csv += `\nTOTALS,${data.totals?.current || data.summary?.bucket_0_30 || 0},${data.totals?.days_31_60 || data.summary?.bucket_31_60 || 0},${data.totals?.days_61_90 || data.summary?.bucket_61_90 || 0},${data.totals?.over_90 || data.summary?.bucket_90_plus || 0},${data.totals?.total || data.summary?.total_outstanding || 0}\n`;
    
    return csv;
  };

  // Generate CSV for Aged Payables
  const generateAgedPayablesCSV = (data: any) => {
    let csv = `Aged Payables Report\nAs of: ${data.as_of_date || new Date().toISOString().split('T')[0]}\n\n`;
    csv += 'Supplier,Current (0-30),31-60 Days,61-90 Days,Over 90 Days,Total Outstanding\n';
    
    const suppliers = data.suppliers || data.data || [];
    suppliers.forEach((supplier: any) => {
      csv += `"${supplier.supplier_name || supplier.name || ''}",${supplier.current || supplier.bucket_0_30 || 0},${supplier.days_31_60 || supplier.bucket_31_60 || 0},${supplier.days_61_90 || supplier.bucket_61_90 || 0},${supplier.over_90 || supplier.bucket_90_plus || 0},${supplier.total || 0}\n`;
    });
    
    csv += `\nTOTALS,${data.totals?.current || data.summary?.bucket_0_30 || 0},${data.totals?.days_31_60 || data.summary?.bucket_31_60 || 0},${data.totals?.days_61_90 || data.summary?.bucket_61_90 || 0},${data.totals?.over_90 || data.summary?.bucket_90_plus || 0},${data.totals?.total || data.summary?.total_outstanding || 0}\n`;
    
    return csv;
  };

  // Generate CSV for VAT Report
  const generateVATReportCSV = (data: any) => {
    let csv = `VAT Report\nPeriod: ${data.period || 'Current'}\n\n`;
    
    csv += 'OUTPUT VAT (Sales)\n';
    csv += 'Description,Amount,VAT Rate,VAT Amount\n';
    const outputItems = data.output_vat?.items || data.output?.items || [];
    outputItems.forEach((item: any) => {
      csv += `"${item.description || item.name || ''}",${item.amount || item.base_amount || 0},${item.vat_rate || 15}%,${item.vat_amount || 0}\n`;
    });
    csv += `Total Output VAT,,,${data.output_vat?.total || data.total_output_vat || 0}\n\n`;
    
    csv += 'INPUT VAT (Purchases)\n';
    csv += 'Description,Amount,VAT Rate,VAT Amount\n';
    const inputItems = data.input_vat?.items || data.input?.items || [];
    inputItems.forEach((item: any) => {
      csv += `"${item.description || item.name || ''}",${item.amount || item.base_amount || 0},${item.vat_rate || 15}%,${item.vat_amount || 0}\n`;
    });
    csv += `Total Input VAT,,,${data.input_vat?.total || data.total_input_vat || 0}\n\n`;
    
    csv += `NET VAT PAYABLE/(REFUND),,,${data.net_vat || data.vat_payable || 0}\n`;
    
    return csv;
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA')}`;

  const getStatusTag = (status: string) => {
    const configs: Record<string, { color: string; text: string; icon?: React.ReactNode }> = {
      'posted': { color: 'green', text: 'Posted', icon: <CheckCircleOutlined /> },
      'pending': { color: 'orange', text: 'Pending', icon: <ClockCircleOutlined /> },
      'draft': { color: 'default', text: 'Draft' },
      'ready': { color: 'green', text: 'Ready', icon: <CheckCircleOutlined /> },
      'generating': { color: 'blue', text: 'Generating', icon: <SyncOutlined spin /> },
      'submitted': { color: 'purple', text: 'Submitted' },
      'open': { color: 'green', text: 'Open' },
      'closed': { color: 'default', text: 'Closed' },
      'future': { color: 'blue', text: 'Future' },
    };
    const config = configs[status] || { color: 'default', text: status };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const journalColumns = [
    {
      title: 'Reference',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
  ];

  const tabs = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChartOutlined />,
      children: (
        <Row gutter={24}>
          {/* Left Column - Key Metrics */}
          <Col span={16}>
            {/* P&L Summary */}
            <Card title="Profit & Loss Summary" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={8}>
                  <Statistic
                    title="Revenue"
                    value={financialStats.revenue}
                    prefix="R"
                    valueStyle={{ color: '#10b981' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Expenses"
                    value={financialStats.expenses}
                    prefix="R"
                    valueStyle={{ color: '#ef4444' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Net Income"
                    value={financialStats.netIncome}
                    prefix="R"
                    valueStyle={{ color: '#667eea', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">Gross Margin</Text>
                <Progress 
                  percent={financialStats.grossMargin} 
                  strokeColor="#667eea"
                  style={{ width: 200 }}
                />
              </div>
            </Card>

            {/* Recent Journal Entries */}
            <Card 
              title="Recent Journal Entries"
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} onClick={() => setShowJournalModal(true)}>
                    New Entry
                  </Button>
                  <Button type="link">View All</Button>
                </Space>
              }
            >
              <Table
                dataSource={recentJournals}
                columns={journalColumns}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>

          {/* Right Column */}
          <Col span={8}>
            {/* Balance Sheet Summary */}
            <Card title="Balance Sheet Summary" style={{ marginBottom: 24 }}>
              <div className="info-list-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text>Total Assets</Text>
                <Text strong>{formatCurrency(financialStats.totalAssets)}</Text>
              </div>
              <div className="info-list-item" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text>Total Liabilities</Text>
                <Text strong style={{ color: '#ef4444' }}>{formatCurrency(financialStats.totalLiabilities)}</Text>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div className="info-list-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text strong>Shareholders' Equity</Text>
                <Text strong style={{ color: '#10b981' }}>{formatCurrency(financialStats.equity)}</Text>
              </div>
            </Card>

            {/* Quick Actions */}
            <QuickActionsCard
              title="Quick Actions"
              actions={[
                { icon: <PlusOutlined />, label: 'Journal Entry', onClick: () => setShowJournalModal(true) },
                { icon: <CalculatorOutlined />, label: 'Reconcile' },
                { icon: <PrinterOutlined />, label: 'Print Reports' },
                { icon: <AuditOutlined />, label: 'Period Close' },
              ]}
            />

            {/* Period Status */}
            <Card title="Period Status" style={{ marginTop: 24 }}>
              {periodStatuses.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < periodStatuses.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <Text>{p.period}</Text>
                  {getStatusTag(p.status)}
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <FileTextOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Financial Reports">
              <List
                dataSource={financialReports}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />} 
                        key="download"
                        onClick={() => handleDownloadReport(item.code, item.name)}
                      >
                        Download
                      </Button>,
                      <Button type="link" icon={<PrinterOutlined />} key="print">Print</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 24, color: '#667eea' }}>{item.icon}</span>}
                      title={<Text strong>{item.name}</Text>}
                      description={item.period}
                    />
                    {getStatusTag(item.status)}
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Report Schedule">
              <Paragraph>Automated report generation and distribution settings.</Paragraph>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'ledger',
      label: 'General Ledger',
      icon: <BookOutlined />,
      children: (
        <Card title="Trial Balance">
          <Table
            dataSource={trialBalance}
            columns={[
              { title: 'Code', dataIndex: 'code', key: 'code' },
              { title: 'Account', dataIndex: 'name', key: 'name', render: (t: string) => <Text strong>{t}</Text> },
              { title: 'Debit', dataIndex: 'debit', key: 'debit', render: (v: number) => v > 0 ? formatCurrency(v) : '-', align: 'right' as const },
              { title: 'Credit', dataIndex: 'credit', key: 'credit', render: (v: number) => v > 0 ? formatCurrency(v) : '-', align: 'right' as const },
            ]}
            rowKey="code"
            pagination={false}
            summary={() => (
              <Table.Summary>
                <Table.Summary.Row style={{ background: '#f8fafc' }}>
                  <Table.Summary.Cell index={0} />
                  <Table.Summary.Cell index={1}><Text strong>Total</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{formatCurrency(trialBalance.reduce((sum, r) => sum + r.debit, 0))}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{formatCurrency(trialBalance.reduce((sum, r) => sum + r.credit, 0))}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
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
            <Card title="Chart of Accounts">
              <Paragraph>Manage your account structure and categories.</Paragraph>
              <Button 
                type="primary" 
                icon={<SettingOutlined />}
                onClick={() => navigate('/app/financial/chart-of-accounts')}
              >
                Configure Accounts
              </Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Dimensions">
              <Paragraph>Configure cost centers, departments, and tracking dimensions.</Paragraph>
              <Button 
                type="primary" 
                icon={<AppstoreOutlined />}
                onClick={() => navigate('/app/financial/dimensions')}
              >
                Manage Dimensions
              </Button>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'fiscal',
      label: 'Fiscal Settings',
      icon: <CalendarOutlined />,
      children: (
        <Row gutter={24}>
          <Col span={12}>
            <Card title="Fiscal Year Settings">
              <Form layout="vertical">
                <Form.Item label="Fiscal Year Start">
                  <Select defaultValue="march">
                    <Select.Option value="january">January</Select.Option>
                    <Select.Option value="march">March (RSA Standard)</Select.Option>
                    <Select.Option value="july">July</Select.Option>
                  </Select>
                </Form.Item>
                <Button type="primary">Save Settings</Button>
              </Form>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Period Management">
              <Paragraph>Manage fiscal periods, close periods, and year-end processing.</Paragraph>
              <Space>
                <Button>View Periods</Button>
                <Button type="primary">Close Current Period</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <HubLayout>
      <HubHeader
        title="Financial Management"
        subtitle="General Ledger, Reporting & Period Management"
        icon={<DollarOutlined />}
        gradient="blue"
        actions={
          <>
            <Button icon={<SyncOutlined />}>Refresh</Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowJournalModal(true)}>
              New Journal Entry
            </Button>
          </>
        }
      />

      <StatusBanner
        gradient="blue"
        icon={<BarChartOutlined />}
        title="Financial Overview"
        subtitle={financialStats.currentPeriod}
        stats={[
          { title: 'Revenue', value: financialStats.revenue, prefix: 'R', span: 4 },
          { title: 'Net Income', value: financialStats.netIncome, prefix: 'R', valueStyle: { color: '#86efac' }, span: 4 },
          { title: 'Cash Balance', value: financialStats.cashBalance, prefix: 'R', span: 4 },
          { title: 'Receivables', value: financialStats.receivables, prefix: 'R', span: 4 },
          { title: 'Period', value: 'Open', valueStyle: { color: '#86efac' }, span: 3 },
        ]}
      />

      <HubTabs 
        theme="blue"
        tabs={tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {/* New Journal Entry Modal */}
      <Modal
        title="New Journal Entry"
        open={showJournalModal}
        onCancel={() => {
          setShowJournalModal(false);
          journalForm.resetFields();
          setJournalLines([
            { key: 1, account: '', debit: 0, credit: 0 },
            { key: 2, account: '', debit: 0, credit: 0 },
          ]);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowJournalModal(false)}>Cancel</Button>,
          <Button 
            key="post" 
            type="primary" 
            loading={journalSubmitting}
            onClick={handleJournalSubmit}
          >
            Post Entry
          </Button>
        ]}
        width={900}
      >
        <Form form={journalForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="entry_date" 
                label="Date" 
                rules={[{ required: true, message: 'Please select a date' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Reference">
                <Input placeholder="Auto-generated" disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            name="description" 
            label="Description" 
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input placeholder="Enter journal description" />
          </Form.Item>
          
          <Divider>Journal Lines</Divider>
          
          {/* Totals Summary */}
          <Row gutter={16} style={{ marginBottom: 16, background: '#f5f5f5', padding: '8px 16px', borderRadius: 4 }}>
            <Col span={10}>
              <Text strong>Totals:</Text>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Text strong style={{ color: '#1890ff' }}>
                Debit: R {journalLines.reduce((sum, l) => sum + (l.debit || 0), 0).toFixed(2)}
              </Text>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Text strong style={{ color: '#52c41a' }}>
                Credit: R {journalLines.reduce((sum, l) => sum + (l.credit || 0), 0).toFixed(2)}
              </Text>
            </Col>
            <Col span={2}>
              {Math.abs(journalLines.reduce((sum, l) => sum + (l.debit || 0), 0) - 
                       journalLines.reduce((sum, l) => sum + (l.credit || 0), 0)) < 0.01 ? (
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              ) : (
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
              )}
            </Col>
          </Row>

          {journalLines.map((line, index) => (
            <div key={line.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #e8e8e8' }}>
              <Row gutter={16} style={{ marginBottom: 8 }}>
                <Col span={10}>
                  <Select 
                    placeholder="Select account"
                    style={{ width: '100%' }}
                    showSearch
                    optionFilterProp="children"
                    value={line.account || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'account', value)}
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {accounts.map(acc => (
                      <Select.Option key={acc.id || acc.account_id} value={acc.id || acc.account_id}>
                        {acc.account_number || acc.account_code} - {acc.name || acc.account_name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="R"
                    placeholder="Debit"
                    min={0}
                    precision={2}
                    value={line.debit || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'debit', value || 0)}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    style={{ width: '100%' }}
                    prefix="R"
                    placeholder="Credit"
                    min={0}
                    precision={2}
                    value={line.credit || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'credit', value || 0)}
                  />
                </Col>
                <Col span={2}>
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    disabled={journalLines.length <= 2}
                    onClick={() => removeJournalLine(line.key)}
                  />
                </Col>
              </Row>
              {/* Dimensions Row */}
              <Row gutter={8} style={{ marginTop: 8 }}>
                <Col span={4}>
                  <Select
                    placeholder="Cost Center"
                    style={{ width: '100%' }}
                    allowClear
                    size="small"
                    value={line.costCenterId || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'costCenterId', value || '')}
                  >
                    {costCenters.map(cc => (
                      <Select.Option key={cc.id} value={cc.id}>
                        {cc.code} - {cc.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="Department"
                    style={{ width: '100%' }}
                    allowClear
                    size="small"
                    value={line.departmentId || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'departmentId', value || '')}
                  >
                    {departments.map(d => (
                      <Select.Option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="Project"
                    style={{ width: '100%' }}
                    allowClear
                    size="small"
                    value={line.projectId || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'projectId', value || '')}
                  >
                    {projects.map(p => (
                      <Select.Option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="Product"
                    style={{ width: '100%' }}
                    allowClear
                    size="small"
                    value={line.productId || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'productId', value || '')}
                  >
                    {products.map(pr => (
                      <Select.Option key={pr.id} value={pr.id}>
                        {pr.code} - {pr.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="Location"
                    style={{ width: '100%' }}
                    allowClear
                    size="small"
                    value={line.locationId || undefined}
                    onChange={(value) => updateJournalLine(line.key, 'locationId', value || '')}
                  >
                    {locations.map(loc => (
                      <Select.Option key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Input
                    placeholder="Line description"
                    size="small"
                    value={line.description || ''}
                    onChange={(e) => updateJournalLine(line.key, 'description', e.target.value)}
                  />
                </Col>
              </Row>
            </div>
          ))}
          
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            style={{ width: '100%', marginTop: 8 }}
            onClick={addJournalLine}
          >
            Add Line
          </Button>
        </Form>
      </Modal>
    </HubLayout>
  );
};

export default FinancialHub;
