/**
 * Signup Page
 * Multi-step user registration with validation
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/auth.service';
import type { SignupData } from '../services/auth.service';
import './Signup.css';

const COUNTRIES = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
];

const PLANS = [
  { id: 'starter', name: 'Starter', price: 'R499', priceUSD: '$29', users: 3 },
  { id: 'professional', name: 'Professional', price: 'R999', priceUSD: '$59', users: 10 },
  { id: 'enterprise', name: 'Enterprise', price: 'R2499', priceUSD: '$149', users: 'Unlimited' },
];

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    country: 'ZA',
    plan: 'starter',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
  });

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score === 0) feedback = '';
    else if (score <= 2) feedback = 'Weak';
    else if (score === 3) feedback = 'Fair';
    else if (score === 4) feedback = 'Good';
    else feedback = 'Strong';

    return { score, feedback };
  };

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName)) {
      newErrors.firstName = 'Invalid characters in first name';
    }

    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Invalid characters in last name';
    }

    // Company name validation
    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    } else if (formData.companyName.length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setApiError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (step < 3) {
      handleNext();
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup(formData);

      if (response.success) {
        // Redirect to onboarding wizard
        navigate('/onboarding');
      }
    } catch (error: unknown) {
      console.error('Signup error:', error);

      const err = error as { 
        response?: { 
          data?: { 
            message?: string; 
            errors?: Array<{ field: string; message: string }> 
          }; 
          status?: number 
        } 
      };

      if (err.response?.data?.message) {
        setApiError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setApiError('An account with this email already exists');
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const backendErrors: { [key: string]: string } = {};
        err.response.data.errors.forEach((validationErr) => {
          backendErrors[validationErr.field] = validationErr.message;
        });
        setErrors(backendErrors);
        setApiError('Please fix the errors below');
      } else {
        setApiError('Signup failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === formData.country);

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
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
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Start your 14-day free trial. No credit card required.</p>
        </div>

        {/* Progress Steps */}
        <div className="signup-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Account</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Profile</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Plan</div>
          </div>
        </div>

        {apiError && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Step 1: Account Credentials */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Work Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className={`strength-fill strength-${passwordStrength.score}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    {passwordStrength.feedback && (
                      <span className="strength-label">{passwordStrength.feedback}</span>
                    )}
                  </div>
                )}
                {errors.password && <span className="error-message">{errors.password}</span>}
                <span className="form-hint">
                  At least 8 characters with uppercase, lowercase, and number
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <span className="error-message">{errors.confirmPassword}</span>
                )}
              </div>
            </>
          )}

          {/* Step 2: Personal & Company Info */}
          {step === 2 && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="companyName" className="form-label">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className={`form-input ${errors.companyName ? 'input-error' : ''}`}
                  placeholder="Acme Inc."
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="organization"
                />
                {errors.companyName && <span className="error-message">{errors.companyName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="country" className="form-label">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  className={`form-input ${errors.country ? 'input-error' : ''}`}
                  value={formData.country}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && <span className="error-message">{errors.country}</span>}
              </div>
            </>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <>
              <div className="plan-selection">
                {PLANS.map((plan) => (
                  <label key={plan.id} className="plan-card">
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={formData.plan === plan.id}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                    <div className="plan-content">
                      <div className="plan-header">
                        <h3 className="plan-name">{plan.name}</h3>
                        <div className="plan-price">
                          {selectedCountry?.code === 'ZA' ? plan.price : plan.priceUSD}
                          <span>/month</span>
                        </div>
                      </div>
                      <div className="plan-features">
                        <div className="plan-feature">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                          </svg>
                          <span>Up to {plan.users} users</span>
                        </div>
                        <div className="plan-feature">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                          </svg>
                          <span>All core modules</span>
                        </div>
                        <div className="plan-feature">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                          </svg>
                          <span>14-day free trial</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="trial-notice">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Your 14-day free trial starts now. No credit card required. Cancel anytime.
                </span>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="8"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="50"
                      strokeLinecap="round"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 10 10"
                        to="360 10 10"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                  Creating account...
                </>
              ) : step < 3 ? (
                'Continue'
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="link-text link-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
