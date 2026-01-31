/**
 * Email Verification Page
 * Handles email verification token validation
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './VerifyEmail.css';

interface VerificationResult {
  success: boolean;
  message: string;
  userId?: string;
  tenantId?: string;
}

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    try {
      const response = await fetch('/api/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Email verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  const handleResendEmail = () => {
    navigate('/resend-verification');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {/* Logo */}
        <div className="verify-email-logo">
          <div className="logo-icon">📧</div>
          <h1>SiyaBusa ERP</h1>
        </div>

        {/* Status Card */}
        <div className={`verify-email-card status-${status}`}>
          {/* Icon */}
          <div className="status-icon">
            {status === 'verifying' && (
              <div className="spinner-large"></div>
            )}
            {status === 'success' && (
              <div className="success-icon">✓</div>
            )}
            {status === 'error' && (
              <div className="error-icon">✗</div>
            )}
          </div>

          {/* Title */}
          <h2>
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          {/* Message */}
          <p className="status-message">{message}</p>

          {/* Success Actions */}
          {status === 'success' && (
            <div className="status-actions">
              <div className="success-info">
                <p>✅ Your email has been successfully verified</p>
                <p>🚀 You now have full access to all features</p>
                <p className="redirect-notice">
                  Redirecting to login in 3 seconds...
                </p>
              </div>
              <button onClick={handleGoToLogin} className="btn-primary">
                Go to Login Now
              </button>
            </div>
          )}

          {/* Error Actions */}
          {status === 'error' && (
            <div className="status-actions">
              <div className="error-reasons">
                <p><strong>This could happen if:</strong></p>
                <ul>
                  <li>The verification link has expired (24 hours)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or incomplete</li>
                </ul>
              </div>
              <div className="error-buttons">
                <button onClick={handleResendEmail} className="btn-primary">
                  Resend Verification Email
                </button>
                <button onClick={handleGoToLogin} className="btn-secondary">
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="verify-email-help">
          <p>Need help?</p>
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

export default VerifyEmail;
