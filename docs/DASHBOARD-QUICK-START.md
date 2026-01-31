# Financial Dashboard - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Start the Application

```bash
# Terminal 1: Start Backend
cd "Worldclass ERP Software/backend"
npm run dev

# Terminal 2: Start Frontend
cd "Worldclass ERP Software/frontend"
npm run dev
```

**Expected Output:**
- Backend: `🚀 Server running on port 3000`
- Frontend: `Local: http://localhost:5173/`

### Step 2: Access the Dashboard

1. Open browser: **http://localhost:5173**
2. Click **💰 Financial Management**
3. Dashboard loads automatically (or click **📊 Dashboard**)

### Step 3: Verify Data Loading

You should see:
- ✅ **Current Period Card** with fiscal year/period name
- ✅ **4 Metric Cards**: Revenue, Expenses, Profit, Activity
- ✅ **3 Balance Sheet Cards**: Assets, Liabilities, Equity
- ✅ **2 Dimension Charts**: Cost Center & Department breakdowns
- ✅ **Recent Entries Table**: Last 10 journal entries
- ✅ **4 Quick Action Cards**: Navigation shortcuts

---

## 🧪 Testing the Dashboard

### Test 1: View Toggle
1. Locate **Dimensional Analysis** section
2. Click **Revenue** button
3. Charts should update to show revenue breakdown
4. Click **Expenses** button
5. Charts should switch back to expense breakdown

**Expected Result:** Charts reload with different data for each view

### Test 2: Quick Actions
1. Click **New Entry** card
2. Verify navigation to Journal Entry form
3. Go back to dashboard
4. Click **Trial Balance** card
5. Verify navigation to Trial Balance page

**Expected Result:** All quick action links work correctly

### Test 3: Recent Entries
1. Scroll to **Recent Journal Entries** section
2. Verify 10 most recent entries are shown
3. Check that status badges are color-coded:
   - **DRAFT** = Orange
   - **POSTED** = Green
   - **VOID** = Red

**Expected Result:** Entries sorted by date (newest first)

### Test 4: Responsive Design
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select **iPhone 12 Pro**
4. Dashboard should reflow to single column

**Expected Result:** Clean mobile layout with stacked cards

---

## 🔧 Troubleshooting

### Issue: Dashboard shows loading spinner forever

**Possible Causes:**
1. Backend not running
2. Database not connected
3. API endpoint errors

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3000/health
# Should return: {"status":"OK","message":"Server is running"}

# Check dashboard stats endpoint
curl http://localhost:3000/api/financial/dashboard/stats
# Should return JSON with current_period, financial_summary, etc.

# Check backend logs for errors
# Look for database connection errors or SQL errors
```

### Issue: Charts show zero data

**Possible Causes:**
1. No journal entries in database
2. No posted entries (only DRAFT entries)
3. Missing dimension assignments

**Solutions:**
```bash
# Check if journal entries exist
curl http://localhost:3000/api/financial/journal-entries
# Should return array of journal entries

