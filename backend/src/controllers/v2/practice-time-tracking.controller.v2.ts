import { Response } from 'express';
import { TenantRequest } from '../../types';
import { pool } from '../../config/database';

function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

export const getAllTimeEntries = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
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

    const params: any[] = [tenantId];
    let paramCount = 2;

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
      JOIN employees e ON te.employee_id = e.employee_id AND e.tenant_id = te.tenant_id
      JOIN client_projects cp ON te.project_id = cp.project_id AND cp.tenant_id = te.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1
    `;

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

    const allowedSortFields = ['entry_date', 'hours', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'entry_date';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY te.${sortField} ${sortDirection}`;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM time_entries te
      WHERE te.tenant_id = $1
    `;
    const countParams: any[] = [tenantId];
    let countParamIndex = 2;

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
    const total = parseInt(countResult.rows[0].total, 10);

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
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1
    `;
    const statsParams: any[] = [tenantId];
    let statsParamIndex = 2;

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
    res.status(500).json({ success: false, message: 'Failed to fetch time entries', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTimeEntryById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
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
      JOIN employees e ON te.employee_id = e.employee_id AND e.tenant_id = te.tenant_id
      JOIN client_projects cp ON te.project_id = cp.project_id AND cp.tenant_id = te.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1 AND te.entry_id = $2`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch time entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
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

    if (!project_id || !employee_id || !entry_date || !hours) {
      return res.status(400).json({ success: false, message: 'Missing required fields: project_id, employee_id, entry_date, hours' });
    }

    if (hours <= 0 || hours > 24) {
      return res.status(400).json({ success: false, message: 'Hours must be between 0 and 24' });
    }

    const teamCheck = await pool.query(
      `SELECT 1 FROM project_team_members
       WHERE tenant_id = $1 AND project_id = $2 AND employee_id = $3 AND is_active = true`,
      [tenantId, project_id, employee_id]
    );

    if (teamCheck.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Employee is not assigned to this project' });
    }

    const result = await pool.query(
      `INSERT INTO time_entries (
        tenant_id,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId,
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
      ]
    );

    res.status(201).json({ success: true, message: 'Time entry created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to create time entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = ['entry_date', 'hours', 'task_description', 'billable', 'status'];

    const setClauses: string[] = [];
    const values: any[] = [tenantId];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE time_entries
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1 AND entry_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    res.json({ success: true, message: 'Time entry updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to update time entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTimeEntry = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const checkResult = await pool.query(
      `SELECT status FROM time_entries WHERE tenant_id = $1 AND entry_id = $2`,
      [tenantId, id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Time entry not found' });
    }

    if (checkResult.rows[0].status === 'Invoiced') {
      return res.status(400).json({ success: false, message: 'Cannot delete invoiced time entry' });
    }

    const result = await pool.query(
      `DELETE FROM time_entries
       WHERE tenant_id = $1 AND entry_id = $2
       RETURNING *`,
      [tenantId, id]
    );

    res.json({ success: true, message: 'Time entry deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ success: false, message: 'Failed to delete time entry', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const approveTimeEntries = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId } = getTenantContext(req);
    await client.query('BEGIN');

    const { entry_ids, approved_by } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'entry_ids array is required' });
    }

    const result = await client.query(
      `UPDATE time_entries
       SET status = 'Approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE tenant_id = $2 AND entry_id = ANY($3) AND status = 'Pending'
       RETURNING *`,
      [approved_by || null, tenantId, entry_ids]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: `${result.rows.length} time entries approved successfully`, data: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving time entries:', error);
    res.status(500).json({ success: false, message: 'Failed to approve time entries', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const rejectTimeEntries = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId } = getTenantContext(req);
    await client.query('BEGIN');

    const { entry_ids, rejection_reason } = req.body;

    if (!entry_ids || !Array.isArray(entry_ids) || entry_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'entry_ids array is required' });
    }

    const result = await client.query(
      `UPDATE time_entries
       SET 
        status = 'Rejected',
        description = COALESCE(description, '') || E'\n\nRejection reason: ' || $1,
        updated_at = NOW()
       WHERE tenant_id = $2 AND entry_id = ANY($3) AND status = 'Pending'
       RETURNING *`,
      [rejection_reason || 'No reason provided', tenantId, entry_ids]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: `${result.rows.length} time entries rejected`, data: result.rows });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting time entries:', error);
    res.status(500).json({ success: false, message: 'Failed to reject time entries', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const getTimesheet = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { employee_id, start_date, end_date } = req.query;

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'employee_id, start_date, and end_date are required' });
    }

    const result = await pool.query(
      `SELECT 
        te.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        ptm.hourly_billing_rate
      FROM time_entries te
      JOIN client_projects cp ON te.project_id = cp.project_id AND cp.tenant_id = te.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1
        AND te.employee_id = $2
        AND te.entry_date >= $3
        AND te.entry_date <= $4
      ORDER BY te.entry_date ASC, te.created_at ASC`,
      [tenantId, employee_id, start_date, end_date]
    );

    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_entries,
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN billable THEN hours ELSE 0 END), 0) as billable_hours,
        COALESCE(SUM(CASE WHEN NOT billable THEN hours ELSE 0 END), 0) as non_billable_hours,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_entries,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_entries,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_entries
      FROM time_entries
      WHERE tenant_id = $1 AND employee_id = $2
        AND entry_date >= $3 AND entry_date <= $4`,
      [tenantId, employee_id, start_date, end_date]
    );

    res.json({ success: true, data: result.rows, summary: summaryResult.rows[0] });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timesheet', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getPendingApprovals = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
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
      JOIN employees e ON te.employee_id = e.employee_id AND e.tenant_id = te.tenant_id
      JOIN client_projects cp ON te.project_id = cp.project_id AND cp.tenant_id = te.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1 AND te.status = 'Pending'
    `;

    const params: any[] = [tenantId];

    if (manager_id) {
      query += ` AND cp.project_manager_id = $2`;
      params.push(manager_id);
    }

    query += ` ORDER BY te.entry_date DESC, te.created_at ASC`;

    const result = await pool.query(query, params);

    const summaryResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT te.project_id) as projects_count,
        COUNT(DISTINCT te.employee_id) as employees_count,
        COUNT(*) as total_entries,
        COALESCE(SUM(te.hours), 0) as total_hours,
        COALESCE(SUM(te.hours * ptm.hourly_billing_rate), 0) as total_value
      FROM time_entries te
      JOIN client_projects cp ON te.project_id = cp.project_id AND cp.tenant_id = te.tenant_id
      LEFT JOIN project_team_members ptm ON te.project_id = ptm.project_id 
        AND te.employee_id = ptm.employee_id 
        AND ptm.is_active = true
        AND ptm.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1 AND te.status = 'Pending'
      ${manager_id ? 'AND cp.project_manager_id = $2' : ''}`,
      params
    );

    res.json({ success: true, data: result.rows, summary: summaryResult.rows[0] });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
