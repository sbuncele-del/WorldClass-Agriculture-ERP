/**
 * Projects Controller v2 - Tenant-Hardened
 * 
 * Project and task management with full multi-tenant isolation.
 * 
 * Features:
 * - Project CRUD with status tracking
 * - Task management per project
 * - Progress tracking and reporting
 * - Workspace dashboard with KPIs
 */

import { Request, Response } from 'express';
import { pool } from '../../config/database';

// Tenant-aware request type
interface AuthenticatedRequest extends Request {
  tenantId?: string;
  tenant?: { id: string };
  user?: { id: string; email: string; role: string };
}

// Helper to get tenant ID from request
function getTenantId(req: AuthenticatedRequest): string | undefined {
  return req.tenantId || req.tenant?.id;
}

// Query helper
async function query(text: string, params: any[]): Promise<any> {
  return pool.query(text, params);
}

// =============================================================================
// WORKSPACE / DASHBOARD
// =============================================================================

/**
 * GET /api/v2/projects/workspace
 * Get project workspace dashboard with KPIs
 */
export async function getWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  try {
    // Get project counts by status
    const projectStats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'planning') as planning,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) as total
      FROM projects
      WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);

    // Get task counts by status
    const taskStats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'todo') as todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'review') as review,
        COUNT(*) FILTER (WHERE status = 'done') as done,
        COUNT(*) as total
      FROM project_tasks
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get budget summary
    const budgetStats = await query(`
      SELECT 
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(AVG(progress), 0) as avg_progress
      FROM projects
      WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);

    // Get recent projects
    const recentProjects = await query(`
      SELECT p.id, p.code, p.name, p.status, p.progress, p.end_date,
             u.full_name as manager_name
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.tenant_id = $1 AND p.is_active = true
      ORDER BY p.updated_at DESC
      LIMIT 5
    `, [tenantId]);

    // Get upcoming deadlines
    const upcomingDeadlines = await query(`
      SELECT p.id, p.code, p.name, p.end_date,
             (p.end_date - CURRENT_DATE) as days_remaining
      FROM projects p
      WHERE p.tenant_id = $1 
        AND p.is_active = true 
        AND p.status IN ('planning', 'active')
        AND p.end_date IS NOT NULL
        AND p.end_date >= CURRENT_DATE
      ORDER BY p.end_date ASC
      LIMIT 5
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        projects: {
          planning: parseInt(projectStats.rows[0].planning) || 0,
          active: parseInt(projectStats.rows[0].active) || 0,
          onHold: parseInt(projectStats.rows[0].on_hold) || 0,
          completed: parseInt(projectStats.rows[0].completed) || 0,
          cancelled: parseInt(projectStats.rows[0].cancelled) || 0,
          total: parseInt(projectStats.rows[0].total) || 0
        },
        tasks: {
          todo: parseInt(taskStats.rows[0].todo) || 0,
          inProgress: parseInt(taskStats.rows[0].in_progress) || 0,
          review: parseInt(taskStats.rows[0].review) || 0,
          done: parseInt(taskStats.rows[0].done) || 0,
          total: parseInt(taskStats.rows[0].total) || 0
        },
        budget: {
          totalBudget: parseFloat(budgetStats.rows[0].total_budget) || 0,
          totalSpent: parseFloat(budgetStats.rows[0].total_spent) || 0,
          avgProgress: parseFloat(budgetStats.rows[0].avg_progress) || 0
        },
        recentProjects: recentProjects.rows,
        upcomingDeadlines: upcomingDeadlines.rows
      }
    });

  } catch (error: any) {
    console.error('Get workspace error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load workspace' });
  }
}

// =============================================================================
// PROJECT CRUD
// =============================================================================

/**
 * GET /api/v2/projects
 * List all projects with filtering and pagination
 */
