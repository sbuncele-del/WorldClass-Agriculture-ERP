#!/bin/bash
# Run this script ON the EC2 instance (51.20.92.38)

cat > /tmp/create-admin.js << 'EOFJS'
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'caxMex-0putca-dyjnah',
  database: 'aetheros_erp'
});

async function createAdminUser() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    await client.query(`DELETE FROM users WHERE email = 'admin@worldclass-erp.com'`);
    
    const result = await client.query(`
      INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, name, role
    `, ['admin@worldclass-erp.com', hashedPassword, 'System Administrator', 'admin', true]);

    console.log('✅ Admin user created!');
    console.log('Email: admin@worldclass-erp.com');
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createAdminUser();
EOFJS

cd /home/ubuntu/backend && node /tmp/create-admin.js
