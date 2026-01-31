import { useState, useEffect } from 'react';
import '../modules/sars-sentinel/styles/SARSSentinel.css';

interface DashboardStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  due_this_week: number;
  total_active: number;
}

interface Correspondence {
  id: string;
  client_name: string;
  reference_number: string;
  document_type: string;
  deadline: string;
  days_remaining: number;
  status: string;
  urgency_level: string;
}

export default function SARSSentinel() {
  const [stats, setStats] = useState<DashboardStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    overdue: 0,
    due_this_week: 0,
    total_active: 0,
  });

  const [correspondence, setCorrespondence] = useState<Correspondence[]>([]);

  useEffect(() => {
    // Fetch dashboard stats
    fetch('/api/sars-sentinel/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data.data))
      .catch(err => console.error('Error fetching stats:', err));

    // Fetch upcoming deadlines
    fetch('/api/sars-sentinel/dashboard/deadlines')
      .then(res => res.json())
      .then(data => setCorrespondence(data.data))
      .catch(err => console.error('Error fetching deadlines:', err));
  }, []);

  const getUrgencyClass = (urgency: string) => {
    switch (urgency.toUpperCase()) {
      case 'CRITICAL':
        return 'urgency-critical';
      case 'HIGH':
        return 'urgency-high';
      case 'MEDIUM':
        return 'urgency-medium';
      default:
        return 'urgency-low';
    }
  };

  return (
    <div className="sars-sentinel-page">
      <div className="page-header">
        <h1>🇿🇦 SARS Sentinel - Compliance Command Center</h1>
        <p className="subtitle">Never miss a SARS deadline again</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card critical">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <h3>{stats.critical}</h3>
            <p>Critical</p>
          </div>
        </div>

        <div className="stat-card high">
          <div className="stat-icon">🟠</div>
          <div className="stat-content">
            <h3>{stats.high}</h3>
            <p>High Priority</p>
          </div>
        </div>

        <div className="stat-card medium">
          <div className="stat-icon">🟡</div>
          <div className="stat-content">
            <h3>{stats.medium}</h3>
            <p>Medium Priority</p>
          </div>
        </div>

        <div className="stat-card low">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>{stats.low}</h3>
            <p>Low Priority</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="label">Overdue:</span>
          <span className="value danger">{stats.overdue}</span>
        </div>
        <div className="quick-stat">
          <span className="label">Due This Week:</span>
          <span className="value warning">{stats.due_this_week}</span>
        </div>
        <div className="quick-stat">
          <span className="label">Total Active:</span>
          <span className="value">{stats.total_active}</span>
        </div>
      </div>

      {/* Correspondence List */}
      <div className="correspondence-section">
        <div className="section-header">
          <h2>Active Correspondence</h2>
          <button className="btn-primary">+ New Correspondence</button>
        </div>

        <div className="correspondence-list">
          {correspondence.length === 0 ? (
            <div className="empty-state">
              <p>✅ No active SARS correspondence</p>
              <p className="empty-subtitle">You're all caught up!</p>
            </div>
          ) : (
            correspondence.map((item) => (
              <div key={item.id} className={`correspondence-card ${getUrgencyClass(item.urgency_level || 'medium')}`}>
                <div className="card-header">
                  <div>
                    <h3>{item.document_type.replace(/_/g, ' ')}</h3>
                    <p className="client-name">{item.client_name}</p>
                  </div>
                  <span className={`urgency-badge ${getUrgencyClass(item.urgency_level || 'medium')}`}>
                    {item.urgency_level || 'MEDIUM'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Reference:</span>
                    <span className="value">{item.reference_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Deadline:</span>
                    <span className="value">{new Date(item.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Days Remaining:</span>
                    <span className={`value ${item.days_remaining <= 3 ? 'danger' : ''}`}>
                      {item.days_remaining} days
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-secondary">View Details</button>
                  <button className="btn-primary">Create Workflow</button>
                  <button className="btn-outline">Assign</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="features-section">
        <h2>SARS Sentinel Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📥</div>
            <h3>Digital Mailroom</h3>
            <p>Automatic eFiling integration + email parsing</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Co-Pilot</h3>
            <p>Plain-English summaries & workflow suggestions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚠️</div>
            <h3>Smart Alerts</h3>
            <p>Multi-level escalation system</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Audit Shield</h3>
            <p>Continuous monitoring & risk assessment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
