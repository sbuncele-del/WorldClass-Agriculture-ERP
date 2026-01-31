import { Request, Response } from 'express';
import pool from '../config/database';

// ============================================================================
// INTERFACES - Match exact database schema
// ============================================================================

interface Lead {
  lead_id: number;
  lead_number: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  mobile?: string;
  source: string;
  industry?: string;
  lead_value?: number;
  probability: number;
  status: string;
  assigned_to?: string;
  notes?: string;
  next_follow_up?: Date;
  converted_to_opportunity_id?: number;
  converted_at?: Date;
  created_at: Date;
  updated_at?: Date;
}

interface Opportunity {
  opportunity_id: number;
  opportunity_number: string;
  lead_id?: number;
  customer_id?: number;
  opportunity_name: string;
  contact_person: string;
  email: string;
  phone: string;
  value: number;
  stage: string;
  probability: number;
  expected_close_date: Date;
  source?: string;
  assigned_to?: string;
  status: string;
  notes?: string;
  lost_reason?: string;
  converted_to_quotation_id?: number;
  closed_at?: Date;
  created_at: Date;
  updated_at?: Date;
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
        converted_to_opportunity_id,
        converted_at,
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

    query += ` ORDER BY probability DESC, created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) FROM sales.leads WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (company_name ILIKE $${countParamCount} OR contact_person ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (source) {
      countQuery += ` AND source = $${countParamCount}`;
      countParams.push(source);
      countParamCount++;
    }

    if (assigned_to) {
      countQuery += ` AND assigned_to = $${countParamCount}`;
      countParams.push(assigned_to);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      leads: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
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
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get activity log
    const activityResult = await pool.query(
      `SELECT * FROM sales.activity_log 
       WHERE entity_type = 'lead' AND entity_id = $1 
       ORDER BY activity_date DESC LIMIT 20`,
      [id]
    );

    res.json({
      lead: result.rows[0],
      activities: activityResult.rows
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
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

    // Validate required fields
    if (!company_name || !contact_person) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Company name and contact person are required' });
    }

    // Generate lead_number: LEAD-YYYYMM-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM sales.leads 
       WHERE lead_number LIKE $1`,
      [`LEAD-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const lead_number = `LEAD-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Insert lead
    const result = await client.query(
      `INSERT INTO sales.leads (
        lead_number, company_name, contact_person, email, phone, mobile,
        source, industry, lead_value, probability, status, assigned_to, 
        notes, next_follow_up, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        lead_number, company_name, contact_person, email, phone, mobile,
        source || 'website', industry, lead_value, probability || 50, 
        'new', assigned_to, notes, next_follow_up
      ]
    );

    const lead = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description, 
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'lead', lead.lead_id, 'created', 
        'Lead Created',
        `Lead ${lead_number} created for ${company_name}`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  } finally {
    client.release();
  }
};

export const updateLead = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
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
      status,
      assigned_to,
      notes,
      next_follow_up
    } = req.body;

    const result = await client.query(
      `UPDATE sales.leads SET
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        mobile = COALESCE($5, mobile),
        source = COALESCE($6, source),
        industry = COALESCE($7, industry),
        lead_value = COALESCE($8, lead_value),
        probability = COALESCE($9, probability),
        status = COALESCE($10, status),
        assigned_to = COALESCE($11, assigned_to),
        notes = COALESCE($12, notes),
        next_follow_up = COALESCE($13, next_follow_up),
        updated_at = CURRENT_TIMESTAMP
      WHERE lead_id = $14
      RETURNING *`,
      [
        company_name, contact_person, email, phone, mobile, source,
        industry, lead_value, probability, status, assigned_to, 
        notes, next_follow_up, id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'lead', lead.lead_id, 'updated',
        'Lead Updated',
        `Lead ${lead.lead_number} updated`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  } finally {
    client.release();
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if converted
    const checkResult = await client.query(
      'SELECT converted_to_opportunity_id FROM sales.leads WHERE lead_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (checkResult.rows[0].converted_to_opportunity_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete converted lead. Consider archiving instead.' 
      });
    }

    // Delete lead
    await client.query('DELETE FROM sales.leads WHERE lead_id = $1', [id]);

    // Delete activity log
    await client.query(
      `DELETE FROM sales.activity_log WHERE entity_type = 'lead' AND entity_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  } finally {
    client.release();
  }
};

export const convertLeadToOpportunity = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { opportunity_name, stage, expected_close_date } = req.body;

    // Get lead
    const leadResult = await client.query(
      'SELECT * FROM sales.leads WHERE lead_id = $1',
      [id]
    );

    if (leadResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leadResult.rows[0];

    if (lead.converted_to_opportunity_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Lead already converted to opportunity' });
    }

    // Generate opportunity_number: OPP-YYYYMM-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM sales.opportunities 
       WHERE opportunity_number LIKE $1`,
      [`OPP-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const opportunity_number = `OPP-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Create opportunity
    const oppResult = await client.query(
      `INSERT INTO sales.opportunities (
        opportunity_number, lead_id, opportunity_name, contact_person,
        email, phone, value, stage, probability, expected_close_date,
        source, assigned_to, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        opportunity_number, lead.lead_id,
        opportunity_name || `${lead.company_name} - Opportunity`,
        lead.contact_person, lead.email, lead.phone,
        lead.lead_value, stage || 'qualification',
        lead.probability, expected_close_date,
        lead.source, lead.assigned_to, 'open', lead.notes
      ]
    );

