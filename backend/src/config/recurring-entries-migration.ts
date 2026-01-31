import pool from './database';

/**
 * Database schema for Recurring Journal Entries
 */
export async function createRecurringEntriesSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create recurring_journal_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_journal_entries (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        description TEXT,
        frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, annual
        frequency_config JSONB, -- { day_of_week: 1, day_of_month: 15, etc. }
        start_date DATE NOT NULL,
        end_date DATE,
        next_occurrence DATE NOT NULL,
        last_generated_date DATE,
        is_active BOOLEAN DEFAULT true,
        auto_post BOOLEAN DEFAULT false,
        total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_balanced CHECK (total_debit = total_credit)
      );
    `);

    console.log('✅ Created recurring_journal_entries table');

    // Create recurring_journal_entry_lines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_journal_entry_lines (
        id SERIAL PRIMARY KEY,
        recurring_entry_id INTEGER NOT NULL REFERENCES recurring_journal_entries(id) ON DELETE CASCADE,
        account_code VARCHAR(20) NOT NULL,
        description TEXT,
        debit_amount DECIMAL(15, 2) DEFAULT 0,
        credit_amount DECIMAL(15, 2) DEFAULT 0,
        cost_center VARCHAR(50),
        project_code VARCHAR(50),
        department VARCHAR(50),
        line_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_debit_credit CHECK (
          (debit_amount > 0 AND credit_amount = 0) OR
          (credit_amount > 0 AND debit_amount = 0)
        )
      );
    `);

    console.log('✅ Created recurring_journal_entry_lines table');

    // Create recurring_entry_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_entry_history (
        id SERIAL PRIMARY KEY,
        recurring_entry_id INTEGER NOT NULL REFERENCES recurring_journal_entries(id) ON DELETE CASCADE,
        journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
        generated_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'generated', -- generated, posted, failed
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Created recurring_entry_history table');

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recurring_entries_active 
        ON recurring_journal_entries(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_recurring_entries_next_occurrence 
        ON recurring_journal_entries(next_occurrence);
      
      CREATE INDEX IF NOT EXISTS idx_recurring_entry_lines_entry_id 
        ON recurring_journal_entry_lines(recurring_entry_id);
      
      CREATE INDEX IF NOT EXISTS idx_recurring_history_entry_id 
        ON recurring_entry_history(recurring_entry_id);
    `);

    console.log('✅ Created indexes for recurring entries tables');

    await client.query('COMMIT');
    console.log('✅ Recurring Entries schema migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating recurring entries schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drop recurring entries tables (for rollback)
 */
export async function dropRecurringEntriesSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS recurring_entry_history CASCADE');
    await client.query('DROP TABLE IF EXISTS recurring_journal_entry_lines CASCADE');
    await client.query('DROP TABLE IF EXISTS recurring_journal_entries CASCADE');

    await client.query('COMMIT');
    console.log('✅ Recurring Entries schema dropped successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error dropping recurring entries schema:', error);
    throw error;
  } finally {
    client.release();
  }
}
