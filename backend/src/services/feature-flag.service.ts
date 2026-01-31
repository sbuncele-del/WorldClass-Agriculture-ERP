import { query } from '../config/database';

/**
 * Feature Flag Service
 * Checks tenant-level feature flags from tenant_feature_flags table
 */
export class FeatureFlagService {
  /**
   * Check if a feature is enabled for a tenant
   */
  static async isEnabled(tenantId: string, featureName: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT enabled, rollout_percentage 
         FROM tenant_feature_flags 
         WHERE tenant_id = $1 AND feature_name = $2`,
        [tenantId, featureName]
      );

      if (result.rows.length === 0) {
        // Feature not found - check global feature_flags table
        const globalResult = await query(
          `SELECT is_enabled, rollout_percentage 
           FROM feature_flags 
           WHERE name = $1`,
          [featureName]
        );
        if (globalResult.rows.length === 0) return false;
        const flag = globalResult.rows[0];
        if (!flag.is_enabled) return false;
        // Rollout percentage check
        if (flag.rollout_percentage < 100) {
          return Math.random() * 100 < flag.rollout_percentage;
        }
        return true;
      }

      const flag = result.rows[0];
      if (!flag.enabled) return false;

      // Rollout percentage check (for gradual rollout)
      if (flag.rollout_percentage < 100) {
        return Math.random() * 100 < flag.rollout_percentage;
      }

      return true;
    } catch (error) {
      console.error('FeatureFlagService.isEnabled error:', error);
      return false;
    }
  }

  /**
   * Enable a feature for a tenant
   */
  static async enable(
    tenantId: string,
    featureName: string,
    category: string = 'FEATURE',
    updatedBy?: string
  ): Promise<void> {
    await query(
      `INSERT INTO tenant_feature_flags 
         (tenant_id, feature_name, feature_category, enabled, rollout_percentage, enabled_at, updated_by)
       VALUES ($1, $2, $3, true, 100, NOW(), $4)
       ON CONFLICT (tenant_id, feature_name) 
       DO UPDATE SET enabled = true, rollout_percentage = 100, enabled_at = NOW(), updated_by = $4, updated_at = NOW()`,
      [tenantId, featureName, category, updatedBy]
    );
  }

  /**
   * Disable a feature for a tenant
   */
  static async disable(tenantId: string, featureName: string, updatedBy?: string): Promise<void> {
    await query(
      `UPDATE tenant_feature_flags 
       SET enabled = false, disabled_at = NOW(), updated_by = $3, updated_at = NOW()
       WHERE tenant_id = $1 AND feature_name = $2`,
      [tenantId, featureName, updatedBy]
    );
  }

  /**
   * Enable feature globally (all tenants)
   */
  static async enableGlobal(featureName: string): Promise<void> {
    // First ensure global flag exists and is enabled
    await query(
      `INSERT INTO feature_flags (name, is_enabled, rollout_percentage)
       VALUES ($1, true, 100)
       ON CONFLICT (name) DO UPDATE SET is_enabled = true, rollout_percentage = 100`,
      [featureName]
    );

    // Enable for all existing tenants
    await query(
      `INSERT INTO tenant_feature_flags (tenant_id, feature_name, feature_category, enabled, rollout_percentage, enabled_at)
       SELECT tenant_id, $1, 'FEATURE', true, 100, NOW()
       FROM tenants
       ON CONFLICT (tenant_id, feature_name) 
       DO UPDATE SET enabled = true, rollout_percentage = 100, enabled_at = NOW(), updated_at = NOW()`,
      [featureName]
    );
  }

  /**
   * Get all features for a tenant
   */
  static async getAll(tenantId: string): Promise<Array<{ feature_name: string; enabled: boolean; config: any }>> {
    const result = await query(
      `SELECT feature_name, enabled, config 
       FROM tenant_feature_flags 
       WHERE tenant_id = $1 
       ORDER BY feature_name`,
      [tenantId]
    );
    return result.rows;
  }
}

export default FeatureFlagService;
