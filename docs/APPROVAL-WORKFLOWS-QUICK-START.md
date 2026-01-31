# Approval Workflows - Quick Start & Testing Guide

## 🚀 Quick Start

### Start the System

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend runs on: `http://localhost:3000`

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

3. **Verify Database**
   ```bash
   psql -d worldclass_erp -c "SELECT * FROM approval_workflows;"
   ```
   Should show 4 workflows: Express, Standard, Executive, Adjustment

---

## 🧪 Testing Guide

### Test 1: Submit Entry for Approval (< R10K - Express Workflow)

**Steps:**
1. Navigate to: `http://localhost:5173/financial/journal-entry/new`
2. Fill in journal entry:
   - Date: Today's date
   - Description: "Office supplies purchase"
   - Line 1: Account 6100 (Office Expenses), Debit: R5,000
   - Line 2: Account 1100 (Cash), Credit: R5,000
3. Click **"Save as Draft"**
4. Wait for success message showing entry ID
5. Click **"📋 Submit for Approval"**
6. Verify success message: "Entry submitted for approval! Workflow: Express Approval"
7. Note the status badge changes to **"⏳ Pending Approval"**

**Expected Result:**
✅ Entry saved with status PENDING_APPROVAL  
✅ Express workflow assigned (1 level)  
✅ Submit button disappears  
✅ Form becomes read-only  

---

### Test 2: View Pending Approvals

**Steps:**
1. Navigate to: `http://localhost:5173/financial/approvals`
2. Verify dashboard displays:
   - Statistics cards showing metrics
   - Pending entry card with:
     - 🟢 Green priority indicator
     - Journal number (JNL-2025-XXX)
     - Level badge: "Level 1: Supervisor"
     - Amount: R5,000
     - Description, date, submitter info

**Expected Result:**
✅ Dashboard loads successfully  
✅ Entry appears in pending list  
✅ Statistics show "1 Pending"  
✅ Priority is NORMAL (< 24h, < R1M)  

---

### Test 3: Approve Entry

**Steps:**
1. On the pending entry card, click **"Approve"**
2. Modal opens with entry details
3. Add optional comment: "Approved - budget available"
4. Click **"Confirm Approval"**
5. Verify success message
6. Entry disappears from pending list
7. Statistics update: "Pending" decreases, "Approved Today" increases

**Expected Result:**
✅ Approval successful  
✅ Entry removed from pending list  
✅ Status changed to APPROVED  
✅ Statistics updated  

---

### Test 4: Standard Workflow (R10K - R1M)

**Steps:**
1. Create new journal entry with total **R50,000**
   - Line 1: Account 5100 (Rent), Debit: R50,000
   - Line 2: Account 1100 (Cash), Credit: R50,000
2. Save as draft
3. Submit for approval
4. Verify workflow message: "Workflow: Standard Approval"
5. Navigate to Approvals dashboard
6. Entry shows **"Level 1: Reviewer"**
7. Approve as Reviewer
8. Entry advances to **"Level 2: Finance Manager"**
9. Approve as Finance Manager
10. Entry advances to **"Level 3: CFO"**
11. Approve as CFO
12. Entry status: **APPROVED**

**Expected Result:**
✅ Standard workflow (3 levels) assigned  
✅ Sequential approval through all levels  
✅ Current level updates after each approval  
✅ Final status: APPROVED  

---

### Test 5: Executive Workflow (> R1M)

**Steps:**
1. Create journal entry with total **R2,000,000**
   - Line 1: Account 1500 (Equipment), Debit: R2,000,000
   - Line 2: Account 2100 (Accounts Payable), Credit: R2,000,000
2. Submit for approval
3. Verify workflow: "Executive Approval"
4. Entry shows **"Level 1: Senior Manager"**
5. Approve through 4 levels:
   - Level 1: Senior Manager
   - Level 2: Finance Manager
   - Level 3: CFO
   - Level 4: CEO
6. Verify status: **APPROVED**

**Expected Result:**
✅ Executive workflow (4 levels) assigned  
✅ Entry shows 🔴 Red priority (high value)  
✅ All 4 levels must approve  
✅ Final status: APPROVED  

