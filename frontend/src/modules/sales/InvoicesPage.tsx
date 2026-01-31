import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
  payment_terms: string;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/sales/invoices');
      const data = response.data;
      // Map API response to component interface
      const mappedInvoices = (data.invoices || data || []).map((inv: any) => ({
        invoice_id: inv.id || inv.invoice_id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customer_name,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        total_amount: inv.total_amount || 0,
        paid_amount: inv.amount_paid || inv.paid_amount || 0,
        balance: inv.amount_due || inv.balance || (inv.total_amount - (inv.amount_paid || 0)),
        status: inv.payment_status || inv.status || 'DRAFT',
        payment_terms: inv.payment_terms || 'Net 30'
      }));
      setInvoices(mappedInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'DRAFT': '#64748b',
      'SENT': '#3b82f6',
      'PAID': '#10b981',
      'PARTIAL': '#f59e0b',
      'OVERDUE': '#ef4444',
      'CANCELLED': '#94a3b8'
    };
    return colors[status] || '#64748b';
  };

  const getDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Invoice Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.invoice_id}>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>{invoice.invoice_number}</td>
                  <td style={{ fontWeight: 600 }}>{invoice.customer_name}</td>
                  <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                  <td>
                    <div>
                      <div>{new Date(invoice.due_date).toLocaleDateString()}</div>
                      {invoice.status === 'OVERDUE' && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                          {getDaysOverdue(invoice.due_date)} days overdue
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(invoice.total_amount)}</td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(invoice.paid_amount)}</td>
                  <td style={{ 
                    fontWeight: 600,
                    color: invoice.balance > 0 ? '#ef4444' : '#10b981'
                  }}>
                    {formatCurrency(invoice.balance)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getStatusColor(invoice.status)}15`,
                      color: getStatusColor(invoice.status)
                    }}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{
                        background: 'white',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        View
                      </button>
                      {invoice.balance > 0 && (
                        <button style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}>
                          Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">🧾</div>
          <div className="metric-content">
            <div className="metric-label">Total Invoices</div>
            <div className="metric-value">{invoices.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{invoices.filter(i => i.status === 'PAID').length} Paid</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Invoiced</div>
            <div className="metric-value">{formatCurrency(totalInvoiced)}</div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Total Collected</div>
            <div className="metric-value">{formatCurrency(totalPaid)}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{((totalPaid / totalInvoiced) * 100).toFixed(0)}% collected</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-label">Outstanding</div>
            <div className="metric-value">{formatCurrency(totalOutstanding)}</div>
            <div className="metric-detail">
              <span className="pending-badge">
                {invoices.filter(i => i.status === 'OVERDUE').length} Overdue
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
