/**
 * Metrics Grid Component
 * Reusable 4-column KPI grid with trend indicators and sparklines
 */

import React from 'react';
import './MetricsGrid.css';

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'teal';
  onClick?: () => void;
  subtitle?: string;
  sparkline?: number[]; // Array of values for sparkline
}

interface MetricsGridProps {
  metrics: Metric[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  loading = false,
  columns = 4,
}) => {
  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="metric-sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className={`metrics-grid metrics-grid-${columns}`}>
        {[...Array(4)].map((_, index) => (
          <div key={index} className="metric-card-skeleton">
            <div className="skeleton-header" />
            <div className="skeleton-value" />
            <div className="skeleton-trend" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`metrics-grid metrics-grid-${columns}`}>
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={`metric-card ${metric.color ? `metric-card-${metric.color}` : ''} ${
            metric.onClick ? 'metric-card-clickable' : ''
          }`}
          onClick={metric.onClick}
        >
          <div className="metric-card-header">
            {metric.icon && <span className="metric-icon">{metric.icon}</span>}
            <span className="metric-label">{metric.label}</span>
          </div>

          <div className="metric-card-body">
            <div className="metric-value">{metric.value}</div>
            {metric.subtitle && (
              <div className="metric-subtitle">{metric.subtitle}</div>
            )}
          </div>

          <div className="metric-card-footer">
            {metric.trend && (
              <div
                className={`metric-trend ${
                  metric.trend.isPositive ? 'metric-trend-positive' : 'metric-trend-negative'
                }`}
              >
                <span className="metric-trend-icon">
                  {metric.trend.isPositive ? '↑' : '↓'}
                </span>
                <span className="metric-trend-value">
                  {Math.abs(metric.trend.value)}%
                </span>
                {metric.trend.label && (
                  <span className="metric-trend-label">{metric.trend.label}</span>
                )}
              </div>
            )}
            {metric.sparkline && (
              <div className="metric-sparkline-container">
                {renderSparkline(metric.sparkline)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;
