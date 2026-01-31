import { Pool } from 'pg';

export async function runFinancialForecastingMigration(pool: Pool): Promise<void> {
  console.log('🔮 Running Financial Forecasting migration...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Budget Scenarios Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_scenarios (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        scenario_type VARCHAR(50) NOT NULL DEFAULT 'BASELINE', -- BASELINE, OPTIMISTIC, PESSIMISTIC, WORST_CASE, CUSTOM
        fiscal_year INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, ACTIVE, ARCHIVED
        is_active BOOLEAN DEFAULT false,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ budget_scenarios table created');

    // 2. Budgets Table (Master)
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        scenario_id INTEGER REFERENCES budget_scenarios(id) ON DELETE CASCADE,
        budget_code VARCHAR(50) UNIQUE NOT NULL,
        budget_name VARCHAR(255) NOT NULL,
        description TEXT,
        budget_type VARCHAR(50) NOT NULL DEFAULT 'ANNUAL', -- ANNUAL, QUARTERLY, MONTHLY, PROJECT
        fiscal_year INTEGER NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        department VARCHAR(100),
        cost_center_id INTEGER,
        project_id INTEGER,
        currency VARCHAR(3) DEFAULT 'ZAR',
        total_budget_amount DECIMAL(15, 2) DEFAULT 0,
        total_actual_amount DECIMAL(15, 2) DEFAULT 0,
        total_variance DECIMAL(15, 2) DEFAULT 0,
        variance_percentage DECIMAL(5, 2) DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, APPROVED, ACTIVE, CLOSED, REVISED
        version INTEGER DEFAULT 1,
        parent_budget_id INTEGER REFERENCES budgets(id),
        is_template BOOLEAN DEFAULT false,
        created_by VARCHAR(100),
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        last_reviewed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ budgets table created');

    // 3. Budget Lines Table (Detail)
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_lines (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        account_code VARCHAR(50) NOT NULL,
        account_name VARCHAR(255),
        line_description TEXT,
        period_type VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, QUARTERLY, ANNUAL
        
        -- Monthly breakdown (12 months)
        month_1 DECIMAL(15, 2) DEFAULT 0,
        month_2 DECIMAL(15, 2) DEFAULT 0,
        month_3 DECIMAL(15, 2) DEFAULT 0,
        month_4 DECIMAL(15, 2) DEFAULT 0,
        month_5 DECIMAL(15, 2) DEFAULT 0,
        month_6 DECIMAL(15, 2) DEFAULT 0,
        month_7 DECIMAL(15, 2) DEFAULT 0,
        month_8 DECIMAL(15, 2) DEFAULT 0,
        month_9 DECIMAL(15, 2) DEFAULT 0,
        month_10 DECIMAL(15, 2) DEFAULT 0,
        month_11 DECIMAL(15, 2) DEFAULT 0,
        month_12 DECIMAL(15, 2) DEFAULT 0,
        
        -- Quarterly totals
        q1_total DECIMAL(15, 2) GENERATED ALWAYS AS (month_1 + month_2 + month_3) STORED,
        q2_total DECIMAL(15, 2) GENERATED ALWAYS AS (month_4 + month_5 + month_6) STORED,
        q3_total DECIMAL(15, 2) GENERATED ALWAYS AS (month_7 + month_8 + month_9) STORED,
        q4_total DECIMAL(15, 2) GENERATED ALWAYS AS (month_10 + month_11 + month_12) STORED,
        
        -- Annual total
        annual_total DECIMAL(15, 2) GENERATED ALWAYS AS (
          month_1 + month_2 + month_3 + month_4 + month_5 + month_6 +
          month_7 + month_8 + month_9 + month_10 + month_11 + month_12
        ) STORED,
        
        -- Actuals tracking
        actual_ytd DECIMAL(15, 2) DEFAULT 0,
        variance_ytd DECIMAL(15, 2) DEFAULT 0,
        variance_percentage DECIMAL(5, 2) DEFAULT 0,
        
        -- Allocation settings
        allocation_method VARCHAR(50) DEFAULT 'MANUAL', -- MANUAL, EQUAL, SEASONAL, HISTORICAL
        is_recurring BOOLEAN DEFAULT false,
        
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_budget_account UNIQUE(budget_id, account_code)
      )
    `);
    console.log('   ✅ budget_lines table created');

    // 4. Budget Actuals Cache Table (Performance optimization)
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_actuals (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        account_code VARCHAR(50) NOT NULL,
        period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
        period_year INTEGER NOT NULL,
        period_date DATE NOT NULL,
        
        budgeted_amount DECIMAL(15, 2) DEFAULT 0,
        actual_amount DECIMAL(15, 2) DEFAULT 0,
        variance_amount DECIMAL(15, 2) DEFAULT 0,
        variance_percentage DECIMAL(5, 2) DEFAULT 0,
        
        cumulative_budget DECIMAL(15, 2) DEFAULT 0,
        cumulative_actual DECIMAL(15, 2) DEFAULT 0,
        cumulative_variance DECIMAL(15, 2) DEFAULT 0,
        
        transaction_count INTEGER DEFAULT 0,
        last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_budget_period UNIQUE(budget_id, account_code, period_month, period_year)
      )
    `);
    console.log('   ✅ budget_actuals table created');

    // 5. Forecast Models Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS forecast_models (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        description TEXT,
        model_type VARCHAR(50) NOT NULL, -- LINEAR, EXPONENTIAL, MOVING_AVERAGE, SEASONAL, CUSTOM
        account_code VARCHAR(50) NOT NULL,
        scenario_id INTEGER REFERENCES budget_scenarios(id),
        
        -- Time range
        historical_start_date DATE NOT NULL,
        historical_end_date DATE NOT NULL,
        forecast_start_date DATE NOT NULL,
        forecast_end_date DATE NOT NULL,
        
        -- Model parameters (stored as JSON)
        model_parameters JSONB DEFAULT '{}',
        
        -- Accuracy metrics
        mape DECIMAL(5, 2), -- Mean Absolute Percentage Error
        rmse DECIMAL(15, 2), -- Root Mean Square Error
        r_squared DECIMAL(5, 4), -- R-squared value
        confidence_level DECIMAL(5, 2) DEFAULT 95.0,
        
        -- Results
        forecast_values JSONB, -- Array of {month, value, lower_bound, upper_bound}
        
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ forecast_models table created');

    // 6. Budget Revisions History
    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_revisions (
        id SERIAL PRIMARY KEY,
        budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        revision_number INTEGER NOT NULL,
        revision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revised_by VARCHAR(100),
        revision_reason TEXT,
        
        -- Snapshot of changes
        changes_summary JSONB, -- {field: {old_value, new_value}}
        previous_total DECIMAL(15, 2),
        new_total DECIMAL(15, 2),
        
        approved_by VARCHAR(100),
        approved_at TIMESTAMP,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ budget_revisions table created');

    // Create indexes for performance
    console.log('   📇 Creating indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_scenarios_fiscal_year ON budget_scenarios(fiscal_year);
      CREATE INDEX IF NOT EXISTS idx_budget_scenarios_status ON budget_scenarios(status);
      CREATE INDEX IF NOT EXISTS idx_budget_scenarios_active ON budget_scenarios(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budgets_scenario ON budgets(scenario_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_code ON budgets(budget_code);
      CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
      CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
      CREATE INDEX IF NOT EXISTS idx_budgets_department ON budgets(department);
      CREATE INDEX IF NOT EXISTS idx_budgets_cost_center ON budgets(cost_center_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(period_start, period_end);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
      CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON budget_lines(account_code);
      CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_account ON budget_lines(budget_id, account_code);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_actuals_budget ON budget_actuals(budget_id);
      CREATE INDEX IF NOT EXISTS idx_budget_actuals_account ON budget_actuals(account_code);
      CREATE INDEX IF NOT EXISTS idx_budget_actuals_period ON budget_actuals(period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_budget_actuals_date ON budget_actuals(period_date);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forecast_models_account ON forecast_models(account_code);
      CREATE INDEX IF NOT EXISTS idx_forecast_models_scenario ON forecast_models(scenario_id);
      CREATE INDEX IF NOT EXISTS idx_forecast_models_type ON forecast_models(model_type);
      CREATE INDEX IF NOT EXISTS idx_forecast_models_active ON forecast_models(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_budget_revisions_budget ON budget_revisions(budget_id);
      CREATE INDEX IF NOT EXISTS idx_budget_revisions_date ON budget_revisions(revision_date);
    `);

    console.log('   ✅ All indexes created');

    // Create views for common queries
    console.log('   👁️  Creating views...');

    // Budget Summary View
    await client.query(`
      CREATE OR REPLACE VIEW budget_summary AS
      SELECT 
        b.id,
        b.budget_code,
        b.budget_name,
        b.fiscal_year,
        b.department,
        b.status,
        bs.name as scenario_name,
        bs.scenario_type,
        COUNT(DISTINCT bl.id) as line_count,
        SUM(bl.annual_total) as total_budgeted,
        SUM(bl.actual_ytd) as total_actual,
        SUM(bl.variance_ytd) as total_variance,
        CASE 
          WHEN SUM(bl.annual_total) > 0 
          THEN (SUM(bl.variance_ytd) / SUM(bl.annual_total) * 100)
          ELSE 0 
        END as variance_percentage,
        b.created_at,
        b.updated_at
      FROM budgets b
      LEFT JOIN budget_scenarios bs ON b.scenario_id = bs.id
      LEFT JOIN budget_lines bl ON b.id = bl.budget_id
      GROUP BY b.id, b.budget_code, b.budget_name, b.fiscal_year, 
               b.department, b.status, bs.name, bs.scenario_type, 
               b.created_at, b.updated_at
    `);
    console.log('   ✅ budget_summary view created');

    // Variance Analysis View
    await client.query(`
      CREATE OR REPLACE VIEW variance_analysis AS
      SELECT 
        bl.id,
        bl.budget_id,
        b.budget_code,
        b.budget_name,
        bl.account_code,
        bl.account_name,
        bl.annual_total as budgeted_amount,
        bl.actual_ytd as actual_amount,
        bl.variance_ytd as variance_amount,
        bl.variance_percentage,
        CASE 
          WHEN bl.variance_ytd > 0 THEN 'OVER_BUDGET'
          WHEN bl.variance_ytd < 0 THEN 'UNDER_BUDGET'
          ELSE 'ON_BUDGET'
        END as variance_status,
        CASE 
          WHEN ABS(bl.variance_percentage) > 20 THEN 'CRITICAL'
          WHEN ABS(bl.variance_percentage) > 10 THEN 'WARNING'
          ELSE 'NORMAL'
        END as variance_severity
      FROM budget_lines bl
      JOIN budgets b ON bl.budget_id = b.id
      WHERE b.status = 'ACTIVE'
    `);
    console.log('   ✅ variance_analysis view created');

    await client.query('COMMIT');
    console.log('✅ Financial Forecasting migration completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in Financial Forecasting migration:', error);
    throw error;
  } finally {
    client.release();
  }
}
