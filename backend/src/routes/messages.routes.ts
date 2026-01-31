import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Apply tenant middleware to all message routes
router.use(tenantMiddleware);

// Get pool from app
const getPool = (req: Request): Pool => {
  return req.app.get('pool');
};

/**
 * Message Types:
 * - driver_to_dispatch: Driver sending to office
 * - dispatch_to_driver: Office sending to driver
 * - driver_to_customer: Driver to customer
 * - system: Automated system messages
 * - emergency: SOS/Emergency alerts
 */

// ============================================
// GET /api/messages/conversations
// Get all conversations for current user
// ============================================
router.get('/conversations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // For dispatch/admin - see all driver conversations
    // For drivers - see only their conversations
    const isDispatch = ['admin', 'dispatcher', 'manager'].includes(userRole?.toLowerCase() || '');

    const query = isDispatch
      ? `
        SELECT DISTINCT ON (m.sender_id) 
          m.id,
          m.sender_id,
          m.sender_name,
          m.sender_role,
          m.content as last_message,
          m.created_at as last_message_time,
          m.message_type,
          m.is_emergency,
          (SELECT COUNT(*) FROM messages WHERE sender_id = m.sender_id AND recipient_id = $1 AND read_at IS NULL) as unread_count
        FROM messages m
        WHERE m.recipient_id = $1 OR m.recipient_id IS NULL
        ORDER BY m.sender_id, m.created_at DESC
      `
      : `
        SELECT DISTINCT ON (COALESCE(m.recipient_id, 'dispatch'))
          m.id,
          COALESCE(m.recipient_id, 'dispatch') as conversation_id,
          m.recipient_name,
          m.content as last_message,
          m.created_at as last_message_time,
          m.message_type,
          (SELECT COUNT(*) FROM messages WHERE sender_id != $1 AND (recipient_id = $1 OR recipient_id IS NULL) AND read_at IS NULL) as unread_count
        FROM messages m
        WHERE m.sender_id = $1 OR m.recipient_id = $1
        ORDER BY COALESCE(m.recipient_id, 'dispatch'), m.created_at DESC
      `;

    const result = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// ============================================
// GET /api/messages/:conversationId
// Get messages in a conversation
// ============================================
router.get('/:conversationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const query = `
      SELECT 
        m.id,
        m.sender_id,
        m.sender_name,
        m.sender_role,
        m.recipient_id,
        m.recipient_name,
        m.content,
        m.message_type,
        m.is_emergency,
        m.trip_id,
        m.metadata,
        m.created_at,
        m.read_at
      FROM messages m
      WHERE (m.sender_id = $1 AND m.recipient_id = $2)
         OR (m.sender_id = $2 AND m.recipient_id = $1)
         OR (m.sender_id = $1 AND m.recipient_id IS NULL AND $2 = 'dispatch')
         OR (m.recipient_id = $1 AND m.sender_id = $2)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await pool.query(query, [userId, conversationId, limit, offset]);

    // Mark messages as read
    await pool.query(
      `UPDATE messages SET read_at = NOW() WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL`,
      [userId, conversationId]
    );

    res.json({
      success: true,
      data: result.rows.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// ============================================
// POST /api/messages
// Send a new message
// ============================================
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.firstName + ' ' + ((req as any).user?.lastName || '');
    const userRole = (req as any).user?.role || 'driver';

    const {
      recipient_id,
      recipient_name,
      content,
      message_type = 'driver_to_dispatch',
      trip_id,
      is_emergency = false,
      metadata = {}
    } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const query = `
      INSERT INTO messages (
        sender_id,
        sender_name,
        sender_role,
        recipient_id,
        recipient_name,
        content,
        message_type,
        trip_id,
        is_emergency,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      userName.trim(),
      userRole,
      recipient_id || null,
      recipient_name || 'Dispatch',
      content.trim(),
      message_type,
      trip_id || null,
      is_emergency,
      JSON.stringify(metadata)
    ]);

    const message = result.rows[0];

    // If emergency, create a notification for dispatch
    if (is_emergency) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, metadata, created_at)
         SELECT id, 'emergency', 'EMERGENCY ALERT', $1, 'critical', $2, NOW()
         FROM users WHERE role IN ('admin', 'dispatcher', 'manager')`,
        [`Emergency from ${userName}: ${content}`, JSON.stringify({ message_id: message.id, sender_id: userId })]
      );
    }

    // TODO: Emit WebSocket event for real-time delivery
    // io.to(`user_${recipient_id}`).emit('new_message', message);
    // io.to('dispatch').emit('new_message', message);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// ============================================
// POST /api/messages/emergency
// Send emergency alert (high priority)
// ============================================
router.post('/emergency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.firstName + ' ' + ((req as any).user?.lastName || '');
    const userRole = (req as any).user?.role || 'driver';

    const {
      emergency_type, // 'breakdown', 'security', 'medical', 'accident'
      location,
      trip_id,
      details
    } = req.body;

    // Create emergency message
    const messageQuery = `
      INSERT INTO messages (
        sender_id,
        sender_name,
        sender_role,
        recipient_id,
        content,
        message_type,
        trip_id,
        is_emergency,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, NULL, $4, 'emergency', $5, true, $6, NOW())
      RETURNING *
    `;

    const content = `🚨 EMERGENCY ALERT: ${emergency_type?.toUpperCase() || 'UNKNOWN'}\nDriver: ${userName}\nLocation: ${location || 'Unknown'}\nDetails: ${details || 'No details provided'}`;
    
    const metadata = {
      emergency_type,
      location,
      timestamp: new Date().toISOString(),
      gps_coordinates: req.body.coordinates || null
    };

    const result = await pool.query(messageQuery, [
      userId,
      userName.trim(),
      userRole,
      content,
      trip_id || null,
      JSON.stringify(metadata)
    ]);

    // Create high-priority notification for ALL dispatch users
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, priority, metadata, created_at)
       SELECT id, 'emergency', '🚨 DRIVER EMERGENCY', $1, 'critical', $2, NOW()
       FROM users WHERE role IN ('admin', 'dispatcher', 'manager', 'supervisor')`,
      [content, JSON.stringify(metadata)]
    );

    // Log to audit trail
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
       VALUES ($1, 'EMERGENCY_ALERT', 'driver', $1, $2, NOW())`,
      [userId, JSON.stringify({ emergency_type, location, trip_id })]
    );

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent to all dispatch personnel',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send emergency alert'
    });
  }
});

