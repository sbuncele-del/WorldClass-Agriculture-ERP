/**
 * Payroll Repository
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type PayrollStatus = 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';

export interface PayrollRun {
  id: string;
  tenant_id: string;
  name: string;
  pay_period_start: Date;
  pay_period_end: Date;
  payment_date: Date;
  status: PayrollStatus;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employee_count: number;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class PayrollRepository extends BaseRepository<PayrollRun> {
  protected tableName = 'payroll_runs';
  protected schema = 'hr';
  protected primaryKey = 'run_id';
  protected softDelete = false;

  async getPayrollByStatus(ctx: TenantContext, status: PayrollStatus): Promise<PayrollRun[]> {
    const result = await this.findAll(ctx, { status });
    return result.data;
  }

  async approvePayroll(ctx: TenantContext, payrollId: string): Promise<PayrollRun | null> {
    return this.update(ctx, payrollId, {
      status: 'approved',
      approved_by: ctx.userId,
      approved_at: new Date()
    } as any);
  }

  async getPayrollSummary(ctx: TenantContext, year: number): Promise<{
    month: number;
    total_gross: number;
    total_net: number;
    employee_count: number;
  }[]> {
    const sql = `
      SELECT 
        EXTRACT(MONTH FROM payment_date) as month,
        SUM(total_gross) as total_gross,
        SUM(total_net) as total_net,
        SUM(employee_count) as employee_count
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND deleted_at IS NULL
        AND status = 'paid'
        AND EXTRACT(YEAR FROM payment_date) = $2
      GROUP BY EXTRACT(MONTH FROM payment_date)
      ORDER BY month
    `;
    return this.rawQuery(ctx, sql, [year]);
  }
}

export const payrollRepository = new PayrollRepository();
export default payrollRepository;
