import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' }); // Run tests sequentially to avoid rate limiting

test.describe('Issue #146: Duplicate Detection API Test', () => {
  let authToken: string;
  let testUserId: string;
  const TEST_EMAIL = 'api-test-' + Date.now() + '@example.com';
  const TEST_PASSWORD = 'TestPassword123@';

  test.beforeAll(async ({ request }) => {
    // Register test user
    console.log('\n📝 Registering test user:', TEST_EMAIL);
    const registerResponse = await request.post('http://localhost:7600/auth/register', {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: 'API',
        lastName: 'Test'
      }
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.accessToken;
    testUserId = registerData.user.id;
    console.log('✅ Test user created, ID:', testUserId);

    // Create a wizard session with duplicate name
    console.log('\n📝 Creating initial wizard session with name "test-duplicate"...');
    const sessionId = 'test-session-' + Date.now();
    const createSessionResponse = await request.post(`http://localhost:7600/customer/wizard-sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: 'test-duplicate',
        businessType: 'Test Business',
        siteId: 'test-duplicate-id'
      }
    });

    if (!createSessionResponse.ok()) {
      console.error('Failed to create session:', createSessionResponse.status());
      const errorText = await createSessionResponse.text();
      console.error('Error:', errorText);
    }

    expect(createSessionResponse.ok()).toBeTruthy();
    console.log('✅ Initial wizard session created with name "test-duplicate"');

    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('API should detect duplicate site name', async ({ request }) => {
    console.log('\n=== TEST 1: Duplicate Detection ===\n');

    // Call check-duplicate API with existing name
    console.log('📡 Calling /customer/wizard-sessions/check-duplicate with "test-duplicate"...');
    const response = await request.post('http://localhost:7600/customer/wizard-sessions/check-duplicate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: 'test-duplicate'
      }
    });

    console.log('Response status:', response.status());

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Verify duplicate was detected
    expect(data).toHaveProperty('isDuplicate');
    expect(data.isDuplicate).toBe(true);
    console.log('✅ isDuplicate:', data.isDuplicate);

    // Verify suggestion was provided
    expect(data).toHaveProperty('suggestion');
    expect(data.suggestion).toBeTruthy();
    expect(data.suggestion).toMatch(/test-duplicate-\d+/);
    console.log('✅ Suggestion:', data.suggestion);

    console.log('\n✅ TEST PASSED: Duplicate detection working correctly!\n');
  });

  test('API should NOT detect duplicate for unique name', async ({ request }) => {
    console.log('\n=== TEST 2: Unique Name (No Duplicate) ===\n');

    const uniqueName = 'unique-site-' + Date.now();

    // Call check-duplicate API with unique name
    console.log(`📡 Calling /customer/wizard-sessions/check-duplicate with "${uniqueName}"...`);
    const response = await request.post('http://localhost:7600/customer/wizard-sessions/check-duplicate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: uniqueName
      }
    });

    console.log('Response status:', response.status());

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Verify no duplicate detected
    expect(data).toHaveProperty('isDuplicate');
    expect(data.isDuplicate).toBe(false);
    console.log('✅ isDuplicate:', data.isDuplicate);

    console.log('\n✅ TEST PASSED: Unique names accepted correctly!\n');
  });

  test('API should provide incrementing suggestions for multiple duplicates', async ({ request }) => {
    console.log('\n=== TEST 3: Multiple Duplicates (Incrementing Suggestions) ===\n');

    // Create test-duplicate-1
    console.log('Creating "test-duplicate-1"...');
    const session1Id = 'test-session-1-' + Date.now();
    await request.post(`http://localhost:7600/customer/wizard-sessions/${session1Id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: 'test-duplicate-1',
        businessType: 'Test',
        siteId: 'test-duplicate-1-id'
      }
    });

    // Create test-duplicate-2
    console.log('Creating "test-duplicate-2"...');
    const session2Id = 'test-session-2-' + Date.now();
    await request.post(`http://localhost:7600/customer/wizard-sessions/${session2Id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: 'test-duplicate-2',
        businessType: 'Test',
        siteId: 'test-duplicate-2-id'
      }
    });

    // Now check duplicate again - should suggest test-duplicate-3
    console.log('Checking duplicate for "test-duplicate" again...');
    const response = await request.post('http://localhost:7600/customer/wizard-sessions/check-duplicate', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        siteName: 'test-duplicate'
      }
    });

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    expect(data.isDuplicate).toBe(true);
    expect(data.suggestion).toBe('test-duplicate-3');
    console.log('✅ Correct suggestion for multiple duplicates:', data.suggestion);

    console.log('\n✅ TEST PASSED: Incrementing suggestions work correctly!\n');
  });
});
