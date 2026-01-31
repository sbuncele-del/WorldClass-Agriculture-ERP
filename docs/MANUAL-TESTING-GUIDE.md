# 🧪 MANUAL END-TO-END TESTING GUIDE

## Prerequisites

Before testing, ensure:
1. ✅ PostgreSQL 16 is running
2. ✅ Database is created and seeded
3. ✅ Backend server is running on port 3000
4. ✅ Frontend server is running on port 5173

---

## 🚀 START THE SERVERS

### Terminal 1 - Backend
```bash
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /backend"
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3000
📊 ERP System initialized
```

### Terminal 2 - Frontend
```bash
cd "/Users/sibusisomavuso/Desktop/Worldclass ERP Software /frontend"
npm run dev
```

**Expected Output:**
```
VITE v7.2.1  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 📊 TEST 1: DOUBLE-ENTRY POSTING & TRIAL BALANCE

### 1.1 Create Journal Entry

1. **Open:** `http://localhost:5173/financial/journal-entry/new`

2. **Fill in the form:**
   - **Date:** 2025-11-06
   - **Description:** "Test double-entry posting"
   - **Line 1:**
     - Account Code: `6100` (Office Expenses)
     - Description: "Office supplies"
     - Debit Amount: `5000`
   - **Line 2:**
     - Account Code: `1100` (Cash)
     - Description: "Cash payment"
     - Credit Amount: `5000`

3. **Verify:**
   - ✅ Totals row shows: Debits R5,000.00, Credits R5,000.00
   - ✅ "✅ Balanced" indicator appears
   - ✅ No validation errors

4. **Click:** "Save as Draft"

5. **Expected Result:**
   - ✅ Success message: "Journal entry saved as draft! (JNL-XXXX-XXX)"
   - ✅ Entry ID is displayed
   - ✅ Form doesn't reset yet

### 1.2 Post to General Ledger

6. **Click:** "Post to Ledger"

7. **Expected Result:**
   - ✅ Success message: "Journal entry posted successfully!"
   - ✅ Form resets after 3 seconds

### 1.3 Verify in Trial Balance

8. **Navigate to:** `http://localhost:5173/financial/trial-balance`

9. **Verify:**
   - ✅ Account 6100 (Office Expenses) shows:
     - Debit Balance: R5,000.00 (or increased by R5,000)
   - ✅ Account 1100 (Cash) shows:
     - Credit Balance: R5,000.00 (or increased by R5,000)
   - ✅ Total Debits equals Total Credits
   - ✅ "✅ Trial Balance is Balanced" message appears

10. **Click:** On Account 1100 (Cash) to view ledger

11. **Expected:**
    - ✅ Account ledger opens
    - ✅ Shows transaction dated 2025-11-06
    - ✅ Description: "Cash payment"
    - ✅ Credit: R5,000.00
    - ✅ Running balance calculated correctly

**✅ TEST 1 PASSED** if all checks above are successful.

---

## 🗓️ TEST 2: PERIOD MANAGEMENT & MONTH-END CLOSE

### 2.1 View Current Period

1. **Navigate to:** `http://localhost:5173/financial/periods`

2. **Verify:**
   - ✅ Page title: "Period Management"
   - ✅ Summary cards show:
     - Total Periods: 12
     - Open Periods: 9 (March-November)
     - Closed Periods: 0
     - Locked Periods: 0
   - ✅ Current period marked with ⭐ (November 2025)
   - ✅ November 2025 has green background (OPEN status)

### 2.2 Validate Period Close

3. **Click:** On November 2025 period card

4. **Verify Period Actions panel shows:**
   - ✅ Period name: "November 2025"
   - ✅ Status badge: "OPEN" (green)
   - ✅ Two buttons visible: "🔍 Validate Close" and "🟡 Close Period"

5. **Click:** "🔍 Validate Close"

6. **Expected:**
   - ✅ Validation results appear
   - ✅ Shows: "✅ Period can be closed" OR lists blocking issues
   - ✅ If no issues, proceed to next step

### 2.3 Close the Period

7. **Click:** "🟡 Close Period"

8. **Verify confirmation dialog:**
   - ✅ Message: "Are you sure you want to close this period?"
   - ✅ Two buttons: Cancel and OK

9. **Click:** "OK"

10. **Expected Results:**
    - ✅ Success message: "Period closed successfully! The next period has been automatically opened."
    - ✅ November 2025 status changes to "CLOSED" (yellow background)
    - ✅ December 2025 auto-opens (green background)
    - ✅ December 2025 is now marked as current (⭐)
    - ✅ Summary cards update:
      - Open Periods: 9 (April-December)
      - Closed Periods: 1 (November)

### 2.4 Test Posting Restriction

11. **Navigate to:** `http://localhost:5173/financial/journal-entry/new`

12. **Try to create entry with date:** 2025-11-15 (in closed November period)

