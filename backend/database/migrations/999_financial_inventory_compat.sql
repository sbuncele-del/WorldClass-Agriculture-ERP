-- Compatibility migration for financial and inventory workspace errors
-- Purpose: add aliases/columns so existing code paths match the live schema
-- Scope: journal_entries, journal_entry_lines, inventory_items
-- Notes: safe to run multiple times (IF NOT EXISTS)

-- Financial: add id/entry_id aliases for journal_entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS id integer GENERATED ALWAYS AS (journal_entry_id) STORED,
  ADD COLUMN IF NOT EXISTS entry_id integer GENERATED ALWAYS AS (journal_entry_id) STORED;

-- Financial: add friendly aliases for journal_entry_lines
ALTER TABLE journal_entry_lines
  ADD COLUMN IF NOT EXISTS id integer GENERATED ALWAYS AS (line_id) STORED,
  ADD COLUMN IF NOT EXISTS debit numeric GENERATED ALWAYS AS (debit_amount) STORED,
  ADD COLUMN IF NOT EXISTS credit numeric GENERATED ALWAYS AS (credit_amount) STORED,
  ADD COLUMN IF NOT EXISTS reconciled boolean GENERATED ALWAYS AS (is_reconciled) STORED;

-- Inventory: add missing columns used by workspace controller
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS category varchar(100),
  ADD COLUMN IF NOT EXISTS quantity_on_hand numeric(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level numeric(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_quantity numeric(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_cost numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
