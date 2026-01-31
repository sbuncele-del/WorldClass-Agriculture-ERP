/**
 * Tenant Settings Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as TenantSettingsControllerV2 from '../controllers/tenant-settings.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Tenant settings routes
router.get('/settings', TenantSettingsControllerV2.getTenantSettings);
router.patch('/settings', TenantSettingsControllerV2.updateTenantSettings);

// Branding routes
router.get('/branding', TenantSettingsControllerV2.getBrandingSettings);
router.patch('/branding', TenantSettingsControllerV2.updateBrandingSettings);

// Module configuration routes
router.get('/modules', TenantSettingsControllerV2.getModuleConfig);
router.patch('/modules', TenantSettingsControllerV2.updateModuleConfig);
router.get('/modules/:moduleCode/settings', TenantSettingsControllerV2.getModuleSettings);

// Notification preferences
router.get('/notifications', TenantSettingsControllerV2.getNotificationPreferences);
router.patch('/notifications', TenantSettingsControllerV2.updateNotificationPreferences);

export default router;
