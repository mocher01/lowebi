/**
 * Manual Session Expiration Test
 *
 * HOW TO USE:
 * 1. Login to https://logen.locod-ai.com
 * 2. Navigate to "My Sites" page
 * 3. Open Browser DevTools Console (F12 → Console)
 * 4. Copy and paste this ENTIRE script into the console
 * 5. Press Enter
 *
 * EXPECTED RESULT:
 * - Page will reload
 * - You'll be automatically redirected to /login
 * - No manual action required
 */

console.log('🧪 SESSION EXPIRATION TEST');
console.log('========================\n');

console.log('📝 Step 1: Checking current authentication state...');
const hasAccessToken = !!localStorage.getItem('customer_access_token');
const hasRefreshToken = document.cookie.includes('customer_refresh_token');

console.log(`   Access Token: ${hasAccessToken ? '✅ Present' : '❌ Missing'}`);
console.log(`   Refresh Token: ${hasRefreshToken ? '✅ Present' : '❌ Missing'}`);

if (!hasAccessToken && !hasRefreshToken) {
  console.log('\n⚠️ You are not logged in!');
  console.log('   Please login first, then run this test again.');
} else {
  console.log('\n📝 Step 2: Simulating session expiration...');
  console.log('   - Removing access token from localStorage');
  localStorage.removeItem('customer_access_token');

  console.log('   - Expiring refresh token cookie');
  document.cookie = 'customer_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

  console.log('\n📝 Step 3: Reloading page to trigger auth check...');
  console.log('   ✅ EXPECT: Automatic redirect to /login page');
  console.log('\n🔄 Reloading in 2 seconds...');

  setTimeout(() => {
    location.reload();
  }, 2000);
}
