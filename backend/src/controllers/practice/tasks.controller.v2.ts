/**
 * Practice Management - Tasks Controller V2
 * Tenant-aware handlers for project tasks and workflows
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
// GET ALL TASKS
// ============================================================================

export const getAllTasks = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { 
      project_id,
      status,
      search,
      page = '1',
      limit = '50' 
    } = req.query;

    // Simple query using project_tasks table
    let query = `
      SELECT 
        pt.id,
        pt.task_name,
        pt.status,
        pt.project_id,
        pt.created_at
      FROM project_tasks pt
      WHERE pt.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (project_id) {
      query += ` AND pt.project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (status) {
      query += ` AND pt.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND pt.task_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY pt.created_at DESC`;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM project_tasks WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string)
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
};

// ============================================================================
// GET TASK BY ID
// ============================================================================

export const getTaskById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        pt.*,
        cp.project_name,
        cp.project_number,
        c.customer_name,
        e.first_name || ' ' || e.last_name as assigned_to_name
      FROM project_tasks pt
      JOIN client_projects cp ON pt.project_id = cp.project_id
      JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN employees e ON pt.assigned_to = e.employee_id
      WHERE pt.task_id = $1 AND pt.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Get time entries for this task
    const timeEntries = await pool.query(`
      SELECT te.*, e.first_name || ' ' || e.last_name as employee_name
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      WHERE te.task_id = $1 AND te.tenant_id = $2
      ORDER BY te.entry_date DESC
      LIMIT 10
    `, [id, tenantId]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        time_entries: timeEntries.rows
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch task', error: error.message });
  }
};

// ============================================================================
// CREATE TASK
// ============================================================================

export const createTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const taskData = req.body;

    // Verify project belongs to tenant
    const projectCheck = await pool.query(
      'SELECT project_id FROM client_projects WHERE project_id = $1 AND tenant_id = $2',
      [taskData.project_id, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const result = await pool.query(`
      INSERT INTO project_tasks (
        tenant_id, project_id, task_name, description, assigned_to,
        status, priority, estimated_hours, due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      taskData.project_id,
      taskData.task_name,
      taskData.description,
      taskData.assigned_to,
      taskData.status || 'Not Started',
      taskData.priority || 'Medium',
      taskData.estimated_hours,
      taskData.due_date,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

// ============================================================================
// UPDATE TASK
// ============================================================================

export const updateTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const updateData = req.body;

    const result = await pool.query(`
      UPDATE project_tasks SET
        task_name = COALESCE($1, task_name),
        description = COALESCE($2, description),
        assigned_to = COALESCE($3, assigned_to),
        status = COALESCE($4, status),
        priority = COALESCE($5, priority),
        estimated_hours = COALESCE($6, estimated_hours),
        actual_hours = COALESCE($7, actual_hours),
        due_date = COALESCE($8, due_date),
        completed_date = COALESCE($9, completed_date),
        updated_by = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE task_id = $11 AND tenant_id = $12
      RETURNING *
    `, [
      updateData.task_name,
      updateData.description,
      updateData.assigned_to,
      updateData.status,
      updateData.priority,
      updateData.estimated_hours,
      updateData.actual_hours,
      updateData.due_date,
      updateData.completed_date,
      userId,
      id,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

// ============================================================================
// DELETE TASK
// ============================================================================

export const deleteTask = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM project_tasks WHERE task_id = $1 AND tenant_id = $2 RETURNING *',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
};

// ============================================================================
// TASK STATUS UPDATE
// ============================================================================

export const updateTaskStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updates: any = { status };
    if (status === 'Completed') {
      updates.completed_date = new Date();
    }

    const result = await pool.query(`
      UPDATE project_tasks SET
        status = $1,
        completed_date = $2,
        updated_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE task_id = $4 AND tenant_id = $5
      RETURNING *
    `, [
      status,
      updates.completed_date || null,
      userId,
      id,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, message: 'Failed to update task status', error: error.message });
  }
};

// ============================================================================
// MY TASKS
// ============================================================================

export const getMyTasks = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { status, page = '1', limit = '50' } = req.query;

    // Get employee_id for current user
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (employeeResult.rows.length === 0) {
      return res.json({ success: true, data: [], total: 0 });
    }

    const employeeId = employeeResult.rows[0].employee_id;

    let query = `
      SELECT 
        pt.*,
        cp.project_name,
        cp.project_number
      FROM project_tasks pt
      JOIN client_projects cp ON pt.project_id = cp.project_id
      WHERE pt.assigned_to = $1 AND pt.tenant_id = $2
    `;
    const params: any[] = [employeeId, tenantId];
    let paramCount = 3;

    if (status) {
      query += ` AND pt.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY pt.due_date ASC NULLS LAST, pt.priority DESC`;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
};

export default {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getMyTasks
};
