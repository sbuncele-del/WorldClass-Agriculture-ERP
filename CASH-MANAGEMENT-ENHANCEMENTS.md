# Cash Management Module - Enhancement Plan
## World-Class Features + Critical Missing Pieces

---

## 🎯 IMMEDIATE CRITICAL FIXES (Pain Points Solved)

### 1. **Multi-Line Matching (ONE-TO-MANY / MANY-TO-ONE)**
**Problem:** Current system only matches 1 bank line → 1 journal line
**Real World:** 
- Single bank deposit of R50,000 could be 10 customer payments
- Single bank payment of R125,000 could be 5 vendor invoices
- Batch salary payment vs individual salary entries

**Solution:**
```typescript
interface MultiLineMatch {
  statement_line_id: number;
  statement_amount: number;
  journal_lines: Array<{
    journal_entry_line_id: number;
    amount: number;
    percentage: number; // 40% of statement line
  }>;
  total_matched: number;
  difference: number;  // Unallocated amount
  match_type: 'SPLIT' | 'CONSOLIDATED';
}

// Algorithm:
// 1. Find multiple journal lines that SUM to statement amount (±tolerance)
// 2. Allow manual split: "This R50k deposit = Invoice A (R20k) + Invoice B (R30k)"
// 3. Track partial matches: "Matched R45k of R50k, R5k unallocated"
```

**Backend Enhancement:**
```typescript
// New endpoint
POST /api/cash-management/matches/multi-line
{
  "statement_line_id": 123,
  "journal_line_ids": [456, 789, 101],
  "amounts": [20000, 15000, 15000], // How much of each
  "match_type": "SPLIT"
}

// New matching algorithm
async findCombinationMatches(
  targetAmount: number,
  tolerance: number,
  availableLines: JournalLine[]
): Promise<MatchCombination[]> {
  // Dynamic programming: Find combinations that sum to target
  // Example: [10k, 15k, 20k, 25k] → Find subsets that = 50k
  // Result: [[20k, 30k], [10k, 15k, 25k]]
}
```

---

### 2. **Partial Reconciliation & Amount Differences**
**Problem:** Current system requires exact match
**Real World:**
- Bank charges deducted: Sent R10,000, bank shows R9,950 (R50 fee)
- Foreign exchange differences: Expected R18,500, received R18,350
- Rounding differences: R1,234.56 vs R1,234.60

**Solution:**
```typescript
interface PartialMatch {
  statement_line_id: number;
  journal_line_id: number;
  statement_amount: number;     // R9,950
  journal_amount: number;        // R10,000
  difference: number;            // R50
  difference_reason: string;     // "BANK_FEE" | "FX_DIFF" | "ROUNDING"
  auto_post_difference: boolean; // Create journal for R50?
  difference_account_code: string; // "6510" (Bank Charges)
}

// Auto-posting logic:
if (difference < 100 && difference_reason === 'BANK_FEE') {
  // Auto-create journal:
  DR Bank Charges (6510)     R50
  CR Bank Account            R50
  
  // Link both journals to same statement line
  // Status: RECONCILED_WITH_DIFFERENCE
}
```

**UI Enhancement:**
```
Statement Line: Payment to Supplier XYZ - R9,950 ❌ UNMATCHED
Suggested Match: Journal Entry #12345 - R10,000 ⚠️ DIFFERENCE: R50

[Accept with Difference ✓]  [Auto-post to: Bank Charges ▼]  [Reject ✗]

Explanation: _Bank deducted R50 transaction fee_________________
```

---

### 3. **Timing Differences & Date Range Flexibility**
**Problem:** Current ±3 days may miss legitimate matches
**Real World:**
- Month-end processing delays (payment on 30th, clears on 3rd)
- Public holidays (payment Friday, clears Tuesday)
- International transfers (sent Monday, received Thursday)

