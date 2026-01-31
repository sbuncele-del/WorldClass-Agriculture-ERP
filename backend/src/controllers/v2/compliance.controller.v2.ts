/**
 * Compliance & Governance Controller V2
 * 
 * Tenant-hardened compliance management including:
 * - Regulatory frameworks & requirements
 * - Risk management & register
 * - Policy management & acknowledgments
 * - Incident tracking
 * - Training management
 */

import { Request, Response } from 'express';
import { pool } from '../../config/database';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

// ============================================================================
// REGULATORY FRAMEWORKS
// ============================================================================

/**
 * Get regulatory frameworks
 * GET /api/v2/compliance/frameworks
 */
export async function getRegulatoryFrameworks(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { jurisdiction, category, active } = req.query;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (jurisdiction) {
      whereConditions.push(`jurisdiction = $${paramIndex++}`);
      queryParams.push(jurisdiction);
    }

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex++}`);
      queryParams.push(active === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT * FROM regulatory_frameworks 
      ${whereClause}
      ORDER BY category, framework_name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        frameworks: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get frameworks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch regulatory frameworks' });
  }
}

// ============================================================================
// COMPLIANCE REQUIREMENTS
// ============================================================================

/**
 * Get compliance requirements
 * GET /api/v2/compliance/requirements
 */
export async function getComplianceRequirements(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { frameworkId, criticality, active, limit = '50', offset = '0' } = req.query;

    const whereConditions: string[] = ['cr.tenant_id = $1'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (frameworkId) {
      whereConditions.push(`cr.framework_id = $${paramIndex++}`);
      queryParams.push(frameworkId);
    }

    if (criticality) {
      whereConditions.push(`cr.criticality = $${paramIndex++}`);
      queryParams.push(criticality);
    }

    if (active !== undefined) {
      whereConditions.push(`cr.is_active = $${paramIndex++}`);
      queryParams.push(active === 'true');
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        cr.*,
        rf.framework_name,
        rf.framework_code,
        rf.category as framework_category
      FROM compliance_requirements cr
      JOIN regulatory_frameworks rf ON cr.framework_id = rf.framework_id
      WHERE ${whereClause}
      ORDER BY cr.criticality DESC, cr.due_date
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM compliance_requirements cr WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: {
        requirements: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get requirements error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance requirements' });
  }
}

// ============================================================================
// COMPLIANCE STATUS
// ============================================================================

/**
 * Get compliance status records
 * GET /api/v2/compliance/status
 */
export async function getComplianceStatus(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { requirementId, status, period } = req.query;

    const whereConditions: string[] = ['cs.tenant_id = $1'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (requirementId) {
      whereConditions.push(`cs.requirement_id = $${paramIndex++}`);
      queryParams.push(requirementId);
    }

    if (status) {
      whereConditions.push(`cs.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (period) {
      whereConditions.push(`cs.compliance_period = $${paramIndex++}`);
      queryParams.push(period);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        cs.*,
        cr.requirement_name,
        cr.criticality,
        rf.framework_name
      FROM compliance_status cs
      JOIN compliance_requirements cr ON cs.requirement_id = cr.requirement_id
      JOIN regulatory_frameworks rf ON cr.framework_id = rf.framework_id
      WHERE ${whereClause}
      ORDER BY cs.due_date
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        statusRecords: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch compliance status' });
  }
}

/**
 * Update compliance status
 * PUT /api/v2/compliance/status/:id
 */
