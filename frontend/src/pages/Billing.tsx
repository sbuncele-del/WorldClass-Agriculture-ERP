/**
 * Billing Dashboard
 * Subscription management, usage stats, payment history
 */

import { useState, useEffect } from 'react';
import billingService from '../services/billing.service';
import type {
  CurrentSubscription,
  UsageStats,
  Invoice,
  SubscriptionPlan,
  PaymentMethod
} from '../services/billing.service';
import './Billing.css';

// Components
import CurrentPlanCard from '../components/billing/CurrentPlanCard';
import UsageStatsCard from '../components/billing/UsageStatsCard';
import PaymentHistoryTable from '../components/billing/PaymentHistoryTable';
import UpgradeModal from '../components/billing/UpgradeModal';
import PaymentMethodsCard from '../components/billing/PaymentMethodsCard';

const Billing = () => {
  // State
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Load billing data
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [subData, usageData, invoicesData, plansData, paymentMethodsData] = await Promise.all([
        billingService.getCurrentSubscription(),
        billingService.getUsageStats(),
        billingService.getInvoices(12),
        billingService.getPlans(),
        billingService.getPaymentMethods(),
      ]);

      setSubscription(subData);
      setUsage(usageData);
      setInvoices(invoicesData);
      setPlans(plansData);
      setPaymentMethods(paymentMethodsData);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError((err as Error).message || 'Failed to load billing information');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle upgrade/downgrade
  const handlePlanChange = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;

    try {
      const result = await billingService.changeSubscription(selectedPlan.id);
      
      if (result.success) {
        alert(result.message);
        setShowUpgradeModal(false);
        loadBillingData(); // Reload data
      }
    } catch (err) {
      alert((err as Error).message || 'Failed to change subscription');
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      const result = await billingService.cancelSubscription();
      alert(result.message);
      loadBillingData();
    } catch (err) {
      alert((err as Error).message || 'Failed to cancel subscription');
    }
  };

  // Handle reactivate subscription
  const handleReactivateSubscription = async () => {
    try {
      const result = await billingService.reactivateSubscription();
      alert(result.message);
      loadBillingData();
    } catch (err) {
      alert((err as Error).message || 'Failed to reactivate subscription');
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await billingService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Failed to download invoice');
    }
  };

  // Handle billing portal (Stripe)
  const handleOpenBillingPortal = async () => {
    try {
      const session = await billingService.createBillingPortalSession();
      window.location.href = session.url;
    } catch {
      alert('Failed to open billing portal');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="billing-page">
        <div className="billing-loading">
          <div className="spinner"></div>
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="billing-page">
        <div className="billing-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h2>Failed to Load Billing</h2>
          <p>{error}</p>
          <button onClick={loadBillingData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div>
          <h1 className="billing-title">Billing & Subscription</h1>
          <p className="billing-subtitle">
            Manage your subscription, view usage, and download invoices
          </p>
        </div>
        
        <button onClick={handleOpenBillingPortal} className="btn btn-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth="2" />
            <path d="M12 1v6m0 6v6m8.66-11.66l-5.2 3m-2.92 1.68l-5.2 3M23 12h-6m-6 0H5m13.66 8.66l-5.2-3m-2.92-1.68l-5.2-3" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Manage Billing
        </button>
      </div>

      {/* Current Plan Section */}
      <div className="billing-section">
        <CurrentPlanCard
          subscription={subscription}
          onUpgrade={() => handlePlanChange(plans.find(p => p.name === 'Professional')!)}
          onCancel={handleCancelSubscription}
          onReactivate={handleReactivateSubscription}
        />
      </div>

      {/* Usage Stats Section */}
      <div className="billing-section">
        <h2 className="section-title">Usage Statistics</h2>
        <UsageStatsCard usage={usage} />
      </div>

      {/* Available Plans Section */}
      {subscription && (subscription.status === 'active' || subscription.status === 'trialing') && (
        <div className="billing-section">
          <h2 className="section-title">Available Plans</h2>
          <div className="plans-grid">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`plan-card ${subscription.planId === plan.id ? 'current-plan' : ''}`}
              >
                {subscription.planId === plan.id && (
                  <div className="current-plan-badge">Current Plan</div>
                )}
                
                <h3 className="plan-name">{plan.name}</h3>
                
                <div className="plan-price">
                  <span className="currency">R</span>
                  <span className="amount">{plan.price}</span>
                  <span className="interval">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="plan-limits">
                  <p><strong>{plan.limits.users}</strong> users</p>
                  <p><strong>{plan.limits.storage}GB</strong> storage</p>
                  <p><strong>{plan.limits.transactions.toLocaleString()}</strong> transactions/month</p>
                </div>

                {subscription.planId !== plan.id && (
                  <button
                    onClick={() => handlePlanChange(plan)}
                    className="btn btn-primary btn-block"
                  >
                    {plan.price > (plans.find(p => p.id === subscription.planId)?.price || 0)
                      ? 'Upgrade'
                      : 'Downgrade'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Methods Section */}
      <div className="billing-section">
        <h2 className="section-title">Payment Methods</h2>
        <PaymentMethodsCard
          paymentMethods={paymentMethods}
          onReload={loadBillingData}
        />
      </div>

      {/* Payment History Section */}
      <div className="billing-section">
        <h2 className="section-title">Payment History</h2>
        <PaymentHistoryTable
          invoices={invoices}
          onDownload={handleDownloadInvoice}
        />
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal
          currentPlan={plans.find(p => p.id === subscription?.planId)}
          newPlan={selectedPlan}
          onConfirm={handleConfirmPlanChange}
          onCancel={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export default Billing;