export async function listProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  try {
    const { status, priority, search, page = 1, limit = 20 } = req.query;
    
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
        p.start_date, p.end_date, p.budget, p.manager_id, p.created_at, p.updated_at, p.tenant_id,
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
    console.error('List projects error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v2/projects/:id
 * Get single project with tasks
 */
export async function getProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { id } = req.params;

  try {
    const result = await query(`
      SELECT p.*, u.full_name as manager_name
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = $1 AND p.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    // Get tasks for this project
    const tasksResult = await query(`
      SELECT t.*, u.full_name as assignee_name
      FROM project_tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.project_id = $1 AND t.tenant_id = $2
      ORDER BY t.created_at DESC
    `, [id, tenantId]);

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
}

/**
 * POST /api/v2/projects
 * Create a new project
 */
export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { 
    code, name, description, client_name, status, priority, 
    project_type, start_date, end_date, budget, manager_id 
  } = req.body;

  if (!code || !name) {
    res.status(400).json({ success: false, error: 'Code and name are required' });
    return;
  }

  try {
    const result = await query(`
      INSERT INTO projects (
        tenant_id, code, name, description, client_name, status, 
        priority, project_type, start_date, end_date, budget, manager_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId, code, name, description, client_name, 
      status || 'planning', priority || 'medium', 
      project_type || 'internal', start_date, end_date, 
      budget || 0, manager_id
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.code === '23505') {
      res.status(400).json({ success: false, error: 'Project code already exists' });
      return;
    }
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/v2/projects/:id
 * Update an existing project
 */
export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { id } = req.params;
  const { 
    name, description, client_name, status, priority, 
    project_type, start_date, end_date, budget, spent, progress, manager_id 
  } = req.body;

  try {
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
    `, [id, tenantId, name, description, client_name, status, priority, 
        project_type, start_date, end_date, budget, spent, progress, manager_id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/v2/projects/:id
 * Soft delete a project
 */
export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { id } = req.params;

  try {
    const result = await query(`
      UPDATE projects SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    res.json({ success: true, message: 'Project deleted' });

  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =============================================================================
// TASK CRUD
// =============================================================================

/**
 * GET /api/v2/projects/:projectId/tasks
 * List tasks for a project
 */
export async function listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { projectId } = req.params;
  const { status } = req.query;

  try {
    // Verify project belongs to tenant
    const projectCheck = await query(`
      SELECT id FROM projects WHERE id = $1 AND tenant_id = $2
    `, [projectId, tenantId]);

    if (projectCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    let whereClause = 'WHERE t.project_id = $1 AND t.tenant_id = $2';
    const params: any[] = [projectId, tenantId];

    if (status) {
      whereClause += ' AND t.status = $3';
      params.push(status);
    }

    const result = await query(`
      SELECT t.*, u.full_name as assignee_name
      FROM project_tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `, params);

    res.json({ success: true, data: result.rows });

  } catch (error: any) {
    console.error('List tasks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/v2/projects/:projectId/tasks
 * Create a new task
 */
export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { projectId } = req.params;
  const { title, description, status, priority, assignee_id, due_date, estimated_hours } = req.body;

  if (!title) {
    res.status(400).json({ success: false, error: 'Title is required' });
    return;
  }

  try {
    // Verify project belongs to tenant
    const projectCheck = await query(`
      SELECT id FROM projects WHERE id = $1 AND tenant_id = $2
    `, [projectId, tenantId]);

    if (projectCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const result = await query(`
      INSERT INTO project_tasks (
        tenant_id, project_id, title, description, status, 
        priority, assignee_id, due_date, estimated_hours
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      tenantId, projectId, title, description, 
      status || 'todo', priority || 'medium', 
      assignee_id, due_date, estimated_hours || 0
    ]);

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/v2/projects/tasks/:taskId
 * Update a task
 */
export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { taskId } = req.params;
  const { title, description, status, priority, assignee_id, due_date, estimated_hours, actual_hours } = req.body;

  try {
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
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /api/v2/projects/tasks/:taskId
 * Delete a task
 */
export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { taskId } = req.params;

  try {
    const result = await query(`
      DELETE FROM project_tasks WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [taskId, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task deleted' });

  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /api/v2/projects/tasks/:taskId
 * Get single task details
 */
export async function getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const { taskId } = req.params;

  try {
    const result = await query(`
      SELECT t.*, 
             u.full_name as assignee_name,
             p.name as project_name,
             p.code as project_code
      FROM project_tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND t.tenant_id = $2
    `, [taskId, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =============================================================================
// REPORTS
// =============================================================================

/**
 * GET /api/v2/projects/reports/summary
 * Get project portfolio summary report
 */
export async function getProjectSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = getTenantId(req);
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  try {
    // Overall stats
    const stats = await query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(*) FILTER (WHERE status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')) as overdue_projects,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(AVG(progress), 0) as avg_progress
      FROM projects
      WHERE tenant_id = $1 AND is_active = true
    `, [tenantId]);

    // By type
    const byType = await query(`
      SELECT project_type, COUNT(*) as count, 
             COALESCE(SUM(budget), 0) as budget,
             COALESCE(AVG(progress), 0) as avg_progress
      FROM projects
      WHERE tenant_id = $1 AND is_active = true
      GROUP BY project_type
      ORDER BY count DESC
    `, [tenantId]);

    // By priority
    const byPriority = await query(`
      SELECT priority, COUNT(*) as count
      FROM projects
      WHERE tenant_id = $1 AND is_active = true
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END
    `, [tenantId]);

    // Task completion rate
    const taskStats = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        ROUND(COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate
      FROM project_tasks
      WHERE tenant_id = $1
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects: parseInt(stats.rows[0].total_projects) || 0,
          activeProjects: parseInt(stats.rows[0].active_projects) || 0,
          completedProjects: parseInt(stats.rows[0].completed_projects) || 0,
          overdueProjects: parseInt(stats.rows[0].overdue_projects) || 0,
          avgProgress: parseFloat(stats.rows[0].avg_progress) || 0
        },
        budget: {
          total: parseFloat(stats.rows[0].total_budget) || 0,
          spent: parseFloat(stats.rows[0].total_spent) || 0,
          utilization: stats.rows[0].total_budget > 0 
            ? ((stats.rows[0].total_spent / stats.rows[0].total_budget) * 100).toFixed(2)
            : 0
        },
        byType: byType.rows,
        byPriority: byPriority.rows,
        taskStats: {
          total: parseInt(taskStats.rows[0].total_tasks) || 0,
          completed: parseInt(taskStats.rows[0].completed_tasks) || 0,
          completionRate: parseFloat(taskStats.rows[0].completion_rate) || 0
        }
      }
    });

  } catch (error: any) {
    console.error('Get project summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Workspace
  getWorkspace,
  
  // Project CRUD
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  
  // Task CRUD
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  getTask,
  
  // Reports
  getProjectSummary
};
