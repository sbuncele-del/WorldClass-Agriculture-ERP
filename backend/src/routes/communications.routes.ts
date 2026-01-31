/**
 * COMMUNICATIONS ROUTES - TENANT-AWARE
 * 
 * Full communications API supporting:
 * - Announcements
 * - Chat rooms / Channels
 * - Direct messages
 * - Notifications
 * - Video meetings integration
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
// WORKSPACE SUMMARY
// ============================================================================
router.get('/workspace', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;

    const [messagesResult, announcementsResult, channelsResult, meetingsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as unread_messages
        FROM direct_messages 
        WHERE tenant_id = $1 AND recipient_id = $2 AND is_read = false`,
        [tenantId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as unread_announcements
        FROM announcements 
        WHERE tenant_id = $1 AND status = 'published' 
        AND published_at >= CURRENT_DATE - INTERVAL '7 days'`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as active_channels
        FROM chat_channels 
        WHERE tenant_id = $1 AND is_archived = false`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as scheduled_meetings
        FROM video_meetings 
        WHERE tenant_id = $1 AND scheduled_start >= CURRENT_TIMESTAMP AND status = 'scheduled'`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          unreadMessages: parseInt(messagesResult.rows[0]?.unread_messages || '0'),
          unreadAnnouncements: parseInt(announcementsResult.rows[0]?.unread_announcements || '0'),
          activeChannels: parseInt(channelsResult.rows[0]?.active_channels || '0'),
          scheduledMeetings: parseInt(meetingsResult.rows[0]?.scheduled_meetings || '0')
        }
      }
    });
  } catch (error) {
    console.error('Communications workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
});

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================
router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { status, category, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT * FROM announcements WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY is_pinned DESC, published_at DESC NULLS LAST, created_at DESC';
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM announcements WHERE tenant_id = $1',
      [tenantId]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
});

router.post('/announcements', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { title, content, category, priority, status, scheduledAt, expiresAt, audience, isPinned } = req.body;

    // Get author name
    const userResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
    const authorName = userResult.rows[0] 
      ? `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` 
      : 'Unknown';

    const result = await pool.query(
      `INSERT INTO announcements 
        (tenant_id, title, content, category, priority, author_id, author_name, status,
         scheduled_at, expires_at, audience, is_pinned, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
        CASE WHEN $8 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)
      RETURNING *`,
      [tenantId, title, content, category || 'general', priority || 'medium', userId, authorName,
       status || 'draft', scheduledAt, expiresAt, JSON.stringify(audience || ['all']), isPinned || false]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Announcement created' });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

router.put('/announcements/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { title, content, status, isPinned, expiresAt } = req.body;

    const result = await pool.query(
      `UPDATE announcements SET
        title = COALESCE($3, title),
        content = COALESCE($4, content),
        status = COALESCE($5, status),
        is_pinned = COALESCE($6, is_pinned),
        expires_at = COALESCE($7, expires_at),
        published_at = CASE WHEN $5 = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, title, content, status, isPinned, expiresAt]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Announcement updated' });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
});

router.delete('/announcements/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

// ============================================================================
// CHAT CHANNELS
// ============================================================================
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { type, includeArchived } = req.query;

    let query = `SELECT * FROM chat_channels WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (!includeArchived) {
      query += ' AND is_archived = false';
    }
    if (type) {
      params.push(type);
      query += ` AND channel_type = $${params.length}`;
    }

    query += ' ORDER BY last_message_at DESC NULLS LAST, name ASC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
});

router.post('/channels', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { name, description, channelType } = req.body;

    const result = await pool.query(
      `INSERT INTO chat_channels (tenant_id, name, description, channel_type, created_by, member_count)
      VALUES ($1, $2, $3, $4, $5, 1)
      RETURNING *`,
      [tenantId, name, description, channelType || 'public', userId]
    );

    // Add creator as admin member
    await pool.query(
      `INSERT INTO chat_channel_members (tenant_id, channel_id, user_id, role)
      VALUES ($1, $2, $3, 'admin')`,
      [tenantId, result.rows[0].id, userId]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Channel created' });
  } catch (error: any) {
    console.error('Create channel error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Channel name already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
});

router.get('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { channelId } = req.params;
    const { before, limit = 50 } = req.query;

    let query = `
      SELECT * FROM chat_messages 
      WHERE tenant_id = $1 AND channel_id = $2 AND is_deleted = false
    `;
    const params: any[] = [tenantId, channelId];

    if (before) {
      params.push(before);
      query += ` AND created_at < $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows.reverse() }); // Return in chronological order
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

router.post('/channels/:channelId/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { channelId } = req.params;
    const { content, messageType, attachments } = req.body;

    // Get sender name
    const userResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [userId]);
    const senderName = userResult.rows[0] 
      ? `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}` 
      : 'Unknown';

    const result = await pool.query(
      `INSERT INTO chat_messages 
        (tenant_id, channel_id, sender_id, sender_name, message_type, content, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [tenantId, channelId, userId, senderName, messageType || 'text', content, 
       attachments ? JSON.stringify(attachments) : null]
    );

    // Update channel's last message timestamp
    await pool.query(
      'UPDATE chat_channels SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [channelId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ============================================================================
// DIRECT MESSAGES
// ============================================================================
router.get('/direct-messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;

    // Get conversations (unique sender/recipient pairs)
    const result = await pool.query(`
      SELECT DISTINCT ON (conversation_partner)
        CASE WHEN sender_id = $2 THEN recipient_id ELSE sender_id END as conversation_partner,
        CASE WHEN sender_id = $2 THEN recipient_name ELSE sender_name END as partner_name,
        content as last_message,
        created_at as last_message_at,
        CASE WHEN recipient_id = $2 AND is_read = false THEN true ELSE false END as has_unread
      FROM direct_messages
      WHERE tenant_id = $1 
        AND (sender_id = $2 OR recipient_id = $2)
        AND is_deleted_by_sender = false AND is_deleted_by_recipient = false
      ORDER BY conversation_partner, created_at DESC
    `, [tenantId, userId]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

router.get('/direct-messages/:recipientId', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { recipientId } = req.params;
    const { before, limit = 50 } = req.query;

    let query = `
      SELECT * FROM direct_messages 
      WHERE tenant_id = $1 
        AND ((sender_id = $2 AND recipient_id = $3) OR (sender_id = $3 AND recipient_id = $2))
    `;
    const params: any[] = [tenantId, userId, recipientId];

    if (before) {
      params.push(before);
      query += ` AND created_at < $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);

    // Mark messages as read
    await pool.query(
      `UPDATE direct_messages SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND sender_id = $2 AND recipient_id = $3 AND is_read = false`,
      [tenantId, recipientId, userId]
    );

    res.json({ success: true, data: result.rows.reverse() });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

router.post('/direct-messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { recipientId, content, messageType, attachments } = req.body;

    // Get sender and recipient names
    const usersResult = await pool.query(
      'SELECT id, first_name, last_name FROM users WHERE id = ANY($1)',
      [[userId, recipientId]]
    );
    
    const sender = usersResult.rows.find(u => u.id === userId);
    const recipient = usersResult.rows.find(u => u.id === recipientId);
    
    const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Unknown';
    const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : 'Unknown';

    const result = await pool.query(
      `INSERT INTO direct_messages 
        (tenant_id, sender_id, sender_name, recipient_id, recipient_name, content, message_type, attachments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [tenantId, userId, senderName, recipientId, recipientName, content, 
       messageType || 'text', attachments ? JSON.stringify(attachments) : null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { unreadOnly, limit = 50 } = req.query;

    let query = `
      SELECT * FROM user_notifications 
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const params: any[] = [tenantId, userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = false';
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit));

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { id } = req.params;

    await pool.query(
      `UPDATE user_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND user_id = $3`,
      [id, tenantId, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;

    await pool.query(
      `UPDATE user_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND user_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

// ============================================================================
// VIDEO MEETINGS
// ============================================================================
router.get('/meetings', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { status, upcoming } = req.query;

    let query = `SELECT * FROM video_meetings WHERE tenant_id = $1`;
    const params: any[] = [tenantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (upcoming === 'true') {
      query += ' AND scheduled_start >= CURRENT_TIMESTAMP';
    }

    query += ' ORDER BY scheduled_start ASC';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch meetings' });
  }
});

router.post('/meetings', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).userId;
    const { title, scheduledStart, scheduledEnd } = req.body;

    // Generate unique room name
    const roomName = `meeting-${tenantId.slice(0, 8)}-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO video_meetings 
        (tenant_id, title, room_name, host_id, scheduled_start, scheduled_end, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
      RETURNING *`,
      [tenantId, title, roomName, userId, scheduledStart, scheduledEnd]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Meeting scheduled' });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to create meeting' });
  }
});

router.put('/meetings/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { title, scheduledStart, scheduledEnd, status } = req.body;

    const result = await pool.query(
      `UPDATE video_meetings SET
        title = COALESCE($3, title),
        scheduled_start = COALESCE($4, scheduled_start),
        scheduled_end = COALESCE($5, scheduled_end),
        status = COALESCE($6, status)
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, title, scheduledStart, scheduledEnd, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Meeting updated' });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to update meeting' });
  }
});

export default router;
