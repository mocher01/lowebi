import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { CustomerSitesService } from './customer-sites.service';
import { CustomerSite, SiteStatus } from '../entities/customer-site.entity';
import {
  CustomerSubscription,
  SubscriptionPlan,
} from '../entities/customer-subscription.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';
import {
  CreateCustomerSiteDto,
  UpdateCustomerSiteDto,
  DeploySiteDto,
} from '../dto/customer-site.dto';

describe('CustomerSitesService', () => {
  let service: CustomerSitesService;
  let siteRepository: jest.Mocked<Repository<CustomerSite>>;
  let subscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
  let usageRepository: jest.Mocked<Repository<CustomerUsage>>;

  const mockCustomerSite: CustomerSite = {
    id: 'site-1',
    name: 'Test Site',
    subdomain: 'testsite',
    customDomain: null,
    description: 'A test website',
    status: SiteStatus.DRAFT,
    configuration: { theme: 'default' },
    content: { pages: [], components: [] },
    customerId: 'customer-1',
    subscriptionId: 'sub-1',
    buildPath: '/builds/site-1',
    deploymentUrl: 'https://testsite.example.com',
    lastDeployedAt: null,
    sslEnabled: false,
    seoTitle: 'Test Site',
    seoDescription: 'A test website for testing',
    seoKeywords: ['test', 'website'],
    analyticsId: null,
    customCode: null,
    favicon: null,
    socialImage: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    customer: undefined,
    subscription: undefined,
    usage: [],
  };

  const mockSubscription: CustomerSubscription = {
    id: 'sub-1',
    customerId: 'customer-1',
    plan: SubscriptionPlan.FREE,
    sitesLimit: 1,
    storageLimitGb: 1,
    bandwidthLimitGb: 10,
    customDomainAllowed: false,
    aiGenerationLimit: 10,
    supportLevel: 'basic',
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: undefined,
    sites: [],
  };

  beforeEach(async () => {
    const mockSiteRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockSubscriptionRepository = {
      findOne: jest.fn(),
    };

    const mockUsageRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerSitesService,
        {
          provide: getRepositoryToken(CustomerSite),
          useValue: mockSiteRepository,
        },
        {
          provide: getRepositoryToken(CustomerSubscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(CustomerUsage),
          useValue: mockUsageRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerSitesService>(CustomerSitesService);
    siteRepository = module.get(getRepositoryToken(CustomerSite));
    subscriptionRepository = module.get(
      getRepositoryToken(CustomerSubscription),
    );
    usageRepository = module.get(getRepositoryToken(CustomerUsage));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listSites', () => {
    it('should return paginated sites for a customer', async () => {
      const options = { page: 1, limit: 10 };
      siteRepository.findAndCount.mockResolvedValue([[mockCustomerSite], 1]);

      const result = await service.listSites('customer-1', options);

      expect(siteRepository.findAndCount).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
        order: { updatedAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        sites: [
          expect.objectContaining({
            id: 'site-1',
            name: 'Test Site',
            subdomain: 'testsite',
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should filter sites by status', async () => {
      const options = { page: 1, limit: 10, status: 'active' };
      siteRepository.findAndCount.mockResolvedValue([[mockCustomerSite], 1]);

      await service.listSites('customer-1', options);

      expect(siteRepository.findAndCount).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', status: 'active' },
        order: { updatedAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should search sites by name or subdomain', async () => {
      const options = { page: 1, limit: 10, search: 'test' };
      siteRepository.findAndCount.mockResolvedValue([[mockCustomerSite], 1]);

      await service.listSites('customer-1', options);

      expect(siteRepository.findAndCount).toHaveBeenCalledWith({
        where: [
          { customerId: 'customer-1', name: Like('%test%') },
          { customerId: 'customer-1', subdomain: Like('%test%') },
        ],
        order: { updatedAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('createSite', () => {
    const createSiteDto: CreateCustomerSiteDto = {
      name: 'New Site',
      subdomain: 'newsite',
      description: 'A new test site',
      configuration: { theme: 'modern' },
    };

    it('should create a new site successfully', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      siteRepository.count.mockResolvedValue(0);
      siteRepository.create.mockReturnValue(mockCustomerSite);
      siteRepository.save.mockResolvedValue(mockCustomerSite);
      usageRepository.create.mockReturnValue({} as any);
      usageRepository.save.mockResolvedValue({} as any);

      const result = await service.createSite('customer-1', createSiteDto);

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
      });
      expect(siteRepository.count).toHaveBeenCalledWith({
        where: { customerId: 'customer-1', isActive: true },
      });
      expect(siteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Site',
          subdomain: 'newsite',
          customerId: 'customer-1',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'site-1',
          name: 'Test Site',
        }),
      );
    });

    it('should throw BadRequestException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createSite('customer-1', createSiteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if site limit exceeded', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      siteRepository.count.mockResolvedValue(1); // Already at limit

      await expect(
        service.createSite('customer-1', createSiteDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSite', () => {
    it('should return site by id for customer', async () => {
      siteRepository.findOne.mockResolvedValue(mockCustomerSite);

      const result = await service.getSite('customer-1', 'site-1');

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'site-1', customerId: 'customer-1' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'site-1',
          name: 'Test Site',
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getSite('customer-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSite', () => {
    const updateSiteDto: UpdateCustomerSiteDto = {
      name: 'Updated Site',
      description: 'Updated description',
    };

    it('should update site successfully', async () => {
      siteRepository.findOne.mockResolvedValue(mockCustomerSite);
      const updatedSite = { ...mockCustomerSite, ...updateSiteDto };
      siteRepository.save.mockResolvedValue(updatedSite);

      const result = await service.updateSite(
        'customer-1',
        'site-1',
        updateSiteDto,
      );

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'site-1', customerId: 'customer-1' },
      });
      expect(siteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Site',
          description: 'Updated description',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          name: 'Updated Site',
          description: 'Updated description',
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSite('customer-1', 'nonexistent', updateSiteDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSite', () => {
    it('should delete site successfully', async () => {
      siteRepository.findOne.mockResolvedValue(mockCustomerSite);
      siteRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteSite('customer-1', 'site-1');

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'site-1', customerId: 'customer-1' },
      });
      expect(siteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'site-1',
          isActive: false,
          status: SiteStatus.SUSPENDED,
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteSite('customer-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deploySite', () => {
    const deploySiteDto: DeploySiteDto = {
      environment: 'production',
    };

    it('should deploy site successfully', async () => {
      const deployingSite = {
        ...mockCustomerSite,
        status: SiteStatus.DEPLOYING,
      };
      const deployedSite = { ...mockCustomerSite, status: SiteStatus.DEPLOYED };

      siteRepository.findOne.mockResolvedValue(mockCustomerSite);
      siteRepository.save.mockResolvedValueOnce(deployingSite);
      siteRepository.save.mockResolvedValueOnce(deployedSite);

      const result = await service.deploySite(
        'customer-1',
        'site-1',
        deploySiteDto,
      );

      expect(siteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'site-1', customerId: 'customer-1' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          deploymentStatus: 'building',
          deploymentUrl: expect.any(String),
          message: expect.any(String),
        }),
      );
    });

    it('should throw NotFoundException if site not found', async () => {
      siteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deploySite('customer-1', 'nonexistent', deploySiteDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
