/**
 * PROPOSALS MANAGEMENT ROUTES
 * 
 * Tenant-aware proposal/quotation management API
 * All data is scoped to the authenticated user's tenant
 */

import express from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE - Dashboard Summary
// ============================================================================
router.get('/workspace', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant context required' });
    }

    // Get proposal statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_proposals,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COALESCE(SUM(value), 0) as total_value,
        COALESCE(SUM(value) FILTER (WHERE status = 'accepted'), 0) as won_value,
        COALESCE(SUM(value) FILTER (WHERE status IN ('sent', 'viewed')), 0) as pipeline_value
      FROM proposals 
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get recent proposals
    const recentResult = await query(`
      SELECT id, proposal_number, title, client_name, status, value, currency, valid_until, created_at
      FROM proposals 
      WHERE tenant_id = $1
      ORDER BY created_at DESC 
      LIMIT 10
    `, [tenantId]);

    // Get expiring soon (within 7 days)
    const expiringResult = await query(`
      SELECT id, proposal_number, title, client_name, value, valid_until
      FROM proposals 
      WHERE tenant_id = $1 
        AND status IN ('sent', 'viewed') 
        AND valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      ORDER BY valid_until ASC
    `, [tenantId]);

    const stats = statsResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        summary: {
          totalProposals: parseInt(stats.total_proposals) || 0,
          draftCount: parseInt(stats.draft_count) || 0,
          sentCount: parseInt(stats.sent_count) || 0,
          acceptedCount: parseInt(stats.accepted_count) || 0,
          rejectedCount: parseInt(stats.rejected_count) || 0,
          totalValue: parseFloat(stats.total_value) || 0,
          wonValue: parseFloat(stats.won_value) || 0,
          pipelineValue: parseFloat(stats.pipeline_value) || 0,
          winRate: stats.total_proposals > 0 
            ? Math.round((stats.accepted_count / stats.total_proposals) * 100) 
            : 0
        },
        recentProposals: recentResult.rows,
        expiringSoon: expiringResult.rows
      }
    });
  } catch (error: any) {
    console.error('Proposals workspace error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to load workspace' });
  }
});

// ============================================================================
// PROPOSALS CRUD
// ============================================================================

// GET all proposals
router.get('/', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let whereClause = 'WHERE tenant_id = $1';
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR proposal_number ILIKE $${paramIndex} OR client_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const offset = (Number(page) - 1) * Number(limit);
    
    const countResult = await query(`SELECT COUNT(*) FROM proposals ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await query(`
      SELECT * FROM proposals
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Get proposals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single proposal
router.get('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;

    const result = await query(`
      SELECT * FROM proposals WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Get proposal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE proposal
router.post('/', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { proposal_number, title, client_name, status, value, currency, valid_until, description } = req.body;

    if (!proposal_number || !title) {
      return res.status(400).json({ success: false, error: 'Proposal number and title are required' });
    }

    const result = await query(`
      INSERT INTO proposals (tenant_id, proposal_number, title, client_name, status, value, currency, valid_until, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [tenantId, proposal_number, title, client_name, status || 'draft', value || 0, currency || 'ZAR', valid_until, description]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Create proposal error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Proposal number already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE proposal
router.put('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    const { title, client_name, status, value, currency, valid_until, description } = req.body;

    const result = await query(`
      UPDATE proposals SET
        title = COALESCE($3, title),
        client_name = COALESCE($4, client_name),
        status = COALESCE($5, status),
        value = COALESCE($6, value),
        currency = COALESCE($7, currency),
        valid_until = COALESCE($8, valid_until),
        description = COALESCE($9, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [id, tenantId, title, client_name, status, value, currency, valid_until, description]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Update proposal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE proposal
router.delete('/:id', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;

    const result = await query(`
      DELETE FROM proposals WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, message: 'Proposal deleted' });
  } catch (error: any) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SEND proposal (update status to sent)
router.post('/:id/send', async (req: any, res) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;

    const result = await query(`
      UPDATE proposals SET 
        status = 'sent',
        sent_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND status = 'draft'
      RETURNING *
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found or already sent' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Send proposal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
