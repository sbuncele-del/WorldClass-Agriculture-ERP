/**
 * Department Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export interface Department {
  department_id: string;
  tenant_id: string;
  department_code: string;
  department_name: string;
  description?: string;
  parent_department_id?: string;
  manager_id?: string;
  cost_center_code?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export class DepartmentRepository extends BaseRepository<Department> {
  protected tableName = 'departments';
  protected schema = 'hr';
  protected primaryKey = 'department_id';
  protected softDelete = false; // hr.departments does not use deleted_at

  async getActiveDepartments(ctx: TenantContext): Promise<Department[]> {
    const result = await this.findAll(ctx, { is_active: true });
    return result.data;
  }

  async getDepartmentTree(ctx: TenantContext): Promise<Department[]> {
    const sql = `
      WITH RECURSIVE dept_tree AS (
        SELECT *, 0 as level
        FROM ${this.fullTableName}
        WHERE tenant_id = $1 AND parent_department_id IS NULL
        UNION ALL
        SELECT d.*, dt.level + 1
        FROM ${this.fullTableName} d
        INNER JOIN dept_tree dt ON d.parent_department_id = dt.department_id
        WHERE d.tenant_id = $1
      )
      SELECT * FROM dept_tree ORDER BY level, department_name
    `;
    return this.rawQuery(ctx, sql);
  }
}

export const departmentRepository = new DepartmentRepository();
export default departmentRepository;
