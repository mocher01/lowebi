/**
 * Debug why the webhook isn't registering despite workflow being active
 */

async function debugWebhookRegistration() {
  console.log('🔍 Debugging Webhook Registration Issues');
  console.log('=======================================');
  
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
    
    const workflowId = 'EbRU5JEbdKgRILJi'; // PROOF workflow ID
    
    // Get detailed workflow info
    console.log('\n🔍 Getting detailed workflow info...');
    const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (!detailResponse.ok) {
      throw new Error(`Failed to get workflow: ${detailResponse.status}`);
    }
    
    const workflow = await detailResponse.json();
    console.log(`✅ Workflow: ${workflow.name}`);
    console.log(`   Active: ${workflow.active}`);
    console.log(`   Nodes: ${workflow.data.nodes.length}`);
    
    // Check each node
    console.log('\n📋 Analyzing nodes:');
    workflow.data.nodes.forEach((node, i) => {
      console.log(`   ${i+1}. ${node.name} (${node.type})`);
      if (node.type === 'n8n-nodes-base.webhook') {
        console.log(`      Path: ${node.parameters?.path}`);
        console.log(`      Method: ${node.parameters?.httpMethod}`);
        console.log(`      Auth: ${node.parameters?.authentication}`);
        console.log(`      Webhook ID: ${node.webhookId || 'MISSING!'}`);
        console.log(`      Credentials: ${JSON.stringify(node.credentials)}`);
      }
    });
    
    // Try to deactivate and reactivate
    console.log('\n🔄 Trying deactivate/reactivate cycle...');
    
    // Deactivate
    const deactivateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}/deactivate`, {
      method: 'POST',
      headers: { 'Cookie': sessionCookie }
    });
    
    console.log(`Deactivate status: ${deactivateResponse.status}`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reactivate
    const reactivateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: { 'Cookie': sessionCookie }
    });
    
    console.log(`Reactivate status: ${reactivateResponse.status}`);
    
    if (reactivateResponse.ok) {
      console.log('✅ Reactivation successful');
      
      // Wait for registration
      console.log('⏳ Waiting 5 seconds for webhook registration...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test webhook again
      console.log('\n🧪 Testing webhook after reactivation...');
      const testResponse = await fetch('https://automation.locod-ai.fr/webhook/proof-test-1753818705503', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': 'proof-of-concept-token-1753818705503'
        },
        body: JSON.stringify({
          name: 'Reactivation Test',
          email: 'reactivation@test.com',
          message: 'Testing after reactivation'
        })
      });
      
      console.log(`📊 Test Status: ${testResponse.status}`);
      const testText = await testResponse.text();
      console.log(`📝 Test Response: ${testText}`);
      
      if (testResponse.status === 200) {
        console.log('\n🎉 SUCCESS! Webhook works after reactivation!');
        console.log('✅ The two-step credential process is working!');
        
        // Parse the response to see if our workflow executed
        try {
          const responseData = JSON.parse(testText);
          if (responseData.success && responseData.message.includes('PROOF OF CONCEPT')) {
            console.log('✅ Our custom response confirms it\'s working!');
            console.log(`✅ Credential ID used: ${responseData.credentialUsed}`);
          }
        } catch (e) {
          console.log('Response is not JSON, but request succeeded');
        }
        
      } else if (testResponse.status === 403) {
        console.log('\n⚠️  Getting 403 - let\'s check if it\'s auth or credential issue...');
        const errorText = testText;
        if (errorText.includes('Authorization data is wrong')) {
          console.log('❌ Still credential issue - need to verify token value');
        } else {
          console.log('❌ Different auth issue');
        }
      } else if (testResponse.status === 404) {
        console.log('\n❌ Still not registered - deeper issue with workflow');
      }
      
    } else {
      console.log(`❌ Reactivation failed: ${reactivateResponse.status}`);
      const errorText = await reactivateResponse.text();
      console.log(`Error: ${errorText}`);
    }
    
    // Check executions one more time
    console.log('\n📊 Final execution check...');
    const executionsResponse = await fetch(`https://automation.locod-ai.fr/rest/executions?filter=${encodeURIComponent(JSON.stringify({workflowId: workflowId}))}&limit=5`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (executionsResponse.ok) {
      const executions = await executionsResponse.json();
      if (executions.data && executions.data.length > 0) {
        console.log(`Found ${executions.data.length} executions:`);
        executions.data.forEach((exec, i) => {
          console.log(`  ${i+1}. ${exec.id} - ${exec.status} - ${exec.mode} (${exec.startedAt})`);
        });
        
        // Get details of the latest execution
        const latestExecution = executions.data[0];
        const execDetailResponse = await fetch(`https://automation.locod-ai.fr/rest/executions/${latestExecution.id}`, {
          headers: { 'Cookie': sessionCookie }
        });
        
        if (execDetailResponse.ok) {
          const execDetail = await execDetailResponse.json();
          console.log(`\n📋 Latest execution details:`);
          console.log(`   Status: ${execDetail.status}`);
          console.log(`   Finished: ${execDetail.finished}`);
          if (execDetail.data && execDetail.data.resultData) {
            console.log(`   Result: ${JSON.stringify(execDetail.data.resultData, null, 2)}`);
          }
        }
      } else {
        console.log('No executions found');
      }
    } else {
      console.log(`Failed to get executions: ${executionsResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWebhookRegistration();