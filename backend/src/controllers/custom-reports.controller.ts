import { Request, Response } from 'express';
import pool from '../config/database';

// Get all report templates with optional filters
export const getReportTemplates = async (req: Request, res: Response) => {
  try {
    const { category, is_shared, is_favorite, search } = req.query;
    
    let query = 'SELECT * FROM report_templates_summary WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (is_shared !== undefined) {
      query += ` AND is_shared = $${paramIndex}`;
      params.push(is_shared === 'true');
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY run_count DESC, name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ error: 'Failed to fetch report templates' });
  }
};

// Get single report template with all details
export const getReportTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const templateResult = await pool.query(
      'SELECT * FROM report_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report template not found' });
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
      ...template,
      columns: columnsResult.rows,
      filters: filtersResult.rows,
      groups: groupsResult.rows
    });
  } catch (error) {
    console.error('Error fetching report template:', error);
    res.status(500).json({ error: 'Failed to fetch report template' });
  }
};

// Create new report template
export const createReportTemplate = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      code,
      name,
      description,
      category,
      data_source,
      query_config,
      is_shared,
      columns,
      filters,
      groups
    } = req.body;

    // Insert template
    const templateResult = await client.query(
      `INSERT INTO report_templates (code, name, description, category, data_source, query_config, is_shared, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [code, name, description, category, data_source, query_config || {}, is_shared || false, req.body.user_id || 1]
    );

    const template = templateResult.rows[0];

    // Insert columns
    if (columns && columns.length > 0) {
      for (const column of columns) {
        await client.query(
          `INSERT INTO report_columns (template_id, field_name, display_name, data_type, format_mask, width, alignment, is_visible, sort_order, sort_direction, aggregate_function)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            template.id,
            column.field_name,
            column.display_name,
            column.data_type || 'string',
            column.format_mask,
            column.width || 100,
            column.alignment || 'left',
            column.is_visible !== false,
            column.sort_order,
            column.sort_direction,
            column.aggregate_function
          ]
        );
      }
    }

    // Insert filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        await client.query(
          `INSERT INTO report_filters (template_id, field_name, operator, value_type, static_value, default_value, is_required, is_visible, filter_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            template.id,
            filter.field_name,
            filter.operator,
            filter.value_type || 'static',
            filter.static_value,
            filter.default_value,
            filter.is_required || false,
            filter.is_visible !== false,
            filter.filter_order
          ]
        );
      }
    }

    // Insert groups
    if (groups && groups.length > 0) {
      for (const group of groups) {
        await client.query(
          `INSERT INTO report_groups (template_id, field_name, group_order, show_subtotals)
           VALUES ($1, $2, $3, $4)`,
          [template.id, group.field_name, group.group_order, group.show_subtotals || false]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Report template created successfully', template });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating report template:', error);
    res.status(500).json({ error: 'Failed to create report template' });
  } finally {
    client.release();
  }
};

// Update report template
export const updateReportTemplate = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      name,
      description,
      category,
      data_source,
      query_config,
      is_shared,
      is_favorite,
      columns,
      filters,
      groups
    } = req.body;

    // Update template
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(description);
      paramIndex++;
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      updateValues.push(category);
      paramIndex++;
    }
    if (data_source !== undefined) {
      updateFields.push(`data_source = $${paramIndex}`);
      updateValues.push(data_source);
      paramIndex++;
    }
    if (query_config !== undefined) {
      updateFields.push(`query_config = $${paramIndex}`);
      updateValues.push(query_config);
      paramIndex++;
    }
    if (is_shared !== undefined) {
      updateFields.push(`is_shared = $${paramIndex}`);
      updateValues.push(is_shared);
      paramIndex++;
    }
    if (is_favorite !== undefined) {
      updateFields.push(`is_favorite = $${paramIndex}`);
      updateValues.push(is_favorite);
      paramIndex++;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);

    if (updateFields.length > 1) {
      await client.query(
        `UPDATE report_templates SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );
    }

    // Update columns if provided
    if (columns !== undefined) {
      // Delete existing columns
      await client.query('DELETE FROM report_columns WHERE template_id = $1', [id]);
      
      // Insert new columns
      if (columns.length > 0) {
        for (const column of columns) {
          await client.query(
            `INSERT INTO report_columns (template_id, field_name, display_name, data_type, format_mask, width, alignment, is_visible, sort_order, sort_direction, aggregate_function)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              id,
              column.field_name,
              column.display_name,
              column.data_type || 'string',
              column.format_mask,
              column.width || 100,
              column.alignment || 'left',
              column.is_visible !== false,
              column.sort_order,
              column.sort_direction,
              column.aggregate_function
            ]
          );
        }
      }
    }

    // Update filters if provided
    if (filters !== undefined) {
      await client.query('DELETE FROM report_filters WHERE template_id = $1', [id]);
      
      if (filters.length > 0) {
        for (const filter of filters) {
          await client.query(
            `INSERT INTO report_filters (template_id, field_name, operator, value_type, static_value, default_value, is_required, is_visible, filter_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              id,
              filter.field_name,
              filter.operator,
              filter.value_type || 'static',
              filter.static_value,
              filter.default_value,
              filter.is_required || false,
              filter.is_visible !== false,
              filter.filter_order
            ]
          );
        }
      }
    }

    // Update groups if provided
    if (groups !== undefined) {
      await client.query('DELETE FROM report_groups WHERE template_id = $1', [id]);
      
      if (groups.length > 0) {
        for (const group of groups) {
          await client.query(
            `INSERT INTO report_groups (template_id, field_name, group_order, show_subtotals)
             VALUES ($1, $2, $3, $4)`,
            [id, group.field_name, group.group_order, group.show_subtotals || false]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Report template updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating report template:', error);
    res.status(500).json({ error: 'Failed to update report template' });
  } finally {
    client.release();
  }
};

// Delete report template
export const deleteReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM report_templates WHERE id = $1', [id]);
    res.json({ message: 'Report template deleted successfully' });
  } catch (error) {
    console.error('Error deleting report template:', error);
    res.status(500).json({ error: 'Failed to delete report template' });
  }
};

