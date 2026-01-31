# SiyaBusa ERP - Financial Module Training

## Complete Training Guide for Finance Teams

---

## Training Overview

**Duration:** 4-6 hours  
**Prerequisites:** Getting Started Guide completed  
**Certification:** Financial Module Specialist  
**Assessment:** 40 questions, 80% to pass

---

## Module 1: Chart of Accounts (45 minutes)

### Learning Objectives
By the end of this module, you will be able to:
- Navigate the Chart of Accounts
- Create, edit, and deactivate accounts
- Understand account types and their purpose
- Set up account hierarchies

---

### 1.1 Understanding the Chart of Accounts

**What is a Chart of Accounts?**

The Chart of Accounts (COA) is the backbone of your financial system. It's a complete list of every account used to record transactions.

**Account Types in SiyaBusa:**

| Type | Description | Normal Balance | Examples |
|:-----|:------------|:---------------|:---------|
| **Asset** | What you own | Debit | Bank, Debtors, Equipment |
| **Liability** | What you owe | Credit | Creditors, Loans, VAT |
| **Equity** | Owner's stake | Credit | Share Capital, Retained Earnings |
| **Revenue** | Income earned | Credit | Sales, Interest, Fees |
| **Expense** | Costs incurred | Debit | Salaries, Rent, Utilities |

### 1.2 Navigating the Chart of Accounts

**Step-by-Step:**

1. Click **Financial** in the side menu
2. Click **Setup** → **Chart of Accounts**
3. You'll see a hierarchical list of all accounts

**Understanding the Display:**

```
Assets (1000-1999)
├── Current Assets (1000-1499)
│   ├── 1000 - Bank - FNB Main Account
│   ├── 1100 - Petty Cash
│   ├── 1200 - Trade Debtors Control
│   └── 1300 - Inventory
├── Non-Current Assets (1500-1999)
│   ├── 1500 - Property
│   ├── 1600 - Equipment
│   └── 1700 - Vehicles
```

### 1.3 Creating a New Account

**When to Create New Accounts:**
- New bank account opened
- New expense category needed
- New revenue stream started
- Regulatory requirement

**Step-by-Step:**

1. Navigate to Chart of Accounts
2. Click **+ Add Account**
3. Complete the form:

| Field | Required | Description |
|:------|:---------|:------------|
| Account Code | Yes | Unique number (e.g., 1050) |
| Account Name | Yes | Descriptive name |
| Account Type | Yes | Asset/Liability/Equity/Revenue/Expense |
| Sub-Type | Yes | Current/Non-Current, etc. |
| Parent Account | No | For hierarchy grouping |
| Tax Code | No | Default VAT treatment |
| Description | No | Additional details |

4. Click **Save**

**Best Practices:**
- Use consistent numbering (1000s for Assets, 2000s for Liabilities, etc.)
- Keep names clear and consistent
- Don't create accounts for one-time transactions
- Review with your accountant before major changes

### 1.4 Practice Exercise

**Exercise 1: Create a New Bank Account**

Your company opened a new savings account at Standard Bank. Create the account:
- Account Code: 1005
- Account Name: Bank - Standard Bank Savings
- Account Type: Asset
- Sub-Type: Current Asset
- Tax Code: None

---

## Module 2: General Ledger Entries (45 minutes)

### Learning Objectives
- Understand journal entries
- Create manual journal entries
- Review and reverse entries
- Run GL reports

---

### 2.1 Understanding Journal Entries

**What is a Journal Entry?**

A journal entry records financial transactions using double-entry bookkeeping. Every entry must have equal debits and credits.

**Basic Rules:**
- Debits = Credits (always)
- Assets increase with Debits
- Liabilities increase with Credits
- Expenses increase with Debits
- Revenue increases with Credits

**Example:**
```
Paid R5,000 rent via bank transfer

Debit:  Rent Expense (5000)     R5,000
Credit: Bank Account (1000)      R5,000
                                -------
Total:                          R5,000 = R5,000 ✓
```

### 2.2 Creating a Journal Entry

**Step-by-Step:**

1. Navigate to **Financial** → **General Ledger** → **Journal Entries**
2. Click **+ New Journal Entry**
3. Complete the header:

| Field | Description |
|:------|:------------|
| Date | Transaction date |
| Reference | Your reference number |
| Description | What this entry is for |

4. Add lines (minimum 2):

