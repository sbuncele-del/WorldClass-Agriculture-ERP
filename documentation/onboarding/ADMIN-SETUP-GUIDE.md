# SiyaBusa ERP - Administrator Setup Guide

## Complete Guide for System Administrators

---

## Overview

This guide helps administrators set up SiyaBusa ERP for their organization. Follow these steps in order for the best results.

**Estimated Time:** 2-4 hours for initial setup

---

## Prerequisites

Before starting, ensure you have:

- ☐ Administrator login credentials
- ☐ Company registration details (name, registration number)
- ☐ Tax information (VAT number, PAYE reference)
- ☐ Banking details for payment processing
- ☐ List of users to be added
- ☐ Company logo (PNG or JPG, min 200x200px)

---

## Phase 1: Company Profile Setup

### Step 1.1: Access Admin Settings

1. Log in with your administrator account
2. Click **Settings** (gear icon) in the side menu
3. Select **Company Settings**

### Step 1.2: Basic Company Information

Complete all fields:

| Field | Description | Example |
|:------|:------------|:--------|
| **Company Name** | Legal registered name | ABC Trading (Pty) Ltd |
| **Trading As** | Trading name if different | ABC Solutions |
| **Registration Number** | CIPC registration | 2020/123456/07 |
| **VAT Number** | If VAT registered | 4123456789 |
| **Physical Address** | Street address | 123 Main Street, Sandton |
| **Postal Address** | Postal address | PO Box 123, Sandton, 2196 |
| **Phone** | Main contact number | +27 11 123 4567 |
| **Email** | General company email | info@company.co.za |
| **Website** | Company website | www.company.co.za |

### Step 1.3: Upload Company Logo

1. Click **Upload Logo**
2. Select your logo file (PNG or JPG)
3. Crop if necessary
4. Click **Save**

Your logo will appear on:
- Login screen
- Dashboard header
- All printed documents (invoices, reports)
- Email communications

### Step 1.4: Financial Year Settings

Configure your financial year:

| Setting | Options | Notes |
|:--------|:--------|:------|
| **Year End Month** | January - December | Most SA companies: February |
| **Year End Day** | 1-31 | Usually last day of month |
| **First Period** | Date | Start of current financial year |

---

## Phase 2: Tax & Compliance Setup

### Step 2.1: SARS Configuration

Navigate to **Settings → Tax Configuration**

| Field | Description |
|:------|:------------|
| **Tax Type** | VAT / Non-VAT |
| **VAT Registration** | Your VAT number |
| **Tax Rate** | 15% (current SA rate) |
| **Filing Frequency** | Monthly / Bi-monthly |
| **eFiling Username** | For SARS integration |

### Step 2.2: PAYE Setup (if applicable)

| Field | Description |
|:------|:------------|
| **PAYE Reference** | SARS employer reference |
| **SDL Number** | Skills Development Levy |
| **UIF Reference** | Unemployment Insurance |
| **COIDA Number** | Compensation for injuries |

### Step 2.3: Industry-Specific Compliance

Enable relevant modules:
- ☐ **Healthcare** - HPCSA compliance
- ☐ **Mining** - DMRE requirements
- ☐ **Construction** - CIDB integration
- ☐ **Financial Services** - FICA compliance

---

## Phase 3: User Management

### Step 3.1: Understanding Roles

SiyaBusa uses role-based access control:

| Role | Access Level | Typical Users |
|:-----|:-------------|:--------------|
| **Administrator** | Full system access | IT Admin, Owner |
| **Manager** | Module + reporting | Department heads |
| **Standard User** | Assigned modules only | Staff |
| **Read-Only** | View only | Auditors |
| **Custom** | Defined permissions | Specific needs |

### Step 3.2: Creating User Accounts

1. Go to **Settings → User Management**
2. Click **+ Add User**
3. Complete the form:

| Field | Required | Description |
|:------|:---------|:------------|
| **Email** | Yes | User's work email |
| **First Name** | Yes | Legal first name |
| **Last Name** | Yes | Legal surname |
| **Role** | Yes | Select from dropdown |
| **Department** | No | For organization |
| **Manager** | No | For approval workflows |
| **Phone** | No | For notifications |

4. Click **Create User**
5. User receives welcome email with login link

### Step 3.3: Bulk User Import

For many users, use CSV import:

1. Download the template: **User Management → Import → Download Template**
2. Fill in user details in Excel
3. Save as CSV
4. Upload: **User Management → Import → Upload CSV**
5. Review and confirm

### Step 3.4: Setting Permissions

For each user or role:

1. Select the user/role
2. Click **Permissions**
3. Enable/disable modules:

```
☑ Dashboard      ☑ View  ☑ Edit  ☐ Delete  ☐ Admin
☑ Financial      ☑ View  ☑ Edit  ☐ Delete  ☐ Admin
☐ HR & Payroll   (no access)
☑ Inventory      ☑ View  ☐ Edit  ☐ Delete  ☐ Admin
```

---

## Phase 4: Module Configuration

### Step 4.1: Chart of Accounts

Navigate to **Financial → Setup → Chart of Accounts**

**Option A: Use SA Template**
1. Click **Load Template**
2. Select **South African Standard**
3. Review accounts
4. Click **Apply**

