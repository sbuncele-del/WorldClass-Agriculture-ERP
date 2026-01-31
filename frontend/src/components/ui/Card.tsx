import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'medium',
  hover = false
}) => {
  return (
    <div className={`card card-padding-${padding} ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, action }) => {
  return (
    <div className="card-header">
      <div className="card-header-content">{children}</div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h3 className="card-title">{children}</h3>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`card-content ${className}`}>{children}</div>;
};
