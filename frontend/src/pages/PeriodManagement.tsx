/**
 * Period Management Page
 * Main interface for managing fiscal years and accounting periods
 */

import React, { useState, useEffect } from 'react';
import { PeriodService } from '../modules/financial/services/period.service';
import { PeriodCalendar } from '../modules/financial/components/PeriodCalendar';
import { PeriodActions } from '../modules/financial/components/PeriodActions';
import type { AccountingPeriod, PeriodSummary, FiscalYear } from '../modules/financial/types/period.types';
import './PeriodManagement.css';

export const PeriodManagement: React.FC = () => {
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [currentFiscalYear, setCurrentFiscalYear] = useState<FiscalYear | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, fiscalYear] = await Promise.all([
        PeriodService.getPeriodSummary(),
        PeriodService.getCurrentFiscalYear()
      ]);
      setSummary(summaryData);
      setCurrentFiscalYear(fiscalYear);
      if (summaryData.current_period) {
        setSelectedPeriod(summaryData.current_period);
      }
    } catch (error) {
      console.error('Failed to load period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSelect = (period: AccountingPeriod) => {
    setSelectedPeriod(period);
  };

  const handleActionSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="period-management-loading">
        <div className="spinner"></div>
        <p>Loading period management...</p>
      </div>
    );
  }

  return (
    <div className="period-management">
      <header className="period-header">
        <div className="header-content">
          <h1>📅 Period Management</h1>
          <p className="header-subtitle">Fiscal Year & Accounting Period Control</p>
        </div>
      </header>

      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-value">{summary.total_periods}</div>
              <div className="card-label">Total Periods</div>
            </div>
          </div>

          <div className="summary-card open">
            <div className="card-icon">🟢</div>
            <div className="card-content">
              <div className="card-value">{summary.open_periods}</div>
              <div className="card-label">Open</div>
            </div>
          </div>

          <div className="summary-card closed">
            <div className="card-icon">🟡</div>
            <div className="card-content">
              <div className="card-value">{summary.closed_periods}</div>
              <div className="card-label">Closed</div>
            </div>
          </div>

          <div className="summary-card locked">
            <div className="card-icon">🔴</div>
            <div className="card-content">
              <div className="card-value">{summary.locked_periods}</div>
              <div className="card-label">Locked</div>
            </div>
          </div>

          <div className="summary-card future">
            <div className="card-icon">🔵</div>
            <div className="card-content">
              <div className="card-value">{summary.future_periods}</div>
              <div className="card-label">Future</div>
            </div>
          </div>
        </div>
      )}

      {currentFiscalYear && (
        <div className="fiscal-year-banner">
          <div className="banner-content">
            <span className="banner-icon">📆</span>
            <div className="banner-text">
              <strong>{currentFiscalYear.year_code}</strong>
              <span className="banner-dates">
                {new Date(currentFiscalYear.start_date).toLocaleDateString('en-ZA')} - 
                {new Date(currentFiscalYear.end_date).toLocaleDateString('en-ZA')}
              </span>
            </div>
            <span className={`banner-badge status-${currentFiscalYear.status.toLowerCase()}`}>
              {currentFiscalYear.status}
            </span>
          </div>
        </div>
      )}

      {summary?.current_period && (
        <div className="current-period-alert">
          <span className="alert-icon">⭐</span>
          <strong>Current Period:</strong> {summary.current_period.period_name}
          <span className="alert-code">({summary.current_period.period_code})</span>
        </div>
      )}

      <div className="period-content">
        <div className="period-calendar-section">
          <PeriodCalendar
            fiscalYear={currentFiscalYear || undefined}
            onPeriodSelect={handlePeriodSelect}
          />
        </div>

        <div className="period-actions-section">
          <PeriodActions
            period={selectedPeriod}
            onSuccess={handleActionSuccess}
          />
        </div>
      </div>

      <div className="period-info">
        <h3>📖 Period Management Guide</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>🔵 Future Periods</h4>
            <p>Not yet available for transactions. Must be opened first.</p>
          </div>
          <div className="info-card">
            <h4>🟢 Open Periods</h4>
            <p>Available for posting journal entries. Can be closed at month-end.</p>
          </div>
          <div className="info-card">
            <h4>🟡 Closed Periods</h4>
            <p>No new transactions allowed. Can be locked for permanent protection.</p>
          </div>
          <div className="info-card">
            <h4>🔴 Locked Periods</h4>
            <p>Permanently secured. Cannot be reopened or modified (audit requirement).</p>
          </div>
        </div>

        <div className="workflow-info">
          <h4>🔄 Period Close Workflow</h4>
          <ol>
            <li>Validate: Check for unposted entries and issues</li>
            <li>Close: End-of-period processing (next period auto-opens)</li>
            <li>Lock: Permanent protection (after audits/finalization)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
