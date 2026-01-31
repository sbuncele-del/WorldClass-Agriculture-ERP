import React, { useState } from 'react';
import './AuditReady.css';

const AuditReady: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-11');
  const [generating, setGenerating] = useState(false);

  const auditDocuments = [
    { id: 1, name: 'Financial Statements', status: 'ready', lastUpdated: '2025-11-10', size: '2.3 MB' },
    { id: 2, name: 'Trial Balance', status: 'ready', lastUpdated: '2025-11-10', size: '856 KB' },
    { id: 3, name: 'General Ledger', status: 'ready', lastUpdated: '2025-11-10', size: '4.7 MB' },
    { id: 4, name: 'Bank Reconciliation', status: 'ready', lastUpdated: '2025-11-09', size: '1.2 MB' },
    { id: 5, name: 'VAT Returns', status: 'ready', lastUpdated: '2025-11-08', size: '654 KB' },
    { id: 6, name: 'Invoice Register', status: 'ready', lastUpdated: '2025-11-10', size: '3.1 MB' },
    { id: 7, name: 'Payment Vouchers', status: 'ready', lastUpdated: '2025-11-10', size: '2.8 MB' },
    { id: 8, name: 'Asset Register', status: 'ready', lastUpdated: '2025-11-05', size: '1.5 MB' },
    { id: 9, name: 'Audit Trail Logs', status: 'ready', lastUpdated: '2025-11-10', size: '5.2 MB' },
    { id: 10, name: 'Supporting Documents', status: 'ready', lastUpdated: '2025-11-10', size: '12.4 MB' }
  ];

  const auditChecklist = [
    { category: 'Financial Records', items: [
      { name: 'Balance Sheet', completed: true },
      { name: 'Income Statement', completed: true },
      { name: 'Cash Flow Statement', completed: true },
      { name: 'Notes to Financial Statements', completed: true }
    ]},
    { category: 'Supporting Documentation', items: [
      { name: 'Bank Statements', completed: true },
      { name: 'Invoices & Receipts', completed: true },
      { name: 'Purchase Orders', completed: true },
      { name: 'Contracts & Agreements', completed: true }
    ]},
    { category: 'Compliance', items: [
      { name: 'VAT Returns Filed', completed: true },
      { name: 'PAYE Submissions', completed: true },
      { name: 'CIPC Annual Returns', completed: false },
      { name: 'B-BBEE Certificate', completed: true }
    ]},
    { category: 'Internal Controls', items: [
      { name: 'Access Control Logs', completed: true },
      { name: 'Approval Workflows', completed: true },
      { name: 'Segregation of Duties', completed: true },
      { name: 'Change Management Records', completed: true }
    ]}
  ];

  const handleGenerateAuditPack = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      alert('Audit Pack generated successfully! Download will begin shortly.');
    }, 2000);
  };

  const totalItems = auditChecklist.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = auditChecklist.reduce((sum, cat) => 
    sum + cat.items.filter(item => item.completed).length, 0
  );
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="audit-ready">
      <div className="audit-header">
        <div>
          <h1>🔍 Audit-Ready Suite</h1>
          <p>One-click audit pack generation with complete documentation</p>
        </div>
        <div className="audit-period-selector">
          <label>Period:</label>
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="2025-11">November 2025</option>
            <option value="2025-10">October 2025</option>
            <option value="2025-09">September 2025</option>
            <option value="2025-q3">Q3 2025</option>
            <option value="2025-h1">H1 2025</option>
            <option value="2025">FY 2025</option>
          </select>
        </div>
      </div>

      {/* Audit Readiness Score - Clean & Simple */}
      <div className="audit-score-card">
        <div className="score-header">
          <div className="score-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-text">AUDIT READINESS</span>
          </div>
          <div className="score-percentage-large">{completionPercentage}%</div>
          <p className="score-description">
            Your organization is <strong>{completionPercentage}% ready</strong> for external audit.
            {completionPercentage === 100 
              ? ' All compliance requirements met.' 
              : ` ${totalItems - completedItems} items require attention.`}
          </p>
        </div>

        <div className="score-stats-grid">
          <div className="stat-card-simple">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{completedItems}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card-simple">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{totalItems - completedItems}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card-simple">
            <div className="stat-icon">📁</div>
            <div className="stat-value">{auditDocuments.length}</div>
            <div className="stat-label">Documents</div>
          </div>
          <div className="stat-card-simple">
            <div className="stat-icon">📊</div>
            <div className="stat-value">34.2 MB</div>
            <div className="stat-label">Total Size</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="audit-actions">
        <button 
          className="btn-primary btn-generate-pack"
          onClick={handleGenerateAuditPack}
          disabled={generating}
        >
          {generating ? '📦 Generating...' : '📦 Generate Complete Audit Pack'}
        </button>
        <button className="btn-secondary">📧 Email to Auditor</button>
        <button className="btn-secondary">📊 Preview Reports</button>
        <button className="btn-secondary">🔒 Create Secure Link</button>
      </div>

      <div className="audit-content">
        {/* Audit Checklist */}
        <div className="audit-section">
          <div className="section-header">
            <h2>📋 Audit Checklist</h2>
            <span className="completion-badge">{completedItems}/{totalItems} Complete</span>
          </div>
          
          <div className="checklist-grid">
            {auditChecklist.map((category, idx) => (
              <div key={idx} className="checklist-category">
                <h3>{category.category}</h3>
                <div className="checklist-items">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className={`checklist-item ${item.completed ? 'completed' : 'pending'}`}>
                      <span className="check-icon">{item.completed ? '✅' : '⏳'}</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents Library */}
        <div className="audit-section">
          <div className="section-header">
            <h2>📁 Documents Library</h2>
            <div className="section-actions">
              <button className="btn-icon">🔍</button>
              <button className="btn-icon">⬇️</button>
            </div>
          </div>

          <div className="documents-grid">
            {auditDocuments.map(doc => (
              <div key={doc.id} className="document-card">
                <div className="doc-icon">📄</div>
                <div className="doc-details">
                  <h4>{doc.name}</h4>
                  <div className="doc-meta">
                    <span className="doc-size">{doc.size}</span>
                    <span className="doc-date">{doc.lastUpdated}</span>
                  </div>
                </div>
                <div className="doc-actions">
                  <button className="btn-icon" title="Download">⬇️</button>
                  <button className="btn-icon" title="Preview">👁️</button>
                  <button className="btn-icon" title="Share">🔗</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="audit-section">
          <div className="section-header">
            <h2>🔒 Recent Audit Trail</h2>
            <button className="btn-secondary-sm">View All</button>
          </div>

          <div className="audit-trail">
            <div className="trail-item">
              <span className="trail-icon">📝</span>
              <div className="trail-details">
                <div className="trail-action">Invoice INV-2025-1145 created</div>
                <div className="trail-meta">
                  <span className="trail-user">John Doe</span>
                  <span className="trail-time">2 hours ago</span>
                </div>
              </div>
            </div>
            <div className="trail-item">
              <span className="trail-icon">✅</span>
              <div className="trail-details">
                <div className="trail-action">Purchase Order PO-2025-890 approved</div>
                <div className="trail-meta">
                  <span className="trail-user">Jane Smith</span>
                  <span className="trail-time">5 hours ago</span>
                </div>
              </div>
            </div>
            <div className="trail-item">
              <span className="trail-icon">💰</span>
              <div className="trail-details">
                <div className="trail-action">Payment of R 45,000 recorded</div>
                <div className="trail-meta">
                  <span className="trail-user">Mike Johnson</span>
                  <span className="trail-time">Yesterday</span>
                </div>
              </div>
            </div>
            <div className="trail-item">
              <span className="trail-icon">📊</span>
              <div className="trail-details">
                <div className="trail-action">Financial reports generated</div>
                <div className="trail-meta">
                  <span className="trail-user">System</span>
                  <span className="trail-time">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditReady;
