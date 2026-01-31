import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Download } from 'lucide-react';
import { salesService, type SalesOrder } from '../../services/sales.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import './OrdersList.css';

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await salesService.getOrders({ limit: 100 });
      if (data && data.data) {
        setOrders(data.data);
      } else if (data && Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner size="large" text="Loading orders..." />;

  return (
    <div className="orders-list-page">
      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>
          <p className="page-subtitle">Manage and track all sales orders</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} />
          New Order
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="toolbar-actions">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <button className="btn-secondary">
            <Filter size={18} />
            More Filters
          </button>
          
          <button className="btn-secondary">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Amount</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td className="font-medium">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                  <td>
                    <span className={`status-badge status-${order.order_status.toLowerCase()}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td>
                    <span className={`payment-badge payment-${order.payment_status.toLowerCase()}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-action">View</button>
                      <button className="btn-action">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-footer">
          <p>Showing {filteredOrders.length} of {orders.length} orders</p>
          <div className="pagination">
            <button className="btn-page">Previous</button>
            <button className="btn-page active">1</button>
            <button className="btn-page">2</button>
            <button className="btn-page">3</button>
            <button className="btn-page">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
