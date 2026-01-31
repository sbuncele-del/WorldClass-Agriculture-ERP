import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * Reports & Analytics Controller
 * 
 * Handles comprehensive reporting and analytics:
 * - Custom report execution
 * - Report scheduling
 * - Dashboard management
 * - KPI tracking
 * - Data exports
 */

class ReportsController {

  // ============================================================================
  // REPORT DEFINITIONS
  // ============================================================================

  /**
   * Get all report definitions
   * GET /api/reports/definitions
   */
  async getReportDefinitions(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { category, isSystemReport } = req.query;

      let whereConditions: string[] = ['tenant_id = $1 OR tenant_id = $2', 'is_active = true'];
      let queryParams: any[] = [tenantId, '00000000-0000-0000-0000-000000000000'];
      let paramIndex = 3;

      if (category) {
        whereConditions.push(`report_category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      if (isSystemReport !== undefined) {
        whereConditions.push(`is_system_report = $${paramIndex}`);
        queryParams.push(isSystemReport === 'true');
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          report_id, report_code, report_name, report_description,
          report_category, is_system_report, created_at
        FROM report_definitions
        WHERE ${whereClause}
        ORDER BY report_category, report_name
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        reports: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get definitions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report definitions',
        error: error.message
      });
    }
  }

  /**
   * Get report definition by ID
   * GET /api/reports/definitions/:id
   */
  async getReportDefinitionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT * FROM report_definitions
        WHERE report_id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Report definition not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        report: result.rows[0]
      });

    } catch (error: any) {
      console.error('[Reports] Get definition by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch report definition',
        error: error.message
      });
    }
  }

  /**
   * Execute a report
   * POST /api/reports/execute
   */
  async executeReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;
      const { reportId, parameters } = req.body;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
        return;
      }

      // Get report definition
      const reportQuery = `
        SELECT * FROM report_definitions
        WHERE report_id = $1
      `;
      const reportResult = await pool.query(reportQuery, [reportId]);

      if (reportResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        });
        return;
      }

      const report = reportResult.rows[0];

      // Create execution record
      const executionQuery = `
        INSERT INTO report_executions (
          tenant_id, report_id, execution_type, parameters,
          status, executed_by, started_at
        ) VALUES ($1, $2, 'MANUAL', $3, 'RUNNING', $4, CURRENT_TIMESTAMP)
        RETURNING execution_id
      `;
      const executionResult = await pool.query(executionQuery, [
        tenantId, reportId, JSON.stringify(parameters || {}), userId
      ]);
      const executionId = executionResult.rows[0].execution_id;

      try {
        // Execute the report query
        const startTime = Date.now();
        const queryParams = [tenantId, ...(parameters || [])];
        const dataResult = await pool.query(report.query_template, queryParams);
        const executionTime = Date.now() - startTime;

        // Update execution record
        await pool.query(`
          UPDATE report_executions
          SET 
            status = 'COMPLETED',
            row_count = $1,
            execution_time_ms = $2,
            completed_at = CURRENT_TIMESTAMP
          WHERE execution_id = $3
        `, [dataResult.rows.length, executionTime, executionId]);

        res.status(200).json({
          success: true,
          executionId,
          data: dataResult.rows,
          rowCount: dataResult.rows.length,
          executionTime
        });

      } catch (execError: any) {
        // Update execution with error
        await pool.query(`
          UPDATE report_executions
          SET 
            status = 'FAILED',
            error_message = $1,
            completed_at = CURRENT_TIMESTAMP
          WHERE execution_id = $2
        `, [execError.message, executionId]);

        res.status(500).json({
          success: false,
          message: 'Report execution failed',
          error: execError.message
        });
      }

    } catch (error: any) {
      console.error('[Reports] Execute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute report',
        error: error.message
      });
    }
  }

  /**
   * Get report execution history
   * GET /api/reports/executions
   */
  async getExecutionHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { reportId, limit = 50, offset = 0 } = req.query;

      let whereConditions: string[] = ['re.tenant_id = $1'];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (reportId) {
        whereConditions.push(`re.report_id = $${paramIndex}`);
        queryParams.push(reportId);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          re.*,
          rd.report_name
        FROM report_executions re
        JOIN report_definitions rd ON re.report_id = rd.report_id
        WHERE ${whereClause}
        ORDER BY re.started_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        executions: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get execution history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch execution history',
        error: error.message
      });
    }
  }

  // ============================================================================
  // DASHBOARDS
  // ============================================================================

  /**
   * Get all dashboards
   * GET /api/reports/dashboards
   */
  async getDashboards(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;
      const { category } = req.query;

      let whereConditions: string[] = [
        '(d.tenant_id = $1 OR d.is_public = true)',
        'd.is_active = true'
      ];
      let queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (category) {
        whereConditions.push(`d.dashboard_category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT 
          d.*,
          COUNT(dw.widget_id) as widget_count
        FROM dashboards d
        LEFT JOIN dashboard_widgets dw ON d.dashboard_id = dw.dashboard_id
        WHERE ${whereClause}
        GROUP BY d.dashboard_id
        ORDER BY d.dashboard_category, d.dashboard_name
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        dashboards: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get dashboards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboards',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard by ID with widgets
   * GET /api/reports/dashboards/:id
   */
  async getDashboardById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get dashboard
      const dashboardQuery = `
        SELECT * FROM dashboards
        WHERE dashboard_id = $1
      `;
      const dashboardResult = await pool.query(dashboardQuery, [id]);

      if (dashboardResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Dashboard not found'
        });
        return;
      }

      // Get widgets
      const widgetsQuery = `
        SELECT * FROM dashboard_widgets
        WHERE dashboard_id = $1
        ORDER BY display_order, widget_id
      `;
      const widgetsResult = await pool.query(widgetsQuery, [id]);

      res.status(200).json({
        success: true,
        dashboard: dashboardResult.rows[0],
        widgets: widgetsResult.rows
      });

    } catch (error: any) {
      console.error('[Reports] Get dashboard by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard',
        error: error.message
      });
    }
  }

  /**
   * Execute widget query
   * POST /api/reports/widgets/execute
   */
  async executeWidget(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { widgetId } = req.body;

      if (!widgetId) {
        res.status(400).json({
          success: false,
          message: 'Widget ID is required'
        });
        return;
      }

      // Get widget
      const widgetQuery = `
        SELECT * FROM dashboard_widgets
        WHERE widget_id = $1
      `;
      const widgetResult = await pool.query(widgetQuery, [widgetId]);

      if (widgetResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Widget not found'
        });
        return;
      }

      const widget = widgetResult.rows[0];
      const queryConfig = widget.query_config;

      // Execute widget query
      const dataResult = await pool.query(queryConfig.query, [tenantId]);

      res.status(200).json({
        success: true,
        data: dataResult.rows
      });

    } catch (error: any) {
      console.error('[Reports] Execute widget error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute widget',
        error: error.message
      });
    }
  }

  // ============================================================================
  // KPIs
  // ============================================================================

  /**
   * Get all KPI definitions
   * GET /api/reports/kpis
   */
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { category } = req.query;

      let whereConditions: string[] = [
        '(tenant_id = $1 OR tenant_id = $2)',
        'is_active = true'
      ];
      let queryParams: any[] = [tenantId, '00000000-0000-0000-0000-000000000000'];
      let paramIndex = 3;

      if (category) {
        whereConditions.push(`kpi_category = $${paramIndex}`);
        queryParams.push(category);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      const query = `
        SELECT * FROM kpi_definitions
        WHERE ${whereClause}
        ORDER BY kpi_category, kpi_name
      `;

      const result = await pool.query(query, queryParams);

      res.status(200).json({
        success: true,
        kpis: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get KPIs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KPIs',
        error: error.message
      });
    }
  }

  /**
   * Calculate KPI value
   * POST /api/reports/kpis/calculate
   */
  async calculateKPI(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { kpiId } = req.body;

      if (!kpiId) {
        res.status(400).json({
          success: false,
          message: 'KPI ID is required'
        });
        return;
      }

      // Get KPI definition
      const kpiQuery = `
        SELECT * FROM kpi_definitions
        WHERE kpi_id = $1
      `;
      const kpiResult = await pool.query(kpiQuery, [kpiId]);

      if (kpiResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'KPI not found'
        });
        return;
      }

      const kpi = kpiResult.rows[0];

      // Execute calculation query
      const calcResult = await pool.query(kpi.calculation_query, [tenantId]);
      const value = calcResult.rows[0] ? Object.values(calcResult.rows[0])[0] : 0;

      // Save KPI value
      await pool.query(`
        INSERT INTO kpi_values (
          kpi_id, period_start, period_end, value, calculated_at
        ) VALUES ($1, CURRENT_DATE, CURRENT_DATE, $2, CURRENT_TIMESTAMP)
      `, [kpiId, value]);

      res.status(200).json({
        success: true,
        kpiId,
        value,
        calculatedAt: new Date()
      });

    } catch (error: any) {
      console.error('[Reports] Calculate KPI error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate KPI',
        error: error.message
      });
    }
  }

  /**
   * Get KPI history
   * GET /api/reports/kpis/:id/history
   */
  async getKPIHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      const query = `
        SELECT 
          kv.*,
          kd.kpi_name,
          kd.unit,
          kd.target_value
        FROM kpi_values kv
        JOIN kpi_definitions kd ON kv.kpi_id = kd.kpi_id
        WHERE kv.kpi_id = $1
          AND kv.period_start >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY kv.period_start DESC
      `;

      const result = await pool.query(query, [id]);

      res.status(200).json({
        success: true,
        history: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get KPI history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch KPI history',
        error: error.message
      });
    }
  }

  // ============================================================================
  // DATA EXPORTS
  // ============================================================================

  /**
   * Export data
   * POST /api/reports/export
   */
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const userId = (req as any).user?.userId;
      const { dataSource, format, filters } = req.body;

      if (!dataSource || !format) {
        res.status(400).json({
          success: false,
          message: 'Data source and format are required'
        });
        return;
      }

      // Create export record
      const exportQuery = `
        INSERT INTO export_history (
          tenant_id, data_source, format, status, exported_by, created_at
        ) VALUES ($1, $2, $3, 'PROCESSING', $4, CURRENT_TIMESTAMP)
        RETURNING export_id
      `;
      const exportResult = await pool.query(exportQuery, [
        tenantId, dataSource, format, userId
      ]);
      const exportId = exportResult.rows[0].export_id;

      // In a real implementation, this would generate the file asynchronously
      // For now, we'll just return the export ID
      res.status(202).json({
        success: true,
        message: 'Export queued for processing',
        exportId
      });

    } catch (error: any) {
      console.error('[Reports] Export data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
        error: error.message
      });
    }
  }

  /**
   * Get export history
   * GET /api/reports/exports
   */
  async getExportHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || '00000000-0000-0000-0000-000000000000';
      const { limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT * FROM export_history
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [tenantId, limit, offset]);

      res.status(200).json({
        success: true,
        exports: result.rows,
        total: result.rows.length
      });

    } catch (error: any) {
      console.error('[Reports] Get export history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export history',
        error: error.message
      });
    }
  }

}

export default new ReportsController();
