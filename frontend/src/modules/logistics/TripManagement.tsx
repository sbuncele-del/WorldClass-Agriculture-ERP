import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaPlus, FaFileAlt, FaMapMarkerAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import apiClient from '../../services/api';
import '../../App.css';

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

const getStatusBadge = (status: Trip['status']) => {
  switch (status) {
    case 'Planned': return 'badge-gray';
    case 'Assigned': return 'badge-blue';
    case 'Loading': return 'badge-yellow';
    case 'In Transit': return 'badge-purple';
    case 'Delivered': return 'badge-green';
    case 'Cancelled': return 'badge-red';
    default: return 'badge-gray';
  }
};

const TripManagement: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/logistics/trips');
      const data = response.data?.data || response.data || [];
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = trip.trip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trip.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trip.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            trip.destination.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  const summaryStats = useMemo(() => ({
    total: trips.length,
    inTransit: trips.filter(t => t.status === 'In Transit').length,
    pendingPOD: trips.filter(t => t.pod_status === 'Pending' && t.status !== 'Cancelled').length,
    deliveredToday: trips.filter(t => t.status === 'Delivered' && new Date(t.eta).toDateString() === new Date().toDateString()).length,
  }), [trips]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Trip Management</h1>
        <div className="page-actions">
          <Link to="/logistics/trips/new" className="btn btn-primary">
            <FaPlus className="mr-2" /> Create Trip
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="summary-card">
          <h3 className="summary-card-title">Total Trips</h3>
          <p className="summary-card-value">{summaryStats.total}</p>
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">In Transit</h3>
          <p className="summary-card-value">{summaryStats.inTransit}</p>
        </div>
        <div className="summary-card-alert">
          <h3 className="summary-card-title">Pending POD</h3>
          <p className="summary-card-value">{summaryStats.pendingPOD}</p>
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">Delivered Today</h3>
          <p className="summary-card-value">{summaryStats.deliveredToday}</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-search">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by Trip ID, Customer, Origin, Destination..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-filters">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Assigned">Assigned</option>
              <option value="Loading">Loading</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <table className="data-table">
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
                <td className="font-mono text-xs">{trip.trip_id}</td>
                <td>{trip.customer}</td>
                <td>{trip.origin} ➔ {trip.destination}</td>
                <td>
                  <div>{trip.driver}</div>
                  <div className="text-xs text-gray-500">{trip.vehicle_reg}</div>
                </td>
                <td><span className={`badge ${getStatusBadge(trip.status)}`}>{trip.status}</span></td>
                <td className="text-center">
                  {trip.pod_status === 'Received' ? 
                    <FaCheckCircle className="text-green-500" title="POD Received" /> : 
                    <FaClock className="text-orange-500" title="POD Pending" />
                  }
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <button className="btn-icon" title="View Details"><FaFileAlt /></button>
                    <button className="btn-icon" title="Track Vehicle"><FaMapMarkerAlt /></button>
                    <button className="btn-icon" title="Upload POD">📄</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TripManagement;
