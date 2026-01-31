-- ============================================================================
-- ASSET MANAGEMENT MODULE - COMPLETE WORKFLOW TEST
-- ============================================================================
-- This test verifies:
-- 1. Asset acquisition and GL posting (DR Fixed Asset, CR Bank/AP)
-- 2. Monthly depreciation calculation and GL posting
-- 3. Trial balance updates
-- 4. Financial statement impacts
-- ============================================================================

\echo '============================================================================'
\echo 'ASSET MANAGEMENT - COMPLETE WORKFLOW TEST'
\echo '============================================================================'
\echo ''

-- Set tenant context
SET app.current_tenant = '00000000-0000-0000-0000-000000000001';

\echo 'Step 1: Check initial GL balances'
\echo '------------------------------------------------------------'
SELECT 
    account_code,
    account_name,
    COALESCE(SUM(debit_amount), 0) as total_debits,
    COALESCE(SUM(credit_amount), 0) as total_credits,
    COALESCE(SUM(debit_amount - credit_amount), 0) as balance
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code IN ('1000', '1500', '1550', '2100', '6300')
GROUP BY coa.account_code, coa.account_name
ORDER BY coa.account_code;

\echo ''
\echo 'Step 2: Create asset category if not exists'
\echo '------------------------------------------------------------'
INSERT INTO asset_categories (
    tenant_id,
    category_code,
    category_name,
    depreciation_method,
    useful_life_years,
    residual_value_percentage,
    depreciation_gl_account,
    depreciation_expense_account,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'VEHICLES',
    'Vehicles',
    'STRAIGHT_LINE',
    5,
    10.00,
    '1500',
    '6300',
    true
)
ON CONFLICT (category_code) DO UPDATE SET
    depreciation_gl_account = '1500',
    depreciation_expense_account = '6300';

\echo 'Asset category ready'

\echo ''
\echo 'Step 3: Create asset location'
\echo '------------------------------------------------------------'
INSERT INTO asset_locations (
    tenant_id,
    location_code,
    location_name,
    address,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'HQ',
    'Head Office',
    'Cape Town, South Africa',
    true
)
ON CONFLICT (location_code) DO NOTHING;

SELECT location_id, location_code, location_name
FROM asset_locations
WHERE location_code = 'HQ';

\echo ''
\echo 'Step 4: Create a new vehicle asset (DRAFT status)'
\echo '------------------------------------------------------------'
INSERT INTO fixed_assets (
    tenant_id,
    asset_tag,
    asset_name,
    category_id,
    location_id,
    acquisition_method,
    acquisition_date,
    purchase_price,
    residual_value,
    depreciation_method,
    useful_life_years,
    useful_life_months,
    depreciation_start_date,
    status,
    created_by
) 
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'VEH-2025-001',
    'Toyota Hilux 2.8 GD-6 4x4',
    category_id,
    location_id,
    'CASH',
    '2025-01-15',
    450000.00,  -- R450,000 purchase price
    45000.00,   -- R45,000 residual value (10%)
    'STRAIGHT_LINE',
    5,
    60,
    '2025-02-01',
    'DRAFT',
    '00000000-0000-0000-0000-000000000000'
FROM asset_categories ac
CROSS JOIN asset_locations al
WHERE ac.category_code = 'VEHICLES'
AND al.location_code = 'HQ'
ON CONFLICT (asset_tag) DO NOTHING;

SELECT 
    asset_id,
    asset_tag,
    asset_name,
    purchase_price,
    residual_value,
    useful_life_years,
    status,
    posted_to_gl
FROM fixed_assets
WHERE asset_tag = 'VEH-2025-001';

\echo ''
\echo 'Step 5: Activate asset to trigger GL posting'
\echo '------------------------------------------------------------'
\echo 'EXPECTED: DR Fixed Assets (1500) R450,000, CR Bank (1000) R450,000'
\echo ''

UPDATE fixed_assets
SET status = 'ACTIVE'
WHERE asset_tag = 'VEH-2025-001'
AND status = 'DRAFT';

