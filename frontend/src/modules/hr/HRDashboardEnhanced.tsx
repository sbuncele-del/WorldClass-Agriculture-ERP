import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import { DollarSign, Calendar, Shield, UserPlus, BarChart3, FileText } from 'lucide-react';
import '../../styles/erp-ui.css';

interface HRStats {
  current_period: {
    fiscal_year: number;
    period_number: number;
    period_name: string;
    status: string;
  };
  hr_summary: {
    total_employees: number;
    active_employees: number;
    total_payroll: number;
    pending_leave: number;
    open_positions: number;
    compliance_score: number;
  };
  top_departments: {
    dept_1: { name: string; headcount: number };
    dept_2: { name: string; headcount: number };
    dept_3: { name: string; headcount: number };
  };
}

const HRDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<HRStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/hr/dashboard/stats');
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
      } else {
        // Fallback to default structure if API returns unexpected format
        setStats({
          current_period: {
            fiscal_year: new Date().getFullYear(),
            period_number: new Date().getMonth() + 1,
            period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            status: 'OPEN'
          },
          hr_summary: {
            total_employees: 0,
            active_employees: 0,
            total_payroll: 0,
            pending_leave: 0,
            open_positions: 0,
            compliance_score: 0
          },
          top_departments: {
            dept_1: { name: 'N/A', headcount: 0 },
            dept_2: { name: 'N/A', headcount: 0 },
            dept_3: { name: 'N/A', headcount: 0 }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching HR dashboard data:', err);
      // Set fallback data on error
      setStats({
        current_period: {
          fiscal_year: new Date().getFullYear(),
          period_number: new Date().getMonth() + 1,
          period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          status: 'OPEN'
        },
        hr_summary: {
          total_employees: 0,
          active_employees: 0,
          total_payroll: 0,
          pending_leave: 0,
          open_positions: 0,
          compliance_score: 0
        },
        top_departments: {
          dept_1: { name: 'N/A', headcount: 0 },
          dept_2: { name: 'N/A', headcount: 0 },
          dept_3: { name: 'N/A', headcount: 0 }
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

  const getComplianceColor = (score: number): string => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'orange';
    return 'red';
  };

  if (loading || !stats) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  const hrTabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/hr/dashboard' },
    { id: 'employees', label: 'Employees', path: '/hr/employees' },
    { id: 'payroll', label: 'Payroll', path: '/hr/payroll' },
    { id: 'leave', label: 'Leave Management', path: '/hr/leave' },
    { id: 'compliance', label: 'RSA Compliance', path: '/hr/compliance' },
  ];

  const secondaryNav: SecondaryNavSection[] = [
    {
      title: 'Quick Actions',
      items: [
        { id: 'add-employee', label: 'Add Employee', path: '/hr/employees/new', icon: <UserPlus size={16} /> },
        { id: 'process-payroll', label: 'Process Payroll', path: '/hr/payroll/process', icon: <DollarSign size={16} /> },
        { id: 'approve-leave', label: 'Approve Leave', path: '/hr/leave/approve', icon: <Calendar size={16} /> }
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'headcount', label: 'Headcount Report', path: '/hr/reports/headcount', icon: <BarChart3 size={16} /> },
        { id: 'payroll-report', label: 'Payroll Summary', path: '/hr/reports/payroll', icon: <FileText size={16} /> },
        { id: 'compliance-report', label: 'Compliance Report', path: '/hr/reports/compliance', icon: <Shield size={16} /> }
      ]
    }
  ];

  return (
    <EnterpriseLayout
      moduleTitle="HR & Payroll"
      moduleSubtitle="Human Resources Management - South African Labor Compliance"
      breadcrumbs={[
        { label: 'Dashboard', path: '/' },
        { label: 'HR & Payroll', path: '/hr/dashboard' }
      ]}
      tabs={hrTabs}
      secondaryNav={secondaryNav}
      actionButtons={[
        {
          label: 'Add Employee',
          icon: <UserPlus size={18} />,
          variant: 'primary'
        }
      ]}
    >
      <div className="dashboard-container">
        {/* Current Period Info */}
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

      <div className="dashboard-header">
        <div className="header-left">
          <h1>👥 Human Resources Dashboard</h1>
          <p className="subtitle">People Management & RSA Labor Compliance</p>
        </div>
        <div className="header-right">
          <div className="current-period-card">
            <div className="period-label">Current Period</div>
            <div className="period-name">{stats.current_period.period_name}</div>
            <span className={`period-status status-${getPeriodStatusColor(stats.current_period.status)}`}>
              {stats.current_period.status}
            </span>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">👤</div>
          <div className="metric-content">
            <div className="metric-label">Total Employees</div>
            <div className="metric-value">{stats.hr_summary.total_employees}</div>
            <div className="metric-trend positive">
              <span className="trend-icon">✓</span>
              <span className="trend-text">{stats.hr_summary.active_employees} active</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Monthly Payroll</div>
            <div className="metric-value">{formatCurrency(stats.hr_summary.total_payroll)}</div>
            <div className="metric-trend">
              <span className="trend-text">Including PAYE/UIF/SDL</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-label">Pending Leave</div>
            <div className="metric-value">{stats.hr_summary.pending_leave}</div>
            <div className="metric-trend">
              <span className="profit-margin">Requests awaiting approval</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Compliance Score</div>
            <div className="metric-value">
              <span className={`performance-badge badge-${getComplianceColor(stats.hr_summary.compliance_score)}`}>
                {stats.hr_summary.compliance_score}%
              </span>
            </div>
            <div className="metric-detail">
              <span className="pending-badge">{stats.hr_summary.open_positions} open positions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="balance-sheet-section">
        <h2>🏢 Top Departments by Headcount</h2>
        <div className="balance-cards">
          <div className="balance-card assets">
            <div className="balance-label">{stats.top_departments.dept_1.name}</div>
            <div className="balance-value">{stats.top_departments.dept_1.headcount} employees</div>
          </div>
          <div className="balance-card liabilities">
            <div className="balance-label">{stats.top_departments.dept_2.name}</div>
            <div className="balance-value">{stats.top_departments.dept_2.headcount} employees</div>
          </div>
          <div className="balance-card equity">
            <div className="balance-label">{stats.top_departments.dept_3.name}</div>
            <div className="balance-value">{stats.top_departments.dept_3.headcount} employees</div>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/hr/employees" className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-label">Employee Management</div>
          </Link>
          <Link to="/hr/payroll" className="action-card">
            <div className="action-icon">💰</div>
            <div className="action-label">Payroll Processing</div>
          </Link>
          <Link to="/hr/leave" className="action-card">
            <div className="action-icon">🏖️</div>
            <div className="action-label">Leave Management</div>
          </Link>
          <Link to="/hr/recruitment" className="action-card">
            <div className="action-icon">📝</div>
            <div className="action-label">Recruitment</div>
          </Link>
          <Link to="/hr/performance" className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-label">Performance Reviews</div>
          </Link>
          <Link to="/hr/compliance" className="action-card">
            <div className="action-icon">⚖️</div>
            <div className="action-label">RSA Compliance</div>
          </Link>
        </div>
      </div>
      </div>
    </EnterpriseLayout>
  );
};

export default HRDashboardEnhanced;
