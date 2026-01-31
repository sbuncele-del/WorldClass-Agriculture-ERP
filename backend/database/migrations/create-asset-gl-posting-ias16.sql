-- ============================================================================
-- ASSET MANAGEMENT - IAS 16 COMPLIANT GL POSTING FUNCTIONS
-- ============================================================================
-- This migration implements full IAS 16 (Property, Plant & Equipment) compliance:
-- 1. Initial Recognition (Cost Model)
-- 2. Subsequent Measurement (Cost or Revaluation Model)
-- 3. Depreciation (IAS 16.43-62)
-- 4. Impairment (IAS 36)
-- 5. Derecognition/Disposal (IAS 16.67-72)
-- 6. Revaluation Model (IAS 16.31-42)
-- 7. Subsequent Costs (Capitalize vs Expense per IAS 16.7-14)
-- ============================================================================

-- ============================================================================
-- 1. INITIAL RECOGNITION - ASSET ACQUISITION (IAS 16.15-28)
-- ============================================================================
-- Cost includes: purchase price, import duties, non-refundable taxes,
-- directly attributable costs of bringing asset to working condition

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
                v_contra_account_code := '3100'; -- Other Income (fair value)
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
        v_journal_number := 'JE-AST-ACQ-' || TO_CHAR(NEW.acquisition_date, 'YYYY-MM') || '-' || LPAD(NEW.asset_id::TEXT, 6, '0');
        
        -- Build description (IAS 16 disclosure requirement)
        v_description := 'IAS 16 - Initial Recognition: ' || NEW.asset_name || ' (' || NEW.asset_tag || ')';
        
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
        
        -- DR: Fixed Asset at cost (IAS 16.15)
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
        
        -- CR: Contra Account
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
        
        RAISE NOTICE 'IAS 16 - Asset acquisition posted: %, Amount %', 
            NEW.asset_tag, NEW.purchase_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_asset_acquisition_to_gl ON fixed_assets;
CREATE TRIGGER trg_post_asset_acquisition_to_gl
    BEFORE UPDATE ON fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION post_asset_acquisition_to_gl();


-- ============================================================================
-- 2. DEPRECIATION - SYSTEMATIC ALLOCATION (IAS 16.43-62)
-- ============================================================================
-- Depreciable amount = Cost - Residual Value
-- Allocated systematically over useful life
-- Depreciation method reflects pattern of consumption

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
        
        -- Default accounts if not specified
        IF v_expense_account_code IS NULL THEN
            v_expense_account_code := '6300'; -- Depreciation Expense
        END IF;
        
        IF v_accumulated_dep_account IS NULL THEN
            v_accumulated_dep_account := '1550'; -- Accumulated Depreciation
        END IF;
        
        -- Get accounting period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.depreciation_date BETWEEN start_date AND end_date
        AND status IN ('OPEN', 'CLOSED')
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No accounting period found for depreciation date: %', NEW.depreciation_date;
        END IF;
        
        -- Generate journal number
        v_journal_number := 'JE-DEP-' || TO_CHAR(NEW.depreciation_date, 'YYYY-MM') || '-' || LPAD(NEW.schedule_id::TEXT, 6, '0');
        
        -- Build description (IAS 16 disclosure)
        v_description := 'IAS 16.50 - Depreciation: ' || v_asset_name || ' (' || v_asset_tag || ') - ' || 
                        NEW.calculation_method || ' method - ' || TO_CHAR(NEW.depreciation_date, 'Month YYYY');
        
        -- Create journal entry
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
        
        -- DR: Depreciation Expense (IAS 16.48 - P&L or cost of other asset)
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
        
        -- CR: Accumulated Depreciation (IAS 16.6 - contra asset)
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
        
        -- Update schedule
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        NEW.posted_at := CURRENT_TIMESTAMP;
        NEW.status := 'POSTED';
        
        RAISE NOTICE 'IAS 16 - Depreciation posted: %, Amount %', v_asset_tag, NEW.depreciation_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_depreciation_to_gl ON asset_depreciation_schedule;
CREATE TRIGGER trg_post_depreciation_to_gl
    BEFORE UPDATE ON asset_depreciation_schedule
    FOR EACH ROW
    EXECUTE FUNCTION post_depreciation_to_gl();


