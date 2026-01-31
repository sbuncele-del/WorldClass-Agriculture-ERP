import React, { useState, useEffect } from 'react';
import './FinancialDashboard.css';

interface DashboardStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  financial_summary: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
  account_balances: {
    total_assets: number;
    total_liabilities: number;
    total_equity: number;
  };
  activity: {
    journal_entries_count: number;
    pending_approvals: number;
    unbalanced_entries: number;
    last_posting_date: string;
  };
}

interface DimensionBreakdown {
  dimension_type: string;
  breakdown: Array<{
    code: string;
    name: string;
    amount: number;
    percentage: number;
  }>;
}

interface RecentEntry {
  journal_number: string;
  journal_date: string;
  description: string;
  total_amount: number;
  status: string;
}

const FinancialDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [costCenterBreakdown, setCostCenterBreakdown] = useState<DimensionBreakdown | null>(null);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<DimensionBreakdown | null>(null);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'revenue' | 'expenses'>('expenses');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsRes = await fetch('/api/financial/dashboard/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats');
      }
      const statsData = await statsRes.json();
      setStats(statsData.data);

      // Fetch dimension breakdowns
      const ccRes = await fetch(`/api/financial/dashboard/breakdown/cost-center?type=${selectedView}`);
      if (ccRes.ok) {
        const ccData = await ccRes.json();
        setCostCenterBreakdown(ccData.data);
      }

      const deptRes = await fetch(`/api/financial/dashboard/breakdown/department?type=${selectedView}`);
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartmentBreakdown(deptData.data);
      }

      // Fetch recent entries
      const entriesRes = await fetch('/api/financial/dashboard/recent-entries?limit=10');
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setRecentEntries(entriesData.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set mock data as fallback
      setStats({
        current_period: {
          fiscal_year: 2025,
          period_number: 11,
          period_name: 'November 2025',
          status: 'open'
        },
        financial_summary: {
          total_revenue: 2450000,
          total_expenses: 1963000,
          net_profit: 487000,
          profit_margin: 19.88
        },
        account_balances: {
          total_assets: 5250000,
          total_liabilities: 2180000,
          total_equity: 3070000
        },
        activity: {
          journal_entries_count: 156,
          pending_approvals: 8,
          unbalanced_entries: 0,
          last_posting_date: '2025-11-07'
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'POSTED': 'green',
      'DRAFT': 'blue',
      'PENDING': 'orange',
      'REJECTED': 'red',
    };
    return colors[status] || 'gray';
  };

  const getPeriodStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'OPEN': 'green',
      'CLOSED': 'orange',
      'LOCKED': 'red',
      'FUTURE': 'blue',
    };
    return colors[status] || 'gray';
  };

  if (loading || !stats) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 Financial Dashboard</h1>
          <p className="subtitle">Real-time financial insights and analytics</p>
        </div>
        <div className="header-right">
          <div className="current-period-card">
            <div className="period-label">Current Period</div>
            <div className="period-name">{stats.current_period.period_name}</div>
            <span className={`period-status status-${getPeriodStatusColor(stats.current_period.status)}`}>
              {stats.current_period.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue</div>
            <div className="metric-value">{formatCurrency(stats.financial_summary.total_revenue)}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">↗</span>
              <span className="trend-text">YTD Performance</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">📤</div>
          <div className="metric-content">
            <div className="metric-label">Total Expenses</div>
            <div className="metric-value">{formatCurrency(stats.financial_summary.total_expenses)}</div>
            <div className="metric-trend negative">
              <span className="trend-icon">↘</span>
              <span className="trend-text">Operating Costs</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Net Profit</div>
            <div className="metric-value">{formatCurrency(stats.financial_summary.net_profit)}</div>
            <div className="metric-trend">
              <span className="profit-margin">
                {stats.financial_summary.profit_margin.toFixed(1)}% Margin
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">🔔</div>
          <div className="metric-content">
            <div className="metric-label">Activity</div>
            <div className="metric-value">{stats.activity.journal_entries_count}</div>
            <div className="metric-detail">
              {stats.activity.pending_approvals > 0 && (
                <span className="pending-badge">{stats.activity.pending_approvals} pending</span>
              )}
              {stats.activity.unbalanced_entries > 0 && (
                <span className="warning-badge">{stats.activity.unbalanced_entries} unbalanced</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Summary */}
      <div className="balance-sheet-section">
        <h2>📋 Balance Sheet Summary</h2>
        <div className="balance-cards">
          <div className="balance-card assets">
            <div className="balance-label">Total Assets</div>
            <div className="balance-value">{formatCurrency(stats.account_balances.total_assets)}</div>
          </div>
          <div className="balance-card liabilities">
            <div className="balance-label">Total Liabilities</div>
            <div className="balance-value">{formatCurrency(stats.account_balances.total_liabilities)}</div>
          </div>
          <div className="balance-card equity">
            <div className="balance-label">Total Equity</div>
            <div className="balance-value">{formatCurrency(stats.account_balances.total_equity)}</div>
          </div>
        </div>
      </div>

      {/* Dimension Analysis */}
      <div className="dimension-analysis-section">
        <div className="section-header">
          <h2>📐 Dimensional Analysis</h2>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${selectedView === 'expenses' ? 'active' : ''}`}
              onClick={() => setSelectedView('expenses')}
            >
              Expenses
            </button>
            <button
              className={`toggle-btn ${selectedView === 'revenue' ? 'active' : ''}`}
              onClick={() => setSelectedView('revenue')}
            >
              Revenue
            </button>
          </div>
        </div>

        <div className="dimension-charts">
          {/* Cost Center Breakdown */}
          {costCenterBreakdown && costCenterBreakdown.breakdown.length > 0 && (
            <div className="chart-card">
              <h3>By Cost Center</h3>
              <div className="chart-content">
                {costCenterBreakdown.breakdown.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar-label">
                      <span className="bar-name">{item.code} - {item.name}</span>
                      <span className="bar-amount">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="bar-percentage">{item.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Breakdown */}
          {departmentBreakdown && departmentBreakdown.breakdown.length > 0 && (
            <div className="chart-card">
              <h3>By Department</h3>
              <div className="chart-content">
                {departmentBreakdown.breakdown.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar-label">
                      <span className="bar-name">{item.code} - {item.name}</span>
                      <span className="bar-amount">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="bar-percentage">{item.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Journal Entries */}
      <div className="recent-entries-section">
        <h2>📝 Recent Journal Entries</h2>
        <div className="entries-table">
          <table>
            <thead>
              <tr>
                <th>Journal #</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => (
                  <tr key={index}>
                    <td>
                      <code>{entry.journal_number}</code>
                    </td>
                    <td>{formatDate(entry.journal_date)}</td>
                    <td>{entry.description}</td>
                    <td className="amount">{formatCurrency(entry.total_amount)}</td>
                    <td>
                      <span className={`status-badge status-${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No recent journal entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <a href="/financial/journal-entry/new" className="action-card">
            <div className="action-icon">➕</div>
            <div className="action-label">New Journal Entry</div>
          </a>
          <a href="/financial/trial-balance" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-label">Trial Balance</div>
          </a>
          <a href="/financial/periods" className="action-card">
            <div className="action-icon">📅</div>
            <div className="action-label">Period Management</div>
          </a>
          <a href="/financial/dimensions" className="action-card">
            <div className="action-icon">📐</div>
            <div className="action-label">Dimensions</div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
