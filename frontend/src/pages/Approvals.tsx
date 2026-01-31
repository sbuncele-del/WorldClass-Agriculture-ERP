import React, { useState, useEffect } from 'react';
import './Approvals.css';
import './Approvals.css';

interface ApprovalEntry {
  id: string;
  journal_number: string;
  posting_date: string;
  description: string;
  total_amount: number;
  submitted_by: string;
  submitted_at: string;
  current_level: {
    number: number;
    name: string;
  };
  hours_pending: number;
  priority: 'NORMAL' | 'MEDIUM' | 'HIGH';
}

interface ApprovalStats {
  pending_total: number;
  approved_today: number;
  rejected_today: number;
  average_approval_time_hours: string;
}

interface ApprovalHistoryItem {
  id: number;
  action: string;
  comments: string;
  performed_by: string;
  performed_at: string;
  level: {
    number: number;
    name: string;
  } | null;
}

const Approvals: React.FC = () => {
  const [pendingEntries, setPendingEntries] = useState<ApprovalEntry[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    fetchPendingApprovals();
    fetchStats();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/financial/approvals/pending');
      const data = await response.json();
      setPendingEntries(data.entries || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/financial/approvals/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching approval stats:', error);
    }
  };

  const fetchApprovalHistory = async (entryId: string) => {
    try {
      const response = await fetch(`/api/financial/approvals/history/${entryId}`);
      const data = await response.json();
      setApprovalHistory(data);
    } catch (error) {
      console.error('Error fetching approval history:', error);
    }
  };

  const handleViewHistory = (entry: ApprovalEntry) => {
    setSelectedEntry(entry);
    fetchApprovalHistory(entry.id);
    setShowHistoryModal(true);
  };

  const handleApproveClick = (entry: ApprovalEntry) => {
    setSelectedEntry(entry);
    setApproveComments('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (entry: ApprovalEntry) => {
    setSelectedEntry(entry);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedEntry) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/financial/approvals/approve/${selectedEntry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: approveComments,
          performedBy: 'current.user@company.com' // TODO: Get from auth context
        })
      });

      if (response.ok) {
        alert('Entry approved successfully!');
        setShowApproveModal(false);
        fetchPendingApprovals();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      alert('Failed to approve entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry) return;
    
    if (!rejectReason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/financial/approvals/reject/${selectedEntry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason,
          performedBy: 'current.user@company.com' // TODO: Get from auth context
        })
      });

      if (response.ok) {
        alert('Entry rejected successfully!');
        setShowRejectModal(false);
        fetchPendingApprovals();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting entry:', error);
      alert('Failed to reject entry');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      default: return '🟢';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'APPROVED': return '#27ae60';
      case 'REJECTED': return '#e74c3c';
      case 'RECALLED': return '#f39c12';
      case 'SUBMITTED': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const filteredEntries = filterPriority === 'all' 
    ? pendingEntries 
    : pendingEntries.filter(e => e.priority === filterPriority.toUpperCase());

  if (loading) {
    return (
      <div className="approvals-container">
        <div className="loading-spinner">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="approvals-container">
      <div className="approvals-header">
        <h1>📋 Pending Approvals</h1>
        <p className="approvals-subtitle">Review and approve journal entries</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="approval-stats-grid">
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending_total}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card approved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.approved_today}</div>
              <div className="stat-label">Approved Today</div>
            </div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.rejected_today}</div>
              <div className="stat-label">Rejected Today</div>
            </div>
          </div>
          <div className="stat-card avg-time">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.average_approval_time_hours}h</div>
              <div className="stat-label">Avg. Approval Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="approval-filters">
        <label>
          Priority Filter:
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="high">🔴 High Priority</option>
            <option value="medium">🟡 Medium Priority</option>
            <option value="normal">🟢 Normal Priority</option>
          </select>
        </label>
      </div>

      {/* Pending Entries List */}
      <div className="approval-entries">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Pending Approvals</h3>
            <p>All entries have been processed. Great job!</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className={`approval-card priority-${entry.priority.toLowerCase()}`}>
              <div className="approval-card-header">
                <div className="approval-card-title">
                  <span className="priority-icon">{getPriorityIcon(entry.priority)}</span>
                  <h3>{entry.journal_number}</h3>
                  <span className="approval-level-badge">{entry.current_level.name}</span>
                </div>
                <div className="approval-card-amount">{formatCurrency(entry.total_amount)}</div>
              </div>

              <div className="approval-card-body">
                <div className="approval-info">
                  <div className="info-row">
                    <span className="info-label">Description:</span>
                    <span className="info-value">{entry.description}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Posting Date:</span>
                    <span className="info-value">{formatDate(entry.posting_date)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Submitted By:</span>
                    <span className="info-value">{entry.submitted_by}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Pending:</span>
                    <span className="info-value">{formatTimeAgo(entry.hours_pending)}</span>
                  </div>
                </div>
              </div>

              <div className="approval-card-actions">
                <button 
                  className="btn-view-history"
                  onClick={() => handleViewHistory(entry)}
                >
                  📜 History
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleRejectClick(entry)}
                >
                  ❌ Reject
                </button>
                <button 
                  className="btn-approve"
                  onClick={() => handleApproveClick(entry)}
                >
                  ✅ Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedEntry && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Approve Journal Entry</h2>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Journal:</strong> {selectedEntry.journal_number}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedEntry.total_amount)}</p>
                <p><strong>Preparer:</strong> {selectedEntry.submitted_by}</p>
                <p><strong>Level:</strong> {selectedEntry.current_level.name}</p>
              </div>
              <div className="form-group">
                <label>Comments (optional):</label>
                <textarea
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                  placeholder="Add any comments about your approval..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-approve-modal" 
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : '✅ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedEntry && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>❌ Reject Journal Entry</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Journal:</strong> {selectedEntry.journal_number}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedEntry.total_amount)}</p>
                <p><strong>Preparer:</strong> {selectedEntry.submitted_by}</p>
              </div>
              <div className="form-group">
                <label>Reason for Rejection (required): *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a detailed reason for rejecting this entry..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-reject-modal" 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : '❌ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedEntry && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📜 Approval History</h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-info">
                <p><strong>Journal:</strong> {selectedEntry.journal_number}</p>
                <p><strong>Description:</strong> {selectedEntry.description}</p>
              </div>
              <div className="approval-timeline">
                {approvalHistory.length === 0 ? (
                  <p>No approval history available.</p>
                ) : (
                  approvalHistory.map(item => (
                    <div key={item.id} className="timeline-item">
                      <div className="timeline-marker" style={{ backgroundColor: getActionColor(item.action) }}>
                        ⏺
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-action" style={{ color: getActionColor(item.action) }}>
                            {item.action}
                          </span>
                          {item.level && (
                            <span className="timeline-level">Level {item.level.number}: {item.level.name}</span>
                          )}
                        </div>
                        <div className="timeline-details">
                          <span className="timeline-user">by {item.performed_by}</span>
                          <span className="timeline-date">{formatDateTime(item.performed_at)}</span>
                        </div>
                        {item.comments && (
                          <div className="timeline-comments">"{item.comments}"</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
