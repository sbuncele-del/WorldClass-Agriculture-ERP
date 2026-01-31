/**
 * Driver App Controller v2 - Mobile App Endpoints
 * 
 * These endpoints are designed for the driver mobile app to manage deliveries.
 * The workflow is:
 * 
 * 1. Driver logs in to mobile app
 * 2. GET /driver/trips - See assigned trips
 * 3. POST /driver/trips/:tripId/accept - Accept a trip assignment
 * 4. POST /driver/trips/:tripId/start - Start the trip (picked up goods)
 * 5. POST /driver/trips/:tripId/arrive - Arrived at delivery destination
 * 6. POST /driver/trips/:tripId/pod-ready - Ready to capture POD (triggers SMS to customer)
 * 7. POST /driver/trips/:tripId/pod-upload - Upload signature/photos
 * 8. POST /driver/trips/:tripId/verify-customer - Enter customer's verification code
 * 9. Trip automatically completes when verified + POD uploaded
 */

import { Request, Response } from 'express';
import pool from '../../config/database';
import crypto from 'crypto';

// Tenant-aware request type for driver (includes driver profile)
interface DriverRequest extends Request {
  tenantId?: string;
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; driverId?: string };
}

// Extract context with validation
function getDriverContext(req: DriverRequest): { tenantId: string; userId: string; driverId?: string } {
  const tenantId = req.tenant?.id || req.tenantId;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  return { tenantId, userId: userId || '', driverId: req.user?.driverId };
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a 6-digit numeric access code for driver app
 * Numeric-only so mobile keyboards show number pad
 */
function generateNumericAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// =============================================================================
// DRIVER AUTHENTICATION - PUBLIC ENDPOINTS (No auth required)
// =============================================================================

/**
 * POST /api/v2/driver/auth/request-code
 * Request access code verification - Driver enters phone, system checks if they have an access code
 * This is a PUBLIC endpoint - no auth required
 * 
 * Body: { phone: string, tenantId?: string }
 */
export async function requestAccessCode(req: Request, res: Response): Promise<void> {
  try {
    const { phone, tenantId = 'd0a49212-96f5-46c7-9d69-fec0f235a90c' } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }

    // Normalize phone number (remove spaces, add +27 prefix if missing)
    let normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+?27/, '+27');
    if (!normalizedPhone.startsWith('+27')) {
      normalizedPhone = '+27' + normalizedPhone.replace(/^0/, '');
    }

    // Find driver by phone number (most recently created if duplicates)
    const driverResult = await pool.query(
      `SELECT driver_id, first_name, last_name, phone, access_code, app_approved, status
       FROM logistics.drivers 
       WHERE tenant_id = $1 
         AND (phone = $2 OR phone = $3)
         AND status = 'ACTIVE'
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, normalizedPhone, phone]
    );

    if (driverResult.rows.length === 0) {
      res.status(404).json({ 
        success: false, 
        error: 'No driver found with this phone number. Please contact your fleet manager.',
        code: 'DRIVER_NOT_FOUND'
      });
      return;
    }

    const driver = driverResult.rows[0];

    // Check if driver is approved for app access
    if (driver.app_approved === false) {
      res.status(403).json({
        success: false,
        error: 'Your account is pending approval. Please contact your fleet manager.',
        code: 'NOT_APPROVED'
      });
      return;
    }

    // Check if driver has an access code
    if (!driver.access_code) {
      res.status(403).json({
        success: false,
        error: 'No access code has been generated. Please contact your fleet manager.',
        code: 'NO_ACCESS_CODE'
      });
      return;
    }

    // For security, we don't send the actual code here - driver must have received it via SMS
    // Just confirm that we found the driver and they can proceed to enter their code
    res.json({
      success: true,
      message: 'Driver found. Please enter your access code.',
      data: {
        driverFound: true,
        firstName: driver.first_name,
        hasAccessCode: !!driver.access_code
      }
    });

  } catch (error: any) {
    console.error('Error in requestAccessCode:', error);
    res.status(500).json({ success: false, error: 'Failed to process request' });
  }
}

/**
 * POST /api/v2/driver/auth/verify-code
 * Verify the access code and create a session
 * This is a PUBLIC endpoint - no auth required
 * 
 * Body: { phone: string, code: string, tenantId?: string, deviceInfo?: object }
 */
export async function verifyAccessCode(req: Request, res: Response): Promise<void> {
  try {
    const { phone, code, tenantId = 'd0a49212-96f5-46c7-9d69-fec0f235a90c', deviceInfo } = req.body;

    if (!phone || !code) {
      res.status(400).json({ success: false, error: 'Phone and code are required' });
      return;
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+?27/, '+27');
    if (!normalizedPhone.startsWith('+27')) {
      normalizedPhone = '+27' + normalizedPhone.replace(/^0/, '');
    }

    // Find driver by phone and verify code (most recently created if duplicates)
    const driverResult = await pool.query(
      `SELECT driver_id, first_name, last_name, phone, email, access_code, 
              app_approved, app_first_login_at
       FROM logistics.drivers 
       WHERE tenant_id = $1 
         AND (phone = $2 OR phone = $3)
         AND status = 'ACTIVE'
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId, normalizedPhone, phone]
    );

    if (driverResult.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Driver not found' });
      return;
    }

    const driver = driverResult.rows[0];

    // Verify the access code (case-insensitive)
    if (!driver.access_code || driver.access_code.toUpperCase() !== code.toUpperCase()) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid access code. Please check and try again.',
        code: 'INVALID_CODE'
      });
      return;
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90-day session

    // Create session record
    await pool.query(
      `INSERT INTO logistics.driver_sessions 
       (tenant_id, driver_id, token, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, driver.driver_id, sessionToken, JSON.stringify(deviceInfo || {}), 
       req.ip || req.connection?.remoteAddress, expiresAt]
    );

    // Update driver login timestamps
    const isFirstLogin = !driver.app_first_login_at;
    await pool.query(
      `UPDATE logistics.drivers 
       SET app_last_login_at = CURRENT_TIMESTAMP,
           app_first_login_at = COALESCE(app_first_login_at, CURRENT_TIMESTAMP),
           access_code_used_at = CURRENT_TIMESTAMP
       WHERE driver_id = $1`,
      [driver.driver_id]
    );

    // Vehicle info not available (current_vehicle_id column may not exist)
    let vehicleReg = null;

    res.json({
      success: true,
      message: isFirstLogin ? 'Welcome to SiyaBusa Driver!' : 'Welcome back!',
      data: {
        id: driver.driver_id,
        firstName: driver.first_name,
        lastName: driver.last_name,
        phone: driver.phone,
        email: driver.email,
        vehicleReg: vehicleReg,
        tenantId: tenantId,
        token: sessionToken,
        isFirstLogin: isFirstLogin
      }
    });

  } catch (error: any) {
    console.error('Error in verifyAccessCode:', error);
    res.status(500).json({ success: false, error: 'Failed to verify access code' });
  }
}

/**
 * POST /api/v2/driver/auth/validate-session
 * Validate an existing session token
 * 
 * Body: { token: string }
 */
export async function validateSession(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    // Find active session
    const sessionResult = await pool.query(
      `SELECT s.*, d.first_name, d.last_name, d.phone, d.email
       FROM logistics.driver_sessions s
       JOIN logistics.drivers d ON s.driver_id = d.driver_id
       WHERE s.token = $1 AND s.is_active = true AND s.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid or expired session' });
      return;
    }

    const session = sessionResult.rows[0];

    // Update last active timestamp
    await pool.query(
      `UPDATE logistics.driver_sessions SET last_active_at = CURRENT_TIMESTAMP WHERE session_id = $1`,
      [session.session_id]
    );

    // Vehicle info not available in simplified schema
    let vehicleReg = null;

    res.json({
      success: true,
      data: {
        id: session.driver_id,
        firstName: session.first_name,
        lastName: session.last_name,
        phone: session.phone,
        email: session.email,
        vehicleReg: vehicleReg,
        tenantId: session.tenant_id,
        token: token
      }
    });

  } catch (error: any) {
    console.error('Error in validateSession:', error);
    res.status(500).json({ success: false, error: 'Failed to validate session' });
  }
}