**Option B: Custom Setup**
1. Click **+ Add Account**
2. Define account structure
3. Repeat for all accounts

### Step 4.2: Bank Account Setup

1. Go to **Financial → Setup → Bank Accounts**
2. Click **+ Add Bank Account**
3. Enter details:

| Field | Example |
|:------|:--------|
| **Bank Name** | First National Bank |
| **Account Name** | ABC Trading Main Account |
| **Account Number** | 62123456789 |
| **Branch Code** | 250655 |
| **Account Type** | Current Account |
| **Currency** | ZAR |

### Step 4.3: Tax Codes

Set up your tax codes:

| Code | Description | Rate | Type |
|:-----|:------------|:-----|:-----|
| **VAT** | Standard Rate VAT | 15% | Output |
| **VAT-I** | VAT Input | 15% | Input |
| **ZERO** | Zero Rated | 0% | Exempt |
| **EXEMPT** | VAT Exempt | 0% | Exempt |

### Step 4.4: Numbering Sequences

Configure document numbering:

| Document | Prefix | Starting Number | Example |
|:---------|:-------|:----------------|:--------|
| Invoice | INV- | 1001 | INV-1001 |
| Quote | QT- | 1001 | QT-1001 |
| Purchase Order | PO- | 1001 | PO-1001 |
| Payment | PAY- | 1001 | PAY-1001 |

---

## Phase 5: Workflow Configuration

### Step 5.1: Approval Workflows

Set up approval chains:

**Example: Purchase Order Approval**

| Amount Range | Approver |
|:-------------|:---------|
| R0 - R5,000 | Team Lead |
| R5,001 - R25,000 | Department Manager |
| R25,001 - R100,000 | Finance Director |
| R100,001+ | CEO |

### Step 5.2: Notification Rules

Configure who gets notified:

| Event | Notify | Method |
|:------|:-------|:-------|
| New approval request | Approver | Email + In-app |
| Approval complete | Requester | Email |
| Rejection | Requester | Email + In-app |
| Overdue approval | Approver + Manager | Email |

---

## Phase 6: Integration Setup

### Step 6.1: Email Configuration

For sending emails from SiyaBusa:

| Setting | Value |
|:--------|:------|
| **From Name** | ABC Trading |
| **From Email** | erp@company.co.za |
| **Reply To** | support@company.co.za |

### Step 6.2: Payment Gateway (Optional)

For online payments:

1. Go to **Settings → Integrations → Payment Gateway**
2. Select provider (PayGate, PayFast, etc.)
3. Enter API credentials
4. Test with sandbox mode
5. Go live

### Step 6.3: SARS eFiling Integration

For SARS submission:

1. Go to **Settings → Integrations → SARS**
2. Enter eFiling credentials
3. Test connection
4. Enable auto-submission (optional)

---

## Phase 7: Data Migration

### Step 7.1: Opening Balances

Enter opening balances for:
- ☐ Bank accounts
- ☐ Customer balances (AR)
- ☐ Supplier balances (AP)
- ☐ Inventory quantities
- ☐ Asset register
- ☐ General ledger accounts

### Step 7.2: Master Data Import

Import existing data:

| Data Type | Format | Template |
|:----------|:-------|:---------|
| Customers | CSV | Download template |
| Suppliers | CSV | Download template |
| Products | CSV | Download template |
| Employees | CSV | Download template |

### Step 7.3: Historical Transactions (Optional)

Decide whether to import:
- Current year transactions only
- Last 2-3 years for reporting
- Just opening balances

---

## Phase 8: Go-Live Checklist

### Pre-Go-Live

☐ All users created and tested login  
☐ Chart of accounts reviewed and approved  
☐ Opening balances entered and balanced  
☐ Bank accounts linked  
☐ Tax configuration verified  
☐ Document templates customized  
☐ Approval workflows tested  
☐ Email sending tested  
☐ At least one test transaction per module  
☐ Backup strategy confirmed  

### Go-Live Day

☐ Communicate go-live to all users  
☐ Support team on standby  
☐ Monitor system performance  
☐ Collect and address user issues  
☐ End-of-day reconciliation  

### Post-Go-Live (Week 1)

☐ Daily check-ins with key users  
☐ Review and resolve logged issues  
☐ Fine-tune permissions  
☐ Adjust workflows if needed  
☐ Schedule first training refresher  

---

## Maintenance Tasks

### Daily
- ☐ Review failed job notifications
- ☐ Check system alerts

### Weekly
- ☐ Review user access requests
- ☐ Check disk/storage usage
- ☐ Review error logs

### Monthly
- ☐ Deactivate unused accounts
- ☐ Review permission changes
- ☐ Update documentation
- ☐ Security audit

### Annually
- ☐ Full access review
- ☐ Archive old data
- ☐ Update compliance settings
- ☐ Renew integrations/certificates

---

## Support & Resources

**Administrator Support Line:** +27 74 012 6873  
**Technical Support Email:** support@siyabusa.co.za  
**Knowledge Base:** help.siyabusa.co.za  
**Admin Documentation:** docs.siyabusa.co.za/admin

---

**Document:** Administrator Setup Guide v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
