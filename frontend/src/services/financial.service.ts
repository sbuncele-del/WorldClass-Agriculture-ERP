import apiClient from './api';

export interface FinancialStats {
  total_revenue: string;
  total_expenses: string;
  net_income: string;
  total_assets: string;
  total_liabilities: string;
  equity: string;
  cash_balance: string;
  receivables: string;
  payables: string;
}

export interface JournalEntry {
  journal_id: string;
  journal_number: string;
  entry_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  created_by: string;
}

export interface Account {
  id: string;
  account_id?: string; // fallback
  account_number: string;
  account_code?: string; // fallback
  name: string;
  account_name?: string; // fallback
  account_type: string;
  balance: number;
  is_active: boolean;
}

export interface TrialBalanceEntry {
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
}

// Dimension Types
export interface CostCenter {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Location {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface Dimensions {
  costCenters: CostCenter[];
  departments: Department[];
  projects: Project[];
  products: Product[];
  locations: Location[];
}

export const financialService = {
  async getStats(): Promise<FinancialStats> {
    const { data } = await apiClient.get('/api/financial/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getJournalEntries(params?: { limit?: number; status?: string }): Promise<{ data: JournalEntry[]; total: number }> {
    const { data } = await apiClient.get('/api/financial/journals', { params });
    return data;
  },

  async getAccounts(params?: { limit?: number; account_type?: string }): Promise<{ data: Account[]; total: number }> {
    const { data } = await apiClient.get('/api/financial/accounts', { params });
    return data;
  },

  async getTrialBalance(): Promise<{ data: TrialBalanceEntry[]; totals: { debit: number; credit: number } }> {
    const { data } = await apiClient.get('/api/financial/trial-balance');
    return data;
  },

  async getPeriods(): Promise<{ data: Array<{ period: string; status: string; closed_date?: string }> }> {
    const { data } = await apiClient.get('/api/financial/periods');
    return data;
  },

  async createJournalEntry(payload: {
    entry_date: string;
    description: string;
    lines: Array<{ 
      account_id: string; 
      debit_amount: number; 
      credit_amount: number;
      cost_center_id?: string | null;
      department_id?: string | null;
      project_id?: string | null;
      product_id?: string | null;
      location_id?: string | null;
      description?: string | null;
    }>;
  }): Promise<{ success: boolean; data: JournalEntry; message: string }> {
    const { data } = await apiClient.post('/api/v2/financial/journal-entries', payload);
    return data;
  },

  async getChartOfAccounts(params?: { limit?: number }): Promise<{ data: Account[]; total: number }> {
    const { data } = await apiClient.get('/api/v2/financial/accounts', { params: { ...params, limit: params?.limit || 100 } });
    return data;
  },

  // Dimension APIs
  async getCostCenters(): Promise<{ data: CostCenter[] }> {
    const { data } = await apiClient.get('/api/financial/dimensions/cost-centers');
    return data;
  },

  async getDepartments(): Promise<{ data: Department[] }> {
    const { data } = await apiClient.get('/api/financial/dimensions/departments');
    return data;
  },

  async getProjects(): Promise<{ data: Project[] }> {
    const { data } = await apiClient.get('/api/financial/dimensions/projects');
    return data;
  },

  async getProducts(): Promise<{ data: Product[] }> {
    const { data } = await apiClient.get('/api/financial/dimensions/products');
    return data;
  },

  async getLocations(): Promise<{ data: Location[] }> {
    const { data } = await apiClient.get('/api/financial/dimensions/locations');
    return data;
  },

  async getAllDimensions(): Promise<Dimensions> {
    const [costCenters, departments, projects, products, locations] = await Promise.all([
      this.getCostCenters(),
      this.getDepartments(),
      this.getProjects(),
      this.getProducts(),
      this.getLocations(),
    ]);
    return {
      costCenters: costCenters.data || [],
      departments: departments.data || [],
      projects: projects.data || [],
      products: products.data || [],
      locations: locations.data || [],
    };
  },

  // Report Downloads
  async downloadReport(reportCode: string): Promise<{ success: boolean; data: any }> {
    try {
      let endpoint = '';
      switch (reportCode) {
        case 'balance-sheet':
          endpoint = '/api/v2/financial/reports/balance-sheet';
          break;
        case 'income-statement':
          endpoint = '/api/v2/financial/reports/income-statement';
          break;
        case 'trial-balance':
          endpoint = '/api/v2/financial/reports/trial-balance';
          break;
        case 'cash-flow':
          endpoint = '/api/v2/financial/reports/cash-flow';
          break;
        case 'general-ledger':
          // Use trial balance as fallback for general ledger
          endpoint = '/api/v2/financial/reports/trial-balance';
          break;
        case 'aged-receivables':
          endpoint = '/api/v2/financial/reports/aged-receivables';
          break;
        case 'aged-payables':
          endpoint = '/api/v2/financial/reports/aged-payables';
          break;
        case 'vat-report':
          endpoint = '/api/v2/financial/reports/vat-report';
          break;
        default:
          // Return placeholder for unimplemented reports
          return { 
            success: true, 
            data: { 
              message: `Report "${reportCode}" is not yet implemented`,
              placeholder: true 
            }
          };
      }
      
      const { data } = await apiClient.get(endpoint);
      return data;
    } catch (error) {
      console.error(`Error downloading report ${reportCode}:`, error);
      return { success: false, data: null };
    }
  },
};
