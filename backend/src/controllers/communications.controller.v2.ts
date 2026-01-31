/**
 * Communications Controller V2
 * Tenant-hardened API for internal communications
 * 
 * Features:
 * - Announcements
 * - Chat channels & messages
 * - Direct messages
 * - Notifications
 * - Video meetings
 * - Email (Resend integration)
 * - Email inbox/sent
 */

import { Response } from 'express';
import { TenantRequest } from '../types';
import pool from '../config/database';
import { Resend } from 'resend';

/**
 * Tenant context helper
 */
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return { tenantId, userId: userId || '' };
}

// ============================================================================
// WORKSPACE
// ============================================================================
export const getWorkspace = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const [announcementsResult, channelsResult, unreadResult, meetingsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as active_announcements
        FROM announcements WHERE tenant_id = $1 AND is_active = true 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as total_channels
        FROM chat_channels WHERE tenant_id = $1 AND is_archived = false`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) as unread_notifications
        FROM user_notifications WHERE tenant_id = $1 AND user_id = $2 AND is_read = false`,
        [tenantId, userId]
      ),
      pool.query(
        `SELECT COUNT(*) as upcoming_meetings
        FROM video_meetings WHERE tenant_id = $1 
        AND scheduled_start > CURRENT_TIMESTAMP 
        AND scheduled_start < CURRENT_TIMESTAMP + INTERVAL '7 days'`,
        [tenantId]
      )
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          activeAnnouncements: parseInt(announcementsResult.rows[0]?.active_announcements || '0'),
          totalChannels: parseInt(channelsResult.rows[0]?.total_channels || '0'),
          unreadNotifications: parseInt(unreadResult.rows[0]?.unread_notifications || '0'),
          upcomingMeetings: parseInt(meetingsResult.rows[0]?.upcoming_meetings || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Communications workspace error:', error);
    res.status(500).json({ success: false, error: 'Failed to load workspace' });
  }
};

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================
export const getAnnouncements = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { priority, includeExpired } = req.query;

    let queryStr = `
      SELECT a.*, u.full_name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by_user_id = u.id
      WHERE a.tenant_id = $1 AND a.is_active = true
    `;
    const params: any[] = [tenantId];

    if (includeExpired !== 'true') {
      queryStr += ' AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)';
    }
    if (priority) {
      params.push(priority);
      queryStr += ` AND a.priority = $${params.length}`;
    }

    queryStr += ' ORDER BY a.is_pinned DESC, a.created_at DESC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
};

export const createAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { title, content, priority, expiresAt, isPinned } = req.body;

    const result = await pool.query(
      `INSERT INTO announcements (tenant_id, author_id, created_by_user_id, title, content, priority,
        expires_at, is_pinned, status)
      VALUES ($1, $2, $2, $3, $4, $5, $6, $7, 'published')
      RETURNING *`,
      [tenantId, userId, title, content, priority || 'medium',
       expiresAt, isPinned || false]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Announcement posted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
};

export const updateAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;
    const { title, content, priority, expiresAt, isPinned, isActive } = req.body;

    const result = await pool.query(
      `UPDATE announcements SET
        title = COALESCE($3, title),
        content = COALESCE($4, content),
        priority = COALESCE($5, priority),
        expires_at = COALESCE($6, expires_at),
        is_pinned = COALESCE($7, is_pinned),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId, title, content, priority, expiresAt, isPinned, isActive]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Announcement updated' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to update announcement' });
  }
};

export const deleteAnnouncement = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE announcements SET is_active = false WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
};

// ============================================================================
// CHAT CHANNELS
// ============================================================================
export const getChannels = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { type } = req.query;

    let queryStr = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM chat_messages m WHERE m.channel_id = c.id) as message_count,
        (SELECT MAX(m.created_at) FROM chat_messages m WHERE m.channel_id = c.id) as latest_message_at
      FROM chat_channels c
      WHERE c.tenant_id = $1 AND c.is_archived = false
      AND (c.is_private = false OR EXISTS (
        SELECT 1 FROM chat_channel_members cm WHERE cm.channel_id = c.id AND cm.user_id = $2
      ))
    `;
    const params: any[] = [tenantId, userId];

    if (type) {
      params.push(type);
      queryStr += ` AND c.channel_type = $${params.length}`;
    }

    queryStr += ' ORDER BY latest_message_at DESC NULLS LAST, c.name ASC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
};

