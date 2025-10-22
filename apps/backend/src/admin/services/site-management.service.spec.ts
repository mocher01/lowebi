import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteManagementService } from './site-management.service';
import {
  CustomerSite,
  SiteStatus,
  SiteTemplate,
} from '../../customer/entities/customer-site.entity';
import { SiteAnalytics } from '../entities/site-analytics.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SiteManagementService', () => {
  let service: SiteManagementService;
  let siteRepository: jest.Mocked<Repository<CustomerSite>>;
  let analyticsRepository: jest.Mocked<Repository<SiteAnalytics>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;

  const mockSite = {
    id: 'site-uuid-1',
    name: 'Test Site',
    domain: 'test-site.example.com',
    description: 'A test site',
    template: SiteTemplate.BUSINESS,
    status: SiteStatus.DRAFT,
    userId: 'user-uuid-1',
    isActive: true,
    pageViews: 100,
    uniqueVisitors: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-uuid-1',
      email: 'test@example.com',
      fullName: 'Test User',
    },
  };

  const mockUser = {
    id: 'admin-uuid-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const mockSiteRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      findBy: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockSite], 1]),
      })),
    };

    const mockAnalyticsRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
        getRawOne: jest.fn().mockResolvedValue({ count: '50' }),
        getRawMany: jest.fn().mockResolvedValue([]),
        clone: jest.fn().mockReturnThis(),
      })),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockAuditLogRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteManagementService,
        {
          provide: getRepositoryToken(CustomerSite),
          useValue: mockSiteRepository,
        },
        {
          provide: getRepositoryToken(SiteAnalytics),
          useValue: mockAnalyticsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<SiteManagementService>(SiteManagementService);
    siteRepository = module.get(getRepositoryToken(CustomerSite));
    analyticsRepository = module.get(getRepositoryToken(SiteAnalytics));
    userRepository = module.get(getRepositoryToken(User));
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSite', () => {
    const createSiteDto = {
      name: 'New Site',
      domain: 'new-site.example.com',
      description: 'A new test site',
      template: SiteTemplate.BUSINESS,
    };

    it('should create a new site successfully', async () => {
      // First call - check domain doesn't exist
      // Second call - getSiteById retrieves the created site
      siteRepository.findOne
        .mockResolvedValueOnce(null) // Domain check returns null
        .mockResolvedValueOnce({
          ...mockSite,
          ...createSiteDto,
          user: mockUser,
        } as any); // getSiteById returns created site

      userRepository.findOne.mockResolvedValue(mockUser as any);
      siteRepository.save.mockResolvedValue({
        ...mockSite,
        ...createSiteDto,
        id: 'site-uuid-1',
      } as any);

      const result = await service.createSite(createSiteDto, 'admin-uuid-1');

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { domain: createSiteDto.domain },
      });
      expect(siteRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('site-uuid-1');
    });

    it('should throw BadRequestException if domain already exists', async () => {
      siteRepository.findOne.mockResolvedValue(mockSite as any);

      await expect(
        service.createSite(createSiteDto, 'admin-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      siteRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(null);

      const createSiteDtoWithUserId = {
        ...createSiteDto,
        userId: 'non-existent-user',
      };

      await expect(
        service.createSite(createSiteDtoWithUserId, 'admin-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSites', () => {
    it('should return paginated sites list', async () => {
      const query = { page: 1, limit: 20 };

      const result = await service.getSites(query);

      expect(result).toEqual({
        sites: expect.arrayContaining([
          expect.objectContaining({
            id: mockSite.id,
            name: mockSite.name,
            domain: mockSite.domain,
          }),
        ]),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should apply search filter correctly', async () => {
      const query = { page: 1, limit: 20, search: 'test' };

      await service.getSites(query);

      expect(siteRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('getSiteById', () => {
    it('should return site by ID', async () => {
      siteRepository.findOne.mockResolvedValue(mockSite as any);

      const result = await service.getSiteById('site-uuid-1');

      expect(result).toEqual(
        expect.objectContaining({
          id: mockSite.id,
          name: mockSite.name,
          domain: mockSite.domain,
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(service.getSiteById('non-existent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSite', () => {
    const updateSiteDto = {
      name: 'Updated Site Name',
      description: 'Updated description',
    };

    it('should update site successfully', async () => {
      siteRepository.findOne.mockResolvedValue(mockSite as any);
      siteRepository.save.mockResolvedValue({
        ...mockSite,
        ...updateSiteDto,
      } as any);

      const result = await service.updateSite(
        'site-uuid-1',
        updateSiteDto,
        'admin-uuid-1',
      );

      expect(siteRepository.save).toHaveBeenCalled();
      expect(auditLogRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSite('non-existent-uuid', updateSiteDto, 'admin-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if domain already exists', async () => {
      const updateWithDomain = {
        ...updateSiteDto,
        domain: 'existing-domain.com',
      };

      siteRepository.findOne
        .mockResolvedValueOnce(mockSite as any) // First call for site existence
        .mockResolvedValueOnce({ id: 'other-site' } as any); // Second call for domain check

      await expect(
        service.updateSite('site-uuid-1', updateWithDomain, 'admin-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteSite', () => {
    it('should soft delete site successfully', async () => {
      siteRepository.findOne.mockResolvedValue(mockSite as any);
      siteRepository.save.mockResolvedValue({
        ...mockSite,
        status: SiteStatus.ARCHIVED,
        isActive: false,
      } as any);

      await service.deleteSite('site-uuid-1', 'admin-uuid-1');

      expect(siteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SiteStatus.ARCHIVED,
          isActive: false,
        }),
      );
      expect(auditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteSite('non-existent-uuid', 'admin-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deploySite', () => {
    const deploySiteDto = {
      forceRebuild: false,
      environment: 'production' as const,
    };

    it('should initiate site deployment successfully', async () => {
      const activeSite = {
        ...mockSite,
        isActive: true,
        status: SiteStatus.PUBLISHED,
      };
      siteRepository.findOne.mockResolvedValue(activeSite as any);
      siteRepository.save.mockResolvedValue({
        ...activeSite,
        status: SiteStatus.DEPLOYING,
      } as any);

      const result = await service.deploySite(
        'site-uuid-1',
        deploySiteDto,
        'admin-uuid-1',
      );

      expect(result).toEqual(
        expect.objectContaining({
          message: 'Site deployment initiated successfully',
          deploymentId: expect.stringContaining('deploy_'),
        }),
      );
      expect(auditLogRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deploySite('non-existent-uuid', deploySiteDto, 'admin-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if site is inactive', async () => {
      siteRepository.findOne.mockResolvedValue({
        ...mockSite,
        isActive: false,
      } as any);

      await expect(
        service.deploySite('site-uuid-1', deploySiteDto, 'admin-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSiteAnalytics', () => {
    const analyticsQuery = {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      granularity: 'day' as const,
    };

    it('should return site analytics successfully', async () => {
      siteRepository.findOne.mockResolvedValue(mockSite as any);

      const result = await service.getSiteAnalytics(
        'site-uuid-1',
        analyticsQuery,
      );

      expect(result).toEqual(
        expect.objectContaining({
          siteId: 'site-uuid-1',
          totalPageViews: expect.any(Number),
          uniqueVisitors: expect.any(Number),
          topPages: expect.any(Array),
          trafficSources: expect.any(Array),
          deviceBreakdown: expect.any(Array),
          timeSeries: expect.any(Array),
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getSiteAnalytics('non-existent-uuid', analyticsQuery),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkSiteOperation', () => {
    const bulkOperationDto = {
      siteIds: ['site-uuid-1', 'site-uuid-2'],
      operation: 'activate' as const,
      reason: 'Bulk activation test',
    };

    it('should perform bulk operation successfully', async () => {
      const sites = [
        { ...mockSite, id: 'site-uuid-1' },
        { ...mockSite, id: 'site-uuid-2' },
      ];

      siteRepository.findBy.mockResolvedValue(sites as any);
      siteRepository.save.mockResolvedValue({} as any);

      const result = await service.bulkSiteOperation(
        bulkOperationDto,
        'admin-uuid-1',
      );

      expect(result).toEqual({
        message: 'Bulk activate completed successfully',
        processedCount: 2,
      });
      expect(siteRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if some sites not found', async () => {
      siteRepository.findBy.mockResolvedValue([mockSite] as any); // Only one site found

      await expect(
        service.bulkSiteOperation(bulkOperationDto, 'admin-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
