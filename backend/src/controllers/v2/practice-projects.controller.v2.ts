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

export const getAllProjects = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
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

    const params: any[] = [tenantId];
    let paramCount = 2;

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
      LEFT JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN employees em1 ON cp.project_manager_id = em1.employee_id AND em1.tenant_id = cp.tenant_id
      LEFT JOIN employees em2 ON cp.project_partner_id = em2.employee_id AND em2.tenant_id = cp.tenant_id
      LEFT JOIN project_team_members ptm ON cp.project_id = ptm.project_id AND ptm.is_active = true AND ptm.tenant_id = cp.tenant_id
      LEFT JOIN project_tasks pt ON cp.project_id = pt.project_id AND pt.tenant_id = cp.tenant_id
      LEFT JOIN time_entries te ON cp.project_id = te.project_id AND te.status = 'Approved' AND te.tenant_id = cp.tenant_id
      WHERE cp.tenant_id = $1
    `;

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

    const allowedSortFields = ['created_at', 'start_date', 'target_end_date', 'project_name', 'status', 'completion_percentage'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY cp.${sortField} ${sortDirection}`;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(DISTINCT cp.project_id) as total
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      WHERE cp.tenant_id = $1
    `;
    const countParams: any[] = [tenantId];
    let countParamIndex = 2;

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
    }
    if (search) {
      countQuery += ` AND (cp.project_name ILIKE $${countParamIndex} OR cp.project_number ILIKE $${countParamIndex} OR c.customer_name ILIKE $${countParamIndex})`;
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
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProjectById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        cp.*,
        c.customer_name,
        c.customer_code,
        c.email as customer_email,
        c.phone as customer_phone,
        em1.first_name || ' ' || em1.last_name as manager_name,
        em1.email as manager_email,
        em2.first_name || ' ' || em2.last_name as partner_name,
        em2.email as partner_email,
        (
          SELECT COUNT(*)
          FROM project_team_members
          WHERE tenant_id = $1 AND project_id = cp.project_id AND is_active = true
        ) as team_size,
        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE tenant_id = $1 AND project_id = cp.project_id
        ) as total_tasks,
        (
          SELECT COUNT(*)
          FROM project_tasks
          WHERE tenant_id = $1 AND project_id = cp.project_id AND status = 'Completed'
        ) as completed_tasks,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = cp.project_id AND status = 'Approved'
        ) as total_hours_logged,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = cp.project_id AND status = 'Approved' AND billable = true
        ) as billable_hours_logged,
        (
          SELECT COALESCE(SUM(te.hours * ptm.hourly_billing_rate), 0)
          FROM time_entries te
          JOIN project_team_members ptm ON te.employee_id = ptm.employee_id AND te.project_id = ptm.project_id AND ptm.tenant_id = te.tenant_id
          WHERE te.tenant_id = $1 AND te.project_id = cp.project_id AND te.status = 'Approved' AND te.billable = true
        ) as revenue_generated
      FROM client_projects cp
      LEFT JOIN customers c ON cp.customer_id = c.id AND c.tenant_id = cp.tenant_id
      LEFT JOIN employees em1 ON cp.project_manager_id = em1.employee_id AND em1.tenant_id = cp.tenant_id
      LEFT JOIN employees em2 ON cp.project_partner_id = em2.employee_id AND em2.tenant_id = cp.tenant_id
      WHERE cp.tenant_id = $1 AND cp.project_id = $2`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const teamResult = await pool.query(
      `SELECT 
        ptm.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email,
        e.job_title,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = ptm.project_id AND employee_id = ptm.employee_id AND status = 'Approved'
        ) as hours_logged,
        (
          SELECT COALESCE(SUM(hours * ptm.hourly_billing_rate), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = ptm.project_id AND employee_id = ptm.employee_id AND status = 'Approved' AND billable = true
        ) as revenue_generated
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.employee_id AND e.tenant_id = ptm.tenant_id
      WHERE ptm.tenant_id = $1 AND ptm.project_id = $2
      ORDER BY ptm.is_active DESC, ptm.assignment_start_date DESC`,
      [tenantId, id]
    );

    const tasksResult = await pool.query(
      `SELECT 
        pt.*,
        e.first_name || ' ' || e.last_name as assigned_to_name
      FROM project_tasks pt
      LEFT JOIN employees e ON pt.assigned_to = e.employee_id AND e.tenant_id = pt.tenant_id
      WHERE pt.tenant_id = $1 AND pt.project_id = $2
      ORDER BY 
        CASE pt.status 
          WHEN 'In Progress' THEN 1
          WHEN 'Not Started' THEN 2
          WHEN 'Blocked' THEN 3
          WHEN 'Completed' THEN 4
          ELSE 5
        END,
        pt.due_date ASC NULLS LAST
      LIMIT 10`,
      [tenantId, id]
    );

    const timeResult = await pool.query(
      `SELECT 
        te.*,
        e.first_name || ' ' || e.last_name as employee_name,
        pt.task_title
      FROM time_entries te
      JOIN employees e ON te.employee_id = e.employee_id AND e.tenant_id = te.tenant_id
      LEFT JOIN project_tasks pt ON te.task_id = pt.task_id AND pt.tenant_id = te.tenant_id
      WHERE te.tenant_id = $1 AND te.project_id = $2
      ORDER BY te.entry_date DESC, te.created_at DESC
      LIMIT 20`,
      [tenantId, id]
    );

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

