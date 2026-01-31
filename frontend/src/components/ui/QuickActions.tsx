import React from 'react';
import { FileText, RefreshCw, BarChart3, Shield } from 'lucide-react';
import './QuickActions.css';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const defaultActions: QuickAction[] = [
    { icon: <FileText size={20} />, label: 'New Journal' },
    { icon: <RefreshCw size={20} />, label: 'Recurring Entries' },
    { icon: <BarChart3 size={20} />, label: 'Financial Reports' },
    { icon: <Shield size={20} />, label: 'Compliance Check' },
  ];

  const displayActions = actions || defaultActions;

  return (
    <div className="quick-actions">
      {displayActions.map((action, index) => (
        <button 
          key={index} 
          className="quick-action"
          onClick={action.onClick}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
