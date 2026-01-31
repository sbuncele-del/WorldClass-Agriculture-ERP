import { Request, Response } from 'express';
import pool from '../config/database';
import { parse } from 'csv-parse/sync';

interface ImportLine {
  line_number: number;
  journal_date?: string;
  account_code?: string;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  cost_center?: string;
  project_code?: string;
  department?: string;
  reference?: string;
  errors: string[];
}

interface ValidationResult {
  valid: boolean;
  total_lines: number;
  valid_lines: number;
  invalid_lines: number;
  total_entries: number;
  errors: string[];
  lines: ImportLine[];
}

export class ImportEntriesController {
  /**
   * Parse and validate CSV/Excel file
   * POST /api/financial/import-entries/validate
   */
  static async validateImport(req: Request, res: Response): Promise<void> {
    try {
      const { file_content, column_mapping } = req.body;

      if (!file_content) {
        res.status(400).json({
          success: false,
          message: 'No file content provided'
        });
        return;
      }

      // Parse CSV
      let records: any[];
      try {
        records = parse(file_content, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: 'Failed to parse CSV file',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
      }

      // Map columns
      const lines: ImportLine[] = [];
      let lineNumber = 1;

      for (const record of records) {
        const line: ImportLine = {
          line_number: lineNumber++,
          errors: []
        };

        // Map columns based on user selection
        if (column_mapping.journal_date) {
          line.journal_date = record[column_mapping.journal_date];
        }
        if (column_mapping.account_code) {
          line.account_code = record[column_mapping.account_code];
        }
        if (column_mapping.description) {
          line.description = record[column_mapping.description];
        }
        if (column_mapping.debit_amount) {
          line.debit_amount = parseFloat(record[column_mapping.debit_amount]) || 0;
        }
        if (column_mapping.credit_amount) {
          line.credit_amount = parseFloat(record[column_mapping.credit_amount]) || 0;
        }
        if (column_mapping.cost_center) {
          line.cost_center = record[column_mapping.cost_center];
        }
        if (column_mapping.project_code) {
          line.project_code = record[column_mapping.project_code];
        }
        if (column_mapping.department) {
          line.department = record[column_mapping.department];
        }
        if (column_mapping.reference) {
          line.reference = record[column_mapping.reference];
        }

        lines.push(line);
      }

      // Validate lines
      const validation = await validateLines(lines);

      res.json({
        success: true,
        data: validation
      });

    } catch (error) {
      console.error('Error validating import:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate import',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Import validated journal entries
   * POST /api/financial/import-entries/import
   */
  static async importEntries(req: Request, res: Response): Promise<void> {
    const client = await pool.connect();

    try {
      const { lines, batch_name, auto_post } = req.body;

      if (!lines || lines.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No lines to import'
        });
        return;
      }

      // Re-validate
      const validation = await validateLines(lines);

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          data: validation
        });
        return;
      }

      await client.query('BEGIN');

      // Group lines by journal entry (same date + description or by entry marker)
      const entries = groupLinesIntoEntries(lines);

      const importedEntries: any[] = [];
      let entryNumber = 1;

      for (const entry of entries) {
        // Calculate totals
        const totalDebit = entry.lines.reduce((sum: number, line: ImportLine) => 
          sum + (line.debit_amount || 0), 0);
        const totalCredit = entry.lines.reduce((sum: number, line: ImportLine) => 
          sum + (line.credit_amount || 0), 0);

        // Check if balanced
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`Entry ${entryNumber} is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`);
        }

        // Get fiscal period
        const fiscalPeriod = await getFiscalPeriod(entry.journal_date);

