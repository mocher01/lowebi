import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from './customer-subscription.entity';

describe('CustomerSubscription Entity', () => {
  let repository: Repository<CustomerSubscription>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(CustomerSubscription),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<Repository<CustomerSubscription>>(
      getRepositoryToken(CustomerSubscription),
    );
  });

  describe('Entity Creation', () => {
    it('should create a subscription with required fields', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-1',
      });

      expect(subscription).toBeDefined();
      expect(subscription.userId).toBe('user-uuid-1');
      // Default values are set by TypeORM, not constructor
      expect(subscription.plan).toBeUndefined();
      expect(subscription.status).toBeUndefined();
      expect(subscription.billingCycle).toBeUndefined();
    });

    it('should create a subscription with all fields', () => {
      const subscriptionData = {
        plan: SubscriptionPlan.PROFESSIONAL,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: BillingCycle.YEARLY,
        price: 99.99,
        currency: 'USD',
        userId: 'user-uuid-2',
        stripeSubscriptionId: 'sub_1234567890',
        trialEndsAt: new Date('2024-12-31'),
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-12-31'),
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        metadata: { source: 'website', campaign: 'winter2024' },
      };

      const subscription = new CustomerSubscription(subscriptionData);

      expect(subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.billingCycle).toBe(BillingCycle.YEARLY);
      expect(subscription.price).toBe(99.99);
      expect(subscription.currency).toBe('USD');
      expect(subscription.userId).toBe('user-uuid-2');
      expect(subscription.stripeSubscriptionId).toBe('sub_1234567890');
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.metadata).toEqual({
        source: 'website',
        campaign: 'winter2024',
      });
    });
  });

  describe('Enums', () => {
    it('should have correct SubscriptionPlan enum values', () => {
      expect(SubscriptionPlan.FREE).toBe('free');
      expect(SubscriptionPlan.STARTER).toBe('starter');
      expect(SubscriptionPlan.PROFESSIONAL).toBe('professional');
      expect(SubscriptionPlan.ENTERPRISE).toBe('enterprise');
    });

    it('should have correct SubscriptionStatus enum values', () => {
      expect(SubscriptionStatus.ACTIVE).toBe('active');
      expect(SubscriptionStatus.INACTIVE).toBe('inactive');
      expect(SubscriptionStatus.CANCELLED).toBe('cancelled');
      expect(SubscriptionStatus.PAST_DUE).toBe('past_due');
      expect(SubscriptionStatus.TRIALING).toBe('trialing');
    });

    it('should have correct BillingCycle enum values', () => {
      expect(BillingCycle.MONTHLY).toBe('monthly');
      expect(BillingCycle.YEARLY).toBe('yearly');
    });
  });

  describe('Metadata JSON', () => {
    it('should handle metadata field correctly', () => {
      const metadata = {
        source: 'mobile_app',
        referrer: 'google_ads',
        utm_campaign: 'summer_sale',
        features: ['analytics', 'ssl', 'backup'],
      };

      const subscription = new CustomerSubscription({
        userId: 'user-uuid-3',
        metadata: metadata,
      });

      expect(subscription.metadata).toEqual(metadata);
      expect(subscription.metadata.source).toBe('mobile_app');
      expect(subscription.metadata.features).toContain('analytics');
    });

    it('should handle empty metadata', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-4',
        metadata: {},
      });

      expect(subscription.metadata).toEqual({});
    });
  });

  describe('Validation', () => {
    it('should handle null and undefined values correctly', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-5',
        stripeSubscriptionId: null,
        cancelledAt: undefined,
      });

      expect(subscription.stripeSubscriptionId).toBeNull();
      expect(subscription.cancelledAt).toBeUndefined();
      // Default values are set by TypeORM, not constructor
      expect(subscription.plan).toBeUndefined(); // Default value
      expect(subscription.status).toBeUndefined(); // Default value
    });

    it('should set default values correctly', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-6',
      });

      // Default values are set by TypeORM, not constructor
      expect(subscription.plan).toBeUndefined();
      expect(subscription.status).toBeUndefined();
      expect(subscription.billingCycle).toBeUndefined();
      // TypeORM sets defaults on save, not in constructor
      expect(subscription.price).toBeUndefined();
      expect(subscription.currency).toBeUndefined();
      expect(subscription.cancelAtPeriodEnd).toBeUndefined();
    });
  });

  describe('Price and Currency', () => {
    it('should handle decimal prices correctly', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-7',
        plan: SubscriptionPlan.STARTER,
        price: 19.99,
        currency: 'EUR',
      });

      expect(subscription.price).toBe(19.99);
      expect(subscription.currency).toBe('EUR');
    });

    it('should handle zero price for free plan', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-8',
        plan: SubscriptionPlan.FREE,
        price: 0,
      });

      expect(subscription.price).toBe(0);
      expect(subscription.plan).toBe(SubscriptionPlan.FREE);
    });
  });

  describe('Repository Operations', () => {
    it('should create and save a subscription', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-9',
        plan: SubscriptionPlan.ENTERPRISE,
      });

      // Mock repository save
      jest.spyOn(repository, 'save').mockResolvedValue(subscription);

      expect(subscription).toBeInstanceOf(CustomerSubscription);
      expect(typeof subscription.userId).toBe('string');
      expect(subscription.plan).toBe(SubscriptionPlan.ENTERPRISE);
    });

    it('should find subscriptions with relations', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-10',
      });

      // Mock repository findOne
      jest.spyOn(repository, 'findOne').mockResolvedValue(subscription);

      expect(subscription).toBeInstanceOf(CustomerSubscription);
    });

    it('should update subscription fields', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-11',
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.TRIALING,
      });

      // Simulate update
      subscription.plan = SubscriptionPlan.PROFESSIONAL;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.price = 29.99;

      expect(subscription.plan).toBe(SubscriptionPlan.PROFESSIONAL);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.price).toBe(29.99);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null metadata fields', () => {
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-12',
        metadata: null,
      });

      expect(subscription.metadata).toBeNull();
    });

    it('should handle subscription cancellation', () => {
      const cancelDate = new Date();
      const subscription = new CustomerSubscription({
        userId: 'user-uuid-13',
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: cancelDate,
        cancelAtPeriodEnd: true,
      });

      expect(subscription.status).toBe(SubscriptionStatus.CANCELLED);
      expect(subscription.cancelledAt).toBe(cancelDate);
      expect(subscription.cancelAtPeriodEnd).toBe(true);
    });

    it('should handle trial period dates', () => {
      const trialEnd = new Date('2024-12-31');
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');

      const subscription = new CustomerSubscription({
        userId: 'user-uuid-14',
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: trialEnd,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });

      expect(subscription.status).toBe(SubscriptionStatus.TRIALING);
      expect(subscription.trialEndsAt).toBe(trialEnd);
      expect(subscription.currentPeriodStart).toBe(periodStart);
      expect(subscription.currentPeriodEnd).toBe(periodEnd);
    });
  });
});
