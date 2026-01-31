import React, { useState, useEffect } from 'react';
import './GLExplorer.css';

interface Account {
  code: string;
  name: string;
  account_type: string;
}

interface FilterOptions {
  accounts: Account[];
  cost_centers: string[];
  project_codes: string[];
  departments: string[];
  source_types: string[];
  statuses: string[];
}

interface JournalLine {
  id: string;
  line_number: number;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
}

interface JournalEntry {
  id: string;
  journal_number: string;
  journal_date: string;
  description: string;
  source_type: string;
  status: string;
  lines: JournalLine[];
}

interface SearchFilters {
  account_codes: string[];
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
  search_text: string;
  source_types: string[];
  statuses: string[];
  cost_centers: string[];
  posted_only: boolean;
}

const GLExplorer: React.FC = () => {
  const [view, setView] = useState<'search' | 'tree' | 'drill'>('search');
  const [filters, setFilters] = useState<SearchFilters>({
    account_codes: [],
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
    search_text: '',
    source_types: [],
    statuses: [],
    cost_centers: [],
    posted_only: false
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });

  useEffect(() => {
    fetchFilterOptions();
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/financial/gl-explorer/filter-options');
      const result = await response.json();
      if (result.success) {
        setFilterOptions(result.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.account_codes.length > 0) {
        filters.account_codes.forEach(code => params.append('account_codes', code));
      }
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.amount_min) params.append('amount_min', filters.amount_min);
      if (filters.amount_max) params.append('amount_max', filters.amount_max);
      if (filters.search_text) params.append('search_text', filters.search_text);
      if (filters.source_types.length > 0) {
        filters.source_types.forEach(type => params.append('source_types', type));
      }
      if (filters.statuses.length > 0) {
        filters.statuses.forEach(status => params.append('statuses', status));
      }
      if (filters.cost_centers.length > 0) {
        filters.cost_centers.forEach(cc => params.append('cost_centers', cc));
      }
      if (filters.posted_only) params.append('posted_only', 'true');
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/financial/gl-explorer/search?${params}`);
      const result = await response.json();

      if (result.success) {
        setEntries(result.data.entries);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error searching GL:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string | string[] | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      account_codes: [],
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
      search_text: '',
      source_types: [],
      statuses: [],
      cost_centers: [],
      posted_only: false
    });
  };

  const exportToCSV = () => {
    let csv = 'Journal Number,Date,Account Code,Account Name,Description,Debit,Credit,Status\n';
    
    entries.forEach(entry => {
      entry.lines.forEach(line => {
        csv += `"${entry.journal_number}","${entry.journal_date}","${line.account_code}","${line.account_name}","${line.description}",${line.debit_amount},${line.credit_amount},"${entry.status}"\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gl_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'POSTED': return 'status-posted';
      case 'APPROVED': return 'status-approved';
      case 'PENDING_APPROVAL': return 'status-pending';
      case 'DRAFT': return 'status-draft';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-default';
    }
  };

  return (
    <div className="gl-explorer">
      {/* Header */}
      <div className="gle-header">
        <div>
          <h1>GL Explorer</h1>
          <p className="gle-subtitle">Advanced General Ledger search and analysis</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowFilters(!showFilters)} className="btn-toggle-filters">
            {showFilters ? '🔍 Hide Filters' : '🔍 Show Filters'}
          </button>
          <button onClick={exportToCSV} className="btn-export" disabled={entries.length === 0}>
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="view-tabs">
        <button 
          className={`tab ${view === 'search' ? 'active' : ''}`}
          onClick={() => setView('search')}
        >
          🔍 Search & Filter
        </button>
        <button 
          className={`tab ${view === 'tree' ? 'active' : ''}`}
          onClick={() => setView('tree')}
        >
          🌳 Account Tree
        </button>
      </div>

      {/* Search View */}
      {view === 'search' && (
        <div className="search-view">
          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-header">
                <h3>Filters</h3>
                <button onClick={clearFilters} className="btn-clear">Clear All</button>
              </div>

              <div className="filters-grid">
                {/* Text Search */}
                <div className="filter-group full-width">
                  <label>Search Text</label>
                  <input
                    type="text"
                    placeholder="Search description, reference, notes..."
                    value={filters.search_text}
                    onChange={(e) => handleFilterChange('search_text', e.target.value)}
                  />
                </div>

                {/* Date Range */}
                <div className="filter-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>

                {/* Amount Range */}
                <div className="filter-group">
                  <label>Amount Min</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.amount_min}
                    onChange={(e) => handleFilterChange('amount_min', e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label>Amount Max</label>
                  <input
                    type="number"
                    placeholder="999999.99"
                    value={filters.amount_max}
                    onChange={(e) => handleFilterChange('amount_max', e.target.value)}
                  />
                </div>

                {/* Account Selection */}
                <div className="filter-group">
                  <label>Accounts</label>
                  <select
                    multiple
                    value={filters.account_codes}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleFilterChange('account_codes', selected);
                    }}
                    size={5}
                  >
                    {filterOptions?.accounts.map(acc => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Types */}
                <div className="filter-group">
                  <label>Source Type</label>
                  <select
                    multiple
                    value={filters.source_types}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleFilterChange('source_types', selected);
                    }}
                    size={5}
                  >
                    {filterOptions?.source_types.map(type => (
                      <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    multiple
                    value={filters.statuses}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleFilterChange('statuses', selected);
                    }}
                    size={5}
                  >
                    {filterOptions?.statuses.map(status => (
                      <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Cost Centers */}
                <div className="filter-group">
                  <label>Cost Centers</label>
                  <select
                    multiple
                    value={filters.cost_centers}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleFilterChange('cost_centers', selected);
                    }}
                    size={5}
                  >
                    {filterOptions?.cost_centers.map(cc => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>

                {/* Posted Only */}
                <div className="filter-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.posted_only}
                      onChange={(e) => handleFilterChange('posted_only', e.target.checked)}
                    />
                    Posted entries only
                  </label>
                </div>
              </div>

              <div className="filters-actions">
                <button onClick={() => handleSearch(1)} className="btn-search" disabled={loading}>
                  {loading ? 'Searching...' : '🔍 Search'}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="results-section">
            <div className="results-header">
              <h3>Results ({pagination.total} entries found)</h3>
              <div className="results-info">
                Page {pagination.page} of {pagination.total_pages}
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Searching...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No entries found</h3>
                <p>Try adjusting your filters to see results</p>
              </div>
            ) : (
              <>
                <div className="entries-list">
                  {entries.map(entry => (
                    <div key={entry.id} className="entry-card">
                      <div 
                        className="entry-header"
                        onClick={() => toggleEntry(entry.id)}
                      >
                        <div className="entry-main">
                          <span className="journal-number">{entry.journal_number}</span>
                          <span className="journal-date">{formatDate(entry.journal_date)}</span>
                          <span className={`status-badge ${getStatusBadgeClass(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="entry-description">{entry.description}</div>
                        <div className="entry-meta">
                          <span>Source: {entry.source_type.replace(/_/g, ' ')}</span>
                          <span>{entry.lines.length} line{entry.lines.length !== 1 ? 's' : ''}</span>
                          <span className="expand-icon">
                            {expandedEntries.has(entry.id) ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {expandedEntries.has(entry.id) && (
                        <div className="entry-lines">
                          <table>
                            <thead>
                              <tr>
                                <th>Line</th>
                                <th>Account</th>
                                <th>Description</th>
                                <th className="amount-col">Debit</th>
                                <th className="amount-col">Credit</th>
                                <th>Dimensions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map(line => (
                                <tr key={line.id}>
                                  <td>{line.line_number}</td>
                                  <td>
                                    <div className="account-cell">
                                      <div className="account-code">{line.account_code}</div>
                                      <div className="account-name">{line.account_name}</div>
                                    </div>
                                  </td>
                                  <td>{line.description}</td>
                                  <td className="amount-col debit">
                                    {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                                  </td>
                                  <td className="amount-col credit">
                                    {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                                  </td>
                                  <td className="dimensions-cell">
                                    {line.cost_center && <span className="dim-badge">CC: {line.cost_center}</span>}
                                    {line.project_code && <span className="dim-badge">Proj: {line.project_code}</span>}
                                    {line.department && <span className="dim-badge">Dept: {line.department}</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => handleSearch(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn-page"
                    >
                      ← Previous
                    </button>
                    <span className="page-info">
                      Page {pagination.page} of {pagination.total_pages}
                    </span>
                    <button 
                      onClick={() => handleSearch(pagination.page + 1)}
                      disabled={pagination.page === pagination.total_pages}
                      className="btn-page"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Account Tree View */}
      {view === 'tree' && (
        <div className="tree-view">
          <div className="coming-soon">
            <div className="coming-icon">🌳</div>
            <h3>Account Tree View</h3>
            <p>Hierarchical account navigation coming soon!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GLExplorer;
