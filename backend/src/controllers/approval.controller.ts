import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Approval Workflows Controller
 * Handles multi-level approval processes for journal entries
 */

// Submit journal entry for approval
export const submitForApproval = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const { journalEntryId } = req.params;
  const { workflowId, comments } = req.body;
  const performedBy = req.body.performedBy || 'CURRENT_USER'; // TODO: Get from auth

  try {
    await client.query('BEGIN');

    // 1. Get journal entry details
    const entryQuery = await client.query(`
      SELECT id, journal_number, status, approval_status,
             (SELECT SUM(debit_amount) FROM journal_entry_lines WHERE journal_entry_id = $1) as total_amount
      FROM journal_entries
      WHERE id = $1
    `, [journalEntryId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    const entry = entryQuery.rows[0];

    // 2. Validation checks
    if (entry.approval_status === 'PENDING_APPROVAL') {
      res.status(400).json({ error: 'Entry is already pending approval' });
      return;
    }

    if (entry.approval_status === 'APPROVED') {
      res.status(400).json({ error: 'Entry is already approved' });
      return;
    }

    if (entry.status === 'POSTED') {
      res.status(400).json({ error: 'Cannot submit posted entry for approval' });
      return;
    }

    // 3. Check if entry is balanced
    const balanceCheck = await client.query(`
      SELECT 
        SUM(debit_amount) as total_debits,
        SUM(credit_amount) as total_credits
      FROM journal_entry_lines
      WHERE journal_entry_id = $1
    `, [journalEntryId]);

    const { total_debits, total_credits } = balanceCheck.rows[0];
    if (Math.abs(parseFloat(total_debits) - parseFloat(total_credits)) > 0.01) {
      res.status(400).json({ error: 'Entry is not balanced. Debits must equal credits.' });
      return;
    }

    // 4. Determine workflow (auto-select based on amount if not provided)
    let selectedWorkflowId = workflowId;
    if (!selectedWorkflowId) {
      const amount = parseFloat(entry.total_amount || '0');
      
      // Auto-select workflow based on amount
      if (amount < 10000) {
        // Express workflow for small amounts
        const expressWf = await client.query(`
          SELECT id FROM approval_workflows 
          WHERE name = 'Express Journal Entry Approval' AND is_active = true
        `);
        selectedWorkflowId = expressWf.rows[0]?.id;
      } else if (amount > 1000000) {
        // Executive workflow for large amounts
        const execWf = await client.query(`
          SELECT id FROM approval_workflows 
          WHERE name = 'Executive Journal Entry Approval' AND is_active = true
        `);
        selectedWorkflowId = execWf.rows[0]?.id;
      } else {
        // Standard workflow for medium amounts
        const stdWf = await client.query(`
          SELECT id FROM approval_workflows 
          WHERE name = 'Standard Journal Entry Approval' AND is_active = true
        `);
        selectedWorkflowId = stdWf.rows[0]?.id;
      }
    }

    if (!selectedWorkflowId) {
      res.status(400).json({ error: 'No suitable workflow found. Please specify workflowId.' });
      return;
    }

    // 5. Get first approval level
    const firstLevel = await client.query(`
      SELECT id, level_number, level_name
      FROM approval_levels
      WHERE workflow_id = $1 AND level_number = 1
    `, [selectedWorkflowId]);

    if (firstLevel.rows.length === 0) {
      res.status(400).json({ error: 'Workflow has no approval levels configured' });
      return;
    }

    // 6. Update journal entry status
    await client.query(`
      UPDATE journal_entries
      SET approval_status = 'PENDING_APPROVAL',
          workflow_id = $1,
          current_approval_level = 1,
          submitted_for_approval_at = NOW(),
          submitted_by = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [selectedWorkflowId, performedBy, journalEntryId]);

    // 7. Create approval history record
    await client.query(`
      INSERT INTO approval_history (
        journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, 'SUBMITTED', $4, $5)
    `, [journalEntryId, selectedWorkflowId, firstLevel.rows[0].id, comments, performedBy]);

    await client.query('COMMIT');

    // 8. TODO: Send email notification to Level 1 approvers

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

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting for approval:', error);
    res.status(500).json({ error: 'Failed to submit for approval' });
  } finally {
    client.release();
  }
};

// Approve journal entry
export const approveEntry = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const { journalEntryId } = req.params;
  const { comments } = req.body;
  const performedBy = req.body.performedBy || 'CURRENT_USER'; // TODO: Get from auth

  try {
    await client.query('BEGIN');

    // 1. Get current approval state
    const entryQuery = await client.query(`
      SELECT id, journal_number, approval_status, workflow_id, current_approval_level, submitted_by
      FROM journal_entries
      WHERE id = $1
    `, [journalEntryId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    const entry = entryQuery.rows[0];

    // 2. Validation checks
    if (entry.approval_status !== 'PENDING_APPROVAL') {
      res.status(400).json({ error: 'Entry is not pending approval' });
      return;
    }

    // 3. Check 4-eyes principle (cannot approve own entry)
    if (entry.submitted_by === performedBy) {
      res.status(403).json({ error: 'Cannot approve your own entry (4-eyes principle)' });
      return;
    }

    // 4. Get current level details
    const currentLevelQuery = await client.query(`
      SELECT id, level_number, level_name, role_required
      FROM approval_levels
      WHERE workflow_id = $1 AND level_number = $2
    `, [entry.workflow_id, entry.current_approval_level]);

    if (currentLevelQuery.rows.length === 0) {
      res.status(400).json({ error: 'Invalid approval level' });
      return;
    }

    const currentLevel = currentLevelQuery.rows[0];

    // 5. TODO: Check if user has approval authority for this level (role check)

    // 6. Create approval history record
    await client.query(`
      INSERT INTO approval_history (
        journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, 'APPROVED', $4, $5)
    `, [journalEntryId, entry.workflow_id, currentLevel.id, comments, performedBy]);

    // 7. Check if there are more levels
    const nextLevelQuery = await client.query(`
      SELECT id, level_number, level_name
      FROM approval_levels
      WHERE workflow_id = $1 AND level_number = $2
    `, [entry.workflow_id, entry.current_approval_level + 1]);

    if (nextLevelQuery.rows.length > 0) {
      // More levels required - advance to next level
      const nextLevel = nextLevelQuery.rows[0];
      
      await client.query(`
        UPDATE journal_entries
        SET current_approval_level = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [nextLevel.level_number, journalEntryId]);

      await client.query('COMMIT');

      // TODO: Send notification to next level approvers

      res.status(200).json({
        success: true,
        message: `Approved at ${currentLevel.level_name}. Forwarded to ${nextLevel.level_name}`,
        data: {
          journal_entry_id: journalEntryId,
          approved_level: currentLevel.level_name,
          next_level: nextLevel.level_name,
          approval_complete: false
        }
      });
    } else {
      // Final approval - mark as approved
      await client.query(`
        UPDATE journal_entries
        SET approval_status = 'APPROVED',
            approved_at = NOW(),
            approved_by = $1,
            current_approval_level = NULL,
            updated_at = NOW()
        WHERE id = $2
      `, [performedBy, journalEntryId]);

      await client.query('COMMIT');

      // TODO: Send notification to preparer (entry approved)
      // TODO: Auto-post if configured

      res.status(200).json({
        success: true,
        message: `Entry ${entry.journal_number} fully approved`,
        data: {
          journal_entry_id: journalEntryId,
          approved_level: currentLevel.level_name,
          approval_complete: true
        }
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving entry:', error);
    res.status(500).json({ error: 'Failed to approve entry' });
  } finally {
    client.release();
  }
};

// Reject journal entry
export const rejectEntry = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const { journalEntryId } = req.params;
  const { reason, comments } = req.body;
  const performedBy = req.body.performedBy || 'CURRENT_USER'; // TODO: Get from auth

  try {
    await client.query('BEGIN');

    // Validation - reason is required
    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    // Get current approval state
    const entryQuery = await client.query(`
      SELECT id, journal_number, approval_status, workflow_id, current_approval_level
      FROM journal_entries
      WHERE id = $1
    `, [journalEntryId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    const entry = entryQuery.rows[0];

    if (entry.approval_status !== 'PENDING_APPROVAL') {
      res.status(400).json({ error: 'Entry is not pending approval' });
      return;
    }

    // Get current level details
    const currentLevelQuery = await client.query(`
      SELECT id, level_name
      FROM approval_levels
      WHERE workflow_id = $1 AND level_number = $2
    `, [entry.workflow_id, entry.current_approval_level]);

    const currentLevel = currentLevelQuery.rows[0];

    // Update entry status
    await client.query(`
      UPDATE journal_entries
      SET approval_status = 'REJECTED',
          rejected_at = NOW(),
          rejected_by = $1,
          rejection_reason = $2,
          current_approval_level = NULL,
          updated_at = NOW()
      WHERE id = $3
    `, [performedBy, reason, journalEntryId]);

    // Create approval history record
    await client.query(`
      INSERT INTO approval_history (
        journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, $3, 'REJECTED', $4, $5)
    `, [journalEntryId, entry.workflow_id, currentLevel.id, `${reason}${comments ? '\n\n' + comments : ''}`, performedBy]);

    await client.query('COMMIT');

    // TODO: Send notification to preparer (entry rejected)

    res.status(200).json({
      success: true,
      message: `Entry ${entry.journal_number} rejected`,
      data: {
        journal_entry_id: journalEntryId,
        rejected_by: performedBy,
        rejection_reason: reason
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting entry:', error);
    res.status(500).json({ error: 'Failed to reject entry' });
  } finally {
    client.release();
  }
};

// Recall journal entry (by preparer)
export const recallEntry = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const { journalEntryId } = req.params;
  const { reason } = req.body;
  const performedBy = req.body.performedBy || 'CURRENT_USER'; // TODO: Get from auth

  try {
    await client.query('BEGIN');

    // Get entry details
    const entryQuery = await client.query(`
      SELECT id, journal_number, approval_status, workflow_id, submitted_by
      FROM journal_entries
      WHERE id = $1
    `, [journalEntryId]);

    if (entryQuery.rows.length === 0) {
      res.status(404).json({ error: 'Journal entry not found' });
      return;
    }

    const entry = entryQuery.rows[0];

    // Validation checks
    if (entry.approval_status !== 'PENDING_APPROVAL') {
      res.status(400).json({ error: 'Entry is not pending approval' });
      return;
    }

    if (entry.submitted_by !== performedBy) {
      res.status(403).json({ error: 'Only the original preparer can recall an entry' });
      return;
    }

    // Update entry status
    await client.query(`
      UPDATE journal_entries
      SET approval_status = 'DRAFT',
          current_approval_level = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [journalEntryId]);

    // Create approval history record
    await client.query(`
      INSERT INTO approval_history (
        journal_entry_id, workflow_id, level_id, action, comments, performed_by
      ) VALUES ($1, $2, NULL, 'RECALLED', $3, $4)
    `, [journalEntryId, entry.workflow_id, reason, performedBy]);

    await client.query('COMMIT');

    // TODO: Send notification to approvers (FYI - entry recalled)

    res.status(200).json({
      success: true,
      message: `Entry ${entry.journal_number} recalled successfully`,
      data: {
        journal_entry_id: journalEntryId,
        new_status: 'DRAFT'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recalling entry:', error);
    res.status(500).json({ error: 'Failed to recall entry' });
  } finally {
    client.release();
  }
};

// Get entries pending MY approval
export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const performedBy = req.query.userId as string || 'CURRENT_USER'; // TODO: Get from auth
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    // TODO: Add role-based filtering when role system is implemented
    // For now, return all pending approvals
    
    const query = `
      SELECT 
        je.entry_id,
        je.journal_number,
        je.posting_date,
        je.description,
        je.approval_status,
        je.current_approval_level,
        je.submitted_for_approval_at,
        je.submitted_by,
        je.created_at,
        al.level_name as current_level_name,
        al.level_number,
        (SELECT SUM(debit_amount) FROM journal_entry_lines WHERE journal_entry_id = je.entry_id) as total_amount,
        EXTRACT(EPOCH FROM (NOW() - je.submitted_for_approval_at)) / 3600 as hours_pending
      FROM journal_entries je
      LEFT JOIN approval_levels al ON je.workflow_id = al.workflow_id 
        AND je.current_approval_level = al.level_number
      WHERE je.approval_status = 'PENDING_APPROVAL'
      ORDER BY je.submitted_for_approval_at ASC
      LIMIT $1
    `;

    const result = await client.query(query, [limit]);

    const entries = result.rows.map(row => ({
      id: row.id,
      journal_number: row.journal_number,
      posting_date: row.posting_date,
      description: row.description,
      total_amount: parseFloat(row.total_amount || 0),
      submitted_by: row.submitted_by,
      submitted_at: row.submitted_for_approval_at,
      current_level: {
        number: row.level_number,
        name: row.current_level_name
      },
      hours_pending: parseFloat(row.hours_pending || 0),
      priority: row.hours_pending > 48 ? 'HIGH' : row.hours_pending > 24 ? 'MEDIUM' : 'NORMAL'
    }));

    res.json({
      count: entries.length,
      entries
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  } finally {
    client.release();
  }
};

// Get approval history for a journal entry
export const getApprovalHistory = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  const { journalEntryId } = req.params;

  try {
    const query = `
      SELECT 
        ah.id,
        ah.action,
        ah.comments,
        ah.performed_by,
        ah.performed_at,
        al.level_name,
        al.level_number
      FROM approval_history ah
      LEFT JOIN approval_levels al ON ah.level_id = al.id
      WHERE ah.journal_entry_id = $1
      ORDER BY ah.performed_at DESC
    `;

    const result = await client.query(query, [journalEntryId]);

    const history = result.rows.map(row => ({
      id: row.id,
      action: row.action,
      comments: row.comments,
      performed_by: row.performed_by,
      performed_at: row.performed_at,
      level: row.level_name ? {
        number: row.level_number,
        name: row.level_name
      } : null
    }));

    res.json(history);

  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  } finally {
    client.release();
  }
};

// Get approval statistics
export const getApprovalStats = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE approval_status = 'PENDING_APPROVAL') as pending_total,
        COUNT(*) FILTER (WHERE approval_status = 'APPROVED' AND approved_at >= CURRENT_DATE) as approved_today,
        COUNT(*) FILTER (WHERE approval_status = 'REJECTED' AND rejected_at >= CURRENT_DATE) as rejected_today,
        AVG(EXTRACT(EPOCH FROM (approved_at - submitted_for_approval_at)) / 3600) FILTER (WHERE approval_status = 'APPROVED') as avg_approval_hours
      FROM journal_entries
      WHERE submitted_for_approval_at IS NOT NULL
    `);

    res.json({
      pending_total: parseInt(stats.rows[0].pending_total || 0),
      approved_today: parseInt(stats.rows[0].approved_today || 0),
      rejected_today: parseInt(stats.rows[0].rejected_today || 0),
      average_approval_time_hours: parseFloat(stats.rows[0].avg_approval_hours || 0).toFixed(1)
    });

  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ error: 'Failed to fetch approval statistics' });
  } finally {
    client.release();
  }
};
