import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  BillingCycle,
} from '../entities/customer-subscription.entity';

export class SubscriptionPlanDto {
  @ApiProperty({
    example: SubscriptionPlan.PROFESSIONAL,
    enum: SubscriptionPlan,
    description: 'Subscription plan',
  })
  plan: SubscriptionPlan;

  @ApiProperty({
    example: 'Professional Plan',
    description: 'Plan display name',
  })
  name: string;

  @ApiProperty({ example: 29.99, description: 'Plan price' })
  price: number;

  @ApiProperty({
    example: BillingCycle.MONTHLY,
    enum: BillingCycle,
    description: 'Billing cycle',
  })
  billingCycle: BillingCycle;

  @ApiProperty({ example: 10, description: 'Maximum number of sites' })
  sitesLimit: number;

  @ApiProperty({ example: 50, description: 'Storage limit in GB' })
  storageLimitGb: number;

  @ApiProperty({ example: 500, description: 'Bandwidth limit in GB' })
  bandwidthLimitGb: number;

  @ApiProperty({ example: true, description: 'Custom domain allowed' })
  customDomainAllowed: boolean;

  @ApiProperty({ example: 100, description: 'AI generation limit per month' })
  aiGenerationLimit: number;

  @ApiProperty({ example: 'priority', description: 'Support level' })
  supportLevel: string;

  @ApiProperty({
    example: ['Custom domains', 'Priority support', 'Advanced analytics'],
    description: 'Plan features',
  })
  features: string[];
}

export class UpgradeSubscriptionDto {
  @ApiProperty({
    example: SubscriptionPlan.PROFESSIONAL,
    enum: SubscriptionPlan,
    description: 'Target subscription plan',
  })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({
    example: BillingCycle.MONTHLY,
    enum: BillingCycle,
    description: 'Billing cycle',
  })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiPropertyOptional({
    example: 'pm_stripe_payment_method_id',
    description: 'Stripe payment method ID',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class CustomerSubscriptionResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Subscription ID' })
  id: string;

  @ApiProperty({
    example: SubscriptionPlan.PROFESSIONAL,
    enum: SubscriptionPlan,
    description: 'Current plan',
  })
  plan: SubscriptionPlan;

  @ApiProperty({ example: 'active', description: 'Subscription status' })
  status: string;

  @ApiProperty({
    example: BillingCycle.MONTHLY,
    enum: BillingCycle,
    description: 'Billing cycle',
  })
  billingCycle: BillingCycle;

  @ApiProperty({ example: 29.99, description: 'Current price' })
  price: number;

  @ApiProperty({ example: 10, description: 'Sites limit' })
  sitesLimit: number;

  @ApiProperty({ example: 50, description: 'Storage limit in GB' })
  storageLimitGb: number;

  @ApiProperty({ example: 500, description: 'Bandwidth limit in GB' })
  bandwidthLimitGb: number;

  @ApiProperty({ example: true, description: 'Custom domain allowed' })
  customDomainAllowed: boolean;

  @ApiProperty({ example: 100, description: 'AI generation limit' })
  aiGenerationLimit: number;

  @ApiProperty({ example: 'priority', description: 'Support level' })
  supportLevel: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Current period start',
  })
  currentPeriodStart?: Date;

  @ApiProperty({
    example: '2024-02-01T00:00:00Z',
    description: 'Current period end',
  })
  currentPeriodEnd?: Date;

  @ApiProperty({
    example: '2024-01-08T00:00:00Z',
    description: 'Trial end date',
  })
  trialEnd?: Date;
}

export class UsageStatsDto {
  @ApiProperty({ example: 3, description: 'Current number of sites' })
  sitesUsed: number;

  @ApiProperty({ example: 10, description: 'Sites limit' })
  sitesLimit: number;

  @ApiProperty({ example: 15.5, description: 'Storage used in GB' })
  storageUsedGb: number;

  @ApiProperty({ example: 50, description: 'Storage limit in GB' })
  storageLimitGb: number;

  @ApiProperty({
    example: 125.7,
    description: 'Bandwidth used this month in GB',
  })
  bandwidthUsedGb: number;

  @ApiProperty({ example: 500, description: 'Bandwidth limit in GB' })
  bandwidthLimitGb: number;

  @ApiProperty({ example: 25, description: 'AI generations used this month' })
  aiGenerationsUsed: number;

  @ApiProperty({ example: 100, description: 'AI generation limit' })
  aiGenerationLimit: number;

  @ApiProperty({ example: '2024-01', description: 'Current billing period' })
  billingPeriod: string;
}

export class InvoiceDto {
  @ApiProperty({ example: 'inv_stripe_invoice_id', description: 'Invoice ID' })
  id: string;

  @ApiProperty({ example: 29.99, description: 'Invoice amount' })
  amount: number;

  @ApiProperty({ example: 'usd', description: 'Currency' })
  currency: string;

  @ApiProperty({ example: 'paid', description: 'Invoice status' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Invoice date' })
  date: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Due date' })
  dueDate: Date;

  @ApiProperty({
    example: 'https://invoice-url.stripe.com',
    description: 'Invoice PDF URL',
  })
  invoiceUrl?: string;

  @ApiProperty({
    example: 'Professional Plan - January 2024',
    description: 'Invoice description',
  })
  description: string;
}

export class UpdatePaymentMethodDto {
  @ApiProperty({
    example: 'pm_stripe_payment_method_id',
    description: 'Stripe payment method ID',
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Set as default payment method',
  })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}
