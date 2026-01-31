/**
 * Centralized API Service
 * 
 * ALL API calls MUST go through this service. No exceptions.
 * 
 * Features:
 * 1. Single source of truth for API base URL
 * 2. Automatic authentication headers
 * 3. Tenant context injection
 * 4. Consistent error handling
 * 5. Request/response logging in development
 * 
 * Usage:
 *   import { api } from '@/services/api.service';
 *   const data = await api.get('/api/sales/customers');
 *   const result = await api.post('/api/sales/orders', orderData);
 */

// API Configuration
// Empty string = use relative URLs (same origin, e.g., CloudFront proxy)
// Set VITE_API_URL only if API is on a different domain
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Export for components that need direct access (rare cases)
export { API_BASE_URL };

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  // Accept both token keys for compatibility
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

/**
 * Get current workspace ID from localStorage
 */
const getWorkspaceId = (): string | null => {
  return localStorage.getItem('workspaceId');
};

/**
 * Get tenant ID from localStorage
 */
const getTenantId = (): string | null => {
  return localStorage.getItem('tenantId');
};

/**
 * Build headers for API requests
 */
const buildHeaders = (customHeaders: Record<string, string> = {}): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const workspaceId = getWorkspaceId();
  if (workspaceId) {
    headers['X-Workspace-ID'] = workspaceId;
  }

  const tenantId = getTenantId();
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  return headers;
};

/**
 * Handle API response
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    // Try to parse error message
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
};

/**
 * Generic GET request
 */
export const apiGet = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
  });

  return handleResponse<T>(response);
};

/**
 * Generic POST request
 */
export const apiPost = async <T>(endpoint: string, data?: any): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Generic PUT request
 */
export const apiPut = async <T>(endpoint: string, data?: any): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Generic PATCH request
 */
export const apiPatch = async <T>(endpoint: string, data?: any): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Generic DELETE request
 */
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  return handleResponse<T>(response);
};

/**
 * Upload file (multipart/form-data)
 */
export const apiUpload = async <T>(endpoint: string, formData: FormData): Promise<T> => {
  // Don't set Content-Type header for FormData - browser will set it with boundary
  const headers = buildHeaders();
  delete (headers as any)['Content-Type'];

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  return handleResponse<T>(response);
};

/**
 * Workspace-specific API calls
 * These automatically include the workspace context
 */
