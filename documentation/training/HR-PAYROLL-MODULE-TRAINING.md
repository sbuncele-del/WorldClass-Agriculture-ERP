# SiyaBusa ERP - HR & Payroll Module Training

## Complete Training Guide for HR Teams

---

## Training Overview

**Duration:** 4-6 hours  
**Prerequisites:** Getting Started Guide completed  
**Certification:** HR & Payroll Specialist  
**Assessment:** 40 questions, 80% to pass

---

## Module 1: Employee Management (45 minutes)

### Learning Objectives
- Create and maintain employee records
- Understand employee data structure
- Manage employee documents
- Handle employee lifecycle events

---

### 1.1 Employee Record Structure

**Employee Record Components:**

| Section | Contains |
|:--------|:---------|
| **Personal Details** | Name, ID, contact, demographics |
| **Employment Details** | Position, department, manager, dates |
| **Compensation** | Salary, allowances, deductions |
| **Banking** | Bank details for salary payment |
| **Tax** | Tax number, tax status, IRP5 info |
| **Benefits** | Medical aid, pension, other benefits |
| **Documents** | Contracts, certificates, IDs |
| **Leave** | Balances, history, entitlements |

### 1.2 Adding a New Employee

**Step-by-Step:**

1. Navigate to **HR** → **Employees**
2. Click **+ Add Employee**
3. Complete each tab:

**Tab 1: Personal Information**
| Field | Required | Notes |
|:------|:---------|:------|
| First Name | Yes | Legal first name |
| Last Name | Yes | Legal surname |
| ID Number | Yes | 13-digit SA ID |
| Date of Birth | Auto | Extracted from ID |
| Gender | Auto | Extracted from ID |
| Email | Yes | Work email |
| Phone | Yes | Contact number |
| Address | Yes | Physical address |

**Tab 2: Employment Details**
| Field | Required | Notes |
|:------|:---------|:------|
| Employee Number | Auto | System generated |
| Start Date | Yes | First day of work |
| Department | Yes | Select from list |
| Position | Yes | Job title |
| Manager | Yes | Reports to |
| Employment Type | Yes | Permanent/Contract/Part-time |
| Work Location | No | Office/Remote/Hybrid |

**Tab 3: Compensation**
| Field | Required | Notes |
|:------|:---------|:------|
| Basic Salary | Yes | Monthly amount |
| Pay Frequency | Yes | Monthly/Fortnightly/Weekly |
| Payment Method | Yes | Bank Transfer/Cash/Cheque |
| Cost Centre | No | For reporting |

**Tab 4: Tax Information**
| Field | Required | Notes |
|:------|:---------|:------|
| Tax Number | Yes | SARS tax reference |
| Tax Status | Yes | A/B/C (based on age/status) |
| Nature of Person | Yes | Individual/Director |
| EMP501 Category | Yes | For IRP5 reporting |

4. Upload required documents
5. Click **Save**

### 1.3 Employee Self-Service

**What Employees Can Do:**
- View their own profile
- Update contact details
- Download payslips
- Apply for leave
- Submit expense claims
- View company policies

**Enabling Self-Service:**
1. Go to employee record
2. Click **Actions** → **Enable Self-Service**
3. System sends login credentials

### 1.4 Employee Lifecycle Events

**Promotion/Transfer:**
1. Open employee record
2. Click **Actions** → **Promotion/Transfer**
3. Enter effective date
4. Update position/department/salary
5. Add supporting documents
6. Click **Save**

**Termination:**
1. Open employee record
2. Click **Actions** → **Terminate**
3. Enter last working day
4. Select termination reason
5. Calculate final pay
6. Generate termination checklist
7. Click **Process Termination**

### 1.5 Practice Exercise

**Exercise 1: Add a New Employee**

Create a new employee record:
- Name: Thabo Mokoena
- ID: 9001015012081
- Position: Accountant
- Department: Finance
- Basic Salary: R35,000
- Start Date: 1 February 2026

