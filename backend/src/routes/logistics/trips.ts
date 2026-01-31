import express, { Request, Response } from 'express';
import pool from '../../config/database';

const router = express.Router();

/**
 * GET /api/logistics/trips
 * Get all trips with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, pod_status, customer, driver, from_date, to_date } = req.query;

    let query = `
      SELECT 
        trip_id,
        customer,
        origin,
        destination,
        driver,
        vehicle_reg,
        status,
        pod_status,
        eta,
        created_at,
        updated_at
      FROM logistics.trips
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (pod_status) {
      query += ` AND pod_status = $${paramCount}`;
      params.push(pod_status);
      paramCount++;
    }

    if (customer) {
      query += ` AND customer ILIKE $${paramCount}`;
      params.push(`%${customer}%`);
      paramCount++;
    }

    if (driver) {
      query += ` AND driver ILIKE $${paramCount}`;
      params.push(`%${driver}%`);
      paramCount++;
    }

    if (from_date) {
      query += ` AND eta >= $${paramCount}`;
      params.push(from_date);
      paramCount++;
    }

    if (to_date) {
      query += ` AND eta <= $${paramCount}`;
      params.push(to_date);
      paramCount++;
    }

    query += ` ORDER BY eta DESC`;

    const result = await pool.query(query, params);

    res.json({
      trips: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trips',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logistics/trips/:id
 * Get single trip details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM logistics.trips WHERE trip_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/logistics/trips
 * Create new trip
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      customer,
      origin,
      destination,
      driver,
      vehicle_reg,
      status = 'Planned',
      pod_status = 'Pending',
      eta
    } = req.body;

    // Validate required fields
    if (!customer || !origin || !destination || !driver || !vehicle_reg || !eta) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate trip ID
    const tripIdResult = await pool.query(
      `SELECT 'TRP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
       LPAD((COUNT(*) + 1)::TEXT, 5, '0') as trip_id 
       FROM logistics.trips 
       WHERE trip_id LIKE 'TRP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'`
    );
    const trip_id = tripIdResult.rows[0].trip_id;

    const result = await pool.query(
      `INSERT INTO logistics.trips 
       (trip_id, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [trip_id, customer, origin, destination, driver, vehicle_reg, status, pod_status, eta]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ 
      error: 'Failed to create trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/logistics/trips/:id
 * Update trip
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customer,
      origin,
      destination,
      driver,
      vehicle_reg,
      status,
      pod_status,
      eta
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (customer !== undefined) {
      updates.push(`customer = $${paramCount}`);
      params.push(customer);
      paramCount++;
    }
    if (origin !== undefined) {
      updates.push(`origin = $${paramCount}`);
      params.push(origin);
      paramCount++;
    }
    if (destination !== undefined) {
      updates.push(`destination = $${paramCount}`);
      params.push(destination);
      paramCount++;
    }
    if (driver !== undefined) {
      updates.push(`driver = $${paramCount}`);
      params.push(driver);
      paramCount++;
    }
    if (vehicle_reg !== undefined) {
      updates.push(`vehicle_reg = $${paramCount}`);
      params.push(vehicle_reg);
      paramCount++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (pod_status !== undefined) {
      updates.push(`pod_status = $${paramCount}`);
      params.push(pod_status);
      paramCount++;
    }
    if (eta !== undefined) {
      updates.push(`eta = $${paramCount}`);
      params.push(eta);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE logistics.trips 
      SET ${updates.join(', ')}
      WHERE trip_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ 
      error: 'Failed to update trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/logistics/trips/:id
 * Delete trip
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM logistics.trips WHERE trip_id = $1 RETURNING trip_id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully', trip_id: result.rows[0].trip_id });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ 
      error: 'Failed to delete trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/logistics/trips/stats/dashboard
 * Get trip statistics for dashboard
 */
router.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'In Transit') as in_transit,
        COUNT(*) FILTER (WHERE pod_status = 'Pending' AND status != 'Cancelled') as pending_pod,
        COUNT(*) FILTER (WHERE status = 'Delivered' AND DATE(eta) = CURRENT_DATE) as delivered_today
      FROM logistics.trips
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trip statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
