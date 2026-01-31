/**
 * INVENTORY DASHBOARD
 * 
 * Overview of inventory status, stock levels, and recent activities
 */

import { useState, useEffect } from 'react';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { Package, PackagePlus, ClipboardList, FileText, TrendingUp, Barcode } from 'lucide-react';
import { API_BASE_URL } from '../../services/api.service';

interface DashboardData {
  summary: {
    total_items: number;
    active_items: number;
    total_on_hand: number;
    total_inventory_value: number;
    out_of_stock_items: number;
  };
  reorderRequired: number;
  byCategory: Array<{
    category_name: string;
    item_count: number;
    category_value: number;
  }>;
  byWarehouse: Array<{
    warehouse_code: string;
    warehouse_name: string;
    item_count: number;
    warehouse_value: number;
  }>;
  recentMovements: Array<{
    movement_id: number;
    movement_number: string;
    movement_date: string;
    movement_type: string;
    item_code: string;
    item_name: string;
    warehouse_code: string;
    quantity: number;
    uom_code: string;
    total_value: number;
  }>;
}

export default function InventoryDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/dashboard`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const invTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/inventory/dashboard' },
    { id: 'items', label: 'Items', path: '/inventory/items' },
    { id: 'categories', label: 'Categories', path: '/inventory/categories' },
    { id: 'warehouses', label: 'Warehouses', path: '/inventory/warehouses' },
    { id: 'movements', label: 'Movements', path: '/inventory/movements' },
    { id: 'reorder', label: 'Reorder', path: '/inventory/reorder' },
    { id: 'reports', label: 'Reports', path: '/inventory/reports' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-item', label: 'New Item', path: '/inventory/items/new', icon: <PackagePlus size={16} /> },
        { id: 'stock-movement', label: 'Stock Movement', path: '/inventory/movements/new', icon: <Package size={16} /> },
        { id: 'cycle-count', label: 'Cycle Count', path: '/inventory/cycle-count', icon: <Barcode size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'stock-valuation', label: 'Stock Valuation', path: '/inventory/reports/valuation', icon: <TrendingUp size={16} /> },
        { id: 'reorder-report', label: 'Reorder Report', path: '/inventory/reports/reorder', icon: <ClipboardList size={16} /> },
        { id: 'warehouse-summary', label: 'Warehouse Summary', path: '/inventory/reports/warehouse', icon: <FileText size={16} /> },
      ],
    },
  ];

  if (loading) {
    return (
      <EnterpriseLayout
        moduleTitle="Inventory"
        moduleSubtitle="Stock levels, movements, and valuation"
        breadcrumbs={[
          { label: 'Inventory', path: '/inventory' },
          { label: 'Dashboard', path: '/inventory/dashboard' },
        ]}
        tabs={invTabs}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  if (!data) {
    return (
      <EnterpriseLayout
        moduleTitle="Inventory"
        moduleSubtitle="Stock levels, movements, and valuation"
        breadcrumbs={[
          { label: 'Inventory', path: '/inventory' },
          { label: 'Dashboard', path: '/inventory/dashboard' },
        ]}
        tabs={invTabs}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="empty-state">No data available</div>
        </div>
      </EnterpriseLayout>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-ZA').format(value);
  };

  return (
    <EnterpriseLayout
      moduleTitle="Inventory"
      moduleSubtitle="Stock levels, movements, and valuation"
      breadcrumbs={[
        { label: 'Inventory', path: '/inventory' },
        { label: 'Dashboard', path: '/inventory/dashboard' },
      ]}
      tabs={invTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        { label: 'New Item', icon: <PackagePlus size={16} />, variant: 'primary' as const },
        { label: 'Stock Movement', icon: <Package size={16} />, variant: 'secondary' as const },
      ]}
    >
      <div className="inventory-dashboard">
        <div className="section-header">
          <h2 className="section-title">📊 Inventory Dashboard</h2>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{data.summary.total_items}</div>
          <div className="stat-change">
            {data.summary.active_items} active
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Total Inventory Value</div>
          <div className="stat-value">{formatCurrency(data.summary.total_inventory_value || 0)}</div>
          <div className="stat-change">
            {formatNumber(data.summary.total_on_hand || 0)} units on hand
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Reorder Required</div>
          <div className="stat-value">{data.reorderRequired}</div>
          <div className="stat-change">Items below reorder level</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value">{data.summary.out_of_stock_items}</div>
          <div className="stat-change">Immediate action needed</div>
        </div>
      </div>

      {/* Inventory by Category */}
      <div className="inventory-section">
        <h3>Inventory by Category</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item Count</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data.byCategory.length > 0 ? (
              data.byCategory.map((cat, index) => (
                <tr key={index}>
                  <td>{cat.category_name || 'Uncategorized'}</td>
                  <td>{cat.item_count}</td>
                  <td>{formatCurrency(cat.category_value || 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#6c757d' }}>
                  No category data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inventory by Warehouse */}
      <div className="inventory-section">
        <h3>Inventory by Warehouse</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Code</th>
              <th>Item Count</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {data.byWarehouse.length > 0 ? (
              data.byWarehouse.map((wh, index) => (
                <tr key={index}>
                  <td>{wh.warehouse_name}</td>
                  <td>{wh.warehouse_code}</td>
                  <td>{wh.item_count}</td>
                  <td>{formatCurrency(wh.warehouse_value || 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#6c757d' }}>
                  No warehouse data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Stock Movements */}
      <div className="inventory-section">
        <h3>Recent Stock Movements</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Movement #</th>
              <th>Date</th>
              <th>Type</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {data.recentMovements.length > 0 ? (
              data.recentMovements.map((mov) => (
                <tr key={mov.movement_id}>
                  <td>{mov.movement_number}</td>
                  <td>{new Date(mov.movement_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${mov.movement_type === 'Receipt' ? 'status-approved' : 'status-warning'}`}>
                      {mov.movement_type}
                    </span>
                  </td>
                  <td>
                    <div>{mov.item_code}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>{mov.item_name}</div>
                  </td>
                  <td>{mov.warehouse_code}</td>
                  <td style={{ color: mov.quantity > 0 ? '#28a745' : '#dc3545' }}>
                    {mov.quantity > 0 ? '+' : ''}{formatNumber(mov.quantity)} {mov.uom_code}
                  </td>
                  <td>{formatCurrency(mov.total_value || 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#6c757d' }}>
                  No recent movements
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </EnterpriseLayout>
  );
}
