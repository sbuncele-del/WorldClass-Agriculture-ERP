-- ============================================================================
-- ASSET MANAGEMENT - GL POSTING FUNCTIONS
-- ============================================================================
-- This migration adds GL posting automation for:
-- 1. Asset acquisition (when asset status changes to ACTIVE)
-- 2. Monthly depreciation postings
-- ============================================================================

-- ============================================================================
-- 1. ASSET ACQUISITION GL POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION post_asset_acquisition_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_asset_account_code VARCHAR(50);
    v_contra_account_code VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
BEGIN
    -- Only post when asset becomes ACTIVE and not already posted
    IF NEW.status = 'ACTIVE' AND OLD.status = 'DRAFT' AND NEW.journal_entry_id IS NULL THEN
        
        -- Get the asset account from category
        SELECT depreciation_gl_account 
        INTO v_asset_account_code
        FROM asset_categories
        WHERE category_id = NEW.category_id;
        
        -- Default to Fixed Assets account if not specified
        IF v_asset_account_code IS NULL THEN
            v_asset_account_code := '1500';
        END IF;
        
        -- Determine contra account based on acquisition method
        CASE NEW.acquisition_method
            WHEN 'PURCHASE' THEN
                v_contra_account_code := '2100'; -- Accounts Payable
            WHEN 'CASH' THEN
                v_contra_account_code := '1000'; -- Bank Account
            WHEN 'DONATION' THEN
                v_contra_account_code := '3100'; -- Other Income
            WHEN 'TRANSFER' THEN
                v_contra_account_code := '1500'; -- Inter-asset transfer
            ELSE
                v_contra_account_code := '1000'; -- Default to bank
        END CASE;
        
        -- Get current period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.acquisition_date BETWEEN start_date AND end_date
        AND status = 'OPEN'
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No open accounting period found for date: %', NEW.acquisition_date;
        END IF;
        
        -- Generate journal number
        v_journal_number := 'JE-AST-' || TO_CHAR(NEW.acquisition_date, 'YYYY-MM') || '-' || LPAD(NEW.asset_id::TEXT, 6, '0');
        
        -- Build description
        v_description := 'Asset Acquisition: ' || NEW.asset_name || ' (' || NEW.asset_tag || ')';
        
        -- Create journal entry header
        INSERT INTO journal_entries (
            tenant_id,
            journal_number,
            journal_date,
            period_id,
            journal_type,
            reference_type,
            reference_id,
            description,
            status,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_number,
            NEW.acquisition_date,
            v_period_id,
            'ASSET_ACQUISITION',
            'FIXED_ASSET',
            NEW.asset_id,
            v_description,
            'POSTED',
            NEW.created_by,
            CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- DR: Fixed Asset (increase asset value)
        INSERT INTO gl_transactions (
            tenant_id,
            entry_id,
            account_code,
            transaction_date,
            debit_amount,
            credit_amount,
            description,
            reference_type,
            reference_id,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_entry_id,
            v_asset_account_code,
            NEW.acquisition_date,
            NEW.purchase_price,
            0,
            v_description,
            'FIXED_ASSET',
            NEW.asset_id,
            NEW.created_by,
            CURRENT_TIMESTAMP
        );
        
        -- CR: Contra Account (reduce bank/increase AP)
        INSERT INTO gl_transactions (
            tenant_id,
            entry_id,
            account_code,
            transaction_date,
            debit_amount,
            credit_amount,
            description,
            reference_type,
            reference_id,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_entry_id,
            v_contra_account_code,
            NEW.acquisition_date,
            0,
            NEW.purchase_price,
            v_description,
            'FIXED_ASSET',
            NEW.asset_id,
            NEW.created_by,
            CURRENT_TIMESTAMP
        );
        
        -- Update asset with journal entry reference
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Asset acquisition posted to GL: Asset %, Journal %, Amount %', 
            NEW.asset_tag, v_journal_number, NEW.purchase_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for asset acquisition
DROP TRIGGER IF EXISTS trg_post_asset_acquisition_to_gl ON fixed_assets;
CREATE TRIGGER trg_post_asset_acquisition_to_gl
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION post_asset_acquisition_to_gl();


-- ============================================================================
-- 2. DEPRECIATION GL POSTING
-- ============================================================================

CREATE OR REPLACE FUNCTION post_depreciation_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_expense_account_code VARCHAR(50);
    v_accumulated_dep_account VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
    v_asset_tag VARCHAR(50);
    v_asset_name VARCHAR(255);
BEGIN
    -- Only post when depreciation is calculated and not already posted
    IF NEW.status = 'CALCULATED' AND NEW.posted_to_gl = false THEN
        
        -- Get asset details
        SELECT 
            fa.asset_tag,
            fa.asset_name,
            ac.depreciation_expense_account,
            ac.depreciation_gl_account
        INTO 
            v_asset_tag,
            v_asset_name,
            v_expense_account_code,
            v_accumulated_dep_account
        FROM fixed_assets fa
        JOIN asset_categories ac ON fa.category_id = ac.category_id
        WHERE fa.asset_id = NEW.asset_id;
        
        -- Default accounts if not specified in category
        IF v_expense_account_code IS NULL THEN
            v_expense_account_code := '6300'; -- Depreciation Expense
        END IF;
        
        IF v_accumulated_dep_account IS NULL THEN
            v_accumulated_dep_account := '1550'; -- Accumulated Depreciation
        END IF;
        
        -- Get accounting period for depreciation date
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.depreciation_date BETWEEN start_date AND end_date
        AND status IN ('OPEN', 'CLOSED') -- Allow posting to closed periods for depreciation
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No accounting period found for depreciation date: %', NEW.depreciation_date;
        END IF;
        
        -- Generate journal number
        v_journal_number := 'JE-DEP-' || TO_CHAR(NEW.depreciation_date, 'YYYY-MM') || '-' || LPAD(NEW.schedule_id::TEXT, 6, '0');
        
        -- Build description
        v_description := 'Depreciation: ' || v_asset_name || ' (' || v_asset_tag || ') - ' || 
                        TO_CHAR(NEW.depreciation_date, 'Month YYYY');
        
        -- Create journal entry header
        INSERT INTO journal_entries (
            tenant_id,
            journal_number,
            journal_date,
            period_id,
            journal_type,
            reference_type,
            reference_id,
            description,
            status,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_number,
            NEW.depreciation_date,
            v_period_id,
            'DEPRECIATION',
            'DEPRECIATION_SCHEDULE',
            NEW.schedule_id,
            v_description,
            'POSTED',
            NEW.created_by,
            CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- DR: Depreciation Expense (increase expense)
        INSERT INTO gl_transactions (
            tenant_id,
            entry_id,
            account_code,
            transaction_date,
            debit_amount,
            credit_amount,
            description,
            reference_type,
            reference_id,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_entry_id,
            v_expense_account_code,
            NEW.depreciation_date,
            NEW.depreciation_amount,
            0,
            v_description,
            'DEPRECIATION_SCHEDULE',
            NEW.schedule_id,
            NEW.created_by,
            CURRENT_TIMESTAMP
        );
        
        -- CR: Accumulated Depreciation (increase contra-asset)
        INSERT INTO gl_transactions (
            tenant_id,
            entry_id,
            account_code,
            transaction_date,
            debit_amount,
            credit_amount,
            description,
            reference_type,
            reference_id,
            created_by,
            created_at
        ) VALUES (
            NEW.tenant_id,
            v_journal_entry_id,
            v_accumulated_dep_account,
            NEW.depreciation_date,
            0,
            NEW.depreciation_amount,
            v_description,
            'DEPRECIATION_SCHEDULE',
            NEW.schedule_id,
            NEW.created_by,
            CURRENT_TIMESTAMP
        );
        
        -- Update depreciation schedule with journal entry reference
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
        NEW.status := 'POSTED';
        
        RAISE NOTICE 'Depreciation posted to GL: Asset %, Journal %, Amount %', 
            v_asset_tag, v_journal_number, NEW.depreciation_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for depreciation posting
DROP TRIGGER IF EXISTS trg_post_depreciation_to_gl ON asset_depreciation_schedule;
CREATE TRIGGER trg_post_depreciation_to_gl
    BEFORE UPDATE ON asset_depreciation_schedule
    FOR EACH ROW
    EXECUTE FUNCTION post_depreciation_to_gl();


-- ============================================================================
-- 3. ADD REQUIRED GL ACCOUNTS
-- ============================================================================

-- Insert GL accounts for Asset Management if they don't exist
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, category, is_active) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', '1500', 'Fixed Assets', 'ASSET', 'NON_CURRENT_ASSETS', true),
    ('00000000-0000-0000-0000-000000000001', '1550', 'Accumulated Depreciation', 'ASSET', 'NON_CURRENT_ASSETS', true),
    ('00000000-0000-0000-0000-000000000001', '6300', 'Depreciation Expense', 'EXPENSE', 'OPERATING_EXPENSES', true)
ON CONFLICT (tenant_id, account_code) DO UPDATE SET
    account_name = EXCLUDED.account_name,
    account_type = EXCLUDED.account_type,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active;

-- Update asset categories with GL account mappings
UPDATE asset_categories SET
    depreciation_gl_account = '1500',
    depreciation_expense_account = '6300'
WHERE depreciation_gl_account IS NULL;


-- ============================================================================
-- 4. HELPER FUNCTION: CALCULATE AND POST MONTHLY DEPRECIATION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_monthly_depreciation(
    p_tenant_id UUID,
    p_depreciation_month DATE
) RETURNS TABLE(
    assets_processed INTEGER,
    total_depreciation DECIMAL,
    message TEXT
) AS $$
DECLARE
    v_asset RECORD;
    v_monthly_depreciation DECIMAL(15,2);
    v_accumulated_dep DECIMAL(15,2);
    v_net_book_value DECIMAL(15,2);
    v_schedule_id INTEGER;
    v_assets_count INTEGER := 0;
    v_total_amount DECIMAL(15,2) := 0;
BEGIN
    -- Loop through all active assets
    FOR v_asset IN 
        SELECT 
            asset_id,
            asset_tag,
            asset_name,
            purchase_price,
            residual_value,
            depreciation_method,
            useful_life_years,
            useful_life_months,
            acquisition_date,
            accumulated_depreciation,
            net_book_value
        FROM fixed_assets
        WHERE tenant_id = p_tenant_id
        AND status = 'ACTIVE'
        AND acquisition_date < p_depreciation_month
        AND (disposal_date IS NULL OR disposal_date >= p_depreciation_month)
    LOOP
        -- Calculate monthly depreciation based on method
        IF v_asset.depreciation_method = 'STRAIGHT_LINE' THEN
            -- Straight line: (Cost - Residual) / Useful Life Months
            v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) / 
                                     NULLIF(v_asset.useful_life_months, 0);
            
            -- Don't depreciate below residual value
            v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
            IF v_accumulated_dep > (v_asset.purchase_price - v_asset.residual_value) THEN
                v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) - 
                                         v_asset.accumulated_depreciation;
            END IF;
            
        ELSIF v_asset.depreciation_method = 'DECLINING_BALANCE' THEN
            -- Declining balance: NBV * (2 / Useful Life Years)
            v_monthly_depreciation := v_asset.net_book_value * 
                                     (2.0 / NULLIF(v_asset.useful_life_years, 0)) / 12;
            
            -- Don't depreciate below residual value
            v_net_book_value := v_asset.net_book_value - v_monthly_depreciation;
            IF v_net_book_value < v_asset.residual_value THEN
                v_monthly_depreciation := v_asset.net_book_value - v_asset.residual_value;
            END IF;
            
        ELSE
            -- Default to straight line if method not supported
            v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) / 
                                     NULLIF(v_asset.useful_life_months, 0);
        END IF;
        
        -- Only create entry if there's depreciation to record
        IF v_monthly_depreciation > 0 THEN
            -- Calculate new values
            v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
            v_net_book_value := v_asset.purchase_price - v_accumulated_dep;
            
            -- Insert depreciation schedule entry
            INSERT INTO asset_depreciation_schedule (
                tenant_id,
                asset_id,
                depreciation_date,
                period_number,
                opening_book_value,
                depreciation_amount,
                accumulated_depreciation,
                closing_book_value,
                calculation_method,
                calculation_basis,
                status,
                posted_to_gl,
                created_by
            ) VALUES (
                p_tenant_id,
                v_asset.asset_id,
                p_depreciation_month,
                EXTRACT(YEAR FROM AGE(p_depreciation_month, v_asset.acquisition_date)) * 12 + 
                    EXTRACT(MONTH FROM AGE(p_depreciation_month, v_asset.acquisition_date)),
                v_asset.net_book_value,
                v_monthly_depreciation,
                v_accumulated_dep,
                v_net_book_value,
                v_asset.depreciation_method,
                'Monthly depreciation calculated on ' || CURRENT_TIMESTAMP,
                'CALCULATED',
                false,
                '00000000-0000-0000-0000-000000000000'
            ) RETURNING schedule_id INTO v_schedule_id;
            
            -- Update the schedule to trigger GL posting (via trigger)
            UPDATE asset_depreciation_schedule
            SET status = 'CALCULATED'
            WHERE schedule_id = v_schedule_id;
            
            -- Update asset with new depreciation values
            UPDATE fixed_assets
            SET 
                accumulated_depreciation = v_accumulated_dep,
                net_book_value = v_net_book_value,
                last_depreciation_date = p_depreciation_month
            WHERE asset_id = v_asset.asset_id;
            
            v_assets_count := v_assets_count + 1;
            v_total_amount := v_total_amount + v_monthly_depreciation;
            
            RAISE NOTICE 'Depreciation calculated for asset %: R %', 
                v_asset.asset_tag, v_monthly_depreciation;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        v_assets_count,
        v_total_amount,
        'Processed ' || v_assets_count || ' assets with total depreciation of R ' || 
            TO_CHAR(v_total_amount, 'FM999,999,990.00');
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trg_post_asset_acquisition_to_gl', 'trg_post_depreciation_to_gl')
ORDER BY trigger_name;

-- Verify GL accounts exist
SELECT account_code, account_name, account_type, category
FROM chart_of_accounts
WHERE account_code IN ('1500', '1550', '6300')
ORDER BY account_code;
