/**
 * Analyze the exact structure of a working workflow
 */

async function analyzeWorkingWorkflow() {
  console.log('🔍 Analyzing Working Workflow Structure');
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
    
    // Get all workflows
    console.log('\n🔍 Finding working workflows...');
    const workflowsResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const workflows = await workflowsResponse.json();
    console.log(`Found ${workflows.data.length} total workflows`);
    
    // Look for active workflows with webhooks
    const activeWorkflows = workflows.data.filter(w => w.active);
    console.log(`Found ${activeWorkflows.length} active workflows:`);
    
    for (const workflow of activeWorkflows) {
      console.log(`\n📋 WORKFLOW: ${workflow.name}`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Active: ${workflow.active}`);
      console.log(`   Created: ${workflow.createdAt}`);
      console.log(`   Updated: ${workflow.updatedAt}`);
      
      // Get detailed structure
      const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${workflow.id}`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (detailResponse.ok) {
        const detail = await detailResponse.json();
        
        if (detail.data && detail.data.nodes) {
          const webhookNode = detail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
          
          if (webhookNode) {
            console.log('   🌐 WEBHOOK NODE FOUND:');
            console.log(`      Path: ${webhookNode.parameters?.path}`);
            console.log(`      Method: ${webhookNode.parameters?.httpMethod}`);
            console.log(`      Auth: ${webhookNode.parameters?.authentication || 'none'}`);
            console.log(`      Type Version: ${webhookNode.typeVersion}`);
            
            if (webhookNode.credentials) {
              console.log('      Credentials:');
              console.log(`        ${JSON.stringify(webhookNode.credentials, null, 8)}`);
            } else {
              console.log('      Credentials: none');
            }
            
            // Test this webhook to see if it works
            const webhookPath = webhookNode.parameters?.path;
            if (webhookPath) {
              console.log(`\n   🧪 Testing webhook: ${webhookPath}`);
              
              const testResponse = await fetch(`https://automation.locod-ai.fr/webhook/${webhookPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'analysis' })
              });
              
              console.log(`      Status: ${testResponse.status}`);
              if (testResponse.status === 200) {
                console.log('      ✅ WORKING! This webhook is functional');
                
                // This is a working workflow - let's copy its exact structure
                console.log('\n   📋 FULL WORKING WORKFLOW STRUCTURE:');
                console.log('   ====================================');
                console.log(JSON.stringify(detail.data, null, 2));
                
                // If this is working without auth, let's try to create one with auth
                if (!webhookNode.parameters?.authentication || webhookNode.parameters.authentication === 'none') {
                  console.log('\n   💡 This workflow has NO AUTHENTICATION');
                  console.log('   This explains why it works - no credential issues!');
                }
                
                break; // Found a working one, that's enough
              } else {
                console.log(`      ❌ Not working: ${testResponse.status}`);
              }
            }
          } else {
            console.log('   📄 No webhook node found');
          }
        } else {
          console.log('   ❌ No nodes data found');
        }
      } else {
        console.log(`   ❌ Failed to get details: ${detailResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeWorkingWorkflow();