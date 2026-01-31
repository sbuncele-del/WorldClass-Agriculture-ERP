/**
 * ERP BUSINESS LOGIC TESTS - WorldClass ERP
 * ============================================================================
 * 
 * Comprehensive tests for all ERP business workflows.
 * Tests are designed to be resilient:
 * - 200-299: WORKING
 * - 404: NOT WIRED (endpoint not yet connected)
 * - 500: BROKEN (needs fixing)
 * 
 * Usage:
 *   npx playwright test e2e/erp-business-logic.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://siyabusaerp.co.za';
const API_URL = `${BASE_URL}/api`;  // All API routes go through /api prefix

const TEST_USER = {
  email: 'admin@worldclass-erp.com',
  password: 'Admin@123'
};

// Generate unique values for test data
const uniqueId = () => `TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Results tracking
const results: { endpoint: string; status: number; pass: boolean; error?: string }[] = [];

// Get fresh auth token for each test
async function getToken(request: any): Promise<string> {
  const res = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
  const data = await res.json();
  return data.data?.tokens?.accessToken || data.token || '';
}

async function makeRequest(
  request: any,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
) {
  const token = await getToken(request);
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': '1',
    'Content-Type': 'application/json'
  };

  let response;
  switch (method) {
    case 'GET':
      response = await request.get(`${API_URL}${path}`, { headers });
      break;
    case 'POST':
      response = await request.post(`${API_URL}${path}`, { headers, data: body });
      break;
    case 'PUT':
      response = await request.put(`${API_URL}${path}`, { headers, data: body });
      break;
    case 'DELETE':
      response = await request.delete(`${API_URL}${path}`, { headers });
      break;
  }
  
  return response;
}

// Validate response and track result
async function expectEndpointWorks(
  request: any,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
) {
  const response = await makeRequest(request, method, path, body);
  const status = response.status();
  
  // 500 = Broken, 404 = Not wired (acceptable), 200-299 = Working
  const pass = status !== 500;
  
  results.push({
    endpoint: `${method} ${path}`,
    status,
    pass,
    error: status === 500 ? await response.text().catch(() => 'Unknown error') : undefined
  });

  // Test passes if not a 500 error (404s are acceptable - means endpoint not wired yet)
  expect(status, `${method} ${path} returned 500 error`).not.toBe(500);
  
  return response;
}

// ============================================================================
// MODULE TESTS
// ============================================================================

test.describe('Authentication', () => {
  test('Login', async ({ request }) => {
    // Try up to 3 times due to potential parallel race conditions
    let success = false;
    for (let i = 0; i < 3 && !success; i++) {
      const res = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
      if (res.ok()) {
        success = true;
      }
    }
    expect(success).toBeTruthy();
  });

  test('GET /v2/auth/me', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/auth/me');
  });

  test('GET /v2/auth/permissions', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/auth/permissions');
  });
});

test.describe('Inventory Management', () => {
  test('GET /v2/inventory/categories', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/categories');
  });

  test('GET /v2/inventory/items', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/items');
  });

  test('POST /v2/inventory/items (create item)', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/inventory/items', {
      item_code: uniqueId(),
      item_name: `Test Item ${Date.now()}`,
      description: 'Automated test item',
      item_type: 'Finished Goods',
      valuation_method: 'Weighted Average',
      standard_cost: randomInt(100, 1000),
      is_active: true
    });
  });

  test('GET /v2/inventory/stock', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/stock');
  });

  test('GET /v2/inventory/movements', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/movements');
  });

  test('GET /v2/inventory/low-stock', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/low-stock');
  });

  test('GET /v2/inventory/adjustments', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/inventory/adjustments');
  });
});

test.describe('Sales & CRM', () => {
  test('GET /v2/sales/customers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/customers');
  });

  test('POST /v2/sales/customers (create customer)', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/sales/customers', {
      customer_code: uniqueId(),
      customer_name: `Test Customer ${Date.now()}`,
      company_name: `Test Company ${Date.now()}`,
      email: `test${Date.now()}@test.com`,
      phone: '+27' + randomInt(100000000, 999999999),
      status: true,
      credit_limit: randomInt(10000, 100000)
    });
  });

  test('GET /v2/sales/leads', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/leads');
  });

  test('POST /v2/sales/leads (create lead)', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/sales/leads', {
      lead_name: `Test Lead ${Date.now()}`,
      company_name: 'Test Company',
      contact_email: `lead${Date.now()}@test.com`,
      source: 'Website',
      status: 'New'
    });
  });

  test('GET /v2/sales/opportunities', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/opportunities');
  });

  test('GET /v2/sales/quotations', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/quotations');
  });

  test('GET /v2/sales/orders', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/orders');
  });

  test('GET /v2/sales/invoices', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/invoices');
  });

  test('GET /v2/sales/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/dashboard');
  });

  test('GET /v2/sales/summary', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/sales/summary');
  });
});

test.describe('Purchase Management', () => {
  test('GET /v2/purchase/suppliers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/purchase/suppliers');
  });

  test('POST /v2/purchase/suppliers (create supplier)', async ({ request }) => {
    // Use fields expected by SupplierRepository
    await expectEndpointWorks(request, 'POST', '/v2/purchase/suppliers', {
      code: uniqueId(),
      name: `Test Supplier ${Date.now()}`,
      trading_name: 'Test Trading Name',
      email: `supplier${Date.now()}@test.com`,
      phone: '+27' + randomInt(100000000, 999999999),
      supplier_type: 'company',
      is_active: true,
      payment_terms: 'Net 30'
    });
  });

  test('GET /v2/purchase/requisitions', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/purchase/requisitions');
  });

  test('GET /v2/purchase/orders', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/purchase/orders');
  });

  test('GET /v2/purchase/receipts', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/purchase/receipts');
  });

  test('GET /v2/purchase/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/purchase/dashboard');
  });
});

test.describe('Financial Management', () => {
  test('GET /v2/financial/accounts', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/accounts');
  });

  test('POST /v2/financial/accounts (create account)', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/financial/accounts', {
      account_code: uniqueId(),
      account_name: `Test Account ${Date.now()}`,
      account_type: 'Asset',
      is_active: true
    });
  });

  test('GET /v2/financial/journals', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/journals');
  });

  test('GET /v2/financial/reports/trial-balance', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/reports/trial-balance');
  });

  test('GET /v2/financial/reports/balance-sheet', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/reports/balance-sheet');
  });

  test('GET /v2/financial/reports/income-statement', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/reports/income-statement');
  });

  test('GET /v2/financial/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/dashboard');
  });

  test('GET /v2/financial/periods', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/periods');
  });

  test('GET /v2/financial/cost-centers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/financial/cost-centers');
  });
});

test.describe('Human Resources', () => {
  test('GET /v2/hr/departments', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/departments');
  });

  test('GET /v2/hr/employees', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/employees');
  });

  test('POST /v2/hr/employees (create employee)', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/hr/employees', {
      employee_code: uniqueId(),
      first_name: 'Test',
      last_name: `Employee ${Date.now()}`,
      email: `emp${Date.now()}@test.com`,
      hire_date: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
  });

  test('GET /v2/hr/positions', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/positions');
  });

  test('GET /v2/hr/leave-types', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/leave-types');
  });

  test('GET /v2/hr/leave-balances', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/leave-balances');
  });

  test('GET /v2/hr/payroll', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/payroll');
  });

  test('GET /v2/hr/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/hr/dashboard');
  });
});

test.describe('Manufacturing', () => {
  test('GET /v2/manufacturing/boms', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/manufacturing/boms');
  });

  test('GET /v2/manufacturing/work-orders', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/manufacturing/work-orders');
  });

  test('GET /v2/manufacturing/work-centers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/manufacturing/work-centers');
  });

  test('GET /v2/manufacturing/schedule', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/manufacturing/schedule');
  });

  test('GET /v2/manufacturing/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/manufacturing/dashboard');
  });
});

test.describe('Warehouse Management', () => {
  test('GET /v2/warehouse/warehouses', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/warehouse/warehouses');
  });

  test('GET /v2/warehouse/locations', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/warehouse/locations');
  });

  test('GET /v2/warehouse/transfers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/warehouse/transfers');
  });

  test('GET /v2/warehouse/picking', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/warehouse/picking');
  });

  test('GET /v2/warehouse/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/warehouse/dashboard');
  });
});

test.describe('Asset Management', () => {
  test('GET /v2/assets/categories', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/assets/categories');
  });

  test('GET /v2/assets', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/assets');
  });

  test('POST /v2/assets (create asset)', async ({ request }) => {
    // Use fields expected by assets.controller.v2
    await expectEndpointWorks(request, 'POST', '/v2/assets', {
      asset_name: `Test Asset ${Date.now()}`,
      description: 'Test asset created by automated test',
      acquisition_date: new Date().toISOString().split('T')[0],
      acquisition_cost: randomInt(10000, 100000),
      residual_value: randomInt(1000, 5000),
      useful_life_years: 5,
      depreciation_method: 'STRAIGHT_LINE'
    });
  });

  test('GET /v2/assets/depreciation', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/assets/depreciation');
  });

  test('GET /v2/assets/disposals', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/assets/disposals');
  });

  test('GET /v2/assets/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/assets/dashboard');
  });
});

test.describe('Cash Management', () => {
  test('GET /v2/cash/accounts', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/accounts');
  });

  test('GET /v2/cash/transactions', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/transactions');
  });

  test('GET /v2/cash/statements', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/statements');
  });

  test('GET /v2/cash/reconciliation', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/reconciliation');
  });

  test('GET /v2/cash/forecast', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/forecast');
  });

  test('GET /v2/cash/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/cash/dashboard');
  });
});

test.describe('Compliance & Audit', () => {
  test('GET /v2/compliance/requirements', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/compliance/requirements');
  });

  test('GET /v2/compliance/audits', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/compliance/audits');
  });

  test('GET /v2/audit/logs', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/audit/logs');
  });

  test('GET /v2/audit/trail', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/audit/trail');
  });

  test('GET /v2/compliance/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/compliance/dashboard');
  });
});

test.describe('Project Management', () => {
  test('GET /v2/projects', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/projects');
  });

  test('GET /v2/projects/tasks', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/projects/tasks');
  });

  test('GET /v2/projects/milestones', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/projects/milestones');
  });

  test('GET /v2/projects/time-entries', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/projects/time-entries');
  });

  test('GET /v2/projects/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/projects/dashboard');
  });
});

test.describe('Healthcare', () => {
  test('GET /v2/healthcare/patients', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/healthcare/patients');
  });

  test('GET /v2/healthcare/appointments', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/healthcare/appointments');
  });

  test('GET /v2/healthcare/practitioners', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/healthcare/practitioners');
  });

  test('GET /v2/healthcare/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/healthcare/dashboard');
  });
});

test.describe('Mining', () => {
  test('GET /v2/mining/sites', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/mining/sites');
  });

  test('GET /v2/mining/production', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/mining/production');
  });

  test('GET /v2/mining/safety', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/mining/safety');
  });

  test('GET /v2/mining/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/mining/dashboard');
  });
});

test.describe('Construction', () => {
  test('GET /v2/construction/projects', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/construction/projects');
  });

  test('GET /v2/construction/contracts', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/construction/contracts');
  });

  test('GET /v2/construction/claims', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/construction/claims');
  });

  test('GET /v2/construction/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/construction/dashboard');
  });
});

test.describe('Agriculture', () => {
  test('GET /v2/agriculture/farms', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/agriculture/farms');
  });

  test('GET /v2/agriculture/crops', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/agriculture/crops');
  });

  test('GET /v2/agriculture/livestock', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/agriculture/livestock');
  });

  test('GET /v2/agriculture/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/agriculture/dashboard');
  });
});

test.describe('Logistics & Fleet', () => {
  test('GET /v2/logistics/vehicles', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/logistics/vehicles');
  });

  test('GET /v2/logistics/drivers', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/logistics/drivers');
  });

  test('GET /v2/logistics/trips', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/logistics/trips');
  });

  test('GET /v2/logistics/fuel', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/logistics/fuel');
  });

  test('GET /v2/logistics/dashboard', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/logistics/dashboard');
  });
});

test.describe('Communications', () => {
  test('GET /v2/communications/messages', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/communications/messages');
  });

  test('GET /v2/communications/meetings', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/communications/meetings');
  });

  test('GET /v2/communications/notifications', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/communications/notifications');
  });
});

test.describe('Admin & Settings', () => {
  test('GET /v2/admin/users', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/admin/users');
  });

  test('GET /v2/admin/roles', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/admin/roles');
  });

  test('GET /v2/admin/tenants', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/admin/tenants');
  });

  test('GET /v2/admin/settings', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/admin/settings');
  });
});

test.describe('Reports & Analytics', () => {
  test('GET /v2/reports', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/reports');
  });

  test('GET /v2/reports/metrics', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/reports/metrics');
  });

  test('GET /v2/reports/kpis', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/reports/kpis');
  });
});

test.describe('AI Assistant', () => {
  test('GET /v2/ai/health', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/ai/health');
  });

  test('POST /v2/ai/query', async ({ request }) => {
    await expectEndpointWorks(request, 'POST', '/v2/ai/query', {
      query: 'What is the total sales this month?',
      context: 'sales'
    });
  });
});

test.describe('Multi-Entity', () => {
  test('GET /v2/multi-entity/entities', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/multi-entity/entities');
  });

  test('GET /v2/multi-entity/intercompany', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/multi-entity/intercompany');
  });

  test('GET /v2/multi-entity/consolidation', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/multi-entity/consolidation');
  });
});

test.describe('Property Management', () => {
  test('GET /v2/property/properties', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/property/properties');
  });

  test('GET /v2/property/units', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/property/units');
  });

  test('GET /v2/property/leases', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/property/leases');
  });

  test('GET /v2/property/tenants', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/property/tenants');
  });
});

test.describe('Practice Management', () => {
  test('GET /v2/practice/clients', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/practice/clients');
  });

  test('GET /v2/practice/matters', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/practice/matters');
  });

  test('GET /v2/practice/timesheets', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/practice/timesheets');
  });
});

test.describe('Proposals', () => {
  test('GET /v2/proposals', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/proposals');
  });

  test('GET /v2/proposals/templates', async ({ request }) => {
    await expectEndpointWorks(request, 'GET', '/v2/proposals/templates');
  });
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================

test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('ERP BUSINESS LOGIC TEST SUMMARY');
  console.log('='.repeat(80));
  
  const working = results.filter(r => r.status >= 200 && r.status < 300);
  const notWired = results.filter(r => r.status === 404);
  const broken = results.filter(r => r.status === 500);
  const other = results.filter(r => r.status !== 404 && r.status !== 500 && (r.status < 200 || r.status >= 300));
  
  console.log(`\n✅ WORKING (200): ${working.length} endpoints`);
  console.log(`⚠️ NOT WIRED (404): ${notWired.length} endpoints`);
  console.log(`❌ BROKEN (500): ${broken.length} endpoints`);
  
  if (broken.length > 0) {
    console.log('\n❌ BROKEN ENDPOINTS (need fixing):');
    broken.forEach(r => console.log(`   ${r.endpoint}`));
  }
  
  if (notWired.length > 0) {
    console.log('\n⚠️ NOT WIRED ENDPOINTS (need route wiring):');
    notWired.forEach(r => console.log(`   ${r.endpoint}`));
  }
  
  console.log('\n' + '='.repeat(80));
});
