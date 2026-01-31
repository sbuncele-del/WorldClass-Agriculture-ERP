/**
 * Employee Repository
 * 
 * Handles all database operations for employees
 * with automatic tenant isolation.
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type EmploymentStatus = 'Active' | 'Probation' | 'Suspended' | 'Terminated' | 'Resigned' | 'On Leave';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'intern';

export interface Employee {
  employee_id: string;
  tenant_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone_mobile?: string;
  phone_home?: string;
  date_of_birth?: Date;
  gender?: string;
  id_number?: string;
  passport_number?: string;
  tax_number?: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_title?: string;
  manager_id?: string;
  manager_name?: string;
  hire_date: Date;
  termination_date?: Date;
  employment_status: EmploymentStatus;
  employment_type?: EmploymentType;
  basic_salary?: number;
  pay_frequency?: 'weekly' | 'bi_weekly' | 'monthly';
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export class EmployeeRepository extends BaseRepository<Employee> {
  protected tableName = 'employees';
  protected schema = 'hr';
  protected primaryKey = 'employee_id';
  protected softDelete = false; // hr.employees does not use deleted_at

  async getActiveEmployees(ctx: TenantContext): Promise<Employee[]> {
    const result = await this.findAll(ctx, { is_active: true, employment_status: 'Active' });
    return result.data;
  }

  async search(
    ctx: TenantContext,
    searchTerm: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Employee>> {
    const { page = 1, limit = 50 } = pagination || {};
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;

    const sql = `
      SELECT e.*, d.department_name, p.position_title,
             m.first_name || ' ' || m.last_name as manager_name
      FROM ${this.fullTableName} e
      LEFT JOIN hr.departments d ON d.department_id = e.department_id
      LEFT JOIN hr.positions p ON p.position_id = e.position_id
      LEFT JOIN ${this.fullTableName} m ON m.employee_id = e.manager_id
      WHERE e.tenant_id = $1
        AND (
          e.first_name ILIKE $2 
          OR e.last_name ILIKE $2 
          OR e.employee_number ILIKE $2
          OR e.email ILIKE $2
        )
      ORDER BY e.last_name, e.first_name
      LIMIT $3 OFFSET $4
    `;

    const countSql = `
      SELECT COUNT(*) FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND (
          first_name ILIKE $2 
          OR last_name ILIKE $2 
          OR employee_number ILIKE $2
          OR email ILIKE $2
        )
    `;

    const [data, countResult] = await Promise.all([
      this.rawQuery<Employee>(ctx, sql, [searchPattern, limit, offset]),
      this.rawQuery<{ count: string }>(ctx, countSql, [searchPattern])
    ]);

    const total = parseInt(countResult[0]?.count || '0', 10);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async getByDepartment(ctx: TenantContext, departmentId: string): Promise<Employee[]> {
    return this.findBy(ctx, 'department_id', departmentId);
  }

  async getDirectReports(ctx: TenantContext, managerId: string): Promise<Employee[]> {
    return this.findBy(ctx, 'manager_id', managerId);
  }

  async getHeadcountByDepartment(ctx: TenantContext): Promise<{ department_id: string; department_name: string; count: number }[]> {
    const sql = `
      SELECT 
        e.department_id,
        d.department_name,
        COUNT(*) as count
      FROM ${this.fullTableName} e
      LEFT JOIN hr.departments d ON d.department_id = e.department_id
      WHERE e.tenant_id = $1 
        AND e.is_active = true
        AND e.employment_status = 'Active'
      GROUP BY e.department_id, d.department_name
      ORDER BY count DESC
    `;

    return this.rawQuery(ctx, sql);
  }

  async terminateEmployee(
    ctx: TenantContext,
    employeeId: string,
    terminationDate: Date
  ): Promise<Employee | null> {
    return this.update(ctx, employeeId, {
      employment_status: 'Terminated',
      termination_date: terminationDate,
      is_active: false
    });
  }

  async isEmployeeNumberUnique(ctx: TenantContext, employeeNumber: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { employee_number: employeeNumber });
    if (!existing) return true;
    if (excludeId && (existing as any).employee_id === excludeId) return true;
    return false;
  }
}

export const employeeRepository = new EmployeeRepository();
export default employeeRepository;
