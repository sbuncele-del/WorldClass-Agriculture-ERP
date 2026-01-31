/**
 * Messages Controller v2 - Tenant-Hardened
 * 
 * Internal messaging system for driver-dispatch communication.
 * 
 * Features:
 * - Conversation management
 * - Message sending/receiving
 * - Read receipts and unread counts
 * - Emergency/SOS alerts
 * - Attachments support
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';

// Tenant-aware request type
interface AuthenticatedRequest extends Request {
  tenantId?: string;
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; first_name?: string; last_name?: string };
}

/**
 * Get tenant-scoped database pool from request
 */
function getPool(req: Request): Pool {
  return req.app.get('pool');
}

// =============================================================================
// CONVERSATION HANDLERS
// =============================================================================

/**
 * GET /api/v2/messages/conversations
 * Get all conversations for current user
 */
export async function getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
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
          (SELECT COUNT(*) FROM messages WHERE sender_id = m.sender_id AND recipient_id = $1 AND read_at IS NULL AND tenant_id = $2) as unread_count
        FROM messages m
        WHERE (m.recipient_id = $1 OR m.recipient_id IS NULL) AND m.tenant_id = $2
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
          (SELECT COUNT(*) FROM messages WHERE sender_id != $1 AND (recipient_id = $1 OR recipient_id IS NULL) AND read_at IS NULL AND tenant_id = $2) as unread_count
        FROM messages m
        WHERE (m.sender_id = $1 OR m.recipient_id = $1) AND m.tenant_id = $2
        ORDER BY COALESCE(m.recipient_id, 'dispatch'), m.created_at DESC
      `;

    const result = await pool.query(query, [userId, tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
}

/**
 * GET /api/v2/messages/conversation/:conversationId
 * Get messages in a conversation
 */
export async function getConversationMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const userId = req.user?.id;
  const { conversationId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
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
        m.attachments,
        m.location,
        m.read_at,
        m.created_at
      FROM messages m
      WHERE m.tenant_id = $3
        AND ((m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
          OR ($2 = 'dispatch' AND (m.recipient_id IS NULL OR m.sender_id = $1)))
      ORDER BY m.created_at DESC
      LIMIT $4 OFFSET $5
    `;

    const result = await pool.query(query, [userId, conversationId, tenantId, limit, offset]);

    // Mark messages as read
    await pool.query(`
      UPDATE messages 
      SET read_at = NOW()
      WHERE recipient_id = $1 
        AND sender_id = $2
        AND read_at IS NULL
        AND tenant_id = $3
    `, [userId, conversationId, tenantId]);

    res.json({
      success: true,
      data: result.rows.reverse() // Return in chronological order
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
}

// =============================================================================
// MESSAGE HANDLERS
// =============================================================================

/**
 * POST /api/v2/messages
 * Send a new message
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const user = req.user;
  const { recipientId, recipientName, content, messageType, isEmergency, attachments, location, tripId } = req.body;

  if (!content) {
    res.status(400).json({ success: false, error: 'Message content is required' });
    return;
  }

  try {
    const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Unknown';

    const result = await pool.query(`
      INSERT INTO messages (
        tenant_id, sender_id, sender_name, sender_role, 
        recipient_id, recipient_name, content, message_type,
        is_emergency, attachments, location, trip_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      user?.id,
      senderName,
      user?.role,
      recipientId || null,
      recipientName || 'Dispatch',
      content,
      messageType || 'driver_to_dispatch',
      isEmergency || false,
      attachments ? JSON.stringify(attachments) : null,
      location ? JSON.stringify(location) : null,
      tripId || null
    ]);

    const message = result.rows[0];

    // If emergency, create alert
    if (isEmergency) {
      await pool.query(`
        INSERT INTO emergency_alerts (tenant_id, message_id, driver_id, location, status)
        VALUES ($1, $2, $3, $4, 'active')
      `, [tenantId, message.id, user?.id, location ? JSON.stringify(location) : null]);
    }

    // TODO: Trigger real-time notification via WebSocket

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
}

/**
 * POST /api/v2/messages/emergency
 * Send an emergency/SOS message
 */
export async function sendEmergency(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const user = req.user;
  const { location, message, tripId } = req.body;

  try {
    const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Driver';

    // Create emergency message
    const result = await pool.query(`
      INSERT INTO messages (
        tenant_id, sender_id, sender_name, sender_role,
        content, message_type, is_emergency, location, trip_id
      )
      VALUES ($1, $2, $3, $4, $5, 'emergency', true, $6, $7)
      RETURNING *
    `, [
      tenantId,
      user?.id,
      senderName,
      user?.role,
      message || '🆘 EMERGENCY ALERT - DRIVER NEEDS ASSISTANCE',
      location ? JSON.stringify(location) : null,
      tripId || null
    ]);

    const emergencyMessage = result.rows[0];

    // Create emergency alert record
    await pool.query(`
      INSERT INTO emergency_alerts (
        tenant_id, message_id, driver_id, driver_name,
        location, status, alert_type
      )
      VALUES ($1, $2, $3, $4, $5, 'active', 'sos')
    `, [
      tenantId,
      emergencyMessage.id,
      user?.id,
      senderName,
      location ? JSON.stringify(location) : null
    ]);

    // TODO: Trigger push notifications, SMS alerts, etc.
    console.log(`🆘 [Tenant: ${tenantId}] EMERGENCY from ${senderName}`);

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent',
      data: emergencyMessage
    });

  } catch (error) {
    console.error('Error sending emergency:', error);
    res.status(500).json({ success: false, error: 'Failed to send emergency alert' });
  }
}

/**
 * PUT /api/v2/messages/:id/read
 * Mark a message as read
 */
