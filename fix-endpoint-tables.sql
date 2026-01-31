-- Fix remaining broken endpoint table issues

-- 1. Create view for recurring_journal_entries -> recurring_entries
CREATE OR REPLACE VIEW recurring_journal_entries AS 
SELECT 
    id,
    tenant_id,
    name as entry_name,
    description,
    frequency,
    start_date,
    end_date,
    next_run_date as next_occurrence,
    amount,
    debit_account_id,
    credit_account_id,
    status,
    CASE WHEN status = 'active' THEN true ELSE false END as is_active,
    last_run_date as last_occurrence,
    created_at,
    updated_at,
    created_by,
    updated_by
FROM recurring_entries;

-- 2. Create recurring_journal_entry_lines table if not exists
CREATE TABLE IF NOT EXISTS recurring_journal_entry_lines (
    id SERIAL PRIMARY KEY,
    recurring_entry_id UUID,
    account_id UUID,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    line_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create recurring_entry_history table if not exists
CREATE TABLE IF NOT EXISTS recurring_entry_history (
    id SERIAL PRIMARY KEY,
    recurring_entry_id UUID,
    generated_date DATE,
    journal_entry_id INTEGER,
    amount DECIMAL(15,2),
    status VARCHAR(30) DEFAULT 'SUCCESS',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 4. Fix projects table ambiguous tenant_id by checking for alias
-- First check if it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_tenant_id') THEN
        ALTER TABLE projects ADD COLUMN project_tenant_id UUID;
        UPDATE projects SET project_tenant_id = tenant_id;
    END IF;
END $$;

-- 5. Add missing columns to compliance_policies if they don't exist
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS framework_id INTEGER;
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS review_frequency VARCHAR(50);
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS last_review_date DATE;
ALTER TABLE compliance_policies ADD COLUMN IF NOT EXISTS next_review_date DATE;

-- 6. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_recurring_lines_entry ON recurring_journal_entry_lines(recurring_entry_id);
CREATE INDEX IF NOT EXISTS idx_recurring_history_entry ON recurring_entry_history(recurring_entry_id);

SELECT 'Final endpoint fixes complete' as status;
