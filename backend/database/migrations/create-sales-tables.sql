-- ============================================================================
-- SALES MODULE DATABASE SCHEMA
-- ============================================================================
-- Creates tables for: Customers, Sales Invoices, Invoice Lines, Payments
-- Includes GL account mapping and automatic journal entry posting
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  customer_id SERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'South Africa',
  vat_number VARCHAR(50),
  credit_limit NUMERIC(15, 2) DEFAULT 0,
  payment_terms VARCHAR(50) DEFAULT 'Net 30',
  ar_account_id INTEGER REFERENCES chart_of_accounts(account_id), -- AR account for this customer
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_active ON customers(is_active);

-- Sales Invoices Table
CREATE TABLE IF NOT EXISTS sales_invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, POSTED, SENT, PARTIALLY_PAID, PAID, CANCELLED
  
  -- Amounts
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- GL Integration
  journal_entry_id INTEGER REFERENCES journal_entries(entry_id),
  posted_at TIMESTAMP,
  posted_by UUID REFERENCES users(id),
  
  -- Payment tracking
  paid_at TIMESTAMP,
  payment_reference VARCHAR(100),
  
  -- Metadata
  notes TEXT,
  terms_conditions TEXT,
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_invoices_tenant ON sales_invoices(tenant_id);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX idx_sales_invoices_journal ON sales_invoices(journal_entry_id);

