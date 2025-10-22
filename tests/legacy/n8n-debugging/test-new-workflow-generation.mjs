/**
 * Test new workflow generation with proper authentication
 * Based on working auth pattern: Header Auth with real token values
 */

import N8nWorkflowGenerator from './scripts/generators/n8n-workflow-generator.js';

// Mock site configuration for testing
const testSiteConfig = {
  meta: {
    siteId: "testgenerated",
    domain: "testgenerated.locod-ai.com"
  },
  brand: {
    name: "Test Generated Site"
  },
  integrations: {
    n8n: {
      flows: {
        contactForm: {
          config: {
            recipientEmail: "test@testgenerated.com",
            senderEmail: "locodai.sas@gmail.com",
            replyToEmail: "test@testgenerated.com"
          }
        }
      }
    }
  }
};

async function testWorkflowGeneration() {
  console.log('🚀 Testing N8N Workflow Generation with Proper Authentication');
  console.log('==========================================================');

  try {
    // Set environment variables for testing
    process.env.N8N_INSTANCE_URL = 'https://automation.locod-ai.com';
    process.env.N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwd WJsaWMtYXBpIiwiaWF0IjoxNzUzMjg3MDQ3LCJleHAiOjE3NTU4MTM2MDB9.cpCFLkUS48EFIi17BnObm4mKOgv5ukIx-ZT09YSjGfE';
    process.env.N8N_ADMIN_EMAIL = 'gestion@locod-ai.com';
    process.env.N8N_ADMIN_PASSWORD = 'YouCanMakeITOK2025';
    
    // Set a master token for testing
    process.env.N8N_SITE_TOKEN = 'test-master-token-12345678901234567890123456789012';

    const generator = new N8nWorkflowGenerator();
    
    console.log('📋 Testing with site: testgenerated');
    console.log('📧 Recipient: test@testgenerated.com');
    console.log('📤 Sender: locodai.sas@gmail.com');
    
    // Generate workflow
    const result = await generator.setupN8nForSite('testgenerated', testSiteConfig);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Workflow generated successfully');
      console.log('=====================================');
      console.log(`Workflow Name: ${result.workflowName}`);
      console.log(`Webhook URL: ${result.webhookUrl}`);
      console.log(`Workflow ID: ${result.workflow.id}`);
      
      // Extract the webhook token from the generated config
      const webhookToken = generator.deriveWorkflowToken(process.env.N8N_SITE_TOKEN, 'contactForm');
      console.log(`Webhook Token: ${webhookToken}`);
      
      console.log('\n📋 Test Instructions:');
      console.log('1. Webhook should be secured with Header Auth');
      console.log('2. Use X-Webhook-Token header with the token above');
      console.log('3. No blank values should be present');
      
      return {
        success: true,
        webhookUrl: result.webhookUrl,
        webhookToken: webhookToken,
        workflowId: result.workflow.id
      };
      
    } else {
      console.error('\n❌ FAILED to generate workflow');
      console.error(`Error: ${result.message}`);
      return { success: false, error: result.message };
    }
    
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testWorkflowGeneration()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Test completed successfully');
      console.log('Ready for webhook testing!');
    } else {
      console.log('\n❌ Test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });