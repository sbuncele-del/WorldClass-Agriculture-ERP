import apiClient from './api';

export interface InventoryStats {
  total_products: string;
  total_value: string;
  low_stock_items: string;
  out_of_stock_items: string;
}

export interface Product {
  product_id: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_price: number;
  total_value: number;
}

export interface StockMovement {
  movement_id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  movement_date: string;
}

export const inventoryService = {
  async getStats(): Promise<InventoryStats> {
    const { data } = await apiClient.get('/api/inventory/workspace');
    // Extract summary from workspace response
    return data.data?.summary || data.summary || data;
  },

  async getProducts(params?: { limit?: number; low_stock?: boolean }): Promise<{ data: Product[]; total: number }> {
    const { data } = await apiClient.get('/api/inventory/products', { params });
    return data;
  },

  async getStockMovements(params?: { limit?: number }): Promise<{ data: StockMovement[]; total: number }> {
    const { data } = await apiClient.get('/api/inventory/stock-movements', { params });
    return data;
  },
};
