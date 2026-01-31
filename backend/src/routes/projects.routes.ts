/**
 * PROJECTS MANAGEMENT ROUTES
 * 
 * Tenant-aware project management API
 * All data is scoped to the authenticated user's tenant
 */

import express from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE - Dashboard Summary (Real database queries)
// ============================================================================
router.get('/workspace', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant context required' });
    }

    // Get project statistics from database
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
        COUNT(*) FILTER (WHERE status = 'on-hold') as on_hold_projects,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(AVG(progress), 0) as avg_progress
      FROM projects 
      WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);

    // Get task statistics
    const taskStatsResult = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status != 'done') as open_tasks,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue_tasks
      FROM project_tasks 
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get recent projects
    const recentProjectsResult = await query(`
      SELECT id, code, name, status, priority, progress, budget, spent, start_date, end_date
      FROM projects 
      WHERE tenant_id = $1 AND is_active = true
      ORDER BY created_at DESC 
      LIMIT 5
    `, [tenantId]);

    // Get my tasks (assigned to current user)
    const userId = req.user?.id;
    const myTasksResult = await query(`
      SELECT t.id, t.title, t.status, t.priority, t.due_date, p.name as project_name
      FROM project_tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.tenant_id = $1 AND t.assignee_id = $2 AND t.status != 'done'
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 10
    `, [tenantId, userId]);

    const stats = statsResult.rows[0] || {};
    const taskStats = taskStatsResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        summary: {
          totalProjects: parseInt(stats.total_projects) || 0,
          activeProjects: parseInt(stats.active_projects) || 0,
          completedProjects: parseInt(stats.completed_projects) || 0,
          onHoldProjects: parseInt(stats.on_hold_projects) || 0,
          totalTasks: parseInt(taskStats.total_tasks) || 0,
          openTasks: parseInt(taskStats.open_tasks) || 0,
          overdueTasks: parseInt(taskStats.overdue_tasks) || 0,
          totalBudget: parseFloat(stats.total_budget) || 0,
          totalSpent: parseFloat(stats.total_spent) || 0,
          utilizationRate: stats.total_budget > 0 
            ? Math.round((stats.total_spent / stats.total_budget) * 100) 
            : 0
        },
        recentProjects: recentProjectsResult.rows,
        myTasks: myTasksResult.rows
      }
    });
  } catch (error: any) {
    console.error('Projects workspace error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load workspace' });
  }
});

// ============================================================================
// PROJECTS CRUD
// ============================================================================

// GET all projects
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let whereClause = 'WHERE p.tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (p.project_name ILIKE $${paramIndex} OR p.project_code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await query(`SELECT COUNT(*) FROM projects p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(`
      SELECT p.id, p.project_code as code, p.project_name as name, p.description, p.status,
        p.start_date, p.end_date, p.budget, p.manager_id, p.created_at, p.updated_at,
        u.full_name as manager_name,
        0 as task_count,
        0 as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

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
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single project
router.get('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;

    const result = await query(`
      SELECT p.*, u.name as manager_name
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = $1 AND p.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Get tasks for this project
    const tasksResult = await query(`
      SELECT t.*, u.name as assignee_name
      FROM project_tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        tasks: tasksResult.rows
      }
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE project
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { code, name, description, client_name, status, priority, project_type, start_date, end_date, budget, manager_id } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'Code and name are required' });
    }

    const result = await query(`
      INSERT INTO projects (tenant_id, code, name, description, client_name, status, priority, project_type, start_date, end_date, budget, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [tenantId, code, name, description, client_name, status || 'planning', priority || 'medium', project_type || 'internal', start_date, end_date, budget || 0, manager_id]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Project code already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE project
router.put('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const { name, description, client_name, status, priority, project_type, start_date, end_date, budget, spent, progress, manager_id } = req.body;

    const result = await query(`
      UPDATE projects SET
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        client_name = COALESCE($5, client_name),
        status = COALESCE($6, status),
        priority = COALESCE($7, priority),
        project_type = COALESCE($8, project_type),
        start_date = COALESCE($9, start_date),
        end_date = COALESCE($10, end_date),
        budget = COALESCE($11, budget),
        spent = COALESCE($12, spent),
        progress = COALESCE($13, progress),
        manager_id = COALESCE($14, manager_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [id, tenantId, name, description, client_name, status, priority, project_type, start_date, end_date, budget, spent, progress, manager_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE project (soft delete)
router.delete('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;

    const result = await query(`
      UPDATE projects SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TASKS
// ============================================================================

// GET tasks for a project
router.get('/:projectId/tasks', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { projectId } = req.params;
    const { status } = req.query;

    let whereClause = 'WHERE t.project_id = $1 AND t.tenant_id = $2';
    const params: any[] = [projectId, tenantId];

    if (status) {
      whereClause += ' AND t.status = $3';
      params.push(status);
    }

    const result = await query(`
      SELECT t.*, u.name as assignee_name
      FROM project_tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE task
router.post('/:projectId/tasks', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { projectId } = req.params;
    const { title, description, status, priority, assignee_id, due_date, estimated_hours } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const result = await query(`
      INSERT INTO project_tasks (tenant_id, project_id, title, description, status, priority, assignee_id, due_date, estimated_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [tenantId, projectId, title, description, status || 'todo', priority || 'medium', assignee_id, due_date, estimated_hours || 0]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE task
router.put('/tasks/:taskId', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { taskId } = req.params;
    const { title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours } = req.body;

    const result = await query(`
      UPDATE project_tasks SET
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        status = COALESCE($5, status),
        priority = COALESCE($6, priority),
        assignee_id = COALESCE($7, assignee_id),
        due_date = COALESCE($8, due_date),
        estimated_hours = COALESCE($9, estimated_hours),
        actual_hours = COALESCE($10, actual_hours)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [taskId, tenantId, title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE task
router.delete('/tasks/:taskId', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { taskId } = req.params;

    const result = await query(`
      DELETE FROM project_tasks WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [taskId, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