| Account | Description | Debit | Credit |
|:--------|:------------|:------|:-------|
| 5000 - Rent | Office rent Jan 2026 | 5,000.00 | |
| 1000 - FNB Main | Payment | | 5,000.00 |

5. Verify Debits = Credits
6. Click **Post** (or **Save as Draft**)

### 2.3 Common Journal Entry Scenarios

**Scenario 1: Recording Depreciation**
```
Debit:  Depreciation Expense     R2,500
Credit: Accumulated Depreciation  R2,500
```

**Scenario 2: Correcting an Error**
```
Original (wrong): Debit Stationery R1,000
Correction: 
  Debit:  Office Equipment        R1,000
  Credit: Stationery Expense      R1,000
```

**Scenario 3: Accrued Expense**
```
Electricity bill received but not paid:
  Debit:  Electricity Expense     R3,500
  Credit: Accrued Expenses        R3,500
```

### 2.4 Reversing Entries

**When to Reverse:**
- Entry posted to wrong period
- Entry posted with wrong amounts
- Accrual entries at period-end

**Step-by-Step:**
1. Find the journal entry
2. Click **Actions** → **Reverse**
3. Select reversal date
4. Add reversal reason
5. Click **Confirm Reversal**

### 2.5 Practice Exercise

**Exercise 2: Create a Journal Entry**

Record the following: Your company received a R15,000 deposit from a customer for future services.

- Date: Today
- Debit: Bank Account R15,000
- Credit: Deferred Revenue R15,000

---

## Module 3: Accounts Payable (45 minutes)

### Learning Objectives
- Process supplier invoices
- Create and manage payments
- Track supplier balances
- Run AP aging reports

---

### 3.1 The AP Process Flow

```
Receive Invoice → Enter Invoice → Approve → Schedule Payment → Pay → Reconcile
```

### 3.2 Entering Supplier Invoices

**Step-by-Step:**

1. Navigate to **Financial** → **Accounts Payable** → **Invoices**
2. Click **+ New Invoice**
3. Complete the header:

| Field | Description |
|:------|:------------|
| Supplier | Select from list |
| Invoice Number | Supplier's invoice # |
| Invoice Date | Date on invoice |
| Due Date | Auto-calculated from terms |
| Reference | Your PO number |

4. Add line items:

| Description | Account | Amount | VAT |
|:------------|:--------|:-------|:----|
| Office Supplies | 5100 | 1,000.00 | 15% |
| Printer Paper | 5100 | 500.00 | 15% |

5. Verify totals
6. Click **Save** or **Submit for Approval**

### 3.3 Processing Payments

**Single Payment:**
1. Go to **Accounts Payable** → **Payments**
2. Click **+ New Payment**
3. Select supplier
4. Choose invoices to pay
5. Enter payment details (date, bank account, reference)
6. Click **Process Payment**

**Batch Payments:**
1. Go to **Payments** → **Payment Run**
2. Set criteria (due date, supplier, amount)
3. Review suggested payments
4. Select/deselect as needed
5. Generate payment file (EFT)
6. Click **Process Batch**

### 3.4 AP Aging Report

**What it Shows:**
- All unpaid supplier invoices
- Grouped by age (Current, 30, 60, 90+ days)
- Total amounts owed

**How to Run:**
1. Go to **Reports** → **Accounts Payable** → **AP Aging**
2. Select date range and grouping
3. Click **Generate**

### 3.5 Practice Exercise

**Exercise 3: Enter and Pay an Invoice**

1. Enter an invoice:
   - Supplier: Test Supplier
   - Amount: R2,875 (incl VAT)
   - For: Cleaning services

2. Process payment:
   - Full payment
   - From FNB Main Account

---

## Module 4: Accounts Receivable (45 minutes)

### Learning Objectives
- Create customer invoices
- Record customer payments
- Apply credit notes
- Manage collections

---

### 4.1 Creating Customer Invoices

**Step-by-Step:**

1. Navigate to **Financial** → **Accounts Receivable** → **Invoices**
2. Click **+ New Invoice**
3. Select customer
4. Add line items
5. Apply discounts if applicable
6. Click **Save & Send** or **Save as Draft**

**Invoice Options:**
- Email directly from SiyaBusa
- Download PDF
- Print
- Send via WhatsApp (coming soon)

### 4.2 Recording Customer Payments

**Step-by-Step:**

