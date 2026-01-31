/**
 * Asset Repository
 * 
 * Handles all database operations for fixed assets
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type AssetStatus = 'draft' | 'active' | 'disposed' | 'sold' | 'written_off';

export interface Asset {
  id: string;
  tenant_id: string;
  asset_number: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  location?: string;
  department_id?: string;
  assigned_to?: string;
  serial_number?: string;
  purchase_date: Date;
  purchase_price: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'units_of_production';
  accumulated_depreciation: number;
  book_value: number;
  status: AssetStatus;
  disposal_date?: Date;
  disposal_amount?: number;
  gl_asset_account_id?: string;
  gl_depreciation_account_id?: string;
  gl_expense_account_id?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class AssetRepository extends BaseRepository<Asset> {
  protected tableName = 'assets';
  protected schema = 'assets';

  async getActiveAssets(ctx: TenantContext): Promise<Asset[]> {
    const result = await this.findAll(ctx, { status: 'active' });
    return result.data;
  }

  async getAssetWithCategory(ctx: TenantContext, assetId: string): Promise<Asset | null> {
    const sql = `
      SELECT a.*, ac.name as category_name
      FROM ${this.fullTableName} a
      LEFT JOIN assets.categories ac ON ac.id = a.category_id
      WHERE a.tenant_id = $1 AND a.id = $2 AND a.deleted_at IS NULL
    `;
    const result = await this.rawQuery<Asset>(ctx, sql, [assetId]);
    return result[0] || null;
  }

  async getAssetsByCategory(ctx: TenantContext, categoryId: string): Promise<Asset[]> {
    return this.findBy(ctx, 'category_id', categoryId);
  }

  async getDepreciationSchedule(ctx: TenantContext, assetId: string): Promise<{
    period: number;
    date: Date;
    depreciation_amount: number;
    accumulated_depreciation: number;
    book_value: number;
  }[]> {
    const asset = await this.findById(ctx, assetId);
    if (!asset) return [];

    const monthlyDepreciation = (asset.purchase_price - asset.salvage_value) / asset.useful_life_months;
    const schedule = [];
    let accumulated = asset.accumulated_depreciation;
    let bookValue = asset.book_value;
    const startDate = new Date(asset.purchase_date);

    for (let i = 1; i <= asset.useful_life_months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      const depreciation = Math.min(monthlyDepreciation, bookValue - asset.salvage_value);
      accumulated += depreciation;
      bookValue -= depreciation;

      schedule.push({
        period: i,
        date,
        depreciation_amount: depreciation,
        accumulated_depreciation: accumulated,
        book_value: bookValue
      });
    }

    return schedule;
  }

  async recordDepreciation(ctx: TenantContext, assetId: string, amount: number): Promise<Asset | null> {
    const asset = await this.findById(ctx, assetId);
    if (!asset) return null;

    return this.update(ctx, assetId, {
      accumulated_depreciation: asset.accumulated_depreciation + amount,
      book_value: asset.book_value - amount
    });
  }

  async disposeAsset(ctx: TenantContext, assetId: string, disposalDate: Date, disposalAmount: number): Promise<Asset | null> {
    return this.update(ctx, assetId, {
      status: 'disposed',
      disposal_date: disposalDate,
      disposal_amount: disposalAmount
    });
  }

  async getAssetSummary(ctx: TenantContext): Promise<{
    total_assets: number;
    total_purchase_value: number;
    total_book_value: number;
    total_accumulated_depreciation: number;
    by_category: { category_name: string; count: number; book_value: number }[];
  }> {
    const summarySql = `
      SELECT 
        COUNT(*) as total_assets,
        COALESCE(SUM(purchase_price), 0) as total_purchase_value,
        COALESCE(SUM(book_value), 0) as total_book_value,
        COALESCE(SUM(accumulated_depreciation), 0) as total_accumulated_depreciation
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND deleted_at IS NULL AND status = 'active'
    `;

    const categorySql = `
      SELECT 
        COALESCE(ac.name, 'Uncategorized') as category_name,
        COUNT(*) as count,
        COALESCE(SUM(a.book_value), 0) as book_value
      FROM ${this.fullTableName} a
      LEFT JOIN assets.categories ac ON ac.id = a.category_id
      WHERE a.tenant_id = $1 AND a.deleted_at IS NULL AND a.status = 'active'
      GROUP BY ac.name
      ORDER BY book_value DESC
    `;

    const [summary, categories] = await Promise.all([
      this.rawQuery(ctx, summarySql),
      this.rawQuery(ctx, categorySql)
    ]);

    return {
      total_assets: parseInt(summary[0]?.total_assets || '0', 10),
      total_purchase_value: parseFloat(summary[0]?.total_purchase_value || '0'),
      total_book_value: parseFloat(summary[0]?.total_book_value || '0'),
      total_accumulated_depreciation: parseFloat(summary[0]?.total_accumulated_depreciation || '0'),
      by_category: categories
    };
  }
}

export const assetRepository = new AssetRepository();
export default assetRepository;
