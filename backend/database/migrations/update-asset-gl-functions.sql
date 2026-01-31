-- ============================================================================
-- UPDATE GL POSTING FUNCTIONS TO USE CORRECT COLUMN NAMES
-- ============================================================================

-- Drop existing functions to recreate with correct column names
DROP FUNCTION IF EXISTS post_asset_acquisition_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_depreciation_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_revaluation_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_maintenance_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_disposal_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_impairment_to_gl() CASCADE;
DROP FUNCTION IF EXISTS calculate_monthly_depreciation(UUID, DATE) CASCADE;

-- Recreate with correct column names (asset_number instead of asset_tag, asset_status instead of status)
