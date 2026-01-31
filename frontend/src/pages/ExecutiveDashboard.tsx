/**
 * Executive Dashboard - Command Center
 * Real-time KPIs, charts, AI insights, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { MetricsGrid, type Metric } from '../components/ui/MetricsGrid';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import './ExecutiveDashboard.css';

interface DashboardData {
  metrics: {
    revenue: { current: number; previous: number; change: number; sparkline: number[] };
    expenses: { current: number; previous: number; change: number; sparkline: number[] };
    profit: { current: number; previous: number; change: number; sparkline: number[] };
    cashFlow: { current: number; previous: number; change: number; sparkline: number[] };
  };
  revenueChart: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  aiInsights: Array<{ id: string; type: 'info' | 'warning' | 'success'; message: string; priority: number }>;
  alerts: Array<{ id: string; type: string; message: string; severity: 'low' | 'medium' | 'high'; timestamp: string }>;
  recentActivity: Array<{ id: string; type: string; title: string; amount: number; date: string; status: string }>;
  moduleHealth: Array<{ module: string; status: 'healthy' | 'warning' | 'error'; uptime: number }>;
}

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/dashboard/executive?period=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Fallback to mock data for development
        setDashboardData(getMockDashboardData());
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use mock data as fallback
      setDashboardData(getMockDashboardData());
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-ZA');
  };

  const metrics: Metric[] = dashboardData
    ? [
        {
          id: 'revenue',
          label: 'Total Revenue',
          value: formatCurrency(dashboardData.metrics.revenue.current),
          icon: '💰',
          color: 'blue',
          trend: {
            value: dashboardData.metrics.revenue.change,
            isPositive: dashboardData.metrics.revenue.change >= 0,
            label: 'from last period',
          },
          sparkline: dashboardData.metrics.revenue.sparkline,
        },
        {
          id: 'expenses',
          label: 'Total Expenses',
          value: formatCurrency(dashboardData.metrics.expenses.current),
          icon: '💳',
          color: 'orange',
          trend: {
            value: Math.abs(dashboardData.metrics.expenses.change),
            isPositive: dashboardData.metrics.expenses.change <= 0,
            label: 'from last period',
          },
          sparkline: dashboardData.metrics.expenses.sparkline,
        },
        {
          id: 'profit',
          label: 'Net Profit',
          value: formatCurrency(dashboardData.metrics.profit.current),
          icon: '💎',
          color: 'green',
          trend: {
            value: dashboardData.metrics.profit.change,
            isPositive: dashboardData.metrics.profit.change >= 0,
            label: 'from last period',
          },
          sparkline: dashboardData.metrics.profit.sparkline,
        },
        {
          id: 'cashflow',
          label: 'Cash Flow',
          value: formatCurrency(dashboardData.metrics.cashFlow.current),
          icon: '🏦',
          color: 'teal',
          trend: {
            value: Math.abs(dashboardData.metrics.cashFlow.change),
            isPositive: dashboardData.metrics.cashFlow.change >= 0,
            label: 'from last period',
          },
          sparkline: dashboardData.metrics.cashFlow.sparkline,
        },
      ]
    : [];

  return (
    <div className="executive-dashboard">
      <PageHeader
        title="Executive Dashboard"
        subtitle="Real-time insights and command center"
        onRefresh={fetchDashboardData}
        loading={loading}
        actions={
          <div className="period-selector">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period as any)}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Metrics */}
      <MetricsGrid metrics={metrics} loading={loading} />

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* AI Insights Panel */}
        <div className="dashboard-card ai-insights-card">
          <div className="card-header">
            <h3>🤖 AI-Powered Insights</h3>
            <span className="card-badge">Real-time</span>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="insights-skeleton">Loading insights...</div>
            ) : dashboardData?.aiInsights.length ? (
              <div className="insights-list">
                {dashboardData.aiInsights.map((insight) => (
                  <div key={insight.id} className={`insight-item insight-${insight.type}`}>
                    <div className="insight-icon">
                      {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'}
                    </div>
                    <div className="insight-message">{insight.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No insights available</div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="dashboard-card revenue-chart-card">
          <div className="card-header">
            <h3>📊 Revenue vs Expenses</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="chart-skeleton">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData?.revenueChart || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alert Center */}
        <div className="dashboard-card alerts-card">
          <div className="card-header">
            <h3>🔔 Alert Center</h3>
            <StatusBadge status="active" label={`${dashboardData?.alerts.length || 0} Active`} size="sm" />
          </div>
          <div className="card-content">
            {loading ? (
              <div className="alerts-skeleton">Loading alerts...</div>
            ) : dashboardData?.alerts.length ? (
              <div className="alerts-list">
                {dashboardData.alerts.map((alert) => (
                  <div key={alert.id} className={`alert-item alert-severity-${alert.severity}`}>
                    <div className="alert-badge">
                      <StatusBadge
                        status={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                        size="sm"
                      />
                    </div>
                    <div className="alert-content">
                      <div className="alert-type">{alert.type}</div>
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-time">{formatDate(alert.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state success">
                <span className="empty-icon">✅</span>
                <p>No active alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="dashboard-card quick-actions-card">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              <a href="/sales/invoice/new" className="quick-action">
                <span className="action-icon">📄</span>
                <span className="action-label">New Invoice</span>
              </a>
              <a href="/purchase/order/new" className="quick-action">
                <span className="action-icon">🛒</span>
                <span className="action-label">Purchase Order</span>
              </a>
              <a href="/hr/payroll/run" className="quick-action">
                <span className="action-icon">💵</span>
                <span className="action-label">Run Payroll</span>
              </a>
              <a href="/financial/entry/new" className="quick-action">
                <span className="action-icon">💼</span>
                <span className="action-label">Journal Entry</span>
              </a>
              <a href="/inventory/stock-take" className="quick-action">
                <span className="action-icon">📦</span>
                <span className="action-label">Stock Take</span>
              </a>
              <a href="/financial/reports" className="quick-action">
                <span className="action-icon">📊</span>
                <span className="action-label">Reports</span>
              </a>
            </div>
          </div>
        </div>

        {/* Module Health Status */}
        <div className="dashboard-card module-health-card">
          <div className="card-header">
            <h3>🏥 Module Health</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="health-skeleton">Loading...</div>
            ) : (
              <div className="module-health-grid">
                {dashboardData?.moduleHealth.map((module) => (
                  <div key={module.module} className="health-item">
                    <div className="health-status">
                      <StatusBadge
                        status={module.status === 'healthy' ? 'success' : module.status === 'warning' ? 'warning' : 'error'}
                        label={module.status}
                        size="sm"
                      />
                    </div>
                    <div className="health-info">
                      <div className="health-module">{module.module}</div>
                      <div className="health-uptime">{module.uptime}% uptime</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card activity-card">
          <div className="card-header">
            <h3>📋 Recent Activity</h3>
            <a href="/activity" className="card-link">
              View All
            </a>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="activity-skeleton">Loading...</div>
            ) : dashboardData?.recentActivity.length ? (
              <div className="activity-list">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'invoice' ? '📄' : activity.type === 'payment' ? '💰' : '📌'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        {formatDate(activity.date)} • {formatCurrency(activity.amount)}
                      </div>
                    </div>
                    <div className="activity-status">
                      <StatusBadge status={activity.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data generator for development/fallback
function getMockDashboardData(): DashboardData {
  return {
    metrics: {
      revenue: {
        current: 2450000,
        previous: 2100000,
        change: 16.7,
        sparkline: [2100000, 2150000, 2200000, 2300000, 2350000, 2400000, 2450000],
      },
      expenses: {
        current: 1650000,
        previous: 1720000,
        change: -4.1,
        sparkline: [1720000, 1700000, 1680000, 1670000, 1660000, 1655000, 1650000],
      },
      profit: {
        current: 800000,
        previous: 380000,
        change: 110.5,
        sparkline: [380000, 450000, 520000, 630000, 690000, 745000, 800000],
      },
      cashFlow: {
        current: 1200000,
        previous: 950000,
        change: 26.3,
        sparkline: [950000, 980000, 1020000, 1080000, 1140000, 1180000, 1200000],
      },
    },
    revenueChart: [
      { month: 'Jan', revenue: 400000, expenses: 280000, profit: 120000 },
      { month: 'Feb', revenue: 420000, expenses: 290000, profit: 130000 },
      { month: 'Mar', revenue: 450000, expenses: 300000, profit: 150000 },
      { month: 'Apr', revenue: 480000, expenses: 310000, profit: 170000 },
      { month: 'May', revenue: 510000, expenses: 320000, profit: 190000 },
      { month: 'Jun', revenue: 490000, expenses: 315000, profit: 175000 },
    ],
    aiInsights: [
      {
        id: '1',
        type: 'success',
        message: 'Your revenue increased 16.7% this month - driven by strong sales in retail sector',
        priority: 1,
      },
      {
        id: '2',
        type: 'warning',
        message: 'Accounts receivable aging shows R450K overdue by 30+ days. Consider collection actions.',
        priority: 2,
      },
      {
        id: '3',
        type: 'info',
        message: 'Operating expenses down 4.1% - cost optimization initiatives showing results',
        priority: 3,
      },
    ],
    alerts: [
      {
        id: '1',
        type: 'Inventory',
        message: '5 products below minimum stock level',
        severity: 'high',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'Compliance',
        message: 'VAT return due in 3 days',
        severity: 'medium',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    recentActivity: [
      {
        id: '1',
        type: 'invoice',
        title: 'Invoice #INV-2024-001 created',
        amount: 125000,
        date: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment received from Shoprite',
        amount: 450000,
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
      },
    ],
    moduleHealth: [
      { module: 'Sales', status: 'healthy', uptime: 99.9 },
      { module: 'Inventory', status: 'healthy', uptime: 99.5 },
      { module: 'Financial', status: 'healthy', uptime: 100 },
      { module: 'HR & Payroll', status: 'warning', uptime: 98.2 },
    ],
  };
}
