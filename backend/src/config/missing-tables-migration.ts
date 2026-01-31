/**
 * Missing Tables Migration
 * Creates tables and columns needed for cash management features
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_HOST?.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: false
  } : undefined
});

async function migrateMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting missing tables migration...\n');
    
    // ============================================================
    // TABLE 1: tenant_settings
    // Stores reconciliation tolerance settings per tenant
    // ============================================================
    console.log('  📊 Creating tenant_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        
        -- Reconciliation tolerances
        amount_tolerance DECIMAL(15,2) DEFAULT 0.00,
        percentage_tolerance DECIMAL(5,2) DEFAULT 0.00,
        max_difference DECIMAL(15,2) DEFAULT 100.00,
        
        -- Auto-matching settings
        auto_match_enabled BOOLEAN DEFAULT true,
        min_confidence_threshold DECIMAL(3,2) DEFAULT 0.80,
        
        -- Duplicate detection settings
        duplicate_check_enabled BOOLEAN DEFAULT true,
        duplicate_days_range INTEGER DEFAULT 30,
        duplicate_similarity_threshold DECIMAL(3,2) DEFAULT 0.70,
        
        -- General settings
        settings JSONB DEFAULT '{}',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
    `);

    // ============================================================
    // ALTER TABLE: users - Add full_name computed column
    // ============================================================
    console.log('  👤 Adding full_name to users table...');
    
    // Check if column exists
    const checkFullName = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'full_name'
    `);

    if (checkFullName.rowCount === 0) {
      // Add full_name as generated column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN full_name VARCHAR(200) GENERATED ALWAYS AS (
          CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL 
            THEN first_name
            WHEN last_name IS NOT NULL 
            THEN last_name
            ELSE email
          END
        ) STORED
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
      `);
      console.log('    ✅ Added full_name column');
    } else {
      console.log('    ℹ️  full_name column already exists');
    }

    // ============================================================
    // ALTER TABLE: bank_reconciliation_matches - Add match_status
    // ============================================================
    console.log('  🔗 Adding match_status to bank_reconciliation_matches...');
    
    const checkMatchStatus = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bank_reconciliation_matches' AND column_name = 'match_status'
    `);

    if (checkMatchStatus.rowCount === 0) {
      await client.query(`
        ALTER TABLE bank_reconciliation_matches 
        ADD COLUMN match_status VARCHAR(20) DEFAULT 'ACTIVE' 
        CHECK (match_status IN ('ACTIVE', 'PENDING', 'UNMATCHED', 'REVERSED', 'ARCHIVED'))
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_brm_match_status ON bank_reconciliation_matches(match_status);
      `);
      console.log('    ✅ Added match_status column');
    } else {
      console.log('    ℹ️  match_status column already exists');
    }

    // ============================================================
    // ALTER TABLE: bank_statement_lines - Ensure statement_id exists
    // ============================================================
    console.log('  📄 Checking bank_statement_lines.statement_id...');
    
    const checkStatementId = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bank_statement_lines' AND column_name = 'statement_id'
    `);

    if (checkStatementId.rowCount === 0) {
      await client.query(`
        ALTER TABLE bank_statement_lines 
        ADD COLUMN statement_id INTEGER REFERENCES bank_statements(id) ON DELETE CASCADE
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bsl_statement_id ON bank_statement_lines(statement_id);
      `);
      console.log('    ✅ Added statement_id column');
    } else {
      console.log('    ℹ️  statement_id column already exists');
    }

    // ============================================================
    // SEED DEFAULT SETTINGS
    // ============================================================
    console.log('  🌱 Creating default settings for existing tenants...');
    
    await client.query(`
      INSERT INTO tenant_settings (
        tenant_id, 
        amount_tolerance, 
        percentage_tolerance, 
        max_difference
      )
      SELECT 
        id,
        0.05,  -- R0.05 tolerance
        2.00,  -- 2% percentage tolerance
        100.00 -- Max R100 difference
      FROM tenants
      WHERE id NOT IN (SELECT tenant_id FROM tenant_settings)
    `);

    console.log('\n✅ Missing tables migration complete!');
    console.log('   📊 tenant_settings table created');
    console.log('   👤 users.full_name added');
    console.log('   🔗 bank_reconciliation_matches.match_status added');
    console.log('   📄 bank_statement_lines.statement_id verified');
    console.log('   🌱 Default settings seeded');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateMissingTables()
  .then(() => {
    console.log('\n🎉 Migration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
