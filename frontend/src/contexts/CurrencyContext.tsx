/**
 * Currency Context - Multi-Currency Support
 * Manages currency selection, conversion, and formatting
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../services/api.service';
import type {
  CurrencyCode,
  Currency,
  ExchangeRate,
  CurrencyContextState,
} from '../types/multi-tenant.types';

const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, displayFormat: 'R #,##0.00' },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, displayFormat: '$#,##0.00' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, displayFormat: '€#,##0.00' },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, displayFormat: '£#,##0.00' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, displayFormat: '¥#,##0' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, displayFormat: '¥#,##0.00' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, displayFormat: 'A$#,##0.00' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, displayFormat: 'C$#,##0.00' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, displayFormat: 'CHF #,##0.00' },
];

// Mock exchange rates (in production, fetch from API)
const MOCK_EXCHANGE_RATES: ExchangeRate[] = [
  { id: '1', fromCurrency: 'ZAR', toCurrency: 'USD', rate: 0.054, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '2', fromCurrency: 'ZAR', toCurrency: 'EUR', rate: 0.049, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '3', fromCurrency: 'ZAR', toCurrency: 'GBP', rate: 0.042, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '4', fromCurrency: 'USD', toCurrency: 'ZAR', rate: 18.52, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '5', fromCurrency: 'EUR', toCurrency: 'ZAR', rate: 20.41, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '6', fromCurrency: 'GBP', toCurrency: 'ZAR', rate: 23.81, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '7', fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.91, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '8', fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.10, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '9', fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.27, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
  { id: '10', fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, effectiveDate: '2025-11-09', source: 'AUTO', createdAt: '2025-11-09T08:00:00Z' },
];

const CurrencyContext = createContext<CurrencyContextState | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: CurrencyCode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
  defaultCurrency = 'ZAR',
}) => {
  const [baseCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [displayCurrency, setDisplayCurrencyState] = useState<CurrencyCode>(defaultCurrency);
  const [availableCurrencies] = useState<Currency[]>(SUPPORTED_CURRENCIES);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(MOCK_EXCHANGE_RATES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('displayCurrency') as CurrencyCode;
    if (savedCurrency && SUPPORTED_CURRENCIES.find(c => c.code === savedCurrency)) {
      setDisplayCurrencyState(savedCurrency);
    }
  }, []);

  const setDisplayCurrency = (currency: CurrencyCode) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem('displayCurrency', currency);
  };

  const getExchangeRate = (from: CurrencyCode, to: CurrencyCode): number => {
    if (from === to) return 1;

    // Direct rate
    const directRate = exchangeRates.find(
      rate => rate.fromCurrency === from && rate.toCurrency === to
    );
    if (directRate) return directRate.rate;

    // Inverse rate
    const inverseRate = exchangeRates.find(
      rate => rate.fromCurrency === to && rate.toCurrency === from
    );
    if (inverseRate) return 1 / inverseRate.rate;

    // Cross rate via ZAR
    if (from !== 'ZAR' && to !== 'ZAR') {
      const fromToZAR = getExchangeRate(from, 'ZAR');
      const zarToTo = getExchangeRate('ZAR', to);
      return fromToZAR * zarToTo;
    }

    console.warn(`No exchange rate found for ${from} to ${to}, using 1`);
    return 1;
  };

  const convertAmount = (amount: number, from: CurrencyCode, to: CurrencyCode): number => {
    const rate = getExchangeRate(from, to);
    return amount * rate;
  };

  const formatCurrency = (amount: number, currency?: CurrencyCode): string => {
    const currencyToFormat = currency || displayCurrency;
    const currencyInfo = availableCurrencies.find(c => c.code === currencyToFormat);
    
    if (!currencyInfo) {
      return amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const formattedNumber = amount.toLocaleString('en-ZA', {
      minimumFractionDigits: currencyInfo.decimalPlaces,
      maximumFractionDigits: currencyInfo.decimalPlaces,
    });

    return `${currencyInfo.symbol} ${formattedNumber}`;
  };

  const refreshRates = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
            const response = await fetch(`${API_BASE_URL}/api/currency/exchange-rates`);
      
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(data);
      } else {
        // Keep using mock rates on API failure
        console.warn('Failed to fetch exchange rates, using cached rates');
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError('Failed to refresh exchange rates');
      // Keep using mock rates
    } finally {
      setIsLoading(false);
    }
  };

  const value: CurrencyContextState = {
    baseCurrency,
    displayCurrency,
    availableCurrencies,
    exchangeRates,
    isLoading,
    error,
    setDisplayCurrency,
    convertAmount,
    formatCurrency,
    refreshRates,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextState => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
