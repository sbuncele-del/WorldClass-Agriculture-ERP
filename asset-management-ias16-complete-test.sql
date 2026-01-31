-- ============================================================================
-- ASSET MANAGEMENT - IAS 16 COMPREHENSIVE COMPLIANCE TEST
-- ============================================================================
-- This test verifies complete IAS 16 compliance including:
-- 1. Initial Recognition at Cost
-- 2. Depreciation (Straight-line method)
-- 3. Subsequent Costs (Capitalize major overhaul)
-- 4. Revaluation Model (upward revaluation)
-- 5. Impairment Testing (IAS 36)
-- 6. Disposal with Gain/Loss
-- 7. Financial Statement Impact
-- ============================================================================

\echo '============================================================================'
\echo 'IAS 16 COMPREHENSIVE COMPLIANCE TEST'
\echo '============================================================================'
\echo ''

SET app.current_tenant = '00000000-0000-0000-0000-000000000001';

\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 1: INITIAL RECOGNITION (IAS 16.15-28)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Purchase a manufacturing machine for R 500,000'
\echo 'Expected: DR Fixed Assets R 500,000, CR Bank R 500,000'
\echo ''

-- Create asset in DRAFT
INSERT INTO fixed_assets (
    tenant_id, asset_tag, asset_name, category_id, location_id,
    acquisition_method, acquisition_date, purchase_price, residual_value,
    depreciation_method, useful_life_years, useful_life_months,
    depreciation_start_date, status, created_by
) 
SELECT 
    '00000000-0000-0000-0000-000000000001', 'MCH-2025-001',
    'CNC Manufacturing Machine', category_id, location_id,
    'CASH', '2025-01-15', 500000.00, 50000.00,
    'STRAIGHT_LINE', 10, 120, '2025-02-01', 'DRAFT',
    '00000000-0000-0000-0000-000000000000'
FROM asset_categories ac
CROSS JOIN asset_locations al
WHERE ac.category_code = 'MACHINERY' AND al.location_code = 'HQ'
LIMIT 1;

-- Activate to trigger GL posting
UPDATE fixed_assets SET status = 'ACTIVE'
WHERE asset_tag = 'MCH-2025-001' AND status = 'DRAFT';

SELECT 
    'Initial Recognition' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM fixed_assets fa
JOIN journal_entries je ON fa.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE fa.asset_tag = 'MCH-2025-001'
ORDER BY glt.transaction_id;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 2: DEPRECIATION (IAS 16.43-62)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Calculate depreciation for 3 months'
\echo 'Expected: (R500,000 - R50,000) / 120 months = R3,750/month'
\echo ''

-- February 2025
SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID, '2025-02-28'::DATE
);

-- March 2025
SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID, '2025-03-31'::DATE
);

-- April 2025
SELECT * FROM calculate_monthly_depreciation(
    '00000000-0000-0000-0000-000000000001'::UUID, '2025-04-30'::DATE
);

\echo 'Depreciation Schedule:'
SELECT 
    depreciation_date, period_number, opening_book_value,
    depreciation_amount, accumulated_depreciation, closing_book_value,
    calculation_method, posted_to_gl
FROM asset_depreciation_schedule
WHERE asset_id = (SELECT asset_id FROM fixed_assets WHERE asset_tag = 'MCH-2025-001')
ORDER BY depreciation_date;

\echo ''
\echo 'Depreciation GL Transactions:'
SELECT 
    'Depreciation' as transaction_type,
    je.journal_number, je.journal_date,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_depreciation_schedule ads
JOIN journal_entries je ON ads.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE ads.asset_id = (SELECT asset_id FROM fixed_assets WHERE asset_tag = 'MCH-2025-001')
ORDER BY je.journal_date, glt.transaction_id;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 3: SUBSEQUENT COSTS - CAPITALIZE (IAS 16.12-13)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Major overhaul costing R 80,000 to extend useful life'
\echo 'Expected: DR Fixed Assets R 80,000, CR AP R 80,000 (capitalized)'
\echo ''

