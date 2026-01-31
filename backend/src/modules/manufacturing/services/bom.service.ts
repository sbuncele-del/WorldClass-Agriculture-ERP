import { pool } from '../../../db';

export interface BomComponent {
  item_id: number;
  quantity: number;
  uom_id?: number;
  scrap_percentage?: number;
  notes?: string;
}

export interface CreateBomParams {
  item_id: number;
  bom_code: string;
  version: string;
  description?: string;
  components: BomComponent[];
  created_by?: number;
}

export class BomService {
  
  static async createBom(params: CreateBomParams) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create BOM Header
      const bomRes = await client.query(
        `INSERT INTO manufacturing.bill_of_materials 
         (item_id, bom_code, version, description, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [params.item_id, params.bom_code, params.version, params.description, params.created_by]
      );
      const bom = bomRes.rows[0];

      // 2. Create Components
      for (const comp of params.components) {
        await client.query(
          `INSERT INTO manufacturing.bom_components
           (bom_id, item_id, quantity, uom_id, scrap_percentage, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [bom.bom_id, comp.item_id, comp.quantity, comp.uom_id, comp.scrap_percentage || 0, comp.notes]
        );
      }

      await client.query('COMMIT');
      return bom;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getBom(bomId: number) {
    const bomRes = await pool.query(
      `SELECT b.*, i.item_code, i.item_name 
       FROM manufacturing.bill_of_materials b
       JOIN items i ON b.item_id = i.item_id
       WHERE b.bom_id = $1`,
      [bomId]
    );
    
    if (bomRes.rows.length === 0) return null;

    const componentsRes = await pool.query(
      `SELECT c.*, i.item_code, i.item_name, i.standard_cost, i.average_cost
       FROM manufacturing.bom_components c
       JOIN items i ON c.item_id = i.item_id
       WHERE c.bom_id = $1`,
      [bomId]
    );

    return {
      ...bomRes.rows[0],
      components: componentsRes.rows
    };
  }

  static async calculateBomCost(bomId: number) {
    const bom = await this.getBom(bomId);
    if (!bom) throw new Error('BOM not found');

    let totalCost = 0;
    for (const comp of bom.components) {
      const unitCost = parseFloat(comp.standard_cost) || parseFloat(comp.average_cost) || 0;
      const qty = parseFloat(comp.quantity);
      const scrap = parseFloat(comp.scrap_percentage) || 0;
      
      // Cost = Qty * (1 + Scrap%) * UnitCost
      const lineCost = qty * (1 + scrap / 100) * unitCost;
      totalCost += lineCost;
    }

    return totalCost;
  }

  static async getActiveBomForItem(itemId: number) {
    const res = await pool.query(
      `SELECT * FROM manufacturing.bill_of_materials 
       WHERE item_id = $1 AND status = 'active' 
       ORDER BY is_default DESC, created_at DESC LIMIT 1`,
      [itemId]
    );
    return res.rows[0] || null;
  }
}
