import pool from './database';

/**
 * Approval Workflows Database Migration
 * Creates tables for multi-level approval workflows
 */

async function createApprovalWorkflowTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔨 Creating approval workflow tables...');

    // 1. Approval Workflows Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        entity_type VARCHAR(50) NOT NULL DEFAULT 'JOURNAL_ENTRY',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by VARCHAR(100),
        updated_at TIMESTAMP DEFAULT NOW(),
        updated_by VARCHAR(100),
        CONSTRAINT unique_workflow_name UNIQUE(name)
      );
    `);
    console.log('✅ approval_workflows table created');

    // 2. Approval Levels Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_levels (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER REFERENCES approval_workflows(id) ON DELETE CASCADE,
        level_number INTEGER NOT NULL,
        level_name VARCHAR(100) NOT NULL,
        role_required VARCHAR(100),
        approver_user_id INTEGER,
        amount_threshold DECIMAL(15,2),
        is_mandatory BOOLEAN DEFAULT true,
        notification_enabled BOOLEAN DEFAULT true,
        escalation_hours INTEGER DEFAULT 24,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_workflow_level UNIQUE(workflow_id, level_number),
        CONSTRAINT positive_level CHECK (level_number > 0),
        CONSTRAINT positive_escalation CHECK (escalation_hours > 0)
      );
    `);
    console.log('✅ approval_levels table created');

    // 3. Approval History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_history (
        id SERIAL PRIMARY KEY,
        journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
        workflow_id INTEGER REFERENCES approval_workflows(id),
        level_id INTEGER REFERENCES approval_levels(id),
        action VARCHAR(50) NOT NULL,
        comments TEXT,
        performed_by VARCHAR(100) NOT NULL,
        performed_at TIMESTAMP DEFAULT NOW(),
        ip_address VARCHAR(50),
        user_agent TEXT,
        CONSTRAINT valid_action CHECK (action IN (
          'SUBMITTED', 'APPROVED', 'REJECTED', 'RECALLED', 'ESCALATED'
        ))
      );
    `);
    console.log('✅ approval_history table created');

    // 4. Add approval columns to journal_entries table
    await client.query(`
      ALTER TABLE journal_entries
      ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'DRAFT',
      ADD COLUMN IF NOT EXISTS workflow_id INTEGER REFERENCES approval_workflows(id),
      ADD COLUMN IF NOT EXISTS current_approval_level INTEGER,
      ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
    `);
    console.log('✅ journal_entries table updated with approval columns');

    // Add check constraint for approval_status
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_approval_status'
        ) THEN
          ALTER TABLE journal_entries
          ADD CONSTRAINT chk_approval_status 
          CHECK (approval_status IN (
            'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'VOID'
          ));
        END IF;
      END $$;
    `);
    console.log('✅ approval_status constraint added');

    // 5. Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity_type 
      ON approval_workflows(entity_type) WHERE is_active = true;
      
      CREATE INDEX IF NOT EXISTS idx_approval_levels_workflow 
      ON approval_levels(workflow_id, level_number);
      
      CREATE INDEX IF NOT EXISTS idx_approval_history_journal_entry 
      ON approval_history(journal_entry_id, performed_at DESC);
      
      CREATE INDEX IF NOT EXISTS idx_journal_entries_approval_status 
      ON journal_entries(approval_status) WHERE approval_status != 'POSTED';
      
      CREATE INDEX IF NOT EXISTS idx_journal_entries_workflow 
      ON journal_entries(workflow_id, current_approval_level) 
      WHERE approval_status = 'PENDING_APPROVAL';
    `);
    console.log('✅ Indexes created for approval tables');

    await client.query('COMMIT');
    console.log('✅ Approval workflow migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating approval workflow tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
if (require.main === module) {
  createApprovalWorkflowTables()
    .then(() => {
      console.log('🎉 Approval workflow tables created!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create approval workflow tables:', error);
      process.exit(1);
    });
}

export default createApprovalWorkflowTables;
