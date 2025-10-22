/**
 * Create Universal JWT credential in N8N
 */

async function createJWTCredential() {
  console.log('🔐 Creating Universal JWT Credential in N8N');
  console.log('===========================================');
  
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
    
    // Step 2: Create JWT credential
    console.log('🔐 Step 2: Creating JWT credential...');
    const jwtSecret = 'universal-jwt-secret-for-n8n-webhooks-2025';
    
    const credentialData = {
      name: 'Universal-JWT',
      type: 'jwtAuth',
      nodesAccess: [
        { nodeType: 'n8n-nodes-base.webhook' }
      ],
      data: {
        keyType: 'passphrase',
        publicKey: jwtSecret
      }
    };
    
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
    
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3ZWJob29rLWF1dGgiLCJpc3MiOiJ3ZWJzaXRlLWdlbmVyYXRvciIsImF1ZCI6Im44bi13ZWJob29rIiwiZXhwIjoxNzg1MzQ1OTU5LCJpYXQiOjE3NTM4MDk5NTksImp0aSI6InVuaXZlcnNhbC1qd3QtdG9rZW4ifQ.GZMBlmPY5FqoQcN7e1-ZLKMO317kocG8BiJTE4uC4ME';
    
    console.log('\n🎉 SUCCESS! JWT Credential created successfully');
    console.log('============================================');
    console.log(`Credential Name: Universal-JWT`);
    console.log(`Credential ID: ${credential.id}`);
    console.log(`JWT Token: ${jwtToken}`);
    console.log(`JWT Secret: ${jwtSecret}`);
    
    return {
      success: true,
      credentialId: credential.id,
      jwtToken: jwtToken
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the creation
createJWTCredential()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Ready for JWT testing!');
      console.log(`Test command: curl -X POST https://automation.locod-ai.fr/webhook/jwttest-contact -H 'Content-Type: application/json' -H 'Authorization: Bearer ${result.jwtToken}' -d '{"name": "JWT Test", "email": "test@example.com", "message": "JWT works!"}' -v`);
    } else {
      console.log('\n❌ Creation failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  });