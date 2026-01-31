import { Request, Response } from 'express';
import pool from '../config/database';

interface RecurringEntryLine {
  account_code: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
  line_order?: number;
}

interface FrequencyConfig {
  day_of_week?: number; // 0-6 (Sunday-Saturday)
  day_of_month?: number; // 1-31
  month?: number; // 1-12
  quarter_month?: number; // 1-3
}

interface RecurringEntry {
  id?: number;
  template_name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  frequency_config?: FrequencyConfig;
  start_date: string;
  end_date?: string;
  auto_post: boolean;
  lines: RecurringEntryLine[];
}

export class RecurringEntriesController {
  /**
   * Get all recurring entries
   * GET /api/financial/recurring-entries
   */
  static async getRecurringEntries(req: Request, res: Response): Promise<void> {
    try {
      const { status = 'all' } = req.query;

      let query = `
        SELECT 
          re.*,
          COUNT(DISTINCT rel.id) as line_count,
          COUNT(DISTINCT reh.id) as generation_count,
          MAX(reh.generated_date) as last_generated
        FROM recurring_journal_entries re
        LEFT JOIN recurring_journal_entry_lines rel ON re.id = rel.recurring_entry_id
        LEFT JOIN recurring_entry_history reh ON re.id = reh.recurring_entry_id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (status === 'active') {
        conditions.push('re.is_active = true');
      } else if (status === 'inactive') {
        conditions.push('re.is_active = false');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += `
        GROUP BY re.id
        ORDER BY re.next_occurrence ASC, re.created_at DESC
      `;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Error fetching recurring entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recurring entries',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get single recurring entry with lines
   * GET /api/financial/recurring-entries/:id
   */
  static async getRecurringEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get entry
      const entryResult = await pool.query(
        'SELECT * FROM recurring_journal_entries WHERE id = $1',
        [id]
      );

      if (entryResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recurring entry not found'
        });
        return;
      }

      // Get lines
      const linesResult = await pool.query(
        `SELECT rel.*, coa.name as account_name
         FROM recurring_journal_entry_lines rel
         LEFT JOIN chart_of_accounts coa ON rel.account_code = coa.code
         WHERE rel.recurring_entry_id = $1
         ORDER BY rel.line_order`,
        [id]
      );

      // Get history
      const historyResult = await pool.query(
        `SELECT reh.*, je.journal_number
         FROM recurring_entry_history reh
         LEFT JOIN journal_entries je ON reh.journal_entry_id = je.entry_id
         WHERE reh.recurring_entry_id = $1
         ORDER BY reh.generated_date DESC
         LIMIT 20`,
        [id]
      );

      res.json({
        success: true,
        data: {
          ...entryResult.rows[0],
          lines: linesResult.rows,
          history: historyResult.rows
        }
      });

    } catch (error) {
      console.error('Error fetching recurring entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recurring entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new recurring entry
   * POST /api/financial/recurring-entries
   */
  static async createRecurringEntry(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      const entry: RecurringEntry = req.body;

      // Validate entry
      if (!entry.template_name || !entry.frequency || !entry.start_date || !entry.lines || entry.lines.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: template_name, frequency, start_date, lines'
        });
        return;
      }

      // Calculate totals
      const totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
      const totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        res.status(400).json({
          success: false,
          message: `Entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`
        });
        return;
      }

      // Calculate next occurrence
      const nextOccurrence = calculateNextOccurrence(
        entry.start_date,
        entry.frequency,
        entry.frequency_config
      );

      await client.query('BEGIN');

      // Insert recurring entry
      const entryResult = await client.query(
        `INSERT INTO recurring_journal_entries 
         (template_name, description, frequency, frequency_config, start_date, end_date, 
          next_occurrence, auto_post, total_debit, total_credit, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          entry.template_name,
          entry.description || null,
          entry.frequency,
          JSON.stringify(entry.frequency_config || {}),
          entry.start_date,
          entry.end_date || null,
          nextOccurrence,
          entry.auto_post,
          totalDebit,
          totalCredit,
          req.body.created_by || 'system'
        ]
      );

      const recurringEntryId = entryResult.rows[0].id;

      // Insert lines
      for (let i = 0; i < entry.lines.length; i++) {
        const line = entry.lines[i];
        await client.query(
          `INSERT INTO recurring_journal_entry_lines 
           (recurring_entry_id, account_code, description, debit_amount, credit_amount, 
            cost_center, project_code, department, line_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            recurringEntryId,
            line.account_code,
            line.description || null,
            line.debit_amount || 0,
            line.credit_amount || 0,
            line.cost_center || null,
            line.project_code || null,
            line.department || null,
            line.line_order || i
          ]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Recurring entry created successfully',
        data: entryResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating recurring entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create recurring entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      client.release();
    }
  }

  /**
   * Update recurring entry
   * PUT /api/financial/recurring-entries/:id
   */
  static async updateRecurringEntry(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const entry: RecurringEntry = req.body;

      // Check if entry exists
      const existingEntry = await client.query(
        'SELECT * FROM recurring_journal_entries WHERE id = $1',
        [id]
      );

      if (existingEntry.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recurring entry not found'
        });
        return;
      }

      await client.query('BEGIN');

      // Calculate totals if lines provided
      let totalDebit = existingEntry.rows[0].total_debit;
      let totalCredit = existingEntry.rows[0].total_credit;

      if (entry.lines && entry.lines.length > 0) {
        totalDebit = entry.lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
        totalCredit = entry.lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          res.status(400).json({
            success: false,
            message: `Entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`
          });
          return;
        }

        // Delete existing lines
        await client.query(
          'DELETE FROM recurring_journal_entry_lines WHERE recurring_entry_id = $1',
          [id]
        );

        // Insert new lines
        for (let i = 0; i < entry.lines.length; i++) {
          const line = entry.lines[i];
          await client.query(
            `INSERT INTO recurring_journal_entry_lines 
             (recurring_entry_id, account_code, description, debit_amount, credit_amount, 
              cost_center, project_code, department, line_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              id,
              line.account_code,
              line.description || null,
              line.debit_amount || 0,
              line.credit_amount || 0,
              line.cost_center || null,
              line.project_code || null,
              line.department || null,
              line.line_order || i
            ]
          );
        }
      }

