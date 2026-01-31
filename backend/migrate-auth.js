// Simplified Authentication Migration
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

async function runAuthMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating authentication tables...\n');
    
    const schemaSql = fs.readFileSync(path.join(__dirname, 'auth-tables-only.sql'), 'utf8');
    
    await client.query(schemaSql);
    
    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tenants', 'users', 'refresh_tokens', 'audit_log')
      ORDER BY table_name
    `);
    
    console.log('✅ Authentication tables created:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
    console.log('\n════════════════════════════════════════');
    console.log('   ✅ MIGRATION COMPLETE!');
    console.log('   You can now sign up!');
    console.log('════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runAuthMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
