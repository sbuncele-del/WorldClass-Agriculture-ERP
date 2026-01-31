/**
 * Global Test Configuration
 * Central configuration for all E2E tests
 */

export const TEST_CONFIG = {
  // Base URLs
  baseUrl: process.env.TEST_URL || 'https://d1gsy3508vpy61.cloudfront.net',
  apiUrl: process.env.API_URL || 'http://51.20.67.228:3000',
  
  // Timeouts
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    extended: 60000,
    stress: 120000,
  },
  
  // Test Data Prefixes (for cleanup)
  prefixes: {
    company: 'TEST_CO_',
    user: 'test_user_',
    product: 'TEST_PROD_',
    customer: 'TEST_CUST_',
    supplier: 'TEST_SUPP_',
    project: 'TEST_PROJ_',
  },
  
  // Demo Credentials (always work without DB)
  demoCredentials: {
    admin: { email: 'admin@demo.com', password: 'admin123' },
    user: { email: 'user@demo.com', password: 'user123' },
  },
  
  // OmniCorp Conglomerate Structure
  omniCorp: {
    holding: {
      name: 'OmniCorp Holdings',
      slug: 'omnicorp-holdings',
    },
    subsidiaries: [
      { name: 'OmniLogistics', slug: 'omni-logistics', module: 'logistics', industry: 'logistics' },
      { name: 'OmniHealth Clinic', slug: 'omni-health', module: 'healthcare', industry: 'healthcare' },
      { name: 'OmniMine Ltd', slug: 'omni-mine', module: 'mining', industry: 'mining' },
      { name: 'GreenHarvest Ag', slug: 'green-harvest', module: 'agriculture', industry: 'agriculture' },
      { name: 'PrimeProperties REIT', slug: 'prime-properties', module: 'property', industry: 'property' },
      { name: 'OmniConsult Pros', slug: 'omni-consult', module: 'practice', industry: 'professional-services' },
      { name: 'PrecisionManufacturing', slug: 'precision-mfg', module: 'manufacturing', industry: 'manufacturing' },
    ],
  },
  
  // Department Templates
  departments: [
    'Finance', 'Human Resources', 'Operations', 'Sales', 'Marketing',
    'Procurement', 'IT', 'Legal', 'Compliance', 'Quality Assurance',
    'Research & Development', 'Customer Service', 'Logistics', 'Executive',
  ],
  
  // Role Templates with Permissions
  roles: [
    { name: 'CEO', level: 'executive', permissions: ['all'] },
    { name: 'CFO', level: 'executive', permissions: ['financial', 'reporting', 'approve_all'] },
    { name: 'COO', level: 'executive', permissions: ['operations', 'approve_operational'] },
    { name: 'Department Head', level: 'management', permissions: ['view_all', 'edit_dept', 'approve_dept'] },
    { name: 'Senior Manager', level: 'management', permissions: ['view_all', 'edit_dept', 'approve_5000'] },
    { name: 'Manager', level: 'management', permissions: ['view_dept', 'edit_dept', 'approve_1000'] },
    { name: 'Team Lead', level: 'supervisor', permissions: ['view_team', 'edit_team', 'approve_500'] },
    { name: 'Senior Analyst', level: 'staff', permissions: ['view_all', 'edit_own', 'create'] },
    { name: 'Analyst', level: 'staff', permissions: ['view_dept', 'edit_own', 'create'] },
    { name: 'Junior Staff', level: 'entry', permissions: ['view_own', 'edit_own'] },
    { name: 'Intern', level: 'entry', permissions: ['view_limited'] },
    { name: 'External Auditor', level: 'external', permissions: ['view_financial', 'export'] },
  ],
  
  // Currency Configuration
  currencies: [
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
  ],
  
  // Tax Regimes
  taxRegimes: [
    { code: 'ZA_VAT', name: 'South Africa VAT', rate: 15 },
    { code: 'ZA_MINING_ROYALTY', name: 'Mining Royalty', rate: 'progressive' },
    { code: 'US_SALES', name: 'US Sales Tax', rate: 'state-based' },
    { code: 'UK_VAT', name: 'UK VAT', rate: 20 },
  ],
};

// Generate unique IDs for test data
export function generateTestId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate test email
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}+${Date.now()}@omnicorp-test.co.za`;
}

// Generate test company name
export function generateTestCompany(base: string = 'TestCo'): string {
  return `${TEST_CONFIG.prefixes.company}${base}_${Date.now()}`;
}

export default TEST_CONFIG;
