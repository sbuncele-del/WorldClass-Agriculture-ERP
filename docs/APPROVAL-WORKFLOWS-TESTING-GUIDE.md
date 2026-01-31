# 🧪 Approval Workflows - End-to-End Testing Guide

## 📋 **Test Environment Setup**

### Prerequisites:
- ✅ Backend running on http://localhost:3000
- ✅ Frontend running on http://localhost:5173
- ✅ PostgreSQL database with approval tables created
- ✅ 4 workflows seeded (Standard, Express, Executive, Adjustment)

### Test User Roles:
For testing purposes, you'll simulate different user roles:
- **Preparer** (Entry Creator)
- **Reviewer** (Level 1 Approver)
- **Finance Manager** (Level 2 Approver)
- **CFO** (Level 3 Approver)
- **CEO** (Level 4 Approver - Executive workflow only)

---

## 🧪 **Test Case 1: Standard 3-Level Approval Workflow**

### Objective:
Test the complete approval workflow from submission through all three approval levels to posting.

### Steps:

#### 1️⃣ **Create Journal Entry**

**URL:** http://localhost:5173/financial/journal-entry/new

**Actions:**
1. Fill in journal entry details:
   - Date: Today's date
   - Description: "Test Entry - Standard Approval Workflow"
   - Notes: "Testing 3-level approval process"

2. Add journal lines:
   - Line 1: Account 6100 (Operating Expenses), Debit: R 5,000
   - Line 2: Account 1100 (Bank Account), Credit: R 5,000

3. Click **"Save as Draft"**

**Expected Result:**
- ✅ Success message: "Journal entry saved as draft! (JE-XXXXXX)"
- ✅ Entry ID saved
- ✅ Approval status badge shows "DRAFT"
- ✅ "Submit for Approval" button appears

**Screenshot:** Save the entry ID (e.g., JE-000123)

---

#### 2️⃣ **Submit for Approval**

**Actions:**
1. With the entry still on screen, click **"📋 Submit for Approval"**

**Expected Result:**
- ✅ Success message: "Entry submitted for approval! Workflow: Standard Journal Entry Approval"
- ✅ Approval status changes to "⏳ Pending Approval"
- ✅ "Save as Draft" button becomes disabled
- ✅ "Post to Ledger" button becomes disabled
- ✅ Form resets after 3 seconds

**Backend Verification:**
```bash
# Check approval was created
curl http://localhost:3000/api/financial/approvals/pending | jq '.'

# Expected: Array with 1 pending approval
```

---

#### 3️⃣ **View Pending Approvals**

**URL:** http://localhost:5173/financial/approvals

**Expected Result:**
- ✅ Statistics show: Pending Total = 1
- ✅ Approval card displays:
  - Journal number (JE-XXXXXX)
  - Description: "Test Entry - Standard Approval Workflow"
  - Amount: R 5,000.00
  - Submitted by: current-user
  - Current Level: Level 1 of 3 - Reviewer
  - Days pending: 0 (or "Today")
  - Urgency badge: 🟢 Normal

---

#### 4️⃣ **Approve at Level 1 (Reviewer)**

**Actions:**
1. On the approval card, click **"✅ Approve"**
2. In the modal:
   - Verify journal details are correct
   - Add comments (optional): "Reviewed and approved. All accounts verified."
   - Click **"✅ Confirm Approval"**

**Expected Result:**
- ✅ Success alert: "Entry approved successfully!"
- ✅ Approval card disappears from pending list
- ✅ Pending total decreases to 0
- ✅ Approved today increases to 1

**Backend Verification:**
```bash
# Check approval history
curl http://localhost:3000/api/financial/approvals/history/JE-XXXXXX | jq '.'

# Expected: 2 history entries (SUBMITTED + APPROVED at Level 1)
```

---

#### 5️⃣ **Wait and Refresh for Level 2**

**Actions:**
1. Wait 5 seconds for workflow to advance
2. Refresh the page

