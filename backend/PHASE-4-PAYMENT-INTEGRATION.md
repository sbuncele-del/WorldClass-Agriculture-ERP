# Phase 4: Payment Gateway Integration - IN PROGRESS

## Overview
Implementing dual payment gateway system to support both South African (Ozow) and international (Stripe) customers with intelligent routing based on tenant country.

## Status: 80% Complete

### ✅ Completed Components

#### 1. Ozow Payment Service (`services/ozow-payment.service.ts`)
- **Purpose**: South African payment gateway integration
- **Lines**: 427 lines
- **Key Features**:
  - SHA-512 hash generation and verification
  - Payment request generation with Ozow URL
  - Webhook notification handling
  - Transaction status tracking
  - Subscription activation
  - Payment history
  - ZAR pricing: R499/R1,999/R4,999 monthly, R4,990/R19,990/R49,990 annually

**Methods**:
```typescript
createPaymentRequest()     // Generate Ozow payment URL
handleNotification()       // Process webhooks
verifyNotificationHash()   // Security: SHA-512 verification
activateSubscription()     // Activate tenant after payment
getPaymentStatus()         // Query transaction status
getPaymentHistory()        // List tenant payments
cancelPayment()            // Cancel pending payment
getPlanPricing()           // Get ZAR pricing
isConfigured()             // Check if credentials are set
```

**Security**:
- SHA-512 hash verification on all webhooks
- Private key never exposed to client
- Transaction-safe database operations
- Audit logging

#### 2. Stripe Payment Service (`services/stripe-payment.service.ts`)
- **Purpose**: International payment gateway + SA fallback
- **Lines**: 520+ lines
- **Key Features**:
  - Stripe Checkout Session creation
  - Recurring subscription management
  - Webhook event handling (5 event types)
  - Customer management
  - Invoice handling
  - Failed payment recovery
  - USD pricing: $29/$99/$249 monthly, $290/$990/$2,490 annually

**Methods**:
```typescript
createCheckoutSession()              // Create Stripe payment session
handleWebhook()                      // Main webhook dispatcher
handleCheckoutCompleted()            // Process successful checkout
handleInvoicePaymentSucceeded()      // Handle renewals
handleInvoicePaymentFailed()         // Handle failed payments
handleSubscriptionUpdated()          // Sync subscription changes
handleSubscriptionDeleted()          // Handle cancellations
getOrCreateStripeCustomer()          // Customer management
cancelSubscription()                 // Cancel at period end
getPlanPricing()                     // Get USD pricing
isConfigured()                       // Check if keys are set
```

**Webhook Events Handled**:
- `checkout.session.completed` - Initial payment success
- `invoice.payment_succeeded` - Recurring payment success
- `invoice.payment_failed` - Payment failure
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellations

#### 3. Payment Controller (`controllers/payment.controller.ts`)
- **Purpose**: HTTP endpoint handlers
- **Lines**: 200+ lines
- **Endpoints**:

```typescript
POST   /api/payment/create-session
GET    /api/payment/status/:reference
GET    /api/payment/history
POST   /api/payment/cancel/:reference
GET    /api/payment/pricing
```

**Features**:
- Smart gateway selection (Ozow for ZA, Stripe for others)
- Plan validation (starter/professional/enterprise)
- Billing cycle validation (monthly/annual)
- Tenant access control
- Comprehensive error handling (400/401/403/404/500/503)

#### 4. Webhook Controller (`controllers/webhook.controller.ts`)
- **Purpose**: Handle payment gateway callbacks
- **Lines**: 70 lines
- **Endpoints**:

```typescript
POST   /api/webhooks/ozow     // Ozow notifications
POST   /api/webhooks/stripe   // Stripe events
```

