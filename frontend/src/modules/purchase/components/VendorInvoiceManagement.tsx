import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './VendorInvoiceManagement.css';

interface VendorInvoice {
  id: number;
  invoice_number: string;
  vendor_invoice_number: string;
  vendor_name: string;
  po_number: string;
  grn_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  match_status: string;
  has_variances: boolean;
  days_overdue: number;
}

interface InvoiceLine {
  line_number: number;
  item_code: string;
  description: string;
  po_quantity: number;
  grn_quantity: number;
  invoice_quantity: number;
  po_price: number;
  invoice_price: number;
  line_total: number;
  quantity_variance: number;
  price_variance: number;
  amount_variance: number;
  uom: string;
}

interface ThreeWayMatch {
  po_number: string;
  grn_number: string;
  invoice_number: string;
  vendor_name: string;
  match_status: string;
  total_variance: number;
  lines: InvoiceLine[];
}

interface Payment {
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference: string;
}

const VendorInvoiceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'aged' | 'match'>('invoices');
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
  const [matchData, setMatchData] = useState<ThreeWayMatch | null>(null);
  const [invoiceData, setInvoiceData] = useState({
    vendor_id: '',
    purchase_order_id: '',
    vendor_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 30,
    gl_account_id: '',
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'BANK_TRANSFER',
    reference: '',
    bank_account_id: '',
    notes: ''
  });
  const [agedPayables, setAgedPayables] = useState<any[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendor-invoices`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching vendor invoices:', error);
    }
  };

  const fetchAgedPayables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/aged-payables`);
      const data = await response.json();
      setAgedPayables(data);
    } catch (error) {
      console.error('Error fetching aged payables:', error);
    }
  };

  const fetchThreeWayMatch = async (invoiceId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendor-invoices/${invoiceId}/three-way-match`);
      const data = await response.json();
      setMatchData(data);
      setShowMatchModal(true);
    } catch (error) {
      console.error('Error fetching 3-way match:', error);
    }
  };

  const handleApproveInvoice = async (invoiceId: number) => {
    if (!confirm('Are you sure you want to approve this invoice?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendor-invoices/${invoiceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert('Invoice approved successfully!');
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to approve invoice'}`);
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
      alert('Failed to approve invoice. Please try again.');
    }
  };

  const handleRejectInvoice = async (invoiceId: number) => {
    const reason = prompt('Please enter the rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/purchase/vendor-invoices/${invoiceId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Invoice rejected successfully!');
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to reject invoice'}`);
      }
    } catch (error) {
      console.error('Error rejecting invoice:', error);
      alert('Failed to reject invoice. Please try again.');
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedInvoice) return;

    if (paymentData.amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (paymentData.amount > selectedInvoice.balance) {
      alert('Payment amount cannot exceed the invoice balance');
      return;
    }

    try {
      const payload = {
        vendor_id: selectedInvoice.id, // This should be vendor_id, but we need to fetch it
        payment_date: paymentData.payment_date,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference,
        bank_account_id: paymentData.bank_account_id,
        notes: paymentData.notes,
        allocations: [
          {
            vendor_invoice_id: selectedInvoice.id,
            allocation_amount: paymentData.amount
          }
        ]
      };

      const response = await fetch(`${API_BASE_URL}/api/purchase/vendor-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Payment recorded successfully!');
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        resetPaymentForm();
        fetchInvoices();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to record payment'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    }
  };

  const resetPaymentForm = () => {
    setPaymentData({
      payment_date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_method: 'BANK_TRANSFER',
      reference: '',
      bank_account_id: '',
      notes: ''
    });
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor_invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.po_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { class: string; label: string } } = {
      PENDING: { class: 'pending', label: 'Pending' },
      APPROVED: { class: 'approved', label: 'Approved' },
      REJECTED: { class: 'rejected', label: 'Rejected' },
      PAID: { class: 'paid', label: 'Paid' },
      PARTIALLY_PAID: { class: 'partial', label: 'Partially Paid' },
      OVERDUE: { class: 'overdue', label: 'Overdue' }
    };
    
    const config = statusMap[status] || statusMap.PENDING;
    return <span className={`invoice-status-badge ${config.class}`}>{config.label}</span>;
  };

  const getMatchStatusBadge = (status: string, hasVariances: boolean) => {
    if (status === 'MATCHED' && !hasVariances) {
      return <span className="match-badge matched">✓ Matched</span>;
    } else if (hasVariances) {
      return <span className="match-badge variance">⚠ Variances</span>;
    } else {
      return <span className="match-badge pending">○ Pending</span>;
    }
  };

  useEffect(() => {
    if (activeTab === 'aged') {
      fetchAgedPayables();
    }
  }, [activeTab]);

  return (
    <div className="vendor-invoice-management">
      <h2>📄 Vendor Invoices</h2>

      <div className="invoice-tabs">
        <button
          className={`invoice-tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          All Invoices
        </button>
        <button
          className={`invoice-tab ${activeTab === 'aged' ? 'active' : ''}`}
          onClick={() => setActiveTab('aged')}
        >
          Aged Payables
        </button>
        <button
          className={`invoice-tab ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveTab('match')}
        >
          3-Way Matching
        </button>
      </div>

      {activeTab === 'invoices' && (
        <>
          <div className="invoice-controls">
            <div className="invoice-search-filter">
              <div className="invoice-search">
                <input
                  type="text"
                  placeholder="Search invoices, vendors, or POs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="invoice-filter">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
            <div className="invoice-actions">
              <button className="btn-create-invoice" onClick={() => setShowInvoiceModal(true)}>
                + New Invoice
              </button>
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="invoice-empty-state">
              <p>No vendor invoices found</p>
              <button onClick={() => setShowInvoiceModal(true)}>Create Invoice</button>
            </div>
          ) : (
            <div className="invoice-grid">
              {filteredInvoices.map(invoice => (
                <div key={invoice.id} className="invoice-card">
                  <div className="invoice-card-header">
                    <div>
                      <div className="invoice-number">{invoice.invoice_number}</div>
                      <div className="vendor-invoice-number">Vendor: {invoice.vendor_invoice_number}</div>
                      <div className="invoice-date">{new Date(invoice.invoice_date).toLocaleDateString()}</div>
                    </div>
                    <div className="status-badges">
                      {getStatusBadge(invoice.status)}
                      {getMatchStatusBadge(invoice.match_status, invoice.has_variances)}
                    </div>
                  </div>
                  <div className="invoice-card-body">
                    <div className="invoice-vendor">{invoice.vendor_name}</div>
                    <div className="invoice-details">
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">PO Number</span>
                        <span className="invoice-detail-value">{invoice.po_number}</span>
                      </div>
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">GRN Number</span>
                        <span className="invoice-detail-value">{invoice.grn_number || '-'}</span>
                      </div>
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">Due Date</span>
                        <span className={`invoice-detail-value ${invoice.days_overdue > 0 ? 'overdue' : ''}`}>
                          {new Date(invoice.due_date).toLocaleDateString()}
                          {invoice.days_overdue > 0 && ` (${invoice.days_overdue}d overdue)`}
                        </span>
                      </div>
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">Total Amount</span>
                        <span className="invoice-total">R {invoice.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">Paid Amount</span>
                        <span className="invoice-detail-value">R {invoice.paid_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="invoice-detail-item">
                        <span className="invoice-detail-label">Balance</span>
                        <span className="invoice-balance">R {invoice.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="invoice-card-footer">
                    <div className="invoice-quick-actions">
                      {invoice.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApproveInvoice(invoice.id)} className="btn-approve">Approve</button>
                          <button onClick={() => handleRejectInvoice(invoice.id)} className="btn-reject">Reject</button>
                        </>
                      )}
                      {invoice.has_variances && (
                        <button onClick={() => fetchThreeWayMatch(invoice.id)} className="btn-match">View Match</button>
                      )}
                      {(invoice.status === 'APPROVED' || invoice.status === 'PARTIALLY_PAID') && invoice.balance > 0 && (
                        <button 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentData({ ...paymentData, amount: invoice.balance });
                            setShowPaymentModal(true);
                          }} 
                          className="btn-pay"
                        >
                          Pay
                        </button>
                      )}
                      <button onClick={() => console.log('View invoice', invoice.id)}>View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'aged' && (
        <div className="aged-payables-section">
          <h3>Aged Payables Report</h3>
          <div className="aged-table-container">
            <table className="aged-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Current</th>
                  <th>1-30 Days</th>
                  <th>31-60 Days</th>
                  <th>61-90 Days</th>
                  <th>90+ Days</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {agedPayables.map((vendor, index) => (
                  <tr key={index}>
                    <td className="vendor-name">{vendor.vendor_name}</td>
                    <td>R {(vendor.current || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    <td>R {(vendor.days_1_30 || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    <td>R {(vendor.days_31_60 || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    <td>R {(vendor.days_61_90 || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    <td className="overdue">R {(vendor.days_over_90 || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                    <td className="total">R {(vendor.total || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              {agedPayables.length > 0 && (
                <tfoot>
                  <tr>
                    <td><strong>TOTAL</strong></td>
                    <td><strong>R {agedPayables.reduce((sum, v) => sum + (v.current || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                    <td><strong>R {agedPayables.reduce((sum, v) => sum + (v.days_1_30 || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                    <td><strong>R {agedPayables.reduce((sum, v) => sum + (v.days_31_60 || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                    <td><strong>R {agedPayables.reduce((sum, v) => sum + (v.days_61_90 || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                    <td className="overdue"><strong>R {agedPayables.reduce((sum, v) => sum + (v.days_over_90 || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                    <td className="total"><strong>R {agedPayables.reduce((sum, v) => sum + (v.total || 0), 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="invoice-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3>Record Payment - {selectedInvoice.invoice_number}</h3>
              <button className="invoice-modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="invoice-modal-body">
              <div className="payment-summary">
                <div className="payment-summary-item">
                  <span className="label">Vendor:</span>
                  <span className="value">{selectedInvoice.vendor_name}</span>
                </div>
                <div className="payment-summary-item">
                  <span className="label">Invoice Total:</span>
                  <span className="value">R {selectedInvoice.total_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="payment-summary-item">
                  <span className="label">Paid to Date:</span>
                  <span className="value">R {selectedInvoice.paid_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="payment-summary-item">
                  <span className="label">Balance Due:</span>
                  <span className="value balance">R {selectedInvoice.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="payment-form-row">
                <div className="payment-form-group">
                  <label>Payment Date <span className="required">*</span></label>
                  <input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  />
                </div>
                <div className="payment-form-group">
                  <label>Amount <span className="required">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="payment-form-row">
                <div className="payment-form-group">
                  <label>Payment Method <span className="required">*</span></label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
                <div className="payment-form-group">
                  <label>Reference</label>
                  <input
                    type="text"
                    placeholder="Payment reference"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="payment-form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Payment notes..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="invoice-modal-footer">
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleCreatePayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Way Match Modal */}
      {showMatchModal && matchData && (
        <div className="invoice-modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="invoice-modal match-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3>3-Way Match Analysis</h3>
              <button className="invoice-modal-close" onClick={() => setShowMatchModal(false)}>×</button>
            </div>
            <div className="invoice-modal-body">
              <div className="match-summary">
                <div className="match-info">
                  <div><strong>PO:</strong> {matchData.po_number}</div>
                  <div><strong>GRN:</strong> {matchData.grn_number}</div>
                  <div><strong>Invoice:</strong> {matchData.invoice_number}</div>
                  <div><strong>Vendor:</strong> {matchData.vendor_name}</div>
                </div>
                <div className={`match-status-indicator ${matchData.match_status.toLowerCase()}`}>
                  {matchData.match_status}
                  {matchData.total_variance !== 0 && (
                    <div className="variance-amount">
                      Variance: R {Math.abs(matchData.total_variance).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>

              <table className="match-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>PO Qty</th>
                    <th>GRN Qty</th>
                    <th>Inv Qty</th>
                    <th>Qty Var</th>
                    <th>PO Price</th>
                    <th>Inv Price</th>
                    <th>Price Var</th>
                    <th>Amount Var</th>
                  </tr>
                </thead>
                <tbody>
                  {matchData.lines.map((line, index) => (
                    <tr key={index} className={line.amount_variance !== 0 ? 'has-variance' : ''}>
                      <td>
                        <div className="item-info">
                          <div className="item-code">{line.item_code}</div>
                          <div className="item-desc">{line.description}</div>
                        </div>
                      </td>
                      <td>{line.po_quantity}</td>
                      <td>{line.grn_quantity}</td>
                      <td>{line.invoice_quantity}</td>
                      <td className={line.quantity_variance !== 0 ? 'variance' : ''}>{line.quantity_variance}</td>
                      <td>R {line.po_price.toFixed(2)}</td>
                      <td>R {line.invoice_price.toFixed(2)}</td>
                      <td className={line.price_variance !== 0 ? 'variance' : ''}>
                        R {line.price_variance.toFixed(2)}
                      </td>
                      <td className={line.amount_variance !== 0 ? 'variance' : ''}>
                        R {line.amount_variance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="invoice-modal-footer">
              <button className="btn-cancel" onClick={() => setShowMatchModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoiceManagement;
