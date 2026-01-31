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
 * Compliance Workspace Controller
 * Provides aggregated data for the Compliance Framework dashboard
 */

/**
 * GET /api/compliance/workspace
 * Returns all data needed for the Compliance Framework workspace dashboard
 */
export const getComplianceWorkspace = async (req: TenantRequest, res: Response) => {
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
      complianceScore,
      pendingAudits,
      policyUpdates,
      riskAlerts,
      complianceHistory,
      complianceSummary,
    ] = await Promise.all([
      getComplianceScore(tenantId),
      getPendingAudits(tenantId),
      getPolicyUpdates(tenantId),
      getRiskAlerts(tenantId),
      getComplianceHistory(tenantId),
      getComplianceSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: complianceSummary,
        compliance_score: complianceScore,
        pending_audits: pendingAudits,
        policy_updates: policyUpdates,
        risk_alerts: riskAlerts,
        history: complianceHistory,
      },
    });
  } catch (error: any) {
    console.error('Compliance workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch compliance workspace data',
    });
  }
};

/**
 * Get overall compliance score
 */
async function getComplianceScore(tenantId: string) {
  const result = await query(
    `
    SELECT 
      framework_name,
      compliance_percentage,
      last_assessment_date,
      status
    FROM compliance_frameworks
    WHERE tenant_id = $1 AND is_active = true
    ORDER BY compliance_percentage ASC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get pending audits
 */
async function getPendingAudits(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      audit_name,
      audit_type,
      scheduled_date,
      status,
      auditor,
      scope
    FROM compliance_audits
    WHERE tenant_id = $1 
      AND status IN ('scheduled', 'in_progress')
    ORDER BY scheduled_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent policy updates
 */
async function getPolicyUpdates(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      policy_name,
      policy_version,
      effective_date,
      status,
      last_review_date,
      next_review_date
    FROM compliance_policies
    WHERE tenant_id = $1
    ORDER BY effective_date DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get active risk alerts
 */
async function getRiskAlerts(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      risk_category,
      risk_level,
      description,
      detected_date,
      status,
      mitigation_plan
    FROM compliance_risks
    WHERE tenant_id = $1 
      AND status IN ('open', 'investigating')
      AND risk_level IN ('high', 'critical')
    ORDER BY 
      CASE risk_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        ELSE 3
      END,
      detected_date DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get compliance history (last 6 months)
 */
async function getComplianceHistory(tenantId: string) {
  const result = await query(
    `
    SELECT 
      DATE_TRUNC('month', assessment_date) as month,
      AVG(compliance_percentage) as avg_compliance,
      COUNT(*) as assessment_count
    FROM compliance_assessments
    WHERE tenant_id = $1 
      AND assessment_date >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', assessment_date)
    ORDER BY month DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get compliance summary metrics
 */
async function getComplianceSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT cf.id) as active_frameworks,
      AVG(cf.compliance_percentage) as overall_compliance,
      COUNT(CASE WHEN ca.status IN ('scheduled', 'in_progress') THEN 1 END) as pending_audits,
      COUNT(CASE WHEN cr.status IN ('open', 'investigating') AND cr.risk_level IN ('high', 'critical') THEN 1 END) as critical_risks,
      COUNT(CASE WHEN cp.next_review_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as policies_due_review
    FROM compliance_frameworks cf
    LEFT JOIN compliance_audits ca ON ca.tenant_id = $1
    LEFT JOIN compliance_risks cr ON cr.tenant_id = $1
    LEFT JOIN compliance_policies cp ON cp.tenant_id = $1
    WHERE cf.tenant_id = $1 AND cf.is_active = true
    `,
    [tenantId]
  );

  return result.rows[0] || {
    active_frameworks: 0,
    overall_compliance: 0,
    pending_audits: 0,
    critical_risks: 0,
    policies_due_review: 0,
  };
}
