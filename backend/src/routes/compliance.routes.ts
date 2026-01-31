import express from 'express';
// V2 controller with tenant isolation
import * as ComplianceControllerV2 from '../controllers/v2/compliance.controller.v2';
import * as complianceWorkspaceController from '../modules/compliance/controllers/compliance.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all compliance routes
router.use(tenantMiddleware);

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', complianceWorkspaceController.getComplianceWorkspace);

// ============================================================================
// REGULATORY FRAMEWORKS & REQUIREMENTS (V2 - Tenant Isolated)
// ============================================================================

/**
 * @route   GET /api/compliance/frameworks
 * @desc    Get regulatory frameworks
 * @access  Private
 */
router.get('/frameworks', ComplianceControllerV2.getRegulatoryFrameworks);

/**
 * @route   GET /api/compliance/requirements
 * @desc    Get compliance requirements
 * @access  Private
 */
router.get('/requirements', ComplianceControllerV2.getComplianceRequirements);

/**
 * @route   GET /api/compliance/status
 * @desc    Get compliance status records
 * @access  Private
 */
router.get('/status', ComplianceControllerV2.getComplianceStatus);

/**
 * @route   PUT /api/compliance/status/:id
 * @desc    Update compliance status
 * @access  Private
 */
router.put('/status/:id', ComplianceControllerV2.updateComplianceStatus);

// ============================================================================
// RISK MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

/**
 * @route   GET /api/compliance/risks
 * @desc    Get risk register
 * @access  Private
 */
router.get('/risks', ComplianceControllerV2.getRisks);

/**
 * @route   POST /api/compliance/risks
 * @desc    Create new risk
 * @access  Private
 */
router.post('/risks', ComplianceControllerV2.createRisk);

/**
 * @route   GET /api/compliance/risk-categories
 * @desc    Get risk categories
 * @access  Private
 */
router.get('/risk-categories', ComplianceControllerV2.getRiskCategories);

// ============================================================================
// POLICY MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

/**
 * @route   GET /api/compliance/policies
 * @desc    Get policies
 * @access  Private
 */
router.get('/policies', ComplianceControllerV2.getPolicies);

/**
 * @route   POST /api/compliance/policies
 * @desc    Create new policy
 * @access  Private
 */
router.post('/policies', ComplianceControllerV2.createPolicy);

/**
 * @route   POST /api/compliance/policies/:id/acknowledge
 * @desc    Acknowledge policy
 * @access  Private
 */
router.post('/policies/:id/acknowledge', ComplianceControllerV2.acknowledgePolicy);

/**
 * @route   GET /api/compliance/policy-categories
 * @desc    Get policy categories
 * @access  Private
 */
router.get('/policy-categories', ComplianceControllerV2.getPolicyCategories);

// ============================================================================
// INCIDENT MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

/**
 * @route   GET /api/compliance/incidents
 * @desc    Get incidents
 * @access  Private
 */
router.get('/incidents', ComplianceControllerV2.getIncidents);

/**
 * @route   POST /api/compliance/incidents
 * @desc    Create new incident
 * @access  Private
 */
router.post('/incidents', ComplianceControllerV2.createIncident);

/**
 * @route   GET /api/compliance/incident-types
 * @desc    Get incident types
 * @access  Private
 */
router.get('/incident-types', ComplianceControllerV2.getIncidentTypes);

// ============================================================================
// TRAINING MANAGEMENT (V2 - Tenant Isolated)
// ============================================================================

/**
 * @route   GET /api/compliance/training/courses
 * @desc    Get training courses
 * @access  Private
 */
router.get('/training/courses', ComplianceControllerV2.getTrainingCourses);

/**
 * @route   POST /api/compliance/training/completions
 * @desc    Record training completion
 * @access  Private
 */
router.post('/training/completions', ComplianceControllerV2.recordTrainingCompletion);

/**
 * @route   GET /api/compliance/training/history/:userId
 * @desc    Get user training history
 * @access  Private
 */
router.get('/training/history/:userId', ComplianceControllerV2.getUserTrainingHistory);

export default router;
