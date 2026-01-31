import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './BudgetVsActual.css';

interface VarianceLine {
  account_code: string;
  account_name: string;
  annual_total: number;
  actual_ytd: number;
  variance_ytd: number;
  variance_percentage: number;
  variance_status: 'OVER_BUDGET' | 'UNDER_BUDGET' | 'ON_BUDGET';
  variance_severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

interface BudgetVsActualData {
  budget: {
    id: number;
    budget_code: string;
    budget_name: string;
    fiscal_year: number;
    total_budgeted: number;
    total_actual: number;
    total_variance: number;
    total_variance_percentage: number;
  };
  lines: VarianceLine[];
  summary: {
    total_lines: number;
    over_budget_count: number;
    under_budget_count: number;
    on_budget_count: number;
    critical_count: number;
    warning_count: number;
  };
}

const BudgetVsActual: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<BudgetVsActualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    fetchBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      fetchBudgetVsActual();
    }
  }, [selectedBudgetId]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/forecasting/budgets?status=ACTIVE`);
      const data = await response.json();
      
      if (data.success && data.budgets.length > 0) {
        setBudgets(data.budgets);
        setSelectedBudgetId(data.budgets[0].id);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchBudgetVsActual = async () => {
    if (!selectedBudgetId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/financial/forecasting/budgets/${selectedBudgetId}/vs-actual`
      );
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data);
      }
    } catch (error) {
      console.error('Error fetching budget vs actual:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLines = (): VarianceLine[] => {
    if (!analysisData) return [];

    let lines = [...analysisData.lines];

    if (filterSeverity) {
      lines = lines.filter(line => line.variance_severity === filterSeverity);
    }

    if (filterStatus) {
      lines = lines.filter(line => line.variance_status === filterStatus);
    }

    return lines;
  };

  const getSeverityClass = (severity: string) => {
    return severity.toLowerCase();
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      'OVER_BUDGET': 'over-budget',
      'UNDER_BUDGET': 'under-budget',
      'ON_BUDGET': 'on-budget'
    };
    return classes[status] || '';
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const renderProgressBar = (actual: number, budget: number) => {
    const percentage = budget > 0 ? (actual / budget) * 100 : 0;
    const capped = Math.min(percentage, 150); // Cap visual at 150%

    let barClass = 'normal';
    if (percentage > 100) barClass = 'over';
    if (percentage < 80) barClass = 'under';

    return (
      <div className="progress-bar-container">
        <div
          className={`progress-bar ${barClass}`}
          style={{ width: `${capped}%` }}
        >
          <span className="progress-label">{percentage.toFixed(0)}%</span>
        </div>
      </div>
    );
  };

  if (!analysisData) {
    return (
      <div className="budget-vs-actual">
        <div className="header">
          <h2>Budget vs Actual Analysis</h2>
        </div>
        
        {budgets.length === 0 ? (
          <div className="empty-state">
            <p>No active budgets found. Please create and activate a budget first.</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading budget analysis...</p>
          </div>
        ) : null}
      </div>
    );
  }

  const filteredLines = getFilteredLines();

  return (
    <div className="budget-vs-actual">
      {/* Header */}
      <div className="header">
        <div>
          <h2>Budget vs Actual Analysis</h2>
          <p className="subtitle">Monitor budget performance and identify variances</p>
        </div>

        <div className="budget-selector">
          <label>Select Budget:</label>
          <select
            value={selectedBudgetId || ''}
            onChange={(e) => setSelectedBudgetId(parseInt(e.target.value))}
          >
            {budgets.map(budget => (
              <option key={budget.id} value={budget.id}>
                {budget.budget_code} - {budget.budget_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon budget-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Total Budgeted</div>
            <div className="card-value">{formatCurrency(analysisData.budget.total_budgeted)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon actual-icon">📊</div>
          <div className="card-content">
            <div className="card-label">Actual YTD</div>
            <div className="card-value">{formatCurrency(analysisData.budget.total_actual)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon variance-icon">⚖️</div>
          <div className="card-content">
            <div className="card-label">Variance</div>
            <div className={`card-value ${analysisData.budget.total_variance > 0 ? 'negative' : 'positive'}`}>
              {formatCurrency(Math.abs(analysisData.budget.total_variance))}
              <span className="percentage">({formatPercentage(analysisData.budget.total_variance_percentage)})</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon critical-icon">⚠️</div>
          <div className="card-content">
            <div className="card-label">Critical Variances</div>
            <div className="card-value critical">{analysisData.summary.critical_count}</div>
            <div className="card-sublabel">Require immediate attention</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <span className="stat-label">Total Line Items:</span>
          <span className="stat-value">{analysisData.summary.total_lines}</span>
        </div>
        <div className="stat-item over">
          <span className="stat-label">Over Budget:</span>
          <span className="stat-value">{analysisData.summary.over_budget_count}</span>
        </div>
        <div className="stat-item under">
          <span className="stat-label">Under Budget:</span>
          <span className="stat-value">{analysisData.summary.under_budget_count}</span>
        </div>
        <div className="stat-item on">
          <span className="stat-label">On Budget:</span>
          <span className="stat-value">{analysisData.summary.on_budget_count}</span>
        </div>
        <div className="stat-item warning">
          <span className="stat-label">Warnings:</span>
          <span className="stat-value">{analysisData.summary.warning_count}</span>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="controls-bar">
        <div className="filters">
          <div className="filter-group">
            <label>Severity:</label>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="OVER_BUDGET">Over Budget</option>
              <option value="UNDER_BUDGET">Under Budget</option>
              <option value="ON_BUDGET">On Budget</option>
            </select>
          </div>
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'table' ? 'active' : ''}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
          <button
            className={viewMode === 'chart' ? 'active' : ''}
            onClick={() => setViewMode('chart')}
          >
            Chart View
          </button>
        </div>
      </div>

      {/* Variance Analysis Table */}
      {viewMode === 'table' && (
        <div className="variance-table-container">
          <table className="variance-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Budgeted</th>
                <th>Actual YTD</th>
                <th>Progress</th>
                <th>Variance</th>
                <th>%</th>
                <th>Status</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">No data matches the selected filters</td>
                </tr>
              ) : (
                filteredLines.map((line, index) => (
                  <tr key={index} className={getSeverityClass(line.variance_severity)}>
                    <td className="account-cell">
                      <div className="account-code">{line.account_code}</div>
                      <div className="account-name">{line.account_name}</div>
                    </td>
                    <td className="amount-cell">{formatCurrency(line.annual_total)}</td>
                    <td className="amount-cell">{formatCurrency(line.actual_ytd)}</td>
                    <td className="progress-cell">
                      {renderProgressBar(line.actual_ytd, line.annual_total)}
                    </td>
                    <td className={`amount-cell ${line.variance_ytd > 0 ? 'negative' : 'positive'}`}>
                      {formatCurrency(Math.abs(line.variance_ytd))}
                    </td>
                    <td className={`percentage-cell ${line.variance_ytd > 0 ? 'negative' : 'positive'}`}>
                      {formatPercentage(line.variance_percentage)}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(line.variance_status)}`}>
                        {line.variance_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(line.variance_severity)}`}>
                        {line.variance_severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="chart-view">
          <div className="chart-container">
            <h3>Top 10 Variances (by Percentage)</h3>
            <div className="bar-chart">
              {filteredLines
                .sort((a, b) => Math.abs(b.variance_percentage) - Math.abs(a.variance_percentage))
                .slice(0, 10)
                .map((line, index) => (
                  <div key={index} className="chart-bar-row">
                    <div className="bar-label">
                      {line.account_code}
                      <span className="bar-sublabel">{line.account_name}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className={`bar ${line.variance_ytd > 0 ? 'negative' : 'positive'}`}
                        style={{ width: `${Math.min(Math.abs(line.variance_percentage), 100)}%` }}
                      >
                        <span className="bar-value">{formatPercentage(line.variance_percentage)}</span>
                      </div>
                    </div>
                    <div className="bar-amount">
                      {formatCurrency(Math.abs(line.variance_ytd))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="severity-distribution">
            <h3>Variance Distribution</h3>
            <div className="distribution-chart">
              <div className="distribution-item critical">
                <div className="distribution-label">Critical</div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${(analysisData.summary.critical_count / analysisData.summary.total_lines) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="distribution-value">{analysisData.summary.critical_count}</div>
              </div>

              <div className="distribution-item warning">
                <div className="distribution-label">Warning</div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${(analysisData.summary.warning_count / analysisData.summary.total_lines) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="distribution-value">{analysisData.summary.warning_count}</div>
              </div>

              <div className="distribution-item normal">
                <div className="distribution-label">Normal</div>
                <div className="distribution-bar">
                  <div
                    className="distribution-fill"
                    style={{
                      width: `${((analysisData.summary.total_lines - analysisData.summary.critical_count - analysisData.summary.warning_count) / analysisData.summary.total_lines) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="distribution-value">
                  {analysisData.summary.total_lines - analysisData.summary.critical_count - analysisData.summary.warning_count}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="action-bar">
        <button className="btn-export" onClick={() => alert('CSV export feature coming soon!')}>
          Export to CSV
        </button>
      </div>
    </div>
  );
};

export default BudgetVsActual;
