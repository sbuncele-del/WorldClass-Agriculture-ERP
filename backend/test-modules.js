// Test script for modules controller
const { getAvailableModules } = require('./dist/controllers/modules.controller');

// Mock request object
const mockReq = {
  tenant: {
    id: 'test-tenant-id',
    slug: 'test-company',
    name: 'Test Company',
    status: 'active',
    industry_type: "healthcare"
  },
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'admin'
  },
  query: {}
};

// Mock response object
const mockRes = {
  json: function(data) {
    console.log('=== MODULES API RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  },
  status: function(code) {
    console.log('Status:', code);
    return this;
  }
};

// Test the controller
getAvailableModules(mockReq, mockRes);