# Check breakdown endpoint
curl "http://localhost:3000/api/financial/dashboard/breakdown/cost-center?type=expenses"
# Should return breakdown array with data
```

**Quick Fix - Seed Sample Data:**
```bash
# Run in backend directory
npm run seed
```

### Issue: Recent entries not showing

**Possible Causes:**
1. No journal entries created yet
2. Database connection issue

**Solutions:**
1. Create a test journal entry via the UI
2. Check recent entries endpoint:
```bash
curl http://localhost:3000/api/financial/dashboard/recent-entries?limit=10
```

---

## 📊 Sample Data Walkthrough

### Creating Test Data

**1. Create a Journal Entry:**
1. Click **New Entry** quick action
2. Fill in:
   - **Posting Date:** Today's date
   - **Description:** "Test entry for dashboard"
   - **Line 1:** Debit "Office Expenses" R1,000
   - **Line 1 Dimensions:** Select Cost Center, Department
   - **Line 2:** Credit "Cash" R1,000
3. Click **Save and Post**

**2. Verify Dashboard Updates:**
1. Go back to dashboard
2. **Metrics** should update:
   - Expenses increased by R1,000
   - Activity count increased by 1
3. **Recent Entries** should show new entry at top
4. **Dimension Charts** should include new cost center/department

**3. Create More Entries:**
- Repeat with different amounts and dimensions
- Toggle between Expenses/Revenue views
- Watch charts update in real-time

---

## 🎯 What to Look For

### Good Dashboard Health Indicators:
✅ All sections load without errors  
✅ Metric cards show non-zero values  
✅ Charts display bars with percentages  
✅ Recent entries table populated  
✅ Quick actions navigate correctly  
✅ Period badge shows correct status  
✅ Balance sheet values make sense (Assets = Liabilities + Equity)  
✅ Toggle between Expenses/Revenue works smoothly  

### Red Flags:
❌ Loading spinner doesn't stop  
❌ All metrics show R0.00  
❌ Charts are empty  
❌ Console errors in browser DevTools  
❌ API calls returning 500 errors  
❌ Recent entries table empty despite having entries  

---

## 🚀 Next Steps

Once dashboard is working:

1. **Explore Dimensions:**
   - Click **Dimensions** quick action
   - Add more Cost Centers, Departments, etc.
   - Create journal entries with these dimensions
   - Return to dashboard to see updated breakdown

2. **Set Up Periods:**
   - Click **Manage Periods** quick action
   - Create fiscal year and periods
   - Close a period to see status change
   - Dashboard respects current period

3. **Review Reports:**
   - Click **Trial Balance** quick action
   - Apply dimension filters
   - Compare to dashboard metrics
   - Verify calculations match

4. **Build Real Data:**
   - Import historical journal entries
   - Set up your organization's dimensions
   - Configure fiscal calendar
   - Monitor financial health via dashboard

---

## 📖 API Endpoint Reference

### Dashboard Stats
```http
GET /api/financial/dashboard/stats
```
Returns: Current period, financial summary, balances, activity counts

### Dimension Breakdown
```http
GET /api/financial/dashboard/breakdown/:dimensionType?type=expenses|revenue
```
**Dimension Types:** cost-center, department, project, product, location  
**Type:** expenses or revenue

Returns: Top 10 dimensions with amounts and percentages

### Recent Entries
```http
GET /api/financial/dashboard/recent-entries?limit=10
```
**Query Params:** limit (default: 10)

Returns: Array of recent journal entries

---

## 💡 Pro Tips

**Tip 1: Refresh Data**
Dashboard auto-loads on mount. To refresh manually:
- Toggle Expenses/Revenue (triggers re-fetch)
- Navigate away and back
- Or refresh browser (F5)

**Tip 2: Understanding Percentages**
In dimension charts, percentage = (dimension amount / total amount) × 100
- If Cost Center A = R500 and Total = R1,000, then A = 50%

**Tip 3: Period Context**
Dashboard always shows data for the current/active period
- Check period badge to confirm which period you're viewing
- To see other periods, change period status or date range (future enhancement)

**Tip 4: Quick Navigation**
Use quick actions for fast navigation:
- **New Entry** → Create journal entry
- **Trial Balance** → View full trial balance
- **Manage Periods** → Period setup
- **Dimensions** → Configure dimensions

**Tip 5: Mobile Access**
Dashboard is fully responsive:
- Use on phone/tablet for on-the-go insights
- All features work on mobile
- Charts adapt to screen size

---

## ✅ Success Criteria

Your dashboard is working correctly if:

1. ✅ All 6 sections render without errors
2. ✅ API calls complete successfully (check Network tab)
3. ✅ Metrics display realistic values
4. ✅ Charts show visual representation of data
5. ✅ Toggle between views works smoothly
6. ✅ Navigation links all work
7. ✅ Responsive design works on mobile
8. ✅ Loading states display properly
9. ✅ No console errors in browser
10. ✅ Period status reflects actual database state

---

## 🎓 Learning Outcomes

After completing this quick start, you will understand:

1. **Dashboard Architecture** - How frontend and backend connect
2. **API Integration** - How React fetches data from Express endpoints
3. **Data Visualization** - How charts represent dimensional analysis
4. **Financial Metrics** - Revenue, Expenses, Profit, Activity tracking
5. **Dimensional Accounting** - Cost center and department breakdown
6. **Period Management** - How fiscal periods control data scope
7. **React State Management** - How dashboard state updates
8. **Responsive Design** - How layout adapts to screen size

---

**Happy Dashboard Exploring! 🎉**

For detailed documentation, see: [TODO-8-FINANCIAL-DASHBOARD-COMPLETE.md](./TODO-8-FINANCIAL-DASHBOARD-COMPLETE.md)
