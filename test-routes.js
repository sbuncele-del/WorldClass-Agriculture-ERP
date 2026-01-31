#!/usr/bin/env node
const https = require('https');

const BASE_URL = 'https://siyabusaerp.co.za';
const LOGIN_ENDPOINT = '/api/auth/login';  // Auth is NOT under v2
const LOGIN_PAYLOAD = JSON.stringify({
  email: 'Sibusiso@sgbsgroup.co.za',
  password: 'Masaphokati2025!',
  tenantId: 'b36ec5a6-b637-4716-84eb-3c53eb1c7093'
});

// All endpoints to test
const endpoints = [
  // Auth (NOT under v2)
  { method: 'POST', path: '/api/auth/login', body: LOGIN_PAYLOAD, noAuth: true },
  { method: 'GET', path: '/api/auth/me' },
  
  // Dashboard
  { method: 'GET', path: '/api/v2/dashboard/stats' },
  { method: 'GET', path: '/api/v2/dashboard/summary' },
  
  // Inventory
  { method: 'GET', path: '/api/v2/inventory/items' },
  { method: 'GET', path: '/api/v2/inventory/stock-levels' },
  { method: 'GET', path: '/api/v2/inventory/warehouses' },
  
  // Sales
  { method: 'GET', path: '/api/v2/sales/invoices' },
  { method: 'GET', path: '/api/v2/sales/customers' },
  { method: 'GET', path: '/api/v2/sales/quotes' },
  
  // Purchases
  { method: 'GET', path: '/api/v2/purchases/orders' },
  { method: 'GET', path: '/api/v2/purchases/suppliers' },
  
  // Financial
  { method: 'GET', path: '/api/v2/financial/accounts' },
  { method: 'GET', path: '/api/v2/financial/balance-sheet' },
  { method: 'GET', path: '/api/v2/financial/income-statement' },
  { method: 'GET', path: '/api/v2/financial/journal-entries' },
  
  // HR
  { method: 'GET', path: '/api/v2/hr/employees' },
  { method: 'GET', path: '/api/v2/hr/departments' },
  
  // Assets
  { method: 'GET', path: '/api/v2/assets/list' },
  { method: 'GET', path: '/api/v2/assets/categories' },
  
  // Manufacturing
  { method: 'GET', path: '/api/v2/manufacturing/work-orders' },
  { method: 'GET', path: '/api/v2/manufacturing/bom' },
  
  // Projects
  { method: 'GET', path: '/api/v2/projects/list' },
  { method: 'GET', path: '/api/v2/projects/tasks' },
  
  // Cash Management
  { method: 'GET', path: '/api/v2/cash-management/bank-accounts' },
  { method: 'GET', path: '/api/v2/cash-management/cash-position' },
  { method: 'GET', path: '/api/v2/cash-management/forecasts' },
  
  // Compliance
  { method: 'GET', path: '/api/v2/compliance/requirements' },
  
  // Multi-entity
  { method: 'GET', path: '/api/v2/multi-entity/entities' },
  
  // Audit
  { method: 'GET', path: '/api/v2/audit/logs' },
  
  // Admin
  { method: 'GET', path: '/api/v2/admin/users' },
  { method: 'GET', path: '/api/v2/admin/roles' },
  
  // Reports
  { method: 'GET', path: '/api/v2/reports/list' },
];

function makeRequest(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data.substring(0, 100) });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 E2E API Route Testing\n');
  console.log('=' .repeat(60));
  
  // First, login to get token
  console.log('\n📋 Authenticating...');
  const loginResult = await makeRequest('POST', LOGIN_ENDPOINT, LOGIN_PAYLOAD);
  
  if (loginResult.status !== 200 || (!loginResult.data?.token && !loginResult.data?.data?.tokens?.accessToken)) {
    console.log('❌ Login failed:', loginResult);
    process.exit(1);
  }
  
  const token = loginResult.data.token || loginResult.data.data?.tokens?.accessToken;
  console.log('✅ Login successful\n');
  console.log('=' .repeat(60));
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const endpoint of endpoints) {
    const useToken = !endpoint.noAuth;
    const result = await makeRequest(
      endpoint.method,
      endpoint.path,
      endpoint.body,
      useToken ? token : null
    );
    
    // Consider 200, 201, and empty arrays/objects as success
    const is404 = result.status === 404;
    const is500 = result.status >= 500;
    const isSuccess = !is404 && !is500 && result.status >= 200 && result.status < 400;
    
    if (isSuccess) {
      console.log(`✅ ${endpoint.method} ${endpoint.path} (${result.status})`);
      passed++;
    } else {
      console.log(`❌ ${endpoint.method} ${endpoint.path} (${result.status})`);
      failures.push({
        endpoint: `${endpoint.method} ${endpoint.path}`,
        status: result.status,
        error: result.data?.error || result.data?.message || result.error
      });
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`\n📊 Results: ${passed}/${endpoints.length} passed (${Math.round(passed/endpoints.length*100)}%)`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failures.forEach(f => {
      console.log(`   ${f.endpoint}: ${f.status} - ${f.error}`);
    });
  }
  
  console.log('\n');
}

runTests();
