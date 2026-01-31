/**
 * Payment History Table Component
 * Displays invoice history with download capability
 */

import type { Invoice } from '../../services/billing.service';

interface PaymentHistoryTableProps {
  invoices: Invoice[];
  onDownload: (invoiceId: string) => void;
}

const PaymentHistoryTable = ({ invoices, onDownload }: PaymentHistoryTableProps) => {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      paid: { label: 'Paid', className: 'badge-success' },
      pending: { label: 'Pending', className: 'badge-warning' },
      failed: { label: 'Failed', className: 'badge-error' },
      refunded: { label: 'Refunded', className: 'badge-info' },
    };

    const badge = badges[status] || { label: status, className: 'badge-default' };
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency === 'ZAR' ? 'R' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toFixed(2)}`;
  };

  if (invoices.length === 0) {
    return (
      <div className="payment-history-table">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" strokeLinecap="round" />
            <polyline points="10 9 9 9 8 9" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>No payment history yet</p>
          <span>Your invoices will appear here once you make a payment</span>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-table">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <span className="invoice-number">{invoice.number}</span>
                </td>
                <td>
                  <span className="invoice-date">{formatDate(invoice.date)}</span>
                </td>
                <td>
                  <span className="invoice-description">{invoice.description}</span>
                </td>
                <td>
                  <span className="invoice-amount">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </span>
                </td>
                <td>
                  {getStatusBadge(invoice.status)}
                </td>
                <td>
                  <div className="table-actions">
                    {invoice.status === 'paid' && invoice.pdfUrl && (
                      <button
                        onClick={() => onDownload(invoice.id)}
                        className="btn-icon"
                        title="Download PDF"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      className="btn-icon"
                      title="View Details"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <p className="table-info">
          Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;