    const opportunity = oppResult.rows[0];

    // Update lead
    await client.query(
      `UPDATE sales.leads SET
        status = 'converted',
        converted_to_opportunity_id = $1,
        converted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE lead_id = $2`,
      [opportunity.opportunity_id, id]
    );

    // Log activities
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES 
      ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6),
      ($7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12)`,
      [
        'lead', lead.lead_id, 'converted',
        'Lead Converted',
        `Lead ${lead.lead_number} converted to opportunity ${opportunity_number}`,
        req.body.user_id || 'system',
        'opportunity', opportunity.opportunity_id, 'created',
        'Opportunity Created',
        `Opportunity ${opportunity_number} created from lead ${lead.lead_number}`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Lead converted to opportunity successfully',
      opportunity
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error converting lead:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  } finally {
    client.release();
  }
};

// ============================================================================
// OPPORTUNITIES MANAGEMENT
// ============================================================================

export const getOpportunities = async (req: Request, res: Response) => {
  try {
    const { search, status, stage, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.opportunity_id,
        o.opportunity_number,
        o.lead_id,
        o.customer_id,
        o.opportunity_name,
        o.contact_person,
        o.email,
        o.phone,
        o.value,
        o.stage,
        o.probability,
        o.expected_close_date,
        o.source,
        o.assigned_to,
        o.status,
        o.notes,
        o.lost_reason,
        o.converted_to_quotation_id,
        o.closed_at,
        o.created_at,
        o.updated_at,
        c.company_name as customer_name
      FROM sales.opportunities o
      LEFT JOIN sales.customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (o.opportunity_name ILIKE $${paramCount} OR c.company_name ILIKE $${paramCount} OR o.contact_person ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
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
    let countQuery = 'SELECT COUNT(*) FROM sales.opportunities o LEFT JOIN sales.customers c ON o.customer_id = c.customer_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (o.opportunity_name ILIKE $${countParamCount} OR c.company_name ILIKE $${countParamCount} OR o.contact_person ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND o.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (stage) {
      countQuery += ` AND o.stage = $${countParamCount}`;
      countParams.push(stage);
      countParamCount++;
    }

    if (assigned_to) {
      countQuery += ` AND o.assigned_to = $${countParamCount}`;
      countParams.push(assigned_to);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      opportunities: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
};

export const getOpportunityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, c.company_name as customer_name, l.lead_number, l.company_name as lead_company
       FROM sales.opportunities o
       LEFT JOIN sales.customers c ON o.customer_id = c.customer_id
       LEFT JOIN sales.leads l ON o.lead_id = l.lead_id
       WHERE o.opportunity_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Get activity log
    const activityResult = await pool.query(
      `SELECT * FROM sales.activity_log 
       WHERE entity_type = 'opportunity' AND entity_id = $1 
       ORDER BY activity_date DESC LIMIT 20`,
      [id]
    );

    res.json({
      opportunity: result.rows[0],
      activities: activityResult.rows
    });
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
};

export const createOpportunity = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_id,
      opportunity_name,
      contact_person,
      email,
      phone,
      value,
      stage,
      probability,
      expected_close_date,
      source,
      assigned_to,
      notes
    } = req.body;

    if (!opportunity_name || !contact_person) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Opportunity name and contact person are required' });
    }

    // Generate opportunity_number
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM sales.opportunities 
       WHERE opportunity_number LIKE $1`,
      [`OPP-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const opportunity_number = `OPP-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const result = await client.query(
      `INSERT INTO sales.opportunities (
        opportunity_number, customer_id, opportunity_name, contact_person,
        email, phone, value, stage, probability, expected_close_date,
        source, assigned_to, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        opportunity_number, customer_id, opportunity_name, contact_person,
        email, phone, value, stage || 'qualification', probability || 50,
        expected_close_date, source, assigned_to, 'open', notes
      ]
    );

    const opportunity = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'opportunity', opportunity.opportunity_id, 'created',
        'Opportunity Created',
        `Opportunity ${opportunity_number} created`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Opportunity created successfully',
      opportunity
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  } finally {
    client.release();
  }
};

export const updateOpportunity = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      opportunity_name,
      contact_person,
      email,
      phone,
      value,
      stage,
      probability,
      expected_close_date,
      status,
      assigned_to,
      notes,
      lost_reason
    } = req.body;

    const result = await client.query(
      `UPDATE sales.opportunities SET
        opportunity_name = COALESCE($1, opportunity_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        value = COALESCE($5, value),
        stage = COALESCE($6, stage),
        probability = COALESCE($7, probability),
        expected_close_date = COALESCE($8, expected_close_date),
        status = COALESCE($9, status),
        assigned_to = COALESCE($10, assigned_to),
        notes = COALESCE($11, notes),
        lost_reason = COALESCE($12, lost_reason),
        closed_at = CASE WHEN $9 IN ('won', 'lost') THEN CURRENT_TIMESTAMP ELSE closed_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE opportunity_id = $13
      RETURNING *`,
      [
        opportunity_name, contact_person, email, phone, value, stage,
        probability, expected_close_date, status, assigned_to, notes,
        lost_reason, id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    const opportunity = result.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'opportunity', opportunity.opportunity_id, 'updated',
        'Opportunity Updated',
        `Opportunity ${opportunity.opportunity_number} updated`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Opportunity updated successfully',
      opportunity
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  } finally {
    client.release();
  }
};

export const deleteOpportunity = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if converted
    const checkResult = await client.query(
      'SELECT converted_to_quotation_id FROM sales.opportunities WHERE opportunity_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    if (checkResult.rows[0].converted_to_quotation_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete converted opportunity. Consider archiving instead.' 
      });
    }

    await client.query('DELETE FROM sales.opportunities WHERE opportunity_id = $1', [id]);

    await client.query(
      `DELETE FROM sales.activity_log WHERE entity_type = 'opportunity' AND entity_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  } finally {
    client.release();
  }
};

// ============================================================================
// CUSTOMERS MANAGEMENT
// ============================================================================

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search, status, customer_type, assigned_to, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        customer_id,
        customer_code,
        customer_name as company_name,
        customer_name as contact_person,
        email,
        phone,
        phone as mobile,
        vat_number,
        'STANDARD' as customer_type,
        is_active,
        is_active as status,
        address_line1 || ' ' || COALESCE(address_line2, '') as billing_address,
        address_line1 || ' ' || COALESCE(address_line2, '') as shipping_address,
        payment_terms,
        credit_limit,
        vat_number as tax_id,
        NULL as industry,
        NULL as website,
        NULL as notes,
        NULL as assigned_to,
        created_at,
        updated_at
      FROM customers
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

    if (customer_type) {
      query += ` AND customer_type = $${paramCount}`;
      params.push(customer_type);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    query += ` ORDER BY company_name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM sales.customers WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (company_name ILIKE $${countParamCount} OR contact_person ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (customer_type) {
      countQuery += ` AND customer_type = $${countParamCount}`;
      countParams.push(customer_type);
      countParamCount++;
    }

    if (assigned_to) {
      countQuery += ` AND assigned_to = $${countParamCount}`;
      countParams.push(assigned_to);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

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

    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      company_name,
      contact_person,
      email,
      phone,
      mobile,
      vat_number,
      tax_id,
      customer_type,
      billing_address,
      shipping_address,
      payment_terms,
      credit_limit,
      industry,
      website,
      notes,
      assigned_to
    } = req.body;

    if (!company_name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Company name is required' });
    }

    const result = await client.query(
      `INSERT INTO sales.customers (
        company_name, contact_person, email, phone, mobile,
        vat_number, tax_id, customer_type, billing_address, shipping_address,
        payment_terms, credit_limit, industry, website, notes, assigned_to,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        company_name, contact_person, email, phone, mobile,
        vat_number, tax_id, customer_type || 'business', billing_address, shipping_address,
        payment_terms || 30, credit_limit || 0, industry, website, notes, assigned_to
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Customer created successfully',
      customer: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  } finally {
    client.release();
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      company_name,
      contact_person,
      email,
      phone,
      mobile,
      vat_number,
      payment_terms,
      credit_limit,
      status,
      notes,
      assigned_to
    } = req.body;

    const result = await client.query(
      `UPDATE sales.customers SET
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        mobile = COALESCE($5, mobile),
        vat_number = COALESCE($6, vat_number),
        payment_terms = COALESCE($7, payment_terms),
        credit_limit = COALESCE($8, credit_limit),
        status = COALESCE($9, status),
        notes = COALESCE($10, notes),
        assigned_to = COALESCE($11, assigned_to),
        updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = $12
      RETURNING *`,
      [
        company_name, contact_person, email, phone, mobile,
        vat_number, payment_terms, credit_limit, status, notes, assigned_to, id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Customer updated successfully',
      customer: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  } finally {
    client.release();
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check for related records
    const ordersCheck = await client.query(
      'SELECT COUNT(*) FROM sales.orders WHERE customer_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing orders. Mark as inactive instead.' 
      });
    }

    await client.query('DELETE FROM sales.customers WHERE customer_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  } finally {
    client.release();
  }
};

// ============================================================================
// QUOTATIONS MANAGEMENT
// ============================================================================

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const { search, status, customer_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        q.quotation_id,
        q.quotation_number,
        q.opportunity_id,
        q.customer_id,
        c.company_name as customer_name,
        q.quotation_date,
        q.valid_until,
        q.subtotal,
        q.vat_amount,
        q.total,
        q.status,
        q.sent_at,
        q.accepted_at,
        q.converted_to_order_id,
        q.created_at
      FROM sales.quotations q
      LEFT JOIN sales.customers c ON q.customer_id = c.customer_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (q.quotation_number ILIKE $${paramCount} OR c.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND q.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND q.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    query += ` ORDER BY q.quotation_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM sales.quotations q LEFT JOIN sales.customers c ON q.customer_id = c.customer_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (q.quotation_number ILIKE $${countParamCount} OR c.company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND q.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (customer_id) {
      countQuery += ` AND q.customer_id = $${countParamCount}`;
      countParams.push(customer_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      quotations: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quotResult = await pool.query(
      `SELECT q.*, c.company_name as customer_name, c.contact_person, c.email, c.phone
       FROM sales.quotations q
       LEFT JOIN sales.customers c ON q.customer_id = c.customer_id
       WHERE q.quotation_id = $1`,
      [id]
    );

    if (quotResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM sales.quotation_line_items WHERE quotation_id = $1 ORDER BY line_order',
      [id]
    );

    res.json({
      quotation: quotResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      opportunity_id,
      customer_id,
      quotation_date,
      valid_until,
      contact_person,
      email,
      phone,
      terms,
      notes,
      line_items
    } = req.body;

    if (!customer_id || !line_items || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Customer and line items are required' });
    }

    // Generate quotation_number: QUOT-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM sales.quotations 
       WHERE quotation_number LIKE $1`,
      [`QUOT-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const quotation_number = `QUOT-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let total_vat = 0;

    for (const line of line_items) {
      const line_total = line.quantity * line.unit_price;
      const discount_amount = line.discount_percentage 
        ? line_total * (line.discount_percentage / 100)
        : line.discount_amount || 0;
      const taxable_amount = line_total - discount_amount;
      const vat_amount = taxable_amount * ((line.vat_rate || 15) / 100);
      
      subtotal += taxable_amount;
      total_vat += vat_amount;
    }

    const total = subtotal + total_vat;

    const quotResult = await client.query(
      `INSERT INTO sales.quotations (
        quotation_number, opportunity_id, customer_id, quotation_date,
        valid_until, contact_person, email, phone, subtotal, vat_rate,
        vat_amount, total, terms, notes, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'draft',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        quotation_number, opportunity_id, customer_id,
        quotation_date || new Date(), valid_until,
        contact_person, email, phone, subtotal, 15.00, total_vat, total,
        terms, notes
      ]
    );

    const quotation_id = quotResult.rows[0].quotation_id;

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const line = line_items[i];
      const line_total = line.quantity * line.unit_price;
      const discount_amount = line.discount_percentage 
        ? line_total * (line.discount_percentage / 100)
        : line.discount_amount || 0;
      const taxable_amount = line_total - discount_amount;

      await client.query(
        `INSERT INTO sales.quotation_line_items (
          quotation_id, item_code, description, quantity, unit_price,
          discount_percentage, discount_amount, vat_rate, line_total, line_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          quotation_id, line.item_code, line.description, line.quantity,
          line.unit_price, line.discount_percentage || 0, discount_amount,
          line.vat_rate || 15, taxable_amount, i + 1
        ]
      );
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'quotation', quotation_id, 'created',
        'Quotation Created',
        `Quotation ${quotation_number} created`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Quotation created successfully',
      quotation: quotResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  } finally {
    client.release();
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, valid_until, terms, notes } = req.body;

    const result = await client.query(
      `UPDATE sales.quotations SET
        status = COALESCE($1, status),
        valid_until = COALESCE($2, valid_until),
        terms = COALESCE($3, terms),
        notes = COALESCE($4, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE quotation_id = $5
      RETURNING *`,
      [status, valid_until, terms, notes, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quotation not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Quotation updated successfully',
      quotation: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating quotation:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  } finally {
    client.release();
  }
};

export const sendQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE sales.quotations SET
        status = 'sent',
        sent_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE quotation_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quotation not found' });
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'quotation', id, 'sent',
        'Quotation Sent',
        `Quotation ${result.rows[0].quotation_number} sent to customer`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    // TODO: Send email with PDF

    res.json({
      message: 'Quotation sent successfully',
      quotation: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending quotation:', error);
    res.status(500).json({ error: 'Failed to send quotation' });
  } finally {
    client.release();
  }
};

export const acceptQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get quotation
    const quotResult = await client.query(
      'SELECT * FROM sales.quotations WHERE quotation_id = $1',
      [id]
    );

    if (quotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = quotResult.rows[0];

    if (quotation.converted_to_order_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Quotation already converted to order' });
    }

    // Generate order_number: ORD-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM sales.orders 
       WHERE order_number LIKE $1`,
      [`ORD-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const order_number = `ORD-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO sales.orders (
        order_number, quotation_id, customer_id, order_date,
        contact_person, email, phone, subtotal, vat_rate, vat_amount,
        total, payment_terms, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, 'pending',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        order_number, quotation.quotation_id, quotation.customer_id,
        quotation.contact_person, quotation.email, quotation.phone,
        quotation.subtotal, quotation.vat_rate, quotation.vat_amount,
        quotation.total, quotation.payment_terms
      ]
    );

    const order_id = orderResult.rows[0].order_id;

    // Copy line items
    const linesResult = await client.query(
      'SELECT * FROM sales.quotation_line_items WHERE quotation_id = $1 ORDER BY line_order',
      [id]
    );

    for (const line of linesResult.rows) {
      await client.query(
        `INSERT INTO sales.order_line_items (
          order_id, item_code, description, quantity, unit_price,
          discount_percentage, discount_amount, vat_rate, line_total, line_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          order_id, line.item_code, line.description, line.quantity,
          line.unit_price, line.discount_percentage, line.discount_amount,
          line.vat_rate, line.line_total, line.line_order
        ]
      );
    }

    // Update quotation
    await client.query(
      `UPDATE sales.quotations SET
        status = 'accepted',
        accepted_at = CURRENT_TIMESTAMP,
        converted_to_order_id = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE quotation_id = $2`,
      [order_id, id]
    );

    // Update opportunity if linked
    if (quotation.opportunity_id) {
      await client.query(
        `UPDATE sales.opportunities SET
          status = 'won',
          converted_to_quotation_id = $1,
          closed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE opportunity_id = $2`,
        [quotation.quotation_id, quotation.opportunity_id]
      );
    }

    // Log activities
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES 
      ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6),
      ($7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $12)`,
      [
        'quotation', id, 'accepted',
        'Quotation Accepted',
        `Quotation ${quotation.quotation_number} accepted and converted to order ${order_number}`,
        req.body.user_id || 'system',
        'order', order_id, 'created',
        'Order Created',
        `Order ${order_number} created from quotation ${quotation.quotation_number}`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Quotation accepted and converted to order successfully',
      order: orderResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting quotation:', error);
    res.status(500).json({ error: 'Failed to accept quotation' });
  } finally {
    client.release();
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if converted
    const checkResult = await client.query(
      'SELECT converted_to_order_id FROM sales.quotations WHERE quotation_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (checkResult.rows[0].converted_to_order_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete converted quotation' 
      });
    }

    await client.query('DELETE FROM sales.quotations WHERE quotation_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting quotation:', error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  } finally {
    client.release();
  }
};

// ============================================================================
// ORDERS MANAGEMENT
// ============================================================================

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, customer_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.quotation_id,
        o.customer_id,
        c.company_name as customer_name,
        o.order_date,
        o.delivery_date,
        o.subtotal,
        o.vat_amount,
        o.total,
        o.status,
        o.confirmed_at,
        o.shipped_at,
        o.delivered_at,
        o.created_at
      FROM sales.orders o
      LEFT JOIN sales.customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (o.order_number ILIKE $${paramCount} OR c.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND o.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    query += ` ORDER BY o.order_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM sales.orders o LEFT JOIN sales.customers c ON o.customer_id = c.customer_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (o.order_number ILIKE $${countParamCount} OR c.company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND o.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (customer_id) {
      countQuery += ` AND o.customer_id = $${countParamCount}`;
      countParams.push(customer_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.*, c.company_name as customer_name, c.contact_person, c.email, c.phone
       FROM sales.orders o
       LEFT JOIN sales.customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM sales.order_line_items WHERE order_id = $1 ORDER BY line_order',
      [id]
    );

    res.json({
      order: orderResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const confirmOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE sales.orders SET
        status = 'confirmed',
        confirmed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'order', id, 'confirmed',
        'Order Confirmed',
        `Order ${result.rows[0].order_number} confirmed`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Order confirmed successfully',
      order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  } finally {
    client.release();
  }
};

export const shipOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE sales.orders SET
        status = 'shipped',
        shipped_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'order', id, 'shipped',
        'Order Shipped',
        `Order ${result.rows[0].order_number} shipped`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Order shipped successfully',
      order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error shipping order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  } finally {
    client.release();
  }
};

export const deliverOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE sales.orders SET
        status = 'delivered',
        delivered_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Log activity
    await client.query(
      `INSERT INTO sales.activity_log (
        entity_type, entity_id, activity_type, subject, description,
        activity_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
      [
        'order', id, 'delivered',
        'Order Delivered',
        `Order ${result.rows[0].order_number} delivered`,
        req.body.user_id || 'system'
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Order delivered successfully',
      order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error delivering order:', error);
    res.status(500).json({ error: 'Failed to deliver order' });
  } finally {
    client.release();
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await client.query(
      `UPDATE sales.orders SET
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2
      RETURNING *`,
      [cancellation_reason, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Order cancelled successfully',
      order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  } finally {
    client.release();
  }
};

// ============================================================================
// CREDIT NOTE CONTROLLERS
// ============================================================================

export const getCreditNotes = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        cn.*,
        c.company_name,
        c.contact_person,
        COUNT(cnl.line_id) as line_count
      FROM sales.credit_notes cn
      LEFT JOIN sales.customers c ON cn.customer_id = c.customer_id
      LEFT JOIN sales.credit_note_line_items cnl ON cn.credit_note_id = cnl.credit_note_id
      GROUP BY cn.credit_note_id, c.company_name, c.contact_person
      ORDER BY cn.credit_note_date DESC, cn.credit_note_number DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Error fetching credit notes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit notes',
      message: error.message
    });
  }
};

export const getCreditNoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        cn.*,
        c.company_name,
        c.contact_person,
        c.email,
        c.phone,
        json_agg(
          json_build_object(
            'line_id', cnl.line_id,
            'line_number', cnl.line_number,
            'item_code', cnl.item_code,
            'description', cnl.description,
            'quantity', cnl.quantity,
            'unit_price', cnl.unit_price,
            'vat_rate', cnl.vat_rate,
            'vat_amount', cnl.vat_amount,
            'line_total', cnl.line_total
          ) ORDER BY cnl.line_number
        ) as line_items
      FROM sales.credit_notes cn
      LEFT JOIN sales.customers c ON cn.customer_id = c.customer_id
      LEFT JOIN sales.credit_note_line_items cnl ON cn.credit_note_id = cnl.credit_note_id
      WHERE cn.credit_note_id = $1
      GROUP BY cn.credit_note_id, c.company_name, c.contact_person, c.email, c.phone
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Credit note not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching credit note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit note',
      message: error.message
    });
  }
};

export const createCreditNote = async (req: Request, res: Response) => {
  try {
    const {
      invoice_id,
      customer_id,
      credit_note_date,
      reason,
      reason_type,
      subtotal,
      vat_rate,
      vat_amount,
      total,
      status,
      notes,
      line_items
    } = req.body;

    // Generate credit note number
    const cnNumberResult = await pool.query(`
      SELECT 'CN-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
        LPAD((COALESCE(MAX(SUBSTRING(credit_note_number FROM 9)::INT), 0) + 1)::TEXT, 3, '0') as next_number
      FROM sales.credit_notes
      WHERE credit_note_number LIKE 'CN-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
    `);
    const credit_note_number = cnNumberResult.rows[0].next_number;

    // Insert credit note
    const result = await pool.query(`
      INSERT INTO sales.credit_notes (
        credit_note_number, invoice_id, customer_id, credit_note_date,
        reason, reason_type, subtotal, vat_rate, vat_amount, total, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [credit_note_number, invoice_id, customer_id, credit_note_date, reason, reason_type, subtotal, vat_rate, vat_amount, total, status || 'draft', notes]);

    const creditNoteId = result.rows[0].credit_note_id;

    // Insert line items if provided
    if (line_items && line_items.length > 0) {
      for (const item of line_items) {
        await pool.query(`
          INSERT INTO sales.credit_note_line_items (
            credit_note_id, line_number, item_code, description,
            quantity, unit_price, vat_rate, vat_amount, line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [creditNoteId, item.line_number, item.item_code, item.description, item.quantity, item.unit_price, item.vat_rate, item.vat_amount, item.line_total]);
      }
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Credit note created successfully'
    });
  } catch (error: any) {
    console.error('Error creating credit note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create credit note',
      message: error.message
    });
  }
};

export const updateCreditNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await pool.query(`
      UPDATE sales.credit_notes
      SET 
        reason = COALESCE($2, reason),
        reason_type = COALESCE($3, reason_type),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE credit_note_id = $1
      RETURNING *
    `, [id, updates.reason, updates.reason_type, updates.status, updates.notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Credit note not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Credit note updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating credit note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update credit note',
      message: error.message
    });
  }
};

export const deleteCreditNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM sales.credit_notes WHERE credit_note_id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Credit note not found'
      });
    }

    res.json({
      success: true,
      message: 'Credit note deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting credit note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete credit note',
      message: error.message
    });
  }
};

// ============================================================================
// RECEIPT CONTROLLERS (Invoice Payments)
// ============================================================================

export const getReceipts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        ip.*,
        si.invoice_number,
        c.company_name,
        c.contact_person
      FROM invoice_payments ip
      LEFT JOIN sales_invoices si ON ip.invoice_id = si.invoice_id
      LEFT JOIN sales.customers c ON si.customer_id = c.customer_id
      ORDER BY ip.payment_date DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts',
      message: error.message
    });
  }
};

export const getReceiptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ip.*,
        si.invoice_number,
        si.subtotal as invoice_subtotal,
        si.total_amount as invoice_total,
        c.company_name,
        c.contact_person,
        c.email
      FROM invoice_payments ip
      LEFT JOIN sales_invoices si ON ip.invoice_id = si.invoice_id
      LEFT JOIN sales.customers c ON si.customer_id = c.customer_id
      WHERE ip.payment_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt',
      message: error.message
    });
  }
};

export const createReceipt = async (req: Request, res: Response) => {
  try {
    const {
      invoice_id,
      payment_date,
      amount,
      payment_method,
      reference,
      notes,
      tenant_id
    } = req.body;

    const result = await pool.query(`
      INSERT INTO invoice_payments (
        invoice_id, payment_date, amount, payment_method, reference, notes, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [invoice_id, payment_date, amount, payment_method, reference, notes, tenant_id]);

    // Update invoice paid amount
    await pool.query(`
      UPDATE sales_invoices
      SET 
        amount_paid = amount_paid + $2,
        amount_due = total_amount - (amount_paid + $2),
        status = CASE 
          WHEN (amount_paid + $2) >= total_amount THEN 'PAID'
          WHEN (amount_paid + $2) > 0 THEN 'PARTIAL'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $1
    `, [invoice_id, amount]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Receipt created successfully'
    });
  } catch (error: any) {
    console.error('Error creating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create receipt',
      message: error.message
    });
  }
};

export const updateReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await pool.query(`
      UPDATE invoice_payments
      SET 
        payment_method = COALESCE($2, payment_method),
        reference = COALESCE($3, reference),
        notes = COALESCE($4, notes)
      WHERE payment_id = $1
      RETURNING *
    `, [id, updates.payment_method, updates.reference, updates.notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Receipt updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update receipt',
      message: error.message
    });
  }
};

