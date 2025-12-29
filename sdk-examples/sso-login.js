const sdk = require('matrix-js-sdk');
const http = require('http');
const { URL } = require('url');

/**
 * SSO/Google Login for Matrix
 *
 * This handles OAuth login (Google, GitHub, etc.) for Matrix homeservers
 * that support SSO authentication.
 */

class SSOLogin {
  constructor(homeserverUrl) {
    this.homeserverUrl = homeserverUrl;
    this.client = null;
  }

  /**
   * Login using SSO (Google, GitHub, etc.)
   * This will open a browser for authentication
   */
  async loginWithSSO() {
    console.log('🔐 Starting SSO login...\n');

    // Create a temporary client to check SSO availability
    const tempClient = sdk.createClient({ baseUrl: this.homeserverUrl });

    try {
      // Check if SSO is supported
      const loginFlows = await tempClient.loginFlows();
      const ssoFlow = loginFlows.flows.find(flow => flow.type === 'm.login.sso');

      if (!ssoFlow) {
        throw new Error('SSO not supported on this homeserver');
      }

      console.log('✅ SSO is supported on this homeserver\n');

      // Get list of SSO providers (Google, GitHub, etc.)
      const identityProviders = ssoFlow.identity_providers || [];

      if (identityProviders.length > 0) {
        console.log('📋 Available SSO providers:');
        identityProviders.forEach((provider, index) => {
          console.log(`   ${index + 1}. ${provider.name} (${provider.brand || provider.id})`);
        });
        console.log();
      }

      // Start local callback server
      const { loginToken, server } = await this.startCallbackServer();

      // Generate SSO URL
      const redirectUrl = 'http://localhost:3000/callback';
      let ssoUrl;

      if (identityProviders.length > 0) {
        // Use specific provider (e.g., Google)
        const googleProvider = identityProviders.find(
          p => p.brand === 'google' || p.id === 'google'
        );

        if (googleProvider) {
          ssoUrl = `${this.homeserverUrl}/_matrix/client/v3/login/sso/redirect/${googleProvider.id}?redirectUrl=${encodeURIComponent(redirectUrl)}`;
          console.log('🔗 Using Google SSO provider\n');
        } else {
          // Fallback to generic SSO
          ssoUrl = `${this.homeserverUrl}/_matrix/client/v3/login/sso/redirect?redirectUrl=${encodeURIComponent(redirectUrl)}`;
        }
      } else {
        // Generic SSO URL
        ssoUrl = `${this.homeserverUrl}/_matrix/client/v3/login/sso/redirect?redirectUrl=${encodeURIComponent(redirectUrl)}`;
      }

      console.log('🌐 Please open this URL in your browser to login:\n');
      console.log(`   ${ssoUrl}\n`);
      console.log('💡 Or run this command:');
      console.log(`   open "${ssoUrl}"\n`);
      console.log('⏳ Waiting for authentication...\n');

      // Auto-open browser (works on macOS, Linux, Windows)
      const { exec } = require('child_process');
      const openCommand = process.platform === 'darwin' ? 'open' :
                         process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${openCommand} "${ssoUrl}"`);

      // Wait for callback
      const token = await loginToken;
      server.close();

      console.log('✅ Authentication successful!\n');

      // Complete login with the token
      return await this.completeLogin(token);

    } catch (error) {
      console.error('❌ SSO login failed:', error.message);
      throw error;
    }
  }

  /**
   * Start a local HTTP server to receive the SSO callback
   */
  startCallbackServer() {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost:3000');

        if (url.pathname === '/callback') {
          const loginToken = url.searchParams.get('loginToken');

          if (loginToken) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                  <h1>✅ Authentication Successful!</h1>
                  <p>You can close this window and return to the terminal.</p>
                </body>
              </html>
            `);

            resolve({ loginToken, server });
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<h1>❌ No login token received</h1>');
            reject(new Error('No login token in callback'));
          }
        }
      });

      server.listen(3000, () => {
        console.log('🔧 Callback server started on http://localhost:3000\n');
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Complete the login with the SSO token
   */
  async completeLogin(loginToken) {
    const tempClient = sdk.createClient({ baseUrl: this.homeserverUrl });

    // Exchange the login token for access token
    const response = await tempClient.login('m.login.token', { token: loginToken });

    // Create authenticated client
    this.client = sdk.createClient({
      baseUrl: this.homeserverUrl,
      accessToken: response.access_token,
      userId: response.user_id,
    });

    console.log(`✅ Logged in as: ${response.user_id}\n`);

    // Start syncing
    await this.client.startClient({ initialSyncLimit: 10 });

    await new Promise((resolve) => {
      this.client.once('sync', (state) => {
        if (state === 'PREPARED') {
          console.log('✅ Client synced and ready\n');
          resolve();
        }
      });
    });

    return {
      userId: response.user_id,
      accessToken: response.access_token,
      deviceId: response.device_id,
      client: this.client,
    };
  }

  /**
   * Check available login methods
   */
  async getLoginMethods() {
    const tempClient = sdk.createClient({ baseUrl: this.homeserverUrl });
    const loginFlows = await tempClient.loginFlows();

    console.log('📋 Available login methods:\n');
    loginFlows.flows.forEach((flow, index) => {
      console.log(`   ${index + 1}. ${flow.type}`);

      if (flow.identity_providers) {
        console.log('      SSO Providers:');
        flow.identity_providers.forEach(provider => {
          console.log(`      - ${provider.name} (${provider.brand || provider.id})`);
        });
      }
    });
    console.log();

    return loginFlows;
  }
}

// Example usage
async function main() {
  const homeserver = 'https://matrix.org'; // or your homeserver

  const ssoLogin = new SSOLogin(homeserver);

  // Check what login methods are available
  console.log('🔍 Checking available login methods...\n');
  await ssoLogin.getLoginMethods();

  // Login with SSO
  try {
    const result = await ssoLogin.loginWithSSO();

    console.log('🎉 Login complete!');
    console.log(`   User ID: ${result.userId}`);
    console.log(`   Device ID: ${result.deviceId}`);
    console.log(`   Access Token: ${result.accessToken.substring(0, 20)}...`);
    console.log('\n💾 Save these credentials for future use!\n');

    // Now you can use the client
    const rooms = result.client.getRooms();
    console.log(`📂 You have ${rooms.length} rooms\n`);

    console.log('✅ Press Ctrl+C to exit');

  } catch (error) {
    console.error('❌ Login failed:', error.message);

    if (error.message.includes('SSO not supported')) {
      console.log('\n💡 This homeserver does not support SSO.');
      console.log('   You need to use username/password login instead.');
      console.log('   Run: node test.js\n');
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SSOLogin;