export const createChannel = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name, description, channelType, isPrivate, memberUserIds } = req.body;

    const channelResult = await pool.query(
      `INSERT INTO chat_channels (tenant_id, created_by, name, description, 
        channel_type, is_private)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [tenantId, userId, name, description, channelType || 'public', isPrivate || false]
    );

    const channel = channelResult.rows[0];

    // Add creator as member
    await pool.query(
      `INSERT INTO chat_channel_members (tenant_id, channel_id, user_id, role)
      VALUES ($1, $2, $3, 'admin')`,
      [tenantId, channel.id, userId]
    );

    // Add other members
    if (memberUserIds && memberUserIds.length > 0) {
      for (const memberId of memberUserIds) {
        if (memberId !== userId) {
          await pool.query(
            `INSERT INTO chat_channel_members (tenant_id, channel_id, user_id, role)
            VALUES ($1, $2, $3, 'member')`,
            [tenantId, channel.id, memberId]
          );
        }
      }
    }

    res.status(201).json({ success: true, data: channel, message: 'Channel created' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create channel error:', error);
    res.status(500).json({ success: false, error: 'Failed to create channel' });
  }
};

// ============================================================================
// CHANNEL MESSAGES
// ============================================================================
export const getChannelMessages = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    let queryStr = `
      SELECT m.*, u.full_name as author_name, u.email as author_email
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.tenant_id = $1 AND m.channel_id = $2
    `;
    const params: any[] = [tenantId, channelId];

    if (before) {
      params.push(before);
      queryStr += ` AND m.created_at < $${params.length}`;
    }

    params.push(limit);
    queryStr += ` ORDER BY m.created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows.reverse() });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const sendChannelMessage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { channelId } = req.params;
    const { content, messageType, attachments } = req.body;

    const result = await pool.query(
      `INSERT INTO chat_messages (tenant_id, channel_id, sender_id, content, message_type, attachments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [tenantId, channelId, userId, content, messageType || 'text', attachments]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Message sent' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// ============================================================================
// DIRECT MESSAGES
// ============================================================================
export const getDirectConversations = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
        CASE WHEN sender_id = $2 THEN recipient_id ELSE sender_id END as other_user_id,
        u.full_name as other_user_name,
        dm.content as last_message,
        dm.created_at as last_message_at
      FROM direct_messages dm
      LEFT JOIN users u ON (CASE WHEN dm.sender_id = $2 THEN dm.recipient_id ELSE dm.sender_id END) = u.id
      WHERE dm.tenant_id = $1 AND (dm.sender_id = $2 OR dm.recipient_id = $2)
      ORDER BY other_user_id, dm.created_at DESC`,
      [tenantId, userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get DM conversations error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
};

export const getDirectMessages = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { otherUserId } = req.params;
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT dm.*, 
        s.name as sender_name, 
        r.name as recipient_name
      FROM direct_messages dm
      LEFT JOIN users s ON dm.sender_id = s.id
      LEFT JOIN users r ON dm.recipient_id = r.id
      WHERE dm.tenant_id = $1 
      AND ((dm.sender_id = $2 AND dm.recipient_id = $3) 
           OR (dm.sender_id = $3 AND dm.recipient_id = $2))
      ORDER BY dm.created_at DESC
      LIMIT $4`,
      [tenantId, userId, otherUserId, limit]
    );

    // Mark as read
    await pool.query(
      `UPDATE direct_messages SET is_read = true 
      WHERE tenant_id = $1 AND recipient_id = $2 AND sender_id = $3 AND is_read = false`,
      [tenantId, userId, otherUserId]
    );

    res.json({ success: true, data: result.rows.reverse() });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get DMs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const sendDirectMessage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { recipientId, content, attachments } = req.body;

    const result = await pool.query(
      `INSERT INTO direct_messages (tenant_id, sender_id, recipient_id, content, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tenantId, userId, recipientId, content, attachments]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Message sent' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Send DM error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export const getNotifications = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { unreadOnly, limit = 50 } = req.query;

    let queryStr = `
      SELECT * FROM user_notifications
      WHERE tenant_id = $1 AND user_id = $2
    `;
    const params: any[] = [tenantId, userId];

    if (unreadOnly === 'true') {
      queryStr += ' AND is_read = false';
    }

    params.push(limit);
    queryStr += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const markNotificationRead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE user_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND tenant_id = $2 AND user_id = $3
      RETURNING *`,
      [id, tenantId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Mark notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification' });
  }
};

export const markAllNotificationsRead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    await pool.query(
      `UPDATE user_notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND user_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Mark all notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notifications' });
  }
};

