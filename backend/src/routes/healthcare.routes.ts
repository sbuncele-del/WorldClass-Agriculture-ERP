import express from 'express';
import HealthcareControllerV2 from '../controllers/healthcare.controller.v2';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// Apply authentication and tenant middleware to all routes
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * ================================================
 * HEALTHCARE V2 ROUTES (Tenant-secure)
 * ================================================
 */

// Dashboard
router.get('/dashboard', HealthcareControllerV2.getHealthcareDashboard);

// Facilities & Operations
router.get('/facilities', HealthcareControllerV2.getFacilities);
router.post('/facilities', HealthcareControllerV2.createFacility);
router.get('/facilities/:facilityId/operations', HealthcareControllerV2.getFacilityOperationsStatus);
router.get('/facilities/:facilityId/kpis', HealthcareControllerV2.getFacilityKPIs);
router.get('/facilities/:facilityId/appointments/today', HealthcareControllerV2.getTodayAppointments);

// Patient Management (flat routes for frontend)
router.get('/patients', HealthcareControllerV2.getAllPatients);
router.post('/patients', HealthcareControllerV2.createPatient);
router.get('/patients/:patientId', HealthcareControllerV2.getPatient);
router.put('/patients/:patientId', HealthcareControllerV2.updatePatient);
router.get('/facilities/:facilityId/patients', HealthcareControllerV2.getPatients);

// Appointments (flat routes for frontend)
router.get('/appointments', HealthcareControllerV2.getAllAppointments);
router.post('/appointments', HealthcareControllerV2.createAppointment);

// Invoices, Claims, Schemes (flat routes for frontend)
router.get('/invoices', HealthcareControllerV2.getInvoices);
router.get('/claims', HealthcareControllerV2.getClaims);
router.get('/schemes', HealthcareControllerV2.getSchemes);
router.get('/practitioners', HealthcareControllerV2.getPractitioners);

// Patient Journey
router.get('/facilities/:facilityId/active-patients', HealthcareControllerV2.getActivePatientsInFacility);
router.post('/facilities/:facilityId/check-in', HealthcareControllerV2.checkInPatient);
router.put('/visits/:visitId/journey', HealthcareControllerV2.updatePatientJourneyStage);

// Staff & Equipment
router.get('/facilities/:facilityId/staff/schedule', HealthcareControllerV2.getTodayStaffSchedule);
router.get('/facilities/:facilityId/staff/utilization', HealthcareControllerV2.getStaffUtilization);
router.get('/facilities/:facilityId/equipment', HealthcareControllerV2.getMedicalEquipmentStatus);

// Inventory
router.get('/facilities/:facilityId/inventory', HealthcareControllerV2.getInventoryStatus);
router.get('/facilities/:facilityId/inventory/alerts', HealthcareControllerV2.getInventoryAlerts);
router.post('/facilities/:facilityId/inventory/reorder', HealthcareControllerV2.createReorderRequest);

// Clinical Workflows
router.post('/patients/:patientId/vitals', HealthcareControllerV2.recordVitals);
router.post('/patients/:patientId/triage', HealthcareControllerV2.createTriage);
router.post('/patients/:patientId/lab-orders', HealthcareControllerV2.createLabOrder);

// GoodX Integration
router.get('/facilities/:facilityId/goodx/revenue', HealthcareControllerV2.getGoodXRevenue);
router.get('/facilities/:facilityId/goodx/sync-status', HealthcareControllerV2.getGoodXSyncStatus);

export default router;
