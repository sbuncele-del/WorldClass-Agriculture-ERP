/**
 * Financial Dimensions Migration
 * Creates master data tables for multi-dimensional reporting
 * 
 * Dimensions supported:
 * - Cost Centers (departments, branches)
 * - Departments (organizational units)
 * - Projects (customer projects, internal initiatives)
 * - Products (product lines, services)
 * - Locations (geographic locations, warehouses)
 */

import { query } from './database';

async function createDimensionTables() {
  console.log('🚀 Creating financial dimension tables...');

  try {
    // 1. Cost Centers Table
    await query(`
      CREATE TABLE IF NOT EXISTS cost_centers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_cost_center_id UUID REFERENCES cost_centers(id),
        level INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        budget_amount DECIMAL(18, 2) DEFAULT 0,
        manager_id VARCHAR(50),
        manager_name VARCHAR(255),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50)
      );
    `);
    console.log('✅ Cost centers table created');

    // 2. Departments Table
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_department_id UUID REFERENCES departments(id),
        level INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        department_head_id VARCHAR(50),
        department_head_name VARCHAR(255),
        cost_center_id UUID REFERENCES cost_centers(id),
        employee_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50)
      );
    `);
    console.log('✅ Departments table created');

    // 3. Projects Table
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        project_type VARCHAR(50), -- INTERNAL, CUSTOMER, RESEARCH, etc.
        status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
        is_active BOOLEAN DEFAULT true,
        customer_id VARCHAR(50),
        customer_name VARCHAR(255),
        project_manager_id VARCHAR(50),
        project_manager_name VARCHAR(255),
        start_date DATE,
        end_date DATE,
        planned_budget DECIMAL(18, 2) DEFAULT 0,
        actual_cost DECIMAL(18, 2) DEFAULT 0,
        revenue DECIMAL(18, 2) DEFAULT 0,
        profit_margin DECIMAL(5, 2), -- Percentage
        priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50)
      );
    `);
    console.log('✅ Projects table created');

    // 4. Products Table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        product_category VARCHAR(100),
        product_line VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        is_service BOOLEAN DEFAULT false,
        unit_of_measure VARCHAR(20),
        standard_cost DECIMAL(18, 2) DEFAULT 0,
        standard_price DECIMAL(18, 2) DEFAULT 0,
        profit_margin DECIMAL(5, 2),
        supplier_id VARCHAR(50),
        supplier_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50)
      );
    `);
    console.log('✅ Products table created');

    // 5. Locations Table
    await query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        location_type VARCHAR(50), -- HEADQUARTERS, BRANCH, WAREHOUSE, RETAIL, etc.
        is_active BOOLEAN DEFAULT true,
        parent_location_id UUID REFERENCES locations(id),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100),
        state_province VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(50) DEFAULT 'South Africa',
        phone VARCHAR(50),
        email VARCHAR(255),
        manager_id VARCHAR(50),
        manager_name VARCHAR(255),
        opening_date DATE,
        closing_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50),
        updated_by VARCHAR(50)
      );
    `);
    console.log('✅ Locations table created');

    // Create indexes for performance
    console.log('🔧 Creating indexes...');

    await query('CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON cost_centers(code);');
    await query('CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON cost_centers(parent_cost_center_id);');
    await query('CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON cost_centers(is_active);');

    await query('CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);');
    await query('CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);');
    await query('CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);');
    await query('CREATE INDEX IF NOT EXISTS idx_departments_cost_center ON departments(cost_center_id);');

    await query('CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);');
    await query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);');
    await query('CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active);');
    await query('CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);');

    await query('CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);');
    await query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(product_category);');
    await query('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);');

    await query('CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(code);');
    await query('CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);');
    await query('CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);');
    await query('CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);');

    console.log('✅ All indexes created');

    // Verify tables
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('cost_centers', 'departments', 'projects', 'products', 'locations')
      ORDER BY table_name;
    `);

    console.log('\n✅ Financial Dimensions Migration Complete!');
    console.log(`📊 Tables created: ${tableCheck.rows.length}`);
    tableCheck.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
createDimensionTables()
  .then(() => {
    console.log('\n🎉 Dimensions migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
