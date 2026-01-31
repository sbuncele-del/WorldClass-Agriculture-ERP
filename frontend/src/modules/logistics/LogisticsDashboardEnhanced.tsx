import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import type { SecondaryNavSection } from '../../components/layout/SecondaryNav';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface LogisticsStats {
  fleet: {
    total_vehicles: number;
    active_vehicles: number;
    in_maintenance: number;
    vehicles_on_road: number;
  };
  drivers: {
    total_drivers: number;
    active_drivers: number;
    drivers_on_trip: number;
    available_drivers: number;
  };
  trips: {
    today_trips: number;
    in_transit: number;
    completed_today: number;
    pending_pods: number;
  };
  performance: {
    on_time_delivery_rate: number;
    fuel_efficiency: number;
    average_trip_duration: number;
    vehicle_utilization: number;
  };
  alerts: {
    overdue_maintenance: number;
    expiring_licenses: number;
    fuel_anomalies: number;
    delayed_trips: number;
  };
}

interface VehicleStatus {
  vehicle_id: number;
  vehicle_number: string;
  registration_number: string;
  status: string;
  current_location: string;
  driver_name: string;
  trip_number: string;
  destination: string;
  eta: string;
  load_percentage: number;
}

const LogisticsDashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<LogisticsStats | null>(null);
  const [activeVehicles, setActiveVehicles] = useState<VehicleStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, vehiclesRes] = await Promise.all([
        apiClient.get('/api/logistics/dashboard'),
        apiClient.get('/api/logistics/vehicles')
      ]);
      
      if (dashboardRes.data) {
        const data = dashboardRes.data.data || dashboardRes.data;
        setStats(data);
      }
      
      if (vehiclesRes.data) {
        setActiveVehicles(vehiclesRes.data.data || vehiclesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching logistics dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return '#10b981';
      case 'LOADING':
        return '#f59e0b';
      case 'IDLE':
        return '#64748b';
      case 'MAINTENANCE':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/logistics/dashboard' },
    { id: 'fleet', label: 'Fleet Management', path: '/logistics/fleet' },
    { id: 'drivers', label: 'Driver Management', path: '/logistics/drivers' },
    { id: 'trips', label: 'Trip Management', path: '/logistics/trips' },
    { id: 'planning', label: 'Load Planning', path: '/logistics/planning' },
    { id: 'fuel', label: 'Fuel Management', path: '/logistics/fuel' },
    { id: 'reports', label: 'Reports & Analytics', path: '/logistics/reports' }
  ];

  const breadcrumbs = [
    { label: 'Logistics', path: '/logistics' },
    { label: 'Dashboard' }
  ];

  if (loading) {
    return (
      <EnterpriseLayout
        moduleTitle="Logistics Management"
        moduleSubtitle="Real-time fleet management and dispatch control"
        breadcrumbs={breadcrumbs}
        tabs={tabs}
      >
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading logistics dashboard...</p>
        </div>
      </EnterpriseLayout>
    );
  }

  return (
    <EnterpriseLayout
      moduleTitle="Logistics Command Center"
      moduleSubtitle="Real-time fleet management and dispatch control"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      actionButtons={[
        {
          label: '+ New Trip',
          icon: <span>📋</span>,
          variant: 'primary' as const,
          onClick: () => window.location.href = '/logistics/trips/new'
        },
        {
          label: 'Plan Load',
          icon: <span>🗺️</span>,
          variant: 'secondary' as const,
          onClick: () => window.location.href = '/logistics/planning'
        }
      ]}
    >
      {/* Alerts Banner */}
      {stats && (stats.alerts.overdue_maintenance > 0 || stats.alerts.expiring_licenses > 0 || stats.alerts.delayed_trips > 0) && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
          border: '1px solid #fecaca', 
          borderRadius: '0.75rem', 
          padding: '1.25rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          {stats.alerts.overdue_maintenance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#fef2f2',
                borderRadius: '50%'
              }}>🔧</div>
              <div>
                <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '1.125rem' }}>
                  {stats.alerts.overdue_maintenance}
                </div>
                <div style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
                  Vehicles overdue for maintenance
                </div>
              </div>
            </div>
          )}
          {stats.alerts.expiring_licenses > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#fef2f2',
                borderRadius: '50%'
              }}>📄</div>
              <div>
                <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '1.125rem' }}>
                  {stats.alerts.expiring_licenses}
                </div>
                <div style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
                  Licenses expiring soon
                </div>
              </div>
            </div>
          )}
          {stats.alerts.delayed_trips > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                fontSize: '1.5rem', 
                width: '40px', 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#fef2f2',
                borderRadius: '50%'
              }}>⏰</div>
              <div>
                <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '1.125rem' }}>
                  {stats.alerts.delayed_trips}
                </div>
                <div style={{ color: '#b91c1c', fontSize: '0.875rem' }}>
                  Trips running behind schedule
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">Vehicles on Road</span>
            <span className="metric-icon" style={{ fontSize: '1.75rem' }}>🚛</span>
          </div>
          <div className="metric-value">{stats?.fleet.vehicles_on_road || 0}</div>
          <div className="metric-footer">
            <span className="metric-change">
              {stats?.fleet.active_vehicles || 0} of {stats?.fleet.total_vehicles || 0} active
            </span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">Trips Today</span>
            <span className="metric-icon" style={{ fontSize: '1.75rem' }}>📦</span>
          </div>
          <div className="metric-value">{stats?.trips.today_trips || 0}</div>
          <div className="metric-footer">
            <span className="metric-change success">
              {stats?.trips.completed_today || 0} completed, {stats?.trips.in_transit || 0} in transit
            </span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">On-Time Delivery</span>
            <span className="metric-icon" style={{ fontSize: '1.75rem' }}>⏱️</span>
          </div>
          <div className="metric-value">{stats?.performance.on_time_delivery_rate || 0}%</div>
          <div className="metric-footer">
            <span className="metric-change warning">
              Target: 95% ({(95 - (stats?.performance.on_time_delivery_rate || 0)).toFixed(1)}% gap)
            </span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="metric-header">
            <span className="metric-label">Fleet Utilization</span>
            <span className="metric-icon" style={{ fontSize: '1.75rem' }}>📊</span>
          </div>
          <div className="metric-value">{stats?.performance.vehicle_utilization || 0}%</div>
          <div className="metric-footer">
            <span className="metric-change">
              {stats?.drivers.available_drivers || 0} drivers available
            </span>
          </div>
        </div>
      </div>

      {/* Live Fleet Tracking Map */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🗺️</span>
            Live Fleet Tracking
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="action-button">
              <span style={{ marginRight: '0.5rem' }}>🔄</span>
              Refresh
            </button>
            <Link to="/logistics/map" className="action-button primary">
              <span style={{ marginRight: '0.5rem' }}>🗺️</span>
              Full Screen Map
            </Link>
          </div>
        </div>
        <div className="card-content">
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
            borderRadius: '0.75rem', 
            padding: '4rem 2rem', 
            textAlign: 'center',
            border: '2px dashed #cbd5e1',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)',
              pointerEvents: 'none'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'grayscale(0.3)' }}>🗺️</div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#334155', 
                marginBottom: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Live GPS Tracking Integration
              </h3>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                Connect your telematics provider for real-time vehicle tracking and route optimization
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'white', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  🛰️ Cartrack
                </div>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'white', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  📡 MiX Telematics
                </div>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'white', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  🌐 Ctrack
                </div>
              </div>
              <button className="action-button primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
                <span style={{ marginRight: '0.5rem' }}>⚙️</span>
                Configure GPS Provider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Vehicles Table */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🚚</span>
            Active Vehicles ({activeVehicles.length})
          </h2>
        </div>
        <div className="card-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Current Location</th>
                  <th>Trip</th>
                  <th>Destination</th>
                  <th>Load</th>
                  <th>ETA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div>
                        <strong style={{ fontSize: '0.9375rem' }}>{vehicle.vehicle_number}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                          {vehicle.registration_number}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{vehicle.driver_name}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(vehicle.status) + '20',
                          color: getStatusColor(vehicle.status),
                          fontWeight: 600,
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.8125rem'
                        }}
                      >
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                        📍 {vehicle.current_location}
                      </div>
                    </td>
                    <td>
                      <Link 
                        to={`/logistics/trips/${vehicle.trip_number}`} 
                        style={{ 
                          color: '#667eea', 
                          fontWeight: 600,
                          textDecoration: 'none',
                          fontSize: '0.875rem'
                        }}
                      >
                        {vehicle.trip_number}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{vehicle.destination}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${vehicle.load_percentage}%`,
                            height: '100%',
                            background: vehicle.load_percentage === 100 ? '#10b981' : vehicle.load_percentage >= 80 ? '#f59e0b' : '#667eea',
                            transition: 'width 0.3s'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>
                          {vehicle.load_percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{vehicle.eta}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="action-button" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                          📍 Track
                        </button>
                        <button className="action-button" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
                          💬 Contact
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
};

export default LogisticsDashboardEnhanced;
