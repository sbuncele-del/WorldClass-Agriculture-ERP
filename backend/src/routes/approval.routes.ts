/**
 * Approval Routes (V2, tenant-aware)
 * Delegates to tenant-hardened V2 controller.
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import * as ApprovalControllerV2 from '../controllers/approval.controller.v2';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// Approval Actions
router.post('/submit/:journalEntryId', ApprovalControllerV2.submitForApproval);
router.post('/approve/:journalEntryId', ApprovalControllerV2.approveEntry);
router.post('/reject/:journalEntryId', ApprovalControllerV2.rejectEntry);

// Approval Queries
router.get('/pending', ApprovalControllerV2.getPendingApprovals);
router.get('/history/:journalEntryId', ApprovalControllerV2.getApprovalHistory);

// Workflow Management
router.get('/workflows', ApprovalControllerV2.getWorkflows);
router.post('/workflows', ApprovalControllerV2.createWorkflow);
router.get('/workflows/:id/levels', ApprovalControllerV2.getWorkflowLevels);
router.post('/workflows/:id/levels', ApprovalControllerV2.createWorkflowLevel);

export default router;
