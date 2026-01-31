import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * Audit-Ready Suite Controller
 * 
 * Handles comprehensive audit management:
 * - Audit engagements
 * - Audit findings & corrective actions
 * - Evidence repository
 * - Audit checklists
 * - Permanent records
 */

class AuditReadyController {

  // ============================================================================
  // AUDIT ENGAGEMENTS
  // ============================================================================

  /**
   * Get audit engagements
   * GET /api/audit/engagements
   */
  async getEngagements(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { auditType, status, fiscalYear, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = ['ae.tenant_id = $1', 'ae.is_archived = false'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (auditType) {
        whereConditions.push(`ae.audit_type = $${paramIndex}`);
        queryParams.push(auditType);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`ae.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (fiscalYear) {
        whereConditions.push(`ae.fiscal_year = $${paramIndex}`);
        queryParams.push(fiscalYear);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          ae.*,
          act.template_name,
          act.framework,
          COUNT(af.finding_id) as total_findings_count
        FROM audit_engagements ae
        LEFT JOIN audit_checklist_templates act ON ae.template_id = act.template_id
        LEFT JOIN audit_findings af ON ae.engagement_id = af.engagement_id
        WHERE ${whereClause}
        GROUP BY ae.engagement_id, act.template_name, act.framework
        ORDER BY ae.planning_start_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM audit_engagements ae WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        engagements: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get engagements error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit engagements',
        error: error.message
      });
    }
  }

  /**
   * Get engagement by ID
   * GET /api/audit/engagements/:id
   */
  async getEngagementById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          ae.*,
          act.template_name,
          act.framework
        FROM audit_engagements ae
        LEFT JOIN audit_checklist_templates act ON ae.template_id = act.template_id
        WHERE ae.engagement_id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Audit engagement not found'
        });
        return;
      }

      // Get findings summary
      const findingsQuery = `
        SELECT 
          COUNT(*) as total_findings,
          COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_findings,
          COUNT(*) FILTER (WHERE severity = 'HIGH') as high_findings,
          COUNT(*) FILTER (WHERE severity = 'MEDIUM') as medium_findings,
          COUNT(*) FILTER (WHERE severity = 'LOW') as low_findings
        FROM audit_findings
        WHERE engagement_id = $1
      `;
      const findingsResult = await pool.query(findingsQuery, [id]);

      res.status(200).json({
        success: true,
        engagement: result.rows[0],
        findingsSummary: findingsResult.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get engagement by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit engagement',
        error: error.message
      });
    }
  }

  /**
   * Create audit engagement
   * POST /api/audit/engagements
   */
  async createEngagement(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;

      const {
        auditType, templateId, entityName, auditPeriodStart, auditPeriodEnd,
        fiscalYear, leadAuditorId, leadAuditorName, planningStartDate
      } = req.body;

      if (!auditType || !entityName || !auditPeriodStart || !auditPeriodEnd) {
        res.status(400).json({
          success: false,
          message: 'Audit type, entity name, and audit period are required'
        });
        return;
      }

      // Generate engagement number
      const numberQuery = `
        SELECT COUNT(*) as count FROM audit_engagements 
        WHERE tenant_id = $1 AND EXTRACT(YEAR FROM audit_period_start) = $2
      `;
      const numberResult = await pool.query(numberQuery, [tenantId, new Date(auditPeriodStart).getFullYear()]);
      const engagementNumber = `AUD-${new Date(auditPeriodStart).getFullYear()}-${String(parseInt(numberResult.rows[0].count) + 1).padStart(4, '0')}`;

      const query = `
        INSERT INTO audit_engagements (
          tenant_id, engagement_number, audit_type, template_id,
          entity_name, audit_period_start, audit_period_end, fiscal_year,
          lead_auditor_id, lead_auditor_name, planning_start_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId, engagementNumber, auditType, templateId,
        entityName, auditPeriodStart, auditPeriodEnd, fiscalYear,
        leadAuditorId, leadAuditorName, planningStartDate, userId
      ]);

      res.status(201).json({
        success: true,
        message: 'Audit engagement created successfully',
        engagement: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Create engagement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit engagement',
        error: error.message
      });
    }
  }

  /**
   * Update engagement status
   * PUT /api/audit/engagements/:id/status
   */
  async updateEngagementStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, completionPercentage } = req.body;

