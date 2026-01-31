/**
 * Practice Management - Client Health Controller V2
 * Tenant-aware handlers for client health scoring and analytics
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
// GET CLIENT 360° VIEW
// ============================================================================

export const getClient360 = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    // Get client details
    const clientResult = await pool.query(`
      SELECT c.*,
             ch.health_score,
             ch.risk_level,
             ch.last_interaction_date
      FROM customers c
      LEFT JOIN client_health ch ON c.id = ch.customer_id AND ch.tenant_id = $2
      WHERE c.id = $1 AND c.tenant_id = $2
    `, [id, tenantId]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get recent interactions
    const interactionsResult = await pool.query(`
      SELECT 
        ci.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name
      FROM client_interactions ci
      LEFT JOIN employees e ON ci.employee_id = e.employee_id
      LEFT JOIN client_projects cp ON ci.project_id = cp.project_id
      WHERE ci.customer_id = $1 AND ci.tenant_id = $2
      ORDER BY ci.interaction_date DESC
      LIMIT 10
    `, [id, tenantId]);

    // Get health score history
    const healthHistoryResult = await pool.query(`
      SELECT *
      FROM client_health_log
      WHERE customer_id = $1 AND tenant_id = $2
      ORDER BY check_date DESC
      LIMIT 12
    `, [id, tenantId]);

    // Get active projects
    const projectsResult = await pool.query(`
      SELECT 
        cp.*,
        COUNT(DISTINCT ptm.assignment_id) as team_size,
        COALESCE(SUM(te.hours), 0) as hours_logged
      FROM client_projects cp
      LEFT JOIN project_team_members ptm ON cp.project_id = ptm.project_id AND ptm.is_active = true
      LEFT JOIN time_entries te ON cp.project_id = te.project_id AND te.status = 'Approved'
      WHERE cp.customer_id = $1 AND cp.tenant_id = $2 AND cp.status IN ('Planning', 'Active', 'On Hold')
      GROUP BY cp.project_id
      ORDER BY cp.created_at DESC
    `, [id, tenantId]);

    // Get revenue metrics
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'Paid' THEN total_amount ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN status = 'Outstanding' THEN total_amount ELSE 0 END), 0) as outstanding_revenue
      FROM invoices
      WHERE customer_id = $1 AND tenant_id = $2
    `, [id, tenantId]);

    res.json({
      success: true,
      data: {
        client: clientResult.rows[0],
        recentInteractions: interactionsResult.rows,
        healthHistory: healthHistoryResult.rows,
        activeProjects: projectsResult.rows,
        revenue: revenueResult.rows[0]
      }
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching client 360:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch client details', error: error.message });
  }
};

// ============================================================================
// GET ALL CLIENT HEALTH SCORES
// ============================================================================

export const getClientHealthScores = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { risk_level, min_score, max_score, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT 
        ch.*,
        c.customer_name,
        c.customer_code
      FROM client_health ch
      JOIN customers c ON ch.customer_id = c.id
      WHERE ch.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (risk_level) {
      query += ` AND ch.risk_level = $${paramCount}`;
      params.push(risk_level);
      paramCount++;
    }

    if (min_score) {
      query += ` AND ch.health_score >= $${paramCount}`;
      params.push(parseInt(min_score as string));
      paramCount++;
    }

    if (max_score) {
      query += ` AND ch.health_score <= $${paramCount}`;
      params.push(parseInt(max_score as string));
      paramCount++;
    }

    query += ` ORDER BY ch.health_score ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        AVG(health_score)::numeric(5,2) as avg_health_score,
        COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN risk_level = 'LOW' THEN 1 END) as low_risk_count
      FROM client_health
      WHERE tenant_id = $1
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows,
      summary: summaryResult.rows[0],
      page: parseInt(page as string)
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching health scores:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health scores', error: error.message });
  }
};

// ============================================================================
// UPDATE CLIENT HEALTH SCORE
// ============================================================================

export const updateClientHealthScore = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const healthData = req.body;

    await client.query('BEGIN');

    // Calculate risk level based on score
    let riskLevel = 'LOW';
    if (healthData.health_score < 40) {
      riskLevel = 'HIGH';
    } else if (healthData.health_score < 70) {
      riskLevel = 'MEDIUM';
    }

    // Upsert health record
    const result = await client.query(`
      INSERT INTO client_health (
        tenant_id, customer_id, health_score, risk_level, 
        engagement_score, payment_score, satisfaction_score,
        last_interaction_date, notes, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (tenant_id, customer_id) DO UPDATE SET
        health_score = EXCLUDED.health_score,
        risk_level = EXCLUDED.risk_level,
        engagement_score = COALESCE(EXCLUDED.engagement_score, client_health.engagement_score),
        payment_score = COALESCE(EXCLUDED.payment_score, client_health.payment_score),
        satisfaction_score = COALESCE(EXCLUDED.satisfaction_score, client_health.satisfaction_score),
        last_interaction_date = COALESCE(EXCLUDED.last_interaction_date, client_health.last_interaction_date),
        notes = EXCLUDED.notes,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      tenantId,
      id,
      healthData.health_score,
      riskLevel,
      healthData.engagement_score,
      healthData.payment_score,
      healthData.satisfaction_score,
      healthData.last_interaction_date,
      healthData.notes,
      userId
    ]);

    // Log health score change
    await client.query(`
      INSERT INTO client_health_log (
        tenant_id, customer_id, check_date, health_score, risk_level, notes, created_by
      ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
    `, [tenantId, id, healthData.health_score, riskLevel, healthData.notes, userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Client health score updated',
      data: result.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error updating health score:', error);
    res.status(500).json({ success: false, message: 'Failed to update health score', error: error.message });
  } finally {
    client.release();
  }
};

// ============================================================================
// LOG CLIENT INTERACTION
// ============================================================================

export const logClientInteraction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const interactionData = req.body;

    // Get employee_id for current user if not provided
    let employeeId = interactionData.employee_id;
    if (!employeeId && userId) {
      const empResult = await pool.query(
        'SELECT employee_id FROM employees WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );
      if (empResult.rows.length > 0) {
        employeeId = empResult.rows[0].employee_id;
      }
    }

    const result = await pool.query(`
      INSERT INTO client_interactions (
        tenant_id, customer_id, project_id, employee_id,
        interaction_type, interaction_date, subject, notes,
        sentiment, follow_up_required, follow_up_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      interactionData.customer_id,
      interactionData.project_id,
      employeeId,
      interactionData.interaction_type,
      interactionData.interaction_date || new Date(),
      interactionData.subject,
      interactionData.notes,
      interactionData.sentiment || 'NEUTRAL',
      interactionData.follow_up_required || false,
      interactionData.follow_up_date,
      userId
    ]);

    // Update last interaction date in health record
    await pool.query(`
      UPDATE client_health 
      SET last_interaction_date = $1, updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $2 AND tenant_id = $3
    `, [interactionData.interaction_date || new Date(), interactionData.customer_id, tenantId]);

    res.status(201).json({
      success: true,
      message: 'Interaction logged successfully',
      data: result.rows[0]
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error logging interaction:', error);
    res.status(500).json({ success: false, message: 'Failed to log interaction', error: error.message });
  }
};

// ============================================================================
// GET CLIENT INTERACTIONS
// ============================================================================

export const getClientInteractions = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { customer_id, interaction_type, start_date, end_date, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT 
        ci.*,
        c.customer_name,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name
      FROM client_interactions ci
      JOIN customers c ON ci.customer_id = c.id
      LEFT JOIN employees e ON ci.employee_id = e.employee_id
      LEFT JOIN client_projects cp ON ci.project_id = cp.project_id
      WHERE ci.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramCount = 2;

    if (customer_id) {
      query += ` AND ci.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    if (interaction_type) {
      query += ` AND ci.interaction_type = $${paramCount}`;
      params.push(interaction_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND ci.interaction_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND ci.interaction_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY ci.interaction_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      page: parseInt(page as string)
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching interactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interactions', error: error.message });
  }
};

// ============================================================================
// AT-RISK CLIENTS
// ============================================================================

export const getAtRiskClients = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(`
      SELECT 
        ch.*,
        c.customer_name,
        c.customer_code,
        c.email,
        (
          SELECT COUNT(*) FROM client_projects cp 
          WHERE cp.customer_id = c.id AND cp.tenant_id = $1 AND cp.status = 'Active'
        ) as active_projects
      FROM client_health ch
      JOIN customers c ON ch.customer_id = c.id
      WHERE ch.tenant_id = $1 AND ch.risk_level IN ('HIGH', 'MEDIUM')
      ORDER BY ch.health_score ASC
      LIMIT 20
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    if (error.message === 'Tenant ID not found') {
      return res.status(401).json({ success: false, message: 'Unauthorized - tenant not found' });
    }
    console.error('Error fetching at-risk clients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch at-risk clients', error: error.message });
  }
};

// ============================================================================
// CLIENT HEALTH DASHBOARD
// ============================================================================

export const getClientHealthDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Overall health distribution
    const healthDistribution = await pool.query(`
      SELECT 
        risk_level,
        COUNT(*) as count,
        AVG(health_score)::numeric(5,2) as avg_score
      FROM client_health
      WHERE tenant_id = $1
      GROUP BY risk_level
    `, [tenantId]);

    // Top at-risk clients
    const topRisk = await pool.query(`
      SELECT 
        ch.customer_id,
        c.customer_name,
        ch.health_score,
        ch.risk_level,
        ch.last_interaction_date
      FROM client_health ch
      JOIN customers c ON ch.customer_id = c.id
      WHERE ch.tenant_id = $1 AND ch.risk_level = 'HIGH'
      ORDER BY ch.health_score ASC
      LIMIT 5
    `, [tenantId]);

    // Clients needing follow-up
    const needFollowUp = await pool.query(`
      SELECT 
        ci.customer_id,
        c.customer_name,
        ci.subject,
        ci.follow_up_date
      FROM client_interactions ci
      JOIN customers c ON ci.customer_id = c.id
      WHERE ci.tenant_id = $1 
      AND ci.follow_up_required = true 
      AND ci.follow_up_date <= CURRENT_DATE + INTERVAL '7 days'
      AND ci.follow_up_completed = false
      ORDER BY ci.follow_up_date ASC
      LIMIT 10
    `, [tenantId]);

    // Health score trends (last 6 months)
    const healthTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('month', check_date) as month,
        AVG(health_score)::numeric(5,2) as avg_score,
        COUNT(DISTINCT customer_id) as client_count
      FROM client_health_log
      WHERE tenant_id = $1 AND check_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', check_date)
      ORDER BY month ASC
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        healthDistribution: healthDistribution.rows,
        topRiskClients: topRisk.rows,
        needFollowUp: needFollowUp.rows,
        healthTrends: healthTrends.rows
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
  getClient360,
  getClientHealthScores,
  updateClientHealthScore,
  logClientInteraction,
  getClientInteractions,
  getAtRiskClients,
  getClientHealthDashboard
};
