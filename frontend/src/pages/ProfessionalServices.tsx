import React, { useState } from 'react';
import './Healthcare.css';

const ProfessionalServices: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="healthcare-page">
      <div className="page-header">
        <div className="header-content">
          <h1>💼 Professional Services</h1>
          <p>Time tracking, project billing, resource allocation, and client management</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">➕ New Project</button>
          <button className="btn-secondary">⏱️ Log Time</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📁</div>
          <div className="metric-details">
            <div className="metric-value">28</div>
            <div className="metric-label">Active Projects</div>
            <div className="metric-change positive">85% billable</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>⏱️</div>
          <div className="metric-details">
            <div className="metric-value">1,240</div>
            <div className="metric-label">Billable Hours</div>
            <div className="metric-change positive">This month</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>💰</div>
          <div className="metric-details">
            <div className="metric-value">R 2.8M</div>
            <div className="metric-label">Revenue MTD</div>
            <div className="metric-change positive">+18% vs last month</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>👥</div>
          <div className="metric-details">
            <div className="metric-value">45</div>
            <div className="metric-label">Consultants</div>
            <div className="metric-change neutral">89% utilization</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>📁 Projects</button>
          <button className={`tab ${activeTab === 'timesheet' ? 'active' : ''}`} onClick={() => setActiveTab('timesheet')}>⏱️ Timesheets</button>
          <button className={`tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>💰 Billing</button>
          <button className={`tab ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>👥 Resources</button>
        </div>
        <div className="tab-content">
          <div className="data-section">
            <h2>Professional services module with complete time tracking, project-based billing, and resource allocation.</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalServices;
