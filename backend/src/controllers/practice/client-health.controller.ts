import { Request, Response } from 'express';
import pool from '../../config/database';

/**
 * ============================================================================
 * PRACTICE MANAGEMENT - CLIENT HEALTH & ANALYTICS CONTROLLER
 * ============================================================================
 * 
 * Handles client health scoring, churn prediction, and client intelligence
 * 
 * Features:
 * - Client 360° view (unified client intelligence)
 * - Health score tracking (0-100)
 * - Churn risk prediction
 * - Client interaction logging
 * - Engagement analytics
 * - Revenue insights
 * ============================================================================
 */

// ============================================================================
// GET CLIENT 360° VIEW
// ============================================================================
export const getClient360 = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // customer_id

    const result = await pool.query(`
      SELECT * FROM v_client_360
      WHERE customer_id = $1
    `, [id]);

    if (result.rows.length === 0) {
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
      WHERE ci.customer_id = $1
      ORDER BY ci.interaction_date DESC
      LIMIT 10
    `, [id]);

    // Get health score history
    const healthHistoryResult = await pool.query(`
      SELECT *
      FROM client_health_log
      WHERE customer_id = $1
      ORDER BY check_date DESC
      LIMIT 12
    `, [id]);

    // Get active projects
    const projectsResult = await pool.query(`
      SELECT 
        cp.*,
        COUNT(DISTINCT ptm.assignment_id) as team_size,
        COALESCE(SUM(te.hours), 0) as hours_logged
      FROM client_projects cp
      LEFT JOIN project_team_members ptm ON cp.project_id = ptm.project_id AND ptm.is_active = true
      LEFT JOIN time_entries te ON cp.project_id = te.project_id AND te.status = 'Approved'
      WHERE cp.customer_id = $1 AND cp.status IN ('Planning', 'Active', 'On Hold')
      GROUP BY cp.project_id
      ORDER BY cp.created_at DESC
    `, [id]);

    // Get revenue metrics
    const revenueResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(amount_due), 0) as outstanding_amount,
        COUNT(*) as invoice_count,
        AVG(total_amount) as average_invoice_value
      FROM sales_invoices
      WHERE customer_id = $1
    `, [id]);

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client 360 view',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET ALL CLIENT HEALTH SCORES
// ============================================================================
export const getAllClientHealth = async (req: Request, res: Response) => {
  try {
    const { 
      churn_risk,
      min_health_score,
      max_health_score,
      service_tier,
      page = 1,
      limit = 20 
    } = req.query;

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
          WHERE customer_id = c.id AND status IN ('Planning', 'Active', 'On Hold')
        ) as active_projects,
        (
          SELECT COALESCE(SUM(total_amount), 0)
          FROM sales_invoices
          WHERE customer_id = c.id
        ) as lifetime_revenue,
        (
          SELECT check_date
          FROM client_health_log
          WHERE customer_id = c.id
          ORDER BY check_date DESC
          LIMIT 1
        ) as last_check_date
      FROM customers c
      LEFT JOIN employees e ON c.relationship_manager_id = e.employee_id
      WHERE c.practice_client_id IS NOT NULL
    `;

    const params: any[] = [];
    let paramCount = 1;

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

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      WHERE c.practice_client_id IS NOT NULL
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

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
    const total = parseInt(countResult.rows[0].total);

    // Get summary statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        AVG(health_score) as average_health_score,
        COUNT(CASE WHEN churn_risk = 'high' THEN 1 END) as high_risk_count,
        COUNT(CASE WHEN churn_risk = 'medium' THEN 1 END) as medium_risk_count,
        COUNT(CASE WHEN churn_risk = 'low' THEN 1 END) as low_risk_count,
        COUNT(CASE WHEN health_score < 40 THEN 1 END) as critical_count,
        COUNT(CASE WHEN health_score BETWEEN 40 AND 69 THEN 1 END) as at_risk_count,
        COUNT(CASE WHEN health_score >= 70 THEN 1 END) as healthy_count
      FROM customers
      WHERE practice_client_id IS NOT NULL
    `);

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client health data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CALCULATE AND UPDATE CLIENT HEALTH SCORE
// ============================================================================
export const calculateHealthScore = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params; // customer_id

    // Fetch client data for scoring
    const clientData = await client.query(`
      SELECT * FROM v_client_360
      WHERE customer_id = $1
    `, [id]);

    if (clientData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const client360 = clientData.rows[0];

    // ========================================
    // HEALTH SCORE CALCULATION ALGORITHM
    // ========================================
    
    // 1. FINANCIAL HEALTH (40 points)
    let financialScore = 0;
    
    // Payment history (20 points)
    const avgDaysOverdue = parseFloat(client360.avg_days_overdue || 0);
    if (avgDaysOverdue <= 0) {
      financialScore += 20; // Always pays on time
    } else if (avgDaysOverdue <= 15) {
      financialScore += 15; // Usually on time
    } else if (avgDaysOverdue <= 30) {
      financialScore += 10; // Sometimes late
    } else if (avgDaysOverdue <= 60) {
      financialScore += 5; // Often late
    }
    // else 0 points - consistently late
    
    // Revenue growth (10 points)
    const lifetimeValue = parseFloat(client360.lifetime_value || 0);
    if (lifetimeValue > 500000) {
      financialScore += 10;
    } else if (lifetimeValue > 200000) {
      financialScore += 7;
    } else if (lifetimeValue > 100000) {
      financialScore += 5;
    } else if (lifetimeValue > 50000) {
      financialScore += 3;
    }
    
    // Outstanding balance ratio (10 points)
    const totalRevenue = parseFloat(client360.total_revenue || 1);
    const outstandingRatio = parseFloat(client360.outstanding_amount || 0) / totalRevenue;
    if (outstandingRatio <= 0.1) {
      financialScore += 10;
    } else if (outstandingRatio <= 0.2) {
      financialScore += 7;
    } else if (outstandingRatio <= 0.3) {
      financialScore += 5;
    } else if (outstandingRatio <= 0.5) {
      financialScore += 3;
    }

    // 2. ENGAGEMENT SCORE (35 points)
    let engagementScore = 0;
    
    // Active projects (15 points)
    const activeProjects = parseInt(client360.active_projects || 0);
    if (activeProjects >= 3) {
      engagementScore += 15;
    } else if (activeProjects === 2) {
      engagementScore += 10;
    } else if (activeProjects === 1) {
      engagementScore += 7;
    }
    
    // Recent interactions (10 points)
    const recentInteractions = parseInt(client360.recent_interactions || 0);
    if (recentInteractions >= 10) {
      engagementScore += 10;
    } else if (recentInteractions >= 5) {
      engagementScore += 7;
    } else if (recentInteractions >= 2) {
      engagementScore += 5;
    } else if (recentInteractions >= 1) {
      engagementScore += 3;
    }
    
    // Communication sentiment (10 points)
    const avgSentiment = parseFloat(client360.avg_sentiment || 0);
    if (avgSentiment >= 0.7) {
      engagementScore += 10; // Very positive
    } else if (avgSentiment >= 0.4) {
      engagementScore += 7; // Positive
    } else if (avgSentiment >= 0) {
      engagementScore += 5; // Neutral
    } else if (avgSentiment >= -0.3) {
      engagementScore += 3; // Slightly negative
    }
    // else 0 points - negative sentiment

    // 3. OPERATIONAL HEALTH (25 points)
    let operationalScore = 0;
    
    // Project success rate (15 points)
    const completedProjects = parseInt(client360.completed_projects || 0);
    const totalProjects = parseInt(client360.total_projects || 0);
    if (totalProjects > 0) {
      const successRate = completedProjects / totalProjects;
      if (successRate >= 0.9) {
        operationalScore += 15;
      } else if (successRate >= 0.7) {
        operationalScore += 10;
      } else if (successRate >= 0.5) {
        operationalScore += 7;
      } else if (successRate >= 0.3) {
        operationalScore += 4;
      }
    } else {
      operationalScore += 10; // New client - benefit of doubt
    }
    
    // Response time / service quality (10 points)
    // For now, default to good service
    operationalScore += 8;

    // TOTAL HEALTH SCORE
    const totalHealthScore = Math.min(100, financialScore + engagementScore + operationalScore);

    // CHURN RISK ASSESSMENT
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

    // GENERATE RECOMMENDATIONS
    const recommendations: string[] = [];
    
    if (financialScore < 20) {
      recommendations.push('Schedule payment plan discussion - outstanding balance concerns');
    }
    if (engagementScore < 15) {
      recommendations.push('Increase touchpoints - client engagement is low');
    }
    if (avgSentiment < 0) {
      recommendations.push('Urgent: Address client satisfaction - sentiment is negative');
    }
    if (activeProjects === 0 && completedProjects > 0) {
      recommendations.push('Opportunity: No active projects - reach out with new proposals');
    }
    if (totalHealthScore >= 80) {
      recommendations.push('Upsell opportunity - client is highly engaged and satisfied');
    }

    // Save to health log
    const healthLogResult = await client.query(`
      INSERT INTO client_health_log (
        customer_id,
        health_score,
        financial_health_score,
        engagement_score,
        operational_score,
        churn_risk,
        churn_probability,
        recommendations,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      id,
      Math.round(totalHealthScore),
      Math.round(financialScore),
      Math.round(engagementScore),
      Math.round(operationalScore),
      churnRisk,
      churnProbability,
      recommendations,
      `Automated health check. Factors: Financial (${Math.round(financialScore)}/40), Engagement (${Math.round(engagementScore)}/35), Operational (${Math.round(operationalScore)}/25)`
    ]);

    // Update customer record
    await client.query(`
      UPDATE customers
      SET 
        health_score = $1,
        churn_risk = $2,
        last_health_check_date = NOW()
      WHERE id = $3
    `, [Math.round(totalHealthScore), churnRisk, id]);

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
    res.status(500).json({
      success: false,
      message: 'Failed to calculate health score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// LOG CLIENT INTERACTION
// ============================================================================
export const logInteraction = async (req: Request, res: Response) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: 'customer_id and interaction_type are required'
      });
    }

    const result = await pool.query(`
      INSERT INTO client_interactions (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
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
    ]);

    res.status(201).json({
      success: true,
      message: 'Interaction logged successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error logging interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log interaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET CLIENT INTERACTIONS
// ============================================================================
export const getInteractions = async (req: Request, res: Response) => {
  try {
    const { customer_id, project_id, interaction_type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        ci.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cp.project_name
      FROM client_interactions ci
      LEFT JOIN employees e ON ci.employee_id = e.employee_id
      LEFT JOIN client_projects cp ON ci.project_id = cp.project_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

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

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// GET HEALTH SCORE HISTORY
// ============================================================================
export const getHealthHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // customer_id
    const { limit = 12 } = req.query;

    const result = await pool.query(`
      SELECT *
      FROM client_health_log
      WHERE customer_id = $1
      ORDER BY check_date DESC
      LIMIT $2
    `, [id, limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
