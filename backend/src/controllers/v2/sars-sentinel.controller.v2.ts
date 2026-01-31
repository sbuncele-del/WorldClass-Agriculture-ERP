/**
 * SARS Sentinel Controller V2
 * 
 * South African Revenue Service (SARS) compliance management:
 * - Correspondence tracking with deadlines
 * - Workflow automation
 * - Submission history
 * - Deadline calendar
 * 
 * Multi-tenant support for accounting practices managing multiple clients.
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
// CORRESPONDENCE
// ============================================================================

/**
 * Get all SARS correspondence
 * GET /api/v2/sars-sentinel/correspondence
 */
export async function getCorrespondence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, urgencyLevel, clientId, overdue, limit = '50', offset = '0' } = req.query;

    const whereConditions: string[] = ['sc.tenant_id = $1', 'sc.is_archived = false'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`sc.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (urgencyLevel) {
      whereConditions.push(`sc.urgency_level = $${paramIndex++}`);
      queryParams.push(urgencyLevel);
    }

    if (clientId) {
      whereConditions.push(`sc.client_id = $${paramIndex++}`);
      queryParams.push(clientId);
    }

    if (overdue === 'true') {
      whereConditions.push(`sc.deadline_date < CURRENT_DATE AND sc.status NOT IN ('COMPLETED', 'CLOSED')`);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        sc.*,
        sct.type_name,
        sct.category,
        (sc.deadline_date - CURRENT_DATE) as days_to_deadline,
        CASE 
          WHEN sc.deadline_date < CURRENT_DATE THEN 'OVERDUE'
          WHEN (sc.deadline_date - CURRENT_DATE) <= 3 THEN 'CRITICAL'
          WHEN (sc.deadline_date - CURRENT_DATE) <= 7 THEN 'URGENT'
          ELSE 'NORMAL'
        END as deadline_status
      FROM sars_correspondence sc
      JOIN sars_correspondence_types sct ON sc.correspondence_type_id = sct.type_id
      WHERE ${whereClause}
      ORDER BY 
        CASE sc.urgency_level
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        sc.deadline_date
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM sars_correspondence sc WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: {
        correspondence: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get correspondence error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch SARS correspondence' });
  }
}

/**
 * Get correspondence by ID
 * GET /api/v2/sars-sentinel/correspondence/:id
 */
export async function getCorrespondenceById(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        sc.*,
        sct.type_name,
        sct.category,
        sct.default_response_days
      FROM sars_correspondence sc
      JOIN sars_correspondence_types sct ON sc.correspondence_type_id = sct.type_id
      WHERE sc.correspondence_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Correspondence not found' });
      return;
    }

    // Get comments
    const commentsQuery = `
      SELECT * FROM sars_correspondence_comments
      WHERE correspondence_id = $1
      ORDER BY created_at DESC
    `;
    const comments = await pool.query(commentsQuery, [id]);

    // Get workflow
    const workflowQuery = `
      SELECT * FROM sars_workflows
      WHERE correspondence_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const workflow = await pool.query(workflowQuery, [id]);

    res.json({
      success: true,
      data: {
        correspondence: result.rows[0],
        comments: comments.rows,
        workflow: workflow.rows[0] || null
      }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get correspondence by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch correspondence' });
  }
}

/**
 * Create SARS correspondence
 * POST /api/v2/sars-sentinel/correspondence
 */
export async function createCorrespondence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      correspondenceTypeId, clientId, clientName, taxpayerNumber,
      subject, description, receivedDate, deadlineDate,
      urgencyLevel, taxPeriod, documentUrl, attachments
    } = req.body;

    if (!correspondenceTypeId || !subject || !deadlineDate) {
      res.status(400).json({
        success: false,
        error: 'Correspondence type, subject, and deadline are required'
      });
      return;
    }

    // Generate reference number
    const refQuery = `
      SELECT COUNT(*) as count FROM sars_correspondence 
      WHERE tenant_id = $1 AND EXTRACT(YEAR FROM received_date) = EXTRACT(YEAR FROM $2::date)
    `;
    const refResult = await pool.query(refQuery, [tenantId, receivedDate || new Date()]);
    const referenceNumber = `SARS-${new Date(receivedDate || new Date()).getFullYear()}-${String(parseInt(refResult.rows[0].count) + 1).padStart(5, '0')}`;

    const query = `
      INSERT INTO sars_correspondence (
        tenant_id, reference_number, correspondence_type_id,
        client_id, client_name, taxpayer_number,
        subject, description, received_date, deadline_date,
        urgency_level, tax_period, document_url, attachments, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, referenceNumber, correspondenceTypeId,
      clientId, clientName, taxpayerNumber,
      subject, description, receivedDate || new Date(), deadlineDate,
      urgencyLevel || 'MEDIUM', taxPeriod, documentUrl, attachments, userId
    ]);

    res.status(201).json({
      success: true,
      data: { correspondence: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Create correspondence error:', error);
    res.status(500).json({ success: false, error: 'Failed to create correspondence' });
  }
}

/**
 * Update correspondence
 * PUT /api/v2/sars-sentinel/correspondence/:id
 */
export async function updateCorrespondence(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, assignedTo, responseDate, responseMethod, outcome } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex++}`);
      values.push(assignedTo);
      updates.push(`assigned_date = CURRENT_TIMESTAMP`);
    }

    if (responseDate) {
      updates.push(`response_date = $${paramIndex++}`);
      values.push(responseDate);
    }

    if (responseMethod) {
      updates.push(`response_method = $${paramIndex++}`);
      values.push(responseMethod);
    }

    if (outcome) {
      updates.push(`outcome = $${paramIndex++}`);
      values.push(outcome);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE sars_correspondence
      SET ${updates.join(', ')}
      WHERE correspondence_id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Correspondence not found' });
      return;
    }

    res.json({
      success: true,
      data: { correspondence: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Update correspondence error:', error);
    res.status(500).json({ success: false, error: 'Failed to update correspondence' });
  }
}

/**
 * Add comment to correspondence
 * POST /api/v2/sars-sentinel/correspondence/:id/comments
 */
export async function addComment(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = getTenantContext(req);
    const userName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || req.user?.email;
    const { id } = req.params;
    const { commentText, isInternal, isClientVisible } = req.body;

    if (!commentText) {
      res.status(400).json({ success: false, error: 'Comment text is required' });
      return;
    }

    const query = `
      INSERT INTO sars_correspondence_comments (
        correspondence_id, comment_text, is_internal, is_client_visible, created_by, created_by_name
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id, commentText, isInternal !== false, isClientVisible || false, userId, userName
    ]);

    res.status(201).json({
      success: true,
      data: { comment: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Add comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
}

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Get dashboard statistics
 * GET /api/v2/sars-sentinel/dashboard/stats
 */
export async function getDashboardStats(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);

    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'NEW') as new_count,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status NOT IN ('COMPLETED', 'CLOSED')) as overdue_count,
        COUNT(*) FILTER (WHERE (deadline_date - CURRENT_DATE) <= 7 AND status NOT IN ('COMPLETED', 'CLOSED')) as due_this_week,
        COUNT(*) FILTER (WHERE urgency_level = 'CRITICAL') as critical_count,
        COUNT(*) FILTER (WHERE urgency_level = 'HIGH') as high_count,
        COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED', 'CLOSED')) as total_active
      FROM sars_correspondence
      WHERE tenant_id = $1 AND is_archived = false
    `;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: { stats: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
}

// ============================================================================
// WORKFLOWS
// ============================================================================

/**
 * Create workflow for correspondence
 * POST /api/v2/sars-sentinel/correspondence/:id/workflows
 */
export async function createWorkflow(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { workflowName, workflowType, steps } = req.body;

    if (!workflowName || !steps || !Array.isArray(steps)) {
      res.status(400).json({
        success: false,
        error: 'Workflow name and steps array are required'
      });
      return;
    }

    // Create workflow
    const workflowQuery = `
      INSERT INTO sars_workflows (tenant_id, correspondence_id, workflow_name, workflow_type, total_steps, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const workflowResult = await pool.query(workflowQuery, [
      tenantId, id, workflowName, workflowType || 'CUSTOM', steps.length, userId
    ]);

    const workflowId = workflowResult.rows[0].workflow_id;

    // Create workflow steps
    const stepPromises = steps.map((step: any, index: number) => {
      const stepQuery = `
        INSERT INTO sars_workflow_steps (
          workflow_id, step_number, step_title, step_description, assigned_to, assigned_to_name, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      return pool.query(stepQuery, [
        workflowId, index + 1, step.title, step.description,
        step.assignedTo, step.assignedToName, step.dueDate
      ]);
    });

    await Promise.all(stepPromises);

    res.status(201).json({
      success: true,
      data: { workflow: workflowResult.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Create workflow error:', error);
    res.status(500).json({ success: false, error: 'Failed to create workflow' });
  }
}

/**
 * Get workflow steps
 * GET /api/v2/sars-sentinel/workflows/:workflowId/steps
 */
export async function getWorkflowSteps(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { workflowId } = req.params;

    const query = `
      SELECT * FROM sars_workflow_steps
      WHERE workflow_id = $1
      ORDER BY step_number
    `;

    const result = await pool.query(query, [workflowId]);

    res.json({
      success: true,
      data: { steps: result.rows }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get workflow steps error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch workflow steps' });
  }
}

/**
 * Complete workflow step
 * POST /api/v2/sars-sentinel/workflows/steps/:stepId/complete
 */
export async function completeWorkflowStep(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { userId } = getTenantContext(req);
    const { stepId } = req.params;
    const { completionNotes, attachments } = req.body;

    const query = `
      UPDATE sars_workflow_steps
      SET 
        status = 'COMPLETED',
        completed_date = CURRENT_TIMESTAMP,
        completed_by = $1,
        completion_notes = $2,
        attachments = $3
      WHERE step_id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [userId, completionNotes, attachments, stepId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Workflow step not found' });
      return;
    }

    // Update workflow progress
    const updateWorkflowQuery = `
      UPDATE sars_workflows
      SET completed_steps = (
        SELECT COUNT(*) FROM sars_workflow_steps
        WHERE workflow_id = $1 AND status = 'COMPLETED'
      )
      WHERE workflow_id = $1
    `;

    await pool.query(updateWorkflowQuery, [result.rows[0].workflow_id]);

    res.json({
      success: true,
      data: { step: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Complete workflow step error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete workflow step' });
  }
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * Get submission history
 * GET /api/v2/sars-sentinel/submissions
 */
export async function getSubmissionHistory(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getTenantContext(req);
    const { clientId, submissionType, status, limit = '50', offset = '0' } = req.query;

    const whereConditions: string[] = ['tenant_id = $1'];
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (clientId) {
      whereConditions.push(`client_id = $${paramIndex++}`);
      queryParams.push(clientId);
    }

    if (submissionType) {
      whereConditions.push(`submission_type = $${paramIndex++}`);
      queryParams.push(submissionType);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT * FROM sars_submission_history
      WHERE ${whereClause}
      ORDER BY submission_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, queryParams);

    // Count total
    const countQuery = `SELECT COUNT(*) FROM sars_submission_history WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));

    res.json({
      success: true,
      data: {
        submissions: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get submission history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submission history' });
  }
}

/**
 * Record submission
 * POST /api/v2/sars-sentinel/submissions
 */
export async function recordSubmission(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const userName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || req.user?.email;
    const {
      clientId, taxpayerNumber, submissionType, taxPeriod,
      submissionMethod, efilingReference, amountPayable, amountRefundable
    } = req.body;

    if (!submissionType || !taxPeriod) {
      res.status(400).json({
        success: false,
        error: 'Submission type and tax period are required'
      });
      return;
    }

    const query = `
      INSERT INTO sars_submission_history (
        tenant_id, client_id, taxpayer_number, submission_type, tax_period,
        submitted_by, submitted_by_name, submission_method, efiling_reference,
        amount_payable, amount_refundable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      tenantId, clientId, taxpayerNumber, submissionType, taxPeriod,
      userId, userName, submissionMethod || 'EFILING', efilingReference,
      amountPayable, amountRefundable
    ]);

    res.status(201).json({
      success: true,
      data: { submission: result.rows[0] }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Record submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to record submission' });
  }
}

// ============================================================================
// REFERENCE DATA
// ============================================================================

/**
 * Get correspondence types
 * GET /api/v2/sars-sentinel/correspondence-types
 */
export async function getCorrespondenceTypes(_req: TenantRequest, res: Response): Promise<void> {
  try {
    const query = 'SELECT * FROM sars_correspondence_types WHERE is_active = true ORDER BY category, type_name';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: { types: result.rows }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get correspondence types error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch correspondence types' });
  }
}

/**
 * Get deadline calendar
 * GET /api/v2/sars-sentinel/deadline-calendar
 */
export async function getDeadlineCalendar(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { year, month } = req.query;

    const query = 'SELECT * FROM sars_deadline_calendar WHERE is_active = true ORDER BY deadline_type';
    const result = await pool.query(query);

    res.json({
      success: true,
      data: {
        deadlines: result.rows,
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1
      }
    });
  } catch (error: any) {
    console.error('[SARS Sentinel V2] Get deadline calendar error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deadline calendar' });
  }
}
