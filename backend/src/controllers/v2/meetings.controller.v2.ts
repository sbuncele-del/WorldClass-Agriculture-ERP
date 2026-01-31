/**
 * Meetings Controller V2
 * 
 * Tenant-hardened video conferencing API using Daily.co
 * Used by the Communications Hub for video meeting features.
 */

import { Request, Response } from 'express';
import { dailyMeetingService } from '../../services/daily-meeting.service';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string; name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

/**
 * GET /api/v2/meetings/status
 * Check if video conferencing is configured
 */
export async function getMeetingStatus(req: TenantRequest, res: Response): Promise<void> {
  try {
    getTenantContext(req); // Validate tenant exists
    
    const isConfigured = dailyMeetingService.isConfigured();
    
    if (isConfigured) {
      const accountInfo = await dailyMeetingService.getAccountInfo();
      res.json({
        success: true,
        data: {
          configured: true,
          domain: accountInfo.domain_name,
          features: {
            maxParticipants: 50,
            screenShare: true,
            chat: true,
            recording: true
          }
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          configured: false,
          message: 'Video conferencing not configured'
        }
      });
    }
  } catch (error: any) {
    console.error('[MeetingsV2] Status check error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/meetings/instant
 * Create an instant meeting (start immediately)
 */
export async function createInstantMeeting(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const hostName = req.user?.name || req.user?.first_name || req.user?.email || 'Host';

    const meeting = await dailyMeetingService.createInstantMeeting(
      { tenantId, userId },
      hostName
    );

    res.json({
      success: true,
      data: {
        id: meeting.room.id,
        name: meeting.room.name,
        url: meeting.room.url,
        hostUrl: `${meeting.room.url}?t=${meeting.hostToken}`,
        guestUrl: meeting.guestUrl,
        createdAt: meeting.room.created_at
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Create instant meeting error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/meetings/schedule
 * Schedule a meeting for a future time
 */
export async function scheduleMeeting(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      title,
      startTime,
      durationMinutes = 60,
      maxParticipants = 10,
      enableWaitingRoom = false
    } = req.body;

    if (!title || !startTime) {
      res.status(400).json({
        success: false,
        error: 'Title and startTime are required'
      });
      return;
    }

    const hostName = req.user?.name || req.user?.first_name || req.user?.email || 'Host';

    const meeting = await dailyMeetingService.scheduleMeeting(
      { tenantId, userId },
      {
        title,
        startTime: new Date(startTime),
        durationMinutes,
        hostName,
        maxParticipants,
        enableWaitingRoom
      }
    );

    res.json({
      success: true,
      data: {
        id: meeting.room.id,
        name: meeting.room.name,
        title,
        url: meeting.room.url,
        hostUrl: `${meeting.room.url}?t=${meeting.hostToken}`,
        guestUrl: meeting.guestUrl,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        durationMinutes
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Schedule meeting error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/meetings/room
 * Create a custom meeting room
 */
export async function createRoom(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      name,
      expiryMinutes = 120,
      maxParticipants = 50,
      enableWaitingRoom = false,
      enableRecording = false,
      isWebinar = false
    } = req.body;

    const room = await dailyMeetingService.createRoom(
      { tenantId, userId },
      {
        name,
        expiryMinutes,
        maxParticipants,
        enableWaitingRoom,
        enableRecording,
        isWebinar
      }
    );

    res.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Create room error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/meetings/rooms
 * List all meeting rooms for tenant
 */
export async function listRooms(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const limit = parseInt(req.query.limit as string) || 50;

    const rooms = await dailyMeetingService.listRooms({ tenantId, userId }, limit);

    res.json({
      success: true,
      data: rooms.map(room => ({
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }))
    });
  } catch (error: any) {
    console.error('[MeetingsV2] List rooms error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/meetings/room/:name
 * Get a specific room by name
 */
export async function getRoom(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name } = req.params;

    const room = await dailyMeetingService.getRoom({ tenantId, userId }, name);

    if (!room) {
      res.status(404).json({
        success: false,
        error: 'Room not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Get room error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * DELETE /api/v2/meetings/room/:name
 * Delete a meeting room
 */
export async function deleteRoom(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { name } = req.params;

    const deleted = await dailyMeetingService.deleteRoom({ tenantId, userId }, name);

    res.json({
      success: deleted,
      data: { message: deleted ? 'Room deleted' : 'Failed to delete room' }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Delete room error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/meetings/token
 * Create a meeting token for joining a room
 */
export async function createToken(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      roomName,
      userName,
      isOwner = false,
      expiryMinutes = 120
    } = req.body;

    if (!roomName) {
      res.status(400).json({
        success: false,
        error: 'roomName is required'
      });
      return;
    }

    const participantName = userName || req.user?.name || req.user?.first_name || req.user?.email || 'Participant';

    const token = await dailyMeetingService.createMeetingToken(
      { tenantId, userId },
      {
        roomName,
        userName: participantName,
        isOwner,
        expiryMinutes,
        participantUserId: userId
      }
    );

    // Get the room URL
    const room = await dailyMeetingService.getRoom({ tenantId, userId }, roomName);

    res.json({
      success: true,
      data: {
        token,
        joinUrl: room ? `${room.url}?t=${token}` : null
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Create token error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/v2/meetings/invite
 * Create a guest invitation link
 */
export async function createInvite(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const {
      roomName,
      guestName = 'Guest',
      expiryMinutes = 120
    } = req.body;

    if (!roomName) {
      res.status(400).json({
        success: false,
        error: 'roomName is required'
      });
      return;
    }

    const invite = await dailyMeetingService.createGuestInvite(
      { tenantId, userId },
      roomName,
      guestName,
      expiryMinutes
    );

    res.json({
      success: true,
      data: {
        url: invite.url,
        roomName,
        guestName,
        expiresIn: `${expiryMinutes} minutes`
      }
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Create invite error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/meetings/logs/:roomName
 * Get meeting logs/analytics for a room
 */
export async function getMeetingLogs(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);
    const { roomName } = req.params;

    const logs = await dailyMeetingService.getMeetingLogs({ tenantId, userId }, roomName);

    res.json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Get logs error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/v2/meetings/usage
 * Get tenant's meeting usage statistics
 */
export async function getUsageStats(req: TenantRequest, res: Response): Promise<void> {
  try {
    const { tenantId, userId } = getTenantContext(req);

    const stats = await dailyMeetingService.getTenantUsageStats({ tenantId, userId });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('[MeetingsV2] Get usage stats error:', error);
    res.status(error.message?.includes('context') ? 401 : 500).json({
      success: false,
      error: error.message
    });
  }
}