export const createProject = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId } = getTenantContext(req);
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

    if (!customer_id || !project_name || !project_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, project_name, project_type'
      });
    }

    const projectNumberResult = await client.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(project_number FROM 5) AS INTEGER)), 0) + 1 as next_number
       FROM client_projects
       WHERE tenant_id = $1 AND project_number LIKE 'PRJ-%'`,
      [tenantId]
    );
    const projectNumber = `PRJ-${String(projectNumberResult.rows[0].next_number).padStart(5, '0')}`;

    const result = await client.query(
      `INSERT INTO client_projects (
        tenant_id,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        tenantId,
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
      ]
    );

    const project = result.rows[0];

    if (team_members && team_members.length > 0) {
      for (const member of team_members) {
        await client.query(
          `INSERT INTO project_team_members (
            tenant_id,
            project_id,
            employee_id,
            role,
            hourly_cost_rate,
            hourly_billing_rate,
            assignment_start_date,
            is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            tenantId,
            project.project_id,
            member.employee_id,
            member.role || 'Team Member',
            member.hourly_cost_rate || 0,
            member.hourly_billing_rate || 0,
            member.assignment_start_date || new Date()
          ]
        );
      }
    }

    await client.query(
      `INSERT INTO client_health_log (
        tenant_id,
        customer_id,
        health_score,
        financial_health_score,
        engagement_score,
        operational_score,
        churn_risk,
        notes
      ) VALUES ($1, $2, 75, 75, 75, 75, 'low', $3)`,
      [tenantId, customer_id, `Initial health score for new project: ${project_name}`]
    );

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

export const updateProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'project_name', 'project_type', 'status', 'priority',
      'start_date', 'target_end_date', 'actual_end_date',
      'budget_hours', 'actual_hours', 'budget_amount', 'actual_cost', 'billed_amount',
      'project_manager_id', 'project_partner_id',
      'description', 'deliverables', 'risks', 'notes',
      'completion_percentage', 'profitability_status'
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

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE client_projects
      SET ${setClauses.join(', ')}
      WHERE tenant_id = $1 AND project_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
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

export const deleteProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE client_projects
       SET status = 'Cancelled', updated_at = NOW()
       WHERE tenant_id = $1 AND project_id = $2
       RETURNING *`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
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

export const getProjectTeam = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        ptm.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email,
        e.job_title,
        e.department,
        (
          SELECT COALESCE(SUM(hours), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = ptm.project_id AND employee_id = ptm.employee_id AND status = 'Approved'
        ) as hours_logged,
        (
          SELECT COALESCE(SUM(hours * ptm.hourly_billing_rate), 0)
          FROM time_entries
          WHERE tenant_id = $1 AND project_id = ptm.project_id AND employee_id = ptm.employee_id AND status = 'Approved' AND billable = true
        ) as revenue_generated
      FROM project_team_members ptm
      JOIN employees e ON ptm.employee_id = e.employee_id AND e.tenant_id = ptm.tenant_id
      WHERE ptm.tenant_id = $1 AND ptm.project_id = $2
      ORDER BY ptm.is_active DESC, ptm.assignment_start_date DESC`,
      [tenantId, id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching project team:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project team', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const addTeamMember = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { employee_id, role, hourly_cost_rate, hourly_billing_rate, assignment_start_date, allocation_percentage } = req.body;

    if (!employee_id) {
      return res.status(400).json({ success: false, message: 'employee_id is required' });
    }

    const result = await pool.query(
      `INSERT INTO project_team_members (
        tenant_id,
        project_id,
        employee_id,
        role,
        hourly_cost_rate,
        hourly_billing_rate,
        assignment_start_date,
        allocation_percentage,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *`,
      [
        tenantId,
        id,
        employee_id,
        role || 'Team Member',
        hourly_cost_rate || 0,
        hourly_billing_rate || 0,
        assignment_start_date || new Date(),
        allocation_percentage || 100
      ]
    );

    res.status(201).json({ success: true, message: 'Team member added successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ success: false, message: 'Failed to add team member', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const removeTeamMember = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id, memberId } = req.params;

    const result = await pool.query(
      `UPDATE project_team_members
       SET is_active = false, assignment_end_date = NOW()
       WHERE tenant_id = $1 AND id = $2 AND project_id = $3
       RETURNING *`,
      [tenantId, memberId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    res.json({ success: true, message: 'Team member removed successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ success: false, message: 'Failed to remove team member', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getProjectHealth = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM v_project_health
       WHERE tenant_id = $1 AND project_id = $2`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching project health:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project health', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
