-- =====================================================
-- HR PAYROLL GL POSTING FUNCTION
-- =====================================================
-- Purpose: Automatically post payroll to GL when status changes to 'Posted'
-- Flow: Payroll Run → GL (DR Salaries/Contributions, CR PAYE/UIF/Bank)
-- =====================================================

-- Function to post payroll run to GL
CREATE OR REPLACE FUNCTION post_payroll_run_to_gl()
RETURNS TRIGGER AS $$
DECLARE
  v_journal_entry_id INTEGER;
  v_total_salaries DECIMAL(15,2);
  v_total_paye DECIMAL(15,2);
  v_total_uif_employee DECIMAL(15,2);
  v_total_uif_employer DECIMAL(15,2);
  v_total_sdl DECIMAL(15,2);
  v_total_net_pay DECIMAL(15,2);
  v_total_employer_cost DECIMAL(15,2);
BEGIN
  -- Only post when status changes to 'Posted'
  IF NEW.status = 'Posted' AND (OLD.status IS NULL OR OLD.status != 'Posted') THEN
    
    -- Calculate totals from payroll_items
    SELECT 
      COALESCE(SUM(gross_pay), 0),
      COALESCE(SUM(paye_tax), 0),
      COALESCE(SUM(uif_employee), 0),
      COALESCE(SUM(uif_employer), 0),
      COALESCE(SUM(sdl_contribution), 0),
      COALESCE(SUM(net_pay), 0),
      COALESCE(SUM(total_employer_cost), 0)
    INTO 
      v_total_salaries,
      v_total_paye,
      v_total_uif_employee,
      v_total_uif_employer,
      v_total_sdl,
      v_total_net_pay,
      v_total_employer_cost
    FROM payroll_items
    WHERE run_id = NEW.run_id;

    -- Create journal entry
    INSERT INTO journal_entries (
      tenant_id, entry_number, entry_date, description, status, created_at
    ) VALUES (
      NEW.tenant_id,
      'JE-PAY-' || NEW.run_id,
      NEW.run_date::DATE,
      'Payroll: ' || NEW.run_number || ' (' || NEW.employee_count || ' employees)',
      'posted',
      CURRENT_TIMESTAMP
    ) RETURNING entry_id INTO v_journal_entry_id;

    -- DR: Salaries & Wages Expense (6100)
    IF v_total_salaries > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id,
        transaction_date, posting_date, description,
        source_type, source_id,
        debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6100' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries & Wages - ' || NEW.run_number,
        'PAYROLL', NEW.run_id,
        v_total_salaries, 0, CURRENT_TIMESTAMP
      );
    END IF;

    -- DR: Employer Contributions Expense (6200) - UIF + SDL
    IF (v_total_uif_employer + v_total_sdl) > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id,
        transaction_date, posting_date, description,
        source_type, source_id,
        debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6200' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'Employer Contributions - ' || NEW.run_number,
        'PAYROLL', NEW.run_id,
        (v_total_uif_employer + v_total_sdl), 0, CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: PAYE Payable (2200)
    IF v_total_paye > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id,
        transaction_date, posting_date, description,
        source_type, source_id,
        debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2200' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'PAYE Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id,
        0, v_total_paye, CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: UIF Payable (2210) - Employee + Employer
    IF (v_total_uif_employee + v_total_uif_employer) > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id,
        transaction_date, posting_date, description,
        source_type, source_id,
        debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2210' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'UIF Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id,
        0, (v_total_uif_employee + v_total_uif_employer), CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: SDL Payable (included in UIF for simplicity, or create separate 2215)
    -- (SDL is already included in employer contributions above)

    -- CR: Salaries Payable / Accrued Wages (2250)
    -- This represents the net amount owed to employees
    IF v_total_net_pay > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id,
        transaction_date, posting_date, description,
        source_type, source_id,
        debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2250' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id,
        0, v_total_net_pay, CURRENT_TIMESTAMP
      );
    END IF;

    -- Update payroll run with journal entry reference
    UPDATE payroll_runs
    SET journal_entry_id = v_journal_entry_id,
        posted_to_gl = true,
        posted_at = CURRENT_TIMESTAMP
    WHERE run_id = NEW.run_id;

    RAISE NOTICE 'Payroll posted to GL: Journal Entry % created', v_journal_entry_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_post_payroll_run ON payroll_runs;
CREATE TRIGGER trg_post_payroll_run
  AFTER UPDATE ON payroll_runs
  FOR EACH ROW
  EXECUTE FUNCTION post_payroll_run_to_gl();

-- Add required GL accounts if they don't exist
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, parent_code, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '2200', 'PAYE Payable', 'LIABILITY', '2000', true),
  ('00000000-0000-0000-0000-000000000001', '2210', 'UIF Payable', 'LIABILITY', '2000', true),
  ('00000000-0000-0000-0000-000000000001', '2250', 'Salaries Payable', 'LIABILITY', '2000', true),
  ('00000000-0000-0000-0000-000000000001', '6200', 'Employer Contributions', 'EXPENSE', '6000', true)
ON CONFLICT (tenant_id, account_code) DO NOTHING;

SELECT 'HR Payroll GL Posting Function Created Successfully!' AS result;
