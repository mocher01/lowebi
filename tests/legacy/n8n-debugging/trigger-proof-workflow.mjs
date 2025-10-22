/**
 * Find and trigger the PROOF workflow manually
 */

async function triggerProofWorkflow() {
  console.log('🔍 Finding and Triggering PROOF Workflow');
  console.log('========================================');
  
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
    
    // Find PROOF workflows
    console.log('\n🔍 Finding PROOF workflows...');
    const workflowsResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const workflows = await workflowsResponse.json();
    const proofWorkflows = workflows.data.filter(w => w.name.includes('PROOF'));
    
    console.log(`Found ${proofWorkflows.length} PROOF workflows:`);
    proofWorkflows.forEach(w => {
      console.log(`  - ${w.name} (ID: ${w.id}, Active: ${w.active})`);
    });
    
    if (proofWorkflows.length > 0) {
      const latestProof = proofWorkflows.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      
      console.log(`\n🎯 Using latest PROOF workflow: ${latestProof.name}`);
      console.log(`   ID: ${latestProof.id}`);
      console.log(`   Active: ${latestProof.active}`);
      
      // Get workflow details
      const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${latestProof.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        const webhookNode = detail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
        
        if (webhookNode) {
          const webhookPath = webhookNode.parameters?.path;
          const authType = webhookNode.parameters?.authentication;
          const credentials = webhookNode.credentials;
          
          console.log('\n📋 Webhook Details:');
          console.log(`   Path: ${webhookPath}`);
          console.log(`   Auth: ${authType || 'none'}`);
          console.log(`   Credentials: ${JSON.stringify(credentials, null, 2)}`);
          
          if (webhookPath) {
            const webhookUrl = `https://automation.locod-ai.fr/webhook/${webhookPath}`;
            console.log(`   Full URL: ${webhookUrl}`);
            
            // If it's not active, try to activate it
            if (!latestProof.active) {
              console.log('\n⚡ Activating workflow...');
              const activateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${latestProof.id}/activate`, {
                method: 'POST',
                headers: { 'Cookie': sessionCookie }
              });
              
              if (activateResponse.ok) {
                console.log('✅ Workflow activated');
                
                // Wait a moment
                console.log('⏳ Waiting 3 seconds for activation...');
                await new Promise(resolve => setTimeout(resolve, 3000));
              } else {
                console.log(`❌ Activation failed: ${activateResponse.status}`);
              }
            }
            
            // Now test the webhook
            console.log('\n🧪 Testing webhook...');
            
            // First, let's test without authentication to see the response
            console.log('🔓 Test 1: Without authentication...');
            const noAuthResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                message: 'Testing PROOF workflow'
              })
            });
            
            console.log(`   Status: ${noAuthResponse.status}`);
            const noAuthText = await noAuthResponse.text();
            console.log(`   Response: ${noAuthText}`);
            
            // If it requires auth, try with the token from our credential
            if (authType === 'headerAuth' && (noAuthResponse.status === 403 || noAuthText.includes('Authorization'))) {
              console.log('\n🔑 Test 2: With authentication...');
              
              // We know we created a credential, let's use the token pattern
              const testToken = 'proof-of-concept-token-1753818705503'; // From our earlier test
              
              const authResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Webhook-Token': testToken
                },
                body: JSON.stringify({
                  name: 'Auth Test User',
                  email: 'authtest@example.com',
                  message: 'Testing with authentication'
                })
              });
              
              console.log(`   Status: ${authResponse.status}`);
              const authText = await authResponse.text();
              console.log(`   Response: ${authText}`);
              
              if (authResponse.status === 200) {
                console.log('\n🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
                console.log('✅ The PROOF workflow works with authentication!');
                console.log('✅ Two-step credential creation is functional!');
                console.log('✅ The __n8n_BLANK_VALUE_ bug has been solved!');
              } else if (authText.includes('Authorization data is wrong')) {
                console.log('\n❌ Still getting authorization error');
                console.log('Need to check the exact token used in the credential');
              }
            } else if (noAuthResponse.status === 200) {
              console.log('\n✅ Webhook works! (No authentication required)');
            } else if (noAuthResponse.status === 404) {
              console.log('\n❌ Webhook not registered yet');
            }
            
            // Check execution history
            console.log('\n📊 Checking execution history...');
            const executionsResponse = await fetch(`https://automation.locod-ai.fr/rest/executions?filter=${JSON.stringify({workflowId: latestProof.id})}&limit=5`, {
              headers: { 'Cookie': sessionCookie }
            });
            
            if (executionsResponse.ok) {
              const executions = await executionsResponse.json();
              console.log(`Found ${executions.data.length} executions:`);
              executions.data.forEach((exec, i) => {
                console.log(`  ${i+1}. ${exec.id} - ${exec.status} (${exec.startedAt})`);
              });
            }
          }
        } else {
          console.log('❌ No webhook node found in workflow');
        }
      } else {
        console.log(`❌ Failed to get workflow details: ${detailResponse.status}`);
      }
    } else {
      console.log('❌ No PROOF workflows found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerProofWorkflow();