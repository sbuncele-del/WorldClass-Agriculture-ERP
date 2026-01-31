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
        vat_number,
        payment_terms,
        credit_limit,
        supplier_type,
        status,
        created_at,
        updated_at
      FROM purchase.suppliers
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

    let countQuery = 'SELECT COUNT(*) FROM purchase.suppliers WHERE 1=1';
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
      'SELECT * FROM purchase.suppliers WHERE supplier_id = $1',
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
      'SELECT COUNT(*) FROM purchase.suppliers'
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const supplier_code = `SUP-${String(nextNum).padStart(4, '0')}`;

    const result = await client.query(
      `INSERT INTO purchase.suppliers (
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

export const updateSupplier = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      company_name,
      contact_person,
      email,
      phone,
      payment_terms,
      credit_limit,
      status,
      rating,
      notes
    } = req.body;

    const result = await client.query(
      `UPDATE purchase.suppliers SET
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        payment_terms = COALESCE($5, payment_terms),
        credit_limit = COALESCE($6, credit_limit),
        status = COALESCE($7, status),
        rating = COALESCE($8, rating),
        notes = COALESCE($9, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE supplier_id = $10
      RETURNING *`,
      [company_name, contact_person, email, phone, payment_terms, credit_limit, status, rating, notes, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Supplier updated successfully',
      supplier: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  } finally {
    client.release();
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check for related records
    const posCheck = await client.query(
      'SELECT COUNT(*) FROM purchase.purchase_orders WHERE supplier_id = $1',
      [id]
    );

    if (parseInt(posCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete supplier with existing purchase orders. Mark as inactive instead.' 
      });
    }

    await client.query('DELETE FROM purchase.suppliers WHERE supplier_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  } finally {
    client.release();
  }
};

// ============================================================================
// REQUISITIONS MANAGEMENT
// ============================================================================

export const getRequisitions = async (req: Request, res: Response) => {
  try {
    const { search, status, department, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        r.requisition_id,
        r.requisition_number,
        r.requisition_date,
        r.required_by_date,
        r.department,
        r.requested_by,
        r.status,
        r.total_amount,
        r.created_at
      FROM purchase.requisitions r
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (r.requisition_number ILIKE $${paramCount} OR r.requested_by ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (department) {
      query += ` AND r.department = $${paramCount}`;
      params.push(department);
      paramCount++;
    }

    query += ` ORDER BY r.requisition_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM purchase.requisitions r WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (r.requisition_number ILIKE $${countParamCount} OR r.requested_by ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND r.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (department) {
      countQuery += ` AND r.department = $${countParamCount}`;
      countParams.push(department);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      requisitions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    res.status(500).json({ error: 'Failed to fetch requisitions' });
  }
};

export const getRequisitionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reqResult = await pool.query(
      'SELECT * FROM purchase.requisitions WHERE requisition_id = $1',
      [id]
    );

    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Requisition not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM purchase.requisition_line_items WHERE requisition_id = $1 ORDER BY line_number',
      [id]
    );

    res.json({
      requisition: reqResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching requisition:', error);
    res.status(500).json({ error: 'Failed to fetch requisition' });
  }
};

export const createRequisition = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      requisition_date,
      required_by_date,
      department,
      requested_by,
      purpose,
      notes,
      line_items
    } = req.body;

    if (!line_items || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Line items are required' });
    }

    // Generate requisition_number: REQ-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM purchase.requisitions 
       WHERE requisition_number LIKE $1`,
      [`REQ-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const requisition_number = `REQ-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Calculate total
    let total_amount = 0;
    for (const line of line_items) {
      total_amount += (line.quantity || 0) * (line.estimated_unit_price || 0);
    }

    const reqResult = await client.query(
      `INSERT INTO purchase.requisitions (
        requisition_number, requisition_date, required_by_date,
        department, requested_by, purpose, total_amount, status,
        notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'draft', $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        requisition_number,
        requisition_date || new Date(),
        required_by_date,
        department,
        requested_by,
        purpose,
        total_amount,
        notes
      ]
    );

    const requisition_id = reqResult.rows[0].requisition_id;

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const line = line_items[i];
      await client.query(
        `INSERT INTO purchase.requisition_line_items (
          requisition_id, item_code, description, quantity,
          unit_of_measure, estimated_unit_price, line_total, line_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          requisition_id,
          line.item_code,
          line.description,
          line.quantity,
          line.unit_of_measure || 'EA',
          line.estimated_unit_price || 0,
          (line.quantity || 0) * (line.estimated_unit_price || 0),
          i + 1
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Requisition created successfully',
      requisition: reqResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating requisition:', error);
    res.status(500).json({ error: 'Failed to create requisition' });
  } finally {
    client.release();
  }
};

export const updateRequisition = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, notes, approved_by, rejected_by, rejection_reason } = req.body;

    const result = await client.query(
      `UPDATE purchase.requisitions SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        approved_by = COALESCE($3, approved_by),
        approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        rejected_by = COALESCE($4, rejected_by),
        rejected_at = CASE WHEN $1 = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END,
        rejection_reason = COALESCE($5, rejection_reason),
        updated_at = CURRENT_TIMESTAMP
      WHERE requisition_id = $6
      RETURNING *`,
      [status, notes, approved_by, rejected_by, rejection_reason, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisition not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Requisition updated successfully',
      requisition: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating requisition:', error);
    res.status(500).json({ error: 'Failed to update requisition' });
  } finally {
    client.release();
  }
};

export const approveRequisition = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { approved_by } = req.body;

    const result = await client.query(
      `UPDATE purchase.requisitions SET
        status = 'approved',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE requisition_id = $2
      RETURNING *`,
      [approved_by || 'system', id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisition not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Requisition approved successfully',
      requisition: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving requisition:', error);
    res.status(500).json({ error: 'Failed to approve requisition' });
  } finally {
    client.release();
  }
};

export const rejectRequisition = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejection_reason) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await client.query(
      `UPDATE purchase.requisitions SET
        status = 'rejected',
        rejected_by = $1,
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE requisition_id = $3
      RETURNING *`,
      [rejected_by || 'system', rejection_reason, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Requisition not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Requisition rejected successfully',
      requisition: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting requisition:', error);
    res.status(500).json({ error: 'Failed to reject requisition' });
  } finally {
    client.release();
  }
};

export const deleteRequisition = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if already converted to PO
    const poCheck = await client.query(
      'SELECT COUNT(*) FROM purchase.purchase_orders WHERE requisition_id = $1',
      [id]
    );

    if (parseInt(poCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete requisition that has been converted to purchase order' 
      });
    }

    await client.query('DELETE FROM purchase.requisitions WHERE requisition_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Requisition deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting requisition:', error);
    res.status(500).json({ error: 'Failed to delete requisition' });
  } finally {
    client.release();
  }
};

// ============================================================================
// PURCHASE ORDERS MANAGEMENT
// ============================================================================

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, supplier_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        po.po_id,
        po.po_number,
        po.po_date,
        po.supplier_id,
        s.company_name as supplier_name,
        po.delivery_date,
        po.subtotal,
        po.vat_amount,
        po.total,
        po.status,
        po.created_at
      FROM purchase.purchase_orders po
      LEFT JOIN purchase.suppliers s ON po.supplier_id = s.supplier_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (po.po_number ILIKE $${paramCount} OR s.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND po.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND po.supplier_id = $${paramCount}`;
      params.push(supplier_id);
      paramCount++;
    }

    query += ` ORDER BY po.po_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM purchase.purchase_orders po LEFT JOIN purchase.suppliers s ON po.supplier_id = s.supplier_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (po.po_number ILIKE $${countParamCount} OR s.company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND po.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (supplier_id) {
      countQuery += ` AND po.supplier_id = $${countParamCount}`;
      countParams.push(supplier_id);
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
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const poResult = await pool.query(
      `SELECT po.*, s.company_name as supplier_name, s.contact_person, s.email, s.phone
       FROM purchase.purchase_orders po
       LEFT JOIN purchase.suppliers s ON po.supplier_id = s.supplier_id
       WHERE po.po_id = $1`,
      [id]
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM purchase.po_line_items WHERE po_id = $1 ORDER BY line_number',
      [id]
    );

    res.json({
      purchase_order: poResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      requisition_id,
      supplier_id,
      po_date,
      delivery_date,
      delivery_address,
      payment_terms,
      terms_and_conditions,
      notes,
      line_items
    } = req.body;

    if (!supplier_id || !line_items || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Supplier and line items are required' });
    }

    // Generate po_number: PO-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM purchase.purchase_orders 
       WHERE po_number LIKE $1`,
      [`PO-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const po_number = `PO-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

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

    const poResult = await client.query(
      `INSERT INTO purchase.purchase_orders (
        po_number, requisition_id, supplier_id, po_date, delivery_date,
        delivery_address, payment_terms, subtotal, vat_rate, vat_amount,
        total, terms_and_conditions, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        po_number, requisition_id, supplier_id,
        po_date || new Date(), delivery_date, delivery_address,
        payment_terms || 30, subtotal, 15.00, total_vat, total,
        terms_and_conditions, notes
      ]
    );

    const po_id = poResult.rows[0].po_id;

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const line = line_items[i];
      const line_total = line.quantity * line.unit_price;
      const discount_amount = line.discount_percentage 
        ? line_total * (line.discount_percentage / 100)
        : line.discount_amount || 0;
      const taxable_amount = line_total - discount_amount;

      await client.query(
        `INSERT INTO purchase.po_line_items (
          po_id, item_code, description, quantity, unit_of_measure,
          unit_price, discount_percentage, discount_amount, vat_rate,
          line_total, line_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          po_id, line.item_code, line.description, line.quantity,
          line.unit_of_measure || 'EA', line.unit_price,
          line.discount_percentage || 0, discount_amount,
          line.vat_rate || 15, taxable_amount, i + 1
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Purchase order created successfully',
      purchase_order: poResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  } finally {
    client.release();
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, delivery_date, notes } = req.body;

    const result = await client.query(
      `UPDATE purchase.purchase_orders SET
        status = COALESCE($1, status),
        delivery_date = COALESCE($2, delivery_date),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE po_id = $4
      RETURNING *`,
      [status, delivery_date, notes, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Purchase order updated successfully',
      purchase_order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  } finally {
    client.release();
  }
};

export const sendPurchaseOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE purchase.purchase_orders SET
        status = 'sent',
        sent_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE po_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await client.query('COMMIT');

    // TODO: Send email to supplier

    res.json({
      message: 'Purchase order sent successfully',
      purchase_order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending purchase order:', error);
    res.status(500).json({ error: 'Failed to send purchase order' });
  } finally {
    client.release();
  }
};

export const acknowledgePurchaseOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE purchase.purchase_orders SET
        status = 'acknowledged',
        acknowledged_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE po_id = $1
      RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Purchase order acknowledged successfully',
      purchase_order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error acknowledging purchase order:', error);
    res.status(500).json({ error: 'Failed to acknowledge purchase order' });
  } finally {
    client.release();
  }
};

