import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SecondaryNav.css';

export interface SecondaryNavItem {
  id: string;
  label: string;
  path?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface SecondaryNavSection {
  title: string;
  items: SecondaryNavItem[];
}

interface SecondaryNavProps {
  sections: SecondaryNavSection[];
  className?: string;
}

const SecondaryNav: React.FC<SecondaryNavProps> = ({ sections, className = '' }) => {
  const location = useLocation();

  return (
    <div className={`secondary-nav ${className}`}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="secondary-nav-section">
          <div className="secondary-nav-title">{section.title}</div>
          {section.items.map((item) => {
            const isActive = item.path ? location.pathname === item.path : false;
            
            // If onClick is provided, render as button
            if (item.onClick) {
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="secondary-nav-item"
                >
                  {item.icon && <span className="secondary-nav-icon">{item.icon}</span>}
                  <span className="secondary-nav-label">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="secondary-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            }
            
            // Otherwise render as Link
            return (
              <Link
                key={item.id}
                to={item.path || '#'}
                className={`secondary-nav-item ${isActive ? 'secondary-nav-item-active' : ''}`}
              >
                {item.icon && <span className="secondary-nav-icon">{item.icon}</span>}
                <span className="secondary-nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="secondary-nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SecondaryNav;
