import pool from './database';

/**
 * Database schema for Audit Trail
 * Tracks all changes to financial data for compliance
 */
export async function createAuditTrailSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- What happened
        action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, POST, APPROVE, REJECT
        entity_type VARCHAR(100) NOT NULL, -- journal_entry, chart_of_accounts, etc.
        entity_id VARCHAR(100) NOT NULL,
        
        -- Who did it
        user_id UUID,
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        
        -- When
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        
        -- Where (IP address for security)
        ip_address VARCHAR(45),
        user_agent TEXT,
        
        -- What changed (JSON)
        old_values JSONB,
        new_values JSONB,
        changes JSONB, -- Specific fields that changed
        
        -- Context
        description TEXT,
        module VARCHAR(50), -- FINANCIAL, INVENTORY, HR, etc.
        severity VARCHAR(20) DEFAULT 'INFO', -- INFO, WARNING, CRITICAL
        
        -- Metadata
        session_id VARCHAR(100),
        request_id VARCHAR(100),
        
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        CONSTRAINT audit_action_check CHECK (
          action IN ('CREATE', 'UPDATE', 'DELETE', 'POST', 'APPROVE', 'REJECT', 'REVERSE', 'VOID', 'RESTORE')
        ),
        
        CONSTRAINT audit_severity_check CHECK (
          severity IN ('INFO', 'WARNING', 'CRITICAL')
        )
      )
    `);

    console.log('✅ Created audit_log table');

    // Create indexes for efficient querying
    await client.query(`
      -- Index on timestamp for date range queries
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp 
      ON audit_log(timestamp DESC);
      
      -- Index on entity for tracking specific records
      CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
      ON audit_log(entity_type, entity_id);
      
      -- Index on user for user activity tracking
      CREATE INDEX IF NOT EXISTS idx_audit_log_user 
      ON audit_log(user_id, timestamp DESC);
      
      -- Index on action for filtering by operation type
      CREATE INDEX IF NOT EXISTS idx_audit_log_action 
      ON audit_log(action);
      
      -- Index on module for filtering by business area
      CREATE INDEX IF NOT EXISTS idx_audit_log_module 
      ON audit_log(module);
      
      -- Composite index for common queries
      CREATE INDEX IF NOT EXISTS idx_audit_log_entity_timestamp 
      ON audit_log(entity_type, entity_id, timestamp DESC);
    `);

    console.log('✅ Created audit_log indexes');

    // Create audit summary view for reporting
    await client.query(`
      CREATE OR REPLACE VIEW audit_summary AS
      SELECT 
        DATE(timestamp) as audit_date,
        module,
        action,
        entity_type,
        COUNT(*) as action_count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT entity_id) as unique_entities
      FROM audit_log
      GROUP BY DATE(timestamp), module, action, entity_type
      ORDER BY audit_date DESC, action_count DESC;
    `);

    console.log('✅ Created audit_summary view');

    // Create function to automatically log changes (generic trigger function)
    await client.query(`
      CREATE OR REPLACE FUNCTION audit_trigger_function()
      RETURNS TRIGGER AS $$
      DECLARE
        old_data JSONB;
        new_data JSONB;
        action_type VARCHAR(20);
      BEGIN
        -- Determine action type
        IF (TG_OP = 'INSERT') THEN
          action_type := 'CREATE';
          new_data := to_jsonb(NEW);
          old_data := NULL;
        ELSIF (TG_OP = 'UPDATE') THEN
          action_type := 'UPDATE';
          old_data := to_jsonb(OLD);
          new_data := to_jsonb(NEW);
        ELSIF (TG_OP = 'DELETE') THEN
          action_type := 'DELETE';
          old_data := to_jsonb(OLD);
          new_data := NULL;
        END IF;
        
        -- Insert audit record
        INSERT INTO audit_log (
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          module,
          description
        ) VALUES (
          action_type,
          TG_TABLE_NAME,
          COALESCE(NEW.id::TEXT, OLD.id::TEXT),
          old_data,
          new_data,
          'FINANCIAL',
          TG_OP || ' on ' || TG_TABLE_NAME
        );
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Created audit_trigger_function');

    // Add audit triggers to key tables
    const auditedTables = [
      'journal_entries',
      'journal_entry_lines',
      'chart_of_accounts'
    ];

    for (const tableName of auditedTables) {
      await client.query(`
        DROP TRIGGER IF EXISTS audit_trigger ON ${tableName};
        
        CREATE TRIGGER audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION audit_trigger_function();
      `);
      console.log(`✅ Added audit trigger to ${tableName}`);
    }

    // Create user activity summary view
    await client.query(`
      CREATE OR REPLACE VIEW user_activity_summary AS
      SELECT 
        user_id,
        user_email,
        user_name,
        DATE(timestamp) as activity_date,
        COUNT(*) as total_actions,
        COUNT(DISTINCT entity_type) as entity_types_modified,
        MIN(timestamp) as first_action,
        MAX(timestamp) as last_action,
        ARRAY_AGG(DISTINCT action) as actions_performed
      FROM audit_log
      WHERE user_id IS NOT NULL
      GROUP BY user_id, user_email, user_name, DATE(timestamp)
      ORDER BY activity_date DESC, total_actions DESC;
    `);

    console.log('✅ Created user_activity_summary view');

    await client.query('COMMIT');
    console.log('✅ Audit Trail schema created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating Audit Trail schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed function for testing
export async function seedAuditTrail(): Promise<void> {
  const client = await pool.connect();

  try {
    // Check if we already have audit data
    const { rows } = await client.query(
      'SELECT COUNT(*) as count FROM audit_log'
    );

    if (parseInt(rows[0].count) > 0) {
      console.log('⏭️  Audit Trail already seeded, skipping...');
      return;
    }

    await client.query('BEGIN');

    // Insert sample audit records
    await client.query(`
      INSERT INTO audit_log (
        action,
        entity_type,
        entity_id,
        user_email,
        user_name,
        description,
        module,
        severity,
        timestamp
      ) VALUES
      (
        'CREATE',
        'journal_entry',
        gen_random_uuid()::TEXT,
        'john.doe@company.com',
        'John Doe',
        'Created new journal entry',
        'FINANCIAL',
        'INFO',
        NOW() - INTERVAL '1 hour'
      ),
      (
        'UPDATE',
        'chart_of_accounts',
        gen_random_uuid()::TEXT,
        'jane.smith@company.com',
        'Jane Smith',
        'Updated account name',
        'FINANCIAL',
        'INFO',
        NOW() - INTERVAL '2 hours'
      ),
      (
        'POST',
        'journal_entry',
        gen_random_uuid()::TEXT,
        'john.doe@company.com',
        'John Doe',
        'Posted journal entry',
        'FINANCIAL',
        'WARNING',
        NOW() - INTERVAL '3 hours'
      ),
      (
        'APPROVE',
        'journal_entry',
        gen_random_uuid()::TEXT,
        'manager@company.com',
        'Finance Manager',
        'Approved journal entry',
        'FINANCIAL',
        'WARNING',
        NOW() - INTERVAL '4 hours'
      ),
      (
        'DELETE',
        'journal_entry',
        gen_random_uuid()::TEXT,
        'admin@company.com',
        'System Admin',
        'Deleted draft journal entry',
        'FINANCIAL',
        'CRITICAL',
        NOW() - INTERVAL '5 hours'
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Audit Trail seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding Audit Trail:', error);
    throw error;
  } finally {
    client.release();
  }
}
