# Todo #9: Approval Workflows - Architecture & Design

**Status:** 🔄 In Progress  
**Start Date:** November 6, 2025  
**Module:** Financial Management - Workflow Engine

---

## 🎯 Executive Summary

The **Approval Workflow System** provides enterprise-grade control over journal entry posting through multi-level approval processes. This ensures proper segregation of duties (SOX compliance), prevents unauthorized postings, and maintains an audit trail of all approval decisions.

### Key Features
- ✅ Multi-level approval hierarchy (Preparer → Reviewer → Approver)
- ✅ Flexible workflow configuration per organization
- ✅ Email notifications for all workflow events
- ✅ Approval history audit trail
- ✅ Recall/rejection capabilities
- ✅ Escalation for overdue approvals
- ✅ Role-based access control

---

## 📊 Workflow States

### Journal Entry Lifecycle

```
DRAFT ──────► PENDING_APPROVAL ──────► APPROVED ──────► POSTED
  │                  │                     │               │
  │                  ▼                     │               ▼
  │              REJECTED ────────────────►└──────► CLOSED/VOID
  │                  │
  └──────────────────┘
         (Recall)
```

### State Definitions

| State | Description | Actions Available | Who Can Act |
|-------|-------------|-------------------|-------------|
| **DRAFT** | Entry being prepared | Edit, Delete, Submit for Approval | Preparer |
| **PENDING_APPROVAL** | Awaiting approval | Approve, Reject, Recall | Current Approver, Preparer (recall) |
| **APPROVED** | All approvals complete | Post | System/Preparer |
| **REJECTED** | Approval denied | Edit, Resubmit | Preparer |
| **POSTED** | Posted to ledger | Void (new workflow) | Authorized users |

---

## 🏗️ Database Schema

### 1. Approval Workflows Table

```sql
CREATE TABLE approval_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'JOURNAL_ENTRY', 'PAYMENT', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- Example workflow: "Standard Journal Entry Approval"
-- 3 levels: Reviewer → Senior Accountant → Finance Manager
```

### 2. Approval Levels Table

```sql
CREATE TABLE approval_levels (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES approval_workflows(id),
  level_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  level_name VARCHAR(100) NOT NULL, -- "Reviewer", "Approver", "Final Approver"
  role_required VARCHAR(100), -- Optional: link to user roles
  approver_user_id INTEGER, -- Optional: specific user
  amount_threshold DECIMAL(15,2), -- Optional: approve only if amount <= threshold
  is_mandatory BOOLEAN DEFAULT true,
  notification_enabled BOOLEAN DEFAULT true,
  escalation_hours INTEGER DEFAULT 24, -- Auto-escalate after X hours
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, level_number)
);

-- Example:
-- Level 1: Reviewer (any accountant), threshold: 100,000
-- Level 2: Finance Manager, threshold: 500,000
-- Level 3: CFO, threshold: unlimited
```

### 3. Approval History Table

```sql
CREATE TABLE approval_history (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER REFERENCES journal_entries(id),
  workflow_id INTEGER REFERENCES approval_workflows(id),
  level_id INTEGER REFERENCES approval_levels(id),
  action VARCHAR(50) NOT NULL, -- 'SUBMITTED', 'APPROVED', 'REJECTED', 'RECALLED'
  comments TEXT,
  performed_by VARCHAR(100) NOT NULL,
  performed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

-- Complete audit trail of all approval actions
```

### 4. Updates to journal_entries Table

```sql
ALTER TABLE journal_entries
ADD COLUMN approval_status VARCHAR(50) DEFAULT 'DRAFT',
ADD COLUMN workflow_id INTEGER REFERENCES approval_workflows(id),
ADD COLUMN current_approval_level INTEGER,
ADD COLUMN submitted_for_approval_at TIMESTAMP,
ADD COLUMN submitted_by VARCHAR(100),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN approved_by VARCHAR(100),
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN rejected_by VARCHAR(100),
ADD COLUMN rejection_reason TEXT;

-- Add check constraint
ALTER TABLE journal_entries
ADD CONSTRAINT chk_approval_status 
CHECK (approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'VOID'));
```

---

## 🔄 Workflow Process Flow

### 1. Submit for Approval

**Trigger:** Preparer clicks "Submit for Approval" on journal entry

**Process:**
1. Validate entry (balanced, required fields, period open)
2. Determine applicable workflow based on:
   - Entry type
   - Amount threshold
   - Organization unit
3. Set `approval_status = 'PENDING_APPROVAL'`
4. Set `current_approval_level = 1`
5. Create approval history record (action: 'SUBMITTED')
6. Send email notification to Level 1 approvers
7. Return success response

