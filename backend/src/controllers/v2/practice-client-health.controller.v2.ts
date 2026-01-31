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

export const getClient360 = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM v_client_360 WHERE tenant_id = $1 AND customer_id = $2`,
      [tenantId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const interactionsResult = await pool.query(
      `SELECT 
        ci.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name
      FROM client_interactions ci
      LEFT JOIN employees e ON ci.employee_id = e.employee_id AND e.tenant_id = ci.tenant_id
      LEFT JOIN client_projects cp ON ci.project_id = cp.project_id AND cp.tenant_id = ci.tenant_id
      WHERE ci.tenant_id = $1 AND ci.customer_id = $2
      ORDER BY ci.interaction_date DESC
      LIMIT 10`,
      [tenantId, id]
    );

    const healthHistoryResult = await pool.query(
      `SELECT *
       FROM client_health_log
       WHERE tenant_id = $1 AND customer_id = $2
       ORDER BY check_date DESC
       LIMIT 12`,
      [tenantId, id]
    );

    const projectsResult = await pool.query(
      `SELECT 
        cp.*,
        COUNT(DISTINCT ptm.assignment_id) as team_size,
        COALESCE(SUM(te.hours), 0) as hours_logged
      FROM client_projects cp
      LEFT JOIN project_team_members ptm ON cp.project_id = ptm.project_id AND ptm.is_active = true AND ptm.tenant_id = cp.tenant_id
      LEFT JOIN time_entries te ON cp.project_id = te.project_id AND te.status = 'Approved' AND te.tenant_id = cp.tenant_id
      WHERE cp.tenant_id = $1 AND cp.customer_id = $2 AND cp.status IN ('Planning', 'Active', 'On Hold')
      GROUP BY cp.project_id
      ORDER BY cp.created_at DESC`,
      [tenantId, id]
    );

    const revenueResult = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(amount_due), 0) as outstanding_amount,
        COUNT(*) as invoice_count,
        AVG(total_amount) as average_invoice_value
      FROM sales_invoices
      WHERE tenant_id = $1 AND customer_id = $2`,
      [tenantId, id]
    );

    res.json({
      success: true,
      data: {
        client: result.rows[0],
        recent_interactions: interactionsResult.rows,
        health_history: healthHistoryResult.rows,
        active_projects: projectsResult.rows,
        revenue_metrics: revenueResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching client 360:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch client 360 view', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getAllClientHealth = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { churn_risk, min_health_score, max_health_score, service_tier, page = 1, limit = 20 } = req.query;

    const params: any[] = [tenantId];
    let paramCount = 2;

    let query = `
      SELECT 
        c.id as customer_id,
        c.customer_code,
        c.customer_name,
        c.health_score,
        c.churn_risk,
        c.service_tier,
        c.last_health_check_date,
        c.relationship_manager_id,
        e.first_name || ' ' || e.last_name as relationship_manager_name,
        (
          SELECT COUNT(*)
          FROM client_projects
          WHERE tenant_id = $1 AND customer_id = c.id AND status IN ('Planning', 'Active', 'On Hold')
        ) as active_projects,
        (
          SELECT COALESCE(SUM(total_amount), 0)
          FROM sales_invoices
          WHERE tenant_id = $1 AND customer_id = c.id
        ) as lifetime_revenue,
        (
          SELECT check_date
          FROM client_health_log
          WHERE tenant_id = $1 AND customer_id = c.id
          ORDER BY check_date DESC
          LIMIT 1
        ) as last_check_date
      FROM customers c
      LEFT JOIN employees e ON c.relationship_manager_id = e.employee_id AND e.tenant_id = c.tenant_id
      WHERE c.tenant_id = $1 AND c.practice_client_id IS NOT NULL
    `;

    if (churn_risk) {
      query += ` AND c.churn_risk = $${paramCount}`;
      params.push(churn_risk);
      paramCount++;
    }

    if (min_health_score) {
      query += ` AND c.health_score >= $${paramCount}`;
      params.push(min_health_score);
      paramCount++;
    }

    if (max_health_score) {
      query += ` AND c.health_score <= $${paramCount}`;
      params.push(max_health_score);
      paramCount++;
    }

    if (service_tier) {
      query += ` AND c.service_tier = $${paramCount}`;
      params.push(service_tier);
      paramCount++;
    }

    query += ` ORDER BY c.health_score ASC, c.customer_name ASC`;

    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      WHERE c.tenant_id = $1 AND c.practice_client_id IS NOT NULL
    `;
    const countParams: any[] = [tenantId];
    let countParamIndex = 2;

    if (churn_risk) {
      countQuery += ` AND c.churn_risk = $${countParamIndex}`;
      countParams.push(churn_risk);
      countParamIndex++;
    }
    if (min_health_score) {
      countQuery += ` AND c.health_score >= $${countParamIndex}`;
      countParams.push(min_health_score);
      countParamIndex++;
    }
    if (max_health_score) {
      countQuery += ` AND c.health_score <= $${countParamIndex}`;
      countParams.push(max_health_score);
      countParamIndex++;
    }
    if (service_tier) {
      countQuery += ` AND c.service_tier = $${countParamIndex}`;
      countParams.push(service_tier);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_clients,
        AVG(health_score) as average_health_score,
        COUNT(CASE WHEN churn_risk = 'high' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN churn_risk = 'medium' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN churn_risk = 'low' THEN 1 END) as low_risk_count,
        COUNT(CASE WHEN health_score < 40 THEN 1 END) as critical_count,
        COUNT(CASE WHEN health_score BETWEEN 40 AND 69 THEN 1 END) as at_risk_count,
        COUNT(CASE WHEN health_score >= 70 THEN 1 END) as healthy_count
      FROM customers
      WHERE tenant_id = $1 AND practice_client_id IS NOT NULL`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
      summary: statsResult.rows[0],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching client health:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch client health data', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const calculateHealthScore = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenantId } = getTenantContext(req);
    await client.query('BEGIN');

    const { id } = req.params;

    const clientData = await client.query(
      `SELECT * FROM v_client_360 WHERE tenant_id = $1 AND customer_id = $2`,
      [tenantId, id]
    );

    if (clientData.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const client360 = clientData.rows[0];

    let financialScore = 0;
    const avgDaysOverdue = parseFloat(client360.avg_days_overdue || 0);
    if (avgDaysOverdue <= 0) financialScore += 20;
    else if (avgDaysOverdue <= 15) financialScore += 15;
    else if (avgDaysOverdue <= 30) financialScore += 10;
    else if (avgDaysOverdue <= 60) financialScore += 5;

    const lifetimeValue = parseFloat(client360.lifetime_value || 0);
    if (lifetimeValue > 500000) financialScore += 10;
    else if (lifetimeValue > 200000) financialScore += 7;
    else if (lifetimeValue > 100000) financialScore += 5;
    else if (lifetimeValue > 50000) financialScore += 3;

    const totalRevenue = parseFloat(client360.total_revenue || 1);
    const outstandingRatio = parseFloat(client360.outstanding_amount || 0) / totalRevenue;
    if (outstandingRatio <= 0.1) financialScore += 10;
    else if (outstandingRatio <= 0.2) financialScore += 7;
    else if (outstandingRatio <= 0.3) financialScore += 5;
    else if (outstandingRatio <= 0.5) financialScore += 3;

    let engagementScore = 0;
    const activeProjects = parseInt(client360.active_projects || 0, 10);
    if (activeProjects >= 3) engagementScore += 15;
    else if (activeProjects === 2) engagementScore += 10;
    else if (activeProjects === 1) engagementScore += 7;

    const recentInteractions = parseInt(client360.recent_interactions || 0, 10);
    if (recentInteractions >= 10) engagementScore += 10;
    else if (recentInteractions >= 5) engagementScore += 7;
    else if (recentInteractions >= 2) engagementScore += 5;
    else if (recentInteractions >= 1) engagementScore += 3;

    const avgSentiment = parseFloat(client360.avg_sentiment || 0);
    if (avgSentiment >= 0.7) engagementScore += 10;
    else if (avgSentiment >= 0.4) engagementScore += 7;
    else if (avgSentiment >= 0) engagementScore += 5;
    else if (avgSentiment >= -0.3) engagementScore += 3;

    let operationalScore = 0;
    const completedProjects = parseInt(client360.completed_projects || 0, 10);
    const totalProjects = parseInt(client360.total_projects || 0, 10);
    if (totalProjects > 0) {
      const successRate = completedProjects / totalProjects;
      if (successRate >= 0.9) operationalScore += 15;
      else if (successRate >= 0.7) operationalScore += 10;
      else if (successRate >= 0.5) operationalScore += 7;
      else if (successRate >= 0.3) operationalScore += 4;
    } else {
      operationalScore += 10;
    }

    operationalScore += 8;

    const totalHealthScore = Math.min(100, financialScore + engagementScore + operationalScore);

    let churnRisk = 'low';
    let churnProbability = 0;
    if (totalHealthScore < 40) {
      churnRisk = 'high';
      churnProbability = 0.7 + (40 - totalHealthScore) * 0.01;
    } else if (totalHealthScore < 60) {
      churnRisk = 'medium';
      churnProbability = 0.3 + (60 - totalHealthScore) * 0.02;
    } else {
      churnRisk = 'low';
      churnProbability = Math.max(0, (70 - totalHealthScore) * 0.01);
    }

    const recommendations: string[] = [];
    if (financialScore < 20) recommendations.push('Schedule payment plan discussion - outstanding balance concerns');
    if (engagementScore < 15) recommendations.push('Increase touchpoints - client engagement is low');
    if (avgSentiment < 0) recommendations.push('Urgent: Address client satisfaction - sentiment is negative');
    if (activeProjects === 0 && completedProjects > 0) recommendations.push('Opportunity: No active projects - reach out with new proposals');
    if (totalHealthScore >= 80) recommendations.push('Upsell opportunity - client is highly engaged and satisfied');

    const healthLogResult = await client.query(
      `INSERT INTO client_health_log (
        tenant_id,
        customer_id,
        health_score,
        financial_health_score,
        engagement_score,
        operational_score,
        churn_risk,
        churn_probability,
        recommendations,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        tenantId,
        id,
        Math.round(totalHealthScore),
        Math.round(financialScore),
        Math.round(engagementScore),
        Math.round(operationalScore),
        churnRisk,
        churnProbability,
        recommendations,
        `Automated health check. Factors: Financial (${Math.round(financialScore)}/40), Engagement (${Math.round(engagementScore)}/35), Operational (${Math.round(operationalScore)}/25)`
      ]
    );

    await client.query(
      `UPDATE customers
       SET health_score = $1, churn_risk = $2, last_health_check_date = NOW()
       WHERE tenant_id = $3 AND id = $4`,
      [Math.round(totalHealthScore), churnRisk, tenantId, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Health score calculated successfully',
      data: {
        health_score: Math.round(totalHealthScore),
        breakdown: {
          financial_health: Math.round(financialScore),
          engagement: Math.round(engagementScore),
          operational: Math.round(operationalScore)
        },
        churn_risk: churnRisk,
        churn_probability: Math.round(churnProbability * 100),
        recommendations,
        log_entry: healthLogResult.rows[0]
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error calculating health score:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate health score', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const logInteraction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      customer_id,
      project_id,
      employee_id,
      interaction_type,
      interaction_date,
      summary,
      notes,
      sentiment_score,
      key_topics,
      action_items,
      follow_up_required,
      follow_up_date
    } = req.body;

    if (!customer_id || !interaction_type) {
      return res.status(400).json({ success: false, message: 'customer_id and interaction_type are required' });
    }

    const result = await pool.query(
      `INSERT INTO client_interactions (
        tenant_id,
        customer_id,
        project_id,
        employee_id,
        interaction_type,
        interaction_date,
        summary,
        notes,
        sentiment_score,
        key_topics,
        action_items,
        follow_up_required,
        follow_up_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        tenantId,
        customer_id,
        project_id || null,
        employee_id || null,
        interaction_type,
        interaction_date || new Date(),
        summary || null,
        notes || null,
        sentiment_score || null,
        key_topics || null,
        action_items || null,
        follow_up_required || false,
        follow_up_date || null
      ]
    );

    res.status(201).json({ success: true, message: 'Interaction logged successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({ success: false, message: 'Failed to log interaction', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getInteractions = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { customer_id, project_id, interaction_type, start_date, end_date } = req.query;

    const params: any[] = [tenantId];
    let paramCount = 2;

    let query = `
      SELECT 
        ci.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name
      FROM client_interactions ci
      LEFT JOIN employees e ON ci.employee_id = e.employee_id AND e.tenant_id = ci.tenant_id
      LEFT JOIN client_projects cp ON ci.project_id = cp.project_id AND cp.tenant_id = ci.tenant_id
      WHERE ci.tenant_id = $1
    `;

    if (customer_id) {
      query += ` AND ci.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    if (project_id) {
      query += ` AND ci.project_id = $${paramCount}`;
      params.push(project_id);
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

    query += ` ORDER BY ci.interaction_date DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interactions', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getHealthHistory = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { limit = 12 } = req.query;

    const result = await pool.query(
      `SELECT *
       FROM client_health_log
       WHERE tenant_id = $1 AND customer_id = $2
       ORDER BY check_date DESC
       LIMIT $3`,
      [tenantId, id, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health history', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
