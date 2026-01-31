/**
 * Reports Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure report definitions, execution, and scheduling.
 * All queries filtered by tenant_id.
 */

import { Response } from 'express';
import { pool } from '../config/database';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class ReportsControllerV2 {
  /**
   * Get all report definitions
   * GET /api/v2/reports/definitions
   */
  static async getReportDefinitions(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { category, isSystemReport } = req.query;

      let conditions: string[] = ['(tenant_id = $1 OR is_system_report = true)', 'is_active = true'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (category) {
        conditions.push(`report_category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (isSystemReport !== undefined) {
        conditions.push(`is_system_report = $${paramIndex}`);
        params.push(isSystemReport === 'true');
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      const query = `
        SELECT 
          report_id, report_code, report_name, report_description,
          report_category, is_system_report, created_at
        FROM report_definitions
        WHERE ${whereClause}
        ORDER BY report_category, report_name
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        reports: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Get definitions error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch report definitions' });
    }
  }

  /**
   * Get report definition by ID
   * GET /api/v2/reports/definitions/:id
   */
  static async getReportDefinitionById(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const query = `
        SELECT *
        FROM report_definitions
        WHERE report_id = $1
          AND (tenant_id = $2 OR is_system_report = true)
      `;

      const result = await pool.query(query, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      res.json({
        success: true,
        report: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Get definition error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch report definition' });
    }
  }

  /**
   * Create a new report definition
   * POST /api/v2/reports/definitions
   */
  static async createReportDefinition(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        report_code,
        report_name,
        report_description,
        report_category,
        query_template,
        parameters,
        output_format
      } = req.body;

      const query = `
        INSERT INTO report_definitions (
          tenant_id, report_code, report_name, report_description,
          report_category, query_template, parameters, output_format,
          is_system_report, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId,
        report_code,
        report_name,
        report_description,
        report_category || 'CUSTOM',
        query_template,
        JSON.stringify(parameters || {}),
        output_format || 'PDF',
        userId
      ]);

      res.status(201).json({
        success: true,
        report: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Create definition error:', error);
      res.status(500).json({ success: false, message: 'Failed to create report definition' });
    }
  }

  /**
   * Execute a report
   * POST /api/v2/reports/execute/:id
   */
  static async executeReport(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const { parameters } = req.body;

      // Get report definition
      const defQuery = `
        SELECT *
        FROM report_definitions
        WHERE report_id = $1
          AND (tenant_id = $2 OR is_system_report = true)
          AND is_active = true
      `;

      const defResult = await pool.query(defQuery, [id, tenantId]);

      if (defResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Report not found' });
        return;
      }

      const report = defResult.rows[0];

      // Log execution
      const logQuery = `
        INSERT INTO report_execution_log (
          tenant_id, report_id, executed_by, parameters, status
        )
        VALUES ($1, $2, $3, $4, 'RUNNING')
        RETURNING execution_id
      `;

      const logResult = await pool.query(logQuery, [
        tenantId,
        id,
        userId,
        JSON.stringify(parameters || {})
      ]);

      const executionId = logResult.rows[0].execution_id;

      // Execute report (simplified - real implementation would use query_template)
      // For now, return a placeholder
      const executionResult = {
        execution_id: executionId,
        report_name: report.report_name,
        status: 'COMPLETED',
        parameters,
        data: [],
        generated_at: new Date().toISOString()
      };

      // Update log
      await pool.query(`
        UPDATE report_execution_log
        SET status = 'COMPLETED', completed_at = NOW()
        WHERE execution_id = $1 AND tenant_id = $2
      `, [executionId, tenantId]);

      res.json({
        success: true,
        result: executionResult
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Execute error:', error);
      res.status(500).json({ success: false, message: 'Failed to execute report' });
    }
  }

  /**
   * Get report execution history
   * GET /api/v2/reports/history
   */
  static async getExecutionHistory(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { report_id, limit = 50, offset = 0 } = req.query;

      let conditions: string[] = ['rel.tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (report_id) {
        conditions.push(`rel.report_id = $${paramIndex}`);
        params.push(report_id);
        paramIndex++;
      }

      const query = `
        SELECT 
          rel.execution_id,
          rel.report_id,
          rd.report_name,
          rel.executed_by,
          rel.parameters,
          rel.status,
          rel.created_at as executed_at,
          rel.completed_at
        FROM report_execution_log rel
        JOIN report_definitions rd ON rel.report_id = rd.report_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY rel.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const result = await pool.query(query, params);

      res.json({
        success: true,
        history: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Get history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch execution history' });
    }
  }

  /**
   * Schedule a report
   * POST /api/v2/reports/schedule
   */
  static async scheduleReport(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        report_id,
        schedule_name,
        frequency,
        frequency_config,
        parameters,
        recipients,
        output_format
      } = req.body;

      const query = `
        INSERT INTO report_schedules (
          tenant_id, report_id, schedule_name, frequency,
          frequency_config, parameters, recipients, output_format,
          created_by, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId,
        report_id,
        schedule_name,
        frequency,
        JSON.stringify(frequency_config || {}),
        JSON.stringify(parameters || {}),
        JSON.stringify(recipients || []),
        output_format || 'PDF',
        userId
      ]);

      res.status(201).json({
        success: true,
        schedule: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Schedule error:', error);
      res.status(500).json({ success: false, message: 'Failed to schedule report' });
    }
  }

  /**
   * Get scheduled reports
   * GET /api/v2/reports/schedules
   */
  static async getScheduledReports(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { is_active } = req.query;

      let conditions: string[] = ['rs.tenant_id = $1'];
      let params: any[] = [tenantId];

      if (is_active !== undefined) {
        conditions.push('rs.is_active = $2');
        params.push(is_active === 'true');
      }

      const query = `
        SELECT 
          rs.*,
          rd.report_name,
          rd.report_category
        FROM report_schedules rs
        JOIN report_definitions rd ON rs.report_id = rd.report_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY rs.created_at DESC
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        schedules: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Get schedules error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch scheduled reports' });
    }
  }

  /**
   * Delete a schedule
   * DELETE /api/v2/reports/schedules/:id
   */
  static async deleteSchedule(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const result = await pool.query(`
        DELETE FROM report_schedules
        WHERE schedule_id = $1 AND tenant_id = $2
        RETURNING *
      `, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Schedule not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Schedule deleted'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[Reports] Delete schedule error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
  }
}

export default ReportsControllerV2;
