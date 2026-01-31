-- IAS 16 REVALUATION MODEL - GL POSTING
-- Deploy when EC2 is available

-- Function to post asset revaluation to GL
CREATE OR REPLACE FUNCTION post_asset_revaluation_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_asset RECORD;
    v_asset_account_id INTEGER;
    v_accum_dep_account_id INTEGER;
    v_reval_reserve_account_id INTEGER;
    v_reval_loss_account_id INTEGER;
    v_net_revaluation DECIMAL(15,2);
    v_previous_nbv DECIMAL(15,2);
    v_revalued_amount DECIMAL(15,2);
    v_accumulated_dep DECIMAL(15,2);
BEGIN
    IF NEW.posted_to_gl = false AND NEW.status = 'APPROVED' THEN
        -- Get asset details
        SELECT 
            a.asset_number, a.asset_name, a.tenant_id,
            a.purchase_price, a.accumulated_depreciation, a.net_book_value,
            a.asset_id
        INTO v_asset
        FROM fixed_assets a
        WHERE a.asset_id = NEW.asset_id;
        
        -- Get GL account IDs
        SELECT account_id INTO v_asset_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '1500' AND tenant_id = v_asset.tenant_id LIMIT 1;
        
        SELECT account_id INTO v_accum_dep_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '1550' AND tenant_id = v_asset.tenant_id LIMIT 1;
        
        SELECT account_id INTO v_reval_reserve_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '3200' AND tenant_id = v_asset.tenant_id LIMIT 1;
        
        SELECT account_id INTO v_reval_loss_account_id 
        FROM chart_of_accounts 
        WHERE account_code = '6350' AND tenant_id = v_asset.tenant_id LIMIT 1;
        
        -- Calculate net revaluation
        v_previous_nbv := v_asset.net_book_value;
        v_revalued_amount := NEW.revalued_amount;
        v_net_revaluation := v_revalued_amount - v_previous_nbv;
        
        -- IAS 16: Revaluation increases go to Revaluation Reserve (Equity)
        -- Revaluation decreases go to P&L (unless reversing previous increase)
        
        IF v_net_revaluation > 0 THEN
            -- REVALUATION GAIN
            -- Step 1: Eliminate accumulated depreciation (optional method)
            IF NEW.eliminate_accumulated_depreciation = true THEN
                v_accumulated_dep := v_asset.accumulated_depreciation;
                
                -- DR Accumulated Depreciation (eliminate)
                INSERT INTO gl_transactions (
                    transaction_date, posting_date, account_id, source_type, source_id,
                    description, debit_amount, credit_amount, tenant_id, journal_entry_id
                ) VALUES (
                    NEW.revaluation_date, NEW.revaluation_date, v_accum_dep_account_id,
                    'REVALUATION', NEW.revaluation_id,
                    'IAS 16 - Eliminate Accum Dep on Revaluation: ' || v_asset.asset_name || ' (' || v_asset.asset_number || ')',
                    v_accumulated_dep, 0, v_asset.tenant_id, NEW.journal_entry_id
                );
                
                -- CR Fixed Assets (reduce gross carrying amount)
                INSERT INTO gl_transactions (
                    transaction_date, posting_date, account_id, source_type, source_id,
                    description, debit_amount, credit_amount, tenant_id, journal_entry_id
                ) VALUES (
                    NEW.revaluation_date, NEW.revaluation_date, v_asset_account_id,
                    'REVALUATION', NEW.revaluation_id,
                    'IAS 16 - Eliminate Accum Dep on Revaluation: ' || v_asset.asset_name || ' (' || v_asset.asset_number || ')',
                    0, v_accumulated_dep, v_asset.tenant_id, NEW.journal_entry_id
                );
            END IF;
            
            -- Step 2: Record revaluation gain to Revaluation Reserve
            -- DR Fixed Assets (increase to revalued amount)
            INSERT INTO gl_transactions (
                transaction_date, posting_date, account_id, source_type, source_id,
                description, debit_amount, credit_amount, tenant_id, journal_entry_id
            ) VALUES (
                NEW.revaluation_date, NEW.revaluation_date, v_asset_account_id,
                'REVALUATION', NEW.revaluation_id,
                'IAS 16 - Revaluation Gain: ' || v_asset.asset_name || ' (' || v_asset.asset_number || ')',
                v_net_revaluation, 0, v_asset.tenant_id, NEW.journal_entry_id
            );
            
            -- CR Revaluation Reserve (equity)
            INSERT INTO gl_transactions (
                transaction_date, posting_date, account_id, source_type, source_id,
                description, debit_amount, credit_amount, tenant_id, journal_entry_id
            ) VALUES (
                NEW.revaluation_date, NEW.revaluation_date, v_reval_reserve_account_id,
                'REVALUATION', NEW.revaluation_id,
                'IAS 16 - Revaluation Gain: ' || v_asset.asset_name || ' (' || v_asset.asset_number || ')',
                0, v_net_revaluation, v_asset.tenant_id, NEW.journal_entry_id
            );
            
        ELSIF v_net_revaluation < 0 THEN
            -- REVALUATION LOSS
            -- Check if there's existing revaluation reserve for this asset
            DECLARE
                v_existing_reserve DECIMAL(15,2);
                v_loss_to_reserve DECIMAL(15,2);
                v_loss_to_pl DECIMAL(15,2);
            BEGIN
                -- Get cumulative revaluation reserve for this asset
                SELECT COALESCE(SUM(
                    CASE 
                        WHEN revaluation_type = 'INCREASE' THEN revalued_amount - previous_carrying_amount
                        ELSE 0
                    END
                ), 0) INTO v_existing_reserve
                FROM asset_revaluations
                WHERE asset_id = NEW.asset_id
                AND status = 'APPROVED'
                AND posted_to_gl = true
                AND revaluation_id != NEW.revaluation_id;
                
                -- Loss reverses previous gains first (to reserve), then P&L
                IF v_existing_reserve > 0 THEN
                    v_loss_to_reserve := LEAST(ABS(v_net_revaluation), v_existing_reserve);
                    v_loss_to_pl := ABS(v_net_revaluation) - v_loss_to_reserve;
                    
                    -- DR Revaluation Reserve (reverse previous gain)
                    IF v_loss_to_reserve > 0 THEN
                        INSERT INTO gl_transactions (
                            transaction_date, posting_date, account_id, source_type, source_id,
                            description, debit_amount, credit_amount, tenant_id, journal_entry_id
                        ) VALUES (
                            NEW.revaluation_date, NEW.revaluation_date, v_reval_reserve_account_id,
                            'REVALUATION', NEW.revaluation_id,
                            'IAS 16 - Revaluation Loss (Reverse Reserve): ' || v_asset.asset_name,
                            v_loss_to_reserve, 0, v_asset.tenant_id, NEW.journal_entry_id
                        );
                    END IF;
                    
                    -- DR Revaluation Loss (P&L) for excess
                    IF v_loss_to_pl > 0 THEN
                        INSERT INTO gl_transactions (
                            transaction_date, posting_date, account_id, source_type, source_id,
                            description, debit_amount, credit_amount, tenant_id, journal_entry_id
                        ) VALUES (
                            NEW.revaluation_date, NEW.revaluation_date, v_reval_loss_account_id,
                            'REVALUATION', NEW.revaluation_id,
                            'IAS 16 - Revaluation Loss (Excess): ' || v_asset.asset_name,
                            v_loss_to_pl, 0, v_asset.tenant_id, NEW.journal_entry_id
                        );
                    END IF;
                ELSE
                    -- No previous reserve, entire loss to P&L
                    INSERT INTO gl_transactions (
                        transaction_date, posting_date, account_id, source_type, source_id,
                        description, debit_amount, credit_amount, tenant_id, journal_entry_id
                    ) VALUES (
                        NEW.revaluation_date, NEW.revaluation_date, v_reval_loss_account_id,
                        'REVALUATION', NEW.revaluation_id,
                        'IAS 16 - Revaluation Loss: ' || v_asset.asset_name,
                        ABS(v_net_revaluation), 0, v_asset.tenant_id, NEW.journal_entry_id
                    );
                END IF;
                
                -- CR Fixed Assets (decrease)
                INSERT INTO gl_transactions (
                    transaction_date, posting_date, account_id, source_type, source_id,
                    description, debit_amount, credit_amount, tenant_id, journal_entry_id
                ) VALUES (
                    NEW.revaluation_date, NEW.revaluation_date, v_asset_account_id,
                    'REVALUATION', NEW.revaluation_id,
                    'IAS 16 - Revaluation Loss: ' || v_asset.asset_name,
                    0, ABS(v_net_revaluation), v_asset.tenant_id, NEW.journal_entry_id
                );
            END;
        END IF;
        
        -- Update fixed assets with new values
        UPDATE fixed_assets
        SET purchase_price = NEW.revalued_amount,
            accumulated_depreciation = CASE 
                WHEN NEW.eliminate_accumulated_depreciation = true THEN 0 
                ELSE accumulated_depreciation 
            END,
            net_book_value = NEW.revalued_amount,
            last_revaluation_date = NEW.revaluation_date,
            revaluation_frequency = NEW.revaluation_frequency
        WHERE asset_id = NEW.asset_id;
        
        -- Reset depreciation schedule after revaluation
        UPDATE asset_depreciation_schedule
        SET status = 'SUPERSEDED'
        WHERE asset_id = NEW.asset_id
        AND depreciation_date > NEW.revaluation_date;
        
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Revaluation posted: %, Net Effect: R %', 
            v_asset.asset_number, v_net_revaluation;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for revaluation GL posting