**Solution:**
```typescript
interface SmartDateMatching {
  // Adaptive date ranges based on transaction type
  payment_type_rules: {
    'EFT_LOCAL': { min_days: -1, max_days: 2 },
    'EFT_INTERNATIONAL': { min_days: -2, max_days: 5 },
    'CHEQUE': { min_days: 0, max_days: 7 },
    'CARD_PAYMENT': { min_days: 0, max_days: 3 },
    'MONTH_END': { min_days: -5, max_days: 5 }, // Auto-detect 28-31 dates
  },
  
  // Public holiday detection
  exclude_holidays: true,
  country_code: 'ZA',
  
  // Business days only
  business_days_only: boolean,
  
  // Predictive matching
  learn_from_history: {
    vendor_id: 'SUP123',
    typical_delay_days: 2, // This vendor always clears in 2 days
    confidence: 95
  }
}

// Enhanced algorithm:
async matchWithTimingTolerance(line: StatementLine) {
  // 1. Check exact date first (highest confidence)
  // 2. Expand by payment type rules
  // 3. If month-end (28-31), expand range more
  // 4. Learn patterns: "Supplier ABC always takes 3 days"
}
```

---

### 4. **Duplicate Detection & Prevention**
**Problem:** Users accidentally match same transaction twice
**Real World:**
- Same invoice paid from 2 bank accounts
- Statement imported twice
- Manual entry + auto-match both execute

**Solution:**
```typescript
interface DuplicateDetection {
  // Before creating match:
  async checkDuplicates(match: CreateMatchDto): Promise<{
    is_duplicate: boolean;
    existing_matches: Match[];
    warnings: string[];
  }> {
    
    // Check 1: Statement line already matched?
    const lineCheck = await query(`
      SELECT * FROM bank_reconciliation_matches
      WHERE bank_statement_line_id = $1 AND status = 'ACTIVE'
    `);
    
    if (lineCheck.rows.length > 0) {
      return { 
        is_duplicate: true,
        warnings: ['This bank line is already matched to another journal entry']
      };
    }
    
    // Check 2: Journal line already reconciled?
    const jeCheck = await query(`
      SELECT * FROM journal_entry_lines
      WHERE id = $1 AND is_reconciled = true
    `);
    
    if (jeCheck.rows.length > 0) {
      return {
        is_duplicate: true,
        warnings: ['This journal entry is already reconciled']
      };
    }
    
    // Check 3: Similar transaction in last 30 days?
    const similarCheck = await query(`
      SELECT * FROM bank_statement_lines
      WHERE payee_payer = $1 
      AND ABS(amount - $2) < 0.01
      AND transaction_date BETWEEN $3 AND $4
      AND id != $5
      AND status = 'MATCHED'
    `, [payee, amount, date_minus_30, date_plus_30, line_id]);
    
    if (similarCheck.rows.length > 0) {
      return {
        is_duplicate: false, // Not blocking, just warning
        warnings: [`Similar transaction already matched: ${similarCheck.rows[0].description}`]
      };
    }
  }
}

// UI Alert:
⚠️ WARNING: This journal entry is already reconciled!
   Previously matched to: Statement Line #789 (R10,000) on 2025-11-10
   
   [Force Override] [Cancel]
```

---

### 5. **Bulk/Batch Operations**
**Problem:** Reconciling 1,000 lines one-by-one is tedious
**Real World:**
- Month-end: 500+ transactions to reconcile
- Same-day multiple small transactions (card payments)
- Salary disbursements (50 employees)