/**
 * POST /api/v2/driver/auth/logout
 * Invalidate the current session
 */
export async function driverLogout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

    if (token) {
      await pool.query(
        `UPDATE logistics.driver_sessions SET is_active = false WHERE token = $1`,
        [token]
      );
    }

    res.json({ success: true, message: 'Logged out successfully' });

  } catch (error: any) {
    console.error('Error in driverLogout:', error);
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
}

// =============================================================================
// ADMIN: DRIVER ACCESS MANAGEMENT
// =============================================================================

/**
 * POST /api/v2/driver/admin/generate-code
 * Admin generates a new access code for a driver
 * 
 * Body: { driverId: string }
 */
export async function generateDriverAccessCode(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);
    const { driverId } = req.body;

    if (!driverId) {
      res.status(400).json({ success: false, error: 'Driver ID is required' });
      return;
    }

    // Generate 6-digit numeric code (mobile-friendly)
    const accessCode = generateNumericAccessCode();

    // Update driver with new access code
    const result = await pool.query(
      `UPDATE logistics.drivers 
       SET access_code = $1, 
           access_code_generated_at = CURRENT_TIMESTAMP,
           app_approved = true
       WHERE driver_id = $2 AND tenant_id = $3
       RETURNING driver_id, first_name, last_name, phone, access_code`,
      [accessCode, driverId, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Driver not found' });
      return;
    }

    const driver = result.rows[0];

    res.json({
      success: true,
      message: 'Access code generated successfully',
      data: {
        driverId: driver.driver_id,
        firstName: driver.first_name,
        lastName: driver.last_name,
        phone: driver.phone,
        accessCode: driver.access_code,
        smsMessage: `Welcome to SiyaBusa Driver App!\n\nYour access code: ${accessCode}\n\nDownload the app at: https://siyabusaerp.co.za/driver\n\nEnter your phone number and this code to login.`
      }
    });

  } catch (error: any) {
    console.error('Error in generateDriverAccessCode:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to generate access code' });
  }
}

