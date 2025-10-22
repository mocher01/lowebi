import { test, expect, Page, BrowserContext, Request, Response } from '@playwright/test';

/**
 * CRITICAL ISSUE TESTING: Network Requests and API Response Structure
 * 
 * This test suite monitors actual network requests, validates API responses,
 * and checks the structure of data being returned from the backend.
 */

interface LoginRequest {
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
}

interface LoginResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: any;
}

test.describe('Admin Portal - Network & API Validation', () => {
  let context: BrowserContext;
  let page: Page;
  let capturedRequests: LoginRequest[] = [];
  let capturedResponses: LoginResponse[] = [];

  test.beforeEach(async ({ browser }) => {
    capturedRequests = [];
    capturedResponses = [];
    
    context = await browser.newContext();
    page = await context.newPage();
    
    // Capture all requests
    page.on('request', async (request: Request) => {
      if (request.url().includes('/auth/login')) {
        try {
          const body = request.postDataJSON();
          capturedRequests.push({
            url: request.url(),
            method: request.method(),
            body: body,
            headers: request.headers()
          });
          console.log(`📤 LOGIN REQUEST: ${request.method()} ${request.url()}`);
          console.log(`📤 REQUEST BODY:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.log(`❌ Failed to capture request: ${e}`);
        }
      }
    });
    
    // Capture all responses
    page.on('response', async (response: Response) => {
      if (response.url().includes('/auth/login')) {
        try {
          const body = await response.json();
          capturedResponses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers(),
            body: body
          });
          console.log(`📥 LOGIN RESPONSE: ${response.status()} ${response.url()}`);
          console.log(`📥 RESPONSE BODY:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.log(`❌ Failed to capture response: ${e}`);
        }
      }
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('should validate login API endpoint accessibility', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test the API endpoint directly
    const response = await page.request.post('/auth/login', {
      data: {
        email: 'admin@locod.ai',
        password: 'admin123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Direct API Test: Status=${response.status()}`);
    
    if (response.ok()) {
      const data = await response.json();
      console.log('Direct API Response:', JSON.stringify(data, null, 2));
      
      // Validate response structure
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('role');
      
      // Check the CRITICAL structure issue
      if (data.tokens) {
        expect(data.tokens).toHaveProperty('accessToken');
        expect(data.tokens).toHaveProperty('refreshToken');
        console.log('✅ CORRECT STRUCTURE: Response has tokens.accessToken');
      } else if (data.accessToken) {
        console.log('❌ INCORRECT STRUCTURE: Response has accessToken directly (missing tokens wrapper)');
        console.log('This will cause the frontend error: Cannot read properties of undefined (reading "accessToken")');
      } else {
        console.log('❌ MISSING TOKENS: Response has no access token at all');
      }
    } else {
      console.log('❌ API Request Failed:', await response.text());
    }
  });

  test('should capture real network requests from form submission', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Fill and submit the form
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    
    // Submit and wait for network activity
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    console.log(`Captured ${capturedRequests.length} requests and ${capturedResponses.length} responses`);
    
    // Validate that the request was made
    expect(capturedRequests).toHaveLength(1);
    
    const request = capturedRequests[0];
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/auth/login');
    expect(request.body).toEqual({
      email: 'admin@locod.ai',
      password: 'admin123'
    });
    
    // Validate headers
    expect(request.headers['content-type']).toBe('application/json');
    
    // Check if we got a response
    if (capturedResponses.length > 0) {
      const response = capturedResponses[0];
      console.log(`Response Status: ${response.status}`);
      console.log('Response Structure Analysis:');
      
      if (response.body) {
        console.log('- Has user property:', 'user' in response.body);
        console.log('- Has tokens property:', 'tokens' in response.body);
        console.log('- Has accessToken directly:', 'accessToken' in response.body);
        
        if ('tokens' in response.body && response.body.tokens) {
          console.log('- tokens.accessToken exists:', 'accessToken' in response.body.tokens);
          console.log('- tokens.refreshToken exists:', 'refreshToken' in response.body.tokens);
        }
      }
    }
  });

  test('should test with different credential scenarios', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const testScenarios = [
      {
        name: 'Valid Admin Credentials',
        email: 'admin@locod.ai',
        password: 'admin123',
        expectedStatus: 200
      },
      {
        name: 'Invalid Credentials',
        email: 'wrong@example.com',
        password: 'wrongpass',
        expectedStatus: 401
      },
      {
        name: 'Empty Password',
        email: 'admin@locod.ai',
        password: '',
        expectedStatus: 400
      }
    ];
    
    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing scenario: ${scenario.name}`);
      
      // Reset captured data
      capturedRequests.length = 0;
      capturedResponses.length = 0;
      
      // Skip form validation for empty password test
      if (scenario.password === '') {
        const response = await page.request.post('/auth/login', {
          data: {
            email: scenario.email,
            password: scenario.password
          }
        });
        
        console.log(`Direct API Status: ${response.status()}`);
        const responseText = await response.text();
        console.log(`Direct API Response: ${responseText}`);
        continue;
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.fill('#email', scenario.email);
      await page.fill('#password', scenario.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      if (capturedResponses.length > 0) {
        const response = capturedResponses[0];
        console.log(`Status: ${response.status} (expected: ${scenario.expectedStatus})`);
        
        if (response.status === 200) {
          // Successful login - analyze structure
          console.log('✅ Successful login response structure:');
          console.log(JSON.stringify(response.body, null, 2));
        } else {
          // Error response
          console.log('❌ Error response:');
          console.log(JSON.stringify(response.body, null, 2));
        }
      }
    }
  });

  test('should validate API proxy configuration', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the proxy is working by making requests to different paths
    const testPaths = [
      '/auth/login',
      '/api/health', // If this endpoint exists
    ];
    
    for (const path of testPaths) {
      try {
        const response = await page.request.get(path);
        console.log(`${path}: Status=${response.status()}`);
        
        if (path === '/auth/login') {
          // Should be 405 Method Not Allowed for GET
          expect([405, 404]).toContain(response.status());
        }
      } catch (error) {
        console.log(`${path}: Error=${error}`);
      }
    }
  });

  test('should check Next.js rewrite configuration', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // The frontend makes requests to '/auth/login' which should be rewritten to 'http://localhost:7600/auth/login'
    // Let's verify this is working
    
    const networkPromise = page.waitForRequest(request => 
      request.url().includes('/auth/login')
    );
    
    await page.fill('#email', 'admin@locod.ai');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    
    const request = await networkPromise;
    console.log('Actual request URL:', request.url());
    
    // The request should be going to the proxy URL (localhost:7602) but internally hitting localhost:7600
    expect(request.url()).toContain('localhost:7602');
    
    await page.waitForTimeout(2000);
    
    // Verify the request was actually processed
    expect(capturedRequests.length).toBeGreaterThan(0);
  });

  test('should analyze backend response time and reliability', async () => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const attempts = 5;
    const results: Array<{attempt: number, duration: number, status: number, success: boolean}> = [];
    
    for (let i = 1; i <= attempts; i++) {
      const startTime = Date.now();
      
      try {
        const response = await page.request.post('/auth/login', {
          data: {
            email: 'admin@locod.ai',
            password: 'admin123'
          }
        });
        
        const duration = Date.now() - startTime;
        results.push({
          attempt: i,
          duration,
          status: response.status(),
          success: response.ok()
        });
        
        console.log(`Attempt ${i}: ${duration}ms, Status: ${response.status()}`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          attempt: i,
          duration,
          status: 0,
          success: false
        });
        console.log(`Attempt ${i}: Failed after ${duration}ms - ${error}`);
      }
      
      // Small delay between attempts
      await page.waitForTimeout(500);
    }
    
    // Analyze results
    const successfulAttempts = results.filter(r => r.success);
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    
    console.log(`\n📊 API Performance Analysis:`);
    console.log(`- Success rate: ${successfulAttempts.length}/${attempts} (${(successfulAttempts.length/attempts*100).toFixed(1)}%)`);
    console.log(`- Average response time: ${averageDuration.toFixed(0)}ms`);
    
    // Basic performance expectations
    expect(successfulAttempts.length).toBeGreaterThan(0); // At least one success
    expect(averageDuration).toBeLessThan(5000); // Under 5 seconds average
    
    if (successfulAttempts.length > 0) {
      const avgSuccessfulDuration = successfulAttempts.reduce((sum, r) => sum + r.duration, 0) / successfulAttempts.length;
      console.log(`- Average successful response time: ${avgSuccessfulDuration.toFixed(0)}ms`);
      expect(avgSuccessfulDuration).toBeLessThan(3000); // Successful requests under 3 seconds
    }
  });
});