/**
 * Upgrade Modal Component
 * Confirmation dialog for plan changes
 */

import type { SubscriptionPlan } from '../../services/billing.service';

interface UpgradeModalProps {
  currentPlan?: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  onConfirm: () => void;
  onCancel: () => void;
}

const UpgradeModal = ({ currentPlan, newPlan, onConfirm, onCancel }: UpgradeModalProps) => {
  const isUpgrade = currentPlan && newPlan.price > currentPlan.price;
  const isDowngrade = currentPlan && newPlan.price < currentPlan.price;

  const getPriceDifference = () => {
    if (!currentPlan) return null;
    const diff = Math.abs(newPlan.price - currentPlan.price);
    return diff.toFixed(2);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'} Subscription
          </h2>
          <button onClick={onCancel} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Plan Comparison */}
          <div className="plan-comparison">
            {currentPlan && (
              <div className="comparison-plan">
                <span className="comparison-label">Current Plan</span>
                <h3 className="comparison-plan-name">{currentPlan.name}</h3>
                <div className="comparison-price">
                  <span className="currency">R</span>
                  <span className="amount">{currentPlan.price}</span>
                  <span className="interval">/{currentPlan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
              </div>
            )}

            <div className="comparison-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
                <polyline points="12 5 19 12 12 19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="comparison-plan new-plan">
              <span className="comparison-label">New Plan</span>
              <h3 className="comparison-plan-name">{newPlan.name}</h3>
              <div className="comparison-price">
                <span className="currency">R</span>
                <span className="amount">{newPlan.price}</span>
                <span className="interval">/{newPlan.interval === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
            </div>
          </div>

          {/* Price Difference */}
          {currentPlan && (
            <div className={`price-difference ${isUpgrade ? 'increase' : 'decrease'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {isUpgrade ? (
                  <polyline points="18 15 12 9 6 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              <span>
                {isUpgrade ? '+' : '-'}R{getPriceDifference()} per {newPlan.interval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
          )}

          {/* Features */}
          <div className="plan-features-comparison">
            <h4>What you'll get:</h4>
            <ul className="features-list">
              {newPlan.features.map((feature, index) => (
                <li key={index}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="plan-limits-grid">
              <div className="limit-item">
                <span className="limit-label">Users:</span>
                <span className="limit-value">{newPlan.limits.users}</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Storage:</span>
                <span className="limit-value">{newPlan.limits.storage}GB</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Transactions:</span>
                <span className="limit-value">{newPlan.limits.transactions.toLocaleString()}/mo</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="modal-info-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div>
              {isUpgrade && (
                <p>
                  <strong>Immediate upgrade:</strong> You'll be charged a prorated amount for the remainder of your billing cycle.
                </p>
              )}
              {isDowngrade && (
                <p>
                  <strong>Downgrade at period end:</strong> Your plan will change at the end of your current billing cycle. You'll keep your current features until then.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-primary">
            Confirm {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