---

### Test 6: Rejection Flow

**Steps:**
1. Create and submit any entry
2. Navigate to Approvals dashboard
3. Click **"Reject"** on pending entry
4. Try to submit without reason
   - Verify error: "Reason is required"
5. Enter reason: "Missing supporting invoice"
6. Click **"Reject Entry"**
7. Verify success message
8. Entry disappears from pending list
9. Navigate to journal entries list
10. Find the entry, verify status badge: **"❌ Rejected"**

**Expected Result:**
✅ Rejection reason is mandatory  
✅ Entry status changed to REJECTED  
✅ Rejection reason stored in history  
✅ Entry removed from pending approvals  

---

### Test 7: Approval History Timeline

**Steps:**
1. On any entry (submitted, approved, or rejected)
2. Click **"View History"**
3. Modal displays timeline with:
   - Submission action (who, when)
   - Approval actions (level, user, timestamp, comments)
   - OR Rejection action (reason displayed)
4. Verify timeline shows:
   - Colored markers (green for approval, red for rejection)
   - User names and timestamps
   - Optional comments
   - Level information

**Expected Result:**
✅ Complete audit trail displayed  
✅ All actions logged with user/timestamp  
✅ Comments and reasons visible  
✅ Timeline sorted chronologically  

---

### Test 8: Priority Filtering

**Steps:**
1. Create 3 entries and submit:
   - Entry A: R5,000 (Normal)
   - Entry B: R50,000 (Normal, but will become Medium after 24h)
   - Entry C: R2,000,000 (High value = High priority)
2. Navigate to Approvals dashboard
3. Use priority filter dropdown:
   - Select "HIGH" → See only Entry C (🔴)
   - Select "MEDIUM" → See entries pending 24-48h (🟡)
   - Select "NORMAL" → See entries <24h and <R1M (🟢)
   - Select "ALL" → See all entries

**Expected Result:**
✅ Filter works correctly  
✅ High-value entries (>R1M) always show as HIGH  
✅ Time-based priority updates (24h=MEDIUM, 48h=HIGH)  
✅ Color indicators match priority  

---

### Test 9: 4-Eyes Principle

**Steps:**
1. Create entry as User A (user_id: "user-a")
2. Submit for approval
3. Attempt to approve as User A
4. Verify error: "Cannot approve own entry" or similar

**Expected Behavior:**
✅ Preparer cannot approve their own entry  
✅ Error message displayed  
✅ Approval only succeeds with different user_id  

*Note: Currently using placeholder user_id "current-user". Will need to implement actual auth context.*

---

### Test 10: Post Approved Entry

**Steps:**
1. Create and submit entry
2. Approve through all workflow levels
3. Navigate back to Journal Entry form
4. Status badge shows: **"✅ Approved"**
5. Click **"Post to Ledger"**
6. Verify success message
7. Status badge changes to: **"📊 Posted"**
8. Verify entry appears in Trial Balance
9. Verify GL account balances updated

**Expected Result:**
✅ Approved entry can be posted  
✅ Posting updates GL balances  
✅ Status changes to POSTED  
✅ Entry visible in Trial Balance  

---

## 🔍 Verification Checklist

After testing, verify:

- [ ] All 4 workflows auto-select correctly based on amount
- [ ] Approval statistics update in real-time
- [ ] Priority indicators display correctly (🟢🟡🔴)
- [ ] Approval history shows complete timeline
- [ ] Rejection requires mandatory reason
- [ ] Submit for Approval button appears only for drafts
- [ ] Form becomes read-only when pending approval
- [ ] Status badges display correct colors
- [ ] Navigation link works: Financial → Approvals
- [ ] Responsive design works on mobile/tablet
- [ ] No console errors in browser
- [ ] No API errors in backend logs

---

## 📊 Database Verification

Check data was created correctly:

