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

async function migrateSalesTables() {
  try {
    console.log('🔄 Creating Sales module tables...\n');

    // Create leads table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales.leads (
        lead_id SERIAL PRIMARY KEY,
        lead_name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        source VARCHAR(50),
        lead_score INTEGER DEFAULT 0,
        estimated_value DECIMAL(15,2),
        status VARCHAR(20) DEFAULT 'new',
        assigned_to VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.leads table created');

    // Create opportunities table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales.opportunities (
        opportunity_id SERIAL PRIMARY KEY,
        opportunity_name VARCHAR(255) NOT NULL,
        customer_id INTEGER REFERENCES sales.customers(customer_id),
        amount DECIMAL(15,2) NOT NULL,
        stage VARCHAR(50) DEFAULT 'prospecting',
        probability INTEGER DEFAULT 0,
        expected_close_date DATE,
        lead_source VARCHAR(50),
        assigned_to VARCHAR(100),
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.opportunities table created');

    // Create quotations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales.quotations (
        quotation_id SERIAL PRIMARY KEY,
        quotation_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES sales.customers(customer_id),
        quotation_date DATE NOT NULL,
        valid_until DATE,
        subtotal DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft',
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.quotations table created');

    // Create sales_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales.sales_orders (
        order_id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES sales.customers(customer_id),
        order_date DATE NOT NULL,
        delivery_date DATE,
        subtotal DECIMAL(15,2) NOT NULL,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_status VARCHAR(20) DEFAULT 'unpaid',
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.sales_orders table created');

    // Insert sample leads
    await pool.query(`
      INSERT INTO sales.leads (lead_name, company, contact_person, email, phone, source, lead_score, estimated_value, status, assigned_to)
      VALUES 
        ('ERP System Implementation', 'Shoprite Holdings', 'John Manager', 'john@shoprite.co.za', '+27 21 980 4000', 'WEBSITE', 85, 450000, 'qualified', 'John Smith'),
        ('Logistics Software Upgrade', 'Imperial Logistics', 'Sarah Ops', 'sarah@imperial.co.za', '+27 11 555 6000', 'REFERRAL', 70, 325000, 'contacted', 'Sarah Johnson')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample leads inserted');

    // Insert sample opportunities
    await pool.query(`
      INSERT INTO sales.opportunities (opportunity_name, customer_id, amount, stage, probability, expected_close_date, lead_source, assigned_to, status)
      VALUES 
        ('Annual Software License Renewal', 1, 180000, 'negotiation', 80, '2025-12-31', 'EXISTING_CUSTOMER', 'Mike Davis', 'open')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample opportunities inserted');

    console.log('\n════════════════════════════════════════');
    console.log('   ✅ SALES TABLES MIGRATION COMPLETE!');
    console.log('════════════════════════════════════════\n');

    // Verify tables
    const result = await pool.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'sales'
      ORDER BY tablename
    `);

    console.log('📊 Sales schema tables:');
    result.rows.forEach(row => {
      console.log(`   • ${row.schemaname}.${row.tablename}`);
    });

    // Count records
    const leadsCount = await pool.query('SELECT COUNT(*) FROM sales.leads');
    const oppsCount = await pool.query('SELECT COUNT(*) FROM sales.opportunities');
    const quotsCount = await pool.query('SELECT COUNT(*) FROM sales.quotations');
    const ordersCount = await pool.query('SELECT COUNT(*) FROM sales.sales_orders');

    console.log('\n📈 Record counts:');
    console.log(`   • Leads: ${leadsCount.rows[0].count}`);
    console.log(`   • Opportunities: ${oppsCount.rows[0].count}`);
    console.log(`   • Quotations: ${quotsCount.rows[0].count}`);
    console.log(`   • Sales Orders: ${ordersCount.rows[0].count}`);

    console.log('\n🎉 Database is ready for Sales module!\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateSalesTables();
