import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  CheckCircle, Clock, FileText, ArrowUpRight, RefreshCw,
  Download, Calendar, BarChart3, PieChart, Activity, Home
} from 'lucide-react';
import './FinancialDashboardEnhanced.css';

interface KPIData {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  comparison: string;
  icon: React.ReactNode;
}

const FinancialDashboardEnhanced: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const kpiData: KPIData[] = [
    {
      title: 'Total Revenue',
      value: 'R 2.45M',
      trend: 12.5,
      trendLabel: 'vs last period',
      comparison: 'Target: R 2.3M',
      icon: <DollarSign size={20} />
    },
    {
      title: 'Net Profit',
      value: 'R 487K',
      trend: 8.2,
      trendLabel: 'margin',
      comparison: '+R 42K vs target',
      icon: <TrendingUp size={20} />
    },
    {
      title: 'Cash Position',
      value: 'R 1.2M',
      trend: -15,
      trendLabel: 'days coverage',
      comparison: '30 days recommended',
      icon: <Activity size={20} />
    },
    {
      title: 'Accounts Receivable',
      value: 'R 845K',
      trend: 42.3,
      trendLabel: 'DSO',
      comparison: '15% over 90 days',
      icon: <FileText size={20} />
    },
    {
      title: 'Accounts Payable',
      value: 'R 312K',
      trend: -28.1,
      trendLabel: 'DPO',
      comparison: 'R 85K due this week',
      icon: <Clock size={20} />
    },
    {
      title: 'Working Capital',
      value: 'R 1.73M',
      trend: 1.8,
      trendLabel: 'ratio',
      comparison: 'Healthy range',
      icon: <BarChart3 size={20} />
    }
  ];

  return (
    <div className="financial-dashboard-enhanced">
      {/* Breadcrumb */}
      <div className="fde-breadcrumb">
        <Home size={14} />
        <span>Dashboard</span>
        <span className="separator">›</span>
        <span>Financial Management</span>
        <span className="separator">›</span>
        <span className="active">Dashboard</span>
      </div>

      {/* Page Header */}
      <div className="fde-header">
        <div className="fde-header-left">
          <h1 className="fde-title">Financial Dashboard</h1>
          <p className="fde-subtitle">Real-time insights and comprehensive analytics</p>
        </div>
        <div className="fde-header-actions">
          <button className="fde-btn-secondary">
            <Download size={16} />
            <span>Export Report</span>
          </button>
          <button className="fde-btn-secondary">
            <Calendar size={16} />
            <span>Schedule</span>
          </button>
          <Link to="/financial/journal-entry/new" className="fde-btn-primary">
            <FileText size={16} />
            <span>New Entry</span>
          </Link>
        </div>
      </div>

      {/* SAP-style Horizontal Tabs */}
      <div className="fde-tabs">
        <button className="fde-tab active">Dashboard</button>
        <Link to="/financial/journal-entries" className="fde-tab">Journal Entries</Link>
        <Link to="/financial/trial-balance" className="fde-tab">Trial Balance</Link>
        <Link to="/financial/chart-of-accounts" className="fde-tab">Chart of Accounts</Link>
        <Link to="/financial/income-statement" className="fde-tab">Financial Statements</Link>
        <Link to="/financial/periods" className="fde-tab">Periods & Closing</Link>
        <Link to="/financial/dimensions" className="fde-tab">Dimensions</Link>
        <Link to="/financial/approvals" className="fde-tab">Approvals</Link>
      </div>

      {/* Scrollable Content with Purple Gradient */}
      <div className="fde-content">
        {loading ? (
          <div className="fde-loading">Loading...</div>
        ) : (
          <div className="fde-grid">
            {/* KPI Cards */}
            {kpiData.map((kpi, index) => (
              <div key={index} className="fde-kpi-card glass-card">
                <div className="kpi-header">
                  <span className="kpi-title">{kpi.title}</span>
                  <div className="kpi-icon">{kpi.icon}</div>
                </div>
                <div className="kpi-value">{kpi.value}</div>
                <div className={`kpi-trend ${kpi.trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {kpi.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{Math.abs(kpi.trend)}% {kpi.trendLabel}</span>
                </div>
                <div className="kpi-comparison">{kpi.comparison}</div>
              </div>
            ))}

            {/* Cash Flow Chart */}
            <div className="fde-chart-card glass-card cashflow-card">
              <div className="card-header">
                <h3 className="card-title">Cash Flow Analysis</h3>
                <Link to="/financial/cash-flow" className="icon-btn">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="chart-container">
                <PieChart size={48} className="chart-icon" />
                <div className="chart-placeholder">
                  <div className="chart-title">Cash Flow Waterfall</div>
                  <div className="chart-metrics">
                    <div className="metric">
                      <span className="metric-label">Operating</span>
                      <span className="metric-value positive">+R 450K</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Investing</span>
                      <span className="metric-value negative">-R 120K</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Financing</span>
                      <span className="metric-value negative">-R 80K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="fde-chart-card glass-card performance-card">
              <div className="card-header">
                <h3 className="card-title">Budget vs Actual</h3>
                <button className="icon-btn">
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="chart-container">
                <BarChart3 size={48} className="chart-icon" />
                <div className="chart-placeholder">
                  <div className="chart-title">Performance Trend</div>
                  <div className="chart-metrics">
                    <div className="metric">
                      <span className="metric-label">Revenue</span>
                      <span className="metric-value positive">+5.2%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Expenses</span>
                      <span className="metric-value positive">-2.1%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Profit</span>
                      <span className="metric-value positive">+8.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="fde-insights-card glass-card">
              <div className="card-header">
                <h3 className="card-title">AI Insights & Recommendations</h3>
                <div className="ai-badge">
                  <span className="ai-icon">🤖</span>
                  <span>AI</span>
                </div>
              </div>
              <ul className="insights-list">
                <li className="insight-item insight-positive">
                  <div className="insight-icon-wrapper">
                    <span className="insight-icon">↑</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-title">Revenue trending 12.5% above forecast</div>
                    <div className="insight-description">Consider increasing production capacity</div>
                  </div>
                </li>
                <li className="insight-item insight-warning">
                  <div className="insight-icon-wrapper">
                    <span className="insight-icon">⚠</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-title">Cash coverage below 30-day threshold</div>
                    <div className="insight-description">Accelerate collections on overdue accounts</div>
                  </div>
                </li>
                <li className="insight-item insight-info">
                  <div className="insight-icon-wrapper">
                    <span className="insight-icon">💡</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-title">3 compliance deadlines approaching</div>
                    <div className="insight-description">Review SARS Sentinel for details</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboardEnhanced;