      const query = `
        UPDATE audit_engagements
        SET 
          status = COALESCE($1, status),
          completion_percentage = COALESCE($2, completion_percentage),
          updated_at = CURRENT_TIMESTAMP
        WHERE engagement_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [status, completionPercentage, id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Audit engagement not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Engagement status updated successfully',
        engagement: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Update engagement status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update engagement status',
        error: error.message
      });
    }
  }

  // ============================================================================
  // AUDIT FINDINGS
  // ============================================================================

  /**
   * Get audit findings
   * GET /api/audit/findings
   */
  async getFindings(req: Request, res: Response): Promise<void> {
    try {
      const { engagementId, severity, status, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (engagementId) {
        whereConditions.push(`af.engagement_id = $${paramIndex}`);
        queryParams.push(engagementId);
        paramIndex++;
      }

      if (severity) {
        whereConditions.push(`af.severity = $${paramIndex}`);
        queryParams.push(severity);
        paramIndex++;
      }

      if (status) {
        whereConditions.push(`af.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          af.*,
          ae.engagement_number,
          ae.entity_name,
          aci.item_title as checklist_item_title
        FROM audit_findings af
        JOIN audit_engagements ae ON af.engagement_id = ae.engagement_id
        LEFT JOIN audit_checklist_items aci ON af.checklist_item_id = aci.item_id
        ${whereClause}
        ORDER BY 
          CASE af.severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END,
          af.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      // Count total
      const countQuery = `SELECT COUNT(*) FROM audit_findings af ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

      res.status(200).json({
        success: true,
        findings: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get findings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit findings',
        error: error.message
      });
    }
  }

  /**
   * Create audit finding
   * POST /api/audit/findings
   */
  async createFinding(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      const {
        engagementId, findingType, severity, title, description,
        areaAffected, rootCause, impactDescription, financialImpact,
        auditorRecommendation, responsiblePersonId, targetResolutionDate
      } = req.body;

      if (!engagementId || !findingType || !title || !description || !auditorRecommendation) {
        res.status(400).json({
          success: false,
          message: 'Engagement ID, finding type, title, description, and recommendation are required'
        });
        return;
      }

      // Generate finding number
      const numberQuery = `
        SELECT COUNT(*) as count FROM audit_findings WHERE engagement_id = $1
      `;
      const numberResult = await pool.query(numberQuery, [engagementId]);
      const findingNumber = `F-${String(parseInt(numberResult.rows[0].count) + 1).padStart(3, '0')}`;

      const query = `
        INSERT INTO audit_findings (
          engagement_id, finding_number, finding_type, severity,
          title, description, area_affected, root_cause, impact_description,
          financial_impact, auditor_recommendation, responsible_person_id,
          target_resolution_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const result = await pool.query(query, [
        engagementId, findingNumber, findingType, severity || 'MEDIUM',
        title, description, areaAffected, rootCause, impactDescription,
        financialImpact, auditorRecommendation, responsiblePersonId,
        targetResolutionDate, userId
      ]);

      // Update engagement findings count
      const updateEngagementQuery = `
        UPDATE audit_engagements
        SET 
          total_findings = total_findings + 1,
          ${severity === 'CRITICAL' ? 'critical_findings = critical_findings + 1,' : ''}
          ${severity === 'HIGH' ? 'high_findings = high_findings + 1,' : ''}
          ${severity === 'MEDIUM' ? 'medium_findings = medium_findings + 1,' : ''}
          ${severity === 'LOW' ? 'low_findings = low_findings + 1,' : ''}
          updated_at = CURRENT_TIMESTAMP
        WHERE engagement_id = $1
      `;
      await pool.query(updateEngagementQuery, [engagementId]);

      res.status(201).json({
        success: true,
        message: 'Audit finding created successfully',
        finding: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Create finding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audit finding',
        error: error.message
      });
    }
  }

  /**
   * Update finding
   * PUT /api/audit/findings/:id
   */
  async updateFinding(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        status, managementResponse, correctiveActionPlan,
        actualResolutionDate, followUpNotes
      } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (status) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (managementResponse) {
        updates.push(`management_response = $${paramIndex++}`);
        values.push(managementResponse);
      }

      if (correctiveActionPlan) {
        updates.push(`corrective_action_plan = $${paramIndex++}`);
        values.push(correctiveActionPlan);
      }

      if (actualResolutionDate) {
        updates.push(`actual_resolution_date = $${paramIndex++}`);
        values.push(actualResolutionDate);
      }

      if (followUpNotes) {
        updates.push(`follow_up_notes = $${paramIndex++}`);
        values.push(followUpNotes);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE audit_findings
        SET ${updates.join(', ')}
        WHERE finding_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Audit finding not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Finding updated successfully',
        finding: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Update finding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update finding',
        error: error.message
      });
    }
  }

  // ============================================================================
  // AUDIT EVIDENCE
  // ============================================================================

  /**
   * Get audit evidence
   * GET /api/audit/evidence
   */
  async getEvidence(req: Request, res: Response): Promise<void> {
    try {
      const { engagementId, evidenceType } = req.query;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (engagementId) {
        whereConditions.push(`engagement_id = $${paramIndex}`);
        queryParams.push(engagementId);
        paramIndex++;
      }

      if (evidenceType) {
        whereConditions.push(`evidence_type = $${paramIndex}`);
        queryParams.push(evidenceType);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM audit_evidence
        ${whereClause}
        ORDER BY collection_date DESC
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        evidence: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit evidence',
        error: error.message
      });
    }
  }

  /**
   * Add audit evidence
   * POST /api/audit/evidence
   */
  async addEvidence(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userName = (req as any).user?.name;

      const {
        engagementId, evidenceType, description, source,
        collectionDate, documentUrl, attachments, reliability, sufficiency
      } = req.body;

      if (!engagementId || !evidenceType || !description || !collectionDate) {
        res.status(400).json({
          success: false,
          message: 'Engagement ID, evidence type, description, and collection date are required'
        });
        return;
      }

      // Generate evidence number
      const numberQuery = `
        SELECT COUNT(*) as count FROM audit_evidence WHERE engagement_id = $1
      `;
      const numberResult = await pool.query(numberQuery, [engagementId]);
      const evidenceNumber = `EV-${String(parseInt(numberResult.rows[0].count) + 1).padStart(3, '0')}`;

      const query = `
        INSERT INTO audit_evidence (
          engagement_id, evidence_number, evidence_type, description, source,
          collection_date, document_url, attachments, reliability, sufficiency,
          collected_by, collected_by_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await pool.query(query, [
        engagementId, evidenceNumber, evidenceType, description, source,
        collectionDate, documentUrl, attachments, reliability || 'HIGH', sufficiency || 'SUFFICIENT',
        userId, userName
      ]);

      res.status(201).json({
        success: true,
        message: 'Audit evidence added successfully',
        evidence: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Add evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add audit evidence',
        error: error.message
      });
    }
  }

  // ============================================================================
  // CHECKLISTS
  // ============================================================================

  /**
   * Get checklist templates
   * GET /api/audit/checklist-templates
   */
  async getChecklistTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { auditType, framework } = req.query;

      let whereConditions: string[] = ['is_active = true'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (auditType) {
        whereConditions.push(`audit_type = $${paramIndex}`);
        queryParams.push(auditType);
        paramIndex++;
      }

      if (framework) {
        whereConditions.push(`framework = $${paramIndex}`);
        queryParams.push(framework);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          act.*,
          COUNT(aci.item_id) as item_count
        FROM audit_checklist_templates act
        LEFT JOIN audit_checklist_items aci ON act.template_id = aci.template_id
        WHERE ${whereClause}
        GROUP BY act.template_id
        ORDER BY act.template_name
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        templates: result.rows
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get checklist templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch checklist templates',
        error: error.message
      });
    }
  }

  /**
   * Get checklist items
   * GET /api/audit/checklist-items/:templateId
   */
  async getChecklistItems(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const query = `
        SELECT * FROM audit_checklist_items
        WHERE template_id = $1 AND is_active = true
        ORDER BY display_order, item_number
      `;

      const result = await pool.query(query, [templateId]);

      res.status(200).json({
        success: true,
        items: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get checklist items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch checklist items',
        error: error.message
      });
    }
  }

  // ============================================================================
  // PERMANENT RECORDS
  // ============================================================================

  /**
   * Get permanent records
   * GET /api/audit/permanent-records
   */
  async getPermanentRecords(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { entityId, recordType } = req.query;

      let whereConditions: string[] = ['tenant_id = $1', 'is_active = true'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (entityId) {
        whereConditions.push(`entity_id = $${paramIndex}`);
        queryParams.push(entityId);
        paramIndex++;
      }

      if (recordType) {
        whereConditions.push(`record_type = $${paramIndex}`);
        queryParams.push(recordType);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT * FROM audit_permanent_records
        WHERE ${whereClause}
        ORDER BY issue_date DESC
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        records: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Audit Ready] Get permanent records error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permanent records',
        error: error.message
      });
    }
  }

  /**
   * Add permanent record
   * POST /api/audit/permanent-records
   */
  async addPermanentRecord(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;

      const {
        entityId, recordType, documentTitle, documentDescription,
        documentUrl, documentHash, issueDate, expiryDate, retentionYears
      } = req.body;

      if (!entityId || !recordType || !documentTitle) {
        res.status(400).json({
          success: false,
          message: 'Entity ID, record type, and document title are required'
        });
        return;
      }

      const query = `
        INSERT INTO audit_permanent_records (
          tenant_id, entity_id, record_type, document_title, document_description,
          document_url, document_hash, issue_date, expiry_date, retention_years, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId, entityId, recordType, documentTitle, documentDescription,
        documentUrl, documentHash, issueDate, expiryDate, retentionYears, userId
      ]);

      res.status(201).json({
        success: true,
        message: 'Permanent record added successfully',
        record: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Audit Ready] Add permanent record error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add permanent record',
        error: error.message
      });
    }
  }

}

export default new AuditReadyController();
