import { Pool } from 'pg';

export async function runPurchaseMigration(pool: Pool): Promise<void> {
  console.log('🛒 Running Purchase Management migration...');

  try {
    // 1. VENDORS TABLE - Vendor master data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        vendor_code VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        tax_number VARCHAR(50),
        registration_number VARCHAR(50),
        vendor_group VARCHAR(100),
        payment_terms VARCHAR(100) DEFAULT '30 Days',
        credit_limit DECIMAL(15, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'ZAR',
        bank_name VARCHAR(255),
        bank_account VARCHAR(50),
        bank_branch VARCHAR(50),
        billing_address JSONB,
        shipping_address JSONB,
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ vendors table created');

    // 2. VENDOR_CONTACTS TABLE - Multiple contacts per vendor
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_contacts (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        contact_name VARCHAR(255) NOT NULL,
        position VARCHAR(100),
        email VARCHAR(255),
        phone VARCHAR(50),
        mobile VARCHAR(50),
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ vendor_contacts table created');

    // 3. PURCHASE_REQUISITIONS TABLE - Internal purchase requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_requisitions (
        id SERIAL PRIMARY KEY,
        requisition_number VARCHAR(50) UNIQUE NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        request_date DATE NOT NULL,
        required_date DATE,
        priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CONVERTED')),
        approval_status VARCHAR(20),
        approved_by VARCHAR(255),
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ purchase_requisitions table created');

    // 4. PURCHASE_REQUISITION_LINES TABLE - Requisition line items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_requisition_lines (
        id SERIAL PRIMARY KEY,
        requisition_id INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        item_description TEXT NOT NULL,
        quantity DECIMAL(15, 3) NOT NULL,
        unit_of_measure VARCHAR(50),
        estimated_unit_price DECIMAL(15, 2),
        estimated_total DECIMAL(15, 2),
        justification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(requisition_id, line_number)
      );
    `);
    console.log('   ✅ purchase_requisition_lines table created');

    // 5. PURCHASE_ORDERS TABLE - Purchase orders to vendors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id),
        requisition_id INTEGER REFERENCES purchase_requisitions(id),
        po_date DATE NOT NULL,
        delivery_date DATE,
        payment_terms VARCHAR(100),
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        subtotal DECIMAL(15, 2) DEFAULT 0,
        tax_amount DECIMAL(15, 2) DEFAULT 0,
        total_amount DECIMAL(15, 2) NOT NULL,
        delivery_address JSONB,
        shipping_method VARCHAR(100),
        terms_and_conditions TEXT,
        notes TEXT,
        created_by VARCHAR(255),
        sent_date TIMESTAMP,
        acknowledged_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ purchase_orders table created');

    // 6. PURCHASE_ORDER_LINES TABLE - PO line items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_order_lines (
        id SERIAL PRIMARY KEY,
        po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL,
        item_description TEXT NOT NULL,
        quantity_ordered DECIMAL(15, 3) NOT NULL,
        quantity_received DECIMAL(15, 3) DEFAULT 0,
        quantity_invoiced DECIMAL(15, 3) DEFAULT 0,
        unit_of_measure VARCHAR(50),
        unit_price DECIMAL(15, 2) NOT NULL,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        tax_rate DECIMAL(5, 2) DEFAULT 15,
        line_total DECIMAL(15, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(po_id, line_number)
      );
    `);
    console.log('   ✅ purchase_order_lines table created');

    // 7. GOODS_RECEIVED_NOTES TABLE - GRN documentation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goods_received_notes (
        id SERIAL PRIMARY KEY,
        grn_number VARCHAR(50) UNIQUE NOT NULL,
        po_id INTEGER NOT NULL REFERENCES purchase_orders(id),
        vendor_id INTEGER NOT NULL REFERENCES vendors(id),
        received_date DATE NOT NULL,
        received_by VARCHAR(255),
        delivery_note_number VARCHAR(100),
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED')),
        inspection_notes TEXT,
        quality_status VARCHAR(20) CHECK (quality_status IN ('Pass', 'Fail', 'Partial')),
        warehouse_location VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ goods_received_notes table created');

    // 8. GOODS_RECEIVED_NOTE_LINES TABLE - GRN line items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goods_received_note_lines (
        id SERIAL PRIMARY KEY,
        grn_id INTEGER NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
        po_line_id INTEGER NOT NULL REFERENCES purchase_order_lines(id),
        line_number INTEGER NOT NULL,
        item_description TEXT,
        quantity_ordered DECIMAL(15, 3),
        quantity_received DECIMAL(15, 3) NOT NULL,
        quantity_accepted DECIMAL(15, 3),
        quantity_rejected DECIMAL(15, 3) DEFAULT 0,
        rejection_reason TEXT,
        unit_of_measure VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(grn_id, line_number)
      );
    `);
    console.log('   ✅ goods_received_note_lines table created');

    // 9. VENDOR_INVOICES TABLE - Invoices from vendors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        internal_reference VARCHAR(50) UNIQUE NOT NULL,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id),
        po_id INTEGER REFERENCES purchase_orders(id),
        grn_id INTEGER REFERENCES goods_received_notes(id),
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        payment_terms VARCHAR(100),
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'OVERDUE')),
        match_status VARCHAR(20) DEFAULT 'UNMATCHED' CHECK (match_status IN ('UNMATCHED', 'MATCHED', 'VARIANCE', 'APPROVED')),
        subtotal DECIMAL(15, 2) DEFAULT 0,
        tax_amount DECIMAL(15, 2) DEFAULT 0,
        total_amount DECIMAL(15, 2) NOT NULL,
        amount_paid DECIMAL(15, 2) DEFAULT 0,
        amount_due DECIMAL(15, 2),
        variance_amount DECIMAL(15, 2) DEFAULT 0,
        variance_notes TEXT,
        account_id UUID REFERENCES chart_of_accounts(id),
        approved_by VARCHAR(255),
        approval_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ vendor_invoices table created');

    // 10. VENDOR_INVOICE_LINES TABLE - Invoice line items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_invoice_lines (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES vendor_invoices(id) ON DELETE CASCADE,
        po_line_id INTEGER REFERENCES purchase_order_lines(id),
        grn_line_id INTEGER REFERENCES goods_received_note_lines(id),
        line_number INTEGER NOT NULL,
        item_description TEXT NOT NULL,
        quantity DECIMAL(15, 3) NOT NULL,
        unit_price DECIMAL(15, 2) NOT NULL,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        tax_rate DECIMAL(5, 2) DEFAULT 15,
        line_total DECIMAL(15, 2) NOT NULL,
        variance_amount DECIMAL(15, 2) DEFAULT 0,
        account_id UUID REFERENCES chart_of_accounts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(invoice_id, line_number)
      );
    `);
    console.log('   ✅ vendor_invoice_lines table created');

    // 11. VENDOR_PAYMENTS TABLE - Payments to vendors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id),
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) CHECK (payment_method IN ('EFT', 'Check', 'Cash', 'Card', 'Bank Transfer')),
        reference_number VARCHAR(100),
        total_amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'ZAR',
        bank_account_id INTEGER,
        gl_account_id UUID REFERENCES chart_of_accounts(id),
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'CLEARED', 'FAILED')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ vendor_payments table created');

    // 12. VENDOR_PAYMENT_ALLOCATIONS TABLE - Payment allocation to invoices
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_payment_allocations (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER NOT NULL REFERENCES vendor_payments(id) ON DELETE CASCADE,
        invoice_id INTEGER NOT NULL REFERENCES vendor_invoices(id),
        allocated_amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(payment_id, invoice_id)
      );
    `);
    console.log('   ✅ vendor_payment_allocations table created');

    // Create indexes for better performance
    console.log('📇 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors(vendor_code)',
      'CREATE INDEX IF NOT EXISTS idx_vendors_company_name ON vendors(company_name)',
      'CREATE INDEX IF NOT EXISTS idx_vendors_tax_number ON vendors(tax_number)',
      'CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor ON vendor_contacts(vendor_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_contacts_primary ON vendor_contacts(is_primary)',
      'CREATE INDEX IF NOT EXISTS idx_requisitions_number ON purchase_requisitions(requisition_number)',
      'CREATE INDEX IF NOT EXISTS idx_requisitions_status ON purchase_requisitions(status)',
      'CREATE INDEX IF NOT EXISTS idx_requisitions_date ON purchase_requisitions(request_date)',
      'CREATE INDEX IF NOT EXISTS idx_requisitions_requested_by ON purchase_requisitions(requested_by)',
      'CREATE INDEX IF NOT EXISTS idx_requisition_lines_req ON purchase_requisition_lines(requisition_id)',
      'CREATE INDEX IF NOT EXISTS idx_pos_number ON purchase_orders(po_number)',
      'CREATE INDEX IF NOT EXISTS idx_pos_vendor ON purchase_orders(vendor_id)',
      'CREATE INDEX IF NOT EXISTS idx_pos_requisition ON purchase_orders(requisition_id)',
      'CREATE INDEX IF NOT EXISTS idx_pos_status ON purchase_orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_pos_date ON purchase_orders(po_date)',
      'CREATE INDEX IF NOT EXISTS idx_po_lines_po ON purchase_order_lines(po_id)',
      'CREATE INDEX IF NOT EXISTS idx_grns_number ON goods_received_notes(grn_number)',
      'CREATE INDEX IF NOT EXISTS idx_grns_po ON goods_received_notes(po_id)',
      'CREATE INDEX IF NOT EXISTS idx_grns_vendor ON goods_received_notes(vendor_id)',
      'CREATE INDEX IF NOT EXISTS idx_grns_status ON goods_received_notes(status)',
      'CREATE INDEX IF NOT EXISTS idx_grns_date ON goods_received_notes(received_date)',
      'CREATE INDEX IF NOT EXISTS idx_grn_lines_grn ON goods_received_note_lines(grn_id)',
      'CREATE INDEX IF NOT EXISTS idx_grn_lines_po_line ON goods_received_note_lines(po_line_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_number ON vendor_invoices(invoice_number)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_internal ON vendor_invoices(internal_reference)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor ON vendor_invoices(vendor_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_po ON vendor_invoices(po_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_grn ON vendor_invoices(grn_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status ON vendor_invoices(status)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_match_status ON vendor_invoices(match_status)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_date ON vendor_invoices(invoice_date)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoices_due_date ON vendor_invoices(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoice_lines_invoice ON vendor_invoice_lines(invoice_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoice_lines_po_line ON vendor_invoice_lines(po_line_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_invoice_lines_grn_line ON vendor_invoice_lines(grn_line_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_payments_number ON vendor_payments(payment_number)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_id)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_vendor_payments_date ON vendor_payments(payment_date)',
      'CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON vendor_payment_allocations(payment_id)',
      'CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice ON vendor_payment_allocations(invoice_id)'
    ];

    for (const index of indexes) {
      await pool.query(index);
    }
    console.log('   ✅ All indexes created');

    // Create views for analytics
    console.log('👁️  Creating views...');

    // View 1: Vendor Summary
    await pool.query(`
      CREATE OR REPLACE VIEW vendor_summary AS
      SELECT 
        v.*,
        COUNT(DISTINCT po.id) as total_pos,
        COALESCE(SUM(po.total_amount), 0) as total_spend,
        COUNT(DISTINCT vi.id) as total_invoices,
        COALESCE(SUM(CASE WHEN vi.status = 'OVERDUE' THEN vi.amount_due ELSE 0 END), 0) as overdue_amount
      FROM vendors v
      LEFT JOIN purchase_orders po ON v.id = po.vendor_id
      LEFT JOIN vendor_invoices vi ON v.id = vi.vendor_id
      GROUP BY v.id;
    `);
    console.log('   ✅ vendor_summary view created');

    // View 2: Aged Payables
    await pool.query(`
      CREATE OR REPLACE VIEW aged_payables AS
      SELECT 
        vi.*,
        v.company_name as vendor_name,
        v.vendor_code,
        CASE 
          WHEN vi.due_date >= CURRENT_DATE THEN 'Current'
          WHEN vi.due_date >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 Days'
          WHEN vi.due_date >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 Days'
          WHEN vi.due_date >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 Days'
          ELSE 'Over 90 Days'
        END as aging_bucket,
        CURRENT_DATE - vi.due_date as days_overdue
      FROM vendor_invoices vi
      JOIN vendors v ON vi.vendor_id = v.id
      WHERE vi.status != 'PAID'
      ORDER BY vi.due_date;
    `);
    console.log('   ✅ aged_payables view created');

    // View 3: Three-Way Match Status
    await pool.query(`
      CREATE OR REPLACE VIEW three_way_match_status AS
      SELECT 
        po.id as po_id,
        po.po_number,
        v.company_name as vendor_name,
        v.vendor_code,
        po.total_amount as po_amount,
        po.status as po_status,
        grn.id as grn_id,
        grn.grn_number,
        grn.received_date,
        grn.status as grn_status,
        vi.id as invoice_id,
        vi.invoice_number,
        vi.internal_reference,
        vi.total_amount as invoice_amount,
        vi.variance_amount,
        vi.match_status,
        vi.status as invoice_status,
        CASE 
          WHEN grn.id IS NULL THEN 'Pending GRN'
          WHEN vi.id IS NULL THEN 'Pending Invoice'
          WHEN vi.variance_amount != 0 AND vi.match_status != 'APPROVED' THEN 'Variance - Needs Approval'
          WHEN vi.match_status = 'MATCHED' OR vi.match_status = 'APPROVED' THEN 'Matched'
          ELSE 'In Progress'
        END as overall_status
      FROM purchase_orders po
      JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN goods_received_notes grn ON po.id = grn.po_id
      LEFT JOIN vendor_invoices vi ON po.id = vi.po_id
      WHERE po.status NOT IN ('DRAFT', 'CANCELLED')
      ORDER BY po.po_date DESC;
    `);
    console.log('   ✅ three_way_match_status view created');

    console.log('✅ Purchase Management migration completed successfully!\n');
  } catch (error) {
    console.error('❌ Purchase Management migration failed:', error);
    throw error;
  }
}