// Get unread notification count
export const getNotificationUnreadCount = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM user_notifications
      WHERE tenant_id = $1 AND user_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    res.json({ success: true, data: { count: parseInt(result.rows[0]?.count || '0') } });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get notification count error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notification count' });
  }
};

// Get unread messages count (direct messages)
export const getMessageUnreadCount = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const result = await pool.query(
      `SELECT COUNT(*) as count FROM direct_messages
      WHERE tenant_id = $1 AND recipient_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    res.json({ success: true, data: { count: parseInt(result.rows[0]?.count || '0') } });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get message count error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch message count' });
  }
};

// ============================================================================
// VIDEO MEETINGS
// ============================================================================
export const getMeetings = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { upcoming, past } = req.query;

    let queryStr = `
      SELECT m.*, u.full_name as organizer_name
      FROM video_meetings m
      LEFT JOIN users u ON m.host_id = u.id
      WHERE m.tenant_id = $1
      AND (m.host_id = $2 OR EXISTS (
        SELECT 1 FROM video_meeting_participants p WHERE p.meeting_id = m.id AND p.user_id = $2
      ))
    `;
    const params: any[] = [tenantId, userId];

    if (upcoming === 'true') {
      queryStr += ' AND m.scheduled_start > CURRENT_TIMESTAMP';
    }
    if (past === 'true') {
      queryStr += ' AND m.scheduled_end < CURRENT_TIMESTAMP';
    }

    queryStr += ' ORDER BY m.scheduled_start ASC';
    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get meetings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch meetings' });
  }
};

export const createMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { title, scheduledStart, scheduledEnd, participantUserIds } = req.body;

    // Generate meeting room name and URL
    const roomName = `meeting-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
    const roomUrl = `https://meet.daily.co/${roomName}`; // Daily.co URL pattern

    const meetingResult = await pool.query(
      `INSERT INTO video_meetings (tenant_id, host_id, title, room_name, room_url,
        scheduled_start, scheduled_end, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *`,
      [tenantId, userId, title, roomName, roomUrl, scheduledStart, scheduledEnd]
    );

    const meeting = meetingResult.rows[0];

    // Add host as participant
    await pool.query(
      `INSERT INTO video_meeting_participants (tenant_id, meeting_id, user_id, role, status)
      VALUES ($1, $2, $3, 'host', 'accepted')`,
      [tenantId, meeting.id, userId]
    );

    // Add other participants
    if (participantUserIds && participantUserIds.length > 0) {
      for (const participantId of participantUserIds) {
        if (participantId !== userId) {
          await pool.query(
            `INSERT INTO video_meeting_participants (tenant_id, meeting_id, user_id, role, status)
            VALUES ($1, $2, $3, 'participant', 'pending')`,
            [tenantId, meeting.id, participantId]
          );
        }
      }
    }

    res.status(201).json({ success: true, data: meeting, message: 'Meeting scheduled' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to create meeting' });
  }
};

export const updateMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
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
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Update meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to update meeting' });
  }
};

