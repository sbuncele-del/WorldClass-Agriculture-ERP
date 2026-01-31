/**
 * Attendance Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export interface AttendanceRecord {
  attendance_id: string;
  tenant_id: string;
  employee_id: string;
  attendance_date: Date;
  clock_in_time?: string;
  clock_out_time?: string;
  hours_worked?: number;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  protected tableName = 'attendance_records';
  protected schema = 'hr';
  protected primaryKey = 'attendance_id';
  protected softDelete = false;

  async getForDate(ctx: TenantContext, employeeId: string, date: Date): Promise<AttendanceRecord | null> {
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 AND employee_id = $2 AND attendance_date = $3
      LIMIT 1
    `;
    const rows = await this.rawQuery<AttendanceRecord>(ctx, sql, [ctx.tenantId, employeeId, date]);
    return rows[0] || null;
  }
}

export const attendanceRepository = new AttendanceRepository();
export default attendanceRepository;
