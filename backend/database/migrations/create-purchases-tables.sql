-- =====================================================
-- Purchase Management Module - Database Schema
-- =====================================================
-- Purpose: Manage supplier invoices and purchases
-- Flow: Supplier Invoice → GL (DR Expense/Inventory, DR VAT Input, CR AP) → Payment via Bank Recon
-- =====================================================

-- =====================================================
-- 1. SUPPLIERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_code VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    
    -- Contact Information
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    website VARCHAR(255),
    
    -- Address Information
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'South Africa',
    
    -- Financial Information
    tax_number VARCHAR(50), -- VAT registration number
    company_registration VARCHAR(50),
    payment_terms_days INTEGER DEFAULT 30,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0, -- How much we owe them
    
    -- GL Account Mapping
    ap_account_id INTEGER, -- Default AP account for this supplier
    expense_account_id INTEGER, -- Default expense account
    
    -- Banking Details (for EFT payments)
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_branch_code VARCHAR(20),
    bank_account_type VARCHAR(50),
    
    -- Status and Classification
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    supplier_category VARCHAR(100),
    supplier_type VARCHAR(50) DEFAULT 'LOCAL' CHECK (supplier_type IN ('LOCAL', 'FOREIGN')),
    is_vat_registered BOOLEAN DEFAULT true,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    
    -- Constraints
    UNIQUE(tenant_id, supplier_code),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (ap_account_id) REFERENCES chart_of_accounts(account_id),
    FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(account_id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_code ON suppliers(tenant_id, supplier_code);
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- =====================================================
-- 2. PURCHASE INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoices (
    invoice_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id INTEGER NOT NULL,
    
    -- Invoice Information
    invoice_number VARCHAR(100) NOT NULL, -- Our internal number
    supplier_invoice_number VARCHAR(100), -- Supplier's invoice number
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    delivery_date DATE,
    
    -- Order Reference
    purchase_order_number VARCHAR(100), -- Optional PO reference
    
    -- Amounts
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    vat_total DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- GL Accounts
    ap_account_id INTEGER NOT NULL, -- Accounts Payable account (2100)
    vat_input_account_id INTEGER, -- VAT Input/Recoverable (1450)
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'POSTED', 'APPROVED', 'PAID', 'CANCELLED', 'DISPUTED')),
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID')),
    
    -- GL Integration
    journal_entry_id INTEGER, -- Link to journal entry created on posting
    posted_at TIMESTAMP,
    posted_by INTEGER,
    
    -- Payment Tracking
    paid_at TIMESTAMP,
    
    -- Additional Information
    reference VARCHAR(255),
    notes TEXT,
    internal_notes TEXT, -- Private notes not shown on documents
    
    -- Attachments
    attachment_urls TEXT[], -- Array of document URLs
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    
    -- Constraints
    UNIQUE(tenant_id, invoice_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    FOREIGN KEY (ap_account_id) REFERENCES chart_of_accounts(account_id),
    FOREIGN KEY (vat_input_account_id) REFERENCES chart_of_accounts(account_id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id),
    FOREIGN KEY (posted_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_purchase_invoices_tenant ON purchase_invoices(tenant_id);
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_number ON purchase_invoices(invoice_number);
CREATE INDEX idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX idx_purchase_invoices_date ON purchase_invoices(invoice_date);
CREATE INDEX idx_purchase_invoices_due_date ON purchase_invoices(due_date);
CREATE INDEX idx_purchase_invoices_journal ON purchase_invoices(journal_entry_id);

-- =====================================================
-- 3. PURCHASE INVOICE LINES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
    line_id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    
    -- Item Information
    description TEXT NOT NULL,
    item_code VARCHAR(100), -- Optional link to inventory
    quantity DECIMAL(15,4) NOT NULL DEFAULT 1,
    unit_of_measure VARCHAR(50) DEFAULT 'EA',
    
    -- Pricing
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL, -- quantity * unit_price
    
    -- Tax
    vat_rate DECIMAL(5,2) DEFAULT 15.00, -- South African standard rate
    vat_amount DECIMAL(15,2) DEFAULT 0,
    
    -- GL Account Mapping (critical for proper posting)
    expense_account_id INTEGER NOT NULL, -- Maps to expense or inventory account
    
    -- Additional Information
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(account_id)
);

CREATE INDEX idx_purchase_invoice_lines_invoice ON purchase_invoice_lines(invoice_id);
CREATE INDEX idx_purchase_invoice_lines_item ON purchase_invoice_lines(item_code);

-- =====================================================
-- 4. SUPPLIER PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_payments (
    payment_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    supplier_id INTEGER NOT NULL,
    invoice_id INTEGER, -- Optional: link to specific invoice
    
    -- Payment Information
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'EFT' CHECK (payment_method IN ('EFT', 'CASH', 'CHEQUE', 'CREDIT_CARD', 'DEBIT_ORDER', 'OTHER')),
    
    -- Bank Reconciliation Link
    bank_statement_line_id INTEGER, -- Link to bank statement
    reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMP,
    
    -- GL Integration
    journal_entry_id INTEGER,
    
    -- Additional Information
    reference VARCHAR(255),
    notes TEXT,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    
    -- Constraints
    UNIQUE(tenant_id, payment_number),
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(invoice_id) ON DELETE SET NULL,
    FOREIGN KEY (bank_statement_line_id) REFERENCES bank_statement_lines(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_supplier_payments_tenant ON supplier_payments(tenant_id);
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_invoice ON supplier_payments(invoice_id);
CREATE INDEX idx_supplier_payments_date ON supplier_payments(payment_date);
CREATE INDEX idx_supplier_payments_bank_line ON supplier_payments(bank_statement_line_id);

-- =====================================================
-- 5. GL POSTING TRIGGER FOR PURCHASE INVOICES
-- =====================================================

CREATE OR REPLACE FUNCTION post_purchase_invoice_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_next_number INTEGER;
    v_tenant_id UUID;
    v_expense_lines RECORD;
BEGIN
    -- Only post when status changes to POSTED
    IF NEW.status = 'POSTED' AND (OLD.status IS NULL OR OLD.status != 'POSTED') THEN
        
        v_tenant_id := NEW.tenant_id;
        
        -- Generate journal entry number
        SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM 'PINV-([0-9]+)') AS INTEGER)), 0) + 1
        INTO v_next_number
        FROM journal_entries
        WHERE tenant_id = v_tenant_id;
        
        v_journal_number := 'PINV-' || LPAD(v_next_number::TEXT, 6, '0');
        
        -- Create journal entry header
        INSERT INTO journal_entries (
            tenant_id, entry_number, entry_date, description, 
            source_type, source_id, status, created_by
        ) VALUES (
            v_tenant_id, v_journal_number, NEW.invoice_date,
            'Purchase Invoice ' || NEW.invoice_number || ' - Supplier: ' || (SELECT supplier_name FROM suppliers WHERE supplier_id = NEW.supplier_id),
            'PURCHASE_INVOICE', NEW.invoice_id, 'posted', NEW.posted_by
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- Create journal entry lines (aggregated by expense account)
        -- DEBIT: Expense/Inventory accounts (one line per account)
        FOR v_expense_lines IN
            SELECT 
                expense_account_id,
                SUM(line_total) as total_expense
            FROM purchase_invoice_lines
            WHERE invoice_id = NEW.invoice_id
            GROUP BY expense_account_id
        LOOP
            INSERT INTO journal_entry_lines (
                entry_id, account_id, debit_amount, credit_amount, 
                description, tenant_id
            ) VALUES (
                v_journal_entry_id,
                v_expense_lines.expense_account_id,
                v_expense_lines.total_expense, -- DEBIT expense
                0,
                'Purchase Invoice ' || NEW.invoice_number,
                v_tenant_id
            );
        END LOOP;
        
        -- DEBIT: VAT Input (recoverable VAT)
        IF NEW.vat_total > 0 AND NEW.vat_input_account_id IS NOT NULL THEN
            INSERT INTO journal_entry_lines (
                entry_id, account_id, debit_amount, credit_amount,
                description, tenant_id
            ) VALUES (
                v_journal_entry_id,
                NEW.vat_input_account_id,
                NEW.vat_total, -- DEBIT VAT Input
                0,
                'VAT Input - ' || NEW.invoice_number,
                v_tenant_id
            );
        END IF;
        
        -- CREDIT: Accounts Payable (we owe the supplier)
        INSERT INTO journal_entry_lines (
            entry_id, account_id, debit_amount, credit_amount,
            description, tenant_id
        ) VALUES (
            v_journal_entry_id,
            NEW.ap_account_id,
            0,
            NEW.total_amount, -- CREDIT AP
            'AP - ' || (SELECT supplier_name FROM suppliers WHERE supplier_id = NEW.supplier_id),
            v_tenant_id
        );
        
        -- Update invoice with journal entry reference
        UPDATE purchase_invoices
        SET journal_entry_id = v_journal_entry_id
        WHERE invoice_id = NEW.invoice_id;
        
        -- Post to GL via existing trigger
        -- (The post_journal_entry_to_gl trigger will fire automatically)
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_post_purchase_invoice_to_gl ON purchase_invoices;

-- Create trigger
CREATE TRIGGER trg_post_purchase_invoice_to_gl
    AFTER INSERT OR UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION post_purchase_invoice_to_gl();

-- =====================================================
-- 6. INSERT DEFAULT ACCOUNTS FOR PURCHASES
-- =====================================================

-- Insert Accounts Payable account if not exists
INSERT INTO chart_of_accounts (
    tenant_id, account_code, account_name, account_type, 
    parent_account_id, is_active, created_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    '2100',
    'Accounts Payable',
    'LIABILITY',
    NULL,
    true,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts 
    WHERE account_code = '2100' 
    AND tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- Insert VAT Input (Recoverable) account if not exists
INSERT INTO chart_of_accounts (
    tenant_id, account_code, account_name, account_type,
    parent_account_id, is_active, created_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    '1450',
    'VAT Input - Recoverable',
    'ASSET',
    NULL,
    true,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts 
    WHERE account_code = '1450'
    AND tenant_id = '00000000-0000-0000-0000-000000000001'
);

-- Insert Office Expenses account if not exists
INSERT INTO chart_of_accounts (
    tenant_id, account_code, account_name, account_type,
    parent_account_id, is_active, created_at
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    '6100',
    'Office Expenses',
    'EXPENSE',
    NULL,
    true,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM chart_of_accounts 
    WHERE account_code = '6100'
    AND tenant_id = '00000000-0000-0000-0000-000000000001'
);

COMMENT ON TABLE suppliers IS 'Supplier/vendor master data';
COMMENT ON TABLE purchase_invoices IS 'Purchase invoices from suppliers - GL posts on POSTED status';
COMMENT ON TABLE purchase_invoice_lines IS 'Line items on purchase invoices with GL account mapping';
COMMENT ON TABLE supplier_payments IS 'Payments made to suppliers';
COMMENT ON FUNCTION post_purchase_invoice_to_gl() IS 'Auto-post purchase invoice to GL: DR Expense/Inventory, DR VAT Input, CR AP';
