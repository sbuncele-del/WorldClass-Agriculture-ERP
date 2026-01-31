/**
 * Multi-Tenant, Multi-User, Multi-Currency Type Definitions
 * AetherOS ERP Platform
 */

// ==================== CLIENT / TENANT TYPES ====================

export interface Client {
  id: string;
  name: string;
  displayName: string;
  code: string; // Short code like "GE", "MF", "RD"
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  type: 'PRIMARY' | 'SUBSIDIARY' | 'DIVISION';
  parentClientId?: string; // For hierarchical client structures
  
  // Business Information
  businessUnits: number;
  industry: string;
  registrationNumber: string;
  taxNumber: string;
  
  // Contact Details
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Financial Settings
  baseCurrency: CurrencyCode;
  fiscalYearEnd: string; // MM-DD format
  accountingStandard: 'IFRS' | 'GAAP' | 'SARS' | 'OTHER';
  
  // Feature Access
  enabledModules: ModuleType[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  code: string;
  type: string;
  businessUnits: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  
  // Authentication
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLogin?: string;
  passwordLastChanged: string;
  mfaEnabled: boolean;
  
  // Role & Permissions
  role: UserRole;
  permissions: Permission[];
  
  // Client Access
  clientAccess: ClientAccess[];
  defaultClientId: string;
  
  // Contact
  phone?: string;
  department?: string;
  title?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  level: 'SYSTEM_ADMIN' | 'CLIENT_ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  description: string;
}

export interface Permission {
  id: string;
  module: ModuleType;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'EXPORT';
  scope: 'ALL_CLIENTS' | 'ASSIGNED_CLIENTS' | 'OWN_DEPARTMENT' | 'OWN_DATA';
}

export interface ClientAccess {
  clientId: string;
  clientName: string;
  role: UserRole;
  permissions: Permission[];
  grantedAt: string;
  grantedBy: string;
}

// ==================== CURRENCY TYPES ====================

export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'CHF';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimalPlaces: number;
  displayFormat: string; // e.g., "R 1,234.56" or "$1,234.56"
}

export interface ExchangeRate {
  id: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  effectiveDate: string;
  source: 'MANUAL' | 'AUTO' | 'BANK' | 'API';
  createdAt: string;
}

export interface CurrencyConversion {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  convertedAmount: number;
  conversionDate: string;
}

export interface MultiCurrencyAmount {
  baseCurrency: CurrencyCode;
  baseAmount: number;
  currencies: {
    [key in CurrencyCode]?: {
      amount: number;
      rate: number;
      lastUpdated: string;
    };
  };
}

// ==================== MODULE TYPES ====================

export type ModuleType = 
  | 'DASHBOARD'
  | 'FINANCIAL'
  | 'CASH_MANAGEMENT'
  | 'SALES_CRM'
  | 'PURCHASE'
  | 'INVENTORY'
  | 'WAREHOUSE'
  | 'MANUFACTURING'
  | 'HR_PAYROLL'
  | 'ASSET_MANAGEMENT'
  | 'COMPLIANCE'
  | 'SARS_SENTINEL'
  | 'APPROVALS'
  | 'REPORTS'
  | 'ANALYTICS';

export interface ModuleAccess {
  module: ModuleType;
  enabled: boolean;
  permissions: Permission[];
}

// ==================== CONSOLIDATED METRICS ====================

export interface ConsolidatedMetrics {
  clientId?: string; // If undefined, shows all clients
  currency: CurrencyCode;
  period: {
    fiscalYear: number;
    periodNumber: number;
    periodName: string;
    startDate: string;
    endDate: string;
  };
  
  // Financial Metrics
  revenue: {
    total: number;
    byClient: { clientId: string; clientName: string; amount: number }[];
    growth: number; // Percentage
    comparison: 'INCREASE' | 'DECREASE' | 'STABLE';
  };
  
  // Cash Position
  cashPosition: {
    total: number;
    available: number;
    restricted: number;
    byBank: { bankName: string; accountNumber: string; balance: number }[];
    byCurrency: { currency: CurrencyCode; amount: number; converted: number }[];
  };
  
  // Inventory
  inventory: {
    totalValue: number;
    totalUnits: number;
    warehouses: number;
    byWarehouse: { warehouseId: string; name: string; value: number }[];
    status: 'OPTIMAL' | 'LOW' | 'EXCESS' | 'CRITICAL';
  };
  
  // Operations
  operations: {
    manufacturingUnits: { total: number; operational: number; capacity: number };
    warehouseUtilization: { total: number; utilized: number; percentage: number };
    ordersFulfilled: number;
    pendingOrders: number;
  };
  
  // Multi-Currency
  fxExposure: {
    totalExposure: number;
    byCurrency: { currency: CurrencyCode; exposure: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' }[];
    unrealizedGainLoss: number;
  };
  
  // Users & Access
  users: {
    total: number;
    active: number;
    online: number;
    byClient: { clientId: string; clientName: string; count: number }[];
  };
}

// ==================== CONTEXT STATE TYPES ====================

export interface ClientContextState {
  currentClient: Client | null;
  availableClients: ClientSummary[];
  isLoading: boolean;
  error: string | null;
  switchClient: (clientId: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

export interface UserContextState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  hasPermission: (module: ModuleType, action: Permission['action']) => boolean;
}

export interface CurrencyContextState {
  baseCurrency: CurrencyCode;
  displayCurrency: CurrencyCode;
  availableCurrencies: Currency[];
  exchangeRates: ExchangeRate[];
  isLoading: boolean;
  error: string | null;
  setDisplayCurrency: (currency: CurrencyCode) => void;
  convertAmount: (amount: number, from: CurrencyCode, to: CurrencyCode) => number;
  formatCurrency: (amount: number, currency?: CurrencyCode) => string;
  refreshRates: () => Promise<void>;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ==================== FILTER & QUERY TYPES ====================

export interface MultiTenantFilter {
  clientIds?: string[];
  startDate?: string;
  endDate?: string;
  currency?: CurrencyCode;
  status?: string[];
}

export interface ClientPortfolioQuery {
  includeSubsidiaries?: boolean;
  includeInactive?: boolean;
  moduleType?: ModuleType;
}
