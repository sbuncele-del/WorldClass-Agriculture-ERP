import { Request, Response } from 'express';
import pool from '../config/database';

// ============================================================================
// CUSTOMER MANAGEMENT - REAL DATABASE QUERIES
// ============================================================================

/**
 * GET /api/sales/customers
 * Fetch all customers from sales.customers table
 */
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      status, 
      limit = 50, 
      offset = 0 
    } = req.query;

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
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY company_name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) FROM sales.customers WHERE 1=1');
    
    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: error.message 
    });
  }
};

/**
 * GET /api/sales/customers/:id
 * Get a single customer by ID
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.customers WHERE customer_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer',
      details: error.message 
    });
  }
};

/**
 * POST /api/sales/customers
 * Create a new customer
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      vat_number,
      customer_type,
      source,
      created_from_document
    } = req.body;

    // Validate required fields
    if (!company_name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const result = await pool.query(
      `INSERT INTO sales.customers (
        company_name, 
        contact_person, 
        email, 
        phone, 
        vat_number, 
        customer_type,
        source,
        created_from_document,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') 
      RETURNING *`,
      [company_name, contact_person, email, phone, vat_number, customer_type || 'logistics_broker', source || 'manual', created_from_document]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ 
      error: 'Failed to create customer',
      details: error.message 
    });
  }
};

/**
 * PUT /api/sales/customers/:id
 * Update an existing customer
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      contact_person,
      email,
      phone,
      vat_number,
      customer_type,
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
           updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $8
       RETURNING *`,
      [company_name, contact_person, email, phone, vat_number, customer_type, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    res.status(500).json({ 
      error: 'Failed to update customer',
      details: error.message 
    });
  }
};

/**
 * DELETE /api/sales/customers/:id
 * Delete a customer
 */
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sales.customers WHERE customer_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      message: 'Customer deleted successfully',
      customer: result.rows[0] 
    });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ 
      error: 'Failed to delete customer',
      details: error.message 
    });
  }
};

// ============================================================================
// LEAD MANAGEMENT - REAL DATABASE QUERIES
// ============================================================================

/**
 * GET /api/sales/leads
 * Fetch all leads
 */
export const getLeads = async (req: Request, res: Response) => {
  try {
    const { 
      search, 
      status, 
      source,
      limit = 50, 
      offset = 0 
    } = req.query;

    // For now, return customers as leads (will create leads table later)
    let query = `
      SELECT 
        customer_id as id,
        company_name as lead_name,
        company_name,
        contact_person,
        email as contact,
        phone,
        source,
        status,
        customer_type,
        created_at
      FROM sales.customers
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      leads: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      details: error.message 
    });
  }
};

/**
 * POST /api/sales/leads
 * Create a new lead (as customer)
 */
export const createLead = async (req: Request, res: Response) => {
  try {
    const {
      lead_name,
      company,
      contact_person,
      contact,
      phone,
      source,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO sales.customers (
        company_name, 
        contact_person, 
        email, 
        phone, 
        source,
        status,
        customer_type
      ) VALUES ($1, $2, $3, $4, $5, $6, 'lead') 
      RETURNING *`,
      [company || lead_name, contact_person, contact, phone, source || 'manual', status || 'new']
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating lead:', error);
    res.status(500).json({ 
      error: 'Failed to create lead',
      details: error.message 
    });
  }
};
