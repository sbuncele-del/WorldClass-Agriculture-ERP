/**
 * Dimensions Service
 * Business logic for managing financial dimensions
 */

import { query } from '../../../config/database';
import {
  CostCenter,
  Department,
  Project,
  Product,
  Location,
  CreateCostCenterDTO,
  CreateDepartmentDTO,
  CreateProjectDTO,
  CreateProductDTO,
  CreateLocationDTO,
  DimensionSummary,
} from '../models/dimensions.model';

export class DimensionsService {
  // ===== COST CENTERS =====

  async getAllCostCenters(includeInactive = false): Promise<CostCenter[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const result = await query(
      `SELECT * FROM cost_centers ${whereClause} ORDER BY code`
    );
    return result.rows;
  }

  async getCostCenterByCode(code: string): Promise<CostCenter | null> {
    const result = await query(
      'SELECT * FROM cost_centers WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async createCostCenter(data: CreateCostCenterDTO, userId: string): Promise<string> {
    const result = await query(
      `INSERT INTO cost_centers (
        code, name, description, parent_cost_center_id, level,
        budget_amount, manager_id, manager_name, start_date, end_date,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id`,
      [
        data.code,
        data.name,
        data.description,
        data.parent_cost_center_id,
        data.level || 1,
        data.budget_amount || 0,
        data.manager_id,
        data.manager_name,
        data.start_date,
        data.end_date,
        userId,
      ]
    );
    return result.rows[0].id;
  }

  async updateCostCenter(code: string, data: Partial<CreateCostCenterDTO>, userId: string): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.budget_amount !== undefined) {
      updates.push(`budget_amount = $${paramCount++}`);
      values.push(data.budget_amount);
    }
    if (data.manager_name !== undefined) {
      updates.push(`manager_name = $${paramCount++}`);
      values.push(data.manager_name);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(code);

    await query(
      `UPDATE cost_centers SET ${updates.join(', ')} WHERE code = $${paramCount}`,
      values
    );
  }

  async deleteCostCenter(code: string): Promise<void> {
    await query('UPDATE cost_centers SET is_active = false WHERE code = $1', [code]);
  }

  // ===== DEPARTMENTS =====

  async getAllDepartments(includeInactive = false): Promise<Department[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const result = await query(
      `SELECT * FROM departments ${whereClause} ORDER BY code`
    );
    return result.rows;
  }

