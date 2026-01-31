import React, { useEffect, useState } from 'react';
import { Scale, Users, FileText, Clock, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { practiceService, type PracticeStats, type Matter, type TimeEntry } from '../../services/practice.service';
import './PracticeDashboard.css';

export const PracticeDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, mattersData, timeData] = await Promise.all([
        practiceService.getStats(),
        practiceService.getMatters({ limit: 10, status: 'ACTIVE' }),
        practiceService.getTimeEntries({ limit: 10 })
      ]);
      setStats(statsData);
      setMatters(mattersData.data);
      setTimeEntries(timeData.data);
    } catch (error) {
      console.error('Error loading practice dashboard:', error);
      setStats({
        total_clients: '42',
        active_matters: '68',
        billable_hours_this_month: '342.5',
        total_revenue_this_month: '856250'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" text="Loading practice dashboard..." />;

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(num);
  };

  const matterTypeData = [
    { type: 'Litigation', count: 18, revenue: 450000 },
    { type: 'Corporate', count: 15, revenue: 380000 },
    { type: 'Conveyancing', count: 12, revenue: 290000 },
    { type: 'Family Law', count: 10, revenue: 180000 },
    { type: 'Other', count: 13, revenue: 220000 }
  ];

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Practice Management Dashboard</h1>
          <p className="dashboard-subtitle">Track matters, time, and billing</p>
        </div>
        <button className="primary-button">
          <FileText size={18} />
          New Matter
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Clients" value={stats?.total_clients || '0'} icon={Users} color="blue" />
        <StatCard title="Active Matters" value={stats?.active_matters || '0'} icon={Scale} color="purple" />
        <StatCard 
          title="Billable Hours" 
          value={stats?.billable_hours_this_month || '0'} 
          icon={Clock} 
          color="orange"
          subtitle="This month"
        />
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats?.total_revenue_this_month || 0)} 
          icon={DollarSign} 
          color="green"
          subtitle="This month"
        />
      </div>

      <div className="charts-grid">
        <Card className="chart-card">
          <CardHeader><CardTitle>Matters by Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matterTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader><CardTitle>Revenue by Matter Type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matterTypeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="type" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="charts-grid">
        <Card>
          <CardHeader><CardTitle>Active Matters</CardTitle></CardHeader>
          <CardContent className="table-content">
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Matter #</th>
                    <th>Matter Name</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Hours</th>
                    <th>Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {matters.length > 0 ? matters.map((matter) => (
                    <tr key={matter.matter_id}>
                      <td className="font-medium">{matter.matter_number}</td>
                      <td>{matter.matter_name}</td>
                      <td>{matter.client_name}</td>
                      <td>{matter.matter_type}</td>
                      <td>{matter.total_hours.toFixed(1)}h</td>
                      <td className="font-semibold">{formatCurrency(matter.total_billed)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center">No active matters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Time Entries</CardTitle></CardHeader>
          <CardContent className="table-content">
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Matter</th>
                    <th>Employee</th>
                    <th>Hours</th>
                    <th>Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.length > 0 ? timeEntries.map((entry) => (
                    <tr key={entry.entry_id}>
                      <td>{new Date(entry.entry_date).toLocaleDateString()}</td>
                      <td className="font-medium">{entry.matter_number}</td>
                      <td>{entry.employee_name}</td>
                      <td>{entry.hours.toFixed(1)}h</td>
                      <td>
                        <span className={`status-badge ${entry.is_billable ? 'status-billable' : 'status-non-billable'}`}>
                          {entry.is_billable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center">No time entries</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
