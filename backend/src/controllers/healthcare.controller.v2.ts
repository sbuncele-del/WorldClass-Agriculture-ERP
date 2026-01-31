/**
 * Healthcare Controller V2
 * Tenant-hardened API for healthcare/medical facility operations
 * 
 * Features:
 * - Facility operations & KPIs
 * - Patient management & journey tracking
 * - Staff management & scheduling
 * - Medical equipment tracking
 * - Inventory management
 * - GoodX integration
 * - Clinical workflows (vitals, triage, labs)
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import { pool } from '../config/database';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// FACILITY OPERATIONS CENTER
// ============================================================================

/**
 * Get Facility Operations Status - Real-time overview
 */
export const getFacilityOperationsStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    // Get facility info
    const facilityResult = await pool.query(
      `SELECT facility_id, facility_name, facility_code, facility_type, status
       FROM healthcare_facilities
       WHERE tenant_id = $1 AND facility_id = $2`,
      [tenantId, facilityId]
    );

    if (facilityResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const facility = facilityResult.rows[0];

    // Get active patient count
    const patientCountResult = await pool.query(
      `SELECT COUNT(*) as active_patients
       FROM patient_visits pv
       JOIN healthcare_facilities hf ON pv.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND pv.facility_id = $2
       AND pv.status IN ('CHECKED_IN', 'IN_TRIAGE', 'WAITING', 'IN_CONSULTATION', 'IN_TREATMENT')
       AND pv.visit_date = CURRENT_DATE`,
      [tenantId, facilityId]
    );

    // Get critical alerts
    const alertsResult = await pool.query(
      `SELECT alert_type, COUNT(*) as count
       FROM facility_alerts fa
       JOIN healthcare_facilities hf ON fa.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND fa.facility_id = $2
       AND fa.status = 'ACTIVE'
       AND fa.severity IN ('CRITICAL', 'HIGH')
       GROUP BY alert_type`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        facility,
        activePatients: parseInt(patientCountResult.rows[0]?.active_patients || '0'),
        criticalAlerts: alertsResult.rows,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Facility operations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch facility operations status' });
  }
};

/**
 * Get Facility KPIs
 */
export const getFacilityKPIs = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT *
       FROM healthcare_facility_kpis hfk
       JOIN healthcare_facilities hf ON hfk.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND hfk.facility_id = $2
       AND hfk.metric_date >= $3 AND hfk.metric_date <= $4
       ORDER BY hfk.metric_date DESC`,
      [tenantId, facilityId, start, end]
    );

    res.json({ success: true, data: { kpis: result.rows, period: { start, end } } });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Facility KPIs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch facility KPIs' });
  }
};

/**
 * Get Today's Appointments
 */
export const getTodayAppointments = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT a.*,
              hp.first_name as patient_first_name,
              hp.last_name as patient_last_name,
              hp.medical_record_number
       FROM appointments a
       JOIN healthcare_patients hp ON a.patient_id = hp.patient_id
       JOIN healthcare_facilities hf ON a.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND a.facility_id = $2
       AND a.appointment_date = CURRENT_DATE
       ORDER BY a.appointment_time`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        appointments: result.rows,
        summary: {
          total: result.rows.length,
          completed: result.rows.filter((a: any) => a.status === 'COMPLETED').length,
          pending: result.rows.filter((a: any) => a.status === 'SCHEDULED').length,
          noShow: result.rows.filter((a: any) => a.status === 'NO_SHOW').length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
};

// ============================================================================
// PATIENT MANAGEMENT
// ============================================================================

/**
 * Get All Patients
 */