export const cancelPurchaseOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const result = await client.query(
      `UPDATE purchase.purchase_orders SET
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE po_id = $2
      RETURNING *`,
      [cancellation_reason, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Purchase order cancelled successfully',
      purchase_order: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling purchase order:', error);
    res.status(500).json({ error: 'Failed to cancel purchase order' });
  } finally {
    client.release();
  }
};

// ============================================================================
// GOODS RECEIPTS MANAGEMENT
// ============================================================================

export const getGoodsReceipts = async (req: Request, res: Response) => {
  try {
    const { search, status, po_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        gr.gr_id,
        gr.gr_number,
        gr.gr_date,
        gr.po_id,
        po.po_number,
        gr.received_by,
        gr.status,
        gr.total_quantity,
        gr.created_at
      FROM purchase.goods_receipts gr
      LEFT JOIN purchase.purchase_orders po ON gr.po_id = po.po_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (gr.gr_number ILIKE $${paramCount} OR po.po_number ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND gr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (po_id) {
      query += ` AND gr.po_id = $${paramCount}`;
      params.push(po_id);
      paramCount++;
    }

    query += ` ORDER BY gr.gr_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM purchase.goods_receipts gr LEFT JOIN purchase.purchase_orders po ON gr.po_id = po.po_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (gr.gr_number ILIKE $${countParamCount} OR po.po_number ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND gr.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (po_id) {
      countQuery += ` AND gr.po_id = $${countParamCount}`;
      countParams.push(po_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      goods_receipts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching goods receipts:', error);
    res.status(500).json({ error: 'Failed to fetch goods receipts' });
  }
};

export const getGoodsReceiptById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const grResult = await pool.query(
      `SELECT gr.*, po.po_number, po.supplier_id
       FROM purchase.goods_receipts gr
       LEFT JOIN purchase.purchase_orders po ON gr.po_id = po.po_id
       WHERE gr.gr_id = $1`,
      [id]
    );

    if (grResult.rows.length === 0) {
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM purchase.gr_line_items WHERE gr_id = $1 ORDER BY line_number',
      [id]
    );

    res.json({
      goods_receipt: grResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching goods receipt:', error);
    res.status(500).json({ error: 'Failed to fetch goods receipt' });
  }
};

export const createGoodsReceipt = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      po_id,
      gr_date,
      received_by,
      delivery_note_number,
      notes,
      line_items
    } = req.body;

    if (!po_id || !line_items || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'PO and line items are required' });
    }

    // Generate gr_number: GR-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM purchase.goods_receipts 
       WHERE gr_number LIKE $1`,
      [`GR-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const gr_number = `GR-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Calculate total quantity
    let total_quantity = 0;
    for (const line of line_items) {
      total_quantity += line.quantity_received || 0;
    }

    const grResult = await client.query(
      `INSERT INTO purchase.goods_receipts (
        gr_number, po_id, gr_date, received_by, delivery_note_number,
        total_quantity, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 'draft', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        gr_number, po_id, gr_date || new Date(), received_by,
        delivery_note_number, total_quantity, notes
      ]
    );

    const gr_id = grResult.rows[0].gr_id;

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const line = line_items[i];
      await client.query(
        `INSERT INTO purchase.gr_line_items (
          gr_id, po_line_item_id, item_code, description,
          quantity_ordered, quantity_received, quantity_rejected,
          rejection_reason, unit_of_measure, line_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          gr_id, line.po_line_item_id, line.item_code, line.description,
          line.quantity_ordered, line.quantity_received || 0,
          line.quantity_rejected || 0, line.rejection_reason,
          line.unit_of_measure || 'EA', i + 1
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Goods receipt created successfully',
      goods_receipt: grResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating goods receipt:', error);
    res.status(500).json({ error: 'Failed to create goods receipt' });
  } finally {
    client.release();
  }
};

export const confirmGoodsReceipt = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { confirmed_by } = req.body;

    const result = await client.query(
      `UPDATE purchase.goods_receipts SET
        status = 'confirmed',
        confirmed_by = $1,
        confirmed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE gr_id = $2
      RETURNING *`,
      [confirmed_by || 'system', id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Goods receipt confirmed successfully',
      goods_receipt: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error confirming goods receipt:', error);
    res.status(500).json({ error: 'Failed to confirm goods receipt' });
  } finally {
    client.release();
  }
};

export const updateGoodsReceipt = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await client.query(
      `UPDATE purchase.goods_receipts SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE gr_id = $3
      RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Goods receipt not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Goods receipt updated successfully',
      goods_receipt: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating goods receipt:', error);
    res.status(500).json({ error: 'Failed to update goods receipt' });
  } finally {
    client.release();
  }
};

export const deleteGoodsReceipt = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if linked to invoice
    const invoiceCheck = await client.query(
      'SELECT COUNT(*) FROM purchase.vendor_invoices WHERE gr_id = $1',
      [id]
    );

    if (parseInt(invoiceCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete goods receipt linked to vendor invoice' 
      });
    }

    await client.query('DELETE FROM purchase.goods_receipts WHERE gr_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Goods receipt deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting goods receipt:', error);
    res.status(500).json({ error: 'Failed to delete goods receipt' });
  } finally {
    client.release();
  }
};

// ============================================================================
// VENDOR INVOICES MANAGEMENT
// ============================================================================

export const getVendorInvoices = async (req: Request, res: Response) => {
  try {
    const { search, status, supplier_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        vi.invoice_id,
        vi.invoice_number,
        vi.invoice_date,
        vi.supplier_id,
        s.company_name as supplier_name,
        vi.po_id,
        po.po_number,
        vi.subtotal,
        vi.vat_amount,
        vi.total,
        vi.status,
        vi.created_at
      FROM purchase.vendor_invoices vi
      LEFT JOIN purchase.suppliers s ON vi.supplier_id = s.supplier_id
      LEFT JOIN purchase.purchase_orders po ON vi.po_id = po.po_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (vi.invoice_number ILIKE $${paramCount} OR s.company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND vi.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (supplier_id) {
      query += ` AND vi.supplier_id = $${paramCount}`;
      params.push(supplier_id);
      paramCount++;
    }

    query += ` ORDER BY vi.invoice_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM purchase.vendor_invoices vi LEFT JOIN purchase.suppliers s ON vi.supplier_id = s.supplier_id WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (search) {
      countQuery += ` AND (vi.invoice_number ILIKE $${countParamCount} OR s.company_name ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND vi.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (supplier_id) {
      countQuery += ` AND vi.supplier_id = $${countParamCount}`;
      countParams.push(supplier_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      vendor_invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    res.status(500).json({ error: 'Failed to fetch vendor invoices' });
  }
};

export const getVendorInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const invResult = await pool.query(
      `SELECT vi.*, s.company_name as supplier_name, po.po_number
       FROM purchase.vendor_invoices vi
       LEFT JOIN purchase.suppliers s ON vi.supplier_id = s.supplier_id
       LEFT JOIN purchase.purchase_orders po ON vi.po_id = po.po_id
       WHERE vi.invoice_id = $1`,
      [id]
    );

    if (invResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    const linesResult = await pool.query(
      'SELECT * FROM purchase.vendor_invoice_line_items WHERE invoice_id = $1 ORDER BY line_number',
      [id]
    );

    res.json({
      vendor_invoice: invResult.rows[0],
      line_items: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching vendor invoice:', error);
    res.status(500).json({ error: 'Failed to fetch vendor invoice' });
  }
};

export const createVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      po_id,
      gr_id,
      supplier_id,
      invoice_number,
      invoice_date,
      due_date,
      payment_terms,
      notes,
      line_items
    } = req.body;

    if (!supplier_id || !invoice_number || !line_items || line_items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Supplier, invoice number, and line items are required' });
    }

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

    const invResult = await client.query(
      `INSERT INTO purchase.vendor_invoices (
        po_id, gr_id, supplier_id, invoice_number, invoice_date,
        due_date, payment_terms, subtotal, vat_rate, vat_amount,
        total, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        po_id, gr_id, supplier_id, invoice_number,
        invoice_date || new Date(), due_date, payment_terms || 30,
        subtotal, 15.00, total_vat, total, notes
      ]
    );

    const invoice_id = invResult.rows[0].invoice_id;

    // Insert line items
    for (let i = 0; i < line_items.length; i++) {
      const line = line_items[i];
      const line_total = line.quantity * line.unit_price;
      const discount_amount = line.discount_percentage 
        ? line_total * (line.discount_percentage / 100)
        : line.discount_amount || 0;
      const taxable_amount = line_total - discount_amount;

      await client.query(
        `INSERT INTO purchase.vendor_invoice_line_items (
          invoice_id, po_line_item_id, item_code, description,
          quantity, unit_price, discount_percentage, discount_amount,
          vat_rate, line_total, line_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          invoice_id, line.po_line_item_id, line.item_code, line.description,
          line.quantity, line.unit_price, line.discount_percentage || 0,
          discount_amount, line.vat_rate || 15, taxable_amount, i + 1
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Vendor invoice created successfully',
      vendor_invoice: invResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating vendor invoice:', error);
    res.status(500).json({ error: 'Failed to create vendor invoice' });
  } finally {
    client.release();
  }
};

export const approveVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { approved_by } = req.body;

    const result = await client.query(
      `UPDATE purchase.vendor_invoices SET
        status = 'approved',
        approved_by = $1,
        approved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $2
      RETURNING *`,
      [approved_by || 'system', id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Vendor invoice approved successfully',
      vendor_invoice: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving vendor invoice:', error);
    res.status(500).json({ error: 'Failed to approve vendor invoice' });
  } finally {
    client.release();
  }
};

export const rejectVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejection_reason) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await client.query(
      `UPDATE purchase.vendor_invoices SET
        status = 'rejected',
        rejected_by = $1,
        rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $3
      RETURNING *`,
      [rejected_by || 'system', rejection_reason, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Vendor invoice rejected successfully',
      vendor_invoice: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting vendor invoice:', error);
    res.status(500).json({ error: 'Failed to reject vendor invoice' });
  } finally {
    client.release();
  }
};

export const payVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { payment_date, payment_reference, payment_method, amount_paid } = req.body;

    const result = await client.query(
      `UPDATE purchase.vendor_invoices SET
        status = 'paid',
        payment_date = $1,
        payment_reference = $2,
        payment_method = $3,
        amount_paid = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $5
      RETURNING *`,
      [payment_date || new Date(), payment_reference, payment_method, amount_paid, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Vendor invoice marked as paid successfully',
      vendor_invoice: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error paying vendor invoice:', error);
    res.status(500).json({ error: 'Failed to pay vendor invoice' });
  } finally {
    client.release();
  }
};

export const updateVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, due_date, notes } = req.body;

    const result = await client.query(
      `UPDATE purchase.vendor_invoices SET
        status = COALESCE($1, status),
        due_date = COALESCE($2, due_date),
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE invoice_id = $4
      RETURNING *`,
      [status, due_date, notes, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    await client.query('COMMIT');

    res.json({
      message: 'Vendor invoice updated successfully',
      vendor_invoice: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating vendor invoice:', error);
    res.status(500).json({ error: 'Failed to update vendor invoice' });
  } finally {
    client.release();
  }
};

export const deleteVendorInvoice = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if already paid
    const checkResult = await client.query(
      'SELECT status FROM purchase.vendor_invoices WHERE invoice_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor invoice not found' });
    }

    if (checkResult.rows[0].status === 'paid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete paid invoice' 
      });
    }

    await client.query('DELETE FROM purchase.vendor_invoices WHERE invoice_id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Vendor invoice deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting vendor invoice:', error);
    res.status(500).json({ error: 'Failed to delete vendor invoice' });
  } finally {
    client.release();
  }
};

// Export ALL functions
export default {
  // Suppliers
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  // Requisitions
  getRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  approveRequisition,
  rejectRequisition,
  deleteRequisition,
  // Purchase Orders
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  sendPurchaseOrder,
  acknowledgePurchaseOrder,
  cancelPurchaseOrder,
  // Goods Receipts
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  confirmGoodsReceipt,
  updateGoodsReceipt,
  deleteGoodsReceipt,
  // Vendor Invoices
  getVendorInvoices,
  getVendorInvoiceById,
  createVendorInvoice,
  approveVendorInvoice,
  rejectVendorInvoice,
  payVendorInvoice,
  updateVendorInvoice,
  deleteVendorInvoice
};
