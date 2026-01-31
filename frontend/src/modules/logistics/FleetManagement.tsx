import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vehiclesAPI, Vehicle } from '../../services/logistics.api';
import '../../styles/erp-ui.css';

const FleetManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vehiclesAPI.getVehicles();
      setVehicles(response.vehicles || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to load vehicles. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'MAINTENANCE':
        return '#f59e0b';
      case 'OUT_OF_SERVICE':
        return '#ef4444';
      case 'SOLD':
        return '#64748b';
      default:
        return '#64748b';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return '#ef4444'; // Expired - Red
    if (days <= 30) return '#f59e0b'; // Expiring soon - Orange
    return '#10b981'; // Good - Green
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesFilter = filter === 'ALL' || vehicle.status === filter;
    const matchesSearch =
      searchTerm === '' ||
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">🚚 Fleet Management</h1>
          <p className="dashboard-subtitle">Manage vehicles, maintenance, and documents</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="action-button" onClick={fetchVehicles}>Refresh</button>
          <button className="action-button primary">+ Add Vehicle</button>
        </div>
      </div>

      {error && (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="metric-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="metric-value">{vehicles.length}</div>
          <div className="metric-label">Total Vehicles</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="metric-value">{vehicles.filter(v => v.status === 'ACTIVE').length}</div>
          <div className="metric-label">Active</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="metric-value">{vehicles.filter(v => v.status === 'MAINTENANCE').length}</div>
          <div className="metric-label">In Maintenance</div>
        </div>
        <div className="metric-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="metric-value">
            {vehicles.filter(v => getDaysUntilExpiry(v.license_expiry) <= 30).length}
          </div>
          <div className="metric-label">Expiring Soon</div>
        </div>
      </div>

      {/* Filters */}
      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-content">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="🔍 Search by vehicle number, registration, make, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ALL', 'ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className="filter-button"
                  style={{
                    padding: '0.5rem 1rem',
                    border: filter === status ? '2px solid #667eea' : '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    background: filter === status ? '#eff6ff' : 'white',
                    color: filter === status ? '#667eea' : '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: filter === status ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="content-card">
        <div className="card-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading vehicles...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No vehicles found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Make & Model</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Current Driver</th>
                    <th>Odometer</th>
                    <th>Next Service</th>
                    <th>License Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => {
                    const licenseDays = getDaysUntilExpiry(vehicle.license_expiry);
                    const roadworthyDays = getDaysUntilExpiry(vehicle.roadworthy_expiry);
                    const insuranceDays = getDaysUntilExpiry(vehicle.insurance_expiry);
                    const kmToService = vehicle.next_service_km - vehicle.current_odometer;

                    return (
                      <tr key={vehicle.vehicle_id}>
                        <td>
                          <div>
                            <strong style={{ fontSize: '0.875rem' }}>{vehicle.vehicle_number}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {vehicle.registration_number}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {vehicle.make} {vehicle.model}
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {vehicle.year_of_manufacture}
                            </div>
                          </div>
                        </td>
                        <td>{vehicle.vehicle_type}</td>
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
                        <td>{vehicle.current_driver}</td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {vehicle.current_odometer.toLocaleString()} km
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.875rem' }}>
                            {new Date(vehicle.next_service_date).toLocaleDateString('en-ZA')}
                            <div style={{ fontSize: '0.75rem', color: kmToService < 1000 ? '#f59e0b' : '#64748b' }}>
                              {kmToService.toLocaleString()} km to go
                            </div>
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              color: getExpiryColor(licenseDays),
                              fontWeight: licenseDays <= 30 ? 600 : 400
                            }}
                          >
                            {new Date(vehicle.license_expiry).toLocaleDateString('en-ZA')}
                            <div style={{ fontSize: '0.75rem' }}>
                              {licenseDays < 0 ? 'EXPIRED' : `${licenseDays} days`}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="action-button"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="action-button"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              📄 Docs
                            </button>
                            <button
                              className="action-button"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              🔧 Service
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetManagement;
