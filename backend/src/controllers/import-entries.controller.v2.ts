/**
 * Import Entries Controller V2 - Tenant-Hardened
 * 
 * Multi-tenant secure journal entry import from CSV/Excel.
 * Validation, mapping, and batch creation.
 */

import { Response } from 'express';
import pool from '../config/database';
import { TenantRequest } from '../types';
import { parse } from 'csv-parse/sync';

// Helper to extract tenant context
function getTenantContext(req: TenantRequest): { tenantId: string; userId?: string } {
  const tenantId = req.tenant?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: req.user?.id };
}

interface ImportLine {
  line_number: number;
  journal_date?: string;
  account_code?: string;
  description?: string;
  debit_amount?: number;
  credit_amount?: number;
  cost_center?: string;
  project_code?: string;
  reference?: string;
  errors: string[];
}

interface ValidationResult {
  valid: boolean;
  total_lines: number;
  valid_lines: number;
  invalid_lines: number;
  errors: string[];
  lines: ImportLine[];
}

export class ImportEntriesControllerV2 {
  /**
   * Validate import file
   * POST /api/v2/financial/import-entries/validate
   */
  static async validateImport(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { file_content, column_mapping } = req.body;

      if (!file_content) {
        res.status(400).json({ success: false, message: 'No file content provided' });
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

      // Get valid account codes for tenant
      const accountsQuery = `
        SELECT account_code FROM chart_of_accounts
        WHERE tenant_id = $1 AND is_active = true
      `;
      const accountsResult = await pool.query(accountsQuery, [tenantId]);
      const validAccounts = new Set(accountsResult.rows.map(r => r.account_code));

      // Validate lines
      const lines: ImportLine[] = [];
      const globalErrors: string[] = [];
      let validCount = 0;
      let invalidCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const line: ImportLine = {
          line_number: i + 1,
          errors: []
        };

        // Map columns
        if (column_mapping.journal_date) {
          line.journal_date = record[column_mapping.journal_date];
          if (!line.journal_date || !isValidDate(line.journal_date)) {
            line.errors.push('Invalid or missing journal date');
          }
        } else {
          line.errors.push('Journal date mapping required');
        }

        if (column_mapping.account_code) {
          line.account_code = record[column_mapping.account_code];
          if (!line.account_code) {
            line.errors.push('Missing account code');
          } else if (!validAccounts.has(line.account_code)) {
            line.errors.push(`Invalid account code: ${line.account_code}`);
          }
        } else {
          line.errors.push('Account code mapping required');
        }

        if (column_mapping.description) {
          line.description = record[column_mapping.description];
        }

        if (column_mapping.debit_amount) {
          const debit = parseFloat(record[column_mapping.debit_amount]);
          line.debit_amount = isNaN(debit) ? 0 : debit;
        }

        if (column_mapping.credit_amount) {
          const credit = parseFloat(record[column_mapping.credit_amount]);
          line.credit_amount = isNaN(credit) ? 0 : credit;
        }

        // Validate debit/credit
        if ((line.debit_amount || 0) === 0 && (line.credit_amount || 0) === 0) {
          line.errors.push('Either debit or credit amount required');
        }

        if ((line.debit_amount || 0) > 0 && (line.credit_amount || 0) > 0) {
          line.errors.push('Cannot have both debit and credit on same line');
        }

        if (column_mapping.cost_center) {
          line.cost_center = record[column_mapping.cost_center];
        }

        if (column_mapping.project_code) {
          line.project_code = record[column_mapping.project_code];
        }

        if (column_mapping.reference) {
          line.reference = record[column_mapping.reference];
        }

        if (line.errors.length === 0) {
          validCount++;
        } else {
          invalidCount++;
        }

        lines.push(line);
      }

      // Check overall balance
      const totalDebits = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
      const totalCredits = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        globalErrors.push(`Debits (${totalDebits.toFixed(2)}) do not equal credits (${totalCredits.toFixed(2)})`);
      }

      const result: ValidationResult = {
        valid: invalidCount === 0 && globalErrors.length === 0,
        total_lines: records.length,
        valid_lines: validCount,
        invalid_lines: invalidCount,
        errors: globalErrors,
        lines
      };

      res.json({
        success: true,
        validation: result
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[ImportEntries] Validate error:', error);
      res.status(500).json({ success: false, message: 'Failed to validate import' });
    }
  }

