/**
 * Check JWT credential data to see if it has __n8n_BLANK_VALUE_
 */

async function checkJWTCredentialData() {
  console.log('🔍 Checking JWT Credential Data');
  console.log('===============================');
  
  try {
    // Step 1: Login to get session cookie
    console.log('🔐 Step 1: Getting session cookie...');
    const loginResponse = await fetch('https://automation.locod-ai.fr/rest/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrLdapLoginId: 'gestion@locod-ai.com',
        password: 'YouCanMakeITOK2025'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies.split(',')[0].split(';')[0];
    console.log('✅ Session cookie obtained');
    
    // Step 2: Get JWT credential details
    console.log('🔍 Step 2: Getting JWT credential data...');
    const credResponse = await fetch('https://automation.locod-ai.fr/rest/credentials/fUTZzvO0PtVNBGHX', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (!credResponse.ok) {
      throw new Error(`Failed to get credential: ${credResponse.status}`);
    }
    
    const credential = await credResponse.json();
    console.log('✅ JWT credential retrieved');
    console.log(`   Name: ${credential.name}`);
    console.log(`   Type: ${credential.type}`);
    
    // Check credential data
    if (credential.data) {
      console.log('🔍 Credential data:');
      console.log(`   Key type: ${credential.data.keyType || 'not set'}`);
      console.log(`   Public key: ${credential.data.publicKey || 'not set'}`);
      
      // Check for __n8n_BLANK_VALUE_
      const publicKey = credential.data.publicKey;
      if (publicKey && publicKey.includes('__n8n_BLANK_VALUE_')) {
        console.log('❌ FOUND __n8n_BLANK_VALUE_ in JWT credential!');
        console.log(`   Full public key: ${publicKey}`);
      } else {
        console.log('✅ No __n8n_BLANK_VALUE_ found in JWT credential');
        console.log(`   Public key looks clean: ${publicKey ? publicKey.substring(0, 50) + '...' : 'empty'}`);
      }
    } else {
      console.log('❌ No credential data found');
    }
    
    console.log('\n🎯 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkJWTCredentialData();