import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import '../../styles/erp-ui.css';

interface ComplianceItem {
  id: string;
  category: 'LABOR_LAW' | 'TAX' | 'EMPLOYMENT_EQUITY' | 'SKILLS_DEVELOPMENT' | 'HEALTH_SAFETY' | 'BBBEE';
  requirement: string;
  legislation: string;
  status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | 'IN_PROGRESS';
  due_date: string | null;
  responsible_person: string;
  last_review: string;
  notes: string;
}

const CompliancePage: React.FC = () => {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchComplianceItems();
  }, []);

  const fetchComplianceItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/compliance/items');
      const data = response.data?.data || response.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching compliance items:', err);
      setError(err.response?.data?.message || 'Failed to load compliance data');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'COMPLIANT': 'green',
      'AT_RISK': 'orange',
      'NON_COMPLIANT': 'red',
      'IN_PROGRESS': 'blue'
    };
    return colors[status] || 'gray';
  };

  const filteredItems = items.filter(item => {
    return filterCategory === 'ALL' || item.category === filterCategory;
  });

  const compliantCount = items.filter(i => i.status === 'COMPLIANT').length;
  const atRiskCount = items.filter(i => i.status === 'AT_RISK').length;
  const nonCompliantCount = items.filter(i => i.status === 'NON_COMPLIANT').length;
  const complianceScore = Math.round((compliantCount / items.length) * 100);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="content-card">
        <div className="card-header">
          <h2>⚖️ RSA Labor Law Compliance</h2>
          <button className="btn-primary">+ Add Requirement</button>
        </div>

        <div className="filters-section">
          <div className="filter-buttons">
            <button 
              className={filterCategory === 'ALL' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('ALL')}
            >
              All
            </button>
            <button 
              className={filterCategory === 'LABOR_LAW' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('LABOR_LAW')}
            >
              Labor Law
            </button>
            <button 
              className={filterCategory === 'TAX' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('TAX')}
            >
              Tax
            </button>
            <button 
              className={filterCategory === 'EMPLOYMENT_EQUITY' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('EMPLOYMENT_EQUITY')}
            >
              EE
            </button>
            <button 
              className={filterCategory === 'SKILLS_DEVELOPMENT' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('SKILLS_DEVELOPMENT')}
            >
              Skills Dev
            </button>
            <button 
              className={filterCategory === 'HEALTH_SAFETY' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('HEALTH_SAFETY')}
            >
              H&S
            </button>
            <button 
              className={filterCategory === 'BBBEE' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilterCategory('BBBEE')}
            >
              B-BBEE
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Legislation</th>
                <th>Category</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Responsible</th>
                <th>Last Review</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.requirement}</strong>
                    <div className="text-muted">{item.notes}</div>
                  </td>
                  <td>{item.legislation}</td>
                  <td>{item.category.replace(/_/g, ' ')}</td>
                  <td>
                    <span className={`status-badge status-${getStatusColor(item.status)}`}>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {item.due_date ? (
                      new Date(item.due_date).toLocaleDateString('en-ZA')
                    ) : (
                      <span className="text-muted">Ongoing</span>
                    )}
                  </td>
                  <td>{item.responsible_person}</td>
                  <td>{new Date(item.last_review).toLocaleDateString('en-ZA')}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details">👁️</button>
                      <button className="btn-icon" title="Update">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Compliance Score</div>
          <div className="metric-value">
            <span className={`performance-badge badge-${complianceScore >= 90 ? 'green' : complianceScore >= 75 ? 'orange' : 'red'}`}>
              {complianceScore}%
            </span>
          </div>
          <div className="metric-detail">{compliantCount} of {items.length} items</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Compliant</div>
          <div className="metric-value">{compliantCount}</div>
          <div className="metric-detail text-success">On track</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">At Risk</div>
          <div className="metric-value">{atRiskCount}</div>
          <div className="metric-detail text-warning">Needs attention</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Non-Compliant</div>
          <div className="metric-value">{nonCompliantCount}</div>
          <div className="metric-detail text-danger">Urgent action required</div>
        </div>
      </div>

      <div className="content-card" style={{marginTop: '2rem'}}>
        <h3>📚 Key RSA Labor Legislation</h3>
        <div style={{padding: '1.5rem', lineHeight: '1.8'}}>
          <div style={{marginBottom: '1rem'}}>
            <strong>BCEA (Basic Conditions of Employment Act):</strong> Working hours, leave, termination
          </div>
          <div style={{marginBottom: '1rem'}}>
            <strong>LRA (Labour Relations Act):</strong> Dismissals, disputes, collective bargaining
          </div>
          <div style={{marginBottom: '1rem'}}>
            <strong>Employment Equity Act:</strong> Non-discrimination, affirmative action, EE plans
          </div>
          <div style={{marginBottom: '1rem'}}>
            <strong>Skills Development Act:</strong> Training, SDL payments, learnerships
          </div>
          <div style={{marginBottom: '1rem'}}>
            <strong>Occupational Health & Safety Act:</strong> Safe working conditions, incident reporting
          </div>
          <div>
            <strong>B-BBEE Act:</strong> Economic transformation, ownership, skills development
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