13. **Expected:**
    - ❌ Validation error: "Cannot post to closed period"
    OR
    - ✅ Entry saves but cannot be posted (posting button disabled)

14. **Change date to:** 2025-12-01 (December - now open)

15. **Expected:**
    - ✅ Entry can be saved and posted successfully

### 2.5 Lock a Period

16. **Navigate back to:** `http://localhost:5173/financial/periods`

17. **Click:** On November 2025 (now CLOSED)

18. **Verify:**
    - ✅ Period Actions shows: "🔴 Lock Period (Permanent)" button

19. **Click:** "🔴 Lock Period (Permanent)"

20. **Verify confirmation:**
    - ✅ Warning message: "🔴 WARNING: Locking a period is PERMANENT and cannot be undone. Continue?"

21. **Click:** "OK"

22. **Expected:**
    - ✅ Success message: "Period locked permanently! 🔴"
    - ✅ November 2025 status changes to "LOCKED" (red background)
    - ✅ Summary updates: Locked Periods: 1
    - ✅ Cannot reopen this period anymore

**✅ TEST 2 PASSED** if all period management functions work correctly.

---

## 📋 TEST 3: APPROVAL WORKFLOWS

### 3.1 Create Entry for Approval

1. **Navigate to:** `http://localhost:5173/financial/journal-entry/new`

2. **Create entry:**
   - Date: 2025-12-01
   - Description: "Large equipment purchase"
   - Line 1: Account 1500 (Equipment), Debit: R750,000
   - Line 2: Account 2100 (Accounts Payable), Credit: R750,000

3. **Click:** "Save as Draft"

4. **Expected:**
   - ✅ Entry saved successfully
   - ✅ "📋 Submit for Approval" button appears

### 3.2 Submit for Approval

5. **Click:** "📋 Submit for Approval"

6. **Expected:**
   - ✅ Success message shows workflow name (e.g., "Entry submitted for approval! Workflow: Standard Approval")
   - ✅ Status badge changes to "⏳ Pending Approval"
   - ✅ Form becomes read-only
   - ✅ "Submit for Approval" button disappears
   - ✅ "Post to Ledger" button is disabled

### 3.3 View Pending Approvals

7. **Navigate to:** `http://localhost:5173/financial/approvals`

8. **Verify dashboard:**
   - ✅ Statistics cards show:
     - Pending Total: 1 (or more)
     - Approved Today: 0
     - Rejected Today: 0
   - ✅ Approval entry card displays:
     - Priority indicator (🟡 yellow for R750K)
     - Journal number
     - Amount: R750,000
     - Description: "Large equipment purchase"
     - Current level: "Level 1: Reviewer" or similar
     - Three buttons: "View History", "Reject", "Approve"

### 3.4 Approve Entry

9. **Click:** "Approve" button on the entry card

10. **Verify modal:**
    - ✅ Title: "Approve Entry"
    - ✅ Shows entry details (journal number, amount, description)
    - ✅ Optional comments field
    - ✅ Two buttons: "Cancel" and "Confirm Approval"

11. **Type comment:** "Budget verified, approved"

12. **Click:** "Confirm Approval"

13. **Expected:**
    - ✅ Success message appears
    - ✅ Entry either:
      - Advances to next level (e.g., "Level 2: Finance Manager"), OR
      - Status changes to "APPROVED" if only 1 level required

### 3.5 View Approval History

14. **Click:** "View History" on any entry

15. **Verify modal:**
    - ✅ Title: "Approval History"
    - ✅ Timeline shows all actions:
      - Who submitted
      - When submitted
      - Who approved
      - Comments included
    - ✅ Visual timeline with colored markers
    - ✅ Most recent action at top

**✅ TEST 3 PASSED** if approval workflow functions correctly.

---

## 📐 TEST 4: DIMENSIONS

### 4.1 View Cost Centers

1. **Navigate to:** `http://localhost:5173/financial/dimensions`

2. **Verify:**
   - ✅ Tabs visible: Cost Centers, Departments, Projects, Products, Locations
   - ✅ Cost Centers tab is active
   - ✅ List shows 7 cost centers (from seed data)
   - ✅ Each card shows: code, name, manager, budget, status
   - ✅ Search box and filter dropdown available
   - ✅ "+ New Cost Center" button visible

### 4.2 Create New Cost Center

3. **Click:** "+ New Cost Center"

4. **Verify modal:**
   - ✅ Title: "Create Cost Center"
   - ✅ Form fields: Code, Name, Manager, Budget, Start Date, End Date, Description

5. **Fill in:**
   - Code: TEST-001
   - Name: Test Cost Center
   - Manager: Your Name
   - Budget: 100000

6. **Click:** "Create"

7. **Expected:**
   - ✅ Success message
   - ✅ Modal closes
   - ✅ New cost center appears in list
   - ✅ Shows "Active" status (green badge)

