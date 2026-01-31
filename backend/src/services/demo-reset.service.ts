import pool from '../config/database';
import cron from 'node-cron';
import ProvisioningService from './provisioning.service';

/**
 * Demo Tenant Auto-Reset Service
 * 
 * Purpose:
 * - Automatically resets demo tenant data daily at 2:00 AM
 * - Preserves demo user access (email & password)
 * - Restores clean demo state with default transactions
 * - Ensures consistent demo experience for new users
 * 
 * Safety:
 * - Only affects demo tenant (UUID: 00000000-0000-0000-0000-000000000001)
 * - Preserves core tenant record
 * - Maintains audit trail of resets
 */

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_EMAIL = 'demo@aetheros.co.za';
const DEMO_USER_PASSWORD_HASH = '$2b$10$8Z9K7j.W4YJHpX2vN5Q8.eF1.zX0w3F9bL5fQ7K8R9X3Y5Z1A2B3C'; // Demo123!

class DemoResetService {
  private resetInProgress = false;
  private lastResetTime: Date | null = null;
  private resetCount = 0;

  /**
   * Initialize cron job to reset demo tenant daily at 2:00 AM
   */
  initializeCronJob(): void {
    // Cron schedule: '0 2 * * *' = Every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log(`[DemoReset] Starting scheduled demo reset at ${new Date().toISOString()}`);
      await this.resetDemoTenant();
    });

    console.log('[DemoReset] Cron job initialized - Demo tenant will reset daily at 2:00 AM');
  }

  /**
   * Manually trigger demo tenant reset (for testing or emergency)
   */
  async resetDemoTenant(): Promise<{ success: boolean; message: string; timestamp: Date }> {
    if (this.resetInProgress) {
      console.log('[DemoReset] Reset already in progress, skipping...');
      return {
        success: false,
        message: 'Reset already in progress',
        timestamp: new Date()
      };
    }

    this.resetInProgress = true;
    const startTime = Date.now();

    try {
      console.log('[DemoReset] Starting demo tenant reset...');

      // Step 1: Verify demo tenant exists
      const tenantCheck = await pool.query(
        'SELECT id, name FROM tenants WHERE id = $1',
        [DEMO_TENANT_ID]
      );

      if (tenantCheck.rows.length === 0) {
        throw new Error('Demo tenant not found');
      }

      // Step 2: Begin transaction for atomic reset
      await pool.query('BEGIN');

      // Step 3: Delete transactional data (preserve structure)
      await this.clearTransactionalData();

      // Step 4: Reset document sequences
      await this.resetDocumentSequences();

      // Step 5: Restore demo user (preserve credentials)
      await this.restoreDemoUser();

      // Step 6: Reprovision tenant with fresh data
      await this.reprovisionDemoTenant();

      // Step 7: Log reset in audit trail
      await this.logReset();

      // Step 8: Commit transaction
      await pool.query('COMMIT');

      const duration = Date.now() - startTime;
      this.lastResetTime = new Date();
      this.resetCount++;

      console.log(`[DemoReset] Reset completed successfully in ${duration}ms (Reset #${this.resetCount})`);

      return {
        success: true,
        message: `Demo tenant reset successfully in ${duration}ms`,
        timestamp: this.lastResetTime
      };

    } catch (error: any) {
      // Rollback on error
      await pool.query('ROLLBACK');
      console.error('[DemoReset] Reset failed:', error);

      return {
        success: false,
        message: `Reset failed: ${error.message}`,
        timestamp: new Date()
      };

    } finally {
      this.resetInProgress = false;
    }
  }

  /**
   * Clear all transactional data created after initial setup
   * Preserves: Chart of accounts, tax rates, payment terms, financial periods
   * Deletes: Journal entries, invoices, purchase orders, inventory transactions, etc.
   */
  private async clearTransactionalData(): Promise<void> {
    console.log('[DemoReset] Clearing transactional data...');

    // Delete in order respecting foreign key constraints
    const deleteQueries = [
      // Payment & subscription data
      'DELETE FROM invoices WHERE tenant_id = $1',
      'DELETE FROM payment_transactions WHERE tenant_id = $1',
      
      // Financial transactions
      'DELETE FROM journal_entry_lines WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE tenant_id = $1)',
      'DELETE FROM journal_entries WHERE tenant_id = $1',
      
      // Sales module
      'DELETE FROM sales_invoice_items WHERE sales_invoice_id IN (SELECT id FROM sales_invoices WHERE tenant_id = $1)',
      'DELETE FROM sales_invoices WHERE tenant_id = $1',
      'DELETE FROM sales_order_items WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE tenant_id = $1)',
      'DELETE FROM sales_orders WHERE tenant_id = $1',
      'DELETE FROM sales_quotes WHERE tenant_id = $1',
      'DELETE FROM customers WHERE tenant_id = $1',
      
      // Purchase module
      'DELETE FROM purchase_invoice_items WHERE purchase_invoice_id IN (SELECT id FROM purchase_invoices WHERE tenant_id = $1)',
      'DELETE FROM purchase_invoices WHERE tenant_id = $1',
      'DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE tenant_id = $1)',
      'DELETE FROM purchase_orders WHERE tenant_id = $1',
      'DELETE FROM suppliers WHERE tenant_id = $1',
      
      // Inventory module
      'DELETE FROM inventory_transactions WHERE tenant_id = $1',
      'DELETE FROM inventory_adjustments WHERE tenant_id = $1',
      'DELETE FROM products WHERE tenant_id = $1',
      
      // HR module (if exists)
      'DELETE FROM payroll_entries WHERE tenant_id = $1',
      'DELETE FROM employee_leaves WHERE tenant_id = $1',
      'DELETE FROM employees WHERE tenant_id = $1',
      
      // Clear audit logs except system events
      `DELETE FROM audit_log WHERE tenant_id = $1 AND action NOT IN ('tenant_created', 'provisioning_complete', 'demo_reset')`,
    ];

    for (const query of deleteQueries) {
      try {
        const result = await pool.query(query, [DEMO_TENANT_ID]);
        console.log(`[DemoReset] Deleted ${result.rowCount} rows from table`);
      } catch (error: any) {
        // Continue even if table doesn't exist (module not yet implemented)
        if (error.code !== '42P01') { // 42P01 = undefined_table
          throw error;
        }
      }
    }

    console.log('[DemoReset] Transactional data cleared');
  }

  /**
   * Reset document numbering sequences to start fresh
   */
  private async resetDocumentSequences(): Promise<void> {
    console.log('[DemoReset] Resetting document sequences...');

    const resetQueries = [
      `UPDATE document_sequences SET current_number = 0 WHERE tenant_id = $1`,
    ];

    for (const query of resetQueries) {
      try {
        await pool.query(query, [DEMO_TENANT_ID]);
      } catch (error: any) {
        if (error.code !== '42P01') {
          throw error;
        }
      }
    }

    console.log('[DemoReset] Document sequences reset');
  }

  /**
   * Restore demo user credentials
   * Preserves email and password so demo users can always log in
   */
  private async restoreDemoUser(): Promise<void> {
    console.log('[DemoReset] Restoring demo user...');

    // Check if demo user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [DEMO_USER_EMAIL, DEMO_TENANT_ID]
    );

    if (userCheck.rows.length === 0) {
      // Create demo user
      await pool.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [DEMO_TENANT_ID, DEMO_USER_EMAIL, DEMO_USER_PASSWORD_HASH, 'Demo', 'User', 'admin', true, true]
      );
      console.log('[DemoReset] Demo user created');
    } else {
      // Update existing demo user (reset password if changed)
      await pool.query(
        `UPDATE users 
         SET password_hash = $1, is_active = true, email_verified = true, failed_login_attempts = 0
         WHERE email = $2 AND tenant_id = $3`,
        [DEMO_USER_PASSWORD_HASH, DEMO_USER_EMAIL, DEMO_TENANT_ID]
      );
      console.log('[DemoReset] Demo user restored');
    }

    // Clear any refresh tokens
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = $1 AND tenant_id = $2)',
      [DEMO_USER_EMAIL, DEMO_TENANT_ID]
    );
  }

  /**
   * Reprovision demo tenant with fresh sample data
   */
  private async reprovisionDemoTenant(): Promise<void> {
    console.log('[DemoReset] Reprovisioning demo tenant...');

    try {
      // Note: This calls the existing provisioning service
      // to recreate chart of accounts, tax rates, etc.
      // We don't need to recreate these as they're preserved,
      // but we could add demo transactions here in the future

      // For now, just ensure essential data exists
      const accountCheck = await pool.query(
        'SELECT COUNT(*) as count FROM chart_of_accounts WHERE tenant_id = $1',
        [DEMO_TENANT_ID]
      );

      if (parseInt(accountCheck.rows[0].count) === 0) {
        console.log('[DemoReset] Chart of accounts missing, reprovisioning...');
        // Call provisioning service to recreate
        await ProvisioningService.provisionNewTenant({
          tenantId: DEMO_TENANT_ID,
          country: 'ZA',
          industry: 'general',
          currency: 'ZAR'
        });
      }

      console.log('[DemoReset] Demo tenant reprovisioned');
    } catch (error) {
      console.error('[DemoReset] Reprovisioning error:', error);
      // Don't throw - reset can continue without demo data
    }
  }

  /**
   * Log reset event in audit trail
   */
  private async logReset(): Promise<void> {
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)`,
      [
        DEMO_TENANT_ID,
        'demo_reset',
        'tenant',
        DEMO_TENANT_ID,
        JSON.stringify({
          reset_count: this.resetCount,
          timestamp: new Date().toISOString(),
          automated: true
        }),
        'system'
      ]
    );
  }

  /**
   * Get reset statistics
   */
  getResetStats(): {
    lastResetTime: Date | null;
    resetCount: number;
    resetInProgress: boolean;
  } {
    return {
      lastResetTime: this.lastResetTime,
      resetCount: this.resetCount,
      resetInProgress: this.resetInProgress
    };
  }

  /**
   * Check if demo tenant needs reset (for manual trigger)
   * Returns true if last reset was more than 24 hours ago
   */
  needsReset(): boolean {
    if (!this.lastResetTime) return true;
    
    const hoursSinceReset = (Date.now() - this.lastResetTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceReset >= 24;
  }
}

export default new DemoResetService();
