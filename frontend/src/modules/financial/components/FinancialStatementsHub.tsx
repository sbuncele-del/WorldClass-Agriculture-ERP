import React from 'react';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../../components/layout/EnterpriseLayout';
import GlassCard from '../../../components/ui/GlassCard';
import { FileText, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import type { SecondaryNavSection } from '../../../components/layout/SecondaryNav';
import './FinancialStatementsHub.css';

const FinancialStatementsHub: React.FC = () => {
  const navigate = useNavigate();

  const financialTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/financial/dashboard' },
    { id: 'journal', label: 'Journal Entries', path: '/financial/journal-entries' },
    { id: 'trial-balance', label: 'Trial Balance', path: '/financial/trial-balance' },
    { id: 'chart', label: 'Chart of Accounts', path: '/financial/chart-of-accounts' },
    { id: 'statements', label: 'Financial Statements', path: '/financial/statements' },
    { id: 'periods', label: 'Periods & Closing', path: '/financial/periods' },
    { id: 'dimensions', label: 'Dimensions', path: '/financial/dimensions' },
    { id: 'approvals', label: 'Approval Workflows', path: '/financial/approvals' }
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Core Statements',
      items: [
        { id: 'income', label: 'Income Statement', path: '/financial/income-statement', icon: <TrendingUp size={16} /> },
        { id: 'balance', label: 'Balance Sheet', path: '/financial/balance-sheet', icon: <FileText size={16} /> },
        { id: 'cashflow', label: 'Cash Flow', path: '/financial/cash-flow', icon: <DollarSign size={16} /> }
      ]
    },
    {
      title: 'Period Selection',
      items: [
        { id: 'current', label: 'Current Period', path: '/financial/statements?period=current', icon: <Calendar size={16} /> },
        { id: 'ytd', label: 'Year to Date', path: '/financial/statements?period=ytd', icon: <Calendar size={16} /> },
        { id: 'custom', label: 'Custom Period', path: '/financial/statements?period=custom', icon: <Calendar size={16} /> }
      ]
    }
  ];

  const statements = [
    {
      title: 'Income Statement',
      description: 'Revenue, expenses, and net income for the period',
      icon: <TrendingUp size={40} />,
      path: '/financial/income-statement',
      color: '#10b981'
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, liabilities, and equity at a point in time',
      icon: <FileText size={40} />,
      path: '/financial/balance-sheet',
      color: '#3b82f6'
    },
    {
      title: 'Cash Flow Statement',
      description: 'Operating, investing, and financing cash flows',
      icon: <DollarSign size={40} />,
      path: '/financial/cash-flow',
      color: '#8b5cf6'
    }
  ];

  return (
    <EnterpriseLayout
      moduleTitle="Financial Statements"
      moduleSubtitle="View and analyze your financial reports"
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Financial', path: '/financial/dashboard' },
        { label: 'Financial Statements' }
      ]}
      tabs={financialTabs}
      secondaryNav={secondaryNav}
    >
      <div className="fsh-grid">
        {statements.map((statement, index) => (
          <GlassCard
            key={index}
            padding="lg"
            hoverable
            onClick={() => navigate(statement.path)}
            className="fsh-card"
          >
            <div className="fsh-card-icon" style={{ color: statement.color }}>
              {statement.icon}
            </div>
            <h3 className="fsh-card-title">{statement.title}</h3>
            <p className="fsh-card-description">{statement.description}</p>
            <button className="fsh-card-btn">View Statement →</button>
          </GlassCard>
        ))}
      </div>
    </EnterpriseLayout>
  );
};

export default FinancialStatementsHub;
