import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_code: string;
  order_date: string;
  delivery_date: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  payment_terms: string;
  total_amount: number;
  item_count: number;
  received_items: number;
  requester: string;
  department: string;
  pr_number: string | null;
  notes: string;
}

const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/purchase/orders');
      setOrders(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
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
      'SENT': 'blue',
      'CONFIRMED': 'green',
      'PARTIALLY_RECEIVED': 'orange',
      'RECEIVED': 'purple',
      'CANCELLED': 'red'
    };
    return colors[status] || 'gray';
  };

  const getReceivingProgress = (received: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((received / total) * 100);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requester.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'ALL' || order.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(o.status)).length;
  const totalValue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingReceipt = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PARTIALLY_RECEIVED').length;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>📦 Purchase Orders</h2>
          <button className="btn-primary">+ New PO</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search orders by PO number, supplier, or requester..."
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
              className={filterStatus === 'SENT' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('SENT')}
            >
              Sent
            </button>
            <button 
              className={filterStatus === 'CONFIRMED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('CONFIRMED')}
            >
              Confirmed
            </button>
            <button 
              className={filterStatus === 'PARTIALLY_RECEIVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('PARTIALLY_RECEIVED')}
            >
              Partial
            </button>
            <button 
              className={filterStatus === 'RECEIVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('RECEIVED')}
            >
              Received
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Order Date</th>
                <th>Supplier</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Receiving Progress</th>
                <th>Amount</th>
                <th>Payment Terms</th>
                <th>Requester</th>
                <th>PR Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="code-cell">{order.po_number}</td>
                  <td>{new Date(order.order_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <div className="supplier-info">
                      <div className="supplier-name">{order.supplier_name}</div>
                      <div className="supplier-code">{order.supplier_code}</div>
                    </div>
                  </td>
                  <td>{new Date(order.delivery_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{width: `${getReceivingProgress(order.received_items, order.item_count)}%`}}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {order.received_items}/{order.item_count} items
                      </span>
                    </div>
                  </td>
                  <td className="amount-cell">{formatCurrency(order.total_amount)}</td>
                  <td>{order.payment_terms}</td>
                  <td>{order.requester}</td>
                  <td>
                    {order.pr_number ? (
                      <a href={`/purchase/requisitions?pr=${order.pr_number}`} className="link-text">
                        {order.pr_number}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      {order.status === 'DRAFT' && (
                        <button className="btn-icon" title="Edit">✏️</button>
                      )}
                      {(order.status === 'CONFIRMED' || order.status === 'PARTIALLY_RECEIVED') && (
                        <button className="btn-icon" title="Receive Goods">📥</button>
                      )}
                      <button className="btn-icon" title="Print PO">🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <p>No purchase orders found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{totalOrders}</div>
          <div className="metric-detail">All statuses</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Orders</div>
          <div className="metric-value">{activeOrders}</div>
          <div className="metric-detail">In progress</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Value</div>
          <div className="metric-value">{formatCurrency(totalValue)}</div>
          <div className="metric-detail">All orders</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Receipt</div>
          <div className="metric-value">{pendingReceipt}</div>
          <div className="metric-detail">Awaiting delivery</div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