**Expected Result:**
- ✅ Entry reappears in pending list
- ✅ Current Level: Level 2 of 3 - Finance Manager
- ✅ Required Role: Finance Manager

---

#### 6️⃣ **Approve at Level 2 (Finance Manager)**

**Actions:**
1. Click **"✅ Approve"** on the approval card
2. Add comments: "Approved. Budget allocation confirmed."
3. Click **"✅ Confirm Approval"**

**Expected Result:**
- ✅ Approval successful
- ✅ Entry moves to Level 3

**Backend Verification:**
```bash
curl http://localhost:3000/api/financial/approvals/history/JE-XXXXXX | jq '.'

# Expected: 3 history entries (SUBMITTED + 2 APPROVED)
```

---

#### 7️⃣ **Approve at Level 3 (CFO) - Final Approval**

**Actions:**
1. Refresh page to see entry at Level 3
2. Click **"✅ Approve"**
3. Add comments: "Final approval granted. Entry may be posted."
4. Click **"✅ Confirm Approval"**

**Expected Result:**
- ✅ Approval successful
- ✅ Entry disappears from pending list (fully approved!)
- ✅ Approved today count increases

**Backend Verification:**
```bash
# Check entry status
curl "http://localhost:3000/api/financial/journal-entries?status=APPROVED" | jq '.'

# Expected: Entry status is now APPROVED
```

---

#### 8️⃣ **View Approval History**

**URL:** http://localhost:5173/financial/journal-entries (if you add history view there)

Or create a dedicated approval history page and test:

**Expected Result:**
- ✅ Timeline shows 4 entries:
  1. 📤 Submitted for Approval (by preparer)
  2. ✅ Approved - Level 1: Reviewer (with comments)
  3. ✅ Approved - Level 2: Finance Manager (with comments)
  4. ✅ Approved - Level 3: CFO (with comments)
- ✅ Each entry shows:
  - Action icon and color
  - Level badge
  - Performer name
  - Timestamp
  - Comments

---

#### 9️⃣ **Post the Approved Entry**

**URL:** http://localhost:5173/financial/journal-entry/:id

**Actions:**
1. Navigate to the approved journal entry
2. Verify "Post to Ledger" button is now enabled
3. Click **"Post to Ledger"**

**Expected Result:**
- ✅ Entry successfully posted
- ✅ Status changes to "📊 Posted"
- ✅ Entry appears in Trial Balance
- ✅ Account balances updated

---

## 🧪 **Test Case 2: Rejection Workflow**

### Objective:
Test the rejection functionality and verify entry returns to preparer.

### Steps:

#### 1️⃣ **Create and Submit Entry**

Follow Test Case 1, steps 1-2 to create and submit an entry.

---

#### 2️⃣ **Reject at Level 1**

**Actions:**
1. Navigate to Pending Approvals
2. Click **"❌ Reject"** on the approval card
3. In the rejection modal:
   - Reason: "Account code incorrect. Please use 6200 for Marketing Expenses instead of 6100."
   - Click **"❌ Confirm Rejection"**

**Expected Result:**
- ✅ Success alert: "Entry rejected successfully!"
- ✅ Entry disappears from pending list
- ✅ Rejected today count increases

**Backend Verification:**
```bash
# Check approval history
curl http://localhost:3000/api/financial/approvals/history/JE-XXXXXX | jq '.'

# Expected: SUBMITTED + REJECTED entries
```

---

#### 3️⃣ **Verify Rejection Status**

**Actions:**
1. Navigate to Journal Entries List
2. Find the rejected entry

**Expected Result:**
- ✅ Entry status shows: "❌ Rejected"
- ✅ Entry cannot be posted
- ✅ Entry can be edited (preparer can fix and resubmit)

---

## 🧪 **Test Case 3: Express 1-Level Approval**

### Objective:
Test fast-track approval for routine entries.

### Steps:

#### 1️⃣ **Create Small Entry**

