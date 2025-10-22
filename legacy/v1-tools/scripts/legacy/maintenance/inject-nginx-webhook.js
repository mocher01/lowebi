#!/usr/bin/env node

/**
 * Inject webhook URL into nginx config for contact form proxy
 */

const fs = require('fs');
const path = require('path');

const siteName = process.argv[2];
if (!siteName) {
    console.error('Usage: node inject-nginx-webhook.js <siteName>');
    process.exit(1);
}

// Load site config
const configPath = path.join(__dirname, '..', '..', 'configs', siteName, 'site-config.json');
const siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Extract webhook URL
const webhookUrl = siteConfig.integrations?.n8n?.workflows?.contactForm?.webhookUrl;
if (!webhookUrl) {
    console.error('❌ No webhook URL found in site config');
    process.exit(1);
}

// Read nginx template
const nginxTemplatePath = path.join(__dirname, '..', '..', 'template-base', 'docker', 'nginx-with-proxy.conf');
const nginxTemplate = fs.readFileSync(nginxTemplatePath, 'utf8');

// Replace webhook URL
const nginxConfig = nginxTemplate.replace('{{WEBHOOK_URL}}', webhookUrl);

// Write to site's docker directory
const outputDir = path.join(__dirname, '..', '..', 'generated-sites', siteName, 'docker');
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'nginx.conf');
fs.writeFileSync(outputPath, nginxConfig);

console.log(`✅ Nginx config with proxy created for ${siteName}`);
console.log(`   Webhook URL: ${webhookUrl}`);
console.log(`   Output: ${outputPath}`);