export const getPatients = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { search, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT hp.*, COUNT(*) OVER() as total_count
      FROM healthcare_patients hp
      WHERE hp.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (facilityId) {
      query += ` AND hp.primary_facility_id = $${paramIndex}`;
      params.push(facilityId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (hp.first_name ILIKE $${paramIndex} OR hp.last_name ILIKE $${paramIndex} OR hp.medical_record_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND hp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY hp.last_name, hp.first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        patients: result.rows,
        total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
};

/**
 * Get Patient by ID
 */
export const getPatient = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { patientId } = req.params;

    const result = await pool.query(
      `SELECT * FROM healthcare_patients WHERE tenant_id = $1 AND patient_id = $2`,
      [tenantId, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get patient error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patient' });
  }
};

/**
 * Create Patient
 */
/**
 * Create Patient
 * DB Columns: patient_id, tenant_id, facility_id, medical_record_number, first_name, last_name,
 * id_number, date_of_birth, gender, phone, email, address, medical_aid_name, medical_aid_number,
 * status, created_at, updated_at, primary_facility_id
 */
export const createPatient = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      medical_record_number, first_name, last_name, id_number,
      date_of_birth, gender, phone, email, address,
      medical_aid_name, medical_aid_number, facility_id, primary_facility_id
    } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'first_name and last_name are required' });
    }

    const result = await pool.query(
      `INSERT INTO healthcare_patients (
        tenant_id, medical_record_number, first_name, last_name, id_number,
        date_of_birth, gender, phone, email, address,
        medical_aid_name, medical_aid_number, facility_id, primary_facility_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tenantId, medical_record_number || null, first_name, last_name, id_number || null,
        date_of_birth || null, gender || null, phone || null, email || null, address || null,
        medical_aid_name || null, medical_aid_number || null, 
        facility_id || null, primary_facility_id || null
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create patient error:', error);
    res.status(500).json({ success: false, error: 'Failed to create patient' });
  }
};

/**
 * Update Patient
 */
export const updatePatient = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { patientId } = req.params;
    const updates = req.body;

    const allowedFields = [
      'first_name', 'last_name', 'phone', 'email', 'address',
      'emergency_contact_name', 'emergency_contact_phone',
      'insurance_provider', 'insurance_policy_number',
      'allergies', 'chronic_conditions', 'current_medications', 'status'
    ];

    const updateFields: string[] = [];
    const values: any[] = [tenantId, patientId];
    let paramIndex = 3;

    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await pool.query(
      `UPDATE healthcare_patients SET ${updateFields.join(', ')} WHERE tenant_id = $1 AND patient_id = $2 RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update patient error:', error);
    res.status(500).json({ success: false, error: 'Failed to update patient' });
  }
};

// ============================================================================
// PATIENT JOURNEY TRACKING
// ============================================================================

/**
 * Get Active Patients in Facility (Real-time board)
 */
export const getActivePatientsInFacility = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT pv.*, hp.first_name, hp.last_name, hp.medical_record_number,
              EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - pv.check_in_time))/60 as wait_time_minutes
       FROM patient_visits pv
       JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
       JOIN healthcare_facilities hf ON pv.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND pv.facility_id = $2
       AND pv.visit_date = CURRENT_DATE
       AND pv.status NOT IN ('DISCHARGED', 'CANCELLED')
       ORDER BY
         CASE pv.priority
           WHEN 'EMERGENCY' THEN 1
           WHEN 'URGENT' THEN 2
           ELSE 3
         END,
         pv.check_in_time`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        patients: result.rows,
        summary: {
          total: result.rows.length,
          byStatus: result.rows.reduce((acc: any, p: any) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get active patients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active patients' });
  }
};

/**
 * Check In Patient
 */
export const checkInPatient = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { patientId, appointmentId, visitType, priority, chiefComplaint } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required' });
    }

    // Verify patient belongs to tenant
    const patientCheck = await pool.query(
      `SELECT patient_id FROM healthcare_patients WHERE tenant_id = $1 AND patient_id = $2`,
      [tenantId, patientId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const result = await pool.query(
      `INSERT INTO patient_visits (
        facility_id, patient_id, appointment_id, visit_type, priority,
        chief_complaint, status, check_in_time, checked_in_by
      ) VALUES ($1, $2, $3, $4, $5, $6, 'CHECKED_IN', CURRENT_TIMESTAMP, $7)
      RETURNING *`,
      [facilityId, patientId, appointmentId, visitType || 'WALK_IN', priority || 'NORMAL', chiefComplaint, userId]
    );

    // Update appointment if linked
    if (appointmentId) {
      await pool.query(
        `UPDATE appointments SET status = 'CHECKED_IN', updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $1`,
        [appointmentId]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Check in patient error:', error);
    res.status(500).json({ success: false, error: 'Failed to check in patient' });
  }
};

/**
 * Update Patient Journey Stage
 */
export const updatePatientJourneyStage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { visitId } = req.params;
    const { newStatus, notes, location } = req.body;

    const validStatuses = ['CHECKED_IN', 'IN_TRIAGE', 'WAITING', 'IN_CONSULTATION', 'IN_TREATMENT', 'DISCHARGED'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Verify visit belongs to tenant's facility
    const visitCheck = await pool.query(
      `SELECT pv.visit_id FROM patient_visits pv
       JOIN healthcare_facilities hf ON pv.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND pv.visit_id = $2`,
      [tenantId, visitId]
    );

    if (visitCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    const result = await pool.query(
      `UPDATE patient_visits 
       SET status = $1, current_location = COALESCE($2, current_location), 
           updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE visit_id = $4
       RETURNING *`,
      [newStatus, location, userId, visitId]
    );

    // Log journey event
    await pool.query(
      `INSERT INTO patient_journey_events (visit_id, event_type, new_status, notes, created_by)
       VALUES ($1, 'STATUS_CHANGE', $2, $3, $4)`,
      [visitId, newStatus, notes, userId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update patient journey error:', error);
    res.status(500).json({ success: false, error: 'Failed to update patient journey' });
  }
};

// ============================================================================
// STAFF MANAGEMENT
// ============================================================================

/**
 * Get Today's Staff Schedule
 */
export const getTodayStaffSchedule = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT hss.*, e.first_name, e.last_name, e.email
       FROM healthcare_staff_schedule hss
       JOIN employees e ON hss.employee_id = e.employee_id
       JOIN healthcare_facilities hf ON hss.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND hss.facility_id = $2
       AND hss.schedule_date = CURRENT_DATE
       ORDER BY hss.shift_start`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        schedule: result.rows,
        summary: {
          total: result.rows.length,
          byDepartment: result.rows.reduce((acc: any, s: any) => {
            acc[s.department] = (acc[s.department] || 0) + 1;
            return acc;
          }, {})
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get staff schedule error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff schedule' });
  }
};

