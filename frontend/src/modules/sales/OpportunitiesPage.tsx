import React, { useState, useEffect } from 'react';
import { workspaceApi } from '../../services/api.service';
import '../../styles/erp-ui.css';

interface Opportunity {
  opportunity_id: number;
  opportunity_name: string;
  customer_name: string;
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  probability: number;
  estimated_value: number;
  expected_close_date: string;
  owner: string;
  created_date: string;
  last_activity: string;
}

const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response: any = await workspaceApi.sales.getOpportunities();
      if (response && Array.isArray(response)) {
        setOpportunities(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setOpportunities(response.data);
      } else {
        setOpportunities([]);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setOpportunities([]);
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

  const getStageColor = (stage: string): string => {
    const colors: Record<string, string> = {
      'PROSPECTING': '#6366f1',
      'QUALIFICATION': '#3b82f6',
      'PROPOSAL': '#f59e0b',
      'NEGOTIATION': '#f97316',
      'CLOSED_WON': '#10b981',
      'CLOSED_LOST': '#ef4444'
    };
    return colors[stage] || '#64748b';
  };

  const totalValue = opportunities.reduce((sum, o) => sum + o.estimated_value, 0);
  const weightedValue = opportunities.reduce((sum, o) => sum + (o.estimated_value * o.probability / 100), 0);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading opportunities...</p>
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
                <th>Opportunity Name</th>
                <th>Customer</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Value</th>
                <th>Weighted Value</th>
                <th>Close Date</th>
                <th>Owner</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.opportunity_id}>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>{opp.opportunity_name}</td>
                  <td style={{ fontWeight: 600 }}>{opp.customer_name}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: `${getStageColor(opp.stage)}15`,
                      color: getStageColor(opp.stage)
                    }}>
                      {opp.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        flex: 1, 
                        height: '8px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        minWidth: '80px'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${opp.probability}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: '35px' }}>{opp.probability}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(opp.estimated_value)}</td>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>
                    {formatCurrency(opp.estimated_value * opp.probability / 100)}
                  </td>
                  <td>{new Date(opp.expected_close_date).toLocaleDateString()}</td>
                  <td>{opp.owner}</td>
                  <td style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                    {new Date(opp.last_activity).toLocaleDateString()}
                  </td>
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

      {/* Pipeline Metrics */}
      <div className="metrics-grid" style={{ marginTop: '2rem' }}>
        <div className="metric-card revenue">
          <div className="metric-icon">💼</div>
          <div className="metric-content">
            <div className="metric-label">Total Opportunities</div>
            <div className="metric-value">{opportunities.length}</div>
            <div className="metric-trend positive">
              <span className="trend-text">{opportunities.filter(o => !o.stage.includes('CLOSED')).length} Active</span>
            </div>
          </div>
        </div>

        <div className="metric-card expenses">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Pipeline Value</div>
            <div className="metric-value">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        <div className="metric-card profit">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Weighted Pipeline</div>
            <div className="metric-value">{formatCurrency(weightedValue)}</div>
            <div className="metric-trend">
              <span className="profit-margin">Expected value</span>
            </div>
          </div>
        </div>

        <div className="metric-card activity">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value">
              {((opportunities.filter(o => o.stage === 'CLOSED_WON').length / opportunities.filter(o => o.stage.includes('CLOSED')).length) * 100).toFixed(0)}%
            </div>
            <div className="metric-detail">
              <span className="pending-badge">{opportunities.filter(o => o.stage === 'CLOSED_WON').length} Won</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages Visualization */}
      <div className="balance-sheet-section" style={{ marginTop: '2rem' }}>
        <h2>🚀 Pipeline Stages</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { stage: 'PROSPECTING', icon: '🔍' },
            { stage: 'QUALIFICATION', icon: '✓' },
            { stage: 'PROPOSAL', icon: '📝' },
            { stage: 'NEGOTIATION', icon: '🤝' }
          ].map((item, index) => {
            const count = opportunities.filter(o => o.stage === item.stage).length;
            const value = opportunities.filter(o => o.stage === item.stage).reduce((sum, o) => sum + o.estimated_value, 0);
            const colors = ['#6366f1', '#3b82f6', '#f59e0b', '#f97316'];
            
            return (
              <div key={item.stage} style={{
                background: `${colors[index]}15`,
                borderLeft: `4px solid ${colors[index]}`,
                padding: '1.5rem',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7f8c8d', marginBottom: '0.5rem' }}>
                  {item.stage}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: colors[index], marginBottom: '0.25rem' }}>
                  {count}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#7f8c8d' }}>
                  {formatCurrency(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesPage;
