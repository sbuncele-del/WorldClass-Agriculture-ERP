const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'caxMex-0putca-dyjnah',
  database: 'aetheros_erp',
  ssl: { rejectUnauthorized: false }
});

async function createAdminUser() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('✗ Users table does not exist');
      process.exit(1);
    }
    console.log('✓ Users table exists');

    // Check existing users
    const existingUsers = await client.query('SELECT email, role FROM users');
    console.log(`\n📋 Existing users (${existingUsers.rows.length}):`);
    existingUsers.rows.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    // Hash password
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Delete existing admin if exists
    await client.query(`DELETE FROM users WHERE email = 'admin@worldclass-erp.com'`);
    console.log('\n🗑️  Removed old admin user (if existed)');

    // Insert new admin
    const result = await client.query(`
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, name, role
    `, ['admin@worldclass-erp.com', hashedPassword, 'System Administrator', 'admin', true]);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@worldclass-erp.com');
    console.log('   Password: Admin@123');
    console.log('\n📝 User Details:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Name:', result.rows[0].name);
    console.log('   Role:', result.rows[0].role);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