  /**
   * Execute import (create journal entries)
   * POST /api/v2/financial/import-entries/execute
   */
  static async executeImport(req: TenantRequest, res: Response): Promise<void> {
    const client = await pool.connect();
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { lines, auto_post = false, group_by_date = true } = req.body;

      if (!lines || lines.length === 0) {
        res.status(400).json({ success: false, message: 'No lines to import' });
        return;
      }

      await client.query('BEGIN');

      const createdEntries: any[] = [];

      if (group_by_date) {
        // Group lines by date into separate journal entries
        const linesByDate = new Map<string, any[]>();
        
        for (const line of lines) {
          const date = line.journal_date;
          if (!linesByDate.has(date)) {
            linesByDate.set(date, []);
          }
          linesByDate.get(date)!.push(line);
        }

        for (const [date, dateLines] of linesByDate) {
          const entry = await createJournalEntry(
            client,
            tenantId,
            userId,
            date,
            `Imported entries for ${date}`,
            dateLines,
            auto_post
          );
          createdEntries.push(entry);
        }
      } else {
        // Create one journal entry for all lines
        const entry = await createJournalEntry(
          client,
          tenantId,
          userId,
          lines[0].journal_date,
          'Imported entries',
          lines,
          auto_post
        );
        createdEntries.push(entry);
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          entries_created: createdEntries.length,
          lines_imported: lines.length,
          entries: createdEntries
        }
      });

    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[ImportEntries] Execute error:', error);
      res.status(500).json({ success: false, message: 'Failed to execute import' });
    } finally {
      client.release();
    }
  }

  /**
   * Get import templates
   * GET /api/v2/financial/import-entries/templates
   */
  static async getImportTemplates(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);

      const query = `
        SELECT * FROM import_templates
        WHERE tenant_id = $1 OR is_system = true
        ORDER BY name
      `;

      const result = await pool.query(query, [tenantId]);

      res.json({
        success: true,
        templates: result.rows.length > 0 ? result.rows : getDefaultTemplates()
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[ImportEntries] Get templates error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch templates' });
    }
  }

  /**
   * Save import template
   * POST /api/v2/financial/import-entries/templates
   */
  static async saveImportTemplate(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = getTenantContext(req);
      const { name, column_mapping, description } = req.body;

      const query = `
        INSERT INTO import_templates (
          tenant_id, name, description, column_mapping, created_by
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tenant_id, name)
        DO UPDATE SET column_mapping = $4, description = $3, updated_at = NOW()
        RETURNING *
      `;

      const result = await pool.query(query, [
        tenantId,
        name,
        description,
        JSON.stringify(column_mapping),
        userId
      ]);

      res.json({
        success: true,
        template: result.rows[0]
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[ImportEntries] Save template error:', error);
      res.status(500).json({ success: false, message: 'Failed to save template' });
    }
  }

  /**
   * Get import history
   * GET /api/v2/financial/import-entries/history
   */
  static async getImportHistory(req: TenantRequest, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const { limit = 50, offset = 0 } = req.query;

      const query = `
        SELECT 
          ih.*,
          u.email as imported_by_email
        FROM import_history ih
        LEFT JOIN users u ON ih.imported_by = u.user_id
        WHERE ih.tenant_id = $1
        ORDER BY ih.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [tenantId, limit, offset]);

      res.json({
        success: true,
        history: result.rows
      });

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      console.error('[ImportEntries] Get history error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch import history' });
    }
  }

  /**
   * Download sample CSV template
   * GET /api/v2/financial/import-entries/sample
   */
  static async downloadSample(req: TenantRequest, res: Response): Promise<void> {
    try {
      getTenantContext(req); // Verify tenant access

      const sampleCsv = `journal_date,account_code,description,debit_amount,credit_amount,cost_center,project_code,reference
2024-01-15,1000,Cash receipt from customer,1000.00,0,MAIN,,INV-001
2024-01-15,4000,Revenue recognition,0,1000.00,MAIN,,INV-001
2024-01-16,6100,Office supplies purchase,150.00,0,ADMIN,,EXP-042
2024-01-16,2000,Accounts payable,0,150.00,ADMIN,,EXP-042`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=journal_import_sample.csv');
      res.send(sampleCsv);

    } catch (error: any) {
      if (error.message === 'Tenant context required') {
        res.status(401).json({ success: false, message: 'Unauthorized: Tenant context required' });
        return;
      }
      res.status(500).json({ success: false, message: 'Failed to generate sample' });
    }
  }
}

// Helper functions
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

async function createJournalEntry(
  client: any,
  tenantId: string,
  userId: string | undefined,
  journalDate: string,
  description: string,
  lines: any[],
  autoPost: boolean
): Promise<any> {
  // Create journal entry
  const entryNumber = `JE-IMP-${Date.now()}`;
  const status = autoPost ? 'POSTED' : 'DRAFT';

  const jeResult = await client.query(`
    INSERT INTO journal_entries (
      tenant_id, entry_number, journal_date, description,
      source_type, status, created_by
    )
    VALUES ($1, $2, $3, $4, 'IMPORT', $5, $6)
    RETURNING *
  `, [tenantId, entryNumber, journalDate, description, status, userId]);

  const journalEntryId = jeResult.rows[0].id;

  // Create lines
  for (const line of lines) {
    // Get account ID
    const accountResult = await client.query(`
      SELECT id FROM chart_of_accounts
      WHERE tenant_id = $1 AND account_code = $2
    `, [tenantId, line.account_code]);
    
    const accountId = accountResult.rows[0]?.id;

    await client.query(`
      INSERT INTO journal_entry_lines (
        tenant_id, journal_entry_id, account_id, account_code,
        description, debit_amount, credit_amount,
        cost_center, project_code
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      tenantId,
      journalEntryId,
      accountId,
      line.account_code,
      line.description,
      line.debit_amount || 0,
      line.credit_amount || 0,
      line.cost_center,
      line.project_code
    ]);
  }

  return jeResult.rows[0];
}

function getDefaultTemplates() {
  return [
    {
      name: 'Standard Journal Import',
      description: 'Basic journal entry import with date, account, amounts',
      column_mapping: {
        journal_date: 'Date',
        account_code: 'Account',
        description: 'Description',
        debit_amount: 'Debit',
        credit_amount: 'Credit'
      },
      is_system: true
    },
    {
      name: 'Extended Journal Import',
      description: 'Full journal entry import with cost centers and projects',
      column_mapping: {
        journal_date: 'Date',
        account_code: 'Account',
        description: 'Description',
        debit_amount: 'Debit',
        credit_amount: 'Credit',
        cost_center: 'Cost Center',
        project_code: 'Project',
        reference: 'Reference'
      },
      is_system: true
    }
  ];
}

export default ImportEntriesControllerV2;
