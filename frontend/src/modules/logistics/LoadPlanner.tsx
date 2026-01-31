import React, { useState, useEffect } from 'react';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface SalesOrder {
  id: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  distance: string;
  itemCount: number;
  weight: string;
  volume: string;
  value: string;
  priority: string;
  status: 'ready' | 'pending' | 'in-progress';
}

export default function LoadPlanner() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [pendingSalesOrders, setPendingSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get('/api/logistics/loads');
        setPendingSalesOrders(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Load Planner' }
  ];

  // Pending sales orders loaded from API

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateTrip = () => {
    if (selectedOrders.length > 0) {
      console.log('Creating trip with orders:', selectedOrders);
      // Navigate to trip creation with selected orders
      window.location.href = `/logistics/trips/new?orders=${selectedOrders.join(',')}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#64748b';
      default: return '#64748b';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴 URGENT';
      case 'high': return '🟠 HIGH';
      case 'medium': return '🔵 MEDIUM';
      case 'low': return '⚪ LOW';
      default: return priority.toUpperCase();
    }
  };

  return (
    <EnterpriseLayout
      moduleTitle="📋 Load Planner"
      moduleSubtitle="Plan and allocate deliveries from confirmed sales orders"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actionButtons={[
        {
          label: `✓ Create Trip (${selectedOrders.length})`,
          icon: <span>🚚</span>,
          variant: 'primary' as const,
          onClick: handleCreateTrip,
          disabled: selectedOrders.length === 0
        },
        {
          label: 'Auto-Optimize',
          icon: <span>🤖</span>,
          variant: 'secondary' as const,
          onClick: () => console.log('Auto-optimize routes')
        }
      ]}
    >
      {/* Summary KPIs */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="metric-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="metric-header">
            <span className="metric-label">📋 Pending Orders</span>
          </div>
          <div className="metric-value">{pendingSalesOrders.length}</div>
          <div className="metric-footer">
            <span className="metric-change">Ready for allocation</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="metric-header">
            <span className="metric-label">🔴 Urgent</span>
          </div>
          <div className="metric-value">
            {pendingSalesOrders.filter(o => o.priority === 'urgent').length}
          </div>
          <div className="metric-footer">
            <span className="metric-change danger">Delivery tomorrow</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">📦 Total Items</span>
          </div>
          <div className="metric-value">
            {pendingSalesOrders.reduce((sum, o) => sum + o.itemCount, 0).toLocaleString()}
          </div>
          <div className="metric-footer">
            <span className="metric-change">Across all orders</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">⚖️ Total Weight</span>
          </div>
          <div className="metric-value">
            {(pendingSalesOrders.reduce((sum, o) => sum + parseFloat(o.weight.replace(/,/g, '')), 0) / 1000).toFixed(1)}t
          </div>
          <div className="metric-footer">
            <span className="metric-change">Combined weight</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">💰 Total Value</span>
          </div>
          <div className="metric-value">R 1.03M</div>
          <div className="metric-footer">
            <span className="metric-change">Goods in transit</span>
          </div>
        </div>
      </div>

      {/* Pending Sales Orders Table */}
      <div className="content-card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <span style={{ marginRight: '0.5rem' }}>📦</span>
            Sales Orders Ready for Load Planning
            <span style={{ 
              marginLeft: '0.75rem', 
              padding: '0.25rem 0.75rem', 
              background: '#3b82f6', 
              color: 'white', 
              borderRadius: '50px', 
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {pendingSalesOrders.length} PENDING
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="filter-select" style={{ padding: '0.5rem 1rem' }}>
              <option>All Priorities</option>
              <option>🔴 Urgent Only</option>
              <option>🟠 High Priority</option>
              <option>🔵 Medium Priority</option>
            </select>
            <select className="filter-select" style={{ padding: '0.5rem 1rem' }}>
              <option>All Destinations</option>
              <option>Cape Town</option>
              <option>Durban</option>
              <option>Pretoria</option>
            </select>
          </div>
        </div>
        <div className="card-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(pendingSalesOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      checked={selectedOrders.length === pendingSalesOrders.length}
                    />
                  </th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Route</th>
                  <th>Delivery Date</th>
                  <th>Items</th>
                  <th>Weight</th>
                  <th>Volume</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingSalesOrders.map((order) => (
                  <tr 
                    key={order.id}
                    style={{ 
                      background: selectedOrders.includes(order.id) ? '#eff6ff' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#3b82f6' }}>{order.id}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Ordered: {order.orderDate}
                      </div>
                    </td>
                    <td>
                      <strong>{order.customerName}</strong>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: `${getPriorityColor(order.priority)}20`,
                        color: getPriorityColor(order.priority)
                      }}>
                        {getPriorityLabel(order.priority)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>From:</strong> {order.origin}
                      </div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>To:</strong> {order.destination}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                        📍 {order.distance}
                      </div>
                    </td>
                    <td>
                      <strong style={{ 
                        color: order.priority === 'urgent' ? '#ef4444' : '#334155' 
                      }}>
                        {order.deliveryDate}
                      </strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {order.priority === 'urgent' ? '⚠️ Tomorrow' : 
                         order.priority === 'high' ? '2 days' : '3+ days'}
                      </div>
                    </td>
                    <td>
                      <strong>{order.itemCount}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>items</div>
                    </td>
                    <td>
                      <strong>{order.weight}</strong>
                    </td>
                    <td>
                      <strong>{order.volume}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>{order.value}</strong>
                    </td>
                    <td>
                      <button 
                        className="action-button primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/logistics/trips/new?order=${order.id}`;
                        }}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                      >
                        🚚 Allocate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Orders Summary */}
      {selectedOrders.length > 0 && (
        <div className="content-card" style={{ 
          marginTop: '1.5rem', 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          border: '2px solid #3b82f6'
        }}>
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem' }}>
                  ✓ {selectedOrders.length} Order{selectedOrders.length !== 1 ? 's' : ''} Selected
                </h3>
                <div style={{ fontSize: '0.9375rem', color: '#64748b' }}>
                  Ready to create trip and allocate vehicle & driver
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="action-button"
                  onClick={() => setSelectedOrders([])}
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  ✕ Clear Selection
                </button>
                <button 
                  className="action-button primary"
                  onClick={handleCreateTrip}
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
                >
                  🚚 Create Trip with Selected Orders →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EnterpriseLayout>
  );
}
