const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runFix() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('./fix-database.sql', 'utf8');
    
    console.log('🔧 Running database fixes...');
    await client.query(sql);
    
    console.log('✅ Database fixes applied successfully!');
    
    // Verify
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenant_settings) as tenant_settings_count,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') as has_full_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name='bank_reconciliation_matches' AND column_name='match_status') as has_match_status
    `);
    
    console.log('\n📊 Verification:');
    console.log('   tenant_settings records:', result.rows[0].tenant_settings_count);
    console.log('   users.full_name exists:', result.rows[0].has_full_name === '1' ? 'YES' : 'NO');
    console.log('   bank_reconciliation_matches.match_status exists:', result.rows[0].has_match_status === '1' ? 'YES' : 'NO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runFix();
