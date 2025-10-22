import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AdminActivityLog,
  AdminAction,
  TargetType,
} from './admin-activity-log.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

describe('AdminActivityLog Entity', () => {
  let activityLogRepository: Repository<AdminActivityLog>;
  let userRepository: Repository<User>;
  let module: TestingModule;

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
  } as User;

  const mockActivityLog = {
    id: 'log-123',
    adminId: 'admin-123',
    action: AdminAction.AI_REQUEST_ASSIGNED,
    targetType: TargetType.AI_REQUEST,
    targetId: 'request-123',
    targetDescription: 'Hero content request for TechCorp',
    details: {
      previousValue: null,
      newValue: 'admin-456',
      reason: 'High priority request',
      metadata: {
        requestType: 'hero',
        priority: 'high',
        estimatedCost: 25.0,
      },
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    sessionId: 'session-789',
    requestId: 'req-456',
    severity: 'info' as const,
    executionDuration: 150,
    success: true,
    errorDetails: null,
    timestamp: new Date(),
    admin: mockAdmin,
  } as AdminActivityLog;

  beforeEach(async () => {
    const mockActivityLogRepository = {
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

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(AdminActivityLog),
          useValue: mockActivityLogRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    activityLogRepository = module.get<Repository<AdminActivityLog>>(
      getRepositoryToken(AdminActivityLog),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Entity Creation', () => {
    it('should create an activity log with required fields', () => {
      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
      });

      expect(activityLog.adminId).toBe('admin-123');
      expect(activityLog.action).toBe(AdminAction.AI_REQUEST_ASSIGNED);
      expect(activityLog.targetType).toBe(TargetType.AI_REQUEST);
      expect(activityLog.targetId).toBe('request-123');
      expect(activityLog.details).toEqual({});
      expect(activityLog.severity).toBe('info');
      expect(activityLog.success).toBe(true);
    });

    it('should create an activity log with all fields', () => {
      const activityLog = new AdminActivityLog(mockActivityLog);

      expect(activityLog.id).toBe('log-123');
      expect(activityLog.adminId).toBe('admin-123');
      expect(activityLog.action).toBe(AdminAction.AI_REQUEST_ASSIGNED);
      expect(activityLog.targetType).toBe(TargetType.AI_REQUEST);
      expect(activityLog.targetId).toBe('request-123');
      expect(activityLog.targetDescription).toBe(
        'Hero content request for TechCorp',
      );
      expect(activityLog.details).toEqual({
        previousValue: null,
        newValue: 'admin-456',
        reason: 'High priority request',
        metadata: {
          requestType: 'hero',
          priority: 'high',
          estimatedCost: 25.0,
        },
      });
      expect(activityLog.ipAddress).toBe('192.168.1.100');
      expect(activityLog.sessionId).toBe('session-789');
      expect(activityLog.severity).toBe('info');
      expect(activityLog.executionDuration).toBe(150);
      expect(activityLog.success).toBe(true);
    });
  });

  describe('Enums', () => {
    it('should have correct AdminAction enum values for AI requests', () => {
      expect(AdminAction.AI_REQUEST_ASSIGNED).toBe('ai_request_assigned');
      expect(AdminAction.AI_REQUEST_STARTED).toBe('ai_request_started');
      expect(AdminAction.AI_REQUEST_COMPLETED).toBe('ai_request_completed');
      expect(AdminAction.AI_REQUEST_REJECTED).toBe('ai_request_rejected');
      expect(AdminAction.AI_REQUEST_CANCELLED).toBe('ai_request_cancelled');
      expect(AdminAction.AI_REQUEST_PRIORITY_CHANGED).toBe(
        'ai_request_priority_changed',
      );
      expect(AdminAction.AI_REQUEST_NOTES_UPDATED).toBe(
        'ai_request_notes_updated',
      );
    });

    it('should have correct AdminAction enum values for customer management', () => {
      expect(AdminAction.CUSTOMER_PROFILE_VIEWED).toBe(
        'customer_profile_viewed',
      );
      expect(AdminAction.CUSTOMER_PROFILE_UPDATED).toBe(
        'customer_profile_updated',
      );
      expect(AdminAction.CUSTOMER_STATUS_CHANGED).toBe(
        'customer_status_changed',
      );
      expect(AdminAction.CUSTOMER_TIER_CHANGED).toBe('customer_tier_changed');
      expect(AdminAction.CUSTOMER_DELETED).toBe('customer_deleted');
      expect(AdminAction.CUSTOMER_SUSPENDED).toBe('customer_suspended');
      expect(AdminAction.CUSTOMER_ACTIVATED).toBe('customer_activated');
    });

    it('should have correct AdminAction enum values for queue management', () => {
      expect(AdminAction.QUEUE_BULK_ASSIGN).toBe('queue_bulk_assign');
      expect(AdminAction.QUEUE_BULK_COMPLETE).toBe('queue_bulk_complete');
      expect(AdminAction.QUEUE_BULK_REJECT).toBe('queue_bulk_reject');
      expect(AdminAction.QUEUE_FILTER_APPLIED).toBe('queue_filter_applied');
      expect(AdminAction.QUEUE_EXPORT).toBe('queue_export');
    });

    it('should have correct TargetType enum values', () => {
      expect(TargetType.AI_REQUEST).toBe('ai_request');
      expect(TargetType.CUSTOMER).toBe('customer');
      expect(TargetType.SITE).toBe('site');
      expect(TargetType.USER).toBe('user');
      expect(TargetType.TEMPLATE).toBe('template');
      expect(TargetType.SYSTEM).toBe('system');
      expect(TargetType.QUEUE).toBe('queue');
      expect(TargetType.CONTENT).toBe('content');
    });
  });

  describe('JSONB Details Field', () => {
    it('should handle complex details correctly', () => {
      const complexDetails = {
        previousValue: {
          status: 'pending',
          priority: 'normal',
          adminId: null,
        },
        newValue: {
          status: 'assigned',
          priority: 'high',
          adminId: 'admin-456',
        },
        reason: 'Urgent customer request',
        batchSize: 1,
        filters: {
          requestType: ['hero', 'about'],
          priority: ['high', 'urgent'],
          createdAfter: '2023-01-01',
        },
        duration: 2500,
        success: true,
        metadata: {
          triggeredBy: 'manual',
          customerTier: 'premium',
          escalated: true,
          notifications: {
            email: true,
            slack: true,
          },
          history: [
            { timestamp: '2023-01-15T10:00:00Z', action: 'created' },
            { timestamp: '2023-01-15T10:05:00Z', action: 'assigned' },
          ],
        },
      };

      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        details: complexDetails,
      });

      expect(activityLog.details).toEqual(complexDetails);
      expect(activityLog.details.previousValue.status).toBe('pending');
      expect(activityLog.details.newValue.adminId).toBe('admin-456');
      expect(activityLog.details.metadata.notifications.email).toBe(true);
      expect(activityLog.details.metadata.history).toHaveLength(2);
    });

    it('should handle empty details object', () => {
      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.DASHBOARD_ACCESSED,
        targetType: TargetType.SYSTEM,
        targetId: 'dashboard',
        details: {},
      });

      expect(activityLog.details).toEqual({});
    });

    it('should handle error details', () => {
      const errorDetails = {
        success: false,
        errorMessage: 'Failed to assign request: Admin not available',
        metadata: {
          errorCode: 'ADMIN_UNAVAILABLE',
          retryable: true,
          stackTrace: 'Error: Admin not available at...',
        },
      };

      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        details: errorDetails,
        severity: 'error',
        success: false,
        errorDetails: 'Assignment failed due to admin availability',
      });

      expect(activityLog.details.success).toBe(false);
      expect(activityLog.details.errorMessage).toBe(
        'Failed to assign request: Admin not available',
      );
      expect(activityLog.severity).toBe('error');
      expect(activityLog.success).toBe(false);
      expect(activityLog.errorDetails).toBe(
        'Assignment failed due to admin availability',
      );
    });
  });

  describe('Helper Methods', () => {
    it('should calculate isRecent correctly', () => {
      const recentTimestamp = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const recentLog = new AdminActivityLog({
        ...mockActivityLog,
        timestamp: recentTimestamp,
      });

      const oldLog = new AdminActivityLog({
        ...mockActivityLog,
        timestamp: oldTimestamp,
      });

      expect(recentLog.isRecent).toBe(true);
      expect(oldLog.isRecent).toBe(false);
    });

    it('should calculate isError correctly', () => {
      const successLog = new AdminActivityLog({
        ...mockActivityLog,
        severity: 'info',
        success: true,
      });

      const errorLog = new AdminActivityLog({
        ...mockActivityLog,
        severity: 'error',
        success: true,
      });

      const criticalLog = new AdminActivityLog({
        ...mockActivityLog,
        severity: 'critical',
        success: false,
      });

      const failedLog = new AdminActivityLog({
        ...mockActivityLog,
        severity: 'info',
        success: false,
      });

      expect(successLog.isError).toBe(false);
      expect(errorLog.isError).toBe(true);
      expect(criticalLog.isError).toBe(true);
      expect(failedLog.isError).toBe(true);
    });
  });

  describe('Severity Levels', () => {
    it('should handle all severity levels correctly', () => {
      const severityLevels = [
        'debug',
        'info',
        'warning',
        'error',
        'critical',
      ] as const;

      severityLevels.forEach((severity) => {
        const activityLog = new AdminActivityLog({
          adminId: 'admin-123',
          action: AdminAction.SYSTEM_MAINTENANCE,
          targetType: TargetType.SYSTEM,
          targetId: 'system',
          severity,
        });

        expect(activityLog.severity).toBe(severity);
      });
    });
  });

  describe('Repository Operations', () => {
    it('should create and save an activity log', async () => {
      const logData = {
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_COMPLETED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-456',
        details: {
          actualCost: 30.0,
          processingTime: 5000,
        },
      };

      const activityLog = new AdminActivityLog(logData);

      jest.spyOn(activityLogRepository, 'create').mockReturnValue(activityLog);
      jest.spyOn(activityLogRepository, 'save').mockResolvedValue(activityLog);

      const createdLog = activityLogRepository.create(logData);
      const savedLog = await activityLogRepository.save(createdLog);

      expect(activityLogRepository.create).toHaveBeenCalledWith(logData);
      expect(activityLogRepository.save).toHaveBeenCalledWith(activityLog);
      expect(savedLog).toEqual(activityLog);
    });

    it('should find logs with pagination and filters', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActivityLog]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      jest
        .spyOn(activityLogRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      const logs = await queryBuilder
        .leftJoinAndSelect('log.admin', 'admin')
        .where('log.adminId = :adminId', { adminId: 'admin-123' })
        .andWhere('log.action IN (:...actions)', {
          actions: [
            AdminAction.AI_REQUEST_ASSIGNED,
            AdminAction.AI_REQUEST_COMPLETED,
          ],
        })
        .orderBy('log.timestamp', 'DESC')
        .skip(0)
        .take(10)
        .getMany();

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'log.admin',
        'admin',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'log.adminId = :adminId',
        { adminId: 'admin-123' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'log.action IN (:...actions)',
        {
          actions: [
            AdminAction.AI_REQUEST_ASSIGNED,
            AdminAction.AI_REQUEST_COMPLETED,
          ],
        },
      );
      expect(logs).toEqual([mockActivityLog]);
    });

    it('should filter by target type and severity', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockActivityLog]),
      };

      jest
        .spyOn(activityLogRepository, 'createQueryBuilder')
        .mockReturnValue(queryBuilder as any);

      await queryBuilder
        .where('log.targetType = :targetType', {
          targetType: TargetType.AI_REQUEST,
        })
        .andWhere('log.severity IN (:...severities)', {
          severities: ['error', 'critical'],
        })
        .orderBy('log.timestamp', 'DESC')
        .getMany();

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'log.targetType = :targetType',
        {
          targetType: TargetType.AI_REQUEST,
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'log.severity IN (:...severities)',
        {
          severities: ['error', 'critical'],
        },
      );
    });
  });

  describe('Bulk Operations Logging', () => {
    it('should log bulk assignment operations', () => {
      const bulkAssignLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.QUEUE_BULK_ASSIGN,
        targetType: TargetType.QUEUE,
        targetId: 'bulk-operation-456',
        details: {
          batchSize: 25,
          filters: {
            status: ['pending'],
            priority: ['high', 'urgent'],
            requestType: ['hero', 'about'],
          },
          assignedTo: 'admin-789',
          success: true,
          duration: 1500,
        },
        executionDuration: 1500,
      });

      expect(bulkAssignLog.action).toBe(AdminAction.QUEUE_BULK_ASSIGN);
      expect(bulkAssignLog.details.batchSize).toBe(25);
      expect(bulkAssignLog.details.assignedTo).toBe('admin-789');
      expect(bulkAssignLog.executionDuration).toBe(1500);
    });

    it('should log queue export operations', () => {
      const exportLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.QUEUE_EXPORT,
        targetType: TargetType.QUEUE,
        targetId: 'export-789',
        details: {
          format: 'csv',
          filters: {
            dateRange: {
              from: '2023-01-01',
              to: '2023-01-31',
            },
            status: ['completed', 'rejected'],
          },
          recordCount: 1500,
          fileSize: '2.5MB',
          downloadUrl: 'https://example.com/exports/queue-export-789.csv',
        },
      });

      expect(exportLog.action).toBe(AdminAction.QUEUE_EXPORT);
      expect(exportLog.details.format).toBe('csv');
      expect(exportLog.details.recordCount).toBe(1500);
      expect(exportLog.details.downloadUrl).toContain('queue-export-789.csv');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null optional fields', () => {
      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.DASHBOARD_ACCESSED,
        targetType: TargetType.SYSTEM,
        targetId: 'dashboard',
        targetDescription: null,
        ipAddress: null,
        userAgent: null,
        sessionId: null,
        requestId: null,
        executionDuration: null,
        errorDetails: null,
      });

      expect(activityLog.targetDescription).toBeNull();
      expect(activityLog.ipAddress).toBeNull();
      expect(activityLog.userAgent).toBeNull();
      expect(activityLog.sessionId).toBeNull();
      expect(activityLog.requestId).toBeNull();
      expect(activityLog.executionDuration).toBeNull();
      expect(activityLog.errorDetails).toBeNull();
    });

    it('should handle very long user agent strings', () => {
      const longUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'.repeat(
        50,
      );

      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        userAgent: longUserAgent,
      });

      expect(activityLog.userAgent).toBe(longUserAgent);
      expect(activityLog.userAgent.length).toBeGreaterThan(1000);
    });

    it('should handle very detailed error information', () => {
      const detailedError = {
        success: false,
        errorMessage: 'Database connection timeout after 30 seconds',
        metadata: {
          errorCode: 'DB_TIMEOUT',
          errorStack: 'Error: Database timeout at...'.repeat(100),
          requestParams: {
            query: 'SELECT * FROM ai_requests WHERE...'.repeat(20),
            timeout: 30000,
          },
          systemState: {
            memoryUsage: 85.6,
            cpuUsage: 92.3,
            activeConnections: 147,
          },
        },
      };

      const activityLog = new AdminActivityLog({
        adminId: 'admin-123',
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: 'request-123',
        details: detailedError,
        severity: 'critical',
        success: false,
      });

      expect(activityLog.details.metadata.errorStack.length).toBeGreaterThan(
        1000,
      );
      expect(activityLog.details.metadata.systemState.memoryUsage).toBe(85.6);
      expect(activityLog.isError).toBe(true);
    });
  });
});