export async function updateComplianceStatus(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    const { status, completionPercentage, completedDate, notes, evidenceDocuments } = req.body;

    const query = `
      UPDATE compliance_status
      SET 
        status = COALESCE($1, status),
        completion_percentage = COALESCE($2, completion_percentage),
        completed_date = COALESCE($3, completed_date),
        notes = COALESCE($4, notes),
        evidence_documents = COALESCE($5, evidence_documents),
        reviewed_by = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE status_id = $7
      RETURNING *
    `;

    const result = await pool.query(query, [
      status, completionPercentage, completedDate, notes,
      evidenceDocuments, userId, id
    ]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Compliance status record not found' });
      return;
    }

    res.json({
      success: true,
      data: { statusRecord: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update compliance status' });
  }
}

// ============================================================================
// RISK MANAGEMENT
// ============================================================================

/**
 * Get risk register
 * GET /api/v2/compliance/risks
 */
export async function getRisks(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { categoryId, status, minRiskScore, limit = '50', offset = '0' } = req.query;

    const whereConditions: string[] = ['rr.tenant_id = $1', 'rr.is_active = true'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (categoryId) {
      whereConditions.push(`rr.category_id = $${paramIndex++}`);
      queryParams.push(categoryId);
    }

    if (status) {
      whereConditions.push(`rr.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (minRiskScore) {
      whereConditions.push(`rr.residual_risk_score >= $${paramIndex++}`);
      queryParams.push(minRiskScore);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        rr.*,
        rc.category_name,
        rc.category_code
      FROM risk_register rr
      JOIN risk_categories rc ON rr.category_id = rc.category_id
      WHERE ${whereClause}
      ORDER BY rr.residual_risk_score DESC, rr.identified_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM risk_register rr WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: {
        risks: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get risks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch risks' });
  }
}

/**
 * Create risk
 * POST /api/v2/compliance/risks
 */
export async function createRisk(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      riskCode, riskTitle, riskDescription, categoryId,
      inherentLikelihood, inherentImpact, currentControls,
      residualLikelihood, residualImpact, riskResponse,
      riskOwnerId, department
    } = req.body;

    if (!riskCode || !riskTitle || !categoryId || !inherentLikelihood || !inherentImpact) {
      res.status(400).json({
        success: false,
        error: 'Risk code, title, category, likelihood, and impact are required'
      });
      return;
    }

    // Calculate risk scores
    const inherentRiskScore = inherentLikelihood * inherentImpact;
    const residualRiskScore = (residualLikelihood || inherentLikelihood) * (residualImpact || inherentImpact);

    const query = `
      INSERT INTO risk_register (
        tenant_id, risk_code, risk_title, risk_description, category_id,
        inherent_likelihood, inherent_impact, inherent_risk_score,
        current_controls, residual_likelihood, residual_impact, residual_risk_score,
        risk_response, risk_owner_id, department, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, riskCode, riskTitle, riskDescription, categoryId,
      inherentLikelihood, inherentImpact, inherentRiskScore,
      currentControls, residualLikelihood, residualImpact, residualRiskScore,
      riskResponse, riskOwnerId, department, userId
    ]);

    res.status(201).json({
      success: true,
      data: { risk: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Create risk error:', error);
    res.status(500).json({ success: false, error: 'Failed to create risk' });
  }
}

/**
 * Get risk categories
 * GET /api/v2/compliance/risk-categories
 */
export async function getRiskCategories(_req: TenantRequest, res: Response): Promise<void> {
  try {
    const query = 'SELECT * FROM risk_categories WHERE is_active = true ORDER BY category_name';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get risk categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch risk categories' });
  }
}

// ============================================================================
// POLICIES
// ============================================================================

/**
 * Get policies
 * GET /api/v2/compliance/policies
 */
export async function getPolicies(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { categoryId, status, active } = req.query;

    const queryParams: any[] = [tenantId];
    // Simplified query - using compliance_policies table directly

    const query = `
      SELECT 
        cp.id as policy_id,
        cp.tenant_id,
        cp.name as policy_name,
        cp.description,
        cp.policy_type,
        cp.status,
        cp.effective_date,
        cp.created_at,
        'General' as category_name,
        true as is_active,
        0 as acknowledgment_count
      FROM compliance_policies cp
      WHERE cp.tenant_id = $1
      ORDER BY cp.created_at DESC
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        policies: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get policies error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policies' });
  }
}

/**
 * Create policy
 * POST /api/v2/compliance/policies
 */
export async function createPolicy(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      policyCode, policyTitle, policyDescription, categoryId,
      policyContent, version, effectiveDate, mandatoryAcknowledgment
    } = req.body;

    if (!policyCode || !policyTitle || !categoryId || !effectiveDate) {
      res.status(400).json({
        success: false,
        error: 'Policy code, title, category, and effective date are required'
      });
      return;
    }

    const query = `
      INSERT INTO policies (
        tenant_id, policy_code, policy_title, policy_description, category_id,
        policy_content, version, effective_date, mandatory_acknowledgment, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, policyCode, policyTitle, policyDescription, categoryId,
      policyContent, version || '1.0', effectiveDate, mandatoryAcknowledgment || false, userId
    ]);

    res.status(201).json({
      success: true,
      data: { policy: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Create policy error:', error);
    res.status(500).json({ success: false, error: 'Failed to create policy' });
  }
}

/**
 * Acknowledge policy
 * POST /api/v2/compliance/policies/:id/acknowledge
 */
export async function acknowledgePolicy(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    const ipAddress = req.ip;

    // Get policy version
    const policyQuery = 'SELECT version FROM policies WHERE policy_id = $1';
    const policyResult = await pool.query(policyQuery, [id]);

    if (policyResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Policy not found' });
      return;
    }

    const query = `
      INSERT INTO policy_acknowledgments (policy_id, user_id, policy_version, ip_address)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (policy_id, user_id) 
      DO UPDATE SET acknowledged_date = CURRENT_TIMESTAMP, policy_version = $3, ip_address = $4
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId, policyResult.rows[0].version, ipAddress]);

    res.json({
      success: true,
      data: { acknowledgment: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Acknowledge policy error:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge policy' });
  }
}

/**
 * Get policy categories
 * GET /api/v2/compliance/policy-categories
 */
export async function getPolicyCategories(_req: TenantRequest, res: Response): Promise<void> {
  try {
    const query = 'SELECT * FROM policy_categories WHERE is_active = true ORDER BY category_name';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: { categories: result.rows }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get policy categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch policy categories' });
  }
}

// ============================================================================
// INCIDENTS
// ============================================================================

/**
 * Get incidents
 * GET /api/v2/compliance/incidents
 */
export async function getIncidents(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { typeId, severity, status, startDate, endDate, limit = '50', offset = '0' } = req.query;

    const whereConditions: string[] = ['i.tenant_id = $1'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (typeId) {
      whereConditions.push(`i.incident_type_id = $${paramIndex++}`);
      queryParams.push(typeId);
    }

    if (severity) {
      whereConditions.push(`i.severity = $${paramIndex++}`);
      queryParams.push(severity);
    }

    if (status) {
      whereConditions.push(`i.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (startDate) {
      whereConditions.push(`i.incident_date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`i.incident_date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        i.*,
        it.type_name,
        it.category as incident_category
      FROM incidents i
      JOIN incident_types it ON i.incident_type_id = it.type_id
      WHERE ${whereClause}
      ORDER BY i.incident_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM incidents i WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: {
        incidents: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get incidents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
}

/**
 * Create incident
 * POST /api/v2/compliance/incidents
 */
export async function createIncident(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const userName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || req.user?.email;
    const {
      incidentTypeId, title, description, incidentDate,
      location, department, severity, assignedTo
    } = req.body;

    if (!incidentTypeId || !title || !description || !incidentDate) {
      res.status(400).json({
        success: false,
        error: 'Incident type, title, description, and date are required'
      });
      return;
    }

    // Generate incident number
    const numberQuery = `
      SELECT COUNT(*) as count FROM incidents 
      WHERE tenant_id = $1 AND EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM $2::date)
    `;
    const numberResult = await pool.query(numberQuery, [tenantId, incidentDate]);
    const incidentNumber = `INC-${new Date(incidentDate).getFullYear()}-${String(parseInt(numberResult.rows[0].count) + 1).padStart(4, '0')}`;

    const query = `
      INSERT INTO incidents (
        tenant_id, incident_number, incident_type_id, title, description,
        incident_date, location, department, severity, reported_by, reporter_name, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, incidentNumber, incidentTypeId, title, description,
      incidentDate, location, department, severity, userId, userName, assignedTo
    ]);

    res.status(201).json({
      success: true,
      data: { incident: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Create incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to create incident' });
  }
}

/**
 * Get incident types
 * GET /api/v2/compliance/incident-types
 */
export async function getIncidentTypes(_req: TenantRequest, res: Response): Promise<void> {
  try {
    const query = 'SELECT * FROM incident_types WHERE is_active = true ORDER BY type_name';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: { types: result.rows }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get incident types error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incident types' });
  }
}

// ============================================================================
// TRAINING
// ============================================================================

/**
 * Get training courses
 * GET /api/v2/compliance/training/courses
 */
export async function getTrainingCourses(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { category, mandatory } = req.query;

    const whereConditions: string[] = ['tenant_id = $1', 'is_active = true'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (category) {
      whereConditions.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }

    if (mandatory !== undefined) {
      whereConditions.push(`is_mandatory = $${paramIndex++}`);
      queryParams.push(mandatory === 'true');
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        tc.*,
        COUNT(tcomp.completion_id) as completion_count
      FROM training_courses tc
      LEFT JOIN training_completions tcomp ON tc.course_id = tcomp.course_id
      WHERE ${whereClause}
      GROUP BY tc.course_id
      ORDER BY tc.is_mandatory DESC, tc.course_name
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        courses: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get training courses error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch training courses' });
  }
}

/**
 * Record training completion
 * POST /api/v2/compliance/training/completions
 */
export async function recordTrainingCompletion(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = getTenantContext(req);
    const userName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || req.user?.email;
    const {
      courseId, completionDate, score, passed,
      certificateNumber, sessionDate, instructor
    } = req.body;

    if (!courseId || !completionDate) {
      res.status(400).json({
        success: false,
        error: 'Course ID and completion date are required'
      });
      return;
    }

    // Get certificate validity from course
    const courseQuery = 'SELECT certificate_validity_months FROM training_courses WHERE course_id = $1';
    const courseResult = await pool.query(courseQuery, [courseId]);

    let certificateExpiryDate = null;
    if (courseResult.rows.length > 0 && courseResult.rows[0].certificate_validity_months) {
      const expiryDate = new Date(completionDate);
      expiryDate.setMonth(expiryDate.getMonth() + courseResult.rows[0].certificate_validity_months);
      certificateExpiryDate = expiryDate.toISOString().split('T')[0];
    }

    const query = `
      INSERT INTO training_completions (
        course_id, user_id, user_name, completion_date, score, passed,
        certificate_number, certificate_expiry_date, session_date, instructor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      courseId, userId, userName, completionDate, score, passed !== false,
      certificateNumber, certificateExpiryDate, sessionDate, instructor
    ]);

    res.status(201).json({
      success: true,
      data: { completion: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Record training completion error:', error);
    res.status(500).json({ success: false, error: 'Failed to record training completion' });
  }
}

/**
 * Get user training history
 * GET /api/v2/compliance/training/history/:userId
 */
export async function getUserTrainingHistory(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId: targetUserId } = req.params;

    const query = `
      SELECT 
        tc.*,
        tcourse.course_name,
        tcourse.category,
        tcourse.is_mandatory,
        CASE 
          WHEN tc.certificate_expiry_date IS NOT NULL AND tc.certificate_expiry_date < CURRENT_DATE
          THEN true
          ELSE false
        END as is_expired
      FROM training_completions tc
      JOIN training_courses tcourse ON tc.course_id = tcourse.course_id
      WHERE tc.user_id = $1
      ORDER BY tc.completion_date DESC
    `;

    const result = await pool.query(query, [targetUserId]);

    res.json({
      success: true,
      data: {
        completions: result.rows,
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('[Compliance V2] Get training history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch training history' });
  }
}
