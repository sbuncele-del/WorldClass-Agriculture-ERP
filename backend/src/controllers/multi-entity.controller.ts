/**
 * Multi-Entity Controller
 * Manage legal entities within a tenant
 */

import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * Get all entities for tenant
 */
export const getEntities = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { includeInactive, entityType } = req.query;

        let query = `
            SELECT 
                e.*,
                p.entity_name as parent_entity_name,
                (SELECT COUNT(*) FROM entities WHERE parent_entity_id = e.entity_id) as child_count,
                (SELECT COUNT(*) FROM entity_permissions WHERE entity_id = e.entity_id) as user_count
            FROM entities e
            LEFT JOIN entities p ON e.parent_entity_id = p.entity_id
            WHERE e.tenant_id = $1
        `;

        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (includeInactive !== 'true') {
            query += ` AND e.is_active = true`;
        }

        if (entityType) {
            query += ` AND e.entity_type = $${paramIndex}`;
            params.push(entityType);
            paramIndex++;
        }

        query += ` ORDER BY e.level_in_hierarchy, e.entity_name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching entities:', error);
        res.status(500).json({ error: 'Failed to fetch entities' });
    }
};

/**
 * Get entity by ID
 */
export const getEntityById = async (req: Request, res: Response) => {
    try {
        const { entityId } = req.params;
        const tenantId = (req as any).user.tenantId;

        const result = await pool.query(
            `SELECT 
                e.*,
                p.entity_name as parent_entity_name,
                es.numbering_format,
                es.default_payment_terms,
                es.enabled_modules
            FROM entities e
            LEFT JOIN entities p ON e.parent_entity_id = p.entity_id
            LEFT JOIN entity_settings es ON e.entity_id = es.entity_id
            WHERE e.entity_id = $1 AND e.tenant_id = $2`,
            [entityId, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error fetching entity:', error);
        res.status(500).json({ error: 'Failed to fetch entity' });
    }
};

/**
 * Create new entity
 */
export const createEntity = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const {
            entity_code,
            entity_name,
            entity_type,
            legal_name,
            registration_number,
            tax_number,
            vat_number,
            address,
            contact,
            base_currency,
            fiscal_year_end,
            parent_entity_id
        } = req.body;

        if (!entity_code || !entity_name || !entity_type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate level and path
        let level = 0;
        let path = `/${tenantId}/${entity_code}`;

        if (parent_entity_id) {
            const parentResult = await pool.query(
                'SELECT level_in_hierarchy, path FROM entities WHERE entity_id = $1 AND tenant_id = $2',
                [parent_entity_id, tenantId]
            );

            if (parentResult.rows.length === 0) {
                return res.status(400).json({ error: 'Parent entity not found' });
            }

            level = parentResult.rows[0].level_in_hierarchy + 1;
            path = `${parentResult.rows[0].path}/${entity_code}`;
        }

        const result = await pool.query(
            `INSERT INTO entities (
                tenant_id, entity_code, entity_name, entity_type, legal_name,
                registration_number, tax_number, vat_number,
                address_line1, address_line2, city, state_province, postal_code, country,
                phone, email, website,
                base_currency, fiscal_year_end,
                parent_entity_id, level_in_hierarchy, path, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *`,
            [
                tenantId, entity_code, entity_name, entity_type, legal_name,
                registration_number, tax_number, vat_number,
                address?.line1, address?.line2, address?.city, address?.state_province, address?.postal_code, address?.country,
                contact?.phone, contact?.email, contact?.website,
                base_currency || 'ZAR', fiscal_year_end,
                parent_entity_id, level, path, userId
            ]
        );

        // Create default settings
        await pool.query(
            `INSERT INTO entity_settings (tenant_id, entity_id) VALUES ($1, $2)`,
            [tenantId, result.rows[0].entity_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error creating entity:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'Entity code already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create entity' });
        }
    }
};

/**
 * Update entity
 */
export const updateEntity = async (req: Request, res: Response) => {
    try {
        const { entityId } = req.params;
        const tenantId = (req as any).user.tenantId;
        const updateFields = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateFields.entity_id;
        delete updateFields.tenant_id;
        delete updateFields.created_at;
        delete updateFields.created_by;

        updateFields.updated_at = new Date();

        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updateFields)) {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(entityId, tenantId);

        const result = await pool.query(
            `UPDATE entities SET ${setClauses.join(', ')} 
             WHERE entity_id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
             RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error updating entity:', error);
        res.status(500).json({ error: 'Failed to update entity' });
    }
};

/**
 * Get entity hierarchy (ancestors)
 */
