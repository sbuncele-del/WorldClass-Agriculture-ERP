import React, { useState, useEffect } from 'react';
import { workspaceApi } from '../../services/api.service';
import '../../styles/erp-ui.css';

interface Lead {
  lead_id: number;
  lead_name: string;
  company: string;
  contact_person: string;
  email: string;
  phone: string;
  source: 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'TRADE_SHOW' | 'SOCIAL_MEDIA';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
  score: number;
  estimated_value: number;
  assigned_to: string;
  created_date: string;
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response: any = await workspaceApi.sales.getLeads();
      
      if (response && Array.isArray(response)) {
        setLeads(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setLeads(response.data);
      } else if (response && response.leads && Array.isArray(response.leads)) {
        setLeads(response.leads);
      } else {
        console.warn('No leads returned from API');
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]);
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
      'NEW': '#3b82f6',
      'CONTACTED': '#f59e0b',
      'QUALIFIED': '#10b981',
      'UNQUALIFIED': '#ef4444',
      'CONVERTED': '#8b5cf6'
    };
    return colors[status] || '#64748b';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leads...</p>
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
                <th>Lead Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Score</th>
                <th>Est. Value</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.lead_id}>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>{lead.lead_name}</td>
                  <td style={{ fontWeight: 600 }}>{lead.company}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: 600 }}>{lead.contact_person}</div>
                      <div style={{ color: '#7f8c8d' }}>{lead.email}</div>
                      <div style={{ color: '#7f8c8d' }}>{lead.phone}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#f3f4f6',
                      color: '#374151'
                    }}>
                      {lead.source.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${lead.score}%`,
                          background: getScoreColor(lead.score),
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '0.875rem',
                        color: getScoreColor(lead.score)
                      }}>
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(lead.estimated_value)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getStatusColor(lead.status)}15`,
                      color: getStatusColor(lead.status)
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{lead.assigned_to}</td>
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
                      {lead.status === 'QUALIFIED' && (
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
                          Convert
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

      {/* Sales Funnel Metrics */}
      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">Total Leads</div>
            <div className="metric-value">{leads.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{leads.filter(l => l.status === 'NEW').length} New</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Qualified Leads</div>
            <div className="metric-value">{leads.filter(l => l.status === 'QUALIFIED').length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{((leads.filter(l => l.status === 'QUALIFIED').length / leads.length) * 100).toFixed(0)}% rate</span>
            </div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Pipeline Value</div>
            <div className="metric-value">
              {formatCurrency(leads.filter(l => l.status !== 'UNQUALIFIED').reduce((sum, l) => sum + l.estimated_value, 0))}
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Avg. Lead Score</div>
            <div className="metric-value">
              {Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)}
            </div>
            <div className="metric-detail">
              <span className="pending-badge">Out of 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Funnel Visualization */}
      <div className="balance-sheet-section" style={{ marginTop: '2rem' }}>
        <h2>📈 Sales Funnel</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          {['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'UNQUALIFIED'].map((stage, index) => {
            const count = leads.filter(l => l.status === stage).length;
            const percentage = (count / leads.length) * 100;
            const colors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
            
            return (
              <div key={stage} style={{
                background: `${colors[index]}15`,
                borderLeft: `4px solid ${colors[index]}`,
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d', marginBottom: '0.5rem' }}>
                  {stage}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: colors[index], marginBottom: '0.5rem' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                  {percentage.toFixed(0)}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;
