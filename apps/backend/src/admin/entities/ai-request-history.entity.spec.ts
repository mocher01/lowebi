import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiRequestHistory, ChangeType } from './ai-request-history.entity';
import {
  AiRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
} from './ai-request.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

describe('AiRequestHistory Entity', () => {
  let historyRepository: Repository<AiRequestHistory>;
  let requestRepository: Repository<AiRequest>;
  let userRepository: Repository<User>;
  let module: TestingModule;

  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
  } as User;

  const mockRequest = {
    id: 'request-123',
    customerId: 'customer-456',
    siteId: 'site-789',
    requestType: RequestType.HERO,
    status: RequestStatus.PENDING,
    priority: RequestPriority.NORMAL,
  } as AiRequest;

  const mockHistory = {
    id: 'history-123',
    requestId: 'request-123',
    changeType: ChangeType.STATUS_CHANGE,
    previousStatus: RequestStatus.PENDING,
    newStatus: RequestStatus.ASSIGNED,
    previousValue: {
      status: 'pending',
      adminId: null,
      assignedAt: null,
    },
    newValue: {
      status: 'assigned',
      adminId: 'admin-456',
      assignedAt: '2023-01-15T10:00:00Z',
    },
    changedBy: 'user-123',
    changedByRole: 'admin' as const,
    changeReason: 'High priority customer request',
    details: {
      automaticChange: false,
      systemGenerated: false,
      batchOperation: false,
      processingTime: 150,
      adminNotes: 'Assigned due to premium customer status',
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session-789',
    source: 'manual' as const,
    timestamp: new Date(),
    request: mockRequest,
    user: mockUser,
  } as AiRequestHistory;

  beforeEach(async () => {
    const mockHistoryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
        getCount: jest.fn(),
      })),
    };

    const mockRequestRepository = {
      findOne: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(AiRequestHistory),
          useValue: mockHistoryRepository,
        },
        {
          provide: getRepositoryToken(AiRequest),
          useValue: mockRequestRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    historyRepository = module.get<Repository<AiRequestHistory>>(
      getRepositoryToken(AiRequestHistory),
    );
    requestRepository = module.get<Repository<AiRequest>>(
      getRepositoryToken(AiRequest),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Entity Creation', () => {
    it('should create a history record with required fields', () => {
      const history = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        changedBy: 'user-123',
      });

      expect(history.requestId).toBe('request-123');
      expect(history.changeType).toBe(ChangeType.STATUS_CHANGE);
      expect(history.changedBy).toBe('user-123');
      expect(history.changedByRole).toBe('admin');
      expect(history.details).toEqual({});
      expect(history.source).toBe('manual');
    });

    it('should create a history record with all fields', () => {
      const history = new AiRequestHistory(mockHistory);

      expect(history.id).toBe('history-123');
      expect(history.requestId).toBe('request-123');
      expect(history.changeType).toBe(ChangeType.STATUS_CHANGE);
      expect(history.previousStatus).toBe(RequestStatus.PENDING);
      expect(history.newStatus).toBe(RequestStatus.ASSIGNED);
      expect(history.changedBy).toBe('user-123');
      expect(history.changedByRole).toBe('admin');
      expect(history.changeReason).toBe('High priority customer request');
      expect(history.details).toEqual({
        automaticChange: false,
        systemGenerated: false,
        batchOperation: false,
        processingTime: 150,
        adminNotes: 'Assigned due to premium customer status',
      });
      expect(history.source).toBe('manual');
    });
  });

  describe('Enums', () => {
    it('should have correct ChangeType enum values', () => {
      expect(ChangeType.STATUS_CHANGE).toBe('status_change');
      expect(ChangeType.ASSIGNMENT_CHANGE).toBe('assignment_change');
      expect(ChangeType.PRIORITY_CHANGE).toBe('priority_change');
      expect(ChangeType.CONTENT_UPDATE).toBe('content_update');
      expect(ChangeType.NOTES_UPDATE).toBe('notes_update');
      expect(ChangeType.COST_UPDATE).toBe('cost_update');
      expect(ChangeType.EXPIRY_UPDATE).toBe('expiry_update');
      expect(ChangeType.RETRY_ATTEMPT).toBe('retry_attempt');
      expect(ChangeType.REVISION_REQUEST).toBe('revision_request');
      expect(ChangeType.CUSTOMER_FEEDBACK).toBe('customer_feedback');
    });

    it('should support all change sources', () => {
      const sources = [
        'manual',
        'automatic',
        'api',
        'batch',
        'scheduled',
      ] as const;

      sources.forEach((source) => {
        const history = new AiRequestHistory({
          requestId: 'request-123',
          changeType: ChangeType.STATUS_CHANGE,
          changedBy: 'user-123',
          source,
        });

        expect(history.source).toBe(source);
      });
    });

    it('should support all changed by roles', () => {
      const roles = ['admin', 'customer', 'system'] as const;

      roles.forEach((role) => {
        const history = new AiRequestHistory({
          requestId: 'request-123',
          changeType: ChangeType.STATUS_CHANGE,
          changedBy: 'user-123',
          changedByRole: role,
        });

        expect(history.changedByRole).toBe(role);
      });
    });
  });

  describe('Status Change Tracking', () => {
    it('should track status changes correctly', () => {
      const statusHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.PROCESSING,
        previousValue: {
          status: 'pending',
          startedAt: null,
        },
        newValue: {
          status: 'processing',
          startedAt: '2023-01-15T10:00:00Z',
        },
        changedBy: 'admin-456',
        changeReason: 'Admin started processing the request',
      });

      expect(statusHistory.changeType).toBe(ChangeType.STATUS_CHANGE);
      expect(statusHistory.previousStatus).toBe(RequestStatus.PENDING);
      expect(statusHistory.newStatus).toBe(RequestStatus.PROCESSING);
      expect(statusHistory.previousValue.status).toBe('pending');
      expect(statusHistory.newValue.status).toBe('processing');
      expect(statusHistory.newValue.startedAt).toBe('2023-01-15T10:00:00Z');
    });

    it('should track assignment changes', () => {
      const assignmentHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.ASSIGNMENT_CHANGE,
        previousValue: {
          adminId: null,
          assignedAt: null,
        },
        newValue: {
          adminId: 'admin-789',
          assignedAt: '2023-01-15T09:30:00Z',
        },
        changedBy: 'admin-supervisor',
        changeReason: 'Reassigned to specialist',
      });

      expect(assignmentHistory.changeType).toBe(ChangeType.ASSIGNMENT_CHANGE);
      expect(assignmentHistory.previousValue.adminId).toBeNull();
      expect(assignmentHistory.newValue.adminId).toBe('admin-789');
    });

    it('should track priority changes', () => {
      const priorityHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.PRIORITY_CHANGE,
        previousValue: {
          priority: 'normal',
        },
        newValue: {
          priority: 'urgent',
        },
        changedBy: 'admin-123',
        changeReason: 'Customer escalation',
        details: {
          escalationReason: 'Premium customer with tight deadline',
          escalatedBy: 'customer-support',
        },
      });

      expect(priorityHistory.changeType).toBe(ChangeType.PRIORITY_CHANGE);
      expect(priorityHistory.previousValue.priority).toBe('normal');
      expect(priorityHistory.newValue.priority).toBe('urgent');
      expect(priorityHistory.details.escalationReason).toBe(
        'Premium customer with tight deadline',
      );
    });
  });

  describe('Content and Processing Changes', () => {
    it('should track content updates', () => {
      const contentHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CONTENT_UPDATE,
        previousValue: {
          generatedContent: null,
        },
        newValue: {
          generatedContent: {
            content: 'Generated hero content...',
            metadata: {
              modelUsed: 'gpt-4',
              tokensConsumed: 1200,
            },
          },
        },
        changedBy: 'admin-456',
        details: {
          automaticChange: false,
          processingTime: 5000,
          apiResponse: {
            model: 'gpt-4',
            usage: {
              prompt_tokens: 450,
              completion_tokens: 750,
              total_tokens: 1200,
            },
          },
        },
      });

      expect(contentHistory.changeType).toBe(ChangeType.CONTENT_UPDATE);
      expect(contentHistory.newValue.generatedContent.content).toBe(
        'Generated hero content...',
      );
      expect(contentHistory.details.processingTime).toBe(5000);
    });

    it('should track cost updates', () => {
      const costHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.COST_UPDATE,
        previousValue: {
          estimatedCost: 25.0,
          actualCost: null,
        },
        newValue: {
          estimatedCost: 25.0,
          actualCost: 28.5,
        },
        changedBy: 'system',
        changedByRole: 'system',
        details: {
          automaticChange: true,
          systemGenerated: true,
          costBreakdown: {
            baseRate: 20.0,
            premiumMultiplier: 1.2,
            processingFee: 3.5,
            taxes: 5.0,
          },
        },
        source: 'automatic',
      });

      expect(costHistory.changeType).toBe(ChangeType.COST_UPDATE);
      expect(costHistory.newValue.actualCost).toBe(28.5);
      expect(costHistory.details.costBreakdown.baseRate).toBe(20.0);
      expect(costHistory.source).toBe('automatic');
    });

    it('should track retry attempts', () => {
      const retryHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.RETRY_ATTEMPT,
        previousValue: {
          retryCount: 0,
          status: 'failed',
        },
        newValue: {
          retryCount: 1,
          status: 'processing',
        },
        changedBy: 'admin-456',
        details: {
          automaticChange: true,
          systemGenerated: true,
          validationErrors: [],
          retryReason: 'API timeout - retrying with different endpoint',
          maxRetries: 3,
        },
        source: 'automatic',
      });

      expect(retryHistory.changeType).toBe(ChangeType.RETRY_ATTEMPT);
      expect(retryHistory.newValue.retryCount).toBe(1);
      expect(retryHistory.details.retryReason).toBe(
        'API timeout - retrying with different endpoint',
      );
    });
  });

  describe('Customer Interaction Tracking', () => {
    it('should track customer feedback', () => {
      const feedbackHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CUSTOMER_FEEDBACK,
        changedBy: 'customer-789',
        changedByRole: 'customer',
        details: {
          customerFeedback: {
            rating: 4,
            comment: 'Good content but needs minor adjustments',
          },
          feedbackType: 'revision_request',
          specificIssues: [
            'Tone could be more professional',
            'Missing key service details',
          ],
        },
      });

      expect(feedbackHistory.changeType).toBe(ChangeType.CUSTOMER_FEEDBACK);
      expect(feedbackHistory.changedByRole).toBe('customer');
      expect(feedbackHistory.details.customerFeedback.rating).toBe(4);
      expect(feedbackHistory.details.specificIssues).toHaveLength(2);
    });

    it('should track revision requests', () => {
      const revisionHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.REVISION_REQUEST,
        changedBy: 'customer-789',
        changedByRole: 'customer',
        changeReason: 'Content needs to be more technical',
        details: {
          revisionRequests: [
            'Add more technical terminology',
            'Include specific metrics and KPIs',
            'Adjust tone to be more authoritative',
          ],
          priority: 'high',
          deadline: '2023-01-20T17:00:00Z',
        },
      });

      expect(revisionHistory.changeType).toBe(ChangeType.REVISION_REQUEST);
      expect(revisionHistory.details.revisionRequests).toHaveLength(3);
      expect(revisionHistory.details.priority).toBe('high');
    });
  });

  describe('Helper Methods', () => {
    it('should identify status changes correctly', () => {
      const statusHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        changedBy: 'user-123',
      });

      const contentHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CONTENT_UPDATE,
        changedBy: 'user-123',
      });

      expect(statusHistory.isStatusChange).toBe(true);
      expect(contentHistory.isStatusChange).toBe(false);
    });

    it('should identify system generated changes', () => {
      const manualChange = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.ASSIGNMENT_CHANGE,
        changedBy: 'admin-123',
        source: 'manual',
        details: {
          systemGenerated: false,
        },
      });

      const systemChange = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.COST_UPDATE,
        changedBy: 'system',
        source: 'automatic',
        details: {
          systemGenerated: true,
        },
      });

      const scheduledChange = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.EXPIRY_UPDATE,
        changedBy: 'system',
        source: 'scheduled',
      });

      expect(manualChange.isSystemGenerated).toBe(false);
      expect(systemChange.isSystemGenerated).toBe(true);
      expect(scheduledChange.isSystemGenerated).toBe(true);
    });

    it('should identify changes with user feedback', () => {
      const feedbackHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CUSTOMER_FEEDBACK,
        changedBy: 'customer-123',
        details: {
          customerFeedback: {
            rating: 5,
            comment: 'Excellent work!',
          },
        },
      });

      const regularHistory = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        changedBy: 'admin-123',
      });

      expect(feedbackHistory.hasUserFeedback).toBe(true);
      expect(regularHistory.hasUserFeedback).toBe(false);
    });

    it('should generate change descriptions correctly', () => {
      const statusChange = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.PENDING,
        newStatus: RequestStatus.COMPLETED,
        changedBy: 'admin-123',
      });

      const assignmentChange = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.ASSIGNMENT_CHANGE,
        changedBy: 'admin-123',
      });

      expect(statusChange.changeDescription).toBe(
        'Status changed from pending to completed',
      );
      expect(assignmentChange.changeDescription).toBe('Assignment changed');
    });
  });

  describe('Repository Operations', () => {
    it('should create and save a history record', async () => {
      const historyData = {
        requestId: 'request-123',
        changeType: ChangeType.STATUS_CHANGE,
        previousStatus: RequestStatus.ASSIGNED,
        newStatus: RequestStatus.PROCESSING,
        changedBy: 'admin-456',
      };

      const history = new AiRequestHistory(historyData);

      jest.spyOn(historyRepository, 'create').mockReturnValue(history);
      jest.spyOn(historyRepository, 'save').mockResolvedValue(history);

      const createdHistory = historyRepository.create(historyData);
      const savedHistory = await historyRepository.save(createdHistory);

      expect(historyRepository.create).toHaveBeenCalledWith(historyData);
      expect(historyRepository.save).toHaveBeenCalledWith(history);
      expect(savedHistory).toEqual(history);
    });

    it('should find history with relations', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockHistory]),
      };

      jest
        .spyOn(historyRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const history = await queryBuilder
        .leftJoinAndSelect('history.request', 'request')
        .leftJoinAndSelect('history.user', 'user')
        .where('history.requestId = :requestId', { requestId: 'request-123' })
        .orderBy('history.timestamp', 'DESC')
        .getMany();

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'history.request',
        'request',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'history.user',
        'user',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'history.requestId = :requestId',
        {
          requestId: 'request-123',
        },
      );
      expect(history).toEqual([mockHistory]);
    });

    it('should filter by change type and time range', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockHistory]),
      };

      jest
        .spyOn(historyRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await queryBuilder
        .where('history.changeType IN (:...types)', {
          types: [ChangeType.STATUS_CHANGE, ChangeType.ASSIGNMENT_CHANGE],
        })
        .andWhere('history.timestamp >= :startDate', {
          startDate: '2023-01-01',
        })
        .andWhere('history.timestamp <= :endDate', { endDate: '2023-01-31' })
        .orderBy('history.timestamp', 'DESC')
        .getMany();

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'history.changeType IN (:...types)',
        {
          types: [ChangeType.STATUS_CHANGE, ChangeType.ASSIGNMENT_CHANGE],
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'history.timestamp >= :startDate',
        {
          startDate: '2023-01-01',
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'history.timestamp <= :endDate',
        {
          endDate: '2023-01-31',
        },
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null previous and new values', () => {
      const history = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.NOTES_UPDATE,
        previousValue: null,
        newValue: null,
        changedBy: 'admin-123',
      });

      expect(history.previousValue).toBeNull();
      expect(history.newValue).toBeNull();
    });

    it('should handle complex nested details', () => {
      const complexDetails = {
        automaticChange: true,
        systemGenerated: true,
        batchOperation: true,
        validationErrors: [
          'Content length exceeds limit',
          'Invalid terminology detected',
        ],
        processingTime: 12500,
        apiResponse: {
          model: 'gpt-4',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Generated content...',
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 500,
            completion_tokens: 1500,
            total_tokens: 2000,
          },
        },
        customerFeedback: {
          rating: 3,
          comment: 'Good but needs improvement',
          categories: {
            quality: 4,
            relevance: 3,
            creativity: 2,
          },
        },
        metadata: {
          retryAttempts: 2,
          fallbackUsed: true,
          processingNode: 'node-us-east-1',
          queuePosition: 15,
        },
      };

      const history = new AiRequestHistory({
        requestId: 'request-123',
        changeType: ChangeType.CONTENT_UPDATE,
        changedBy: 'system',
        changedByRole: 'system',
        details: complexDetails,
      });

      expect(history.details).toEqual(complexDetails);
      expect(history.details.validationErrors).toHaveLength(2);
      expect(history.details.apiResponse.usage.total_tokens).toBe(2000);
      expect(history.details.customerFeedback.categories.quality).toBe(4);
    });
  });
});
