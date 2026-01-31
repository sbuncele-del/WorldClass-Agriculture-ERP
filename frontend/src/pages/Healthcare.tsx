import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Healthcare.css';

interface DashboardStats {
  activePatients: number;
  patientsChange: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  monthlyRevenue: number;
  revenueVsTarget: number;
  lowStockItems: number;
}

const Healthcare: React.FC = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    patientsChange: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    monthlyRevenue: 0,
    revenueVsTarget: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, appointmentsRes, inventoryRes, billingRes, dashboardRes] = await Promise.all([
          apiClient.get('/api/healthcare/patients'),
          apiClient.get('/api/healthcare/appointments'),
          apiClient.get('/api/healthcare/inventory'),
          apiClient.get('/api/healthcare/billing'),
          apiClient.get('/api/v2/healthcare/dashboard')
        ]);
        const patientsData = patientsRes.data?.data || patientsRes.data || [];
        const appointmentsData = appointmentsRes.data?.data || appointmentsRes.data || [];
        const inventoryData = inventoryRes.data?.data || inventoryRes.data || [];
        const billingData = billingRes.data?.data || billingRes.data || [];
        
        setPatients(patientsData);
        setAppointments(appointmentsData);
        setInventory(inventoryData);
        setBilling(billingData);

        // Use dashboard data if available, otherwise calculate from fetched data
        if (dashboardRes.data?.success && dashboardRes.data?.data) {
          const dashboard = dashboardRes.data.data;
          setStats({
            activePatients: dashboard.totalPatients || patientsData.length,
            patientsChange: dashboard.patientsChange || 0,
            todayAppointments: dashboard.todayAppointments || appointmentsData.filter((a: any) => {
              const today = new Date().toISOString().split('T')[0];
              return a.appointment_date?.startsWith(today) || a.date?.startsWith(today);
            }).length,
            completedAppointments: dashboard.completedAppointments || appointmentsData.filter((a: any) => a.status === 'COMPLETED' || a.status === 'completed').length,
            pendingAppointments: dashboard.pendingAppointments || appointmentsData.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'scheduled').length,
            monthlyRevenue: dashboard.monthlyRevenue || billingData.reduce((sum: number, b: any) => sum + (b.total_amount || b.amount || 0), 0),
            revenueVsTarget: dashboard.revenueVsTarget || 0,
            lowStockItems: dashboard.lowStockItems || inventoryData.filter((i: any) => i.quantity < (i.reorder_level || 10)).length
          });
        } else {
          // Calculate stats from raw data
          const today = new Date().toISOString().split('T')[0];
          const todaysAppts = appointmentsData.filter((a: any) => 
            a.appointment_date?.startsWith(today) || a.date?.startsWith(today)
          );
          setStats({
            activePatients: patientsData.length,
            patientsChange: 0,
            todayAppointments: todaysAppts.length,
            completedAppointments: todaysAppts.filter((a: any) => a.status === 'COMPLETED' || a.status === 'completed').length,
            pendingAppointments: todaysAppts.filter((a: any) => a.status === 'SCHEDULED' || a.status === 'scheduled').length,
            monthlyRevenue: billingData.reduce((sum: number, b: any) => sum + (b.total_amount || b.amount || 0), 0),
            revenueVsTarget: 0,
            lowStockItems: inventoryData.filter((i: any) => i.quantity < (i.reorder_level || 10)).length
          });
        }
      } catch (err) {
        console.error('Error fetching healthcare data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R ${(amount / 1000).toFixed(0)}K`;
    return `R ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': case 'scheduled': case 'in stock': case 'paid': return '#10b981';
      case 'low stock': case 'pending': case 'follow-up': return '#f59e0b';
      case 'critical': case 'overdue': case 'out of stock': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <div className="healthcare-page">
      <div className="page-header">
        <div className="header-content">
          <h1>🏥 Healthcare Management</h1>
          <p>Complete patient care, appointments, billing, and inventory management</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">➕ New Patient</button>
          <button className="btn-secondary">📅 Schedule Appointment</button>
        </div>
      </div>

      {/* Key Metrics - Now Dynamic */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>👥</div>
          <div className="metric-details">
            <div className="metric-value">{stats.activePatients.toLocaleString()}</div>
            <div className="metric-label">Active Patients</div>
            <div className={`metric-change ${stats.patientsChange >= 0 ? 'positive' : 'negative'}`}>
              {stats.patientsChange >= 0 ? '+' : ''}{stats.patientsChange}% from last month
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>📅</div>
          <div className="metric-details">
            <div className="metric-value">{stats.todayAppointments}</div>
            <div className="metric-label">Today's Appointments</div>
            <div className="metric-change neutral">{stats.completedAppointments} completed, {stats.pendingAppointments} pending</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>💰</div>
          <div className="metric-details">
            <div className="metric-value">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="metric-label">Revenue This Month</div>
            <div className={`metric-change ${stats.revenueVsTarget >= 0 ? 'positive' : 'negative'}`}>
              {stats.revenueVsTarget >= 0 ? '+' : ''}{stats.revenueVsTarget}% vs target
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>📦</div>
          <div className="metric-details">
            <div className="metric-value">{stats.lowStockItems}</div>
            <div className="metric-label">Low Stock Items</div>
            <div className={`metric-change ${stats.lowStockItems > 0 ? 'warning' : 'positive'}`}>
              {stats.lowStockItems > 0 ? 'Requires attention' : 'All stocked'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
            👥 Patients
          </button>
          <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            📅 Appointments
          </button>
          <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            📦 Inventory
          </button>
          <button className={`tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
            💰 Billing
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'patients' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Patient Records</h2>
                <div className="section-actions">
                  <input type="text" placeholder="Search patients..." className="search-input" />
                  <button className="btn-icon">🔍</button>
                  <button className="btn-icon">📊</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Condition</th>
                      <th>Last Visit</th>
                      <th>Next Appointment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map(patient => (
                      <tr key={patient.id}>
                        <td><strong>{patient.id}</strong></td>
                        <td>{patient.name}</td>
                        <td>{patient.age}</td>
                        <td>{patient.condition}</td>
                        <td>{patient.lastVisit}</td>
                        <td>{patient.nextAppointment}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(patient.status) }}>{patient.status}</span></td>
                        <td>
                          <button className="btn-table">View</button>
                          <button className="btn-table">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Appointment Schedule</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                  <button className="btn-icon">📅</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Appointment ID</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(apt => (
                      <tr key={apt.id}>
                        <td><strong>{apt.id}</strong></td>
                        <td>{apt.patient}</td>
                        <td>{apt.doctor}</td>
                        <td>{apt.date}</td>
                        <td>{apt.time}</td>
                        <td>{apt.type}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(apt.status) }}>{apt.status}</span></td>
                        <td>
                          <button className="btn-table">Reschedule</button>
                          <button className="btn-table">Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Medical Inventory</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>All Categories</option>
                    <option>Medication</option>
                    <option>Supplies</option>
                    <option>Equipment</option>
                  </select>
                  <button className="btn-icon">➕</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Min Stock</th>
                      <th>Unit</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.id}</strong></td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td><strong>{item.stock}</strong></td>
                        <td>{item.minStock}</td>
                        <td>{item.unit}</td>
                        <td>{item.expiry}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(item.status) }}>{item.status}</span></td>
                        <td>
                          <button className="btn-table">Reorder</button>
                          <button className="btn-table">Adjust</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="data-section">
              <div className="section-header">
                <h2>Billing & Invoices</h2>
                <div className="section-actions">
                  <select className="filter-select">
                    <option>All Invoices</option>
                    <option>Paid</option>
                    <option>Pending</option>
                    <option>Overdue</option>
                  </select>
                  <button className="btn-icon">💵</button>
                </div>
              </div>
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Services</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.map(invoice => (
                      <tr key={invoice.id}>
                        <td><strong>{invoice.id}</strong></td>
                        <td>{invoice.patient}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.services}</td>
                        <td><strong>{invoice.amount}</strong></td>
                        <td>{invoice.paymentMethod}</td>
                        <td><span className="status-badge" style={{ background: getStatusColor(invoice.status) }}>{invoice.status}</span></td>
                        <td>
                          <button className="btn-table">View</button>
                          <button className="btn-table">Print</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Healthcare;
