import React, { useState } from 'react';
import './Healthcare.css';

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'How do I create a new sales order?', a: 'Navigate to Sales > New Order, fill in customer details and items, then save.', category: 'Sales' },
    { q: 'How do I generate financial reports?', a: 'Go to Finance > Reports, select report type, date range, and click Generate.', category: 'Finance' },
    { q: 'How do I add a new user?', a: 'Go to Administration > User Management > Add User, fill in details and assign roles.', category: 'Admin' },
    { q: 'How do I track inventory levels?', a: 'Navigate to Inventory > Stock Levels to view real-time inventory across all warehouses.', category: 'Inventory' },
  ];

  return (
    <div className="healthcare-page">
      <div className="page-header">
        <div className="header-content">
          <h1>❓ Help Center</h1>
          <p>Documentation, FAQs, tutorials, and support resources</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">📧 Contact Support</button>
          <button className="btn-secondary">📖 Documentation</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📚</div>
          <div className="metric-details">
            <div className="metric-value">150+</div>
            <div className="metric-label">Help Articles</div>
            <div className="metric-change positive">Updated weekly</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>🎥</div>
          <div className="metric-details">
            <div className="metric-value">45</div>
            <div className="metric-label">Video Tutorials</div>
            <div className="metric-change positive">Step-by-step guides</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>💬</div>
          <div className="metric-details">
            <div className="metric-value">24/7</div>
            <div className="metric-label">Support Available</div>
            <div className="metric-change positive">Live chat & email</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>⚡</div>
          <div className="metric-details">
            <div className="metric-value">&lt; 2hrs</div>
            <div className="metric-label">Avg Response Time</div>
            <div className="metric-change positive">Priority support</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tab-content" style={{ padding: '2rem' }}>
          <div className="search-section" style={{ marginBottom: '2rem' }}>
            <input 
              type="text" 
              placeholder="Search help articles, FAQs, and documentation..." 
              className="search-input"
              style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <h2 style={{ marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ 
                background: 'white', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#1e293b' }}>{faq.q}</h3>
                  <span className="status-badge" style={{ background: '#667eea' }}>{faq.category}</span>
                </div>
                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
