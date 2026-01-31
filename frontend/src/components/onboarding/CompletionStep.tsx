/**
 * Completion Step
 * Step 5 of onboarding wizard - Success message and quick tour
 */

const CompletionStep = () => {
  return (
    <div className="onboarding-step-content completion-step">
      <div className="completion-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" fill="#10b981" opacity="0.1" />
          <circle cx="40" cy="40" r="32" fill="#10b981" opacity="0.2" />
          <circle cx="40" cy="40" r="24" fill="#10b981" />
          <path
            d="M28 40l8 8 16-16"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <div className="onboarding-header">
        <h1 className="onboarding-title">You're all set! 🎉</h1>
        <p className="onboarding-subtitle">
          Your workspace is ready. Let's take a quick tour of what you can do.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">💵</div>
          <h3 className="feature-title">Financial Management</h3>
          <p className="feature-description">
            Track income and expenses with a complete chart of accounts already set up for you
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3 className="feature-title">Sales & Invoicing</h3>
          <p className="feature-description">
            Create professional invoices, track payments, and manage your customers
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3 className="feature-title">Inventory Control</h3>
          <p className="feature-description">
            Monitor stock levels, track products, and get low-stock alerts
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">Real-time Reports</h3>
          <p className="feature-description">
            View profit & loss, balance sheet, and cash flow reports anytime
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3 className="feature-title">Team Collaboration</h3>
          <p className="feature-description">
            Invite team members and set role-based permissions
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3 className="feature-title">Secure & Compliant</h3>
          <p className="feature-description">
            Bank-level security with automatic backups and audit trails
          </p>
        </div>
      </div>

      <div className="quick-links">
        <h3 className="quick-links-title">Quick Links</h3>
        <div className="quick-links-grid">
          <a href="/financial" className="quick-link">
            <span className="quick-link-icon">📚</span>
            <span>View Chart of Accounts</span>
          </a>
          <a href="/sales" className="quick-link">
            <span className="quick-link-icon">📄</span>
            <span>Create Your First Invoice</span>
          </a>
          <a href="/inventory" className="quick-link">
            <span className="quick-link-icon">➕</span>
            <span>Add Products</span>
          </a>
          <a href="/settings" className="quick-link">
            <span className="quick-link-icon">⚙️</span>
            <span>Configure Settings</span>
          </a>
        </div>
      </div>

      <div className="help-section">
        <div className="help-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <div>
            <strong>Need Help?</strong>
            <p>Check out our help center or contact support anytime</p>
          </div>
        </div>
      </div>

      <div className="onboarding-help">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Click "Go to Dashboard" below to start using your ERP system!
        </span>
      </div>
    </div>
  );
};

export default CompletionStep;
