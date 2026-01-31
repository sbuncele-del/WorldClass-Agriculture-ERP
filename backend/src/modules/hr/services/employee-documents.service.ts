/**
 * Employee Documents Service
 * Manages employee contracts, documents, and file storage
 */

import pool from '../../../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface EmployeeDocument {
  document_id: number;
  employee_id: number;
  document_type: string;
  document_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  expiry_date?: Date;
  is_confidential: boolean;
  uploaded_by: number;
  created_at: Date;
}

export interface EmployeeContract {
  contract_id: number;
  employee_id: number;
  contract_type: string;
  contract_number: string;
  start_date: Date;
  end_date?: Date;
  job_title: string;
  department_id: number;
  reporting_to: number;
  basic_salary: number;
  salary_frequency: string;
  working_hours_per_week: number;
  probation_period_months: number;
  notice_period_days: number;
  benefits: object;
  special_conditions?: string;
  status: string;
  document_id?: number;
  created_by: number;
  created_at: Date;
}

// Document types
export const DOCUMENT_TYPES = [
  'ID_DOCUMENT',
  'PASSPORT',
  'DRIVERS_LICENSE',
  'WORK_PERMIT',
  'CONTRACT',
  'QUALIFICATION',
  'CERTIFICATE',
  'TAX_CERTIFICATE',
  'MEDICAL_CERTIFICATE',
  'BACKGROUND_CHECK',
  'REFERENCE_LETTER',
  'PERFORMANCE_REVIEW',
  'DISCIPLINARY_RECORD',
  'TRAINING_RECORD',
  'OTHER',
];

// Contract types
export const CONTRACT_TYPES = [
  'PERMANENT',
  'FIXED_TERM',
  'PART_TIME',
  'TEMPORARY',
  'CASUAL',
  'INTERNSHIP',
  'LEARNERSHIP',
  'CONTRACTOR',
];

/**
 * Create employee document record
 */
export async function createDocument(
  tenantId: string,
  employeeId: number,
  documentData: {
    document_type: string;
    document_name: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    description?: string;
    expiry_date?: Date;
    is_confidential?: boolean;
    uploaded_by: number;
  }
): Promise<EmployeeDocument> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate document type
    if (!DOCUMENT_TYPES.includes(documentData.document_type)) {
      throw new Error(`Invalid document type. Must be one of: ${DOCUMENT_TYPES.join(', ')}`);
    }

    // Verify employee exists
    const empCheck = await client.query(
      'SELECT employee_id FROM hr.employees WHERE tenant_id = $1 AND employee_id = $2',
      [tenantId, employeeId]
    );

    if (empCheck.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const result = await client.query(`
      INSERT INTO hr.employee_documents (
        tenant_id,
        employee_id,
        document_type,
        document_name,
        file_name,
        file_path,
        file_size,
        mime_type,
        description,
        expiry_date,
        is_confidential,
        uploaded_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      tenantId,
      employeeId,
      documentData.document_type,
      documentData.document_name,
      documentData.file_name,
      documentData.file_path,
      documentData.file_size,
      documentData.mime_type,
      documentData.description || null,
      documentData.expiry_date || null,
      documentData.is_confidential || false,
      documentData.uploaded_by,
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all documents for an employee
 */
export async function getEmployeeDocuments(
  tenantId: string,
  employeeId: number,
  documentType?: string
): Promise<EmployeeDocument[]> {
  let query = `
    SELECT 
      d.*,
      u.first_name || ' ' || u.last_name as uploaded_by_name
    FROM hr.employee_documents d
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.tenant_id = $1 AND d.employee_id = $2 AND d.is_deleted = false
  `;
  
  const params: any[] = [tenantId, employeeId];

  if (documentType) {
    params.push(documentType);
    query += ` AND d.document_type = $${params.length}`;
  }

  query += ' ORDER BY d.created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Delete document (soft delete)
 */
export async function deleteDocument(tenantId: string, documentId: number): Promise<void> {
  await pool.query(`
    UPDATE hr.employee_documents
    SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
    WHERE tenant_id = $1 AND document_id = $2
  `, [tenantId, documentId]);
}

/**
 * Get documents expiring soon
 */
export async function getExpiringDocuments(tenantId: string, daysAhead: number = 30): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      d.*,
      e.employee_number,
      e.first_name || ' ' || e.last_name as employee_name,
      dept.department_name
    FROM hr.employee_documents d
    JOIN hr.employees e ON d.employee_id = e.employee_id AND e.tenant_id = $2
    LEFT JOIN hr.departments dept ON e.department_id = dept.department_id
    WHERE d.expiry_date IS NOT NULL
      AND d.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
      AND d.expiry_date >= CURRENT_DATE
      AND d.is_deleted = false
      AND d.tenant_id = $2
    ORDER BY d.expiry_date ASC
  `, [daysAhead, tenantId]);

  return result.rows;
}

/**
 * Create employee contract
 */