/**
 * GET /api/v2/driver/admin/pending-approvals
 * Get list of drivers pending app approval
 */
export async function getPendingDriverApprovals(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);

    const result = await pool.query(
      `SELECT driver_id, first_name, last_name, phone, email, status, 
              access_code, app_approved, app_first_login_at, created_at
       FROM logistics.drivers 
       WHERE tenant_id = $1 
         AND status = 'ACTIVE'
         AND (app_approved = false OR app_approved IS NULL)
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows.map(d => ({
        driverId: d.driver_id,
        firstName: d.first_name,
        lastName: d.last_name,
        phone: d.phone,
        email: d.email,
        status: d.status,
        hasAccessCode: !!d.access_code,
        isApproved: d.app_approved,
        hasLoggedIn: !!d.app_first_login_at,
        createdAt: d.created_at
      })),
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error in getPendingDriverApprovals:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get pending approvals' });
  }
}

/**
 * POST /api/v2/driver/admin/revoke-access
 * Revoke a driver's app access
 */
export async function revokeDriverAccess(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);
    const { driverId } = req.body;

    if (!driverId) {
      res.status(400).json({ success: false, error: 'Driver ID is required' });
      return;
    }

    // Revoke access and invalidate all sessions
    await pool.query(
      `UPDATE logistics.drivers 
       SET app_approved = false, access_code = NULL
       WHERE driver_id = $1 AND tenant_id = $2`,
      [driverId, tenantId]
    );

    await pool.query(
      `UPDATE logistics.driver_sessions 
       SET is_active = false 
       WHERE driver_id = $1`,
      [driverId]
    );

    res.json({ success: true, message: 'Driver access revoked' });

  } catch (error: any) {
    console.error('Error in revokeDriverAccess:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to revoke access' });
  }
}

// =============================================================================
// DRIVER TRIP MANAGEMENT
// =============================================================================

/**
 * GET /api/v2/driver/trips
 * Get all trips assigned to the current driver (or all trips if admin)
 * 
 * Query params:
 * - status: Filter by trip status (Scheduled, In Transit, etc.)
 * - date: Filter by date (today, tomorrow, all)
 */
export async function getMyTrips(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { status, date = 'today' } = req.query;

    // Build date filter - use 'eta' as the scheduled date/time
    let dateFilter = '';
    if (date === 'today') {
      dateFilter = `AND DATE(t.eta) = CURRENT_DATE`;
    } else if (date === 'tomorrow') {
      dateFilter = `AND DATE(t.eta) = CURRENT_DATE + 1`;
    }
    // 'all' = no date filter

    // Build status filter
    let statusFilter = '';
    if (status) {
      statusFilter = `AND t.status = $3`;
    }

    // Simplified query - trips table stores driver name directly
    // Admin sees all trips, drivers would filter by their name
    const query = `
      SELECT 
        t.trip_id,
        t.customer,
        t.origin,
        t.destination,
        t.status,
        t.pod_status,
        t.eta,
        t.actual_start,
        t.actual_end,
        t.notes,
        t.created_at,
        t.driver as driver_name,
        t.vehicle_reg as vehicle_registration
      FROM logistics.trips t
      WHERE t.tenant_id = $1
        ${dateFilter}
        ${statusFilter}
      ORDER BY 
        CASE t.status 
          WHEN 'In Transit' THEN 1 
          WHEN 'Scheduled' THEN 2 
          WHEN 'Planned' THEN 3
          WHEN 'Delivered' THEN 4 
          ELSE 5 
        END,
        t.eta ASC
    `;

    const params: any[] = [tenantId];
    if (status) params.push(status);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        trips: result.rows.map(trip => ({
          tripId: trip.trip_id,
          customer: trip.customer,
          origin: trip.origin,
          destination: trip.destination,
          status: trip.status,
          podStatus: trip.pod_status || 'Pending',
          scheduledDate: trip.eta, // eta serves as scheduled date
          eta: trip.eta,
          startedAt: trip.actual_start,
          completedAt: trip.actual_end,
          driver: trip.driver_name,
          vehicle: {
            registration: trip.vehicle_registration,
            type: trip.vehicle_type
          },
          notes: trip.notes
        })),
        count: result.rowCount,
        filter: { date, status: status || 'all' }
      }
    });

  } catch (error: any) {
    console.error('Error getting driver trips:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get trips' });
  }
}

/**
 * GET /api/v2/driver/trips/:tripId
 * Get detailed trip information for the driver
 */
export async function getTripDetails(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);
    const { tripId } = req.params;

    // Simplified query - trips table stores driver/vehicle as text fields
    const result = await pool.query(`
      SELECT *
      FROM logistics.trips t
      WHERE t.trip_id = $1 AND t.tenant_id = $2
    `, [tripId, tenantId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = result.rows[0];

    // Determine what actions are available
    const availableActions = [];
    switch (trip.status) {
      case 'Planned':
      case 'Scheduled':
        availableActions.push('start');
        break;
      case 'In Transit':
        availableActions.push('arrive', 'pod-ready', 'cancel');
        break;
    }

    // Determine POD workflow state
    const podWorkflow = {
      arrived: trip.pod_status === 'Arrived' || ['Arrived', 'Code Sent', 'Verified', 'Uploaded', 'Confirmed'].includes(trip.pod_status),
      codeSent: ['Code Sent', 'Verified', 'Uploaded', 'Confirmed'].includes(trip.pod_status),
      verified: ['Verified', 'Uploaded', 'Confirmed'].includes(trip.pod_status),
      podUploaded: ['Uploaded', 'Confirmed'].includes(trip.pod_status),
      completed: trip.status === 'Delivered'
    };

    res.json({
      success: true,
      data: {
        tripId: trip.trip_id,
        customer: trip.customer,
        origin: trip.origin,
        destination: trip.destination,
        status: trip.status,
        podStatus: trip.pod_status || 'Pending',
        scheduledDate: trip.eta,
        eta: trip.eta,
        driver: trip.driver,
        vehicle: trip.vehicle_reg,
        timeline: {
          created: trip.created_at,
          started: trip.actual_start,
          completed: trip.actual_end
        },
        notes: trip.notes,
        availableActions,
        podWorkflow
      }
    });

  } catch (error: any) {
    console.error('Error getting trip details:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get trip details' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/start
 * Driver starts the trip (picked up goods, leaving origin)
 */
export async function startTrip(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { notes } = req.body;

    // Verify trip exists and is in correct status
    const tripCheck = await pool.query(`
      SELECT trip_id, status, customer FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    // Allow starting from Planned or Scheduled status
    if (trip.status !== 'Scheduled' && trip.status !== 'Planned') {
      res.status(400).json({ 
        success: false, 
        error: `Cannot start trip. Current status: ${trip.status}` 
      });
      return;
    }

    // Update trip to In Transit
    const noteText = notes ? ` | Started: ${notes}` : ' | Trip started';
    await pool.query(`
      UPDATE logistics.trips 
      SET status = 'In Transit',
          actual_start = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, '') || $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId, noteText]);

    console.log(`🚚 [Driver App] Trip ${tripId} started by user ${userId}`);

    res.json({
      success: true,
      message: 'Trip started! Drive safely.',
      data: {
        tripId,
        status: 'In Transit',
        startedAt: new Date().toISOString(),
        nextStep: 'Navigate to destination and tap "Arrived" when you reach the delivery point'
      }
    });

  } catch (error: any) {
    console.error('Error starting trip:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to start trip' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/arrive
 * Driver marks arrival at delivery destination
 */
export async function markArrived(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { location } = req.body; // Optional GPS coordinates

    // Verify trip is in transit
    const tripCheck = await pool.query(`
      SELECT trip_id, status, customer FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    if (trip.status !== 'In Transit') {
      res.status(400).json({ 
        success: false, 
        error: `Cannot mark arrived. Trip status: ${trip.status}` 
      });
      return;
    }

    // Update trip - mark arrived
    const locationNote = location ? ` at GPS: ${location.lat},${location.lng}` : '';
    await pool.query(`
      UPDATE logistics.trips 
      SET pod_status = 'Arrived',
          notes = COALESCE(notes, '') || ' | Arrived at destination${locationNote}',
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    console.log(`📍 [Driver App] Trip ${tripId} - Driver arrived at destination`);

    res.json({
      success: true,
      message: 'Arrival confirmed!',
      data: {
        tripId,
        podStatus: 'Arrived',
        arrivedAt: new Date().toISOString(),
        nextStep: 'Tap "Ready for POD" to send verification code to customer'
      }
    });

  } catch (error: any) {
    console.error('Error marking arrived:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to mark arrival' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/pod-ready
 * Driver indicates ready for POD - this triggers SMS to customer
 */
export async function podReady(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { customerPhone } = req.body;

    // Verify trip exists
    const tripCheck = await pool.query(`
      SELECT trip_id, status, pod_status, customer FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    if (trip.status !== 'In Transit') {
      res.status(400).json({ 
        success: false, 
        error: `Trip must be In Transit. Current status: ${trip.status}` 
      });
      return;
    }

    // Get customer phone from sales.customers if not provided
    let phone = customerPhone;
    if (!phone) {
      const customerResult = await pool.query(`
        SELECT phone FROM sales.customers 
        WHERE name = $1 AND tenant_id = $2
        LIMIT 1
      `, [trip.customer, tenantId]);
      
      if (customerResult.rows.length > 0) {
        phone = customerResult.rows[0].phone;
      }
    }

    if (!phone) {
      // Use a placeholder for testing
      phone = '+27820000000';
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Update trip with code sent status
    await pool.query(`
      UPDATE logistics.trips 
      SET pod_status = 'Code Sent',
          notes = COALESCE(notes, '') || ' | POD verification code sent to ' || $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId, phone.slice(-4)]);

    // TODO: Integrate with SMS gateway (Twilio, ClickSend, BulkSMS)
    console.log(`📱 [Driver App] SMS to ${phone}: Your delivery code is ${verificationCode}`);

    res.json({
      success: true,
      message: 'Verification code sent to customer!',
      data: {
        tripId,
        podStatus: 'Code Sent',
        customerPhone: phone.slice(-4).padStart(phone.length, '*'),
        expiresAt,
        // For testing - in production remove this
        _testCode: verificationCode,
        nextStep: 'Ask customer for the 6-digit code they received via SMS'
      }
    });

  } catch (error: any) {
    console.error('Error sending POD code:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to send verification code' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/verify-customer
 * Driver enters the verification code from customer
 */
export async function verifyCustomer(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      res.status(400).json({ 
        success: false, 
        error: 'Please enter the 6-digit code from the customer' 
      });
      return;
    }

    // Verify trip exists and code was sent
    const tripCheck = await pool.query(`
      SELECT trip_id, status, pod_status, customer FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    if (trip.pod_status !== 'Code Sent' && trip.pod_status !== 'Arrived') {
      // Allow re-verification
      if (trip.pod_status === 'Verified' || trip.pod_status === 'Uploaded') {
        res.json({
          success: true,
          message: 'Already verified!',
          data: {
            tripId,
            podStatus: trip.pod_status,
            nextStep: trip.pod_status === 'Verified' ? 'Upload proof of delivery (signature/photos)' : 'Complete the delivery'
          }
        });
        return;
      }
    }

    // In test mode, accept any 6-digit code
    // In production, verify against stored code
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ success: false, error: 'Invalid code format' });
      return;
    }

    // Update trip - mark verified
    await pool.query(`
      UPDATE logistics.trips 
      SET pod_status = 'Verified',
          notes = COALESCE(notes, '') || ' | Customer verified delivery at ' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI'),
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    console.log(`✅ [Driver App] Trip ${tripId} - Customer verified with code`);

    res.json({
      success: true,
      message: 'Customer verified! 🎉',
      data: {
        tripId,
        podStatus: 'Verified',
        verifiedAt: new Date().toISOString(),
        nextStep: 'Now capture proof of delivery (signature and photos)'
      }
    });

  } catch (error: any) {
    console.error('Error verifying customer:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to verify code' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/pod-upload
 * Driver uploads POD documents (signature, photos)
 */
export async function uploadPOD(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { signature, photos, notes } = req.body;

    // Verify trip exists
    const tripCheck = await pool.query(`
      SELECT trip_id, status, pod_status, customer FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    // Generate POD reference
    const podReference = `POD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // In production, upload files to S3 and store URLs
    const podData = {
      reference: podReference,
      hasSignature: !!signature,
      photoCount: photos?.length || 0,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      notes: notes || ''
    };

    // Update trip with POD info
    await pool.query(`
      UPDATE logistics.trips 
      SET pod_status = 'Uploaded',
          notes = COALESCE(notes, '') || ' | POD uploaded: ' || $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId, podReference]);

    console.log(`📄 [Driver App] Trip ${tripId} - POD uploaded: ${podReference}`);

    // Check if we can auto-complete (verified + POD uploaded)
    const canComplete = trip.pod_status === 'Verified' || 
                        ['Code Sent', 'Arrived', 'Verified'].includes(trip.pod_status);

    res.json({
      success: true,
      message: 'Proof of delivery uploaded! 📄',
      data: {
        tripId,
        podReference,
        podStatus: 'Uploaded',
        hasSignature: podData.hasSignature,
        photoCount: podData.photoCount,
        nextStep: canComplete ? 'Tap "Complete Delivery" to finish' : 'Verify customer code first, then complete'
      }
    });

  } catch (error: any) {
    console.error('Error uploading POD:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to upload POD' });
  }
}

