import apiClient from './api';

export interface AssetStats {
  total_assets: string;
  total_acquisition_cost: string;
  total_net_book_value: string;
  active_assets: string;
}

export interface FixedAsset {
  asset_id: string;
  asset_number: string;
  asset_name: string;
  category_name: string;
  acquisition_date: string;
  acquisition_cost: number;
  accumulated_depreciation: number;
  net_book_value: number;
  asset_status: string;
  location_name: string;
}

export interface AssetCategory {
  category_id: string;
  category_name: string;
  asset_count: number;
  total_value: number;
}

export const assetService = {
  async getStats(): Promise<AssetStats> {
    const { data } = await apiClient.get('/api/assets');
    return data.summary;
  },

  async getAssets(params?: { limit?: number; asset_status?: string }): Promise<{ data: FixedAsset[]; total: number }> {
    const { data } = await apiClient.get('/api/assets', { params });
    return { data: data.data, total: data.total };
  },
};
