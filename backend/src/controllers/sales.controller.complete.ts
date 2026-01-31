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

// Export all functions
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
  deleteOpportunity
};
