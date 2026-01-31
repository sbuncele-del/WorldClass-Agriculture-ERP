import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  onClick
}) => {
  return (
    <div
      className={`glass-card glass-card-${padding} ${
        hoverable ? 'glass-card-hoverable' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
