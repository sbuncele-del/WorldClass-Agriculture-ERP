import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CashFlow.css';

interface CashFlowItem {
  description: string;
  amount: number;
}

interface CashFlowSection {
  title: string;
  items: CashFlowItem[];
  subtotal: number;
}

interface CashReconciliation {
  balance_sheet_cash_beginning: number;
  balance_sheet_cash_ending: number;
  is_reconciled: boolean;
  variance: number;
}

interface CashFlowData {
  period: {
    start_date: string;
    end_date: string;
    label: string;
  };
  method: 'indirect' | 'direct';
  operating_activities: CashFlowSection;
  investing_activities: CashFlowSection;
  financing_activities: CashFlowSection;
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
  cash_reconciliation: CashReconciliation;
}

interface ApiResponse {
  success: boolean;
  data?: CashFlowData;
  message?: string;
}

const CashFlow: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controls
  const [periodType, setPeriodType] = useState<string>('monthly');
  const [method, setMethod] = useState<'indirect' | 'direct'>('indirect');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['operating', 'investing', 'financing'])
  );

  useEffect(() => {
    fetchCashFlow();
  }, [periodType, method]);

  const fetchCashFlow = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/financial/reports/cash-flow?period=${periodType}&method=${method}`;

      if (periodType === 'custom' && customStartDate && customEndDate) {
        url += `&start_date=${customStartDate}&end_date=${customEndDate}`;
      }

      const response = await fetch(url);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load cash flow statement');
      }
    } catch (err) {
      setError('Error loading cash flow statement. Please try again.');
      console.error('Error fetching cash flow:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting to ${format}...`);
    // Export functionality will be implemented in Phase 2
  };

  const handleRefresh = () => {
    fetchCashFlow();
  };

  if (loading) {
    return (
      <div className="cash-flow">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Cash Flow Statement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cash-flow">
        <div className="error-state">
          <h3>⚠️ Error</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="cash-flow">
        <div className="empty-state">
          <h3>No Data Available</h3>
          <p>Please select a period to view the cash flow statement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cash-flow">
      {/* Header */}
      <div className="cf-header">
        <div className="cf-title-section">
          <h1>Cash Flow Statement</h1>
          <p className="cf-subtitle">
            Statement of Cash Flows for {data.period.label}
          </p>
          <p className="cf-method-badge">
            Method: <strong>{method === 'indirect' ? 'Indirect' : 'Direct'}</strong>
          </p>
        </div>
        
        {/* Cash Reconciliation Warning */}
        {!data.cash_reconciliation.is_reconciled && (
          <div className="reconciliation-warning">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Cash Reconciliation Issue</strong>
              <p>
                Variance of {formatCurrency(Math.abs(data.cash_reconciliation.variance))} detected. 
                Please review cash transactions.
              </p>
            </div>
          </div>
        )}

        <div className="cf-actions">
          <button onClick={() => handleExport('pdf')} className="btn-export">
            📄 Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="btn-export">
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="cf-controls">
        <div className="control-group">
          <label htmlFor="period">Period:</label>
          <select
            id="period"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="control-select"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="method">Method:</label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as 'indirect' | 'direct')}
            className="control-select"
          >
            <option value="indirect">Indirect</option>
            <option value="direct">Direct</option>
          </select>
        </div>

        {periodType === 'custom' && (
          <>
            <div className="control-group">
              <label htmlFor="start-date">Start Date:</label>
              <input
                type="date"
                id="start-date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="control-input"
              />
            </div>
            <div className="control-group">
              <label htmlFor="end-date">End Date:</label>
              <input
                type="date"
                id="end-date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="control-input"
              />
            </div>
          </>
        )}

        <button onClick={handleRefresh} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>

      {/* Cash Flow Content */}
      <div className="cf-content">
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th className="description-col">Description</th>
                <th className="amount-col">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Operating Activities */}
              <tr className="section-header operating-header" onClick={() => toggleSection('operating')}>
                <td colSpan={2}>
                  <div className="section-header-content">
                    <span className="expand-icon">
                      {expandedSections.has('operating') ? '▼' : '▶'}
                    </span>
                    <strong>{data.operating_activities.title}</strong>
                  </div>
                </td>
              </tr>
              {expandedSections.has('operating') &&
                data.operating_activities.items.map((item, index) => (
                  <tr key={`op-${index}`} className="detail-row">
                    <td className="item-description">{item.description}</td>
                    <td className="item-amount">
                      <span className={item.amount >= 0 ? 'positive-amount' : 'negative-amount'}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              <tr className="subtotal-row operating-subtotal">
                <td><strong>Net Cash from Operating Activities</strong></td>
                <td>
                  <strong className={data.operating_activities.subtotal >= 0 ? 'positive-amount' : 'negative-amount'}>
                    {formatCurrency(data.operating_activities.subtotal)}
                  </strong>
                </td>
              </tr>

              {/* Investing Activities */}
              <tr className="section-header investing-header" onClick={() => toggleSection('investing')}>
                <td colSpan={2}>
                  <div className="section-header-content">
                    <span className="expand-icon">
                      {expandedSections.has('investing') ? '▼' : '▶'}
                    </span>
                    <strong>{data.investing_activities.title}</strong>
                  </div>
                </td>
              </tr>
              {expandedSections.has('investing') &&
                data.investing_activities.items.map((item, index) => (
                  <tr key={`inv-${index}`} className="detail-row">
                    <td className="item-description">{item.description}</td>
                    <td className="item-amount">
                      <span className={item.amount >= 0 ? 'positive-amount' : 'negative-amount'}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              <tr className="subtotal-row investing-subtotal">
                <td><strong>Net Cash from Investing Activities</strong></td>
                <td>
                  <strong className={data.investing_activities.subtotal >= 0 ? 'positive-amount' : 'negative-amount'}>
                    {formatCurrency(data.investing_activities.subtotal)}
                  </strong>
                </td>
              </tr>

              {/* Financing Activities */}
              <tr className="section-header financing-header" onClick={() => toggleSection('financing')}>
                <td colSpan={2}>
                  <div className="section-header-content">
                    <span className="expand-icon">
                      {expandedSections.has('financing') ? '▼' : '▶'}
                    </span>
                    <strong>{data.financing_activities.title}</strong>
                  </div>
                </td>
              </tr>
              {expandedSections.has('financing') &&
                data.financing_activities.items.map((item, index) => (
                  <tr key={`fin-${index}`} className="detail-row">
                    <td className="item-description">{item.description}</td>
                    <td className="item-amount">
                      <span className={item.amount >= 0 ? 'positive-amount' : 'negative-amount'}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              <tr className="subtotal-row financing-subtotal">
                <td><strong>Net Cash from Financing Activities</strong></td>
                <td>
                  <strong className={data.financing_activities.subtotal >= 0 ? 'positive-amount' : 'negative-amount'}>
                    {formatCurrency(data.financing_activities.subtotal)}
                  </strong>
                </td>
              </tr>

              {/* Net Change in Cash */}
              <tr className="net-change-row">
                <td><strong>Net Increase (Decrease) in Cash</strong></td>
                <td>
                  <strong className={data.net_cash_flow >= 0 ? 'positive-amount' : 'negative-amount'}>
                    {formatCurrency(data.net_cash_flow)}
                  </strong>
                </td>
              </tr>

              {/* Cash Reconciliation */}
              <tr className="reconciliation-row">
                <td>Cash at Beginning of Period</td>
                <td>{formatCurrency(data.beginning_cash)}</td>
              </tr>
              <tr className="reconciliation-row">
                <td>Cash at End of Period</td>
                <td><strong>{formatCurrency(data.ending_cash)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Reconciliation Check */}
        <div className={`reconciliation-check ${data.cash_reconciliation.is_reconciled ? 'success' : 'error'}`}>
          {data.cash_reconciliation.is_reconciled ? (
            <>
              <span className="check-icon">✅</span>
              <span>Cash reconciliation verified: Beginning Cash + Net Change = Ending Cash</span>
            </>
          ) : (
            <>
              <span className="check-icon">⚠️</span>
              <span>
                Cash reconciliation variance: {formatCurrency(Math.abs(data.cash_reconciliation.variance))}. 
                Please review cash transactions for discrepancies.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="cf-footer">
        <div className="footer-note">
          <p>
            <strong>Note:</strong> This cash flow statement uses the <strong>{method}</strong> method 
            and shows cash movements for the period {data.period.start_date} to {data.period.end_date}.
          </p>
          {method === 'indirect' && (
            <p className="method-explanation">
              The indirect method starts with net income and adjusts for non-cash items and changes in working capital.
            </p>
          )}
          {method === 'direct' && (
            <p className="method-explanation">
              The direct method shows actual cash receipts and payments during the period.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlow;
