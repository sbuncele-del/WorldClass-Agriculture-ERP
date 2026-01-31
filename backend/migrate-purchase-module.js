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

async function migratePurchaseModule() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creating Purchase module schema...\n');

    await client.query('BEGIN');

    // 1. Create purchasing schema if not exists
    await client.query('CREATE SCHEMA IF NOT EXISTS purchasing');
    console.log('✅ purchasing schema ready');

    // 2. Create suppliers table
    console.log('⚙️  Creating purchasing.suppliers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.suppliers (
        supplier_id SERIAL PRIMARY KEY,
        supplier_code VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        website VARCHAR(255),
        vat_number VARCHAR(50),
        tax_id VARCHAR(50),
        billing_address TEXT,
        shipping_address TEXT,
        payment_terms INTEGER DEFAULT 30,
        credit_limit DECIMAL(12,2) DEFAULT 0.00,
        currency_code VARCHAR(10) DEFAULT 'ZAR',
        bank_name VARCHAR(255),
        bank_account_number VARCHAR(100),
        bank_branch_code VARCHAR(50),
        supplier_type VARCHAR(50),
        industry VARCHAR(100),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        assigned_to VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.suppliers table created');

    // 3. Create requisitions table
    console.log('⚙️  Creating purchasing.requisitions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.requisitions (
        requisition_id SERIAL PRIMARY KEY,
        requisition_number VARCHAR(50) UNIQUE NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        cost_center VARCHAR(100),
        required_date DATE NOT NULL,
        priority VARCHAR(50) DEFAULT 'normal',
        justification TEXT,
        estimated_total DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'draft',
        approval_status VARCHAR(50) DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        rejected_by VARCHAR(255),
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        converted_to_po_id INTEGER,
        converted_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.requisitions table created');

    // 4. Create requisition_line_items table
    console.log('⚙️  Creating purchasing.requisition_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.requisition_line_items (
        line_item_id SERIAL PRIMARY KEY,
        requisition_id INTEGER REFERENCES purchasing.requisitions(requisition_id) ON DELETE CASCADE,
        item_code VARCHAR(100),
        item_description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        estimated_unit_cost DECIMAL(12,2) NOT NULL,
        estimated_total_cost DECIMAL(12,2) NOT NULL,
        suggested_supplier VARCHAR(255),
        notes TEXT,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.requisition_line_items table created');

    // 5. Create purchase_orders table
    console.log('⚙️  Creating purchasing.purchase_orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.purchase_orders (
        po_id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES purchasing.suppliers(supplier_id) NOT NULL,
        requisition_id INTEGER REFERENCES purchasing.requisitions(requisition_id),
        po_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expected_delivery_date DATE,
        delivery_address TEXT,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        reference VARCHAR(255),
        supplier_reference VARCHAR(255),
        subtotal DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        vat_amount DECIMAL(12,2) NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        payment_terms INTEGER DEFAULT 30,
        delivery_terms TEXT,
        currency_code VARCHAR(10) DEFAULT 'ZAR',
        exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
        status VARCHAR(50) DEFAULT 'draft',
        approval_status VARCHAR(50) DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        sent_to_supplier_at TIMESTAMP,
        acknowledged_by_supplier_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        cancellation_reason TEXT,
        notes TEXT,
        terms_and_conditions TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.purchase_orders table created');

    // 6. Create po_line_items table
    console.log('⚙️  Creating purchasing.po_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.po_line_items (
        line_item_id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchasing.purchase_orders(po_id) ON DELETE CASCADE,
        item_code VARCHAR(100),
        item_description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        line_total DECIMAL(12,2) NOT NULL,
        quantity_received DECIMAL(10,4) DEFAULT 0.00,
        quantity_invoiced DECIMAL(10,4) DEFAULT 0.00,
        delivery_date DATE,
        notes TEXT,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.po_line_items table created');

    // 7. Create goods_receipts table
    console.log('⚙️  Creating purchasing.goods_receipts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.goods_receipts (
        receipt_id SERIAL PRIMARY KEY,
        receipt_number VARCHAR(50) UNIQUE NOT NULL,
        po_id INTEGER REFERENCES purchasing.purchase_orders(po_id) NOT NULL,
        supplier_id INTEGER REFERENCES purchasing.suppliers(supplier_id) NOT NULL,
        receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
        received_by VARCHAR(255) NOT NULL,
        delivery_note_number VARCHAR(100),
        carrier_name VARCHAR(255),
        tracking_number VARCHAR(100),
        quality_check_status VARCHAR(50) DEFAULT 'pending',
        quality_checked_by VARCHAR(255),
        quality_checked_at TIMESTAMP,
        quality_notes TEXT,
        warehouse_location VARCHAR(100),
        status VARCHAR(50) DEFAULT 'draft',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.goods_receipts table created');

    // 8. Create gr_line_items table
    console.log('⚙️  Creating purchasing.gr_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.gr_line_items (
        line_item_id SERIAL PRIMARY KEY,
        receipt_id INTEGER REFERENCES purchasing.goods_receipts(receipt_id) ON DELETE CASCADE,
        po_line_item_id INTEGER REFERENCES purchasing.po_line_items(line_item_id),
        item_code VARCHAR(100),
        item_description TEXT NOT NULL,
        quantity_ordered DECIMAL(10,4) NOT NULL,
        quantity_received DECIMAL(10,4) NOT NULL,
        quantity_rejected DECIMAL(10,4) DEFAULT 0.00,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(12,2) NOT NULL,
        line_total DECIMAL(12,2) NOT NULL,
        quality_status VARCHAR(50) DEFAULT 'accepted',
        rejection_reason TEXT,
        batch_number VARCHAR(100),
        serial_numbers TEXT,
        expiry_date DATE,
        notes TEXT,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.gr_line_items table created');

    // 9. Create vendor_invoices table
    console.log('⚙️  Creating purchasing.vendor_invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.vendor_invoices (
        invoice_id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_invoice_number VARCHAR(100) NOT NULL,
        supplier_id INTEGER REFERENCES purchasing.suppliers(supplier_id) NOT NULL,
        po_id INTEGER REFERENCES purchasing.purchase_orders(po_id),
        receipt_id INTEGER REFERENCES purchasing.goods_receipts(receipt_id),
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        received_date DATE DEFAULT CURRENT_DATE,
        reference VARCHAR(255),
        subtotal DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        vat_amount DECIMAL(12,2) NOT NULL,
        total DECIMAL(12,2) NOT NULL,
        amount_paid DECIMAL(12,2) DEFAULT 0.00,
        amount_due DECIMAL(12,2) NOT NULL,
        currency_code VARCHAR(10) DEFAULT 'ZAR',
        exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
        payment_terms INTEGER DEFAULT 30,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        status VARCHAR(50) DEFAULT 'pending_approval',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        posted_to_gl BOOLEAN DEFAULT FALSE,
        posted_at TIMESTAMP,
        paid_at TIMESTAMP,
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.vendor_invoices table created');

    // 10. Create vendor_invoice_line_items table
    console.log('⚙️  Creating purchasing.vendor_invoice_line_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchasing.vendor_invoice_line_items (
        line_item_id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES purchasing.vendor_invoices(invoice_id) ON DELETE CASCADE,
        po_line_item_id INTEGER REFERENCES purchasing.po_line_items(line_item_id),
        item_code VARCHAR(100),
        item_description TEXT NOT NULL,
        quantity DECIMAL(10,4) NOT NULL,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(12,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        line_total DECIMAL(12,2) NOT NULL,
        gl_account VARCHAR(50),
        cost_center VARCHAR(100),
        notes TEXT,
        line_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ purchasing.vendor_invoice_line_items table created');

    // 11. Create indexes
    console.log('⚙️  Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_suppliers_status ON purchasing.suppliers(status);
      CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON purchasing.suppliers(company_name);
      
      CREATE INDEX IF NOT EXISTS idx_requisitions_status ON purchasing.requisitions(status);
      CREATE INDEX IF NOT EXISTS idx_requisitions_approval_status ON purchasing.requisitions(approval_status);
      CREATE INDEX IF NOT EXISTS idx_requisitions_requested_by ON purchasing.requisitions(requested_by);
      
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchasing.purchase_orders(status);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchasing.purchase_orders(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_date ON purchasing.purchase_orders(po_date);
      
      CREATE INDEX IF NOT EXISTS idx_goods_receipts_status ON purchasing.goods_receipts(status);
      CREATE INDEX IF NOT EXISTS idx_goods_receipts_po_id ON purchasing.goods_receipts(po_id);
      CREATE INDEX IF NOT EXISTS idx_goods_receipts_receipt_date ON purchasing.goods_receipts(receipt_date);
      
      CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status ON purchasing.vendor_invoices(status);
      CREATE INDEX IF NOT EXISTS idx_vendor_invoices_payment_status ON purchasing.vendor_invoices(payment_status);
      CREATE INDEX IF NOT EXISTS idx_vendor_invoices_supplier_id ON purchasing.vendor_invoices(supplier_id);
      CREATE INDEX IF NOT EXISTS idx_vendor_invoices_due_date ON purchasing.vendor_invoices(due_date);
    `);
    console.log('✅ Indexes created');

    // 12. Insert sample data
    console.log('⚙️  Inserting sample data...');
    
    // Sample supplier
    await client.query(`
      INSERT INTO purchasing.suppliers (
        supplier_code, company_name, contact_person, email, phone,
        vat_number, payment_terms, supplier_type, status
      ) VALUES 
      ('SUP-001', 'Tech Supplies SA', 'John Smith', 'john@techsupplies.co.za', '011-123-4567', '4123456789', 30, 'goods', 'active'),
      ('SUP-002', 'Office Equipment Ltd', 'Sarah Jones', 'sarah@officeequip.co.za', '021-987-6543', '4987654321', 30, 'goods', 'active')
      ON CONFLICT (supplier_code) DO NOTHING
    `);
    console.log('   • 2 sample suppliers inserted');

    // Sample requisition
    const reqResult = await client.query(`
      INSERT INTO purchasing.requisitions (
        requisition_number, requested_by, department, required_date,
        priority, justification, estimated_total, status, approval_status
      ) VALUES 
      ('REQ-202511-0001', 'Jane Doe', 'IT', CURRENT_DATE + INTERVAL '14 days', 
       'normal', 'New laptops for development team', 75000.00, 'draft', 'pending')
      ON CONFLICT (requisition_number) DO NOTHING
      RETURNING requisition_id
    `);

    if (reqResult.rows.length > 0) {
      const reqId = reqResult.rows[0].requisition_id;
      
      await client.query(`
        INSERT INTO purchasing.requisition_line_items (
          requisition_id, item_code, item_description, quantity, 
          unit_of_measure, estimated_unit_cost, estimated_total_cost, line_order
        ) VALUES 
        ($1, 'LAP-001', 'Dell Latitude 5420 Laptop', 5, 'EA', 15000.00, 75000.00, 1)
      `, [reqId]);
      
      console.log('   • 1 sample requisition with line items inserted');
    }

    await client.query('COMMIT');

    console.log('\n════════════════════════════════════════');
    console.log('   ✅ PURCHASE MODULE SCHEMA COMPLETE!');
    console.log('════════════════════════════════════════\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='purchasing' AND table_name=t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'purchasing'
      ORDER BY table_name
    `);

    console.log('📊 Purchase schema tables:');
    result.rows.forEach(row => {
      console.log(`   • purchasing.${row.table_name} (${row.column_count} columns)`);
    });

    // Count records
    const suppliersCount = await client.query('SELECT COUNT(*) FROM purchasing.suppliers');
    const requisitionsCount = await client.query('SELECT COUNT(*) FROM purchasing.requisitions');

    console.log('\n📈 Record counts:');
    console.log(`   • Suppliers: ${suppliersCount.rows[0].count}`);
    console.log(`   • Requisitions: ${requisitionsCount.rows[0].count}`);

    console.log('\n🎉 Purchase module database is ready!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePurchaseModule();
