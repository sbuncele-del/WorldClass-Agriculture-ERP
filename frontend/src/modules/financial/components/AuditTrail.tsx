import React, { useState, useEffect } from 'react';
import './AuditTrail.css';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email?: string;
  user_name?: string;
  timestamp: string;
  description?: string;
  module: string;
  severity: string;
  old_values?: any;
  new_values?: any;
  changes?: any;
}

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });
  const [summary, setSummary] = useState<any>(null);

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'POST', 'APPROVE', 'REJECT', 'REVERSE', 'VOID'];
  const entityTypes = ['journal_entry', 'journal_entry_line', 'chart_of_accounts', 'bank_account', 'bank_statement'];
  const severityTypes = ['INFO', 'WARNING', 'CRITICAL'];

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, []);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (searchText) params.append('search_text', searchText);
      actionFilter.forEach(a => params.append('action', a));
      entityFilter.forEach(e => params.append('entity_type', e));
      if (severityFilter.length > 0) params.append('severity', severityFilter[0]);
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/financial/audit-trail?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/financial/audit-trail/summary/statistics?${params}`);
      const result = await response.json();

      if (result.success) {
        setSummary(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleSearch = () => {
    fetchLogs(1);
    fetchSummary();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('module', 'FINANCIAL');

      const response = await fetch(`/api/financial/audit-trail/export/csv?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const viewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-ZA');
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'severity-critical';
      case 'WARNING': return 'severity-warning';
      default: return 'severity-info';
    }
  };

  const getActionClass = (action: string) => {
    switch (action) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      case 'POST': return 'action-post';
      case 'APPROVE': return 'action-approve';
      case 'REJECT': return 'action-reject';
      default: return 'action-default';
    }
  };

  return (
    <div className="audit-trail">
      {/* Header */}
      <div className="at-header">
        <div>
          <h1>Audit Trail</h1>
          <p className="at-subtitle">Complete activity log for compliance and security</p>
        </div>
        <button onClick={handleExport} className="btn-export">
          📊 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📝</div>
            <div className="card-content">
              <div className="card-value">{summary.overall?.total_logs || 0}</div>
              <div className="card-label">Total Logs</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <div className="card-value">{summary.overall?.unique_users || 0}</div>
              <div className="card-label">Active Users</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📦</div>
            <div className="card-content">
              <div className="card-value">{summary.overall?.unique_entity_types || 0}</div>
              <div className="card-label">Entity Types</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <div className="card-value">{summary.overall?.active_days || 0}</div>
              <div className="card-label">Active Days</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search description, entity ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn-search">
              🔍 Search
            </button>
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Actions</label>
            <select
              multiple
              value={actionFilter}
              onChange={(e) => setActionFilter(Array.from(e.target.selectedOptions, o => o.value))}
              size={3}
            >
              {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Entity Types</label>
            <select
              multiple
              value={entityFilter}
              onChange={(e) => setEntityFilter(Array.from(e.target.selectedOptions, o => o.value))}
              size={3}
            >
              {entityTypes.map(e => <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Severity</label>
            <select
              multiple
              value={severityFilter}
              onChange={(e) => setSeverityFilter(Array.from(e.target.selectedOptions, o => o.value))}
              size={3}
            >
              {severityTypes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="logs-section">
        <div className="logs-header">
          <h3>Activity Log ({pagination.total} records)</h3>
          <span>Page {pagination.page} of {pagination.total_pages}</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No audit logs found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>User</th>
                    <th>Description</th>
                    <th>Severity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="timestamp-cell">{formatTimestamp(log.timestamp)}</td>
                      <td>
                        <span className={`action-badge ${getActionClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className="entity-cell">
                          <div className="entity-type">{log.entity_type.replace(/_/g, ' ')}</div>
                          <div className="entity-id">{log.entity_id.substring(0, 8)}...</div>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <div className="user-name">{log.user_name || 'System'}</div>
                          <div className="user-email">{log.user_email || '-'}</div>
                        </div>
                      </td>
                      <td className="description-cell">{log.description || '-'}</td>
                      <td>
                        <span className={`severity-badge ${getSeverityClass(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => viewDetails(log)} className="btn-view-details">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-page"
                >
                  ← Previous
                </button>
                <span>Page {pagination.page} of {pagination.total_pages}</span>
                <button
                  onClick={() => fetchLogs(pagination.page + 1)}
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

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Audit Log Details</h2>
              <button onClick={() => setShowDetails(false)} className="btn-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{selectedLog.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Timestamp:</span>
                <span className="detail-value">{formatTimestamp(selectedLog.timestamp)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Action:</span>
                <span className={`action-badge ${getActionClass(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Entity Type:</span>
                <span className="detail-value">{selectedLog.entity_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Entity ID:</span>
                <span className="detail-value">{selectedLog.entity_id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">User:</span>
                <span className="detail-value">{selectedLog.user_name || 'System'} ({selectedLog.user_email || 'N/A'})</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedLog.description || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Module:</span>
                <span className="detail-value">{selectedLog.module}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Severity:</span>
                <span className={`severity-badge ${getSeverityClass(selectedLog.severity)}`}>
                  {selectedLog.severity}
                </span>
              </div>

              {selectedLog.changes && (
                <div className="changes-section">
                  <h3>Changes</h3>
                  <pre className="json-display">{JSON.stringify(selectedLog.changes, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
