/**
 * Test the EXACT field structure N8N expects for header authentication
 */

async function testCorrectHeaderAuthFields() {
  console.log('🔍 Testing Correct Header Auth Field Structure');
  console.log('===============================================');
  
  try {
    // Step 1: Login
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
    
    // Step 2: Check existing working credentials to see their structure
    console.log('🔍 Analyzing existing credential structures...');
    const credResponse = await fetch('https://automation.locod-ai.fr/rest/credentials', {
      headers: { 'Cookie': sessionCookie }
    });
    
    const credentials = await credResponse.json();
    const headerCreds = credentials.data.filter(cred => 
      cred.type === 'httpHeaderAuth' || cred.type === 'headerAuth'
    );
    
    if (headerCreds.length > 0) {
      console.log('✅ Found existing header credentials:');
      for (const cred of headerCreds) {
        console.log(`   - ${cred.name} (Type: ${cred.type}, ID: ${cred.id})`);
        
        // Get detailed credential data
        const detailResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${cred.id}`, {
          headers: { 'Cookie': sessionCookie }
        });
        
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          console.log(`     Data structure:`, JSON.stringify(detail.data, null, 6));
        }
      }
    } else {
      console.log('⚠️  No existing header credentials found');
    }
    
    // Step 3: Test different field structures
    const testToken = 'test-token-' + Date.now();
    
    const testStructures = [
      {
        name: 'Test1-apiToken',
        data: { apiToken: testToken }
      },
      {
        name: 'Test2-token', 
        data: { token: testToken }
      },
      {
        name: 'Test3-value',
        data: { value: testToken }
      },
      {
        name: 'Test4-headerValue',
        data: { headerValue: testToken }
      },
      {
        name: 'Test5-name-value',
        data: { 
          name: 'X-Webhook-Token',
          value: testToken 
        }
      }
    ];
    
    console.log('🧪 Testing different field structures...');
    
    for (const test of testStructures) {
      console.log(`\n🔬 Testing: ${test.name}`);
      console.log(`   Data: ${JSON.stringify(test.data)}`);
      
      const credentialData = {
        name: test.name,
        type: 'httpHeaderAuth',
        nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
        data: test.data
      };
      
      try {
        const createResponse = await fetch('https://automation.locod-ai.fr/rest/credentials', {
          method: 'POST',
          headers: {
            'Cookie': sessionCookie,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentialData)
        });
        
        if (createResponse.ok) {
          const created = await createResponse.json();
          console.log(`   ✅ Created ID: ${created.id}`);
          
          // Immediately check what was stored
          const verifyResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${created.id}`, {
            headers: { 'Cookie': sessionCookie }
          });
          
          if (verifyResponse.ok) {
            const verified = await verifyResponse.json();
            console.log(`   📝 Stored data:`, JSON.stringify(verified.data, null, 6));
            
            // Check for __n8n_BLANK_VALUE_
            const dataStr = JSON.stringify(verified.data);
            if (dataStr.includes('__n8n_BLANK_VALUE_')) {
              console.log(`   ❌ Contains __n8n_BLANK_VALUE_!`);
            } else {
              console.log(`   ✅ No __n8n_BLANK_VALUE_ found!`);
            }
          }
          
          // Clean up - delete test credential
          await fetch(`https://automation.locod-ai.fr/rest/credentials/${created.id}`, {
            method: 'DELETE',
            headers: { 'Cookie': sessionCookie }
          });
          
        } else {
          const error = await createResponse.text();
          console.log(`   ❌ Failed: ${createResponse.status} - ${error}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCorrectHeaderAuthFields();