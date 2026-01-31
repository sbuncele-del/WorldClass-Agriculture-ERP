/**
 * Company Details Step
 * Step 1 of onboarding wizard
 */

import { useState, useEffect } from 'react';
import onboardingService from '../../services/onboarding.service';
import type { OnboardingData } from '../../services/onboarding.service';

interface CompanyDetailsStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const CompanyDetailsStep = ({ data, onUpdate }: CompanyDetailsStepProps) => {
  const industries = onboardingService.getIndustryOptions();
  const businessTypes = onboardingService.getBusinessTypeOptions();
  const companySizes = onboardingService.getCompanySizeOptions();

  const [formData, setFormData] = useState({
    industry: data.industry || '',
    businessType: data.businessType || '',
    companySize: data.companySize || '',
    website: data.website || '',
    phone: data.phone || '',
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="onboarding-step-content">
      <div className="onboarding-header">
        <h1 className="onboarding-title">Tell us about your business</h1>
        <p className="onboarding-subtitle">
          This helps us customize your experience and recommend the right features
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="industry" className="form-label">
          Industry <span className="required">*</span>
        </label>
        <select
          id="industry"
          name="industry"
          className="form-input"
          value={formData.industry}
          onChange={handleChange}
          required
        >
          <option value="">Select your industry</option>
          {industries.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.icon} {industry.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="businessType" className="form-label">
            Business Type <span className="required">*</span>
          </label>
          <select
            id="businessType"
            name="businessType"
            className="form-input"
            value={formData.businessType}
            onChange={handleChange}
            required
          >
            <option value="">Select type</option>
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="companySize" className="form-label">
            Company Size <span className="required">*</span>
          </label>
          <select
            id="companySize"
            name="companySize"
            className="form-input"
            value={formData.companySize}
            onChange={handleChange}
            required
          >
            <option value="">Select size</option>
            {companySizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="website" className="form-label">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            className="form-input"
            placeholder="https://example.com"
            value={formData.website}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="form-input"
            placeholder="+27 11 123 4567"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="onboarding-help">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>This information helps us tailor your dashboard and suggest relevant features</span>
      </div>
    </div>
  );
};

export default CompanyDetailsStep;
