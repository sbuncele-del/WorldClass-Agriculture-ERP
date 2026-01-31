import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './SalesOrderManagement.css';

interface SalesOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  order_date: string;
  required_date: string;
  promised_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  delivered: boolean;
  invoiced: boolean;
  sales_person: string;
  priority: string;
}

interface OrderLine {
  id?: number;
  line_number: number;
  item_code: string;
  description: string;
  quantity: number;
  quantity_delivered: number;
  quantity_invoiced: number;
  unit_of_measure: string;
  unit_price: number;
  line_total: number;
}

const SalesOrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`${API_BASE_URL}/api/sales/orders?${params}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/orders/${id}`);
      const data = await response.json();
      setSelectedOrder(data.order);
      setOrderLines(data.lines || []);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
        if (selectedOrder?.id === id) {
          fetchOrderDetails(id);
        }
        alert('Order status updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleCreateInvoice = async (orderId: number) => {
    if (!confirm('Create invoice from this order?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/sales/invoices/from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });

      if (response.ok) {
        fetchOrders();
        alert('Invoice created successfully!');
        setIsModalOpen(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': 'gray',
      'PENDING': 'blue',
      'CONFIRMED': 'green',
      'PROCESSING': 'orange',
      'FULFILLED': 'purple',
      'INVOICED': 'teal',
      'CLOSED': 'dark-gray',
      'CANCELLED': 'red'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'green',
      'NORMAL': 'blue',
      'HIGH': 'orange',
      'URGENT': 'red'
    };
    return colors[priority] || 'blue';
  };

  const calculateFulfillment = (line: OrderLine) => {
    return (line.quantity_delivered / line.quantity) * 100;
  };

  return (
    <div className="order-management">
      <div className="order-header">
        <h1>Sales Order Management</h1>
      </div>

      <div className="order-filters">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="INVOICED">Invoiced</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading && <div className="loading">Loading orders...</div>}

      <div className="order-grid">
        <table className="order-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Required Date</th>
              <th>Amount</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Fulfillment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span
                    className="order-number"
                    onClick={() => fetchOrderDetails(order.id)}
                  >
                    {order.order_number}
                  </span>
                </td>
                <td>{order.customer_name}</td>
                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                <td>{new Date(order.required_date).toLocaleDateString()}</td>
                <td className="text-right">R {order.total_amount?.toLocaleString()}</td>
                <td>
                  <span className={`priority-badge priority-${getPriorityColor(order.priority)}`}>
                    {order.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {order.invoiced && <span className="invoiced-badge">✓ Invoiced</span>}
                </td>
                <td>
                  <div className="fulfillment-indicator">
                    {order.delivered ? (
                      <span className="fulfilled">✓ Delivered</span>
                    ) : (
                      <span className="pending">⏳ Pending</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    {order.status === 'FULFILLED' && !order.invoiced && (
                      <button
                        className="btn-sm btn-success"
                        onClick={() => handleCreateInvoice(order.id)}
                      >
                        📄 Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sales Order {selectedOrder.order_number}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="order-view">
                <div className="view-header">
                  <div className="view-info">
                    <h3>{selectedOrder.customer_name}</h3>
                    <p>Order: {selectedOrder.order_number}</p>
                    <p>Order Date: {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                    <p>Required: {new Date(selectedOrder.required_date).toLocaleDateString()}</p>
                  </div>
                  <div className="view-status">
                    <span className={`status-badge large status-${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                    <span className={`priority-badge large priority-${getPriorityColor(selectedOrder.priority)}`}>
                      {selectedOrder.priority}
                    </span>
                  </div>
                </div>

                <div className="status-timeline">
                  <h4>Order Progress</h4>
                  <div className="timeline">
                    <div className={`timeline-step ${['CONFIRMED', 'PROCESSING', 'FULFILLED', 'INVOICED', 'CLOSED'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-marker">✓</div>
                      <div className="step-label">Confirmed</div>
                    </div>
                    <div className={`timeline-step ${['PROCESSING', 'FULFILLED', 'INVOICED', 'CLOSED'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-marker">✓</div>
                      <div className="step-label">Processing</div>
                    </div>
                    <div className={`timeline-step ${['FULFILLED', 'INVOICED', 'CLOSED'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-marker">✓</div>
                      <div className="step-label">Fulfilled</div>
                    </div>
                    <div className={`timeline-step ${['INVOICED', 'CLOSED'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-marker">✓</div>
                      <div className="step-label">Invoiced</div>
                    </div>
                    <div className={`timeline-step ${selectedOrder.status === 'CLOSED' ? 'completed' : ''}`}>
                      <div className="step-marker">✓</div>
                      <div className="step-label">Closed</div>
                    </div>
                  </div>
                </div>

                <div className="line-items-view">
                  <h4>Order Lines</h4>
                  <table className="lines-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Ordered</th>
                        <th>Delivered</th>
                        <th>Invoiced</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderLines.map((line) => (
                        <tr key={line.id || line.line_number}>
                          <td>{line.line_number}</td>
                          <td>{line.item_code}</td>
                          <td>{line.description}</td>
                          <td>{line.quantity} {line.unit_of_measure}</td>
                          <td>{line.quantity_delivered} {line.unit_of_measure}</td>
                          <td>{line.quantity_invoiced} {line.unit_of_measure}</td>
                          <td>R {line.unit_price.toLocaleString()}</td>
                          <td>R {line.line_total.toLocaleString()}</td>
                          <td>
                            <div className="fulfillment-bar">
                              <div
                                className="fulfillment-fill"
                                style={{ width: `${calculateFulfillment(line)}%` }}
                              />
                              <span>{Math.round(calculateFulfillment(line))}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="totals-view">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>R {selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>R {selectedOrder.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total:</span>
                    <span>R {selectedOrder.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  {selectedOrder.status === 'PENDING' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                    >
                      Start Processing
                    </button>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'FULFILLED')}
                    >
                      Mark as Fulfilled
                    </button>
                  )}
                  {selectedOrder.status === 'FULFILLED' && !selectedOrder.invoiced && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleCreateInvoice(selectedOrder.id)}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Invoice'}
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderManagement;
