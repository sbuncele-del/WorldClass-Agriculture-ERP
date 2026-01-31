/**
 * Proposals Controller V2
 * Tenant-hardened API for proposal/quote management
 * 
 * Features:
 * - Proposal CRUD operations
 * - Workspace summary
 * - Send/convert proposals
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// WORKSPACE
// ============================================================================
export const getWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const [totalResult, draftResult, sentResult, acceptedResult, valueResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total_proposals FROM proposals WHERE tenant_id = $1`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as draft_count FROM proposals WHERE tenant_id = $1 AND status = 'draft'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as sent_count FROM proposals WHERE tenant_id = $1 AND status = 'sent'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as accepted_count FROM proposals WHERE tenant_id = $1 AND status = 'accepted'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total_value
        FROM proposals WHERE tenant_id = $1 AND status IN ('sent', 'accepted')`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalProposals: parseInt(totalResult.rows[0]?.total_proposals || '0'),
          draftCount: parseInt(draftResult.rows[0]?.draft_count || '0'),
          sentCount: parseInt(sentResult.rows[0]?.sent_count || '0'),
          acceptedCount: parseInt(acceptedResult.rows[0]?.accepted_count || '0'),
          pipelineValue: parseFloat(valueResult.rows[0]?.total_value || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Proposals workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// PROPOSALS
// ============================================================================
export const getProposals = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status } = req.query;

    // Simple query - just get proposals without complex joins
    let queryStr = `
      SELECT id, title, status, created_at
      FROM proposals
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      queryStr += ` AND status = $${params.length}`;
    }

    queryStr += ' ORDER BY created_at DESC';
    const result = await pool.query(queryStr, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        createdAt: p.created_at
      }))
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get proposals error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch proposals' });
  }
};

export const getProposalById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const proposalResult = await pool.query(
      `SELECT p.*, c.name as customer_name, c.email as customer_email, 
        c.phone as customer_phone, c.address as customer_address
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1 AND p.tenant_id = $2`,
      [id, tenantId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    // Get line items
    const itemsResult = await pool.query(
      `SELECT * FROM proposal_items WHERE proposal_id = $1 ORDER BY line_number`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...proposalResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch proposal' });
  }
};

export const createProposal = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { customerId, title, description, validUntil, items, termsAndConditions,
            discountPercent, taxPercent, notes } = req.body;

    // Generate proposal number
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM proposals WHERE tenant_id = $1`,
      [tenantId]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const proposalNumber = `PROP-${new Date().getFullYear()}-${count.toString().padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    if (items && items.length > 0) {
      subtotal = items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
      }, 0);
    }
    const discountAmount = subtotal * ((discountPercent || 0) / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * ((taxPercent || 0) / 100);
    const totalAmount = taxableAmount + taxAmount;

    // Create proposal
    const proposalResult = await pool.query(
      `INSERT INTO proposals (tenant_id, created_by_user_id, proposal_number, customer_id, 
        title, description, valid_until, subtotal, discount_percent, discount_amount, 
        tax_percent, tax_amount, total_amount, terms_and_conditions, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft')
      RETURNING *`,
      [tenantId, userId, proposalNumber, customerId, title, description, validUntil,
       subtotal, discountPercent || 0, discountAmount, taxPercent || 0, taxAmount, 
       totalAmount, termsAndConditions, notes]
    );

    const proposal = proposalResult.rows[0];

    // Create line items
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        await pool.query(
          `INSERT INTO proposal_items (tenant_id, proposal_id, line_number, description, 
            quantity, unit, unit_price, line_total)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [tenantId, proposal.id, i + 1, item.description, item.quantity, 
           item.unit || 'each', item.unitPrice, lineTotal]
        );
      }
    }

    res.status(201).json({ success: true, data: proposal, message: 'Proposal created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to create proposal' });
  }
};

export const updateProposal = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { title, description, validUntil, status, termsAndConditions, notes } = req.body;

    const result = await pool.query(
      `UPDATE proposals SET
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        valid_until = COALESCE($5, valid_until),
        status = COALESCE($6, status),
        terms_and_conditions = COALESCE($7, terms_and_conditions),
        notes = COALESCE($8, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, title, description, validUntil, status, termsAndConditions, notes]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Proposal updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to update proposal' });
  }
};

export const deleteProposal = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    // Check if proposal is draft
    const checkResult = await pool.query(
      `SELECT status FROM proposals WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only draft proposals can be deleted' 
      });
    }

    // Delete items first
    await pool.query(`DELETE FROM proposal_items WHERE proposal_id = $1`, [id]);

    // Delete proposal
    await pool.query(`DELETE FROM proposals WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);

    res.json({ success: true, message: 'Proposal deleted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete proposal' });
  }
};

// ============================================================================
// SEND PROPOSAL
// ============================================================================
export const sendProposal = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { recipientEmail, personalMessage } = req.body;

    // Get proposal with customer
    const proposalResult = await pool.query(
      `SELECT p.*, c.name as customer_name, c.email as customer_email
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1 AND p.tenant_id = $2`,
      [id, tenantId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];
    const sendTo = recipientEmail || proposal.customer_email;

    if (!sendTo) {
      return res.status(400).json({ 
        success: false, 
        error: 'No recipient email provided and customer has no email' 
      });
    }

    // Update status to sent
    await pool.query(
      `UPDATE proposals SET 
        status = 'sent', 
        sent_at = CURRENT_TIMESTAMP,
        sent_to_email = $3
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, sendTo]
    );

    // Log the send action
    await pool.query(
      `INSERT INTO proposal_activity_log (tenant_id, proposal_id, user_id, action, 
        details, created_at)
      VALUES ($1, $2, $3, 'sent', $4, CURRENT_TIMESTAMP)`,
      [tenantId, id, userId, JSON.stringify({ email: sendTo, message: personalMessage })]
    );

    // In production, would send actual email here
    console.log(`Proposal ${proposal.proposal_number} sent to ${sendTo}`);

    res.json({ 
      success: true, 
      message: `Proposal sent to ${sendTo}`,
      data: { sentTo: sendTo, sentAt: new Date() }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Send proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to send proposal' });
  }
};

// ============================================================================
// CONVERT TO INVOICE/ORDER
// ============================================================================
export const convertProposal = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { convertTo } = req.body; // 'invoice' or 'sales_order'

    if (!['invoice', 'sales_order'].includes(convertTo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'convertTo must be "invoice" or "sales_order"' 
      });
    }

    // Get proposal
    const proposalResult = await pool.query(
      `SELECT * FROM proposals WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (proposalResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];

    if (proposal.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only accepted proposals can be converted' 
      });
    }

    // Update proposal status
    await pool.query(
      `UPDATE proposals SET 
        status = 'converted',
        converted_to = $3,
        converted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, convertTo]
    );

    // Log the conversion
    await pool.query(
      `INSERT INTO proposal_activity_log (tenant_id, proposal_id, user_id, action, 
        details, created_at)
      VALUES ($1, $2, $3, 'converted', $4, CURRENT_TIMESTAMP)`,
      [tenantId, id, userId, JSON.stringify({ convertedTo: convertTo })]
    );

    res.json({ 
      success: true, 
      message: `Proposal converted to ${convertTo}`,
      data: { convertedTo: convertTo, convertedAt: new Date() }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Convert proposal error:', error);
    res.status(500).json({ success: false, error: 'Failed to convert proposal' });
  }
};

export default {
  getWorkspace,
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  sendProposal,
  convertProposal
};
