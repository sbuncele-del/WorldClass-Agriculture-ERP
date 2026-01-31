import React from 'react';
import type { LucideIcon } from 'lucide-react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  subtitle
}) => {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <h3 className="stat-card-value">{value}</h3>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
          {trend && (
            <div className={`stat-card-trend ${trend.isPositive ? 'trend-positive' : 'trend-negative'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className={`stat-card-icon stat-icon-${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};
