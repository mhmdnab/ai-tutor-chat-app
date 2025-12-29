const MatrixClient = require('./MatrixClient');
const SSOLogin = require('./sso-login');

/**
 * Test script using SSO login
 * Run: node test-sso.js
 */

async function main() {
  console.log('🚀 Matrix SDK SSO Test\n');

  // Step 1: Login with SSO
  const ssoLogin = new SSOLogin('https://matrix.org');

  let authResult;
  try {
    authResult = await ssoLogin.loginWithSSO();
  } catch (error) {
    console.error('Failed to login:', error.message);
    return;
  }

  // Step 2: Use the authenticated client
  const client = new MatrixClient();
  client.client = authResult.client;
  client.userId = authResult.userId;

  console.log('📝 Testing basic operations...\n');

  // Get rooms
  const rooms = client.getRooms();
  console.log(`✅ You have ${rooms.length} rooms:`);
  rooms.forEach(room => {
    console.log(`   - ${room.name || 'Unnamed'} (${room.getJoinedMemberCount()} members)`);
  });
  console.log();

  // Create a test room
  try {
    const roomId = await client.createRoom('SSO Test Room', 'Created via SSO login');
    console.log(`✅ Created room: ${roomId}\n`);

    // Send a message
    await client.sendMessage(roomId, 'Hello from SSO login! 🎉');
    console.log('✅ Message sent!\n');
  } catch (error) {
    console.error('Failed to create room:', error.message);
  }

  // Set up message listener
  client.onMessage = (event, room) => {
    console.log(`\n📨 New message in ${room.name}:`);
    console.log(`   From: ${event.getSender()}`);
    console.log(`   Message: ${event.getContent().body}\n`);
  };

  console.log('🎉 All done! Listening for messages...');
  console.log('💡 Press Ctrl+C to exit\n');

  // Keep running
  await new Promise(() => {});
}

main().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});
