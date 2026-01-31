// Complete Database Migration Script - Creates all tables including auth
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
  port: 5432,
  database: 'aetheros_erp',
  user: 'postgres',
  password: 'caxMex-0putca-dyjnah',
  ssl: { rejectUnauthorized: false }
});

async function runFullMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting FULL database migration...\n');
    
    // Read the complete schema SQL file
    const schemaPath = path.join(__dirname, 'src/config/multi-tenant-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating complete multi-tenant schema...');
    await client.query(schemaSql);
    console.log('✅ Multi-tenant schema created\n');
    
    // Verify critical tables
    console.log('🔍 Verifying authentication tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tenants', 'users', 'refresh_tokens', 'audit_log')
      ORDER BY table_name
    `);
    
    console.log('\n✅ Authentication tables:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    console.log('\n════════════════════════════════════════');
    console.log('   ✅ FULL MIGRATION COMPLETE!');
    console.log('   You can now sign up and log in');
    console.log('════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runFullMigration()
  .then(() => {
    console.log('🎉 Database is ready for authentication!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
