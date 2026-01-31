import { pool } from '../../../db';
import { BomService } from './bom.service';

export class ProductionService {

  static async createProductionOrder(params: {
    item_id: number;
    quantity: number;
    start_date: Date;
    due_date: Date;
    warehouse_id: number;
    created_by?: number;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Find BOM
      const bom = await BomService.getActiveBomForItem(params.item_id);
      if (!bom) throw new Error('No active BOM found for this item');

      // 2. Generate Order Number
      const numRes = await client.query("SELECT nextval('manufacturing.production_orders_production_order_id_seq')");
      const orderNum = `WO-${String(numRes.rows[0].nextval).padStart(6, '0')}`;

      // 3. Create Order Header
      const orderRes = await client.query(
        `INSERT INTO manufacturing.production_orders
         (order_number, item_id, bom_id, warehouse_id, quantity_planned, start_date, due_date, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'planned', $8)
         RETURNING *`,
        [orderNum, params.item_id, bom.bom_id, params.warehouse_id, params.quantity, params.start_date, params.due_date, params.created_by]
      );
      const order = orderRes.rows[0];

      // 4. Plan Material Requirements (Components)
      const bomDetails = await BomService.getBom(bom.bom_id);
      if (bomDetails && bomDetails.components) {
        for (const comp of bomDetails.components) {
          const requiredQty = parseFloat(comp.quantity) * params.quantity * (1 + (parseFloat(comp.scrap_percentage) || 0) / 100);
          
          await client.query(
            `INSERT INTO manufacturing.production_material_issues
             (production_order_id, item_id, quantity_required, status)
             VALUES ($1, $2, $3, 'pending')`,
            [order.production_order_id, comp.item_id, requiredQty]
          );
        }
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async releaseOrder(orderId: number) {
    // Check stock availability logic could go here
    const res = await pool.query(
      `UPDATE manufacturing.production_orders 
       SET status = 'released', updated_at = NOW() 
       WHERE production_order_id = $1 AND status = 'planned'
       RETURNING *`,
      [orderId]
    );
    return res.rows[0];
  }

  static async completeOrder(orderId: number, quantityProduced: number, userId?: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update Order Status
      const orderRes = await client.query(
        `UPDATE manufacturing.production_orders 
         SET status = 'completed', quantity_produced = $2, actual_end_date = NOW(), updated_at = NOW()
         WHERE production_order_id = $1
         RETURNING *`,
        [orderId, quantityProduced]
      );
      const order = orderRes.rows[0];

      // 2. Add Finished Goods to Inventory (Stock Receipt)
      // Note: This assumes an inventory service or direct insert. 
      // For now, we'll do a direct insert into stock_movements to trigger inventory logic if triggers exist, 
      // or just call the inventory controller logic if we were in the same process.
      // Since we are in a separate module, we should ideally use a shared service.
      // I'll insert into stock_movements which is the standard way.
      
      // Generate movement number
      const mvNumRes = await client.query("SELECT COUNT(*) + 1 as next_num FROM stock_movements");
      const mvNum = `SM-MFG-${mvNumRes.rows[0].next_num}`;

      await client.query(
        `INSERT INTO stock_movements 
         (movement_number, movement_date, movement_type, item_id, to_warehouse_id, quantity, unit_cost, reference_type, reference_id, reference_number, created_by, status)
         VALUES ($1, NOW(), 'Production Receipt', $2, $3, $4, 0, 'Production Order', $5, $6, $7, 'Posted')`,
         // Note: Unit cost should be calculated from BOM + Labor. For now 0.
        [mvNum, order.item_id, order.warehouse_id, quantityProduced, order.production_order_id, order.order_number, userId]
      );

      // 3. Consume Raw Materials (Backflush)
      // Find pending issues
      const issuesRes = await client.query(
        `SELECT * FROM manufacturing.production_material_issues WHERE production_order_id = $1`,
        [orderId]
      );

      for (const issue of issuesRes.rows) {
        const qtyToIssue = parseFloat(issue.quantity_required); // Simple backflush logic: issue what was planned
        
        // Update issue record
        await client.query(
          `UPDATE manufacturing.production_material_issues 
           SET quantity_issued = $2, status = 'completed', updated_at = NOW()
           WHERE issue_id = $1`,
          [issue.issue_id, qtyToIssue]
        );

        // Create stock movement for consumption
        const issueMvNum = `SM-MFG-ISS-${Math.floor(Math.random() * 100000)}`;
        await client.query(
          `INSERT INTO stock_movements 
           (movement_number, movement_date, movement_type, item_id, from_warehouse_id, quantity, reference_type, reference_id, reference_number, created_by, status)
           VALUES ($1, NOW(), 'Production Consumption', $2, $3, $4, 'Production Order', $5, $6, $7, 'Posted')`,
           // Assuming source warehouse is same as dest for simplicity, or needs to be fetched from work center
          [issueMvNum, issue.item_id, order.warehouse_id, qtyToIssue, order.production_order_id, order.order_number, userId]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
