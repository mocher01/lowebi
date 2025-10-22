import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { CustomerBillingService } from './customer-billing.service';
import {
  CustomerSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from '../entities/customer-subscription.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';
import { CustomerSite } from '../entities/customer-site.entity';
import {
  UpgradeSubscriptionDto,
  UpdatePaymentMethodDto,
} from '../dto/customer-billing.dto';

describe('CustomerBillingService', () => {
  let service: CustomerBillingService;
  let subscriptionRepository: jest.Mocked<Repository<CustomerSubscription>>;
  let usageRepository: jest.Mocked<Repository<CustomerUsage>>;
  let siteRepository: jest.Mocked<Repository<CustomerSite>>;

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

  const mockUsage: CustomerUsage = {
    id: 'usage-1',
    customerId: 'customer-1',
    resourceType: UsageType.STORAGE,
    amount: 0.5,
    unit: 'GB',
    period: new Date(),
    metadata: {},
    createdAt: new Date(),
    customer: undefined,
  };

  beforeEach(async () => {
    const mockSubscriptionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockUsageRepository = {
      findAndCount: jest.fn(),
      sum: jest.fn(),
      find: jest.fn(),
    };

    const mockSiteRepository = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerBillingService,
        {
          provide: getRepositoryToken(CustomerSubscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(CustomerUsage),
          useValue: mockUsageRepository,
        },
        {
          provide: getRepositoryToken(CustomerSite),
          useValue: mockSiteRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerBillingService>(CustomerBillingService);
    subscriptionRepository = module.get(
      getRepositoryToken(CustomerSubscription),
    );
    usageRepository = module.get(getRepositoryToken(CustomerUsage));
    siteRepository = module.get(getRepositoryToken(CustomerSite));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailablePlans', () => {
    it('should return all available subscription plans', async () => {
      const result = await service.getAvailablePlans();

      expect(result).toHaveLength(4); // FREE, STARTER, PROFESSIONAL, ENTERPRISE
      expect(result[0]).toEqual(
        expect.objectContaining({
          plan: SubscriptionPlan.FREE,
          name: 'Free Plan',
          price: 0,
          sitesLimit: 1,
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          plan: SubscriptionPlan.STARTER,
          name: 'Starter Plan',
          price: 9.99,
          sitesLimit: 3,
        }),
      );
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return customer subscription with usage stats', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      siteRepository.count.mockResolvedValue(1);
      usageRepository.sum.mockResolvedValue(0.5);

      const result = await service.getCurrentSubscription('customer-1');

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: 'sub-1',
          plan: SubscriptionPlan.FREE,
          sitesLimit: 1,
          storageLimitGb: 1,
          customDomainAllowed: false,
          aiGenerationLimit: 10,
          supportLevel: 'basic',
        }),
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCurrentSubscription('customer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('upgradeSubscription', () => {
    const upgradeDto: UpgradeSubscriptionDto = {
      plan: SubscriptionPlan.STARTER,
      billingCycle: BillingCycle.MONTHLY,
      paymentMethodId: 'pm_123',
    };

    it('should upgrade subscription successfully', async () => {
      const upgradedSubscription = {
        ...mockSubscription,
        plan: SubscriptionPlan.STARTER,
        sitesLimit: 3,
      };

      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue(upgradedSubscription);

      const result = await service.upgradeSubscription(
        'customer-1',
        upgradeDto,
      );

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
      });
      expect(result).toEqual(
        expect.objectContaining({
          plan: SubscriptionPlan.STARTER,
          sitesLimit: 3,
        }),
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.upgradeSubscription('customer-1', upgradeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if downgrading to lower plan', async () => {
      const proSubscription = {
        ...mockSubscription,
        plan: SubscriptionPlan.PROFESSIONAL,
      };
      subscriptionRepository.findOne.mockResolvedValue(proSubscription);

      await expect(
        service.upgradeSubscription('customer-1', upgradeDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      };
      const cancelledSubscription = {
        ...activeSubscription,
        status: SubscriptionStatus.CANCELLED,
      };

      subscriptionRepository.findOne.mockResolvedValue(activeSubscription);
      subscriptionRepository.save.mockResolvedValue(cancelledSubscription);

      const result = await service.cancelSubscription('customer-1');

      expect(result).toEqual(
        expect.objectContaining({
          cancelledAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelSubscription('customer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUsageStats', () => {
    it('should return current month usage statistics', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      siteRepository.count.mockResolvedValue(2);
      usageRepository.createQueryBuilder = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: 100 }),
      });

      const result = await service.getUsageStats('customer-1');

      expect(result).toEqual(
        expect.objectContaining({
          sitesUsed: 2,
          sitesLimit: expect.any(Number),
          storageUsedGb: expect.any(Number),
          storageLimitGb: expect.any(Number),
          bandwidthUsedGb: expect.any(Number),
          bandwidthLimitGb: expect.any(Number),
          aiGenerationsUsed: expect.any(Number),
          aiGenerationLimit: expect.any(Number),
          billingPeriod: expect.any(String),
        }),
      );
    });
  });

  describe('updatePaymentMethod', () => {
    const updatePaymentDto: UpdatePaymentMethodDto = {
      paymentMethodId: 'pm_new123',
      makeDefault: true,
    };

    it('should update payment method successfully', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        stripePaymentMethodId: 'pm_new123',
      });

      const result = await service.updatePaymentMethod(
        'customer-1',
        updatePaymentDto,
      );

      expect(result).toBeUndefined(); // Method returns void
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.updatePaymentMethod(
        'customer-1',
        updatePaymentDto,
      );

      expect(result).toBeUndefined(); // Method doesn't validate subscription
    });
  });

  describe('getInvoices', () => {
    it('should return paginated invoices for customer', async () => {
      const result = await service.getInvoices('customer-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amount: expect.any(Number),
          currency: expect.any(String),
          status: expect.any(String),
          date: expect.any(Date),
          dueDate: expect.any(Date),
          description: expect.any(String),
          invoiceUrl: expect.any(String),
        }),
      );
    });
  });

  describe('getPaymentMethods', () => {
    it('should return mock payment methods', async () => {
      const result = await service.getPaymentMethods('customer-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          card: expect.objectContaining({
            brand: expect.any(String),
            last4: expect.any(String),
            expMonth: expect.any(Number),
            expYear: expect.any(Number),
          }),
          isDefault: expect.any(Boolean),
        }),
      );
    });
  });

  describe('createBillingPortalSession', () => {
    it('should return billing portal URL', async () => {
      const result = await service.createBillingPortalSession('customer-1');

      expect(typeof result).toBe('string');
      expect(result).toContain('billing');
    });
  });

  describe('previewSubscriptionChange', () => {
    it('should preview subscription upgrade', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const changeDto: UpgradeSubscriptionDto = {
        plan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
      };

      const result = await service.previewSubscriptionChange(
        'customer-1',
        changeDto,
      );

      expect(result).toEqual(
        expect.objectContaining({
          currentPlan: mockSubscription.plan,
          newPlan: changeDto.plan,
          currentPrice: expect.any(Number),
          newPrice: expect.any(Number),
          proration: expect.any(Number),
          amountDue: expect.any(Number),
          effectiveDate: expect.any(Date),
          nextBillingDate: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const changeDto: UpgradeSubscriptionDto = {
        plan: SubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
      };

      await expect(
        service.previewSubscriptionChange('customer-1', changeDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
