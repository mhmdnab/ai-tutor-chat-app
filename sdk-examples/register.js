const MatrixClient = require('./MatrixClient');

/**
 * Register a new Matrix account
 * Run: node register.js
 */

async function register() {
  const client = new MatrixClient();

  // Generate a random username
  const username = `testuser_${Date.now()}`;
  const password = 'TestPassword123!';

  console.log('🚀 Registering new Matrix account...\n');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Homeserver: https://matrix.org\n`);

  try {
    await client.register('https://matrix.org', username, password);

    console.log('✅ Registration successful!\n');
    console.log('📝 Save these credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Full ID: @${username}:matrix.org\n`);

    console.log('💡 Update test.js with:');
    console.log(`   const USERNAME = '${username}';`);
    console.log(`   const PASSWORD = '${password}';\n`);

    // Test by creating a room
    const roomId = await client.createRoom('My First Room', 'Created by registration test');
    console.log(`✅ Created test room: ${roomId}\n`);

    await client.sendMessage(roomId, 'Hello from my new account!');
    console.log('✅ Sent test message!\n');

    console.log('🎉 All done! You can now use this account for testing.');

    await client.logout();
    process.exit(0);

  } catch (error) {
    console.error('❌ Registration failed:', error.message);

    if (error.message.includes('M_USER_IN_USE')) {
      console.log('\n💡 Username already taken. Run script again to try another username.');
    } else if (error.message.includes('M_FORBIDDEN')) {
      console.log('\n💡 matrix.org may have disabled open registration.');
      console.log('   Option 1: Create account manually at https://app.element.io');
      console.log('   Option 2: Run your own homeserver (see README.md)');
    }

    process.exit(1);
  }
}

register();