**Actions:**
1. Create journal entry:
   - Description: "Test Entry - Express Approval"
   - Debit: R 500 (Account 6100)
   - Credit: R 500 (Account 1100)
2. Save as draft
3. Submit for approval

**Expected Result:**
- ✅ Workflow assigned: Express Journal Entry Approval
- ✅ Only 1 approval level required

---

#### 2️⃣ **Approve at Level 1 (Supervisor)**

**Actions:**
1. Navigate to Pending Approvals
2. Verify: Level 1 of 1 - Supervisor
3. Click **"✅ Approve"**

**Expected Result:**
- ✅ Entry immediately fully approved (no Level 2 or 3)
- ✅ Entry ready to post
- ✅ Faster approval process confirmed

---

## 🧪 **Test Case 4: Executive 4-Level Approval**

### Objective:
Test highest-level approval for strategic entries.

### Steps:

#### 1️⃣ **Create High-Value Entry**

**Actions:**
1. Create journal entry:
   - Description: "Test Entry - Executive Approval (Strategic Investment)"
   - Debit: R 1,000,000 (Account 6500 - Capital Expenditure)
   - Credit: R 1,000,000 (Account 1100)
2. Save and submit

**Expected Result:**
- ✅ Workflow: Executive Journal Entry Approval
- ✅ 4 approval levels: Senior Accountant → FM → CFO → CEO

---

#### 2️⃣ **Complete All 4 Approvals**

**Actions:**
1. Approve at Level 1 (Senior Accountant)
2. Approve at Level 2 (Finance Manager)
3. Approve at Level 3 (CFO)
4. Approve at Level 4 (CEO)

**Expected Result:**
- ✅ All 4 approvals recorded
- ✅ Entry approved after CEO approval
- ✅ Full audit trail with 5 history entries (1 submit + 4 approvals)

---

## 🧪 **Test Case 5: Approval Statistics**

### Objective:
Verify dashboard statistics are accurate.

### Prerequisites:
Complete Test Cases 1-4 above.

**URL:** http://localhost:5173/financial/approvals

**Expected Result:**
- ✅ **Pending Total:** 0 (all test entries processed)
- ✅ **Approved Today:** 3 entries (Standard, Express, Executive)
- ✅ **Rejected Today:** 1 entry (Rejection test)
- ✅ **Average Approval Time:** Calculated correctly (in hours)

**Backend Verification:**
```bash
curl http://localhost:3000/api/financial/approvals/stats | jq '.'
```

---

## 🧪 **Test Case 6: UI/UX Validation**

### Objective:
Verify user interface quality and responsiveness.

### 6.1 **Pending Approvals Page**

**URL:** http://localhost:5173/financial/approvals

**Checks:**
- ✅ Page loads without errors
- ✅ Statistics cards display correctly
- ✅ Approval cards are well-formatted
- ✅ Urgency colors work (Normal/Warning/Urgent)
- ✅ Modals open and close smoothly
- ✅ Form validation works (rejection requires reason)
- ✅ Auto-refresh works (wait 30 seconds)
- ✅ Empty state shows when no approvals

---

### 6.2 **Approval History Component**

**Checks:**
- ✅ Timeline displays correctly
- ✅ Action icons are appropriate
- ✅ Colors match action types
- ✅ Comments display properly
- ✅ Timestamps are formatted correctly
- ✅ Summary stats are accurate
- ✅ Animations work smoothly

---

### 6.3 **Journal Entry Integration**

**URL:** http://localhost:5173/financial/journal-entry/new

**Checks:**
- ✅ Approval status badge appears
- ✅ "Submit for Approval" button shows after save
- ✅ Button disables when pending approval
- ✅ Form disables when approved
- ✅ Status colors are correct
- ✅ Success messages display

---

## 🧪 **Test Case 7: Error Handling**

### Objective:
Verify system handles errors gracefully.

### 7.1 **Network Errors**

**Actions:**
1. Stop backend server
2. Try to approve an entry

