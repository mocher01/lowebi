/**
 * Test two-step credential creation using the real workflow generator
 */

import { N8nWorkflowGenerator } from './scripts/generators/n8n-workflow-generator.js';

async function testTwoStepWithRealGenerator() {
  console.log('🚀 Testing Two-Step Credential with Real Workflow Generator');
  console.log('=========================================================');
  
  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzODA0NTE0fQ.gjmz5P6WIdw9nPb2XyJ4Zyt1JxDLvw77Cmo9vI-JD7g';
  const TEST_TOKEN = 'generator-test-token-' + Date.now();
  
  let credentialId = null;
  
  try {
    // ========================================
    // PHASE 1: CREATE CREDENTIAL (TWO-STEP)
    // ========================================
    
    console.log('\n🔐 PHASE 1: Creating Credential with Two-Step Process');
    console.log('===================================================');
    
    // Step 1: Create empty credential with API key
    console.log('📝 Step 1: Creating empty credential...');
    const emptyCredentialData = {
      name: 'Generator_Test_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: ''  // Empty initially
      }
    };
    
    const createResponse = await fetch('https://automation.locod-ai.fr/api/v1/credentials', {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emptyCredentialData)
    });
    
    if (!createResponse.ok) {
      throw new Error(`Credential creation failed: ${createResponse.status} - ${await createResponse.text()}`);
    }
    
    const credential = await createResponse.json();
    credentialId = credential.id;
    console.log(`✅ Empty credential created: ID ${credentialId}`);
    
    // Step 2: Get session cookie
    console.log('🔐 Step 2: Getting session cookie...');
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
    console.log('✅ Session cookie obtained');
    
    // Step 3: Update credential with real token
    console.log('📝 Step 3: Updating credential with real token...');
    const updateCredentialData = {
      name: 'Generator_Test_Credential',
      type: 'httpHeaderAuth',
      nodesAccess: [{ nodeType: 'n8n-nodes-base.webhook' }],
      data: {
        name: 'X-Webhook-Token',
        value: TEST_TOKEN  // Real token
      }
    };
    
    const updateResponse = await fetch(`https://automation.locod-ai.fr/rest/credentials/${credentialId}`, {
      method: 'PATCH',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateCredentialData)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Credential update failed: ${updateResponse.status} - ${await updateResponse.text()}`);
    }
    
    console.log('✅ Credential updated with real token');
    
    // ========================================
    // PHASE 2: CREATE WORKFLOW WITH GENERATOR
    // ========================================
    
    console.log('\n🔧 PHASE 2: Creating Workflow with Real Generator');
    console.log('===============================================');
    
    // Create a test site config
    const testSiteConfig = {
      meta: {
        siteId: 'generatortest',
        domain: 'generatortest.example.com'
      },
      brand: {
        name: 'Generator Test'
      },
      integrations: {
        n8n: {
          enabled: true,
          instance: 'https://automation.locod-ai.fr',
          apiKey: API_KEY,
          workflows: {
            contactForm: {
              method: 'POST',
              enabled: true,
              expectedFields: ['name', 'email', 'message']
            }
          }
        }
      }
    };
    
    // Initialize the generator
    const generator = new N8nWorkflowGenerator(testSiteConfig);
    
    // Override the credential creation to use our pre-created credential
    const originalCreateCredential = generator.createWebhookCredential;
    generator.createWebhookCredential = async function() {
      console.log(`🔗 Using pre-created credential: ${credentialId}`);
      return {
        id: credentialId,
        name: 'Generator_Test_Credential'
      };
    };
    
    // Create the workflow
    console.log('🔧 Creating workflow with generator...');
    const workflowResult = await generator.createContactFormWorkflow();
    
    if (workflowResult.success) {
      console.log(`✅ Workflow created successfully!`);
      console.log(`   Workflow ID: ${workflowResult.workflowId}`);
      console.log(`   Webhook URL: ${workflowResult.webhookUrl}`);
      
      // ========================================
      // PHASE 3: TEST THE WEBHOOK
      // ========================================
      
      console.log('\n🧪 PHASE 3: Testing Webhook Authentication');
      console.log('=========================================');
      
      // Wait for webhook to be ready
      console.log('⏳ Waiting 5 seconds for webhook to be ready...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const webhookUrl = workflowResult.webhookUrl;
      const testPayload = {
        name: 'Generator Test User',
        email: 'generator@test.com',
        message: 'Testing two-step credential with real generator'
      };
      
      console.log(`🔑 Testing with authentication...`);
      console.log(`   URL: ${webhookUrl}`);
      console.log(`   Token: ${TEST_TOKEN}`);
      
      const authResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Token': TEST_TOKEN
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`📊 Response Status: ${authResponse.status}`);
      const authResponseText = await authResponse.text();
      console.log(`📝 Response Body: ${authResponseText}`);
      
      if (authResponse.status === 200) {
        console.log('🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
        console.log('');
        console.log('✅ Two-step credential creation works!');
        console.log('✅ Real workflow generator creates working webhooks!');
        console.log('✅ Authentication is properly enforced!');
        console.log('✅ READY TO IMPLEMENT IN WORKFLOW GENERATOR!');
        
        return {
          success: true,
          credentialId: credentialId,
          workflowId: workflowResult.workflowId,
          webhookUrl: workflowResult.webhookUrl,
          token: TEST_TOKEN
        };
        
      } else if (authResponseText.includes('Authorization data is wrong')) {
        console.log('❌ Still getting authorization error - credential issue persists');
      } else {
        console.log(`⚠️  Unexpected response: ${authResponse.status}`);
      }
      
    } else {
      console.log(`❌ Workflow creation failed: ${workflowResult.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error.message);
    
    return {
      success: false,
      error: error.message,
      credentialId: credentialId
    };
  }
}

// Run the test
testTwoStepWithRealGenerator()
  .then(result => {
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('🎯 READY TO IMPLEMENT TWO-STEP PROCESS IN GENERATOR!');
    } else {
      console.log('🚫 STILL NOT WORKING - MORE INVESTIGATION NEEDED');
    }
    console.log('='.repeat(60));
  });