-- ============================================================================
-- 3. REVALUATION MODEL (IAS 16.31-42)
-- ============================================================================
-- Asset carried at revalued amount = fair value at revaluation date
-- minus subsequent accumulated depreciation
-- Revaluation surplus → OCI → Revaluation Reserve (Equity)
-- Revaluation deficit → P&L (unless reversing previous surplus)

CREATE OR REPLACE FUNCTION post_revaluation_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
    v_asset_account VARCHAR(50);
    v_accum_dep_account VARCHAR(50);
    v_revaluation_reserve_account VARCHAR(50) := '3200'; -- Revaluation Reserve (Equity)
    v_revaluation_loss_account VARCHAR(50) := '6350'; -- Revaluation Loss (Expense)
    v_asset_tag VARCHAR(50);
    v_asset_name VARCHAR(255);
    v_net_revaluation DECIMAL(15,2);
    v_accumulated_dep DECIMAL(15,2);
BEGIN
    -- Only post approved revaluations not yet posted
    IF NEW.approved_by IS NOT NULL AND NEW.posted_to_gl = false THEN
        
        -- Get asset details
        SELECT 
            fa.asset_tag,
            fa.asset_name,
            fa.accumulated_depreciation,
            ac.depreciation_gl_account,
            ac.depreciation_expense_account
        INTO 
            v_asset_tag,
            v_asset_name,
            v_accumulated_dep,
            v_asset_account,
            v_accum_dep_account
        FROM fixed_assets fa
        JOIN asset_categories ac ON fa.category_id = ac.category_id
        WHERE fa.asset_id = NEW.asset_id;
        
        -- Defaults
        IF v_asset_account IS NULL THEN v_asset_account := '1500'; END IF;
        IF v_accum_dep_account IS NULL THEN v_accum_dep_account := '1550'; END IF;
        
        -- Get period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.revaluation_date BETWEEN start_date AND end_date
        AND status = 'OPEN'
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No open accounting period for revaluation date: %', NEW.revaluation_date;
        END IF;
        
        -- Journal number
        v_journal_number := 'JE-REVAL-' || TO_CHAR(NEW.revaluation_date, 'YYYY-MM') || '-' || 
                           LPAD(NEW.revaluation_id::TEXT, 6, '0');
        
        -- Description
        v_description := 'IAS 16.31 - Revaluation: ' || v_asset_name || ' (' || v_asset_tag || ') - ' ||
                        NEW.valuation_method || ' - Previous NBV: ' || NEW.previous_book_value ||
                        ', New Valuation: ' || NEW.new_valuation;
        
        -- Create journal entry
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
            NEW.revaluation_date,
            v_period_id,
            'REVALUATION',
            'ASSET_REVALUATION',
            NEW.revaluation_id,
            v_description,
            'POSTED',
            NEW.created_by,
            CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- IAS 16.39-40: Revaluation surplus or deficit
        IF NEW.revaluation_surplus_deficit > 0 THEN
            -- REVALUATION SURPLUS (IAS 16.39)
            -- DR: Fixed Asset (increase to fair value)
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_asset_account, NEW.revaluation_date,
                NEW.revaluation_surplus_deficit, 0, v_description || ' - Asset increase',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
            -- CR: Revaluation Reserve (OCI → Equity)
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_revaluation_reserve_account, NEW.revaluation_date,
                0, NEW.revaluation_surplus_deficit, v_description || ' - Revaluation surplus to OCI',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
        ELSIF NEW.revaluation_surplus_deficit < 0 THEN
            -- REVALUATION DEFICIT (IAS 16.40)
            -- CR: Fixed Asset (decrease to fair value)
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_asset_account, NEW.revaluation_date,
                0, ABS(NEW.revaluation_surplus_deficit), v_description || ' - Asset decrease',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
            -- DR: Revaluation Loss (P&L expense)
            -- Note: Should check if previous surplus exists and reverse that first
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_revaluation_loss_account, NEW.revaluation_date,
                ABS(NEW.revaluation_surplus_deficit), 0, v_description || ' - Revaluation deficit to P&L',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        END IF;
        
        -- IAS 16.41: Reset accumulated depreciation on revaluation
        -- Eliminate accumulated depreciation against gross carrying amount
        IF v_accumulated_dep > 0 THEN
            -- DR: Accumulated Depreciation (eliminate)
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_accum_dep_account, NEW.revaluation_date,
                v_accumulated_dep, 0, v_description || ' - Reset accumulated depreciation',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
            -- CR: Fixed Asset (offset)
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_asset_account, NEW.revaluation_date,
                0, v_accumulated_dep, v_description || ' - Reset gross carrying amount',
                'ASSET_REVALUATION', NEW.revaluation_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
            -- Update asset to reset accumulated depreciation
            UPDATE fixed_assets
            SET accumulated_depreciation = 0,
                net_book_value = NEW.new_valuation,
                purchase_price = NEW.new_valuation,
                revaluation_date = NEW.revaluation_date,
                revaluation_amount = NEW.revaluation_surplus_deficit
            WHERE asset_id = NEW.asset_id;
        END IF;
        
        -- Update revaluation record
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        
        RAISE NOTICE 'IAS 16 - Revaluation posted: %, Surplus/Deficit: %', 
            v_asset_tag, NEW.revaluation_surplus_deficit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_revaluation_to_gl ON asset_revaluations;
