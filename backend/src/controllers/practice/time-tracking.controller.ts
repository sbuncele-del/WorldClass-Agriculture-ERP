import { Request, Response } from 'express';
import pool from '../../config/database';

/**
 * ============================================================================
 * PRACTICE MANAGEMENT - TIME TRACKING CONTROLLER
 * ============================================================================
 * 
 * Handles time entry, approval workflows, and billable hours tracking
 * 
 * Features:
 * - Time entry CRUD
 * - Approval workflows (Pending → Approved → Invoiced)
 * - AI-suggested time entries
 * - Billable vs non-billable tracking
 * - Timesheet reports
 * ============================================================================
 */

// ============================================================================
// GET ALL TIME ENTRIES
// ============================================================================
export const getAllTimeEntries = async (req: Request, res: Response) => {
  try {
    const { 
      project_id,
      employee_id,
      status,
      billable,
      start_date,
      end_date,
      page = 1,
      limit = 50,
      sort_by = 'entry_date',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        ptm.hourly_billing_rate,
        ptm.hourly_cost_rate,
        (te.hours * ptm.hourly_billing_rate) as billing_value,
        (te.hours * ptm.hourly_cost_rate) as cost_value
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      JOIN client_projects cp ON te.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND te.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (employee_id) {
      query += ` AND te.employee_id = $${paramCount}`;
      params.push(employee_id);
      paramCount++;
    }

    if (status) {
      query += ` AND te.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (billable !== undefined) {
      query += ` AND te.billable = $${paramCount}`;
      params.push(billable === 'true');
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

    // Add sorting
    const allowedSortFields = ['entry_date', 'hours', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'entry_date';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY te.${sortField} ${sortDirection}`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM time_entries te
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (project_id) {
      countQuery += ` AND te.project_id = $${countParamIndex}`;
      countParams.push(project_id);
      countParamIndex++;
    }
    if (employee_id) {
      countQuery += ` AND te.employee_id = $${countParamIndex}`;
      countParams.push(employee_id);
      countParamIndex++;
    }
    if (status) {
      countQuery += ` AND te.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (billable !== undefined) {
      countQuery += ` AND te.billable = $${countParamIndex}`;
      countParams.push(billable === 'true');
      countParamIndex++;
    }
    if (start_date) {
      countQuery += ` AND te.entry_date >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }
    if (end_date) {
      countQuery += ` AND te.entry_date <= $${countParamIndex}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Get summary statistics - rebuild WHERE clause
    let statsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0) as billable_hours,
        COALESCE(SUM(CASE WHEN NOT te.billable THEN te.hours ELSE 0 END), 0) as non_billable_hours,
        COALESCE(SUM(te.hours * ptm.hourly_billing_rate), 0) as total_billing_value,
        COALESCE(SUM(te.hours * ptm.hourly_cost_rate), 0) as total_cost_value
      FROM time_entries te
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE 1=1
    `;
    
    // Apply same filters as count query
    const statsParams: any[] = [];
    let statsParamIndex = 1;
    
    if (project_id) {
      statsQuery += ` AND te.project_id = $${statsParamIndex}`;
      statsParams.push(project_id);
      statsParamIndex++;
    }
    if (employee_id) {
      statsQuery += ` AND te.employee_id = $${statsParamIndex}`;
      statsParams.push(employee_id);
      statsParamIndex++;
    }
    if (status) {
      statsQuery += ` AND te.status = $${statsParamIndex}`;
      statsParams.push(status);
      statsParamIndex++;
    }
    if (billable !== undefined) {
      statsQuery += ` AND te.billable = $${statsParamIndex}`;
      statsParams.push(billable === 'true');
      statsParamIndex++;
    }
    if (start_date) {
      statsQuery += ` AND te.entry_date >= $${statsParamIndex}`;
      statsParams.push(start_date);
      statsParamIndex++;
    }
    if (end_date) {
      statsQuery += ` AND te.entry_date <= $${statsParamIndex}`;
      statsParams.push(end_date);
    }
    
    const statsResult = await pool.query(statsQuery, statsParams);

    res.json({
      success: true,
      data: result.rows,
      summary: statsResult.rows[0],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch time entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET TIME ENTRY BY ID
// ============================================================================
export const getTimeEntryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email as employee_email,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        ptm.hourly_billing_rate,
        ptm.hourly_cost_rate,
        (te.hours * ptm.hourly_billing_rate) as billing_value,
        (te.hours * ptm.hourly_cost_rate) as cost_value
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      JOIN client_projects cp ON te.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE te.entry_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Time entry not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CREATE TIME ENTRY
// ============================================================================
export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      employee_id,
      entry_date,
      hours,
      description,
      billable = true,
      status = 'Pending',
      suggested_by_ai = false,
      ai_confidence_score,
      ai_evidence
    } = req.body;

    // Validate required fields
    if (!project_id || !employee_id || !entry_date || !hours) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, employee_id, entry_date, hours'
      });
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours must be between 0 and 24'
      });
    }

    // Check if employee is assigned to project
    const teamCheck = await pool.query(`
      SELECT * FROM project_team_members
      WHERE project_id = $1 AND employee_id = $2 AND is_active = true
    `, [project_id, employee_id]);

    if (teamCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not assigned to this project'
      });
    }

    const result = await pool.query(`
      INSERT INTO time_entries (
        project_id,
        employee_id,
        entry_date,
        hours,
        task_description,
        billable,
        status,
        suggested_by_ai,
        ai_confidence_score,
        ai_evidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      project_id,
      employee_id,
      entry_date,
      hours,
      description || null,
      billable,
      status,
      suggested_by_ai,
      ai_confidence_score || null,
      ai_evidence || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Time entry created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// UPDATE TIME ENTRY
// ============================================================================
export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'entry_date', 'hours', 'task_description', 'billable', 'status'
    ];

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE time_entries
      SET ${setClauses.join(', ')}
      WHERE entry_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// DELETE TIME ENTRY
// ============================================================================
export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if entry is already approved or invoiced
    const checkResult = await pool.query(`
      SELECT status FROM time_entries WHERE entry_id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    if (checkResult.rows[0].status === 'Invoiced') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete invoiced time entry'
      });
    }

    const result = await pool.query(`
      DELETE FROM time_entries
      WHERE entry_id = $1
      RETURNING *
    `, [id]);

    res.json({
      success: true,
      message: 'Time entry deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete time entry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// APPROVE TIME ENTRIES (Batch)
// ============================================================================
export const approveTimeEntries = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { entry_ids, approved_by } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'entry_ids array is required'
      });
    }

    const result = await client.query(`
      UPDATE time_entries
      SET 
        status = 'Approved',
        approved_by = $1,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE entry_id = ANY($2) AND status = 'Pending'
      RETURNING *
    `, [approved_by || null, entry_ids]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${result.rows.length} time entries approved successfully`,
      data: result.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving time entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve time entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// REJECT TIME ENTRIES (Batch)
// ============================================================================
export const rejectTimeEntries = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { entry_ids, rejection_reason } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'entry_ids array is required'
      });
    }

    const result = await client.query(`
      UPDATE time_entries
      SET 
        status = 'Rejected',
        description = COALESCE(description, '') || E'\n\nRejection reason: ' || $1,
        updated_at = NOW()
      WHERE entry_id = ANY($2) AND status = 'Pending'
      RETURNING *
    `, [rejection_reason || 'No reason provided', entry_ids]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${result.rows.length} time entries rejected`,
      data: result.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting time entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject time entries',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// GET TIMESHEET (Employee weekly/monthly view)
// ============================================================================
export const getTimesheet = async (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'employee_id, start_date, and end_date are required'
      });
    }

    const result = await pool.query(`
      SELECT 
        te.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        ptm.hourly_billing_rate
      FROM time_entries te
      JOIN client_projects cp ON te.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE te.employee_id = $1
        AND te.entry_date >= $2
        AND te.entry_date <= $3
      ORDER BY te.entry_date ASC, te.created_at ASC
    `, [employee_id, start_date, end_date]);

    // Get summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN billable THEN hours ELSE 0 END), 0) as billable_hours,
        COALESCE(SUM(CASE WHEN NOT billable THEN hours ELSE 0 END), 0) as non_billable_hours,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_entries,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_entries,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_entries
      FROM time_entries
      WHERE employee_id = $1
        AND entry_date >= $2
        AND entry_date <= $3
    `, [employee_id, start_date, end_date]);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch timesheet',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET PENDING APPROVALS (For managers)
// ============================================================================
export const getPendingApprovals = async (req: Request, res: Response) => {
  try {
    const { manager_id } = req.query;

    let query = `
      SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        ptm.hourly_billing_rate,
        (te.hours * ptm.hourly_billing_rate) as billing_value
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      JOIN client_projects cp ON te.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE te.status = 'Pending'
    `;

    const params: any[] = [];

    if (manager_id) {
      query += ` AND cp.project_manager_id = $1`;
      params.push(manager_id);
    }

    query += ` ORDER BY te.entry_date DESC, te.created_at ASC`;

    const result = await pool.query(query, params);

    // Get summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT te.project_id) as projects_count,
        COUNT(DISTINCT te.employee_id) as employees_count,
        COUNT(*) as total_entries,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(te.hours * ptm.hourly_billing_rate), 0) as total_value
      FROM time_entries te
      JOIN client_projects cp ON te.project_id = cp.project_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
      WHERE te.status = 'Pending'
      ${manager_id ? 'AND cp.project_manager_id = $1' : ''}
    `, params);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending approvals',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
