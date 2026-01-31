import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://worldclass:worldclass123@localhost:5432/worldclass_erp',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function runMultiTenantMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting multi-tenant database migration...\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'multi-tenant-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executing SQL migration script...');
    
    // Execute the entire SQL file
    await client.query(sql);
    
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify migration
    console.log('🔍 Verifying migration...\n');
    
    // Check if tenants table exists
    const tenantsCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'tenants'
    `);
    console.log(`✓ Tenants table exists: ${tenantsCheck.rows[0].count === '1' ? 'YES' : 'NO'}`);
    
    // Check if users table exists
    const usersCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `);
    console.log(`✓ Users table exists: ${usersCheck.rows[0].count === '1' ? 'YES' : 'NO'}`);
    
    // Check if demo tenant was created
    const demoTenantCheck = await client.query(`
      SELECT id, name, slug, status 
      FROM tenants 
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `);
    if (demoTenantCheck.rows.length > 0) {
      const demo = demoTenantCheck.rows[0];
      console.log(`✓ Demo tenant created: ${demo.name} (${demo.slug}) - Status: ${demo.status}`);
    }
    
    // Check if demo user was created
    const demoUserCheck = await client.query(`
      SELECT id, email, role, status 
      FROM users 
      WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
    `);
    if (demoUserCheck.rows.length > 0) {
      const user = demoUserCheck.rows[0];
      console.log(`✓ Demo user created: ${user.email} (${user.role}) - Status: ${user.status}`);
    }
    
    // Check tenant_id columns added
    const columnsCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'tenant_id' 
        AND table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`\n✓ tenant_id column added to ${columnsCheck.rows.length} tables:`);
    columnsCheck.rows.slice(0, 10).forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    if (columnsCheck.rows.length > 10) {
      console.log(`  ... and ${columnsCheck.rows.length - 10} more tables`);
    }
    
    // Check indexes created
    const indexesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE indexname LIKE '%tenant%'
    `);
    console.log(`\n✓ ${indexesCheck.rows[0].count} tenant-related indexes created`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('1. Update backend queries to include tenant_id filtering');
    console.log('2. Implement tenant middleware (src/middleware/tenant.ts)');
    console.log('3. Update all service files to use tenant context');
    console.log('4. Test multi-tenant data isolation\n');
    
    console.log('🔑 Demo Credentials:');
    console.log('   Email: demo@aetheros.co.za');
    console.log('   Password: Demo123!');
    console.log('   Tenant: demo (00000000-0000-0000-0000-000000000001)\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.code) {
      console.error(`Error Code: ${error.code}`);
    }
    
    if (error.position) {
      console.error(`Error Position: ${error.position}`);
    }
    
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  runMultiTenantMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export default runMultiTenantMigration;
