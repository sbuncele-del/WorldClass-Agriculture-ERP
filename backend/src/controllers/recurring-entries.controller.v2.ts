/**
 * Recurring Entries Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure recurring journal entry management.
 * Automated entry generation and scheduling.
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

interface RecurringEntryLine {
  account_code: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
}

export class RecurringEntriesControllerV2 {
  /**
   * Get all recurring entries
   * GET /api/v2/financial/recurring-entries
   */
  static async getRecurringEntries(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { status = 'all' } = req.query;

      let conditions: string[] = ['re.tenant_id = $1'];
      const params: any[] = [tenantId];

      if (status === 'active') {
        conditions.push("re.status = 'active'");
      } else if (status === 'inactive') {
        conditions.push("re.status != 'active'");
      }

      const query = `
        SELECT re.*
        FROM recurring_entries re
        WHERE ${conditions.join(' AND ')}
        ORDER BY re.next_run_date ASC, re.created_at DESC
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Get entries error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recurring entries' });
    }
  }

  /**
   * Get recurring entry by ID
   * GET /api/v2/financial/recurring-entries/:id
   */
  static async getRecurringEntryById(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      // Get entry
      const entryQuery = `
        SELECT * FROM recurring_journal_entries
        WHERE id = $1 AND tenant_id = $2
      `;
      const entryResult = await pool.query(entryQuery, [id, tenantId]);

      if (entryResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Recurring entry not found' });
        return;
      }

      // Get lines
      const linesQuery = `
        SELECT * FROM recurring_journal_entry_lines
        WHERE recurring_entry_id = $1
        ORDER BY line_order
      `;
      const linesResult = await pool.query(linesQuery, [id]);

      // Get history
      const historyQuery = `
        SELECT * FROM recurring_entry_history
        WHERE recurring_entry_id = $1
        ORDER BY generated_date DESC
        LIMIT 10
      `;
      const historyResult = await pool.query(historyQuery, [id]);

      res.json({
        success: true,
        data: {
          ...entryResult.rows[0],
          lines: linesResult.rows,
          history: historyResult.rows
        }
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Get entry error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recurring entry' });
    }
  }

  /**
   * Create recurring entry
   * POST /api/v2/financial/recurring-entries
   */
  static async createRecurringEntry(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const {
        template_name,
        description,
        frequency,
        frequency_config,
        start_date,
        end_date,
        auto_post,
        lines
      } = req.body;

      await client.query('BEGIN');

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(start_date, frequency, frequency_config);

      // Create entry
      const entryQuery = `
        INSERT INTO recurring_journal_entries (
          tenant_id, template_name, description, frequency,
          frequency_config, start_date, end_date, auto_post,
          next_occurrence, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
        RETURNING *
      `;

      const entryResult = await client.query(entryQuery, [
        tenantId,
        template_name,
        description,
        frequency,
        JSON.stringify(frequency_config || {}),
        start_date,
        end_date,
        auto_post || false,
        nextOccurrence,
        userId
      ]);

      const entryId = entryResult.rows[0].id;

      // Add lines
      if (lines && lines.length > 0) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await client.query(`
            INSERT INTO recurring_journal_entry_lines (
              recurring_entry_id, account_code, description,
              debit_amount, credit_amount, cost_center,
              project_code, department, line_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            entryId,
            line.account_code,
            line.description,
            line.debit_amount || 0,
            line.credit_amount || 0,
            line.cost_center,
            line.project_code,
            line.department,
            line.line_order || i + 1
          ]);
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: entryResult.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Create error:', error);
      res.status(500).json({ success: false, message: 'Failed to create recurring entry' });
    } finally {
      client.release();
    }
  }

  /**
   * Update recurring entry
   * PUT /api/v2/financial/recurring-entries/:id
   */
  static async updateRecurringEntry(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const {
        template_name,
        description,
        frequency,
        frequency_config,
        start_date,
        end_date,
        auto_post,
        is_active,
        lines
      } = req.body;

      await client.query('BEGIN');

      // Verify ownership
      const checkResult = await client.query(
        'SELECT id FROM recurring_journal_entries WHERE id = $1 AND tenant_id = $2',
        [id, tenantId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, message: 'Recurring entry not found' });
        return;
      }

      // Update entry
      const updateQuery = `
        UPDATE recurring_journal_entries
        SET template_name = COALESCE($1, template_name),
            description = COALESCE($2, description),
            frequency = COALESCE($3, frequency),
            frequency_config = COALESCE($4, frequency_config),
            start_date = COALESCE($5, start_date),
            end_date = $6,
            auto_post = COALESCE($7, auto_post),
            is_active = COALESCE($8, is_active),
            updated_at = NOW(),
            updated_by = $9
        WHERE id = $10 AND tenant_id = $11
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        template_name,
        description,
        frequency,
        frequency_config ? JSON.stringify(frequency_config) : null,
        start_date,
        end_date,
        auto_post,
        is_active,
        userId,
        id,
        tenantId
      ]);

      // Update lines if provided
      if (lines) {
        await client.query('DELETE FROM recurring_journal_entry_lines WHERE recurring_entry_id = $1', [id]);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await client.query(`
            INSERT INTO recurring_journal_entry_lines (
              recurring_entry_id, account_code, description,
              debit_amount, credit_amount, cost_center,
              project_code, department, line_order
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [id, line.account_code, line.description, line.debit_amount || 0,
              line.credit_amount || 0, line.cost_center, line.project_code,
              line.department, line.line_order || i + 1]);
        }
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Update error:', error);
      res.status(500).json({ success: false, message: 'Failed to update recurring entry' });
    } finally {
      client.release();
    }
  }

  /**
   * Delete recurring entry
   * DELETE /api/v2/financial/recurring-entries/:id
   */
  static async deleteRecurringEntry(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM recurring_journal_entries WHERE id = $1 AND tenant_id = $2 RETURNING *',
        [id, tenantId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Recurring entry not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Recurring entry deleted'
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Delete error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete recurring entry' });
    }
  }

  /**
   * Generate entries manually
   * POST /api/v2/financial/recurring-entries/:id/generate
   */
  static async generateEntry(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { id } = req.params;
      const { journal_date } = req.body;

      await client.query('BEGIN');

      // Get recurring entry
      const entryQuery = `
        SELECT * FROM recurring_journal_entries
        WHERE id = $1 AND tenant_id = $2 AND is_active = true
      `;
      const entryResult = await client.query(entryQuery, [id, tenantId]);

      if (entryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ success: false, message: 'Recurring entry not found or inactive' });
        return;
      }

      const entry = entryResult.rows[0];

      // Get lines
      const linesQuery = `
        SELECT * FROM recurring_journal_entry_lines
        WHERE recurring_entry_id = $1
        ORDER BY line_order
      `;
      const linesResult = await client.query(linesQuery, [id]);

      // Create journal entry
      const jeQuery = `
        INSERT INTO journal_entries (
          tenant_id, entry_number, journal_date, description,
          source_type, source_id, status, created_by
        )
        VALUES ($1, $2, $3, $4, 'RECURRING', $5, $6, $7)
        RETURNING *
      `;

      const entryNumber = `JE-REC-${Date.now()}`;
      const status = entry.auto_post ? 'POSTED' : 'DRAFT';

      const jeResult = await client.query(jeQuery, [
        tenantId,
        entryNumber,
        journal_date || new Date().toISOString().split('T')[0],
        entry.description,
        id,
        status,
        userId
      ]);

      const journalEntryId = jeResult.rows[0].id;

      // Create journal entry lines
      for (const line of linesResult.rows) {
        // Get account ID
        const accountQuery = `
          SELECT id FROM chart_of_accounts
          WHERE tenant_id = $1 AND account_code = $2
        `;
        const accountResult = await client.query(accountQuery, [tenantId, line.account_code]);
        const accountId = accountResult.rows[0]?.id;

        await client.query(`
          INSERT INTO journal_entry_lines (
            tenant_id, journal_entry_id, account_id, account_code,
            description, debit_amount, credit_amount,
            cost_center, project_code, department
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          tenantId,
          journalEntryId,
          accountId,
          line.account_code,
          line.description,
          line.debit_amount,
          line.credit_amount,
          line.cost_center,
          line.project_code,
          line.department
        ]);
      }

      // Log generation
      await client.query(`
        INSERT INTO recurring_entry_history (
          recurring_entry_id, journal_entry_id, generated_date, generated_by
        )
        VALUES ($1, $2, NOW(), $3)
      `, [id, journalEntryId, userId]);

      // Update next occurrence
      const nextOccurrence = calculateNextOccurrence(
        entry.next_occurrence,
        entry.frequency,
        entry.frequency_config
      );

      await client.query(`
        UPDATE recurring_journal_entries
        SET next_occurrence = $1, last_generated = NOW()
        WHERE id = $2 AND tenant_id = $3
      `, [nextOccurrence, id, tenantId]);

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          journal_entry: jeResult.rows[0],
          next_occurrence: nextOccurrence
        }
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Generate error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate entry' });
    } finally {
      client.release();
    }
  }

  /**
   * Get pending entries (due for generation)
   * GET /api/v2/financial/recurring-entries/pending
   */
  static async getPendingEntries(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT *
        FROM recurring_journal_entries
        WHERE tenant_id = $1
          AND is_active = true
          AND next_occurrence <= CURRENT_DATE
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY next_occurrence ASC
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[RecurringEntries] Get pending error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pending entries' });
    }
  }
}

// Helper function to calculate next occurrence
function calculateNextOccurrence(
  currentDate: string,
  frequency: string,
  config: any
): string {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

export default RecurringEntriesControllerV2;