export const deleteReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get receipt details before deleting
    const receiptResult = await pool.query(`
      SELECT invoice_id, amount FROM invoice_payments WHERE payment_id = $1
    `, [id]);

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    const { invoice_id, amount } = receiptResult.rows[0];

    // Delete receipt
    await pool.query(`DELETE FROM invoice_payments WHERE payment_id = $1`, [id]);

    // Update invoice amounts
    await pool.query(`
      UPDATE sales_invoices
      SET 
        amount_paid = amount_paid - $2,
        amount_due = total_amount - (amount_paid - $2),
        status = CASE 
          WHEN (amount_paid - $2) >= total_amount THEN 'PAID'
          WHEN (amount_paid - $2) > 0 THEN 'PARTIAL'
          ELSE 'SENT'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $1
    `, [invoice_id, amount]);

    res.json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete receipt',
      message: error.message
    });
  }
};

// ============================================================================
// COMMISSION CONTROLLERS
// ============================================================================

export const getCommissions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        si.invoice_number,
        o.order_number
      FROM sales.commissions c
      LEFT JOIN financial.invoices i ON c.invoice_id = i.invoice_id
      LEFT JOIN sales_invoices si ON si.invoice_id = i.invoice_id
      LEFT JOIN sales.orders o ON c.order_id = o.order_id
      ORDER BY c.commission_date DESC, c.commission_number DESC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commissions',
      message: error.message
    });
  }
};

