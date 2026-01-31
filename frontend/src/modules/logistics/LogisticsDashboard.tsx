import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/erp-ui.css';
import { workspaceApi } from '../../services/api.service';

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
    fuel_efficiency: number; // km per litre
    average_trip_duration: number; // hours
    vehicle_utilization: number; // percentage
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
}

const LogisticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<LogisticsStats | null>(null);
  const [activeVehicles, setActiveVehicles] = useState<VehicleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch real data from backend
      const data = await workspaceApi.logistics.getDashboard();
      
      if (data && data.success) {
        setStats(data.data.stats);
        setActiveVehicles(data.data.activeVehicles || []);
      } else {
          setError(null);
        throw new Error('Failed to fetch dashboard data');
          throw new Error('Failed to fetch dashboard data');
    } catch (error) {
      console.error('Error fetching logistics dashboard:', error);
      // Fallback to mock data on error
        setError('Failed to load logistics dashboard');
        setStats(null);
        setActiveVehicles([]);
      console.error('Error fetching logistics dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return '#10b981'; // Green
      case 'LOADING':
        return '#f59e0b'; // Orange
      case 'IDLE':
        return '#64748b'; // Gray
      case 'MAINTENANCE':
        return '#ef4444'; // Red
      default:
        return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Loading logistics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '0.5rem', color: '#991b1b' }}>
          {error}
        </div>
      )}
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🚚 Logistics Command Center</h1>
          <p className="dashboard-subtitle">Real-time fleet management and dispatch control</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/logistics/trips/new" className="action-button">
            📋 New Trip
          </Link>
          <Link to="/logistics/planning" className="action-button primary">
            🗺️ Plan Load
          </Link>
        </div>
      </div>

      {/* Alerts Banner */}
      {stats && (stats.alerts.overdue_maintenance > 0 || stats.alerts.expiring_licenses > 0 || stats.alerts.delayed_trips > 0) && (
        <div style={{ 
          background: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {stats.alerts.overdue_maintenance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔧</span>
              <span style={{ color: '#991b1b', fontWeight: 600 }}>
                {stats.alerts.overdue_maintenance} vehicle(s) overdue for maintenance
              </span>
            </div>
          )}
          {stats.alerts.expiring_licenses > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📄</span>
              <span style={{ color: '#991b1b', fontWeight: 600 }}>
                {stats.alerts.expiring_licenses} license(s) expiring soon
              </span>
            </div>
          )}
          {stats.alerts.delayed_trips > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⏰</span>
              <span style={{ color: '#991b1b', fontWeight: 600 }}>
                {stats.alerts.delayed_trips} trip(s) running behind schedule
              </span>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">Vehicles on Road</span>
            <span className="metric-icon">🚛</span>
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
            <span className="metric-icon">📦</span>
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
            <span className="metric-icon">⏱️</span>
          </div>
          <div className="metric-value">{stats?.performance.on_time_delivery_rate || 0}%</div>
          <div className="metric-footer">
            <span className="metric-change">
              Target: 95%
            </span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="metric-header">
            <span className="metric-label">Fleet Utilization</span>
            <span className="metric-icon">📊</span>
          </div>
          <div className="metric-value">{stats?.performance.vehicle_utilization || 0}%</div>
          <div className="metric-footer">
            <span className="metric-change">
              {stats?.drivers.available_drivers || 0} drivers available
            </span>
          </div>
        </div>
      </div>

      {/* Active Vehicles Map View */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">🗺️ Live Fleet Tracking</h2>
          <Link to="/logistics/map" className="action-button">
            View Full Map
          </Link>
        </div>
        <div className="card-content">
          <div style={{ 
            background: '#f1f5f9', 
            borderRadius: '0.5rem', 
            padding: '3rem', 
            textAlign: 'center',
            border: '2px dashed #cbd5e1'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
            <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>Live GPS Map Integration</h3>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              Connect Cartrack, MiX Telematics, or Ctrack for real-time vehicle tracking
            </p>
            <button className="action-button primary">Configure GPS Provider</button>
          </div>
        </div>
      </div>

      {/* Active Vehicles Table */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">🚚 Active Vehicles</h2>
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
                  <th>ETA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicle_id}>
                    <td>
                      <div>
                        <strong>{vehicle.vehicle_number}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {vehicle.registration_number}
                        </div>
                      </div>
                    </td>
                    <td>{vehicle.driver_name}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(vehicle.status) + '20',
                          color: getStatusColor(vehicle.status)
                        }}
                      >
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.875rem' }}>{vehicle.current_location}</div>
                    </td>
                    <td>
                      <Link to={`/logistics/trips/${vehicle.trip_number}`} style={{ color: '#667eea', fontWeight: 600 }}>
                        {vehicle.trip_number}
                      </Link>
                    </td>
                    <td>{vehicle.destination}</td>
                    <td>{vehicle.eta}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="action-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          📍 Track
                        </button>
                        <button className="action-button" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
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

      {/* Quick Actions */}
      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">⚡ Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="quick-actions-grid">
            <Link to="/logistics/fleet" className="quick-action-card">
              <div className="quick-action-icon">🚚</div>
              <div className="quick-action-title">Fleet Management</div>
              <div className="quick-action-description">
                Manage vehicles, maintenance, documents
              </div>
            </Link>

            <Link to="/logistics/drivers" className="quick-action-card">
              <div className="quick-action-icon">👨‍✈️</div>
              <div className="quick-action-title">Driver Management</div>
              <div className="quick-action-description">
                Driver profiles, licenses, performance
              </div>
            </Link>

            <Link to="/logistics/trips" className="quick-action-card">
              <div className="quick-action-icon">📋</div>
              <div className="quick-action-title">Trip Management</div>
              <div className="quick-action-description">
                Create and track deliveries
              </div>
            </Link>

            <Link to="/logistics/planning" className="quick-action-card">
              <div className="quick-action-icon">🗺️</div>
              <div className="quick-action-title">Load Planning</div>
              <div className="quick-action-description">
                Optimize routes and loads
              </div>
            </Link>

            <Link to="/logistics/fuel" className="quick-action-card">
              <div className="quick-action-icon">⛽</div>
              <div className="quick-action-title">Fuel Management</div>
              <div className="quick-action-description">
                Track fuel costs and efficiency
              </div>
            </Link>

            <Link to="/logistics/reports" className="quick-action-card">
              <div className="quick-action-icon">📊</div>
              <div className="quick-action-title">Reports & Analytics</div>
              <div className="quick-action-description">
                Performance dashboards and insights
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard;