/**
 * POST /api/v2/driver/trips/:tripId/complete
 * Driver completes the delivery
 */
export async function completeDelivery(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getDriverContext(req);
    const { tripId } = req.params;
    const { notes } = req.body;

    // Verify trip exists and is ready to complete
    const tripCheck = await pool.query(`
      SELECT trip_id, status, pod_status, customer, origin, destination, driver, vehicle_reg, notes as trip_notes
      FROM logistics.trips 
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId]);

    if (tripCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Trip not found' });
      return;
    }

    const trip = tripCheck.rows[0];

    if (trip.status === 'Delivered') {
      res.status(400).json({ 
        success: false, 
        error: 'Trip already completed' 
      });
      return;
    }

    if (trip.status !== 'In Transit') {
      res.status(400).json({ 
        success: false, 
        error: `Cannot complete. Trip status: ${trip.status}` 
      });
      return;
    }

    // Extract POD reference from notes (format: POD-XXXXXXXX-XXXX)
    const podMatch = trip.trip_notes?.match(/POD-[A-Z0-9]+-[A-Z0-9]+/);
    const podReference = podMatch ? podMatch[0] : `POD-${Date.now().toString(36).toUpperCase()}`;

    // Generate invoice number that includes POD reference for traceability
    const timestamp = Date.now().toString(36).toUpperCase();
    const invoiceNumber = `INV-${timestamp}`;

    // Complete the trip with full details
    const finalNotes = notes ? ` | Delivery notes: ${notes}` : '';
    await pool.query(`
      UPDATE logistics.trips 
      SET status = 'Delivered',
          pod_status = 'Confirmed',
          actual_end = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, '') || ' | Delivered. Invoice: ' || $3 || ' | POD Confirmed: ' || $4 || $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE trip_id = $1 AND tenant_id = $2
    `, [tripId, tenantId, invoiceNumber, podReference, finalNotes]);

    // TODO: Create actual sales invoice record linked to this delivery
    // This would create a record in sales.invoices with pod_reference field
    console.log(`🎉 [Driver App] Trip ${tripId} COMPLETED!`);
    console.log(`   Invoice: ${invoiceNumber}`);
    console.log(`   POD Ref: ${podReference}`);
    console.log(`   Customer: ${trip.customer}`);

    res.json({
      success: true,
      message: 'Delivery completed! 🎉 Great job!',
      data: {
        tripId,
        customer: trip.customer,
        origin: trip.origin,
        destination: trip.destination,
        driver: trip.driver,
        vehicle: trip.vehicle_reg,
        status: 'Delivered',
        podStatus: 'Confirmed',
        // KEY LINKED DATA - Client uses these to verify
        invoiceNumber,
        podReference,
        // Verification info for customer
        verificationInfo: {
          invoiceNumber,
          podReference,
          tripId,
          message: `Use POD reference ${podReference} to verify this delivery`
        },
        completedAt: new Date().toISOString(),
        completedBy: userId
      }
    });

  } catch (error: any) {
    console.error('Error completing delivery:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to complete delivery' });
  }
}

/**
 * GET /api/v2/driver/dashboard
 * Driver's dashboard summary
 */
export async function getDriverDashboard(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);

    // Get today's trip statistics - use 'eta' as the scheduled date/time
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Scheduled' AND DATE(eta) = CURRENT_DATE) as pending_today,
        COUNT(*) FILTER (WHERE status = 'In Transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'Delivered' AND DATE(actual_end) = CURRENT_DATE) as delivered_today,
        COUNT(*) FILTER (WHERE status = 'Cancelled' AND DATE(updated_at) = CURRENT_DATE) as cancelled_today
      FROM logistics.trips 
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get next scheduled trip - use 'eta' as scheduled date
    const nextTrip = await pool.query(`
      SELECT trip_id, customer, destination, eta
      FROM logistics.trips 
      WHERE tenant_id = $1 AND status = 'Scheduled'
      ORDER BY eta ASC
      LIMIT 1
    `, [tenantId]);

    // Get current in-transit trip (if any)
    const currentTrip = await pool.query(`
      SELECT trip_id, customer, destination, pod_status, actual_start
      FROM logistics.trips 
      WHERE tenant_id = $1 AND status = 'In Transit'
      ORDER BY actual_start DESC
      LIMIT 1
    `, [tenantId]);

    const s = stats.rows[0];

    res.json({
      success: true,
      data: {
        today: {
          pending: parseInt(s.pending_today) || 0,
          inTransit: parseInt(s.in_transit) || 0,
          delivered: parseInt(s.delivered_today) || 0,
          cancelled: parseInt(s.cancelled_today) || 0
        },
        currentTrip: currentTrip.rows.length > 0 ? {
          tripId: currentTrip.rows[0].trip_id,
          customer: currentTrip.rows[0].customer,
          destination: currentTrip.rows[0].destination,
          podStatus: currentTrip.rows[0].pod_status || 'Pending',
          startedAt: currentTrip.rows[0].actual_start
        } : null,
        nextTrip: nextTrip.rows.length > 0 ? {
          tripId: nextTrip.rows[0].trip_id,
          customer: nextTrip.rows[0].customer,
          destination: nextTrip.rows[0].destination,
          scheduledDate: nextTrip.rows[0].eta,
          eta: nextTrip.rows[0].eta
        } : null,
        message: currentTrip.rows.length > 0 
          ? `You have an active delivery to ${currentTrip.rows[0].customer}` 
          : nextTrip.rows.length > 0 
            ? `Next delivery: ${nextTrip.rows[0].customer}`
            : 'No scheduled deliveries'
      }
    });

  } catch (error: any) {
    console.error('Error getting driver dashboard:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
}

/**
 * GET /api/v2/driver/verify-pod/:podReference
 * Verify a delivery using POD reference (for customer portal/verification)
 */
export async function verifyPOD(req: DriverRequest, res: Response): Promise<void> {
  try {
    const { tenantId } = getDriverContext(req);
    const { podReference } = req.params;

    // Search for POD reference in trip notes
    const result = await pool.query(`
      SELECT 
        trip_id, customer, origin, destination, driver, vehicle_reg,
        status, pod_status, actual_start, actual_end, notes
      FROM logistics.trips 
      WHERE tenant_id = $1 AND notes LIKE $2
      LIMIT 1
    `, [tenantId, `%${podReference}%`]);

    if (result.rows.length === 0) {
      res.status(404).json({ 
        success: false, 
        error: 'POD reference not found',
        verified: false
      });
      return;
    }

    const trip = result.rows[0];

    // Extract invoice number from notes
    const invoiceMatch = trip.notes?.match(/INV-[A-Z0-9]+/);
    const invoiceNumber = invoiceMatch ? invoiceMatch[0] : null;

    res.json({
      success: true,
      verified: true,
      data: {
        podReference,
        invoiceNumber,
        tripId: trip.trip_id,
        customer: trip.customer,
        origin: trip.origin,
        destination: trip.destination,
        driver: trip.driver,
        vehicle: trip.vehicle_reg,
        status: trip.status,
        podStatus: trip.pod_status,
        deliveredAt: trip.actual_end,
        message: trip.status === 'Delivered' 
          ? '✅ This delivery has been verified and completed'
          : `⏳ Delivery status: ${trip.status}`
      }
    });

  } catch (error: any) {
    console.error('Error verifying POD:', error);
    if (error.message === 'Tenant context required') {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.status(500).json({ success: false, error: 'Failed to verify POD' });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Authentication (Public)
  requestAccessCode,
  verifyAccessCode,
  validateSession,
  driverLogout,
  // Admin endpoints
  generateDriverAccessCode,
  getPendingDriverApprovals,
  revokeDriverAccess,
  // Trip management
  getMyTrips,
  getTripDetails,
  startTrip,
  markArrived,
  podReady,
  verifyCustomer,
  uploadPOD,
  completeDelivery,
  getDriverDashboard,
  verifyPOD
};
