import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Repository } from 'typeorm';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getManyAndCount: jest.fn(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    update: jest.fn(),
    findAndCount: jest.fn(),
    query: jest.fn(),
  };

  const mockAdminService = {
    getDashboardStats: jest.fn(),
    getSystemHealth: jest.fn(),
    getAdminActivity: jest.fn(),
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    resetUserPassword: jest.fn(),
    getAllSessions: jest.fn(),
    terminateSession: jest.fn(),
    terminateAllUserSessions: jest.fn(),
    logDashboardAccess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 20,
        adminUsers: 5,
        customerUsers: 95,
        activeSessions: 45,
        totalSessions: 150,
        recentLogins: 15,
        lastUpdated: new Date(),
      };

      const mockUser = { id: 'admin-id', role: UserRole.ADMIN } as User;
      const mockRequest = {
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-agent'),
      };

      mockAdminService.getDashboardStats.mockResolvedValue(mockStats);
      mockAdminService.logDashboardAccess.mockResolvedValue(undefined);

      const result = await controller.getDashboardStats(
        mockUser,
        mockRequest as any,
      );

      expect(result).toEqual(mockStats);
      expect(service.getDashboardStats).toHaveBeenCalled();
      expect(service.logDashboardAccess).toHaveBeenCalledWith(
        'admin-id',
        '127.0.0.1',
        'test-agent',
      );
    });
  });

  describe('getAdminActivity', () => {
    it('should return admin activity feed', async () => {
      const mockActivity = {
        activities: [
          {
            id: 'activity-1',
            action: 'user_created',
            adminUserEmail: 'admin@test.com',
            targetResource: 'user',
            metadata: { email: 'newuser@test.com' },
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockAdminService.getAdminActivity.mockResolvedValue(mockActivity);

      const result = await controller.getAdminActivity(1, 20);

      expect(result).toEqual(mockActivity);
      expect(service.getAdminActivity).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        version: '1.0.0',
        uptime: new Date(),
        database: {
          status: 'connected' as const,
          responseTime: 15,
        },
        memory: {
          used: 100000000,
          total: 200000000,
          percentage: 50,
        },
      };

      mockAdminService.getSystemHealth.mockResolvedValue(mockHealth);

      const result = await controller.getSystemHealth();

      expect(result).toEqual(mockHealth);
      expect(service.getSystemHealth).toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsersResponse = {
        users: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            role: UserRole.CUSTOMER,
            isActive: true,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            activeSessionsCount: 1,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      const query = { page: 1, limit: 20 };
      mockAdminService.getUsers.mockResolvedValue(mockUsersResponse);

      const result = await controller.getUsers(query);

      expect(result).toEqual(mockUsersResponse);
      expect(service.getUsers).toHaveBeenCalledWith(query);
    });
  });

  describe('getUserById', () => {
    it('should return user details', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activeSessionsCount: 1,
      };

      mockAdminService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(service.getUserById).toHaveBeenCalledWith('user-1');
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated data', async () => {
      const updateDto = { firstName: 'Jane', isActive: false };
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'user1@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        fullName: 'Jane Doe',
        role: UserRole.CUSTOMER,
        isActive: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        activeSessionsCount: 0,
      };

      const mockAdmin = { id: 'admin-id' } as User;
      mockAdminService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(
        'user-1',
        updateDto,
        mockAdmin,
      );

      expect(result).toEqual(mockUpdatedUser);
      expect(service.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateDto,
        'admin-id',
      );
    });
  });
});