export const cancelMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE video_meetings SET status = 'cancelled'
      WHERE id = $1 AND tenant_id = $2
      RETURNING *`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    res.json({ success: true, message: 'Meeting cancelled' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Cancel meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel meeting' });
  }
};

// ============================================================================
// MESSAGES (Inbox-style messages - email, internal, etc.)
// ============================================================================
export const getMessages = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { folder = 'inbox', type } = req.query;

    // Try to get messages from messages table if it exists, otherwise return sample data
    try {
      let queryStr = `
        SELECT m.*, u.full_name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (folder === 'inbox') {
        queryStr += ` AND m.recipient_id = $${params.length + 1}`;
        params.push(userId);
      } else if (folder === 'sent') {
        queryStr += ` AND m.sender_id = $${params.length + 1}`;
        params.push(userId);
      } else if (folder === 'drafts') {
        queryStr += ` AND m.sender_id = $${params.length + 1} AND m.status = 'draft'`;
        params.push(userId);
      }

      if (type) {
        queryStr += ` AND m.type = $${params.length + 1}`;
        params.push(type);
      }

      queryStr += ' ORDER BY m.created_at DESC LIMIT 100';
      const result = await pool.query(queryStr, params);

      res.json({ success: true, data: result.rows });
    } catch (dbError) {
      // Table might not exist, return empty array
      res.json({ success: true, data: [] });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { recipientId, subject, content, type = 'internal', priority = 'normal' } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO messages (tenant_id, sender_id, recipient_id, subject, content, type, priority, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
        RETURNING *`,
        [tenantId, userId, recipientId, subject, content, type, priority]
      );

      res.status(201).json({ success: true, data: result.rows[0], message: 'Message sent' });
    } catch (dbError) {
      res.status(400).json({ success: false, error: 'Message sending not configured' });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// ============================================================================
// CONTACTS
// ============================================================================
export const getContacts = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { type } = req.query;

    // Get contacts from customers, suppliers, and employees
    let contacts: any[] = [];

    // Get customers
    const customersResult = await pool.query(
      `SELECT id, name, email, phone, 'customer' as type, true as opt_in_email
      FROM customers WHERE tenant_id = $1 AND status = 'active' LIMIT 50`,
      [tenantId]
    );
    contacts = contacts.concat(customersResult.rows.map(c => ({
      ...c, groups: ['customers'], optInEmail: true, optInSMS: true, optInWhatsApp: false
    })));

    // Get suppliers
    const suppliersResult = await pool.query(
      `SELECT id, name, email, phone, 'supplier' as type
      FROM suppliers WHERE tenant_id = $1 AND status = 'active' LIMIT 50`,
      [tenantId]
    );
    contacts = contacts.concat(suppliersResult.rows.map(s => ({
      ...s, groups: ['suppliers'], optInEmail: true, optInSMS: false, optInWhatsApp: false
    })));

    // Get employees
    const employeesResult = await pool.query(
      `SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) as name, e.email, e.phone, 'employee' as type
      FROM employees e WHERE e.tenant_id = $1 AND e.status = 'active' LIMIT 50`,
      [tenantId]
    );
    contacts = contacts.concat(employeesResult.rows.map(e => ({
      ...e, groups: ['employees'], optInEmail: true, optInSMS: true, optInWhatsApp: true
    })));

    // Filter by type if specified
    if (type) {
      contacts = contacts.filter(c => c.type === type);
    }

    res.json({ success: true, data: contacts });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get contacts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contacts' });
  }
};

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================
export const getTemplates = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { type, category } = req.query;

    try {
      let queryStr = `
        SELECT * FROM message_templates
        WHERE tenant_id = $1 AND is_active = true
      `;
      const params: any[] = [tenantId];

      if (type) {
        queryStr += ` AND type = $${params.length + 1}`;
        params.push(type);
      }
      if (category) {
        queryStr += ` AND category = $${params.length + 1}`;
        params.push(category);
      }

      queryStr += ' ORDER BY usage_count DESC, name ASC';
      const result = await pool.query(queryStr, params);

      res.json({ success: true, data: result.rows });
    } catch (dbError) {
      // Return default templates if table doesn't exist
      const defaultTemplates = [
        { id: '1', name: 'Welcome Email', type: 'email', category: 'onboarding', subject: 'Welcome to {company}', content: 'Dear {name},\n\nWelcome to {company}!', variables: ['company', 'name'], usageCount: 0 },
        { id: '2', name: 'Invoice Reminder', type: 'email', category: 'billing', subject: 'Invoice #{invoice_number} Reminder', content: 'Dear {name},\n\nThis is a reminder for invoice #{invoice_number}.', variables: ['name', 'invoice_number', 'amount'], usageCount: 0 },
        { id: '3', name: 'Meeting Invite', type: 'email', category: 'meetings', subject: 'Meeting: {meeting_title}', content: 'You are invited to {meeting_title} on {date} at {time}.', variables: ['meeting_title', 'date', 'time'], usageCount: 0 },
        { id: '4', name: 'SMS Appointment Reminder', type: 'sms', category: 'reminders', content: 'Reminder: Your appointment is on {date} at {time}. Reply CONFIRM to confirm.', variables: ['date', 'time'], usageCount: 0 },
      ];
      res.json({ success: true, data: defaultTemplates });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
};

export const createTemplate = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name, templateType, type, category, subject, content, variables } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO message_templates (tenant_id, created_by, name, template_type, category, subject, content, variables)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [tenantId, userId, name, templateType || type || 'email', category, subject, content, JSON.stringify(variables || [])]
      );

      res.status(201).json({ success: true, data: result.rows[0], message: 'Template created' });
    } catch (dbError) {
      console.error('Template DB error:', dbError);
      res.status(400).json({ success: false, error: 'Templates not configured' });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create template error:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
};

// ============================================================================
// CAMPAIGNS
// ============================================================================
export const getCampaigns = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { status, type } = req.query;

    try {
      let queryStr = `
        SELECT * FROM communication_campaigns
        WHERE tenant_id = $1
      `;
      const params: any[] = [tenantId];

      if (status) {
        queryStr += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
      if (type) {
        queryStr += ` AND type = $${params.length + 1}`;
        params.push(type);
      }

      queryStr += ' ORDER BY created_at DESC';
      const result = await pool.query(queryStr, params);

      res.json({ success: true, data: result.rows });
    } catch (dbError) {
      // Return empty if table doesn't exist
      res.json({ success: true, data: [] });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
};

export const createCampaign = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name, type, templateId, targetAudience, scheduledDate } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO communication_campaigns (tenant_id, created_by, name, type, template_id, target_audience, scheduled_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
        RETURNING *`,
        [tenantId, userId, name, type, templateId, JSON.stringify(targetAudience || []), scheduledDate]
      );

      res.status(201).json({ success: true, data: result.rows[0], message: 'Campaign created' });
    } catch (dbError) {
      res.status(400).json({ success: false, error: 'Campaigns not configured' });
    }
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
};

