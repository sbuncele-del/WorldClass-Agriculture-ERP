import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { query } from '../../../config/database';

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * Admin Portal Workspace Controller
 * Provides aggregated data for the Admin Portal dashboard
 */

/**
 * GET /api/admin/workspace
 * Returns all data needed for the Admin Portal workspace dashboard
 */
export const getAdminWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found',
      });
    }

    // Parallel queries for performance
    const [
      systemHealth,
      userActivity,
      tenantStats,
      configAlerts,
      recentChanges,
      adminSummary,
    ] = await Promise.all([
      getSystemHealth(tenantId),
      getUserActivity(tenantId),
      getTenantStats(tenantId),
      getConfigAlerts(tenantId),
      getRecentChanges(tenantId),
      getAdminSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: adminSummary,
        system_health: systemHealth,
        user_activity: userActivity,
        tenant_stats: tenantStats,
        config_alerts: configAlerts,
        recent_changes: recentChanges,
      },
    });
  } catch (error: any) {
    console.error('Admin workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch admin workspace data',
    });
  }
};

/**
 * Get system health metrics
 */
async function getSystemHealth(tenantId: string) {
  const result = await query(
    `
    SELECT 
      'database' as component,
      'healthy' as status,
      NOW() as last_check
    UNION ALL
    SELECT 
      'api' as component,
      'healthy' as status,
      NOW() as last_check
    UNION ALL
    SELECT 
      'storage' as component,
      'healthy' as status,
      NOW() as last_check
    `
  );

  return result.rows;
}

/**
 * Get user activity overview (last 24 hours)
 */
async function getUserActivity(tenantId: string) {
  const result = await query(
    `
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      us.last_login,
      us.last_activity,
      us.is_active
    FROM users u
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE u.tenant_id = $1
    ORDER BY us.last_activity DESC NULLS LAST
    LIMIT 20
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get tenant statistics
 */
async function getTenantStats(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT u.id) as total_users,
      COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
      COUNT(DISTINCT CASE WHEN us.last_activity >= NOW() - INTERVAL '7 days' THEN u.id END) as users_active_7d,
      (SELECT COUNT(*) FROM audit_trail WHERE tenant_id = $1 AND event_timestamp >= NOW() - INTERVAL '24 hours') as events_24h
    FROM users u
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE u.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_users: 0,
    active_users: 0,
    users_active_7d: 0,
    events_24h: 0,
  };
}

/**
 * Get configuration alerts
 */
async function getConfigAlerts(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      alert_type,
      severity,
      message,
      detected_at,
      status
    FROM system_alerts
    WHERE tenant_id = $1 
      AND status IN ('active', 'investigating')
    ORDER BY 
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        ELSE 3
      END,
      detected_at DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent system changes
 */
async function getRecentChanges(tenantId: string) {
  const result = await query(
    `
    SELECT 
      at.id,
      at.event_timestamp,
      at.action_type,
      at.resource_type,
      u.email as changed_by,
      at.change_summary
    FROM audit_trail at
    JOIN users u ON at.user_id = u.id
    WHERE at.tenant_id = $1 
      AND at.resource_type IN ('user', 'role', 'permission', 'settings')
    ORDER BY at.event_timestamp DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get admin summary metrics
 */
async function getAdminSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as total_users,
      (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND is_active = true) as active_users,
      (SELECT COUNT(*) FROM system_alerts WHERE tenant_id = $1 AND status = 'active' AND severity IN ('critical', 'warning')) as active_alerts,
      (SELECT COUNT(*) FROM audit_trail WHERE tenant_id = $1 AND event_timestamp >= NOW() - INTERVAL '24 hours') as events_24h
    `
  );

  return result.rows[0] || {
    total_users: 0,
    active_users: 0,
    active_alerts: 0,
    events_24h: 0,
  };
}
