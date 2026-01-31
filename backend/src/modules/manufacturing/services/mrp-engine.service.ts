/**
 * MRP Engine Service (Material Requirements Planning)
 * Calculates net requirements and generates planned orders
 */

import { pool } from '../../../config/database';

export interface MrpRunParams {
  warehouse_id?: number;
  horizon_days?: number;
  include_safety_stock?: boolean;
}

export class MrpEngineService {
  
  /**
   * Run MRP Calculation
   */
  static async runMrp(params: MrpRunParams, userId: number = 1) {
    const client = await pool.connect();
    const horizonDays = params.horizon_days || 90;
    
    try {
      await client.query('BEGIN');
      
      // 1. Create MRP Run Record
      const runResult = await client.query(
        `INSERT INTO manufacturing.mrp_runs (run_date, parameters, status, created_by)
         VALUES (NOW(), $1, 'Running', $2) RETURNING run_id`,
        [JSON.stringify(params), userId]
      );
      const runId = runResult.rows[0].run_id;
      
      // 2. Clear previous requirements for this run (if any re-run logic existed, but here we just insert new)
      
      // 3. Get Gross Requirements (Demand)
      // 3a. Sales Orders (Approved/Confirmed)
      const salesDemand = await client.query(`
        SELECT 
          sol.item_id, 
          so.delivery_date as required_date, 
          sol.quantity as quantity_required,
          'Sales Order' as source_type,
          so.order_number as source_id
        FROM sales_order_lines sol
        JOIN sales_orders so ON sol.order_id = so.order_id
        WHERE so.status IN ('confirmed', 'processing')
          AND so.delivery_date <= CURRENT_DATE + $1 * INTERVAL '1 day'
      `, [horizonDays]);
      
      // 3b. Production Orders (Component Demand)
      const productionDemand = await client.query(`
        SELECT 
          bc.item_id,
          po.start_date as required_date,
          (po.quantity_planned * bc.quantity) as quantity_required,
          'Production Order' as source_type,
          po.order_number as source_id
        FROM manufacturing.production_orders po
        JOIN manufacturing.bom_components bc ON po.bom_id = bc.bom_id
        WHERE po.status IN ('planned', 'released')
          AND po.start_date <= CURRENT_DATE + $1 * INTERVAL '1 day'
      `, [horizonDays]);
      
      // 3c. Safety Stock (from Item Master)
      const safetyStockDemand = await client.query(`
        SELECT 
          item_id,
          CURRENT_DATE as required_date,
          reorder_level as quantity_required, -- Using reorder level as proxy for safety stock if not explicit
          'Safety Stock' as source_type,
          'System' as source_id
        FROM items
        WHERE is_active = true AND reorder_level > 0
      `);
      
      // Combine all demand
      const allDemand = [
        ...salesDemand.rows,
        ...productionDemand.rows,
        ...safetyStockDemand.rows
      ];
      
      // 4. Process each item's demand against supply
      for (const demand of allDemand) {
        // Get current stock
        const stockRes = await client.query(
          `SELECT SUM(available_quantity) as total_available 
           FROM stock_levels WHERE item_id = $1`,
          [demand.item_id]
        );
        const currentStock = parseFloat(stockRes.rows[0]?.total_available || 0);
        
        // Get incoming supply (PO's)
        const supplyRes = await client.query(`
          SELECT SUM(quantity - quantity_received) as incoming
          FROM purchase_order_lines pol
          JOIN purchase_orders po ON pol.order_id = po.order_id
          WHERE pol.item_id = $1 AND po.status IN ('approved', 'ordered')
            AND po.expected_delivery_date <= $2
        `, [demand.item_id, demand.required_date]);
        const incomingSupply = parseFloat(supplyRes.rows[0]?.incoming || 0);
        
        // Calculate Net Requirement
        const netRequirement = parseFloat(demand.quantity_required) - (currentStock + incomingSupply);
        
        if (netRequirement > 0) {
          // Determine action
          const itemRes = await client.query(
            `SELECT item_type, lead_time_days FROM items WHERE item_id = $1`,
            [demand.item_id]
          );
          const item = itemRes.rows[0];
          
          let actionMessage = '';
          if (item.item_type === 'Raw Material') {
            actionMessage = 'Create Purchase Order';
          } else if (item.item_type === 'Finished Good' || item.item_type === 'Sub-Assembly') {
            actionMessage = 'Create Production Order';
          } else {
            actionMessage = 'Review Requirement';
          }
          
          // Insert Requirement
          await client.query(`
            INSERT INTO manufacturing.material_requirements (
              run_id, item_id, required_date, quantity_required,
              source_type, source_id, action_message, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open')
          `, [
            runId, demand.item_id, demand.required_date, netRequirement,
            demand.source_type, demand.source_id, actionMessage
          ]);
        }
      }
      
      // 5. Complete Run
      await client.query(
        `UPDATE manufacturing.mrp_runs SET status = 'Completed' WHERE run_id = $1`,
        [runId]
      );
      
      await client.query('COMMIT');
      return { success: true, runId, message: 'MRP Run Completed Successfully' };
      
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('MRP Run Failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get MRP Results
   */
  static async getResults(runId?: number) {
    let query = `
      SELECT mr.*, i.item_code, i.item_name, i.item_type
      FROM manufacturing.material_requirements mr
      JOIN items i ON mr.item_id = i.item_id
    `;
    const params: any[] = [];
    
    if (runId) {
      query += ` WHERE mr.run_id = $1`;
      params.push(runId);
    } else {
      // Get latest run
      query += ` WHERE mr.run_id = (SELECT MAX(run_id) FROM manufacturing.mrp_runs WHERE status = 'Completed')`;
    }
    
    query += ` ORDER BY mr.required_date, i.item_code`;
    
    const result = await pool.query(query, params);
    return result.rows;
  }
}
