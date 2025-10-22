/**
 * Check JWT workflow configuration
 */

async function checkJWTWorkflow() {
  console.log('🔍 Checking JWT Workflow Configuration');
  console.log('=====================================');
  
  try {
    // Step 1: Login to get session cookie
    console.log('🔐 Step 1: Getting session cookie...');
    const loginResponse = await fetch('https://automation.locod-ai.fr/rest/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrLdapLoginId: 'gestion@locod-ai.com',
        password: 'YouCanMakeITOK2025'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies.split(',')[0].split(';')[0];
    console.log('✅ Session cookie obtained');
    
    // Step 2: Get all workflows
    console.log('🔍 Step 2: Finding JWT workflow...');
    const workflowsResponse = await fetch('https://automation.locod-ai.fr/rest/workflows', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (!workflowsResponse.ok) {
      throw new Error(`Failed to get workflows: ${workflowsResponse.status}`);
    }
    
    const workflows = await workflowsResponse.json();
    const jwtWorkflow = workflows.data.find(w => w.name === 'JW_FormulaireMail');
    
    if (!jwtWorkflow) {
      console.log('❌ JWT workflow not found');
      return;
    }
    
    console.log(`✅ Found workflow: ${jwtWorkflow.name} (ID: ${jwtWorkflow.id})`);
    console.log(`   Active: ${jwtWorkflow.active}`);
    
    // Step 3: Get detailed workflow configuration
    console.log('🔍 Step 3: Getting workflow details...');
    const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/workflows/${jwtWorkflow.id}`, {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (!detailResponse.ok) {
      throw new Error(`Failed to get workflow details: ${detailResponse.status}`);
    }
    
    const workflowDetail = await detailResponse.json();
    console.log(`✅ Retrieved workflow details`);
    
    // Step 4: Find webhook node
    console.log('🔍 Step 4: Analyzing webhook node...');
    if (!workflowDetail.data || !workflowDetail.data.nodes) {
      console.log('❌ No nodes found in workflow');
      return;
    }
    
    const webhookNode = workflowDetail.data.nodes.find(n => n.type === 'n8n-nodes-base.webhook');
    
    if (!webhookNode) {
      console.log('❌ Webhook node not found');
      return;
    }
    
    console.log('✅ Webhook node found');
    console.log(`   Node name: ${webhookNode.name}`);
    console.log(`   Authentication type: ${webhookNode.parameters?.authentication || 'none'}`);
    console.log(`   Webhook path: ${webhookNode.parameters?.path || 'not set'}`);
    
    if (webhookNode.credentials) {
      console.log('   Credentials:');
      console.log(`     ${JSON.stringify(webhookNode.credentials, null, 6)}`);
    } else {
      console.log('   Credentials: none');
    }
    
    // Step 5: Check all credentials to find JWT credential
    console.log('🔍 Step 5: Checking available credentials...');
    const credResponse = await fetch('https://automation.locod-ai.fr/rest/credentials', {
      headers: { 'Cookie': sessionCookie }
    });
    
    if (credResponse.ok) {
      const credentials = await credResponse.json();
      const jwtCredentials = credentials.data.filter(cred => 
        cred.name.includes('JWT') || cred.type === 'jwtAuth'
      );
      
      if (jwtCredentials.length > 0) {
        console.log('✅ JWT credentials found:');
        jwtCredentials.forEach(cred => {
          console.log(`     - ${cred.name} (Type: ${cred.type}, ID: ${cred.id})`);
        });
      } else {
        console.log('❌ No JWT credentials found');
      }
    }
    
    console.log('\n🎯 Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the check
checkJWTWorkflow();