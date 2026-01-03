/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// Re-export types from matrix-client for compatibility
export interface Room {
  roomId: string;
  name: string;
  topic?: string;
  memberCount: number;
  unreadCount: number;
  avatarUrl?: string;
  isDirect?: boolean;
}

export interface Reaction {
  key: string; // emoji
  count: number;
  users: string[]; // user IDs who reacted
}

export interface Message {
  eventId: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: string;
  reactions?: Reaction[];
  isEdited?: boolean;
  isDeleted?: boolean;
  formattedContent?: string;
  format?: string;
  mentions?: string[];
  fileUrl?: string;
  fileInfo?: {
    mimetype?: string;
    size?: number;
    w?: number;
    h?: number;
  };
}

export interface Member {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  membership: string;
  presence?: 'online' | 'offline' | 'unavailable';
}

export interface Invitation {
  roomId: string;
  roomName: string;
  inviter: string;
  inviterName: string;
  timestamp: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

class CustomChatClient {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private accessToken: string | null = null;
  private rooms: Room[] = [];
  private invitations: Invitation[] = [];

  // Event handlers (same interface as Matrix client)
  public onMessage?: (message: Message, room: Room) => void;
  public onRoomUpdate?: (rooms: Room[]) => void;
  public onTyping?: (roomId: string, users: string[]) => void;
  public onSyncState?: (state: string) => void;
  public onRoomDataUpdate?: (roomId: string) => void;
  public onInvitation?: (invitations: Invitation[]) => void;

