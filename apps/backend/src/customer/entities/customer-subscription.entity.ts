import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('customer_subscriptions')
export class CustomerSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'simple-enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'simple-enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'sites_limit', default: 1 })
  sitesLimit: number;

  @Column({ name: 'storage_limit_gb', default: 1 })
  storageLimitGb: number;

  @Column({ name: 'bandwidth_limit_gb', default: 10 })
  bandwidthLimitGb: number;

  @Column({ name: 'custom_domain_allowed', default: false })
  customDomainAllowed: boolean;

  @Column({ name: 'ai_generation_limit', default: 10 })
  aiGenerationLimit: number;

  @Column({ name: 'support_level', default: 'basic' })
  supportLevel: string;

  @Column({ name: 'stripe_subscription_id', nullable: true })
  stripeSubscriptionId?: string;

  @Column({ name: 'stripe_customer_id', nullable: true })
  stripeCustomerId?: string;

  @Column({ name: 'current_period_start', nullable: true })
  currentPeriodStart?: Date;

  @Column({ name: 'current_period_end', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ name: 'trial_end', nullable: true })
  trialEnd?: Date;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isTrialing(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  get hasExpired(): boolean {
    return !!(this.currentPeriodEnd && new Date() > this.currentPeriodEnd);
  }

  constructor(partial: Partial<CustomerSubscription>) {
    Object.assign(this, partial);
  }
}
