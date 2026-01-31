/**
 * Payroll Period Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export type PayrollPeriodStatus = 'Draft' | 'Open' | 'Closed';

export interface PayrollPeriod {
  period_id: string;
  tenant_id: string;
  period_code: string;
  period_name?: string;
  period_start_date: Date;
  period_end_date: Date;
  payment_date: Date;
  frequency?: string;
  status: PayrollPeriodStatus;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export class PayrollPeriodRepository extends BaseRepository<PayrollPeriod> {
  protected tableName = 'payroll_periods';
  protected schema = 'hr';
  protected primaryKey = 'period_id';
  protected softDelete = false;

  async getByYear(ctx: TenantContext, year: number): Promise<PayrollPeriod[]> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND EXTRACT(YEAR FROM period_start_date) = $2
      ORDER BY period_start_date DESC
    `;
    return this.rawQuery(ctx, sql, [ctx.tenantId, year]);
  }
}

export const payrollPeriodRepository = new PayrollPeriodRepository();
export default payrollPeriodRepository;
