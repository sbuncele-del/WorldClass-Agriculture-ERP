-- ============================================================================
-- ASSET MANAGEMENT - WORKING GL POSTING (Adapted to existing schema)
-- ============================================================================

-- Drop and recreate functions to match ACTUAL database schema
DROP FUNCTION IF EXISTS post_asset_acquisition_to_gl() CASCADE;
DROP FUNCTION IF EXISTS post_depreciation_to_gl() CASCADE;
DROP FUNCTION IF EXISTS calculate_monthly_depreciation(UUID, DATE) CASCADE;

-- Simple asset acquisition GL posting
CREATE OR REPLACE FUNCTION post_asset_acquisition_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_asset_account_id INTEGER;
    v_bank_account_id INTEGER;
    v_ap_account_id INTEGER;
    v_contra_account_id INTEGER;
BEGIN
    -- Only post when asset becomes ACTIVE and not already posted
    IF NEW.asset_status = 'ACTIVE' AND (OLD.asset_status IS NULL OR OLD.asset_status != 'ACTIVE') AND NEW.posted_to_gl = false THEN
        
        -- Get account IDs
        SELECT account_id INTO v_asset_account_id FROM chart_of_accounts WHERE account_code = '1500' AND tenant_id = NEW.tenant_id LIMIT 1;
        SELECT account_id INTO v_bank_account_id FROM chart_of_accounts WHERE account_code = '1000' AND tenant_id = NEW.tenant_id LIMIT 1;
        SELECT account_id INTO v_ap_account_id FROM chart_of_accounts WHERE account_code = '2100' AND tenant_id = NEW.tenant_id LIMIT 1;
        
        -- Determine contra account
        IF NEW.acquisition_method = 'PURCHASE' THEN
            v_contra_account_id := v_ap_account_id;
        ELSE
            v_contra_account_id := v_bank_account_id;
        END IF;
        
        -- Post DR: Fixed Assets
        INSERT INTO gl_transactions (
            transaction_date, posting_date, account_id, source_type, source_id,
            description, debit_amount, credit_amount, tenant_id
        ) VALUES (
            NEW.acquisition_date, NEW.acquisition_date, v_asset_account_id,
            'FIXED_ASSET', NEW.asset_id,
            'IAS 16 - Asset Acquisition: ' || NEW.asset_name || ' (' || NEW.asset_number || ')',
            NEW.purchase_price, 0, NEW.tenant_id
        );
        
        -- Post CR: Bank or AP
        INSERT INTO gl_transactions (
            transaction_date, posting_date, account_id, source_type, source_id,
            description, debit_amount, credit_amount, tenant_id
        ) VALUES (
            NEW.acquisition_date, NEW.acquisition_date, v_contra_account_id,
            'FIXED_ASSET', NEW.asset_id,
            'IAS 16 - Asset Acquisition: ' || NEW.asset_name || ' (' || NEW.asset_number || ')',
            0, NEW.purchase_price, NEW.tenant_id
        );
        
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Asset acquisition posted: %, Amount: %', NEW.asset_number, NEW.purchase_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_asset_acquisition_to_gl
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION post_asset_acquisition_to_gl();

-- Depreciation GL posting
CREATE OR REPLACE FUNCTION post_depreciation_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_expense_account_id INTEGER;
    v_accum_dep_account_id INTEGER;
BEGIN
    -- Only post when calculated and not posted
    IF NEW.posted_to_gl = false THEN
        
        -- Get account IDs
        SELECT account_id INTO v_expense_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '6300' AND tenant_id = NEW.tenant_id LIMIT 1;
        
        SELECT account_id INTO v_accum_dep_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '1550' AND tenant_id = NEW.tenant_id LIMIT 1;
        
        -- Post DR: Depreciation Expense
        INSERT INTO gl_transactions (
            transaction_date, posting_date, account_id, source_type, source_id,
            description, debit_amount, credit_amount, tenant_id
        ) VALUES (
            NEW.depreciation_date, NEW.depreciation_date, v_expense_account_id,
            'DEPRECIATION', NEW.schedule_id,
            'IAS 16 - Depreciation for asset ID ' || NEW.asset_id,
            NEW.depreciation_amount, 0, NEW.tenant_id
        );
        
        -- Post CR: Accumulated Depreciation
        INSERT INTO gl_transactions (
            transaction_date, posting_date, account_id, source_type, source_id,
            description, debit_amount, credit_amount, tenant_id
        ) VALUES (
            NEW.depreciation_date, NEW.depreciation_date, v_accum_dep_account_id,
            'DEPRECIATION', NEW.schedule_id,
            'IAS 16 - Depreciation for asset ID ' || NEW.asset_id,
            0, NEW.depreciation_amount, NEW.tenant_id
        );
        
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_depreciation_to_gl
    BEFORE UPDATE ON asset_depreciation_schedule
    FOR EACH ROW
    EXECUTE FUNCTION post_depreciation_to_gl();

-- Simplified monthly depreciation calculation
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
    FOR v_asset IN 
        SELECT 
            asset_id, asset_number, asset_name, purchase_price, residual_value,
            depreciation_method, useful_life_months,
            acquisition_date, accumulated_depreciation, net_book_value
        FROM fixed_assets
        WHERE tenant_id = p_tenant_id
        AND asset_status = 'ACTIVE'
        AND acquisition_date < p_depreciation_month
        AND (disposal_date IS NULL OR disposal_date >= p_depreciation_month)
        AND depreciation_start_date <= p_depreciation_month
    LOOP
        -- Calculate straight-line depreciation
        v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) / 
                                 NULLIF(v_asset.useful_life_months, 0);
        
        -- Don't depreciate below residual
        v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
        IF v_accumulated_dep > (v_asset.purchase_price - v_asset.residual_value) THEN
            v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) - 
                                     v_asset.accumulated_depreciation;
        END IF;
        
        IF v_monthly_depreciation > 0 THEN
            v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
            v_net_book_value := v_asset.purchase_price - v_accumulated_dep;
            
            -- Insert depreciation schedule
            INSERT INTO asset_depreciation_schedule (
                tenant_id, asset_id, depreciation_date,
                opening_book_value, depreciation_amount, accumulated_depreciation,
                closing_book_value, calculation_method,
                posted_to_gl, created_by
            ) VALUES (
                p_tenant_id, v_asset.asset_id, p_depreciation_month,
                v_asset.net_book_value, v_monthly_depreciation, v_accumulated_dep,
                v_net_book_value, v_asset.depreciation_method,
                false, '00000000-0000-0000-0000-000000000000'
            ) RETURNING schedule_id INTO v_schedule_id;
            
            -- Trigger GL posting
            UPDATE asset_depreciation_schedule
            SET posted_to_gl = false
            WHERE schedule_id = v_schedule_id;
            
            -- Update asset
            UPDATE fixed_assets
            SET accumulated_depreciation = v_accumulated_dep,
                net_book_value = v_net_book_value,
                last_depreciation_date = p_depreciation_month
            WHERE asset_id = v_asset.asset_id;
            
            v_assets_count := v_assets_count + 1;
            v_total_amount := v_total_amount + v_monthly_depreciation;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        v_assets_count,
        v_total_amount,
        'Processed ' || v_assets_count || ' assets, total: R ' || 
            TO_CHAR(v_total_amount, 'FM999,999,990.00');
END;
$$ LANGUAGE plpgsql;

SELECT 'Asset GL posting functions deployed (simplified for existing schema)' as status;
