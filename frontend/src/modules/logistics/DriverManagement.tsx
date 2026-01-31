import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaPlus, FaFilePdf, FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa';
import apiClient from '../../services/api';
import '../../App.css';

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

const getDaysUntilExpiry = (date: string) => {
  const today = new Date();
  const expiryDate = new Date(date);
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryColor = (days: number) => {
  if (days < 0) return 'text-red-600 font-bold';
  if (days <= 30) return 'text-orange-500 font-bold';
  return 'text-gray-500';
};

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/logistics/drivers');
      const data = response.data?.data || response.data || [];
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            driver.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            driver.id_number.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || driver.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, statusFilter]);

  const summaryStats = useMemo(() => ({
    total: drivers.length,
    active: drivers.filter(d => d.status === 'Active').length,
    onTrip: drivers.filter(d => d.status === 'On Trip').length,
    onLeave: drivers.filter(d => d.status === 'On Leave').length,
    expiringSoon: drivers.filter(d => getDaysUntilExpiry(d.prdp_expiry) <= 30 || getDaysUntilExpiry(d.medical_expiry) <= 30).length,
  }), [drivers]);

  const renderStatusIcon = (status: Driver['status']) => {
    switch (status) {
      case 'Active': return <FaUserCheck className="text-green-500" title="Active" />;
      case 'On Trip': return <FaUserClock className="text-blue-500" title="On Trip" />;
      case 'On Leave': return <FaUserClock className="text-yellow-500" title="On Leave" />;
      case 'Inactive': return <FaUserTimes className="text-red-500" title="Inactive" />;
      default: return null;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Driver Management</h1>
        <div className="page-actions">
          <Link to="/hr/employees/new" className="btn btn-primary">
            <FaPlus className="mr-2" /> Add New Driver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="summary-card">
          <h3 className="summary-card-title">Total Drivers</h3>
          <p className="summary-card-value">{summaryStats.total}</p>
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">Available & Active</h3>
          <p className="summary-card-value">{summaryStats.active}</p>
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">On Trip</h3>
          <p className="summary-card-value">{summaryStats.onTrip}</p>
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">On Leave</h3>
          <p className="summary-card-value">{summaryStats.onLeave}</p>
        </div>
        <div className="summary-card-alert">
          <h3 className="summary-card-title">Docs Expiring Soon</h3>
          <p className="summary-card-value">{summaryStats.expiringSoon}</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-search">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, or ID number..."
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
              <option value="Active">Active</option>
              <option value="On Trip">On Trip</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <table className="data-table">
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
                  <td className="text-center">{renderStatusIcon(driver.status)}</td>
                  <td>
                    <Link to={`/hr/employees/${driver.employee_id}`} className="font-semibold text-blue-600 hover:underline">
                      {driver.name}
                    </Link>
                    <div className="text-xs text-gray-500">{driver.id_number}</div>
                  </td>
                  <td>{driver.employee_id}</td>
                  <td>
                    <span className="badge badge-blue">{driver.license_type}</span>
                  </td>
                  <td className={getExpiryColor(prdpDays)}>
                    {new Date(driver.prdp_expiry).toLocaleDateString()}
                    {prdpDays < 0 ? ` (Expired)`: ` (${prdpDays} days)`}
                  </td>
                  <td className={getExpiryColor(medicalDays)}>
                    {new Date(driver.medical_expiry).toLocaleDateString()}
                    {medicalDays < 0 ? ` (Expired)`: ` (${medicalDays} days)`}
                  </td>
                  <td>
                    <div className="text-sm">On-Time: {driver.on_time_rate}%</div>
                    <div className="text-xs text-gray-500">Incidents: {driver.incidents}</div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="btn-icon" title="View Documents"><FaFilePdf /></button>
                      <button className="btn-icon" title="Edit Driver">✏️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverManagement;