export const getCommissionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        c.*,
        si.invoice_number,
        si.total_amount as invoice_total,
        o.order_number,
        o.total as order_total
      FROM sales.commissions c
      LEFT JOIN financial.invoices i ON c.invoice_id = i.invoice_id
      LEFT JOIN sales_invoices si ON si.invoice_id = i.invoice_id
      LEFT JOIN sales.orders o ON c.order_id = o.order_id
      WHERE c.commission_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Commission not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching commission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission',
      message: error.message
    });
  }
};

export const createCommission = async (req: Request, res: Response) => {
  try {
    const {
      salesperson_id,
      invoice_id,
      order_id,
      commission_date,
      base_amount,
      commission_rate,
      commission_amount,
      status,
      notes
    } = req.body;

    // Generate commission number
    const commNumberResult = await pool.query(`
      SELECT 'COMM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
        LPAD((COALESCE(MAX(SUBSTRING(commission_number FROM 11)::INT), 0) + 1)::TEXT, 3, '0') as next_number
      FROM sales.commissions
      WHERE commission_number LIKE 'COMM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
    `);
    const commission_number = commNumberResult.rows[0].next_number;

    const result = await pool.query(`
      INSERT INTO sales.commissions (
        commission_number, salesperson_id, invoice_id, order_id, commission_date,
        base_amount, commission_rate, commission_amount, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [commission_number, salesperson_id, invoice_id, order_id, commission_date, base_amount, commission_rate, commission_amount, status || 'pending', notes]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Commission created successfully'
    });
  } catch (error: any) {
    console.error('Error creating commission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create commission',
      message: error.message
    });
  }
};

export const updateCommission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await pool.query(`
      UPDATE sales.commissions
      SET 
        status = COALESCE($2, status),
        payment_date = COALESCE($3, payment_date),
        payment_reference = COALESCE($4, payment_reference),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE commission_id = $1
      RETURNING *
    `, [id, updates.status, updates.payment_date, updates.payment_reference, updates.notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Commission not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Commission updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating commission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update commission',
      message: error.message
    });
  }
};

export const deleteCommission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM sales.commissions WHERE commission_id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Commission not found'
      });
    }

    res.json({
      success: true,
      message: 'Commission deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting commission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete commission',
      message: error.message
    });
  }
};

// ============================================================================
// PRICING RULE CONTROLLERS
// ============================================================================

export const getPricingRules = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        pr.*,
        c.company_name,
        c.contact_person
      FROM sales.pricing_rules pr
      LEFT JOIN sales.customers c ON pr.customer_id = c.customer_id
      ORDER BY pr.priority ASC, pr.rule_name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error: any) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing rules',
      message: error.message
    });
  }
};

export const getPricingRuleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        pr.*,
        c.company_name,
        c.contact_person
      FROM sales.pricing_rules pr
      LEFT JOIN sales.customers c ON pr.customer_id = c.customer_id
      WHERE pr.pricing_rule_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing rule',
      message: error.message
    });
  }
};

export const createPricingRule = async (req: Request, res: Response) => {
  try {
    const {
      rule_name,
      rule_type,
      priority,
      active,
      start_date,
      end_date,
      customer_id,
      customer_category,
      product_code,
      product_category,
      min_quantity,
      min_order_value,
      pricing_method,
      fixed_price,
      discount_percentage,
      fixed_discount,
      notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO sales.pricing_rules (
        rule_name, rule_type, priority, active, start_date, end_date,
        customer_id, customer_category, product_code, product_category,
        min_quantity, min_order_value, pricing_method, fixed_price,
        discount_percentage, fixed_discount, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [rule_name, rule_type, priority || 100, active !== false, start_date, end_date, customer_id, customer_category, product_code, product_category, min_quantity, min_order_value, pricing_method, fixed_price, discount_percentage, fixed_discount, notes]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Pricing rule created successfully'
    });
  } catch (error: any) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pricing rule',
      message: error.message
    });
  }
};

export const updatePricingRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await pool.query(`
      UPDATE sales.pricing_rules
      SET 
        rule_name = COALESCE($2, rule_name),
        priority = COALESCE($3, priority),
        active = COALESCE($4, active),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        min_quantity = COALESCE($7, min_quantity),
        discount_percentage = COALESCE($8, discount_percentage),
        fixed_price = COALESCE($9, fixed_price),
        notes = COALESCE($10, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE pricing_rule_id = $1
      RETURNING *
    `, [id, updates.rule_name, updates.priority, updates.active, updates.start_date, updates.end_date, updates.min_quantity, updates.discount_percentage, updates.fixed_price, updates.notes]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Pricing rule updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pricing rule',
      message: error.message
    });
  }
};

export const deletePricingRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM sales.pricing_rules WHERE pricing_rule_id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pricing rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pricing rule',
      message: error.message
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Leads
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToOpportunity,
  // Opportunities
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  // Customers
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  // Quotations
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  deleteQuotation,
  // Orders
  getOrders,
  getOrderById,
  confirmOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
  // Credit Notes
  getCreditNotes,
  getCreditNoteById,
  createCreditNote,
  updateCreditNote,
  deleteCreditNote,
  // Receipts
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  // Commissions
  getCommissions,
  getCommissionById,
  createCommission,
  updateCommission,
  deleteCommission,
  // Pricing Rules
  getPricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const queries = [
      pool.query('SELECT COUNT(*) as total FROM sales.leads WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as total FROM sales.opportunities WHERE status = $1', ['open']),
      pool.query('SELECT COUNT(*) as total FROM sales.quotations WHERE status = $1', ['sent']),
      pool.query('SELECT COUNT(*) as total FROM sales.orders WHERE status = $1', ['confirmed']),
      pool.query('SELECT COUNT(*) as total FROM sales.customers'),
      pool.query('SELECT SUM(value) as total FROM sales.opportunities WHERE status = $1', ['open']),
      pool.query('SELECT SUM(total) as total FROM sales.orders WHERE status IN ($1, $2)', ['confirmed', 'shipped']),
      pool.query('SELECT COUNT(*) as total FROM sales.orders')
    ];

    const results = await Promise.all(queries);
    
    const totalOrders = parseInt(results[7].rows[0].total) || 0;
    const totalRevenue = parseFloat(results[6].rows[0].total) || 0;
    const totalCustomers = parseInt(results[4].rows[0].total) || 0;

    res.json({
      success: true,
      data: {
        current_period: {
          fiscal_year: new Date().getFullYear(),
          period_number: new Date().getMonth() + 1,
          period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          status: 'OPEN'
        },
        sales_summary: {
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          total_customers: totalCustomers,
          conversion_rate: 0,
          pending_quotations: parseInt(results[2].rows[0].total) || 0
        },
        pipeline: {
          activeLeads: parseInt(results[0].rows[0].total) || 0,
          openOpportunities: parseInt(results[1].rows[0].total) || 0,
          pipelineValue: parseFloat(results[5].rows[0].total) || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting sales dashboard:', error);
    res.json({
      success: true,
      data: {
        current_period: {
          fiscal_year: new Date().getFullYear(),
          period_number: new Date().getMonth() + 1,
          period_name: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          status: 'OPEN'
        },
        sales_summary: {
          total_revenue: 0,
          total_orders: 0,
          average_order_value: 0,
          total_customers: 0,
          conversion_rate: 0,
          pending_quotations: 0
        },
        pipeline: {
          activeLeads: 0,
          openOpportunities: 0,
          pipelineValue: 0
        }
      }
    });
  }
};
