/**
 * Reconciliation Workspace Component
 * 
 * Dual-pane interface for bank reconciliation
 * Left: Statement lines | Right: GL transactions
 * Features: Auto-matching, manual matching, journal creation
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api.service';
import './ReconciliationWorkspace.css';

const API_BASE = `${API_BASE_URL}/api/cash-management`;

interface BankStatement {
  id: number;
  bank_account_id: number;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  status: string;
  account_name?: string;
  account_number?: string;
}

interface StatementLine {
  id: number;
  line_number: number;
  transaction_date: string;
  description: string;
  reference: string | null;
  debit_amount: number | null;
  credit_amount: number | null;
  balance: number | null;
  status: 'UNMATCHED' | 'MATCHED' | 'SUGGESTED' | 'IGNORED';
  match_id: number | null;
  match_confidence?: number;
}

interface JournalEntry {
  id: number;
  journal_number: string;
  journal_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
}

interface MatchSuggestion {
  statementLineId: number;
  journalEntryId: number;
  confidence: number;
  matchType: string;
  reason: string;
}

interface WorkspaceStats {
  totalLines: number;
  matchedCount: number;
  unmatchedCount: number;
  ignoredCount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  reconciliationPercentage: number;
}

interface Props {
  statementId: number;
  onClose?: () => void;
}

const ReconciliationWorkspace: React.FC<Props> = ({ statementId, onClose }) => {
  // State
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [statementLines, setStatementLines] = useState<StatementLine[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<number | null>(null);
  
  // Filter state
  const [lineFilter, setLineFilter] = useState<'all' | 'unmatched' | 'matched' | 'suggested'>('unmatched');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalLineForCreation, setJournalLineForCreation] = useState<StatementLine | null>(null);

  // Load workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE}/statements/${statementId}/workspace`);
        const result = await response.json();
        
        if (result.success) {
          setStatement(result.data.statement);
          setStatementLines(result.data.statementLines);
          setJournalEntries(result.data.journalEntries);
          setSuggestions(result.data.suggestions);
          setStats(result.data.stats);
        } else {
          setError(result.message || 'Failed to load reconciliation data');
        }
      } catch (err) {
        setError('Error loading workspace: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [statementId]);

  const loadWorkspace = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/statements/${statementId}/workspace`);
      const result = await response.json();
      
      if (result.success) {
        setStatement(result.data.statement);
        setStatementLines(result.data.statementLines);
        setJournalEntries(result.data.journalEntries);
        setSuggestions(result.data.suggestions);
        setStats(result.data.stats);
      } else {
        setError(result.message || 'Failed to load reconciliation data');
      }
    } catch (err) {
      setError('Error loading workspace: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const runAutoMatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/statements/${statementId}/auto-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 1 }) // TODO: Get from auth context
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadWorkspace(); // Reload to get updated matches
      } else {
        setError(result.message || 'Auto-matching failed');
      }
    } catch (err) {
      setError('Error running auto-match: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createMatch = async (lineId: number, journalId: number, matchType: 'MANUAL' | 'SUGGESTION' = 'MANUAL') => {
    try {
      const response = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementLineId: lineId,
          journalEntryId: journalId,
          matchType,
          userId: 1
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadWorkspace();
        setSelectedLine(null);
        setSelectedJournal(null);
      } else {
        setError(result.message || 'Failed to create match');
      }
    } catch (err) {
      setError('Error creating match: ' + (err as Error).message);
    }
  };

  const unmatchLine = async (lineId: number) => {
    try {
      const response = await fetch(`${API_BASE}/matches/unmatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementLineId: lineId,
          reason: 'User requested unmatch',
          userId: 1
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadWorkspace();
      } else {
        setError(result.message || 'Failed to unmatch');
      }
    } catch (err) {
      setError('Error unmatching: ' + (err as Error).message);
    }
  };

  const ignoreLine = async (lineId: number) => {
    try {
      // TODO: Implement ignore endpoint on backend
      console.log('Ignore line:', lineId);
      // For now, just update local state
      setStatementLines(lines =>
        lines.map(line =>
          line.id === lineId ? { ...line, status: 'IGNORED' as const } : line
        )
      );
    } catch (err) {
      setError('Error ignoring line: ' + (err as Error).message);
    }
  };

  const handleLineClick = (lineId: number) => {
    setSelectedLine(lineId === selectedLine ? null : lineId);
    setSelectedJournal(null);
  };

  const handleJournalClick = (journalId: number) => {
    setSelectedJournal(journalId === selectedJournal ? null : journalId);
  };

  const handleMatch = () => {
    if (selectedLine && selectedJournal) {
      createMatch(selectedLine, selectedJournal, 'MANUAL');
    }
  };

  const handleAcceptSuggestion = (suggestion: MatchSuggestion) => {
    createMatch(suggestion.statementLineId, suggestion.journalEntryId, 'SUGGESTION');
  };

  const handleCreateJournal = (line: StatementLine) => {
    setJournalLineForCreation(line);
    setShowJournalModal(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'confidence-high';
    if (confidence >= 75) return 'confidence-medium';
    return 'confidence-low';
  };

  const filteredLines = statementLines.filter(line => {
    // Apply status filter
    if (lineFilter === 'unmatched' && line.status !== 'UNMATCHED') return false;
    if (lineFilter === 'matched' && line.status !== 'MATCHED') return false;
    if (lineFilter === 'suggested' && line.status !== 'SUGGESTED') return false;
    
    // Apply search filter
    if (searchTerm && !line.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getSuggestionForLine = (lineId: number) => {
    return suggestions.find(s => s.statementLineId === lineId);
  };

  if (loading && !statement) {
    return (
      <div className="reconciliation-workspace">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reconciliation workspace...</p>
        </div>
      </div>
    );
  }

  if (error && !statement) {
    return (
      <div className="reconciliation-workspace">
        <div className="error-state">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={loadWorkspace} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reconciliation-workspace">
      {/* Header */}
      <div className="workspace-header">
        <div className="header-info">
          <h2>Bank Reconciliation</h2>
          <div className="statement-info">
            <span className="info-item">
              <strong>Account:</strong> {statement?.account_name} ({statement?.account_number})
            </span>
            <span className="info-item">
              <strong>Date:</strong> {statement?.statement_date}
            </span>
            <span className="info-item">
              <strong>Opening:</strong> R {statement?.opening_balance.toFixed(2)}
            </span>
            <span className="info-item">
              <strong>Closing:</strong> R {statement?.closing_balance.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={runAutoMatch} className="btn-secondary" disabled={loading}>
            {loading ? '⏳ Running...' : '🤖 Auto-Match'}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-secondary">
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-value">{stats.totalLines}</div>
            <div className="stat-label">Total Lines</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-value">{stats.matchedCount}</div>
            <div className="stat-label">Matched</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{stats.unmatchedCount}</div>
            <div className="stat-label">Unmatched</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{stats.ignoredCount}</div>
            <div className="stat-label">Ignored</div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-value">{stats.reconciliationPercentage.toFixed(1)}%</div>
            <div className="stat-label">Reconciled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">R {stats.unmatchedAmount.toFixed(2)}</div>
            <div className="stat-label">Unmatched Amount</div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Dual Pane Layout */}
      <div className="workspace-content">
        {/* Left Pane: Statement Lines */}
        <div className="lines-pane">
          <div className="pane-header">
            <h3>📄 Statement Lines</h3>
            <div className="pane-controls">
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={lineFilter}
                onChange={(e) => setLineFilter(e.target.value as 'all' | 'unmatched' | 'matched' | 'suggested')}
                className="filter-select"
              >
                <option value="all">All ({statementLines.length})</option>
                <option value="unmatched">Unmatched ({statementLines.filter(l => l.status === 'UNMATCHED').length})</option>
                <option value="matched">Matched ({statementLines.filter(l => l.status === 'MATCHED').length})</option>
                <option value="suggested">Suggested ({statementLines.filter(l => l.status === 'SUGGESTED').length})</option>
              </select>
            </div>
          </div>

          <div className="lines-list">
            {filteredLines.length === 0 ? (
              <div className="empty-pane">
                <p>No statement lines found</p>
              </div>
            ) : (
              filteredLines.map(line => {
                const suggestion = getSuggestionForLine(line.id);
                const isSelected = selectedLine === line.id;
                
                return (
                  <div
                    key={line.id}
                    className={`line-item ${line.status.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleLineClick(line.id)}
                  >
                    <div className="line-header">
                      <span className="line-number">#{line.line_number}</span>
                      <span className="line-date">{line.transaction_date}</span>
                      <span className={`line-status status-${line.status.toLowerCase()}`}>
                        {line.status}
                      </span>
                    </div>
                    
                    <div className="line-description">{line.description}</div>
                    
                    {line.reference && (
                      <div className="line-reference">Ref: {line.reference}</div>
                    )}
                    
                    <div className="line-amounts">
                      {line.debit_amount && (
                        <span className="amount debit">
                          DR: R {line.debit_amount.toFixed(2)}
                        </span>
                      )}
                      {line.credit_amount && (
                        <span className="amount credit">
                          CR: R {line.credit_amount.toFixed(2)}
                        </span>
                      )}
                      {line.balance !== null && (
                        <span className="balance">
                          Bal: R {line.balance.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {suggestion && (
                      <div className={`suggestion ${getConfidenceColor(suggestion.confidence)}`}>
                        <div className="suggestion-header">
                          <span>💡 Suggested Match</span>
                          <span className="confidence">{suggestion.confidence}%</span>
                        </div>
                        <div className="suggestion-reason">{suggestion.reason}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptSuggestion(suggestion);
                          }}
                          className="btn-accept"
                        >
                          ✓ Accept
                        </button>
                      </div>
                    )}

                    {line.status === 'UNMATCHED' && (
                      <div className="line-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateJournal(line);
                          }}
                          className="btn-action btn-create"
                        >
                          + Create Journal
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ignoreLine(line.id);
                          }}
                          className="btn-action btn-ignore"
                        >
                          Ignore
                        </button>
                      </div>
                    )}

                    {line.status === 'MATCHED' && (
                      <div className="line-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            unmatchLine(line.id);
                          }}
                          className="btn-action btn-unmatch"
                        >
                          ✕ Unmatch
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Middle: Match Action */}
        <div className="match-action">
          {selectedLine && selectedJournal ? (
            <button onClick={handleMatch} className="btn-match">
              ➜<br/>Match
            </button>
          ) : (
            <div className="match-hint">
              {selectedLine ? 'Select a journal entry →' : '← Select a statement line'}
            </div>
          )}
        </div>

        {/* Right Pane: Journal Entries */}
        <div className="journal-pane">
          <div className="pane-header">
            <h3>📚 Journal Entries</h3>
            <div className="pane-info">
              {journalEntries.length} entries
            </div>
          </div>

          <div className="journal-list">
            {journalEntries.length === 0 ? (
              <div className="empty-pane">
                <p>No journal entries found for this period</p>
              </div>
            ) : (
              journalEntries.map(journal => {
                const isSelected = selectedJournal === journal.id;
                
                return (
                  <div
                    key={journal.id}
                    className={`journal-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleJournalClick(journal.id)}
                  >
                    <div className="journal-header">
                      <span className="journal-number">{journal.journal_number}</span>
                      <span className="journal-date">{journal.journal_date}</span>
                    </div>
                    
                    <div className="journal-description">{journal.description}</div>
                    
                    <div className="journal-amounts">
                      <span className="amount debit">
                        DR: R {journal.total_debit.toFixed(2)}
                      </span>
                      <span className="amount credit">
                        CR: R {journal.total_credit.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className={`journal-status status-${journal.status.toLowerCase()}`}>
                      {journal.status}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Journal Creation Modal */}
      {showJournalModal && journalLineForCreation && (
        <div className="modal-overlay" onClick={() => setShowJournalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Journal Entry</h3>
              <button onClick={() => setShowJournalModal(false)} className="modal-close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-info">
                Creating journal entry for statement line:
              </p>
              <div className="line-preview">
                <div><strong>Date:</strong> {journalLineForCreation.transaction_date}</div>
                <div><strong>Description:</strong> {journalLineForCreation.description}</div>
                <div>
                  <strong>Amount:</strong> R {
                    (journalLineForCreation.debit_amount || journalLineForCreation.credit_amount || 0).toFixed(2)
                  }
                </div>
              </div>
              <p className="coming-soon-text">
                Journal entry creation form coming soon...
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowJournalModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button className="btn-primary" disabled>
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationWorkspace;
