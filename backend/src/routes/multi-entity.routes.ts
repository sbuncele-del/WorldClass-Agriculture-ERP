/**
 * Multi-Entity Routes
 * API endpoints for entity management
 * NOW USING V2 CONTROLLER with proper tenant isolation
 */

import express from 'express';
import * as MultiEntityV2 from '../controllers/multi-entity.controller.v2';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require tenant context (auth is handled by tenantMiddleware)
router.use(tenantMiddleware);

// ================================================
// ENTITY MANAGEMENT
// ================================================

/**
 * GET /api/entities
 * Get all entities for tenant
 * Query: ?includeInactive=true&entityType=BRANCH
 */
router.get('/', MultiEntityV2.getEntities);

// Alias for intercompany - redirects to transactions/inter-entity
router.get('/intercompany', MultiEntityV2.getInterEntityTransactions);

/**
 * GET /api/entities/user
 * Get user's accessible entities
 */
router.get('/user', MultiEntityV2.getUserEntities);

/**
 * GET /api/entities/:id
 * Get entity by ID with settings
 */
router.get('/:id', MultiEntityV2.getEntity);

/**
 * POST /api/entities
 * Create new entity
 * Body: { code, name, type, ... }
 */
router.post('/', MultiEntityV2.createEntity);

/**
 * PUT /api/entities/:id
 * Update entity
 */
router.put('/:id', MultiEntityV2.updateEntity);

/**
 * DELETE /api/entities/:id
 * Delete entity (soft delete)
 */
router.delete('/:id', MultiEntityV2.deleteEntity);

/**
 * GET /api/entities/:id/ancestors
 * Get entity hierarchy (parent, grandparent, etc.)
 */
router.get('/:id/ancestors', MultiEntityV2.getEntityAncestors);

/**
 * GET /api/entities/:id/descendants
 * Get entity children (subsidiaries, branches)
 */
router.get('/:id/descendants', MultiEntityV2.getEntityDescendants);

/**
 * GET /api/entities/:id/hierarchy
 * Get full entity hierarchy tree
 */
router.get('/:id/hierarchy', MultiEntityV2.getEntityHierarchy);

/**
 * POST /api/entities/:id/move
 * Move entity to new parent
 */
router.post('/:id/move', MultiEntityV2.moveEntity);

// ================================================
// ENTITY PERMISSIONS
// ================================================

/**
 * POST /api/entities/permissions
 * Grant entity permission to user
 * Body: { user_id, entity_id, can_view, can_edit, ... }
 */
router.post('/permissions', MultiEntityV2.grantEntityPermission);

/**
 * GET /api/entities/permissions/user/:userId
 * Get user's entity permissions
 */
router.get('/permissions/user/:userId', MultiEntityV2.getUserEntityPermissions);

/**
 * PUT /api/entities/permissions/user/:userId
 * Update user's entity permissions
 */
router.put('/permissions/user/:userId', MultiEntityV2.updateUserEntityPermissions);

// ================================================
// INTER-ENTITY TRANSACTIONS
// ================================================

/**
 * GET /api/entities/transactions/inter-entity
 * Get inter-entity transactions
 * Query: ?entityId=xxx&status=PENDING&startDate=2024-01-01
 */
router.get('/transactions/inter-entity', MultiEntityV2.getInterEntityTransactions);

/**
 * POST /api/entities/transactions/inter-entity
 * Create inter-entity transaction
 * Body: { source_entity_id, target_entity_id, transaction_type, amount, ... }
 */
router.post('/transactions/inter-entity', MultiEntityV2.createInterEntityTransaction);

// ================================================
// CONSOLIDATION & REPORTING
// ================================================

/**
 * GET /api/entities/reports/consolidated
 * Get consolidated financial data across entities
 * Query: ?startDate=2024-01-01&endDate=2024-12-31&entityIds[]=xxx
 */
router.get('/reports/consolidated', MultiEntityV2.getConsolidatedData);

export default router;
