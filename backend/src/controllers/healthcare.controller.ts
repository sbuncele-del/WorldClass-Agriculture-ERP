/**
 * Healthcare Operations Controller
 * Operational Intelligence for Healthcare Facilities
 * Focus: Proactive management, not just data storage
 */

import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * ================================================
 * OPERATIONS COMMAND CENTER
 * ================================================
 */

/**
 * Get Live Facility Status - Operations Command Center
 * Real-time operational state with actionable insights
 */
export const getFacilityOperationsStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        // Get latest operational status
        const statusResult = await pool.query(
            `SELECT 
                fos.*,
                hf.facility_name,
                hf.total_beds,
                hf.total_consultation_rooms
            FROM facility_operational_status fos
            JOIN healthcare_facilities hf ON fos.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1 AND fos.facility_id = $2
            ORDER BY fos.snapshot_time DESC
            LIMIT 1`,
            [tenantId, facilityId]
        );

        if (statusResult.rows.length === 0) {
            return res.status(404).json({ error: 'Facility status not found' });
        }

        const status = statusResult.rows[0];

        // Get critical alerts
        const alertsResult = await pool.query(
            `SELECT alert_type, severity, message, suggested_action
             FROM medical_inventory_alerts
             WHERE facility_id = $1 AND status = 'ACTIVE'
             AND severity IN ('HIGH', 'CRITICAL')
             ORDER BY 
                CASE severity 
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    ELSE 3
                END,
                created_at DESC
             LIMIT 10`,
            [facilityId]
        );

        // Get bottlenecks
        const bottlenecksResult = await pool.query(
            `SELECT bottleneck_type, severity, description, ai_suggestion, affected_patients_count
             FROM patient_flow_bottlenecks
             WHERE facility_id = $1 AND status = 'ACTIVE'
             ORDER BY 
                CASE severity 
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END
             LIMIT 5`,
            [facilityId]
        );

        // Get today's priorities (appointments, pending requests)
        const prioritiesResult = await pool.query(
            `SELECT 
                'APPOINTMENT' as type,
                COUNT(*) as count,
                STRING_AGG(DISTINCT status, ', ') as statuses
             FROM healthcare_appointments
             WHERE facility_id = $1 
             AND appointment_date = CURRENT_DATE
             AND status NOT IN ('COMPLETED', 'CANCELLED')
             
             UNION ALL
             
             SELECT 
                'SERVICE_REQUEST' as type,
                COUNT(*) as count,
                STRING_AGG(DISTINCT priority, ', ') as priorities
             FROM facility_service_requests
             WHERE facility_id = $1
             AND status NOT IN ('COMPLETED', 'CANCELLED')
             AND priority IN ('HIGH', 'URGENT')`,
            [facilityId]
        );

        res.json({
            facility_status: status,
            critical_alerts: alertsResult.rows,
            active_bottlenecks: bottlenecksResult.rows,
            today_priorities: prioritiesResult.rows,
            command_center_summary: {
                overall_status: status.overall_status,
                requires_immediate_action: 
                    alertsResult.rows.length > 0 || 
                    bottlenecksResult.rows.length > 0,
                action_items_count: 
                    alertsResult.rows.length + 
                    bottlenecksResult.rows.length
            }
        });
    } catch (error: any) {
        console.error('Error fetching facility operations status:', error);
        res.status(500).json({ error: 'Failed to fetch operations status' });
    }
};

/**
 * Get Facility KPIs Dashboard
 */
export const getFacilityKPIs = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { startDate, endDate } = req.query;

        const result = await pool.query(
            `SELECT 
                kpi_date,
                total_patients_seen,
                average_wait_time_minutes,
                average_bed_occupancy_percentage,
                average_staff_utilization_percentage,
                revenue_captured,
                patient_satisfaction_score
            FROM facility_operational_kpis fok
            JOIN healthcare_facilities hf ON fok.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1 AND fok.facility_id = $2
            AND ($3::date IS NULL OR kpi_date >= $3)
            AND ($4::date IS NULL OR kpi_date <= $4)
            ORDER BY kpi_date DESC
            LIMIT 30`,
            [tenantId, facilityId, startDate || null, endDate || null]
        );

        // Calculate trends
        const kpis = result.rows;
        const trends = kpis.length > 1 ? {
            patients_trend: calculateTrend(kpis.map(k => k.total_patients_seen)),
            wait_time_trend: calculateTrend(kpis.map(k => k.average_wait_time_minutes)),
            bed_occupancy_trend: calculateTrend(kpis.map(k => k.average_bed_occupancy_percentage)),
            revenue_trend: calculateTrend(kpis.map(k => parseFloat(k.revenue_captured)))
        } : null;

        res.json({
            kpis: kpis,
            trends: trends,
            summary: kpis.length > 0 ? {
                latest_date: kpis[0].kpi_date,
                total_patients: kpis.reduce((sum, k) => sum + k.total_patients_seen, 0),
                avg_wait_time: (kpis.reduce((sum, k) => sum + parseFloat(k.average_wait_time_minutes), 0) / kpis.length).toFixed(2),
                avg_bed_occupancy: (kpis.reduce((sum, k) => sum + parseFloat(k.average_bed_occupancy_percentage), 0) / kpis.length).toFixed(2),
                total_revenue: kpis.reduce((sum, k) => sum + parseFloat(k.revenue_captured), 0).toFixed(2)
            } : null
        });
    } catch (error: any) {
        console.error('Error fetching facility KPIs:', error);
        res.status(500).json({ error: 'Failed to fetch KPIs' });
    }
};

/**
 * ================================================
 * PATIENT JOURNEY MANAGEMENT
 * ================================================
 */

/**
 * Get Today's Appointments - Live Schedule
 */
export const getTodayAppointments = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                ha.*,
                hp.first_name,
                hp.last_name,
                hp.phone,
                hp.medical_aid_name,
                CASE 
                    WHEN ha.status = 'CHECKED_IN' THEN 'checked_in'
                    WHEN ha.appointment_time < CURRENT_TIME - INTERVAL '15 minutes' 
                         AND ha.status = 'SCHEDULED' THEN 'late'
                    WHEN ha.appointment_time < CURRENT_TIME + INTERVAL '30 minutes' THEN 'upcoming'
                    ELSE 'scheduled'
                END as appointment_status_flag
            FROM healthcare_appointments ha
            JOIN healthcare_patients hp ON ha.patient_id = hp.patient_id
            JOIN healthcare_facilities hf ON ha.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1 
            AND ha.facility_id = $2
            AND ha.appointment_date = CURRENT_DATE
            AND ha.status NOT IN ('COMPLETED', 'CANCELLED')
            ORDER BY ha.appointment_time`,
            [tenantId, facilityId]
        );

        res.json({
            appointments: result.rows,
            summary: {
                total: result.rows.length,
                checked_in: result.rows.filter(a => a.status === 'CHECKED_IN').length,
                waiting: result.rows.filter(a => a.appointment_status_flag === 'scheduled').length,
                late: result.rows.filter(a => a.appointment_status_flag === 'late').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching today appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};

/**
 * Get Active Patients in Facility - Real-time Patient Flow
 */
export const getActivePatientsInFacility = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                hp.patient_id,
                hp.first_name,
                hp.last_name,
                pjt.stage as current_stage,
                pjt.current_location,
                pjt.stage_start_time,
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - pjt.stage_start_time))/60 as minutes_in_stage,
                ha.provider_name,
                ha.appointment_type
            FROM patient_journey_tracking pjt
            JOIN healthcare_patients hp ON pjt.patient_id = hp.patient_id
            JOIN healthcare_facilities hf ON pjt.facility_id = hf.facility_id
            LEFT JOIN healthcare_appointments ha ON pjt.appointment_id = ha.appointment_id
            WHERE hf.tenant_id = $1
            AND pjt.facility_id = $2
            AND pjt.visit_date = CURRENT_DATE
            AND pjt.is_current_stage = true
            AND pjt.stage NOT IN ('COMPLETED', 'CHECKOUT')
            ORDER BY pjt.stage_start_time`,
            [tenantId, facilityId]
        );

        // Group by stage
        const byStage: any = {};
        result.rows.forEach((patient: any) => {
            const stage = patient.current_stage;
            if (!byStage[stage]) {
                byStage[stage] = [];
            }
            byStage[stage].push(patient);
        });

        res.json({
            active_patients: result.rows,
            by_stage: byStage,
            summary: {
                total_active: result.rows.length,
                stage_counts: Object.keys(byStage).map(stage => ({
                    stage,
                    count: byStage[stage].length
                }))
            }
        });
    } catch (error: any) {
        console.error('Error fetching active patients:', error);
        res.status(500).json({ error: 'Failed to fetch active patients' });
    }
};

/**
 * Get Patient Flow Bottlenecks - AI-Detected Issues
 */
