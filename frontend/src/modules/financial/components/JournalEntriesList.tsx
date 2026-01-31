import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../services/api.service';
import '../styles/JournalEntriesList.css';

interface JournalEntry {
  id: string;
  journal_number: string;
  journal_date: string;
  description: string;
  status: string;
  total_debit: number;
  total_credit: number;
  source_type?: string;
}

const JournalEntriesList: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchJournalEntries();
  }, [filter]);

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') {
        params.append('status', filter);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/financial/journal-entries?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (id: string) => {
    if (!confirm('Post this journal entry to the ledger? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/financial/journal-entries/${id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'current-user' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Journal entry posted successfully!');
        fetchJournalEntries();
      } else {
        alert('❌ ' + (data.error || 'Failed to post entry'));
      }
    } catch (err) {
      alert('❌ Error posting entry');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      DRAFT: 'status-draft',
      PENDING_APPROVAL: 'status-pending',
      APPROVED: 'status-approved',
      POSTED: 'status-posted',
      REVERSED: 'status-reversed',
      REJECTED: 'status-rejected',
    };
    
    const statusLabels: Record<string, string> = {
      DRAFT: '📝 Draft',
      PENDING_APPROVAL: '⏳ Pending Approval',
      APPROVED: '✅ Approved',
      POSTED: '🔒 Posted',
      REVERSED: '↩️ Reversed',
      REJECTED: '❌ Rejected',
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const filteredEntries = entries.filter(entry => 
    entry.journal_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="journal-entries-list">
      <div className="list-header">
        <div>
          <h2>📚 Journal Entries</h2>
          <p className="subtitle">View and manage all journal entries</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/financial/journal-entry/new')}
        >
          + New Journal Entry
        </button>
      </div>

      <div className="list-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by journal number or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'REVERSED'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'ALL' ? 'All Entries' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading journal entries...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No journal entries found</h3>
          <p>Create your first journal entry to get started</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/financial/journal-entry/new')}
          >
            Create Journal Entry
          </button>
        </div>
      ) : (
        <div className="entries-table-container">
          <table className="entries-table">
            <thead>
              <tr>
                <th>Journal Number</th>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Source</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} onClick={() => navigate(`/financial/journal-entry/${entry.id}`)}>
                  <td className="journal-number">{entry.journal_number}</td>
                  <td>{new Date(entry.journal_date).toLocaleDateString()}</td>
                  <td className="description">{entry.description}</td>
                  <td>{getStatusBadge(entry.status)}</td>
                  <td>
                    <span className="source-type">
                      {entry.source_type || 'MANUAL'}
                    </span>
                  </td>
                  <td className="amount">R {entry.total_debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                  <td className="amount">R {entry.total_credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn-action"
                        onClick={() => navigate(`/financial/journal-entry/${entry.id}`)}
                        title="View details"
                      >
                        👁️
                      </button>
                      {(entry.status === 'DRAFT' || entry.status === 'APPROVED') && (
                        <button 
                          className="btn-action btn-post"
                          onClick={() => handlePostEntry(entry.id)}
                          title="Post to ledger"
                        >
                          📤
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JournalEntriesList;
