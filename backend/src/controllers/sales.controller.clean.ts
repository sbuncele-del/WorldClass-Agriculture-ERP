import { Request, Response } from 'express';
import pool from '../config/database';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Lead {
  lead_id: number;
  lead_number: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  source?: string;
  industry?: string;
  lead_value?: number;
  probability?: number;
  status: string;
  assigned_to?: string;
  notes?: string;
  next_follow_up?: Date;
  created_at: Date;
  updated_at: Date;
}

interface Opportunity {
  opportunity_id: number;
  opportunity_number: string;
  opportunity_name: string;
  customer_id?: number;
  value: number;
  probability: number;
  expected_close_date?: Date;
  stage: string;
  source?: string;
  assigned_to?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface Quotation {
  quotation_id: number;
  quotation_number: string;
  customer_id: number;
  quotation_date: Date;
  valid_until: Date;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  terms?: string;
  notes?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface Order {
  order_id: number;
  order_number: string;
  customer_id: number;
  order_date: Date;
  delivery_date?: Date;
  subtotal: number;
  vat_amount: number;
  total: number;
  payment_terms?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// LEADS MANAGEMENT
// ============================================================================

export const getLeads = async (req: Request, res: Response) => {
  try {
    const { search, status, source, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        lead_id,
        lead_number,
        company_name,
        contact_person,
        email,
        phone,
        mobile,
        source,
        industry,
        lead_value,
        probability,
        status,
        assigned_to,
        notes,
        next_follow_up,
        created_at,
        updated_at
      FROM sales.leads
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

    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    query += ` ORDER BY 
      CASE WHEN next_follow_up IS NOT NULL AND next_follow_up < CURRENT_DATE THEN 0 ELSE 1 END,
      probability DESC,
      created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) FROM sales.leads WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (company_name ILIKE $${countParamIndex} OR contact_person ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (source) {
      countQuery += ` AND source = $${countParamIndex}`;
      countParams.push(source);
      countParamIndex++;
    }
    if (assigned_to) {
      countQuery += ` AND assigned_to = $${countParamIndex}`;
      countParams.push(assigned_to);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM sales.leads WHERE lead_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Get activity history
    const activityResult = await pool.query(
      `SELECT * FROM sales.activity_log 
       WHERE entity_type = 'lead' AND entity_id = $1 
       ORDER BY activity_date DESC LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        activities: activityResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
};

export const createLead = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      company_name,
      contact_person,
      email,
      phone,
      mobile,
      source,
      industry,
      lead_value,
      probability,
      assigned_to,
      notes,
      next_follow_up
    } = req.body;

    // Generate lead number
    const leadNumberResult = await client.query(
      `SELECT CONCAT('LEAD-', TO_CHAR(CURRENT_DATE, 'YYYYMM'), '-', 
        LPAD((COUNT(*) + 1)::text, 4, '0')) as lead_number 
       FROM sales.leads 
       WHERE TO_CHAR(created_at, 'YYYYMM') = TO_CHAR(CURRENT_DATE, 'YYYYMM')`
    );
    const lead_number = leadNumberResult.rows[0].lead_number;

    const result = await client.query(
      `INSERT INTO sales.leads (
        lead_number, company_name, contact_person, email, phone, mobile,
        source, industry, lead_value, probability, assigned_to, notes, next_follow_up
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        lead_number, company_name, contact_person, email, phone, mobile,
        source, industry, lead_value, probability || 50, assigned_to, notes, next_follow_up
      ]
    );

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (entity_type, entity_id, activity_type, subject, created_by)
       VALUES ('lead', $1, 'created', 'Lead created', $2)`,
      [result.rows[0].lead_id, req.body.user_id || 'system']
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  } finally {
    client.release();
  }
};

export const updateLead = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.lead_id;
    delete updates.lead_number;
    delete updates.created_at;

    const fields = Object.keys(updates);
    const values = fields.map(field => updates[field]);
    
    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await client.query(
      `UPDATE sales.leads 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE lead_id = $1 
       RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (entity_type, entity_id, activity_type, subject, created_by)
       VALUES ('lead', $1, 'updated', 'Lead updated', $2)`,
      [id, req.body.user_id || 'system']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  } finally {
    client.release();
  }
};

export const convertLeadToOpportunity = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { opportunity_name, expected_close_date, customer_id } = req.body;

    // Get lead details
    const leadResult = await client.query(
      'SELECT * FROM sales.leads WHERE lead_id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    // Generate opportunity number
    const oppNumberResult = await client.query(
      `SELECT CONCAT('OPP-', TO_CHAR(CURRENT_DATE, 'YYYYMM'), '-', 
        LPAD((COUNT(*) + 1)::text, 4, '0')) as opportunity_number 
       FROM sales.opportunities 
       WHERE TO_CHAR(created_at, 'YYYYMM') = TO_CHAR(CURRENT_DATE, 'YYYYMM')`
    );
    const opportunity_number = oppNumberResult.rows[0].opportunity_number;

    // Create opportunity
    const oppResult = await client.query(
      `INSERT INTO sales.opportunities (
        opportunity_number, lead_id, customer_id, opportunity_name,
        contact_person, email, phone, value, probability,
        expected_close_date, source, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        opportunity_number, id, customer_id, opportunity_name || lead.company_name,
        lead.contact_person, lead.email, lead.phone, lead.lead_value, lead.probability,
        expected_close_date, lead.source, lead.assigned_to
      ]
    );

    // Update lead status
    await client.query(
      `UPDATE sales.leads 
       SET status = 'converted', 
           converted_to_opportunity_id = $1, 
           converted_at = CURRENT_TIMESTAMP 
       WHERE lead_id = $2`,
      [oppResult.rows[0].opportunity_id, id]
    );

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (entity_type, entity_id, activity_type, subject, created_by)
       VALUES ('lead', $1, 'converted', 'Converted to opportunity', $2)`,
      [id, req.body.user_id || 'system']
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Lead converted to opportunity successfully',
      data: oppResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error converting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to convert lead' });
  } finally {
    client.release();
  }
};

// ============================================================================
// OPPORTUNITIES MANAGEMENT
// ============================================================================

export const getOpportunities = async (req: Request, res: Response) => {
  try {
    const { search, stage, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.opportunity_id,
        o.opportunity_number,
        o.opportunity_name,
        o.value,
        o.probability,
        o.expected_close_date,
        o.stage,
        o.source,
        o.assigned_to,
        o.notes,
        o.created_at,
        o.updated_at,
        c.company_name as customer_name,
        c.customer_id
      FROM sales.opportunities o
      LEFT JOIN sales.customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (o.opportunity_name ILIKE $${paramCount} OR c.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (stage) {
      query += ` AND o.stage = $${paramCount}`;
      params.push(stage);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND o.assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    query += ` ORDER BY o.expected_close_date ASC, o.probability DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) FROM sales.opportunities o 
                      LEFT JOIN sales.customers c ON o.customer_id = c.customer_id 
                      WHERE 1=1`;
    const countParams: any[] = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (o.opportunity_name ILIKE $${countParamIndex} OR c.company_name ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    if (stage) {
      countQuery += ` AND o.stage = $${countParamIndex}`;
      countParams.push(stage);
      countParamIndex++;
    }
    if (assigned_to) {
      countQuery += ` AND o.assigned_to = $${countParamIndex}`;
      countParams.push(assigned_to);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch opportunities' });
  }
};

// Continue with remaining functions...
// I'll create a Part 2 file for the rest

export default {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLeadToOpportunity,
  getOpportunities
};
