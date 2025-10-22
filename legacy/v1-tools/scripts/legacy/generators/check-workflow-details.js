/**
 * Check existing workflow details to understand email configuration
 */

const baseUrl = 'https://automation.locod-ai.fr';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDllM2MxZC0wZDRjLTQ3YzktYjhmZi1kYTU4ZWQ0YTM5ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUzMjg3MDQ3LCJleHAiOjE3NTU4MTM2MDB9.cpCFLkUS48EFIi17BnObm4mKOgv5ukIx-ZT09YSjGfE';

async function getWorkflowDetails() {
  try {
    console.log('🔍 Examining QA_FormulaireMail workflow...');
    
    const response = await fetch(`${baseUrl}/api/v1/workflows/OXM4y6SbbJPIChIp`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const workflow = await response.json();
    console.log(`✅ Workflow retrieved: ${workflow.name}`);
    console.log(`📊 Total nodes: ${workflow.nodes?.length || 0}`);
    console.log('');
    
    // Find email nodes
    const emailNodes = workflow.nodes.filter(node => 
      node.type.includes('mail') || 
      node.type.includes('email') ||
      node.type.includes('smtp') ||
      node.type.includes('Send') ||
      node.name.toLowerCase().includes('mail') ||
      node.name.toLowerCase().includes('email')
    );
    
    console.log(`📧 Found ${emailNodes.length} email-related nodes:`);
    console.log('');
    
    emailNodes.forEach((node, index) => {
      console.log(`📧 EMAIL NODE ${index + 1}:`);
      console.log(`   • Name: ${node.name}`);
      console.log(`   • Type: ${node.type}`);
      console.log(`   • ID: ${node.id}`);
      
      if (node.parameters) {
        console.log(`   • Parameters:`);
        Object.keys(node.parameters).forEach(key => {
          const value = node.parameters[key];
          // Don't show sensitive data but show structure
          if (typeof value === 'string' && value.length > 50) {
            console.log(`     - ${key}: [Long string - ${value.length} chars]`);
          } else {
            console.log(`     - ${key}: ${JSON.stringify(value)}`);
          }
        });
      }
      
      if (node.credentials) {
        console.log(`   • Credentials:`);
        Object.keys(node.credentials).forEach(key => {
          console.log(`     - ${key}: ${JSON.stringify(node.credentials[key])}`);
        });
      }
      
      console.log('');
    });
    
    // Also check webhook nodes to understand the flow
    const webhookNodes = workflow.nodes.filter(node => 
      node.type.includes('webhook') ||
      node.name.toLowerCase().includes('webhook')
    );
    
    if (webhookNodes.length > 0) {
      console.log(`🔗 Found ${webhookNodes.length} webhook nodes:`);
      webhookNodes.forEach((node, index) => {
        console.log(`🔗 WEBHOOK NODE ${index + 1}:`);
        console.log(`   • Name: ${node.name}`);
        console.log(`   • Type: ${node.type}`);
        console.log(`   • Parameters: ${JSON.stringify(node.parameters, null, 2)}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error examining workflow:', error.message);
  }
}

getWorkflowDetails();