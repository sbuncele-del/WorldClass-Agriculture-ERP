import { Router } from 'express';
import SuperAdminController from '../controllers/super-admin.controller';
import { superAdminAuth } from '../middleware/superAdminAuth';

const router = Router();

/**
 * Super Admin Routes
 * 
 * All routes are protected by superAdminAuth middleware
 * Only users with emails in SUPER_ADMIN_EMAILS env variable can access
 */

// Apply super admin auth to all routes
router.use(superAdminAuth);

// Tenant Management
router.get('/tenants', SuperAdminController.getTenants);
router.get('/tenants/:id', SuperAdminController.getTenantDetails);
router.post('/tenants/:id/suspend', SuperAdminController.suspendTenant);
router.post('/tenants/:id/activate', SuperAdminController.activateTenant);
router.delete('/tenants/:id', SuperAdminController.deleteTenant);

// User Impersonation
router.post('/impersonate', SuperAdminController.impersonateUser);

// System Statistics & Health
router.get('/stats', SuperAdminController.getSystemStats);
router.get('/health', SuperAdminController.getSystemHealth);

// Feature Flags
router.get('/feature-flags', SuperAdminController.getFeatureFlags);
router.put('/feature-flags/:name', SuperAdminController.updateFeatureFlag);

// Audit Logs
router.get('/audit-logs', SuperAdminController.getAuditLogs);

export default router;
