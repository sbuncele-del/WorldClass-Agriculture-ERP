/**
 * Practice Management - Projects Controller V2
 * Tenant-aware handlers for client projects, engagements, and project lifecycle
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
// GET ALL PROJECTS
// ============================================================================

export const getAllProjects = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { 
      status, 
      search,
      page = '1',
      limit = '20'
    } = req.query;

    // Simple query using the projects table
    let query = `
      SELECT 
        p.id,
        p.project_name,
        p.status,
        p.created_at
      FROM projects p
      WHERE p.tenant_id = $1
    `;

    const params: any[] = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND p.project_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC`;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM projects WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page as string),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects', error: error.message });
  }
};

// ============================================================================
// GET PROJECT BY ID
// ============================================================================

export const getProjectById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        cp.*,
        c.customer_name,
        c.customer_code,
        em1.first_name || ' ' || em1.last_name as manager_name,
        em2.first_name || ' ' || em2.last_name as partner_name
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN employees em1 ON cp.project_manager_id = em1.employee_id
      LEFT JOIN employees em2 ON cp.project_partner_id = em2.employee_id
      WHERE cp.project_id = $1 AND cp.tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Get team members
    const teamResult = await pool.query(`
      SELECT ptm.*, e.first_name, e.last_name, e.email
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.employee_id
      WHERE ptm.project_id = $1 AND ptm.tenant_id = $2 AND ptm.is_active = true
    `, [id, tenantId]);

    // Get tasks summary
    const tasksSummary = await pool.query(`
      SELECT 
        status, 
        COUNT(*) as count
      FROM project_tasks
      WHERE project_id = $1 AND tenant_id = $2
      GROUP BY status
    `, [id, tenantId]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        team_members: teamResult.rows,
        tasks_summary: tasksSummary.rows
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching project:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project', error: error.message });
  }
};

// ============================================================================
// CREATE PROJECT
// ============================================================================

export const createProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const projectData = req.body;

    // Generate project number
    const seqResult = await pool.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM 5) AS INTEGER)), 0) + 1 as next_seq
      FROM client_projects
      WHERE tenant_id = $1 AND project_number LIKE 'PRJ-%'
    `, [tenantId]);
    const projectNumber = `PRJ-${String(seqResult.rows[0].next_seq).padStart(5, '0')}`;

    const result = await pool.query(`
      INSERT INTO client_projects (
        tenant_id, project_number, project_name, project_type, customer_id,
        project_manager_id, project_partner_id, status, priority,
        start_date, end_date, budget, estimated_hours, description,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      tenantId,
      projectNumber,
      projectData.project_name,
      projectData.project_type,
      projectData.customer_id,
      projectData.project_manager_id,
      projectData.project_partner_id,
      projectData.status || 'Planning',
      projectData.priority || 'Medium',
      projectData.start_date,
      projectData.end_date,
      projectData.budget,
      projectData.estimated_hours,
      projectData.description,
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, message: 'Failed to create project', error: error.message });
  }
};

// ============================================================================
// UPDATE PROJECT
// ============================================================================

export const updateProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const updateData = req.body;

    const result = await pool.query(`
      UPDATE client_projects SET
        project_name = COALESCE($1, project_name),
        project_type = COALESCE($2, project_type),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        project_manager_id = COALESCE($5, project_manager_id),
        project_partner_id = COALESCE($6, project_partner_id),
        start_date = COALESCE($7, start_date),
        end_date = COALESCE($8, end_date),
        budget = COALESCE($9, budget),
        estimated_hours = COALESCE($10, estimated_hours),
        description = COALESCE($11, description),
        updated_by = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $13 AND tenant_id = $14
      RETURNING *
    `, [
      updateData.project_name,
      updateData.project_type,
      updateData.status,
      updateData.priority,
      updateData.project_manager_id,
      updateData.project_partner_id,
      updateData.start_date,
      updateData.end_date,
      updateData.budget,
      updateData.estimated_hours,
      updateData.description,
      userId,
      id,
      tenantId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, message: 'Failed to update project', error: error.message });
  }
};

// ============================================================================
// TEAM MANAGEMENT
// ============================================================================

export const addTeamMember = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const memberData = req.body;

    // Verify project belongs to tenant
    const projectCheck = await pool.query(
      'SELECT project_id FROM client_projects WHERE project_id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const result = await pool.query(`
      INSERT INTO project_team_members (
        tenant_id, project_id, employee_id, role, hourly_billing_rate,
        hourly_cost_rate, allocation_percentage, start_date, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
      RETURNING *
    `, [
      tenantId,
      id,
      memberData.employee_id,
      memberData.role,
      memberData.hourly_billing_rate,
      memberData.hourly_cost_rate,
      memberData.allocation_percentage || 100,
      memberData.start_date || new Date(),
      userId
    ]);

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error adding team member:', error);
    res.status(500).json({ success: false, message: 'Failed to add team member', error: error.message });
  }
};

export const removeTeamMember = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id, memberId } = req.params;

    const result = await pool.query(`
      UPDATE project_team_members 
      SET is_active = false, end_date = CURRENT_DATE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE assignment_id = $2 AND project_id = $3 AND tenant_id = $4
      RETURNING *
    `, [userId, memberId, id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    res.json({
      success: true,
      message: 'Team member removed successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error removing team member:', error);
    res.status(500).json({ success: false, message: 'Failed to remove team member', error: error.message });
  }
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getProjectsDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Project status summary
    const statusSummary = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM client_projects
      WHERE tenant_id = $1
      GROUP BY status
    `, [tenantId]);

    // Budget summary
    const budgetSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_projects,
        COALESCE(SUM(budget), 0) as total_budget,
        COALESCE(SUM(estimated_hours), 0) as total_estimated_hours
      FROM client_projects
      WHERE tenant_id = $1 AND status IN ('Planning', 'Active')
    `, [tenantId]);

    // Upcoming deadlines
    const upcomingDeadlines = await pool.query(`
      SELECT project_id, project_name, project_number, end_date, status
      FROM client_projects
      WHERE tenant_id = $1 
      AND status = 'Active'
      AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY end_date ASC
      LIMIT 5
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        statusSummary: statusSummary.rows,
        budgetSummary: budgetSummary.rows[0],
        upcomingDeadlines: upcomingDeadlines.rows
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: error.message });
  }
};

export default {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  addTeamMember,
  removeTeamMember,
  getProjectsDashboard
};
