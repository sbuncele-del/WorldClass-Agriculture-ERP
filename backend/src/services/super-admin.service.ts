import pool from '../config/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Super Admin Service
 * 
 * Provides system-wide administration capabilities:
 * - Tenant management (list, view, suspend, activate, delete)
 * - User impersonation for support
 * - System statistics and analytics
 * - Feature flags management
 * - System health monitoring
 * 
 * Security: All endpoints should be protected by super admin auth
 */

interface TenantListFilter {
  status?: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  totalRevenue: number;
  newTenantsLast30Days: number;
  activeUsersLast7Days: number;
}

class SuperAdminService {
  /**
   * Get list of all tenants with filters
   */
  async getTenants(filters: TenantListFilter = {}) {
    const {
      status,
      plan,
      search,
      limit = 50,
      offset = 0
    } = filters;

    let query = `
      SELECT 
        t.id,
        t.name,
        t.email,
        t.status,
        t.subscription_plan,
        t.subscription_status,
        t.subscription_start_date,
        t.subscription_end_date,
        t.max_users,
        t.max_storage_gb,
        t.country,
        t.created_at,
        t.updated_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN u.id END) as active_users_7d
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (plan) {
      query += ` AND t.subscription_plan = $${paramCount}`;
      params.push(plan);
      paramCount++;
    }

    if (search) {
      query += ` AND (t.name ILIKE $${paramCount} OR t.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += `
      GROUP BY t.id
      ORDER BY t.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tenants WHERE 1=1';
    const countParams: any[] = [];
    let countParamIdx = 1;

    if (status) {
      countQuery += ` AND status = $${countParamIdx}`;
      countParams.push(status);
      countParamIdx++;
    }

    if (plan) {
      countQuery += ` AND subscription_plan = $${countParamIdx}`;
      countParams.push(plan);
      countParamIdx++;
    }

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIdx} OR email ILIKE $${countParamIdx})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      tenants: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  }

  /**
   * Get detailed tenant information
   */
  async getTenantDetails(tenantId: string) {
    const tenantResult = await pool.query(
      `SELECT 
        t.*,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '7 days' THEN u.id END) as active_users_7d,
        COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_users_30d
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.id = $1
      GROUP BY t.id`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = tenantResult.rows[0];

    // Get payment history
    const paymentsResult = await pool.query(
      `SELECT 
        id, amount, currency, status, payment_gateway, 
        transaction_reference, created_at
      FROM payment_transactions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [tenantId]
    );

    // Get recent users
    const usersResult = await pool.query(
      `SELECT 
        id, email, first_name, last_name, role, 
        is_active, last_login_at, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [tenantId]
    );

    // Get storage usage (placeholder - implement based on your storage tracking)
    const storageResult = await pool.query(
      `SELECT 
        COALESCE(SUM(file_size), 0) as total_storage
      FROM files
      WHERE tenant_id = $1`,
      [tenantId]
    );

    return {
      tenant,
      payments: paymentsResult.rows,
      users: usersResult.rows,
      storage: {
        used: parseInt(storageResult.rows[0]?.total_storage || 0),
        limit: tenant.max_storage_gb * 1024 * 1024 * 1024 // Convert GB to bytes
      }
    };
  }

  /**
   * Suspend a tenant account
   */
  async suspendTenant(tenantId: string, reason: string, suspendedBy: string) {
    await pool.query(
      `UPDATE tenants 
       SET status = 'suspended', 
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );

