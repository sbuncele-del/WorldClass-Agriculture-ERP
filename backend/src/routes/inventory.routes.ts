/**
 * INVENTORY MANAGEMENT ROUTES
 * 
 * All routes for inventory module.
 * ALL ENDPOINTS NOW USE V2 CONTROLLER with automatic tenant isolation.
 */

import express from 'express';
// V2 controller with Repository Pattern + direct tenant-safe queries for ALL endpoints
import * as inventoryController from '../controllers/inventory.controller.v2';
import * as inventoryWorkspaceController from '../modules/inventory/controllers/inventory.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all inventory routes
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', inventoryWorkspaceController.getInventoryWorkspace);

// ============================================================================
// DASHBOARD (v2 - Tenant Isolated)
// ============================================================================
router.get('/dashboard', inventoryController.getInventoryDashboard);

// ============================================================================
// ITEM CATEGORIES (v2 - Repository Pattern)
// ============================================================================
router.get('/categories', inventoryController.getItemCategories);
router.get('/categories/tree', inventoryController.getItemCategoryTree);
router.get('/categories/:id', inventoryController.getItemCategory);
router.post('/categories', inventoryController.createItemCategory);
router.put('/categories/:id', inventoryController.updateItemCategory);
router.delete('/categories/:id', inventoryController.deleteItemCategory);

// ============================================================================
// WAREHOUSES (v2 - Repository Pattern)
// ============================================================================
router.get('/warehouses', inventoryController.getWarehouses);
router.get('/warehouses/:id', inventoryController.getWarehouse);
router.post('/warehouses', inventoryController.createWarehouse);
router.put('/warehouses/:id/default', inventoryController.setDefaultWarehouse);

// ============================================================================
// ITEMS (v2 - Repository Pattern)
// ============================================================================
router.get('/items', inventoryController.getItems);
router.get('/items/low-stock', inventoryController.getLowStockItems);
router.get('/items/:id', inventoryController.getItem);
router.post('/items', inventoryController.createItem);
router.put('/items/:id', inventoryController.updateItem);
router.delete('/items/:id', inventoryController.deleteItem);

// ============================================================================
// STOCK LEVELS (v2 - Tenant Isolated)
// ============================================================================
router.get('/stock-levels', inventoryController.getStockLevels);

// ============================================================================
// STOCK MOVEMENTS (v2 - Repository Pattern + Extended)
// ============================================================================
router.get('/stock-movements', inventoryController.getStockMovements);
router.get('/stock-movements/summary', inventoryController.getMovementSummary);
router.post('/stock-movements', inventoryController.createStockMovement);
router.post('/stock-movements/receipt', inventoryController.createStockReceipt);
router.post('/stock-movements/issue', inventoryController.createStockIssue);
router.post('/stock-movements/transfer', inventoryController.createStockTransfer);
router.post('/stock-movements/:id/post', inventoryController.postStockMovement);

// ============================================================================
// STOCK ADJUSTMENTS (v2 - Tenant Isolated)
// ============================================================================
router.get('/stock-adjustments', inventoryController.getStockAdjustments);
router.get('/stock-adjustments/:id', inventoryController.getStockAdjustmentById);
router.post('/stock-adjustments', inventoryController.createStockAdjustment);
router.post('/stock-adjustments/:id/post', inventoryController.postStockAdjustment);

// ============================================================================
// STOCK TAKES (v2 - Tenant Isolated)
// ============================================================================
router.get('/stock-takes', inventoryController.getStockTakes);
router.post('/stock-takes', inventoryController.createStockTake);
router.post('/stock-takes/:id/post', inventoryController.postStockTake);

// ============================================================================
// BATCHES / SERIALS (v2 - Tenant Isolated)
// ============================================================================
router.get('/batches', inventoryController.getStockBatches);
router.get('/serials', inventoryController.getSerialNumbers);

// ============================================================================
// REORDER SUGGESTIONS (v2 - Tenant Isolated)
// ============================================================================
router.get('/reorder-suggestions', inventoryController.getReorderSuggestions);
router.post('/reorder-suggestions/generate', inventoryController.generateReorderSuggestions);

export default router;
