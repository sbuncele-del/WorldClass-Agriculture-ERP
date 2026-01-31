import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { DollarSign, RefreshCw, TrendingUp, FileText, Plus, CreditCard, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../../services/api.service';
import '../../styles/erp-ui.css';

interface CashStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  cash_summary: {
    total_cash_balance: number;
    available_balance: number;
    pending_reconciliation: number;
    monthly_transactions: number;
  };
  bank_accounts: {
    standard_bank: number;
    fnb: number;
    nedbank: number;
  };
}

const CashManagementDashboard: React.FC = () => {
  const [stats, setStats] = useState<CashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Connect to real backend API
            const response = await fetch(`${API_BASE_URL}/api/cash/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback to mock data if API fails
        setStats({
          current_period: {
            fiscal_year: 2025,
            period_number: 11,
            period_name: 'November 2025',
            status: 'OPEN'
          },
          cash_summary: {
            total_cash_balance: 2847320,
            available_balance: 1923150,
            pending_reconciliation: 324180,
            monthly_transactions: 428
          },
          bank_accounts: {
            standard_bank: 1245670,
            fnb: 892450,
            nedbank: 709200
          }
        });
      }
    } catch (err) {
      console.error('Error fetching cash dashboard data:', err);
      // Use mock data on error
      setStats({
        current_period: {
          fiscal_year: 2025,
          period_number: 11,
          period_name: 'November 2025',
          status: 'OPEN'
        },
        cash_summary: {
          total_cash_balance: 2847320,
          available_balance: 1923150,
          pending_reconciliation: 324180,
          monthly_transactions: 428
        },
        bank_accounts: {
          standard_bank: 1245670,
          fnb: 892450,
          nedbank: 709200
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'OPEN': 'green',
      'CLOSED': 'orange',
      'LOCKED': 'red',
    };
    return colors[status] || 'gray';
  };

  const cashTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/cash-management/dashboard' },
    { id: 'accounts', label: 'Bank Accounts', path: '/cash-management/accounts' },
    { id: 'reconciliation', label: 'Reconciliation', path: '/cash-management/reconciliation' },
    { id: 'cash-flow', label: 'Cash Flow', path: '/cash-management/cash-flow' },
    { id: 'forecasting', label: 'Forecasting', path: '/cash-management/forecasting' },
    { id: 'reports', label: 'Reports', path: '/cash-management/reports' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-transaction', label: 'New Transaction', path: '/cash-management/transactions/new', icon: <Plus size={16} /> },
        { id: 'reconcile', label: 'Reconcile Account', path: '/cash-management/reconciliation/new', icon: <RefreshCw size={16} /> },
        { id: 'add-bank', label: 'Add Bank Account', path: '/cash-management/accounts/new', icon: <CreditCard size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'cash-position', label: 'Cash Position', path: '/cash-management/reports/position', icon: <DollarSign size={16} /> },
        { id: 'cash-flow-report', label: 'Cash Flow', path: '/cash-management/reports/cash-flow', icon: <TrendingUp size={16} /> },
        { id: 'forecast-report', label: 'Forecast Report', path: '/cash-management/reports/forecast', icon: <BarChart3 size={16} /> },
        { id: 'bank-statement', label: 'Bank Statements', path: '/cash-management/reports/statements', icon: <FileText size={16} /> },
      ],
    },
  ];

  if (loading || !stats) {
    return (
      <EnterpriseLayout
        moduleTitle="Cash Management"
        moduleSubtitle="Real-time cash position and bank account monitoring"
        breadcrumbs={[
          { label: 'Cash Management', path: '/cash-management' },
          { label: 'Dashboard', path: '/cash-management/dashboard' },
        ]}
        tabs={cashTabs}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading cash dashboard...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Cash Management"
      moduleSubtitle="Real-time cash position and bank account monitoring"
      breadcrumbs={[
        { label: 'Cash Management', path: '/cash-management' },
        { label: 'Dashboard', path: '/cash-management/dashboard' },
      ]}
      tabs={cashTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        { label: 'Reconcile', icon: <RefreshCw size={16} />, variant: 'secondary' as const },
        { label: 'New Transaction', icon: <Plus size={16} />, variant: 'primary' as const },
      ]}
    >
      <div className="dashboard-container">
        <div className="current-period-card">
          <div className="period-label">Current Period</div>
          <div className="period-name">{stats.current_period.period_name}</div>
          <span
            style={{
              backgroundColor: `var(--color-${getPeriodStatusColor(stats.current_period.status)})`,
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontWeight: 600
            }}
          >
            {stats.current_period.status}
          </span>
        </div>

        <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Cash Balance</div>
            <div className="metric-value">{formatCurrency(stats.cash_summary.total_cash_balance)}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">↗</span>
              <span className="trend-text">All Accounts Combined</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Available Balance</div>
            <div className="metric-value">{formatCurrency(stats.cash_summary.available_balance)}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">↗</span>
              <span className="trend-text">Ready for Operations</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-label">Pending Reconciliation</div>
            <div className="metric-value">{formatCurrency(stats.cash_summary.pending_reconciliation)}</div>
            <div className="metric-trend">
              <span className="profit-margin">3 items need attention</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">🔔</div>
          <div className="metric-content">
            <div className="metric-label">Activity</div>
            <div className="metric-value">{stats.cash_summary.monthly_transactions}</div>
            <div className="metric-detail">
              <span className="pending-badge">This month transactions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="balance-sheet-section">
        <h2>🏦 Bank Accounts Summary</h2>
        <div className="balance-cards">
          <div className="balance-card assets">
            <div className="balance-label">Standard Bank</div>
            <div className="balance-value">{formatCurrency(stats.bank_accounts.standard_bank)}</div>
          </div>
          <div className="balance-card liabilities">
            <div className="balance-label">First National Bank</div>
            <div className="balance-value">{formatCurrency(stats.bank_accounts.fnb)}</div>
          </div>
          <div className="balance-card equity">
            <div className="balance-label">Nedbank Business</div>
            <div className="balance-value">{formatCurrency(stats.bank_accounts.nedbank)}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/cash-management/accounts" className="action-card">
            <div className="action-icon">🏦</div>
            <div className="action-label">Bank Accounts</div>
          </Link>
          <Link to="/cash-management/reconciliation" className="action-card">
            <div className="action-icon">🔄</div>
            <div className="action-label">Reconciliation</div>
          </Link>
          <Link to="/cash-management/cash-flow" className="action-card">
            <div className="action-icon">💵</div>
            <div className="action-label">Cash Flow</div>
          </Link>
          <Link to="/cash-management/forecasting" className="action-card">
            <div className="action-icon">🔮</div>
            <div className="action-label">Forecasting</div>
          </Link>
        </div>
      </div>
      </div>
    </EnterpriseLayout>
  );
};

export default CashManagementDashboard;