export const getPatientFlowBottlenecks = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                pfb.*,
                hf.facility_name
            FROM patient_flow_bottlenecks pfb
            JOIN healthcare_facilities hf ON pfb.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND pfb.facility_id = $2
            AND pfb.status = 'ACTIVE'
            ORDER BY 
                CASE pfb.severity 
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                pfb.detected_at DESC`,
            [tenantId, facilityId]
        );

        res.json({
            bottlenecks: result.rows,
            summary: {
                total_active: result.rows.length,
                critical: result.rows.filter((b: any) => b.severity === 'CRITICAL').length,
                high: result.rows.filter((b: any) => b.severity === 'HIGH').length,
                total_affected_patients: result.rows.reduce((sum: number, b: any) => sum + (b.affected_patients_count || 0), 0)
            }
        });
    } catch (error: any) {
        console.error('Error fetching bottlenecks:', error);
        res.status(500).json({ error: 'Failed to fetch bottlenecks' });
    }
};

/**
 * Check-in Patient
 */
export const checkInPatient = async (req: Request, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const tenantId = (req as any).user.tenantId;

        // Update appointment
        const appointmentResult = await pool.query(
            `UPDATE healthcare_appointments ha
             SET status = 'CHECKED_IN', check_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             FROM healthcare_facilities hf
             WHERE ha.facility_id = hf.facility_id
             AND hf.tenant_id = $1
             AND ha.appointment_id = $2
             RETURNING ha.*, hf.facility_id`,
            [tenantId, appointmentId]
        );

        if (appointmentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const appointment = appointmentResult.rows[0];

        // Create patient journey tracking
        await pool.query(
            `INSERT INTO patient_journey_tracking (
                facility_id, patient_id, appointment_id, visit_date, 
                stage, current_location, is_current_stage
            ) VALUES ($1, $2, $3, CURRENT_DATE, 'REGISTRATION', 'Reception', true)`,
            [appointment.facility_id, appointment.patient_id, appointmentId]
        );

        res.json({ 
            message: 'Patient checked in successfully',
            appointment: appointment
        });
    } catch (error: any) {
        console.error('Error checking in patient:', error);
        res.status(500).json({ error: 'Failed to check in patient' });
    }
};

/**
 * Update Patient Journey Stage
 */
export const updatePatientJourneyStage = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;
        const { stage, location, notes } = req.body;
        const tenantId = (req as any).user.tenantId;

        // End current stage
        await pool.query(
            `UPDATE patient_journey_tracking pjt
             SET is_current_stage = false, 
                 stage_end_time = CURRENT_TIMESTAMP,
                 stage_duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - stage_start_time))/60
             FROM healthcare_facilities hf
             WHERE pjt.facility_id = hf.facility_id
             AND hf.tenant_id = $1
             AND pjt.patient_id = $2
             AND pjt.visit_date = CURRENT_DATE
             AND pjt.is_current_stage = true`,
            [tenantId, patientId]
        );

        // Start new stage
        const result = await pool.query(
            `INSERT INTO patient_journey_tracking (
                facility_id, patient_id, visit_date, stage, current_location, 
                stage_notes, is_current_stage
            )
            SELECT hf.facility_id, $2, CURRENT_DATE, $3, $4, $5, true
            FROM healthcare_facilities hf
            WHERE hf.tenant_id = $1
            LIMIT 1
            RETURNING *`,
            [tenantId, patientId, stage, location || stage, notes]
        );

        res.json({
            message: 'Patient journey updated',
            journey: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error updating patient journey:', error);
        res.status(500).json({ error: 'Failed to update patient journey' });
    }
};

/**
 * ================================================
 * STAFF MANAGEMENT (Integrated with HR Module)
 * ================================================
 */

/**
 * Get Staff Schedule for Today - References HR Module
 */
export const getTodayStaffSchedule = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                hss.*,
                CASE 
                    WHEN hss.status = 'IN_PROGRESS' THEN 'on_duty'
                    WHEN hss.shift_start_time < CURRENT_TIME 
                         AND hss.status = 'SCHEDULED' THEN 'late'
                    WHEN hss.shift_start_time < CURRENT_TIME + INTERVAL '1 hour' THEN 'upcoming'
                    ELSE 'scheduled'
                END as shift_status_flag
            FROM healthcare_staff_schedules hss
            JOIN healthcare_facilities hf ON hss.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND hss.facility_id = $2
            AND hss.shift_date = CURRENT_DATE
            ORDER BY hss.shift_start_time`,
            [tenantId, facilityId]
        );

        // Group by department
        const byDepartment: any = {};
        result.rows.forEach((shift: any) => {
            const dept = shift.department || 'GENERAL';
            if (!byDepartment[dept]) {
                byDepartment[dept] = [];
            }
            byDepartment[dept].push(shift);
        });

        res.json({
            shifts: result.rows,
            by_department: byDepartment,
            summary: {
                total_scheduled: result.rows.length,
                on_duty: result.rows.filter((s: any) => s.status === 'IN_PROGRESS').length,
                upcoming: result.rows.filter((s: any) => s.shift_status_flag === 'upcoming').length,
                understaffed_departments: result.rows.filter((s: any) => s.is_understaffed).length
            }
        });
    } catch (error: any) {
        console.error('Error fetching staff schedule:', error);
        res.status(500).json({ error: 'Failed to fetch staff schedule' });
    }
};

/**
 * Get Staff Utilization (for operational insights)
 */
export const getStaffUtilization = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { startDate, endDate } = req.query;

        const result = await pool.query(
            `SELECT 
                hsu.*,
                CASE 
                    WHEN hsu.utilization_percentage > 90 THEN 'OVERWORKED'
                    WHEN hsu.utilization_percentage >= 70 THEN 'OPTIMAL'
                    WHEN hsu.utilization_percentage >= 50 THEN 'UNDERUTILIZED'
                    ELSE 'VERY_LOW'
                END as utilization_status
            FROM healthcare_staff_utilization hsu
            JOIN healthcare_facilities hf ON hsu.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND hsu.facility_id = $2
            AND ($3::date IS NULL OR hsu.metric_date >= $3)
            AND ($4::date IS NULL OR hsu.metric_date <= $4)
            ORDER BY hsu.metric_date DESC, hsu.utilization_percentage DESC`,
            [tenantId, facilityId, startDate || null, endDate || null]
        );

        res.json({
            utilization_data: result.rows,
            summary: {
                average_utilization: result.rows.length > 0 
                    ? (result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.utilization_percentage || 0), 0) / result.rows.length).toFixed(2)
                    : 0,
                overworked_staff: result.rows.filter((r: any) => r.utilization_status === 'OVERWORKED').length,
                optimal_staff: result.rows.filter((r: any) => r.utilization_status === 'OPTIMAL').length,
                underutilized_staff: result.rows.filter((r: any) => r.utilization_status === 'UNDERUTILIZED').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching staff utilization:', error);
        res.status(500).json({ error: 'Failed to fetch staff utilization' });
    }
};

/**
 * ================================================
 * EQUIPMENT MANAGEMENT (Integrated with Asset Management)
 * ================================================
 */

/**
 * Get Medical Equipment Status - References Asset Management
 */
