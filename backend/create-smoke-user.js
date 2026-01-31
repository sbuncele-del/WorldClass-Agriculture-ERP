const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createUser() {
  const hash = await bcrypt.hash('SmokeTest2025!', 10);
  console.log('Hash generated:', hash.substring(0, 20) + '...');
  
  const client = new Client({
    host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
    user: 'postgres',
    password: 'caxMex-0putca-dyjnah',
    database: 'aetheros_erp'
  });
  await client.connect();
  console.log('Connected to database');
  
  const result = await client.query(
    `INSERT INTO users(email, password_hash, first_name, last_name, role, tenant_id, status) 
     VALUES($1, $2, $3, $4, $5, 1, $6) 
     ON CONFLICT(email) DO UPDATE SET password_hash = $2 
     RETURNING id, email`,
    ['smoke-test@worldclass.co.za', hash, 'Smoke', 'Test', 'admin', 'active']
  );
  console.log('User created:', JSON.stringify(result.rows));
  await client.end();
}
createUser().catch(e => console.error('Error:', e.message));