-- Verify GL posting happened
SELECT 
    fa.asset_tag,
    fa.asset_name,
    fa.purchase_price,
    fa.status,
    fa.posted_to_gl,
    fa.journal_entry_id,
    je.journal_number,
    je.journal_date,
    je.journal_type
FROM fixed_assets fa
LEFT JOIN journal_entries je ON fa.journal_entry_id = je.entry_id
WHERE fa.asset_tag = 'VEH-2025-001';

\echo ''
\echo 'Step 6: View GL transactions for asset acquisition'
\echo '------------------------------------------------------------'
SELECT 
    glt.transaction_id,
    glt.account_code,
    coa.account_name,
    glt.debit_amount,
    glt.credit_amount,
    glt.description
FROM gl_transactions glt
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE glt.entry_id = (
    SELECT journal_entry_id 
    FROM fixed_assets 
    WHERE asset_tag = 'VEH-2025-001'
)
ORDER BY glt.transaction_id;

\echo ''
\echo 'Step 7: Calculate monthly depreciation for February 2025'
\echo '------------------------------------------------------------'
\echo 'Expected monthly depreciation: (R450,000 - R45,000) / 60 months = R6,750/month'
\echo ''

SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '2025-02-28'::DATE
);

\echo ''
\echo 'Step 8: View depreciation schedule entry'
\echo '------------------------------------------------------------'
SELECT 
    ads.schedule_id,
    ads.depreciation_date,
    ads.period_number,
    ads.opening_book_value,
    ads.depreciation_amount,
    ads.accumulated_depreciation,
    ads.closing_book_value,
    ads.calculation_method,
    ads.status,
    ads.posted_to_gl,
    ads.journal_entry_id
FROM asset_depreciation_schedule ads
WHERE ads.asset_id = (
    SELECT asset_id FROM fixed_assets WHERE asset_tag = 'VEH-2025-001'
)
ORDER BY ads.depreciation_date DESC
LIMIT 5;

\echo ''
\echo 'Step 9: View depreciation GL transactions'
\echo '------------------------------------------------------------'
\echo 'EXPECTED: DR Depreciation Expense (6300) R6,750, CR Accumulated Depreciation (1550) R6,750'
\echo ''

SELECT 
    je.journal_number,
    je.journal_date,
    je.journal_type,
    glt.account_code,
    coa.account_name,
    glt.debit_amount,
    glt.credit_amount,
    glt.description
FROM asset_depreciation_schedule ads
JOIN journal_entries je ON ads.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE ads.asset_id = (
    SELECT asset_id FROM fixed_assets WHERE asset_tag = 'VEH-2025-001'
)
AND ads.depreciation_date = '2025-02-28'
ORDER BY glt.transaction_id;

\echo ''
\echo 'Step 10: Calculate depreciation for March 2025'
\echo '------------------------------------------------------------'
SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '2025-03-31'::DATE
);

\echo ''
\echo 'Step 11: View updated asset values'
\echo '------------------------------------------------------------'
SELECT 
    asset_tag,
    asset_name,
    purchase_price,
    residual_value,
    accumulated_depreciation,
    net_book_value,
    last_depreciation_date,
    status
FROM fixed_assets
WHERE asset_tag = 'VEH-2025-001';

\echo ''
\echo 'Step 12: View complete depreciation history'
\echo '------------------------------------------------------------'
SELECT 
    depreciation_date,
    period_number,
    opening_book_value,
    depreciation_amount,
    accumulated_depreciation,
    closing_book_value,
    status,
    posted_to_gl
FROM asset_depreciation_schedule
WHERE asset_id = (
    SELECT asset_id FROM fixed_assets WHERE asset_tag = 'VEH-2025-001'
)
ORDER BY depreciation_date;

\echo ''
\echo 'Step 13: Verify Trial Balance after all transactions'
\echo '------------------------------------------------------------'
SELECT 
    coa.account_code,
    coa.account_name,
    coa.account_type,
    COALESCE(SUM(glt.debit_amount), 0) as total_debits,
    COALESCE(SUM(glt.credit_amount), 0) as total_credits,
    COALESCE(SUM(glt.debit_amount - glt.credit_amount), 0) as balance
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code IN ('1000', '1500', '1550', '2100', '6300')
GROUP BY coa.account_code, coa.account_name, coa.account_type
ORDER BY coa.account_code;

