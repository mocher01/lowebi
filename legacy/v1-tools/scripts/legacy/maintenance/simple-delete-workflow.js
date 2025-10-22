#!/usr/bin/env node

const workflowId = process.argv[2];
if (!workflowId) {
  console.error('Usage: node simple-delete-workflow.js <workflowId>');
  process.exit(1);
}

async function deleteWorkflow(id) {
  // Get API key from the same source as the generator
  const { default: N8nWorkflowGenerator } = await import('../generators/n8n-workflow-generator.js');
  const generator = new N8nWorkflowGenerator();
  
  const baseUrl = generator.baseUrl;
  const apiKey = generator.apiKey;
  
  if (!apiKey) {
    console.error('❌ N8N_API_KEY not available from generator');
    process.exit(1);
  }
  
  console.log(`🔗 Using baseUrl: ${baseUrl}`);
  console.log(`🔑 API Key available: ${apiKey ? 'YES' : 'NO'}`);

  try {
    console.log(`🗑️  Attempting to delete workflow ${id}...`);
    console.log(`🔗 URL: ${baseUrl}/api/v1/workflows/${id}`);
    
    const response = await fetch(`${baseUrl}/api/v1/workflows/${id}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      console.log(`✅ Workflow ${id} deleted successfully`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to delete workflow: ${response.status}`);
      console.log(`❌ Error details: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteWorkflow(workflowId);