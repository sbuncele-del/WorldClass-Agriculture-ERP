import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { Boxes, Truck, Barcode, FileText, TrendingUp, Plus, PackageSearch } from 'lucide-react';
import '../../styles/erp-ui.css';

interface WarehouseStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  warehouse_summary: {
    total_locations: number;
    total_bins: number;
    total_stock_value: number;
    pending_picks: number;
    pending_putaways: number;
    cycle_counts_due: number;
  };
  top_locations: {
    loc_1: { name: string; utilization: number };
    loc_2: { name: string; utilization: number };
    loc_3: { name: string; utilization: number };
  };
}

const WarehouseDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/warehouse/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching warehouse dashboard data:', err);
      // Fallback to default data if API fails
      setStats({
        current_period: {
          fiscal_year: 2025,
          period_number: 12,
          period_name: 'December 2025',
          status: 'OPEN'
        },
        warehouse_summary: {
          total_locations: 0,
          total_bins: 0,
          total_stock_value: 0,
          pending_picks: 0,
          pending_putaways: 0,
          cycle_counts_due: 0
        },
        top_locations: {
          loc_1: { name: 'No data', utilization: 0 },
          loc_2: { name: 'No data', utilization: 0 },
          loc_3: { name: 'No data', utilization: 0 }
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

  if (loading || !stats) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading warehouse dashboard...</p>
        </div>
      </div>
    );
  }
  
  const whTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/warehouse/dashboard' },
    { id: 'locations', label: 'Locations', path: '/warehouse/locations' },
    { id: 'bins', label: 'Bins', path: '/warehouse/bins' },
    { id: 'picking', label: 'Picking', path: '/warehouse/picking' },
    { id: 'putaway', label: 'Putaway', path: '/warehouse/putaway' },
    { id: 'cycle-count', label: 'Cycle Count', path: '/warehouse/cycle-count' },
    { id: 'reports', label: 'Reports', path: '/warehouse/reports' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-location', label: 'Add Location', path: '/warehouse/locations/new', icon: <Plus size={16} /> },
        { id: 'start-pick', label: 'Start Picking', path: '/warehouse/picking/new', icon: <Boxes size={16} /> },
        { id: 'start-putaway', label: 'Start Putaway', path: '/warehouse/putaway/new', icon: <Truck size={16} /> },
        { id: 'scan-item', label: 'Scan Item', path: '/warehouse/scan', icon: <Barcode size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'utilization', label: 'Utilization', path: '/warehouse/reports/utilization', icon: <TrendingUp size={16} /> },
        { id: 'inventory-accuracy', label: 'Inventory Accuracy', path: '/warehouse/reports/accuracy', icon: <FileText size={16} /> },
      ],
    },
  ];

  return (
    <EnterpriseLayout
      moduleTitle="Warehouse Management"
      moduleSubtitle="Locations, bins, picking & putaway"
      breadcrumbs={[
        { label: 'Warehouse', path: '/warehouse' },
        { label: 'Dashboard', path: '/warehouse/dashboard' },
      ]}
      tabs={whTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        { label: 'Start Cycle Count', icon: <PackageSearch size={16} />, variant: 'secondary' as const },
        { label: 'New Location', icon: <Plus size={16} />, variant: 'primary' as const },
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
          <div className="metric-icon">📍</div>
          <div className="metric-content">
            <div className="metric-label">Total Locations</div>
            <div className="metric-value">{stats.warehouse_summary.total_locations}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">✓</span>
              <span className="trend-text">{stats.warehouse_summary.total_bins} bins</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Stock Value</div>
            <div className="metric-value">{formatCurrency(stats.warehouse_summary.total_stock_value)}</div>
            <div className="metric-trend">
              <span className="trend-text">On-hand inventory</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <div className="metric-label">Pending Picks</div>
            <div className="metric-value">{stats.warehouse_summary.pending_picks}</div>
            <div className="metric-trend">
              <span className="profit-margin">{stats.warehouse_summary.pending_putaways} putaways</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Cycle Counts Due</div>
            <div className="metric-value">{stats.warehouse_summary.cycle_counts_due}</div>
            <div className="metric-detail">
              <span className="pending-badge">Requires counting</span>
            </div>
          </div>
        </div>
      </div>

      <div className="balance-sheet-section">
        <h2>🏢 Warehouse Utilization</h2>
        <div className="balance-cards">
          <div className="balance-card assets">
            <div className="balance-label">{stats.top_locations.loc_1.name}</div>
            <div className="balance-value">{stats.top_locations.loc_1.utilization}% utilized</div>
          </div>
          <div className="balance-card liabilities">
            <div className="balance-label">{stats.top_locations.loc_2.name}</div>
            <div className="balance-value">{stats.top_locations.loc_2.utilization}% utilized</div>
          </div>
          <div className="balance-card equity">
            <div className="balance-label">{stats.top_locations.loc_3.name}</div>
            <div className="balance-value">{stats.top_locations.loc_3.utilization}% utilized</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/warehouse/locations" className="action-card">
            <div className="action-icon">📍</div>
            <div className="action-label">Locations & Bins</div>
          </Link>
          <Link to="/warehouse/stock-movements" className="action-card">
            <div className="action-icon">🔄</div>
            <div className="action-label">Stock Movements</div>
          </Link>
          <Link to="/warehouse/picking" className="action-card">
            <div className="action-icon">📦</div>
            <div className="action-label">Picking & Packing</div>
          </Link>
          <Link to="/warehouse/putaway" className="action-card">
            <div className="action-icon">📥</div>
            <div className="action-label">Putaway</div>
          </Link>
          <Link to="/warehouse/cycle-counts" className="action-card">
            <div className="action-icon">✅</div>
            <div className="action-label">Cycle Counts</div>
          </Link>
          <Link to="/warehouse/reports" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-label">Reports</div>
          </Link>
        </div>
      </div>
      </div>
    </EnterpriseLayout>
  );
};

export default WarehouseDashboardEnhanced;
