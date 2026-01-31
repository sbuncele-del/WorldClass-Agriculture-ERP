/**
 * Period Actions Component
 * Open/Close/Lock period operations
 */

import React, { useState } from 'react';
import { PeriodService } from '../services/period.service';
import type { AccountingPeriod, PeriodValidation } from '../types/period.types';
import { PeriodStatus } from '../types/period.types';
import './PeriodActions.css';

interface PeriodActionsProps {
  period: AccountingPeriod | null;
  onSuccess: () => void;
}

export const PeriodActions: React.FC<PeriodActionsProps> = ({ period, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<PeriodValidation | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [forceClose, setForceClose] = useState(false);
  const userId = 'current-user'; // TODO: Get from auth context

  if (!period) {
    return (
      <div className="period-actions-empty">
        <p>Select a period to manage</p>
      </div>
    );
  }

  const handleOpenPeriod = async () => {
    if (!period) return;
    
    try {
      setLoading(true);
      await PeriodService.openPeriod(period.id, userId);
      alert('Period opened successfully! 🟢');
      onSuccess();
    } catch (error) {
      alert(`Failed to open period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateClose = async () => {
    if (!period) return;
    
    try {
      setLoading(true);
      const result = await PeriodService.validatePeriodClose(period.id);
      setValidation(result);
      setShowValidation(true);
    } catch (error) {
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!period) return;
    
    if (!forceClose && validation && !validation.can_close) {
      alert('Period cannot be closed. Please resolve blocking issues first or enable Force Close.');
      return;
    }

    const confirmMessage = forceClose
      ? '⚠️ You are forcing period closure. This will override validation checks. Continue?'
      : 'Are you sure you want to close this period?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setLoading(true);
      await PeriodService.closePeriod(period.id, userId, forceClose);
      alert('Period closed successfully! 🟡\nThe next period has been automatically opened.');
      setShowValidation(false);
      setValidation(null);
      setForceClose(false);
      onSuccess();
    } catch (error) {
      alert(`Failed to close period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLockPeriod = async () => {
    if (!period) return;
    
    if (!window.confirm('🔴 WARNING: Locking a period is PERMANENT and cannot be undone. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      await PeriodService.lockPeriod(period.id, userId);
      alert('Period locked permanently! 🔴');
      onSuccess();
    } catch (error) {
      alert(`Failed to lock period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrent = async () => {
    if (!period) return;
    
    if (!window.confirm(`Set ${period.period_name} as the current period?`)) return;
    
    try {
      setLoading(true);
      await PeriodService.setCurrentPeriod(period.id, userId);
      alert('Current period updated! ⭐');
      onSuccess();
    } catch (error) {
      alert(`Failed to set current period: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="period-actions">
      <div className="actions-header">
        <h3>Period Actions</h3>
        <div className="period-info">
          <span className="info-label">{period.period_name}</span>
          <span className={`info-badge status-${period.status.toLowerCase()}`}>
            {period.status}
          </span>
        </div>
      </div>

      <div className="actions-buttons">
        {period.status === PeriodStatus.FUTURE && (
          <button
            className="action-btn btn-open"
            onClick={handleOpenPeriod}
            disabled={loading}
          >
            🟢 Open Period
          </button>
        )}

        {period.status === PeriodStatus.OPEN && (
          <>
            <button
              className="action-btn btn-validate"
              onClick={handleValidateClose}
              disabled={loading}
            >
              🔍 Validate Close
            </button>
            <button
              className="action-btn btn-close"
              onClick={handleClosePeriod}
              disabled={loading}
            >
              🟡 Close Period
            </button>
          </>
        )}

        {period.status === PeriodStatus.CLOSED && (
          <button
            className="action-btn btn-lock"
            onClick={handleLockPeriod}
            disabled={loading}
          >
            🔴 Lock Period (Permanent)
          </button>
        )}

        {!period.is_current && period.status === PeriodStatus.OPEN && (
          <button
            className="action-btn btn-current"
            onClick={handleSetCurrent}
            disabled={loading}
          >
            ⭐ Set as Current
          </button>
        )}
      </div>

      {showValidation && validation && (
        <div className="validation-results">
          <h4>Validation Results</h4>
          
          <div className={`validation-status ${validation.can_close ? 'success' : 'error'}`}>
            {validation.can_close ? (
              <>✅ Period can be closed</>
            ) : (
              <>❌ Period cannot be closed</>
            )}
          </div>

          {validation.blocking_issues.length > 0 && (
            <div className="issues-section">
              <h5>🚫 Blocking Issues:</h5>
              <ul>
                {validation.blocking_issues.map((issue, idx) => (
                  <li key={idx} className="issue-item error">{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="issues-section">
              <h5>⚠️ Warnings:</h5>
              <ul>
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="issue-item warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.unposted_entries_count > 0 && (
            <div className="unposted-notice">
              📝 {validation.unposted_entries_count} unposted journal entries found
            </div>
          )}

          {!validation.can_close && (
            <div className="force-close-option">
              <label>
                <input
                  type="checkbox"
                  checked={forceClose}
                  onChange={(e) => setForceClose(e.target.checked)}
                />
                <span>⚠️ Force Close (Override validation)</span>
              </label>
            </div>
          )}
        </div>
      )}

      {loading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
};
