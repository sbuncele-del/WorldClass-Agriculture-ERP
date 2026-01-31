import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * GL Explorer Controller
 * Advanced search and analysis for General Ledger
 */

export class GLExplorerController {
  /**
   * Advanced search with multiple filters
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
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
        departments,
        posted_only,
        page = 1,
        limit = 50,
        sort_by = 'journal_date',
        sort_order = 'DESC'
      } = req.query;

      // Build dynamic WHERE clause
      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let paramIndex = 1;

      // Account codes filter
      if (account_codes && Array.isArray(account_codes) && account_codes.length > 0) {
        conditions.push(`jel.account_code = ANY($${paramIndex})`);
        params.push(account_codes);
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

      // Text search (description, notes, reference)
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
      if (source_types && Array.isArray(source_types) && source_types.length > 0) {
        conditions.push(`je.source_type = ANY($${paramIndex})`);
        params.push(source_types);
        paramIndex++;
      }

      // Status filter
      if (statuses && Array.isArray(statuses) && statuses.length > 0) {
        conditions.push(`je.status = ANY($${paramIndex})`);
        params.push(statuses);
        paramIndex++;
      }

      // Posted only filter
      if (posted_only === 'true') {
        conditions.push(`je.status = 'POSTED'`);
      }

      // Dimension filters
      if (cost_centers && Array.isArray(cost_centers) && cost_centers.length > 0) {
        conditions.push(`jel.cost_center = ANY($${paramIndex})`);
        params.push(cost_centers);
        paramIndex++;
      }

      if (project_codes && Array.isArray(project_codes) && project_codes.length > 0) {
        conditions.push(`jel.project_code = ANY($${paramIndex})`);
        params.push(project_codes);
        paramIndex++;
      }

      if (departments && Array.isArray(departments) && departments.length > 0) {
        conditions.push(`jel.department = ANY($${paramIndex})`);
        params.push(departments);
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Calculate offset for pagination
      const offset = (Number(page) - 1) * Number(limit);

      // Validate sort column
      const allowedSortColumns = ['journal_date', 'journal_number', 'account_code', 'debit_amount', 'credit_amount', 'created_at'];
      const sortColumn = allowedSortColumns.includes(sort_by as string) ? sort_by : 'journal_date';
      const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

      // Query with pagination
      const query = `
        SELECT 
          je.entry_id as journal_entry_id,
          je.journal_number,
          je.journal_date,
          je.posting_date,
          je.description as entry_description,
          je.source_type,
          je.source_document_number,
          je.status,
          je.posted_at,
          je.posted_by,
          jel.id as line_id,
          jel.line_number,
          jel.account_code,
          jel.description as line_description,
          jel.debit_amount,
          jel.credit_amount,
          jel.cost_center,
          jel.project_code,
          jel.department,
          coa.name as account_name,
          coa.account_type,
          coa.account_category
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
        LEFT JOIN chart_of_accounts coa ON jel.account_code = coa.code
        WHERE ${whereClause}
        ORDER BY je.${sortColumn} ${sortDirection}, jel.line_number ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(Number(limit), offset);

      // Count total records
      const countQuery = `
        SELECT COUNT(DISTINCT je.entry_id) as total
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
        LEFT JOIN chart_of_accounts coa ON jel.account_code = coa.code
        WHERE ${whereClause}
      `;

      const [dataResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2))
      ]);

      // Group lines by journal entry
      const entriesMap = new Map();
      
      dataResult.rows.forEach(row => {
        if (!entriesMap.has(row.journal_entry_id)) {
          entriesMap.set(row.journal_entry_id, {
            id: row.journal_entry_id,
            journal_number: row.journal_number,
            journal_date: row.journal_date,
            posting_date: row.posting_date,
            description: row.entry_description,
            source_type: row.source_type,
            source_document_number: row.source_document_number,
            status: row.status,
            posted_at: row.posted_at,
            posted_by: row.posted_by,
            lines: []
          });
        }

        entriesMap.get(row.journal_entry_id).lines.push({
          id: row.line_id,
          line_number: row.line_number,
          account_code: row.account_code,
          account_name: row.account_name,
          account_type: row.account_type,
          account_category: row.account_category,
          description: row.line_description,
          debit_amount: parseFloat(row.debit_amount) || 0,
          credit_amount: parseFloat(row.credit_amount) || 0,
          cost_center: row.cost_center,
          project_code: row.project_code,
          department: row.department
        });
      });

      const entries = Array.from(entriesMap.values());

      res.json({
        success: true,
        data: {
          entries,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: parseInt(countResult.rows[0].total),
            total_pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error in GL search:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching general ledger',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get account tree/hierarchy
   */
  async getAccountTree(req: Request, res: Response): Promise<void> {
    try {
      const { include_balances = 'true' } = req.query;

      const query = `
        WITH RECURSIVE account_tree AS (
          -- Root accounts (no parent)
          SELECT 
            id,
            code,
            name,
            description,
            account_type,
            account_category,
            parent_account_id,
            level,
            is_header,
            is_active,
            ${include_balances === 'true' ? 'current_debit_balance, current_credit_balance,' : ''}
            ARRAY[code] as path,
            code as sort_path
          FROM chart_of_accounts
          WHERE parent_account_id IS NULL AND is_active = true
          
          UNION ALL
          
          -- Child accounts
          SELECT 
            coa.id,
            coa.code,
            coa.name,
            coa.description,
            coa.account_type,
            coa.account_category,
            coa.parent_account_id,
            coa.level,
            coa.is_header,
            coa.is_active,
            ${include_balances === 'true' ? 'coa.current_debit_balance, coa.current_credit_balance,' : ''}
            at.path || coa.code,
            at.sort_path || '/' || coa.code
          FROM chart_of_accounts coa
          INNER JOIN account_tree at ON coa.parent_account_id = at.id
          WHERE coa.is_active = true
        )
        SELECT * FROM account_tree
        ORDER BY sort_path
      `;

      const result = await pool.query(query);

      // Build hierarchical structure
      const accountsMap = new Map();
      const rootAccounts: any[] = [];

      result.rows.forEach(row => {
        const account: any = {
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          account_type: row.account_type,
          account_category: row.account_category,
          level: row.level,
          is_header: row.is_header,
          children: []
        };

        if (include_balances === 'true') {
          account.debit_balance = parseFloat(row.current_debit_balance) || 0;
          account.credit_balance = parseFloat(row.current_credit_balance) || 0;
          account.net_balance = account.debit_balance - account.credit_balance;
        }

        accountsMap.set(row.id, account);

        if (!row.parent_account_id) {
          rootAccounts.push(account);
        }
      });

      // Link children to parents
      result.rows.forEach(row => {
        if (row.parent_account_id) {
          const parent = accountsMap.get(row.parent_account_id);
          const child = accountsMap.get(row.id);
          if (parent && child) {
            parent.children.push(child);
          }
        }
      });

      res.json({
        success: true,
        data: rootAccounts
      });
    } catch (error) {
      console.error('Error getting account tree:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving account tree',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get account drill-down (all transactions for an account)
   */
  async getAccountDrillDown(req: Request, res: Response): Promise<void> {
    try {
      const { account_code } = req.params;
      const { 
        date_from, 
        date_to, 
        page = 1, 
        limit = 100 
      } = req.query;

      const conditions: string[] = ['jel.account_code = $1'];
      const params: any[] = [account_code];
      let paramIndex = 2;

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

      const whereClause = conditions.join(' AND ');
      const offset = (Number(page) - 1) * Number(limit);

      const query = `
        SELECT 
          je.entry_id,
          je.journal_number,
          je.journal_date,
          je.description,
          je.source_type,
          je.status,
          jel.debit_amount,
          jel.credit_amount,
          jel.description as line_description,
          jel.cost_center,
          jel.project_code,
          jel.department
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
        WHERE ${whereClause}
        ORDER BY je.journal_date DESC, je.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(Number(limit), offset);

      // Get running balance
      const balanceQuery = `
        SELECT 
          SUM(jel.debit_amount) as total_debits,
          SUM(jel.credit_amount) as total_credits
        FROM journal_entries je
        INNER JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
        WHERE jel.account_code = $1
        ${date_to ? 'AND je.journal_date <= $2' : ''}
      `;

      const balanceParams = date_to ? [account_code, date_to] : [account_code];

      const [dataResult, balanceResult, accountResult] = await Promise.all([
        pool.query(query, params),
        pool.query(balanceQuery, balanceParams),
        pool.query('SELECT * FROM chart_of_accounts WHERE code = $1', [account_code])
      ]);

      if (accountResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Account not found'
        });
        return;
      }

      const account = accountResult.rows[0];
      const totalDebits = parseFloat(balanceResult.rows[0].total_debits) || 0;
      const totalCredits = parseFloat(balanceResult.rows[0].total_credits) || 0;

      // Calculate running balance
      let runningBalance = totalDebits - totalCredits;
      const transactionsWithBalance = dataResult.rows.map(row => {
        const debit = parseFloat(row.debit_amount) || 0;
        const credit = parseFloat(row.credit_amount) || 0;
        
        return {
          id: row.id,
          journal_number: row.journal_number,
          journal_date: row.journal_date,
          description: row.description,
          line_description: row.line_description,
          source_type: row.source_type,
          status: row.status,
          debit_amount: debit,
          credit_amount: credit,
          running_balance: runningBalance,
          cost_center: row.cost_center,
          project_code: row.project_code,
          department: row.department
        };
      });

      res.json({
        success: true,
        data: {
          account: {
            code: account.code,
            name: account.name,
            account_type: account.account_type,
            account_category: account.account_category
          },
          summary: {
            total_debits: totalDebits,
            total_credits: totalCredits,
            net_balance: totalDebits - totalCredits
          },
          transactions: transactionsWithBalance,
          pagination: {
            page: Number(page),
            limit: Number(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error in account drill-down:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving account transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get filter options (for dropdowns)
   */
  async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      const [accountsResult, costCentersResult, projectsResult, deptResult] = await Promise.all([
        pool.query(`
          SELECT code, name, account_type 
          FROM chart_of_accounts 
          WHERE is_active = true AND allow_manual_entry = true
          ORDER BY code
        `),
        pool.query(`
          SELECT DISTINCT cost_center 
          FROM journal_entry_lines 
          WHERE cost_center IS NOT NULL
          ORDER BY cost_center
        `),
        pool.query(`
          SELECT DISTINCT project_code 
          FROM journal_entry_lines 
          WHERE project_code IS NOT NULL
          ORDER BY project_code
        `),
        pool.query(`
          SELECT DISTINCT department 
          FROM journal_entry_lines 
          WHERE department IS NOT NULL
          ORDER BY department
        `)
      ]);

      res.json({
        success: true,
        data: {
          accounts: accountsResult.rows,
          cost_centers: costCentersResult.rows.map(r => r.cost_center),
          project_codes: projectsResult.rows.map(r => r.project_code),
          departments: deptResult.rows.map(r => r.department),
          source_types: [
            'MANUAL_ENTRY',
            'SALES_INVOICE',
            'PURCHASE_INVOICE',
            'PAYMENT',
            'RECEIPT',
            'BANK_RECONCILIATION',
            'PAYROLL',
            'DEPRECIATION',
            'RECURRING',
            'IMPORTED',
            'ADJUSTMENT'
          ],
          statuses: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'REJECTED']
        }
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving filter options',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new GLExplorerController();
