/**
 * Integration tests for AI Queue Entities
 * Tests entity relationships, JSONB handling, and business logic
 */

import {
  Customer,
  CustomerStatus,
  CustomerTier,
} from '../../customer/entities/customer.entity';
import {
  AiRequest,
  RequestType,
  RequestStatus,
  RequestPriority,
} from './ai-request.entity';
import {
  AdminActivityLog,
  AdminAction,
  TargetType,
} from './admin-activity-log.entity';
import { AiRequestHistory, ChangeType } from './ai-request-history.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

describe('AI Queue Entities Integration', () => {
  let mockUser: User;
  let mockCustomer: Customer;
  let mockAdmin: User;

  beforeEach(() => {
    // Setup mock admin user
    mockAdmin = {
      id: 'admin-123',
      email: 'admin@test.com',
      passwordHash: 'hashedpassword',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sessions: [],
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    } as User;

    // Setup mock customer user
    mockUser = {
      id: 'user-123',
      email: 'customer@test.com',
      passwordHash: 'hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sessions: [],
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    } as User;

    // Setup mock customer
    mockCustomer = new Customer({
      id: 'customer-123',
      userId: 'user-123',
      companyName: 'Test Company',
      businessType: 'Technology',
      status: CustomerStatus.ACTIVE,
      tier: CustomerTier.PREMIUM,
      preferences: {
        aiContentPreferences: {
          tone: 'professional',
          style: 'business',
          terminology: ['innovation', 'solution'],
        },
      },
      user: mockUser,
    });
  });

  describe('Entity Relationships', () => {
    it('should create AiRequest with Customer relationship', () => {
      const aiRequest = new AiRequest({
        customerId: mockCustomer.id,
        siteId: 'site-123',
        requestType: RequestType.HERO,
        businessType: 'Technology',
        requestData: {
          companyName: 'Test Company',
          industry: 'Technology',
          targetAudience: 'Business professionals',
          tone: 'professional',
        },
        customer: mockCustomer,
      });

      expect(aiRequest.customerId).toBe(mockCustomer.id);
      expect(aiRequest.customer).toBe(mockCustomer);
      expect(aiRequest.status).toBe(RequestStatus.PENDING);
      expect(aiRequest.priority).toBe(RequestPriority.NORMAL);
    });

    it('should create AdminActivityLog with User relationship', () => {
      const activityLog = new AdminActivityLog({
        adminId: mockAdmin.id,
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        details: {
          previousValue: null,
          newValue: mockAdmin.id,
          reason: 'Auto-assignment based on workload',
        },
        admin: mockAdmin,
      });

      expect(activityLog.adminId).toBe(mockAdmin.id);
      expect(activityLog.admin).toBe(mockAdmin);
      expect(activityLog.action).toBe(AdminAction.AI_REQUEST_ASSIGNED);
      expect(activityLog.success).toBe(true);
    });

    it('should create AiRequestHistory with AiRequest relationship', () => {
      const aiRequest = new AiRequest({
        id: 'request-123',
        customerId: mockCustomer.id,
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        status: RequestStatus.PENDING,
        requestData: {},
      });

      const history = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.ASSIGNED,
        changedBy: mockAdmin.id,
        details: {
          automaticChange: false,
          adminNotes: 'Manually assigned to experienced admin',
        },
        request: aiRequest,
        user: mockAdmin,
      });

      expect(history.requestId).toBe(aiRequest.id);
      expect(history.request).toBe(aiRequest);
      expect(history.isStatusChange).toBe(true);
      expect(history.isSystemGenerated).toBe(false);
    });
  });

  describe('JSONB Field Handling', () => {
    it('should handle Customer preferences JSONB field', () => {
      const customer = new Customer({
        userId: 'user-123',
        preferences: {
          aiContentPreferences: {
            tone: 'friendly',
            style: 'casual',
            terminology: ['innovative', 'cutting-edge', 'modern'],
          },
          notificationSettings: {
            email: true,
            sms: false,
          },
          customSettings: {
            theme: 'dark',
            language: 'en-US',
            timezone: 'America/New_York',
          },
        },
      });

      expect(customer.preferences.aiContentPreferences?.tone).toBe('friendly');
      expect(
        customer.preferences.aiContentPreferences?.terminology,
      ).toHaveLength(3);
      expect(customer.preferences.notificationSettings?.email).toBe(true);
      expect(customer.preferences.customSettings?.theme).toBe('dark');
    });

    it('should handle Customer metadata JSONB field', () => {
      const customer = new Customer({
        userId: 'user-123',
        metadata: {
          source: 'referral',
          campaign: 'winter-2024',
          referrer: 'https://partner-site.com',
          utm: {
            source: 'google',
            medium: 'cpc',
            campaign: 'brand-awareness',
          },
          customData: {
            leadScore: 85,
            interests: ['AI', 'automation', 'productivity'],
          },
        },
      });

      expect(customer.metadata.source).toBe('referral');
      expect(customer.metadata.utm?.source).toBe('google');
      expect(customer.metadata.customData?.leadScore).toBe(85);
      expect(customer.metadata.customData?.interests).toContain('AI');
    });

    it('should handle AiRequest requestData JSONB field', () => {
      const aiRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.SERVICES,
        businessType: 'Consulting',
        requestData: {
          companyName: 'Tech Consultants Inc',
          industry: 'Technology Consulting',
          targetAudience: 'Small to medium businesses',
          keyServices: [
            'Cloud Migration',
            'Digital Transformation',
            'AI Implementation',
          ],
          brandValues: ['Innovation', 'Reliability', 'Excellence'],
          competitorUrls: [
            'https://competitor1.com',
            'https://competitor2.com',
          ],
          contentLength: 'medium' as const,
          tone: 'professional' as const,
          language: 'en-US',
          specificRequirements: 'Focus on ROI and business outcomes',
        },
      });

      expect(aiRequest.requestData.companyName).toBe('Tech Consultants Inc');
      expect(aiRequest.requestData.keyServices).toHaveLength(3);
      expect(aiRequest.requestData.brandValues).toContain('Innovation');
      expect(aiRequest.requestData.contentLength).toBe('medium');
      expect(aiRequest.requestData.tone).toBe('professional');
    });

    it('should handle AiRequest generatedContent JSONB field', () => {
      const aiRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.HERO,
        businessType: 'E-commerce',
        requestData: {},
        generatedContent: {
          content: 'Transform your business with cutting-edge AI solutions...',
          metadata: {
            modelUsed: 'gpt-4',
            tokensConsumed: 1250,
            generationTime: 2300,
            confidence: 0.92,
          },
          variations: [
            'Revolutionize your operations with intelligent automation...',
            'Unlock the power of artificial intelligence for your business...',
          ],
          keywords: [
            'AI',
            'automation',
            'transformation',
            'intelligent',
            'business',
          ],
        },
      });

      expect(aiRequest.generatedContent?.content).toContain(
        'Transform your business',
      );
      expect(aiRequest.generatedContent?.metadata?.modelUsed).toBe('gpt-4');
      expect(aiRequest.generatedContent?.metadata?.tokensConsumed).toBe(1250);
      expect(aiRequest.generatedContent?.variations).toHaveLength(2);
      expect(aiRequest.generatedContent?.keywords).toContain('AI');
    });

    it('should handle AdminActivityLog details JSONB field', () => {
      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.QUEUE_BULK_ASSIGN,
        targetType: TargetType.QUEUE,
        targetId: 'bulk-operation-456',
        details: {
          batchSize: 15,
          filters: {
            status: ['pending'],
            priority: ['high', 'urgent'],
            businessType: ['Technology', 'Healthcare'],
          },
          duration: 1500,
          success: true,
          metadata: {
            assignmentStrategy: 'workload-balanced',
            adminIds: ['admin-123', 'admin-456'],
            totalProcessed: 15,
            errors: [],
          },
        },
      });

      expect(activityLog.details.batchSize).toBe(15);
      expect(activityLog.details.filters?.status).toContain('pending');
      expect(activityLog.details.metadata?.assignmentStrategy).toBe(
        'workload-balanced',
      );
      expect(activityLog.details.metadata?.totalProcessed).toBe(15);
    });

    it('should handle AiRequestHistory details JSONB field', () => {
      const history = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CUSTOMER_FEEDBACK,
        changedBy: 'customer-123',
        changedByRole: 'customer' as const,
        details: {
          customerFeedback: {
            rating: 4,
            comment:
              'Good content but needs minor adjustments for our brand voice',
          },
          automaticChange: false,
          processingTime: 850,
          validationErrors: [],
          adminNotes: 'Customer satisfied with overall quality',
        },
      });

      expect(history.details.customerFeedback?.rating).toBe(4);
      expect(history.details.customerFeedback?.comment).toContain(
        'Good content',
      );
      expect(history.details.processingTime).toBe(850);
      expect(history.hasUserFeedback).toBe(true);
    });
  });

  describe('Business Logic and Computed Properties', () => {
    it('should calculate AiRequest computed properties correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Test isExpired
      const expiredRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        expiresAt: oneHourAgo,
      });
      expect(expiredRequest.isExpired).toBe(true);

      // Test totalDuration
      const completedRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        startedAt: twoHoursAgo,
        completedAt: oneHourAgo,
      });
      expect(completedRequest.totalDuration).toBe(3600); // 1 hour in seconds

      // Test isOverdue
      const overdueRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        createdAt: twoDaysAgo,
      });
      expect(overdueRequest.isOverdue).toBe(true);
    });

    it('should calculate AdminActivityLog computed properties correctly', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

      // Test isRecent
      const recentLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_COMPLETED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        timestamp: oneMinuteAgo,
      });
      expect(recentLog.isRecent).toBe(true);

      // Test isError
      const errorLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_STARTED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        severity: 'error' as const,
        success: false,
      });
      expect(errorLog.isError).toBe(true);
    });

    it('should calculate AiRequestHistory computed properties correctly', () => {
      // Test isStatusChange
      const statusHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        changedBy: 'admin-123',
      });
      expect(statusHistory.isStatusChange).toBe(true);

      // Test isSystemGenerated
      const systemHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.RETRY_ATTEMPT,
        changedBy: 'system',
        source: 'automatic' as const,
      });
      expect(systemHistory.isSystemGenerated).toBe(true);

      // Test changeDescription
      const descriptionHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.COMPLETED,
        changedBy: 'admin-123',
      });
      expect(descriptionHistory.changeDescription).toContain('pending');
      expect(descriptionHistory.changeDescription).toContain('completed');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle null and undefined values correctly', () => {
      const customer = new Customer({
        userId: 'user-123',
        companyName: null,
        businessType: undefined,
        billingInfo: null,
      });

      expect(customer.companyName).toBeNull();
      expect(customer.businessType).toBeUndefined();
      expect(customer.billingInfo).toBeNull();
      expect(customer.preferences).toEqual({});
      expect(customer.metadata).toEqual({});
    });

    it('should handle large JSONB data correctly', () => {
      const largeMetadata = {};
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`field_${i}`] = {
          value: `value_${i}`,
          timestamp: new Date().toISOString(),
          metadata: {
            type: 'test',
            index: i,
          },
        };
      }

      const customer = new Customer({
        userId: 'user-123',
        metadata: largeMetadata,
      });

      expect(Object.keys(customer.metadata)).toHaveLength(1000);
      expect(customer.metadata.field_0?.value).toBe('value_0');
      expect(customer.metadata.field_999?.metadata?.index).toBe(999);
    });

    it('should handle complex nested JSONB structures', () => {
      const complexRequestData = {
        wizard: {
          step1: {
            companyInfo: {
              name: 'Complex Corp',
              industry: {
                primary: 'Technology',
                secondary: ['Consulting', 'Software Development'],
                specializations: {
                  ai: true,
                  blockchain: false,
                  iot: true,
                },
              },
            },
          },
          step2: {
            services: [
              {
                name: 'AI Consulting',
                description: 'Custom AI solutions',
                pricing: {
                  model: 'hourly',
                  rate: 150,
                  currency: 'USD',
                },
              },
            ],
          },
        },
      };

      const aiRequest = new AiRequest({
        customerId: 'customer-123',
        siteId: 'site-123',
        requestType: RequestType.CUSTOM,
        businessType: 'Technology',
        requestData: complexRequestData,
      });

      expect(aiRequest.requestData.wizard?.step1?.companyInfo?.name).toBe(
        'Complex Corp',
      );
      expect(
        aiRequest.requestData.wizard?.step1?.companyInfo?.industry
          ?.specializations?.ai,
      ).toBe(true);
      expect(
        aiRequest.requestData.wizard?.step2?.services?.[0]?.pricing?.rate,
      ).toBe(150);
    });
  });

  describe('Enum Validation', () => {
    it('should validate Customer enums correctly', () => {
      expect(Object.values(CustomerStatus)).toHaveLength(4);
      expect(Object.values(CustomerTier)).toHaveLength(4);
      expect(CustomerStatus.ACTIVE).toBe('active');
      expect(CustomerTier.PREMIUM).toBe('premium');
    });

    it('should validate AiRequest enums correctly', () => {
      expect(Object.values(RequestType)).toHaveLength(10);
      expect(Object.values(RequestStatus)).toHaveLength(7);
      expect(Object.values(RequestPriority)).toHaveLength(4);
      expect(RequestType.HERO).toBe('hero');
      expect(RequestStatus.PROCESSING).toBe('processing');
      expect(RequestPriority.URGENT).toBe('urgent');
    });

    it('should validate AdminActivityLog enums correctly', () => {
      expect(Object.values(AdminAction)).toHaveLength(37); // Count all actions
      expect(Object.values(TargetType)).toHaveLength(8);
      expect(AdminAction.AI_REQUEST_ASSIGNED).toBe('ai_request_assigned');
      expect(TargetType.AI_REQUEST).toBe('ai_request');
    });

    it('should validate AiRequestHistory enums correctly', () => {
      expect(Object.values(ChangeType)).toHaveLength(10);
      expect(ChangeType.STATUS_CHANGE).toBe('status_change');
      expect(ChangeType.CUSTOMER_FEEDBACK).toBe('customer_feedback');
    });
  });
});
