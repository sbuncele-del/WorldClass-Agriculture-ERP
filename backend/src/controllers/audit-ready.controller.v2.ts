/**
 * Audit Ready Controller V2
 * Tenant-hardened API for audit management
 * 
 * Features:
 * - Audit engagements
 * - Audit findings & corrective actions
 * - Evidence repository
 * - Audit checklists
 * - Permanent records
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// AUDIT ENGAGEMENTS
// ============================================================================

/**
 * Get audit engagements
 */
export const getEngagements = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { auditType, status, fiscalYear, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ae.*,
             act.template_name,
             act.framework,
             COUNT(af.finding_id) as total_findings_count
      FROM audit_engagements ae
      LEFT JOIN audit_checklist_templates act ON ae.template_id = act.template_id
      LEFT JOIN audit_findings af ON ae.engagement_id = af.engagement_id
      WHERE ae.tenant_id = $1 AND ae.is_archived = false
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (auditType) {
      query += ` AND ae.audit_type = $${paramIndex}`;
      params.push(auditType);
      paramIndex++;
    }

    if (status) {
      query += ` AND ae.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fiscalYear) {
      query += ` AND ae.fiscal_year = $${paramIndex}`;
      params.push(fiscalYear);
      paramIndex++;
    }

    query += ` GROUP BY ae.engagement_id, act.template_name, act.framework
               ORDER BY ae.planning_start_date DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_engagements WHERE tenant_id = $1 AND is_archived = false`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        engagements: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get engagements error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit engagements' });
  }
};

/**
 * Get engagement by ID
 */
export const getEngagementById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ae.*, act.template_name, act.framework
       FROM audit_engagements ae
       LEFT JOIN audit_checklist_templates act ON ae.template_id = act.template_id
       WHERE ae.engagement_id = $1 AND ae.tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Audit engagement not found' });
    }

    // Get findings summary
    const findingsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_findings,
         COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_findings,
         COUNT(*) FILTER (WHERE severity = 'HIGH') as high_findings,
         COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_findings,
         COUNT(*) FILTER (WHERE severity = 'LOW') as low_findings
       FROM audit_findings
       WHERE engagement_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        engagement: result.rows[0],
        findingsSummary: findingsResult.rows[0]
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get engagement error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit engagement' });
  }
};

/**
 * Create audit engagement
 */
export const createEngagement = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      auditType, templateId, entityName, auditPeriodStart, auditPeriodEnd,
      fiscalYear, leadAuditorId, leadAuditorName, planningStartDate
    } = req.body;

    if (!auditType || !entityName || !auditPeriodStart || !auditPeriodEnd) {
      return res.status(400).json({ success: false, error: 'Audit type, entity name, and audit period are required' });
    }

    // Generate engagement number
    const numberResult = await pool.query(
      `SELECT COUNT(*) as count FROM audit_engagements 
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM audit_period_start) = $2`,
      [tenantId, new Date(auditPeriodStart).getFullYear()]
    );
    const engagementNumber = `AUD-${new Date(auditPeriodStart).getFullYear()}-${String(parseInt(numberResult.rows[0].count) + 1).padStart(4, '0')}`;

    const result = await pool.query(
      `INSERT INTO audit_engagements (
         tenant_id, engagement_number, audit_type, template_id,
         entity_name, audit_period_start, audit_period_end, fiscal_year,
         lead_auditor_id, lead_auditor_name, planning_start_date, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [tenantId, engagementNumber, auditType, templateId, entityName, 
       auditPeriodStart, auditPeriodEnd, fiscalYear, leadAuditorId, 
       leadAuditorName, planningStartDate, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create engagement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create audit engagement' });
  }
};

/**
 * Update engagement status
 */
export const updateEngagementStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, completionPercentage } = req.body;

    const result = await pool.query(
      `UPDATE audit_engagements
       SET status = COALESCE($1, status),
           completion_percentage = COALESCE($2, completion_percentage),
           updated_at = CURRENT_TIMESTAMP
       WHERE engagement_id = $3 AND tenant_id = $4
       RETURNING *`,
      [status, completionPercentage, id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Audit engagement not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update engagement status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update engagement status' });
  }
};

// ============================================================================
// AUDIT FINDINGS
// ============================================================================

/**
 * Get audit findings
 */
export const getFindings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { engagementId, severity, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT af.*, ae.engagement_number, ae.entity_name, aci.item_title as checklist_item_title
      FROM audit_findings af
      JOIN audit_engagements ae ON af.engagement_id = ae.engagement_id
      LEFT JOIN audit_checklist_items aci ON af.checklist_item_id = aci.item_id
      WHERE ae.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (engagementId) {
      query += ` AND af.engagement_id = $${paramIndex}`;
      params.push(engagementId);
      paramIndex++;
    }

    if (severity) {
      query += ` AND af.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (status) {
      query += ` AND af.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY 
                CASE af.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
                af.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        findings: result.rows,
        total: result.rows.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get findings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit findings' });
  }
};