**Solution:**
```typescript
// Bulk Auto-Match
POST /api/cash-management/statements/:id/bulk-auto-match
{
  "filters": {
    "date_from": "2025-11-01",
    "date_to": "2025-11-30",
    "min_amount": 0,
    "max_amount": 50000,
    "keywords": ["SALARY", "PAYROLL"]
  },
  "confidence_threshold": 85,
  "auto_post_differences": true,
  "max_difference_amount": 100
}

Response: {
  "processed": 500,
  "matched": 425,
  "suggestions": 50,
  "failed": 25,
  "execution_time_ms": 2500,
  "summary": {
    "by_rule": {
      "Salary Payments": 200,
      "Bank Fees": 150,
      "Invoice Payments": 75
    }
  }
}

// Bulk Accept Suggestions
POST /api/cash-management/matches/bulk-accept
{
  "suggestion_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "apply_rule_to_similar": true, // Learn and apply to similar unmatched lines
  "create_rule": {
    "name": "Auto-accept Card Payments",
    "apply": true
  }
}

// Bulk Unmatch (rollback)
POST /api/cash-management/matches/bulk-unmatch
{
  "match_ids": [100, 101, 102],
  "reason": "Wrong month-end postings"
}
```

**UI Enhancement:**
```
[✓] Select All Suggestions (15)
[✓] Suggestion #1: R5,000 - Supplier ABC (Confidence: 95%)
[✓] Suggestion #2: R3,200 - Supplier XYZ (Confidence: 92%)
[✓] Suggestion #3: R1,500 - Bank Fee (Confidence: 98%)
...

[Accept All Selected (15)] [Reject All] [Create Rule from Selection]
```

---

### 6. **Fuzzy Matching with Machine Learning**
**Problem:** Exact keyword matching misses variations
**Real World:**
- Bank shows: "FNB EFT PMT FROM ACME CORP"
- Journal shows: "Payment from Acme Corporation"
- Bank shows: "NEDBANK DEBIT ORDER TELKOM"
- Journal shows: "Telkom Internet Bill"

**Solution:**
```typescript
interface FuzzyMatchingEngine {
  // Levenshtein distance for text similarity
  calculateSimilarity(text1: string, text2: string): number {
    // "ACME CORP" vs "Acme Corporation" = 85% similar
    // "TELKOM" vs "Telkom Internet" = 90% similar
  }
  
  // Remove bank-specific prefixes/suffixes
  normalizeDescription(text: string): string {
    const noise = [
      'FNB EFT PMT FROM', 'NEDBANK DEBIT ORDER',
      'ABSA PAYMENT TO', 'STANDARD BANK TRANSFER',
      'REF:', 'PMT:', 'TRF:'
    ];
    
    let clean = text.toUpperCase();
    noise.forEach(n => clean = clean.replace(n, ''));
    return clean.trim();
  }
  
  // Learn from accepted matches
  async trainFromHistory() {
    // Build mapping:
    // "FNB EFT PMT FROM ACME" → "ACME CORP" (confidence: 98%)
    // "NEDBANK DEBIT ORDER TELKOM" → "TELKOM PTY LTD" (confidence: 95%)
    
    const history = await query(`
      SELECT bsl.description as bank_desc,
             je.description as journal_desc,
             COUNT(*) as frequency
      FROM bank_reconciliation_matches m
      JOIN bank_statement_lines bsl ON m.bank_statement_line_id = bsl.id
      JOIN journal_entries je ON m.journal_entry_id = je.id
      WHERE m.match_type = 'MANUAL' -- Learn from user corrections
      GROUP BY bank_desc, journal_desc
      HAVING COUNT(*) >= 3 -- Pattern must repeat 3+ times
    `);
    
    // Store patterns in reconciliation_rules table
    // Use for future matches
  }
  
  // Smart suggestions with alternatives
  async suggestWithAlternatives(line: StatementLine): Promise<{
    best_match: Match,
    alternatives: Match[],
    reasoning: string
  }> {
    // Return top 5 possible matches ranked by:
    // 1. Amount similarity (40%)
    // 2. Date proximity (20%)
    // 3. Description fuzzy match (30%)
    // 4. Historical pattern match (10%)
  }
}
```

---

### 7. **Three-Way Matching (Bank + GL + Source Document)**
**Problem:** Current system only matches Bank ↔ GL
**Real World:** Need to verify Bank ↔ GL ↔ Invoice/PO