/**
 * Get Staff Utilization
 */
export const getStaffUtilization = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await pool.query(
      `SELECT hsu.*,
              CASE 
                WHEN hsu.utilization_percentage > 100 THEN 'OVERWORKED'
                WHEN hsu.utilization_percentage >= 70 THEN 'OPTIMAL'
                WHEN hsu.utilization_percentage >= 50 THEN 'UNDERUTILIZED'
                ELSE 'VERY_LOW'
              END as utilization_status
       FROM healthcare_staff_utilization hsu
       JOIN healthcare_facilities hf ON hsu.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND hsu.facility_id = $2
       AND ($3::date IS NULL OR hsu.metric_date >= $3)
       AND ($4::date IS NULL OR hsu.metric_date <= $4)
       ORDER BY hsu.metric_date DESC, hsu.utilization_percentage DESC`,
      [tenantId, facilityId, startDate || null, endDate || null]
    );

    res.json({
      success: true,
      data: {
        utilizationData: result.rows,
        summary: {
          averageUtilization: result.rows.length > 0
            ? (result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.utilization_percentage || 0), 0) / result.rows.length).toFixed(2)
            : 0,
          overworkedStaff: result.rows.filter((r: any) => r.utilization_status === 'OVERWORKED').length,
          optimalStaff: result.rows.filter((r: any) => r.utilization_status === 'OPTIMAL').length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get staff utilization error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff utilization' });
  }
};

// ============================================================================
// MEDICAL EQUIPMENT
// ============================================================================

/**
 * Get Medical Equipment Status
 */
