import { Request, Response } from 'express';
import db from '../config/database';
import jwt from 'jsonwebtoken';

/**
 * Super Admin Controller
 * Purpose: Centralized admin portal for monitoring and supporting ALL client tenants
 * Security: Platform admin and support agent roles only
 * Features: Tenant monitoring, impersonation, support tickets, health metrics
 */

// =====================================================
// 1. TENANT MANAGEMENT & OVERVIEW
// =====================================================

/**
 * Get all tenants with health metrics
 * Used by: Super Admin Dashboard
 */
export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const { status, plan, search, health_status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Use correct column names: id, name (not tenant_id, tenant_name)
    const result = await db.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.slug,
        t.subscription_plan,
        t.status,
        t.subscription_status,
        t.trial_ends_at,
        t.billing_email,
        t.max_users,
        t.created_at,
        t.company_info,
        t.settings,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_user_count,
        MAX(u.last_login_at) as last_activity
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE t.deleted_at IS NULL
        AND ($1::VARCHAR IS NULL OR t.status = $1)
        AND ($2::VARCHAR IS NULL OR t.subscription_plan = $2)
        AND ($3::VARCHAR IS NULL OR t.name ILIKE '%' || $3 || '%')
      GROUP BY t.id, t.name, t.slug, t.subscription_plan, t.status, t.subscription_status,
               t.trial_ends_at, t.billing_email, t.max_users, t.created_at, 
               t.company_info, t.settings
      ORDER BY t.created_at DESC
      LIMIT $4 OFFSET $5
    `, [status || null, plan || null, search || null, limit, offset]);
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM tenants t
      WHERE t.deleted_at IS NULL
        AND ($1::VARCHAR IS NULL OR t.status = $1)
        AND ($2::VARCHAR IS NULL OR t.subscription_plan = $2)
        AND ($3::VARCHAR IS NULL OR t.name ILIKE '%' || $3 || '%')
    `, [status || null, plan || null, search || null]);
    
    res.json({ 
      tenants: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
};

/**
 * Get detailed information for a single tenant
 * Includes: metrics, users, activity, system health
 */
export const getTenantDetails = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { days = 30 } = req.query;
    
    // Log admin access
    await logAdminAccess(
      String(req.user.user_id),
      'VIEW_TENANT_DETAILS',
      tenantId,
      { sections: ['tenant_info', 'metrics', 'users', 'activity'] }
    );
    
    // Parallel queries for performance
    const [tenant, metrics, users, recentActivity, systemHealth, tickets, alerts] = await Promise.all([
      // Basic tenant info
      db.query(`SELECT * FROM tenants WHERE tenant_id = $1`, [tenantId]),
      
      // Historical metrics
      db.query(`
        SELECT * FROM tenant_health_metrics 
        WHERE tenant_id = $1 
        ORDER BY metric_date DESC 
        LIMIT $2
      `, [tenantId, days]),
      
      // User list
      db.query(`
        SELECT user_id, email, full_name, role, last_login, status, created_at
        FROM users 
        WHERE tenant_id = $1
        ORDER BY last_login DESC NULLS LAST
        LIMIT 100
      `, [tenantId]),
      
      // Recent activity (from audit logs)
      db.query(`
        SELECT action, created_at, created_by, resource_type
        FROM audit_logs
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `, [tenantId]),
      
      // System health - module usage
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM sales_invoices WHERE tenant_id = $1) as invoice_count,
          (SELECT COUNT(*) FROM purchase_orders WHERE tenant_id = $1) as po_count,
          (SELECT COUNT(*) FROM inventory_items WHERE tenant_id = $1) as inventory_count,
          (SELECT COUNT(*) FROM employees WHERE tenant_id = $1) as employee_count,
          (SELECT COUNT(*) FROM journal_entries WHERE tenant_id = $1) as journal_entry_count
      `, [tenantId]),
      
      // Support tickets
      db.query(`
        SELECT ticket_id, ticket_number, subject, status, priority, created_at
        FROM support_tickets 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `, [tenantId]),
      
      // Active alerts
      db.query(`
        SELECT alert_id, alert_type, severity, title, message, created_at
        FROM tenant_alerts 
        WHERE tenant_id = $1 AND status = 'ACTIVE'
        ORDER BY severity DESC, created_at DESC
      `, [tenantId])
    ]);
    
    if (tenant.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      tenant: tenant.rows[0],
      metrics: metrics.rows,
      users: users.rows,
      recentActivity: recentActivity.rows,
      systemHealth: systemHealth.rows[0],
      tickets: tickets.rows,
      alerts: alerts.rows
    });
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
};

/**
 * Impersonate a tenant - generates temporary access token
 * Security: Creates audit trail, time-limited token
 */
export const impersonateTenant = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;
    const adminUser = (req as any).user;
    
    // Verify tenant exists - use correct column names: id, name
    const tenantResult = await db.query(
      `SELECT id, name FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenantResult.rows[0];
    
    // Try to log impersonation (silently fail if table doesn't exist)
    try {
      await db.query(`
        INSERT INTO audit_logs (
          tenant_id, user_id, action, entity_type, entity_id,
          changes, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        adminUser.tenantId,
        adminUser.userId,
        'IMPERSONATE_TENANT',
        'tenant',
        tenantId,
        JSON.stringify({ 
          reason: reason || 'Support access',
          target_tenant: tenant.name,
          admin_email: adminUser.email
        }),
        req.ip
      ]);
    } catch (logError) {
      // Audit logging is optional - don't fail impersonation
      console.warn('Could not log impersonation:', logError);
    }
    
    // Generate temporary impersonation token (2 hour expiry)
    const impersonationToken = jwt.sign(
      { 
        userId: adminUser.userId,
        email: adminUser.email,
        role: 'admin',
        tenantId: tenantId,  // Impersonating this tenant
        originalTenantId: adminUser.tenantId,
        impersonation: true,
        impersonatedBy: adminUser.email
      },
      process.env.JWT_SECRET!,
      { expiresIn: '2h' }
    );
    
    res.json({ 
      success: true,
      token: impersonationToken,
      message: `Now viewing ${tenant.name}`,
      tenant_id: tenantId,
      tenant_name: tenant.name,
      expires_in: '2 hours',
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error('Error impersonating tenant:', error);
    res.status(500).json({ error: 'Failed to impersonate tenant' });
  }
};

/**
 * Update tenant subscription or status
 */
export const updateTenantStatus = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { status, subscription_plan, reason } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;
    
    if (status) {
      updates.push(`status = $${valueIndex++}`);
      values.push(status);
    }
    
    if (subscription_plan) {
      updates.push(`subscription_plan = $${valueIndex++}`);
      values.push(subscription_plan);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(tenantId);
    
    const result = await db.query(`
      UPDATE tenants 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE tenant_id = $${valueIndex}
      RETURNING *
    `, values);
    
    // Log the change
    await logAdminAccess(
      String(req.user.user_id),
      'UPDATE_TENANT_STATUS',
      tenantId,
      { changes: { status, subscription_plan }, reason }
    );
    
    res.json({ 
      message: 'Tenant updated successfully',
      tenant: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
};

// =====================================================
// 2. SYSTEM-WIDE HEALTH MONITORING
// =====================================================

/**
 * Get system-wide health overview
 * Used by: Super Admin Dashboard home page
 */
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const healthData = await db.query(`
      SELECT * FROM system_health_summary
    `);
    
    // Get recent critical issues
    const criticalIssues = await db.query(`
      SELECT 
        ta.alert_id,
        ta.tenant_id,
        t.tenant_name,
        ta.alert_type,
        ta.severity,
        ta.title,
        ta.created_at
      FROM tenant_alerts ta
      JOIN tenants t ON t.tenant_id = ta.tenant_id
      WHERE ta.status = 'ACTIVE' AND ta.severity IN ('CRITICAL', 'ERROR')
      ORDER BY ta.created_at DESC
      LIMIT 10
    `);
    
    // Get tenant health distribution
    const healthDistribution = await db.query(`
      SELECT 
        health_status,
        COUNT(*) as count
      FROM tenant_health_metrics
      WHERE metric_date = CURRENT_DATE
      GROUP BY health_status
    `);
    
    res.json({ 
      health: healthData.rows[0],
      criticalIssues: criticalIssues.rows,
      healthDistribution: healthDistribution.rows
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

/**
 * Get system-wide metrics trends
 */
export const getSystemMetricsTrends = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    const trends = await db.query(`
      SELECT 
        metric_date,
        COUNT(DISTINCT tenant_id) as active_tenants,
        SUM(active_users) as total_active_users,
        SUM(api_calls_count) as total_api_calls,
        AVG(error_rate) as avg_error_rate,
        AVG(avg_response_time_ms) as avg_response_time,
        SUM(transactions_count) as total_transactions
      FROM tenant_health_metrics
      WHERE metric_date >= CURRENT_DATE - $1::INT
      GROUP BY metric_date
      ORDER BY metric_date ASC
    `, [days]);
    
    res.json({ trends: trends.rows });
  } catch (error) {
    console.error('Error fetching system trends:', error);
    res.status(500).json({ error: 'Failed to fetch system trends' });
  }
};

// =====================================================
// 3. SUPPORT TICKET MANAGEMENT
// =====================================================

/**
 * Get support tickets with filtering
 */
export const getSupportTickets = async (req: Request, res: Response) => {
  try {
    const { 
      status, 
      priority, 
      tenantId, 
      assignedTo,
      category,
      page = 1, 
      limit = 50 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await db.query(`
      SELECT 
        st.*,
        t.tenant_name,
        reporter.email as reporter_email,
        reporter.full_name as reporter_name,
        assignee.email as assignee_email,
        assignee.full_name as assignee_name,
        (SELECT COUNT(*) FROM support_ticket_comments stc 
         WHERE stc.ticket_id = st.ticket_id) as comment_count
      FROM support_tickets st
      LEFT JOIN tenants t ON t.tenant_id = st.tenant_id
      LEFT JOIN users reporter ON reporter.user_id = st.reported_by
      LEFT JOIN users assignee ON assignee.user_id = st.assigned_to
      WHERE ($1::VARCHAR IS NULL OR st.status = $1)
        AND ($2::VARCHAR IS NULL OR st.priority = $2)
        AND ($3::UUID IS NULL OR st.tenant_id = $3)
        AND ($4::UUID IS NULL OR st.assigned_to = $4)
        AND ($5::VARCHAR IS NULL OR st.category = $5)
      ORDER BY 
        CASE st.priority 
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        st.sla_breach DESC,
        st.created_at DESC
      LIMIT $6 OFFSET $7
    `, [status, priority, tenantId, assignedTo, category, limit, offset]);
    
    // Get total count
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM support_tickets st
      WHERE ($1::VARCHAR IS NULL OR st.status = $1)
        AND ($2::VARCHAR IS NULL OR st.priority = $2)
        AND ($3::UUID IS NULL OR st.tenant_id = $3)
        AND ($4::UUID IS NULL OR st.assigned_to = $4)
        AND ($5::VARCHAR IS NULL OR st.category = $5)
    `, [status, priority, tenantId, assignedTo, category]);
    
    res.json({ 
      tickets: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.rows[0].total,
        pages: Math.ceil(countResult.rows[0].total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
};

/**
 * Get single ticket with full details and comments
 */
export const getSupportTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    
    const [ticket, comments] = await Promise.all([
      db.query(`
        SELECT 
          st.*,
          t.tenant_name,
          reporter.email as reporter_email,
          reporter.full_name as reporter_name,
          assignee.email as assignee_email,
          assignee.full_name as assignee_name
        FROM support_tickets st
        LEFT JOIN tenants t ON t.tenant_id = st.tenant_id
        LEFT JOIN users reporter ON reporter.user_id = st.reported_by
        LEFT JOIN users assignee ON assignee.user_id = st.assigned_to
        WHERE st.ticket_id = $1
      `, [ticketId]),
      
      db.query(`
        SELECT 
          stc.*,
          u.email as author_email,
          u.full_name as author_name
        FROM support_ticket_comments stc
        LEFT JOIN users u ON u.user_id = stc.created_by
        WHERE stc.ticket_id = $1
        ORDER BY stc.created_at ASC
      `, [ticketId])
    ]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({
      ticket: ticket.rows[0],
      comments: comments.rows
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
};

/**
 * Create support ticket
 */
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const {
      tenant_id,
      subject,
      description,
      category = 'GENERAL',
      priority = 'MEDIUM',
      severity = 'MINOR',
      module_name,
      url_path,
      error_message,
      browser_info,
      reported_by
    } = req.body;
    
    // Calculate SLA hours based on priority
    const slaHours = {
      'CRITICAL': 2,
      'HIGH': 8,
      'MEDIUM': 24,
      'LOW': 48
    }[priority] || 24;
    
    const result = await db.query(`
      INSERT INTO support_tickets (
        tenant_id, subject, description, category, priority, severity,
        module_name, url_path, error_message, browser_info,
        reported_by, sla_priority_hours, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'OPEN')
      RETURNING *
    `, [
      tenant_id, subject, description, category, priority, severity,
      module_name, url_path, error_message, browser_info,
      reported_by, slaHours
    ]);
    
    res.status(201).json({ 
      message: 'Support ticket created successfully',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};

/**
 * Update ticket status or assignment
 */
export const updateSupportTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const {
      status,
      priority,
      assigned_to,
      assigned_team,
      resolution,
      resolution_category
    } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;
    
    if (status) {
      updates.push(`status = $${valueIndex++}`);
      values.push(status);
      
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updates.push(`resolved_at = NOW()`);
        updates.push(`resolution_hours = EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600`);
      }
    }
    
    if (priority) {
      updates.push(`priority = $${valueIndex++}`);
      values.push(priority);
    }
    
    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${valueIndex++}`);
      values.push(assigned_to);
      
      if (assigned_to && status !== 'ASSIGNED') {
        updates.push(`status = 'ASSIGNED'`);
      }
    }
    
    if (assigned_team) {
      updates.push(`assigned_team = $${valueIndex++}`);
      values.push(assigned_team);
    }
    
    if (resolution) {
      updates.push(`resolution = $${valueIndex++}`);
      values.push(resolution);
    }
    
    if (resolution_category) {
      updates.push(`resolution_category = $${valueIndex++}`);
      values.push(resolution_category);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(ticketId);
    
    const result = await db.query(`
      UPDATE support_tickets 
      SET ${updates.join(', ')}
      WHERE ticket_id = $${valueIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ 
      message: 'Ticket updated successfully',
      ticket: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};

/**
 * Add comment to ticket
 */
export const addTicketComment = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { comment_text, is_internal = false } = req.body;
    const userId = req.user.user_id;
    
    // Determine author role
    const userRole = req.user.role === 'platform_admin' || req.user.role === 'support_agent' 
      ? 'SUPPORT_AGENT' 
      : 'CUSTOMER';
    
    const result = await db.query(`
      INSERT INTO support_ticket_comments (
        ticket_id, comment_text, is_internal, created_by, author_role
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [ticketId, comment_text, is_internal, userId, userRole]);
    
    // Update ticket's updated_at
    await db.query(`
      UPDATE support_tickets 
      SET updated_at = NOW(),
          first_response_at = COALESCE(first_response_at, NOW())
      WHERE ticket_id = $1
    `, [ticketId]);
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStatistics = async (req: Request, res: Response) => {
  try {
    const { tenantId, days = 30 } = req.query;
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')) as open_tickets,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_tickets,
        COUNT(*) FILTER (WHERE status = 'CLOSED') as closed_tickets,
        COUNT(*) FILTER (WHERE priority = 'CRITICAL') as critical_tickets,
        COUNT(*) FILTER (WHERE sla_breach = true) as sla_breached,
        AVG(resolution_hours) FILTER (WHERE resolution_hours IS NOT NULL) as avg_resolution_hours,
        AVG(first_response_minutes) FILTER (WHERE first_response_minutes IS NOT NULL) as avg_first_response_minutes,
        AVG(satisfaction_rating) FILTER (WHERE satisfaction_rating IS NOT NULL) as avg_satisfaction
      FROM support_tickets
      WHERE ($1::UUID IS NULL OR tenant_id = $1)
        AND created_at >= NOW() - ($2::INT || ' days')::INTERVAL
    `, [tenantId, days]);
    
    // Tickets by category
    const byCategory = await db.query(`
      SELECT category, COUNT(*) as count
      FROM support_tickets
      WHERE ($1::UUID IS NULL OR tenant_id = $1)
        AND created_at >= NOW() - ($2::INT || ' days')::INTERVAL
      GROUP BY category
      ORDER BY count DESC
    `, [tenantId, days]);
    
    // Tickets over time
    const overTime = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as tickets_created,
        COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) as tickets_resolved
      FROM support_tickets
      WHERE ($1::UUID IS NULL OR tenant_id = $1)
        AND created_at >= NOW() - ($2::INT || ' days')::INTERVAL
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [tenantId, days]);
    
    res.json({
      statistics: stats.rows[0],
      byCategory: byCategory.rows,
      overTime: overTime.rows
    });
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// =====================================================
// 4. FEATURE FLAGS MANAGEMENT
// =====================================================

/**
 * Get feature flags for a tenant
 */
export const getTenantFeatureFlags = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    
    const result = await db.query(`
      SELECT * FROM tenant_feature_flags
      WHERE tenant_id = $1
      ORDER BY feature_category, feature_name
    `, [tenantId]);
    
    res.json({ featureFlags: result.rows });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
};

/**
 * Update or create feature flag
 */
export const updateFeatureFlag = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { feature_name, enabled, config, reason } = req.body;
    
    const result = await db.query(`
      INSERT INTO tenant_feature_flags (
        tenant_id, feature_name, enabled, config, updated_by, reason
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tenant_id, feature_name) 
      DO UPDATE SET 
        enabled = $3,
        config = $4,
        updated_at = NOW(),
        updated_by = $5,
        reason = $6,
        enabled_at = CASE WHEN $3 = true AND tenant_feature_flags.enabled = false 
                     THEN NOW() ELSE tenant_feature_flags.enabled_at END,
        disabled_at = CASE WHEN $3 = false AND tenant_feature_flags.enabled = true 
                      THEN NOW() ELSE tenant_feature_flags.disabled_at END
      RETURNING *
    `, [tenantId, feature_name, enabled, config, req.user.user_id, reason]);
    
    // Log the change
    await logAdminAccess(
      String(req.user.user_id),
      'UPDATE_FEATURE_FLAG',
      tenantId,
      { feature_name, enabled, reason }
    );
    
    res.json({ 
      message: 'Feature flag updated successfully',
      featureFlag: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
};

/**
 * Bulk update feature flags across multiple tenants
 */
export const bulkUpdateFeatureFlags = async (req: Request, res: Response) => {
  try {
    const { tenant_ids, feature_name, enabled, config, reason } = req.body;
    
    if (!Array.isArray(tenant_ids) || tenant_ids.length === 0) {
      return res.status(400).json({ error: 'tenant_ids array is required' });
    }
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const tenantId of tenant_ids) {
        const result = await client.query(`
          INSERT INTO tenant_feature_flags (
            tenant_id, feature_name, enabled, config, updated_by, reason
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (tenant_id, feature_name) 
          DO UPDATE SET enabled = $3, config = $4, updated_at = NOW(), updated_by = $5
          RETURNING *
        `, [tenantId, feature_name, enabled, config, String(req.user.user_id), reason]);
        
        results.push(result.rows[0]);
        
        // Log each change
        await client.query(`
          INSERT INTO admin_access_logs (
            admin_user_id, admin_email, admin_role,
            action, target_tenant_id, data_accessed, reason
          ) VALUES ($1, $2, $3, 'BULK_UPDATE_FEATURE_FLAG', $4, $5, $6)
        `, [
          String(req.user.user_id),
          req.user.email,
          req.user.role,
          tenantId,
          JSON.stringify({ feature_name, enabled }),
          reason
        ]);
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: `Feature flag '${feature_name}' updated for ${results.length} tenants`,
        updatedCount: results.length,
        results
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error bulk updating feature flags:', error);
    res.status(500).json({ error: 'Failed to bulk update feature flags' });
  }
};

// =====================================================
// 5. ALERTS & MONITORING
// =====================================================

/**
 * Get active alerts across all tenants
 */
export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const { severity, tenantId, category } = req.query;
    
    const result = await db.query(`
      SELECT 
        ta.*,
        t.tenant_name
      FROM tenant_alerts ta
      JOIN tenants t ON t.tenant_id = ta.tenant_id
      WHERE ta.status = 'ACTIVE'
        AND ($1::VARCHAR IS NULL OR ta.severity = $1)
        AND ($2::UUID IS NULL OR ta.tenant_id = $2)
        AND ($3::VARCHAR IS NULL OR ta.category = $3)
      ORDER BY 
        CASE ta.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'ERROR' THEN 2
          WHEN 'WARNING' THEN 3
          ELSE 4
        END,
        ta.created_at DESC
      LIMIT 100
    `, [severity, tenantId, category]);
    
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
};

/**
 * Resolve or dismiss an alert
 */
export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { status, resolution_notes } = req.body;
    
    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be RESOLVED or DISMISSED' });
    }
    
    const result = await db.query(`
      UPDATE tenant_alerts 
      SET status = $1,
          resolved_at = NOW(),
          resolved_by = $2,
          resolution_notes = $3,
          updated_at = NOW()
      WHERE alert_id = $4
      RETURNING *
    `, [status, req.user.user_id, resolution_notes, alertId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({
      message: 'Alert resolved successfully',
      alert: result.rows[0]
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
};

// =====================================================
// 6. ADMIN ACCESS LOGS
// =====================================================

/**
 * Get admin access logs with filtering
 */
export const getAdminAccessLogs = async (req: Request, res: Response) => {
  try {
    const { 
      adminUserId, 
      tenantId, 
      action,
      startDate,
      endDate,
      page = 1, 
      limit = 100 
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await db.query(`
      SELECT * FROM admin_access_logs
      WHERE ($1::UUID IS NULL OR admin_user_id = $1)
        AND ($2::UUID IS NULL OR target_tenant_id = $2)
        AND ($3::VARCHAR IS NULL OR action = $3)
        AND ($4::TIMESTAMP IS NULL OR timestamp >= $4)
        AND ($5::TIMESTAMP IS NULL OR timestamp <= $5)
      ORDER BY timestamp DESC
      LIMIT $6 OFFSET $7
    `, [adminUserId, tenantId, action, startDate, endDate, limit, offset]);
    
    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
};

// =====================================================
// 7. HELPER FUNCTIONS
// =====================================================

/**
 * Helper: Log admin access for audit trail
 */
const logAdminAccess = async (
  adminUserId: string,
  action: string,
  targetTenantId?: string,
  dataAccessed?: any,
  reason?: string
) => {
  try {
    // Get admin details
    const adminResult = await db.query(
      `SELECT email, role FROM users WHERE user_id = $1`,
      [adminUserId]
    );
    
    if (adminResult.rows.length === 0) return;
    
    const admin = adminResult.rows[0];
    
    // Get tenant name if provided
    let tenantName = null;
    if (targetTenantId) {
      const tenantResult = await db.query(
        `SELECT tenant_name FROM tenants WHERE tenant_id = $1`,
        [targetTenantId]
      );
      if (tenantResult.rows.length > 0) {
        tenantName = tenantResult.rows[0].tenant_name;
      }
    }
    
    // Insert log
    await db.query(`
      INSERT INTO admin_access_logs (
        admin_user_id, admin_email, admin_role,
        action, target_tenant_id, target_tenant_name,
        data_accessed, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      adminUserId,
      admin.email,
      admin.role,
      action,
      targetTenantId,
      tenantName,
      dataAccessed ? JSON.stringify(dataAccessed) : null,
      reason
    ]);
  } catch (error) {
    console.error('Error logging admin access:', error);
    // Don't throw - logging failure shouldn't break the request
  }
};

// Export all controller functions
export default {
  // Tenant Management
  getAllTenants,
  getTenantDetails,
  impersonateTenant,
  updateTenantStatus,
  
  // System Health
  getSystemHealth,
  getSystemMetricsTrends,
  
  // Support Tickets
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  addTicketComment,
  getTicketStatistics,
  
  // Feature Flags
  getTenantFeatureFlags,
  updateFeatureFlag,
  bulkUpdateFeatureFlags,
  
  // Alerts
  getActiveAlerts,
  resolveAlert,
  
  // Audit Logs
  getAdminAccessLogs
};