```sql
-- View all workflows
SELECT * FROM approval_workflows ORDER BY id;

-- View approval levels for Standard workflow
SELECT al.* 
FROM approval_levels al
JOIN approval_workflows aw ON al.workflow_id = aw.id
WHERE aw.name = 'Standard Approval'
ORDER BY al.level_number;

-- View pending approvals
SELECT je.journal_number, je.description, je.total_amount, 
       je.approval_status, je.current_approval_level,
       aw.name as workflow_name
FROM journal_entries je
LEFT JOIN approval_workflows aw ON je.workflow_id = aw.id
WHERE je.approval_status = 'PENDING_APPROVAL';

-- View approval history
SELECT ah.*, 
       je.journal_number,
       al.level_name
FROM approval_history ah
JOIN journal_entries je ON ah.journal_entry_id = je.id
JOIN approval_levels al ON ah.approval_level_id = al.id
ORDER BY ah.created_at DESC
LIMIT 20;

-- View approval statistics
SELECT 
  approval_status,
  COUNT(*) as count,
  SUM(total_amount) as total_value
FROM journal_entries
WHERE approval_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')
GROUP BY approval_status;
```

---

## 🐛 Troubleshooting

### Issue: Submit for Approval button not showing

**Possible Causes:**
- Entry not saved as draft yet
- Entry already submitted
- State not updated after save

**Solution:**
- Check browser console for errors
- Verify `savedEntryId` state is set
- Verify `approvalStatus` = 'DRAFT'

### Issue: Approval not advancing to next level

**Possible Causes:**
- Incorrect current_approval_level
- Missing approval level configuration
- Database constraint error

**Solution:**
```sql
-- Check current level
SELECT current_approval_level, workflow_id FROM journal_entries WHERE id = 'entry-id';

-- Check next level exists
SELECT * FROM approval_levels WHERE workflow_id = 'workflow-id' AND level_number = 2;
```

### Issue: Priority not showing correctly

**Possible Causes:**
- hours_pending calculation error
- Priority logic incorrect

**Solution:**
- Check timestamp: `submitted_at` should be in past
- High-value entries (>R1M) should always show HIGH
- Time-based: <24h=NORMAL, 24-48h=MEDIUM, >48h=HIGH

---

## 📝 Test Results Template

```
Test Date: _______________
Tester: _______________

┌─────────────────────────────────────────────┬──────┬────────┐
│ Test Case                                   │ Pass │ Notes  │
├─────────────────────────────────────────────┼──────┼────────┤
│ 1. Submit Entry (Express Workflow)          │ [ ]  │        │
│ 2. View Pending Approvals                   │ [ ]  │        │
│ 3. Approve Entry                            │ [ ]  │        │
│ 4. Standard Workflow (3 levels)             │ [ ]  │        │
│ 5. Executive Workflow (4 levels)            │ [ ]  │        │
│ 6. Rejection Flow                           │ [ ]  │        │
│ 7. Approval History Timeline                │ [ ]  │        │
│ 8. Priority Filtering                       │ [ ]  │        │
│ 9. 4-Eyes Principle                         │ [ ]  │        │
│ 10. Post Approved Entry                     │ [ ]  │        │
└─────────────────────────────────────────────┴──────┴────────┘

Overall Result: ⬜ PASS  ⬜ FAIL  ⬜ PARTIAL

Issues Found:
_________________________________________________________________
_________________________________________________________________

Recommendations:
_________________________________________________________________
_________________________________________________________________
```

---

## 🎯 Success Criteria

The approval workflow system is **production-ready** when:

✅ All 10 test cases pass  
✅ No critical bugs found  
✅ Performance is acceptable (<200ms API response)  
✅ UI is responsive on all devices  
✅ Audit trail is complete and accurate  
✅ Business rules are enforced correctly  
✅ User training completed  
✅ Documentation reviewed and approved  

---

## 🚀 Ready to Deploy!

Once testing is complete and all issues resolved:

1. ✅ Run final database migration on production
2. ✅ Build frontend and backend for production
3. ✅ Deploy to production environment
4. ✅ Smoke test in production
5. ✅ Enable for pilot users
6. ✅ Monitor logs and performance
7. ✅ Collect user feedback
8. ✅ Roll out to all users

**Good luck with testing!** 🎉
