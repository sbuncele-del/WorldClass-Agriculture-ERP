import React, { useState, useEffect } from 'react';
import './ApprovalHistory.css';

interface ApprovalHistoryItem {
  id: number;
  journal_entry_id: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RECALLED' | 'ESCALATED' | 'COMMENTED';
  level_number: number | null;
  level_name: string | null;
  performed_by: string;
  performed_at: string;
  comments: string | null;
  decision: 'APPROVE' | 'REJECT' | null;
}

interface ApprovalHistoryProps {
  journalEntryId: string;
  journalNumber?: string;
  onClose?: () => void;
}

const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({ 
  journalEntryId, 
  journalNumber,
  onClose 
}) => {
  const [history, setHistory] = useState<ApprovalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [journalEntryId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/financial/approvals/history/${journalEntryId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.data || []);
      } else {
        setError(data.error || 'Failed to load approval history');
      }
    } catch (err) {
      console.error('Error fetching approval history:', err);
      setError('Failed to load approval history');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'SUBMITTED':
        return '📤';
      case 'APPROVED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'RECALLED':
        return '↩️';
      case 'ESCALATED':
        return '⚠️';
      case 'COMMENTED':
        return '💬';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'SUBMITTED':
        return '#3b82f6'; // Blue
      case 'APPROVED':
        return '#10b981'; // Green
      case 'REJECTED':
        return '#ef4444'; // Red
      case 'RECALLED':
        return '#f59e0b'; // Orange
      case 'ESCALATED':
        return '#f59e0b'; // Orange
      case 'COMMENTED':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'SUBMITTED':
        return 'Submitted for Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'RECALLED':
        return 'Recalled';
      case 'ESCALATED':
        return 'Escalated';
      case 'COMMENTED':
        return 'Added Comment';
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="approval-history">
        <div className="history-header">
          <h3>📜 Approval History</h3>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading approval history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approval-history">
        <div className="history-header">
          <h3>📜 Approval History</h3>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchHistory} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-history">
      <div className="history-header">
        <div>
          <h3>📜 Approval History</h3>
          {journalNumber && (
            <p className="journal-reference">Journal Entry: {journalNumber}</p>
          )}
        </div>
        {onClose && (
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h4>No Approval History</h4>
          <p>This entry has not been submitted for approval yet.</p>
        </div>
      ) : (
        <div className="timeline">
          {history.map((item, index) => (
            <div key={item.id} className="timeline-item">
              {/* Timeline connector line */}
              {index < history.length - 1 && <div className="timeline-line"></div>}

              {/* Timeline marker */}
              <div
                className="timeline-marker"
                style={{ backgroundColor: getActionColor(item.action) }}
              >
                <span className="marker-icon">{getActionIcon(item.action)}</span>
              </div>

              {/* Timeline content */}
              <div className="timeline-content">
                <div className="timeline-card">
                  <div className="card-header">
                    <div className="action-info">
                      <span
                        className="action-label"
                        style={{ color: getActionColor(item.action) }}
                      >
                        {getActionLabel(item.action)}
                      </span>
                      {item.level_name && (
                        <span className="level-badge">
                          Level {item.level_number}: {item.level_name}
                        </span>
                      )}
                    </div>
                    <span className="timestamp">
                      {formatDateTime(item.performed_at)}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="performer-info">
                      <span className="performer-icon">👤</span>
                      <span className="performer-name">{item.performed_by}</span>
                    </div>

                    {item.comments && (
                      <div className="comments-section">
                        <div className="comments-label">Comments:</div>
                        <div className="comments-text">"{item.comments}"</div>
                      </div>
                    )}

                    {item.decision && (
                      <div className="decision-badge">
                        Decision: {item.decision}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {history.length > 0 && (
        <div className="history-footer">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-icon">📝</span>
              <span className="stat-value">{history.length}</span>
              <span className="stat-label">Total Actions</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">✅</span>
              <span className="stat-value">
                {history.filter((h) => h.action === 'APPROVED').length}
              </span>
              <span className="stat-label">Approvals</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">❌</span>
              <span className="stat-value">
                {history.filter((h) => h.action === 'REJECTED').length}
              </span>
              <span className="stat-label">Rejections</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-value">
                {history.filter((h) => h.comments).length}
              </span>
              <span className="stat-label">Comments</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistory;
