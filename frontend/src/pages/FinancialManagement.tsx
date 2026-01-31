import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './FinancialManagement.css';

// Import existing components
import FinancialDashboardEnhanced from './FinancialDashboardEnhanced';
import ManualJournalEntry from '../modules/financial/components/ManualJournalEntry';
import JournalEntriesList from '../modules/financial/components/JournalEntriesList';
import JournalEntriesEnhanced from '../modules/financial/components/JournalEntriesEnhanced';
import TrialBalanceEnhanced from '../modules/financial/components/TrialBalanceEnhanced';
import ChartOfAccountsEnhanced from '../modules/financial/components/ChartOfAccountsEnhanced';
import FinancialStatementsHub from '../modules/financial/components/FinancialStatementsHub';
import AccountLedger from '../modules/financial/components/AccountLedger';
import Dimensions from './Dimensions';
import { PeriodManagement } from './PeriodManagement';
import PendingApprovals from '../modules/financial/components/PendingApprovals';
import IncomeStatement from '../modules/financial/components/IncomeStatement';
import BalanceSheet from '../modules/financial/components/BalanceSheet';
import CashFlow from '../modules/financial/components/CashFlow';
import RecurringEntries from '../modules/financial/components/RecurringEntries';
import ImportEntries from '../modules/financial/components/ImportEntries';
import GLExplorer from '../modules/financial/components/GLExplorer';
import AuditTrail from '../modules/financial/components/AuditTrail';
import TaxSettings from '../modules/financial/components/TaxSettings';
import BudgetManagement from '../modules/financial/components/BudgetManagement';
import BudgetVsActual from '../modules/financial/components/BudgetVsActual';
import FinancialForecasting from '../modules/financial/components/FinancialForecasting';
import ReportLibrary from '../modules/financial/components/ReportLibrary';
import ReportDesigner from '../modules/financial/components/ReportDesigner';
import ReportViewer from '../modules/financial/components/ReportViewer';

// Placeholder components for new features (we'll build these)
const FinancialOverview: React.FC = () => <div className="placeholder">📊 Financial Overview - Coming Soon</div>;
const ComparativeAnalysis: React.FC = () => <div className="placeholder">📊 Comparative Analysis - Coming Soon</div>;
const AdjustingEntries: React.FC = () => <div className="placeholder">⚖️ Adjusting Entries - Coming Soon</div>;
const ApprovalWorkflows: React.FC = () => <div className="placeholder">⚙️ Approval Workflows Config - Coming Soon</div>;
const ChangeLog: React.FC = () => <div className="placeholder">📝 Change Log - Coming Soon</div>;
const ComplianceReports: React.FC = () => <div className="placeholder">📊 Compliance Reports - Coming Soon</div>;

const FinancialManagement: React.FC = () => {
  return (
    <div className="financial-management-no-sidebar">
      {/* Main Content - No Sidebar, Just Routes */}
      <main className="financial-content-full">
        <Routes>
          {/* Dashboard Routes */}
          <Route path="/" element={<Navigate to="/financial/dashboard" replace />} />
          <Route path="/dashboard" element={<FinancialDashboardEnhanced />} />
          <Route path="/approvals" element={<PendingApprovals />} />
          <Route path="/metrics" element={<FinancialOverview />} />

          {/* Journal Entry Routes */}
          <Route path="/journal-entries" element={<JournalEntriesEnhanced />} />
          <Route path="/journal-entry/new" element={<ManualJournalEntry />} />
          <Route path="/journal-entry/:id" element={<ManualJournalEntry />} />
          <Route path="/recurring-entries" element={<RecurringEntries />} />
          <Route path="/import-entries" element={<ImportEntries />} />

          {/* Trial Balance Routes */}
          <Route path="/trial-balance" element={<TrialBalanceEnhanced />} />
          <Route path="/comparative-analysis" element={<ComparativeAnalysis />} />
          <Route path="/adjusting-entries" element={<AdjustingEntries />} />

          {/* Financial Statements Routes */}
          <Route path="/statements" element={<FinancialStatementsHub />} />
          <Route path="/income-statement" element={<IncomeStatement />} />
          <Route path="/balance-sheet" element={<BalanceSheet />} />
          <Route path="/cash-flow" element={<CashFlow />} />

          {/* Custom Reports Routes */}
          <Route path="/custom-reports" element={<ReportLibrary />} />
          <Route path="/report-designer" element={<ReportDesigner />} />
          <Route path="/report-designer/:id" element={<ReportDesigner />} />
          <Route path="/report-viewer/:id" element={<ReportViewer />} />

          {/* General Ledger Routes */}
          <Route path="/account-ledger" element={<AccountLedger />} />
          <Route path="/account-ledger/:accountId" element={<AccountLedger />} />
          <Route path="/transactions" element={<JournalEntriesList />} />
          <Route path="/gl-explorer" element={<GLExplorer />} />

          {/* Dimensions Routes */}
          <Route path="/dimensions" element={<Dimensions />} />

          {/* Budgeting & Forecasting Routes */}
          <Route path="/budgets" element={<BudgetManagement />} />
          <Route path="/budget-vs-actual" element={<BudgetVsActual />} />
          <Route path="/forecasting" element={<FinancialForecasting />} />

          {/* Configuration Routes */}
          <Route path="/chart-of-accounts" element={<ChartOfAccountsEnhanced />} />
          <Route path="/periods" element={<PeriodManagement />} />
          <Route path="/approval-workflows" element={<ApprovalWorkflows />} />
          <Route path="/tax-settings" element={<TaxSettings />} />

          {/* Audit & Compliance Routes */}
          <Route path="/audit-trail" element={<AuditTrail />} />
          <Route path="/changelog" element={<ChangeLog />} />
          <Route path="/compliance" element={<ComplianceReports />} />
        </Routes>
      </main>
    </div>
  );
};

export default FinancialManagement;