/**
 * Create audit finding
 */
export const createFinding = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      engagementId, findingType, severity, title, description,
      areaAffected, rootCause, impactDescription, financialImpact,
      auditorRecommendation, responsiblePersonId, targetResolutionDate
    } = req.body;

    if (!engagementId || !findingType || !title || !description || !auditorRecommendation) {
      return res.status(400).json({ success: false, error: 'Engagement ID, finding type, title, description, and recommendation are required' });
    }

    // Verify engagement belongs to tenant
    const engagementCheck = await pool.query(
      `SELECT engagement_id FROM audit_engagements WHERE engagement_id = $1 AND tenant_id = $2`,
      [engagementId, tenantId]
    );

    if (engagementCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Audit engagement not found' });
    }

    // Generate finding number
    const numberResult = await pool.query(
      `SELECT COUNT(*) as count FROM audit_findings WHERE engagement_id = $1`,
      [engagementId]
    );
    const findingNumber = `F-${String(parseInt(numberResult.rows[0].count) + 1).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO audit_findings (
         engagement_id, finding_number, finding_type, severity,
         title, description, area_affected, root_cause, impact_description,
         financial_impact, auditor_recommendation, responsible_person_id,
         target_resolution_date, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [engagementId, findingNumber, findingType, severity || 'MEDIUM',
       title, description, areaAffected, rootCause, impactDescription,
       financialImpact, auditorRecommendation, responsiblePersonId,
       targetResolutionDate, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create finding error:', error);
    res.status(500).json({ success: false, error: 'Failed to create audit finding' });
  }
};

/**
 * Update finding
 */
export const updateFinding = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, managementResponse, correctiveActionPlan, actualResolutionDate, followUpNotes } = req.body;

    // Verify finding belongs to tenant's engagement
    const findingCheck = await pool.query(
      `SELECT af.finding_id FROM audit_findings af
       JOIN audit_engagements ae ON af.engagement_id = ae.engagement_id
       WHERE af.finding_id = $1 AND ae.tenant_id = $2`,
      [id, tenantId]
    );

    if (findingCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Audit finding not found' });
    }

    const result = await pool.query(
      `UPDATE audit_findings
       SET status = COALESCE($1, status),
           management_response = COALESCE($2, management_response),
           corrective_action_plan = COALESCE($3, corrective_action_plan),
           actual_resolution_date = COALESCE($4, actual_resolution_date),
           follow_up_notes = COALESCE($5, follow_up_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE finding_id = $6
       RETURNING *`,
      [status, managementResponse, correctiveActionPlan, actualResolutionDate, followUpNotes, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update finding error:', error);
    res.status(500).json({ success: false, error: 'Failed to update finding' });
  }
};

// ============================================================================
// AUDIT EVIDENCE
// ============================================================================

/**
 * Get audit evidence
 */
export const getEvidence = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { engagementId, evidenceType } = req.query;

    let query = `
      SELECT aev.* FROM audit_evidence aev
      JOIN audit_engagements ae ON aev.engagement_id = ae.engagement_id
      WHERE ae.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (engagementId) {
      query += ` AND aev.engagement_id = $${paramIndex}`;
      params.push(engagementId);
      paramIndex++;
    }

    if (evidenceType) {
      query += ` AND aev.evidence_type = $${paramIndex}`;
      params.push(evidenceType);
      paramIndex++;
    }

    query += ` ORDER BY aev.collection_date DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get evidence error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit evidence' });
  }
};

/**
 * Add audit evidence
 */
export const addEvidence = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const userName = req.user?.first_name 
      ? `${req.user.first_name} ${req.user.last_name || ''}`.trim()
      : req.user?.email || 'Unknown';
    const {
      engagementId, evidenceType, description, source,
      collectionDate, documentUrl, attachments, reliability, sufficiency
    } = req.body;

    if (!engagementId || !evidenceType || !description || !collectionDate) {
      return res.status(400).json({ success: false, error: 'Engagement ID, evidence type, description, and collection date are required' });
    }

    // Verify engagement belongs to tenant
    const engagementCheck = await pool.query(
      `SELECT engagement_id FROM audit_engagements WHERE engagement_id = $1 AND tenant_id = $2`,
      [engagementId, tenantId]
    );

    if (engagementCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Audit engagement not found' });
    }

    // Generate evidence number
    const numberResult = await pool.query(
      `SELECT COUNT(*) as count FROM audit_evidence WHERE engagement_id = $1`,
      [engagementId]
    );
    const evidenceNumber = `EV-${String(parseInt(numberResult.rows[0].count) + 1).padStart(3, '0')}`;

    const result = await pool.query(
      `INSERT INTO audit_evidence (
         engagement_id, evidence_number, evidence_type, description, source,
         collection_date, document_url, attachments, reliability, sufficiency,
         collected_by, collected_by_name
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [engagementId, evidenceNumber, evidenceType, description, source,
       collectionDate, documentUrl, attachments, reliability || 'HIGH', sufficiency || 'SUFFICIENT',
       userId, userName]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Add evidence error:', error);
    res.status(500).json({ success: false, error: 'Failed to add audit evidence' });
  }
};

