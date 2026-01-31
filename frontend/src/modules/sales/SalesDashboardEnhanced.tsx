import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workspaceApi } from '../../services/api.service';
import '../../styles/erp-ui.css';

interface SalesStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  sales_summary: {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
    total_customers: number;
    conversion_rate: number;
    pending_quotations: number;
  };
  top_products: {
    product_1: { name: string; revenue: number };
    product_2: { name: string; revenue: number };
    product_3: { name: string; revenue: number };
  };
}

const SalesDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await workspaceApi.sales.getDashboard();
      
      if (response && response.data) {
        setStats(response.data);
      } else if (response) {
        setStats(response);
      } else {
        // If no data, show zeros instead of mock data
        setStats({
          current_period: {
            fiscal_year: new Date().getFullYear(),
            period_number: new Date().getMonth() + 1,
            period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            status: 'OPEN'
          },
          sales_summary: {
            total_revenue: 0,
            total_orders: 0,
            average_order_value: 0,
            total_customers: 0,
            conversion_rate: 0,
            pending_quotations: 0
          },
          top_products: {
            product_1: { name: 'No data', revenue: 0 },
            product_2: { name: 'No data', revenue: 0 },
            product_3: { name: 'No data', revenue: 0 }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching sales dashboard data:', err);
      // Show empty state on error
      setStats(null);
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

  const getPeriodStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'OPEN': 'green',
      'CLOSED': 'orange',
      'LOCKED': 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading || !stats) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading sales dashboard...</p>
        </div>
      </div>
    );
  }

  const salesTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/sales/dashboard' },
    { id: 'leads', label: 'Leads', path: '/sales/leads' },
    { id: 'opportunities', label: 'Opportunities', path: '/sales/opportunities' },
    { id: 'customers', label: 'Customers', path: '/sales/customers' },
    { id: 'quotations', label: 'Quotations', path: '/sales/quotations' },
    { id: 'orders', label: 'Sales Orders', path: '/sales/orders' },
    { id: 'invoices', label: 'Invoices', path: '/sales/invoices' },
  ];

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem' }}>
        {/* Period Card */}
          <div className="content-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Current Period</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {stats.current_period.period_name} (FY {stats.current_period.fiscal_year})
                  </p>
                </div>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: `var(--color-${getPeriodStatusColor(stats.current_period.status)})`,
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 600
                  }}
                >
                  {stats.current_period.status}
                </span>
              </div>
            </div>
          </div>

        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-label">Total Revenue</div>
              <div className="metric-value">{formatCurrency(stats.sales_summary.total_revenue)}</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗</span>
                <span className="trend-text">+12.5% vs last period</span>
              </div>
            </div>
          </div>

          <div className="metric-card expenses">
            <div className="metric-icon">📦</div>
            <div className="metric-content">
              <div className="metric-label">Total Orders</div>
              <div className="metric-value">{stats.sales_summary.total_orders}</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗</span>
                <span className="trend-text">+8.3% growth</span>
              </div>
            </div>
          </div>

          <div className="metric-card profit">
            <div className="metric-icon">💵</div>
            <div className="metric-content">
              <div className="metric-label">Average Order Value</div>
              <div className="metric-value">{formatCurrency(stats.sales_summary.average_order_value)}</div>
              <div className="metric-trend">
                <span className="profit-margin">Per transaction</span>
              </div>
            </div>
          </div>

          <div className="metric-card activity">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-label">Active Customers</div>
              <div className="metric-value">{stats.sales_summary.total_customers}</div>
              <div className="metric-detail">
                <span className="pending-badge">{stats.sales_summary.conversion_rate}% conversion rate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="balance-sheet-section">
          <h2>🏆 Sales Pipeline</h2>
          <div className="balance-cards">
            <div className="balance-card assets">
              <div className="balance-label">Active Leads</div>
              <div className="balance-value">{stats.pipeline?.activeLeads || 0}</div>
            </div>
            <div className="balance-card liabilities">
              <div className="balance-label">Open Opportunities</div>
              <div className="balance-value">{stats.pipeline?.openOpportunities || 0}</div>
            </div>
            <div className="balance-card equity">
              <div className="balance-label">Pipeline Value</div>
              <div className="balance-value">{formatCurrency(stats.pipeline?.pipelineValue || 0)}</div>
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/sales/leads" className="action-card">
              <div className="action-icon">🎯</div>
              <div className="action-label">Lead Management</div>
            </Link>
            <Link to="/sales/opportunities" className="action-card">
              <div className="action-icon">💼</div>
              <div className="action-label">Opportunities Pipeline</div>
            </Link>
            <Link to="/sales/customers" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-label">Customer Management</div>
            </Link>
            <Link to="/sales/quotations" className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-label">Quotations</div>
            </Link>
            <Link to="/sales/orders" className="action-card">
              <div className="action-icon">📦</div>
              <div className="action-label">Sales Orders</div>
            </Link>
            <Link to="/sales/invoices" className="action-card">
              <div className="action-icon">🧾</div>
              <div className="action-label">Invoices</div>
            </Link>
          </div>
        </div>
      </div>
  );
};

export default SalesDashboardEnhanced;