1. Go to **Accounts Receivable** → **Receipts**
2. Click **+ New Receipt**
3. Select customer
4. Enter payment details:
   - Amount received
   - Payment method
   - Bank account
   - Reference (their payment ref)
5. Allocate to invoices
6. Click **Save**

**Allocation Methods:**
- **Specific**: Allocate to exact invoices
- **Oldest First**: Auto-allocate to oldest invoices
- **On Account**: Leave unallocated for later

### 4.3 Credit Notes

**When to Use:**
- Goods returned
- Invoice error
- Discount after invoicing
- Service not rendered

**Step-by-Step:**
1. Go to **Invoices** → Find original invoice
2. Click **Actions** → **Create Credit Note**
3. Enter reason and amount
4. Click **Save & Apply**

### 4.4 AR Aging Report

**Running the Report:**
1. Go to **Reports** → **Accounts Receivable** → **AR Aging**
2. Select parameters
3. Click **Generate**

**Using for Collections:**
- Export to Excel
- Filter by days overdue
- Sort by amount
- Assign follow-up tasks

### 4.5 Practice Exercise

**Exercise 4: Full AR Cycle**

1. Create an invoice for R11,500 (incl VAT)
2. Record a partial payment of R5,000
3. Check the customer's outstanding balance

---

## Module 5: Bank Reconciliation (45 minutes)

### Learning Objectives
- Import bank statements
- Match transactions automatically
- Handle unmatched items
- Complete reconciliation

---

### 5.1 Why Reconcile?

Bank reconciliation ensures your books match your actual bank balance. Differences can occur due to:
- Timing (cheques not cleared)
- Errors (wrong amounts)
- Bank fees not recorded
- Fraud detection

### 5.2 Importing Bank Statements

**Supported Formats:**
- OFX (recommended)
- CSV
- QIF
- MT940

**Step-by-Step:**
1. Go to **Financial** → **Banking** → **Reconciliation**
2. Select bank account
3. Click **Import Statement**
4. Choose file format
5. Upload file
6. Map columns (if CSV)
7. Click **Import**

### 5.3 Automatic Matching

SiyaBusa automatically matches transactions based on:
- Amount
- Date
- Reference number
- Payee name

**Match Confidence:**
- 🟢 High (95%+): Auto-matched
- 🟡 Medium (70-94%): Review suggested
- 🔴 Low (<70%): Manual match needed

### 5.4 Manual Matching

For unmatched items:

**Option 1: Match to Existing**
1. Select bank line
2. Click **Find Match**
3. Search for transaction
4. Click **Match**

**Option 2: Create New Transaction**
1. Select bank line
2. Click **Create**
3. Choose type (Receipt, Payment, Transfer)
4. Complete details
5. Click **Save & Match**

### 5.5 Completing Reconciliation

1. Review all matched items
2. Investigate any discrepancies
3. Verify closing balance matches bank
4. Click **Complete Reconciliation**

**The Reconciliation Formula:**
```
Opening Balance (Book)
+ Deposits
- Payments
= Closing Balance (Book)

Should equal:

Closing Balance (Bank)
+ Outstanding Deposits
- Outstanding Cheques
= Reconciled Balance
```

### 5.6 Practice Exercise

**Exercise 5: Bank Reconciliation**

Using the provided sample bank statement:
1. Import the statement
2. Review auto-matched items
3. Manually match 2 items
4. Create 1 new expense for a bank fee
5. Complete the reconciliation

---

## Module 6: Financial Reports (45 minutes)

### Learning Objectives
- Run standard financial reports
- Understand report parameters
- Customize report layouts
- Schedule automated reports

---

### 6.1 Standard Financial Reports

| Report | Purpose | Frequency |
|:-------|:--------|:----------|
| **Trial Balance** | All account balances | Monthly |
| **Income Statement** | Profit/Loss for period | Monthly |
| **Balance Sheet** | Financial position at date | Monthly |
| **Cash Flow Statement** | Cash movements | Monthly/Quarterly |
| **General Ledger** | All transactions | As needed |

### 6.2 Running Reports

**Step-by-Step:**

1. Navigate to **Reports** → **Financial**
2. Select report type
3. Set parameters:

| Parameter | Options |
|:----------|:--------|
| Period | Month/Quarter/Year/Custom |
| Comparison | None/Prior Period/Prior Year/Budget |
| Level | Summary/Detail |
| Format | PDF/Excel/Screen |

