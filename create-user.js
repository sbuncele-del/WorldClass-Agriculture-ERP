const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'aetheros-erp-db.cn8kz7dqxliu.eu-north-1.rds.amazonaws.com',
  port: 5432,
  database: 'aetheros_erp',
  user: 'aetheros_admin',
  password: 'AetherOS2024!SecureDB',
  ssl: { rejectUnauthorized: false }
});

async function createTestUser() {
  try {
    console.log('Connecting to database...');
    
    const tenantResult = await pool.query(
      "INSERT INTO tenants (tenant_name, slug, subscription_plan, status) VALUES ('Worldclass ERP', 'worldclass', 'professional', 'active') ON CONFLICT (slug) DO UPDATE SET tenant_name = 'Worldclass ERP' RETURNING tenant_id"
    );
    const tenantId = tenantResult.rows[0].tenant_id;
    console.log('Tenant ID:', tenantId);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Password hashed');
    
    const userResult = await pool.query(
      "INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active) VALUES ($1, 'admin@worldclass.com', $2, 'Admin', 'User', 'admin', true) ON CONFLICT (email) DO UPDATE SET password_hash = $2, tenant_id = $1 RETURNING user_id, email",
      [tenantId, hashedPassword]
    );
    
    console.log('\n✅ SUCCESS! User created/updated');
    console.log('User ID:', userResult.rows[0].user_id);
    console.log('Email:', userResult.rows[0].email);
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Email: admin@worldclass.com');
    console.log('Password: admin123');
    console.log('\nGo to http://51.21.219.35/login');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    await pool.end();
  }
}

createTestUser();
