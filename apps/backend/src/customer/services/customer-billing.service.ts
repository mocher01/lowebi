import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerSubscription,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from '../entities/customer-subscription.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';
import { CustomerSite } from '../entities/customer-site.entity';
import {
  SubscriptionPlanDto,
  UpgradeSubscriptionDto,
  CustomerSubscriptionResponseDto,
  UsageStatsDto,
  InvoiceDto,
  UpdatePaymentMethodDto,
} from '../dto/customer-billing.dto';

@Injectable()
export class CustomerBillingService {
  constructor(
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(CustomerUsage)
    private readonly usageRepository: Repository<CustomerUsage>,
    @InjectRepository(CustomerSite)
    private readonly siteRepository: Repository<CustomerSite>,
  ) {}

  async getAvailablePlans(): Promise<SubscriptionPlanDto[]> {
    // Define available plans (could be stored in database or config)
    return [
      {
        plan: SubscriptionPlan.FREE,
        name: 'Free Plan',
        price: 0,
        billingCycle: BillingCycle.MONTHLY,
        sitesLimit: 1,
        storageLimitGb: 1,
        bandwidthLimitGb: 10,
        customDomainAllowed: false,
        aiGenerationLimit: 10,
        supportLevel: 'community',
        features: [
          '1 website',
          '1 GB storage',
          '10 GB bandwidth',
          'Basic templates',
          'Community support',
          '10 AI generations/month',
        ],
      },
      {
        plan: SubscriptionPlan.STARTER,
        name: 'Starter Plan',
        price: 9.99,
        billingCycle: BillingCycle.MONTHLY,
        sitesLimit: 3,
        storageLimitGb: 10,
        bandwidthLimitGb: 100,
        customDomainAllowed: true,
        aiGenerationLimit: 50,
        supportLevel: 'email',
        features: [
          '3 websites',
          '10 GB storage',
          '100 GB bandwidth',
          'All templates',
          'Custom domains',
          'Email support',
          '50 AI generations/month',
        ],
      },
      {
        plan: SubscriptionPlan.PROFESSIONAL,
        name: 'Professional Plan',
        price: 29.99,
        billingCycle: BillingCycle.MONTHLY,
        sitesLimit: 10,
        storageLimitGb: 50,
        bandwidthLimitGb: 500,
        customDomainAllowed: true,
        aiGenerationLimit: 200,
        supportLevel: 'priority',
        features: [
          '10 websites',
          '50 GB storage',
          '500 GB bandwidth',
          'Premium templates',
          'Custom domains',
          'Priority support',
          '200 AI generations/month',
          'Advanced analytics',
        ],
      },
      {
        plan: SubscriptionPlan.ENTERPRISE,
        name: 'Enterprise Plan',
        price: 99.99,
        billingCycle: BillingCycle.MONTHLY,
        sitesLimit: -1, // Unlimited
        storageLimitGb: 200,
        bandwidthLimitGb: 2000,
        customDomainAllowed: true,
        aiGenerationLimit: -1, // Unlimited
        supportLevel: 'dedicated',
        features: [
          'Unlimited websites',
          '200 GB storage',
          '2 TB bandwidth',
          'All templates',
          'Custom domains',
          'Dedicated support',
          'Unlimited AI generations',
          'Advanced analytics',
          'White-label options',
          'API access',
        ],
      },
    ];
  }