export const getMedicalEquipmentStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT he.*,
              CASE 
                WHEN he.operational_status = 'DOWN' AND he.is_critical THEN 'CRITICAL_DOWN'
                WHEN he.operational_status = 'DOWN' THEN 'DOWN'
                WHEN he.operational_status = 'MAINTENANCE' THEN 'MAINTENANCE'
                WHEN he.next_maintenance_date < CURRENT_DATE THEN 'MAINTENANCE_OVERDUE'
                ELSE 'OPERATIONAL'
              END as equipment_status_flag
       FROM healthcare_equipment he
       JOIN healthcare_facilities hf ON he.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND he.facility_id = $2
       ORDER BY he.is_critical DESC, he.equipment_name`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        equipment: result.rows,
        summary: {
          total: result.rows.length,
          operational: result.rows.filter((e: any) => e.equipment_status_flag === 'OPERATIONAL').length,
          down: result.rows.filter((e: any) => e.equipment_status_flag === 'DOWN' || e.equipment_status_flag === 'CRITICAL_DOWN').length,
          criticalDown: result.rows.filter((e: any) => e.equipment_status_flag === 'CRITICAL_DOWN').length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get equipment status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch equipment status' });
  }
};

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

/**
 * Get Inventory Status
 */
export const getInventoryStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT mii.*,
              CASE 
                WHEN mii.current_stock <= 0 THEN 'OUT_OF_STOCK'
                WHEN mii.current_stock <= mii.minimum_stock THEN 'CRITICAL'
                WHEN mii.current_stock <= mii.reorder_level THEN 'LOW'
                WHEN mii.current_stock >= mii.maximum_stock THEN 'OVERSTOCKED'
                ELSE 'ADEQUATE'
              END as stock_status
       FROM medical_inventory_items mii
       JOIN healthcare_facilities hf ON mii.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND mii.facility_id = $2
       ORDER BY 
         CASE WHEN mii.current_stock <= mii.minimum_stock THEN 1 ELSE 2 END,
         mii.is_critical DESC`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary: {
          total: result.rows.length,
          outOfStock: result.rows.filter((i: any) => i.stock_status === 'OUT_OF_STOCK').length,
          critical: result.rows.filter((i: any) => i.stock_status === 'CRITICAL').length,
          low: result.rows.filter((i: any) => i.stock_status === 'LOW').length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get inventory status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory status' });
  }
};

/**
 * Get Inventory Alerts
 */
