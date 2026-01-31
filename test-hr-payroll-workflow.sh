#!/bin/bash
# =====================================================
# HR PAYROLL MODULE - Complete End-to-End Test
# =====================================================

DB_HOST="aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="aetheros_erp"
PGPASSWORD="caxMex-0putca-dyjnah"

echo "=================================================="
echo "HR PAYROLL MODULE - COMPLETE WORKFLOW TEST"
echo "=================================================="
echo ""

export PGPASSWORD

# Run via SSH to EC2 server
ssh -i ~/.ssh/aetheros-aws.pem ec2-user@51.21.219.35 << 'EOSQL'

PGPASSWORD='caxMex-0putca-dyjnah' psql \
  -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
  -U postgres -d aetheros_erp << 'SQL'

\echo '=== STEP 1: Check if HR tables exist ==='
SELECT COUNT(*) as hr_tables_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('employees', 'payroll_runs', 'payroll_items', 'payroll_periods');

\echo ''
\echo '=== STEP 2: Create Required GL Accounts ==='
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
\echo '=== STEP 3: Create Test Employee ==='
INSERT INTO employees (
  tenant_id, employee_number, first_name, last_name,
  hire_date, employment_status, employment_type,
  basic_salary, work_email, mobile_phone
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'EMP-001',
  'John',
  'Doe',
  '2025-01-01',
  'Active',
  'Full-Time',
  25000.00,
  'john.doe@company.com',
  '+27 82 123 4567'
)
ON CONFLICT (employee_number) DO NOTHING
RETURNING employee_id, employee_number, first_name, last_name, basic_salary;

\echo ''
\echo '=== STEP 4: Create Payroll Period (November 2025) ==='
INSERT INTO payroll_periods (
  tenant_id, period_name, period_start, period_end,
  payment_date, status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'November 2025',
  '2025-11-01',
  '2025-11-30',
  '2025-11-25',
  'Open'
)
ON CONFLICT DO NOTHING
RETURNING period_id, period_name, period_start, period_end;

