import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { Boxes, Wrench, FileText, TrendingUp, Plus, Recycle } from 'lucide-react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface AssetStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  asset_summary: {
    total_assets: number;
    total_value: number;
    monthly_depreciation: number;
    maintenance_due: number;
    active_assets: number;
    disposed_ytd: number;
  };
  top_categories: {
    cat_1: { name: string; value: number };
    cat_2: { name: string; value: number };
    cat_3: { name: string; value: number };
  };
}

const AssetDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/assets/dashboard');
      if (response.data) {
        setStats(response.data);
      } else {
        // Fallback to default if API returns nothing
        setStats({
          current_period: {
            fiscal_year: new Date().getFullYear(),
            period_number: new Date().getMonth() + 1,
            period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            status: 'OPEN'
          },
          asset_summary: {
            total_assets: 0,
            total_value: 0,
            monthly_depreciation: 0,
            maintenance_due: 0,
            active_assets: 0,
            disposed_ytd: 0
          },
          top_categories: {
            cat_1: { name: 'Category 1', value: 0 },
            cat_2: { name: 'Category 2', value: 0 },
            cat_3: { name: 'Category 3', value: 0 }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching asset dashboard data:', err);
      // Set default stats on error
      setStats({
        current_period: {
          fiscal_year: new Date().getFullYear(),
          period_number: new Date().getMonth() + 1,
          period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          status: 'OPEN'
        },
        asset_summary: {
          total_assets: 0,
          total_value: 0,
          monthly_depreciation: 0,
          maintenance_due: 0,
          active_assets: 0,
          disposed_ytd: 0
        },
        top_categories: {
          cat_1: { name: 'Category 1', value: 0 },
          cat_2: { name: 'Category 2', value: 0 },
          cat_3: { name: 'Category 3', value: 0 }
        }
      });
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

  const assetTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/assets/dashboard' },
    { id: 'register', label: 'Asset Register', path: '/assets/register' },
    { id: 'depreciation', label: 'Depreciation', path: '/assets/depreciation' },
    { id: 'maintenance', label: 'Maintenance', path: '/assets/maintenance' },
    { id: 'disposals', label: 'Disposals', path: '/assets/disposals' },
    { id: 'reports', label: 'Reports', path: '/assets/reports' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-asset', label: 'Add Asset', path: '/assets/register/new', icon: <Plus size={16} /> },
        { id: 'schedule-maint', label: 'Schedule Maintenance', path: '/assets/maintenance/new', icon: <Wrench size={16} /> },
        { id: 'dispose-asset', label: 'Dispose Asset', path: '/assets/disposals/new', icon: <Recycle size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'asset-report', label: 'Asset Report', path: '/assets/reports/summary', icon: <FileText size={16} /> },
        { id: 'depr-report', label: 'Depreciation', path: '/assets/reports/depreciation', icon: <TrendingUp size={16} /> },
        { id: 'maint-report', label: 'Maintenance', path: '/assets/reports/maintenance', icon: <Wrench size={16} /> },
      ],
    },
  ];

  if (loading || !stats) {
    return (
      <EnterpriseLayout
        moduleTitle="Asset Management"
        moduleSubtitle="Track lifecycle, depreciation & maintenance"
        breadcrumbs={[
          { label: 'Assets', path: '/assets' },
          { label: 'Dashboard', path: '/assets/dashboard' },
        ]}
        tabs={assetTabs}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading asset dashboard...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Asset Management"
      moduleSubtitle="Track lifecycle, depreciation & maintenance"
      breadcrumbs={[
        { label: 'Assets', path: '/assets' },
        { label: 'Dashboard', path: '/assets/dashboard' },
      ]}
      tabs={assetTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        { label: 'Add Asset', icon: <Plus size={16} />, variant: 'primary' as const },
        { label: 'Export Register', icon: <Boxes size={16} />, variant: 'secondary' as const },
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
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Total Assets</div>
            <div className="metric-value">{stats.asset_summary.total_assets}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">✓</span>
              <span className="trend-text">{stats.asset_summary.active_assets} active</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Asset Value</div>
            <div className="metric-value">{formatCurrency(stats.asset_summary.total_value)}</div>
            <div className="metric-trend">
              <span className="trend-text">Book value</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <div className="metric-label">Monthly Depreciation</div>
            <div className="metric-value">{formatCurrency(stats.asset_summary.monthly_depreciation)}</div>
            <div className="metric-trend">
              <span className="profit-margin">Straight-line method</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">🔧</div>
          <div className="metric-content">
            <div className="metric-label">Maintenance Due</div>
            <div className="metric-value">{stats.asset_summary.maintenance_due}</div>
            <div className="metric-detail">
              <span className="pending-badge">Requires attention</span>
            </div>
          </div>
        </div>
      </div>

      <div className="balance-sheet-section">
        <h2>📊 Top Asset Categories by Value</h2>
        <div className="balance-cards">
          <div className="balance-card assets">
            <div className="balance-label">{stats.top_categories.cat_1.name}</div>
            <div className="balance-value">{formatCurrency(stats.top_categories.cat_1.value)}</div>
          </div>
          <div className="balance-card liabilities">
            <div className="balance-label">{stats.top_categories.cat_2.name}</div>
            <div className="balance-value">{formatCurrency(stats.top_categories.cat_2.value)}</div>
          </div>
          <div className="balance-card equity">
            <div className="balance-label">{stats.top_categories.cat_3.name}</div>
            <div className="balance-value">{formatCurrency(stats.top_categories.cat_3.value)}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/assets/register" className="action-card">
            <div className="action-icon">📋</div>
            <div className="action-label">Asset Register</div>
          </Link>
          <Link to="/assets/depreciation" className="action-card">
            <div className="action-icon">📉</div>
            <div className="action-label">Depreciation</div>
          </Link>
          <Link to="/assets/maintenance" className="action-card">
            <div className="action-icon">🔧</div>
            <div className="action-label">Maintenance</div>
          </Link>
          <Link to="/assets/disposals" className="action-card">
            <div className="action-icon">♻️</div>
            <div className="action-label">Disposals</div>
          </Link>
          <Link to="/assets/transfers" className="action-card">
            <div className="action-icon">🔄</div>
            <div className="action-label">Transfers</div>
          </Link>
          <Link to="/assets/reports" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-label">Reports</div>
          </Link>
        </div>
      </div>
      </div>
    </EnterpriseLayout>
  );
};

export default AssetDashboardEnhanced;
