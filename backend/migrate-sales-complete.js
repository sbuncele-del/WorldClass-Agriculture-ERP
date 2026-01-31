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

async function migrateSalesComplete() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Upgrading Sales module to complete schema...\n');

    await client.query('BEGIN');

    // 1. Update leads table with new columns
    console.log('⚙️  Updating sales.leads table...');
    await client.query(`
      ALTER TABLE sales.leads 
        ADD COLUMN IF NOT EXISTS lead_number VARCHAR(50) UNIQUE,
        ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
        ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
        ADD COLUMN IF NOT EXISTS lead_value DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 50,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS next_follow_up DATE,
        ADD COLUMN IF NOT EXISTS converted_to_opportunity_id INTEGER,
        ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP
    `);
    
    // Generate lead numbers for existing records
    await client.query(`
      UPDATE sales.leads 
      SET lead_number = CONCAT('LEAD-', TO_CHAR(created_at, 'YYYYMM'), '-', LPAD(lead_id::text, 4, '0'))
      WHERE lead_number IS NULL
    `);
    
    // Rename columns to match new schema
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='leads' AND column_name='lead_name') THEN
          ALTER TABLE sales.leads RENAME COLUMN lead_name TO company_name;
        END IF;
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='leads' AND column_name='lead_score') THEN
          ALTER TABLE sales.leads DROP COLUMN lead_score;
        END IF;
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='leads' AND column_name='estimated_value') THEN
          ALTER TABLE sales.leads DROP COLUMN estimated_value;
        END IF;
      END $$;
    `);
    console.log('✅ sales.leads table updated');

    // 2. Update opportunities table
    console.log('⚙️  Updating sales.opportunities table...');
    await client.query(`
      ALTER TABLE sales.opportunities 
        ADD COLUMN IF NOT EXISTS opportunity_number VARCHAR(50) UNIQUE,
        ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES sales.leads(lead_id),
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS value DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS source VARCHAR(100),
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS lost_reason TEXT,
        ADD COLUMN IF NOT EXISTS converted_to_quotation_id INTEGER,
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP
    `);
    
    // Generate opportunity numbers
    await client.query(`
      UPDATE sales.opportunities 
      SET opportunity_number = CONCAT('OPP-', TO_CHAR(created_at, 'YYYYMM'), '-', LPAD(opportunity_id::text, 4, '0'))
      WHERE opportunity_number IS NULL
    `);
    
    // Rename amount to value (only if value doesn't already exist)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='opportunities' AND column_name='amount') AND
           NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='opportunities' AND column_name='value') THEN
          ALTER TABLE sales.opportunities RENAME COLUMN amount TO value;
        END IF;
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='opportunities' AND column_name='lead_source') THEN
          ALTER TABLE sales.opportunities DROP COLUMN lead_source;
        END IF;
      END $$;
    `);
    console.log('✅ sales.opportunities table updated');

    // 3. Update quotations table
    console.log('⚙️  Updating sales.quotations table...');
    await client.query(`
      ALTER TABLE sales.quotations 
        ADD COLUMN IF NOT EXISTS opportunity_id INTEGER REFERENCES sales.opportunities(opportunity_id),
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 15.00,
        ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS terms TEXT,
        ADD COLUMN IF NOT EXISTS prepared_by VARCHAR(255),
        ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS decline_reason TEXT,
        ADD COLUMN IF NOT EXISTS converted_to_order_id INTEGER
    `);
    
    // Rename tax_amount to vat_amount (only if vat_amount doesn't exist)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='quotations' AND column_name='tax_amount') AND
           NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='quotations' AND column_name='vat_amount') THEN
          UPDATE sales.quotations SET vat_amount = tax_amount WHERE vat_amount IS NULL;
          ALTER TABLE sales.quotations DROP COLUMN tax_amount;
        ELSIF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='quotations' AND column_name='tax_amount') THEN
          ALTER TABLE sales.quotations DROP COLUMN tax_amount;
        END IF;
      END $$;
    `);
    console.log('✅ sales.quotations table updated');

    // 4. Create quotation_line_items table
    console.log('⚙️  Creating sales.quotation_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.quotation_line_items (
        line_item_id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES sales.quotations(quotation_id) ON DELETE CASCADE,
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        line_total DECIMAL(12,2) NOT NULL,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.quotation_line_items table created');

    // 5. Create or update sales orders table
    console.log('⚙️  Creating/updating sales.orders table...');
    
    // Check if sales_orders exists and rename to orders
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='sales' AND table_name='sales_orders') THEN
          ALTER TABLE sales.sales_orders RENAME TO orders;
        END IF;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.orders (
        order_id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        quotation_id INTEGER REFERENCES sales.quotations(quotation_id),
        customer_id INTEGER REFERENCES sales.customers(customer_id) NOT NULL,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        delivery_date DATE,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        delivery_address TEXT,
        special_instructions TEXT,
        subtotal DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        vat_amount DECIMAL(12,2) NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        payment_terms VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        confirmed_at TIMESTAMP,
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add new columns if table existed
    await client.query(`
      ALTER TABLE sales.orders 
        ADD COLUMN IF NOT EXISTS quotation_id INTEGER REFERENCES sales.quotations(quotation_id),
        ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS delivery_address TEXT,
        ADD COLUMN IF NOT EXISTS special_instructions TEXT,
        ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 15.00,
        ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
        ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
        ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS cancellation_reason TEXT
    `);
    
    // Rename columns (only if target doesn't exist)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' AND column_name='tax_amount') THEN
          UPDATE sales.orders SET vat_amount = tax_amount WHERE vat_amount IS NULL;
          ALTER TABLE sales.orders DROP COLUMN tax_amount;
        END IF;
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='sales' AND table_name='orders' AND column_name='payment_status') THEN
          ALTER TABLE sales.orders DROP COLUMN payment_status;
        END IF;
      END $$;
    `);
    console.log('✅ sales.orders table created/updated');

    // 6. Create order_line_items table
    console.log('⚙️  Creating sales.order_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.order_line_items (
        line_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES sales.orders(order_id) ON DELETE CASCADE,
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        line_total DECIMAL(12,2) NOT NULL,
        quantity_shipped DECIMAL(10,4) DEFAULT 0.00,
        quantity_invoiced DECIMAL(10,4) DEFAULT 0.00,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.order_line_items table created');

    // 7. Update customers table
    console.log('⚙️  Updating sales.customers table...');
    await client.query(`
      ALTER TABLE sales.customers 
        ADD COLUMN IF NOT EXISTS billing_address TEXT,
        ADD COLUMN IF NOT EXISTS shipping_address TEXT,
        ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
        ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
        ADD COLUMN IF NOT EXISTS website VARCHAR(255),
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255)
    `);
    console.log('✅ sales.customers table updated');

    // 8. Create activity_log table
    console.log('⚙️  Creating sales.activity_log table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales.activity_log (
        activity_id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        description TEXT,
        activity_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ sales.activity_log table created');

    // 9. Create indexes
    console.log('⚙️  Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_status ON sales.leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON sales.leads(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON sales.leads(next_follow_up);
      
      CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON sales.opportunities(stage);
      CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON sales.opportunities(customer_id);
      CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON sales.opportunities(assigned_to);
      
      CREATE INDEX IF NOT EXISTS idx_quotations_status ON sales.quotations(status);
      CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON sales.quotations(customer_id);
      
      CREATE INDEX IF NOT EXISTS idx_orders_status ON sales.orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON sales.orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_order_date ON sales.orders(order_date);
      
      CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON sales.activity_log(entity_type, entity_id);
    `);
    console.log('✅ Indexes created');

    // 10. Update financial.invoices to link to orders
    console.log('⚙️  Linking invoices to orders...');
    await client.query(`
      ALTER TABLE financial.invoices 
        ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES sales.orders(order_id)
    `);
    console.log('✅ Invoices linked to orders');

    await client.query('COMMIT');

    console.log('\n════════════════════════════════════════');
    console.log('   ✅ SALES SCHEMA UPGRADE COMPLETE!');
    console.log('════════════════════════════════════════\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='sales' AND table_name=t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'sales'
      ORDER BY table_name
    `);

    console.log('📊 Sales schema tables:');
    result.rows.forEach(row => {
      console.log(`   • sales.${row.table_name} (${row.column_count} columns)`);
    });

    // Count records
    const leadsCount = await client.query('SELECT COUNT(*) FROM sales.leads');
    const oppsCount = await client.query('SELECT COUNT(*) FROM sales.opportunities');
    const quotsCount = await client.query('SELECT COUNT(*) FROM sales.quotations');
    const ordersCount = await client.query('SELECT COUNT(*) FROM sales.orders');
    const customersCount = await client.query('SELECT COUNT(*) FROM sales.customers');

    console.log('\n📈 Record counts:');
    console.log(`   • Customers: ${customersCount.rows[0].count}`);
    console.log(`   • Leads: ${leadsCount.rows[0].count}`);
    console.log(`   • Opportunities: ${oppsCount.rows[0].count}`);
    console.log(`   • Quotations: ${quotsCount.rows[0].count}`);
    console.log(`   • Orders: ${ordersCount.rows[0].count}`);

    console.log('\n🎉 Sales module database is fully upgraded!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateSalesComplete();
