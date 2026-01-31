/**
 * Production Scheduler Service
 * Handles capacity planning and scheduling of production orders
 */

import { pool } from '../../../config/database';

export class ProductionSchedulerService {
  
  /**
   * Schedule a Production Order
   * Finds the earliest available slots for all operations
   */
  static async scheduleOrder(orderId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Get Order Details and Routing
      const orderRes = await client.query(
        `SELECT * FROM manufacturing.production_orders WHERE order_id = $1`,
        [orderId]
      );
      const order = orderRes.rows[0];
      
      if (!order.routing_id) {
        throw new Error('Order does not have a routing assigned');
      }
      
      // 2. Get Operations from Routing
      const opsRes = await client.query(
        `SELECT * FROM manufacturing.routing_operations 
         WHERE routing_id = $1 ORDER BY sequence_number`,
        [order.routing_id]
      );
      const operations = opsRes.rows;
      
      let currentStartTime = new Date(order.start_date || new Date());
      
      // 3. Create Production Operations (if not exist)
      // Check if ops already exist
      const existingOps = await client.query(
        `SELECT * FROM manufacturing.production_operations WHERE order_id = $1`,
        [orderId]
      );
      
      if (existingOps.rows.length === 0) {
        for (const op of operations) {
          // Calculate duration
          const setupTime = op.setup_time_minutes || 0;
          const runTime = (op.run_time_per_unit_minutes || 0) * order.quantity_planned;
          const totalDurationMinutes = setupTime + runTime;
          
          // Find capacity (Simplified: Just add duration to start time)
          // TODO: Check work_centers capacity calendar
          const endTime = new Date(currentStartTime.getTime() + totalDurationMinutes * 60000);
          
          await client.query(
            `INSERT INTO manufacturing.production_operations (
              order_id, sequence_number, work_center_id, operation_name,
              status, planned_start, planned_end
            ) VALUES ($1, $2, $3, $4, 'Pending', $5, $6)`,
            [orderId, op.sequence_number, op.work_center_id, op.operation_name,
             currentStartTime, endTime]
          );
          
          // Next op starts when this one ends (plus wait time)
          currentStartTime = new Date(endTime.getTime() + (op.wait_time_minutes || 0) * 60000);
        }
      }
      
      // 4. Update Order Status
      await client.query(
        `UPDATE manufacturing.production_orders 
         SET status = 'Scheduled', actual_start_date = $1 
         WHERE order_id = $2`,
        [order.start_date || new Date(), orderId]
      );
      
      await client.query('COMMIT');
      return { success: true, message: 'Order Scheduled Successfully' };
      
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Scheduling Failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Optimize Schedule using Vertex AI (Placeholder)
   */
  static async optimizeSchedule() {
    // TODO: Implement Google Cloud Vertex AI integration
    // 1. Export current schedule and constraints to JSON
    // 2. Call Vertex AI Optimization API
    // 3. Apply optimized schedule back to database
    return { message: 'Optimization logic to be implemented with Vertex AI' };
  }
  
  /**
   * Get Work Center Load
   */
  static async getWorkCenterLoad(startDate: string, endDate: string) {
    const result = await pool.query(`
      SELECT 
        wc.work_center_name,
        wc.capacity_per_day_hours,
        COUNT(po.prod_op_id) as operation_count,
        SUM(EXTRACT(EPOCH FROM (po.planned_end - po.planned_start))/3600) as allocated_hours
      FROM manufacturing.work_centers wc
      LEFT JOIN manufacturing.production_operations po ON wc.work_center_id = po.work_center_id
      WHERE po.planned_start >= $1 AND po.planned_end <= $2
      GROUP BY wc.work_center_id, wc.work_center_name, wc.capacity_per_day_hours
    `, [startDate, endDate]);
    
    return result.rows;
  }
}
