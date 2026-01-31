#!/usr/bin/env node
/**
 * API Health Check Tool
 * Tests all backend API endpoints for functionality
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.API_URL || 'https://d1gsy3508vpy61.cloudfront.net/api';
const BACKEND_URL = 'http://ec2-13-60-225-34.eu-north-1.compute.amazonaws.com:3000';

// Core API endpoints to test
const ENDPOINTS = [
  // Auth
  { method: 'GET', path: '/health', expected: 200, name: 'Health Check' },
  { method: 'POST', path: '/auth/login', expected: [200, 401], name: 'Login Endpoint', body: { email: 'test@test.com', password: 'test' } },
  
  // Tenant endpoints (require auth)
  { method: 'GET', path: '/tenants', expected: [200, 401], name: 'List Tenants' },
  
  // User endpoints
  { method: 'GET', path: '/users', expected: [200, 401], name: 'List Users' },
  
  // Inventory
  { method: 'GET', path: '/inventory', expected: [200, 401], name: 'Inventory List' },
  { method: 'GET', path: '/inventory/items', expected: [200, 401], name: 'Inventory Items' },
  
  // Sales
  { method: 'GET', path: '/sales/invoices', expected: [200, 401], name: 'Sales Invoices' },
  { method: 'GET', path: '/sales/quotes', expected: [200, 401], name: 'Sales Quotes' },
  { method: 'GET', path: '/customers', expected: [200, 401], name: 'Customers' },
  
  // Purchase
  { method: 'GET', path: '/purchase/orders', expected: [200, 401], name: 'Purchase Orders' },
  { method: 'GET', path: '/suppliers', expected: [200, 401], name: 'Suppliers' },
  
  // Financial
  { method: 'GET', path: '/finance/accounts', expected: [200, 401], name: 'Chart of Accounts' },
  { method: 'GET', path: '/finance/journal-entries', expected: [200, 401], name: 'Journal Entries' },
  { method: 'GET', path: '/finance/general-ledger', expected: [200, 401], name: 'General Ledger' },
  
  // HR
  { method: 'GET', path: '/hr/employees', expected: [200, 401], name: 'Employees' },
  { method: 'GET', path: '/hr/departments', expected: [200, 401], name: 'Departments' },
  { method: 'GET', path: '/hr/payroll', expected: [200, 401], name: 'Payroll' },
  
  // Assets
  { method: 'GET', path: '/assets', expected: [200, 401], name: 'Assets' },
  { method: 'GET', path: '/assets/categories', expected: [200, 401], name: 'Asset Categories' },
  
  // Projects
  { method: 'GET', path: '/projects', expected: [200, 401], name: 'Projects' },
  { method: 'GET', path: '/projects/tasks', expected: [200, 401], name: 'Tasks' },
  
  // Warehouse
  { method: 'GET', path: '/warehouse/locations', expected: [200, 401], name: 'Warehouse Locations' },
  
  // Manufacturing
  { method: 'GET', path: '/manufacturing/bom', expected: [200, 401], name: 'Bill of Materials' },
  { method: 'GET', path: '/manufacturing/work-orders', expected: [200, 401], name: 'Work Orders' },
  
  // Cash Management
  { method: 'GET', path: '/cash/bank-accounts', expected: [200, 401], name: 'Bank Accounts' },
  { method: 'GET', path: '/cash/transactions', expected: [200, 401], name: 'Cash Transactions' },
  
  // Compliance
  { method: 'GET', path: '/compliance/tax-returns', expected: [200, 401], name: 'Tax Returns' },
  
  // Proposals
  { method: 'GET', path: '/proposals', expected: [200, 401], name: 'Proposals' },
  
  // Communications
  { method: 'GET', path: '/communications/messages', expected: [200, 401], name: 'Messages' },
];

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BACKEND_URL,
  total: ENDPOINTS.length,
  passed: 0,
  failed: 0,
  errors: 0,
  details: []
};

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const expectedCodes = Array.isArray(endpoint.expected) ? endpoint.expected : [endpoint.expected];
        const passed = expectedCodes.includes(res.statusCode);
        
        resolve({
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          status: res.statusCode,
          duration: `${duration}ms`,
          passed,
          expected: endpoint.expected
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 'ERROR',
        error: err.message,
        passed: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 'TIMEOUT',
        passed: false
      });
    });

    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }
    
    req.end();
  });
}

async function runHealthCheck() {
  console.log('\n' + '='.repeat(70));
  console.log('🏥 SIYABUSA ERP API HEALTH CHECK');
  console.log('='.repeat(70));
  console.log(`🔗 Backend URL: ${BACKEND_URL}`);
  console.log(`📅 Timestamp: ${results.timestamp}`);
  console.log(`📊 Testing ${ENDPOINTS.length} endpoints...\n`);

  for (let i = 0; i < ENDPOINTS.length; i++) {
    const endpoint = ENDPOINTS[i];
    process.stdout.write(`Testing [${i + 1}/${ENDPOINTS.length}] ${endpoint.name}... `);
    
    const result = await makeRequest(endpoint);
    results.details.push(result);
    
    if (result.passed) {
      results.passed++;
      console.log(`✅ ${result.status} (${result.duration})`);
    } else if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
      results.errors++;
      console.log(`💥 ${result.status}: ${result.error || 'Request timed out'}`);
    } else {
      results.failed++;
      console.log(`❌ ${result.status} (expected ${result.expected})`);
    }
  }

  // Print Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(70));
  
  const passRate = Math.round((results.passed / results.total) * 100);
  const color = passRate >= 80 ? '\x1b[32m' : passRate >= 50 ? '\x1b[33m' : '\x1b[31m';
  
  console.log(`\n   ✅ Passed:  ${results.passed}/${results.total}`);
  console.log(`   ❌ Failed:  ${results.failed}/${results.total}`);
  console.log(`   💥 Errors:  ${results.errors}/${results.total}`);
  console.log(`\n   ${color}Pass Rate: ${passRate}%\x1b[0m\n`);

  // List failed endpoints
  const failed = results.details.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('❌ FAILED ENDPOINTS:');
    console.log('-'.repeat(50));
    failed.forEach(f => {
      console.log(`   ${f.method} ${f.path}`);
      console.log(`      Status: ${f.status}, Expected: ${f.expected}`);
      if (f.error) console.log(`      Error: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, 'api-health-report.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('📁 Full report saved to: ./api-health-report.json\n');
}

runHealthCheck().catch(console.error);
