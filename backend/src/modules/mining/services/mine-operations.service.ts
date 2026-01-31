/**
 * Mining Operations Service
 * Handles mine management, shaft operations, and production tracking
 */

import { pool } from '../../../config/database';

export interface Mine {
  id?: number;
  tenantId: number;
  mineName: string;
  mineType: 'underground' | 'opencast' | 'placer' | 'solution';
  location: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  dmrLicense: string;
  licenseExpiryDate: Date;
  commodities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Shaft {
  id?: number;
  mineId: number;
  shaftName: string;
  depth: number;
  status: 'operational' | 'maintenance' | 'closed';
  capacity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductionShift {
  id?: number;
  shaftId: number;
  shiftDate: Date;
  shiftType: 'day' | 'night' | 'morning' | 'afternoon';
  oreTons: number;
  wasteTons: number;
  grade: number;
  crewSize: number;
  supervisor: string;
  notes?: string;
  createdAt?: Date;
}

export class MineOperationsService {
  /**
   * Get all mines for a tenant
   */
  static async getMines(tenantId: number): Promise<Mine[]> {
    const query = `
      SELECT id, tenant_id, mine_name, mine_type, location, 
             latitude, longitude, status, dmr_license, 
             license_expiry_date, commodities, created_at, updated_at
      FROM mines
      WHERE tenant_id = $1
      ORDER BY mine_name
    `;
    
    const result = await pool.query(query, [tenantId]);
    return result.rows.map(this.mapRowToMine);
  }

  /**
   * Get a specific mine by ID
   */
  static async getMineById(id: number, tenantId: number): Promise<Mine | null> {
    const query = `
      SELECT id, tenant_id, mine_name, mine_type, location, 
             latitude, longitude, status, dmr_license, 
             license_expiry_date, commodities, created_at, updated_at
      FROM mines
      WHERE id = $1 AND tenant_id = $2
    `;
    
    const result = await pool.query(query, [id, tenantId]);
    return result.rows.length > 0 ? this.mapRowToMine(result.rows[0]) : null;
  }

  /**
   * Create a new mine
   */
  static async createMine(mine: Mine): Promise<Mine> {
    const query = `
      INSERT INTO mines (
        tenant_id, mine_name, mine_type, location, latitude, longitude,
        status, dmr_license, license_expiry_date, commodities
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, tenant_id, mine_name, mine_type, location, 
                latitude, longitude, status, dmr_license, 
                license_expiry_date, commodities, created_at, updated_at
    `;
    
    const values = [
      mine.tenantId,
      mine.mineName,
      mine.mineType,
      mine.location,
      mine.latitude,
      mine.longitude,
      mine.status,
      mine.dmrLicense,
      mine.licenseExpiryDate,
      mine.commodities,
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToMine(result.rows[0]);
  }

  /**
   * Update an existing mine
   */
  static async updateMine(id: number, tenantId: number, updates: Partial<Mine>): Promise<Mine | null> {
    const allowedFields = [
      'mine_name', 'mine_type', 'location', 'latitude', 'longitude',
      'status', 'dmr_license', 'license_expiry_date', 'commodities'
    ];
    
    const setClause = Object.keys(updates)
      .filter(key => allowedFields.includes(this.camelToSnake(key)))
      .map((key, index) => `${this.camelToSnake(key)} = $${index + 3}`)
      .join(', ');

    if (!setClause) {
      const existing = await this.getMineById(id, tenantId);
      return existing;
    }

    const query = `
      UPDATE mines
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, tenant_id, mine_name, mine_type, location, 
                latitude, longitude, status, dmr_license, 
                license_expiry_date, commodities, created_at, updated_at
    `;
    
    const values = [
      id,
      tenantId,
      ...Object.keys(updates)
        .filter(key => allowedFields.includes(this.camelToSnake(key)))
        .map(key => (updates as any)[key])
    ];
    
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToMine(result.rows[0]) : null;
  }

  /**
   * Get shafts for a mine
   */
  static async getShafts(mineId: number): Promise<Shaft[]> {
    const query = `
      SELECT id, mine_id, shaft_name, depth, status, capacity, created_at, updated_at
      FROM shafts
      WHERE mine_id = $1
      ORDER BY shaft_name
    `;
    
    const result = await pool.query(query, [mineId]);
    return result.rows.map(this.mapRowToShaft);
  }

  /**
   * Create a new shaft
   */
  static async createShaft(shaft: Shaft): Promise<Shaft> {
    const query = `
      INSERT INTO shafts (mine_id, shaft_name, depth, status, capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, mine_id, shaft_name, depth, status, capacity, created_at, updated_at
    `;
    
    const values = [
      shaft.mineId,
      shaft.shaftName,
      shaft.depth,
      shaft.status,
      shaft.capacity,
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToShaft(result.rows[0]);
  }

  /**
   * Record a production shift
   */
  static async recordProductionShift(shift: ProductionShift): Promise<ProductionShift> {
    const query = `
      INSERT INTO production_shifts (
        shaft_id, shift_date, shift_type, ore_tons, waste_tons, 
        grade, crew_size, supervisor, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, shaft_id, shift_date, shift_type, ore_tons, 
                waste_tons, grade, crew_size, supervisor, notes, created_at
    `;
    
    const values = [
      shift.shaftId,
      shift.shiftDate,
      shift.shiftType,
      shift.oreTons,
      shift.wasteTons,
      shift.grade,
      shift.crewSize,
      shift.supervisor,
      shift.notes,
    ];
    
    const result = await pool.query(query, values);
    return this.mapRowToProductionShift(result.rows[0]);
  }

  /**
   * Get production data for a shaft over a period
   */
  static async getProduction(shaftId: number, startDate: Date, endDate: Date): Promise<ProductionShift[]> {
    const query = `
      SELECT id, shaft_id, shift_date, shift_type, ore_tons, 
             waste_tons, grade, crew_size, supervisor, notes, created_at
      FROM production_shifts
      WHERE shaft_id = $1 AND shift_date >= $2 AND shift_date <= $3
      ORDER BY shift_date DESC, shift_type
    `;
    
    const result = await pool.query(query, [shaftId, startDate, endDate]);
    return result.rows.map(this.mapRowToProductionShift);
  }

  /**
   * Get production summary for a mine
   */
  static async getProductionSummary(mineId: number, startDate: Date, endDate: Date) {
    const query = `
      SELECT 
        COUNT(DISTINCT ps.shaft_id) as active_shafts,
        SUM(ps.ore_tons) as total_ore_tons,
        SUM(ps.waste_tons) as total_waste_tons,
        AVG(ps.grade) as average_grade,
        COUNT(*) as total_shifts
      FROM production_shifts ps
      JOIN shafts s ON ps.shaft_id = s.id
      WHERE s.mine_id = $1 AND ps.shift_date >= $2 AND ps.shift_date <= $3
    `;
    
    const result = await pool.query(query, [mineId, startDate, endDate]);
    return result.rows[0];
  }

  // Helper methods
  private static mapRowToMine(row: any): Mine {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      mineName: row.mine_name,
      mineType: row.mine_type,
      location: row.location,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      dmrLicense: row.dmr_license,
      licenseExpiryDate: row.license_expiry_date,
      commodities: row.commodities,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToShaft(row: any): Shaft {
    return {
      id: row.id,
      mineId: row.mine_id,
      shaftName: row.shaft_name,
      depth: row.depth,
      status: row.status,
      capacity: row.capacity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToProductionShift(row: any): ProductionShift {
    return {
      id: row.id,
      shaftId: row.shaft_id,
      shiftDate: row.shift_date,
      shiftType: row.shift_type,
      oreTons: row.ore_tons,
      wasteTons: row.waste_tons,
      grade: row.grade,
      crewSize: row.crew_size,
      supervisor: row.supervisor,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default MineOperationsService;
