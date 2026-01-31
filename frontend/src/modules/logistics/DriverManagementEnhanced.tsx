import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Driver {
  driver_id: string;
  name: string;
  employee_id: string;
  id_number: string;
  license_type: 'Code 08' | 'Code 10' | 'Code 14';
  prdp_expiry: string;
  medical_expiry: string;
  status: 'Active' | 'On Leave' | 'Inactive' | 'On Trip';
  total_trips: number;
  on_time_rate: number;
  incidents: number;
}

const DriverManagementEnhanced: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await apiClient.get('/api/logistics/drivers');
        setDrivers(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const tabs = [
    { id: 'command', label: '🎯 Command Center', path: '/logistics/dashboard' },
    { id: 'planner', label: '📋 Load Planner', path: '/logistics/planner' },
    { id: 'trips', label: '🚚 Trip Management', path: '/logistics/trips' },
    { id: 'fleet', label: '🚛 Fleet', path: '/logistics/fleet' },
    { id: 'drivers', label: '👨‍✈️ Drivers', path: '/logistics/drivers' },
    { id: 'fuel', label: '⛽ Fuel', path: '/logistics/fuel' },
    { id: 'reports', label: '📊 Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Driver Management' }
  ];

  // Drivers loaded from API

  const getDaysUntilExpiry = (date: string) => {
    const today = new Date();
    const expiryDate = new Date(date);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return '#ef4444';
    if (days <= 30) return '#f59e0b';
    return '#10b981';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10b981';
      case 'On Trip': return '#667eea';
      case 'On Leave': return '#f59e0b';
      case 'Inactive': return '#ef4444';
      default: return '#64748b';
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.id_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <EnterpriseLayout
      moduleTitle="Driver Management"
      moduleSubtitle="Driver profiles, licenses, and performance tracking"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actionButtons={[
        {
          label: '+ Add New Driver',
          icon: <span>👨‍✈️</span>,
          variant: 'primary' as const,
          onClick: () => alert('Add driver functionality')
        }
      ]}
    >
      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">Total Drivers</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>👨‍✈️</span>
          </div>
          <div className="metric-value">{drivers.length}</div>
          <div className="metric-footer">
            <span className="metric-change">All statuses</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">Available & Active</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>✅</span>
          </div>
          <div className="metric-value">{drivers.filter(d => d.status === 'Active').length}</div>
          <div className="metric-footer">
            <span className="metric-change success">Ready for trips</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">On Trip</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>🚚</span>
          </div>
          <div className="metric-value">{drivers.filter(d => d.status === 'On Trip').length}</div>
          <div className="metric-footer">
            <span className="metric-change">Currently driving</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="metric-header">
            <span className="metric-label">Docs Expiring Soon</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>⚠️</span>
          </div>
          <div className="metric-value">
            {drivers.filter(d => getDaysUntilExpiry(d.prdp_expiry) <= 30 || getDaysUntilExpiry(d.medical_expiry) <= 30).length}
          </div>
          <div className="metric-footer">
            <span className="metric-change error">Needs renewal</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card">
        <div className="card-content">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="🔍 Search by name, employee ID, or ID number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.25rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '0.9375rem',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['All', 'Active', 'On Trip', 'On Leave', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    border: statusFilter === status ? '2px solid #667eea' : '2px solid transparent',
                    borderRadius: '0.75rem',
                    background: statusFilter === status 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'white',
                    color: statusFilter === status ? 'white' : '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: statusFilter === status ? '0 4px 12px rgba(102, 126, 234, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Driver Roster ({filteredDrivers.length})</h2>
        </div>
        <div className="card-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Driver Name</th>
                  <th>Employee ID</th>
                  <th>License</th>
                  <th>PrDP Expiry</th>
                  <th>Medical Expiry</th>
                  <th>Performance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const prdpDays = getDaysUntilExpiry(driver.prdp_expiry);
                  const medicalDays = getDaysUntilExpiry(driver.medical_expiry);

                  return (
                    <tr key={driver.driver_id}>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(driver.status) + '20',
                            color: getStatusColor(driver.status),
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8125rem',
                            fontWeight: 700
                          }}
                        >
                          {driver.status}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{driver.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                            {driver.id_number}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{driver.employee_id}</td>
                      <td>
                        <span style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: '0.5rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontSize: '0.8125rem',
                          fontWeight: 700
                        }}>
                          {driver.license_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: getExpiryColor(prdpDays), fontWeight: prdpDays <= 30 ? 700 : 500 }}>
                          {new Date(driver.prdp_expiry).toLocaleDateString('en-ZA')}
                          <div style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>
                            {prdpDays < 0 ? '⚠️ EXPIRED' : `(${prdpDays} days)`}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: getExpiryColor(medicalDays), fontWeight: medicalDays <= 30 ? 700 : 500 }}>
                          {new Date(driver.medical_expiry).toLocaleDateString('en-ZA')}
                          <div style={{ fontSize: '0.75rem', marginTop: '0.125rem' }}>
                            {medicalDays < 0 ? '⚠️ EXPIRED' : `(${medicalDays} days)`}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          On-Time: {driver.on_time_rate}%
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                            {driver.total_trips} trips · {driver.incidents} incidents
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="action-button" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
                            📄 Docs
                          </button>
                          <button className="action-button" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
                            ✏️ Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default DriverManagementEnhanced;
