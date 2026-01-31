/**
 * Financial Dimensions Seed Data
 * Populates master data tables with sample South African business dimensions
 */

import { query } from './database';

async function seedDimensions() {
  console.log('🌱 Seeding financial dimensions...');

  try {
    // Check if data already exists
    const existingCostCenters = await query('SELECT COUNT(*) as count FROM cost_centers');
    if (parseInt(existingCostCenters.rows[0].count) > 0) {
      console.log('⚠️  Dimensions already seeded. Skipping...');
      return;
    }

    // 1. Seed Cost Centers
    console.log('📊 Seeding cost centers...');
    const costCenters = [
      { code: 'CC-HEAD', name: 'Head Office', description: 'Corporate headquarters', level: 1, budget_amount: 5000000, manager_name: 'CEO Office' },
      { code: 'CC-FIN', name: 'Finance Department', description: 'Financial operations and accounting', level: 2, budget_amount: 1500000, manager_name: 'CFO' },
      { code: 'CC-IT', name: 'IT Department', description: 'Information technology and systems', level: 2, budget_amount: 2000000, manager_name: 'CTO' },
      { code: 'CC-HR', name: 'Human Resources', description: 'HR and talent management', level: 2, budget_amount: 800000, manager_name: 'HR Director' },
      { code: 'CC-SALES', name: 'Sales Department', description: 'Sales and business development', level: 2, budget_amount: 3000000, manager_name: 'Sales Director' },
      { code: 'CC-MFG', name: 'Manufacturing', description: 'Production and manufacturing', level: 2, budget_amount: 10000000, manager_name: 'Operations Manager' },
      { code: 'CC-R&D', name: 'Research & Development', description: 'Product innovation and research', level: 2, budget_amount: 2500000, manager_name: 'R&D Director' },
    ];

    for (const cc of costCenters) {
      await query(
        `INSERT INTO cost_centers (code, name, description, level, budget_amount, manager_name, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, true, 'system')
         ON CONFLICT (code) DO NOTHING`,
        [cc.code, cc.name, cc.description, cc.level, cc.budget_amount, cc.manager_name]
      );
    }
    console.log(`✅ Seeded ${costCenters.length} cost centers`);

    // 2. Seed Departments
    console.log('🏢 Seeding departments...');
    const departments = [
      { code: 'DEPT-FIN-ACC', name: 'Accounting', description: 'General ledger and financial accounting', level: 1, head_name: 'Chief Accountant', employee_count: 15 },
      { code: 'DEPT-FIN-AP', name: 'Accounts Payable', description: 'Supplier payments and AP', level: 2, head_name: 'AP Manager', employee_count: 8 },
      { code: 'DEPT-FIN-AR', name: 'Accounts Receivable', description: 'Customer collections and AR', level: 2, head_name: 'AR Manager', employee_count: 10 },
      { code: 'DEPT-IT-DEV', name: 'Software Development', description: 'Application development team', level: 1, head_name: 'Dev Manager', employee_count: 25 },
      { code: 'DEPT-IT-OPS', name: 'IT Operations', description: 'Infrastructure and support', level: 1, head_name: 'Ops Manager', employee_count: 12 },
      { code: 'DEPT-HR-REC', name: 'Recruitment', description: 'Talent acquisition', level: 1, head_name: 'Recruitment Lead', employee_count: 5 },
      { code: 'DEPT-HR-PAY', name: 'Payroll', description: 'Payroll processing', level: 1, head_name: 'Payroll Manager', employee_count: 6 },
      { code: 'DEPT-SALES-B2B', name: 'B2B Sales', description: 'Enterprise sales team', level: 1, head_name: 'B2B Manager', employee_count: 20 },
      { code: 'DEPT-SALES-B2C', name: 'B2C Sales', description: 'Retail and consumer sales', level: 1, head_name: 'B2C Manager', employee_count: 30 },
      { code: 'DEPT-MFG-PROD', name: 'Production', description: 'Manufacturing line', level: 1, head_name: 'Production Manager', employee_count: 100 },
      { code: 'DEPT-MFG-QC', name: 'Quality Control', description: 'Quality assurance', level: 1, head_name: 'QC Manager', employee_count: 15 },
    ];

    for (const dept of departments) {
      await query(
        `INSERT INTO departments (code, name, description, level, department_head_name, employee_count, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, true, 'system')
         ON CONFLICT (code) DO NOTHING`,
        [dept.code, dept.name, dept.description, dept.level, dept.head_name, dept.employee_count]
      );
    }
    console.log(`✅ Seeded ${departments.length} departments`);

    // 3. Seed Projects
    console.log('📋 Seeding projects...');
    const projects = [
      { code: 'PROJ-ERP-2025', name: 'ERP System Implementation', description: 'Company-wide ERP rollout', type: 'INTERNAL', status: 'ACTIVE', budget: 15000000, priority: 'CRITICAL', start_date: '2025-01-01', end_date: '2025-12-31' },
      { code: 'PROJ-WEB-REDESIGN', name: 'Website Redesign', description: 'Corporate website refresh', type: 'INTERNAL', status: 'ACTIVE', budget: 500000, priority: 'HIGH', start_date: '2025-02-01', end_date: '2025-06-30' },
      { code: 'PROJ-CRM-UPGRADE', name: 'CRM Upgrade', description: 'Salesforce upgrade project', type: 'INTERNAL', status: 'PLANNED', budget: 2000000, priority: 'MEDIUM', start_date: '2025-07-01', end_date: '2025-10-31' },
      { code: 'PROJ-CUST-ACME', name: 'ACME Corp Integration', description: 'Custom integration for ACME', type: 'CUSTOMER', status: 'ACTIVE', budget: 3500000, priority: 'HIGH', start_date: '2025-01-15', end_date: '2025-08-31', customer_name: 'ACME Corporation' },
      { code: 'PROJ-CUST-ZENITH', name: 'Zenith Mobile App', description: 'Mobile app development', type: 'CUSTOMER', status: 'ACTIVE', budget: 2800000, priority: 'HIGH', start_date: '2025-03-01', end_date: '2025-09-30', customer_name: 'Zenith Holdings' },
      { code: 'PROJ-R&D-AI', name: 'AI Research Initiative', description: 'Machine learning R&D', type: 'RESEARCH', status: 'ACTIVE', budget: 5000000, priority: 'MEDIUM', start_date: '2025-01-01', end_date: '2026-12-31' },
    ];

    for (const proj of projects) {
      await query(
        `INSERT INTO projects (code, name, description, project_type, status, planned_budget, priority, start_date, end_date, customer_name, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, 'system')
         ON CONFLICT (code) DO NOTHING`,
        [proj.code, proj.name, proj.description, proj.type, proj.status, proj.budget, proj.priority, proj.start_date, proj.end_date, proj.customer_name || null]
      );
    }
    console.log(`✅ Seeded ${projects.length} projects`);

    // 4. Seed Products
    console.log('📦 Seeding products...');
    const products = [
      { code: 'PROD-SW-001', name: 'AetherOS ERP - Enterprise', description: 'Full enterprise ERP license', category: 'SOFTWARE', line: 'ERP', is_service: false, price: 50000, cost: 10000 },
      { code: 'PROD-SW-002', name: 'AetherOS ERP - SME', description: 'Small business ERP license', category: 'SOFTWARE', line: 'ERP', is_service: false, price: 15000, cost: 3000 },
      { code: 'PROD-SVC-001', name: 'Implementation Services', description: 'ERP implementation consulting', category: 'SERVICES', line: 'CONSULTING', is_service: true, price: 2500, cost: 800 },
      { code: 'PROD-SVC-002', name: 'Training Services', description: 'User training and enablement', category: 'SERVICES', line: 'TRAINING', is_service: true, price: 1500, cost: 400 },
      { code: 'PROD-SVC-003', name: 'Support - Premium', description: '24/7 premium support', category: 'SERVICES', line: 'SUPPORT', is_service: true, price: 5000, cost: 1500 },
      { code: 'PROD-HW-001', name: 'Server - Dell PowerEdge', description: 'Enterprise server hardware', category: 'HARDWARE', line: 'SERVERS', is_service: false, price: 120000, cost: 80000 },
      { code: 'PROD-HW-002', name: 'Workstation - HP Z4', description: 'High-performance workstation', category: 'HARDWARE', line: 'WORKSTATIONS', is_service: false, price: 35000, cost: 22000 },
    ];

    for (const prod of products) {
      await query(
        `INSERT INTO products (code, name, description, product_category, product_line, is_service, standard_price, standard_cost, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'system')
         ON CONFLICT (code) DO NOTHING`,
        [prod.code, prod.name, prod.description, prod.category, prod.line, prod.is_service, prod.price, prod.cost]
      );
    }
    console.log(`✅ Seeded ${products.length} products`);

    // 5. Seed Locations
    console.log('📍 Seeding locations...');
    const locations = [
      { code: 'LOC-JHB-HQ', name: 'Johannesburg HQ', type: 'HEADQUARTERS', city: 'Johannesburg', province: 'Gauteng', postal: '2001', phone: '+27 11 123 4567' },
      { code: 'LOC-CPT-BR', name: 'Cape Town Branch', type: 'BRANCH', city: 'Cape Town', province: 'Western Cape', postal: '8001', phone: '+27 21 234 5678' },
      { code: 'LOC-DBN-BR', name: 'Durban Branch', type: 'BRANCH', city: 'Durban', province: 'KwaZulu-Natal', postal: '4001', phone: '+27 31 345 6789' },
      { code: 'LOC-PTA-BR', name: 'Pretoria Branch', type: 'BRANCH', city: 'Pretoria', province: 'Gauteng', postal: '0001', phone: '+27 12 456 7890' },
      { code: 'LOC-JHB-WH1', name: 'Johannesburg Warehouse 1', type: 'WAREHOUSE', city: 'Johannesburg', province: 'Gauteng', postal: '2094', phone: '+27 11 567 8901' },
      { code: 'LOC-CPT-WH1', name: 'Cape Town Warehouse', type: 'WAREHOUSE', city: 'Cape Town', province: 'Western Cape', postal: '7460', phone: '+27 21 678 9012' },
      { code: 'LOC-JHB-RT1', name: 'Sandton Retail Store', type: 'RETAIL', city: 'Sandton', province: 'Gauteng', postal: '2196', phone: '+27 11 789 0123' },
      { code: 'LOC-CPT-RT1', name: 'V&A Waterfront Store', type: 'RETAIL', city: 'Cape Town', province: 'Western Cape', postal: '8002', phone: '+27 21 890 1234' },
    ];

    for (const loc of locations) {
      await query(
        `INSERT INTO locations (code, name, location_type, city, state_province, postal_code, phone, country, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'South Africa', true, 'system')
         ON CONFLICT (code) DO NOTHING`,
        [loc.code, loc.name, loc.type, loc.city, loc.province, loc.postal, loc.phone]
      );
    }
    console.log(`✅ Seeded ${locations.length} locations`);

    // Summary
    console.log('\n✅ Financial Dimensions Seed Complete!');
    console.log('📊 Summary:');
    console.log(`   - Cost Centers: ${costCenters.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Locations: ${locations.length}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed
seedDimensions()
  .then(() => {
    console.log('\n🎉 Dimensions seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
