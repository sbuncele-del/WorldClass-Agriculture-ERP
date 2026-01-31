-- Sample data for Cash Management testing
-- Run with: PGPASSWORD='caxMex-0putca-dyjnah' psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -f sample-cash-data.sql

-- Get tenant_id for use in inserts
DO $$
DECLARE
  v_tenant_id UUID;
  v_bank_id INTEGER;
  v_bank_account_id INTEGER;
  v_statement_id INTEGER;
  v_journal_id INTEGER;
  v_acc_bank INTEGER;        -- 1100 - Bank Accounts
  v_acc_ar INTEGER;          -- 1200 - Accounts Receivable  
  v_acc_ap INTEGER;          -- 2100 - Accounts Payable
  v_acc_revenue INTEGER;     -- 4100 - Sales Revenue
  v_acc_rent_exp INTEGER;    -- 6200 - Rent Expense
BEGIN
  -- Get first tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  -- Get GL account IDs by account code (accounts should already exist from seed)
  SELECT account_id INTO v_acc_bank FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1;
  SELECT account_id INTO v_acc_ar FROM chart_of_accounts WHERE account_code = '1200' LIMIT 1;
  SELECT account_id INTO v_acc_ap FROM chart_of_accounts WHERE account_code = '2100' LIMIT 1;
  SELECT account_id INTO v_acc_revenue FROM chart_of_accounts WHERE account_code = '4100' LIMIT 1;
  SELECT account_id INTO v_acc_rent_exp FROM chart_of_accounts WHERE account_code = '6200' LIMIT 1;
  
  -- Verify accounts exist
  IF v_acc_bank IS NULL OR v_acc_revenue IS NULL THEN
    RAISE EXCEPTION 'Required GL accounts not found. Run chart of accounts seed first.';
  END IF;
  
  -- Get or create bank
  SELECT id INTO v_bank_id FROM banks WHERE bank_name = 'First National Bank' LIMIT 1;
  IF v_bank_id IS NULL THEN
    INSERT INTO banks (bank_name, short_name, bank_code, swift_code, country_code, is_active, created_at, updated_at)
    VALUES ('First National Bank', 'FNB', '250655', 'FIRNZAJJ', 'ZA', true, NOW(), NOW())
    RETURNING id INTO v_bank_id;
  END IF;

  -- Insert bank account
  INSERT INTO bank_accounts (
    bank_id, account_name, account_number, account_type, 
    currency_code, gl_account_code, current_balance, is_active,
    created_at, updated_at
  ) VALUES (
    v_bank_id, 'FNB Business Cheque Account', '62123456789', 'CURRENT',
    'ZAR', '1100', 125450.75, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_bank_account_id;

  -- Insert bank statement
  INSERT INTO bank_statements (
    bank_account_id, statement_number, statement_date,
    from_date, to_date, opening_balance, closing_balance,
    created_at, updated_at
  ) VALUES (
    v_bank_account_id, 'STMT-2025-11-001', '2025-11-30',
    '2025-11-01', '2025-11-30', 120000.00, 125450.75,
    NOW(), NOW()
  )
  RETURNING id INTO v_statement_id;

  -- Insert bank statement lines (10 transactions)
  -- Credits (deposits)
  INSERT INTO bank_statement_lines (
    bank_statement_id, line_number, transaction_date, description, reference_number,
    debit_amount, credit_amount, balance, transaction_type, status,
    tenant_id, created_at, updated_at
  ) VALUES
  (v_statement_id, 1, '2025-11-01', 'Customer Payment - ABC Corp', 'PMT-001234', 
   0, 15000.00, 135000.00, 'CREDIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 2, '2025-11-02', 'Customer Payment - XYZ Ltd', 'PMT-001235',
   0, 8500.50, 143500.50, 'CREDIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 3, '2025-11-05', 'Customer Payment - DEF Traders', 'PMT-001240',
   0, 12350.25, 155850.75, 'CREDIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 4, '2025-11-08', 'Refund from Supplier', 'REF-789',
   0, 2500.00, 158350.75, 'CREDIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 5, '2025-11-12', 'Customer Payment - GHI Industries', 'PMT-001245',
   0, 7500.00, 165850.75, 'CREDIT', 'UNMATCHED', v_tenant_id, NOW(), NOW());

  -- Debits (payments)
  INSERT INTO bank_statement_lines (
    bank_statement_id, line_number, transaction_date, description, reference_number,
    debit_amount, credit_amount, balance, transaction_type, status,
    tenant_id, created_at, updated_at
  ) VALUES
  (v_statement_id, 6, '2025-11-03', 'Supplier Payment - Office Supplies Ltd', 'PAY-5001',
   5000.00, 0, 138500.50, 'DEBIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 7, '2025-11-06', 'Rent Payment - November', 'PAY-5002',
   25000.00, 0, 130850.75, 'DEBIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 8, '2025-11-10', 'Supplier Payment - Equipment Supplier', 'PAY-5003',
   9850.00, 0, 148500.75, 'DEBIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 9, '2025-11-11', 'Bank Charges', 'CHRG-NOV',
   50.00, 0, 148450.75, 'DEBIT', 'UNMATCHED', v_tenant_id, NOW(), NOW()),
  
  (v_statement_id, 10, '2025-11-15', 'Utilities Payment', 'PAY-5004',
   1500.00, 0, 146950.75, 'DEBIT', 'UNMATCHED', v_tenant_id, NOW(), NOW());

  -- Insert journal entries for matching
  -- Create a journal entry for ABC Corp payment (matches bank line 1)
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-001', '2025-11-01', 'Customer Receipt - ABC Corp', 'INV-123', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_bank, 'Customer Receipt - ABC Corp Invoice #INV-123', 15000.00, 0, v_tenant_id, false),
  (v_journal_id, v_acc_revenue, 'Sales Revenue - ABC Corp', 0, 15000.00, v_tenant_id, false);

  -- Journal entry for XYZ Ltd (matches bank line 2)
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-002', '2025-11-02', 'Customer Receipt - XYZ Ltd', 'INV-124', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_bank, 'Customer Receipt - XYZ Ltd Invoice #INV-124', 8500.50, 0, v_tenant_id, false),
  (v_journal_id, v_acc_revenue, 'Sales Revenue - XYZ Ltd', 0, 8500.50, v_tenant_id, false);

  -- Journal entry for supplier payment (matches bank line 6)
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-003', '2025-11-03', 'Supplier Payment - Office Supplies', 'PAY-5001', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_ap, 'Accounts Payable - Office Supplies Ltd', 5000.00, 0, v_tenant_id, false),
  (v_journal_id, v_acc_bank, 'Bank Account - FNB', 0, 5000.00, v_tenant_id, false);

  -- Journal entry for rent payment (matches bank line 7)
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-004', '2025-11-06', 'Rent Payment - November', 'PAY-5002', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_rent_exp, 'Rent Expense', 25000.00, 0, v_tenant_id, false),
  (v_journal_id, v_acc_bank, 'Bank Account - FNB', 0, 25000.00, v_tenant_id, false);

  -- Multi-line match scenario: DEF Traders payment (12350.25) split across two invoices
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-005', '2025-11-05', 'DEF Traders - Invoice #INV-200', 'INV-200', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_bank, 'Customer Receipt - DEF Traders INV-200', 7000.00, 0, v_tenant_id, false),
  (v_journal_id, v_acc_revenue, 'Sales Revenue - DEF Traders', 0, 7000.00, v_tenant_id, false);

  -- Second invoice for DEF Traders
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-006', '2025-11-05', 'DEF Traders - Invoice #INV-201', 'INV-201', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_bank, 'Customer Receipt - DEF Traders INV-201', 5350.25, 0, v_tenant_id, false),
  (v_journal_id, v_acc_revenue, 'Sales Revenue - DEF Traders', 0, 5350.25, v_tenant_id, false);

  -- Partial match scenario: GHI Industries paid 7500 but invoice was 7550 (50 bank fee)
  INSERT INTO journal_entries (
    entry_number, entry_date, description, reference, status, created_at
  ) VALUES
  ('JNL-2025-11-007', '2025-11-12', 'GHI Industries - Invoice #INV-250', 'INV-250', 'posted', NOW())
  RETURNING entry_id INTO v_journal_id;

  INSERT INTO journal_entry_lines (
    entry_id, account_id, description, debit_amount, credit_amount,
    tenant_id, is_reconciled
  ) VALUES
  (v_journal_id, v_acc_bank, 'Customer Receipt - GHI Industries INV-250', 7550.00, 0, v_tenant_id, false),
  (v_journal_id, v_acc_revenue, 'Sales Revenue - GHI Industries', 0, 7550.00, v_tenant_id, false);

  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Bank Account ID: %', v_bank_account_id;
  RAISE NOTICE 'Statement ID: %', v_statement_id;
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  
END $$;