**Solution:**
```typescript
interface ThreeWayMatch {
  statement_line: {
    id: 123,
    amount: 10000,
    description: "Payment to Supplier ABC"
  },
  journal_entry: {
    id: 456,
    amount: 10000,
    source_document: "PO-2025-001"
  },
  source_document: {
    type: "PURCHASE_ORDER",
    id: 789,
    number: "PO-2025-001",
    total: 10000,
    status: "AWAITING_PAYMENT"
  },
  
  verification: {
    bank_to_gl: true,     // ✓ Amounts match
    gl_to_source: true,   // ✓ PO linked to GL
    source_complete: true, // ✓ PO fully paid
    all_verified: true
  }
}

// Enhanced workflow:
Bank Line → Match to GL → Verify against PO → Mark PO as "PAID"

// Prevents:
// - Paying same invoice twice
// - Paying wrong amount
// - Missing audit trail
```

---

### 8. **Cash Flow Forecasting & Predictive Matching**
**Problem:** Reactive reconciliation (wait for bank statement)
**Real World:** Proactive cash management

**Solution:**
```typescript
interface PredictiveReconciliation {
  // Predict future bank transactions
  async predictUpcoming(): Promise<PredictedTransaction[]> {
    // Based on:
    // 1. Open invoices with due dates
    // 2. Recurring transactions (rent, salaries)
    // 3. Historical payment patterns
    // 4. Scheduled payments in system
    
    return [
      {
        predicted_date: '2025-11-20',
        payee: 'ABC Supplier',
        predicted_amount: 15000,
        source: 'Invoice #INV-2025-456 (Due: 2025-11-20)',
        confidence: 95,
        pre_match_ready: true // Will auto-match when appears
      },
      {
        predicted_date: '2025-11-25',
        payee: 'Landlord',
        predicted_amount: 50000,
        source: 'Recurring: Rent (every 25th)',
        confidence: 99,
        pre_match_ready: true
      }
    ];
  }
  
  // When statement imports:
  async matchAgainstPredictions(lines: StatementLine[]) {
    // If bank shows R15,000 to ABC on Nov 20
    // AND we predicted R15,000 to ABC on Nov 20
    // → Instant match (confidence: 99%)
  }
}
```

---

### 9. **Audit Trail & Compliance**
**Problem:** Who matched what when?
**Real World:** Audit requirements, SOX compliance

**Solution:**
```typescript
interface AuditTrail {
  match_id: number,
  actions: [
    {
      timestamp: '2025-11-16 14:30:00',
      user: 'john.doe@company.com',
      action: 'MATCH_CREATED',
      method: 'AUTO', // AUTO | MANUAL | SYSTEM
      confidence: 95,
      rule_applied: 'Supplier Payments Rule',
      ip_address: '192.168.1.100'
    },
    {
      timestamp: '2025-11-16 15:45:00',
      user: 'jane.smith@company.com',
      action: 'MATCH_REVIEWED',
      notes: 'Verified against PO-2025-001',
      approved: true
    },
    {
      timestamp: '2025-11-17 09:00:00',
      user: 'manager@company.com',
      action: 'MATCH_APPROVED',
      approval_level: 'MANAGER',
      final_approval: true
    }
  ],
  
  // Change tracking
  changes: [
    {
      timestamp: '2025-11-16 16:00:00',
      field: 'journal_entry_id',
      old_value: 456,
      new_value: 789,
      changed_by: 'john.doe@company.com',
      reason: 'Correction: wrong invoice'
    }
  ],
  
  // Deletion prevention
  can_delete: false,
  locked_after: '2025-11-30', // Period closed
  period_status: 'LOCKED'
}

// Approval workflow
interface ApprovalWorkflow {
  match_requires_approval: boolean,
  approval_rules: {
    amount_threshold: 50000, // >R50k needs manager
    approvers: ['manager@company.com', 'cfo@company.com'],
    levels: 2 // Requires 2 approvals
  }
}
```