export const getInventoryAlerts = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const result = await pool.query(
      `SELECT mia.*, mii.item_name, mii.item_category
       FROM medical_inventory_alerts mia
       JOIN medical_inventory_items mii ON mia.item_id = mii.item_id
       JOIN healthcare_facilities hf ON mia.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND mia.facility_id = $2 AND mia.status = 'ACTIVE'
       ORDER BY 
         CASE mia.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END`,
      [tenantId, facilityId]
    );

    res.json({
      success: true,
      data: {
        alerts: result.rows,
        summary: {
          total: result.rows.length,
          critical: result.rows.filter((a: any) => a.severity === 'CRITICAL').length,
          high: result.rows.filter((a: any) => a.severity === 'HIGH').length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get inventory alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory alerts' });
  }
};

/**
 * Create Reorder Request
 */
export const createReorderRequest = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { itemId, requestedQuantity, supplierName, urgencyLevel, reorderReason } = req.body;

    // Get item details
    const itemResult = await pool.query(
      `SELECT * FROM medical_inventory_items mii
       JOIN healthcare_facilities hf ON mii.facility_id = hf.facility_id
       WHERE hf.tenant_id = $1 AND mii.item_id = $2 AND mii.facility_id = $3`,
      [tenantId, itemId, facilityId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = itemResult.rows[0];
    const estimatedCost = parseFloat(item.unit_cost) * requestedQuantity;

    const result = await pool.query(
      `INSERT INTO medical_inventory_reorders (
        facility_id, item_id, reorder_type, requested_quantity,
        estimated_cost, supplier_name, urgency_level,
        reorder_reason, requested_by, approval_required
      ) VALUES ($1, $2, 'MANUAL', $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        facilityId, itemId, requestedQuantity, estimatedCost,
        supplierName || item.preferred_supplier,
        urgencyLevel || 'NORMAL',
        reorderReason, userId,
        urgencyLevel !== 'URGENT'
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create reorder request error:', error);
    res.status(500).json({ success: false, error: 'Failed to create reorder request' });
  }
};

// ============================================================================
// CLINICAL WORKFLOWS
// ============================================================================

/**
 * Record Patient Vitals
 */
export const recordVitals = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { patientId } = req.params;
    const {
      visitId, bloodPressureSystolic, bloodPressureDiastolic,
      heartRate, temperatureCelsius, respiratoryRate,
      oxygenSaturation, bloodGlucose, weightKg, heightCm,
      painScale, consciousnessLevel, notes
    } = req.body;

    // Verify patient belongs to tenant
    const patientCheck = await pool.query(
      `SELECT patient_id FROM healthcare_patients WHERE tenant_id = $1 AND patient_id = $2`,
      [tenantId, patientId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    // Calculate BMI
    let bmi = null;
    if (weightKg && heightCm) {
      const heightM = heightCm / 100;
      bmi = weightKg / (heightM * heightM);
    }

    // Check for alert flags
    const alertFlags: string[] = [];
    if (bloodPressureSystolic > 140 || bloodPressureDiastolic > 90) alertFlags.push('HIGH_BP');
    if (oxygenSaturation < 95) alertFlags.push('LOW_O2');
    if (temperatureCelsius > 38) alertFlags.push('FEVER');
    if (heartRate > 100) alertFlags.push('TACHYCARDIA');

    const result = await pool.query(
      `INSERT INTO patient_vitals (
        patient_id, visit_id, recorded_by,
        blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature_celsius, respiratory_rate,
        oxygen_saturation, blood_glucose, weight_kg, height_cm, bmi,
        pain_scale, consciousness_level, alert_flags, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        patientId, visitId, userId,
        bloodPressureSystolic, bloodPressureDiastolic,
        heartRate, temperatureCelsius, respiratoryRate,
        oxygenSaturation, bloodGlucose, weightKg, heightCm, bmi,
        painScale, consciousnessLevel,
        alertFlags.length > 0 ? JSON.stringify(alertFlags) : null,
        notes
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        vitals: result.rows[0],
        alerts: alertFlags
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Record vitals error:', error);
    res.status(500).json({ success: false, error: 'Failed to record vitals' });
  }
};

/**
 * Create Triage Assessment
 */
export const createTriage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { patientId } = req.params;
    const {
      visitId, triagePriority, chiefComplaint, symptoms,
      vitalSigns, triageNotes, recommendedDepartment,
      estimatedWaitTimeMinutes
    } = req.body;

    // Verify patient
    const patientCheck = await pool.query(
      `SELECT patient_id FROM healthcare_patients WHERE tenant_id = $1 AND patient_id = $2`,
      [tenantId, patientId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const result = await pool.query(
      `INSERT INTO patient_triage (
        patient_id, visit_id, triaged_by, triage_priority,
        chief_complaint, symptoms, vital_signs, triage_notes,
        recommended_department, estimated_wait_time_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        patientId, visitId, userId, triagePriority,
        chiefComplaint, symptoms, vitalSigns, triageNotes,
        recommendedDepartment, estimatedWaitTimeMinutes
      ]
    );

    // Update visit status
    if (visitId) {
      await pool.query(
        `UPDATE patient_visits SET status = 'IN_TRIAGE', updated_at = CURRENT_TIMESTAMP WHERE visit_id = $1`,
        [visitId]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create triage error:', error);
    res.status(500).json({ success: false, error: 'Failed to create triage' });
  }
};

/**
 * Create Lab Order
 */
export const createLabOrder = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { patientId } = req.params;
    const { visitId, testCode, testName, priority, specialInstructions } = req.body;

    // Verify patient
    const patientCheck = await pool.query(
      `SELECT patient_id FROM healthcare_patients WHERE tenant_id = $1 AND patient_id = $2`,
      [tenantId, patientId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const result = await pool.query(
      `INSERT INTO lab_orders (
        patient_id, visit_id, test_code, test_name,
        ordered_by, priority, special_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [patientId, visitId, testCode, testName, userId, priority || 'ROUTINE', specialInstructions]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create lab order error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lab order' });
  }
};

// ============================================================================
// GOODX INTEGRATION
// ============================================================================

/**
 * Get GoodX Revenue Transactions
 */
export const getGoodXRevenue = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;
    const { startDate, endDate, syncStatus } = req.query;

    let query = `
      SELECT grc.*, hp.first_name, hp.last_name
      FROM goodx_revenue_capture grc
      LEFT JOIN healthcare_patients hp ON grc.patient_id = hp.patient_id
      JOIN healthcare_facilities hf ON grc.facility_id = hf.facility_id
      WHERE hf.tenant_id = $1 AND grc.facility_id = $2
    `;
    const params: any[] = [tenantId, facilityId];
    let paramIndex = 3;

    if (startDate) {
      query += ` AND grc.transaction_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      query += ` AND grc.transaction_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    if (syncStatus === 'pending') {
      query += ` AND grc.synced_to_erp = false`;
    } else if (syncStatus === 'synced') {
      query += ` AND grc.synced_to_erp = true`;
    }

    query += ` ORDER BY grc.transaction_date DESC LIMIT 100`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        summary: {
          total: result.rows.length,
          totalRevenue: result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.net_amount || 0), 0).toFixed(2),
          pendingSync: result.rows.filter((r: any) => !r.synced_to_erp).length
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get GoodX revenue error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GoodX revenue' });
  }
};

/**
 * Get GoodX Sync Status
 */
export const getGoodXSyncStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { facilityId } = req.params;

    const configResult = await pool.query(
      `SELECT * FROM goodx_integration_config WHERE tenant_id = $1 AND facility_id = $2`,
      [tenantId, facilityId]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'GoodX integration not configured' });
    }

    const logsResult = await pool.query(
      `SELECT * FROM goodx_sync_logs WHERE facility_id = $1 ORDER BY sync_started_at DESC LIMIT 10`,
      [facilityId]
    );

    res.json({
      success: true,
      data: {
        config: configResult.rows[0],
        recentSyncs: logsResult.rows,
        isConnected: configResult.rows[0].connection_status === 'CONNECTED'
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get GoodX sync status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GoodX sync status' });
  }
};

// ============================================================================
// FACILITIES
// ============================================================================

/**
 * Get all facilities
 */
export const getFacilities = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT * FROM healthcare_facilities WHERE tenant_id = $1 ORDER BY facility_name`,
      [tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get facilities error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch facilities' });
  }
};

/**
 * Create a new healthcare facility
 * DB Columns: facility_id, tenant_id, facility_code, facility_name, facility_type, status, 
 * address_line1, city, province, phone, email, total_beds, is_active, created_at, updated_at
 */
export const createFacility = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      facility_code, facility_name, facility_type, address_line1,
      city, province, phone, email, total_beds, status
    } = req.body;

    if (!facility_code || !facility_name || !facility_type) {
      return res.status(400).json({ success: false, error: 'facility_code, facility_name and facility_type are required' });
    }

    const result = await pool.query(
      `INSERT INTO healthcare_facilities (
        tenant_id, facility_code, facility_name, facility_type, status, address_line1,
        city, province, phone, email, total_beds
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [tenantId, facility_code, facility_name, facility_type, status || 'ACTIVE', address_line1 || null,
       city || null, province || null, phone || null, email || null, total_beds || 0]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ success: false, error: 'Facility code already exists' });
    }
    console.error('Create facility error:', error);
    res.status(500).json({ success: false, error: 'Failed to create facility' });
  }
};

