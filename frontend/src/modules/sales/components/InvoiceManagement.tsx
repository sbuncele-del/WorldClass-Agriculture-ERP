import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../services/api.service';
import './InvoiceManagement.css';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: string;
  status: string;
}

interface Payment {
  id?: number;
  payment_number?: string;
  payment_date: string;
  payment_amount: number;
  payment_method: string;
  reference: string;
  notes?: string;
}

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

  const [paymentData, setPaymentData] = useState<Payment>({
    payment_date: new Date().toISOString().split('T')[0],
    payment_amount: 0,
    payment_method: 'BANK_TRANSFER',
    reference: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, filterStatus, filterPaymentStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPaymentStatus) params.append('payment_status', filterPaymentStatus);

      const response = await fetch(`${API_BASE_URL}/api/sales/invoices?${params}`);
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/invoices/${id}`);
      const data = await response.json();
      setSelectedInvoice(data.invoice);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;

    if (paymentData.payment_amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (paymentData.payment_amount > selectedInvoice.amount_due) {
      if (!confirm('Payment amount exceeds amount due. Continue?')) return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/sales/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedInvoice.customer_id,
          invoice_id: selectedInvoice.id,
          ...paymentData
        })
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setIsModalOpen(false);
        fetchInvoices();
        alert('Payment recorded successfully!');
        setPaymentData({
          payment_date: new Date().toISOString().split('T')[0],
          payment_amount: 0,
          payment_method: 'BANK_TRANSFER',
          reference: ''
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'UNPAID': 'red',
      'PARTIALLY_PAID': 'orange',
      'PAID': 'green',
      'OVERPAID': 'purple'
    };
    return colors[status] || 'gray';
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getOverdueClass = (dueDate: string, paymentStatus: string) => {
    if (paymentStatus === 'PAID') return '';
    const daysOverdue = getDaysOverdue(dueDate);
    if (daysOverdue === 0) return '';
    if (daysOverdue <= 30) return 'overdue-warning';
    return 'overdue-critical';
  };

  return (
    <div className="invoice-management">
      <div className="invoice-header">
        <h1>Invoice Management</h1>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">
              R {invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0).toLocaleString()}
            </div>
            <div className="stat-label">Total Outstanding</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {invoices.filter(inv => getDaysOverdue(inv.due_date) > 0 && inv.payment_status !== 'PAID').length}
            </div>
            <div className="stat-label">Overdue Invoices</div>
          </div>
        </div>
      </div>

      <div className="invoice-filters">
        <input
          type="text"
          placeholder="Search invoices..."
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
          <option value="POSTED">Posted</option>
          <option value="SENT">Sent</option>
          <option value="VOID">Void</option>
        </select>

        <select
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Payment Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {loading && <div className="loading">Loading invoices...</div>}

      <div className="invoice-grid">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Amount Due</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className={getOverdueClass(invoice.due_date, invoice.payment_status)}>
                <td>
                  <span
                    className="invoice-number"
                    onClick={() => fetchInvoiceDetails(invoice.id)}
                  >
                    {invoice.invoice_number}
                  </span>
                </td>
                <td>{invoice.customer_name}</td>
                <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                <td>
                  {new Date(invoice.due_date).toLocaleDateString()}
                  {getDaysOverdue(invoice.due_date) > 0 && invoice.payment_status !== 'PAID' && (
                    <span className="overdue-badge">
                      {getDaysOverdue(invoice.due_date)} days overdue
                    </span>
                  )}
                </td>
                <td className="text-right">R {invoice.total_amount?.toLocaleString()}</td>
                <td className="text-right">R {invoice.amount_paid?.toLocaleString()}</td>
                <td className="text-right font-bold">R {invoice.amount_due?.toLocaleString()}</td>
                <td>
                  <span className={`payment-status-badge status-${getPaymentStatusColor(invoice.payment_status)}`}>
                    {invoice.payment_status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    {invoice.amount_due > 0 && (
                      <button
                        className="btn-sm btn-success"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentData({
                            ...paymentData,
                            payment_amount: invoice.amount_due
                          });
                          setShowPaymentModal(true);
                        }}
                      >
                        💰 Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice {selectedInvoice.invoice_number}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="invoice-view">
                <div className="view-header">
                  <div className="view-info">
                    <h3>{selectedInvoice.customer_name}</h3>
                    <p>Invoice: {selectedInvoice.invoice_number}</p>
                    <p>Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString()}</p>
                    <p>Due: {new Date(selectedInvoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="view-status">
                    <span className={`payment-status-badge large status-${getPaymentStatusColor(selectedInvoice.payment_status)}`}>
                      {selectedInvoice.payment_status.replace('_', ' ')}
                    </span>
                    {getDaysOverdue(selectedInvoice.due_date) > 0 && selectedInvoice.payment_status !== 'PAID' && (
                      <div className="overdue-alert">
                        ⚠️ {getDaysOverdue(selectedInvoice.due_date)} days overdue
                      </div>
                    )}
                  </div>
                </div>

                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Total Amount:</span>
                    <span className="amount">R {selectedInvoice.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Amount Paid:</span>
                    <span className="amount paid">R {selectedInvoice.amount_paid.toLocaleString()}</span>
                  </div>
                  <div className="summary-row outstanding">
                    <span>Amount Due:</span>
                    <span className="amount due">R {selectedInvoice.amount_due.toLocaleString()}</span>
                  </div>

                  <div className="payment-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(selectedInvoice.amount_paid / selectedInvoice.total_amount) * 100}%` }}
                      />
                    </div>
                    <span className="progress-label">
                      {Math.round((selectedInvoice.amount_paid / selectedInvoice.total_amount) * 100)}% Paid
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  {selectedInvoice.amount_due > 0 && (
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setPaymentData({
                          ...paymentData,
                          payment_amount: selectedInvoice.amount_due
                        });
                        setShowPaymentModal(true);
                      }}
                    >
                      Record Payment
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="payment-form">
                <div className="payment-info-box">
                  <h4>Invoice Details</h4>
                  <p>Invoice: {selectedInvoice?.invoice_number}</p>
                  <p>Customer: {selectedInvoice?.customer_name}</p>
                  <p>Amount Due: <strong>R {selectedInvoice?.amount_due.toLocaleString()}</strong></p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Amount *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentData.payment_amount}
                      onChange={(e) => setPaymentData({ ...paymentData, payment_amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Payment Method *</label>
                    <select
                      value={paymentData.payment_method}
                      onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                      required
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="DEBIT_CARD">Debit Card</option>
                      <option value="EFT">EFT</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Reference/Transaction ID</label>
                    <input
                      type="text"
                      value={paymentData.reference}
                      onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      rows={3}
                      value={paymentData.notes || ''}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleRecordPayment}
                    disabled={loading || paymentData.payment_amount <= 0}
                  >
                    {loading ? 'Recording...' : 'Record Payment'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
