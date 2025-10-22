/**
 * Manual test to update the TESTFRESH credential directly
 */

const N8N_BASE_URL = 'https://automation.locod-ai.fr';
const ADMIN_EMAIL = 'gestion@locod-ai.com';
const ADMIN_PASSWORD = 'YouCanMakeITOK2025';
const TEST_TOKEN = '8f69005d92acda2a48b4ce0b04f11ed7a3ec478bb92a87a412e00da34399b724';
const CREDENTIAL_ID = '8IRuelpNSPMfnhH7'; // From debug output

async function manualCredentialUpdate() {
  try {
    console.log('🔐 Manual Credential Update Test');
    console.log('=================================');
    
    // Step 1: Get session cookie
    console.log('1️⃣ Getting session cookie...');
    const loginResponse = await fetch(`${N8N_BASE_URL}/rest/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrLdapLoginId: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies.split(',')[0].split(';')[0].trim();
    console.log('✅ Session cookie obtained');
    
    // Step 2: Get current credential
    console.log('\n2️⃣ Reading current credential...');
    const readResponse = await fetch(`${N8N_BASE_URL}/rest/credentials/${CREDENTIAL_ID}`, {
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    
    if (readResponse.ok) {
      const current = await readResponse.json();
      console.log('✅ Current credential:', JSON.stringify(current.data, null, 2));
    } else {
      console.log('❌ Cannot read credential:', readResponse.status);
    }
    
    // Step 3: Update credential with correct structure
    console.log('\n3️⃣ Updating credential...');
    const updateResponse = await fetch(`${N8N_BASE_URL}/rest/credentials/${CREDENTIAL_ID}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'TESTFRESH_Webhook_Auth',
        type: 'httpHeaderAuth',
        nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
        data: {
          name: 'X-Webhook-Token',
          value: TEST_TOKEN
        }
      })
    });

    if (updateResponse.ok) {
      const updated = await updateResponse.json();
      console.log('✅ Credential updated successfully');
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed:', updateResponse.status, errorText);
    }
    
    // Step 4: Verify the update
    console.log('\n4️⃣ Verifying update...');
    const verifyResponse = await fetch(`${N8N_BASE_URL}/rest/credentials/${CREDENTIAL_ID}`, {
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    
    if (verifyResponse.ok) {
      const verified = await verifyResponse.json();
      console.log('📋 Verified credential structure:', JSON.stringify(verified.data, null, 2));
    }
    
    // Step 5: Test the webhook
    console.log('\n5️⃣ Testing webhook...');
    const webhookResponse = await fetch(`${N8N_BASE_URL}/webhook/testfresh-contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': TEST_TOKEN
      },
      body: JSON.stringify({
        name: 'Manual Test',
        email: 'manual@test.com',
        message: 'Testing after manual credential update'
      })
    });
    
    console.log(`📡 Webhook test: ${webhookResponse.status} ${webhookResponse.statusText}`);
    const responseText = await webhookResponse.text();
    console.log(`📋 Response: ${responseText}`);
    
    if (webhookResponse.ok) {
      console.log('\n🎉 SUCCESS: Webhook is working!');
    } else if (webhookResponse.status === 403) {
      console.log('\n❌ FAILURE: Still getting authorization error');
    } else {
      console.log('\n⚠️  PARTIAL: Different error, check response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

manualCredentialUpdate();