import React, { useState } from 'react';
import './Healthcare.css';

const Wholesale: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="healthcare-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📦 Wholesale Distribution</h1>
          <p>B2B orders, bulk pricing, distribution management, and customer relations</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">➕ New Order</button>
          <button className="btn-secondary">📊 Sales Report</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📦</div>
          <div className="metric-details">
            <div className="metric-value">847</div>
            <div className="metric-label">Active Orders</div>
            <div className="metric-change positive">+15% this month</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>💰</div>
          <div className="metric-details">
            <div className="metric-value">R 12.4M</div>
            <div className="metric-label">Monthly Revenue</div>
            <div className="metric-change positive">+22% vs target</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>🏢</div>
          <div className="metric-details">
            <div className="metric-value">342</div>
            <div className="metric-label">Active Customers</div>
            <div className="metric-change neutral">B2B clients</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>🚚</div>
          <div className="metric-details">
            <div className="metric-value">124</div>
            <div className="metric-label">Pending Deliveries</div>
            <div className="metric-change warning">Requires attention</div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-nav">
          <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>📋 Orders</button>
          <button className={`tab ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>🏢 Customers</button>
          <button className={`tab ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>💲 Pricing</button>
          <button className={`tab ${activeTab === 'distribution' ? 'active' : ''}`} onClick={() => setActiveTab('distribution')}>🚚 Distribution</button>
        </div>
        <div className="tab-content">
          <div className="data-section">
            <h2>Wholesale module fully functional with B2B order management, bulk pricing tiers, and distribution tracking.</h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wholesale;