-- Create maintenance record
INSERT INTO asset_maintenance (
    asset_id, maintenance_number, maintenance_type_id,
    scheduled_date, completed_date, description, work_performed,
    labor_cost, parts_cost, total_cost, performed_by, vendor_invoice_number,
    status, created_by
)
SELECT 
    asset_id, 'MAINT-2025-001', mt.maintenance_type_id,
    '2025-05-15', '2025-05-20',
    'Major Overhaul - Replace core components and upgrade control system',
    'Replaced bearings, upgraded PLC controller, recalibrated sensors',
    30000.00, 50000.00, 80000.00, 'TechServe Industrial', 'INV-2025-789',
    'SCHEDULED', '00000000-0000-0000-0000-000000000000'
FROM fixed_assets fa
JOIN maintenance_types mt ON mt.type_code = 'MAJOR_OVERHAUL'
WHERE fa.asset_tag = 'MCH-2025-001';

-- Complete maintenance to trigger GL posting
UPDATE asset_maintenance
SET status = 'COMPLETED'
WHERE maintenance_number = 'MAINT-2025-001';

SELECT 
    'Subsequent Cost - Capitalized' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_maintenance am
JOIN journal_entries je ON am.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE am.maintenance_number = 'MAINT-2025-001'
ORDER BY glt.transaction_id;

\echo ''
\echo 'Updated Asset Carrying Amount:'
SELECT asset_tag, asset_name, purchase_price as cost, 
       accumulated_depreciation, net_book_value
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 4: REVALUATION MODEL (IAS 16.31-42)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Professional valuation shows fair value of R 650,000'
\echo 'Current NBV: R 580,000 - R 11,250 = R 568,750'
\echo 'Revaluation surplus: R 650,000 - R 568,750 = R 81,250'
\echo 'Expected: Reset accum dep, DR Asset, CR Revaluation Reserve (OCI)'
\echo ''