---

### 10. **Mobile Bank Feed Integration (Real-Time)**
**Problem:** Waiting for monthly statements
**Real World:** Open Banking API, instant notifications

**Solution:**
```typescript
interface BankAPIIntegration {
  // South African banks with API support
  providers: {
    'FNB': {
      api_type: 'REST',
      auth: 'OAuth2',
      endpoints: {
        transactions: '/v1/accounts/{id}/transactions',
        balance: '/v1/accounts/{id}/balance'
      },
      polling_interval: 3600, // 1 hour
      supports_webhooks: false
    },
    'STANDARD_BANK': {
      api_type: 'REST',
      supports_webhooks: true,
      webhook_events: ['transaction.created', 'balance.updated']
    }
  },
  
  // Auto-import every hour
  async scheduledImport() {
    const accounts = await getBankAccountsWithAPI();
    
    for (const account of accounts) {
      const newTransactions = await fetchFromBank(account);
      
      // Immediately run auto-matching
      await importAndReconcile(newTransactions);
      
      // Notify user
      await sendNotification({
        title: '5 new transactions',
        message: '3 auto-matched, 2 need review',
        action_url: '/cash/reconciliation'
      });
    }
  }
}
```

---

## 🚀 WORLD-CLASS ERP FEATURES

### 11. **AI/ML-Powered Matching**
From SAP S/4HANA, Oracle Cloud:

```typescript
// Machine learning model trains on:
// - Historical matches (95% accurate)
// - User corrections (learn from mistakes)
// - Cross-company patterns (anonymized)

interface MLMatchingEngine {
  model_version: '2.0',
  training_data: {
    matches: 50000,
    accuracy: 0.95,
    last_trained: '2025-11-15'
  },
  
  features: [
    'amount_similarity',
    'date_proximity',
    'description_embedding', // NLP vector
    'payee_entity_resolution', // "ABC Corp" = "ABC Corporation"
    'seasonal_patterns', // Rent always on 25th
    'vendor_behavior', // Supplier X always 3 days late
  ],
  
  prediction: {
    match_probability: 0.98,
    estimated_confidence: 96,
    alternative_matches: [
      { id: 456, probability: 0.98 },
      { id: 789, probability: 0.45 },
      { id: 101, probability: 0.12 }
    ]
  }
}
```

---

### 12. **Exception Management Dashboard**
From NetSuite, Dynamics 365:

```typescript
interface ExceptionDashboard {
  categories: {
    'HIGH_VALUE_UNMATCHED': {
      count: 5,
      total_amount: 500000,
      items: [
        {
          id: 123,
          amount: 250000,
          age_days: 15,
          description: 'Large supplier payment',
          risk_level: 'HIGH',
          assigned_to: 'john.doe@company.com'
        }
      ]
    },
    'OLD_UNMATCHED': {
      count: 12,
      total_amount: 45000,
      items: [] // > 30 days old
    },
    'AMOUNT_MISMATCH': {
      count: 8,
      total_amount: 12000,
      items: [] // Potential matches with differences
    },
    'DUPLICATE_SUSPECTED': {
      count: 3,
      items: [] // Similar transactions flagged
    }
  },
  
  workflow: {
    assign_reviewer: true,
    escalation_rules: [
      {
        condition: 'amount > 100000 AND age > 7 days',
        action: 'escalate_to_manager',
        notify: ['manager@company.com']
      }
    ]
  }
}
```

---

### 13. **Multi-Currency & FX Matching**
From Oracle Financials, SAP:

