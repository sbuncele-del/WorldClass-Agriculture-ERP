import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './IncomeStatement.css';

interface AccountBalance {
  account_code: string;
  account_name: string;
  amount: number;
  parent_code?: string;
}

interface IncomeStatementSection {
  title: string;
  accounts: AccountBalance[];
  subtotal: number;
}

interface ComparisonData {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  revenue_total: number;
  cogs_total: number;
  gross_profit: number;
  operating_expenses_total: number;
  operating_profit: number;
  net_profit: number;
}

interface IncomeStatementData {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  revenue: IncomeStatementSection;
  cost_of_sales: IncomeStatementSection;
  gross_profit: number;
  operating_expenses: IncomeStatementSection;
  operating_profit: number;
  other_income: IncomeStatementSection;
  other_expenses: IncomeStatementSection;
  net_profit_before_tax: number;
  tax_expense: number;
  net_profit_after_tax: number;
  comparison?: ComparisonData;
}

type PeriodType = 'monthly' | 'quarterly' | 'annual' | 'custom';

const IncomeStatement: React.FC = () => {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['revenue', 'operating_expenses']));

  useEffect(() => {
    fetchIncomeStatement();
  }, [periodType, showComparison]);

  const fetchIncomeStatement = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE_URL}/api/financial/reports/income-statement?period=${periodType}&compare_prior=${showComparison}`;
      
      if (periodType === 'custom' && customStartDate && customEndDate) {
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch income statement');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
      console.error('Error fetching income statement:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateVariance = (current: number, prior: number): { amount: number; percentage: number } => {
    const amount = current - prior;
    const percentage = prior !== 0 ? (amount / prior) * 100 : 0;
    return { amount, percentage };
  };

  const getVarianceClass = (variance: number): string => {
    if (variance > 0) return 'variance-positive';
    if (variance < 0) return 'variance-negative';
    return 'variance-neutral';
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      alert('PDF export will be available in the next update');
    } else {
      alert('Excel export will be available in the next update');
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      fetchIncomeStatement();
    } else {
      alert('Please select both start and end dates');
    }
  };

  if (loading) {
    return (
      <div className="income-statement">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating Income Statement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="income-statement">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Error Loading Income Statement</h3>
          <p>{error}</p>
          <button onClick={fetchIncomeStatement} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="income-statement">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>No Data Available</h3>
          <p>There are no posted transactions for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="income-statement">
      <div className="is-header">
        <div className="is-header-left">
          <h1>Income Statement</h1>
          <p className="is-subtitle">Statement of Comprehensive Income</p>
        </div>
        <div className="is-header-right">
          <button className="btn-export" onClick={() => handleExport('pdf')}>
            📄 Export PDF
          </button>
          <button className="btn-export" onClick={() => handleExport('excel')}>
            📊 Export Excel
          </button>
        </div>
      </div>

      <div className="is-controls">
        <div className="control-group">
          <label>Period:</label>
          <select 
            value={periodType} 
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="period-select"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual (Fiscal Year)</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {periodType === 'custom' && (
          <div className="custom-date-range">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="date-input"
            />
            <button onClick={handleCustomDateApply} className="btn-apply">Apply</button>
          </div>
        )}

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
            />
            <span>Show Prior Period Comparison</span>
          </label>
        </div>

        <button onClick={fetchIncomeStatement} className="btn-refresh" title="Refresh">
          🔄
        </button>
      </div>

      <div className="is-content">
        <div className="is-report-header">
          <h2>Worldclass ERP Software</h2>
          <h3>Income Statement</h3>
          <p className="period-label">{data.period.label}</p>
          <p className="date-range">
            {new Date(data.period.start_date).toLocaleDateString('en-ZA')} - {new Date(data.period.end_date).toLocaleDateString('en-ZA')}
          </p>
        </div>

        <table className="is-table">
          <thead>
            <tr>
              <th className="account-column">Account</th>
              <th className="amount-column">Current Period</th>
              {showComparison && data.comparison && (
                <>
                  <th className="amount-column">Prior Period</th>
                  <th className="variance-column">Variance</th>
                  <th className="variance-column">%</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* Revenue Section */}
            <tr className="section-header" onClick={() => toggleSection('revenue')}>
              <td>
                <span className="expand-icon">{expandedSections.has('revenue') ? '▼' : '▶'}</span>
                <strong>{data.revenue.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.revenue.subtotal)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.revenue_total)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.revenue.subtotal, data.comparison.revenue_total).amount)}`}>
                    {formatCurrency(calculateVariance(data.revenue.subtotal, data.comparison.revenue_total).amount)}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.revenue.subtotal, data.comparison.revenue_total).percentage)}`}>
                    {calculateVariance(data.revenue.subtotal, data.comparison.revenue_total).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('revenue') && data.revenue.accounts.map((account) => (
              <tr key={account.account_code} className="account-row">
                <td className="account-detail">
                  <span className="account-code">{account.account_code}</span>
                  <span className="account-name">{account.account_name}</span>
                </td>
                <td className="amount">{formatCurrency(account.amount)}</td>
                {showComparison && data.comparison && (
                  <>
                    <td colSpan={3}></td>
                  </>
                )}
              </tr>
            ))}

            {/* Cost of Sales */}
            <tr className="section-header" onClick={() => toggleSection('cogs')}>
              <td>
                <span className="expand-icon">{expandedSections.has('cogs') ? '▼' : '▶'}</span>
                <strong>{data.cost_of_sales.title}</strong>
              </td>
              <td className="amount negative">({formatCurrency(data.cost_of_sales.subtotal)})</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount negative">({formatCurrency(data.comparison.cogs_total)})</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.cost_of_sales.subtotal, data.comparison.cogs_total).amount)}`}>
                    {formatCurrency(Math.abs(calculateVariance(data.cost_of_sales.subtotal, data.comparison.cogs_total).amount))}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.cost_of_sales.subtotal, data.comparison.cogs_total).percentage)}`}>
                    {calculateVariance(data.cost_of_sales.subtotal, data.comparison.cogs_total).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('cogs') && data.cost_of_sales.accounts.map((account) => (
              <tr key={account.account_code} className="account-row">
                <td className="account-detail">
                  <span className="account-code">{account.account_code}</span>
                  <span className="account-name">{account.account_name}</span>
                </td>
                <td className="amount negative">({formatCurrency(account.amount)})</td>
                {showComparison && data.comparison && (
                  <>
                    <td colSpan={3}></td>
                  </>
                )}
              </tr>
            ))}

            {/* Gross Profit */}
            <tr className="total-row gross-profit-row">
              <td><strong>Gross Profit</strong></td>
              <td className="amount"><strong>{formatCurrency(data.gross_profit)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.gross_profit)}</strong></td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.gross_profit, data.comparison.gross_profit).amount)}`}>
                    <strong>{formatCurrency(calculateVariance(data.gross_profit, data.comparison.gross_profit).amount)}</strong>
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.gross_profit, data.comparison.gross_profit).percentage)}`}>
                    <strong>{calculateVariance(data.gross_profit, data.comparison.gross_profit).percentage.toFixed(1)}%</strong>
                  </td>
                </>
              )}
            </tr>

            {/* Operating Expenses */}
            <tr className="section-header" onClick={() => toggleSection('operating_expenses')}>
              <td>
                <span className="expand-icon">{expandedSections.has('operating_expenses') ? '▼' : '▶'}</span>
                <strong>{data.operating_expenses.title}</strong>
              </td>
              <td className="amount negative">({formatCurrency(data.operating_expenses.subtotal)})</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount negative">({formatCurrency(data.comparison.operating_expenses_total)})</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.operating_expenses.subtotal, data.comparison.operating_expenses_total).amount)}`}>
                    {formatCurrency(Math.abs(calculateVariance(data.operating_expenses.subtotal, data.comparison.operating_expenses_total).amount))}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.operating_expenses.subtotal, data.comparison.operating_expenses_total).percentage)}`}>
                    {calculateVariance(data.operating_expenses.subtotal, data.comparison.operating_expenses_total).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('operating_expenses') && data.operating_expenses.accounts.map((account) => (
              <tr key={account.account_code} className="account-row">
                <td className="account-detail">
                  <span className="account-code">{account.account_code}</span>
                  <span className="account-name">{account.account_name}</span>
                </td>
                <td className="amount negative">({formatCurrency(account.amount)})</td>
                {showComparison && data.comparison && (
                  <>
                    <td colSpan={3}></td>
                  </>
                )}
              </tr>
            ))}

            {/* Operating Profit */}
            <tr className="total-row operating-profit-row">
              <td><strong>Operating Profit</strong></td>
              <td className="amount"><strong>{formatCurrency(data.operating_profit)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.operating_profit)}</strong></td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.operating_profit, data.comparison.operating_profit).amount)}`}>
                    <strong>{formatCurrency(calculateVariance(data.operating_profit, data.comparison.operating_profit).amount)}</strong>
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.operating_profit, data.comparison.operating_profit).percentage)}`}>
                    <strong>{calculateVariance(data.operating_profit, data.comparison.operating_profit).percentage.toFixed(1)}%</strong>
                  </td>
                </>
              )}
            </tr>

            {/* Other Income & Expenses */}
            {data.other_income.accounts.length > 0 && (
              <>
                <tr className="section-header" onClick={() => toggleSection('other_income')}>
                  <td>
                    <span className="expand-icon">{expandedSections.has('other_income') ? '▼' : '▶'}</span>
                    <strong>{data.other_income.title}</strong>
                  </td>
                  <td className="amount">{formatCurrency(data.other_income.subtotal)}</td>
                  {showComparison && data.comparison && (
                    <>
                      <td colSpan={3}></td>
                    </>
                  )}
                </tr>
                {expandedSections.has('other_income') && data.other_income.accounts.map((account) => (
                  <tr key={account.account_code} className="account-row">
                    <td className="account-detail">
                      <span className="account-code">{account.account_code}</span>
                      <span className="account-name">{account.account_name}</span>
                    </td>
                    <td className="amount">{formatCurrency(account.amount)}</td>
                    {showComparison && data.comparison && (
                      <>
                        <td colSpan={3}></td>
                      </>
                    )}
                  </tr>
                ))}
              </>
            )}

            {data.other_expenses.accounts.length > 0 && (
              <>
                <tr className="section-header" onClick={() => toggleSection('other_expenses')}>
                  <td>
                    <span className="expand-icon">{expandedSections.has('other_expenses') ? '▼' : '▶'}</span>
                    <strong>{data.other_expenses.title}</strong>
                  </td>
                  <td className="amount negative">({formatCurrency(data.other_expenses.subtotal)})</td>
                  {showComparison && data.comparison && (
                    <>
                      <td colSpan={3}></td>
                    </>
                  )}
                </tr>
                {expandedSections.has('other_expenses') && data.other_expenses.accounts.map((account) => (
                  <tr key={account.account_code} className="account-row">
                    <td className="account-detail">
                      <span className="account-code">{account.account_code}</span>
                      <span className="account-name">{account.account_name}</span>
                    </td>
                    <td className="amount negative">({formatCurrency(account.amount)})</td>
                    {showComparison && data.comparison && (
                      <>
                        <td colSpan={3}></td>
                      </>
                    )}
                  </tr>
                ))}
              </>
            )}

            {/* Net Profit Before Tax */}
            <tr className="total-row">
              <td><strong>Net Profit Before Tax</strong></td>
              <td className="amount"><strong>{formatCurrency(data.net_profit_before_tax)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td colSpan={3}></td>
                </>
              )}
            </tr>

            {/* Tax Expense */}
            {data.tax_expense > 0 && (
              <tr className="account-row">
                <td className="account-detail">
                  <span className="account-name">Income Tax Expense</span>
                </td>
                <td className="amount negative">({formatCurrency(data.tax_expense)})</td>
                {showComparison && data.comparison && (
                  <>
                    <td colSpan={3}></td>
                  </>
                )}
              </tr>
            )}

            {/* Net Profit After Tax */}
            <tr className="total-row net-profit-row">
              <td><strong>Net Profit After Tax</strong></td>
              <td className="amount"><strong>{formatCurrency(data.net_profit_after_tax)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.net_profit)}</strong></td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.net_profit_after_tax, data.comparison.net_profit).amount)}`}>
                    <strong>{formatCurrency(calculateVariance(data.net_profit_after_tax, data.comparison.net_profit).amount)}</strong>
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.net_profit_after_tax, data.comparison.net_profit).percentage)}`}>
                    <strong>{calculateVariance(data.net_profit_after_tax, data.comparison.net_profit).percentage.toFixed(1)}%</strong>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>

        <div className="is-footer">
          <p>Report generated on {new Date().toLocaleString('en-ZA')}</p>
          <p className="disclaimer">This is a system-generated report. All amounts in ZAR.</p>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
