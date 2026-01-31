import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './QuotationManagement.css';

interface Quotation {
  id: number;
  quotation_number: string;
  customer_id: number;
  customer_name?: string;
  quotation_date: string;
  valid_until: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  approval_status: string;
  converted_to_order: boolean;
  sales_person: string;
  probability: number;
}

interface QuotationLine {
  id?: number;
  line_number: number;
  item_code: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  discount_percentage: number;
  tax_rate: number;
  line_total: number;
}

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
}

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState<Partial<Quotation>>({
    quotation_date: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    approval_status: 'PENDING',
    probability: 50
  });

  const [lines, setLines] = useState<QuotationLine[]>([]);
  const [currentLine, setCurrentLine] = useState<QuotationLine>({
    line_number: 1,
    item_code: '',
    description: '',
    quantity: 1,
    unit_of_measure: 'EA',
    unit_price: 0,
    discount_percentage: 0,
    tax_rate: 15,
    line_total: 0
  });

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, [searchTerm, filterStatus]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`${API_BASE_URL}/api/sales/quotations?${params}`);
      const data = await response.json();
      setQuotations(data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/customers?limit=100`);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchQuotationDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/quotations/${id}`);
      const data = await response.json();
      setSelectedQuotation(data.quotation);
      setLines(data.lines || []);
      setFormData(data.quotation);
      setIsViewMode(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching quotation details:', error);
    }
  };

  const handleCreateNew = () => {
    const today = new Date().toISOString().split('T')[0];
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    setFormData({
      quotation_date: today,
      valid_until: validUntil.toISOString().split('T')[0],
      status: 'DRAFT',
      approval_status: 'PENDING',
      probability: 50,
      payment_terms: 30
    });
    setLines([]);
    setSelectedQuotation(null);
    setIsViewMode(false);
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const calculateLineTotal = (line: QuotationLine) => {
    const subtotal = line.quantity * line.unit_price;
    const discountAmount = subtotal * (line.discount_percentage / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (line.tax_rate / 100);
    return taxableAmount + taxAmount;
  };

  const handleAddLine = () => {
    if (!currentLine.description || currentLine.quantity <= 0 || currentLine.unit_price <= 0) {
      alert('Please fill in all line item details');
      return;
    }

    const lineTotal = calculateLineTotal(currentLine);
    const newLine = { ...currentLine, line_total: lineTotal, line_number: lines.length + 1 };
    setLines([...lines, newLine]);

    setCurrentLine({
      line_number: lines.length + 2,
      item_code: '',
      description: '',
      quantity: 1,
      unit_of_measure: 'EA',
      unit_price: 0,
      discount_percentage: 0,
      tax_rate: 15,
      line_total: 0
    });
  };

  const handleRemoveLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index);
    // Renumber lines
    const renumberedLines = updatedLines.map((line, i) => ({
      ...line,
      line_number: i + 1
    }));
    setLines(renumberedLines);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    lines.forEach(line => {
      const lineSubtotal = line.quantity * line.unit_price;
      const discountAmount = lineSubtotal * (line.discount_percentage / 100);
      const taxableAmount = lineSubtotal - discountAmount;
      const taxAmount = taxableAmount * (line.tax_rate / 100);

      subtotal += lineSubtotal;
      totalTax += taxAmount;
    });

    return {
      subtotal,
      tax_amount: totalTax,
      total_amount: subtotal + totalTax
    };
  };

  const handleSave = async () => {
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }

    if (lines.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    try {
      setLoading(true);
      const totals = calculateTotals();
      const url = selectedQuotation
        ? `${API_BASE_URL}/api/sales/quotations/${selectedQuotation.id}`
        : `${API_BASE_URL}/api/sales/quotations`;

      const method = selectedQuotation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...totals, lines })
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchQuotations();
        alert(selectedQuotation ? 'Quotation updated successfully!' : 'Quotation created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToOrder = async (id: number) => {
    if (!confirm('Convert this quotation to a sales order?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/sales/quotations/${id}/convert-to-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        fetchQuotations();
        alert('Quotation converted to sales order successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error converting quotation:', error);
      alert('Failed to convert quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/quotations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchQuotations();
        alert('Status updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'DRAFT': 'gray',
      'SENT': 'blue',
      'NEGOTIATION': 'orange',
      'WON': 'green',
      'LOST': 'red',
      'EXPIRED': 'purple'
    };
    return colors[status] || 'gray';
  };

  const totals = calculateTotals();

  return (
    <div className="quotation-management">
      <div className="quotation-header">
        <h1>Quotation Management</h1>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          + New Quotation
        </button>
      </div>

      <div className="quotation-filters">
        <input
          type="text"
          placeholder="Search quotations..."
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
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {loading && <div className="loading">Loading quotations...</div>}

      <div className="quotation-grid">
        <table className="quotation-table">
          <thead>
            <tr>
              <th>Quotation #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th>Amount</th>
              <th>Probability</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <tr key={quotation.id}>
                <td>
                  <span
                    className="quotation-number"
                    onClick={() => fetchQuotationDetails(quotation.id)}
                  >
                    {quotation.quotation_number}
                  </span>
                </td>
                <td>{quotation.customer_name}</td>
                <td>{new Date(quotation.quotation_date).toLocaleDateString()}</td>
                <td>{new Date(quotation.valid_until).toLocaleDateString()}</td>
                <td className="text-right">R {quotation.total_amount?.toLocaleString()}</td>
                <td>
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{ width: `${quotation.probability}%` }}
                    />
                    <span>{quotation.probability}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${getStatusColor(quotation.status)}`}>
                    {quotation.status}
                  </span>
                  {quotation.converted_to_order && (
                    <span className="converted-badge">✓ Converted</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {quotation.status === 'SENT' && !quotation.converted_to_order && (
                      <button
                        className="btn-sm btn-success"
                        onClick={() => handleConvertToOrder(quotation.id)}
                        title="Convert to Order"
                      >
                        ➜ Order
                      </button>
                    )}
                    {quotation.status === 'DRAFT' && (
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleUpdateStatus(quotation.id, 'SENT')}
                        title="Send"
                      >
                        📤 Send
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {isViewMode
                  ? `Quotation ${selectedQuotation?.quotation_number}`
                  : selectedQuotation
                  ? 'Edit Quotation'
                  : 'New Quotation'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {isViewMode ? (
                <div className="quotation-view">
                  <div className="view-header">
                    <div className="view-info">
                      <h3>{selectedQuotation?.customer_name}</h3>
                      <p>Quotation: {selectedQuotation?.quotation_number}</p>
                      <p>Date: {new Date(selectedQuotation?.quotation_date || '').toLocaleDateString()}</p>
                      <p>Valid Until: {new Date(selectedQuotation?.valid_until || '').toLocaleDateString()}</p>
                    </div>
                    <div className="view-status">
                      <span className={`status-badge large status-${getStatusColor(selectedQuotation?.status || '')}`}>
                        {selectedQuotation?.status}
                      </span>
                      <div className="probability-display">
                        <label>Win Probability:</label>
                        <span>{selectedQuotation?.probability}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="line-items-view">
                    <h4>Line Items</h4>
                    <table className="lines-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Item</th>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Discount</th>
                          <th>Tax</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((line) => (
                          <tr key={line.id || line.line_number}>
                            <td>{line.line_number}</td>
                            <td>{line.item_code}</td>
                            <td>{line.description}</td>
                            <td>{line.quantity} {line.unit_of_measure}</td>
                            <td>R {line.unit_price.toLocaleString()}</td>
                            <td>{line.discount_percentage}%</td>
                            <td>{line.tax_rate}%</td>
                            <td>R {line.line_total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="totals-view">
                    <div className="total-row">
                      <span>Subtotal:</span>
                      <span>R {selectedQuotation?.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="total-row">
                      <span>Tax:</span>
                      <span>R {selectedQuotation?.tax_amount.toLocaleString()}</span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Total:</span>
                      <span>R {selectedQuotation?.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    {!selectedQuotation?.converted_to_order && selectedQuotation?.status === 'SENT' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleConvertToOrder(selectedQuotation.id)}
                      >
                        Convert to Sales Order
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={() => setIsViewMode(false)}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="quotation-wizard">
                  <div className="wizard-steps">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                      <div className="step-number">1</div>
                      <div className="step-label">Details</div>
                    </div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                      <div className="step-number">2</div>
                      <div className="step-label">Line Items</div>
                    </div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                      <div className="step-number">3</div>
                      <div className="step-label">Review</div>
                    </div>
                  </div>

                  {currentStep === 1 && (
                    <div className="step-content">
                      <h3>Quotation Details</h3>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Customer *</label>
                          <select
                            value={formData.customer_id || ''}
                            onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                            required
                          >
                            <option value="">Select Customer</option>
                            {customers.map(customer => (
                              <option key={customer.id} value={customer.id}>
                                {customer.customer_code} - {customer.customer_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Quotation Date *</label>
                          <input
                            type="date"
                            value={formData.quotation_date || ''}
                            onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Valid Until *</label>
                          <input
                            type="date"
                            value={formData.valid_until || ''}
                            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                            required
                          />
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
                          <label>Win Probability (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.probability || 50}
                            onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
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

                        <div className="form-group full-width">
                          <label>Notes</label>
                          <textarea
                            rows={3}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="step-navigation">
                        <button
                          className="btn btn-primary"
                          onClick={() => setCurrentStep(2)}
                          disabled={!formData.customer_id}
                        >
                          Next: Line Items →
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="step-content">
                      <h3>Line Items</h3>

                      <div className="line-item-form">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Item Code</label>
                            <input
                              type="text"
                              value={currentLine.item_code}
                              onChange={(e) => setCurrentLine({ ...currentLine, item_code: e.target.value })}
                            />
                          </div>

                          <div className="form-group full-width">
                            <label>Description *</label>
                            <input
                              type="text"
                              value={currentLine.description}
                              onChange={(e) => setCurrentLine({ ...currentLine, description: e.target.value })}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Quantity *</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={currentLine.quantity}
                              onChange={(e) => setCurrentLine({ ...currentLine, quantity: parseFloat(e.target.value) })}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Unit</label>
                            <input
                              type="text"
                              value={currentLine.unit_of_measure}
                              onChange={(e) => setCurrentLine({ ...currentLine, unit_of_measure: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label>Unit Price *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={currentLine.unit_price}
                              onChange={(e) => setCurrentLine({ ...currentLine, unit_price: parseFloat(e.target.value) })}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Discount (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentLine.discount_percentage}
                              onChange={(e) => setCurrentLine({ ...currentLine, discount_percentage: parseFloat(e.target.value) })}
                            />
                          </div>

                          <div className="form-group">
                            <label>Tax Rate (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentLine.tax_rate}
                              onChange={(e) => setCurrentLine({ ...currentLine, tax_rate: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>

                        <button className="btn btn-primary btn-sm" onClick={handleAddLine}>
                          + Add Line Item
                        </button>
                      </div>

                      {lines.length > 0 && (
                        <div className="added-lines">
                          <h4>Added Items ({lines.length})</h4>
                          <table className="lines-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Total</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((line, index) => (
                                <tr key={index}>
                                  <td>{line.line_number}</td>
                                  <td>{line.description}</td>
                                  <td>{line.quantity} {line.unit_of_measure}</td>
                                  <td>R {line.unit_price.toLocaleString()}</td>
                                  <td>{line.discount_percentage}%</td>
                                  <td>R {line.line_total.toLocaleString()}</td>
                                  <td>
                                    <button
                                      className="btn-icon"
                                      onClick={() => handleRemoveLine(index)}
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="line-totals">
                            <div className="total-row">
                              <span>Subtotal:</span>
                              <span>R {totals.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="total-row">
                              <span>Tax:</span>
                              <span>R {totals.tax_amount.toLocaleString()}</span>
                            </div>
                            <div className="total-row grand-total">
                              <span>Total:</span>
                              <span>R {totals.total_amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="step-navigation">
                        <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                          ← Back
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => setCurrentStep(3)}
                          disabled={lines.length === 0}
                        >
                          Next: Review →
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="step-content">
                      <h3>Review & Submit</h3>

                      <div className="review-summary">
                        <div className="review-section">
                          <h4>Customer Information</h4>
                          <p>
                            {customers.find(c => c.id === formData.customer_id)?.customer_name}
                          </p>
                          <p>Valid Until: {formData.valid_until}</p>
                        </div>

                        <div className="review-section">
                          <h4>Items Summary</h4>
                          <p>{lines.length} line item(s)</p>
                          <p>Total Amount: R {totals.total_amount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="step-navigation">
                        <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                          ← Back
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleSave}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : (selectedQuotation ? 'Update Quotation' : 'Create Quotation')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationManagement;
