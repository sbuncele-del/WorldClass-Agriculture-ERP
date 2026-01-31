/**
 * Resend Verification Email Page
 * Allows users to request a new verification email
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResendVerification.css';

const ResendVerification: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/email/verify/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: 'Verification email sent! Please check your inbox.',
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to send verification email',
        });
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="resend-verification-page">
      <div className="resend-verification-container">
        {/* Logo */}
        <div className="resend-verification-logo">
          <div className="logo-icon">📬</div>
          <h1>SiyaBusa ERP</h1>
        </div>

        {/* Card */}
        <div className="resend-verification-card">
          <h2>Resend Verification Email</h2>
          <p className="card-description">
            Enter your email address and we'll send you a new verification link.
          </p>

          {/* Message Alert */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? '✓' : '✗'} {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="info-box">
            <p><strong>📧 Check your spam folder</strong></p>
            <p>
              If you don't see the email in your inbox, please check your spam 
              or junk folder. Add our email to your contacts to ensure future 
              emails arrive in your inbox.
            </p>
          </div>

          {/* Rate Limit Notice */}
          <div className="rate-limit-notice">
            <p>
              ⏱️ You can request up to 3 verification emails per hour.
            </p>
          </div>

          {/* Back to Login */}
          <div className="back-link">
            <button onClick={() => navigate('/login')} className="btn-text">
              ← Back to Login
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="resend-verification-help">
          <p>Still having trouble?</p>
          <div className="help-links">
            <a href="/help">Help Center</a>
            <span>•</span>
            <a href="/contact">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification;
