/**
 * Currency Selector Component
 * Multi-currency display switcher with live conversion
 */

import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, Check } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import type { CurrencyCode } from '../../types/multi-tenant.types';
import './CurrencySelector.css';

const CurrencySelector: React.FC = () => {
  const { displayCurrency, availableCurrencies, setDisplayCurrency, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencySelect = (currency: CurrencyCode) => {
    setDisplayCurrency(currency);
    setIsOpen(false);
  };

  return (
    <div className="currency-selector" ref={dropdownRef}>
      <button
        className={`currency-selector-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className="currency-selector-icon">
          <DollarSign size={18} />
        </div>
        <div className="currency-selector-info">
          <div className="currency-selector-label">Display Currency</div>
          <div className="currency-selector-code">{displayCurrency}</div>
        </div>
      </button>

      {isOpen && (
        <div className="currency-selector-dropdown">
          <div className="currency-selector-header">
            <h3>Select Currency</h3>
            <p>Choose display currency for amounts</p>
          </div>
          
          <div className="currency-selector-list">
            {availableCurrencies.map(currency => (
              <button
                key={currency.code}
                className={`currency-selector-item ${currency.code === displayCurrency ? 'active' : ''}`}
                onClick={() => handleCurrencySelect(currency.code)}
              >
                <div className="currency-item-symbol">
                  {currency.symbol}
                </div>
                <div className="currency-item-info">
                  <div className="currency-item-code">{currency.code}</div>
                  <div className="currency-item-name">{currency.name}</div>
                </div>
                {currency.code === displayCurrency && (
                  <Check size={18} className="currency-item-check" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