**Business Rules:**
- Entry must be balanced (debits = credits)
- All mandatory fields must be filled
- Posting period must be OPEN
- Cannot submit already approved/posted entries

### 2. Approve

**Trigger:** Approver clicks "Approve" button

**Process:**
1. Verify approver has authority for current level
2. Validate approval threshold (if applicable)
3. Create approval history record (action: 'APPROVED')
4. Check if more levels required:
   - **Yes:** Increment `current_approval_level`, notify next approver
   - **No:** Set `approval_status = 'APPROVED'`, notify preparer
5. Auto-post if configured (optional)
6. Return success response

**Business Rules:**
- User must have approval authority for current level
- Cannot approve own entries (4-eyes principle)
- Approval amount must be within user's threshold
- Previous levels must be approved

### 3. Reject

**Trigger:** Approver clicks "Reject" button

**Process:**
1. Verify approver has authority
2. Require rejection reason (comments)
3. Set `approval_status = 'REJECTED'`
4. Create approval history record (action: 'REJECTED')
5. Send email notification to preparer
6. Reset `current_approval_level = NULL`
7. Return success response

**Business Rules:**
- Rejection reason is mandatory
- Entry returns to DRAFT or REJECTED state
- Preparer can edit and resubmit
- All approval progress is lost

### 4. Recall

**Trigger:** Preparer clicks "Recall" button

**Process:**
1. Verify user is original preparer
2. Validate entry is in PENDING_APPROVAL state
3. Set `approval_status = 'DRAFT'`
4. Create approval history record (action: 'RECALLED')
5. Send notification to approvers (FYI)
6. Reset `current_approval_level = NULL`
7. Return success response

**Business Rules:**
- Only original preparer can recall
- Can only recall if not yet fully approved
- Allows corrections without rejection

### 5. Auto-Escalation (Background Job)

**Trigger:** Scheduled task (runs every hour)

**Process:**
1. Query entries in PENDING_APPROVAL state
2. Check if time since last action > escalation_hours
3. For each overdue entry:
   - Send reminder email to current approver
   - Send escalation email to next level approver
   - Create escalation log entry
4. Update escalation count

**Business Rules:**
- First escalation: Reminder to current approver
- Second escalation: Notify supervisor
- Third escalation: Notify department head
- Configurable escalation intervals

---

## 🎨 UI Components

### 1. Pending Approvals Dashboard

**Location:** `/financial/approvals/pending`

**Features:**
- List of all entries pending user's approval
- Filterable by: Date range, Amount, Preparer, Priority
- Sortable by: Date, Amount, Days pending
- Quick approve/reject actions
- Bulk approval capability
- Visual indicators:
  - 🟢 Normal priority (< 24 hours old)
  - 🟡 Medium priority (24-48 hours old)
  - 🔴 High priority (> 48 hours old)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  📋 Pending Approvals (12)                              │
├─────────────────────────────────────────────────────────┤
│  Filters: [Date Range] [Amount] [Preparer] [Clear]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔴 JE-2025-0123  │  Office Expenses  │  R 15,500.00   │
│     Nov 4, 2025   │  John Smith       │  2 days ago    │
│     [View] [Approve] [Reject]                           │
│  ─────────────────────────────────────────────────────  │
│  🟡 JE-2025-0124  │  Salaries         │  R 125,000.00  │
│     Nov 5, 2025   │  Jane Doe         │  1 day ago     │
│     [View] [Approve] [Reject]                           │
│  ─────────────────────────────────────────────────────  │
│  🟢 JE-2025-0125  │  Utilities        │  R 3,200.00    │
│     Nov 6, 2025   │  Bob Johnson      │  2 hours ago   │
│     [View] [Approve] [Reject]                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Approval Action Modal

**Triggered by:** Click "Approve" or "Reject" button

**Approve Modal:**
```
┌───────────────────────────────────────┐
│  ✅ Approve Journal Entry              │
├───────────────────────────────────────┤
│  Journal: JE-2025-0123                 │
│  Amount: R 15,500.00                   │
│  Preparer: John Smith                  │
│                                        │
│  Comments (optional):                  │
│  ┌─────────────────────────────────┐  │
│  │ Approved - looks good           │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [Cancel]          [✅ Approve]        │
└───────────────────────────────────────┘
```

**Reject Modal:**
```
┌───────────────────────────────────────┐
│  ❌ Reject Journal Entry               │
├───────────────────────────────────────┤
│  Journal: JE-2025-0123                 │
│  Amount: R 15,500.00                   │
│  Preparer: John Smith                  │
│                                        │
│  Reason for Rejection (required): *    │
│  ┌─────────────────────────────────┐  │
│  │ Missing supporting documents    │  │
│  │                                 │  │
│  └─────────────────────────────────┘  │
│                                        │
│  [Cancel]          [❌ Reject]         │
└───────────────────────────────────────┘
```

