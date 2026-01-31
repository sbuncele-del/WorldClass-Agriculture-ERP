import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Trip {
  trip_id: string;
  customer: string;
  origin: string;
  destination: string;
  driver: string;
  vehicle_reg: string;
  status: 'Planned' | 'Assigned' | 'Loading' | 'In Transit' | 'Delivered' | 'Cancelled';
  pod_status: 'Pending' | 'Received';
  eta: string;
}

const TripManagementEnhanced: React.FC = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await apiClient.get('/api/logistics/trips');
        const data = response.data.trips || response.data || [];
        setTrips(data.map((t: any) => ({
          trip_id: t.trip_id || t.id,
          customer: t.customer || t.customer_name,
          origin: t.origin,
          destination: t.destination,
          driver: t.driver || t.driver_name,
          vehicle_reg: t.vehicle_reg || t.registration,
          status: t.status || 'Planned',
          pod_status: t.pod_status || 'Pending',
          eta: t.eta || ''
        })));
      } catch (error) {
        console.error('Failed to fetch trips:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
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
    { label: 'Trip Management' }
  ];

  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'Planned': return '#64748b';
      case 'Assigned': return '#0ea5e9';
      case 'Loading': return '#f59e0b';
      case 'In Transit': return '#8b5cf6';
      case 'Delivered': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.trip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <EnterpriseLayout
      moduleTitle="Trip Management"
      moduleSubtitle="Create and track deliveries with digital POD"
      breadcrumbs={breadcrumbs}
      tabs={tabs}
        actionButtons={[
        {
          label: '+ Create Trip',
          icon: <span>📋</span>,
          variant: 'primary' as const,
          onClick: () => navigate('/logistics/trips/new')
        }
      ]}
    >
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-header">
            <span className="metric-label">Total Trips</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>📦</span>
          </div>
          <div className="metric-value">{trips.length}</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="metric-header">
            <span className="metric-label">In Transit</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>🚚</span>
          </div>
          <div className="metric-value">{trips.filter(t => t.status === 'In Transit').length}</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-header">
            <span className="metric-label">Pending POD</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>📄</span>
          </div>
          <div className="metric-value">{trips.filter(t => t.pod_status === 'Pending' && t.status !== 'Cancelled').length}</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-header">
            <span className="metric-label">Delivered Today</span>
            <span className="metric-icon" style={{ fontSize: '1.5rem' }}>✅</span>
          </div>
          <div className="metric-value">
            {trips.filter(t => t.status === 'Delivered' && new Date(t.eta).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-content">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="🔍 Search by Trip ID, Customer, Origin, or Destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.25rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '0.9375rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {['All', 'In Transit', 'Loading', 'Delivered', 'Planned'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    background: statusFilter === status 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'white',
                    color: statusFilter === status ? 'white' : '#64748b',
                    border: statusFilter === status ? '2px solid #667eea' : '2px solid transparent',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
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

      <div className="content-card">
        <div className="card-header">
          <h2 className="card-title">Trip Roster ({filteredTrips.length})</h2>
        </div>
        <div className="card-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Driver & Vehicle</th>
                  <th>Status</th>
                  <th>POD</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => (
                  <tr key={trip.trip_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600 }}>{trip.trip_id}</td>
                    <td style={{ fontWeight: 600 }}>{trip.customer}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {trip.origin} <span style={{ color: '#667eea', fontWeight: 700 }}>→</span> {trip.destination}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{trip.driver}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trip.vehicle_reg}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        backgroundColor: getStatusColor(trip.status) + '20',
                        color: getStatusColor(trip.status),
                        fontSize: '0.8125rem',
                        fontWeight: 700
                      }}>
                        {trip.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '1.25rem' }}>
                      {trip.pod_status === 'Received' ? '✅' : '⏳'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="action-button" 
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                          onClick={() => navigate(`/logistics/trips/${trip.trip_id}`)}
                        >
                          📄 Details
                        </button>
                        <button 
                          className="action-button" 
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}
                          onClick={() => {
                            alert(`📍 Live Tracking\n\nTrip: ${trip.trip_id}\nVehicle: ${trip.vehicle_reg}\nDriver: ${trip.driver}\n\nCurrent Location: N1 Highway\nSpeed: 85 km/h\nETA: ${trip.eta}\n\nIn production:\n• Opens live GPS map\n• Real-time position updates\n• Route history\n• Traffic conditions\n\nIntegration: CarTrack/MiX Telematics API`);
                          }}
                        >
                          📍 Track
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

export default TripManagementEnhanced;