// ============================================
// GET /api/messages/dispatch/inbox
// Get all messages for dispatch (office view)
// ============================================
router.get('/dispatch/inbox', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userRole = (req as any).user?.role;

    // Only allow dispatch/admin roles
    if (!['admin', 'dispatcher', 'manager', 'supervisor'].includes(userRole?.toLowerCase() || '')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Dispatch role required.'
      });
    }

    const query = `
      SELECT 
        m.id,
        m.sender_id,
        m.sender_name,
        m.sender_role,
        m.content,
        m.message_type,
        m.is_emergency,
        m.trip_id,
        m.metadata,
        m.created_at,
        m.read_at,
        t.trip_number,
        t.status as trip_status
      FROM messages m
      LEFT JOIN trips t ON m.trip_id = t.id
      WHERE m.message_type IN ('driver_to_dispatch', 'emergency')
        AND m.recipient_id IS NULL
      ORDER BY m.is_emergency DESC, m.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query);

    // Get unread count
    const unreadResult = await pool.query(
      `SELECT COUNT(*) as count FROM messages WHERE message_type IN ('driver_to_dispatch', 'emergency') AND recipient_id IS NULL AND read_at IS NULL`
    );

    res.json({
      success: true,
      data: {
        messages: result.rows,
        unread_count: parseInt(unreadResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching dispatch inbox:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dispatch inbox'
    });
  }
});

// ============================================
// POST /api/messages/dispatch/reply/:messageId
// Reply to a driver message from dispatch
// ============================================
router.post('/dispatch/reply/:messageId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.firstName || 'Dispatch';
    const { messageId } = req.params;
    const { content } = req.body;

    // Get original message
    const originalMsg = await pool.query(
      `SELECT sender_id, sender_name, trip_id FROM messages WHERE id = $1`,
      [messageId]
    );

    if (originalMsg.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Original message not found'
      });
    }

    const original = originalMsg.rows[0];

    // Insert reply
    const result = await pool.query(
      `INSERT INTO messages (
        sender_id, sender_name, sender_role,
        recipient_id, recipient_name,
        content, message_type, trip_id, created_at
      ) VALUES ($1, $2, 'dispatch', $3, $4, $5, 'dispatch_to_driver', $6, NOW())
      RETURNING *`,
      [userId, userName, original.sender_id, original.sender_name, content, original.trip_id]
    );

    // Mark original as read
    await pool.query(
      `UPDATE messages SET read_at = NOW() WHERE id = $1 AND read_at IS NULL`,
      [messageId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reply'
    });
  }
});

// ============================================
// PUT /api/messages/:id/read
// Mark message as read
// ============================================
router.put('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const { id } = req.params;

    await pool.query(
      `UPDATE messages SET read_at = NOW() WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read'
    });
  }
});

