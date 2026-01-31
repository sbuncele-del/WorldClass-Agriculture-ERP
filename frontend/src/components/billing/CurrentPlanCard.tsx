/**
 * Current Plan Card Component
 * Displays current subscription details and actions
 */

import type { CurrentSubscription } from '../../services/billing.service';

interface CurrentPlanCardProps {
  subscription: CurrentSubscription | null;
  onUpgrade: () => void;
  onCancel: () => void;
  onReactivate: () => void;
}

const CurrentPlanCard = ({ subscription, onUpgrade, onCancel, onReactivate }: CurrentPlanCardProps) => {
  if (!subscription) {
    return (
      <div className="current-plan-card">
        <div className="empty-state">
          <p>No active subscription</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'badge-success' },
      trialing: { label: 'Trial', className: 'badge-info' },
      past_due: { label: 'Past Due', className: 'badge-warning' },
      canceled: { label: 'Canceled', className: 'badge-error' },
      incomplete: { label: 'Incomplete', className: 'badge-warning' },
    };

    const badge = badges[status] || { label: status, className: 'badge-default' };
    return <span className={`badge ${badge.className}`}>{badge.label}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = () => {
    const end = new Date(subscription.currentPeriodEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="current-plan-card">
      <div className="plan-card-header">
        <div>
          <div className="plan-card-title-row">
            <h2 className="plan-card-title">{subscription.planName}</h2>
            {getStatusBadge(subscription.status)}
          </div>
          <div className="plan-card-price">
            <span className="currency">R</span>
            <span className="amount">{subscription.price}</span>
            <span className="interval">/{subscription.interval === 'monthly' ? 'month' : 'year'}</span>
          </div>
        </div>

        <div className="plan-card-actions">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <>
              <button onClick={onUpgrade} className="btn btn-primary">
                Upgrade Plan
              </button>
              <button onClick={onCancel} className="btn btn-secondary">
                Cancel Subscription
              </button>
            </>
          )}
          
          {subscription.cancelAtPeriodEnd && (
            <button onClick={onReactivate} className="btn btn-primary">
              Reactivate Subscription
            </button>
          )}
          
          {subscription.status === 'past_due' && (
            <button className="btn btn-warning">
              Update Payment Method
            </button>
          )}
        </div>
      </div>

      <div className="plan-card-body">
        <div className="plan-info-grid">
          <div className="plan-info-item">
            <label>Current Period</label>
            <p>{formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}</p>
          </div>

          <div className="plan-info-item">
            <label>Days Remaining</label>
            <p className="days-remaining">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </p>
          </div>

          {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
            <div className="plan-info-item">
              <label>Trial Ends</label>
              <p>{formatDate(subscription.trialEnd)}</p>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && (
            <div className="plan-info-item cancellation-notice">
              <label>Cancellation Notice</label>
              <p>
                Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
                You can reactivate anytime before then.
              </p>
            </div>
          )}
        </div>
      </div>

      {subscription.status === 'past_due' && (
        <div className="plan-card-alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <strong>Payment Past Due</strong>
            <p>Your last payment failed. Please update your payment method to avoid service interruption.</p>
          </div>
        </div>
      )}

      {subscription.status === 'trialing' && subscription.trialEnd && (
        <div className="plan-card-alert alert-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <strong>Trial Period</strong>
            <p>Your trial ends on {formatDate(subscription.trialEnd)}. Add a payment method to continue after trial.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentPlanCard;