---

## Module 2: Leave Administration (30 minutes)

### Learning Objectives
- Configure leave types and policies
- Process leave applications
- Manage leave balances
- Generate leave reports

---

### 2.1 Leave Types in South Africa

**Statutory Leave (BCEA):**

| Leave Type | Entitlement | Notes |
|:-----------|:------------|:------|
| **Annual Leave** | 15-21 days | Based on days worked per week |
| **Sick Leave** | 30 days/3 years | 6-week cycle |
| **Family Responsibility** | 3 days/year | Birth, death, illness |
| **Maternity** | 4 months | 4 consecutive months |
| **Parental** | 10 days | New fathers, adoption |

**Company Leave (Optional):**
- Study leave
- Compassionate leave
- Religious holidays
- Bonus leave

### 2.2 Configuring Leave Policies

**Step-by-Step:**

1. Go to **HR** → **Setup** → **Leave Policies**
2. Click **+ Add Policy**
3. Configure:

| Setting | Description |
|:--------|:------------|
| Leave Type | Annual/Sick/etc. |
| Days Per Year | Entitlement |
| Accrual Method | Monthly/Annual/Immediate |
| Carry Over | Yes/No, max days |
| Pro-rata | For new joiners |
| Requires Approval | Yes/No, approver level |
| Documentation | Doctor's note required? |

4. Assign to employee groups
5. Click **Save**

### 2.3 Processing Leave Applications

**Employee Applies (Self-Service):**
1. Employee goes to **Leave** → **Apply**
2. Selects leave type and dates
3. Adds reason/comments
4. Attaches documents if required
5. Submits application

**Manager Approves:**
1. Manager receives notification
2. Goes to **Approvals** → **Leave Requests**
3. Reviews request and balance
4. Clicks **Approve** or **Decline**
5. Adds comments if declining
6. Employee notified of decision

### 2.4 Manual Leave Adjustments

**When Needed:**
- Carried over leave from previous system
- Bonus leave granted
- Leave balance correction

**Step-by-Step:**
1. Go to employee's leave record
2. Click **Adjust Balance**
3. Select leave type
4. Enter adjustment (+/-)
5. Add reason
6. Click **Save**

### 2.5 Leave Reports

**Key Reports:**

| Report | Purpose |
|:-------|:--------|
| **Leave Balances** | Current balances by employee |
| **Leave Taken** | Leave usage for period |
| **Leave Forecast** | Planned leave by department |
| **Leave Liability** | Financial value of leave owed |

### 2.6 Practice Exercise

**Exercise 2: Process Leave**

1. Apply for 5 days annual leave for Thabo Mokoena
2. Approve the leave request
3. Check the updated leave balance
4. Run a leave balance report for the Finance department

---

## Module 3: Payroll Setup (45 minutes)

### Learning Objectives
- Configure payroll components
- Set up PAYE, UIF, and SDL
- Create earning and deduction types
- Understand pay frequencies

---

### 3.1 South African Payroll Components

**Statutory Deductions:**

| Component | Rate | Employer | Employee |
|:----------|:-----|:---------|:---------|
| **PAYE** | Tax tables | - | Variable |
| **UIF** | 2% | 1% | 1% |
| **SDL** | 1% | 1% | - |

**Common Earnings:**
- Basic Salary
- Overtime
- Commission
- Bonuses
- Allowances (Travel, Cell, Housing)

**Common Deductions:**
- Medical Aid
- Pension/Provident Fund
- Garnishee Orders
- Union Fees
- Loans

### 3.2 Setting Up PAYE

**PAYE is Automatic in SiyaBusa**

The system uses official SARS tax tables for:
- Annual tax brackets
- Tax rebates (Primary, Secondary, Tertiary)
- Medical tax credits

**Configuration:**
1. Go to **Payroll** → **Setup** → **Tax Tables**
2. Verify current tax year tables loaded
3. Update annually when SARS releases new tables

