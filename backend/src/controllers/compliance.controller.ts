import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * Compliance & Governance Controller
 * 
 * Handles all compliance-related operations including:
 * - Regulatory compliance tracking
 * - Risk management
 * - Policy management
 * - Incident tracking
 * - Training management
 * - SARS Sentinel (tax compliance)
 * - Audit-Ready Suite
 */

class ComplianceController {

  // ============================================================================
  // REGULATORY FRAMEWORKS & COMPLIANCE REQUIREMENTS
  // ============================================================================

  /**
   * Get regulatory frameworks
   * GET /api/compliance/frameworks
   */
  async getRegulatoryFrameworks(req: Request, res: Response): Promise<void> {
    try {
      const { jurisdiction, category, active } = req.query;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (jurisdiction) {
        whereConditions.push(`jurisdiction = $${paramIndex}`);
        queryParams.push(jurisdiction);
        paramIndex++;
      }

      if (category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (active !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        queryParams.push(active === 'true');
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM regulatory_frameworks 
        ${whereClause}
        ORDER BY category, framework_name
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        frameworks: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Compliance] Get frameworks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch regulatory frameworks',
        error: error.message
      });
    }
  }

  /**
   * Get compliance requirements
   * GET /api/compliance/requirements
   */
  async getComplianceRequirements(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { frameworkId, criticality, active, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = ['cr.tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (frameworkId) {
        whereConditions.push(`cr.framework_id = $${paramIndex}`);
        queryParams.push(frameworkId);
        paramIndex++;
      }

      if (criticality) {
        whereConditions.push(`cr.criticality = $${paramIndex}`);
        queryParams.push(criticality);
        paramIndex++;
      }

      if (active !== undefined) {
        whereConditions.push(`cr.is_active = $${paramIndex}`);
        queryParams.push(active === 'true');
        paramIndex++;
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

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM compliance_requirements cr WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        requirements: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Compliance] Get requirements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch compliance requirements',
        error: error.message
      });
    }
  }

  /**
   * Get compliance status
   * GET /api/compliance/status
   */
  async getComplianceStatus(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { requirementId, status, period } = req.query;

      let whereConditions: string[] = ['cs.tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (requirementId) {
        whereConditions.push(`cs.requirement_id = $${paramIndex}`);
        queryParams.push(requirementId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`cs.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (period) {
        whereConditions.push(`cs.compliance_period = $${paramIndex}`);
        queryParams.push(period);
        paramIndex++;
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

      res.status(200).json({
        success: true,
        statusRecords: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Compliance] Get status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch compliance status',
        error: error.message
      });
    }
  }

  /**
   * Update compliance status
   * PUT /api/compliance/status/:id
   */
  async updateComplianceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, completionPercentage, completedDate, notes, evidenceDocuments } = req.body;
      const userId = (req as any).user?.userId;

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
        res.status(404).json({
          success: false,
          message: 'Compliance status record not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Compliance status updated successfully',
        statusRecord: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Update status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update compliance status',
        error: error.message
      });
    }
  }

  // ============================================================================
  // RISK MANAGEMENT
  // ============================================================================

  /**
   * Get risk register
   * GET /api/compliance/risks
   */
  async getRisks(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { categoryId, status, minRiskScore, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = ['rr.tenant_id = $1', 'rr.is_active = true'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (categoryId) {
        whereConditions.push(`rr.category_id = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`rr.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (minRiskScore) {
        whereConditions.push(`rr.residual_risk_score >= $${paramIndex}`);
        queryParams.push(minRiskScore);
        paramIndex++;
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

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM risk_register rr WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        risks: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Compliance] Get risks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch risks',
        error: error.message
      });
    }
  }

  /**
   * Create risk
   * POST /api/compliance/risks
   */
  async createRisk(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;

      const {
        riskCode, riskTitle, riskDescription, categoryId,
        inherentLikelihood, inherentImpact, currentControls,
        residualLikelihood, residualImpact, riskResponse,
        riskOwnerId, department
      } = req.body;

      // Validation
      if (!riskCode || !riskTitle || !categoryId || !inherentLikelihood || !inherentImpact) {
        res.status(400).json({
          success: false,
          message: 'Risk code, title, category, likelihood, and impact are required'
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
        message: 'Risk created successfully',
        risk: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Create risk error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create risk',
        error: error.message
      });
    }
  }

  /**
   * Get risk categories
   * GET /api/compliance/risk-categories
   */
  async getRiskCategories(_req: Request, res: Response): Promise<void> {
    try {
      const query = 'SELECT * FROM risk_categories WHERE is_active = true ORDER BY category_name';
      const result = await pool.query(query);

      res.status(200).json({
        success: true,
        categories: result.rows
      });

    } catch (error: any) {
      console.error('[Compliance] Get risk categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch risk categories',
        error: error.message
      });
    }
  }

  // ============================================================================
  // POLICIES
  // ============================================================================

  /**
   * Get policies
   * GET /api/compliance/policies
   */
  async getPolicies(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { categoryId, status, active } = req.query;

      let whereConditions: string[] = ['p.tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (categoryId) {
        whereConditions.push(`p.category_id = $${paramIndex}`);
        queryParams.push(categoryId);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (active !== undefined) {
        whereConditions.push(`p.is_active = $${paramIndex}`);
        queryParams.push(active === 'true');
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          p.*,
          pc.category_name,
          COUNT(pa.acknowledgment_id) as acknowledgment_count
        FROM policies p
        JOIN policy_categories pc ON p.category_id = pc.category_id
        LEFT JOIN policy_acknowledgments pa ON p.policy_id = pa.policy_id
        WHERE ${whereClause}
        GROUP BY p.policy_id, pc.category_name
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        policies: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Compliance] Get policies error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policies',
        error: error.message
      });
    }
  }

  /**
   * Create policy
   * POST /api/compliance/policies
   */
  async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;

      const {
        policyCode, policyTitle, policyDescription, categoryId,
        policyContent, version, effectiveDate, mandatoryAcknowledgment
      } = req.body;

      if (!policyCode || !policyTitle || !categoryId || !effectiveDate) {
        res.status(400).json({
          success: false,
          message: 'Policy code, title, category, and effective date are required'
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
        message: 'Policy created successfully',
        policy: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Create policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy',
        error: error.message
      });
    }
  }

  /**
   * Acknowledge policy
   * POST /api/compliance/policies/:id/acknowledge
   */
  async acknowledgePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const ipAddress = req.ip;

      // Get policy version
      const policyQuery = 'SELECT version FROM policies WHERE policy_id = $1';
      const policyResult = await pool.query(policyQuery, [id]);

      if (policyResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Policy not found'
        });
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

      res.status(200).json({
        success: true,
        message: 'Policy acknowledged successfully',
        acknowledgment: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Acknowledge policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge policy',
        error: error.message
      });
    }
  }

  /**
   * Get policy categories
   * GET /api/compliance/policy-categories
   */
  async getPolicyCategories(_req: Request, res: Response): Promise<void> {
    try {
      const query = 'SELECT * FROM policy_categories WHERE is_active = true ORDER BY category_name';
      const result = await pool.query(query);

      res.status(200).json({
        success: true,
        categories: result.rows
      });

    } catch (error: any) {
      console.error('[Compliance] Get policy categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy categories',
        error: error.message
      });
    }
  }

  // ============================================================================
  // INCIDENTS
  // ============================================================================

  /**
   * Get incidents
   * GET /api/compliance/incidents
   */
  async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { typeId, severity, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = ['i.tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (typeId) {
        whereConditions.push(`i.incident_type_id = $${paramIndex}`);
        queryParams.push(typeId);
        paramIndex++;
      }

      if (severity) {
        whereConditions.push(`i.severity = $${paramIndex}`);
        queryParams.push(severity);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`i.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`i.incident_date >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`i.incident_date <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
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

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM incidents i WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        incidents: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Compliance] Get incidents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incidents',
        error: error.message
      });
    }
  }

  /**
   * Create incident
   * POST /api/compliance/incidents
   */
  async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;
      const userName = (req as any).user?.name;

      const {
        incidentTypeId, title, description, incidentDate,
        location, department, severity, assignedTo
      } = req.body;

      if (!incidentTypeId || !title || !description || !incidentDate) {
        res.status(400).json({
          success: false,
          message: 'Incident type, title, description, and date are required'
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
        message: 'Incident created successfully',
        incident: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Create incident error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create incident',
        error: error.message
      });
    }
  }

  /**
   * Get incident types
   * GET /api/compliance/incident-types
   */
  async getIncidentTypes(_req: Request, res: Response): Promise<void> {
    try {
      const query = 'SELECT * FROM incident_types WHERE is_active = true ORDER BY type_name';
      const result = await pool.query(query);

      res.status(200).json({
        success: true,
        types: result.rows
      });

    } catch (error: any) {
      console.error('[Compliance] Get incident types error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incident types',
        error: error.message
      });
    }
  }

  // ============================================================================
  // TRAINING
  // ============================================================================

  /**
   * Get training courses
   * GET /api/compliance/training/courses
   */
  async getTrainingCourses(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { category, mandatory } = req.query;

      let whereConditions: string[] = ['tenant_id = $1', 'is_active = true'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (mandatory !== undefined) {
        whereConditions.push(`is_mandatory = $${paramIndex}`);
        queryParams.push(mandatory === 'true');
        paramIndex++;
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

      res.status(200).json({
        success: true,
        courses: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Compliance] Get training courses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training courses',
        error: error.message
      });
    }
  }

  /**
   * Record training completion
   * POST /api/compliance/training/completions
   */
  async recordTrainingCompletion(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userName = (req as any).user?.name;

      const {
        courseId, completionDate, score, passed,
        certificateNumber, sessionDate, instructor
      } = req.body;

      if (!courseId || !completionDate) {
        res.status(400).json({
          success: false,
          message: 'Course ID and completion date are required'
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
        message: 'Training completion recorded successfully',
        completion: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Compliance] Record training completion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record training completion',
        error: error.message
      });
    }
  }

  /**
   * Get user training history
   * GET /api/compliance/training/history/:userId
   */
  async getUserTrainingHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

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

      const result = await pool.query(query, [userId]);

      res.status(200).json({
        success: true,
        completions: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Compliance] Get training history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training history',
        error: error.message
      });
    }
  }

}

export default new ComplianceController();