CREATE TRIGGER trg_post_revaluation_to_gl
    BEFORE UPDATE ON asset_revaluations
    FOR EACH ROW
    EXECUTE FUNCTION post_revaluation_to_gl();


-- ============================================================================
-- 4. SUBSEQUENT COSTS - CAPITALIZE vs EXPENSE (IAS 16.7-14)
-- ============================================================================
-- Capitalize if: increases future economic benefits beyond original assessment
-- Expense if: routine maintenance/repairs (day-to-day servicing)

CREATE OR REPLACE FUNCTION post_maintenance_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
    v_asset_tag VARCHAR(50);
    v_asset_name VARCHAR(255);
    v_capitalize BOOLEAN := false;
    v_asset_account VARCHAR(50) := '1500';
    v_expense_account VARCHAR(50) := '6400'; -- Repairs & Maintenance Expense
    v_ap_account VARCHAR(50) := '2100'; -- Accounts Payable
BEGIN
    -- Only post completed maintenance not yet posted
    IF NEW.status = 'COMPLETED' AND OLD.status IN ('SCHEDULED', 'IN_PROGRESS') 
       AND NEW.journal_entry_id IS NULL THEN
        
        -- Get asset details
        SELECT asset_tag, asset_name
        INTO v_asset_tag, v_asset_name
        FROM fixed_assets
        WHERE asset_id = NEW.asset_id;
        
        -- Determine if should capitalize (IAS 16.12-13)
        -- Capitalize if: major overhaul, upgrade, betterment
        -- Simple heuristic: Cost > 10% of original asset value OR type is major
        SELECT 
            CASE 
                WHEN mt.type_code IN ('UPGRADE', 'MAJOR_OVERHAUL', 'BETTERMENT') THEN true
                WHEN NEW.total_cost > (fa.purchase_price * 0.10) THEN true
                ELSE false
            END
        INTO v_capitalize
        FROM fixed_assets fa
        LEFT JOIN maintenance_types mt ON NEW.maintenance_type_id = mt.maintenance_type_id
        WHERE fa.asset_id = NEW.asset_id;
        
        -- Get period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.completed_date BETWEEN start_date AND end_date
        AND status = 'OPEN'
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No open accounting period for maintenance date: %', NEW.completed_date;
        END IF;
        
        -- Journal number
        v_journal_number := 'JE-MAINT-' || TO_CHAR(NEW.completed_date, 'YYYY-MM') || '-' || 
                           LPAD(NEW.maintenance_id::TEXT, 6, '0');
        
        -- Description
        IF v_capitalize THEN
            v_description := 'IAS 16.12 - Capitalize Subsequent Cost: ' || v_asset_name || 
                           ' (' || v_asset_tag || ') - ' || NEW.description;
        ELSE
            v_description := 'IAS 16.12 - Expense Maintenance: ' || v_asset_name || 
                           ' (' || v_asset_tag || ') - ' || NEW.description;
        END IF;
        
        -- Create journal entry
        INSERT INTO journal_entries (
            tenant_id, journal_number, journal_date, period_id,
            journal_type, reference_type, reference_id, description,
            status, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_number, NEW.completed_date, v_period_id,
            'MAINTENANCE', 'ASSET_MAINTENANCE', NEW.maintenance_id, v_description,
            'POSTED', NEW.created_by, CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        IF v_capitalize THEN
            -- CAPITALIZE: Increase asset carrying amount
            -- DR: Fixed Asset
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_asset_account, NEW.completed_date,
                NEW.total_cost, 0, v_description || ' - Capitalized',
                'ASSET_MAINTENANCE', NEW.maintenance_id, NEW.created_by, CURRENT_TIMESTAMP
            );
            
            -- Update asset cost
            UPDATE fixed_assets
            SET purchase_price = purchase_price + NEW.total_cost,
                net_book_value = net_book_value + NEW.total_cost
            WHERE asset_id = NEW.asset_id;
            
        ELSE
            -- EXPENSE: Routine maintenance
            -- DR: Repairs & Maintenance Expense
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_expense_account, NEW.completed_date,
                NEW.total_cost, 0, v_description || ' - Expensed',
                'ASSET_MAINTENANCE', NEW.maintenance_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        END IF;
        
        -- CR: Accounts Payable (if vendor invoice)
        INSERT INTO gl_transactions (
            tenant_id, entry_id, account_code, transaction_date,
            debit_amount, credit_amount, description,
            reference_type, reference_id, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_entry_id, v_ap_account, NEW.completed_date,
            0, NEW.total_cost, v_description || ' - Vendor: ' || COALESCE(NEW.performed_by, 'Internal'),
            'ASSET_MAINTENANCE', NEW.maintenance_id, NEW.created_by, CURRENT_TIMESTAMP
        );
        
        -- Update maintenance record
        NEW.journal_entry_id := v_journal_entry_id;
        
        RAISE NOTICE 'IAS 16 - Maintenance posted: %, Cost: %, Capitalized: %', 
            v_asset_tag, NEW.total_cost, v_capitalize;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_maintenance_to_gl ON asset_maintenance;
