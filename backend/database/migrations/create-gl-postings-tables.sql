-- General Ledger Posting System
-- This creates the foundation for real-time financial reporting

-- GL Transactions (every debit/credit posted to accounts)
CREATE TABLE IF NOT EXISTS gl_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(account_id),
  journal_entry_id INTEGER REFERENCES journal_entries(entry_id),
  journal_line_id INTEGER REFERENCES journal_entry_lines(line_id),
  source_type VARCHAR(50) NOT NULL, -- 'JOURNAL_ENTRY', 'BANK_RECONCILIATION', 'INVOICE', 'PAYMENT', etc.
  source_id INTEGER,
  description TEXT,
  reference_number VARCHAR(100),
  debit_amount NUMERIC(15, 2) DEFAULT 0.00,
  credit_amount NUMERIC(15, 2) DEFAULT 0.00,
  running_balance NUMERIC(15, 2) DEFAULT 0.00,
  fiscal_period_id INTEGER,
  tenant_id UUID NOT NULL,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  posted_by INTEGER,
  posted_at TIMESTAMP,
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_by INTEGER,
  reversed_at TIMESTAMP,
  reversal_reference VARCHAR(100)
);

CREATE INDEX idx_gl_trans_account ON gl_transactions(account_id, transaction_date);
CREATE INDEX idx_gl_trans_date ON gl_transactions(transaction_date);
CREATE INDEX idx_gl_trans_journal ON gl_transactions(journal_entry_id);
CREATE INDEX idx_gl_trans_tenant ON gl_transactions(tenant_id);
CREATE INDEX idx_gl_trans_source ON gl_transactions(source_type, source_id);

-- Account Balances (current balances for each account)
CREATE TABLE IF NOT EXISTS account_balances (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(account_id),
  tenant_id UUID NOT NULL,
  current_balance NUMERIC(15, 2) DEFAULT 0.00,
  ytd_debit NUMERIC(15, 2) DEFAULT 0.00,
  ytd_credit NUMERIC(15, 2) DEFAULT 0.00,
  last_transaction_date DATE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, tenant_id)
);

CREATE INDEX idx_account_bal_account ON account_balances(account_id);
CREATE INDEX idx_account_bal_tenant ON account_balances(tenant_id);

-- Period Balances (for trial balance by period)
CREATE TABLE IF NOT EXISTS period_balances (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES chart_of_accounts(account_id),
  tenant_id UUID NOT NULL,
  fiscal_year INTEGER NOT NULL,
  fiscal_period INTEGER NOT NULL, -- 1-12 for monthly, 1-4 for quarterly
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  opening_balance NUMERIC(15, 2) DEFAULT 0.00,
  period_debit NUMERIC(15, 2) DEFAULT 0.00,
  period_credit NUMERIC(15, 2) DEFAULT 0.00,
  closing_balance NUMERIC(15, 2) DEFAULT 0.00,
  is_closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMP,
  closed_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, tenant_id, fiscal_year, fiscal_period)
);

CREATE INDEX idx_period_bal_account ON period_balances(account_id);
CREATE INDEX idx_period_bal_period ON period_balances(fiscal_year, fiscal_period);
CREATE INDEX idx_period_bal_tenant ON period_balances(tenant_id);

-- Posting Audit Log (track all GL posting operations)
CREATE TABLE IF NOT EXISTS gl_posting_log (
  id SERIAL PRIMARY KEY,
  posting_batch_id UUID NOT NULL,
  journal_entry_id INTEGER REFERENCES journal_entries(entry_id),
  transactions_posted INTEGER DEFAULT 0,
  total_debits NUMERIC(15, 2) DEFAULT 0.00,
  total_credits NUMERIC(15, 2) DEFAULT 0.00,
  posting_status VARCHAR(20) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, REVERSED
  error_message TEXT,
  posted_by INTEGER,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reversed_at TIMESTAMP,
  reversed_by INTEGER
);

CREATE INDEX idx_posting_log_batch ON gl_posting_log(posting_batch_id);
CREATE INDEX idx_posting_log_journal ON gl_posting_log(journal_entry_id);
CREATE INDEX idx_posting_log_date ON gl_posting_log(posted_at);

