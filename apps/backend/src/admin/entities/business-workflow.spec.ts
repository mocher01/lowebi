/**
 * Business Logic Validation and Workflow Testing
 * Tests complete AI queue workflows and business rules
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

describe('Business Logic and Workflow Validation', () => {
  let customer: Customer;
  let admin: User;
  let aiRequest: AiRequest;

  beforeEach(() => {
    // Setup test entities
    admin = {
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

    customer = new Customer({
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
        },
      },
    });

    aiRequest = new AiRequest({
      id: 'request-123',
      customerId: customer.id,
      siteId: 'site-123',
      requestType: RequestType.HERO,
      businessType: 'Technology',
      requestData: {
        companyName: 'Test Company',
        industry: 'Technology',
        targetAudience: 'Business professionals',
        tone: 'professional',
      },
    });
  });

  describe('AI Request Lifecycle Workflow', () => {
    it('should follow complete request lifecycle from creation to completion', () => {
      // 1. Initial request creation
      expect(aiRequest.status).toBe(RequestStatus.PENDING);
      expect(aiRequest.priority).toBe(RequestPriority.NORMAL);
      expect(aiRequest.adminId).toBeUndefined();
      expect(aiRequest.completedAt).toBeUndefined();

      // 2. Admin assignment
      const assignmentTime = new Date();
      aiRequest.adminId = admin.id;
      aiRequest.assignedAt = assignmentTime;
      aiRequest.status = RequestStatus.ASSIGNED;

      expect(aiRequest.adminId).toBe(admin.id);
      expect(aiRequest.assignedAt).toBe(assignmentTime);
      expect(aiRequest.status).toBe(RequestStatus.ASSIGNED);

      // 3. Processing start
      const startTime = new Date();
      aiRequest.startedAt = startTime;
      aiRequest.status = RequestStatus.PROCESSING;

      expect(aiRequest.startedAt).toBe(startTime);
      expect(aiRequest.status).toBe(RequestStatus.PROCESSING);

      // 4. Content generation
      aiRequest.generatedContent = {
        content: 'Generated hero content for Test Company...',
        metadata: {
          modelUsed: 'gpt-4',
          tokensConsumed: 150,
          generationTime: 2000,
          confidence: 0.95,
        },
        keywords: ['technology', 'professional', 'business'],
      };

      expect(aiRequest.generatedContent.content).toContain('Test Company');
      expect(aiRequest.generatedContent.metadata?.confidence).toBe(0.95);

      // 5. Request completion (with enough time difference for duration calculation)
      const completionTime = new Date(startTime.getTime() + 60000); // 1 minute later
      aiRequest.completedAt = completionTime;
      aiRequest.status = RequestStatus.COMPLETED;
      aiRequest.actualCost = 0.75;

      expect(aiRequest.completedAt).toBe(completionTime);
      expect(aiRequest.status).toBe(RequestStatus.COMPLETED);
      expect(aiRequest.actualCost).toBe(0.75);
      expect(aiRequest.totalDuration).toBeGreaterThan(0);
    });

    it('should handle request rejection workflow', () => {
      // 1. Request assignment
      aiRequest.adminId = admin.id;
      aiRequest.status = RequestStatus.ASSIGNED;

      // 2. Request rejection
      aiRequest.status = RequestStatus.REJECTED;
      aiRequest.adminComments =
        'Insufficient information provided for content generation';
      aiRequest.processingNotes =
        'Customer needs to provide more details about target audience';

      expect(aiRequest.status).toBe(RequestStatus.REJECTED);
      expect(aiRequest.adminComments).toContain('Insufficient information');
      expect(aiRequest.processingNotes).toContain('target audience');
    });

    it('should handle request cancellation workflow', () => {
      // 1. Customer cancels request
      aiRequest.status = RequestStatus.CANCELLED;
      aiRequest.processingNotes = 'Cancelled by customer request';

      expect(aiRequest.status).toBe(RequestStatus.CANCELLED);
      expect(aiRequest.isOverdue).toBe(false); // Cancelled requests are not overdue
    });

    it('should handle failed request workflow', () => {
      // 1. Request processing failure
      aiRequest.status = RequestStatus.FAILED;
      aiRequest.errorMessage =
        'API rate limit exceeded during content generation';
      aiRequest.retryCount = 1;

      expect(aiRequest.status).toBe(RequestStatus.FAILED);
      expect(aiRequest.errorMessage).toContain('rate limit');
      expect(aiRequest.retryCount).toBe(1);

      // 2. Retry attempt
      aiRequest.retryCount = 2;
      aiRequest.status = RequestStatus.PENDING; // Reset for retry

      expect(aiRequest.retryCount).toBe(2);
      expect(aiRequest.status).toBe(RequestStatus.PENDING);
    });
  });

  describe('Activity Logging Workflow', () => {
    it('should log request assignment activity', () => {
      const activityLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        details: {
          previousValue: null,
          newValue: admin.id,
          reason: 'Auto-assignment based on admin workload',
        },
      });

      expect(activityLog.action).toBe(AdminAction.AI_REQUEST_ASSIGNED);
      expect(activityLog.targetType).toBe(TargetType.AI_REQUEST);
      expect(activityLog.details.newValue).toBe(admin.id);
      expect(activityLog.success).toBe(true);
      expect(activityLog.severity).toBe('info');
    });

    it('should log request completion activity', () => {
      const activityLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_COMPLETED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        details: {
          processingTime: 1800000, // 30 minutes
          tokensUsed: 150,
          quality: 'excellent',
        },
        executionDuration: 1800000,
      });

      expect(activityLog.action).toBe(AdminAction.AI_REQUEST_COMPLETED);
      expect(activityLog.details.quality).toBe('excellent');
      expect(activityLog.executionDuration).toBe(1800000);
    });

    it('should log bulk operations activity', () => {
      const bulkLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.QUEUE_BULK_ASSIGN,
        targetType: TargetType.QUEUE,
        targetId: 'bulk-operation-456',
        details: {
          batchSize: 25,
          filters: {
            status: ['pending'],
            priority: ['high', 'urgent'],
          },
          assignedAdmins: ['admin-123', 'admin-456'],
          duration: 2500,
        },
      });

      expect(bulkLog.action).toBe(AdminAction.QUEUE_BULK_ASSIGN);
      expect(bulkLog.details.batchSize).toBe(25);
      expect(bulkLog.details.assignedAdmins).toHaveLength(2);
    });
  });

  describe('Request History Tracking', () => {
    it('should track status changes with history', () => {
      const statusHistory = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.ASSIGNED,
        changedBy: admin.id,
        changedByRole: 'admin',
        changeReason: 'Manual assignment by admin',
        details: {
          automaticChange: false,
          adminNotes: 'Assigned to experienced admin for complex request',
        },
      });

      expect(statusHistory.isStatusChange).toBe(true);
      expect(statusHistory.previousStatus).toBe(RequestStatus.PENDING);
      expect(statusHistory.newStatus).toBe(RequestStatus.ASSIGNED);
      expect(statusHistory.isSystemGenerated).toBe(false);
      expect(statusHistory.changeDescription).toContain('pending');
      expect(statusHistory.changeDescription).toContain('assigned');
    });

    it('should track priority changes', () => {
      const priorityHistory = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.PRIORITY_CHANGE,
        previousValue: RequestPriority.NORMAL,
        newValue: RequestPriority.HIGH,
        changedBy: admin.id,
        changeReason: 'Premium customer request',
        details: {
          customerTier: CustomerTier.PREMIUM,
          escalationReason: 'Customer complained about delay',
        },
      });

      expect(priorityHistory.changeType).toBe(ChangeType.PRIORITY_CHANGE);
      expect(priorityHistory.previousValue).toBe(RequestPriority.NORMAL);
      expect(priorityHistory.newValue).toBe(RequestPriority.HIGH);
      expect(priorityHistory.details.customerTier).toBe(CustomerTier.PREMIUM);
    });

    it('should track customer feedback', () => {
      const feedbackHistory = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.CUSTOMER_FEEDBACK,
        changedBy: customer.userId,
        changedByRole: 'customer',
        details: {
          customerFeedback: {
            rating: 4,
            comment:
              'Good content but needs minor adjustments for our brand voice',
          },
          adminNotes: 'Customer satisfied with overall quality',
        },
      });

      expect(feedbackHistory.changeType).toBe(ChangeType.CUSTOMER_FEEDBACK);
      expect(feedbackHistory.hasUserFeedback).toBe(true);
      expect(feedbackHistory.details.customerFeedback?.rating).toBe(4);
      expect(feedbackHistory.changedByRole).toBe('customer');
    });

    it('should track system-generated changes', () => {
      const systemHistory = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.RETRY_ATTEMPT,
        changedBy: 'system',
        changedByRole: 'system',
        source: 'automatic',
        details: {
          automaticChange: true,
          systemGenerated: true,
          retryAttempt: 2,
          errorReason: 'API timeout',
        },
      });

      expect(systemHistory.isSystemGenerated).toBe(true);
      expect(systemHistory.source).toBe('automatic');
      expect(systemHistory.details.retryAttempt).toBe(2);
    });
  });

  describe('Customer Management Workflow', () => {
    it('should handle customer tier upgrades', () => {
      expect(customer.tier).toBe(CustomerTier.PREMIUM);

      // Upgrade to enterprise
      customer.tier = CustomerTier.ENTERPRISE;
      customer.totalSpent = 5000.0;

      expect(customer.tier).toBe(CustomerTier.ENTERPRISE);
      expect(customer.totalSpent).toBe(5000.0);
    });

    it('should handle customer status changes', () => {
      expect(customer.status).toBe(CustomerStatus.ACTIVE);

      // Suspend customer
      customer.status = CustomerStatus.SUSPENDED;
      customer.lastActivityAt = new Date();

      expect(customer.status).toBe(CustomerStatus.SUSPENDED);
      expect(customer.lastActivityAt).toBeDefined();
    });

    it('should track customer activity metrics', () => {
      // Simulate customer activity
      customer.sitesCount = 3;
      customer.aiRequestsCount = 15;
      customer.totalSpent = 250.75;
      customer.lastActivityAt = new Date();

      expect(customer.sitesCount).toBe(3);
      expect(customer.aiRequestsCount).toBe(15);
      expect(customer.totalSpent).toBe(250.75);
      expect(customer.lastActivityAt).toBeDefined();
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate request expiration logic', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const expiredRequest = new AiRequest({
        customerId: customer.id,
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        expiresAt: pastDate,
      });

      const validRequest = new AiRequest({
        customerId: customer.id,
        siteId: 'site-124',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        expiresAt: futureDate,
      });

      expect(expiredRequest.isExpired).toBe(true);
      expect(validRequest.isExpired).toBe(false);
    });

    it('should validate overdue request logic', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

      const overdueRequest = new AiRequest({
        customerId: customer.id,
        siteId: 'site-123',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        createdAt: oldDate,
      });

      const completedRequest = new AiRequest({
        customerId: customer.id,
        siteId: 'site-124',
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {},
        createdAt: oldDate,
        status: RequestStatus.COMPLETED,
      });

      expect(overdueRequest.isOverdue).toBe(true);
      expect(completedRequest.isOverdue).toBe(false); // Completed requests are not overdue
    });

    it('should validate activity log severity levels', () => {
      const infoLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        severity: 'info',
      });

      const errorLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_STARTED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        severity: 'error',
        success: false,
        errorDetails: 'Failed to initialize AI processing',
      });

      expect(infoLog.isError).toBe(false);
      expect(errorLog.isError).toBe(true);
      expect(errorLog.errorDetails).toContain('Failed to initialize');
    });

    it('should validate recent activity detection', () => {
      const recentTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const recentLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_COMPLETED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        timestamp: recentTime,
      });

      const oldLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_COMPLETED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        timestamp: oldTime,
      });

      expect(recentLog.isRecent).toBe(true);
      expect(oldLog.isRecent).toBe(false);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain referential integrity between entities', () => {
      // Customer and AiRequest relationship
      const relatedRequest = new AiRequest({
        customerId: customer.id,
        siteId: 'site-123',
        requestType: RequestType.HERO,
        businessType: customer.businessType || 'Default',
        requestData: {},
      });

      expect(relatedRequest.customerId).toBe(customer.id);
      expect(relatedRequest.businessType).toBe(customer.businessType);
    });

    it('should maintain audit trail completeness', () => {
      // Create activity log for the request
      const activityLog = new AdminActivityLog({
        adminId: admin.id,
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: aiRequest.id,
        details: {
          requestType: aiRequest.requestType,
          customerName: customer.companyName,
        },
      });

      // Create history entry for the same action
      const historyEntry = new AiRequestHistory({
        requestId: aiRequest.id,
        changeType: ChangeType.ASSIGNMENT_CHANGE,
        previousValue: null,
        newValue: admin.id,
        changedBy: admin.id,
        details: {
          adminName: admin.fullName,
        },
      });

      expect(activityLog.targetId).toBe(historyEntry.requestId);
      expect(activityLog.adminId).toBe(historyEntry.changedBy);
    });

    it('should validate enum consistency across entities', () => {
      // Test that enums are consistently used
      const request = new AiRequest({
        customerId: customer.id,
        siteId: 'site-123',
        requestType: RequestType.HERO,
        businessType: 'Technology',
        status: RequestStatus.PENDING,
        priority: RequestPriority.NORMAL,
        requestData: {},
      });

      const history = new AiRequestHistory({
        requestId: request.id,
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.ASSIGNED,
        changedBy: admin.id,
      });

      expect(request.status).toBe(history.previousStatus);
      expect(RequestStatus.ASSIGNED).toBe(history.newStatus);
    });
  });
});