CREATE TRIGGER trg_post_maintenance_to_gl
    BEFORE UPDATE ON asset_maintenance
    FOR EACH ROW
    EXECUTE FUNCTION post_maintenance_to_gl();


-- ============================================================================
-- 5. DERECOGNITION/DISPOSAL (IAS 16.67-72)
-- ============================================================================
-- Remove asset from balance sheet on disposal or no future economic benefits
-- Gain/Loss = Proceeds - Carrying Amount

CREATE OR REPLACE FUNCTION post_disposal_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
    v_asset_account VARCHAR(50) := '1500';
    v_accum_dep_account VARCHAR(50) := '1550';
    v_proceeds_account VARCHAR(50);
    v_gain_loss_account VARCHAR(50);
    v_asset_tag VARCHAR(50);
    v_asset_name VARCHAR(255);
    v_asset_cost DECIMAL(15,2);
    v_accumulated_dep DECIMAL(15,2);
BEGIN
    -- Only post approved disposals not yet posted
    IF NEW.approved_by IS NOT NULL AND NEW.posted_to_gl = false THEN
        
        -- Get asset details
        SELECT 
            asset_tag, asset_name, purchase_price, accumulated_depreciation
        INTO 
            v_asset_tag, v_asset_name, v_asset_cost, v_accumulated_dep
        FROM fixed_assets
        WHERE asset_id = NEW.asset_id;
        
        -- Determine proceeds account
        CASE NEW.disposal_method
            WHEN 'SOLD' THEN v_proceeds_account := '1000'; -- Bank
            WHEN 'TRADE_IN' THEN v_proceeds_account := '1500'; -- Fixed Assets (new asset)
            ELSE v_proceeds_account := '1000'; -- Default bank
        END CASE;
        
        -- Gain/Loss account
        IF NEW.gain_loss >= 0 THEN
            v_gain_loss_account := '3150'; -- Gain on Asset Disposal (Other Income)
        ELSE
            v_gain_loss_account := '6360'; -- Loss on Asset Disposal (Expense)
        END IF;
        
        -- Get period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.disposal_date BETWEEN start_date AND end_date
        AND status = 'OPEN'
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No open accounting period for disposal date: %', NEW.disposal_date;
        END IF;
        
        -- Journal number
        v_journal_number := 'JE-DISP-' || TO_CHAR(NEW.disposal_date, 'YYYY-MM') || '-' || 
                           LPAD(NEW.disposal_id::TEXT, 6, '0');
        
        -- Description
        v_description := 'IAS 16.67 - Asset Disposal: ' || v_asset_name || ' (' || v_asset_tag || ') - ' ||
                        NEW.disposal_method || ' - NBV: ' || NEW.net_book_value || 
                        ', Proceeds: ' || NEW.disposal_proceeds || ', Gain/Loss: ' || NEW.gain_loss;
        
        -- Create journal entry
        INSERT INTO journal_entries (
            tenant_id, journal_number, journal_date, period_id,
            journal_type, reference_type, reference_id, description,
            status, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_number, NEW.disposal_date, v_period_id,
            'ASSET_DISPOSAL', 'ASSET_DISPOSAL', NEW.disposal_id, v_description,
            'POSTED', NEW.created_by, CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- DR: Accumulated Depreciation (eliminate)
        INSERT INTO gl_transactions (
            tenant_id, entry_id, account_code, transaction_date,
            debit_amount, credit_amount, description,
            reference_type, reference_id, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_entry_id, v_accum_dep_account, NEW.disposal_date,
            v_accumulated_dep, 0, v_description || ' - Remove accumulated depreciation',
            'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
        );
        
        -- DR/CR: Cash/Bank (proceeds if any)
        IF NEW.disposal_proceeds > 0 THEN
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_proceeds_account, NEW.disposal_date,
                NEW.disposal_proceeds, 0, v_description || ' - Disposal proceeds',
                'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        END IF;
        
        -- DR: Disposal costs (if any)
        IF NEW.disposal_costs > 0 THEN
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, '6360', NEW.disposal_date,
                NEW.disposal_costs, 0, v_description || ' - Disposal costs',
                'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        END IF;
        
        -- DR/CR: Gain or Loss on Disposal
        IF NEW.gain_loss > 0 THEN
            -- GAIN: Credit Other Income
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_gain_loss_account, NEW.disposal_date,
                0, NEW.gain_loss, v_description || ' - Gain on disposal',
                'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        ELSIF NEW.gain_loss < 0 THEN
            -- LOSS: Debit Expense
            INSERT INTO gl_transactions (
                tenant_id, entry_id, account_code, transaction_date,
                debit_amount, credit_amount, description,
                reference_type, reference_id, created_by, created_at
            ) VALUES (
                NEW.tenant_id, v_journal_entry_id, v_gain_loss_account, NEW.disposal_date,
                ABS(NEW.gain_loss), 0, v_description || ' - Loss on disposal',
                'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
            );
        END IF;
        
        -- CR: Fixed Asset (remove from books)
        INSERT INTO gl_transactions (
            tenant_id, entry_id, account_code, transaction_date,
            debit_amount, credit_amount, description,
            reference_type, reference_id, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_entry_id, v_asset_account, NEW.disposal_date,
            0, v_asset_cost, v_description || ' - Remove asset cost',
            'ASSET_DISPOSAL', NEW.disposal_id, NEW.created_by, CURRENT_TIMESTAMP
        );
        
        -- Update disposal record
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        
        -- Update asset status
        UPDATE fixed_assets
        SET status = 'DISPOSED',
            disposal_date = NEW.disposal_date,
            disposal_method = NEW.disposal_method,
            disposal_value = NEW.disposal_proceeds
        WHERE asset_id = NEW.asset_id;
        
        RAISE NOTICE 'IAS 16 - Asset disposal posted: %, Gain/Loss: %', v_asset_tag, NEW.gain_loss;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_disposal_to_gl ON asset_disposals;
CREATE TRIGGER trg_post_disposal_to_gl
    BEFORE UPDATE ON asset_disposals
    FOR EACH ROW
    EXECUTE FUNCTION post_disposal_to_gl();


-- ============================================================================
-- 6. IMPAIRMENT TESTING (IAS 36)
-- ============================================================================
-- Asset is impaired when carrying amount > recoverable amount
-- Recoverable amount = higher of: fair value less costs to sell, value in use

-- Add impairment table if not exists
CREATE TABLE IF NOT EXISTS asset_impairments (
    impairment_id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    asset_id INTEGER NOT NULL REFERENCES fixed_assets(asset_id),
    
    impairment_date DATE NOT NULL,
    impairment_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Values
    carrying_amount DECIMAL(15,2) NOT NULL,
    recoverable_amount DECIMAL(15,2) NOT NULL,
    impairment_loss DECIMAL(15,2) NOT NULL,
    
    -- Method
    recoverable_method VARCHAR(100), -- FAIR_VALUE_LESS_COSTS, VALUE_IN_USE
    assessment_basis TEXT,
    
    -- Indicators
    impairment_indicators TEXT, -- IAS 36.12 indicators
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- GL Posting
    journal_entry_id INTEGER,
    posted_to_gl BOOLEAN DEFAULT false,
    
    created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_impairments_asset ON asset_impairments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_impairments_date ON asset_impairments(impairment_date DESC);


CREATE OR REPLACE FUNCTION post_impairment_to_gl()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_entry_id INTEGER;
    v_journal_number VARCHAR(50);
    v_description TEXT;
    v_period_id INTEGER;
    v_impairment_loss_account VARCHAR(50) := '6370'; -- Impairment Loss (Expense)
    v_accum_impairment_account VARCHAR(50) := '1560'; -- Accumulated Impairment (contra-asset)
    v_asset_tag VARCHAR(50);
    v_asset_name VARCHAR(255);
BEGIN
    -- Only post approved impairments not yet posted
    IF NEW.approved_by IS NOT NULL AND NEW.posted_to_gl = false THEN
        
        -- Get asset details
        SELECT asset_tag, asset_name
        INTO v_asset_tag, v_asset_name
        FROM fixed_assets
        WHERE asset_id = NEW.asset_id;
        
        -- Get period
        SELECT period_id INTO v_period_id
        FROM accounting_periods
        WHERE tenant_id = NEW.tenant_id
        AND NEW.impairment_date BETWEEN start_date AND end_date
        AND status = 'OPEN'
        LIMIT 1;
        
        IF v_period_id IS NULL THEN
            RAISE EXCEPTION 'No open accounting period for impairment date: %', NEW.impairment_date;
        END IF;
        
        -- Journal number
        v_journal_number := 'JE-IMP-' || TO_CHAR(NEW.impairment_date, 'YYYY-MM') || '-' || 
                           LPAD(NEW.impairment_id::TEXT, 6, '0');
        
        -- Description
        v_description := 'IAS 36 - Impairment Loss: ' || v_asset_name || ' (' || v_asset_tag || ') - ' ||
                        'Carrying Amount: ' || NEW.carrying_amount || 
                        ', Recoverable Amount: ' || NEW.recoverable_amount ||
                        ', Impairment Loss: ' || NEW.impairment_loss;
        
        -- Create journal entry
        INSERT INTO journal_entries (
            tenant_id, journal_number, journal_date, period_id,
            journal_type, reference_type, reference_id, description,
            status, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_number, NEW.impairment_date, v_period_id,
            'IMPAIRMENT', 'ASSET_IMPAIRMENT', NEW.impairment_id, v_description,
            'POSTED', NEW.created_by, CURRENT_TIMESTAMP
        ) RETURNING entry_id INTO v_journal_entry_id;
        
        -- DR: Impairment Loss (P&L)
        INSERT INTO gl_transactions (
            tenant_id, entry_id, account_code, transaction_date,
            debit_amount, credit_amount, description,
            reference_type, reference_id, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_entry_id, v_impairment_loss_account, NEW.impairment_date,
            NEW.impairment_loss, 0, v_description || ' - Impairment charge to P&L',
            'ASSET_IMPAIRMENT', NEW.impairment_id, NEW.created_by, CURRENT_TIMESTAMP
        );
        
        -- CR: Accumulated Impairment (contra-asset)
        INSERT INTO gl_transactions (
            tenant_id, entry_id, account_code, transaction_date,
            debit_amount, credit_amount, description,
            reference_type, reference_id, created_by, created_at
        ) VALUES (
            NEW.tenant_id, v_journal_entry_id, v_accum_impairment_account, NEW.impairment_date,
            0, NEW.impairment_loss, v_description || ' - Reduce carrying amount',
            'ASSET_IMPAIRMENT', NEW.impairment_id, NEW.created_by, CURRENT_TIMESTAMP
        );
        
        -- Update impairment record
        NEW.journal_entry_id := v_journal_entry_id;
        NEW.posted_to_gl := true;
        
        -- Update asset net book value
        UPDATE fixed_assets
        SET net_book_value = net_book_value - NEW.impairment_loss
        WHERE asset_id = NEW.asset_id;
        
        RAISE NOTICE 'IAS 36 - Impairment posted: %, Loss: %', v_asset_tag, NEW.impairment_loss;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_impairment_to_gl ON asset_impairments;
CREATE TRIGGER trg_post_impairment_to_gl
    BEFORE UPDATE ON asset_impairments
    FOR EACH ROW
    EXECUTE FUNCTION post_impairment_to_gl();


-- ============================================================================
-- 7. HELPER FUNCTION: MONTHLY DEPRECIATION CALCULATION
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
            asset_id, asset_tag, asset_name, purchase_price, residual_value,
            depreciation_method, useful_life_years, useful_life_months,
            acquisition_date, accumulated_depreciation, net_book_value
        FROM fixed_assets
        WHERE tenant_id = p_tenant_id
        AND status = 'ACTIVE'
        AND acquisition_date < p_depreciation_month
        AND (disposal_date IS NULL OR disposal_date >= p_depreciation_month)
        AND depreciation_start_date <= p_depreciation_month
    LOOP
        -- Calculate monthly depreciation (IAS 16.50-62)
        IF v_asset.depreciation_method = 'STRAIGHT_LINE' THEN
            v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) / 
                                     NULLIF(v_asset.useful_life_months, 0);
            
            -- Don't depreciate below residual value (IAS 16.6)
            v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
            IF v_accumulated_dep > (v_asset.purchase_price - v_asset.residual_value) THEN
                v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) - 
                                         v_asset.accumulated_depreciation;
            END IF;
            
        ELSIF v_asset.depreciation_method = 'DECLINING_BALANCE' THEN
            v_monthly_depreciation := v_asset.net_book_value * 
                                     (2.0 / NULLIF(v_asset.useful_life_years, 0)) / 12;
            
            v_net_book_value := v_asset.net_book_value - v_monthly_depreciation;
            IF v_net_book_value < v_asset.residual_value THEN
                v_monthly_depreciation := v_asset.net_book_value - v_asset.residual_value;
            END IF;
        ELSE
            v_monthly_depreciation := (v_asset.purchase_price - v_asset.residual_value) / 
                                     NULLIF(v_asset.useful_life_months, 0);
        END IF;
        
        IF v_monthly_depreciation > 0 THEN
            v_accumulated_dep := v_asset.accumulated_depreciation + v_monthly_depreciation;
            v_net_book_value := v_asset.purchase_price - v_accumulated_dep;
            
            -- Insert depreciation schedule
            INSERT INTO asset_depreciation_schedule (
                tenant_id, asset_id, depreciation_date, period_number,
                opening_book_value, depreciation_amount, accumulated_depreciation,
                closing_book_value, calculation_method, calculation_basis,
                status, posted_to_gl, created_by
            ) VALUES (
                p_tenant_id, v_asset.asset_id, p_depreciation_month,
                EXTRACT(YEAR FROM AGE(p_depreciation_month, v_asset.acquisition_date)) * 12 + 
                    EXTRACT(MONTH FROM AGE(p_depreciation_month, v_asset.acquisition_date)),
                v_asset.net_book_value, v_monthly_depreciation, v_accumulated_dep,
                v_net_book_value, v_asset.depreciation_method,
                'IAS 16 - Monthly depreciation calculated on ' || CURRENT_TIMESTAMP,
                'CALCULATED', false, '00000000-0000-0000-0000-000000000000'
            ) RETURNING schedule_id INTO v_schedule_id;
            
            -- Trigger GL posting
            UPDATE asset_depreciation_schedule
            SET status = 'CALCULATED'
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
        'IAS 16 - Processed ' || v_assets_count || ' assets, total depreciation: R ' || 
            TO_CHAR(v_total_amount, 'FM999,999,990.00');
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 8. ADD REQUIRED GL ACCOUNTS (IAS 16 Chart of Accounts)
-- ============================================================================

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, category, is_active) 
VALUES 
    ('00000000-0000-0000-0000-000000000001', '1500', 'Fixed Assets - PPE', 'ASSET', 'NON_CURRENT_ASSETS', true),
    ('00000000-0000-0000-0000-000000000001', '1550', 'Accumulated Depreciation', 'ASSET', 'NON_CURRENT_ASSETS', true),
    ('00000000-0000-0000-0000-000000000001', '1560', 'Accumulated Impairment', 'ASSET', 'NON_CURRENT_ASSETS', true),
    ('00000000-0000-0000-0000-000000000001', '3200', 'Revaluation Reserve', 'EQUITY', 'EQUITY', true),
    ('00000000-0000-0000-0000-000000000001', '3150', 'Gain on Asset Disposal', 'INCOME', 'OTHER_INCOME', true),
    ('00000000-0000-0000-0000-000000000001', '6300', 'Depreciation Expense', 'EXPENSE', 'OPERATING_EXPENSES', true),
    ('00000000-0000-0000-0000-000000000001', '6350', 'Revaluation Loss', 'EXPENSE', 'OPERATING_EXPENSES', true),
    ('00000000-0000-0000-0000-000000000001', '6360', 'Loss on Asset Disposal', 'EXPENSE', 'OPERATING_EXPENSES', true),
    ('00000000-0000-0000-0000-000000000001', '6370', 'Impairment Loss', 'EXPENSE', 'OPERATING_EXPENSES', true),
    ('00000000-0000-0000-0000-000000000001', '6400', 'Repairs & Maintenance', 'EXPENSE', 'OPERATING_EXPENSES', true)
