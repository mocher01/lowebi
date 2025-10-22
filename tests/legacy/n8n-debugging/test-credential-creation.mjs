/**
 * Test script to create a new N8N Header Auth credential with real token value
 */

import N8nWorkflowGenerator from './scripts/generators/n8n-workflow-generator.js';

async function testCredentialCreation() {
  try {
    console.log('🧪 Testing N8N Header Auth Credential Creation');
    console.log('==============================================');
    
    const generator = new N8nWorkflowGenerator();
    const testToken = '8f69005d92acda2a48b4ce0b04f11ed7a3ec478bb92a87a412e00da34399b724';
    
    console.log('🔐 Creating new Header Auth credential...');
    
    const result = await generator.createHeaderAuthCredential('test-final', testToken);
    
    if (result.success) {
      console.log('✅ SUCCESS: Header Auth credential created successfully!');
      console.log(`   Credential ID: ${result.credential.id}`);
      console.log(`   Credential Name: ${result.credential.name}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.message.includes('updated with real token')) {
        console.log('🎉 CONFIRMED: Real token value was successfully stored!');
      }
    } else {
      console.log('❌ FAILURE: Header Auth credential creation failed');
      console.log(`   Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCredentialCreation();