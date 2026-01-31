-- Subscription Management Extensions for Multi-Tenant Schema
-- Add additional columns for subscription management

-- Add pending plan changes
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pending_plan_change VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pending_plan_change_date TIMESTAMP;

-- Add cancellation tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add auto-renewal flag
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Add Stripe customer ID for subscription management
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add next billing date tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;

-- Add subscription amount and currency
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_amount DECIMAL(15,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_currency VARCHAR(3) DEFAULT 'ZAR';

-- Add billing cycle
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';

-- Create index for pending changes
CREATE INDEX IF NOT EXISTS idx_tenants_pending_changes 
ON tenants(pending_plan_change_date) 
WHERE pending_plan_change IS NOT NULL;

-- Create index for expiring subscriptions
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_expiry 
ON tenants(subscription_ends_at) 
WHERE subscription_status = 'active';

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_customer 
ON tenants(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN tenants.pending_plan_change IS 'Plan to switch to at end of billing period';
COMMENT ON COLUMN tenants.pending_plan_change_date IS 'Date when plan change will take effect';
COMMENT ON COLUMN tenants.cancel_at_period_end IS 'Whether subscription is scheduled for cancellation';
COMMENT ON COLUMN tenants.cancellation_reason IS 'Reason provided for cancellation';
COMMENT ON COLUMN tenants.auto_renew IS 'Whether subscription should auto-renew';
COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe customer ID for payment management';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN tenants.next_billing_date IS 'Date of next billing charge';
COMMENT ON COLUMN tenants.subscription_amount IS 'Subscription amount charged';
COMMENT ON COLUMN tenants.subscription_currency IS 'Currency for subscription (ZAR or USD)';
COMMENT ON COLUMN tenants.billing_cycle IS 'Billing frequency (monthly or annual)';