### 3. Approval History Timeline

**Location:** Journal entry detail page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  📜 Approval History                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ⏺ APPROVED by Jane Manager                            │
│    Nov 6, 2025 10:15 AM                                 │
│    Level 2: Finance Manager                             │
│    Comments: "Approved"                                 │
│                                                          │
│  ⏺ APPROVED by Bob Reviewer                            │
│    Nov 6, 2025 09:30 AM                                 │
│    Level 1: Reviewer                                    │
│    Comments: "Reviewed and approved"                    │
│                                                          │
│  ⏺ SUBMITTED by John Smith                             │
│    Nov 6, 2025 08:45 AM                                 │
│    Initial submission for approval                      │
│                                                          │
│  ⏺ CREATED by John Smith                               │
│    Nov 5, 2025 04:30 PM                                 │
│    Entry created in DRAFT state                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 4. Workflow Status Badge

**Component:** Display on journal entry cards/lists

**States:**
```css
DRAFT            → Gray badge
PENDING_APPROVAL → Orange badge (pulsing animation)
APPROVED         → Green badge
REJECTED         → Red badge
POSTED           → Blue badge
```

### 5. My Submitted Entries

**Location:** `/financial/approvals/my-submissions`

**Features:**
- List of entries user submitted for approval
- Filter by status (Pending, Approved, Rejected)
- Recall capability for pending entries
- Resubmit capability for rejected entries

---

## 🔌 API Endpoints

### Approval Workflow Management

```typescript
// Get all workflows
GET /api/financial/approvals/workflows

// Get specific workflow
GET /api/financial/approvals/workflows/:id

// Create workflow (admin only)
POST /api/financial/approvals/workflows

// Update workflow (admin only)
PUT /api/financial/approvals/workflows/:id

// Delete workflow (admin only)
DELETE /api/financial/approvals/workflows/:id
```

### Approval Actions

```typescript
// Submit journal entry for approval
POST /api/financial/approvals/submit/:journalEntryId
Body: { workflowId?: number } // Optional, auto-detect if not provided

// Approve entry
POST /api/financial/approvals/approve/:journalEntryId
Body: { comments?: string }

// Reject entry
POST /api/financial/approvals/reject/:journalEntryId
Body: { reason: string } // Required

// Recall entry
POST /api/financial/approvals/recall/:journalEntryId
Body: { reason?: string }
```

### Approval Queries

```typescript
// Get entries pending MY approval
GET /api/financial/approvals/pending
Query: ?status=all|normal|escalated&limit=50

// Get MY submitted entries
GET /api/financial/approvals/my-submissions
Query: ?status=pending|approved|rejected|all

// Get approval history for entry
GET /api/financial/approvals/history/:journalEntryId

// Get approval statistics
GET /api/financial/approvals/stats
Response: {
  pending_my_approval: 5,
  pending_total: 12,
  approved_today: 8,
  rejected_today: 2,
  average_approval_time_hours: 6.5
}
```

---

## 📧 Email Notifications

### 1. New Approval Request

**To:** Current level approvers  
**Trigger:** Entry submitted for approval or previous level approved

**Template:**
```
Subject: New Journal Entry Awaiting Your Approval - JE-2025-0123

Hi [Approver Name],

A journal entry has been submitted and requires your approval:

Journal Number: JE-2025-0123
Amount: R 15,500.00
Description: Office expenses for October
Preparer: John Smith
Submitted: Nov 6, 2025 08:45 AM

Current Approval Level: Level 1 - Reviewer
Your Action Required: Approve or Reject

[View Entry] [Approve] [Reject]

Please review and approve within 24 hours.

---
Worldclass ERP - Automated Notification
```

### 2. Approval Granted

**To:** Preparer  
**Trigger:** Entry approved at current level

**Template:**
```
Subject: Journal Entry Approved - JE-2025-0123

Hi [Preparer Name],

Good news! Your journal entry has been approved:

Journal Number: JE-2025-0123
Approved By: Bob Reviewer (Level 1)
Approved At: Nov 6, 2025 09:30 AM
Comments: "Reviewed and approved"

Status: Approved and ready to post
Next Step: Entry will be posted automatically

[View Entry]

---
Worldclass ERP - Automated Notification
```

### 3. Entry Rejected

**To:** Preparer  
**Trigger:** Entry rejected by approver

**Template:**
```
Subject: Journal Entry Rejected - JE-2025-0123

Hi [Preparer Name],

Your journal entry has been rejected and requires revision:

Journal Number: JE-2025-0123
Rejected By: Bob Reviewer
Rejected At: Nov 6, 2025 09:45 AM

Reason for Rejection:
"Missing supporting documents for office expenses claim. 
Please attach invoices and resubmit."

Next Step: Edit the entry, address the issues, and resubmit for approval.

[View Entry] [Edit Entry]

---
Worldclass ERP - Automated Notification
```

