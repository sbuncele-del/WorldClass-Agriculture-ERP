/**
 * STOCK ADJUSTMENTS
 * 
 * Create and manage stock adjustments for physical counts, damage, etc.
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api.service';

interface StockAdjustment {
  adjustment_id: number;
  adjustment_number: string;
  adjustment_date: string;
  adjustment_type: string;
  warehouse_code: string;
  warehouse_name: string;
  reason: string;
  status: string;
  total_adjustment_value: number;
  line_count: number;
}

export default function StockAdjustments() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAdjustments();
  }, [filterStatus]);

  const fetchAdjustments = async () => {
    try {
      let url = `${API_BASE_URL}/api/inventory/stock-adjustments`;
      if (filterStatus) url += `?status=${filterStatus}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setAdjustments(result.data);
      }
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  const getAdjustmentTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'Physical Count': 'status-draft',
      'Damage': 'status-cancelled',
      'Loss': 'status-cancelled',
      'Found': 'status-approved',
      'Obsolete': 'status-warning',
      'Expiry': 'status-warning',
      'Quality Rejection': 'status-cancelled',
      'Revaluation': 'status-pending',
      'Other': 'status-draft'
    };
    return typeMap[type] || 'status-draft';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'Draft': 'status-draft',
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Posted': 'status-posted',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-draft';
  };

  if (loading) {
    return <div className="loading">Loading stock adjustments...</div>;
  }

  return (
    <div className="stock-adjustments">
      <div className="section-header">
        <h2 className="section-title">⚖️ Stock Adjustments</h2>
        <button className="btn btn-primary">
          ➕ New Adjustment
        </button>
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Posted">Posted</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Adjustments Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Adjustment #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Warehouse</th>
            <th>Lines</th>
            <th>Total Value</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {adjustments.length > 0 ? (
            adjustments.map((adj) => (
              <tr key={adj.adjustment_id}>
                <td><strong>{adj.adjustment_number}</strong></td>
                <td>{new Date(adj.adjustment_date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${getAdjustmentTypeBadge(adj.adjustment_type)}`}>
                    {adj.adjustment_type}
                  </span>
                </td>
                <td>
                  <div><strong>{adj.warehouse_code}</strong></div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {adj.warehouse_name}
                  </div>
                </td>
                <td>{adj.line_count}</td>
                <td>
                  <strong style={{ color: adj.total_adjustment_value < 0 ? '#dc3545' : '#28a745' }}>
                    {formatCurrency(adj.total_adjustment_value || 0)}
                  </strong>
                </td>
                <td>
                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adj.reason}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadge(adj.status)}`}>
                    {adj.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      👁️ View
                    </button>
                    {adj.status === 'Draft' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        ✅ Post
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                No stock adjustments found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="stats-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Adjustments</div>
          <div className="stat-value">{adjustments.length}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">
            {adjustments.filter(a => a.status === 'Pending').length}
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Posted</div>
          <div className="stat-value">
            {adjustments.filter(a => a.status === 'Posted').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Impact</div>
          <div className="stat-value">
            {formatCurrency(adjustments.reduce((sum, a) => sum + (a.total_adjustment_value || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
