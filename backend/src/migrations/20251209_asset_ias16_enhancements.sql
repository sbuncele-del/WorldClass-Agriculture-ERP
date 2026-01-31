-- Asset Management IAS 16 Enhancements Migration
-- Adds support for: impairment tracking, revaluation reserves, capital thresholds
-- Run this migration after the base asset-management-migration

-- =====================================================
-- 1. ADD IMPAIRMENT TRACKING COLUMNS
-- =====================================================
ALTER TABLE assets.fixed_assets
ADD COLUMN IF NOT EXISTS impairment_loss DECIMAL(18,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_impairment_date DATE,
ADD COLUMN IF NOT EXISTS last_valuation_date DATE,
ADD COLUMN IF NOT EXISTS last_valuation_amount DECIMAL(18,2);

-- =====================================================
-- 2. ASSET IMPAIRMENT TESTS TABLE (IAS 36)
-- =====================================================
CREATE TABLE IF NOT EXISTS assets.asset_impairment_tests (
  impairment_test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets.fixed_assets(asset_id),
  test_date DATE NOT NULL,
  carrying_amount DECIMAL(18,2) NOT NULL,
  fair_value_less_costs_to_sell DECIMAL(18,2),
  value_in_use DECIMAL(18,2),
  recoverable_amount DECIMAL(18,2) NOT NULL,
  impairment_indicator VARCHAR(100), -- market_value_decline, obsolescence, physical_damage, economic_changes
  discount_rate_used DECIMAL(5,4),
  cash_flow_projection_period_years INTEGER,
  terminal_growth_rate DECIMAL(5,4),
  impairment_required BOOLEAN DEFAULT false,
  impairment_amount DECIMAL(18,2),
  external_valuation_reference VARCHAR(255),
  valuer_name VARCHAR(255),
  valuer_credentials VARCHAR(255),
  notes TEXT,
  is_reversed BOOLEAN DEFAULT false,
  reversal_amount DECIMAL(18,2),
  reversal_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_impairment_tests_asset ON assets.asset_impairment_tests(asset_id);
CREATE INDEX IF NOT EXISTS idx_impairment_tests_date ON assets.asset_impairment_tests(test_date);

-- =====================================================
-- 3. REVALUATION RESERVE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS assets.asset_revaluation_reserves (
  reserve_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets.fixed_assets(asset_id),
  valuation_id UUID REFERENCES assets.asset_valuations(valuation_id),
  reserve_movement_date DATE NOT NULL,
  movement_type VARCHAR(50) NOT NULL, -- 'increase' | 'decrease' | 'transfer_to_retained_earnings'
  amount DECIMAL(18,2) NOT NULL,
  running_balance DECIMAL(18,2) NOT NULL,
  related_disposal_id UUID REFERENCES assets.asset_disposals(disposal_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_revaluation_reserves_asset ON assets.asset_revaluation_reserves(asset_id);

-- =====================================================
-- 4. CAPITALIZATION THRESHOLDS (Per category)
-- =====================================================
ALTER TABLE assets.asset_categories
ADD COLUMN IF NOT EXISTS minimum_capitalization_amount DECIMAL(18,2) DEFAULT 5000,
ADD COLUMN IF NOT EXISTS low_value_threshold DECIMAL(18,2) DEFAULT 2500,
ADD COLUMN IF NOT EXISTS minimum_useful_life_years INTEGER DEFAULT 1;

-- =====================================================
-- 5. COMPONENT DEPRECIATION SUPPORT (IAS 16.43-47)
-- =====================================================
CREATE TABLE IF NOT EXISTS assets.asset_components (
  component_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES assets.fixed_assets(asset_id),
  component_name VARCHAR(255) NOT NULL,
  component_description TEXT,
  component_cost DECIMAL(18,2) NOT NULL,
  residual_value DECIMAL(18,2) DEFAULT 0,
  useful_life_years INTEGER NOT NULL,
  depreciation_method VARCHAR(50) DEFAULT 'straight_line',
  depreciation_rate DECIMAL(5,4),
  accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
  current_book_value DECIMAL(18,2),
  status VARCHAR(50) DEFAULT 'active',
  replaced_date DATE,
  replacement_component_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_asset_components_parent ON assets.asset_components(parent_asset_id);

-- =====================================================
-- 6. ADD REVERSAL FLAG TO DEPRECIATION SCHEDULE
-- =====================================================
ALTER TABLE assets.asset_depreciation_schedule
ADD COLUMN IF NOT EXISTS is_reversal_entry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reversal_reason TEXT;

-- =====================================================
-- 7. ENHANCED VALUATION TABLE
-- =====================================================
ALTER TABLE assets.asset_valuations
ADD COLUMN IF NOT EXISTS valuation_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS valuer_credentials VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_report_reference VARCHAR(255);

-- =====================================================
-- 8. VIEW: ASSET BOOK VALUES WITH IMPAIRMENT
-- =====================================================
CREATE OR REPLACE VIEW assets.v_asset_book_values AS
SELECT 
  a.asset_id,
  a.asset_number,
  a.asset_name,
  a.purchase_cost AS gross_cost,
  COALESCE(SUM(ds.depreciation_amount), 0) AS accumulated_depreciation,
  COALESCE(a.impairment_loss, 0) AS accumulated_impairment,
  a.purchase_cost - COALESCE(SUM(ds.depreciation_amount), 0) - COALESCE(a.impairment_loss, 0) AS carrying_amount,
  a.residual_value,
  a.useful_life_years,
  a.useful_life_years - EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.acquisition_date)) AS remaining_useful_life,
  a.depreciation_method,
  a.status,
  a.last_valuation_date,
  a.last_valuation_amount
FROM assets.fixed_assets a
LEFT JOIN assets.asset_depreciation_schedule ds ON a.asset_id = ds.asset_id AND ds.is_reversal_entry = false
GROUP BY a.asset_id;

-- =====================================================
-- 9. VIEW: REVALUATION RESERVE SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW assets.v_revaluation_reserve_summary AS
SELECT 
  a.asset_id,
  a.asset_number,
  a.asset_name,
  c.category_name,
  COALESCE(SUM(CASE WHEN rr.movement_type = 'increase' THEN rr.amount ELSE 0 END), 0) AS total_increases,
  COALESCE(SUM(CASE WHEN rr.movement_type = 'decrease' THEN rr.amount ELSE 0 END), 0) AS total_decreases,
  COALESCE(SUM(CASE WHEN rr.movement_type = 'transfer_to_retained_earnings' THEN rr.amount ELSE 0 END), 0) AS transfers_to_retained_earnings,
  COALESCE(MAX(rr.running_balance), 0) AS current_reserve_balance
FROM assets.fixed_assets a
LEFT JOIN assets.asset_categories c ON a.category_id = c.category_id
LEFT JOIN assets.asset_revaluation_reserves rr ON a.asset_id = rr.asset_id
GROUP BY a.asset_id, a.asset_number, a.asset_name, c.category_name;

-- =====================================================
-- 10. FUNCTION: CALCULATE RECOVERABLE AMOUNT
-- =====================================================
CREATE OR REPLACE FUNCTION assets.calculate_recoverable_amount(
  p_fair_value_less_costs DECIMAL,
  p_value_in_use DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  -- IAS 36: Recoverable amount is the higher of FVLCTS and VIU
  RETURN GREATEST(COALESCE(p_fair_value_less_costs, 0), COALESCE(p_value_in_use, 0));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. SYSTEM SETTINGS FOR CAPITALIZATION POLICY
-- =====================================================
INSERT INTO core.system_settings (setting_key, setting_value, setting_category, description)
VALUES (
  'asset_capitalization_thresholds',
  '{"minimum_amount": 5000, "minimum_useful_life_years": 1, "low_value_asset_threshold": 2500}',
  'assets',
  'IAS 16 capitalization policy thresholds'
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = NOW();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON assets.asset_impairment_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON assets.asset_revaluation_reserves TO authenticated;
GRANT SELECT, INSERT, UPDATE ON assets.asset_components TO authenticated;
GRANT SELECT ON assets.v_asset_book_values TO authenticated;
GRANT SELECT ON assets.v_revaluation_reserve_summary TO authenticated;
