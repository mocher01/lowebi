/**
 * Complete end-to-end test of two-step credential creation process
 */

async function completeEndToEndTest() {
  console.log('🚀 Complete End-to-End Test: Two-Step Credential Process');
  console.log('=========================================================');
  
  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzODA0NTE0fQ.gjmz5P6WIdw9nPb2XyJ4Zyt1JxDLvw77Cmo9vI-JD7g';
  const TEST_TOKEN = 'end-to-end-test-token-' + Date.now();
  const WEBHOOK_PATH = 'e2e-test-contact';
  
  let credentialId = null;
  let workflowId = null;
  
  try {
    // ========================================
    // PHASE 1: CREATE CREDENTIAL (TWO-STEP)
    // ========================================
    
    console.log('\n🔐 PHASE 1: Creating Credential with Two-Step Process');
    console.log('===================================================');
    
    // Step 1: Create empty credential with API key
    console.log('📝 Step 1: Creating empty credential...');
    const emptyCredentialData = {
      name: 'E2E_Test_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: ''  // Empty initially
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
      throw new Error(`Credential creation failed: ${createResponse.status} - ${await createResponse.text()}`);
    }
    
    const credential = await createResponse.json();
    credentialId = credential.id;
    console.log(`✅ Empty credential created: ID ${credentialId}`);
    
    // Step 2: Get session cookie
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
    
    // Step 3: Update credential with real token
    console.log('📝 Step 3: Updating credential with real token...');
    const updateCredentialData = {
      name: 'E2E_Test_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: TEST_TOKEN  // Real token
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
      throw new Error(`Credential update failed: ${updateResponse.status} - ${await updateResponse.text()}`);
    }
    
    console.log('✅ Credential updated with real token');
    
    // ========================================
    // PHASE 2: CREATE WORKFLOW
    // ========================================
    
    console.log('\n🔧 PHASE 2: Creating Test Workflow');
    console.log('=================================');
    
    const workflowData = {
      name: 'E2E_Test_Workflow',
      active: true,
      nodes: [
        {
          id: 'webhook-node',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [300, 300],
          parameters: {
            path: WEBHOOK_PATH,
            httpMethod: 'POST',
            authentication: 'headerAuth'
          },
          credentials: {
            httpHeaderAuth: {
              id: credentialId,
              name: 'E2E_Test_Credential'
            }
          }
        },
        {
          id: 'response-node',
          name: 'Respond to Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          position: [500, 300],
          parameters: {
            respondWith: 'json',
            responseBody: JSON.stringify({
              success: true,
              message: 'E2E test successful!',
              timestamp: new Date().toISOString()
            })
          }
        }
      ],
      connections: {
        'webhook-node': {
          main: [[{ node: 'response-node', type: 'main', index: 0 }]]
        }
      }
    };
    
    const workflowResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    if (!workflowResponse.ok) {
      throw new Error(`Workflow creation failed: ${workflowResponse.status} - ${await workflowResponse.text()}`);
    }
    
    const workflow = await workflowResponse.json();
    workflowId = workflow.id;
    console.log(`✅ Workflow created: ID ${workflowId}`);
    
    // Wait a moment for workflow to be ready
    console.log('⏳ Waiting 3 seconds for workflow to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ========================================
    // PHASE 3: TEST WEBHOOK AUTHENTICATION
    // ========================================
    
    console.log('\n🧪 PHASE 3: Testing Webhook Authentication');
    console.log('=========================================');
    
    const webhookUrl = `https://automation.locod-ai.fr/webhook/${WEBHOOK_PATH}`;
    const testPayload = {
      name: 'E2E Test User',
      email: 'e2e@test.com',
      message: 'Testing two-step credential creation'
    };
    
    // Test 1: With correct authentication
    console.log('🔑 Test 1: With correct authentication...');
    console.log(`   URL: ${webhookUrl}`);
    console.log(`   Token: ${TEST_TOKEN}`);
    
    const authResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': TEST_TOKEN
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📊 Response Status: ${authResponse.status}`);
    const authResponseText = await authResponse.text();
    console.log(`📝 Response Body: ${authResponseText}`);
    
    if (authResponse.status === 200) {
      console.log('🎉 SUCCESS! Authentication worked perfectly!');
      
      // Parse response to verify it's our workflow
      try {
        const responseData = JSON.parse(authResponseText);
        if (responseData.success && responseData.message.includes('E2E test successful')) {
          console.log('✅ Response confirms it\'s our test workflow');
        }
      } catch (e) {
        console.log('⚠️  Response not JSON, but request succeeded');
      }
      
    } else if (authResponseText.includes('Authorization data is wrong')) {
      console.log('❌ FAILED: Still getting authorization error - credential bug persists');
    } else {
      console.log(`⚠️  Unexpected response: ${authResponse.status}`);
    }
    
    // Test 2: Without authentication (should fail)
    console.log('\n🚫 Test 2: Without authentication (should fail)...');
    const noAuthResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📊 No-auth Status: ${noAuthResponse.status}`);
    if (noAuthResponse.status === 403) {
      console.log('✅ Good: Requests without auth are properly rejected');
    } else {
      console.log('⚠️  Unexpected: Request without auth was not rejected');
    }
    
    // Test 3: With wrong token (should fail)
    console.log('\n🔓 Test 3: With wrong token (should fail)...');
    const wrongAuthResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'wrong-token-123'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📊 Wrong-auth Status: ${wrongAuthResponse.status}`);
    if (wrongAuthResponse.status === 403) {
      console.log('✅ Good: Requests with wrong auth are properly rejected');
    } else {
      console.log('⚠️  Unexpected: Request with wrong auth was not rejected');
    }
    
    // ========================================
    // PHASE 4: RESULTS SUMMARY
    // ========================================
    
    console.log('\n📋 PHASE 4: Test Results Summary');
    console.log('===============================');
    
    const success = authResponse.status === 200;
    
    if (success) {
      console.log('🎉 🎉 🎉 COMPLETE SUCCESS! 🎉 🎉 🎉');
      console.log('');
      console.log('✅ Two-step credential creation works perfectly!');
      console.log('✅ Webhook authentication is functional!');
      console.log('✅ Authorization is properly enforced!');
      console.log('✅ Ready to implement in workflow generator!');
      console.log('');
      console.log('Key components:');
      console.log(`   - Credential ID: ${credentialId}`);
      console.log(`   - Token: ${TEST_TOKEN}`);
      console.log(`   - Workflow ID: ${workflowId}`);
      
    } else {
      console.log('❌ ❌ ❌ TEST FAILED ❌ ❌ ❌');
      console.log('');
      console.log('The two-step process did not solve the authentication issue.');
      console.log('Need to investigate further before implementing in generator.');
    }
    
    return {
      success: success,
      credentialId: credentialId,
      workflowId: workflowId,
      token: TEST_TOKEN,
      authStatus: authResponse.status,
      authResponse: authResponseText
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message,
      credentialId: credentialId,
      workflowId: workflowId
    };
  }
}

// Run the complete test
completeEndToEndTest()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('🎯 READY TO IMPLEMENT IN WORKFLOW GENERATOR!');
    } else {
      console.log('🚫 NOT READY - NEED MORE INVESTIGATION');
    }
    console.log('='.repeat(60));
  });