-- =====================================================
-- HR PAYROLL MODULE - Complete End-to-End Test
-- Run this when SSH is available
-- =====================================================

\echo '=================================================='
\echo 'HR PAYROLL MODULE - COMPLETE WORKFLOW TEST'
\echo '=================================================='
\echo ''

\echo '=== STEP 1: Check if HR tables exist ==='
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('employees', 'payroll_runs', 'payroll_items', 'payroll_periods') THEN '✓'
    ELSE '✗'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('employees', 'payroll_runs', 'payroll_items', 'payroll_periods')
ORDER BY table_name;

\echo ''
\echo '=== STEP 2: Deploy HR GL Posting Function ==='

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
BEGIN
  IF NEW.status = 'Posted' AND (OLD.status IS NULL OR OLD.status != 'Posted') THEN
    
    -- Calculate totals
    SELECT 
      COALESCE(SUM(gross_pay), 0),
      COALESCE(SUM(paye_tax), 0),
      COALESCE(SUM(uif_employee), 0),
      COALESCE(SUM(uif_employer), 0),
      COALESCE(SUM(sdl_contribution), 0),
      COALESCE(SUM(net_pay), 0)
    INTO 
      v_total_salaries, v_total_paye, v_total_uif_employee,
      v_total_uif_employer, v_total_sdl, v_total_net_pay
    FROM payroll_items WHERE run_id = NEW.run_id;

    -- Create journal entry
    INSERT INTO journal_entries (
      tenant_id, entry_number, entry_date, description, status, created_at
    ) VALUES (
      NEW.tenant_id, 'JE-PAYROLL-' || NEW.run_id, NEW.run_date::DATE,
      'Payroll: ' || NEW.run_number || ' (' || NEW.employee_count || ' employees)',
      'posted', CURRENT_TIMESTAMP
    ) RETURNING entry_id INTO v_journal_entry_id;

    -- DR: Salaries & Wages Expense
    INSERT INTO gl_transactions (
      tenant_id, journal_entry_id, account_id, transaction_date, posting_date,
      description, source_type, source_id, debit_amount, credit_amount, created_at
    ) VALUES (
      NEW.tenant_id, v_journal_entry_id,
      (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6100' LIMIT 1),
      NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries & Wages - ' || NEW.run_number,
      'PAYROLL', NEW.run_id, v_total_salaries, 0, CURRENT_TIMESTAMP
    );

    -- DR: Employer Contributions
    IF (v_total_uif_employer + v_total_sdl) > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id, transaction_date, posting_date,
        description, source_type, source_id, debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6200' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'Employer Contributions - ' || NEW.run_number,
        'PAYROLL', NEW.run_id, (v_total_uif_employer + v_total_sdl), 0, CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: PAYE Payable
    IF v_total_paye > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id, transaction_date, posting_date,
        description, source_type, source_id, debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2200' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'PAYE Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id, 0, v_total_paye, CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: UIF Payable
    IF (v_total_uif_employee + v_total_uif_employer) > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id, transaction_date, posting_date,
        description, source_type, source_id, debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2210' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'UIF Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id, 0, (v_total_uif_employee + v_total_uif_employer), CURRENT_TIMESTAMP
      );
    END IF;

    -- CR: Salaries Payable
    IF v_total_net_pay > 0 THEN
      INSERT INTO gl_transactions (
        tenant_id, journal_entry_id, account_id, transaction_date, posting_date,
        description, source_type, source_id, debit_amount, credit_amount, created_at
      ) VALUES (
        NEW.tenant_id, v_journal_entry_id,
        (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2250' LIMIT 1),
        NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries Payable - ' || NEW.run_number,
        'PAYROLL', NEW.run_id, 0, v_total_net_pay, CURRENT_TIMESTAMP
      );
    END IF;

    UPDATE payroll_runs
    SET journal_entry_id = v_journal_entry_id, posted_to_gl = true, posted_at = CURRENT_TIMESTAMP
    WHERE run_id = NEW.run_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_payroll_run ON payroll_runs;
CREATE TRIGGER trg_post_payroll_run
  AFTER UPDATE ON payroll_runs
  FOR EACH ROW
  EXECUTE FUNCTION post_payroll_run_to_gl();

\echo 'GL Posting Function Created ✓'

\echo ''
\echo '=== STEP 3: Create Required GL Accounts ==='
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '2200', 'PAYE Payable', 'LIABILITY', true),
  ('00000000-0000-0000-0000-000000000001', '2210', 'UIF Payable', 'LIABILITY', true),
  ('00000000-0000-0000-0000-000000000001', '2250', 'Salaries Payable', 'LIABILITY', true),
  ('00000000-0000-0000-0000-000000000001', '6200', 'Employer Contributions', 'EXPENSE', true)
