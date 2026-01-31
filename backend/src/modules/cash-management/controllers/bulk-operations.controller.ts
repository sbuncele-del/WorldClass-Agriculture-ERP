import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { BulkOperationsService } from '../services/bulk-operations.service';
import pool from '../../../config/database';

const bulkOperationsService = new BulkOperationsService(pool);

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * POST /api/cash-management/bulk/auto-match
 * Bulk auto-match bank statement lines
 * 
 * Body: {
 *   statementId: number,
 *   filters?: {
 *     amountMin?: number,
 *     amountMax?: number,
 *     dateFrom?: Date,
 *     dateTo?: Date,
 *     description?: string,
 *     onlyHighConfidence?: boolean,
 *     minConfidence?: number
 *   },
 *   batchSize?: number
 * }
 */
export async function bulkAutoMatch(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const options = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!options.statementId) {
      return res.status(400).json({
        success: false,
        error: 'statementId is required'
      });
    }

    const result = await bulkOperationsService.bulkAutoMatch(
      options,
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: `Bulk auto-match completed. Matched ${result.matchedLines}/${result.totalLines} lines in ${(result.processingTimeMs / 1000).toFixed(1)}s`,
      data: result
    });

  } catch (error: any) {
    console.error('Error in bulk auto-match:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform bulk auto-match'
    });
  }
}

/**
 * POST /api/cash-management/bulk/accept-suggestions
 * Bulk accept suggested matches
 * 
 * Body: {
 *   matchIds: number[],
 *   minConfidence?: number,
 *   batchSize?: number
 * }
 */
export async function bulkAcceptSuggestions(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const options = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!options.matchIds || !Array.isArray(options.matchIds)) {
      return res.status(400).json({
        success: false,
        error: 'matchIds array is required'
      });
    }

    if (options.matchIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'matchIds array cannot be empty'
      });
    }

    if (options.matchIds.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 1000 matches can be accepted at once'
      });
    }

    const result = await bulkOperationsService.bulkAcceptSuggestions(
      options,
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: `Bulk accept completed. Accepted ${result.acceptedSuggestions}/${result.totalSuggestions} suggestions in ${(result.processingTimeMs / 1000).toFixed(1)}s`,
      data: result
    });

  } catch (error: any) {
    console.error('Error in bulk accept suggestions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk accept suggestions'
    });
  }
}

/**
 * POST /api/cash-management/bulk/unmatch
 * Bulk unmatch bank statement lines
 * 
 * Body: {
 *   bankStatementLineIds?: number[],
 *   statementId?: number,
 *   dateFrom?: Date,
 *   dateTo?: Date,
 *   batchSize?: number
 * }
 */
export async function bulkUnmatch(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const options = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    // At least one filter is required
    if (!options.bankStatementLineIds && !options.statementId && !options.dateFrom && !options.dateTo) {
      return res.status(400).json({
        success: false,
        error: 'At least one filter is required (bankStatementLineIds, statementId, dateFrom, or dateTo)'
      });
    }

    const result = await bulkOperationsService.bulkUnmatch(
      options,
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: `Bulk unmatch completed. Unmatched ${result.unmatchedMatches}/${result.totalMatches} matches in ${(result.processingTimeMs / 1000).toFixed(1)}s`,
      data: result
    });

  } catch (error: any) {
    console.error('Error in bulk unmatch:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to bulk unmatch'
    });
  }
}

/**
 * GET /api/cash-management/bulk/stats/:statementId
 * Get bulk operation statistics for a statement
 */
export async function getBulkStats(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const { statementId } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!statementId) {
      return res.status(400).json({
        success: false,
        error: 'statementId is required'
      });
    }

    const stats = await bulkOperationsService.getBulkOperationStats(
      parseInt(statementId),
      tenantId
    );

    // Calculate estimated time for remaining unmatched lines
    const estimatedTimeSeconds = stats.unmatchedLines / stats.processingSpeed;

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        estimatedProcessingTime: {
          seconds: Math.ceil(estimatedTimeSeconds),
          minutes: Math.ceil(estimatedTimeSeconds / 60),
          formatted: estimatedTimeSeconds < 60 
            ? `${Math.ceil(estimatedTimeSeconds)} seconds`
            : `${Math.ceil(estimatedTimeSeconds / 60)} minutes`
        }
      }
    });

  } catch (error: any) {
    console.error('Error getting bulk stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get bulk operation statistics'
    });
  }
}
