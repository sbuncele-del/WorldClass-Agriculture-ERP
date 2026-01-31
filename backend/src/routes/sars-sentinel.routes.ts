import express from 'express';
import SARSSentinelController from '../controllers/sars-sentinel.controller';
import * as sarsWorkspaceController from '../modules/sars/controllers/sars.workspace.controller';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all SARS routes
router.use(tenantMiddleware);

/**
 * SARS Sentinel Routes
 * 
 * Comprehensive SARS correspondence tracking and automation:
 * - Correspondence Management
 * - AI-Powered Analysis
 * - Workflow Automation
 * - Deadline Tracking
 * - Submission History
 * - Dashboard & Analytics
 */

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', authenticateToken, sarsWorkspaceController.getSARSWorkspace);

// ============================================================================
// CORRESPONDENCE MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/sars-sentinel/correspondence
 * @desc    Get all SARS correspondence with optional filters
 * @access  Private
 */
router.get('/correspondence', authenticateToken, SARSSentinelController.getCorrespondence);

/**
 * @route   GET /api/sars-sentinel/correspondence/:id
 * @desc    Get correspondence details by ID
 * @access  Private
 */
router.get('/correspondence/:id', authenticateToken, SARSSentinelController.getCorrespondenceById);

/**
 * @route   POST /api/sars-sentinel/correspondence
 * @desc    Create new SARS correspondence
 * @access  Private
 */
router.post('/correspondence', authenticateToken, SARSSentinelController.createCorrespondence);

/**
 * @route   PUT /api/sars-sentinel/correspondence/:id
 * @desc    Update correspondence
 * @access  Private
 */
router.put('/correspondence/:id', authenticateToken, SARSSentinelController.updateCorrespondence);

/**
 * @route   POST /api/sars-sentinel/correspondence/:id/comments
 * @desc    Add comment to correspondence
 * @access  Private
 */
router.post('/correspondence/:id/comments', authenticateToken, SARSSentinelController.addComment);

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

/**
 * @route   GET /api/sars-sentinel/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/dashboard/stats', authenticateToken, SARSSentinelController.getDashboardStats);

/**
 * @route   GET /api/sars-sentinel/correspondence-types
 * @desc    Get all correspondence types
 * @access  Private
 */
router.get('/correspondence-types', authenticateToken, SARSSentinelController.getCorrespondenceTypes);

/**
 * @route   GET /api/sars-sentinel/deadline-calendar
 * @desc    Get upcoming SARS deadlines
 * @access  Private
 */
router.get('/deadline-calendar', authenticateToken, SARSSentinelController.getDeadlineCalendar);

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

/**
 * @route   POST /api/sars-sentinel/correspondence/:id/workflows
 * @desc    Create workflow for correspondence
 * @access  Private
 */
router.post('/correspondence/:id/workflows', authenticateToken, SARSSentinelController.createWorkflow);

/**
 * @route   GET /api/sars-sentinel/workflows/:workflowId/steps
 * @desc    Get workflow steps
 * @access  Private
 */
router.get('/workflows/:workflowId/steps', authenticateToken, SARSSentinelController.getWorkflowSteps);

/**
 * @route   POST /api/sars-sentinel/workflows/steps/:stepId/complete
 * @desc    Complete workflow step
 * @access  Private
 */
router.post('/workflows/steps/:stepId/complete', authenticateToken, SARSSentinelController.completeWorkflowStep);

// ============================================================================
// SUBMISSION HISTORY
// ============================================================================

/**
 * @route   GET /api/sars-sentinel/submissions
 * @desc    Get submission history
 * @access  Private
 */
router.get('/submissions', authenticateToken, SARSSentinelController.getSubmissionHistory);

/**
 * @route   POST /api/sars-sentinel/submissions
 * @desc    Record new submission
 * @access  Private
 */
router.post('/submissions', authenticateToken, SARSSentinelController.recordSubmission);

export default router;
