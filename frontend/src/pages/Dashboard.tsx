import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  sales: {
    current: number;
    previous: number;
    change: number;
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
  };
  profit: {
    current: number;
    previous: number;
    change: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'invoice' | 'order' | 'payment' | 'expense';
  title: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface InventoryAlert {
  id: string;
  productName: string;
  currentStock: number;
  minStock: number;
  severity: 'critical' | 'warning';
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    revenue: { current: 0, previous: 0, change: 0 },
    sales: { current: 0, previous: 0, change: 0 },
    expenses: { current: 0, previous: 0, change: 0 },
    profit: { current: 0, previous: 0, change: 0 },
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes, alertsRes, productsRes] = await Promise.all([
        fetch('/api/financial/dashboard/metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/dashboard/activity', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/dashboard/inventory-alerts', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/dashboard/top-products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (activityRes.ok) {
        const data = await activityRes.json();
        setRecentActivity(data);
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setInventoryAlerts(data);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setTopProducts(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'invoice': return '📄';
      case 'order': return '🛒';
      case 'payment': return '💰';
      case 'expense': return '💳';
      default: return '📌';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'status-success';
      case 'pending': return 'status-warning';
      case 'overdue': return 'status-danger';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-secondary" onClick={fetchDashboardData}>
            🔄 Refresh
          </button>
          <button className="btn-primary">
            ➕ Quick Action
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon revenue">💰</span>
            <span className="metric-label">Revenue</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.revenue.current)}</div>
          <div className={`metric-change ${metrics.revenue.change >= 0 ? 'positive' : 'negative'}`}>
            <span>{metrics.revenue.change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(metrics.revenue.change).toFixed(1)}% from last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon sales">📈</span>
            <span className="metric-label">Sales Orders</span>
          </div>
          <div className="metric-value">{metrics.sales.current}</div>
          <div className={`metric-change ${metrics.sales.change >= 0 ? 'positive' : 'negative'}`}>
            <span>{metrics.sales.change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(metrics.sales.change).toFixed(1)}% from last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon expenses">💳</span>
            <span className="metric-label">Expenses</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.expenses.current)}</div>
          <div className={`metric-change ${metrics.expenses.change <= 0 ? 'positive' : 'negative'}`}>
            <span>{metrics.expenses.change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(metrics.expenses.change).toFixed(1)}% from last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon profit">💎</span>
            <span className="metric-label">Net Profit</span>
          </div>
          <div className="metric-value">{formatCurrency(metrics.profit.current)}</div>
          <div className={`metric-change ${metrics.profit.change >= 0 ? 'positive' : 'negative'}`}>
            <span>{metrics.profit.change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(metrics.profit.change).toFixed(1)}% from last month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Recent Activity</h2>
            <a href="/activity" className="widget-link">View All</a>
          </div>
          <div className="widget-content">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                    <div className="activity-amount">
                      <div className="amount">{formatCurrency(activity.amount)}</div>
                      <span className={`status-badge ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Inventory Alerts</h2>
            <a href="/inventory" className="widget-link">Manage</a>
          </div>
          <div className="widget-content">
            {inventoryAlerts.length === 0 ? (
              <div className="empty-state success">
                <span className="empty-icon">✅</span>
                <p>All inventory levels are healthy</p>
              </div>
            ) : (
              <div className="alerts-list">
                {inventoryAlerts.map((alert) => (
                  <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                    <span className="alert-icon">
                      {alert.severity === 'critical' ? '🚨' : '⚠️'}
                    </span>
                    <div className="alert-details">
                      <div className="alert-product">{alert.productName}</div>
                      <div className="alert-stock">
                        {alert.currentStock} units (Min: {alert.minStock})
                      </div>
                    </div>
                    <button className="btn-text">Reorder</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="dashboard-widget">
          <div className="widget-header">
            <h2>Top Products</h2>
            <a href="/sales/reports" className="widget-link">Full Report</a>
          </div>
          <div className="widget-content">
            {topProducts.length === 0 ? (
              <div className="empty-state">
                <p>No sales data available</p>
              </div>
            ) : (
              <div className="products-list">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="product-item">
                    <div className="product-rank">#{index + 1}</div>
                    <div className="product-details">
                      <div className="product-name">{product.name}</div>
                      <div className="product-stats">
                        {product.sales} units sold
                      </div>
                    </div>
                    <div className="product-revenue">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-widget quick-actions">
          <div className="widget-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="widget-content">
            <div className="quick-actions-grid">
              <a href="/sales/invoice/new" className="quick-action-card">
                <span className="action-icon">📄</span>
                <div className="action-label">New Invoice</div>
              </a>
              <a href="/sales/quote/new" className="quick-action-card">
                <span className="action-icon">💬</span>
                <div className="action-label">New Quote</div>
              </a>
              <a href="/purchase/order/new" className="quick-action-card">
                <span className="action-icon">🛒</span>
                <div className="action-label">Purchase Order</div>
              </a>
              <a href="/inventory/product/new" className="quick-action-card">
                <span className="action-icon">📦</span>
                <div className="action-label">Add Product</div>
              </a>
              <a href="/financial/entry/new" className="quick-action-card">
                <span className="action-icon">💼</span>
                <div className="action-label">Journal Entry</div>
              </a>
              <a href="/expenses/new" className="quick-action-card">
                <span className="action-icon">💳</span>
                <div className="action-label">Record Expense</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
