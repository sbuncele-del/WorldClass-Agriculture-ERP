import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '8h'; // Demo sessions last 8 hours

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_USER_EMAIL = 'demo@aetheros.co.za';

/**
 * Demo Access Controller
 * 
 * Provides instant demo access without signup:
 * - Generates pre-authenticated JWT token for demo user
 * - Returns token and redirect URL
 * - Tracks demo usage statistics
 */

class DemoAccessController {
  /**
   * Generate demo access token
   * POST /api/demo/access
   * 
   * Returns JWT token for instant demo access
   * No authentication required - this is a public endpoint
   */
  async generateDemoToken(req: Request, res: Response): Promise<void> {
    try {
      console.log('[DemoAccess] Generating demo access token');

      // Get demo user from database
      const userResult = await pool.query(
        `SELECT id, tenant_id, email, first_name, last_name, role 
         FROM users 
         WHERE email = $1 AND tenant_id = $2`,
        [DEMO_USER_EMAIL, DEMO_TENANT_ID]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Demo user not found. Please contact support.'
        });
        return;
      }

      const demoUser = userResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: demoUser.id,
          tenantId: demoUser.tenant_id,
          email: demoUser.email,
          role: demoUser.role,
          isDemo: true // Flag to identify demo sessions
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Log demo access in audit trail
      await pool.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          DEMO_TENANT_ID,
          demoUser.id,
          'demo_access',
          'demo',
          JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
            source: req.query.source || 'direct' // Track traffic sources
          }),
          req.ip || 'unknown'
        ]
      );

      // Get tenant info for response
      const tenantResult = await pool.query(
        'SELECT name, subscription_plan FROM tenants WHERE id = $1',
        [DEMO_TENANT_ID]
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          firstName: demoUser.first_name,
          lastName: demoUser.last_name,
          role: demoUser.role,
          isDemo: true
        },
        tenant: {
          id: DEMO_TENANT_ID,
          name: tenantResult.rows[0]?.name || 'Demo Company',
          plan: tenantResult.rows[0]?.subscription_plan || 'professional'
        },
        expiresIn: JWT_EXPIRY,
        dashboardUrl: '/dashboard' // Frontend route to redirect to
      });

    } catch (error: any) {
      console.error('[DemoAccess] Token generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate demo access',
        error: error.message
      });
    }
  }

  /**
   * Get demo information (for landing page)
   * GET /api/demo/info
   * 
   * Returns demo credentials and features
   */
  async getDemoInfo(_req: Request, res: Response): Promise<void> {
    try {
      // Get demo tenant stats
      const statsResult = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as user_count,
          (SELECT COUNT(*) FROM customers WHERE tenant_id = $1) as customer_count,
          (SELECT COUNT(*) FROM products WHERE tenant_id = $1) as product_count,
          (SELECT COUNT(*) FROM sales_invoices WHERE tenant_id = $1) as invoice_count,
          (SELECT COUNT(*) FROM journal_entries WHERE tenant_id = $1) as journal_count
         LIMIT 1`,
        [DEMO_TENANT_ID]
      );

      const stats = statsResult.rows[0] || {
        user_count: 0,
        customer_count: 0,
        product_count: 0,
        invoice_count: 0,
        journal_count: 0
      };

      res.status(200).json({
        success: true,
        demo: {
          credentials: {
            email: DEMO_USER_EMAIL,
            password: 'Demo123!' // Public demo credentials
          },
          features: [
            {
              icon: '💰',
              title: 'Financial Management',
              description: 'Full double-entry accounting, trial balance, P&L, balance sheet'
            },
            {
              icon: '📊',
              title: 'Multi-Module ERP',
              description: 'Inventory, Sales, Purchase, HR, Manufacturing, Warehouse'
            },
            {
              icon: '🔐',
              title: 'Multi-Tenant Architecture',
              description: 'Complete tenant isolation with role-based access control'
            },
            {
              icon: '💳',
              title: 'Payment Integration',
              description: 'Ozow (ZAR) and Stripe (USD) payment gateways'
            },
            {
              icon: '📈',
              title: 'Advanced Reporting',
              description: 'Custom reports, financial forecasting, cash flow analysis'
            },
            {
              icon: '✅',
              title: 'Approval Workflows',
              description: 'Multi-level approval system for purchases and journal entries'
            }
          ],
          stats: {
            users: parseInt(stats.user_count),
            customers: parseInt(stats.customer_count),
            products: parseInt(stats.product_count),
            invoices: parseInt(stats.invoice_count),
            journals: parseInt(stats.journal_count)
          },
          resetSchedule: '2:00 AM daily (SAST)',
          sessionDuration: '8 hours',
          limitations: [
            'Demo resets daily at 2:00 AM',
            'Session expires after 8 hours',
            'Some features disabled (email sending, payment processing)',
            'Data is shared with other demo users'
          ]
        }
      });

    } catch (error: any) {
      console.error('[DemoAccess] Info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get demo info',
        error: error.message
      });
    }
  }

  /**
   * Get demo usage statistics (for admin)
   * GET /api/demo/statistics
   */
  async getDemoStatistics(_req: Request, res: Response): Promise<void> {
    try {
      // Count demo access events in last 30 days
      const accessResult = await pool.query(
        `SELECT 
          COUNT(*) as total_accesses,
          COUNT(DISTINCT DATE(created_at)) as unique_days,
          COUNT(DISTINCT ip_address) as unique_ips
         FROM audit_log
         WHERE action = 'demo_access' 
           AND tenant_id = $1
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [DEMO_TENANT_ID]
      );

      // Get access by day (last 7 days)
      const dailyResult = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as accesses
         FROM audit_log
         WHERE action = 'demo_access' 
           AND tenant_id = $1
           AND created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [DEMO_TENANT_ID]
      );

      const stats = accessResult.rows[0] || {
        total_accesses: 0,
        unique_days: 0,
        unique_ips: 0
      };

      res.status(200).json({
        success: true,
        statistics: {
          last30Days: {
            totalAccesses: parseInt(stats.total_accesses),
            uniqueDays: parseInt(stats.unique_days),
            uniqueIPs: parseInt(stats.unique_ips),
            avgAccessesPerDay: Math.round(parseInt(stats.total_accesses) / 30)
          },
          last7Days: dailyResult.rows.map(row => ({
            date: row.date,
            accesses: parseInt(row.accesses)
          }))
        }
      });

    } catch (error: any) {
      console.error('[DemoAccess] Statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get demo statistics',
        error: error.message
      });
    }
  }
}

export default new DemoAccessController();
