import express from 'express';
import * as hrControllerV2 from '../modules/hr/controllers/hr.controller.v2';
import * as hrWorkspaceController from '../modules/hr/controllers/hr.workspace.controller';
import * as hrComplianceController from '../modules/hr/controllers/hr.compliance.controller';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply tenant middleware to all HR routes
router.use(tenantMiddleware);

/**
 * ============================================================================
 * HR & PAYROLL ROUTES
 * ============================================================================
 */

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', hrWorkspaceController.getHRWorkspace);

// ============================================================================
// DEPARTMENT ROUTES
// ============================================================================
router.get('/departments', hrControllerV2.getDepartments);
router.get('/departments/:id', hrControllerV2.getDepartmentById);
router.post('/departments', hrControllerV2.createDepartment);
router.put('/departments/:id', hrControllerV2.updateDepartment);

// ============================================================================
// POSITION ROUTES
// ============================================================================
router.get('/positions', hrControllerV2.getPositions);
router.post('/positions', hrControllerV2.createPosition);

// ============================================================================
// EMPLOYEE ROUTES
// ============================================================================
router.get('/employees', hrControllerV2.getEmployees);
router.get('/employees/:id', hrControllerV2.getEmployeeById);
router.post('/employees', hrControllerV2.createEmployee);
router.put('/employees/:id', hrControllerV2.updateEmployee);

// ============================================================================
// EMPLOYEE DOCUMENTS ROUTES
// ============================================================================
router.get('/employees/:employee_id/documents', hrComplianceController.getEmployeeDocuments);
router.post('/employees/:employee_id/documents', hrComplianceController.uploadDocument);
router.delete('/documents/:document_id', hrComplianceController.deleteDocument);
router.get('/documents/expiring', hrComplianceController.getExpiringDocuments);

// ============================================================================
// EMPLOYEE CONTRACTS ROUTES
// ============================================================================
router.get('/employees/:employee_id/contracts', hrComplianceController.getEmployeeContracts);
router.post('/employees/:employee_id/contracts', hrComplianceController.createContract);
router.post('/contracts/:contract_id/terminate', hrComplianceController.terminateContract);
router.get('/contracts/expiring', hrComplianceController.getExpiringContracts);

// ============================================================================
// PAYROLL ROUTES
// ============================================================================
router.get('/payroll/periods', hrControllerV2.getPayrollPeriods);
router.post('/payroll/periods', hrControllerV2.createPayrollPeriod);
router.post('/payroll/process', hrControllerV2.processPayroll);
router.get('/payroll/runs/:run_id', hrControllerV2.getPayrollRunDetails);
router.post('/payroll/post-to-gl', hrControllerV2.postPayrollToGL);

// ============================================================================
// PAYSLIP ROUTES
// ============================================================================
router.get('/payslips/:employee_id/:run_id', hrComplianceController.getPayslip);
router.get('/payslips/:employee_id/:run_id/html', hrComplianceController.getPayslipHTML);

// ============================================================================
// TAX CALCULATION ROUTES
// ============================================================================
router.post('/tax-calculator', hrComplianceController.calculateTax);
router.get('/tax-brackets/:tax_year', hrComplianceController.getTaxBrackets);

// ============================================================================
// LEAVE MANAGEMENT ROUTES
// ============================================================================
router.get('/leave/requests', hrControllerV2.getLeaveRequests);
router.post('/leave/requests', hrControllerV2.createLeaveRequest);
router.put('/leave/requests/:request_id/process', hrControllerV2.processLeaveRequest);
router.get('/leave/balances/:employee_id', hrControllerV2.getLeaveBalances);
router.get('/leave/calendar/:department_id', hrComplianceController.getLeaveCalendar);
router.post('/leave/process-accruals', hrComplianceController.processLeaveAccruals);
router.post('/leave/year-end-carryover', hrComplianceController.processYearEndCarryover);

// ============================================================================
// ATTENDANCE ROUTES
// ============================================================================
router.post('/attendance/clock', hrControllerV2.recordAttendance);
router.get('/attendance/records', hrControllerV2.getAttendanceRecords);

// ============================================================================
// COMPLIANCE & STATUTORY REPORTING ROUTES
// ============================================================================
router.get('/compliance/irp5/:employee_id/:tax_year', hrComplianceController.getIRP5);
router.get('/compliance/emp501/:tax_year', hrComplianceController.getEMP501);
router.get('/compliance/bcea-check/:employee_id', hrComplianceController.checkBCEACompliance);
router.get('/compliance/report', hrComplianceController.getComplianceReport);

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================
router.get('/dashboard', hrControllerV2.getHRDashboard);

export default router;
