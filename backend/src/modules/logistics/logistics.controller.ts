import { Request, Response } from 'express';
import pool from '../../config/database';
import crypto from 'crypto';

/**
 * Generate a 6-digit numeric access code for driver app
 * Numeric-only so mobile keyboards show number pad
 */
function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS to driver with access code (placeholder - integrate with SMS provider)
 */
async function sendDriverWelcomeSMS(phone: string, firstName: string, accessCode: string): Promise<boolean> {
  const message = `Welcome to SiyaBusa Driver App, ${firstName}!\n\nYour access code: ${accessCode}\n\nDownload: https://siyabusaerp.co.za/driver\n\nEnter your phone number and this code to login.`;
  
  // TODO: Integrate with SMS provider (Clickatell, BulkSMS, etc.)
  console.log(`📱 SMS to ${phone}:\n${message}`);
  
  // For now, log the SMS - in production, integrate with SMS API
  // Example integration points:
  // - Clickatell: https://www.clickatell.com/
  // - BulkSMS: https://www.bulksms.com/
  // - Twilio: https://www.twilio.com/
  
  return true;
}

// Helper to get table name (checks if logistics schema exists)
const getTableName = (table: string) => `logistics.${table}`;

// ============================================================================
// 1. FLEET & VEHICLES
// ============================================================================

/**
 * GET /api/logistics/vehicles
 * Get all vehicles with filtering
 */
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      status, 
      vehicle_type, 
      search 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // First check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'logistics' AND table_name = 'vehicles'
      ) as exists
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Return empty data if table doesn't exist
      return res.json({
        vehicles: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Logistics module not initialized. Please run database migration.'
      });
    }

    let query = `
      SELECT v.*
      FROM logistics.vehicles v
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND v.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    } else {
      query += ` AND v.status = 'ACTIVE'`;
    }

    if (vehicle_type) {
      query += ` AND v.vehicle_type = $${paramCount}`;
      values.push(vehicle_type);
      paramCount++;
    }

    if (search) {
      query += ` AND (v.vehicle_registration ILIKE $${paramCount} OR v.make ILIKE $${paramCount} OR v.model ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Count total
    const countQuery = query.replace(/SELECT v\.\*/, 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY v.created_at DESC NULLS LAST LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({
      vehicles: result.rows,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles', details: error.message });
  }
};

/**
 * GET /api/logistics/vehicles/:id
 * Get single vehicle by ID
 */
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT v.*
      FROM logistics.vehicles v
      WHERE v.vehicle_id = $1 AND v.status = 'ACTIVE'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

/**
 * POST /api/logistics/vehicles
 * Create new vehicle
 */
export const createVehicle = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      vehicle_registration,
      vehicle_type,
      make,
      model,
      year,
      capacity_kg,
      capacity_m3,
      fuel_type,
      fuel_tank_capacity,
      license_expiry_date,
      insurance_expiry_date,
      last_service_date,
      next_service_date,
      current_mileage,
      notes
    } = req.body;

    // Get tenant from authenticated user
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).tenant?.id;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO logistics.vehicles (
        tenant_id, vehicle_registration, vehicle_type, make, model, year,
        capacity_kg, capacity_m3, fuel_type, fuel_tank_capacity,
        license_expiry_date, insurance_expiry_date, last_service_date,
        next_service_date, current_mileage, notes, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'ACTIVE'
      ) RETURNING *`,
      [
        tenantId,
        vehicle_registration,
        vehicle_type,
        make || null,
        model || null,
        year || null,
        capacity_kg || null,
        capacity_m3 || null,
        fuel_type || null,
        fuel_tank_capacity || null,
        license_expiry_date || null,
        insurance_expiry_date || null,
        last_service_date || null,
        next_service_date || null,
        current_mileage || 0,
        notes || null
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ vehicle: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/logistics/vehicles/:id
 * Update vehicle
 */
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    const allowedFields = [
      'vehicle_registration', 'make', 'model', 'status', 'current_location',
      'driver_id', 'last_service_date', 'last_service_odometer',
      'next_service_date', 'next_service_odometer', 'gps_device_id', 'gps_provider'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(fields).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(fields[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE logistics.vehicles SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

/**
 * DELETE /api/logistics/vehicles/:id
 * Delete vehicle (soft delete)
 */
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE logistics.vehicles SET status = \'INACTIVE\' WHERE vehicle_id = $1 RETURNING vehicle_id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};

// ============================================================================
// 2. DRIVERS
// ============================================================================

/**
 * GET /api/logistics/drivers
 * Get all drivers
 */
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', status, search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'logistics' AND table_name = 'drivers'
      ) as exists
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        drivers: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Logistics module not initialized. Please run database migration.'
      });
    }

    let query = `
      SELECT d.*
      FROM logistics.drivers d
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND (d.status = $${paramCount} OR d.employment_status = $${paramCount})`;
      values.push(status);
      paramCount++;
    } else {
      query += ` AND (d.status = 'ACTIVE' OR d.employment_status = 'ACTIVE')`;
    }

    if (search) {
      query += ` AND (d.first_name ILIKE $${paramCount} OR d.last_name ILIKE $${paramCount} OR d.id_number ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    const countQuery = query.replace(/SELECT d\.\*/, 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY d.created_at DESC NULLS LAST LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({
      drivers: result.rows,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers', details: error.message });
  }
};

/**
 * GET /api/logistics/drivers/:id
 * Get single driver
 */
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.*
      FROM logistics.drivers d
      WHERE d.driver_id = $1 AND d.employment_status = 'ACTIVE'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: result.rows[0] });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

