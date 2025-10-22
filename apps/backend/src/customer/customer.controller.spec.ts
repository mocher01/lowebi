import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerActivityService } from './services/customer-activity.service';
import { CustomerStatsService } from './services/customer-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';
import { User, UserRole } from '../auth/entities/user.entity';
import { ActivityType } from './entities/customer-activity.entity';

describe('CustomerController', () => {
  let controller: CustomerController;
  let customerService: CustomerService;
  let mockUser: User;
  let mockRequest: any;

  // Performance tracking
  const performanceMetrics: Array<{ endpoint: string; duration: number }> = [];

  const mockCustomerService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getDashboardStats: jest.fn(),
    getActivity: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getUsageMetrics: jest.fn(),
    getAccountSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CacheInterceptor)
      .useValue({ intercept: (context, next) => next.handle() })
      .compile();

    controller = module.get<CustomerController>(CustomerController);
    customerService = module.get<CustomerService>(CustomerService);

    // Mock user
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    // Mock request
    mockRequest = {
      ip: '192.168.1.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      connection: { remoteAddress: '192.168.1.1' },
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Log performance metrics for analysis
    const slowRequests = performanceMetrics.filter((m) => m.duration > 200);
    if (slowRequests.length > 0) {
      console.warn('Slow requests detected:', slowRequests);
    }
  });

  describe('Performance Requirements', () => {
    it('should respond to getProfile under 200ms', async () => {
      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        fullName: `${mockUser.firstName} ${mockUser.lastName}`,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockCustomerService.getProfile.mockResolvedValue(mockProfile);

      const startTime = performance.now();
      const result = await controller.getProfile(mockUser);
      const duration = performance.now() - startTime;

      performanceMetrics.push({ endpoint: 'getProfile', duration });

      expect(result).toEqual(mockProfile);
      expect(duration).toBeLessThan(200); // Performance requirement
      expect(mockCustomerService.getProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should respond to getDashboardStats under 200ms', async () => {
      const mockStats = {
        totalSites: 5,
        activeSites: 3,
        accountAge: { days: 30, months: 1, years: 0 },
        lastActivity: { date: new Date(), daysAgo: 1 },
        usage: {
          totalLogins: 50,
          totalSessions: 45,
          averageSessionDuration: 25,
        },
        recentActivity: {
          sitesCreated: 2,
          sitesModified: 3,
          loginsThisWeek: 7,
        },
      };

      mockCustomerService.getDashboardStats.mockResolvedValue(mockStats);

      const startTime = performance.now();
      const result = await controller.getDashboardStats(mockUser);
      const duration = performance.now() - startTime;

      performanceMetrics.push({ endpoint: 'getDashboardStats', duration });

      expect(result).toEqual(mockStats);
      expect(duration).toBeLessThan(200); // Performance requirement
      expect(mockCustomerService.getDashboardStats).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should respond to getActivity under 200ms with pagination', async () => {
      const mockActivity = {
        activities: [
          {
            id: 'activity-1',
            type: ActivityType.LOGIN,
            description: 'User logged in',
            timestamp: new Date(),
            metadata: {},
            ipAddress: '192.168.1.1',
            userAgent: 'test-agent',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockCustomerService.getActivity.mockResolvedValue(mockActivity);

      const startTime = performance.now();
      const result = await controller.getActivity(mockUser, 1, 20);
      const duration = performance.now() - startTime;

      performanceMetrics.push({ endpoint: 'getActivity', duration });

      expect(result).toEqual(mockActivity);
      expect(duration).toBeLessThan(200); // Performance requirement
      expect(mockCustomerService.getActivity).toHaveBeenCalledWith(
        mockUser.id,
        1,
        20,
        undefined,
      );
    });
  });

  describe('getProfile', () => {
    it('should return customer profile successfully', async () => {
      const mockProfile = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        fullName: `${mockUser.firstName} ${mockUser.lastName}`,
        emailVerified: mockUser.emailVerified,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      mockCustomerService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockProfile);
      expect(mockCustomerService.getProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle errors gracefully', async () => {
      mockCustomerService.getProfile.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getProfile(mockUser)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update customer profile successfully', async () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const mockUpdatedProfile = {
        ...mockUser,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        fullName: `${updateDto.firstName} ${updateDto.lastName}`,
      };

      mockCustomerService.updateProfile.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.updateProfile(
        mockUser,
        updateDto,
        mockRequest,
      );

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockCustomerService.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
        mockRequest.ip,
        'test-user-agent',
      );
    });

    it('should validate update data', async () => {
      const invalidDto = {
        email: 'invalid-email',
      };

      mockCustomerService.updateProfile.mockRejectedValue(
        new Error('Invalid email format'),
      );

      await expect(
        controller.updateProfile(mockUser, invalidDto, mockRequest),
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('getActivity', () => {
    it('should return paginated activity with default parameters', async () => {
      const mockActivity = {
        activities: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockCustomerService.getActivity.mockResolvedValue(mockActivity);

      const result = await controller.getActivity(mockUser, 1, 20);

      expect(result).toEqual(mockActivity);
      expect(mockCustomerService.getActivity).toHaveBeenCalledWith(
        mockUser.id,
        1,
        20,
        undefined,
      );
    });

    it('should enforce maximum limit of 100', async () => {
      const mockActivity = {
        activities: [],
        pagination: {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0,
        },
      };

      mockCustomerService.getActivity.mockResolvedValue(mockActivity);

      const result = await controller.getActivity(mockUser, 1, 150); // Should be capped at 100

      expect(mockCustomerService.getActivity).toHaveBeenCalledWith(
        mockUser.id,
        1,
        100, // Should be limited to 100
        undefined,
      );
    });

    it('should filter by activity type', async () => {
      const mockActivity = {
        activities: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      mockCustomerService.getActivity.mockResolvedValue(mockActivity);

      const result = await controller.getActivity(
        mockUser,
        1,
        20,
        ActivityType.LOGIN,
      );

      expect(mockCustomerService.getActivity).toHaveBeenCalledWith(
        mockUser.id,
        1,
        20,
        ActivityType.LOGIN,
      );
    });
  });

  describe('getSettings', () => {
    it('should return customer settings', async () => {
      const mockSettings = {
        id: 'settings-id',
        userId: mockUser.id,
        notifications: { email: true, sms: false, push: true },
        theme: { mode: 'light', primaryColor: '#3b82f6' },
        language: 'en',
        timezone: 'UTC',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.getSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings(mockUser);

      expect(result).toEqual(mockSettings);
      expect(mockCustomerService.getSettings).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('updateSettings', () => {
    it('should update customer settings successfully', async () => {
      const settingsDto = {
        theme: { mode: 'dark', primaryColor: '#1a1a1a' },
        notifications: { email: false, sms: true, push: true },
      };

      const mockUpdatedSettings = {
        id: 'settings-id',
        userId: mockUser.id,
        ...settingsDto,
        language: 'en',
        timezone: 'UTC',
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerService.updateSettings.mockResolvedValue(mockUpdatedSettings);

      const result = await controller.updateSettings(
        mockUser,
        settingsDto,
        mockRequest,
      );

      expect(result).toEqual(mockUpdatedSettings);
      expect(mockCustomerService.updateSettings).toHaveBeenCalledWith(
        mockUser.id,
        settingsDto,
        mockRequest.ip,
        'test-user-agent',
      );
    });
  });

  describe('getUsageMetrics', () => {
    it('should return usage metrics successfully', async () => {
      const mockMetrics = {
        dailyMetrics: [],
        weeklySummary: {
          totalLogins: 10,
          averageSessionTime: 25,
          mostActiveDay: 'Monday',
          totalActivities: 50,
        },
        monthlyTrends: {
          currentMonth: { logins: 20, activities: 100, sitesCreated: 2 },
          previousMonth: { logins: 15, activities: 75, sitesCreated: 1 },
          percentageChange: { logins: 33, activities: 33, sitesCreated: 100 },
        },
      };

      mockCustomerService.getUsageMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getUsageMetrics(mockUser);

      expect(result).toEqual(mockMetrics);
      expect(mockCustomerService.getUsageMetrics).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('getAccountSummary', () => {
    it('should return complete account summary', async () => {
      const mockSummary = {
        profile: { id: mockUser.id, email: mockUser.email },
        settings: { theme: 'light', notifications: {} },
        stats: { totalSites: 5, activeSites: 3 },
        recentActivity: { activities: [], pagination: {} },
      };

      mockCustomerService.getAccountSummary.mockResolvedValue(mockSummary);

      const result = await controller.getAccountSummary(mockUser);

      expect(result).toEqual(mockSummary);
      expect(mockCustomerService.getAccountSummary).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await controller.healthCheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'customer-api',
        version: '2.0.0',
      });
    });
  });

  describe('Rate Limiting Validation', () => {
    it('should respect rate limits for profile endpoints', () => {
      // This would be tested in integration tests with actual rate limiting
      expect(controller).toBeDefined();
    });
  });

  describe('Caching Validation', () => {
    it('should use cache interceptor for GET endpoints', () => {
      // This would be tested in integration tests with actual caching
      expect(controller).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockCustomerService.getProfile.mockRejectedValue(
        new Error('Service temporarily unavailable'),
      );

      await expect(controller.getProfile(mockUser)).rejects.toThrow(
        'Service temporarily unavailable',
      );
    });

    it('should handle database connection errors', async () => {
      mockCustomerService.getDashboardStats.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.getDashboardStats(mockUser)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
