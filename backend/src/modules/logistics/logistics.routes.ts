import { Router } from 'express';
import * as logisticsController from './logistics.controller';
import * as logisticsWorkspaceController from './controllers/logistics.workspace.controller';
import * as routesIncidentsGeofencesController from '../../controllers/routes-incidents-geofences.controller';
import documentsRouter from '../../routes/logistics/documents';
import tripsRouter from '../../routes/logistics/trips';
import enterpriseRouter from '../../routes/logistics/enterprise';
import trackingRouter from '../../routes/logistics/tracking';
import { requirePermission, Permission } from '../../middleware/rbac.middleware';

const router = Router();

// Enterprise extensions (SAP/Oracle/Dynamics parity)
router.use('/enterprise', enterpriseRouter);

// ============================================================================
// VEHICLE TRACKING (GPS/API Providers)
// ============================================================================
router.use('/tracking', trackingRouter);

// ============================================================================
// DASHBOARD (must be before /:id routes)
// ============================================================================
router.get('/dashboard', 
  requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getDashboardStats
);

// ============================================================================
// WORKSPACE
// ============================================================================
router.get('/workspace', 
  requirePermission(Permission.VEHICLES_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsWorkspaceController.getLogisticsWorkspace
);

// ============================================================================
// VEHICLES
// ============================================================================
router.get('/vehicles', 
  requirePermission(Permission.VEHICLES_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getVehicles
);
router.get('/vehicles/:id', 
  requirePermission(Permission.VEHICLES_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getVehicleById
);
router.post('/vehicles', 
  requirePermission(Permission.VEHICLES_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createVehicle
);
router.put('/vehicles/:id', 
  requirePermission(Permission.VEHICLES_UPDATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.updateVehicle
);
router.delete('/vehicles/:id', 
  requirePermission(Permission.VEHICLES_DELETE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.deleteVehicle
);

// ============================================================================
// DRIVERS
// ============================================================================
router.get('/drivers', 
  requirePermission(Permission.DRIVERS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getDrivers
);
router.get('/drivers/:id', 
  requirePermission(Permission.DRIVERS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getDriverById
);
router.post('/drivers', 
  requirePermission(Permission.DRIVERS_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createDriver
);
router.put('/drivers/:id', 
  requirePermission(Permission.DRIVERS_UPDATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.updateDriver
);
router.delete('/drivers/:id', 
  requirePermission(Permission.DRIVERS_DELETE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.deleteDriver
);
// Resend app invite (regenerate access code + SMS)
router.post('/drivers/:id/resend-app-invite', 
  requirePermission(Permission.DRIVERS_UPDATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.resendDriverAppInvite
);

// ============================================================================
// DOCUMENT PROCESSING (OCR)
// ============================================================================
router.use('/documents', documentsRouter);

// ============================================================================
// TRIPS API (Database-driven)
// ============================================================================
router.use('/trips', tripsRouter);

// Legacy trip routes (kept for backward compatibility)
router.get('/trips-legacy', 
  requirePermission(Permission.TRIPS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getTrips
);
router.get('/trips-legacy/:id', 
  requirePermission(Permission.TRIPS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getTripById
);
router.post('/trips-legacy', 
  requirePermission(Permission.TRIPS_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createTrip
);
router.put('/trips-legacy/:id', 
  requirePermission(Permission.TRIPS_UPDATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.updateTrip
);
router.post('/trips-legacy/:id/start', 
  requirePermission(Permission.TRIPS_START, Permission.ADMIN_FULL_ACCESS),
  logisticsController.startTrip
);
router.post('/trips-legacy/:id/complete', 
  requirePermission(Permission.TRIPS_COMPLETE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.completeTrip
);

// ============================================================================
// FUEL MANAGEMENT
// ============================================================================
router.get('/fuel', 
  requirePermission(Permission.FUEL_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getFuelTransactions
);
router.post('/fuel', 
  requirePermission(Permission.FUEL_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createFuelTransaction
);
router.post('/fuel/:id/reconcile', 
  requirePermission(Permission.FUEL_RECONCILE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.reconcileFuelTransaction
);

// ============================================================================
// LOAD PLANNING
// ============================================================================
router.get('/loads', 
  requirePermission(Permission.LOADS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getLoads
);
router.get('/loads/:id', 
  requirePermission(Permission.LOADS_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getLoadById
);
router.post('/loads', 
  requirePermission(Permission.LOADS_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createLoad
);
router.put('/loads/:id/status', 
  requirePermission(Permission.LOADS_UPDATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.updateLoadStatus
);

// ============================================================================
// MAINTENANCE
// ============================================================================
router.get('/maintenance', 
  requirePermission(Permission.MAINTENANCE_VIEW, Permission.ADMIN_FULL_ACCESS),
  logisticsController.getMaintenanceRecords
);
router.post('/maintenance', 
  requirePermission(Permission.MAINTENANCE_CREATE, Permission.ADMIN_FULL_ACCESS),
  logisticsController.createMaintenanceRecord
);

// ============================================================================
// ROUTES (Route Planning & Management)
// ============================================================================
router.get('/routes', 
  requirePermission(Permission.ROUTES_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getRoutes
);
router.get('/routes/:id', 
  requirePermission(Permission.ROUTES_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getRouteById
);
router.post('/routes', 
  requirePermission(Permission.ROUTES_CREATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.createRoute
);
router.put('/routes/:id', 
  requirePermission(Permission.ROUTES_UPDATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.updateRoute
);
router.delete('/routes/:id', 
  requirePermission(Permission.ROUTES_DELETE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.deleteRoute
);

// ============================================================================
// INCIDENTS (Safety & Compliance)
// ============================================================================
router.get('/incidents', 
  requirePermission(Permission.INCIDENTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getIncidents
);
router.get('/incidents/:id', 
  requirePermission(Permission.INCIDENTS_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getIncidentById
);
router.post('/incidents', 
  requirePermission(Permission.INCIDENTS_CREATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.createIncident
);
router.put('/incidents/:id', 
  requirePermission(Permission.INCIDENTS_UPDATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.updateIncident
);
router.delete('/incidents/:id', 
  requirePermission(Permission.INCIDENTS_DELETE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.deleteIncident
);

// ============================================================================
// GEOFENCES (GPS Zone Management)
// ============================================================================
router.get('/geofences', 
  requirePermission(Permission.GEOFENCES_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getGeofences
);
router.get('/geofences/:id', 
  requirePermission(Permission.GEOFENCES_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getGeofenceById
);
router.post('/geofences', 
  requirePermission(Permission.GEOFENCES_CREATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.createGeofence
);
router.put('/geofences/:id', 
  requirePermission(Permission.GEOFENCES_UPDATE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.updateGeofence
);
router.delete('/geofences/:id', 
  requirePermission(Permission.GEOFENCES_DELETE, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.deleteGeofence
);
router.get('/geofence-events', 
  requirePermission(Permission.GEOFENCES_VIEW, Permission.ADMIN_FULL_ACCESS),
  routesIncidentsGeofencesController.getGeofenceEvents
);

// ============================================================================
// ACCOUNTING INTEGRATION (TODO: implement controller methods)
// ============================================================================
// router.get('/accounting/validate',
//   requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
//   logisticsController.validateAccountingEntries
// );
// router.get('/accounting/pl-impact',
//   requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
//   logisticsController.getAccountingPLImpact
// );
// router.get('/accounting/audit-trail',
//   requirePermission(Permission.REPORTS_VIEW, Permission.ADMIN_FULL_ACCESS),
//   logisticsController.getAccountingAuditTrail
// );

export default router;
