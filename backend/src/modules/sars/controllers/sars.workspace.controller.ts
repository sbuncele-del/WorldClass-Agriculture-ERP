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
 * SARS Sentinel Workspace Controller
 * Provides aggregated data for the SARS Sentinel dashboard
 */

/**
 * GET /api/sars/workspace
 * Returns all data needed for the SARS Sentinel workspace dashboard
 */
export const getSARSWorkspace = async (req: TenantRequest, res: Response) => {
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
      taxSubmissions,
      upcomingDeadlines,
      validationErrors,
      vatReturns,
      payeTax,
      sarsSummary,
    ] = await Promise.all([
      getTaxSubmissions(tenantId),
      getUpcomingDeadlines(tenantId),
      getValidationErrors(tenantId),
      getVATReturns(tenantId),
      getPAYETax(tenantId),
      getSARSSummary(tenantId),
    ]);

    res.json({
      success: true,
      data: {
        summary: sarsSummary,
        tax_submissions: taxSubmissions,
        upcoming_deadlines: upcomingDeadlines,
        validation_errors: validationErrors,
        vat_returns: vatReturns,
        paye_tax: payeTax,
      },
    });
  } catch (error: any) {
    console.error('SARS workspace error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch SARS workspace data',
    });
  }
};

/**
 * Get recent tax submissions
 */
async function getTaxSubmissions(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      submission_type,
      tax_period,
      submission_date,
      status,
      reference_number,
      amount
    FROM sars_submissions
    WHERE tenant_id = $1
    ORDER BY submission_date DESC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get upcoming tax deadlines
 */
async function getUpcomingDeadlines(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      deadline_type,
      tax_period,
      due_date,
      status,
      estimated_amount
    FROM sars_deadlines
    WHERE tenant_id = $1 
      AND due_date >= CURRENT_DATE
      AND status IN ('pending', 'in_progress')
    ORDER BY due_date ASC
    LIMIT 10
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get validation errors requiring attention
 */
async function getValidationErrors(tenantId: string) {
  const result = await query(
    `
    SELECT 
      ve.id,
      ve.error_type,
      ve.error_code,
      ve.description,
      ve.detected_date,
      ve.status,
      ve.affected_records,
      ss.submission_type,
      ss.tax_period
    FROM sars_validation_errors ve
    LEFT JOIN sars_submissions ss ON ve.submission_id = ss.id
    WHERE ve.tenant_id = $1 
      AND ve.status IN ('open', 'in_progress')
    ORDER BY 
      CASE ve.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      ve.detected_date DESC
    LIMIT 15
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get VAT returns summary
 */
async function getVATReturns(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      vat_period,
      output_vat,
      input_vat,
      net_vat,
      status,
      submission_date,
      payment_date
    FROM sars_vat_returns
    WHERE tenant_id = $1
    ORDER BY vat_period DESC
    LIMIT 6
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get PAYE tax summary
 */
async function getPAYETax(tenantId: string) {
  const result = await query(
    `
    SELECT 
      id,
      tax_month,
      total_paye,
      total_uif,
      total_sdl,
      status,
      submission_date
    FROM sars_paye_returns
    WHERE tenant_id = $1
    ORDER BY tax_month DESC
    LIMIT 6
    `,
    [tenantId]
  );

  return result.rows;
}

/**
 * Get SARS summary metrics
 */
async function getSARSSummary(tenantId: string) {
  const result = await query(
    `
    SELECT 
      COUNT(CASE WHEN sd.status IN ('pending', 'in_progress') AND sd.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as deadlines_due_7d,
      COUNT(CASE WHEN ss.status = 'submitted' AND ss.submission_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as submissions_30d,
      COUNT(CASE WHEN ve.status IN ('open', 'in_progress') THEN 1 END) as open_validation_errors,
      SUM(CASE WHEN vr.status = 'submitted' THEN vr.net_vat ELSE 0 END) as total_vat_liability,
      SUM(CASE WHEN pr.status = 'submitted' THEN pr.total_paye ELSE 0 END) as total_paye_liability
    FROM sars_deadlines sd
    LEFT JOIN sars_submissions ss ON ss.tenant_id = $1
    LEFT JOIN sars_validation_errors ve ON ve.tenant_id = $1
    LEFT JOIN sars_vat_returns vr ON vr.tenant_id = $1 AND vr.status = 'submitted'
    LEFT JOIN sars_paye_returns pr ON pr.tenant_id = $1 AND pr.status = 'submitted'
    WHERE sd.tenant_id = $1
    `,
    [tenantId]
  );

  return result.rows[0] || {
    deadlines_due_7d: 0,
    submissions_30d: 0,
    open_validation_errors: 0,
    total_vat_liability: 0,
    total_paye_liability: 0,
  };
}
