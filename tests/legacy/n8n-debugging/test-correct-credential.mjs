/**
 * Test the correctly created credential by creating a workflow and testing webhook
 */

async function testCorrectCredential() {
  console.log('🧪 Testing Correctly Created Credential');
  console.log('=======================================');
  
  const CREDENTIAL_ID = 'eLBmGtJfsmYgbLFZ';
  const TOKEN = 'secure-webhook-token-2025-1753817922809';
  
  try {
    // Step 1: Login
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
    
    // Step 2: Create test workflow using the correct credential
    console.log('🔧 Step 2: Creating test workflow...');
    const workflowData = {
      name: 'TEST_Final_Credential',
      active: true,
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [300, 300],
          parameters: {
            path: 'final-test-contact',
            httpMethod: 'POST',
            authentication: 'headerAuth'  // Use header auth
          },
          credentials: {
            httpHeaderAuth: {
              id: CREDENTIAL_ID,
              name: 'FINAL_Webhook_Auth'
            }
          }
        },
        {
          id: 'email',
          name: 'Email',
          type: 'n8n-nodes-base.gmail',
          position: [500, 300],
          parameters: {
            operation: 'send',
            email: 'gestion@locod-ai.com',
            subject: 'Test Final Credential',
            message: 'Credential test successful!'
          }
        }
      ],
      connections: {
        webhook: {
          main: [[{ node: 'email', type: 'main', index: 0 }]]
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
      throw new Error(`Workflow creation failed: ${workflowResponse.status}`);
    }
    
    const workflow = await workflowResponse.json();
    console.log(`✅ Test workflow created: ${workflow.id}`);
    
    // Step 3: Test the webhook with authentication
    console.log('🧪 Step 3: Testing webhook with correct authentication...');
    const webhookUrl = 'https://automation.locod-ai.fr/webhook/final-test-contact';
    
    const testPayload = {
      name: 'Final Test',
      email: 'test@example.com',
      message: 'Testing final credential solution'
    };
    
    console.log(`🌐 Testing webhook: ${webhookUrl}`);
    console.log(`🔑 Using token: ${TOKEN}`);
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': TOKEN  // Use the correct header name and token
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📊 Response status: ${webhookResponse.status}`);
    const responseText = await webhookResponse.text();
    console.log(`📝 Response body: ${responseText}`);
    
    if (webhookResponse.status === 200) {
      console.log('🎉 SUCCESS! Webhook authentication worked!');
      console.log('✅ The two-step credential creation solved the __n8n_BLANK_VALUE_ bug!');
    } else if (webhookResponse.status === 403 && responseText.includes('Authorization data is wrong')) {
      console.log('❌ Still getting authorization error - credential might still be affected');
    } else {
      console.log(`⚠️  Unexpected response: ${webhookResponse.status}`);
    }
    
    return {
      success: webhookResponse.status === 200,
      status: webhookResponse.status,
      response: responseText,
      workflowId: workflow.id
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

testCorrectCredential()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 FINAL SOLUTION WORKS!');
      console.log('The two-step credential creation process successfully bypassed the N8N bug!');
    } else {
      console.log('\n❌ Test failed - need to investigate further');
      console.log(`Status: ${result.status}, Error: ${result.error}`);
    }
  });