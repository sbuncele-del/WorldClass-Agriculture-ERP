/**
 * Meeting Routes - Video Conferencing API
 * 
 * Endpoints for creating and managing video meetings using Daily.co
 * Used by the Communications Hub for video conferencing features.
 */

import { Router, Request, Response } from 'express';
import { dailyMeetingService } from '../services/daily-meeting.service';
import { authenticateToken } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * GET /api/meetings/status
 * Check if video conferencing is configured
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = dailyMeetingService.isConfigured();
    // Temp debug to confirm runtime env
    console.log('[Meetings] status check - configured:', isConfigured, 'key length:', process.env.DAILY_API_KEY?.length || 0);
    
    if (isConfigured) {
      const accountInfo = await dailyMeetingService.getAccountInfo();
      res.json({
        configured: true,
        domain: accountInfo.domain_name,
        features: {
          maxParticipants: 50,
          screenShare: true,
          chat: true,
          recording: true
        }
      });
    } else {
      res.json({
        configured: false,
        message: 'Video conferencing not configured. Add DAILY_API_KEY to environment.'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      configured: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meetings/instant
 * Create an instant meeting (start immediately)
 */
router.post('/instant', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const hostName = user?.name || user?.email || 'Host';
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };

    const meeting = await dailyMeetingService.createInstantMeeting(tenantContext, hostName);

    res.json({
      success: true,
      meeting: {
        id: meeting.room.id,
        name: meeting.room.name,
        url: meeting.room.url,
        hostUrl: `${meeting.room.url}?t=${meeting.hostToken}`,
        guestUrl: meeting.guestUrl,
        createdAt: meeting.room.created_at
      }
    });
  } catch (error: any) {
    console.error('Failed to create instant meeting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meetings/schedule
 * Schedule a meeting for a future time
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const {
      title,
      startTime,
      durationMinutes = 60,
      maxParticipants = 10,
      enableWaitingRoom = false
    } = req.body;

    if (!title || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Title and startTime are required'
      });
    }

    const hostName = user?.name || user?.email || 'Host';
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };

    const meeting = await dailyMeetingService.scheduleMeeting(tenantContext, {
      title,
      startTime: new Date(startTime),
      durationMinutes,
      hostName,
      maxParticipants,
      enableWaitingRoom
    });

    res.json({
      success: true,
      meeting: {
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
    console.error('Failed to schedule meeting:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meetings/room
 * Create a custom meeting room
 */
router.post('/room', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const {
      name,
      expiryMinutes = 120,
      maxParticipants = 50,
      enableWaitingRoom = false,
      enableRecording = false,
      isWebinar = false
    } = req.body;

    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const room = await dailyMeetingService.createRoom(tenantContext, {
      name,
      expiryMinutes,
      maxParticipants,
      enableWaitingRoom,
      enableRecording,
      isWebinar
    });

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }
    });
  } catch (error: any) {
    console.error('Failed to create room:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/meetings/rooms
 * List all meeting rooms
 */
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const limit = parseInt(req.query.limit as string) || 50;
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const rooms = await dailyMeetingService.listRooms(tenantContext, limit);

    res.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }))
    });
  } catch (error: any) {
    console.error('Failed to list rooms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/meetings/room/:name
 * Get a specific room by name
 */
router.get('/room/:name', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const { name } = req.params;
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const room = await dailyMeetingService.getRoom(tenantContext, name);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        createdAt: room.created_at
      }
    });
  } catch (error: any) {
    console.error('Failed to get room:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/meetings/room/:name
 * Delete a meeting room
 */
router.delete('/room/:name', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const { name } = req.params;
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const deleted = await dailyMeetingService.deleteRoom(tenantContext, name);

    res.json({
      success: deleted,
      message: deleted ? 'Room deleted' : 'Failed to delete room'
    });
  } catch (error: any) {
    console.error('Failed to delete room:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meetings/token
 * Create a meeting token for joining a room
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const {
      roomName,
      userName,
      isOwner = false,
      expiryMinutes = 120
    } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'roomName is required'
      });
    }

    const participantName = userName || user?.name || user?.email || 'Participant';
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };

    const token = await dailyMeetingService.createMeetingToken(tenantContext, {
      roomName,
      userName: participantName,
      isOwner,
      expiryMinutes,
      participantUserId: user?.id
    });

    // Get the room URL
    const room = await dailyMeetingService.getRoom(tenantContext, roomName);

    res.json({
      success: true,
      token,
      joinUrl: room ? `${room.url}?t=${token}` : null
    });
  } catch (error: any) {
    console.error('Failed to create token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meetings/invite
 * Create a guest invitation link
 */
router.post('/invite', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const {
      roomName,
      guestName = 'Guest',
      expiryMinutes = 120
    } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'roomName is required'
      });
    }

    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const invite = await dailyMeetingService.createGuestInvite(
      tenantContext,
      roomName,
      guestName,
      expiryMinutes
    );

    res.json({
      success: true,
      invitation: {
        url: invite.url,
        roomName,
        guestName,
        expiresIn: `${expiryMinutes} minutes`
      }
    });
  } catch (error: any) {
    console.error('Failed to create invite:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/meetings/logs/:roomName
 * Get meeting logs/analytics for a room
 */
router.get('/logs/:roomName', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenant = (req as any).tenant;
    const { roomName } = req.params;
    const tenantContext = { tenantId: tenant?.id || 'default', userId: user?.id };
    const logs = await dailyMeetingService.getMeetingLogs(tenantContext, roomName);

    res.json({
      success: true,
      logs
    });
  } catch (error: any) {
    console.error('Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