/**
 * Get all patients (flat route for frontend)
 */
export const getAllPatients = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { search, limit = 50, offset = 0 } = req.query;

    let query = `SELECT * FROM healthcare_patients WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR id_number ILIKE $${paramIndex} OR medical_record_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY last_name, first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get all patients error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch patients' });
  }
};

/**
 * Get all appointments (flat route for frontend)
 */
export const getAllAppointments = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { date, status, limit = 50 } = req.query;

    let query = `
      SELECT a.*, 
        p.first_name as patient_first_name, 
        p.last_name as patient_last_name,
        f.facility_name
      FROM healthcare_appointments a
      LEFT JOIN healthcare_patients p ON a.patient_id = p.patient_id
      JOIN healthcare_facilities f ON a.facility_id = f.facility_id
      WHERE f.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (date) {
      query += ` AND a.appointment_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get all appointments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
  }
};

/**
 * Create an appointment
 */
/**
 * Create Appointment
 * DB Columns: appointment_id, facility_id, patient_id, goodx_appointment_id, appointment_date,
 * appointment_time, appointment_type, duration_minutes, provider_name, provider_id, department,
 * room_number, status, reason_for_visit, notes, created_at, updated_at
 */
export const createAppointment = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const {
      patient_id, facility_id, provider_id, provider_name, appointment_date, appointment_time,
      duration_minutes, appointment_type, reason_for_visit, notes, department, room_number
    } = req.body;

    if (!patient_id || !facility_id || !appointment_date || !appointment_time || !appointment_type) {
      return res.status(400).json({ success: false, error: 'patient_id, facility_id, appointment_date, appointment_time and appointment_type are required' });
    }

    // Verify facility belongs to tenant
    const facilityCheck = await pool.query(
      `SELECT facility_id FROM healthcare_facilities WHERE facility_id = $1 AND tenant_id = $2`,
      [facility_id, tenantId]
    );
    if (facilityCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facility not found' });
    }

    const result = await pool.query(
      `INSERT INTO healthcare_appointments (
        facility_id, patient_id, provider_id, provider_name, appointment_date, appointment_time,
        duration_minutes, appointment_type, reason_for_visit, notes, department, room_number, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SCHEDULED')
      RETURNING *`,
      [facility_id, patient_id, provider_id || null, provider_name || null, appointment_date, appointment_time,
       duration_minutes || 30, appointment_type, reason_for_visit || null, notes || null, 
       department || null, room_number || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, error: 'Failed to create appointment' });
  }
};

/**
 * Get healthcare dashboard
 */
export const getHealthcareDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);

    // Get facility count
    const facilitiesCount = await pool.query(
      `SELECT COUNT(*) as count FROM healthcare_facilities WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get patient count
    const patientsCount = await pool.query(
      `SELECT COUNT(*) as count FROM healthcare_patients WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get today's appointments count (join through facilities for tenant)
    const appointmentsCount = await pool.query(
      `SELECT COUNT(*) as count FROM healthcare_appointments a
       JOIN healthcare_facilities f ON a.facility_id = f.facility_id
       WHERE f.tenant_id = $1 AND a.appointment_date = CURRENT_DATE`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        totalFacilities: parseInt(facilitiesCount.rows[0]?.count || '0'),
        totalPatients: parseInt(patientsCount.rows[0]?.count || '0'),
        todayAppointments: parseInt(appointmentsCount.rows[0]?.count || '0'),
        summary: {
          facilities: parseInt(facilitiesCount.rows[0]?.count || '0'),
          patients: parseInt(patientsCount.rows[0]?.count || '0'),
          appointments: parseInt(appointmentsCount.rows[0]?.count || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get healthcare dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch healthcare dashboard' });
  }
};

/**
 * Get all invoices
 */
export const getInvoices = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, limit = 50 } = req.query;

    // For now return empty array - invoices table would need to be created
    // This allows frontend to function without errors
    res.json({ success: true, data: [], total: 0 });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
};

/**
 * Get all claims
 */
export const getClaims = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    
    // For now return empty array - claims table would need to be created
    res.json({ success: true, data: [], total: 0 });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get claims error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch claims' });
  }
};

/**
 * Get medical aid schemes
 */
export const getSchemes = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    
    // Return common South African medical aid schemes
    const schemes = [
      { id: '1', name: 'Discovery Health', code: 'DIS', administrator: 'Discovery', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 14 },
      { id: '2', name: 'Medscheme', code: 'MED', administrator: 'Medscheme', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 21 },
      { id: '3', name: 'GEMS', code: 'GEM', administrator: 'Metropolitan Health', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 30 },
      { id: '4', name: 'Bonitas', code: 'BON', administrator: 'Medscheme', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 21 },
      { id: '5', name: 'Momentum Health', code: 'MOM', administrator: 'Momentum', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 18 },
      { id: '6', name: 'Fedhealth', code: 'FED', administrator: 'Medscheme', activePatients: 0, outstandingClaims: 0, avgPaymentDays: 21 }
    ];
    
    res.json({ success: true, data: schemes });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get schemes error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schemes' });
  }
};

/**
 * Get practitioners
 */
export const getPractitioners = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    
    // Return empty array for now - practitioners table may not exist
    res.json({ success: true, data: [] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get practitioners error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch practitioners' });
  }
};

export default {
  // Facility Operations
  getFacilityOperationsStatus,
  getFacilityKPIs,
  getTodayAppointments,
  getFacilities,
  createFacility,
  // Patient Management
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  getAllPatients,
  // Appointments
  getAllAppointments,
  createAppointment,
  // Invoices & Claims
  getInvoices,
  getClaims,
  getSchemes,
  getPractitioners,
  // Patient Journey
  getActivePatientsInFacility,
  checkInPatient,
  updatePatientJourneyStage,
  // Staff
  getTodayStaffSchedule,
  getStaffUtilization,
  // Equipment
  getMedicalEquipmentStatus,
  // Inventory
  getInventoryStatus,
  getInventoryAlerts,
  createReorderRequest,
  // Clinical Workflows
  recordVitals,
  createTriage,
  createLabOrder,
  // GoodX Integration
  getGoodXRevenue,
  getGoodXSyncStatus,
  // Dashboard
  getHealthcareDashboard
};
