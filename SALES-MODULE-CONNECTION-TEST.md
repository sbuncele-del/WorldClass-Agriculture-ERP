# Sales Module - Frontend ↔ Backend Connection Test

## Backend Routes (Available at `/api/sales`)
✅ All mounted at `/api/sales` in index.ts

- GET `/api/sales/workspace` - Sales workspace overview
- GET `/api/sales/customers` - List customers
- GET `/api/sales/customers/:id` - Get customer by ID
- POST `/api/sales/customers` - Create customer
- PUT `/api/sales/customers/:id` - Update customer
- DELETE `/api/sales/customers/:id` - Delete customer
- GET `/api/sales/leads` - List leads
- GET `/api/sales/opportunities` - List opportunities
- GET `/api/sales/quotations` - List quotations
- GET `/api/sales/orders` - List orders

## Frontend API Calls
Testing what frontend actually calls...

### Test 1: Visit http://51.21.219.35/sales/dashboard
**Expected API calls:**
- `/api/sales/workspace` OR `/api/sales/dashboard`

### Test 2: Visit http://51.21.219.35/sales/customers
**Expected API calls:**
- `/api/sales/customers`

## Current Issues

1. **Frontend CSP Error** - Trying to call `localhost:3000` instead of `51.21.219.35:3000`
2. **Backend Deployment** - May have crashed during npm build
3. **Missing `/api/sales/dashboard`** - Backend has `/workspace` but frontend might call `/dashboard`

## Action Plan

1. ✅ Rebuilt frontend with correct API URL
2. ⏳ Deploy frontend to AWS
3. ⏳ Check if backend is running
4. ⏳ Test sales dashboard page
5. ⏳ Fix any endpoint mismatches

## Testing Now

Open browser console and visit: http://51.21.219.35/sales/dashboard

Look for:
- ❌ Red errors = API calls failing
- ✅ Network tab = see what endpoints are being called
- 📊 Data loading = connection working!