        // Create journal entry
        const jeResult = await client.query(
          `INSERT INTO journal_entries 
           (entry_number, journal_date, posting_date, source_type, description, 
            status, fiscal_year, fiscal_period, total_debit, total_credit, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [
            `IMP-${Date.now()}-${entryNumber}`,
            entry.journal_date,
            entry.journal_date,
            'IMPORT',
            batch_name || `Imported Entry ${entryNumber}`,
            auto_post ? 'POSTED' : 'DRAFT',
            fiscalPeriod.fiscal_year,
            fiscalPeriod.fiscal_period,
            totalDebit,
            totalCredit,
            req.body.user_id || 'import_system'
          ]
        );

        const journalEntryId = jeResult.rows[0].entry_id;

        // Create journal entry lines
        for (let i = 0; i < entry.lines.length; i++) {
          const line = entry.lines[i];

          // Get account details
          const accountResult = await client.query(
            'SELECT account_id, account_code, account_name FROM chart_of_accounts WHERE account_code = $1',
            [line.account_code]
          );

          if (accountResult.rows.length === 0) {
            throw new Error(`Account ${line.account_code} not found`);
          }

          const account = accountResult.rows[0];

          await client.query(
            `INSERT INTO journal_entry_lines 
             (journal_entry_id, line_number, account_id, account_code, account_name,
              debit_amount, credit_amount, line_description, reference,
              cost_center, project_code, department)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              journalEntryId,
              i + 1,
              account.account_id,
              account.account_code,
              account.account_name,
              line.debit_amount || 0,
              line.credit_amount || 0,
              line.description || null,
              line.reference || null,
              line.cost_center || null,
              line.project_code || null,
              line.department || null
            ]
          );
        }

        importedEntries.push(jeResult.rows[0]);
        entryNumber++;
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedEntries.length} journal entries`,
        data: {
          entries_imported: importedEntries.length,
          lines_imported: lines.length,
          entries: importedEntries
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error importing entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import entries',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      client.release();
    }
  }

  /**
   * Get import template
   * GET /api/financial/import-entries/template
   */
  static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = [
        'journal_date,account_code,description,debit_amount,credit_amount,cost_center,reference',
        '2024-01-15,1100,Cash receipt,1000.00,0.00,,REF001',
        '2024-01-15,4100,Sales revenue,0.00,1000.00,,REF001',
        '2024-01-16,6100,Office supplies,250.00,0.00,CC01,REF002',
        '2024-01-16,2100,Accounts payable,0.00,250.00,,REF002'
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=journal_entries_template.csv');
      res.send(template);

    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate template'
      });
    }
  }

  /**
   * Get import history
   * GET /api/financial/import-entries/history
   */
  static async getImportHistory(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        `SELECT 
          je.entry_id,
          je.journal_number,
          je.journal_date,
          je.description,
          je.total_debit,
          je.total_credit,
          je.status,
          je.created_at,
          je.created_by,
          COUNT(jel.line_id) as line_count
         FROM journal_entries je
         LEFT JOIN journal_entry_lines jel ON je.entry_id = jel.journal_entry_id
         WHERE je.source_type = 'IMPORT'
         GROUP BY je.entry_id
         ORDER BY je.created_at DESC
         LIMIT 50`
      );

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Error fetching import history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch import history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

/**
 * Validate import lines
 */
async function validateLines(lines: ImportLine[]): Promise<ValidationResult> {
  const errors: string[] = [];
  let validLines = 0;
  let invalidLines = 0;

  for (const line of lines) {
    line.errors = [];

    // Required fields
    if (!line.journal_date) {
      line.errors.push('Journal date is required');
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(line.journal_date)) {
        line.errors.push('Invalid date format (use YYYY-MM-DD)');
      }
    }

    if (!line.account_code) {
      line.errors.push('Account code is required');
    } else {
      // Validate account exists
      const accountResult = await pool.query(
        'SELECT code FROM chart_of_accounts WHERE code = $1',
        [line.account_code]
      );
      if (accountResult.rows.length === 0) {
        line.errors.push(`Account ${line.account_code} does not exist`);
      }
    }

    // Validate amounts
    const debit = line.debit_amount || 0;
    const credit = line.credit_amount || 0;

    if (debit === 0 && credit === 0) {
      line.errors.push('Either debit or credit amount must be greater than zero');
    }

    if (debit > 0 && credit > 0) {
      line.errors.push('Cannot have both debit and credit amounts');
    }

    if (debit < 0 || credit < 0) {
      line.errors.push('Amounts cannot be negative');
    }

    // Count valid/invalid
    if (line.errors.length === 0) {
      validLines++;
    } else {
      invalidLines++;
      errors.push(...line.errors.map(err => `Line ${line.line_number}: ${err}`));
    }
  }

  // Count unique entries (grouped by date)
  const uniqueDates = new Set(lines.map(l => l.journal_date).filter(Boolean));
  const totalEntries = uniqueDates.size;

  return {
    valid: invalidLines === 0,
    total_lines: lines.length,
    valid_lines: validLines,
    invalid_lines: invalidLines,
    total_entries: totalEntries,
    errors,
    lines
  };
}

/**
 * Group lines into journal entries
 */
function groupLinesIntoEntries(lines: ImportLine[]): any[] {
  const entries: Map<string, any> = new Map();

  for (const line of lines) {
    const key = line.journal_date || 'unknown';

    if (!entries.has(key)) {
      entries.set(key, {
        journal_date: line.journal_date,
        lines: []
      });
    }

    entries.get(key).lines.push(line);
  }

  return Array.from(entries.values());
}

/**
 * Get fiscal period for a date
 */
async function getFiscalPeriod(dateString?: string): Promise<{ fiscal_year: number; fiscal_period: number }> {
  if (!dateString) {
    dateString = new Date().toISOString().split('T')[0];
  }

  const date = new Date(dateString);
  const month = date.getMonth(); // 0-11

  // South African fiscal year: March - February
  let fiscalYear: number;
  let fiscalPeriod: number;

  if (month >= 2) { // March (2) onwards
    fiscalYear = date.getFullYear();
    fiscalPeriod = month - 2 + 1; // March = period 1
  } else { // January, February
    fiscalYear = date.getFullYear() - 1;
    fiscalPeriod = month + 10 + 1; // January = period 11, February = period 12
  }

  return { fiscal_year: fiscalYear, fiscal_period: fiscalPeriod };
}
