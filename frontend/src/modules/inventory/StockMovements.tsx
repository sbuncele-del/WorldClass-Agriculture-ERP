/**
 * STOCK MOVEMENTS
 * 
 * View and create stock movements (receipts, issues, transfers)
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api.service';

interface StockMovement {
  movement_id: number;
  movement_number: string;
  movement_date: string;
  movement_type: string;
  item_code: string;
  item_name: string;
  warehouse_code: string;
  warehouse_name: string;
  quantity: number;
  uom_code: string;
  unit_cost: number;
  total_value: number;
  reference_type: string;
  reference_number: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchMovements();
  }, [filterType, filterWarehouse, startDate, endDate]);

  const fetchMovements = async () => {
    try {
      let url = `${API_BASE_URL}/api/inventory/stock-movements?`;
      const params = new URLSearchParams();
      
      if (filterType) params.append('movement_type', filterType);
      if (filterWarehouse) params.append('warehouse_id', filterWarehouse);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(url + params.toString());
      const result = await response.json();
      
      if (result.success) {
        setMovements(result.data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const getMovementTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      'Receipt': 'status-approved',
      'Issue': 'status-warning',
      'Transfer': 'status-draft',
      'Adjustment': 'status-pending',
      'Return to Vendor': 'status-cancelled',
      'Return from Customer': 'status-approved'
    };
    return typeMap[type] || 'status-draft';
  };

  if (loading) {
    return <div className="loading">Loading stock movements...</div>;
  }

  return (
    <div className="stock-movements">
      <div className="section-header">
        <h2 className="section-title">🔄 Stock Movements</h2>
        <button className="btn btn-primary" onClick={fetchMovements}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="search-filter-bar">
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Movement Types</option>
          <option value="Receipt">Receipt</option>
          <option value="Issue">Issue</option>
          <option value="Transfer">Transfer</option>
          <option value="Adjustment">Adjustment</option>
          <option value="Return to Vendor">Return to Vendor</option>
          <option value="Return from Customer">Return from Customer</option>
        </select>

        <input
          type="date"
          className="filter-select"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
        />

        <input
          type="date"
          className="filter-select"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
        />
      </div>

      {/* Movements Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Movement #</th>
            <th>Date</th>
            <th>Type</th>
            <th>Item</th>
            <th>Warehouse</th>
            <th>Quantity</th>
            <th>Unit Cost</th>
            <th>Total Value</th>
            <th>Reference</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {movements.length > 0 ? (
            movements.map((mov) => (
              <tr key={mov.movement_id}>
                <td><strong>{mov.movement_number}</strong></td>
                <td>{new Date(mov.movement_date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge ${getMovementTypeBadge(mov.movement_type)}`}>
                    {mov.movement_type}
                  </span>
                </td>
                <td>
                  <div><strong>{mov.item_code}</strong></div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {mov.item_name}
                  </div>
                </td>
                <td>{mov.warehouse_code}</td>
                <td style={{ color: mov.quantity > 0 ? '#28a745' : '#dc3545' }}>
                  <strong>
                    {mov.quantity > 0 ? '+' : ''}
                    {formatNumber(mov.quantity)} {mov.uom_code}
                  </strong>
                </td>
                <td>{formatCurrency(mov.unit_cost || 0)}</td>
                <td><strong>{formatCurrency(mov.total_value || 0)}</strong></td>
                <td>
                  {mov.reference_type && (
                    <div>
                      <div style={{ fontSize: '0.875rem' }}>{mov.reference_type}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        {mov.reference_number}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${mov.status === 'Posted' ? 'status-approved' : 'status-draft'}`}>
                    {mov.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                No stock movements found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="stats-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card success">
          <div className="stat-label">Total Receipts</div>
          <div className="stat-value">
            {movements.filter(m => m.movement_type === 'Receipt').length}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Total Issues</div>
          <div className="stat-value">
            {movements.filter(m => m.movement_type === 'Issue').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Movements</div>
          <div className="stat-value">{movements.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Value</div>
          <div className="stat-value">
            {formatCurrency(movements.reduce((sum, m) => sum + Math.abs(m.total_value || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
