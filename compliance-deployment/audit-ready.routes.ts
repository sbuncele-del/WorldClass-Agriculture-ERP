import express from 'express';
import AuditReadyController from '../controllers/audit-ready.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ============================================================================
// AUDIT ENGAGEMENTS
// ============================================================================

/**
 * @route   GET /api/audit/engagements
 * @desc    Get audit engagements
 * @access  Private
 */
router.get('/engagements', authenticateToken, AuditReadyController.getEngagements);

/**
 * @route   GET /api/audit/engagements/:id
 * @desc    Get engagement by ID
 * @access  Private
 */
router.get('/engagements/:id', authenticateToken, AuditReadyController.getEngagementById);

/**
 * @route   POST /api/audit/engagements
 * @desc    Create new audit engagement
 * @access  Private
 */
router.post('/engagements', authenticateToken, AuditReadyController.createEngagement);

/**
 * @route   PUT /api/audit/engagements/:id/status
 * @desc    Update engagement status
 * @access  Private
 */
router.put('/engagements/:id/status', authenticateToken, AuditReadyController.updateEngagementStatus);

// ============================================================================
// AUDIT FINDINGS
// ============================================================================

/**
 * @route   GET /api/audit/findings
 * @desc    Get audit findings
 * @access  Private
 */
router.get('/findings', authenticateToken, AuditReadyController.getFindings);

/**
 * @route   POST /api/audit/findings
 * @desc    Create new audit finding
 * @access  Private
 */
router.post('/findings', authenticateToken, AuditReadyController.createFinding);

/**
 * @route   PUT /api/audit/findings/:id
 * @desc    Update audit finding
 * @access  Private
 */
router.put('/findings/:id', authenticateToken, AuditReadyController.updateFinding);

// ============================================================================
// AUDIT EVIDENCE
// ============================================================================

/**
 * @route   GET /api/audit/evidence
 * @desc    Get audit evidence
 * @access  Private
 */
router.get('/evidence', authenticateToken, AuditReadyController.getEvidence);

/**
 * @route   POST /api/audit/evidence
 * @desc    Add audit evidence
 * @access  Private
 */
router.post('/evidence', authenticateToken, AuditReadyController.addEvidence);

// ============================================================================
// CHECKLISTS
// ============================================================================

/**
 * @route   GET /api/audit/checklist-templates
 * @desc    Get checklist templates
 * @access  Private
 */
router.get('/checklist-templates', authenticateToken, AuditReadyController.getChecklistTemplates);

/**
 * @route   GET /api/audit/checklist-items/:templateId
 * @desc    Get checklist items for template
 * @access  Private
 */
router.get('/checklist-items/:templateId', authenticateToken, AuditReadyController.getChecklistItems);

// ============================================================================
// PERMANENT RECORDS
// ============================================================================

/**
 * @route   GET /api/audit/permanent-records
 * @desc    Get permanent records
 * @access  Private
 */
router.get('/permanent-records', authenticateToken, AuditReadyController.getPermanentRecords);

/**
 * @route   POST /api/audit/permanent-records
 * @desc    Add permanent record
 * @access  Private
 */
router.post('/permanent-records', authenticateToken, AuditReadyController.addPermanentRecord);

export default router;
