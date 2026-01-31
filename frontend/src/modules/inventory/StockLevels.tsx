/**
 * STOCK LEVELS
 * 
 * View current stock levels by item and warehouse
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api.service';

interface StockLevel {
  stock_level_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  category_name: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  on_hand_quantity: number;
  allocated_quantity: number;
  available_quantity: number;
  on_order_quantity: number;
  uom_code: string;
  average_cost: number;
  total_value: number;
  reorder_level: number;
  stock_status: string;
}

export default function StockLevels() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchStockLevels();
  }, []);

  const fetchStockLevels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/stock-levels`);
      const result = await response.json();
      
      if (result.success) {
        setStockLevels(result.data);
      }
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stockLevels.filter(stock => {
    const matchesSearch = 
      stock.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = !filterWarehouse || stock.warehouse_code === filterWarehouse;
    const matchesStatus = !filterStatus || stock.stock_status === filterStatus;

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'Normal': 'stock-normal',
      'Reorder Required': 'stock-reorder',
      'Below Minimum': 'stock-critical',
      'Overstock': 'status-warning'
    };
    return statusMap[status] || 'status-draft';
  };

  const uniqueWarehouses = Array.from(new Set(stockLevels.map(s => s.warehouse_code)));
  const uniqueStatuses = Array.from(new Set(stockLevels.map(s => s.stock_status)));

  if (loading) {
    return <div className="loading">Loading stock levels...</div>;
  }

  return (
    <div className="stock-levels">
      <div className="section-header">
        <h2 className="section-title">📈 Stock Levels</h2>
        <button className="btn btn-primary" onClick={fetchStockLevels}>
          🔄 Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
        >
          <option value="">All Warehouses</option>
          {uniqueWarehouses.map((wh) => (
            <option key={wh} value={wh}>{wh}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Stock Levels Table */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Warehouse</th>
            <th>On Hand</th>
            <th>Allocated</th>
            <th>Available</th>
            <th>On Order</th>
            <th>Avg Cost</th>
            <th>Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredStock.length > 0 ? (
            filteredStock.map((stock) => (
              <tr key={stock.stock_level_id}>
                <td><strong>{stock.item_code}</strong></td>
                <td>
                  <div>{stock.item_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>
                    {stock.category_name || 'No Category'}
                  </div>
                </td>
                <td>{stock.warehouse_name}</td>
                <td>{formatNumber(stock.on_hand_quantity)} {stock.uom_code}</td>
                <td style={{ color: '#dc3545' }}>
                  {formatNumber(stock.allocated_quantity)} {stock.uom_code}
                </td>
                <td style={{ color: '#28a745' }}>
                  <strong>{formatNumber(stock.available_quantity)} {stock.uom_code}</strong>
                </td>
                <td style={{ color: '#007bff' }}>
                  {formatNumber(stock.on_order_quantity)} {stock.uom_code}
                </td>
                <td>{formatCurrency(stock.average_cost || 0)}</td>
                <td><strong>{formatCurrency(stock.total_value || 0)}</strong></td>
                <td>
                  <span className={`status-badge ${getStatusBadge(stock.stock_status)}`}>
                    {stock.stock_status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
                No stock levels found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Summary */}
      <div className="stats-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{filteredStock.length}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Total Inventory Value</div>
          <div className="stat-value">
            {formatCurrency(filteredStock.reduce((sum, s) => sum + (s.total_value || 0), 0))}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Reorder Required</div>
          <div className="stat-value">
            {filteredStock.filter(s => s.stock_status === 'Reorder Required').length}
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Below Minimum</div>
          <div className="stat-value">
            {filteredStock.filter(s => s.stock_status === 'Below Minimum').length}
          </div>
        </div>
      </div>
    </div>
  );
}