4. Click **Generate**

### 6.3 Understanding the Trial Balance

The Trial Balance shows all accounts with balances:

```
Account                          Debit         Credit
─────────────────────────────────────────────────────
1000 - Bank FNB               150,000.00
1200 - Trade Debtors          85,000.00
1500 - Equipment             250,000.00
2000 - Trade Creditors                       45,000.00
2100 - VAT Payable                          12,500.00
3000 - Share Capital                       200,000.00
3100 - Retained Earnings                   150,000.00
4000 - Sales Revenue                       350,000.00
5000 - Cost of Sales         180,000.00
5100 - Salaries               75,000.00
5200 - Rent                   12,000.00
5300 - Utilities               5,500.00
─────────────────────────────────────────────────────
TOTAL                        757,500.00    757,500.00
```

**Key Check:** Debits must equal Credits

### 6.4 Understanding the Income Statement

```
ABC Trading (Pty) Ltd
Income Statement
For the Month Ended 31 January 2026

REVENUE
  Sales Revenue                           350,000.00
  Other Income                              5,000.00
                                         ───────────
  Total Revenue                           355,000.00

COST OF SALES
  Opening Stock                            50,000.00
  Purchases                               150,000.00
  Less: Closing Stock                     (20,000.00)
                                         ───────────
  Cost of Goods Sold                      180,000.00
                                         ───────────
GROSS PROFIT                              175,000.00

EXPENSES
  Salaries                                 75,000.00
  Rent                                     12,000.00
  Utilities                                 5,500.00
  Depreciation                              3,000.00
  Other Expenses                            8,000.00
                                         ───────────
  Total Expenses                          103,500.00
                                         ───────────
NET PROFIT BEFORE TAX                      71,500.00
  Income Tax (28%)                         20,020.00
                                         ───────────
NET PROFIT AFTER TAX                       51,480.00
                                         ===========
```

### 6.5 Scheduling Automated Reports

**Step-by-Step:**

1. Go to **Reports** → **Scheduled Reports**
2. Click **+ New Schedule**
3. Configure:

| Setting | Options |
|:--------|:--------|
| Report | Select from list |
| Frequency | Daily/Weekly/Monthly |
| Day | Day of week/month |
| Time | Send time |
| Recipients | Email addresses |
| Format | PDF/Excel |

4. Click **Save**

### 6.6 Practice Exercise

**Exercise 6: Financial Reporting**

1. Run a Trial Balance for the current month
2. Generate an Income Statement with prior year comparison
3. Export the Balance Sheet to PDF
4. Schedule a monthly Income Statement to your email

---

## Assessment Preparation

### Key Topics to Review

1. **Chart of Accounts**
   - Account types and normal balances
   - Creating and modifying accounts
   - Account hierarchies

2. **Journal Entries**
   - Double-entry principles
   - Common transaction types
   - Reversing entries

3. **Accounts Payable**
   - Invoice processing workflow
   - Payment processing
   - AP aging interpretation

4. **Accounts Receivable**
   - Invoice creation
   - Receipt allocation
   - Credit notes

5. **Bank Reconciliation**
   - Import process
   - Matching methods
   - Reconciliation formula

6. **Financial Reports**
   - Standard reports
   - Parameters and options
   - Report scheduling

### Sample Assessment Questions

**Question 1:** Which account type increases with a credit?
- A) Asset
- B) Expense
- C) Liability ✓
- D) Drawings

**Question 2:** What must always be true about a journal entry?
- A) It must have a description
- B) Debits must equal credits ✓
- C) It must be approved
- D) It must affect cash

**Question 3:** When reconciling, outstanding deposits are:
- A) Added to book balance
- B) Subtracted from book balance
- C) Added to bank balance ✓
- D) Subtracted from bank balance

---

## Quick Reference Card

### Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl + /` | Search |
| `Ctrl + N` | New entry |
| `Ctrl + S` | Save |
| `Ctrl + P` | Print/PDF |
| `Alt + R` | Run report |

### Common Tasks

| Task | Navigation |
|:-----|:-----------|
| New Journal | Financial → GL → + New |
| Supplier Invoice | Financial → AP → Invoices → + New |
| Customer Invoice | Financial → AR → Invoices → + New |
| Bank Reconciliation | Financial → Banking → Reconciliation |
| Trial Balance | Reports → Financial → Trial Balance |

---

**Document:** Financial Module Training v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
