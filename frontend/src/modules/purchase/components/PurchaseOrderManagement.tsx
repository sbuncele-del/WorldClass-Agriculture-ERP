import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './PurchaseOrderManagement.css';

interface Vendor {
  id: number;
  vendor_code: string;
  company_name: string;
  payment_terms: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_id: number;
  vendor_name: string;
  vendor_code: string;
  po_date: string;
  delivery_date: string;
  status: string;
  total_amount: number;
  payment_terms: string;
  lines?: POLine[];
}

interface POLine {
  id?: number;
  line_number: number;
  item_description: string;
  quantity: number;
  quantity_ordered?: number;
  quantity_received?: number;
  unit_of_measure: string;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  line_total: number;
  notes?: string;
}

interface Requisition {
  id: number;
  requisition_number: string;
  requested_by: string;
  department: string;
  request_date: string;
  required_date: string;
  priority: string;
  status: string;
  line_count: number;
  total_estimate: number;
}

const PurchaseOrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'requisitions'>('pos');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showCreateReqModal, setShowCreateReqModal] = useState(false);
  const [showPODetails, setShowPODetails] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Wizard state for PO creation
  const [wizardStep, setWizardStep] = useState(1);
  const [poFormData, setPOFormData] = useState<any>({
    vendor_id: '',
    po_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    payment_terms: '30 Days',
    shipping_method: '',
    notes: '',
    lines: []
  });

  // Requisition form
  const [reqFormData, setReqFormData] = useState<any>({
    requested_by: '',
    department: '',
    request_date: new Date().toISOString().split('T')[0],
    required_date: '',
    priority: 'Medium',
    notes: '',
    lines: []
  });

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders`);
      const data = await response.json();
      
      if (data.success) {
        setPurchaseOrders(data.data);
      } else {
        setError(data.message || 'Failed to fetch purchase orders');
      }
    } catch (err) {
      setError('Error fetching purchase orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch requisitions
  const fetchRequisitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/requisitions`);
      const data = await response.json();
      
      if (data.success) {
        setRequisitions(data.data);
      }
    } catch (err) {
      console.error('Error fetching requisitions:', err);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendors?status=active`);
      const data = await response.json();
      
      if (data.success) {
        setVendors(data.data);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchRequisitions();
    fetchVendors();
  }, []);

  // Add line item to PO
  const addPOLine = () => {
    setPOFormData((prev: any) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          line_number: prev.lines.length + 1,
          item_description: '',
          quantity: 1,
          unit_of_measure: 'Unit',
          unit_price: 0,
          discount_percent: 0,
          tax_rate: 15,
          line_total: 0
        }
      ]
    }));
  };

  // Remove line item
  const removePOLine = (index: number) => {
    setPOFormData((prev: any) => ({
      ...prev,
      lines: prev.lines.filter((_: any, i: number) => i !== index)
    }));
  };

  // Update line item
  const updatePOLine = (index: number, field: string, value: any) => {
    setPOFormData((prev: any) => {
      const updatedLines = [...prev.lines];
      updatedLines[index] = {
        ...updatedLines[index],
        [field]: value
      };

      // Recalculate line total
      const line = updatedLines[index];
      const subtotal = line.quantity * line.unit_price;
      const discount = subtotal * (line.discount_percent / 100);
      updatedLines[index].line_total = subtotal - discount;

      return { ...prev, lines: updatedLines };
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = poFormData.lines.reduce((sum: number, line: any) => sum + (line.line_total || 0), 0);
    const taxAmount = poFormData.lines.reduce((sum: number, line: any) => {
      const lineTax = (line.line_total || 0) * (line.tax_rate / 100);
      return sum + lineTax;
    }, 0);
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total };
  };

  // Create purchase order
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poFormData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchPurchaseOrders();
        setShowCreatePOModal(false);
        setWizardStep(1);
        resetPOForm();
      } else {
        setError(data.message || 'Failed to create purchase order');
      }
    } catch (err) {
      setError('Error creating purchase order');
      console.error(err);
    }
  };

  // Create requisition
  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/requisitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqFormData)
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequisitions();
        setShowCreateReqModal(false);
        resetReqForm();
      } else {
        setError(data.message || 'Failed to create requisition');
      }
    } catch (err) {
      setError('Error creating requisition');
      console.error(err);
    }
  };

  // Update PO status
  const handleUpdatePOStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        await fetchPurchaseOrders();
        if (selectedPO && selectedPO.id === id) {
          setSelectedPO({ ...selectedPO, status });
        }
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError('Error updating status');
      console.error(err);
    }
  };

  // Update requisition status
  const handleUpdateReqStatus = async (id: number, status: string, approved_by?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/requisitions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approved_by })
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequisitions();
      } else {
        setError(data.message || 'Failed to update requisition status');
      }
    } catch (err) {
      setError('Error updating requisition status');
      console.error(err);
    }
  };

  // View PO details
  const handleViewPO = async (po: PurchaseOrder) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/purchase-orders/${po.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPO(data.data);
        setShowPODetails(true);
      }
    } catch (err) {
      setError('Error fetching PO details');
      console.error(err);
    }
  };

  // Reset forms
  const resetPOForm = () => {
    setPOFormData({
      vendor_id: '',
      po_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      payment_terms: '30 Days',
      shipping_method: '',
      notes: '',
      lines: []
    });
  };

  const resetReqForm = () => {
    setReqFormData({
      requested_by: '',
      department: '',
      request_date: new Date().toISOString().split('T')[0],
      required_date: '',
      priority: 'Medium',
      notes: '',
      lines: []
    });
  };

  // Format currency
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: any = {
      'DRAFT': 'status-draft',
      'SENT': 'status-sent',
      'ACKNOWLEDGED': 'status-acknowledged',
      'IN_PROGRESS': 'status-progress',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'SUBMITTED': 'status-submitted',
      'APPROVED': 'status-approved',
      'REJECTED': 'status-rejected'
    };
    return colors[status] || 'status-draft';
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredReqs = requisitions.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch = req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requested_by.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div className="po-management-loading">Loading...</div>;
  }

  return (
    <div className="po-management">
      <div className="po-header">
        <h1>Purchase Order Management</h1>
        <div className="header-actions">
          <button className="btn-create" onClick={() => setShowCreateReqModal(true)}>
            + New Requisition
          </button>
          <button className="btn-create primary" onClick={() => setShowCreatePOModal(true)}>
            + New Purchase Order
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="po-tabs">
        <button
          className={`tab ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          className={`tab ${activeTab === 'requisitions' ? 'active' : ''}`}
          onClick={() => setActiveTab('requisitions')}
        >
          Requisitions ({requisitions.length})
        </button>
      </div>

      {/* Filters */}
      <div className="po-filters">
        <input
          type="text"
          className="search-input"
          placeholder={`Search ${activeTab === 'pos' ? 'purchase orders' : 'requisitions'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {activeTab === 'pos' ? (
            <>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </>
          ) : (
            <>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONVERTED">Converted to PO</option>
            </>
          )}
        </select>
      </div>

      {/* Content */}
      {activeTab === 'pos' ? (
        <div className="po-grid">
          {filteredPOs.length === 0 ? (
            <div className="empty-state">
              <p>No purchase orders found</p>
              <button className="btn-create" onClick={() => setShowCreatePOModal(true)}>
                Create First PO
              </button>
            </div>
          ) : (
            filteredPOs.map(po => (
              <div key={po.id} className="po-card">
                <div className="po-card-header">
                  <div>
                    <h3>{po.po_number}</h3>
                    <span className="vendor-name">{po.vendor_name}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(po.status)}`}>
                    {po.status}
                  </span>
                </div>

                <div className="po-card-body">
                  <div className="po-info-row">
                    <span className="label">PO Date:</span>
                    <span className="value">{new Date(po.po_date).toLocaleDateString()}</span>
                  </div>
                  <div className="po-info-row">
                    <span className="label">Delivery Date:</span>
                    <span className="value">{po.delivery_date ? new Date(po.delivery_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="po-info-row">
                    <span className="label">Payment Terms:</span>
                    <span className="value">{po.payment_terms}</span>
                  </div>
                  <div className="po-total">
                    <span className="label">Total Amount:</span>
                    <span className="amount">{formatCurrency(po.total_amount)}</span>
                  </div>
                </div>

                <div className="po-card-footer">
                  <button className="btn-view" onClick={() => handleViewPO(po)}>
                    View Details
                  </button>
                  {po.status === 'DRAFT' && (
                    <button
                      className="btn-action"
                      onClick={() => handleUpdatePOStatus(po.id, 'SENT')}
                    >
                      Send to Vendor
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="requisition-grid">
          {filteredReqs.length === 0 ? (
            <div className="empty-state">
              <p>No requisitions found</p>
              <button className="btn-create" onClick={() => setShowCreateReqModal(true)}>
                Create First Requisition
              </button>
            </div>
          ) : (
            filteredReqs.map(req => (
              <div key={req.id} className="requisition-card">
                <div className="req-card-header">
                  <div>
                    <h3>{req.requisition_number}</h3>
                    <span className="requested-by">By: {req.requested_by}</span>
                  </div>
                  <span className={`status-badge ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                <div className="req-card-body">
                  <div className="req-info-row">
                    <span className="label">Department:</span>
                    <span className="value">{req.department}</span>
                  </div>
                  <div className="req-info-row">
                    <span className="label">Request Date:</span>
                    <span className="value">{new Date(req.request_date).toLocaleDateString()}</span>
                  </div>
                  <div className="req-info-row">
                    <span className="label">Required Date:</span>
                    <span className="value">{req.required_date ? new Date(req.required_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="req-info-row">
                    <span className="label">Priority:</span>
                    <span className={`priority-badge priority-${req.priority.toLowerCase()}`}>
                      {req.priority}
                    </span>
                  </div>
                  <div className="req-info-row">
                    <span className="label">Line Items:</span>
                    <span className="value">{req.line_count}</span>
                  </div>
                  <div className="req-total">
                    <span className="label">Estimated Total:</span>
                    <span className="amount">{formatCurrency(req.total_estimate)}</span>
                  </div>
                </div>

                <div className="req-card-footer">
                  {req.status === 'SUBMITTED' && (
                    <>
                      <button
                        className="btn-approve"
                        onClick={() => handleUpdateReqStatus(req.id, 'APPROVED', 'System User')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleUpdateReqStatus(req.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {req.status === 'DRAFT' && (
                    <button
                      className="btn-action"
                      onClick={() => handleUpdateReqStatus(req.id, 'SUBMITTED')}
                    >
                      Submit for Approval
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create PO Modal - Wizard */}
      {showCreatePOModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePOModal(false)}>
          <div className="modal-content modal-wizard" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Purchase Order - Step {wizardStep} of 3</h2>
              <button className="modal-close" onClick={() => setShowCreatePOModal(false)}>✕</button>
            </div>

            <div className="wizard-progress">
              <div className={`wizard-step ${wizardStep >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Vendor Details</div>
              </div>
              <div className={`wizard-step ${wizardStep >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Line Items</div>
              </div>
              <div className={`wizard-step ${wizardStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Review</div>
              </div>
            </div>

            <form onSubmit={handleCreatePO}>
              {wizardStep === 1 && (
                <div className="wizard-content">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Vendor *</label>
                      <select
                        value={poFormData.vendor_id}
                        onChange={(e) => setPOFormData({ ...poFormData, vendor_id: e.target.value })}
                        required
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.company_name} ({vendor.vendor_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>PO Date *</label>
                      <input
                        type="date"
                        value={poFormData.po_date}
                        onChange={(e) => setPOFormData({ ...poFormData, po_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Delivery Date</label>
                      <input
                        type="date"
                        value={poFormData.delivery_date}
                        onChange={(e) => setPOFormData({ ...poFormData, delivery_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Payment Terms</label>
                      <select
                        value={poFormData.payment_terms}
                        onChange={(e) => setPOFormData({ ...poFormData, payment_terms: e.target.value })}
                      >
                        <option value="COD">COD</option>
                        <option value="7 Days">7 Days</option>
                        <option value="30 Days">30 Days</option>
                        <option value="60 Days">60 Days</option>
                        <option value="90 Days">90 Days</option>
                      </select>
                    </div>

                    <div className="form-group full-width">
                      <label>Shipping Method</label>
                      <input
                        type="text"
                        value={poFormData.shipping_method}
                        onChange={(e) => setPOFormData({ ...poFormData, shipping_method: e.target.value })}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Notes</label>
                      <textarea
                        value={poFormData.notes}
                        onChange={(e) => setPOFormData({ ...poFormData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="wizard-footer">
                    <button type="button" className="btn-cancel" onClick={() => setShowCreatePOModal(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-next"
                      onClick={() => setWizardStep(2)}
                      disabled={!poFormData.vendor_id}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="wizard-content">
                  <div className="line-items-section">
                    <div className="section-header">
                      <h3>Line Items</h3>
                      <button type="button" className="btn-add-line" onClick={addPOLine}>
                        + Add Item
                      </button>
                    </div>

                    {poFormData.lines.length === 0 ? (
                      <div className="empty-lines">
                        <p>No line items yet. Click "Add Item" to start.</p>
                      </div>
                    ) : (
                      <div className="line-items-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Qty</th>
                              <th>UOM</th>
                              <th>Unit Price</th>
                              <th>Discount %</th>
                              <th>Tax %</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {poFormData.lines.map((line: any, index: number) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    value={line.item_description}
                                    onChange={(e) => updatePOLine(index, 'item_description', e.target.value)}
                                    placeholder="Item description"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={line.quantity}
                                    onChange={(e) => updatePOLine(index, 'quantity', parseFloat(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={line.unit_of_measure}
                                    onChange={(e) => updatePOLine(index, 'unit_of_measure', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={line.unit_price}
                                    onChange={(e) => updatePOLine(index, 'unit_price', parseFloat(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={line.discount_percent}
                                    onChange={(e) => updatePOLine(index, 'discount_percent', parseFloat(e.target.value))}
                                    min="0"
                                    max="100"
                                    step="0.01"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={line.tax_rate}
                                    onChange={(e) => updatePOLine(index, 'tax_rate', parseFloat(e.target.value))}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="line-total">
                                  {formatCurrency(line.line_total)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-remove-line"
                                    onClick={() => removePOLine(index)}
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="wizard-footer">
                    <button type="button" className="btn-back" onClick={() => setWizardStep(1)}>
                      ← Back
                    </button>
                    <button
                      type="button"
                      className="btn-next"
                      onClick={() => setWizardStep(3)}
                      disabled={poFormData.lines.length === 0}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="wizard-content">
                  <div className="po-review">
                    <div className="review-section">
                      <h3>Vendor Details</h3>
                      <div className="review-grid">
                        <div>
                          <span className="review-label">Vendor:</span>
                          <span className="review-value">
                            {vendors.find(v => v.id === parseInt(poFormData.vendor_id))?.company_name}
                          </span>
                        </div>
                        <div>
                          <span className="review-label">PO Date:</span>
                          <span className="review-value">{new Date(poFormData.po_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="review-label">Delivery Date:</span>
                          <span className="review-value">
                            {poFormData.delivery_date ? new Date(poFormData.delivery_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="review-label">Payment Terms:</span>
                          <span className="review-value">{poFormData.payment_terms}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h3>Line Items ({poFormData.lines.length})</h3>
                      <table className="review-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poFormData.lines.map((line: any, index: number) => (
                            <tr key={index}>
                              <td>{line.item_description}</td>
                              <td>{line.quantity} {line.unit_of_measure}</td>
                              <td>{formatCurrency(line.unit_price)}</td>
                              <td>{formatCurrency(line.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="review-totals">
                      <div className="total-row">
                        <span className="total-label">Subtotal:</span>
                        <span className="total-value">{formatCurrency(calculateTotals().subtotal)}</span>
                      </div>
                      <div className="total-row">
                        <span className="total-label">Tax:</span>
                        <span className="total-value">{formatCurrency(calculateTotals().taxAmount)}</span>
                      </div>
                      <div className="total-row grand-total">
                        <span className="total-label">Grand Total:</span>
                        <span className="total-value">{formatCurrency(calculateTotals().total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="wizard-footer">
                    <button type="button" className="btn-back" onClick={() => setWizardStep(2)}>
                      ← Back
                    </button>
                    <button type="submit" className="btn-submit">
                      Create Purchase Order
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* PO Details Modal */}
      {showPODetails && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowPODetails(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedPO.po_number}</h2>
                <span className="vendor-name">{selectedPO.vendor_name}</span>
              </div>
              <button className="modal-close" onClick={() => setShowPODetails(false)}>✕</button>
            </div>

            <div className="po-details-content">
              <div className="details-header">
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${getStatusColor(selectedPO.status)}`}>
                    {selectedPO.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">PO Date:</span>
                  <span className="value">{new Date(selectedPO.po_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Delivery Date:</span>
                  <span className="value">
                    {selectedPO.delivery_date ? new Date(selectedPO.delivery_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Payment Terms:</span>
                  <span className="value">{selectedPO.payment_terms}</span>
                </div>
              </div>

              <div className="details-section">
                <h3>Line Items</h3>
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.lines?.map((line: any, index: number) => (
                      <tr key={index}>
                        <td>{line.item_description}</td>
                        <td>{line.quantity_ordered} {line.unit_of_measure}</td>
                        <td>{line.quantity_received || 0} {line.unit_of_measure}</td>
                        <td>{formatCurrency(line.unit_price)}</td>
                        <td>{formatCurrency(line.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="details-totals">
                <div className="total-row">
                  <span>Total Amount:</span>
                  <span className="amount">{formatCurrency(selectedPO.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {selectedPO.status === 'DRAFT' && (
                <button
                  className="btn-action"
                  onClick={() => {
                    handleUpdatePOStatus(selectedPO.id, 'SENT');
                    setShowPODetails(false);
                  }}
                >
                  Send to Vendor
                </button>
              )}
              {selectedPO.status === 'SENT' && (
                <button
                  className="btn-action"
                  onClick={() => {
                    handleUpdatePOStatus(selectedPO.id, 'ACKNOWLEDGED');
                    setShowPODetails(false);
                  }}
                >
                  Mark as Acknowledged
                </button>
              )}
              <button className="btn-cancel" onClick={() => setShowPODetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagement;
