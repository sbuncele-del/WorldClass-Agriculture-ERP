/**
 * FULL MODULE AUDIT - WorldClass ERP (V2 API)
 * Tests ALL 25 modules using V2 endpoints
 * 
 * Status codes:
 * ✅ 200/201 = WORKING
 * ⚠️ 404 = NOT WIRED (route missing)
 * ❌ 500 = BROKEN (needs fixing)
 * 🔒 401/403 = AUTH ISSUE
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://siyabusaerp.co.za';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  email: 'test@test.com',
  password: 'Test123',
  tenantId: '1'
};

interface TestResult {
  endpoint: string;
  status: number;
  category: 'WORKING' | 'NOT_WIRED' | 'BROKEN' | 'AUTH_ISSUE';
  error?: string;
}

const results: TestResult[] = [];

test.describe.configure({ mode: 'serial' });

let authToken: string;

// Get auth token first
test.beforeAll(async ({ request }) => {
  const loginResponse = await request.post(`${API_URL}/auth/login`, {
    data: TEST_USER
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }
  
  const loginData = await loginResponse.json();
  authToken = loginData.data?.tokens?.accessToken || loginData.token;
  console.log('🔑 Authentication successful\n');
});

// Helper to test endpoint and categorize result
async function testEndpoint(request: any, method: string, path: string, body?: any): Promise<TestResult> {
  const fullPath = `${API_URL}${path}`;
  
  try {
    const response = method === 'GET' 
      ? await request.get(fullPath, { headers: { 'Authorization': `Bearer ${authToken}`, 'x-tenant-id': '1' } })
      : await request.post(fullPath, { 
          headers: { 'Authorization': `Bearer ${authToken}`, 'x-tenant-id': '1' },
          data: body 
        });
    
    const status = response.status();
    let category: TestResult['category'];
    let error: string | undefined;
    
    if (status >= 200 && status < 300) {
      category = 'WORKING';
    } else if (status === 404) {
      category = 'NOT_WIRED';
    } else if (status === 401 || status === 403) {
      category = 'AUTH_ISSUE';
    } else {
      category = 'BROKEN';
      try {
        const data = await response.json();
        error = data.error || data.message || data.details || JSON.stringify(data).substring(0, 100);
      } catch {
        error = `Status ${status}`;
      }
    }
    
    return { endpoint: `${method} ${path}`, status, category, error };
  } catch (e: any) {
    return { endpoint: `${method} ${path}`, status: 0, category: 'BROKEN', error: e.message };
  }
}

// ============================================================================
// MODULE 1: AUTHENTICATION
// ============================================================================
test('Module 1: Authentication', async ({ request }) => {
  console.log('\n📦 MODULE 1: AUTHENTICATION');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/auth/me'),
    await testEndpoint(request, 'GET', '/auth/permissions'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : r.category === 'AUTH_ISSUE' ? '🔒' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
  
  expect(endpoints.some(e => e.category === 'WORKING')).toBeTruthy();
});

// ============================================================================
// MODULE 2: DASHBOARD
// ============================================================================
test('Module 2: Dashboard', async ({ request }) => {
  console.log('\n📦 MODULE 2: DASHBOARD');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/dashboard/stats'),
    await testEndpoint(request, 'GET', '/v2/dashboard/summary'),
    await testEndpoint(request, 'GET', '/v2/dashboard/kpis'),
    await testEndpoint(request, 'GET', '/v2/dashboard/revenue-trend'),
    await testEndpoint(request, 'GET', '/v2/dashboard/expense-breakdown'),
    await testEndpoint(request, 'GET', '/v2/dashboard/cash-position'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 3: INVENTORY MANAGEMENT
// ============================================================================
test('Module 3: Inventory Management', async ({ request }) => {
  console.log('\n📦 MODULE 3: INVENTORY MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/inventory/items'),
    await testEndpoint(request, 'GET', '/v2/inventory/stock-levels'),
    await testEndpoint(request, 'GET', '/v2/inventory/warehouses'),
    await testEndpoint(request, 'GET', '/v2/inventory/categories'),
    await testEndpoint(request, 'GET', '/v2/inventory/movements'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 4: SALES & CRM
// ============================================================================
test('Module 4: Sales & CRM', async ({ request }) => {
  console.log('\n📦 MODULE 4: SALES & CRM');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/sales/invoices'),
    await testEndpoint(request, 'GET', '/v2/sales/customers'),
    await testEndpoint(request, 'GET', '/v2/sales/quotes'),
    await testEndpoint(request, 'GET', '/v2/sales/orders'),
    await testEndpoint(request, 'GET', '/v2/sales/credit-notes'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 5: PURCHASE MANAGEMENT
// ============================================================================
test('Module 5: Purchase Management', async ({ request }) => {
  console.log('\n📦 MODULE 5: PURCHASE MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/purchase/orders'),
    await testEndpoint(request, 'GET', '/v2/purchase/suppliers'),
    await testEndpoint(request, 'GET', '/v2/purchase/invoices'),
    await testEndpoint(request, 'GET', '/v2/purchase/receipts'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 6: FINANCIAL ACCOUNTING
// ============================================================================
test('Module 6: Financial Accounting', async ({ request }) => {
  console.log('\n📦 MODULE 6: FINANCIAL ACCOUNTING');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/financial/accounts'),
    await testEndpoint(request, 'GET', '/v2/financial/journal-entries'),
    await testEndpoint(request, 'GET', '/v2/financial/balance-sheet'),
    await testEndpoint(request, 'GET', '/v2/financial/income-statement'),
    await testEndpoint(request, 'GET', '/v2/financial/trial-balance'),
    await testEndpoint(request, 'GET', '/v2/financial/cash-flow'),
    await testEndpoint(request, 'GET', '/v2/financial/reports/balance-sheet'),
    await testEndpoint(request, 'GET', '/v2/financial/reports/income-statement'),
    await testEndpoint(request, 'GET', '/v2/financial/recurring-entries'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 7: HR & PAYROLL
// ============================================================================
test('Module 7: HR & Payroll', async ({ request }) => {
  console.log('\n📦 MODULE 7: HR & PAYROLL');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/hr/employees'),
    await testEndpoint(request, 'GET', '/v2/hr/departments'),
    await testEndpoint(request, 'GET', '/v2/hr/leave-requests'),
    await testEndpoint(request, 'GET', '/v2/hr/payroll'),
    await testEndpoint(request, 'GET', '/v2/hr/attendance'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 8: MANUFACTURING
// ============================================================================
test('Module 8: Manufacturing', async ({ request }) => {
  console.log('\n📦 MODULE 8: MANUFACTURING');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/manufacturing/work-orders'),
    await testEndpoint(request, 'GET', '/v2/manufacturing/bom'),
    await testEndpoint(request, 'GET', '/v2/manufacturing/production-lines'),
    await testEndpoint(request, 'GET', '/v2/manufacturing/quality-control'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 9: WAREHOUSE MANAGEMENT
// ============================================================================
test('Module 9: Warehouse Management', async ({ request }) => {
  console.log('\n📦 MODULE 9: WAREHOUSE MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/warehouse/locations'),
    await testEndpoint(request, 'GET', '/v2/warehouse/transfers'),
    await testEndpoint(request, 'GET', '/v2/warehouse/picking-lists'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 10: ASSET MANAGEMENT
// ============================================================================
test('Module 10: Asset Management', async ({ request }) => {
  console.log('\n📦 MODULE 10: ASSET MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/assets'),
    await testEndpoint(request, 'GET', '/v2/assets/categories'),
    await testEndpoint(request, 'GET', '/v2/assets/depreciation'),
    await testEndpoint(request, 'GET', '/v2/assets/disposals'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 11: CASH MANAGEMENT
// ============================================================================
test('Module 11: Cash Management', async ({ request }) => {
  console.log('\n📦 MODULE 11: CASH MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/cash-management/bank-accounts'),
    await testEndpoint(request, 'GET', '/v2/cash-management/transactions'),
    await testEndpoint(request, 'GET', '/v2/cash-management/reconciliation'),
    await testEndpoint(request, 'GET', '/v2/cash-management/forecasts'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 12: COMPLIANCE HUB
// ============================================================================
test('Module 12: Compliance Hub', async ({ request }) => {
  console.log('\n📦 MODULE 12: COMPLIANCE HUB');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/compliance/requirements'),
    await testEndpoint(request, 'GET', '/v2/compliance/audits'),
    await testEndpoint(request, 'GET', '/v2/compliance/policies'),
    await testEndpoint(request, 'GET', '/v2/compliance/sars/status'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 13: AUDIT HUB
// ============================================================================
test('Module 13: Audit Hub', async ({ request }) => {
  console.log('\n📦 MODULE 13: AUDIT HUB');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/audit/readiness'),
    await testEndpoint(request, 'GET', '/v2/audit/logs'),
    await testEndpoint(request, 'GET', '/v2/audit/trail'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 14: MULTI-ENTITY
// ============================================================================
test('Module 14: Multi-Entity', async ({ request }) => {
  console.log('\n📦 MODULE 14: MULTI-ENTITY');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/multi-entity/entities'),
    await testEndpoint(request, 'GET', '/v2/multi-entity/intercompany'),
    await testEndpoint(request, 'GET', '/v2/multi-entity/consolidation'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 15: HEALTHCARE
// ============================================================================
test('Module 15: Healthcare', async ({ request }) => {
  console.log('\n📦 MODULE 15: HEALTHCARE');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/healthcare/patients'),
    await testEndpoint(request, 'GET', '/v2/healthcare/appointments'),
    await testEndpoint(request, 'GET', '/v2/healthcare/inventory'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 16: MINING
// ============================================================================
test('Module 16: Mining', async ({ request }) => {
  console.log('\n📦 MODULE 16: MINING');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/mining/operations'),
    await testEndpoint(request, 'GET', '/v2/mining/safety'),
    await testEndpoint(request, 'GET', '/v2/mining/minerals'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 17: CONSTRUCTION
// ============================================================================
test('Module 17: Construction', async ({ request }) => {
  console.log('\n📦 MODULE 17: CONSTRUCTION');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/construction/projects'),
    await testEndpoint(request, 'GET', '/v2/construction/contracts'),
    await testEndpoint(request, 'GET', '/v2/construction/progress'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 18: PROPERTY MANAGEMENT
// ============================================================================
test('Module 18: Property Management', async ({ request }) => {
  console.log('\n📦 MODULE 18: PROPERTY MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/property/properties'),
    await testEndpoint(request, 'GET', '/v2/property/leases'),
    await testEndpoint(request, 'GET', '/v2/property/tenants'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 19: AGRICULTURE
// ============================================================================
test('Module 19: Agriculture', async ({ request }) => {
  console.log('\n📦 MODULE 19: AGRICULTURE');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/agriculture/farms'),
    await testEndpoint(request, 'GET', '/v2/agriculture/crops'),
    await testEndpoint(request, 'GET', '/v2/agriculture/livestock'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 20: LOGISTICS & FLEET
// ============================================================================
test('Module 20: Logistics & Fleet', async ({ request }) => {
  console.log('\n📦 MODULE 20: LOGISTICS & FLEET');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/logistics/vehicles'),
    await testEndpoint(request, 'GET', '/v2/logistics/trips'),
    await testEndpoint(request, 'GET', '/v2/logistics/fuel'),
    await testEndpoint(request, 'GET', '/v2/logistics/deliveries'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 21: PROJECT MANAGEMENT
// ============================================================================
test('Module 21: Project Management', async ({ request }) => {
  console.log('\n📦 MODULE 21: PROJECT MANAGEMENT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/projects'),
    await testEndpoint(request, 'GET', '/v2/practice/projects'),
    await testEndpoint(request, 'GET', '/v2/practice/tasks'),
    await testEndpoint(request, 'GET', '/v2/practice/time-entries'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 22: ADMIN & SETTINGS
// ============================================================================
test('Module 22: Admin & Settings', async ({ request }) => {
  console.log('\n📦 MODULE 22: ADMIN & SETTINGS');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/admin/users'),
    await testEndpoint(request, 'GET', '/v2/admin/roles'),
    await testEndpoint(request, 'GET', '/v2/admin/permissions'),
    await testEndpoint(request, 'GET', '/v2/admin/settings'),
    await testEndpoint(request, 'GET', '/v2/admin/modules'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 23: COMMUNICATIONS HUB
// ============================================================================
test('Module 23: Communications Hub', async ({ request }) => {
  console.log('\n📦 MODULE 23: COMMUNICATIONS HUB');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/communications/channels'),
    await testEndpoint(request, 'GET', '/v2/communications/messages'),
    await testEndpoint(request, 'GET', '/v2/communications/meetings'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 24: PROPOSALS & PITCH
// ============================================================================
test('Module 24: Proposals & Pitch', async ({ request }) => {
  console.log('\n📦 MODULE 24: PROPOSALS & PITCH');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/proposals'),
    await testEndpoint(request, 'GET', '/v2/proposals/templates'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 25: AI ASSISTANT
// ============================================================================
test('Module 25: AI Assistant', async ({ request }) => {
  console.log('\n📦 MODULE 25: AI ASSISTANT');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/ai/status'),
    await testEndpoint(request, 'POST', '/v2/ai/query', { query: 'test' }),
    await testEndpoint(request, 'GET', '/v2/ai/agents'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 26: REPORTS & ANALYTICS
// ============================================================================
test('Module 26: Reports & Analytics', async ({ request }) => {
  console.log('\n📦 MODULE 26: REPORTS & ANALYTICS');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/reports'),
    await testEndpoint(request, 'GET', '/v2/reports/custom'),
    await testEndpoint(request, 'GET', '/v2/reports/analytics'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// MODULE 27: CALENDAR & EVENTS
// ============================================================================
test('Module 27: Calendar & Events', async ({ request }) => {
  console.log('\n📦 MODULE 27: CALENDAR & EVENTS');
  
  const endpoints = [
    await testEndpoint(request, 'GET', '/v2/calendar/events'),
    await testEndpoint(request, 'GET', '/v2/calendar/schedules'),
  ];
  
  endpoints.forEach(r => {
    results.push(r);
    const icon = r.category === 'WORKING' ? '✅' : r.category === 'NOT_WIRED' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.endpoint} (${r.status})${r.error ? ` - ${r.error}` : ''}`);
  });
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
test.afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL V2 API AUDIT SUMMARY');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.category === 'WORKING');
  const notWired = results.filter(r => r.category === 'NOT_WIRED');
  const broken = results.filter(r => r.category === 'BROKEN');
  const authIssue = results.filter(r => r.category === 'AUTH_ISSUE');
  
  console.log(`\n✅ WORKING: ${working.length} endpoints`);
  console.log(`⚠️ NOT WIRED (404): ${notWired.length} endpoints`);
  console.log(`❌ BROKEN (500): ${broken.length} endpoints`);
  console.log(`🔒 AUTH ISSUE: ${authIssue.length} endpoints`);
  console.log(`\n📈 TOTAL: ${results.length} endpoints tested`);
  
  if (notWired.length > 0) {
    console.log('\n⚠️ NOT WIRED ENDPOINTS (NEED V2 ROUTES):');
    notWired.forEach(r => console.log(`  ⚠️ ${r.endpoint}`));
  }
  
  if (broken.length > 0) {
    console.log('\n❌ BROKEN ENDPOINTS (NEED FIXING):');
    broken.forEach(r => console.log(`  ❌ ${r.endpoint}${r.error ? ` - ${r.error}` : ''}`));
  }
  
  console.log('\n' + '='.repeat(60));
});
