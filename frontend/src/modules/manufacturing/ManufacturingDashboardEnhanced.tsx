import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { Factory, Wrench, FileText, TrendingUp, Plus, Boxes, Settings, Activity } from 'lucide-react';
import '../../styles/erp-ui.css';

interface ManufacturingStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  manufacturing_summary: {
    active_orders: number;
    work_centers: number;
    total_boms: number;
    capacity_utilization: number;
    on_time_delivery: number;
    defect_rate: number;
  };
  top_products: {
    prod_1: { name: string; quantity: number };
    prod_2: { name: string; quantity: number };
    prod_3: { name: string; quantity: number };
  };
}

const ManufacturingDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<ManufacturingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/manufacturing/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching manufacturing dashboard data:', err);
      // Fallback to default data if API fails
      setStats({
        current_period: {
          fiscal_year: 2025,
          period_number: 12,
          period_name: 'December 2025',
          status: 'OPEN'
        },
        manufacturing_summary: {
          active_orders: 0,
          work_centers: 0,
          total_boms: 0,
          capacity_utilization: 0,
          on_time_delivery: 0,
          defect_rate: 0
        },
        top_products: {
          prod_1: { name: 'No data', quantity: 0 },
          prod_2: { name: 'No data', quantity: 0 },
          prod_3: { name: 'No data', quantity: 0 }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'OPEN': 'green',
      'CLOSED': 'orange',
      'LOCKED': 'red',
    };
    return colors[status] || 'gray';
  };

  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value >= threshold) return 'green';
    if (value >= threshold * 0.8) return 'orange';
    return 'red';
  };

  const mfgTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/manufacturing/dashboard' },
    { id: 'work-orders', label: 'Work Orders', path: '/manufacturing/work-orders' },
    { id: 'work-centers', label: 'Work Centers', path: '/manufacturing/work-centers' },
    { id: 'boms', label: 'BOMs', path: '/manufacturing/boms' },
    { id: 'routing', label: 'Routing', path: '/manufacturing/routing' },
    { id: 'capacity', label: 'Capacity', path: '/manufacturing/capacity' },
    { id: 'reports', label: 'Reports', path: '/manufacturing/reports' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-work-order', label: 'New Work Order', path: '/manufacturing/work-orders/new', icon: <Plus size={16} /> },
        { id: 'add-bom', label: 'Add BOM', path: '/manufacturing/boms/new', icon: <Boxes size={16} /> },
        { id: 'schedule-maint', label: 'Schedule Maintenance', path: '/manufacturing/maintenance/new', icon: <Wrench size={16} /> },
      ],
    },
    {
      title: 'Performance',
      items: [
        { id: 'capacity-util', label: 'Capacity Utilization', path: '/manufacturing/reports/capacity', icon: <Activity size={16} /> },
        { id: 'delivery-performance', label: 'Delivery Performance', path: '/manufacturing/reports/delivery', icon: <TrendingUp size={16} /> },
        { id: 'quality-metrics', label: 'Quality Metrics', path: '/manufacturing/reports/quality', icon: <FileText size={16} /> },
      ],
    },
  ];

  if (loading || !stats) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading manufacturing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Manufacturing"
      moduleSubtitle="Production orders, capacity & quality"
      breadcrumbs={[
        { label: 'Manufacturing', path: '/manufacturing' },
        { label: 'Dashboard', path: '/manufacturing/dashboard' },
      ]}
      tabs={mfgTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        { label: 'New Work Order', icon: <Plus size={16} />, variant: 'primary' as const },
        { label: 'Add BOM', icon: <Boxes size={16} />, variant: 'secondary' as const },
      ]}
    >
      <div className="dashboard-container">
        <div className="current-period-card">
          <div className="period-label">Current Period</div>
          <div className="period-name">{stats.current_period.period_name}</div>
          <span
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

        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <div className="metric-label">Active Production Orders</div>
              <div className="metric-value">{stats.manufacturing_summary.active_orders}</div>
              <div className="metric-trend positive">
                <span className="trend-icon">✓</span>
                <span className="trend-text">In progress</span>
              </div>
            </div>
          </div>

          <div className="metric-card expenses">
            <div className="metric-icon">⚙️</div>
            <div className="metric-content">
              <div className="metric-label">Work Centers</div>
              <div className="metric-value">{stats.manufacturing_summary.work_centers}</div>
              <div className="metric-trend">
                <span className="trend-text">{stats.manufacturing_summary.total_boms} BOMs</span>
              </div>
            </div>
          </div>

          <div className="metric-card profit">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-label">Capacity Utilization</div>
              <div className="metric-value">
                <span className={`performance-badge badge-${getPerformanceColor(stats.manufacturing_summary.capacity_utilization, 85)}`}>
                  {stats.manufacturing_summary.capacity_utilization}%
                </span>
              </div>
              <div className="metric-trend">
                <span className="profit-margin">Optimal: 85-95%</span>
              </div>
            </div>
          </div>

          <div className="metric-card activity">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-label">On-Time Delivery</div>
              <div className="metric-value">
                <span className={`performance-badge badge-${getPerformanceColor(stats.manufacturing_summary.on_time_delivery, 90)}`}>
                  {stats.manufacturing_summary.on_time_delivery}%
                </span>
              </div>
              <div className="metric-detail">
                <span className="pending-badge">{stats.manufacturing_summary.defect_rate}% defect rate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="balance-sheet-section">
          <h2>🏆 Top Products by Volume</h2>
          <div className="balance-cards">
            <div className="balance-card assets">
              <div className="balance-label">{stats.top_products.prod_1.name}</div>
              <div className="balance-value">{stats.top_products.prod_1.quantity.toLocaleString()} units</div>
            </div>
            <div className="balance-card liabilities">
              <div className="balance-label">{stats.top_products.prod_2.name}</div>
              <div className="balance-value">{stats.top_products.prod_2.quantity.toLocaleString()} units</div>
            </div>
            <div className="balance-card equity">
              <div className="balance-label">{stats.top_products.prod_3.name}</div>
              <div className="balance-value">{stats.top_products.prod_3.quantity.toLocaleString()} units</div>
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/manufacturing/production-orders" className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-label">Production Orders</div>
            </Link>
            <Link to="/manufacturing/boms" className="action-card">
              <div className="action-icon">🔧</div>
              <div className="action-label">Bill of Materials</div>
            </Link>
            <Link to="/manufacturing/work-centers" className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-label">Work Centers</div>
            </Link>
            <Link to="/manufacturing/routing" className="action-card">
              <div className="action-icon">🔄</div>
              <div className="action-label">Routing</div>
            </Link>
            <Link to="/manufacturing/quality" className="action-card">
              <div className="action-icon">✅</div>
              <div className="action-label">Quality Control</div>
            </Link>
            <Link to="/manufacturing/reports" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-label">Reports</div>
            </Link>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default ManufacturingDashboardEnhanced;
