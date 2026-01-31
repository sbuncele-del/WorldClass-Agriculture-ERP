import React, { useState, useEffect } from 'react';
import EnterpriseLayout from '../../../components/layout/EnterpriseLayout';
import GlassCard from '../../../components/ui/GlassCard';
import DataTable from '../../../components/ui/DataTable';
import { Download, Calendar, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import './TrialBalanceEnhanced.css';

interface TrialBalanceAccount {
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  total_debits: number;
  total_credits: number;
  balance: number;
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[];
  summary: {
    total_debits: number;
    total_credits: number;
    is_balanced: boolean;
  };
  period: {
    fiscal_year: number;
    fiscal_period: number;
  };
}

const TrialBalanceEnhanced: React.FC = () => {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Period selection
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState(currentDate.getMonth() + 1);
  
  // Filters
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchTrialBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/financial/trial-balance?fiscal_year=${selectedYear}&fiscal_period=${selectedPeriod}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch trial balance');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching trial balance:', err);
      setError('Failed to load trial balance data');
      // Fallback mock data
      setData({
        accounts: [],
        summary: {
          total_debits: 0,
          total_credits: 0,
          is_balanced: true
        },
        period: {
          fiscal_year: selectedYear,
          fiscal_period: selectedPeriod
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    console.log(`Exporting trial balance as ${format}`);
    // Implement export logic
  };

  // Filter accounts
  const filteredAccounts = data?.accounts.filter(account => {
    const matchesType = accountTypeFilter === 'ALL' || account.account_type === accountTypeFilter;
    const matchesSearch = 
      account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  }) || [];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/financial/dashboard' },
    { id: 'journal', label: 'Journal Entries', path: '/financial/journal-entries' },
    { id: 'trial-balance', label: 'Trial Balance', path: '/financial/trial-balance' },
    { id: 'chart', label: 'Chart of Accounts', path: '/financial/chart-of-accounts' },
    { id: 'statements', label: 'Financial Statements', path: '/financial/statements' },
    { id: 'periods', label: 'Periods & Closing', path: '/financial/periods' },
    { id: 'dimensions', label: 'Dimensions', path: '/financial/dimensions' },
    { id: 'approvals', label: 'Approvals', path: '/financial/approvals' }
  ];

  const columns = [
    {
      key: 'code',
      label: 'Account Code',
      render: (value: string) => (
        <span className="tbe-account-code">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Account Name',
      render: (value: string, row: TrialBalanceAccount) => (
        <div>
          <div className="tbe-account-name">{value}</div>
          <div className="tbe-account-type">{row.account_type}</div>
        </div>
      )
    },
    {
      key: 'total_debits',
      label: 'Debits',
      align: 'right' as const,
      render: (value: number) => (
        <span className="tbe-amount">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'total_credits',
      label: 'Credits',
      align: 'right' as const,
      render: (value: number) => (
        <span className="tbe-amount">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'balance',
      label: 'Balance',
      align: 'right' as const,
      render: (value: number, row: TrialBalanceAccount) => (
        <span className={`tbe-balance tbe-balance-${value >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(Math.abs(value))} {row.normal_balance === 'DEBIT' ? 'Dr' : 'Cr'}
        </span>
      )
    }
  ];

  const FilterComponent = (
    <div className="tbe-filters">
      <div className="tbe-filter-row">
        <div className="tbe-filter-group">
          <label>Fiscal Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="tbe-select"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="tbe-filter-group">
          <label>Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="tbe-select"
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>

        <div className="tbe-filter-group">
          <label>Account Type</label>
          <select
            value={accountTypeFilter}
            onChange={(e) => setAccountTypeFilter(e.target.value)}
            className="tbe-select"
          >
            <option value="ALL">All Accounts</option>
            <option value="ASSET">Assets</option>
            <option value="LIABILITY">Liabilities</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expenses</option>
          </select>
        </div>

        <div className="tbe-filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tbe-input"
          />
        </div>
      </div>
    </div>
  );

  return (
    <EnterpriseLayout
      moduleTitle="Trial Balance"
      moduleSubtitle={`Period: ${monthNames[selectedPeriod - 1]} ${selectedYear}`}
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Financial', path: '/financial/dashboard' },
        { label: 'Trial Balance' }
      ]}
      tabs={tabs}
      actionButtons={[
        {
          label: 'Excel',
          icon: <Download size={18} />,
          variant: 'secondary',
          onClick: () => handleExport('excel')
        },
        {
          label: 'PDF',
          icon: <Download size={18} />,
          variant: 'secondary',
          onClick: () => handleExport('pdf')
        },
        {
          label: 'Schedule',
          icon: <Calendar size={18} />,
          variant: 'secondary'
        }
      ]}
      showFilters={true}
      filterComponent={FilterComponent}
    >
      {loading ? (
        <GlassCard padding="lg">
          <div className="tbe-loading">Loading trial balance...</div>
        </GlassCard>
      ) : error ? (
        <GlassCard padding="lg">
          <div className="tbe-error">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        </GlassCard>
      ) : (
        <div className="tbe-content">
          {/* Balance Status Card */}
          <GlassCard padding="lg" className="tbe-status-card">
            <div className="tbe-status">
              {data?.summary.is_balanced ? (
                <>
                  <CheckCircle size={48} className="tbe-status-icon-success" />
                  <div className="tbe-status-text">
                    <h2>Trial Balance is Balanced</h2>
                    <p>All debits and credits are equal. Books are in order.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={48} className="tbe-status-icon-error" />
                  <div className="tbe-status-text">
                    <h2>Trial Balance Out of Balance</h2>
                    <p>Debits and credits do not match. Review entries.</p>
                  </div>
                </>
              )}
              <div className="tbe-status-summary">
                <div className="tbe-summary-item">
                  <label>Total Debits:</label>
                  <span className="tbe-summary-value">
                    {formatCurrency(data?.summary.total_debits || 0)}
                  </span>
                </div>
                <div className="tbe-summary-item">
                  <label>Total Credits:</label>
                  <span className="tbe-summary-value">
                    {formatCurrency(data?.summary.total_credits || 0)}
                  </span>
                </div>
                <div className="tbe-summary-item">
                  <label>Difference:</label>
                  <span className={`tbe-summary-value ${
                    data?.summary.is_balanced ? 'tbe-balanced' : 'tbe-unbalanced'
                  }`}>
                    {formatCurrency(Math.abs(
                      (data?.summary.total_debits || 0) - (data?.summary.total_credits || 0)
                    ))}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Accounts Table */}
          <DataTable
            title="Account Balances"
            subtitle={`${filteredAccounts.length} accounts`}
            columns={columns}
            data={filteredAccounts}
            emptyMessage="No accounts found matching your filters."
            maxHeight="600px"
          />
        </div>
      )}
    </EnterpriseLayout>
  );
};

export default TrialBalanceEnhanced;
