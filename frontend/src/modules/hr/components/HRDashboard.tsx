/**
 * HR & PAYROLL DASHBOARD
 * 
 * Overview of workforce metrics, payroll status, and HR activities
 */

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';

interface DashboardData {
  total_employees: number;
  by_department: Array<{
    department_name: string;
    employee_count: string;
  }>;
  pending_leave_requests: number;
  payroll_summary: {
    total_gross: number;
    total_net: number;
    total_employees: number;
  } | null;
  headcount_trend: Array<{
    month: string;
    new_hires: string;
  }>;
}

const HRDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr/dashboard`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching HR dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Failed to load dashboard data</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: dashboardData.total_employees,
      icon: Users,
      color: 'blue',
      description: 'Active employees'
    },
    {
      title: 'Departments',
      value: dashboardData.by_department.length,
      icon: Building2,
      color: 'green',
      description: 'Organization units'
    },
    {
      title: 'Pending Leave',
      value: dashboardData.pending_leave_requests,
      icon: Calendar,
      color: 'yellow',
      description: 'Awaiting approval'
    },
    {
      title: 'Monthly Payroll',
      value: dashboardData.payroll_summary 
        ? `R ${(dashboardData.payroll_summary.total_net / 1000).toFixed(1)}K`
        : 'N/A',
      icon: DollarSign,
      color: 'purple',
      description: 'Current month net'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR & Payroll Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your workforce and payroll metrics</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            New Employee
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Reports
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            purple: 'bg-purple-100 text-purple-600'
          };

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Employees by Department
            </CardTitle>
            <CardDescription>Distribution across organization units</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.by_department
                .sort((a, b) => parseInt(b.employee_count) - parseInt(a.employee_count))
                .map((dept, index) => {
                  const count = parseInt(dept.employee_count);
                  const maxCount = Math.max(...dashboardData.by_department.map(d => parseInt(d.employee_count)));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{dept.department_name}</span>
                        <span className="text-gray-500">{count} employees</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Headcount Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              New Hires Trend
            </CardTitle>
            <CardDescription>Monthly hiring activity (Last 12 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.headcount_trend.slice(-6).map((trend, index) => {
                const count = parseInt(trend.new_hires);
                const maxCount = Math.max(...dashboardData.headcount_trend.map(t => parseInt(t.new_hires)), 1);
                const percentage = (count / maxCount) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">{trend.month}</span>
                      <span className="text-gray-500">{count} hires</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
              <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Manage Employees</h3>
              <p className="text-sm text-gray-500">View and update employee records</p>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group">
              <DollarSign className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Process Payroll</h3>
              <p className="text-sm text-gray-500">Run monthly payroll processing</p>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all text-left group">
              <Calendar className="w-8 h-8 text-gray-400 group-hover:text-yellow-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Leave Requests</h3>
              <p className="text-sm text-gray-500">Review pending leave applications</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      {dashboardData.payroll_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Current Month Payroll Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Employees Processed</div>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData.payroll_summary.total_employees}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Gross Payroll</div>
                <div className="text-2xl font-bold text-green-600">
                  R {dashboardData.payroll_summary.total_gross.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Net Payroll</div>
                <div className="text-2xl font-bold text-purple-600">
                  R {dashboardData.payroll_summary.total_net.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HRDashboard;
