/**
 * Daily.co Video Meeting Service (Multi-Tenant)
 * 
 * Provides video conferencing capabilities for the Communications Hub.
 * Uses Daily.co's API for creating and managing video meeting rooms.
 * 
 * Multi-Tenancy:
 * - All rooms are prefixed with tenant ID for isolation
 * - Room operations require tenant context
 * - Listing/searching is scoped to tenant
 * 
 * Free tier includes:
 * - 2,000 participant minutes/month
 * - Up to 50 participants per room
 * - Screen sharing
 * - Recording (limited)
 * 
 * @see https://docs.daily.co/reference
 */

import axios, { AxiosInstance } from 'axios';

// Access env at runtime (not module load time) to support late loading/injection
const getDailyApiUrl = () => process.env.DAILY_API_URL || 'https://api.daily.co/v1';
const getDailyApiKey = () => process.env.DAILY_API_KEY?.trim();

// Tenant context for all operations
interface TenantContext {
  tenantId: string;
  userId?: string;
}

interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    exp?: number;                    // Expiration timestamp (Unix)
    nbf?: number;                    // Not before timestamp (Unix)
    max_participants?: number;       // Max participants (default 50)
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_knocking?: boolean;       // Waiting room
    start_video_off?: boolean;
    start_audio_off?: boolean;
    owner_only_broadcast?: boolean;  // Webinar mode
    enable_recording?: 'cloud' | 'local' | 'raw-tracks' | undefined;
    eject_at_room_exp?: boolean;
    lang?: string;                   // UI language
  };
}

interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: 'public' | 'private';
  url: string;
  created_at: string;
  config: DailyRoomConfig['properties'];
}

interface MeetingToken {
  token: string;
}

interface MeetingParticipant {
  user_id: string;
  user_name: string;
  join_time: string;
  duration: number;
}

interface MeetingRecording {
  id: string;
  room_name: string;
  start_ts: number;
  duration: number;
  status: string;
  download_link?: string;
}

class DailyMeetingService {
  private _apiClient: AxiosInstance | null = null;

  // Lazy initialize API client to ensure env vars are loaded at runtime
  private get apiClient(): AxiosInstance {
    if (!this._apiClient) {
      const apiKey = getDailyApiKey();
      const apiUrl = getDailyApiUrl();
      if (!apiKey) {
        throw new Error('Daily.co API key not configured');
      }
      this._apiClient = axios.create({
        baseURL: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000
      });

      // Centralized error logging for API calls
      this._apiClient.interceptors.response.use(
        response => response,
        error => {
          if (error.response) {
            console.error('[Daily] API error', {
              status: error.response.status,
              data: error.response.data,
              url: error.config?.url
            });
          } else if (error.request) {
            console.error('[Daily] Network error', error.message);
          } else {
            console.error('[Daily] Unexpected error', error.message);
          }
          return Promise.reject(error);
        }
      );
    }
    return this._apiClient;
  }

  /**
   * Check if Daily.co is configured
   */
  isConfigured(): boolean {
    const key = getDailyApiKey();
    return Boolean(key && key.length > 0);
  }

  /**
   * Generate tenant-scoped room name prefix
   */
  private getTenantRoomPrefix(tenantId: string): string {
    // Use first 8 chars of tenant ID for room prefix
    return `t${tenantId.substring(0, 8)}`;
  }

