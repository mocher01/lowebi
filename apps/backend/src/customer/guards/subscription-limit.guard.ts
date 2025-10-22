import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerSubscription } from '../entities/customer-subscription.entity';
import { CustomerSite } from '../entities/customer-site.entity';
import { CustomerUsage, UsageType } from '../entities/customer-usage.entity';

export const SUBSCRIPTION_CHECK_KEY = 'subscriptionCheck';
export const SubscriptionCheck = (
  checkType: 'sites' | 'aiGeneration' | 'customDomain',
) => Reflector.createDecorator<string>({ key: SUBSCRIPTION_CHECK_KEY });

@Injectable()
export class SubscriptionLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(CustomerSubscription)
    private readonly subscriptionRepository: Repository<CustomerSubscription>,
    @InjectRepository(CustomerSite)
    private readonly siteRepository: Repository<CustomerSite>,
    @InjectRepository(CustomerUsage)
    private readonly usageRepository: Repository<CustomerUsage>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const checkType = this.reflector.getAllAndOverride<string>(
      SUBSCRIPTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!checkType) {
      return true; // No check required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { customerId: user.id },
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    switch (checkType) {
      case 'sites':
        return this.checkSiteLimit(user.id, subscription);
      case 'aiGeneration':
        return this.checkAIGenerationLimit(user.id, subscription);
      case 'customDomain':
        return this.checkCustomDomainAllowed(subscription);
      default:
        return true;
    }
  }

  private async checkSiteLimit(
    customerId: string,
    subscription: CustomerSubscription,
  ): Promise<boolean> {
    const currentSiteCount = await this.siteRepository.count({
      where: { customerId, isActive: true },
    });

    if (
      subscription.sitesLimit !== -1 &&
      currentSiteCount >= subscription.sitesLimit
    ) {
      throw new ForbiddenException('Site limit reached for current plan');
    }

    return true;
  }

  private async checkAIGenerationLimit(
    customerId: string,
    subscription: CustomerSubscription,
  ): Promise<boolean> {
    if (subscription.aiGenerationLimit === -1) {
      return true; // Unlimited
    }

    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const result = await this.usageRepository
      .createQueryBuilder('usage')
      .select('SUM(usage.amount)', 'total')
      .where('usage.customerId = :customerId', { customerId })
      .andWhere('usage.type = :type', { type: UsageType.AI_GENERATION })
      .andWhere('usage.billingPeriod = :period', { period: currentPeriod })
      .getRawOne();

    const currentUsage = parseFloat(result.total) || 0;

    if (currentUsage >= subscription.aiGenerationLimit) {
      throw new ForbiddenException(
        'AI generation limit reached for current plan',
      );
    }

    return true;
  }

  private checkCustomDomainAllowed(
    subscription: CustomerSubscription,
  ): boolean {
    if (!subscription.customDomainAllowed) {
      throw new ForbiddenException(
        'Custom domains not allowed in current plan',
      );
    }

    return true;
  }
}
