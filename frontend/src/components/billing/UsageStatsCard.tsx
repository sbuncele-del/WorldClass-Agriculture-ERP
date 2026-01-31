/**
 * Usage Stats Card Component
 * Displays current usage metrics with progress bars
 */

import type { UsageStats } from '../../services/billing.service';

interface UsageStatsCardProps {
  usage: UsageStats | null;
}

const UsageStatsCard = ({ usage }: UsageStatsCardProps) => {
  if (!usage) {
    return (
      <div className="usage-stats-card">
        <div className="empty-state">
          <p>No usage data available</p>
        </div>
      </div>
    );
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'usage-critical';
    if (percentage >= 75) return 'usage-warning';
    return 'usage-normal';
  };

  const formatStorage = (gb: number): string => {
    if (gb < 1) {
      return `${(gb * 1024).toFixed(0)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="usage-stats-card">
      <div className="usage-stats-grid">
        {/* Users */}
        <div className="usage-stat-item">
          <div className="usage-stat-header">
            <div className="usage-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeWidth="2" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="usage-stat-title">Users</h3>
              <p className="usage-stat-value">
                <span className="current">{usage.users.current}</span>
                <span className="separator">/</span>
                <span className="limit">{usage.users.limit}</span>
              </p>
            </div>
          </div>
          
          <div className="usage-progress-bar">
            <div
              className={`usage-progress-fill ${getUsageColor(usage.users.percentage)}`}
              style={{ width: `${Math.min(usage.users.percentage, 100)}%` }}
            ></div>
          </div>
          
          <p className="usage-percentage">{usage.users.percentage.toFixed(0)}% used</p>
          
          {usage.users.percentage >= 90 && (
            <div className="usage-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" />
              </svg>
              <span>Approaching limit</span>
            </div>
          )}
        </div>

        {/* Storage */}
        <div className="usage-stat-item">
          <div className="usage-stat-header">
            <div className="usage-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="usage-stat-title">Storage</h3>
              <p className="usage-stat-value">
                <span className="current">{formatStorage(usage.storage.current)}</span>
                <span className="separator">/</span>
                <span className="limit">{formatStorage(usage.storage.limit)}</span>
              </p>
            </div>
          </div>
          
          <div className="usage-progress-bar">
            <div
              className={`usage-progress-fill ${getUsageColor(usage.storage.percentage)}`}
              style={{ width: `${Math.min(usage.storage.percentage, 100)}%` }}
            ></div>
          </div>
          
          <p className="usage-percentage">{usage.storage.percentage.toFixed(0)}% used</p>
          
          {usage.storage.percentage >= 90 && (
            <div className="usage-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" />
              </svg>
              <span>Approaching limit</span>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="usage-stat-item">
          <div className="usage-stat-header">
            <div className="usage-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="usage-stat-title">Transactions</h3>
              <p className="usage-stat-value">
                <span className="current">{usage.transactions.current.toLocaleString()}</span>
                <span className="separator">/</span>
                <span className="limit">{usage.transactions.limit.toLocaleString()}</span>
              </p>
            </div>
          </div>
          
          <div className="usage-progress-bar">
            <div
              className={`usage-progress-fill ${getUsageColor(usage.transactions.percentage)}`}
              style={{ width: `${Math.min(usage.transactions.percentage, 100)}%` }}
            ></div>
          </div>
          
          <p className="usage-percentage">{usage.transactions.percentage.toFixed(0)}% used</p>
          
          {usage.transactions.percentage >= 90 && (
            <div className="usage-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" />
              </svg>
              <span>Approaching limit</span>
            </div>
          )}
        </div>

        {/* Billing Cycle */}
        <div className="usage-stat-item billing-cycle-item">
          <div className="usage-stat-header">
            <div className="usage-stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="usage-stat-title">Billing Cycle</h3>
              <p className="usage-stat-value">
                <span className="current">{usage.billingCycle.daysRemaining}</span>
                <span className="limit"> days remaining</span>
              </p>
            </div>
          </div>
          
          <div className="billing-cycle-dates">
            <p>
              <strong>Cycle:</strong>{' '}
              {new Date(usage.billingCycle.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {new Date(usage.billingCycle.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="usage-info-box">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p>
          Usage resets at the end of each billing cycle. Upgrade your plan anytime to increase limits.
        </p>
      </div>
    </div>
  );
};

export default UsageStatsCard;
