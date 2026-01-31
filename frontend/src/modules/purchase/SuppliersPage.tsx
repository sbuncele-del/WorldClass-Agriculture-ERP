import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PROSPECT';
  total_spend: number;
  outstanding_balance: number;
  payment_terms: string;
  credit_limit: number;
  on_time_delivery: number;
  quality_score: number;
  last_order_date: string;
}

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/purchase/suppliers');
      const data = response.data?.data || response.data || [];
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      setError(err.response?.data?.message || 'Failed to load suppliers');
      setSuppliers([]);
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
      'ACTIVE': 'green',
      'INACTIVE': 'gray',
      'BLOCKED': 'red',
      'PROSPECT': 'blue'
    };
    return colors[status] || 'gray';
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'orange';
    return 'red';
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || supplier.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
  const totalSpend = suppliers.reduce((sum, s) => sum + s.total_spend, 0);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstanding_balance, 0);
  const avgDeliveryPerformance = suppliers.filter(s => s.on_time_delivery > 0).length > 0
    ? suppliers.filter(s => s.on_time_delivery > 0).reduce((sum, s) => sum + s.on_time_delivery, 0) / 
      suppliers.filter(s => s.on_time_delivery > 0).length
    : 0;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>🏢 Supplier Management</h2>
          <button className="btn-primary">+ New Supplier</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search suppliers by name, code, or contact..."
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
              className={filterStatus === 'ACTIVE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              Active
            </button>
            <button 
              className={filterStatus === 'INACTIVE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('INACTIVE')}
            >
              Inactive
            </button>
            <button 
              className={filterStatus === 'PROSPECT' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('PROSPECT')}
            >
              Prospects
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Total Spend</th>
                <th>Outstanding</th>
                <th>On-Time %</th>
                <th>Quality</th>
                <th>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="code-cell">{supplier.code}</td>
                  <td className="name-cell">
                    <div className="supplier-name">{supplier.name}</div>
                    <div className="supplier-email">{supplier.email}</div>
                  </td>
                  <td>{supplier.contact_person}</td>
                  <td>{supplier.phone}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(supplier.status)}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="amount-cell">{formatCurrency(supplier.total_spend)}</td>
                  <td className="amount-cell">
                    <span className={supplier.outstanding_balance > 0 ? 'text-warning' : ''}>
                      {formatCurrency(supplier.outstanding_balance)}
                    </span>
                  </td>
                  <td>
                    {supplier.on_time_delivery > 0 ? (
                      <span className={`performance-badge badge-${getPerformanceColor(supplier.on_time_delivery)}`}>
                        {supplier.on_time_delivery}%
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {supplier.quality_score > 0 ? (
                      <span className={`performance-badge badge-${getPerformanceColor(supplier.quality_score)}`}>
                        {supplier.quality_score}%
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>{supplier.payment_terms}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      <button className="btn-icon" title="Edit">✏️</button>
                      <button className="btn-icon" title="Create PO">📦</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="empty-state">
            <p>No suppliers found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Suppliers</div>
          <div className="metric-value">{totalSuppliers}</div>
          <div className="metric-detail">{activeSuppliers} active</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Spend</div>
          <div className="metric-value">{formatCurrency(totalSpend)}</div>
          <div className="metric-detail">Current period</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Outstanding Balance</div>
          <div className="metric-value">{formatCurrency(totalOutstanding)}</div>
          <div className="metric-detail">Accounts payable</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Delivery Performance</div>
          <div className="metric-value">{avgDeliveryPerformance.toFixed(1)}%</div>
          <div className="metric-detail">On-time delivery</div>
        </div>
      </div>
    </div>
  );
};

export default SuppliersPage;
