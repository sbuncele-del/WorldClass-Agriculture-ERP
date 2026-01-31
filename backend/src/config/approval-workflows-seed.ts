import pool from './database';

/**
 * Seed Approval Workflows
 * Creates default workflow configurations for journal entries
 */

async function seedApprovalWorkflows() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding approval workflows...');

    // 1. Standard Journal Entry Workflow (3 levels)
    const standardWorkflow = await client.query(`
      INSERT INTO approval_workflows (name, description, entity_type, is_active, created_by)
      VALUES (
        'Standard Journal Entry Approval',
        'Default 3-level approval workflow for journal entries: Reviewer → Finance Manager → CFO',
        'JOURNAL_ENTRY',
        true,
        'SYSTEM'
      )
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id;
    `);
    const standardWorkflowId = standardWorkflow.rows[0].id;
    console.log(`✅ Standard workflow created (ID: ${standardWorkflowId})`);

    // Standard workflow levels
    await client.query(`
      INSERT INTO approval_levels (
        workflow_id, level_number, level_name, role_required, 
        amount_threshold, is_mandatory, notification_enabled, escalation_hours
      ) VALUES
        (${standardWorkflowId}, 1, 'Reviewer', 'ACCOUNTANT', 100000.00, true, true, 24),
        (${standardWorkflowId}, 2, 'Finance Manager', 'FINANCE_MANAGER', 500000.00, true, true, 24),
        (${standardWorkflowId}, 3, 'CFO', 'CFO', NULL, true, true, 48)
      ON CONFLICT (workflow_id, level_number) DO NOTHING;
    `);
    console.log('✅ Standard workflow levels created (3 levels)');

    // 2. Express Workflow (1 level - for small amounts)
    const expressWorkflow = await client.query(`
      INSERT INTO approval_workflows (name, description, entity_type, is_active, created_by)
      VALUES (
        'Express Journal Entry Approval',
        'Fast-track 1-level approval for low-value entries (< R10,000)',
        'JOURNAL_ENTRY',
        true,
        'SYSTEM'
      )
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id;
    `);
    const expressWorkflowId = expressWorkflow.rows[0].id;
    console.log(`✅ Express workflow created (ID: ${expressWorkflowId})`);

    // Express workflow level
    await client.query(`
      INSERT INTO approval_levels (
        workflow_id, level_number, level_name, role_required, 
        amount_threshold, is_mandatory, notification_enabled, escalation_hours
      ) VALUES
        (${expressWorkflowId}, 1, 'Supervisor', 'SUPERVISOR', 10000.00, true, true, 12)
      ON CONFLICT (workflow_id, level_number) DO NOTHING;
    `);
    console.log('✅ Express workflow level created (1 level)');

    // 3. Executive Workflow (4 levels - for high-value entries)
    const executiveWorkflow = await client.query(`
      INSERT INTO approval_workflows (name, description, entity_type, is_active, created_by)
      VALUES (
        'Executive Journal Entry Approval',
        'Enhanced 4-level approval for high-value entries (> R1M)',
        'JOURNAL_ENTRY',
        true,
        'SYSTEM'
      )
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id;
    `);
    const executiveWorkflowId = executiveWorkflow.rows[0].id;
    console.log(`✅ Executive workflow created (ID: ${executiveWorkflowId})`);

    // Executive workflow levels
    await client.query(`
      INSERT INTO approval_levels (
        workflow_id, level_number, level_name, role_required, 
        amount_threshold, is_mandatory, notification_enabled, escalation_hours
      ) VALUES
        (${executiveWorkflowId}, 1, 'Senior Accountant', 'SENIOR_ACCOUNTANT', 1000000.00, true, true, 24),
        (${executiveWorkflowId}, 2, 'Finance Manager', 'FINANCE_MANAGER', 2000000.00, true, true, 24),
        (${executiveWorkflowId}, 3, 'CFO', 'CFO', 5000000.00, true, true, 48),
        (${executiveWorkflowId}, 4, 'CEO', 'CEO', NULL, true, true, 72)
      ON CONFLICT (workflow_id, level_number) DO NOTHING;
    `);
    console.log('✅ Executive workflow levels created (4 levels)');

    // 4. Adjustment Workflow (2 levels - for period adjustments)
    const adjustmentWorkflow = await client.query(`
      INSERT INTO approval_workflows (name, description, entity_type, is_active, created_by)
      VALUES (
        'Adjustment Entry Approval',
        '2-level approval for adjustment entries in closed periods',
        'JOURNAL_ENTRY',
        true,
        'SYSTEM'
      )
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id;
    `);
    const adjustmentWorkflowId = adjustmentWorkflow.rows[0].id;
    console.log(`✅ Adjustment workflow created (ID: ${adjustmentWorkflowId})`);

    // Adjustment workflow levels
    await client.query(`
      INSERT INTO approval_levels (
        workflow_id, level_number, level_name, role_required, 
        amount_threshold, is_mandatory, notification_enabled, escalation_hours
      ) VALUES
        (${adjustmentWorkflowId}, 1, 'Finance Manager', 'FINANCE_MANAGER', NULL, true, true, 12),
        (${adjustmentWorkflowId}, 2, 'CFO', 'CFO', NULL, true, true, 24)
      ON CONFLICT (workflow_id, level_number) DO NOTHING;
    `);
    console.log('✅ Adjustment workflow levels created (2 levels)');

    // Display summary
    const summary = await client.query(`
      SELECT 
        w.id, 
        w.name, 
        COUNT(l.id) as level_count,
        string_agg(l.level_name, ' → ' ORDER BY l.level_number) as approval_chain
      FROM approval_workflows w
      LEFT JOIN approval_levels l ON w.id = l.workflow_id
      WHERE w.is_active = true
      GROUP BY w.id, w.name
      ORDER BY w.id;
    `);

    console.log('\n📊 Approval Workflows Summary:');
    console.log('════════════════════════════════════════════════════════════');
    summary.rows.forEach(row => {
      console.log(`\n🔹 ${row.name}`);
      console.log(`   ID: ${row.id} | Levels: ${row.level_count}`);
      console.log(`   Chain: ${row.approval_chain}`);
    });
    console.log('════════════════════════════════════════════════════════════\n');

    await client.query('COMMIT');
    console.log('✅ Approval workflows seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding approval workflows:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed
if (require.main === module) {
  seedApprovalWorkflows()
    .then(() => {
      console.log('🎉 Approval workflow seed data created!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed approval workflows:', error);
      process.exit(1);
    });
}

export default seedApprovalWorkflows;
