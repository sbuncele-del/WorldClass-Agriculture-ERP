/**
 * Sales Live Controller V2
 * Tenant-hardened API for live sales/POS operations
 * 
 * Features:
 * - Customer management
 * - Lead management
 * - Real-time sales data
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';

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
// CUSTOMERS
// ============================================================================

/**
 * Get all customers
 */
export const getCustomers = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        customer_id,
        company_name,
        contact_person,
        email,
        phone,
        vat_number,
        customer_type,
        source,
        status,
        created_at,
        updated_at
      FROM sales.customers
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY company_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sales.customers WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        customers: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM sales.customers WHERE customer_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
};

/**
 * Create customer
 */
export const createCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      companyName,
      contactPerson,
      email,
      phone,
      vatNumber,
      customerType,
      source
    } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, error: 'Company name is required' });
    }

    const result = await pool.query(
      `INSERT INTO sales.customers (
        tenant_id,
        company_name, 
        contact_person, 
        email, 
        phone, 
        vat_number, 
        customer_type,
        source,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9) 
      RETURNING *`,
      [tenantId, companyName, contactPerson, email, phone, vatNumber, 
       customerType || 'standard', source || 'manual', userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

/**
 * Update customer
 */
export const updateCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      vatNumber,
      customerType,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE sales.customers 
       SET company_name = COALESCE($1, company_name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           vat_number = COALESCE($5, vat_number),
           customer_type = COALESCE($6, customer_type),
           status = COALESCE($7, status),
           updated_by = $8,
           updated_at = NOW()
       WHERE customer_id = $9 AND tenant_id = $10
       RETURNING *`,
      [companyName, contactPerson, email, phone, vatNumber, customerType, status, userId, id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM sales.customers WHERE customer_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer deleted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
};

// ============================================================================
// LEADS
// ============================================================================

/**
 * Get all leads
 */
export const getLeads = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { search, status, source, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        lead_id,
        company_name,
        contact_person,
        email,
        phone,
        source,
        status,
        assigned_to,
        estimated_value,
        notes,
        created_at,
        updated_at
      FROM sales.leads
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (company_name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (source) {
      query += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sales.leads WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        leads: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get leads error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
};

/**
 * Get lead by ID
 */
export const getLeadById = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
};

/**
 * Create lead
 */
export const createLead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      companyName,
      contactPerson,
      email,
      phone,
      source,
      assignedTo,
      estimatedValue,
      notes
    } = req.body;

    if (!companyName && !contactPerson) {
      return res.status(400).json({ success: false, error: 'Company name or contact person is required' });
    }

    const result = await pool.query(
      `INSERT INTO sales.leads (
        tenant_id,
        company_name,
        contact_person,
        email,
        phone,
        source,
        status,
        assigned_to,
        estimated_value,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, $8, $9, $10)
      RETURNING *`,
      [tenantId, companyName, contactPerson, email, phone, source || 'manual', 
       assignedTo, estimatedValue, notes, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
};

/**
 * Update lead
 */
export const updateLead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      source,
      status,
      assignedTo,
      estimatedValue,
      notes
    } = req.body;

    const result = await pool.query(
      `UPDATE sales.leads 
       SET company_name = COALESCE($1, company_name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           source = COALESCE($5, source),
           status = COALESCE($6, status),
           assigned_to = COALESCE($7, assigned_to),
           estimated_value = COALESCE($8, estimated_value),
           notes = COALESCE($9, notes),
           updated_by = $10,
           updated_at = NOW()
       WHERE lead_id = $11 AND tenant_id = $12
       RETURNING *`,
      [companyName, contactPerson, email, phone, source, status, 
       assignedTo, estimatedValue, notes, userId, id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
};

/**
 * Convert lead to customer
 */
export const convertLeadToCustomer = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get lead
      const leadResult = await client.query(
        `SELECT * FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );

      if (leadResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      const lead = leadResult.rows[0];

      // Create customer
      const customerResult = await client.query(
        `INSERT INTO sales.customers (
          tenant_id,
          company_name,
          contact_person,
          email,
          phone,
          source,
          status,
          created_from_lead,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
        RETURNING *`,
        [tenantId, lead.company_name, lead.contact_person, lead.email, 
         lead.phone, lead.source, id, userId]
      );

      // Update lead status
      await client.query(
        `UPDATE sales.leads 
         SET status = 'converted', 
             converted_customer_id = $1,
             converted_at = NOW(),
             updated_by = $2
         WHERE lead_id = $3`,
        [customerResult.rows[0].customer_id, userId, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          customer: customerResult.rows[0],
          message: 'Lead converted to customer'
        }
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Convert lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to convert lead' });
  }
};

/**
 * Delete lead
 */
export const deleteLead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM sales.leads WHERE lead_id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, message: 'Lead deleted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
};

// ============================================================================
// SALES METRICS
// ============================================================================

/**
 * Get live sales summary
 */
export const getSalesSummary = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { startDate, endDate } = req.query;

    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(DISTINCT customer_id) as unique_customers
       FROM sales.orders
       WHERE tenant_id = $1
         AND order_date >= $2
         AND order_date <= $3
         AND status NOT IN ('cancelled', 'refunded')`,
      [tenantId, start, end]
    );

    res.json({
      success: true,
      data: {
        period: { start, end },
        ...result.rows[0]
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get sales summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales summary' });
  }
};

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLeadToCustomer,
  deleteLead,
  getSalesSummary
};
