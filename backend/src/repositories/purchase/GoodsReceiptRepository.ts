/**
 * Goods Receipt Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export type GoodsReceiptStatus = 'draft' | 'confirmed' | 'cancelled';

export interface GoodsReceiptLine {
  line_id: number;
  gr_id: number;
  po_line_id?: number;
  item_code?: string;
  description?: string;
  quantity_ordered?: number;
  quantity_received: number;
  quantity_rejected?: number;
  rejection_reason?: string;
  unit_of_measure?: string;
  notes?: string;
  line_number?: number;
}

export interface GoodsReceipt {
  gr_id: number;
  tenant_id: string;
  gr_number: string;
  gr_date: Date;
  po_id?: number;
  supplier_id?: number;
  delivery_note_number?: string;
  received_by?: number;
  status: GoodsReceiptStatus;
  total_quantity: number;
  warehouse_id?: number;
  notes?: string;
  confirmed?: boolean;
  confirmed_by?: number;
  confirmed_date?: Date;
  created_at: Date;
  created_by?: number;
  updated_at?: Date;
  updated_by?: number;
  deleted_at?: Date;
  lines?: GoodsReceiptLine[];
}

export class GoodsReceiptRepository extends BaseRepository<GoodsReceipt> {
  protected tableName = 'goods_receipts';
  protected schema = 'purchase';
  protected primaryKey = 'gr_id';
  protected softDelete = false;

  async getWithLines(ctx: TenantContext, grId: string): Promise<GoodsReceipt | null> {
    const receipt = await this.findById(ctx, grId);
    if (!receipt) return null;

    const linesSql = `
      SELECT line_id, gr_id, po_line_id, line_number, item_code, description, quantity_ordered,
             quantity_received, unit_of_measure, notes
      FROM purchase.gr_line_items
      WHERE tenant_id = $1 AND gr_id = $2
      ORDER BY line_number
    `;
    const lines = await this.rawQuery<GoodsReceiptLine>(ctx, linesSql, [grId]);
    return { ...receipt, lines };
  }

  async createWithLines(
    ctx: TenantContext,
    data: Partial<GoodsReceipt>,
    lines: Partial<GoodsReceiptLine>[]
  ): Promise<GoodsReceipt> {
    const client = await this.beginTransaction();

    try {
      const numResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(gr_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
        FROM ${this.fullTableName}
        WHERE tenant_id = $1
      `, [ctx.tenantId]);
      const grNumber = `GR-${String(numResult.rows[0].next_num).padStart(6, '0')}`;

      const totalQty = lines.reduce((sum, l) => sum + (l.quantity_received || 0), 0);

      const grResult = await client.query<GoodsReceipt>(`
        INSERT INTO ${this.fullTableName}
        (tenant_id, gr_number, gr_date, po_id, supplier_id, delivery_note_number, received_by, status, total_quantity, warehouse_id, notes, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *
      `, [
        ctx.tenantId,
        grNumber,
        data.gr_date || new Date(),
        data.po_id,
        data.supplier_id,
        data.delivery_note_number,
        data.received_by,
        data.status || 'draft',
        totalQty,
        data.warehouse_id,
        data.notes,
        ctx.userId
      ]);

      const receipt = grResult.rows[0];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        await client.query(`
          INSERT INTO purchase.gr_line_items
          (tenant_id, gr_id, line_number, po_line_id, item_code, description, quantity_ordered, quantity_received, unit_of_measure, notes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `, [
          ctx.tenantId,
          receipt.gr_id,
          i + 1,
          line.po_line_id,
          line.item_code,
          line.description,
          line.quantity_ordered || 0,
          line.quantity_received || 0,
          line.unit_of_measure || 'EA',
          line.notes
        ]);
      }

      await this.commitTransaction(client);
      return receipt;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

export const goodsReceiptRepository = new GoodsReceiptRepository();
export default goodsReceiptRepository;
