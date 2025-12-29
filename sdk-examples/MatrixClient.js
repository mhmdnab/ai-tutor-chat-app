const sdk = require('matrix-js-sdk');

/**
 * MatrixClient wrapper for Discord-like functionality
 * This class handles authentication, room management, and messaging
 */
class MatrixClient {
  constructor() {
    this.client = null;
    this.userId = null;
  }

  /**
   * Initialize and login to Matrix homeserver
   * @param {string} homeserverUrl - URL of the Matrix homeserver (e.g., 'https://matrix.org')
   * @param {string} username - Username for login
   * @param {string} password - Password for login
   */
  async login(homeserverUrl, username, password) {
    try {
      // Create a temporary client for login
      const tempClient = sdk.createClient({ baseUrl: homeserverUrl });

      // Login and get access token
      const response = await tempClient.loginWithPassword(username, password);

      // Create authenticated client
      this.client = sdk.createClient({
        baseUrl: homeserverUrl,
        accessToken: response.access_token,
        userId: response.user_id,
      });

      this.userId = response.user_id;

      // Start syncing with the server
      await this.startSync();

      console.log(`Logged in as ${this.userId}`);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Login using existing access token (useful for SSO or saved sessions)
   * @param {string} homeserverUrl - URL of the Matrix homeserver
   * @param {string} accessToken - Access token from previous login
   * @param {string} userId - User ID
   */
  async loginWithToken(homeserverUrl, accessToken, userId) {
    try {
      this.client = sdk.createClient({
        baseUrl: homeserverUrl,
        accessToken: accessToken,
        userId: userId,
      });

      this.userId = userId;

      // Start syncing with the server
      await this.startSync();

      console.log(`Logged in as ${this.userId}`);
      return { userId, accessToken };
    } catch (error) {
      console.error('Token login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {string} homeserverUrl - URL of the Matrix homeserver
   * @param {string} username - Desired username
   * @param {string} password - Password
   */
  async register(homeserverUrl, username, password) {
    try {
      const tempClient = sdk.createClient({ baseUrl: homeserverUrl });

      const response = await tempClient.register(username, password);

      // Auto-login after registration
      await this.login(homeserverUrl, username, password);

      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Start syncing with the server to receive real-time updates
   */
  async startSync() {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    // Set up event listeners before starting sync
    this.setupEventListeners();

    // Start the client sync
    await this.client.startClient({ initialSyncLimit: 10 });

    return new Promise((resolve) => {
      this.client.once('sync', (state) => {
        if (state === 'PREPARED') {
          console.log('Client synced and ready');
          resolve();
        }
      });
    });
  }

  /**
   * Set up event listeners for real-time updates
   */
  setupEventListeners() {
    // New message received
    this.client.on('Room.timeline', (event, room, toStartOfTimeline) => {
      if (toStartOfTimeline) return; // Ignore paginated events

      if (event.getType() === 'm.room.message') {
        this.onMessage(event, room);
      }
    });

    // User typing indicator
    this.client.on('Room.typingUpdate', (event, room) => {
      const typingUsers = room.getTypingUsers();
      this.onTypingUpdate(room, typingUsers);
    });

    // Room membership changes (user joined/left)
    this.client.on('RoomMember.membership', (event, member) => {
      this.onMembershipChange(member);
    });

    // Sync state changes
    this.client.on('sync', (state, prevState, data) => {
      console.log(`Sync state: ${state}`);
    });
  }

  /**
   * Create a new room (like a Discord channel or server)
   * @param {string} name - Room name
   * @param {string} topic - Room description/topic
   * @param {boolean} isPublic - Whether the room is public
   */
  async createRoom(name, topic = '', isPublic = false) {
    try {
      const options = {
        name: name,
        topic: topic,
        visibility: isPublic ? 'public' : 'private',
        preset: isPublic ? 'public_chat' : 'private_chat',
      };

      const response = await this.client.createRoom(options);
      console.log(`Room created: ${response.room_id}`);
      return response.room_id;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Join a room by ID or alias
   * @param {string} roomIdOrAlias - Room ID (!xxx:server) or alias (#xxx:server)
   */
  async joinRoom(roomIdOrAlias) {
    try {
      const response = await this.client.joinRoom(roomIdOrAlias);
      console.log(`Joined room: ${response.roomId}`);
      return response.roomId;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   */
  async leaveRoom(roomId) {
    try {
      await this.client.leave(roomId);
      console.log(`Left room: ${roomId}`);
    } catch (error) {
      console.error('Failed to leave room:', error);
      throw error;
    }
  }

  /**
   * Send a text message to a room
   * @param {string} roomId - Room ID
   * @param {string} message - Message text
   */
  async sendMessage(roomId, message) {
    try {
      const content = {
        msgtype: 'm.text',
        body: message,
      };

      const response = await this.client.sendEvent(roomId, 'm.room.message', content);
      return response.event_id;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send an image/file to a room
   * @param {string} roomId - Room ID
   * @param {string} url - URL of the uploaded content
   * @param {string} filename - Original filename
   * @param {string} mimetype - MIME type
   */
  async sendFile(roomId, url, filename, mimetype) {
    try {
      const content = {
        msgtype: 'm.file',
        body: filename,
        url: url,
        info: {
          mimetype: mimetype,
        },
      };

      const response = await this.client.sendEvent(roomId, 'm.room.message', content);
      return response.event_id;
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   * @param {string} roomId - Room ID
   * @param {boolean} isTyping - Whether user is typing
   */
  async sendTypingIndicator(roomId, isTyping) {
    try {
      await this.client.sendTyping(roomId, isTyping, isTyping ? 30000 : 0);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }

  /**
   * Get all rooms the user is in
   */
  getRooms() {
    if (!this.client) return [];
    return this.client.getRooms();
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   */
  getRoom(roomId) {
    return this.client.getRoom(roomId);
  }

  /**
   * Get messages from a room
   * @param {string} roomId - Room ID
   * @param {number} limit - Number of messages to fetch
   */
  async getMessages(roomId, limit = 50) {
    const room = this.getRoom(roomId);
    if (!room) return [];

    // Get timeline events
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();

    // Filter for message events
    return events
      .filter(event => event.getType() === 'm.room.message')
      .slice(-limit)
      .map(event => ({
        eventId: event.getId(),
        sender: event.getSender(),
        content: event.getContent(),
        timestamp: event.getTs(),
        type: event.getContent().msgtype,
      }));
  }

  /**
   * Get members of a room
   * @param {string} roomId - Room ID
   */
  getRoomMembers(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return [];

    return room.getMembers().map(member => ({
      userId: member.userId,
      displayName: member.name,
      avatarUrl: member.getAvatarUrl(this.client.baseUrl, 64, 64, 'scale'),
      membership: member.membership,
    }));
  }

  /**
   * Invite user to a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to invite
   */
  async inviteUser(roomId, userId) {
    try {
      await this.client.invite(roomId, userId);
      console.log(`Invited ${userId} to ${roomId}`);
    } catch (error) {
      console.error('Failed to invite user:', error);
      throw error;
    }
  }

  /**
   * Search for public rooms
   * @param {string} searchTerm - Search term (optional)
   */
  async searchPublicRooms(searchTerm = '') {
    try {
      const response = await this.client.publicRooms({
        filter: {
          generic_search_term: searchTerm,
        },
      });

      return response.chunk.map(room => ({
        roomId: room.room_id,
        name: room.name,
        topic: room.topic,
        numMembers: room.num_joined_members,
        avatarUrl: room.avatar_url,
        alias: room.canonical_alias,
      }));
    } catch (error) {
      console.error('Failed to search rooms:', error);
      throw error;
    }
  }

  /**
   * Set user presence
   * @param {string} presence - 'online', 'offline', or 'unavailable'
   * @param {string} statusMsg - Status message
   */
  async setPresence(presence, statusMsg = '') {
    try {
      await this.client.setPresence({
        presence: presence,
        status_msg: statusMsg,
      });
    } catch (error) {
      console.error('Failed to set presence:', error);
    }
  }

  /**
   * Logout and stop the client
   */
  async logout() {
    if (this.client) {
      await this.client.logout();
      this.client.stopClient();
      this.client = null;
      this.userId = null;
      console.log('Logged out');
    }
  }

  // Event handlers (override these in your implementation)
  onMessage(event, room) {
    const sender = event.getSender();
    const content = event.getContent();
    console.log(`[${room.name}] ${sender}: ${content.body}`);
  }

  onTypingUpdate(room, typingUsers) {
    if (typingUsers.length > 0) {
      const names = typingUsers.map(u => u.name || u.userId).join(', ');
      console.log(`${names} is typing in ${room.name}`);
    }
  }

  onMembershipChange(member) {
    console.log(`${member.userId} membership changed to ${member.membership}`);
  }
}

module.exports = MatrixClient;
