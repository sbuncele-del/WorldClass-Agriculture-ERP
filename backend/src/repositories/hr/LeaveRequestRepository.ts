/**
 * Leave Request Repository
 */

import { BaseRepository, TenantContext, PaginatedResult, PaginationOptions } from '../BaseRepository';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type LeaveType =
  | 'annual'
  | 'sick'
  | 'family'
  | 'maternity'
  | 'paternity'
  | 'study'
  | 'unpaid';

export interface LeaveRequest {
  request_id: string;
  tenant_id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: LeaveType;
  start_date: Date;
  end_date: Date;
  days_requested: number;
  reason?: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
}

export class LeaveRequestRepository extends BaseRepository<LeaveRequest> {
  protected tableName = 'leave_requests';
  protected schema = 'hr';
  protected primaryKey = 'request_id';
  protected softDelete = false;

  async getPendingRequests(ctx: TenantContext): Promise<LeaveRequest[]> {
    const sql = `
      SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name
      FROM ${this.fullTableName} lr
      JOIN hr.employees e ON e.employee_id = lr.employee_id AND e.tenant_id = lr.tenant_id
      WHERE lr.tenant_id = $1 AND lr.status = 'Pending'
      ORDER BY lr.start_date
    `;
    return this.rawQuery(ctx, sql);
  }

  async getEmployeeLeave(ctx: TenantContext, employeeId: string, year?: number): Promise<LeaveRequest[]> {
    const targetYear = year || new Date().getFullYear();
    const sql = `
      SELECT * FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND employee_id = $2 
        AND EXTRACT(YEAR FROM start_date) = $3
      ORDER BY start_date DESC
    `;
    return this.rawQuery(ctx, sql, [ctx.tenantId, employeeId, targetYear]);
  }

  async approveLeave(ctx: TenantContext, requestId: string): Promise<LeaveRequest | null> {
    return this.update(ctx, requestId, {
      status: 'Approved',
      approved_by: ctx.userId,
      approved_at: new Date()
    } as any);
  }

  async rejectLeave(ctx: TenantContext, requestId: string, reason: string): Promise<LeaveRequest | null> {
    return this.update(ctx, requestId, {
      status: 'Rejected',
      rejection_reason: reason
    });
  }

  async getLeaveBalance(ctx: TenantContext, employeeId: string, leaveType: LeaveType, year?: number): Promise<{
    entitled: number;
    taken: number;
    pending: number;
    balance: number;
  }> {
    const targetYear = year || new Date().getFullYear();
    
    // Get entitlement (simplified - in real system would come from policy)
    const entitlement = leaveType === 'annual' ? 21 : leaveType === 'sick' ? 30 : 0;

    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'Approved' THEN days_requested ELSE 0 END), 0) as taken,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN days_requested ELSE 0 END), 0) as pending
      FROM ${this.fullTableName}
      WHERE tenant_id = $1 
        AND employee_id = $2 
        AND leave_type = $3
        AND EXTRACT(YEAR FROM start_date) = $4
    `;
    
    const result = await this.rawQuery(ctx, sql, [ctx.tenantId, employeeId, leaveType, targetYear]);
    const taken = parseFloat(result[0]?.taken || '0');
    const pending = parseFloat(result[0]?.pending || '0');

    return {
      entitled: entitlement,
      taken,
      pending,
      balance: entitlement - taken - pending
    };
  }
}

export const leaveRequestRepository = new LeaveRequestRepository();
export default leaveRequestRepository;
