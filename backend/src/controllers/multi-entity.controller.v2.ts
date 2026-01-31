/**
 * Multi-Entity Controller V2
 * Tenant-hardened API for multi-entity/subsidiary management
 * 
 * Features:
 * - Legal entity CRUD
 * - Entity hierarchy management
 * - Inter-company transactions
 * - Entity permissions
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
// LEGAL ENTITIES
// ============================================================================

/**
 * Get all legal entities for tenant
 */
export const getEntities = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { includeInactive = false } = req.query;

    let query = `
      SELECT 
        e.*,
        pe.name as parent_name,
        (SELECT COUNT(*) FROM legal_entities ce WHERE ce.parent_id = e.id) as child_count
      FROM legal_entities e
      LEFT JOIN legal_entities pe ON e.parent_id = pe.id
      WHERE e.tenant_id = $1
    `;

    if (!includeInactive) {
      query += ` AND e.status = 'active'`;
    }

    query += ` ORDER BY e.level, e.name`;

    const result = await pool.query(query, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get entities error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entities' });
  }
};

/**
 * Get single entity by ID
 */
export const getEntity = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.*, pe.name as parent_name
       FROM legal_entities e
       LEFT JOIN legal_entities pe ON e.parent_id = pe.id
       WHERE e.id = $1 AND e.tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get entity error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entity' });
  }
};

/**
 * Create new legal entity
 */
export const createEntity = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      name,
      code,
      type,
      registrationNumber,
      vatNumber,
      parentId,
      address,
      city,
      province,
      postalCode,
      country,
      currency,
      chartOfAccountsId
    } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name and code are required' });
    }

    // Check for duplicate code
    const existingCode = await pool.query(
      `SELECT id FROM legal_entities WHERE tenant_id = $1 AND code = $2`,
      [tenantId, code]
    );
    if (existingCode.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Entity code already exists' });
    }

    // Validate parent if provided
    let level = 0;
    if (parentId) {
      const parentResult = await pool.query(
        `SELECT id, level FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
        [parentId, tenantId]
      );
      if (parentResult.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Parent entity not found' });
      }
      level = parentResult.rows[0].level + 1;
    }

    const result = await pool.query(
      `INSERT INTO legal_entities 
        (tenant_id, name, code, type, registration_number, vat_number,
         parent_id, level, address, city, province, postal_code, country,
         currency, chart_of_accounts_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [tenantId, name, code, type || 'subsidiary', registrationNumber, vatNumber,
       parentId, level, address, city, province, postalCode, country || 'ZA',
       currency || 'ZAR', chartOfAccountsId, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Entity created'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create entity error:', error);
    res.status(500).json({ success: false, error: 'Failed to create entity' });
  }
};

/**
 * Update legal entity
 */
export const updateEntity = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const updates = req.body;

    // Verify entity exists and belongs to tenant
    const existingEntity = await pool.query(
      `SELECT * FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (existingEntity.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'type', 'registration_number', 'vat_number',
      'address', 'city', 'province', 'postal_code', 'country', 'currency',
      'chart_of_accounts_id', 'status'];
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    updateFields.push(`updated_by = $${paramIndex}`);
    values.push(userId);
    paramIndex++;

    updateFields.push(`updated_at = NOW()`);

    values.push(id, tenantId);

    const result = await pool.query(
      `UPDATE legal_entities SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Entity updated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update entity error:', error);
    res.status(500).json({ success: false, error: 'Failed to update entity' });
  }
};

/**
 * Delete (deactivate) legal entity
 */
