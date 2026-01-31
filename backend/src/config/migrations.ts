import { pool, query } from '../config/database';
import { migrateCashManagement } from './cash-management-migration';
import { createRecurringEntriesSchema } from './recurring-entries-migration';
import { createImportHistorySchema } from './import-history-migration';
import { createAuditTrailSchema } from './audit-trail-migration';
import { createTaxSettingsSchema } from './tax-settings-migration';
import { runFinancialForecastingMigration } from './financial-forecasting-migration';
import { runCustomReportsMigration } from './custom-reports-migration';
import { runSalesMigration } from './sales-migration';
import { runPurchaseMigration } from './purchase-migration';
import { runInventoryMigration } from './inventory-migration';
import { runHRMigration } from './hr-migration';
import { runPracticeIntegrationMigration } from './practice-integration-migration';
import { runClientPortalMigration } from './client-portal-migration';
import { createAssetManagementTables } from './asset-management-migration';
import { runManufacturingMigration } from './manufacturing-migration';
import { runDriverAuthMigration } from './driver-auth-migration';

/**
 * Database Migration Script
 * Creates all tables for the Financial Module
 */

async function runMigrations() {
  console.log('🔧 Starting database migrations...\n');

  try {
    // 1. Create Chart of Accounts table
    console.log('📊 Creating chart_of_accounts table...');
    await query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        
        -- Account Classification
        account_type VARCHAR(50) NOT NULL,
        account_category VARCHAR(50) NOT NULL,
        normal_balance VARCHAR(10) NOT NULL,
        
        -- Hierarchy
        parent_account_id UUID,
        level INTEGER NOT NULL DEFAULT 1,
        is_header BOOLEAN NOT NULL DEFAULT false,
        
        -- Configuration
        allow_manual_entry BOOLEAN NOT NULL DEFAULT true,
        require_cost_center BOOLEAN NOT NULL DEFAULT false,
        requires_reconciliation BOOLEAN NOT NULL DEFAULT false,
        is_system_account BOOLEAN NOT NULL DEFAULT false,
        
        -- Multi-currency
        currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
        allow_foreign_currency BOOLEAN NOT NULL DEFAULT false,
        
        -- Tax
        default_tax_code VARCHAR(20),
        is_tax_relevant BOOLEAN NOT NULL DEFAULT false,
        
        -- Balances (denormalized for performance)
        current_debit_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        current_credit_balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        ytd_debit_total DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        ytd_credit_total DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Status
        is_active BOOLEAN NOT NULL DEFAULT true,
        
        -- Audit
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        
        CONSTRAINT fk_parent_account FOREIGN KEY (parent_account_id) 
          REFERENCES chart_of_accounts(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_coa_code ON chart_of_accounts(code);
      CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);
      CREATE INDEX IF NOT EXISTS idx_coa_parent ON chart_of_accounts(parent_account_id);
      CREATE INDEX IF NOT EXISTS idx_coa_active ON chart_of_accounts(is_active);
    `);
    console.log('✅ chart_of_accounts table created\n');

    // 2. Create Journal Entries table
    console.log('📊 Creating journal_entries table...');
    await query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_number VARCHAR(50) NOT NULL UNIQUE,
        journal_date DATE NOT NULL,
        posting_date DATE NOT NULL,
        
        -- Source
        source_type VARCHAR(50) NOT NULL,
        source_document_id UUID,
        source_document_number VARCHAR(100),
        
        -- Status
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        posted_at TIMESTAMP WITH TIME ZONE,
        posted_by UUID,
        
        -- Description
        description TEXT NOT NULL,
        notes TEXT,
        
        -- Period
        fiscal_year INTEGER NOT NULL,
        fiscal_period INTEGER NOT NULL,
        is_adjusting_entry BOOLEAN NOT NULL DEFAULT false,
        
        -- Totals (must balance!)
        total_debit DECIMAL(18, 2) NOT NULL,
        total_credit DECIMAL(18, 2) NOT NULL,
        
        -- Multi-currency
        currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
        exchange_rate DECIMAL(12, 6) NOT NULL DEFAULT 1.000000,
        
        -- Reversing entry
        is_reversing BOOLEAN NOT NULL DEFAULT false,
        reverse_on_date DATE,
        reversed_by_journal_id UUID,
        reverses_journal_id UUID,
        
        -- Approvals
        requires_approval BOOLEAN NOT NULL DEFAULT false,
        approved_by UUID,
        approved_at TIMESTAMP WITH TIME ZONE,
        
        -- Audit
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID NOT NULL,
        updated_by UUID,
        
        CONSTRAINT check_balanced CHECK (total_debit = total_credit),
        CONSTRAINT fk_reversed_by FOREIGN KEY (reversed_by_journal_id) 
          REFERENCES journal_entries(id),
        CONSTRAINT fk_reverses FOREIGN KEY (reverses_journal_id) 
          REFERENCES journal_entries(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_je_journal_number ON journal_entries(journal_number);
      CREATE INDEX IF NOT EXISTS idx_je_journal_date ON journal_entries(journal_date);
      CREATE INDEX IF NOT EXISTS idx_je_posting_date ON journal_entries(posting_date);
      CREATE INDEX IF NOT EXISTS idx_je_status ON journal_entries(status);
      CREATE INDEX IF NOT EXISTS idx_je_fiscal_period ON journal_entries(fiscal_year, fiscal_period);
      CREATE INDEX IF NOT EXISTS idx_je_source ON journal_entries(source_type, source_document_id);
    `);
    console.log('✅ journal_entries table created\n');

    // 3. Create Journal Entry Lines table
    console.log('📊 Creating journal_entry_lines table...');
    await query(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        journal_entry_id UUID NOT NULL,
        line_number INTEGER NOT NULL,
        
        -- Account
        account_id UUID NOT NULL,
        account_code VARCHAR(20) NOT NULL,
        account_name VARCHAR(200) NOT NULL,
        
        -- Debit or Credit (only ONE should have value)
        debit_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        credit_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Multi-currency
        currency_code VARCHAR(3) NOT NULL DEFAULT 'ZAR',
        exchange_rate DECIMAL(12, 6) NOT NULL DEFAULT 1.000000,
        debit_amount_base DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        credit_amount_base DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Dimensional Accounting
        cost_center_id UUID,
        department_id UUID,
        project_id UUID,
        product_id UUID,
        location_id UUID,
        
        -- Tax
        tax_code VARCHAR(20),
        tax_amount DECIMAL(18, 2),
        is_tax_line BOOLEAN NOT NULL DEFAULT false,
        
        -- Reconciliation
        is_reconciled BOOLEAN NOT NULL DEFAULT false,
        reconciled_at TIMESTAMP WITH TIME ZONE,
        reconciliation_id UUID,
        
        -- Description
        line_description TEXT,
        reference VARCHAR(100),
        
        -- Audit
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_journal_entry FOREIGN KEY (journal_entry_id) 
          REFERENCES journal_entries(id) ON DELETE CASCADE,
        CONSTRAINT fk_account FOREIGN KEY (account_id) 
          REFERENCES chart_of_accounts(id),
        CONSTRAINT check_debit_or_credit CHECK (
          (debit_amount > 0 AND credit_amount = 0) OR 
          (credit_amount > 0 AND debit_amount = 0) OR
          (debit_amount = 0 AND credit_amount = 0)
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_jel_journal_entry ON journal_entry_lines(journal_entry_id);
      CREATE INDEX IF NOT EXISTS idx_jel_account ON journal_entry_lines(account_id);
      CREATE INDEX IF NOT EXISTS idx_jel_cost_center ON journal_entry_lines(cost_center_id);
      CREATE INDEX IF NOT EXISTS idx_jel_reconciled ON journal_entry_lines(is_reconciled);
    `);
    console.log('✅ journal_entry_lines table created\n');

    // 4. Create Account Balances table (for period-level balances)
    console.log('📊 Creating account_balances table...');
    await query(`
      CREATE TABLE IF NOT EXISTS account_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL,
        fiscal_year INTEGER NOT NULL,
        fiscal_period INTEGER NOT NULL,
        
        -- Opening balance (from previous period)
        opening_debit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        opening_credit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Period activity
        period_debit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        period_credit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Closing balance
        closing_debit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        closing_credit DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
        
        -- Period status
        is_closed BOOLEAN NOT NULL DEFAULT false,
        closed_at TIMESTAMP WITH TIME ZONE,
        closed_by UUID,
        
        -- Audit
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        CONSTRAINT fk_account FOREIGN KEY (account_id) 
          REFERENCES chart_of_accounts(id),
        CONSTRAINT unique_account_period UNIQUE (account_id, fiscal_year, fiscal_period)
      );
      
      CREATE INDEX IF NOT EXISTS idx_ab_account ON account_balances(account_id);
      CREATE INDEX IF NOT EXISTS idx_ab_period ON account_balances(fiscal_year, fiscal_period);
      CREATE INDEX IF NOT EXISTS idx_ab_closed ON account_balances(is_closed);
    `);
    console.log('✅ account_balances table created\n');

    // 5. Run Cash Management Migration
    console.log('💰 Running Cash Management migration...');
    await migrateCashManagement();
    console.log('✅ Cash Management migration completed\n');

    // 6. Run Recurring Entries Migration
    console.log('🔄 Running Recurring Entries migration...');
    await createRecurringEntriesSchema();
    console.log('✅ Recurring Entries migration completed\n');

    // 7. Run Import History Migration
    console.log('📥 Running Import History migration...');
    await createImportHistorySchema();
    console.log('✅ Import History migration completed\n');

    // 8. Run Audit Trail Migration
    console.log('🛡️ Running Audit Trail migration...');
    await createAuditTrailSchema();
    console.log('✅ Audit Trail migration completed\n');

    // 9. Run Tax Settings Migration
    console.log('🏛️ Running Tax Settings migration...');
    await createTaxSettingsSchema();
    console.log('✅ Tax Settings migration completed\n');

    // 10. Run Financial Forecasting Migration
    console.log('🔮 Running Financial Forecasting migration...');
    await runFinancialForecastingMigration(pool);
    console.log('✅ Financial Forecasting migration completed\n');

    // 11. Run Custom Reports Migration
    console.log('📊 Running Custom Reports migration...');
    await runCustomReportsMigration(pool);
    console.log('✅ Custom Reports migration completed\n');

    // 12. Run Sales & CRM Migration
    console.log('🛒 Running Sales & CRM migration...');
    await runSalesMigration(pool);
    console.log('✅ Sales & CRM migration completed\n');

    // 13. Run Purchase Management Migration
    console.log('🛍️  Running Purchase Management migration...');
    await runPurchaseMigration(pool);
    console.log('✅ Purchase Management migration completed\n');

    // 14. Run Inventory Management Migration
    console.log('📦 Running Inventory Management migration...');
    await runInventoryMigration(pool);
    console.log('✅ Inventory Management migration completed\n');

    // 15. Run HR & Payroll Migration
    console.log('👥 Running HR & Payroll migration...');
    await runHRMigration(pool);
    console.log('✅ HR & Payroll migration completed\n');

    // 16. Run Practice Management Integration Migration
    console.log('🎯 Running Practice Management Integration migration...');
    await runPracticeIntegrationMigration(pool);
    console.log('✅ Practice Management Integration migration completed\n');

    // 17. Run Client Portal & Document Management Migration
    console.log('📱 Running Client Portal & Document Management migration...');
    await runClientPortalMigration(pool);
    console.log('✅ Client Portal & Document Management migration completed\n');

    // 18. Run Asset Management Migration
    console.log('🔨 Running Asset Management migration...');
    await createAssetManagementTables(pool);
    console.log('✅ Asset Management migration completed\n');

    // 19. Run Manufacturing Module Migration
    console.log('🏭 Running Manufacturing Module migration...');
    await runManufacturingMigration(pool);
    console.log('✅ Manufacturing Module migration completed\n');

    // 20. Run Driver Authentication Migration
    console.log('🚗 Running Driver Authentication migration...');
    await runDriverAuthMigration(pool);
    console.log('✅ Driver Authentication migration completed\n');

    console.log('🎉 All migrations completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      pool.end();
      process.exit(1);
    });
}

export { runMigrations };