### 4.3 Edit Cost Center

8. **Click:** "Edit" on the new cost center

9. **Modify:** Budget to 150000

10. **Click:** "Update"

11. **Expected:**
    - ✅ Success message
    - ✅ Budget updates to R150,000

### 4.4 Deactivate Cost Center

12. **Click:** "Deactivate" button

13. **Expected:**
    - ✅ Status badge changes to "Inactive" (gray)

**✅ TEST 4 PASSED** if dimensions management works.

---

## 📊 TEST 5: REPORTS

### 5.1 Trial Balance

1. **Navigate to:** `http://localhost:5173/financial/trial-balance`

2. **Verify:**
   - ✅ Shows all accounts with balances
   - ✅ Debit and credit columns
   - ✅ Running balance calculated
   - ✅ Total debits = Total credits
   - ✅ "✅ Balanced" indicator

### 5.2 Journal Entries List

3. **Navigate to:** `http://localhost:5173/financial/journal-entries`

4. **Verify:**
   - ✅ Lists all journal entries
   - ✅ Shows: date, journal number, description, amount, status
   - ✅ Can filter by status (Draft, Posted, etc.)
   - ✅ Can click entry to view details

### 5.3 Financial Dashboard

5. **Navigate to:** `http://localhost:5173/financial/dashboard`

6. **Verify:**
   - ✅ Summary cards with key metrics
   - ✅ Charts or graphs (if implemented)
   - ✅ Recent transactions
   - ✅ Period information

**✅ TEST 5 PASSED** if all reports display correctly.

---

## 🎯 FINAL VERIFICATION CHECKLIST

After completing all tests above, verify:

- [ ] ✅ **Double-Entry Works:** Transactions post to GL, Trial Balance updates
- [ ] ✅ **Trial Balance Balanced:** Debits always equal credits
- [ ] ✅ **Periods Work:** Can open/close/lock periods
- [ ] ✅ **Period Restrictions:** Cannot post to closed periods
- [ ] ✅ **Approvals Work:** Can submit, approve, reject entries
- [ ] ✅ **Approval History:** Complete audit trail visible
- [ ] ✅ **Dimensions Work:** Can create/edit cost centers
- [ ] ✅ **Reports Work:** Trial Balance, Journal Entries list display
- [ ] ✅ **No Console Errors:** Check browser dev tools
- [ ] ✅ **Backend Logs Clean:** No errors in backend terminal

---

## 📝 TEST RESULTS TEMPLATE

```
Test Date: __________________
Tester: ____________________

┌────────────────────────────────────┬──────┬────────┐
│ Test                               │ Pass │ Notes  │
├────────────────────────────────────┼──────┼────────┤
│ 1. Double-Entry Posting            │ [ ]  │        │
│ 2. Trial Balance Updates           │ [ ]  │        │
│ 3. Period Management               │ [ ]  │        │
│ 4. Period Close/Lock               │ [ ]  │        │
│ 5. Posting Restrictions            │ [ ]  │        │
│ 6. Submit for Approval             │ [ ]  │        │
│ 7. Approve/Reject Entries          │ [ ]  │        │
│ 8. Approval History                │ [ ]  │        │
│ 9. Dimensions CRUD                 │ [ ]  │        │
│ 10. Trial Balance Report           │ [ ]  │        │
└────────────────────────────────────┴──────┴────────┘

Overall Status: [ ] PASS  [ ] FAIL  [ ] NEEDS WORK

Critical Issues Found:
_________________________________________________________
_________________________________________________________

Recommendations:
_________________________________________________________
_________________________________________________________

Sign-Off:
_________________________________________________________
```

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue: Backend not responding
**Solution:**
```bash
# Kill all processes
pkill -f "ts-node-dev"
lsof -ti:3000 | xargs kill -9

# Restart backend
cd backend && npm run dev
```

### Issue: "Cannot GET /api/financial/..."
**Solution:**
- Check backend logs for errors
- Verify database connection
- Run migrations: `npm run db:full-setup`

### Issue: Trial Balance not updating
**Solution:**
- Ensure entry was posted (not just saved as draft)
- Check general_ledger table has records
- Clear browser cache and refresh

### Issue: Approval button not showing
**Solution:**
- Ensure entry is saved as draft first
- Check approval_status = 'DRAFT'
- Verify workflows are seeded in database

---

## 🚀 READY FOR PRODUCTION?

If all tests pass:

1. ✅ Run database backup
2. ✅ Document any custom configurations
3. ✅ Set environment variables for production
4. ✅ Build frontend: `npm run build`
5. ✅ Build backend: `npm run build`
6. ✅ Deploy to production servers
7. ✅ Run smoke tests in production
8. ✅ Monitor logs for 24 hours
9. ✅ Train users
10. ✅ Go live! 🎉

**System is production-ready when all tests pass!**