```typescript
interface FXReconciliation {
  statement_line: {
    currency: 'USD',
    amount: 10000,
    bank_fx_rate: 18.50,
    zar_equivalent: 185000
  },
  
  journal_entry: {
    currency: 'USD',
    amount: 10000,
    system_fx_rate: 18.45, // Rate on posting date
    zar_equivalent: 184500
  },
  
  fx_difference: {
    amount: 500, // R500 difference
    reason: 'FX_RATE_VARIANCE',
    bank_rate: 18.50,
    system_rate: 18.45,
    difference_rate: 0.05,
    
    // Auto-post FX gain/loss
    journal: {
      DR Bank Account    R185,000
      CR Receivable            R184,500
      CR FX Gain               R500
    }
  }
}
```

---

### 14. **Reconciliation Templates & Blueprints**
From Best Practices:

```typescript
interface ReconciliationTemplate {
  name: 'Month-End Bank Rec Template',
  steps: [
    {
      step: 1,
      name: 'Import all bank statements',
      action: 'IMPORT',
      automated: true
    },
    {
      step: 2,
      name: 'Run auto-matching (>90% confidence)',
      action: 'AUTO_MATCH',
      settings: { confidence_threshold: 90 },
      automated: true
    },
    {
      step: 3,
      name: 'Review exceptions (>R50,000)',
      action: 'MANUAL_REVIEW',
      filters: { min_amount: 50000 },
      assigned_to: 'senior.accountant@company.com'
    },
    {
      step: 4,
      name: 'Approve reconciliation',
      action: 'APPROVAL',
      approver: 'controller@company.com',
      automated: false
    },
    {
      step: 5,
      name: 'Lock period',
      action: 'LOCK_PERIOD',
      automated: true
    }
  ],
  
  schedule: {
    frequency: 'MONTHLY',
    day_of_month: 5, // 5th of each month
    auto_execute: true
  }
}
```

---

### 15. **Bank Reconciliation Statement (BRS) Report**
Standard accounting requirement:

```typescript
interface BRSReport {
  report_date: '2025-11-16',
  bank_account: 'FNB Business - 62123456789',
  
  balance_per_bank_statement: 125000,
  
  add_outstanding_deposits: [
    { date: '2025-11-14', ref: 'DEP-001', amount: 15000 },
    { date: '2025-11-15', ref: 'DEP-002', amount: 8000 }
  ],
  total_outstanding_deposits: 23000,
  
  less_outstanding_cheques: [
    { date: '2025-11-10', ref: 'CHQ-456', amount: 12000 },
    { date: '2025-11-12', ref: 'CHQ-457', amount: 5500 }
  ],
  total_outstanding_cheques: 17500,
  
  less_bank_charges_not_in_books: 350,
  add_interest_not_in_books: 125,
  
  balance_per_cash_book: 130275,
  
  // Verification
  reconciled: true,
  unmatched_items: 0,
  variance: 0
}
```

---

## 📊 IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Week 1)
1. ✅ Multi-line matching
2. ✅ Partial reconciliation with differences
3. ✅ Duplicate detection
4. ✅ Bulk operations

### Phase 2: Enhanced Matching (Week 2)
5. ✅ Fuzzy matching with normalization
6. ✅ Smart date tolerance
7. ✅ Exception dashboard
8. ✅ Audit trail

### Phase 3: Advanced Features (Week 3)
9. ✅ Three-way matching
10. ✅ Predictive reconciliation
11. ✅ Multi-currency FX handling
12. ✅ BRS report generation

### Phase 4: Automation (Week 4)
13. ✅ Bank API integration
14. ✅ ML-powered matching
15. ✅ Reconciliation templates
16. ✅ Approval workflows

---

## 💡 QUICK WINS (Implement Today)

1. **Increase date tolerance to ±7 days** (easy config change)
2. **Add amount tolerance setting** (currently fixed at R0.01)
3. **Show match reasons in UI** (already in backend!)
4. **Bulk accept suggestions button** (frontend only)
5. **Export unmatched items to Excel** (simple report)

---

This plan addresses both **enterprise-grade features** from SAP/Oracle/NetSuite AND **real-world pain points** that smaller ERPs miss. Every feature solves actual accounting problems.
