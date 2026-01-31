import { Pool } from 'pg';

export async function runCustomReportsMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('📊 Running Custom Reports migration...');
    
    // Create report_templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        data_source VARCHAR(100) NOT NULL,
        query_config JSONB NOT NULL DEFAULT '{}',
        is_favorite BOOLEAN DEFAULT false,
        is_shared BOOLEAN DEFAULT false,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_run_at TIMESTAMP,
        run_count INTEGER DEFAULT 0
      );
    `);
    console.log('   ✅ report_templates table created');

    // Create report_columns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_columns (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) DEFAULT 'string',
        format_mask VARCHAR(100),
        width INTEGER DEFAULT 100,
        alignment VARCHAR(20) DEFAULT 'left',
        is_visible BOOLEAN DEFAULT true,
        sort_order INTEGER,
        sort_direction VARCHAR(10),
        aggregate_function VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ report_columns table created');

    // Create report_filters table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_filters (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        operator VARCHAR(50) NOT NULL,
        value_type VARCHAR(50) DEFAULT 'static',
        static_value TEXT,
        default_value TEXT,
        is_required BOOLEAN DEFAULT false,
        is_visible BOOLEAN DEFAULT true,
        filter_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ report_filters table created');

    // Create report_groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_groups (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        group_order INTEGER NOT NULL,
        show_subtotals BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ report_groups table created');

    // Create report_schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_schedules (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        schedule_config JSONB NOT NULL DEFAULT '{}',
        output_format VARCHAR(20) DEFAULT 'PDF',
        email_recipients TEXT[],
        is_active BOOLEAN DEFAULT true,
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ report_schedules table created');

    // Create report_executions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_executions (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE SET NULL,
        executed_by INTEGER,
        execution_params JSONB,
        row_count INTEGER,
        execution_time_ms INTEGER,
        output_format VARCHAR(20),
        output_path TEXT,
        status VARCHAR(50) DEFAULT 'SUCCESS',
        error_message TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ report_executions table created');

    // Create report_favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_favorites (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES report_templates(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(template_id, user_id)
      );
    `);
    console.log('   ✅ report_favorites table created');

    console.log('📇 Creating indexes...');
    
    // Indexes for report_templates
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
      CREATE INDEX IF NOT EXISTS idx_report_templates_data_source ON report_templates(data_source);
      CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by);
      CREATE INDEX IF NOT EXISTS idx_report_templates_is_shared ON report_templates(is_shared);
      CREATE INDEX IF NOT EXISTS idx_report_templates_code ON report_templates(code);
    `);

    // Indexes for report_columns
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_columns_template_id ON report_columns(template_id);
      CREATE INDEX IF NOT EXISTS idx_report_columns_sort_order ON report_columns(template_id, sort_order);
    `);

    // Indexes for report_filters
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_filters_template_id ON report_filters(template_id);
      CREATE INDEX IF NOT EXISTS idx_report_filters_field_name ON report_filters(field_name);
    `);

    // Indexes for report_groups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_groups_template_id ON report_groups(template_id);
      CREATE INDEX IF NOT EXISTS idx_report_groups_order ON report_groups(template_id, group_order);
    `);

    // Indexes for report_schedules
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_schedules_template_id ON report_schedules(template_id);
      CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);
      CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;
    `);

    // Indexes for report_executions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_executions_template_id ON report_executions(template_id);
      CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions(executed_by);
      CREATE INDEX IF NOT EXISTS idx_report_executions_executed_at ON report_executions(executed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
    `);

    // Indexes for report_favorites
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_favorites_user_id ON report_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_report_favorites_template_id ON report_favorites(template_id);
    `);

    console.log('   ✅ All indexes created');

    // Create view for report templates with column/filter counts
    console.log('👁️  Creating views...');
    await client.query(`
      CREATE OR REPLACE VIEW report_templates_summary AS
      SELECT 
        rt.*,
        COUNT(DISTINCT rc.id) as column_count,
        COUNT(DISTINCT rf.id) as filter_count,
        COUNT(DISTINCT rg.id) as group_count,
        COUNT(DISTINCT rs.id) as schedule_count,
        MAX(re.executed_at) as last_executed_at,
        COUNT(DISTINCT re.id) as execution_count
      FROM report_templates rt
      LEFT JOIN report_columns rc ON rt.id = rc.template_id
      LEFT JOIN report_filters rf ON rt.id = rf.template_id
      LEFT JOIN report_groups rg ON rt.id = rg.template_id
      LEFT JOIN report_schedules rs ON rt.id = rs.template_id
      LEFT JOIN report_executions re ON rt.id = re.template_id
      GROUP BY rt.id;
    `);
    console.log('   ✅ report_templates_summary view created');

    // Create view for popular reports
    await client.query(`
      CREATE OR REPLACE VIEW popular_reports AS
      SELECT 
        rt.id,
        rt.code,
        rt.name,
        rt.category,
        rt.run_count,
        COUNT(DISTINCT rf.user_id) as favorite_count,
        COUNT(DISTINCT re.id) as execution_count,
        MAX(re.executed_at) as last_executed_at
      FROM report_templates rt
      LEFT JOIN report_favorites rf ON rt.id = rf.template_id
      LEFT JOIN report_executions re ON rt.id = re.template_id
      WHERE rt.is_shared = true
      GROUP BY rt.id, rt.code, rt.name, rt.category, rt.run_count
      ORDER BY rt.run_count DESC, favorite_count DESC
      LIMIT 20;
    `);
    console.log('   ✅ popular_reports view created');

    // Insert sample report templates
    console.log('📝 Inserting sample report templates...');
    
    // Check if sample templates already exist
    const existingTemplates = await client.query('SELECT COUNT(*) as count FROM report_templates');
    if (parseInt(existingTemplates.rows[0].count) > 0) {
      console.log('   ℹ️  Sample templates already exist, skipping...');
    } else {
      // 1. General Ledger Report
      const glTemplate = await client.query(`
      INSERT INTO report_templates (code, name, description, category, data_source, query_config, is_shared)
      VALUES (
        'GL_DETAIL',
        'General Ledger Detail',
        'Detailed general ledger report with all transactions',
        'Accounting',
        'journal_entries',
        '{"base_table": "journal_entry_lines", "joins": ["journal_entries", "chart_of_accounts"]}'::jsonb,
        true
      )
      RETURNING id;
    `);
    const glTemplateId = glTemplate.rows[0].id;

    // Add columns for GL report
    await client.query(`
      INSERT INTO report_columns (template_id, field_name, display_name, data_type, width, sort_order, alignment)
      VALUES 
        ($1, 'entry_date', 'Date', 'date', 100, 1, 'left'),
        ($1, 'reference', 'Reference', 'string', 120, 2, 'left'),
        ($1, 'account_code', 'Account', 'string', 100, 3, 'left'),
        ($1, 'account_name', 'Account Name', 'string', 200, 4, 'left'),
        ($1, 'description', 'Description', 'string', 250, 5, 'left'),
        ($1, 'debit', 'Debit', 'currency', 120, 6, 'right'),
        ($1, 'credit', 'Credit', 'currency', 120, 7, 'right'),
        ($1, 'balance', 'Balance', 'currency', 120, 8, 'right')
    `, [glTemplateId]);

    // 2. Trial Balance Report
    const tbTemplate = await client.query(`
      INSERT INTO report_templates (code, name, description, category, data_source, query_config, is_shared)
      VALUES (
        'TRIAL_BALANCE',
        'Trial Balance',
        'Account balances with debits and credits',
        'Accounting',
        'account_balances',
        '{"base_table": "account_balances", "joins": ["chart_of_accounts"]}'::jsonb,
        true
      )
      RETURNING id;
    `);
    const tbTemplateId = tbTemplate.rows[0].id;

    // Add columns for Trial Balance
    await client.query(`
      INSERT INTO report_columns (template_id, field_name, display_name, data_type, width, sort_order, alignment, aggregate_function)
      VALUES 
        ($1, 'account_code', 'Account Code', 'string', 120, 1, 'left', null),
        ($1, 'account_name', 'Account Name', 'string', 250, 2, 'left', null),
        ($1, 'debit_total', 'Debit', 'currency', 150, 3, 'right', 'SUM'),
        ($1, 'credit_total', 'Credit', 'currency', 150, 4, 'right', 'SUM'),
        ($1, 'balance', 'Balance', 'currency', 150, 5, 'right', 'SUM')
    `, [tbTemplateId]);

    // 3. Budget vs Actual Report
    const budgetTemplate = await client.query(`
      INSERT INTO report_templates (code, name, description, category, data_source, query_config, is_shared)
      VALUES (
        'BUDGET_VS_ACTUAL',
        'Budget vs Actual Analysis',
        'Compare budget to actual performance with variances',
        'Budgeting',
        'budgets',
        '{"base_table": "budget_lines", "joins": ["budgets", "chart_of_accounts", "budget_actuals"]}'::jsonb,
        true
      )
      RETURNING id;
    `);
    const budgetTemplateId = budgetTemplate.rows[0].id;

    // Add columns for Budget vs Actual
    await client.query(`
      INSERT INTO report_columns (template_id, field_name, display_name, data_type, width, sort_order, alignment, aggregate_function)
      VALUES 
        ($1, 'account_code', 'Account', 'string', 100, 1, 'left', null),
        ($1, 'account_name', 'Description', 'string', 200, 2, 'left', null),
        ($1, 'budgeted', 'Budget', 'currency', 130, 3, 'right', 'SUM'),
        ($1, 'actual', 'Actual', 'currency', 130, 4, 'right', 'SUM'),
        ($1, 'variance', 'Variance', 'currency', 130, 5, 'right', 'SUM'),
        ($1, 'variance_pct', 'Variance %', 'percentage', 100, 6, 'right', null)
    `, [budgetTemplateId]);

      console.log('   ✅ Sample templates created');
    }

    console.log('✅ Custom Reports migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running Custom Reports migration:', error);
    throw error;
  } finally {
    client.release();
  }
}
