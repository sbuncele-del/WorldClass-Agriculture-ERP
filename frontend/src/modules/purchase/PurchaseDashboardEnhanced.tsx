import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { ShoppingCart, Package, FileText, TrendingUp, Users, Plus, Upload } from 'lucide-react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface PurchaseStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  purchase_summary: {
    total_spend: number;
    active_pos: number;
    pending_approvals: number;
    total_suppliers: number;
    average_po_value: number;
    pending_receipts: number;
  };
  top_suppliers: {
    supplier_1: { name: string; spend: number };
    supplier_2: { name: string; spend: number };
    supplier_3: { name: string; spend: number };
  };
}

const PurchaseDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/purchase/dashboard');
      if (response.data) {
        setStats(response.data);
      } else {
        // Fallback to default structure if API returns empty
        setStats({
          current_period: {
            fiscal_year: new Date().getFullYear(),
            period_number: new Date().getMonth() + 1,
            period_name: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            status: 'OPEN'
          },
          purchase_summary: {
            total_spend: 0,
            active_pos: 0,
            pending_approvals: 0,
            total_suppliers: 0,
            average_po_value: 0,
            pending_receipts: 0
          },
          top_suppliers: {
            supplier_1: { name: 'N/A', spend: 0 },
            supplier_2: { name: 'N/A', spend: 0 },
            supplier_3: { name: 'N/A', spend: 0 }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching purchase dashboard data:', err);
      setError('Failed to load dashboard data');
      // Set empty stats on error
      setStats({
        current_period: {
          fiscal_year: new Date().getFullYear(),
          period_number: new Date().getMonth() + 1,
          period_name: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          status: 'OPEN'
        },
        purchase_summary: {
          total_spend: 0,
          active_pos: 0,
          pending_approvals: 0,
          total_suppliers: 0,
          average_po_value: 0,
          pending_receipts: 0
        },
        top_suppliers: {
          supplier_1: { name: 'N/A', spend: 0 },
          supplier_2: { name: 'N/A', spend: 0 },
          supplier_3: { name: 'N/A', spend: 0 }
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

  const purchaseTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/purchase/dashboard' },
    { id: 'requisitions', label: 'Requisitions', path: '/purchase/requisitions' },
    { id: 'orders', label: 'Purchase Orders', path: '/purchase/orders' },
    { id: 'receipts', label: 'Goods Receipt', path: '/purchase/receipts' },
    { id: 'suppliers', label: 'Suppliers', path: '/purchase/suppliers' },
    { id: 'approvals', label: 'Approvals', path: '/purchase/approvals' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'new-requisition', label: 'New Requisition', path: '/purchase/requisitions/new', icon: <Plus size={16} /> },
        { id: 'new-po', label: 'New Purchase Order', path: '/purchase/orders/new', icon: <ShoppingCart size={16} /> },
        { id: 'receive-goods', label: 'Receive Goods', path: '/purchase/receipts/new', icon: <Package size={16} /> },
        { id: 'add-supplier', label: 'Add Supplier', path: '/purchase/suppliers/new', icon: <Users size={16} /> },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'purchase-report', label: 'Purchase Report', path: '/purchase/reports/summary', icon: <FileText size={16} /> },
        { id: 'supplier-report', label: 'Supplier Analysis', path: '/purchase/reports/suppliers', icon: <TrendingUp size={16} /> },
        { id: 'spend-analysis', label: 'Spend Analysis', path: '/purchase/reports/spend', icon: <TrendingUp size={16} /> },
      ],
    },
  ];

  if (loading || !stats) {
    return (
      <EnterpriseLayout
        moduleTitle="Purchase Management"
        moduleSubtitle="Manage suppliers, requisitions, purchase orders, and goods receipts"
        tabs={purchaseTabs}
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Purchase Management', path: '/purchase/dashboard' },
        ]}
        secondaryNav={secondaryNav}
      >
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading purchase dashboard...</p>
          </div>
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Purchase Management"
      moduleSubtitle="Manage suppliers, requisitions, purchase orders, and goods receipts"
      tabs={purchaseTabs}
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'Purchase Management', path: '/purchase/dashboard' },
      ]}
      secondaryNav={secondaryNav}
    >
      <div className="dashboard-container" style={{ padding: '1.5rem' }}>
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
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-label">Total Spend</div>
              <div className="metric-value">{formatCurrency(stats.purchase_summary.total_spend)}</div>
              <div className="metric-trend positive">
                <span className="trend-icon">↗</span>
                <span className="trend-text">This period</span>
              </div>
            </div>
          </div>

          <div className="metric-card expenses">
            <div className="metric-icon">📦</div>
            <div className="metric-content">
              <div className="metric-label">Active POs</div>
              <div className="metric-value">{stats.purchase_summary.active_pos}</div>
              <div className="metric-trend">
                <span className="trend-text">{stats.purchase_summary.pending_receipts} pending receipt</span>
              </div>
            </div>
          </div>

          <div className="metric-card profit">
            <div className="metric-icon">💵</div>
            <div className="metric-content">
              <div className="metric-label">Avg PO Value</div>
              <div className="metric-value">{formatCurrency(stats.purchase_summary.average_po_value)}</div>
              <div className="metric-trend">
                <span className="profit-margin">Per order</span>
              </div>
            </div>
          </div>

          <div className="metric-card activity">
            <div className="metric-icon">🏢</div>
            <div className="metric-content">
              <div className="metric-label">Suppliers</div>
              <div className="metric-value">{stats.purchase_summary.total_suppliers}</div>
              <div className="metric-detail">
                <span className="pending-badge">{stats.purchase_summary.pending_approvals} pending approval</span>
              </div>
            </div>
          </div>
        </div>

        <div className="balance-sheet-section">
          <h2>🏆 Top Suppliers by Spend</h2>
          <div className="balance-cards">
            <div className="balance-card assets">
              <div className="balance-label">{stats.top_suppliers.supplier_1.name}</div>
              <div className="balance-value">{formatCurrency(stats.top_suppliers.supplier_1.spend)}</div>
            </div>
            <div className="balance-card liabilities">
              <div className="balance-label">{stats.top_suppliers.supplier_2.name}</div>
              <div className="balance-value">{formatCurrency(stats.top_suppliers.supplier_2.spend)}</div>
            </div>
            <div className="balance-card equity">
              <div className="balance-label">{stats.top_suppliers.supplier_3.name}</div>
              <div className="balance-value">{formatCurrency(stats.top_suppliers.supplier_3.spend)}</div>
            </div>
          </div>
        </div>

        <div className="quick-actions-section">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/purchase/suppliers" className="action-card">
              <div className="action-icon">🏢</div>
              <div className="action-label">Supplier Management</div>
            </Link>
            <Link to="/purchase/requisitions" className="action-card">
              <div className="action-icon">📝</div>
              <div className="action-label">Purchase Requisitions</div>
            </Link>
            <Link to="/purchase/orders" className="action-card">
              <div className="action-icon">📦</div>
              <div className="action-label">Purchase Orders</div>
            </Link>
            <Link to="/purchase/receipts" className="action-card">
              <div className="action-icon">📥</div>
              <div className="action-label">Goods Receipt</div>
            </Link>
            <Link to="/purchase/invoices" className="action-card">
              <div className="action-icon">🧾</div>
              <div className="action-label">Vendor Invoices</div>
            </Link>
            <Link to="/purchase/payments" className="action-card">
              <div className="action-icon">💳</div>
              <div className="action-label">Payments</div>
            </Link>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default PurchaseDashboardEnhanced;
