/**
 * HR CONTROLLER (Repository Pattern)
 *
 * Tenant-aware HR endpoints backed by BaseRepository.
 * This v2 controller gradually replaces legacy hrController routes.
 */

import { Response } from 'express';
import { pool, query } from '../../../config/database';
import { TenantRequest } from '../../../types';
import { TenantContext } from '../../../repositories/BaseRepository';
import {
  departmentRepository,
  positionRepository,
  employeeRepository,
  payrollPeriodRepository
} from '../../../repositories/hr';
import { calculatePAYE as calcAnnualPAYE, UIF_CEILING_MONTHLY, UIF_RATE } from '../services/tax-calculation.service';

function getTenantContext(req: TenantRequest): TenantContext {
  if (!req.tenant) throw new Error('Tenant context not available');
  return { tenantId: req.tenant.id, userId: req.user?.id };
}

// ============================================================================
// DEPARTMENTS
// ============================================================================

export const getDepartments = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const includeInactive = req.query.include_inactive === 'true';

    const sql = `
      SELECT 
        d.*, 
        pd.department_name AS parent_department_name,
        mgr.first_name || ' ' || mgr.last_name AS manager_name,
        COUNT(emp.employee_id) AS employee_count
      FROM hr.departments d
      LEFT JOIN hr.departments pd ON pd.tenant_id = d.tenant_id AND pd.department_id = d.parent_department_id
      LEFT JOIN hr.employees mgr ON mgr.tenant_id = d.tenant_id AND mgr.employee_id = d.manager_id
      LEFT JOIN hr.employees emp ON emp.tenant_id = d.tenant_id AND emp.department_id = d.department_id
      WHERE d.tenant_id = $1
      ${includeInactive ? '' : 'AND d.is_active = true'}
      GROUP BY d.department_id, pd.department_name, mgr.first_name, mgr.last_name
      ORDER BY d.department_name
    `;

    const rows = await departmentRepository.rawQuery(ctx, sql);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
};

export const getDepartmentById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;

    const sql = `
      SELECT 
        d.*, 
        pd.department_name AS parent_department_name,
        mgr.first_name || ' ' || mgr.last_name AS manager_name,
        COUNT(emp.employee_id) AS employee_count
      FROM hr.departments d
      LEFT JOIN hr.departments pd ON pd.tenant_id = d.tenant_id AND pd.department_id = d.parent_department_id
      LEFT JOIN hr.employees mgr ON mgr.tenant_id = d.tenant_id AND mgr.employee_id = d.manager_id
      LEFT JOIN hr.employees emp ON emp.tenant_id = d.tenant_id AND emp.department_id = d.department_id
      WHERE d.tenant_id = $1 AND d.department_id = $2
      GROUP BY d.department_id, pd.department_name, mgr.first_name, mgr.last_name
    `;

    const rows = await departmentRepository.rawQuery(ctx, sql, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department' });
  }
};

