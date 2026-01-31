import { pool, query } from '../config/database';
import { STANDARD_COA_ZA } from '../modules/financial/models/chart-of-accounts.model';
import { seedCashManagement } from './cash-management-seed';

/**
 * Seed Script - Populate Chart of Accounts with South African Standard Accounts
 */

async function seedChartOfAccounts() {
  console.log('🌱 Seeding Chart of Accounts with STANDARD_COA_ZA...\n');

  try {
    // Check if accounts already exist
    const existingResult = await query('SELECT COUNT(*) as count FROM chart_of_accounts');
    const existingCount = parseInt(existingResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing accounts. Skipping seed.`);
      console.log('   To re-seed, delete existing accounts first.\n');
      return;
    }

    console.log(`📝 Inserting ${STANDARD_COA_ZA.length} standard South African accounts...\n`);

    for (const account of STANDARD_COA_ZA) {
      await query(`
        INSERT INTO chart_of_accounts (
          code, 
          name, 
          description,
          account_type, 
          account_category, 
          normal_balance,
          is_header,
          allow_manual_entry,
          requires_reconciliation,
          is_tax_relevant,
          is_system_account,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (code) DO NOTHING
      `, [
        account.code,
        account.name,
        `${account.name} account`,
        (account as any).type,
        (account as any).category,
        (account as any).type === 'ASSET' || (account as any).type === 'EXPENSE' ? 'DEBIT' : 'CREDIT',
        (account as any).is_header || false,
        (account as any).allow_manual_entry !== false, // Default true
        (account as any).requires_reconciliation || false,
        (account as any).is_tax_relevant || false,
        (account as any).is_system_account || false,
        true   // is_active
      ]);
      
      console.log(`   ✅ ${account.code} - ${account.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${STANDARD_COA_ZA.length} accounts!\n`);
    
    // Display summary by account type
    const summary = await query(`
      SELECT 
        account_type,
        COUNT(*) as count
      FROM chart_of_accounts
      GROUP BY account_type
      ORDER BY account_type
    `);
    
    console.log('📊 Account Summary:');
    summary.rows.forEach(row => {
      console.log(`   ${row.account_type}: ${row.count} accounts`);
    });
    console.log();

    // Seed Cash Management
    console.log('💰 Seeding Cash Management data...');
    await seedCashManagement();
    console.log('✅ Cash Management seed completed\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seed script
if (require.main === module) {
  seedChartOfAccounts()
    .then(() => {
      console.log('✅ Seed script completed');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      pool.end();
      process.exit(1);
    });
}

export { seedChartOfAccounts };
