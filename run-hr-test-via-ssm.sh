#!/bin/bash
# Run HR Payroll Test via AWS Systems Manager

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "=================================================="
echo "Running HR Payroll Test via AWS SSM"
echo "=================================================="

# First, upload the SQL file
echo "Step 1: Uploading HR test SQL to instance..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[\"cd /tmp && PGPASSWORD='caxMex-0putca-dyjnah' psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp << 'EOSQL'

-- HR PAYROLL COMPLETE TEST
SELECT 'Starting HR Payroll Test...' as status;

-- Deploy GL posting function
CREATE OR REPLACE FUNCTION post_payroll_run_to_gl() RETURNS TRIGGER AS \\\$\\\$ 
DECLARE v_journal_entry_id INTEGER; v_total_salaries DECIMAL(15,2); v_total_paye DECIMAL(15,2); v_total_uif_employee DECIMAL(15,2); v_total_uif_employer DECIMAL(15,2); v_total_sdl DECIMAL(15,2); v_total_net_pay DECIMAL(15,2);
BEGIN
  IF NEW.status = 'Posted' AND (OLD.status IS NULL OR OLD.status != 'Posted') THEN
    SELECT COALESCE(SUM(gross_pay),0), COALESCE(SUM(paye_tax),0), COALESCE(SUM(uif_employee),0), COALESCE(SUM(uif_employer),0), COALESCE(SUM(sdl_contribution),0), COALESCE(SUM(net_pay),0) INTO v_total_salaries, v_total_paye, v_total_uif_employee, v_total_uif_employer, v_total_sdl, v_total_net_pay FROM payroll_items WHERE run_id = NEW.run_id;
    INSERT INTO journal_entries (tenant_id, entry_number, entry_date, description, status, created_at) VALUES (NEW.tenant_id, 'JE-PAYROLL-' || NEW.run_id, NEW.run_date::DATE, 'Payroll: ' || NEW.run_number, 'posted', CURRENT_TIMESTAMP) RETURNING entry_id INTO v_journal_entry_id;
    INSERT INTO gl_transactions (tenant_id, journal_entry_id, account_id, transaction_date, posting_date, description, source_type, source_id, debit_amount, credit_amount, created_at) VALUES (NEW.tenant_id, v_journal_entry_id, (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6100' LIMIT 1), NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries - ' || NEW.run_number, 'PAYROLL', NEW.run_id, v_total_salaries, 0, CURRENT_TIMESTAMP);
    IF (v_total_uif_employer + v_total_sdl) > 0 THEN INSERT INTO gl_transactions (tenant_id, journal_entry_id, account_id, transaction_date, posting_date, description, source_type, source_id, debit_amount, credit_amount, created_at) VALUES (NEW.tenant_id, v_journal_entry_id, (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '6200' LIMIT 1), NEW.run_date::DATE, NEW.run_date::DATE, 'Employer Contributions', 'PAYROLL', NEW.run_id, (v_total_uif_employer + v_total_sdl), 0, CURRENT_TIMESTAMP); END IF;
    IF v_total_paye > 0 THEN INSERT INTO gl_transactions (tenant_id, journal_entry_id, account_id, transaction_date, posting_date, description, source_type, source_id, debit_amount, credit_amount, created_at) VALUES (NEW.tenant_id, v_journal_entry_id, (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2200' LIMIT 1), NEW.run_date::DATE, NEW.run_date::DATE, 'PAYE Payable', 'PAYROLL', NEW.run_id, 0, v_total_paye, CURRENT_TIMESTAMP); END IF;
    IF (v_total_uif_employee + v_total_uif_employer) > 0 THEN INSERT INTO gl_transactions (tenant_id, journal_entry_id, account_id, transaction_date, posting_date, description, source_type, source_id, debit_amount, credit_amount, created_at) VALUES (NEW.tenant_id, v_journal_entry_id, (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2210' LIMIT 1), NEW.run_date::DATE, NEW.run_date::DATE, 'UIF Payable', 'PAYROLL', NEW.run_id, 0, (v_total_uif_employee + v_total_uif_employer), CURRENT_TIMESTAMP); END IF;
    IF v_total_net_pay > 0 THEN INSERT INTO gl_transactions (tenant_id, journal_entry_id, account_id, transaction_date, posting_date, description, source_type, source_id, debit_amount, credit_amount, created_at) VALUES (NEW.tenant_id, v_journal_entry_id, (SELECT account_id FROM chart_of_accounts WHERE tenant_id = NEW.tenant_id AND account_code = '2250' LIMIT 1), NEW.run_date::DATE, NEW.run_date::DATE, 'Salaries Payable', 'PAYROLL', NEW.run_id, 0, v_total_net_pay, CURRENT_TIMESTAMP); END IF;
    UPDATE payroll_runs SET journal_entry_id = v_journal_entry_id, posted_to_gl = true, posted_at = CURRENT_TIMESTAMP WHERE run_id = NEW.run_id;
  END IF;
  RETURN NEW;
END; \\\$\\\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_payroll_run ON payroll_runs;
CREATE TRIGGER trg_post_payroll_run AFTER UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION post_payroll_run_to_gl();

-- Create GL accounts
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, is_active) VALUES ('00000000-0000-0000-0000-000000000001', '2200', 'PAYE Payable', 'LIABILITY', true), ('00000000-0000-0000-0000-000000000001', '2210', 'UIF Payable', 'LIABILITY', true), ('00000000-0000-0000-0000-000000000001', '2250', 'Salaries Payable', 'LIABILITY', true), ('00000000-0000-0000-0000-000000000001', '6200', 'Employer Contributions', 'EXPENSE', true) ON CONFLICT (tenant_id, account_code) DO NOTHING;

-- Create employee
INSERT INTO employees (tenant_id, employee_number, first_name, last_name, hire_date, employment_status, employment_type, basic_salary, work_email, mobile_phone) VALUES ('00000000-0000-0000-0000-000000000001', 'EMP-001', 'John', 'Doe', '2025-01-01', 'Active', 'Full-Time', 25000.00, 'john.doe@company.com', '+27 82 123 4567') ON CONFLICT (employee_number) DO UPDATE SET basic_salary = 25000.00;

-- Create payroll period
INSERT INTO payroll_periods (tenant_id, period_name, period_start, period_end, payment_date, status) VALUES ('00000000-0000-0000-0000-000000000001', 'November 2025', '2025-11-01', '2025-11-30', '2025-11-25', 'Open') ON CONFLICT DO NOTHING;

-- Create payroll run
INSERT INTO payroll_runs (tenant_id, period_id, run_number, run_date, employee_count, total_gross, total_deductions, total_net, total_employer_contributions, status) SELECT '00000000-0000-0000-0000-000000000001', period_id, 'PAY-2025-11', '2025-11-25', 0, 0, 0, 0, 0, 'Draft' FROM payroll_periods WHERE period_name = 'November 2025' ON CONFLICT (run_number) DO UPDATE SET status = 'Draft';

-- Add payroll items
DO \\\$\\\$ DECLARE v_run_id INTEGER; v_employee_id INTEGER; v_basic_salary DECIMAL(12,2); v_gross DECIMAL(12,2); v_paye DECIMAL(12,2); v_uif_employee DECIMAL(12,2); v_uif_employer DECIMAL(12,2); v_sdl DECIMAL(12,2); v_net DECIMAL(12,2);
BEGIN
  SELECT run_id INTO v_run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11';
  SELECT employee_id, basic_salary INTO v_employee_id, v_basic_salary FROM employees WHERE employee_number = 'EMP-001';
  v_gross := v_basic_salary; v_paye := v_basic_salary * 0.20; v_uif_employee := v_basic_salary * 0.01; v_uif_employer := v_basic_salary * 0.01; v_sdl := v_basic_salary * 0.01; v_net := v_gross - v_paye - v_uif_employee;
  DELETE FROM payroll_items WHERE run_id = v_run_id;
  INSERT INTO payroll_items (run_id, employee_id, basic_salary, gross_pay, paye_tax, uif_employee, total_deductions, net_pay, uif_employer, sdl_contribution, total_employer_cost, taxable_income, working_days, days_worked, payment_method, overtime_pay, bonus, commission, allowances, other_earnings, medical_aid, pension_contribution, loan_deductions, garnishments, other_deductions, wca_contribution, employer_pension, days_absent, overtime_hours) VALUES (v_run_id, v_employee_id, v_basic_salary, v_gross, v_paye, v_uif_employee, (v_paye + v_uif_employee), v_net, v_uif_employer, v_sdl, (v_gross + v_uif_employer + v_sdl), v_gross, 22, 22, 'EFT', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  UPDATE payroll_runs SET employee_count = 1, total_gross = v_gross, total_deductions = (v_paye + v_uif_employee), total_net = v_net, total_employer_contributions = (v_uif_employer + v_sdl) WHERE run_id = v_run_id;
END \\\$\\\$;

-- Post payroll to GL
UPDATE payroll_runs SET status = 'Posted' WHERE run_number = 'PAY-2025-11';

-- Verify results
SELECT 'Payroll Posted!' as status;
SELECT pr.run_number, e.employee_number, e.first_name || ' ' || e.last_name as employee_name, pi.gross_pay, pi.net_pay FROM payroll_items pi JOIN payroll_runs pr ON pi.run_id = pr.run_id JOIN employees e ON pi.employee_id = e.employee_id WHERE pr.run_number = 'PAY-2025-11';
SELECT coa.account_code, coa.account_name, gt.debit_amount, gt.credit_amount FROM gl_transactions gt JOIN chart_of_accounts coa ON gt.account_id = coa.account_id WHERE gt.source_type = 'PAYROLL' AND gt.source_id = (SELECT run_id FROM payroll_runs WHERE run_number = 'PAY-2025-11') ORDER BY gt.id;

EOSQL
\"]" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
echo ""
echo "Waiting for command to complete (30 seconds)..."
sleep 30

echo ""
echo "Fetching results..."
aws ssm get-command-invocation \
  --instance-id $INSTANCE_ID \
  --command-id $COMMAND_ID \
  --region $REGION \
  --query '[Status,StandardOutputContent,StandardErrorContent]' \
  --output text

echo ""
echo "Done!"