**Tax Status Codes:**
| Code | Description | Primary Rebate |
|:-----|:------------|:---------------|
| A | Under 65 | R17,235 |
| B | 65-74 years | R9,444 (additional) |
| C | 75+ years | R3,145 (additional) |

### 3.3 Setting Up UIF

**Configuration:**
1. Go to **Payroll** → **Setup** → **Statutory**
2. UIF settings:
   - Contribution Rate: 1% employee, 1% employer
   - Ceiling: R17,712 (2025/2026)
   - Maximum contribution: R177.12 each

**Excluded from UIF:**
- Employees working <24 hours/month
- Learners in learnership
- Public servants (GEPF)

### 3.4 Creating Earning Types

**Step-by-Step:**

1. Go to **Payroll** → **Setup** → **Earning Types**
2. Click **+ Add**
3. Configure:

| Field | Example: Travel Allowance |
|:------|:--------------------------|
| Code | TRAVEL |
| Name | Travel Allowance |
| Tax Treatment | 80% taxable |
| UIF | No |
| SDL | Yes |
| Calculation | Fixed amount |

4. Click **Save**

### 3.5 Creating Deduction Types

**Step-by-Step:**

1. Go to **Payroll** → **Setup** → **Deduction Types**
2. Click **+ Add**
3. Configure:

| Field | Example: Medical Aid |
|:------|:---------------------|
| Code | MEDAID |
| Name | Medical Aid - Discovery |
| Type | Before Tax |
| Calculation | Fixed amount |
| Tax Credit | Yes |
| Priority | 1 (first deduction) |

4. Click **Save**

### 3.6 Assigning to Employees

**Individual Assignment:**
1. Open employee record
2. Go to **Compensation** tab
3. Click **+ Add Earning** or **+ Add Deduction**
4. Select type and amount
5. Set effective date
6. Click **Save**

**Bulk Assignment:**
1. Go to **Payroll** → **Bulk Update**
2. Select earning/deduction
3. Filter employees
4. Set amount
5. Apply

### 3.7 Practice Exercise

**Exercise 3: Payroll Setup**

1. Create a new earning type: "Cell Phone Allowance"
   - 100% taxable
   - Subject to UIF and SDL
2. Assign R500 cell phone allowance to Thabo Mokoena

---

## Module 4: Running Payroll (45 minutes)

### Learning Objectives
- Create and process pay runs
- Review payroll calculations
- Handle exceptions
- Finalize and post payroll

---

### 4.1 The Payroll Process

```
Create Pay Run → Calculate → Review → Approve → Post → Pay → Reports
```

### 4.2 Creating a Pay Run

**Step-by-Step:**

1. Go to **Payroll** → **Pay Runs**
2. Click **+ New Pay Run**
3. Configure:

| Field | Description |
|:------|:------------|
| Pay Period | January 2026 |
| Pay Date | 25 January 2026 |
| Pay Frequency | Monthly |
| Employees | All/Selected |

4. Click **Create Pay Run**

### 4.3 Calculating Payroll

**System Automatically Calculates:**

1. **Gross Pay**
   - Basic salary
   - Allowances
   - Overtime
   - Commissions
   - Bonuses

2. **Statutory Deductions**
   - PAYE (based on tax tables)
   - UIF (1% employee, 1% employer)
   - SDL (1% employer)

3. **Other Deductions**
   - Medical aid
   - Pension/provident
   - Loans
   - Garnishees

4. **Net Pay**
   - Gross pay - All deductions

### 4.4 Reviewing the Payroll

**Review Checklist:**

☐ Total gross pay matches expectations  
☐ New employees included  
☐ Terminated employees excluded  
☐ Leave without pay applied  
☐ Salary changes effective  
☐ PAYE calculations correct  
☐ UIF/SDL within limits  
☐ Medical aid credits applied  
☐ Loan deductions progressing  
☐ Net pay balances to bank file  

**Common Exceptions:**

