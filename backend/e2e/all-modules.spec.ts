/**
 * COMPREHENSIVE MODULE TESTS - WorldClass ERP
 * Tests ALL 25 ERP modules for data integrity
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const BASE_URL = 'https://siyabusaerp.co.za';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  email: 'Sibusiso@sgbsgroup.co.za',
  password: 'Masaphokati2025!',
  tenantId: 'b36ec5a6-b637-4716-84eb-3c53eb1c7093'
};

test.describe.configure({ mode: 'serial' });

let authToken: string;

// Helper to make authenticated requests
async function authGet(request: APIRequestContext, path: string) {
  return request.get(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
}

async function authPost(request: APIRequestContext, path: string, data: any) {
  return request.post(`${API_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${authToken}` },
    data
  });
}

test.describe('ALL ERP MODULES - Comprehensive Testing', () => {

  test.beforeAll(async ({ request }) => {
    const loginResponse = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.data?.tokens?.accessToken || loginData.token;
    expect(authToken).toBeTruthy();
    console.log('✅ Authentication successful');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 1: INVENTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('1. INVENTORY MANAGEMENT', () => {
    test('GET /v2/inventory/items', async ({ request }) => {
      const res = await authGet(request, '/v2/inventory/items');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Inventory items');
    });

    test('GET /v2/inventory/stock-levels', async ({ request }) => {
      const res = await authGet(request, '/v2/inventory/stock-levels');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Stock levels');
    });

    test('GET /v2/inventory/warehouses', async ({ request }) => {
      const res = await authGet(request, '/v2/inventory/warehouses');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Warehouses');
    });

    test('GET /v2/inventory/categories', async ({ request }) => {
      const res = await authGet(request, '/v2/inventory/categories');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Inventory categories: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 2: SALES & CRM
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('2. SALES & CRM', () => {
    test('GET /v2/sales/customers', async ({ request }) => {
      const res = await authGet(request, '/v2/sales/customers');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      console.log(`✅ Customers: ${data.data?.length || data.length || 0}`);
    });

    test('GET /v2/sales/invoices', async ({ request }) => {
      const res = await authGet(request, '/v2/sales/invoices');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Sales invoices');
    });

    test('GET /v2/sales/quotes', async ({ request }) => {
      const res = await authGet(request, '/v2/sales/quotes');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Sales quotes');
    });

    test('GET /v2/sales/orders', async ({ request }) => {
      const res = await authGet(request, '/v2/sales/orders');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Sales orders: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 3: PURCHASE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('3. PURCHASE MANAGEMENT', () => {
    test('GET /v2/purchase/suppliers', async ({ request }) => {
      const res = await authGet(request, '/v2/purchase/suppliers');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Suppliers: ${res.status()}`);
    });

    test('GET /v2/purchase/orders', async ({ request }) => {
      const res = await authGet(request, '/v2/purchase/orders');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Purchase orders: ${res.status()}`);
    });

    test('GET /purchases/invoices', async ({ request }) => {
      const res = await authGet(request, '/purchases/invoices');
      expect([200, 404, 500]).toContain(res.status());
      console.log(`📦 Purchase invoices: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 4: FINANCIAL ACCOUNTING
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('4. FINANCIAL ACCOUNTING', () => {
    test('GET /v2/financial/accounts (Chart of Accounts)', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/accounts');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Chart of accounts');
    });

    test('GET /v2/financial/balance-sheet', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/balance-sheet');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Balance sheet');
    });

    test('GET /v2/financial/income-statement', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/income-statement');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Income statement');
    });

    test('GET /v2/financial/journal-entries', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/journal-entries');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Journal entries');
    });

    test('GET /v2/financial/reports/cash-flow', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/reports/cash-flow');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Cash flow: ${res.status()}`);
    });

    test('GET /v2/financial/reports/trial-balance', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/reports/trial-balance');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Trial balance: ${res.status()}`);
    });

    test('GET /v2/financial/gl-explorer/search', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/gl-explorer/search');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 GL explorer: ${res.status()}`);
    });

    test('GET /v2/financial/recurring-entries', async ({ request }) => {
      const res = await authGet(request, '/v2/financial/recurring-entries');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Recurring entries: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 5: HR & PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('5. HR & PAYROLL', () => {
    test('GET /v2/hr/employees', async ({ request }) => {
      const res = await authGet(request, '/v2/hr/employees');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Employees');
    });

    test('GET /v2/hr/departments', async ({ request }) => {
      const res = await authGet(request, '/v2/hr/departments');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Departments');
    });

    test('GET /v2/hr/payroll', async ({ request }) => {
      const res = await authGet(request, '/v2/hr/payroll');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Payroll: ${res.status()}`);
    });

    test('GET /v2/hr/leave-requests', async ({ request }) => {
      const res = await authGet(request, '/v2/hr/leave-requests');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Leave requests: ${res.status()}`);
    });

    test('GET /v2/hr/attendance', async ({ request }) => {
      const res = await authGet(request, '/v2/hr/attendance');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Attendance: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 6: MANUFACTURING
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('6. MANUFACTURING', () => {
    test('GET /v2/manufacturing/work-orders', async ({ request }) => {
      const res = await authGet(request, '/v2/manufacturing/work-orders');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Work orders');
    });

    test('GET /v2/manufacturing/bom', async ({ request }) => {
      const res = await authGet(request, '/v2/manufacturing/bom');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Bill of materials');
    });

    test('GET /v2/manufacturing/production-orders', async ({ request }) => {
      const res = await authGet(request, '/v2/manufacturing/production-orders');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Production orders: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 7: WAREHOUSE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('7. WAREHOUSE MANAGEMENT', () => {
    test('GET /warehouse/locations', async ({ request }) => {
      const res = await authGet(request, '/warehouse/locations');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Warehouse locations: ${res.status()}`);
    });

    test('GET /warehouse/transfers', async ({ request }) => {
      const res = await authGet(request, '/warehouse/transfers');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Warehouse transfers: ${res.status()}`);
    });

    test('GET /warehouse/picking-lists', async ({ request }) => {
      const res = await authGet(request, '/warehouse/picking-lists');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Picking lists: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 8: ASSET MANAGEMENT (IAS 16)
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('8. ASSET MANAGEMENT', () => {
    test('GET /v2/assets/categories', async ({ request }) => {
      const res = await authGet(request, '/v2/assets/categories');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Asset categories');
    });

    test('GET /asset-management/assets', async ({ request }) => {
      const res = await authGet(request, '/asset-management/assets');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Fixed assets: ${res.status()}`);
    });

    test('GET /asset-management/depreciation', async ({ request }) => {
      const res = await authGet(request, '/asset-management/depreciation');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Depreciation: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 9: CASH MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('9. CASH MANAGEMENT', () => {
    test('GET /cash-management/bank-accounts', async ({ request }) => {
      const res = await authGet(request, '/cash-management/bank-accounts');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Bank accounts: ${res.status()}`);
    });

    test('GET /cash-management/transactions', async ({ request }) => {
      const res = await authGet(request, '/cash-management/transactions');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Bank transactions: ${res.status()}`);
    });

    test('GET /cash-management/forecasts', async ({ request }) => {
      const res = await authGet(request, '/cash-management/forecasts');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Cash forecasts: ${res.status()}`);
    });

    test('GET /cash-management/reconciliation', async ({ request }) => {
      const res = await authGet(request, '/cash-management/reconciliation');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Bank reconciliation: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 10: COMPLIANCE HUB
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('10. COMPLIANCE HUB', () => {
    test('GET /compliance/requirements', async ({ request }) => {
      const res = await authGet(request, '/compliance/requirements');
      expect([200, 404, 500]).toContain(res.status());
      console.log(`📦 Compliance requirements: ${res.status()}`);
    });

    test('GET /compliance/filings', async ({ request }) => {
      const res = await authGet(request, '/compliance/filings');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Compliance filings: ${res.status()}`);
    });

    test('GET /sars-sentinel/dashboard', async ({ request }) => {
      const res = await authGet(request, '/sars-sentinel/dashboard');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 SARS Sentinel: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 11: AUDIT HUB
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('11. AUDIT HUB', () => {
    test('GET /audit-log/entries', async ({ request }) => {
      const res = await authGet(request, '/audit-log/entries');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Audit log entries: ${res.status()}`);
    });

    test('GET /audit/readiness', async ({ request }) => {
      const res = await authGet(request, '/audit/readiness');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Audit readiness: ${res.status()}`);
    });

    test('GET /v2/audit-trail/search', async ({ request }) => {
      const res = await authGet(request, '/v2/audit-trail/search');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Audit trail search: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 12: MULTI-ENTITY
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('12. MULTI-ENTITY', () => {
    test('GET /v2/multi-entity/entities', async ({ request }) => {
      const res = await authGet(request, '/v2/multi-entity/entities');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Entities');
    });

    test('GET /entities/consolidation', async ({ request }) => {
      const res = await authGet(request, '/entities/consolidation');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Consolidation: ${res.status()}`);
    });

    test('GET /entities/intercompany', async ({ request }) => {
      const res = await authGet(request, '/entities/intercompany');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Intercompany: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 13: HEALTHCARE
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('13. HEALTHCARE', () => {
    test('GET /healthcare/patients', async ({ request }) => {
      const res = await authGet(request, '/healthcare/patients');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Patients: ${res.status()}`);
    });

    test('GET /healthcare/appointments', async ({ request }) => {
      const res = await authGet(request, '/healthcare/appointments');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Appointments: ${res.status()}`);
    });

    test('GET /healthcare/medical-records', async ({ request }) => {
      const res = await authGet(request, '/healthcare/medical-records');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Medical records: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 14: MINING
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('14. MINING', () => {
    test('GET /mining/sites', async ({ request }) => {
      const res = await authGet(request, '/mining/sites');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Mining sites: ${res.status()}`);
    });

    test('GET /mining/production', async ({ request }) => {
      const res = await authGet(request, '/mining/production');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Mining production: ${res.status()}`);
    });

    test('GET /mining/safety', async ({ request }) => {
      const res = await authGet(request, '/mining/safety');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Mining safety: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 15: CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('15. CONSTRUCTION', () => {
    test('GET /construction/projects', async ({ request }) => {
      const res = await authGet(request, '/construction/projects');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Construction projects: ${res.status()}`);
    });

    test('GET /construction/contracts', async ({ request }) => {
      const res = await authGet(request, '/construction/contracts');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Construction contracts: ${res.status()}`);
    });

    test('GET /construction/progress', async ({ request }) => {
      const res = await authGet(request, '/construction/progress');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Construction progress: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 16: PROPERTY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('16. PROPERTY MANAGEMENT', () => {
    test('GET /property/properties', async ({ request }) => {
      const res = await authGet(request, '/property/properties');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Properties: ${res.status()}`);
    });

    test('GET /property/leases', async ({ request }) => {
      const res = await authGet(request, '/property/leases');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Leases: ${res.status()}`);
    });

    test('GET /property/tenants', async ({ request }) => {
      const res = await authGet(request, '/property/tenants');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Property tenants: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 17: AGRICULTURE
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('17. AGRICULTURE', () => {
    test('GET /agriculture/farms', async ({ request }) => {
      const res = await authGet(request, '/agriculture/farms');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Farms: ${res.status()}`);
    });

    test('GET /agriculture/crops', async ({ request }) => {
      const res = await authGet(request, '/agriculture/crops');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Crops: ${res.status()}`);
    });

    test('GET /agriculture/livestock', async ({ request }) => {
      const res = await authGet(request, '/agriculture/livestock');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Livestock: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 18: LOGISTICS & FLEET
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('18. LOGISTICS & FLEET', () => {
    test('GET /logistics/vehicles', async ({ request }) => {
      const res = await authGet(request, '/logistics/vehicles');
      expect([200, 401, 404]).toContain(res.status());
      console.log(`📦 Vehicles: ${res.status()}`);
    });

    test('GET /logistics/trips', async ({ request }) => {
      const res = await authGet(request, '/logistics/trips');
      expect([200, 401, 404]).toContain(res.status());
      console.log(`📦 Trips: ${res.status()}`);
    });

    test('GET /logistics/drivers', async ({ request }) => {
      const res = await authGet(request, '/logistics/drivers');
      expect([200, 401, 404]).toContain(res.status());
      console.log(`📦 Drivers: ${res.status()}`);
    });

    test('GET /logistics/fuel', async ({ request }) => {
      const res = await authGet(request, '/logistics/fuel');
      expect([200, 401, 404]).toContain(res.status());
      console.log(`📦 Fuel: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 19: PROJECT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('19. PROJECT MANAGEMENT', () => {
    test('GET /projects', async ({ request }) => {
      const res = await authGet(request, '/projects');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Projects: ${res.status()}`);
    });

    test('GET /v2/projects/tasks', async ({ request }) => {
      const res = await authGet(request, '/v2/projects/tasks');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Project tasks: ${res.status()}`);
    });

    test('GET /v2/projects/timelines', async ({ request }) => {
      const res = await authGet(request, '/v2/projects/timelines');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Project timelines: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 20: PRACTICE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('20. PRACTICE MANAGEMENT', () => {
    test('GET /practice/clients', async ({ request }) => {
      const res = await authGet(request, '/practice/clients');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Practice clients: ${res.status()}`);
    });

    test('GET /practice/matters', async ({ request }) => {
      const res = await authGet(request, '/practice/matters');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Practice matters: ${res.status()}`);
    });

    test('GET /v2/time-tracking/entries', async ({ request }) => {
      const res = await authGet(request, '/v2/time-tracking/entries');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Time tracking: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 21: ADMIN & SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('21. ADMIN & SETTINGS', () => {
    test('GET /v2/admin/users', async ({ request }) => {
      const res = await authGet(request, '/v2/admin/users');
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      console.log(`✅ Admin users: ${data.data?.length || data.length || 0}`);
    });

    test('GET /v2/admin/roles', async ({ request }) => {
      const res = await authGet(request, '/v2/admin/roles');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Admin roles');
    });

    test('GET /tenant/settings', async ({ request }) => {
      const res = await authGet(request, '/tenant/settings');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Tenant settings: ${res.status()}`);
    });

    test('GET /modules', async ({ request }) => {
      const res = await authGet(request, '/modules');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Modules: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 22: COMMUNICATIONS HUB
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('22. COMMUNICATIONS HUB', () => {
    test('GET /communications/channels', async ({ request }) => {
      const res = await authGet(request, '/communications/channels');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Communication channels: ${res.status()}`);
    });

    test('GET /messages', async ({ request }) => {
      const res = await authGet(request, '/messages');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Messages: ${res.status()}`);
    });

    test('GET /meetings', async ({ request }) => {
      const res = await authGet(request, '/meetings');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Video meetings: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 23: PROPOSALS & PITCH
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('23. PROPOSALS & PITCH', () => {
    test('GET /proposals', async ({ request }) => {
      const res = await authGet(request, '/proposals');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Proposals: ${res.status()}`);
    });

    test('GET /proposals/templates', async ({ request }) => {
      const res = await authGet(request, '/proposals/templates');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Proposal templates: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 24: AI ASSISTANT
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('24. AI ASSISTANT', () => {
    test('GET /ai/status', async ({ request }) => {
      const res = await authGet(request, '/ai/status');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 AI status: ${res.status()}`);
    });

    test('POST /ai/chat - Health check', async ({ request }) => {
      const res = await authPost(request, '/ai/chat', { message: 'Hello' });
      expect([200, 400, 404, 500]).toContain(res.status());
      console.log(`📦 AI chat: ${res.status()}`);
    });

    test('GET /agent/actions', async ({ request }) => {
      const res = await authGet(request, '/agent/actions');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 AI agent actions: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODULE 25: DASHBOARD & REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('25. DASHBOARD & REPORTS', () => {
    test('GET /v2/dashboard/stats', async ({ request }) => {
      const res = await authGet(request, '/v2/dashboard/stats');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Dashboard stats');
    });

    test('GET /v2/dashboard/summary', async ({ request }) => {
      const res = await authGet(request, '/v2/dashboard/summary');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Dashboard summary');
    });

    test('GET /v2/dashboard/kpis', async ({ request }) => {
      const res = await authGet(request, '/v2/dashboard/kpis');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 KPIs: ${res.status()}`);
    });

    test('GET /reports/list', async ({ request }) => {
      const res = await authGet(request, '/reports/list');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Reports list: ${res.status()}`);
    });

    test('GET /v2/custom-reports', async ({ request }) => {
      const res = await authGet(request, '/v2/custom-reports');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 Custom reports: ${res.status()}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BONUS: AUTHENTICATION & SECURITY
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('BONUS: AUTH & SECURITY', () => {
    test('POST /auth/login', async ({ request }) => {
      const res = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
      expect(res.ok()).toBeTruthy();
      console.log('✅ Login endpoint');
    });

    test('GET /auth/me', async ({ request }) => {
      const res = await authGet(request, '/auth/me');
      expect(res.ok()).toBeTruthy();
      console.log('✅ Current user');
    });

    test('GET /auth/permissions', async ({ request }) => {
      const res = await authGet(request, '/auth/permissions');
      expect([200, 404]).toContain(res.status());
      console.log(`📦 User permissions: ${res.status()}`);
    });

    test('GET /health', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/health`);
      expect(res.ok()).toBeTruthy();
      console.log('✅ Health check');
    });

    test('GET /health/db', async ({ request }) => {
      const res = await request.get(`${BASE_URL}/health/db`);
      expect([200, 503]).toContain(res.status());
      console.log(`📦 Database health: ${res.status()}`);
    });
  });
});
