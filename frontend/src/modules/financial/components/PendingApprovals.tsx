import React, { useState } from 'react';
import './PendingApprovals.css';

interface PendingApproval {
  journal_entry_id: string;
  journal_number: string;
  journal_date: string;
  description: string;
  total_amount: number;
  submitted_by: string;
  submitted_at: string;
  current_level: number;
  total_levels: number;
  level_name: string;
  role_required: string;
  days_pending: number;
}

interface ApprovalStats {
  pending_total: number;
  approved_today: number;
  rejected_today: number;
  average_approval_time_hours: string;
}

const PendingApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'my_level'>('all');
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  React.useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pending approvals
      const approvalsResponse = await fetch(`/api/financial/approvals/pending?filter=${filter}`);
      const approvalsResult = await approvalsResponse.json();
      
      if (Array.isArray(approvalsResult)) {
        setApprovals(approvalsResult);
      } else if (approvalsResult.data) {
        setApprovals(approvalsResult.data);
      } else {
        setApprovals([]);
      }

      // Fetch stats
      const statsResponse = await fetch('/api/financial/approvals/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      setError(null);
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError('Failed to load pending approvals');
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      setProcessing(true);
      
      const response = await fetch(
        `/api/financial/approvals/approve/${selectedApproval.journal_entry_id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comments,
            performedBy: 'CURRENT_USER', // TODO: Get from auth context
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Approval failed');
      }

      // Success
      setShowApproveModal(false);
      setSelectedApproval(null);
      setComments('');
      fetchData(); // Refresh list
      
      alert('Entry approved successfully!');
    } catch (err) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch(
        `/api/financial/approvals/reject/${selectedApproval.journal_entry_id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comments,
            performedBy: 'CURRENT_USER', // TODO: Get from auth context
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Rejection failed');
      }

      // Success
      setShowRejectModal(false);
      setSelectedApproval(null);
      setComments('');
      fetchData(); // Refresh list
      
      alert('Entry rejected successfully!');
    } catch (err) {
      const error = err as Error;
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openApproveModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setComments('');
    setShowApproveModal(true);
  };

  const openRejectModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setComments('');
    setShowRejectModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const getUrgencyClass = (days: number) => {
    if (days >= 3) return 'urgent';
    if (days >= 2) return 'warning';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="pending-approvals">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-approvals">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchData} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approvals">
      {/* Header */}
      <div className="approvals-header">
        <div>
          <h2>⏳ Pending Approvals</h2>
          <p className="subtitle">Review and approve journal entries</p>
        </div>
        <button onClick={fetchData} className="btn-refresh" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="approval-stats">
          <div className="stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending_total}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card stat-approved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.approved_today}</div>
              <div className="stat-label">Approved Today</div>
            </div>
          </div>

          <div className="stat-card stat-rejected">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.rejected_today}</div>
              <div className="stat-label">Rejected Today</div>
            </div>
          </div>

          <div className="stat-card stat-time">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="stat-value">
                {parseFloat(stats.average_approval_time_hours).toFixed(1)}h
              </div>
              <div className="stat-label">Avg. Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="approval-filters">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Pending ({approvals.length})
        </button>
        <button
          className={`filter-tab ${filter === 'my_level' ? 'active' : ''}`}
          onClick={() => setFilter('my_level')}
        >
          My Level
        </button>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>All clear!</h3>
          <p>No journal entries pending approval</p>
        </div>
      ) : (
        <div className="approvals-list">
          {approvals.map((approval) => (
            <div
              key={approval.journal_entry_id}
              className={`approval-card ${getUrgencyClass(approval.days_pending)}`}
            >
              <div className="approval-header">
                <div className="approval-title">
                  <h3>{approval.journal_number}</h3>
                  <span className="approval-date">
                    {formatDate(approval.journal_date)}
                  </span>
                </div>
                <div className="approval-amount">
                  {formatCurrency(approval.total_amount)}
                </div>
              </div>

              <div className="approval-description">
                {approval.description}
              </div>

              <div className="approval-details">
                <div className="detail-row">
                  <span className="detail-label">Submitted by:</span>
                  <span className="detail-value">{approval.submitted_by}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Submitted:</span>
                  <span className="detail-value">
                    {formatDateTime(approval.submitted_at)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current Level:</span>
                  <span className="detail-value">
                    Level {approval.current_level} of {approval.total_levels} - {approval.level_name}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Required Role:</span>
                  <span className="detail-value role-badge">{approval.role_required}</span>
                </div>
              </div>

              <div className="approval-footer">
                <div className="pending-indicator">
                  <span className={`pending-badge ${getUrgencyClass(approval.days_pending)}`}>
                    {approval.days_pending === 0
                      ? 'Today'
                      : approval.days_pending === 1
                      ? '1 day ago'
                      : `${approval.days_pending} days ago`}
                  </span>
                </div>

                <div className="approval-actions">
                  <button
                    className="btn-reject"
                    onClick={() => openRejectModal(approval)}
                  >
                    ❌ Reject
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => openApproveModal(approval)}
                  >
                    ✅ Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedApproval && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Approve Journal Entry</h3>
              <button
                className="modal-close"
                onClick={() => setShowApproveModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="approval-summary">
                <h4>{selectedApproval.journal_number}</h4>
                <p>{selectedApproval.description}</p>
                <div className="summary-amount">
                  Amount: {formatCurrency(selectedApproval.total_amount)}
                </div>
              </div>

              <div className="form-group">
                <label>Comments (optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add approval comments..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowApproveModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-approve"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? 'Approving...' : '✅ Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApproval && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❌ Reject Journal Entry</h3>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="approval-summary">
                <h4>{selectedApproval.journal_number}</h4>
                <p>{selectedApproval.description}</p>
                <div className="summary-amount">
                  Amount: {formatCurrency(selectedApproval.total_amount)}
                </div>
              </div>

              <div className="form-group">
                <label>
                  Reason for Rejection <span className="required">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-reject"
                onClick={handleReject}
                disabled={processing || !comments.trim()}
              >
                {processing ? 'Rejecting...' : '❌ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