  async getDepartmentByCode(code: string): Promise<Department | null> {
    const result = await query(
      'SELECT * FROM departments WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async createDepartment(data: CreateDepartmentDTO, userId: string): Promise<string> {
    const result = await query(
      `INSERT INTO departments (
        code, name, description, parent_department_id, level,
        department_head_id, department_head_name, cost_center_id,
        employee_count, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        data.code,
        data.name,
        data.description,
        data.parent_department_id,
        data.level || 1,
        data.department_head_id,
        data.department_head_name,
        data.cost_center_id,
        data.employee_count || 0,
        userId,
      ]
    );
    return result.rows[0].id;
  }

  async updateDepartment(code: string, data: Partial<CreateDepartmentDTO>, userId: string): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.employee_count !== undefined) {
      updates.push(`employee_count = $${paramCount++}`);
      values.push(data.employee_count);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(code);

    await query(
      `UPDATE departments SET ${updates.join(', ')} WHERE code = $${paramCount}`,
      values
    );
  }

  async deleteDepartment(code: string): Promise<void> {
    await query('UPDATE departments SET is_active = false WHERE code = $1', [code]);
  }

  // ===== PROJECTS =====

  async getAllProjects(includeInactive = false): Promise<Project[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const result = await query(
      `SELECT id, project_code as code, project_name as name, description, status, is_active, created_at, updated_at 
       FROM projects ${whereClause} ORDER BY project_code`
    );
    return result.rows;
  }

  async getProjectByCode(code: string): Promise<Project | null> {
    const result = await query(
      'SELECT id, project_code as code, project_name as name, description, status, is_active FROM projects WHERE project_code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async createProject(data: CreateProjectDTO, userId: string): Promise<string> {
    const result = await query(
      `INSERT INTO projects (
        code, name, description, project_type, status,
        customer_id, customer_name, project_manager_id, project_manager_name,
        start_date, end_date, planned_budget, priority, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        data.code,
        data.name,
        data.description,
        data.project_type,
        data.status || 'PLANNED',
        data.customer_id,
        data.customer_name,
        data.project_manager_id,
        data.project_manager_name,
        data.start_date,
        data.end_date,
        data.planned_budget || 0,
        data.priority || 'MEDIUM',
        userId,
      ]
    );
    return result.rows[0].id;
  }

  async updateProject(code: string, data: Partial<CreateProjectDTO>, userId: string): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.planned_budget !== undefined) {
      updates.push(`planned_budget = $${paramCount++}`);
      values.push(data.planned_budget);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(code);

    await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE code = $${paramCount}`,
      values
    );
  }

  async deleteProject(code: string): Promise<void> {
    await query('UPDATE projects SET is_active = false WHERE code = $1', [code]);
  }

  // ===== PRODUCTS =====

  async getAllProducts(includeInactive = false): Promise<Product[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const result = await query(
      `SELECT * FROM products ${whereClause} ORDER BY code`
    );
    return result.rows;
  }

  async getProductByCode(code: string): Promise<Product | null> {
    const result = await query(
      'SELECT * FROM products WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async createProduct(data: CreateProductDTO, userId: string): Promise<string> {
    const result = await query(
      `INSERT INTO products (
        code, name, description, product_category, product_line,
        is_service, unit_of_measure, standard_cost, standard_price,
        supplier_id, supplier_name, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        data.code,
        data.name,
        data.description,
        data.product_category,
        data.product_line,
        data.is_service || false,
        data.unit_of_measure,
        data.standard_cost || 0,
        data.standard_price || 0,
        data.supplier_id,
        data.supplier_name,
        userId,
      ]
    );
    return result.rows[0].id;
  }

  async updateProduct(code: string, data: Partial<CreateProductDTO>, userId: string): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.standard_price !== undefined) {
      updates.push(`standard_price = $${paramCount++}`);
      values.push(data.standard_price);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(code);

    await query(
      `UPDATE products SET ${updates.join(', ')} WHERE code = $${paramCount}`,
      values
    );
  }

  async deleteProduct(code: string): Promise<void> {
    await query('UPDATE products SET is_active = false WHERE code = $1', [code]);
  }

  // ===== LOCATIONS =====

  async getAllLocations(includeInactive = false): Promise<Location[]> {
    const whereClause = includeInactive ? '' : 'WHERE is_active = true';
    const result = await query(
      `SELECT * FROM locations ${whereClause} ORDER BY code`
    );
    return result.rows;
  }

  async getLocationByCode(code: string): Promise<Location | null> {
    const result = await query(
      'SELECT * FROM locations WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async createLocation(data: CreateLocationDTO, userId: string): Promise<string> {
    const result = await query(
      `INSERT INTO locations (
        code, name, description, location_type, parent_location_id,
        address_line1, address_line2, city, state_province, postal_code,
        country, phone, email, manager_id, manager_name, opening_date,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        data.code,
        data.name,
        data.description,
        data.location_type,
        data.parent_location_id,
        data.address_line1,
        data.address_line2,
        data.city,
        data.state_province,
        data.postal_code,
        data.country || 'South Africa',
        data.phone,
        data.email,
        data.manager_id,
        data.manager_name,
        data.opening_date,
        userId,
      ]
    );
    return result.rows[0].id;
  }

  async updateLocation(code: string, data: Partial<CreateLocationDTO>, userId: string): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updates.push(`updated_by = $${paramCount++}`);
    values.push(userId);
    values.push(code);

    await query(
      `UPDATE locations SET ${updates.join(', ')} WHERE code = $${paramCount}`,
      values
    );
  }

  async deleteLocation(code: string): Promise<void> {
    await query('UPDATE locations SET is_active = false WHERE code = $1', [code]);
  }

  // ===== SUMMARY =====

  async getDimensionSummary(): Promise<DimensionSummary> {
    const costCentersResult = await query('SELECT COUNT(*) as count FROM cost_centers WHERE is_active = true');
    const departmentsResult = await query('SELECT COUNT(*) as count FROM departments WHERE is_active = true');
    const projectsResult = await query('SELECT COUNT(*) as count FROM projects WHERE is_active = true');
    const productsResult = await query('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    const locationsResult = await query('SELECT COUNT(*) as count FROM locations WHERE is_active = true');

    return {
      cost_centers: parseInt(costCentersResult.rows[0].count),
      departments: parseInt(departmentsResult.rows[0].count),
      projects: parseInt(projectsResult.rows[0].count),
      products: parseInt(productsResult.rows[0].count),
      locations: parseInt(locationsResult.rows[0].count),
    };
  }
}
