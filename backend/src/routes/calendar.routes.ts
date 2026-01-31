/**
 * CALENDAR ROUTES - TENANT-AWARE
 * 
 * Calendar and events management API
 */

import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

/**
 * Get all calendar events for tenant
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { start, end, type } = req.query;

    let query = `
      SELECT * FROM calendar_events 
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (start) {
      params.push(start);
      query += ` AND start_date >= $${params.length}`;
    }
    if (end) {
      params.push(end);
      query += ` AND end_date <= $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND event_type = $${params.length}`;
    }

    query += ' ORDER BY start_date ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Get calendar events error:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      res.json({ success: true, data: [] });
    } else {
      res.status(500).json({ success: false, error: 'Failed to fetch calendar events' });
    }
  }
});

/**
 * Get a single calendar event
 */
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM calendar_events WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get calendar event error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch calendar event' });
  }
});

/**
 * Create a new calendar event
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      location, 
      eventType,
      attendees,
      reminders,
      isAllDay
    } = req.body;

    const result = await pool.query(
      `INSERT INTO calendar_events 
        (tenant_id, user_id, title, description, start_date, end_date, 
         location, event_type, attendees, reminders, is_all_day)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId, 
        userId, 
        title, 
        description, 
        startDate, 
        endDate, 
        location,
        eventType || 'meeting',
        JSON.stringify(attendees || []),
        JSON.stringify(reminders || []),
        isAllDay || false
      ]
    );

    res.status(201).json({ 
      success: true, 
      data: result.rows[0], 
      message: 'Event created successfully' 
    });
  } catch (error: any) {
    console.error('Create calendar event error:', error);
    
    // If table doesn't exist, provide helpful error
    if (error.code === '42P01') {
      res.status(500).json({ 
        success: false, 
        error: 'Calendar table not initialized. Please contact administrator.' 
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create calendar event' });
    }
  }
});

/**
 * Update a calendar event
 */
router.put('/events/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const updates = req.body;

    const setClauses: string[] = [];
    const values: any[] = [id, tenantId];
    let paramCount = 2;

    // Dynamically build SET clause
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'tenantId' && key !== 'createdAt') {
        paramCount++;
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauses.push(`${snakeKey} = $${paramCount}`);
        values.push(updates[key]);
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE calendar_events 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: 'Event updated successfully' 
    });
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({ success: false, error: 'Failed to update calendar event' });
  }
});

/**
 * Delete a calendar event
 */
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM calendar_events WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete calendar event' });
  }
});

export default router;
