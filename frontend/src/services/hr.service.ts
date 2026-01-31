import apiClient from './api';

export interface HRStats {
  total_employees: string;
  total_departments: string;
  on_leave_today: string;
  payroll_this_month: string;
}

export interface Employee {
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  department_name: string;
  position: string;
  employment_status: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  employee_count: number;
  manager_name?: string;
}

export const hrService = {
  async getStats(): Promise<HRStats> {
    const { data } = await apiClient.get('/api/hr/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getEmployees(params?: { limit?: number; department_id?: string }): Promise<{ data: Employee[]; total: number }> {
    const { data } = await apiClient.get('/api/hr/employees', { params });
    return data;
  },

  async getDepartments(): Promise<{ data: Department[]; total: number }> {
    const { data } = await apiClient.get('/api/hr/departments');
    return data;
  },
};