### 4. Escalation Alert

**To:** Next level approver + Supervisor  
**Trigger:** Entry pending > escalation hours

**Template:**
```
Subject: ESCALATION - Overdue Approval - JE-2025-0123

Hi [Supervisor Name],

A journal entry has been pending approval for over 48 hours:

Journal Number: JE-2025-0123
Amount: R 15,500.00
Preparer: John Smith
Submitted: Nov 4, 2025 08:45 AM (2 days ago)
Current Approver: Bob Reviewer (Level 1)

This entry requires immediate attention to avoid processing delays.

[View Entry] [Take Action]

---
Worldclass ERP - Escalation Alert
```

---

## 🔒 Security & Compliance

### SOX Compliance

✅ **Segregation of Duties:** Preparer ≠ Approver  
✅ **Approval Authority:** Role-based approval limits  
✅ **Audit Trail:** Complete history of all actions  
✅ **Non-Repudiation:** User ID + timestamp + IP address  
✅ **Restricted Editing:** No changes during approval  

### Access Control

```typescript
interface ApprovalPermissions {
  canSubmitForApproval: boolean;  // Preparers
  canApproveLevel1: boolean;       // Reviewers
  canApproveLevel2: boolean;       // Finance Managers
  canApproveLevel3: boolean;       // CFO/Directors
  canRecall: boolean;              // Original preparer only
  canViewAll: boolean;             // Finance managers
  canConfigureWorkflows: boolean;  // System admins
}
```

### Business Rules Enforcement

1. **4-Eyes Principle:** Cannot approve own entries
2. **Amount Thresholds:** Higher amounts require higher approval levels
3. **Period Lock:** Cannot approve entries in locked periods
4. **Balance Check:** Entry must balance before submission
5. **Sequential Approval:** Levels must be approved in order
6. **Immutability:** No edits during approval process

---

## 📊 Reporting & Analytics

### Approval Metrics Dashboard

**KPIs:**
- Average approval time (by level, by preparer, by approver)
- Approval backlog (current pending count)
- Rejection rate (% of entries rejected)
- Escalation rate (% of entries escalated)
- Top approvers (by volume)
- Top preparers (by volume)
- Bottleneck analysis (which level takes longest)

**Charts:**
- Approval time trend (line chart)
- Entries by status (pie chart)
- Approval volume by day (bar chart)
- Rejection reasons (word cloud)

---

## 🚀 Implementation Phases

### Phase 1: Core Workflow (Week 1)
- ✅ Database schema
- ✅ Basic workflow controller
- ✅ Submit/Approve/Reject API
- ✅ Pending approvals UI
- ✅ Status badges

### Phase 2: Enhanced Features (Week 2)
- ✅ Approval history timeline
- ✅ My submissions page
- ✅ Recall functionality
- ✅ Email notifications

### Phase 3: Advanced Features (Week 3)
- ✅ Auto-escalation
- ✅ Bulk approvals
- ✅ Workflow configuration UI
- ✅ Analytics dashboard

### Phase 4: Optimization (Week 4)
- ✅ Performance tuning
- ✅ Mobile responsive design
- ✅ User training materials
- ✅ Go-live preparation

---

## 💰 Business Value

### Time Savings
- **Manual approval tracking:** 2-3 hours/day → **Automated**
- **Chasing approvals:** 1-2 hours/day → **Email notifications**
- **Audit trail compilation:** 4-8 hours/month → **Instant reports**

**Total:** 15-20 hours/week saved = R40K-R50K/month

### Risk Mitigation
- **Unauthorized postings:** Prevented
- **Audit failures:** Eliminated
- **Compliance violations:** Avoided
- **Fraud risk:** Significantly reduced

**Estimated risk reduction:** R500K-R2M/year

### Compliance Benefits
- ✅ SOX Section 404 compliance
- ✅ King IV Principle 15 (Assurance)
- ✅ SARS audit readiness
- ✅ IFRS disclosure requirements
- ✅ Internal control effectiveness

---

## 🎯 Success Criteria

- [ ] All journal entries require approval before posting
- [ ] Average approval time < 24 hours
- [ ] Zero unauthorized postings
- [ ] 100% audit trail coverage
- [ ] < 10% rejection rate
- [ ] User satisfaction > 85%
- [ ] System uptime > 99.5%

---

**Next Steps:** Begin Phase 1 implementation!

*Document Version: 1.0*  
*Last Updated: November 6, 2025*  
*Author: AI Development Team*