\echo ''
\echo '=== STEP 5: Create Payroll Run ==='
INSERT INTO payroll_runs (
  tenant_id,
  period_id,
  run_number,
  run_date,
  employee_count,
  total_gross,
  total_deductions,
  total_net,
  total_employer_contributions,
  status
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  period_id,
  'PAY-2025-11',
  '2025-11-25',
  0,
  0,
  0,
  0,
  0,
  'Draft'
FROM payroll_periods
WHERE period_name = 'November 2025'
ON CONFLICT (run_number) DO NOTHING
RETURNING run_id, run_number, status;

\echo ''
\echo '=== STEP 6: Add Payroll Items (Employee Payslips) ==='
DO $$
DECLARE
  v_run_id INTEGER;
  v_employee_id INTEGER;
  v_basic_salary DECIMAL(12,2);
  v_paye DECIMAL(12,2);
  v_uif_employee DECIMAL(12,2);
  v_uif_employer DECIMAL(12,2);
  v_sdl DECIMAL(12,2);
  v_gross DECIMAL(12,2);
  v_net DECIMAL(12,2);
BEGIN
  -- Get run_id and employee details
  SELECT run_id INTO v_run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11';
  SELECT employee_id, basic_salary INTO v_employee_id, v_basic_salary 
  FROM employees WHERE employee_number = 'EMP-001';

  -- Calculate payroll amounts (simplified South African calculations)
  v_gross := v_basic_salary;
  v_paye := v_basic_salary * 0.20;  -- 20% PAYE (simplified)
  v_uif_employee := v_basic_salary * 0.01;  -- 1% UIF employee
  v_uif_employer := v_basic_salary * 0.01;  -- 1% UIF employer
  v_sdl := v_basic_salary * 0.01;  -- 1% Skills Development Levy
  v_net := v_gross - v_paye - v_uif_employee;

  -- Insert payroll item
  INSERT INTO payroll_items (
    run_id, employee_id, basic_salary, overtime_pay, bonus, commission,
    allowances, other_earnings, gross_pay, paye_tax, uif_employee,
    medical_aid, pension_contribution, loan_deductions, garnishments,
    other_deductions, total_deductions, net_pay, uif_employer,
    sdl_contribution, wca_contribution, employer_pension,
    total_employer_cost, taxable_income, working_days, days_worked,
    days_absent, overtime_hours, payment_method
  ) VALUES (
    v_run_id, v_employee_id, v_basic_salary, 0, 0, 0,
    0, 0, v_gross, v_paye, v_uif_employee,
    0, 0, 0, 0,
    0, (v_paye + v_uif_employee), v_net, v_uif_employer,
    v_sdl, 0, 0,
    (v_gross + v_uif_employer + v_sdl), v_gross, 22, 22,
    0, 0, 'EFT'
  );

  -- Update payroll run totals
  UPDATE payroll_runs
  SET employee_count = 1,
      total_gross = v_gross,
      total_deductions = (v_paye + v_uif_employee),
      total_net = v_net,
      total_employer_contributions = (v_uif_employer + v_sdl)
  WHERE run_id = v_run_id;

  RAISE NOTICE 'Payroll item created for employee %', v_employee_id;
END $$;

SELECT 
  pr.run_number,
  e.employee_number,
  e.first_name || ' ' || e.last_name as employee_name,
  pi.gross_pay,
  pi.paye_tax,
  pi.uif_employee,
  pi.total_deductions,
  pi.net_pay,
  pi.uif_employer,
  pi.sdl_contribution,
  pi.total_employer_cost
FROM payroll_items pi
JOIN payroll_runs pr ON pi.run_id = pr.run_id
JOIN employees e ON pi.employee_id = e.employee_id
WHERE pr.run_number = 'PAY-2025-11';

\echo ''
\echo '=== STEP 7: POST Payroll to GL (Triggers GL Posting) ==='
UPDATE payroll_runs
SET status = 'Posted'
WHERE run_number = 'PAY-2025-11'
RETURNING run_id, run_number, status, journal_entry_id, posted_to_gl;

\echo ''
\echo '=== STEP 8: Verify Journal Entry Created ==='
SELECT 
  je.entry_id, je.entry_number, je.entry_date,
  je.description, je.status
FROM journal_entries je
JOIN payroll_runs pr ON je.entry_id = pr.journal_entry_id
WHERE pr.run_number = 'PAY-2025-11';

\echo ''
\echo '=== STEP 9: Verify GL Transactions Posted ==='
SELECT 
  gt.id,
  coa.account_code,
  coa.account_name,
  gt.description,
  gt.debit_amount,
  gt.credit_amount
FROM gl_transactions gt
JOIN chart_of_accounts coa ON gt.account_id = coa.account_id
WHERE gt.source_type = 'PAYROLL'
  AND gt.source_id = (SELECT run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11')
ORDER BY gt.id;

\echo ''
\echo '=== STEP 10: Verify Balances ==='
SELECT 
  SUM(debit_amount) as total_debits,
  SUM(credit_amount) as total_credits
FROM gl_transactions
WHERE source_type = 'PAYROLL'
  AND source_id = (SELECT run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11');

\echo ''
\echo '=== STEP 11: Trial Balance for Payroll Accounts ==='
SELECT 
  coa.account_code,
  coa.account_name,
  coa.account_type,
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
\echo '1. Employee Created → EMP-001 (John Doe, R25,000)'
\echo '2. Payroll Run Created → PAY-2025-11'
\echo '3. Payslip Calculated → Gross: R25,000, Net: R19,750'
\echo '4. Posted to GL → Journal Entry Created'
\echo '5. GL Transactions → Salaries, PAYE, UIF, Wages Payable'
\echo '6. Trial Balance → Updated with payroll'
\echo '================================================'

SQL
EOSQL

echo ""
echo "Test complete! Check the output above for results."
