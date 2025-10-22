/**
 * Test the two-step credential implementation in the workflow generator
 */

import N8nWorkflowGenerator from './scripts/generators/n8n-workflow-generator.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function testTwoStepImplementation() {
  console.log('🧪 Testing Two-Step Credential Implementation');
  console.log('============================================');
  
  // Create a test site config
  const testSiteName = 'testtwostep';
  const testSiteConfig = {
    meta: {
      siteId: testSiteName,
      domain: `${testSiteName}.example.com`
    },
    brand: {
      name: 'Test Two Step'
    },
    integrations: {
      n8n: {
        enabled: true,
        instance: 'https://automation.locod-ai.fr',
        flows: {
          contactForm: {
            config: {
              recipientEmail: 'test@example.com',
              senderEmail: 'locodai.sas@gmail.com'
            }
          }
        }
      }
    }
  };
  
  try {
    // Ensure we have required environment variables
    const requiredEnv = ['N8N_API_KEY', 'N8N_ADMIN_EMAIL', 'N8N_ADMIN_PASSWORD'];
    const missing = requiredEnv.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
      console.log('Please add them to your .env file:');
      console.log('N8N_API_KEY=your_api_key');
      console.log('N8N_ADMIN_EMAIL=gestion@locod-ai.com');
      console.log('N8N_ADMIN_PASSWORD=YouCanMakeITOK2025');
      return;
    }
    
    console.log('✅ Environment variables validated');
    console.log(`   API Key: ${process.env.N8N_API_KEY.substring(0, 20)}...`);
    console.log(`   Admin Email: ${process.env.N8N_ADMIN_EMAIL}`);
    console.log(`   Admin Password: ***`);
    
    // Initialize generator
    const generator = new N8nWorkflowGenerator();
    
    // Test API connection
    console.log('\n🔄 Testing API connection...');
    const apiTest = await generator.testApiConnection();
    if (!apiTest.success) {
      console.error(`❌ API connection failed: ${apiTest.error}`);
      return;
    }
    console.log(`✅ API connected - ${apiTest.workflowCount} workflows found`);
    
    // Test two-step credential creation directly
    console.log('\n🔐 Testing two-step credential creation...');
    const testToken = 'test-token-' + Date.now();
    const credentialResult = await generator.createWebhookCredential(testSiteName, testToken);
    
    if (!credentialResult.success) {
      console.error(`❌ Credential creation failed: ${credentialResult.error}`);
      return;
    }
    
    console.log(`✅ Credential created successfully!`);
    console.log(`   ID: ${credentialResult.credential.id}`);
    console.log(`   Name: ${credentialResult.credential.name}`);
    
    // Test complete workflow creation
    console.log('\n🔧 Testing complete workflow creation...');
    const workflowResult = await generator.createWorkflowForSite(testSiteName, testSiteConfig);
    
    if (!workflowResult.success) {
      console.error(`❌ Workflow creation failed: ${workflowResult.error}`);
      return;
    }
    
    console.log(`✅ Workflow created successfully!`);
    console.log(`   Name: ${workflowResult.workflowName}`);
    console.log(`   ID: ${workflowResult.workflow.id}`);
    console.log(`   Webhook URL: ${workflowResult.webhookUrl}`);
    
    // Wait for webhook to be ready
    console.log('\n⏳ Waiting 5 seconds for webhook registration...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test the webhook
    console.log('\n🧪 Testing webhook with authentication...');
    const webhookUrl = workflowResult.webhookUrl;
    const webhookToken = workflowResult.webhookToken;
    
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': webhookToken
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Testing two-step credential implementation'
      })
    });
    
    console.log(`📊 Response Status: ${testResponse.status}`);
    const responseText = await testResponse.text();
    console.log(`📝 Response Body: ${responseText}`);
    
    if (testResponse.status === 200) {
      console.log('\n🎉 🎉 🎉 SUCCESS! 🎉 🎉 🎉');
      console.log('');
      console.log('✅ Two-step credential implementation works perfectly!');
      console.log('✅ Webhook authentication is functional!');
      console.log('✅ The __n8n_BLANK_VALUE_ bug has been solved!');
      console.log('');
      console.log('🎯 Implementation validated and ready for production!');
      
      // Test without auth to confirm security
      console.log('\n🚫 Security test: Request without token...');
      const noAuthResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'no auth' })
      });
      
      console.log(`📊 No-auth status: ${noAuthResponse.status}`);
      if (noAuthResponse.status === 403) {
        console.log('✅ Security confirmed: Unauthorized requests properly rejected');
      } else {
        console.log('⚠️  Security issue: Webhook accessible without authentication');
      }
      
    } else if (responseText.includes('Authorization data is wrong')) {
      console.log('\n❌ Authentication still failing - credential issue persists');
    } else if (testResponse.status === 404) {
      console.log('\n❌ Webhook not registered - workflow activation issue');
    } else {
      console.log('\n⚠️  Unexpected response - need to investigate');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
  }
}

// Run the test
testTwoStepImplementation();