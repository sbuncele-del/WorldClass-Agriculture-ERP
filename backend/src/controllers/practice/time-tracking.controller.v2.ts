/**
 * Practice Management - Time Tracking Controller V2
 * Tenant-aware handlers for time entry and billable hours tracking
 * 
 * IMPORTANT: Uses TenantRequest for typed tenant context from middleware.
 */

import { Response } from 'express';
import { TenantRequest } from '../../types';
import pool from '../../config/database';

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
// GET ALL TIME ENTRIES
// ============================================================================

export const getAllTimeEntries = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { 
      project_id,
      status,
      start_date,
      end_date,
      page = '1',
      limit = '50'
    } = req.query;

    // Simple query using time_entries table
    let query = `
      SELECT 
        te.id,
        te.project_id,
        te.task_id,
        te.hours,
        te.entry_date,
        te.created_at
      FROM time_entries te
      WHERE te.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (project_id) {
      query += ` AND te.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND te.entry_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND te.entry_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY te.created_at DESC`;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get totals
    const totalsResult = await pool.query(
      `SELECT 
         COUNT(*) as total_entries,
         COALESCE(SUM(hours), 0) as total_hours
       FROM time_entries
       WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
      totals: totalsResult.rows[0],
      page: parseInt(page as string)
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching time entries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch time entries', error: error.message });
  }
};

// ============================================================================
// GET TIME ENTRY BY ID
// ============================================================================

export const getTimeEntryById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        pt.task_name
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      JOIN client_projects cp ON te.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN project_tasks pt ON te.task_id = pt.task_id
      WHERE te.entry_id = $1 AND te.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch time entry', error: error.message });
  }
};

// ============================================================================
// CREATE TIME ENTRY
// ============================================================================

