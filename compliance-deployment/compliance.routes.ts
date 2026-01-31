import express from 'express';
import ComplianceController from '../controllers/compliance.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ============================================================================
// REGULATORY FRAMEWORKS & REQUIREMENTS
// ============================================================================

/**
 * @route   GET /api/compliance/frameworks
 * @desc    Get regulatory frameworks
 * @access  Private
 */
router.get('/frameworks', authenticateToken, ComplianceController.getRegulatoryFrameworks);

/**
 * @route   GET /api/compliance/requirements
 * @desc    Get compliance requirements
 * @access  Private
 */
router.get('/requirements', authenticateToken, ComplianceController.getComplianceRequirements);

/**
 * @route   GET /api/compliance/status
 * @desc    Get compliance status records
 * @access  Private
 */
router.get('/status', authenticateToken, ComplianceController.getComplianceStatus);

/**
 * @route   PUT /api/compliance/status/:id
 * @desc    Update compliance status
 * @access  Private
 */
router.put('/status/:id', authenticateToken, ComplianceController.updateComplianceStatus);

// ============================================================================
// RISK MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/compliance/risks
 * @desc    Get risk register
 * @access  Private
 */
router.get('/risks', authenticateToken, ComplianceController.getRisks);

/**
 * @route   POST /api/compliance/risks
 * @desc    Create new risk
 * @access  Private
 */
router.post('/risks', authenticateToken, ComplianceController.createRisk);

/**
 * @route   GET /api/compliance/risk-categories
 * @desc    Get risk categories
 * @access  Private
 */
router.get('/risk-categories', authenticateToken, ComplianceController.getRiskCategories);

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/compliance/policies
 * @desc    Get policies
 * @access  Private
 */
router.get('/policies', authenticateToken, ComplianceController.getPolicies);

/**
 * @route   POST /api/compliance/policies
 * @desc    Create new policy
 * @access  Private
 */
router.post('/policies', authenticateToken, ComplianceController.createPolicy);

/**
 * @route   POST /api/compliance/policies/:id/acknowledge
 * @desc    Acknowledge policy
 * @access  Private
 */
router.post('/policies/:id/acknowledge', authenticateToken, ComplianceController.acknowledgePolicy);

/**
 * @route   GET /api/compliance/policy-categories
 * @desc    Get policy categories
 * @access  Private
 */
router.get('/policy-categories', authenticateToken, ComplianceController.getPolicyCategories);

// ============================================================================
// INCIDENT MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/compliance/incidents
 * @desc    Get incidents
 * @access  Private
 */
router.get('/incidents', authenticateToken, ComplianceController.getIncidents);

/**
 * @route   POST /api/compliance/incidents
 * @desc    Create new incident
 * @access  Private
 */
router.post('/incidents', authenticateToken, ComplianceController.createIncident);

/**
 * @route   GET /api/compliance/incident-types
 * @desc    Get incident types
 * @access  Private
 */
router.get('/incident-types', authenticateToken, ComplianceController.getIncidentTypes);

// ============================================================================
// TRAINING MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/compliance/training/courses
 * @desc    Get training courses
 * @access  Private
 */
router.get('/training/courses', authenticateToken, ComplianceController.getTrainingCourses);

/**
 * @route   POST /api/compliance/training/completions
 * @desc    Record training completion
 * @access  Private
 */
router.post('/training/completions', authenticateToken, ComplianceController.recordTrainingCompletion);

/**
 * @route   GET /api/compliance/training/history/:userId
 * @desc    Get user training history
 * @access  Private
 */
router.get('/training/history/:userId', authenticateToken, ComplianceController.getUserTrainingHistory);

export default router;