export async function createContract(
  tenantId: string,
  employeeId: number,
  contractData: {
    contract_type: string;
    start_date: Date;
    end_date?: Date;
    job_title: string;
    department_id: number;
    reporting_to?: number;
    basic_salary: number;
    salary_frequency: string;
    working_hours_per_week?: number;
    probation_period_months?: number;
    notice_period_days?: number;
    benefits?: object;
    special_conditions?: string;
    document_id?: number;
    created_by: number;
  }
): Promise<EmployeeContract> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate contract type
    if (!CONTRACT_TYPES.includes(contractData.contract_type)) {
      throw new Error(`Invalid contract type. Must be one of: ${CONTRACT_TYPES.join(', ')}`);
    }

    // Verify employee exists
    const empCheck = await client.query(
      'SELECT employee_id FROM hr.employees WHERE tenant_id = $1 AND employee_id = $2',
      [tenantId, employeeId]
    );

    if (empCheck.rows.length === 0) {
      throw new Error('Employee not found');
    }

    // Generate contract number
    const contractNumber = `CTR-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Expire any existing active contracts
    await client.query(`
      UPDATE hr.employee_contracts
      SET status = 'SUPERSEDED', updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND employee_id = $2 AND status = 'ACTIVE'
    `, [tenantId, employeeId]);

    const result = await client.query(`
      INSERT INTO hr.employee_contracts (
        tenant_id,
        employee_id,
        contract_type,
        contract_number,
        start_date,
        end_date,
        job_title,
        department_id,
        reporting_to,
        basic_salary,
        salary_frequency,
        working_hours_per_week,
        probation_period_months,
        notice_period_days,
        benefits,
        special_conditions,
        status,
        document_id,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'ACTIVE', $17, $18, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      tenantId,
      employeeId,
      contractData.contract_type,
      contractNumber,
      contractData.start_date,
      contractData.end_date || null,
      contractData.job_title,
      contractData.department_id,
      contractData.reporting_to || null,
      contractData.basic_salary,
      contractData.salary_frequency || 'MONTHLY',
      contractData.working_hours_per_week || 40,
      contractData.probation_period_months || 3,
      contractData.notice_period_days || 30,
      JSON.stringify(contractData.benefits || {}),
      contractData.special_conditions || null,
      contractData.document_id || null,
      contractData.created_by,
    ]);

    // Update employee's basic salary if contract is active
    await client.query(`
      UPDATE hr.employees
      SET 
        basic_salary = $1,
        position_id = (SELECT position_id FROM hr.positions WHERE position_title = $2 LIMIT 1),
        department_id = $3,
        reports_to_employee_id = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $5 AND employee_id = $6
    `, [
      contractData.basic_salary,
      contractData.job_title,
      contractData.department_id,
      contractData.reporting_to,
      tenantId,
      employeeId,
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all contracts for an employee
 */
export async function getEmployeeContracts(
  tenantId: string,
  employeeId: number,
  includeHistory: boolean = false
): Promise<EmployeeContract[]> {
  let query = `
    SELECT 
      c.*,
      d.department_name,
      m.first_name || ' ' || m.last_name as reporting_to_name
    FROM hr.employee_contracts c
    LEFT JOIN hr.departments d ON c.department_id = d.department_id AND d.tenant_id = $1
    LEFT JOIN hr.employees m ON c.reporting_to = m.employee_id AND m.tenant_id = $1
    WHERE c.tenant_id = $1 AND c.employee_id = $2
  `;

  if (!includeHistory) {
    query += ` AND c.status = 'ACTIVE'`;
  }

  query += ' ORDER BY c.start_date DESC';

  const result = await pool.query(query, [tenantId, employeeId]);
  return result.rows;
}

/**
 * Terminate contract
 */
export async function terminateContract(
  tenantId: string,
  contractId: number,
  terminationDate: Date,
  terminationReason: string,
  terminatedBy: number
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update contract
    await client.query(`
      UPDATE hr.employee_contracts
      SET 
        status = 'TERMINATED',
        end_date = $1,
        termination_reason = $2,
        terminated_by = $3,
        terminated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $4 AND contract_id = $5
    `, [terminationDate, terminationReason, terminatedBy, tenantId, contractId]);

    // Get employee ID
    const contractResult = await client.query(
      'SELECT employee_id FROM hr.employee_contracts WHERE tenant_id = $1 AND contract_id = $2',
      [tenantId, contractId]
    );

    if (contractResult.rows.length > 0) {
      // Update employee status
      await client.query(`
        UPDATE hr.employees
        SET 
          employment_status = 'Terminated',
          termination_date = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $2 AND employee_id = $3
      `, [terminationDate, tenantId, contractResult.rows[0].employee_id]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get contracts expiring soon
 */
export async function getExpiringContracts(tenantId: string, daysAhead: number = 60): Promise<any[]> {
  const result = await pool.query(`
    SELECT 
      c.*,
      e.employee_number,
      e.first_name || ' ' || e.last_name as employee_name,
      d.department_name
    FROM hr.employee_contracts c
    JOIN hr.employees e ON c.employee_id = e.employee_id
    LEFT JOIN hr.departments d ON c.department_id = d.department_id
    WHERE c.end_date IS NOT NULL
      AND c.end_date <= CURRENT_DATE + INTERVAL '1 day' * $1
      AND c.end_date >= CURRENT_DATE
      AND c.status = 'ACTIVE'
      AND c.tenant_id = $2
      AND e.tenant_id = $2
    ORDER BY c.end_date ASC
  `, [daysAhead, tenantId]);

  return result.rows;
}

export default {
  createDocument,
  getEmployeeDocuments,
  deleteDocument,
  getExpiringDocuments,
  createContract,
  getEmployeeContracts,
  terminateContract,
  getExpiringContracts,
  DOCUMENT_TYPES,
  CONTRACT_TYPES,
};