export const getEntityAncestors = async (req: Request, res: Response) => {
    try {
        const { entityId } = req.params;

        const result = await pool.query(
            'SELECT * FROM get_entity_ancestors($1)',
            [entityId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching entity ancestors:', error);
        res.status(500).json({ error: 'Failed to fetch entity ancestors' });
    }
};

/**
 * Get entity descendants (children)
 */
export const getEntityDescendants = async (req: Request, res: Response) => {
    try {
        const { entityId } = req.params;

        const result = await pool.query(
            'SELECT * FROM get_entity_descendants($1)',
            [entityId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching entity descendants:', error);
        res.status(500).json({ error: 'Failed to fetch entity descendants' });
    }
};

/**
 * Get user's accessible entities
 */
export const getUserEntities = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;

        const result = await pool.query(
            `SELECT 
                e.*,
                ep.can_view, ep.can_create, ep.can_edit, ep.can_delete, ep.can_approve
            FROM entities e
            LEFT JOIN entity_permissions ep ON e.entity_id = ep.entity_id AND ep.user_id = $2
            WHERE e.tenant_id = $1 AND e.is_active = true
            AND (ep.can_view = true OR e.is_default = true)
            ORDER BY e.level_in_hierarchy, e.entity_name`,
            [tenantId, userId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching user entities:', error);
        res.status(500).json({ error: 'Failed to fetch user entities' });
    }
};

/**
 * Grant entity permission to user
 */
export const grantEntityPermission = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const grantedBy = (req as any).user.userId;
        const {
            user_id,
            entity_id,
            can_view,
            can_create,
            can_edit,
            can_delete,
            can_approve,
            modules_access,
            valid_from,
            valid_to
        } = req.body;

        if (!user_id || !entity_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO entity_permissions (
                tenant_id, user_id, entity_id,
                can_view, can_create, can_edit, can_delete, can_approve,
                modules_access, granted_by, valid_from, valid_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (tenant_id, user_id, entity_id)
            DO UPDATE SET
                can_view = EXCLUDED.can_view,
                can_create = EXCLUDED.can_create,
                can_edit = EXCLUDED.can_edit,
                can_delete = EXCLUDED.can_delete,
                can_approve = EXCLUDED.can_approve,
                modules_access = EXCLUDED.modules_access,
                valid_from = EXCLUDED.valid_from,
                valid_to = EXCLUDED.valid_to
            RETURNING *`,
            [
                tenantId, user_id, entity_id,
                can_view ?? true, can_create ?? false, can_edit ?? false, can_delete ?? false, can_approve ?? false,
                JSON.stringify(modules_access || []), grantedBy, valid_from, valid_to
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error granting permission:', error);
        res.status(500).json({ error: 'Failed to grant permission' });
    }
};

/**
 * Get inter-entity transactions
 */
export const getInterEntityTransactions = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { entityId, eliminationStatus, startDate, endDate } = req.query;

        let query = `
            SELECT 
                iet.*,
                se.entity_name as source_entity_name,
                de.entity_name as destination_entity_name
            FROM inter_entity_transactions iet
            JOIN entities se ON iet.source_entity_id = se.entity_id
            JOIN entities de ON iet.destination_entity_id = de.entity_id
            WHERE iet.tenant_id = $1
        `;

        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (entityId) {
            query += ` AND (iet.source_entity_id = $${paramIndex} OR iet.destination_entity_id = $${paramIndex})`;
            params.push(entityId);
            paramIndex++;
        }

        if (eliminationStatus) {
            query += ` AND iet.elimination_status = $${paramIndex}`;
            params.push(eliminationStatus);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND iet.transaction_date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND iet.transaction_date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ` ORDER BY iet.transaction_date DESC, iet.created_at DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching inter-entity transactions:', error);
        res.status(500).json({ error: 'Failed to fetch inter-entity transactions' });
    }
};

/**
 * Create inter-entity transaction
 */
export const createInterEntityTransaction = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const createdBy = (req as any).user.userId;
        const {
            source_entity_id,
            destination_entity_id,
            transaction_type,
            transaction_date,
            amount,
            currency,
            source_gl_account,
            destination_gl_account,
            description,
            notes
        } = req.body;

        if (!source_entity_id || !destination_entity_id || !transaction_type || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (source_entity_id === destination_entity_id) {
            return res.status(400).json({ error: 'Source and destination must be different' });
        }

        const result = await pool.query(
            `INSERT INTO inter_entity_transactions (
                tenant_id, source_entity_id, destination_entity_id,
                transaction_type, transaction_date, amount, currency,
                source_gl_account, destination_gl_account,
                description, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                tenantId, source_entity_id, destination_entity_id,
                transaction_type, transaction_date || new Date(), amount, currency || 'ZAR',
                source_gl_account, destination_gl_account,
                description, notes, createdBy
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Error creating inter-entity transaction:', error);
        res.status(500).json({ error: 'Failed to create inter-entity transaction' });
    }
};

/**
 * Get consolidated financial data
 */
export const getConsolidatedData = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { startDate, endDate, entityIds } = req.query;

        // Example: Consolidated revenue by entity
        let query = `
            SELECT 
                e.entity_name,
                e.entity_type,
                COUNT(DISTINCT si.invoice_id) as invoice_count,
                SUM(si.total_amount) as total_revenue,
                AVG(si.total_amount) as avg_invoice_value
            FROM entities e
            LEFT JOIN sales_invoices si ON e.entity_id = si.entity_id
            WHERE e.tenant_id = $1 AND e.is_active = true
        `;

        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (startDate) {
            query += ` AND si.invoice_date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND si.invoice_date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        if (entityIds) {
            const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
            query += ` AND e.entity_id = ANY($${paramIndex}::uuid[])`;
            params.push(ids);
            paramIndex++;
        }

        query += ` GROUP BY e.entity_id, e.entity_name, e.entity_type ORDER BY total_revenue DESC NULLS LAST`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Error fetching consolidated data:', error);
        res.status(500).json({ error: 'Failed to fetch consolidated data' });
    }
};
