/**
 * Comprehensive Test Data Fixtures
 * All data needed for end-to-end enterprise testing
 */

import { generateTestId, generateTestEmail, generateTestCompany } from '../utils/test-config';

// ============================================================================
// USER & ROLE FIXTURES
// ============================================================================

export const ADMIN_USER = {
  email: 'admin@demo.com',
  password: 'admin123',
  role: 'super_admin',
};

export const TEST_USERS = {
  ceo: {
    firstName: 'Marcus',
    lastName: 'Chambers',
    email: generateTestEmail('ceo'),
    password: 'Test@2024!',
    role: 'executive',
    department: 'Executive',
  },
  cfo: {
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: generateTestEmail('cfo'),
    password: 'Test@2024!',
    role: 'executive',
    department: 'Finance',
  },
  hrManager: {
    firstName: 'Thabo',
    lastName: 'Molefe',
    email: generateTestEmail('hr-mgr'),
    password: 'Test@2024!',
    role: 'hr_manager',
    department: 'Human Resources',
  },
  accountant: {
    firstName: 'Priya',
    lastName: 'Naidoo',
    email: generateTestEmail('accountant'),
    password: 'Test@2024!',
    role: 'accountant',
    department: 'Finance',
  },
  salesRep: {
    firstName: 'John',
    lastName: 'Venter',
    email: generateTestEmail('sales'),
    password: 'Test@2024!',
    role: 'sales_rep',
    department: 'Sales',
  },
  warehouseManager: {
    firstName: 'Kagiso',
    lastName: 'Mabena',
    email: generateTestEmail('warehouse'),
    password: 'Test@2024!',
    role: 'warehouse_manager',
    department: 'Operations',
  },
  productionManager: {
    firstName: 'Andre',
    lastName: 'Pretorius',
    email: generateTestEmail('production'),
    password: 'Test@2024!',
    role: 'production_manager',
    department: 'Manufacturing',
  },
  miningEngineer: {
    firstName: 'Sipho',
    lastName: 'Dlamini',
    email: generateTestEmail('mining'),
    password: 'Test@2024!',
    role: 'mining_engineer',
    department: 'Mining Operations',
  },
  doctor: {
    firstName: 'Fatima',
    lastName: 'Patel',
    email: generateTestEmail('doctor'),
    password: 'Test@2024!',
    role: 'healthcare_provider',
    department: 'Healthcare',
  },
  farmManager: {
    firstName: 'Pieter',
    lastName: 'Botha',
    email: generateTestEmail('farm'),
    password: 'Test@2024!',
    role: 'farm_manager',
    department: 'Agriculture',
  },
};

// ============================================================================
// COMPANY & ENTITY FIXTURES
// ============================================================================

export const OMNICORP_HOLDING = {
  name: 'OmniCorp Holdings (Pty) Ltd',
  regNumber: '2020/123456/07',
  vatNumber: '4500123456',
  taxNumber: '9876543210',
  address: {
    street: '100 Main Street',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2000',
    country: 'South Africa',
  },
  contact: {
    phone: '+27 11 123 4567',
    email: 'info@omnicorp.co.za',
    website: 'www.omnicorp.co.za',
  },
  banking: {
    bank: 'First National Bank',
    accountName: 'OmniCorp Holdings',
    accountNumber: '62123456789',
    branchCode: '250655',
    swiftCode: 'FIRNZAJJ',
  },
};

