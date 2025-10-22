/**
 * Step 4 AI Integration Tests
 * Tests complete wizard to admin AI queue integration workflow
 */

const axios = require('axios');

const BASE_URL = 'http://162.55.213.90:3080';
const ADMIN_CREDENTIALS = {
  email: 'admin@locod.ai',
  password: 'admin123'
};

describe('Step 4 AI Integration End-to-End', () => {
  let adminToken;
  let wizardRequestId;

  beforeAll(async () => {
    // Get admin token for managing AI requests
    const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);
    adminToken = loginResponse.data.token;
  });

  describe('Wizard to Admin Queue Integration', () => {
    test('should create AI request from wizard Step 4', async () => {
      // Simulate wizard Step 4 AI button click
      const wizardRequestData = {
        customer_id: 'wizard-customer-test-' + Date.now(),
        site_id: 'test-translation-site-' + Date.now(),
        request_type: 'services',
        business_type: 'translation',
        terminology: 'services',
        request_data: {
          siteName: 'Professional Translation Services',
          businessType: 'translation',
          domain: 'test-translation.example.com',
          slogan: 'Your trusted translation partner',
          businessDescription: 'Professional translation services for legal, technical, and creative documents',
          colors: { primary: '#059669', secondary: '#10B981', accent: '#34D399' },
          existingServices: [
            { name: 'Legal Translation', description: 'Certified legal document translation' }
          ]
        },
        wizard_session_id: 'wizard-session-' + Date.now(),
        estimated_cost: 2.50
      };

      const response = await axios.post(`${BASE_URL}/admin/queue/create`, wizardRequestData);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('request_id');
      expect(response.data).toHaveProperty('message');
      
      wizardRequestId = response.data.request_id;
    });

    test('should retrieve wizard request in admin queue', async () => {
      const response = await axios.get(`${BASE_URL}/admin/queue/${wizardRequestId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', wizardRequestId);
      expect(response.data).toHaveProperty('request_type', 'services');
      expect(response.data).toHaveProperty('business_type', 'translation');
      expect(response.data).toHaveProperty('terminology', 'services');
      expect(response.data).toHaveProperty('status', 'pending');
      
      // Verify wizard data is properly stored
      const requestData = response.data.request_data;
      expect(requestData).toHaveProperty('siteName', 'Professional Translation Services');
      expect(requestData).toHaveProperty('businessType', 'translation');
      expect(requestData).toHaveProperty('domain', 'test-translation.example.com');
      expect(requestData).toHaveProperty('existingServices');
      expect(Array.isArray(requestData.existingServices)).toBe(true);
    });

    test('should process wizard AI request through complete workflow', async () => {
      // Admin assigns request
      await axios.put(`${BASE_URL}/admin/queue/${wizardRequestId}/assign`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Admin starts processing
      await axios.put(`${BASE_URL}/admin/queue/${wizardRequestId}/start`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // Admin completes with generated services content
      const generatedContent = {
        services: [
          {
            name: 'Traduction Juridique Certifiée',
            description: 'Traduction officielle de documents légaux avec certification',
            category: 'legal',
            price: 'À partir de 0.15€/mot'
          },
          {
            name: 'Traduction Technique Spécialisée',
            description: 'Traduction de manuels techniques et documentation industrielle',
            category: 'technical',
            price: 'À partir de 0.12€/mot'
          },
          {
            name: 'Traduction Marketing et Communication',
            description: 'Adaptation créative de contenus marketing et publicitaires',
            category: 'marketing',
            price: 'À partir de 0.18€/mot'
          }
        ],
        hero_text: 'Votre partenaire de confiance pour tous vos besoins de traduction professionnelle',
        cta_text: 'Demandez votre devis gratuit dès maintenant',
        additional_info: {
          specialties: ['Français ↔ Anglais', 'Français ↔ Espagnol', 'Français ↔ Allemand'],
          certifications: ['ISO 17100', 'Traducteur Assermenté'],
          turnaround: '24-48h pour documents standards'
        }
      };

      const completionResponse = await axios.put(
        `${BASE_URL}/admin/queue/${wizardRequestId}/complete`,
        {
          generated_content: generatedContent,
          actual_cost: 2.75,
          admin_notes: 'Generated comprehensive translation services for professional website. Content includes 3 specialized service categories with pricing, compelling hero text, and additional business details.'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      expect(completionResponse.status).toBe(200);
      expect(completionResponse.data).toHaveProperty('success', true);
    });

    test('should allow wizard to retrieve completed AI content', async () => {
      // Simulate wizard polling for status (public endpoint)
      const statusResponse = await axios.get(`${BASE_URL}/admin/status/${wizardRequestId}`);
      
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data).toHaveProperty('status', 'completed');
      
      // Simulate wizard getting full details for content application
      // Note: In real implementation, wizard would need to store request ID and poll
      const detailResponse = await axios.get(`${BASE_URL}/admin/queue/${wizardRequestId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(detailResponse.status).toBe(200);
      expect(detailResponse.data).toHaveProperty('status', 'completed');
      expect(detailResponse.data).toHaveProperty('generated_content');
      
      const generatedContent = detailResponse.data.generated_content;
      expect(generatedContent).toHaveProperty('services');
      expect(generatedContent.services).toHaveLength(3);
      
      // Verify service structure suitable for wizard application
      generatedContent.services.forEach(service => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('description');
        expect(typeof service.name).toBe('string');
        expect(typeof service.description).toBe('string');
      });
    });
  });

  describe('Admin Dashboard Experience', () => {
    test('should show wizard requests in admin dashboard stats', async () => {
      const statsResponse = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.data).toHaveProperty('stats');
      
      const stats = statsResponse.data.stats;
      expect(stats.total_requests).toBeGreaterThanOrEqual(1);
      expect(stats.completed_today).toBeGreaterThanOrEqual(1);
      expect(stats.revenue_today).toBeGreaterThan(0);
      
      // Check recent activity includes our wizard request
      const recentActivity = statsResponse.data.recent_activity;
      const wizardRequest = recentActivity.find(activity => activity.id === wizardRequestId);
      expect(wizardRequest).toBeDefined();
      expect(wizardRequest.status).toBe('completed');
      expect(wizardRequest.request_type).toBe('services');
    });

    test('should filter wizard requests by business type', async () => {
      const response = await axios.get(`${BASE_URL}/admin/queue?request_type=services&business_type=translation`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('requests');
      
      // Should find our wizard translation services request
      const translationRequests = response.data.requests.filter(req => 
        req.business_type === 'translation' && req.request_type === 'services'
      );
      
      expect(translationRequests.length).toBeGreaterThanOrEqual(1);
      
      // Verify one of them is our wizard request
      const ourRequest = translationRequests.find(req => req.id === wizardRequestId);
      expect(ourRequest).toBeDefined();
    });
  });

  describe('Content Quality and Format', () => {
    test('should generate content in expected wizard format', async () => {
      const detailResponse = await axios.get(`${BASE_URL}/admin/queue/${wizardRequestId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const generatedContent = detailResponse.data.generated_content;
      
      // Test content structure matches wizard expectations
      expect(generatedContent.services).toBeInstanceOf(Array);
      expect(generatedContent.services.length).toBeGreaterThanOrEqual(2);
      expect(generatedContent.services.length).toBeLessThanOrEqual(6);
      
      // Test each service has required fields for wizard activities
      generatedContent.services.forEach(service => {
        expect(service.name).toBeTruthy();
        expect(service.description).toBeTruthy();
        expect(service.name.length).toBeGreaterThan(3);
        expect(service.description.length).toBeGreaterThan(10);
      });
      
      // Test additional content elements
      expect(generatedContent.hero_text).toBeTruthy();
      expect(generatedContent.cta_text).toBeTruthy();
      expect(generatedContent.hero_text.length).toBeGreaterThan(20);
    });

    test('should respect business type and terminology', async () => {
      const detailResponse = await axios.get(`${BASE_URL}/admin/queue/${wizardRequestId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const requestData = detailResponse.data.request_data;
      const generatedContent = detailResponse.data.generated_content;
      
      // Verify business type consistency
      expect(detailResponse.data.business_type).toBe('translation');
      expect(detailResponse.data.terminology).toBe('services');
      
      // Verify generated content is relevant to translation business
      const contentText = JSON.stringify(generatedContent).toLowerCase();
      const translationKeywords = ['traduction', 'translation', 'linguistique', 'langue', 'document'];
      const hasTranslationContent = translationKeywords.some(keyword => contentText.includes(keyword));
      expect(hasTranslationContent).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing wizard data gracefully', async () => {
      const incompleteRequestData = {
        customer_id: 'wizard-customer-incomplete-' + Date.now(),
        site_id: 'incomplete-site-' + Date.now(),
        request_type: 'services',
        business_type: 'translation',
        request_data: {
          siteName: 'Incomplete Site'
          // Missing other required fields
        },
        wizard_session_id: 'incomplete-session-' + Date.now()
      };

      const response = await axios.post(`${BASE_URL}/admin/queue/create`, incompleteRequestData);
      
      // Should still create request even with incomplete data
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('request_id');
    });

    test('should validate wizard request data structure', async () => {
      try {
        await axios.post(`${BASE_URL}/admin/queue/create`, {
          // Missing required fields
          request_type: 'services'
        });
        fail('Should have rejected invalid request data');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent wizard requests', async () => {
      const concurrentRequests = Array.from({ length: 3 }, (_, index) => {
        return axios.post(`${BASE_URL}/admin/queue/create`, {
          customer_id: `wizard-customer-concurrent-${index}-${Date.now()}`,
          site_id: `concurrent-site-${index}-${Date.now()}`,
          request_type: 'services',
          business_type: 'translation',
          terminology: 'services',
          request_data: {
            siteName: `Concurrent Translation Site ${index + 1}`,
            businessType: 'translation',
            domain: `concurrent-${index}.example.com`
          },
          wizard_session_id: `concurrent-session-${index}-${Date.now()}`
        });
      });

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('request_id');
      });

      // Verify all requests are in the queue
      const queueResponse = await axios.get(`${BASE_URL}/admin/queue`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const concurrentRequestIds = responses.map(r => r.data.request_id);
      const queueRequestIds = queueResponse.data.requests.map(r => r.id);
      
      concurrentRequestIds.forEach(id => {
        expect(queueRequestIds).toContain(id);
      });
    });
  });
});