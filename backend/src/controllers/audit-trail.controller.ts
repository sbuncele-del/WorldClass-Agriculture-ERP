import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Audit Trail Controller
 * Tracks and retrieves all system activity for compliance
 */

export class AuditTrailController {
  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        date_from,
        date_to,
        user_id,
        user_email,
        action,
        entity_type,
        module,
        severity,
        search_text,
        page = 1,
        limit = 50
      } = req.query;

      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let paramIndex = 1;

      // Date range filter
      if (date_from) {
        conditions.push(`timestamp >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`timestamp <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      // User filters
      if (user_id) {
        conditions.push(`user_id = $${paramIndex}`);
        params.push(user_id);
        paramIndex++;
      }

      if (user_email) {
        conditions.push(`user_email ILIKE $${paramIndex}`);
        params.push(`%${user_email}%`);
        paramIndex++;
      }

      // Action filter
      if (action && Array.isArray(action) && action.length > 0) {
        conditions.push(`action = ANY($${paramIndex})`);
        params.push(action);
        paramIndex++;
      }

      // Entity type filter
      if (entity_type && Array.isArray(entity_type) && entity_type.length > 0) {
        conditions.push(`entity_type = ANY($${paramIndex})`);
        params.push(entity_type);
        paramIndex++;
      }

      // Module filter
      if (module) {
        conditions.push(`module = $${paramIndex}`);
        params.push(module);
        paramIndex++;
      }

      // Severity filter
      if (severity) {
        conditions.push(`severity = $${paramIndex}`);
        params.push(severity);
        paramIndex++;
      }

      // Text search
      if (search_text) {
        conditions.push(`(description ILIKE $${paramIndex} OR entity_id ILIKE $${paramIndex})`);
        params.push(`%${search_text}%`);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');
      const offset = (Number(page) - 1) * Number(limit);

      // Main query
      const query = `
        SELECT 
          id,
          action,
          entity_type,
          entity_id,
          user_id,
          user_email,
          user_name,
          timestamp,
          ip_address,
          old_values,
          new_values,
          changes,
          description,
          module,
          severity,
          session_id
        FROM audit_log
        WHERE ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(Number(limit), offset);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_log
        WHERE ${whereClause}
      `;

      const [logsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2))
      ]);

      res.json({
        success: true,
        data: {
          logs: logsResult.rows,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: parseInt(countResult.rows[0].total),
            total_pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving audit logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM audit_log WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Audit log not found'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving audit log',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get entity history (all changes to a specific entity)
   */
  async getEntityHistory(req: Request, res: Response): Promise<void> {
    try {
      const { entity_type, entity_id } = req.params;

      const result = await pool.query(
        `SELECT 
          id,
          action,
          user_email,
          user_name,
          timestamp,
          old_values,
          new_values,
          changes,
          description,
          severity
        FROM audit_log
        WHERE entity_type = $1 AND entity_id = $2
        ORDER BY timestamp DESC`,
        [entity_type, entity_id]
      );

      res.json({
        success: true,
        data: {
          entity_type,
          entity_id,
          history: result.rows
        }
      });
    } catch (error) {
      console.error('Error fetching entity history:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving entity history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params;
      const { date_from, date_to, limit = 100 } = req.query;

      const conditions: string[] = ['user_id = $1'];
      const params: any[] = [user_id];
      let paramIndex = 2;

      if (date_from) {
        conditions.push(`timestamp >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`timestamp <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const result = await pool.query(
        `SELECT 
          id,
          action,
          entity_type,
          entity_id,
          timestamp,
          description,
          module,
          severity
        FROM audit_log
        WHERE ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex}`,
        [...params, Number(limit)]
      );

      // Get summary statistics
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_actions,
          COUNT(DISTINCT entity_type) as entity_types_modified,
          COUNT(DISTINCT DATE(timestamp)) as active_days,
          MIN(timestamp) as first_activity,
          MAX(timestamp) as last_activity
        FROM audit_log
        WHERE ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          user_id,
          statistics: statsResult.rows[0],
          activity: result.rows
        }
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get audit summary statistics
   */
  async getAuditSummary(req: Request, res: Response): Promise<void> {
    try {
      const { date_from, date_to } = req.query;

      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let paramIndex = 1;

      if (date_from) {
        conditions.push(`timestamp >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`timestamp <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Overall statistics
      const statsResult = await pool.query(
        `SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT entity_type) as unique_entity_types,
          COUNT(DISTINCT DATE(timestamp)) as active_days,
          MIN(timestamp) as earliest_log,
          MAX(timestamp) as latest_log
        FROM audit_log
        WHERE ${whereClause}`,
        params
      );

      // Actions breakdown
      const actionsResult = await pool.query(
        `SELECT 
          action,
          COUNT(*) as count
        FROM audit_log
        WHERE ${whereClause}
        GROUP BY action
        ORDER BY count DESC`,
        params
      );

      // Entity types breakdown
      const entitiesResult = await pool.query(
        `SELECT 
          entity_type,
          COUNT(*) as count
        FROM audit_log
        WHERE ${whereClause}
        GROUP BY entity_type
        ORDER BY count DESC
        LIMIT 10`,
        params
      );

      // Daily activity
      const dailyResult = await pool.query(
        `SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM audit_log
        WHERE ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30`,
        params
      );

      // Top users
      const usersResult = await pool.query(
        `SELECT 
          user_email,
          user_name,
          COUNT(*) as action_count
        FROM audit_log
        WHERE ${whereClause} AND user_email IS NOT NULL
        GROUP BY user_email, user_name
        ORDER BY action_count DESC
        LIMIT 10`,
        params
      );

      res.json({
        success: true,
        data: {
          overall: statsResult.rows[0],
          actions_breakdown: actionsResult.rows,
          entity_types_breakdown: entitiesResult.rows,
          daily_activity: dailyResult.rows,
          top_users: usersResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving audit summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manual audit log creation (for application-level events)
   */
  async createAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const {
        action,
        entity_type,
        entity_id,
        user_id,
        user_email,
        user_name,
        old_values,
        new_values,
        description,
        module = 'FINANCIAL',
        severity = 'INFO',
        ip_address,
        user_agent
      } = req.body;

      // Validate required fields
      if (!action || !entity_type || !entity_id) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: action, entity_type, entity_id'
        });
        return;
      }

      // Calculate changes
      let changes = null;
      if (old_values && new_values) {
        changes = {};
        for (const key in new_values) {
          if (old_values[key] !== new_values[key]) {
            changes[key] = {
              old: old_values[key],
              new: new_values[key]
            };
          }
        }
      }

      const result = await pool.query(
        `INSERT INTO audit_log (
          action, entity_type, entity_id, user_id, user_email, user_name,
          old_values, new_values, changes, description, module, severity,
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          action, entity_type, entity_id, user_id, user_email, user_name,
          old_values ? JSON.stringify(old_values) : null,
          new_values ? JSON.stringify(new_values) : null,
          changes ? JSON.stringify(changes) : null,
          description, module, severity, ip_address, user_agent
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Audit log created successfully'
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating audit log',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { date_from, date_to, module } = req.query;

      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let paramIndex = 1;

      if (date_from) {
        conditions.push(`timestamp >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`timestamp <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      if (module) {
        conditions.push(`module = $${paramIndex}`);
        params.push(module);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const result = await pool.query(
        `SELECT 
          timestamp,
          action,
          entity_type,
          entity_id,
          user_email,
          user_name,
          description,
          module,
          severity
        FROM audit_log
        WHERE ${whereClause}
        ORDER BY timestamp DESC`,
        params
      );

      // Generate CSV
      let csv = 'Timestamp,Action,Entity Type,Entity ID,User Email,User Name,Description,Module,Severity\n';
      
      result.rows.forEach(row => {
        csv += `"${row.timestamp}","${row.action}","${row.entity_type}","${row.entity_id}","${row.user_email || ''}","${row.user_name || ''}","${row.description || ''}","${row.module}","${row.severity}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_log_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting audit logs',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new AuditTrailController();
