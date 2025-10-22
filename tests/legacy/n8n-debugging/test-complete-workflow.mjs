/**
 * Complete end-to-end test: Create N8N workflow with working credential and test webhook
 */

import N8nWorkflowGenerator from './scripts/generators/n8n-workflow-generator.js';
import crypto from 'crypto';

const TEST_SITE = 'test-complete';
const TEST_TOKEN = crypto.randomBytes(32).toString('hex');
const N8N_BASE_URL = 'https://automation.locod-ai.fr';

async function testCompleteWorkflow() {
  try {
    console.log('🚀 COMPLETE N8N WORKFLOW TEST');
    console.log('=============================');
    console.log(`📋 Test Site: ${TEST_SITE}`);
    console.log(`🔑 Test Token: ${TEST_TOKEN}`);
    console.log('');

    const generator = new N8nWorkflowGenerator();

    // Step 1: Create Header Auth credential
    console.log('🔐 STEP 1: Creating Header Auth Credential...');
    console.log('─'.repeat(50));
    
    const credResult = await generator.createHeaderAuthCredential(TEST_SITE, TEST_TOKEN);
    
    if (!credResult.success) {
      throw new Error(`Credential creation failed: ${credResult.error}`);
    }
    
    console.log(`✅ Credential created: ${credResult.credential.name} (ID: ${credResult.credential.id})`);
    console.log(`📝 Message: ${credResult.message}`);
    
    const credentialId = credResult.credential.id;

    // Step 2: Create complete workflow
    console.log('\n🔧 STEP 2: Creating Complete Workflow...');
    console.log('─'.repeat(50));
    
    const siteConfig = {
      integrations: {
        n8n: {
          enabled: true,
          instance: N8N_BASE_URL,
          flows: {
            contactForm: {
              config: {
                recipientEmail: 'test@example.com'
              }
            }
          }
        }
      }
    };
    
    const workflowResult = await generator.createWorkflowForSite(TEST_SITE, siteConfig);
    
    if (!workflowResult.success) {
      throw new Error(`Workflow creation failed: ${workflowResult.error}`);
    }
    
    console.log(`✅ Workflow created: ${workflowResult.workflow.name} (ID: ${workflowResult.workflow.id})`);
    
    const workflowId = workflowResult.workflow.id;

    // Step 3: Activate the workflow
    console.log('\n⚡ STEP 3: Activating Workflow...');
    console.log('─'.repeat(50));
    
    const activateResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': generator.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      throw new Error(`Workflow activation failed: ${activateResponse.status} - ${errorText}`);
    }
    
    console.log('✅ Workflow activated successfully');

    // Step 4: Test the webhook
    console.log('\n🧪 STEP 4: Testing Webhook Authentication...');
    console.log('─'.repeat(50));
    
    const webhookUrl = `${N8N_BASE_URL}/webhook/${TEST_SITE}-contact`;
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`🔑 Using Token: ${TEST_TOKEN}`);
    
    // Test with correct token
    console.log('\n🔍 Testing with CORRECT token...');
    const correctResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': TEST_TOKEN
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Complete workflow test with correct token',
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`📊 Response Status: ${correctResponse.status} ${correctResponse.statusText}`);
    
    if (correctResponse.ok) {
      console.log('✅ SUCCESS: Webhook accepts correct token!');
      const responseText = await correctResponse.text();
      console.log(`📋 Response: ${responseText}`);
    } else {
      console.log('❌ FAILURE: Webhook rejected correct token');
      const errorText = await correctResponse.text();
      console.log(`❌ Error: ${errorText}`);
    }
    
    // Test with wrong token
    console.log('\n🔍 Testing with WRONG token...');
    const wrongResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'wrong-token-12345'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test with wrong token',
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`📊 Response Status: ${wrongResponse.status} ${wrongResponse.statusText}`);
    
    if (wrongResponse.status === 403) {
      console.log('✅ SUCCESS: Webhook correctly rejects wrong token!');
    } else {
      console.log('⚠️  UNEXPECTED: Webhook should reject wrong token with 403');
      const responseText = await wrongResponse.text();
      console.log(`📋 Response: ${responseText}`);
    }

    // Step 5: Verify workflow in N8N
    console.log('\n🔍 STEP 5: Verifying Workflow Configuration...');
    console.log('─'.repeat(50));
    
    const verifyResponse = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': generator.apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      const workflow = await verifyResponse.json();
      console.log(`✅ Workflow verified: ${workflow.name}`);
      console.log(`📊 Status: ${workflow.active ? 'Active' : 'Inactive'}`);
      console.log(`🔧 Nodes: ${workflow.nodes.length}`);
      
      // Find webhook node and check credential
      const webhookNode = workflow.nodes.find(node => node.type === 'n8n-nodes-base.webhook');
      if (webhookNode) {
        console.log(`🔗 Webhook Node: ${webhookNode.name}`);
        console.log(`🔐 Credential ID: ${webhookNode.credentials?.httpHeaderAuth?.id || 'None'}`);
        
        if (webhookNode.credentials?.httpHeaderAuth?.id === credentialId) {
          console.log('✅ SUCCESS: Correct credential is assigned to webhook!');
        } else {
          console.log('❌ FAILURE: Wrong or missing credential in webhook');
        }
      }
    }

    // Final Summary
    console.log('\n🎉 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Credential Created: ${credResult.credential.name} (${credentialId})`);
    console.log(`✅ Workflow Created: ${workflowResult.workflow.name} (${workflowId})`);
    console.log(`✅ Workflow Activated: Yes`);
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`🔑 Token: ${TEST_TOKEN}`);
    
    if (correctResponse.ok && wrongResponse.status === 403) {
      console.log('\n🎯 RESULT: COMPLETE SUCCESS! ✅');
      console.log('   - Credential properly created and configured');
      console.log('   - Webhook accepts correct token');
      console.log('   - Webhook rejects wrong token');
      console.log('   - Authentication system is working perfectly!');
    } else {
      console.log('\n⚠️  RESULT: PARTIAL SUCCESS');
      console.log('   - Workflow created but authentication may need manual adjustment');
    }

  } catch (error) {
    console.error('\n❌ COMPLETE TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCompleteWorkflow();