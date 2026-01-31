import React from 'react';
import './hub.css';

interface HubLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * HubLayout - Main container for all AetherOS Hub pages
 * 
 * Usage:
 * ```tsx
 * <HubLayout>
 *   <HubHeader ... />
 *   <StatusBanner ... />
 *   <HubTabs ... />
 * </HubLayout>
 * ```
 */
export const HubLayout: React.FC<HubLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`aetheros-hub ${className}`}>
      {children}
    </div>
  );
};

export default HubLayout;
