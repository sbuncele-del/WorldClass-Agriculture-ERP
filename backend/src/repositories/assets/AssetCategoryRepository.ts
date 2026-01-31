/**
 * Asset Category Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export interface AssetCategory {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  default_useful_life_months?: number;
  default_depreciation_method?: 'straight_line' | 'declining_balance' | 'units_of_production';
  default_salvage_value_percent?: number;
  gl_asset_account_id?: string;
  gl_depreciation_account_id?: string;
  gl_expense_account_id?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class AssetCategoryRepository extends BaseRepository<AssetCategory> {
  protected tableName = 'categories';
  protected schema = 'assets';

  async getActiveCategories(ctx: TenantContext): Promise<AssetCategory[]> {
    const result = await this.findAll(ctx, { is_active: true });
    return result.data;
  }

  async getCategoryTree(ctx: TenantContext): Promise<AssetCategory[]> {
    const sql = `
      WITH RECURSIVE cat_tree AS (
        SELECT *, 0 as level
        FROM ${this.fullTableName}
        WHERE tenant_id = $1 AND parent_id IS NULL AND deleted_at IS NULL
        UNION ALL
        SELECT c.*, ct.level + 1
        FROM ${this.fullTableName} c
        INNER JOIN cat_tree ct ON c.parent_id = ct.id
        WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
      )
      SELECT * FROM cat_tree ORDER BY level, name
    `;
    return this.rawQuery(ctx, sql);
  }
}

export const assetCategoryRepository = new AssetCategoryRepository();
export default assetCategoryRepository;
