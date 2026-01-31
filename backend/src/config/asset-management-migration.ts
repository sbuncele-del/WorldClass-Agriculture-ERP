/**
 * Asset Management Module - Database Migration
 * 
 * Creates comprehensive fixed asset management system:
 * - Asset categories & register
 * - Depreciation calculation & tracking
 * - Asset disposals & transfers
 * - Maintenance scheduling
 * - Asset revaluations
 * 
 * Integrates with: Journal Entries, Chart of Accounts, Dimensions
 */

import { Pool, PoolClient } from 'pg';

export async function createAssetManagementTables(pool: Pool): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔨 Creating Asset Management tables...');

    // =====================================================
    // 1. ASSET CATEGORIES
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_categories (
        category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_code VARCHAR(20) UNIQUE NOT NULL,
        category_name VARCHAR(200) NOT NULL,
        description TEXT,
        parent_category_id UUID REFERENCES asset_categories(category_id),
        
        -- Default depreciation settings for this category
        default_depreciation_method VARCHAR(50), -- 'STRAIGHT_LINE', 'REDUCING_BALANCE', 'UNITS_OF_PRODUCTION'
        default_useful_life_years INTEGER, -- Default useful life in years
        default_residual_value_percent DECIMAL(5,2), -- Default residual value %
        default_depreciation_rate DECIMAL(5,2), -- For reducing balance method
        
        -- GL Account linking
        asset_gl_account_code VARCHAR(20), -- Default asset account (1500-1599)
        accumulated_depreciation_gl_account_code VARCHAR(20), -- Default accum depreciation account
        depreciation_expense_gl_account_code VARCHAR(20), -- Default depreciation expense account
        disposal_gain_gl_account_code VARCHAR(20), -- Gain on disposal account
        disposal_loss_gl_account_code VARCHAR(20), -- Loss on disposal account
        
        -- Category settings
        is_depreciable BOOLEAN DEFAULT true,
        requires_insurance BOOLEAN DEFAULT false,
        requires_maintenance BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        updated_by VARCHAR(50),
        
        CONSTRAINT valid_depreciation_method CHECK (
          default_depreciation_method IN ('STRAIGHT_LINE', 'REDUCING_BALANCE', 'UNITS_OF_PRODUCTION')
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_categories_code ON asset_categories(category_code);
      CREATE INDEX IF NOT EXISTS idx_asset_categories_parent ON asset_categories(parent_category_id);
      CREATE INDEX IF NOT EXISTS idx_asset_categories_active ON asset_categories(is_active) WHERE is_active = true;
    `);
    console.log('✅ Created asset_categories table');

    // =====================================================
    // 2. FIXED ASSETS REGISTER
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS fixed_assets (
        asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: AST-00001
        asset_name VARCHAR(200) NOT NULL,
        description TEXT,
        category_id UUID REFERENCES asset_categories(category_id),
        
        -- Acquisition details
        acquisition_date DATE NOT NULL,
        acquisition_method VARCHAR(50), -- 'PURCHASE', 'LEASE', 'DONATION', 'CONSTRUCTION', 'TRANSFER_IN'
        vendor_id UUID, -- Link to vendors table (purchase module)
        vendor_name VARCHAR(200),
        purchase_order_id UUID, -- Link to purchase order if applicable
        invoice_number VARCHAR(50),
        
        -- Cost tracking
        acquisition_cost DECIMAL(18,2) NOT NULL DEFAULT 0, -- Original cost
        installation_cost DECIMAL(18,2) DEFAULT 0,
        improvement_cost DECIMAL(18,2) DEFAULT 0, -- Subsequent improvements
        total_cost DECIMAL(18,2) GENERATED ALWAYS AS (acquisition_cost + installation_cost + improvement_cost) STORED,
        
        -- Depreciation configuration
        depreciation_method VARCHAR(50) NOT NULL DEFAULT 'STRAIGHT_LINE',
        useful_life_years INTEGER, -- Useful life in years
        useful_life_units INTEGER, -- For units of production method (e.g., 100,000 km)
        residual_value DECIMAL(18,2) DEFAULT 0, -- Salvage value at end of life
        depreciation_rate DECIMAL(5,2), -- Annual % for reducing balance
        
        -- Depreciation tracking
        depreciation_start_date DATE, -- When to start depreciating
        accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
        net_book_value DECIMAL(18,2) GENERATED ALWAYS AS (
          acquisition_cost + installation_cost + improvement_cost - accumulated_depreciation
        ) STORED,
        last_depreciation_date DATE,
        
        -- Units of production tracking
        total_units_produced INTEGER DEFAULT 0, -- For units of production method
        
        -- Physical details
        serial_number VARCHAR(100),
        manufacturer VARCHAR(200),
        model_number VARCHAR(100),
        year_of_manufacture INTEGER,
        warranty_expiry_date DATE,
        
        -- Location & assignment
        location_id UUID, -- Link to locations/warehouses
        location_name VARCHAR(200),
        department_id UUID, -- Which department owns it
        cost_center_id UUID, -- Which cost center it belongs to
        custodian_employee_id UUID, -- Who is responsible for it
        custodian_name VARCHAR(200),
        
        -- Status tracking
        asset_status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'IDLE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF'
        condition_rating VARCHAR(20), -- 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
        
        -- Insurance
        is_insured BOOLEAN DEFAULT false,
        insurance_policy_number VARCHAR(100),
        insurance_value DECIMAL(18,2),
        insurance_expiry_date DATE,
        
        -- Disposal tracking
        disposal_date DATE,
        disposal_method VARCHAR(50), -- 'SOLD', 'SCRAPPED', 'DONATED', 'TRADE_IN', 'STOLEN', 'LOST'
        disposal_proceeds DECIMAL(18,2),
        disposal_cost DECIMAL(18,2),
        disposal_gain_loss DECIMAL(18,2),
        
        -- GL Account overrides (if different from category defaults)
        asset_gl_account_code VARCHAR(20),
        accumulated_depreciation_gl_account_code VARCHAR(20),
        depreciation_expense_gl_account_code VARCHAR(20),
        
        -- Additional info
        notes TEXT,
        photo_url VARCHAR(500),
        qr_code VARCHAR(200), -- For mobile scanning
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        updated_by VARCHAR(50),
        
        CONSTRAINT valid_asset_status CHECK (
          asset_status IN ('ACTIVE', 'IDLE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF')
        ),
        CONSTRAINT valid_depreciation_method_fa CHECK (
          depreciation_method IN ('STRAIGHT_LINE', 'REDUCING_BALANCE', 'UNITS_OF_PRODUCTION')
        ),
        CONSTRAINT valid_acquisition_method CHECK (
          acquisition_method IN ('PURCHASE', 'LEASE', 'DONATION', 'CONSTRUCTION', 'TRANSFER_IN')
        ),
        CONSTRAINT positive_acquisition_cost CHECK (acquisition_cost >= 0),
        CONSTRAINT positive_accumulated_depreciation CHECK (accumulated_depreciation >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_number ON fixed_assets(asset_number);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(category_id);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(asset_status);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_location ON fixed_assets(location_id);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_department ON fixed_assets(department_id);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_cost_center ON fixed_assets(cost_center_id);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_acquisition_date ON fixed_assets(acquisition_date);
      CREATE INDEX IF NOT EXISTS idx_fixed_assets_active ON fixed_assets(asset_status) 
        WHERE asset_status IN ('ACTIVE', 'IDLE', 'UNDER_MAINTENANCE');
    `);
    console.log('✅ Created fixed_assets table');

    // =====================================================
    // 3. ASSET DEPRECIATION SCHEDULE
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_depreciation_schedule (
        schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID NOT NULL REFERENCES fixed_assets(asset_id) ON DELETE CASCADE,
        
        -- Period details
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        
        -- Depreciation calculation
        opening_book_value DECIMAL(18,2) NOT NULL,
        depreciation_amount DECIMAL(18,2) NOT NULL,
        accumulated_depreciation DECIMAL(18,2) NOT NULL,
        closing_book_value DECIMAL(18,2) NOT NULL,
        
        -- Units of production (if applicable)
        units_produced_in_period INTEGER,
        
        -- Posting details
        is_posted BOOLEAN DEFAULT false,
        journal_entry_id UUID, -- Link to journal entry if posted
        posted_date DATE,
        posted_by VARCHAR(50),
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        
        CONSTRAINT unique_asset_period UNIQUE (asset_id, period_year, period_month),
        CONSTRAINT valid_period_month CHECK (period_month BETWEEN 1 AND 12),
        CONSTRAINT positive_depreciation CHECK (depreciation_amount >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_asset ON asset_depreciation_schedule(asset_id);
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_period ON asset_depreciation_schedule(period_year, period_month);
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_posted ON asset_depreciation_schedule(is_posted);
      CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_journal ON asset_depreciation_schedule(journal_entry_id);
    `);
    console.log('✅ Created asset_depreciation_schedule table');

    // =====================================================
    // 4. ASSET DISPOSALS
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_disposals (
        disposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID NOT NULL REFERENCES fixed_assets(asset_id),
        
        -- Disposal details
        disposal_date DATE NOT NULL,
        disposal_method VARCHAR(50) NOT NULL, -- 'SOLD', 'SCRAPPED', 'DONATED', 'TRADE_IN', 'STOLEN', 'LOST'
        disposal_reason TEXT,
        
        -- Financial details at disposal
        original_cost DECIMAL(18,2) NOT NULL,
        accumulated_depreciation DECIMAL(18,2) NOT NULL,
        net_book_value DECIMAL(18,2) NOT NULL,
        
        -- Disposal proceeds & costs
        sale_proceeds DECIMAL(18,2) DEFAULT 0,
        removal_cost DECIMAL(18,2) DEFAULT 0,
        net_proceeds DECIMAL(18,2) GENERATED ALWAYS AS (sale_proceeds - removal_cost) STORED,
        
        -- Gain/Loss calculation
        gain_loss DECIMAL(18,2) GENERATED ALWAYS AS (
          sale_proceeds - removal_cost - net_book_value
        ) STORED,
        
        -- Buyer details (if sold)
        buyer_name VARCHAR(200),
        buyer_contact TEXT,
        invoice_number VARCHAR(50),
        
        -- Approvals
        approved_by VARCHAR(50),
        approval_date DATE,
        approval_notes TEXT,
        
        -- Posting details
        is_posted BOOLEAN DEFAULT false,
        journal_entry_id UUID, -- Link to disposal journal entry
        posted_date DATE,
        posted_by VARCHAR(50),
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        
        CONSTRAINT valid_disposal_method CHECK (
          disposal_method IN ('SOLD', 'SCRAPPED', 'DONATED', 'TRADE_IN', 'STOLEN', 'LOST', 'WRITTEN_OFF')
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset ON asset_disposals(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_disposals_date ON asset_disposals(disposal_date);
      CREATE INDEX IF NOT EXISTS idx_asset_disposals_method ON asset_disposals(disposal_method);
      CREATE INDEX IF NOT EXISTS idx_asset_disposals_posted ON asset_disposals(is_posted);
    `);
    console.log('✅ Created asset_disposals table');

    // =====================================================
    // 5. ASSET TRANSFERS
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_transfers (
        transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID NOT NULL REFERENCES fixed_assets(asset_id),
        
        -- Transfer details
        transfer_date DATE NOT NULL,
        transfer_type VARCHAR(50) NOT NULL, -- 'LOCATION', 'DEPARTMENT', 'COST_CENTER', 'CUSTODIAN'
        transfer_reason TEXT,
        
        -- From details
        from_location_id UUID,
        from_location_name VARCHAR(200),
        from_department_id UUID,
        from_department_name VARCHAR(200),
        from_cost_center_id UUID,
        from_cost_center_name VARCHAR(200),
        from_custodian_id UUID,
        from_custodian_name VARCHAR(200),
        
        -- To details
        to_location_id UUID,
        to_location_name VARCHAR(200),
        to_department_id UUID,
        to_department_name VARCHAR(200),
        to_cost_center_id UUID,
        to_cost_center_name VARCHAR(200),
        to_custodian_id UUID,
        to_custodian_name VARCHAR(200),
        
        -- Approvals
        requested_by VARCHAR(50),
        approved_by VARCHAR(50),
        approval_date DATE,
        
        -- Condition at transfer
        condition_at_transfer VARCHAR(20), -- 'EXCELLENT', 'GOOD', 'FAIR', 'POOR'
        notes TEXT,
        
        -- Status
        transfer_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'
        completed_date DATE,
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        
        CONSTRAINT valid_transfer_type CHECK (
          transfer_type IN ('LOCATION', 'DEPARTMENT', 'COST_CENTER', 'CUSTODIAN', 'MULTIPLE')
        ),
        CONSTRAINT valid_transfer_status CHECK (
          transfer_status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_transfers_asset ON asset_transfers(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_transfers_date ON asset_transfers(transfer_date);
      CREATE INDEX IF NOT EXISTS idx_asset_transfers_status ON asset_transfers(transfer_status);
      CREATE INDEX IF NOT EXISTS idx_asset_transfers_from_location ON asset_transfers(from_location_id);
      CREATE INDEX IF NOT EXISTS idx_asset_transfers_to_location ON asset_transfers(to_location_id);
    `);
    console.log('✅ Created asset_transfers table');

    // =====================================================
    // 6. ASSET MAINTENANCE
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_maintenance (
        maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID NOT NULL REFERENCES fixed_assets(asset_id),
        
        -- Maintenance details
        maintenance_type VARCHAR(50) NOT NULL, -- 'PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'BREAKDOWN'
        maintenance_date DATE NOT NULL,
        scheduled_date DATE,
        completed_date DATE,
        
        -- Description
        maintenance_description TEXT NOT NULL,
        work_performed TEXT,
        parts_replaced TEXT,
        
        -- Cost tracking
        labor_cost DECIMAL(18,2) DEFAULT 0,
        parts_cost DECIMAL(18,2) DEFAULT 0,
        other_cost DECIMAL(18,2) DEFAULT 0,
        total_cost DECIMAL(18,2) GENERATED ALWAYS AS (labor_cost + parts_cost + other_cost) STORED,
        
        -- Service provider
        service_provider_type VARCHAR(50), -- 'INTERNAL', 'EXTERNAL'
        service_provider_name VARCHAR(200),
        technician_name VARCHAR(200),
        service_invoice_number VARCHAR(50),
        
        -- Downtime tracking
        downtime_hours DECIMAL(10,2),
        
        -- Next maintenance
        next_maintenance_date DATE,
        next_maintenance_type VARCHAR(50),
        
        -- Status
        maintenance_status VARCHAR(50) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
        priority VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
        
        -- Approval (for capitalization decision)
        is_capitalized BOOLEAN DEFAULT false, -- If cost adds to asset value
        approved_for_capitalization_by VARCHAR(50),
        
        -- Notes
        notes TEXT,
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        updated_by VARCHAR(50),
        
        CONSTRAINT valid_maintenance_type CHECK (
          maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'BREAKDOWN', 'INSPECTION')
        ),
        CONSTRAINT valid_maintenance_status CHECK (
          maintenance_status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset ON asset_maintenance(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_maintenance_date ON asset_maintenance(maintenance_date);
      CREATE INDEX IF NOT EXISTS idx_asset_maintenance_status ON asset_maintenance(maintenance_status);
      CREATE INDEX IF NOT EXISTS idx_asset_maintenance_type ON asset_maintenance(maintenance_type);
      CREATE INDEX IF NOT EXISTS idx_asset_maintenance_next_date ON asset_maintenance(next_maintenance_date);
    `);
    console.log('✅ Created asset_maintenance table');

    // =====================================================
    // 7. ASSET VALUATIONS (Revaluations)
    // =====================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_valuations (
        valuation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        asset_id UUID NOT NULL REFERENCES fixed_assets(asset_id),
        
        -- Valuation details
        valuation_date DATE NOT NULL,
        valuation_method VARCHAR(50) NOT NULL, -- 'MARKET_VALUE', 'REPLACEMENT_COST', 'FAIR_VALUE', 'PROFESSIONAL_APPRAISAL'
        valuation_reason TEXT,
        
        -- Valuer information
        valued_by VARCHAR(200), -- Company/person who performed valuation
        valuer_credentials VARCHAR(200),
        valuation_certificate_number VARCHAR(100),
        
        -- Values
        previous_book_value DECIMAL(18,2) NOT NULL,
        revalued_amount DECIMAL(18,2) NOT NULL,
        revaluation_gain_loss DECIMAL(18,2) GENERATED ALWAYS AS (
          revalued_amount - previous_book_value
        ) STORED,
        
        -- Posting details
        is_posted BOOLEAN DEFAULT false,
        journal_entry_id UUID, -- Link to revaluation journal entry
        posted_date DATE,
        posted_by VARCHAR(50),
        
        -- Approval
        approved_by VARCHAR(50),
        approval_date DATE,
        approval_notes TEXT,
        
        -- Supporting documents
        valuation_report_url VARCHAR(500),
        notes TEXT,
        
        -- Audit fields
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(50),
        
        CONSTRAINT valid_valuation_method CHECK (
          valuation_method IN ('MARKET_VALUE', 'REPLACEMENT_COST', 'FAIR_VALUE', 'PROFESSIONAL_APPRAISAL', 'INSURANCE_VALUE')
        )
      );
      
      CREATE INDEX IF NOT EXISTS idx_asset_valuations_asset ON asset_valuations(asset_id);
      CREATE INDEX IF NOT EXISTS idx_asset_valuations_date ON asset_valuations(valuation_date);
      CREATE INDEX IF NOT EXISTS idx_asset_valuations_posted ON asset_valuations(is_posted);
    `);
    console.log('✅ Created asset_valuations table');

    // =====================================================
    // 8. CREATE VIEWS FOR REPORTING
    // =====================================================
    
    // View: Asset Register Summary
    await client.query(`
      CREATE OR REPLACE VIEW v_asset_register AS
      SELECT 
        fa.asset_id,
        fa.asset_number,
        fa.asset_name,
        fa.description,
        ac.category_name,
        fa.acquisition_date,
        fa.acquisition_cost,
        fa.installation_cost,
        fa.improvement_cost,
        fa.total_cost,
        fa.depreciation_method,
        fa.useful_life_years,
        fa.accumulated_depreciation,
        fa.net_book_value,
        fa.location_name,
        fa.department_id,
        fa.cost_center_id,
        fa.custodian_name,
        fa.asset_status,
        fa.condition_rating,
        fa.is_insured,
        fa.insurance_expiry_date,
        CASE 
          WHEN fa.insurance_expiry_date < CURRENT_DATE THEN true
          ELSE false
        END as insurance_expired,
        fa.created_at,
        fa.created_by
      FROM fixed_assets fa
      LEFT JOIN asset_categories ac ON fa.category_id = ac.category_id
      WHERE fa.asset_status != 'DISPOSED';
    `);
    console.log('✅ Created v_asset_register view');

    // View: Depreciation Summary by Category
    await client.query(`
      CREATE OR REPLACE VIEW v_depreciation_summary_by_category AS
      SELECT 
        ac.category_id,
        ac.category_name,
        COUNT(fa.asset_id) as asset_count,
        SUM(fa.total_cost) as total_acquisition_cost,
        SUM(fa.accumulated_depreciation) as total_accumulated_depreciation,
        SUM(fa.net_book_value) as total_net_book_value,
        AVG(fa.net_book_value / NULLIF(fa.total_cost, 0) * 100) as avg_remaining_value_percent
      FROM asset_categories ac
      LEFT JOIN fixed_assets fa ON ac.category_id = fa.category_id
        AND fa.asset_status IN ('ACTIVE', 'IDLE', 'UNDER_MAINTENANCE')
      GROUP BY ac.category_id, ac.category_name;
    `);
    console.log('✅ Created v_depreciation_summary_by_category view');

    // View: Upcoming Maintenance Schedule
    await client.query(`
      CREATE OR REPLACE VIEW v_upcoming_maintenance AS
      SELECT 
        am.maintenance_id,
        fa.asset_number,
        fa.asset_name,
        fa.location_name,
        am.next_maintenance_date,
        am.next_maintenance_type,
        am.maintenance_description,
        CASE 
          WHEN am.next_maintenance_date < CURRENT_DATE THEN 'OVERDUE'
          WHEN am.next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_THIS_WEEK'
          WHEN am.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'DUE_THIS_MONTH'
          ELSE 'SCHEDULED'
        END as maintenance_urgency
      FROM asset_maintenance am
      INNER JOIN fixed_assets fa ON am.asset_id = fa.asset_id
      WHERE am.maintenance_status = 'COMPLETED'
        AND am.next_maintenance_date IS NOT NULL
        AND fa.asset_status = 'ACTIVE'
      ORDER BY am.next_maintenance_date;
    `);
    console.log('✅ Created v_upcoming_maintenance view');

    await client.query('COMMIT');
    
    console.log('\n🎉 Asset Management migration completed successfully!');
    console.log('📊 Created:');
    console.log('   - 7 tables (categories, assets, depreciation, disposals, transfers, maintenance, valuations)');
    console.log('   - 3 views (asset register, depreciation summary, maintenance schedule)');
    console.log('   - 30+ indexes for performance');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Asset Management migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (require.main === module) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  createAssetManagementTables(pool)
    .then(() => {
      console.log('✅ Migration completed');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      pool.end();
      process.exit(1);
    });
}

export default createAssetManagementTables;
