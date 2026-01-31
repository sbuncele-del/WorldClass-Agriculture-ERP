// Database Migration Script
// Run this on your backend server: node migrate-db.js

const { Pool } = require('pg');

const pool = new Pool({
  host: 'aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com',
  port: 5432,
  database: 'aetheros_erp',
  user: 'postgres',
  password: 'caxMex-0putca-dyjnah',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting database migration...\n');
    
    // Create schemas
    console.log('📁 Creating schemas...');
    await client.query('CREATE SCHEMA IF NOT EXISTS sales');
    await client.query('CREATE SCHEMA IF NOT EXISTS logistics');
    await client.query('CREATE SCHEMA IF NOT EXISTS financial');
    await client.query('CREATE SCHEMA IF NOT EXISTS hr');
    await client.query('CREATE SCHEMA IF NOT EXISTS inventory');
    console.log('✅ Schemas created\n');
    
    // Create sales.customers table
    console.log('📋 Creating sales.customers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.customers (
        customer_id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        vat_number VARCHAR(50),
        customer_type VARCHAR(50),
        source VARCHAR(100),
        created_from_document VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_customers_company_name ON sales.customers(company_name)');
    console.log('✅ sales.customers created\n');
    
    // Create logistics.processed_documents table
    console.log('📋 Creating logistics.processed_documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS logistics.processed_documents (
        document_id SERIAL PRIMARY KEY,
        document_type VARCHAR(50) NOT NULL,
        document_number VARCHAR(100),
        s3_key VARCHAR(500),
        extracted_data JSONB,
        confidence_score DECIMAL(5,2),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_by VARCHAR(100)
      )
    `);
    console.log('✅ logistics.processed_documents created\n');
    
    // Create logistics.loads table
    console.log('📋 Creating logistics.loads table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS logistics.loads (
        load_id SERIAL PRIMARY KEY,
        load_number VARCHAR(100) NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES sales.customers(customer_id),
        load_date DATE,
        offload_date DATE,
        driver_name VARCHAR(255),
        vehicle_registration VARCHAR(50),
        commodity VARCHAR(255),
        rate DECIMAL(10,2),
        rate_type VARCHAR(20),
        quantity DECIMAL(10,4),
        load_value DECIMAL(12,2),
        collection_address TEXT,
        delivery_address TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_loads_load_number ON logistics.loads(load_number)');
    console.log('✅ logistics.loads created\n');
    
    // Create financial.invoices table
    console.log('📋 Creating financial.invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial.invoices (
        invoice_id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        customer_id INTEGER REFERENCES sales.customers(customer_id),
        load_id INTEGER REFERENCES logistics.loads(load_id),
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        reference VARCHAR(255),
        subtotal DECIMAL(12,2) NOT NULL,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        vat_amount DECIMAL(12,2) NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        payment_terms VARCHAR(100),
        status VARCHAR(20) DEFAULT 'draft',
        pdf_s3_key VARCHAR(500),
        sent_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON financial.invoices(invoice_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON financial.invoices(customer_id)');
    console.log('✅ financial.invoices created\n');
    
    // Create financial.invoice_line_items table
    console.log('📋 Creating financial.invoice_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial.invoice_line_items (
        line_item_id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES financial.invoices(invoice_id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        vat_rate DECIMAL(5,2) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ financial.invoice_line_items created\n');
    
    // Insert sample customer
    console.log('👤 Inserting sample customer...');
    const result = await client.query(`
      INSERT INTO sales.customers (company_name, contact_person, email, phone, vat_number, customer_type, source, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING customer_id
    `, [
      '4PL.COM - Logistical Solutions Provider',
      'TAUFEEQ PETERSEN',
      'taufeeq@4pl.com',
      '021-xxx-xxxx',
      '4PL-VAT-12345',
      'logistics_broker',
      'manual',
      'active'
    ]);
    
    if (result.rows.length > 0) {
      console.log(`✅ Sample customer created with ID: ${result.rows[0].customer_id}\n`);
    } else {
      console.log('ℹ️  Sample customer already exists\n');
    }
    
    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('sales', 'logistics', 'financial')
      ORDER BY schemaname, tablename
    `);
    
    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.schemaname}.${row.tablename}`);
    });
    
    // Count customers
    const customerCount = await client.query('SELECT COUNT(*) as count FROM sales.customers');
    console.log(`\n👥 Total customers: ${customerCount.rows[0].count}`);
    
    console.log('\n════════════════════════════════════════');
    console.log('   ✅ MIGRATION COMPLETE!');
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
runMigration()
  .then(() => {
    console.log('🎉 Database is ready!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