/**
 * POST /api/logistics/drivers
 * Create new driver - auto-generates access code and sends SMS
 */
export const createDriver = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      first_name,
      last_name,
      id_number,
      license_number,
      license_expiry_date,
      phone,
      email,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      hire_date,
      notes,
      send_app_invite = true  // Default: send SMS invite
    } = req.body;

    // Get tenant from authenticated user
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).tenant?.id;

    // Generate access code for mobile app
    const accessCode = generateAccessCode();

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO logistics.drivers (
        tenant_id, first_name, last_name, id_number,
        license_number, license_expiry, phone, email,
        emergency_contact, emergency_phone, hire_date,
        notes, status,
        access_code, access_code_generated_at, app_approved
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE',
        $13, CURRENT_TIMESTAMP, true
      ) RETURNING *`,
      [
        tenantId,
        first_name,
        last_name,
        id_number || null,
        license_number || null,
        license_expiry_date || null,
        phone || null,
        email || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        hire_date || null,
        notes || null,
        accessCode
      ]
    );

    await client.query('COMMIT');

    const driver = result.rows[0];

    // Send SMS with access code if phone is provided
    let smsSent = false;
    if (phone && send_app_invite) {
      smsSent = await sendDriverWelcomeSMS(phone, first_name, accessCode);
    }

    res.status(201).json({ 
      driver: {
        ...driver,
        access_code: accessCode  // Include in response for admin to see
      },
      accessCode,  // Also at top level for frontend convenience
      smsSent,
      message: smsSent 
        ? `Driver created! SMS sent to ${phone} with app access code.`
        : `Driver created! Access code: ${accessCode} (SMS not sent - no phone number)`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/logistics/drivers/:id
 * Update driver
 */
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    const allowedFields = [
      'phone', 'email', 'physical_address', 'status',
      'current_vehicle_id', 'license_expiry_date', 'prdp_expiry_date',
      'mobile_app_enabled', 'mobile_phone_number'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(fields).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(fields[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE logistics.drivers SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE driver_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ driver: result.rows[0] });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

/**
 * DELETE /api/logistics/drivers/:id
 * Delete driver (soft delete)
 */
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE logistics.drivers SET employment_status = $1 WHERE driver_id = $2 RETURNING driver_id',
      ['TERMINATED', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

/**
 * POST /api/logistics/drivers/:id/resend-app-invite
 * Regenerate access code and resend SMS invite to driver
 */
export const resendDriverAppInvite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Generate new access code
    const accessCode = generateAccessCode();

    // Update driver with new code
    const result = await pool.query(
      `UPDATE logistics.drivers 
       SET access_code = $1, 
           access_code_generated_at = CURRENT_TIMESTAMP,
           app_approved = true
       WHERE driver_id = $2
       RETURNING driver_id, first_name, last_name, phone, access_code`,
      [accessCode, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = result.rows[0];

    // Send SMS with new access code
    let smsSent = false;
    if (driver.phone) {
      smsSent = await sendDriverWelcomeSMS(driver.phone, driver.first_name, accessCode);
    }

    res.json({ 
      success: true,
      accessCode,
      smsSent,
      message: smsSent 
        ? `New access code sent to ${driver.phone}`
        : `New access code: ${accessCode} (no phone number for SMS)`
    });
  } catch (error) {
    console.error('Error resending driver app invite:', error);
    res.status(500).json({ error: 'Failed to resend app invite' });
  }
};

// ============================================================================
// 3. TRIPS
// ============================================================================

/**
 * GET /api/logistics/trips
 * Get all trips with filtering
 */
export const getTrips = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      status, 
      vehicle_id, 
      driver_id,
      date_from,
      date_to,
      search 
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT t.*,
        v.vehicle_registration, v.vehicle_registration,
        d.first_name || ' ' || d.last_name as driver_name,
        d.phone as driver_phone
      FROM logistics.trips t
      LEFT JOIN logistics.vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN logistics.drivers d ON t.driver_id = d.driver_id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND t.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (vehicle_id) {
      query += ` AND t.vehicle_id = $${paramCount}`;
      values.push(vehicle_id);
      paramCount++;
    }

    if (driver_id) {
      query += ` AND t.driver_id = $${paramCount}`;
      values.push(driver_id);
      paramCount++;
    }

    if (date_from) {
      query += ` AND t.trip_date >= $${paramCount}`;
      values.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND t.trip_date <= $${paramCount}`;
      values.push(date_to);
      paramCount++;
    }

    if (search) {
      query += ` AND (t.trip_number ILIKE $${paramCount} OR t.pickup_location ILIKE $${paramCount} OR t.delivery_location ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/LEFT JOIN.*driver_phone/, '');
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY t.trip_date DESC, t.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit as string), offset);

    const result = await pool.query(query, values);

    res.json({
      trips: result.rows,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

/**
 * GET /api/logistics/trips/:id
 * Get single trip with stops
 */
export const getTripById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get trip details
    const tripResult = await pool.query(
      `SELECT t.*,
        v.vehicle_registration, v.vehicle_registration, v.make, v.model,
        d.first_name || ' ' || d.last_name as driver_name,
        d.phone as driver_phone, d.license_number
      FROM logistics.trips t
      LEFT JOIN logistics.vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN logistics.drivers d ON t.driver_id = d.driver_id
      WHERE t.trip_id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Get trip stops
    const stopsResult = await pool.query(
      `SELECT * FROM logistics_trip_stops 
       WHERE trip_id = $1 ORDER BY stop_sequence ASC`,
      [id]
    );

    res.json({ 
      trip: {
        ...tripResult.rows[0],
        stops: stopsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
};

/**
 * POST /api/logistics/trips
 * Create new trip
 */
export const createTrip = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      sales_order_id,
      customer_id,
      vehicle_id,
      driver_id,
      route_id,
      trip_date,
      planned_start_time,
      planned_end_time,
      pickup_location,
      pickup_contact_name,
      pickup_contact_phone,
      delivery_location,
      delivery_contact_name,
      delivery_contact_phone,
      cargo_description,
      cargo_weight_kg,
      cargo_volume_m3,
      number_of_items,
      planned_distance_km,
      trip_revenue = 0,
      stops = [],
      created_by
    } = req.body;

    await client.query('BEGIN');

    // Generate trip number: TRIP-202511-0001
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM logistics.trips WHERE trip_number LIKE $1`,
      [`TRIP-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const trip_number = `TRIP-${yearMonth}-${String(nextNum).padStart(6, '0')}`;

    // Create trip
    const tripResult = await client.query(
      `INSERT INTO logistics.trips (
        tenant_id, trip_number, sales_order_id, customer_id, vehicle_id, driver_id,
        route_id, trip_date, planned_start_time, planned_end_time,
        pickup_location, pickup_contact_name, pickup_contact_phone,
        delivery_location, delivery_contact_name, delivery_contact_phone,
        cargo_description, cargo_weight_kg, cargo_volume_m3, number_of_items,
        planned_distance_km, trip_revenue, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'PLANNED', $23
      ) RETURNING *`,
      [
        req.user?.tenantId || '00000000-0000-0000-0000-000000000000',
        trip_number, sales_order_id, customer_id, vehicle_id, driver_id, route_id,
        trip_date, planned_start_time, planned_end_time,
        pickup_location, pickup_contact_name, pickup_contact_phone,
        delivery_location, delivery_contact_name, delivery_contact_phone,
        cargo_description, cargo_weight_kg, cargo_volume_m3, number_of_items,
        planned_distance_km, trip_revenue,
        created_by || req.user?.id || '00000000-0000-0000-0000-000000000000'
      ]
    );

    const trip_id = tripResult.rows[0].trip_id;

    // Create stops if provided
    if (stops && stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        await client.query(
          `INSERT INTO logistics_trip_stops (
            trip_id, stop_sequence, stop_type, location_name, location_address,
            contact_name, contact_phone, planned_arrival_time, items_description,
            items_weight_kg, items_count, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING')`,
          [
            trip_id, i + 1, stop.stop_type, stop.location_name, stop.location_address,
            stop.contact_name, stop.contact_phone, stop.planned_arrival_time,
            stop.items_description, stop.items_weight_kg, stop.items_count
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ trip: tripResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/logistics/trips/:id
 * Update trip
 */
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    const allowedFields = [
      'status', 'actual_start_time', 'actual_end_time', 'actual_distance_km',
      'trip_cost', 'pod_received', 'pod_signature_path', 'pod_photo_path',
      'pod_notes', 'pod_timestamp'
    ];

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(fields).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(fields[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE logistics.trips SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE trip_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip: result.rows[0] });
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
};

/**
 * POST /api/logistics/trips/:id/start
 * Start trip (driver action)
 */
export const startTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { odometer_reading } = req.body;

    const result = await pool.query(
      `UPDATE logistics.trips 
       SET status = 'IN_TRANSIT', 
           actual_start_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $1 AND status IN ('PLANNED', 'ASSIGNED')
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or cannot be started' });
    }

    res.json({ trip: result.rows[0], message: 'Trip started successfully' });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
};

/**
 * POST /api/logistics/trips/:id/complete
 * Complete trip with POD
 */
export const completeTrip = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      actual_distance_km,
      pod_signature_path,
      pod_photo_path,
      pod_notes
    } = req.body;

    const result = await pool.query(
      `UPDATE logistics.trips 
       SET status = 'DELIVERED',
           actual_end_time = CURRENT_TIMESTAMP,
           actual_distance_km = $1,
           pod_received = true,
           pod_signature_path = $2,
           pod_photo_path = $3,
           pod_notes = $4,
           pod_timestamp = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE trip_id = $5 AND status = 'IN_TRANSIT'
       RETURNING *`,
      [actual_distance_km, pod_signature_path, pod_photo_path, pod_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found or not in transit' });
    }

    res.json({ trip: result.rows[0], message: 'Trip completed successfully' });
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

// ============================================================================
// 4. FUEL MANAGEMENT
// ============================================================================

/**
 * GET /api/logistics/fuel
 * Get fuel transactions
 */
export const getFuelTransactions = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      vehicle_id,
      date_from,
      date_to
    } = req.query;

    // Get tenant from authenticated user
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || (req as any).tenant?.id;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const values: any[] = [tenantId];
    let paramCount = 2;
    const filters: string[] = ['f.tenant_id = $1'];

    if (vehicle_id) {
      filters.push(`f.vehicle_id = $${paramCount}`);
      values.push(parseInt(vehicle_id as string));
      paramCount++;
    }

    if (date_from) {
      filters.push(`f.transaction_date >= $${paramCount}`);
      values.push(date_from);
      paramCount++;
    }

    if (date_to) {
      filters.push(`f.transaction_date <= $${paramCount}`);
      values.push(date_to);
      paramCount++;
    }

    const whereClause = filters.join(' AND ');

    const countQuery = `
      SELECT COUNT(*)
      FROM logistics.fuel_transactions f
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult?.rows?.[0]?.count ?? '0', 10);

    const dataQuery = `
      SELECT f.*, v.vehicle_registration
      FROM logistics.fuel_transactions f
      LEFT JOIN logistics.vehicles v ON f.vehicle_id::text = v.vehicle_id::text
      WHERE ${whereClause}
      ORDER BY f.transaction_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const dataValues = [...values, parseInt(limit as string, 10), offset];
    const result = await pool.query(dataQuery, dataValues);

    res.json({
      fuel_transactions: result.rows,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Error fetching fuel transactions:', error);
    res.status(500).json({ error: 'Failed to fetch fuel transactions' });
  }
};

/**
 * POST /api/logistics/fuel
 * Create fuel transaction
 */
export const createFuelTransaction = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_id,
      transaction_date = new Date(),
      fuel_station,
      fuel_type = 'Diesel',
      litres,
      price_per_litre,
      odometer_reading
    } = req.body;

    const total_amount = litres * price_per_litre;
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || req.user?.tenantId || '00000000-0000-0000-0000-000000000001';

    const result = await pool.query(
      `INSERT INTO logistics.fuel_transactions (
        tenant_id, vehicle_id, transaction_date,
        fuel_station, fuel_type, litres,
        price_per_litre, total_amount, odometer_reading
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *`,
      [
        tenantId,
        vehicle_id,
        transaction_date,
        fuel_station || null,
        fuel_type,
        litres,
        price_per_litre,
        total_amount,
        odometer_reading || null
      ]
    );

    res.status(201).json({ fuel_transaction: result.rows[0] });
  } catch (error) {
    console.error('Error creating fuel transaction:', error);
    res.status(500).json({ error: 'Failed to create fuel transaction' });
  }
};

/**
 * POST /api/logistics/fuel/:id/reconcile
 * Reconcile fuel transaction
 */
export const reconcileFuelTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variance_litres = 0, variance_amount = 0 } = req.body;

    const result = await pool.query(
        `UPDATE logistics.fuel_transactions
       SET reconciled = true,
           variance_litres = $1,
           variance_amount = $2
       WHERE transaction_id = $3
       RETURNING *`,
      [variance_litres, variance_amount, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel transaction not found' });
    }

    res.json({ fuel_transaction: result.rows[0], message: 'Transaction reconciled' });
  } catch (error) {
    console.error('Error reconciling fuel transaction:', error);
    res.status(500).json({ error: 'Failed to reconcile transaction' });
  }
};

// ============================================================================
// 5. LOAD PLANNING
// ============================================================================

/**
 * GET /api/logistics/loads
 * Get all loads
 */
export const getLoads = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', status, date_from, date_to } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const values: any[] = [];
    let paramCount = 1;
    const filters: string[] = ['1=1'];

    if (status) {
      filters.push(`l.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (date_from) {
      filters.push(`l.load_date >= $${paramCount}`);
      values.push(date_from);
      paramCount++;
    }

    if (date_to) {
      filters.push(`l.load_date <= $${paramCount}`);
      values.push(date_to);
      paramCount++;
    }

    const whereClause = filters.join(' AND ');

    const countQuery = `
      SELECT COUNT(*)
      FROM logistics.loads l
      LEFT JOIN logistics.vehicles v ON l.vehicle_id::text = v.vehicle_id::text
      LEFT JOIN logistics.drivers d ON l.driver_id::text = d.driver_id::text
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult?.rows?.[0]?.count ?? '0', 10);

    const dataQuery = `
      SELECT l.*, v.vehicle_registration, d.first_name || ' ' || d.last_name as driver_name
      FROM logistics.loads l
      LEFT JOIN logistics.vehicles v ON l.vehicle_id::text = v.vehicle_id::text
      LEFT JOIN logistics.drivers d ON l.driver_id::text = d.driver_id::text
      WHERE ${whereClause}
      ORDER BY l.load_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const dataValues = [...values, parseInt(limit as string, 10), offset];
    const result = await pool.query(dataQuery, dataValues);

    res.json({
      loads: result.rows,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string))
    });
  } catch (error) {
    console.error('Error fetching loads:', error);
    res.status(500).json({ error: 'Failed to fetch loads' });
  }
};

/**
 * GET /api/logistics/loads/:id
 * Get single load with items
 */
export const getLoadById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loadResult = await pool.query(
      `SELECT l.*,
        v.vehicle_registration, v.vehicle_registration,
        d.first_name || ' ' || d.last_name as driver_name
      FROM logistics.loads l
      LEFT JOIN logistics.vehicles v ON l.vehicle_id::text = v.vehicle_id::text
      LEFT JOIN logistics.drivers d ON l.driver_id::text = d.driver_id::text
      WHERE l.load_id = $1`,
      [id]
    );

    if (loadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    const itemsResult = await pool.query(
      `SELECT * FROM logistics_load_items 
       WHERE load_id = $1 ORDER BY delivery_sequence ASC`,
      [id]
    );

    res.json({
      load: {
        ...loadResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching load:', error);
    res.status(500).json({ error: 'Failed to fetch load' });
  }
};

/**
 * POST /api/logistics/loads
 * Create new load
 */
export const createLoad = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      load_date,
      vehicle_id,
      driver_id,
      items = [],
      created_by
    } = req.body;

    await client.query('BEGIN');

    // Generate load number
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await client.query(
      `SELECT COUNT(*) FROM logistics.loads WHERE load_number LIKE $1`,
      [`LOAD-${yearMonth}-%`]
    );
    const nextNum = parseInt(countResult.rows[0].count) + 1;
    const load_number = `LOAD-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    // Calculate totals
    let total_weight_kg = 0;
    let total_volume_m3 = 0;
    items.forEach((item: any) => {
      total_weight_kg += parseFloat(item.weight_kg || 0);
      total_volume_m3 += parseFloat(item.volume_m3 || 0);
    });

    const loadResult = await client.query(
      `INSERT INTO logistics.loads (
        tenant_id, load_number, load_date, vehicle_id, driver_id,
        total_weight_kg, total_volume_m3, number_of_orders,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9
      ) RETURNING *`,
      [
        req.user?.tenantId || '00000000-0000-0000-0000-000000000000',
        load_number, load_date, vehicle_id, driver_id,
        total_weight_kg, total_volume_m3, items.length,
        created_by || req.user?.id || '00000000-0000-0000-0000-000000000000'
      ]
    );

    const load_id = loadResult.rows[0].load_id;

    // Create load items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        `INSERT INTO logistics_load_items (
          load_id, sales_order_id, customer_id, delivery_address,
          delivery_contact, delivery_phone, item_description,
          weight_kg, volume_m3, quantity, delivery_sequence, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING')`,
        [
          load_id, item.sales_order_id, item.customer_id, item.delivery_address,
          item.delivery_contact, item.delivery_phone, item.item_description,
          item.weight_kg, item.volume_m3, item.quantity, i + 1
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ load: loadResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating load:', error);
    res.status(500).json({ error: 'Failed to create load' });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/logistics/loads/:id/status
 * Update load status
 */
export const updateLoadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE logistics.loads
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE load_id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Load not found' });
    }

    res.json({ load: result.rows[0] });
  } catch (error) {
    console.error('Error updating load status:', error);
    res.status(500).json({ error: 'Failed to update load status' });
  }
};

// ============================================================================
// 6. MAINTENANCE
// ============================================================================

/**
 * GET /api/logistics/maintenance
 * Get maintenance records
 */
export const getMaintenanceRecords = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, date_from, date_to } = req.query;

    let query = `
      SELECT m.*,
        v.vehicle_registration, v.vehicle_registration
      FROM logistics_vehicle_maintenance m
      LEFT JOIN logistics.vehicles v ON m.vehicle_id = v.vehicle_id
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 1;

    if (vehicle_id) {
      query += ` AND m.vehicle_id = $${paramCount}`;
      values.push(vehicle_id);
      paramCount++;
    }

    if (date_from) {
      query += ` AND m.maintenance_date >= $${paramCount}`;
      values.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND m.maintenance_date <= $${paramCount}`;
      values.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY m.maintenance_date DESC`;

    const result = await pool.query(query, values);

    res.json({ maintenance_records: result.rows });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
};

/**
 * POST /api/logistics/maintenance
 * Create maintenance record
 */
export const createMaintenanceRecord = async (req: Request, res: Response) => {
  try {
    const {
      vehicle_id,
      maintenance_type,
      maintenance_date,
      odometer_reading,
      service_provider,
      invoice_number,
      cost,
      description,
      parts_replaced,
      labor_hours,
      next_service_due_date,
      next_service_due_km,
      created_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO logistics_vehicle_maintenance (
        tenant_id, vehicle_id, maintenance_type, maintenance_date,
        odometer_reading, service_provider, invoice_number, cost,
        description, parts_replaced, labor_hours, next_service_due_date,
        next_service_due_km, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'COMPLETED', $14
      ) RETURNING *`,
      [
        req.user?.tenantId || '00000000-0000-0000-0000-000000000000',
        vehicle_id, maintenance_type, maintenance_date, odometer_reading,
        service_provider, invoice_number, cost, description, parts_replaced,
        labor_hours, next_service_due_date, next_service_due_km,
        created_by || req.user?.id || '00000000-0000-0000-0000-000000000000'
      ]
    );

    // Update vehicle's last service info
    await pool.query(
      `UPDATE logistics.vehicles
       SET last_service_date = $1,
           last_service_odometer = $2,
           next_service_date = $3,
           next_service_odometer = $4
       WHERE vehicle_id = $5`,
      [maintenance_date, odometer_reading, next_service_due_date, next_service_due_km, vehicle_id]
    );

    res.status(201).json({ maintenance_record: result.rows[0] });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Failed to create maintenance record' });
  }
};