export const SUBSIDIARIES = {
  mining: {
    name: 'OmniMine Resources (Pty) Ltd',
    regNumber: '2018/654321/07',
    industry: 'Mining',
    parentCompany: OMNICORP_HOLDING.name,
    locations: ['Limpopo Mine', 'Mpumalanga Mine'],
  },
  healthcare: {
    name: 'OmniHealth Medical Group',
    regNumber: '2019/111222/07',
    industry: 'Healthcare',
    parentCompany: OMNICORP_HOLDING.name,
    facilities: ['Johannesburg Hospital', 'Pretoria Clinic'],
  },
  agri: {
    name: 'OmniFarm Agricultural Services',
    regNumber: '2017/333444/07',
    industry: 'Agriculture',
    parentCompany: OMNICORP_HOLDING.name,
    farms: ['Freestate Farm', 'Western Cape Vineyard'],
  },
  property: {
    name: 'OmniProperty Holdings',
    regNumber: '2016/555666/07',
    industry: 'Property Management',
    parentCompany: OMNICORP_HOLDING.name,
    properties: ['Sandton City Complex', 'Cape Town Waterfront'],
  },
  manufacturing: {
    name: 'OmniManufacturing (Pty) Ltd',
    regNumber: '2015/777888/07',
    industry: 'Manufacturing',
    parentCompany: OMNICORP_HOLDING.name,
    plants: ['Durban Factory', 'PE Assembly Plant'],
  },
  logistics: {
    name: 'OmniLogistics & Transport',
    regNumber: '2014/999000/07',
    industry: 'Logistics',
    parentCompany: OMNICORP_HOLDING.name,
    depots: ['Johannesburg Hub', 'Durban Port Depot'],
  },
  professional: {
    name: 'OmniConsult Professional Services',
    regNumber: '2013/112233/07',
    industry: 'Professional Services',
    parentCompany: OMNICORP_HOLDING.name,
    offices: ['Sandton Office', 'Cape Town Office'],
  },
};

// ============================================================================
// FINANCIAL FIXTURES
// ============================================================================

