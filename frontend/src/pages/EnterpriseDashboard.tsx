/**
 * Enterprise Dashboard - SAP Fiori Inspired
 * Role-based workspaces with card-based design and contextual actions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  FileText,
  ShoppingCart,
  Warehouse,
  Factory,
  CreditCard,
  Bell,
  Settings,
  Calendar,
  Target,
} from 'lucide-react';
import { useClient } from '../contexts/ClientContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../services/api.service';
import './EnterpriseDashboard.css';

interface WorkspaceCard {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  link: string;
  module: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'success' | 'warning' | 'danger';
}

interface TaskItem {
  id: string;
  title: string;
  module: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  module: string;
  timestamp: string;
  actionLabel?: string;
  actionLink?: string;
}

const EnterpriseDashboard: React.FC = () => {
  const { currentClient } = useClient();
  const { formatCurrency, displayCurrency } = useCurrency();
  const { currentUser, hasPermission } = useUser();
  const [workspaceCards, setWorkspaceCards] = useState<WorkspaceCard[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentClient, displayCurrency]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
            
      // Fetch real data from backend - using correct V2 API endpoints
      const [metricsRes, treasuryRes, salesRes, inventoryRes, hrRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/financial/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v2/treasury/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v2/sales/workspace`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v2/inventory/workspace`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE_URL}/api/v2/hr/workspace`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
      ]);

      let metricsData: any = {};

      // Parse financial dashboard metrics
      if (metricsRes?.ok) {
        const response = await metricsRes.json();
        const data = response.data || response;
        metricsData.financial = {
          totalRevenue: data.summary?.totalRevenue || data.currentMonthRevenue || 0,
          change: data.summary?.revenueChange || 0
        };
      }

      // Parse treasury/cash data
      if (treasuryRes?.ok) {
        const response = await treasuryRes.json();
        const data = response.data || response;
        metricsData.cashPosition = {
          totalCash: data.summary?.totalCash || data.totalBalance || 0,
          change: data.summary?.cashChange || 0
        };
      }

      // Parse sales data
      if (salesRes?.ok) {
        const response = await salesRes.json();
        const data = response.data || response;
        metricsData.sales = {
          totalSales: data.summary?.totalSales || data.totalRevenue || 0,
          change: data.summary?.salesChange || 0
        };
      }

      // Parse inventory data
      if (inventoryRes?.ok) {
        const response = await inventoryRes.json();
        const data = response.data || response;
        metricsData.inventory = {
          totalValue: data.summary?.totalValue || data.totalInventoryValue || 0,
          change: data.summary?.inventoryChange || 0
        };
      }

      // Parse HR data
      if (hrRes?.ok) {
        const response = await hrRes.json();
        const data = response.data || response;
        metricsData.employees = {
          totalCount: data.summary?.totalEmployees || data.employeeCount || 1,
          newThisMonth: data.summary?.newHires || 0
        };
      }

      // Update cards with real data
      setWorkspaceCards(getWorkspaceCards(metricsData));
      setTasks([]);  // Tasks would come from a tasks API
      setAlerts([]); // Alerts would come from an alerts API
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Show empty state on error
      setWorkspaceCards(getWorkspaceCards({}));
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkspaceCards = (metrics: any): WorkspaceCard[] => {
    const cards: WorkspaceCard[] = [];

    // Extract values from metrics or use zeros for new accounts
    const financialValue = metrics?.financial?.totalRevenue || 0;
    const financialChange = metrics?.financial?.change || 0;
    const cashValue = metrics?.cashPosition?.totalCash || 0;
    const cashChange = metrics?.cashPosition?.change || 0;
    const salesValue = metrics?.sales?.totalSales || 0;
    const salesChange = metrics?.sales?.change || 0;
    const inventoryValue = metrics?.inventory?.totalValue || 0;
    const inventoryChange = metrics?.inventory?.change || 0;
    const procurementValue = metrics?.procurement?.totalValue || 0;
    const procurementChange = metrics?.procurement?.change || 0;
    const productionUnits = metrics?.production?.totalUnits || 0;
    const productionCapacity = metrics?.production?.capacity || 0;
    const employeeCount = metrics?.employees?.totalCount || 1;
    const newEmployees = metrics?.employees?.newThisMonth || 1;

    // Financial Card
    if (hasPermission('FINANCIAL', 'READ')) {
      cards.push({
        id: 'financial',
        title: 'Financial Overview',
        subtitle: 'General Ledger & Reporting',
        value: formatCurrency(financialValue),
        change: financialChange ? `${financialChange > 0 ? '+' : ''}${financialChange.toFixed(1)}%` : 'New Account',
        changeType: financialChange > 0 ? 'positive' : financialChange < 0 ? 'negative' : 'neutral',
        icon: <DollarSign size={28} />,
        link: '/financial',
        module: 'FINANCIAL',
        priority: 'high',
        status: 'success',
      });
    }

    // Cash Management Card
    if (hasPermission('CASH_MANAGEMENT', 'READ')) {
      cards.push({
        id: 'cash',
        title: 'Cash Position',
        subtitle: 'Bank Accounts & Treasury',
        value: formatCurrency(cashValue),
        change: cashChange ? `${cashChange > 0 ? '+' : ''}${cashChange.toFixed(1)}%` : 'New Account',
        changeType: cashChange > 0 ? 'positive' : cashChange < 0 ? 'negative' : 'neutral',
        icon: <CreditCard size={28} />,
        link: '/cash-management',
        module: 'CASH_MANAGEMENT',
        priority: 'high',
        status: 'success',
      });
    }

    // Sales Card
    if (hasPermission('SALES_CRM', 'READ')) {
      cards.push({
        id: 'sales',
        title: 'Sales Pipeline',
        subtitle: 'Opportunities & Revenue',
        value: formatCurrency(salesValue),
        change: salesChange ? `${salesChange > 0 ? '+' : ''}${salesChange.toFixed(1)}%` : 'New Account',
        changeType: salesChange > 0 ? 'positive' : salesChange < 0 ? 'negative' : 'neutral',
        icon: <TrendingUp size={28} />,
        link: '/sales',
        module: 'SALES_CRM',
        priority: 'high',
        status: 'success',
      });
    }

    // Inventory Card
    if (hasPermission('INVENTORY', 'READ')) {
      cards.push({
        id: 'inventory',
        title: 'Inventory Management',
        subtitle: 'Stock Levels & Warehouses',
        value: formatCurrency(inventoryValue),
        change: inventoryChange ? `${inventoryChange > 0 ? '+' : ''}${inventoryChange.toFixed(1)}%` : 'New Account',
        changeType: inventoryChange > 0 ? 'positive' : inventoryChange < 0 ? 'negative' : 'neutral',
        icon: <Package size={28} />,
        link: '/inventory',
        module: 'INVENTORY',
        priority: 'medium',
        status: inventoryValue > 0 ? 'success' : 'warning',
      });
    }

    // Purchase Card
    cards.push({
      id: 'purchase',
      title: 'Procurement',
      subtitle: 'Purchase Orders & Suppliers',
      value: formatCurrency(procurementValue),
      change: procurementChange ? `${procurementChange > 0 ? '+' : ''}${procurementChange.toFixed(1)}%` : 'New Account',
      changeType: procurementChange > 0 ? 'positive' : procurementChange < 0 ? 'negative' : 'neutral',
      icon: <ShoppingCart size={28} />,
      link: '/purchase',
      module: 'PURCHASE',
      priority: 'medium',
      status: 'success',
    });

    // Manufacturing Card
    cards.push({
      id: 'manufacturing',
      title: 'Production',
      subtitle: 'Manufacturing Operations',
      value: `${productionUnits} Units`,
      change: productionCapacity ? `${productionCapacity}% Capacity` : 'Not Started',
      changeType: productionCapacity > 70 ? 'positive' : productionCapacity > 40 ? 'neutral' : 'negative',
      icon: <Factory size={28} />,
      link: '/manufacturing',
      module: 'MANUFACTURING',
      priority: 'medium',
      status: productionUnits > 0 ? 'success' : 'warning',
    });

    // Warehouse Card
    cards.push({
      id: 'warehouse',
      title: 'Distribution',
      subtitle: 'Warehouse Network',
      value: 'Not Configured',
      change: 'Setup Required',
      changeType: 'neutral',
      icon: <Warehouse size={28} />,
      link: '/warehouse',
      module: 'WAREHOUSE',
      priority: 'medium',
      status: 'warning',
    });

    // HR Card
    if (hasPermission('HR_PAYROLL', 'READ')) {
      cards.push({
        id: 'hr',
        title: 'Human Resources',
        subtitle: 'Employees & Payroll',
        value: `${employeeCount} Employee${employeeCount !== 1 ? 's' : ''}`,
        change: newEmployees > 0 ? `+${newEmployees} This Month` : 'No New Hires',
        changeType: newEmployees > 0 ? 'positive' : 'neutral',
        icon: <Users size={28} />,
        link: '/hr',
        module: 'HR_PAYROLL',
        priority: 'low',
        status: 'success',
      });
    }

    // Compliance Card
    cards.push({
      id: 'compliance',
      title: 'SARS Compliance',
      subtitle: 'Tax Filing & Reporting',
      value: 'Not Configured',
      change: 'Setup Required',
      changeType: 'neutral',
      icon: <FileText size={28} />,
      link: '/sars-sentinel',
      module: 'COMPLIANCE',
      priority: 'high',
      status: 'warning',
    });

    return cards;
  };

  const getMockTasks = (): TaskItem[] => [
    {
      id: 'task-1',
      title: 'Approve Purchase Order #PO-2025-1142',
      module: 'PURCHASE',
      priority: 'high',
      dueDate: '2025-11-10',
      assignedTo: currentUser?.fullName,
      status: 'pending',
    },
    {
      id: 'task-2',
      title: 'Review Q4 Financial Statements',
      module: 'FINANCIAL',
      priority: 'high',
      dueDate: '2025-11-12',
      assignedTo: currentUser?.fullName,
      status: 'in-progress',
    },
    {
      id: 'task-3',
      title: 'Reconcile November Bank Statements',
      module: 'CASH_MANAGEMENT',
      priority: 'medium',
      dueDate: '2025-11-15',
      assignedTo: currentUser?.fullName,
      status: 'pending',
    },
    {
      id: 'task-4',
      title: 'Process Payroll for November',
      module: 'HR_PAYROLL',
      priority: 'high',
      dueDate: '2025-11-25',
      assignedTo: 'HR Team',
      status: 'pending',
    },
    {
      id: 'task-5',
      title: 'Update Exchange Rates',
      module: 'FINANCIAL',
      priority: 'medium',
      dueDate: '2025-11-09',
      assignedTo: currentUser?.fullName,
      status: 'completed',
    },
  ];

  const getMockAlerts = (): Alert[] => [
    {
      id: 'alert-1',
      type: 'warning',
      message: 'Inventory levels low for 3 products',
      module: 'INVENTORY',
      timestamp: '2 hours ago',
      actionLabel: 'View Details',
      actionLink: '/inventory',
    },
    {
      id: 'alert-2',
      type: 'info',
      message: 'USD exchange rate changed by 2.5%',
      module: 'FINANCIAL',
      timestamp: '4 hours ago',
      actionLabel: 'Update Rates',
      actionLink: '/financial/settings',
    },
    {
      id: 'alert-3',
      type: 'success',
      message: 'Bank reconciliation completed for October',
      module: 'CASH_MANAGEMENT',
      timestamp: '1 day ago',
    },
    {
      id: 'alert-4',
      type: 'error',
      message: 'Failed to sync customer data',
      module: 'SALES_CRM',
      timestamp: '3 hours ago',
      actionLabel: 'Retry',
      actionLink: '/sales/sync',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={20} className="alert-icon-error" />;
      case 'warning':
        return <AlertCircle size={20} className="alert-icon-warning" />;
      case 'success':
        return <CheckCircle size={20} className="alert-icon-success" />;
      default:
        return <Bell size={20} className="alert-icon-info" />;
    }
  };

  if (isLoading) {
    return (
      <div className="enterprise-dashboard loading">
        <div className="loading-spinner">
          <Activity size={32} className="spin" />
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard">
      {/* Hero Section - Role-Based Welcome */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome back, {currentUser?.firstName || 'User'}
          </h1>
          <p className="hero-subtitle">
            {currentUser?.role.displayName} • {currentClient?.displayName || 'All Clients'}
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <Calendar size={20} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="hero-stat">
              <Target size={20} />
              <span>{(tasks || []).filter(t => t.status === 'pending').length} pending tasks</span>
            </div>
            <div className="hero-stat">
              <Bell size={20} />
              <span>{(alerts || []).length} notifications</span>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <Link to="/multi-client" className="hero-action-btn primary">
            <BarChart3 size={18} />
            Multi-Client View
          </Link>
          <button className="hero-action-btn secondary">
            <Settings size={18} />
            Customize
          </button>
        </div>
      </div>

      {/* Workspace Cards - SAP Fiori Style */}
      <div className="workspace-section">
        <div className="section-header-inline">
          <h2 className="section-title">My Workspace</h2>
          <span className="section-badge">{workspaceCards.length} Modules</span>
        </div>
        
        <div className="workspace-grid">
          {workspaceCards.map(card => (
            <Link to={card.link} key={card.id} className={`workspace-card ${card.priority}`}>
              <div className="card-header-workspace">
                <div className={`card-icon-workspace status-${card.status}`}>
                  {card.icon}
                </div>
                <div className={`card-status-badge ${card.status}`}>
                  {card.status === 'success' && <CheckCircle size={14} />}
                  {card.status === 'warning' && <AlertCircle size={14} />}
                  {card.status === 'danger' && <AlertCircle size={14} />}
                </div>
              </div>
              <div className="card-content-workspace">
                <h3 className="card-title-workspace">{card.title}</h3>
                <p className="card-subtitle-workspace">{card.subtitle}</p>
                <div className="card-value-workspace">{card.value}</div>
                {card.change && (
                  <div className={`card-change ${card.changeType}`}>
                    {card.changeType === 'positive' && <TrendingUp size={14} />}
                    {card.changeType === 'negative' && <Activity size={14} />}
                    <span>{card.change}</span>
                  </div>
                )}
              </div>
              <div className="card-footer-workspace">
                {/* Some cards may not have module set; guard to avoid runtime errors */}
                <span>Open {(card.module || '').toLowerCase()}</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-Column Layout: Tasks & Alerts */}
      <div className="dashboard-columns">
        {/* Tasks Section */}
        <div className="dashboard-column">
          <div className="section-header-inline">
            <h2 className="section-title">My Tasks</h2>
            <span className="section-badge">{(tasks || []).filter(t => t.status !== 'completed').length} Active</span>
          </div>
          
          <div className="tasks-list">
            {(tasks || []).map(task => (
              <div key={task.id} className={`task-item ${task.status}`}>
                <div className={`task-priority ${getPriorityColor(task.priority)}`} />
                <div className="task-content">
                  <h4 className="task-title">{task.title}</h4>
                  <div className="task-meta">
                    <span className="task-module">{task.module}</span>
                    {task.dueDate && (
                      <>
                        <span className="task-separator">•</span>
                        <span className="task-due">
                          <Clock size={12} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`task-status-badge ${task.status}`}>
                  {task.status === 'completed' && <CheckCircle size={18} />}
                  {task.status === 'in-progress' && <Activity size={18} />}
                  {task.status === 'pending' && <Clock size={18} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Section */}
        <div className="dashboard-column">
          <div className="section-header-inline">
            <h2 className="section-title">Notifications</h2>
            <span className="section-badge">{(alerts || []).length}</span>
          </div>
          
          <div className="alerts-list">
            {(alerts || []).map(alert => (
              <div key={alert.id} className={`alert-item ${alert.type}`}>
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-meta">
                    <span className="alert-module">{alert.module}</span>
                    <span className="alert-separator">•</span>
                    <span className="alert-time">{alert.timestamp}</span>
                  </div>
                </div>
                {alert.actionLink && (
                  <Link to={alert.actionLink} className="alert-action">
                    {alert.actionLabel}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Analytics - Data Visualization */}
      <div className="analytics-section">
        <div className="section-header-inline">
          <h2 className="section-title">Quick Analytics</h2>
          <Link to="/analytics" className="section-link">
            View All Reports <ArrowRight size={14} />
          </Link>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-header">
              <h3>Revenue Trend</h3>
              <PieChart size={20} />
            </div>
            <div className="analytics-value">{formatCurrency(12847320)}</div>
            <div className="analytics-change positive">
              <TrendingUp size={14} />
              <span>+8.2% vs last period</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <h3>Cash Flow</h3>
              <Activity size={20} />
            </div>
            <div className="analytics-value">{formatCurrency(11847320)}</div>
            <div className="analytics-change positive">
              <TrendingUp size={14} />
              <span>+5.1% vs last period</span>
            </div>
          </div>

          <div className="analytics-card">
            <div className="analytics-header">
              <h3>Active Projects</h3>
              <Briefcase size={20} />
            </div>
            <div className="analytics-value">24</div>
            <div className="analytics-change neutral">
              <span>3 completing this month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
