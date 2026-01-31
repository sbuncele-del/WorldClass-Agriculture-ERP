import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false }) => {
  const location = useLocation();
  const [adminExpanded, setAdminExpanded] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className={`sidebar-v2 ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        {/* Home & My Workspace */}
        <div className="sidebar-section">
          <Link to="/" className={`sidebar-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
            <span className="sidebar-icon">🏠</span>
            <span className="sidebar-label">Home</span>
          </Link>
          <Link to="/my-workspace" className={`sidebar-item ${isActive('/my-workspace') ? 'active' : ''}`}>
            <span className="sidebar-icon">📌</span>
            <span className="sidebar-label">My Workspace</span>
          </Link>
        </div>

        {/* Operations */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">OPERATIONS</div>
          <Link to="/projects" className={`sidebar-item ${isActive('/projects') ? 'active' : ''}`}>
            <span className="sidebar-icon">📋</span>
            <span className="sidebar-label">Project Management</span>
          </Link>
          <Link to="/communication" className={`sidebar-item ${isActive('/communication') ? 'active' : ''}`}>
            <span className="sidebar-icon">💬</span>
            <span className="sidebar-label">Communication</span>
          </Link>
          <Link to="/calendar" className={`sidebar-item ${isActive('/calendar') ? 'active' : ''}`}>
            <span className="sidebar-icon">📅</span>
            <span className="sidebar-label">Calendar & Reminders</span>
          </Link>
          <Link to="/sales" className={`sidebar-item ${isActive('/sales') ? 'active' : ''}`}>
            <span className="sidebar-icon">💰</span>
            <span className="sidebar-label">Sales & CRM</span>
          </Link>
          <Link to="/proposals" className={`sidebar-item ${isActive('/proposals') ? 'active' : ''}`}>
            <span className="sidebar-icon">📝</span>
            <span className="sidebar-label">Proposal Builder</span>
          </Link>
          <Link to="/purchase" className={`sidebar-item ${isActive('/purchase') ? 'active' : ''}`}>
            <span className="sidebar-icon">🛒</span>
            <span className="sidebar-label">Purchase Management</span>
          </Link>
          <Link to="/inventory" className={`sidebar-item ${isActive('/inventory') ? 'active' : ''}`}>
            <span className="sidebar-icon">📦</span>
            <span className="sidebar-label">Inventory Management</span>
          </Link>
          <Link to="/hr" className={`sidebar-item ${isActive('/hr') ? 'active' : ''}`}>
            <span className="sidebar-icon">👥</span>
            <span className="sidebar-label">HR & Payroll</span>
          </Link>
          <Link to="/assets" className={`sidebar-item ${isActive('/assets') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏢</span>
            <span className="sidebar-label">Asset Management</span>
          </Link>
        </div>

        {/* Industry Solutions */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">INDUSTRY SOLUTIONS</div>
          <Link to="/logistics" className={`sidebar-item ${isActive('/logistics') ? 'active' : ''}`}>
            <span className="sidebar-icon">🚚</span>
            <span className="sidebar-label">Logistics & Transport</span>
          </Link>
          <Link to="/practice" className={`sidebar-item ${isActive('/practice') ? 'active' : ''}`}>
            <span className="sidebar-icon">⚖️</span>
            <span className="sidebar-label">Practice Management</span>
          </Link>
          <Link to="/healthcare" className={`sidebar-item ${isActive('/healthcare') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏥</span>
            <span className="sidebar-label">Healthcare Management</span>
          </Link>
          <Link to="/construction" className={`sidebar-item ${isActive('/construction') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏗️</span>
            <span className="sidebar-label">Construction & Projects</span>
          </Link>
          <Link to="/agriculture" className={`sidebar-item ${isActive('/agriculture') ? 'active' : ''}`}>
            <span className="sidebar-icon">🌾</span>
            <span className="sidebar-label">Agriculture & Farming</span>
          </Link>
          <Link to="/mining" className={`sidebar-item ${isActive('/mining') ? 'active' : ''}`}>
            <span className="sidebar-icon">⛏️</span>
            <span className="sidebar-label">Mining</span>
          </Link>
          <Link to="/wholesale" className={`sidebar-item ${isActive('/wholesale') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏬</span>
            <span className="sidebar-label">Wholesale & Retail</span>
          </Link>
          <Link to="/professional-services" className={`sidebar-item ${isActive('/professional-services') ? 'active' : ''}`}>
            <span className="sidebar-icon">💼</span>
            <span className="sidebar-label">Professional Services</span>
          </Link>
        </div>

        {/* Finance & Accounting */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">FINANCE & ACCOUNTING</div>
          <Link to="/financial" className={`sidebar-item ${isActive('/financial') ? 'active' : ''}`}>
            <span className="sidebar-icon">📊</span>
            <span className="sidebar-label">Financial Accounting</span>
          </Link>
          <Link to="/cash-management" className={`sidebar-item ${isActive('/cash-management') ? 'active' : ''}`}>
            <span className="sidebar-icon">💰</span>
            <span className="sidebar-label">Cash Management</span>
          </Link>
          <Link to="/treasury" className={`sidebar-item ${isActive('/treasury') ? 'active' : ''}`}>
            <span className="sidebar-icon">🏦</span>
            <span className="sidebar-label">Treasury Management</span>
          </Link>
          <Link to="/reports" className={`sidebar-item ${isActive('/reports') ? 'active' : ''}`}>
            <span className="sidebar-icon">📈</span>
            <span className="sidebar-label">Reports & Analytics</span>
          </Link>
        </div>

        {/* Compliance & Governance */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">COMPLIANCE & GOVERNANCE</div>
          <Link to="/sars-sentinel" className={`sidebar-item ${isActive('/sars-sentinel') ? 'active' : ''}`}>
            <span className="sidebar-icon">🇿🇦</span>
            <span className="sidebar-label">SARS Integration</span>
          </Link>
          <Link to="/audit-ready" className={`sidebar-item ${isActive('/audit-ready') ? 'active' : ''}`}>
            <span className="sidebar-icon">📋</span>
            <span className="sidebar-label">Audit-Ready Suite</span>
          </Link>
          <Link to="/regulatory" className={`sidebar-item ${isActive('/regulatory') ? 'active' : ''}`}>
            <span className="sidebar-icon">📑</span>
            <span className="sidebar-label">Regulatory Reporting</span>
          </Link>
        </div>

        {/* Administration */}
        <div className="sidebar-section">
          <div 
            className="sidebar-section-title clickable" 
            onClick={() => setAdminExpanded(!adminExpanded)}
          >
            ADMINISTRATION {adminExpanded ? '▼' : '▶'}
          </div>
          {adminExpanded && (
            <>
              <Link to="/admin" className={`sidebar-item ${isActive('/admin') ? 'active' : ''}`}>
                <span className="sidebar-icon">⚙️</span>
                <span className="sidebar-label">Admin Hub</span>
              </Link>
              <Link to="/tenant-settings" className={`sidebar-item ${isActive('/tenant-settings') ? 'active' : ''}`}>
                <span className="sidebar-icon">🏢</span>
                <span className="sidebar-label">Company Setup</span>
              </Link>
              <Link to="/user-management" className={`sidebar-item ${isActive('/user-management') ? 'active' : ''}`}>
                <span className="sidebar-icon">👥</span>
                <span className="sidebar-label">User Management</span>
              </Link>
              <Link to="/billing" className={`sidebar-item ${isActive('/billing') ? 'active' : ''}`}>
                <span className="sidebar-icon">💵</span>
                <span className="sidebar-label">Billing & Subscription</span>
              </Link>
              <Link to="/design-system" className={`sidebar-item ${isActive('/design-system') ? 'active' : ''}`}>
                <span className="sidebar-icon">🎨</span>
                <span className="sidebar-label">Design System</span>
              </Link>
              <Link to="/system-settings" className={`sidebar-item ${isActive('/system-settings') ? 'active' : ''}`}>
                <span className="sidebar-icon">⚙️</span>
                <span className="sidebar-label">System Settings</span>
              </Link>
              <Link to="/audit-logs" className={`sidebar-item ${isActive('/audit-logs') ? 'active' : ''}`}>
                <span className="sidebar-icon">📊</span>
                <span className="sidebar-label">Audit Logs</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