| Exception | Cause | Resolution |
|:----------|:------|:-----------|
| Negative net pay | Deductions > Gross | Reduce deductions or advance pay |
| Zero PAYE | Below threshold | Verify - may be correct |
| UIF over limit | High earner | Verify ceiling applied |
| Missing employee | Filter/status | Check employee status |

### 4.5 Handling Manual Adjustments

**One-time Additions:**
1. Open pay run
2. Select employee
3. Click **+ Add One-Time Earning**
4. Enter type and amount
5. Save

**One-time Deductions:**
1. Same process, select **+ Add One-Time Deduction**

### 4.6 Finalizing Payroll

**Step-by-Step:**

1. Complete all reviews
2. Get required approvals
3. Click **Finalize Pay Run**
4. System locks pay run from changes
5. Click **Post to GL**
6. Payroll entries created in financials

### 4.7 Generating Payment Files

**Bank File (EFT):**
1. Go to finalized pay run
2. Click **Generate Bank File**
3. Select bank format (Standard Bank, FNB, etc.)
4. Download file
5. Upload to banking platform

**Cash Payment List:**
1. Click **Cash Payment Report**
2. Print for cash payments

### 4.8 Payslips

**Individual Payslip:**
1. Go to pay run
2. Select employee
3. Click **View Payslip**
4. Download PDF or send email

**Bulk Distribution:**
1. Go to pay run
2. Click **Distribute Payslips**
3. Choose method (Email/Portal)
4. Click **Send**

### 4.9 Practice Exercise

**Exercise 4: Process Payroll**

1. Create a pay run for February 2026
2. Calculate payroll
3. Add a R2,000 performance bonus to Thabo Mokoena
4. Review the pay run
5. Generate a payslip for Thabo

---

## Module 5: SARS Submissions (30 minutes)

### Learning Objectives
- Understand EMP201/EMP501 requirements
- Generate monthly submissions
- Process IRP5 certificates
- Handle reconciliations

---

### 5.1 Monthly EMP201

**What is EMP201?**
Monthly employer declaration to SARS for:
- PAYE deducted
- SDL payable
- UIF payable

**Due Date:** 7th of the following month

**Step-by-Step:**

1. Go to **Payroll** → **SARS** → **EMP201**
2. Select tax period
3. Review totals:
   - Total PAYE
   - Total SDL
   - Total UIF
   - Total ETI (if applicable)
4. Click **Generate EMP201**
5. Download file
6. Submit via eFiling

### 5.2 Annual EMP501 Reconciliation

**What is EMP501?**
Annual reconciliation of all employee earnings and taxes.

**Due Date:** 31 May (usually)

**Process:**
1. Go to **Payroll** → **SARS** → **EMP501**
2. Select tax year
3. Review all employees
4. Verify IRP5 codes
5. Check totals match EMP201s
6. Generate submission file
7. Submit via eFiling

### 5.3 IRP5/IT3(a) Certificates

**Generation:**
1. Go to **Payroll** → **SARS** → **IRP5 Certificates**
2. Select tax year
3. Click **Generate All**
4. Review each certificate
5. Click **Finalize**

**Distribution:**
1. Click **Distribute to Employees**
2. Employees receive via email/portal
3. Track who has downloaded

### 5.4 Common Reconciliation Issues

| Issue | Cause | Resolution |
|:------|:------|:-----------|
| EMP201 vs EMP501 mismatch | Adjustments not in monthly | Post adjustment entries |
| Missing employees | Mid-year joins | Verify all periods |
| Incorrect codes | Wrong IRP5 codes | Review and correct |
| Tax certificate errors | Manual overrides | Investigate history |

### 5.5 Practice Exercise

**Exercise 5: SARS Reports**

1. Generate an EMP201 preview for January 2026
2. Review the PAYE, UIF, and SDL totals
3. Preview an IRP5 for Thabo Mokoena

---

## Module 6: HR Reports (30 minutes)

