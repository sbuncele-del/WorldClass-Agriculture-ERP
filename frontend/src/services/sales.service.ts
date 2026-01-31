import apiClient from './api';

export interface SalesStats {
  total_revenue: string;
  total_orders: string;
  total_customers: string;
  average_order_value: string;
  revenue_growth?: number;
  orders_growth?: number;
}

export interface SalesOrder {
  order_id: string;
  order_number: string;
  customer_name: string;
  order_date: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
}

export interface Customer {
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  customer_type: string;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  orders: number;
}

export const salesService = {
  async getStats(): Promise<SalesStats> {
    const { data } = await apiClient.get('/api/sales/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getOrders(params?: { limit?: number; status?: string }): Promise<{ data: SalesOrder[]; total: number }> {
    const { data } = await apiClient.get('/api/sales/orders', { params });
    return data;
  },

  async getCustomers(params?: { limit?: number }): Promise<{ data: Customer[]; total: number }> {
    const { data } = await apiClient.get('/api/sales/customers', { params });
    return data;
  },

  async getRevenueByMonth(months: number = 6): Promise<RevenueByMonth[]> {
    const { data } = await apiClient.get(`/api/sales/revenue-by-month?months=${months}`);
    return data;
  },
};