DROP TRIGGER IF EXISTS trg_post_asset_revaluation_to_gl ON asset_revaluations;

CREATE TRIGGER trg_post_asset_revaluation_to_gl
    BEFORE UPDATE ON asset_revaluations
    FOR EACH ROW
    EXECUTE FUNCTION post_asset_revaluation_to_gl();

-- Test revaluation example (commented out - run manually)
/*
-- Example 1: Revaluation Gain
INSERT INTO asset_revaluations (
    asset_id, tenant_id, revaluation_date, previous_carrying_amount,
    revalued_amount, revaluation_type, valuation_method, valuer_name,
    eliminate_accumulated_depreciation, revaluation_frequency,
    status, created_by
) VALUES (
    3, -- VEH-2025-002
    '00000000-0000-0000-0000-000000000001',
    '2025-12-31',
    443250.00,  -- Current NBV after Nov depreciation
    500000.00,  -- Revalued to R500k
    'INCREASE',
    'MARKET_VALUE',
    'ABC Valuers',
    true,  -- Eliminate accumulated depreciation
    'ANNUAL',
    'DRAFT',
    '00000000-0000-0000-0000-000000000000'
) RETURNING revaluation_id;

-- Approve to trigger GL posting
UPDATE asset_revaluations 
SET status = 'APPROVED' 
WHERE revaluation_id = [returned_id];

-- Expected GL entries:
-- DR 1550 Accumulated Depreciation: R 6,750 (eliminate)
-- CR 1500 Fixed Assets: R 6,750 (reduce gross amount)
-- DR 1500 Fixed Assets: R 56,750 (net revaluation gain)
-- CR 3200 Revaluation Reserve: R 56,750 (equity)
*/
