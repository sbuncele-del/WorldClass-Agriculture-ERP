/**
 * Customer Repository
 * 
 * Handles all database operations for customers/clients.
 * Note: This table uses a simpler schema without multi-tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions, QueryOptions } from '../BaseRepository';

// Interface matching actual sales.customers table schema
export interface Customer {
  customer_id: number;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  vat_number?: string;
  customer_type?: string;
  source?: string;
  created_from_document?: string;
  status: string;
  created_at: Date;
  updated_at?: Date;
  billing_address?: string;
  shipping_address?: string;
  payment_terms?: string;
  credit_limit?: number;
  // Aliases for compatibility with frontend/services
  id?: number;
  name?: string;
}

export interface CustomerBalance {
  customer_id: string;
  total_invoiced: number;
  total_paid: number;
  balance_due: number;
  overdue_amount: number;
}

export class CustomerRepository extends BaseRepository<Customer> {
  protected tableName = 'customers';
  protected schema = 'sales';  // Table is in sales schema
  protected softDelete = false;  // Table doesn't have deleted_at column
  protected primaryKey = 'customer_id';  // Use actual PK name
  protected tenantIsolation = true;  // Table has tenant_id column

  // Columns that actually exist on the table (from \d customers)
  private readonly columns = new Set([
    'customer_id', 'customer_code', 'company_name', 'contact_person', 'email', 'phone', 
    'mobile', 'vat_number', 'customer_type', 'source', 'billing_address', 'shipping_address',
    'payment_terms', 'credit_limit', 'tax_id', 'industry', 'website', 'notes', 'assigned_to',
    'status', 'tenant_id', 'created_at', 'updated_at'
  ]);

  /**
   * Override rawQuery to NOT prepend tenant_id since this table isn't multi-tenant
   */
  async rawQuery<R = any>(
    ctx: TenantContext,
    sql: string,
    params: any[] = [],
    _options?: QueryOptions
  ): Promise<R[]> {
    const result = await this.pool.query<R>(sql, params);
    return result.rows;
  }

  /**
   * Find all customers without tenant filtering
   */
  async findAll(
    _ctx: TenantContext,
    filters: Record<string, any> = {},
    pagination?: PaginationOptions,
    _options?: QueryOptions
  ): Promise<PaginatedResult<Customer>> {
    const { page = 1, limit = 50, sortBy = 'company_name', sortOrder = 'ASC' } = pagination || {};
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Map optional filters to real columns
    if (filters.customer_type) {
      conditions.push(`customer_type = $${paramIndex++}`);
      params.push(filters.customer_type);
    }
    if (filters.is_active !== undefined) {
      // Treat is_active true as status = 'active'; otherwise include all
      if (filters.is_active === true || filters.is_active === 'true') {
        conditions.push(`status = $${paramIndex++}`);
        params.push('active');
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM ${this.fullTableName} ${whereClause}`;
    const dataSql = `
      SELECT 
        customer_id, customer_id as id,
        company_name, company_name as name,
        contact_person, email, phone, vat_number,
        customer_type, source, status, created_at, updated_at,
        billing_address, shipping_address, payment_terms, credit_limit
      FROM ${this.fullTableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const [countRows, data] = await Promise.all([
      this.rawQuery<{ count: string }>(_ctx, countSql, params),
      this.rawQuery<Customer>(_ctx, dataSql, [...params, limit, offset])
    ]);

    const total = parseInt(countRows[0]?.count || '0', 10);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Create customer without tenant fields
   */
  async create(
    _ctx: TenantContext,
    data: Partial<Customer>,
    _options?: QueryOptions
  ): Promise<Customer> {
    const payload: Record<string, any> = { ...data };

    // Map alias fields
    if (!payload.company_name && payload.name) {
      payload.company_name = payload.name;
    }

    // Strip unsupported fields
    for (const key of Object.keys(payload)) {
      if (!this.columns.has(key)) {
        delete payload[key];
      }
    }

    // Ensure required column present
    if (!payload.company_name) {
      throw new Error('company_name is required');
    }

    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const sql = `
      INSERT INTO ${this.fullTableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING customer_id, customer_id as id, company_name, company_name as name,
        contact_person, email, phone, vat_number, customer_type, source, status,
        created_at, updated_at, billing_address, shipping_address, payment_terms, credit_limit
    `;

    const result = await this.rawQuery<Customer>(_ctx, sql, values);
    return result[0];
  }

  /**
   * Update customer without tenant fields
   */
  async update(
    _ctx: TenantContext,
    id: string | number,
    data: Partial<Customer>,
    _options?: QueryOptions
  ): Promise<Customer | null> {
    const payload: Record<string, any> = { ...data };

    if (payload.name && !payload.company_name) {
      payload.company_name = payload.name;
    }

    // Strip unsupported fields and protected columns
    for (const key of Object.keys(payload)) {
      if (!this.columns.has(key) || key === 'customer_id') {
        delete payload[key];
      }
    }

    if (Object.keys(payload).length === 0) {
      return this.findById(_ctx, id);
    }

    const setClause = Object.keys(payload)
      .map((col, idx) => `${col} = $${idx + 1}`)
      .join(', ');

    const values = [...Object.values(payload), id];

    const sql = `
      UPDATE ${this.fullTableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $${Object.keys(payload).length + 1}
      RETURNING customer_id, customer_id as id, company_name, company_name as name,
        contact_person, email, phone, vat_number, customer_type, source, status,
        created_at, updated_at, billing_address, shipping_address, payment_terms, credit_limit
    `;

    const result = await this.rawQuery<Customer>(_ctx, sql, values);
    return result[0] || null;
  }

  /**
   * Delete customer without tenant fields
   */
  async delete(_ctx: TenantContext, id: string | number, _options?: QueryOptions): Promise<boolean> {
    const sql = `DELETE FROM ${this.fullTableName} WHERE customer_id = $1`;
    const result = await this.pool.query(sql, [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Find by ID without tenant filtering
   */
  async findById(_ctx: TenantContext, id: string | number, _options?: QueryOptions): Promise<Customer | null> {
    const sql = `
      SELECT customer_id, customer_id as id, company_name, company_name as name,
        contact_person, email, phone, vat_number, customer_type, source, status,
        created_at, updated_at, billing_address, shipping_address, payment_terms, credit_limit
      FROM ${this.fullTableName}
      WHERE customer_id = $1
      LIMIT 1
    `;
    const result = await this.rawQuery<Customer>(_ctx, sql, [id]);
    return result[0] || null;
  }

  /**
   * Get all active customers
   */
  async getActiveCustomers(ctx: TenantContext): Promise<Customer[]> {
    const sql = `
      SELECT 
        customer_id, customer_id as id, 
        company_name, company_name as name,
        contact_person, email, phone, vat_number,
        customer_type, source, status, created_at, updated_at,
        billing_address, shipping_address, payment_terms, credit_limit
      FROM ${this.fullTableName}
      WHERE status = 'active'
      ORDER BY company_name
      LIMIT 1000
    `;
    return this.rawQuery<Customer>(ctx, sql, []);
  }

  /**
   * Search customers by customer name, email, or phone (with tenant isolation)
   */
  async search(
    ctx: TenantContext,
    searchTerm: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Customer>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const sql = `
      SELECT 
        customer_id, customer_id as id,
        customer_name, customer_name as name, customer_name as company_name,
        email, phone, vat_number, customer_code,
        is_active as status, created_at, updated_at,
        address_line1 as billing_address, payment_terms, credit_limit
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND (
        customer_name ILIKE $2 
        OR email ILIKE $2 
        OR phone ILIKE $2
        OR vat_number ILIKE $2
        OR customer_code ILIKE $2
      )
      ORDER BY customer_name
      LIMIT $3 OFFSET $4
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND (
        customer_name ILIKE $2 
        OR email ILIKE $2 
        OR phone ILIKE $2
        OR vat_number ILIKE $2
        OR customer_code ILIKE $2
      )
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<Customer>(ctx, sql, [ctx.tenantId, searchPattern, limit, offset]),
      this.rawQuery<{ count: string }>(ctx, countSql, [ctx.tenantId, searchPattern])
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Get customer with balance information
   */
  async getCustomerWithBalance(ctx: TenantContext, customerId: string): Promise<(Customer & CustomerBalance) | null> {
    const sql = `
      SELECT 
        c.customer_id, c.customer_id as id,
        c.company_name, c.company_name as name,
        c.contact_person, c.email, c.phone, c.vat_number,
        c.customer_type, c.status, c.created_at, c.updated_at,
        COALESCE(SUM(i.total_amount), 0) as total_invoiced,
        COALESCE(SUM(i.amount_paid), 0) as total_paid,
        COALESCE(SUM(i.total_amount - i.amount_paid), 0) as balance_due,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' 
          THEN i.total_amount - i.amount_paid ELSE 0 END), 0) as overdue_amount
      FROM ${this.fullTableName} c
      LEFT JOIN public.sales_invoices i ON i.customer_id = c.customer_id
      WHERE c.customer_id = $1
      GROUP BY c.customer_id
    `;

    const result = await this.rawQuery(ctx, sql, [customerId]);
    return result[0] || null;
  }

  /**
   * Get customers with outstanding balances
   */
  async getCustomersWithBalances(ctx: TenantContext): Promise<(Customer & CustomerBalance)[]> {
    const sql = `
      SELECT 
        c.customer_id, c.customer_id as id,
        c.company_name, c.company_name as name,
        c.contact_person, c.email, c.phone, c.vat_number,
        c.customer_type, c.status, c.created_at, c.updated_at,
        COALESCE(SUM(i.total_amount), 0) as total_invoiced,
        COALESCE(SUM(i.amount_paid), 0) as total_paid,
        COALESCE(SUM(i.total_amount - i.amount_paid), 0) as balance_due,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.status != 'paid' 
          THEN i.total_amount - i.amount_paid ELSE 0 END), 0) as overdue_amount
      FROM ${this.fullTableName} c
      LEFT JOIN public.sales_invoices i ON i.customer_id = c.customer_id
      WHERE c.status = 'active'
      GROUP BY c.customer_id
      HAVING COALESCE(SUM(i.total_amount - i.amount_paid), 0) > 0
      ORDER BY balance_due DESC
    `;

    return this.rawQuery(ctx, sql, []);
  }

  /**
   * Get overdue customers
   */
  async getOverdueCustomers(ctx: TenantContext): Promise<(Customer & { overdue_amount: number; oldest_overdue: Date })[]> {
    const sql = `
      SELECT 
        c.customer_id, c.customer_id as id,
        c.company_name, c.company_name as name,
        c.contact_person, c.email, c.phone, c.vat_number,
        c.customer_type, c.status, c.created_at, c.updated_at,
        SUM(i.total_amount - i.amount_paid) as overdue_amount,
        MIN(i.due_date) as oldest_overdue
      FROM ${this.fullTableName} c
      INNER JOIN public.sales_invoices i ON i.customer_id = c.customer_id
      WHERE i.due_date < CURRENT_DATE 
        AND i.status != 'paid'
      GROUP BY c.customer_id
      ORDER BY overdue_amount DESC
    `;

    return this.rawQuery(ctx, sql, []);
  }

  /**
   * Check if customer company name is unique
   */
  async isNameUnique(ctx: TenantContext, companyName: string, excludeId?: number): Promise<boolean> {
    const sql = excludeId 
      ? `SELECT customer_id FROM ${this.fullTableName} WHERE company_name = $1 AND customer_id != $2 LIMIT 1`
      : `SELECT customer_id FROM ${this.fullTableName} WHERE company_name = $1 LIMIT 1`;
    const params = excludeId ? [companyName, excludeId] : [companyName];
    const result = await this.rawQuery<{ customer_id: number }>(ctx, sql, params);
    return result.length === 0;
  }

  /**
   * Get customer by email
   */
  async findByEmail(ctx: TenantContext, email: string): Promise<Customer | null> {
    const sql = `
      SELECT customer_id, customer_id as id, company_name, company_name as name,
        contact_person, email, phone, vat_number, customer_type, status, created_at, updated_at
      FROM ${this.fullTableName}
      WHERE email = $1
      LIMIT 1
    `;
    const result = await this.rawQuery<Customer>(ctx, sql, [email]);
    return result[0] || null;
  }

  /**
   * Update customer credit limit
   */
  async updateCreditLimit(ctx: TenantContext, customerId: number, newLimit: number): Promise<Customer | null> {
    const sql = `
      UPDATE ${this.fullTableName} 
      SET credit_limit = $1, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $2
      RETURNING customer_id, customer_id as id, company_name, company_name as name,
        contact_person, email, phone, vat_number, customer_type, status, credit_limit, created_at, updated_at
    `;
    const result = await this.rawQuery<Customer>(ctx, sql, [newLimit, customerId]);
    return result[0] || null;
  }

  /**
   * Get top customers by revenue within invoices
   */
  async getTopCustomersByRevenue(ctx: TenantContext, limit: number = 5): Promise<Array<Customer & { revenue: number }>> {
    const sql = `
      SELECT 
        c.customer_id, c.customer_id as id,
        c.company_name, c.company_name as name,
        c.contact_person, c.email, c.phone, c.vat_number,
        c.customer_type, c.status, c.created_at, c.updated_at,
        COALESCE(SUM(i.total_amount), 0) AS revenue
      FROM ${this.fullTableName} c
      LEFT JOIN public.sales_invoices i ON i.customer_id = c.customer_id
      GROUP BY c.customer_id
      ORDER BY revenue DESC
      LIMIT $1
    `;

    return this.rawQuery(ctx, sql, [limit]);
  }
}

// Singleton instance
export const customerRepository = new CustomerRepository();
export default customerRepository;
