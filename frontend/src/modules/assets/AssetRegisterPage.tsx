import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Asset {
  id: string;
  asset_number: string;
  description: string;
  category: string;
  location: string;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'WRITTEN_OFF';
  purchase_date: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  book_value: number;
  useful_life_years: number;
  depreciation_method: 'STRAIGHT_LINE' | 'DIMINISHING_BALANCE' | 'UNITS_OF_PRODUCTION';
  custodian: string;
}

const AssetRegisterPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/assets');
      const data = response.data?.data || response.data || [];
      setAssets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.message || 'Failed to load assets');
      setAssets([]);
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
      'UNDER_MAINTENANCE': 'orange',
      'DISPOSED': 'gray',
      'WRITTEN_OFF': 'red'
    };
    return colors[status] || 'gray';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || asset.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalAssets = assets.length;
  const totalCost = assets.reduce((sum, a) => sum + a.purchase_cost, 0);
  const totalDepreciation = assets.reduce((sum, a) => sum + a.accumulated_depreciation, 0);
  const totalBookValue = assets.reduce((sum, a) => sum + a.book_value, 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading asset register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>📋 Fixed Asset Register</h2>
          <button className="btn-primary">+ Add Asset</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by description, asset number, or category..."
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
              className={filterStatus === 'UNDER_MAINTENANCE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('UNDER_MAINTENANCE')}
            >
              Maintenance
            </button>
            <button 
              className={filterStatus === 'DISPOSED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('DISPOSED')}
            >
              Disposed
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Number</th>
                <th>Description</th>
                <th>Category</th>
                <th>Status</th>
                <th>Purchase Cost</th>
                <th>Acc. Depreciation</th>
                <th>Book Value</th>
                <th>Useful Life</th>
                <th>Custodian</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="code-cell">{asset.asset_number}</td>
                  <td>
                    <div className="asset-desc">{asset.description}</div>
                    <div className="asset-location">{asset.location}</div>
                  </td>
                  <td>{asset.category}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(asset.status)}`}>
                      {asset.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="amount-cell">{formatCurrency(asset.purchase_cost)}</td>
                  <td className="amount-cell text-danger">{formatCurrency(asset.accumulated_depreciation)}</td>
                  <td className="amount-cell text-success">{formatCurrency(asset.book_value)}</td>
                  <td className="text-center">{asset.useful_life_years} years</td>
                  <td>{asset.custodian}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      <button className="btn-icon" title="Edit">✏️</button>
                      <button className="btn-icon" title="Transfer">🔄</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Assets</div>
          <div className="metric-value">{totalAssets}</div>
          <div className="metric-detail">In register</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Cost</div>
          <div className="metric-value">{formatCurrency(totalCost)}</div>
          <div className="metric-detail">Purchase value</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Accumulated Depreciation</div>
          <div className="metric-value">{formatCurrency(totalDepreciation)}</div>
          <div className="metric-detail">To date</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Net Book Value</div>
          <div className="metric-value">{formatCurrency(totalBookValue)}</div>
          <div className="metric-detail">Current value</div>
        </div>
      </div>
    </div>
  );
};

export default AssetRegisterPage;
