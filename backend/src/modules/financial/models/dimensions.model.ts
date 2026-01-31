/**
 * Financial Dimensions Models
 * Type definitions for multi-dimensional reporting
 */

// ===== COST CENTER =====
export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_cost_center_id?: string;
  level: number;
  is_active: boolean;
  budget_amount: number;
  manager_id?: string;
  manager_name?: string;
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateCostCenterDTO {
  code: string;
  name: string;
  description?: string;
  parent_cost_center_id?: string;
  level?: number;
  budget_amount?: number;
  manager_id?: string;
  manager_name?: string;
  start_date?: Date;
  end_date?: Date;
}

// ===== DEPARTMENT =====
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_department_id?: string;
  level: number;
  is_active: boolean;
  department_head_id?: string;
  department_head_name?: string;
  cost_center_id?: string;
  employee_count: number;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateDepartmentDTO {
  code: string;
  name: string;
  description?: string;
  parent_department_id?: string;
  level?: number;
  department_head_id?: string;
  department_head_name?: string;
  cost_center_id?: string;
  employee_count?: number;
}

// ===== PROJECT =====
export type ProjectType = 'INTERNAL' | 'CUSTOMER' | 'RESEARCH' | 'INFRASTRUCTURE' | 'OTHER';
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  status: ProjectStatus;
  is_active: boolean;
  customer_id?: string;
  customer_name?: string;
  project_manager_id?: string;
  project_manager_name?: string;
  start_date?: Date;
  end_date?: Date;
  planned_budget: number;
  actual_cost: number;
  revenue: number;
  profit_margin?: number;
  priority: ProjectPriority;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProjectDTO {
  code: string;
  name: string;
  description?: string;
  project_type?: ProjectType;
  status?: ProjectStatus;
  customer_id?: string;
  customer_name?: string;
  project_manager_id?: string;
  project_manager_name?: string;
  start_date?: Date;
  end_date?: Date;
  planned_budget?: number;
  priority?: ProjectPriority;
}

// ===== PRODUCT =====
export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  product_category?: string;
  product_line?: string;
  is_active: boolean;
  is_service: boolean;
  unit_of_measure?: string;
  standard_cost: number;
  standard_price: number;
  profit_margin?: number;
  supplier_id?: string;
  supplier_name?: string;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProductDTO {
  code: string;
  name: string;
  description?: string;
  product_category?: string;
  product_line?: string;
  is_service?: boolean;
  unit_of_measure?: string;
  standard_cost?: number;
  standard_price?: number;
  supplier_id?: string;
  supplier_name?: string;
}

// ===== LOCATION =====
export type LocationType = 'HEADQUARTERS' | 'BRANCH' | 'WAREHOUSE' | 'RETAIL' | 'FACTORY' | 'OTHER';

export interface Location {
  id: string;
  code: string;
  name: string;
  description?: string;
  location_type?: LocationType;
  is_active: boolean;
  parent_location_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  manager_name?: string;
  opening_date?: Date;
  closing_date?: Date;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface CreateLocationDTO {
  code: string;
  name: string;
  description?: string;
  location_type?: LocationType;
  parent_location_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  manager_name?: string;
  opening_date?: Date;
}

// ===== DIMENSION FILTERS =====
export interface DimensionFilters {
  cost_center?: string;
  department?: string;
  project?: string;
  product?: string;
  location?: string;
}

// ===== DIMENSION SUMMARY =====
export interface DimensionSummary {
  cost_centers: number;
  departments: number;
  projects: number;
  products: number;
  locations: number;
}