// ============================================================================
// 7. DASHBOARD & ANALYTICS
// ============================================================================

/**
 * GET /api/logistics/dashboard
 * Get logistics dashboard stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Check if logistics schema exists
    const schemaCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.schemata 
        WHERE schema_name = 'logistics'
      ) as exists
    `);
    
    if (!schemaCheck.rows[0].exists) {
      // Return default stats if schema doesn't exist
      return res.json({
        vehicles: { total: 0, active: 0, in_maintenance: 0 },
        drivers: { total: 0, active: 0, on_trip: 0 },
        trips_today: { total: 0, in_progress: 0, completed: 0 },
        fuel_this_month: { total_fuel_cost: 0, total_litres: 0 },
        pending_loads: 0,
        alerts: { expiring_documents: 0 },
        message: 'Logistics module not initialized. Please run database migration.'
      });
    }

    // Active vehicles
    let totalVehicles = 0;
    let activeVehicles = 0;
    let inMaintenanceVehicles = 0;
    
    try {
      const vehiclesResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE status = 'MAINTENANCE') as in_maintenance
        FROM logistics.vehicles
      `);
      totalVehicles = parseInt(vehiclesResult.rows[0]?.total || 0);
      activeVehicles = parseInt(vehiclesResult.rows[0]?.active || 0);
      inMaintenanceVehicles = parseInt(vehiclesResult.rows[0]?.in_maintenance || 0);
    } catch (e) {
      console.log('Vehicles table may not exist:', e);
    }

    // Active drivers
    let totalDrivers = 0;
    let activeDrivers = 0;
    
    try {
      const driversResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ACTIVE' OR employment_status = 'ACTIVE') as active
        FROM logistics.drivers
      `);
      totalDrivers = parseInt(driversResult.rows[0]?.total || 0);
      activeDrivers = parseInt(driversResult.rows[0]?.active || 0);
    } catch (e) {
      console.log('Drivers table may not exist:', e);
    }

    // Today's trips
    let tripsTotal = 0;
    let tripsInProgress = 0;
    let tripsCompleted = 0;
    
    try {
      const tripsResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as in_progress,
          COUNT(*) FILTER (WHERE status = 'DELIVERED') as completed
        FROM logistics.trips
        WHERE trip_date = CURRENT_DATE
      `);
      tripsTotal = parseInt(tripsResult.rows[0]?.total || 0);
      tripsInProgress = parseInt(tripsResult.rows[0]?.in_progress || 0);
      tripsCompleted = parseInt(tripsResult.rows[0]?.completed || 0);
    } catch (e) {
      console.log('Trips table may not exist:', e);
    }

    // This month fuel costs
    let totalFuelCost = 0;
    let totalLitres = 0;
    
    try {
      const fuelResult = await pool.query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_fuel_cost,
          COALESCE(SUM(litres), 0) as total_litres
        FROM logistics.fuel_transactions
        WHERE EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);
      totalFuelCost = parseFloat(fuelResult.rows[0]?.total_fuel_cost || 0);
      totalLitres = parseFloat(fuelResult.rows[0]?.total_litres || 0);
    } catch (e) {
      console.log('Fuel transactions table may not exist:', e);
    }

    // Pending loads
    let pendingLoads = 0;
    
    try {
      const loadsResult = await pool.query(`
        SELECT COUNT(*) as pending_loads
        FROM logistics.loads
        WHERE status IN ('DRAFT', 'PLANNED')
      `);
      pendingLoads = parseInt(loadsResult.rows[0]?.pending_loads || 0);
    } catch (e) {
      console.log('Loads table may not exist:', e);
    }

    res.json({
      vehicles: { 
        total: totalVehicles, 
        active: activeVehicles, 
        in_maintenance: inMaintenanceVehicles 
      },
      drivers: { 
        total: totalDrivers, 
        active: activeDrivers, 
        on_trip: 0 
      },
      trips_today: { 
        total: tripsTotal, 
        in_progress: tripsInProgress, 
        completed: tripsCompleted 
      },
      fuel_this_month: { 
        total_fuel_cost: totalFuelCost, 
        total_litres: totalLitres 
      },
      pending_loads: pendingLoads,
      alerts: { 
        expiring_documents: 0 
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
};
