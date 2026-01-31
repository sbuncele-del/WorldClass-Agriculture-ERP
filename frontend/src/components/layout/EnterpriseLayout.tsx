import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import SecondaryNav from './SecondaryNav';
import type { SecondaryNavSection } from './SecondaryNav';
import './EnterpriseLayout.css';

interface Tab {
  id: string;
  label: string;
  path: string;
}

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

interface EnterpriseLayoutProps {
  moduleTitle: string;
  moduleSubtitle?: string;
  breadcrumbs: { label: string; path?: string }[];
  tabs: Tab[];
  actionButtons?: ActionButton[];
  children: React.ReactNode;
  showFilters?: boolean;
  filterComponent?: React.ReactNode;
  secondaryNav?: SecondaryNavSection[];
}

const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({
  moduleTitle,
  moduleSubtitle,
  breadcrumbs,
  tabs,
  actionButtons = [],
  children,
  showFilters = false,
  filterComponent,
  secondaryNav
}) => {
  const location = useLocation();

  return (
    <div className="enterprise-layout">
      {/* Breadcrumb Navigation */}
      <nav className="el-breadcrumb">
        <Link to="/" className="el-breadcrumb-item">
          <Home size={16} />
        </Link>
        <span className="el-breadcrumb-separator">/</span>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {crumb.path ? (
              <Link to={crumb.path} className="el-breadcrumb-item">
                {crumb.label}
              </Link>
            ) : (
              <span className="el-breadcrumb-item el-breadcrumb-current">
                {crumb.label}
              </span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className="el-breadcrumb-separator">/</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Page Header */}
      <header className="el-header">
        <div className="el-header-left">
          <h1 className="el-header-title">{moduleTitle}</h1>
          {moduleSubtitle && (
            <p className="el-header-subtitle">{moduleSubtitle}</p>
          )}
        </div>
        {actionButtons.length > 0 && (
          <div className="el-header-actions">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                className={`el-action-btn ${button.variant || 'secondary'}`}
                onClick={button.onClick}
              >
                {button.icon}
                <span>{button.label}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* SAP-style Horizontal Tabs */}
      <div className="el-tabs-container">
        <nav className="el-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              className={`el-tab ${
                location.pathname === tab.path ? 'el-tab-active' : ''
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Purple Gradient Content Area */}
      <div className="el-content-wrapper">
        <div className={`el-content ${secondaryNav ? 'el-content-with-sidebar' : ''}`}>
          {showFilters && filterComponent && (
            <div className="el-filters">
              {filterComponent}
            </div>
          )}
          
          {secondaryNav && <SecondaryNav sections={secondaryNav} />}
          
          <div className="el-main">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLayout;
