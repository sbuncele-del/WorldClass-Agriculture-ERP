import { Request, Response } from 'express';
import pool from '../config/database';

// ============================================================================
// SUPPLIERS MANAGEMENT
// ============================================================================

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { search, status, supplier_type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        supplier_id,
        supplier_code,
        company_name,
        contact_person,
        email,
        phone,
        mobile,
        website,
        vat_number,
        payment_terms,
        credit_limit,
        supplier_type,
        industry,
        rating,
        status,
        assigned_to,
        created_at,
        updated_at
      FROM purchasing.suppliers
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (company_name ILIKE $${paramCount} OR supplier_code ILIKE $${paramCount} OR contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (supplier_type) {
      query += ` AND supplier_type = $${paramCount}`;
      params.push(supplier_type);
      paramCount++;
    }

    query += ` ORDER BY company_name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM purchasing.suppliers WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (company_name ILIKE $${countParamCount} OR supplier_code ILIKE $${countParamCount} OR contact_person ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (supplier_type) {
      countQuery += ` AND supplier_type = $${countParamCount}`;
      countParams.push(supplier_type);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      suppliers: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM purchasing.suppliers WHERE supplier_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier: result.rows[0] });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      company_name,
      contact_person,
      email,
      phone,
      mobile,
      website,
      vat_number,
      tax_id,
      billing_address,
      shipping_address,
      payment_terms,
      credit_limit,
      currency_code,
      bank_name,
      bank_account_number,
      bank_branch_code,
      supplier_type,
      industry,
      rating,
      notes,
      assigned_to
    } = req.body;

    if (!company_name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Generate supplier_code: SUP-0001
    const countResult = await client.query(
      'SELECT COUNT(*) FROM purchasing.suppliers'
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const supplier_code = `SUP-${String(nextNum).padStart(4, '0')}`;

    const result = await client.query(
      `INSERT INTO purchasing.suppliers (
        supplier_code, company_name, contact_person, email, phone, mobile,
        website, vat_number, tax_id, billing_address, shipping_address,
        payment_terms, credit_limit, currency_code, bank_name, 
        bank_account_number, bank_branch_code, supplier_type, industry,
        rating, status, notes, assigned_to, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21, $22, $23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        supplier_code, company_name, contact_person, email, phone, mobile,
        website, vat_number, tax_id, billing_address, shipping_address,
        payment_terms || 30, credit_limit || 0, currency_code || 'ZAR',
        bank_name, bank_account_number, bank_branch_code, supplier_type,
        industry, rating, 'active', notes, assigned_to
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  } finally {
    client.release();
  }
};

// Continue with more functions...
export default {
  getSuppliers,
  getSupplierById,
  createSupplier
};
