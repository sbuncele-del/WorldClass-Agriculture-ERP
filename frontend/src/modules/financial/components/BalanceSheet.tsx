import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './BalanceSheet.css';

interface AccountBalance {
  account_code: string;
  account_name: string;
  amount: number;
  parent_code?: string;
}

interface BalanceSheetSection {
  title: string;
  accounts: AccountBalance[];
  subtotal: number;
}

interface ComparisonData {
  as_of_date: string;
  label: string;
  current_assets: number;
  non_current_assets: number;
  total_assets: number;
  current_liabilities: number;
  non_current_liabilities: number;
  total_liabilities: number;
  equity: number;
  total_liabilities_equity: number;
}

interface BalanceSheetData {
  as_of_date: string;
  label: string;
  current_assets: BalanceSheetSection;
  non_current_assets: BalanceSheetSection;
  total_assets: number;
  current_liabilities: BalanceSheetSection;
  non_current_liabilities: BalanceSheetSection;
  total_liabilities: number;
  equity: BalanceSheetSection;
  total_equity: number;
  total_liabilities_equity: number;
  is_balanced: boolean;
  variance: number;
  comparison?: ComparisonData;
}

const BalanceSheet: React.FC = () => {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['current_assets', 'current_liabilities', 'equity'])
  );

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate, showComparison]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/api/financial/reports/balance-sheet?as_of_date=${asOfDate}&compare_prior=${showComparison}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch balance sheet');
      }
    } catch (err) {
      setError('Network error. Please check if the backend server is running.');
      console.error('Error fetching balance sheet:', err);
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAsOfDate(e.target.value);
  };

  if (loading) {
    return (
      <div className="balance-sheet">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating Balance Sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balance-sheet">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Error Loading Balance Sheet</h3>
          <p>{error}</p>
          <button onClick={fetchBalanceSheet} className="btn-retry">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="balance-sheet">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>No Data Available</h3>
          <p>There are no posted transactions as of the selected date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-sheet">
      <div className="bs-header">
        <div className="bs-header-left">
          <h1>Balance Sheet</h1>
          <p className="bs-subtitle">Statement of Financial Position</p>
          {!data.is_balanced && (
            <div className="balance-warning">
              ⚠️ Balance Sheet does not balance! Variance: {formatCurrency(data.variance)}
            </div>
          )}
        </div>
        <div className="bs-header-right">
          <button className="btn-export" onClick={() => handleExport('pdf')}>
            📄 Export PDF
          </button>
          <button className="btn-export" onClick={() => handleExport('excel')}>
            📊 Export Excel
          </button>
        </div>
      </div>

      <div className="bs-controls">
        <div className="control-group">
          <label>As of Date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={handleDateChange}
            className="date-input"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
            />
            <span>Show Prior Year Comparison</span>
          </label>
        </div>

        <button onClick={fetchBalanceSheet} className="btn-refresh" title="Refresh">
          🔄
        </button>
      </div>

      <div className="bs-content">
        <div className="bs-report-header">
          <h2>Worldclass ERP Software</h2>
          <h3>Balance Sheet</h3>
          <p className="date-label">{data.label}</p>
        </div>

        <table className="bs-table">
          <thead>
            <tr>
              <th className="account-column">Account</th>
              <th className="amount-column">Current</th>
              {showComparison && data.comparison && (
                <>
                  <th className="amount-column">Prior Year</th>
                  <th className="variance-column">Variance</th>
                  <th className="variance-column">%</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* ASSETS SECTION */}
            <tr className="main-section-header">
              <td colSpan={showComparison && data.comparison ? 5 : 2}>
                <strong>ASSETS</strong>
              </td>
            </tr>

            {/* Current Assets */}
            <tr className="section-header" onClick={() => toggleSection('current_assets')}>
              <td>
                <span className="expand-icon">{expandedSections.has('current_assets') ? '▼' : '▶'}</span>
                <strong>{data.current_assets.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.current_assets.subtotal)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.current_assets)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.current_assets.subtotal, data.comparison.current_assets).amount)}`}>
                    {formatCurrency(calculateVariance(data.current_assets.subtotal, data.comparison.current_assets).amount)}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.current_assets.subtotal, data.comparison.current_assets).percentage)}`}>
                    {calculateVariance(data.current_assets.subtotal, data.comparison.current_assets).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('current_assets') && data.current_assets.accounts.map((account) => (
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

            {/* Non-Current Assets */}
            <tr className="section-header" onClick={() => toggleSection('non_current_assets')}>
              <td>
                <span className="expand-icon">{expandedSections.has('non_current_assets') ? '▼' : '▶'}</span>
                <strong>{data.non_current_assets.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.non_current_assets.subtotal)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.non_current_assets)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.non_current_assets.subtotal, data.comparison.non_current_assets).amount)}`}>
                    {formatCurrency(calculateVariance(data.non_current_assets.subtotal, data.comparison.non_current_assets).amount)}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.non_current_assets.subtotal, data.comparison.non_current_assets).percentage)}`}>
                    {calculateVariance(data.non_current_assets.subtotal, data.comparison.non_current_assets).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('non_current_assets') && data.non_current_assets.accounts.map((account) => (
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

            {/* Total Assets */}
            <tr className="total-row assets-total-row">
              <td><strong>TOTAL ASSETS</strong></td>
              <td className="amount"><strong>{formatCurrency(data.total_assets)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.total_assets)}</strong></td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_assets, data.comparison.total_assets).amount)}`}>
                    <strong>{formatCurrency(calculateVariance(data.total_assets, data.comparison.total_assets).amount)}</strong>
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_assets, data.comparison.total_assets).percentage)}`}>
                    <strong>{calculateVariance(data.total_assets, data.comparison.total_assets).percentage.toFixed(1)}%</strong>
                  </td>
                </>
              )}
            </tr>

            {/* LIABILITIES & EQUITY SECTION */}
            <tr className="main-section-header">
              <td colSpan={showComparison && data.comparison ? 5 : 2}>
                <strong>LIABILITIES & EQUITY</strong>
              </td>
            </tr>

            {/* Current Liabilities */}
            <tr className="section-header" onClick={() => toggleSection('current_liabilities')}>
              <td>
                <span className="expand-icon">{expandedSections.has('current_liabilities') ? '▼' : '▶'}</span>
                <strong>{data.current_liabilities.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.current_liabilities.subtotal)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.current_liabilities)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.current_liabilities.subtotal, data.comparison.current_liabilities).amount)}`}>
                    {formatCurrency(Math.abs(calculateVariance(data.current_liabilities.subtotal, data.comparison.current_liabilities).amount))}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.current_liabilities.subtotal, data.comparison.current_liabilities).percentage)}`}>
                    {calculateVariance(data.current_liabilities.subtotal, data.comparison.current_liabilities).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('current_liabilities') && data.current_liabilities.accounts.map((account) => (
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

            {/* Non-Current Liabilities */}
            <tr className="section-header" onClick={() => toggleSection('non_current_liabilities')}>
              <td>
                <span className="expand-icon">{expandedSections.has('non_current_liabilities') ? '▼' : '▶'}</span>
                <strong>{data.non_current_liabilities.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.non_current_liabilities.subtotal)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.non_current_liabilities)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.non_current_liabilities.subtotal, data.comparison.non_current_liabilities).amount)}`}>
                    {formatCurrency(Math.abs(calculateVariance(data.non_current_liabilities.subtotal, data.comparison.non_current_liabilities).amount))}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.non_current_liabilities.subtotal, data.comparison.non_current_liabilities).percentage)}`}>
                    {calculateVariance(data.non_current_liabilities.subtotal, data.comparison.non_current_liabilities).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('non_current_liabilities') && data.non_current_liabilities.accounts.map((account) => (
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

            {/* Total Liabilities */}
            <tr className="subtotal-row">
              <td><strong>Total Liabilities</strong></td>
              <td className="amount"><strong>{formatCurrency(data.total_liabilities)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.total_liabilities)}</strong></td>
                  <td colSpan={2}></td>
                </>
              )}
            </tr>

            {/* Equity */}
            <tr className="section-header" onClick={() => toggleSection('equity')}>
              <td>
                <span className="expand-icon">{expandedSections.has('equity') ? '▼' : '▶'}</span>
                <strong>{data.equity.title}</strong>
              </td>
              <td className="amount">{formatCurrency(data.total_equity)}</td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount">{formatCurrency(data.comparison.equity)}</td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_equity, data.comparison.equity).amount)}`}>
                    {formatCurrency(calculateVariance(data.total_equity, data.comparison.equity).amount)}
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_equity, data.comparison.equity).percentage)}`}>
                    {calculateVariance(data.total_equity, data.comparison.equity).percentage.toFixed(1)}%
                  </td>
                </>
              )}
            </tr>
            {expandedSections.has('equity') && data.equity.accounts.map((account) => (
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

            {/* Total Liabilities & Equity */}
            <tr className="total-row liabilities-equity-total-row">
              <td><strong>TOTAL LIABILITIES & EQUITY</strong></td>
              <td className="amount"><strong>{formatCurrency(data.total_liabilities_equity)}</strong></td>
              {showComparison && data.comparison && (
                <>
                  <td className="amount"><strong>{formatCurrency(data.comparison.total_liabilities_equity)}</strong></td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_liabilities_equity, data.comparison.total_liabilities_equity).amount)}`}>
                    <strong>{formatCurrency(calculateVariance(data.total_liabilities_equity, data.comparison.total_liabilities_equity).amount)}</strong>
                  </td>
                  <td className={`variance ${getVarianceClass(calculateVariance(data.total_liabilities_equity, data.comparison.total_liabilities_equity).percentage)}`}>
                    <strong>{calculateVariance(data.total_liabilities_equity, data.comparison.total_liabilities_equity).percentage.toFixed(1)}%</strong>
                  </td>
                </>
              )}
            </tr>
          </tbody>
        </table>

        {data.is_balanced && (
          <div className="balance-check success">
            ✅ Balance Sheet is balanced (Assets = Liabilities + Equity)
          </div>
        )}

        {!data.is_balanced && (
          <div className="balance-check error">
            ⚠️ Balance Sheet does not balance! 
            <br />
            Variance: {formatCurrency(data.variance)}
            <br />
            <small>Please check for unposted journal entries or data errors.</small>
          </div>
        )}

        <div className="bs-footer">
          <p>Report generated on {new Date().toLocaleString('en-ZA')}</p>
          <p className="disclaimer">This is a system-generated report. All amounts in ZAR.</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
