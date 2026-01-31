/**
 * Item Category Repository
 * 
 * Handles all database operations for inventory item categories
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export interface ItemCategory {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  deleted_by?: string;
}

export class ItemCategoryRepository extends BaseRepository<ItemCategory> {
  protected tableName = 'item_categories';
  protected schema = 'inventory';

  /**
   * Get all active categories for a tenant
   */
  async getActiveCategories(ctx: TenantContext): Promise<ItemCategory[]> {
    const result = await this.findAll(ctx, { is_active: true }, { limit: 1000 });
    return result.data;
  }

  /**
   * Get category hierarchy (categories with their children)
   */
  async getCategoryTree(ctx: TenantContext): Promise<ItemCategory[]> {
    const sql = `
      WITH RECURSIVE category_tree AS (
        SELECT *, 0 as level
        FROM ${this.fullTableName}
        WHERE tenant_id = $1 AND parent_id IS NULL AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT c.*, ct.level + 1
        FROM ${this.fullTableName} c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
      )
      SELECT * FROM category_tree ORDER BY level, name
    `;

    return this.rawQuery(ctx, sql);
  }

  /**
   * Get subcategories of a parent category
   */
  async getSubcategories(ctx: TenantContext, parentId: string): Promise<ItemCategory[]> {
    return this.findBy(ctx, 'parent_id', parentId);
  }

  /**
   * Check if category code is unique for tenant
   */
  async isCodeUnique(ctx: TenantContext, code: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { code });
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  /**
   * Search categories by name or code
   */
  async search(
    ctx: TenantContext, 
    searchTerm: string, 
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ItemCategory>> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND (name ILIKE $2 OR code ILIKE $2 OR description ILIKE $2)
      ORDER BY name
      LIMIT $3 OFFSET $4
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND (name ILIKE $2 OR code ILIKE $2 OR description ILIKE $2)
    `;

    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const [data, countResult] = await Promise.all([
      this.rawQuery<ItemCategory>(ctx, sql, [searchPattern, limit, offset]),
      this.rawQuery<{ count: string }>(ctx, countSql, [searchPattern])
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

// Singleton instance
export const itemCategoryRepository = new ItemCategoryRepository();
export default itemCategoryRepository;