**Features**:
- Always returns 200 OK (prevents retries)
- Logs all webhook activity
- Error handling (logs errors but doesn't fail)

#### 5. Routes
- **Payment Routes** (`routes/payment.routes.ts`): 30 lines
  - All payment endpoints
  - Tenant middleware on protected routes
  - Public pricing endpoint

- **Webhook Routes** (`routes/webhook.routes.ts`): 20 lines
  - Public webhook endpoints (no authentication)
  - Registered before express.json() for Stripe raw body

#### 6. Express Integration
- **File**: `src/index.ts`
- **Changes**:
  - Added raw body parser for Stripe webhook signature verification
  - Registered payment routes: `/api/payment`
  - Registered webhook routes: `/api/webhooks`
  - Proper middleware ordering (raw parser before JSON parser)

#### 7. Environment Configuration
- **File**: `.env.example`
- **Added Variables**:

```bash
# Ozow (South Africa)
OZOW_SITE_CODE=your_site_code
OZOW_PRIVATE_KEY=your_private_key
OZOW_API_KEY=your_api_key
OZOW_BASE_URL=https://pay.ozow.com
OZOW_IS_TEST=true

# Stripe (International)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URLs
APP_URL=http://localhost:5173
API_URL=http://localhost:3000
```

#### 8. TypeScript Types
- **File**: `types/index.ts`
- **Updates**:
  - Added `country` to TenantSettings
  - Added `first_name` and `last_name` to user object
  - Enables smart gateway routing

### 🔄 Pending Components (20% Remaining)

#### 1. Subscription Management Service
**File**: `services/subscription.service.ts` (NOT CREATED YET)

**Required Methods**:
```typescript
getCurrentSubscription(tenantId)      // Get active subscription
upgradePlan(tenantId, newPlan)        // Upgrade immediately
downgradePlan(tenantId, newPlan)      // Downgrade at period end
cancelSubscription(tenantId, reason)  // Cancel at period end
reactivateSubscription(tenantId)      // Undo cancellation
updatePaymentMethod(tenantId)         // Switch gateways
checkSubscriptionStatus(tenantId)     // Verify active status
updateTenantLimits(tenantId, plan)    // Update max_users, storage
```

**Purpose**: Manage subscription lifecycle, upgrades, downgrades, cancellations

#### 2. Billing & Invoicing Service
**File**: `services/invoice.service.ts` (NOT CREATED YET)

**Required Methods**:
```typescript
generateInvoice(tenantId, amount)     // Create PDF invoice
storeInvoiceS3(pdf, tenantId)         // Upload to S3
sendInvoiceEmail(tenantId, url)       // Email with attachment
getInvoiceHistory(tenantId)           // List all invoices
downloadInvoice(tenantId, invoiceId)  // Get signed S3 URL
markInvoicePaid(invoiceId, txnId)     // Update status
handleFailedPayment(invoiceId)        // Retry logic
```

**Database Table Needed**:
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  invoice_number VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  s3_url TEXT,
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);
```

#### 3. Subscription Controller & Routes
**Files**: 
- `controllers/subscription.controller.ts` (NOT CREATED YET)
- `routes/subscription.routes.ts` (NOT CREATED YET)

**Required Endpoints**:
```typescript
GET    /api/subscription              // Current subscription details
POST   /api/subscription/upgrade      // Upgrade plan
POST   /api/subscription/downgrade    // Downgrade plan
POST   /api/subscription/cancel       // Cancel subscription
POST   /api/subscription/reactivate   // Undo cancellation
PUT    /api/subscription/payment      // Update payment method
```

#### 4. Testing & Documentation
**Files**: 
- `PHASE-4-TESTING.md` (NOT CREATED YET)
- `PHASE-4-COMPLETE.md` (NOT CREATED YET)

**Testing Requirements**:
- Test Ozow payment flow (requires test account)
- Test Stripe payment flow (test mode)
- Test webhook handling (Stripe CLI or ngrok)
- Test subscription activation
- Test failed payments
- Test cancellations
- Test upgrades/downgrades

## Architecture

### Payment Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     User Selects Plan                        │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│          POST /api/payment/create-session                    │
│          {plan, billingCycle, paymentMethod}                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              Gateway Selection Logic                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ IF tenant.country === 'ZA' && Ozow configured          │  │
│  │   THEN use Ozow                                         │  │
│  │ ELSE                                                    │  │
│  │   THEN use Stripe                                       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │  Ozow    │      │  Stripe  │
    │ Payment  │      │ Checkout │
    └────┬─────┘      └────┬─────┘
         │                 │
         │                 │
    User completes     User completes
    payment on Ozow    payment on Stripe
         │                 │
         ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ Webhook  │      │ Webhook  │
    │ Callback │      │ Callback │
    └────┬─────┘      └────┬─────┘
         │                 │
         └────────┬────────┘
                  ▼
┌──────────────────────────────────────────────────────────────┐
│          Subscription Activation                             │
│  1. Verify payment transaction                               │
│  2. Update tenant: subscription_status = 'active'            │
│  3. Set subscription_ends_at (30 days or 365 days)           │
│  4. Store payment in payment_transactions                    │
│  5. Generate invoice (TODO)                                  │
│  6. Send confirmation email (TODO)                           │
└──────────────────────────────────────────────────────────────┘
```

### Smart Gateway Routing

```typescript
function selectGateway(tenant: Tenant): 'ozow' | 'stripe' {
  const country = tenant.settings?.country || 'ZA';
  
  if (country === 'ZA' && OzowPaymentService.isConfigured()) {
    return 'ozow';  // Primary for South Africa
  }
  
  return 'stripe';  // Fallback or international
}
```

**Routing Logic**:
1. **South African tenants**: Ozow (if configured), otherwise Stripe
2. **International tenants**: Always Stripe
3. **Configuration check**: Falls back to Stripe if Ozow not configured

### Webhook Security

#### Ozow Webhook Verification
```typescript
// Hash calculation (SHA-512)
const hashString = [
  SiteCode, TransactionId, TransactionReference,
  Amount, Status, '', '', '', '', '',
  CurrencyCode, IsTest, '', PrivateKey
].join('').toLowerCase();

const calculatedHash = createHash('sha512')
  .update(hashString)
  .digest('hex')
  .toLowerCase();

if (calculatedHash !== receivedHash) {
  throw new Error('Invalid hash - webhook rejected');
}
```