export const CHART_OF_ACCOUNTS = {
  assets: [
    { code: '1000', name: 'Cash and Cash Equivalents', type: 'asset' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset' },
    { code: '1200', name: 'Inventory', type: 'asset' },
    { code: '1300', name: 'Prepaid Expenses', type: 'asset' },
    { code: '1500', name: 'Property, Plant & Equipment', type: 'asset' },
    { code: '1600', name: 'Accumulated Depreciation', type: 'contra-asset' },
  ],
  liabilities: [
    { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '2100', name: 'Accrued Expenses', type: 'liability' },
    { code: '2200', name: 'VAT Payable', type: 'liability' },
    { code: '2300', name: 'PAYE Payable', type: 'liability' },
    { code: '2500', name: 'Long-term Debt', type: 'liability' },
  ],
  equity: [
    { code: '3000', name: 'Share Capital', type: 'equity' },
    { code: '3100', name: 'Retained Earnings', type: 'equity' },
    { code: '3200', name: 'Current Year Earnings', type: 'equity' },
  ],
  revenue: [
    { code: '4000', name: 'Sales Revenue', type: 'revenue' },
    { code: '4100', name: 'Service Revenue', type: 'revenue' },
    { code: '4200', name: 'Interest Income', type: 'revenue' },
  ],
  expenses: [
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
    { code: '5100', name: 'Salaries & Wages', type: 'expense' },
    { code: '5200', name: 'Rent Expense', type: 'expense' },
    { code: '5300', name: 'Utilities', type: 'expense' },
    { code: '5400', name: 'Depreciation Expense', type: 'expense' },
    { code: '5500', name: 'Professional Fees', type: 'expense' },
  ],
};

export const TAX_RATES = {
  vat: 15,
  corporateTax: 27,
  capitalGains: 22.4,
  dividendsTax: 20,
  payeRates: [
    { min: 0, max: 237100, rate: 18 },
    { min: 237101, max: 370500, rate: 26 },
    { min: 370501, max: 512800, rate: 31 },
    { min: 512801, max: 673000, rate: 36 },
    { min: 673001, max: 857900, rate: 39 },
    { min: 857901, max: 1817000, rate: 41 },
    { min: 1817001, max: Infinity, rate: 45 },
  ],
  uif: 1, // % of salary
  sdl: 1, // Skills Development Levy
};

// ============================================================================
// INVENTORY & PRODUCTS
// ============================================================================

export const PRODUCTS = {
  rawMaterials: [
    { sku: 'RM-STEEL-001', name: 'Steel Sheet 1.2mm', unit: 'kg', cost: 45.00, category: 'Raw Materials' },
    { sku: 'RM-ALUM-001', name: 'Aluminum Ingot', unit: 'kg', cost: 120.00, category: 'Raw Materials' },
    { sku: 'RM-COPPER-001', name: 'Copper Wire 2mm', unit: 'm', cost: 35.00, category: 'Raw Materials' },
  ],
  finishedGoods: [
    { sku: 'FG-WIDGET-001', name: 'Industrial Widget A', unit: 'pcs', price: 450.00, cost: 280.00, category: 'Finished Goods' },
    { sku: 'FG-GADGET-001', name: 'Smart Gadget Pro', unit: 'pcs', price: 1200.00, cost: 680.00, category: 'Finished Goods' },
    { sku: 'FG-MACHINE-001', name: 'Assembly Machine X', unit: 'pcs', price: 25000.00, cost: 15000.00, category: 'Finished Goods' },
  ],
  services: [
    { sku: 'SVC-CONSULT-001', name: 'Consulting Hour', unit: 'hr', price: 1500.00, category: 'Services' },
    { sku: 'SVC-INSTALL-001', name: 'Installation Service', unit: 'job', price: 5000.00, category: 'Services' },
    { sku: 'SVC-MAINT-001', name: 'Maintenance Contract', unit: 'month', price: 8500.00, category: 'Services' },
  ],
  mining: [
    { sku: 'MIN-PLAT-001', name: 'Platinum Ore', unit: 'ton', cost: 45000.00, category: 'Mining' },
    { sku: 'MIN-GOLD-001', name: 'Gold Concentrate', unit: 'oz', cost: 1800.00, category: 'Mining' },
    { sku: 'MIN-COAL-001', name: 'Thermal Coal', unit: 'ton', cost: 1200.00, category: 'Mining' },
  ],
  healthcare: [
    { sku: 'MED-SURG-001', name: 'Surgical Kit', unit: 'kit', price: 2500.00, cost: 1200.00, category: 'Medical' },
    { sku: 'MED-PHARM-001', name: 'Antibiotic Pack', unit: 'pack', price: 350.00, cost: 180.00, category: 'Pharmaceutical' },
    { sku: 'MED-CONS-001', name: 'Consultation Fee', unit: 'visit', price: 850.00, category: 'Medical Services' },
  ],
  agriculture: [
    { sku: 'AGR-SEED-001', name: 'Maize Seed (25kg)', unit: 'bag', cost: 450.00, category: 'Seeds' },
    { sku: 'AGR-FERT-001', name: 'NPK Fertilizer', unit: 'ton', cost: 8500.00, category: 'Fertilizer' },
    { sku: 'AGR-CROP-001', name: 'Maize Harvest', unit: 'ton', price: 3200.00, category: 'Crops' },
  ],
};

// ============================================================================
// SUPPLIER & CUSTOMER FIXTURES
// ============================================================================

export const SUPPLIERS = [
  {
    name: 'Steel SA (Pty) Ltd',
    code: 'SUP-001',
    type: 'Raw Materials',
    vatNumber: '4501234567',
    contactPerson: 'Jan van der Merwe',
    email: 'jan@steelsa.co.za',
    phone: '+27 11 234 5678',
    paymentTerms: 30,
  },
  {
    name: 'ChemCorp Industries',
    code: 'SUP-002',
    type: 'Chemicals',
    vatNumber: '4502345678',
    contactPerson: 'Mary Johnson',
    email: 'mary@chemcorp.co.za',
    phone: '+27 21 345 6789',
    paymentTerms: 45,
  },
  {
    name: 'MedSupply Africa',
    code: 'SUP-003',
    type: 'Medical Supplies',
    vatNumber: '4503456789',
    contactPerson: 'Dr. Ahmed Hassan',
    email: 'ahmed@medsupply.co.za',
    phone: '+27 12 456 7890',
    paymentTerms: 30,
  },
];

export const CUSTOMERS = [
  {
    name: 'Retail Giants (Pty) Ltd',
    code: 'CUS-001',
    type: 'Retail',
    vatNumber: '4601234567',
    contactPerson: 'Sipho Mthembu',
    email: 'sipho@retailgiants.co.za',
    phone: '+27 11 111 2222',
    creditLimit: 500000,
    paymentTerms: 30,
  },
  {
    name: 'Industrial Solutions Inc',
    code: 'CUS-002',
    type: 'Industrial',
    vatNumber: '4602345678',
    contactPerson: 'Susan Clark',
    email: 'susan@industrialsolutions.com',
    phone: '+27 11 222 3333',
    creditLimit: 1000000,
    paymentTerms: 45,
  },
  {
    name: 'Government Health Department',
    code: 'CUS-003',
    type: 'Government',
    vatNumber: '4600000001',
    contactPerson: 'Thandi Zulu',
    email: 'thandi@health.gov.za',
    phone: '+27 12 333 4444',
    creditLimit: 5000000,
    paymentTerms: 60,
  },
];

// ============================================================================
// HR & PAYROLL FIXTURES
// ============================================================================

export const EMPLOYEE_TEMPLATE = {
  personalInfo: {
    idNumber: '9001015009087',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    maritalStatus: 'Single',
    nationality: 'South African',
    homeLanguage: 'English',
  },
  employment: {
    startDate: '2024-01-15',
    department: 'Operations',
    position: 'Junior Operator',
    employmentType: 'Permanent',
    workSchedule: 'Standard (Mon-Fri)',
  },
  compensation: {
    basicSalary: 25000,
    paymentMethod: 'Bank Transfer',
    taxNumber: '1234567890',
    bankName: 'Standard Bank',
    accountNumber: '123456789',
    branchCode: '051001',
  },
  benefits: {
    medicalAid: 'Discovery Health',
    medicalAidNumber: 'DH12345',
    providentFund: true,
    providentFundPercent: 7.5,
    leaveBalance: {
      annual: 15,
      sick: 30,
      family: 3,
    },
  },
};

export const PAYROLL_COMPONENTS = {
  earnings: [
    { code: 'BASIC', name: 'Basic Salary', type: 'earning', taxable: true },
    { code: 'OT', name: 'Overtime', type: 'earning', taxable: true, rate: 1.5 },
    { code: 'BONUS', name: 'Performance Bonus', type: 'earning', taxable: true },
    { code: 'ALLOW', name: 'Travel Allowance', type: 'earning', taxable: true },
    { code: 'COMM', name: 'Commission', type: 'earning', taxable: true },
  ],
  deductions: [
    { code: 'PAYE', name: 'PAYE Tax', type: 'deduction', statutory: true },
    { code: 'UIF', name: 'UIF', type: 'deduction', statutory: true, rate: 1 },
    { code: 'MEDICAL', name: 'Medical Aid', type: 'deduction', statutory: false },
    { code: 'PENSION', name: 'Pension Fund', type: 'deduction', statutory: false },
    { code: 'LOAN', name: 'Staff Loan', type: 'deduction', statutory: false },
  ],
};

// ============================================================================
// ASSET FIXTURES (IAS 16 Compliant)
// ============================================================================

export const ASSETS = {
  ppe: [
    {
      code: 'PPE-001',
      name: 'Manufacturing Plant - Durban',
      category: 'Land & Buildings',
      acquisitionDate: '2020-01-15',
      acquisitionCost: 15000000,
      usefulLife: 40, // years
      depreciationMethod: 'straight-line',
      residualValue: 2000000,
    },
    {
      code: 'PPE-002',
      name: 'CNC Machine A',
      category: 'Plant & Machinery',
      acquisitionDate: '2022-06-01',
      acquisitionCost: 2500000,
      usefulLife: 10,
      depreciationMethod: 'straight-line',
      residualValue: 250000,
    },
    {
      code: 'PPE-003',
      name: 'Delivery Vehicle Fleet',
      category: 'Motor Vehicles',
      acquisitionDate: '2023-01-01',
      acquisitionCost: 3500000,
      usefulLife: 5,
      depreciationMethod: 'reducing-balance',
      residualValue: 500000,
    },
  ],
  miningAssets: [
    {
      code: 'MIN-PPE-001',
      name: 'Underground Mining Equipment',
      category: 'Mining Equipment',
      acquisitionDate: '2021-03-15',
      acquisitionCost: 45000000,
      usefulLife: 15,
      depreciationMethod: 'units-of-production',
      totalUnits: 50000000, // tons
      residualValue: 5000000,
    },
  ],
};

// ============================================================================
// TRANSACTION TEMPLATES
// ============================================================================

export const TRANSACTION_TEMPLATES = {
  salesOrder: {
    orderNumber: () => `SO-${generateTestId()}`,
    status: 'draft',
    paymentTerms: 30,
    currency: 'ZAR',
    items: [
      { productSku: 'FG-WIDGET-001', quantity: 100, unitPrice: 450.00 },
      { productSku: 'SVC-INSTALL-001', quantity: 1, unitPrice: 5000.00 },
    ],
  },
  purchaseOrder: {
    orderNumber: () => `PO-${generateTestId()}`,
    status: 'draft',
    paymentTerms: 30,
    currency: 'ZAR',
    items: [
      { productSku: 'RM-STEEL-001', quantity: 1000, unitPrice: 45.00 },
      { productSku: 'RM-COPPER-001', quantity: 500, unitPrice: 35.00 },
    ],
  },
  invoice: {
    invoiceNumber: () => `INV-${generateTestId()}`,
    dueDate: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    },
    status: 'draft',
  },
  payment: {
    reference: () => `PAY-${generateTestId()}`,
    method: 'EFT',
    currency: 'ZAR',
  },
  journalEntry: {
    reference: () => `JV-${generateTestId()}`,
    description: 'General Journal Entry',
    status: 'draft',
  },
};

