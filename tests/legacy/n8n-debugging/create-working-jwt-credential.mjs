/**
 * Try to create a working JWT credential that avoids __n8n_BLANK_VALUE_
 */

async function createWorkingJWTCredential() {
  console.log('🔐 Creating Working JWT Credential');
  console.log('==================================');
  
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
    
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies.split(',')[0].split(';')[0];
    console.log('✅ Session cookie obtained');
    
    // Step 2: Delete existing JWT credential first
    console.log('🗑️  Step 2: Deleting existing JWT credential...');
    try {
      const deleteResponse = await fetch('https://automation.locod-ai.fr/rest/credentials/fUTZzvO0PtVNBGHX', {
        method: 'DELETE',
        headers: { 'Cookie': sessionCookie }
      });
      console.log(`✅ Existing credential deleted (status: ${deleteResponse.status})`);
    } catch (error) {
      console.log('⚠️  Could not delete existing credential, continuing...');
    }
    
    // Step 3: Create new JWT credential with different approach
    console.log('🔐 Step 3: Creating new JWT credential...');
    const jwtSecret = 'universal-jwt-secret-for-n8n-webhooks-2025';
    
    // Try using a different data structure
    const credentialData = {
      name: 'Working-JWT-Auth',
      type: 'jwtAuth',
      nodesAccess: [
        { nodeType: 'n8n-nodes-base.webhook' }
      ],
      data: {
        keyType: 'passphrase',
        publicKey: jwtSecret,
        algorithm: 'HS256'
      }
    };
    
    console.log('🔍 Credential payload:');
    console.log(JSON.stringify(credentialData, null, 2));
    
    const credResponse = await fetch('https://automation.locod-ai.fr/rest/credentials', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentialData)
    });
    
    if (!credResponse.ok) {
      const errorData = await credResponse.json().catch(() => ({}));
      throw new Error(`Credential creation failed: ${credResponse.status} - ${errorData.message || credResponse.statusText}`);
    }
    
    const credential = await credResponse.json();
    console.log(`✅ JWT Credential created: ${credential.name} (ID: ${credential.id})`);
    
    // Step 4: Immediately verify the credential data
    console.log('🔍 Step 4: Verifying credential data...');
    const verifyResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${credential.id}`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Credential verification:');
      console.log(`   Public key: ${verifyData.data?.publicKey || 'EMPTY!'}`);
      
      if (verifyData.data?.publicKey?.includes('__n8n_BLANK_VALUE_')) {
        console.log('❌ STILL contains __n8n_BLANK_VALUE_!');
      } else if (!verifyData.data?.publicKey) {
        console.log('❌ Public key is empty!');
      } else {
        console.log('✅ Credential looks good!');
      }
    }
    
    return {
      success: true,
      credentialId: credential.id,
      credentialName: credential.name
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the creation
createWorkingJWTCredential()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Credential creation completed!');
      console.log(`Next: Update workflow to use credential ID: ${result.credentialId}`);
    } else {
      console.log('\n❌ Credential creation failed');
    }
  });