#### Stripe Webhook Verification
```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  rawBody,           // MUST be raw buffer
  signature,         // From header
  WEBHOOK_SECRET     // From Stripe Dashboard
);

// Event is verified and safe to process
```

## Pricing Structure

### South Africa (Ozow - ZAR)
| Plan         | Monthly | Annual    | Savings   |
|--------------|---------|-----------|-----------|
| Starter      | R499    | R4,990    | 2 months  |
| Professional | R1,999  | R19,990   | 2 months  |
| Enterprise   | R4,999  | R49,990   | 2 months  |

### International (Stripe - USD)
| Plan         | Monthly | Annual  | Savings   |
|--------------|---------|---------|-----------|
| Starter      | $29     | $290    | 2 months  |
| Professional | $99     | $990    | 2 months  |
| Enterprise   | $249    | $2,490  | 2 months  |

## Configuration Guide

### Ozow Setup
1. **Apply for account**: https://www.ozow.com/
2. **Wait for approval**: 2-7 business days
3. **Receive credentials**:
   - Site Code
   - Private Key (CRITICAL - never expose)
   - API Key
4. **Add to .env**:
   ```bash
   OZOW_SITE_CODE=your_site_code
   OZOW_PRIVATE_KEY=your_private_key
   OZOW_API_KEY=your_api_key
   OZOW_IS_TEST=true
   ```
5. **Configure webhook URL** in Ozow dashboard:
   - URL: `https://yourdomain.com/api/webhooks/ozow`
   - Method: POST

### Stripe Setup
1. **Create account**: https://dashboard.stripe.com/
2. **Get API keys**:
   - Dashboard → Developers → API Keys
   - Copy "Secret key" (starts with `sk_test_` or `sk_live_`)
3. **Get webhook secret**:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: checkout.session.completed, invoice.*, customer.subscription.*
   - Copy "Signing secret" (starts with `whsec_`)
4. **Add to .env**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing

### Test with Stripe (Immediate)
```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 4. Use test card numbers
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Test with Ozow (Requires Application Approval)
```bash
# Once approved, Ozow provides test credentials
# Set OZOW_IS_TEST=true in .env
# Use Ozow test payment page to complete transactions
```

## Next Steps

### Immediate (Complete Phase 4)
1. ✅ Create subscription management service
2. ✅ Create billing & invoicing service
3. ✅ Create subscription controller & routes
4. ✅ Create invoices database table
5. ✅ Test payment flows
6. ✅ Write comprehensive testing guide
7. ✅ Document Phase 4 completion

### Future (Phase 5+)
1. Frontend billing dashboard UI
2. Payment history UI
3. Plan comparison page
4. Upgrade/downgrade UI
5. Email notifications for payments
6. Failed payment retry logic
7. Dunning management
8. Usage-based billing

## API Reference

### Create Payment Session
```http
POST /api/payment/create-session
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "plan": "professional",
  "billingCycle": "annual",
  "paymentMethod": "auto"
}

Response 200:
{
  "gateway": "ozow",
  "paymentUrl": "https://pay.ozow.com?...",
  "transactionReference": "PAY-20241110-ABC123",
  "amount": 19990,
  "currency": "ZAR"
}
```

### Get Payment Status
```http
GET /api/payment/status/PAY-20241110-ABC123
Authorization: Bearer {JWT_TOKEN}

Response 200:
{
  "reference": "PAY-20241110-ABC123",
  "status": "completed",
  "amount": 19990,
  "currency": "ZAR",
  "gateway": "ozow",
  "paidAt": "2024-11-10T10:30:00Z"
}
```

### Get Payment History
```http
GET /api/payment/history
Authorization: Bearer {JWT_TOKEN}

Response 200:
{
  "payments": [
    {
      "reference": "PAY-20241110-ABC123",
      "amount": 19990,
      "currency": "ZAR",
      "status": "completed",
      "createdAt": "2024-11-10T10:25:00Z",
      "paidAt": "2024-11-10T10:30:00Z"
    }
  ]
}
```

### Get Pricing
```http
GET /api/payment/pricing

Response 200:
{
  "currency": "ZAR",
  "plans": {
    "starter": {
      "monthly": 499,
      "annual": 4990
    },
    "professional": {
      "monthly": 1999,
      "annual": 19990
    },
    "enterprise": {
      "monthly": 4999,
      "annual": 49990
    }
  }
}
```

## Files Created/Modified

### New Files (6)
1. `services/ozow-payment.service.ts` - 427 lines
2. `services/stripe-payment.service.ts` - 520 lines
3. `controllers/payment.controller.ts` - 200 lines
4. `controllers/webhook.controller.ts` - 70 lines
5. `routes/payment.routes.ts` - 30 lines
6. `routes/webhook.routes.ts` - 20 lines

### Modified Files (3)
1. `src/index.ts` - Added routes, raw body parser
2. `.env.example` - Added payment gateway variables
3. `types/index.ts` - Added country and name fields

**Total**: 1,267+ lines of payment infrastructure code

---

**Phase 4 Status**: 80% Complete  
**Next Phase**: Complete subscription management and billing services  
**Estimated Time to Complete**: 4-6 hours  
**Blocked By**: None - ready to continue
