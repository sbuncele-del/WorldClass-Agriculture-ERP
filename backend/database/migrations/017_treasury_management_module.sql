-- ================================================
-- Treasury Management Module
-- ================================================
-- Comprehensive treasury operations and cash management
-- Tables: 12
-- ================================================

-- Treasury Accounts
CREATE TABLE IF NOT EXISTS treasury_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- OPERATING, SAVINGS, INVESTMENT, FX
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    current_balance DECIMAL(20,2) DEFAULT 0,
    available_balance DECIMAL(20,2) DEFAULT 0,
    overdraft_limit DECIMAL(20,2) DEFAULT 0,
    interest_rate DECIMAL(5,4),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasury_accounts_tenant ON treasury_accounts(tenant_id);

-- Cash Forecasting
CREATE TABLE IF NOT EXISTS cash_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    opening_balance DECIMAL(20,2) NOT NULL,
    projected_inflows DECIMAL(20,2) DEFAULT 0,
    projected_outflows DECIMAL(20,2) DEFAULT 0,
    projected_balance DECIMAL(20,2) NOT NULL,
    actual_inflows DECIMAL(20,2),
    actual_outflows DECIMAL(20,2),
    actual_balance DECIMAL(20,2),
    variance DECIMAL(20,2),
    confidence_level VARCHAR(20), -- HIGH, MEDIUM, LOW
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_forecasts_tenant ON cash_forecasts(tenant_id);
CREATE INDEX idx_cash_forecasts_date ON cash_forecasts(forecast_date);