    // Log suspension
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        'tenant_suspended',
        'tenant',
        tenantId,
        JSON.stringify({ reason, suspended_by: suspendedBy }),
        'system'
      ]
    );

    return { success: true, message: 'Tenant suspended successfully' };
  }

  /**
   * Activate a suspended tenant
   */
  async activateTenant(tenantId: string, activatedBy: string) {
    await pool.query(
      `UPDATE tenants 
       SET status = 'active', 
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );

    // Log activation
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        'tenant_activated',
        'tenant',
        tenantId,
        JSON.stringify({ activated_by: activatedBy }),
        'system'
      ]
    );

    return { success: true, message: 'Tenant activated successfully' };
  }

  /**
   * Delete a tenant (soft delete - marks as deleted)
   */
  async deleteTenant(tenantId: string, deletedBy: string) {
    // Check if this is the demo tenant
    if (tenantId === '00000000-0000-0000-0000-000000000001') {
      throw new Error('Cannot delete demo tenant');
    }

    await pool.query(
      `UPDATE tenants 
       SET status = 'deleted', 
           deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [tenantId]
    );

    // Log deletion
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        'tenant_deleted',
        'tenant',
        tenantId,
        JSON.stringify({ deleted_by: deletedBy }),
        'system'
      ]
    );

    return { success: true, message: 'Tenant deleted successfully' };
  }

  /**
   * Generate impersonation token
   * Allows super admin to log in as any user for support purposes
   */
  async generateImpersonationToken(userId: string, adminEmail: string) {
    const userResult = await pool.query(
      `SELECT u.*, t.name as tenant_name 
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Generate impersonation token (8 hour expiry)
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        role: user.role,
        isImpersonating: true,
        impersonatedBy: adminEmail
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log impersonation
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.tenant_id,
        user.id,
        'user_impersonation',
        'user',
        user.id,
        JSON.stringify({
          impersonated_by: adminEmail,
          timestamp: new Date().toISOString()
        }),
        'system'
      ]
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name
      },
      expiresIn: '8h'
    };
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    // Total tenants by status
    const tenantsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended
      FROM tenants
      WHERE status != 'deleted'
    `);

    // Total users
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total FROM users
    `);

    // Total revenue (sum of successful payments)
    const revenueResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN currency = 'ZAR' THEN amount / 18.5 ELSE amount END) as total_usd
      FROM payment_transactions
      WHERE status = 'success'
    `);

    // New tenants last 30 days
    const newTenantsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM tenants
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status != 'deleted'
    `);

    // Active users last 7 days
    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM audit_log
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    const stats = tenantsResult.rows[0];

    return {
      totalTenants: parseInt(stats.total),
      activeTenants: parseInt(stats.active),
      trialTenants: parseInt(stats.trial),
      suspendedTenants: parseInt(stats.suspended),
      totalUsers: parseInt(usersResult.rows[0].total),
      totalRevenue: parseFloat(revenueResult.rows[0].total_usd || 0),
      newTenantsLast30Days: parseInt(newTenantsResult.rows[0].count),
      activeUsersLast7Days: parseInt(activeUsersResult.rows[0].count)
    };
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    // Database connection test
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    // Recent error count
    const errorsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM audit_log
      WHERE action LIKE '%error%'
        AND created_at >= NOW() - INTERVAL '1 hour'
    `);

    // Failed payments last 24 hours
    const failedPaymentsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM payment_transactions
      WHERE status = 'failed'
        AND created_at >= NOW() - INTERVAL '24 hours'
    `);

    // Active sessions (users logged in last hour)
    const activeSessionsResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM audit_log
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `);

    return {
      status: 'healthy',
      database: {
        connected: true,
        latency: dbLatency
      },
      errors: {
        lastHour: parseInt(errorsResult.rows[0].count)
      },
      payments: {
        failedLast24h: parseInt(failedPaymentsResult.rows[0].count)
      },
      activeSessions: parseInt(activeSessionsResult.rows[0].count),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get feature flags (for gradual rollout)
   */
  async getFeatureFlags() {
    const result = await pool.query(`
      SELECT * FROM feature_flags
      ORDER BY name
    `);

    return result.rows;
  }

  /**
   * Update feature flag
   */
  async updateFeatureFlag(name: string, enabled: boolean, rolloutPercentage: number = 100) {
    await pool.query(`
      INSERT INTO feature_flags (name, enabled, rollout_percentage, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (name) 
      DO UPDATE SET 
        enabled = $2,
        rollout_percentage = $3,
        updated_at = NOW()
    `, [name, enabled, rolloutPercentage]);

    return { success: true, message: 'Feature flag updated' };
  }

  /**
   * Get recent audit logs (system-wide)
   */
  async getAuditLogs(limit: number = 100, offset: number = 0) {
    const result = await pool.query(`
      SELECT 
        a.id,
        a.tenant_id,
        a.user_id,
        a.action,
        a.resource_type,
        a.resource_id,
        a.details,
        a.ip_address,
        a.created_at,
        t.name as tenant_name,
        u.email as user_email
      FROM audit_log a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) as total FROM audit_log');

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  }
}

export default new SuperAdminService();
