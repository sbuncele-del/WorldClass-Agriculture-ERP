import React, { useState } from 'react';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import GlassCard from '../components/ui/GlassCard';
import DataTable from '../components/ui/DataTable';
import './BankingDashboard.css';

const BankingDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Banking & Cash', href: '/banking' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'statements', label: 'Bank Statements' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'payments', label: 'Payments' },
    { id: 'receipts', label: 'Receipts' }
  ];

  const headerActions = (
    <>
      <button className="btn-secondary">
        <span>📄</span> Export Report
      </button>
      <button className="btn-primary">
        <span>⬆️</span> Import Bank Statement
      </button>
    </>
  );

  // Sample data
  const accounts = [
    { id: 1, name: 'FNB Current Account', number: '****1234', balance: 125450.00, status: 'active' },
    { id: 2, name: 'Standard Bank Savings', number: '****5678', balance: 45200.00, status: 'active' },
    { id: 3, name: 'Nedbank Business', number: '****9012', balance: 89300.00, status: 'active' }
  ];

  const recentTransactions = [
    { id: 1, date: '2025-11-07', description: 'Payment from Client A', amount: 15000.00, type: 'credit', status: 'cleared' },
    { id: 2, date: '2025-11-07', description: 'Supplier Payment - ABC Ltd', amount: -5200.00, type: 'debit', status: 'cleared' },
    { id: 3, date: '2025-11-06', description: 'Salary Payment - November', amount: -45000.00, type: 'debit', status: 'cleared' },
    { id: 4, date: '2025-11-06', description: 'Payment from Client B', amount: 22500.00, type: 'credit', status: 'pending' }
  ];

  const transactionColumns = [
    { key: 'date', label: 'DATE' },
    { key: 'description', label: 'DESCRIPTION' },
    { key: 'amount', label: 'AMOUNT', align: 'right' as const },
    { key: 'type', label: 'TYPE' },
    { key: 'status', label: 'STATUS' },
    { key: 'actions', label: 'ACTIONS' }
  ];

  const transactionData = recentTransactions.map(txn => ({
    date: new Date(txn.date).toLocaleDateString('en-ZA'),
    description: txn.description,
    amount: (
      <span className={txn.type === 'credit' ? 'amount-credit' : 'amount-debit'}>
        R {Math.abs(txn.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    ),
    type: (
      <span className={`badge badge-${txn.type}`}>
        {txn.type === 'credit' ? '↓ Credit' : '↑ Debit'}
      </span>
    ),
    status: (
      <span className={`badge badge-${txn.status}`}>
        {txn.status}
      </span>
    ),
    actions: (
      <button className="btn-sm btn-secondary">View</button>
    )
  }));

  return (
    <EnterpriseLayout
      title="Banking & Cash Management"
      subtitle="Import, reconcile, and manage bank transactions"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      selectedTab={selectedTab}
      onTabChange={setSelectedTab}
      actions={headerActions}
    >
      <div className="banking-dashboard">
        {/* Bank Accounts Overview */}
        <div className="accounts-grid">
          {accounts.map(account => (
            <GlassCard key={account.id} className="account-card">
              <div className="account-header">
                <div className="account-info">
                  <h3>{account.name}</h3>
                  <span className="account-number">{account.number}</span>
                </div>
                <span className={`status-badge status-${account.status}`}>
                  {account.status}
                </span>
              </div>
              <div className="account-balance">
                <span className="balance-label">Current Balance</span>
                <span className="balance-amount">
                  R {account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="account-actions">
                <button className="btn-sm btn-secondary">View Transactions</button>
                <button className="btn-sm btn-secondary">Reconcile</button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <GlassCard className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <div className="summary-label">Total Cash</div>
              <div className="summary-value">R 259,950.00</div>
              <div className="summary-change positive">+5.2% this month</div>
            </div>
          </GlassCard>

          <GlassCard className="summary-card">
            <div className="summary-icon">📥</div>
            <div className="summary-content">
              <div className="summary-label">Receipts (MTD)</div>
              <div className="summary-value">R 125,000.00</div>
              <div className="summary-change">15 transactions</div>
            </div>
          </GlassCard>

          <GlassCard className="summary-card">
            <div className="summary-icon">📤</div>
            <div className="summary-content">
              <div className="summary-label">Payments (MTD)</div>
              <div className="summary-value">R 85,300.00</div>
              <div className="summary-change">28 transactions</div>
            </div>
          </GlassCard>

          <GlassCard className="summary-card">
            <div className="summary-icon">🔄</div>
            <div className="summary-content">
              <div className="summary-label">Unreconciled</div>
              <div className="summary-value">12</div>
              <div className="summary-change warning">Needs attention</div>
            </div>
          </GlassCard>
        </div>

        {/* Recent Transactions Table */}
        <GlassCard>
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <div className="card-actions">
              <button className="btn-sm btn-secondary">Filter</button>
              <button className="btn-sm btn-secondary">Export</button>
            </div>
          </div>
          <DataTable
            columns={transactionColumns}
            data={transactionData}
          />
        </GlassCard>

        {/* Quick Actions */}
        <div className="quick-actions">
          <GlassCard className="action-card">
            <div className="action-icon">⬆️</div>
            <h4>Import Bank Statement</h4>
            <p>Upload CSV, OFX, or MT940 files from your bank</p>
            <button className="btn-primary btn-block">Import Statement</button>
          </GlassCard>

          <GlassCard className="action-card">
            <div className="action-icon">🔄</div>
            <h4>Reconcile Account</h4>
            <p>Match bank transactions with journal entries</p>
            <button className="btn-secondary btn-block">Start Reconciliation</button>
          </GlassCard>

          <GlassCard className="action-card">
            <div className="action-icon">📊</div>
            <h4>Cash Flow Report</h4>
            <p>View cash flow analysis and projections</p>
            <button className="btn-secondary btn-block">View Report</button>
          </GlassCard>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default BankingDashboard;