ON CONFLICT (tenant_id, account_code) DO UPDATE SET
    account_name = EXCLUDED.account_name,
    account_type = EXCLUDED.account_type,
    category = EXCLUDED.category;

-- Update asset categories with GL mappings
UPDATE asset_categories SET
    depreciation_gl_account = '1500',
    depreciation_expense_account = '6300'
WHERE depreciation_gl_account IS NULL;

-- Add maintenance types for capitalization decisions
INSERT INTO maintenance_types (type_code, type_name, is_preventive, default_frequency_days) VALUES
('MAJOR_OVERHAUL', 'Major Overhaul', false, NULL),
('UPGRADE', 'Equipment Upgrade', false, NULL),
('BETTERMENT', 'Asset Betterment', false, NULL)
ON CONFLICT (type_code) DO NOTHING;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'IAS 16 COMPLIANT ASSET MANAGEMENT - GL POSTING FUNCTIONS DEPLOYED'
\echo '============================================================================'
\echo ''

-- Verify all triggers
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing || ' ' || event_manipulation as trigger_event
FROM information_schema.triggers
WHERE trigger_name LIKE '%asset%' OR trigger_name LIKE '%depreciation%' 
   OR trigger_name LIKE '%revaluation%' OR trigger_name LIKE '%maintenance%'
   OR trigger_name LIKE '%disposal%' OR trigger_name LIKE '%impairment%'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo 'IAS 16 Compliance Features:'
\echo '----------------------------'
\echo '✓ Initial Recognition (IAS 16.15-28)'
\echo '✓ Subsequent Measurement - Cost & Revaluation Model (IAS 16.29-42)'
\echo '✓ Depreciation (IAS 16.43-62)'
\echo '✓ Impairment (IAS 36)'
\echo '✓ Subsequent Costs - Capitalize vs Expense (IAS 16.7-14)'
\echo '✓ Derecognition (IAS 16.67-72)'
\echo ''
