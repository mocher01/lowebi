#!/usr/bin/env node

/**
 * Debug test for contact form submission
 * Tests the complete flow from frontend to N8N webhook
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const SITE_NAME = process.argv[2] || 'translatepro';
const PORT = process.argv[3] || '3003';
const SERVER_IP = '162.55.213.90';

console.log('🔍 Contact Form Debug Test');
console.log('========================');
console.log(`Site: ${SITE_NAME}`);
console.log(`Port: ${PORT}`);
console.log(`Server: ${SERVER_IP}`);
console.log('');

async function loadSiteConfig() {
    const configPath = path.join(__dirname, '..', 'configs', SITE_NAME, 'site-config.json');
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config;
    } catch (error) {
        console.error('❌ Failed to load site config:', error.message);
        process.exit(1);
    }
}

async function testSiteAccess() {
    console.log('📡 Step 1: Testing site accessibility...');
    try {
        const response = await fetch(`http://${SERVER_IP}:${PORT}`);
        console.log(`✅ Site accessible: ${response.status} ${response.statusText}`);
        return true;
    } catch (error) {
        console.error(`❌ Site not accessible: ${error.message}`);
        return false;
    }
}

async function getConfigFromFrontend() {
    console.log('\n📡 Step 2: Getting config from frontend...');
    try {
        const response = await fetch(`http://${SERVER_IP}:${PORT}/config.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const config = await response.json();
        console.log('✅ Frontend config loaded');
        return config;
    } catch (error) {
        console.error(`❌ Failed to get frontend config: ${error.message}`);
        return null;
    }
}

async function extractWebhookConfig(config) {
    console.log('\n📋 Step 3: Extracting webhook configuration...');
    
    const n8nConfig = config.integrations?.n8n;
    if (!n8nConfig) {
        console.error('❌ No N8N configuration found');
        return null;
    }

    const webhookConfig = n8nConfig.workflows?.contactForm;
    if (!webhookConfig) {
        console.error('❌ No contact form workflow configuration found');
        return null;
    }

    console.log('✅ Webhook configuration found:');
    console.log(`   • Webhook URL: ${webhookConfig.webhookUrl}`);
    console.log(`   • Workflow ID: ${webhookConfig.id}`);
    console.log(`   • Workflow Name: ${webhookConfig.name}`);
    console.log(`   • Auth Type: ${webhookConfig.auth?.type || 'unknown'}`);
    console.log(`   • Enabled: ${webhookConfig.enabled}`);
    
    return webhookConfig;
}

async function testWebhookDirectly(webhookUrl) {
    console.log('\n📡 Step 4: Testing webhook directly...');
    
    const testPayload = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+33 6 12 34 56 78',
        company: 'Test Company',
        message: 'This is a test message from the debug script',
        captchaToken: null,
        captchaVerified: false,
        timestamp: new Date().toISOString(),
        source: 'debug-test'
    };

    console.log('📤 Sending test payload:');
    console.log(JSON.stringify(testPayload, null, 2));

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ContactForm-DebugTest/1.0'
            },
            body: JSON.stringify(testPayload)
        });

        console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        if (responseText) {
            console.log('Response body:', responseText);
        }

        if (response.ok) {
            console.log('✅ Webhook test successful!');
            return true;
        } else {
            console.log('❌ Webhook test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Webhook request failed:', error.message);
        return false;
    }
}

async function simulateFrontendSubmission(config) {
    console.log('\n📡 Step 5: Simulating frontend submission...');
    
    const formData = {
        name: 'Frontend Test',
        email: 'frontend@test.com',
        phone: '+33 6 98 76 54 32',
        company: 'Frontend Test Co',
        message: 'Test message from simulated frontend submission'
    };

    const webhookUrl = config.integrations?.n8n?.workflows?.contactForm?.webhookUrl;
    if (!webhookUrl) {
        console.error('❌ No webhook URL in config');
        return false;
    }

    // Simulate exactly what the frontend does
    const payload = {
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
        company: formData.company || '',
        message: formData.message || '',
        captchaToken: null,
        captchaVerified: false,
        timestamp: new Date().toISOString(),
        source: 'website-generator'
    };

    try {
        console.log('📤 Submitting to:', webhookUrl);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ContactForm/1.0 (Website-Generator; IP-Whitelist)'
            },
            body: JSON.stringify(payload)
        });

        console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
        
        const responseText = await response.text();
        if (responseText) {
            try {
                const responseJson = JSON.parse(responseText);
                console.log('Response JSON:', JSON.stringify(responseJson, null, 2));
            } catch {
                console.log('Response text:', responseText);
            }
        }

        return response.ok;
    } catch (error) {
        console.error('❌ Frontend simulation failed:', error);
        return false;
    }
}

async function checkCORS() {
    console.log('\n🔍 Step 6: Checking CORS configuration...');
    
    const webhookUrl = 'https://automation.locod-ai.fr/webhook/9d306725-cb49-477e-a576-748175871f75';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': `http://${SERVER_IP}:${PORT}`,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });

        console.log('CORS preflight response:', response.status);
        console.log('CORS headers:');
        console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('  Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
        console.log('  Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
        
        return response.ok;
    } catch (error) {
        console.error('❌ CORS check failed:', error.message);
        return false;
    }
}

async function checkFromServerIP() {
    console.log('\n🔍 Step 7: Testing webhook from server IP...');
    
    // This simulates a request from the server itself
    console.log('Note: This test runs from your local machine, not the server.');
    console.log('If this fails but server requests work, it confirms IP whitelist is active.');
    
    return true;
}

// Run all tests
async function runDebugTests() {
    console.log('\n🚀 Starting comprehensive debug tests...\n');

    // Test 1: Site accessibility
    const siteAccessible = await testSiteAccess();
    if (!siteAccessible) {
        console.error('\n❌ Site is not accessible. Cannot continue tests.');
        process.exit(1);
    }

    // Test 2: Load configs
    const backendConfig = await loadSiteConfig();
    const frontendConfig = await getConfigFromFrontend();
    
    if (!frontendConfig) {
        console.error('\n❌ Cannot load frontend config. Cannot continue tests.');
        process.exit(1);
    }

    // Test 3: Extract webhook config
    const webhookConfig = await extractWebhookConfig(frontendConfig);
    if (!webhookConfig) {
        console.error('\n❌ No webhook configuration found.');
        process.exit(1);
    }

    // Test 4: Direct webhook test
    const webhookWorks = await testWebhookDirectly(webhookConfig.webhookUrl);

    // Test 5: Simulate frontend submission
    const frontendWorks = await simulateFrontendSubmission(frontendConfig);

    // Test 6: CORS check
    const corsWorks = await checkCORS();

    // Test 7: IP check
    const ipCheck = await checkFromServerIP();

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Site accessible: ${siteAccessible ? 'YES' : 'NO'}`);
    console.log(`✅ Config loaded: ${frontendConfig ? 'YES' : 'NO'}`);
    console.log(`✅ Webhook found: ${webhookConfig ? 'YES' : 'NO'}`);
    console.log(`${webhookWorks ? '✅' : '❌'} Direct webhook test: ${webhookWorks ? 'PASSED' : 'FAILED'}`);
    console.log(`${frontendWorks ? '✅' : '❌'} Frontend simulation: ${frontendWorks ? 'PASSED' : 'FAILED'}`);
    console.log(`${corsWorks ? '✅' : '❌'} CORS configuration: ${corsWorks ? 'OK' : 'FAILED'}`);

    if (!webhookWorks && !frontendWorks) {
        console.log('\n🔍 DIAGNOSIS:');
        console.log('The webhook is not responding to requests.');
        console.log('Possible causes:');
        console.log('1. IP whitelist blocking requests (check N8N webhook settings)');
        console.log('2. Webhook URL mismatch between config and N8N');
        console.log('3. N8N workflow is not active');
        console.log('4. Network/firewall issues');
    }

    process.exit(webhookWorks && frontendWorks ? 0 : 1);
}

// Run the tests
runDebugTests().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
});