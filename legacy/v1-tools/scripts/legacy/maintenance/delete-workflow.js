#!/usr/bin/env node

async function deleteWorkflow(workflowId) {
  const { default: N8nWorkflowGenerator } = await import('../generators/n8n-workflow-generator.js');
  const generator = new N8nWorkflowGenerator();
  
  try {
    console.log(`🗑️  Deleting workflow ${workflowId}...`);
    
    const response = await fetch(`${generator.baseUrl}/api/v1/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': generator.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log(`✅ Workflow ${workflowId} deleted successfully`);
    } else {
      const error = await response.text();
      console.log(`❌ Failed to delete workflow: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error('❌ Error deleting workflow:', error.message);
  }
}

const workflowId = process.argv[2];
if (!workflowId) {
  console.error('Usage: node delete-workflow.js <workflowId>');
  process.exit(1);
}

deleteWorkflow(workflowId);