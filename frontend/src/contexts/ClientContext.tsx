/**
 * Client Context - Multi-Tenant Support
 * Manages client selection and switching across the platform
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../services/api.service';
import type {
  Client,
  ClientSummary,
  ClientContextState,
} from '../types/multi-tenant.types';

// Mock clients for development
const MOCK_CLIENTS: Client[] = [
  {
    id: 'client-001',
    name: 'Global Enterprises Inc.',
    displayName: 'Global Enterprises',
    code: 'GE',
    status: 'ACTIVE',
    type: 'PRIMARY',
    businessUnits: 5,
    industry: 'Manufacturing',
    registrationNumber: '2018/123456/07',
    taxNumber: '9123456789',
    contactPerson: 'Sarah Johnson',
    email: 'sarah.johnson@globalent.com',
    phone: '+27 11 123 4567',
    address: {
      street: '123 Business Park',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2000',
      country: 'South Africa',
    },
    baseCurrency: 'ZAR',
    fiscalYearEnd: '02-28',
    accountingStandard: 'IFRS',
    enabledModules: ['DASHBOARD', 'FINANCIAL', 'CASH_MANAGEMENT', 'SALES_CRM', 'PURCHASE', 'INVENTORY', 'WAREHOUSE', 'MANUFACTURING', 'HR_PAYROLL', 'ASSET_MANAGEMENT', 'COMPLIANCE', 'SARS_SENTINEL', 'APPROVALS', 'REPORTS', 'ANALYTICS'],
    createdAt: '2023-01-15T08:00:00Z',
    updatedAt: '2025-11-09T08:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'client-002',
    name: 'Manufacturing First',
    displayName: 'Manufacturing First',
    code: 'MF',
    status: 'ACTIVE',
    type: 'DIVISION',
    parentClientId: 'client-001',
    businessUnits: 3,
    industry: 'Production',
    registrationNumber: '2019/234567/07',
    taxNumber: '9234567890',
    contactPerson: 'Michael Brown',
    email: 'michael.brown@manfirst.com',
    phone: '+27 11 234 5678',
    address: {
      street: '456 Industrial Avenue',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001',
      country: 'South Africa',
    },
    baseCurrency: 'ZAR',
    fiscalYearEnd: '02-28',
    accountingStandard: 'IFRS',
    enabledModules: ['DASHBOARD', 'MANUFACTURING', 'INVENTORY', 'WAREHOUSE', 'PURCHASE', 'FINANCIAL'],
    createdAt: '2023-03-20T08:00:00Z',
    updatedAt: '2025-11-09T08:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'client-003',
    name: 'Retail Dynamics',
    displayName: 'Retail Dynamics',
    code: 'RD',
    status: 'ACTIVE',
    type: 'DIVISION',
    parentClientId: 'client-001',
    businessUnits: 1,
    industry: 'Retail',
    registrationNumber: '2020/345678/07',
    taxNumber: '9345678901',
    contactPerson: 'Emily Davis',
    email: 'emily.davis@retaildynamics.com',
    phone: '+27 21 345 6789',
    address: {
      street: '789 Retail Plaza',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa',
    },
    baseCurrency: 'ZAR',
    fiscalYearEnd: '02-28',
    accountingStandard: 'IFRS',
    enabledModules: ['DASHBOARD', 'SALES_CRM', 'INVENTORY', 'CASH_MANAGEMENT', 'FINANCIAL', 'REPORTS'],
    createdAt: '2023-06-10T08:00:00Z',
    updatedAt: '2025-11-09T08:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'client-004',
    name: 'Logistics Solutions',
    displayName: 'Logistics Solutions',
    code: 'LS',
    status: 'ACTIVE',
    type: 'DIVISION',
    parentClientId: 'client-001',
    businessUnits: 12,
    industry: 'Distribution',
    registrationNumber: '2021/456789/07',
    taxNumber: '9456789012',
    contactPerson: 'David Wilson',
    email: 'david.wilson@logisticsol.com',
    phone: '+27 12 456 7890',
    address: {
      street: '321 Warehouse District',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0001',
      country: 'South Africa',
    },
    baseCurrency: 'ZAR',
    fiscalYearEnd: '02-28',
    accountingStandard: 'IFRS',
    enabledModules: ['DASHBOARD', 'WAREHOUSE', 'INVENTORY', 'PURCHASE', 'FINANCIAL'],
    createdAt: '2023-09-05T08:00:00Z',
    updatedAt: '2025-11-09T08:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'client-005',
    name: 'Financial Corp',
    displayName: 'Financial Corp',
    code: 'FC',
    status: 'ACTIVE',
    type: 'DIVISION',
    parentClientId: 'client-001',
    businessUnits: 1,
    industry: 'Financial Services',
    registrationNumber: '2022/567890/07',
    taxNumber: '9567890123',
    contactPerson: 'Jennifer Martinez',
    email: 'jennifer.martinez@financialcorp.com',
    phone: '+27 11 567 8901',
    address: {
      street: '555 Financial Center',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa',
    },
    baseCurrency: 'USD',
    fiscalYearEnd: '12-31',
    accountingStandard: 'IFRS',
    enabledModules: ['DASHBOARD', 'FINANCIAL', 'CASH_MANAGEMENT', 'COMPLIANCE', 'REPORTS', 'ANALYTICS'],
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2025-11-09T08:00:00Z',
    createdBy: 'admin',
  },
];

const ClientContext = createContext<ClientContextState | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [availableClients, setAvailableClients] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize tenant from backend (NO MOCK DATA)
  const initializeClients = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    // Don't load tenant data if not authenticated
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Load tenant settings from backend (NO MOCK DATA FALLBACK)
            
      const response = await fetch(`${API_BASE_URL}/api/tenant/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        // If unauthorized/forbidden, clear tokens and fail silently (don't log to console)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to load tenant settings: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Convert tenant data to client format
      const client: Client = {
        id: data.data?.id || 'unknown',
        name: data.data?.name || 'Unknown Tenant',
        code: data.data?.slug || 'UNKNOWN',
        type: 'PRIMARY',
        status: data.data?.status || 'ACTIVE',
        businessUnits: 1
      };
      
      setAvailableClients([client]);
      setCurrentClient(client);
      localStorage.setItem('currentClientId', client.id);
    } catch (err) {
      console.error('CRITICAL ERROR loading tenant:', err);
      setError(`Failed to load tenant data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      // NO MOCK DATA FALLBACK - System must show real errors
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeClients();
  }, []);

  const switchClient = async (clientId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // NO MOCK DATA - Real API only
            const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/super-admin/tenants/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch tenant: ${response.status}`);
      }
      
      const data = await response.json();
      setCurrentClient(data.data);
      localStorage.setItem('currentClientId', clientId);
    } catch (err) {
      console.error('CRITICAL ERROR switching tenant:', err);
      setError(`Failed to switch tenant: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClients = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // NO MOCK DATA - Real API only
      await initializeClients();
    } catch (err) {
      console.error('CRITICAL ERROR refreshing tenants:', err);
      setError(`Failed to refresh tenant list: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const value: ClientContextState = {
    currentClient,
    availableClients,
    isLoading,
    error,
    switchClient,
    refreshClients,
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
};

export const useClient = (): ClientContextState => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};
