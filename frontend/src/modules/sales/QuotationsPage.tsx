import React, { useState, useEffect } from 'react';
import { workspaceApi } from '../../services/api.service';
import '../../styles/erp-ui.css';

interface Quotation {
  quotation_id: number;
  quotation_number: string;
  customer_name: string;
  quotation_date: string;
  valid_until: string;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  probability: number;
  sales_person: string;
}

const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await workspaceApi.sales.getQuotations();
      if (response && Array.isArray(response)) {
        setQuotations(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setQuotations(response.data);
      } else {
        setQuotations([]);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setQuotations([]);
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
      'ACCEPTED': '#10b981',
      'REJECTED': '#ef4444',
      'EXPIRED': '#94a3b8'
    };
    return colors[status] || '#64748b';
  };

  const totalValue = quotations.reduce((sum, q) => sum + q.total_amount, 0);
  const weightedValue = quotations.reduce((sum, q) => sum + (q.total_amount * q.probability / 100), 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading quotations...</p>
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
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Quote Date</th>
                <th>Valid Until</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Probability</th>
                <th>Sales Person</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.quotation_id}>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>{quotation.quotation_number}</td>
                  <td style={{ fontWeight: 600 }}>{quotation.customer_name}</td>
                  <td>{new Date(quotation.quotation_date).toLocaleDateString()}</td>
                  <td>{new Date(quotation.valid_until).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(quotation.total_amount)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getStatusColor(quotation.status)}15`,
                      color: getStatusColor(quotation.status)
                    }}>
                      {quotation.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        flex: 1, 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${quotation.probability}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{quotation.probability}%</span>
                    </div>
                  </td>
                  <td>{quotation.sales_person}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-label">Total Quotations</div>
            <div className="metric-value">{quotations.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{quotations.filter(q => q.status === 'SENT').length} Pending</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Value</div>
            <div className="metric-value">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Weighted Value</div>
            <div className="metric-value">{formatCurrency(weightedValue)}</div>
            <div className="metric-trend">
              <span className="profit-margin">Based on probability</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Acceptance Rate</div>
            <div className="metric-value">
              {((quotations.filter(q => q.status === 'ACCEPTED').length / quotations.length) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsPage;
