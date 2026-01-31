import axios from 'axios';

const BASE_URL = 'https://siyabusaerp.co.za';

async function triggerBroken() {
  // Login first
  const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'Sibusiso@sgbsgroup.co.za',
    password: 'Masaphokati2025!'
  });
  
  const token = loginRes.data.token;
  const tenantId = 'b36ec5a6-b637-4716-84eb-3c53eb1c7093';
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId
  };

  // The broken endpoints from our audit
  const brokenEndpoints = [
    '/api/dashboard/kpis',
    '/api/dashboard/revenue-trend',
    '/api/dashboard/expense-breakdown',
    '/api/dashboard/cash-position',
    '/api/purchase/vendor-invoices',
    '/api/suppliers',
    '/api/property/properties',
    '/api/property/leases',
    '/api/property/tenants',
    '/api/agriculture/farms',
    '/api/agriculture/crops',
    '/api/agriculture/livestock',
    '/api/construction/projects',
    '/api/communications/channels',
    '/api/compliance/requirements',
    '/api/compliance/policies',
    '/api/multi-entity/intercompany',
    '/api/financial/recurring-entries',
  ];

  console.log('Triggering broken endpoints to capture errors...\n');
  
  for (const endpoint of brokenEndpoints) {
    try {
      const res = await axios.get(`${BASE_URL}${endpoint}`, { headers });
      console.log(`✅ ${endpoint}: ${res.status}`);
    } catch (err: any) {
      console.log(`❌ ${endpoint}: ${err.response?.status} - ${err.response?.data?.error || err.response?.data?.message || 'Unknown'}`);
    }
  }
}

triggerBroken().catch(console.error);
