/* eslint-disable @typescript-eslint/no-explicit-any */
import * as sdk from "matrix-js-sdk";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Clear SDK entrypoint flag to prevent errors with Next.js
if (typeof globalThis !== "undefined") {
  (globalThis as any).__js_sdk_entrypoint = undefined;
}

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
  fileUrl?: string; // MXC URL for files/images
  fileInfo?: {
    mimetype?: string;
    size?: number;
    w?: number; // width for images
    h?: number; // height for images
  };
}

export interface Member {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  membership: string;
  presence?: "online" | "offline" | "unavailable";
}

class MatrixClientManager {
  private client: sdk.MatrixClient | null = null;
  private userId: string | null = null;

  // Event handlers
  public onMessage?: (message: Message, room: Room) => void;
  public onRoomUpdate?: (rooms: Room[]) => void;
  public onTyping?: (roomId: string, users: string[]) => void;
  public onSyncState?: (state: string) => void;
  public onRoomDataUpdate?: (roomId: string) => void;

  async login(homeserverUrl: string, username: string, password: string) {
    try {
      const tempClient = sdk.createClient({ baseUrl: homeserverUrl });
      const response = await tempClient.loginWithPassword(username, password);

      this.client = sdk.createClient({
        baseUrl: homeserverUrl,
        accessToken: response.access_token,
        userId: response.user_id,
      });

      this.userId = response.user_id;

      await this.startSync();

      return {
        userId: response.user_id,
        accessToken: response.access_token,
      };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async loginWithToken(
    homeserverUrl: string,
    accessToken: string,
    userId: string
  ) {
    this.client = sdk.createClient({
      baseUrl: homeserverUrl,
      accessToken,
      userId,
    });

    this.userId = userId;
    await this.startSync();

    return { userId, accessToken };
  }

  private async startSync() {
    if (!this.client) throw new Error("Client not initialized");

    this.setupEventListeners();
    await this.client.startClient({ initialSyncLimit: 10 });

    return new Promise<void>((resolve) => {
      this.client!.once("sync" as any, (state: string) => {
        if (state === "PREPARED") {
          resolve();
        }
      });
    });
  }

  private setupEventListeners() {
    if (!this.client) return;

    this.client.on(
      "Room.timeline" as any,
      (event: any, room: any, toStartOfTimeline: boolean) => {
        if (toStartOfTimeline || !room) return;

        const eventType = event.getType();

        if (eventType === "m.room.message") {
          const content = event.getContent();

          // Check if this is an edit (has m.relates_to with rel_type "m.replace")
          if (content["m.relates_to"]?.rel_type === "m.replace") {
            // This is an edit event, trigger room data update instead of adding as new message
            this.onRoomDataUpdate?.(room.roomId);
            return;
          }

          const isEdited = !!content["m.new_content"];
          const messageContent = isEdited
            ? content["m.new_content"].body
            : content.body;

          // Extract file information if present
          const msgtype = content.msgtype || "m.text";
          const fileUrl =
            msgtype === "m.image" || msgtype === "m.file" ? content.url : undefined;
          const fileInfo =
            msgtype === "m.image" || msgtype === "m.file"
              ? content.info
              : undefined;

          // Extract mentions if present
          const mentions = content["m.mentions"]?.user_ids || [];

          const message: Message = {
            eventId: event.getId()!,
            sender: event.getSender()!,
            senderName:
              room.getMember(event.getSender()!)?.name || event.getSender()!,
            content: messageContent,
            timestamp: event.getTs(),
            type: msgtype,
            isEdited,
            isDeleted: event.isRedacted(),
            formattedContent: content.formatted_body,
            format: content.format,
            mentions,
            fileUrl,
            fileInfo,
          };

          console.log("onMessage: New message received", { type: msgtype, fileUrl, hasFileInfo: !!fileInfo });

          const roomData = this.formatRoom(room);
          this.onMessage?.(message, roomData);
        } else if (eventType === "m.reaction") {
          // Reaction added, trigger room data update
          this.onRoomDataUpdate?.(room.roomId);
        }
      }
    );

    // Listen for message deletions/redactions
    this.client.on("Room.redaction" as any, (event: any, room: any) => {
      if (!room) return;
      // Message deleted, trigger room data update
      this.onRoomDataUpdate?.(room.roomId);
    });

    this.client.on("Room.typingUpdate" as any, (event: any, room: any) => {
      if (!room) return;
      const typingUsers = room.getTypingUsers().map((u: any) => u.userId);
      this.onTyping?.(room.roomId, typingUsers);
    });

    this.client.on("sync" as any, (state: string) => {
      this.onSyncState?.(state);
      if (state === "PREPARED") {
        this.onRoomUpdate?.(this.getRooms());
      }
    });

    this.client.on("Room" as any, () => {
      this.onRoomUpdate?.(this.getRooms());
    });
  }

  private formatRoom(room: sdk.Room): Room {
    // Check if this room is a DM
    const isDirect = this.client
      ?.getAccountData("m.direct" as any)
      ?.getContent();
    let isDirectRoom = false;

    if (isDirect) {
      // m.direct maps user IDs to arrays of room IDs
      for (const userId in isDirect) {
        if (isDirect[userId].includes(room.roomId)) {
          isDirectRoom = true;
          break;
        }
      }
    }

    // For DM rooms, use the other user's name instead of room name
    let roomName = room.name || "Unnamed Room";
    if (isDirectRoom && room.getJoinedMemberCount() === 2) {
      const members = room.getJoinedMembers();
      const otherMember = members.find((m) => m.userId !== this.userId);
      if (otherMember) {
        roomName = otherMember.name || otherMember.userId;
      }
    }

    return {
      roomId: room.roomId,
      name: roomName,
      topic: room.currentState.getStateEvents("m.room.topic", "")?.getContent()
        .topic,
      memberCount: room.getJoinedMemberCount(),
      unreadCount: room.getUnreadNotificationCount(),
      avatarUrl: room.getMxcAvatarUrl() || undefined,
      isDirect: isDirectRoom,
    };
  }

  getRooms(): Room[] {
    if (!this.client) return [];
    return this.client.getRooms().map((room) => this.formatRoom(room));
  }

  getRoom(roomId: string): Room | null {
    if (!this.client) return null;
    const room = this.client.getRoom(roomId);
    if (!room) return null;
    return this.formatRoom(room);
  }

  async getMessages(roomId: string, limit = 50): Promise<Message[]> {
    if (!this.client) return [];

    const room = this.client.getRoom(roomId);
    if (!room) return [];

    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();

    // Get all message events
    const messageEvents = events
      .filter((event) => event.getType() === "m.room.message")
      .slice(-limit);

    // Process each message to include reactions and edits
    return messageEvents.map((event) => {
      const eventId = event.getId()!;
      const content = event.getContent();

      // Check if this is an edit - use new content if available
      const isEdited = !!content["m.new_content"];
      const messageContent = isEdited
        ? content["m.new_content"].body
        : content.body;

      // For edited messages, reactions should target the original event
      // Check if this is an edit event and get the original event ID
      const originalEventId = content["m.relates_to"]?.event_id || eventId;

      // Get reactions for the original event (not the edit event)
      const relations = room.relations?.getChildEventsForEvent(
        originalEventId,
        "m.annotation" as any,
        "m.reaction"
      );

      const reactions: any = {};
      if (relations) {
        relations.getRelations().forEach((reactionEvent: any) => {
          const emoji = reactionEvent.getContent()["m.relates_to"]?.key;
          const sender = reactionEvent.getSender();
          if (emoji && sender) {
            if (!reactions[emoji]) {
              reactions[emoji] = { key: emoji, count: 0, users: [] };
            }
            reactions[emoji].count++;
            reactions[emoji].users.push(sender);
          }
        });
      }

      // Extract mentions if present
      const mentions = content["m.mentions"]?.user_ids || [];

      // Extract file information if present
      const msgtype = content.msgtype || "m.text";

      // Debug logging for file messages
      if (msgtype === "m.image" || msgtype === "m.file") {
        console.log("getMessages: Found file/image message", {
          msgtype,
          hasUrl: !!content.url,
          url: content.url,
          hasInfo: !!content.info,
          eventId
        });
      }

      const fileUrl =
        msgtype === "m.image" || msgtype === "m.file" ? content.url : undefined;
      const fileInfo =
        msgtype === "m.image" || msgtype === "m.file"
          ? content.info
          : undefined;

      return {
        eventId: originalEventId, // Use original event ID for reactions
        sender: event.getSender()!,
        senderName:
          room.getMember(event.getSender()!)?.name || event.getSender()!,
        content: messageContent,
        timestamp: event.getTs(),
        type: msgtype,
        reactions: Object.values(reactions),
        isEdited,
        isDeleted: event.isRedacted(),
        formattedContent: content.formatted_body,
        format: content.format,
        mentions,
        fileUrl,
        fileInfo,
      };
    });
  }

  getRoomMembers(roomId: string): Member[] {
    if (!this.client) return [];

    const room = this.client.getRoom(roomId);
    if (!room) return [];

    return room
      .getMembers()
      .filter((m) => m.membership === "join")
      .map((member) => ({
        userId: member.userId,
        displayName: member.name || member.userId,
        avatarUrl: member.getMxcAvatarUrl() || undefined,
        membership: member.membership || "join",
      }));
  }

  async createRoom(
    name: string,
    topic = "",
    isPublic = false
  ): Promise<string> {
    if (!this.client) throw new Error("Client not initialized");

    const response = await this.client.createRoom({
      name,
      topic,
      visibility: (isPublic ? "public" : "private") as any,
      preset: (isPublic ? "public_chat" : "private_chat") as any,
    });

    return response.room_id;
  }

  async createDirectMessage(userId: string): Promise<string> {
    if (!this.client) throw new Error("Client not initialized");

    // Create a private room for direct messaging
    const response = await this.client.createRoom({
      visibility: "private" as any,
      preset: "trusted_private_chat" as any,
      is_direct: true,
      invite: [userId],
    });

    const roomId = response.room_id;

    // Update m.direct account data to mark this as a DM
    const directEvent = this.client.getAccountData("m.direct" as any);
    const directContent = directEvent?.getContent() || {};

    if (!directContent[userId]) {
      directContent[userId] = [];
    }
    directContent[userId].push(roomId);

    await this.client.setAccountData("m.direct" as any, directContent as any);

    return roomId;
  }

  async joinRoom(roomIdOrAlias: string): Promise<string> {
    if (!this.client) throw new Error("Client not initialized");

    const response = await this.client.joinRoom(roomIdOrAlias);
    return response.roomId;
  }

  // Helper to parse mentions from message content
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
          `<a href="https://matrix.to/#/${member.userId}" class="mention text-indigo-400 bg-indigo-900/30 px-1 rounded font-semibold hover:bg-indigo-900/50">@${member.displayName}</a>`
        );
      }
    }

    return { userIds, formattedHtml };
  }

  async sendMessage(roomId: string, message: string, useMarkdown = true) {
    if (!this.client) throw new Error("Client not initialized");

    const room = this.client.getRoom(roomId);
    if (!room) throw new Error("Room not found");

    const members = this.getRoomMembers(roomId);
    const { userIds, formattedHtml } = this.parseMentions(message, members);

    const event: any = {
      msgtype: "m.text",
      body: message,
    };

    // Add mentions if any users were mentioned
    if (userIds.length > 0) {
      event["m.mentions"] = { user_ids: userIds };
    }

    // Add formatting (markdown + mentions)
    if (useMarkdown || userIds.length > 0) {
      let html = formattedHtml;

      // Apply markdown formatting if enabled and message contains markdown syntax
      if (
        useMarkdown &&
        (message.includes("**") ||
          message.includes("*") ||
          message.includes("`") ||
          message.includes("[") ||
          message.includes("#"))
      ) {
        html = await marked.parse(formattedHtml, { async: true });
      }

      event.formatted_body = DOMPurify.sanitize(html);
      event.format = "org.matrix.custom.html";
    }

    await this.client.sendEvent(roomId, "m.room.message" as any, event);
  }

  async sendTyping(roomId: string, isTyping: boolean) {
    if (!this.client) return;
    await this.client.sendTyping(roomId, isTyping, isTyping ? 30000 : 0);
  }

  async uploadFile(file: File): Promise<string> {
    if (!this.client) throw new Error("Client not initialized");

    try {
      // Upload the file to Matrix media repository
      const response = await this.client.uploadContent(file, {
        name: file.name,
        type: file.type,
      });

      console.log("uploadFile: Upload response:", JSON.stringify(response, null, 2));
      console.log("uploadFile: Response type:", typeof response);
      console.log("uploadFile: Response keys:", Object.keys(response));

      // Return the MXC URL
      const mxcUrl = response.content_uri;
      console.log("uploadFile: Extracted MXC URL:", mxcUrl);
      console.log("uploadFile: MXC URL type:", typeof mxcUrl);

      if (!mxcUrl) {
        throw new Error("Upload response missing content_uri");
      }

      return mxcUrl;
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
  }

  async sendFile(roomId: string, file: File, mxcUrl: string) {
    if (!this.client) throw new Error("Client not initialized");

    const isImage = file.type.startsWith("image/");
    console.log("sendFile: Sending file", { fileName: file.name, fileType: file.type, isImage, mxcUrl });

    const event: any = {
      msgtype: isImage ? "m.image" : "m.file",
      body: file.name,
      url: mxcUrl,
      info: {
        mimetype: file.type,
        size: file.size,
      },
    };

    console.log("sendFile: Event object before sending:", JSON.stringify(event, null, 2));

    // Add image-specific info
    if (isImage) {
      // Create image preview
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve) => {
        img.onload = () => {
          event.info.w = img.width;
          event.info.h = img.height;
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

    console.log("sendFile: Final event to send:", JSON.stringify(event, null, 2));
    const result = await this.client.sendEvent(roomId, "m.room.message" as any, event);
    console.log("sendFile: Event sent successfully, result:", result);
  }

  getMediaUrl(mxcUrl: string): string {
    if (!this.client) return "";

    // Get the HTTP URL for the media
    const httpUrl = this.client.mxcUrlToHttp(mxcUrl);
    if (!httpUrl) return "";

    // For authenticated media access, append the access token as a query parameter
    const accessToken = this.client.getAccessToken();
    if (accessToken) {
      const separator = httpUrl.includes("?") ? "&" : "?";
      return `${httpUrl}${separator}access_token=${accessToken}`;
    }

    return httpUrl;
  }

  // Fetch media with proper authentication to avoid CORS issues
  async fetchAuthenticatedMedia(mxcUrl: string): Promise<string> {
    if (!this.client) {
      console.error("fetchAuthenticatedMedia: Client not initialized");
      return "";
    }

    console.log("fetchAuthenticatedMedia: MXC URL:", mxcUrl);

    // Parse MXC URL: mxc://serverName/mediaId
    const mxcMatch = mxcUrl.match(/^mxc:\/\/([^/]+)\/(.+)$/);
    if (!mxcMatch) {
      console.error("fetchAuthenticatedMedia: Invalid MXC URL format");
      return "";
    }

    const [, serverName, mediaId] = mxcMatch;
    const baseUrl = this.client.getHomeserverUrl();

    // Try authenticated media endpoint first (MSC3916)
    // https://spec.matrix.org/v1.11/client-server-api/#get_matrixclientv1mediadownloadservernamemediaid
    const authenticatedUrl = `${baseUrl}/_matrix/client/v1/media/download/${serverName}/${mediaId}`;

    console.log("fetchAuthenticatedMedia: Trying authenticated endpoint:", authenticatedUrl);

    try {
      const accessToken = this.client.getAccessToken();
      console.log("fetchAuthenticatedMedia: Has access token:", !!accessToken);

      if (!accessToken) {
        console.error("fetchAuthenticatedMedia: No access token available");
        return "";
      }

      let response = await fetch(authenticatedUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("fetchAuthenticatedMedia: Authenticated endpoint response:", response.status);

      // If authenticated endpoint fails with 404 or 400, try legacy endpoint
      if (!response.ok && (response.status === 404 || response.status === 400 || response.status === 404)) {
        const legacyUrl = this.client.mxcUrlToHttp(mxcUrl);
        if (legacyUrl) {
          console.log("fetchAuthenticatedMedia: Trying legacy endpoint:", legacyUrl);
          response = await fetch(legacyUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          console.log("fetchAuthenticatedMedia: Legacy endpoint response:", response.status);
        }
      }

      if (!response.ok) {
        // Handle different error types
        if (response.status === 404) {
          console.warn(`Media not found (404). This might mean the media hasn't propagated yet or was never uploaded.`);
          return "";
        }
        console.error(`Failed to fetch media (${response.status}): ${response.statusText}`);
        return "";
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      console.log("fetchAuthenticatedMedia: Created blob URL successfully");
      return blobUrl;
    } catch (error) {
      console.error("Failed to fetch authenticated media:", error);
      return "";
    }
  }

  async sendReaction(roomId: string, eventId: string, emoji: string) {
    if (!this.client) throw new Error("Client not initialized");

    await this.client.sendEvent(roomId, "m.reaction" as any, {
      "m.relates_to": {
        rel_type: "m.annotation",
        event_id: eventId,
        key: emoji,
      },
    });
  }

  async removeReaction(roomId: string, eventId: string, emoji: string) {
    if (!this.client) throw new Error("Client not initialized");

    const room = this.client.getRoom(roomId);
    if (!room) return;

    // Find the reaction event to redact
    const relations = room.relations.getChildEventsForEvent(
      eventId,
      "m.annotation" as any,
      "m.reaction"
    );

    const myUserId = this.userId;
    const reactionEvent = relations?.getRelations().find((event: any) => {
      return (
        event.getSender() === myUserId &&
        event.getContent()["m.relates_to"]?.key === emoji
      );
    });

    if (reactionEvent) {
      await this.client.redactEvent(roomId, reactionEvent.getId()!);
    }
  }

  async editMessage(roomId: string, eventId: string, newContent: string) {
    if (!this.client) throw new Error("Client not initialized");

    await this.client.sendEvent(roomId, "m.room.message" as any, {
      body: `* ${newContent}`,
      msgtype: "m.text",
      "m.new_content": {
        body: newContent,
        msgtype: "m.text",
      },
      "m.relates_to": {
        rel_type: "m.replace",
        event_id: eventId,
      },
    });
  }

  async deleteMessage(roomId: string, eventId: string) {
    if (!this.client) throw new Error("Client not initialized");

    await this.client.redactEvent(roomId, eventId);
  }

  async getDisplayName(): Promise<string | null> {
    if (!this.client || !this.userId) return null;

    try {
      const profile = await this.client.getProfileInfo(this.userId);
      return profile.displayname || null;
    } catch (error) {
      console.error("Failed to get display name:", error);
      return null;
    }
  }

  async setDisplayName(displayName: string) {
    if (!this.client) throw new Error("Client not initialized");

    await this.client.setDisplayName(displayName);
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.client.stopClient();
      this.client = null;
      this.userId = null;
    }
  }

  getUserId() {
    return this.userId;
  }

  isLoggedIn() {
    return this.client !== null;
  }
}

// Singleton instance
export const matrixClient = new MatrixClientManager();
