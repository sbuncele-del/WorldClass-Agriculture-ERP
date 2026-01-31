/**
 * HR Compliance Controller
 * South African labor law compliance, statutory reporting, and audit endpoints
 */

import { Request, Response } from 'express';
import pool from '../../../config/database';
import * as taxService from '../services/tax-calculation.service';
import * as payslipService from '../services/payslip.service';
import * as documentService from '../services/employee-documents.service';
import * as leaveService from '../services/leave-accrual.service';

type TenantRequest = Request & { tenant?: { id: string }; user?: { id?: number } };

const getTenantId = (req: TenantRequest) => req.tenant?.id;

/**
 * GET /api/hr/compliance/irp5/:employee_id/:tax_year
 * Generate IRP5 certificate data for an employee
 */
export const getIRP5 = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id, tax_year } = req.params;

    const irp5Data = await taxService.generateIRP5Data(
      parseInt(employee_id),
      parseInt(tax_year),
      tenantId
    );

    res.json({
      success: true,
      data: irp5Data,
    });
  } catch (error: any) {
    console.error('Error generating IRP5:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate IRP5',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/compliance/emp501/:tax_year
 * Generate EMP501 reconciliation data
 */
export const getEMP501 = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { tax_year } = req.params;

    const emp501Data = await taxService.generateEMP501Data(parseInt(tax_year), tenantId);

    res.json({
      success: true,
      data: emp501Data,
    });
  } catch (error: any) {
    console.error('Error generating EMP501:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate EMP501',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/payslips/:employee_id/:run_id
 * Get payslip data
 */
export const getPayslip = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id, run_id } = req.params;

    const payslipData = await payslipService.getPayslipData(
      parseInt(employee_id),
      parseInt(run_id),
      tenantId
    );

    if (!payslipData) {
      return res.status(404).json({
        success: false,
        error: 'Payslip not found',
      });
    }

    res.json({
      success: true,
      data: payslipData,
    });
  } catch (error: any) {
    console.error('Error fetching payslip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payslip',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/payslips/:employee_id/:run_id/html
 * Get payslip as HTML (for printing/PDF)
 */
export const getPayslipHTML = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id, run_id } = req.params;

    const payslipData = await payslipService.getPayslipData(
      parseInt(employee_id),
      parseInt(run_id),
      tenantId
    );

    if (!payslipData) {
      return res.status(404).json({
        success: false,
        error: 'Payslip not found',
      });
    }

    const html = payslipService.generatePayslipHTML(payslipData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: any) {
    console.error('Error generating payslip HTML:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payslip',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/tax-calculator
 * Calculate tax for given income
 */
export const calculateTax = async (req: Request, res: Response) => {
  try {
    const {
      annual_gross_income,
      employee_age,
      medical_aid_members,
      retirement_contributions,
      travel_allowance,
    } = req.body;

    if (!annual_gross_income || !employee_age) {
      return res.status(400).json({
        success: false,
        error: 'Annual gross income and employee age are required',
      });
    }

    const result = taxService.calculateFullTax({
      annualGrossIncome: annual_gross_income,
      employeeAge: employee_age,
      medicalAidMembers: medical_aid_members || 0,
      retirementContributions: retirement_contributions || 0,
      travelAllowance: travel_allowance || 0,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error calculating tax:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate tax',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/tax-brackets/:tax_year
 * Get SARS tax brackets
 */
export const getTaxBrackets = async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        tax_brackets: taxService.SARS_TAX_BRACKETS_2024,
        rebates: taxService.TAX_REBATES_2024,
        thresholds: taxService.TAX_THRESHOLDS_2024,
        tax_year: '2024/2025',
      },
    });
  } catch (error: any) {
    console.error('Error fetching tax brackets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax brackets',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/employees/:employee_id/documents
 * Upload employee document
 */
export const uploadDocument = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id } = req.params;
    const documentData = req.body;
    const userId = req.user?.id || 1;

    const document = await documentService.createDocument(
      tenantId,
      parseInt(employee_id),
      {
        ...documentData,
        uploaded_by: userId,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/employees/:employee_id/documents
 * Get employee documents
 */
export const getEmployeeDocuments = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id } = req.params;
    const { document_type } = req.query;

    const documents = await documentService.getEmployeeDocuments(
      tenantId,
      parseInt(employee_id),
      document_type as string | undefined
    );

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/hr/documents/:document_id
 * Delete employee document
 */
export const deleteDocument = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { document_id } = req.params;

    await documentService.deleteDocument(tenantId, parseInt(document_id));

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/documents/expiring
 * Get documents expiring soon
 */
export const getExpiringDocuments = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { days } = req.query;
    const daysAhead = parseInt(days as string) || 30;

    const documents = await documentService.getExpiringDocuments(tenantId, daysAhead);

    res.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error: any) {
    console.error('Error fetching expiring documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring documents',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/employees/:employee_id/contracts
 * Create employee contract
 */
export const createContract = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id } = req.params;
    const contractData = req.body;
    const userId = req.user?.id || 1;

    const contract = await documentService.createContract(
      tenantId,
      parseInt(employee_id),
      {
        ...contractData,
        created_by: userId,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: contract,
    });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create contract',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/employees/:employee_id/contracts
 * Get employee contracts
 */
export const getEmployeeContracts = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id } = req.params;
    const { include_history } = req.query;

    const contracts = await documentService.getEmployeeContracts(
      tenantId,
      parseInt(employee_id),
      include_history === 'true'
    );

    res.json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/contracts/:contract_id/terminate
 * Terminate employee contract
 */
export const terminateContract = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { contract_id } = req.params;
    const { termination_date, termination_reason } = req.body;
    const userId = req.user?.id || 1;

    await documentService.terminateContract(
      tenantId,
      parseInt(contract_id),
      new Date(termination_date),
      termination_reason,
      userId
    );

    res.json({
      success: true,
      message: 'Contract terminated successfully',
    });
  } catch (error: any) {
    console.error('Error terminating contract:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to terminate contract',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/contracts/expiring
 * Get contracts expiring soon
 */
export const getExpiringContracts = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { days } = req.query;
    const daysAhead = parseInt(days as string) || 60;

    const contracts = await documentService.getExpiringContracts(tenantId, daysAhead);

    res.json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error: any) {
    console.error('Error fetching expiring contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expiring contracts',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/leave/process-accruals
 * Process monthly leave accruals
 */
export const processLeaveAccruals = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const result = await leaveService.processMonthlyAccruals(tenantId);

    res.json({
      success: true,
      message: `Processed ${result.processed} leave accruals`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error processing leave accruals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process leave accruals',
      details: error.message,
    });
  }
};

/**
 * POST /api/hr/leave/year-end-carryover
 * Process year-end leave carryover
 */
export const processYearEndCarryover = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { from_year, to_year } = req.body;

    if (!from_year || !to_year) {
      return res.status(400).json({
        success: false,
        error: 'from_year and to_year are required',
      });
    }

    const result = await leaveService.processYearEndCarryover(
      tenantId,
      parseInt(from_year),
      parseInt(to_year)
    );

    res.json({
      success: true,
      message: `Processed ${result.processed} leave carryovers. ${result.forfeitedDays} days forfeited.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error processing year-end carryover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process year-end carryover',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/leave/calendar/:department_id
 * Get leave calendar for department
 */
export const getLeaveCalendar = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { department_id } = req.params;
    const { start_date, end_date } = req.query;

    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const endDate = end_date
      ? new Date(end_date as string)
      : new Date(new Date().setMonth(new Date().getMonth() + 2));

    const calendar = await leaveService.getDepartmentLeaveCalendar(
      tenantId,
      parseInt(department_id),
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: calendar,
      count: calendar.length,
    });
  } catch (error: any) {
    console.error('Error fetching leave calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leave calendar',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/compliance/bcea-check/:employee_id
 * Check BCEA (Basic Conditions of Employment Act) compliance
 */
export const checkBCEACompliance = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    const { employee_id } = req.params;

    // Get employee details
    const empResult = await pool.query(`
      SELECT 
        e.*,
        c.working_hours_per_week,
        c.notice_period_days,
        c.contract_type,
        c.probation_period_months
      FROM hr.employees e
      LEFT JOIN hr.employee_contracts c ON e.employee_id = c.employee_id AND e.tenant_id = c.tenant_id AND c.status = 'ACTIVE'
      WHERE e.tenant_id = $1 AND e.employee_id = $2
    `, [tenantId, employee_id]);

    if (empResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }

    const employee = empResult.rows[0];
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check working hours (max 45 per week)
    if (employee.working_hours_per_week > 45) {
      issues.push('Working hours exceed BCEA maximum of 45 hours per week');
    } else if (employee.working_hours_per_week > 40) {
      warnings.push('Working hours are above standard 40 hours but within BCEA limits');
    }

    // Check leave balances
    const leaveResult = await pool.query(`
      SELECT lt.leave_name, b.closing_balance, lt.default_days
      FROM hr.employee_leave_balances b
      JOIN hr.leave_types lt ON b.leave_type_id = lt.leave_type_id AND lt.tenant_id = $1
      WHERE b.tenant_id = $1 AND b.employee_id = $2 AND b.year = EXTRACT(YEAR FROM CURRENT_DATE)
    `, [tenantId, employee_id]);

    const annualLeave = leaveResult.rows.find(l => l.leave_name === 'Annual Leave');
    if (annualLeave && annualLeave.closing_balance < 15) {
      warnings.push(`Annual leave balance (${annualLeave.closing_balance} days) below statutory minimum of 15 days`);
    }

    // Check notice period
    if (employee.notice_period_days && employee.notice_period_days < 7) {
      issues.push('Notice period below BCEA minimum (1-4 weeks depending on tenure)');
    }

    // Check probation period (max 3 months typically)
    if (employee.probation_period_months && employee.probation_period_months > 6) {
      warnings.push('Probation period exceeds common practice of 3-6 months');
    }

    // Calculate tenure
    const hireDate = new Date(employee.hire_date);
    const tenureMonths = Math.floor(
      (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    res.json({
      success: true,
      data: {
        employee_id: parseInt(employee_id),
        employee_number: employee.employee_number,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        compliance_status: issues.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
        tenure_months: tenureMonths,
        issues,
        warnings,
        leave_balances: leaveResult.rows,
        contract_type: employee.contract_type,
        working_hours_per_week: employee.working_hours_per_week,
        notice_period_days: employee.notice_period_days,
        checked_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error checking BCEA compliance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check BCEA compliance',
      details: error.message,
    });
  }
};

/**
 * GET /api/hr/compliance/report
 * Get overall HR compliance report
 */
export const getComplianceReport = async (req: TenantRequest, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(401).json({ success: false, error: 'Tenant context not found' });

    // Count employees by status
    const statusCount = await pool.query(`
      SELECT employment_status, COUNT(*) as count
      FROM hr.employees
      WHERE tenant_id = $1
      GROUP BY employment_status
    `, [tenantId]);

    // Count expiring documents
    const expiringDocs = await pool.query(`
      SELECT COUNT(*) as count
      FROM hr.employee_documents
      WHERE expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND expiry_date >= CURRENT_DATE
        AND is_deleted = false
        AND tenant_id = $1
    `, [tenantId]);

    // Count expiring contracts
    const expiringContracts = await pool.query(`
      SELECT COUNT(*) as count
      FROM hr.employee_contracts
      WHERE end_date IS NOT NULL
        AND end_date <= CURRENT_DATE + INTERVAL '60 days'
        AND end_date >= CURRENT_DATE
        AND status = 'ACTIVE'
        AND tenant_id = $1
    `, [tenantId]);

    // Count pending leave requests
    const pendingLeave = await pool.query(`
      SELECT COUNT(*) as count
      FROM hr.leave_requests
      WHERE status = 'Pending'
        AND tenant_id = $1
    `, [tenantId]);

    // Check for employees without contracts
    const noContract = await pool.query(`
      SELECT COUNT(*) as count
      FROM hr.employees e
      WHERE e.employment_status = 'Active'
        AND NOT EXISTS (
          SELECT 1 FROM hr.employee_contracts c
          WHERE c.employee_id = e.employee_id AND c.tenant_id = $1 AND c.status = 'ACTIVE'
        )
        AND e.tenant_id = $1
    `, [tenantId]);

    // Check for employees without tax numbers
    const noTaxNumber = await pool.query(`
      SELECT COUNT(*) as count
      FROM hr.employees
      WHERE employment_status = 'Active'
        AND (tax_number IS NULL OR tax_number = '')
        AND tenant_id = $1
    `, [tenantId]);

    res.json({
      success: true,
      data: {
        employee_status: statusCount.rows,
        alerts: {
          expiring_documents: parseInt(expiringDocs.rows[0].count),
          expiring_contracts: parseInt(expiringContracts.rows[0].count),
          pending_leave_requests: parseInt(pendingLeave.rows[0].count),
          employees_without_contracts: parseInt(noContract.rows[0].count),
          employees_without_tax_numbers: parseInt(noTaxNumber.rows[0].count),
        },
        compliance_score: calculateComplianceScore({
          expiringDocs: parseInt(expiringDocs.rows[0].count),
          expiringContracts: parseInt(expiringContracts.rows[0].count),
          noContract: parseInt(noContract.rows[0].count),
          noTaxNumber: parseInt(noTaxNumber.rows[0].count),
        }),
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
      details: error.message,
    });
  }
};

function calculateComplianceScore(metrics: {
  expiringDocs: number;
  expiringContracts: number;
  noContract: number;
  noTaxNumber: number;
}): number {
  let score = 100;

  // Deduct points for issues
  score -= metrics.expiringDocs * 2;
  score -= metrics.expiringContracts * 3;
  score -= metrics.noContract * 10;
  score -= metrics.noTaxNumber * 5;

  return Math.max(0, score);
}

export default {
  getIRP5,
  getEMP501,
  getPayslip,
  getPayslipHTML,
  calculateTax,
  getTaxBrackets,
  uploadDocument,
  getEmployeeDocuments,
  deleteDocument,
  getExpiringDocuments,
  createContract,
  getEmployeeContracts,
  terminateContract,
  getExpiringContracts,
  processLeaveAccruals,
  processYearEndCarryover,
  getLeaveCalendar,
  checkBCEACompliance,
  getComplianceReport,
};
