import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiFetch } from '../utils/api';

interface FeatureFlagState {
  flags: Record<string, boolean>;
  upgradePaths: Record<string, string>;
  tenantPlan?: string;
  featureCount: number;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  isEnabled: (flag: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagState | undefined>(undefined);

const DEFAULT_STATE: FeatureFlagState = {
  flags: {},
  upgradePaths: {},
  featureCount: 0,
  isLoading: false, // Start with false since we may not load at all
  refresh: async () => undefined,
  isEnabled: () => false,
};

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FeatureFlagState>(DEFAULT_STATE);

  const loadFlags = useCallback(async () => {
    // Only load if user is authenticated (has a token)
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      // Not authenticated, skip loading feature flags
      setState((prev) => ({
        ...prev,
        isLoading: false,
        refresh: loadFlags,
        isEnabled: () => false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const response = await apiFetch('/api/logistics/enterprise/feature-gates');
      setState({
        flags: response.flags || {},
        upgradePaths: response.upgradePaths || {},
        tenantPlan: response.tenantPlan,
        featureCount: response.featureCount || 0,
        isLoading: false,
        refresh: loadFlags,
        isEnabled: (flag: string) => Boolean(response.flags?.[flag]),
      });
    } catch (error: any) {
      console.error('Failed to load feature gates', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Failed to load feature gates',
        refresh: loadFlags,
        isEnabled: (flag: string) => Boolean(prev.flags?.[flag]),
      }));
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  return (
    <FeatureFlagContext.Provider value={state}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagState => {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return ctx;
};