export const getMedicalEquipmentStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                he.*,
                CASE 
                    WHEN he.operational_status = 'DOWN' AND he.is_critical THEN 'CRITICAL_DOWN'
                    WHEN he.operational_status = 'DOWN' THEN 'DOWN'
                    WHEN he.operational_status = 'MAINTENANCE' THEN 'MAINTENANCE'
                    WHEN he.next_maintenance_date < CURRENT_DATE THEN 'MAINTENANCE_OVERDUE'
                    WHEN he.next_maintenance_date < CURRENT_DATE + INTERVAL '7 days' THEN 'MAINTENANCE_DUE_SOON'
                    ELSE 'OPERATIONAL'
                END as equipment_status_flag
            FROM healthcare_equipment he
            JOIN healthcare_facilities hf ON he.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND he.facility_id = $2
            ORDER BY 
                CASE he.operational_status
                    WHEN 'DOWN' THEN 1
                    WHEN 'MAINTENANCE' THEN 2
                    ELSE 3
                END,
                he.is_critical DESC,
                he.equipment_name`,
            [tenantId, facilityId]
        );

        const byStatus: any = {
            OPERATIONAL: [],
            MAINTENANCE: [],
            DOWN: [],
            MAINTENANCE_OVERDUE: []
        };

        result.rows.forEach((equipment: any) => {
            const status = equipment.equipment_status_flag;
            if (status === 'CRITICAL_DOWN' || status === 'DOWN') {
                byStatus.DOWN.push(equipment);
            } else if (status === 'MAINTENANCE') {
                byStatus.MAINTENANCE.push(equipment);
            } else if (status === 'MAINTENANCE_OVERDUE' || status === 'MAINTENANCE_DUE_SOON') {
                byStatus.MAINTENANCE_OVERDUE.push(equipment);
            } else {
                byStatus.OPERATIONAL.push(equipment);
            }
        });

        res.json({
            equipment: result.rows,
            by_status: byStatus,
            summary: {
                total_equipment: result.rows.length,
                operational: byStatus.OPERATIONAL.length,
                down: byStatus.DOWN.length,
                critical_down: result.rows.filter((e: any) => e.equipment_status_flag === 'CRITICAL_DOWN').length,
                maintenance_overdue: byStatus.MAINTENANCE_OVERDUE.length
            }
        });
    } catch (error: any) {
        console.error('Error fetching medical equipment:', error);
        res.status(500).json({ error: 'Failed to fetch medical equipment' });
    }
};

/**
 * ================================================
 * FACILITY COMMUNICATIONS HUB
 * ================================================
 */

/**
 * Get Active Communications/Requests
 */
export const getFacilityCommunications = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const userId = (req as any).user.userId;

        const result = await pool.query(
            `SELECT 
                fc.*
            FROM facility_communications fc
            JOIN healthcare_facilities hf ON fc.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND fc.facility_id = $2
            AND (fc.to_user_id = $3 OR fc.from_user_id = $3 OR fc.to_user_id IS NULL)
            AND fc.status NOT IN ('CLOSED')
            ORDER BY 
                CASE fc.priority 
                    WHEN 'EMERGENCY' THEN 1
                    WHEN 'URGENT' THEN 2
                    WHEN 'HIGH' THEN 3
                    WHEN 'MEDIUM' THEN 4
                    ELSE 5
                END,
                fc.sent_at DESC
            LIMIT 50`,
            [tenantId, facilityId, userId]
        );

        res.json({
            communications: result.rows,
            summary: {
                total_active: result.rows.length,
                requires_action: result.rows.filter((c: any) => c.requires_action && c.status !== 'ACTIONED').length,
                emergency: result.rows.filter((c: any) => c.priority === 'EMERGENCY').length,
                unread: result.rows.filter((c: any) => !c.read_at).length
            }
        });
    } catch (error: any) {
        console.error('Error fetching communications:', error);
        res.status(500).json({ error: 'Failed to fetch communications' });
    }
};

/**
 * Get Service Requests
 */
export const getServiceRequests = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { status, priority } = req.query;

        let query = `
            SELECT 
                fsr.*,
                CASE 
                    WHEN fsr.expected_completion_time < CURRENT_TIMESTAMP 
                         AND fsr.status NOT IN ('COMPLETED', 'CANCELLED') THEN true
                    ELSE false
                END as is_overdue_calculated
            FROM facility_service_requests fsr
            JOIN healthcare_facilities hf ON fsr.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND fsr.facility_id = $2
        `;

        const params: any[] = [tenantId, facilityId];
        let paramIndex = 3;

        if (status) {
            query += ` AND fsr.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (priority) {
            query += ` AND fsr.priority = $${paramIndex}`;
            params.push(priority);
            paramIndex++;
        }

        query += ` ORDER BY 
            CASE fsr.priority 
                WHEN 'URGENT' THEN 1
                WHEN 'HIGH' THEN 2
                WHEN 'MEDIUM' THEN 3
                ELSE 4
            END,
            fsr.created_at DESC
            LIMIT 100`;

        const result = await pool.query(query, params);

        res.json({
            requests: result.rows,
            summary: {
                total: result.rows.length,
                pending: result.rows.filter((r: any) => r.status === 'PENDING').length,
                in_progress: result.rows.filter((r: any) => r.status === 'IN_PROGRESS').length,
                urgent: result.rows.filter((r: any) => r.priority === 'URGENT').length,
                overdue: result.rows.filter((r: any) => r.is_overdue_calculated).length
            }
        });
    } catch (error: any) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({ error: 'Failed to fetch service requests' });
    }
};

/**
 * Create Service Request
 */
export const createServiceRequest = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { facilityId } = req.params;
        const {
            request_type,
            request_category,
            subject,
            description,
            location,
            priority,
            urgency_reason
        } = req.body;

        const result = await pool.query(
            `INSERT INTO facility_service_requests (
                facility_id, request_type, request_category,
                requested_by, subject, description, location,
                priority, urgency_reason
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                facilityId, request_type, request_category,
                userId, subject, description, location,
                priority || 'MEDIUM', urgency_reason
            ]
        );

        res.status(201).json({
            message: 'Service request created',
            request: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating service request:', error);
        res.status(500).json({ error: 'Failed to create service request' });
    }
};

/**
 * ================================================
 * GOODX INTEGRATION & REVENUE CAPTURE
 * ================================================
 */

/**
 * Get GoodX Revenue Transactions (Auto-captured from GoodX)
 */
export const getGoodXRevenue = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { startDate, endDate, syncStatus } = req.query;

        let query = `
            SELECT 
                grc.*,
                hp.first_name,
                hp.last_name
            FROM goodx_revenue_capture grc
            LEFT JOIN healthcare_patients hp ON grc.patient_id = hp.patient_id
            JOIN healthcare_facilities hf ON grc.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND grc.facility_id = $2
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

        query += ` ORDER BY grc.transaction_date DESC, grc.created_at DESC LIMIT 100`;

        const result = await pool.query(query, params);

        res.json({
            revenue_transactions: result.rows,
            summary: {
                total_transactions: result.rows.length,
                total_revenue: result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.net_amount || 0), 0).toFixed(2),
                pending_sync: result.rows.filter((r: any) => !r.synced_to_erp).length,
                synced: result.rows.filter((r: any) => r.synced_to_erp).length,
                by_payment_method: result.rows.reduce((acc: any, r: any) => {
                    const method = r.payment_method || 'UNKNOWN';
                    acc[method] = (acc[method] || 0) + parseFloat(r.net_amount || 0);
                    return acc;
                }, {})
            }
        });
    } catch (error: any) {
        console.error('Error fetching GoodX revenue:', error);
        res.status(500).json({ error: 'Failed to fetch GoodX revenue' });
    }
};

/**
 * Get GoodX Sync Status
 */
export const getGoodXSyncStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        // Get config
        const configResult = await pool.query(
            `SELECT gic.*
             FROM goodx_integration_config gic
             WHERE gic.tenant_id = $1
             AND gic.facility_id = $2`,
            [tenantId, facilityId]
        );

        if (configResult.rows.length === 0) {
            return res.status(404).json({ error: 'GoodX integration not configured' });
        }

        // Get recent sync logs
        const logsResult = await pool.query(
            `SELECT *
             FROM goodx_sync_logs
             WHERE facility_id = $1
             ORDER BY sync_started_at DESC
             LIMIT 10`,
            [facilityId]
        );

        res.json({
            config: configResult.rows[0],
            recent_syncs: logsResult.rows,
            summary: {
                is_connected: configResult.rows[0].connection_status === 'CONNECTED',
                last_sync: configResult.rows[0].last_sync_time,
                next_sync: configResult.rows[0].next_sync_time,
                recent_sync_success_rate: logsResult.rows.length > 0
                    ? ((logsResult.rows.filter((l: any) => l.sync_status === 'SUCCESS').length / logsResult.rows.length) * 100).toFixed(1)
                    : 0
            }
        });
    } catch (error: any) {
        console.error('Error fetching GoodX sync status:', error);
        res.status(500).json({ error: 'Failed to fetch GoodX sync status' });
    }
};

/**
 * ================================================
 * MEDICAL INVENTORY INTELLIGENCE
 * ================================================
 */

/**
 * Get Inventory Status with Criticality
 */