  /**
   * Login with email and password
   */
  async login(_homeserverUrl: string, email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.userId = data.user.id;

      // Connect Socket.IO
      await this.connectSocket();

      // Load initial data
      await this.loadRooms();
      await this.loadInvitations();

      return {
        userId: data.user.id,
        accessToken: data.accessToken,
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Login with saved token
   */
  async loginWithToken(_homeserverUrl: string, accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;

    // Connect Socket.IO
    await this.connectSocket();

    // Load initial data
    await this.loadRooms();
    await this.loadInvitations();

    return { userId, accessToken };
  }

  /**
   * Connect to Socket.IO server
   */
  private async connectSocket() {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    this.socket = io(API_URL, {
      auth: {
        token: this.accessToken,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        console.log('Socket.IO connected');
        this.onSyncState?.('PREPARED');
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    // New message
    this.socket.on('message:new', (data: any) => {
      const message = this.formatMessage(data.message);
      const room = this.rooms.find((r) => r.roomId === data.roomId);
      if (room && message) {
        this.onMessage?.(message, room);
        this.loadRooms(); // Refresh rooms to update unread counts
      }
    });

    // Message edited
    this.socket.on('message:edited', (data: any) => {
      this.onRoomDataUpdate?.(data.roomId);
    });

    // Message deleted
    this.socket.on('message:deleted', (data: any) => {
      this.onRoomDataUpdate?.(data.roomId);
    });

    // Reactions updated
    this.socket.on('message:reactions', (data: any) => {
      this.onRoomDataUpdate?.(data.roomId);
    });

    // Typing indicator
    this.socket.on('typing:update', (data: any) => {
      this.onTyping?.(data.roomId, data.isTyping ? [data.userId] : []);
    });

    // User status changed
    this.socket.on('user:status', (data: any) => {
      // Update member presence
      console.log('User status changed:', data);
    });

    // Room invitation
    this.socket.on('room:invitation', async () => {
      await this.loadInvitations();
    });

    // Member joined/left
    this.socket.on('room:memberJoined', (data: any) => {
      this.onRoomDataUpdate?.(data.roomId);
    });

    this.socket.on('room:memberLeft', (data: any) => {
      this.onRoomDataUpdate?.(data.roomId);
    });
  }

  /**
   * Load rooms from API
   */
  private async loadRooms() {
    try {
      const response = await this.fetchAPI('/api/rooms');
      const data = await response.json();

      this.rooms = data.rooms.map((room: any) => ({
        roomId: room._id,
        name: room.name,
        topic: room.topic,
        memberCount: 0, // Will be updated when needed
        unreadCount: room.unreadCount || 0,
        avatarUrl: room.avatarUrl,
        isDirect: room.isDirect,
      }));

      this.onRoomUpdate?.(this.rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }

  /**
   * Load invitations from API
   */
  private async loadInvitations() {
    try {
      const response = await this.fetchAPI('/api/rooms/invitations');
      const data = await response.json();

      this.invitations = data.invitations.map((inv: any) => ({
        roomId: inv.roomId,
        roomName: inv.room.name,
        inviter: inv.invitedBy?.userId || 'unknown',
        inviterName: inv.invitedBy?.displayName || 'Unknown',
        timestamp: new Date(inv.createdAt).getTime(),
      }));

      this.onInvitation?.(this.invitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  }

  /**
   * Helper to make authenticated API requests
   */
  private async fetchAPI(path: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response;
  }

  /**
   * Format message from backend format to client format
   */
  private formatMessage(msg: any): Message {
    return {
      eventId: msg._id,
      sender: msg.senderId._id || msg.senderId,
      senderName: msg.senderId.displayName || msg.senderId.username || 'Unknown',
      content: msg.content,
      timestamp: new Date(msg.createdAt).getTime(),
      type: msg.type,
      reactions: msg.reactions?.map((r: any) => ({
        key: r.emoji,
        count: r.count,
        users: r.users,
      })),
      isEdited: !!msg.editedAt,
      isDeleted: !!msg.deletedAt,
      formattedContent: msg.formattedContent,
      format: msg.format,
      mentions: msg.mentions,
      fileUrl: msg.fileUrl,
      fileInfo: msg.fileInfo,
    };
  }

  /**
   * Get all rooms
   */
  getRooms(): Room[] {
    return this.rooms;
  }

  /**
   * Get a specific room
   */
  getRoom(roomId: string): Room | null {
    return this.rooms.find((r) => r.roomId === roomId) || null;
  }

  /**
   * Get messages for a room
   */
  async getMessages(roomId: string, limit = 50): Promise<Message[]> {
    try {
      const response = await this.fetchAPI(`/api/messages/${roomId}?limit=${limit}`);
      const data = await response.json();

      return data.messages.map((msg: any) => this.formatMessage(msg));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Get room members
   */
  async getRoomMembers(roomId: string): Promise<Member[]> {
    try {
      const response = await this.fetchAPI(`/api/rooms/${roomId}/members`);
      const data = await response.json();

      return data.members.map((member: any) => ({
        userId: member.userId,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
        membership: 'join',
        presence: member.status === 'online' ? 'online' : 'offline',
      }));
    } catch (error) {
      console.error('Failed to get room members:', error);
      return [];
    }
  }

  /**
   * Get invitations
   */
  getInvitations(): Invitation[] {
    return this.invitations;
  }

  /**
   * Invite user to room
   */
  async inviteUserToRoom(roomId: string, userId: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('room:invite', { roomId, invitedUserId: userId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('room:acceptInvite', { roomId }, async (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          await this.loadRooms();
          await this.loadInvitations();
          resolve();
        }
      });
    });
  }

  /**
   * Reject invitation
   */
  async rejectInvitation(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('room:rejectInvite', { roomId }, async (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          await this.loadInvitations();
          resolve();
        }
      });
    });
  }

  /**
   * Leave room
   */
  async leaveRoom(roomId: string) {
    try {
      await this.fetchAPI(`/api/rooms/${roomId}/leave`, { method: 'POST' });
      await this.loadRooms();
    } catch (error) {
      console.error('Failed to leave room:', error);
      throw error;
    }
  }

  /**
   * Create room
   */
  async createRoom(name: string, topic = '', isPublic = false): Promise<string> {
    try {
      const response = await this.fetchAPI('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ name, topic, isPublic }),
      });
      const data = await response.json();
      await this.loadRooms();
      return data.room._id;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Create direct message
   */
  async createDirectMessage(userId: string): Promise<string> {
    try {
      const response = await this.fetchAPI('/api/rooms/direct', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await response.json();
      await this.loadRooms();
      return data.room._id;
    } catch (error) {
      console.error('Failed to create DM:', error);
      throw error;
    }
  }

  /**
   * Join room
   */
  async joinRoom(roomId: string): Promise<string> {
    try {
      await this.fetchAPI(`/api/rooms/${roomId}/join`, { method: 'POST' });
      await this.loadRooms();
      return roomId;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Helper to parse mentions
   */
  private parseMentions(
    content: string,
    roomMembers: Member[]
  ): {
    userIds: string[];
    formattedHtml: string;
  } {
    const mentionRegex = /@(\w+)/g;
    const userIds: string[] = [];
    let formattedHtml = content;

    const matches = content.matchAll(mentionRegex);
    for (const match of matches) {
      const name = match[1];
      const member = roomMembers.find(
        (m) =>
          m.displayName.toLowerCase() === name.toLowerCase() ||
          m.userId.includes(name.toLowerCase())
      );

      if (member) {
        userIds.push(member.userId);
        formattedHtml = formattedHtml.replace(
          match[0],
          `<span class="mention text-indigo-400 bg-indigo-900/30 px-1 rounded font-semibold">@${member.displayName}</span>`
        );
      }
    }

    return { userIds, formattedHtml };
  }

  /**
   * Send message
   */
  async sendMessage(roomId: string, message: string, useMarkdown = true) {
    if (!this.socket) throw new Error('Socket not connected');

    const members = await this.getRoomMembers(roomId);
    const { userIds, formattedHtml } = this.parseMentions(message, members);

    let formatted = formattedHtml;

    // Apply markdown if enabled
    if (useMarkdown && (message.includes('**') || message.includes('*') || message.includes('`') || message.includes('['))) {
      formatted = await marked.parse(formattedHtml, { async: true });
    }

    const sanitizedHtml = DOMPurify.sanitize(formatted);

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit(
        'message:send',
        {
          roomId,
          content: message,
          type: 'm.text',
          formattedContent: sanitizedHtml,
          mentions: userIds,
        },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Send typing indicator
   */
  async sendTyping(roomId: string, isTyping: boolean) {
    if (!this.socket) return;

    this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', { roomId });
  }

  /**
   * Upload file
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.file.url;
  }

  /**
   * Send file
   */
  async sendFile(roomId: string, file: File, fileUrl: string) {
    if (!this.socket) throw new Error('Socket not connected');

    const isImage = file.type.startsWith('image/');
    const fileInfo: any = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };

    // Get image dimensions if it's an image
    if (isImage) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve) => {
        img.onload = () => {
          fileInfo.w = img.width;
          fileInfo.h = img.height;
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        img.src = objectUrl;
      });
    }

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit(
        'message:send',
        {
          roomId,
          content: file.name,
          type: isImage ? 'm.image' : 'm.file',
          fileUrl,
          fileInfo,
        },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get media URL
   */
  getMediaUrl(fileUrl: string): string {
    // fileUrl is already a relative URL like /uploads/filename.jpg
    return `${API_URL}${fileUrl}`;
  }

  /**
   * Fetch authenticated media (not needed for our backend, but keep for compatibility)
   */
  async fetchAuthenticatedMedia(fileUrl: string): Promise<string> {
    return this.getMediaUrl(fileUrl);
  }

  /**
   * Send reaction
   */
  async sendReaction(roomId: string, eventId: string, emoji: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit(
        'message:react',
        { roomId, messageId: eventId, emoji },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Remove reaction (same as send, it toggles)
   */
  async removeReaction(roomId: string, eventId: string, emoji: string) {
    return this.sendReaction(roomId, eventId, emoji);
  }

  /**
   * Edit message
   */
  async editMessage(roomId: string, eventId: string, newContent: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit(
        'message:edit',
        { roomId, messageId: eventId, newContent },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(roomId: string, eventId: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit(
        'message:delete',
        { roomId, messageId: eventId },
        (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Mark room as read
   */
  async markRoomAsRead(roomId: string) {
    if (!this.socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('room:markRead', { roomId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          this.loadRooms(); // Refresh to update unread counts
          resolve();
        }
      });
    });
  }

  /**
   * Get display name
   */
  async getDisplayName(): Promise<string | null> {
    try {
      const response = await this.fetchAPI('/api/auth/me');
      const data = await response.json();
      return data.user.displayName;
    } catch (error) {
      console.error('Failed to get display name:', error);
      return null;
    }
  }

  /**
   * Set display name
   */
  async setDisplayName(displayName: string) {
    try {
      const response = await this.fetchAPI('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update display name');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Failed to set display name:', error);
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.accessToken) {
      try {
        await this.fetchAPI('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.accessToken = null;
    this.userId = null;
    this.rooms = [];
    this.invitations = [];
  }

  /**
   * Get user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Check if logged in
   */
  isLoggedIn() {
    return this.accessToken !== null && this.socket !== null;
  }
}

// Singleton instance
export const customChatClient = new CustomChatClient();
