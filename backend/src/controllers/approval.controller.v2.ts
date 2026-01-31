/**
 * Approval Workflows Controller V2
 * Tenant-aware handlers for multi-level approval processes
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant ID not found');
  }
  return {
    tenantId,
    userId: req.user?.id
  };
}

// ============================================================================
// APPROVAL SUBMISSION
// ============================================================================

export const submitForApproval = async (req: TenantRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { journalEntryId } = req.params;
    const { workflowId, comments } = req.body;
    const performedBy = userId || 'SYSTEM';

    await client.query('BEGIN');

    // Get journal entry details - tenant scoped
    const entryQuery = await client.query(`
      SELECT id, journal_number, status, approval_status,
             (SELECT SUM(debit_amount) FROM journal_entry_lines WHERE journal_entry_id = $1) as total_amount
      FROM journal_entries
      WHERE id = $1 AND tenant_id = $2
    `, [journalEntryId, tenantId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      await client.query('ROLLBACK');
      return;
    }

    const entry = entryQuery.rows[0];

    // Validation checks
    if (entry.approval_status === 'PENDING_APPROVAL') {
      res.status(400).json({ success: false, error: 'Entry is already pending approval' });
      await client.query('ROLLBACK');
      return;
    }

    if (entry.approval_status === 'APPROVED') {
      res.status(400).json({ success: false, error: 'Entry is already approved' });
      await client.query('ROLLBACK');
      return;
    }

    if (entry.status === 'POSTED') {
      res.status(400).json({ success: false, error: 'Cannot submit posted entry for approval' });
      await client.query('ROLLBACK');
      return;
    }

    // Check if entry is balanced
    const balanceCheck = await client.query(`
      SELECT 
        SUM(debit_amount) as total_debits,
        SUM(credit_amount) as total_credits
      FROM journal_entry_lines
      WHERE journal_entry_id = $1
    `, [journalEntryId]);

    const { total_debits, total_credits } = balanceCheck.rows[0];
    if (Math.abs(parseFloat(total_debits || '0') - parseFloat(total_credits || '0')) > 0.01) {
      res.status(400).json({ success: false, error: 'Entry is not balanced. Debits must equal credits.' });
      await client.query('ROLLBACK');
      return;
    }

    // Determine workflow - tenant scoped
    let selectedWorkflowId = workflowId;
    if (!selectedWorkflowId) {
      const amount = parseFloat(entry.total_amount || '0');
      
      // Auto-select workflow based on amount
      let workflowName = 'Standard Journal Entry Approval';
      if (amount < 10000) {
        workflowName = 'Express Journal Entry Approval';
      } else if (amount > 1000000) {
        workflowName = 'Executive Journal Entry Approval';
      }
      
      const wfResult = await client.query(`
        SELECT id FROM approval_workflows 
        WHERE tenant_id = $1 AND name = $2 AND is_active = true
      `, [tenantId, workflowName]);
      selectedWorkflowId = wfResult.rows[0]?.id;
    }

    if (!selectedWorkflowId) {
      res.status(400).json({ success: false, error: 'No suitable workflow found. Please specify workflowId.' });
      await client.query('ROLLBACK');
      return;
    }

    // Get first approval level - tenant scoped
    const firstLevel = await client.query(`
      SELECT id, level_number, level_name
      FROM approval_levels
      WHERE workflow_id = $1 AND tenant_id = $2 AND level_number = 1
    `, [selectedWorkflowId, tenantId]);

    if (firstLevel.rows.length === 0) {
      res.status(400).json({ success: false, error: 'Workflow has no approval levels configured' });
      await client.query('ROLLBACK');
      return;
    }

    // Update journal entry status
    await client.query(`
      UPDATE journal_entries
      SET approval_status = 'PENDING_APPROVAL',
          workflow_id = $1,
          current_approval_level = 1,
          submitted_for_approval_at = NOW(),
          submitted_by = $2,
          updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
    `, [selectedWorkflowId, performedBy, journalEntryId, tenantId]);

    // Create approval history record
    await client.query(`
      INSERT INTO approval_history (
        tenant_id, journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, $4, 'SUBMITTED', $5, $6)
    `, [tenantId, journalEntryId, selectedWorkflowId, firstLevel.rows[0].id, comments, performedBy]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: `Entry ${entry.journal_number} submitted for approval`,
      data: {
        journal_entry_id: journalEntryId,
        workflow_id: selectedWorkflowId,
        current_level: 1,
        level_name: firstLevel.rows[0].level_name
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error submitting for approval:', error);
    res.status(500).json({ success: false, error: 'Failed to submit for approval' });
  } finally {
    client.release();
  }
};

// ============================================================================
// APPROVE ENTRY
// ============================================================================

export const approveEntry = async (req: TenantRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { journalEntryId } = req.params;
    const { comments } = req.body;
    const performedBy = userId || 'SYSTEM';

    await client.query('BEGIN');

    // Get current entry status - tenant scoped
    const entryQuery = await client.query(`
      SELECT je.*, aw.name as workflow_name
      FROM journal_entries je
      LEFT JOIN approval_workflows aw ON je.workflow_id = aw.id
      WHERE je.entry_id = $1 AND je.tenant_id = $2
    `, [journalEntryId, tenantId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      await client.query('ROLLBACK');
      return;
    }

    const entry = entryQuery.rows[0];

    if (entry.approval_status !== 'PENDING_APPROVAL') {
      res.status(400).json({ success: false, error: 'Entry is not pending approval' });
      await client.query('ROLLBACK');
      return;
    }

    // Get current level details - tenant scoped
    const currentLevel = await client.query(`
      SELECT * FROM approval_levels
      WHERE workflow_id = $1 AND tenant_id = $2 AND level_number = $3
    `, [entry.workflow_id, tenantId, entry.current_approval_level]);

    if (currentLevel.rows.length === 0) {
      res.status(400).json({ success: false, error: 'Approval level not found' });
      await client.query('ROLLBACK');
      return;
    }

    // Check if there's a next level
    const nextLevel = await client.query(`
      SELECT * FROM approval_levels
      WHERE workflow_id = $1 AND tenant_id = $2 AND level_number = $3
    `, [entry.workflow_id, tenantId, entry.current_approval_level + 1]);

    // Record approval
    await client.query(`
      INSERT INTO approval_history (
        tenant_id, journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, $4, 'APPROVED', $5, $6)
    `, [tenantId, journalEntryId, entry.workflow_id, currentLevel.rows[0].id, comments, performedBy]);

    if (nextLevel.rows.length > 0) {
      // Move to next level
      await client.query(`
        UPDATE journal_entries
        SET current_approval_level = $1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [entry.current_approval_level + 1, journalEntryId, tenantId]);

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: `Entry approved at level ${entry.current_approval_level}, moved to level ${entry.current_approval_level + 1}`,
        data: {
          current_level: entry.current_approval_level + 1,
          level_name: nextLevel.rows[0].level_name
        }
      });
    } else {
      // Final approval - mark as fully approved
      await client.query(`
        UPDATE journal_entries
        SET approval_status = 'APPROVED',
            approved_at = NOW(),
            approved_by = $1,
            updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [performedBy, journalEntryId, tenantId]);

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Entry fully approved',
        data: { final_status: 'APPROVED' }
      });
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error approving entry:', error);
    res.status(500).json({ success: false, error: 'Failed to approve entry' });
  } finally {
    client.release();
  }
};

// ============================================================================
// REJECT ENTRY
// ============================================================================

export const rejectEntry = async (req: TenantRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { journalEntryId } = req.params;
    const { comments, reason } = req.body;
    const performedBy = userId || 'SYSTEM';

    if (!comments && !reason) {
      res.status(400).json({ success: false, error: 'Rejection reason is required' });
      return;
    }

    await client.query('BEGIN');

    // Get current entry - tenant scoped
    const entryQuery = await client.query(`
      SELECT * FROM journal_entries
      WHERE id = $1 AND tenant_id = $2
    `, [journalEntryId, tenantId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      await client.query('ROLLBACK');
      return;
    }

    const entry = entryQuery.rows[0];

    if (entry.approval_status !== 'PENDING_APPROVAL') {
      res.status(400).json({ success: false, error: 'Entry is not pending approval' });
      await client.query('ROLLBACK');
      return;
    }

    // Get current level
    const currentLevel = await client.query(`
      SELECT * FROM approval_levels
      WHERE workflow_id = $1 AND tenant_id = $2 AND level_number = $3
    `, [entry.workflow_id, tenantId, entry.current_approval_level]);

    // Record rejection
    await client.query(`
      INSERT INTO approval_history (
        tenant_id, journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, $4, 'REJECTED', $5, $6)
    `, [tenantId, journalEntryId, entry.workflow_id, currentLevel.rows[0]?.id, comments || reason, performedBy]);

    // Update entry status
    await client.query(`
      UPDATE journal_entries
      SET approval_status = 'REJECTED',
          rejected_at = NOW(),
          rejected_by = $1,
          rejection_reason = $2,
          updated_at = NOW()
      WHERE id = $3 AND tenant_id = $4
    `, [performedBy, comments || reason, journalEntryId, tenantId]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Entry rejected',
      data: { status: 'REJECTED' }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error rejecting entry:', error);
    res.status(500).json({ success: false, error: 'Failed to reject entry' });
  } finally {
    client.release();
  }
};

// ============================================================================
// PENDING APPROVALS
// ============================================================================

export const getPendingApprovals = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get pending entries for this tenant
    const result = await pool.query(`
      SELECT je.*, 
             al.level_name,
             aw.name as workflow_name
      FROM journal_entries je
      LEFT JOIN approval_workflows aw ON je.workflow_id = aw.id
      LEFT JOIN approval_levels al ON je.workflow_id = al.workflow_id AND je.current_approval_level = al.level_number
      WHERE je.tenant_id = $1 
      AND je.approval_status = 'PENDING_APPROVAL'
      ORDER BY je.submitted_for_approval_at ASC
      LIMIT $2 OFFSET $3
    `, [tenantId, parseInt(limit as string), offset]);

    // Get count
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM journal_entries 
      WHERE tenant_id = $1 AND approval_status = 'PENDING_APPROVAL'
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending approvals' });
  }
};

// ============================================================================
// APPROVAL HISTORY
// ============================================================================

export const getApprovalHistory = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId } = getTenantContext(req);
    const { journalEntryId } = req.params;

    const result = await pool.query(`
      SELECT ah.*, 
             al.level_name,
             aw.name as workflow_name
      FROM approval_history ah
      LEFT JOIN approval_levels al ON ah.level_id = al.id
      LEFT JOIN approval_workflows aw ON ah.workflow_id = aw.id
      WHERE ah.journal_entry_id = $1 AND ah.tenant_id = $2
      ORDER BY ah.created_at ASC
    `, [journalEntryId, tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error fetching approval history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch approval history' });
  }
};

// ============================================================================
// WORKFLOWS CRUD
// ============================================================================

export const getWorkflows = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId } = getTenantContext(req);
    const { is_active } = req.query;

    let query = `
      SELECT aw.*,
             COUNT(al.id) as level_count
      FROM approval_workflows aw
      LEFT JOIN approval_levels al ON aw.id = al.workflow_id
      WHERE aw.tenant_id = $1
    `;
    const values: any[] = [tenantId];

    if (is_active !== undefined) {
      query += ` AND aw.is_active = $2`;
      values.push(is_active === 'true');
    }

    query += ` GROUP BY aw.id ORDER BY aw.name`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error fetching workflows:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch workflows' });
  }
};

export const createWorkflow = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const workflowData = req.body;

    const result = await pool.query(`
      INSERT INTO approval_workflows (
        tenant_id, name, description, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      tenantId,
      workflowData.name,
      workflowData.description,
      workflowData.is_active !== false,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error creating workflow:', error);
    res.status(500).json({ success: false, error: 'Failed to create workflow' });
  }
};

export const getWorkflowLevels = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId } = getTenantContext(req);
    const { workflowId } = req.params;

    const result = await pool.query(`
      SELECT * FROM approval_levels
      WHERE workflow_id = $1 AND tenant_id = $2
      ORDER BY level_number ASC
    `, [workflowId, tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error fetching workflow levels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch workflow levels' });
  }
};

export const createWorkflowLevel = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { workflowId } = req.params;
    const levelData = req.body;

    // Verify workflow belongs to tenant
    const workflowCheck = await pool.query(
      'SELECT id FROM approval_workflows WHERE id = $1 AND tenant_id = $2',
      [workflowId, tenantId]
    );

    if (workflowCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Workflow not found' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO approval_levels (
        tenant_id, workflow_id, level_number, level_name, 
        approver_role, min_approvers, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tenantId,
      workflowId,
      levelData.level_number,
      levelData.level_name,
      levelData.approver_role,
      levelData.min_approvers || 1,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Approval level created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
      return;
    }
    console.error('Error creating workflow level:', error);
    res.status(500).json({ success: false, error: 'Failed to create workflow level' });
  }
};

export default {
  submitForApproval,
  approveEntry,
  rejectEntry,
  getPendingApprovals,
  getApprovalHistory,
  getWorkflows,
  createWorkflow,
  getWorkflowLevels,
  createWorkflowLevel
};
