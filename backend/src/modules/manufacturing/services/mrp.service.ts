import { pool } from '../../../db';

export class MrpService {

  static async runMrp(userId?: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create MRP Run Record
      const runRes = await client.query(
        `INSERT INTO manufacturing.mrp_runs (run_by, status) VALUES ($1, 'running') RETURNING run_id`,
        [userId]
      );
      const runId = runRes.rows[0].run_id;

      // 2. Clear old results (optional, or keep history)
      // await client.query('DELETE FROM manufacturing.mrp_results');

      // 3. Get all items that are manufactured (have a BOM)
      const mfgItemsRes = await client.query(
        `SELECT DISTINCT item_id FROM manufacturing.bill_of_materials WHERE status = 'active'`
      );
      
      for (const row of mfgItemsRes.rows) {
        await this.processItem(client, runId, row.item_id);
      }

      // 4. Update Run Status
      await client.query(
        `UPDATE manufacturing.mrp_runs SET status = 'completed' WHERE run_id = $1`,
        [runId]
      );

      await client.query('COMMIT');
      return { runId, message: 'MRP Run Completed' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private static async processItem(client: any, runId: number, itemId: number) {
    // A. Get Demand (Sales Orders)
    // Assuming sales_order_lines table exists
    /*
    const demandRes = await client.query(
      `SELECT SUM(quantity) as qty FROM sales_order_lines sol
       JOIN sales_orders so ON sol.order_id = so.order_id
       WHERE sol.item_id = $1 AND so.status NOT IN ('completed', 'cancelled')`,
      [itemId]
    );
    const grossReq = parseFloat(demandRes.rows[0].qty) || 0;
    */
    // Fallback to reorder level for demo if sales tables aren't fully known
    const itemRes = await client.query('SELECT reorder_level, reorder_quantity FROM items WHERE item_id = $1', [itemId]);
    const reorderLevel = parseFloat(itemRes.rows[0]?.reorder_level) || 0;
    const reorderQty = parseFloat(itemRes.rows[0]?.reorder_quantity) || 0;
    
    const grossReq = reorderLevel; // Simplified demand

    // B. Get Supply (Stock + Open Orders)
    const stockRes = await client.query(
      `SELECT SUM(on_hand_quantity) as qty FROM stock_levels WHERE item_id = $1`,
      [itemId]
    );
    const onHand = parseFloat(stockRes.rows[0]?.qty) || 0;

    const openOrdersRes = await client.query(
      `SELECT SUM(quantity_planned - quantity_produced) as qty 
       FROM manufacturing.production_orders 
       WHERE item_id = $1 AND status IN ('planned', 'released', 'in_progress')`,
      [itemId]
    );
    const scheduledReceipts = parseFloat(openOrdersRes.rows[0]?.qty) || 0;

    // C. Calculate Net Requirement
    const netReq = grossReq - (onHand + scheduledReceipts);

    if (netReq > 0) {
      const plannedOrderQty = Math.max(netReq, reorderQty);
      
      // Insert Result
      await client.query(
        `INSERT INTO manufacturing.mrp_results
         (run_id, item_id, gross_requirement, scheduled_receipts, projected_on_hand, net_requirement, planned_order_receipt, action_message, source_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Create Production Order', 'Reorder Level')`,
        [runId, itemId, grossReq, scheduledReceipts, onHand, netReq, plannedOrderQty]
      );
    }
  }
}