// Clone report template
export const cloneReportTemplate = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { new_name, new_code } = req.body;

    // Get original template
    const originalTemplate = await client.query(
      'SELECT * FROM report_templates WHERE id = $1',
      [id]
    );

    if (originalTemplate.rows.length === 0) {
      return res.status(404).json({ error: 'Report template not found' });
    }

    const template = originalTemplate.rows[0];

    // Create new template
    const newTemplate = await client.query(
      `INSERT INTO report_templates (code, name, description, category, data_source, query_config, is_shared, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        new_code || `${template.code}_COPY`,
        new_name || `${template.name} (Copy)`,
        template.description,
        template.category,
        template.data_source,
        template.query_config,
        false, // Clones are private by default
        req.body.user_id || 1
      ]
    );

    const newTemplateId = newTemplate.rows[0].id;

    // Clone columns
    await client.query(
      `INSERT INTO report_columns (template_id, field_name, display_name, data_type, format_mask, width, alignment, is_visible, sort_order, sort_direction, aggregate_function)
       SELECT $1, field_name, display_name, data_type, format_mask, width, alignment, is_visible, sort_order, sort_direction, aggregate_function
       FROM report_columns WHERE template_id = $2`,
      [newTemplateId, id]
    );

    // Clone filters
    await client.query(
      `INSERT INTO report_filters (template_id, field_name, operator, value_type, static_value, default_value, is_required, is_visible, filter_order)
       SELECT $1, field_name, operator, value_type, static_value, default_value, is_required, is_visible, filter_order
       FROM report_filters WHERE template_id = $2`,
      [newTemplateId, id]
    );

    // Clone groups
    await client.query(
      `INSERT INTO report_groups (template_id, field_name, group_order, show_subtotals)
       SELECT $1, field_name, group_order, show_subtotals
       FROM report_groups WHERE template_id = $2`,
      [newTemplateId, id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Report template cloned successfully', template: newTemplate.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cloning report template:', error);
    res.status(500).json({ error: 'Failed to clone report template' });
  } finally {
    client.release();
  }
};

// Execute report and return data
export const executeReport = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const params = req.body.params || {};
    const startTime = Date.now();

    // Get template with columns and filters
    const templateResult = await client.query(
      'SELECT * FROM report_templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report template not found' });
    }

    const template = templateResult.rows[0];

    // Get columns
    const columnsResult = await client.query(
      'SELECT * FROM report_columns WHERE template_id = $1 AND is_visible = true ORDER BY sort_order',
      [id]
    );

    // Get filters
    const filtersResult = await client.query(
      'SELECT * FROM report_filters WHERE template_id = $1 ORDER BY filter_order',
      [id]
    );

    // Build dynamic SQL query based on data source
    let query = buildReportQuery(template, columnsResult.rows, filtersResult.rows, params);

    // Execute query
    const dataResult = await client.query(query.sql, query.params);

    const executionTime = Date.now() - startTime;

    // Log execution
    await client.query(
      `INSERT INTO report_executions (template_id, executed_by, execution_params, row_count, execution_time_ms, output_format, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.body.user_id || 1, params, dataResult.rows.length, executionTime, 'JSON', 'SUCCESS']
    );

    // Update run count
    await client.query(
      'UPDATE report_templates SET run_count = run_count + 1, last_run_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      template: {
        id: template.id,
        name: template.name,
        code: template.code
      },
      columns: columnsResult.rows,
      data: dataResult.rows,
      row_count: dataResult.rows.length,
      execution_time_ms: executionTime
    });
  } catch (error) {
    console.error('Error executing report:', error);
    
    // Log failed execution
    await client.query(
      `INSERT INTO report_executions (template_id, executed_by, execution_params, status, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, req.body.user_id || 1, req.body.params || {}, 'FAILED', (error as Error).message]
    );
    
    res.status(500).json({ error: 'Failed to execute report', details: (error as Error).message });
  } finally {
    client.release();
  }
};

// Build dynamic SQL query
function buildReportQuery(template: any, columns: any[], filters: any[], params: any) {
  const dataSource = template.data_source;
  const queryConfig = template.query_config || {};
  
  // Select columns
  const selectFields = columns.map(col => {
    if (col.aggregate_function) {
      return `${col.aggregate_function}(${col.field_name}) as ${col.field_name}`;
    }
    return col.field_name;
  }).join(', ');

  let sql = `SELECT ${selectFields} FROM ${dataSource}`;

  // Add joins based on data source
  if (dataSource === 'journal_entry_lines') {
    sql += ` 
      LEFT JOIN journal_entries je ON journal_entry_lines.entry_id = je.entry_id
      LEFT JOIN chart_of_accounts coa ON journal_entry_lines.account_code = coa.code
    `;
  } else if (dataSource === 'budget_lines') {
    sql += `
      LEFT JOIN budgets b ON budget_lines.budget_id = b.id
      LEFT JOIN chart_of_accounts coa ON budget_lines.account_code = coa.code
      LEFT JOIN budget_actuals ba ON budget_lines.id = ba.budget_line_id
    `;
  } else if (dataSource === 'account_balances') {
    sql += `
      LEFT JOIN chart_of_accounts coa ON account_balances.account_code = coa.code
    `;
  }

  // Add WHERE clause from filters
  const whereConditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  for (const filter of filters) {
    if (params[filter.field_name] !== undefined) {
      const value = params[filter.field_name];
      
      switch (filter.operator) {
        case 'equals':
          whereConditions.push(`${filter.field_name} = $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
          break;
        case 'not_equals':
          whereConditions.push(`${filter.field_name} != $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
          break;
        case 'greater_than':
          whereConditions.push(`${filter.field_name} > $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
          break;
        case 'less_than':
          whereConditions.push(`${filter.field_name} < $${paramIndex}`);
          queryParams.push(value);
          paramIndex++;
          break;
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            whereConditions.push(`${filter.field_name} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
            queryParams.push(value[0], value[1]);
            paramIndex += 2;
          }
          break;
        case 'in':
          if (Array.isArray(value)) {
            whereConditions.push(`${filter.field_name} = ANY($${paramIndex})`);
            queryParams.push(value);
            paramIndex++;
          }
          break;
        case 'like':
          whereConditions.push(`${filter.field_name} ILIKE $${paramIndex}`);
          queryParams.push(`%${value}%`);
          paramIndex++;
          break;
      }
    } else if (filter.default_value && filter.is_required) {
      whereConditions.push(`${filter.field_name} = $${paramIndex}`);
      queryParams.push(filter.default_value);
      paramIndex++;
    }
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  // Add ORDER BY
  const sortColumns = columns.filter(col => col.sort_direction);
  if (sortColumns.length > 0) {
    const orderBy = sortColumns
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(col => `${col.field_name} ${col.sort_direction}`)
      .join(', ');
    sql += ` ORDER BY ${orderBy}`;
  }

  return { sql, params: queryParams };
}

// Get report categories
export const getReportCategories = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM report_templates WHERE category IS NOT NULL ORDER BY category'
    );
    res.json(result.rows.map(row => row.category));
  } catch (error) {
    console.error('Error fetching report categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get popular reports
export const getPopularReports = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM popular_reports LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching popular reports:', error);
    res.status(500).json({ error: 'Failed to fetch popular reports' });
  }
};

// Get report execution history
export const getReportExecutions = async (req: Request, res: Response) => {
  try {
    const { template_id } = req.query;
    
    let query = `
      SELECT re.*, rt.name as template_name, rt.code as template_code
      FROM report_executions re
      LEFT JOIN report_templates rt ON re.template_id = rt.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (template_id) {
      query += ' AND re.template_id = $1';
      params.push(template_id);
    }

    query += ' ORDER BY re.executed_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching report executions:', error);
    res.status(500).json({ error: 'Failed to fetch execution history' });
  }
};

// Toggle favorite
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    // Check if already favorited
    const existing = await pool.query(
      'SELECT id FROM report_favorites WHERE template_id = $1 AND user_id = $2',
      [id, user_id || 1]
    );

    if (existing.rows.length > 0) {
      // Remove favorite
      await pool.query(
        'DELETE FROM report_favorites WHERE template_id = $1 AND user_id = $2',
        [id, user_id || 1]
      );
      res.json({ message: 'Removed from favorites', is_favorite: false });
    } else {
      // Add favorite
      await pool.query(
        'INSERT INTO report_favorites (template_id, user_id) VALUES ($1, $2)',
        [id, user_id || 1]
      );
      res.json({ message: 'Added to favorites', is_favorite: true });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};
