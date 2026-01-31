import { Request, Response } from 'express';
import pool from '../../config/database';

/**
 * ============================================================================
 * PRACTICE MANAGEMENT - PROJECTS CONTROLLER
 * ============================================================================
 * 
 * Handles client projects, engagements, and project lifecycle management
 * 
 * Features:
 * - Project CRUD operations
 * - Team assignment and resource allocation
 * - Budget tracking and profitability
 * - Project timeline and milestones
 * - Integration with client portal
 * ============================================================================
 */

// ============================================================================
// GET ALL PROJECTS
// ============================================================================
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      project_type, 
      customer_id, 
      manager_id,
      priority,
      search,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    let query = `
      SELECT 
        cp.*,
        c.customer_name,
        c.customer_code,
        em1.first_name || ' ' || em1.last_name as manager_name,
        em2.first_name || ' ' || em2.last_name as partner_name,
        COUNT(DISTINCT ptm.assignment_id) as team_size,
        COUNT(DISTINCT pt.task_id) as total_tasks,
        COUNT(DISTINCT CASE WHEN pt.status = 'Completed' THEN pt.task_id END) as completed_tasks,
        COALESCE(SUM(te.hours), 0) as total_hours_logged,
        COALESCE(SUM(CASE WHEN te.billable THEN te.hours ELSE 0 END), 0) as billable_hours_logged
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN employees em1 ON cp.project_manager_id = em1.employee_id
      LEFT JOIN employees em2 ON cp.project_partner_id = em2.employee_id
      LEFT JOIN project_team_members ptm ON cp.project_id = ptm.project_id AND ptm.is_active = true
      LEFT JOIN project_tasks pt ON cp.project_id = pt.project_id
      LEFT JOIN time_entries te ON cp.project_id = te.project_id AND te.status = 'Approved'
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND cp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (project_type) {
      query += ` AND cp.project_type = $${paramCount}`;
      params.push(project_type);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND cp.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    if (manager_id) {
      query += ` AND cp.project_manager_id = $${paramCount}`;
      params.push(manager_id);
      paramCount++;
    }

    if (priority) {
      query += ` AND cp.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    if (search) {
      query += ` AND (cp.project_name ILIKE $${paramCount} OR cp.project_number ILIKE $${paramCount} OR c.customer_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` GROUP BY cp.project_id, c.customer_name, c.customer_code, em1.first_name, em1.last_name, em2.first_name, em2.last_name`;

    // Add sorting
    const allowedSortFields = ['created_at', 'start_date', 'target_end_date', 'project_name', 'status', 'completion_percentage'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY cp.${sortField} ${sortDirection}`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT cp.project_id) as total
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND cp.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (project_type) {
      countQuery += ` AND cp.project_type = $${countParamIndex}`;
      countParams.push(project_type);
      countParamIndex++;
    }
    if (customer_id) {
      countQuery += ` AND cp.customer_id = $${countParamIndex}`;
      countParams.push(customer_id);
      countParamIndex++;
    }
    if (manager_id) {
      countQuery += ` AND cp.project_manager_id = $${countParamIndex}`;
      countParams.push(manager_id);
      countParamIndex++;
    }
    if (priority) {
      countQuery += ` AND cp.priority = $${countParamIndex}`;
      countParams.push(priority);
      countParamIndex++;
    }
    if (search) {
      countQuery += ` AND (cp.project_name ILIKE $${countParamIndex} OR cp.project_number ILIKE $${countParamIndex} OR c.customer_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

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
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET PROJECT BY ID
// ============================================================================
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        cp.*,
        c.customer_name,
        c.customer_code,
        c.email as customer_email,
        c.phone as customer_phone,
        em1.first_name || ' ' || em1.last_name as manager_name,
        em1.email as manager_email,
        em2.first_name || ' ' || em2.last_name as partner_name,
        em2.email as partner_email,
        
        -- Aggregated metrics
        (
          SELECT COUNT(*)
          FROM project_team_members
          WHERE project_id = cp.project_id AND is_active = true
        ) as team_size,
        
        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE project_id = cp.project_id
        ) as total_tasks,
        
        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE project_id = cp.project_id AND status = 'Completed'
        ) as completed_tasks,
        
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE project_id = cp.project_id AND status = 'Approved'
        ) as total_hours_logged,
        
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE project_id = cp.project_id AND status = 'Approved' AND billable = true
        ) as billable_hours_logged,
        
        (
          SELECT COALESCE(SUM(te.hours * ptm.hourly_billing_rate), 0)
          FROM time_entries te
          JOIN project_team_members ptm ON te.employee_id = ptm.employee_id AND te.project_id = ptm.project_id
          WHERE te.project_id = cp.project_id AND te.status = 'Approved' AND te.billable = true
        ) as revenue_generated
        
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id
      LEFT JOIN employees em1 ON cp.project_manager_id = em1.employee_id
      LEFT JOIN employees em2 ON cp.project_partner_id = em2.employee_id
      WHERE cp.project_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Get team members
    const teamResult = await pool.query(`
      SELECT 
        ptm.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email,
        e.job_title,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE project_id = ptm.project_id 
            AND employee_id = ptm.employee_id 
            AND status = 'Approved'
        ) as hours_logged
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.employee_id
      WHERE ptm.project_id = $1
      ORDER BY ptm.is_active DESC, ptm.assignment_start_date DESC
    `, [id]);

    // Get recent tasks
    const tasksResult = await pool.query(`
      SELECT 
        pt.*,
        e.first_name || ' ' || e.last_name as assigned_to_name
      FROM project_tasks pt
      LEFT JOIN employees e ON pt.assigned_to = e.employee_id
      WHERE pt.project_id = $1
      ORDER BY 
        CASE pt.status 
          WHEN 'In Progress' THEN 1
          WHEN 'Not Started' THEN 2
          WHEN 'Blocked' THEN 3
          WHEN 'Completed' THEN 4
          ELSE 5
        END,
        pt.due_date ASC NULLS LAST
      LIMIT 10
    `, [id]);

    // Get recent time entries
    const timeResult = await pool.query(`
      SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        pt.task_title
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id
      LEFT JOIN project_tasks pt ON te.task_id = pt.task_id
      WHERE te.project_id = $1
      ORDER BY te.entry_date DESC, te.created_at DESC
      LIMIT 20
    `, [id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        team_members: teamResult.rows,
        recent_tasks: tasksResult.rows,
        recent_time_entries: timeResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CREATE NEW PROJECT
// ============================================================================
export const createProject = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      customer_id,
      project_name,
      project_type,
      status = 'Planning',
      priority = 'Medium',
      start_date,
      target_end_date,
      budget_hours,
      budget_amount,
      project_manager_id,
      project_partner_id,
      description,
      deliverables,
      risks,
      notes,
      team_members = []
    } = req.body;

    // Validate required fields
    if (!customer_id || !project_name || !project_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, project_name, project_type'
      });
    }

    // Generate project number
    const projectNumberResult = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM client_projects
      WHERE project_number LIKE 'PRJ-%'
    `);
    const projectNumber = `PRJ-${String(projectNumberResult.rows[0].next_number).padStart(5, '0')}`;

    // Create project
    const result = await client.query(`
      INSERT INTO client_projects (
        customer_id,
        project_number,
        project_name,
        project_type,
        status,
        priority,
        start_date,
        target_end_date,
        budget_hours,
        budget_amount,
        project_manager_id,
        project_partner_id,
        description,
        deliverables,
        risks,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      customer_id,
      projectNumber,
      project_name,
      project_type,
      status,
      priority,
      start_date || null,
      target_end_date || null,
      budget_hours || null,
      budget_amount || null,
      project_manager_id || null,
      project_partner_id || null,
      description || null,
      deliverables || null,
      risks || null,
      notes || null
    ]);

    const project = result.rows[0];

    // Assign team members if provided
    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await client.query(`
          INSERT INTO project_team_members (
            project_id,
            employee_id,
            role,
            hourly_cost_rate,
            hourly_billing_rate,
            assignment_start_date,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          project.project_id,
          member.employee_id,
          member.role || 'Team Member',
          member.hourly_cost_rate || 0,
          member.hourly_billing_rate || 0,
          member.assignment_start_date || new Date(),
          true
        ]);
      }
    }

    // Create initial client health log entry
    await client.query(`
      INSERT INTO client_health_log (
        customer_id,
        health_score,
        financial_health_score,
        engagement_score,
        operational_score,
        churn_risk,
        notes
      ) VALUES ($1, 75, 75, 75, 75, 'low', $2)
    `, [customer_id, `Initial health score for new project: ${project_name}`]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// UPDATE PROJECT
// ============================================================================
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'project_name', 'project_type', 'status', 'priority',
      'start_date', 'target_end_date', 'actual_end_date',
      'budget_hours', 'actual_hours', 'budget_amount', 'actual_cost', 'billed_amount',
      'project_manager_id', 'project_partner_id',
      'description', 'deliverables', 'risks', 'notes',
      'completion_percentage', 'profitability_status'
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
      UPDATE client_projects
      SET ${setClauses.join(', ')}
      WHERE project_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// DELETE PROJECT (Soft delete by setting status to Cancelled)
// ============================================================================
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      UPDATE client_projects
      SET 
        status = 'Cancelled',
        updated_at = NOW()
      WHERE project_id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET PROJECT TEAM MEMBERS
// ============================================================================
export const getProjectTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        ptm.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email,
        e.job_title,
        e.department,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE project_id = ptm.project_id 
            AND employee_id = ptm.employee_id 
            AND status = 'Approved'
        ) as hours_logged,
        (
          SELECT COALESCE(SUM(hours * ptm.hourly_billing_rate), 0)
          FROM time_entries
          WHERE project_id = ptm.project_id 
            AND employee_id = ptm.employee_id 
            AND status = 'Approved'
            AND billable = true
        ) as revenue_generated
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.employee_id
      WHERE ptm.project_id = $1
      ORDER BY ptm.is_active DESC, ptm.assignment_start_date DESC
    `, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching project team:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// ADD TEAM MEMBER TO PROJECT
// ============================================================================
export const addTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      role,
      hourly_cost_rate,
      hourly_billing_rate,
      assignment_start_date,
      allocation_percentage
    } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'employee_id is required'
      });
    }

    const result = await pool.query(`
      INSERT INTO project_team_members (
        project_id,
        employee_id,
        role,
        hourly_cost_rate,
        hourly_billing_rate,
        assignment_start_date,
        allocation_percentage,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [
      id,
      employee_id,
      role || 'Team Member',
      hourly_cost_rate || 0,
      hourly_billing_rate || 0,
      assignment_start_date || new Date(),
      allocation_percentage || 100
    ]);

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// REMOVE TEAM MEMBER FROM PROJECT
// ============================================================================
export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;

    const result = await pool.query(`
      UPDATE project_team_members
      SET 
        is_active = false,
        assignment_end_date = NOW()
      WHERE id = $1 AND project_id = $2
      RETURNING *
    `, [memberId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Team member removed successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove team member',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET PROJECT HEALTH/ANALYTICS
// ============================================================================
export const getProjectHealth = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT * FROM v_project_health
      WHERE project_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching project health:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch project health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
