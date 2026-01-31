import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './VendorManagement.css';

interface Vendor {
  id: number;
  vendor_code: string;
  company_name: string;
  tax_number?: string;
  registration_number?: string;
  vendor_group?: string;
  payment_terms: string;
  credit_limit: number;
  currency: string;
  bank_name?: string;
  bank_account?: string;
  bank_branch?: string;
  billing_address?: any;
  shipping_address?: any;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  rating?: number;
  is_active: boolean;
  notes?: string;
  total_pos?: number;
  total_spend?: number;
  total_invoices?: number;
  overdue_amount?: number;
  contacts?: Contact[];
}

interface Contact {
  id?: number;
  vendor_id?: number;
  contact_name: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<Partial<Vendor>>({
    company_name: '',
    tax_number: '',
    registration_number: '',
    vendor_group: 'Suppliers',
    payment_terms: '30 Days',
    credit_limit: 0,
    currency: 'ZAR',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    rating: 3,
    notes: '',
    billing_address: {},
    shipping_address: {},
    contacts: []
  });

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors`);
      const data = await response.json();
      
      if (data.success) {
        setVendors(data.data);
        setFilteredVendors(data.data);
      } else {
        setError(data.message || 'Failed to fetch vendors');
      }
    } catch (err) {
      setError('Error fetching vendors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...vendors];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendor_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(v => v.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(v => !v.is_active);
    }

    // Group filter
    if (groupFilter !== 'all') {
      filtered = filtered.filter(v => v.vendor_group === groupFilter);
    }

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(v => (v.rating || 0) >= ratingFilter);
    }

    setFilteredVendors(filtered);
  }, [searchTerm, statusFilter, groupFilter, ratingFilter, vendors]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credit_limit' || name === 'rating' ? parseFloat(value) || 0 : value
    }));
  };

  // Create vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchVendors();
        setShowCreateModal(false);
        resetForm();
      } else {
        setError(data.message || 'Failed to create vendor');
      }
    } catch (err) {
      setError('Error creating vendor');
      console.error(err);
    }
  };

  // Update vendor
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendor) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors/${selectedVendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchVendors();
        setShowDetailsModal(false);
        setEditMode(false);
        setSelectedVendor(null);
        resetForm();
      } else {
        setError(data.message || 'Failed to update vendor');
      }
    } catch (err) {
      setError('Error updating vendor');
      console.error(err);
    }
  };

  // Delete vendor
  const handleDeleteVendor = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this vendor?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchVendors();
      } else {
        setError(data.message || 'Failed to delete vendor');
      }
    } catch (err) {
      setError('Error deleting vendor');
      console.error(err);
    }
  };

  // View vendor details
  const handleViewVendor = async (vendor: Vendor) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors/${vendor.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedVendor(data.data);
        setFormData(data.data);
        setShowDetailsModal(true);
      } else {
        setError(data.message || 'Failed to fetch vendor details');
      }
    } catch (err) {
      setError('Error fetching vendor details');
      console.error(err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      company_name: '',
      tax_number: '',
      registration_number: '',
      vendor_group: 'Suppliers',
      payment_terms: '30 Days',
      credit_limit: 0,
      currency: 'ZAR',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      rating: 3,
      notes: '',
      billing_address: {},
      shipping_address: {},
      contacts: []
    });
  };

  // Render star rating
  const renderStars = (rating: number = 0) => {
    return (
      <div className="vendor-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>★</span>
        ))}
      </div>
    );
  };

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (loading) {
    return <div className="vendor-management-loading">Loading vendors...</div>;
  }

  return (
    <div className="vendor-management">
      <div className="vendor-header">
        <h1>Vendor Management</h1>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          + Add Vendor
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="vendor-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="filter-select"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
        >
          <option value="all">All Groups</option>
          <option value="Suppliers">Suppliers</option>
          <option value="Contractors">Contractors</option>
          <option value="Service Providers">Service Providers</option>
        </select>

        <select
          className="filter-select"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(parseInt(e.target.value))}
        >
          <option value="0">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>

      {/* Vendor Grid */}
      <div className="vendor-grid">
        {filteredVendors.length === 0 ? (
          <div className="empty-state">
            <p>No vendors found</p>
            <button className="btn-create" onClick={() => setShowCreateModal(true)}>
              Add First Vendor
            </button>
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-card-header">
                <div className="vendor-title">
                  <h3>{vendor.company_name}</h3>
                  <span className="vendor-code">{vendor.vendor_code}</span>
                </div>
                {renderStars(vendor.rating)}
              </div>

              <div className="vendor-card-body">
                <div className="vendor-info-row">
                  <span className="label">Group:</span>
                  <span className="value">{vendor.vendor_group || 'N/A'}</span>
                </div>

                <div className="vendor-info-row">
                  <span className="label">Payment Terms:</span>
                  <span className="value">{vendor.payment_terms}</span>
                </div>

                <div className="vendor-info-row">
                  <span className="label">Contact:</span>
                  <span className="value">{vendor.contact_person || 'N/A'}</span>
                </div>

                <div className="vendor-info-row">
                  <span className="label">Email:</span>
                  <span className="value">{vendor.contact_email || 'N/A'}</span>
                </div>

                <div className="vendor-stats">
                  <div className="stat">
                    <span className="stat-label">Total POs</span>
                    <span className="stat-value">{vendor.total_pos || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Spend</span>
                    <span className="stat-value">{formatCurrency(vendor.total_spend)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Overdue</span>
                    <span className="stat-value overdue">{formatCurrency(vendor.overdue_amount)}</span>
                  </div>
                </div>

                <div className="vendor-status">
                  <span className={`status-badge ${vendor.is_active ? 'active' : 'inactive'}`}>
                    {vendor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="vendor-card-footer">
                <button className="btn-view" onClick={() => handleViewVendor(vendor)}>
                  View Details
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDeleteVendor(vendor.id)}
                  disabled={!vendor.is_active}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Vendor</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateVendor} className="vendor-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tax Number</label>
                  <input
                    type="text"
                    name="tax_number"
                    value={formData.tax_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Vendor Group</label>
                  <select
                    name="vendor_group"
                    value={formData.vendor_group}
                    onChange={handleInputChange}
                  >
                    <option value="Suppliers">Suppliers</option>
                    <option value="Contractors">Contractors</option>
                    <option value="Service Providers">Service Providers</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Terms</label>
                  <select
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                  >
                    <option value="COD">COD</option>
                    <option value="7 Days">7 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Credit Limit</label>
                  <input
                    type="number"
                    name="credit_limit"
                    value={formData.credit_limit}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Rating (1-5)</label>
                  <select
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                  >
                    <option value="1">1 Star</option>
                    <option value="2">2 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {showDetailsModal && selectedVendor && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedVendor.company_name}</h2>
                <span className="vendor-code">{selectedVendor.vendor_code}</span>
              </div>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>

            {!editMode ? (
              <div className="vendor-details">
                <div className="details-section">
                  <h3>Vendor Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Company Name:</span>
                      <span className="detail-value">{selectedVendor.company_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tax Number:</span>
                      <span className="detail-value">{selectedVendor.tax_number || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Registration:</span>
                      <span className="detail-value">{selectedVendor.registration_number || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Group:</span>
                      <span className="detail-value">{selectedVendor.vendor_group || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Terms:</span>
                      <span className="detail-value">{selectedVendor.payment_terms}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Rating:</span>
                      <span className="detail-value">{renderStars(selectedVendor.rating)}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Contact Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Contact Person:</span>
                      <span className="detail-value">{selectedVendor.contact_person || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedVendor.contact_email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedVendor.contact_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h3>Financial Summary</h3>
                  <div className="financial-summary">
                    <div className="summary-card">
                      <span className="summary-label">Total Purchase Orders</span>
                      <span className="summary-value">{selectedVendor.total_pos || 0}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Total Spend</span>
                      <span className="summary-value">{formatCurrency(selectedVendor.total_spend)}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Total Invoices</span>
                      <span className="summary-value">{selectedVendor.total_invoices || 0}</span>
                    </div>
                    <div className="summary-card warning">
                      <span className="summary-label">Overdue Amount</span>
                      <span className="summary-value">{formatCurrency(selectedVendor.overdue_amount)}</span>
                    </div>
                  </div>
                </div>

                {selectedVendor.notes && (
                  <div className="details-section">
                    <h3>Notes</h3>
                    <p className="notes-content">{selectedVendor.notes}</p>
                  </div>
                )}

                <div className="modal-footer">
                  <button className="btn-edit" onClick={() => setEditMode(true)}>
                    Edit Vendor
                  </button>
                  <button className="btn-cancel" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateVendor} className="vendor-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tax Number</label>
                    <input
                      type="text"
                      name="tax_number"
                      value={formData.tax_number}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Vendor Group</label>
                    <select
                      name="vendor_group"
                      value={formData.vendor_group}
                      onChange={handleInputChange}
                    >
                      <option value="Suppliers">Suppliers</option>
                      <option value="Contractors">Contractors</option>
                      <option value="Service Providers">Service Providers</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Terms</label>
                    <select
                      name="payment_terms"
                      value={formData.payment_terms}
                      onChange={handleInputChange}
                    >
                      <option value="COD">COD</option>
                      <option value="7 Days">7 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="90 Days">90 Days</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Rating (1-5)</label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                    >
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Update Vendor
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
