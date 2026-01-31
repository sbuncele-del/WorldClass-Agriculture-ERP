import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../../components/layout/EnterpriseLayout';
import DataTable from '../../../components/ui/DataTable';
import { FileText, Plus, Repeat, Upload, FileSpreadsheet, Clock, CheckCircle, Send, RotateCcw, BarChart3, Search, History } from 'lucide-react';
import type { SecondaryNavSection } from '../../../components/layout/SecondaryNav';
import './JournalEntriesEnhanced.css';

interface JournalEntry {
  id: string;
  journal_number: string;
  entry_date: string;
  description: string;
  status: string;
  debit_total: number;
  credit_total: number;
  created_by: string;
  created_at: string;
}

const JournalEntriesEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 156,
    pending: 8,
    approved: 89,
    posted: 56,
    recurring: 12
  });

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financial/journal-entries');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setEntries(result.data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Draft', className: 'dt-badge dt-badge-info' },
      PENDING_APPROVAL: { label: 'Pending', className: 'dt-badge dt-badge-warning' },
      APPROVED: { label: 'Approved', className: 'dt-badge dt-badge-success' },
      POSTED: { label: 'Posted', className: 'dt-badge dt-badge-success' },
      REJECTED: { label: 'Rejected', className: 'dt-badge dt-badge-error' },
      REVERSED: { label: 'Reversed', className: 'dt-badge dt-badge-error' }
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return <span className={config.className}>{config.label}</span>;
  };

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

  const secondaryNavSections: SecondaryNavSection[] = [
    {
      title: 'Journal Management',
      items: [
        {
          id: 'all',
          label: 'All Entries',
          path: '/financial/journal-entries',
          icon: <FileText size={16} />,
          badge: stats.total
        },
        {
          id: 'new',
          label: 'New Entry',
          path: '/financial/journal-entry/new',
          icon: <Plus size={16} />
        },
        {
          id: 'recurring',
          label: 'Recurring Entries',
          path: '/financial/recurring-entries',
          icon: <Repeat size={16} />,
          badge: stats.recurring
        },
        {
          id: 'import',
          label: 'Import Entries',
          path: '/financial/import-entries',
          icon: <Upload size={16} />
        },
        {
          id: 'templates',
          label: 'Entry Templates',
          path: '/financial/entry-templates',
          icon: <FileSpreadsheet size={16} />
        }
      ]
    },
    {
      title: 'Approval Process',
      items: [
        {
          id: 'pending',
          label: 'Pending Approval',
          path: '/financial/approvals',
          icon: <Clock size={16} />,
          badge: stats.pending
        },
        {
          id: 'approved',
          label: 'Approved',
          path: '/financial/journal-entries?status=approved',
          icon: <CheckCircle size={16} />
        },
        {
          id: 'posted',
          label: 'Posted',
          path: '/financial/journal-entries?status=posted',
          icon: <Send size={16} />
        },
        {
          id: 'reversed',
          label: 'Reversed',
          path: '/financial/journal-entries?status=reversed',
          icon: <RotateCcw size={16} />
        }
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        {
          id: 'report',
          label: 'Journal Report',
          path: '/financial/journal-report',
          icon: <BarChart3 size={16} />
        },
        {
          id: 'audit',
          label: 'Audit Trail',
          path: '/financial/audit-trail',
          icon: <Search size={16} />
        },
        {
          id: 'stats',
          label: 'Entry Statistics',
          path: '/financial/journal-statistics',
          icon: <History size={16} />
        }
      ]
    }
  ];

  const columns = [
    {
      key: 'journal_number',
      label: 'Journal #',
      render: (value: string) => (
        <span className="je-journal-number">{value}</span>
      )
    },
    {
      key: 'entry_date',
      label: 'Date',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'description',
      label: 'Description'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'debit_total',
      label: 'Debit Total',
      align: 'right' as const,
      render: (value: number) => (
        <span className="je-amount">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'credit_total',
      label: 'Credit Total',
      align: 'right' as const,
      render: (value: number) => (
        <span className="je-amount">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'created_by',
      label: 'Created By'
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string) => (
        <button
          className="je-btn-view"
          onClick={() => navigate(`/financial/journal-entry/${value}`)}
        >
          View
        </button>
      )
    }
  ];

  return (
    <EnterpriseLayout
      moduleTitle="Journal Entries"
      moduleSubtitle="Create, manage, and approve journal entries"
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Financial', path: '/financial/dashboard' },
        { label: 'Journal Entries' }
      ]}
      tabs={financialTabs}
      actionButtons={[
        {
          label: 'Import',
          icon: <Upload size={18} />,
          variant: 'secondary',
          onClick: () => navigate('/financial/import-entries')
        },
        {
          label: 'Templates',
          icon: <FileSpreadsheet size={18} />,
          variant: 'secondary',
          onClick: () => navigate('/financial/entry-templates')
        },
        {
          label: 'New Journal Entry',
          icon: <Plus size={18} />,
          variant: 'primary',
          onClick: () => navigate('/financial/journal-entry/new')
        }
      ]}
      secondaryNav={secondaryNavSections}
    >
      <div className="je-content">
        {loading ? (
          <div className="je-loading">Loading journal entries...</div>
        ) : (
          <DataTable
            title="All Journal Entries"
            subtitle={`${entries.length} entries`}
            columns={columns}
            data={entries}
            emptyMessage="No journal entries found."
            maxHeight="calc(100vh - 400px)"
          />
        )}
      </div>
    </EnterpriseLayout>
  );
};

export default JournalEntriesEnhanced;