// ============================================================================
// CHECKLISTS
// ============================================================================

/**
 * Get checklist templates
 */
export const getChecklistTemplates = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant
    const { auditType, framework } = req.query;

    let query = `
      SELECT act.*, COUNT(aci.item_id) as item_count
      FROM audit_checklist_templates act
      LEFT JOIN audit_checklist_items aci ON act.template_id = aci.template_id
      WHERE act.is_active = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (auditType) {
      query += ` AND act.audit_type = $${paramIndex}`;
      params.push(auditType);
      paramIndex++;
    }

    if (framework) {
      query += ` AND act.framework = $${paramIndex}`;
      params.push(framework);
      paramIndex++;
    }

    query += ` GROUP BY act.template_id ORDER BY act.template_name`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get checklist templates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch checklist templates' });
  }
};

/**
 * Get checklist items
 */
export const getChecklistItems = async (req: TenantRequest, res: Response) => {
  try {
    getTenantContext(req); // Verify tenant
    const { templateId } = req.params;

    const result = await pool.query(
      `SELECT * FROM audit_checklist_items
       WHERE template_id = $1 AND is_active = true
       ORDER BY display_order, item_number`,
      [templateId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get checklist items error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch checklist items' });
  }
};

// ============================================================================
// PERMANENT RECORDS
// ============================================================================

/**
 * Get permanent records
 */
export const getPermanentRecords = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { entityId, recordType } = req.query;

    let query = `SELECT * FROM audit_permanent_records WHERE tenant_id = $1 AND is_active = true`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (entityId) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entityId);
      paramIndex++;
    }

    if (recordType) {
      query += ` AND record_type = $${paramIndex}`;
      params.push(recordType);
      paramIndex++;
    }

    query += ` ORDER BY issue_date DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get permanent records error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch permanent records' });
  }
};

/**
 * Add permanent record
 */
export const addPermanentRecord = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      entityId, recordType, documentTitle, documentDescription,
      documentUrl, documentHash, issueDate, expiryDate, retentionYears
    } = req.body;

    if (!entityId || !recordType || !documentTitle) {
      return res.status(400).json({ success: false, error: 'Entity ID, record type, and document title are required' });
    }

    const result = await pool.query(
      `INSERT INTO audit_permanent_records (
         tenant_id, entity_id, record_type, document_title, document_description,
         document_url, document_hash, issue_date, expiry_date, retention_years, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [tenantId, entityId, recordType, documentTitle, documentDescription,
       documentUrl, documentHash, issueDate, expiryDate, retentionYears, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Add permanent record error:', error);
    res.status(500).json({ success: false, error: 'Failed to add permanent record' });
  }
};

/**
 * Get audit readiness dashboard
 */
export const getAuditReadyDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get engagement stats
    const engagementStats = await pool.query(
      `SELECT 
         COUNT(*) as total_engagements,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM audit_engagements
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get findings summary
    const findingsStats = await pool.query(
      `SELECT 
         COUNT(*) as total_findings,
         SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
         SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high,
         SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium,
         SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low,
         SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_findings,
         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_findings
       FROM audit_findings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get recent activity
    const recentEngagements = await pool.query(
      `SELECT * FROM audit_engagements
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [tenantId]
    );

    // Calculate readiness score
    const findings = findingsStats.rows[0];
    const openCritical = parseInt(findings.critical || '0');
    const openHigh = parseInt(findings.high || '0');
    const totalFindings = parseInt(findings.total_findings || '0');
    const resolvedFindings = parseInt(findings.resolved_findings || '0');
    
    let readinessScore = 100;
    if (totalFindings > 0) {
      readinessScore = Math.max(0, Math.round(
        ((resolvedFindings / totalFindings) * 100) - (openCritical * 10) - (openHigh * 5)
      ));
    }

    res.json({
      success: true,
      data: {
        readinessScore,
        engagements: engagementStats.rows[0],
        findings: findingsStats.rows[0],
        recentEngagements: recentEngagements.rows
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get audit ready dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit readiness dashboard' });
  }
};

export default {
  // Engagements
  getEngagements,
  getEngagementById,
  createEngagement,
  updateEngagementStatus,
  // Findings
  getFindings,
  createFinding,
  updateFinding,
  // Evidence
  getEvidence,
  addEvidence,
  // Checklists
  getChecklistTemplates,
  getChecklistItems,
  // Permanent Records
  getPermanentRecords,
  addPermanentRecord,
  // Dashboard
  getAuditReadyDashboard
};
