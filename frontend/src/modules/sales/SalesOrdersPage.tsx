import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface SalesOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  total_amount: number;
  status: 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  items_count: number;
}

const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/sales/orders');
      const data = response.data;
      // Map API response to component interface
      const mappedOrders = (data.orders || data || []).map((order: any) => ({
        order_id: order.id || order.order_id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        order_date: order.order_date,
        delivery_date: order.promised_date || order.delivery_date || order.required_date,
        total_amount: order.total_amount || 0,
        status: order.status || 'CONFIRMED',
        payment_status: order.payment_status || 'PENDING',
        items_count: order.items_count || order.line_count || 0
      }));
      setOrders(mappedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'CONFIRMED': '#3b82f6',
      'PROCESSING': '#f59e0b',
      'SHIPPED': '#8b5cf6',
      'DELIVERED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'PAID': '#10b981',
      'PARTIAL': '#f59e0b',
      'PENDING': '#3b82f6',
      'OVERDUE': '#ef4444'
    };
    return colors[status] || '#64748b';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Delivery Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>{order.order_number}</td>
                  <td style={{ fontWeight: 600 }}>{order.customer_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#f3f4f6',
                      color: '#374151'
                    }}>
                      {order.items_count} items
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(order.total_amount)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getStatusColor(order.status)}15`,
                      color: getStatusColor(order.status)
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getPaymentStatusColor(order.payment_status)}15`,
                      color: getPaymentStatusColor(order.payment_status)
                    }}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <button style={{
                      background: 'white',
                      color: '#667eea',
                      border: '2px solid #667eea',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{orders.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{orders.filter(o => o.status === 'PROCESSING').length} In Progress</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Value</div>
            <div className="metric-value">
              {formatCurrency(orders.reduce((sum, o) => sum + o.total_amount, 0))}
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Delivered</div>
            <div className="metric-value">{orders.filter(o => o.status === 'DELIVERED').length}</div>
            <div className="metric-trend">
              <span className="profit-margin">Completed orders</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <div className="metric-label">Paid Orders</div>
            <div className="metric-value">{orders.filter(o => o.payment_status === 'PAID').length}</div>
            <div className="metric-detail">
              <span className="pending-badge">
                {orders.filter(o => o.payment_status === 'PENDING').length} Pending payment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrdersPage;
