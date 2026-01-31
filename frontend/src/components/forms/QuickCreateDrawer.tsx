import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import './QuickCreateDrawer.css';

interface QuickCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}

const QuickCreateDrawer: React.FC<QuickCreateDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '500px'
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />
      
      {/* Drawer */}
      <div className="quick-create-drawer" style={{ width }}>
        <div className="drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="drawer-subtitle">{subtitle}</p>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="drawer-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default QuickCreateDrawer;
