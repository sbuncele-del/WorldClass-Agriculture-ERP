import { Router } from 'express';
import EmailPreferencesController from '../controllers/email-preferences.controller';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

/**
 * Public route - One-click unsubscribe (no auth required)
 * GET /api/email-preferences/unsubscribe/:token
 */
router.get('/unsubscribe/:token', EmailPreferencesController.unsubscribeViaToken);

// All other routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * GET /api/email-preferences
 * Get current user's email preferences
 */
router.get('/', EmailPreferencesController.getPreferences);

/**
 * PATCH /api/email-preferences
 * Update email preferences
 */
router.patch('/', EmailPreferencesController.updatePreferences);

/**
 * GET /api/email-preferences/categories
 * Get all available email categories
 */
router.get('/categories', EmailPreferencesController.getCategories);

/**
 * POST /api/email-preferences/unsubscribe-all
 * Unsubscribe from all non-essential emails
 */
router.post('/unsubscribe-all', EmailPreferencesController.unsubscribeAll);

/**
 * POST /api/email-preferences/resubscribe
 * Resubscribe to emails
 */
router.post('/resubscribe', EmailPreferencesController.resubscribe);

export default router;
