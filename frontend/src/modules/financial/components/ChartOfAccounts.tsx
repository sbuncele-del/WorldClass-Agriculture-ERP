import React, { useState, useEffect } from 'react';
import '../styles/ChartOfAccounts.css';

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  level: number;
  parent_account_id: string | null;
  parent_code: string | null;
  is_header: boolean;
  normal_balance: string;
  current_debit_balance: number;
  current_credit_balance: number;
  is_active: boolean;
  created_at: string;
}

interface COATemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  account_count: number;
  suitable_for: string[];
  compliance: string[];
}

const ChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<COATemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<COATemplate | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/financial/chart-of-accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const result = await response.json();
      setAccounts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/financial/coa-templates');
      if (!response.ok) return;
      const result = await response.json();
      setTemplates(result.data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!confirm('⚠️ WARNING: This will replace your entire Chart of Accounts. This cannot be undone. Continue?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/financial/coa-templates/${templateId}/apply`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to apply template');
      
      alert('✅ Template applied successfully!');
      setShowTemplateModal(false);
      fetchAccounts();
    } catch (err) {
      alert('Error applying template: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleViewLedger = (code: string) => {
    window.location.href = `/financial/account-ledger/${code}`;
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' || account.account_type === filterType;
    const matchesActive = showInactive || account.is_active;
    
    return matchesSearch && matchesType && matchesActive;
  });

  // Organize accounts by hierarchy
  const buildHierarchy = (accounts: Account[]) => {
    const accountMap = new Map<string, Account & { children: Account[] }>();
    const rootAccounts: (Account & { children: Account[] })[] = [];

    // Create map of all accounts with children array
    accounts.forEach(account => {
      accountMap.set(account.code, { ...account, children: [] });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const node = accountMap.get(account.code)!;
      if (account.parent_code) {
        const parent = accountMap.get(account.parent_code);
        if (parent) {
          parent.children.push(node);
        } else {
          rootAccounts.push(node);
        }
      } else {
        rootAccounts.push(node);
      }
    });

    return rootAccounts;
  };

  const hierarchy = buildHierarchy(filteredAccounts);

  const renderAccountRow = (account: Account & { children: Account[] }, depth = 0) => {
    const balance = account.current_debit_balance - account.current_credit_balance;
    const isDebit = account.normal_balance === 'DEBIT';
    const displayBalance = isDebit ? balance : -balance;

    return (
      <React.Fragment key={account.code}>
        <tr 
          className={`account-row level-${account.level} ${account.is_header ? 'header-account' : ''} ${!account.is_active ? 'inactive' : ''}`}
          onClick={() => !account.is_header && handleViewLedger(account.code)}
          style={{ cursor: account.is_header ? 'default' : 'pointer' }}
        >
          <td className="col-code" style={{ paddingLeft: `${depth * 20 + 10}px` }}>
            {account.is_header && <span className="tree-icon">📁</span>}
            {!account.is_header && <span className="tree-icon">📄</span>}
            <code>{account.code}</code>
          </td>
          <td className="col-name">
            {account.name}
            {!account.is_active && <span className="badge-inactive">Inactive</span>}
          </td>
          <td className="col-type">
            <span className={`badge badge-${account.account_type.toLowerCase()}`}>
              {account.account_type}
            </span>
          </td>
          <td className="col-balance">
            {account.is_header ? (
              <span className="no-balance">—</span>
            ) : (
              <span className={displayBalance < 0 ? 'negative' : 'positive'}>
                R {Math.abs(displayBalance).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="balance-type"> {isDebit ? 'DR' : 'CR'}</span>
              </span>
            )}
          </td>
        </tr>
        {account.children.map(child => renderAccountRow(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="coa-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coa-container">
      {/* Header */}
      <div className="coa-header">
        <div className="header-top">
          <h1>📖 Chart of Accounts</h1>
          <div className="header-actions">
            <button onClick={() => setShowTemplateModal(true)} className="btn-template">
              📋 Templates
            </button>
            <button className="btn-export">📗 Excel</button>
            <button className="btn-export">📕 PDF</button>
          </div>
        </div>

        {/* Stats */}
        <div className="coa-stats">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Total Accounts</div>
              <div className="stat-value">{accounts.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Active</div>
              <div className="stat-value">{accounts.filter(a => a.is_active).length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-label">Header Accounts</div>
              <div className="stat-value">{accounts.filter(a => a.is_header).length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-label">Detail Accounts</div>
              <div className="stat-value">{accounts.filter(a => !a.is_header).length}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="coa-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-pills">
            <button
              className={`pill ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All
            </button>
            <button
              className={`pill ${filterType === 'ASSET' ? 'active' : ''}`}
              onClick={() => setFilterType('ASSET')}
            >
              Assets
            </button>
            <button
              className={`pill ${filterType === 'LIABILITY' ? 'active' : ''}`}
              onClick={() => setFilterType('LIABILITY')}
            >
              Liabilities
            </button>
            <button
              className={`pill ${filterType === 'EQUITY' ? 'active' : ''}`}
              onClick={() => setFilterType('EQUITY')}
            >
              Equity
            </button>
            <button
              className={`pill ${filterType === 'REVENUE' ? 'active' : ''}`}
              onClick={() => setFilterType('REVENUE')}
            >
              Revenue
            </button>
            <button
              className={`pill ${filterType === 'EXPENSE' ? 'active' : ''}`}
              onClick={() => setFilterType('EXPENSE')}
            >
              Expenses
            </button>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show Inactive
          </label>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="coa-table-container">
        {error ? (
          <div className="error-message">
            <h3>⚠️ Error Loading Chart of Accounts</h3>
            <p>{error}</p>
            <button onClick={fetchAccounts} className="btn-retry">Retry</button>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <h3>📭 No Accounts Found</h3>
            <p>Try adjusting your filters or click "Templates" to load a pre-configured Chart of Accounts.</p>
            <button onClick={() => setShowTemplateModal(true)} className="btn-template">
              📋 Browse Templates
            </button>
          </div>
        ) : (
          <table className="coa-table">
            <thead>
              <tr>
                <th className="col-code">Code</th>
                <th className="col-name">Account Name</th>
                <th className="col-type">Type</th>
                <th className="col-balance">Current Balance</th>
              </tr>
            </thead>
            <tbody>
              {hierarchy.map(account => renderAccountRow(account))}
            </tbody>
          </table>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Chart of Accounts Templates</h2>
              <button className="btn-close" onClick={() => setShowTemplateModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {templates.length === 0 ? (
                <p className="no-templates">No templates available at this time.</p>
              ) : (
                <div className="templates-grid">
                  {templates.map(template => (
                    <div 
                      key={template.id} 
                      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="template-header">
                        <h3>{template.name}</h3>
                        <span className="account-count">{template.account_count} accounts</span>
                      </div>
                      <div className="template-industry">{template.industry}</div>
                      <p className="template-description">{template.description}</p>
                      
                      <div className="template-section">
                        <h4>✅ Suitable For:</h4>
                        <div className="tags">
                          {template.suitable_for.map((item, idx) => (
                            <span key={idx} className="tag">{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="template-section">
                        <h4>📜 Compliance:</h4>
                        <div className="tags">
                          {template.compliance.map((item, idx) => (
                            <span key={idx} className="tag tag-compliance">{item}</span>
                          ))}
                        </div>
                      </div>

                      {selectedTemplate?.id === template.id && (
                        <button 
                          className="btn-apply"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTemplate(template.id);
                          }}
                        >
                          ✨ Apply This Template
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <p className="warning-text">
                ⚠️ <strong>Warning:</strong> Applying a template will replace your entire Chart of Accounts.
                Make sure to backup your data first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="coa-footer">
        <p>
          💡 <strong>Tip:</strong> Click on any detail account to view its general ledger.
          Header accounts are used for grouping only.
        </p>
      </div>
    </div>
  );
};

export default ChartOfAccounts;