/**
 * Get communications dashboard
 */
export const getCommunicationsDashboard = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);

    // Get unread notifications count
    const notificationsCount = await pool.query(
      `SELECT COUNT(*) as count FROM user_notifications 
       WHERE tenant_id = $1 AND user_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    // Get unread messages count  
    const messagesCount = await pool.query(
      `SELECT COUNT(*) as count FROM direct_messages 
       WHERE tenant_id = $1 AND recipient_id = $2 AND is_read = false`,
      [tenantId, userId]
    );

    // Get active announcements
    const announcementsCount = await pool.query(
      `SELECT COUNT(*) as count FROM announcements 
       WHERE tenant_id = $1 AND is_active = true`,
      [tenantId]
    );

    // Get upcoming meetings
    const meetingsCount = await pool.query(
      `SELECT COUNT(*) as count FROM video_meetings 
       WHERE tenant_id = $1 AND scheduled_start >= NOW()`,
      [tenantId]
    );

    res.json({
      success: true,
      data: {
        unreadNotifications: parseInt(notificationsCount.rows[0]?.count || '0'),
        unreadMessages: parseInt(messagesCount.rows[0]?.count || '0'),
        activeAnnouncements: parseInt(announcementsCount.rows[0]?.count || '0'),
        upcomingMeetings: parseInt(meetingsCount.rows[0]?.count || '0'),
        summary: {
          notifications: parseInt(notificationsCount.rows[0]?.count || '0'),
          messages: parseInt(messagesCount.rows[0]?.count || '0')
        }
      }
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get communications dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch communications dashboard' });
  }
};

// ============================================================================
// EMAIL (Resend Integration)
// ============================================================================

// Initialize Resend only if API key is configured
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Send email via Resend
 */
export const sendEmail = async (req: TenantRequest, res: Response) => {
  try {
    if (!resend) {
      return res.status(503).json({ 
        success: false, 
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' 
      });
    }

    const { tenantId, userId } = getTenantContext(req);
    const { to, cc, bcc, subject, content, htmlContent, templateId, replyTo } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ success: false, error: 'Recipient (to) and subject are required' });
    }

    // Get sender info
    const userResult = await pool.query(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [userId]
    );
    const senderName = userResult.rows[0]?.full_name || 'WorldClass ERP';

    // Get tenant info for from domain
    const tenantResult = await pool.query(
      `SELECT name, settings FROM tenants WHERE id = $1`,
      [tenantId]
    );
    const tenantName = tenantResult.rows[0]?.name || 'WorldClass ERP';

    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'siyabusaerp.co.za';
    const fromEmail = `${senderName.toLowerCase().replace(/\s+/g, '.')}@${fromDomain}`;

    // Send via Resend
    const emailData: any = {
      from: `${senderName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: content,
      html: htmlContent || `<div style="font-family: Arial, sans-serif; padding: 20px;">${content.replace(/\n/g, '<br>')}</div>`,
    };

    if (cc) emailData.cc = Array.isArray(cc) ? cc : [cc];
    if (bcc) emailData.bcc = Array.isArray(bcc) ? bcc : [bcc];
    if (replyTo) emailData.reply_to = replyTo;

    const result = await resend.emails.send(emailData);

    // Store in email_sent table
    await pool.query(
      `INSERT INTO email_sent (tenant_id, user_id, to_addresses, cc_addresses, bcc_addresses, 
        subject, body_text, body_html, resend_id, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'sent', NOW())`,
      [tenantId, userId, JSON.stringify(emailData.to), JSON.stringify(emailData.cc || []), 
       JSON.stringify(emailData.bcc || []), subject, content, emailData.html, result.data?.id]
    );

    res.json({ 
      success: true, 
      data: { 
        id: result.data?.id,
        to: emailData.to,
        subject 
      }, 
      message: 'Email sent successfully' 
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Send email error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send email' });
  }
};

/**
 * Get sent emails
 */
export const getSentEmails = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT e.*, u.full_name as sender_name
      FROM email_sent e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.tenant_id = $1
      ORDER BY e.sent_at DESC
      LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get sent emails error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sent emails' });
  }
};