export const workspaceApi = {
  // Financial Workspace
  financial: {
    getDashboard: () => apiGet('/api/financial/dashboard'),
    getJournalEntries: (params?: any) => apiGet('/api/financial/journal-entries', params),
    getTrialBalance: (params?: any) => apiGet('/api/financial/trial-balance', params),
    getChartOfAccounts: () => apiGet('/api/financial/chart-of-accounts'),
    createJournalEntry: (data: any) => apiPost('/api/financial/journal-entries', data),
  },

  // Sales Workspace
  sales: {
    getDashboard: () => apiGet('/api/sales/dashboard'),
    getLeads: (params?: any) => apiGet('/api/sales/leads', params),
    getOpportunities: (params?: any) => apiGet('/api/sales/opportunities', params),
    getCustomers: (params?: any) => apiGet('/api/sales/customers', params),
    getOrders: (params?: any) => apiGet('/api/sales/orders', params),
    getQuotations: (params?: any) => apiGet('/api/sales/quotations', params),
    createLead: (data: any) => apiPost('/api/sales/leads', data),
    updateLead: (id: number, data: any) => apiPut(`/api/sales/leads/${id}`, data),
    createCustomer: (data: any) => apiPost('/api/sales/customers', data),
    createOrder: (data: any) => apiPost('/api/sales/orders', data),
    createQuotation: (data: any) => apiPost('/api/sales/quotations', data),
  },

  // Purchase Workspace
  purchase: {
    getWorkspace: () => apiGet('/api/purchase/workspace'),
    getDashboard: () => apiGet('/api/purchase/dashboard'),
    getSuppliers: (params?: any) => apiGet('/api/purchase/suppliers', params),
    getRequisitions: (params?: any) => apiGet('/api/purchase/requisitions', params),
    getPurchaseOrders: (params?: any) => apiGet('/api/purchase/orders', params),
    createPurchaseOrder: (data: any) => apiPost('/api/purchase/orders', data),
    createSupplier: (data: any) => apiPost('/api/purchase/suppliers', data),
  },

  // Inventory Workspace
  inventory: {
    getDashboard: () => apiGet('/api/inventory/dashboard'),
    getProducts: (params?: any) => apiGet('/api/inventory/products', params),
    getStockMovements: (params?: any) => apiGet('/api/inventory/movements', params),
    getWarehouses: () => apiGet('/api/inventory/warehouses'),
    adjustStock: (data: any) => apiPost('/api/inventory/adjustments', data),
  },

  // HR Workspace
  hr: {
    getDashboard: () => apiGet('/api/hr/dashboard'),
    getEmployees: (params?: any) => apiGet('/api/hr/employees', params),
    getPayroll: (params?: any) => apiGet('/api/hr/payroll', params),
    getLeave: (params?: any) => apiGet('/api/hr/leave', params),
    createEmployee: (data: any) => apiPost('/api/hr/employees', data),
  },

  // Logistics Workspace
  logistics: {
    getDashboard: () => apiGet('/api/logistics/dashboard'),
    getFleet: (params?: any) => apiGet('/api/logistics/fleet', params),
    getTrips: (params?: any) => apiGet('/api/logistics/trips', params),
    getDrivers: (params?: any) => apiGet('/api/logistics/drivers', params),
    createTrip: (data: any) => apiPost('/api/logistics/trips', data),
    updateTripStatus: (id: number, status: string) => 
      apiPatch(`/api/logistics/trips/${id}/status`, { status }),
  },

  // Compliance Workspace
  compliance: {
    getDashboard: () => apiGet('/api/compliance/dashboard'),
    getDocuments: (params?: any) => apiGet('/api/compliance/documents', params),
    getAudits: (params?: any) => apiGet('/api/compliance/audits', params),
    getRiskAssessments: () => apiGet('/api/compliance/risk-assessments'),
  },

  // SARS Workspace
  sars: {
    getDashboard: () => apiGet('/api/sars/dashboard'),
    getCorrespondence: (params?: any) => apiGet('/api/sars/correspondence', params),
    getSubmissions: (params?: any) => apiGet('/api/sars/submissions', params),
    createSubmission: (data: any) => apiPost('/api/sars/submissions', data),
  },

  // Assets Workspace
  assets: {
    getDashboard: () => apiGet('/api/assets/dashboard'),
    getAssets: (params?: any) => apiGet('/api/assets/assets', params),
    getMaintenance: (params?: any) => apiGet('/api/assets/maintenance', params),
    createAsset: (data: any) => apiPost('/api/assets/assets', data),
  },

  // Manufacturing Workspace
  manufacturing: {
    getDashboard: () => apiGet('/api/manufacturing/dashboard'),
    getProductionOrders: (params?: any) => apiGet('/api/manufacturing/production-orders', params),
    getBOMs: (params?: any) => apiGet('/api/manufacturing/boms', params),
    getWorkCenters: () => apiGet('/api/manufacturing/work-centers'),
  },

  // Warehouse Workspace
  warehouse: {
    getDashboard: () => apiGet('/api/warehouse/dashboard'),
    getLocations: () => apiGet('/api/warehouse/locations'),
    getBins: (params?: any) => apiGet('/api/warehouse/bins', params),
    getPickingOrders: (params?: any) => apiGet('/api/warehouse/picking-orders', params),
  },

  // Admin Workspace
  admin: {
    getDashboard: () => apiGet('/api/v2/admin/dashboard'),
    getUsers: (params?: any) => apiGet('/api/v2/admin/users', params),
    getRoles: () => apiGet('/api/v2/admin/roles'),
    getPermissions: () => apiGet('/api/v2/admin/permissions'),
    createUser: (data: any) => apiPost('/api/v2/admin/users', data),
    inviteUser: (data: any) => apiPost('/api/v2/admin/users/invite', data),
    resendInvite: (userId: string) => apiPost(`/api/v2/admin/users/${userId}/resend-invite`, {}),
    updateUser: (id: string, data: any) => apiPut(`/api/v2/admin/users/${id}`, data),
    deleteUser: (id: string) => apiDelete(`/api/v2/admin/users/${id}`),
    getAuditLogs: (params?: any) => apiGet('/api/v2/admin/audit-logs', params),
  },

  // Cash Management Workspace
  cashManagement: {
    getWorkspace: () => apiGet('/api/cash-management/workspace'),
    getSummary: () => apiGet('/api/cash-management/summary'),
    getBanks: () => apiGet('/api/cash-management/banks'),
    getBankAccounts: (params?: any) => apiGet('/api/cash-management/bank-accounts', params),
    getBankAccountById: (id: string) => apiGet(`/api/cash-management/bank-accounts/${id}`),
    createBankAccount: (data: any) => apiPost('/api/cash-management/bank-accounts', data),
    updateBankAccount: (id: string, data: any) => apiPut(`/api/cash-management/bank-accounts/${id}`, data),
    getStatements: (params?: any) => apiGet('/api/cash-management/statements', params),
    importStatement: (data: any) => apiPost('/api/cash-management/statements/import', data),
    parseCSVPreview: (data: any) => apiPost('/api/cash-management/statements/parse-csv', data),
    getStatementLines: (params?: any) => apiGet('/api/cash-management/statement-lines', params),
    getJournalEntries: (params?: any) => apiGet('/api/cash-management/journal-entries', params),
    getReconciliationRules: () => apiGet('/api/cash-management/rules'),
    createReconciliationRule: (data: any) => apiPost('/api/cash-management/rules', data),
    runAutoMatching: (statementId: string) => apiPost(`/api/cash-management/statements/${statementId}/auto-match`),
    createMatch: (data: any) => apiPost('/api/cash-management/matches', data),
    unmatch: (data: any) => apiPost('/api/cash-management/matches/unmatch', data),
    getReconciliationWorkspace: (statementId: string) => apiGet(`/api/cash-management/statements/${statementId}/workspace`),
    
    // Multi-line matching
    findCombinations: (data: any) => apiPost('/api/cash-management/multi-line-matching/find', data),
    createMultiLineMatch: (data: any) => apiPost('/api/cash-management/multi-line-matching/create', data),
    unmatchMultiLine: (groupId: number) => apiDelete(`/api/cash-management/multi-line-matching/${groupId}`),
    getMultiLineGroups: (params?: any) => apiGet('/api/cash-management/multi-line-matching/groups', params),
    
    // Partial reconciliation
    acceptPartialMatch: (data: any) => apiPost('/api/cash-management/partial-matching/accept', data),
    getPartialSuggestions: (bankLineId: number) => apiGet(`/api/cash-management/partial-matching/${bankLineId}/suggestions`),
    checkTolerance: (data: any) => apiPost('/api/cash-management/partial-matching/check-tolerance', data),
    getToleranceSettings: () => apiGet('/api/cash-management/partial-matching/tolerance-settings'),
    
    // Duplicate detection
    checkDuplicate: (data: any) => apiPost('/api/cash-management/duplicates/check', data),
    findDuplicates: (params?: any) => apiGet('/api/cash-management/duplicates/find', params),
    
    // Bulk operations
    bulkAutoMatch: (data: any) => apiPost('/api/cash-management/bulk/auto-match', data),
    bulkAcceptSuggestions: (data: any) => apiPost('/api/cash-management/bulk/accept-suggestions', data),
    bulkUnmatch: (data: any) => apiPost('/api/cash-management/bulk/unmatch', data),
    getBulkStats: (statementId: number) => apiGet(`/api/cash-management/bulk/stats/${statementId}`),
  },

  // Super Admin Workspace
  superadmin: {
    getDashboard: () => apiGet('/api/superadmin/dashboard'),
    getTenants: (params?: any) => apiGet('/api/superadmin/tenants', params),
    getSystemHealth: () => apiGet('/api/superadmin/system/health'),
    getAuditLogs: (params?: any) => apiGet('/api/superadmin/audit-logs', params),
  },
};

/**
 * Authentication API
 */
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiPost<{ token: string; user: any; workspace: any }>('/api/auth/login', {
      email,
      password,
    });
    
    // Store token and user info
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.workspace) {
        localStorage.setItem('workspaceId', response.workspace.id);
        localStorage.setItem('tenantId', response.workspace.tenant_id);
      }
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiPost('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('workspaceId');
      localStorage.removeItem('tenantId');
    }
  },

  me: () => apiGet<{ user: any; workspace: any }>('/api/auth/me'),

  register: (data: any) => apiPost('/api/auth/register', data),

  // Password reset flow (V2 controllers)
  requestPasswordReset: (email: string) => apiPost('/api/v2/auth/password/reset-request', { email }),
  verifyResetToken: (token: string) => apiPost('/api/v2/auth/password/verify-token', { token }),
  validatePassword: (password: string) => apiPost('/api/v2/auth/password/validate', { password }),
  resetPassword: (token: string, password: string, confirmPassword?: string) => 
    apiPost('/api/v2/auth/password/reset', { token, password, confirmPassword: confirmPassword ?? password }),
};

/**
 * Export a test function to check API connectivity
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};