export const createDepartment = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const {
      department_code,
      department_name,
      parent_department_id,
      manager_id,
      cost_center_code,
      description,
      is_active = true,
    } = req.body;

    if (!department_code || !department_name) {
      return res.status(400).json({ success: false, message: 'Department code and name are required' });
    }

    const existing = await departmentRepository.findOne(ctx, { department_code });
    if (existing) return res.status(400).json({ success: false, message: 'Department code already exists' });

    const dept = await departmentRepository.create(ctx, {
      department_code,
      department_name,
      parent_department_id: parent_department_id || null,
      manager_id: manager_id || null,
      cost_center_code: cost_center_code || null,
      description,
      is_active,
    } as any);

    res.status(201).json({ success: true, data: dept, message: 'Department created successfully' });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(400).json({ success: false, message: 'Failed to create department', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateDepartment = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const {
      department_code,
      department_name,
      parent_department_id,
      manager_id,
      cost_center_code,
      description,
      is_active,
    } = req.body;

    if (department_code) {
      const existing = await departmentRepository.findOne(ctx, { department_code });
      if (existing && (existing as any).department_id !== id) {
        return res.status(400).json({ success: false, message: 'Department code already exists' });
      }
    }

    const updated = await departmentRepository.update(ctx, id, {
      department_code,
      department_name,
      parent_department_id: parent_department_id || null,
      manager_id: manager_id || null,
      cost_center_code: cost_center_code || null,
      description,
      is_active,
    } as any);

    if (!updated) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: updated, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(400).json({ success: false, message: 'Failed to update department', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// POSITIONS
// ============================================================================

export const getPositions = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const includeInactive = req.query.include_inactive === 'true';

    if (includeInactive) {
      const result = await positionRepository.findAll(ctx, {}, { page: 1, limit: 500, sortBy: 'position_title', sortOrder: 'ASC' });
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    }

    const data = await positionRepository.getActivePositions(ctx);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch positions' });
  }
};

export const createPosition = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const {
      position_code,
      position_title,
      department_id,
      reports_to_position_id,
      job_level,
      job_category,
      description,
      requirements,
      is_active = true,
    } = req.body;

    if (!position_code || !position_title) {
      return res.status(400).json({ success: false, message: 'Position code and title are required' });
    }

    const unique = await positionRepository.isCodeUnique(ctx, position_code);
    if (!unique) return res.status(400).json({ success: false, message: 'Position code already exists' });

    const pos = await positionRepository.create(ctx, {
      position_code,
      position_title,
      department_id: department_id || null,
      reports_to_position_id: reports_to_position_id || null,
      job_level,
      job_category,
      description,
      requirements,
      is_active,
    } as any);

    res.status(201).json({ success: true, data: pos, message: 'Position created successfully' });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(400).json({ success: false, message: 'Failed to create position', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// EMPLOYEES
// ============================================================================

export const getEmployees = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { department_id, status, search, page, limit } = req.query;

    // Search path
    if (search) {
      const result = await employeeRepository.search(ctx, search as string, { page: Number(page) || 1, limit: Number(limit) || 50 });
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    }

    const filters: Record<string, any> = {};
    if (department_id) filters.department_id = department_id;
    if (status) filters.employment_status = status;

    const result = await employeeRepository.findAll(ctx, filters, {
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      sortBy: 'employee_number',
      sortOrder: 'ASC'
    });

    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getEmployeeById = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const employee = await employeeRepository.findById(ctx, id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employee', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const createEmployee = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const data = req.body;

    if (!data.employee_number || !data.first_name || !data.last_name || !data.hire_date) {
      return res.status(400).json({ success: false, message: 'Employee number, first name, last name, and hire date are required' });
    }

    const isUnique = await employeeRepository.isEmployeeNumberUnique(ctx, data.employee_number);
    if (!isUnique) return res.status(400).json({ success: false, message: 'Employee number already exists' });

    const employee = await employeeRepository.create(ctx, data);
    res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ success: false, message: 'Failed to create employee', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateEmployee = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { id } = req.params;
    const data = req.body;

    if (data.employee_number) {
      const isUnique = await employeeRepository.isEmployeeNumberUnique(ctx, data.employee_number, id);
      if (!isUnique) return res.status(400).json({ success: false, message: 'Employee number already exists' });
    }

    const updated = await employeeRepository.update(ctx, id, data);
    if (!updated) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: updated, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ success: false, message: 'Failed to update employee', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getHRDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);

    const totalEmployeesQuery = `
      SELECT COUNT(*) as count
      FROM hr.employees
      WHERE tenant_id = $1 AND employment_status = 'Active'
    `;

    const byDepartmentQuery = `
      SELECT d.department_name, COUNT(e.employee_id) as employee_count
      FROM hr.departments d
      LEFT JOIN hr.employees e ON e.tenant_id = d.tenant_id AND e.department_id = d.department_id AND e.employment_status = 'Active'
      WHERE d.tenant_id = $1
      GROUP BY d.department_id, d.department_name
      ORDER BY employee_count DESC
    `;

    const pendingLeaveQuery = `
      SELECT COUNT(*) as count
      FROM hr.leave_requests
      WHERE tenant_id = $1 AND status = 'pending'
    `;

      const payrollSummaryQuery = `
        SELECT *
        FROM hr.payroll_runs
        WHERE tenant_id = $1
        ORDER BY payroll_period DESC
        LIMIT 1
      `;

    const headcountTrendQuery = `
      SELECT 
        TO_CHAR(hire_date, 'YYYY-MM') as month,
        COUNT(*) as new_hires
      FROM hr.employees
      WHERE tenant_id = $1 AND hire_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(hire_date, 'YYYY-MM')
      ORDER BY month
    `;

    const [totalEmployees, byDepartment, pendingLeave, payrollSummary, headcountTrend] = await Promise.all([
      query(totalEmployeesQuery, [ctx.tenantId]),
      query(byDepartmentQuery, [ctx.tenantId]),
      query(pendingLeaveQuery, [ctx.tenantId]),
      query(payrollSummaryQuery, [ctx.tenantId]),
      query(headcountTrendQuery, [ctx.tenantId]),
    ]);

    res.json({
      success: true,
      data: {
        total_employees: parseInt(totalEmployees.rows[0]?.count || '0', 10),
        by_department: byDepartment.rows,
        pending_leave_requests: parseInt(pendingLeave.rows[0]?.count || '0', 10),
        payroll_summary: payrollSummary.rows[0] || null,
        headcount_trend: headcountTrend.rows,
      }
    });
  } catch (error) {
    console.error('Error fetching HR dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch HR dashboard', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// ============================================================================
// PAYROLL (V2)
// ============================================================================

export const getPayrollPeriods = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { year, status } = req.query;

    const conditions = ['tenant_id = $1'];
    const params: any[] = [ctx.tenantId];

    if (year) {
      params.push(Number(year));
      conditions.push(`EXTRACT(YEAR FROM period_start_date) = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const sql = `
      SELECT * FROM hr.payroll_periods
      WHERE ${conditions.join(' AND ')}
      ORDER BY period_start_date DESC
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll periods' });
  }
};

export const createPayrollPeriod = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const {
      period_code,
      period_name,
      period_start_date,
      period_end_date,
      payment_date,
      frequency,
    } = req.body;

    if (!period_code || !period_start_date || !period_end_date || !payment_date) {
      return res.status(400).json({ success: false, message: 'period_code, start/end dates and payment_date are required' });
    }

    const created = await payrollPeriodRepository.create(ctx, {
      period_code,
      period_name,
      period_start_date,
      period_end_date,
      payment_date,
      frequency,
      status: 'Draft',
    } as any);

    res.status(201).json({ success: true, data: created, message: 'Payroll period created' });
  } catch (error) {
    console.error('Error creating payroll period:', error);
    res.status(400).json({ success: false, message: 'Failed to create payroll period', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const processPayroll = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const ctx = getTenantContext(req);
    const { period_id, employee_ids } = req.body;

    if (!period_id) {
      return res.status(400).json({ success: false, message: 'period_id is required' });
    }

    await client.query('BEGIN');

    const periodResult = await client.query(
      'SELECT * FROM hr.payroll_periods WHERE tenant_id = $1 AND period_id = $2',
      [ctx.tenantId, period_id]
    );

    if (periodResult.rowCount === 0) {
      throw new Error('Payroll period not found for tenant');
    }

    const period = periodResult.rows[0];
    if (period.status !== 'Open' && period.status !== 'Draft') {
      throw new Error('Payroll period is not open for processing');
    }

    // Fetch employees to process
    const empParams: any[] = [ctx.tenantId];
    let empSql = `
      SELECT * FROM hr.employees
      WHERE tenant_id = $1 AND employment_status = 'Active' AND basic_salary IS NOT NULL
    `;

    if (employee_ids && Array.isArray(employee_ids) && employee_ids.length > 0) {
      empParams.push(employee_ids);
      empSql += ` AND employee_id = ANY($${empParams.length})`;
    }

    const employees = await client.query(empSql, empParams);

    const runResult = await client.query(
      `INSERT INTO hr.payroll_runs (
        tenant_id, period_id, run_date, status, total_employees,
        total_gross, total_deductions, total_net, created_by, created_at
      ) VALUES ($1, $2, CURRENT_DATE, 'Draft', $3, 0, 0, 0, $4, CURRENT_TIMESTAMP)
      RETURNING *`,
      [ctx.tenantId, period_id, employees.rowCount, ctx.userId]
    );

    const run = runResult.rows[0];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees.rows) {
      const basicSalary = parseFloat(employee.basic_salary || 0);
      let grossPay = basicSalary;
      let employeeDeductions = 0;

      const recurringComponents = await client.query(
        `SELECT erc.*, pc.component_name, pc.component_type, pc.calculation_type, pc.amount, pc.percentage, pc.is_taxable
         FROM hr.employee_recurring_components erc
         JOIN hr.payroll_components pc ON erc.component_id = pc.component_id AND pc.tenant_id = $1
         WHERE erc.tenant_id = $1 AND erc.employee_id = $2 AND erc.is_active = true
           AND (erc.effective_date IS NULL OR erc.effective_date <= $3)
           AND (erc.end_date IS NULL OR erc.end_date >= $3)
        `,
        [ctx.tenantId, employee.employee_id, period.period_end_date]
      );

      const earningLines: { component_id: number; amount: number; description: string }[] = [];
      const deductionLines: { component_id: number | null; amount: number; description: string }[] = [];

      for (const comp of recurringComponents.rows) {
        const calcType = (comp.calculation_type || 'Fixed').toLowerCase();
        const baseAmount = comp.employee_amount ?? comp.amount ?? 0;
        const pct = comp.employee_percentage ?? comp.percentage ?? 0;
        const amount = calcType === 'percentage'
          ? basicSalary * (parseFloat(pct) / 100)
          : parseFloat(baseAmount);

        if (comp.component_type === 'Earning') {
          grossPay += amount;
          earningLines.push({ component_id: comp.component_id, amount, description: comp.component_name });
        } else {
          employeeDeductions += amount;
          deductionLines.push({ component_id: comp.component_id, amount, description: comp.component_name });
        }
      }

      const annualGross = grossPay * 12;
      const payeTax = calcAnnualPAYE(annualGross) / 12;
      const uif = Math.min(grossPay, UIF_CEILING_MONTHLY) * UIF_RATE;
      employeeDeductions += payeTax + uif;
      const netPay = grossPay - employeeDeductions;

      const detailResult = await client.query(
        `INSERT INTO hr.payroll_run_details (
          tenant_id, run_id, employee_id, basic_salary, gross_pay,
          total_deductions, net_pay, paye_tax, uif_deduction, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING detail_id`,
        [ctx.tenantId, run.run_id, employee.employee_id, basicSalary, grossPay, employeeDeductions, netPay, payeTax, uif]
      );

      const detailId = detailResult.rows[0].detail_id;

      // Basic salary earning
      await client.query(
        `INSERT INTO hr.payroll_run_lines (
          tenant_id, detail_id, component_id, line_type, amount, description, created_at
        ) VALUES ($1, $2, NULL, 'Earning', $3, 'Basic Salary', CURRENT_TIMESTAMP)`,
        [ctx.tenantId, detailId, basicSalary]
      );

      for (const line of earningLines) {
        await client.query(
          `INSERT INTO hr.payroll_run_lines (
            tenant_id, detail_id, component_id, line_type, amount, description, created_at
          ) VALUES ($1, $2, $3, 'Earning', $4, $5, CURRENT_TIMESTAMP)`,
          [ctx.tenantId, detailId, line.component_id, line.amount, line.description]
        );
      }

      for (const line of deductionLines) {
        await client.query(
          `INSERT INTO hr.payroll_run_lines (
            tenant_id, detail_id, component_id, line_type, amount, description, created_at
          ) VALUES ($1, $2, $3, 'Deduction', $4, $5, CURRENT_TIMESTAMP)`,
          [ctx.tenantId, detailId, line.component_id, line.amount, line.description]
        );
      }

      // PAYE deduction
      await client.query(
        `INSERT INTO hr.payroll_run_lines (
          tenant_id, detail_id, component_id, line_type, amount, description, created_at
        ) VALUES ($1, $2, NULL, 'Deduction', $3, 'PAYE Income Tax', CURRENT_TIMESTAMP)`,
        [ctx.tenantId, detailId, payeTax]
      );

      // UIF deduction
      await client.query(
        `INSERT INTO hr.payroll_run_lines (
          tenant_id, detail_id, component_id, line_type, amount, description, created_at
        ) VALUES ($1, $2, NULL, 'Deduction', $3, 'UIF', CURRENT_TIMESTAMP)`,
        [ctx.tenantId, detailId, uif]
      );

      totalGross += grossPay;
      totalDeductions += employeeDeductions;
      totalNet += netPay;
    }

    await client.query(
      `UPDATE hr.payroll_runs
       SET total_gross = $1, total_deductions = $2, total_net = $3, status = 'Processed', updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $4 AND run_id = $5`,
      [totalGross, totalDeductions, totalNet, ctx.tenantId, run.run_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payroll processed successfully',
      data: {
        run_id: run.run_id,
        total_employees: employees.rowCount,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payroll:', error);
    res.status(400).json({ success: false, message: 'Failed to process payroll', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const getPayrollRunDetails = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { run_id } = req.params;

    const runDetails = await query(
      `SELECT pr.*, pp.period_name, pp.period_start_date, pp.period_end_date, pp.payment_date
       FROM hr.payroll_runs pr
       JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
       WHERE pr.tenant_id = $1 AND pr.run_id = $2`,
      [ctx.tenantId, run_id]
    );

    if (runDetails.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    const employees = await query(
      `SELECT prd.*, e.employee_number, e.first_name, e.last_name, d.department_name, p.position_title
       FROM hr.payroll_run_details prd
       JOIN hr.employees e ON prd.employee_id = e.employee_id AND prd.tenant_id = e.tenant_id
       LEFT JOIN hr.departments d ON e.department_id = d.department_id
       LEFT JOIN hr.positions p ON e.position_id = p.position_id
       WHERE prd.tenant_id = $1 AND prd.run_id = $2
       ORDER BY e.employee_number`,
      [ctx.tenantId, run_id]
    );

    const enriched = [] as any[];
    for (const row of employees.rows) {
      const lines = await query(
        `SELECT prl.*, pc.component_name
         FROM hr.payroll_run_lines prl
         LEFT JOIN hr.payroll_components pc ON prl.component_id = pc.component_id
         WHERE prl.tenant_id = $1 AND prl.detail_id = $2
         ORDER BY prl.line_type, prl.line_id`,
        [ctx.tenantId, row.detail_id]
      );
      enriched.push({ ...row, payroll_lines: lines.rows });
    }

    res.json({
      success: true,
      data: {
        run: runDetails.rows[0],
        employees: enriched,
      }
    });
  } catch (error) {
    console.error('Error fetching payroll run details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll run details' });
  }
};

export const postPayrollToGL = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const ctx = getTenantContext(req);
    const { run_id } = req.body;

    await client.query('BEGIN');

    const runResult = await client.query(
      'SELECT * FROM hr.payroll_runs WHERE tenant_id = $1 AND run_id = $2',
      [ctx.tenantId, run_id]
    );

    if (runResult.rowCount === 0) {
      throw new Error('Payroll run not found for tenant');
    }

    const run = runResult.rows[0];
    if (run.status === 'Posted') {
      throw new Error('Payroll run already posted');
    }

    const period = await client.query(
      'SELECT * FROM hr.payroll_periods WHERE tenant_id = $1 AND period_id = $2',
      [ctx.tenantId, run.period_id]
    );

    // Simple GL posting stub (account selection should be configurable)
    const jeResult = await client.query(
      `INSERT INTO accounting.journal_entries (
        tenant_id, entry_number, entry_date, entry_type, reference,
        description, status, created_by, created_at
      ) VALUES ($1, 'PAY' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD($2::TEXT, 4, '0'), CURRENT_DATE, 'Payroll', $2, $3, 'Posted', $4, CURRENT_TIMESTAMP)
      RETURNING entry_id`,
      [ctx.tenantId, run_id, `Payroll for ${period.rows[0]?.period_name || ''}`, ctx.userId]
    );

    const entryId = jeResult.rows[0].entry_id;

    // Update payroll run status
    await client.query(
      'UPDATE hr.payroll_runs SET status = $1, gl_entry_id = $2, posted_by = $3, posted_at = CURRENT_TIMESTAMP WHERE tenant_id = $4 AND run_id = $5',
      ['Posted', entryId, ctx.userId, ctx.tenantId, run_id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Payroll posted to GL', data: { run_id, gl_entry_id: entryId } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error posting payroll to GL:', error);
    res.status(400).json({ success: false, message: 'Failed to post payroll to GL', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// LEAVE (V2)
// ============================================================================

export const getLeaveRequests = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { employee_id, status, from_date, to_date } = req.query;

    const conditions = ['lr.tenant_id = $1'];
    const params: any[] = [ctx.tenantId];

    if (employee_id) {
      params.push(employee_id);
      conditions.push(`lr.employee_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`lr.status = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`lr.start_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`lr.end_date <= $${params.length}`);
    }

    const sql = `
      SELECT lr.*, e.employee_number, e.first_name, e.last_name, d.department_name
      FROM hr.leave_requests lr
      JOIN hr.employees e ON lr.employee_id = e.employee_id AND lr.tenant_id = e.tenant_id
      LEFT JOIN hr.departments d ON e.department_id = d.department_id AND e.tenant_id = d.tenant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY lr.submitted_date DESC NULLS LAST, lr.created_at DESC
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave requests' });
  }
};

export const createLeaveRequest = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const ctx = getTenantContext(req);
    const { employee_id, leave_type_id, start_date, end_date, days_requested, reason } = req.body;

    if (!employee_id || !leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'employee_id, leave_type_id, start_date and end_date are required' });
    }

    await client.query('BEGIN');

    const balance = await client.query(
      `SELECT closing_balance FROM hr.employee_leave_balances
       WHERE tenant_id = $1 AND employee_id = $2 AND leave_type_id = $3
         AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [ctx.tenantId, employee_id, leave_type_id]
    );

    if (balance.rowCount === 0 || Number(balance.rows[0].closing_balance) < Number(days_requested || 0)) {
      throw new Error('Insufficient leave balance');
    }

    const created = await client.query(
      `INSERT INTO hr.leave_requests (
        tenant_id, employee_id, leave_type_id, start_date, end_date, days_requested,
        reason, status, request_date, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', CURRENT_DATE, $8, CURRENT_TIMESTAMP)
      RETURNING *`,
      [ctx.tenantId, employee_id, leave_type_id, start_date, end_date, days_requested, reason, ctx.userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: created.rows[0], message: 'Leave request submitted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating leave request:', error);
    res.status(400).json({ success: false, message: 'Failed to create leave request', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const processLeaveRequest = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const ctx = getTenantContext(req);
    const { request_id } = req.params;
    const { action, approver_comments } = req.body;

    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be Approved or Rejected' });
    }

    await client.query('BEGIN');

    const request = await client.query(
      'SELECT * FROM hr.leave_requests WHERE tenant_id = $1 AND request_id = $2',
      [ctx.tenantId, request_id]
    );

    if (request.rowCount === 0) {
      throw new Error('Leave request not found');
    }

    if (request.rows[0].status !== 'Pending') {
      throw new Error('Leave request already processed');
    }

    await client.query(
      `UPDATE hr.leave_requests
       SET status = $1, approver_comments = $2, approved_by = $3, approval_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $4 AND request_id = $5`,
      [action, approver_comments, ctx.userId, ctx.tenantId, request_id]
    );

    if (action === 'Approved') {
      await client.query(
        `UPDATE hr.employee_leave_balances
         SET taken = taken + $1, closing_balance = closing_balance - $1, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2 AND employee_id = $3 AND leave_type_id = $4
           AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [request.rows[0].days_requested, ctx.tenantId, request.rows[0].employee_id, request.rows[0].leave_type_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Leave request ${action.toLowerCase()} successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing leave request:', error);
    res.status(400).json({ success: false, message: 'Failed to process leave request', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const getLeaveBalances = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { employee_id } = req.params;

    const balances = await query(
      `SELECT lt.leave_name, b.opening_balance, b.accrued, b.taken, b.pending, b.closing_balance
       FROM hr.employee_leave_balances b
       JOIN hr.leave_types lt ON b.leave_type_id = lt.leave_type_id
       WHERE b.tenant_id = $1 AND b.employee_id = $2
       ORDER BY lt.leave_name`,
      [ctx.tenantId, employee_id]
    );

    res.json({ success: true, data: balances.rows });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave balances' });
  }
};

// ============================================================================
// ATTENDANCE (V2)
// ============================================================================

export const recordAttendance = async (req: TenantRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const ctx = getTenantContext(req);
    const { employee_id, clock_type } = req.body;

    if (!employee_id || !clock_type) {
      return res.status(400).json({ success: false, message: 'employee_id and clock_type are required' });
    }

    if (!['In', 'Out'].includes(clock_type)) {
      return res.status(400).json({ success: false, message: 'clock_type must be In or Out' });
    }

    await client.query('BEGIN');

    const todayResult = await client.query(
      `SELECT * FROM hr.attendance_records
       WHERE tenant_id = $1 AND employee_id = $2 AND attendance_date = CURRENT_DATE
       LIMIT 1`,
      [ctx.tenantId, employee_id]
    );

    const record = todayResult.rows[0];

    if (clock_type === 'In') {
      if (record && record.clock_in_time) {
        throw new Error('Already clocked in today');
      }

      if (record) {
        await client.query(
          `UPDATE hr.attendance_records
           SET clock_in_time = CURRENT_TIME, updated_at = CURRENT_TIMESTAMP
           WHERE attendance_id = $1`,
          [record.attendance_id]
        );
      } else {
        await client.query(
          `INSERT INTO hr.attendance_records (
            tenant_id, employee_id, attendance_date, clock_in_time, created_at, created_by
          ) VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, $3)`,
          [ctx.tenantId, employee_id, ctx.userId]
        );
      }
    } else {
      if (!record || !record.clock_in_time) {
        throw new Error('Must clock in before clocking out');
      }

      if (record.clock_out_time) {
        throw new Error('Already clocked out today');
      }

      await client.query(
        `UPDATE hr.attendance_records
         SET clock_out_time = CURRENT_TIME,
             hours_worked = EXTRACT(EPOCH FROM (CURRENT_TIME - clock_in_time)) / 3600,
             updated_at = CURRENT_TIMESTAMP
         WHERE attendance_id = $1`,
        [record.attendance_id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: `Clocked ${clock_type.toLowerCase()} successfully` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording attendance:', error);
    res.status(400).json({ success: false, message: 'Failed to record attendance', error: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    client.release();
  }
};

export const getAttendanceRecords = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { employee_id, from_date, to_date } = req.query;

    const conditions = ['ar.tenant_id = $1'];
    const params: any[] = [ctx.tenantId];

    if (employee_id) {
      params.push(employee_id);
      conditions.push(`ar.employee_id = $${params.length}`);
    }

    if (from_date) {
      params.push(from_date);
      conditions.push(`ar.attendance_date >= $${params.length}`);
    }

    if (to_date) {
      params.push(to_date);
      conditions.push(`ar.attendance_date <= $${params.length}`);
    }

    const sql = `
      SELECT ar.*, e.employee_number, e.first_name, e.last_name, d.department_name
      FROM hr.attendance_records ar
      JOIN hr.employees e ON ar.employee_id = e.employee_id AND ar.tenant_id = e.tenant_id
      LEFT JOIN hr.departments d ON e.department_id = d.department_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ar.attendance_date DESC, e.employee_number
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance records' });
  }
};

// ============================================================================
// LEAVE TYPES (V2)
// ============================================================================

export const getLeaveTypes = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const includeInactive = req.query.include_inactive === 'true';

    const sql = `
      SELECT * FROM hr.leave_types
      WHERE tenant_id = $1
      ${includeInactive ? '' : 'AND is_active = true'}
      ORDER BY leave_type_name
    `;

    const result = await query(sql, [ctx.tenantId]);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leave types' });
  }
};

// ============================================================================
// PAYROLL RUNS (V2)
// ============================================================================

export const getPayrollRuns = async (req: TenantRequest, res: Response) => {
  try {
    const ctx = getTenantContext(req);
    const { status, year, month } = req.query;

    const conditions = ['pr.tenant_id = $1'];
    const params: any[] = [ctx.tenantId];

    if (status) {
      params.push(status);
      conditions.push(`pr.status = $${params.length}`);
    }

    if (year) {
      params.push(parseInt(year as string, 10));
      conditions.push(`EXTRACT(YEAR FROM pr.period_start) = $${params.length}`);
    }

    if (month) {
      params.push(parseInt(month as string, 10));
      conditions.push(`EXTRACT(MONTH FROM pr.period_start) = $${params.length}`);
    }

    const sql = `
      SELECT 
        pr.*,
        pp.period_name
      FROM hr.payroll_runs pr
      LEFT JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id AND pr.tenant_id = pp.tenant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY pr.run_date DESC, pr.created_at DESC
    `;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll runs' });
  }
};
