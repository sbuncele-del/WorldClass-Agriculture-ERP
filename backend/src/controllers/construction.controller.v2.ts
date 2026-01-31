/**
 * Construction Controller V2
 * Tenant-hardened API for construction industry operations
 * 
 * Features:
 * - Project management
 * - Phase tracking
 * - Safety incident reporting
 * - Materials management
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// WORKSPACE
// ============================================================================
export const getWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const [projectsResult, activeResult, safetyResult, materialsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_projects, COALESCE(SUM(contract_value), 0) as total_value
        FROM construction_projects WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as active_projects
        FROM construction_projects WHERE tenant_id = $1 AND status IN ('in_progress', 'on_hold')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as open_incidents
        FROM construction_safety_incidents WHERE tenant_id = $1 AND status IN ('reported', 'investigating')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as low_stock_items
        FROM construction_materials WHERE tenant_id = $1 AND current_quantity <= reorder_level`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalProjects: parseInt(projectsResult.rows[0]?.total_projects || '0'),
          totalContractValue: parseFloat(projectsResult.rows[0]?.total_value || '0'),
          activeProjects: parseInt(activeResult.rows[0]?.active_projects || '0'),
          openSafetyIncidents: parseInt(safetyResult.rows[0]?.open_incidents || '0'),
          lowStockMaterials: parseInt(materialsResult.rows[0]?.low_stock_items || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Construction workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// PROJECTS
// ============================================================================
export const getProjects = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, projectType } = req.query;

    let queryStr = `
      SELECT id, code, name, 
        COALESCE(client_name, '') as client_name, 
        COALESCE(project_type, 'construction') as project_type, 
        COALESCE(status, 'active') as status, 
        start_date, 
        COALESCE(expected_end_date, end_date) as expected_end_date, 
        COALESCE(contract_value, budget, 0) as contract_value, 
        COALESCE(completion_percentage, 0) as completion_percentage, 
        COALESCE(site_address, location, '') as site_address, 
        COALESCE(project_manager, '') as project_manager, 
        created_at
      FROM construction_projects WHERE tenant_id = $1 AND COALESCE(is_active, true) = true
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }
    if (projectType) {
      params.push(projectType);
      queryStr += ` AND project_type = $${params.length}`;
    }

    queryStr += ' ORDER BY start_date DESC';
    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        client: p.client_name,
        type: p.project_type,
        status: p.status,
        dates: { start: p.start_date, expectedEnd: p.expected_end_date },
        contractValue: parseFloat(p.contract_value),
        completion: parseFloat(p.completion_percentage),
        siteAddress: p.site_address,
        manager: p.project_manager
      }))
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM construction_projects WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
};

export const createProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { code, name, clientName, projectType, startDate, expectedEndDate, 
            contractValue, siteAddress, projectManager, description } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_projects (tenant_id, code, name, client_name, project_type,
        start_date, expected_end_date, contract_value, site_address, project_manager, 
        description, status, completion_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planning', 0)
      RETURNING *`,
      [tenantId, code, name, clientName, projectType, startDate, expectedEndDate, 
       contractValue, siteAddress, projectManager, description]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Project created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Project code already exists' });
    }
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
};

export const updateProject = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    const result = await pool.query(
      `UPDATE construction_projects SET
        name = COALESCE($3, name),
        status = COALESCE($4, status),
        completion_percentage = COALESCE($5, completion_percentage),
        expected_end_date = COALESCE($6, expected_end_date),
        actual_end_date = COALESCE($7, actual_end_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, updates.name, updates.status, updates.completionPercentage, 
       updates.expectedEndDate, updates.actualEndDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Project updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
};

// ============================================================================
// PROJECT PHASES
// ============================================================================
export const getProjectPhases = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT * FROM construction_phases 
      WHERE project_id = $1 AND tenant_id = $2 
      ORDER BY sequence_number`,
      [projectId, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get phases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch phases' });
  }
};

export const createPhase = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { projectId } = req.params;
    const { sequenceNumber, name, description, startDate, expectedEndDate, budget } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_phases (tenant_id, project_id, sequence_number, name, 
        description, start_date, expected_end_date, budget, status, completion_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'not_started', 0)
      RETURNING *`,
      [tenantId, projectId, sequenceNumber, name, description, startDate, expectedEndDate, budget]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Phase added' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Add phase error:', error);
    res.status(500).json({ success: false, error: 'Failed to add phase' });
  }
};

export const updatePhase = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, completionPercentage, actualEndDate, notes } = req.body;

    const result = await pool.query(
      `UPDATE construction_phases SET
        status = COALESCE($3, status),
        completion_percentage = COALESCE($4, completion_percentage),
        actual_end_date = COALESCE($5, actual_end_date),
        notes = COALESCE($6, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, completionPercentage, actualEndDate, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Phase not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Phase updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update phase error:', error);
    res.status(500).json({ success: false, error: 'Failed to update phase' });
  }
};

// ============================================================================
// SAFETY INCIDENTS
// ============================================================================
export const getSafetyIncidents = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { projectId, status, severity } = req.query;

    let queryStr = `
      SELECT i.*, p.name as project_name
      FROM construction_safety_incidents i
      LEFT JOIN construction_projects p ON i.project_id = p.id
      WHERE i.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (projectId) {
      params.push(projectId);
      queryStr += ` AND i.project_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryStr += ` AND i.status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      queryStr += ` AND i.severity = $${params.length}`;
    }

    queryStr += ' ORDER BY i.incident_date DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get incidents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
};

export const reportSafetyIncident = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { projectId, incidentDate, incidentType, severity, location, description,
            injuriesCount, fatalitiesCount, rootCause, correctiveActions } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_safety_incidents (tenant_id, project_id, incident_date, 
        incident_type, severity, location, description, injuries_count, fatalities_count, 
        root_cause, corrective_actions, status, reported_by_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'reported', $12)
      RETURNING *`,
      [tenantId, projectId, incidentDate, incidentType, severity, location, description,
       injuriesCount || 0, fatalitiesCount || 0, rootCause, correctiveActions, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Incident reported' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Report incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to report incident' });
  }
};

export const updateSafetyIncident = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { status, rootCause, correctiveActions, resolutionDate } = req.body;

    const result = await pool.query(
      `UPDATE construction_safety_incidents SET
        status = COALESCE($3, status),
        root_cause = COALESCE($4, root_cause),
        corrective_actions = COALESCE($5, corrective_actions),
        resolution_date = COALESCE($6, resolution_date)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, rootCause, correctiveActions, resolutionDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Incident updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
};

// ============================================================================
// MATERIALS
// ============================================================================
export const getMaterials = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { projectId, category, lowStock } = req.query;

    let queryStr = `
      SELECT m.*, p.name as project_name
      FROM construction_materials m
      LEFT JOIN construction_projects p ON m.project_id = p.id
      WHERE m.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (projectId) {
      params.push(projectId);
      queryStr += ` AND m.project_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      queryStr += ` AND m.category = $${params.length}`;
    }
    if (lowStock === 'true') {
      queryStr += ' AND m.current_quantity <= m.reorder_level';
    }

    queryStr += ' ORDER BY m.name';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
};

export const addMaterial = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { projectId, code, name, category, unit, unitPrice, currentQuantity, 
            reorderLevel, supplierName } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_materials (tenant_id, project_id, code, name, category, unit,
        unit_price, current_quantity, reorder_level, supplier_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [tenantId, projectId, code, name, category, unit, unitPrice, currentQuantity, 
       reorderLevel, supplierName]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Material added' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Material code already exists' });
    }
    console.error('Add material error:', error);
    res.status(500).json({ success: false, error: 'Failed to add material' });
  }
};

export const updateMaterial = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { currentQuantity, unitPrice, reorderLevel, notes } = req.body;

    const result = await pool.query(
      `UPDATE construction_materials SET
        current_quantity = COALESCE($3, current_quantity),
        unit_price = COALESCE($4, unit_price),
        reorder_level = COALESCE($5, reorder_level),
        notes = COALESCE($6, notes)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, currentQuantity, unitPrice, reorderLevel, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Material updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update material error:', error);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
};

/**
 * Get construction dashboard
 */