export const getInventoryStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                mii.*,
                CASE 
                    WHEN mii.current_stock <= 0 THEN 'OUT_OF_STOCK'
                    WHEN mii.current_stock <= mii.minimum_stock THEN 'CRITICAL'
                    WHEN mii.current_stock <= mii.reorder_level THEN 'LOW'
                    WHEN mii.current_stock >= mii.maximum_stock THEN 'OVERSTOCKED'
                    ELSE 'ADEQUATE'
                END as stock_status,
                CASE 
                    WHEN mii.average_daily_usage > 0 THEN 
                        ROUND(mii.current_stock / mii.average_daily_usage)
                    ELSE NULL
                END as days_of_stock_remaining
            FROM medical_inventory_items mii
            JOIN healthcare_facilities hf ON mii.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1 AND mii.facility_id = $2
            ORDER BY 
                CASE 
                    WHEN mii.current_stock <= 0 THEN 1
                    WHEN mii.current_stock <= mii.minimum_stock THEN 2
                    WHEN mii.current_stock <= mii.reorder_level THEN 3
                    ELSE 4
                END,
                mii.is_critical DESC,
                mii.item_name`,
            [tenantId, facilityId]
        );

        // Categorize by status
        const byStatus: any = {
            OUT_OF_STOCK: [],
            CRITICAL: [],
            LOW: [],
            ADEQUATE: [],
            OVERSTOCKED: []
        };

        result.rows.forEach((item: any) => {
            byStatus[item.stock_status].push(item);
        });

        res.json({
            items: result.rows,
            by_status: byStatus,
            summary: {
                total_items: result.rows.length,
                out_of_stock: byStatus.OUT_OF_STOCK.length,
                critical: byStatus.CRITICAL.length,
                low_stock: byStatus.LOW.length,
                adequate: byStatus.ADEQUATE.length,
                overstocked: byStatus.OVERSTOCKED.length,
                critical_items: byStatus.CRITICAL.filter((i: any) => i.is_critical).length
            }
        });
    } catch (error: any) {
        console.error('Error fetching inventory status:', error);
        res.status(500).json({ error: 'Failed to fetch inventory status' });
    }
};

/**
 * Get Active Inventory Alerts
 */
export const getInventoryAlerts = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                mia.*,
                mii.item_name,
                mii.item_category
            FROM medical_inventory_alerts mia
            JOIN medical_inventory_items mii ON mia.item_id = mii.item_id
            JOIN healthcare_facilities hf ON mia.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND mia.facility_id = $2
            AND mia.status = 'ACTIVE'
            ORDER BY 
                CASE mia.severity 
                    WHEN 'CRITICAL' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'MEDIUM' THEN 3
                    ELSE 4
                END,
                mia.created_at DESC`,
            [tenantId, facilityId]
        );

        res.json({
            alerts: result.rows,
            summary: {
                total_active: result.rows.length,
                critical: result.rows.filter((a: any) => a.severity === 'CRITICAL').length,
                high: result.rows.filter((a: any) => a.severity === 'HIGH').length,
                medium: result.rows.filter((a: any) => a.severity === 'MEDIUM').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching inventory alerts:', error);
        res.status(500).json({ error: 'Failed to fetch inventory alerts' });
    }
};

/**
 * Get Pending Reorder Requests
 */
export const getPendingReorders = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                mir.*,
                mii.item_name,
                mii.item_category,
                mii.current_stock
            FROM medical_inventory_reorders mir
            JOIN medical_inventory_items mii ON mir.item_id = mii.item_id
            JOIN healthcare_facilities hf ON mir.facility_id = hf.facility_id
            WHERE hf.tenant_id = $1
            AND mir.facility_id = $2
            AND mir.status IN ('PENDING', 'APPROVED', 'ORDERED')
            ORDER BY 
                CASE mir.urgency_level 
                    WHEN 'URGENT' THEN 1
                    WHEN 'HIGH' THEN 2
                    WHEN 'NORMAL' THEN 3
                    ELSE 4
                END,
                mir.created_at DESC`,
            [tenantId, facilityId]
        );

        res.json({
            reorders: result.rows,
            summary: {
                total_pending: result.rows.length,
                urgent: result.rows.filter((r: any) => r.urgency_level === 'URGENT').length,
                awaiting_approval: result.rows.filter((r: any) => r.status === 'PENDING' && r.approval_required).length,
                ordered: result.rows.filter((r: any) => r.status === 'ORDERED').length,
                total_estimated_cost: result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.estimated_cost || 0), 0).toFixed(2)
            }
        });
    } catch (error: any) {
        console.error('Error fetching pending reorders:', error);
        res.status(500).json({ error: 'Failed to fetch pending reorders' });
    }
};

/**
 * Create Inventory Reorder Request
 */
export const createReorderRequest = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { facilityId } = req.params;
        const {
            item_id,
            requested_quantity,
            supplier_name,
            urgency_level,
            reorder_reason
        } = req.body;

        // Get item details
        const itemResult = await pool.query(
            'SELECT * FROM medical_inventory_items WHERE item_id = $1 AND facility_id = $2',
            [item_id, facilityId]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = itemResult.rows[0];
        const estimated_cost = parseFloat(item.unit_cost) * requested_quantity;

        const result = await pool.query(
            `INSERT INTO medical_inventory_reorders (
                facility_id, item_id, reorder_type, requested_quantity,
                estimated_cost, supplier_name, urgency_level,
                reorder_reason, requested_by, approval_required
            ) VALUES ($1, $2, 'MANUAL', $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                facilityId, item_id, requested_quantity, estimated_cost,
                supplier_name || item.preferred_supplier, 
                urgency_level || 'NORMAL',
                reorder_reason, userId, 
                urgency_level === 'URGENT' ? false : true
            ]
        );

        res.status(201).json({
            message: 'Reorder request created',
            reorder: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating reorder request:', error);
        res.status(500).json({ error: 'Failed to create reorder request' });
    }
};

/**
 * ================================================
 * PATIENT MANAGEMENT (CRUD)
 * ================================================
 */

/**
 * Get All Patients
 */
export const getPatients = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { search, status, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT hp.*,
                   COUNT(*) OVER() as total_count
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
            query += ` AND (
                hp.first_name ILIKE $${paramIndex} OR 
                hp.last_name ILIKE $${paramIndex} OR 
                hp.medical_record_number ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (status) {
            query += ` AND hp.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY hp.last_name, hp.first_name
                   LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({
            patients: result.rows,
            pagination: {
                total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            }
        });
    } catch (error: any) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};

/**
 * Get Single Patient
 */
export const getPatient = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { patientId } = req.params;

        const result = await pool.query(
            `SELECT hp.*
             FROM healthcare_patients hp
             WHERE hp.tenant_id = $1 AND hp.patient_id = $2`,
            [tenantId, patientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({ patient: result.rows[0] });
    } catch (error: any) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ error: 'Failed to fetch patient' });
    }
};

/**
 * Create Patient
 */
export const createPatient = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const {
            medical_record_number, first_name, last_name, date_of_birth,
            gender, blood_type, phone, email, address,
            emergency_contact_name, emergency_contact_phone,
            insurance_provider, insurance_policy_number,
            allergies, chronic_conditions, current_medications,
            primary_facility_id, goodx_patient_id
        } = req.body;

        const result = await pool.query(
            `INSERT INTO healthcare_patients (
                tenant_id, medical_record_number, first_name, last_name,
                date_of_birth, gender, blood_type, phone, email, address,
                emergency_contact_name, emergency_contact_phone,
                insurance_provider, insurance_policy_number,
                allergies, chronic_conditions, current_medications,
                primary_facility_id, goodx_patient_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                tenantId, medical_record_number, first_name, last_name,
                date_of_birth, gender, blood_type, phone, email, address,
                emergency_contact_name, emergency_contact_phone,
                insurance_provider, insurance_policy_number,
                allergies, chronic_conditions, current_medications,
                primary_facility_id, goodx_patient_id
            ]
        );

        res.status(201).json({
            message: 'Patient created successfully',
            patient: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating patient:', error);
        res.status(500).json({ error: 'Failed to create patient' });
    }
};

/**
 * Update Patient
 */
export const updatePatient = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { patientId } = req.params;
        const updates = req.body;

        // Build dynamic update query
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
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE healthcare_patients
            SET ${updateFields.join(', ')}
            WHERE tenant_id = $1 AND patient_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({
            message: 'Patient updated successfully',
            patient: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient' });
    }
};

/**
 * ================================================
 * CLINICAL WORKFLOWS
 * ================================================
 */

/**
 * Record Patient Vitals
 */
export const recordVitals = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { patientId } = req.params;
        const {
            visit_id, blood_pressure_systolic, blood_pressure_diastolic,
            heart_rate, temperature_celsius, respiratory_rate,
            oxygen_saturation, blood_glucose, weight_kg, height_cm,
            pain_scale, consciousness_level, notes
        } = req.body;

        // Calculate BMI if height and weight provided
        let bmi = null;
        if (weight_kg && height_cm) {
            const heightM = height_cm / 100;
            bmi = weight_kg / (heightM * heightM);
        }

        // Check for alert flags
        const alert_flags: string[] = [];
        if (blood_pressure_systolic > 140 || blood_pressure_diastolic > 90) {
            alert_flags.push('HIGH_BP');
        }
        if (oxygen_saturation < 95) {
            alert_flags.push('LOW_O2');
        }
        if (temperature_celsius > 38) {
            alert_flags.push('FEVER');
        }
        if (heart_rate > 100) {
            alert_flags.push('TACHYCARDIA');
        }

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
                patientId, visit_id, userId,
                blood_pressure_systolic, blood_pressure_diastolic,
                heart_rate, temperature_celsius, respiratory_rate,
                oxygen_saturation, blood_glucose, weight_kg, height_cm, bmi,
                pain_scale, consciousness_level, 
                alert_flags.length > 0 ? JSON.stringify(alert_flags) : null,
                notes
            ]
        );

        res.status(201).json({
            message: 'Vitals recorded successfully',
            vitals: result.rows[0],
            alerts: alert_flags
        });
    } catch (error: any) {
        console.error('Error recording vitals:', error);
        res.status(500).json({ error: 'Failed to record vitals' });
    }
};

/**
 * Create Triage Assessment
 */
export const createTriage = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { patientId } = req.params;
        const {
            visit_id, triage_priority, chief_complaint, symptoms,
            vital_signs, triage_notes, recommended_department,
            estimated_wait_time_minutes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO patient_triage (
                patient_id, visit_id, triaged_by, triage_priority,
                chief_complaint, symptoms, vital_signs, triage_notes,
                recommended_department, estimated_wait_time_minutes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                patientId, visit_id, userId, triage_priority,
                chief_complaint, symptoms, vital_signs, triage_notes,
                recommended_department, estimated_wait_time_minutes
            ]
        );

        // Update visit status to IN_TRIAGE
        await pool.query(
            `UPDATE patient_visits
             SET status = 'IN_TRIAGE', updated_at = CURRENT_TIMESTAMP
             WHERE visit_id = $1`,
            [visit_id]
        );

        res.status(201).json({
            message: 'Triage assessment created',
            triage: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating triage:', error);
        res.status(500).json({ error: 'Failed to create triage' });
    }
};

/**
 * Create Lab Order
 */
export const createLabOrder = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { patientId } = req.params;
        const {
            visit_id, test_code, test_name, priority, special_instructions
        } = req.body;

        const result = await pool.query(
            `INSERT INTO lab_orders (
                patient_id, visit_id, test_code, test_name,
                ordered_by, priority, special_instructions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                patientId, visit_id, test_code, test_name,
                userId, priority || 'ROUTINE', special_instructions
            ]
        );

        res.status(201).json({
            message: 'Lab order created successfully',
            lab_order: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating lab order:', error);
        res.status(500).json({ error: 'Failed to create lab order' });
    }
};

