/**
 * Supplier Repository
 * 
 * Handles all database operations for suppliers/vendors
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export interface Supplier {
  id: number;
  tenant_id: string;
  code: string;
  name: string;
  trading_name?: string;
  supplier_type: 'individual' | 'company';
  tax_number?: string;
  registration_number?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  payment_terms?: string;
  currency_code?: string;
  notes?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export interface SupplierBalance {
  supplier_id: string;
  total_invoiced: number;
  total_paid: number;
  balance_owed: number;
  overdue_amount: number;
}

export class SupplierRepository extends BaseRepository<Supplier> {
  protected tableName = 'suppliers';
  protected schema = 'purchase';
  protected primaryKey = 'supplier_id';

  private mapSupplier(row: any): Supplier {
    return {
      id: row.supplier_id,
      tenant_id: row.tenant_id,
      code: row.supplier_code,
      name: row.company_name,
      trading_name: row.company_name,
      supplier_type: (row.supplier_type || 'company').toLowerCase() === 'individual' ? 'individual' : 'company',
      tax_number: row.vat_number || row.tax_id,
      registration_number: row.tax_id,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      payment_terms: row.payment_terms,
      currency_code: row.currency_code,
      notes: row.notes,
      is_active: (row.status || 'active') !== 'inactive',
      created_at: row.created_at,
      created_by: row.created_by,
      updated_at: row.updated_at,
      updated_by: row.updated_by,
      deleted_at: row.deleted_at
    };
  }

  /**
   * Find suppliers with legacy schema mapping
   */
  async findAll(
    ctx: TenantContext,
    filters: Record<string, any> = {},
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Supplier>> {
    // Map frontend column names to DB column names
    const columnMap: Record<string, string> = {
      'name': 'company_name',
      'code': 'supplier_code',
      'created_at': 'created_at',
      'updated_at': 'updated_at'
    };
    
    let { page = 1, limit = 50, sortBy = 'company_name', sortOrder = 'ASC' } = pagination || {};
    // Map sortBy to actual DB column
    sortBy = columnMap[sortBy] || sortBy;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [ctx.tenantId];
    let idx = 2;

    if (filters.is_active !== undefined) {
      conditions.push(`status = $${idx++}`);
      params.push(filters.is_active ? 'active' : 'inactive');
    }
    if (filters.supplier_type) {
      conditions.push(`supplier_type = $${idx++}`);
      params.push(filters.supplier_type);
    }

    const where = conditions.join(' AND ');

    const countSql = `SELECT COUNT(*) FROM ${this.fullTableName} WHERE ${where}`;
    const dataSql = `
      SELECT * FROM ${this.fullTableName}
      WHERE ${where}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const [countResult, dataResult] = await Promise.all([
      this.query<{ count: string }>(countSql, params),
      this.query<any>(dataSql, [...params, limit, offset])
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);
    const data = dataResult.rows.map(r => this.mapSupplier(r));

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Search suppliers
   */
  async search(
    ctx: TenantContext,
    searchTerm: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Supplier>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND (
          company_name ILIKE $2 
          OR supplier_code ILIKE $2 
          OR email ILIKE $2 
          OR phone ILIKE $2
        )
      ORDER BY company_name
      LIMIT $3 OFFSET $4
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND (
          company_name ILIKE $2 
          OR supplier_code ILIKE $2 
          OR email ILIKE $2 
          OR phone ILIKE $2
        )
    `;

    const [rowsResult, countResult] = await Promise.all([
      this.query<any>(sql, [ctx.tenantId, searchPattern, limit, offset]),
      this.query<{ count: string }>(countSql, [ctx.tenantId, searchPattern])
    ]);

    const data = rowsResult.rows.map(r => this.mapSupplier(r));

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get supplier with balance
   */
  async getSupplierWithBalance(ctx: TenantContext, supplierId: string): Promise<(Supplier & SupplierBalance) | null> {
    const sql = `
      SELECT 
        s.*,
        COALESCE(SUM(pi.total_amount), 0) as total_invoiced,
        COALESCE(SUM(pi.amount_paid), 0) as total_paid,
        COALESCE(SUM(pi.total_amount - pi.amount_paid), 0) as balance_owed,
        COALESCE(SUM(CASE WHEN pi.due_date < CURRENT_DATE AND pi.status != 'paid' 
          THEN pi.total_amount - pi.amount_paid ELSE 0 END), 0) as overdue_amount
      FROM ${this.fullTableName} s
      LEFT JOIN purchase.vendor_invoices pi ON pi.supplier_id = s.supplier_id AND pi.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND s.supplier_id = $2 AND s.deleted_at IS NULL
      GROUP BY s.supplier_id
    `;

    const result = await this.query<any>(sql, [ctx.tenantId, supplierId]);
    const row = result.rows[0];
    return row ? { ...this.mapSupplier(row), ...row } : null;
  }

  /**
   * Get suppliers with outstanding balances
   */
  async getSuppliersWithBalances(ctx: TenantContext): Promise<(Supplier & SupplierBalance)[]> {
    const sql = `
      SELECT 
        s.*,
        COALESCE(SUM(pi.total_amount), 0) as total_invoiced,
        COALESCE(SUM(pi.amount_paid), 0) as total_paid,
        COALESCE(SUM(pi.total_amount - pi.amount_paid), 0) as balance_owed
      FROM ${this.fullTableName} s
      LEFT JOIN purchase.vendor_invoices pi ON pi.supplier_id = s.supplier_id AND pi.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      GROUP BY s.supplier_id
      HAVING COALESCE(SUM(pi.total_amount - pi.amount_paid), 0) > 0
      ORDER BY balance_owed DESC
    `;
    const rows = await this.query<any>(sql, [ctx.tenantId]);
    return rows.rows.map((r: any) => ({ ...this.mapSupplier(r), ...r }));
  }

  /**
   * Create supplier
   */
  async create(
    ctx: TenantContext,
    data: Partial<Supplier>
  ): Promise<Supplier> {
    // Note: DB schema has no created_by/updated_by columns - only deleted_by
    const payload: Record<string, any> = {
      tenant_id: ctx.tenantId,
      supplier_code: data.code,
      company_name: data.name || data.trading_name,
      contact_person: data.trading_name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      vat_number: data.tax_number,
      supplier_type: data.supplier_type || 'STANDARD',
      payment_terms: data.payment_terms || 'Net 30',
      currency_code: data.currency_code || 'ZAR',
      status: data.is_active === false ? 'inactive' : 'active',
      notes: data.notes
    };

    const columns = Object.keys(payload).filter(key => payload[key] !== undefined);
    const values = columns.map((key) => payload[key]);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const sql = `
      INSERT INTO ${this.fullTableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query<any>(sql, values);
    return this.mapSupplier(result.rows[0]);
  }

  /**
   * Update supplier
   */
  async update(
    ctx: TenantContext,
    id: string | number,
    data: Partial<Supplier>
  ): Promise<Supplier | null> {
    // Note: DB schema has no updated_by column
    const payload: Record<string, any> = {
      supplier_code: data.code,
      company_name: data.name || data.trading_name,
      contact_person: data.trading_name,
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      vat_number: data.tax_number,
      supplier_type: data.supplier_type,
      payment_terms: data.payment_terms,
      currency_code: data.currency_code,
      status: data.is_active === false ? 'inactive' : data.is_active === true ? 'active' : undefined,
      notes: data.notes,
      updated_at: new Date()
    };

    const entries = Object.entries(payload).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return this.findById(ctx, id);
    }

    const setClause = entries.map(([key], idx) => `${key} = $${idx + 1}`).join(', ');
    const values: any[] = entries.map(([, value]) => value);
    values.push(String(id), ctx.tenantId);

    const sql = `
      UPDATE ${this.fullTableName}
      SET ${setClause}
      WHERE supplier_id = $${entries.length + 1} AND tenant_id = $${entries.length + 2}
      RETURNING *
    `;

    const result = await this.query<any>(sql, values);
    const row = result.rows[0];
    return row ? this.mapSupplier(row) : null;
  }

  /**
   * Check if supplier code is unique
   */
  async isCodeUnique(ctx: TenantContext, code: string, excludeId?: string): Promise<boolean> {
    let sql = `SELECT supplier_id FROM ${this.fullTableName} WHERE tenant_id = $1 AND supplier_code = $2`;
    const params: any[] = [ctx.tenantId, code];
    if (excludeId) {
      sql += ' AND supplier_id != $3';
      params.push(excludeId);
    }
    const result = await this.query<any>(sql, params);
    return result.rows.length === 0;
  }
}

// Singleton instance
export const supplierRepository = new SupplierRepository();
export default supplierRepository;
