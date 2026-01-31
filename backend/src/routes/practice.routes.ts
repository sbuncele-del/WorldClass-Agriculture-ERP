import express from 'express';
import * as projectsController from '../controllers/v2/practice-projects.controller.v2';
import * as timeTrackingController from '../controllers/v2/practice-time-tracking.controller.v2';
import * as clientHealthController from '../controllers/v2/practice-client-health.controller.v2';
import * as tasksController from '../controllers/v2/practice-tasks.controller.v2';
import * as practiceWorkspaceController from '../modules/practice/controllers/practice.workspace.controller';
import { tenantMiddleware } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication and tenant middleware to all practice management routes
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * ============================================================================
 * PRACTICE MANAGEMENT API ROUTES
 * ============================================================================
 * 
 * Complete REST API for Practice Management features:
 * - Client Projects & Engagements
 * - Time Tracking & Approvals
 * - Client Health & Intelligence
 * - Task Management
 * ============================================================================
 */

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', practiceWorkspaceController.getPracticeWorkspace);

// ============================================================================
// PROJECTS ROUTES
// ============================================================================

// GET /api/practice/projects - Get all projects
router.get('/projects', projectsController.getAllProjects);

// GET /api/practice/projects/:id - Get project by ID
router.get('/projects/:id', projectsController.getProjectById);

// POST /api/practice/projects - Create new project
router.post('/projects', projectsController.createProject);

// PUT /api/practice/projects/:id - Update project
router.put('/projects/:id', projectsController.updateProject);

// DELETE /api/practice/projects/:id - Cancel project
router.delete('/projects/:id', projectsController.deleteProject);

// GET /api/practice/projects/:id/team - Get project team members
router.get('/projects/:id/team', projectsController.getProjectTeam);

// POST /api/practice/projects/:id/team - Add team member
router.post('/projects/:id/team', projectsController.addTeamMember);

// DELETE /api/practice/projects/:id/team/:memberId - Remove team member
router.delete('/projects/:id/team/:memberId', projectsController.removeTeamMember);

// GET /api/practice/projects/:id/health - Get project health/analytics
router.get('/projects/:id/health', projectsController.getProjectHealth);

// ============================================================================
// TIME TRACKING ROUTES
// ============================================================================

// GET /api/practice/time-entries - Get all time entries
router.get('/time-entries', timeTrackingController.getAllTimeEntries);

// GET /api/practice/time-entries/:id - Get time entry by ID
router.get('/time-entries/:id', timeTrackingController.getTimeEntryById);

// POST /api/practice/time-entries - Create time entry
router.post('/time-entries', timeTrackingController.createTimeEntry);

// PUT /api/practice/time-entries/:id - Update time entry
router.put('/time-entries/:id', timeTrackingController.updateTimeEntry);

// DELETE /api/practice/time-entries/:id - Delete time entry
router.delete('/time-entries/:id', timeTrackingController.deleteTimeEntry);

// POST /api/practice/time-entries/approve - Approve time entries (batch)
router.post('/time-entries/approve', timeTrackingController.approveTimeEntries);

// POST /api/practice/time-entries/reject - Reject time entries (batch)
router.post('/time-entries/reject', timeTrackingController.rejectTimeEntries);

// GET /api/practice/timesheet - Get employee timesheet
router.get('/timesheet', timeTrackingController.getTimesheet);

// GET /api/practice/pending-approvals - Get pending time entry approvals
router.get('/pending-approvals', timeTrackingController.getPendingApprovals);

// ============================================================================
// CLIENT HEALTH & ANALYTICS ROUTES
// ============================================================================

// GET /api/practice/clients/:id/360 - Get client 360° view
router.get('/clients/:id/360', clientHealthController.getClient360);

// GET /api/practice/clients/health - Get all client health scores
router.get('/clients/health', clientHealthController.getAllClientHealth);

// POST /api/practice/clients/:id/calculate-health - Calculate & update health score
router.post('/clients/:id/calculate-health', clientHealthController.calculateHealthScore);

// GET /api/practice/clients/:id/health-history - Get health score history
router.get('/clients/:id/health-history', clientHealthController.getHealthHistory);

// POST /api/practice/interactions - Log client interaction
router.post('/interactions', clientHealthController.logInteraction);

// GET /api/practice/interactions - Get client interactions
router.get('/interactions', clientHealthController.getInteractions);

// ============================================================================
// TASKS ROUTES
// ============================================================================

// GET /api/practice/tasks - Get all tasks
router.get('/tasks', tasksController.getAllTasks);

// GET /api/practice/tasks/:id - Get task by ID
router.get('/tasks/:id', tasksController.getTaskById);

// POST /api/practice/tasks - Create task
router.post('/tasks', tasksController.createTask);

// PUT /api/practice/tasks/:id - Update task
router.put('/tasks/:id', tasksController.updateTask);

// DELETE /api/practice/tasks/:id - Delete task
router.delete('/tasks/:id', tasksController.deleteTask);

// GET /api/practice/employees/:employee_id/tasks - Get my tasks
router.get('/employees/:employee_id/tasks', tasksController.getMyTasks);

export default router;
