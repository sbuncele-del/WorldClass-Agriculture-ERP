-- Invoices Table for Billing System
-- Tracks all invoices generated for subscription payments

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  s3_url TEXT,
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  retry_count INTEGER DEFAULT 0,
  next_retry_date TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT invoice_tenant_number_unique UNIQUE(tenant_id, invoice_number)
);

-- Indexes for invoice lookups
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invoices_next_retry ON invoices(next_retry_date) WHERE next_retry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_transaction_id ON invoices(payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE invoices IS 'Subscription invoices for billing management';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (INV-YYYYMMDD-XXXXX)';
COMMENT ON COLUMN invoices.amount IS 'Invoice amount in specified currency';
COMMENT ON COLUMN invoices.currency IS 'Currency code (ZAR or USD)';
COMMENT ON COLUMN invoices.status IS 'Invoice payment status';
COMMENT ON COLUMN invoices.due_date IS 'Date when payment is due';
COMMENT ON COLUMN invoices.paid_at IS 'Timestamp when invoice was paid';
COMMENT ON COLUMN invoices.s3_url IS 'S3 location of PDF invoice';
COMMENT ON COLUMN invoices.payment_transaction_id IS 'Reference to payment transaction';
COMMENT ON COLUMN invoices.retry_count IS 'Number of payment retry attempts';
COMMENT ON COLUMN invoices.next_retry_date IS 'Date of next payment retry attempt';
COMMENT ON COLUMN invoices.failure_reason IS 'Reason for payment failure';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();
