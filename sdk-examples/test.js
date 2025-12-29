const MatrixClient = require("./MatrixClient");

/**
 * Simple test script for Matrix SDK
 *
 * SETUP:
 * 1. Create account at https://app.element.io (it's free)
 * 2. Note your username (e.g., 'myusername') - NOT the full @myusername:matrix.org
 * 3. Update the credentials below
 * 4. Run: node test.js
 */

// ===== UPDATE THESE =====
const HOMESERVER = "https://matrix.org";
const USERNAME = "mhmadnab"; // Just the username part, not @username:matrix.org
const PASSWORD = "Moudinab004$";
// ========================

async function test() {
  console.log("🚀 Starting Matrix SDK test...\n");

  const client = new MatrixClient();

  // Test 1: Login
  console.log("📝 Test 1: Logging in...");
  try {
    await client.login(HOMESERVER, USERNAME, PASSWORD);
    console.log("✅ Login successful!\n");
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    console.log("\n💡 Tips:");
    console.log("- Create account at https://app.element.io");
    console.log("- Use just username, not @username:matrix.org");
    console.log("- Make sure password is correct\n");
    return;
  }

  // Test 2: Get existing rooms
  console.log("📝 Test 2: Getting your rooms...");
  const rooms = client.getRooms();
  console.log(`✅ Found ${rooms.length} rooms:`);
  rooms.forEach((room) => {
    console.log(
      `   - ${
        room.name || "Unnamed Room"
      } (${room.getJoinedMemberCount()} members)`
    );
  });
  console.log();

  // Test 3: Create a test room
  console.log("📝 Test 3: Creating a test room...");
  try {
    const roomId = await client.createRoom(
      "Matrix SDK Test Room",
      "Testing the Matrix SDK implementation",
      false
    );
    console.log(`✅ Room created: ${roomId}\n`);

    // Test 4: Send a message
    console.log("📝 Test 4: Sending a test message...");
    await client.sendMessage(roomId, "Hello from Matrix SDK! 🎉");
    console.log("✅ Message sent!\n");

    // Test 5: Get messages
    console.log("📝 Test 5: Retrieving messages...");
    // Wait a bit for the message to sync
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const messages = await client.getMessages(roomId, 10);
    console.log(`✅ Retrieved ${messages.length} messages:`);
    messages.forEach((msg) => {
      console.log(
        `   [${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.sender}: ${
          msg.content.body
        }`
      );
    });
    console.log();

    // Test 6: Get room members
    console.log("📝 Test 6: Getting room members...");
    const members = client.getRoomMembers(roomId);
    console.log(`✅ Found ${members.length} members:`);
    members.forEach((member) => {
      console.log(
        `   - ${member.displayName} (${member.userId}) - ${member.membership}`
      );
    });
    console.log();
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }

  // Test 7: Search public rooms
  console.log("📝 Test 7: Searching public rooms...");
  try {
    const publicRooms = await client.searchPublicRooms("matrix");
    console.log(
      `✅ Found ${publicRooms.length} public rooms (showing first 5):`
    );
    publicRooms.slice(0, 5).forEach((room) => {
      console.log(
        `   - ${room.name || room.alias} (${room.numMembers} members)`
      );
      console.log(`     ${room.topic || "No description"}`);
    });
    console.log();
  } catch (error) {
    console.error("❌ Search failed:", error.message);
  }

  // Test 8: Set up real-time message listener
  console.log("📝 Test 8: Setting up real-time message listener...");
  client.onMessage = (event, room) => {
    const sender = event.getSender();
    const content = event.getContent();
    const timestamp = new Date(event.getTs()).toLocaleTimeString();

    console.log(`\n📨 New message received!`);
    console.log(`   Room: ${room.name}`);
    console.log(`   From: ${sender}`);
    console.log(`   Message: ${content.body}`);
    console.log(`   Time: ${timestamp}\n`);
  };
  console.log("✅ Listener active!\n");

  console.log("🎉 All tests passed!");
  console.log("\n💡 The client is now running and listening for messages.");
  console.log(
    "   Try sending a message from Element web app to see real-time updates!"
  );
  console.log("   Press Ctrl+C to exit.\n");

  // Keep running to receive messages
  await new Promise(() => {}); // Run forever
}

// Run tests
test().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down...");
  process.exit(0);
});
