import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './LocationsManager.css';

interface Location {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_location_id: string | null;
  level: number;
  location_type: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LocationFormData {
  code: string;
  name: string;
  description: string;
  parent_location_id: string;
  location_type: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

const LocationsManager: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<LocationFormData>({
    code: '',
    name: '',
    description: '',
    parent_location_id: '',
    location_type: 'OFFICE',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/api/financial/dimensions/locations${showInactive ? '?include_inactive=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setLocations(result.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      parent_location_id: '',
      location_type: 'OFFICE',
      address: '',
      city: '',
      province: '',
      postal_code: '',
      country: 'South Africa',
    });
    setShowModal(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      code: location.code,
      name: location.name,
      description: location.description || '',
      parent_location_id: location.parent_location_id || '',
      location_type: location.location_type || 'OFFICE',
      address: location.address || '',
      city: location.city || '',
      province: location.province || '',
      postal_code: location.postal_code || '',
      country: location.country || 'South Africa',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      parent_location_id: formData.parent_location_id || null,
      location_type: formData.location_type || null,
      address: formData.address || null,
      city: formData.city || null,
      province: formData.province || null,
      postal_code: formData.postal_code || null,
      country: formData.country || null,
    };

    try {
      const url = editingLocation
        ? `${API_BASE_URL}/api/financial/dimensions/locations/${editingLocation.id}`
        : `${API_BASE_URL}/api/financial/dimensions/locations`;
      
      const response = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowModal(false);
        fetchLocations();
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error saving location: ' + error);
    }
  };

  const handleToggleActive = async (location: Location) => {
    try {
      const url = `${API_BASE_URL}/api/financial/dimensions/locations/${location.id}/${
        location.is_active ? 'deactivate' : 'activate'
      }`;
      
      const response = await fetch(url, { method: 'PUT' });
      const result = await response.json();
      
      if (result.success) {
        fetchLocations();
      }
    } catch (error) {
      alert('Error toggling location status: ' + error);
    }
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (loc.city && loc.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (loc.province && loc.province.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const buildHierarchy = (items: Location[], parentId: string | null = null, level = 0): React.ReactElement[] => {
    return items
      .filter(item => item.parent_location_id === parentId)
      .map(item => (
        <React.Fragment key={item.id}>
          <tr className={!item.is_active ? 'inactive-row' : ''}>
            <td style={{ paddingLeft: `${level * 20 + 10}px` }}>
              {level > 0 && <span className="hierarchy-indicator">└─ </span>}
              {item.code}
            </td>
            <td>{item.name}</td>
            <td>{item.location_type || '-'}</td>
            <td>{item.city || '-'}</td>
            <td>{item.province || '-'}</td>
            <td>{item.country || '-'}</td>
            <td>
              <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <div className="action-buttons">
                <button className="btn-edit" onClick={() => handleEdit(item)}>
                  ✏️ Edit
                </button>
                <button
                  className={item.is_active ? 'btn-deactivate' : 'btn-activate'}
                  onClick={() => handleToggleActive(item)}
                >
                  {item.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                </button>
              </div>
            </td>
          </tr>
          {buildHierarchy(items, item.id, level + 1)}
        </React.Fragment>
      ));
  };

  if (loading) {
    return <div className="loading">Loading locations...</div>;
  }

  return (
    <div className="locations-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>📍 Locations</h2>
          <p className="subtitle">Physical locations and geographical structure</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          ➕ New Location
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          <span>Show inactive locations</span>
        </label>
      </div>

      <div className="table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Location Name</th>
              <th>Type</th>
              <th>City</th>
              <th>Province</th>
              <th>Country</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  {searchTerm ? 'No locations match your search' : 'No locations found'}
                </td>
              </tr>
            ) : (
              buildHierarchy(filteredLocations)
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLocation ? 'Edit Location' : 'Create New Location'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., LOC-JHB-01"
                  />
                </div>

                <div className="form-group">
                  <label>Location Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Johannesburg HQ"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Location description..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Parent Location</label>
                  <select
                    value={formData.parent_location_id}
                    onChange={(e) => setFormData({ ...formData, parent_location_id: e.target.value })}
                  >
                    <option value="">None (Top Level)</option>
                    {locations
                      .filter(l => l.is_active && l.id !== editingLocation?.id)
                      .map(l => (
                        <option key={l.id} value={l.id}>
                          {l.code} - {l.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Location Type</label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  >
                    <option value="OFFICE">Office</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="FACTORY">Factory</option>
                    <option value="STORE">Store</option>
                    <option value="BRANCH">Branch</option>
                    <option value="REGION">Region</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Main Street, Sandton"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Johannesburg"
                  />
                </div>

                <div className="form-group">
                  <label>Province</label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  >
                    <option value="">Select Province</option>
                    <option value="Gauteng">Gauteng</option>
                    <option value="Western Cape">Western Cape</option>
                    <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                    <option value="Eastern Cape">Eastern Cape</option>
                    <option value="Free State">Free State</option>
                    <option value="Limpopo">Limpopo</option>
                    <option value="Mpumalanga">Mpumalanga</option>
                    <option value="Northern Cape">Northern Cape</option>
                    <option value="North West">North West</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="e.g., 2196"
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., South Africa"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingLocation ? 'Update' : 'Create'} Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsManager;