-- Investments
CREATE TABLE IF NOT EXISTS investments (
    investment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    investment_code VARCHAR(50) UNIQUE NOT NULL,
    investment_name VARCHAR(255) NOT NULL,
    investment_type VARCHAR(50) NOT NULL, -- FIXED_DEPOSIT, MONEY_MARKET, BONDS, EQUITIES
    provider VARCHAR(255),
    principal_amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    interest_rate DECIMAL(5,4),
    start_date DATE NOT NULL,
    maturity_date DATE,
    current_value DECIMAL(20,2),
    accrued_interest DECIMAL(20,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, MATURED, LIQUIDATED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investments_tenant ON investments(tenant_id);

-- Bank Integrations
CREATE TABLE IF NOT EXISTS bank_integrations (
    integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(50) NOT NULL, -- OPEN_BANKING, SCRAPING, MANUAL
    account_id UUID REFERENCES treasury_accounts(account_id),
    api_credentials JSONB,
    last_sync_at TIMESTAMP,
    sync_frequency VARCHAR(50) DEFAULT 'DAILY',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_integrations_tenant ON bank_integrations(tenant_id);

-- Treasury Transactions
CREATE TABLE IF NOT EXISTS treasury_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES treasury_accounts(account_id),
    transaction_date TIMESTAMP NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER, INTEREST, FEE
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reference_number VARCHAR(100),
    counterparty VARCHAR(255),
    description TEXT,
    balance_after DECIMAL(20,2),
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasury_transactions_tenant ON treasury_transactions(tenant_id);
CREATE INDEX idx_treasury_transactions_account ON treasury_transactions(account_id);
CREATE INDEX idx_treasury_transactions_date ON treasury_transactions(transaction_date);

-- FX Rates
CREATE TABLE IF NOT EXISTS fx_rates (
    rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    rate_date DATE NOT NULL,
    source VARCHAR(100), -- CENTRAL_BANK, MARKET, MANUAL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fx_rates_currencies ON fx_rates(base_currency, target_currency);
CREATE INDEX idx_fx_rates_date ON fx_rates(rate_date);

-- Cash Position (Daily Summary)
CREATE TABLE IF NOT EXISTS cash_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    position_date DATE NOT NULL,
    total_cash DECIMAL(20,2) NOT NULL,
    total_investments DECIMAL(20,2) DEFAULT 0,
    total_liquidity DECIMAL(20,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cash_positions_tenant ON cash_positions(tenant_id);
CREATE INDEX idx_cash_positions_date ON cash_positions(position_date);

-- Bank Reconciliation
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    reconciliation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES treasury_accounts(account_id),
    reconciliation_date DATE NOT NULL,
    statement_balance DECIMAL(20,2) NOT NULL,
    book_balance DECIMAL(20,2) NOT NULL,
    unreconciled_items JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, RECONCILED
    reconciled_by UUID,
    reconciled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_reconciliations_tenant ON bank_reconciliations(tenant_id);
CREATE INDEX idx_bank_reconciliations_account ON bank_reconciliations(account_id);

-- Payment Orders
CREATE TABLE IF NOT EXISTS payment_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES treasury_accounts(account_id),
    payment_type VARCHAR(50) NOT NULL, -- EFT, WIRE, ACH, CHECK
    beneficiary_name VARCHAR(255) NOT NULL,
    beneficiary_account VARCHAR(100),
    amount DECIMAL(20,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_date DATE NOT NULL,
    reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, EXECUTED, REJECTED
    created_by UUID,
    approved_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_orders_tenant ON payment_orders(tenant_id);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);

-- Liquidity Ratios
CREATE TABLE IF NOT EXISTS liquidity_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    current_ratio DECIMAL(10,4),
    quick_ratio DECIMAL(10,4),
    cash_ratio DECIMAL(10,4),
    working_capital DECIMAL(20,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_liquidity_metrics_tenant ON liquidity_metrics(tenant_id);

-- Investment Returns
CREATE TABLE IF NOT EXISTS investment_returns (
    return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id UUID NOT NULL REFERENCES investments(investment_id),
    return_date DATE NOT NULL,
    return_amount DECIMAL(20,2) NOT NULL,
    return_type VARCHAR(50) NOT NULL, -- INTEREST, DIVIDEND, CAPITAL_GAIN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investment_returns_investment ON investment_returns(investment_id);

-- Treasury Reports Configuration
CREATE TABLE IF NOT EXISTS treasury_report_configs (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- PRE-POPULATED DATA
-- ================================================

-- Sample Treasury Account Types and Common Currencies
INSERT INTO fx_rates (base_currency, target_currency, rate, rate_date, source) VALUES
('ZAR', 'USD', 0.054, CURRENT_DATE, 'MARKET'),
('ZAR', 'EUR', 0.050, CURRENT_DATE, 'MARKET'),
('ZAR', 'GBP', 0.043, CURRENT_DATE, 'MARKET'),
('USD', 'ZAR', 18.50, CURRENT_DATE, 'MARKET'),
('EUR', 'ZAR', 19.80, CURRENT_DATE, 'MARKET'),
('GBP', 'ZAR', 23.20, CURRENT_DATE, 'MARKET')
ON CONFLICT DO NOTHING;

-- ================================================
-- COMPLETION
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Treasury Management Module Schema Created!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tables: 12';
    RAISE NOTICE '  - treasury_accounts (bank accounts)';
    RAISE NOTICE '  - cash_forecasts (cash flow planning)';
    RAISE NOTICE '  - investments (portfolio management)';
    RAISE NOTICE '  - bank_integrations (API connections)';
    RAISE NOTICE '  - treasury_transactions (all movements)';
    RAISE NOTICE '  - fx_rates (currency exchange)';
    RAISE NOTICE '  - cash_positions (daily summary)';
    RAISE NOTICE '  - bank_reconciliations';
    RAISE NOTICE '  - payment_orders';
    RAISE NOTICE '  - liquidity_metrics';
    RAISE NOTICE '  - investment_returns';
    RAISE NOTICE '  - treasury_report_configs';
    RAISE NOTICE '';
    RAISE NOTICE 'FX Rates: 6 currency pairs loaded';
    RAISE NOTICE '==================================================';
END $$;