export async function markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    await pool.query(`
      UPDATE messages 
      SET read_at = NOW()
      WHERE id = $1 AND recipient_id = $2 AND tenant_id = $3
    `, [id, userId, tenantId]);

    res.json({ success: true, message: 'Message marked as read' });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark message as read' });
  }
}

/**
 * GET /api/v2/messages/unread/count
 * Get unread message count
 */
export async function getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const userId = req.user?.id;

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_unread,
        COUNT(*) FILTER (WHERE is_emergency = true) as emergency_unread
      FROM messages
      WHERE (recipient_id = $1 OR recipient_id IS NULL)
        AND read_at IS NULL
        AND tenant_id = $2
    `, [userId, tenantId]);

    res.json({
      success: true,
      data: {
        totalUnread: parseInt(result.rows[0].total_unread) || 0,
        emergencyUnread: parseInt(result.rows[0].emergency_unread) || 0
      }
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
}

// =============================================================================
// DRIVER-SPECIFIC HANDLERS
// =============================================================================

/**
 * POST /api/v2/messages/driver/check-in
 * Driver check-in/status update
 */
export async function driverCheckIn(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const user = req.user;
  const { status, location, tripId, notes } = req.body;

  try {
    const senderName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Driver';

    // Create check-in message
    const statusMessages: Record<string, string> = {
      'started_shift': '🟢 Started shift',
      'on_route': '🚛 On route',
      'at_pickup': '📦 At pickup location',
      'loaded': '✅ Vehicle loaded',
      'at_delivery': '📍 At delivery location',
      'delivered': '✅ Delivery complete',
      'break': '⏸️ On break',
      'ended_shift': '🔴 Ended shift'
    };

    const messageContent = statusMessages[status] || `Status: ${status}`;

    const result = await pool.query(`
      INSERT INTO messages (
        tenant_id, sender_id, sender_name, sender_role,
        content, message_type, location, trip_id
      )
      VALUES ($1, $2, $3, $4, $5, 'system', $6, $7)
      RETURNING *
    `, [
      tenantId,
      user?.id,
      senderName,
      user?.role,
      notes ? `${messageContent} - ${notes}` : messageContent,
      location ? JSON.stringify(location) : null,
      tripId || null
    ]);

    // Update driver status
    await pool.query(`
      INSERT INTO driver_status (tenant_id, driver_id, status, location, trip_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (driver_id) DO UPDATE SET
        status = $3,
        location = $4,
        trip_id = $5,
        updated_at = NOW()
    `, [tenantId, user?.id, status, location ? JSON.stringify(location) : null, tripId]);

    res.json({
      success: true,
      message: 'Check-in recorded',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ success: false, error: 'Failed to record check-in' });
  }
}

/**
 * GET /api/v2/messages/driver/status
 * Get current driver status
 */
export async function getDriverStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const driverId = req.params.driverId || req.user?.id;

  try {
    const result = await pool.query(`
      SELECT 
        ds.driver_id,
        ds.status,
        ds.location,
        ds.trip_id,
        ds.updated_at,
        u.first_name,
        u.last_name,
        t.trip_number
      FROM driver_status ds
      LEFT JOIN users u ON ds.driver_id = u.id
      LEFT JOIN logistics_trips t ON ds.trip_id = t.id
      WHERE ds.driver_id = $1 AND ds.tenant_id = $2
    `, [driverId, tenantId]);

    if (result.rows.length === 0) {
      res.json({
        success: true,
        data: {
          driverId,
          status: 'offline',
          location: null,
          tripId: null
        }
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error getting driver status:', error);
    res.status(500).json({ success: false, error: 'Failed to get driver status' });
  }
}

// =============================================================================
// DISPATCH HANDLERS
// =============================================================================

/**
 * GET /api/v2/messages/dispatch/active-alerts
 * Get active emergency alerts for dispatch
 */
export async function getActiveAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);

  try {
    const result = await pool.query(`
      SELECT 
        ea.id,
        ea.driver_id,
        ea.driver_name,
        ea.location,
        ea.status,
        ea.alert_type,
        ea.created_at,
        ea.acknowledged_at,
        ea.acknowledged_by,
        m.content as message
      FROM emergency_alerts ea
      LEFT JOIN messages m ON ea.message_id = m.id
      WHERE ea.tenant_id = $1 AND ea.status IN ('active', 'acknowledged')
      ORDER BY ea.created_at DESC
    `, [tenantId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to get active alerts' });
  }
}

/**
 * PUT /api/v2/messages/dispatch/alerts/:alertId/acknowledge
 * Acknowledge an emergency alert
 */
export async function acknowledgeAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const { alertId } = req.params;
  const userId = req.user?.id;

  try {
    const result = await pool.query(`
      UPDATE emergency_alerts 
      SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $3
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [alertId, tenantId, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Alert acknowledged',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
}

/**
 * PUT /api/v2/messages/dispatch/alerts/:alertId/resolve
 * Resolve an emergency alert
 */
export async function resolveAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  const tenantId = req.tenantId || req.tenant?.id;
  
  if (!tenantId) {
    res.status(401).json({ success: false, error: 'Tenant context required' });
    return;
  }

  const pool = getPool(req);
  const { alertId } = req.params;
  const userId = req.user?.id;
  const { resolution } = req.body;

  try {
    const result = await pool.query(`
      UPDATE emergency_alerts 
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $3, resolution = $4
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [alertId, tenantId, userId, resolution]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Alert resolved',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Conversations
  getConversations,
  getConversationMessages,
  
  // Messages
  sendMessage,
  sendEmergency,
  markAsRead,
  getUnreadCount,
  
  // Driver
  driverCheckIn,
  getDriverStatus,
  
  // Dispatch
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert
};
