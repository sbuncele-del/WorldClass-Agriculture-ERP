/**
 * Payment Methods Card Component
 * Displays and manages payment methods
 */

import { useState } from 'react';
import billingService from '../../services/billing.service';
import type { PaymentMethod } from '../../services/billing.service';

interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethod[];
  onReload: () => void;
}

const PaymentMethodsCard = ({ paymentMethods, onReload }: PaymentMethodsCardProps) => {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const getCardBrand = (brand?: string) => {
    if (!brand) return '💳';
    
    const brands: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
    };
    
    return brands[brand.toLowerCase()] || '💳';
  };

  const handleRemove = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setIsRemoving(methodId);
      await billingService.removePaymentMethod(methodId);
      onReload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove payment method');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await billingService.setDefaultPaymentMethod(methodId);
      onReload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to set default payment method');
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="payment-methods-card">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeWidth="2" />
            <line x1="1" y1="10" x2="23" y2="10" strokeWidth="2" />
          </svg>
          <p>No payment methods</p>
          <span>Add a payment method to manage your subscription</span>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Add Payment Method
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-methods-card">
      <div className="payment-methods-list">
        {paymentMethods.map((method) => (
          <div key={method.id} className="payment-method-item">
            <div className="payment-method-icon">
              {getCardBrand(method.brand)}
            </div>
            
            <div className="payment-method-details">
              <div className="payment-method-info">
                <span className="payment-method-type">
                  {method.brand ? method.brand.toUpperCase() : 'Card'} •••• {method.last4}
                </span>
                
                {method.expiryMonth && method.expiryYear && (
                  <span className="payment-method-expiry">
                    Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                  </span>
                )}
                
                {method.isDefault && (
                  <span className="badge badge-success">Default</span>
                )}
              </div>
            </div>

            <div className="payment-method-actions">
              {!method.isDefault && (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="btn-text"
                >
                  Set as Default
                </button>
              )}
              
              <button
                onClick={() => handleRemove(method.id)}
                className="btn-icon btn-danger"
                disabled={isRemoving === method.id}
                title="Remove"
              >
                {isRemoving === method.id ? (
                  <div className="spinner-sm"></div>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add Payment Method
      </button>
    </div>
  );
};

export default PaymentMethodsCard;
