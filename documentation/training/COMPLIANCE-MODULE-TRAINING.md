# SiyaBusa ERP - Compliance Module Training

## Complete Training Guide for Compliance & Finance Teams

---

## Training Overview

**Duration:** 3-4 hours  
**Prerequisites:** Financial Module Training recommended  
**Certification:** Compliance Specialist  
**Assessment:** 30 questions, 85% to pass

---

## Part A: SARS Sentinel Module

### Module 1: Understanding SARS Sentinel (30 minutes)

#### Learning Objectives
- Understand SARS Sentinel capabilities
- Navigate the compliance dashboard
- Configure tax settings
- Monitor compliance health

---

### 1.1 What is SARS Sentinel?

SARS Sentinel is SiyaBusa's built-in compliance engine that:

| Feature | Description |
|:--------|:------------|
| **Tax Automation** | Auto-calculates VAT, PAYE, UIF, SDL |
| **eFiling Integration** | Direct submission to SARS |
| **Alert System** | Deadline reminders and warnings |
| **Audit Trail** | Complete submission history |
| **Error Detection** | Pre-submission validation |

### 1.2 Compliance Dashboard

**Accessing the Dashboard:**
1. Navigate to **Compliance** → **SARS Sentinel**
2. Dashboard displays:

**Compliance Health Score:**
```
┌─────────────────────────────────────┐
│  COMPLIANCE HEALTH: 94/100  ✓      │
│  ██████████████████░░ 94%          │
│                                     │
│  ✓ VAT Submissions Up to Date      │
│  ✓ PAYE Current                    │
│  ⚠ EMP501 Due in 15 Days           │
└─────────────────────────────────────┘
```

**Dashboard Widgets:**
- Upcoming Deadlines
- Recent Submissions
- Outstanding Returns
- Risk Alerts

### 1.3 Tax Configuration

**Setting Up Tax Rates:**
1. Go to **Compliance** → **Setup** → **Tax Rates**
2. Verify current rates:

| Tax Type | Rate | Effective Date |
|:---------|:-----|:---------------|
| VAT | 15% | 01 April 2018 |
| PAYE | Sliding scale | Per tax year |
| UIF | 1% (employee + employer) | Current |
| SDL | 1% | Current |

**Company Tax Registration:**
1. Go to **Settings** → **Company**
2. Enter:
   - VAT Registration Number
   - SARS Employer Reference (PAYE)
   - UIF Reference Number
   - Company Income Tax Number

### 1.4 Practice Exercise

**Exercise 1: Dashboard Review**
1. Navigate to SARS Sentinel dashboard
2. Review current compliance health score
3. Identify any upcoming deadlines
4. Check for outstanding returns

---

### Module 2: VAT Management (45 minutes)

#### Learning Objectives
- Process VAT input and output
- Generate VAT reports
- Complete VAT201 returns
- Submit to SARS eFiling

---

### 2.1 VAT Overview

**VAT Categories:**
| Category | Description | Rate |
|:---------|:------------|:-----|
| Standard | Most goods/services | 15% |
| Zero-Rated | Exports, basic food | 0% |
| Exempt | Financial services | N/A |

### 2.2 VAT Codes in SiyaBusa

**Standard Codes:**
| Code | Description | Rate | Account |
|:-----|:------------|:-----|:--------|
| S | Standard rate | 15% | VAT Output |
| Z | Zero-rated | 0% | N/A |
| E | Exempt | N/A | N/A |
| I | Input (purchases) | 15% | VAT Input |
| IP | Import (customs VAT) | 15% | VAT Input |

### 2.3 VAT Report

**Running VAT Report:**
1. Go to **Compliance** → **VAT** → **VAT Report**
2. Select period (monthly/bi-monthly)
3. Click **Generate**

**Report Shows:**

| Line | Description | Amount |
|:-----|:------------|:-------|
| **Output VAT (Sales)** | | |
| 1 | Standard rate supplies | R1,000,000 |
| 1A | VAT on Line 1 | R150,000 |
| 2 | Zero-rated supplies | R200,000 |
| **Input VAT (Purchases)** | | |
| 14 | Input tax on purchases | R120,000 |
| 15 | Adjustments | R0 |
| **Balance** | | |
| 21 | VAT Payable | R30,000 |

### 2.4 Preparing VAT201 Return

**Step-by-Step:**

1. Go to **Compliance** → **VAT** → **VAT201**
2. Select tax period
3. System auto-populates from transactions
4. Review each line:
   - Click line to see supporting transactions
   - Verify calculations
   - Check for anomalies
5. Click **Validate**
   - Green ✓: Ready to submit
   - Red ✗: Errors to fix

### 2.5 Submitting to SARS

**eFiling Integration:**

1. Complete VAT201 preparation
2. Click **Submit to SARS**
3. Enter eFiling credentials (first time only):
   - Username
   - Password
   - Two-factor code
4. Confirm submission
5. System returns:
   - Submission receipt
   - Reference number
   - Status confirmation

**Post-Submission:**
- Receipt saved in system
- Dashboard updated
- Audit trail recorded

