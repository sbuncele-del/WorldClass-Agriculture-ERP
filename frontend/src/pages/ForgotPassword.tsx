/**
 * Forgot Password Page
 * Request password reset link
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../services/api.service';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await apiPost('/api/v2/auth/password/reset-request', { email });
      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="url(#gradient)" />
                <circle cx="24" cy="24" r="10" stroke="white" strokeWidth="2" fill="none" />
                <path d="M24 18v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="alert" style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>If an account exists with this email, you will receive a password reset link shortly.</span>
          </div>

          <div className="auth-footer">
            <p>
              Didn't receive the email?{' '}
              <button
                type="button"
                className="link-text link-bold"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Try again
              </button>
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/login" className="link-text link-bold">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#gradient)" />
              <path d="M24 14L34 22V34H14V22L24 14Z" stroke="white" strokeWidth="2" fill="none" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${error ? 'input-error' : ''}`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="50" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="link-text link-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
