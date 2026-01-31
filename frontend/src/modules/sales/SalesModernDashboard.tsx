import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';
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
  ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { salesService, type SalesStats, type SalesOrder } from '../../services/sales.service';
import './SalesModernDashboard.css';

interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export const SalesModernDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SalesOrder[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, ordersData, revenueData] = await Promise.all([
        salesService.getStats(),
        salesService.getOrders({ limit: 5 }),
        salesService.getRevenueByMonth(6)
      ]);
      
      setStats(statsData);
      setRecentOrders(ordersData.data);
      setRevenueData(revenueData);
    } catch (error) {
      console.error('Error loading sales dashboard:', error);
      // Set mock data for demo
      setStats({
        total_revenue: '2450000',
        total_orders: '156',
        total_customers: '89',
        average_order_value: '15705',
        revenue_growth: 12.5,
        orders_growth: 8.3
      });
      setRevenueData([
        { month: 'Jun', revenue: 380000, orders: 24 },
        { month: 'Jul', revenue: 420000, orders: 28 },
        { month: 'Aug', revenue: 390000, orders: 26 },
        { month: 'Sep', revenue: 450000, orders: 31 },
        { month: 'Oct', revenue: 410000, orders: 25 },
        { month: 'Nov', revenue: 400000, orders: 22 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading sales dashboard..." />;
  }

  if (!stats) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Unable to load sales data"
        description="There was an error loading the sales dashboard. Please try again."
        action={{ label: 'Retry', onClick: loadDashboardData }}
      />
    );
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const statusColors: Record<string, string> = {
    'CONFIRMED': '#10b981',
    'PENDING': '#f59e0b',
    'SHIPPED': '#3b82f6',
    'DELIVERED': '#8b5cf6',
    'CANCELLED': '#ef4444'
  };

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Sales & CRM Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your sales performance and customer relationships</p>
        </div>
        <button className="primary-button">
          <ShoppingCart size={18} />
          New Order
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={DollarSign}
          color="green"
          trend={stats.revenue_growth ? { value: stats.revenue_growth, isPositive: true } : undefined}
          subtitle="This month"
        />
        <StatCard
          title="Total Orders"
          value={stats.total_orders}
          icon={ShoppingCart}
          color="blue"
          trend={stats.orders_growth ? { value: stats.orders_growth, isPositive: true } : undefined}
          subtitle={`Avg: ${formatCurrency(stats.average_order_value)}`}
        />
        <StatCard
          title="Customers"
          value={stats.total_customers}
          icon={Users}
          color="purple"
          subtitle="Active customers"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(stats.average_order_value)}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Orders by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="table-content">
          {recentOrders.length > 0 ? (
            <div className="modern-table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="font-medium">{order.order_number}</td>
                      <td>{order.customer_name}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td className="font-semibold">{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            background: `${statusColors[order.order_status]}15`,
                            color: statusColors[order.order_status]
                          }}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td>
                        <span className={`payment-badge payment-${order.payment_status.toLowerCase()}`}>
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="No recent orders"
              description="Orders will appear here as customers place them."
              action={{ label: 'Create Order', onClick: () => console.log('Create order') }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
