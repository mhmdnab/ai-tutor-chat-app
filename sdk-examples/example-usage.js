const MatrixClient = require('./MatrixClient');

/**
 * Example usage of the MatrixClient for a Discord-like application
 */

async function main() {
  const client = new MatrixClient();

  // Example 1: Login
  try {
    await client.login(
      'https://matrix.org', // Use your homeserver URL
      'your-username',
      'your-password'
    );
  } catch (error) {
    console.error('Login failed:', error);
    return;
  }

  // Example 2: Create a room (like a Discord channel)
  const roomId = await client.createRoom(
    'General Chat',
    'A general discussion channel',
    false // private room
  );

  // Example 3: Send a message
  await client.sendMessage(roomId, 'Hello, Discord-like world!');

  // Example 4: Override event handlers for custom behavior
  client.onMessage = (event, room) => {
    const sender = event.getSender();
    const content = event.getContent();
    const timestamp = new Date(event.getTs());

    // Display message in your UI
    console.log({
      roomId: room.roomId,
      roomName: room.name,
      sender: sender,
      message: content.body,
      timestamp: timestamp,
      messageType: content.msgtype,
    });
  };

  client.onTypingUpdate = (room, typingUsers) => {
    // Update typing indicator in your UI
    console.log('Typing in', room.name, ':', typingUsers);
  };

  // Example 5: Get all rooms (like Discord servers/channels)
  const rooms = client.getRooms();
  console.log('Your rooms:');
  rooms.forEach(room => {
    console.log(`- ${room.name} (${room.roomId})`);
    console.log(`  Members: ${room.getJoinedMemberCount()}`);
    console.log(`  Unread: ${room.getUnreadNotificationCount()}`);
  });

  // Example 6: Get messages from a room
  const messages = await client.getMessages(roomId, 50);
  console.log('Recent messages:', messages);

  // Example 7: Get room members
  const members = client.getRoomMembers(roomId);
  console.log('Room members:', members);

  // Example 8: Send typing indicator
  await client.sendTypingIndicator(roomId, true);
  setTimeout(() => {
    client.sendTypingIndicator(roomId, false);
  }, 3000);

  // Example 9: Invite someone to a room
  // await client.inviteUser(roomId, '@friend:matrix.org');

  // Example 10: Join a public room
  // await client.joinRoom('#public-room:matrix.org');

  // Example 11: Search for public rooms
  const publicRooms = await client.searchPublicRooms('gaming');
  console.log('Public gaming rooms:', publicRooms);

  // Example 12: Set presence
  await client.setPresence('online', 'Building something cool!');

  // Keep the script running to receive messages
  console.log('Client is running. Press Ctrl+C to exit.');
}

// Run the example
main().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  process.exit(0);
});
