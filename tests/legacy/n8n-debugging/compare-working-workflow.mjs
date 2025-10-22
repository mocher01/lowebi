/**
 * Compare working QalyArab workflow structure with our test workflow
 */

async function compareWorkflows() {
  console.log('🔍 Comparing Working vs Test Workflow Structures');
  console.log('================================================');
  
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
    
    // Get all workflows
    const workflowsResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const workflows = await workflowsResponse.json();
    
    // Find working QalyArab workflow
    const qalyWorkflow = workflows.data.find(w => 
      w.name.includes('QalyArab') || w.name.includes('Qaly')
    );
    
    // Find our test workflow
    const testWorkflow = workflows.data.find(w => 
      w.name === 'E2E_Test_Workflow'
    );
    
    if (qalyWorkflow) {
      console.log(`\n📋 WORKING WORKFLOW: ${qalyWorkflow.name}`);
      console.log(`   ID: ${qalyWorkflow.id}`);
      console.log(`   Active: ${qalyWorkflow.active}`);
      
      // Get detailed structure
      const qalyDetailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${qalyWorkflow.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (qalyDetailResponse.ok) {
        const qalyDetail = await qalyDetailResponse.json();
        const qalyWebhookNode = qalyDetail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        
        if (qalyWebhookNode) {
          console.log('   Webhook Node:');
          console.log(`     Path: ${qalyWebhookNode.parameters?.path}`);
          console.log(`     Method: ${qalyWebhookNode.parameters?.httpMethod}`);
          console.log(`     Auth: ${qalyWebhookNode.parameters?.authentication || 'none'}`);
          console.log(`     Credentials: ${JSON.stringify(qalyWebhookNode.credentials || {}, null, 6)}`);
          console.log(`     Position: ${JSON.stringify(qalyWebhookNode.position)}`);
          console.log(`     ID: ${qalyWebhookNode.id}`);
          console.log(`     Name: ${qalyWebhookNode.name}`);
        }
        
        console.log(`   Total nodes: ${qalyDetail.data.nodes.length}`);
        console.log(`   Connections: ${JSON.stringify(qalyDetail.data.connections, null, 2)}`);
      }
    } else {
      console.log('❌ No working QalyArab workflow found');
    }
    
    if (testWorkflow) {
      console.log(`\n📋 TEST WORKFLOW: ${testWorkflow.name}`);
      console.log(`   ID: ${testWorkflow.id}`);
      console.log(`   Active: ${testWorkflow.active}`);
      
      // Get detailed structure
      const testDetailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${testWorkflow.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (testDetailResponse.ok) {
        const testDetail = await testDetailResponse.json();
        const testWebhookNode = testDetail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        
        if (testWebhookNode) {
          console.log('   Webhook Node:');
          console.log(`     Path: ${testWebhookNode.parameters?.path}`);
          console.log(`     Method: ${testWebhookNode.parameters?.httpMethod}`);
          console.log(`     Auth: ${testWebhookNode.parameters?.authentication || 'none'}`);
          console.log(`     Credentials: ${JSON.stringify(testWebhookNode.credentials || {}, null, 6)}`);
          console.log(`     Position: ${JSON.stringify(testWebhookNode.position)}`);
          console.log(`     ID: ${testWebhookNode.id}`);
          console.log(`     Name: ${testWebhookNode.name}`);
        }
        
        console.log(`   Total nodes: ${testDetail.data.nodes.length}`);
        console.log(`   Connections: ${JSON.stringify(testDetail.data.connections, null, 2)}`);
      }
    } else {
      console.log('❌ No test workflow found');
    }
    
    // Let's also try creating a minimal working workflow like QalyArab
    console.log('\n🔧 Creating Minimal Working Workflow (No Auth)');
    console.log('==============================================');
    
    const minimalWorkflowData = {
      name: 'Minimal_Test_Workflow',
      active: true,
      nodes: [
        {
          id: 'webhook',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [300, 300],
          parameters: {
            path: 'minimal-test-contact',
            httpMethod: 'POST'
            // No authentication - like QalyArab
          }
        },
        {
          id: 'response',
          name: 'Respond to Webhook',
          type: 'n8n-nodes-base.respondToWebhook',
          position: [500, 300],
          parameters: {
            respondWith: 'json',
            responseBody: JSON.stringify({
              success: true,
              message: 'Minimal test successful'
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
    
    const minimalResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalWorkflowData)
    });
    
    if (minimalResponse.ok) {
      const minimal = await minimalResponse.json();
      console.log(`✅ Minimal workflow created: ${minimal.id}`);
      
      // Wait and test
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🧪 Testing minimal webhook...');
      const minimalTestResponse = await fetch('https://automation.locod-ai.fr/webhook/minimal-test-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'minimal' })
      });
      
      console.log(`📊 Minimal test status: ${minimalTestResponse.status}`);
      const minimalText = await minimalTestResponse.text();
      console.log(`📝 Minimal test response: ${minimalText}`);
      
      if (minimalTestResponse.status === 200) {
        console.log('✅ Minimal webhook works! Issue is with authentication setup');
      } else {
        console.log('❌ Even minimal webhook fails - deeper issue');
      }
    } else {
      console.log('❌ Failed to create minimal workflow');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compareWorkflows();