/**
 * Debug workflow creation and activation
 */

async function debugWorkflowCreation() {
  console.log('🔍 Debugging Workflow Creation and Activation');
  console.log('==============================================');
  
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
    
    // Check existing workflows first
    console.log('\n🔍 Checking existing workflows...');
    const existingResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const existing = await existingResponse.json();
    const e2eWorkflows = existing.data.filter(w => w.name.includes('E2E'));
    
    console.log(`Found ${e2eWorkflows.length} E2E test workflows:`);
    e2eWorkflows.forEach(w => {
      console.log(`  - ${w.name} (ID: ${w.id}, Active: ${w.active})`);
    });
    
    // If we have an E2E workflow, try to activate and test it
    if (e2eWorkflows.length > 0) {
      const testWorkflow = e2eWorkflows[0];
      console.log(`\n🔧 Working with workflow: ${testWorkflow.name} (${testWorkflow.id})`);
      
      // Try to activate it
      if (!testWorkflow.active) {
        console.log('⚡ Activating workflow...');
        const activateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${testWorkflow.id}/activate`, {
          method: 'POST',
          headers: { 'Cookie': sessionCookie }
        });
        
        console.log(`Activation response: ${activateResponse.status}`);
        
        if (activateResponse.ok) {
          console.log('✅ Workflow activated successfully');
        } else {
          const errorText = await activateResponse.text();
          console.log(`❌ Activation failed: ${errorText}`);
        }
      } else {
        console.log('✅ Workflow already active');
      }
      
      // Get workflow details to see the webhook path
      console.log('\n🔍 Getting workflow details...');
      const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${testWorkflow.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        const webhookNode = detail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        
        if (webhookNode) {
          console.log('📋 Webhook node details:');
          console.log(`   Path: ${webhookNode.parameters?.path || 'NOT SET'}`);
          console.log(`   Method: ${webhookNode.parameters?.httpMethod || 'NOT SET'}`);
          console.log(`   Auth: ${webhookNode.parameters?.authentication || 'none'}`);
          console.log(`   Credentials: ${JSON.stringify(webhookNode.credentials || {})}`);
          
          const webhookPath = webhookNode.parameters?.path;
          if (webhookPath) {
            console.log(`\n🧪 Testing webhook: https://automation.locod-ai.fr/webhook/${webhookPath}`);
            
            // Test with authentication
            const testResponse = await fetch(`https://automation.locod-ai.fr/webhook/${webhookPath}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Token': 'end-to-end-test-token-1753818251283'
              },
              body: JSON.stringify({
                name: 'Debug Test',
                email: 'debug@test.com',
                message: 'Testing activation'
              })
            });
            
            console.log(`📊 Test Status: ${testResponse.status}`);
            const testText = await testResponse.text();
            console.log(`📝 Test Response: ${testText}`);
            
            if (testResponse.status === 200) {
              console.log('🎉 SUCCESS! Webhook works with authentication!');
            } else if (testText.includes('Authorization data is wrong')) {
              console.log('❌ Authentication still failing');
            } else if (testResponse.status === 404) {
              console.log('❌ Webhook still not registered - activation issue');
            }
          }
        } else {
          console.log('❌ No webhook node found in workflow');
        }
      }
      
    } else {
      console.log('No E2E test workflows found - need to create one manually');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWorkflowCreation();