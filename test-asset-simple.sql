-- SIMPLE ASSET MANAGEMENT TEST
\echo '===================================================================='
\echo 'ASSET MANAGEMENT - SIMPLE WORKING TEST'
\echo '===================================================================='

-- Test 1: Create and activate an asset
INSERT INTO fixed_assets (
    tenant_id, asset_number, asset_name, category_id, location_id,
    acquisition_date, purchase_price, residual_value,
    depreciation_method, useful_life_years, useful_life_months,
    depreciation_start_date, initial_cost, asset_status, acquisition_method
) 
SELECT 
    '00000000-0000-0000-0000-000000000001', 'ASSET-TEST-001',
    'Test Vehicle', category_id, location_id,
    '2025-11-01', 120000.00, 12000.00,
    'STRAIGHT_LINE', 5, 60, '2025-11-01', 120000.00, 'ACTIVE', 'PURCHASE'
FROM asset_categories ac
CROSS JOIN asset_locations al
LIMIT 1;

\echo ''
\echo 'Asset created and activated - check GL transactions:'
SELECT 
    TO_CHAR(gt.transaction_date, 'YYYY-MM-DD') as date,
    coa.account_code,
    coa.account_name,
    gt.debit_amount,
    gt.credit_amount,
    gt.description
FROM gl_transactions gt
JOIN chart_of_accounts coa ON gt.account_id = coa.account_id
WHERE gt.source_type = 'FIXED_ASSET'
AND gt.source_id = (SELECT asset_id FROM fixed_assets WHERE asset_number = 'ASSET-TEST-001')
ORDER BY gt.id;

\echo ''
\echo 'Test 2: Calculate depreciation for November'
SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '2025-11-30'::DATE
);

\echo ''
\echo 'Depreciation GL transactions:'
SELECT 
    TO_CHAR(gt.transaction_date, 'YYYY-MM-DD') as date,
    coa.account_code,
    coa.account_name,
    gt.debit_amount,
    gt.credit_amount
FROM gl_transactions gt
JOIN chart_of_accounts coa ON gt.account_id = coa.account_id
WHERE gt.source_type = 'DEPRECIATION'
ORDER BY gt.id DESC
LIMIT 10;

\echo ''
\echo 'Asset current values:'
SELECT 
    asset_number,
    asset_name,
    purchase_price,
    accumulated_depreciation,
    net_book_value,
    asset_status,
    posted_to_gl
FROM fixed_assets
WHERE asset_number = 'ASSET-TEST-001';

\echo ''
\echo '===================================================================='
\echo 'TEST COMPLETE ✓'
\echo 'Expected: Asset cost R 120,000, monthly depreciation R 1,800'
\echo '          (R 120,000 - R 12,000) / 60 months = R 1,800'
\echo '===================================================================='
