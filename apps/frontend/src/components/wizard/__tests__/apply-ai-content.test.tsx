import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizard } from '../wizard-provider';

// Mock the API client
jest.mock('../../../lib/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  adminApiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('applyAiContent - Content Application to WizardData', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WizardProvider>{children}</WizardProvider>
  );

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Services Content Application', () => {
    it('should apply generated services to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      // Mock generated content for services
      const generatedServices = {
        services: [
          {
            name: 'Translation Services',
            title: 'Professional Translation',
            description: 'High-quality translation services for all your needs',
            features: ['Accuracy', 'Fast delivery', 'Native speakers'],
            price: '50€/page',
            category: 'Language Services'
          },
          {
            name: 'Localization',
            title: 'Cultural Adaptation',
            description: 'Adapt your content for local markets',
            features: ['Cultural expertise', 'Market research', 'SEO optimization'],
            price: '75€/hour',
            category: 'Language Services'
          }
        ]
      };

      // Set up the AI request with generated content
      act(() => {
        result.current.setAiRequests({
          services: {
            id: 123,
            status: 'completed',
            requestType: 'services',
            generatedContent: generatedServices,
            startTime: Date.now(),
            elapsedTime: '00:30'
          }
        });
      });

      // Apply the AI content
      act(() => {
        result.current.applyAiContent('services');
      });

      // Verify services were applied correctly
      expect(result.current.wizardData.services).toHaveLength(2);
      expect(result.current.wizardData.services[0]).toEqual(
        expect.objectContaining({
          name: 'Translation Services',
          title: 'Professional Translation',
          description: 'High-quality translation services for all your needs',
          features: ['Accuracy', 'Fast delivery', 'Native speakers']
        })
      );
      expect(result.current.wizardData.services[1].name).toBe('Localization');
    });

    it('should handle services with missing fields gracefully', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const incompleteServices = {
        services: [
          {
            title: 'Service without name',
            description: 'This service has no name field'
          },
          {
            name: 'Service without title',
            description: 'This service has no title field'
          }
        ]
      };

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 124,
            status: 'completed',
            requestType: 'services',
            generatedContent: incompleteServices,
            startTime: Date.now(),
            elapsedTime: '00:15'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('services');
      });

      // Should use title as name if name is missing, and vice versa
      expect(result.current.wizardData.services[0].name).toBe('Service without name');
      expect(result.current.wizardData.services[0].title).toBe('Service without name');
      expect(result.current.wizardData.services[1].name).toBe('Service without title');
      expect(result.current.wizardData.services[1].title).toBe('Service without title');
    });
  });

  describe('Hero Content Application', () => {
    it('should apply generated hero content to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedHero = {
        hero: {
          title: 'Professional Translation Services',
          subtitle: 'Breaking Language Barriers',
          description: 'We provide accurate, culturally-aware translations that help your business reach global audiences.'
        }
      };

      act(() => {
        result.current.setAiRequests({
          hero: {
            id: 125,
            status: 'completed',
            requestType: 'hero',
            generatedContent: generatedHero,
            startTime: Date.now(),
            elapsedTime: '00:10'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('hero');
      });

      expect(result.current.wizardData.heroContent).toEqual({
        title: 'Professional Translation Services',
        subtitle: 'Breaking Language Barriers',
        description: 'We provide accurate, culturally-aware translations that help your business reach global audiences.'
      });
    });
  });

  describe('About Content Application', () => {
    it('should apply generated about content with values to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedAbout = {
        about: {
          title: 'About Our Company',
          subtitle: 'Leaders in Translation',
          description: 'With over 10 years of experience, we are the trusted translation partner for businesses worldwide.',
          values: [
            { title: 'Quality', description: 'We never compromise on translation quality' },
            { title: 'Speed', description: 'Fast turnaround without sacrificing accuracy' },
            { title: 'Support', description: '24/7 customer support in multiple languages' }
          ]
        }
      };

      act(() => {
        result.current.setAiRequests({
          about: {
            id: 126,
            status: 'completed',
            requestType: 'about',
            generatedContent: generatedAbout,
            startTime: Date.now(),
            elapsedTime: '00:12'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('about');
      });

      expect(result.current.wizardData.aboutContent).toEqual(generatedAbout.about);
      expect(result.current.wizardData.aboutContent?.values).toHaveLength(3);
      expect(result.current.wizardData.aboutContent?.values?.[0].title).toBe('Quality');
    });
  });

  describe('Testimonials Content Application', () => {
    it('should apply generated testimonials to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedTestimonials = {
        testimonials: [
          {
            text: 'Excellent translation service! They delivered on time and the quality was outstanding.',
            name: 'John Doe',
            position: 'CEO, Tech Company',
            rating: 5
          },
          {
            text: 'Very professional team. They understood our needs perfectly.',
            name: 'Jane Smith',
            position: 'Marketing Director, Global Corp',
            rating: 5
          }
        ]
      };

      act(() => {
        result.current.setAiRequests({
          testimonials: {
            id: 127,
            status: 'completed',
            requestType: 'testimonials',
            generatedContent: generatedTestimonials,
            startTime: Date.now(),
            elapsedTime: '00:08'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('testimonials');
      });

      expect(result.current.wizardData.testimonials).toHaveLength(2);
      expect(result.current.wizardData.testimonials?.[0].name).toBe('John Doe');
      expect(result.current.wizardData.testimonials?.[1].rating).toBe(5);
    });
  });

  describe('FAQ Content Application', () => {
    it('should apply generated FAQ to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedFAQ = {
        faq: [
          {
            question: 'How long does translation take?',
            answer: 'Standard documents are translated within 24-48 hours. Rush service is available.'
          },
          {
            question: 'What languages do you support?',
            answer: 'We support over 50 languages with native speakers for each.'
          },
          {
            question: 'Do you provide certified translations?',
            answer: 'Yes, we provide certified translations for official documents.'
          }
        ]
      };

      act(() => {
        result.current.setAiRequests({
          faq: {
            id: 128,
            status: 'completed',
            requestType: 'faq',
            generatedContent: generatedFAQ,
            startTime: Date.now(),
            elapsedTime: '00:05'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('faq');
      });

      expect(result.current.wizardData.faq).toHaveLength(3);
      expect(result.current.wizardData.faq?.[0].question).toBe('How long does translation take?');
      expect(result.current.wizardData.faq?.[2].question).toContain('certified');
    });
  });

  describe('SEO Content Application', () => {
    it('should apply generated SEO content to wizardData', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedSEO = {
        seo: {
          title: 'Professional Translation Services | Your Company',
          description: 'Expert translation and localization services in 50+ languages. Fast, accurate, and affordable. Get a free quote today!',
          keywords: ['translation services', 'professional translation', 'localization', 'document translation']
        }
      };

      act(() => {
        result.current.setAiRequests({
          seo: {
            id: 129,
            status: 'completed',
            requestType: 'seo',
            generatedContent: generatedSEO,
            startTime: Date.now(),
            elapsedTime: '00:03'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('seo');
      });

      expect(result.current.wizardData.seoSettings).toEqual(generatedSEO.seo);
      expect(result.current.wizardData.seoSettings?.keywords).toHaveLength(4);
      expect(result.current.wizardData.seoSettings?.description).toContain('50+ languages');
    });
  });

  describe('Complex Content with Escaped JSON', () => {
    it('should handle escaped JSON from database correctly', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      // Simulate escaped JSON as it might come from database
      const escapedContent = '{\\"services\\":[{\\"name\\":\\"Translation\\",\\"description\\":\\"Professional translation\\"}]}';

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 130,
            status: 'completed',
            requestType: 'services',
            generatedContent: escapedContent,
            startTime: Date.now(),
            elapsedTime: '00:20'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('services');
      });

      // Should properly parse escaped JSON
      expect(result.current.wizardData.services).toHaveLength(1);
      expect(result.current.wizardData.services?.[0].name).toBe('Translation');
      expect(result.current.wizardData.services?.[0].description).toBe('Professional translation');
    });

    it('should handle double-escaped JSON correctly', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      // Sometimes JSON gets double-escaped in database
      const doubleEscapedContent = '{\\\\"services\\\\":[{\\\\"name\\\\":\\\\"Service 1\\\\"}]}';

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 131,
            status: 'completed',
            requestType: 'services',
            generatedContent: doubleEscapedContent,
            startTime: Date.now(),
            elapsedTime: '00:15'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('services');
      });

      // Should handle double-escaped JSON
      expect(result.current.wizardData.services).toBeDefined();
      expect(result.current.wizardData.services?.[0]?.name || result.current.wizardData.services?.[0]?.title).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should not crash when no generated content exists', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 132,
            status: 'completed',
            requestType: 'services',
            generatedContent: null, // No content
            startTime: Date.now(),
            elapsedTime: '00:10'
          }
        });
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.applyAiContent('services');
        });
      }).not.toThrow();

      // Services should remain unchanged
      expect(result.current.wizardData.services).toEqual([]);
    });

    it('should handle malformed JSON gracefully', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 133,
            status: 'completed',
            requestType: 'services',
            generatedContent: 'not valid json {{{',
            startTime: Date.now(),
            elapsedTime: '00:05'
          }
        });
      });

      // Should not crash on malformed JSON
      expect(() => {
        act(() => {
          result.current.applyAiContent('services');
        });
      }).not.toThrow();
    });
  });

  describe('Blog Content Application', () => {
    it('should apply blog articles when present', () => {
      const { result } = renderHook(() => useWizard(), { wrapper });

      const generatedBlog = {
        blog: {
          articles: [
            {
              title: 'The Importance of Professional Translation',
              content: 'In today\'s global market, professional translation is essential...',
              excerpt: 'Why professional translation matters for your business'
            },
            {
              title: 'Common Translation Mistakes to Avoid',
              content: 'When translating content, there are several pitfalls...',
              excerpt: 'Learn about common translation errors'
            }
          ]
        }
      };

      act(() => {
        result.current.setAiRequests({
          blog: {
            id: 134,
            status: 'completed',
            requestType: 'blog',
            generatedContent: generatedBlog,
            startTime: Date.now(),
            elapsedTime: '00:25'
          }
        });
      });

      act(() => {
        result.current.applyAiContent('blog');
      });

      expect(result.current.wizardData.blog?.articles).toHaveLength(2);
      expect(result.current.wizardData.blog?.articles?.[0].title).toContain('Professional Translation');
    });
  });

  describe('UI Update Verification', () => {
    it('should trigger re-render when content is applied', () => {
      const { result, rerender } = renderHook(() => useWizard(), { wrapper });
      
      const initialRenderCount = result.current.currentStep; // Using as proxy for render count
      
      const generatedContent = {
        services: [
          { name: 'New Service', description: 'New Description' }
        ]
      };

      act(() => {
        result.current.setAiRequests({
          services: {
            id: 135,
            status: 'completed',
            requestType: 'services',
            generatedContent: generatedContent,
            startTime: Date.now(),
            elapsedTime: '00:10'
          }
        });
      });

      const beforeApply = result.current.wizardData.services;

      act(() => {
        result.current.applyAiContent('services');
      });

      const afterApply = result.current.wizardData.services;

      // Content should have changed
      expect(beforeApply).not.toEqual(afterApply);
      expect(afterApply).toHaveLength(1);
      expect(afterApply?.[0].name).toBe('New Service');
    });
  });
});