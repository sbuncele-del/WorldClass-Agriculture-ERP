import { Response } from 'express';
import { TenantRequest } from '../../../types';
import { MultiLineMatchingService } from '../services/multi-line-matching.service';
import pool from '../../../config/database';

const multiLineMatchingService = new MultiLineMatchingService(pool);

/**
 * Helper to extract tenant ID with type safety
 */
function getTenantId(req: TenantRequest): string | null {
  return req.tenant?.id ?? null;
}

/**
 * POST /api/cash-management/multi-line-matching/find
 * Find matching combinations for bank lines
 * 
 * Body: {
 *   bankLineIds: number[],
 *   options?: {
 *     maxBankLines?: number,
 *     maxJournalLines?: number,
 *     tolerance?: number,
 *     maxDifference?: number,
 *     dateRange?: number
 *   }
 * }
 */
export async function findMultiLineMatches(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const { bankLineIds, options } = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!bankLineIds || !Array.isArray(bankLineIds) || bankLineIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'bankLineIds array is required'
      });
    }

    if (bankLineIds.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 bank lines allowed for multi-line matching'
      });
    }

    const combinations = await multiLineMatchingService.findMatchingCombinations(
      bankLineIds,
      tenantId,
      options
    );

    return res.status(200).json({
      success: true,
      data: {
        combinations,
        count: combinations.length,
        bankLineIds,
        bestMatch: combinations[0] || null
      }
    });

  } catch (error: any) {
    console.error('Error finding multi-line matches:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to find multi-line matches'
    });
  }
}

/**
 * POST /api/cash-management/multi-line-matching/create
 * Create a multi-line match group
 * 
 * Body: {
 *   combination: MatchCombination,
 *   notes?: string
 * }
 */
export async function createMultiLineMatch(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const { combination, notes } = req.body;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!combination) {
      return res.status(400).json({
        success: false,
        error: 'combination is required'
      });
    }

    if (!combination.bankLines || !Array.isArray(combination.bankLines)) {
      return res.status(400).json({
        success: false,
        error: 'combination.bankLines array is required'
      });
    }

    if (!combination.journalLines || !Array.isArray(combination.journalLines)) {
      return res.status(400).json({
        success: false,
        error: 'combination.journalLines array is required'
      });
    }

    const group = await multiLineMatchingService.createMultiLineMatch(
      combination,
      tenantId,
      userId,
      notes
    );

    return res.status(201).json({
      success: true,
      message: `Multi-line match created: ${combination.matchType}`,
      data: {
        group,
        bankLinesMatched: combination.bankLines.length,
        journalLinesMatched: combination.journalLines.length,
        differenceAmount: combination.difference
      }
    });

  } catch (error: any) {
    console.error('Error creating multi-line match:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create multi-line match'
    });
  }
}

/**
 * DELETE /api/cash-management/multi-line-matching/:groupId
 * Unmatch a multi-line group
 */
export async function unmatchMultiLineGroup(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.user?.id;
    const { groupId } = req.params;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'groupId is required'
      });
    }

    await multiLineMatchingService.unmatchMultiLineGroup(
      parseInt(groupId),
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: 'Multi-line match group unmatched successfully'
    });

  } catch (error: any) {
    console.error('Error unmatching multi-line group:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to unmatch multi-line group'
    });
  }
}

/**
 * GET /api/cash-management/multi-line-matching/groups
 * Get all multi-line match groups for tenant
 */
export async function getMultiLineMatchGroups(req: TenantRequest, res: Response) {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.query;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Tenant ID not found'
      });
    }

    let query = `
      SELECT 
        mlmg.*,
        u.email as matched_by_email,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as matched_by_name
      FROM multi_line_match_groups mlmg
      LEFT JOIN users u ON mlmg.matched_by = u.id
      WHERE mlmg.tenant_id = $1
    `;

    const params: any[] = [tenantId];

    if (status) {
      query += ` AND mlmg.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY mlmg.matched_date DESC LIMIT 100`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error getting multi-line match groups:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get multi-line match groups'
    });
  }
}
