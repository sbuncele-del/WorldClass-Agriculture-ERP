import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './CustomerManagement.css';

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  customer_type: string;
  email: string;
  phone: string;
  mobile: string;
  vat_number: string;
  credit_limit: number;
  payment_terms: number;
  customer_group: string;
  sales_person: string;
  territory: string;
  status: string;
  is_vip: boolean;
  credit_hold: boolean;
  total_sales?: number;
  total_outstanding?: number;
  total_order_count?: number;
  last_order_date?: string;
}

interface Contact {
  id?: number;
  contact_name: string;
  position: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
  notes?: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    customer_type: 'INDIVIDUAL',
    status: 'ACTIVE',
    tax_exempt: false,
    tax_rate: 15,
    credit_limit: 0,
    payment_terms: 30,
    currency_code: 'ZAR',
    is_vip: false,
    credit_hold: false
  });
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact>({
    contact_name: '',
    position: '',
    email: '',
    phone: '',
    mobile: '',
    is_primary: false
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, filterStatus, filterGroup]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterGroup) params.append('customer_group', filterGroup);
      
      const response = await fetch(`${API_BASE_URL}/api/sales/customers?${params}`);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/customers/${id}`);
      const data = await response.json();
      setSelectedCustomer(data.customer);
      setContacts(data.contacts || []);
      setIsViewMode(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleCreateNew = () => {
    setFormData({
      customer_type: 'INDIVIDUAL',
      status: 'ACTIVE',
      tax_exempt: false,
      tax_rate: 15,
      credit_limit: 0,
      payment_terms: 30,
      currency_code: 'ZAR',
      is_vip: false,
      credit_hold: false
    });
    setContacts([]);
    setSelectedCustomer(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setSelectedCustomer(customer);
    fetchCustomerDetails(customer.id);
    setIsViewMode(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const url = selectedCustomer
        ? `${API_BASE_URL}/api/sales/customers/${selectedCustomer.id}`
        : `${API_BASE_URL}/api/sales/customers`;
      
      const method = selectedCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, contacts })
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchCustomers();
        alert(selectedCustomer ? 'Customer updated successfully!' : 'Customer created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/customers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCustomers();
        alert('Customer deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const handleAddContact = () => {
    if (!currentContact.contact_name || !currentContact.email) {
      alert('Contact name and email are required');
      return;
    }
    
    setContacts([...contacts, { ...currentContact }]);
    setCurrentContact({
      contact_name: '',
      position: '',
      email: '',
      phone: '',
      mobile: '',
      is_primary: false
    });
    setShowContactForm(false);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="customer-management">
      <div className="customer-header">
        <h1>Customer Management</h1>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + New Customer
        </button>
      </div>

      <div className="customer-filters">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="filter-select"
        >
          <option value="">All Groups</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="CORPORATE">Corporate</option>
          <option value="GOVERNMENT">Government</option>
        </select>
      </div>

      {loading && <div className="loading">Loading customers...</div>}

      <div className="customer-grid">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Group</th>
              <th>Credit Limit</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className={customer.credit_hold ? 'credit-hold' : ''}>
                <td>
                  {customer.customer_code}
                  {customer.is_vip && <span className="vip-badge">VIP</span>}
                </td>
                <td>
                  <div className="customer-name" onClick={() => fetchCustomerDetails(customer.id)}>
                    {customer.customer_name}
                  </div>
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{customer.customer_group}</td>
                <td className="text-right">R {customer.credit_limit?.toLocaleString()}</td>
                <td className="text-right">
                  R {customer.total_outstanding?.toLocaleString() || '0'}
                </td>
                <td>
                  <span className={`status-badge status-${customer.status?.toLowerCase()}`}>
                    {customer.status}
                  </span>
                  {customer.credit_hold && <span className="hold-badge">HOLD</span>}
                </td>
                <td>
                  <button
                    className="btn-icon"
                    onClick={() => handleEdit(customer)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(customer.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isViewMode ? 'Customer Details' : (selectedCustomer ? 'Edit Customer' : 'New Customer')}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              {isViewMode ? (
                <div className="customer-details">
                  <div className="details-section">
                    <h3>Basic Information</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Customer Code:</label>
                        <span>{selectedCustomer?.customer_code}</span>
                      </div>
                      <div className="detail-item">
                        <label>Customer Name:</label>
                        <span>{selectedCustomer?.customer_name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Type:</label>
                        <span>{selectedCustomer?.customer_type}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{selectedCustomer?.email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Phone:</label>
                        <span>{selectedCustomer?.phone}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>{selectedCustomer?.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Financial Information</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Credit Limit:</label>
                        <span>R {selectedCustomer?.credit_limit?.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <label>Payment Terms:</label>
                        <span>{selectedCustomer?.payment_terms} days</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Sales:</label>
                        <span>R {selectedCustomer?.total_sales?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Outstanding:</label>
                        <span>R {selectedCustomer?.total_outstanding?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3>Contacts ({contacts.length})</h3>
                    {contacts.map((contact, index) => (
                      <div key={index} className="contact-card">
                        <div className="contact-header">
                          <strong>{contact.contact_name}</strong>
                          {contact.is_primary && <span className="primary-badge">Primary</span>}
                        </div>
                        <div className="contact-details">
                          <p>{contact.position}</p>
                          <p>📧 {contact.email}</p>
                          <p>📞 {contact.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setIsViewMode(false)}>
                      Edit Customer
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form className="customer-form">
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Customer Code *</label>
                        <input
                          type="text"
                          value={formData.customer_code || ''}
                          onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Customer Name *</label>
                        <input
                          type="text"
                          value={formData.customer_name || ''}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Type</label>
                        <select
                          value={formData.customer_type || 'INDIVIDUAL'}
                          onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                        >
                          <option value="INDIVIDUAL">Individual</option>
                          <option value="COMPANY">Company</option>
                          <option value="GOVERNMENT">Government</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Mobile</label>
                        <input
                          type="tel"
                          value={formData.mobile || ''}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Address</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Billing Address Line 1</label>
                        <input
                          type="text"
                          value={formData.billing_address_line1 || ''}
                          onChange={(e) => setFormData({ ...formData, billing_address_line1: e.target.value })}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Billing Address Line 2</label>
                        <input
                          type="text"
                          value={formData.billing_address_line2 || ''}
                          onChange={(e) => setFormData({ ...formData, billing_address_line2: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          value={formData.billing_city || ''}
                          onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Postal Code</label>
                        <input
                          type="text"
                          value={formData.billing_postal_code || ''}
                          onChange={(e) => setFormData({ ...formData, billing_postal_code: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Financial Settings</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>VAT Number</label>
                        <input
                          type="text"
                          value={formData.vat_number || ''}
                          onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Credit Limit</label>
                        <input
                          type="number"
                          value={formData.credit_limit || 0}
                          onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Payment Terms (days)</label>
                        <input
                          type="number"
                          value={formData.payment_terms || 30}
                          onChange={(e) => setFormData({ ...formData, payment_terms: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Customer Group</label>
                        <select
                          value={formData.customer_group || ''}
                          onChange={(e) => setFormData({ ...formData, customer_group: e.target.value })}
                        >
                          <option value="">Select Group</option>
                          <option value="RETAIL">Retail</option>
                          <option value="WHOLESALE">Wholesale</option>
                          <option value="CORPORATE">Corporate</option>
                          <option value="GOVERNMENT">Government</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Sales Person</label>
                        <input
                          type="text"
                          value={formData.sales_person || ''}
                          onChange={(e) => setFormData({ ...formData, sales_person: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          value={formData.status || 'ACTIVE'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="SUSPENDED">Suspended</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-checkboxes">
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.is_vip || false}
                          onChange={(e) => setFormData({ ...formData, is_vip: e.target.checked })}
                        />
                        VIP Customer
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={formData.credit_hold || false}
                          onChange={(e) => setFormData({ ...formData, credit_hold: e.target.checked })}
                        />
                        Credit Hold
                      </label>
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="section-header">
                      <h3>Contacts ({contacts.length})</h3>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setShowContactForm(true)}
                      >
                        + Add Contact
                      </button>
                    </div>

                    {showContactForm && (
                      <div className="contact-form">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Contact Name *</label>
                            <input
                              type="text"
                              value={currentContact.contact_name}
                              onChange={(e) => setCurrentContact({ ...currentContact, contact_name: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Position</label>
                            <input
                              type="text"
                              value={currentContact.position}
                              onChange={(e) => setCurrentContact({ ...currentContact, position: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              value={currentContact.email}
                              onChange={(e) => setCurrentContact({ ...currentContact, email: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Phone</label>
                            <input
                              type="tel"
                              value={currentContact.phone}
                              onChange={(e) => setCurrentContact({ ...currentContact, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-checkboxes">
                          <label>
                            <input
                              type="checkbox"
                              checked={currentContact.is_primary}
                              onChange={(e) => setCurrentContact({ ...currentContact, is_primary: e.target.checked })}
                            />
                            Primary Contact
                          </label>
                        </div>
                        <div className="contact-actions">
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleAddContact}>
                            Add Contact
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowContactForm(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="contacts-list">
                      {contacts.map((contact, index) => (
                        <div key={index} className="contact-item">
                          <div>
                            <strong>{contact.contact_name}</strong>
                            {contact.is_primary && <span className="primary-badge">Primary</span>}
                            <p>{contact.position} • {contact.email}</p>
                          </div>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleRemoveContact(index)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (selectedCustomer ? 'Update Customer' : 'Create Customer')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
