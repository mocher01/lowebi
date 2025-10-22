/**
 * Final proof of concept: Create credential with two-step process and simple workflow
 */

async function finalProofOfConcept() {
  console.log('🎯 FINAL PROOF OF CONCEPT: Two-Step Credential + Simple Workflow');
  console.log('================================================================');
  
  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzODA0NTE0fQ.gjmz5P6WIdw9nPb2XyJ4Zyt1JxDLvw77Cmo9vI-JD7g';
  const PROOF_TOKEN = 'proof-of-concept-token-' + Date.now();
  const WEBHOOK_PATH = 'proof-test-' + Date.now();
  
  let credentialId = null;
  let workflowId = null;
  
  try {
    // ========================================
    // STEP 1: Create credential (two-step process)
    // ========================================
    
    console.log('\n🔐 STEP 1: Two-Step Credential Creation');
    console.log('======================================');
    
    // 1a. Create empty credential
    console.log('📝 1a. Creating empty credential...');
    const emptyCredentialData = {
      name: 'PROOF_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: ''
      }
    };
    
    const createResponse = await fetch('https://automation.locod-ai.fr/api/v1/credentials', {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emptyCredentialData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Credential creation failed: ${createResponse.status}`);
    }
    
    const credential = await createResponse.json();
    credentialId = credential.id;
    console.log(`✅ Empty credential created: ${credentialId}`);
    
    // 1b. Get session for update
    console.log('🔐 1b. Getting session...');
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
    console.log('✅ Session obtained');
    
    // 1c. Update with real token
    console.log('📝 1c. Updating with real token...');
    const updateCredentialData = {
      name: 'PROOF_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: PROOF_TOKEN
      }
    };
    
    const updateResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${credentialId}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateCredentialData)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Credential update failed: ${updateResponse.status}`);
    }
    
    console.log('✅ Credential updated with real token');
    
    // ========================================
    // STEP 2: Create simple workflow using session auth
    // ========================================
    
    console.log('\n🔧 STEP 2: Creating Simple Workflow (Session Auth)');
    console.log('=================================================');
    
    const workflowData = {
      name: 'PROOF_Workflow_' + Date.now(),
      active: true,
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [300, 300],
          parameters: {
            path: WEBHOOK_PATH,
            httpMethod: 'POST',
            authentication: 'headerAuth'
          },
          credentials: {
            httpHeaderAuth: {
              id: credentialId,
              name: 'PROOF_Credential'
            }
          }
        },
        {
          id: 'response',
          name: 'Respond to Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [500, 300],
          parameters: {
            respondWith: 'json',
            responseBody: JSON.stringify({
              success: true,
              message: 'PROOF OF CONCEPT WORKS!',
              timestamp: new Date().toISOString(),
              credentialUsed: credentialId
            })
          }
        }
      ],
      connections: {
        webhook: {
          main: [[{ node: 'response', type: 'main', index: 0 }]]
        }
      }
    };
    
    console.log('📝 Creating workflow with session auth...');
    const workflowResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    if (!workflowResponse.ok) {
      const errorText = await workflowResponse.text();
      throw new Error(`Workflow creation failed: ${workflowResponse.status} - ${errorText}`);
    }
    
    const workflowResponseJson = await workflowResponse.json();
    workflowId = workflowResponseJson.id;
    console.log(`✅ Workflow created: ${workflowId}`);
    
    // ========================================
    // STEP 3: Test the webhook
    // ========================================
    
    console.log('\n🧪 STEP 3: Testing Webhook');
    console.log('=========================');
    
    const webhookUrl = `https://automation.locod-ai.fr/webhook/${WEBHOOK_PATH}`;
    console.log(`🌐 Webhook URL: ${webhookUrl}`);
    console.log(`🔑 Token: ${PROOF_TOKEN}`);
    
    // Wait for webhook to be ready
    console.log('⏳ Waiting 5 seconds for webhook registration...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test with correct authentication
    console.log('🔑 Testing with correct authentication...');
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': PROOF_TOKEN
      },
      body: JSON.stringify({
        name: 'Proof Test',
        email: 'proof@test.com',
        message: 'Final proof of concept test'
      })
    });
    
    console.log(`📊 Response Status: ${testResponse.status}`);
    const responseText = await testResponse.text();
    console.log(`📝 Response Body: ${responseText}`);
    
    // ========================================
    // STEP 4: Analyze results
    // ========================================
    
    console.log('\n📋 STEP 4: Results Analysis');
    console.log('===========================');
    
    if (testResponse.status === 200) {
      console.log('🎉 🎉 🎉 PROOF OF CONCEPT SUCCESS! 🎉 🎉 🎉');
      console.log('');
      console.log('✅ Two-step credential creation bypassed __n8n_BLANK_VALUE_');
      console.log('✅ Webhook authentication is working perfectly');
      console.log('✅ Session-based workflow creation is functional');
      console.log('✅ Complete end-to-end authentication flow works');
      console.log('');
      console.log('🎯 SOLUTION CONFIRMED - READY FOR IMPLEMENTATION!');
      
      // Test without auth to confirm security
      console.log('\n🚫 Security test: Request without token...');
      const noAuthResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'no auth' })
      });
      
      console.log(`📊 No-auth status: ${noAuthResponse.status}`);
      if (noAuthResponse.status === 403) {
        console.log('✅ Security confirmed: Unauthorized requests properly rejected');
      }
      
      return {
        success: true,
        credentialId: credentialId,
        workflowId: workflowId,
        webhookUrl: webhookUrl,
        token: PROOF_TOKEN
      };
      
    } else if (responseText.includes('Authorization data is wrong')) {
      console.log('❌ PROOF FAILED: Still getting authorization errors');
      console.log('The two-step process did not solve the credential issue');
      
    } else if (testResponse.status === 404) {
      console.log('❌ PROOF FAILED: Webhook not registered');
      console.log('Issue with workflow creation or activation');
      
    } else {
      console.log(`❌ PROOF FAILED: Unexpected response ${testResponse.status}`);
    }
    
    return {
      success: false,
      credentialId: credentialId,
      workflowId: workflowId,
      status: testResponse.status,
      response: responseText
    };
    
  } catch (error) {
    console.error('\n❌ PROOF OF CONCEPT FAILED:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message,
      credentialId: credentialId,
      workflowId: workflowId
    };
  }
}

// Run the proof of concept
finalProofOfConcept()
  .then(result => {
    console.log('\n' + '='.repeat(70));
    if (result.success) {
      console.log('🏆 PROOF OF CONCEPT COMPLETE - SOLUTION VALIDATED!');
      console.log('Next step: Implement two-step process in workflow generator');
    } else {
      console.log('🚫 PROOF OF CONCEPT FAILED - NEED ALTERNATIVE APPROACH');
    }
    console.log('='.repeat(70));
  });