### Learning Objectives
- Run standard HR reports
- Use report filters
- Schedule automated reports
- Export for analysis

---

### 6.1 Standard HR Reports

| Report | Purpose | Frequency |
|:-------|:--------|:----------|
| **Employee Master** | Full employee list | As needed |
| **Headcount** | Total by department | Monthly |
| **Turnover Report** | Joins/Leaves analysis | Monthly |
| **Leave Balances** | Current leave owed | Monthly |
| **Leave Liability** | Financial value of leave | Quarterly |
| **Birthday List** | Upcoming birthdays | Weekly |
| **Service Anniversaries** | Work anniversaries | Monthly |
| **Skills Matrix** | Skills inventory | Quarterly |

### 6.2 Standard Payroll Reports

| Report | Purpose | Frequency |
|:-------|:--------|:----------|
| **Payroll Register** | Full pay run details | Per pay run |
| **Cost Distribution** | By cost centre | Per pay run |
| **Variance Report** | Compare to prior | Per pay run |
| **Tax Report** | PAYE summary | Monthly |
| **Deduction Report** | All deductions | Per pay run |
| **Bank File Summary** | Payment breakdown | Per pay run |
| **EMP201 Preview** | SARS submission | Monthly |
| **Annual Tax Recon** | Year-end summary | Annually |

### 6.3 Running Reports

**Step-by-Step:**

1. Go to **Reports** → **HR** or **Payroll**
2. Select report
3. Set parameters:
   - Date range
   - Department filter
   - Employee filter
   - Grouping options
4. Click **Generate**

### 6.4 Scheduling Reports

**Step-by-Step:**

1. Go to **Reports** → **Scheduled Reports**
2. Click **+ New Schedule**
3. Configure:
   - Report name
   - Frequency
   - Recipients
   - Format (PDF/Excel)
4. Click **Save**

### 6.5 Practice Exercise

**Exercise 6: Generate Reports**

1. Run a Headcount Report by department
2. Generate a Payroll Cost Distribution report
3. Schedule a monthly Leave Balance report to be emailed

---

## Assessment Preparation

### Key Topics to Review

1. **Employee Management**
   - Record structure
   - Lifecycle events
   - Document management

2. **Leave Administration**
   - Statutory requirements (BCEA)
   - Policy configuration
   - Approval workflows

3. **Payroll Setup**
   - PAYE, UIF, SDL
   - Earnings and deductions
   - Tax tables

4. **Running Payroll**
   - Pay run process
   - Calculations
   - Exceptions

5. **SARS Compliance**
   - EMP201 (monthly)
   - EMP501 (annual)
   - IRP5 certificates

### Sample Assessment Questions

**Question 1:** What is the UIF contribution rate for employers?
- A) 0.5%
- B) 1% ✓
- C) 2%
- D) 1.5%

**Question 2:** How many days annual leave is the minimum under BCEA?
- A) 10 days
- B) 15 days ✓
- C) 21 days
- D) 30 days

**Question 3:** When is EMP201 due to SARS?
- A) 1st of the month
- B) 7th of the following month ✓
- C) 15th of the month
- D) Last day of the month

---

## Quick Reference Card

### Statutory Requirements

| Component | Rate | Ceiling |
|:----------|:-----|:--------|
| PAYE | Tax tables | None |
| UIF | 2% total | R17,712/month |
| SDL | 1% employer | None |

### Leave Entitlements (BCEA)

| Type | Days |
|:-----|:-----|
| Annual | 15-21 |
| Sick | 30/3 years |
| Family | 3/year |
| Maternity | 4 months |

### Key Navigation

| Task | Path |
|:-----|:-----|
| Add Employee | HR → Employees → + Add |
| Process Leave | HR → Leave → Applications |
| Run Payroll | Payroll → Pay Runs → + New |
| EMP201 | Payroll → SARS → EMP201 |

---

**Document:** HR & Payroll Module Training v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
