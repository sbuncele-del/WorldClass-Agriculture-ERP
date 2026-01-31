/**
 * GL Explorer Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure General Ledger search and exploration.
 * Advanced filtering and analysis capabilities.
 */

import { Response } from 'express';
import pool from '../config/database';
import { TenantRequest } from '../types';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

export class GLExplorerControllerV2 {
  /**
   * Advanced GL search with multiple filters
   * GET /api/v2/financial/gl-explorer/search
   */
  static async search(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const {
        account_codes,
        date_from,
        date_to,
        amount_min,
        amount_max,
        search_text,
        source_types,
        statuses,
        cost_centers,
        project_codes,
        posted_only,
        page = 1,
        limit = 50,
        sort_by = 'journal_date',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause - tenant_id is always first
      const conditions: string[] = ['jel.tenant_id = $1'];
      const params: any[] = [tenantId];
      let paramIndex = 2;

      // Account codes filter
      if (account_codes) {
        const codes = Array.isArray(account_codes) ? account_codes : [account_codes];
        conditions.push(`jel.account_code = ANY($${paramIndex})`);
        params.push(codes);
        paramIndex++;
      }

      // Date range filter
      if (date_from) {
        conditions.push(`je.journal_date >= $${paramIndex}`);
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        conditions.push(`je.journal_date <= $${paramIndex}`);
        params.push(date_to);
        paramIndex++;
      }

      // Amount range filter
      if (amount_min) {
        conditions.push(`(jel.debit_amount >= $${paramIndex} OR jel.credit_amount >= $${paramIndex})`);
        params.push(amount_min);
        paramIndex++;
      }

      if (amount_max) {
        conditions.push(`(jel.debit_amount <= $${paramIndex} OR jel.credit_amount <= $${paramIndex})`);
        params.push(amount_max);
        paramIndex++;
      }

      // Text search
      if (search_text) {
        conditions.push(`(
          je.description ILIKE $${paramIndex} OR 
          je.notes ILIKE $${paramIndex} OR
          jel.description ILIKE $${paramIndex} OR
          je.source_document_number ILIKE $${paramIndex}
        )`);
        params.push(`%${search_text}%`);
        paramIndex++;
      }

      // Source types filter
      if (source_types) {
        const types = Array.isArray(source_types) ? source_types : [source_types];
        conditions.push(`je.source_type = ANY($${paramIndex})`);
        params.push(types);
        paramIndex++;
      }

      // Status filter
      if (statuses) {
        const statusList = Array.isArray(statuses) ? statuses : [statuses];
        conditions.push(`je.status = ANY($${paramIndex})`);
        params.push(statusList);
        paramIndex++;
      }

      // Cost centers filter
      if (cost_centers) {
        const centers = Array.isArray(cost_centers) ? cost_centers : [cost_centers];
        conditions.push(`jel.cost_center = ANY($${paramIndex})`);
        params.push(centers);
        paramIndex++;
      }

      // Project codes filter
      if (project_codes) {
        const projects = Array.isArray(project_codes) ? project_codes : [project_codes];
        conditions.push(`jel.project_code = ANY($${paramIndex})`);
        params.push(projects);
        paramIndex++;
      }

      // Posted only filter
      if (posted_only === 'true') {
        conditions.push(`je.status = 'POSTED'`);
      }

      const whereClause = conditions.join(' AND ');

      // Validate sort column
      const validSortColumns = ['journal_date', 'account_code', 'debit_amount', 'credit_amount', 'created_at'];
      const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'journal_date';
      const sortDir = sort_order === 'ASC' ? 'ASC' : 'DESC';

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Main query
      const query = `
        SELECT 
          jel.id as line_id,
          je.entry_id as journal_entry_id,
          je.entry_number,
          je.journal_date,
          je.description as entry_description,
          je.source_type,
          je.source_document_number,
          je.status,
          jel.account_code,
          coa.account_name,
          jel.description as line_description,
          jel.debit_amount,
          jel.credit_amount,
          jel.cost_center,
          jel.project_code,
          jel.department
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          AND je.tenant_id = $1
        LEFT JOIN chart_of_accounts coa ON jel.account_id = coa.id
          AND coa.tenant_id = $1
        WHERE ${whereClause}
        ORDER BY ${sortColumn} ${sortDir}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          AND je.tenant_id = $1
        WHERE ${whereClause}
      `;

      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        success: true,
        data: {
          entries: result.rows,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: parseInt(countResult.rows[0].total),
            total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit as string))
          }
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[GLExplorer] Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search general ledger',
        error: error.message
      });
    }
  }

  /**
   * Get account balances summary
   * GET /api/v2/financial/gl-explorer/account-summary
   */
  static async getAccountSummary(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { as_of_date, account_type } = req.query;

      const asOfDate = (as_of_date as string) || new Date().toISOString().split('T')[0];

      let typeFilter = '';
      const params: any[] = [tenantId, asOfDate];

      if (account_type) {
        typeFilter = 'AND coa.account_type = $3';
        params.push(account_type);
      }

      const query = `
        SELECT 
          coa.account_code,
          coa.account_name,
          coa.account_type,
          COALESCE(SUM(jel.debit_amount), 0) as total_debits,
          COALESCE(SUM(jel.credit_amount), 0) as total_credits,
          CASE 
            WHEN coa.account_type IN ('ASSET', 'EXPENSE') 
            THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
            ELSE COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
          END as balance,
          COUNT(DISTINCT je.entry_id) as entry_count
        FROM chart_of_accounts coa
        LEFT JOIN journal_entry_lines jel ON coa.id = jel.account_id
          AND jel.tenant_id = $1
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          AND je.tenant_id = $1
          AND je.status = 'POSTED'
          AND je.journal_date <= $2
        WHERE coa.tenant_id = $1
          AND coa.is_active = true
          ${typeFilter}
        GROUP BY coa.account_code, coa.account_name, coa.account_type
        ORDER BY coa.account_code
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          as_of_date: asOfDate,
          accounts: result.rows,
          totals: {
            total_debits: result.rows.reduce((sum, row) => sum + parseFloat(row.total_debits), 0),
            total_credits: result.rows.reduce((sum, row) => sum + parseFloat(row.total_credits), 0)
          }
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[GLExplorer] Account summary error:', error);
      res.status(500).json({ success: false, message: 'Failed to get account summary' });
    }
  }

  /**
   * Get account ledger (all transactions for one account)
   * GET /api/v2/financial/gl-explorer/account-ledger/:accountCode
   */
  static async getAccountLedger(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const accountCode = req.params.accountCode || (req.params as any).account_code;
      const { date_from, date_to, page = 1, limit = 100 } = req.query;

      const dateFrom = (date_from as string) || '1900-01-01';
      const dateTo = (date_to as string) || new Date().toISOString().split('T')[0];
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Get account info
      const accountQuery = `
        SELECT account_code, account_name, account_type
        FROM chart_of_accounts
        WHERE tenant_id = $1 AND account_code = $2
      `;
      const accountResult = await pool.query(accountQuery, [tenantId, accountCode]);

      if (accountResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Account not found' });
        return;
      }

      const account = accountResult.rows[0];

      // Get opening balance
      const openingQuery = `
        SELECT 
          CASE 
            WHEN $4 IN ('ASSET', 'EXPENSE') 
            THEN COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0)
            ELSE COALESCE(SUM(jel.credit_amount), 0) - COALESCE(SUM(jel.debit_amount), 0)
          END as opening_balance
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          AND je.tenant_id = $1
        JOIN chart_of_accounts coa ON jel.account_id = coa.id
          AND coa.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND je.journal_date < $2
          AND coa.account_code = $3
      `;
      const openingResult = await pool.query(openingQuery, [tenantId, dateFrom, accountCode, account.account_type]);
      const openingBalance = parseFloat(openingResult.rows[0]?.opening_balance || '0');

      // Get transactions
      const transQuery = `
        SELECT 
          je.entry_id as journal_entry_id,
          je.entry_number,
          je.journal_date,
          je.description,
          je.source_type,
          je.source_document_number,
          jel.description as line_description,
          jel.debit_amount,
          jel.credit_amount
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.entry_id
          AND je.tenant_id = $1
        JOIN chart_of_accounts coa ON jel.account_id = coa.id
          AND coa.tenant_id = $1
        WHERE jel.tenant_id = $1
          AND je.status = 'POSTED'
          AND je.journal_date >= $2 AND je.journal_date <= $3
          AND coa.account_code = $4
        ORDER BY je.journal_date, je.entry_id
        LIMIT $5 OFFSET $6
      `;

      const transResult = await pool.query(transQuery, [tenantId, dateFrom, dateTo, accountCode, limit, offset]);

      // Calculate running balance
      let runningBalance = openingBalance;
      const transactions = transResult.rows.map(row => {
        const debit = parseFloat(row.debit_amount || '0');
        const credit = parseFloat(row.credit_amount || '0');
        
        if (['ASSET', 'EXPENSE'].includes(account.account_type)) {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        return {
          ...row,
          running_balance: runningBalance
        };
      });

      res.json({
        success: true,
        data: {
          account,
          period: { date_from: dateFrom, date_to: dateTo },
          opening_balance: openingBalance,
          transactions,
          closing_balance: runningBalance
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[GLExplorer] Account ledger error:', error);
      res.status(500).json({ success: false, message: 'Failed to get account ledger' });
    }
  }

  /**
   * Get available filter options
   * GET /api/v2/financial/gl-explorer/filter-options
   */
  static async getFilterOptions(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      // Get accounts - using correct column names
      const accountsQuery = `
        SELECT code as account_code, name as account_name, account_type
        FROM chart_of_accounts
        WHERE tenant_id = $1 AND is_active = true
        ORDER BY code
      `;
      const accounts = await pool.query(accountsQuery, [tenantId]);

      // Get source types (column is 'source' not 'source_type')
      const sourceTypesQuery = `
        SELECT DISTINCT source
        FROM journal_entries
        WHERE tenant_id = $1 AND source IS NOT NULL
        ORDER BY source
      `;
      const sourceTypes = await pool.query(sourceTypesQuery, [tenantId]);

      // Return empty arrays for cost_centers and project_codes since journal_entry_lines may not have these columns
      res.json({
        success: true,
        data: {
          accounts: accounts.rows,
          source_types: sourceTypes.rows.map(r => r.source),
          cost_centers: [],
          project_codes: [],
          statuses: ['DRAFT', 'PENDING', 'POSTED', 'REVERSED']
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[GLExplorer] Filter options error:', error);
      res.status(500).json({ success: false, message: 'Failed to get filter options' });
    }
  }

  /**
   * Export search results
   * POST /api/v2/financial/gl-explorer/export
   */
  static async exportResults(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { format = 'csv' } = req.body;

      res.json({
        success: true,
        message: `${format.toUpperCase()} export will be implemented with reporting service`,
        tenant_id: tenantId
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      res.status(500).json({ success: false, message: 'Export failed' });
    }
  }
}

export default GLExplorerControllerV2;
