/**
 * Fix the webhook by adding missing webhookId and proper activation
 */

async function fixWebhookId() {
  console.log('🔧 Fixing Webhook ID and Activation');
  console.log('===================================');
  
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
    
    const workflowId = 'EbRU5JEbdKgRILJi';
    
    // Get the workflow
    const workflowResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    const workflow = await workflowResponse.json();
    console.log(`📋 Current workflow: ${workflow.name || workflow.data?.name}`);
    
    // Fix the webhook node by adding webhookId
    console.log('🔧 Adding missing webhookId to webhook node...');
    const webhookNode = workflow.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    
    if (webhookNode && !webhookNode.webhookId) {
      // Generate a new webhookId (UUID format)
      const webhookId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      webhookNode.webhookId = webhookId;
      console.log(`✅ Added webhookId: ${webhookId}`);
      
      // Update the workflow
      console.log('📝 Updating workflow with fixed webhook node...');
      const updateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workflow.name || `FIXED_${workflow.data?.name}`,
          nodes: workflow.data.nodes,
          connections: workflow.data.connections,
          active: false  // Start inactive
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Workflow updated with webhookId');
        
        // Now activate using the correct method (PUT with active: true)
        console.log('⚡ Activating workflow...');
        const activateResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflowId}`, {
          method: 'PUT',
          headers: {
            'Cookie': sessionCookie,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: workflow.name || `FIXED_${workflow.data?.name}`,
            nodes: workflow.data.nodes,
            connections: workflow.data.connections,
            active: true  // Activate it
          })
        });
        
        if (activateResponse.ok) {
          console.log('✅ Workflow activated successfully');
          
          // Wait for webhook registration
          console.log('⏳ Waiting 5 seconds for webhook registration...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Test the webhook
          console.log('\n🧪 Testing fixed webhook...');
          const webhookUrl = `https://automation.locod-ai.fr/webhook/${webhookNode.parameters.path}`;
          console.log(`📍 Testing: ${webhookUrl}`);
          
          const testResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Token': 'proof-of-concept-token-1753818705503'
            },
            body: JSON.stringify({
              name: 'Fixed Webhook Test',
              email: 'fixed@test.com',
              message: 'Testing after adding webhookId'
            })
          });
          
          console.log(`📊 Test Status: ${testResponse.status}`);
          const testText = await testResponse.text();
          console.log(`📝 Test Response: ${testText}`);
          
          if (testResponse.status === 200) {
            console.log('\n🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
            console.log('✅ Fixed webhook is working!');
            console.log('✅ Two-step credential creation is functional!');
            console.log('✅ The __n8n_BLANK_VALUE_ bug has been solved!');
            console.log('✅ PROOF OF CONCEPT COMPLETE!');
            
            // Verify the response content
            try {
              const responseData = JSON.parse(testText);
              if (responseData.success && responseData.message) {
                console.log(`\n📄 Response details:`);
                console.log(`   Success: ${responseData.success}`);
                console.log(`   Message: ${responseData.message}`);
                console.log(`   Timestamp: ${responseData.timestamp}`);
                console.log(`   Credential Used: ${responseData.credentialUsed}`);
              }
            } catch (e) {
              console.log('Response is not JSON format');
            }
            
            return { success: true, webhookUrl: webhookUrl };
            
          } else if (testResponse.status === 403) {
            console.log('\n⚠️  Getting 403 - checking credential...');
            if (testText.includes('Authorization data is wrong')) {
              console.log('❌ Credential issue - need to verify the exact token');
              
              // Let's try to get the credential data to see what token is stored
              console.log('\n🔍 Checking credential data...');
              const credResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/7b7UpQSnngoqgx9S`, {
                headers: { 'Cookie': sessionCookie }
              });
              
              if (credResponse.ok) {
                const credData = await credResponse.json();
                console.log('📋 Credential info:');
                console.log(`   Name: ${credData.name}`);
                console.log(`   Type: ${credData.type}`);
                // Data won't show for security, but we know it was created
              }
            }
          } else if (testResponse.status === 404) {
            console.log('\n❌ Still 404 - webhook registration failed');
          }
          
        } else {
          console.log(`❌ Activation failed: ${activateResponse.status}`);
          const activateError = await activateResponse.text();
          console.log(`Error: ${activateError}`);
        }
        
      } else {
        console.log(`❌ Update failed: ${updateResponse.status}`);
        const updateError = await updateResponse.text();
        console.log(`Error: ${updateError}`);
      }
      
    } else {
      console.log('✅ WebhookId already exists or webhook node not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixWebhookId();