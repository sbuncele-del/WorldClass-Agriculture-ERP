import React, { useState, useEffect } from 'react';
import { cashManagementApi } from '../../services/cash-management-api.service';
import type { BankAccount, BankStatement } from '../../types/cash-management.types';
import '../../styles/erp-ui.css';

const BankAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [statements, setStatements] = useState<Map<number, BankStatement[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await cashManagementApi.getBankAccounts();
      
      // Handle API response structure: { success, data, count }
      const accountsData = response?.data || [];
      setAccounts(accountsData);
      
      // Show message if no data
      if (accountsData.length === 0) {
        console.log('No bank accounts found. Please create bank accounts first.');
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      // Show error state but don't block the UI
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async (accountId: number) => {
    try {
      const statementsData = await cashManagementApi.getStatements({ bankAccountId: accountId });
      setStatements(prev => new Map(prev).set(accountId, statementsData));
      
      // Mock data for demonstration
      if (statementsData.length === 0) {
        setStatements(prev => new Map(prev).set(accountId, [
          {
            id: 1,
            bank_account_id: accountId,
            statement_date: '2025-10-31',
            opening_balance: 2650000.00,
            closing_balance: 2847320.50,
            total_debits: 850430.25,
            total_credits: 1047750.75,
            line_count: 156,
            matched_count: 89,
            unmatched_count: 67,
            status: 'ACTIVE'
          },
          {
            id: 2,
            bank_account_id: accountId,
            statement_date: '2025-09-30',
            opening_balance: 2450000.00,
            closing_balance: 2650000.00,
            total_debits: 720000.00,
            total_credits: 920000.00,
            line_count: 142,
            matched_count: 142,
            unmatched_count: 0,
            status: 'RECONCILED'
          }
        ]));
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      setStatements(prev => new Map(prev).set(accountId, []));
    }
  };

  const formatCurrency = (value: number, currency: string = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value);
  };

  const toggleAccountDetails = (accountId: number) => {
    if (selectedAccount === accountId) {
      setSelectedAccount(null);
    } else {
      setSelectedAccount(accountId);
      if (!statements.has(accountId)) {
        fetchStatements(accountId);
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading bank accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🏦 Bank Accounts</h1>
          <p className="dashboard-subtitle">Manage bank accounts and view statements</p>
        </div>
        <button className="action-button primary">+ Add Bank Account</button>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">Total Balance (ZAR)</span>
            <span className="metric-icon">💰</span>
          </div>
          <div className="metric-value">
            {formatCurrency(accounts.filter(a => a.currency === 'ZAR').reduce((sum, a) => sum + a.current_balance, 0))}
          </div>
          <div className="metric-footer">
            <span className="metric-change">Across {accounts.filter(a => a.currency === 'ZAR').length} accounts</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="metric-header">
            <span className="metric-label">Foreign Currency</span>
            <span className="metric-icon">🌍</span>
          </div>
          <div className="metric-value">
            {accounts.filter(a => a.currency !== 'ZAR').length}
          </div>
          <div className="metric-footer">
            <span className="metric-change">USD, EUR, GBP</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="metric-header">
            <span className="metric-label">Active Accounts</span>
            <span className="metric-icon">✅</span>
          </div>
          <div className="metric-value">{accounts.filter(a => a.is_active).length}</div>
          <div className="metric-footer">
            <span className="metric-change">of {accounts.length} total</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">Unreconciled</span>
            <span className="metric-icon">⚠️</span>
          </div>
          <div className="metric-value">2</div>
          <div className="metric-footer">
            <span className="metric-change warning">Statements need attention</span>
          </div>
        </div>
      </div>

      {/* Bank Accounts List */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Bank Accounts</h2>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {accounts.map((account) => (
              <div key={account.id}>
                <div
                  className="account-card"
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => toggleAccountDetails(account.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {account.account_name}
                      </h3>
                      <div style={{ display: 'flex', gap: '2rem', color: '#64748b', fontSize: '0.875rem' }}>
                        <div>
                          <strong>Bank:</strong> {account.bank_name}
                        </div>
                        <div>
                          <strong>Account:</strong> {account.account_number}
                        </div>
                        <div>
                          <strong>Type:</strong> {account.account_type}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {formatCurrency(account.current_balance, account.currency)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Current Balance
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statements Section (Collapsible) */}
                {selectedAccount === account.id && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1.5rem',
                      background: '#f8fafc',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recent Statements</h4>
                    {statements.get(account.id)?.length === 0 ? (
                      <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
                        No statements found
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {statements.get(account.id)?.map((statement) => (
                          <div
                            key={statement.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1rem',
                              background: 'white',
                              borderRadius: '0.375rem',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {new Date(statement.statement_date).toLocaleDateString('en-ZA', {
                                  year: 'numeric',
                                  month: 'long'
                                })}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                {statement.line_count} transactions • {statement.matched_count} matched • {statement.unmatched_count} unmatched
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                                <div style={{ color: '#64748b' }}>Closing Balance</div>
                                <div style={{ fontWeight: 600 }}>
                                  {formatCurrency(statement.closing_balance, account.currency)}
                                </div>
                              </div>
                              <span
                                className="status-badge"
                                style={{
                                  backgroundColor: statement.status === 'RECONCILED' ? '#10b98120' : '#f59e0b20',
                                  color: statement.status === 'RECONCILED' ? '#10b981' : '#f59e0b',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                {statement.status}
                              </span>
                              <button className="action-button">
                                Reconcile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountsPage;
