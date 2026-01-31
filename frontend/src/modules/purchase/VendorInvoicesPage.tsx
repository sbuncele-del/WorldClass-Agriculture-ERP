import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface VendorInvoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_code: string;
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'RECEIVED' | 'MATCHED' | 'APPROVED' | 'PAID' | 'DISPUTED';
  po_number: string | null;
  grn_number: string | null;
  amount: number;
  outstanding: number;
  payment_terms: string;
  match_status: '3-WAY' | '2-WAY' | 'MANUAL' | 'PENDING';
  days_overdue: number;
  notes: string;
}

const VendorInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchVendorInvoices();
  }, []);

  const fetchVendorInvoices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/purchase/invoices');
      setInvoices(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Error fetching vendor invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'DRAFT': 'gray',
      'RECEIVED': 'blue',
      'MATCHED': 'orange',
      'APPROVED': 'green',
      'PAID': 'purple',
      'DISPUTED': 'red'
    };
    return colors[status] || 'gray';
  };

  const getMatchStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      '3-WAY': 'green',
      '2-WAY': 'orange',
      'MANUAL': 'blue',
      'PENDING': 'gray'
    };
    return colors[status] || 'gray';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.po_number && invoice.po_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'ALL' || invoice.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const totalInvoices = invoices.length;
  const pendingApproval = invoices.filter(i => i.status === 'MATCHED' || i.status === 'RECEIVED').length;
  const totalPayable = invoices.reduce((sum, i) => sum + i.outstanding, 0);
  const overdue = invoices.filter(i => i.days_overdue < 0 && i.outstanding > 0).length;
  const overdueAmount = invoices.filter(i => i.days_overdue < 0 && i.outstanding > 0)
    .reduce((sum, i) => sum + i.outstanding, 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading vendor invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>🧾 Vendor Invoices</h2>
          <button className="btn-primary">+ New Invoice</button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search invoices by number, vendor, or PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={filterStatus === 'ALL' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('ALL')}
            >
              All
            </button>
            <button 
              className={filterStatus === 'RECEIVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('RECEIVED')}
            >
              Received
            </button>
            <button 
              className={filterStatus === 'MATCHED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('MATCHED')}
            >
              Matched
            </button>
            <button 
              className={filterStatus === 'APPROVED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Approved
            </button>
            <button 
              className={filterStatus === 'PAID' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('PAID')}
            >
              Paid
            </button>
            <button 
              className={filterStatus === 'DISPUTED' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterStatus('DISPUTED')}
            >
              Disputed
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Invoice Date</th>
                <th>Vendor</th>
                <th>PO Number</th>
                <th>Status</th>
                <th>Match Status</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Outstanding</th>
                <th>Days Overdue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="code-cell">{invoice.invoice_number}</td>
                  <td>{new Date(invoice.invoice_date).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <div className="supplier-info">
                      <div className="supplier-name">{invoice.vendor_name}</div>
                      <div className="supplier-code">{invoice.vendor_code}</div>
                    </div>
                  </td>
                  <td>
                    {invoice.po_number ? (
                      <a href={`/purchase/orders?po=${invoice.po_number}`} className="link-text">
                        {invoice.po_number}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${getMatchStatusColor(invoice.match_status)}`}>
                      {invoice.match_status}
                    </span>
                  </td>
                  <td>
                    {new Date(invoice.due_date).toLocaleDateString('en-ZA')}
                    {invoice.days_overdue < 0 && invoice.outstanding > 0 && (
                      <span className="overdue-badge">OVERDUE</span>
                    )}
                  </td>
                  <td className="amount-cell">{formatCurrency(invoice.amount)}</td>
                  <td className="amount-cell">
                    <span className={invoice.outstanding > 0 ? 'text-warning' : 'text-success'}>
                      {formatCurrency(invoice.outstanding)}
                    </span>
                  </td>
                  <td className="text-center">
                    {invoice.days_overdue < 0 && invoice.outstanding > 0 ? (
                      <span className="text-danger">{Math.abs(invoice.days_overdue)}</span>
                    ) : invoice.outstanding > 0 ? (
                      <span className="text-success">{invoice.days_overdue}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      {invoice.status === 'MATCHED' && (
                        <button className="btn-icon" title="Approve">✅</button>
                      )}
                      {invoice.status === 'APPROVED' && invoice.outstanding > 0 && (
                        <button className="btn-icon" title="Pay Invoice">💳</button>
                      )}
                      {invoice.status === 'RECEIVED' && (
                        <button className="btn-icon" title="Match">🔗</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="empty-state">
            <p>No vendor invoices found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Invoices</div>
          <div className="metric-value">{totalInvoices}</div>
          <div className="metric-detail">All statuses</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Pending Approval</div>
          <div className="metric-value">{pendingApproval}</div>
          <div className="metric-detail">Awaiting approval</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Payable</div>
          <div className="metric-value">{formatCurrency(totalPayable)}</div>
          <div className="metric-detail">Outstanding balance</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Overdue Invoices</div>
          <div className="metric-value">{overdue}</div>
          <div className="metric-detail">{formatCurrency(overdueAmount)}</div>
        </div>
      </div>
    </div>
  );
};

export default VendorInvoicesPage;