export const deleteEntity = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    // Check for child entities
    const childCheck = await pool.query(
      `SELECT id FROM legal_entities WHERE parent_id = $1 AND tenant_id = $2 AND status = 'active'`,
      [id, tenantId]
    );

    if (childCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete entity with active child entities'
      });
    }

    // Soft delete
    const result = await pool.query(
      `UPDATE legal_entities SET 
        status = 'inactive',
        updated_by = $3,
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING id`,
      [id, tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    res.json({
      success: true,
      message: 'Entity deactivated'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete entity error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete entity' });
  }
};

// ============================================================================
// HIERARCHY
// ============================================================================

/**
 * Get entity hierarchy (tree structure)
 */
export const getEntityHierarchy = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get all entities
    const result = await pool.query(
      `SELECT id, name, code, type, parent_id, level, status
       FROM legal_entities
       WHERE tenant_id = $1 AND status = 'active'
       ORDER BY level, name`,
      [tenantId]
    );

    // Build tree structure
    const entities = result.rows;
    const entityMap = new Map<string, any>();
    const roots: any[] = [];

    // Create map
    for (const entity of entities) {
      entityMap.set(entity.id, { ...entity, children: [] });
    }

    // Build tree
    for (const entity of entities) {
      const node = entityMap.get(entity.id);
      if (entity.parent_id && entityMap.has(entity.parent_id)) {
        entityMap.get(entity.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    }

    res.json({
      success: true,
      data: roots
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get entity hierarchy error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entity hierarchy' });
  }
};

/**
 * Move entity to new parent
 */
export const moveEntity = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { newParentId } = req.body;

    // Validate entity
    const entity = await pool.query(
      `SELECT * FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (entity.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // Prevent circular reference
    if (newParentId === id) {
      return res.status(400).json({ success: false, error: 'Entity cannot be its own parent' });
    }

    // Get new parent level
    let newLevel = 0;
    if (newParentId) {
      const parent = await pool.query(
        `SELECT level FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
        [newParentId, tenantId]
      );
      if (parent.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Parent entity not found' });
      }
      newLevel = parent.rows[0].level + 1;

      // Check for circular reference (new parent shouldn't be descendant of current entity)
      const descendants = await pool.query(
        `WITH RECURSIVE entity_tree AS (
          SELECT id FROM legal_entities WHERE id = $1
          UNION ALL
          SELECT e.id FROM legal_entities e
          JOIN entity_tree t ON e.parent_id = t.id
        )
        SELECT id FROM entity_tree WHERE id = $2`,
        [id, newParentId]
      );

      if (descendants.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Cannot move to descendant entity' });
      }
    }

    // Update entity
    await pool.query(
      `UPDATE legal_entities SET
        parent_id = $3,
        level = $4,
        updated_by = $5,
        updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId, newParentId, newLevel, userId]
    );

    // Update descendant levels recursively
    await pool.query(
      `WITH RECURSIVE entity_tree AS (
        SELECT id, 1 as depth FROM legal_entities WHERE parent_id = $1 AND tenant_id = $2
        UNION ALL
        SELECT e.id, t.depth + 1 FROM legal_entities e
        JOIN entity_tree t ON e.parent_id = t.id
      )
      UPDATE legal_entities SET level = $3 + entity_tree.depth
      FROM entity_tree
      WHERE legal_entities.id = entity_tree.id`,
      [id, tenantId, newLevel]
    );

    res.json({
      success: true,
      message: 'Entity moved successfully'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Move entity error:', error);
    res.status(500).json({ success: false, error: 'Failed to move entity' });
  }
};

/**
 * Get entity ancestors
 */
export const getEntityAncestors = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `WITH RECURSIVE ancestors AS (
        SELECT id, name, code, parent_id, level, 0 as distance
        FROM legal_entities WHERE id = $1 AND tenant_id = $2
        UNION ALL
        SELECT e.id, e.name, e.code, e.parent_id, e.level, a.distance + 1
        FROM legal_entities e
        JOIN ancestors a ON e.id = a.parent_id
      )
      SELECT id, name, code, level, distance
      FROM ancestors
      WHERE distance > 0
      ORDER BY distance`,
      [id, tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get entity ancestors error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entity ancestors' });
  }
};

/**
 * Get entity descendants
 */
export const getEntityDescendants = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `WITH RECURSIVE descendants AS (
        SELECT id, name, code, parent_id, level, 0 as distance
        FROM legal_entities WHERE id = $1 AND tenant_id = $2
        UNION ALL
        SELECT e.id, e.name, e.code, e.parent_id, e.level, d.distance + 1
        FROM legal_entities e
        JOIN descendants d ON e.parent_id = d.id
        WHERE e.tenant_id = $2
      )
      SELECT id, name, code, parent_id, level, distance
      FROM descendants
      WHERE distance > 0
      ORDER BY level, name`,
      [id, tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get entity descendants error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entity descendants' });
  }
};

// ============================================================================
// ENTITY PERMISSIONS
// ============================================================================

/**
 * Get user entity permissions
 */
export const getUserEntityPermissions = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        ep.entity_id,
        e.name as entity_name,
        e.code as entity_code,
        ep.can_view,
        ep.can_edit,
        ep.can_post,
        ep.can_approve
       FROM entity_permissions ep
       JOIN legal_entities e ON ep.entity_id = e.id
       WHERE ep.user_id = $1 AND e.tenant_id = $2`,
      [userId, tenantId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get user entity permissions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get entity permissions' });
  }
};

/**
 * Update user entity permissions
 */
export const updateUserEntityPermissions = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId: currentUserId } = getTenantContext(req);
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, error: 'Permissions must be an array' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const perm of permissions) {
        // Verify entity belongs to tenant
        const entityCheck = await client.query(
          `SELECT id FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
          [perm.entityId, tenantId]
        );

        if (entityCheck.rows.length === 0) {
          continue; // Skip invalid entities
        }

        await client.query(
          `INSERT INTO entity_permissions 
            (user_id, entity_id, can_view, can_edit, can_post, can_approve, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id, entity_id) DO UPDATE SET
             can_view = $3,
             can_edit = $4,
             can_post = $5,
             can_approve = $6,
             updated_by = $7,
             updated_at = NOW()`,
          [userId, perm.entityId, perm.canView ?? true, perm.canEdit ?? false,
           perm.canPost ?? false, perm.canApprove ?? false, currentUserId]
        );
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Entity permissions updated'
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
    console.error('Update user entity permissions error:', error);
    res.status(500).json({ success: false, error: 'Failed to update entity permissions' });
  }
};

// ============================================================================
// USER ENTITIES (for current user)
// ============================================================================

/**
 * Get entities accessible by current user
 */
export const getUserEntities = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT DISTINCT
        e.id,
        e.code,
        e.name,
        e.type,
        e.level,
        e.status,
        ep.can_view,
        ep.can_edit,
        ep.can_post,
        ep.can_approve
       FROM legal_entities e
       LEFT JOIN entity_permissions ep ON e.id = ep.entity_id AND ep.user_id = $2
       WHERE e.tenant_id = $1 
         AND (ep.can_view = true OR NOT EXISTS (SELECT 1 FROM entity_permissions WHERE entity_id = e.id))
       ORDER BY e.level, e.name`,
      [tenantId, userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get user entities error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user entities' });
  }
};

/**
 * Grant entity permission to user
 */
export const grantEntityPermission = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId: currentUserId } = getTenantContext(req);
    const { user_id, entity_id, can_view, can_edit, can_post, can_approve } = req.body;

    if (!user_id || !entity_id) {
      return res.status(400).json({ success: false, error: 'user_id and entity_id are required' });
    }

    // Verify entity belongs to tenant
    const entityCheck = await pool.query(
      `SELECT id FROM legal_entities WHERE id = $1 AND tenant_id = $2`,
      [entity_id, tenantId]
    );

    if (entityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    const result = await pool.query(
      `INSERT INTO entity_permissions 
        (user_id, entity_id, can_view, can_edit, can_post, can_approve, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, entity_id) DO UPDATE SET
         can_view = $3,
         can_edit = $4,
         can_post = $5,
         can_approve = $6,
         updated_by = $7,
         updated_at = NOW()
       RETURNING *`,
      [user_id, entity_id, can_view ?? true, can_edit ?? false, can_post ?? false, can_approve ?? false, currentUserId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Entity permission granted'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Grant entity permission error:', error);
    res.status(500).json({ success: false, error: 'Failed to grant entity permission' });
  }
};

// ============================================================================
// INTER-ENTITY TRANSACTIONS
// ============================================================================

/**
 * Get inter-entity transactions
 */
export const getInterEntityTransactions = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { entityId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        it.*,
        se.name as source_entity_name,
        te.name as target_entity_name
       FROM intercompany_transactions it
       JOIN legal_entities se ON it.source_entity_id = se.id
       JOIN legal_entities te ON it.target_entity_id = te.id
       WHERE it.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIdx = 2;

    if (entityId) {
      query += ` AND (it.source_entity_id = $${paramIdx} OR it.target_entity_id = $${paramIdx})`;
      params.push(entityId);
      paramIdx++;
    }
    if (status) {
      query += ` AND it.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }
    if (startDate) {
      query += ` AND it.transaction_date >= $${paramIdx}`;
      params.push(startDate);
      paramIdx++;
    }
    if (endDate) {
      query += ` AND it.transaction_date <= $${paramIdx}`;
      params.push(endDate);
      paramIdx++;
    }

    query += ` ORDER BY it.transaction_date DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: { page: Number(page), limit: Number(limit) }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get inter-entity transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get inter-entity transactions' });
  }
};

/**
 * Create inter-entity transaction
 */
export const createInterEntityTransaction = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { 
      source_entity_id, target_entity_id, transaction_type, 
      transaction_date, amount, currency, description 
    } = req.body;

    if (!source_entity_id || !target_entity_id || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'source_entity_id, target_entity_id, and amount are required' 
      });
    }

    // Verify both entities belong to tenant
    const entityCheck = await pool.query(
      `SELECT id FROM legal_entities WHERE id IN ($1, $2) AND tenant_id = $3`,
      [source_entity_id, target_entity_id, tenantId]
    );

    if (entityCheck.rows.length !== 2) {
      return res.status(404).json({ success: false, error: 'One or both entities not found' });
    }

    const result = await pool.query(
      `INSERT INTO intercompany_transactions 
        (tenant_id, source_entity_id, target_entity_id, transaction_type, 
         transaction_date, amount, currency, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [tenantId, source_entity_id, target_entity_id, transaction_type || 'transfer',
       transaction_date || new Date(), amount, currency || 'ZAR', description, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Inter-entity transaction created'
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create inter-entity transaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to create inter-entity transaction' });
  }
};

// ============================================================================
// CONSOLIDATION & REPORTING
// ============================================================================

/**
 * Get consolidated financial data across entities
 */
export const getConsolidatedData = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { startDate, endDate, entityIds } = req.query;

    // Get all entities or specific ones
    let entityFilter = '';
    const params: any[] = [tenantId];
    
    if (entityIds && Array.isArray(entityIds) && entityIds.length > 0) {
      entityFilter = ` AND id = ANY($2)`;
      params.push(entityIds);
    }

    // Get entities for consolidation
    const entitiesResult = await pool.query(
      `SELECT id, code, name, type, level, currency 
       FROM legal_entities 
       WHERE tenant_id = $1 AND status = 'active'${entityFilter}
       ORDER BY level, name`,
      params
    );

    // Get inter-company transactions for elimination
    const intercoQuery = `
      SELECT 
        source_entity_id, target_entity_id, 
        SUM(amount) as total_amount,
        currency
       FROM intercompany_transactions
       WHERE tenant_id = $1 
         AND status = 'completed'
         ${startDate ? `AND transaction_date >= '${startDate}'` : ''}
         ${endDate ? `AND transaction_date <= '${endDate}'` : ''}
       GROUP BY source_entity_id, target_entity_id, currency
    `;
    const intercoResult = await pool.query(intercoQuery, [tenantId]);

    res.json({
      success: true,
      data: {
        entities: entitiesResult.rows,
        intercompanyEliminations: intercoResult.rows,
        consolidationDate: new Date().toISOString(),
        periodStart: startDate || null,
        periodEnd: endDate || null
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get consolidated data error:', error);
    res.status(500).json({ success: false, error: 'Failed to get consolidated data' });
  }
};

/**
 * Get multi-entity dashboard
 */
export const getMultiEntityDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get entity stats
    const entityStats = await pool.query(
      `SELECT 
         COUNT(*) as total_entities,
         SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_entities,
         COUNT(DISTINCT parent_id) as parent_count
       FROM entities 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get intercompany transaction stats
    const transactionStats = await pool.query(
      `SELECT 
         COUNT(*) as total_transactions,
         SUM(amount) as total_amount,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
       FROM intercompany_transactions 
       WHERE tenant_id = $1`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalEntities: parseInt(entityStats.rows[0]?.total_entities || '0'),
        activeEntities: parseInt(entityStats.rows[0]?.active_entities || '0'),
        totalTransactions: parseInt(transactionStats.rows[0]?.total_transactions || '0'),
        totalTransactionAmount: parseFloat(transactionStats.rows[0]?.total_amount || '0'),
        pendingTransactions: parseInt(transactionStats.rows[0]?.pending_count || '0'),
        summary: {
          entities: parseInt(entityStats.rows[0]?.total_entities || '0'),
          transactions: parseInt(transactionStats.rows[0]?.total_transactions || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get multi-entity dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch multi-entity dashboard' });
  }
};

export default {
  getEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntityHierarchy,
  moveEntity,
  getEntityAncestors,
  getEntityDescendants,
  getUserEntityPermissions,
  updateUserEntityPermissions,
  getUserEntities,
  grantEntityPermission,
  getInterEntityTransactions,
  createInterEntityTransaction,
  getConsolidatedData,
  getMultiEntityDashboard
};
