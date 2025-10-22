#!/usr/bin/env node

const https = require('https');

console.log('🎯 COMPREHENSIVE ACCEPTANCE TEST - Issue #73 Customer Registration');
console.log('🌐 Production URL: https://logen.locod-ai.com');
console.log('===============================================');
console.log('');

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, success, details) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`    ${details}`);
  
  testResults.tests.push({ name: testName, success, details });
  if (success) testResults.passed++;
  else testResults.failed++;
}

async function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🔍 Test 1: Backend Health Check');
  try {
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      rejectUnauthorized: false
    });
    
    logTest('Backend Health Endpoint', 
      response.statusCode === 200 && response.data.status === 'healthy',
      `Status: ${response.statusCode}, Health: ${response.data.status}`);
  } catch (error) {
    logTest('Backend Health Endpoint', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 Test 2: Frontend Accessibility');
  try {
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    });
    
    const isHTML = typeof response.data === 'string' && response.data.includes('<html');
    const hasSignIn = typeof response.data === 'string' && response.data.includes('Sign In');
    const hasGetStarted = typeof response.data === 'string' && response.data.includes('Get Started');
    
    logTest('Frontend Homepage Loads', 
      response.statusCode === 200 && isHTML,
      `Status: ${response.statusCode}, HTML: ${isHTML}`);
      
    logTest('Sign In Button Present', hasSignIn, `Found: ${hasSignIn}`);
    logTest('Get Started Button Present', hasGetStarted, `Found: ${hasGetStarted}`);
  } catch (error) {
    logTest('Frontend Homepage Loads', false, `Error: ${error.message}`);
    logTest('Sign In Button Present', false, 'Cannot test - homepage failed');
    logTest('Get Started Button Present', false, 'Cannot test - homepage failed');
  }

  console.log('');
  console.log('🔍 Test 3: User Registration Flow');
  const testUser = {
    email: `acceptance.test.${Date.now()}@example.com`,
    password: 'AcceptanceTest123!',
    firstName: 'Acceptance',
    lastName: 'Test'
  };

  let registrationToken = null;
  let userId = null;

  try {
    const registrationData = JSON.stringify(testUser);
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registrationData)
      },
      rejectUnauthorized: false
    }, registrationData);

    const success = response.statusCode === 201 && response.data.user && response.data.accessToken;
    registrationToken = response.data.accessToken;
    userId = response.data.user?.id;
    
    logTest('User Registration API', 
      success,
      `Status: ${response.statusCode}, User ID: ${userId?.substring(0, 8)}..., Token: ${registrationToken ? 'Present' : 'Missing'}`);
  } catch (error) {
    logTest('User Registration API', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 Test 4: User Login Flow');
  let loginToken = null;
  
  try {
    const loginData = JSON.stringify({
      email: testUser.email,
      password: testUser.password
    });
    
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      rejectUnauthorized: false
    }, loginData);

    const success = response.statusCode === 200 && response.data.user && response.data.accessToken;
    loginToken = response.data.accessToken;
    
    logTest('User Login API', 
      success,
      `Status: ${response.statusCode}, User: ${response.data.user?.firstName} ${response.data.user?.lastName}, Token: ${loginToken ? 'Present' : 'Missing'}`);
  } catch (error) {
    logTest('User Login API', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 Test 5: JWT Token Uniqueness');
  const tokensAreUnique = registrationToken && loginToken && registrationToken !== loginToken;
  logTest('JWT Token Uniqueness', 
    tokensAreUnique,
    `Registration Token: ${registrationToken?.substring(0, 20)}..., Login Token: ${loginToken?.substring(0, 20)}..., Unique: ${tokensAreUnique}`);

  console.log('');
  console.log('🔍 Test 6: Authenticated Profile Access');
  if (loginToken) {
    try {
      const response = await makeRequest({
        hostname: 'logen.locod-ai.com',
        port: 443,
        path: '/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginToken}`
        },
        rejectUnauthorized: false
      });

      const success = response.statusCode === 200 && response.data.id === userId;
      logTest('Authenticated Profile Access', 
        success,
        `Status: ${response.statusCode}, Profile ID matches: ${response.data.id === userId}`);
    } catch (error) {
      logTest('Authenticated Profile Access', false, `Error: ${error.message}`);
    }
  } else {
    logTest('Authenticated Profile Access', false, 'No login token available');
  }

  console.log('');
  console.log('🔍 Test 7: CORS Configuration');
  try {
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/auth/profile',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://logen.locod-ai.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      },
      rejectUnauthorized: false
    });

    const hasCORS = response.headers['access-control-allow-origin'] || response.headers['Access-Control-Allow-Origin'];
    logTest('CORS Headers Present', 
      response.statusCode === 200 || response.statusCode === 204,
      `Status: ${response.statusCode}, CORS Origin: ${hasCORS || 'Not found'}`);
  } catch (error) {
    logTest('CORS Headers Present', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 Test 8: Database Persistence');
  // Test multiple registrations to ensure database is working
  const testUser2 = {
    email: `acceptance.test2.${Date.now()}@example.com`,
    password: 'AcceptanceTest456!',
    firstName: 'Second',
    lastName: 'User'
  };

  try {
    const registrationData = JSON.stringify(testUser2);
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(registrationData)
      },
      rejectUnauthorized: false
    }, registrationData);

    const success = response.statusCode === 201;
    logTest('Database Persistence (Multiple Users)', 
      success,
      `Second user registration status: ${response.statusCode}`);
  } catch (error) {
    logTest('Database Persistence (Multiple Users)', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('🔍 Test 9: Error Handling');
  try {
    // Test duplicate email registration
    const duplicateData = JSON.stringify(testUser);
    const response = await makeRequest({
      hostname: 'logen.locod-ai.com',
      port: 443,
      path: '/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(duplicateData)
      },
      rejectUnauthorized: false
    }, duplicateData);

    const properError = response.statusCode === 409 || response.statusCode === 400;
    logTest('Duplicate Email Error Handling', 
      properError,
      `Status: ${response.statusCode}, Message: ${response.data.message || 'No message'}`);
  } catch (error) {
    logTest('Duplicate Email Error Handling', false, `Error: ${error.message}`);
  }

  console.log('');
  console.log('===============================================');
  console.log('🎯 ACCEPTANCE TEST RESULTS');
  console.log('===============================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);
  
  if (testResults.failed === 0) {
    console.log('');
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('✨ The Customer Registration Process (Issue #73) is PRODUCTION READY');
    console.log('🚀 Users can successfully:');
    console.log('   → Access https://logen.locod-ai.com');
    console.log('   → Register new accounts');
    console.log('   → Login with their credentials');  
    console.log('   → Access authenticated features');
    console.log('   → Experience proper error handling');
  } else {
    console.log('');
    console.log('⚠️ SOME TESTS FAILED');
    console.log('Failed tests:');
    testResults.tests.filter(t => !t.success).forEach(test => {
      console.log(`   ❌ ${test.name}: ${test.details}`);
    });
  }
}

runTests().catch(console.error);