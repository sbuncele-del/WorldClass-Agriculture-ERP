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
 * Audit-Ready Workspace Controller
 * Provides aggregated data for the Audit-Ready Module dashboard
 */

/**
 * GET /api/audit/workspace
 * Returns all data needed for the Audit-Ready workspace dashboard
 */
export const getAuditWorkspace = async (req: TenantRequest, res: Response) => {
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
      auditTrailSummary,
      flaggedTransactions,
      documentStatus,
      userActivity,
      systemChanges,
      auditReadySummary,
    ] = await Promise.all([
      getAuditTrailSummary(tenantId),
      getFlaggedTransactions(tenantId),
      getDocumentStatus(tenantId),
      getUserActivity(tenantId),
      getSystemChanges(tenantId),
      getAuditReadySummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: auditReadySummary,
        audit_trail: auditTrailSummary,
        flagged_transactions: flaggedTransactions,
        documents: documentStatus,
        user_activity: userActivity,
        system_changes: systemChanges,
      },
    });
  } catch (error: any) {
    console.error('Audit workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch audit workspace data',
    });
  }
};

/**
 * Get audit trail summary by module
 */
async function getAuditTrailSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      module_name,
      COUNT(*) as event_count,
      COUNT(DISTINCT user_id) as unique_users,
      MAX(event_timestamp) as last_event
    FROM audit_trail
    WHERE tenant_id = $1 
      AND event_timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY module_name
    ORDER BY event_count DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get flagged transactions requiring review
 */
async function getFlaggedTransactions(tenantId: string) {
  const result = await query(
    `
    SELECT 
      at.id,
      at.event_timestamp,
      at.module_name,
      at.action_type,
      at.resource_type,
      at.resource_id,
      u.email as user_email,
      at.flag_reason,
      at.review_status
    FROM audit_trail at
    JOIN users u ON at.user_id = u.id
    WHERE at.tenant_id = $1 
      AND at.is_flagged = true
      AND at.review_status IN ('pending', 'in_review')
    ORDER BY at.event_timestamp DESC
    LIMIT 20
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get document retention status
 */
async function getDocumentStatus(tenantId: string) {
  const result = await query(
    `
    SELECT 
      document_type,
      COUNT(*) as document_count,
      COUNT(CASE WHEN retention_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_soon,
      COUNT(CASE WHEN retention_date < CURRENT_DATE THEN 1 END) as expired
    FROM audit_documents
    WHERE tenant_id = $1
    GROUP BY document_type
    ORDER BY document_count DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get user activity summary (last 24 hours)
 */
async function getUserActivity(tenantId: string) {
  const result = await query(
    `
    SELECT 
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      COUNT(at.id) as action_count,
      MAX(at.event_timestamp) as last_action,
      STRING_AGG(DISTINCT at.module_name, ', ') as modules_accessed
    FROM users u
    JOIN audit_trail at ON u.id = at.user_id
    WHERE at.tenant_id = $1 
      AND at.event_timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY u.id, u.email, u.first_name, u.last_name
    ORDER BY action_count DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent system configuration changes
 */
async function getSystemChanges(tenantId: string) {
  const result = await query(
    `
    SELECT 
      at.id,
      at.event_timestamp,
      at.action_type,
      at.resource_type,
      u.email as changed_by,
      at.change_summary,
      at.ip_address
    FROM audit_trail at
    JOIN users u ON at.user_id = u.id
    WHERE at.tenant_id = $1 
      AND at.resource_type IN ('settings', 'configuration', 'permissions', 'roles')
      AND at.action_type IN ('update', 'delete')
    ORDER BY at.event_timestamp DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get audit-ready summary metrics
 */
async function getAuditReadySummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT at.id) as total_events_7d,
      COUNT(CASE WHEN at.is_flagged = true THEN 1 END) as flagged_events,
      COUNT(DISTINCT at.user_id) as active_users,
      COUNT(DISTINCT CASE WHEN ad.retention_date <= CURRENT_DATE + INTERVAL '30 days' THEN ad.id END) as documents_expiring_soon,
      AVG(EXTRACT(EPOCH FROM (NOW() - at.event_timestamp))/3600) as avg_event_age_hours
    FROM audit_trail at
    LEFT JOIN audit_documents ad ON ad.tenant_id = $1
    WHERE at.tenant_id = $1 
      AND at.event_timestamp >= NOW() - INTERVAL '7 days'
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_events_7d: 0,
    flagged_events: 0,
    active_users: 0,
    documents_expiring_soon: 0,
    avg_event_age_hours: 0,
  };
}
