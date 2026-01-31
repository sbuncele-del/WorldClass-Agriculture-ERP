/**
 * Billing Service
 * API integration for subscription and billing management
 */

import apiClient from './api';

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number;
    storage: number; // GB
    transactions: number;
    modules: string[];
  };
}

export interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
}

export interface UsageStats {
  users: {
    current: number;
    limit: number;
    percentage: number;
  };
  storage: {
    current: number; // GB
    limit: number; // GB
    percentage: number;
  };
  transactions: {
    current: number;
    limit: number;
    percentage: number;
  };
  billingCycle: {
    start: string;
    end: string;
    daysRemaining: number;
  };
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  pdfUrl?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // Visa, Mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface BillingPortalSession {
  url: string;
}

// API Methods
class BillingService {
  /**
   * Get current subscription details
   */
  async getCurrentSubscription(): Promise<CurrentSubscription> {
    const response = await apiClient.get('/billing/subscription');
    return response.data;
  }

  /**
   * Get usage statistics for current billing cycle
   */
  async getUsageStats(): Promise<UsageStats> {
    const response = await apiClient.get('/billing/usage');
    return response.data;
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get('/billing/plans');
    return response.data;
  }

  /**
   * Get payment history (invoices)
   */
  async getInvoices(limit: number = 12): Promise<Invoice[]> {
    const response = await apiClient.get('/billing/invoices', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Get single invoice details
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get(`/billing/invoices/${invoiceId}`);
    return response.data;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get('/billing/payment-methods');
    return response.data;
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
    const response = await apiClient.post('/billing/payment-methods', {
      paymentMethodId
    });
    return response.data;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.delete(`/billing/payment-methods/${paymentMethodId}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.patch(`/billing/payment-methods/${paymentMethodId}/default`);
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changeSubscription(planId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/billing/subscription/change', {
      planId
    });
    return response.data;
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/billing/subscription/cancel');
    return response.data;
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/billing/subscription/reactivate');
    return response.data;
  }

  /**
   * Update billing cycle (monthly/yearly)
   */
  async updateBillingCycle(interval: 'monthly' | 'yearly'): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.patch('/billing/subscription/interval', {
      interval
    });
    return response.data;
  }

  /**
   * Create Stripe billing portal session
   */
  async createBillingPortalSession(): Promise<BillingPortalSession> {
    const response = await apiClient.post('/billing/portal-session');
    return response.data;
  }

  /**
   * Retry failed payment
   */
  async retryPayment(invoiceId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/billing/invoices/${invoiceId}/retry`);
    return response.data;
  }

  /**
   * Get upcoming invoice preview
   */
  async getUpcomingInvoice(): Promise<Invoice> {
    const response = await apiClient.get('/billing/upcoming-invoice');
    return response.data;
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(code: string): Promise<{ success: boolean; message: string; discount?: unknown }> {
    const response = await apiClient.post('/billing/promo-code', {
      code
    });
    return response.data;
  }
}

export default new BillingService();
