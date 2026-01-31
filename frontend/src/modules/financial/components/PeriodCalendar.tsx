/**
 * Period Calendar Component
 * Visual 12-month calendar showing period status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PeriodService } from '../services/period.service';
import type { AccountingPeriod, FiscalYear } from '../types/period.types';
import { PeriodStatus } from '../types/period.types';
import './PeriodCalendar.css';

interface PeriodCalendarProps {
  fiscalYear?: FiscalYear;
  onPeriodSelect?: (period: AccountingPeriod) => void;
}

export const PeriodCalendar: React.FC<PeriodCalendarProps> = ({
  fiscalYear,
  onPeriodSelect
}) => {
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);

  const loadPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const data = fiscalYear
        ? await PeriodService.getAllPeriods(fiscalYear.id)
        : await PeriodService.getAllPeriods();
      setPeriods(data.sort((a, b) => a.period_number - b.period_number));
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const handlePeriodClick = (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    if (onPeriodSelect) {
      onPeriodSelect(period);
    }
  };

  const getStatusColor = (status: PeriodStatus): string => {
    switch (status) {
      case PeriodStatus.FUTURE:
        return 'status-future';
      case PeriodStatus.OPEN:
        return 'status-open';
      case PeriodStatus.CLOSED:
        return 'status-closed';
      case PeriodStatus.LOCKED:
        return 'status-locked';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: PeriodStatus): string => {
    switch (status) {
      case PeriodStatus.FUTURE:
        return '🔵';
      case PeriodStatus.OPEN:
        return '🟢';
      case PeriodStatus.CLOSED:
        return '🟡';
      case PeriodStatus.LOCKED:
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="period-calendar-loading">
        <div className="spinner"></div>
        <p>Loading periods...</p>
      </div>
    );
  }

  return (
    <div className="period-calendar">
      <div className="calendar-header">
        <h3>📅 Accounting Periods</h3>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-dot status-future"></span> Future
          </span>
          <span className="legend-item">
            <span className="legend-dot status-open"></span> Open
          </span>
          <span className="legend-item">
            <span className="legend-dot status-closed"></span> Closed
          </span>
          <span className="legend-item">
            <span className="legend-dot status-locked"></span> Locked
          </span>
        </div>
      </div>

      <div className="calendar-grid">
        {periods.map((period) => (
          <div
            key={period.id}
            className={`period-card ${getStatusColor(period.status)} ${
              period.is_current ? 'current-period' : ''
            } ${selectedPeriod?.id === period.id ? 'selected' : ''}`}
            onClick={() => handlePeriodClick(period)}
          >
            <div className="period-header">
              <span className="period-icon">{getStatusIcon(period.status)}</span>
              <span className="period-code">{period.period_code}</span>
            </div>
            <div className="period-name">{period.period_name}</div>
            <div className="period-dates">
              <div className="date-range">
                {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </div>
            </div>
            <div className="period-status">
              <span className={`status-badge ${getStatusColor(period.status)}`}>
                {period.status}
              </span>
              {period.is_current && (
                <span className="current-badge">⭐ CURRENT</span>
              )}
            </div>
            {period.is_adjustment_period && (
              <div className="adjustment-badge">📝 Adjustment</div>
            )}
          </div>
        ))}
      </div>

      {selectedPeriod && (
        <div className="period-details">
          <h4>Period Details</h4>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Period:</span>
              <span className="detail-value">{selectedPeriod.period_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Code:</span>
              <span className="detail-value">{selectedPeriod.period_code}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${getStatusColor(selectedPeriod.status)}`}>
                {selectedPeriod.status}
              </span>
            </div>
            {selectedPeriod.opened_at && (
              <div className="detail-item">
                <span className="detail-label">Opened:</span>
                <span className="detail-value">
                  {formatDate(selectedPeriod.opened_at)} by {selectedPeriod.opened_by}
                </span>
              </div>
            )}
            {selectedPeriod.closed_at && (
              <div className="detail-item">
                <span className="detail-label">Closed:</span>
                <span className="detail-value">
                  {formatDate(selectedPeriod.closed_at)} by {selectedPeriod.closed_by}
                </span>
              </div>
            )}
            {selectedPeriod.locked_at && (
              <div className="detail-item">
                <span className="detail-label">Locked:</span>
                <span className="detail-value">
                  {formatDate(selectedPeriod.locked_at)} by {selectedPeriod.locked_by}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
