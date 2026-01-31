# 🔗 Frontend-Backend Integration Guide

## Current Status: **MOCK DATA** → Moving to **REAL API CALLS**

---

## 🎯 Problem Statement

Your ERP system has:
- ✅ Beautiful frontend with all modules working
- ✅ Backend API with 13 workspace controllers deployed
- ❌ **Frontend NOT connected to backend (using mock data)**
- ❌ **No centralized API service**
- ❌ **No authentication headers on API calls**

## 🔧 Solution Implemented

### 1. Centralized API Service
**File Created:** `/frontend/src/services/api.service.ts`

**Features:**
- ✅ Single source of truth for API_BASE_URL
- ✅ Automatic authentication headers (Bearer token)
- ✅ Automatic workspace/tenant context (X-Workspace-ID, X-Tenant-ID)
- ✅ Consistent error handling
- ✅ Auto-redirect to login on 401 errors
- ✅ Pre-built functions for all 13 workspaces

**Usage Example:**
\`\`\`typescript
import { workspaceApi } from '../services/api.service';

// Get logistics dashboard data
const data = await workspaceApi.logistics.getDashboard();

// Get sales leads with filters
const leads = await workspaceApi.sales.getLeads({ status: 'active' });

// Create new trip
const trip = await workspaceApi.logistics.createTrip({
  vehicle_id: 1,
  driver_id: 5,
  route: 'Johannesburg to Durban'
});
\`\`\`

---

## 📡 API Endpoints Mapping

### Backend API Structure (51.21.219.35:3000)

\`\`\`
/api/workspaces/financial/*       → Financial workspace
/api/workspaces/sales/*           → Sales workspace
/api/workspaces/purchase/*        → Purchase workspace
/api/workspaces/inventory/*       → Inventory workspace
/api/workspaces/hr/*              → HR workspace
/api/workspaces/logistics/*       → Logistics workspace
/api/workspaces/compliance/*      → Compliance workspace
/api/workspaces/sars/*            → SARS workspace
/api/workspaces/assets/*          → Assets workspace
/api/workspaces/manufacturing/*   → Manufacturing workspace
/api/workspaces/warehouse/*       → Warehouse workspace
/api/workspaces/admin/*           → Admin workspace
/api/workspaces/superadmin/*      → Super Admin workspace
\`\`\`

### Authentication Flow

\`\`\`
1. User logs in → POST /api/auth/login
   Response: { token, user, workspace }

2. Store in localStorage:
   - token (JWT)
   - user (user object)
   - workspaceId (current workspace)
   - tenantId (tenant ID)

3. All subsequent API calls include:
   Headers:
     Authorization: Bearer <token>
     X-Workspace-ID: <workspaceId>
     X-Tenant-ID: <tenantId>
\`\`\`

---

## 🧪 Testing API Connectivity

### Step 1: Access API Test Dashboard
Navigate to: **http://localhost:5173/api-test**

This dashboard will:
- ✅ Test backend connectivity
- ✅ Show authentication status
- ✅ Test all 14 workspace endpoints
- ✅ Display response times
- ✅ Show detailed error messages

### Step 2: Check Backend Health
\`\`\`bash
curl http://51.21.219.35:3000/api/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2025-11-16T..."
}
\`\`\`

### Step 3: Test Authentication
\`\`\`bash
curl -X POST http://51.21.219.35:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aetheros.com",
    "password": "your-password"
  }'
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... },
  "workspace": { ... }
}
\`\`\`

---

## 🔄 Module Migration Status

### ✅ Already Updated (Using API Service)
1. **Logistics Dashboard** - Connected to `/api/workspaces/logistics/dashboard`

### ⏳ Pending Migration (Still Using Mock Data)
2. **Sales Module** - Needs update to use `workspaceApi.sales.*`
3. **Purchase Module** - Needs update to use `workspaceApi.purchase.*`
4. **Financial Module** - Needs update to use `workspaceApi.financial.*`
5. **Inventory Module** - Needs update to use `workspaceApi.inventory.*`
6. **HR Module** - Needs update to use `workspaceApi.hr.*`
7. **SARS Sentinel** - Needs update to use `workspaceApi.sars.*`
8. **Assets Module** - Needs update to use `workspaceApi.assets.*`
9. **Manufacturing Module** - Needs update to use `workspaceApi.manufacturing.*`
10. **Warehouse Module** - Needs update to use `workspaceApi.warehouse.*`

---

## 🚀 How to Connect a Module to Backend

### Example: HR Dashboard

**Before (Mock Data):**
\`\`\`typescript
const fetchDashboardData = async () => {
  setLoading(true);
  try {
    // Mock data
    setStats({
      total_employees: 127,
      monthly_payroll: 4856300,
      // ...
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
\`\`\`

**After (Real API):**
\`\`\`typescript
import { workspaceApi } from '../../services/api.service';

const fetchDashboardData = async () => {
  setLoading(true);
  try {
    const data = await workspaceApi.hr.getDashboard();
    
    if (data && data.success) {
      setStats(data.data.stats);
    } else {
      throw new Error('Failed to fetch dashboard data');
    }
  } catch (error) {
    console.error('Error fetching HR dashboard:', error);
    // Fallback to mock data on error
    setStats({
      total_employees: 127,
      monthly_payroll: 4856300,
      // ...
    });
  } finally {
    setLoading(false);
  }
};
\`\`\`

---

## 🔐 Authentication Setup

### Login Flow
1. User enters email/password on Login page
2. Frontend calls: `authApi.login(email, password)`
3. Backend validates credentials
4. Backend returns: `{ token, user, workspace }`
5. Frontend stores in localStorage
6. All subsequent API calls include token

### Auto-Login (Remember Me)
When page loads, frontend checks:
\`\`\`typescript
const token = localStorage.getItem('token');
if (token) {
  // Call authApi.me() to validate token
  const user = await authApi.me();
  // If valid, user is logged in
  // If invalid (401), redirect to login
}
\`\`\`

---

## 📋 Environment Configuration

### Development (.env.development)
\`\`\`bash
VITE_API_URL=http://localhost:3000
VITE_ENV=development
VITE_API_DEBUG=true
\`\`\`

### Production (.env.production)
\`\`\`bash
VITE_API_URL=http://51.21.219.35:3000
VITE_ENV=production
VITE_API_DEBUG=true
\`\`\`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network Error" on API Calls
**Cause:** Backend not running or CORS issues

**Check:**
\`\`\`bash
# Test backend health
curl http://51.21.219.35:3000/api/health

# Check if PM2 is running
ssh ec2-user@51.21.219.35
pm2 status
\`\`\`

**Solution:**
- Ensure backend is running on port 3000
- Check CORS configuration in backend allows frontend origin

---

### Issue 2: "401 Unauthorized" Errors
**Cause:** Missing or invalid authentication token

**Check:**
\`\`\`javascript
console.log('Token:', localStorage.getItem('token'));
console.log('Workspace ID:', localStorage.getItem('workspaceId'));
\`\`\`

**Solution:**
- Login again to get fresh token
- Check token expiration (JWT)
- Verify token is being sent in Authorization header

---

### Issue 3: "Workspace Not Found" or "403 Forbidden"
**Cause:** Missing X-Workspace-ID header or invalid workspace access

**Check:**
\`\`\`javascript
console.log('Workspace ID:', localStorage.getItem('workspaceId'));
console.log('Tenant ID:', localStorage.getItem('tenantId'));
\`\`\`

**Solution:**
- Ensure workspace_id is stored after login
- Verify user has access to requested workspace
- Check multi-tenant isolation in backend

---

### Issue 4: "Cannot read property of undefined"
**Cause:** API response structure different from expected

**Debug:**
\`\`\`typescript
try {
  const data = await workspaceApi.logistics.getDashboard();
  console.log('API Response:', data);
  
  // Check if response has expected structure
  if (!data || !data.success) {
    console.error('Unexpected response:', data);
  }
} catch (error) {
  console.error('API Error:', error);
}
\`\`\`

**Solution:**
- Log full API response to see actual structure
- Update TypeScript interfaces to match backend response
- Add defensive checks before accessing nested properties

---

## 📊 Backend Response Structure (Standard)

All workspace endpoints return:
\`\`\`json
{
  "success": true,
  "data": {
    "stats": { ... },
    "recentActivity": [ ... ],
    "alerts": [ ... ]
  },
  "timestamp": "2025-11-16T..."
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-16T..."
}
\`\`\`

---

## ✅ Next Steps (Priority Order)

### Immediate (Today)
1. ✅ Test API Test Dashboard (`/api-test`)
2. ✅ Verify backend health endpoint works
3. ✅ Test login flow and token storage
4. ✅ Verify one module (Logistics) connects successfully

### Short Term (This Week)
5. ⏳ Connect Sales module to backend
6. ⏳ Connect Financial module to backend
7. ⏳ Connect HR module to backend
8. ⏳ Connect Inventory module to backend
9. ⏳ Test all CRUD operations (Create, Read, Update, Delete)

### Medium Term (Next Week)
10. ⏳ Replace all remaining mock data
11. ⏳ Add loading states for all API calls
12. ⏳ Add error boundaries for failed API calls
13. ⏳ Implement data caching (React Query or SWR)
14. ⏳ Add retry logic for failed requests

---

## 🔍 Debugging Tips

### Enable API Logging
Add this to your component:
\`\`\`typescript
import { API_BASE_URL } from '../../services/api.service';

console.log('API Base URL:', API_BASE_URL);
console.log('Token:', localStorage.getItem('token'));
console.log('Workspace ID:', localStorage.getItem('workspaceId'));
\`\`\`

### Monitor Network Requests
1. Open Chrome DevTools (F12)
2. Go to **Network** tab
3. Filter by **XHR** or **Fetch**
4. Click on request to see:
   - Request headers (check Authorization)
   - Response body (check data structure)
   - Status code (200, 401, 500, etc.)

### Test API Directly (Postman/Insomnia)
\`\`\`
GET http://51.21.219.35:3000/api/workspaces/logistics/dashboard

Headers:
  Authorization: Bearer <your-token>
  X-Workspace-ID: <your-workspace-id>
  Content-Type: application/json
\`\`\`

---

## 📞 Need Help?

If you encounter issues:
1. Check API Test Dashboard first (`/api-test`)
2. Review browser console for errors
3. Check Network tab in DevTools
4. Verify backend is running: `pm2 status`
5. Check backend logs: `pm2 logs`

---

**Last Updated:** November 16, 2025  
**Status:** API Service Created, Testing Phase  
**Next:** Connect all modules to real backend data
