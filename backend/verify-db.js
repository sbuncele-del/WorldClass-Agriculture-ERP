const { Pool } = require('pg');

const pool = new Pool({
  host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
  port: 5432,
  database: 'aetheros_erp',
  user: 'postgres',
  password: 'caxMex-0putca-dyjnah',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyDatabase() {
  try {
    console.log('🔍 Connecting to RDS...');
    await pool.query('SELECT 1');
    console.log('✅ Connected successfully!\n');

    console.log('📊 Checking schemas...');
    const schemas = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('sales', 'logistics', 'financial')
      ORDER BY schema_name
    `);
    console.log('Schemas found:', schemas.rows.length);
    schemas.rows.forEach(row => console.log('  -', row.schema_name));
    console.log('');

    console.log('📋 Checking tables...');
    const tables = await pool.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('sales', 'logistics', 'financial')
      ORDER BY schemaname, tablename
    `);
    console.log('Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log(`  - ${row.schemaname}.${row.tablename}`));
    console.log('');

    if (tables.rows.length > 0) {
      console.log('👥 Checking customers...');
      const customers = await pool.query('SELECT * FROM sales.customers');
      console.log('Customers found:', customers.rows.length);
      customers.rows.forEach(row => {
        console.log(`  - ${row.company_name} (${row.contact_person})`);
      });
      console.log('');
    }

    console.log('🎉 Database verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   Database host not found. Check DNS/connectivity.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused. Check firewall/security groups.');
    } else if (error.code === '28P01') {
      console.error('   Authentication failed. Check username/password.');
    }
  } finally {
    await pool.end();
  }
}

verifyDatabase();