  /**
   * Generate a tenant-scoped room name
   */
  private generateRoomName(tenantId: string, baseName?: string): string {
    const prefix = this.getTenantRoomPrefix(tenantId);
    const suffix = baseName || `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    // Daily.co room names must be lowercase alphanumeric with hyphens
    const sanitized = suffix.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 30);
    return `${prefix}-${sanitized}`;
  }

  /**
   * Check if a room belongs to a tenant
   */
  private isRoomOwnedByTenant(roomName: string, tenantId: string): boolean {
    const prefix = this.getTenantRoomPrefix(tenantId);
    return roomName.startsWith(`${prefix}-`);
  }

  /**
   * Create a new meeting room (tenant-scoped)
   * @param tenant Tenant context
   * @param options Room configuration options
   */
  async createRoom(
    tenant: TenantContext,
    options: {
      name?: string;
      expiryMinutes?: number;
      maxParticipants?: number;
      enableWaitingRoom?: boolean;
      enableRecording?: boolean;
      isWebinar?: boolean;
    } = {}
  ): Promise<DailyRoom> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    const {
      name,
      expiryMinutes = 60,
      maxParticipants = 50,
      enableWaitingRoom = false,
      enableRecording = false,
      isWebinar = false
    } = options;

    // Generate tenant-scoped room name
    const roomName = this.generateRoomName(tenant.tenantId, name);
    
    // Calculate expiration (Unix timestamp)
    const exp = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

    const config: DailyRoomConfig = {
      name: roomName,
      privacy: enableWaitingRoom ? 'private' : 'public',
      properties: {
        exp,
        max_participants: maxParticipants,
        enable_screenshare: true,
        enable_chat: true,
        enable_knocking: enableWaitingRoom,
        start_video_off: false,
        start_audio_off: false,
        owner_only_broadcast: isWebinar,
        enable_recording: enableRecording ? 'cloud' : undefined,
        eject_at_room_exp: true,
        lang: 'en'
      }
    };

    try {
      const response = await this.apiClient.post<DailyRoom>('/rooms', config);
      console.log(`[Daily] Room created for tenant ${tenant.tenantId}: ${response.data.name}`);
      return response.data;
    } catch (error: any) {
      console.error(`[Daily] Failed to create room for tenant ${tenant.tenantId}:`, error.response?.data || error.message);
      throw new Error(`Failed to create meeting room: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get an existing room by name (tenant-scoped)
   */
  async getRoom(tenant: TenantContext, roomName: string): Promise<DailyRoom | null> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    // Verify room belongs to tenant
    if (!this.isRoomOwnedByTenant(roomName, tenant.tenantId)) {
      console.warn(`[Daily] Tenant ${tenant.tenantId} attempted to access room ${roomName} owned by another tenant`);
      return null;
    }

    try {
      const response = await this.apiClient.get<DailyRoom>(`/rooms/${roomName}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all rooms for a tenant
   */
  async listRooms(tenant: TenantContext, limit: number = 50): Promise<DailyRoom[]> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    try {
      const response = await this.apiClient.get<{ data: DailyRoom[] }>('/rooms', {
        params: { limit: Math.min(limit * 2, 100) } // Fetch extra to filter
      });
      
      // Filter to only return rooms belonging to this tenant
      const tenantRooms = response.data.data.filter(room => 
        this.isRoomOwnedByTenant(room.name, tenant.tenantId)
      );
      
      return tenantRooms.slice(0, limit);
    } catch (error: any) {
      console.error(`[Daily] Failed to list rooms for tenant ${tenant.tenantId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a room (tenant-scoped)
   */
  async deleteRoom(tenant: TenantContext, roomName: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    // Verify room belongs to tenant
    if (!this.isRoomOwnedByTenant(roomName, tenant.tenantId)) {
      console.warn(`[Daily] Tenant ${tenant.tenantId} attempted to delete room ${roomName} owned by another tenant`);
      return false;
    }

    try {
      await this.apiClient.delete(`/rooms/${roomName}`);
      console.log(`[Daily] Room deleted for tenant ${tenant.tenantId}: ${roomName}`);
      return true;
    } catch (error: any) {
      console.error(`[Daily] Failed to delete room for tenant ${tenant.tenantId}:`, error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Create a meeting token for a participant (tenant-scoped)
   * Tokens can have restricted permissions (e.g., for guests vs hosts)
   */
  async createMeetingToken(
    tenant: TenantContext,
    options: {
      roomName: string;
      userName: string;
      isOwner?: boolean;
      expiryMinutes?: number;
      participantUserId?: string;
    }
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    const {
      roomName,
      userName,
      isOwner = false,
      expiryMinutes = 60,
      participantUserId
    } = options;

    // Verify room belongs to tenant
    if (!this.isRoomOwnedByTenant(roomName, tenant.tenantId)) {
      throw new Error('Room not found or access denied');
    }

    const exp = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

    try {
      const response = await this.apiClient.post<MeetingToken>('/meeting-tokens', {
        properties: {
          room_name: roomName,
          user_name: userName,
          user_id: participantUserId || tenant.userId,
          is_owner: isOwner,
          exp,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false
        }
      });
      return response.data.token;
    } catch (error: any) {
      console.error(`[Daily] Failed to create token for tenant ${tenant.tenantId}:`, error.response?.data || error.message);
      throw new Error(`Failed to create meeting token: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get meeting analytics/logs for a room (tenant-scoped)
   */
  async getMeetingLogs(tenant: TenantContext, roomName: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    // Verify room belongs to tenant
    if (!this.isRoomOwnedByTenant(roomName, tenant.tenantId)) {
      throw new Error('Room not found or access denied');
    }

    try {
      const response = await this.apiClient.get('/logs', {
        params: {
          room: roomName,
          limit: 100
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`[Daily] Failed to get logs for tenant ${tenant.tenantId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get domain/account information (admin only - not tenant-scoped)
   */
  async getAccountInfo(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Daily.co API key not configured');
    }

    try {
      const response = await this.apiClient.get('/');
      return response.data;
    } catch (error: any) {
      console.error('[Daily] Failed to get account info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create an instant meeting (quick room with short expiry) - tenant-scoped
   */
  async createInstantMeeting(
    tenant: TenantContext,
    hostName: string
  ): Promise<{
    room: DailyRoom;
    hostToken: string;
    guestUrl: string;
  }> {
    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    // Create room with 2-hour expiry
    const room = await this.createRoom(tenant, {
      expiryMinutes: 120,
      maxParticipants: 10
    });

    // Create host token
    const hostToken = await this.createMeetingToken(tenant, {
      roomName: room.name,
      userName: hostName,
      isOwner: true,
      expiryMinutes: 120
    });

    return {
      room,
      hostToken,
      guestUrl: room.url
    };
  }

  /**
   * Schedule a meeting (room with future start time) - tenant-scoped
   */
  async scheduleMeeting(
    tenant: TenantContext,
    options: {
      title: string;
      startTime: Date;
      durationMinutes: number;
      hostName: string;
      maxParticipants?: number;
      enableWaitingRoom?: boolean;
    }
  ): Promise<{
    room: DailyRoom;
    hostToken: string;
    guestUrl: string;
    startTime: Date;
    endTime: Date;
  }> {
    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    const { title, startTime, durationMinutes, hostName, maxParticipants, enableWaitingRoom } = options;

    // Calculate room expiry (30 min after scheduled end time)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const expiryMinutes = Math.ceil((endTime.getTime() - Date.now()) / 60000) + 30;

    // Create sanitized room name from title
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);

    const room = await this.createRoom(tenant, {
      name: `${sanitizedTitle}-${Date.now()}`,
      expiryMinutes,
      maxParticipants,
      enableWaitingRoom
    });

    const hostToken = await this.createMeetingToken(tenant, {
      roomName: room.name,
      userName: hostName,
      isOwner: true,
      expiryMinutes
    });

    return {
      room,
      hostToken,
      guestUrl: room.url,
      startTime,
      endTime
    };
  }

  /**
   * Generate a guest invitation link - tenant-scoped
   */
  async createGuestInvite(
    tenant: TenantContext,
    roomName: string,
    guestName: string,
    expiryMinutes: number = 120
  ): Promise<{
    url: string;
    token: string;
  }> {
    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    const room = await this.getRoom(tenant, roomName);
    if (!room) {
      throw new Error('Room not found');
    }

    const token = await this.createMeetingToken(tenant, {
      roomName,
      userName: guestName,
      isOwner: false,
      expiryMinutes
    });

    // Return URL with token for direct join
    return {
      url: `${room.url}?t=${token}`,
      token
    };
  }

  /**
   * Get meeting usage statistics for a tenant
   */
  async getTenantUsageStats(tenant: TenantContext): Promise<{
    activeRooms: number;
    totalRooms: number;
  }> {
    if (!tenant?.tenantId) {
      throw new Error('Tenant context required');
    }

    const rooms = await this.listRooms(tenant, 100);
    const now = Math.floor(Date.now() / 1000);
    
    const activeRooms = rooms.filter(room => {
      const exp = room.config?.exp;
      return !exp || exp > now;
    }).length;

    return {
      activeRooms,
      totalRooms: rooms.length
    };
  }
}

export const dailyMeetingService = new DailyMeetingService();
export default dailyMeetingService;
