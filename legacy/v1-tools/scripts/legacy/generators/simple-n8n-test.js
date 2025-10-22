/**
 * Simple N8N credentials test - no external dependencies
 * Usage: node simple-n8n-test.js
 */

class SimpleN8nTest {
  constructor() {
    this.baseUrl = 'https://automation.locod-ai.fr';
    this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjg3MDQ3LCJleHAiOjE3NTU4MTM2MDB9.cpCFLkUS48EFIi17BnObm4mKOgv5ukIx-ZT09YSjGfE';
  }

  async testCredentials() {
    try {
      console.log('🔍 CHECKING N8N CREDENTIALS');
      console.log('============================');
      console.log(`🌐 N8N Instance: ${this.baseUrl}`);
      console.log('');

      // Try different API endpoints for N8N credentials
      console.log('📡 Testing API connectivity...');
      
      // First test basic API connectivity
      let response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Workflows API failed - HTTP ${response.status}: ${response.statusText}`);
      }

      const workflowsData = await response.json();
      console.log(`✅ Basic API connectivity working - Found ${workflowsData.data?.length || 0} workflows`);
      
      // Show some workflow info to understand the system
      if (workflowsData.data && workflowsData.data.length > 0) {
        console.log('');
        console.log('📋 EXISTING WORKFLOWS:');
        workflowsData.data.forEach(workflow => {
          console.log(`• ${workflow.name} (ID: ${workflow.id}) - ${workflow.active ? 'Active' : 'Inactive'}`);
        });
      }
      
      console.log('');
      console.log('🔍 Testing credentials endpoint...');
      
      // Now try credentials endpoint
      response = await fetch(`${this.baseUrl}/api/v1/credentials`, {
        method: 'GET',
        headers: {
          'X-N8N-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`❌ Credentials API failed: HTTP ${response.status}: ${response.statusText}`);
        console.log('');
        console.log('🔍 ALTERNATIVE: Checking workflows for email node patterns...');
        
        // Alternative: Look at existing workflows to see email configurations
        if (workflowsData.data && workflowsData.data.length > 0) {
          const emailWorkflows = workflowsData.data.filter(w => 
            w.name.toLowerCase().includes('mail') || 
            w.name.toLowerCase().includes('email') ||
            w.name.toLowerCase().includes('contact')
          );
          
          console.log(`📧 Found ${emailWorkflows.length} email-related workflows:`);
          emailWorkflows.forEach(workflow => {
            console.log(`   • ${workflow.name} (ID: ${workflow.id})`);
          });
          
          return {
            success: true,
            totalCredentials: 0,
            emailCredentials: [],
            workflowsFound: workflowsData.data.length,
            emailWorkflows: emailWorkflows,
            message: 'Cannot access credentials API but workflows are accessible'
          };
        }
        
        throw new Error(`Credentials API not accessible: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`📋 Total credentials found: ${data.data?.length || 0}`);
      console.log('');

      if (data.data && data.data.length > 0) {
        console.log('📧 EMAIL-RELATED CREDENTIALS:');
        console.log('-----------------------------');
        
        const emailCredentials = data.data.filter(cred => 
          cred.type === 'smtp' || 
          cred.type === 'gmail' || 
          cred.name.toLowerCase().includes('gmail') ||
          cred.name.toLowerCase().includes('mail') ||
          cred.name.toLowerCase().includes('locodai')
        );

        if (emailCredentials.length > 0) {
          emailCredentials.forEach(cred => {
            console.log(`✅ ${cred.name}`);
            console.log(`   • Type: ${cred.type}`);
            console.log(`   • ID: ${cred.id}`);
            console.log(`   • Created: ${new Date(cred.createdAt).toLocaleDateString()}`);
            console.log('');
          });

          // Check specifically for locodai credentials
          const locodaiCred = emailCredentials.find(cred => 
            cred.name.toLowerCase().includes('locodai') ||
            cred.name.toLowerCase().includes('sas') ||
            cred.name.toLowerCase().includes('gmail')
          );

          if (locodaiCred) {
            console.log('🎯 LOCODAI/GMAIL CREDENTIAL FOUND:');
            console.log(`   • Name: ${locodaiCred.name}`);
            console.log(`   • Type: ${locodaiCred.type}`);
            console.log(`   • ID: ${locodaiCred.id}`);
            console.log('   ✅ Can be used in workflows!');
          } else {
            console.log('⚠️  No specific locodai.sas@gmail.com credential found');
          }
        } else {
          console.log('❌ No email credentials found in N8N');
        }

        console.log('');
        console.log('📋 ALL CREDENTIALS:');
        console.log('-------------------');
        data.data.forEach(cred => {
          console.log(`• ${cred.name} (${cred.type}) - ID: ${cred.id}`);
        });

      } else {
        console.log('❌ No credentials found in N8N');
      }

      return {
        success: true,
        totalCredentials: data.data?.length || 0,
        emailCredentials: data.data?.filter(cred => 
          cred.type === 'smtp' || 
          cred.type === 'gmail' || 
          cred.name.toLowerCase().includes('gmail') ||
          cred.name.toLowerCase().includes('mail') ||
          cred.name.toLowerCase().includes('locodai')
        ) || []
      };

    } catch (error) {
      console.error('❌ Error checking N8N credentials:', error.message);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('• Check N8N_API_KEY in .env file');
      console.log('• Verify N8N instance URL');
      console.log('• Ensure N8N API is accessible');
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the test
const tester = new SimpleN8nTest();
tester.testCredentials().then(result => {
  if (result.success) {
    console.log('');
    console.log('✅ Test completed successfully!');
    if (result.emailCredentials.length > 0) {
      console.log(`📧 Found ${result.emailCredentials.length} email credential(s) ready for use`);
    } else {
      console.log('⚠️  No email credentials found - need to set up SMTP in N8N');
    }
  } else {
    console.log('');
    console.log('❌ Test failed - check configuration');
  }
});