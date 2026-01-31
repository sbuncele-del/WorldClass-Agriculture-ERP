/**
 * useWorkspaceData Hook
 * Fetches workspace summary data from the backend API
 * Used by all Hub components to get real-time data
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

export interface WorkspaceData<T = any> {
  loading: boolean;
  error: string | null;
  data: T | null;
  summary: any;
  refetch: () => Promise<void>;
}

export function useWorkspaceData<T = any>(
  module: string,
  options: { autoFetch?: boolean; pollingInterval?: number } = {}
): WorkspaceData<T> {
  const { autoFetch = true, pollingInterval } = options;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`/api/v1/${module}/workspace`);
      
      if (response.data.success) {
        setData(response.data.data);
        setSummary(response.data.data?.summary || response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error(`Error fetching ${module} workspace:`, err);
      // Don't show error for 401 (auth required) in demo mode
      if (err.response?.status === 401) {
        setError(null);
        // Use mock data in demo mode
        setData(null);
      } else {
        setError(err.message || 'Network error');
      }
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Optional polling
  useEffect(() => {
    if (pollingInterval && pollingInterval > 0) {
      const interval = setInterval(fetchData, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [pollingInterval, fetchData]);

  return { loading, error, data, summary, refetch: fetchData };
}

// Specific hooks for each module
export const useBankingWorkspace = () => useWorkspaceData('cash-management');
export const useFinancialWorkspace = () => useWorkspaceData('financial');
export const useHRWorkspace = () => useWorkspaceData('hr');
export const useSalesWorkspace = () => useWorkspaceData('sales');
export const usePurchaseWorkspace = () => useWorkspaceData('purchase');
export const useInventoryWorkspace = () => useWorkspaceData('inventory');
export const useProjectsWorkspace = () => useWorkspaceData('projects');
export const useProposalsWorkspace = () => useWorkspaceData('proposals');
export const useCommunicationsWorkspace = () => useWorkspaceData('communications');
export const useMiningWorkspace = () => useWorkspaceData('mining');
export const useAgricultureWorkspace = () => useWorkspaceData('agriculture');
export const useConstructionWorkspace = () => useWorkspaceData('construction');
export const usePropertyWorkspace = () => useWorkspaceData('property');
export const useAssetsWorkspace = () => useWorkspaceData('assets');
export const useManufacturingWorkspace = () => useWorkspaceData('manufacturing');
export const useWarehouseWorkspace = () => useWorkspaceData('warehouse');
export const useComplianceWorkspace = () => useWorkspaceData('compliance');
export const useHealthcareWorkspace = () => useWorkspaceData('healthcare');
export const usePracticeWorkspace = () => useWorkspaceData('practice');

export default useWorkspaceData;
