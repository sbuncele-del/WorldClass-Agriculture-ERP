/**
 * Custom Reports Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure custom report builder and execution.
 * Report templates, columns, filters, and scheduling.
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

export class CustomReportsControllerV2 {
  /**
   * Get all report templates
   * GET /api/v2/custom-reports/templates
   */
  static async getReportTemplates(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { category, is_shared, is_favorite, search } = req.query;

      let conditions: string[] = ['(tenant_id = $1 OR is_shared = true)'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (category) {
        conditions.push(`category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      if (is_shared !== undefined) {
        conditions.push(`is_shared = $${paramIndex}`);
        params.push(is_shared === 'true');
        paramIndex++;
      }

      if (search) {
        conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      const query = `
        SELECT 
          t.*,
          (SELECT COUNT(*) FROM report_columns WHERE template_id = t.id) as column_count,
          (SELECT COUNT(*) FROM report_filters WHERE template_id = t.id) as filter_count
        FROM report_templates t
        WHERE ${conditions.join(' AND ')}
        ORDER BY run_count DESC, name ASC
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        templates: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Get templates error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch report templates' });
    }
  }

  /**
   * Get report template by ID
   * GET /api/v2/custom-reports/templates/:id
   */
  static async getReportTemplateById(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      // Get template
      const templateQuery = `
        SELECT * FROM report_templates
        WHERE id = $1 AND (tenant_id = $2 OR is_shared = true)
      `;
      const templateResult = await pool.query(templateQuery, [id, tenantId]);

      if (templateResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Report template not found' });
        return;
      }

      const template = templateResult.rows[0];

      // Get columns
      const columnsResult = await pool.query(
        'SELECT * FROM report_columns WHERE template_id = $1 ORDER BY sort_order',
        [id]
      );

      // Get filters
      const filtersResult = await pool.query(
        'SELECT * FROM report_filters WHERE template_id = $1 ORDER BY filter_order',
        [id]
      );

      // Get groups
      const groupsResult = await pool.query(
        'SELECT * FROM report_groups WHERE template_id = $1 ORDER BY group_order',
        [id]
      );

      res.json({
        success: true,
        template: {
          ...template,
          columns: columnsResult.rows,
          filters: filtersResult.rows,
          groups: groupsResult.rows
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Get template error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch report template' });
    }
  }

  /**
   * Create a new report template
   * POST /api/v2/custom-reports/templates
   */
  static async createReportTemplate(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        code,
        name,
        description,
        category,
        base_table,
        columns,
        filters,
        groups,
        is_shared
      } = req.body;

      await client.query('BEGIN');

      // Create template
      const templateQuery = `
        INSERT INTO report_templates (
          tenant_id, code, name, description, category,
          base_table, is_shared, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const templateResult = await client.query(templateQuery, [
        tenantId,
        code,
        name,
        description,
        category || 'CUSTOM',
        base_table,
        is_shared || false,
        userId
      ]);

      const templateId = templateResult.rows[0].id;

      // Add columns
      if (columns && columns.length > 0) {
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          await client.query(`
            INSERT INTO report_columns (
              template_id, field_name, display_name, data_type,
              sort_order, is_visible, aggregate_function
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            templateId,
            col.field_name,
            col.display_name,
            col.data_type || 'text',
            col.sort_order || i + 1,
            col.is_visible !== false,
            col.aggregate_function
          ]);
        }
      }

      // Add filters
      if (filters && filters.length > 0) {
        for (let i = 0; i < filters.length; i++) {
          const filter = filters[i];
          await client.query(`
            INSERT INTO report_filters (
              template_id, field_name, filter_type, operator,
              default_value, filter_order, is_required
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            templateId,
            filter.field_name,
            filter.filter_type || 'text',
            filter.operator || '=',
            filter.default_value,
            filter.filter_order || i + 1,
            filter.is_required || false
          ]);
        }
      }

      // Add groups
      if (groups && groups.length > 0) {
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i];
          await client.query(`
            INSERT INTO report_groups (
              template_id, field_name, group_order, show_subtotal
            )
            VALUES ($1, $2, $3, $4)
          `, [
            templateId,
            group.field_name,
            group.group_order || i + 1,
            group.show_subtotal || false
          ]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        template: templateResult.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Create template error:', error);
      res.status(500).json({ success: false, message: 'Failed to create report template' });
    } finally {
      client.release();
    }
  }

  /**
   * Update a report template
   * PUT /api/v2/custom-reports/templates/:id
   */
  static async updateReportTemplate(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const { name, description, category, is_shared, columns, filters, groups } = req.body;

      await client.query('BEGIN');

      // Verify ownership
      const checkQuery = `
        SELECT id FROM report_templates
        WHERE id = $1 AND tenant_id = $2
      `;
      const checkResult = await client.query(checkQuery, [id, tenantId]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, message: 'Template not found or access denied' });
        return;
      }

      // Update template
      const updateQuery = `
        UPDATE report_templates
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            category = COALESCE($3, category),
            is_shared = COALESCE($4, is_shared),
            updated_at = NOW(),
            updated_by = $5
        WHERE id = $6 AND tenant_id = $7
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        name, description, category, is_shared, userId, id, tenantId
      ]);

      // Update columns if provided
      if (columns) {
        await client.query('DELETE FROM report_columns WHERE template_id = $1', [id]);
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          await client.query(`
            INSERT INTO report_columns (
              template_id, field_name, display_name, data_type,
              sort_order, is_visible, aggregate_function
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [id, col.field_name, col.display_name, col.data_type || 'text',
              col.sort_order || i + 1, col.is_visible !== false, col.aggregate_function]);
        }
      }

      // Update filters if provided
      if (filters) {
        await client.query('DELETE FROM report_filters WHERE template_id = $1', [id]);
        for (let i = 0; i < filters.length; i++) {
          const filter = filters[i];
          await client.query(`
            INSERT INTO report_filters (
              template_id, field_name, filter_type, operator,
              default_value, filter_order, is_required
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [id, filter.field_name, filter.filter_type || 'text', filter.operator || '=',
              filter.default_value, filter.filter_order || i + 1, filter.is_required || false]);
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        template: result.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Update template error:', error);
      res.status(500).json({ success: false, message: 'Failed to update report template' });
    } finally {
      client.release();
    }
  }

  /**
   * Delete a report template
   * DELETE /api/v2/custom-reports/templates/:id
   */
  static async deleteReportTemplate(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const result = await pool.query(`
        DELETE FROM report_templates
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `, [id, tenantId]);

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Template not found or access denied' });
        return;
      }

      res.json({
        success: true,
        message: 'Report template deleted'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Delete template error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete report template' });
    }
  }

  /**
   * Run a custom report
   * POST /api/v2/custom-reports/run/:id
   */
  static async runReport(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const { filter_values, sort_by, sort_order, limit = 1000, offset = 0 } = req.body;

      // Get template
      const templateQuery = `
        SELECT * FROM report_templates
        WHERE id = $1 AND (tenant_id = $2 OR is_shared = true)
      `;
      const templateResult = await pool.query(templateQuery, [id, tenantId]);

      if (templateResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Report template not found' });
        return;
      }

      const template = templateResult.rows[0];

      // Get columns
      const columns = await pool.query(
        'SELECT * FROM report_columns WHERE template_id = $1 ORDER BY sort_order',
        [id]
      );

      // Get filters
      const filters = await pool.query(
        'SELECT * FROM report_filters WHERE template_id = $1',
        [id]
      );

      // Build dynamic query based on template configuration
      // This is a simplified implementation - real version would be more sophisticated
      const selectFields = columns.rows
        .filter(c => c.is_visible)
        .map(c => c.aggregate_function 
          ? `${c.aggregate_function}(${c.field_name}) as ${c.field_name}`
          : c.field_name
        )
        .join(', ');

      // Build WHERE clause from filters
      let whereConditions: string[] = ['tenant_id = $1'];
      let params: any[] = [tenantId];
      let paramIndex = 2;

      if (filter_values) {
        for (const filter of filters.rows) {
          if (filter_values[filter.field_name] !== undefined) {
            whereConditions.push(`${filter.field_name} ${filter.operator} $${paramIndex}`);
            params.push(filter_values[filter.field_name]);
            paramIndex++;
          }
        }
      }

      // For safety, limit to known tables
      const allowedTables = ['journal_entries', 'chart_of_accounts', 'customers', 'vendors', 'products'];
      if (!allowedTables.includes(template.base_table)) {
        res.status(400).json({ success: false, message: 'Invalid base table' });
        return;
      }

      const query = `
        SELECT ${selectFields || '*'}
        FROM ${template.base_table}
        WHERE ${whereConditions.join(' AND ')}
        ${sort_by ? `ORDER BY ${sort_by} ${sort_order || 'ASC'}` : ''}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Update run count
      await pool.query(`
        UPDATE report_templates
        SET run_count = run_count + 1, last_run_at = NOW()
        WHERE id = $1
      `, [id]);

      res.json({
        success: true,
        data: {
          template_name: template.name,
          columns: columns.rows,
          rows: result.rows,
          total_rows: result.rows.length,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Run report error:', error);
      res.status(500).json({ success: false, message: 'Failed to run report' });
    }
  }

  /**
   * Get report categories
   * GET /api/v2/custom-reports/categories
   */
  static async getCategories(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT DISTINCT category, COUNT(*) as count
        FROM report_templates
        WHERE tenant_id = $1 OR is_shared = true
        GROUP BY category
        ORDER BY category
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        categories: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[CustomReports] Get categories error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }
}

export default CustomReportsControllerV2;