  async getCurrentSubscription(
    customerId: string,
  ): Promise<CustomerSubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      price: subscription.price,
      sitesLimit: subscription.sitesLimit,
      storageLimitGb: subscription.storageLimitGb,
      bandwidthLimitGb: subscription.bandwidthLimitGb,
      customDomainAllowed: subscription.customDomainAllowed,
      aiGenerationLimit: subscription.aiGenerationLimit,
      supportLevel: subscription.supportLevel,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
    };
  }

  async upgradeSubscription(
    customerId: string,
    upgradeDto: UpgradeSubscriptionDto,
  ): Promise<CustomerSubscriptionResponseDto> {
    const currentSubscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!currentSubscription) {
      throw new NotFoundException('Current subscription not found');
    }

    // Validate upgrade path
    const planHierarchy = [
      SubscriptionPlan.FREE,
      SubscriptionPlan.STARTER,
      SubscriptionPlan.PROFESSIONAL,
      SubscriptionPlan.ENTERPRISE,
    ];
    const currentPlanIndex = planHierarchy.indexOf(currentSubscription.plan);
    const newPlanIndex = planHierarchy.indexOf(upgradeDto.plan);

    if (newPlanIndex <= currentPlanIndex) {
      throw new BadRequestException('Cannot upgrade to same or lower plan');
    }

    // Get new plan details
    const plans = await this.getAvailablePlans();
    const newPlan = plans.find((p) => p.plan === upgradeDto.plan);

    if (!newPlan) {
      throw new BadRequestException('Invalid plan selected');
    }

    // TODO: Integrate with Stripe for payment processing
    // For now, simulate successful upgrade

    // Update subscription
    currentSubscription.plan = upgradeDto.plan;
    currentSubscription.billingCycle = upgradeDto.billingCycle;
    currentSubscription.price = newPlan.price;
    currentSubscription.sitesLimit = newPlan.sitesLimit;
    currentSubscription.storageLimitGb = newPlan.storageLimitGb;
    currentSubscription.bandwidthLimitGb = newPlan.bandwidthLimitGb;
    currentSubscription.customDomainAllowed = newPlan.customDomainAllowed;
    currentSubscription.aiGenerationLimit = newPlan.aiGenerationLimit;
    currentSubscription.supportLevel = newPlan.supportLevel;
    currentSubscription.status = SubscriptionStatus.ACTIVE;
    currentSubscription.currentPeriodStart = new Date();
    currentSubscription.currentPeriodEnd = this.calculatePeriodEnd(
      upgradeDto.billingCycle,
    );

    const updatedSubscription =
      await this.subscriptionRepository.save(currentSubscription);

    return this.getCurrentSubscription(customerId);
  }

  async downgradeSubscription(
    customerId: string,
    downgradeDto: UpgradeSubscriptionDto,
  ): Promise<CustomerSubscriptionResponseDto> {
    const currentSubscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!currentSubscription) {
      throw new NotFoundException('Current subscription not found');
    }

    // Check if downgrade is possible (e.g., customer has too many sites for new plan)
    const siteCount = await this.siteRepository.count({
      where: { customerId, isActive: true },
    });

    const plans = await this.getAvailablePlans();
    const newPlan = plans.find((p) => p.plan === downgradeDto.plan);

    if (!newPlan) {
      throw new BadRequestException('Invalid plan selected');
    }

    if (newPlan.sitesLimit !== -1 && siteCount > newPlan.sitesLimit) {
      throw new BadRequestException(
        `Cannot downgrade: You have ${siteCount} sites but the new plan allows only ${newPlan.sitesLimit}`,
      );
    }

    // Schedule downgrade for period end
    currentSubscription.plan = downgradeDto.plan;
    currentSubscription.billingCycle = downgradeDto.billingCycle;
    currentSubscription.price = newPlan.price;
    currentSubscription.sitesLimit = newPlan.sitesLimit;
    currentSubscription.storageLimitGb = newPlan.storageLimitGb;
    currentSubscription.bandwidthLimitGb = newPlan.bandwidthLimitGb;
    currentSubscription.customDomainAllowed = newPlan.customDomainAllowed;
    currentSubscription.aiGenerationLimit = newPlan.aiGenerationLimit;
    currentSubscription.supportLevel = newPlan.supportLevel;

    await this.subscriptionRepository.save(currentSubscription);

    return this.getCurrentSubscription(customerId);
  }

  async cancelSubscription(customerId: string): Promise<{ cancelledAt: Date }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Cannot cancel free plan');
    }

    // Schedule cancellation for period end
    subscription.cancelledAt = new Date();
    subscription.status = SubscriptionStatus.CANCELLED;
    await this.subscriptionRepository.save(subscription);

    return { cancelledAt: subscription.cancelledAt };
  }

  async getUsageStats(customerId: string): Promise<UsageStatsDto> {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Get current usage
    const [sitesUsed, storageUsage, bandwidthUsage, aiGenerationsUsage] =
      await Promise.all([
        this.siteRepository.count({ where: { customerId, isActive: true } }),
        this.getUsageByType(customerId, UsageType.STORAGE, currentPeriod),
        this.getUsageByType(customerId, UsageType.BANDWIDTH, currentPeriod),
        this.getUsageByType(customerId, UsageType.AI_GENERATION, currentPeriod),
      ]);

    return {
      sitesUsed,
      sitesLimit: subscription.sitesLimit,
      storageUsedGb: storageUsage / (1024 * 1024 * 1024), // Convert to GB
      storageLimitGb: subscription.storageLimitGb,
      bandwidthUsedGb: bandwidthUsage / (1024 * 1024 * 1024), // Convert to GB
      bandwidthLimitGb: subscription.bandwidthLimitGb,
      aiGenerationsUsed: aiGenerationsUsage,
      aiGenerationLimit: subscription.aiGenerationLimit,
      billingPeriod: currentPeriod,
    };
  }

  async getInvoices(customerId: string): Promise<InvoiceDto[]> {
    // TODO: Integrate with Stripe to get actual invoices
    // For now, return mock data
    return [
      {
        id: 'inv_mock_001',
        amount: 29.99,
        currency: 'usd',
        status: 'paid',
        date: new Date('2024-01-01'),
        dueDate: new Date('2024-01-01'),
        description: 'Professional Plan - January 2024',
        invoiceUrl: 'https://mock-invoice-url.com',
      },
      {
        id: 'inv_mock_002',
        amount: 29.99,
        currency: 'usd',
        status: 'paid',
        date: new Date('2023-12-01'),
        dueDate: new Date('2023-12-01'),
        description: 'Professional Plan - December 2023',
        invoiceUrl: 'https://mock-invoice-url.com',
      },
    ];
  }

  async getPaymentMethods(customerId: string): Promise<any[]> {
    // TODO: Integrate with Stripe to get actual payment methods
    // For now, return mock data
    return [
      {
        id: 'pm_mock_001',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
        },
        isDefault: true,
      },
    ];
  }

  async updatePaymentMethod(
    customerId: string,
    updateDto: UpdatePaymentMethodDto,
  ): Promise<void> {
    // TODO: Integrate with Stripe to update payment method
    console.log(
      `Updating payment method for customer ${customerId}:`,
      updateDto,
    );
  }

  async createBillingPortalSession(customerId: string): Promise<string> {
    // TODO: Integrate with Stripe to create billing portal session
    // For now, return mock URL
    return 'https://billing.stripe.com/session/mock';
  }

  async previewSubscriptionChange(
    customerId: string,
    changeDto: UpgradeSubscriptionDto,
  ): Promise<any> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const plans = await this.getAvailablePlans();
    const newPlan = plans.find((p) => p.plan === changeDto.plan);

    if (!newPlan) {
      throw new BadRequestException('Invalid plan selected');
    }

    // Calculate prorations and pricing
    const currentPrice = subscription.price;
    const newPrice = newPlan.price;
    const daysRemaining = this.getDaysRemaining(subscription.currentPeriodEnd);
    const totalDaysInPeriod =
      changeDto.billingCycle === BillingCycle.MONTHLY ? 30 : 365;

    const proration = (currentPrice * daysRemaining) / totalDaysInPeriod;
    const amountDue = newPrice - proration;

    return {
      currentPlan: subscription.plan,
      newPlan: changeDto.plan,
      currentPrice,
      newPrice,
      proration,
      amountDue: Math.max(0, amountDue),
      effectiveDate: new Date(),
      nextBillingDate: this.calculatePeriodEnd(changeDto.billingCycle),
    };
  }

  private async getUsageByType(
    customerId: string,
    type: UsageType,
    period: string,
  ): Promise<number> {
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.type = :type', { type })
      .andWhere('usage.billingPeriod = :period', { period })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private calculatePeriodEnd(billingCycle: BillingCycle): Date {
    const now = new Date();
    if (billingCycle === BillingCycle.MONTHLY) {
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else {
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    }
  }

  private getDaysRemaining(endDate: Date | undefined): number {
    if (!endDate) return 0;
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
