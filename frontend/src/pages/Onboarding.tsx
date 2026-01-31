/**
 * Onboarding Wizard
 * Multi-step setup for new tenants
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import onboardingService from '../services/onboarding.service';
import type { OnboardingData } from '../services/onboarding.service';
import './Onboarding.css';

// Step components
import CompanyDetailsStep from '../components/onboarding/CompanyDetailsStep';
import FinancialSettingsStep from '../components/onboarding/FinancialSettingsStep';
import ModuleSelectionStep from '../components/onboarding/ModuleSelectionStep';
import TeamMembersStep from '../components/onboarding/TeamMembersStep';
import CompletionStep from '../components/onboarding/CompletionStep';

const STEPS = [
  { id: 1, title: 'Company Details', description: 'Tell us about your business' },
  { id: 2, title: 'Financial Settings', description: 'Configure your financial year and preferences' },
  { id: 3, title: 'Select Modules', description: 'Choose the features you need' },
  { id: 4, title: 'Invite Team', description: 'Add your team members' },
  { id: 5, title: 'Get Started', description: 'You\'re all set!' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    enabledModules: ['financial', 'sales', 'purchase', 'inventory'], // Default modules
    teamMembers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load existing onboarding data
  useEffect(() => {
    const loadOnboardingStatus = async () => {
      setIsLoading(true);
      try {
        const status = await onboardingService.getOnboardingStatus();
        if (status.completed) {
          // Already completed, redirect to dashboard
          navigate('/app/dashboard');
          return;
        }
        if (status.data) {
          setFormData(status.data);
        }
        if (status.currentStep) {
          setCurrentStep(status.currentStep);
        }
      } catch (err) {
        console.error('Error loading onboarding status:', err);
        // Continue with default values
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingStatus();
  }, [navigate]);

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleNext = async () => {
    setError('');

    // Save current step data
    setIsSaving(true);
    try {
      await onboardingService.updateOnboarding(currentStep, formData);
      
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      setError('Failed to save your progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (window.confirm('Are you sure you want to skip onboarding? You can always configure these settings later.')) {
      setIsLoading(true);
      try {
        await onboardingService.skipOnboarding();
        navigate('/app/dashboard');
      } catch (err) {
        console.error('Error skipping onboarding:', err);
        setError('Failed to skip onboarding. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await onboardingService.completeOnboarding();
      // Navigate to dashboard
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (currentStep === STEPS.length) {
      await handleComplete();
    } else {
      await handleNext();
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (isLoading && currentStep === 1) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-loading">
          <svg className="spinner" width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="125" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-sidebar">
        <div className="onboarding-logo">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="url(#gradient)" />
            <path d="M24 14L34 22V34H14V22L24 14Z" stroke="white" strokeWidth="2" fill="none" />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
          <span className="onboarding-logo-text">SiyaBusa ERP</span>
        </div>

        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="onboarding-steps">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`onboarding-step ${
                currentStep === step.id
                  ? 'active'
                  : currentStep > step.id
                  ? 'completed'
                  : 'pending'
              }`}
            >
              <div className="onboarding-step-number">
                {currentStep > step.id ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="onboarding-step-content">
                <div className="onboarding-step-title">{step.title}</div>
                <div className="onboarding-step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="onboarding-skip-btn"
          onClick={handleSkip}
          disabled={isLoading || isSaving}
        >
          Skip for now
        </button>
      </div>

      <div className="onboarding-main">
        <div className="onboarding-card">
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="onboarding-form" onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <CompanyDetailsStep
                data={formData}
                onUpdate={updateFormData}
              />
            )}

            {currentStep === 2 && (
              <FinancialSettingsStep
                data={formData}
                onUpdate={updateFormData}
              />
            )}

            {currentStep === 3 && (
              <ModuleSelectionStep
                data={formData}
                onUpdate={updateFormData}
              />
            )}

            {currentStep === 4 && (
              <TeamMembersStep
                data={formData}
                onUpdate={updateFormData}
              />
            )}

            {currentStep === 5 && (
              <CompletionStep />
            )}

            <div className="onboarding-actions">
              {currentStep > 1 && currentStep < STEPS.length && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                  disabled={isLoading || isSaving}
                >
                  Back
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="50" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                    Saving...
                  </>
                ) : currentStep === STEPS.length ? (
                  'Go to Dashboard'
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
