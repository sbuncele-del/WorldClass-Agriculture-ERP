/**
 * Financial Settings Step
 * Step 2 of onboarding wizard
 */

import { useState, useEffect } from 'react';
import onboardingService from '../../services/onboarding.service';
import type { OnboardingData } from '../../services/onboarding.service';

interface FinancialSettingsStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const FinancialSettingsStep = ({ data, onUpdate }: FinancialSettingsStepProps) => {
  const timezones = onboardingService.getTimezoneOptions();
  
  const currencies = [
    { value: 'ZAR', label: 'South African Rand (ZAR)', symbol: 'R' },
    { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
    { value: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' },
  ];

  const months = [
    { value: '01-01', label: 'January' },
    { value: '02-01', label: 'February' },
    { value: '03-01', label: 'March' },
    { value: '04-01', label: 'April' },
    { value: '05-01', label: 'May' },
    { value: '06-01', label: 'June' },
    { value: '07-01', label: 'July' },
    { value: '08-01', label: 'August' },
    { value: '09-01', label: 'September' },
    { value: '10-01', label: 'October' },
    { value: '11-01', label: 'November' },
    { value: '12-01', label: 'December' },
  ];

  const [formData, setFormData] = useState({
    financialYearStart: data.financialYearStart || '01-01',
    baseCurrency: data.baseCurrency || 'ZAR',
    timezone: data.timezone || 'Africa/Johannesburg',
    taxNumber: data.taxNumber || '',
    registrationNumber: data.registrationNumber || '',
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
        <h1 className="onboarding-title">Configure your financial settings</h1>
        <p className="onboarding-subtitle">
          Set up your fiscal year, currency, and business registration details
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="financialYearStart" className="form-label">
          Financial Year Start <span className="required">*</span>
        </label>
        <select
          id="financialYearStart"
          name="financialYearStart"
          className="form-input"
          value={formData.financialYearStart}
          onChange={handleChange}
          required
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
        <span className="form-hint">
          When does your financial year begin? (e.g., January for calendar year)
        </span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="baseCurrency" className="form-label">
            Base Currency <span className="required">*</span>
          </label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            className="form-input"
            value={formData.baseCurrency}
            onChange={handleChange}
            required
          >
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="timezone" className="form-label">
            Timezone <span className="required">*</span>
          </label>
          <select
            id="timezone"
            name="timezone"
            className="form-input"
            value={formData.timezone}
            onChange={handleChange}
            required
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="taxNumber" className="form-label">
            VAT/Tax Number
          </label>
          <input
            type="text"
            id="taxNumber"
            name="taxNumber"
            className="form-input"
            placeholder="e.g., 4123456789"
            value={formData.taxNumber}
            onChange={handleChange}
          />
          <span className="form-hint">VAT number for South Africa, Tax ID for other countries</span>
        </div>

        <div className="form-group">
          <label htmlFor="registrationNumber" className="form-label">
            Company Registration Number
          </label>
          <input
            type="text"
            id="registrationNumber"
            name="registrationNumber"
            className="form-input"
            placeholder="e.g., 2021/123456/07"
            value={formData.registrationNumber}
            onChange={handleChange}
          />
          <span className="form-hint">Business registration or incorporation number</span>
        </div>
      </div>

      <div className="onboarding-info-box">
        <div className="info-box-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <strong>Why do we need this?</strong>
        </div>
        <ul className="info-box-list">
          <li>Financial year settings affect your reporting periods and tax calculations</li>
          <li>Currency is used for all transactions and financial statements</li>
          <li>Tax numbers appear on invoices and are required for compliance</li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialSettingsStep;
