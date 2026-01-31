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
 * Practice Management Workspace Controller
 * Provides aggregated data for the Professional Services dashboard
 */

/**
 * GET /api/practice/workspace
 * Returns all data needed for the Practice Management workspace dashboard
 */
export const getPracticeWorkspace = async (req: TenantRequest, res: Response) => {
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
      clientAppointments,
      billingStatus,
      projectTimelines,
      clientPortfolio,
      timeEntries,
      practiceSummary,
    ] = await Promise.all([
      getClientAppointments(tenantId),
      getBillingStatus(tenantId),
      getProjectTimelines(tenantId),
      getClientPortfolio(tenantId),
      getTimeEntries(tenantId),
      getPracticeSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: practiceSummary,
        appointments: clientAppointments,
        billing: billingStatus,
        projects: projectTimelines,
        clients: clientPortfolio,
        time_entries: timeEntries,
      },
    });
  } catch (error: any) {
    console.error('Practice workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch practice workspace data',
    });
  }
};

/**
 * Get upcoming client appointments
 */
async function getClientAppointments(tenantId: string) {
  const result = await query(
    `
    SELECT 
      a.id,
      a.appointment_date,
      a.appointment_time,
      a.duration_minutes,
      a.status,
      c.name as client_name,
      s.first_name || ' ' || s.last_name as staff_name,
      a.subject,
      a.notes
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN staff s ON a.staff_id = s.id
    WHERE a.tenant_id = $1 
      AND a.appointment_date >= CURRENT_DATE
      AND a.status IN ('scheduled', 'confirmed')
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get billing status overview
 */
async function getBillingStatus(tenantId: string) {
  const result = await query(
    `
    SELECT 
      i.id,
      i.invoice_number,
      i.invoice_date,
      i.due_date,
      i.status,
      c.name as client_name,
      i.total_amount,
      i.amount_paid,
      (i.total_amount - i.amount_paid) as balance_due
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.tenant_id = $1 
      AND i.status IN ('sent', 'overdue', 'partial')
    ORDER BY i.due_date ASC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get active project timelines
 */
async function getProjectTimelines(tenantId: string) {
  const result = await query(
    `
    SELECT 
      p.id,
      p.project_number,
      p.project_name,
      p.client_id,
      c.name as client_name,
      p.start_date,
      p.end_date,
      p.status,
      p.budget_amount,
      p.actual_cost,
      p.completion_percentage
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.tenant_id = $1 
      AND p.status IN ('in_progress', 'planning')
    ORDER BY p.end_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get client portfolio overview
 */
async function getClientPortfolio(tenantId: string) {
  const result = await query(
    `
    SELECT 
      c.id,
      c.name,
      c.industry,
      c.status,
      COUNT(DISTINCT p.id) as active_projects,
      SUM(i.total_amount - i.amount_paid) as outstanding_balance,
      MAX(a.appointment_date) as last_appointment
    FROM clients c
    LEFT JOIN projects p ON c.id = p.client_id AND p.status IN ('in_progress', 'planning')
    LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'paid'
    LEFT JOIN appointments a ON c.id = a.client_id
    WHERE c.tenant_id = $1 AND c.status = 'active'
    GROUP BY c.id, c.name, c.industry, c.status
    ORDER BY outstanding_balance DESC NULLS LAST
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get recent time entries (last 7 days)
 */
async function getTimeEntries(tenantId: string) {
  const result = await query(
    `
    SELECT 
      te.id,
      te.entry_date,
      te.hours,
      te.billable,
      s.first_name || ' ' || s.last_name as staff_name,
      c.name as client_name,
      p.project_name,
      te.description
    FROM time_entries te
    JOIN staff s ON te.staff_id = s.id
    JOIN clients c ON te.client_id = c.id
    LEFT JOIN projects p ON te.project_id = p.id
    WHERE te.tenant_id = $1 
      AND te.entry_date >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY te.entry_date DESC, te.created_at DESC
    LIMIT 20
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get practice summary metrics
 */
async function getPracticeSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(DISTINCT c.id) as total_clients,
      COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_clients,
      COUNT(DISTINCT p.id) as active_projects,
      COUNT(CASE WHEN a.appointment_date >= CURRENT_DATE THEN 1 END) as upcoming_appointments,
      SUM(i.total_amount - i.amount_paid) as total_outstanding,
      SUM(CASE WHEN te.entry_date >= CURRENT_DATE - INTERVAL '7 days' AND te.billable = true 
           THEN te.hours ELSE 0 END) as billable_hours_7d
    FROM clients c
    LEFT JOIN projects p ON c.id = p.client_id AND p.status IN ('in_progress', 'planning')
    LEFT JOIN appointments a ON c.id = a.client_id AND a.status IN ('scheduled', 'confirmed')
    LEFT JOIN invoices i ON c.id = i.client_id AND i.status != 'paid'
    LEFT JOIN time_entries te ON c.id = te.client_id
    WHERE c.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    total_clients: 0,
    active_clients: 0,
    active_projects: 0,
    upcoming_appointments: 0,
    total_outstanding: 0,
    billable_hours_7d: 0,
  };
}
