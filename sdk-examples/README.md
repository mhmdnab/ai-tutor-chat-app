# Matrix SDK Discord-like Platform Implementation

This guide shows you how to use the Matrix JS SDK to build a Discord-like platform.

## Installation

```bash
npm install matrix-js-sdk
```

## Quick Start

```javascript
const MatrixClient = require("./MatrixClient");

const client = new MatrixClient();

// Login
await client.login("https://matrix.org", "username", "password");

// Create a room (channel)
const roomId = await client.createRoom(
  "General Chat",
  "Main discussion",
  false
);

// Send a message
await client.sendMessage(roomId, "Hello world!");

// Get rooms
const rooms = client.getRooms();
```

## Key Features

### 1. Authentication

- **Login**: Connect existing users to your homeserver
- **Register**: Create new user accounts
- **Logout**: Clean disconnect

### 2. Rooms (Discord Channels/Servers)

- **Create rooms**: Public or private channels
- **Join rooms**: By ID or alias
- **Leave rooms**: Exit channels
- **Room hierarchy**: You can create spaces (like Discord servers) containing multiple rooms (channels)

### 3. Messaging

- **Text messages**: Send and receive text
- **Files/Images**: Upload and share media
- **Message history**: Fetch previous messages
- **Real-time sync**: Instant message delivery

### 4. User Features

- **Typing indicators**: Show when users are typing
- **Presence**: Online/offline/away status
- **User profiles**: Display names and avatars
- **Member lists**: See who's in a room

### 5. Room Management

- **Invitations**: Invite users to rooms
- **Permissions**: Control who can do what
- **Room search**: Find public rooms
- **Room metadata**: Names, topics, avatars

## Discord-like Features Mapping

| Discord Feature  | Matrix Equivalent                     |
| ---------------- | ------------------------------------- |
| Server           | Space (room with child rooms)         |
| Channel          | Room                                  |
| Text Message     | m.room.message (m.text)               |
| Image/File       | m.room.message (m.file/m.image)       |
| DM               | Direct message room                   |
| Thread           | Thread relation in events             |
| Reaction         | m.reaction event                      |
| Edit Message     | m.replace relation                    |
| Delete Message   | m.room.redaction                      |
| User Status      | Presence (online/offline/unavailable) |
| Typing Indicator | m.typing                              |

## Architecture for Discord-like App

```
1. Backend/Client Layer
   - MatrixClient class handles all SDK interactions
   - Manages authentication and connection state

2. Real-time Event Layer
   - Listen to Room.timeline for new messages
   - Listen to Room.typingUpdate for typing indicators
   - Listen to RoomMember.membership for user joins/leaves

3. UI Layer (Your Frontend)
   - Display rooms list (like Discord sidebar)
   - Display messages in selected room
   - Show user list for current room
   - Input for sending messages

4. State Management
   - Keep track of current room
   - Store messages per room
   - Track user presence
   - Handle unread counts
```

## Advanced Features

### Creating Spaces (Discord Servers)

```javascript
const spaceId = await client.client.createRoom({
  name: "My Gaming Server",
  topic: "A space for gaming discussion",
  creation_content: {
    type: "m.space",
  },
  power_level_content_override: {
    events: {
      "m.space.child": 100, // Only admins can add rooms
    },
  },
});

// Add a room to the space
await client.client.sendStateEvent(
  spaceId,
  "m.space.child",
  {
    via: ["matrix.org"],
  },
  channelRoomId
);
```

### Message Reactions

```javascript
// React to a message
await client.client.sendEvent(roomId, "m.reaction", {
  "m.relates_to": {
    rel_type: "m.annotation",
    event_id: messageEventId,
    key: "👍", // emoji
  },
});
```

### Edit Messages

```javascript
await client.client.sendEvent(roomId, "m.room.message", {
  msgtype: "m.text",
  body: "* Updated message",
  "m.new_content": {
    msgtype: "m.text",
    body: "Updated message",
  },
  "m.relates_to": {
    rel_type: "m.replace",
    event_id: originalEventId,
  },
});
```

### Delete Messages (Redact)

```javascript
await client.client.redactEvent(roomId, eventId, null, {
  reason: "Inappropriate content",
});
```

### Threads

```javascript
// Reply in a thread
await client.client.sendEvent(roomId, "m.room.message", {
  msgtype: "m.text",
  body: "Thread reply",
  "m.relates_to": {
    rel_type: "m.thread",
    event_id: parentMessageId,
  },
});
```

## Setup Your Own Homeserver

For production, you'll want your own Matrix homeserver:

1. **Synapse** (Official Python implementation)

   ```bash
   # Using Docker
   docker run -d --name synapse \
     -v /path/to/data:/data \
     -p 8008:8008 \
     matrixdotorg/synapse:latest
   ```

2. **Dendrite** (Lightweight Go implementation)
3. **Conduit** (Rust implementation)

## Best Practices

1. **Handle sync state**: Wait for 'PREPARED' state before allowing user interactions
2. **Pagination**: Load messages incrementally to avoid memory issues
3. **Error handling**: Network issues are common, implement retry logic
4. **Rate limiting**: Respect homeserver rate limits
5. **Encryption**: Enable E2EE for private rooms (requires additional setup)
6. **Caching**: Cache room state and messages locally

## UI Integration Example (React/Vue/etc.)

```javascript
// In your UI component
useEffect(() => {
  const matrixClient = new MatrixClient();

  // Custom event handlers
  matrixClient.onMessage = (event, room) => {
    // Update your UI state
    setMessages((prev) => [
      ...prev,
      {
        id: event.getId(),
        sender: event.getSender(),
        text: event.getContent().body,
        timestamp: event.getTs(),
      },
    ]);
  };

  // Login and start
  matrixClient.login(homeserver, username, password);

  return () => {
    matrixClient.logout();
  };
}, []);
```

## Resources

- [Matrix JS SDK Documentation](https://matrix-org.github.io/matrix-js-sdk/)
- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [Matrix Protocol Overview](https://matrix.org/docs/guides/)

## Common Issues

**Issue**: Messages not appearing in real-time

- **Solution**: Ensure `startClient()` is called and sync state is 'PREPARED'

**Issue**: Can't join rooms

- **Solution**: Check room visibility and user permissions

**Issue**: High memory usage

- **Solution**: Implement message pagination and limit `initialSyncLimit`

**Issue**: Authentication fails

- **Solution**: Verify homeserver URL (include http:// or https://)
