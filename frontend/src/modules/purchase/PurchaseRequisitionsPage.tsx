import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Requisition {
  id: string;
  number: string;
  requester: string;
  department: string;
  date: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimated_value: number;
  item_count: number;
  approver: string;
  approval_date: string | null;
  po_number: string | null;
  notes: string;
}

const PurchaseRequisitionsPage: React.FC = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/purchase/requisitions');
      setRequisitions(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching requisitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'DRAFT': 'gray',
      'SUBMITTED': 'blue',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'CONVERTED': 'purple'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'LOW': 'gray',
      'MEDIUM': 'blue',
      'HIGH': 'orange',
      'URGENT': 'red'
    };
    return colors[priority] || 'gray';
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = 
      req.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || req.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalRequisitions = requisitions.length;
  const pendingApproval = requisitions.filter(r => r.status === 'SUBMITTED').length;
  const approved = requisitions.filter(r => r.status === 'APPROVED').length;
  const totalValue = requisitions.reduce((sum, r) => sum + r.estimated_value, 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading requisitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>📝 Purchase Requisitions</h2>
          <button className="btn-primary">+ New Requisition</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search requisitions by number, requester, or department..."
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
              className={filterStatus === 'DRAFT' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('DRAFT')}
            >
              Draft
            </button>
            <button 
              className={filterStatus === 'SUBMITTED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('SUBMITTED')}
            >
              Submitted
            </button>
            <button 
              className={filterStatus === 'APPROVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Approved
            </button>
            <button 
              className={filterStatus === 'CONVERTED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('CONVERTED')}
            >
              Converted
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requisition #</th>
                <th>Date</th>
                <th>Requester</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Items</th>
                <th>Estimated Value</th>
                <th>Approver</th>
                <th>PO Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map((req) => (
                <tr key={req.id}>
                  <td className="code-cell">{req.number}</td>
                  <td>{new Date(req.date).toLocaleDateString('en-ZA')}</td>
                  <td>{req.requester}</td>
                  <td>{req.department}</td>
                  <td>
                    <span className={`status-badge status-${getPriorityColor(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="text-center">{req.item_count}</td>
                  <td className="amount-cell">{formatCurrency(req.estimated_value)}</td>
                  <td>{req.approver || <span className="text-muted">-</span>}</td>
                  <td>
                    {req.po_number ? (
                      <a href={`/purchase/orders?po=${req.po_number}`} className="link-text">
                        {req.po_number}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      {req.status === 'DRAFT' && (
                        <button className="btn-icon" title="Edit">✏️</button>
                      )}
                      {req.status === 'SUBMITTED' && (
                        <button className="btn-icon" title="Approve">✅</button>
                      )}
                      {req.status === 'APPROVED' && (
                        <button className="btn-icon" title="Convert to PO">📦</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequisitions.length === 0 && (
          <div className="empty-state">
            <p>No requisitions found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Requisitions</div>
          <div className="metric-value">{totalRequisitions}</div>
          <div className="metric-detail">All statuses</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Approval</div>
          <div className="metric-value">{pendingApproval}</div>
          <div className="metric-detail">Awaiting review</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Approved</div>
          <div className="metric-value">{approved}</div>
          <div className="metric-detail">Ready to convert</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Value</div>
          <div className="metric-value">{formatCurrency(totalValue)}</div>
          <div className="metric-detail">Estimated spend</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequisitionsPage;