export const getConstructionDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get project stats
    const projectStats = await pool.query(
      `SELECT 
         COUNT(*) as total_projects,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(budget) as total_budget,
         SUM(spent_amount) as total_spent
       FROM construction_projects 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get safety incidents
    const safetyStats = await pool.query(
      `SELECT COUNT(*) as total_incidents
       FROM construction_safety_incidents 
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM incident_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalProjects: parseInt(projectStats.rows[0]?.total_projects || '0'),
        activeProjects: parseInt(projectStats.rows[0]?.active || '0'),
        completedProjects: parseInt(projectStats.rows[0]?.completed || '0'),
        totalBudget: parseFloat(projectStats.rows[0]?.total_budget || '0'),
        totalSpent: parseFloat(projectStats.rows[0]?.total_spent || '0'),
        yearlyIncidents: parseInt(safetyStats.rows[0]?.total_incidents || '0'),
        summary: {
          projects: parseInt(projectStats.rows[0]?.total_projects || '0'),
          budget: parseFloat(projectStats.rows[0]?.total_budget || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get construction dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch construction dashboard' });
  }
};

export default {
  getWorkspace,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  getProjectPhases,
  createPhase,
  updatePhase,
  getSafetyIncidents,
  reportSafetyIncident,
  updateSafetyIncident,
  getMaterials,
  addMaterial,
  updateMaterial,
  getConstructionDashboard
};
