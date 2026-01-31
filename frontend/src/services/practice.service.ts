import apiClient from './api';

export interface PracticeStats {
  total_clients: string;
  active_matters: string;
  billable_hours_this_month: string;
  total_revenue_this_month: string;
}

export interface Client {
  client_id: string;
  client_number: string;
  client_name: string;
  email: string;
  total_matters: number;
  total_billed: number;
}

export interface Matter {
  matter_id: string;
  matter_number: string;
  matter_name: string;
  client_name: string;
  matter_type: string;
  status: string;
  total_hours: number;
  total_billed: number;
}

export interface TimeEntry {
  entry_id: string;
  matter_number: string;
  employee_name: string;
  hours: number;
  description: string;
  entry_date: string;
  is_billable: boolean;
}

export const practiceService = {
  async getStats(): Promise<PracticeStats> {
    const { data } = await apiClient.get('/api/practice/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getClients(params?: { limit?: number }): Promise<{ data: Client[]; total: number }> {
    const { data } = await apiClient.get('/api/practice/clients', { params });
    return data;
  },

  async getMatters(params?: { limit?: number; status?: string }): Promise<{ data: Matter[]; total: number }> {
    const { data } = await apiClient.get('/api/practice/matters', { params });
    return data;
  },

  async getTimeEntries(params?: { limit?: number }): Promise<{ data: TimeEntry[]; total: number }> {
    const { data } = await apiClient.get('/api/practice/time-entries', { params });
    return data;
  },
};
