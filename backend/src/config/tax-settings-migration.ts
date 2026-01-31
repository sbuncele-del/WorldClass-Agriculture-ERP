import pool from './database';

/**
 * Tax Settings Migration
 * Creates tables for SARS-compliant tax configuration
 * Supports VAT (15%), PAYE, Income Tax (27%), and eFiling integration
 */

export async function createTaxSettingsSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Tax Configuration Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_configuration (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        
        -- VAT Configuration (South Africa - 15% standard rate)
        vat_enabled BOOLEAN DEFAULT true,
        vat_rate DECIMAL(5,2) DEFAULT 15.00,
        vat_registration_number VARCHAR(50),
        vat_period VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, BI_MONTHLY
        vat_start_date DATE,
        vat_zero_rated_enabled BOOLEAN DEFAULT true,
        vat_exempt_enabled BOOLEAN DEFAULT true,
        
        -- PAYE Configuration (Pay As You Earn)
        paye_enabled BOOLEAN DEFAULT true,
        paye_registration_number VARCHAR(50),
        paye_company_registration VARCHAR(50),
        sdl_rate DECIMAL(5,2) DEFAULT 1.00, -- Skills Development Levy
        uif_rate DECIMAL(5,2) DEFAULT 1.00, -- Unemployment Insurance Fund
        paye_tax_year_start_month INTEGER DEFAULT 3, -- March (SA tax year)
        
        -- Income Tax Configuration (Corporate)
        income_tax_enabled BOOLEAN DEFAULT true,
        corporate_tax_rate DECIMAL(5,2) DEFAULT 27.00, -- 27% corporate rate
        income_tax_number VARCHAR(50),
        tax_year_end_month INTEGER DEFAULT 2, -- February
        provisional_tax_enabled BOOLEAN DEFAULT true,
        provisional_tax_periods JSONB DEFAULT '["Aug", "Feb"]'::jsonb,
        
        -- Withholding Tax
        withholding_tax_enabled BOOLEAN DEFAULT false,
        withholding_tax_rate DECIMAL(5,2) DEFAULT 15.00,
        
        -- Currency and Locale
        currency VARCHAR(3) DEFAULT 'ZAR',
        locale VARCHAR(10) DEFAULT 'en-ZA',
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID
      );
    `);

    console.log('✅ tax_configuration table created');

    // 2. Tax Accounts Mapping Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        tax_type VARCHAR(50) NOT NULL, -- VAT_INPUT, VAT_OUTPUT, VAT_CONTROL, PAYE_PAYABLE, SDL_PAYABLE, UIF_PAYABLE, INCOME_TAX_PAYABLE, PROVISIONAL_TAX, DEFERRED_TAX, WITHHOLDING_TAX
        account_code VARCHAR(20) NOT NULL, -- FK to chart_of_accounts
        account_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        description TEXT,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID,
        
        -- Constraints
        UNIQUE(tenant_id, tax_type)
      );
    `);

    console.log('✅ tax_accounts table created');

    // 3. SARS eFiling Configuration (Phase 2 - Encrypted credentials)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sars_efiling_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID UNIQUE,
        
        -- Connection Settings
        environment VARCHAR(20) DEFAULT 'TEST', -- TEST, PRODUCTION
        username_encrypted TEXT,
        password_encrypted TEXT,
        encryption_key_id VARCHAR(50),
        
        -- API Configuration
        api_endpoint VARCHAR(255),
        api_version VARCHAR(10) DEFAULT 'v1',
        timeout_seconds INTEGER DEFAULT 30,
        
        -- Sync Settings
        auto_submit_enabled BOOLEAN DEFAULT false,
        auto_sync_enabled BOOLEAN DEFAULT false,
        sync_frequency VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, DAILY, WEEKLY, MONTHLY
        last_sync_at TIMESTAMP,
        last_sync_status VARCHAR(20), -- SUCCESS, FAILED, PENDING
        last_sync_message TEXT,
        
        -- Submission Settings
        auto_approve_submissions BOOLEAN DEFAULT false,
        notification_email VARCHAR(255),
        notification_enabled BOOLEAN DEFAULT true,
        
        -- Status
        connection_status VARCHAR(20) DEFAULT 'NOT_CONFIGURED', -- NOT_CONFIGURED, CONNECTED, DISCONNECTED, ERROR
        connection_tested_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        updated_by UUID
      );
    `);

    console.log('✅ sars_efiling_config table created');

    // 4. Tax Submissions History (Phase 2)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID,
        
        -- Submission Details
        submission_type VARCHAR(50) NOT NULL, -- VAT_RETURN, PAYE_RETURN, IRP5, EMP501, IT14
        tax_period_start DATE NOT NULL,
        tax_period_end DATE NOT NULL,
        
        -- Status
        status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, ACCEPTED, REJECTED, ERROR
        submission_reference VARCHAR(100),
        submission_date TIMESTAMP,
        
        -- Data
        submission_data JSONB NOT NULL,
        response_data JSONB,
        
        -- Validation
        validation_status VARCHAR(20), -- PASSED, FAILED, WARNING
        validation_errors JSONB,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by UUID,
        submitted_by UUID
      );
    `);

    console.log('✅ tax_submissions table created');

    // 5. Create Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tax_accounts_tenant ON tax_accounts(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tax_accounts_type ON tax_accounts(tax_type);
      CREATE INDEX IF NOT EXISTS idx_tax_accounts_code ON tax_accounts(account_code);
      
      CREATE INDEX IF NOT EXISTS idx_tax_submissions_tenant ON tax_submissions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tax_submissions_type ON tax_submissions(submission_type);
      CREATE INDEX IF NOT EXISTS idx_tax_submissions_status ON tax_submissions(status);
      CREATE INDEX IF NOT EXISTS idx_tax_submissions_period ON tax_submissions(tax_period_start, tax_period_end);
    `);

    console.log('✅ Tax indexes created');

    // 6. Insert Default Tax Configuration
    await client.query(`
      INSERT INTO tax_configuration (
        tenant_id,
        vat_enabled,
        vat_rate,
        vat_period,
        paye_enabled,
        sdl_rate,
        uif_rate,
        income_tax_enabled,
        corporate_tax_rate,
        currency,
        locale
      )
      SELECT 
        NULL, -- Will be set per tenant
        true,
        15.00,
        'MONTHLY',
        true,
        1.00,
        1.00,
        true,
        27.00,
        'ZAR',
        'en-ZA'
      WHERE NOT EXISTS (SELECT 1 FROM tax_configuration LIMIT 1);
    `);

    console.log('✅ Default tax configuration inserted');

    await client.query('COMMIT');
    console.log('✅ Tax Settings schema migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Tax Settings migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed default tax accounts (optional, can be configured by user)
export async function seedDefaultTaxAccounts(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const defaultAccounts = [
      { tax_type: 'VAT_INPUT', description: 'VAT Input (Purchases) - Debit balance' },
      { tax_type: 'VAT_OUTPUT', description: 'VAT Output (Sales) - Credit balance' },
      { tax_type: 'VAT_CONTROL', description: 'VAT Control Account - Net VAT payable/receivable' },
      { tax_type: 'PAYE_PAYABLE', description: 'PAYE Payable - Employee tax withheld' },
      { tax_type: 'SDL_PAYABLE', description: 'SDL Payable - Skills Development Levy (1%)' },
      { tax_type: 'UIF_PAYABLE', description: 'UIF Payable - Unemployment Insurance Fund (1%)' },
      { tax_type: 'INCOME_TAX_PAYABLE', description: 'Income Tax Payable - Corporate tax liability' },
      { tax_type: 'PROVISIONAL_TAX', description: 'Provisional Tax - Advance corporate tax payments' },
      { tax_type: 'DEFERRED_TAX', description: 'Deferred Tax - Timing differences (Asset/Liability)' },
      { tax_type: 'WITHHOLDING_TAX', description: 'Withholding Tax - Tax on dividends, interest, royalties' }
    ];

    for (const account of defaultAccounts) {
      await client.query(`
        INSERT INTO tax_accounts (tax_type, account_code, is_active, description)
        VALUES ($1, NULL, false, $2)
        ON CONFLICT (tenant_id, tax_type) DO NOTHING
      `, [account.tax_type, account.description]);
    }

    await client.query('COMMIT');
    console.log('✅ Default tax accounts seeded');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Tax accounts seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
