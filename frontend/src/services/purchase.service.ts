import apiClient from './api';

export interface PurchaseStats {
  total_purchases: string;
  total_vendors: string;
  pending_orders: string;
  total_spent: string;
}

export interface PurchaseOrder {
  order_id: string;
  po_number: string;
  vendor_name: string;
  order_date: string;
  total_amount: number;
  status: string;
  expected_delivery: string;
}

export interface Vendor {
  vendor_id: string;
  vendor_name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_amount: number;
}

export const purchaseService = {
  async getStats(): Promise<PurchaseStats> {
    const { data } = await apiClient.get('/api/purchase/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getOrders(params?: { limit?: number; status?: string }): Promise<{ data: PurchaseOrder[]; total: number }> {
    const { data } = await apiClient.get('/api/purchase/orders', { params });
    return data;
  },

  async getVendors(params?: { limit?: number }): Promise<{ data: Vendor[]; total: number }> {
    const { data } = await apiClient.get('/api/purchase/vendors', { params });
    return data;
  },
};