export const createTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const entryData = req.body;

    // Get employee_id for current user if not provided
    let employeeId = entryData.employee_id;
    if (!employeeId && userId) {
      const empResult = await pool.query(
        'SELECT employee_id FROM employees WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );
      if (empResult.rows.length > 0) {
        employeeId = empResult.rows[0].employee_id;
      }
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required' });
    }

    // Verify project belongs to tenant
    const projectCheck = await pool.query(
      'SELECT project_id FROM client_projects WHERE project_id = $1 AND tenant_id = $2',
      [entryData.project_id, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const result = await pool.query(`
      INSERT INTO time_entries (
        tenant_id, project_id, task_id, employee_id, entry_date,
        hours, description, billable, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      entryData.project_id,
      entryData.task_id,
      employeeId,
      entryData.entry_date,
      entryData.hours,
      entryData.description,
      entryData.billable !== false,
      entryData.status || 'Pending',
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to create time entry', error: error.message });
  }
};

// ============================================================================
// UPDATE TIME ENTRY
// ============================================================================

export const updateTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const updateData = req.body;

    // Check if entry is still editable (not approved/invoiced)
    const entryCheck = await pool.query(
      'SELECT status FROM time_entries WHERE entry_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    if (['Approved', 'Invoiced'].includes(entryCheck.rows[0].status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit approved or invoiced time entries' });
    }

    const result = await pool.query(`
      UPDATE time_entries SET
        project_id = COALESCE($1, project_id),
        task_id = COALESCE($2, task_id),
        entry_date = COALESCE($3, entry_date),
        hours = COALESCE($4, hours),
        description = COALESCE($5, description),
        billable = COALESCE($6, billable),
        updated_by = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE entry_id = $8 AND tenant_id = $9
      RETURNING *
    `, [
      updateData.project_id,
      updateData.task_id,
      updateData.entry_date,
      updateData.hours,
      updateData.description,
      updateData.billable,
      userId,
      id,
      tenantId
    ]);

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to update time entry', error: error.message });
  }
};

// ============================================================================
// DELETE TIME ENTRY
// ============================================================================

export const deleteTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    // Check if entry is deletable
    const entryCheck = await pool.query(
      'SELECT status FROM time_entries WHERE entry_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    if (['Approved', 'Invoiced'].includes(entryCheck.rows[0].status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete approved or invoiced time entries' });
    }

    await pool.query(
      'DELETE FROM time_entries WHERE entry_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error deleting time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete time entry', error: error.message });
  }
};

// ============================================================================
// APPROVE TIME ENTRIES
// ============================================================================

export const approveTimeEntries = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { entry_ids, comments } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Entry IDs are required' });
    }

    const result = await pool.query(`
      UPDATE time_entries SET
        status = 'Approved',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        approval_comments = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE entry_id = ANY($3) AND tenant_id = $4 AND status = 'Pending'
      RETURNING *
    `, [userId, comments, entry_ids, tenantId]);

    res.json({
      success: true,
      message: `${result.rowCount} time entries approved`,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error approving time entries:', error);
    res.status(500).json({ success: false, message: 'Failed to approve time entries', error: error.message });
  }
};

// ============================================================================
// REJECT TIME ENTRIES
// ============================================================================

export const rejectTimeEntries = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { entry_ids, reason } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Entry IDs are required' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const result = await pool.query(`
      UPDATE time_entries SET
        status = 'Rejected',
        rejected_by = $1,
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE entry_id = ANY($3) AND tenant_id = $4 AND status = 'Pending'
      RETURNING *
    `, [userId, reason, entry_ids, tenantId]);

    res.json({
      success: true,
      message: `${result.rowCount} time entries rejected`,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error rejecting time entries:', error);
    res.status(500).json({ success: false, message: 'Failed to reject time entries', error: error.message });
  }
};

// ============================================================================
// MY TIMESHEET
// ============================================================================

export const getMyTimesheet = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { start_date, end_date } = req.query;

    // Get employee_id for current user
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (employeeResult.rows.length === 0) {
      return res.json({ success: true, data: [], totals: { total_hours: 0, billable_hours: 0 } });
    }

    const employeeId = employeeResult.rows[0].employee_id;

    let query = `
      SELECT 
        te.*,
        cp.project_name,
        cp.project_number,
        pt.task_name
      FROM time_entries te
      JOIN client_projects cp ON te.project_id = cp.project_id
      LEFT JOIN project_tasks pt ON te.task_id = pt.task_id
      WHERE te.employee_id = $1 AND te.tenant_id = $2
    `;
    const params: any[] = [employeeId, tenantId];
    let paramCount = 3;

    if (start_date) {
      query += ` AND te.entry_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND te.entry_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY te.entry_date DESC`;

    const result = await pool.query(query, params);

    // Get totals
    const totalsQuery = `
      SELECT 
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN billable THEN hours ELSE 0 END), 0) as billable_hours
      FROM time_entries
      WHERE employee_id = $1 AND tenant_id = $2
      ${start_date ? `AND entry_date >= '${start_date}'` : ''}
      ${end_date ? `AND entry_date <= '${end_date}'` : ''}
    `;
    const totalsResult = await pool.query(totalsQuery, [employeeId, tenantId]);

    res.json({
      success: true,
      data: result.rows,
      totals: totalsResult.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching timesheet:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timesheet', error: error.message });
  }
};

// ============================================================================
// TIMESHEET SUMMARY
// ============================================================================

export const getTimesheetSummary = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { start_date, end_date } = req.query;

    // Hours by project
    const byProject = await pool.query(`
      SELECT 
        cp.project_id,
        cp.project_name,
        cp.project_number,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0) as billable_hours
      FROM client_projects cp
      LEFT JOIN time_entries te ON cp.project_id = te.project_id 
        AND te.tenant_id = $1
        ${start_date ? `AND te.entry_date >= '${start_date}'` : ''}
        ${end_date ? `AND te.entry_date <= '${end_date}'` : ''}
      WHERE cp.tenant_id = $1
      GROUP BY cp.project_id, cp.project_name, cp.project_number
      HAVING COALESCE(SUM(te.hours), 0) > 0
      ORDER BY total_hours DESC
    `, [tenantId]);

    // Hours by employee
    const byEmployee = await pool.query(`
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0) as billable_hours
      FROM employees e
      LEFT JOIN time_entries te ON e.employee_id = te.employee_id
        AND te.tenant_id = $1
        ${start_date ? `AND te.entry_date >= '${start_date}'` : ''}
        ${end_date ? `AND te.entry_date <= '${end_date}'` : ''}
      WHERE e.tenant_id = $1
      GROUP BY e.employee_id, e.first_name, e.last_name
      HAVING COALESCE(SUM(te.hours), 0) > 0
      ORDER BY total_hours DESC
    `, [tenantId]);

    // Pending approvals
    const pendingApprovals = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(hours), 0) as total_hours
      FROM time_entries
      WHERE tenant_id = $1 AND status = 'Pending'
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        byProject: byProject.rows,
        byEmployee: byEmployee.rows,
        pendingApprovals: pendingApprovals.rows[0]
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error.message });
  }
};

export default {
  getAllTimeEntries,
  getTimeEntryById,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  approveTimeEntries,
  rejectTimeEntries,
  getMyTimesheet,
  getTimesheetSummary
};
