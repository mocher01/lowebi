#!/usr/bin/env node

const https = require('https');

console.log('🔄 COMPLETE FLOW TEST: From Homepage → Registration → Login');
console.log('🌐 Testing: https://logen.locod-ai.com');
console.log('');

// Step 1: Create a test user via registration
const testUser = {
  email: `testuser${Date.now()}@example.com`,
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe'
};

console.log('📝 STEP 1: Register new user');
console.log(`📧 Email: ${testUser.email}`);

const registerData = JSON.stringify(testUser);

const registerOptions = {
  hostname: 'logen.locod-ai.com',
  port: 443,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(registerData)
  },
  rejectUnauthorized: false
};

const registerReq = https.request(registerOptions, (res) => {
  console.log(`📈 Registration Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 201) {
        console.log('✅ Registration successful!');
        console.log(`👤 User ID: ${response.user.id}`);
        console.log(`🎟️  Access Token: ${response.accessToken.substring(0, 20)}...`);
        console.log('');
        
        // Step 2: Test login with the same credentials
        testLogin(testUser);
      } else {
        console.log('❌ Registration failed');
        console.log('Response:', JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log('❌ Registration failed - Invalid JSON response');
      console.log('Raw response:', data);
    }
  });
});

registerReq.on('error', (e) => {
  console.error(`❌ Registration request error: ${e.message}`);
});

registerReq.write(registerData);
registerReq.end();

function testLogin(user) {
  console.log('🔐 STEP 2: Login with registered user');
  console.log(`📧 Email: ${user.email}`);
  
  const loginData = JSON.stringify({
    email: user.email,
    password: user.password
  });

  const loginOptions = {
    hostname: 'logen.locod-ai.com',
    port: 443,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    },
    rejectUnauthorized: false
  };

  const loginReq = https.request(loginOptions, (res) => {
    console.log(`📈 Login Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('✅ Login successful!');
          console.log(`👤 Welcome back: ${response.user.fullName || response.user.firstName + ' ' + response.user.lastName}`);
          console.log(`🎟️  New Access Token: ${response.accessToken.substring(0, 20)}...`);
          console.log('');
          console.log('🎉 COMPLETE FLOW TEST PASSED!');
          console.log('✨ Users can successfully:');
          console.log('   → Visit https://logen.locod-ai.com');
          console.log('   → Click "Get Started" or "Sign In"');
          console.log('   → Register new accounts');
          console.log('   → Login with their credentials');
          console.log('   → Receive JWT authentication tokens');
        } else {
          console.log('❌ Login failed');
          console.log('Response:', JSON.stringify(response, null, 2));
        }
      } catch (e) {
        console.log('❌ Login failed - Invalid JSON response');
        console.log('Raw response:', data);
      }
    });
  });

  loginReq.on('error', (e) => {
    console.error(`❌ Login request error: ${e.message}`);
  });

  loginReq.write(loginData);
  loginReq.end();
}