// ============================================
// POST /api/messages/emergency
// Send emergency/SOS alert
// ============================================
router.post('/emergency', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userId = (req as any).user?.id || 'unknown';
    const userName = (req as any).user?.name || (req as any).user?.email || 'Driver';
    const { emergency_type, location, coordinates, trip_id, details } = req.body;

    // Create emergency alert record
    const result = await pool.query(
      `INSERT INTO messages (
        sender_id, sender_name, sender_role,
        content, message_type, trip_id, is_emergency,
        metadata, priority, created_at
      ) VALUES ($1, $2, 'driver', $3, 'emergency', $4, true, $5, 'critical', NOW())
      RETURNING *`,
      [
        userId,
        userName,
        `🚨 EMERGENCY ALERT: ${emergency_type?.toUpperCase() || 'SOS'}\n` +
        `Driver: ${userName}\n` +
        `Location: ${location || 'Unknown'}\n` +
        `Details: ${details || 'Driver triggered emergency button'}`,
        trip_id || null,
        JSON.stringify({
          emergency_type: emergency_type || 'sos',
          coordinates,
          location,
          triggered_at: new Date().toISOString()
        })
      ]
    );

    // Log emergency for audit
    console.log('🚨 EMERGENCY ALERT:', {
      userId,
      userName,
      emergency_type,
      location,
      coordinates,
      trip_id,
      timestamp: new Date().toISOString()
    });

    // In production, this would trigger:
    // - Push notifications to all dispatchers
    // - SMS/Call to emergency contacts
    // - Update driver status to "emergency"
    // - Log GPS coordinates for tracking

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    // Even on error, try to respond - emergency is critical
    res.status(500).json({
      success: false,
      error: 'Failed to send emergency alert',
      // Return partial success - we logged it at minimum
      logged: true
    });
  }
});

// ============================================
// GET /api/messages/emergencies
// Get active emergencies (for dispatch dashboard)
// ============================================
router.get('/emergencies', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pool = getPool(req);
    const userRole = (req as any).user?.role;

    // Only dispatch/admin can view emergency dashboard
    const isDispatch = ['admin', 'dispatcher', 'manager'].includes(userRole?.toLowerCase() || '');
    if (!isDispatch) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - dispatch access required'
      });
    }

    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE is_emergency = true 
       ORDER BY created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching emergencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergencies'
    });
  }
});

export default router;
