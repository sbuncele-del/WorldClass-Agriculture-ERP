# 🚀 Quick Start - API Testing

## 1️⃣ Test API Connection (Do This First!)

**URL:** http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/api-test

**What You'll See:**
- Backend connection status (✅ or ❌)
- Authentication status (token, workspace ID)
- Test results for 14 endpoints
- Success rate percentage
- Detailed error messages

**Action:** Click "Test All Endpoints" button

---

## 2️⃣ Expected Test Results

### ✅ Should PASS:
- Health Check (`/api/health`)
- Auth - Me (`/api/auth/me`) *if logged in*

### ❌ May FAIL (Check These):
- Workspace dashboards - Need valid workspace ID
- Protected endpoints - Need authentication

---

## 3️⃣ If Tests Fail

### Quick Checks:
```bash
# 1. Is backend running?
curl http://51.21.219.35:3000/api/health

# 2. Check browser console (F12)
Look for red error messages

# 3. Check Network tab (F12)
Filter by XHR/Fetch → Click requests → See status codes
```

### Common Fixes:
- **401 Unauthorized** → Login again to get fresh token
- **Network Error** → Backend might be down (check PM2)
- **Workspace Not Found** → Workspace ID not set during login

---

## 4️⃣ Modules Status

### ✅ Connected to Backend:
1. **Logistics** - Using real API (`workspaceApi.logistics`)

### ⏳ Still Using Mock Data (Need Update):
2. Sales
3. Purchase
4. Financial
5. Inventory
6. HR
7. SARS Sentinel
8. Assets
9. Manufacturing
10. Warehouse

---

## 5️⃣ How API Service Works

### Old Way (Each Module Different):
```typescript
// Some used this:
fetch('http://localhost:3000/api/endpoint')

// Some used this:
fetch('/api/endpoint')

// Some used this:
fetch(`${apiUrl}/api/endpoint`)

// NONE had consistent auth headers!
```

### New Way (Centralized):
```typescript
import { workspaceApi } from '../services/api.service';

// Automatically includes:
// - Bearer token
// - X-Workspace-ID
// - X-Tenant-ID

const data = await workspaceApi.logistics.getDashboard();
```

---

## 6️⃣ Quick API Reference

### Authentication:
```typescript
import { authApi } from '../services/api.service';

// Login
await authApi.login(email, password);

// Get current user
await authApi.me();

// Logout
authApi.logout();
```

### Workspace APIs:
```typescript
import { workspaceApi } from '../services/api.service';

// Logistics
await workspaceApi.logistics.getDashboard();
await workspaceApi.logistics.getFleet();
await workspaceApi.logistics.getTrips();

// Sales
await workspaceApi.sales.getDashboard();
await workspaceApi.sales.getLeads();
await workspaceApi.sales.getCustomers();

// Financial
await workspaceApi.financial.getDashboard();
await workspaceApi.financial.getJournalEntries();

// HR
await workspaceApi.hr.getDashboard();
await workspaceApi.hr.getEmployees();

// ... (and 9 more workspaces)
```

---

## 7️⃣ Debugging Checklist

### Browser Console (F12 → Console):
- [ ] No red errors on page load
- [ ] API calls logging correctly
- [ ] Token present in localStorage

### Network Tab (F12 → Network):
- [ ] API calls showing in XHR/Fetch
- [ ] Status codes: 200 (success) or 401/500 (error)
- [ ] Request headers include Authorization
- [ ] Response body has data or error message

### Backend Status:
- [ ] Health endpoint responds: `curl http://51.21.219.35:3000/api/health`
- [ ] PM2 running: SSH → `pm2 status`
- [ ] Logs clean: SSH → `pm2 logs --lines 50`

---

## 8️⃣ What's Next?

### This Week:
1. Test all endpoints on `/api-test` page
2. Debug any failing endpoints
3. Update Sales module to use API service
4. Update Financial module to use API service
5. Update HR module to use API service

### Next Week:
6. Update remaining 6 modules
7. Remove mock data fallbacks
8. Add loading states
9. Implement data caching

---

## 9️⃣ Key URLs

**Production Frontend:**
```
http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com
```

**API Test Dashboard:**
```
http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/api-test
```

**Backend API:**
```
http://51.21.219.35:3000/api/...
```

**Login Page:**
```
http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/login
```

---

## 🔟 Success Criteria

**Phase 1: Connection (Today)**
- [x] API service created
- [x] Test dashboard created
- [x] Frontend deployed
- [ ] All tests run successfully
- [ ] Issues documented

**Phase 2: Integration (This Week)**
- [ ] All 10 modules connected
- [ ] Mock data removed
- [ ] End-to-end testing complete

**Phase 3: Production (Next Week)**
- [ ] Performance optimized
- [ ] Error handling refined
- [ ] User acceptance testing

---

## 📞 Need Help?

**Full Documentation:**
- `FRONTEND-BACKEND-INTEGRATION.md` - Complete guide
- `API-CONNECTION-DEPLOYMENT-SUCCESS.md` - Deployment details

**Quick Test:**
```bash
# Test backend health
curl http://51.21.219.35:3000/api/health

# Test login (replace with your credentials)
curl -X POST http://51.21.219.35:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aetheros.com","password":"your-password"}'
```

---

**Current Status:** ✅ **DEPLOYED & READY**

**Next Step:** Go to `/api-test` and click "Test All Endpoints"!