### 2.6 Practice Exercise

**Exercise 2: VAT Return**
1. Generate VAT report for last period
2. Review transactions by VAT category
3. Prepare VAT201 return
4. Validate for errors
5. Review submission checklist (don't submit)

---

### Module 3: PAYE & Employee Taxes (45 minutes)

#### Learning Objectives
- Calculate PAYE correctly
- Process EMP201 monthly submissions
- Prepare bi-annual EMP501
- Generate IRP5 certificates

---

### 3.1 PAYE Calculation

**How SARS Sentinel Calculates:**

| Component | Calculation |
|:----------|:------------|
| Gross Income | Total earnings |
| - Deductions | Pension, medical aid |
| = Taxable Income | Subject to tax |
| × Tax Rate | Per SARS tables |
| - Rebates | Primary, secondary, tertiary |
| = PAYE | Amount to withhold |

**Auto-Calculation:**
- System uses latest SARS tax tables
- Updates annually when tables change
- Handles mid-year rate changes

### 3.2 EMP201 Monthly Return

**What it Reports:**
- Total PAYE deducted
- UIF (employee + employer)
- SDL contributions
- Total liability

**Preparing EMP201:**

1. Go to **Compliance** → **PAYE** → **EMP201**
2. Select month
3. Review summary:

| Tax Type | Amount |
|:---------|:-------|
| PAYE | R125,000 |
| UIF (EE) | R5,000 |
| UIF (ER) | R5,000 |
| SDL | R10,000 |
| **Total** | **R145,000** |

4. Click **Validate**
5. Click **Submit to SARS**

**Deadline:** 7th of following month

### 3.3 EMP501 Reconciliation

**Purpose:**
- Reconcile full tax year
- Declare all employees
- Issue IRP5 certificates

**When:**
- Interim: August (6-month)
- Annual: May (full year)

**Preparation:**

1. Go to **Compliance** → **PAYE** → **EMP501**
2. Select reconciliation period
3. System generates:
   - Employee list
   - Total remuneration per employee
   - Tax deducted per employee
   - UIF/SDL totals

4. Review each employee:
   - Verify ID numbers
   - Check income codes
   - Validate tax calculations

5. Click **Generate IRP5s**
6. Review IRP5 certificates
7. Submit to SARS

### 3.4 IRP5 Certificates

**What's Included:**
- Employee details (ID, tax number)
- Income codes (3601, 3605, etc.)
- Deductions (4001, 4002, etc.)
- Tax withheld
- Employer details

**Distributing IRP5s:**
1. Go to **HR** → **Payslips** → **IRP5s**
2. Select employees
3. Choose: Email / Download / Print
4. Send to employees

### 3.5 Practice Exercise

**Exercise 3: PAYE Processing**
1. Review EMP201 for current month
2. Check employee tax calculations
3. Prepare (don't submit) the EMP201
4. Preview an IRP5 certificate

---

## Part B: Audit Shield Module

### Module 4: Understanding Audit Shield (30 minutes)

#### Learning Objectives
- Understand audit trail importance
- Navigate Audit Shield dashboard
- Configure audit settings
- Monitor audit readiness

---

### 4.1 What is Audit Shield?

Audit Shield provides:

| Feature | Description |
|:--------|:------------|
| **Complete Audit Trail** | Every change tracked |
| **Document Storage** | Linked source documents |
| **User Tracking** | Who did what, when |
| **Compliance Checks** | Automated validations |
| **Audit Reports** | Ready for auditors |

### 4.2 Audit Trail

**What's Tracked:**

| Action | Details Captured |
|:-------|:-----------------|
| Create | New record created |
| Update | Field changes (old → new) |
| Delete | Record removal |
| View | Sensitive data access |
| Export | Data exports |
| Approve | Approvals and rejections |

**Viewing Audit History:**
1. Open any record
2. Click **Audit Trail** tab
3. View history:

| Date | User | Action | Field | Old | New |
|:-----|:-----|:-------|:------|:----|:----|
| 15/01 | S.Mavuso | Update | Price | R100 | R120 |
| 10/01 | J.Smith | Create | - | - | - |

### 4.3 Audit Dashboard

**Dashboard Shows:**
- Total changes this period
- High-risk activities
- User activity summary
- Document compliance
- Missing attachments

**Risk Indicators:**
| Risk Level | Trigger |
|:-----------|:--------|
| 🔴 Critical | Financial fraud indicators |
| 🟠 High | Unusual patterns |
| 🟡 Medium | Missing documentation |
| 🟢 Low | Normal operations |

### 4.4 Practice Exercise

**Exercise 4: Audit Trail Review**
1. Open a recent transaction
2. View its audit history
3. Navigate to Audit Shield dashboard
4. Review high-risk activities (if any)

---

### Module 5: Compliance Controls (30 minutes)

#### Learning Objectives
- Set up compliance rules
- Configure approval workflows
- Manage segregation of duties
- Run compliance checks

---

### 5.1 Compliance Rules

**Built-in Rules:**

| Rule | Description |
|:-----|:------------|
| Invoice Matching | PO must match invoice |
| Credit Limit | Block orders over limit |
| Duplicate Detection | Flag duplicate payments |
| Period Lock | Prevent backdating |
| Approval Thresholds | Required approvals by value |

**Configuring Rules:**
1. Go to **Compliance** → **Audit Shield** → **Rules**
2. Select rule
3. Configure parameters
4. Enable/Disable

### 5.2 Segregation of Duties

**Principle:**
No single person should control all aspects of a financial transaction.

**Example Separations:**
| Process | Separated Roles |
|:--------|:----------------|
| Purchasing | Requisitioner ≠ Approver ≠ Receiver |
| Payments | Creator ≠ Approver |
| Payroll | Processor ≠ Approver |

**Configuration:**
1. Go to **Settings** → **Security** → **Segregation**
2. Define conflicting roles
3. System prevents assignment

### 5.3 Approval Workflows

**Setting Thresholds:**

| Document | <R10K | R10K-R50K | >R50K |
|:---------|:------|:----------|:------|
| Purchase Order | Auto-approve | Manager | Director |
| Payment | Clerk | Manager | Director |
| Credit Note | Auto-approve | Manager | Finance Dir |

### 5.4 Compliance Checks

**Running Checks:**
1. Go to **Compliance** → **Audit Shield** → **Run Check**
2. Select check type:
   - Duplicate invoices
   - Unreconciled items
   - Missing documents
   - Unusual transactions
3. Click **Run**
4. Review findings
5. Take action on issues

### 5.5 Practice Exercise

**Exercise 5: Compliance Review**
1. Review current compliance rules
2. Check segregation of duties settings
3. Run a duplicate invoice check
4. Review any findings

---

### Module 6: Audit Reporting (30 minutes)

#### Learning Objectives
- Generate audit reports
- Prepare for external audits
- Export audit evidence
- Manage audit queries

---

### 6.1 Standard Audit Reports

**Available Reports:**

| Report | Purpose |
|:-------|:--------|
| **Audit Trail Report** | All changes in period |
| **User Activity Report** | Actions by user |
| **Transaction Register** | Complete transaction list |
| **Approval Log** | All approvals/rejections |
| **Exception Report** | Rule violations |
| **Document Register** | All attached documents |

### 6.2 Generating Reports

**Audit Trail Report:**
1. Go to **Reports** → **Audit** → **Audit Trail**
2. Select parameters:
   - Date range
   - Users (all or specific)
   - Modules (all or specific)
   - Action types
3. Click **Generate**
4. Export as PDF/Excel

### 6.3 Audit Package

**Creating Audit Package:**
1. Go to **Compliance** → **Audit Shield** → **Audit Package**
2. Select audit requirements:
   - Financial statements
   - Trial balance
   - Ledger details
   - Bank reconciliations
   - Supporting documents
3. Click **Generate Package**
4. Download ZIP file

**Package Contains:**
- All requested reports
- Supporting documents
- Audit trail
- Control evidence

### 6.4 Managing Audit Queries

**When Auditors Have Questions:**
1. Go to **Compliance** → **Audit Queries**
2. Click **+ New Query**
3. Log:
   - Query description
   - Auditor name
   - Due date
   - Assigned to
4. Track responses
5. Attach evidence
6. Close query

### 6.5 Practice Exercise

**Exercise 6: Audit Preparation**
1. Generate an Audit Trail Report for last month
2. Create an Audit Package
3. Log a sample audit query
4. Export evidence for the query

---

## Assessment Preparation

### Key Topics

**SARS Sentinel:**
1. VAT rates and categories
2. VAT201 return process
3. PAYE calculation
4. EMP201 and EMP501
5. eFiling submission

**Audit Shield:**
1. Audit trail purpose
2. Segregation of duties
3. Approval workflows
4. Compliance checks
5. Audit reporting

### Sample Questions

**Q1:** When is the EMP201 due each month?
- A) 15th
- B) 7th ✓
- C) Last day
- D) 25th

**Q2:** What does segregation of duties prevent?
- A) Duplicate entries
- B) Single person controlling entire transaction ✓
- C) System errors
- D) Late submissions

---

## Quick Reference Card

### SARS Deadlines

| Return | Due Date |
|:-------|:---------|
| VAT (monthly) | Last working day |
| VAT (bi-monthly) | Last working day of following month |
| EMP201 | 7th of following month |
| EMP501 (interim) | 31 October |
| EMP501 (annual) | 31 May |

### Navigation

| Task | Path |
|:-----|:-----|
| VAT Return | Compliance → VAT → VAT201 |
| EMP201 | Compliance → PAYE → EMP201 |
| Audit Trail | Any record → Audit Trail tab |
| Run Compliance Check | Compliance → Audit Shield → Run Check |

### Important Tax Codes

| Code | Description |
|:-----|:------------|
| 3601 | Salary |
| 3605 | Bonus |
| 3701 | Travel allowance |
| 4001 | Pension fund contribution |
| 4474 | Medical aid contribution |

---

**Document:** Compliance Module Training v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