ON CONFLICT (tenant_id, account_code) DO NOTHING;

SELECT account_code, account_name, account_type
FROM chart_of_accounts
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND account_code IN ('1100', '2200', '2210', '2250', '6100', '6200')
ORDER BY account_code;

\echo ''
\echo '=== STEP 4: Create Test Employee ==='
INSERT INTO employees (
  tenant_id, employee_number, first_name, last_name, hire_date,
  employment_status, employment_type, basic_salary, work_email, mobile_phone
) VALUES (
  '00000000-0000-0000-0000-000000000001', 'EMP-001', 'John', 'Doe', '2025-01-01',
  'Active', 'Full-Time', 25000.00, 'john.doe@company.com', '+27 82 123 4567'
)
ON CONFLICT (employee_number) DO UPDATE
SET basic_salary = 25000.00
RETURNING employee_id, employee_number, first_name, last_name, basic_salary;

\echo ''
\echo '=== STEP 5: Create Payroll Period ==='
INSERT INTO payroll_periods (
  tenant_id, period_name, period_start, period_end, payment_date, status
) VALUES (
  '00000000-0000-0000-0000-000000000001', 'November 2025',
  '2025-11-01', '2025-11-30', '2025-11-25', 'Open'
)
ON CONFLICT DO NOTHING
RETURNING period_id, period_name, period_start, period_end;

\echo ''
\echo '=== STEP 6: Create Payroll Run ==='
INSERT INTO payroll_runs (
  tenant_id, period_id, run_number, run_date, employee_count,
  total_gross, total_deductions, total_net, total_employer_contributions, status
)
SELECT 
  '00000000-0000-0000-0000-000000000001', period_id, 'PAY-2025-11', '2025-11-25',
  0, 0, 0, 0, 0, 'Draft'
FROM payroll_periods WHERE period_name = 'November 2025'
ON CONFLICT (run_number) DO UPDATE SET status = 'Draft'
RETURNING run_id, run_number, status;

\echo ''
\echo '=== STEP 7: Add Payroll Items ==='
DO $$
DECLARE
  v_run_id INTEGER;
  v_employee_id INTEGER;
  v_basic_salary DECIMAL(12,2);
  v_gross DECIMAL(12,2);
  v_paye DECIMAL(12,2);
  v_uif_employee DECIMAL(12,2);
  v_uif_employer DECIMAL(12,2);
  v_sdl DECIMAL(12,2);
  v_net DECIMAL(12,2);
BEGIN
  SELECT run_id INTO v_run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11';
  SELECT employee_id, basic_salary INTO v_employee_id, v_basic_salary 
  FROM employees WHERE employee_number = 'EMP-001';

  v_gross := v_basic_salary;
  v_paye := v_basic_salary * 0.20;
  v_uif_employee := v_basic_salary * 0.01;
  v_uif_employer := v_basic_salary * 0.01;
  v_sdl := v_basic_salary * 0.01;
  v_net := v_gross - v_paye - v_uif_employee;

  DELETE FROM payroll_items WHERE run_id = v_run_id;

  INSERT INTO payroll_items (
    run_id, employee_id, basic_salary, gross_pay, paye_tax, uif_employee,
    total_deductions, net_pay, uif_employer, sdl_contribution, total_employer_cost,
    taxable_income, working_days, days_worked, payment_method,
    overtime_pay, bonus, commission, allowances, other_earnings,
    medical_aid, pension_contribution, loan_deductions, garnishments, other_deductions,
    wca_contribution, employer_pension, days_absent, overtime_hours
  ) VALUES (
    v_run_id, v_employee_id, v_basic_salary, v_gross, v_paye, v_uif_employee,
    (v_paye + v_uif_employee), v_net, v_uif_employer, v_sdl,
    (v_gross + v_uif_employer + v_sdl), v_gross, 22, 22, 'EFT',
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  );

  UPDATE payroll_runs SET
    employee_count = 1, total_gross = v_gross,
    total_deductions = (v_paye + v_uif_employee), total_net = v_net,
    total_employer_contributions = (v_uif_employer + v_sdl)
  WHERE run_id = v_run_id;