-- Function to automatically post journal entry to GL
CREATE OR REPLACE FUNCTION post_journal_entry_to_gl()
RETURNS TRIGGER AS $$
DECLARE
  v_batch_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Only post if status is 'posted'
  IF NEW.status = 'posted' AND (OLD IS NULL OR OLD.status != 'posted') THEN
    
    -- Generate batch ID
    v_batch_id := gen_random_uuid();
    
    -- Get tenant_id from first journal line (assuming all lines have same tenant)
    SELECT tenant_id INTO v_tenant_id FROM journal_entry_lines WHERE entry_id = NEW.entry_id LIMIT 1;
    
    -- Insert GL transactions for each journal entry line
    INSERT INTO gl_transactions (
      transaction_date, posting_date, account_id, journal_entry_id, journal_line_id,
      source_type, source_id, description, reference_number,
      debit_amount, credit_amount, tenant_id, posted_at, posted_by
    )
    SELECT
      NEW.entry_date,
      CURRENT_DATE,
      jel.account_id,
      NEW.entry_id,
      jel.line_id,
      'JOURNAL_ENTRY',
      NEW.entry_id,
      jel.description,
      NEW.reference,
      jel.debit_amount,
      jel.credit_amount,
      jel.tenant_id,
      NOW(),
      NEW.created_by
    FROM journal_entry_lines jel
    WHERE jel.entry_id = NEW.entry_id;
    
    -- Update account balances
    INSERT INTO account_balances (account_id, tenant_id, current_balance, ytd_debit, ytd_credit, last_transaction_date)
    SELECT
      jel.account_id,
      jel.tenant_id,
      COALESCE(ab.current_balance, 0) + jel.debit_amount - jel.credit_amount,
      COALESCE(ab.ytd_debit, 0) + jel.debit_amount,
      COALESCE(ab.ytd_credit, 0) + jel.credit_amount,
      NEW.entry_date
    FROM journal_entry_lines jel
    LEFT JOIN account_balances ab ON ab.account_id = jel.account_id AND ab.tenant_id = jel.tenant_id
    WHERE jel.entry_id = NEW.entry_id
    ON CONFLICT (account_id, tenant_id) DO UPDATE SET
      current_balance = account_balances.current_balance + EXCLUDED.ytd_debit - EXCLUDED.ytd_credit,
      ytd_debit = account_balances.ytd_debit + EXCLUDED.ytd_debit - COALESCE((SELECT ytd_debit FROM account_balances WHERE account_id = EXCLUDED.account_id AND tenant_id = EXCLUDED.tenant_id), 0),
      ytd_credit = account_balances.ytd_credit + EXCLUDED.ytd_credit - COALESCE((SELECT ytd_credit FROM account_balances WHERE account_id = EXCLUDED.account_id AND tenant_id = EXCLUDED.tenant_id), 0),
      last_transaction_date = EXCLUDED.last_transaction_date,
      last_updated = NOW();
    
    -- Log posting
    INSERT INTO gl_posting_log (posting_batch_id, journal_entry_id, transactions_posted, total_debits, total_credits, posted_by)
    SELECT
      v_batch_id,
      NEW.entry_id,
      COUNT(*),
      SUM(debit_amount),
      SUM(credit_amount),
      NEW.created_by
    FROM journal_entry_lines
    WHERE entry_id = NEW.entry_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on journal_entries
DROP TRIGGER IF EXISTS trigger_post_to_gl ON journal_entries;
CREATE TRIGGER trigger_post_to_gl
  AFTER INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION post_journal_entry_to_gl();

COMMENT ON TABLE gl_transactions IS 'All financial transactions posted to GL accounts - foundation for all financial reporting';
COMMENT ON TABLE account_balances IS 'Current balance for each GL account - updated in real-time as transactions post';
COMMENT ON TABLE period_balances IS 'Period-by-period balances for trial balance and financial statements';
COMMENT ON TABLE gl_posting_log IS 'Audit trail of all GL posting operations';
