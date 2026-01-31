# Cash Management Module - User Guide

**Version:** 1.0  
**Last Updated:** November 7, 2025  
**Module Status:** Production Ready  

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Managing Bank Accounts](#managing-bank-accounts)
4. [Importing Bank Statements](#importing-bank-statements)
5. [Reconciling Transactions](#reconciling-transactions)
6. [Dashboard Overview](#dashboard-overview)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [FAQs](#faqs)

---

## Introduction

### What is Cash Management?

The Cash Management module helps you track and reconcile your bank accounts with your general ledger. It automates the tedious process of matching bank transactions with accounting entries, saving hours of manual work each month.

### Key Features

- 🏦 **Multi-Bank Support** - Manage accounts from 10 South African banks
- 📄 **CSV Import** - Import statements in seconds with auto-column mapping
- 🤖 **Auto-Matching** - AI-powered matching with 5 intelligent algorithms
- ✋ **Manual Control** - Override any automatic decision
- 📊 **Live Dashboard** - Real-time view of all account balances
- 🔍 **Audit Trail** - Complete history of all matches and changes
- 🇿🇦 **SA Optimized** - Pre-configured for South African banking

### Benefits

- ⏱️ **Save Time** - Reconcile in minutes instead of hours
- ✅ **Reduce Errors** - Auto-matching prevents manual mistakes
- 📈 **Real-Time Visibility** - Always know your true cash position
- 🔒 **Compliance** - Full audit trail for financial reviews
- 💰 **Cost Savings** - No expensive reconciliation tools needed

---

## Getting Started

### Accessing Cash Management

1. Log into your ERP system
2. Click **💰 Cash Management** in the left sidebar
3. You'll see 4 main tabs:
   - **Accounts** - Manage your bank accounts
   - **Statements** - Import bank statements
   - **Reconcile** - Match transactions
   - **Dashboard** - Overview of all accounts

### First-Time Setup

**Step 1: Create Your First Bank Account**

Before importing statements, you need to set up at least one bank account.

1. Go to the **Accounts** tab
2. Click **+ New Bank Account**
3. Fill in the details (see [Managing Bank Accounts](#managing-bank-accounts))
4. Click **Create Account**

**Step 2: Link to General Ledger**

Each bank account must be linked to a GL account (usually 1100 - Bank Account). This ensures transactions flow correctly into your financial reports.

**Step 3: You're Ready!**

Once you have at least one bank account set up, you can start importing statements and reconciling.

---

## Managing Bank Accounts

### Creating a Bank Account

**Navigation:** Cash Management → Accounts → + New Bank Account

**Required Information:**

| Field | Description | Example |
|-------|-------------|---------|
| **Bank** | Select from 10 SA banks | FNB, ABSA, Nedbank, etc. |
| **Account Name** | Descriptive name | "Main Business Account" |
| **Account Number** | Bank account number | 62123456789 |
| **Branch Code** | Bank branch code | 250655 |
| **GL Account** | Link to chart of accounts | 1100 - Bank Account |
| **Currency** | Account currency | ZAR (default) |
| **Opening Balance** | Balance on opening date | 50,000.00 |
| **Opening Date** | When you start tracking | 2025-03-01 |

**Supported Banks:**

1. 🔴 ABSA Bank
2. 🔵 FNB (First National Bank)
3. 🟢 Nedbank
4. 🔵 Standard Bank
5. 🟣 Capitec Bank
6. ⚫ Investec
7. 🟠 Discovery Bank
8. 🟡 TymeBank
9. 🔴 Bidvest Bank
10. 🟢 African Bank

### Viewing Bank Accounts

**Navigation:** Cash Management → Accounts

The accounts grid shows:
- **Bank logo** and name
- **Account name** and number
- **Current balance** (live)
- **Reconciled balance** (last confirmed)
- **Status** (Active/Inactive)
- **Quick actions** (Edit, View, Deactivate)

**Search & Filter:**
- Use the search box to find accounts by name or number
- Filter by bank or status
- Sort by balance, name, or date

### Editing a Bank Account

1. Click the **Edit** button (pencil icon) on the account card
2. Modify the fields you want to change
3. Click **Update Account**

**Note:** You cannot change the opening balance or opening date after transactions are posted.

### Deactivating vs. Deleting

**Deactivate** (Recommended):
- Account remains in system for historical reporting
- Cannot import new statements
- Previous reconciliations preserved
- Can be reactivated anytime

**Delete** (Use with Caution):
- Only available if no transactions exist
- Permanently removes account
- Cannot be undone

---

## Importing Bank Statements

### Preparing Your CSV File

**Step 1: Download Statement from Your Bank**

Most SA banks offer CSV export:
- **FNB:** Online Banking → Statements → Download CSV
- **ABSA:** CashFocus → Export → CSV Format
- **Nedbank:** Business Evolve → Reports → Transaction Report
- **Standard Bank:** Business Online → Statements → Export

**Step 2: Verify CSV Format**

Your CSV should contain these columns:
- Transaction Date
- Description/Narration
- Reference Number
- Debit Amount
- Credit Amount
- Running Balance

**Example CSV:**
```csv
Date,Description,Reference,Debit,Credit,Balance
2025-11-01,Opening Balance,,,50000.00,50000.00
2025-11-02,Salary Payment,SAL001,25000.00,,25000.00
2025-11-03,Client Payment,INV001,,15000.00,40000.00
```

### Import Wizard (3 Steps)

#### Step 1: Upload

**Navigation:** Cash Management → Statements → Upload Section

1. **Select Bank:** Choose your bank from dropdown
2. **Select Account:** Choose which account this statement is for
3. **Upload File:** Click "Upload Statement" and select your CSV file

**Tips:**
- File size limit: 10MB
- Supported format: CSV only
- Encoding: UTF-8 recommended

#### Step 2: Preview & Map Columns

The system will:
- ✅ **Auto-detect** CSV columns for known SA bank formats
- ✅ **Display preview** of first 10 rows
- ✅ **Highlight** any mapping issues

**Column Mapping:**

| CSV Column | Maps To | Required? |
|------------|---------|-----------|
| Date | Transaction Date | ✅ Yes |
| Description | Description | ✅ Yes |
| Reference | Reference Number | Recommended |
| Debit | Debit Amount | ✅ Yes |
| Credit | Credit Amount | ✅ Yes |
| Balance | Running Balance | ✅ Yes |

**If Auto-Mapping Fails:**
- Manually select the correct column from dropdowns
- The system will remember your mapping for next time

**Date Format:**
- Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
- Auto-detected from sample data

#### Step 3: Confirm & Import

**Review Import Summary:**
```
Statement Date: 2025-11-05
Total Lines: 125
Total Debits: R 450,000.00
Total Credits: R 380,000.00
Net Movement: R -70,000.00
```

**Enter Statement Details:**
- **Statement Date:** Last date on the statement
- **Opening Balance:** First balance on statement
- **Closing Balance:** Last balance on statement

**Balance Validation:**
- System calculates: Opening + Credits - Debits = Expected Closing
- If mismatch, you'll see a warning
- Options: Correct data, Override, or Cancel

**Click "Import Statement":**
- Progress bar shows import status
- Success message appears
- Auto-redirects to Reconciliation workspace

---

## Reconciling Transactions

### Understanding the Workspace

**Navigation:** Cash Management → Reconcile (or auto-redirect after import)

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  Statistics Dashboard                                    │
│  Total: 125 | Matched: 45 | Unmatched: 80 | % Complete  │
└─────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌────┐  ┌──────────────────┐
│ Statement Lines │  │ ⟷  │  │ Journal Entries  │
│                 │  │    │  │                  │
│ • Line 1        │  │ Match│  │ • Journal 1     │
│ • Line 2        │  │ Button│ │ • Journal 2     │
│ • Line 3        │  │    │  │ • Journal 3      │
└─────────────────┘  └────┘  └──────────────────┘
```

**Left Pane - Statement Lines:**
- Shows all transactions from your CSV import
- Color-coded by status:
  - 🟡 **Yellow:** Unmatched (needs action)
  - 🟢 **Green:** Matched (complete)
  - 🟠 **Orange:** Suggested match (review needed)
  - ⚫ **Gray:** Ignored (non-GL items)

**Right Pane - Journal Entries:**
- Shows posted GL journals from your accounting system
- Only shows journals affecting the linked GL account
- Displays date, description, and amount

**Middle - Match Button:**
- Appears when you select one line + one journal
- Click to create manual match

### Auto-Matching (Recommended First Step)

**Click the "🤖 Auto-Match" button** in the header

**What Happens:**
1. System runs 5 intelligent algorithms:
   - **Exact Amount Match** - Same amount to the cent
   - **Reference Number Match** - Same reference/invoice number
   - **Payee Name Match** - Same vendor/customer name
   - **Keyword Match** - Common words in description
   - **Combined Score** - Weighted combination of all factors

2. Confidence score calculated (0-100%):
   - 🟢 **90-100%** - High confidence (green)
   - 🟠 **75-89%** - Medium confidence (orange)
   - 🔴 **0-74%** - Low confidence (red)

3. Suggestions appear on statement lines

**Example Suggestion:**

```
┌──────────────────────────────────────────────────┐
│ Statement Line: Salary Payment - R 25,000.00     │
│                                                   │
│ 💡 Suggested Match                               │
│ Journal: JE-001 - Salaries Expense              │
│ Confidence: 100% ✓                              │
│ Reason: Exact reference match (SAL001)          │
│                                                   │
│ [Accept Suggestion] [Ignore]                     │
└──────────────────────────────────────────────────┘
```

**Reviewing Suggestions:**

- **Green (90%+):** Usually safe to accept
- **Orange (75-89%):** Review carefully before accepting
- **Red (<75%):** Manual review recommended

**Accepting a Suggestion:**
- Click **Accept Suggestion** button
- Match is created instantly
- Line turns green
- Statistics update

**Typical Auto-Match Results:**
- 60-80% of lines matched automatically
- Saves 30-45 minutes per reconciliation
- High accuracy (99%+ for exact matches)

### Manual Matching

**When to Use:**
- Auto-match didn't find a suggestion
- Suggestion confidence is low
- You know the correct match

**Steps:**

1. **Select Statement Line:**
   - Click on the unmatched line (yellow border)
   - Line highlights in blue

2. **Select Journal Entry:**
   - Click on the matching journal (right pane)
   - Journal highlights in blue

3. **Click "Match" Button:**
   - Button appears in middle
   - Creates manual match
   - Both items turn green

**Match Confirmation:**
```
✅ Match Created
Line: Supplier Payment - R 15,000.00
Matched to: JE-045 - ABC Ltd Invoice
Match Type: Manual
```

### Creating Journal Entries

**For unmatched lines with no corresponding journal:**

**Example:** Bank charges, interest, or previously unrecorded transactions

1. **Click "Create Journal"** on the unmatched line
2. **Modal opens** with pre-filled data:
   ```
   Date: [from statement line]
   Description: [from statement line]
   Reference: [from statement line]
   Amount: [from statement line]
   ```

3. **Complete the journal:**
   - **Debit Account:** Select expense/revenue account
   - **Credit Account:** Auto-filled (your bank account)
   - Add notes if needed

4. **Click "Create & Match":**
   - Journal is posted to GL
   - Automatically matched to statement line
   - Line turns green

**Common Journal Types:**

| Statement Line | Debit Account | Credit Account |
|----------------|---------------|----------------|
| Bank Charges | 6300 - Bank Charges | 1100 - Bank Account |
| Interest Earned | 1100 - Bank Account | 4500 - Interest Income |
| NSF Fee | 6300 - Bank Charges | 1100 - Bank Account |
| Wire Transfer Fee | 6300 - Bank Charges | 1100 - Bank Account |

### Unmatching Transactions

**If you made a mistake:**

1. Click **Unmatch** button on the matched line
2. Enter reason: "Incorrect match - wrong invoice"
3. Click **Confirm**
4. Line returns to unmatched status
5. Can now match to correct journal

**Audit Trail:**
- All unmatches are logged
- Includes: Who, When, Why
- Visible in reconciliation report

### Ignoring Lines

**For non-GL transactions:**

**Examples:**
- Internal transfers between your accounts
- Bank memo entries
- Informational lines

1. Click **Ignore** button on the unmatched line
2. Enter reason: "Internal transfer"
3. Line turns gray
4. Excluded from reconciliation percentage

---

## Dashboard Overview

### Accessing the Dashboard

**Navigation:** Cash Management → Dashboard

### Summary Cards

**Card 1: Total Balance**
```
┌──────────────────────────┐
│ Total Balance            │
│ R 125,450.75            │
│ ▼ -R 5,200.00 this week │
└──────────────────────────┘
```
- Combined balance of all active accounts
- Trend indicator (▲ up, ▼ down)

**Card 2: Active Accounts**
```
┌──────────────────────────┐
│ Active Accounts          │
│ 5 Accounts              │
│ 3 Banks                 │
└──────────────────────────┘
```
- Number of accounts you're managing
- Bank diversity

**Card 3: Need Reconciliation**
```
┌──────────────────────────┐
│ Need Reconciliation      │
│ 2 Accounts              │
│ ⚠️ Action Required       │
└──────────────────────────┘
```
- Accounts with unreconciled statements
- Accounts >7 days since last reconciliation

**Card 4: Unmatched Lines**
```
┌──────────────────────────┐
│ Unmatched Lines          │
│ 15 Lines                │
│ R 8,450.00              │
└──────────────────────────┘
```
- Total unmatched transactions across all accounts
- Total amount pending reconciliation

### Primary Account Section

**Highlighted account with most activity or highest balance:**

```
┌─────────────────────────────────────────────────┐
│ 🏦 Main Business Account - FNB                 │
│                                                  │
│ Current Balance: R 125,450.75                   │
│ Reconciled Balance: R 125,450.75                │
│ Variance: R 0.00 ✓                             │
│                                                  │
│ Last Reconciled: 2 days ago                     │
│ Status: Good ✓                                  │
│                                                  │
│ [Import Statement] [Reconcile Now]             │
└─────────────────────────────────────────────────┘
```

**Status Indicators:**
- 🟢 **Good:** Reconciled within 7 days
- 🟡 **Warning:** 8-30 days since reconciliation
- 🔴 **Critical:** >30 days or never reconciled

**Variance:**
- Difference between current and reconciled balance
- Green if zero, orange if small, red if large
- Indicates pending transactions

### All Accounts Grid

**Shows all bank accounts with:**
- Bank name and logo
- Account name and number
- Current balance
- Reconciliation status
- Days since last reconciliation
- Unmatched lines count
- Quick action buttons

**Sorting:**
- Click column headers to sort
- Default: By balance (highest first)

**Quick Actions:**
- **Import Statement:** Opens import wizard for that account
- **Reconcile:** Opens workspace for last unreconciled statement

---

## Best Practices

### Daily/Weekly Reconciliation

**Recommended Schedule:**

- **Daily:** If high transaction volume (>50/day)
- **Weekly:** For moderate volume (10-50/week)
- **Monthly:** Minimum for low volume (<10/month)

**Benefits:**
- Easier to remember transaction context
- Catch errors quickly
- Maintain accurate cash position
- Less time per session

### Month-End Close

**Reconciliation Checklist:**

1. ✅ Import all statements through month-end date
2. ✅ Run auto-match on all accounts
3. ✅ Review and accept/reject suggestions
4. ✅ Manually match remaining lines
5. ✅ Create journals for unrecorded transactions
6. ✅ Verify 100% reconciliation on all accounts
7. ✅ Review variance (should be R 0.00)
8. ✅ Print/export reconciliation report
9. ✅ Lock accounting period (prevents backdating)

### Naming Conventions

**Bank Account Names:**
- Use descriptive names: "Main Operating Account", "Payroll Account"
- Include currency if multi-currency: "USD Operating Account"
- Include location if multi-branch: "Cape Town Branch Account"

**Journal Entry Descriptions:**
- Match bank description when possible
- Include reference numbers: "Invoice 12345", "Payment 678"
- Be consistent for easier auto-matching

### Handling Exceptions

**Scenario 1: Missing Journal Entry**
- Don't manually create unless authorized
- Contact bookkeeper/accountant
- Use "Create Journal" feature if you have authority

**Scenario 2: Bank Error**
- Contact bank immediately
- Ignore the line with reason: "Bank error - ref [case number]"
- Follow up until corrected

**Scenario 3: Timing Difference**
- Check posted but not cleared: Normal, will match next statement
- Deposit in transit: Will appear on next statement
- Don't force match if dates don't align

### Security Best Practices

- 🔒 Restrict bank account creation to authorized users
- 🔒 Require approval for large manual matches
- 🔒 Review audit trail monthly
- 🔒 Backup before month-end close
- 🔒 Separate duties: Import vs. Approval

---

## Troubleshooting

### Common Issues

#### Issue: CSV Won't Import

**Symptoms:**
- Error: "Unable to parse CSV file"
- File upload fails

**Solutions:**
1. **Check file encoding:**
   - Save CSV as UTF-8
   - Avoid special characters in Excel

2. **Verify CSV format:**
   - Must be comma-separated (not tab or semicolon)
   - No merged cells
   - No extra header rows

3. **Remove formulas:**
   - Copy values only to new file
   - Remove any Excel formatting

4. **File size:**
   - Split large files (>10MB) into smaller chunks
   - Import by date range

#### Issue: Auto-Match Not Finding Suggestions

**Symptoms:**
- Auto-match completes but 0 suggestions
- Low match rate (<20%)

**Possible Causes:**
1. **No journals posted:**
   - Check GL for posted entries
   - Verify journals affect the correct bank account

2. **Date mismatch:**
   - Bank date vs. posting date may differ
   - Expand date range in workspace

3. **Description differences:**
   - Bank truncates descriptions
   - Use reference numbers for better matching

**Solutions:**
- Review journal entry descriptions
- Ensure reference numbers are consistent
- Consider manual matching for first month
- System learns from manual matches

#### Issue: Balance Doesn't Match

**Symptoms:**
- Closing balance error on import
- Variance on dashboard

**Solutions:**
1. **Verify CSV data:**
   - Check running balance column
   - Ensure all lines included

2. **Check opening balance:**
   - Should match previous closing balance
   - Verify opening date is correct

3. **Look for missing lines:**
   - Some banks omit opening balance line
   - May need to add manually

4. **Outstanding transactions:**
   - Checks written but not cleared
   - Deposits in transit
   - Normal if within a few days

#### Issue: Cannot Create Bank Account

**Symptoms:**
- Error: "Account number already exists"
- Validation fails

**Solutions:**
1. **Check for duplicates:**
   - Search existing accounts
   - May be inactive account

2. **Verify GL account:**
   - Must be valid GL account code
   - Must be balance sheet account (1xxx)

3. **Permissions:**
   - May need administrator access
   - Contact system admin

---

## FAQs

**Q: How often should I reconcile?**  
A: Ideally weekly, minimum monthly. More frequent = easier and more accurate.

**Q: Can I edit a matched line?**  
A: No. Unmatch first, make corrections, then re-match.

**Q: What if I delete a journal entry that's matched?**  
A: The match is automatically broken. The statement line returns to unmatched status.

**Q: Can I reconcile multiple accounts at once?**  
A: No, reconcile one account at a time for accuracy. However, the dashboard shows all accounts.

**Q: What's the difference between reconciled balance and current balance?**  
A: 
- **Reconciled Balance:** Last confirmed balance from statement
- **Current Balance:** Live balance including recent GL entries
- **Variance:** Unreconciled transactions

**Q: How do I handle returned checks?**  
A: 
1. Ignore the original deposit line
2. Create a journal for the return fee
3. Note in description: "NSF - Check [number]"

**Q: Can I import the same statement twice?**  
A: System checks for duplicates. You'll get a warning if statement date already exists for that account.

**Q: What happens to matched lines when I close the period?**  
A: Matches are preserved. You can still view but cannot modify after period close.

**Q: How do I reconcile foreign currency accounts?**  
A: Currently ZAR only. Multi-currency support coming in Phase 2.

**Q: Can I export reconciliation reports?**  
A: Yes, reports can be exported to PDF/Excel from the workspace. (Feature in development)

---

## Next Steps

### Now That You're Reconciled...

**1. Review Financial Reports:**
- Cash Flow Statement now reflects true position
- Balance Sheet bank balance accurate
- Trial Balance reconciled

**2. Set Up Recurring Tasks:**
- Schedule weekly reconciliation time
- Set reminders for statement downloads
- Create checklist for month-end

**3. Train Your Team:**
- Share this guide with bookkeepers
- Define roles and permissions
- Establish approval workflow

**4. Optimize Your Process:**
- Create naming conventions
- Document your bank's CSV format
- Build templates for common journals

### Related Modules

**Financial Module:**
- Chart of Accounts management
- Journal entry posting
- Financial reports

**Approval Workflows:**
- Set approval thresholds
- Route large transactions
- Audit trail tracking

**Dashboard:**
- Real-time financial metrics
- Cash flow charts
- KPI monitoring

---

## Support

### Getting Help

**Documentation:**
- Testing Guide: See CASH-MANAGEMENT-TESTING-GUIDE.md
- API Docs: See backend API documentation
- Architecture: See BANK-RECONCILIATION-ARCHITECTURE.md

**Contact:**
- Technical Support: support@yourcompany.com
- Training: training@yourcompany.com
- Feature Requests: feedback@yourcompany.com

---

**Document Version:** 1.0  
**Last Updated:** November 7, 2025  
**Next Review:** December 7, 2025

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-07 | 1.0 | Initial user guide creation | AI Dev Team |

---

**Thank you for using Worldclass ERP Cash Management!** 🎉💰

Your bank reconciliation process just got a whole lot easier! 🚀
