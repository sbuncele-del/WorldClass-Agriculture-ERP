/**
 * Cash Dashboard Component
 * 
 * Overview of all bank accounts, balances, and reconciliation status
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api.service';
import './CashDashboard.css';

const API_BASE = `${API_BASE_URL}/api/cash-management`;

interface BankAccount {
  id: number;
  bank_code: string;
  bank_name?: string;
  account_number: string;
  account_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  last_reconciled_balance: number;
  last_reconciled_date: string | null;
  is_active: boolean;
  is_primary: boolean;
}

interface DashboardSummary {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  totalUnreconciledStatements: number;
  totalUnmatchedLines: number;
  accountsNeedingReconciliation: number;
}

interface Props {
  onNavigateToStatements?: () => void;
  onNavigateToReconcile?: (accountId: number) => void;
}

const CashDashboard: React.FC<Props> = ({ onNavigateToStatements, onNavigateToReconcile }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load bank accounts
      const accountsResponse = await fetch(`${API_BASE}/bank-accounts`);
      const accountsData = await accountsResponse.json();

      if (accountsData.success) {
        setAccounts(accountsData.data);
      }

      // Load summary
      const summaryResponse = await fetch(`${API_BASE}/summary`);
      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysSinceReconciliation = (lastReconciledDate: string | null): number | null => {
    if (!lastReconciledDate) return null;
    const last = new Date(lastReconciledDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getReconciliationStatus = (days: number | null): 'good' | 'warning' | 'danger' | 'never' => {
    if (days === null) return 'never';
    if (days <= 7) return 'good';
    if (days <= 30) return 'warning';
    return 'danger';
  };

  const getVariance = (current: number, reconciled: number): number => {
    return current - reconciled;
  };

  const formatCurrency = (amount: number): string => {
    return `R ${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.is_active ? acc.current_balance : 0), 0);
  const primaryAccount = accounts.find(acc => acc.is_primary);

  if (loading) {
    return (
      <div className="cash-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cash-dashboard">
        <div className="error-state">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cash-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Cash Position Dashboard</h2>
          <p>Real-time overview of all bank accounts and reconciliation status</p>
        </div>
        <button onClick={onNavigateToStatements} className="btn-primary">
          + Import Statement
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card card-primary">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-value">{formatCurrency(totalBalance)}</div>
              <div className="card-label">Total Cash Balance</div>
            </div>
          </div>

          <div className="summary-card card-success">
            <div className="card-icon">🏦</div>
            <div className="card-content">
              <div className="card-value">{summary.activeAccounts}/{summary.totalAccounts}</div>
              <div className="card-label">Active Accounts</div>
            </div>
          </div>

          <div className="summary-card card-warning">
            <div className="card-icon">⏳</div>
            <div className="card-content">
              <div className="card-value">{summary.accountsNeedingReconciliation}</div>
              <div className="card-label">Need Reconciliation</div>
            </div>
          </div>

          <div className="summary-card card-info">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <div className="card-value">{summary.totalUnmatchedLines}</div>
              <div className="card-label">Unmatched Lines</div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Account Highlight */}
      {primaryAccount && (
        <div className="primary-account-section">
          <div className="section-header">
            <h3>⭐ Primary Account</h3>
          </div>
          <div className="primary-account-card">
            <div className="account-header">
              <div className="account-bank">
                <div className="bank-logo">{primaryAccount.bank_name?.[0] || '🏦'}</div>
                <div className="account-info">
                  <div className="account-name">{primaryAccount.account_name}</div>
                  <div className="account-details">
                    {primaryAccount.bank_name} • {primaryAccount.account_number} • {primaryAccount.account_type}
                  </div>
                </div>
              </div>
              <div className="account-balance-large">
                <div className="balance-label">Current Balance</div>
                <div className="balance-amount">{formatCurrency(primaryAccount.current_balance)}</div>
              </div>
            </div>

            <div className="account-stats">
              <div className="stat-item">
                <div className="stat-label">Last Reconciled</div>
                <div className="stat-value">
                  {primaryAccount.last_reconciled_date
                    ? new Date(primaryAccount.last_reconciled_date).toLocaleDateString('en-ZA')
                    : 'Never'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Reconciled Balance</div>
                <div className="stat-value">{formatCurrency(primaryAccount.last_reconciled_balance)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Variance</div>
                <div className={`stat-value ${getVariance(primaryAccount.current_balance, primaryAccount.last_reconciled_balance) !== 0 ? 'variance' : ''}`}>
                  {formatCurrency(getVariance(primaryAccount.current_balance, primaryAccount.last_reconciled_balance))}
                </div>
              </div>
            </div>

            <div className="account-actions">
              <button onClick={onNavigateToStatements} className="btn-action btn-import">
                📤 Import Statement
              </button>
              <button
                onClick={() => onNavigateToReconcile && onNavigateToReconcile(primaryAccount.id)}
                className="btn-action btn-reconcile"
              >
                ✓ Reconcile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Accounts */}
      <div className="all-accounts-section">
        <div className="section-header">
          <h3>🏦 All Bank Accounts</h3>
          <div className="section-info">
            {accounts.length} total • {accounts.filter(a => a.is_active).length} active
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <h3>No Bank Accounts Yet</h3>
            <p>Create your first bank account to start managing cash flow</p>
            <button onClick={onNavigateToStatements} className="btn-primary">
              + Create Bank Account
            </button>
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map(account => {
              const daysSince = getDaysSinceReconciliation(account.last_reconciled_date);
              const status = getReconciliationStatus(daysSince);
              const variance = getVariance(account.current_balance, account.last_reconciled_balance);

              return (
                <div
                  key={account.id}
                  className={`account-card ${!account.is_active ? 'inactive' : ''} ${account.is_primary ? 'is-primary' : ''}`}
                >
                  <div className="account-card-header">
                    <div className="account-bank-info">
                      <div className="bank-badge">{account.bank_name || account.bank_code}</div>
                      {account.is_primary && <div className="primary-badge">Primary</div>}
                    </div>
                    <div className={`reconciliation-status status-${status}`}>
                      {status === 'never' && '❌ Never'}
                      {status === 'good' && '✓ Current'}
                      {status === 'warning' && '⚠️ Overdue'}
                      {status === 'danger' && '🚨 Critical'}
                    </div>
                  </div>

                  <div className="account-name">{account.account_name}</div>
                  <div className="account-number">{account.account_number}</div>
                  <div className="account-type">{account.account_type}</div>

                  <div className="account-balance-section">
                    <div className="balance-row">
                      <span className="balance-label">Current Balance:</span>
                      <span className="balance-value">{formatCurrency(account.current_balance)}</span>
                    </div>
                    <div className="balance-row">
                      <span className="balance-label">Last Reconciled:</span>
                      <span className="balance-value">{formatCurrency(account.last_reconciled_balance)}</span>
                    </div>
                    {variance !== 0 && (
                      <div className="balance-row variance-row">
                        <span className="balance-label">Variance:</span>
                        <span className={`balance-value ${variance > 0 ? 'positive' : 'negative'}`}>
                          {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="account-reconciliation-info">
                    {daysSince !== null ? (
                      <>
                        <span className="info-label">Last reconciled:</span>
                        <span className={`info-value days-${status}`}>
                          {daysSince === 0 ? 'Today' : `${daysSince} day${daysSince > 1 ? 's' : ''} ago`}
                        </span>
                      </>
                    ) : (
                      <span className="info-value never">Never reconciled</span>
                    )}
                  </div>

                  {account.is_active && (
                    <div className="account-card-actions">
                      <button
                        onClick={onNavigateToStatements}
                        className="btn-small btn-import"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => onNavigateToReconcile && onNavigateToReconcile(account.id)}
                        className="btn-small btn-reconcile"
                      >
                        Reconcile
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="dashboard-footer">
        <div className="footer-stat">
          <span className="footer-label">Total Accounts:</span>
          <span className="footer-value">{accounts.length}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">Active:</span>
          <span className="footer-value">{accounts.filter(a => a.is_active).length}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">Total Balance:</span>
          <span className="footer-value">{formatCurrency(totalBalance)}</span>
        </div>
        <div className="footer-stat">
          <span className="footer-label">Need Reconciliation:</span>
          <span className="footer-value warning">
            {accounts.filter(a => {
              const days = getDaysSinceReconciliation(a.last_reconciled_date);
              return a.is_active && (days === null || days > 7);
            }).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashDashboard;
