import React from 'react';
import { Card, Typography, Row, Col, Statistic, Progress, Divider, Tag } from 'antd';

const { Text } = Typography;

// ============================================
// STAT CARD - Individual metric card
// ============================================

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode | string;
  suffix?: string;
  valueStyle?: React.CSSProperties;
  footer?: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}

/**
 * StatCard - Individual statistic card with optional footer
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  valueStyle,
  footer,
  trend,
  trendValue
}) => {
  return (
    <Card className="hub-stat-card">
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={valueStyle}
      />
      {footer && (
        <div className="stat-card-footer">
          {footer}
        </div>
      )}
      {trend && trendValue && (
        <div className="stat-card-trend">
          <Tag color={trend === 'up' ? 'green' : 'red'}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </Tag>
        </div>
      )}
    </Card>
  );
};


// ============================================
// PROGRESS CARD - Card with progress bar
// ============================================

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  label?: string;
  color?: string;
  footer?: React.ReactNode;
}

/**
 * ProgressCard - Card showing progress towards a goal
 */
export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  label,
  color = '#667eea',
  footer
}) => {
  const percent = Math.round((current / total) * 100);
  
  return (
    <Card className="hub-progress-card">
      <div className="progress-header">
        <Text strong>{title}</Text>
        <Text type="secondary">{label || `${current} / ${total}`}</Text>
      </div>
      <Progress 
        percent={percent} 
        strokeColor={color}
        showInfo={true}
      />
      {footer && (
        <div className="progress-card-footer">
          {footer}
        </div>
      )}
    </Card>
  );
};


// ============================================
// INFO LIST CARD - Card with list of items
// ============================================

export interface InfoListItem {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface InfoListCardProps {
  title: string;
  items: InfoListItem[];
  extra?: React.ReactNode;
}

/**
 * InfoListCard - Card with a list of label-value pairs
 */
export const InfoListCard: React.FC<InfoListCardProps> = ({
  title,
  items,
  extra
}) => {
  return (
    <Card title={title} extra={extra} className="hub-info-list-card">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <div className="info-list-item">
            <div className="info-list-label">
              {item.icon && <span className="info-list-icon">{item.icon}</span>}
              <Text type="secondary">{item.label}</Text>
            </div>
            <div className="info-list-value">
              {item.value}
            </div>
          </div>
          {index < items.length - 1 && <Divider style={{ margin: '12px 0' }} />}
        </React.Fragment>
      ))}
    </Card>
  );
};


// ============================================
// QUICK ACTIONS CARD - Card with action buttons
// ============================================

export interface QuickAction {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface QuickActionsCardProps {
  title: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
}

/**
 * QuickActionsCard - Card with grid of action buttons
 */
export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title,
  actions,
  columns = 2
}) => {
  return (
    <Card title={title} className="hub-quick-actions-card">
      <div 
        className="quick-actions-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};


// ============================================
// STATUS INDICATOR - Connection/sync status
// ============================================

interface StatusIndicatorProps {
  items: {
    label: string;
    sublabel?: string;
    status: 'connected' | 'pending' | 'error' | 'disconnected';
  }[];
}

/**
 * StatusIndicator - Shows connection/integration status
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ items }) => {
  const statusConfig = {
    connected: { color: '#10b981', icon: '✓', bg: '#f0fdf4', border: '#bbf7d0' },
    pending: { color: '#f59e0b', icon: '⟳', bg: '#fffbeb', border: '#fde68a' },
    error: { color: '#ef4444', icon: '✕', bg: '#fef2f2', border: '#fecaca' },
    disconnected: { color: '#64748b', icon: '○', bg: '#f8fafc', border: '#e2e8f0' },
  };

  return (
    <div className="status-indicator-list">
      {items.map((item, index) => {
        const config = statusConfig[item.status];
        return (
          <div 
            key={index}
            className="status-indicator-item"
            style={{ 
              background: config.bg, 
              borderColor: config.border 
            }}
          >
            <span 
              className="status-indicator-icon" 
              style={{ color: config.color }}
            >
              {config.icon}
            </span>
            <div className="status-indicator-text">
              <Text strong>{item.label}</Text>
              {item.sublabel && (
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  {item.sublabel}
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
