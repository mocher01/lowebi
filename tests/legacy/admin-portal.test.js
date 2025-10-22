/**
 * Admin AI Queue Portal Integration Tests
 * Tests complete admin interface workflow including API endpoints, authentication, and data flow
 */

const axios = require('axios');

const BASE_URL = 'http://162.55.213.90:3080';
const ADMIN_CREDENTIALS = {
  email: 'admin@locod.ai',
  password: 'admin123'
};

describe('Admin AI Queue Portal Integration', () => {
  let adminToken;
  let testRequestId;

  // Helper function to make authenticated requests
  const authRequest = async (method, url, data = null) => {
    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${url}`,
        data,
        headers: adminToken ? { 
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        } : { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      return response;
    } catch (error) {
      // Avoid circular reference by throwing simplified error
      throw new Error(`Request failed: ${error.message || 'Unknown error'}`);
    }
  };

  describe('1. Admin Authentication', () => {
    test('should authenticate admin user successfully', async () => {
      const response = await authRequest('POST', '/admin/auth/login', ADMIN_CREDENTIALS);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('email', ADMIN_CREDENTIALS.email);
      expect(response.data.user).toHaveProperty('role', 'super_admin');
      expect(response.data.user).toHaveProperty('permissions');
      
      // Store token for subsequent tests
      adminToken = response.data.token;
    });

    test('should reject invalid credentials', async () => {
      try {
        await authRequest('POST', '/admin/auth/login', {
          email: 'wrong@email.com',
          password: 'wrongpassword'
        });
        fail('Should have rejected invalid credentials');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  describe('2. Admin Dashboard Stats', () => {
    test('should retrieve dashboard statistics', async () => {
      const response = await authRequest('GET', '/admin/dashboard/stats');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('stats');
      
      const stats = response.data.stats;
      expect(stats).toHaveProperty('total_requests');
      expect(stats).toHaveProperty('pending_requests');
      expect(stats).toHaveProperty('processing_requests');
      expect(stats).toHaveProperty('completed_today');
      expect(stats).toHaveProperty('revenue_today');
      expect(stats).toHaveProperty('avg_processing_time');
      
      // All stats should be numbers
      Object.values(stats).forEach(value => {
        expect(typeof value).toBe('number');
      });
      
      expect(response.data).toHaveProperty('recent_activity');
      expect(Array.isArray(response.data.recent_activity)).toBe(true);
    });
  });

  describe('3. AI Queue Management', () => {
    test('should create new AI request', async () => {
      const requestData = {
        customer_id: 'test-admin-integration',
        site_id: 'test-site-admin',
        request_type: 'services',
        business_type: 'translation',
        terminology: 'services',
        request_data: {
          siteName: 'Test Admin Portal Site',
          businessType: 'translation',
          domain: 'test-admin.example.com',
          slogan: 'Professional translation services'
        },
        wizard_session_id: 'admin-test-' + Date.now(),
        estimated_cost: 3.00
      };

      const response = await authRequest('POST', '/admin/queue/create', requestData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('request_id');
      expect(response.data).toHaveProperty('message');
      
      testRequestId = response.data.request_id;
    });

    test('should retrieve AI queue list', async () => {
      const response = await authRequest('GET', '/admin/queue');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('requests');
      expect(response.data).toHaveProperty('pagination');
      
      expect(Array.isArray(response.data.requests)).toBe(true);
      
      const pagination = response.data.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      
      // Should have at least our test request
      expect(response.data.requests.length).toBeGreaterThan(0);
    });

    test('should retrieve specific AI request', async () => {
      if (!testRequestId) {
        throw new Error('Test request ID not available');
      }

      const response = await authRequest('GET', `/admin/queue/${testRequestId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', testRequestId);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('request_type');
      expect(response.data).toHaveProperty('business_type');
      expect(response.data).toHaveProperty('request_data');
      expect(response.data).toHaveProperty('created_at');
      expect(response.data).toHaveProperty('history');
      
      expect(Array.isArray(response.data.history)).toBe(true);
    });

    test('should assign request to admin', async () => {
      if (!testRequestId) {
        throw new Error('Test request ID not available');
      }

      const response = await authRequest('PUT', `/admin/queue/${testRequestId}/assign`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message');
    });

    test('should start processing request', async () => {
      if (!testRequestId) {
        throw new Error('Test request ID not available');
      }

      const response = await authRequest('PUT', `/admin/queue/${testRequestId}/start`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message');
    });

    test('should complete request with generated content', async () => {
      if (!testRequestId) {
        throw new Error('Test request ID not available');
      }

      const completionData = {
        generated_content: {
          services: [
            {
              name: 'Traduction professionnelle',
              description: 'Services de traduction de haute qualité pour tous vos documents'
            },
            {
              name: 'Révision et relecture', 
              description: 'Correction et amélioration de vos textes existants'
            },
            {
              name: 'Localisation culturelle',
              description: 'Adaptation de votre contenu aux spécificités culturelles locales'
            }
          ],
          hero_text: 'Votre partenaire de confiance pour tous vos besoins de traduction professionnelle',
          cta_text: 'Demandez votre devis gratuit dès maintenant',
          contact_forms: {
            quote_request: 'Formulaire de demande de devis personnalisé'
          }
        },
        actual_cost: 2.75,
        admin_notes: 'Generated comprehensive translation services content using AI integration. Content includes professional service descriptions, compelling hero text, and clear call-to-action.'
      };

      const response = await authRequest('PUT', `/admin/queue/${testRequestId}/complete`, completionData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message');
    });

    test('should verify completed request status', async () => {
      if (!testRequestId) {
        throw new Error('Test request ID not available');
      }

      const response = await authRequest('GET', `/admin/queue/${testRequestId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'completed');
      expect(response.data).toHaveProperty('generated_content');
      expect(response.data).toHaveProperty('actual_cost', 2.75);
      expect(response.data).toHaveProperty('completed_at');
      
      // Verify generated content structure
      const generatedContent = response.data.generated_content;
      expect(generatedContent).toHaveProperty('services');
      expect(generatedContent).toHaveProperty('hero_text');
      expect(generatedContent).toHaveProperty('cta_text');
      expect(Array.isArray(generatedContent.services)).toBe(true);
      expect(generatedContent.services.length).toBe(3);
    });
  });

  describe('4. Queue Filtering and Pagination', () => {
    test('should filter queue by status', async () => {
      const response = await authRequest('GET', '/admin/queue?status=completed&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('requests');
      
      // All returned requests should have 'completed' status
      response.data.requests.forEach(request => {
        expect(request.status).toBe('completed');
      });
    });

    test('should filter queue by request type', async () => {
      const response = await authRequest('GET', '/admin/queue?request_type=services&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('requests');
      
      // All returned requests should have 'services' type
      response.data.requests.forEach(request => {
        expect(request.request_type).toBe('services');
      });
    });

    test('should paginate queue results', async () => {
      const page1Response = await authRequest('GET', '/admin/queue?page=1&limit=2');
      const page2Response = await authRequest('GET', '/admin/queue?page=2&limit=2');
      
      expect(page1Response.status).toBe(200);
      expect(page2Response.status).toBe(200);
      
      expect(page1Response.data.pagination.page).toBe(1);
      expect(page2Response.data.pagination.page).toBe(2);
      
      // Results should be different (if we have enough data)
      if (page1Response.data.requests.length > 0 && page2Response.data.requests.length > 0) {
        expect(page1Response.data.requests[0].id).not.toBe(page2Response.data.requests[0].id);
      }
    });
  });

  describe('5. HTML Interface Accessibility', () => {
    test('should serve admin dashboard HTML page', async () => {
      const response = await axios.get(`${BASE_URL}/admin-dashboard`, {
        timeout: 10000
      });
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      
      // Basic HTML structure checks
      expect(response.data).toContain('<!DOCTYPE html>');
      expect(response.data).toContain('<title>');
      expect(response.data).toContain('Admin Dashboard');
      expect(response.data).toContain('loginForm');
      expect(response.data).toContain('dashboard');
      
      // Check for Alpine.js integration
      expect(response.data).toContain('x-data');
      expect(response.data).toContain('Alpine');
      
      // Check for authentication elements
      expect(response.data).toContain('email');
      expect(response.data).toContain('password');
      expect(response.data).toContain('login');
    });
  });

  describe('6. Admin Dashboard Stats Validation', () => {
    test('should update stats after completing requests', async () => {
      const statsResponse = await authRequest('GET', '/admin/dashboard/stats');
      
      expect(statsResponse.status).toBe(200);
      const stats = statsResponse.data.stats;
      
      // Should have at least 1 completed request (from our test)
      expect(stats.total_requests).toBeGreaterThanOrEqual(1);
      expect(stats.completed_today).toBeGreaterThanOrEqual(1);
      
      // Revenue should be greater than 0 (from our $2.75 test request)
      expect(stats.revenue_today).toBeGreaterThan(0);
      
      // Recent activity should include our test request
      const recentActivity = statsResponse.data.recent_activity;
      expect(recentActivity.length).toBeGreaterThan(0);
      
      // Should find our completed test request in recent activity
      const ourRequest = recentActivity.find(activity => 
        activity.id === testRequestId && activity.status === 'completed'
      );
      expect(ourRequest).toBeDefined();
    });
  });

  describe('7. Error Handling and Security', () => {
    test('should require authentication for protected endpoints', async () => {
      // Try to access protected endpoint without token
      try {
        await axios.get(`${BASE_URL}/admin/queue`);
        fail('Should require authentication');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should handle invalid request IDs gracefully', async () => {
      try {
        await authRequest('GET', '/admin/queue/99999');
        fail('Should return 404 for non-existent request');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('should validate request data for completion', async () => {
      if (!testRequestId) {
        // Create a new request for this test
        const requestData = {
          customer_id: 'test-validation',
          site_id: 'test-site-validation',
          request_type: 'services',
          business_type: 'translation',
          terminology: 'services',
          request_data: { siteName: 'Validation Test' },
          wizard_session_id: 'validation-test-' + Date.now()
        };
        const createResponse = await authRequest('POST', '/admin/queue/create', requestData);
        testRequestId = createResponse.data.request_id;
      }

      // Try to complete without required generated_content
      try {
        await authRequest('PUT', `/admin/queue/${testRequestId}/complete`, {
          actual_cost: 2.00,
          admin_notes: 'Test without content'
        });
        fail('Should require generated_content');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });
});