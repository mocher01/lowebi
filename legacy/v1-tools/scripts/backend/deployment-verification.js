#!/usr/bin/env node
/**
 * Portal v2.0 Backend Deployment Verification Script
 * Tests all critical endpoints after deployment
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://162.55.213.90:7600';
const FRONTEND_URL = 'http://162.55.213.90:7601';

// Test endpoints configuration
const ENDPOINTS = [
  {
    name: 'Root Endpoint',
    path: '/',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Health Check',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'API Documentation',
    path: '/api/docs',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'System Metrics',
    path: '/api/metrics',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Auth Login (OPTIONS)',
    path: '/auth/login',
    method: 'OPTIONS',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Auth Register (OPTIONS)',
    path: '/auth/register',
    method: 'OPTIONS',
    expectedStatus: 200,
    critical: true
  }
];

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 10000,
      headers: {
        'User-Agent': 'Portal-v2-Deployment-Verification/1.0',
        'Accept': 'application/json',
        'Origin': FRONTEND_URL
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const req = httpModule.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  console.log(`\n🔍 Testing: ${endpoint.name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Method: ${endpoint.method}`);
  console.log(`   Expected Status: ${endpoint.expectedStatus}`);
  
  try {
    const response = await makeRequest(url, endpoint.method);
    const success = response.statusCode === endpoint.expectedStatus;
    
    console.log(`   ✅ Status: ${response.statusCode} ${success ? '(PASS)' : '(FAIL)'}`);
    
    if (response.headers['access-control-allow-origin']) {
      console.log(`   ✅ CORS: ${response.headers['access-control-allow-origin']}`);
    }
    
    if (endpoint.path === '/api/health' && response.body) {
      try {
        const healthData = JSON.parse(response.body);
        console.log(`   📊 Health Status: ${healthData.status || 'unknown'}`);
        if (healthData.database) {
          console.log(`   🗄️  Database: ${healthData.database.status || 'unknown'}`);
        }
      } catch (e) {
        console.log(`   📄 Response: ${response.body.substring(0, 100)}...`);
      }
    }
    
    return {
      endpoint: endpoint.name,
      success: success,
      statusCode: response.statusCode,
      expectedStatus: endpoint.expectedStatus,
      critical: endpoint.critical,
      responseTime: Date.now()
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return {
      endpoint: endpoint.name,
      success: false,
      error: error.message,
      critical: endpoint.critical
    };
  }
}

async function testCORSConfiguration() {
  console.log(`\n🌐 Testing CORS Configuration`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health`, 'OPTIONS');
    console.log(`   Status: ${response.statusCode}`);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    };
    
    console.log(`   CORS Headers:`);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`     ${key}: ${value || 'not set'}`);
    });
    
    const frontendAllowed = corsHeaders['access-control-allow-origin'] === FRONTEND_URL ||
                           corsHeaders['access-control-allow-origin'] === '*';
    
    console.log(`   Frontend Access: ${frontendAllowed ? '✅ Allowed' : '❌ Blocked'}`);
    
    return { corsConfigured: !!corsHeaders['access-control-allow-origin'], frontendAllowed };
    
  } catch (error) {
    console.log(`   ❌ CORS Test Failed: ${error.message}`);
    return { corsConfigured: false, error: error.message };
  }
}

async function generateDeploymentReport(results, corsResult) {
  console.log(`\n📊 DEPLOYMENT VERIFICATION REPORT`);
  console.log(`==================================`);
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const criticalTests = results.filter(r => r.critical).length;
  const criticalPassed = results.filter(r => r.critical && r.success).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Critical Tests: ${criticalPassed}/${criticalTests} (${Math.round(criticalPassed/criticalTests*100)}%)`);
  
  console.log(`\n🔍 Test Results:`);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`   ${status} ${result.endpoint}${critical}`);
    if (!result.success && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log(`\n🌐 CORS Configuration:`);
  console.log(`   Configured: ${corsResult.corsConfigured ? '✅' : '❌'}`);
  console.log(`   Frontend Access: ${corsResult.frontendAllowed ? '✅' : '❌'}`);
  
  const deploymentSuccess = criticalPassed === criticalTests && corsResult.corsConfigured;
  
  console.log(`\n🎯 DEPLOYMENT STATUS: ${deploymentSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (deploymentSuccess) {
    console.log(`\n🚀 Portal v2.0 Backend is ready for production!`);
    console.log(`   Backend URL: ${BASE_URL}`);
    console.log(`   API Docs: ${BASE_URL}/api/docs`);
    console.log(`   Health Check: ${BASE_URL}/api/health`);
    console.log(`   Frontend URL: ${FRONTEND_URL}`);
  } else {
    console.log(`\n🔧 Issues found that need attention:`);
    
    const failedCritical = results.filter(r => r.critical && !r.success);
    if (failedCritical.length > 0) {
      console.log(`   Critical endpoint failures:`);
      failedCritical.forEach(result => {
        console.log(`     - ${result.endpoint}: ${result.error || 'Status ' + result.statusCode}`);
      });
    }
    
    if (!corsResult.corsConfigured) {
      console.log(`   - CORS configuration missing or incorrect`);
    }
  }
  
  console.log(`\n📋 Next Steps:`);
  if (!deploymentSuccess) {
    console.log(`1. Check backend service status: systemctl status portal-v2-backend`);
    console.log(`2. Check backend logs: journalctl -u portal-v2-backend -f`);
    console.log(`3. Verify database connectivity with diagnostic script`);
    console.log(`4. Check .env file configuration`);
  } else {
    console.log(`1. Run frontend-backend integration tests`);
    console.log(`2. Perform QA testing of authentication flow`);
    console.log(`3. Test admin dashboard functionality`);
    console.log(`4. Monitor logs for any runtime issues`);
  }
}

async function main() {
  console.log('🚀 Portal v2.0 Backend Deployment Verification');
  console.log('==============================================');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const corsResult = await testCORSConfiguration();
  
  await generateDeploymentReport(results, corsResult);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, makeRequest };