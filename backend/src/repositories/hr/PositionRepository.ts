/**
 * Position Repository
 */

import { BaseRepository, TenantContext } from '../BaseRepository';

export interface Position {
  position_id: string;
  tenant_id: string;
  position_code: string;
  position_title: string;
  department_id?: string;
  reports_to_position_id?: string;
  job_level?: string;
  job_category?: string;
  description?: string;
  requirements?: string;
  is_active: boolean;
  created_at: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
}

export class PositionRepository extends BaseRepository<Position> {
  protected tableName = 'positions';
  protected schema = 'hr';
  protected primaryKey = 'position_id';
  protected softDelete = false;

  async getActivePositions(ctx: TenantContext): Promise<Position[]> {
    const result = await this.findAll(ctx, { is_active: true });
    return result.data;
  }

  async isCodeUnique(ctx: TenantContext, code: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findOne(ctx, { position_code: code });
    if (!existing) return true;
    if (excludeId && (existing as any).position_id === excludeId) return true;
    return false;
  }
}

export const positionRepository = new PositionRepository();
export default positionRepository;