/**
 * Get email inbox
 */
export const getEmailInbox = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    let queryStr = `
      SELECT * FROM email_inbox
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];

    if (unreadOnly === 'true') {
      queryStr += ` AND is_read = false`;
    }

    queryStr += ` ORDER BY received_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);

    const result = await pool.query(queryStr, params);

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get email inbox error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inbox' });
  }
};

/**
 * Mark email as read
 */
export const markEmailRead = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    await pool.query(
      `UPDATE email_inbox SET is_read = true, read_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    res.json({ success: true, message: 'Email marked as read' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Mark email read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark email as read' });
  }
};

/**
 * Webhook to receive inbound emails from Resend
 */
export const receiveInboundEmail = async (req: TenantRequest, res: Response) => {
  try {
    const { from, to, subject, text, html, headers } = req.body;

    // Extract tenant from recipient email (e.g., inbox@tenant.siyabusaerp.co.za)
    const toEmail = Array.isArray(to) ? to[0] : to;
    
    // For now, store in a default tenant or lookup by email domain
    // In production, you'd parse the subdomain to find the tenant
    const tenantResult = await pool.query(
      `SELECT id FROM tenants LIMIT 1`
    );
    const tenantId = tenantResult.rows[0]?.id;

    if (tenantId) {
      await pool.query(
        `INSERT INTO email_inbox (tenant_id, from_email, from_name, to_email, subject, 
          text_content, html_content, headers, received_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [tenantId, from?.email || from, from?.name || '', toEmail, subject, text, html, JSON.stringify(headers || {})]
      );
    }

    res.json({ success: true, message: 'Email received' });
  } catch (error: any) {
    console.error('Receive inbound email error:', error);
    res.status(500).json({ success: false, error: 'Failed to process inbound email' });
  }
};

