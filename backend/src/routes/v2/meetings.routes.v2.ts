/**
 * Meetings Routes V2
 * 
 * Tenant-hardened video conferencing routes
 * These routes replace the legacy meetings.routes.ts
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import * as MeetingsController from '../../controllers/v2/meetings.controller.v2';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticateToken as any);
router.use(tenantMiddleware as any);

// Service status
router.get('/status', MeetingsController.getMeetingStatus as any);

// Quick actions
router.post('/instant', MeetingsController.createInstantMeeting as any);
router.post('/schedule', MeetingsController.scheduleMeeting as any);

// Room management
router.post('/room', MeetingsController.createRoom as any);
router.get('/rooms', MeetingsController.listRooms as any);
router.get('/room/:name', MeetingsController.getRoom as any);
router.delete('/room/:name', MeetingsController.deleteRoom as any);

// Tokens and invites
router.post('/token', MeetingsController.createToken as any);
router.post('/invite', MeetingsController.createInvite as any);

// Analytics
router.get('/logs/:roomName', MeetingsController.getMeetingLogs as any);
router.get('/usage', MeetingsController.getUsageStats as any);

export default router;
