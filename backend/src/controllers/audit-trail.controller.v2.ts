/**
 * Audit Trail Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure audit logging and compliance tracking.
 * Complete audit trail for all data changes.
 */

import { Response } from 'express';
import pool from '../config/database';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class AuditTrailControllerV2 {
  /**
   * Get audit trail entries
   * GET /api/v2/audit/trail
   */
  static async getAuditTrail(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const {
        entity_type,
        entity_id,
        action,
        user_id,
        date_from,
        date_to,
        limit = 100,
        offset = 0
      } = req.query;

      let conditions: string[] = ['tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (entity_type) {
        conditions.push(`entity_type = $${paramIndex}`);
        params.push(entity_type);
        paramIndex++;
      }

      if (entity_id) {
        conditions.push(`entity_id = $${paramIndex}`);
        params.push(entity_id);
        paramIndex++;
      }

      if (action) {
        conditions.push(`action = $${paramIndex}`);
        params.push(action);
        paramIndex++;
      }

      if (user_id) {
        conditions.push(`user_id = $${paramIndex}`);
        params.push(user_id);
        paramIndex++;
      }

      if (date_from) {
        conditions.push(`created_at >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`created_at <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      const query = `
        SELECT 
          at.*,
          u.email as user_email,
          u.display_name as user_name
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY at.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM audit_trail
        WHERE ${conditions.join(' AND ')}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        success: true,
        data: {
          entries: result.rows,
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Get trail error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch audit trail' });
    }
  }

  /**
   * Get entity history (all changes to a specific record)
   * GET /api/v2/audit/entity/:type/:id
   */
  static async getEntityHistory(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { type, id } = req.params;

      const query = `
        SELECT 
          at.*,
          u.email as user_email,
          u.display_name as user_name
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE at.tenant_id = $1
          AND at.entity_type = $2
          AND at.entity_id = $3
        ORDER BY at.created_at DESC
      `;

      const result = await pool.query(query, [tenantId, type, id]);

      res.json({
        success: true,
        data: {
          entity_type: type,
          entity_id: id,
          history: result.rows
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Get entity history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch entity history' });
    }
  }

  /**
   * Get user activity
   * GET /api/v2/audit/user-activity/:userId
   */
  static async getUserActivity(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT 
          at.*,
          u.email as user_email,
          u.display_name as user_name
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE at.tenant_id = $1 AND at.user_id = $2
        ORDER BY at.created_at DESC
        LIMIT $3 OFFSET $4
      `;

      const result = await pool.query(query, [tenantId, userId, limit, offset]);

      res.json({
        success: true,
        data: {
          user_id: userId,
          activities: result.rows
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Get user activity error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user activity' });
    }
  }

  /**
   * Get audit summary/statistics
   * GET /api/v2/audit/summary
   */
  static async getAuditSummary(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { days = 30 } = req.query;

      // Actions summary
      const actionsSummary = await pool.query(`
        SELECT action, COUNT(*) as count
        FROM audit_trail
        WHERE tenant_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
        GROUP BY action
        ORDER BY count DESC
      `, [tenantId]);

      // Entity types summary
      const entitySummary = await pool.query(`
        SELECT entity_type, COUNT(*) as count
        FROM audit_trail
        WHERE tenant_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
        GROUP BY entity_type
        ORDER BY count DESC
      `, [tenantId]);

      // Activity by day
      const dailyActivity = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM audit_trail
        WHERE tenant_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [tenantId]);

      // Top users by activity
      const topUsers = await pool.query(`
        SELECT 
          at.user_id,
          u.email,
          u.display_name,
          COUNT(*) as action_count
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE at.tenant_id = $1
          AND at.created_at >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
        GROUP BY at.user_id, u.email, u.display_name
        ORDER BY action_count DESC
        LIMIT 10
      `, [tenantId]);

      res.json({
        success: true,
        data: {
          period_days: parseInt(days as string),
          actions_summary: actionsSummary.rows,
          entity_summary: entitySummary.rows,
          daily_activity: dailyActivity.rows,
          top_users: topUsers.rows
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Get summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch audit summary' });
    }
  }

  /**
   * Export audit trail
   * POST /api/v2/audit/export
   */
  static async exportAuditTrail(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { date_from, date_to, format = 'csv' } = req.body;

      const query = `
        SELECT 
          at.id,
          at.entity_type,
          at.entity_id,
          at.action,
          at.old_values,
          at.new_values,
          at.ip_address,
          at.user_agent,
          at.created_at,
          u.email as user_email
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE at.tenant_id = $1
          AND at.created_at >= $2
          AND at.created_at <= $3
        ORDER BY at.created_at DESC
      `;

      const result = await pool.query(query, [tenantId, date_from, date_to]);

      if (format === 'csv') {
        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit_trail_${date_from}_${date_to}.csv`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: result.rows
        });
      }

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Export error:', error);
      res.status(500).json({ success: false, message: 'Failed to export audit trail' });
    }
  }

  /**
   * Log a manual audit entry
   * POST /api/v2/audit/log
   */
  static async logAuditEntry(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        description
      } = req.body;

      const query = `
        INSERT INTO audit_trail (
          tenant_id, user_id, entity_type, entity_id,
          action, old_values, new_values, description,
          ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId,
        userId,
        entity_type,
        entity_id,
        action,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        description,
        req.ip,
        req.get('user-agent')
      ]);

      res.status(201).json({
        success: true,
        entry: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Log entry error:', error);
      res.status(500).json({ success: false, message: 'Failed to log audit entry' });
    }
  }

  /**
   * Get data changes comparison
   * GET /api/v2/audit/compare/:id
   */
  static async getChangeComparison(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const query = `
        SELECT 
          at.*,
          u.email as user_email,
          u.display_name as user_name
        FROM audit_trail at
        LEFT JOIN users u ON at.user_id = u.user_id
        WHERE at.id = $1 AND at.tenant_id = $2
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Audit entry not found' });
        return;
      }

      const entry = result.rows[0];
      const oldValues = entry.old_values ? JSON.parse(entry.old_values) : {};
      const newValues = entry.new_values ? JSON.parse(entry.new_values) : {};

      // Calculate differences
      const differences: any[] = [];
      const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

      for (const key of allKeys) {
        if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
          differences.push({
            field: key,
            old_value: oldValues[key],
            new_value: newValues[key]
          });
        }
      }

      res.json({
        success: true,
        data: {
          entry,
          differences
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[AuditTrail] Get comparison error:', error);
      res.status(500).json({ success: false, message: 'Failed to get change comparison' });
    }
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return String(value).replace(/"/g, '""');
    }).map(v => `"${v}"`).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export default AuditTrailControllerV2;
