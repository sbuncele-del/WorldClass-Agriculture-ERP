import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../../components/layout/EnterpriseLayout';
import DataTable from '../../../components/ui/DataTable';
import GlassCard from '../../../components/ui/GlassCard';
import { Plus, Download, Upload, FolderTree, Tag, FileSpreadsheet, Settings } from 'lucide-react';
import type { SecondaryNavSection } from '../../../components/layout/SecondaryNav';
import './ChartOfAccountsEnhanced.css';

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  category: string;
  normal_balance: string;
  is_active: boolean;
}

const ChartOfAccountsEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const financialTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/financial/dashboard' },
    { id: 'journal', label: 'Journal Entries', path: '/financial/journal-entries' },
    { id: 'trial-balance', label: 'Trial Balance', path: '/financial/trial-balance' },
    { id: 'chart', label: 'Chart of Accounts', path: '/financial/chart-of-accounts' },
    { id: 'statements', label: 'Financial Statements', path: '/financial/statements' },
    { id: 'periods', label: 'Periods & Closing', path: '/financial/periods' },
    { id: 'dimensions', label: 'Dimensions', path: '/financial/dimensions' },
    { id: 'approvals', label: 'Approval Workflows', path: '/financial/approvals' }
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Account Types',
      items: [
        { id: 'all', label: 'All Accounts', path: '/financial/chart-of-accounts', icon: <FolderTree size={16} />, badge: 156 },
        { id: 'assets', label: 'Assets', path: '/financial/chart-of-accounts?type=ASSET', icon: <Tag size={16} />, badge: 45 },
        { id: 'liabilities', label: 'Liabilities', path: '/financial/chart-of-accounts?type=LIABILITY', icon: <Tag size={16} />, badge: 28 },
        { id: 'equity', label: 'Equity', path: '/financial/chart-of-accounts?type=EQUITY', icon: <Tag size={16} />, badge: 12 },
        { id: 'revenue', label: 'Revenue', path: '/financial/chart-of-accounts?type=REVENUE', icon: <Tag size={16} />, badge: 35 },
        { id: 'expenses', label: 'Expenses', path: '/financial/chart-of-accounts?type=EXPENSE', icon: <Tag size={16} />, badge: 36 }
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'new', label: 'New Account', path: '/financial/account/new', icon: <Plus size={16} /> },
        { id: 'templates', label: 'Account Templates', path: '/financial/account-templates', icon: <FileSpreadsheet size={16} /> },
        { id: 'import', label: 'Import Accounts', path: '/financial/import-accounts', icon: <Upload size={16} /> },
        { id: 'settings', label: 'Settings', path: '/financial/chart-settings', icon: <Settings size={16} /> }
      ]
    }
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financial/chart-of-accounts');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setAccounts(result.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (value: string) => <span className="coa-code">{value}</span> },
    { key: 'name', label: 'Account Name' },
    { key: 'account_type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'normal_balance', label: 'Normal Balance' },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <span className={value ? 'dt-badge dt-badge-success' : 'dt-badge dt-badge-error'}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <EnterpriseLayout
      moduleTitle="Chart of Accounts"
      moduleSubtitle="Manage your account structure and categories"
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Financial', path: '/financial/dashboard' },
        { label: 'Chart of Accounts' }
      ]}
      tabs={financialTabs}
      actionButtons={[
        { label: 'Import', icon: <Upload size={18} />, variant: 'secondary' },
        { label: 'Export', icon: <Download size={18} />, variant: 'secondary' },
        { label: 'New Account', icon: <Plus size={18} />, variant: 'primary' }
      ]}
      secondaryNav={secondaryNav}
    >
      {loading ? (
        <div className="coa-loading">Loading accounts...</div>
      ) : (
        <DataTable
          title="All Accounts"
          subtitle={`${accounts.length} accounts`}
          columns={columns}
          data={accounts}
          maxHeight="calc(100vh - 400px)"
        />
      )}
    </EnterpriseLayout>
  );
};

export default ChartOfAccountsEnhanced;
