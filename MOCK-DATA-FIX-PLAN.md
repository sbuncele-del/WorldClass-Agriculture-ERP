# Mock Data Fix Plan

## API Endpoint Mapping

Based on the backend routes, here are the REAL API endpoints available:

### Core APIs

| Mock Data Area | Real API Endpoint | Auth Required |
|----------------|-------------------|---------------|
| Users/Auth | `/api/auth/*` | No (public) |
| Clients | `/api/clients` or `/api/v2/clients` | Yes |
| Customers | `/api/sales/customers` | Yes |
| Products | `/api/inventory/products` | Yes |
| Inventory | `/api/inventory/*` | Yes |

### HR Module (`/api/hr/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Employees | `/api/hr/employees` |
| Leave Requests | `/api/hr/leave` |
| Payroll | `/api/hr/payroll` |
| Departments | `/api/hr/departments` |

### Financial Module (`/api/financial/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Accounts | `/api/chart-of-accounts` |
| Transactions | `/api/financial/transactions` |
| Invoices | `/api/invoices/sales` |
| Reports | `/api/financial/reports/*` |

### Sales Module (`/api/sales/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Sales Orders | `/api/sales/orders` |
| Quotes | `/api/sales/quotes` |
| Invoices | `/api/invoices/sales` |
| Customers | `/api/sales/customers` |

### Purchase Module (`/api/purchase/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Purchase Orders | `/api/purchase/orders` |
| Suppliers | `/api/purchase/suppliers` |
| Vendor Invoices | `/api/purchases` |

### Assets Module (`/api/assets/*` or `/api/asset-management/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Assets | `/api/assets` or `/api/asset-management/assets` |
| Depreciation | `/api/asset-management/depreciation` |

### Logistics Module (`/api/logistics/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Vehicles | `/api/logistics/vehicles` |
| Drivers | `/api/logistics/drivers` |
| Trips | `/api/logistics/trips` |
| Fleet | `/api/logistics/fleet` |

### Manufacturing Module (`/api/manufacturing/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| BOMs | `/api/manufacturing/boms` |
| Work Orders | `/api/manufacturing/work-orders` |
| Production | `/api/manufacturing/production` |

### Warehouse Module (`/api/warehouse/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Warehouses | `/api/warehouse/warehouses` |
| Locations | `/api/warehouse/locations` |
| Transfers | `/api/warehouse/transfers` |

### Projects Module (`/api/projects/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Projects | `/api/projects` |
| Tasks | `/api/projects/tasks` |
| Milestones | `/api/projects/milestones` |

### Communications (`/api/communications/*`)

| Mock Data | Real API Endpoint |
|-----------|-------------------|
| Messages | `/api/messages` |
| Notifications | `/api/communications/notifications` |
| Channels | `/api/communications/channels` |

### Industry Modules

| Module | Real API Endpoint |
|--------|-------------------|
| Healthcare | `/api/healthcare/*` |
| Mining | `/api/mining/*` |
| Agriculture | `/api/agriculture/*` |
| Construction | `/api/construction/*` |
| Property | `/api/property/*` |

---

## Priority Fix Order

### 🔴 Critical (Contexts - affect whole app)

1. **UserContext.tsx** - Replace MOCK_USER with `/api/auth/me` or `/api/users/me`
2. **ClientContext.tsx** - Replace MOCK_CLIENTS with `/api/clients`
3. **CurrencyContext.tsx** - Replace MOCK_EXCHANGE_RATES with `/api/financial/exchange-rates`

### 🟠 High (Layout Components - always visible)

4. **NotificationDropdown.tsx** - Replace mockNotifications with `/api/communications/notifications`
5. **MessagesDropdown.tsx** - Replace mockMessages with `/api/messages`

### 🟡 Medium (Module Pages)

6. **EmployeesPage.tsx** → `/api/hr/employees`
7. **PayrollPage.tsx** → `/api/hr/payroll`
8. **LeavePage.tsx** → `/api/hr/leave`
9. **AssetRegisterPage.tsx** → `/api/assets`
10. **SuppliersPage.tsx** → `/api/purchase/suppliers`
11. **PurchaseOrdersPage.tsx** → `/api/purchase/orders`
12. **VendorInvoicesPage.tsx** → `/api/purchases`
13. **FleetManagementEnhanced.tsx** → `/api/logistics/vehicles`
14. **DriverManagement.tsx** → `/api/logistics/drivers`
15. **TripManagement.tsx** → `/api/logistics/trips`

---

## Fix Pattern Template

### Before (Mock Data):
```typescript
const mockEmployees: Employee[] = [
  { id: 1, name: 'John Doe', ... },
  { id: 2, name: 'Jane Smith', ... },
];

const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
```

### After (Real API):
```typescript
import { useEffect, useState } from 'react';
import apiClient from '@/services/api';

const [employees, setEmployees] = useState<Employee[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/hr/employees');
      setEmployees(response.data.data || response.data);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchEmployees();
}, []);

// Add loading/error UI
if (loading) return <Spinner />;
if (error) return <Alert type="error">{error}</Alert>;
```

---

## Quick Commands

### Find all mock variables:
```bash
grep -r "const mock" frontend/src --include="*.tsx" --include="*.ts" | head -50
```

### Find all MOCK_ constants:
```bash
grep -r "MOCK_" frontend/src --include="*.tsx" --include="*.ts" | head -50
```

### Find hardcoded arrays:
```bash
grep -rn "useState\(\[" frontend/src --include="*.tsx" | head -30
```

### Check if API endpoint exists:
```bash
curl -s http://51.20.67.228:3000/api/hr/employees -H "Authorization: Bearer TOKEN"
```
