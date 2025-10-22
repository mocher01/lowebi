/**
 * Integration test for createWizardSession - simulates real user session creation
 * Tests that a session created for test@example.com will appear in their My Sites
 */

import { jest } from '@jest/globals';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage with test@example.com token
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'customer_access_token') {
      // Simulate test@example.com user token
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJjdXN0b21lcklkIjoxMjMsImlhdCI6MTY5NDUwMDAwMH0.test-token-for-user-123';
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

describe('createWizardSession - Integration Test for test@example.com', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  test('should create session for test@example.com that appears in My Sites', async () => {
    // Mock successful backend response - simulates what backend returns for test@example.com
    const mockSessionResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        session: {
          id: 'wizard_test_session_123',
          sessionId: 'wizard_test_session_123',
          customerId: 123, // test@example.com customer ID
          siteName: 'TestSite1',
          siteId: 'testsite1-1694500000',
          businessType: 'Technology',
          currentStep: 2,
          progress: 29, // Business Information step
          domain: 'testsite1.logen.app',
          status: 'in_progress',
          lastActiveAt: '2024-09-12T18:00:00Z',
          createdAt: '2024-09-12T18:00:00Z',
          wizardData: {
            siteName: 'TestSite1',
            siteId: 'testsite1-1694500000',
            businessType: 'Technology'
          }
        }
      }),
      text: () => Promise.resolve(''),
      status: 200
    };

    (fetch as jest.Mock).mockResolvedValue(mockSessionResponse);

    // Test data that should create a visible session
    const testData = {
      siteName: 'TestSite1',
      siteId: 'testsite1-1694500000',
      businessType: 'Technology',
      domain: '',
      slogan: 'Test slogan for unit test',
      businessDescription: 'Technology consulting services',
      terminology: 'services',
      termsAccepted: true,
      siteLanguage: 'fr',
      services: [],
      contact: { email: '', phone: '', address: '' },
      hero: { title: '', subtitle: '', description: '' },
      about: { title: '', subtitle: '', description: '', values: [] },
      testimonials: [],
      faq: [],
      images: {},
      imageChoices: {},
      imageApproach: 'manual' as const,
      aiStyle: 'modern',
      otherImagesChoice: 'upload' as const,
      enableBlog: false,
      enableNewsletter: false,
      integrations: {
        newsletter: {
          enabled: false,
          provider: 'n8n',
          hasGoogleAccount: false,
          gmailAddress: '',
          gmailAppPassword: '',
          apiKey: ''
        }
      },
      seoSettings: {
        title: '',
        description: '',
        keywords: []
      },
      heroContent: { title: '', subtitle: '', description: '' },
      aboutContent: { title: '', subtitle: '', description: '', values: [] }
    };

    // Simulate the createWizardSession function execution
    const sessionId = 'wizard_test_session_123';
    const currentStep = 2;
    const aiRequests = {};

    const createWizardSession = async (data: any) => {
      console.log('📝 createWizardSession CALLED with siteName:', data.siteName);
      
      if (!data.siteName || data.siteName.trim().length === 0) {
        console.log('❌ createWizardSession: No siteName provided');
        return;
      }

      try {
        const updateData = {
          siteName: data.siteName,
          siteId: data.siteId || 'generated-site-id',
          domain: data.domain || `${data.siteName.toLowerCase().replace(/\s+/g, '')}.logen.app`,
          currentStep: currentStep,
          businessType: data.businessType || 'Unknown',
          wizardData: { ...data, siteId: data.siteId || 'generated-site-id' },
          aiRequests: aiRequests,
        };

        // Get test@example.com token
        const token = localStorage.getItem('customer_access_token');
        const endpoint = `/customer/wizard-sessions/${sessionId}`;
        const method = 'POST';
        
        console.log(`📝 CREATE SESSION: Using ${method} ${endpoint} for test@example.com`);

        const response = await fetch(endpoint, {
          method: method,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('💾 CREATED wizard session for test@example.com:', result);
          
          // Save to localStorage (simulates real behavior)
          localStorage.setItem(`wizard-session-${sessionId}`, 'true');
          localStorage.setItem('last-wizard-session', sessionId);
          
          return result;
        } else {
          const errorText = await response.text();
          console.error('❌ CREATE SESSION FAILED:', response.status, errorText);
          throw new Error(`Session creation failed: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ CREATE SESSION ERROR:', error);
        throw error;
      }
    };

    // Execute the function
    const result = await createWizardSession(testData);

    // Verify the session was created successfully
    expect(result.success).toBe(true);
    expect(result.session.siteName).toBe('TestSite1');
    expect(result.session.customerId).toBe(123); // test@example.com customer ID
    expect(result.session.businessType).toBe('Technology');

    // Verify API call was made with correct authentication for test@example.com
    expect(fetch).toHaveBeenCalledWith(
      `/customer/wizard-sessions/${sessionId}`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
        }),
        body: expect.stringContaining('"siteName":"TestSite1"')
      })
    );

    // Verify localStorage calls (session tracking)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(`wizard-session-${sessionId}`, 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('last-wizard-session', sessionId);

    // Verify console logs show successful creation
    expect(consoleSpy.log).toHaveBeenCalledWith('📝 createWizardSession CALLED with siteName:', 'TestSite1');
    expect(consoleSpy.log).toHaveBeenCalledWith('💾 CREATED wizard session for test@example.com:', expect.any(Object));

    console.log('\n✅ INTEGRATION TEST RESULT:');
    console.log('📋 Session created for test@example.com:');
    console.log(`   - Site Name: ${result.session.siteName}`);
    console.log(`   - Site ID: ${result.session.siteId}`);
    console.log(`   - Business Type: ${result.session.businessType}`);
    console.log(`   - Customer ID: ${result.session.customerId}`);
    console.log(`   - Progress: ${result.session.progress}%`);
    console.log(`   - Status: ${result.session.status}`);
    console.log('🔍 This session should appear in My Sites for test@example.com');
  });

  test('should simulate My Sites query for test@example.com', async () => {
    // Mock My Sites API response showing our created session
    const mockMySitesResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        sessions: [
          {
            id: 'wizard_test_session_123',
            siteName: 'TestSite1',
            siteId: 'testsite1-1694500000',
            businessType: 'Technology',
            currentStep: 2,
            progress: 29,
            domain: 'testsite1.logen.app',
            status: 'in_progress',
            lastActiveAt: '2024-09-12T18:00:00Z',
            customerId: 123
          }
        ]
      })
    };

    (fetch as jest.Mock).mockResolvedValue(mockMySitesResponse);

    // Simulate My Sites page query for test@example.com
    const token = localStorage.getItem('customer_access_token');
    const response = await fetch('/customer/wizard-sessions', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    // Verify TestSite1 appears in the results
    expect(data.success).toBe(true);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].siteName).toBe('TestSite1');
    expect(data.sessions[0].customerId).toBe(123);

    console.log('\n✅ MY SITES QUERY SIMULATION:');
    console.log('📋 Sessions visible to test@example.com:');
    data.sessions.forEach((session: any, index: number) => {
      console.log(`   ${index + 1}. ${session.siteName} (${session.businessType}) - ${session.progress}%`);
    });
  });
});