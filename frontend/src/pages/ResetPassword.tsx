/**
 * Reset Password Page
 * Set new password with reset token
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../services/api.service';
import './ResetPassword.css';

interface PasswordStrength {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  errors: string[];
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      setMessage({ type: 'error', text: 'Invalid reset link. No token provided.' });
      setIsVerifying(false);
      setTokenValid(false);
      return;
    }

    setToken(tokenParam);

    try {
      const data = await apiPost<{
        success: boolean;
        data?: { message?: string };
      }>('/api/v2/auth/password/verify-token', { token: tokenParam });

      if (data.success) {
        if (data.data?.message) {
          setMessage({ type: 'success', text: data.data.message });
        }
        setTokenValid(true);
      } else {
        setMessage({ type: 'error', text: 'Invalid reset token' });
        setTokenValid(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      const errorText = error instanceof Error ? error.message : 'Failed to verify reset token';
      setMessage({ type: 'error', text: errorText });
      setTokenValid(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePasswordStrength = async (pwd: string) => {
    if (pwd.length < 8) {
      setPasswordStrength({
        strength: 'weak',
        errors: ['Password must be at least 8 characters'],
      });
      return;
    }

    try {
      const data = await apiPost<{
        success: boolean;
        data?: { strength: PasswordStrength['strength']; errors: string[] };
      }>('/api/v2/auth/password/validate', { password: pwd });

      if (data.success && data.data) {
        setPasswordStrength({
          strength: data.data.strength,
          errors: data.data.errors || [],
        });
      }
    } catch (error) {
      console.error('Password validation error:', error);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (newPassword.length >= 3) {
      validatePasswordStrength(newPassword);
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const data = await apiPost<{
        success: boolean;
        data?: { message?: string };
      }>('/api/v2/auth/password/reset', {
        token,
        password,
        confirmPassword,
      });

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.data?.message || 'Password reset successfully! Redirecting to login...',
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login?reset=success');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to reset password',
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const errorText = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (!passwordStrength) return '';
    
    switch (passwordStrength.strength) {
      case 'weak': return 'strength-weak';
      case 'fair': return 'strength-fair';
      case 'good': return 'strength-good';
      case 'strong': return 'strength-strong';
      default: return '';
    }
  };

  if (isVerifying) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-logo">
            <div className="logo-icon">🔒</div>
            <h1>SiyaBusa ERP</h1>
          </div>
          <div className="reset-password-card">
            <div className="verifying-state">
              <div className="spinner-large"></div>
              <p>Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-logo">
            <div className="logo-icon">❌</div>
            <h1>SiyaBusa ERP</h1>
          </div>
          <div className="reset-password-card">
            <h2>Invalid Reset Link</h2>
            {message && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}
            <div className="error-reasons">
              <p><strong>This could happen if:</strong></p>
              <ul>
                <li>The reset link has expired (1 hour)</li>
                <li>The link has already been used</li>
                <li>The link is invalid or incomplete</li>
              </ul>
            </div>
            <button onClick={() => navigate('/forgot-password')} className="btn-primary">
              Request New Reset Link
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        {/* Logo */}
        <div className="reset-password-logo">
          <div className="logo-icon">🔐</div>
          <h1>SiyaBusa ERP</h1>
        </div>

        {/* Card */}
        <div className="reset-password-card">
          <h2>Set New Password</h2>
          <p className="card-description">
            Enter your new password below. Make sure it's strong and secure.
          </p>

          {/* Message Alert */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? '✓' : '✗'} {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div className={`strength-fill ${getStrengthColor()}`}></div>
                  </div>
                  <p className={`strength-text ${getStrengthColor()}`}>
                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </p>
                </div>
              )}
              
              {/* Password Errors */}
              {passwordStrength && passwordStrength.errors.length > 0 && (
                <div className="password-errors">
                  {passwordStrength.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isLoading}
                required
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="password-mismatch">Passwords do not match</p>
              )}
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm"></span>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Password Tips */}
          <div className="password-tips">
            <h3>Password Requirements:</h3>
            <ul>
              <li>At least 8 characters (12+ recommended)</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid common words or patterns</li>
            </ul>
          </div>

          {/* Back to Login */}
          <div className="back-link">
            <button onClick={() => navigate('/login')} className="btn-text">
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