\echo ''
\echo 'Step 14: Verify Balance Sheet impact'
\echo '------------------------------------------------------------'
\echo 'Fixed Assets at Cost:        R 450,000'
\echo 'Less: Accumulated Depreciation: (R 13,500)  [2 months x R6,750]'
\echo 'Net Book Value:              R 436,500'
\echo ''

SELECT 
    'Fixed Assets' as line_item,
    COALESCE(SUM(CASE WHEN account_code = '1500' THEN debit_amount - credit_amount ELSE 0 END), 0) as amount
FROM gl_transactions
WHERE account_code = '1500'
UNION ALL
SELECT 
    'Less: Accumulated Depreciation' as line_item,
    COALESCE(SUM(CASE WHEN account_code = '1550' THEN credit_amount - debit_amount ELSE 0 END), 0) as amount
FROM gl_transactions
WHERE account_code = '1550'
UNION ALL
SELECT 
    'Net Book Value' as line_item,
    COALESCE(
        SUM(CASE WHEN account_code = '1500' THEN debit_amount - credit_amount ELSE 0 END) -
        SUM(CASE WHEN account_code = '1550' THEN credit_amount - debit_amount ELSE 0 END),
        0
    ) as amount
FROM gl_transactions
WHERE account_code IN ('1500', '1550');

\echo ''
\echo 'Step 15: Verify Profit & Loss impact'
\echo '------------------------------------------------------------'
SELECT 
    coa.account_code,
    coa.account_name,
    COALESCE(SUM(glt.debit_amount - glt.credit_amount), 0) as expense_amount
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code = '6300'
GROUP BY coa.account_code, coa.account_name;

\echo ''
\echo 'Step 16: View complete audit trail'
\echo '------------------------------------------------------------'
SELECT 
    je.journal_number,
    je.journal_date,
    je.journal_type,
    je.description,
    je.reference_type,
    je.reference_id,
    coa.account_code,
    coa.account_name,
    glt.debit_amount,
    glt.credit_amount
FROM journal_entries je
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE je.reference_type IN ('FIXED_ASSET', 'DEPRECIATION_SCHEDULE')
AND je.reference_id IN (
    SELECT asset_id FROM fixed_assets WHERE asset_tag = 'VEH-2025-001'
    UNION
    SELECT schedule_id FROM asset_depreciation_schedule 
    WHERE asset_id = (SELECT asset_id FROM fixed_assets WHERE asset_tag = 'VEH-2025-001')
)
ORDER BY je.journal_date, je.journal_number, glt.transaction_id;

\echo ''
\echo '============================================================================'
\echo 'TEST COMPLETE'
\echo '============================================================================'
\echo ''
\echo 'Summary of Expected Results:'
\echo '----------------------------'
\echo '1. Asset Acquisition (Jan 15, 2025):'
\echo '   - DR Fixed Assets (1500)              R 450,000'
\echo '   - CR Bank (1000)                       R 450,000'
\echo ''
\echo '2. February Depreciation (Feb 28, 2025):'
\echo '   - DR Depreciation Expense (6300)      R 6,750'
\echo '   - CR Accumulated Depreciation (1550)   R 6,750'
\echo ''
\echo '3. March Depreciation (Mar 31, 2025):'
\echo '   - DR Depreciation Expense (6300)      R 6,750'
\echo '   - CR Accumulated Depreciation (1550)   R 6,750'
\echo ''
\echo '4. Balance Sheet Impact:'
\echo '   - Fixed Assets at Cost:               R 450,000'
\echo '   - Less: Accumulated Depreciation:     (R 13,500)'
\echo '   - Net Book Value:                     R 436,500'
\echo ''
\echo '5. P&L Impact:'
\echo '   - Depreciation Expense:               R 13,500'
\echo ''
\echo '============================================================================'
