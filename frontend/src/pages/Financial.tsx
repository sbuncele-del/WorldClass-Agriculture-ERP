import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ManualJournalEntry from '../modules/financial/components/ManualJournalEntry';
import JournalEntriesList from '../modules/financial/components/JournalEntriesList';
import TrialBalance from '../modules/financial/components/TrialBalance';
import AccountLedger from '../modules/financial/components/AccountLedger';
import ChartOfAccounts from '../modules/financial/components/ChartOfAccounts';
import Dimensions from './Dimensions';
import { PeriodManagement } from './PeriodManagement';
import FinancialDashboard from './FinancialDashboard';
import PendingApprovals from '../modules/financial/components/PendingApprovals';

const Financial: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>💰 Financial Management</h1>
      
      {/* Quick Navigation */}
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '1rem',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        <Link to="/financial/dashboard" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          📊 Dashboard
        </Link>
        <Link to="/financial/approvals" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          📋 Approvals
        </Link>
        <Link to="/financial/journal-entries" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          � Journal Entries
        </Link>
        <Link to="/financial/journal-entry/new" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          ➕ New Entry
        </Link>
        <Link to="/financial/trial-balance" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          ⚖️ Trial Balance
        </Link>
        <Link to="/financial/dimensions" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          📐 Dimensions
        </Link>
        <Link to="/financial/periods" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          📅 Periods
        </Link>
        <Link to="/financial/chart-of-accounts" style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 500 }}>
          📖 Chart of Accounts
        </Link>
      </div>

      {/* Financial Module Routes */}
            {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/financial/dashboard" replace />} />
        <Route path="/dashboard" element={<FinancialDashboard />} />
        <Route path="/approvals" element={<PendingApprovals />} />
        <Route path="/journal-entries" element={<JournalEntriesList />} />
        <Route path="/journal-entry/new" element={<ManualJournalEntry />} />
        <Route path="/journal-entry/:id" element={<ManualJournalEntry />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/trial-balance" element={<TrialBalance />} />
        <Route path="/account-ledger/:accountId" element={<AccountLedger />} />
        <Route path="/dimensions" element={<Dimensions />} />
        <Route path="/periods" element={<PeriodManagement />} />
      </Routes>
    </div>
  );
};

export default Financial;
