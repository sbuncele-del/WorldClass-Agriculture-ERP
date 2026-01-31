/**
 * Period Management Migration
 * Creates tables for fiscal years and accounting periods
 */

import { query } from './database';

async function createPeriodTables() {
  console.log('🗓️  Creating period management tables...');

  try {
    console.log('✅ Database connected');

    // Create fiscal_years table
    await query(`
      CREATE TABLE IF NOT EXISTS fiscal_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        year_code VARCHAR(20) UNIQUE NOT NULL,
        year_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        is_current BOOLEAN DEFAULT false,
        number_of_periods INTEGER NOT NULL DEFAULT 12,
        period_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
        description TEXT,
        closed_at TIMESTAMP,
        closed_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100),
        CONSTRAINT chk_fiscal_year_status CHECK (status IN ('OPEN', 'CLOSED', 'LOCKED')),
        CONSTRAINT chk_period_type CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'CUSTOM')),
        CONSTRAINT chk_fiscal_year_dates CHECK (end_date > start_date)
      )
    `);
    console.log('✅ Fiscal years table created');

    // Create accounting_periods table
    await query(`
      CREATE TABLE IF NOT EXISTS accounting_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
        period_number INTEGER NOT NULL,
        period_code VARCHAR(20) UNIQUE NOT NULL,
        period_name VARCHAR(100) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        is_current BOOLEAN DEFAULT false,
        is_adjustment_period BOOLEAN DEFAULT false,
        description TEXT,
        opened_at TIMESTAMP,
        opened_by VARCHAR(100),
        closed_at TIMESTAMP,
        closed_by VARCHAR(100),
        locked_at TIMESTAMP,
        locked_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) NOT NULL,
        updated_by VARCHAR(100),
        CONSTRAINT chk_period_status CHECK (status IN ('FUTURE', 'OPEN', 'CLOSED', 'LOCKED')),
        CONSTRAINT chk_period_dates CHECK (end_date > start_date),
        CONSTRAINT uq_fiscal_year_period UNIQUE (fiscal_year_id, period_number)
      )
    `);
    console.log('✅ Accounting periods table created');

    // Create indexes
    console.log('🔧 Creating indexes...');
    
    await query('CREATE INDEX IF NOT EXISTS idx_fiscal_years_year_code ON fiscal_years(year_code)');
    await query('CREATE INDEX IF NOT EXISTS idx_fiscal_years_status ON fiscal_years(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_fiscal_years_is_current ON fiscal_years(is_current)');
    await query('CREATE INDEX IF NOT EXISTS idx_fiscal_years_dates ON fiscal_years(start_date, end_date)');
    
    await query('CREATE INDEX IF NOT EXISTS idx_periods_fiscal_year ON accounting_periods(fiscal_year_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_periods_period_code ON accounting_periods(period_code)');
    await query('CREATE INDEX IF NOT EXISTS idx_periods_status ON accounting_periods(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_periods_is_current ON accounting_periods(is_current)');
    await query('CREATE INDEX IF NOT EXISTS idx_periods_dates ON accounting_periods(start_date, end_date)');
    
    console.log('✅ All indexes created');

    // Verify tables
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fiscal_years', 'accounting_periods')
      ORDER BY table_name
    `;
    const result = await query(verifyQuery);
    
    console.log('\n✅ Period Management Migration Complete!');
    console.log('📊 Tables created:', result.rows.length);
    result.rows.forEach((row: { table_name: string }) => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error creating period tables:', error);
    throw error;
  }
}

// Run migration
createPeriodTables()
  .then(() => {
    console.log('\n🎉 Period management migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
