/**
 * Onboarding Service
 * Handles tenant setup and configuration
 */

import apiClient from './api';

export interface OnboardingData {
  // Step 1: Company Details
  industry?: string;
  businessType?: string;
  companySize?: string;
  website?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Step 2: Financial Settings
  financialYearStart?: string; // MM-DD format
  baseCurrency?: string;
  timezone?: string;
  taxNumber?: string;
  registrationNumber?: string;

  // Step 3: Modules
  enabledModules?: string[];

  // Step 4: Team Members
  teamMembers?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
}

export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
  data: OnboardingData;
}

class OnboardingService {
  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await apiClient.get<OnboardingStatus>('/api/onboarding/status');
    return response.data;
  }

  /**
   * Update onboarding data
   */
  async updateOnboarding(step: number, data: Partial<OnboardingData>): Promise<OnboardingStatus> {
    const response = await apiClient.patch<OnboardingStatus>('/api/onboarding', {
      step,
      data,
    });
    return response.data;
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/onboarding/complete'
    );
    return response.data;
  }

  /**
   * Skip onboarding (use defaults)
   */
  async skipOnboarding(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/onboarding/skip'
    );
    return response.data;
  }

  /**
   * Get industry options
   */
  getIndustryOptions(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'retail', label: 'Retail & E-commerce', icon: '🛒' },
      { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
      { value: 'services', label: 'Professional Services', icon: '💼' },
      { value: 'hospitality', label: 'Hospitality & Tourism', icon: '🏨' },
      { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
      { value: 'construction', label: 'Construction', icon: '🏗️' },
      { value: 'technology', label: 'Technology & Software', icon: '💻' },
      { value: 'education', label: 'Education', icon: '🎓' },
      { value: 'nonprofit', label: 'Non-Profit', icon: '❤️' },
      { value: 'other', label: 'Other', icon: '📊' },
    ];
  }

  /**
   * Get business type options
   */
  getBusinessTypeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'sole_proprietor', label: 'Sole Proprietor' },
      { value: 'partnership', label: 'Partnership' },
      { value: 'llc', label: 'LLC / Close Corporation' },
      { value: 'corporation', label: 'Corporation / Pty Ltd' },
      { value: 'nonprofit', label: 'Non-Profit Organization' },
    ];
  }

  /**
   * Get company size options
   */
  getCompanySizeOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '1-10', label: '1-10 employees' },
      { value: '11-50', label: '11-50 employees' },
      { value: '51-200', label: '51-200 employees' },
      { value: '201-500', label: '201-500 employees' },
      { value: '500+', label: '500+ employees' },
    ];
  }

  /**
   * Get module options
   */
  getModuleOptions(): Array<{ id: string; name: string; description: string; icon: string; recommended: boolean }> {
    return [
      {
        id: 'financial',
        name: 'Financial Management',
        description: 'Chart of accounts, journal entries, financial reports',
        icon: '💵',
        recommended: true,
      },
      {
        id: 'sales',
        name: 'Sales & CRM',
        description: 'Customers, quotes, invoices, sales orders',
        icon: '💰',
        recommended: true,
      },
      {
        id: 'purchase',
        name: 'Purchase Management',
        description: 'Suppliers, purchase orders, bills, payments',
        icon: '🛒',
        recommended: true,
      },
      {
        id: 'inventory',
        name: 'Inventory Management',
        description: 'Products, stock levels, warehouses, transfers',
        icon: '📦',
        recommended: true,
      },
      {
        id: 'hr',
        name: 'HR & Payroll',
        description: 'Employees, attendance, payroll, leave management',
        icon: '👥',
        recommended: false,
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'Bill of materials, work orders, production planning',
        icon: '🏭',
        recommended: false,
      },
      {
        id: 'assets',
        name: 'Asset Management',
        description: 'Fixed assets, depreciation, maintenance',
        icon: '🏢',
        recommended: false,
      },
    ];
  }

  /**
   * Get timezone options
   */
  getTimezoneOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'London (GMT)' },
      { value: 'Europe/Paris', label: 'Central European (CET)' },
      { value: 'Asia/Dubai', label: 'Dubai (GST)' },
      { value: 'Asia/Kolkata', label: 'India (IST)' },
      { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
      { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    ];
  }

  /**
   * Get role options for team members
   */
  getRoleOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'admin', label: 'Administrator' },
      { value: 'accountant', label: 'Accountant' },
      { value: 'sales', label: 'Sales Manager' },
      { value: 'purchase', label: 'Purchase Manager' },
      { value: 'warehouse', label: 'Warehouse Manager' },
      { value: 'viewer', label: 'Viewer (Read-only)' },
    ];
  }
}

export default new OnboardingService();