/**
 * Reply to an email
 */
export const replyToEmail = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;
    const { content, htmlContent } = req.body;

    // Get original email
    const originalResult = await pool.query(
      `SELECT * FROM email_inbox WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const original = originalResult.rows[0];
    const replyTo = original.from_email;
    const subject = original.subject.startsWith('Re:') ? original.subject : `Re: ${original.subject}`;

    // Get sender info
    const userResult = await pool.query(
      `SELECT full_name FROM users WHERE id = $1`,
      [userId]
    );
    const senderName = userResult.rows[0]?.full_name || 'WorldClass ERP';

    const fromDomain = process.env.RESEND_FROM_DOMAIN || 'siyabusaerp.co.za';
    const fromEmail = `${senderName.toLowerCase().replace(/\s+/g, '.')}@${fromDomain}`;

    // Build reply with quoted original
    const quotedHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        ${htmlContent || content.replace(/\n/g, '<br>')}
        <br><br>
        <div style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
          <p>On ${new Date(original.received_at).toLocaleString()}, ${original.from_name || original.from_email} wrote:</p>
          ${original.html_content || original.text_content?.replace(/\n/g, '<br>') || ''}
        </div>
      </div>
    `;

    // Send via Resend
    const result = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: [replyTo],
      subject,
      html: quotedHtml,
    });

    // Store in sent
    await pool.query(
      `INSERT INTO email_sent (tenant_id, user_id, to_addresses, subject, body_text, 
        body_html, resend_id, status, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', NOW())`,
      [tenantId, userId, JSON.stringify([replyTo]), subject, content, quotedHtml, result.data?.id]
    );

    res.json({ success: true, data: { id: result.data?.id }, message: 'Reply sent successfully' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Reply to email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send reply' });
  }
};

// ============================================================================
// VIDEO MEETINGS (Daily.co Integration)
// ============================================================================

interface DailyRoomResponse {
  name: string;
  url: string;
  privacy: string;
}

/**
 * Create Daily.co room for meeting
 */
const createDailyRoom = async (roomName: string, expiryMinutes: number = 60): Promise<DailyRoomResponse> => {
  const dailyApiKey = process.env.DAILY_API_KEY;
  
  if (!dailyApiKey) {
    // Return mock data if no API key configured
    return {
      name: roomName,
      url: `https://meet.daily.co/${roomName}`,
      privacy: 'public'
    };
  }

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dailyApiKey}`
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'public',
      properties: {
        exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: 'cloud',
        start_video_off: false,
        start_audio_off: false
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Daily.co room creation failed:', error);
    // Return fallback URL
    return {
      name: roomName,
      url: `https://meet.daily.co/${roomName}`,
      privacy: 'public'
    };
  }

  return await response.json() as DailyRoomResponse;
};

/**
 * Start instant meeting
 */
