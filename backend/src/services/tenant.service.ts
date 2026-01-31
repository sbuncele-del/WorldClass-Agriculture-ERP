import { pool as sharedPool } from '../config/database';
import { Tenant, SignupData, ConflictError, NotFoundError, ValidationError } from '../types';

// Use shared pool from config/database.ts - single pool for entire application
function getPool() {
  return sharedPool;
}

export class TenantService {
  /**
   * Get tenant by ID
   */
  static async getById(tenantId: string): Promise<Tenant | null> {
    const result = await getPool().query(
      'SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL',
      [tenantId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get tenant by slug
   */
  static async getBySlug(slug: string): Promise<Tenant | null> {
    const result = await getPool().query(
      'SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    );

    return result.rows[0] || null;
  }

  /**
   * Check if slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    const result = await getPool().query(
      'SELECT id FROM tenants WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    );

    return result.rows.length === 0;
  }

  /**
   * Generate unique slug from company name
   */
  static async generateSlug(companyName: string): Promise<string> {
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    let baseSlug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists, if so, append number
    while (!(await this.isSlugAvailable(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Create new tenant (company signup)
   */
  static async create(data: Partial<Tenant>): Promise<Tenant> {
    const client = await getPool().connect();

    try {
      await client.query('BEGIN');

      // Validate slug is available
      if (data.slug) {
        const isAvailable = await this.isSlugAvailable(data.slug);
        if (!isAvailable) {
          throw new ConflictError('Company slug already exists');
        }
      }

      // Insert tenant
      const result = await client.query(
        `INSERT INTO tenants (
          name, slug, status, subscription_plan, subscription_status,
          trial_ends_at, billing_email, billing_cycle, max_users, max_storage_gb,
          features, settings, company_info
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *`,
        [
          data.name,
          data.slug,
          data.status || 'trial',
          data.subscription_plan || 'starter',
          data.subscription_status || 'trialing',
          data.trial_ends_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          data.billing_email,
          data.billing_cycle || 'monthly',
          data.max_users || 5,
          data.max_storage_gb || 5,
          data.features || {
            ai_automation: false,
            multi_currency: false,
            advanced_reporting: false,
            api_access: false,
            custom_branding: false
          },
          data.settings || {
            currency: 'ZAR',
            date_format: 'DD/MM/YYYY',
            timezone: 'Africa/Johannesburg',
            financial_year_end: '02-28'
          },
          data.company_info || {
            country: 'ZA'
          }
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update tenant
   */
  static async update(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    const existing = await this.getById(tenantId);
    if (!existing) {
      throw new NotFoundError('Tenant not found');
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.subscription_plan !== undefined) {
      updates.push(`subscription_plan = $${paramCount++}`);
      values.push(data.subscription_plan);
    }
    if (data.subscription_status !== undefined) {
      updates.push(`subscription_status = $${paramCount++}`);
      values.push(data.subscription_status);
    }
    if (data.billing_email !== undefined) {
      updates.push(`billing_email = $${paramCount++}`);
      values.push(data.billing_email);
    }
    if (data.max_users !== undefined) {
      updates.push(`max_users = $${paramCount++}`);
      values.push(data.max_users);
    }
    if (data.features !== undefined) {
      updates.push(`features = $${paramCount++}`);
      values.push(data.features);
    }
    if (data.settings !== undefined) {
      updates.push(`settings = $${paramCount++}`);
      values.push(data.settings);
    }
    if (data.company_info !== undefined) {
      updates.push(`company_info = $${paramCount++}`);
      values.push(data.company_info);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push(`updated_at = NOW()`);
    values.push(tenantId);

    const result = await getPool().query(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Suspend tenant (non-payment, abuse, etc.)
   */
  static async suspend(tenantId: string, reason?: string): Promise<Tenant> {
    const result = await getPool().query(
      `UPDATE tenants 
       SET status = 'suspended', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tenant not found');
    }

    // Log the suspension
    await getPool().query(
      `INSERT INTO audit_log (tenant_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'tenant_suspended', 'tenant', $1, $2)`,
      [tenantId, JSON.stringify({ reason })]
    );

    return result.rows[0];
  }

  /**
   * Reactivate suspended tenant
   */
  static async reactivate(tenantId: string): Promise<Tenant> {
    const result = await getPool().query(
      `UPDATE tenants 
       SET status = 'active', updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tenant not found');
    }

    // Log the reactivation
    await getPool().query(
      `INSERT INTO audit_log (tenant_id, action, resource_type, resource_id)
       VALUES ($1, 'tenant_reactivated', 'tenant', $1)`,
      [tenantId]
    );

    return result.rows[0];
  }

  /**
   * Soft delete tenant
   */
  static async delete(tenantId: string): Promise<void> {
    const result = await getPool().query(
      `UPDATE tenants 
       SET status = 'deleted', deleted_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Tenant not found');
    }

    // Log the deletion
    await getPool().query(
      `INSERT INTO audit_log (tenant_id, action, resource_type, resource_id)
       VALUES ($1, 'tenant_deleted', 'tenant', $1)`,
      [tenantId]
    );
  }

  /**
   * Get all tenants (super admin only)
   */
  static async getAll(filters?: {
    status?: string;
    subscription_plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    let query = 'SELECT * FROM tenants WHERE deleted_at IS NULL';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      query += ` AND status = $${paramCount++}`;
      values.push(filters.status);
    }

    if (filters?.subscription_plan) {
      query += ` AND subscription_plan = $${paramCount++}`;
      values.push(filters.subscription_plan);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ` LIMIT $${paramCount++}`;
      values.push(filters.limit);
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramCount++}`;
      values.push(filters.offset);
    }

    const [tenantsResult, countResult] = await Promise.all([
      getPool().query(query, values),
      getPool().query('SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL')
    ]);

    return {
      tenants: tenantsResult.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  /**
   * Get tenant statistics
   */
  static async getStats(tenantId: string): Promise<any> {
    const [userCount, invoiceCount, customerCount, storageUsed] = await Promise.all([
      getPool().query('SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND deleted_at IS NULL', [tenantId]),
      getPool().query('SELECT COUNT(*) FROM invoices WHERE tenant_id = $1', [tenantId]),
      getPool().query('SELECT COUNT(*) FROM customers WHERE tenant_id = $1', [tenantId]),
      // Placeholder for storage calculation
      Promise.resolve({ rows: [{ sum: 0 }] })
    ]);

    return {
      users: parseInt(userCount.rows[0].count),
      invoices: parseInt(invoiceCount.rows[0].count),
      customers: parseInt(customerCount.rows[0].count),
      storageUsedMb: parseFloat(String(storageUsed.rows[0].sum)) || 0
    };
  }

  /**
   * Check if tenant can add more users
   */
  static async canAddUser(tenantId: string): Promise<boolean> {
    const tenant = await this.getById(tenantId);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const userCount = await getPool().query(
      'SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND deleted_at IS NULL',
      [tenantId]
    );

    const currentUsers = parseInt(userCount.rows[0].count);
    return currentUsers < tenant.max_users;
  }

  /**
   * Extend trial period
   */
  static async extendTrial(tenantId: string, days: number): Promise<Tenant> {
    const result = await getPool().query(
      `UPDATE tenants 
       SET trial_ends_at = trial_ends_at + INTERVAL '${days} days',
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tenant not found');
    }

    return result.rows[0];
  }

  /**
   * Activate subscription (after payment)
   */
  static async activateSubscription(tenantId: string, plan: string): Promise<Tenant> {
    const result = await getPool().query(
      `UPDATE tenants 
       SET status = 'active',
           subscription_status = 'active',
           subscription_plan = $2,
           subscription_starts_at = NOW(),
           next_billing_date = NOW() + INTERVAL '1 month',
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [tenantId, plan]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Tenant not found');
    }

    return result.rows[0];
  }

  /**
   * Get platform-wide statistics (super admin)
   */
  static async getPlatformStats(): Promise<any> {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      totalUsers,
      todaySignups
    ] = await Promise.all([
      getPool().query('SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL'),
      getPool().query('SELECT COUNT(*) FROM tenants WHERE status = $1 AND deleted_at IS NULL', ['active']),
      getPool().query('SELECT COUNT(*) FROM tenants WHERE status = $1 AND deleted_at IS NULL', ['trial']),
      getPool().query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
      getPool().query('SELECT COUNT(*) FROM tenants WHERE DATE(created_at) = CURRENT_DATE')
    ]);

    return {
      totalTenants: parseInt(totalTenants.rows[0].count),
      activeTenants: parseInt(activeTenants.rows[0].count),
      trialTenants: parseInt(trialTenants.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      todaySignups: parseInt(todaySignups.rows[0].count)
    };
  }
}

export default TenantService;
