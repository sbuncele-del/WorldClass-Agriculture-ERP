-- GL Postings Table - Tracks which documents have been posted to General Ledger
-- This creates an audit trail linking source documents to their journal entries

CREATE TABLE IF NOT EXISTS gl_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source document reference
    source_type VARCHAR(50) NOT NULL, -- SALES_INVOICE, PURCHASE_BILL, PAYROLL, INVENTORY_MOVEMENT, etc.
    source_id UUID NOT NULL,
    
    -- Journal entry reference
    journal_entry_id UUID NOT NULL,
    
    -- Posting metadata
    posted_by UUID NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Reversal tracking
    reversed BOOLEAN DEFAULT FALSE,
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversed_by UUID,
    reversing_journal_id UUID,
    reversal_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_source_posting UNIQUE (tenant_id, source_type, source_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_gl_postings_tenant ON gl_postings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gl_postings_source ON gl_postings(tenant_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_gl_postings_journal ON gl_postings(journal_entry_id);

-- Add GL posting columns to sales_invoices if they don't exist
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gl_posted BOOLEAN DEFAULT FALSE;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gl_posted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gl_journal_id UUID;

-- Add GL posting columns to purchase_invoices if they don't exist
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS gl_posted BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS gl_posted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS gl_journal_id UUID;

-- Add GL posting columns to payroll_runs if they don't exist
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS gl_posted BOOLEAN DEFAULT FALSE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS gl_posted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS gl_journal_id UUID;

-- Comment
COMMENT ON TABLE gl_postings IS 'Tracks GL postings from source documents to journal entries for audit trail';
