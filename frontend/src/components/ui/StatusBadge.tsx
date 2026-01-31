/**
 * Status Badge Component
 * Consistent status indicators across the application
 */

import React from 'react';
import './StatusBadge.css';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'overdue'
  | 'paid'
  | 'unpaid'
  | 'partial';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  icon?: React.ReactNode;
  pulse?: boolean;
}

const statusColors: Record<string, string> = {
  success: 'green',
  completed: 'green',
  approved: 'green',
  paid: 'green',
  active: 'green',
  
  warning: 'yellow',
  pending: 'yellow',
  partial: 'yellow',
  
  error: 'red',
  cancelled: 'red',
  rejected: 'red',
  overdue: 'red',
  unpaid: 'red',
  inactive: 'red',
  
  info: 'blue',
  draft: 'gray',
};

const statusIcons: Record<string, string> = {
  success: '✓',
  completed: '✓',
  approved: '✓',
  paid: '✓',
  
  warning: '⚠',
  pending: '⏱',
  
  error: '✕',
  cancelled: '✕',
  rejected: '✕',
  
  active: '●',
  inactive: '○',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  variant = 'solid',
  icon,
  pulse = false,
}) => {
  const statusKey = status.toLowerCase();
  const color = statusColors[statusKey] || 'gray';
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  const statusIcon = icon || statusIcons[statusKey];

  return (
    <span
      className={`status-badge status-badge-${color} status-badge-${size} status-badge-${variant} ${
        pulse ? 'status-badge-pulse' : ''
      }`}
    >
      {statusIcon && <span className="status-badge-icon">{statusIcon}</span>}
      <span className="status-badge-label">{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