export const startInstantMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { title = 'Instant Meeting', participantUserIds } = req.body;

    // Generate unique room name
    const roomName = `wc-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Create Daily.co room
    const roomData = await createDailyRoom(roomName, 120); // 2 hour expiry

    // Store meeting
    const meetingResult = await pool.query(
      `INSERT INTO video_meetings (tenant_id, host_id, title, room_name, room_url,
        meeting_type, status, actual_start)
      VALUES ($1, $2, $3, $4, $5, 'instant', 'in_progress', NOW())
      RETURNING *`,
      [tenantId, userId, title, roomData.name, roomData.url]
    );

    const meeting = meetingResult.rows[0];

    // Add host as participant
    await pool.query(
      `INSERT INTO video_meeting_participants (tenant_id, meeting_id, user_id, role, status, joined_at)
      VALUES ($1, $2, $3, 'host', 'joined', NOW())`,
      [tenantId, meeting.id, userId]
    );

    // Send invites to participants
    if (participantUserIds && participantUserIds.length > 0) {
      for (const participantId of participantUserIds) {
        if (participantId !== userId) {
          await pool.query(
            `INSERT INTO video_meeting_participants (tenant_id, meeting_id, user_id, role, status)
            VALUES ($1, $2, $3, 'participant', 'invited')`,
            [tenantId, meeting.id, participantId]
          );

          // Create notification
          await pool.query(
            `INSERT INTO user_notifications (tenant_id, user_id, type, title, message, metadata)
            VALUES ($1, $2, 'meeting_invite', $3, $4, $5)`,
            [tenantId, participantId, 'Meeting Invite', `You're invited to: ${title}`, 
             JSON.stringify({ meetingId: meeting.id, roomUrl: roomData.url })]
          );
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      data: { 
        ...meeting,
        joinUrl: roomData.url 
      }, 
      message: 'Meeting started' 
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Start instant meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to start meeting' });
  }
};

/**
 * Join a meeting
 */
export const joinMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    // Get meeting
    const meetingResult = await pool.query(
      `SELECT * FROM video_meetings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    // Update participant status
    await pool.query(
      `UPDATE video_meeting_participants SET status = 'joined', joined_at = NOW()
      WHERE meeting_id = $1 AND user_id = $2`,
      [id, userId]
    );

    // If not already a participant, add them
    await pool.query(
      `INSERT INTO video_meeting_participants (tenant_id, meeting_id, user_id, role, status, joined_at)
      VALUES ($1, $2, $3, 'participant', 'joined', NOW())
      ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = 'joined', joined_at = NOW()`,
      [tenantId, id, userId]
    );

    res.json({ 
      success: true, 
      data: { 
        meetingId: meeting.id,
        title: meeting.title,
        joinUrl: meeting.room_url
      }, 
      message: 'Joined meeting' 
    });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Join meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to join meeting' });
  }
};

/**
 * End a meeting
 */
export const endMeeting = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { id } = req.params;

    // Check if user is host
    const meetingResult = await pool.query(
      `SELECT * FROM video_meetings WHERE id = $1 AND tenant_id = $2 AND host_id = $3`,
      [id, tenantId, userId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Only the host can end the meeting' });
    }

    // Update meeting status
    await pool.query(
      `UPDATE video_meetings SET status = 'ended', actual_end = NOW() WHERE id = $1`,
      [id]
    );

    // Update all participants
    await pool.query(
      `UPDATE video_meeting_participants SET status = 'left', left_at = NOW() WHERE meeting_id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Meeting ended' });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('End meeting error:', error);
    res.status(500).json({ success: false, error: 'Failed to end meeting' });
  }
};

/**
 * Get meeting participants
 */
export const getMeetingParticipants = async (req: TenantRequest, res: Response) => {
  try {
    const { tenantId } = getTenantContext(req);
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.full_name, u.email
      FROM video_meeting_participants p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.meeting_id = $1 AND p.tenant_id = $2
      ORDER BY p.joined_at`,
      [id, tenantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    if (error.message === 'Tenant context required') {
      return res.status(401).json({ success: false, error: 'Unauthorized - tenant not found' });
    }
    console.error('Get meeting participants error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
};

export default {
  getWorkspace,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getChannels,
  createChannel,
  getChannelMessages,
  sendChannelMessage,
  getDirectConversations,
  getDirectMessages,
  sendDirectMessage,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationUnreadCount,
  getMessageUnreadCount,
  getMeetings,
  createMeeting,
  updateMeeting,
  cancelMeeting,
  // New endpoints
  getMessages,
  sendMessage,
  getContacts,
  getTemplates,
  createTemplate,
  getCampaigns,
  createCampaign,
  // Dashboard
  getCommunicationsDashboard,
  // Email
  sendEmail,
  getSentEmails,
  getEmailInbox,
  markEmailRead,
  receiveInboundEmail,
  replyToEmail,
  // Video Meetings Enhanced
  startInstantMeeting,
  joinMeeting,
  endMeeting,
  getMeetingParticipants
};
