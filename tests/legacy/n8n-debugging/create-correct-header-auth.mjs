/**
 * Create header auth credential using the CORRECT two-step process
 */

async function createCorrectHeaderAuth() {
  console.log('🔐 Creating Header Auth with Correct Two-Step Process');
  console.log('====================================================');
  
  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzODA0NTE0fQ.gjmz5P6WIdw9nPb2XyJ4Zyt1JxDLvw77Cmo9vI-JD7g';
  const REAL_TOKEN = 'secure-webhook-token-2025-' + Date.now();
  
  try {
    // STEP 1: Create empty credential using API KEY
    console.log('🔐 Step 1: Creating empty credential with API key...');
    const emptyCredentialData = {
      name: 'FINAL_Webhook_Auth',
      type: 'httpHeaderAuth',
      nodesAccess: [
        { nodeType: 'n8n-nodes-base.webhook' }
      ],
      data: {
        name: 'X-Webhook-Token',  // Header name
        value: ''                 // Empty initially - this is KEY!
      }
    };
    
    console.log('📝 Step 1 payload:');
    console.log(JSON.stringify(emptyCredentialData, null, 2));
    
    const createResponse = await fetch('https://automation.locod-ai.fr/api/v1/credentials', {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emptyCredentialData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Step 1 failed: ${createResponse.status} - ${errorText}`);
    }
    
    const created = await createResponse.json();
    console.log(`✅ Step 1 complete - Created credential ID: ${created.id}`);
    
    // STEP 2: Update with real token using SESSION AUTH
    console.log('🔐 Step 2: Getting session cookie...');
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
    
    console.log('🔐 Step 3: Updating credential with real token...');
    const updateCredentialData = {
      name: 'FINAL_Webhook_Auth',
      type: 'httpHeaderAuth',
      nodesAccess: [
        { nodeType: 'n8n-nodes-base.webhook' }
      ],
      data: {
        name: 'X-Webhook-Token',  // Header name
        value: REAL_TOKEN         // Real token now!
      }
    };
    
    console.log('📝 Step 3 payload:');
    console.log(JSON.stringify(updateCredentialData, null, 2));
    
    const updateResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateCredentialData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Step 3 failed: ${updateResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Step 3 complete - Credential updated with real token');
    
    // STEP 4: Verify the credential has the correct value
    console.log('🔍 Step 4: Verifying credential data...');
    const verifyResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${created.id}`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (verifyResponse.ok) {
      const verified = await verifyResponse.json();
      console.log('📋 Final credential data:');
      console.log(JSON.stringify(verified.data, null, 2));
      
      // Check for success
      const valueField = verified.data?.value;
      if (valueField && valueField.includes('__n8n_BLANK_VALUE_')) {
        console.log('❌ STILL contains __n8n_BLANK_VALUE_!');
        console.log(`   Value: ${valueField}`);
      } else if (valueField === REAL_TOKEN) {
        console.log('✅ SUCCESS! Token is correctly stored!');
        console.log(`   Token: ${valueField}`);
      } else {
        console.log('⚠️  Token has unexpected value:');
        console.log(`   Expected: ${REAL_TOKEN}`);
        console.log(`   Actual: ${valueField}`);
      }
    }
    
    console.log('\n🎉 Two-step credential creation completed!');
    console.log(`Credential ID: ${created.id}`);
    console.log(`Token: ${REAL_TOKEN}`);
    
    return {
      success: true,
      credentialId: created.id,
      token: REAL_TOKEN
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

createCorrectHeaderAuth()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Ready to test with proper credential!');
    } else {
      console.log('\n❌ Failed to create proper credential');
    }
  });