// ============================================================================
// INDUSTRY-SPECIFIC DATA
// ============================================================================

export const MINING_DATA = {
  shafts: [
    { name: 'Shaft 1 - Main', depth: 1500, status: 'active' },
    { name: 'Shaft 2 - Extension', depth: 2200, status: 'active' },
  ],
  safetyIncidents: [],
  productionTargets: {
    monthly: { platinum: 1000, gold: 500 }, // ounces
  },
  environmentalMetrics: {
    waterUsage: 15000, // kL/month
    carbonEmissions: 5000, // tons/month
  },
};

export const HEALTHCARE_DATA = {
  facilities: [
    { name: 'Main Hospital', beds: 200, departments: ['Emergency', 'Surgery', 'ICU', 'Pediatrics'] },
    { name: 'Day Clinic', beds: 20, departments: ['Outpatient', 'Radiology', 'Pathology'] },
  ],
  patientTemplate: {
    firstName: 'Patient',
    lastName: 'Test',
    idNumber: '9001015009087',
    medicalAidNumber: 'MA123456',
    bloodType: 'O+',
    allergies: [],
  },
};

export const AGRICULTURE_DATA = {
  farms: [
    { name: 'Freestate Farm', hectares: 5000, crops: ['Maize', 'Wheat', 'Sunflower'] },
    { name: 'Western Cape Vineyard', hectares: 500, crops: ['Grapes - Cabernet', 'Grapes - Shiraz'] },
  ],
  seasons: {
    planting: { start: '2024-09-01', end: '2024-11-30' },
    growing: { start: '2024-12-01', end: '2025-03-31' },
    harvest: { start: '2025-04-01', end: '2025-06-30' },
  },
};

export const PROPERTY_DATA = {
  properties: [
    {
      name: 'Sandton City Complex',
      type: 'Commercial',
      units: 50,
      monthlyRevenue: 2500000,
      occupancyRate: 95,
    },
    {
      name: 'Cape Town Waterfront',
      type: 'Mixed Use',
      units: 120,
      monthlyRevenue: 4500000,
      occupancyRate: 88,
    },
  ],
  leaseTemplate: {
    term: 36, // months
    escalation: 8, // % annual
    deposit: 2, // months rent
  },
};

// Export all
export default {
  ADMIN_USER,
  TEST_USERS,
  OMNICORP_HOLDING,
  SUBSIDIARIES,
  CHART_OF_ACCOUNTS,
  TAX_RATES,
  PRODUCTS,
  SUPPLIERS,
  CUSTOMERS,
  EMPLOYEE_TEMPLATE,
  PAYROLL_COMPONENTS,
  ASSETS,
  TRANSACTION_TEMPLATES,
  MINING_DATA,
  HEALTHCARE_DATA,
  AGRICULTURE_DATA,
  PROPERTY_DATA,
};