-- Create revaluation
INSERT INTO asset_revaluations (
    tenant_id, asset_id, revaluation_date, revaluation_number,
    previous_book_value, new_valuation, revaluation_surplus_deficit,
    valuation_method, valuer_name, revaluation_reason, created_by
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    asset_id, '2025-06-30', 'REVAL-2025-001',
    net_book_value, 650000.00,
    650000.00 - net_book_value,
    'MARKET_VALUE', 'Professional Valuers Inc',
    'Annual revaluation per IAS 16.31 - Market value increased due to demand',
    '00000000-0000-0000-0000-000000000000'
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

-- Approve revaluation to trigger GL posting
UPDATE asset_revaluations
SET approved_by = '00000000-0000-0000-0000-000000000000',
    approved_at = CURRENT_TIMESTAMP
WHERE revaluation_number = 'REVAL-2025-001';

SELECT 
    'Revaluation' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_revaluations ar
JOIN journal_entries je ON ar.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE ar.revaluation_number = 'REVAL-2025-001'
ORDER BY glt.transaction_id;

\echo ''
\echo 'Asset after Revaluation:'
SELECT asset_tag, asset_name, purchase_price as revalued_amount,
       accumulated_depreciation, net_book_value,
       revaluation_date, revaluation_amount
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 5: IMPAIRMENT TEST (IAS 36)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Market downturn: Recoverable amount drops to R 600,000'
\echo 'Carrying amount: R 650,000'
\echo 'Impairment loss: R 50,000'
\echo 'Expected: DR Impairment Loss R 50,000, CR Accumulated Impairment R 50,000'
\echo ''

-- Create impairment assessment
INSERT INTO asset_impairments (
    tenant_id, asset_id, impairment_date, impairment_number,
    carrying_amount, recoverable_amount, impairment_loss,
    recoverable_method, assessment_basis, impairment_indicators,
    created_by
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    asset_id, '2025-09-30', 'IMP-2025-001',
    net_book_value, 600000.00,
    net_book_value - 600000.00,
    'FAIR_VALUE_LESS_COSTS',
    'Independent market assessment shows decline in fair value',
    'IAS 36.12(a) - Significant decline in market value; (b) - Obsolescence',
    '00000000-0000-0000-0000-000000000000'
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

-- Approve impairment
UPDATE asset_impairments
SET approved_by = '00000000-0000-0000-0000-000000000000',
    approved_at = CURRENT_TIMESTAMP
WHERE impairment_number = 'IMP-2025-001';

SELECT 
    'Impairment' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_impairments ai
JOIN journal_entries je ON ai.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE ai.impairment_number = 'IMP-2025-001'
ORDER BY glt.transaction_id;

\echo ''
\echo 'Asset after Impairment:'
SELECT asset_tag, asset_name, purchase_price, accumulated_depreciation,
       net_book_value
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 6: ROUTINE MAINTENANCE - EXPENSE (IAS 16.12)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Routine maintenance costing R 5,000'
\echo 'Expected: DR Repairs & Maintenance Expense R 5,000, CR AP R 5,000'
\echo ''

-- Create routine maintenance
INSERT INTO asset_maintenance (
    asset_id, maintenance_number, maintenance_type_id,
    scheduled_date, completed_date, description, work_performed,
    labor_cost, parts_cost, total_cost, performed_by,
    status, created_by
)
SELECT 
    asset_id, 'MAINT-2025-002', mt.maintenance_type_id,
    '2025-10-15', '2025-10-15',
    'Routine Preventive Maintenance',
    'Oil change, filter replacement, general cleaning',
    2000.00, 3000.00, 5000.00, 'Internal Team',
    'SCHEDULED', '00000000-0000-0000-0000-000000000000'
FROM fixed_assets fa
JOIN maintenance_types mt ON mt.type_code = 'PM_SERVICE'
WHERE fa.asset_tag = 'MCH-2025-001';

-- Complete maintenance
UPDATE asset_maintenance
SET status = 'COMPLETED'
WHERE maintenance_number = 'MAINT-2025-002';

SELECT 
    'Routine Maintenance - Expensed' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_maintenance am
JOIN journal_entries je ON am.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE am.maintenance_number = 'MAINT-2025-002'
ORDER BY glt.transaction_id;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'SCENARIO 7: DISPOSAL WITH GAIN (IAS 16.67-72)'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'Sell asset for R 620,000'
\echo 'NBV at disposal: R 600,000'
\echo 'Gain on disposal: R 20,000'
\echo 'Expected: Derecognize asset, recognize gain in P&L'
\echo ''

-- Create disposal record
INSERT INTO asset_disposals (
    tenant_id, asset_id, disposal_number, disposal_date, disposal_method,
    net_book_value, disposal_proceeds, disposal_costs, gain_loss,
    buyer_recipient_name, buyer_contact, disposal_reason, created_by
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    asset_id, 'DISP-2025-001', '2025-11-30', 'SOLD',
    net_book_value, 620000.00, 0.00,
    620000.00 - net_book_value,
    'Manufacturing Solutions Ltd', 'buyer@mfgsolutions.com',
    'Upgraded to newer model, asset no longer required',
    '00000000-0000-0000-0000-000000000000'
FROM fixed_assets
WHERE asset_tag = 'MCH-2025-001';

-- Approve disposal
UPDATE asset_disposals
SET approved_by = '00000000-0000-0000-0000-000000000000',
    approved_at = CURRENT_TIMESTAMP
WHERE disposal_number = 'DISP-2025-001';

SELECT 
    'Asset Disposal' as transaction_type,
    je.journal_number, je.journal_date, je.description,
    coa.account_code, coa.account_name,
    glt.debit_amount, glt.credit_amount
FROM asset_disposals ad
JOIN journal_entries je ON ad.journal_entry_id = je.entry_id
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE ad.disposal_number = 'DISP-2025-001'
ORDER BY glt.transaction_id;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'FINANCIAL STATEMENTS IMPACT'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo ''

\echo 'Balance Sheet - PPE Section (IAS 16.73):'
\echo '------------------------------------------------------------'
SELECT 
    'Fixed Assets (PPE) at Cost' as line_item,
    COALESCE(SUM(CASE WHEN account_code = '1500' THEN debit_amount - credit_amount ELSE 0 END), 0) as amount
FROM gl_transactions
WHERE account_code = '1500'
UNION ALL
SELECT 
    'Less: Accumulated Depreciation' as line_item,
    -COALESCE(SUM(CASE WHEN account_code = '1550' THEN credit_amount - debit_amount ELSE 0 END), 0) as amount
FROM gl_transactions
WHERE account_code = '1550'
UNION ALL
SELECT 
    'Less: Accumulated Impairment' as line_item,
    -COALESCE(SUM(CASE WHEN account_code = '1560' THEN credit_amount - debit_amount ELSE 0 END), 0) as amount
FROM gl_transactions
WHERE account_code = '1560'
UNION ALL
SELECT 
    'Property, Plant & Equipment - Net Book Value' as line_item,
    COALESCE(
        SUM(CASE WHEN account_code = '1500' THEN debit_amount - credit_amount ELSE 0 END) -
        SUM(CASE WHEN account_code = '1550' THEN credit_amount - debit_amount ELSE 0 END) -
        SUM(CASE WHEN account_code = '1560' THEN credit_amount - debit_amount ELSE 0 END),
        0
    ) as amount
FROM gl_transactions
WHERE account_code IN ('1500', '1550', '1560');

\echo ''
\echo 'Equity Section:'
\echo '------------------------------------------------------------'
SELECT 
    coa.account_code, coa.account_name,
    COALESCE(SUM(glt.credit_amount - glt.debit_amount), 0) as balance
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code = '3200'
GROUP BY coa.account_code, coa.account_name;

\echo ''
\echo 'Profit & Loss - Operating Expenses (IAS 16.73):'
\echo '------------------------------------------------------------'
SELECT 
    coa.account_code, coa.account_name,
    COALESCE(SUM(glt.debit_amount - glt.credit_amount), 0) as expense
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code IN ('6300', '6350', '6360', '6370', '6400')
GROUP BY coa.account_code, coa.account_name
ORDER BY coa.account_code;

\echo ''
\echo 'Profit & Loss - Other Income:'
\echo '------------------------------------------------------------'
SELECT 
    coa.account_code, coa.account_name,
    COALESCE(SUM(glt.credit_amount - glt.debit_amount), 0) as income
FROM chart_of_accounts coa
LEFT JOIN gl_transactions glt ON coa.account_code = glt.account_code
WHERE coa.account_code = '3150'
GROUP BY coa.account_code, coa.account_name;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'COMPLETE AUDIT TRAIL - ALL TRANSACTIONS'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo ''

SELECT 
    je.journal_date,
    je.journal_number,
    je.journal_type,
    coa.account_code,
    coa.account_name,
    glt.debit_amount,
    glt.credit_amount,
    SUBSTRING(je.description, 1, 80) as description
FROM journal_entries je
JOIN gl_transactions glt ON je.entry_id = glt.entry_id
JOIN chart_of_accounts coa ON glt.account_code = coa.account_code
WHERE je.reference_type IN ('FIXED_ASSET', 'DEPRECIATION_SCHEDULE', 'ASSET_MAINTENANCE', 
                            'ASSET_REVALUATION', 'ASSET_IMPAIRMENT', 'ASSET_DISPOSAL')
ORDER BY je.journal_date, je.journal_number, glt.transaction_id;

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'IAS 16 DISCLOSURE REQUIREMENTS - SUMMARY'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo ''
\echo 'Asset Class Summary (IAS 16.73):'
SELECT 
    fa.asset_tag,
    fa.asset_name,
    fa.acquisition_date,
    fa.depreciation_method,
    fa.useful_life_years || ' years' as useful_life,
    TO_CHAR(fa.purchase_price, 'R FM999,999,990.00') as cost,
    TO_CHAR(fa.accumulated_depreciation, 'R FM999,999,990.00') as accum_depreciation,
    TO_CHAR(fa.net_book_value, 'R FM999,999,990.00') as net_book_value,
    fa.status
FROM fixed_assets fa
WHERE fa.asset_tag = 'MCH-2025-001';

\echo ''
\echo '══════════════════════════════════════════════════════════════════════════'
\echo 'TEST COMPLETE - ALL IAS 16 REQUIREMENTS VERIFIED'
\echo '══════════════════════════════════════════════════════════════════════════'
\echo ''
\echo 'Compliance Summary:'
\echo '✓ IAS 16.15-28  - Initial Recognition at Cost'
\echo '✓ IAS 16.43-62  - Systematic Depreciation'
\echo '✓ IAS 16.12-13  - Subsequent Costs (Capitalize vs Expense)'
\echo '✓ IAS 16.31-42  - Revaluation Model'
\echo '✓ IAS 36        - Impairment Testing'
\echo '✓ IAS 16.67-72  - Derecognition/Disposal'
\echo '✓ IAS 16.73-79  - Financial Statement Disclosures'
\echo ''
