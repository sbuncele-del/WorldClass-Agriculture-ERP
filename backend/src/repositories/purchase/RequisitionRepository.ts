/**
 * Requisition Repository
 *
 * Handles purchase requisitions with tenant isolation.
 */

import { BaseRepository, TenantContext, PaginationOptions, PaginatedResult } from '../BaseRepository';

export type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';

export interface RequisitionLine {
  id: string;
  requisition_id: string;
  item_code?: string;
  description: string;
  quantity: number;
  unit_of_measure?: string;
  estimated_unit_price?: number;
  estimated_total?: number;
  required_by_date?: Date;
  notes?: string;
}

export interface Requisition {
  id: string;
  requisition_id?: number;
  tenant_id: string;
  requisition_number: string;
  requisition_date: Date;
  required_by_date?: Date;
  department?: string;
  requested_by?: string;
  priority?: string;
  status: RequisitionStatus;
  total_amount: number;
  notes?: string;
  approved_by?: string;
  approved_date?: Date;
  rejection_reason?: string;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
  deleted_at?: Date;
  lines?: RequisitionLine[];
}

export class RequisitionRepository extends BaseRepository<Requisition> {
  protected tableName = 'purchase_requisitions';
  protected schema = 'purchase';
  protected primaryKey = 'requisition_id';
  protected softDelete = false;

  async getWithLines(ctx: TenantContext, requisitionId: string): Promise<Requisition | null> {
    const requisition = await this.findById(ctx, requisitionId);
    if (!requisition) return null;

    const linesSql = `
      SELECT line_id as id, requisition_id, item_code, description, quantity, unit_of_measure,
             estimated_unit_price, estimated_total, required_by_date, notes
      FROM purchase.requisition_line_items
      WHERE tenant_id = $1 AND requisition_id = $2
      ORDER BY line_number
    `;

    const lines = await this.rawQuery<RequisitionLine>(ctx, linesSql, [requisitionId]);
    return { ...requisition, lines };
  }

  async createWithLines(
    ctx: TenantContext,
    data: Partial<Requisition>,
    lines: Partial<RequisitionLine>[]
  ): Promise<Requisition> {
    const client = await this.beginTransaction();

    try {
      const numResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(requisition_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
        FROM ${this.fullTableName}
        WHERE tenant_id = $1
      `, [ctx.tenantId]);
      const requisitionNumber = `REQ-${String(numResult.rows[0].next_num).padStart(6, '0')}`;

      const totalAmount = lines.reduce((sum, line) => {
        const qty = line.quantity || 0;
        const price = line.estimated_unit_price || 0;
        return sum + qty * price;
      }, 0);

      const reqResult = await client.query<Requisition>(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, requisition_number, requisition_date, requested_by, department_id, required_by_date, priority, status, total_amount, notes, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *
      `, [
        ctx.tenantId,
        requisitionNumber,
        data.requisition_date || new Date(),
        data.requested_by,
        data.department,
        data.required_by_date,
        data.priority || 'normal',
        data.status || 'draft',
        totalAmount,
        data.notes,
        ctx.userId
      ]);

      const requisition = reqResult.rows[0];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO purchase.requisition_line_items
          (tenant_id, requisition_id, line_number, item_code, description, quantity, unit_of_measure, estimated_unit_price, estimated_total, required_by_date, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `, [
          ctx.tenantId,
          requisition.requisition_id,
          i + 1,
          line.item_code,
          line.description,
          line.quantity || 0,
          line.unit_of_measure || 'EA',
          line.estimated_unit_price || 0,
          (line.quantity || 0) * (line.estimated_unit_price || 0),
          line.required_by_date,
          line.notes
        ]);
      }

      await this.commitTransaction(client);
      return requisition;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  async updateStatus(ctx: TenantContext, requisitionId: string, status: RequisitionStatus, meta?: Partial<Requisition>): Promise<Requisition | null> {
    return this.update(ctx, requisitionId, {
      status,
      ...meta
    });
  }

  async deleteIfNoPurchaseOrder(ctx: TenantContext, requisitionId: string): Promise<boolean> {
    const poCheckSql = `SELECT COUNT(*) FROM purchase.purchase_orders WHERE tenant_id = $1 AND requisition_id = $2`;
    const poCheck = await this.rawQuery<{ count: string }>(ctx, poCheckSql, [requisitionId]);
    const hasPO = parseInt(poCheck[0]?.count || '0', 10) > 0;
    if (hasPO) return false;

    return this.delete(ctx, requisitionId);
  }
}

export const requisitionRepository = new RequisitionRepository();
export default requisitionRepository;
