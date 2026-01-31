/**
 * Recurring Entries Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import RecurringEntriesControllerV2 from '../controllers/recurring-entries.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Get all recurring entries
router.get('/', RecurringEntriesControllerV2.getRecurringEntries);

// Get single recurring entry
router.get('/:id', RecurringEntriesControllerV2.getRecurringEntryById);

// Create new recurring entry
router.post('/', RecurringEntriesControllerV2.createRecurringEntry);

// Update recurring entry
router.put('/:id', RecurringEntriesControllerV2.updateRecurringEntry);

// Delete recurring entry
router.delete('/:id', RecurringEntriesControllerV2.deleteRecurringEntry);

// Generate journal entry from template
router.post('/:id/generate', RecurringEntriesControllerV2.generateEntry);

// Get pending entries due for generation
router.get('/pending/due', RecurringEntriesControllerV2.getPendingEntries);

export default router;
