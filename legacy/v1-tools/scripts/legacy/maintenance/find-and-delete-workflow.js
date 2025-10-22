#!/usr/bin/env node

const workflowName = process.argv[2];
if (!workflowName) {
  console.error('Usage: node find-and-delete-workflow.js <workflowName>');
  console.error('Example: node find-and-delete-workflow.js TR_ContactForm');
  process.exit(1);
}

// Load environment variables from .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, '');
    }
  });
}

const baseUrl = process.env.N8N_INSTANCE_URL || 'https://automation.locod-ai.fr';
const apiKey = process.env.N8N_API_KEY;

console.log(`🔗 Base URL: ${baseUrl}`);
console.log(`🔑 API Key available: ${apiKey ? 'YES' : 'NO'}`);

if (!apiKey) {
  console.error('❌ N8N_API_KEY not found in environment variables');
  process.exit(1);
}

async function findAndDeleteWorkflow(name) {
  try {
    // Step 1: Get all workflows
    console.log(`🔍 Searching for workflow: ${name}`);
    console.log(`🔗 GET ${baseUrl}/api/v1/workflows`);
    
    const listResponse = await fetch(`${baseUrl}/api/v1/workflows`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.log(`❌ Failed to list workflows: ${listResponse.status}`);
      console.log(`❌ Error: ${error}`);
      return;
    }

    const workflows = await listResponse.json();
    console.log(`📋 Found ${workflows.data?.length || 0} total workflows`);

    // Step 2: Find workflow by name
    const targetWorkflow = workflows.data?.find(w => w.name === name);
    
    if (!targetWorkflow) {
      console.log(`❌ No workflow found with name: ${name}`);
      console.log('Available workflows:');
      workflows.data?.forEach(w => console.log(`  - ${w.name} (ID: ${w.id})`));
      return;
    }

    console.log(`✅ Found workflow: ${targetWorkflow.name} (ID: ${targetWorkflow.id})`);
    console.log(`🔗 Active: ${targetWorkflow.active}`);

    // Step 3: Delete the workflow
    console.log(`🗑️  Deleting workflow ${targetWorkflow.id}...`);
    console.log(`🔗 DELETE ${baseUrl}/api/v1/workflows/${targetWorkflow.id}`);
    
    const deleteResponse = await fetch(`${baseUrl}/api/v1/workflows/${targetWorkflow.id}`, {
      method: 'DELETE',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Delete response status: ${deleteResponse.status}`);
    
    if (deleteResponse.ok) {
      console.log(`✅ Workflow ${name} (${targetWorkflow.id}) deleted successfully`);
    } else {
      const errorText = await deleteResponse.text();
      console.log(`❌ Failed to delete: ${deleteResponse.status}`);
      console.log(`❌ Error: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findAndDeleteWorkflow(workflowName);