-- Sales Invoice Lines Table
CREATE TABLE IF NOT EXISTS sales_invoice_lines (
  line_id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES sales_invoices(invoice_id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  
  -- Product/Service details
  description TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15, 2) NOT NULL,
  line_total NUMERIC(15, 2) NOT NULL,
  
  -- Tax
  vat_rate NUMERIC(5, 2) DEFAULT 15.00, -- South Africa standard VAT rate
  vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- GL Integration
  revenue_account_id INTEGER REFERENCES chart_of_accounts(account_id), -- Revenue account for this line
  
  -- Metadata
  notes TEXT,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_invoice_lines_invoice ON sales_invoice_lines(invoice_id);
CREATE INDEX idx_sales_invoice_lines_tenant ON sales_invoice_lines(tenant_id);

-- Invoice Payments Table (tracks partial/full payments)
CREATE TABLE IF NOT EXISTS invoice_payments (
  payment_id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES sales_invoices(invoice_id),
  payment_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method VARCHAR(50), -- CASH, BANK_TRANSFER, CARD, CHEQUE
  reference VARCHAR(100),
  
  -- Bank reconciliation link
  bank_statement_line_id INTEGER REFERENCES bank_statement_lines(id),
  journal_entry_id INTEGER REFERENCES journal_entries(entry_id),
  
  notes TEXT,
  tenant_id UUID NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_tenant ON invoice_payments(tenant_id);
CREATE INDEX idx_invoice_payments_date ON invoice_payments(payment_date);

-- ============================================================================
-- TRIGGER: Auto-post Sales Invoice to GL
-- ============================================================================
-- When invoice status changes to 'POSTED', automatically create journal entry
-- and GL transactions for AR (debit), Revenue (credit), and VAT (credit)
-- ============================================================================

CREATE OR REPLACE FUNCTION post_sales_invoice_to_gl()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_entry_id INTEGER;
  v_customer_name VARCHAR(255);
  v_ar_account_id INTEGER;
  v_vat_account_id INTEGER;
  v_line RECORD;
BEGIN
  -- Only process if status changed to POSTED and not already posted
  IF NEW.status = 'POSTED' AND (OLD IS NULL OR OLD.status != 'POSTED') AND NEW.journal_entry_id IS NULL THEN
    
    -- Get customer details
    SELECT customer_name, ar_account_id INTO v_customer_name, v_ar_account_id
    FROM customers WHERE customer_id = NEW.customer_id;
    
    -- Get VAT payable account (2500 - standard VAT account)
    SELECT account_id INTO v_vat_account_id
    FROM chart_of_accounts
    WHERE account_code = '2500' AND tenant_id = NEW.tenant_id
    LIMIT 1;
    
    -- If no VAT account, use default liability account
    IF v_vat_account_id IS NULL THEN
      SELECT account_id INTO v_vat_account_id
      FROM chart_of_accounts
      WHERE account_type = 'LIABILITY' AND is_active = true AND tenant_id = NEW.tenant_id
      ORDER BY account_code
      LIMIT 1;
    END IF;
    
    -- Default AR account if customer doesn't have one (1200 - Accounts Receivable)
    IF v_ar_account_id IS NULL THEN
      SELECT account_id INTO v_ar_account_id
      FROM chart_of_accounts
      WHERE account_code = '1200' AND tenant_id = NEW.tenant_id
      LIMIT 1;
    END IF;
    
    -- Create journal entry
    INSERT INTO journal_entries (
      entry_number, entry_date, description, reference, status, tenant_id, created_at
    )
    VALUES (
      'INV-' || NEW.invoice_number,
      NEW.invoice_date,
      'Sales Invoice - ' || v_customer_name,
      NEW.reference,
      'posted',
      NEW.tenant_id,
      NOW()
    )
    RETURNING entry_id INTO v_journal_entry_id;
    
    -- Update invoice with journal entry reference
    UPDATE sales_invoices 
    SET journal_entry_id = v_journal_entry_id, posted_at = NOW()
    WHERE invoice_id = NEW.invoice_id;
    
    -- Debit AR (total including VAT)
    INSERT INTO journal_entry_lines (
      entry_id, account_id, description, debit_amount, credit_amount, tenant_id
    )
    VALUES (
      v_journal_entry_id,
      v_ar_account_id,
      'Accounts Receivable - ' || v_customer_name || ' - ' || NEW.invoice_number,
      NEW.total_amount,
      0,
      NEW.tenant_id
    );
    
    -- Credit Revenue accounts (one line per invoice line)
    FOR v_line IN 
      SELECT 
        COALESCE(revenue_account_id, (
          SELECT account_id FROM chart_of_accounts 
          WHERE account_code = '4100' AND tenant_id = NEW.tenant_id LIMIT 1
        )) as rev_account,
        description,
        line_total,
        line_number
      FROM sales_invoice_lines
      WHERE invoice_id = NEW.invoice_id
    LOOP
      INSERT INTO journal_entry_lines (
        entry_id, account_id, description, debit_amount, credit_amount, tenant_id
      )
      VALUES (
        v_journal_entry_id,
        v_line.rev_account,
        v_line.description,
        0,
        v_line.line_total,
        NEW.tenant_id
      );
    END LOOP;
    
    -- Credit VAT Payable (if VAT > 0)
    IF NEW.vat_amount > 0 THEN
      INSERT INTO journal_entry_lines (
        entry_id, account_id, description, debit_amount, credit_amount, tenant_id
      )
      VALUES (
        v_journal_entry_id,
        v_vat_account_id,
        'VAT Payable - ' || NEW.invoice_number,
        0,
        NEW.vat_amount,
        NEW.tenant_id
      );
    END IF;
    
    -- The existing GL posting trigger on journal_entries will handle posting to GL
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_post_sales_invoice_to_gl ON sales_invoices;
CREATE TRIGGER trigger_post_sales_invoice_to_gl
  AFTER INSERT OR UPDATE ON sales_invoices
  FOR EACH ROW
  EXECUTE FUNCTION post_sales_invoice_to_gl();

-- ============================================================================
-- DEFAULT DATA: Sample Accounts for VAT
-- ============================================================================
-- Add VAT Payable account if it doesn't exist
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_vat_account_exists BOOLEAN;
BEGIN
  -- Get first tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  -- Check if VAT account exists
  SELECT EXISTS(
    SELECT 1 FROM chart_of_accounts 
    WHERE account_code = '2500'
  ) INTO v_vat_account_exists;
  
  -- Create VAT Payable account if it doesn't exist
  IF NOT v_vat_account_exists THEN
    INSERT INTO chart_of_accounts (
      account_code, account_name, account_type, description,
      is_active, is_system_account, tenant_id, created_at
    )
    VALUES (
      '2500',
      'VAT Payable',
      'LIABILITY',
      'Value Added Tax (VAT) payable to SARS - 15% standard rate',
      true,
      true,
      v_tenant_id,
      NOW()
    );
    
    RAISE NOTICE 'Created VAT Payable account (2500)';
  END IF;
END $$;

COMMENT ON TABLE customers IS 'Customer master data with AR account mapping';
COMMENT ON TABLE sales_invoices IS 'Sales invoices with automatic GL posting when status = POSTED';
COMMENT ON TABLE sales_invoice_lines IS 'Invoice line items with revenue account mapping';
COMMENT ON TABLE invoice_payments IS 'Invoice payment tracking and reconciliation';
COMMENT ON FUNCTION post_sales_invoice_to_gl() IS 'Auto-creates journal entry and posts to GL when invoice is marked as POSTED';
