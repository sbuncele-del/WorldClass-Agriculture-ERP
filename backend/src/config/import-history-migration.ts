import pool from './database';

export async function createImportHistorySchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create journal_entry_imports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entry_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name VARCHAR(255) NOT NULL,
        uploaded_by UUID,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        record_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        entries_imported INTEGER DEFAULT 0,
        lines_imported INTEGER DEFAULT 0,
        imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
        reversed_at TIMESTAMP,
        error_details TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT import_status_check CHECK (
          status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')
        )
      )
    `);

    // Create index on status for filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_imports_status 
      ON journal_entry_imports(status)
    `);

    // Create index on imported_at for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_imports_imported_at 
      ON journal_entry_imports(imported_at DESC)
    `);

    // Add import_id column to journal_entries if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'journal_entries' 
          AND column_name = 'import_id'
        ) THEN
          ALTER TABLE journal_entries 
          ADD COLUMN import_id UUID REFERENCES journal_entry_imports(id) ON DELETE SET NULL;
          
          CREATE INDEX idx_journal_entries_import_id 
          ON journal_entries(import_id);
        END IF;
      END $$;
    `);

    // Create trigger to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_import_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_import_timestamp 
      ON journal_entry_imports;
      
      CREATE TRIGGER trigger_update_import_timestamp
      BEFORE UPDATE ON journal_entry_imports
      FOR EACH ROW
      EXECUTE FUNCTION update_import_timestamp();
    `);

    await client.query('COMMIT');
    console.log('✅ Import History schema created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating Import History schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed function for testing (optional)
export async function seedImportHistory(): Promise<void> {
  const client = await pool.connect();

  try {
    // Check if we already have import history data
    const { rows } = await client.query(
      'SELECT COUNT(*) as count FROM journal_entry_imports'
    );

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Import History already seeded, skipping...');
      return;
    }

    await client.query('BEGIN');

    // Insert sample import history (for testing)
    await client.query(`
      INSERT INTO journal_entry_imports (
        id,
        file_name,
        status,
        record_count,
        error_count,
        entries_imported,
        lines_imported,
        imported_at
      ) VALUES
      (
        gen_random_uuid(),
        'january_2025_entries.csv',
        'COMPLETED',
        120,
        0,
        60,
        120,
        NOW() - INTERVAL '7 days'
      ),
      (
        gen_random_uuid(),
        'opening_balances_2024.csv',
        'COMPLETED',
        450,
        5,
        215,
        440,
        NOW() - INTERVAL '30 days'
      ),
      (
        gen_random_uuid(),
        'failed_import_test.csv',
        'FAILED',
        50,
        50,
        0,
        0,
        NOW() - INTERVAL '14 days'
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Import History seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Import History:', error);
    throw error;
  } finally {
    client.release();
  }
}
