import React, { useState } from 'react';
import './Healthcare.css';

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="healthcare-page">
      <div className="page-header">
        <div className="header-content">
          <h1>⚙️ System Settings</h1>
          <p>Configure company information, preferences, integrations, and security</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">💾 Save Changes</button>
          <button className="btn-secondary">🔄 Reset Defaults</button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>🏢 Company Info</button>
          <button className={`tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>🎨 Preferences</button>
          <button className={`tab ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>🔌 Integrations</button>
          <button className={`tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>🔒 Security</button>
        </div>

        <div className="tab-content">
          <div className="data-section">
            <h2 style={{ marginBottom: '1.5rem' }}>Company Information</h2>
            <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Company Name</label>
                <input type="text" defaultValue="SiyaBusa ERP Solutions" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Registration Number</label>
                <input type="text" defaultValue="2023/123456/07" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Tax Number (VAT)</label>
                <input type="text" defaultValue="4123456789" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Address</label>
                <textarea rows={3} defaultValue="123 Business Park, Sandton, Johannesburg, 2196" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Phone</label>
                  <input type="text" defaultValue="+27 11 123 4567" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>Email</label>
                  <input type="email" defaultValue="info@siyabusa.co.za" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid #e2e8f0' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
