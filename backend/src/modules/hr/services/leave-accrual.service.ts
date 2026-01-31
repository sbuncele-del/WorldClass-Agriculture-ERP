/**
 * Leave Accrual Service
 * Automatic leave accrual calculations and processing
 */

import pool from '../../../config/database';

export interface LeaveType {
  leave_type_id: number;
  leave_code: string;
  leave_name: string;
  default_days: number;
  accrual_method: 'NONE' | 'MONTHLY' | 'ANNUAL' | 'HOURLY';
  accrual_rate: number;
  max_carryover: number;
  max_balance: number;
  requires_approval: boolean;
  min_notice_days: number;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveBalance {
  balance_id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  opening_balance: number;
  accrued: number;
  taken: number;
  adjustment: number;
  pending: number;
  closing_balance: number;
}

// South African statutory leave types
export const STATUTORY_LEAVE_TYPES = {
  ANNUAL: {
    leave_code: 'ANNUAL',
    leave_name: 'Annual Leave',
    default_days: 21, // 15 working days minimum by law + extra
    accrual_method: 'MONTHLY',
    accrual_rate: 1.75, // days per month
    max_carryover: 10,
    max_balance: 30,
    requires_approval: true,
    min_notice_days: 14,
    is_paid: true,
  },
  SICK: {
    leave_code: 'SICK',
    leave_name: 'Sick Leave',
    default_days: 30, // 30 days in 36-month cycle
    accrual_method: 'NONE', // Granted upfront for 36-month cycle
    accrual_rate: 0,
    max_carryover: 0,
    max_balance: 30,
    requires_approval: true,
    min_notice_days: 0,
    is_paid: true,
  },
  FAMILY: {
    leave_code: 'FAMILY',
    leave_name: 'Family Responsibility Leave',
    default_days: 3,
    accrual_method: 'ANNUAL',
    accrual_rate: 3,
    max_carryover: 0,
    max_balance: 3,
    requires_approval: true,
    min_notice_days: 0,
    is_paid: true,
  },
  MATERNITY: {
    leave_code: 'MATERNITY',
    leave_name: 'Maternity Leave',
    default_days: 120, // 4 consecutive months
    accrual_method: 'NONE',
    accrual_rate: 0,
    max_carryover: 0,
    max_balance: 120,
    requires_approval: true,
    min_notice_days: 30,
    is_paid: false, // UIF claims
  },
  PATERNITY: {
    leave_code: 'PATERNITY',
    leave_name: 'Parental Leave',
    default_days: 10, // New BCEA amendment
    accrual_method: 'NONE',
    accrual_rate: 0,
    max_carryover: 0,
    max_balance: 10,
    requires_approval: true,
    min_notice_days: 7,
    is_paid: true,
  },
  STUDY: {
    leave_code: 'STUDY',
    leave_name: 'Study Leave',
    default_days: 5,
    accrual_method: 'ANNUAL',
    accrual_rate: 5,
    max_carryover: 0,
    max_balance: 10,
    requires_approval: true,
    min_notice_days: 14,
    is_paid: true,
  },
  UNPAID: {
    leave_code: 'UNPAID',
    leave_name: 'Unpaid Leave',
    default_days: 0,
    accrual_method: 'NONE',
    accrual_rate: 0,
    max_carryover: 0,
    max_balance: 365,
    requires_approval: true,
    min_notice_days: 14,
    is_paid: false,
  },
};

/**
 * Initialize leave types for a new tenant
 */
export async function initializeLeaveTypes(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [key, leaveType] of Object.entries(STATUTORY_LEAVE_TYPES)) {
      // Check if leave type exists
      const existing = await client.query(
        'SELECT leave_type_id FROM hr.leave_types WHERE leave_code = $1',
        [leaveType.leave_code]
      );

      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO hr.leave_types (
            leave_code, leave_name, default_days, accrual_method,
            accrual_rate, max_carryover, max_balance, requires_approval,
            min_notice_days, is_paid, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, CURRENT_TIMESTAMP)
        `, [
          leaveType.leave_code,
          leaveType.leave_name,
          leaveType.default_days,
          leaveType.accrual_method,
          leaveType.accrual_rate,
          leaveType.max_carryover,
          leaveType.max_balance,
          leaveType.requires_approval,
          leaveType.min_notice_days,
          leaveType.is_paid,
        ]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize leave balances for a new employee
 */
export async function initializeEmployeeLeaveBalances(
  employeeId: number,
  hireDate: Date
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const currentYear = new Date().getFullYear();

    // Get all active leave types
    const leaveTypes = await client.query(
      'SELECT * FROM hr.leave_types WHERE is_active = true'
    );

    for (const leaveType of leaveTypes.rows) {
      // Check if balance already exists
      const existing = await client.query(
        'SELECT balance_id FROM hr.employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3',
        [employeeId, leaveType.leave_type_id, currentYear]
      );

      if (existing.rows.length === 0) {
        // Pro-rate opening balance based on hire date
        let openingBalance = leaveType.default_days;

        if (leaveType.accrual_method === 'ANNUAL') {
          const hireMonth = hireDate.getMonth();
          const remainingMonths = 12 - hireMonth;
          openingBalance = Math.round((leaveType.default_days / 12) * remainingMonths * 100) / 100;
        }

        await client.query(`
          INSERT INTO hr.employee_leave_balances (
            employee_id, leave_type_id, year, opening_balance,
            accrued, taken, adjustment, pending, closing_balance, created_at
          ) VALUES ($1, $2, $3, $4, 0, 0, 0, 0, $4, CURRENT_TIMESTAMP)
        `, [employeeId, leaveType.leave_type_id, currentYear, openingBalance]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process monthly leave accruals for all active employees
 */
export async function processMonthlyAccruals(tenantId: string): Promise<{
  processed: number;
  errors: string[];
}> {
  const client = await pool.connect();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  let processed = 0;
  const errors: string[] = [];

  try {
    await client.query('BEGIN');

    // Get all active employees
    const employees = await client.query(`
      SELECT employee_id, hire_date 
      FROM hr.employees 
      WHERE tenant_id = $1 AND employment_status = 'Active'
    `, [tenantId]);

    // Get leave types with monthly accrual
    const leaveTypes = await client.query(`
      SELECT * FROM hr.leave_types 
      WHERE tenant_id = $1 AND accrual_method = 'MONTHLY' AND is_active = true
    `, [tenantId]);

    for (const employee of employees.rows) {
      for (const leaveType of leaveTypes.rows) {
        try {
          // Check if already accrued this month
          const lastAccrual = await client.query(`
            SELECT * FROM hr.leave_accrual_log
            WHERE tenant_id = $1
              AND employee_id = $2 
              AND leave_type_id = $3 
              AND accrual_year = $4 
              AND accrual_month = $5
          `, [tenantId, employee.employee_id, leaveType.leave_type_id, currentYear, currentMonth]);

          if (lastAccrual.rows.length > 0) {
            continue; // Already processed
          }

          // Get current balance
          const balance = await client.query(`
            SELECT * FROM hr.employee_leave_balances
            WHERE tenant_id = $1 AND employee_id = $2 AND leave_type_id = $3 AND year = $4
          `, [tenantId, employee.employee_id, leaveType.leave_type_id, currentYear]);

          if (balance.rows.length === 0) {
            // Create balance record if missing
            await client.query(`
              INSERT INTO hr.employee_leave_balances (
                tenant_id, employee_id, leave_type_id, year, opening_balance,
                accrued, taken, adjustment, pending, closing_balance, created_at
              ) VALUES ($1, $2, $3, $4, 0, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP)
            `, [tenantId, employee.employee_id, leaveType.leave_type_id, currentYear]);
          }

          const currentBalance = balance.rows[0]?.closing_balance || 0;
          const accrualAmount = leaveType.accrual_rate;

          // Check max balance cap
          const newBalance = Math.min(
            currentBalance + accrualAmount,
            leaveType.max_balance
          );
          const actualAccrual = newBalance - currentBalance;

          // Update balance
          await client.query(`
            UPDATE hr.employee_leave_balances
            SET 
              accrued = accrued + $1,
              closing_balance = closing_balance + $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE tenant_id = $2 AND employee_id = $3 AND leave_type_id = $4 AND year = $5
          `, [actualAccrual, tenantId, employee.employee_id, leaveType.leave_type_id, currentYear]);

          // Log the accrual
          await client.query(`
            INSERT INTO hr.leave_accrual_log (
              tenant_id, employee_id, leave_type_id, accrual_year, accrual_month,
              accrual_amount, previous_balance, new_balance, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          `, [
            tenantId,
            employee.employee_id,
            leaveType.leave_type_id,
            currentYear,
            currentMonth,
            actualAccrual,
            currentBalance,
            newBalance,
          ]);

          processed++;
        } catch (err: any) {
          errors.push(`Employee ${employee.employee_id}: ${err.message}`);
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { processed, errors };
}

/**
 * Process year-end leave carryover
 */
export async function processYearEndCarryover(
  tenantId: string,
  fromYear: number,
  toYear: number
): Promise<{
  processed: number;
  forfeitedDays: number;
  errors: string[];
}> {
  const client = await pool.connect();
  let processed = 0;
  let forfeitedDays = 0;
  const errors: string[] = [];

  try {
    await client.query('BEGIN');

    // Get all employees with leave balances for the previous year
    const balances = await client.query(`
      SELECT 
        b.*,
        lt.leave_name,
        lt.max_carryover,
        lt.default_days
      FROM hr.employee_leave_balances b
      JOIN hr.leave_types lt ON b.leave_type_id = lt.leave_type_id AND lt.tenant_id = $1
      WHERE b.tenant_id = $1 AND b.year = $2
    `, [tenantId, fromYear]);

    for (const balance of balances.rows) {
      try {
        // Calculate carryover
        const closingBalance = parseFloat(balance.closing_balance);
        const maxCarryover = balance.max_carryover;
        const carryover = Math.min(closingBalance, maxCarryover);
        const forfeited = Math.max(0, closingBalance - maxCarryover);

        forfeitedDays += forfeited;

        // Check if new year balance exists
        const newYearBalance = await client.query(`
          SELECT balance_id FROM hr.employee_leave_balances
          WHERE tenant_id = $1 AND employee_id = $2 AND leave_type_id = $3 AND year = $4
        `, [tenantId, balance.employee_id, balance.leave_type_id, toYear]);

        if (newYearBalance.rows.length === 0) {
          // Create new year balance
          await client.query(`
            INSERT INTO hr.employee_leave_balances (
              tenant_id, employee_id, leave_type_id, year, opening_balance,
              accrued, taken, adjustment, pending, closing_balance,
              carryover_from_previous, forfeited, created_at
            ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0, $5, $6, $7, CURRENT_TIMESTAMP)
          `, [
            tenantId,
            balance.employee_id,
            balance.leave_type_id,
            toYear,
            carryover + balance.default_days,
            carryover,
            forfeited,
          ]);
        } else {
          // Update existing
          await client.query(`
            UPDATE hr.employee_leave_balances
            SET 
              opening_balance = $1,
              closing_balance = closing_balance + $1,
              carryover_from_previous = $2,
              forfeited = $3,
              updated_at = CURRENT_TIMESTAMP
            WHERE tenant_id = $4 AND employee_id = $5 AND leave_type_id = $6 AND year = $7
          `, [
            carryover + balance.default_days,
            carryover,
            forfeited,
            tenantId,
            balance.employee_id,
            balance.leave_type_id,
            toYear,
          ]);
        }

        processed++;
      } catch (err: any) {
        errors.push(`Balance ${balance.balance_id}: ${err.message}`);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return { processed, forfeitedDays, errors };
}

/**
 * Get leave calendar for department
 */
export async function getDepartmentLeaveCalendar(
  tenantId: string,
  departmentId: number,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      lr.request_id,
      lr.start_date,
      lr.end_date,
      lr.days_requested,
      lr.status,
      lt.leave_name,
      lt.leave_code,
      e.employee_id,
      e.employee_number,
      e.first_name || ' ' || e.last_name as employee_name
    FROM hr.leave_requests lr
    JOIN hr.employees e ON lr.employee_id = e.employee_id AND lr.tenant_id = $1 AND e.tenant_id = $1
    JOIN hr.leave_types lt ON lr.leave_type_id = lt.leave_type_id AND lt.tenant_id = $1
    WHERE e.department_id = $2
      AND lr.status IN ('Approved', 'Pending')
      AND lr.start_date <= $4
      AND lr.end_date >= $3
    ORDER BY lr.start_date, e.last_name
  `, [tenantId, departmentId, startDate, endDate]);

  return result.rows;
}

export default {
  initializeLeaveTypes,
  initializeEmployeeLeaveBalances,
  processMonthlyAccruals,
  processYearEndCarryover,
  getDepartmentLeaveCalendar,
  STATUTORY_LEAVE_TYPES,
};