      // Update recurring entry
      const updateResult = await client.query(
        `UPDATE recurring_journal_entries 
         SET template_name = COALESCE($1, template_name),
             description = COALESCE($2, description),
             frequency = COALESCE($3, frequency),
             frequency_config = COALESCE($4, frequency_config),
             start_date = COALESCE($5, start_date),
             end_date = $6,
             auto_post = COALESCE($7, auto_post),
             total_debit = $8,
             total_credit = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING *`,
        [
          entry.template_name,
          entry.description,
          entry.frequency,
          entry.frequency_config ? JSON.stringify(entry.frequency_config) : null,
          entry.start_date,
          entry.end_date || null,
          entry.auto_post,
          totalDebit,
          totalCredit,
          id
        ]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Recurring entry updated successfully',
        data: updateResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating recurring entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update recurring entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      client.release();
    }
  }

  /**
   * Delete recurring entry
   * DELETE /api/financial/recurring-entries/:id
   */
  static async deleteRecurringEntry(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM recurring_journal_entries WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recurring entry not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Recurring entry deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting recurring entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete recurring entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Toggle active status
   * PATCH /api/financial/recurring-entries/:id/toggle
   */
  static async toggleActive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE recurring_journal_entries 
         SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recurring entry not found'
        });
        return;
      }

      res.json({
        success: true,
        message: `Recurring entry ${result.rows[0].is_active ? 'activated' : 'paused'}`,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error toggling recurring entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle recurring entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate journal entry from recurring template
   * POST /api/financial/recurring-entries/:id/generate
   */
  static async generateEntry(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const { journal_date } = req.body;

      // Get recurring entry with lines
      const entryResult = await client.query(
        'SELECT * FROM recurring_journal_entries WHERE id = $1 AND is_active = true',
        [id]
      );

      if (entryResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Recurring entry not found or inactive'
        });
        return;
      }

      const recurringEntry = entryResult.rows[0];

      // Get lines
      const linesResult = await client.query(
        'SELECT * FROM recurring_journal_entry_lines WHERE recurring_entry_id = $1 ORDER BY line_order',
        [id]
      );

      await client.query('BEGIN');

      // Create journal entry
      const jeResult = await client.query(
        `INSERT INTO journal_entries 
         (journal_date, description, is_posted, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          journal_date || new Date().toISOString().split('T')[0],
          `${recurringEntry.template_name} - Auto-generated`,
          recurringEntry.auto_post,
          'recurring_system'
        ]
      );

      const journalEntryId = jeResult.rows[0].id;

      // Create journal entry lines
      for (const line of linesResult.rows) {
        await client.query(
          `INSERT INTO journal_entry_lines 
           (journal_entry_id, account_code, description, debit_amount, credit_amount, 
            cost_center, project_code, department)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            journalEntryId,
            line.account_code,
            line.description,
            line.debit_amount,
            line.credit_amount,
            line.cost_center,
            line.project_code,
            line.department
          ]
        );
      }

      // Record in history
      await client.query(
        `INSERT INTO recurring_entry_history 
         (recurring_entry_id, journal_entry_id, generated_date, status)
         VALUES ($1, $2, $3, $4)`,
        [id, journalEntryId, journal_date || new Date().toISOString().split('T')[0], 'generated']
      );

      // Update next occurrence
      const nextOccurrence = calculateNextOccurrence(
        journal_date || new Date().toISOString().split('T')[0],
        recurringEntry.frequency,
        recurringEntry.frequency_config
      );

      await client.query(
        `UPDATE recurring_journal_entries 
         SET next_occurrence = $1, last_generated_date = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [nextOccurrence, journal_date || new Date().toISOString().split('T')[0], id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Journal entry generated successfully',
        data: jeResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error generating entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate journal entry',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      client.release();
    }
  }
}

/**
 * Calculate next occurrence date based on frequency
 */
function calculateNextOccurrence(
  currentDate: string,
  frequency: string,
  config?: FrequencyConfig
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
      if (config?.day_of_month) {
        date.setMonth(date.getMonth() + 1);
        date.setDate(Math.min(config.day_of_month, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
      } else {
        date.setMonth(date.getMonth() + 1);
      }
      break;

    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;

    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;

    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return date.toISOString().split('T')[0];
}
