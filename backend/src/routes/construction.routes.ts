/**
 * CONSTRUCTION INDUSTRY ROUTES - TENANT-AWARE
 * 
 * Construction-specific operations API:
 * - Project sites
 * - CIDB compliance (South Africa)
 * - Safety management (OHS Act)
 * - Progress tracking
 * - Materials & resources
 */

import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE SUMMARY
// ============================================================================
router.get('/workspace', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const [projectsResult, safetyResult] = await Promise.all([
      pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_projects,
          COUNT(*) FILTER (WHERE status = 'active' AND progress_percentage >= 
            EXTRACT(EPOCH FROM (CURRENT_DATE - start_date)) / 
            NULLIF(EXTRACT(EPOCH FROM (target_completion - start_date)), 0) * 100) as on_schedule,
          COALESCE(SUM(contract_value), 0) as total_value,
          COALESCE(AVG(progress_percentage), 0) as avg_progress
        FROM construction_projects WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      ),
      pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 year') as incidents_ytd,
          MAX(incident_date) as last_incident
        FROM construction_safety WHERE tenant_id = $1`,
        [tenantId]
      )
    ]);

    const lastIncident = safetyResult.rows[0]?.last_incident;
    const daysSinceLastIncident = lastIncident 
      ? Math.floor((Date.now() - new Date(lastIncident).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      success: true,
      data: {
        summary: {
          activeProjects: parseInt(projectsResult.rows[0]?.active_projects || '0'),
          totalContractValue: parseFloat(projectsResult.rows[0]?.total_value || '0'),
          onSchedule: parseInt(projectsResult.rows[0]?.on_schedule || '0'),
          avgProgress: Math.round(parseFloat(projectsResult.rows[0]?.avg_progress || '0')),
          safetyIncidentsYTD: parseInt(safetyResult.rows[0]?.incidents_ytd || '0'),
          daysSinceLastIncident
        }
      }
    });
  } catch (error) {
    console.error('Construction workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
});

// ============================================================================
// CONSTRUCTION PROJECTS
// ============================================================================
router.get('/projects', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { status, projectType } = req.query;

    let query = `
      SELECT id, code, name, client_name, site_address, project_type,
        contract_value, status, completion_percentage,
        start_date, expected_end_date, project_manager, created_at
      FROM construction_projects WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (projectType) {
      params.push(projectType);
      query += ` AND project_type = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        client: p.client_name,
        location: { address: p.site_address },
        type: p.project_type,
        contractValue: parseFloat(p.contract_value) || 0,
        status: p.status,
        progress: p.completion_percentage,
        startDate: p.start_date,
        targetCompletion: p.expected_end_date,
        projectManager: p.project_manager
      }))
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

router.get('/projects/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM construction_projects WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

router.post('/projects', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { code, name, clientName, locationAddress, province, projectType, cidbGrade,
            contractValue, currency, startDate, targetCompletion, projectManagerName,
            safetyOfficerName, description } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_projects 
        (tenant_id, code, name, client_name, location_address, province, project_type,
         cidb_grade, contract_value, currency, start_date, target_completion,
         project_manager_name, safety_officer_name, description, status, progress_percentage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'planning', 0)
      RETURNING *`,
      [tenantId, code, name, clientName, locationAddress, province, projectType, cidbGrade,
       contractValue, currency || 'ZAR', startDate, targetCompletion, projectManagerName,
       safetyOfficerName, description]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Project created' });
  } catch (error: any) {
    console.error('Create project error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Project code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

router.put('/projects/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { status, progressPercentage, actualCompletion } = req.body;

    const result = await pool.query(
      `UPDATE construction_projects SET
        status = COALESCE($3, status),
        progress_percentage = COALESCE($4, progress_percentage),
        actual_completion = COALESCE($5, actual_completion),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, progressPercentage, actualCompletion]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Project updated' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// ============================================================================
// PROJECT PHASES
// ============================================================================
router.get('/projects/:projectId/phases', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT * FROM construction_phases 
      WHERE project_id = $1 AND tenant_id = $2 
      ORDER BY phase_number`,
      [projectId, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get phases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch phases' });
  }
});

router.post('/projects/:projectId/phases', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId } = req.params;
    const { phaseNumber, name, description, startDate, targetEndDate, budget } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_phases 
        (tenant_id, project_id, phase_number, name, description, start_date, target_end_date, budget, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [tenantId, projectId, phaseNumber, name, description, startDate, targetEndDate, budget]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Phase added' });
  } catch (error) {
    console.error('Add phase error:', error);
    res.status(500).json({ success: false, error: 'Failed to add phase' });
  }
});

router.put('/phases/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { status, progressPercentage, actualEndDate, actualCost } = req.body;

    const result = await pool.query(
      `UPDATE construction_phases SET
        status = COALESCE($3, status),
        progress_percentage = COALESCE($4, progress_percentage),
        actual_end_date = COALESCE($5, actual_end_date),
        actual_cost = COALESCE($6, actual_cost)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, status, progressPercentage, actualEndDate, actualCost]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Phase not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Phase updated' });
  } catch (error) {
    console.error('Update phase error:', error);
    res.status(500).json({ success: false, error: 'Failed to update phase' });
  }
});

// ============================================================================
// SAFETY INCIDENTS
// ============================================================================
router.get('/safety/incidents', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId, status, severity } = req.query;

    let query = `
      SELECT s.*, p.name as project_name
      FROM construction_safety s
      LEFT JOIN construction_projects p ON s.project_id = p.id
      WHERE s.tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (projectId) {
      params.push(projectId);
      query += ` AND s.project_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND s.status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND s.severity = $${params.length}`;
    }

    query += ' ORDER BY s.incident_date DESC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
});

router.post('/safety/incidents', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId, incidentDate, incidentType, severity, description, locationOnSite,
            injuriesCount, fatalitiesCount, treatmentGiven, reportedBy } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_safety 
        (tenant_id, project_id, incident_date, incident_type, severity, description,
         location_on_site, injuries_count, fatalities_count, treatment_given, reported_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'open')
      RETURNING *`,
      [tenantId, projectId, incidentDate, incidentType, severity, description,
       locationOnSite, injuriesCount || 0, fatalitiesCount || 0, treatmentGiven, reportedBy]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Incident reported' });
  } catch (error) {
    console.error('Report incident error:', error);
    res.status(500).json({ success: false, error: 'Failed to report incident' });
  }
});

// ============================================================================
// MATERIALS
// ============================================================================
router.get('/projects/:projectId/materials', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId } = req.params;

    const result = await pool.query(
      `SELECT * FROM construction_materials 
      WHERE project_id = $1 AND tenant_id = $2 
      ORDER BY material_name`,
      [projectId, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

router.post('/projects/:projectId/materials', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { projectId } = req.params;
    const { materialCode, materialName, category, unit, quantityRequired, unitCost, supplierName } = req.body;

    const result = await pool.query(
      `INSERT INTO construction_materials 
        (tenant_id, project_id, material_code, material_name, category, unit, 
         quantity_required, unit_cost, supplier_name, delivery_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *`,
      [tenantId, projectId, materialCode, materialName, category, unit, 
       quantityRequired, unitCost, supplierName]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Material added' });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ success: false, error: 'Failed to add material' });
  }
});

router.put('/materials/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { quantityDelivered, quantityUsed, deliveryStatus } = req.body;

    const result = await pool.query(
      `UPDATE construction_materials SET
        quantity_delivered = COALESCE($3, quantity_delivered),
        quantity_used = COALESCE($4, quantity_used),
        delivery_status = COALESCE($5, delivery_status)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, quantityDelivered, quantityUsed, deliveryStatus]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Material updated' });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

export default router;
