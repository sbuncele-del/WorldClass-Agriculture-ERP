import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { workspaceApi } from '../../services/api.service';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  FileText, 
  Plus,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import '../../styles/erp-ui.css';

interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  currency: string;
  current_balance: number;
  last_reconciled_date: string | null;
  is_active: boolean;
}

interface CashPosition {
  total_accounts: number;
  total_balance: number;
  active_balance: number;
  active_accounts: number;
}

interface PendingPayments {
  pending_count: number;
  total_amount: number;
}

interface ReconciliationStatus {
  account_id: string;
  account_name: string;
  last_reconciled_date: string | null;
  unreconciled_count: number;
  unreconciled_amount: number;
}

interface RecentTransaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  reconciled: boolean;
  account_name: string;
  bank_name: string;
}

interface CashFlowTrend {
  month: string;
  inflow: number;
  outflow: number;
}

interface WorkspaceData {
  bank_accounts: BankAccount[];
  cash_position: CashPosition;
  pending_payments: PendingPayments;
  reconciliation_status: ReconciliationStatus[];
  recent_transactions: RecentTransaction[];
  cash_flow_trend: CashFlowTrend[];
}

const CashManagementDashboard: React.FC = () => {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await workspaceApi.cashManagement.getWorkspace();
      
      if (response && response.data) {
        setData(response.data);
      } else {
        // Show empty state if no data
        setData({
          bank_accounts: [],
          cash_position: {
            total_accounts: 0,
            total_balance: 0,
            active_balance: 0,
            active_accounts: 0
          },
          pending_payments: {
            pending_count: 0,
            total_amount: 0
          },
          reconciliation_status: [],
          recent_transactions: [],
          cash_flow_trend: []
        });
      }
    } catch (err: any) {
      console.error('Error fetching cash management data:', err);
      setError(err.message || 'Failed to load cash management data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cashManagementTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/cash/dashboard' },
    { id: 'accounts', label: 'Bank Accounts', path: '/cash/accounts' },
    { id: 'statements', label: 'Statements', path: '/cash/statements' },
    { id: 'reconciliation', label: 'Reconciliation', path: '/cash/reconciliation' },
    { id: 'rules', label: 'Matching Rules', path: '/cash/rules' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-account', label: 'New Bank Account', path: '/cash/accounts/new', icon: <Plus size={16} /> },
        { id: 'import-statement', label: 'Import Statement', path: '/cash/statements/import', icon: <Upload size={16} /> },
        { id: 'reconcile', label: 'Reconcile', path: '/cash/reconciliation', icon: <CheckCircle size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'cash-flow', label: 'Cash Flow Report', path: '/cash/reports/cash-flow', icon: <FileText size={16} /> },
        { id: 'bank-summary', label: 'Bank Summary', path: '/cash/reports/summary', icon: <TrendingUp size={16} /> },
      ],
    },
  ];

  if (loading) {
    return (
      <EnterpriseLayout
        moduleTitle="Cash Management"
        moduleSubtitle="Bank reconciliation, cash position, and statement processing"
        tabs={cashManagementTabs}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Cash Management', path: '/cash/dashboard' },
        ]}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading cash management data...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  if (error) {
    return (
      <EnterpriseLayout
        moduleTitle="Cash Management"
        moduleSubtitle="Bank reconciliation, cash position, and statement processing"
        tabs={cashManagementTabs}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Cash Management', path: '/cash/dashboard' },
        ]}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="btn-primary">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  if (!data) return null;

  return (
    <EnterpriseLayout
      moduleTitle="Cash Management"
      moduleSubtitle="Bank reconciliation, cash position, and statement processing"
      tabs={cashManagementTabs}
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Cash Management', path: '/cash/dashboard' },
      ]}
      secondaryNav={secondaryNav}
    >
      <div className="dashboard-container" style={{ padding: '1.5rem' }}>
        {/* Cash Position Summary */}
        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-label">Total Cash Position</div>
              <div className="metric-value">{formatCurrency(data.cash_position.total_balance)}</div>
              <div className="metric-trend">
                <span className="trend-text">{data.cash_position.total_accounts} total accounts</span>
              </div>
            </div>
          </div>

          <div className="metric-card profit">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-label">Active Accounts</div>
              <div className="metric-value">{data.cash_position.active_accounts}</div>
              <div className="metric-trend">
                <span className="trend-text">{formatCurrency(data.cash_position.active_balance)} available</span>
              </div>
            </div>
          </div>

          <div className="metric-card expenses">
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <div className="metric-label">Pending Transactions</div>
              <div className="metric-value">{data.pending_payments.pending_count}</div>
              <div className="metric-trend">
                <span className="trend-text">{formatCurrency(data.pending_payments.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="metric-card activity">
            <div className="metric-icon">🔄</div>
            <div className="metric-content">
              <div className="metric-label">Needs Reconciliation</div>
              <div className="metric-value">
                {data.reconciliation_status.reduce((sum, acc) => sum + acc.unreconciled_count, 0)}
              </div>
              <div className="metric-detail">
                <span className="pending-badge">Across {data.reconciliation_status.length} accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="balance-sheet-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>🏦 Bank Accounts</h2>
            <Link to="/cash/accounts/new" className="btn-primary">
              <Plus size={16} /> Add Account
            </Link>
          </div>
          {data.bank_accounts.length === 0 ? (
            <div className="empty-state">
              <p>No bank accounts configured yet</p>
              <Link to="/cash/accounts/new" className="btn-primary">
                <Plus size={16} /> Add Your First Account
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Name</th>
                    <th>Bank</th>
                    <th>Account Number</th>
                    <th>Currency</th>
                    <th>Current Balance</th>
                    <th>Last Reconciled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bank_accounts.map((account) => (
                    <tr key={account.id}>
                      <td>
                        <Link to={`/cash/accounts/${account.id}`}>
                          {account.account_name}
                        </Link>
                      </td>
                      <td>{account.bank_name}</td>
                      <td><code>{account.account_number}</code></td>
                      <td>{account.currency}</td>
                      <td>
                        <strong>{formatCurrency(account.current_balance)}</strong>
                      </td>
                      <td>{formatDate(account.last_reconciled_date)}</td>
                      <td>
                        {account.is_active ? (
                          <span className="status-badge active">Active</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reconciliation Status */}
        {data.reconciliation_status.length > 0 && (
          <div className="balance-sheet-section">
            <h2>🔍 Reconciliation Status</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Last Reconciled</th>
                    <th>Unreconciled Count</th>
                    <th>Unreconciled Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reconciliation_status.map((status) => (
                    <tr key={status.account_id}>
                      <td>{status.account_name}</td>
                      <td>{formatDate(status.last_reconciled_date)}</td>
                      <td>
                        {status.unreconciled_count > 0 ? (
                          <span className="warning-badge">{status.unreconciled_count} items</span>
                        ) : (
                          <span className="success-badge">✓ All reconciled</span>
                        )}
                      </td>
                      <td>{formatCurrency(status.unreconciled_amount || 0)}</td>
                      <td>
                        <Link 
                          to={`/cash/reconciliation?account=${status.account_id}`}
                          className="btn-secondary btn-sm"
                        >
                          Reconcile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {data.recent_transactions.length > 0 && (
          <div className="balance-sheet-section">
            <h2>📋 Recent Transactions</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Bank</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>{formatDate(txn.transaction_date)}</td>
                      <td>{txn.description}</td>
                      <td>{txn.bank_name}</td>
                      <td>{txn.account_name}</td>
                      <td>
                        <span className={txn.amount >= 0 ? 'positive' : 'negative'}>
                          {txn.amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          {formatCurrency(Math.abs(txn.amount))}
                        </span>
                      </td>
                      <td>
                        {txn.reconciled ? (
                          <span className="success-badge">
                            <CheckCircle size={14} /> Reconciled
                          </span>
                        ) : (
                          <span className="warning-badge">
                            <AlertCircle size={14} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cash Flow Trend */}
        {data.cash_flow_trend.length > 0 && (
          <div className="balance-sheet-section">
            <h2>📊 Cash Flow Trend (Last 6 Months)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Inflows</th>
                    <th>Outflows</th>
                    <th>Net Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cash_flow_trend.map((trend, index) => {
                    const netFlow = trend.inflow - trend.outflow;
                    return (
                      <tr key={index}>
                        <td>{formatDate(trend.month)}</td>
                        <td className="positive">
                          <TrendingUp size={16} /> {formatCurrency(trend.inflow)}
                        </td>
                        <td className="negative">
                          <TrendingDown size={16} /> {formatCurrency(trend.outflow)}
                        </td>
                        <td className={netFlow >= 0 ? 'positive' : 'negative'}>
                          <strong>{formatCurrency(netFlow)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/cash/accounts" className="action-card">
              <div className="action-icon">🏦</div>
              <div className="action-label">Manage Bank Accounts</div>
            </Link>
            <Link to="/cash/statements/import" className="action-card">
              <div className="action-icon">📥</div>
              <div className="action-label">Import Statements</div>
            </Link>
            <Link to="/cash/reconciliation" className="action-card">
              <div className="action-icon">🔄</div>
              <div className="action-label">Start Reconciliation</div>
            </Link>
            <Link to="/cash/rules" className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-label">Matching Rules</div>
            </Link>
            <Link to="/cash/reports/cash-flow" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-label">Cash Flow Reports</div>
            </Link>
            <Link to="/cash/reports/summary" className="action-card">
              <div className="action-icon">📈</div>
              <div className="action-label">Bank Summary</div>
            </Link>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default CashManagementDashboard;
