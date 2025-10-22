#!/usr/bin/env node

const workflowId = process.argv[2];
if (!workflowId) {
  console.error('Usage: node delete-only.js <workflowId>');
  process.exit(1);
}

// Hardcode the values to avoid importing generator
const baseUrl = 'https://automation.locod-ai.fr';
const apiKey = 'YOUR_API_KEY_HERE'; // You need to provide the actual API key

async function deleteWorkflowOnly(id) {
  try {
    console.log(`🗑️  ONLY deleting workflow ${id}...`);
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
      console.log(`❌ Failed to delete: ${response.status}`);
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteWorkflowOnly(workflowId);