/**
 * Create a webhook WITHOUT authentication to test if that works
 */

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjg3MDQ3LCJleHAiOjE3NTU4MTM2MDB9.cpCFLkUS48EFIi17BnObm4mKOgv5ukIx-ZT09YSjGfE';
const N8N_BASE_URL = 'https://automation.locod-ai.fr';

async function createNoAuthWebhook() {
  try {
    console.log('🚀 Creating Webhook WITHOUT Authentication');
    console.log('=========================================');
    
    // Create a simple workflow with no auth webhook
    const workflow = {
      name: 'TEST_NoAuth_Webhook',
      active: false,
      settings: {
        executionOrder: 'v1'
      },
      nodes: [
        {
          parameters: {
            httpMethod: 'POST',
            path: 'test-no-auth',
            options: {
              noResponseBody: false,
              responseMode: 'onReceived',
              responseData: 'allEntries'
            }
            // NO authentication field!
          },
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [0, 0],
          id: 'webhook-node-id'
        },
        {
          parameters: {
            fromEmail: 'locodai.sas@gmail.com',
            toEmail: 'gestion@locod-ai.com',
            subject: '[TEST] Webhook without auth works!',
            text: `🎉 SUCCESS: No-auth webhook executed!
            
Name: {{ $json.name }}
Email: {{ $json.email }}
Message: {{ $json.message }}

This proves webhooks work without authentication!`
          },
          name: 'Send Email',
          type: 'n8n-nodes-base.emailSend',
          typeVersion: 1,
          position: [240, 0],
          id: 'email-node-id',
          credentials: {
            smtp: {
              id: 'bUu8Wj3fYXqnn2nZ',
              name: 'Locodai Gmail'
            }
          }
        }
      ],
      connections: {
        Webhook: {
          main: [[{ node: 'Send Email', type: 'main', index: 0 }]]
        }
      }
    };
    
    console.log('📝 Creating workflow...');
    const createResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflow)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Workflow creation failed: ${createResponse.status} - ${errorText}`);
    }
    
    const created = await createResponse.json();
    console.log(`✅ Workflow created: ${created.name} (ID: ${created.id})`);
    
    // Activate the workflow
    console.log('⚡ Activating workflow...');
    const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${created.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });
    
    if (activateResponse.ok) {
      console.log('✅ Workflow activated');
    } else {
      console.log('⚠️  Activation failed but continuing...');
    }
    
    // Test the webhook
    console.log('🧪 Testing the no-auth webhook...');
    const testResponse = await fetch(`${N8N_BASE_URL}/webhook/test-no-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'No Auth Test',
        email: 'noauth@test.com',
        message: 'This webhook has NO authentication and should work!'
      })
    });
    
    console.log(`📡 Test result: ${testResponse.status} ${testResponse.statusText}`);
    const responseText = await testResponse.text();
    console.log(`📋 Response: ${responseText}`);
    
    if (testResponse.ok) {
      console.log('\n🎉 SUCCESS: No-auth webhook works perfectly!');
      console.log('💡 This proves the issue is with authentication, not the webhook system');
    } else {
      console.log('\n❌ Even no-auth webhook failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

createNoAuthWebhook();