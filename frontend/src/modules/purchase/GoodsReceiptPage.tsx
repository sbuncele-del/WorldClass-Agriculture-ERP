import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface GoodsReceipt {
  id: string;
  grn_number: string;
  po_number: string;
  supplier_name: string;
  supplier_code: string;
  receipt_date: string;
  received_by: string;
  status: 'PENDING' | 'RECEIVED' | 'QUALITY_CHECK' | 'APPROVED' | 'REJECTED';
  total_items: number;
  received_items: number;
  rejected_items: number;
  storage_location: string;
  quality_score: number | null;
  notes: string;
}

const GoodsReceiptPage: React.FC = () => {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchGoodsReceipts();
  }, []);

  const fetchGoodsReceipts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/purchase/receipts');
      setReceipts(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching goods receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'PENDING': 'gray',
      'RECEIVED': 'blue',
      'QUALITY_CHECK': 'orange',
      'APPROVED': 'green',
      'REJECTED': 'red'
    };
    return colors[status] || 'gray';
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'orange';
    return 'red';
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.grn_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || receipt.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalReceipts = receipts.length;
  const pendingQC = receipts.filter(r => r.status === 'QUALITY_CHECK').length;
  const approved = receipts.filter(r => r.status === 'APPROVED').length;
  const rejected = receipts.filter(r => r.status === 'REJECTED').length;
  const avgQualityScore = receipts.filter(r => r.quality_score !== null).length > 0
    ? receipts.filter(r => r.quality_score !== null).reduce((sum, r) => sum + (r.quality_score || 0), 0) / 
      receipts.filter(r => r.quality_score !== null).length
    : 0;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading goods receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>📥 Goods Receipt Notes</h2>
          <button className="btn-primary">+ New GRN</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search receipts by GRN, PO number, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={filterStatus === 'ALL' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
            <button 
              className={filterStatus === 'PENDING' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('PENDING')}
            >
              Pending
            </button>
            <button 
              className={filterStatus === 'RECEIVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('RECEIVED')}
            >
              Received
            </button>
            <button 
              className={filterStatus === 'QUALITY_CHECK' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('QUALITY_CHECK')}
            >
              QC
            </button>
            <button 
              className={filterStatus === 'APPROVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Approved
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>Receipt Date</th>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Items Received</th>
                <th>Rejected</th>
                <th>Quality Score</th>
                <th>Storage Location</th>
                <th>Received By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id}>
                  <td className="code-cell">{receipt.grn_number}</td>
                  <td>{new Date(receipt.receipt_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <a href={`/purchase/orders?po=${receipt.po_number}`} className="link-text">
                      {receipt.po_number}
                    </a>
                  </td>
                  <td>
                    <div className="supplier-info">
                      <div className="supplier-name">{receipt.supplier_name}</div>
                      <div className="supplier-code">{receipt.supplier_code}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(receipt.status)}`}>
                      {receipt.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-center">
                    {receipt.received_items > 0 ? (
                      <span className="text-success">{receipt.received_items}/{receipt.total_items}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    {receipt.rejected_items > 0 ? (
                      <span className="text-danger">{receipt.rejected_items}</span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                  <td>
                    {receipt.quality_score !== null ? (
                      <span className={`performance-badge badge-${getQualityColor(receipt.quality_score)}`}>
                        {receipt.quality_score}%
                      </span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                  <td>{receipt.storage_location || <span className="text-muted">-</span>}</td>
                  <td>{receipt.received_by}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      {receipt.status === 'QUALITY_CHECK' && (
                        <>
                          <button className="btn-icon" title="Approve">✅</button>
                          <button className="btn-icon" title="Reject">❌</button>
                        </>
                      )}
                      <button className="btn-icon" title="Print GRN">🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReceipts.length === 0 && (
          <div className="empty-state">
            <p>No goods receipts found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Receipts</div>
          <div className="metric-value">{totalReceipts}</div>
          <div className="metric-detail">All statuses</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending QC</div>
          <div className="metric-value">{pendingQC}</div>
          <div className="metric-detail">Awaiting inspection</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Approved</div>
          <div className="metric-value">{approved}</div>
          <div className="metric-detail">{rejected} rejected</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Quality Score</div>
          <div className="metric-value">{avgQualityScore.toFixed(1)}%</div>
          <div className="metric-detail">Quality performance</div>
        </div>
      </div>
    </div>
  );
};

export default GoodsReceiptPage;
