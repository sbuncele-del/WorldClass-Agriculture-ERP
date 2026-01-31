/**
 * Cash Management Tenant Hardening Migration
 *
 * Adds tenant_id columns and supporting indexes to cash/bank reconciliation tables
 * to align with tenant-aware controllers and services.
 *
 * Tables covered (if they exist):
 * - cash_bank_accounts, cash_bank_statements, cash_bank_statement_lines, cash_reconciliation_rules
 * - bank_accounts, bank_statements, bank_statement_lines, bank_reconciliation_rules, bank_reconciliation_matches
 * - cash_bank_reconciliation_matches (if present)
 */

import pool from './database';

async function addColumnIfNotExists(table: string, column: string, definition: string) {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = '${column}'
      ) THEN
        ALTER TABLE ${table} ADD COLUMN ${column} ${definition};
      END IF;
    END$$;
  `);
}

async function addIndexIfNotExists(index: string, table: string, column: string) {
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relname = '${index}') THEN
        CREATE INDEX ${index} ON ${table}(${column});
      END IF;
    END$$;
  `);
}

export async function migrateCashTenantGuards() {
  const client = await pool.connect();
  try {
    console.log('🔒 Adding tenant_id to cash management tables (idempotent)...');
    await client.query('BEGIN');

    const tables = [
      'cash_bank_accounts',
      'cash_bank_statements',
      'cash_bank_statement_lines',
      'cash_reconciliation_rules',
      'cash_bank_reconciliation_matches',
      'bank_accounts',
      'bank_statements',
      'bank_statement_lines',
      'bank_reconciliation_rules',
      'bank_reconciliation_matches'
    ];

    for (const table of tables) {
      await addColumnIfNotExists(table, 'tenant_id', 'UUID');
      await addIndexIfNotExists(`idx_${table}_tenant`, table, 'tenant_id');
    }

    await client.query('COMMIT');
    console.log('✅ Tenant columns ensured.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Tenant hardening migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run directly
if (require.main === module) {
  migrateCashTenantGuards()
    .then(() => {
      console.log('🎉 Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
