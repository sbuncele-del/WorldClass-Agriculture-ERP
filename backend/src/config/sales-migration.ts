import { Pool } from 'pg';

export async function runSalesMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🛒 Running Sales & CRM migration...');
    
    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        customer_code VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_type VARCHAR(50) DEFAULT 'INDIVIDUAL',
        
        -- Contact Information
        primary_contact VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        website VARCHAR(255),
        
        -- Address
        billing_address_line1 VARCHAR(255),
        billing_address_line2 VARCHAR(255),
        billing_city VARCHAR(100),
        billing_state VARCHAR(100),
        billing_postal_code VARCHAR(20),
        billing_country VARCHAR(100) DEFAULT 'South Africa',
        
        shipping_address_line1 VARCHAR(255),
        shipping_address_line2 VARCHAR(255),
        shipping_city VARCHAR(100),
        shipping_state VARCHAR(100),
        shipping_postal_code VARCHAR(20),
        shipping_country VARCHAR(100) DEFAULT 'South Africa',
        
        -- Tax Information
        vat_number VARCHAR(50),
        tax_exempt BOOLEAN DEFAULT false,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        
        -- Financial
        credit_limit DECIMAL(15,2) DEFAULT 0,
        payment_terms INTEGER DEFAULT 30,
        currency_code VARCHAR(3) DEFAULT 'ZAR',
        
        -- Classification
        customer_group VARCHAR(100),
        sales_person VARCHAR(100),
        territory VARCHAR(100),
        industry VARCHAR(100),
        
        -- CRM
        lead_source VARCHAR(100),
        customer_since DATE DEFAULT CURRENT_DATE,
        last_order_date DATE,
        total_orders INTEGER DEFAULT 0,
        total_revenue DECIMAL(15,2) DEFAULT 0,
        
        -- Status
        status VARCHAR(20) DEFAULT 'ACTIVE',
        is_vip BOOLEAN DEFAULT false,
        credit_hold BOOLEAN DEFAULT false,
        
        -- Metadata
        notes TEXT,
        tags TEXT[],
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ customers table created');

    // Create customer_contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_contacts (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        contact_name VARCHAR(255) NOT NULL,
        position VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ customer_contacts table created');

    // Create quotations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quotation_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_until DATE NOT NULL,
        
        -- Reference
        reference VARCHAR(100),
        customer_reference VARCHAR(100),
        
        -- Amounts
        subtotal DECIMAL(15,2) DEFAULT 0,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        
        -- Terms
        payment_terms INTEGER DEFAULT 30,
        delivery_terms VARCHAR(255),
        notes TEXT,
        terms_and_conditions TEXT,
        
        -- Status & Workflow
        status VARCHAR(50) DEFAULT 'DRAFT',
        approval_status VARCHAR(50) DEFAULT 'PENDING',
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        -- Conversion
        converted_to_order BOOLEAN DEFAULT false,
        sales_order_id INTEGER,
        converted_at TIMESTAMP,
        
        -- Sales Info
        sales_person VARCHAR(100),
        probability DECIMAL(5,2) DEFAULT 0,
        expected_close_date DATE,
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ quotations table created');

    // Create quotation_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotation_lines (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        
        -- Product/Service
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        
        -- Quantity & Pricing
        quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(15,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        line_total DECIMAL(15,2) DEFAULT 0,
        
        -- Additional Info
        notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ quotation_lines table created');

    // Create sales_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        quotation_id INTEGER REFERENCES quotations(id),
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        required_date DATE,
        promised_date DATE,
        
        -- Reference
        reference VARCHAR(100),
        customer_po_number VARCHAR(100),
        
        -- Amounts
        subtotal DECIMAL(15,2) DEFAULT 0,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        shipping_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        
        -- Terms
        payment_terms INTEGER DEFAULT 30,
        delivery_terms VARCHAR(255),
        shipping_method VARCHAR(100),
        notes TEXT,
        
        -- Status & Workflow
        status VARCHAR(50) DEFAULT 'DRAFT',
        approval_status VARCHAR(50) DEFAULT 'PENDING',
        approved_by INTEGER,
        approved_at TIMESTAMP,
        
        -- Delivery
        delivered BOOLEAN DEFAULT false,
        delivery_date DATE,
        delivered_by INTEGER,
        
        -- Invoicing
        invoiced BOOLEAN DEFAULT false,
        invoice_id INTEGER,
        invoiced_at TIMESTAMP,
        
        -- Sales Info
        sales_person VARCHAR(100),
        territory VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'NORMAL',
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ sales_orders table created');

    // Create sales_order_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_order_lines (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        
        -- Product/Service
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        
        -- Quantity & Pricing
        quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
        quantity_delivered DECIMAL(15,3) DEFAULT 0,
        quantity_invoiced DECIMAL(15,3) DEFAULT 0,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(15,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        line_total DECIMAL(15,2) DEFAULT 0,
        
        -- Additional Info
        notes TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ sales_order_lines table created');

    // Create sales_invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        order_id INTEGER REFERENCES sales_orders(id),
        invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        
        -- Reference
        reference VARCHAR(100),
        customer_po_number VARCHAR(100),
        
        -- Amounts
        subtotal DECIMAL(15,2) DEFAULT 0,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        amount_paid DECIMAL(15,2) DEFAULT 0,
        amount_due DECIMAL(15,2) DEFAULT 0,
        
        -- Payment
        payment_status VARCHAR(50) DEFAULT 'UNPAID',
        payment_terms INTEGER DEFAULT 30,
        
        -- Status
        status VARCHAR(50) DEFAULT 'DRAFT',
        sent_to_customer BOOLEAN DEFAULT false,
        sent_at TIMESTAMP,
        
        -- Notes
        notes TEXT,
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Accounting
        journal_entry_id INTEGER,
        posted_to_gl BOOLEAN DEFAULT false,
        posted_at TIMESTAMP
      );
    `);
    console.log('   ✅ sales_invoices table created');

    // Create sales_invoice_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_invoice_lines (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE CASCADE,
        order_line_id INTEGER REFERENCES sales_order_lines(id),
        line_number INTEGER NOT NULL,
        
        -- Product/Service
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        
        -- Quantity & Pricing
        quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        unit_price DECIMAL(15,2) NOT NULL,
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        line_total DECIMAL(15,2) DEFAULT 0,
        
        -- GL Posting
        revenue_account_code VARCHAR(20),
        tax_account_code VARCHAR(20),
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ sales_invoice_lines table created');

    // Create sales_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES customers(id),
        invoice_id INTEGER REFERENCES sales_invoices(id),
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        
        -- Amount
        payment_amount DECIMAL(15,2) NOT NULL,
        
        -- Payment Method
        payment_method VARCHAR(50) NOT NULL,
        reference VARCHAR(100),
        
        -- Bank Details
        bank_account VARCHAR(100),
        cheque_number VARCHAR(50),
        transaction_id VARCHAR(100),
        
        -- Status
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        
        -- Notes
        notes TEXT,
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Accounting
        journal_entry_id INTEGER,
        posted_to_gl BOOLEAN DEFAULT false,
        posted_at TIMESTAMP
      );
    `);
    console.log('   ✅ sales_payments table created');

    // Create delivery_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_notes (
        id SERIAL PRIMARY KEY,
        delivery_number VARCHAR(50) UNIQUE NOT NULL,
        order_id INTEGER REFERENCES sales_orders(id),
        customer_id INTEGER REFERENCES customers(id),
        delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
        
        -- Shipping
        shipping_address TEXT,
        tracking_number VARCHAR(100),
        carrier VARCHAR(100),
        
        -- Status
        status VARCHAR(50) DEFAULT 'PENDING',
        delivered BOOLEAN DEFAULT false,
        received_by VARCHAR(255),
        signature TEXT,
        
        -- Notes
        notes TEXT,
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ delivery_notes table created');

    // Create delivery_note_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_note_lines (
        id SERIAL PRIMARY KEY,
        delivery_note_id INTEGER REFERENCES delivery_notes(id) ON DELETE CASCADE,
        order_line_id INTEGER REFERENCES sales_order_lines(id),
        line_number INTEGER NOT NULL,
        
        -- Product
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        
        -- Quantity
        quantity_ordered DECIMAL(15,3) NOT NULL,
        quantity_delivered DECIMAL(15,3) NOT NULL,
        unit_of_measure VARCHAR(50) DEFAULT 'EA',
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ delivery_note_lines table created');

    // Create credit_notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_notes (
        id SERIAL PRIMARY KEY,
        credit_note_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INTEGER REFERENCES sales_invoices(id),
        customer_id INTEGER REFERENCES customers(id),
        credit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
        
        -- Reason
        reason VARCHAR(255),
        reason_type VARCHAR(50),
        
        -- Amounts
        subtotal DECIMAL(15,2) DEFAULT 0,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2) DEFAULT 0,
        
        -- Status
        status VARCHAR(50) DEFAULT 'DRAFT',
        
        -- Notes
        notes TEXT,
        
        -- Metadata
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Accounting
        journal_entry_id INTEGER,
        posted_to_gl BOOLEAN DEFAULT false,
        posted_at TIMESTAMP
      );
    `);
    console.log('   ✅ credit_notes table created');

    // Create credit_note_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS credit_note_lines (
        id SERIAL PRIMARY KEY,
        credit_note_id INTEGER REFERENCES credit_notes(id) ON DELETE CASCADE,
        invoice_line_id INTEGER REFERENCES sales_invoice_lines(id),
        line_number INTEGER NOT NULL,
        
        -- Product
        item_code VARCHAR(100),
        description TEXT NOT NULL,
        
        -- Quantity & Pricing
        quantity DECIMAL(15,3) NOT NULL,
        unit_price DECIMAL(15,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 15.00,
        tax_amount DECIMAL(15,2) DEFAULT 0,
        line_total DECIMAL(15,2) DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ credit_note_lines table created');

    console.log('📇 Creating indexes...');
    
    // Customers indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
      CREATE INDEX IF NOT EXISTS idx_customers_group ON customers(customer_group);
      CREATE INDEX IF NOT EXISTS idx_customers_sales_person ON customers(sales_person);
    `);

    // Quotations indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
      CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(quotation_date DESC);
      CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
      CREATE INDEX IF NOT EXISTS idx_quotations_sales_person ON quotations(sales_person);
    `);

    // Sales Orders indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_orders_number ON sales_orders(order_number);
      CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date DESC);
      CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
      CREATE INDEX IF NOT EXISTS idx_sales_orders_sales_person ON sales_orders(sales_person);
    `);

    // Invoices indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_number ON sales_invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date DESC);
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_due_date ON sales_invoices(due_date);
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
      CREATE INDEX IF NOT EXISTS idx_sales_invoices_payment_status ON sales_invoices(payment_status);
    `);

    // Payments indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_payments_number ON sales_payments(payment_number);
      CREATE INDEX IF NOT EXISTS idx_sales_payments_customer ON sales_payments(customer_id);
      CREATE INDEX IF NOT EXISTS idx_sales_payments_invoice ON sales_payments(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_sales_payments_date ON sales_payments(payment_date DESC);
    `);

    console.log('   ✅ All indexes created');

    // Create views
    console.log('👁️  Creating views...');
    
    // Drop existing views first to avoid column mismatch issues
    await client.query(`DROP VIEW IF EXISTS customer_summary CASCADE`);
    await client.query(`DROP VIEW IF EXISTS sales_pipeline CASCADE`);
    await client.query(`DROP VIEW IF EXISTS aged_receivables CASCADE`);
    
    // Customer summary view
    await client.query(`
      CREATE VIEW customer_summary AS
      SELECT 
        c.*,
        COUNT(DISTINCT so.id) as total_order_count,
        COUNT(DISTINCT si.id) as total_invoice_count,
        COALESCE(SUM(si.total_amount), 0) as lifetime_sales,
        COALESCE(SUM(si.amount_due), 0) as current_outstanding,
        MAX(so.order_date) as most_recent_order_date
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customer_id
      LEFT JOIN sales_invoices si ON c.id = si.customer_id
      GROUP BY c.id;
    `);
    console.log('   ✅ customer_summary view created');

    // Sales pipeline view
    await client.query(`
      CREATE VIEW sales_pipeline AS
      SELECT 
        q.id,
        q.quotation_number,
        q.quotation_date,
        c.customer_name,
        q.total_amount,
        q.status,
        q.probability,
        q.expected_close_date,
        q.sales_person,
        CASE 
          WHEN q.status = 'DRAFT' THEN 1
          WHEN q.status = 'SENT' THEN 2
          WHEN q.status = 'NEGOTIATION' THEN 3
          WHEN q.status = 'WON' THEN 4
          WHEN q.status = 'LOST' THEN 5
          ELSE 0
        END as stage_order
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.status NOT IN ('CANCELLED', 'EXPIRED')
      ORDER BY q.expected_close_date ASC;
    `);
    console.log('   ✅ sales_pipeline view created');

    // Aged receivables view
    await client.query(`
      CREATE VIEW aged_receivables AS
      SELECT 
        c.id as customer_id,
        c.customer_code,
        c.customer_name,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.total_amount,
        si.amount_due,
        CURRENT_DATE - si.due_date as days_overdue,
        CASE 
          WHEN CURRENT_DATE <= si.due_date THEN 'CURRENT'
          WHEN CURRENT_DATE - si.due_date BETWEEN 1 AND 30 THEN '1-30 DAYS'
          WHEN CURRENT_DATE - si.due_date BETWEEN 31 AND 60 THEN '31-60 DAYS'
          WHEN CURRENT_DATE - si.due_date BETWEEN 61 AND 90 THEN '61-90 DAYS'
          ELSE '90+ DAYS'
        END as aging_bucket
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      WHERE si.amount_due > 0
        AND si.status = 'POSTED'
      ORDER BY days_overdue DESC;
    `);
    console.log('   ✅ aged_receivables view created');

    console.log('✅ Sales & CRM migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running Sales migration:', error);
    throw error;
  } finally {
    client.release();
  }
}
