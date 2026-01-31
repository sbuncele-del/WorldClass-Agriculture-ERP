import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { PartialReconciliationService, PartialMatchRequest } from '../services/partial-reconciliation.service';
import pool from '../../../config/database';

const partialReconciliationService = new PartialReconciliationService(pool);

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * POST /api/cash-management/partial-matching/accept
 * Accept a partial match with amount difference
 * 
 * Body: PartialMatchRequest
 */
export async function acceptPartialMatch(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const request: PartialMatchRequest = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!request.bankStatementLineId) {
      return res.status(400).json({
        success: false,
        error: 'bankStatementLineId is required'
      });
    }

    if (!request.journalEntryLineId) {
      return res.status(400).json({
        success: false,
        error: 'journalEntryLineId is required'
      });
    }

    if (request.differenceAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'differenceAmount is required'
      });
    }

    if (!request.differenceReason) {
      return res.status(400).json({
        success: false,
        error: 'differenceReason is required'
      });
    }

    const result = await partialReconciliationService.acceptPartialMatch(
      request,
      tenantId,
      userId
    );

    return res.status(201).json({
      success: true,
      message: `Partial match created. Difference of R${Math.abs(result.differenceAmount).toFixed(2)} auto-posted to GL.`,
      data: result
    });

  } catch (error: any) {
    console.error('Error accepting partial match:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to accept partial match'
    });
  }
}

/**
 * GET /api/cash-management/partial-matching/:bankLineId/suggestions
 * Find potential partial matches for a bank line
 */
export async function findPartialMatchSuggestions(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const { bankLineId } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!bankLineId) {
      return res.status(400).json({
        success: false,
        error: 'bankLineId is required'
      });
    }

    const suggestions = await partialReconciliationService.findPotentialPartialMatches(
      parseInt(bankLineId),
      tenantId
    );

    return res.status(200).json({
      success: true,
      data: {
        bankLineId: parseInt(bankLineId),
        suggestions,
        count: suggestions.length
      }
    });

  } catch (error: any) {
    console.error('Error finding partial match suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to find partial match suggestions'
    });
  }
}

/**
 * POST /api/cash-management/partial-matching/check-tolerance
 * Check if a difference is within tolerance settings
 * 
 * Body: { amount1: number, amount2: number }
 */
export async function checkTolerance(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const { amount1, amount2 } = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (amount1 === undefined || amount2 === undefined) {
      return res.status(400).json({
        success: false,
        error: 'amount1 and amount2 are required'
      });
    }

    const result = await partialReconciliationService.isWithinTolerance(
      parseFloat(amount1),
      parseFloat(amount2),
      tenantId
    );

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error checking tolerance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check tolerance'
    });
  }
}

/**
 * GET /api/cash-management/partial-matching/tolerance-settings
 * Get tolerance settings for tenant
 */
export async function getToleranceSettings(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    const settings = await partialReconciliationService.getToleranceSettings(tenantId);

    return res.status(200).json({
      success: true,
      data: settings
    });

  } catch (error: any) {
    console.error('Error getting tolerance settings:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get tolerance settings'
    });
  }
}