**Expected Result:**
- ✅ Error message displays
- ✅ User is informed of issue
- ✅ No console errors
- ✅ Page doesn't crash

---

### 7.2 **Invalid Data**

**Actions:**
1. Try to submit non-existent entry ID for approval

**Expected Result:**
- ✅ Backend returns error
- ✅ Frontend shows error message
- ✅ User can retry

---

## 🧪 **Test Case 8: Performance Testing**

### Objective:
Verify system handles multiple approvals efficiently.

### Actions:
1. Create 10 journal entries
2. Submit all 10 for approval
3. Navigate to Pending Approvals page

**Expected Result:**
- ✅ Page loads in < 2 seconds
- ✅ All 10 entries display
- ✅ Statistics are accurate
- ✅ No lag when filtering
- ✅ Smooth scrolling

---

## 📊 **Test Results Summary**

| Test Case | Status | Pass/Fail | Notes |
|-----------|--------|-----------|-------|
| TC1: Standard 3-Level Approval | ⏳ Pending | - | - |
| TC2: Rejection Workflow | ⏳ Pending | - | - |
| TC3: Express 1-Level Approval | ⏳ Pending | - | - |
| TC4: Executive 4-Level Approval | ⏳ Pending | - | - |
| TC5: Approval Statistics | ⏳ Pending | - | - |
| TC6: UI/UX Validation | ⏳ Pending | - | - |
| TC7: Error Handling | ⏳ Pending | - | - |
| TC8: Performance Testing | ⏳ Pending | - | - |

---

## 🔍 **Manual Testing Checklist**

### Pre-Test Setup:
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database migrations executed
- [ ] Workflows seeded
- [ ] Browser DevTools open (check console for errors)

### During Testing:
- [ ] Take screenshots of each step
- [ ] Check browser console for errors
- [ ] Verify network requests in DevTools
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile viewport (responsive design)

### Post-Test Validation:
- [ ] All database records correct
- [ ] No orphaned approval records
- [ ] Audit trail complete
- [ ] Performance acceptable
- [ ] No memory leaks

---

## 🐛 **Bug Report Template**

If you find issues during testing, document them:

```
**Bug Title:** [Brief description]

**Test Case:** TC-X: [Test case name]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Copy console errors]

**Severity:** Critical / High / Medium / Low

**Priority:** P0 / P1 / P2 / P3
```

---

## ✅ **Acceptance Criteria**

For approval workflows to be considered complete:

1. ✅ All 4 workflows function correctly
2. ✅ All 3 approval actions work (Approve, Reject, Recall)
3. ✅ Complete audit trail for all actions
4. ✅ UI components render without errors
5. ✅ Statistics are accurate
6. ✅ Error handling is graceful
7. ✅ Performance is acceptable (< 2s page loads)
8. ✅ Mobile responsive design works
9. ✅ All console errors resolved
10. ✅ Documentation complete

---

## 🎯 **Next Steps After Testing**

1. ✅ Fix any bugs found
2. ✅ Optimize performance issues
3. ✅ Add user permissions (role-based access)
4. ✅ Implement email notifications
5. ✅ Add workflow configuration UI (optional)
6. ✅ Update user documentation
7. ✅ Deploy to production

---

## 📞 **Support Resources**

**Backend API Docs:**
- Swagger/Postman collection (if available)
- API endpoint reference in code

**Database Schema:**
- `/backend/src/config/approval-workflows-migration.ts`

**Frontend Components:**
- `/frontend/src/modules/financial/components/PendingApprovals.tsx`
- `/frontend/src/modules/financial/components/ApprovalHistory.tsx`

**Documentation:**
- `/docs/APPROVAL-WORKFLOWS-FRONTEND-COMPLETE.md`
- `/docs/TODO-9-APPROVAL-WORKFLOWS-INTEGRATION-COMPLETE.md`

---

**Happy Testing! 🧪✨**

*Remember: Testing is not finding bugs, it's ensuring quality!*
