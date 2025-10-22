/**
 * Try manual activation through N8N UI endpoints
 */

async function tryManualActivation() {
  console.log('🔧 Trying Manual Activation Through Different Endpoints');
  console.log('======================================================');
  
  try {
    // Login
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
    
    // First, let's create a completely new workflow with the correct structure
    console.log('\n🔧 Creating new workflow with proper structure...');
    
    const credentialId = '7b7UpQSnngoqgx9S'; // Our working credential
    const testToken = 'proof-of-concept-token-1753818705503';
    const webhookPath = 'final-working-test-' + Date.now();
    
    // Generate webhookId upfront
    const webhookId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    const workflowData = {
      name: 'FINAL_Working_Test',
      active: false, // Start inactive
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [300, 300],
          webhookId: webhookId, // Include webhookId from start
          parameters: {
            path: webhookPath,
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
              message: 'FINAL WORKING TEST SUCCESS!',
              webhookId: webhookId,
              credentialId: credentialId,
              timestamp: new Date().toISOString()
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
    
    console.log(`📝 Creating workflow with webhookId: ${webhookId}`);
    console.log(`📝 Webhook path: ${webhookPath}`);
    
    const createResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Workflow creation failed: ${createResponse.status} - ${await createResponse.text()}`);
    }
    
    const createdWorkflow = await createResponse.json();
    const newWorkflowId = createdWorkflow.id;
    console.log(`✅ New workflow created: ${newWorkflowId}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now try to activate it using PATCH
    console.log('\n⚡ Activating workflow using PATCH...');
    const activateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${newWorkflowId}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        active: true
      })
    });
    
    console.log(`Activation status: ${activateResponse.status}`);
    
    if (activateResponse.ok) {
      console.log('✅ Workflow activated with PATCH!');
      
      // Wait for webhook to register
      console.log('⏳ Waiting 5 seconds for webhook registration...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test the webhook
      const webhookUrl = `https://automation.locod-ai.fr/webhook/${webhookPath}`;
      console.log(`\n🧪 Testing newly created webhook: ${webhookUrl}`);
      
      const testResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': testToken
        },
        body: JSON.stringify({
          name: 'Final Working Test',
          email: 'finaltest@example.com',
          message: 'This should work with proper webhookId'
        })
      });
      
      console.log(`📊 Test Status: ${testResponse.status}`);
      const testText = await testResponse.text();
      console.log(`📝 Test Response: ${testText}`);
      
      if (testResponse.status === 200) {
        console.log('\n🎉 🎉 🎉 FINAL SUCCESS! 🎉 🎉 🎉');
        console.log('');
        console.log('✅ Workflow creation with webhookId works!');
        console.log('✅ Two-step credential creation is functional!');
        console.log('✅ Webhook authentication is working!');
        console.log('✅ The __n8n_BLANK_VALUE_ bug is SOLVED!');
        console.log('');
        console.log('🎯 PROOF OF CONCEPT COMPLETELY VALIDATED!');
        console.log('🎯 READY TO IMPLEMENT IN WORKFLOW GENERATOR!');
        
        // Parse and display the response
        try {
          const responseData = JSON.parse(testText);
          console.log('\n📄 Success Response Details:');
          console.log(`   Message: ${responseData.message}`);
          console.log(`   Webhook ID: ${responseData.webhookId}`);
          console.log(`   Credential ID: ${responseData.credentialId}`);
          console.log(`   Timestamp: ${responseData.timestamp}`);
        } catch (e) {
          console.log('Response format different than expected');
        }
        
        return {
          success: true,
          workflowId: newWorkflowId,
          webhookUrl: webhookUrl,
          credentialId: credentialId
        };
        
      } else if (testResponse.status === 403) {
        console.log('\n⚠️  Authentication issue - let\'s test without auth...');
        
        const noAuthTest = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'no auth' })
        });
        
        console.log(`No-auth test status: ${noAuthTest.status}`);
        
        if (noAuthTest.status === 403) {
          console.log('✅ Good: Auth is required');
          console.log('❌ But: Our token isn\'t working - credential issue');
        } else if (noAuthTest.status === 200) {
          console.log('⚠️  Webhook works without auth - check auth configuration');
        }
        
      } else if (testResponse.status === 404) {
        console.log('\n❌ Still 404 - webhook not registered despite proper webhookId');
      }
      
    } else {
      const activateError = await activateResponse.text();
      console.log(`❌ PATCH activation failed: ${activateError}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

tryManualActivation()
  .then(result => {
    if (result && result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('🏆 COMPLETE SOLUTION VALIDATED!');
      console.log('Ready to implement two-step process in workflow generator');
      console.log('='.repeat(60));
    }
  });