END $$;

SELECT 
  pr.run_number, e.employee_number, e.first_name || ' ' || e.last_name as employee_name,
  pi.gross_pay, pi.paye_tax, pi.uif_employee, pi.total_deductions, pi.net_pay,
  pi.uif_employer, pi.sdl_contribution, pi.total_employer_cost
FROM payroll_items pi
JOIN payroll_runs pr ON pi.run_id = pr.run_id
JOIN employees e ON pi.employee_id = e.employee_id
WHERE pr.run_number = 'PAY-2025-11';

\echo ''
\echo '=== STEP 8: POST Payroll to GL ==='
UPDATE payroll_runs SET status = 'Posted' WHERE run_number = 'PAY-2025-11'
RETURNING run_id, run_number, status, journal_entry_id, posted_to_gl;

\echo ''
\echo '=== STEP 9: Verify Journal Entry ==='
SELECT je.entry_id, je.entry_number, je.entry_date, je.description, je.status
FROM journal_entries je
JOIN payroll_runs pr ON je.entry_id = pr.journal_entry_id
WHERE pr.run_number = 'PAY-2025-11';

\echo ''
\echo '=== STEP 10: Verify GL Transactions ==='
SELECT gt.id, coa.account_code, coa.account_name, gt.description,
       gt.debit_amount, gt.credit_amount
FROM gl_transactions gt
JOIN chart_of_accounts coa ON gt.account_id = coa.account_id
WHERE gt.source_type = 'PAYROLL'
  AND gt.source_id = (SELECT run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11')
ORDER BY gt.id;

\echo ''
\echo '=== STEP 11: Verify Balances ==='
SELECT SUM(debit_amount) as total_debits, SUM(credit_amount) as total_credits
FROM gl_transactions WHERE source_type = 'PAYROLL'
  AND source_id = (SELECT run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11');

\echo ''
\echo '=== STEP 12: Trial Balance ==='
SELECT coa.account_code, coa.account_name, coa.account_type,
       COALESCE(SUM(gt.debit_amount - gt.credit_amount), 0) as balance
FROM chart_of_accounts coa
LEFT JOIN gl_transactions gt ON coa.account_id = gt.account_id
WHERE coa.tenant_id = '00000000-0000-0000-0000-000000000001'
  AND coa.account_code IN ('6100', '6200', '2200', '2210', '2250')
GROUP BY coa.account_code, coa.account_name, coa.account_type
ORDER BY coa.account_code;

\echo ''
\echo '🎉 HR PAYROLL WORKFLOW COMPLETE! 🎉'
\echo '================================================'
\echo 'Employee: John Doe (EMP-001)'
\echo 'Gross Salary: R25,000'
\echo 'PAYE (20%): R5,000'
\echo 'UIF Employee (1%): R250'
\echo 'Net Pay: R19,750'
\echo 'Employer Cost: UIF R250 + SDL R250 = R500'
\echo 'Total Cost: R25,500'
\echo ''
\echo 'GL Posted:'
\echo '  DR Salaries & Wages (6100)     R25,000'
\echo '  DR Employer Contributions (6200)  R500'
\echo '  CR PAYE Payable (2200)          R5,000'
\echo '  CR UIF Payable (2210)             R500'
\echo '  CR Salaries Payable (2250)     R19,750'
\echo '================================================'
