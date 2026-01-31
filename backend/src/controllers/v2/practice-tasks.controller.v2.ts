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

export const getAllTasks = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { project_id, assigned_to, status, priority, search, page = 1, limit = 50 } = req.query;

    const params: any[] = [tenantId];
    let paramCount = 2;

    let query = `
      SELECT 
        pt.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        e.first_name || ' ' || e.last_name as assigned_to_name
      FROM project_tasks pt
      JOIN client_projects cp ON pt.project_id = cp.project_id AND cp.tenant_id = pt.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN employees e ON pt.assigned_to = e.employee_id AND e.tenant_id = pt.tenant_id
      WHERE pt.tenant_id = $1
    `;

    if (project_id) {
      query += ` AND pt.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND pt.assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    if (status) {
      query += ` AND pt.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND pt.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (search) {
      query += ` AND (pt.task_name ILIKE $${paramCount} OR pt.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE pt.status 
        WHEN 'Blocked' THEN 1
        WHEN 'In Progress' THEN 2
        WHEN 'Not Started' THEN 3
        WHEN 'Completed' THEN 4
        ELSE 5
      END,
      CASE pt.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5
      END,
      pt.planned_end_date ASC NULLS LAST
    `;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM project_tasks pt
      WHERE pt.tenant_id = $1
    `;
    const countParams: any[] = [tenantId];
    let countParamIndex = 2;

    if (project_id) {
      countQuery += ` AND pt.project_id = $${countParamIndex}`;
      countParams.push(project_id);
      countParamIndex++;
    }
    if (assigned_to) {
      countQuery += ` AND pt.assigned_to = $${countParamIndex}`;
      countParams.push(assigned_to);
      countParamIndex++;
    }
    if (status) {
      countQuery += ` AND pt.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (priority) {
      countQuery += ` AND pt.priority = $${countParamIndex}`;
      countParams.push(priority);
      countParamIndex++;
    }
    if (search) {
      countQuery += ` AND (pt.task_name ILIKE $${countParamIndex} OR pt.description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getTaskById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        pt.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        e.first_name || ' ' || e.last_name as assigned_to_name,
        e.job_title as assigned_to_job_title
      FROM project_tasks pt
      JOIN client_projects cp ON pt.project_id = cp.project_id AND cp.tenant_id = pt.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN employees e ON pt.assigned_to = e.employee_id AND e.tenant_id = pt.tenant_id
      WHERE pt.tenant_id = $1 AND pt.task_id = $2`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      project_id,
      task_name,
      description,
      assigned_to,
      status = 'Not Started',
      priority = 'Medium',
      planned_end_date,
      estimated_hours,
      dependencies
    } = req.body;

    if (!project_id || !task_name) {
      return res.status(400).json({ success: false, message: 'project_id and task_name are required' });
    }

    const result = await pool.query(
      `INSERT INTO project_tasks (
        tenant_id,
        project_id,
        task_name,
        description,
        assigned_to,
        status,
        priority,
        planned_end_date,
        estimated_hours,
        dependencies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId,
        project_id,
        task_name,
        description || null,
        assigned_to || null,
        status,
        priority,
        planned_end_date || null,
        estimated_hours || null,
        dependencies || null
      ]
    );

    res.status(201).json({ success: true, message: 'Task created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'task_title', 'description', 'assigned_to', 'status', 'priority',
      'planned_end_date', 'estimated_hours', 'actual_hours', 'completion_percentage',
      'dependencies', 'blockers', 'notes'
    ];

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

    if (updates.status === 'Completed') {
      setClauses.push(`actual_end_date = NOW()`);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE project_tasks
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1 AND task_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM project_tasks WHERE tenant_id = $1 AND task_id = $2 RETURNING *`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getMyTasks = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { employee_id } = req.params;
    const { status, priority } = req.query;

    const params: any[] = [tenantId, employee_id];
    let paramCount = 3;

    let query = `
      SELECT 
        pt.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND task_id = pt.task_id AND employee_id = $2
        ) as my_hours_logged
      FROM project_tasks pt
      JOIN client_projects cp ON pt.project_id = cp.project_id AND cp.tenant_id = pt.tenant_id
      JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      WHERE pt.tenant_id = $1 AND pt.assigned_to = $2
    `;

    if (status) {
      query += ` AND pt.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND pt.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE pt.status 
        WHEN 'Blocked' THEN 1
        WHEN 'In Progress' THEN 2
        WHEN 'Not Started' THEN 3
        WHEN 'Completed' THEN 4
        ELSE 5
      END,
      CASE pt.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5
      END,
      pt.planned_end_date ASC NULLS LAST
    `;

    const result = await pool.query(query, params);

    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'Not Started' THEN 1 END) as not_started,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'Blocked' THEN 1 END) as blocked,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN planned_end_date < CURRENT_DATE AND status != 'Completed' THEN 1 END) as overdue
      FROM project_tasks
      WHERE tenant_id = $1 AND assigned_to = $2`,
      [tenantId, employee_id]
    );

    res.json({ success: true, data: result.rows, summary: summaryResult.rows[0] });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