/**
 * Update Lab Results
 */
export const updateLabResults = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const { orderId } = req.params;
        const {
            result_value, result_unit, reference_range,
            abnormal_flag, result_notes
        } = req.body;

        const result = await pool.query(
            `UPDATE lab_orders
             SET status = 'COMPLETED',
                 result_value = $1,
                 result_unit = $2,
                 reference_range = $3,
                 abnormal_flag = $4,
                 result_notes = $5,
                 lab_technician_id = $6,
                 completed_time = CURRENT_TIMESTAMP,
                 turn_around_time_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ordered_at)) / 60,
                 updated_at = CURRENT_TIMESTAMP
             WHERE order_id = $7
             RETURNING *`,
            [
                result_value, result_unit, reference_range,
                abnormal_flag, result_notes, userId, orderId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lab order not found' });
        }

        res.json({
            message: 'Lab results updated successfully',
            lab_order: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error updating lab results:', error);
        res.status(500).json({ error: 'Failed to update lab results' });
    }
};

/**
 * Create Prescription
 */
export const createPrescription = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const { patientId } = req.params;
        const {
            visit_id, medication_name, medication_code, dosage,
            frequency, route, duration_days, quantity, refills_allowed,
            instructions, warnings, pharmacy_id
        } = req.body;

        // Generate prescription number
        const prescriptionNumber = `RX${Date.now()}`;

        const result = await pool.query(
            `INSERT INTO prescriptions (
                patient_id, visit_id, prescribed_by, prescription_number,
                medication_name, medication_code, dosage, frequency,
                route, duration_days, quantity, refills_allowed,
                instructions, warnings, pharmacy_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                patientId, visit_id, userId, prescriptionNumber,
                medication_name, medication_code, dosage, frequency,
                route, duration_days, quantity, refills_allowed,
                instructions, warnings, pharmacy_id
            ]
        );

        res.status(201).json({
            message: 'Prescription created successfully',
            prescription: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
};

/**
 * Get Patient Lab Orders
 */
export const getPatientLabOrders = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { patientId } = req.params;
        const { status, visitId } = req.query;

        let query = `
            SELECT lo.*,
                   hp.first_name, hp.last_name
            FROM lab_orders lo
            JOIN healthcare_patients hp ON lo.patient_id = hp.patient_id
            WHERE hp.tenant_id = $1 AND lo.patient_id = $2
        `;

        const params: any[] = [tenantId, patientId];
        let paramIndex = 3;

        if (status) {
            query += ` AND lo.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (visitId) {
            query += ` AND lo.visit_id = $${paramIndex}`;
            params.push(visitId);
            paramIndex++;
        }

        query += ` ORDER BY lo.ordered_at DESC LIMIT 50`;

        const result = await pool.query(query, params);

        res.json({
            lab_orders: result.rows,
            summary: {
                total: result.rows.length,
                pending: result.rows.filter((o: any) => o.status === 'ORDERED').length,
                completed: result.rows.filter((o: any) => o.status === 'COMPLETED').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching lab orders:', error);
        res.status(500).json({ error: 'Failed to fetch lab orders' });
    }
};

/**
 * Get Patient Prescriptions
 */
export const getPatientPrescriptions = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { patientId } = req.params;
        const { status, visitId } = req.query;

        let query = `
            SELECT p.*,
                   hp.first_name, hp.last_name
            FROM prescriptions p
            JOIN healthcare_patients hp ON p.patient_id = hp.patient_id
            WHERE hp.tenant_id = $1 AND p.patient_id = $2
        `;

        const params: any[] = [tenantId, patientId];
        let paramIndex = 3;

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (visitId) {
            query += ` AND p.visit_id = $${paramIndex}`;
            params.push(visitId);
            paramIndex++;
        }

        query += ` ORDER BY p.prescribed_at DESC LIMIT 50`;

        const result = await pool.query(query, params);

        res.json({
            prescriptions: result.rows,
            summary: {
                total: result.rows.length,
                pending: result.rows.filter((p: any) => p.status === 'PENDING').length,
                dispensed: result.rows.filter((p: any) => p.status === 'DISPENSED').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

/**
 * ================================================
 * BED MANAGEMENT
 * ================================================
 */

/**
 * Get Bed Status
 */
export const getBedStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { locationId, status } = req.query;

        let query = `
            SELECT fbm.*,
                   fl.location_name,
                   fl.location_type,
                   hp.first_name as patient_first_name,
                   hp.last_name as patient_last_name
            FROM facility_bed_management fbm
            JOIN facility_locations fl ON fbm.location_id = fl.location_id
            JOIN healthcare_facilities hf ON fl.facility_id = hf.facility_id
            LEFT JOIN healthcare_patients hp ON fbm.patient_id = hp.patient_id
            WHERE hf.tenant_id = $1 AND hf.facility_id = $2
        `;

        const params: any[] = [tenantId, facilityId];
        let paramIndex = 3;

        if (locationId) {
            query += ` AND fbm.location_id = $${paramIndex}`;
            params.push(locationId);
            paramIndex++;
        }

        if (status) {
            query += ` AND fbm.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY fl.location_name, fbm.bed_number`;

        const result = await pool.query(query, params);

        // Group by location
        const byLocation: any = {};
        result.rows.forEach((bed: any) => {
            const location = bed.location_name;
            if (!byLocation[location]) {
                byLocation[location] = {
                    location_id: bed.location_id,
                    location_type: bed.location_type,
                    beds: []
                };
            }
            byLocation[location].beds.push(bed);
        });

        res.json({
            beds: result.rows,
            by_location: byLocation,
            summary: {
                total_beds: result.rows.length,
                available: result.rows.filter((b: any) => b.status === 'AVAILABLE').length,
                occupied: result.rows.filter((b: any) => b.status === 'OCCUPIED').length,
                cleaning: result.rows.filter((b: any) => b.status === 'CLEANING').length,
                maintenance: result.rows.filter((b: any) => b.status === 'MAINTENANCE').length,
                occupancy_rate: result.rows.length > 0
                    ? ((result.rows.filter((b: any) => b.status === 'OCCUPIED').length / result.rows.length) * 100).toFixed(1)
                    : 0
            }
        });
    } catch (error: any) {
        console.error('Error fetching bed status:', error);
        res.status(500).json({ error: 'Failed to fetch bed status' });
    }
};

/**
 * Assign Bed to Patient
 */
export const assignBed = async (req: Request, res: Response) => {
    try {
        const { bedId } = req.params;
        const { patient_id, assignment_notes } = req.body;

        // Check if bed is available
        const bedCheck = await pool.query(
            `SELECT status FROM facility_bed_management WHERE bed_id = $1`,
            [bedId]
        );

        if (bedCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bed not found' });
        }

        if (bedCheck.rows[0].status !== 'AVAILABLE') {
            return res.status(400).json({ error: 'Bed is not available' });
        }

        const result = await pool.query(
            `UPDATE facility_bed_management
             SET status = 'OCCUPIED',
                 patient_id = $1,
                 assignment_time = CURRENT_TIMESTAMP,
                 assignment_notes = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE bed_id = $3
             RETURNING *`,
            [patient_id, assignment_notes, bedId]
        );

        res.json({
            message: 'Bed assigned successfully',
            bed: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error assigning bed:', error);
        res.status(500).json({ error: 'Failed to assign bed' });
    }
};

/**
 * Release Bed
 */
export const releaseBed = async (req: Request, res: Response) => {
    try {
        const { bedId } = req.params;
        const { discharge_notes } = req.body;

        const result = await pool.query(
            `UPDATE facility_bed_management
             SET status = 'CLEANING',
                 patient_id = NULL,
                 discharge_time = CURRENT_TIMESTAMP,
                 discharge_notes = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE bed_id = $2
             RETURNING *`,
            [discharge_notes, bedId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bed not found' });
        }

        res.json({
            message: 'Bed released successfully',
            bed: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error releasing bed:', error);
        res.status(500).json({ error: 'Failed to release bed' });
    }
};

/**
 * ================================================
 * APPOINTMENTS
 * ================================================
 */

/**
 * Create Appointment
 */
export const createAppointment = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const userId = (req as any).user.userId;
        const {
            patient_id, facility_id, provider_id, appointment_date,
            appointment_time, duration_minutes, appointment_type,
            reason, booking_notes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO patient_appointments (
                patient_id, facility_id, provider_id, appointment_date,
                appointment_time, duration_minutes, appointment_type,
                reason, booking_notes, booked_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
            [
                patient_id, facility_id, provider_id, appointment_date,
                appointment_time, duration_minutes || 30, appointment_type,
                reason, booking_notes, userId
            ]
        );

        res.status(201).json({
            message: 'Appointment created successfully',
            appointment: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
};

/**
 * Update Appointment Status
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
        const { appointmentId } = req.params;
        const { status, cancellation_reason } = req.body;

        const result = await pool.query(
            `UPDATE patient_appointments
             SET status = $1,
                 cancellation_reason = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE appointment_id = $3
             RETURNING *`,
            [status, cancellation_reason, appointmentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({
            message: 'Appointment status updated',
            appointment: result.rows[0]
        });
    } catch (error: any) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
};

/**
 * ================================================
 * FACILITY MANAGEMENT
 * ================================================
 */

/**
 * Get All Facilities
 */
export const getFacilities = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;

        const result = await pool.query(
            `SELECT hf.*,
                    fos.overall_status,
                    fos.bed_occupancy_percentage,
                    fos.patients_waiting,
                    fos.average_wait_time_minutes
             FROM healthcare_facilities hf
             LEFT JOIN facility_operational_status fos ON hf.facility_id = fos.facility_id
             WHERE hf.tenant_id = $1 AND hf.is_active = true
             ORDER BY hf.facility_name`,
            [tenantId]
        );

        res.json({
            facilities: result.rows,
            summary: {
                total: result.rows.length,
                operational: result.rows.filter((f: any) => f.overall_status === 'OPERATIONAL').length,
                needs_attention: result.rows.filter((f: any) => f.overall_status === 'NEEDS_ATTENTION').length
            }
        });
    } catch (error: any) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ error: 'Failed to fetch facilities' });
    }
};

/**
 * Get Facility Locations
 */
export const getFacilityLocations = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT fl.*
             FROM facility_locations fl
             JOIN healthcare_facilities hf ON fl.facility_id = hf.facility_id
             WHERE hf.tenant_id = $1 AND fl.facility_id = $2
             ORDER BY fl.floor, fl.location_name`,
            [tenantId, facilityId]
        );

        // Group by type
        const byType: any = {};
        result.rows.forEach((location: any) => {
            const type = location.location_type;
            if (!byType[type]) {
                byType[type] = [];
            }
            byType[type].push(location);
        });

        res.json({
            locations: result.rows,
            by_type: byType
        });
    } catch (error: any) {
        console.error('Error fetching facility locations:', error);
        res.status(500).json({ error: 'Failed to fetch facility locations' });
    }
};

/**
 * ================================================
 * DASHBOARD & WORKSPACE ENDPOINTS
 * ================================================
 */

/**
 * Get Complete Operations Command Center Dashboard
 * Comprehensive real-time data for main dashboard
 */
export const getOperationsCommandCenterDashboard = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        // Parallel queries for dashboard data
        const [
            facilityStatus,
            todayStats,
            criticalAlerts,
            waitingPatients,
            bedStatus,
            staffStatus,
            revenueToday,
            upcomingAppointments
        ] = await Promise.all([
            // 1. Facility operational status
            pool.query(
                `SELECT fos.*, hf.facility_name
                 FROM facility_operational_status fos
                 JOIN healthcare_facilities hf ON fos.facility_id = hf.facility_id
                 WHERE hf.tenant_id = $1 AND fos.facility_id = $2
                 ORDER BY fos.snapshot_time DESC LIMIT 1`,
                [tenantId, facilityId]
            ),

            // 2. Today's statistics
            pool.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE status = 'CHECKED_IN') as checked_in_today,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_today,
                    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_today,
                    COUNT(*) FILTER (WHERE status IN ('CHECKED_IN', 'IN_TRIAGE', 'IN_CONSULTATION')) as currently_active,
                    AVG(EXTRACT(EPOCH FROM (COALESCE(check_out_time, CURRENT_TIMESTAMP) - check_in_time))/60) 
                        FILTER (WHERE check_in_time IS NOT NULL) as avg_visit_duration_minutes
                 FROM patient_visits pv
                 JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
                 WHERE hp.tenant_id = $1 AND pv.facility_id = $2
                 AND pv.visit_date = CURRENT_DATE`,
                [tenantId, facilityId]
            ),

            // 3. Critical alerts
            pool.query(
                `SELECT alert_type, severity, message, suggested_action, created_at
                 FROM medical_inventory_alerts
                 WHERE facility_id = $1 AND status = 'ACTIVE'
                 AND severity IN ('HIGH', 'CRITICAL')
                 ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 ELSE 3 END, created_at DESC
                 LIMIT 5`,
                [facilityId]
            ),

            // 4. Currently waiting patients
            pool.query(
                `SELECT 
                    COUNT(*) as waiting_count,
                    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time))/60) as avg_wait_minutes,
                    MAX(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time))/60) as max_wait_minutes
                 FROM patient_visits pv
                 WHERE pv.facility_id = $1
                 AND pv.visit_date = CURRENT_DATE
                 AND pv.status = 'CHECKED_IN'
                 AND check_in_time IS NOT NULL`,
                [facilityId]
            ),

            // 5. Bed status summary
            pool.query(
                `SELECT 
                    status,
                    COUNT(*) as count,
                    bed_type,
                    COUNT(*) FILTER (WHERE bed_type = 'ICU') as icu_beds,
                    COUNT(*) FILTER (WHERE bed_type = 'GENERAL') as general_beds
                 FROM facility_bed_management fbm
                 JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE fl.facility_id = $1
                 GROUP BY status, bed_type`,
                [facilityId]
            ),

            // 6. Staff on duty
            pool.query(
                `SELECT 
                    staff_role,
                    COUNT(*) as count,
                    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as on_duty,
                    COUNT(*) FILTER (WHERE status = 'SCHEDULED') as scheduled
                 FROM healthcare_staff_schedules
                 WHERE facility_id = $1
                 AND shift_date = CURRENT_DATE
                 GROUP BY staff_role`,
                [facilityId]
            ),

            // 7. Today's revenue
            pool.query(
                `SELECT 
                    COUNT(*) as transaction_count,
                    SUM(net_amount) as total_revenue,
                    COUNT(*) FILTER (WHERE synced_to_erp = false) as pending_sync
                 FROM goodx_revenue_capture
                 WHERE facility_id = $1
                 AND transaction_date = CURRENT_DATE`,
                [facilityId]
            ),

            // 8. Upcoming appointments (next 2 hours)
            pool.query(
                `SELECT 
                    ha.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number
                 FROM healthcare_appointments ha
                 JOIN healthcare_patients hp ON ha.patient_id = hp.patient_id
                 WHERE ha.facility_id = $1
                 AND ha.appointment_date = CURRENT_DATE
                 AND ha.appointment_time BETWEEN CURRENT_TIME AND (CURRENT_TIME + INTERVAL '2 hours')
                 AND ha.status IN ('SCHEDULED', 'CONFIRMED')
                 ORDER BY ha.appointment_time
                 LIMIT 10`,
                [facilityId]
            )
        ]);

        res.json({
            facility_status: facilityStatus.rows[0] || null,
            today_stats: todayStats.rows[0] || {},
            critical_alerts: criticalAlerts.rows,
            waiting_patients: waitingPatients.rows[0] || {},
            bed_status: bedStatus.rows,
            staff_on_duty: staffStatus.rows,
            revenue_today: revenueToday.rows[0] || {},
            upcoming_appointments: upcomingAppointments.rows,
            dashboard_timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching operations dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch operations dashboard' });
    }
};

/**
 * Get Patient Workspace Data
 * All data needed for patient management workspace
 */
export const getPatientWorkspace = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const [
            activePatients,
            todayAppointments,
            recentAdmissions,
            pendingDischarges,
            patientStats
        ] = await Promise.all([
            // Active patients in facility
            pool.query(
                `SELECT 
                    pv.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    hp.date_of_birth,
                    fl.location_name,
                    fbm.bed_number,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - pv.check_in_time))/60 as minutes_in_facility
                 FROM patient_visits pv
                 JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
                 LEFT JOIN facility_bed_management fbm ON pv.patient_id = fbm.patient_id AND fbm.status = 'OCCUPIED'
                 LEFT JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE pv.facility_id = $1
                 AND pv.visit_date = CURRENT_DATE
                 AND pv.status IN ('CHECKED_IN', 'IN_TRIAGE', 'IN_CONSULTATION', 'IN_PROCEDURE', 'IN_RECOVERY')
                 ORDER BY pv.check_in_time DESC`,
                [facilityId]
            ),

            // Today's appointments
            pool.query(
                `SELECT 
                    ha.*,
                    hp.first_name,
                    hp.last_name,
                    hp.phone,
                    hp.medical_record_number
                 FROM healthcare_appointments ha
                 JOIN healthcare_patients hp ON ha.patient_id = hp.patient_id
                 WHERE ha.facility_id = $1
                 AND ha.appointment_date = CURRENT_DATE
                 ORDER BY ha.appointment_time`,
                [facilityId]
            ),

            // Recent admissions (last 24 hours)
            pool.query(
                `SELECT 
                    pv.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    fl.location_name,
                    fbm.bed_number
                 FROM patient_visits pv
                 JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
                 LEFT JOIN facility_bed_management fbm ON pv.patient_id = fbm.patient_id AND fbm.status = 'OCCUPIED'
                 LEFT JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE pv.facility_id = $1
                 AND pv.check_in_time >= NOW() - INTERVAL '24 hours'
                 ORDER BY pv.check_in_time DESC
                 LIMIT 20`,
                [facilityId]
            ),

            // Pending discharges
            pool.query(
                `SELECT 
                    pv.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    fl.location_name,
                    fbm.bed_number
                 FROM patient_visits pv
                 JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
                 LEFT JOIN facility_bed_management fbm ON pv.patient_id = fbm.patient_id AND fbm.status = 'OCCUPIED'
                 LEFT JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE pv.facility_id = $1
                 AND pv.status = 'AWAITING_DISCHARGE'
                 ORDER BY pv.check_in_time`,
                [facilityId]
            ),

            // Patient statistics
            pool.query(
                `SELECT 
                    COUNT(*) as total_patients,
                    COUNT(*) FILTER (WHERE hp.status = 'ACTIVE') as active_patients,
                    COUNT(DISTINCT pv.patient_id) FILTER (WHERE pv.visit_date >= CURRENT_DATE - INTERVAL '30 days') as patients_last_30_days
                 FROM healthcare_patients hp
                 LEFT JOIN patient_visits pv ON hp.patient_id = pv.patient_id
                 WHERE hp.tenant_id = $1 AND hp.primary_facility_id = $2`,
                [tenantId, facilityId]
            )
        ]);

        res.json({
            active_patients: activePatients.rows,
            today_appointments: todayAppointments.rows,
            recent_admissions: recentAdmissions.rows,
            pending_discharges: pendingDischarges.rows,
            statistics: patientStats.rows[0] || {},
            workspace_timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching patient workspace:', error);
        res.status(500).json({ error: 'Failed to fetch patient workspace' });
    }
};

/**
 * Get Clinical Workspace Data
 * All data needed for clinical workflows workspace
 */
export const getClinicalWorkspace = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const [
            pendingLabOrders,
            pendingPrescriptions,
            criticalVitals,
            triageQueue,
            recentProcedures
        ] = await Promise.all([
            // Pending lab orders
            pool.query(
                `SELECT 
                    lo.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lo.ordered_at))/60 as pending_minutes
                 FROM lab_orders lo
                 JOIN healthcare_patients hp ON lo.patient_id = hp.patient_id
                 JOIN patient_visits pv ON lo.visit_id = pv.visit_id
                 WHERE pv.facility_id = $1
                 AND lo.status IN ('ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS')
                 ORDER BY 
                    CASE lo.priority 
                        WHEN 'STAT' THEN 1
                        WHEN 'URGENT' THEN 2
                        WHEN 'ROUTINE' THEN 3
                    END,
                    lo.ordered_at
                 LIMIT 50`,
                [facilityId]
            ),

            // Pending prescriptions
            pool.query(
                `SELECT 
                    p.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number
                 FROM prescriptions p
                 JOIN healthcare_patients hp ON p.patient_id = hp.patient_id
                 JOIN patient_visits pv ON p.visit_id = pv.visit_id
                 WHERE pv.facility_id = $1
                 AND p.status = 'PENDING'
                 ORDER BY p.prescribed_at DESC
                 LIMIT 50`,
                [facilityId]
            ),

            // Critical vitals (last 2 hours)
            pool.query(
                `SELECT 
                    pv.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    pv.alert_flags
                 FROM patient_vitals pv
                 JOIN healthcare_patients hp ON pv.patient_id = hp.patient_id
                 WHERE pv.recorded_at >= NOW() - INTERVAL '2 hours'
                 AND pv.alert_flags IS NOT NULL
                 ORDER BY pv.recorded_at DESC
                 LIMIT 20`,
                []
            ),

            // Triage queue
            pool.query(
                `SELECT 
                    pt.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number,
                    pv.check_in_time,
                    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - pv.check_in_time))/60 as wait_minutes
                 FROM patient_triage pt
                 JOIN healthcare_patients hp ON pt.patient_id = hp.patient_id
                 JOIN patient_visits pv ON pt.visit_id = pv.visit_id
                 WHERE pv.facility_id = $1
                 AND pv.visit_date = CURRENT_DATE
                 AND pv.status IN ('IN_TRIAGE', 'CHECKED_IN')
                 ORDER BY 
                    CASE pt.triage_priority
                        WHEN 'P1_IMMEDIATE' THEN 1
                        WHEN 'P2_VERY_URGENT' THEN 2
                        WHEN 'P3_URGENT' THEN 3
                        WHEN 'P4_STANDARD' THEN 4
                        WHEN 'P5_NON_URGENT' THEN 5
                    END,
                    pt.triage_time
                 LIMIT 30`,
                [facilityId]
            ),

            // Recent procedures (last 24 hours)
            pool.query(
                `SELECT 
                    mp.*,
                    hp.first_name,
                    hp.last_name,
                    hp.medical_record_number
                 FROM medical_procedures mp
                 JOIN healthcare_patients hp ON mp.patient_id = hp.patient_id
                 JOIN patient_visits pv ON mp.visit_id = pv.visit_id
                 WHERE pv.facility_id = $1
                 AND mp.scheduled_date >= CURRENT_DATE - INTERVAL '1 day'
                 ORDER BY mp.scheduled_date DESC, mp.scheduled_time DESC
                 LIMIT 20`,
                [facilityId]
            )
        ]);

        res.json({
            pending_lab_orders: pendingLabOrders.rows,
            pending_prescriptions: pendingPrescriptions.rows,
            critical_vitals: criticalVitals.rows,
            triage_queue: triageQueue.rows,
            recent_procedures: recentProcedures.rows,
            workspace_timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching clinical workspace:', error);
        res.status(500).json({ error: 'Failed to fetch clinical workspace' });
    }
};

/**
 * Get Resource Management Workspace Data
 * Beds, staff, equipment status
 */
export const getResourceWorkspace = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const [
            bedSummary,
            staffSchedule,
            equipmentStatus,
            inventoryAlerts,
            serviceRequests
        ] = await Promise.all([
            // Bed summary by ward
            pool.query(
                `SELECT 
                    fl.location_name as ward_name,
                    fl.location_type,
                    COUNT(*) as total_beds,
                    COUNT(*) FILTER (WHERE fbm.status = 'AVAILABLE') as available,
                    COUNT(*) FILTER (WHERE fbm.status = 'OCCUPIED') as occupied,
                    COUNT(*) FILTER (WHERE fbm.status = 'CLEANING') as cleaning,
                    COUNT(*) FILTER (WHERE fbm.status = 'MAINTENANCE') as maintenance,
                    ROUND(
                        (COUNT(*) FILTER (WHERE fbm.status = 'OCCUPIED')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
                        1
                    ) as occupancy_rate
                 FROM facility_locations fl
                 LEFT JOIN facility_bed_management fbm ON fl.location_id = fbm.location_id
                 WHERE fl.facility_id = $1
                 AND fl.location_type IN ('WARD', 'ICU', 'MATERNITY', 'EMERGENCY_BAY')
                 GROUP BY fl.location_name, fl.location_type
                 ORDER BY fl.location_name`,
                [facilityId]
            ),

            // Today's staff schedule
            pool.query(
                `SELECT 
                    staff_role,
                    department,
                    COUNT(*) as total_scheduled,
                    COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as on_duty,
                    COUNT(*) FILTER (WHERE status = 'SCHEDULED') as upcoming,
                    COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show
                 FROM healthcare_staff_schedules
                 WHERE facility_id = $1
                 AND shift_date = CURRENT_DATE
                 GROUP BY staff_role, department
                 ORDER BY staff_role, department`,
                [facilityId]
            ),

            // Equipment operational status
            pool.query(
                `SELECT 
                    equipment_type,
                    COUNT(*) as total_equipment,
                    COUNT(*) FILTER (WHERE operational_status = 'OPERATIONAL') as operational,
                    COUNT(*) FILTER (WHERE operational_status = 'MAINTENANCE') as in_maintenance,
                    COUNT(*) FILTER (WHERE operational_status = 'DOWN') as down,
                    COUNT(*) FILTER (WHERE is_critical = true AND operational_status = 'DOWN') as critical_down
                 FROM healthcare_equipment
                 WHERE facility_id = $1
                 GROUP BY equipment_type
                 ORDER BY equipment_type`,
                [facilityId]
            ),

            // Critical inventory alerts
            pool.query(
                `SELECT 
                    mia.*,
                    mii.item_name
                 FROM medical_inventory_alerts mia
                 JOIN medical_inventory_items mii ON mia.item_id = mii.item_id
                 WHERE mia.facility_id = $1
                 AND mia.status = 'ACTIVE'
                 AND mia.severity IN ('HIGH', 'CRITICAL')
                 ORDER BY 
                    CASE mia.severity 
                        WHEN 'CRITICAL' THEN 1
                        WHEN 'HIGH' THEN 2
                        ELSE 3
                    END,
                    mia.created_at DESC
                 LIMIT 20`,
                [facilityId]
            ),

            // Active service requests
            pool.query(
                `SELECT 
                    request_type,
                    priority,
                    COUNT(*) as count
                 FROM facility_service_requests
                 WHERE facility_id = $1
                 AND status NOT IN ('COMPLETED', 'CANCELLED')
                 GROUP BY request_type, priority
                 ORDER BY 
                    CASE priority 
                        WHEN 'URGENT' THEN 1
                        WHEN 'HIGH' THEN 2
                        WHEN 'MEDIUM' THEN 3
                        ELSE 4
                    END`,
                [facilityId]
            )
        ]);

        res.json({
            bed_summary: bedSummary.rows,
            staff_schedule: staffSchedule.rows,
            equipment_status: equipmentStatus.rows,
            inventory_alerts: inventoryAlerts.rows,
            service_requests: serviceRequests.rows,
            workspace_timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching resource workspace:', error);
        res.status(500).json({ error: 'Failed to fetch resource workspace' });
    }
};

/**
 * Get Analytics Workspace Data
 * Performance metrics and trends
 */
export const getAnalyticsWorkspace = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;
        const { period = '30' } = req.query; // days

        const [
            patientFlowTrends,
            bedOccupancyTrends,
            waitTimeTrends,
            revenueTrends,
            topProcedures
        ] = await Promise.all([
            // Patient flow trends
            pool.query(
                `SELECT 
                    visit_date,
                    COUNT(*) as total_visits,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
                    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
                    AVG(waiting_time_minutes) as avg_wait_time,
                    AVG(total_visit_duration) as avg_visit_duration
                 FROM patient_visits
                 WHERE facility_id = $1
                 AND visit_date >= CURRENT_DATE - INTERVAL '${period} days'
                 GROUP BY visit_date
                 ORDER BY visit_date DESC`,
                [facilityId]
            ),

            // Bed occupancy trends
            pool.query(
                `SELECT 
                    snapshot_time::DATE as date,
                    AVG(bed_occupancy_percentage) as avg_occupancy,
                    MAX(bed_occupancy_percentage) as peak_occupancy,
                    AVG(beds_occupied) as avg_beds_occupied
                 FROM facility_operational_status
                 WHERE facility_id = $1
                 AND snapshot_time >= CURRENT_TIMESTAMP - INTERVAL '${period} days'
                 GROUP BY snapshot_time::DATE
                 ORDER BY date DESC`,
                [facilityId]
            ),

            // Wait time analysis
            pool.query(
                `SELECT 
                    visit_date,
                    AVG(waiting_time_minutes) as avg_wait,
                    MAX(waiting_time_minutes) as max_wait,
                    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY waiting_time_minutes) as median_wait,
                    COUNT(*) FILTER (WHERE waiting_time_minutes > 30) as waited_over_30min
                 FROM patient_visits
                 WHERE facility_id = $1
                 AND visit_date >= CURRENT_DATE - INTERVAL '${period} days'
                 AND waiting_time_minutes IS NOT NULL
                 GROUP BY visit_date
                 ORDER BY visit_date DESC`,
                [facilityId]
            ),

            // Revenue trends
            pool.query(
                `SELECT 
                    transaction_date,
                    COUNT(*) as transaction_count,
                    SUM(gross_amount) as gross_revenue,
                    SUM(net_amount) as net_revenue,
                    SUM(discount_amount) as total_discounts
                 FROM goodx_revenue_capture
                 WHERE facility_id = $1
                 AND transaction_date >= CURRENT_DATE - INTERVAL '${period} days'
                 GROUP BY transaction_date
                 ORDER BY transaction_date DESC`,
                [facilityId]
            ),

            // Top procedures
            pool.query(
                `SELECT 
                    procedure_name,
                    COUNT(*) as procedure_count,
                    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_count,
                    AVG(duration_minutes) as avg_duration
                 FROM medical_procedures mp
                 JOIN patient_visits pv ON mp.visit_id = pv.visit_id
                 WHERE pv.facility_id = $1
                 AND mp.scheduled_date >= CURRENT_DATE - INTERVAL '${period} days'
                 GROUP BY procedure_name
                 ORDER BY procedure_count DESC
                 LIMIT 10`,
                [facilityId]
            )
        ]);

        res.json({
            patient_flow_trends: patientFlowTrends.rows,
            bed_occupancy_trends: bedOccupancyTrends.rows,
            wait_time_trends: waitTimeTrends.rows,
            revenue_trends: revenueTrends.rows,
            top_procedures: topProcedures.rows,
            period_days: parseInt(period as string),
            workspace_timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching analytics workspace:', error);
        res.status(500).json({ error: 'Failed to fetch analytics workspace' });
    }
};

/**
 * Get Quick Stats (for dashboard widgets)
 */
export const getQuickStats = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user.tenantId;
        const { facilityId } = req.params;

        const result = await pool.query(
            `SELECT 
                -- Patients
                (SELECT COUNT(*) FROM patient_visits 
                 WHERE facility_id = $1 AND visit_date = CURRENT_DATE) as patients_today,
                (SELECT COUNT(*) FROM patient_visits 
                 WHERE facility_id = $1 AND visit_date = CURRENT_DATE 
                 AND status IN ('CHECKED_IN', 'IN_TRIAGE', 'IN_CONSULTATION')) as patients_active,
                
                -- Beds
                (SELECT COUNT(*) FROM facility_bed_management fbm
                 JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE fl.facility_id = $1 AND fbm.status = 'AVAILABLE') as beds_available,
                (SELECT COUNT(*) FROM facility_bed_management fbm
                 JOIN facility_locations fl ON fbm.location_id = fl.location_id
                 WHERE fl.facility_id = $1) as beds_total,
                
                -- Appointments
                (SELECT COUNT(*) FROM healthcare_appointments 
                 WHERE facility_id = $1 AND appointment_date = CURRENT_DATE
                 AND status IN ('SCHEDULED', 'CONFIRMED')) as appointments_pending,
                
                -- Staff
                (SELECT COUNT(*) FROM healthcare_staff_schedules
                 WHERE facility_id = $1 AND shift_date = CURRENT_DATE
                 AND status = 'IN_PROGRESS') as staff_on_duty,
                
                -- Alerts
                (SELECT COUNT(*) FROM medical_inventory_alerts
                 WHERE facility_id = $1 AND status = 'ACTIVE'
                 AND severity IN ('HIGH', 'CRITICAL')) as critical_alerts,
                
                -- Revenue
                (SELECT COALESCE(SUM(net_amount), 0) FROM goodx_revenue_capture
                 WHERE facility_id = $1 AND transaction_date = CURRENT_DATE) as revenue_today`,
            [facilityId]
        );

        const stats = result.rows[0] || {};
        
        // Calculate occupancy rate
        const occupancyRate = stats.beds_total > 0
            ? (((stats.beds_total - stats.beds_available) / stats.beds_total) * 100).toFixed(1)
            : 0;

        res.json({
            patients_today: parseInt(stats.patients_today) || 0,
            patients_active: parseInt(stats.patients_active) || 0,
            beds_available: parseInt(stats.beds_available) || 0,
            beds_total: parseInt(stats.beds_total) || 0,
            bed_occupancy_rate: parseFloat(occupancyRate as string),
            appointments_pending: parseInt(stats.appointments_pending) || 0,
            staff_on_duty: parseInt(stats.staff_on_duty) || 0,
            critical_alerts: parseInt(stats.critical_alerts) || 0,
            revenue_today: parseFloat(stats.revenue_today) || 0,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching quick stats:', error);
        res.status(500).json({ error: 'Failed to fetch quick stats' });
    }
};

// Helper function to calculate trend
function calculateTrend(values: number[]): string {
    if (values.length < 2) return 'STABLE';
    const recent = values.slice(0, Math.min(7, values.length));
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = values.slice(Math.min(7, values.length));
    const oldAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : avg;
    
    const change = ((avg - oldAvg) / oldAvg) * 100;
    if (change > 10) return 'INCREASING';
    if (change < -10) return 'DECREASING';
    return 'STABLE';
}

// Export all functions
export default {
    // Operations Dashboard
    getFacilityOperationsStatus,
    getFacilityKPIs,
    
    // Dashboard & Workspaces
    getOperationsCommandCenterDashboard,
    getPatientWorkspace,
    getClinicalWorkspace,
    getResourceWorkspace,
    getAnalyticsWorkspace,
    getQuickStats,
    
    // Patient Journey
    getTodayAppointments,
    getActivePatientsInFacility,
    getPatientFlowBottlenecks,
    checkInPatient,
    updatePatientJourneyStage,
    
    // Patient Management
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    
    // Clinical Workflows
    recordVitals,
    createTriage,
    createLabOrder,
    updateLabResults,
    createPrescription,
    getPatientLabOrders,
    getPatientPrescriptions,
    
    // Bed Management
    getBedStatus,
    assignBed,
    releaseBed,
    
    // Appointments
    createAppointment,
    updateAppointmentStatus,
    
    // Staff Management (Integration with HR)
    getTodayStaffSchedule,
    getStaffUtilization,
    
    // Equipment (Integration with Assets)
    getMedicalEquipmentStatus,
    
    // Communications
    getFacilityCommunications,
    getServiceRequests,
    createServiceRequest,
    
    // GoodX Integration
    getGoodXRevenue,
    getGoodXSyncStatus,
    
    // Inventory (Integration with Inventory Module)
    getInventoryStatus,
    getInventoryAlerts,
    getPendingReorders,
    createReorderRequest,
    
    // Facilities
    getFacilities,
    getFacilityLocations
};
