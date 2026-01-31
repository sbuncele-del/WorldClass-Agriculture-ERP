import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { query } from '../../../config/database';

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * HR Workspace Controller
 * Provides aggregated data for the HR & Payroll dashboard
 */

/**
 * GET /api/hr/workspace
 * Returns all data needed for the HR & Payroll workspace dashboard
 */
export const getHRWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found',
      });
    }

    // Parallel queries for performance
    const [
      employeeHeadcount,
      leaveRequests,
      payrollStatus,
      recruitmentPipeline,
      recentHires,
      hrSummary,
    ] = await Promise.all([
      getEmployeeHeadcount(tenantId),
      getLeaveRequests(tenantId),
      getPayrollStatus(tenantId),
      getRecruitmentPipeline(tenantId),
      getRecentHires(tenantId),
      getHRSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: hrSummary,
        headcount: employeeHeadcount,
        leave_requests: leaveRequests,
        payroll_status: payrollStatus,
        recruitment: recruitmentPipeline,
        recent_hires: recentHires,
      },
    });
  } catch (error: any) {
    console.error('HR workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch HR workspace data',
    });
  }
};

/**
 * Get employee headcount by department
 */
async function getEmployeeHeadcount(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COALESCE(d.department_name, 'Unassigned') as department_name,
      COUNT(*) as employee_count,
      COUNT(CASE WHEN e.employment_status = 'Active' THEN 1 END) as active_count,
      COUNT(CASE WHEN e.employment_status = 'On Leave' THEN 1 END) as on_leave_count
    FROM hr.employees e
    LEFT JOIN hr.departments d ON e.department_id = d.department_id AND e.tenant_id = d.tenant_id
    WHERE e.tenant_id = $1
    GROUP BY COALESCE(d.department_name, 'Unassigned')
    ORDER BY employee_count DESC
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get pending leave requests
 */
async function getLeaveRequests(tenantId: string) {
  const result = await query(
    `
    SELECT 
      lr.request_id,
      lr.leave_type_id,
      lr.start_date,
      lr.end_date,
      lr.status,
      lt.leave_name,
      e.employee_number,
      e.first_name,
      e.last_name,
      d.department_name
    FROM hr.leave_requests lr
    JOIN hr.employees e ON lr.employee_id = e.employee_id AND lr.tenant_id = e.tenant_id
    LEFT JOIN hr.departments d ON e.department_id = d.department_id
    LEFT JOIN hr.leave_types lt ON lr.leave_type_id = lt.leave_type_id
    WHERE lr.tenant_id = $1 AND lr.status = 'Pending'
    ORDER BY lr.start_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get payroll status for current month
 */
async function getPayrollStatus(tenantId: string) {
  // Simplified query that doesn't require GROUP BY on optional columns
  const result = await query(
    `
    SELECT 
      pr.run_id,
      pp.period_name,
      pr.status,
      pr.total_gross,
      pr.total_deductions,
      pr.total_net,
      pp.payment_date,
      pr.total_employees as employee_count
    FROM hr.payroll_runs pr
    JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
    WHERE pr.tenant_id = $1 
    ORDER BY pr.run_date DESC
    LIMIT 3
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recruitment pipeline
 */
async function getRecruitmentPipeline(tenantId: string) {
  const result = await query(
    `
    SELECT 
      jp.id,
      jp.job_title,
      jp.department,
      jp.status,
      COUNT(ja.id) as applicant_count,
      COUNT(CASE WHEN ja.status = 'interview' THEN 1 END) as interview_count,
      COUNT(CASE WHEN ja.status = 'offer' THEN 1 END) as offer_count
    FROM hr.job_postings jp
    LEFT JOIN hr.job_applications ja ON jp.id = ja.job_posting_id AND ja.tenant_id = $1
    WHERE jp.tenant_id = $1 AND jp.status = 'open'
    GROUP BY jp.id, jp.job_title, jp.department, jp.status
    ORDER BY applicant_count DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent hires (last 30 days)
 */
async function getRecentHires(tenantId: string) {
  const result = await query(
    `
    SELECT 
      e.employee_id,
      e.employee_number,
      e.first_name,
      e.last_name,
      d.department_name,
      p.position_title,
      e.hire_date
    FROM hr.employees e
    LEFT JOIN hr.departments d ON e.department_id = d.department_id AND e.tenant_id = d.tenant_id
    LEFT JOIN hr.positions p ON e.position_id = p.position_id AND e.tenant_id = p.tenant_id
    WHERE e.tenant_id = $1 
      AND e.hire_date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY e.hire_date DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get HR summary metrics
 */
async function getHRSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT e.employee_id) as total_employees,
      COUNT(CASE WHEN e.employment_status = 'Active' THEN 1 END) as active_employees,
      COUNT(CASE WHEN lr.status = 'Pending' THEN 1 END) as pending_leave_requests,
      COUNT(CASE WHEN e.hire_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_hires_30d,
      COUNT(DISTINCT jp.id) as open_positions,
      COUNT(DISTINCT ja.id) as total_applications
    FROM hr.employees e
    LEFT JOIN hr.leave_requests lr ON e.employee_id = lr.employee_id AND lr.tenant_id = $1 AND lr.status = 'Pending'
    LEFT JOIN hr.job_postings jp ON jp.tenant_id = $1 AND jp.status = 'open'
    LEFT JOIN hr.job_applications ja ON jp.id = ja.job_posting_id AND ja.tenant_id = $1
    WHERE e.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_employees: 0,
    active_employees: 0,
    pending_leave_requests: 0,
    new_hires_30d: 0,
    open_positions: 0,
    total_applications: 0,
  };
}
