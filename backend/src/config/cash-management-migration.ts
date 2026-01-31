/**
 * Cash Management Module - Database Migration
 * 
 * Creates tables for bank reconciliation and cash management:
 * - banks: South African bank definitions
 * - bank_accounts: Company bank accounts with GL linking
 * - bank_statements: Imported bank statements
 * - bank_statement_lines: Individual statement transactions
 * - bank_reconciliation_rules: Auto-matching rules
 * - bank_reconciliation_matches: Matched transactions
 */

import pool from './database';

export async function migrateCashManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🏦 Starting Cash Management migration...');
    
    await client.query('BEGIN');

    // ============================================================
    // TABLE 1: banks
    // South African banks with their details
    // ============================================================
    console.log('  📊 Creating banks table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        bank_code VARCHAR(10) NOT NULL UNIQUE,
        bank_name VARCHAR(100) NOT NULL,
        short_name VARCHAR(50) NOT NULL,
        branch_code VARCHAR(10),
        swift_code VARCHAR(11),
        country_code VARCHAR(2) DEFAULT 'ZA',
        logo_url VARCHAR(255),
        website_url VARCHAR(255),
        support_phone VARCHAR(20),
        statement_format VARCHAR(50), -- 'CSV', 'OFX', 'MT940', 'CUSTOM'
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_banks_code ON banks(bank_code);
      CREATE INDEX IF NOT EXISTS idx_banks_active ON banks(is_active);
    `);

    // ============================================================
    // TABLE 7: multi_line_match_groups
    // Groups of ONE-TO-MANY or MANY-TO-ONE matches
    // ============================================================
    console.log('  📊 Creating multi_line_match_groups table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS multi_line_match_groups (
        id SERIAL PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        group_reference VARCHAR(50) NOT NULL UNIQUE,
        match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('ONE_TO_MANY', 'MANY_TO_ONE')),
        bank_statement_line_ids INTEGER[] NOT NULL,
        journal_entry_line_ids INTEGER[] NOT NULL,
        total_bank_amount DECIMAL(15,2) NOT NULL,
        total_journal_amount DECIMAL(15,2) NOT NULL,
        difference_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
        matched_by UUID NOT NULL REFERENCES users(id),
        matched_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unmatched_by UUID REFERENCES users(id),
        unmatched_date TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNMATCHED', 'REVERSED')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_multi_line_tenant ON multi_line_match_groups(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_multi_line_reference ON multi_line_match_groups(group_reference);
      CREATE INDEX IF NOT EXISTS idx_multi_line_status ON multi_line_match_groups(status);
      CREATE INDEX IF NOT EXISTS idx_multi_line_date ON multi_line_match_groups(matched_date);
    `);

    // ============================================================
    // TABLE 2: bank_accounts
    // Company's actual bank accounts
    // ============================================================
    console.log('  💳 Creating bank_accounts table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        bank_id INTEGER NOT NULL REFERENCES banks(id),
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(100) NOT NULL,
        account_type VARCHAR(20) DEFAULT 'CURRENT', -- CURRENT, SAVINGS, CREDIT_CARD, MONEY_MARKET
        currency_code VARCHAR(3) DEFAULT 'ZAR',
        
        -- GL Integration
        gl_account_code VARCHAR(20) NOT NULL, -- Links to chart_of_accounts
        
        -- Balance Tracking
        opening_balance NUMERIC(15, 2) DEFAULT 0.00,
        opening_balance_date DATE,
        current_balance NUMERIC(15, 2) DEFAULT 0.00,
        last_reconciled_balance NUMERIC(15, 2) DEFAULT 0.00,
        last_reconciled_date DATE,
        
        -- Statement Settings
        statement_day INTEGER, -- Day of month statement generates
        statement_email VARCHAR(100),
        auto_import_enabled BOOLEAN DEFAULT false,
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        
        -- Audit
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_account_per_bank UNIQUE(bank_id, account_number)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_bank ON bank_accounts(bank_id);
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_gl ON bank_accounts(gl_account_code);
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);
      CREATE INDEX IF NOT EXISTS idx_bank_accounts_primary ON bank_accounts(is_primary);
    `);

    // ============================================================
    // TABLE 3: bank_statements
    // Imported bank statements
    // ============================================================
    console.log('  📄 Creating bank_statements table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_statements (
        id SERIAL PRIMARY KEY,
        bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
        
        -- Statement Details
        statement_number VARCHAR(50),
        statement_date DATE NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        
        -- Balances
        opening_balance NUMERIC(15, 2) NOT NULL,
        closing_balance NUMERIC(15, 2) NOT NULL,
        total_debits NUMERIC(15, 2) DEFAULT 0.00,
        total_credits NUMERIC(15, 2) DEFAULT 0.00,
        
        -- Import Details
        import_source VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, CSV, OFX, API, EMAIL
        import_filename VARCHAR(255),
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Reconciliation Status
        status VARCHAR(20) DEFAULT 'IMPORTED', -- IMPORTED, IN_PROGRESS, RECONCILED, POSTED
        total_lines INTEGER DEFAULT 0,
        matched_lines INTEGER DEFAULT 0,
        unmatched_lines INTEGER DEFAULT 0,
        
        -- Period Linking
        fiscal_year_id INTEGER,
        accounting_period_id INTEGER,
        
        -- Audit
        reconciled_by INTEGER,
        reconciled_at TIMESTAMP,
        posted_by INTEGER,
        posted_at TIMESTAMP,
        notes TEXT,
        
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_statement_per_account UNIQUE(bank_account_id, statement_date)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_statements_account ON bank_statements(bank_account_id);
      CREATE INDEX IF NOT EXISTS idx_statements_date ON bank_statements(statement_date);
      CREATE INDEX IF NOT EXISTS idx_statements_status ON bank_statements(status);
      CREATE INDEX IF NOT EXISTS idx_statements_period ON bank_statements(accounting_period_id);
    `);

    // ============================================================
    // TABLE 4: bank_statement_lines
    // Individual transactions from statements
    // ============================================================
    console.log('  📋 Creating bank_statement_lines table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_statement_lines (
        id SERIAL PRIMARY KEY,
        bank_statement_id INTEGER NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
        
        -- Transaction Details
        line_number INTEGER NOT NULL,
        transaction_date DATE NOT NULL,
        value_date DATE,
        transaction_type VARCHAR(50), -- DEBIT, CREDIT, FEE, INTEREST, TRANSFER
        
        -- Amounts
        debit_amount NUMERIC(15, 2) DEFAULT 0.00,
        credit_amount NUMERIC(15, 2) DEFAULT 0.00,
        balance NUMERIC(15, 2),
        
        -- Transaction Info
        description TEXT,
        reference_number VARCHAR(100),
        payee_payer VARCHAR(200), -- Who paid or who we paid
        
        -- Bank Codes (from statement)
        transaction_code VARCHAR(20),
        bank_reference VARCHAR(100),
        
        -- Matching Status
        status VARCHAR(20) DEFAULT 'UNMATCHED', -- UNMATCHED, MATCHED, MANUAL_ENTRY, IGNORED
        matched_journal_entry_id INTEGER, -- Links to journal_entries
        matched_journal_line_id INTEGER, -- Links to journal_entry_lines
        matched_at TIMESTAMP,
        matched_by INTEGER,
        
        -- Matching Info
        matching_confidence NUMERIC(5, 2), -- 0-100% confidence score
        matching_rule_id INTEGER, -- Which rule matched it
        
        -- Flags
        is_reconciled BOOLEAN DEFAULT false,
        requires_manual_review BOOLEAN DEFAULT false,
        is_ignored BOOLEAN DEFAULT false,
        
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_line_per_statement UNIQUE(bank_statement_id, line_number)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_statement_lines_statement ON bank_statement_lines(bank_statement_id);
      CREATE INDEX IF NOT EXISTS idx_statement_lines_date ON bank_statement_lines(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_statement_lines_status ON bank_statement_lines(status);
      CREATE INDEX IF NOT EXISTS idx_statement_lines_matched_je ON bank_statement_lines(matched_journal_entry_id);
      CREATE INDEX IF NOT EXISTS idx_statement_lines_reference ON bank_statement_lines(reference_number);
      CREATE INDEX IF NOT EXISTS idx_statement_lines_payee ON bank_statement_lines(payee_payer);
    `);

    // ============================================================
    // TABLE 5: bank_reconciliation_rules
    // Auto-matching rules
    // ============================================================
    console.log('  🎯 Creating bank_reconciliation_rules table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_reconciliation_rules (
        id SERIAL PRIMARY KEY,
        rule_name VARCHAR(100) NOT NULL,
        description TEXT,
        
        -- Rule Type
        rule_type VARCHAR(30) NOT NULL, -- EXACT_AMOUNT, REFERENCE_MATCH, PAYEE_MATCH, DATE_RANGE, KEYWORD, COMBINED
        priority INTEGER DEFAULT 50, -- Higher = applied first
        
        -- Matching Criteria
        match_field VARCHAR(50), -- 'amount', 'reference', 'payee', 'description', 'date'
        match_operator VARCHAR(20), -- 'equals', 'contains', 'starts_with', 'regex', 'range'
        match_value TEXT,
        match_value_secondary TEXT, -- For ranges, date offsets
        
        -- Amount Criteria
        min_amount NUMERIC(15, 2),
        max_amount NUMERIC(15, 2),
        amount_tolerance NUMERIC(15, 2) DEFAULT 0.01, -- Allow ±1 cent variance
        
        -- Date Criteria
        date_offset_days INTEGER DEFAULT 0, -- Allow ±N days variance
        
        -- Transaction Type Filter
        transaction_type_filter VARCHAR(50), -- DEBIT, CREDIT, null for both
        
        -- Action
        action_type VARCHAR(30) NOT NULL, -- AUTO_MATCH, SUGGEST_MATCH, CREATE_JOURNAL, FLAG_REVIEW, IGNORE
        
        -- Auto-Create Journal Entry (if action is CREATE_JOURNAL)
        auto_create_journal BOOLEAN DEFAULT false,
        default_account_code VARCHAR(20), -- Contra account for auto-created entries
        default_source_type VARCHAR(20) DEFAULT 'BANK',
        
        -- Confidence
        confidence_score NUMERIC(5, 2) DEFAULT 80.00, -- 0-100%
        
        -- Status
        is_active BOOLEAN DEFAULT true,
        apply_to_all_accounts BOOLEAN DEFAULT false,
        specific_bank_account_id INTEGER REFERENCES bank_accounts(id),
        
        -- Stats
        times_applied INTEGER DEFAULT 0,
        last_applied_at TIMESTAMP,
        
        -- Audit
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_type ON bank_reconciliation_rules(rule_type);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_priority ON bank_reconciliation_rules(priority DESC);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_active ON bank_reconciliation_rules(is_active);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_rules_account ON bank_reconciliation_rules(specific_bank_account_id);
    `);

    // ============================================================
    // TABLE 6: bank_reconciliation_matches
    // Audit trail of all matches (auto and manual)
    // ============================================================
    console.log('  🔗 Creating bank_reconciliation_matches table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bank_reconciliation_matches (
        id SERIAL PRIMARY KEY,
        bank_statement_line_id INTEGER NOT NULL REFERENCES bank_statement_lines(id) ON DELETE CASCADE,
        journal_entry_id INTEGER NOT NULL,
        journal_entry_line_id INTEGER,
        
        -- Match Details
        match_type VARCHAR(20) NOT NULL, -- AUTO, MANUAL, SYSTEM
        match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        matched_by INTEGER,
        
        -- If auto-matched
        rule_id INTEGER REFERENCES bank_reconciliation_rules(id),
        confidence_score NUMERIC(5, 2),
        
        -- Multi-line matching
        multi_line_group_reference VARCHAR(50),
        
        -- Amounts
        statement_amount NUMERIC(15, 2) NOT NULL,
        journal_amount NUMERIC(15, 2) NOT NULL,
        variance_amount NUMERIC(15, 2) GENERATED ALWAYS AS (ABS(statement_amount - journal_amount)) STORED,
        
        -- Status
        status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, UNMATCHED, REVERSED
        
        -- Audit Trail
        unmatched_at TIMESTAMP,
        unmatched_by INTEGER,
        unmatch_reason TEXT,
        
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_statement_line_match UNIQUE(bank_statement_line_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_matches_statement_line ON bank_reconciliation_matches(bank_statement_line_id);
      CREATE INDEX IF NOT EXISTS idx_matches_journal_entry ON bank_reconciliation_matches(journal_entry_id);
      CREATE INDEX IF NOT EXISTS idx_matches_type ON bank_reconciliation_matches(match_type);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON bank_reconciliation_matches(status);
      CREATE INDEX IF NOT EXISTS idx_matches_rule ON bank_reconciliation_matches(rule_id);
    `);

    await client.query('COMMIT');
    
    console.log('✅ Cash Management migration complete!');
    console.log('   📊 6 tables created');
    console.log('   📇 18+ indexes created');
    console.log('   🔗 Foreign key constraints applied');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cash Management migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCashManagement()
    .then(() => {
      console.log('🎉 Migration successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
